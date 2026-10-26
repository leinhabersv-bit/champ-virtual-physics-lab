import { ISimulationEngine, ValidationResult } from '../types/simulation';
import { CONSTANTS } from '../utils/units';

export const OFFICIAL_RESISTANCE_SEQUENCE_KOHM = [
  0.1, 0.22, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0,
] as const;

export const OFFICIAL_RESISTANCE_SEQUENCE_OHM = OFFICIAL_RESISTANCE_SEQUENCE_KOHM.map(
  (k) => Math.round(k * 1000)
);

export interface SolarCellParams {
  distance: number; // meters from light source (e.g. 0.12m to 1.0m)
  lampPower: number; // Watts (5W as per manual)
  cellArea: number; // m^2 (default 0.0025 m^2 = 25 cm^2)
  loadResistance: number; // Ohms (e.g. 100 to 10000)
  circuitTopology: 'single' | 'series' | 'parallel';
  panelCount: number; // 3 panels as per manual
  spectralCalibrationFactor_W_per_m2_per_lux?: number; // justified calibration factor
  temperatureK?: number;
}

export interface SolarCellReadings {
  voltage: number; // Volts
  current_mA: number; // Milliamperes
  power_W: number; // True SI Watts: V * (I_mA / 1000)
  power_mW: number; // Milliwatts for pedagogical clarity
  lux: number; // Photometric illuminance in lux (lumen/m^2)
  incidentRadiation_W_per_m2: number; // Radiometric irradiance Io in W/m^2 (calibrated)
  openCircuitVoltage_Voc: number; // Volts
  shortCircuitCurrent_Isc_mA: number; // mA
  isCalibratedIrradiance: boolean;
}

export interface SolarCellDerived {
  pMax_W: number; // Watts
  pMax_mW: number; // mW
  vMax_V: number; // Volts
  iMax_mA: number; // mA
  fillFactor: number; // Dimensionless: Pmax / (Voc * Isc)
  efficiencyPercent: number | null; // %: 100 * Pmax / (A * Io), guarded if Io <= 0
  matchedResistance_ohm: number; // Vmax / Imax
}

export interface TableRowData {
  slNo: number;
  resistance_kohm: number;
  resistance_ohm: number;
  current_mA: number;
  voltage_V: number;
  power_W: number;
  power_mW: number;
}

export interface ObservationTableDataset {
  tableNumber: 1 | 2 | 3 | 4;
  title: string;
  configuration: 'single' | 'series' | 'parallel';
  distance_m: number;
  area_m2: number;
  voc_V: number;
  isc_mA: number;
  lux: number;
  intensity_Io_W_per_m2: number;
  rows: TableRowData[];
  pMax_W: number;
  vMax_V: number;
  iMax_mA: number;
  fillFactor: number;
  efficiencyPercent: number;
}

export class SolarCellEngine implements ISimulationEngine<SolarCellParams, SolarCellReadings, SolarCellDerived> {
  readonly experimentId = 'expt-1-solar-cell';

  // Standard laboratory calibration factor: ~0.0125 W/(m²·lux) for directional 5W warm-white bench lamp
  readonly DEFAULT_SPECTRAL_CALIBRATION = 0.0125;

  readonly defaultParams: SolarCellParams = {
    distance: 0.25, // 25 cm (Table 1 default)
    lampPower: 5.0, // 5W source
    cellArea: 0.0025, // 25 cm^2
    loadResistance: 1000, // 1 kOhm
    circuitTopology: 'single',
    panelCount: 3,
    spectralCalibrationFactor_W_per_m2_per_lux: 0.0125,
    temperatureK: 300,
  };

  validateParams(params: SolarCellParams): ValidationResult {
    const errors: string[] = [];
    if (params.distance <= 0) errors.push('Distance must be strictly positive.');
    if (params.lampPower <= 0) errors.push('Lamp power must be strictly positive.');
    if (params.cellArea <= 0) errors.push('Cell area must be strictly positive.');
    if (params.loadResistance < 0) errors.push('Load resistance cannot be negative.');
    return { isValid: errors.length === 0, errors };
  }

