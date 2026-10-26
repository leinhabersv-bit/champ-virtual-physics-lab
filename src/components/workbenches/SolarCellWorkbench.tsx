import React, { useState, useMemo } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import { Terminal, WireConnection, ObservationRow, ObservationColumn, FormulaDefinition } from '../../types/workbench';
import { solarCellEngine, SolarCellParams } from '../../engine/solarCellSimulator';
import { Instrument } from '../primitives/Instrument';
import { ParameterControl } from '../primitives/ParameterControl';
import { ObservationGrid } from '../primitives/ObservationGrid';
import { FormulaPanel } from '../primitives/FormulaPanel';
import { LabGraph, GraphSeries } from '../primitives/LabGraph';
import { WorkbenchToolbar } from '../primitives/WorkbenchToolbar';
import { TerminalPoint } from '../primitives/TerminalPoint';
import { DraggableWire } from '../primitives/DraggableWire';
import { Sun, CheckCircle2, ChevronRight, Layers, ArrowLeft } from 'lucide-react';

interface SolarCellWorkbenchProps {
  metadata: ExperimentMetadata;
  onBackToDashboard: () => void;
  onOpenViva: () => void;
}

export const SolarCellWorkbench: React.FC<SolarCellWorkbenchProps> = ({
  metadata,
  onBackToDashboard,
  onOpenViva,
}) => {
  const [activeMode, setActiveMode] = useState<'guided' | 'independent' | 'viva'>('guided');
  const [guidedStep, setGuidedStep] = useState<number>(1);

  // Simulation Parameters
  const [distance, setDistance] = useState<number>(0.20); // 20 cm
  const [loadResistance, setLoadResistance] = useState<number>(1000); // 1 kOhm
  const [topology, setTopology] = useState<'single' | 'series' | 'parallel'>('single');
  const [panelCount] = useState<number>(3);

  // Circuit Wiring State
  // Default valid complete circuit connections
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  const [wires, setWires] = useState<WireConnection[]>([
    { id: 'w1', fromTerminalId: 'sc_pos', toTerminalId: 'amm_pos', color: '#ef4444' },
    { id: 'w2', fromTerminalId: 'amm_neg', toTerminalId: 'res_a', color: '#f59e0b' },
    { id: 'w3', fromTerminalId: 'res_b', toTerminalId: 'sc_neg', color: '#3b82f6' },
    { id: 'w4', fromTerminalId: 'res_a', toTerminalId: 'vm_pos', color: '#ef4444' },
    { id: 'w5', fromTerminalId: 'res_b', toTerminalId: 'vm_neg', color: '#10b981' },
  ]);

  // Observations State
  const [observationRows, setObservationRows] = useState<ObservationRow[]>([]);
  const [lastSaved, setLastSaved] = useState<string | undefined>(undefined);

  // Bench Terminals (Coordinates in SVG 760 x 360 space)
  const terminals: Terminal[] = useMemo(() => [
    { id: 'sc_pos', name: 'Cell (+)', polarity: '+', color: '#ef4444', x: 190, y: 130, componentId: 'solar_cell', componentName: 'Solar Panel' },
    { id: 'sc_neg', name: 'Cell (-)', polarity: '-', color: '#3b82f6', x: 190, y: 220, componentId: 'solar_cell', componentName: 'Solar Panel' },
    { id: 'vm_pos', name: 'V (+)', polarity: '+', color: '#ef4444', x: 380, y: 80, componentId: 'voltmeter', componentName: 'Voltmeter' },
    { id: 'vm_neg', name: 'V (-)', polarity: '-', color: '#10b981', x: 440, y: 80, componentId: 'voltmeter', componentName: 'Voltmeter' },
    { id: 'amm_pos', name: 'mA (+)', polarity: '+', color: '#ef4444', x: 380, y: 270, componentId: 'ammeter', componentName: 'Ammeter' },
    { id: 'amm_neg', name: 'mA (-)', polarity: '-', color: '#3b82f6', x: 440, y: 270, componentId: 'ammeter', componentName: 'Ammeter' },
    { id: 'res_a', name: 'Load A', polarity: 'neutral', color: '#f59e0b', x: 570, y: 150, componentId: 'decade_box', componentName: 'Load Resistor' },
    { id: 'res_b', name: 'Load B', polarity: 'neutral', color: '#64748b', x: 570, y: 200, componentId: 'decade_box', componentName: 'Load Resistor' },
  ], []);

  // Circuit Connectivity Validation:
  // Is the loop closed between solar cell, ammeter, and load resistor?
  const isCircuitClosed = useMemo(() => {
    const hasCellToAmmeter = wires.some(w => (w.fromTerminalId === 'sc_pos' && w.toTerminalId === 'amm_pos') || (w.fromTerminalId === 'amm_pos' && w.toTerminalId === 'sc_pos'));
    const hasAmmeterToRes = wires.some(w => (w.fromTerminalId === 'amm_neg' && w.toTerminalId === 'res_a') || (w.fromTerminalId === 'res_a' && w.toTerminalId === 'amm_neg'));
    const hasResToCell = wires.some(w => (w.fromTerminalId === 'res_b' && w.toTerminalId === 'sc_neg') || (w.fromTerminalId === 'sc_neg' && w.toTerminalId === 'res_b'));
    return hasCellToAmmeter && hasAmmeterToRes && hasResToCell;
  }, [wires]);

  // Execute deterministic physics simulation
  const simParams: SolarCellParams = useMemo(() => ({
    distance,
    lampPower: 5.0,
    cellArea: 0.0025,
    loadResistance: isCircuitClosed ? loadResistance : 1e8, // open circuit if unhooked
    circuitTopology: topology,
    panelCount,
  }), [distance, loadResistance, topology, panelCount, isCircuitClosed]);

  const readings = useMemo(() => solarCellEngine.calculateReadings(simParams), [simParams]);
  const derived = useMemo(() => solarCellEngine.computeDerived(readings, simParams), [readings, simParams]);

  // Model curve for real-time visualization
  const modelCurve = useMemo(() => solarCellEngine.generateModelCurve(simParams, 60), [simParams]);

  // Graph series
  const graphSeries: GraphSeries[] = useMemo(() => {
    const ivPoints = modelCurve.map(pt => ({ x: pt.x, y: pt.y }));
    const pvPoints = modelCurve.map(pt => ({ x: pt.x, y: pt.x * (pt.y / 1000) * 1000 })); // mW

    return [
      {
        id: 'iv-curve',
        name: 'I-V Curve',
        points: ivPoints,
        color: '#6366f1',
        unitY: 'mA',
      },
      {
        id: 'pv-curve',
        name: 'Power Curve (P-V)',
        points: pvPoints,
        color: '#ec4899',
        unitY: 'mW',
        isSecondaryY: true,
      },
    ];
  }, [modelCurve]);

  // Terminal connection interaction (Supports both pointer click and keyboard accessibility)
  const handleTerminalClick = (term: Terminal) => {
    if (!selectedTerminal) {
      setSelectedTerminal(term);
    } else {
      if (selectedTerminal.id !== term.id) {
        // Connect wire
        const newWire: WireConnection = {
          id: `wire-${Date.now()}`,
          fromTerminalId: selectedTerminal.id,
          toTerminalId: term.id,
          color: selectedTerminal.color || '#818cf8',
        };
        setWires(prev => [...prev, newWire]);
      }
      setSelectedTerminal(null);
    }
  };

  const handleRemoveWire = (wireId: string) => {
    setWires(prev => prev.filter(w => w.id !== wireId));
  };

  // Observation grid columns matching Manual pp. 28-31 Table 1
  const observationColumns: ObservationColumn[] = useMemo(() => [
    { key: 'resistance', label: 'Resistance (R)', unit: 'kΩ', precision: 3 },
    { key: 'voltage', label: 'Voltage (V)', unit: 'V', precision: 3 },
    { key: 'current', label: 'Current (I)', unit: 'mA', precision: 2 },
    { key: 'power_mW', label: 'Power (P)', unit: 'mW', isCalculated: true, precision: 2 },
  ], []);

  const handleLogReading = () => {
    const newRow: ObservationRow = {
      id: `row-${Date.now()}`,
      timestamp: Date.now(),
      values: {
        resistance: { value: loadResistance / 1000, unit: 'kΩ' },
        voltage: { value: readings.voltage, unit: 'V' },
        current: { value: readings.current_mA, unit: 'mA' },
        power_mW: { value: readings.power_W * 1000, unit: 'mW', isAutoCalculated: true },
      },
    };
    setObservationRows(prev => [...prev, newRow]);
  };

  // KaTeX formula definitions
  const formulas: FormulaDefinition[] = useMemo(() => [
    {
      title: 'Maximum Power & Operating Point',
      latex: 'P_{max} = I_{max} \\times V_{max} \\quad \\text{(Watts)}',
      explanation: 'Peak power generated on the I-V characteristic curve at the Knee point.',
      sourceNote: 'Manual p. 20',
    },
    {
      title: 'Fill Factor (FF)',
      latex: 'FF = \\frac{P_{max}}{V_{oc} \\times I_{sc}} \\quad \\text{(Dimensionless)}',
      explanation: 'Measure of solar cell junction quality and squareness of the I-V curve.',
      sourceNote: 'Manual p. 20',
    },
    {
      title: 'Solar Cell Efficiency (η)',
      latex: '\\eta = \\frac{P_{max}}{A \\times I_0} \\times 100\\%',
      explanation: 'Ratio of electrical power generated to total incident optical light power.',
      sourceNote: 'Manual p. 20',
    },
  ], []);

  const substitutedFormula = useMemo(() => {
    const pmax_mW = (derived.pMax_W * 1000).toFixed(2);
    const voc = readings.openCircuitVoltage_Voc.toFixed(2);
    const isc = readings.shortCircuitCurrent_Isc_mA.toFixed(2);
    const ff = derived.fillFactor.toFixed(3);
    const eff = derived.efficiencyPercent.toFixed(2);
    return `FF = \\frac{${pmax_mW}\\,\\text{mW}}{${voc}\\,\\text{V} \\times ${isc}\\,\\text{mA}} = ${ff}, \\quad \\eta = ${eff}\\%`;
  }, [derived, readings]);

  const hints = [
    'Adjust the 5W lamp distance slider to set incident intensity and observe the lux meter.',
    'Verify that your circuit is wired in closed loop: Cell (+) -> Ammeter (+) -> Load -> Cell (-).',
    'Sweep through the discrete resistance buttons (100Ω to 10kΩ) and log each reading into the observation grid.',
    'Notice how power peaks at an intermediate resistance (the matched load condition) yielding Pmax.',
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Workbench Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Back to Experiments Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-bold tracking-wide uppercase">
                {metadata.statusBadge}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                BAPHY105 • {metadata.pdfPageRange}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-100 mt-0.5">
              Experiment 1: Solar Cell Renewable Energy Circuit
            </h1>
          </div>
        </div>

        {/* Array Topology Selector */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
          <span className="px-2 text-slate-400 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Config:
          </span>
          <button
            type="button"
            onClick={() => setTopology('single')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              topology === 'single' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Single Cell
          </button>
          <button
            type="button"
            onClick={() => setTopology('series')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              topology === 'series' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 in Series
          </button>
          <button
            type="button"
            onClick={() => setTopology('parallel')}
            className={`px-2.5 py-1 rounded font-semibold transition-all ${
              topology === 'parallel' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 in Parallel
          </button>
        </div>
      </div>

      {/* Toolbar strip */}
      <WorkbenchToolbar
        activeMode={activeMode}
        onModeChange={setActiveMode}
        onReset={() => {
          setDistance(0.20);
          setLoadResistance(1000);
          setTopology('single');
          setObservationRows([]);
        }}
        onSave={() => {
          const payload = {
            timestamp: new Date().toLocaleTimeString(),
            readings,
            derived,
            rows: observationRows,
          };
          localStorage.setItem('champ_expt1_saved_run', JSON.stringify(payload));
          setLastSaved(new Date().toLocaleTimeString());
        }}
        hints={hints}
        lastSavedTime={lastSaved}
        onOpenViva={onOpenViva}
      />

      {/* Guided Mode Step Checklist Banner */}
      {activeMode === 'guided' && (
        <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-3 shadow-md flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              {guidedStep}
            </div>
            <div className="text-xs">
              <span className="font-semibold text-indigo-200">
                {guidedStep === 1 && 'Step 1: Set Light Distance & Record Illumination'}
                {guidedStep === 2 && 'Step 2: Inspect Open-Circuit Voltage (Voc) and Short-Circuit Current (Isc)'}
                {guidedStep === 3 && 'Step 3: Connect Load Resistor & Vary Values'}
                {guidedStep === 4 && 'Step 4: Log Data across 100Ω to 10kΩ and inspect Maximum Power (Pmax)'}
                {guidedStep === 5 && 'Step 5: Review Fill Factor and Solar Cell Efficiency'}
              </span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {guidedStep === 1 && 'Adjust the distance slider on the 5W lamp to verify inverse-square optical decay.'}
                {guidedStep === 2 && 'Read the digital meters at open-circuit and short-circuit limits.'}
                {guidedStep === 3 && 'Ensure terminal wires form a closed loop. Use discrete decade buttons to step resistance.'}
                {guidedStep === 4 && 'Click "Log Current Reading" for each resistance point to build the experimental I-V curve.'}
                {guidedStep === 5 && 'Inspect the computed Fill Factor and proceed to Viva Voce evaluation.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={guidedStep <= 1}
              onClick={() => setGuidedStep(s => s - 1)}
              className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
            >
              Back
            </button>
            <button
              type="button"
              disabled={guidedStep >= 5}
              onClick={() => setGuidedStep(s => s + 1)}
              className="px-2.5 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 disabled:opacity-30"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Vector Bench & Terminal Wiring */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                  Photovoltaic Apparatus Bench
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {isCircuitClosed ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Loop Closed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 font-medium">
                    Open Circuit
                  </span>
                )}
                {selectedTerminal && (
                  <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-mono animate-pulse">
                    Wiring from: {selectedTerminal.name}
                  </span>
                )}
              </div>
            </div>

            {/* SVG Interactive Workbench Canvas */}
            <div className="relative w-full aspect-[16/8] bg-slate-950 rounded-xl border border-slate-800/90 overflow-hidden shadow-inner">
              <svg viewBox="0 0 760 360" className="w-full h-full select-none">
                {/* Workbench Grid Mat */}
                <defs>
                  <pattern id="benchGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#1e293b" />
                  </pattern>
                </defs>
                <rect width="760" height="360" fill="url(#benchGrid)" />

                {/* 5W Halogen/LED Lamp Source */}
                <g transform="translate(60, 140)">
                  <rect x="-35" y="-45" width="70" height="90" rx="12" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  <circle cx="0" cy="0" r="22" fill="#fbbf24" opacity={0.85} filter="drop-shadow(0 0 12px #f59e0b)" />
                  <path d="M 0 -15 L 12 0 L 0 15 L -12 0 Z" fill="#ffffff" opacity={0.9} />
                  <text y="35" textAnchor="middle" fill="#facc15" fontSize="10" fontWeight="bold">5W LAMP</text>
                  <text y="50" textAnchor="middle" fill="#94a3b8" fontSize="8">d = {(distance * 100).toFixed(0)} cm</text>
                  {/* Light ray cones */}
                  <polygon
                    points="30,-25 150,-65 150,65 30,25"
                    fill="rgba(251, 191, 36, 0.08)"
                  />
                </g>

                {/* Solar Cell Unit Panel */}
                <g transform="translate(190, 130)">
                  <rect x="-40" y="-40" width="80" height="150" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                  {/* Solar wafer grid lines */}
                  <rect x="-34" y="-34" width="68" height="138" fill="#1e3a8a" opacity={0.6} />
                  <line x1="-34" y1="0" x2="34" y2="0" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="-34" y1="35" x2="34" y2="35" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="-34" y1="70" x2="34" y2="70" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 3" />
                  <text y="-48" textAnchor="middle" fill="#60a5fa" fontSize="10" fontWeight="bold">
                    {topology === 'single' ? '1x Si Panel' : topology === 'series' ? '3x Series' : '3x Parallel'}
                  </text>
                </g>

                {/* Digital Voltmeter Chassis */}
                <g transform="translate(380, 50)">
                  <rect x="-25" y="-20" width="110" height="60" rx="8" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
                  <rect x="-15" y="-12" width="90" height="26" rx="4" fill="#020617" />
                  <text x="30" y="6" textAnchor="middle" fill="#34d399" fontSize="13" fontFamily="monospace" fontWeight="bold">
                    {readings.voltage.toFixed(2)} V
                  </text>
                  <text x="30" y="32" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                    VOLTMETER (0-20V)
                  </text>
                </g>

                {/* Digital Ammeter Chassis */}
                <g transform="translate(380, 240)">
                  <rect x="-25" y="-20" width="110" height="60" rx="8" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
                  <rect x="-15" y="-12" width="90" height="26" rx="4" fill="#020617" />
                  <text x="30" y="6" textAnchor="middle" fill="#34d399" fontSize="13" fontFamily="monospace" fontWeight="bold">
                    {readings.current_mA.toFixed(1)} mA
                  </text>
                  <text x="30" y="32" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                    AMMETER (0-200mA)
                  </text>
                </g>

                {/* Variable Decade Resistance Box */}
                <g transform="translate(570, 130)">
                  <rect x="-35" y="-25" width="90" height="110" rx="8" fill="#1e293b" stroke="#d97706" strokeWidth="1.5" />
                  <circle cx="10" cy="15" r="18" fill="#334155" stroke="#f59e0b" strokeWidth="2" />
                  <line x1="10" y1="15" x2="10" y2="3" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                  <text x="10" y="55" textAnchor="middle" fill="#fbbf24" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    {loadResistance >= 1000 ? `${loadResistance / 1000} kΩ` : `${loadResistance} Ω`}
                  </text>
                  <text x="10" y="72" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                    DECADE LOAD
                  </text>
                </g>

                {/* Interactive Terminal Wires */}
                {wires.map((wire) => {
                  const from = terminals.find(t => t.id === wire.fromTerminalId);
                  const to = terminals.find(t => t.id === wire.toTerminalId);
                  if (!from || !to) return null;
                  return (
                    <DraggableWire
                      key={wire.id}
                      wire={wire}
                      fromTerminal={from}
                      toTerminal={to}
                      onRemove={handleRemoveWire}
                    />
                  );
                })}

                {/* Terminals Points */}
                {terminals.map((term) => (
                  <TerminalPoint
                    key={term.id}
                    terminal={term}
                    isSelected={selectedTerminal?.id === term.id}
                    onClick={handleTerminalClick}
                  />
                ))}
              </svg>

              {/* Wiring Instructions Toast in Canvas */}
              <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                Click terminal A then terminal B to connect wire • Click wire to remove
              </div>
            </div>

            {/* Parameter Controls Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <ParameterControl
                label="Lamp Distance to Solar Cell"
                value={Number((distance * 100).toFixed(0))}
                min={10}
                max={100}
                step={5}
                unit="cm"
                onChange={(val) => setDistance(val / 100)}
                description="Controls optical light flux per inverse-square law (1/d²)."
              />

              <ParameterControl
                label="Decade Load Resistance"
                value={loadResistance}
                min={100}
                max={10000}
                step={500}
                unit="Ω"
                onChange={setLoadResistance}
                discreteOptions={[
                  { label: '100 Ω', value: 100 },
                  { label: '220 Ω', value: 220 },
                  { label: '500 Ω', value: 500 },
                  { label: '1 kΩ', value: 1000 },
                  { label: '2 kΩ', value: 2000 },
                  { label: '3 kΩ', value: 3000 },
                  { label: '5 kΩ', value: 5000 },
                  { label: '10 kΩ', value: 10000 },
                ]}
                description="Manual p. 22 Table 1 calibration points."
              />
            </div>
          </div>

          {/* I-V and P-V Characteristic Graph */}
          <LabGraph
            title="Solar Cell Photovoltaic Characteristics (I-V & P-V)"
            series={graphSeries}
            xLabel="Output Voltage"
            xUnit="V"
            yLabel="Current I (mA)"
            secondaryYLabel="Power P (mW)"
            highlightPoint={{
              x: derived.vMax_V,
              y: derived.iMax_mA,
              label: `Pmax (${(derived.pMax_W * 1000).toFixed(1)} mW)`,
              color: '#f59e0b',
            }}
          />
        </div>

        {/* Right Column: Digital Meters, Observations, and KaTeX Formulations */}
        <div className="lg:col-span-4 space-y-4">
          {/* Real-time Laboratory Instruments */}
          <div className="grid grid-cols-2 gap-2">
            <Instrument
              type="voltmeter"
              title="Voltmeter"
              value={readings.voltage.toFixed(2)}
              unit="V"
              range="0–20V DC"
              subLabel="Voc"
              subValue={`${readings.openCircuitVoltage_Voc.toFixed(2)} V`}
            />

            <Instrument
              type="ammeter"
              title="Ammeter"
              value={readings.current_mA.toFixed(1)}
              unit="mA"
              range="0–200mA"
              subLabel="Isc"
              subValue={`${readings.shortCircuitCurrent_Isc_mA.toFixed(1)} mA`}
            />

            <Instrument
              type="luxmeter"
              title="Lux Meter"
              value={readings.lux.toLocaleString()}
              unit="Lux"
              range="Auto"
              subLabel="Io (flux)"
              subValue={`${readings.incidentRadiation_W_per_m2} W/m²`}
            />

            <Instrument
              type="power"
              title="Power Output"
              value={(readings.power_W * 1000).toFixed(2)}
              unit="mW"
              range="Calculated"
              subLabel="Pmax"
              subValue={`${(derived.pMax_W * 1000).toFixed(2)} mW`}
            />
          </div>

          {/* Performance Metrics Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Derived Photovoltaic Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Fill Factor (FF)</div>
                <div className="text-base font-bold text-amber-300">{derived.fillFactor}</div>
                <div className="text-[9px] text-slate-500">Pmax / (Voc × Isc)</div>
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Cell Efficiency (η)</div>
                <div className="text-base font-bold text-emerald-400">{derived.efficiencyPercent}%</div>
                <div className="text-[9px] text-slate-500">Pmax / (Area × Io)</div>
              </div>
            </div>
          </div>

          {/* KaTeX Mathematical Formulas */}
          <FormulaPanel
            formulas={formulas}
            substitutedLatex={substitutedFormula}
            inconsistencyWarning="Manual pp. 28–31 lists current in mA and power in W. True SI power = V × I(A). Displayed in mW for clarity."
          />

          {/* Observation Grid */}
          <ObservationGrid
            title="Observation Table 1: I-V Readings"
            columns={observationColumns}
            rows={observationRows}
            onAddCurrentReading={handleLogReading}
            onRemoveRow={(id) => setObservationRows(prev => prev.filter(r => r.id !== id))}
            onClearAll={() => setObservationRows([])}
            tableSubtitle={`Recorded at distance ${(distance * 100).toFixed(0)} cm (${readings.lux.toLocaleString()} Lux)`}
          />
        </div>
      </div>
    </div>
  );
};
