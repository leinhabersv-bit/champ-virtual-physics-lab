import React, { useState, useMemo } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import { Terminal, WireConnection } from '../../types/workbench';
import {
  solarCellEngine,
  SolarCellParams,
  OFFICIAL_RESISTANCE_SEQUENCE_KOHM,
  ObservationTableDataset,
} from '../../engine/solarCellSimulator';
import { analyzeSolarCircuit } from '../../engine/circuitNetlist';
import { Instrument } from '../primitives/Instrument';
import { FormulaPanel } from '../primitives/FormulaPanel';
import { LabGraph, GraphSeries } from '../primitives/LabGraph';
import { TerminalPoint } from '../primitives/TerminalPoint';
import { DraggableWire } from '../primitives/DraggableWire';
import {
  Sun,
  Layers,
  ArrowLeft,
  Save,
  Printer,
  Compass,
  Award,
  AlertTriangle,
  Zap,
  Sliders,
  CheckCircle,
  HelpCircle,
  Calculator,
  Download,
  Trash2,
  Table,
} from 'lucide-react';

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
  // Mode: Guided vs Exam vs Viva
  const [activeMode, setActiveMode] = useState<'guided' | 'exam' | 'viva'>('guided');
  const [guidedStep, setGuidedStep] = useState<number>(1);
  const [activeTableTab, setActiveTableTab] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Optical Bench State
  const [lampIsOn, setLampIsOn] = useState<boolean>(true);
  const [distance, setDistance] = useState<number>(0.25); // 25 cm (Distance 1 default)
  const [spectralCalibFactor, setSpectralCalibFactor] = useState<number>(0.0125); // W/(m²·lux)
  const [showCalibInfo, setShowCalibInfo] = useState<boolean>(false);

  // Electrical Load & Procedure B State
  const [isProcedureB, setIsProcedureB] = useState<boolean>(false);
  const [selectedAppliance, setSelectedAppliance] = useState<'LED_RED' | 'LED_GREEN' | 'LED_BLUE' | 'MOTOR'>('LED_RED');
  const [currentLimitingResistor, setCurrentLimitingResistor] = useState<number>(220); // 220 Ω
  const [selectedResistanceIndex, setSelectedResistanceIndex] = useState<number>(3); // 1.0 kΩ default
  const activeResistanceKohm = OFFICIAL_RESISTANCE_SEQUENCE_KOHM[selectedResistanceIndex];
  const activeResistanceOhm = Math.round(activeResistanceKohm * 1000);

  // Array Topology
  const [topology, setTopology] = useState<'single' | 'series' | 'parallel'>('single');

  // Circuit Wiring State
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  // Default proper connections
  const [wires, setWires] = useState<WireConnection[]>([
    { id: 'w1', fromTerminalId: 'sc1_pos', toTerminalId: 'amm_pos', color: '#ef4444' },
    { id: 'w2', fromTerminalId: 'amm_neg', toTerminalId: 'load_a', color: '#f59e0b' },
    { id: 'w3', fromTerminalId: 'load_b', toTerminalId: 'sc1_neg', color: '#3b82f6' },
    { id: 'w4', fromTerminalId: 'load_a', toTerminalId: 'vm_pos', color: '#ef4444' },
    { id: 'w5', fromTerminalId: 'load_b', toTerminalId: 'vm_neg', color: '#10b981' },
  ]);

  // Observations store for all 4 tables
  const [table1Data, setTable1Data] = useState<ObservationTableDataset>(() =>
    solarCellEngine.generateFullObservationTable(1, 0.25, 'single')
  );
  const [table2Data, setTable2Data] = useState<ObservationTableDataset>(() =>
    solarCellEngine.generateFullObservationTable(2, 0.12, 'single')
  );
  const [table3Data, setTable3Data] = useState<ObservationTableDataset>(() =>
    solarCellEngine.generateFullObservationTable(3, 0.20, 'series')
  );
  const [table4Data, setTable4Data] = useState<ObservationTableDataset>(() =>
    solarCellEngine.generateFullObservationTable(4, 0.20, 'parallel')
  );

  const [showCalculationsDrawer, setShowCalculationsDrawer] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | undefined>(undefined);

  // Binding post terminals definition in SVG 780 x 360 space
  const terminals: Terminal[] = useMemo(() => [
    // Panel SC1
    { id: 'sc1_pos', name: 'SC1 (+)', polarity: '+', color: '#ef4444', x: 150, y: 110, componentId: 'sc1', componentName: 'Solar Panel 1' },
    { id: 'sc1_neg', name: 'SC1 (-)', polarity: '-', color: '#3b82f6', x: 150, y: 180, componentId: 'sc1', componentName: 'Solar Panel 1' },
    // Panel SC2
    { id: 'sc2_pos', name: 'SC2 (+)', polarity: '+', color: '#ef4444', x: 210, y: 110, componentId: 'sc2', componentName: 'Solar Panel 2' },
    { id: 'sc2_neg', name: 'SC2 (-)', polarity: '-', color: '#3b82f6', x: 210, y: 180, componentId: 'sc2', componentName: 'Solar Panel 2' },
    // Panel SC3
    { id: 'sc3_pos', name: 'SC3 (+)', polarity: '+', color: '#ef4444', x: 270, y: 110, componentId: 'sc3', componentName: 'Solar Panel 3' },
    { id: 'sc3_neg', name: 'SC3 (-)', polarity: '-', color: '#3b82f6', x: 270, y: 180, componentId: 'sc3', componentName: 'Solar Panel 3' },
    // Digital Voltmeter
    { id: 'vm_pos', name: 'V (+)', polarity: '+', color: '#ef4444', x: 420, y: 70, componentId: 'vm', componentName: 'Voltmeter' },
    { id: 'vm_neg', name: 'V (-)', polarity: '-', color: '#10b981', x: 470, y: 70, componentId: 'vm', componentName: 'Voltmeter' },
    // Digital Ammeter
    { id: 'amm_pos', name: 'mA (+)', polarity: '+', color: '#ef4444', x: 420, y: 260, componentId: 'amm', componentName: 'Ammeter' },
    { id: 'amm_neg', name: 'mA (-)', polarity: '-', color: '#3b82f6', x: 470, y: 260, componentId: 'amm', componentName: 'Ammeter' },
    // Decade Resistor / Appliance Load
    { id: 'load_a', name: 'Load A', polarity: 'neutral', color: '#f59e0b', x: 630, y: 130, componentId: 'load', componentName: 'Load Term A' },
    { id: 'load_b', name: 'Load B', polarity: 'neutral', color: '#64748b', x: 630, y: 210, componentId: 'load', componentName: 'Load Term B' },
  ], []);

  // Run Netlist Circuit Analysis
  const circuitAnalysis = useMemo(() => {
    return analyzeSolarCircuit(
      wires,
      topology,
      activeResistanceOhm,
      lampIsOn,
      isProcedureB,
      selectedAppliance,
      currentLimitingResistor
    );
  }, [wires, topology, activeResistanceOhm, lampIsOn, isProcedureB, selectedAppliance, currentLimitingResistor]);

  // Physics Simulation Execution
  const simParams: SolarCellParams = useMemo(() => ({
    distance,
    lampPower: 5.0,
    cellArea: 0.0025,
    loadResistance: circuitAnalysis.isOperating ? circuitAnalysis.effectiveResistance_ohm : 1e8,
    circuitTopology: topology,
    panelCount: 3,
    spectralCalibrationFactor_W_per_m2_per_lux: spectralCalibFactor,
  }), [distance, circuitAnalysis, topology, spectralCalibFactor]);

  const rawReadings = useMemo(() => solarCellEngine.calculateReadings(simParams), [simParams]);
  const derived = useMemo(() => solarCellEngine.computeDerived(rawReadings, simParams), [rawReadings, simParams]);

  // Adjust display readings for reversed polarity or open circuit
  const displayVoltage = useMemo(() => {
    if (!circuitAnalysis.isOperating) return 0.0;
    if (circuitAnalysis.isIscState) return 0.0;
    const v = rawReadings.voltage;
    return circuitAnalysis.hasReversedPolarity ? -v : v;
  }, [circuitAnalysis, rawReadings]);

  const displayCurrent_mA = useMemo(() => {
    if (!circuitAnalysis.isOperating) return 0.0;
    if (circuitAnalysis.isVocState) return 0.0;
    const i = rawReadings.current_mA;
    return circuitAnalysis.hasReversedPolarity ? -i : i;
  }, [circuitAnalysis, rawReadings]);

  const displayPower_mW = useMemo(() => {
    return Math.max(0, displayVoltage * displayCurrent_mA);
  }, [displayVoltage, displayCurrent_mA]);

  // Model curves for graph
  const modelCurve = useMemo(() => solarCellEngine.generateModelCurve(simParams, 80), [simParams]);
  const graphSeries: GraphSeries[] = useMemo(() => {
    const iv = modelCurve.map(pt => ({ x: pt.x, y: pt.y }));
    const pv = modelCurve.map(pt => ({ x: pt.x, y: pt.x * (pt.y / 1000) * 1000 }));
    return [
      { id: 'iv', name: 'I-V Curve', points: iv, color: '#6366f1', unitY: 'mA' },
      { id: 'pv', name: 'Power Curve (P-V)', points: pv, color: '#ec4899', unitY: 'mW', isSecondaryY: true },
    ];
  }, [modelCurve]);

  // Terminal connection handling (Pointer and Keyboard accessible)
  const handleTerminalClick = (term: Terminal) => {
    if (!selectedTerminal) {
      setSelectedTerminal(term);
    } else {
      if (selectedTerminal.id !== term.id) {
        const newWire: WireConnection = {
          id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  // Helper: auto-wire proper circuit
  const handleAutoWire = () => {
    if (topology === 'single') {
      setWires([
        { id: 'w1', fromTerminalId: 'sc1_pos', toTerminalId: 'amm_pos', color: '#ef4444' },
        { id: 'w2', fromTerminalId: 'amm_neg', toTerminalId: 'load_a', color: '#f59e0b' },
        { id: 'w3', fromTerminalId: 'load_b', toTerminalId: 'sc1_neg', color: '#3b82f6' },
        { id: 'w4', fromTerminalId: 'load_a', toTerminalId: 'vm_pos', color: '#ef4444' },
        { id: 'w5', fromTerminalId: 'load_b', toTerminalId: 'vm_neg', color: '#10b981' },
      ]);
    } else if (topology === 'series') {
      setWires([
        { id: 'ws1', fromTerminalId: 'sc1_neg', toTerminalId: 'sc2_pos', color: '#94a3b8' },
        { id: 'ws2', fromTerminalId: 'sc2_neg', toTerminalId: 'sc3_pos', color: '#94a3b8' },
        { id: 'ws3', fromTerminalId: 'sc1_pos', toTerminalId: 'amm_pos', color: '#ef4444' },
        { id: 'ws4', fromTerminalId: 'amm_neg', toTerminalId: 'load_a', color: '#f59e0b' },
        { id: 'ws5', fromTerminalId: 'load_b', toTerminalId: 'sc3_neg', color: '#3b82f6' },
        { id: 'ws6', fromTerminalId: 'load_a', toTerminalId: 'vm_pos', color: '#ef4444' },
        { id: 'ws7', fromTerminalId: 'load_b', toTerminalId: 'vm_neg', color: '#10b981' },
      ]);
    } else {
      setWires([
        { id: 'wp1', fromTerminalId: 'sc1_pos', toTerminalId: 'sc2_pos', color: '#ef4444' },
        { id: 'wp2', fromTerminalId: 'sc2_pos', toTerminalId: 'sc3_pos', color: '#ef4444' },
        { id: 'wp3', fromTerminalId: 'sc1_neg', toTerminalId: 'sc2_neg', color: '#3b82f6' },
        { id: 'wp4', fromTerminalId: 'sc2_neg', toTerminalId: 'sc3_neg', color: '#3b82f6' },
        { id: 'wp5', fromTerminalId: 'sc1_pos', toTerminalId: 'amm_pos', color: '#ef4444' },
        { id: 'wp6', fromTerminalId: 'amm_neg', toTerminalId: 'load_a', color: '#f59e0b' },
        { id: 'wp7', fromTerminalId: 'load_b', toTerminalId: 'sc1_neg', color: '#3b82f6' },
        { id: 'wp8', fromTerminalId: 'load_a', toTerminalId: 'vm_pos', color: '#ef4444' },
        { id: 'wp9', fromTerminalId: 'load_b', toTerminalId: 'vm_neg', color: '#10b981' },
      ]);
    }
  };

  // Helper: auto-wire Voc open-circuit measurement
  const handleAutoWireVoc = () => {
    setWires([
      { id: 'wvoc1', fromTerminalId: 'sc1_pos', toTerminalId: 'vm_pos', color: '#ef4444' },
      { id: 'wvoc2', fromTerminalId: 'sc1_neg', toTerminalId: 'vm_neg', color: '#10b981' },
    ]);
  };

  // Helper: auto-wire Isc short-circuit measurement
  const handleAutoWireIsc = () => {
    setWires([
      { id: 'wisc1', fromTerminalId: 'sc1_pos', toTerminalId: 'amm_pos', color: '#ef4444' },
      { id: 'wisc2', fromTerminalId: 'sc1_neg', toTerminalId: 'amm_neg', color: '#3b82f6' },
    ]);
  };

  // Observation table actions
  const handleUpdateCurrentTableRow = () => {
    const activeDataset =
      activeTableTab === 1 ? table1Data :
      activeTableTab === 2 ? table2Data :
      activeTableTab === 3 ? table3Data : table4Data;

    const updatedRows = activeDataset.rows.map((row, idx) => {
      if (idx === selectedResistanceIndex) {
        return {
          ...row,
          current_mA: Number(displayCurrent_mA.toFixed(2)),
          voltage_V: Number(displayVoltage.toFixed(3)),
          power_W: Number(((displayVoltage * displayCurrent_mA) / 1000).toFixed(5)),
          power_mW: Number((displayVoltage * displayCurrent_mA).toFixed(2)),
        };
      }
      return row;
    });

    const updatedDataset: ObservationTableDataset = {
      ...activeDataset,
      rows: updatedRows,
      voc_V: rawReadings.openCircuitVoltage_Voc,
      isc_mA: rawReadings.shortCircuitCurrent_Isc_mA,
      lux: rawReadings.lux,
      intensity_Io_W_per_m2: rawReadings.incidentRadiation_W_per_m2,
      pMax_W: derived.pMax_W,
      vMax_V: derived.vMax_V,
      iMax_mA: derived.iMax_mA,
      fillFactor: derived.fillFactor,
      efficiencyPercent: derived.efficiencyPercent ?? 0,
    };

    if (activeTableTab === 1) setTable1Data(updatedDataset);
    else if (activeTableTab === 2) setTable2Data(updatedDataset);
    else if (activeTableTab === 3) setTable3Data(updatedDataset);
    else if (activeTableTab === 4) setTable4Data(updatedDataset);
  };

  const handleSweepFullTable = (tabNum: 1 | 2 | 3 | 4) => {
    let d = 0.25;
    let top: 'single' | 'series' | 'parallel' = 'single';
    if (tabNum === 1) { d = 0.25; top = 'single'; }
    else if (tabNum === 2) { d = 0.12; top = 'single'; }
    else if (tabNum === 3) { d = 0.20; top = 'series'; }
    else if (tabNum === 4) { d = 0.20; top = 'parallel'; }

    const dataset = solarCellEngine.generateFullObservationTable(tabNum, d, top);
    if (tabNum === 1) setTable1Data(dataset);
    else if (tabNum === 2) setTable2Data(dataset);
    else if (tabNum === 3) setTable3Data(dataset);
    else if (tabNum === 4) setTable4Data(dataset);
  };

  // CSV Export for active table
  const handleExportCSV = (dataset: ObservationTableDataset) => {
    const headers = ['Sl.No', 'Resistance (kΩ)', 'Current (mA)', 'Voltage (V)', 'Power (W)', 'Power (mW)'];
    const rows = dataset.rows.map(r =>
      [r.slNo, r.resistance_kohm, r.current_mA, r.voltage_V, r.power_W, r.power_mW].join(',')
    );
    const content = [
      `# ${dataset.title}`,
      `# Voc = ${dataset.voc_V} V, Isc = ${dataset.isc_mA} mA, Distance = ${dataset.distance_m} m, Intensity Io = ${dataset.intensity_Io_W_per_m2} W/m2`,
      headers.join(','),
      ...rows,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table_${dataset.tableNumber}_solar_cell.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // KaTeX formulas
  const formulas = useMemo(() => [
    {
      title: 'Open Circuit Voltage (Voc) & Short Circuit Current (Isc)',
      latex: 'V_{oc} = \\text{Maximum voltage with no load (R} \\to \\infty\\text{)}, \\quad I_{sc} = \\text{Maximum current with short (R} \\to 0\\text{)}',
      explanation: 'Fundamental solar cell parameters required for performance and Fill Factor calculations.',
      sourceNote: 'Manual p. 20',
    },
    {
      title: 'Power Output with SI Conversion',
      latex: 'P = V \\times I = V \\times \\left(\\frac{I_{\\text{mA}}}{1000}\\right) \\quad \\text{(Watts)}',
      explanation: 'Observation tables list current in mA; multiply by 10⁻³ to compute true SI power in Watts.',
      sourceNote: 'Manual p. 20 & errata register',
    },
    {
      title: 'Fill Factor (FF)',
      latex: 'FF = \\frac{P_{max}}{V_{oc} \\times I_{sc}} = \\frac{I_{max} \\times V_{max}}{V_{oc} \\times I_{sc}} \\quad \\text{(Dimensionless)}',
      explanation: 'Indicates the rectangularity and internal junction quality of the photovoltaic cell.',
      sourceNote: 'Manual p. 20',
    },
    {
      title: 'Solar Cell Efficiency (η)',
      latex: '\\eta = \\frac{P_{max}}{A \\times I_0} \\times 100\\%',
      explanation: 'Where A is cell area (m²) and I₀ is calibrated incident radiometric irradiance (W/m²).',
      sourceNote: 'Manual p. 20',
    },
  ], []);

  const getSubstitutedCalculations = () => {
    const voc = rawReadings.openCircuitVoltage_Voc;
    const isc_A = rawReadings.shortCircuitCurrent_Isc_mA / 1000;
    const pmax_W = derived.pMax_W;
    const ff = derived.fillFactor;
    const area = 0.0025;
    const io = rawReadings.incidentRadiation_W_per_m2;
    const eff = derived.efficiencyPercent ?? 0;

    return `FF = \\frac{${pmax_W.toFixed(5)}\\,\\text{W}}{${voc.toFixed(2)}\\,\\text{V} \\times ${isc_A.toFixed(4)}\\,\\text{A}} = ${ff.toFixed(3)}, \\quad \\eta = \\frac{${pmax_W.toFixed(5)}\\,\\text{W}}{${area}\\,\\text{m}^2 \\times ${io.toFixed(1)}\\,\\text{W/m}^2} \\times 100\\% = ${eff.toFixed(2)}\\%`;
  };

  // Get active dataset for observation view
  const currentDataset =
    activeTableTab === 1 ? table1Data :
    activeTableTab === 2 ? table2Data :
    activeTableTab === 3 ? table3Data :
    activeTableTab === 4 ? table4Data : null;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* Workbench Header & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[10px] font-bold tracking-wide uppercase">
                {metadata.statusBadge}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                BAPHY105 • {metadata.pdfPageRange} (Printed {metadata.printedPageRange})
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 font-mono">
                [SIMULATED DATA]
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-100 mt-0.5">
              Experiment 1: Solar Cell Renewable Energy Circuit &amp; Photovoltaic Characteristics
            </h1>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('guided')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeMode === 'guided' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Guided
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('exam')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeMode === 'exam' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Exam Mode
            </button>
            <button
              type="button"
              onClick={onOpenViva}
              className="px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 text-purple-300 hover:text-purple-200"
            >
              <Award className="w-3.5 h-3.5 text-purple-400" />
              Viva (3M)
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
            title="Print Lab Record Sheet"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              const runState = { table1Data, table2Data, table3Data, table4Data, timestamp: new Date().toLocaleTimeString() };
              localStorage.setItem('champ_solar_cell_full_run', JSON.stringify(runState));
              setLastSaved(new Date().toLocaleTimeString());
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            {lastSaved ? `Saved ${lastSaved}` : 'Save Lab Run'}
          </button>
        </div>
      </div>

      {/* Guided Mode Prompt Banner */}
      {activeMode === 'guided' && (
        <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-3 shadow-md flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
              {guidedStep}
            </div>
            <div className="text-xs">
              <span className="font-bold text-indigo-200 text-sm">
                {guidedStep === 1 && 'Step 1: Switch ON 5W Lamp & Verify Optical Illumination'}
                {guidedStep === 2 && 'Step 2: Measure Open-Circuit Voltage (Voc) and Short-Circuit Current (Isc)'}
                {guidedStep === 3 && 'Step 3: Connect Circuit & Sweep All 13 Resistance Rows'}
                {guidedStep === 4 && 'Step 4: Repeat for Distance 2 (Least Distance), Series & Parallel Arrays'}
                {guidedStep === 5 && 'Step 5: Test Procedure B Practical Appliance (LED / Motor) Variant'}
              </span>
              <p className="text-slate-400 text-xs mt-0.5">
                {guidedStep === 1 && 'Verify that the 5W lamp is ON. Calibrate the distance to 25 cm for Table 1 and observe the lux reading.'}
                {guidedStep === 2 && 'Connect the voltmeter directly across the solar cell to record Voc, then use ammeter to measure Isc.'}
                {guidedStep === 3 && 'Form the complete closed loop: Solar Cell -> Ammeter -> Load Resistor -> Solar Cell. Step through 0.1 to 10 kΩ.'}
                {guidedStep === 4 && 'Switch table tabs above to populate Tables 2, 3, and 4. Compare series vs parallel voltage and current.'}
                {guidedStep === 5 && 'Switch to Procedure B to test glowing LEDs and note the role of current-limiting resistors.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={guidedStep <= 1}
              onClick={() => setGuidedStep(s => s - 1)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={guidedStep >= 5}
              onClick={() => setGuidedStep(s => s + 1)}
              className="px-3 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 disabled:opacity-30"
            >
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* Main Vector Apparatus & Circuit Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Visual Apparatus & Topology Bench */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Bench Header & Circuit Status Diagnostics */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                  Physical Solar Cell Workbench &amp; Wiring Netlist
                </h2>
              </div>

              {/* Circuit Wiring Quick Helpers */}
              <div className="flex items-center gap-1.5 text-xs no-print">
                <button
                  type="button"
                  onClick={handleAutoWire}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-800 text-indigo-300 font-medium"
                >
                  Auto-Wire Normal
                </button>
                <button
                  type="button"
                  onClick={handleAutoWireVoc}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Wire Voc
                </button>
                <button
                  type="button"
                  onClick={handleAutoWireIsc}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Wire Isc
                </button>
                <button
                  type="button"
                  onClick={() => setWires([])}
                  className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-900"
                  title="Clear All Wires"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Diagnostic Alert Banner from Netlist Analyzer */}
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                circuitAnalysis.status === 'VALID_CLOSED_CIRCUIT'
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                  : circuitAnalysis.status === 'OPEN_CIRCUIT_VOC_MEASUREMENT'
                  ? 'bg-sky-950/30 border-sky-800/60 text-sky-200'
                  : circuitAnalysis.status === 'SHORT_CIRCUIT_ISC_MEASUREMENT'
                  ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                  : 'bg-rose-950/40 border-rose-800/70 text-rose-200'
              }`}
            >
              <div className="mt-0.5">
                {circuitAnalysis.status === 'VALID_CLOSED_CIRCUIT' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {circuitAnalysis.status === 'OPEN_CIRCUIT_VOC_MEASUREMENT' && <Zap className="w-4 h-4 text-sky-400" />}
                {circuitAnalysis.status === 'SHORT_CIRCUIT_ISC_MEASUREMENT' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {circuitAnalysis.status.startsWith('ERROR') && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                {circuitAnalysis.status === 'OPEN_CIRCUIT_DISCONNECTED' && <HelpCircle className="w-4 h-4 text-slate-400" />}
              </div>
              <div className="flex-1">
                <span className="font-bold">Circuit Status: </span>
                {circuitAnalysis.message}
                {circuitAnalysis.warnings.length > 0 && (
                  <ul className="list-disc list-inside mt-1 text-[11px] text-amber-300">
                    {circuitAnalysis.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="relative w-full aspect-[16/8] bg-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden shadow-inner">
              <svg viewBox="0 0 780 360" className="w-full h-full select-none">
                <defs>
                  <pattern id="solGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#1e293b" />
                  </pattern>
                </defs>
                <rect width="780" height="360" fill="url(#solGrid)" />

                {/* 5W Lamp Assembly */}
                <g transform="translate(60, 140)">
                  <rect x="-35" y="-50" width="70" height="100" rx="12" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  {/* Light bulb with switch */}
                  <circle
                    cx="0"
                    cy="0"
                    r={lampIsOn ? 22 : 16}
                    fill={lampIsOn ? '#fbbf24' : '#475569'}
                    opacity={lampIsOn ? 0.9 : 0.4}
                    filter={lampIsOn ? 'drop-shadow(0 0 14px #f59e0b)' : 'none'}
                  />
                  <text y="38" textAnchor="middle" fill="#facc15" fontSize="10" fontWeight="bold">5W LAMP</text>
                  <text y="52" textAnchor="middle" fill="#94a3b8" fontSize="8">
                    {lampIsOn ? `${(distance * 100).toFixed(0)} cm` : 'OFF'}
                  </text>
                  {/* Optical rays */}
                  {lampIsOn && (
                    <polygon
                      points="35,-30 180,-70 180,70 35,30"
                      fill="rgba(251, 191, 36, 0.08)"
                    />
                  )}
                </g>

                {/* 3 Silicon Solar Cell Modules Chassis */}
                <g transform="translate(130, 70)">
                  <rect x="-10" y="-10" width="180" height="170" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                  <text x="80" y="8" textAnchor="middle" fill="#60a5fa" fontSize="10" fontWeight="bold">
                    SILICON SOLAR CELLS (SC1, SC2, SC3)
                  </text>

                  {/* Panel 1 */}
                  <g transform="translate(20, 20)">
                    <rect width="36" height="90" rx="4" fill="#1e3a8a" stroke="#3b82f6" />
                    <line x1="0" y1="30" x2="36" y2="30" stroke="#60a5fa" strokeDasharray="2 2" />
                    <line x1="0" y1="60" x2="36" y2="60" stroke="#60a5fa" strokeDasharray="2 2" />
                    <text x="18" y="48" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="bold">SC1</text>
                  </g>

                  {/* Panel 2 */}
                  <g transform="translate(80, 20)">
                    <rect width="36" height="90" rx="4" fill="#1e3a8a" stroke="#3b82f6" />
                    <line x1="0" y1="30" x2="36" y2="30" stroke="#60a5fa" strokeDasharray="2 2" />
                    <line x1="0" y1="60" x2="36" y2="60" stroke="#60a5fa" strokeDasharray="2 2" />
                    <text x="18" y="48" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="bold">SC2</text>
                  </g>

                  {/* Panel 3 */}
                  <g transform="translate(140, 20)">
                    <rect width="36" height="90" rx="4" fill="#1e3a8a" stroke="#3b82f6" />
                    <line x1="0" y1="30" x2="36" y2="30" stroke="#60a5fa" strokeDasharray="2 2" />
                    <line x1="0" y1="60" x2="36" y2="60" stroke="#60a5fa" strokeDasharray="2 2" />
                    <text x="18" y="48" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="bold">SC3</text>
                  </g>
                </g>

                {/* Digital Voltmeter */}
                <g transform="translate(420, 40)">
                  <rect x="-25" y="-15" width="115" height="65" rx="8" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
                  <rect x="-15" y="-8" width="95" height="26" rx="4" fill="#020617" />
                  <text x="32" y="10" textAnchor="middle" fill="#34d399" fontSize="13" fontFamily="monospace" fontWeight="bold">
                    {displayVoltage.toFixed(2)} V
                  </text>
                  <text x="32" y="38" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                    VOLTMETER (0–20V)
                  </text>
                </g>

                {/* Digital Ammeter */}
                <g transform="translate(420, 230)">
                  <rect x="-25" y="-15" width="115" height="65" rx="8" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
                  <rect x="-15" y="-8" width="95" height="26" rx="4" fill="#020617" />
                  <text x="32" y="10" textAnchor="middle" fill="#34d399" fontSize="13" fontFamily="monospace" fontWeight="bold">
                    {displayCurrent_mA.toFixed(1)} mA
                  </text>
                  <text x="32" y="38" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                    AMMETER (0–200mA)
                  </text>
                </g>

                {/* Load Chassis: Decade Resistor OR Procedure B Appliance */}
                <g transform="translate(630, 110)">
                  <rect x="-35" y="-20" width="105" height="135" rx="10" fill="#1e293b" stroke="#d97706" strokeWidth="1.5" />
                  {!isProcedureB ? (
                    <>
                      <circle cx="17" cy="30" r="22" fill="#334155" stroke="#f59e0b" strokeWidth="2" />
                      <line x1="17" y1="30" x2="17" y2="12" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                      <text x="17" y="72" textAnchor="middle" fill="#fbbf24" fontSize="11" fontFamily="monospace" fontWeight="bold">
                        {activeResistanceKohm} kΩ
                      </text>
                      <text x="17" y="88" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                        DECADE RESISTOR
                      </text>
                    </>
                  ) : (
                    <>
                      {/* Appliance Variant */}
                      <circle
                        cx="17"
                        cy="30"
                        r={18}
                        fill={
                          selectedAppliance === 'LED_RED' ? '#ef4444' :
                          selectedAppliance === 'LED_GREEN' ? '#22c55e' :
                          selectedAppliance === 'LED_BLUE' ? '#3b82f6' : '#eab308'
                        }
                        opacity={displayCurrent_mA > 1 ? 0.9 : 0.3}
                        filter={displayCurrent_mA > 1 ? 'drop-shadow(0 0 10px #f59e0b)' : 'none'}
                      />
                      <text x="17" y="72" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        {selectedAppliance.replace('_', ' ')}
                      </text>
                      <text x="17" y="88" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                        R_lim = {currentLimitingResistor} Ω
                      </text>
                    </>
                  )}
                </g>

                {/* Connecting Wires */}
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

                {/* Terminal Posts */}
                {terminals.map((term) => (
                  <TerminalPoint
                    key={term.id}
                    terminal={term}
                    isSelected={selectedTerminal?.id === term.id}
                    onClick={handleTerminalClick}
                  />
                ))}
              </svg>

              {/* Status footer on canvas */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                <span>Wiring: Click Terminal A → Click Terminal B to connect • Click wire to remove</span>
                <span className="text-indigo-300 font-semibold">{wires.length} Leads Active</span>
              </div>
            </div>

            {/* Optical & Physical Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Lamp Switch & Presets */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    5W Light Source
                  </span>
                  <button
                    type="button"
                    onClick={() => setLampIsOn(!lampIsOn)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                      lampIsOn ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {lampIsOn ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDistance(0.25)}
                    className={`flex-1 py-1 text-[11px] rounded font-mono font-medium border transition-all ${
                      Math.abs(distance - 0.25) < 0.01
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Dist 1 (25cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDistance(0.12)}
                    className={`flex-1 py-1 text-[11px] rounded font-mono font-medium border transition-all ${
                      Math.abs(distance - 0.12) < 0.01
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Least Dist (12cm)
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Distance: {(distance * 100).toFixed(0)} cm</span>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={2}
                    value={distance * 100}
                    onChange={(e) => setDistance(parseFloat(e.target.value) / 100)}
                    className="w-24 accent-amber-500"
                    aria-label="Adjust lamp distance"
                  />
                </div>
              </div>

              {/* Topology Selector */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Array Topology
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {(['single', 'series', 'parallel'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopology(t)}
                      className={`py-1 text-[10px] font-bold uppercase rounded transition-all ${
                        topology === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {topology === 'single' && '1 Cell (Voc ~ 2.45V, Isc ~ 14mA)'}
                  {topology === 'series' && '3 in Series (Voc ~ 7.35V, Isc ~ 14mA)'}
                  {topology === 'parallel' && '3 in Parallel (Voc ~ 2.45V, Isc ~ 42mA)'}
                </div>
              </div>

              {/* Procedure A vs B Selector */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  Mode Variant
                </span>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setIsProcedureB(false)}
                    className={`py-1 text-[10px] font-bold uppercase rounded transition-all ${
                      !isProcedureB ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Proc A: Resistor
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProcedureB(true)}
                    className={`py-1 text-[10px] font-bold uppercase rounded transition-all ${
                      isProcedureB ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Proc B: Appliance
                  </button>
                </div>

                {isProcedureB && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1">
                      {(['LED_RED', 'LED_GREEN', 'LED_BLUE', 'MOTOR'] as const).map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setSelectedAppliance(app)}
                          className={`flex-1 py-0.5 text-[9px] rounded font-mono ${
                            selectedAppliance === app ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          {app.replace('LED_', '')}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>R_limit: {currentLimitingResistor} Ω</span>
                      <div className="flex gap-1">
                        {[100, 220, 330, 470].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setCurrentLimitingResistor(r)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              currentLimitingResistor === r ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            {r}Ω
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Official 13 Resistance Buttons Sequence (Procedure A) */}
            {!isProcedureB && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Official Syllabus Resistance Sweep Points (13 Values):
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Selected: {activeResistanceKohm} kΩ ({activeResistanceOhm} Ω)
                  </span>
                </div>
                <div className="grid grid-cols-7 sm:grid-cols-13 gap-1">
                  {OFFICIAL_RESISTANCE_SEQUENCE_KOHM.map((kohm, idx) => (
                    <button
                      key={kohm}
                      type="button"
                      onClick={() => setSelectedResistanceIndex(idx)}
                      className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                        selectedResistanceIndex === idx
                          ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {kohm}k
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* I-V and P-V Characteristic Curve Plot */}
          <LabGraph
            title={`Photovoltaic Characteristics (${topology.toUpperCase()} Config)`}
            series={graphSeries}
            xLabel="Terminal Voltage V"
            xUnit="V"
            yLabel="Current I (mA)"
            secondaryYLabel="Power P (mW)"
            highlightPoint={{
              x: derived.vMax_V,
              y: derived.iMax_mA,
              label: `MPP: ${derived.pMax_mW} mW (${derived.vMax_V}V, ${derived.iMax_mA}mA)`,
              color: '#f59e0b',
            }}
          />
        </div>

        {/* Right Column: Digital Meters, Lux/Irradiance Calibration, & Calculations */}
        <div className="lg:col-span-4 space-y-4">
          {/* Digital Instruments */}
          <div className="grid grid-cols-2 gap-2">
            <Instrument
              type="voltmeter"
              title="Voltmeter"
              value={displayVoltage.toFixed(2)}
              unit="V"
              range="0–20V DC"
              subLabel="Voc"
              subValue={`${rawReadings.openCircuitVoltage_Voc.toFixed(2)} V`}
            />

            <Instrument
              type="ammeter"
              title="Ammeter"
              value={displayCurrent_mA.toFixed(1)}
              unit="mA"
              range="0–200mA"
              subLabel="Isc"
              subValue={`${rawReadings.shortCircuitCurrent_Isc_mA.toFixed(1)} mA`}
            />

            <Instrument
              type="luxmeter"
              title="Lux Meter"
              value={rawReadings.lux.toLocaleString()}
              unit="Lux"
              range="Auto"
              subLabel="Photometric"
              subValue="lumen/m²"
            />

            <Instrument
              type="power"
              title="Power Output"
              value={displayPower_mW.toFixed(2)}
              unit="mW"
              range="P = V × I"
              subLabel="Pmax"
              subValue={`${derived.pMax_mW} mW`}
            />
          </div>

          {/* Lux vs Radiometric Irradiance (Io) Calibration Box */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Optical Radiometry vs Photometry
              </span>
              <button
                type="button"
                onClick={() => setShowCalibInfo(!showCalibInfo)}
                className="text-[10px] text-amber-400 hover:text-amber-200 underline font-mono"
              >
                {showCalibInfo ? 'Hide Justification' : 'Why Lux ≠ W/m²?'}
              </button>
            </div>

            <div className="text-xs text-slate-300 leading-snug">
              <p>
                <strong>Lux is NOT W/m²:</strong> 1 Lux = 1 lumen/m² represents human eye spectral sensitivity (photopic curve), whereas solar cell efficiency requires true radiant optical flux density I₀ in W/m².
              </p>
            </div>

            {showCalibInfo && (
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1 animate-fadeIn">
                <p>
                  For a 5W tungsten/halogen lamp, luminous efficacy is ≈ 80 lm/W. Hence radiometric irradiance I₀ = Lux × K_calib, where K_calib ≈ 0.0125 W/(m²·lx).
                </p>
                <div className="flex items-center justify-between pt-1 font-mono">
                  <span>Calibrated I₀:</span>
                  <span className="text-amber-300 font-bold">{rawReadings.incidentRadiation_W_per_m2} W/m²</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-xs font-mono">
              <span className="text-slate-400">K_calib:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max="0.05"
                  value={spectralCalibFactor}
                  onChange={(e) => setSpectralCalibFactor(Math.max(0.001, parseFloat(e.target.value) || 0.0125))}
                  className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-300 font-mono text-right text-xs"
                  aria-label="Spectral calibration factor"
                />
                <span className="text-[10px] text-slate-500">W/(m²·lx)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs font-mono">
              <span className="text-slate-400">Irradiance I₀:</span>
              <span className="text-emerald-400 font-bold">{rawReadings.incidentRadiation_W_per_m2} W/m²</span>
            </div>
          </div>

          {/* Derived Photovoltaic Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                Photovoltaic Parameters
              </h3>
              <button
                type="button"
                onClick={() => setShowCalculationsDrawer(!showCalculationsDrawer)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {showCalculationsDrawer ? 'Hide Steps' : 'Step-by-Step Calc'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Pmax (MPP)</div>
                <div className="text-base font-bold text-amber-300">{derived.pMax_mW} mW</div>
                <div className="text-[9px] text-slate-500">{derived.pMax_W} W</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Vmax / Imax</div>
                <div className="text-base font-bold text-slate-200">{derived.vMax_V}V</div>
                <div className="text-[9px] text-slate-400">{derived.iMax_mA} mA</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Fill Factor (FF)</div>
                <div className="text-base font-bold text-indigo-300">{derived.fillFactor}</div>
                <div className="text-[9px] text-slate-500">Pmax / (Voc × Isc)</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Efficiency (η)</div>
                <div className="text-base font-bold text-emerald-400">
                  {derived.efficiencyPercent !== null ? `${derived.efficiencyPercent}%` : 'N/A'}
                </div>
                <div className="text-[9px] text-slate-500">100·Pmax / (A·Io)</div>
              </div>
            </div>

            {/* Step-by-Step Calculations Drawer */}
            {showCalculationsDrawer && (
              <div className="p-3 bg-slate-950 rounded-xl border border-indigo-900/50 text-xs space-y-2 animate-fadeIn font-mono">
                <div className="text-indigo-300 font-bold text-[11px] border-b border-slate-800 pb-1">
                  Line-by-Line Sample Calculations:
                </div>
                <div className="text-[11px] text-slate-300 space-y-1.5">
                  <p>
                    <strong>1. Power Calculation:</strong><br />
                    P = V × I = {displayVoltage.toFixed(3)} V × ({displayCurrent_mA.toFixed(2)} mA / 1000) = {((displayVoltage * displayCurrent_mA)/1000).toFixed(5)} W ({displayPower_mW.toFixed(2)} mW)
                  </p>
                  <p>
                    <strong>2. Maximum Power Point (MPP):</strong><br />
                    Pmax = Vmax × Imax = {derived.vMax_V} V × ({derived.iMax_mA} mA / 1000) = {derived.pMax_W} W ({derived.pMax_mW} mW)
                  </p>
                  <p>
                    <strong>3. Fill Factor (FF):</strong><br />
                    FF = Pmax / (Voc × Isc) = {derived.pMax_W} W / ({rawReadings.openCircuitVoltage_Voc} V × {(rawReadings.shortCircuitCurrent_Isc_mA / 1000).toFixed(4)} A) = {derived.fillFactor}
                  </p>
                  <p>
                    <strong>4. Solar Cell Efficiency (η):</strong><br />
                    η = [Pmax / (A × Io)] × 100% = [{derived.pMax_W} W / (0.0025 m² × {rawReadings.incidentRadiation_W_per_m2} W/m²)] × 100% = {derived.efficiencyPercent}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* KaTeX Formulas */}
          <FormulaPanel
            formulas={formulas}
            substitutedLatex={getSubstitutedCalculations()}
            inconsistencyWarning="Manual pp. 28–31 lists current in mA and power in W. Direct V × I(mA) gives mW. Our engine converts mA to A to report true SI Watts."
          />
        </div>
      </div>

      {/* Observation Tables Section (Tabs 1–4 matching Manual pp. 28–31 + Master Results Table) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Table Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTableTab(1)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTableTab === 1 ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Table 1: Single (Dist 1)
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab(2)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTableTab === 2 ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Table 2: Single (Least Dist)
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab(3)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTableTab === 3 ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Table 3: Series Array
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab(4)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTableTab === 4 ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Table 4: Parallel Array
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab(5)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTableTab === 5 ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Results Summary Table
            </button>
          </div>

          {currentDataset && (
            <div className="flex items-center gap-2 no-print">
              <button
                type="button"
                onClick={handleUpdateCurrentTableRow}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Table className="w-3.5 h-3.5" />
                Log Reading for {activeResistanceKohm}kΩ
              </button>
              <button
                type="button"
                onClick={() => handleSweepFullTable(activeTableTab as 1 | 2 | 3 | 4)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
              >
                Auto-Sweep 13 Rows
              </button>
              <button
                type="button"
                onClick={() => handleExportCSV(currentDataset)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                title="Export Table CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Tab Content: Table 1 to 4 */}
        {currentDataset && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 tracking-wide">{currentDataset.title}</h3>
            {/* Table Metadata Banner from Manual */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Open Circuit Voltage (Voc)</span>
                <span className="text-amber-300 font-bold">{currentDataset.voc_V} V</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Short Circuit Current (Isc)</span>
                <span className="text-amber-300 font-bold">{currentDataset.isc_mA} mA</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Lamp Distance</span>
                <span className="text-slate-200 font-bold">{currentDataset.distance_m * 100} cm</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Cell Area (A)</span>
                <span className="text-slate-200 font-bold">{currentDataset.area_m2} m²</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Intensity (Io)</span>
                <span className="text-emerald-400 font-bold">{currentDataset.intensity_Io_W_per_m2} W/m²</span>
              </div>
            </div>

            {/* 13 Rows Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono font-semibold">
                    <th className="p-2.5 w-14 text-center">S. No</th>
                    <th className="p-2.5">Resistance (kΩ)</th>
                    <th className="p-2.5">Current (mA)</th>
                    <th className="p-2.5">Voltage (V)</th>
                    <th className="p-2.5">Power (W) [SI]</th>
                    <th className="p-2.5">Power (mW)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {currentDataset.rows.map((row) => {
                    const isSelected = !isProcedureB && row.resistance_kohm === activeResistanceKohm;
                    return (
                      <tr
                        key={row.slNo}
                        className={`transition-colors ${
                          isSelected ? 'bg-indigo-950/40 text-indigo-200 font-bold' : 'hover:bg-slate-800/40 text-slate-200'
                        }`}
                      >
                        <td className="p-2.5 text-center text-slate-400">{row.slNo}</td>
                        <td className="p-2.5 font-bold">{row.resistance_kohm}</td>
                        <td className="p-2.5">{row.current_mA.toFixed(2)}</td>
                        <td className="p-2.5">{row.voltage_V.toFixed(3)}</td>
                        <td className="p-2.5 text-slate-400">{row.power_W.toFixed(5)}</td>
                        <td className="p-2.5 text-indigo-300 font-bold">{row.power_mW.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Derived Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-400">Pmax: </span>
                <span className="text-amber-300 font-bold">{currentDataset.pMax_W} W</span>
                <span className="text-slate-500 text-[10px]"> ({currentDataset.vMax_V}V, {currentDataset.iMax_mA}mA)</span>
              </div>
              <div>
                <span className="text-slate-400">Fill Factor (FF): </span>
                <span className="text-indigo-300 font-bold">{currentDataset.fillFactor}</span>
              </div>
              <div>
                <span className="text-slate-400">Efficiency (η): </span>
                <span className="text-emerald-400 font-bold">{currentDataset.efficiencyPercent}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Master Results Table from Manual p. 32 */}
        {activeTableTab === 5 && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wide">
                Master Results Summary (Manual p. 32 Parity)
              </h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Comparative analysis of single cell at dual distances and multi-cell series/parallel arrays.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono font-semibold">
                    <th className="p-3">Configuration</th>
                    <th className="p-3">Distance (m)</th>
                    <th className="p-3">Maximum Power (Pmax, W)</th>
                    <th className="p-3">Fill Factor (FF)</th>
                    <th className="p-3">Efficiency (η %)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="p-3 font-bold text-slate-100">
                      Single solar cell (Distance 1)<br />
                      <span className="text-[10px] text-slate-400">Area = 0.0025 m²</span>
                    </td>
                    <td className="p-3">{table1Data.distance_m} m</td>
                    <td className="p-3 text-amber-300 font-bold">{table1Data.pMax_W} W</td>
                    <td className="p-3 text-indigo-300">{table1Data.fillFactor}</td>
                    <td className="p-3 text-emerald-400 font-bold">{table1Data.efficiencyPercent}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-100">
                      Single solar cell (Least distance)<br />
                      <span className="text-[10px] text-slate-400">Area = 0.0025 m²</span>
                    </td>
                    <td className="p-3">{table2Data.distance_m} m</td>
                    <td className="p-3 text-amber-300 font-bold">{table2Data.pMax_W} W</td>
                    <td className="p-3 text-indigo-300">{table2Data.fillFactor}</td>
                    <td className="p-3 text-emerald-400 font-bold">{table2Data.efficiencyPercent}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-100">
                      Solar cells in series<br />
                      <span className="text-[10px] text-slate-400">Area = 0.0075 m², Panels = 3</span>
                    </td>
                    <td className="p-3">{table3Data.distance_m} m</td>
                    <td className="p-3 text-amber-300 font-bold">{table3Data.pMax_W} W</td>
                    <td className="p-3 text-indigo-300">{table3Data.fillFactor}</td>
                    <td className="p-3 text-emerald-400 font-bold">{table3Data.efficiencyPercent}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-100">
                      Solar cells in parallel<br />
                      <span className="text-[10px] text-slate-400">Area = 0.0075 m², Panels = 3</span>
                    </td>
                    <td className="p-3">{table4Data.distance_m} m</td>
                    <td className="p-3 text-amber-300 font-bold">{table4Data.pMax_W} W</td>
                    <td className="p-3 text-indigo-300">{table4Data.fillFactor}</td>
                    <td className="p-3 text-emerald-400 font-bold">{table4Data.efficiencyPercent}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