  // Radiometric & Photometric optical decay model
  public getOptics(distance: number, lampPower: number, calibFactor = this.DEFAULT_SPECTRAL_CALIBRATION) {
    const directionalGain = 3.6;
    const r = Math.max(0.04, distance);
    // True radiometric flux from 5W source with reflector
    const radiometricIrradiance_W_m2 = (lampPower * directionalGain) / (4 * Math.PI * r * r);
    // Photometric illuminance in Lux (lumen/m^2)
    const luminousEfficacy = 85; // lm/W
    const lux = radiometricIrradiance_W_m2 * luminousEfficacy;

    // Calibrated Io derived from lux using verified spectral factor
    const calibratedIo = lux * calibFactor;

    return {
      radiometricIrradiance_W_m2,
      lux: Math.round(lux),
      calibratedIo: Number(calibratedIo.toFixed(2)),
    };
  }

  // Single cell intrinsic diode physics
  private getSingleCellDiode(intensity_W_m2: number, T = 300) {
    const standardSun = 1000;
    const sunRatio = Math.max(0.001, intensity_W_m2 / standardSun);
    // 5 series sub-cells per mini panel unit
    const I_sc_base = 0.42 * sunRatio;
    const V_th = (CONSTANTS.k_B * T) / CONSTANTS.e;
    const ideality = 1.35;
    const nVth = ideality * V_th * 5;
    const I_0 = 2e-9;
    const V_oc_base = nVth * Math.log(Math.max(1, I_sc_base / I_0 + 1));

    return { I_sc: I_sc_base, V_oc: V_oc_base, nVth, I_0 };
  }

  calculateReadings(params: SolarCellParams): SolarCellReadings {
    const calib = params.spectralCalibrationFactor_W_per_m2_per_lux ?? this.DEFAULT_SPECTRAL_CALIBRATION;
    const { lux, calibratedIo } = this.getOptics(params.distance, params.lampPower, calib);
    const base = this.getSingleCellDiode(calibratedIo, params.temperatureK);

    let effectiveVoc = base.V_oc;
    let effectiveIsc = base.I_sc;
    let effectiveNVth = base.nVth;

    if (params.circuitTopology === 'series') {
      effectiveVoc *= params.panelCount;
      effectiveNVth *= params.panelCount;
    } else if (params.circuitTopology === 'parallel') {
      effectiveIsc *= params.panelCount;
    }

    const R_L = params.loadResistance;
    let vOperating = 0;

    if (R_L <= 0.05) {
      // Short circuit
      vOperating = 0;
    } else if (R_L >= 1e7) {
      // Open circuit
      vOperating = effectiveVoc;
    } else {
      // High-precision bisection solver: f(V) = V/R_L + I0*(exp(V/nVth)-1) - Isc = 0
      let vLow = 0;
      let vHigh = effectiveVoc;
      for (let i = 0; i < 30; i++) {
        const vMid = (vLow + vHigh) / 2;
        const currentGen = effectiveIsc - base.I_0 * (Math.exp(Math.min(70, vMid / effectiveNVth)) - 1);
        const currentLoad = vMid / R_L;
        if (currentGen > currentLoad) {
          vLow = vMid;
        } else {
          vHigh = vMid;
        }
      }
      vOperating = (vLow + vHigh) / 2;
    }

    const current_A = R_L > 0.05 ? vOperating / R_L : effectiveIsc;
    const power_W = vOperating * current_A;

    return {
      voltage: Math.max(0, Number(vOperating.toFixed(4))),
      current_mA: Math.max(0, Number((current_A * 1000).toFixed(3))),
      power_W: Math.max(0, Number(power_W.toFixed(6))),
      power_mW: Math.max(0, Number((power_W * 1000).toFixed(3))),
      lux,
      incidentRadiation_W_per_m2: calibratedIo,
      openCircuitVoltage_Voc: Number(effectiveVoc.toFixed(3)),
      shortCircuitCurrent_Isc_mA: Number((effectiveIsc * 1000).toFixed(2)),
      isCalibratedIrradiance: calib > 0,
    };
  }

