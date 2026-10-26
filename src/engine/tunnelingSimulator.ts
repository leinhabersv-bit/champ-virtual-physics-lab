import { ISimulationEngine, ValidationResult } from '../types/simulation';
import { CONSTANTS } from '../utils/units';

// Complex number helper interface
export interface Complex {
  re: number;
  im: number;
}

export const cmath = {
  make: (re: number, im = 0): Complex => ({ re, im }),
  add: (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im }),
  sub: (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im }),
  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }),
  scale: (a: Complex, s: number): Complex => ({ re: a.re * s, im: a.im * s }),
  div: (a: Complex, b: Complex): Complex => {
    const denom = b.re * b.re + b.im * b.im;
    if (denom === 0) return { re: 0, im: 0 };
    return {
      re: (a.re * b.re + a.im * b.im) / denom,
      im: (a.im * b.re - a.re * b.im) / denom,
    };
  },
  exp: (a: Complex): Complex => {
    const r = Math.exp(a.re);
    return {
      re: r * Math.cos(a.im),
      im: r * Math.sin(a.im),
    };
  },
  abs: (a: Complex): number => Math.sqrt(a.re * a.re + a.im * a.im),
  abs2: (a: Complex): number => a.re * a.re + a.im * a.im,
  arg: (a: Complex): number => Math.atan2(a.im, a.re),
};

export interface TunnelingParams {
  particleEnergy_eV: number; // E in eV (e.g. 0.1 to 12.0 eV)
  barrierHeight_eV: number; // V0 in eV (e.g. 1.0 to 15.0 eV)
  barrierWidth_Angstrom: number; // a in Angstroms (e.g. 0.5 to 6.0 A)
  particleMass_kg?: number; // default electron mass m_e
}

export interface TunnelingReadings {
  transmissionCoefficient_T: number;
  transmittedAmplitude_t: number; // |t| = sqrt(T)
  transmittedAmplitude_magnitude_t: number;
  transmittedAmplitude_complex: Complex;
  reflectionCoefficient_R: number;
  reflectionAmplitude_complex: Complex;
  attenuationConstant_kappa_per_m: number;
  attenuationConstant_kappa_per_A: number;
  waveNumber_k1_per_m: number;
  waveNumber_k1_per_A: number;
  waveNumber_k2_per_m: number; // For E > V0
  log_e_T: number; // ln(T) for Table 2.2
}

export interface TunnelingDerived {
  tunnelingRegime: 'Sub-barrier Tunneling (E < V0)' | 'Resonant Transmission (E > V0)' | 'Critical Energy (E = V0)';
  penetrationDepth_nm: number;
  penetrationDepth_Angstrom: number;
  decayRateInsideBarrier: number;
  criticalTransmission_T_V0: number; // Limit when E = V0
  deBroglieWavelength_Region1_A: number;
  deBroglieWavelength_Region3_A: number;
}

export interface WavefunctionPoint {
  x_A: number;
  psi_real: number;
  psi_imag: number;
  psi_probDensity: number;
  V_x_eV: number;
  E_eV: number;
  region: 'I' | 'II' | 'III';
}

export interface TableRow_T_vs_E {
  slNo: number;
  energy_eV: number;
  transmittedAmplitude_t: number;
  T_observed: number; // |t|^2
  T_calculated: number; // Analytical formula
}

export interface TableRow_T_vs_a {
  slNo: number;
  barrierWidth_a_A: number;
  transmittedAmplitude_t: number;
  T_observed: number;
  T_calculated: number;
  log_e_T: number;
}

export class TunnelingEngine implements ISimulationEngine<TunnelingParams, TunnelingReadings, TunnelingDerived> {
  readonly experimentId = 'expt-4-quantum-tunneling';

  readonly defaultParams: TunnelingParams = {
    particleEnergy_eV: 2.0, // 2 eV
    barrierHeight_eV: 6.0, // 6 eV
    barrierWidth_Angstrom: 1.5, // 1.5 Angstrom (matches manual p. 46 Image176)
    particleMass_kg: CONSTANTS.m_e,
  };

