import { describe, it, expect } from 'vitest';
import {
  CONSTANTS_E8,
  calculateDiffractionIntensity,
  calculateMinimaPositions,
  generateTable1Scan,
  generateTable2Orders,
  generateTable3Uncertainty,
  heisenbergEngine,
  AMBIGUITIES_E8,
} from '../src/engine/heisenbergSimulator';

describe('Heisenberg Single-Slit Uncertainty Engine (Experiment 8)', () => {
  it('TC-E8-01: verifies Fraunhofer diffraction intensity profile and peak current', () => {
    // Peak at y = 0
    const center = calculateDiffractionIntensity(0.0, 40.0, 1000.0, 650.0);
    expect(center.current_uA).toBe(CONSTANTS_E8.PEAK_OUTPUT_CURRENT_UA);

    // Drops to minimum near a1 = 16.25 mm
    const nearMin = calculateDiffractionIntensity(16.25, 40.0, 1000.0, 650.0);
    expect(nearMin.current_uA).toBeLessThan(0.1);

    // Symmetric intensity: I(-y) == I(+y)
    const left = calculateDiffractionIntensity(-8.0, 40.0, 1000.0, 650.0);
    const right = calculateDiffractionIntensity(8.0, 40.0, 1000.0, 650.0);
    expect(left.current_uA).toBeCloseTo(right.current_uA, 2);
  });

  it('TC-E8-02: calculates exact positions of multi-order diffraction minima', () => {
    // d = 40 um, lambda = 650 nm, D = 1000 mm
    // sin(theta_1) = 650e-9 / 40e-6 = 0.01625
    // a1 = D * tan(theta_1) ~ 16.25 mm
    const minima = calculateMinimaPositions(40.0, 1000.0, 650.0);
    expect(minima.a1_mm).toBeCloseTo(16.25, 1);
    expect(minima.a2_mm).toBeCloseTo(32.55, 1);
    expect(minima.a3_mm).toBeCloseTo(48.81, 1);
    expect(minima.theta1_deg).toBeGreaterThan(0.9);
    expect(minima.theta1_deg).toBeLessThan(1.0);
  });

  it('TC-E8-03: verifies inverse relationship: narrower slit broadens diffraction pattern', () => {
    const narrowMin = calculateMinimaPositions(30.0, 1000.0, 650.0);
    const wideMin = calculateMinimaPositions(80.0, 1000.0, 650.0);

    // Squeezing slit width (30 um vs 80 um) dramatically spreads out beam
    expect(narrowMin.a1_mm).toBeGreaterThan(wideMin.a1_mm);
    expect(narrowMin.a1_mm).toBeCloseTo(21.67, 1);
    expect(wideMin.a1_mm).toBeCloseTo(8.13, 1);
  });

  it('TC-E8-04: verifies Heisenberg uncertainty principle product Delta y * Delta p_y = h', () => {
    const params = {
      slitWidth_um: 40.0,
      wavelength_nm: 650.0,
      screenDistance_mm: 1000.0,
      micrometerPos_mm: 0.0,
    };
    const readings = heisenbergEngine.calculateReadings(params);
    const derived = heisenbergEngine.computeDerived(readings, params);

    // Delta y = d = 40 um = 4e-5 m
    expect(derived.delta_y_m).toBeCloseTo(40.0e-6, 8);

    // Incident photon momentum: p_x = h / lambda = 6.626e-34 / 650e-9 ~ 1.019e-27 kg*m/s
    expect(derived.p_x_kg_m_s).toBeCloseTo(1.0194e-27, 30);

    // Dimensionless factor (d / lambda) * sin(theta_1) = 1.0 (Manual eq. 11)
    expect(derived.dimensionlessTest).toBeCloseTo(1.0, 3);

    // Product Delta y * Delta p_y = h
    expect(derived.uncertaintyProduct).toBeCloseTo(CONSTANTS_E8.h, 36);
    expect(derived.ratioToPlanckConstant).toBeCloseTo(1.0, 3);

    // Strictly satisfies quantum lower bound Delta y * Delta p_y >= h / 4pi
    expect(derived.ratioToHeisenbergLimit).toBeGreaterThan(10.0);
  });

  it('TC-E8-05: verifies momentum uncertainty increases as slit width decreases across multiple slits', () => {
    const table3 = generateTable3Uncertainty([40.0, 80.0, 120.0], 1000.0, 650.0);
    expect(table3).toHaveLength(3);

    // 40 um slit has larger Delta p_y than 120 um slit
    expect(table3[0].delta_p_y_kg_m_s).toBeGreaterThan(table3[1].delta_p_y_kg_m_s);
    expect(table3[1].delta_p_y_kg_m_s).toBeGreaterThan(table3[2].delta_p_y_kg_m_s);

    // Uncertainty product is invariant and approximately h across all slits
    table3.forEach((row) => {
      expect(row.dimensionlessFactor).toBeCloseTo(1.0, 2);
      expect(row.uncertaintyProduct_J_s).toBeCloseTo(CONSTANTS_E8.h, 35);
    });
  });

  it('TC-E8-06: verifies observation tables 1, 2, and 3 generator functions', () => {
    // Table 1: Micrometer scan
    const t1 = generateTable1Scan(40.0, 1000.0, 15.0, 1.0);
    expect(t1.length).toBe(31); // -15 to +15 step 1
    const centerPt = t1.find((r) => r.micrometerReading_mm === 0);
    expect(centerPt?.outputCurrent_uA).toBe(85.0);

    // Table 2: Multi-order minima
    const t2 = generateTable2Orders(40.0, 1000.0);
    expect(t2).toHaveLength(3);
    t2.forEach((r) => {
      expect(r.d_calculated_um).toBeCloseTo(40.0, 0);
    });

    // Table 3: Uncertainty verification
    const t3 = generateTable3Uncertainty([40.0, 80.0, 120.0]);
    expect(t3).toHaveLength(3);
  });

  it('TC-E8-07: documents AMB-06 and AMB-07 manual inconsistencies', () => {
    expect(AMBIGUITIES_E8).toHaveLength(2);
    const amb06 = AMBIGUITIES_E8.find((a) => a.id === 'AMB-06');
    const amb07 = AMBIGUITIES_E8.find((a) => a.id === 'AMB-07');
    expect(amb06?.sourceText).toContain('Distance between the detector and screen');
    expect(amb07?.sourceText).toContain('h / 4π');
  });
});