  computeDerived(readings: SolarCellReadings, params: SolarCellParams): SolarCellDerived {
    const curve = this.generateModelCurve(params, 120);
    let pMax_W = 0;
    let vMax_V = 0;
    let iMax_mA = 0;

    for (const pt of curve) {
      const v = pt.x;
      const i_A = pt.y / 1000;
      const p = v * i_A;
      if (p > pMax_W) {
        pMax_W = p;
        vMax_V = v;
        iMax_mA = pt.y;
      }
    }

    const voc = readings.openCircuitVoltage_Voc;
    const isc_A = readings.shortCircuitCurrent_Isc_mA / 1000;
    const denom = voc * isc_A;
    // Zero-denominator guard for Fill Factor
    const fillFactor = denom > 1e-9 ? pMax_W / denom : 0;

    // Zero-denominator guard for Efficiency: requires strictly positive Area and calibrated Io
    const totalIncidentOpticalPower = params.cellArea * readings.incidentRadiation_W_per_m2;
    const efficiency =
      totalIncidentOpticalPower > 1e-6 && readings.isCalibratedIrradiance
        ? (pMax_W / totalIncidentOpticalPower) * 100
        : null;

    const matchedR = iMax_mA > 0 ? (vMax_V / (iMax_mA / 1000)) : 0;

    return {
      pMax_W: Number(pMax_W.toFixed(5)),
      pMax_mW: Number((pMax_W * 1000).toFixed(2)),
      vMax_V: Number(vMax_V.toFixed(3)),
      iMax_mA: Number(iMax_mA.toFixed(2)),
      fillFactor: Number(fillFactor.toFixed(3)),
      efficiencyPercent: efficiency !== null ? Number(efficiency.toFixed(2)) : null,
      matchedResistance_ohm: Math.round(matchedR),
    };
  }

  generateModelCurve(params: SolarCellParams, sampleCount = 60): Array<{ x: number; y: number; label?: string }> {
    const calib = params.spectralCalibrationFactor_W_per_m2_per_lux ?? this.DEFAULT_SPECTRAL_CALIBRATION;
    const { calibratedIo } = this.getOptics(params.distance, params.lampPower, calib);
    const base = this.getSingleCellDiode(calibratedIo, params.temperatureK);

    let effectiveVoc = base.V_oc;
    let effectiveIsc = base.I_sc;
    let effectiveNVth = base.nVth;

    if (params.circuitTopology === 'series') {
      effectiveVoc *= params.panelCount;
      effectiveNVth *= params.panelCount;
    } else if (params.circuitTopology === 'parallel') {
      effectiveIsc *= params.panelCount;
    }

    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= sampleCount; i++) {
      const v = (effectiveVoc * i) / sampleCount;
      const i_A = Math.max(0, effectiveIsc - base.I_0 * (Math.exp(Math.min(70, v / effectiveNVth)) - 1));
      points.push({
        x: Number(v.toFixed(3)),
        y: Number((i_A * 1000).toFixed(2)),
      });
    }
    return points;
  }

  // Generates complete 13-row dataset for any of the 4 manual tables
  public generateFullObservationTable(
    tableNum: 1 | 2 | 3 | 4,
    distance_m: number,
    topology: 'single' | 'series' | 'parallel'
  ): ObservationTableDataset {
    const cellArea = 0.0025; // 25 cm^2
    const baseParams: SolarCellParams = {
      distance: distance_m,
      lampPower: 5.0,
      cellArea,
      loadResistance: 1000,
      circuitTopology: topology,
      panelCount: 3,
    };

    const vocReading = this.calculateReadings({ ...baseParams, loadResistance: 1e8 });
    const iscReading = this.calculateReadings({ ...baseParams, loadResistance: 0 });
    const derived = this.computeDerived(vocReading, baseParams);

    const titles: Record<number, string> = {
      1: 'Table 1: Single Cell I-V Characteristics (Distance 1)',
      2: 'Table 2: Single Cell I-V Characteristics (Least Distance)',
      3: 'Table 3: Series Configuration (3 Panels)',
      4: 'Table 4: Parallel Configuration (3 Panels)',
    };

    const rows: TableRowData[] = OFFICIAL_RESISTANCE_SEQUENCE_KOHM.map((rKohm, idx) => {
      const rOhm = Math.round(rKohm * 1000);
      const res = this.calculateReadings({ ...baseParams, loadResistance: rOhm });
      return {
        slNo: idx + 1,
        resistance_kohm: rKohm,
        resistance_ohm: rOhm,
        current_mA: res.current_mA,
        voltage_V: res.voltage,
        power_W: res.power_W,
        power_mW: res.power_mW,
      };
    });

    return {
      tableNumber: tableNum,
      title: titles[tableNum],
      configuration: topology,
      distance_m,
      area_m2: cellArea,
      voc_V: vocReading.openCircuitVoltage_Voc,
      isc_mA: iscReading.shortCircuitCurrent_Isc_mA,
      lux: vocReading.lux,
      intensity_Io_W_per_m2: vocReading.incidentRadiation_W_per_m2,
      rows,
      pMax_W: derived.pMax_W,
      vMax_V: derived.vMax_V,
      iMax_mA: derived.iMax_mA,
      fillFactor: derived.fillFactor,
      efficiencyPercent: derived.efficiencyPercent ?? 0,
    };
  }
}

export const solarCellEngine = new SolarCellEngine();
