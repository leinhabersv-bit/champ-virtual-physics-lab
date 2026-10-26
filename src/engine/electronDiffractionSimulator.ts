import { ISimulationEngine, ValidationResult } from '../types/simulation';
import { CONSTANTS } from '../utils/units';

export interface ElectronDiffractionParams {
  anodeVoltage_kV: number; // 2.5 to 5.0 kV
  screenDistance_mm: number; // L = 135 mm (manual p. 60)
  heaterOn: boolean;
}

export interface ElectronDiffractionReadings {
  deBroglieWavelength_nm: number; // lambda_dB
  ring1Diameter_mm: number; // D1 (inner ring, d110 = 0.123 nm)
  ring2Diameter_mm: number; // D2 (outer ring, d100 = 0.213 nm)
  braggWavelengthRing1_nm: number;
  braggWavelengthRing2_nm: number;
  theta1_deg: number;
  theta2_deg: number;
}

export interface ElectronDiffractionDerived {
  kineticEnergy_eV: number;
  kineticEnergy_J: number;
  momentum_kg_m_s: number;
}

export class ElectronDiffractionEngine implements ISimulationEngine<ElectronDiffractionParams, ElectronDiffractionReadings, ElectronDiffractionDerived> {
  readonly experimentId = 'expt-7-electron-diffraction';

  readonly defaultParams: ElectronDiffractionParams = {
    anodeVoltage_kV: 4.0, // 4 kV as in manual p. 61
    screenDistance_mm: 135.0, // L = 135 mm
    heaterOn: true,
  };

  validateParams(params: ElectronDiffractionParams): ValidationResult {
    const errors: string[] = [];
    if (params.anodeVoltage_kV <= 0) errors.push('Anode voltage must be positive.');
    if (params.screenDistance_mm <= 0) errors.push('Screen distance L must be positive.');
    return { isValid: errors.length === 0, errors };
  }

  calculateReadings(params: ElectronDiffractionParams): ElectronDiffractionReadings {
    if (!params.heaterOn) {
      return {
        deBroglieWavelength_nm: 0,
        ring1Diameter_mm: 0,
        ring2Diameter_mm: 0,
        braggWavelengthRing1_nm: 0,
        braggWavelengthRing2_nm: 0,
        theta1_deg: 0,
        theta2_deg: 0,
      };
    }

    const V = params.anodeVoltage_kV * 1e3; // Volts
    const L = params.screenDistance_mm * 1e-3; // meters
    const m = CONSTANTS.m_e;
    const e = CONSTANTS.e;
    const h = CONSTANTS.h_manual;

    // de Broglie wavelength: lambda = h / sqrt(2 * m * e * V)
    const lambda_m = h / Math.sqrt(2 * m * e * V);
    const lambda_nm = lambda_m * 1e9;

    // Graphite interplanar spacing: d1 = 0.213 nm, d2 = 0.123 nm
    const d1_m = 0.213e-9; // outer ring plane (d100)
    const d2_m = 0.123e-9; // inner ring plane (d110)

    // Bragg: lambda = 2*d*sin(theta), with 2*theta = atan(D / (2*L))
    // Small angle approx: D = 2 * L * lambda / d
    const D1_m = (2 * L * lambda_m) / d1_m;
    const D2_m = (2 * L * lambda_m) / d2_m;

    const theta1_rad = Math.asin(lambda_m / (2 * d1_m));
    const theta2_rad = Math.asin(lambda_m / (2 * d2_m));

    // Bragg wavelength verified from geometry
    const lambda_bragg1 = 2 * d1_m * Math.sin(0.5 * Math.atan(D1_m / (2 * L)));
    const lambda_bragg2 = 2 * d2_m * Math.sin(0.5 * Math.atan(D2_m / (2 * L)));

    return {
      deBroglieWavelength_nm: Number(lambda_nm.toFixed(5)),
      ring1Diameter_mm: Number((D1_m * 1e3).toFixed(2)),
      ring2Diameter_mm: Number((D2_m * 1e3).toFixed(2)),
      braggWavelengthRing1_nm: Number((lambda_bragg1 * 1e9).toFixed(5)),
      braggWavelengthRing2_nm: Number((lambda_bragg2 * 1e9).toFixed(5)),
      theta1_deg: Number(((theta1_rad * 180) / Math.PI).toFixed(3)),
      theta2_deg: Number(((theta2_rad * 180) / Math.PI).toFixed(3)),
    };
  }

  computeDerived(_readings: ElectronDiffractionReadings, params: ElectronDiffractionParams): ElectronDiffractionDerived {
    const V = params.anodeVoltage_kV * 1e3;
    const kineticEnergy_eV = V;
    const kineticEnergy_J = V * CONSTANTS.e;
    const momentum = Math.sqrt(2 * CONSTANTS.m_e * kineticEnergy_J);

    return {
      kineticEnergy_eV,
      kineticEnergy_J,
      momentum_kg_m_s: momentum,
    };
  }
}

export const electronDiffractionEngine = new ElectronDiffractionEngine();
