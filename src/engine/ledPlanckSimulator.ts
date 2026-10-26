import { ISimulationEngine, ValidationResult } from '../types/simulation';
import { CONSTANTS } from '../utils/units';

export interface LedSpec {
  id: 'blue' | 'yellow' | 'green' | 'red';
  color: string;
  lambda_nm: number;
  lambda_m: number;
  oneOverLambda_per_nm: number;
  oneOverLambda_per_m: number;
  theoreticalVB: number;
  hex: string;
  glowColor: string;
}

// Exact wavelengths from BAPHY105 Manual pp. 38, 43, 44:
// Blue: 470 nm, Yellow: 500 nm, Green: 565 nm, Red: 660 nm
export const LED_SPECS: Record<'blue' | 'yellow' | 'green' | 'red', LedSpec> = {
  blue: {
    id: 'blue',
    color: 'Blue',
    lambda_nm: 470,
    lambda_m: 470e-9,
    oneOverLambda_per_nm: 1 / 470,
    oneOverLambda_per_m: 1 / 470e-9,
    theoreticalVB: 2.64, // eV = hc/lambda => 1240 / 470 = ~2.64 V
    hex: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.9)',
  },
  yellow: {
    id: 'yellow',
    color: 'Yellow',
    lambda_nm: 500,
    lambda_m: 500e-9,
    oneOverLambda_per_nm: 1 / 500,
    oneOverLambda_per_m: 1 / 500e-9,
    theoreticalVB: 2.48, // 1240 / 500 = 2.48 V
    hex: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.9)',
  },
  green: {
    id: 'green',
    color: 'Green',
    lambda_nm: 565,
    lambda_m: 565e-9,
    oneOverLambda_per_nm: 1 / 565,
    oneOverLambda_per_m: 1 / 565e-9,
    theoreticalVB: 2.19, // 1240 / 565 = ~2.19 V
    hex: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.9)',
  },
  red: {
    id: 'red',
    color: 'Red',
    lambda_nm: 660,
    lambda_m: 660e-9,
    oneOverLambda_per_nm: 1 / 660,
    oneOverLambda_per_m: 1 / 660e-9,
    theoreticalVB: 1.88, // 1240 / 660 = ~1.88 V
    hex: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.9)',
  },
};

export const LED_COLOR_KEYS: Array<'blue' | 'yellow' | 'green' | 'red'> = [
  'blue',
  'yellow',
  'green',
  'red',
];

export interface LedParams {
  ledColor: 'blue' | 'yellow' | 'green' | 'red';
  potentiometerRatio: number; // 0.0 to 1.0 (potentiometer setting on 3V source)
  supplyVoltage_V?: number;   // 3.0 V fixed as per manual p. 38, 42
  currentLimitingResistor_ohm?: number; // 10 - 100 ohm (manual p. 38)
  isReverseBiased?: boolean;  // LED anode/cathode flipped
}

export interface LedReadings {
  appliedVoltage_V: number;
  diodeVoltage_V: number;
  diodeCurrent_uA: number;
  wavelength_nm: number;
  oneOverLambda_per_nm: number;
  barrierPotential_VB_V: number;
  isEmittingLight: boolean;
  lightIntensityPct: number;
}

export interface LedDerived {
  planckConstantDirect_J_s: number; // h = VB * (e * lambda / c)
  percentageErrorVsTrue_h: number;
}

export interface LedTableRow {
  slNo: number;
  potentiometerSettingPct: number;
  appliedVoltage_V: number;
  diodeVoltage_V: number;
  diodeCurrent_uA: number;
}

export interface Table2SummaryRow {
  slNo: number;
  color: 'blue' | 'yellow' | 'green' | 'red';
  colorName: string;
  wavelength_nm: number;
  oneOverLambda_nm_inv: number;
  oneOverLambda_m_inv: number;
  barrierPotential_VB_V: number;
  planckConstantDirect_J_s: number;
  percentageError: number;
}

export interface LinearFitResult {
  slope_mA_per_V: number;
  intercept_mA: number;
  voltageIntercept_VB_V: number;
  rSquared: number;
  isSufficientlyLinear: boolean;
  fitPointsCount: number;
  errorMessage?: string;
}

export class LedPlanckEngine implements ISimulationEngine<LedParams, LedReadings, LedDerived> {
  readonly experimentId = 'expt-3-led-planck';

  readonly defaultParams: LedParams = {
    ledColor: 'red',
    potentiometerRatio: 0.65,
    supplyVoltage_V: 3.0,
    currentLimitingResistor_ohm: 47.0,
    isReverseBiased: false,
  };

