import { WireConnection } from '../types/workbench';

export type CircuitStatus =
  | 'VALID_CLOSED_CIRCUIT'
  | 'OPEN_CIRCUIT_DISCONNECTED'
  | 'OPEN_CIRCUIT_VOC_MEASUREMENT'
  | 'SHORT_CIRCUIT_ISC_MEASUREMENT'
  | 'SHORT_CIRCUIT_DANGEROUS'
  | 'ERROR_AMMETER_PARALLEL'
  | 'ERROR_VOLTMETER_SERIES'
  | 'ERROR_SERIES_MISWIRED'
  | 'ERROR_PARALLEL_MISWIRED'
  | 'ERROR_REVERSED_POLARITY';

export interface CircuitAnalysisResult {
  status: CircuitStatus;
  message: string;
  isOperating: boolean;
  effectiveResistance_ohm: number;
  measuredVoltage_V: number | null;
  measuredCurrent_mA: number | null;
  hasReversedPolarity: boolean;
  isVocState: boolean;
  isIscState: boolean;
  warnings: string[];
}

export function analyzeSolarCircuit(
  wires: WireConnection[],
  topology: 'single' | 'series' | 'parallel',
  loadResistance_ohm: number,
  lampIsOn: boolean,
  isProcedureB_Appliance: boolean = false,
  applianceType: 'LED_RED' | 'LED_GREEN' | 'LED_BLUE' | 'MOTOR' = 'LED_RED',
  limitingResistor_ohm: number = 220
): CircuitAnalysisResult {
  const warnings: string[] = [];

  if (!lampIsOn) {
    return {
      status: 'OPEN_CIRCUIT_DISCONNECTED',
      message: 'Light source is switched OFF. Switch ON the 5W lamp to generate illumination.',
      isOperating: false,
      effectiveResistance_ohm: loadResistance_ohm,
      measuredVoltage_V: 0,
      measuredCurrent_mA: 0,
      hasReversedPolarity: false,
      isVocState: false,
      isIscState: false,
      warnings: ['5W lamp is OFF: No incident photons to generate electron-hole pairs.'],
    };
  }

  // Build adjacency graph of connected terminals
  const adj = new Map<string, string[]>();
  const addEdge = (u: string, v: string) => {
    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);
    adj.get(u)!.push(v);
    adj.get(v)!.push(u);
  };

  for (const w of wires) {
    addEdge(w.fromTerminalId, w.toTerminalId);
  }

  // Helper: check if two terminals are connected in graph
  const isConnected = (start: string, target: string, visited = new Set<string>()): boolean => {
    if (start === target) return true;
    visited.add(start);
    const neighbors = adj.get(start) || [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        if (isConnected(n, target, visited)) return true;
      }
    }
    return false;
  };

  // Determine active solar cell output terminals based on topology
  let mainCellPos = 'sc1_pos';
  let mainCellNeg = 'sc1_neg';

  if (topology === 'series') {
    // In series: SC1(-) must connect to SC2(+), SC2(-) must connect to SC3(+)
    const link1 = isConnected('sc1_neg', 'sc2_pos');
    const link2 = isConnected('sc2_neg', 'sc3_pos');
    if (!link1 || !link2) {
      return {
        status: 'ERROR_SERIES_MISWIRED',
        message: 'Series Array Incomplete: Connect SC1(-) to SC2(+), and SC2(-) to SC3(+) to complete daisy chain.',
        isOperating: false,
        effectiveResistance_ohm: loadResistance_ohm,
        measuredVoltage_V: 0,
        measuredCurrent_mA: 0,
        hasReversedPolarity: false,
        isVocState: false,
        isIscState: false,
        warnings: ['Series configuration requires daisy-chaining: SC1(-) -> SC2(+) and SC2(-) -> SC3(+).'],
      };
    }
    mainCellPos = 'sc1_pos';
    mainCellNeg = 'sc3_neg';
  } else if (topology === 'parallel') {
    // In parallel: all (+) must be tied together, and all (-) tied together
    const posTied = isConnected('sc1_pos', 'sc2_pos') && isConnected('sc2_pos', 'sc3_pos');
    const negTied = isConnected('sc1_neg', 'sc2_neg') && isConnected('sc2_neg', 'sc3_neg');
    if (!posTied || !negTied) {
      return {
        status: 'ERROR_PARALLEL_MISWIRED',
        message: 'Parallel Array Incomplete: Connect all (+) terminals together and all (-) terminals together.',
        isOperating: false,
        effectiveResistance_ohm: loadResistance_ohm,
        measuredVoltage_V: 0,
        measuredCurrent_mA: 0,
        hasReversedPolarity: false,
        isVocState: false,
        isIscState: false,
        warnings: ['Parallel configuration requires tying all 3 panel (+) together and all 3 panel (-) together.'],
      };
    }
  }

  // 1. Check for Open-Circuit Voc measurement:
  // Voltmeter connected across cell (+/-), but NO load or ammeter completing a loop
  const vmConnectedPos = isConnected('vm_pos', mainCellPos);
  const vmConnectedNeg = isConnected('vm_neg', mainCellNeg);
  const vmReversedPos = isConnected('vm_pos', mainCellNeg);
  const vmReversedNeg = isConnected('vm_neg', mainCellPos);

  const vmIsAcrossCell = (vmConnectedPos && vmConnectedNeg) || (vmReversedPos && vmReversedNeg);
  const hasReversedVM = vmReversedPos && vmReversedNeg;

  const loadConnectedA = isConnected('load_a', mainCellPos);
  const loadConnectedB = isConnected('load_b', mainCellNeg);
  const loadLoopClosed = (loadConnectedA && loadConnectedB) || (isConnected('load_b', mainCellPos) && isConnected('load_a', mainCellNeg));

  // Check if ammeter is shorting the cell directly
  const ammDirectShort =
    (isConnected('amm_pos', mainCellPos) && isConnected('amm_neg', mainCellNeg)) ||
    (isConnected('amm_neg', mainCellPos) && isConnected('amm_pos', mainCellNeg));

  if (ammDirectShort && !loadLoopClosed) {
    const hasReversedAMM = isConnected('amm_neg', mainCellPos);
    return {
      status: 'SHORT_CIRCUIT_ISC_MEASUREMENT',
      message: 'Short-Circuit (Isc) Measurement: Ammeter directly connected across solar cell. Reading short-circuit current.',
      isOperating: true,
      effectiveResistance_ohm: 0.05, // internal shunt
      measuredVoltage_V: 0.001,
      measuredCurrent_mA: null, // calculated by physics engine
      hasReversedPolarity: hasReversedAMM,
      isVocState: false,
      isIscState: true,
      warnings: hasReversedAMM ? ['Ammeter leads reversed: displaying negative polarity deflection.'] : [],
    };
  }

  if (vmIsAcrossCell && !loadLoopClosed) {
    return {
      status: 'OPEN_CIRCUIT_VOC_MEASUREMENT',
      message: 'Open-Circuit (Voc) Measurement: Voltmeter connected directly across solar cell with no external load.',
      isOperating: true,
      effectiveResistance_ohm: 1e8,
      measuredVoltage_V: null, // calculated by physics engine
      measuredCurrent_mA: 0.0,
      hasReversedPolarity: hasReversedVM,
      isVocState: true,
      isIscState: false,
      warnings: hasReversedVM ? ['Voltmeter leads reversed: displaying negative voltage deflection.'] : [],
    };
  }

  // 2. Check for Wrong Meter Placements:
  // (a) Voltmeter in series: if path from mainCellPos to load passes through vm_pos and vm_neg
  const isVmInSeries =
    (wires.some(w => w.fromTerminalId === 'vm_pos' && w.toTerminalId === 'load_a') ||
     wires.some(w => w.fromTerminalId === 'vm_neg' && w.toTerminalId === 'load_a')) &&
    !wires.some(w => (w.fromTerminalId === 'amm_pos' || w.toTerminalId === 'amm_pos'));

  if (isVmInSeries) {
    return {
      status: 'ERROR_VOLTMETER_SERIES',
      message: 'Wrong Meter Placement: Voltmeter is connected in series with the load! Voltmeter has high internal resistance (10 MΩ), completely blocking current flow.',
      isOperating: false,
      effectiveResistance_ohm: 1e7,
      measuredVoltage_V: 0,
      measuredCurrent_mA: 0,
      hasReversedPolarity: false,
      isVocState: false,
      isIscState: false,
      warnings: ['Voltmeter must be connected in PARALLEL across the load, never in series.'],
    };
  }

  // (b) Ammeter in parallel across the load while load is connected
  const ammParallelAcrossLoad =
    (isConnected('amm_pos', 'load_a') && isConnected('amm_neg', 'load_b')) ||
    (isConnected('amm_pos', 'load_b') && isConnected('amm_neg', 'load_a'));

  if (ammParallelAcrossLoad && loadLoopClosed) {
    return {
      status: 'ERROR_AMMETER_PARALLEL',
      message: 'Wrong Meter Placement: Ammeter is placed in parallel across the load resistor! This shorts out the load and bypasses it.',
      isOperating: false,
      effectiveResistance_ohm: 0.05,
      measuredVoltage_V: 0,
      measuredCurrent_mA: null,
      hasReversedPolarity: false,
      isVocState: false,
      isIscState: false,
      warnings: ['Ammeter must be connected in SERIES in the current loop, not in parallel across the load.'],
    };
  }

  // 3. Normal Closed Circuit Verification:
  // Proper series current loop:
  // mainCellPos -> Ammeter (+) -> Ammeter (-) -> Load (A) -> Load (B) -> mainCellNeg (or equivalent)
  const cellToAmmeter = isConnected(mainCellPos, 'amm_pos') || isConnected(mainCellPos, 'amm_neg');
  const ammeterToLoad = isConnected('amm_neg', 'load_a') || isConnected('amm_pos', 'load_a') || isConnected('amm_neg', 'load_b') || isConnected('amm_pos', 'load_b');
  const loadToCell = isConnected('load_b', mainCellNeg) || isConnected('load_a', mainCellNeg);

  const isClosedLoop = cellToAmmeter && ammeterToLoad && loadToCell;

  if (!isClosedLoop) {
    return {
      status: 'OPEN_CIRCUIT_DISCONNECTED',
      message: 'Open Circuit: Wires do not form a complete closed loop. Connect Solar Cell -> Ammeter -> Load Resistor -> Solar Cell.',
      isOperating: false,
      effectiveResistance_ohm: 1e8,
      measuredVoltage_V: 0,
      measuredCurrent_mA: 0,
      hasReversedPolarity: false,
      isVocState: false,
      isIscState: false,
      warnings: ['Circuit loop is open: Verify all leads connect terminal posts securely.'],
    };
  }

  // Check polarity of connections
  const reversedAmmeter = isConnected(mainCellPos, 'amm_neg');
  const reversedVoltmeter = isConnected('vm_neg', 'load_a') && isConnected('vm_pos', 'load_b');
  const hasReversedPolarity = reversedAmmeter || reversedVoltmeter;

  if (reversedAmmeter) warnings.push('Ammeter polarity is reversed (current enters negative terminal).');
  if (reversedVoltmeter) warnings.push('Voltmeter polarity is reversed across load.');

  // Effective resistance calculation
  let effectiveR = loadResistance_ohm;
  if (isProcedureB_Appliance) {
    // In Procedure B: appliance + current-limiting resistor
    const ledEquivalentResistances: Record<string, number> = {
      LED_RED: 60,
      LED_GREEN: 75,
      LED_BLUE: 95,
      MOTOR: 120,
    };
    effectiveR = limitingResistor_ohm + (ledEquivalentResistances[applianceType] || 80);
  }

  return {
    status: 'VALID_CLOSED_CIRCUIT',
    message: isProcedureB_Appliance
      ? `Valid Circuit: Real-time Appliance (${applianceType.replace('_', ' ')}) connected with ${limitingResistor_ohm} Ω limiting resistor.`
      : `Valid Circuit: Closed loop with Load Resistance = ${effectiveR >= 1000 ? `${(effectiveR / 1000).toFixed(2)} kΩ` : `${effectiveR} Ω`}.`,
    isOperating: true,
    effectiveResistance_ohm: effectiveR,
    measuredVoltage_V: null, // solved dynamically
    measuredCurrent_mA: null,
    hasReversedPolarity,
    isVocState: false,
    isIscState: false,
    warnings,
  };
}
