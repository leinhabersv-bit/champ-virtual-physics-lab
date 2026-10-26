import React, { useState, useMemo } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import { Terminal, WireConnection } from '../../types/workbench';
import {
  ledPlanckEngine,
  LED_SPECS,
  LED_COLOR_KEYS,
  LedTableRow,
  LinearFitResult,
} from '../../engine/ledPlanckSimulator';
import { analyzeLedCircuit } from '../../engine/ledPlanckNetlist';
import { Instrument } from '../primitives/Instrument';
import { LabGraph, GraphSeries } from '../primitives/LabGraph';
import { TerminalPoint } from '../primitives/TerminalPoint';
import { DraggableWire } from '../primitives/DraggableWire';
import { GuidedLabPanel } from '../instructional/GuidedLabPanel';
import { SetupDiagramPanel } from '../instructional/SetupDiagramPanel';
import { ledPlanckConfigurations, ledPlanckSteps } from '../../instructional/procedureDefinitions';
import { ExperimentProcedure } from '../../types/instructional';
import {
  Zap,
  ArrowLeft,
  Printer,
  Compass,
  Award,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Calculator,
  Download,
  Trash2,
  Table,
  Sliders,
  TrendingUp,
} from 'lucide-react';

interface LedPlanckWorkbenchProps {
  metadata: ExperimentMetadata;
  onBackToDashboard: () => void;
  onOpenViva: () => void;
}

