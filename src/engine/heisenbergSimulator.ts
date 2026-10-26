import { ISimulationEngine, ValidationResult } from '../types/simulation';
import { CONSTANTS } from '../utils/units';

export interface HeisenbergParams {
  slitWidth_um: number; // micrometers (e.g. 20 to 100 um)
  wavelength_nm: number; // laser wavelength, manual standard: 650 nm
  screenDistance_mm: number; // D in mm (e.g. 800 to 1200 mm)
  micrometerPos_mm: number; // detector scan coordinate
  laserPower_mW?: number;
}

export interface HeisenbergReadings {
  intensity_uA: number; // detector output current in microamperes
  angle_rad: number;
  theta_m_deg: number;
  firstMinimumDistance_mm: number; // a1 in mm
  d_calculated_um: number;
}

export interface HeisenbergDerived {
  delta_y_m: number; // Uncertainty in position (slit width)
  delta_p_y_kg_m_s: number; // Uncertainty in momentum
  uncertaintyProduct: number; // delta_p_y * delta_y in J·s
  ratioToPlanckConstant: number; // (delta_p_y * delta_y) / h
}

export class HeisenbergEngine implements ISimulationEngine<HeisenbergParams, HeisenbergReadings, HeisenbergDerived> {
  readonly experimentId = 'expt-8-heisenberg-slit';

  readonly defaultParams: HeisenbergParams = {
    slitWidth_um: 40.0, // 40 microns
    wavelength_nm: 650.0, // 650 nm diode laser as per manual p. 70
    screenDistance_mm: 1000.0, // 1.0 m rail separation
    micrometerPos_mm: 0.0, // centered on optical axis
    laserPower_mW: 5.0,
  };

  validateParams(params: HeisenbergParams): ValidationResult {
    const errors: string[] = [];
    if (params.slitWidth_um <= 0) errors.push('Slit width must be positive.');
    if (params.wavelength_nm <= 0) errors.push('Wavelength must be positive.');
    if (params.screenDistance_mm <= 0) errors.push('Screen distance must be positive.');
    return { isValid: errors.length === 0, errors };
  }

  calculateReadings(params: HeisenbergParams): HeisenbergReadings {
    const d = params.slitWidth_um * 1e-6; // m
    const lambda = params.wavelength_nm * 1e-9; // m
    const D = params.screenDistance_mm * 1e-3; // m
    const y = params.micrometerPos_mm * 1e-3; // m

    // First minimum location: d * sin(theta_1) = lambda => theta_1 = asin(lambda/d)
    const sinTheta1 = lambda / d;
    const theta1 = Math.asin(Math.min(1, sinTheta1));
    const a1 = D * Math.tan(theta1); // distance to 1st minimum in meters

    // Fraunhofer diffraction intensity profile: I(y) = I0 * (sin(beta)/beta)^2
    // beta = (pi * d / lambda) * sin(theta) = (pi * d / lambda) * (y / sqrt(D^2 + y^2))
    const sinTheta = y / Math.sqrt(D * D + y * y);
    const beta = (Math.PI * d / lambda) * sinTheta;

    let intensityRatio = 1.0;
    if (Math.abs(beta) > 1e-7) {
      intensityRatio = (Math.sin(beta) / beta) ** 2;
    }

    const maxCurrent_uA = 85.0; // typical peak current on digital unit (manual p. 67-69)
    const current_uA = maxCurrent_uA * intensityRatio;

    // Recalculated slit width from first minimum
    const measuredTheta = Math.atan(a1 / D);
    const d_calc_um = (lambda / Math.sin(measuredTheta)) * 1e6;

    return {
      intensity_uA: Number(current_uA.toFixed(2)),
      angle_rad: measuredTheta,
      theta_m_deg: Number(((measuredTheta * 180) / Math.PI).toFixed(4)),
      firstMinimumDistance_mm: Number((a1 * 1e3).toFixed(3)),
      d_calculated_um: Number(d_calc_um.toFixed(2)),
    };
  }

  computeDerived(readings: HeisenbergReadings, params: HeisenbergParams): HeisenbergDerived {
    const d = params.slitWidth_um * 1e-6;
    const lambda = params.wavelength_nm * 1e-9;
    const h = CONSTANTS.h_manual;

    // Delta y = d (manual eq. 3)
    const delta_y = d;

    // Momentum of photon: p_x = h / lambda (manual eq. 7)
    // Transverse momentum spread: Delta p_y = (h / lambda) * sin(tan^-1(a/D)) (manual eq. 10)
    const delta_p_y = (h / lambda) * Math.sin(readings.angle_rad);

    // Product Delta p_y * Delta y
    const product = delta_p_y * delta_y;
    const ratio = product / h;

    return {
      delta_y_m: delta_y,
      delta_p_y_kg_m_s: delta_p_y,
      uncertaintyProduct: product,
      ratioToPlanckConstant: Number(ratio.toFixed(4)),
    };
  }

  generateModelCurve(params: HeisenbergParams, sampleCount = 120): Array<{ x: number; y: number; label?: string }> {
    const d = params.slitWidth_um * 1e-6;
    const lambda = params.wavelength_nm * 1e-9;
    const D = params.screenDistance_mm * 1e-3;
    const theta1 = Math.asin(Math.min(1, lambda / d));
    const a1_mm = D * Math.tan(theta1) * 1e3;

    // Span from -2.5*a1 to +2.5*a1 to show secondary maxima
    const span = Math.max(25, a1_mm * 2.5);
    const points: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= sampleCount; i++) {
      const pos_mm = -span + (2 * span * i) / sampleCount;
      const y = pos_mm * 1e-3;
      const sinTheta = y / Math.sqrt(D * D + y * y);
      const beta = (Math.PI * d / lambda) * sinTheta;
      const ratio = Math.abs(beta) > 1e-7 ? (Math.sin(beta) / beta) ** 2 : 1;
      points.push({
        x: Number(pos_mm.toFixed(2)),
        y: Number((85.0 * ratio).toFixed(2)),
      });
    }

    return points;
  }
}

export const heisenbergEngine = new HeisenbergEngine();
