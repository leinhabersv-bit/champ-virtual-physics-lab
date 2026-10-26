import { ISimulationEngine, ValidationResult } from '../types/simulation';
import { CONSTANTS } from '../utils/units';

export interface SolarCellParams {
  distance: number; // meters from light source (0.1 to 1.0 m)
  lampPower: number; // Watts (default 5W as per manual)
  cellArea: number; // m^2 (default 0.0025 m^2 = 25 cm^2)
  loadResistance: number; // Ohms (e.g. 100 to 10000)
  circuitTopology: 'single' | 'series' | 'parallel';
  panelCount: number; // default 3 for series/parallel
  temperatureK?: number;
}

export interface SolarCellReadings {
  voltage: number; // Volts
  current_mA: number; // Milliamperes
  power_W: number; // Watts
  lux: number; // Illuminance in lux (lumen/m^2)
  incidentRadiation_W_per_m2: number; // Io in W/m^2
  openCircuitVoltage_Voc: number; // Volts
  shortCircuitCurrent_Isc_mA: number; // mA
}

export interface SolarCellDerived {
  pMax_W: number; // Watts
  vMax_V: number; // Volts
  iMax_mA: number; // mA
  fillFactor: number; // Dimensionless (0 to 1)
  efficiencyPercent: number; // %
}

export class SolarCellEngine implements ISimulationEngine<SolarCellParams, SolarCellReadings, SolarCellDerived> {
  readonly experimentId = 'expt-1-solar-cell';

  readonly defaultParams: SolarCellParams = {
    distance: 0.20, // 20 cm
    lampPower: 5.0, // 5W source as specified in manual
    cellArea: 0.0025, // 25 cm^2
    loadResistance: 1000, // 1 kOhm
    circuitTopology: 'single',
    panelCount: 3,
    temperatureK: 300,
  };

  validateParams(params: SolarCellParams): ValidationResult {
    const errors: string[] = [];
    if (params.distance <= 0) errors.push('Distance must be greater than zero.');
    if (params.lampPower <= 0) errors.push('Lamp power must be greater than zero.');
    if (params.cellArea <= 0) errors.push('Cell area must be greater than zero.');
    if (params.loadResistance < 0) errors.push('Load resistance cannot be negative.');
    return { isValid: errors.length === 0, errors };
  }

  // Inverse-square optical model
  private getOptics(distance: number, lampPower: number) {
    // Optical efficiency factor for directional reflector
    const luminousEfficacy = 80; // lumens/watt for standard LED/incandescent bench lamp
    const solidAngleConcentration = 3.5; // directional reflector gain
    const intensity_W_m2 = (lampPower * solidAngleConcentration) / (4 * Math.PI * Math.max(0.05, distance) ** 2);
    const lux = intensity_W_m2 * luminousEfficacy;
    return { intensity_W_m2, lux };
  }

  // Base single cell parameters
  private getSingleCellIV(intensity_W_m2: number, T = 300) {
    const standardSun = 1000; // W/m^2
    const sunRatio = intensity_W_m2 / standardSun;
    // Calibrated for 5-cell series mini-panel kit: ~14.5mA at 20cm
    const I_sc_base = 0.42 * sunRatio; // Amperes short-circuit for unit panel
    const V_th = (CONSTANTS.k_B * T) / CONSTANTS.e; // ~0.0259 V
    const ideality = 1.35;
    const nVth = ideality * V_th * 5; // 5 series sub-cells per lab panel
    const I_0 = 2e-9; // Reverse saturation current
    const V_oc_base = nVth * Math.log(Math.max(1, I_sc_base / I_0 + 1));

    return { I_sc: I_sc_base, V_oc: V_oc_base, nVth, I_0 };
  }

  calculateReadings(params: SolarCellParams): SolarCellReadings {
    const { intensity_W_m2, lux } = this.getOptics(params.distance, params.lampPower);
    const base = this.getSingleCellIV(intensity_W_m2, params.temperatureK);

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

    // Numerical solve for operating voltage V where: I = (I_sc - I_0 * (exp(V/nVth) - 1)) and V = I * R_L
    // i.e., f(V) = V/R_L + I_0 * exp(V/nVth) - (I_sc + I_0) = 0
    let vLow = 0;
    let vHigh = effectiveVoc;
    let vOperating = 0;

    if (R_L <= 0.001) {
      // Short circuit
      vOperating = 0;
    } else if (R_L >= 1e7) {
      // Open circuit
      vOperating = effectiveVoc;
    } else {
      // Bisection solve (deterministic, 25 iterations guarantees sub-microvolt precision)
      for (let iter = 0; iter < 28; iter++) {
        const vMid = (vLow + vHigh) / 2;
        const currentGenerated = effectiveIsc - base.I_0 * (Math.exp(Math.min(70, vMid / effectiveNVth)) - 1);
        const currentLoad = vMid / R_L;
        if (currentGenerated > currentLoad) {
          vLow = vMid;
        } else {
          vHigh = vMid;
        }
      }
      vOperating = (vLow + vHigh) / 2;
    }

    const current_A = R_L > 0.001 ? vOperating / R_L : effectiveIsc;
    const power_W = vOperating * current_A;

    return {
      voltage: Math.max(0, vOperating),
      current_mA: Math.max(0, current_A * 1000),
      power_W: Math.max(0, power_W),
      lux: Math.round(lux),
      incidentRadiation_W_per_m2: Number(intensity_W_m2.toFixed(2)),
      openCircuitVoltage_Voc: Number(effectiveVoc.toFixed(3)),
      shortCircuitCurrent_Isc_mA: Number((effectiveIsc * 1000).toFixed(2)),
    };
  }

  computeDerived(readings: SolarCellReadings, params: SolarCellParams): SolarCellDerived {
    // Generate I-V curve to determine Pmax accurately
    const curve = this.generateModelCurve(params, 100);
    let pMax = 0;
    let vMax = 0;
    let iMax_mA = 0;

    for (const pt of curve) {
      const v = pt.x;
      const i_A = pt.y / 1000;
      const p = v * i_A;
      if (p > pMax) {
        pMax = p;
        vMax = v;
        iMax_mA = pt.y;
      }
    }

    const voc = readings.openCircuitVoltage_Voc;
    const isc_A = readings.shortCircuitCurrent_Isc_mA / 1000;
    const denom = voc * isc_A;
    const fillFactor = denom > 0 ? pMax / denom : 0;

    const totalIncidentOpticalPower = params.cellArea * readings.incidentRadiation_W_per_m2;
    const efficiency = totalIncidentOpticalPower > 0 ? (pMax / totalIncidentOpticalPower) * 100 : 0;

    return {
      pMax_W: Number(pMax.toFixed(5)),
      vMax_V: Number(vMax.toFixed(3)),
      iMax_mA: Number(iMax_mA.toFixed(2)),
      fillFactor: Number(fillFactor.toFixed(3)),
      efficiencyPercent: Number(efficiency.toFixed(2)),
    };
  }

  generateModelCurve(params: SolarCellParams, sampleCount = 60): Array<{ x: number; y: number; label?: string }> {
    const { intensity_W_m2 } = this.getOptics(params.distance, params.lampPower);
    const base = this.getSingleCellIV(intensity_W_m2, params.temperatureK);

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
        y: Number((i_A * 1000).toFixed(2)), // in mA for easy chart reading
      });
    }
    return points;
  }
}

export const solarCellEngine = new SolarCellEngine();
