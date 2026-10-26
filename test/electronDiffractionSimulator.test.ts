import { describe, it, expect } from 'vitest';
import {
  CONSTANTS_E7,
  calculateDeBroglieWavelength,
  calculateRingDiameterExact,
  calculateRingDiameterSmallAngle,
  calculateBraggWavelengthExact,
  calculateBraggWavelengthApprox,
  decomposeVernierReading,
  generateObservationTable,
  electronDiffractionEngine,
  AMBIGUITIES_E7,
} from '../src/engine/electronDiffractionSimulator';

describe('Electron Diffraction & de Broglie Engine (Experiment 7)', () => {
  it('TC-E7-01: verifies de Broglie wavelength at 4 kV matches theoretical value', () => {
    // At V = 4000 V:
    // lambda = h / sqrt(2 * me * e * V)
    // lambda ~ 0.01939 nm = 0.1939 Angstrom
    const res = calculateDeBroglieWavelength(4000);
    expect(res.lambda_nm).toBeGreaterThan(0.019);
    expect(res.lambda_nm).toBeLessThan(0.020);
    expect(res.lambda_angstrom).toBeCloseTo(0.1939, 2);
    expect(res.momentum_kg_m_s).toBeGreaterThan(3.3e-23);
    expect(res.momentum_kg_m_s).toBeLessThan(3.5e-23);
  });

  it('TC-E7-02: verifies inverse square-root voltage dependence D ~ 1/sqrt(V)', () => {
    const voltages = [2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
    const diameters: { V: number; D1: number; D2: number; product1: number }[] = [];

    voltages.forEach((V_kV) => {
      const readings = electronDiffractionEngine.calculateReadings({
        anodeVoltage_kV: V_kV,
        screenDistance_mm: 135.0,
        heaterOn: true,
        heaterWarmupPercent: 100,
      });

      // Product D * sqrt(V) should remain approximately constant
      const product1 = readings.ring1Diameter_mm * Math.sqrt(V_kV);
      diameters.push({
        V: V_kV,
        D1: readings.ring1Diameter_mm,
        D2: readings.ring2Diameter_mm,
        product1,
      });
    });

    // Ring diameters strictly decrease as voltage increases
    for (let i = 0; i < diameters.length - 1; i++) {
      expect(diameters[i].D1).toBeGreaterThan(diameters[i + 1].D1);
      expect(diameters[i].D2).toBeGreaterThan(diameters[i + 1].D2);
      // D * sqrt(V) constancy within 1% (slight variation due to exact tan(2θ) vs 2θ)
      expect(diameters[i].product1).toBeCloseTo(diameters[i + 1].product1, 0);
    }
  });

  it('TC-E7-03: verifies dual ring hierarchy: d1=0.213 nm (Inner) vs d2=0.123 nm (Outer)', () => {
    const readings = electronDiffractionEngine.calculateReadings({
      anodeVoltage_kV: 4.0,
      screenDistance_mm: 135.0,
      heaterOn: true,
      heaterWarmupPercent: 100,
    });

    // Ring 1 (d1 = 0.213 nm) produces smaller diffraction angle and diameter
    // Ring 2 (d2 = 0.123 nm) produces larger diffraction angle and diameter
    expect(readings.ring1Diameter_mm).toBeLessThan(readings.ring2Diameter_mm);
    expect(readings.ring1Diameter_mm).toBeGreaterThan(20);
    expect(readings.ring1Diameter_mm).toBeLessThan(30);
    expect(readings.ring2Diameter_mm).toBeGreaterThan(35);
    expect(readings.ring2Diameter_mm).toBeLessThan(50);

    expect(readings.theta1_deg).toBeLessThan(readings.theta2_deg);
  });

  it('TC-E7-04: verifies exact Bragg wavelength matches de Broglie wavelength within 0.1%', () => {
    const V = 4000;
    const { lambda_m } = calculateDeBroglieWavelength(V);
    const d1_m = CONSTANTS_E7.D1_LATTICE_SPACING_M;
    const L_m = CONSTANTS_E7.L_DEFAULT_M;

    const D1_mm = calculateRingDiameterExact(lambda_m, d1_m, L_m);
    const bragg_m = calculateBraggWavelengthExact(D1_mm, d1_m, CONSTANTS_E7.L_DEFAULT_MM);

    // Exact Bragg derivation must match de Broglie identically
    const diffPercent = Math.abs((bragg_m - lambda_m) / lambda_m) * 100;
    expect(diffPercent).toBeLessThan(0.01);

    // Small angle approximation check
    const D1_approx_mm = calculateRingDiameterSmallAngle(lambda_m, d1_m, L_m);
    expect(Math.abs(D1_approx_mm - D1_mm)).toBeLessThan(0.2); // within 0.2 mm

    const bragg_approx_m = calculateBraggWavelengthApprox(D1_mm, d1_m, CONSTANTS_E7.L_DEFAULT_MM);
    const approxDiffPercent = Math.abs((bragg_approx_m - lambda_m) / lambda_m) * 100;
    expect(approxDiffPercent).toBeLessThan(0.6); // < 0.6% error for theta ~ 2.6 deg
  });

  it('TC-E7-05: verifies electron kinetic energy calculation in eV and Joules', () => {
    const readings = electronDiffractionEngine.calculateReadings({
      anodeVoltage_kV: 4.0,
      screenDistance_mm: 135.0,
      heaterOn: true,
      heaterWarmupPercent: 100,
    });

    const derived = electronDiffractionEngine.computeDerived(readings, {
      anodeVoltage_kV: 4.0,
      screenDistance_mm: 135.0,
      heaterOn: true,
      heaterWarmupPercent: 100,
    });

    expect(derived.kineticEnergy_eV).toBe(4000);
    expect(derived.kineticEnergy_J).toBeCloseTo(4000 * 1.60217663e-19, 21);
    expect(derived.electronVelocity_m_s).toBeGreaterThan(3.5e7);
    expect(derived.electronVelocity_m_s).toBeLessThan(4.0e7);
    expect(derived.relativisticBeta).toBeCloseTo(0.125, 2);
    expect(derived.relativisticGamma).toBeCloseTo(1.008, 3);
  });

  it('TC-E7-06: verifies Vernier caliper decomposition (MSR, VSC, TR)', () => {
    const D = 24.66;
    const v = decomposeVernierReading(D, 0.1);
    expect(v.msr).toBe(24);
    expect(v.vsc).toBe(7);
    expect(v.tr).toBe(24.7);
  });

  it('TC-E7-07: verifies cathode heater thermal stabilization behavior', () => {
    // Cold heater
    const cold = electronDiffractionEngine.calculateReadings({
      anodeVoltage_kV: 4.0,
      screenDistance_mm: 135.0,
      heaterOn: false,
      heaterWarmupPercent: 0,
    });
    expect(cold.deBroglieWavelength_nm).toBe(0);
    expect(cold.ring1Diameter_mm).toBe(0);
    expect(cold.anodeCurrent_uA).toBe(0);
    expect(cold.isStable).toBe(false);

    // Warm stabilized heater
    const warm = electronDiffractionEngine.calculateReadings({
      anodeVoltage_kV: 4.0,
      screenDistance_mm: 135.0,
      heaterOn: true,
      heaterWarmupPercent: 100,
    });
    expect(warm.ring1Diameter_mm).toBeGreaterThan(0);
    expect(warm.anodeCurrent_uA).toBeGreaterThan(50);
    expect(warm.isStable).toBe(true);
  });

  it('TC-E7-08: verifies observation table generator produces 5 rows with complete data', () => {
    const table = generateObservationTable([3.0, 3.5, 4.0, 4.5, 5.0], 135.0);
    expect(table).toHaveLength(5);

    table.forEach((row, idx) => {
      expect(row.sNo).toBe(idx + 1);
      expect(row.voltage_kV).toBeGreaterThan(0);
      expect(row.ring1.tr_mm).toBeGreaterThan(0);
      expect(row.ring2.tr_mm).toBeGreaterThan(row.ring1.tr_mm);
      expect(row.ring1.tan2Theta).toBeGreaterThan(0);
      expect(row.ring1.theta_deg).toBeGreaterThan(0);
      expect(row.ring1.braggLambda_m).toBeGreaterThan(0);
      expect(row.ring1.deBroglieLambda_m).toBeGreaterThan(0);
      expect(row.ring1.discrepancyPercent).toBeLessThan(1.0);
      expect(row.kineticEnergy_eV).toBe(row.voltage_kV * 1000);
    });
  });

  it('TC-E7-09: documents AMB-04 and AMB-05 manual ambiguities', () => {
    expect(AMBIGUITIES_E7).toHaveLength(2);
    const amb04 = AMBIGUITIES_E7.find((a) => a.id === 'AMB-04');
    const amb05 = AMBIGUITIES_E7.find((a) => a.id === 'AMB-05');
    expect(amb04?.sourceText).toContain('0.5V');
    expect(amb05?.sourceText).toContain('Outer diameter: d=0.213nm');
  });
});
