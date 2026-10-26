import { WireConnection } from '../types/workbench';

export type LedCircuitStatus =
  | 'VALID_FORWARD_BIAS'
  | 'REVERSED_LED_POLARITY'
  | 'ERROR_AMMETER_PARALLEL'
  | 'ERROR_VOLTMETER_SERIES'
  | 'WARNING_MISSING_LIMITER'
  | 'OPEN_CIRCUIT_DISCONNECTED';

export interface LedCircuitAnalysis {
  status: LedCircuitStatus;
  isOperating: boolean;
  hasReversedMeterPolarity: boolean;
  message: string;
  warnings: string[];
}

export function analyzeLedCircuit(wires: WireConnection[]): LedCircuitAnalysis {
  const warnings: string[] = [];

  if (wires.length < 3) {
    return {
      status: 'OPEN_CIRCUIT_DISCONNECTED',
      isOperating: false,
      hasReversedMeterPolarity: false,
      message: 'Circuit is open. Connect power supply, potentiometer, current limiter, ammeter, LED, and voltmeter.',
      warnings: ['Incomplete circuit loop.'],
    };
  }

  // Build graph of connected terminals
  const adj = new Map<string, Set<string>>();
  const addEdge = (u: string, v: string) => {
    if (!adj.has(u)) adj.set(u, new Set());
    if (!adj.has(v)) adj.set(v, new Set());
    adj.get(u)!.add(v);
    adj.get(v)!.add(u);
  };

  for (const w of wires) {
    addEdge(w.fromTerminalId, w.toTerminalId);
  }

  const isConnected = (start: string, target: string, visited = new Set<string>()): boolean => {
    if (start === target) return true;
    visited.add(start);
    for (const neighbor of adj.get(start) || []) {
      if (!visited.has(neighbor)) {
        if (isConnected(neighbor, target, visited)) return true;
      }
    }
    return false;
  };

  // 1. Check Voltmeter in parallel across LED
  const isVoltmeterParallel =
    (isConnected('vm_pos', 'led_anode') && isConnected('vm_neg', 'led_cathode')) ||
    (isConnected('vm_pos', 'led_cathode') && isConnected('vm_neg', 'led_anode'));

  // Voltmeter placed in series with LED loop (only if not in parallel across LED)
  const isVoltmeterInSeries =
    !isVoltmeterParallel &&
    ((isConnected('vm_pos', 'pot_wiper') && isConnected('vm_neg', 'led_anode')) ||
      (isConnected('vm_neg', 'pot_wiper') && isConnected('vm_pos', 'led_anode')) ||
      (isConnected('vm_pos', 'led_cathode') && (isConnected('vm_neg', 'ps_neg') || isConnected('vm_neg', 'pot_gnd'))) ||
      (isConnected('vm_neg', 'led_cathode') && (isConnected('vm_pos', 'ps_neg') || isConnected('vm_pos', 'pot_gnd'))));

  if (isVoltmeterInSeries) {
    return {
      status: 'ERROR_VOLTMETER_SERIES',
      isOperating: false,
      hasReversedMeterPolarity: false,
      message: 'Voltmeter is connected in series with the LED! An ideal voltmeter has 10 MΩ internal impedance and blocks all loop current. Connect voltmeter in parallel across the LED.',
      warnings: ['Voltmeter series placement drops all voltage across itself.'],
    };
  }

  // 2. Check Ammeter placed in parallel across LED
  const isAmmeterParallel =
    (isConnected('amm_pos', 'led_anode') && isConnected('amm_neg', 'led_cathode')) ||
    (isConnected('amm_pos', 'led_cathode') && isConnected('amm_neg', 'led_anode'));

  if (isAmmeterParallel) {
    return {
      status: 'ERROR_AMMETER_PARALLEL',
      isOperating: false,
      hasReversedMeterPolarity: false,
      message: 'Ammeter is placed in parallel across the LED! An ammeter has near-zero internal shunt resistance (0.05 Ω) and shorts out the diode. Connect ammeter in series.',
      warnings: ['Ammeter parallel short-circuit detected.'],
    };
  }

  const reversedVoltmeter = isConnected('vm_pos', 'led_cathode') && isConnected('vm_neg', 'led_anode');

  // 4. Series conduction path through Ammeter to LED
  const isAmmeterSeriesAnode =
    (isConnected('amm_pos', 'pot_wiper') && isConnected('amm_neg', 'led_anode')) ||
    (isConnected('amm_neg', 'pot_wiper') && isConnected('amm_pos', 'led_anode'));

  const isAmmeterSeriesCathode =
    (isConnected('amm_pos', 'led_cathode') && (isConnected('amm_neg', 'ps_neg') || isConnected('amm_neg', 'pot_gnd'))) ||
    (isConnected('amm_neg', 'led_cathode') && (isConnected('amm_pos', 'ps_neg') || isConnected('amm_pos', 'pot_gnd')));

  const isDirectAnodeWired = isConnected('pot_wiper', 'led_anode');
  const isDirectCathodeWired = isConnected('led_cathode', 'ps_neg') || isConnected('led_cathode', 'pot_gnd');

  // Forward bias: positive potential to Anode, Cathode to Ground
  const anodeHasPositive = isAmmeterSeriesAnode || isDirectAnodeWired;
  const cathodeHasGround = isAmmeterSeriesCathode || isDirectCathodeWired;
  const isForwardBiased = anodeHasPositive && cathodeHasGround;

  // Reverse bias: positive potential to Cathode, Anode to Ground
  const cathodeHasPositive =
    (isConnected('amm_pos', 'pot_wiper') && isConnected('amm_neg', 'led_cathode')) ||
    (isConnected('amm_neg', 'pot_wiper') && isConnected('amm_pos', 'led_cathode')) ||
    isConnected('pot_wiper', 'led_cathode');

  const anodeHasGround =
    (isConnected('amm_pos', 'led_anode') && (isConnected('amm_neg', 'ps_neg') || isConnected('amm_neg', 'pot_gnd'))) ||
    (isConnected('amm_neg', 'led_anode') && (isConnected('amm_pos', 'ps_neg') || isConnected('amm_pos', 'pot_gnd'))) ||
    isConnected('led_anode', 'ps_neg') || isConnected('led_anode', 'pot_gnd');

  const isReverseBiased = cathodeHasPositive && anodeHasGround;

  if (isReverseBiased) {
    return {
      status: 'REVERSED_LED_POLARITY',
      isOperating: true,
      hasReversedMeterPolarity: false,
      message: 'LED is reverse-biased (Cathode connected to positive wiper, Anode to ground). Diode will not conduct or emit light.',
      warnings: ['Flip LED orientation to forward bias to observe barrier conduction.'],
    };
  }

  if (!isForwardBiased) {
    return {
      status: 'OPEN_CIRCUIT_DISCONNECTED',
      isOperating: false,
      hasReversedMeterPolarity: false,
      message: 'Circuit loop to LED is open. Connect Potentiometer Wiper to LED Anode (+) through the ammeter, and Cathode (-) to Ground.',
      warnings: ['Open circuit detected.'],
    };
  }

  // Check Current Limiter presence (between PS (+) and Potentiometer input)
  const hasLimiter =
    isConnected('ps_pos', 'r_in') && (isConnected('r_out', 'pot_in') || isConnected('r_out', 'pot_wiper'));
  if (!hasLimiter) {
    warnings.push('Current-limiting resistor (10-100 Ω) omitted; circuit operates without surge protection.');
  }

  // Meter warnings
  if (!isVoltmeterParallel) {
    warnings.push('Voltmeter not connected across LED terminals; unable to measure diode voltage.');
  }

  const reversedAmmeter = isConnected('amm_neg', 'pot_wiper');
  const hasReversedPolarity = reversedVoltmeter || reversedAmmeter;

  return {
    status: 'VALID_FORWARD_BIAS',
    isOperating: true,
    hasReversedMeterPolarity: hasReversedPolarity,
    message: hasReversedPolarity
      ? 'Circuit complete in forward bias, but meter leads are inverted (negative reading displayed).'
      : 'Circuit properly wired! Forward-biased LED with series ammeter and parallel voltmeter.',
    warnings,
  };
}