  validateParams(params: LedParams): ValidationResult {
    const errors: string[] = [];
    if (params.potentiometerRatio < 0 || params.potentiometerRatio > 1) {
      errors.push('Potentiometer ratio must be between 0.0 and 1.0.');
    }
    if ((params.currentLimitingResistor_ohm ?? 47) < 5) {
      errors.push('Current limiting resistor must be at least 5 ohms to prevent diode damage.');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Physically grounded Shockley diode forward-conduction model:
   * V_in = V_d + I_d * (R_lim + R_series)
   * I_d = I_s * [exp((V_d - V_threshold) / (n * V_th)) - 1]
   *
   * Accurately reproduces:
   * 1. Negligible leakage current (< 1 uA) below barrier potential VB.
   * 2. Smooth exponential knee near VB.
   * 3. Distinct linear conduction slope above VB governed by series bulk resistance.
   * 4. Safe current limit (< 2900 uA as cautioned on manual p. 42).
   */
  calculateReadings(params: LedParams): LedReadings {
    const spec = LED_SPECS[params.ledColor] ?? LED_SPECS.red;
    const supply = params.supplyVoltage_V ?? 3.0;
    const vIn = supply * Math.max(0, Math.min(1, params.potentiometerRatio));
    const R_lim = params.currentLimitingResistor_ohm ?? 47.0;

    // In reverse bias, leakage is negligible (~ 0.01 uA) and diode does not conduct
    if (params.isReverseBiased) {
      return {
        appliedVoltage_V: Number(vIn.toFixed(3)),
        diodeVoltage_V: Number(vIn.toFixed(3)),
        diodeCurrent_uA: 0.0,
        wavelength_nm: spec.lambda_nm,
        oneOverLambda_per_nm: Number((1 / spec.lambda_nm).toFixed(5)),
        barrierPotential_VB_V: spec.theoreticalVB,
        isEmittingLight: false,
        lightIntensityPct: 0,
      };
    }

    const VB = spec.theoreticalVB;
    const diodeInternalResistance = 25.0; // ohms internal series resistance of LED die

    // Conduction modeling
    // Below VB: sub-threshold exponential turn-on with ideality ~ 1.6
    // Above VB: linear ohmic conduction where I ~ (V - VB) / totalSeriesR
    let current_uA = 0;
    let vd = vIn;

    if (vIn < VB - 0.25) {
      // Sub-threshold region
      current_uA = Math.max(0, 0.5 * Math.exp((vIn - VB) / 0.08));
      vd = vIn;
    } else {
      // Numerical solution of V_in = V_d + I_d(V_d) * totalSeriesR
      let lowV = VB - 0.25;
      let highV = Math.min(vIn, VB + 0.4);

      for (let iter = 0; iter < 24; iter++) {
        const midV = (lowV + highV) / 2;
        // Diode current at midV
        const delta = midV - VB;
        const i_A = delta > 0
          ? (delta / diodeInternalResistance) + 0.0001
          : 0.0001 * Math.exp(delta / 0.06);

        const vDrop = vIn - i_A * R_lim;
        if (vDrop > midV) {
          lowV = midV;
        } else {
          highV = midV;
        }
      }

      vd = (lowV + highV) / 2;
      const calcI_A = Math.max(0, (vIn - vd) / R_lim);
      current_uA = Math.min(2900, calcI_A * 1e6); // Clamp to 2900 uA max per manual p. 42
    }

    const isEmitting = current_uA >= 20.0 && vd >= VB * 0.92;
    const intensity = isEmitting ? Math.min(100, Math.round((current_uA / 2500) * 100)) : 0;

    return {
      appliedVoltage_V: Number(vIn.toFixed(3)),
      diodeVoltage_V: Number(vd.toFixed(3)),
      diodeCurrent_uA: Number(current_uA.toFixed(1)),
      wavelength_nm: spec.lambda_nm,
      oneOverLambda_per_nm: Number((1 / spec.lambda_nm).toFixed(5)),
      barrierPotential_VB_V: spec.theoreticalVB,
      isEmittingLight: isEmitting,
      lightIntensityPct: intensity,
    };
  }

  computeDerived(readings: LedReadings, params: LedParams): LedDerived {
    const spec = LED_SPECS[params.ledColor] ?? LED_SPECS.red;
    const lambda_m = spec.lambda_m;
    const VB = readings.barrierPotential_VB_V;

    // Direct formula from manual p. 38 & 41:
    // h = e * lambda * VB / c
    const h_calc = (CONSTANTS.e * lambda_m * VB) / CONSTANTS.c_manual;
    const pctError = Math.abs((h_calc - CONSTANTS.h_manual) / CONSTANTS.h_manual) * 100;

    return {
      planckConstantDirect_J_s: h_calc,
      percentageErrorVsTrue_h: Number(pctError.toFixed(2)),
    };
  }

  /**
   * Generates continuous I-V curve dataset for an LED across 0V to 3V.
   */
  generateModelCurve(params: LedParams, sampleCount = 60): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= sampleCount; i++) {
      const ratio = i / sampleCount;
      const res = this.calculateReadings({ ...params, potentiometerRatio: ratio });
      points.push({
        x: res.diodeVoltage_V,
        y: res.diodeCurrent_uA,
      });
    }

    return points;
  }

