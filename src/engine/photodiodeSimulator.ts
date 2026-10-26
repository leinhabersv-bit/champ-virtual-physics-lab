import { ISimulationEngine, ValidationResult } from '../types/simulation';

export interface PhotodiodeParams {
  reverseVoltage_V: number; // 0 to 5 V (manual p. 54)
  isShielded: boolean; // dark measurements
  sourceDistance_cm: number; // 5, 10, 15, 20 cm
  lightIntensity_mW?: number;
}

export interface PhotodiodeReadings {
  reverseVoltage_V: number;
  darkCurrent_uA: number; // ID
  totalCurrent_uA: number; // Iillum
  photocurrent_uA: number; // Iph = Iillum - ID
  opticalPowerIncident_uW: number;
}

export interface PhotodiodeDerived {
  responsivity_A_per_W: number; // R = Iph / Popt
  percentageChange: number; // %Delta = ((Iillum - ID) / ID) * 100
}

export class PhotodiodeEngine implements ISimulationEngine<PhotodiodeParams, PhotodiodeReadings, PhotodiodeDerived> {
  readonly experimentId = 'expt-6-photodiode';

  readonly defaultParams: PhotodiodeParams = {
    reverseVoltage_V: 3.0,
    isShielded: false,
    sourceDistance_cm: 10.0,
    lightIntensity_mW: 150.0, // standard lab LED lamp
  };

  validateParams(params: PhotodiodeParams): ValidationResult {
    const errors: string[] = [];
    if (params.reverseVoltage_V < 0 || params.reverseVoltage_V > 10) {
      errors.push('Reverse voltage must be between 0 and 10V.');
    }
    if (params.sourceDistance_cm <= 0) {
      errors.push('Source distance must be positive.');
    }
    return { isValid: errors.length === 0, errors };
  }

  calculateReadings(params: PhotodiodeParams): PhotodiodeReadings {
    const Vr = params.reverseVoltage_V;
    // Dark current: small saturation current with slight voltage slope
    const ID_uA = 0.08 + 0.015 * Vr;

    let Iph_uA = 0;
    let Popt_uW = 0;

    if (!params.isShielded) {
      const dist_m = params.sourceDistance_cm * 1e-2;
      const light_mW = params.lightIntensity_mW ?? 2500.0;
      // Optical power falling on photodiode with focusing lens: directional optical gain 25.0
      const area_m2 = 1e-6; // 1 mm^2
      const flux_W_m2 = (light_mW * 1e-3 * 25.0) / (4 * Math.PI * dist_m * dist_m);
      Popt_uW = flux_W_m2 * area_m2 * 1e6;

      const responsivity = 0.45; // A/W at ~850-900nm silicon photodiode
      Iph_uA = (Popt_uW * 1e-6 * responsivity) * 1e6;
    }

    const Iillum_uA = ID_uA + Iph_uA;

    return {
      reverseVoltage_V: Number(Vr.toFixed(2)),
      darkCurrent_uA: Number(ID_uA.toFixed(3)),
      totalCurrent_uA: Number(Iillum_uA.toFixed(3)),
      photocurrent_uA: Number(Iph_uA.toFixed(3)),
      opticalPowerIncident_uW: Number(Popt_uW.toFixed(2)),
    };
  }

  computeDerived(readings: PhotodiodeReadings, _params: PhotodiodeParams): PhotodiodeDerived {
    const Iph_A = readings.photocurrent_uA * 1e-6;
    const Popt_W = readings.opticalPowerIncident_uW * 1e-6;
    const R = Popt_W > 0 ? Iph_A / Popt_W : 0.45;

    const pctDelta = readings.darkCurrent_uA > 0
      ? ((readings.totalCurrent_uA - readings.darkCurrent_uA) / readings.darkCurrent_uA) * 100
      : 0;

    return {
      responsivity_A_per_W: Number(R.toFixed(3)),
      percentageChange: Number(pctDelta.toFixed(1)),
    };
  }

  generateModelCurve(params: PhotodiodeParams, sampleCount = 40): Array<{ x: number; y: number; label?: string }> {
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= sampleCount; i++) {
      const vr = (5.0 * i) / sampleCount;
      const res = this.calculateReadings({ ...params, reverseVoltage_V: vr });
      points.push({
        x: -Number(vr.toFixed(2)), // plotted in 3rd quadrant (negative voltage, negative current) as in manual p. 55 Fig.
        y: -Number(res.totalCurrent_uA.toFixed(2)),
      });
    }
    return points;
  }
}

export const photodiodeEngine = new PhotodiodeEngine();
