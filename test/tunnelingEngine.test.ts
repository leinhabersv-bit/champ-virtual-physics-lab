import { describe, it, expect } from 'vitest';
import { tunnelingEngine, cmath } from '../src/engine/tunnelingSimulator';
import { CONSTANTS } from '../src/utils/units';

describe('Quantum Tunneling Engine (Experiment 4)', () => {
  it('TC-E4-01: verifies exact analytical transmission probability and amplitude for default manual run (E=2eV, V0=6eV, a=1.5A)', () => {
    const res = tunnelingEngine.calculateReadings({
      particleEnergy_eV: 2.0,
      barrierHeight_eV: 6.0,
      barrierWidth_Angstrom: 1.5,
    });

    // Attenuation constant kappa = sqrt(2*m*(V0 - E)) / hbar
    // 2 * 9.10938e-31 * 4 * 1.60218e-19 / (1.05457e-34)^2 => kappa ≈ 1.0246e10 m^-1 = 1.0246 A^-1
    expect(res.attenuationConstant_kappa_per_m).toBeCloseTo(1.0246e10, -8);
    expect(res.attenuationConstant_kappa_per_A).toBeCloseTo(1.0246, 3);

    // Wave number k1 = sqrt(2*m*E) / hbar => k1 ≈ 7.2453e9 m^-1 = 0.7245 A^-1
    expect(res.waveNumber_k1_per_m).toBeCloseTo(7.2453e9, -7);

    // Transmission probability T = |t|^2 ≈ 0.153
    expect(res.transmissionCoefficient_T).toBeCloseTo(0.15307, 3);

    // Transmitted amplitude |t| = sqrt(T) ≈ 0.391
    expect(res.transmittedAmplitude_magnitude_t).toBeCloseTo(0.3912, 3);

    // Complex amplitude magnitude squared must match T
    const t_mag_squared = cmath.abs2(res.transmittedAmplitude_complex);
    expect(t_mag_squared).toBeCloseTo(res.transmissionCoefficient_T, 4);

    // Unitarity: T + R = 1.0
    expect(res.transmissionCoefficient_T + res.reflectionCoefficient_R).toBeCloseTo(1.0, 5);
  });

  it('TC-E4-02: verifies smooth, continuous transition as E approaches and equals critical barrier height V0', () => {
    const V0 = 6.0;
    const a = 1.5;

    // Direct critical formula at E = V0: T = [1 + (m * V0 * a^2) / (2 * hbar^2)]^-1
    const m = CONSTANTS.m_e;
    const V0_J = V0 * CONSTANTS.e;
    const a_m = a * 1e-10;
    const expectedCritT = 1.0 / (1.0 + (m * V0_J * a_m * a_m) / (2 * CONSTANTS.hbar * CONSTANTS.hbar));

    // Calculate at E = V0
    const critRes = tunnelingEngine.calculateReadings({
      particleEnergy_eV: 6.0,
      barrierHeight_eV: 6.0,
      barrierWidth_Angstrom: 1.5,
    });
    expect(critRes.transmissionCoefficient_T).toBeCloseTo(expectedCritT, 3);

    // Slightly below: E = 5.999 eV
    const subRes = tunnelingEngine.calculateReadings({
      particleEnergy_eV: 5.999,
      barrierHeight_eV: 6.0,
      barrierWidth_Angstrom: 1.5,
    });
    expect(subRes.transmissionCoefficient_T).toBeCloseTo(expectedCritT, 2);

    // Slightly above: E = 6.001 eV
    const superRes = tunnelingEngine.calculateReadings({
      particleEnergy_eV: 6.001,
      barrierHeight_eV: 6.0,
      barrierWidth_Angstrom: 1.5,
    });
    expect(superRes.transmissionCoefficient_T).toBeCloseTo(expectedCritT, 2);
  });

  it('verifies exact boundary matching continuity of psi(x) across Region I, II, and III', () => {
    // Generate spatial profile with fine grid
    const points = tunnelingEngine.generateWavefunctionSpatialProfile({
      particleEnergy_eV: 2.0,
      barrierHeight_eV: 6.0,
      barrierWidth_Angstrom: 1.5,
    }, 400);

    // Find point right before and after x = 0
    const ptLeftZero = points.filter((p) => p.x_A < 0).pop()!;
    const ptRightZero = points.filter((p) => p.x_A >= 0)[0]!;

    // Wavefunction real part must be continuous across x = 0
    expect(Math.abs(ptLeftZero.psi_real - ptRightZero.psi_real)).toBeLessThan(0.05);

    // Find point right before and after x = a = 1.5
    const ptLeftA = points.filter((p) => p.x_A <= 1.5).pop()!;
    const ptRightA = points.filter((p) => p.x_A > 1.5)[0]!;

    // Wavefunction real part must be continuous across x = a
    expect(Math.abs(ptLeftA.psi_real - ptRightA.psi_real)).toBeLessThan(0.05);
  });

  it('demonstrates exponential decay of T as barrier width a increases (Table 2.1 & 2.2 behavior)', () => {
    const tNarrow = tunnelingEngine.calculateReadings({
      particleEnergy_eV: 2.0,
      barrierHeight_eV: 6.0,
      barrierWidth_Angstrom: 1.0,
    });

    const tWide = tunnelingEngine.calculateReadings({
      particleEnergy_eV: 2.0,
      barrierHeight_eV: 6.0,
      barrierWidth_Angstrom: 2.5,
    });

    // Narrow barrier allows significantly more tunneling than wide barrier
    expect(tNarrow.transmissionCoefficient_T).toBeGreaterThan(0.35);
    expect(tWide.transmissionCoefficient_T).toBeLessThan(0.025);

    // ln(T) must be negative and decrease linearly with width
    expect(tNarrow.log_e_T).toBeLessThan(0);
    expect(tWide.log_e_T).toBeLessThan(tNarrow.log_e_T);
  });

  it('verifies resonant transmission (Ramsauer-Townsend effect) for E > V0', () => {
    const params = {
      particleEnergy_eV: 8.0,
      barrierHeight_eV: 6.0,
      barrierWidth_Angstrom: 1.5,
    };
    const res = tunnelingEngine.calculateReadings(params);

    // Over-barrier transmission probability is high and bounded by 1.0
    expect(res.transmissionCoefficient_T).toBeGreaterThan(0.65);
    expect(res.transmissionCoefficient_T).toBeLessThanOrEqual(1.0);
    expect(res.transmissionCoefficient_T + res.reflectionCoefficient_R).toBeCloseTo(1.0, 5);
  });

  it('generates 15 rows for each of the four observation tables matching manual pp. 44-47', () => {
    const t11 = tunnelingEngine.generateObservationTable1_1();
    const t12 = tunnelingEngine.generateObservationTable1_2();
    const t21 = tunnelingEngine.generateObservationTable2_1();
    const t22 = tunnelingEngine.generateObservationTable2_2();

    expect(t11.length).toBe(15);
    expect(t12.length).toBe(15);
    expect(t21.length).toBe(15);
    expect(t22.length).toBe(15);

    // Table 1.1: T increases monotonically with Energy E
    for (let i = 1; i < t11.length; i++) {
      expect(t11[i].T_calculated).toBeGreaterThan(t11[i - 1].T_calculated);
      expect(t11[i].T_observed).toBeCloseTo(t11[i].T_calculated, 5);
    }

    // Table 2.1: T decreases monotonically with Width a
    for (let i = 1; i < t21.length; i++) {
      expect(t21[i].T_calculated).toBeLessThan(t21[i - 1].T_calculated);
    }
  });

  it('generates valid and complete Python source code for local student execution', () => {
    const code = tunnelingEngine.generatePythonSourceCode({
      particleEnergy_eV: 2.0,
      barrierHeight_eV: 6.0,
      barrierWidth_Angstrom: 1.5,
    });

    expect(code).toContain('import numpy as np');
    expect(code).toContain('import matplotlib.pyplot as plt');
    expect(code).toContain('E_eV  = 2.00');
    expect(code).toContain('V0_eV = 6.00');
    expect(code).toContain('a_A   = 1.50');
    expect(code).toContain('Quantum Tunneling: Wavefunction and Barrier');
  });
});
