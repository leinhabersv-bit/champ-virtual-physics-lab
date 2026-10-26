import { ISimulationEngine, ValidationResult } from '../types/simulation';

export interface SpectrometerParams {
  method: 'normal_incidence' | 'minimum_deviation';
  lightSource: 'mercury' | 'sodium';
  selectedLine: string; // 'blue' | 'green' | 'yellow' | 'red' | 'yellow_1' | 'yellow_2'
  gratingRulingsPerInch: number; // default 15000 LPI
  order: number; // default 1
  telescopeAngle_deg: number; // interactive telescope rotation
}

export interface SpectrometerReadings {
  gratingElement_m: number; // (e + d) in meters
  diffractionAngle_deg: number; // theoretical theta
  leftVernierV1_deg: number;
  leftVernierV2_deg: number;
  rightVernierV1_deg: number;
  rightVernierV2_deg: number;
  observedDiffractionAngle_deg: number; // (a - b)/2
  calculatedWavelength_nm: number;
  standardWavelength_nm: number;
  percentageError: number;
}

export interface SpectrometerDerived {
  spectralResolution_R: number; // lambda / delta_lambda
  dispersion_deg_per_nm: number;
}

export const MERCURY_LINES: Record<string, { name: string; lambda_nm: number; colorHex: string }> = {
  blue: { name: 'Blue', lambda_nm: 469.3, colorHex: '#38bdf8' },
  green: { name: 'Green', lambda_nm: 546.1, colorHex: '#4ade80' },
  yellow: { name: 'Yellow', lambda_nm: 577.0, colorHex: '#facc15' },
  red: { name: 'Red', lambda_nm: 623.8, colorHex: '#f87171' },
};

export const SODIUM_LINES: Record<string, { name: string; lambda_nm: number; colorHex: string }> = {
  yellow_1: { name: 'Yellow 1 (D1)', lambda_nm: 589.6, colorHex: '#eab308' },
  yellow_2: { name: 'Yellow 2 (D2)', lambda_nm: 589.0, colorHex: '#f59e0b' },
};

export class SpectrometerEngine implements ISimulationEngine<SpectrometerParams, SpectrometerReadings, SpectrometerDerived> {
  readonly experimentId = 'expt-2-5-spectrometer';

  readonly defaultParams: SpectrometerParams = {
    method: 'normal_incidence',
    lightSource: 'mercury',
    selectedLine: 'green',
    gratingRulingsPerInch: 15000,
    order: 1,
    telescopeAngle_deg: 0,
  };

  validateParams(params: SpectrometerParams): ValidationResult {
    const errors: string[] = [];
    if (params.gratingRulingsPerInch <= 0) errors.push('Grating rulings must be positive.');
    if (params.order < 1) errors.push('Order n must be >= 1.');
    return { isValid: errors.length === 0, errors };
  }

  calculateReadings(params: SpectrometerParams): SpectrometerReadings {
    const N = params.gratingRulingsPerInch;
    const gratingElement_m = (2.54e-2) / N; // (e + d)

    let standard_nm = 546.1;
    if (params.lightSource === 'mercury') {
      standard_nm = MERCURY_LINES[params.selectedLine]?.lambda_nm ?? 546.1;
    } else {
      standard_nm = SODIUM_LINES[params.selectedLine]?.lambda_nm ?? 589.6;
    }

    const lambda_m = standard_nm * 1e-9;
    let theta_rad: number;

    if (params.method === 'normal_incidence') {
      // (e + d) * sin(theta) = n * lambda
      const sinTheta = (params.order * lambda_m) / gratingElement_m;
      theta_rad = Math.asin(Math.min(1, sinTheta));
    } else {
      // Minimum deviation: 2 * (e + d) * sin(Dm / 2) = n * lambda => Dm = 2 * asin(n*lambda / (2*(e+d)))
      const sinHalfDm = (params.order * lambda_m) / (2 * gratingElement_m);
      theta_rad = 2 * Math.asin(Math.min(1, sinHalfDm));
    }

    const theta_deg = (theta_rad * 180) / Math.PI;

    // Normal direct position at 180 deg
    const directAngle = 180.0;
    const leftReading = directAngle - theta_deg;
    const rightReading = directAngle + theta_deg;

    // Vernier 2 is offset by exactly 180 degrees
    const leftV1 = leftReading;
    const leftV2 = (leftReading + 180) % 360;
    const rightV1 = rightReading;
    const rightV2 = (rightReading + 180) % 360;

    const observedDiffractionAngle_deg = (rightV1 - leftV1) / 2;

    // Recalculated lambda
    let calculatedLambda_m: number;
    if (params.method === 'normal_incidence') {
      calculatedLambda_m = (gratingElement_m * Math.sin((observedDiffractionAngle_deg * Math.PI) / 180)) / params.order;
    } else {
      calculatedLambda_m = (2 * gratingElement_m * Math.sin(((observedDiffractionAngle_deg / 2) * Math.PI) / 180)) / params.order;
    }

    const calc_nm = calculatedLambda_m * 1e9;
    const pctError = Math.abs((calc_nm - standard_nm) / standard_nm) * 100;

    return {
      gratingElement_m,
      diffractionAngle_deg: Number(theta_deg.toFixed(4)),
      leftVernierV1_deg: Number(leftV1.toFixed(3)),
      leftVernierV2_deg: Number(leftV2.toFixed(3)),
      rightVernierV1_deg: Number(rightV1.toFixed(3)),
      rightVernierV2_deg: Number(rightV2.toFixed(3)),
      observedDiffractionAngle_deg: Number(observedDiffractionAngle_deg.toFixed(3)),
      calculatedWavelength_nm: Number(calc_nm.toFixed(1)),
      standardWavelength_nm: standard_nm,
      percentageError: Number(pctError.toFixed(2)),
    };
  }

  computeDerived(readings: SpectrometerReadings, params: SpectrometerParams): SpectrometerDerived {
    const totalRulings = params.gratingRulingsPerInch * 2; // ~2 inches width
    const R = params.order * totalRulings;
    const theta_rad = (readings.diffractionAngle_deg * Math.PI) / 180;
    const dispersion = (params.order / (readings.gratingElement_m * Math.cos(theta_rad))) * (180 / Math.PI) * 1e-9;

    return {
      spectralResolution_R: R,
      dispersion_deg_per_nm: Number(dispersion.toFixed(4)),
    };
  }
}

export const spectrometerEngine = new SpectrometerEngine();