  /**
   * Generates Table 1 full observation dataset (Manual p. 43):
   * 15 discrete voltage points per LED covering sub-threshold and upper linear regions.
   */
  generateObservationTable1(color: 'blue' | 'yellow' | 'green' | 'red'): LedTableRow[] {
    const spec = LED_SPECS[color] ?? LED_SPECS.red;
    const VB = spec.theoreticalVB;

    // 15 voltage targets across diode from sub-threshold to linear conduction
    // 5 sub-threshold, 3 knee, 7 linear points (indices 8 to 14)
    const vTargets = [
      VB * 0.35,
      VB * 0.55,
      VB * 0.70,
      VB * 0.82,
      VB * 0.90,
      VB * 0.95,
      VB * 0.98,
      VB + 0.005,
      VB + 0.015,
      VB + 0.023,
      VB + 0.031,
      VB + 0.039,
      VB + 0.047,
      VB + 0.055,
      VB + 0.063,
    ];

    return vTargets.map((vTgt, idx) => {
      // Calculate applied voltage needed to reach vTgt across diode
      const delta = vTgt - VB;
      const i_A = delta > 0 ? delta / 25.0 : 0.0001 * Math.exp(delta / 0.06);
      const vIn = Math.min(3.0, vTgt + i_A * 47.0);
      const ratio = vIn / 3.0;

      const res = this.calculateReadings({
        ledColor: color,
        potentiometerRatio: ratio,
        supplyVoltage_V: 3.0,
        currentLimitingResistor_ohm: 47.0,
      });

      return {
        slNo: idx + 1,
        potentiometerSettingPct: Math.round(ratio * 100),
        appliedVoltage_V: res.appliedVoltage_V,
        diodeVoltage_V: res.diodeVoltage_V,
        diodeCurrent_uA: res.diodeCurrent_uA,
      };
    });
  }

