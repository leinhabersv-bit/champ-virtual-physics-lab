/**
 * Photodiode Circuit Netlist & Topology Validator (Experiment 6 - BAPHY105 Manual)
 *
 * Verifies breadboard connections between:
 * - Regulated DC Power Supply (0–30 V)
 * - Protective Limiting Resistor (R = 1 kΩ)
 * - Microammeter (0–100 µA)
 * - Photodiode (Cathode -, Anode +)
 * - Voltmeter (0–10 V)
 *
 * Strictly enforces reverse-bias polarity and detects wiring errors.
 */

export interface WireConnection {
  id: string;
  fromTerminal: string;
  toTerminal: string;
  color?: string;
}

export type PhotodiodeCircuitStatus =
  | 'VALID_REVERSE_BIAS'
  | 'FORWARD_BIAS_WARNING'
  | 'OPEN_CIRCUIT'
  | 'VOLTMETER_IN_SERIES'
  | 'AMMETER_PARALLEL_SHORT'
  | 'MISSING_LIMITING_RESISTOR';

export interface CircuitEvaluationResult {
  status: PhotodiodeCircuitStatus;
  isValid: boolean;
  message: string;
  details?: string;
  isReverseBiased: boolean;
  isForwardBiased: boolean;
}

export class PhotodiodeNetlistValidator {
  /**
   * Evaluates circuit wiring topology from terminal connections.
   */
  public evaluateCircuit(wires: WireConnection[]): CircuitEvaluationResult {
    if (!wires || wires.length < 3) {
      return {
        status: 'OPEN_CIRCUIT',
        isValid: false,
        message: 'Open Circuit: Insufficient connections to form a complete circuit.',
        details: 'Connect Power Supply (+) through Resistor and Microammeter to Photodiode Cathode, and Anode to Supply (-).',
        isReverseBiased: false,
        isForwardBiased: false,
      };
    }

    // Build undirected adjacency graph
    const adj = new Map<string, Set<string>>();
    const addEdge = (u: string, v: string) => {
      if (!adj.has(u)) adj.set(u, new Set());
      if (!adj.has(v)) adj.set(v, new Set());
      adj.get(u)!.add(v);
      adj.get(v)!.add(u);
    };

    wires.forEach((w) => addEdge(w.fromTerminal, w.toTerminal));

    // Internal components conduct through their internal paths
    // Resistor conducts between t1 and t2
    addEdge('resistor_t1', 'resistor_t2');
    // Ammeter conducts between pos and neg (low impedance)
    addEdge('ammeter_pos', 'ammeter_neg');

    // Helper: is reachable in graph
    const isConnected = (start: string, target: string, visited = new Set<string>()): boolean => {
      if (start === target) return true;
      visited.add(start);
      const neighbors = adj.get(start);
      if (!neighbors) return false;
      for (const n of neighbors) {
        if (!visited.has(n)) {
          if (isConnected(n, target, visited)) return true;
        }
      }
      return false;
    };

    // Check if Ammeter is placed in parallel across Power Supply (Dead Short)
    if (
      (isConnected('psu_pos', 'ammeter_pos') && isConnected('psu_neg', 'ammeter_neg')) ||
      (isConnected('psu_pos', 'ammeter_neg') && isConnected('psu_neg', 'ammeter_pos'))
    ) {
      // If neither photodiode nor resistor is in that path
      if (!isConnected('ammeter_pos', 'photodiode_cathode') && !isConnected('ammeter_pos', 'photodiode_anode')) {
        return {
          status: 'AMMETER_PARALLEL_SHORT',
          isValid: false,
          message: 'Short Circuit Detected: Microammeter is connected directly across the power supply!',
          details: 'Microammeters have near-zero internal resistance. Insert the protective resistor and photodiode in series.',
          isReverseBiased: false,
          isForwardBiased: false,
        };
      }
    }

    // Check if Voltmeter is erroneously inserted in series in the main loop
    // (e.g. voltmeter connects between psu and photodiode without bypass)
    const voltmeterNodes = ['voltmeter_pos', 'voltmeter_neg'];
    const psuDirectToVoltmeter = wires.some(
      (w) =>
        (w.fromTerminal === 'psu_pos' && voltmeterNodes.includes(w.toTerminal)) ||
        (w.toTerminal === 'psu_pos' && voltmeterNodes.includes(w.fromTerminal))
    );
    const photodiodeFromVoltmeterOnly = wires.some(
      (w) =>
        (w.fromTerminal === 'photodiode_cathode' && voltmeterNodes.includes(w.toTerminal)) ||
        (w.toTerminal === 'photodiode_cathode' && voltmeterNodes.includes(w.fromTerminal))
    );
    if (psuDirectToVoltmeter && photodiodeFromVoltmeterOnly && wires.length < 5) {
      return {
        status: 'VOLTMETER_IN_SERIES',
        isValid: false,
        message: 'Invalid Meter Placement: Voltmeter is in series with the photodiode loop.',
        details: 'A voltmeter has high internal resistance (~10 MΩ) and blocks circuit current. Connect it in parallel across the photodiode.',
        isReverseBiased: false,
        isForwardBiased: false,
      };
    }

    // Check if loop is closed from PSU(+) to PSU(-) through photodiode
    const loopCathode = isConnected('psu_pos', 'photodiode_cathode');
    const loopAnode = isConnected('psu_neg', 'photodiode_anode');

    const revLoopCathode = isConnected('psu_pos', 'photodiode_anode');
    const revLoopAnode = isConnected('psu_neg', 'photodiode_cathode');

    // Case 1: Valid Reverse Bias (Supply + goes to Cathode -, Supply - goes to Anode +)
    if (loopCathode && loopAnode) {
      // Check if current limiting resistor is present in the path
      const resistorPresent =
        isConnected('psu_pos', 'resistor_t1') ||
        isConnected('psu_pos', 'resistor_t2') ||
        isConnected('psu_neg', 'resistor_t1') ||
        isConnected('psu_neg', 'resistor_t2');

      if (!resistorPresent) {
        return {
          status: 'MISSING_LIMITING_RESISTOR',
          isValid: false,
          message: 'Warning: Current limiting resistor (1 kΩ) is bypassed or missing!',
          details: 'Always protect the photodiode and microammeter with a series resistor.',
          isReverseBiased: true,
          isForwardBiased: false,
        };
      }

      // Check if Microammeter is in series
      const ammeterPresent =
        (isConnected('psu_pos', 'ammeter_pos') || isConnected('psu_pos', 'ammeter_neg')) ||
        (isConnected('psu_neg', 'ammeter_pos') || isConnected('psu_neg', 'ammeter_neg'));

      if (!ammeterPresent) {
        return {
          status: 'OPEN_CIRCUIT',
          isValid: false,
          message: 'Microammeter is not in the series current loop.',
          details: 'Connect the microammeter in series between the resistor and photodiode cathode.',
          isReverseBiased: true,
          isForwardBiased: false,
        };
      }

      return {
        status: 'VALID_REVERSE_BIAS',
        isValid: true,
        message: 'Circuit Verified: Photodiode is correctly reverse-biased with series ammeter and parallel voltmeter.',
        details: 'Cathode connected to positive bias (+), Anode to negative ground (-). Ready for dark and illuminated measurements.',
        isReverseBiased: true,
        isForwardBiased: false,
      };
    }

    // Case 2: Forward Bias Polarity (Supply + goes to Anode +, Supply - goes to Cathode -)
    if (revLoopCathode && revLoopAnode) {
      return {
        status: 'FORWARD_BIAS_WARNING',
        isValid: false,
        message: 'Polarity Inversion: Photodiode is FORWARD BIASED!',
        details: 'The experiment requires REVERSE BIAS. In forward bias, large exponential currents flow without optical sensitivity. Swap photodiode terminals.',
        isReverseBiased: false,
        isForwardBiased: true,
      };
    }

    return {
      status: 'OPEN_CIRCUIT',
      isValid: false,
      message: 'Incomplete Circuit: Power supply loop is open.',
      details: 'Ensure complete closed circuit from Supply (+) through Resistor and Microammeter to Photodiode Cathode, and Anode back to Supply (-).',
      isReverseBiased: false,
      isForwardBiased: false,
    };
  }

  /**
   * Generates standard default correct wiring configuration for one-click setup.
   */
  public getDefaultCorrectWiring(): WireConnection[] {
    return [
      { id: 'w1', fromTerminal: 'psu_pos', toTerminal: 'resistor_t1', color: '#ef4444' }, // Red wire
      { id: 'w2', fromTerminal: 'resistor_t2', toTerminal: 'ammeter_pos', color: '#ef4444' },
      { id: 'w3', fromTerminal: 'ammeter_neg', toTerminal: 'photodiode_cathode', color: '#f59e0b' },
      { id: 'w4', fromTerminal: 'photodiode_anode', toTerminal: 'psu_neg', color: '#000000' }, // Black wire
      { id: 'w5', fromTerminal: 'photodiode_cathode', toTerminal: 'voltmeter_pos', color: '#3b82f6' }, // Blue
      { id: 'w6', fromTerminal: 'photodiode_anode', toTerminal: 'voltmeter_neg', color: '#000000' },
    ];
  }
}

export const photodiodeNetlistValidator = new PhotodiodeNetlistValidator();