export const LedPlanckWorkbench: React.FC<LedPlanckWorkbenchProps> = ({
  metadata,
  onBackToDashboard,
  onOpenViva,
}) => {
  // Mode switcher: Guided vs Exam
  const [activeMode, setActiveMode] = useState<'guided' | 'exam' | 'viva'>('guided');
  const [activeTableTab, setActiveTableTab] = useState<'table1' | 'table2'>('table1');
  const [activeGraphTab, setActiveGraphTab] = useState<'iv' | 'planck'>('iv');

  // Reusable Guided Lab Instructional System State
  const [guidedStepIndex, setGuidedStepIndex] = useState<number>(0);
  const [isDiagramPinned, setIsDiagramPinned] = useState<boolean>(false);

  const ledPlanckProcedure: ExperimentProcedure = useMemo(
    () => ({
      experimentId: 'expt-3-led-planck',
      experimentNumber: 3,
      experimentTitle: "Planck's Constant via Semiconductor LEDs",
      sourcePages: 'pp. 38–44',
      rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
      configurations: ledPlanckConfigurations,
      steps: ledPlanckSteps,
    }),
    []
  );

  const currentGuidedStep = ledPlanckSteps[guidedStepIndex] || ledPlanckSteps[0];

  // Circuit Hardware State
  const [powerOn, setPowerOn] = useState<boolean>(true);
  const [selectedColor, setSelectedColor] = useState<'blue' | 'yellow' | 'green' | 'red'>('red');
  const [potentiometerRatio, setPotentiometerRatio] = useState<number>(0.65); // 0 to 1
  const [currentLimitingResistor, setCurrentLimitingResistor] = useState<number>(47); // 47 ohm default
  const [isReverseBiased, setIsReverseBiased] = useState<boolean>(false);
  const [showCalculationsDrawer, setShowCalculationsDrawer] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | undefined>(undefined);

  // Linear fitting range for active LED (Indices in Table 1)
  const [fitStartIndex, setFitStartIndex] = useState<number>(8); // near upper linear region
  const [fitEndIndex, setFitEndIndex] = useState<number>(14);

  // Extracted Barrier Potentials (VB) store for Table 2
  const [extractedVBs, setExtractedVBs] = useState<Record<'blue' | 'yellow' | 'green' | 'red', number>>({
    blue: 2.64,
    yellow: 2.48,
    green: 2.19,
    red: 1.88,
  });

  // Table 1 Data Store for all 4 LEDs (15 rows each)
  const [table1Data, setTable1Data] = useState<Record<'blue' | 'yellow' | 'green' | 'red', LedTableRow[]>>(() => ({
    blue: ledPlanckEngine.generateObservationTable1('blue'),
    yellow: ledPlanckEngine.generateObservationTable1('yellow'),
    green: ledPlanckEngine.generateObservationTable1('green'),
    red: ledPlanckEngine.generateObservationTable1('red'),
  }));

  // Selected Terminal for interactive wire connection
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);

  // Default properly connected wiring netlist
  const [wires, setWires] = useState<WireConnection[]>([
    { id: 'w1', fromTerminalId: 'ps_pos', toTerminalId: 'r_in', color: '#ef4444' },
    { id: 'w2', fromTerminalId: 'r_out', toTerminalId: 'pot_in', color: '#ef4444' },
    { id: 'w3', fromTerminalId: 'ps_neg', toTerminalId: 'pot_gnd', color: '#3b82f6' },
    { id: 'w4', fromTerminalId: 'pot_wiper', toTerminalId: 'amm_pos', color: '#f59e0b' },
    { id: 'w5', fromTerminalId: 'amm_neg', toTerminalId: 'led_anode', color: '#ef4444' },
    { id: 'w6', fromTerminalId: 'led_cathode', toTerminalId: 'pot_gnd', color: '#3b82f6' },
    { id: 'w7', fromTerminalId: 'led_anode', toTerminalId: 'vm_pos', color: '#ef4444' },
    { id: 'w8', fromTerminalId: 'led_cathode', toTerminalId: 'vm_neg', color: '#10b981' },
  ]);

  // Binding post terminals definition in SVG 780 x 360 space
  const terminals: Terminal[] = useMemo(
    () => [
      // 3V DC Power Supply
      { id: 'ps_pos', name: 'PS (+)', polarity: '+', color: '#ef4444', x: 75, y: 135, componentId: 'ps', componentName: '3V DC Power Supply' },
      { id: 'ps_neg', name: 'PS (-)', polarity: '-', color: '#3b82f6', x: 75, y: 195, componentId: 'ps', componentName: '3V DC Power Supply' },

      // Current Limiting Resistor (47 Ω)
      { id: 'r_in', name: 'R (In)', polarity: '+', color: '#ef4444', x: 190, y: 120, componentId: 'r_lim', componentName: 'Limiting Resistor' },
      { id: 'r_out', name: 'R (Out)', polarity: '-', color: '#ef4444', x: 250, y: 120, componentId: 'r_lim', componentName: 'Limiting Resistor' },

      // Potentiometer (0 - 100 kΩ)
      { id: 'pot_in', name: 'Pot (In)', polarity: '+', color: '#ef4444', x: 300, y: 120, componentId: 'pot', componentName: 'Potentiometer' },
      { id: 'pot_wiper', name: 'Wiper', polarity: '+', color: '#f59e0b', x: 340, y: 70, componentId: 'pot', componentName: 'Potentiometer' },
      { id: 'pot_gnd', name: 'Pot (GND)', polarity: '-', color: '#3b82f6', x: 380, y: 120, componentId: 'pot', componentName: 'Potentiometer' },

      // LED (Anode & Cathode)
      { id: 'led_anode', name: 'LED (+ Anode)', polarity: '+', color: '#ef4444', x: 500, y: 130, componentId: 'led', componentName: 'LED Junction' },
      { id: 'led_cathode', name: 'LED (- Cathode)', polarity: '-', color: '#3b82f6', x: 500, y: 200, componentId: 'led', componentName: 'LED Junction' },

      // Digital Voltmeter (Parallel)
      { id: 'vm_pos', name: 'V (+)', polarity: '+', color: '#ef4444', x: 620, y: 75, componentId: 'vm', componentName: 'Digital Voltmeter' },
      { id: 'vm_neg', name: 'V (-)', polarity: '-', color: '#10b981', x: 680, y: 75, componentId: 'vm', componentName: 'Digital Voltmeter' },

      // Digital Microammeter (Series)
      { id: 'amm_pos', name: 'A (+)', polarity: '+', color: '#ef4444', x: 620, y: 235, componentId: 'amm', componentName: 'Digital Microammeter' },
      { id: 'amm_neg', name: 'A (-)', polarity: '-', color: '#f59e0b', x: 680, y: 235, componentId: 'amm', componentName: 'Digital Microammeter' },
    ],
    []
  );

  // Netlist circuit analysis
  const circuitAnalysis = useMemo(() => {
    if (!powerOn) {
      return {
        status: 'OPEN_CIRCUIT_DISCONNECTED' as const,
        isOperating: false,
        hasReversedMeterPolarity: false,
        message: '3V DC Power Supply is switched OFF. Switch ON the power supply.',
        warnings: ['Power supply OFF.'],
      };
    }
    return analyzeLedCircuit(wires);
  }, [powerOn, wires]);

  // Physical simulation parameters
  const simParams = useMemo(
    () => ({
      ledColor: selectedColor,
      potentiometerRatio,
      supplyVoltage_V: 3.0,
      currentLimitingResistor_ohm: currentLimitingResistor,
      isReverseBiased: isReverseBiased || circuitAnalysis.status === 'REVERSED_LED_POLARITY',
    }),
    [selectedColor, potentiometerRatio, currentLimitingResistor, isReverseBiased, circuitAnalysis]
  );

  // Live readings from simulation engine
  const liveReadings = useMemo(() => {
    if (!circuitAnalysis.isOperating) {
      return {
        appliedVoltage_V: 0.0,
        diodeVoltage_V: 0.0,
        diodeCurrent_uA: 0.0,
        wavelength_nm: LED_SPECS[selectedColor].lambda_nm,
        oneOverLambda_per_nm: 1 / LED_SPECS[selectedColor].lambda_nm,
        barrierPotential_VB_V: LED_SPECS[selectedColor].theoreticalVB,
        isEmittingLight: false,
        lightIntensityPct: 0,
      };
    }
    return ledPlanckEngine.calculateReadings(simParams);
  }, [circuitAnalysis, simParams, selectedColor]);

  // Display meters with polarity checks
  const displayVoltage = useMemo(() => {
    const v = liveReadings.diodeVoltage_V;
    return circuitAnalysis.hasReversedMeterPolarity ? -v : v;
  }, [liveReadings.diodeVoltage_V, circuitAnalysis.hasReversedMeterPolarity]);

  const displayCurrent_uA = useMemo(() => {
    const i = liveReadings.diodeCurrent_uA;
    return circuitAnalysis.hasReversedMeterPolarity ? -i : i;
  }, [liveReadings.diodeCurrent_uA, circuitAnalysis.hasReversedMeterPolarity]);

  // Current LED Table 1 data points
  const activeLedRows = table1Data[selectedColor];

  // Selected points for linear regression on active LED
  const selectedFitPoints = useMemo(() => {
    const start = Math.min(fitStartIndex, fitEndIndex);
    const end = Math.max(fitStartIndex, fitEndIndex);
    return activeLedRows.slice(start, end + 1).map((r) => ({
      x: r.diodeVoltage_V,
      y: r.diodeCurrent_uA,
    }));
  }, [activeLedRows, fitStartIndex, fitEndIndex]);

  // Linear Tangent Fit Result
  const fitResult: LinearFitResult = useMemo(() => {
    return ledPlanckEngine.fitLinearTangent(selectedFitPoints);
  }, [selectedFitPoints]);

  // Update extracted VB if fit is sufficiently linear
  const handleApplyFittedVB = () => {
    if (fitResult.isSufficientlyLinear && fitResult.voltageIntercept_VB_V > 0) {
      setExtractedVBs((prev) => ({
        ...prev,
        [selectedColor]: fitResult.voltageIntercept_VB_V,
      }));
      setLastSaved(new Date().toLocaleTimeString());
    }
  };

  // Table 2 summary across all 4 LEDs
  const table2Summary = useMemo(() => {
    return ledPlanckEngine.generateTable2Summary(extractedVBs);
  }, [extractedVBs]);

  // Wire creation handling
  const handleTerminalClick = (term: Terminal) => {
    if (!selectedTerminal) {
      setSelectedTerminal(term);
    } else {
      if (selectedTerminal.id !== term.id) {
        const wireExists = wires.some(
          (w) =>
            (w.fromTerminalId === selectedTerminal.id && w.toTerminalId === term.id) ||
            (w.fromTerminalId === term.id && w.toTerminalId === selectedTerminal.id)
        );
        if (!wireExists) {
          const newWire: WireConnection = {
            id: `w_${Date.now()}`,
            fromTerminalId: selectedTerminal.id,
            toTerminalId: term.id,
            color: selectedTerminal.polarity === '-' ? '#3b82f6' : '#ef4444',
          };
          setWires((prev) => [...prev, newWire]);
        }
      }
      setSelectedTerminal(null);
    }
  };

  const handleAutoWire = () => {
    setWires([
      { id: 'w1', fromTerminalId: 'ps_pos', toTerminalId: 'r_in', color: '#ef4444' },
      { id: 'w2', fromTerminalId: 'r_out', toTerminalId: 'pot_in', color: '#ef4444' },
      { id: 'w3', fromTerminalId: 'ps_neg', toTerminalId: 'pot_gnd', color: '#3b82f6' },
      { id: 'w4', fromTerminalId: 'pot_wiper', toTerminalId: 'amm_pos', color: '#f59e0b' },
      { id: 'w5', fromTerminalId: 'amm_neg', toTerminalId: 'led_anode', color: '#ef4444' },
      { id: 'w6', fromTerminalId: 'led_cathode', toTerminalId: 'pot_gnd', color: '#3b82f6' },
      { id: 'w7', fromTerminalId: 'led_anode', toTerminalId: 'vm_pos', color: '#ef4444' },
      { id: 'w8', fromTerminalId: 'led_cathode', toTerminalId: 'vm_neg', color: '#10b981' },
    ]);
    setIsReverseBiased(false);
  };

  const handleReverseLed = () => {
    setIsReverseBiased((prev) => !prev);
    setWires((prev) =>
      prev.map((w) => {
        let from = w.fromTerminalId;
        let to = w.toTerminalId;
        if (from === 'led_anode') from = 'led_cathode';
        else if (from === 'led_cathode') from = 'led_anode';
        if (to === 'led_anode') to = 'led_cathode';
        else if (to === 'led_cathode') to = 'led_anode';
        return { ...w, fromTerminalId: from, toTerminalId: to };
      })
    );
  };

  const handleAutoMeasureAllLeds = () => {
    setTable1Data({
      blue: ledPlanckEngine.generateObservationTable1('blue'),
      yellow: ledPlanckEngine.generateObservationTable1('yellow'),
      green: ledPlanckEngine.generateObservationTable1('green'),
      red: ledPlanckEngine.generateObservationTable1('red'),
    });
    setExtractedVBs({
      blue: 2.64,
      yellow: 2.48,
      green: 2.19,
      red: 1.88,
    });
    setLastSaved(new Date().toLocaleTimeString());
  };

  // CSV Export for Table 1 & Table 2
  const handleExportCSV = () => {
    let csv = '=== TABLE 1: I-V OBSERVATIONS ===\n';
    csv += 'Sl_No,Blue_V,Blue_I_uA,Yellow_V,Yellow_I_uA,Green_V,Green_I_uA,Red_V,Red_I_uA\n';
    for (let i = 0; i < 15; i++) {
      const b = table1Data.blue[i];
      const y = table1Data.yellow[i];
      const g = table1Data.green[i];
      const r = table1Data.red[i];
      csv += `${i + 1},${b?.diodeVoltage_V ?? ''},${b?.diodeCurrent_uA ?? ''},${y?.diodeVoltage_V ?? ''},${y?.diodeCurrent_uA ?? ''},${g?.diodeVoltage_V ?? ''},${g?.diodeCurrent_uA ?? ''},${r?.diodeVoltage_V ?? ''},${r?.diodeCurrent_uA ?? ''}\n`;
    }
    csv += '\n=== TABLE 2: PLANCK CONSTANT DETERMINATION ===\n';
    csv += 'Colour,Wavelength_nm,1_over_lambda_nm_inv,Barrier_Potential_VB_V,Planck_Constant_h_J_s,Error_Pct\n';
    for (const row of table2Summary.rows) {
      csv += `${row.colorName},${row.wavelength_nm},${row.oneOverLambda_nm_inv},${row.barrierPotential_VB_V},${row.planckConstantDirect_J_s.toExponential(4)},${row.percentageError}%\n`;
    }
    csv += `Average_Direct_h,${table2Summary.averagePlanckConstant_J_s.toExponential(4)},,,,\n`;
    csv += `Graphical_h,${table2Summary.graphicalPlanckConstant_J_s.toExponential(4)},,,,\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Experiment3_Planck_Constant_LED_Observations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // I-V Graph Series with tangent extrapolation
  const ivGraphSeries: GraphSeries[] = useMemo(() => {
    const rawCurve = activeLedRows.map((r) => ({ x: r.diodeVoltage_V, y: r.diodeCurrent_uA }));
    const seriesList: GraphSeries[] = [
      {
        id: 'iv_curve',
        name: `${LED_SPECS[selectedColor].color} LED I-V Curve`,
        points: rawCurve,
        color: LED_SPECS[selectedColor].hex,
        unitY: 'μA',
      },
    ];

    // If tangent fit is valid, generate extrapolated tangent line
    if (fitResult.isSufficientlyLinear && fitResult.voltageIntercept_VB_V > 0) {
      const vb = fitResult.voltageIntercept_VB_V;
      const maxV = Math.max(...rawCurve.map((p) => p.x), vb + 0.3);
      const tangentPoints = [
        { x: vb, y: 0 },
        { x: maxV, y: fitResult.slope_mA_per_V * (maxV - vb) * 1000 },
      ];
      seriesList.push({
        id: 'tangent_line',
        name: `Linear Fit: VB = ${vb}V (R²=${fitResult.rSquared})`,
        points: tangentPoints,
        color: '#f59e0b',
        unitY: 'μA',
      });
    }

    return seriesList;
  }, [activeLedRows, selectedColor, fitResult]);

  // Planck Graph Series (VB vs 1/lambda)
  const planckGraphSeries: GraphSeries[] = useMemo(() => {
    // Points: X = 1/lambda (nm^-1), Y = VB (V)
    const points = table2Summary.rows.map((r) => ({
      x: r.oneOverLambda_nm_inv,
      y: r.barrierPotential_VB_V,
    }));

    // Linear fit passing through origin: y = m * x
    const slope = table2Summary.graphicalSlope_V_m * 1e-9; // V per nm^-1
    const fitLine = [
      { x: 0, y: 0 },
      { x: 0.0024, y: slope * 0.0024 },
    ];

    return [
      { id: 'data_pts', name: 'LED Barrier Potentials (VB)', points, color: '#ec4899', unitY: 'V' },
      { id: 'fit_line', name: `Linear Fit (Slope = hc/e)`, points: fitLine, color: '#6366f1', unitY: 'V' },
    ];
  }, [table2Summary]);

  return (
    <div className="space-y-4">
      {/* Top Laboratory Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
                EXPT 03 • BAPHY105
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                [SIMULATED DATA]
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              {metadata.title}
            </h1>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveMode('guided')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                activeMode === 'guided'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Guided
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('exam')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                activeMode === 'exam'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Exam
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenViva}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            Viva Voce
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Print Laboratory Worksheet"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Vector Setup Blueprint & Circuit Diagram Panel */}
      <SetupDiagramPanel
        configurations={ledPlanckConfigurations}
        activeConfigId="led_circuit"
        highlightedElementId={currentGuidedStep?.apparatusHighlightId}
        currentStepNumber={currentGuidedStep?.number}
        isPinned={isDiagramPinned}
        onTogglePin={setIsDiagramPinned}
      />

      {/* Guided Lab Instructional System (Beginner / Practice / Exam) */}
      <GuidedLabPanel
        procedure={ledPlanckProcedure}
        currentState={{
          wires,
          circuitAnalysis,
          powerOn,
          selectedColor,
          potentiometerRatio,
          currentLimitingResistor,
          isReverseBiased,
          table1Data,
          extractedVBs,
          barrierPotential: extractedVBs[selectedColor],
          hasFittedTangent: true,
          completedLedsCount: Object.values(extractedVBs).filter((v) => v > 0).length,
        }}
        initialMode={activeMode === 'exam' ? 'exam' : 'beginner'}
        onStepChange={(idx) => setGuidedStepIndex(idx)}
      />

      {/* Main Vector Circuit Workbench & Breadboard Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Breadboard SVG & Netlist Diagnostics (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Header & Quick Helpers */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                  Semiconductor Diode Circuit &amp; Breadboard Netlist
                </h2>
              </div>

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
                  onClick={handleReverseLed}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Flip LED Polarity
                </button>
                <button
                  type="button"
                  onClick={() => setWires([])}
                  className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-900"
                  title="Clear Wires"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <span className="text-slate-400">R_lim:</span>
                  {[10, 47, 100].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCurrentLimitingResistor(r)}
                      className={`px-1.5 py-0.5 rounded font-mono ${
                        currentLimitingResistor === r
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r}Ω
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPowerOn(!powerOn)}
                  className={`px-2.5 py-1 rounded-lg font-medium border ${
                    powerOn
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  3V Supply: {powerOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Diagnostic Alert Banner from Netlist Analyzer */}
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                circuitAnalysis.status === 'VALID_FORWARD_BIAS'
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                  : circuitAnalysis.status === 'REVERSED_LED_POLARITY'
                  ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                  : 'bg-rose-950/40 border-rose-800/70 text-rose-200'
              }`}
            >
              <div className="mt-0.5">
                {circuitAnalysis.status === 'VALID_FORWARD_BIAS' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {circuitAnalysis.status === 'REVERSED_LED_POLARITY' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
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

            {/* SVG Interactive Breadboard Canvas */}
            <div className="relative w-full aspect-[16/8] bg-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden shadow-inner">
              <svg viewBox="0 0 780 360" className="w-full h-full select-none">
                <defs>
                  <pattern id="breadGrid" width="15" height="15" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#334155" />
                  </pattern>
                  <radialGradient id="ledGlowGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={LED_SPECS[selectedColor].hex} stopOpacity="0.9" />
                    <stop offset="60%" stopColor={LED_SPECS[selectedColor].hex} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={LED_SPECS[selectedColor].hex} stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Breadboard Base */}
                <rect x="150" y="50" width="400" height="260" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <rect x="165" y="65" width="370" height="230" fill="url(#breadGrid)" opacity="0.6" />

                {/* 3V DC Power Supply Chassis (Left) */}
                <g transform="translate(40, 90)">
                  <rect x="0" y="0" width="70" height="150" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  <rect x="8" y="15" width="54" height="25" rx="4" fill="#020617" />
                  <text x="35" y="32" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {powerOn ? '3.00 V' : 'OFF'}
                  </text>
                  <text x="35" y="65" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    3V REGULATED
                  </text>
                </g>

                {/* 47 Ω Current Limiting Resistor */}
                <g transform="translate(190, 105)">
                  <rect x="0" y="5" width="60" height="20" rx="4" fill="#d97706" stroke="#92400e" strokeWidth="1.5" />
                  {/* Resistor color bands: Yellow (4), Violet (7), Black (0), Gold (5%) */}
                  <rect x="12" y="5" width="4" height="20" fill="#facc15" />
                  <rect x="22" y="5" width="4" height="20" fill="#7c3aed" />
                  <rect x="32" y="5" width="4" height="20" fill="#000000" />
                  <rect x="44" y="5" width="4" height="20" fill="#fbbf24" />
                  <text x="30" y="38" fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    R_lim = {currentLimitingResistor} Ω
                  </text>
                </g>

                {/* Potentiometer (Rotary Dial) */}
                <g transform="translate(300, 70)">
                  <rect x="-10" y="20" width="100" height="60" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="40" cy="50" r="22" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
                  {/* Wiper needle */}
                  <line
                    x1="40"
                    y1="50"
                    x2={40 + Math.cos(((potentiometerRatio * 270 - 135) * Math.PI) / 180) * 18}
                    y2={50 + Math.sin(((potentiometerRatio * 270 - 135) * Math.PI) / 180) * 18}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <text x="40" y="92" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    POT: {Math.round(potentiometerRatio * 100)}% ({liveReadings.appliedVoltage_V.toFixed(2)}V)
                  </text>
                </g>

                {/* LED Optical Assembly on Breadboard */}
                <g transform="translate(500, 165)">
                  {/* Glow circle when conducting */}
                  {liveReadings.isEmittingLight && (
                    <circle cx="0" cy="0" r={25 + liveReadings.lightIntensityPct * 0.15} fill="url(#ledGlowGrad)" />
                  )}
                  {/* LED Dome */}
                  <path
                    d="M -12,-16 C -12,-28 12,-28 12,-16 L 12,12 L -12,12 Z"
                    fill={LED_SPECS[selectedColor].hex}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    opacity={liveReadings.isEmittingLight ? 0.95 : 0.6}
                  />
                  {/* Collar ring */}
                  <rect x="-14" y="12" width="28" height="5" rx="1.5" fill="#334155" />
                  <text x="0" y="32" fill={LED_SPECS[selectedColor].hex} fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    {LED_SPECS[selectedColor].color} ({LED_SPECS[selectedColor].lambda_nm} nm)
                  </text>
                </g>

                {/* Digital Instruments Chassis (Right) */}
                <g transform="translate(600, 50)">
                  {/* Voltmeter Box */}
                  <rect x="0" y="0" width="100" height="70" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  <rect x="10" y="10" width="80" height="22" rx="4" fill="#020617" />
                  <text x="50" y="25" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {displayVoltage.toFixed(3)} V
                  </text>
                  <text x="50" y="42" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    PARALLEL VOLTMETER
                  </text>
                </g>

                <g transform="translate(600, 210)">
                  {/* Ammeter Box */}
                  <rect x="0" y="0" width="100" height="70" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  <rect x="10" y="10" width="80" height="22" rx="4" fill="#020617" />
                  <text x="50" y="25" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {displayCurrent_uA.toFixed(1)} μA
                  </text>
                  <text x="50" y="42" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    SERIES AMMETER
                  </text>
                </g>

                {/* Connecting Wires */}
                {wires.map((wire) => {
                  const from = terminals.find((t) => t.id === wire.fromTerminalId);
                  const to = terminals.find((t) => t.id === wire.toTerminalId);
                  if (!from || !to) return null;
                  return (
                    <DraggableWire
                      key={wire.id}
                      wire={wire}
                      fromTerminal={from}
                      toTerminal={to}
                      onRemove={(id) => setWires((prev) => prev.filter((w) => w.id !== id))}
                    />
                  );
                })}

                {/* Binding Post Terminals */}
                {terminals.map((term) => (
                  <TerminalPoint
                    key={term.id}
                    terminal={term}
                    isSelected={selectedTerminal?.id === term.id}
                    onClick={() => handleTerminalClick(term)}
                  />
                ))}
              </svg>
            </div>

            {/* Controls: Color Selector & Potentiometer Voltage Slider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Color LED Switcher */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-semibold text-slate-300">
                  Select Active LED (Manual Wavelengths):
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {LED_COLOR_KEYS.map((key) => {
                    const spec = LED_SPECS[key];
                    const isSelected = selectedColor === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedColor(key)}
                        className={`py-1.5 px-2 rounded-lg font-mono text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
                          isSelected
                            ? 'bg-slate-800 ring-2 shadow-lg'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                        }`}
                        style={{
                          borderColor: isSelected ? spec.hex : undefined,
                          color: isSelected ? spec.hex : undefined,
                        }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: spec.hex }} />
                        <span>{spec.color}</span>
                        <span className="text-[10px] text-slate-500 font-normal">{spec.lambda_nm} nm</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Potentiometer Dial Adjustment */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Potentiometer (Applied Voltage)
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {(potentiometerRatio * 3.0).toFixed(3)} V ({Math.round(potentiometerRatio * 100)}%)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.01"
                    value={potentiometerRatio}
                    onChange={(e) => setPotentiometerRatio(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500"
                    aria-label="Adjust potentiometer voltage"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPotentiometerRatio((r) => Math.max(0, parseFloat((r - 0.05).toFixed(2))))}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800"
                    >
                      -5%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPotentiometerRatio((r) => Math.max(0, parseFloat((r - 0.01).toFixed(2))))}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800"
                    >
                      -1%
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPotentiometerRatio((r) => Math.min(1, parseFloat((r + 0.01).toFixed(2))))}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800"
                    >
                      +1%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPotentiometerRatio((r) => Math.min(1, parseFloat((r + 0.05).toFixed(2))))}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800"
                    >
                      +5%
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Plot Section: I-V Extrapolation vs Planck Determination */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveGraphTab('iv')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeGraphTab === 'iv' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  I-V Curve &amp; Tangent Fit (VB)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGraphTab('planck')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeGraphTab === 'planck' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  VB vs 1/λ (Planck Slope)
                </button>
              </div>

              {activeGraphTab === 'iv' && fitResult.isSufficientlyLinear && (
                <button
                  type="button"
                  onClick={handleApplyFittedVB}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300"
                >
                  Apply VB ({fitResult.voltageIntercept_VB_V}V) to Table 2
                </button>
              )}
            </div>

            {activeGraphTab === 'iv' ? (
              <div className="space-y-3">
                <LabGraph
                  title={`${LED_SPECS[selectedColor].color} LED I-V Characteristics & Barrier Extrapolation`}
                  series={ivGraphSeries}
                  xLabel="Diode Voltage V"
                  xUnit="V"
                  yLabel="Current I (μA)"
                  highlightPoint={
                    fitResult.isSufficientlyLinear
                      ? {
                          x: fitResult.voltageIntercept_VB_V,
                          y: 0,
                          label: `VB = ${fitResult.voltageIntercept_VB_V} V`,
                          color: '#f59e0b',
                        }
                      : undefined
                  }
                />

                {/* Tangent Fit Range Selector & Linearity Feedback */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      Linear Fit Region Selector (Manual Precautions: I &gt; I_max/2):
                    </span>
                    <span className="font-mono text-slate-400">
                      Points [{fitStartIndex + 1} to {fitEndIndex + 1}] of 15
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400 text-[11px]">Start:</span>
                      <input
                        type="range"
                        min="0"
                        max="12"
                        value={fitStartIndex}
                        onChange={(e) => setFitStartIndex(parseInt(e.target.value))}
                        className="flex-1 accent-indigo-500"
                      />
                      <span className="text-slate-200">{activeLedRows[fitStartIndex]?.diodeVoltage_V}V</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400 text-[11px]">End:</span>
                      <input
                        type="range"
                        min="4"
                        max="14"
                        value={fitEndIndex}
                        onChange={(e) => setFitEndIndex(parseInt(e.target.value))}
                        className="flex-1 accent-indigo-500"
                      />
                      <span className="text-slate-200">{activeLedRows[fitEndIndex]?.diodeVoltage_V}V</span>
                    </div>
                  </div>

                  {/* Fit Diagnostics Banner */}
                  <div
                    className={`p-2.5 rounded-lg border font-mono text-[11px] ${
                      fitResult.isSufficientlyLinear
                        ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                        : 'bg-amber-950/20 border-amber-800/60 text-amber-300'
                    }`}
                  >
                    {fitResult.isSufficientlyLinear ? (
                      <div className="flex items-center justify-between">
                        <span>
                          Fitted Line: I = {fitResult.slope_mA_per_V} · (V - {fitResult.voltageIntercept_VB_V}) mA
                        </span>
                        <span>
                          R² = <strong className="text-emerald-200">{fitResult.rSquared}</strong> (Valid linear fit)
                        </span>
                      </div>
                    ) : (
                      <div>{fitResult.errorMessage}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <LabGraph
                  title="Barrier Potential VB vs Reciprocal Wavelength 1/λ (Slope = hc/e)"
                  series={planckGraphSeries}
                  xLabel="1/λ (nm⁻¹)"
                  xUnit="nm⁻¹"
                  yLabel="Barrier Potential VB (V)"
                />

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Fitted Slope ΔVB / Δ(1/λ):</span>
                    <span className="text-indigo-400 font-bold">{table2Summary.graphicalSlope_V_m} V·m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Graphical Planck's Constant (h_graph = Slope · e / c):</span>
                    <span className="text-emerald-400 font-bold">
                      {table2Summary.graphicalPlanckConstant_J_s.toExponential(4)} J·s
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Standard Reference h: 6.626×10⁻³⁴ J·s</span>
                    <span>Error: {table2Summary.percentageErrorGraphical}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Instrument Panels & Calculations Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Digital Instrument Reads */}
          <div className="grid grid-cols-2 gap-2">
            <Instrument
              type="voltmeter"
              title="Voltmeter"
              value={displayVoltage.toFixed(3)}
              unit="V"
              range="0–20V DC"
              subLabel="LED Voltage"
              subValue={`${liveReadings.diodeVoltage_V.toFixed(3)} V`}
            />

            <Instrument
              type="ammeter"
              title="Microammeter"
              value={displayCurrent_uA.toFixed(1)}
              unit="μA"
              range="0–2000μA"
              subLabel="Diode Current"
              subValue={`${liveReadings.diodeCurrent_uA.toFixed(1)} μA`}
            />

            <Instrument
              type="generic"
              title="Wavelength"
              value={LED_SPECS[selectedColor].lambda_nm.toString()}
              unit="nm"
              range="Visible"
              subLabel="1/λ"
              subValue={`${(1 / LED_SPECS[selectedColor].lambda_nm).toFixed(5)} nm⁻¹`}
            />

            <Instrument
              type="power"
              title="Barrier VB"
              value={extractedVBs[selectedColor].toFixed(2)}
              unit="V"
              range="Intercept"
              subLabel="Emitting"
              subValue={liveReadings.isEmittingLight ? 'YES (Lit)' : 'NO'}
            />
          </div>

          {/* Table 2 Summary Card: Planck Constant Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                Planck Constant Summary (Table 2)
              </h3>
              <button
                type="button"
                onClick={() => setShowCalculationsDrawer(!showCalculationsDrawer)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
              >
                {showCalculationsDrawer ? 'Hide Steps' : 'Show Steps'}
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400">Average Direct h (Equation 1):</div>
                <div className="text-base font-bold text-amber-300">
                  {table2Summary.averagePlanckConstant_J_s.toExponential(4)} J·s
                </div>
                <div className="text-[10px] text-slate-500">
                  Std: 6.626×10⁻³⁴ J·s • Error: {table2Summary.percentageErrorDirect}%
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400">Graphical h from Slope (Equation 3):</div>
                <div className="text-base font-bold text-emerald-400">
                  {table2Summary.graphicalPlanckConstant_J_s.toExponential(4)} J·s
                </div>
                <div className="text-[10px] text-slate-500">
                  Slope: {table2Summary.graphicalSlope_V_m} V·m • Error: {table2Summary.percentageErrorGraphical}%
                </div>
              </div>
            </div>

            {/* Step-by-Step Sample Calculations Drawer */}
            {showCalculationsDrawer && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2.5 animate-fadeIn">
                <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1">
                  1. Direct Planck Constant Formula (Manual p. 38):
                </div>
                <div className="font-mono text-[11px]">
                  h = e · VB · λ / c
                  <br />
                  For {LED_SPECS[selectedColor].color} LED:
                  <br />
                  e = 1.602×10⁻¹⁹ C, c = 2.998×10⁸ m/s
                  <br />
                  λ = {LED_SPECS[selectedColor].lambda_nm} nm = {LED_SPECS[selectedColor].lambda_m.toExponential(2)} m
                  <br />
                  VB = {extractedVBs[selectedColor]} V
                  <br />
                  h = ({extractedVBs[selectedColor]} · 1.602×10⁻¹⁹ · {LED_SPECS[selectedColor].lambda_m.toExponential(2)}) / 2.998×10⁸
                  <br />
                  h = <strong className="text-amber-300">{table2Summary.rows.find((r) => r.color === selectedColor)?.planckConstantDirect_J_s.toExponential(4)} J·s</strong>
                </div>

                <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1">
                  2. Graphical Slope Formula (Manual p. 41):
                </div>
                <div className="font-mono text-[11px]">
                  VB = (hc / e) · (1/λ)
                  <br />
                  Slope = ΔVB / Δ(1/λ) = hc / e
                  <br />
                  h_graph = Slope · (e / c) = <strong className="text-emerald-300">{table2Summary.graphicalPlanckConstant_J_s.toExponential(4)} J·s</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Observation Tables Section (Manual pp. 43-44) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        {/* Tab switcher for Table 1 vs Table 2 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTableTab('table1')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTableTab === 'table1' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table 1: I-V Data Collection (Manual p. 43)
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('table2')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTableTab === 'table2' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table 2: Planck's Constant from each LED (Manual p. 44)
            </button>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleAutoMeasureAllLeds}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
            >
              Auto-Measure All 4 LEDs
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table 1 Content */}
        {activeTableTab === 'table1' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200">
                Table 1. Data Collection for I-V Curve of the LEDs (Manual p. 43)
              </h4>
              {lastSaved && <span className="text-[11px] font-mono text-emerald-400">Last updated: {lastSaved}</span>}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono font-semibold">
                    <th className="p-2.5 w-16 text-center" rowSpan={2}>
                      Sl. No
                    </th>
                    <th className="p-2 text-center border-l border-slate-800 text-blue-400" colSpan={2}>
                      Blue LED (λB = 470 nm)
                    </th>
                    <th className="p-2 text-center border-l border-slate-800 text-yellow-400" colSpan={2}>
                      Yellow LED (λY = 500 nm)
                    </th>
                    <th className="p-2 text-center border-l border-slate-800 text-emerald-400" colSpan={2}>
                      Green LED (λG = 565 nm)
                    </th>
                    <th className="p-2 text-center border-l border-slate-800 text-rose-400" colSpan={2}>
                      Red LED (λR = 660 nm)
                    </th>
                  </tr>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-500 font-mono text-[10px]">
                    <th className="p-1.5 text-center border-l border-slate-800">Voltage (V)</th>
                    <th className="p-1.5 text-center">Current (μA)</th>
                    <th className="p-1.5 text-center border-l border-slate-800">Voltage (V)</th>
                    <th className="p-1.5 text-center">Current (μA)</th>
                    <th className="p-1.5 text-center border-l border-slate-800">Voltage (V)</th>
                    <th className="p-1.5 text-center">Current (μA)</th>
                    <th className="p-1.5 text-center border-l border-slate-800">Voltage (V)</th>
                    <th className="p-1.5 text-center">Current (μA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {Array.from({ length: 15 }).map((_, idx) => {
                    const b = table1Data.blue[idx];
                    const y = table1Data.yellow[idx];
                    const g = table1Data.green[idx];
                    const r = table1Data.red[idx];

                    return (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                        {/* Blue */}
                        <td className="p-2 text-center border-l border-slate-800 text-slate-300">
                          {b?.diodeVoltage_V.toFixed(3) ?? '-'}
                        </td>
                        <td className="p-2 text-center text-blue-300 font-bold">
                          {b?.diodeCurrent_uA.toFixed(1) ?? '-'}
                        </td>
                        {/* Yellow */}
                        <td className="p-2 text-center border-l border-slate-800 text-slate-300">
                          {y?.diodeVoltage_V.toFixed(3) ?? '-'}
                        </td>
                        <td className="p-2 text-center text-yellow-300 font-bold">
                          {y?.diodeCurrent_uA.toFixed(1) ?? '-'}
                        </td>
                        {/* Green */}
                        <td className="p-2 text-center border-l border-slate-800 text-slate-300">
                          {g?.diodeVoltage_V.toFixed(3) ?? '-'}
                        </td>
                        <td className="p-2 text-center text-emerald-300 font-bold">
                          {g?.diodeCurrent_uA.toFixed(1) ?? '-'}
                        </td>
                        {/* Red */}
                        <td className="p-2 text-center border-l border-slate-800 text-slate-300">
                          {r?.diodeVoltage_V.toFixed(3) ?? '-'}
                        </td>
                        <td className="p-2 text-center text-rose-300 font-bold">
                          {r?.diodeCurrent_uA.toFixed(1) ?? '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table 2 Content */}
        {activeTableTab === 'table2' && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200">
              Table 2. Planck's Constant from each LED (Manual p. 44)
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="p-2.5 w-16 text-center">Sl. No</th>
                    <th className="p-2.5">LED Colour</th>
                    <th className="p-2.5 text-center">Wavelength λ (nm)</th>
                    <th className="p-2.5 text-center">1/λ (nm⁻¹)</th>
                    <th className="p-2.5 text-center text-amber-300">Barrier Potential VB (V)</th>
                    <th className="p-2.5 text-center text-emerald-400">
                      Planck's Constant h = VB(eλ/c) [J·s]
                    </th>
                    <th className="p-2.5 text-center">Error (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {table2Summary.rows.map((row) => (
                    <tr key={row.color} className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-center text-slate-500">{row.slNo}</td>
                      <td className="p-2.5 font-bold" style={{ color: LED_SPECS[row.color].hex }}>
                        {row.colorName}
                      </td>
                      <td className="p-2.5 text-center text-slate-300">{row.wavelength_nm} nm</td>
                      <td className="p-2.5 text-center text-slate-400">{row.oneOverLambda_nm_inv}</td>
                      <td className="p-2.5 text-center font-bold text-amber-300">
                        {row.barrierPotential_VB_V.toFixed(2)} V
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-400">
                        {row.planckConstantDirect_J_s.toExponential(4)} J·s
                      </td>
                      <td className="p-2.5 text-center text-slate-300">{row.percentageError}%</td>
                    </tr>
                  ))}
                  {/* Summary Rows */}
                  <tr className="bg-slate-950/80 font-bold border-t-2 border-slate-800">
                    <td colSpan={5} className="p-2.5 text-right text-slate-300">
                      Average Direct Planck's Constant (h̄):
                    </td>
                    <td className="p-2.5 text-center text-amber-300">
                      {table2Summary.averagePlanckConstant_J_s.toExponential(4)} J·s
                    </td>
                    <td className="p-2.5 text-center text-slate-300">
                      {table2Summary.percentageErrorDirect}%
                    </td>
                  </tr>
                  <tr className="bg-slate-950/80 font-bold">
                    <td colSpan={5} className="p-2.5 text-right text-slate-300">
                      Graphical Planck's Constant (from VB vs 1/λ slope):
                    </td>
                    <td className="p-2.5 text-center text-emerald-400">
                      {table2Summary.graphicalPlanckConstant_J_s.toExponential(4)} J·s
                    </td>
                    <td className="p-2.5 text-center text-slate-300">
                      {table2Summary.percentageErrorGraphical}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Results Callout */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <span className="font-bold text-emerald-400">Results (Manual p. 44):</span>
              <div>• Planck's constant from direct formula = <strong className="text-amber-300">{table2Summary.averagePlanckConstant_J_s.toExponential(4)} J·s</strong></div>
              <div>• Planck's constant from VB - 1/λ graph = <strong className="text-emerald-300">{table2Summary.graphicalPlanckConstant_J_s.toExponential(4)} J·s</strong></div>
              <div>• Accepted standard h = 6.626×10⁻³⁴ J·s</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
