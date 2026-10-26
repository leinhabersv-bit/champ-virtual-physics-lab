import { describe, it, expect } from 'vitest';
import { ledPlanckEngine, LED_SPECS, LED_COLOR_KEYS } from '../src/engine/ledPlanckSimulator';
import { analyzeLedCircuit } from '../src/engine/ledPlanckNetlist';
import { WireConnection } from '../src/types/workbench';

describe('LedPlanckEngine Unit Tests (Experiment 3)', () => {
  it('verifies source-defined LED wavelengths from manual pp. 38, 43, 44', () => {
    expect(LED_SPECS.blue.lambda_nm).toBe(470);
    expect(LED_SPECS.yellow.lambda_nm).toBe(500);
    expect(LED_SPECS.green.lambda_nm).toBe(565);
    expect(LED_SPECS.red.lambda_nm).toBe(660);

    // Verify 1/lambda values
    expect(LED_SPECS.blue.oneOverLambda_per_nm).toBeCloseTo(1 / 470, 5);
    expect(LED_SPECS.red.oneOverLambda_per_nm).toBeCloseTo(1 / 660, 5);
  });

  it('demonstrates physically plausible diode I-V behavior across all 4 LEDs', () => {
    for (const key of LED_COLOR_KEYS) {
      const spec = LED_SPECS[key];

      // At zero or low voltage, current is negligible (< 1 uA)
      const low = ledPlanckEngine.calculateReadings({
        ledColor: key,
        potentiometerRatio: 0.1,
      });
      expect(low.diodeCurrent_uA).toBeLessThan(1.0);
      expect(low.isEmittingLight).toBe(false);

      // In conducting linear region (pot ratio ~ 0.95), diode conducts and emits light
      const high = ledPlanckEngine.calculateReadings({
        ledColor: key,
        potentiometerRatio: 0.95,
      });
      expect(high.diodeCurrent_uA).toBeGreaterThan(500);
      expect(high.diodeCurrent_uA).toBeLessThanOrEqual(2900); // Guarded safe limit per manual p. 42
      expect(high.isEmittingLight).toBe(true);
      expect(high.diodeVoltage_V).toBeGreaterThanOrEqual(spec.theoreticalVB * 0.95);
    }
  });

  it('verifies that reverse-biased LED yields zero current and no light emission', () => {
    const rev = ledPlanckEngine.calculateReadings({
      ledColor: 'green',
      potentiometerRatio: 0.8,
      isReverseBiased: true,
    });
    expect(rev.diodeCurrent_uA).toBe(0.0);
    expect(rev.isEmittingLight).toBe(false);
  });

  it('generates full Table 1 dataset (15 points) for each LED', () => {
    const rows = ledPlanckEngine.generateObservationTable1('blue');
    expect(rows.length).toBe(15);
    expect(rows[0].slNo).toBe(1);
    expect(rows[0].diodeCurrent_uA).toBeLessThan(1);
    expect(rows[14].diodeCurrent_uA).toBeGreaterThan(1000);
  });

  it('fits linear tangent to upper conduction region to extract barrier potential VB', () => {
    // Generate upper linear points for Red LED (VB ~ 1.88 V)
    const points: Array<{ x: number; y: number }> = [
      { x: 1.90, y: 350 },
      { x: 1.95, y: 920 },
      { x: 2.00, y: 1540 },
      { x: 2.05, y: 2150 },
      { x: 2.10, y: 2780 },
    ];

    const fit = ledPlanckEngine.fitLinearTangent(points);
    expect(fit.isSufficientlyLinear).toBe(true);
    expect(fit.rSquared).toBeGreaterThanOrEqual(0.95);
    // Extrapolated VB intercept should be close to 1.87 - 1.88 V
    expect(fit.voltageIntercept_VB_V).toBeCloseTo(1.87, 1);
  });

  it('refuses to fabricate intercept when non-linear sub-threshold points are chosen', () => {
    // Points along exponential bend where slope is tiny and curve is non-linear
    const nonLinearPoints = [
      { x: 0.8, y: 0.1 },
      { x: 1.2, y: 0.2 },
      { x: 1.5, y: 1.5 },
    ];

    const fit = ledPlanckEngine.fitLinearTangent(nonLinearPoints);
    expect(fit.isSufficientlyLinear).toBe(false);
    expect(fit.errorMessage).toContain('Selected region is non-linear');
  });

  it('computes Table 2 direct and graphical Planck constant in SI units (J·s)', () => {
    const summary = ledPlanckEngine.generateTable2Summary();
    expect(summary.rows.length).toBe(4); // 4 LEDs

    // Each direct h value should be close to 6.626e-34 J·s
    for (const row of summary.rows) {
      expect(row.planckConstantDirect_J_s).toBeGreaterThan(6.0e-34);
      expect(row.planckConstantDirect_J_s).toBeLessThan(7.2e-34);
      expect(row.percentageError).toBeLessThan(8.0);
    }

    // Average h across all LEDs
    expect(summary.averagePlanckConstant_J_s).toBeCloseTo(6.626e-34, 35);
    expect(summary.percentageErrorDirect).toBeLessThan(5.0);

    // Graphical h from slope of VB vs 1/lambda
    expect(summary.graphicalPlanckConstant_J_s).toBeCloseTo(6.626e-34, 35);
    expect(summary.percentageErrorGraphical).toBeLessThan(5.0);
  });

  it('verifies led circuit netlist analyzer and defect detection', () => {
    // 1. Properly wired circuit
    const validWires: WireConnection[] = [
      { id: 'w1', fromTerminalId: 'ps_pos', toTerminalId: 'r_in', color: '#ef4444' },
      { id: 'w2', fromTerminalId: 'r_out', toTerminalId: 'pot_in', color: '#ef4444' },
      { id: 'w3', fromTerminalId: 'ps_neg', toTerminalId: 'pot_gnd', color: '#3b82f6' },
      { id: 'w4', fromTerminalId: 'pot_wiper', toTerminalId: 'amm_pos', color: '#f59e0b' },
      { id: 'w5', fromTerminalId: 'amm_neg', toTerminalId: 'led_anode', color: '#ef4444' },
      { id: 'w6', fromTerminalId: 'led_cathode', toTerminalId: 'pot_gnd', color: '#3b82f6' },
      { id: 'w7', fromTerminalId: 'led_anode', toTerminalId: 'vm_pos', color: '#ef4444' },
      { id: 'w8', fromTerminalId: 'led_cathode', toTerminalId: 'vm_neg', color: '#10b981' },
    ];
    const validAnalysis = analyzeLedCircuit(validWires);
    expect(validAnalysis.status).toBe('VALID_FORWARD_BIAS');
    expect(validAnalysis.isOperating).toBe(true);

    // 2. Reversed LED polarity
    const revWires: WireConnection[] = [
      { id: 'w1', fromTerminalId: 'pot_wiper', toTerminalId: 'led_cathode', color: '#ef4444' },
      { id: 'w2', fromTerminalId: 'led_anode', toTerminalId: 'ps_neg', color: '#3b82f6' },
      { id: 'w3', fromTerminalId: 'led_anode', toTerminalId: 'vm_pos', color: '#ef4444' },
      { id: 'w4', fromTerminalId: 'led_cathode', toTerminalId: 'vm_neg', color: '#10b981' },
    ];
    const revAnalysis = analyzeLedCircuit(revWires);
    expect(revAnalysis.status).toBe('REVERSED_LED_POLARITY');

    // 3. Voltmeter in series defect
    const vmSeriesWires: WireConnection[] = [
      { id: 'w1', fromTerminalId: 'pot_wiper', toTerminalId: 'vm_pos', color: '#ef4444' },
      { id: 'w2', fromTerminalId: 'vm_neg', toTerminalId: 'led_anode', color: '#ef4444' },
      { id: 'w3', fromTerminalId: 'led_cathode', toTerminalId: 'ps_neg', color: '#3b82f6' },
    ];
    const vmSeriesAnalysis = analyzeLedCircuit(vmSeriesWires);
    expect(vmSeriesAnalysis.status).toBe('ERROR_VOLTMETER_SERIES');
    expect(vmSeriesAnalysis.isOperating).toBe(false);

    // 4. Ammeter in parallel defect
    const ammParallelWires: WireConnection[] = [
      { id: 'w1', fromTerminalId: 'pot_wiper', toTerminalId: 'led_anode', color: '#ef4444' },
      { id: 'w2', fromTerminalId: 'led_cathode', toTerminalId: 'ps_neg', color: '#3b82f6' },
      { id: 'w3', fromTerminalId: 'amm_pos', toTerminalId: 'led_anode', color: '#f59e0b' },
      { id: 'w4', fromTerminalId: 'amm_neg', toTerminalId: 'led_cathode', color: '#f59e0b' },
    ];
    const ammParallelAnalysis = analyzeLedCircuit(ammParallelWires);
    expect(ammParallelAnalysis.status).toBe('ERROR_AMMETER_PARALLEL');
    expect(ammParallelAnalysis.isOperating).toBe(false);
  });
});
