import { describe, it, expect } from 'vitest';
import { photodiodeSimulator } from '../src/engine/photodiodeSimulator';
import { photodiodeNetlistValidator } from '../src/engine/photodiodeNetlist';

describe('Photodiode I-V Characteristics Engine (Experiment 6)', () => {
  it('TC-E6-01: calculates dark current under reverse bias with saturation and shunt leakage', () => {
    // At VR = 0 V, dark current is 0
    const dark0 = photodiodeSimulator.calculateDarkCurrent(0.0);
    expect(dark0.current_uA).toBe(0.0);
    expect(dark0.current_A).toBe(0.0);

    // At VR = 1.0 V, thermal saturation + shunt leakage
    const dark1 = photodiodeSimulator.calculateDarkCurrent(1.0);
    expect(dark1.current_uA).toBeGreaterThan(0.1);
    expect(dark1.current_uA).toBeLessThan(0.3);
    // Explicit µA to A conversion check: I_A = I_uA * 1e-6
    expect(dark1.current_A).toBeCloseTo(dark1.current_uA * 1e-6, 9);

    // At VR = 5.0 V, dark current slightly higher due to shunt resistance Rsh
    const dark5 = photodiodeSimulator.calculateDarkCurrent(5.0);
    expect(dark5.current_uA).toBeGreaterThan(dark1.current_uA);
    expect(dark5.current_uA).toBeLessThan(1.0); // Safe microampere scale
  });

  it('TC-E6-02: verifies optical power inverse-square distance dependence', () => {
    // Optical power at 10 cm reference
    const p10 = photodiodeSimulator.calculateOpticalPower(10.0, true, false);
    expect(p10.power_uW).toBeCloseTo(45.0, 1);
    expect(p10.power_W).toBeCloseTo(45.0e-6, 8);

    // At 20 cm (doubled distance), power must be 1/4 (inverse square law)
    const p20 = photodiodeSimulator.calculateOpticalPower(20.0, true, false);
    expect(p20.power_uW).toBeCloseTo(45.0 / 4, 1); // 11.25 µW

    // At 5 cm (half distance), power must be 4x
    const p5 = photodiodeSimulator.calculateOpticalPower(5.0, true, false);
    expect(p5.power_uW).toBeCloseTo(45.0 * 4, 1); // 180.0 µW

    // When lamp is OFF, optical power is strictly 0.0 W
    const pOff = photodiodeSimulator.calculateOpticalPower(10.0, false, false);
    expect(pOff.power_W).toBe(0.0);
    expect(pOff.power_uW).toBe(0.0);

    // When opaque shield is ON, optical power is strictly 0.0 W
    const pShield = photodiodeSimulator.calculateOpticalPower(10.0, true, true);
    expect(pShield.power_W).toBe(0.0);
  });

  it('TC-E6-03: computes photocurrent, responsivity, and percentage change per manual formulas', () => {
    // At VR = 3.0 V and distance = 10 cm (illuminated)
    const result = photodiodeSimulator.calculateTotalCurrent(3.0, 10.0, true, false);

    // 1. Total current I = I_D + I_ph
    expect(result.totalCurrent_uA).toBeCloseTo(result.darkCurrent_uA + result.photocurrent_uA, 3);
    expect(result.totalCurrent_A).toBeCloseTo(result.totalCurrent_uA * 1e-6, 9);

    // 2. Responsivity R = I_ph / P_opt (A/W)
    expect(result.responsivity_AW).not.toBeNull();
    // Default responsivity is ~ 0.45 A/W
    expect(result.responsivity_AW!).toBeGreaterThan(0.4);
    expect(result.responsivity_AW!).toBeLessThan(0.5);

    // 3. Percentage change: %Δ = (I_illum - I_D) / I_D * 100
    expect(result.percentageChange_pct).not.toBeNull();
    const expectedPct = (result.photocurrent_uA / result.darkCurrent_uA) * 100;
    expect(result.percentageChange_pct!).toBeCloseTo(expectedPct, 1);
  });

  it('TC-E6-04: handles zero-dark-current protection and zero optical power edge cases safely', () => {
    // At VR = 0 V (where I_D = 0)
    const resultV0 = photodiodeSimulator.calculateTotalCurrent(0.0, 10.0, true, false);
    // Dark current is 0, percentage change must be null (protected against division by zero)
    expect(resultV0.darkCurrent_uA).toBe(0.0);
    expect(resultV0.percentageChange_pct).toBeNull();

    // In dark state (lamp OFF)
    const resultDark = photodiodeSimulator.calculateTotalCurrent(3.0, 10.0, false, false);
    expect(resultDark.opticalPower_W).toBe(0.0);
    expect(resultDark.photocurrent_uA).toBe(0.0);
    expect(resultDark.responsivity_AW).toBeNull();
    expect(resultDark.percentageChange_pct).toBeNull();
    expect(resultDark.totalCurrent_uA).toBe(resultDark.darkCurrent_uA);
  });

  it('TC-E6-05: generates observation tables 1, 2, and 3 matching manual specifications', () => {
    // Table 1: Dark current (0 V to 5 V)
    const t1 = photodiodeSimulator.generateTable1DarkCurrent();
    expect(t1.length).toBe(11); // 0, 0.5, 1.0, ..., 5.0 V
    expect(t1[0].reverseVoltage_V).toBe(0.0);
    expect(t1[10].reverseVoltage_V).toBe(5.0);
    expect(t1[10].darkCurrent_uA).toBeGreaterThan(t1[0].darkCurrent_uA);

    // Table 2: Photocurrent at D1 = 10 cm and D2 = 15 cm
    const t2 = photodiodeSimulator.generateTable2FixedDistance();
    expect(t2.length).toBe(11);
    // At closer distance (10 cm), current must be higher than at 15 cm
    expect(t2[5].current_D1_uA).toBeGreaterThan(t2[5].current_D2_uA);

    // Table 3: Fixed reverse voltage (1V, 2V, 3V) at 5, 10, 15, 20 cm
    const t3 = photodiodeSimulator.generateTable3FixedVoltage();
    expect(t3.length).toBe(12); // 3 voltages * 4 distances
    // Current drops as distance increases
    const v1_d5 = t3.find((r) => r.reverseVoltage_V === 1.0 && r.distance_cm === 5)!;
    const v1_d20 = t3.find((r) => r.reverseVoltage_V === 1.0 && r.distance_cm === 20)!;
    expect(v1_d5.current_uA).toBeGreaterThan(v1_d20.current_uA);
  });

  it('TC-E6-06: validates circuit netlist topology and detects reverse vs forward bias', () => {
    // 1. Correct Default Reverse Bias
    const validWiring = photodiodeNetlistValidator.getDefaultCorrectWiring();
    const evalValid = photodiodeNetlistValidator.evaluateCircuit(validWiring);
    expect(evalValid.isValid).toBe(true);
    expect(evalValid.status).toBe('VALID_REVERSE_BIAS');
    expect(evalValid.isReverseBiased).toBe(true);
    expect(evalValid.isForwardBiased).toBe(false);

    // 2. Polarity Inversion (Forward Bias)
    const fwdWiring = [
      { id: 'w1', fromTerminal: 'psu_pos', toTerminal: 'resistor_t1' },
      { id: 'w2', fromTerminal: 'resistor_t2', toTerminal: 'ammeter_pos' },
      { id: 'w3', fromTerminal: 'ammeter_neg', toTerminal: 'photodiode_anode' }, // Inverted: Anode to Pos
      { id: 'w4', fromTerminal: 'photodiode_cathode', toTerminal: 'psu_neg' }, // Inverted: Cathode to Neg
    ];
    const evalFwd = photodiodeNetlistValidator.evaluateCircuit(fwdWiring);
    expect(evalFwd.isValid).toBe(false);
    expect(evalFwd.status).toBe('FORWARD_BIAS_WARNING');
    expect(evalFwd.isForwardBiased).toBe(true);

    // 3. Open Circuit
    const evalOpen = photodiodeNetlistValidator.evaluateCircuit([]);
    expect(evalOpen.isValid).toBe(false);
    expect(evalOpen.status).toBe('OPEN_CIRCUIT');

    // 4. Missing Limiting Resistor
    const noResistorWiring = [
      { id: 'w1', fromTerminal: 'psu_pos', toTerminal: 'ammeter_pos' }, // Direct to ammeter
      { id: 'w2', fromTerminal: 'ammeter_neg', toTerminal: 'photodiode_cathode' },
      { id: 'w3', fromTerminal: 'photodiode_anode', toTerminal: 'psu_neg' },
    ];
    const evalNoRes = photodiodeNetlistValidator.evaluateCircuit(noResistorWiring);
    expect(evalNoRes.isValid).toBe(false);
    expect(evalNoRes.status).toBe('MISSING_LIMITING_RESISTOR');
  });

  it('TC-E6-07: verifies forward bias current escalation', () => {
    // When forward biased beyond 0.7 V, exponential current flows
    const fwd0 = photodiodeSimulator.calculateForwardBiasCurrent(0.0);
    expect(fwd0.current_mA).toBe(0.0);

    const fwd07 = photodiodeSimulator.calculateForwardBiasCurrent(0.7);
    expect(fwd07.current_mA).toBeGreaterThan(1.0);
  });
});
