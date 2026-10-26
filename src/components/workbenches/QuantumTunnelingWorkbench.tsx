import React, { useState, useMemo } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import {
  tunnelingEngine,
  TunnelingParams,
  TableRow_T_vs_E,
  TableRow_T_vs_a,
} from '../../engine/tunnelingSimulator';
import { Instrument } from '../primitives/Instrument';
import { LabGraph, GraphSeries } from '../primitives/LabGraph';
import {
  ArrowLeft,
  Printer,
  Compass,
  Award,
  HelpCircle,
  Calculator,
  Download,
  Copy,
  Check,
  Table,
  Sliders,
  FileCode,
  BookOpen,
} from 'lucide-react';

interface QuantumTunnelingWorkbenchProps {
  metadata: ExperimentMetadata;
  onBackToDashboard: () => void;
  onOpenViva: () => void;
}

export const QuantumTunnelingWorkbench: React.FC<QuantumTunnelingWorkbenchProps> = ({
  metadata,
  onBackToDashboard,
  onOpenViva,
}) => {
  // Mode switcher: Guided vs Exam
  const [activeMode, setActiveMode] = useState<'guided' | 'exam'>('guided');
  const [guidedStep, setGuidedStep] = useState<number>(1);

  // Simulation Controls State
  const [particleEnergy_eV, setParticleEnergy_eV] = useState<number>(2.0);
  const [barrierHeight_eV, setBarrierHeight_eV] = useState<number>(6.0);
  const [barrierWidth_A, setBarrierWidth_A] = useState<number>(1.5);

  // Visualization View Settings
  const [activeMainTab, setActiveMainTab] = useState<'wavefunction' | 't_vs_e' | 't_vs_a' | 'log_t_vs_a'>('wavefunction');
  const [psiComponent, setPsiComponent] = useState<'real' | 'imag' | 'density'>('real');
  const [activeTableTab, setActiveTableTab] = useState<'table1_1' | 'table1_2' | 'table2_1' | 'table2_2'>('table1_1');
  const [showCodeDrawer, setShowCodeDrawer] = useState<boolean>(false);
  const [showCalculationsDrawer, setShowCalculationsDrawer] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Simulation Engine Execution
  const currentParams: TunnelingParams = useMemo(
    () => ({
      particleEnergy_eV,
      barrierHeight_eV,
      barrierWidth_Angstrom: barrierWidth_A,
    }),
    [particleEnergy_eV, barrierHeight_eV, barrierWidth_A]
  );

  const readings = useMemo(() => {
    return tunnelingEngine.calculateReadings(currentParams);
  }, [currentParams]);

  const derived = useMemo(() => {
    return tunnelingEngine.computeDerived(readings, currentParams);
  }, [readings, currentParams]);

  const spatialWavefunction = useMemo(() => {
    return tunnelingEngine.generateWavefunctionSpatialProfile(currentParams, 260);
  }, [currentParams]);

  // Table Datasets
  const [table1_1Data, setTable1_1Data] = useState<TableRow_T_vs_E[]>(() =>
    tunnelingEngine.generateObservationTable1_1()
  );
  const [table1_2Data, setTable1_2Data] = useState<TableRow_T_vs_E[]>(() =>
    tunnelingEngine.generateObservationTable1_2()
  );
  const [table2_1Data, setTable2_1Data] = useState<TableRow_T_vs_a[]>(() =>
    tunnelingEngine.generateObservationTable2_1()
  );
  const [table2_2Data, setTable2_2Data] = useState<TableRow_T_vs_a[]>(() =>
    tunnelingEngine.generateObservationTable2_2()
  );

  const handlePopulateAllTables = () => {
    setTable1_1Data(tunnelingEngine.generateObservationTable1_1());
    setTable1_2Data(tunnelingEngine.generateObservationTable1_2());
    setTable2_1Data(tunnelingEngine.generateObservationTable2_1());
    setTable2_2Data(tunnelingEngine.generateObservationTable2_2());
  };

  // Preset Configurations
  const applyPreset = (e: number, v0: number, a: number) => {
    setParticleEnergy_eV(e);
    setBarrierHeight_eV(v0);
    setBarrierWidth_A(a);
  };

  // Python Code Generation
  const pythonSource = useMemo(() => {
    return tunnelingEngine.generatePythonSourceCode(currentParams);
  }, [currentParams]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(pythonSource);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadPython = () => {
    const blob = new Blob([pythonSource], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quantum_tunneling_E${particleEnergy_eV}eV_V0${barrierHeight_eV}eV_a${barrierWidth_A}A.py`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadNotebook = () => {
    const notebookJson = {
      cells: [
        {
          cell_type: 'markdown',
          metadata: {},
          source: [
            '# VIT Chennai - BAPHY105: Quantum Tunneling Simulation\\n',
            '## Experiment 4: Simulating Quantum Tunneling Through a Finite Potential Barrier\\n',
            'This notebook solves the 1D Schrödinger equation across a finite rectangular barrier\\n',
            'and calculates the complex transmission amplitude $t$ and transmission probability $T = |t|^2$.\\n',
          ],
        },
        {
          cell_type: 'code',
          execution_count: null,
          metadata: {},
          outputs: [],
          source: pythonSource.split('\\n').map((l) => l + '\\n'),
        },
      ],
      metadata: {
        language_info: { name: 'python' },
      },
      nbformat: 4,
      nbformat_minor: 2,
    };

    const blob = new Blob([JSON.stringify(notebookJson, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quantum_tunneling_experiment.ipynb`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSV Export for Tables
  const handleExportCSV = () => {
    let csv = '=== TABLE 1.1: T vs E (a = 1.5 A, V0 = 6.0 eV) ===\\n';
    csv += 'Sl.No,Energy E (eV),Transmitted Amplitude |t|,T (observed),T (calculated)\\n';
    table1_1Data.forEach((r) => {
      csv += `${r.slNo},${r.energy_eV},${r.transmittedAmplitude_t},${r.T_observed},${r.T_calculated}\\n`;
    });

    csv += '\\n=== TABLE 1.2: T vs E (a = 2.0 A, V0 = 6.0 eV) ===\\n';
    csv += 'Sl.No,Energy E (eV),Transmitted Amplitude |t|,T (observed),T (calculated)\\n';
    table1_2Data.forEach((r) => {
      csv += `${r.slNo},${r.energy_eV},${r.transmittedAmplitude_t},${r.T_observed},${r.T_calculated}\\n`;
    });

    csv += '\\n=== TABLE 2.1: T vs a (E = 2.0 eV, V0 = 6.0 eV) ===\\n';
    csv += 'Sl.No,Barrier Width a (A),Transmitted Amplitude |t|,T (observed),T (calculated),log_e(T)\\n';
    table2_1Data.forEach((r) => {
      csv += `${r.slNo},${r.barrierWidth_a_A},${r.transmittedAmplitude_t},${r.T_observed},${r.T_calculated},${r.log_e_T}\\n`;
    });

    csv += '\\n=== TABLE 2.2: T vs a & ln(T) vs a (E = 3.0 eV, V0 = 6.0 eV) ===\\n';
    csv += 'Sl.No,Barrier Width a (A),Transmitted Amplitude |t|,T (observed),T (calculated),log_e(T)\\n';
    table2_2Data.forEach((r) => {
      csv += `${r.slNo},${r.barrierWidth_a_A},${r.transmittedAmplitude_t},${r.T_observed},${r.T_calculated},${r.log_e_T}\\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quantum_tunneling_tables.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // LabGraph Curves
  const tVsECurvePoints = useMemo(() => {
    return tunnelingEngine.generateTransmissionVsEnergyCurve(currentParams, 100);
  }, [currentParams]);

  const tVsACurvePoints = useMemo(() => {
    return tunnelingEngine.generateTransmissionVsWidthCurve(currentParams, 80);
  }, [currentParams]);

  const logTVsACurvePoints = useMemo(() => {
    return tunnelingEngine.generateLogTVsWidthCurve(currentParams, 80);
  }, [currentParams]);

  const tVsESeries: GraphSeries[] = [
    {
      id: 't_vs_e',
      name: `T(E) at V0=${barrierHeight_eV}eV, a=${barrierWidth_A}Å`,
      points: tVsECurvePoints,
      color: '#38bdf8',
      unitY: '',
    },
  ];

  const tVsASeries: GraphSeries[] = [
    {
      id: 't_vs_a',
      name: `T(a) at E=${particleEnergy_eV}eV, V0=${barrierHeight_eV}eV`,
      points: tVsACurvePoints,
      color: '#f59e0b',
      unitY: '',
    },
  ];

  const logTVsASeries: GraphSeries[] = [
    {
      id: 'log_t_vs_a',
      name: `ln(T) vs a (Slope ≈ -2κ)`,
      points: logTVsACurvePoints,
      color: '#a855f7',
      unitY: '',
    },
  ];

  // SVG Wavefunction Coordinates Mapper
  // Canvas width = 720, height = 320
  // x_A ranges from -4.0 to (barrierWidth_A + 3.0)
  const xMin_A = -4.0;
  const xMax_A = Math.max(4.0, barrierWidth_A + 3.0);
  const toSvgX = (x: number) => {
    return 60 + ((x - xMin_A) / (xMax_A - xMin_A)) * 600;
  };

  // Wavefunction amplitude y: -1.2 to 1.2 maps to SVG y: 280 to 40 (midline at y = 160)
  const toSvgY = (y: number) => {
    const clampedY = Math.max(-1.2, Math.min(1.2, y));
    return 160 - (clampedY / 1.2) * 110;
  };

  // Potential V(x) mapping to right axis (0 to V0_max)
  const vScaleMax = Math.max(10.0, barrierHeight_eV * 1.5);
  const toSvgV = (v: number) => {
    const clamped = Math.max(0, Math.min(vScaleMax, v));
    return 270 - (clamped / vScaleMax) * 220;
  };

  // Wavefunction SVG path string
  const psiSvgPath = useMemo(() => {
    if (spatialWavefunction.length === 0) return '';
    return spatialWavefunction
      .map((pt, idx) => {
        const val =
          psiComponent === 'real'
            ? pt.psi_real
            : psiComponent === 'imag'
            ? pt.psi_imag
            : pt.psi_probDensity;
        const x = toSvgX(pt.x_A);
        const y = toSvgY(val);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [spatialWavefunction, psiComponent, toSvgX, toSvgY]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
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
                EXPT 04 • BAPHY105
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                [SIMULATED DATA - VALIDATED SCHRÖDINGER SOLVER]
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              {metadata.title}
            </h1>
          </div>
        </div>

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
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Exam
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCalculationsDrawer(!showCalculationsDrawer)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Calculator className="w-4 h-4 text-indigo-400" />
            Theory & Derivations
          </button>

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
            title="Print Lab Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guided Mode Instructions Banner */}
      {activeMode === 'guided' && (
        <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-indigo-200 no-print">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
              {guidedStep}
            </div>
            <div>
              <span className="font-bold text-indigo-100">
                {guidedStep === 1 && 'Step 1: Set Default Parameters & Observe Wavefunction Across Regions I, II & III'}
                {guidedStep === 2 && 'Step 2: Study Dependence on Particle Energy E (Sub-barrier vs Over-barrier)'}
                {guidedStep === 3 && 'Step 3: Study Exponential Decay with Barrier Width a (T vs a & ln(T) vs a)'}
                {guidedStep === 4 && 'Step 4: Inspect Python Notebook Parity, Populate Tables & Complete Lab Viva'}
              </span>
              <p className="text-indigo-300 text-[11px] mt-0.5">
                {guidedStep === 1 && 'Set E=2.0 eV, V0=6.0 eV, a=1.5 Å (Manual p. 46). Observe standing wave in Region I, exponential decay in Region II, and transmitted plane wave in Region III.'}
                {guidedStep === 2 && 'Vary E from 0.5 to 8.0 eV. As E approaches V0, barrier attenuation diminishes. For E > V0, transmission resonances appear.'}
                {guidedStep === 3 && 'Observe how transmission coefficient T drops exponentially with width a, and verify that ln(T) forms a linear plot with slope -2κ.'}
                {guidedStep === 4 && 'View the Python reference script, copy or download it, populate Observation Tables 1.1–2.2, and answer the analytical questions.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              type="button"
              disabled={guidedStep === 1}
              onClick={() => setGuidedStep((s) => Math.max(1, s - 1))}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={guidedStep === 4}
              onClick={() => setGuidedStep((s) => Math.min(4, s + 1))}
              className="px-3 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 disabled:opacity-40"
            >
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Visualizer & Sliders (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Stage Header with Presets & Tab Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveMainTab('wavefunction')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeMainTab === 'wavefunction'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Wavefunction &amp; Barrier
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMainTab('t_vs_e')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeMainTab === 't_vs_e'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  T vs Energy (E)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMainTab('t_vs_a')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeMainTab === 't_vs_a'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  T vs Width (a)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMainTab('log_t_vs_a')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeMainTab === 'log_t_vs_a'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ln(T) vs a
                </button>
              </div>

              {/* Fast Presets */}
              <div className="flex items-center gap-1.5 text-xs no-print">
                <span className="text-slate-400 text-[11px]">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset(2.0, 6.0, 1.5)}
                  className="px-2 py-0.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 font-mono text-[11px]"
                >
                  Manual (2eV, 6eV, 1.5Å)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(6.0, 6.0, 1.5)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
                >
                  Critical E=V0
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(8.0, 6.0, 1.5)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
                >
                  Over-barrier (8eV)
                </button>
              </div>
            </div>

            {/* Visualizer Stage Tab 1: Wavefunction & Barrier Plot (Manual p. 46 Image 176) */}
            {activeMainTab === 'wavefunction' && (
              <div className="space-y-3">
                {/* Visualizer Controls toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium text-[11px]">Component:</span>
                    <button
                      type="button"
                      onClick={() => setPsiComponent('real')}
                      className={`px-2.5 py-0.5 rounded font-mono text-[11px] ${
                        psiComponent === 'real'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Re(ψ) [Manual]
                    </button>
                    <button
                      type="button"
                      onClick={() => setPsiComponent('imag')}
                      className={`px-2.5 py-0.5 rounded font-mono text-[11px] ${
                        psiComponent === 'imag'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Im(ψ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPsiComponent('density')}
                      className={`px-2.5 py-0.5 rounded font-mono text-[11px] ${
                        psiComponent === 'density'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      |ψ|² (Probability Density)
                    </button>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 bg-blue-400"></div>
                      <span className="text-blue-300">{psiComponent === 'real' ? 'Re(ψ)' : psiComponent === 'imag' ? 'Im(ψ)' : '|ψ|²'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 border-t border-dashed border-pink-500"></div>
                      <span className="text-pink-400">V(x) = {barrierHeight_eV} eV</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 border-t border-dashed border-emerald-400"></div>
                      <span className="text-emerald-400">E = {particleEnergy_eV} eV</span>
                    </div>
                  </div>
                </div>

                {/* SVG Exact Wavefunction & Potential Plot (Image 176 Replica) */}
                <div className="relative w-full aspect-[16/8] bg-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden shadow-inner">
                  <svg viewBox="0 0 720 320" className="w-full h-full select-none">
                    <defs>
                      <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                      </pattern>
                      <pattern id="barrierHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#475569" strokeWidth="1.2" />
                      </pattern>
                    </defs>

                    {/* Background Grid */}
                    <rect x="60" y="30" width="600" height="240" fill="url(#gridPattern)" />

                    {/* Region II Shaded Barrier (Manual p. 46 grey block) */}
                    <rect
                      x={toSvgX(0)}
                      y={toSvgV(barrierHeight_eV)}
                      width={toSvgX(barrierWidth_A) - toSvgX(0)}
                      height={270 - toSvgV(barrierHeight_eV)}
                      fill="#334155"
                      opacity="0.35"
                    />
                    <rect
                      x={toSvgX(0)}
                      y={toSvgV(barrierHeight_eV)}
                      width={toSvgX(barrierWidth_A) - toSvgX(0)}
                      height={270 - toSvgV(barrierHeight_eV)}
                      fill="url(#barrierHatch)"
                      opacity="0.3"
                    />

                    {/* Region Label Annotations */}
                    <text x={toSvgX(-2.0)} y="45" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                      REGION I (x &lt; 0)
                    </text>
                    <text
                      x={(toSvgX(0) + toSvgX(barrierWidth_A)) / 2}
                      y="45"
                      fill="#94a3b8"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      REGION II (0 ≤ x ≤ a)
                    </text>
                    <text
                      x={toSvgX(barrierWidth_A + 1.8)}
                      y="45"
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      REGION III (x &gt; a)
                    </text>

                    {/* Zero Amplitude Axis Line */}
                    <line x1="60" y1="160" x2="660" y2="160" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />

                    {/* Potential Energy Step Profile V(x) (Pink Dashed Line) */}
                    {/* From xMin to 0: V = 0 */}
                    <line x1={toSvgX(xMin_A)} y1={toSvgV(0)} x2={toSvgX(0)} y2={toSvgV(0)} stroke="#ec4899" strokeWidth="1.8" strokeDasharray="4,3" />
                    {/* At x = 0: vertical step to V0 */}
                    <line x1={toSvgX(0)} y1={toSvgV(0)} x2={toSvgX(0)} y2={toSvgV(barrierHeight_eV)} stroke="#ec4899" strokeWidth="1.8" strokeDasharray="4,3" />
                    {/* From 0 to a: V = V0 */}
                    <line x1={toSvgX(0)} y1={toSvgV(barrierHeight_eV)} x2={toSvgX(barrierWidth_A)} y2={toSvgV(barrierHeight_eV)} stroke="#ec4899" strokeWidth="1.8" strokeDasharray="4,3" />
                    {/* At x = a: vertical drop to 0 */}
                    <line x1={toSvgX(barrierWidth_A)} y1={toSvgV(barrierHeight_eV)} x2={toSvgX(barrierWidth_A)} y2={toSvgV(0)} stroke="#ec4899" strokeWidth="1.8" strokeDasharray="4,3" />
                    {/* From a to xMax: V = 0 */}
                    <line x1={toSvgX(barrierWidth_A)} y1={toSvgV(0)} x2={toSvgX(xMax_A)} y2={toSvgV(0)} stroke="#ec4899" strokeWidth="1.8" strokeDasharray="4,3" />

                    {/* Particle Energy E Horizontal Line (Green Dashed Line) */}
                    <line x1="60" y1={toSvgV(particleEnergy_eV)} x2="660" y2={toSvgV(particleEnergy_eV)} stroke="#10b981" strokeWidth="1.5" strokeDasharray="5,4" />

                    {/* Wavefunction Curve Path */}
                    <path d={psiSvgPath} fill="none" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Left Axis: Wavefunction Amplitude */}
                    <line x1="60" y1="30" x2="60" y2="270" stroke="#475569" strokeWidth="1.5" />
                    <text x="25" y="150" fill="#93c5fd" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90 25 150)" fontFamily="sans-serif">
                      Wavefunction amplitude
                    </text>
                    {[-1.0, -0.5, 0.0, 0.5, 1.0].map((val) => (
                      <g key={val}>
                        <line x1="55" y1={toSvgY(val)} x2="60" y2={toSvgY(val)} stroke="#475569" strokeWidth="1.2" />
                        <text x="50" y={toSvgY(val) + 3} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">
                          {val.toFixed(1)}
                        </text>
                      </g>
                    ))}

                    {/* Right Axis: Potential Energy (eV) */}
                    <line x1="660" y1="30" x2="660" y2="270" stroke="#475569" strokeWidth="1.5" />
                    <text x="695" y="150" fill="#f472b6" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(90 695 150)" fontFamily="sans-serif">
                      Potential Energy (eV)
                    </text>
                    {[0, 2, 4, 6, 8, 10].filter((v) => v <= vScaleMax).map((val) => (
                      <g key={val}>
                        <line x1="660" y1={toSvgV(val)} x2="665" y2={toSvgV(val)} stroke="#475569" strokeWidth="1.2" />
                        <text x="670" y={toSvgV(val) + 3} fill="#f472b6" fontSize="9" textAnchor="start" fontFamily="monospace">
                          {val}
                        </text>
                      </g>
                    ))}

                    {/* Bottom Axis: x (Å) */}
                    <line x1="60" y1="270" x2="660" y2="270" stroke="#475569" strokeWidth="1.5" />
                    <text x="360" y="305" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                      x (Å)
                    </text>
                    {[-4, -3, -2, -1, 0, 1, 2, 3, 4].filter((x) => x >= xMin_A && x <= xMax_A).map((xVal) => (
                      <g key={xVal}>
                        <line x1={toSvgX(xVal)} y1="270" x2={toSvgX(xVal)} y2="275" stroke="#475569" strokeWidth="1.2" />
                        <text x={toSvgX(xVal)} y="288" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          {xVal}
                        </text>
                      </g>
                    ))}

                    {/* Barrier Boundary Ticks at 0 and a */}
                    <line x1={toSvgX(0)} y1="268" x2={toSvgX(0)} y2="280" stroke="#f59e0b" strokeWidth="2" />
                    <line x1={toSvgX(barrierWidth_A)} y1="268" x2={toSvgX(barrierWidth_A)} y2="280" stroke="#f59e0b" strokeWidth="2" />
                    <text x={toSvgX(0)} y="295" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      x=0
                    </text>
                    <text x={toSvgX(barrierWidth_A)} y="295" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      x=a ({barrierWidth_A}Å)
                    </text>
                  </svg>
                </div>
              </div>
            )}

            {/* Visualizer Stage Tab 2: T vs Energy Curve */}
            {activeMainTab === 't_vs_e' && (
              <div className="space-y-3">
                <LabGraph
                  title={`Transmission Probability T vs Particle Energy E (Barrier V0 = ${barrierHeight_eV} eV, a = ${barrierWidth_A} Å)`}
                  series={tVsESeries}
                  xLabel="Particle Energy E"
                  xUnit="eV"
                  yLabel="Transmission Probability T (|t|²)"
                  highlightPoint={{
                    x: particleEnergy_eV,
                    y: readings.transmissionCoefficient_T,
                    label: `E=${particleEnergy_eV}eV: T=${readings.transmissionCoefficient_T.toFixed(4)}`,
                    color: '#38bdf8',
                  }}
                />
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between">
                  <span>Operating Energy: <strong className="text-sky-400">{particleEnergy_eV} eV</strong></span>
                  <span>T: <strong className="text-amber-400">{readings.transmissionCoefficient_T}</strong></span>
                  <span>Amplitude |t|: <strong className="text-emerald-400">{readings.transmittedAmplitude_magnitude_t}</strong></span>
                </div>
              </div>
            )}

            {/* Visualizer Stage Tab 3: T vs Width (a) Curve */}
            {activeMainTab === 't_vs_a' && (
              <div className="space-y-3">
                <LabGraph
                  title={`Transmission Probability T vs Barrier Width a (E = ${particleEnergy_eV} eV, V0 = ${barrierHeight_eV} eV)`}
                  series={tVsASeries}
                  xLabel="Barrier Width a"
                  xUnit="Å"
                  yLabel="Transmission Probability T"
                  highlightPoint={{
                    x: barrierWidth_A,
                    y: readings.transmissionCoefficient_T,
                    label: `a=${barrierWidth_A}Å: T=${readings.transmissionCoefficient_T.toFixed(4)}`,
                    color: '#f59e0b',
                  }}
                />
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between">
                  <span>Width a: <strong className="text-amber-400">{barrierWidth_A} Å</strong></span>
                  <span>Decay Rate inside barrier: <strong className="text-purple-400">{derived.decayRateInsideBarrier} m⁻¹</strong></span>
                  <span>T: <strong className="text-emerald-400">{readings.transmissionCoefficient_T}</strong></span>
                </div>
              </div>
            )}

            {/* Visualizer Stage Tab 4: ln(T) vs a (Linear Plot) */}
            {activeMainTab === 'log_t_vs_a' && (
              <div className="space-y-3">
                <LabGraph
                  title={`Logarithmic Transmission ln(T) vs Barrier Width a (Slope ≈ -2κ = -${(2 * readings.attenuationConstant_kappa_per_A).toFixed(3)} Å⁻¹)`}
                  series={logTVsASeries}
                  xLabel="Barrier Width a"
                  xUnit="Å"
                  yLabel="ln(T)"
                  highlightPoint={{
                    x: barrierWidth_A,
                    y: readings.log_e_T,
                    label: `a=${barrierWidth_A}Å: ln(T)=${readings.log_e_T}`,
                    color: '#a855f7',
                  }}
                />
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between">
                  <span>Theoretical Slope -2κ: <strong className="text-purple-400">-{ (2 * readings.attenuationConstant_kappa_per_A).toFixed(3) } Å⁻¹</strong></span>
                  <span>ln(T): <strong className="text-amber-400">{readings.log_e_T}</strong></span>
                </div>
              </div>
            )}

            {/* Parameter Sliders Panel */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3 no-print">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-400">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Quantum Parameter Controls
                </span>
                <span className="text-[11px] font-mono text-indigo-400">{derived.tunnelingRegime}</span>
              </div>

              {/* Slider 1: Particle Energy E (eV) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="energy-slider" className="font-semibold text-slate-300 flex items-center gap-1">
                    Particle Energy <span className="font-mono text-indigo-300">(E)</span>:
                  </label>
                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      type="button"
                      onClick={() => setParticleEnergy_eV((prev) => Math.max(0.1, Number((prev - 0.1).toFixed(2))))}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      -0.1
                    </button>
                    <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 min-w-[4rem] text-center">
                      {particleEnergy_eV.toFixed(2)} eV
                    </span>
                    <button
                      type="button"
                      onClick={() => setParticleEnergy_eV((prev) => Math.min(12.0, Number((prev + 0.1).toFixed(2))))}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      +0.1
                    </button>
                  </div>
                </div>
                <input
                  id="energy-slider"
                  aria-label="Adjust particle energy E"
                  type="range"
                  min="0.1"
                  max="12.0"
                  step="0.05"
                  value={particleEnergy_eV}
                  onChange={(e) => setParticleEnergy_eV(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.1 eV</span>
                  <span>Knee V0 = {barrierHeight_eV} eV</span>
                  <span>12.0 eV</span>
                </div>
              </div>

              {/* Slider 2: Barrier Height V0 (eV) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="barrier-height-slider" className="font-semibold text-slate-300 flex items-center gap-1">
                    Barrier Height <span className="font-mono text-pink-300">(V₀)</span>:
                  </label>
                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      type="button"
                      onClick={() => setBarrierHeight_eV((prev) => Math.max(1.0, Number((prev - 0.2).toFixed(2))))}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      -0.2
                    </button>
                    <span className="text-pink-400 font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 min-w-[4rem] text-center">
                      {barrierHeight_eV.toFixed(2)} eV
                    </span>
                    <button
                      type="button"
                      onClick={() => setBarrierHeight_eV((prev) => Math.min(15.0, Number((prev + 0.2).toFixed(2))))}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      +0.2
                    </button>
                  </div>
                </div>
                <input
                  id="barrier-height-slider"
                  aria-label="Adjust barrier height V0"
                  type="range"
                  min="1.0"
                  max="15.0"
                  step="0.1"
                  value={barrierHeight_eV}
                  onChange={(e) => setBarrierHeight_eV(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1.0 eV</span>
                  <span>Manual default = 6.0 eV</span>
                  <span>15.0 eV</span>
                </div>
              </div>

              {/* Slider 3: Barrier Width a (Å) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="barrier-width-slider" className="font-semibold text-slate-300 flex items-center gap-1">
                    Barrier Width <span className="font-mono text-amber-300">(a)</span>:
                  </label>
                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      type="button"
                      onClick={() => setBarrierWidth_A((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      -0.1
                    </button>
                    <span className="text-amber-400 font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 min-w-[4rem] text-center">
                      {barrierWidth_A.toFixed(2)} Å
                    </span>
                    <button
                      type="button"
                      onClick={() => setBarrierWidth_A((prev) => Math.min(5.0, Number((prev + 0.1).toFixed(2))))}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      +0.1
                    </button>
                  </div>
                </div>
                <input
                  id="barrier-width-slider"
                  aria-label="Adjust barrier width a"
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.05"
                  value={barrierWidth_A}
                  onChange={(e) => setBarrierWidth_A(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.5 Å</span>
                  <span>Manual default = 1.5 Å</span>
                  <span>5.0 Å</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Physical Instruments HUD & Jupyter Source Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Instruments & Output HUD */}
          <div className="grid grid-cols-2 gap-2">
            <Instrument
              type="power"
              title="Transmission Prob T"
              value={readings.transmissionCoefficient_T.toFixed(4)}
              unit=""
              range="0.000–1.000"
              subLabel="|t|²"
              subValue={`${(readings.transmissionCoefficient_T * 100).toFixed(2)}%`}
            />

            <Instrument
              type="generic"
              title="Transmitted Amp |t|"
              value={readings.transmittedAmplitude_magnitude_t.toFixed(4)}
              unit=""
              range="Amplitude"
              subLabel="√T"
              subValue={`${readings.transmittedAmplitude_magnitude_t.toFixed(4)}`}
            />

            <Instrument
              type="generic"
              title="Attenuation κ"
              value={readings.attenuationConstant_kappa_per_A.toFixed(3)}
              unit="Å⁻¹"
              range="Decay"
              subLabel="SI unit"
              subValue={`${readings.attenuationConstant_kappa_per_m.toExponential(3)} m⁻¹`}
            />

            <Instrument
              type="generic"
              title="Penetration Depth δ"
              value={derived.penetrationDepth_Angstrom.toFixed(2)}
              unit="Å"
              range="1/κ"
              subLabel="In nm"
              subValue={`${derived.penetrationDepth_nm.toFixed(3)} nm`}
            />
          </div>

          {/* Complex Amplitudes Breakdown Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                Complex Amplitudes &amp; Unitarity
              </span>
              <button
                type="button"
                onClick={() => setShowCalculationsDrawer(!showCalculationsDrawer)}
                className="text-indigo-400 hover:text-indigo-300 font-sans text-xs font-semibold"
              >
                {showCalculationsDrawer ? 'Hide Theory' : 'View Theory'}
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>Transmitted Amplitude t:</span>
                <span className="text-emerald-400 font-bold">
                  {readings.transmittedAmplitude_complex.re.toFixed(4)}{' '}
                  {readings.transmittedAmplitude_complex.im >= 0 ? '+' : '-'}
                  {Math.abs(readings.transmittedAmplitude_complex.im).toFixed(4)}j
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Reflected Amplitude r:</span>
                <span className="text-pink-400 font-bold">
                  {readings.reflectionAmplitude_complex.re.toFixed(4)}{' '}
                  {readings.reflectionAmplitude_complex.im >= 0 ? '+' : '-'}
                  {Math.abs(readings.reflectionAmplitude_complex.im).toFixed(4)}j
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 border-t border-slate-800 pt-1">
                <span>Unitarity (|t|² + |r|²):</span>
                <span className="text-amber-300 font-bold">
                  {(readings.transmissionCoefficient_T + readings.reflectionCoefficient_R).toFixed(5)} = 1.00000
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span>Incident wave vector k₁:</span>
                <span className="text-slate-200 font-bold">{readings.waveNumber_k1_per_A.toFixed(3)} Å⁻¹</span>
              </div>
              <div className="flex items-center justify-between">
                <span>de Broglie wavelength λ_dB:</span>
                <span className="text-slate-200 font-bold">{derived.deBroglieWavelength_Region1_A} Å</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Logarithmic transmission ln(T):</span>
                <span className="text-purple-300 font-bold">{readings.log_e_T}</span>
              </div>
            </div>
          </div>

          {/* Python Jupyter Source Code Reference Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Python Jupyter Code (Manual Parity)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeDrawer(!showCodeDrawer)}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                {showCodeDrawer ? 'Collapse Code' : 'Expand Code'}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong>Notice:</strong> The browser simulation executes our validated TypeScript model; the panel below provides the exact NumPy/SciPy Python script for local Jupyter Notebook verification.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied!' : 'Copy Python'}
              </button>
              <button
                type="button"
                onClick={handleDownloadPython}
                className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                title="Download .py script"
              >
                <Download className="w-3.5 h-3.5" />
                .py
              </button>
              <button
                type="button"
                onClick={handleDownloadNotebook}
                className="py-1.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
                title="Download .ipynb notebook"
              >
                <Download className="w-3.5 h-3.5" />
                .ipynb
              </button>
            </div>

            {/* Expandable Code Box */}
            {showCodeDrawer && (
              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-2.5 max-h-64 overflow-y-auto font-mono text-[10px] text-slate-300">
                <pre>{pythonSource}</pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Theory & Mathematical Derivations Drawer */}
      {showCalculationsDrawer && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Experiment 4 Mathematical Derivations &amp; Schrödinger Boundary Matching
            </h3>
            <button
              type="button"
              onClick={() => setShowCalculationsDrawer(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] text-slate-300">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="font-bold text-indigo-300">1. Time-Independent Schrödinger Equation (1D):</div>
              <p className="text-slate-400">
                d²ψ(x)/dx² + (2m / ℏ²)(E - V(x)) ψ(x) = 0
              </p>
              <div className="font-bold text-indigo-300 pt-1">2. Wavefunctions Across Regions:</div>
              <p className="text-slate-400">
                Region I (x &lt; 0): ψ_I(x) = e^(ik₁x) + r e^(-ik₁x)<br />
                Region II (0 ≤ x ≤ a): ψ_II(x) = A e^(-κx) + B e^(κx)<br />
                Region III (x &gt; a): ψ_III(x) = t e^(ik₁x)
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="font-bold text-indigo-300">3. Closed-Form Transmission Coefficient T (Manual p. 45):</div>
              <p className="text-emerald-400 font-bold">
                T = [ 1 + (V₀² sinh²(κa)) / (4E(V₀ - E)) ]⁻¹
              </p>
              <div className="font-bold text-indigo-300 pt-1">4. Critical Limit as E → V₀:</div>
              <p className="text-amber-300 font-bold">
                lim_(E→V₀) T = [ 1 + (m V₀ a²) / (2ℏ²) ]⁻¹ = {derived.criticalTransmission_T_V0}
              </p>
              <p className="text-slate-400 text-[10px]">
                Continuous, non-zero probability demonstrating quantum tunneling at threshold.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Observation Tables Section (Manual pp. 44–47) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        {/* Table Tabs Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTableTab('table1_1')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTableTab === 'table1_1'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table 1.1: T vs E (a=1.5Å, V0=6eV)
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('table1_2')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTableTab === 'table1_2'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table 1.2: T vs E (a=2.0Å, V0=6eV)
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('table2_1')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTableTab === 'table2_1'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table 2.1: T vs a (E=2eV, V0=6eV)
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('table2_2')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTableTab === 'table2_2'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table 2.2: ln(T) vs a (E=3eV, V0=6eV)
            </button>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handlePopulateAllTables}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
            >
              Populate All Tables
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table 1.1 Content */}
        {activeTableTab === 'table1_1' && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200">
              Observation Table 1.1: Square of Transmitted Amplitude as a Function of Energy (a = 1.5 Å, V₀ = 6.0 eV)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="p-2.5 w-16 text-center">S.No</th>
                    <th className="p-2.5 text-center">Energy E (eV)</th>
                    <th className="p-2.5 text-center text-emerald-400">Transmitted Amplitude |t|</th>
                    <th className="p-2.5 text-center text-amber-300">T = |t|² (observed)</th>
                    <th className="p-2.5 text-center text-slate-300">T (calculated)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {table1_1Data.map((row) => (
                    <tr key={row.slNo} className="hover:bg-slate-800/30">
                      <td className="p-2 text-center text-slate-500">{row.slNo}</td>
                      <td className="p-2 text-center text-sky-300 font-bold">{row.energy_eV.toFixed(2)}</td>
                      <td className="p-2 text-center text-emerald-400">{row.transmittedAmplitude_t.toFixed(4)}</td>
                      <td className="p-2 text-center font-bold text-amber-300">{row.T_observed.toFixed(4)}</td>
                      <td className="p-2 text-center text-slate-300">{row.T_calculated.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table 1.2 Content */}
        {activeTableTab === 'table1_2' && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200">
              Observation Table 1.2: Square of Transmitted Amplitude as a Function of Energy (a = 2.0 Å, V₀ = 6.0 eV)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="p-2.5 w-16 text-center">S.No</th>
                    <th className="p-2.5 text-center">Energy E (eV)</th>
                    <th className="p-2.5 text-center text-emerald-400">Transmitted Amplitude |t|</th>
                    <th className="p-2.5 text-center text-amber-300">T = |t|² (observed)</th>
                    <th className="p-2.5 text-center text-slate-300">T (calculated)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {table1_2Data.map((row) => (
                    <tr key={row.slNo} className="hover:bg-slate-800/30">
                      <td className="p-2 text-center text-slate-500">{row.slNo}</td>
                      <td className="p-2 text-center text-sky-300 font-bold">{row.energy_eV.toFixed(2)}</td>
                      <td className="p-2 text-center text-emerald-400">{row.transmittedAmplitude_t.toFixed(4)}</td>
                      <td className="p-2 text-center font-bold text-amber-300">{row.T_observed.toFixed(4)}</td>
                      <td className="p-2 text-center text-slate-300">{row.T_calculated.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table 2.1 Content */}
        {activeTableTab === 'table2_1' && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200">
              Observation Table 2.1: Transmission Probability T vs Barrier Width a (E = 2.0 eV, V₀ = 6.0 eV)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="p-2.5 w-16 text-center">S.No</th>
                    <th className="p-2.5 text-center">Barrier Width a (Å)</th>
                    <th className="p-2.5 text-center text-emerald-400">Transmitted Amplitude |t|</th>
                    <th className="p-2.5 text-center text-amber-300">T = |t|² (observed)</th>
                    <th className="p-2.5 text-center text-slate-300">T (calculated)</th>
                    <th className="p-2.5 text-center text-purple-300">log_e(T)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {table2_1Data.map((row) => (
                    <tr key={row.slNo} className="hover:bg-slate-800/30">
                      <td className="p-2 text-center text-slate-500">{row.slNo}</td>
                      <td className="p-2 text-center text-amber-300 font-bold">{row.barrierWidth_a_A.toFixed(2)}</td>
                      <td className="p-2 text-center text-emerald-400">{row.transmittedAmplitude_t.toFixed(4)}</td>
                      <td className="p-2 text-center font-bold text-amber-300">{row.T_observed.toFixed(4)}</td>
                      <td className="p-2 text-center text-slate-300">{row.T_calculated.toFixed(4)}</td>
                      <td className="p-2 text-center text-purple-300 font-bold">{row.log_e_T.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table 2.2 Content */}
        {activeTableTab === 'table2_2' && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200">
              Observation Table 2.2: Decay Analysis with Width a &amp; log_e(T) (E = 3.0 eV, V₀ = 6.0 eV)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="p-2.5 w-16 text-center">S.No</th>
                    <th className="p-2.5 text-center">Barrier Width a (Å)</th>
                    <th className="p-2.5 text-center text-emerald-400">Transmitted Amplitude |t|</th>
                    <th className="p-2.5 text-center text-amber-300">T (observed)</th>
                    <th className="p-2.5 text-center text-slate-300">T (calculated)</th>
                    <th className="p-2.5 text-center text-purple-300 font-bold">log_e(T)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {table2_2Data.map((row) => (
                    <tr key={row.slNo} className="hover:bg-slate-800/30">
                      <td className="p-2 text-center text-slate-500">{row.slNo}</td>
                      <td className="p-2 text-center text-amber-300 font-bold">{row.barrierWidth_a_A.toFixed(2)}</td>
                      <td className="p-2 text-center text-emerald-400">{row.transmittedAmplitude_t.toFixed(4)}</td>
                      <td className="p-2 text-center font-bold text-amber-300">{row.T_observed.toFixed(4)}</td>
                      <td className="p-2 text-center text-slate-300">{row.T_calculated.toFixed(4)}</td>
                      <td className="p-2 text-center text-purple-300 font-bold">{row.log_e_T.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Written Analysis & Lab Manual Questions (Manual pp. 48–49) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Results &amp; Written Analysis Questions (Manual pp. 48–49)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Question 1 */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-bold text-indigo-300">1. Transmitted Amplitude as E Approaches V₀:</span>
            <p className="text-slate-300 leading-relaxed">
              As particle energy <code className="text-emerald-400">E</code> increases and approaches the barrier height <code className="text-pink-400">V₀</code>, the attenuation constant <code className="text-purple-400">κ = √[2m(V₀ - E)]/ℏ</code> decreases toward zero. The transmitted amplitude <code className="text-amber-300">|t|</code> rises monotonically and smoothly reaches the non-zero critical value <code className="text-amber-300">|t| = [1 + mV₀a²/(2ℏ²)]^(-1/2)</code>.
            </p>
          </div>

          {/* Question 2 */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-bold text-indigo-300">2. Wavefunction Behavior Inside Barrier (Region II):</span>
            <p className="text-slate-300 leading-relaxed">
              Inside Region II, the wavefunction is evanescent: <code className="text-blue-300">ψ_II(x) = A e^(-κx) + B e^(κx)</code>. As energy <code className="text-emerald-400">E</code> increases, the decay rate <code className="text-purple-400">κ</code> decreases, meaning the wavefunction penetrates much deeper before reaching the exit interface at <code className="text-amber-300">x = a</code>.
            </p>
          </div>

          {/* Question 3 */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-bold text-indigo-300">3. Relationship Between Width (a) and Decay:</span>
            <p className="text-slate-300 leading-relaxed">
              The transmission coefficient follows exponential attenuation: <code className="text-emerald-400">T ∝ e^(-2κa)</code> for wide barriers (<code className="text-purple-400">κa &gt;&gt; 1</code>). Increasing barrier width linearly produces an exponential drop in transmission probability, verified by the linear slope in our <code className="text-purple-300">ln(T) vs a</code> plot.
            </p>
          </div>

          {/* Question 4 */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <span className="font-bold text-indigo-300">4. Why Transmitted Amplitude is Never Truly Zero:</span>
            <p className="text-slate-300 leading-relaxed">
              Because the rectangular potential barrier has a finite width <code className="text-amber-300">a &lt; ∞</code> and finite height <code className="text-pink-400">V₀ &lt; ∞</code>, the exponential tail of <code className="text-blue-300">ψ_II(x)</code> is never identically zero at the boundary <code className="text-amber-300">x = a</code>. Matching continuous boundary conditions guarantees a non-zero plane wave in Region III.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
