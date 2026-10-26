import { ISimulationEngine, ValidationResult } from '../types/simulation';
import { CONSTANTS } from '../utils/units';

export interface LedParams {
  ledColor: 'blue' | 'yellow' | 'green' | 'red';
  potentiometerRatio: number; // 0.0 to 1.0 (controlling voltage from 3V source)
  supplyVoltage_V?: number; // 3V fixed as per manual p. 42
  currentLimitingResistor_ohm?: number; // 10-100 ohm
}

export interface LedReadings {
  appliedVoltage_V: number;
  diodeVoltage_V: number;
  diodeCurrent_uA: number;
  wavelength_nm: number;
  oneOverLambda_per_nm: number;
  barrierPotential_VB_V: number;
  isEmittingLight: boolean;
}

export interface LedDerived {
  planckConstantDirect_J_s: number; // h = VB * lambda * (e / c)
  percentageErrorVsTrue_h: number;
}

export const LED_SPECS: Record<string, { color: string; lambda_nm: number; defaultVB: number; hex: string }> = {
  blue: { color: 'Blue', lambda_nm: 470, defaultVB: 2.64, hex: '#3b82f6' },
  yellow: { color: 'Yellow', lambda_nm: 500, defaultVB: 2.48, hex: '#eab308' },
  green: { color: 'Green', lambda_nm: 565, defaultVB: 2.20, hex: '#22c55e' },
  red: { color: 'Red', lambda_nm: 660, defaultVB: 1.88, hex: '#ef4444' },
};

export class LedPlanckEngine implements ISimulationEngine<LedParams, LedReadings, LedDerived> {
  readonly experimentId = 'expt-3-led-planck';

  readonly defaultParams: LedParams = {
    ledColor: 'red',
    potentiometerRatio: 0.5,
    supplyVoltage_V: 3.0,
    currentLimitingResistor_ohm: 47.0,
  };

  validateParams(params: LedParams): ValidationResult {
    const errors: string[] = [];
    if (params.potentiometerRatio < 0 || params.potentiometerRatio > 1) {
      errors.push('Potentiometer ratio must be between 0 and 1.');
    }
    return { isValid: errors.length === 0, errors };
  }

  calculateReadings(params: LedParams): LedReadings {
    const spec = LED_SPECS[params.ledColor] ?? LED_SPECS.red;
    const supply = params.supplyVoltage_V ?? 3.0;
    const vIn = supply * params.potentiometerRatio;
    const R_lim = params.currentLimitingResistor_ohm ?? 47.0;

    const VB = spec.defaultVB;
    const ideality = 1.8;
    const Vt = 0.0259 * ideality;

    // Shockley diode forward model with series resistance: I = I0 * (exp((Vd)/nVth) - 1), Vin = Vd + I * R_lim
    // Max current clamped to ~2900 uA as cautioned in manual p. 42
    let vdLow = 0;
    let vdHigh = Math.min(vIn, VB + 0.3);
    for (let i = 0; i < 20; i++) {
      const vdMid = (vdLow + vdHigh) / 2;
      const idiode = 1e-12 * (Math.exp(Math.min(50, vdMid / Vt)) - 1);
      const vDrop = vIn - idiode * R_lim;
      if (vDrop > vdMid) {
        vdLow = vdMid;
      } else {
        vdHigh = vdMid;
      }
    }
    const vd = (vdLow + vdHigh) / 2;
    const current_A = Math.max(0, (vIn - vd) / R_lim);
    const current_uA = Math.min(2900, current_A * 1e6);

    const isEmitting = vd >= VB * 0.95 && current_uA > 50;

    return {
      appliedVoltage_V: Number(vIn.toFixed(3)),
      diodeVoltage_V: Number(vd.toFixed(3)),
      diodeCurrent_uA: Number(current_uA.toFixed(1)),
      wavelength_nm: spec.lambda_nm,
      oneOverLambda_per_nm: Number((1 / spec.lambda_nm).toFixed(5)),
      barrierPotential_VB_V: spec.defaultVB,
      isEmittingLight: isEmitting,
    };
  }

  computeDerived(readings: LedReadings, params: LedParams): LedDerived {
    const spec = LED_SPECS[params.ledColor] ?? LED_SPECS.red;
    const lambda_m = spec.lambda_nm * 1e-9;
    const VB = readings.barrierPotential_VB_V;

    // h = VB * lambda * (e / c)
    const h_calc = VB * lambda_m * (CONSTANTS.e / CONSTANTS.c_manual);
    const pctError = Math.abs((h_calc - CONSTANTS.h_manual) / CONSTANTS.h_manual) * 100;

    return {
      planckConstantDirect_J_s: h_calc,
      percentageErrorVsTrue_h: Number(pctError.toFixed(2)),
    };
  }

  generateModelCurve(params: LedParams, sampleCount = 60): Array<{ x: number; y: number; label?: string }> {
    const points: Array<{ x: number; y: number }> = [];
    const maxV = 3.0;

    for (let i = 0; i <= sampleCount; i++) {
      const vIn = (maxV * i) / sampleCount;
      const p: LedParams = { ...params, potentiometerRatio: vIn / maxV };
      const res = this.calculateReadings(p);
      points.push({
        x: res.diodeVoltage_V,
        y: res.diodeCurrent_uA,
      });
    }

    return points;
  }
}

export const ledPlanckEngine = new LedPlanckEngine();
