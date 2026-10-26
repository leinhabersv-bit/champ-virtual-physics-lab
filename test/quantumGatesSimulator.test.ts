import { describe, it, expect } from 'vitest';
import {
  quantumGatesEngine,
  computeSingleQubitState,
  parseTwoQubitPreset,
  analyzeTwoQubitState,
  applyMatrix4x4,
  TWO_QUBIT_GATES,
  generateManualTable1,
  generateManualTable2,
  generateManualTable3,
  generateManualTable4,
  generateManualTable5,
  QUANTUM_AMBIGUITIES,
} from '../src/engine/quantumGatesSimulator';

describe('Deterministic Quantum Gates Simulator Contracts (Experiment 9)', () => {
  it('TC-E9-01: Single-qubit Bloch angles accurately reproduce cardinal states and normalization', () => {
    // North pole: |0>
    const north = computeSingleQubitState(0, 0);
    expect(north.prob0).toBeCloseTo(1.0, 4);
    expect(north.prob1).toBeCloseTo(0.0, 4);
    expect(north.bloch_x).toBeCloseTo(0.0, 3);
    expect(north.bloch_y).toBeCloseTo(0.0, 3);
    expect(north.bloch_z).toBeCloseTo(1.0, 3);
    expect(north.norm).toBeCloseTo(1.0, 4);

    // South pole: |1>
    const south = computeSingleQubitState(Math.PI, 0);
    expect(south.prob0).toBeCloseTo(0.0, 4);
    expect(south.prob1).toBeCloseTo(1.0, 4);
    expect(south.bloch_z).toBeCloseTo(-1.0, 3);
    expect(south.norm).toBeCloseTo(1.0, 4);

    // +X pole: |+>
    const plusX = computeSingleQubitState(Math.PI / 2, 0);
    expect(plusX.prob0).toBeCloseTo(0.5, 4);
    expect(plusX.prob1).toBeCloseTo(0.5, 4);
    expect(plusX.bloch_x).toBeCloseTo(1.0, 3);
    expect(plusX.bloch_y).toBeCloseTo(0.0, 3);
    expect(plusX.bloch_z).toBeCloseTo(0.0, 3);

    // +Y pole: |+i>
    const plusY = computeSingleQubitState(Math.PI / 2, Math.PI / 2);
    expect(plusY.prob0).toBeCloseTo(0.5, 4);
    expect(plusY.prob1).toBeCloseTo(0.5, 4);
    expect(plusY.bloch_x).toBeCloseTo(0.0, 3);
    expect(plusY.bloch_y).toBeCloseTo(1.0, 3);
  });

  it('TC-E9-02: Single-qubit gates (X, Y, Z, H) demonstrate exact unitary rotations and involutory properties', () => {
    // Pauli-X flips |0> to |1>
    const xOnZero = computeSingleQubitState(0, 0, 'X');
    expect(xOnZero.prob0).toBeCloseTo(0.0, 4);
    expect(xOnZero.prob1).toBeCloseTo(1.0, 4);

    // Pauli-Z leaves |0> unchanged and flips phase of |1>
    const zOnZero = computeSingleQubitState(0, 0, 'Z');
    expect(zOnZero.prob0).toBeCloseTo(1.0, 4);
    const zOnOne = computeSingleQubitState(Math.PI, 0, 'Z');
    expect(zOnOne.prob1).toBeCloseTo(1.0, 4);

    // Hadamard creates equal superposition from |0>
    const hOnZero = computeSingleQubitState(0, 0, 'H');
    expect(hOnZero.prob0).toBeCloseTo(0.5, 4);
    expect(hOnZero.prob1).toBeCloseTo(0.5, 4);
    expect(hOnZero.bloch_x).toBeCloseTo(1.0, 3);

    // Hadamard on |+> returns to |0>
    const hOnPlus = computeSingleQubitState(Math.PI / 2, 0, 'H');
    expect(hOnPlus.prob0).toBeCloseTo(1.0, 3);
    expect(hOnPlus.prob1).toBeCloseTo(0.0, 3);
  });

  it('TC-E9-03: Two-qubit CNOT truth table matches manual Eq. 7 exactly', () => {
    // Basis states: |00>, |01>, |10>, |11>
    // CNOT|c, t> = |c, t ^ c> (control = q0, target = q1)
    const vec00 = parseTwoQubitPreset('|00>');
    const out00 = applyMatrix4x4(TWO_QUBIT_GATES.CNOT_01, vec00);
    const det00 = analyzeTwoQubitState(out00);
    expect(det00.prob00).toBeCloseTo(1.0, 4);

    const vec01 = parseTwoQubitPreset('|01>');
    const out01 = applyMatrix4x4(TWO_QUBIT_GATES.CNOT_01, vec01);
    const det01 = analyzeTwoQubitState(out01);
    expect(det01.prob01).toBeCloseTo(1.0, 4);

    const vec10 = parseTwoQubitPreset('|10>');
    const out10 = applyMatrix4x4(TWO_QUBIT_GATES.CNOT_01, vec10);
    const det10 = analyzeTwoQubitState(out10);
    expect(det10.prob11).toBeCloseTo(1.0, 4); // |10> -> |11>

    const vec11 = parseTwoQubitPreset('|11>');
    const out11 = applyMatrix4x4(TWO_QUBIT_GATES.CNOT_01, vec11);
    const det11 = analyzeTwoQubitState(out11);
    expect(det11.prob10).toBeCloseTo(1.0, 4); // |11> -> |10>
  });

  it('TC-E9-04: Control reversal on CNOT swaps control and target roles', () => {
    // In CNOT_10: q1 is control, q0 is target
    // |01>: q1=1 => flips q0 => |11>
    const vec01 = parseTwoQubitPreset('|01>');
    const out01 = applyMatrix4x4(TWO_QUBIT_GATES.CNOT_10, vec01);
    const det01 = analyzeTwoQubitState(out01);
    expect(det01.prob11).toBeCloseTo(1.0, 4);

    // |10>: q1=0 => leaves q0 alone => |10>
    const vec10 = parseTwoQubitPreset('|10>');
    const out10 = applyMatrix4x4(TWO_QUBIT_GATES.CNOT_10, vec10);
    const det10 = analyzeTwoQubitState(out10);
    expect(det10.prob10).toBeCloseTo(1.0, 4);
  });

  it('TC-E9-05: SWAP gate exchanges quantum wire amplitudes symmetrically', () => {
    // SWAP|01> -> |10>
    const vec01 = parseTwoQubitPreset('|01>');
    const out01 = applyMatrix4x4(TWO_QUBIT_GATES.SWAP, vec01);
    const det01 = analyzeTwoQubitState(out01);
    expect(det01.prob10).toBeCloseTo(1.0, 4);

    // SWAP|10> -> |01>
    const vec10 = parseTwoQubitPreset('|10>');
    const out10 = applyMatrix4x4(TWO_QUBIT_GATES.SWAP, vec10);
    const det10 = analyzeTwoQubitState(out10);
    expect(det10.prob01).toBeCloseTo(1.0, 4);

    // SWAP on symmetric states is invariant
    const vec00 = parseTwoQubitPreset('|00>');
    const out00 = applyMatrix4x4(TWO_QUBIT_GATES.SWAP, vec00);
    expect(analyzeTwoQubitState(out00).prob00).toBeCloseTo(1.0, 4);

    const vec11 = parseTwoQubitPreset('|11>');
    const out11 = applyMatrix4x4(TWO_QUBIT_GATES.SWAP, vec11);
    expect(analyzeTwoQubitState(out11).prob11).toBeCloseTo(1.0, 4);
  });

  it('TC-E9-06: Bell state generation from superposition verifies maximal entanglement (Concurrence = 1.0)', () => {
    // Input state: |+> (x) |0> = (|00> + |10>) / sqrt(2)
    const vecIn = parseTwoQubitPreset('|+⟩ ⊗ |0⟩');
    const inDet = analyzeTwoQubitState(vecIn);
    expect(inDet.isEntangled).toBe(false);
    expect(inDet.concurrence).toBeCloseTo(0.0, 4);

    // Apply CNOT: produces Bell state |Phi+> = (|00> + |11>) / sqrt(2)
    const vecOut = applyMatrix4x4(TWO_QUBIT_GATES.CNOT_01, vecIn);
    const outDet = analyzeTwoQubitState(vecOut);
    expect(outDet.prob00).toBeCloseTo(0.5, 4);
    expect(outDet.prob11).toBeCloseTo(0.5, 4);
    expect(outDet.prob01).toBeCloseTo(0.0, 4);
    expect(outDet.prob10).toBeCloseTo(0.0, 4);

    // Concurrence C = 2 * |c00*c11 - c01*c10| = 2 * (1/sqrt(2) * 1/sqrt(2) - 0) = 1.0
    expect(outDet.concurrence).toBeCloseTo(1.0, 4);
    expect(outDet.isEntangled).toBe(true);

    // Reduced density matrix purity is 0.5 (maximally mixed)
    expect(outDet.blochQubit1.purity).toBeCloseTo(0.5, 3);
    expect(outDet.blochQubit2.purity).toBeCloseTo(0.5, 3);
  });

  it('TC-E9-07: All manual observation tables (Tables 1–5) generate correct row counts and types', () => {
    const t1 = generateManualTable1();
    expect(t1.length).toBe(10);
    t1.forEach((row) => expect(row.norm).toBeCloseTo(1.0, 4));

    const t2 = generateManualTable2();
    expect(t2.length).toBe(10);

    const t3 = generateManualTable3();
    expect(t3.length).toBe(10);

    const t4 = generateManualTable4();
    expect(t4.length).toBe(10);
    // 6 entangled states (5, 6, 8, 9, 10), 4 product states (1, 2, 3, 4, 7)
    const entangledCount = t4.filter((r) => r.isEntangled).length;
    expect(entangledCount).toBe(5); // rows 5, 6, 8, 9, 10

    const t5 = generateManualTable5();
    expect(t5.length).toBe(10);
    expect(t5[0].cnotOutput).toBe('|00⟩');
    expect(t5[2].cnotOutput).toBe('|11⟩');
    expect(t5[4].isCnotEntangled).toBe(true);
  });

  it('TC-E9-08: Ambiguities AMB-08 and AMB-09 are formally documented', () => {
    expect(QUANTUM_AMBIGUITIES.length).toBe(2);
    expect(QUANTUM_AMBIGUITIES[0].id).toBe('AMB-08');
    expect(QUANTUM_AMBIGUITIES[1].id).toBe('AMB-09');
  });

  it('TC-E9-09: ISimulationEngine interface compliance', () => {
    const res = quantumGatesEngine.calculateReadings({
      theta_rad: Math.PI / 2,
      phi_rad: 0,
      activeGate: 'H',
      twoQubitInputState: '|00>',
      twoQubitGate: 'CNOT',
    });
    expect(res.prob_0).toBeCloseTo(1.0, 3); // H on |+> gives |0>
    const derived = quantumGatesEngine.computeDerived(res, {
      theta_rad: Math.PI / 2,
      phi_rad: 0,
      activeGate: 'H',
      twoQubitInputState: '|00>',
      twoQubitGate: 'CNOT',
    });
    expect(derived.norm).toBeCloseTo(1.0, 3);
  });
});
