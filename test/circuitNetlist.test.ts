import { describe, it, expect } from 'vitest';
import { analyzeSolarCircuit } from '../src/engine/circuitNetlist';
import { WireConnection } from '../src/types/workbench';

describe('Circuit Topology Netlist & Defect Analyzer (Experiment 1)', () => {
  it('TC-NET-01: Detects lamp OFF state', () => {
    const res = analyzeSolarCircuit([], 'single', 1000, false);
    expect(res.status).toBe('OPEN_CIRCUIT_DISCONNECTED');
    expect(res.isOperating).toBe(false);
    expect(res.warnings[0]).toContain('5W lamp is OFF');
  });

  it('TC-NET-02: Detects Open-Circuit Voc measurement state (voltmeter only)', () => {
    const wires: WireConnection[] = [
      { id: 'w1', fromTerminalId: 'sc1_pos', toTerminalId: 'vm_pos', color: '#ef4444' },
      { id: 'w2', fromTerminalId: 'sc1_neg', toTerminalId: 'vm_neg', color: '#10b981' },
    ];
    const res = analyzeSolarCircuit(wires, 'single', 1000, true);
    expect(res.status).toBe('OPEN_CIRCUIT_VOC_MEASUREMENT');
    expect(res.isVocState).toBe(true);
    expect(res.isOperating).toBe(true);
  });

  it('TC-NET-03: Detects Short-Circuit Isc measurement state (ammeter across cell)', () => {
    const wires: WireConnection[] = [
      { id: 'w1', fromTerminalId: 'sc1_pos', toTerminalId: 'amm_pos', color: '#ef4444' },
      { id: 'w2', fromTerminalId: 'sc1_neg', toTerminalId: 'amm_neg', color: '#3b82f6' },
    ];
    const res = analyzeSolarCircuit(wires, 'single', 1000, true);
    expect(res.status).toBe('SHORT_CIRCUIT_ISC_MEASUREMENT');
    expect(res.isIscState).toBe(true);
    expect(res.isOperating).toBe(true);
  });

  it('TC-NET-04: Detects Valid Closed Loop with Load Resistor', () => {
    const wires: WireConnection[] = [
      { id: 'w1', fromTerminalId: 'sc1_pos', toTerminalId: 'amm_pos', color: '#ef4444' },
      { id: 'w2', fromTerminalId: 'amm_neg', toTerminalId: 'load_a', color: '#f59e0b' },
      { id: 'w3', fromTerminalId: 'load_b', toTerminalId: 'sc1_neg', color: '#3b82f6' },
      { id: 'w4', fromTerminalId: 'load_a', toTerminalId: 'vm_pos', color: '#ef4444' },
      { id: 'w5', fromTerminalId: 'load_b', toTerminalId: 'vm_neg', color: '#10b981' },
    ];
    const res = analyzeSolarCircuit(wires, 'single', 1000, true);
    expect(res.status).toBe('VALID_CLOSED_CIRCUIT');
    expect(res.isOperating).toBe(true);
    expect(res.hasReversedPolarity).toBe(false);
  });

  it('TC-NET-05: Detects Voltmeter in series defect (blocking current)', () => {
    const wires: WireConnection[] = [
      { id: 'w1', fromTerminalId: 'sc1_pos', toTerminalId: 'vm_pos', color: '#ef4444' },
      { id: 'w2', fromTerminalId: 'vm_neg', toTerminalId: 'load_a', color: '#f59e0b' },
      { id: 'w3', fromTerminalId: 'load_b', toTerminalId: 'sc1_neg', color: '#3b82f6' },
    ];
    const res = analyzeSolarCircuit(wires, 'single', 1000, true);
    expect(res.status).toBe('ERROR_VOLTMETER_SERIES');
    expect(res.isOperating).toBe(false);
    expect(res.message).toContain('Voltmeter is connected in series');
  });

  it('TC-NET-06: Detects Ammeter in parallel across load (shorting defect)', () => {
    const wires: WireConnection[] = [
      { id: 'w1', fromTerminalId: 'sc1_pos', toTerminalId: 'load_a', color: '#ef4444' },
      { id: 'w2', fromTerminalId: 'load_b', toTerminalId: 'sc1_neg', color: '#3b82f6' },
      // Ammeter connected in parallel across load A and B
      { id: 'w3', fromTerminalId: 'load_a', toTerminalId: 'amm_pos', color: '#f59e0b' },
      { id: 'w4', fromTerminalId: 'load_b', toTerminalId: 'amm_neg', color: '#f59e0b' },
    ];
    const res = analyzeSolarCircuit(wires, 'single', 1000, true);
    expect(res.status).toBe('ERROR_AMMETER_PARALLEL');
    expect(res.isOperating).toBe(false);
    expect(res.message).toContain('Ammeter is placed in parallel across the load');
  });

  it('TC-NET-07: Detects Series array miswiring when daisy chain missing', () => {
    const wires: WireConnection[] = [
      { id: 'w1', fromTerminalId: 'sc1_pos', toTerminalId: 'amm_pos', color: '#ef4444' },
      { id: 'w2', fromTerminalId: 'amm_neg', toTerminalId: 'load_a', color: '#f59e0b' },
      { id: 'w3', fromTerminalId: 'load_b', toTerminalId: 'sc3_neg', color: '#3b82f6' },
      // Missing SC1(-) to SC2(+) and SC2(-) to SC3(+)
    ];
    const res = analyzeSolarCircuit(wires, 'series', 1000, true);
    expect(res.status).toBe('ERROR_SERIES_MISWIRED');
    expect(res.message).toContain('Series Array Incomplete');
  });

  it('TC-NET-08: Detects Reversed Polarity on meter leads', () => {
    const wires: WireConnection[] = [
      { id: 'w1', fromTerminalId: 'sc1_pos', toTerminalId: 'amm_neg', color: '#ef4444' }, // reversed
      { id: 'w2', fromTerminalId: 'amm_pos', toTerminalId: 'load_a', color: '#f59e0b' },
      { id: 'w3', fromTerminalId: 'load_b', toTerminalId: 'sc1_neg', color: '#3b82f6' },
      { id: 'w4', fromTerminalId: 'load_a', toTerminalId: 'vm_pos', color: '#ef4444' },
      { id: 'w5', fromTerminalId: 'load_b', toTerminalId: 'vm_neg', color: '#10b981' },
    ];
    const res = analyzeSolarCircuit(wires, 'single', 1000, true);
    expect(res.hasReversedPolarity).toBe(true);
    expect(res.warnings.some(w => w.includes('polarity is reversed'))).toBe(true);
  });
});