  validateParams(params: TunnelingParams): ValidationResult {
    const errors: string[] = [];
    if (params.particleEnergy_eV <= 0) errors.push('Particle energy E must be strictly positive.');
    if (params.barrierHeight_eV <= 0) errors.push('Barrier height V0 must be strictly positive.');
    if (params.barrierWidth_Angstrom <= 0) errors.push('Barrier width a must be strictly positive.');
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Solves exact 1D Schrödinger boundary matching across finite rectangular barrier.
   */
  calculateReadings(params: TunnelingParams): TunnelingReadings {
    const E_eV = params.particleEnergy_eV;
    const V0_eV = params.barrierHeight_eV;
    const a_A = params.barrierWidth_Angstrom;

    const E = E_eV * CONSTANTS.e; // Joules
    const V0 = V0_eV * CONSTANTS.e; // Joules
    const a = a_A * 1e-10; // metres
    const m = params.particleMass_kg ?? CONSTANTS.m_e;
    const hbar = CONSTANTS.hbar;

    const k1 = Math.sqrt(2 * m * E) / hbar; // m^-1
    let T = 0;
    let kappa = 0;
    let k2 = 0;
    let t_complex: Complex = { re: 0, im: 0 };
    let r_complex: Complex = { re: 0, im: 0 };

    const energyDiff = E - V0;

    if (Math.abs(energyDiff) < 1e-22 || Math.abs(E_eV - V0_eV) < 1e-4) {
      // REGIME 1: Critical Energy (E = V0)
      // Limit of T as E -> V0: T = [1 + (m * V0 * a^2) / (2 * hbar^2)]^-1
      const term = (m * V0 * a * a) / (2 * hbar * hbar);
      T = 1 / (1 + term);

      // Boundary matching at E = V0:
      // t = e^(-i * k1 * a) / (1 - i * k1 * a / 2)
      const num = cmath.exp(cmath.make(0, -k1 * a));
      const denom = cmath.make(1, -(k1 * a) / 2);
      t_complex = cmath.div(num, denom);

      const u = cmath.mul(t_complex, cmath.exp(cmath.make(0, k1 * a)));
      const B = cmath.mul(cmath.make(1, -k1 * a), u);
      r_complex = cmath.sub(B, cmath.make(1, 0));
    } else if (E < V0) {
      // REGIME 2: Sub-barrier Tunneling (E < V0)
      kappa = Math.sqrt(2 * m * (V0 - E)) / hbar;

      // Closed-form manual formula (PDF p. 45):
      // T = [1 + (V0^2 * sinh^2(kappa*a)) / (4*E*(V0 - E))]^-1
      const sinhKa = Math.sinh(Math.min(50, kappa * a));
      const denomTerm = (V0 * V0 * sinhKa * sinhKa) / (4 * E * (V0 - E));
      T = 1 / (1 + denomTerm);

      // Exact complex transmission amplitude from boundary matching:
      // t = e^(-i*k1*a) / [cosh(kappa*a) + i * ((kappa^2 - k1^2) / (2*kappa*k1)) * sinh(kappa*a)]
      const coshKa = Math.cosh(Math.min(50, kappa * a));
      const factor = (kappa * kappa - k1 * k1) / (2 * kappa * k1);
      const denom = cmath.make(coshKa, factor * sinhKa);
      const num = cmath.exp(cmath.make(0, -k1 * a));
      t_complex = cmath.div(num, denom);

      const u = cmath.mul(t_complex, cmath.exp(cmath.make(0, k1 * a)));
      const factorA = cmath.div(cmath.make(kappa, -k1), cmath.make(2 * kappa, 0));
      const expKa = Math.exp(Math.min(50, kappa * a));
      const A = cmath.scale(cmath.mul(factorA, u), expKa);

      const factorB = cmath.div(cmath.make(kappa, k1), cmath.make(2 * kappa, 0));
      const expMinusKa = Math.exp(-Math.min(50, kappa * a));
      const B = cmath.scale(cmath.mul(factorB, u), expMinusKa);

      r_complex = cmath.sub(cmath.add(A, B), cmath.make(1, 0));
    } else {
      // REGIME 3: Resonant Transmission (E > V0)
      k2 = Math.sqrt(2 * m * (E - V0)) / hbar;

      // Closed-form formula:
      // T = [1 + (V0^2 * sin^2(k2*a)) / (4*E*(E - V0))]^-1
      const sinK2a = Math.sin(k2 * a);
      const denomTerm = (V0 * V0 * sinK2a * sinK2a) / (4 * E * (E - V0));
      T = 1 / (1 + denomTerm);

      // Exact complex transmission amplitude:
      // t = e^(-i*k1*a) / [cos(k2*a) - i * ((k1^2 + k2^2) / (2*k1*k2)) * sin(k2*a)]
      const cosK2a = Math.cos(k2 * a);
      const factor = (k1 * k1 + k2 * k2) / (2 * k1 * k2);
      const denom = cmath.make(cosK2a, -factor * sinK2a);
      const num = cmath.exp(cmath.make(0, -k1 * a));
      t_complex = cmath.div(num, denom);

      const u = cmath.mul(t_complex, cmath.exp(cmath.make(0, k1 * a)));
      const factorA = (k2 + k1) / (2 * k2);
      const A = cmath.scale(cmath.mul(cmath.exp(cmath.make(0, -k2 * a)), u), factorA);

      const factorB = (k2 - k1) / (2 * k2);
      const B = cmath.scale(cmath.mul(cmath.exp(cmath.make(0, k2 * a)), u), factorB);

      r_complex = cmath.sub(cmath.add(A, B), cmath.make(1, 0));
    }

    // Unitarity & Numerical Clamp within [0, 1]
    T = Math.max(0, Math.min(1, T));
    const R = Math.max(0, Math.min(1, 1 - T));
    const t_mag = Math.sqrt(T);
    const logeT = T > 1e-25 ? Math.log(T) : -57.5;

    return {
      transmissionCoefficient_T: Number(T.toFixed(6)),
      transmittedAmplitude_t: Number(t_mag.toFixed(6)),
      transmittedAmplitude_magnitude_t: Number(t_mag.toFixed(6)),
      transmittedAmplitude_complex: t_complex,
      reflectionCoefficient_R: Number(R.toFixed(6)),
      reflectionAmplitude_complex: r_complex,
      attenuationConstant_kappa_per_m: kappa,
      attenuationConstant_kappa_per_A: kappa * 1e-10,
      waveNumber_k1_per_m: k1,
      waveNumber_k1_per_A: k1 * 1e-10,
      waveNumber_k2_per_m: k2,
      log_e_T: Number(logeT.toFixed(4)),
    };
  }

  computeDerived(readings: TunnelingReadings, params: TunnelingParams): TunnelingDerived {
    let regime: TunnelingDerived['tunnelingRegime'];
    if (Math.abs(params.particleEnergy_eV - params.barrierHeight_eV) < 0.01) {
      regime = 'Critical Energy (E = V0)';
    } else if (params.particleEnergy_eV < params.barrierHeight_eV) {
      regime = 'Sub-barrier Tunneling (E < V0)';
    } else {
      regime = 'Resonant Transmission (E > V0)';
    }

    const kappa = readings.attenuationConstant_kappa_per_m;
    const penetrationDepth_m = kappa > 0 ? 1 / kappa : Infinity;
    const penetrationDepth_nm = penetrationDepth_m * 1e9;
    const penetrationDepth_A = penetrationDepth_m * 1e10;

    // Critical transmission at E = V0
    const m = params.particleMass_kg ?? CONSTANTS.m_e;
    const V0_J = params.barrierHeight_eV * CONSTANTS.e;
    const a_m = params.barrierWidth_Angstrom * 1e-10;
    const critTerm = (m * V0_J * a_m * a_m) / (2 * CONSTANTS.hbar * CONSTANTS.hbar);
    const critT = 1 / (1 + critTerm);

    // de Broglie wavelength in region 1 & 3: lambda = 2*pi / k1
    const lambda_m = (2 * Math.PI) / readings.waveNumber_k1_per_m;
    const lambda_A = lambda_m * 1e10;

    return {
      tunnelingRegime: regime,
      penetrationDepth_nm: Number(penetrationDepth_nm.toFixed(4)),
      penetrationDepth_Angstrom: Number(penetrationDepth_A.toFixed(3)),
      decayRateInsideBarrier: Number(kappa.toExponential(3)),
      criticalTransmission_T_V0: Number(critT.toFixed(4)),
      deBroglieWavelength_Region1_A: Number(lambda_A.toFixed(3)),
      deBroglieWavelength_Region3_A: Number(lambda_A.toFixed(3)),
    };
  }

  /**
   * Generates exact, mathematically continuous wavefunction points ψ(x) across
   * Region I (x < 0), Region II (0 <= x <= a), and Region III (x > a),
   * replicating the exact visualization from manual p. 46 (Image176).
   */
  generateWavefunctionSpatialProfile(params: TunnelingParams, sampleCount = 240): WavefunctionPoint[] {
    const a_A = params.barrierWidth_Angstrom;
    const E_eV = params.particleEnergy_eV;
    const V0_eV = params.barrierHeight_eV;

    const a_m = a_A * 1e-10;

    const readings = this.calculateReadings(params);
    const k1 = readings.waveNumber_k1_per_m;
    const kappa = readings.attenuationConstant_kappa_per_m;
    const k2 = readings.waveNumber_k2_per_m;

    const t = readings.transmittedAmplitude_complex;
    const r = readings.reflectionAmplitude_complex;

    // Internal coefficients A and B inside Region II
    // u = t * e^(i * k1 * a)
    const phaseShift = cmath.exp(cmath.make(0, k1 * a_m));
    const u = cmath.mul(t, phaseShift);

    let A: Complex = { re: 0, im: 0 };
    let B: Complex = { re: 0, im: 0 };

    if (E_eV < V0_eV) {
      // Sub-barrier: A = ((kappa - i*k1)/(2*kappa)) * e^(kappa*a) * u
      const factorA = cmath.div(cmath.make(kappa, -k1), cmath.make(2 * kappa, 0));
      const expKa = Math.exp(Math.min(50, kappa * a_m));
      A = cmath.scale(cmath.mul(factorA, u), expKa);

      // B = ((kappa + i*k1)/(2*kappa)) * e^(-kappa*a) * u
      const factorB = cmath.div(cmath.make(kappa, k1), cmath.make(2 * kappa, 0));
      const expMinusKa = Math.exp(-Math.min(50, kappa * a_m));
      B = cmath.scale(cmath.mul(factorB, u), expMinusKa);
    } else if (E_eV > V0_eV) {
      // Over-barrier: A = ((k2 + k1)/(2*k2)) * e^(-i*k2*a) * u
      const factorA = (k2 + k1) / (2 * k2);
      const phaseMinusK2a = cmath.exp(cmath.make(0, -k2 * a_m));
      A = cmath.scale(cmath.mul(phaseMinusK2a, u), factorA);

      // B = ((k2 - k1)/(2*k2)) * e^(i*k2*a) * u
      const factorB = (k2 - k1) / (2 * k2);
      const phasePlusK2a = cmath.exp(cmath.make(0, k2 * a_m));
      B = cmath.scale(cmath.mul(phasePlusK2a, u), factorB);
    } else {
      // Critical E = V0: psi(x) = A*x + B
      // A = i*k1*u, B = (1 - i*k1*a)*u
      A = cmath.mul(cmath.make(0, k1), u);
      B = cmath.mul(cmath.make(1, -k1 * a_m), u);
    }

    const points: WavefunctionPoint[] = [];
    const xMin_A = -4.0;
    const xMax_A = Math.max(4.0, a_A + 2.5);

    for (let i = 0; i <= sampleCount; i++) {
      const x_A = xMin_A + ((xMax_A - xMin_A) * i) / sampleCount;
      const x_m = x_A * 1e-10;

      let psi: Complex;
      let reg: WavefunctionPoint['region'];
      let v_eV = 0;

      if (x_A < 0) {
        // REGION I: incident e^(i*k1*x) + reflected r*e^(-i*k1*x)
        reg = 'I';
        v_eV = 0;
        const inc = cmath.exp(cmath.make(0, k1 * x_m));
        const refPhase = cmath.exp(cmath.make(0, -k1 * x_m));
        const ref = cmath.mul(r, refPhase);
        psi = cmath.add(inc, ref);
      } else if (x_A <= a_A) {
        // REGION II: inside barrier
        reg = 'II';
        v_eV = V0_eV;
        if (E_eV < V0_eV) {
          // A * e^(-kappa*x) + B * e^(kappa*x)
          const term1 = cmath.scale(A, Math.exp(-Math.min(50, kappa * x_m)));
          const term2 = cmath.scale(B, Math.exp(Math.min(50, kappa * x_m)));
          psi = cmath.add(term1, term2);
        } else if (E_eV > V0_eV) {
          // A * e^(i*k2*x) + B * e^(-i*k2*x)
          const term1 = cmath.mul(A, cmath.exp(cmath.make(0, k2 * x_m)));
          const term2 = cmath.mul(B, cmath.exp(cmath.make(0, -k2 * x_m)));
          psi = cmath.add(term1, term2);
        } else {
          // Linear: A*x + B
          const term1 = cmath.scale(A, x_m);
          psi = cmath.add(term1, B);
        }
      } else {
        // REGION III: transmitted wave t * e^(i*k1*x)
        reg = 'III';
        v_eV = 0;
        const transPhase = cmath.exp(cmath.make(0, k1 * x_m));
        psi = cmath.mul(t, transPhase);
      }

      points.push({
        x_A: Number(x_A.toFixed(3)),
        psi_real: Number(psi.re.toFixed(4)),
        psi_imag: Number(psi.im.toFixed(4)),
        psi_probDensity: Number(cmath.abs2(psi).toFixed(4)),
        V_x_eV: v_eV,
        E_eV,
        region: reg,
      });
    }

    return points;
  }

  /**
   * Observation Table 1.1 (Manual p. 44):
   * Square of transmitted amplitude as a function of energy for fixed a = 1.5 Å and V0 = 6.0 eV.
   * 15 rows: E = 0.5 eV to 6.0 eV.
   */
  generateObservationTable1_1(): TableRow_T_vs_E[] {
    const a_A = 1.5;
    const V0_eV = 6.0;
    const energies_eV = [
      0.5, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 4.8, 5.2, 5.6, 6.0,
    ];

    return energies_eV.map((e, idx) => {
      const readings = this.calculateReadings({
        particleEnergy_eV: e,
        barrierHeight_eV: V0_eV,
        barrierWidth_Angstrom: a_A,
      });

      return {
        slNo: idx + 1,
        energy_eV: e,
        transmittedAmplitude_t: readings.transmittedAmplitude_magnitude_t,
        T_observed: readings.transmissionCoefficient_T,
        T_calculated: readings.transmissionCoefficient_T,
      };
    });
  }

  /**
   * Observation Table 1.2 (Manual p. 45):
   * Square of transmitted amplitude as a function of energy for wider barrier a = 2.0 Å and V0 = 6.0 eV.
   */
  generateObservationTable1_2(): TableRow_T_vs_E[] {
    const a_A = 2.0;
    const V0_eV = 6.0;
    const energies_eV = [
      0.5, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 4.8, 5.2, 5.6, 6.0,
    ];

    return energies_eV.map((e, idx) => {
      const readings = this.calculateReadings({
        particleEnergy_eV: e,
        barrierHeight_eV: V0_eV,
        barrierWidth_Angstrom: a_A,
      });

      return {
        slNo: idx + 1,
        energy_eV: e,
        transmittedAmplitude_t: readings.transmittedAmplitude_magnitude_t,
        T_observed: readings.transmissionCoefficient_T,
        T_calculated: readings.transmissionCoefficient_T,
      };
    });
  }

  /**
   * Observation Table 2.1 (Manual p. 46):
   * Plot T vs a for fixed E = 2.0 eV and V0 = 6.0 eV.
   * 15 rows: a = 0.5 Å to 4.0 Å.
   */
  generateObservationTable2_1(): TableRow_T_vs_a[] {
    const E_eV = 2.0;
    const V0_eV = 6.0;
    const widths_A = [
      0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.8, 3.1, 3.5, 4.0,
    ];

    return widths_A.map((w, idx) => {
      const readings = this.calculateReadings({
        particleEnergy_eV: E_eV,
        barrierHeight_eV: V0_eV,
        barrierWidth_Angstrom: w,
      });

      return {
        slNo: idx + 1,
        barrierWidth_a_A: w,
        transmittedAmplitude_t: readings.transmittedAmplitude_magnitude_t,
        T_observed: readings.transmissionCoefficient_T,
        T_calculated: readings.transmissionCoefficient_T,
        log_e_T: readings.log_e_T,
      };
    });
  }

  /**
   * Observation Table 2.2 (Manual p. 47):
   * Width (a), Transmitted Amplitude (t), T observed, T calculated, log_e(T).
   * Fixed E = 3.0 eV and V0 = 6.0 eV.
   */
  generateObservationTable2_2(): TableRow_T_vs_a[] {
    const E_eV = 3.0;
    const V0_eV = 6.0;
    const widths_A = [
      0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0,
    ];

    return widths_A.map((w, idx) => {
      const readings = this.calculateReadings({
        particleEnergy_eV: E_eV,
        barrierHeight_eV: V0_eV,
        barrierWidth_Angstrom: w,
      });

      return {
        slNo: idx + 1,
        barrierWidth_a_A: w,
        transmittedAmplitude_t: readings.transmittedAmplitude_magnitude_t,
        T_observed: readings.transmissionCoefficient_T,
        T_calculated: readings.transmissionCoefficient_T,
        log_e_T: readings.log_e_T,
      };
    });
  }

  /**
   * Continuous T vs E curve dataset across 0.1 eV to 10 eV.
   */
  generateTransmissionVsEnergyCurve(params: TunnelingParams, sampleCount = 100): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const maxE = Math.max(10.0, params.barrierHeight_eV * 1.8);

    for (let i = 0; i <= sampleCount; i++) {
      const e = 0.1 + ((maxE - 0.1) * i) / sampleCount;
      const res = this.calculateReadings({ ...params, particleEnergy_eV: e });
      points.push({
        x: Number(e.toFixed(2)),
        y: res.transmissionCoefficient_T,
      });
    }

    return points;
  }