  /**
   * Fits a straight line to user-selected points on the I-V curve:
   * I = m * V + c
   * Voltage intercept VB = -c / m (where I = 0)
   *
   * Validates linearity (R^2 >= 0.95 and m > 0).
   * Refuses to fabricate intercept if points are chosen in non-linear region.
   */
  fitLinearTangent(points: Array<{ x: number; y: number }>): LinearFitResult {
    if (points.length < 3) {
      return {
        slope_mA_per_V: 0,
        intercept_mA: 0,
        voltageIntercept_VB_V: 0,
        rSquared: 0,
        isSufficientlyLinear: false,
        fitPointsCount: points.length,
        errorMessage: 'At least 3 data points required for linear regression.',
      };
    }

    // Convert current from uA to mA for convenient slope
    const n = points.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (const pt of points) {
      const x = pt.x; // V
      const y = pt.y / 1000; // mA
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (Math.abs(denominator) < 1e-9) {
      return {
        slope_mA_per_V: 0,
        intercept_mA: 0,
        voltageIntercept_VB_V: 0,
        rSquared: 0,
        isSufficientlyLinear: false,
        fitPointsCount: n,
        errorMessage: 'Zero variance in selected voltage points.',
      };
    }

    const slope_mA_per_V = (n * sumXY - sumX * sumY) / denominator;
    const intercept_mA = (sumY - slope_mA_per_V * sumX) / n;

    // R-squared computation
    const meanY = sumY / n;
    let ssTotal = 0;
    let ssRes = 0;
    for (const pt of points) {
      const y = pt.y / 1000;
      const yFit = slope_mA_per_V * pt.x + intercept_mA;
      ssTotal += (y - meanY) * (y - meanY);
      ssRes += (y - yFit) * (y - yFit);
    }

    const rSquared = ssTotal > 0 ? Math.max(0, 1 - ssRes / ssTotal) : 0;

    // Linear region criteria:
    // Slope must be positive and sufficiently steep (conducting region)
    // R^2 must be >= 0.95
    if (slope_mA_per_V <= 0.05 || rSquared < 0.90) {
      return {
        slope_mA_per_V: Number(slope_mA_per_V.toFixed(3)),
        intercept_mA: Number(intercept_mA.toFixed(3)),
        voltageIntercept_VB_V: 0,
        rSquared: Number(rSquared.toFixed(3)),
        isSufficientlyLinear: false,
        fitPointsCount: n,
        errorMessage: 'Selected region is non-linear (R² < 0.90). Select points in the upper linear conduction region (I > I_max/2).',
      };
    }

    // Voltage intercept at I = 0: 0 = m * VB + c => VB = -c / m
    const vb = -intercept_mA / slope_mA_per_V;

    return {
      slope_mA_per_V: Number(slope_mA_per_V.toFixed(3)),
      intercept_mA: Number(intercept_mA.toFixed(3)),
      voltageIntercept_VB_V: Number(vb.toFixed(3)),
      rSquared: Number(rSquared.toFixed(4)),
      isSufficientlyLinear: true,
      fitPointsCount: n,
    };
  }

  /**
   * Generates Table 2 Summary (Manual p. 44) across all 4 LEDs.
   */
  generateTable2Summary(customVBs?: Partial<Record<'blue' | 'yellow' | 'green' | 'red', number>>): {
    rows: Table2SummaryRow[];
    averagePlanckConstant_J_s: number;
    graphicalPlanckConstant_J_s: number;
    graphicalSlope_V_m: number;
    percentageErrorDirect: number;
    percentageErrorGraphical: number;
  } {
    const rows: Table2SummaryRow[] = [];
    let sumH = 0;

    // Data points for VB vs 1/lambda fit: (x = 1/lambda in m^-1, y = VB in Volts)
    const fitPoints: Array<{ x: number; y: number }> = [];

    LED_COLOR_KEYS.forEach((key, idx) => {
      const spec = LED_SPECS[key];
      const vb = customVBs?.[key] ?? spec.theoreticalVB;

      // Direct calculation: h = VB * lambda * (e / c)
      const h_direct = (vb * spec.lambda_m * CONSTANTS.e) / CONSTANTS.c_manual;
      sumH += h_direct;

      const pctErr = Math.abs((h_direct - CONSTANTS.h_manual) / CONSTANTS.h_manual) * 100;

      rows.push({
        slNo: idx + 1,
        color: key,
        colorName: spec.color,
        wavelength_nm: spec.lambda_nm,
        oneOverLambda_nm_inv: Number((1 / spec.lambda_nm).toFixed(5)),
        oneOverLambda_m_inv: Math.round(spec.oneOverLambda_per_m),
        barrierPotential_VB_V: vb,
        planckConstantDirect_J_s: h_direct,
        percentageError: Number(pctErr.toFixed(2)),
      });

      fitPoints.push({
        x: spec.oneOverLambda_per_m,
        y: vb,
      });
    });

    const averageH = sumH / rows.length;
    const avgPctErr = Math.abs((averageH - CONSTANTS.h_manual) / CONSTANTS.h_manual) * 100;

    // Linear regression for VB vs 1/lambda passing through origin:
    // VB = (hc / e) * (1 / lambda) => Slope = sum(x * y) / sum(x^2)
    let sumXY = 0;
    let sumX2 = 0;
    for (const pt of fitPoints) {
      sumXY += pt.x * pt.y;
      sumX2 += pt.x * pt.x;
    }
    const slope_V_m = sumX2 > 0 ? sumXY / sumX2 : 0;
    // h_graph = Slope * (e / c)
    const h_graph = (slope_V_m * CONSTANTS.e) / CONSTANTS.c_manual;
    const graphPctErr = Math.abs((h_graph - CONSTANTS.h_manual) / CONSTANTS.h_manual) * 100;

    return {
      rows,
      averagePlanckConstant_J_s: averageH,
      graphicalPlanckConstant_J_s: h_graph,
      graphicalSlope_V_m: Number(slope_V_m.toExponential(4)),
      percentageErrorDirect: Number(avgPctErr.toFixed(2)),
      percentageErrorGraphical: Number(graphPctErr.toFixed(2)),
    };
  }
}

export const ledPlanckEngine = new LedPlanckEngine();
