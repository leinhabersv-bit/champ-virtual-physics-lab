import { ISimulationEngine, ValidationResult } from '../types/simulation';
import { CONSTANTS } from '../utils/units';

export interface TunnelingParams {
  particleEnergy_eV: number; // E in eV (e.g. 1.0 to 10.0 eV)
  barrierHeight_eV: number; // V0 in eV (e.g. 4.0 to 10.0 eV)
  barrierWidth_Angstrom: number; // a in Angstroms (e.g. 1.0 to 5.0 A)
  particleMass_kg?: number; // default electron mass
}

export interface TunnelingReadings {
  transmissionCoefficient_T: number;
  transmittedAmplitude_t: number;
  reflectionCoefficient_R: number;
  attenuationConstant_kappa_per_m: number;
  log_e_T: number; // ln(T) for Table 2.2
}

export interface TunnelingDerived {
  tunnelingRegime: 'Sub-barrier Tunneling (E < V0)' | 'Resonant Transmission (E > V0)' | 'Critical Energy (E = V0)';
  penetrationDepth_nm: number;
  decayRateInsideBarrier: number;
}

export class TunnelingEngine implements ISimulationEngine<TunnelingParams, TunnelingReadings, TunnelingDerived> {
  readonly experimentId = 'expt-4-quantum-tunneling';

  readonly defaultParams: TunnelingParams = {
    particleEnergy_eV: 2.0, // 2 eV
    barrierHeight_eV: 6.0, // 6 eV
    barrierWidth_Angstrom: 1.5, // 1.5 Angstrom
    particleMass_kg: CONSTANTS.m_e,
  };

  validateParams(params: TunnelingParams): ValidationResult {
    const errors: string[] = [];
    if (params.particleEnergy_eV <= 0) errors.push('Particle energy E must be positive.');
    if (params.barrierHeight_eV <= 0) errors.push('Barrier height V0 must be positive.');
    if (params.barrierWidth_Angstrom <= 0) errors.push('Barrier width a must be positive.');
    return { isValid: errors.length === 0, errors };
  }

  calculateReadings(params: TunnelingParams): TunnelingReadings {
    const E = params.particleEnergy_eV * CONSTANTS.e; // Joules
    const V0 = params.barrierHeight_eV * CONSTANTS.e; // Joules
    const a = params.barrierWidth_Angstrom * 1e-10; // meters
    const m = params.particleMass_kg ?? CONSTANTS.m_e;
    const hbar = CONSTANTS.hbar;

    let T: number;
    let kappa = 0;

    if (Math.abs(E - V0) < 1e-22) {
      // E == V0 critical limit
      const term = (m * V0 * a * a) / (2 * hbar * hbar);
      T = 1 / (1 + term);
    } else if (E < V0) {
      // Sub-barrier tunneling: T = [1 + (V0^2 * sinh^2(kappa*a)) / (4*E*(V0 - E))]^-1
      kappa = Math.sqrt((2 * m * (V0 - E)) / (hbar * hbar));
      const sinhKa = Math.sinh(Math.min(50, kappa * a));
      const denomTerm = (V0 * V0 * sinhKa * sinhKa) / (4 * E * (V0 - E));
      T = 1 / (1 + denomTerm);
    } else {
      // Over-barrier transmission: T = [1 + (V0^2 * sin^2(k2*a)) / (4*E*(E - V0))]^-1
      const k2 = Math.sqrt((2 * m * (E - V0)) / (hbar * hbar));
      const sinK2a = Math.sin(k2 * a);
      const denomTerm = (V0 * V0 * sinK2a * sinK2a) / (4 * E * (E - V0));
      T = 1 / (1 + denomTerm);
    }

    // Clamp T within [0, 1]
    T = Math.max(0, Math.min(1, T));
    const t = Math.sqrt(T);
    const R = 1 - T;
    const logeT = T > 1e-20 ? Math.log(T) : -50;

    return {
      transmissionCoefficient_T: Number(T.toFixed(6)),
      transmittedAmplitude_t: Number(t.toFixed(6)),
      reflectionCoefficient_R: Number(R.toFixed(6)),
      attenuationConstant_kappa_per_m: kappa,
      log_e_T: Number(logeT.toFixed(4)),
    };
  }

  computeDerived(readings: TunnelingReadings, params: TunnelingParams): TunnelingDerived {
    let regime: TunnelingDerived['tunnelingRegime'];
    if (Math.abs(params.particleEnergy_eV - params.barrierHeight_eV) < 0.05) {
      regime = 'Critical Energy (E = V0)';
    } else if (params.particleEnergy_eV < params.barrierHeight_eV) {
      regime = 'Sub-barrier Tunneling (E < V0)';
    } else {
      regime = 'Resonant Transmission (E > V0)';
    }

    const kappa = readings.attenuationConstant_kappa_per_m;
    const penetrationDepth_nm = kappa > 0 ? (1 / kappa) * 1e9 : Infinity;

    return {
      tunnelingRegime: regime,
      penetrationDepth_nm: Number(penetrationDepth_nm.toFixed(4)),
      decayRateInsideBarrier: Number(kappa.toExponential(3)),
    };
  }

  // Wavefunction spatial curve matching manual p. 46
  generateModelCurve(params: TunnelingParams, sampleCount = 100): Array<{ x: number; y: number; label?: string }> {
    const a_A = params.barrierWidth_Angstrom;
    const E = params.particleEnergy_eV;
    const V0 = params.barrierHeight_eV;
    const readings = this.calculateReadings(params);
    const t_amp = readings.transmittedAmplitude_t;

    const points: Array<{ x: number; y: number }> = [];
    const xMin = -4.0;
    const xMax = 4.0 + a_A;

    for (let i = 0; i <= sampleCount; i++) {
      const x = xMin + ((xMax - xMin) * i) / sampleCount;
      let psiReal = 0;

      if (x < 0) {
        // Region I: incident + reflected
        const k1 = Math.sqrt(E);
        psiReal = Math.cos(2 * Math.PI * k1 * x * 0.5) + 0.3 * Math.cos(2 * Math.PI * k1 * -x * 0.5);
      } else if (x <= a_A) {
        // Region II: barrier exponential decay
        const fraction = x / a_A;
        psiReal = (1.0 - 0.7 * fraction) * Math.exp(-0.8 * fraction * (V0 - E > 0 ? 1 : 0.2));
      } else {
        // Region III: transmitted plane wave
        const k3 = Math.sqrt(E);
        psiReal = t_amp * Math.cos(2 * Math.PI * k3 * (x - a_A) * 0.5);
      }

      points.push({
        x: Number(x.toFixed(2)),
        y: Number(psiReal.toFixed(3)),
      });
    }

    return points;
  }
}

export const tunnelingEngine = new TunnelingEngine();