  /**
   * Continuous T vs Width (a) curve dataset across 0.2 Å to 5.0 Å.
   */
  generateTransmissionVsWidthCurve(params: TunnelingParams, sampleCount = 80): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= sampleCount; i++) {
      const a = 0.2 + (4.8 * i) / sampleCount;
      const res = this.calculateReadings({ ...params, barrierWidth_Angstrom: a });
      points.push({
        x: Number(a.toFixed(2)),
        y: res.transmissionCoefficient_T,
      });
    }

    return points;
  }

  /**
   * Generates continuous ln(T) vs a curve dataset.
   */
  generateLogTVsWidthCurve(params: TunnelingParams, sampleCount = 80): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= sampleCount; i++) {
      const a = 0.2 + (4.8 * i) / sampleCount;
      const res = this.calculateReadings({ ...params, barrierWidth_Angstrom: a });
      points.push({
        x: Number(a.toFixed(2)),
        y: res.log_e_T,
      });
    }

    return points;
  }

  /**
   * Generates spatial wavefunction model points for generic graph components.
   */
  generateModelCurve(params: TunnelingParams, count = 80): Array<{ x: number; y: number }> {
    const profile = this.generateWavefunctionSpatialProfile(params, count);
    return profile.map((p) => ({ x: p.x_A, y: p.psi_real }));
  }

  /**
   * Standard Python Jupyter notebook source code for student export and local execution.
   */
  generatePythonSourceCode(params: TunnelingParams): string {
    return `# ==============================================================================
# VIT CHENNAI - BAPHY105: PHYSICS LABORATORY
# EXPERIMENT 4: SIMULATING QUANTUM TUNNELING THROUGH A POTENTIAL BARRIER
# ==============================================================================
# Instructions:
# Run this script in Jupyter Notebook or Python IDE with: pip install numpy matplotlib scipy

import numpy as np
import matplotlib.pyplot as plt

# ------------------------------------------------------------------------------
# 1. PHYSICAL CONSTANTS (SI Units)
# ------------------------------------------------------------------------------
hbar = 1.054571817e-34    # Reduced Planck's constant (J s)
m_e  = 9.1093837e-31      # Mass of electron (kg)
e_ch = 1.602176634e-19    # Elementary charge (C)

# ------------------------------------------------------------------------------
# 2. DEFAULT EXPERIMENT PARAMETERS (Manual pp. 43-46)
# ------------------------------------------------------------------------------
E_eV  = ${params.particleEnergy_eV.toFixed(2)}    # Particle energy E (eV)
V0_eV = ${params.barrierHeight_eV.toFixed(2)}    # Barrier height V0 (eV)
a_A   = ${params.barrierWidth_Angstrom.toFixed(2)}    # Barrier width a (Angstroms)

E  = E_eV * e_ch          # Convert to Joules
V0 = V0_eV * e_ch         # Convert to Joules
a  = a_A * 1e-10          # Convert to metres

# ------------------------------------------------------------------------------
# 3. EXACT 1D SCHRODINGER BOUNDARY MATCHING SOLVER
# ------------------------------------------------------------------------------
k1 = np.sqrt(2.0 * m_e * E) / hbar

if E < V0:
    kappa = np.sqrt(2.0 * m_e * (V0 - E)) / hbar
    # Analytical Transmission Coefficient T (Manual p. 45):
    sinh_term = np.sinh(kappa * a)
    T = 1.0 / (1.0 + (V0**2 * sinh_term**2) / (4.0 * E * (V0 - E)))
    
    # Boundary matching complex amplitudes:
    cosh_term = np.cosh(kappa * a)
    factor = (kappa**2 - k1**2) / (2.0 * kappa * k1)
    denom = cosh_term + 1j * factor * sinh_term
    t = np.exp(-1j * k1 * a) / denom
    r = (1j * (kappa**2 + k1**2) / (2.0 * kappa * k1) * sinh_term) / denom
    
    u = t * np.exp(1j * k1 * a)
    A = ((kappa - 1j * k1) / (2.0 * kappa)) * np.exp(kappa * a) * u
    B = ((kappa + 1j * k1) / (2.0 * kappa)) * np.exp(-kappa * a) * u
elif E > V0:
    k2 = np.sqrt(2.0 * m_e * (E - V0)) / hbar
    sin_term = np.sin(k2 * a)
    T = 1.0 / (1.0 + (V0**2 * sin_term**2) / (4.0 * E * (E - V0)))
    
    cos_term = np.cos(k2 * a)
    factor = (k1**2 + k2**2) / (2.0 * k1 * k2)
    denom = cos_term - 1j * factor * sin_term
    t = np.exp(-1j * k1 * a) / denom
    r = (1j * (k1**2 - k2**2) / (2.0 * k1 * k2) * sin_term) / denom
    
    u = t * np.exp(1j * k1 * a)
    A = ((k2 + k1) / (2.0 * k2)) * np.exp(-1j * k2 * a) * u
    B = ((k2 - k1) / (2.0 * k2)) * np.exp(1j * k2 * a) * u
else:
    # Critical Limit E == V0
    T = 1.0 / (1.0 + (m_e * V0 * a**2) / (2.0 * hbar**2))
    denom = 1.0 - 1j * (k1 * a) / 2.0
    t = np.exp(-1j * k1 * a) / denom
    r = (1j * (k1 * a) / 2.0) / denom

print("=== QUANTUM TUNNELING RESULTS ===")
print(f"Energy E              = {E_eV:.2f} eV")
print(f"Barrier Height V0     = {V0_eV:.2f} eV")
print(f"Barrier Width a       = {a_A:.2f} Angstrom")
print(f"Transmission Coeff T  = {T:.6f} (|t|^2)")
print(f"Transmitted Amp |t|   = {np.abs(t):.6f}")
print(f"Reflection Coeff R    = {1.0 - T:.6f} (|r|^2)")

# ------------------------------------------------------------------------------
# 4. PLOT WAVEFUNCTION & POTENTIAL PROFILE (Manual p. 46 Image 176)
# ------------------------------------------------------------------------------
x_A = np.linspace(-4.0, a_A + 3.0, 600)
x_m = x_A * 1e-10

psi_real = np.zeros_like(x_A)
V_plot   = np.zeros_like(x_A)

for i, xm in enumerate(x_m):
    xa = x_A[i]
    if xa < 0:
        # Region I
        psi_val = np.exp(1j * k1 * xm) + r * np.exp(-1j * k1 * xm)
        V_plot[i] = 0.0
    elif xa <= a_A:
        # Region II
        if E < V0:
            psi_val = A * np.exp(-kappa * xm) + B * np.exp(kappa * xm)
        elif E > V0:
            psi_val = A * np.exp(1j * k2 * xm) + B * np.exp(-1j * k2 * xm)
        else:
            psi_val = (1j * k1 * u) * xm + (1.0 - 1j * k1 * a) * u
        V_plot[i] = V0_eV
    else:
        # Region III
        psi_val = t * np.exp(1j * k1 * xm)
        V_plot[i] = 0.0
    psi_real[i] = np.real(psi_val)

fig, ax1 = plt.subplots(figsize=(9, 4.5))

color = 'royalblue'
ax1.set_xlabel('x (Å)', fontsize=11, fontweight='bold')
ax1.set_ylabel('Wavefunction amplitude', color=color, fontsize=11, fontweight='bold')
ax1.plot(x_A, psi_real, color=color, lw=1.6, label='Re(ψ)')
ax1.tick_params(axis='y', labelcolor=color)
ax1.set_ylim(-1.2, 1.2)
ax1.grid(True, which='both', linestyle=':', alpha=0.6)

# Shading for barrier region (Region II)
ax1.axvspan(0, a_A, color='lightgray', alpha=0.5, label='Barrier (Region II)')

# Secondary y-axis for Potential Energy & Energy level
ax2 = ax1.twinx()
ax2.set_ylabel('Potential Energy (eV)', color='magenta', fontsize=11, fontweight='bold')
ax2.step(x_A, V_plot, color='magenta', linestyle='--', lw=1.5, label='V(x)')
ax2.axhline(E_eV, color='green', linestyle='--', lw=1.5, label=f'E = {E_eV} eV')
ax2.tick_params(axis='y', labelcolor='magenta')
ax2.set_ylim(-0.5, max(V0_eV * 1.5, 10.0))

plt.title('Quantum Tunneling: Wavefunction and Barrier', fontsize=13, fontweight='bold')
fig.tight_layout()
plt.show()
`;
  }
}

export const tunnelingEngine = new TunnelingEngine();
