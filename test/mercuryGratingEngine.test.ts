import { describe, it, expect } from 'vitest';
import { mercuryGratingEngine, MERCURY_SPECTRUM } from '../src/engine/mercuryGratingEngine';

describe('MercuryGratingEngine Unit Tests (Experiment 2)', () => {
  it('correctly calculates grating element and rulings per metre from rulings per inch', () => {
    const res = mercuryGratingEngine.calculateGratingElement(15000);
    // (e + d) = 2.54e-2 / 15000 = 1.69333e-6 m
    expect(res.gratingElement_m).toBeCloseTo(1.69333e-6, 8);
    // lines per metre = 15000 / 0.0254 = ~590551 lines/m
    expect(res.rulingsPerMetre).toBe(590551);
    expect(res.gratingElement_Angstrom).toBeCloseTo(16933.3, 1);
  });

  it('rejects zero or negative grating rulings', () => {
    expect(() => mercuryGratingEngine.calculateGratingElement(0)).toThrow();
    expect(() => mercuryGratingEngine.calculateGratingElement(-500)).toThrow();
  });

  it('verifies spectrometer least count specifications from manual', () => {
    expect(mercuryGratingEngine.ONE_MSD_DEG).toBe(0.5); // 30 minutes
    expect(mercuryGratingEngine.VSD_DIVISIONS).toBe(30);
    expect(mercuryGratingEngine.LEAST_COUNT_MINUTES).toBe(1);
    expect(mercuryGratingEngine.LEAST_COUNT_DEG).toBeCloseTo(1 / 60, 6);
  });

  it('decomposes continuous angles into MSR and VSC vernier readings accurately', () => {
    // 110.65°:
    // 110.5° = 110° 30' MSR
    // Remainder = 0.15° = 9 minutes
    // VSC = 9 div, VSR = 9'
    // Total reading = 110° 39'
    const reading = mercuryGratingEngine.angleToVernierReading(110.65);
    expect(reading.msr_degrees_part).toBe(110);
    expect(reading.msr_minutes_part).toBe(30);
    expect(reading.vsc).toBe(9);
    expect(reading.totalReading_deg).toBeCloseTo(110.65, 2);
    expect(reading.dms.degrees).toBe(110);
    expect(reading.dms.minutes).toBe(39);
  });

  it('correctly handles circular angle modular arithmetic and wraparound across 0°/360°', () => {
    // Distance between 355° and 5° should be 10°, not 350°
    const dist1 = mercuryGratingEngine.circularDistance(355, 5);
    expect(dist1).toBe(10);

    // Distance between 10° and 350° should be 20°
    const dist2 = mercuryGratingEngine.circularDistance(10, 350);
    expect(dist2).toBe(20);

    // Identical angles
    expect(mercuryGratingEngine.circularDistance(180, 180)).toBe(0);

    // Diametrically opposite angles
    expect(mercuryGratingEngine.circularDistance(0, 180)).toBe(180);
    expect(mercuryGratingEngine.circularDistance(90, 270)).toBe(180);
  });

  it('verifies V1 and V2 agreement (180° offset) and diffraction symmetry', () => {
    const table = mercuryGratingEngine.generateFullObservationTable(180.0, 15000);
    expect(table.rows.length).toBe(8); // 4 colors * 2 verniers
    expect(table.summaries.length).toBe(4); // 4 colors

    for (const summary of table.summaries) {
      // theta from V1 and theta from V2 should agree to within 1 arcminute (0.017°)
      expect(Math.abs(summary.v1_theta_deg - summary.v2_theta_deg)).toBeLessThanOrEqual(0.02);
      // Percentage error should be under 0.5%
      expect(summary.percentageError).toBeLessThan(0.5);
    }
  });

  it('verifies exact reference wavelengths from manual p. 36 and p. 37', () => {
    expect(MERCURY_SPECTRUM.blue.lambda_ref_Angstrom).toBe(4693);
    expect(MERCURY_SPECTRUM.green.lambda_ref_Angstrom).toBe(5461);
    expect(MERCURY_SPECTRUM.yellow.lambda_ref_Angstrom).toBe(5770);
    expect(MERCURY_SPECTRUM.red.lambda_ref_Angstrom).toBe(6238);

    const table = mercuryGratingEngine.generateFullObservationTable(180.0, 15000);
    const blue = table.summaries.find(s => s.color === 'blue')!;
    const green = table.summaries.find(s => s.color === 'green')!;
    const yellow = table.summaries.find(s => s.color === 'yellow')!;
    const red = table.summaries.find(s => s.color === 'red')!;

    // Expected diffraction angles for 15000 LPI:
    // Blue: ~16.09°
    // Green: ~18.82°
    // Yellow: ~19.92°
    // Red: ~21.62°
    expect(blue.mean_theta_deg).toBeCloseTo(16.09, 1);
    expect(green.mean_theta_deg).toBeCloseTo(18.82, 1);
    expect(yellow.mean_theta_deg).toBeCloseTo(19.92, 1);
    expect(red.mean_theta_deg).toBeCloseTo(21.62, 1);

    // Calculated wavelengths close to reference
    expect(blue.calculated_lambda_Angstrom).toBeCloseTo(4693, -1);
    expect(green.calculated_lambda_Angstrom).toBeCloseTo(5461, -1);
    expect(yellow.calculated_lambda_Angstrom).toBeCloseTo(5770, -1);
    expect(red.calculated_lambda_Angstrom).toBeCloseTo(6238, -1);
  });

  it('rejects impossible diffraction orders where sin(theta) > 1', () => {
    // Order 4 for Red (623.8 nm) with 15000 LPI:
    // sin(theta) = 4 * 623.8e-9 / 1.69333e-6 = 1.473 > 1.0
    const res = mercuryGratingEngine.calculateDiffractionAngle(623.8, 15000, 4);
    expect(res.isPhysical).toBe(false);
    expect(res.sinTheta).toBeGreaterThan(1.0);
  });

  it('returns appropriate spectral lines in telescope field of view', () => {
    // When telescope is at direct angle (180°), only central image should be in FOV
    const centralFOV = mercuryGratingEngine.getTelescopeFieldOfView(180.0, 180.0, 15000, 4.0);
    expect(centralFOV.some(l => l.colorKey === 'central')).toBe(true);
    expect(centralFOV.length).toBe(1);

    // When telescope is at ~16.1° to the left (180 - 16.09 = 163.91°), Blue line should be in FOV
    const blueFOV = mercuryGratingEngine.getTelescopeFieldOfView(163.91, 180.0, 15000, 4.0);
    expect(blueFOV.some(l => l.colorKey === 'blue' && l.side === 'left')).toBe(true);

    // When telescope is at ~18.8° to the right (180 + 18.82 = 198.82°), Green line should be in FOV
    const greenFOV = mercuryGratingEngine.getTelescopeFieldOfView(198.82, 180.0, 15000, 4.0);
    expect(greenFOV.some(l => l.colorKey === 'green' && l.side === 'right')).toBe(true);
  });
});
