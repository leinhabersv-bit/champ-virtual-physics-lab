import React, { useState, useMemo } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import {
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
  generateQiskitScript,
  QUANTUM_AMBIGUITIES,
} from '../../engine/quantumGatesSimulator';
import {
  ArrowLeft,
  Compass,
  Award,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  Play,
  FileCode,
  Table as TableIcon,
  Download,
  Share2,
  CheckCircle,
  Copy,
  Info,
  Maximize2,
  Activity,
} from 'lucide-react';

interface QuantumWorkbenchProps {
  metadata: ExperimentMetadata;
  onBackToDashboard: () => void;
  onOpenViva: () => void;
}

type TabMode = 'single_qubit' | 'two_qubit' | 'tables' | 'python_qiskit';
type CircuitStepGate = 'NONE' | 'H' | 'X' | 'Y' | 'Z' | 'CNOT_01' | 'CNOT_10' | 'SWAP';

export const QuantumWorkbench: React.FC<QuantumWorkbenchProps> = ({
  metadata,
  onBackToDashboard,
  onOpenViva,
}) => {
  // Navigation & Mode State
  const [activeTab, setActiveTab] = useState<TabMode>('two_qubit');
  const [mode, setMode] = useState<'guided' | 'exam'>('guided');
  const [guidedStep, setGuidedStep] = useState<number>(1);
  const [showAmbiguitiesModal, setShowAmbiguitiesModal] = useState<boolean>(false);
  const [showTheoryModal, setShowTheoryModal] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);
  const [activeTableTab, setActiveTableTab] = useState<1 | 2 | 3 | 4 | 5>(5);

  // Basis convention toggle
  const [basisConvention, setBasisConvention] = useState<'TEXTBOOK' | 'QISKIT'>('TEXTBOOK');

  // Single Qubit State
  const [theta, setTheta] = useState<number>(Math.PI / 2);
  const [phi, setPhi] = useState<number>(0);
  const [singleGateHistory, setSingleGateHistory] = useState<string[]>([]);

  // Two Qubit Circuit State
  const [twoQubitPreset, setTwoQubitPreset] = useState<string>('|00>');
  const [circuitSlots, setCircuitSlots] = useState<CircuitStepGate[]>([
    'NONE',
    'NONE',
    'NONE',
    'NONE',
  ]);
  const [measurementShots, setMeasurementShots] = useState<Record<string, number> | null>(null);

  // Single Qubit Computation
  const singleQubit = useMemo(() => {
    return computeSingleQubitState(theta, phi);
  }, [theta, phi]);

  // Two Qubit Execution
  const twoQubitDetails = useMemo(() => {
    let currentVec = parseTwoQubitPreset(twoQubitPreset);

    // Apply circuit gates sequentially
    for (const gate of circuitSlots) {
      if (gate === 'CNOT_01') {
        currentVec = applyMatrix4x4(TWO_QUBIT_GATES.CNOT_01, currentVec);
      } else if (gate === 'CNOT_10') {
        currentVec = applyMatrix4x4(TWO_QUBIT_GATES.CNOT_10, currentVec);
      } else if (gate === 'SWAP') {
        currentVec = applyMatrix4x4(TWO_QUBIT_GATES.SWAP, currentVec);
      } else if (gate === 'H') {
        // H on qubit 0
        const H_I = [
          [{ re: 1 / Math.SQRT2, im: 0 }, { re: 0, im: 0 }, { re: 1 / Math.SQRT2, im: 0 }, { re: 0, im: 0 }],
          [{ re: 0, im: 0 }, { re: 1 / Math.SQRT2, im: 0 }, { re: 0, im: 0 }, { re: 1 / Math.SQRT2, im: 0 }],
          [{ re: 1 / Math.SQRT2, im: 0 }, { re: 0, im: 0 }, { re: -1 / Math.SQRT2, im: 0 }, { re: 0, im: 0 }],
          [{ re: 0, im: 0 }, { re: 1 / Math.SQRT2, im: 0 }, { re: 0, im: 0 }, { re: -1 / Math.SQRT2, im: 0 }],
        ];
        currentVec = applyMatrix4x4(H_I, currentVec);
      } else if (gate === 'X') {
        // X on qubit 0
        const X_I = [
          [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }],
          [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }],
          [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
          [{ re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
        ];
        currentVec = applyMatrix4x4(X_I, currentVec);
      } else if (gate === 'Z') {
        // Z on qubit 0
        const Z_I = [
          [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
          [{ re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
          [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: -1, im: 0 }, { re: 0, im: 0 }],
          [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: -1, im: 0 }],
        ];
        currentVec = applyMatrix4x4(Z_I, currentVec);
      }
    }

    return analyzeTwoQubitState(currentVec);
  }, [twoQubitPreset, circuitSlots]);

  // Tables
  const table1 = useMemo(() => generateManualTable1(), []);
  const table2 = useMemo(() => generateManualTable2(), []);
  const table3 = useMemo(() => generateManualTable3(), []);
  const table4 = useMemo(() => generateManualTable4(), []);
  const table5 = useMemo(() => generateManualTable5(), []);
  const qiskitScript = useMemo(() => generateQiskitScript(), []);

  // Handlers for single qubit gates
  const handleApplySingleGate = (gate: 'X' | 'Y' | 'Z' | 'H') => {
    const updated = computeSingleQubitState(theta, phi, gate);
    setTheta(updated.theta_rad);
    setPhi(updated.phi_rad);
    setSingleGateHistory((prev) => [...prev.slice(-4), gate]);
  };

  // Run measurement shots
  const handleMeasureShots = () => {
    const probs = [
      twoQubitDetails.prob00,
      twoQubitDetails.prob01,
      twoQubitDetails.prob10,
      twoQubitDetails.prob11,
    ];
    const totalShots = 1024;
    const counts: Record<string, number> = {
      '00': 0,
      '01': 0,
      '10': 0,
      '11': 0,
    };

    const cdf = [
      probs[0],
      probs[0] + probs[1],
      probs[0] + probs[1] + probs[2],
      1.0,
    ];

    for (let i = 0; i < totalShots; i++) {
      const r = Math.random();
      if (r < cdf[0]) counts['00']++;
      else if (r < cdf[1]) counts['01']++;
      else if (r < cdf[2]) counts['10']++;
      else counts['11']++;
    }

    setMeasurementShots(counts);
  };

  // Copy code helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(qiskitScript);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Export CSV
  const handleExportCSV = (tableNumber: number) => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (tableNumber === 5) {
      headers = ['S.No', 'Input State', 'CNOT Output', 'SWAP Output', 'Entangled?', 'Notes'];
      rows = table5.map((r) => [r.sno, r.inputState, r.cnotOutput, r.swapOutput, r.isCnotEntangled ? 'YES' : 'NO', r.notes]);
    } else if (tableNumber === 4) {
      headers = ['S.No', 'Two-Qubit State', 'theta1', 'phi1', 'theta2', 'phi2', 'Type'];
      rows = table4.map((r) => [r.sno, r.stateStr, r.theta1, r.phi1, r.theta2, r.phi2, r.type]);
    } else {
      headers = ['S.No', 'Theta (rad)', 'Phi (rad)', 'State Ket', 'Norm', 'Remarks'];
      rows = table1.map((r) => [r.sno, r.theta_str, r.phi_str, r.stateKet, r.norm, r.remarks]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((x) => `"${x}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expt9_quantum_table_${tableNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-md no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Return to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Cycle 2 • Quantum Computing
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Qiskit 1.x &amp; Deterministic Engine
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Experiment {metadata.number}: {metadata.shortTitle}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Guided / Exam Toggle */}
          <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700">
            <button
              onClick={() => setMode('guided')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === 'guided'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Guided Mode
            </button>
            <button
              onClick={() => setMode('exam')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === 'exam'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Exam Mode
            </button>
          </div>

          <button
            onClick={onOpenViva}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all flex items-center gap-1.5"
            title="Open Viva Voce Questions"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Viva Voce
          </button>

          <button
            onClick={() => setShowAmbiguitiesModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Source Ambiguities (AMB-08/09)
          </button>

          <button
            onClick={() => setShowTheoryModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Theory &amp; Questions
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-2 no-print">
        <button
          onClick={() => setActiveTab('two_qubit')}
          className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold flex items-center gap-2 border-t border-x transition-all ${
            activeTab === 'two_qubit'
              ? 'bg-slate-900 border-slate-700 text-cyan-400 shadow-md'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Share2 className="w-4 h-4 text-cyan-400" />
          Two-Qubit Circuit &amp; Entanglement
        </button>

        <button
          onClick={() => setActiveTab('single_qubit')}
          className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold flex items-center gap-2 border-t border-x transition-all ${
            activeTab === 'single_qubit'
              ? 'bg-slate-900 border-slate-700 text-cyan-400 shadow-md'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Maximize2 className="w-4 h-4 text-indigo-400" />
          Single Qubit &amp; Bloch Sphere
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold flex items-center gap-2 border-t border-x transition-all ${
            activeTab === 'tables'
              ? 'bg-slate-900 border-slate-700 text-cyan-400 shadow-md'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <TableIcon className="w-4 h-4 text-emerald-400" />
          Observation Tables (1–5)
        </button>

        <button
          onClick={() => setActiveTab('python_qiskit')}
          className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold flex items-center gap-2 border-t border-x transition-all ${
            activeTab === 'python_qiskit'
              ? 'bg-slate-900 border-slate-700 text-cyan-400 shadow-md'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <FileCode className="w-4 h-4 text-amber-400" />
          Qiskit Python Simulation
        </button>
      </div>

      {/* Guided Steps Stepper Banner */}
      {mode === 'guided' && (
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center text-sm">
              {guidedStep}
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
                Guided Step {guidedStep} of 5
              </div>
              <div className="text-sm text-slate-200 font-medium">
                {guidedStep === 1 && 'Visualize Single Qubits on the Bloch Sphere: Adjust θ and ϕ angles.'}
                {guidedStep === 2 && 'Apply Pauli-X, Y, Z, and Hadamard Gates on pure states.'}
                {guidedStep === 3 && 'Prepare Two-Qubit States: Test basis states |00⟩, |01⟩, |10⟩, |11⟩.'}
                {guidedStep === 4 && 'Simulate CNOT & SWAP Gates: Observe target bit flips and wire exchanges.'}
                {guidedStep === 5 && 'Create Entangled Bell State: Apply H on q₀ then CNOT(0→1) on |00⟩.'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {guidedStep > 1 && (
              <button
                onClick={() => setGuidedStep((p) => p - 1)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                Previous Step
              </button>
            )}
            {guidedStep < 5 ? (
              <button
                onClick={() => setGuidedStep((p) => p + 1)}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-lg transition-colors"
              >
                Next Step
              </button>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> All Steps Covered!
              </span>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: TWO-QUBIT CIRCUIT & ENTANGLEMENT */}
      {activeTab === 'two_qubit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Circuit & Controls (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Interactive Circuit Canvas */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  Interactive Two-Qubit Circuit
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Ordering:</span>
                  <button
                    onClick={() => setBasisConvention(basisConvention === 'TEXTBOOK' ? 'QISKIT' : 'TEXTBOOK')}
                    className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono hover:bg-slate-700"
                    title="Toggle basis ket ordering between Textbook |q0 q1⟩ and Qiskit |q1 q0⟩"
                  >
                    {basisConvention === 'TEXTBOOK' ? 'Textbook |q₀ q₁⟩' : 'Qiskit |q₁ q₀⟩'}
                  </button>
                </div>
              </div>

              {/* State Preparation Row */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <span className="text-xs text-slate-400 font-semibold">Input State |Ψ₀⟩:</span>
                {[
                  '|00>',
                  '|01>',
                  '|10>',
                  '|11>',
                  '|+⟩ ⊗ |0⟩',
                  '1/2 (|00⟩+|01⟩+|10⟩+|11⟩)',
                  'Phi+',
                  'Psi+',
                ].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setTwoQubitPreset(st);
                      setMeasurementShots(null);
                    }}
                    className={`text-xs px-2.5 py-1 rounded font-mono transition-all ${
                      twoQubitPreset === st
                        ? 'bg-cyan-600 text-white font-bold shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Quantum Circuit Wires SVG */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 relative">
                <svg viewBox="0 0 540 180" className="w-full h-auto">
                  {/* Background Grid Lines */}
                  <line x1="60" y1="50" x2="500" y2="50" stroke="#334155" strokeWidth="2" />
                  <line x1="60" y1="130" x2="500" y2="130" stroke="#334155" strokeWidth="2" />

                  {/* Wire Labels */}
                  <text x="20" y="55" fill="#38bdf8" fontSize="14" fontFamily="monospace" fontWeight="bold">
                    q₀:
                  </text>
                  <text x="20" y="135" fill="#38bdf8" fontSize="14" fontFamily="monospace" fontWeight="bold">
                    q₁:
                  </text>

                  {/* Slot Step Dividers */}
                  {[120, 220, 320, 420].map((x, idx) => (
                    <g key={x}>
                      <line x1={x} y1="20" x2={x} y2="160" stroke="#1e293b" strokeDasharray="3 3" />
                      <text x={x} y="15" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                        Step {idx + 1}
                      </text>
                    </g>
                  ))}

                  {/* Render Circuit Gates */}
                  {circuitSlots.map((gate, idx) => {
                    const cx = 120 + idx * 100;
                    if (gate === 'NONE') {
                      return (
                        <circle
                          key={idx}
                          cx={cx}
                          cy="90"
                          r="6"
                          fill="#1e293b"
                          stroke="#475569"
                          strokeDasharray="2 2"
                        />
                      );
                    }
                    if (gate === 'CNOT_01') {
                      return (
                        <g key={idx}>
                          <line x1={cx} y1="50" x2={cx} y2="130" stroke="#38bdf8" strokeWidth="3" />
                          <circle cx={cx} cy="50" r="7" fill="#38bdf8" />
                          <circle cx={cx} cy="130" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
                          <line x1={cx - 10} y1="130" x2={cx + 10} y2="130" stroke="#38bdf8" strokeWidth="2" />
                          <line x1={cx} y1="120" x2={cx} y2="140" stroke="#38bdf8" strokeWidth="2" />
                        </g>
                      );
                    }
                    if (gate === 'CNOT_10') {
                      return (
                        <g key={idx}>
                          <line x1={cx} y1="50" x2={cx} y2="130" stroke="#f43f5e" strokeWidth="3" />
                          <circle cx={cx} cy="130" r="7" fill="#f43f5e" />
                          <circle cx={cx} cy="50" r="14" fill="#0f172a" stroke="#f43f5e" strokeWidth="3" />
                          <line x1={cx - 10} y1="50" x2={cx + 10} y2="50" stroke="#f43f5e" strokeWidth="2" />
                          <line x1={cx} y1="40" x2={cx} y2="60" stroke="#f43f5e" strokeWidth="2" />
                        </g>
                      );
                    }
                    if (gate === 'SWAP') {
                      return (
                        <g key={idx}>
                          <line x1={cx} y1="50" x2={cx} y2="130" stroke="#10b981" strokeWidth="3" />
                          {/* Cross on q0 */}
                          <line x1={cx - 6} y1="44" x2={cx + 6} y2="56" stroke="#10b981" strokeWidth="3" />
                          <line x1={cx + 6} y1="44" x2={cx - 6} y2="56" stroke="#10b981" strokeWidth="3" />
                          {/* Cross on q1 */}
                          <line x1={cx - 6} y1="124" x2={cx + 6} y2="136" stroke="#10b981" strokeWidth="3" />
                          <line x1={cx + 6} y1="124" x2={cx - 6} y2="136" stroke="#10b981" strokeWidth="3" />
                        </g>
                      );
                    }
                    // Single qubit gates on q0
                    return (
                      <g key={idx}>
                        <rect
                          x={cx - 18}
                          y="32"
                          width="36"
                          height="36"
                          rx="4"
                          fill="#1e1b4b"
                          stroke="#6366f1"
                          strokeWidth="2"
                        />
                        <text
                          x={cx}
                          y="56"
                          fill="#e0e7ff"
                          fontSize="16"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {gate}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Gate Selector Slot Bar */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                  {circuitSlots.map((gate, slotIdx) => (
                    <div key={slotIdx} className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 font-mono text-center">Slot {slotIdx + 1}</span>
                      <select
                        value={gate}
                        onChange={(e) => {
                          const val = e.target.value as CircuitStepGate;
                          setCircuitSlots((prev) => {
                            const next = [...prev];
                            next[slotIdx] = val;
                            return next;
                          });
                          setMeasurementShots(null);
                        }}
                        className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded px-2 py-1 font-mono hover:bg-slate-750"
                      >
                        <option value="NONE">- Empty -</option>
                        <option value="H">H (q₀)</option>
                        <option value="X">X (q₀)</option>
                        <option value="Z">Z (q₀)</option>
                        <option value="CNOT_01">CNOT (0→1)</option>
                        <option value="CNOT_10">CNOT (1→0)</option>
                        <option value="SWAP">SWAP</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Circuit Recipes */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-xs text-slate-400 font-semibold">Quick Circuits:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setTwoQubitPreset('|00>');
                      setCircuitSlots(['H', 'CNOT_01', 'NONE', 'NONE']);
                      setMeasurementShots(null);
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30"
                  >
                    Bell State |Φ+⟩ (H + CNOT)
                  </button>
                  <button
                    onClick={() => {
                      setTwoQubitPreset('|01>');
                      setCircuitSlots(['SWAP', 'NONE', 'NONE', 'NONE']);
                      setMeasurementShots(null);
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30"
                  >
                    SWAP Demo (|01⟩→|10⟩)
                  </button>
                  <button
                    onClick={() => {
                      setTwoQubitPreset('|10>');
                      setCircuitSlots(['CNOT_10', 'NONE', 'NONE', 'NONE']);
                      setMeasurementShots(null);
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30"
                  >
                    CNOT Reversed (1→0)
                  </button>
                  <button
                    onClick={() => {
                      setCircuitSlots(['NONE', 'NONE', 'NONE', 'NONE']);
                      setMeasurementShots(null);
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Measurement Shots Simulator Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Measurement Simulation (1024 Shots)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Simulates projective quantum measurement in the computational Z-basis.
                  </p>
                </div>
                <button
                  onClick={handleMeasureShots}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5" /> Run 1024 Shots
                </button>
              </div>

              {/* Histogram Visualization */}
              <div className="grid grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                {[
                  { key: '00', label: '|00⟩', prob: twoQubitDetails.prob00 },
                  { key: '01', label: '|01⟩', prob: twoQubitDetails.prob01 },
                  { key: '10', label: '|10⟩', prob: twoQubitDetails.prob10 },
                  { key: '11', label: '|11⟩', prob: twoQubitDetails.prob11 },
                ].map(({ key, label, prob }) => {
                  const count = measurementShots ? measurementShots[key] : null;
                  const countPct = count !== null ? (count / 1024) * 100 : prob * 100;

                  return (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <div className="w-full bg-slate-800/80 rounded-t h-28 flex items-end justify-center p-1 relative">
                        <div
                          className="w-full bg-gradient-to-t from-cyan-600 to-indigo-500 rounded-t transition-all duration-500"
                          style={{ height: `${Math.max(4, countPct)}%` }}
                        />
                        <span className="absolute top-1 text-[10px] font-mono text-cyan-200">
                          {count !== null ? count : `${(prob * 100).toFixed(0)}%`}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">{label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        P = {prob.toFixed(3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Quantum State Vector & Entanglement Analysis (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Live State Vector Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Output State Vector |Ψ⟩</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    twoQubitDetails.isEntangled
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {twoQubitDetails.isEntangled ? 'ENTANGLED STATE' : 'PRODUCT (SEPARABLE)'}
                </span>
              </h3>

              {/* State Ket String Display */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2 font-mono">
                <span className="text-xs text-slate-400">Dirac Notation:</span>
                <div className="text-sm md:text-base font-bold text-cyan-300 break-words">
                  |Ψ⟩ = {basisConvention === 'TEXTBOOK' ? twoQubitDetails.ketTextbook : twoQubitDetails.ketQiskit}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>Norm ⟨Ψ|Ψ⟩ = {twoQubitDetails.norm.toFixed(4)}</span>
                  <span>Concurrence C = {twoQubitDetails.concurrence.toFixed(4)}</span>
                </div>
              </div>

              {/* 4D Complex Amplitudes Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400">c₀₀ (|00⟩)</div>
                  <div className="text-cyan-400 font-bold">
                    {twoQubitDetails.c00.re.toFixed(3)} + {twoQubitDetails.c00.im.toFixed(3)}i
                  </div>
                  <div className="text-[10px] text-slate-500">P = {twoQubitDetails.prob00.toFixed(3)}</div>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400">c₀₁ (|01⟩)</div>
                  <div className="text-cyan-400 font-bold">
                    {twoQubitDetails.c01.re.toFixed(3)} + {twoQubitDetails.c01.im.toFixed(3)}i
                  </div>
                  <div className="text-[10px] text-slate-500">P = {twoQubitDetails.prob01.toFixed(3)}</div>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400">c₁₀ (|10⟩)</div>
                  <div className="text-cyan-400 font-bold">
                    {twoQubitDetails.c10.re.toFixed(3)} + {twoQubitDetails.c10.im.toFixed(3)}i
                  </div>
                  <div className="text-[10px] text-slate-500">P = {twoQubitDetails.prob10.toFixed(3)}</div>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400">c₁₁ (|11⟩)</div>
                  <div className="text-cyan-400 font-bold">
                    {twoQubitDetails.c11.re.toFixed(3)} + {twoQubitDetails.c11.im.toFixed(3)}i
                  </div>
                  <div className="text-[10px] text-slate-500">P = {twoQubitDetails.prob11.toFixed(3)}</div>
                </div>
              </div>
            </div>

            {/* Reduced Single-Qubit Bloch Parameters Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Reduced Density Matrix &amp; Purity</span>
                <span className="text-xs text-slate-400 font-mono">Partial Trace</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Qubit 0 (Wire 0) */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1 text-xs font-mono">
                  <span className="font-bold text-indigo-400">Qubit 0 (q₀):</span>
                  <div className="text-slate-300">
                    Purity Tr(ρ₀²):{' '}
                    <span
                      className={`font-bold ${
                        twoQubitDetails.blochQubit1.purity === 1
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {twoQubitDetails.blochQubit1.purity}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Bloch (x,y,z): ({twoQubitDetails.blochQubit1.x}, {twoQubitDetails.blochQubit1.y},{' '}
                    {twoQubitDetails.blochQubit1.z})
                  </div>
                  {twoQubitDetails.blochQubit1.theta !== undefined ? (
                    <div className="text-cyan-300 text-[11px]">
                      θ₁ = {twoQubitDetails.blochQubit1.theta} rad, ϕ₁ = {twoQubitDetails.blochQubit1.phi} rad
                    </div>
                  ) : (
                    <div className="text-rose-400 text-[11px]">No single-qubit pure state (Entangled)</div>
                  )}
                </div>

                {/* Qubit 1 (Wire 1) */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1 text-xs font-mono">
                  <span className="font-bold text-indigo-400">Qubit 1 (q₁):</span>
                  <div className="text-slate-300">
                    Purity Tr(ρ₁²):{' '}
                    <span
                      className={`font-bold ${
                        twoQubitDetails.blochQubit2.purity === 1
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {twoQubitDetails.blochQubit2.purity}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Bloch (x,y,z): ({twoQubitDetails.blochQubit2.x}, {twoQubitDetails.blochQubit2.y},{' '}
                    {twoQubitDetails.blochQubit2.z})
                  </div>
                  {twoQubitDetails.blochQubit2.theta !== undefined ? (
                    <div className="text-cyan-300 text-[11px]">
                      θ₂ = {twoQubitDetails.blochQubit2.theta} rad, ϕ₂ = {twoQubitDetails.blochQubit2.phi} rad
                    </div>
                  ) : (
                    <div className="text-rose-400 text-[11px]">No single-qubit pure state (Entangled)</div>
                  )}
                </div>
              </div>

              {/* Educational Entanglement Note */}
              <div className="bg-cyan-950/30 border border-cyan-800/40 rounded p-3 text-xs text-cyan-200/90 leading-relaxed">
                <strong>Physics Insight:</strong> When concurrence <span className="font-mono">C = 1</span>, the
                qubits are maximally entangled (e.g. Bell state). Neither qubit possesses an independent pure state
                vector, causing their individual Bloch vectors to collapse to the center of the sphere{' '}
                <span className="font-mono">(0, 0, 0)</span> with purity{' '}
                <span className="font-mono">Tr(ρ²) = 0.5</span>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SINGLE QUBIT & BLOCH SPHERE */}
      {activeTab === 'single_qubit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Bloch Sphere Visualization (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                Bloch Sphere Vector Visualizer
              </h2>
              <span className="text-xs font-mono text-cyan-300">
                |ψ⟩ = cos(θ/2)|0⟩ + e^(iϕ)sin(θ/2)|1⟩
              </span>
            </div>

            {/* SVG 3D-projected Bloch Sphere */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-center">
              <svg viewBox="0 0 320 320" className="w-72 h-72">
                {/* Outer Unit Sphere Wireframe */}
                <circle cx="160" cy="160" r="110" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                {/* Equator Ellipse */}
                <ellipse cx="160" cy="160" rx="110" ry="32" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
                {/* Prime Meridian Ellipse */}
                <ellipse cx="160" cy="160" rx="32" ry="110" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />

                {/* Coordinate Axes */}
                {/* Z Axis (Vertical) */}
                <line x1="160" y1="20" x2="160" y2="300" stroke="#64748b" strokeWidth="1.5" />
                <text x="165" y="25" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace">
                  +z |0⟩
                </text>
                <text x="165" y="305" fill="#94a3b8" fontSize="12" fontFamily="monospace">
                  -z |1⟩
                </text>

                {/* X Axis (Diagonal forward) */}
                <line x1="85" y1="210" x2="235" y2="110" stroke="#64748b" strokeWidth="1.5" />
                <text x="70" y="225" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  +x |+⟩
                </text>
                <text x="240" y="105" fill="#94a3b8" fontSize="12" fontFamily="monospace">
                  -x |-⟩
                </text>

                {/* Y Axis (Horizontal) */}
                <line x1="50" y1="160" x2="270" y2="160" stroke="#64748b" strokeWidth="1.5" />
                <text x="275" y="165" fill="#eab308" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  +y |+i⟩
                </text>
                <text x="25" y="165" fill="#94a3b8" fontSize="12" fontFamily="monospace">
                  -y |-i⟩
                </text>

                {/* Dynamic State Vector */}
                {(() => {
                  // Spherical coordinates projected onto 2.5D isometric plane
                  // x axis projects at angle ~210 deg, y axis horizontal, z axis vertical
                  const r = 110;
                  const bx = singleQubit.bloch_x;
                  const by = singleQubit.bloch_y;
                  const bz = singleQubit.bloch_z;

                  const screenX = 160 + by * (r * 0.9) - bx * (r * 0.45);
                  const screenY = 160 - bz * r + bx * (r * 0.25);

                  // Equator shadow projection
                  const shadowX = 160 + by * (r * 0.9) - bx * (r * 0.45);
                  const shadowY = 160 + bx * (r * 0.25);

                  return (
                    <g>
                      {/* Shadow line on equatorial disk */}
                      <line
                        x1="160"
                        y1="160"
                        x2={shadowX}
                        y2={shadowY}
                        stroke="#0284c7"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        opacity="0.6"
                      />
                      <circle cx={shadowX} cy={shadowY} r="3" fill="#0284c7" opacity="0.6" />

                      {/* Drop line from tip to shadow */}
                      <line
                        x1={screenX}
                        y1={screenY}
                        x2={shadowX}
                        y2={shadowY}
                        stroke="#94a3b8"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.5"
                      />

                      {/* Vector Needle */}
                      <line
                        x1="160"
                        y1="160"
                        x2={screenX}
                        y2={screenY}
                        stroke="#f43f5e"
                        strokeWidth="3.5"
                      />
                      <circle cx={screenX} cy={screenY} r="6" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="160" cy="160" r="4" fill="#64748b" />
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Readout coordinates */}
            <div className="grid grid-cols-3 gap-3 text-xs font-mono text-center">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400">r_x:</span>{' '}
                <span className="text-cyan-400 font-bold">{singleQubit.bloch_x.toFixed(3)}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400">r_y:</span>{' '}
                <span className="text-cyan-400 font-bold">{singleQubit.bloch_y.toFixed(3)}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400">r_z:</span>{' '}
                <span className="text-cyan-400 font-bold">{singleQubit.bloch_z.toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Angle Sliders & Gate Palette (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Angle Sliders */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Spherical Parameters (θ, ϕ)
              </h3>

              {/* Theta Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Polar Angle θ (0 to π):</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {theta.toFixed(3)} rad ({(theta * (180 / Math.PI)).toFixed(1)}°)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.PI}
                  step="0.01"
                  value={theta}
                  onChange={(e) => setTheta(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-2 rounded cursor-pointer"
                />
              </div>

              {/* Phi Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Azimuthal Angle ϕ (0 to 2π):</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {phi.toFixed(3)} rad ({(phi * (180 / Math.PI)).toFixed(1)}°)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={2 * Math.PI}
                  step="0.01"
                  value={phi}
                  onChange={(e) => setPhi(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-2 rounded cursor-pointer"
                />
              </div>

              {/* Cardinal Presets */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                {[
                  { label: '|0⟩ (+Z)', t: 0, p: 0 },
                  { label: '|1⟩ (-Z)', t: Math.PI, p: 0 },
                  { label: '|+⟩ (+X)', t: Math.PI / 2, p: 0 },
                  { label: '|-⟩ (-X)', t: Math.PI / 2, p: Math.PI },
                  { label: '|+i⟩ (+Y)', t: Math.PI / 2, p: Math.PI / 2 },
                  { label: '|-i⟩ (-Y)', t: Math.PI / 2, p: (3 * Math.PI) / 2 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setTheta(preset.t);
                      setPhi(preset.p);
                    }}
                    className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Single Qubit Gate Palette */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Single-Qubit Gate Operations
                </h3>
                {singleGateHistory.length > 0 && (
                  <span className="text-[10px] text-cyan-300 font-mono">
                    History: {singleGateHistory.join(' → ')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleApplySingleGate('X')}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm font-mono shadow transition-all"
                  title="Pauli-X Gate: 180° rotation about X axis (Bit-flip)"
                >
                  X Gate
                </button>
                <button
                  onClick={() => handleApplySingleGate('Y')}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm font-mono shadow transition-all"
                  title="Pauli-Y Gate: 180° rotation about Y axis"
                >
                  Y Gate
                </button>
                <button
                  onClick={() => handleApplySingleGate('Z')}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm font-mono shadow transition-all"
                  title="Pauli-Z Gate: 180° rotation about Z axis (Phase-flip)"
                >
                  Z Gate
                </button>
                <button
                  onClick={() => handleApplySingleGate('H')}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-sm font-mono shadow transition-all"
                  title="Hadamard Gate: Creates equal superposition"
                >
                  H Gate
                </button>
              </div>

              {/* Probabilities Output */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">P(0) = |α|²:</span>
                  <span className="text-cyan-400 font-bold">{(singleQubit.prob0 * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all"
                    style={{ width: `${singleQubit.prob0 * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">P(1) = |β|²:</span>
                  <span className="text-indigo-400 font-bold">{(singleQubit.prob1 * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${singleQubit.prob1 * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OBSERVATION TABLES (1–5) */}
      {activeTab === 'tables' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 1, label: 'Table 1: Bloch Sphere (p. 74)' },
                { id: 2, label: 'Table 2: X, Y, Z Gates (p. 76)' },
                { id: 3, label: 'Table 3: Hadamard Gate (p. 77)' },
                { id: 4, label: 'Table 4: Two-Qubit Parameters (p. 81)' },
                { id: 5, label: 'Table 5: CNOT & SWAP Benchmark (p. 82)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTableTab(t.id as 1 | 2 | 3 | 4 | 5)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTableTab === t.id
                      ? 'bg-cyan-600 text-white font-bold shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleExportCSV(activeTableTab)}
              className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs rounded-lg transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export Table {activeTableTab} CSV
            </button>
          </div>

          {/* Table 5: Two-Qubit CNOT & SWAP */}
          {activeTableTab === 5 && (
            <div className="overflow-x-auto">
              <div className="text-xs text-slate-400 pb-3">
                <strong>Manual p. 82 Table:</strong> Benchmark evaluation of CNOT and SWAP gates across 10 benchmark states.
              </div>
              <table className="w-full text-xs text-left text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">S.No</th>
                    <th className="p-3">Input State |Ψ⟩</th>
                    <th className="p-3">CNOT|Ψ⟩ Output</th>
                    <th className="p-3">SWAP|Ψ⟩ Output</th>
                    <th className="p-3">Entanglement</th>
                    <th className="p-3">Physical Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {table5.map((row) => (
                    <tr key={row.sno} className="hover:bg-slate-850">
                      <td className="p-3 text-slate-500 font-bold">{row.sno}</td>
                      <td className="p-3 text-cyan-300 font-bold">{row.inputState}</td>
                      <td className="p-3 text-indigo-300 font-bold">{row.cnotOutput}</td>
                      <td className="p-3 text-emerald-300 font-bold">{row.swapOutput}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.isCnotEntangled
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {row.isCnotEntangled ? 'ENTANGLED' : 'SEPARABLE'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] font-sans">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table 4: Two-Qubit Bloch Parameters */}
          {activeTableTab === 4 && (
            <div className="overflow-x-auto">
              <div className="text-xs text-slate-400 pb-3">
                <strong>Manual p. 81 Table:</strong> Bloch sphere parameters for two-qubit states, highlighting separable product states versus entangled states.
              </div>
              <table className="w-full text-xs text-left text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">S.No</th>
                    <th className="p-3">Two-Qubit State |Ψ⟩</th>
                    <th className="p-3">θ₁ (rad)</th>
                    <th className="p-3">ϕ₁ (rad)</th>
                    <th className="p-3">θ₂ (rad)</th>
                    <th className="p-3">ϕ₂ (rad)</th>
                    <th className="p-3">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {table4.map((row) => (
                    <tr key={row.sno} className="hover:bg-slate-850">
                      <td className="p-3 text-slate-500 font-bold">{row.sno}</td>
                      <td className="p-3 text-cyan-300 font-bold">{row.stateStr}</td>
                      <td className="p-3">{row.theta1}</td>
                      <td className="p-3">{row.phi1}</td>
                      <td className="p-3">{row.theta2}</td>
                      <td className="p-3">{row.phi2}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.isEntangled
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table 1: Single-qubit Bloch Sphere */}
          {activeTableTab === 1 && (
            <div className="overflow-x-auto">
              <div className="text-xs text-slate-400 pb-3">
                <strong>Manual p. 74 Table:</strong> Spherical angles (θ, ϕ) and normalized state vector |ψ⟩ on the unit Bloch sphere.
              </div>
              <table className="w-full text-xs text-left text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">S.No</th>
                    <th className="p-3">θ (rad)</th>
                    <th className="p-3">ϕ (rad)</th>
                    <th className="p-3">State |ψ⟩</th>
                    <th className="p-3">Norm ⟨ψ|ψ⟩</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {table1.map((row) => (
                    <tr key={row.sno} className="hover:bg-slate-850">
                      <td className="p-3 text-slate-500 font-bold">{row.sno}</td>
                      <td className="p-3 text-cyan-300">{row.theta_str}</td>
                      <td className="p-3 text-cyan-300">{row.phi_str}</td>
                      <td className="p-3 text-indigo-300 font-bold">{row.stateKet}</td>
                      <td className="p-3 text-emerald-400 font-bold">{row.norm.toFixed(4)}</td>
                      <td className="p-3 text-slate-400 text-[11px] font-sans">{row.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table 2: X, Y, Z Gates */}
          {activeTableTab === 2 && (
            <div className="overflow-x-auto">
              <div className="text-xs text-slate-400 pb-3">
                <strong>Manual p. 76 Table:</strong> Effect of Pauli-X, Y, and Z gates on state vectors.
              </div>
              <table className="w-full text-xs text-left text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">S.No</th>
                    <th className="p-3">θ, ϕ (rad)</th>
                    <th className="p-3">Input |ψ⟩</th>
                    <th className="p-3">X|ψ⟩</th>
                    <th className="p-3">Y|ψ⟩</th>
                    <th className="p-3">Z|ψ⟩</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {table2.map((row) => (
                    <tr key={row.sno} className="hover:bg-slate-850">
                      <td className="p-3 text-slate-500 font-bold">{row.sno}</td>
                      <td className="p-3 text-slate-400">{row.theta_str}, {row.phi_str}</td>
                      <td className="p-3 text-cyan-300 font-bold">{row.inputKet}</td>
                      <td className="p-3 text-indigo-300">{row.xKet}</td>
                      <td className="p-3 text-emerald-300">{row.yKet}</td>
                      <td className="p-3 text-amber-300">{row.zKet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table 3: Hadamard Gate */}
          {activeTableTab === 3 && (
            <div className="overflow-x-auto">
              <div className="text-xs text-slate-400 pb-3">
                <strong>Manual p. 77 Table:</strong> Hadamard gate transformations mapping cardinal states to superpositions.
              </div>
              <table className="w-full text-xs text-left text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">S.No</th>
                    <th className="p-3">θ, ϕ (rad)</th>
                    <th className="p-3">Input State |ψ⟩</th>
                    <th className="p-3">H|ψ⟩ Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {table3.map((row) => (
                    <tr key={row.sno} className="hover:bg-slate-850">
                      <td className="p-3 text-slate-500 font-bold">{row.sno}</td>
                      <td className="p-3 text-slate-400">{row.theta_str}, {row.phi_str}</td>
                      <td className="p-3 text-cyan-300 font-bold">{row.inputKet}</td>
                      <td className="p-3 text-indigo-300 font-bold">{row.hKet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: QISKIT PYTHON SIMULATION */}
      {activeTab === 'python_qiskit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                Python 3 / Qiskit 1.x Verification Script
              </h2>
              <p className="text-xs text-slate-400">
                Faithful copyable script using <code className="text-amber-300">qiskit</code>,{' '}
                <code className="text-amber-300">qiskit-aer</code>, and{' '}
                <code className="text-amber-300">matplotlib</code>.
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow"
            >
              {codeCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {codeCopied ? 'Copied to Clipboard!' : 'Copy Python Code'}
            </button>
          </div>

          <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3 text-xs text-amber-300/90 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Environment Note:</strong> The browser executes an equivalent mathematical state-vector solver
              in real time. You can also run this exact script in your local Jupyter Notebook or Google Colab with Python 3.
            </span>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
            <code>{qiskitScript}</code>
          </pre>
        </div>
      )}

      {/* MODAL: Source Ambiguities (AMB-08 and AMB-09) */}
      {showAmbiguitiesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Laboratory Source Ambiguities &amp; Qiskit Conventions
              </h3>
              <button
                onClick={() => setShowAmbiguitiesModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
              {QUANTUM_AMBIGUITIES.map((amb) => (
                <div key={amb.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-sm">{amb.id}: {amb.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{amb.sourceLocation}</span>
                  </div>
                  <p className="text-slate-300">{amb.description}</p>
                  <div className="bg-cyan-950/30 p-2.5 rounded border border-cyan-800/40 text-cyan-200">
                    <strong>Resolution:</strong> {amb.resolution}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAmbiguitiesModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Understood &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Theory & Discussion Questions */}
      {showTheoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Theory &amp; Manual Discussion Questions
              </h3>
              <button
                onClick={() => setShowTheoryModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-bold text-cyan-300">Q1. Can every two-qubit state be written in terms of single-qubit Bloch sphere angles? (Manual p. 80)</span>
                <p className="text-slate-300">
                  <strong>Answer:</strong> No. Only product (separable) states can be factorized as |Ψ⟩ = |ψ₁⟩ ⊗ |ψ₂⟩ with distinct Bloch angles (θ₁, ϕ₁) and (θ₂, ϕ₂). Entangled states (such as Bell states) exhibit non-local quantum correlations and have concurrence C &gt; 0; their individual reduced density matrices are mixed states residing inside the sphere rather than on its surface.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-bold text-cyan-300">Q2. For which input states does the CNOT gate leave the system unchanged? (Manual p. 83)</span>
                <p className="text-slate-300">
                  <strong>Answer:</strong> When the control qubit is in the |0⟩ computational state (e.g. |00⟩, |01⟩), the target qubit undergoes no operation. Additionally, if the target is in the |+⟩ eigenstate of Pauli-X (|c⟩ ⊗ |+⟩), X|+⟩ = |+⟩, so the joint state is invariant regardless of control.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-bold text-cyan-300">Q3. When the control qubit is in a superposition and the target is |0⟩, what state is produced? (Manual p. 83)</span>
                <p className="text-slate-300">
                  <strong>Answer:</strong> A maximally entangled state is produced. For instance, |+⟩ ⊗ |0⟩ = (|00⟩ + |10⟩)/√2 passed through CNOT(0→1) yields the canonical Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="font-bold text-cyan-300">Q4. If the roles of control and target qubits are swapped in CNOT, how does output differ? (Manual p. 83)</span>
                <p className="text-slate-300">
                  <strong>Answer:</strong> CNOT is asymmetric. For CNOT(0→1), |10⟩ → |11⟩ and |01⟩ → |01⟩. For CNOT(1→0) (control q₁, target q₀), |01⟩ → |11⟩ and |10⟩ → |10⟩.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowTheoryModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
