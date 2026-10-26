import { describe, it, expect } from 'vitest';
import {
  sodiumGratingEngine,
  decomposeAngleToVernier,
  circularDistance,
  toDMS,
} from '../src/engine/sodiumGratingEngine';

describe('Sodium Grating Minimum Deviation Engine (Experiment 5)', () => {
  it('TC-E5-01: calculates grating element (e + d) accurately for 15,000 LPI', () => {
    const gratingElement = sodiumGratingEngine.calculateGratingElement(15000);
    // (e + d) = 2.54e-2 / 15000 = 1.69333e-6 m = 16,933.3 Å
    expect(gratingElement).toBeCloseTo(1.693333e-6, 9);
    expect(gratingElement * 1e10).toBeCloseTo(16933.33, 1);
  });

  it('TC-E5-02: calculates minimum deviation angle Dm for Yellow 1 and Yellow 2', () => {
    // Yellow 1 (D1): 589.6 nm
    const Dm_Y1 = sodiumGratingEngine.calculateMinimumDeviationAngle(589.6, 15000, 1);
    expect(Dm_Y1).toBeCloseTo(20.052, 2);
    const dms_Y1 = toDMS(Dm_Y1);
    expect(dms_Y1.degrees).toBe(20);
    expect(dms_Y1.minutes).toBe(3);

    // Yellow 2 (D2): 589.0 nm
    const Dm_Y2 = sodiumGratingEngine.calculateMinimumDeviationAngle(589.0, 15000, 1);
    expect(Dm_Y2).toBeCloseTo(20.0318, 3);
    const dms_Y2 = toDMS(Dm_Y2);
    expect(dms_Y2.degrees).toBe(20);
    expect(dms_Y2.minutes).toBe(1);

    // D1 has larger wavelength, hence larger deviation Dm
    expect(Dm_Y1).toBeGreaterThan(Dm_Y2);
  });

  it('TC-E5-03: verifies dynamic turning point condition dD/di = 0 at i = Dm / 2', () => {
    const lambda_nm = 589.6;
    const Dm = sodiumGratingEngine.calculateMinimumDeviationAngle(lambda_nm, 15000, 1);
    const halfDm = Dm / 2; // ~10.0263°

    // Below minimum deviation incidence: dD/di < 0
    const below = sodiumGratingEngine.calculateDeviationAtIncidence(halfDm - 3.0, lambda_nm, 15000, 1);
    expect(below.dD_di).toBeLessThan(0);
    expect(below.deviationAngle_D_deg).toBeGreaterThan(Dm);

    // At minimum deviation: dD/di ~ 0 and D = Dm
    const atMin = sodiumGratingEngine.calculateDeviationAtIncidence(halfDm, lambda_nm, 15000, 1);
    expect(Math.abs(atMin.dD_di)).toBeLessThan(1e-5);
    expect(atMin.deviationAngle_D_deg).toBeCloseTo(Dm, 4);

    // Above minimum deviation incidence: dD/di > 0
    const above = sodiumGratingEngine.calculateDeviationAtIncidence(halfDm + 3.0, lambda_nm, 15000, 1);
    expect(above.dD_di).toBeGreaterThan(0);
    expect(above.deviationAngle_D_deg).toBeGreaterThan(Dm);
  });

  it('TC-E5-04: inverts minimum deviation angle Dm to calculate wavelength accurately', () => {
    const Dm_Y1 = sodiumGratingEngine.calculateMinimumDeviationAngle(589.6, 15000, 1);
    const resultY1 = sodiumGratingEngine.calculateWavelengthFromDm(Dm_Y1, 15000, 1);
    expect(resultY1.wavelength_nm).toBeCloseTo(589.6, 1);
    expect(resultY1.wavelength_Angstrom).toBeCloseTo(5896.0, 0);

    const Dm_Y2 = sodiumGratingEngine.calculateMinimumDeviationAngle(589.0, 15000, 1);
    const resultY2 = sodiumGratingEngine.calculateWavelengthFromDm(Dm_Y2, 15000, 1);
    expect(resultY2.wavelength_nm).toBeCloseTo(589.0, 1);
    expect(resultY2.wavelength_Angstrom).toBeCloseTo(5890.0, 0);
  });

  it('TC-E5-05: decomposes angles into MSR, VSC (0-29), and TR with LC = 1 minute', () => {
    const reading = decomposeAngleToVernier(199.55); // 199° 33'
    expect(reading.msr_degrees_part).toBe(199);
    expect(reading.msr_minutes_part).toBe(30);
    expect(reading.vsc).toBe(3);
    expect(reading.totalReading_deg).toBeCloseTo(199.55, 2);
    expect(reading.dms.degrees).toBe(199);
    expect(reading.dms.minutes).toBe(33);

    // Circular wraparound test (e.g. 359.95°)
    const wrap = decomposeAngleToVernier(359.95);
    expect(wrap.msr_degrees_part).toBe(359);
    expect(wrap.vsc).toBeGreaterThanOrEqual(0);
    expect(wrap.vsc).toBeLessThan(30);
  });

  it('TC-E5-06: computes circular distance across 0/360 boundary', () => {
    expect(circularDistance(10, 350)).toBe(20);
    expect(circularDistance(350, 10)).toBe(20);
    expect(circularDistance(180, 200)).toBe(20);
    expect(circularDistance(0, 180)).toBe(180);
  });

  it('TC-E5-07: generates exact 4-row observation table and summary matching Manual p. 55', () => {
    const table = sodiumGratingEngine.generateTheoreticalTable(180.0, 15000, 1);
    expect(table).toHaveLength(4);

    // Verify 4 rows: Yellow 1 (V1, V2) and Yellow 2 (V1, V2)
    const y1V1 = table.find((r) => r.colorKey === 'yellow_1' && r.vernier === 'V1')!;
    const y1V2 = table.find((r) => r.colorKey === 'yellow_1' && r.vernier === 'V2')!;
    const y2V1 = table.find((r) => r.colorKey === 'yellow_2' && r.vernier === 'V1')!;
    const y2V2 = table.find((r) => r.colorKey === 'yellow_2' && r.vernier === 'V2')!;

    expect(y1V1).toBeDefined();
    expect(y1V2).toBeDefined();
    expect(y2V1).toBeDefined();
    expect(y2V2).toBeDefined();

    // Verify minimum deviation 2Dm is approximately 40.1° and Dm is ~20.05°
    expect(y1V1.minimumDeviation_2Dm_deg).toBeCloseTo(40.10, 1);
    expect(y1V1.minimumDeviation_Dm_deg).toBeCloseTo(20.05, 1);
    expect(y1V1.calculatedWavelength_nm).toBeCloseTo(589.6, 0);
    expect(y1V1.percentageError).toBeLessThan(0.1);

    // Generate summary results
    const summary = sodiumGratingEngine.generateSummaryResults(table, 15000, 1);
    expect(summary).toHaveLength(2);

    const sumY1 = summary.find((s) => s.colorKey === 'yellow_1')!;
    const sumY2 = summary.find((s) => s.colorKey === 'yellow_2')!;

    expect(sumY1.standardWavelength_nm).toBe(589.6);
    expect(sumY1.observedWavelength_nm).toBeCloseTo(589.6, 0);
    expect(sumY1.percentageError).toBeLessThan(0.05);

    expect(sumY2.standardWavelength_nm).toBe(589.0);
    expect(sumY2.observedWavelength_nm).toBeCloseTo(589.0, 0);
    expect(sumY2.percentageError).toBeLessThan(0.05);
  });
});
