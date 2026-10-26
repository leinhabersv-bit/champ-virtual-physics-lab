import React, { useState, useMemo } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import {
  CONSTANTS_E8,
  calculateMinimaPositions,
  generateTable1Scan,
  generateTable2Orders,
  generateTable3Uncertainty,
  heisenbergEngine,
  MicrometerScanRow,
  SlitWidthOrderRow,
  UncertaintyVerificationRow,
  AMBIGUITIES_E8,
} from '../../engine/heisenbergSimulator';
import {
  ArrowLeft,
  Printer,
  Compass,
  Award,
  HelpCircle,
  Calculator,
  Download,
  Table,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Shield,
  Activity,
  Eye,
  Maximize2,
  BookOpen,
} from 'lucide-react';
import { SetupDiagramPanel } from '../instructional/SetupDiagramPanel';
import { heisenbergConfigurations } from '../../instructional/procedureDefinitions';
import { recordExperimentPractice } from '../../services/studentProgress';

interface HeisenbergWorkbenchProps {
  metadata: ExperimentMetadata;
  onBackToDashboard: () => void;
  onOpenViva: () => void;
}

export const HeisenbergWorkbench: React.FC<HeisenbergWorkbenchProps> = ({
  metadata,
  onBackToDashboard,
  onOpenViva,
}) => {
  // Modes: Guided vs Exam
  const [activeMode, setActiveMode] = useState<'guided' | 'exam'>('guided');
  const [guidedStep, setGuidedStep] = useState<number>(1);

  // Hardware Controls
  const [slitWidth_um, setSlitWidth_um] = useState<number>(40.0); // 40, 80, 120 µm or custom
  const [screenDistance_D_mm, setScreenDistance_D_mm] = useState<number>(1000.0); // 600 to 1400 mm
  const [wavelength_nm] = useState<number>(CONSTANTS_E8.DEFAULT_WAVELENGTH_NM); // Fixed 650 nm red laser
  const [micrometerPos_mm, setMicrometerPos_mm] = useState<number>(0.0); // -25.0 to +25.0 mm
  const [laserOn, setLaserOn] = useState<boolean>(true);
  const [laserAligned, setLaserAligned] = useState<boolean>(true);
  const [ambientLight, setAmbientLight] = useState<'normal' | 'dark'>('dark');

  // Active view tab: Table 1 vs Table 2 vs Table 3 vs Graph
  const [activeTab, setActiveTab] = useState<'table1' | 'table2' | 'table3' | 'graph'>('graph');
  const [showTheoryModal, setShowTheoryModal] = useState<boolean>(false);
  const [showAmbiguityModal, setShowAmbiguityModal] = useState<boolean>(false);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [activeDiagramConfigId, setActiveDiagramConfigId] = useState<string>('single_slit_bench');
  const [isDiagramPinned, setIsDiagramPinned] = useState<boolean>(false);

  // Observation Tables State
  const [table1Rows, setTable1Rows] = useState<MicrometerScanRow[]>(() =>
    generateTable1Scan(40.0, 1000.0, 15.0, 1.0, 650.0)
  );

  const [table2Rows, setTable2Rows] = useState<SlitWidthOrderRow[]>(() =>
    generateTable2Orders(40.0, 1000.0, 650.0)
  );

  const [table3Rows, setTable3Rows] = useState<UncertaintyVerificationRow[]>(() =>
    generateTable3Uncertainty([40.0, 80.0, 120.0], 1000.0, 650.0)
  );

  React.useEffect(() => {
    recordExperimentPractice(metadata.id, {
      completedSteps: [guidedStep],
      recordedRowsCount: table1Rows.length + table2Rows.length + table3Rows.length,
    });
  }, [metadata.id, guidedStep, table1Rows.length, table2Rows.length, table3Rows.length]);

  // Live simulation calculations
  const liveReadings = useMemo(() => {
    return heisenbergEngine.calculateReadings({
      slitWidth_um,
      wavelength_nm,
      screenDistance_mm: screenDistance_D_mm,
      micrometerPos_mm,
      laserAligned: laserOn && laserAligned,
    });
  }, [slitWidth_um, wavelength_nm, screenDistance_D_mm, micrometerPos_mm, laserOn, laserAligned]);

  const liveDerived = useMemo(() => {
    return heisenbergEngine.computeDerived(liveReadings, {
      slitWidth_um,
      wavelength_nm,
      screenDistance_mm: screenDistance_D_mm,
      micrometerPos_mm,
      laserAligned: laserOn && laserAligned,
    });
  }, [liveReadings, slitWidth_um, wavelength_nm, screenDistance_D_mm, micrometerPos_mm, laserOn, laserAligned]);

  // Model curve points for intensity graph
  const curvePoints = useMemo(() => {
    return heisenbergEngine.generateModelCurve({
      slitWidth_um,
      wavelength_nm,
      screenDistance_mm: screenDistance_D_mm,
      micrometerPos_mm: 0,
      laserAligned: true,
    }, 140);
  }, [slitWidth_um, wavelength_nm, screenDistance_D_mm]);

  // Current minima coordinates
  const minimaInfo = useMemo(() => {
    return calculateMinimaPositions(slitWidth_um, screenDistance_D_mm, wavelength_nm);
  }, [slitWidth_um, screenDistance_D_mm, wavelength_nm]);

  // Auto-scan micrometer and fill Table 1
  const handleAutoScanProfile = () => {
    const scanned = generateTable1Scan(slitWidth_um, screenDistance_D_mm, 15.0, 1.0, wavelength_nm);
    setTable1Rows(scanned);
  };

  // Record current manual point to Table 1
  const handleRecordCurrentPoint = () => {
    const existingIndex = table1Rows.findIndex(
      (r) => Math.abs(r.micrometerReading_mm - micrometerPos_mm) < 0.1
    );
    const newPoint: MicrometerScanRow = {
      slNo: existingIndex >= 0 ? table1Rows[existingIndex].slNo : table1Rows.length + 1,
      micrometerReading_mm: Number(micrometerPos_mm.toFixed(1)),
      outputCurrent_uA: liveReadings.intensity_uA,
    };

    if (existingIndex >= 0) {
      setTable1Rows((prev) => {
        const next = [...prev];
        next[existingIndex] = newPoint;
        return next;
      });
    } else {
      setTable1Rows((prev) =>
        [...prev, newPoint].sort((a, b) => a.micrometerReading_mm - b.micrometerReading_mm)
      );
    }
  };

  // Recalculate Table 2 from current slit
  const handleUpdateTable2 = () => {
    setTable2Rows(generateTable2Orders(slitWidth_um, screenDistance_D_mm, wavelength_nm));
  };

  // Reset Apparatus
  const handleResetApparatus = () => {
    setSlitWidth_um(40.0);
    setScreenDistance_D_mm(1000.0);
    setMicrometerPos_mm(0.0);
    setLaserOn(true);
    setLaserAligned(true);
    setTable1Rows(generateTable1Scan(40.0, 1000.0, 15.0, 1.0, 650.0));
    setTable2Rows(generateTable2Orders(40.0, 1000.0, 650.0));
    setTable3Rows(generateTable3Uncertainty([40.0, 80.0, 120.0], 1000.0, 650.0));
    setGuidedStep(1);
  };

  // CSV Export
  const handleExportCSV = () => {
    let content = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'table1') {
      content += 'Sl.No,Micrometer Reading (mm),Output Current (uA)\n';
      table1Rows.forEach((r) => {
        content += `${r.slNo},${r.micrometerReading_mm},${r.outputCurrent_uA}\n`;
      });
    } else if (activeTab === 'table2') {
      content += 'Order m,Distance D (mm),Distance a (mm),Theta (deg),Sin Theta,Calculated d (um)\n';
      table2Rows.forEach((r) => {
        content += `${r.order_m},${r.distance_D_mm},${r.distance_a_mm},${r.theta_deg},${r.sinTheta},${r.d_calculated_um}\n`;
      });
    } else {
      content += 'Slit Width (um),Distance D (mm),Distance a1 (mm),Theta1 (deg),Delta py (kg*m/s),Dimensionless (d/lambda)*sinTheta,Uncertainty Product (J*s)\n';
      table3Rows.forEach((r) => {
        content += `${r.slitWidth_um},${r.distance_D_mm},${r.distance_a_mm},${r.theta1_deg},${r.delta_p_y_kg_m_s},${r.dimensionlessFactor},${r.uncertaintyProduct_J_s}\n`;
      });
    }

    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `heisenberg_single_slit_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Graph Viewport Dimensions
  const plotWidth = 560;
  const plotHeight = 200;
  const xSpan = 25.0; // -25 mm to +25 mm
  const yMax = 95.0; // max current in µA

  const mapX = (x_mm: number) => 50 + ((x_mm + xSpan) / (2 * xSpan)) * (plotWidth - 70);
  const mapY = (current_uA: number) => plotHeight - 25 - (current_uA / yMax) * (plotHeight - 45);

  const pathD = useMemo(() => {
    return curvePoints
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.x).toFixed(1)} ${mapY(pt.y).toFixed(1)}`)
      .join(' ');
  }, [curvePoints]);

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
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Cycle 2 • Quantum Optics
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                Diode Laser λ = 650 nm
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              Experiment {metadata.number}: {metadata.shortTitle || metadata.title}
            </h1>
          </div>
        </div>

        {/* Mode Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700">
            <button
              onClick={() => setActiveMode('guided')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeMode === 'guided'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Guided Mode
            </button>
            <button
              onClick={() => setActiveMode('exam')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeMode === 'exam'
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
            <HelpCircle className="w-3.5 h-3.5" />
            Viva Voce
          </button>

          <button
            onClick={() => setShowTheoryModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            Theory & Formulas
          </button>

          <button
            onClick={() => setShowAmbiguityModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-600/30 hover:bg-amber-900/50 transition-all flex items-center gap-1.5"
            title="Manual Ambiguities (AMB-06 / AMB-07)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Source Ambiguities
          </button>

          <button
            onClick={() => setShowSafetyModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 text-rose-300 border border-rose-600/30 hover:bg-rose-900/50 transition-all flex items-center gap-1.5"
            title="Laser Eye Safety Precautions"
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            Laser Safety
          </button>

          <button
            onClick={handleResetApparatus}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all"
            title="Reset All Controls"
            aria-label="Reset All Controls"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all"
            title="Print Worksheet"
            aria-label="Print Worksheet"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guided Progression Stepper (When in Guided Mode) */}
      {activeMode === 'guided' && (
        <div className="bg-slate-900 border border-rose-500/20 p-4 rounded-xl shadow-md no-print">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Guided Procedure Stepper (Manual pp. 69–72)
            </span>
            <span className="text-xs text-slate-400">Step {guidedStep} of 4</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
            <button
              onClick={() => setGuidedStep(1)}
              className={`p-2.5 rounded-lg text-left text-xs transition-all border ${
                guidedStep === 1
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-semibold shadow'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-700 text-white">
                  1
                </span>
                <span>Laser Beam Alignment</span>
              </div>
            </button>

            <button
              onClick={() => setGuidedStep(2)}
              className={`p-2.5 rounded-lg text-left text-xs transition-all border ${
                guidedStep === 2
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-semibold shadow'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-700 text-white">
                  2
                </span>
                <span>Slit Squeezing & Spread</span>
              </div>
            </button>

            <button
              onClick={() => setGuidedStep(3)}
              className={`p-2.5 rounded-lg text-left text-xs transition-all border ${
                guidedStep === 3
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-semibold shadow'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-700 text-white">
                  3
                </span>
                <span>Micrometer Profile Scan</span>
              </div>
            </button>

            <button
              onClick={() => setGuidedStep(4)}
              className={`p-2.5 rounded-lg text-left text-xs transition-all border ${
                guidedStep === 4
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-semibold shadow'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-700 text-white">
                  4
                </span>
                <span>Uncertainty Principle Δy·Δpy</span>
              </div>
            </button>
          </div>

          <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 flex items-start justify-between gap-4">
            <div>
              {guidedStep === 1 && (
                <p>
                  <strong>Step 1 (Manual pp. 69–70):</strong> Mount diode laser and detector on the optical rail. Use the kinematic adjustment screws to center the red beam onto the pinhole detector and verify peak output current (85 µA).
                </p>
              )}
              {guidedStep === 2 && (
                <p>
                  <strong>Step 2 (Manual p. 71):</strong> Mount the single-slit carriage cell on the rail. Squeeze the slit width down from 120 µm to 40 µm. Observe that squeezing the slit causes the diffraction pattern to broaden dramatically!
                </p>
              )}
              {guidedStep === 3 && (
                <p>
                  <strong>Step 3 (Manual pp. 71–73 Table 1):</strong> Scan the micrometer translation stage from left to right across the diffraction pattern. Note the output current at regular intervals to plot the Fraunhofer profile.
                </p>
              )}
              {guidedStep === 4 && (
                <p>
                  <strong>Step 4 (Manual p. 74 Table 3):</strong> Locate first-order minimum <span className="font-mono text-rose-300">a₁</span>. Calculate momentum uncertainty <span className="font-mono text-cyan-300">Δp_y = (h/λ) sin(tan⁻¹(a₁/D))</span> and verify <span className="font-mono text-emerald-400">Δy · Δp_y ≈ h ≥ h/4π</span>.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {guidedStep > 1 && (
                <button
                  onClick={() => setGuidedStep((p) => p - 1)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700"
                >
                  Previous
                </button>
              )}
              {guidedStep < 4 ? (
                <button
                  onClick={() => setGuidedStep((p) => p + 1)}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium shadow"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('table3')}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow"
                >
                  View Table 3
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Diagram & Setup Reference */}
      <SetupDiagramPanel
        configurations={heisenbergConfigurations}
        activeConfigId={activeDiagramConfigId}
        onSelectConfig={setActiveDiagramConfigId}
        isPinned={isDiagramPinned}
        onTogglePin={() => setIsDiagramPinned((prev) => !prev)}
      />

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Optical Bench & Live Pattern Display (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-400" />
                Optical Rail Bench & Pinhole Detector Stage (D = {screenDistance_D_mm.toFixed(0)} mm)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAmbientLight((p) => (p === 'dark' ? 'normal' : 'dark'))}
                  className={`px-2 py-1 rounded text-xs border transition-all ${
                    ambientLight === 'dark'
                      ? 'bg-slate-950 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle ambient lighting"
                >
                  {ambientLight === 'dark' ? '🌙 Darkroom' : '☀️ Lab Light'}
                </button>

                <button
                  onClick={() => setLaserAligned((prev) => !prev)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                    laserAligned
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-600/40'
                      : 'bg-rose-950/60 text-rose-300 border-rose-600/60 animate-pulse'
                  }`}
                  title="Kinematic beam alignment status"
                >
                  {laserAligned ? '✓ Beam Aligned' : '⚠ Misaligned'}
                </button>
              </div>
            </div>

            {/* SVG Optical Rail Simulation */}
            <div
              className={`relative rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center p-3 transition-colors ${
                ambientLight === 'dark' ? 'bg-[#030712]' : 'bg-slate-900'
              }`}
            >
              <svg viewBox="0 0 540 220" className="w-full max-w-[540px] select-none filter drop-shadow-xl">
                <defs>
                  {/* Laser Red Beam Linear Glow */}
                  <linearGradient id="laserBeamGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
                  </linearGradient>

                  {/* Red Central Fringe Glow */}
                  <radialGradient id="fringeCentralGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fee2e2" stopOpacity="1" />
                    <stop offset="20%" stopColor="#ef4444" stopOpacity="0.9" />
                    <stop offset="70%" stopColor="#b91c1c" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Optical Rail Base (Twin parallel steel bars) */}
                <rect x="20" y="170" width="500" height="12" fill="#1e293b" stroke="#334155" strokeWidth="1.5" rx="3" />
                <rect x="20" y="185" width="500" height="10" fill="#0f172a" stroke="#1e293b" strokeWidth="1" rx="2" />
                {/* Millimeter scale tick marks along rail */}
                {[0, 100, 200, 300, 400, 500].map((tick) => (
                  <line
                    key={tick}
                    x1={30 + tick * 0.96}
                    y1="170"
                    x2={30 + tick * 0.96}
                    y2="175"
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                ))}

                {/* Left: Diode Laser Mount (x = 40) */}
                <rect x="35" y="110" width="28" height="60" fill="#334155" stroke="#475569" strokeWidth="1.5" rx="2" />
                {/* Laser Cylindrical Head */}
                <rect x="45" y="90" width="40" height="22" fill="#1e293b" stroke="#475569" strokeWidth="1.5" rx="3" />
                <circle cx="85" cy="101" r="5" fill="#ef4444" />
                <text x="50" y="150" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                  LASER
                </text>

                {/* Center: Single Slit Carriage (x = 180) */}
                <rect x="175" y="100" width="16" height="70" fill="#334155" stroke="#475569" strokeWidth="1.5" rx="2" />
                {/* Circular Slit Cell Housing */}
                <circle cx="183" cy="101" r="16" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                {/* Vertical Slit Aperture */}
                <line x1="183" y1="91" x2="183" y2="111" stroke="#38bdf8" strokeWidth={Math.max(1, slitWidth_um / 40)} />
                <text x="165" y="150" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                  SLIT d={slitWidth_um}µm
                </text>

                {/* Right: Photodetector on Translation Stage (x = 440) */}
                <rect x="430" y="95" width="24" height="75" fill="#334155" stroke="#475569" strokeWidth="1.5" rx="2" />
                {/* Detector Circular Ring with Pinhole */}
                <circle cx="442" cy="101" r="18" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                {/* Moving pinhole scanning indicator */}
                <circle
                  cx={442 + (micrometerPos_mm / 25) * 12}
                  cy="101"
                  r="2.5"
                  fill="#facc15"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                {/* Micrometer Thimble Knob on side */}
                <rect x="454" y="115" width="22" height="10" fill="#475569" stroke="#94a3b8" strokeWidth="1" rx="2" />
                <text x="415" y="150" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                  DETECTOR D={screenDistance_D_mm}mm
                </text>

                {/* Active Laser Beam Lines */}
                {laserOn && laserAligned && (
                  <g>
                    {/* Beam from laser to slit */}
                    <line x1="85" y1="101" x2="183" y2="101" stroke="#ef4444" strokeWidth="2.5" strokeOpacity="0.85" />
                    {/* Diffracted conical fan from slit to detector plane */}
                    <polygon
                      points={`183,101 442,${101 - (minimaInfo.a1_mm * 1.8)} 442,${101 + (minimaInfo.a1_mm * 1.8)}`}
                      fill="#ef4444"
                      fillOpacity="0.22"
                    />
                    <polygon
                      points={`183,101 442,${101 - (minimaInfo.a2_mm * 1.8)} 442,${101 + (minimaInfo.a2_mm * 1.8)}`}
                      fill="#ef4444"
                      fillOpacity="0.08"
                    />
                    <line x1="183" y1="101" x2="442" y2="101" stroke="#fca5a5" strokeWidth="1.5" strokeOpacity="0.9" />
                  </g>
                )}

                {/* Projected Diffraction Pattern Band (At Top of Screen y = 30) */}
                <rect x="180" y="18" width="300" height="42" fill="#020617" stroke="#1e293b" strokeWidth="1.5" rx="4" />
                {laserOn && laserAligned && (
                  <g>
                    {/* Central maximum band */}
                    <rect
                      x={330 - (minimaInfo.a1_mm * 2.5)}
                      y="23"
                      width={minimaInfo.a1_mm * 5.0}
                      height="32"
                      fill="url(#fringeCentralGlow)"
                    />
                    {/* Side secondary maxima */}
                    <rect
                      x={330 + (minimaInfo.a1_mm * 2.5)}
                      y="27"
                      width={(minimaInfo.a2_mm - minimaInfo.a1_mm) * 2.0}
                      height="24"
                      fill="#ef4444"
                      fillOpacity="0.35"
                    />
                    <rect
                      x={330 - (minimaInfo.a2_mm * 2.5)}
                      y="27"
                      width={(minimaInfo.a2_mm - minimaInfo.a1_mm) * 2.0}
                      height="24"
                      fill="#ef4444"
                      fillOpacity="0.35"
                    />
                    {/* Detector Scanning Cursor Overlay */}
                    <line
                      x1={330 + (micrometerPos_mm * 5.0)}
                      y1="16"
                      x2={330 + (micrometerPos_mm * 5.0)}
                      y2="62"
                      stroke="#facc15"
                      strokeWidth="2"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={330 + (micrometerPos_mm * 5.0)}
                      y="14"
                      textAnchor="middle"
                      fill="#facc15"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      y = {micrometerPos_mm.toFixed(1)}mm ({liveReadings.intensity_uA.toFixed(1)}µA)
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Translation Stage Micrometer Fine Controls */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-yellow-400" />
                  Detector Translation Micrometer (y = {micrometerPos_mm.toFixed(1)} mm)
                </span>
                <span className="font-mono text-yellow-300 font-bold">
                  I = {liveReadings.intensity_uA.toFixed(2)} µA
                </span>
              </div>

              {/* Slider for micrometer position */}
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="w-16 shrink-0">-25.0 mm</span>
                <input
                  type="range"
                  min={-25.0}
                  max={25.0}
                  step={0.5}
                  value={micrometerPos_mm}
                  onChange={(e) => setMicrometerPos_mm(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
                <span className="w-16 shrink-0 text-right">+25.0 mm</span>
              </div>

              {/* Quick Stepping Buttons & Capture Action */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setMicrometerPos_mm((p) => Math.max(-25, p - 1.0))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700 font-mono"
                  >
                    -1.0mm
                  </button>
                  <button
                    onClick={() => setMicrometerPos_mm((p) => Math.max(-25, p - 0.1))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700 font-mono"
                  >
                    -0.1mm
                  </button>
                  <button
                    onClick={() => setMicrometerPos_mm(0.0)}
                    className="px-2.5 py-1 bg-rose-600/30 text-rose-300 hover:bg-rose-600/40 rounded border border-rose-500/40 font-mono font-semibold"
                  >
                    Center (0.0)
                  </button>
                  <button
                    onClick={() => setMicrometerPos_mm((p) => Math.min(25, p + 0.1))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700 font-mono"
                  >
                    +0.1mm
                  </button>
                  <button
                    onClick={() => setMicrometerPos_mm((p) => Math.min(25, p + 1.0))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700 font-mono"
                  >
                    +1.0mm
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRecordCurrentPoint}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium shadow flex items-center gap-1"
                  >
                    <Table className="w-3.5 h-3.5" />
                    Record Point
                  </button>
                  <button
                    onClick={handleAutoScanProfile}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700"
                  >
                    Auto-Scan Table 1
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Slit Controls, Digital Measurement Unit & Quantum Uncertainty Cards (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Slit Selection & Distance Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <SlidersIcon className="w-4 h-4 text-cyan-400" />
                Slit Aperture & Rail Parameters
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Aperture Cell
              </span>
            </div>

            {/* Slit Width Presets (Manual pp. 73-74 specifies different slits: 40 µm, 80 µm, 120 µm) */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-400">Slit Width Preset d (Δy):</span>
              <div className="grid grid-cols-3 gap-2">
                {[40.0, 80.0, 120.0].map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setSlitWidth_um(w);
                      setTable2Rows(generateTable2Orders(w, screenDistance_D_mm, wavelength_nm));
                    }}
                    className={`p-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                      slitWidth_um === w
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {w} µm
                  </button>
                ))}
              </div>

              {/* Continuous Slit Width Slider */}
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Fine Slit Width:</span>
                  <span className="font-mono text-rose-400 font-bold">{slitWidth_um.toFixed(1)} µm</span>
                </div>
                <input
                  type="range"
                  min={20.0}
                  max={160.0}
                  step={5.0}
                  value={slitWidth_um}
                  onChange={(e) => {
                    const w = parseFloat(e.target.value);
                    setSlitWidth_um(w);
                    setTable2Rows(generateTable2Orders(w, screenDistance_D_mm, wavelength_nm));
                  }}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-400"
                />
              </div>

              {/* Rail Distance D slider */}
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Slit-to-Detector Distance D:</span>
                  <span className="font-mono text-cyan-400 font-bold">{screenDistance_D_mm.toFixed(0)} mm</span>
                </div>
                <input
                  type="range"
                  min={600.0}
                  max={1400.0}
                  step={50.0}
                  value={screenDistance_D_mm}
                  onChange={(e) => {
                    const d = parseFloat(e.target.value);
                    setScreenDistance_D_mm(d);
                    setTable2Rows(generateTable2Orders(slitWidth_um, d, wavelength_nm));
                  }}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Digital Output Measurement Unit (Manual Photograph p. 70) */}
            <div className="bg-black border border-slate-800 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Digital Output Measurement Unit
                </span>
                <span className="text-2xl font-mono font-bold text-rose-500 tracking-wider">
                  {liveReadings.intensity_uA.toFixed(2)}{' '}
                  <span className="text-sm text-slate-400 font-normal">µA</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">1st Minima Distance a₁</span>
                <span className="text-sm font-mono text-amber-300 font-bold">
                  {minimaInfo.a1_mm.toFixed(2)} mm
                </span>
              </div>
            </div>
          </div>

          {/* Real-Time Heisenberg Uncertainty Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Uncertainty Principle Verification (Δy · Δp_y = h)
              </span>
              <button
                onClick={handleUpdateTable2}
                className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 hover:text-white"
              >
                Sync Table 2
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {/* Position Uncertainty */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Position Uncertainty (Δy = d)</span>
                <span className="text-emerald-400 font-bold text-sm block">
                  {liveDerived.delta_y_um.toFixed(1)} µm
                </span>
                <span className="text-[10px] text-slate-400">{liveDerived.delta_y_m.toExponential(3)} m</span>
              </div>

              {/* Momentum Uncertainty */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Momentum Uncertainty (Δp_y)</span>
                <span className="text-cyan-400 font-bold text-sm block">
                  {liveDerived.delta_p_y_kg_m_s.toExponential(3)}
                </span>
                <span className="text-[10px] text-slate-400">kg·m/s (θ₁ = {liveReadings.theta_m_deg.toFixed(2)}°)</span>
              </div>

              {/* Product Delta y * Delta p_y */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Product (Δy · Δp_y)</span>
                <span className="text-amber-400 font-bold text-sm block">
                  {liveDerived.uncertaintyProduct.toExponential(4)}
                </span>
                <span className="text-[10px] text-slate-400">J·s (≈ h = 6.626 × 10⁻³⁴)</span>
              </div>

              {/* Dimensionless Verification Factor */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Ratio to Planck h (Manual eq. 11)</span>
                <span className="text-purple-400 font-bold text-sm block">
                  {liveDerived.ratioToPlanckConstant.toFixed(4)}
                </span>
                <span className="text-[10px] text-slate-400">
                  (d/λ)·sin(θ₁) = {liveDerived.dimensionlessTest.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Quantum Lower Limit Callout */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span className="text-[11px]">
                Kennard Bound: <span className="font-mono text-emerald-400">h / (4π) = 5.27 × 10⁻³⁵ J·s</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-bold">
                {liveDerived.ratioToHeisenbergLimit.toFixed(1)} × Bound ✓
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Observation Tables & Graph Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-rose-400" />
              Observations & Calculations (Manual pp. 73–74)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700">
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  activeTab === 'graph' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Intensity Graph
              </button>
              <button
                onClick={() => setActiveTab('table1')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  activeTab === 'table1' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Table 1: Profile Scan
              </button>
              <button
                onClick={() => setActiveTab('table2')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  activeTab === 'table2' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Table 2: Slit Width
              </button>
              <button
                onClick={() => setActiveTab('table3')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  activeTab === 'table3' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Table 3: Uncertainty Verification
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Tab Content Rendering */}
        {activeTab === 'graph' && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">
                  Fraunhofer Diffraction Intensity Profile: Current I (µA) vs Micrometer Position y (mm)
                </span>
                <span className="text-xs font-mono text-slate-400">
                  d = {slitWidth_um} µm • a₁ = ±{minimaInfo.a1_mm.toFixed(2)} mm
                </span>
              </div>

              {/* SVG Live Intensity Plot */}
              <div className="w-full h-64 bg-slate-900/60 rounded-lg border border-slate-800/80 p-2 flex items-center justify-center">
                <svg viewBox={`0 0 ${plotWidth} ${plotHeight}`} className="w-full h-full select-none">
                  {/* Grid Lines */}
                  {[-20, -10, 0, 10, 20].map((x) => (
                    <line
                      key={x}
                      x1={mapX(x)}
                      y1="10"
                      x2={mapX(x)}
                      y2={plotHeight - 25}
                      stroke="#334155"
                      strokeWidth="0.5"
                      strokeDasharray="3,3"
                    />
                  ))}
                  {[0, 20, 40, 60, 80].map((y) => (
                    <line
                      key={y}
                      x1="50"
                      y1={mapY(y)}
                      x2={plotWidth - 20}
                      y2={mapY(y)}
                      stroke="#334155"
                      strokeWidth="0.5"
                      strokeDasharray="3,3"
                    />
                  ))}

                  {/* Axes */}
                  <line x1="50" y1={plotHeight - 25} x2={plotWidth - 20} y2={plotHeight - 25} stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1={mapX(0)} y1="10" x2={mapX(0)} y2={plotHeight - 25} stroke="#64748b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="50" y1="10" x2="50" y2={plotHeight - 25} stroke="#94a3b8" strokeWidth="1.5" />

                  {/* Axis Labels */}
                  <text x={plotWidth / 2} y={plotHeight - 5} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
                    Micrometer Reading y (mm)
                  </text>
                  <text
                    x="18"
                    y={plotHeight / 2}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="sans-serif"
                    transform={`rotate(-90 18 ${plotHeight / 2})`}
                  >
                    Output Current (µA)
                  </text>

                  {/* Tick Numbers */}
                  {[-20, -10, 0, 10, 20].map((x) => (
                    <text key={x} x={mapX(x)} y={plotHeight - 12} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
                      {x}
                    </text>
                  ))}
                  {[0, 40, 80].map((y) => (
                    <text key={y} x="42" y={mapY(y) + 3} textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
                      {y}
                    </text>
                  ))}

                  {/* Fraunhofer Curve Path */}
                  <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2.5" />

                  {/* First Minima Marker Lines */}
                  <line
                    x1={mapX(minimaInfo.a1_mm)}
                    y1={mapY(0)}
                    x2={mapX(minimaInfo.a1_mm)}
                    y2={mapY(30)}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                  <line
                    x1={mapX(-minimaInfo.a1_mm)}
                    y1={mapY(0)}
                    x2={mapX(-minimaInfo.a1_mm)}
                    y2={mapY(30)}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                  <text x={mapX(minimaInfo.a1_mm)} y={mapY(33)} textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="monospace">
                    +a₁ ({minimaInfo.a1_mm.toFixed(1)})
                  </text>
                  <text x={mapX(-minimaInfo.a1_mm)} y={mapY(33)} textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="monospace">
                    -a₁
                  </text>

                  {/* Active Micrometer Cursor Dot */}
                  <circle cx={mapX(micrometerPos_mm)} cy={mapY(liveReadings.intensity_uA)} r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'table1' && (
          /* Table 1: Micrometer reading versus output current (Manual p. 73) */
          <div className="flex flex-col gap-3">
            <span className="text-xs text-slate-400">
              Table 1: Scanning micrometer position to plot diffraction intensity profile (Manual p. 73)
            </span>
            <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2 border-r border-slate-800 text-center">Sl.No</th>
                    <th className="px-4 py-2 border-r border-slate-800 text-center">Micrometer Reading (mm)</th>
                    <th className="px-4 py-2 text-center text-rose-400">Output Current (µA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {table1Rows.map((r) => (
                    <tr key={r.slNo} className="hover:bg-slate-800/40">
                      <td className="px-4 py-2 text-center text-slate-400">{r.slNo}</td>
                      <td className="px-4 py-2 text-center font-bold text-white">{r.micrometerReading_mm.toFixed(1)}</td>
                      <td className="px-4 py-2 text-center text-rose-400">{r.outputCurrent_uA.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'table2' && (
          /* Table 2: Multi-order minima to find slit width (Manual p. 73) */
          <div className="flex flex-col gap-3">
            <span className="text-xs text-slate-400">
              Table 2: Distance between central maximum and m^th order minima (λ = 650 nm, Manual p. 73)
            </span>
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 border-r border-slate-800 text-center">Order m</th>
                    <th className="px-3 py-2.5 border-r border-slate-800 text-center">Distance D (mm)</th>
                    <th className="px-3 py-2.5 border-r border-slate-800 text-center text-amber-300">Minima a (mm)</th>
                    <th className="px-3 py-2.5 border-r border-slate-800 text-center">θ_m = tan⁻¹(a/D)</th>
                    <th className="px-3 py-2.5 border-r border-slate-800 text-center">sin(θ_m)</th>
                    <th className="px-3 py-2.5 text-center text-cyan-300">d = m·λ / sin(θ_m) (µm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {table2Rows.map((r) => (
                    <tr key={r.order_m} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 text-center font-bold text-slate-400">{r.order_m}</td>
                      <td className="px-3 py-2.5 text-center">{r.distance_D_mm.toFixed(0)}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-amber-300">{r.distance_a_mm.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-center">{r.theta_deg.toFixed(3)}°</td>
                      <td className="px-3 py-2.5 text-center">{r.sinTheta.toFixed(5)}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-cyan-400">{r.d_calculated_um.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mean Slit Width Result Banner */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Mean Slit Width d = <strong className="text-cyan-400">{(table2Rows.reduce((a, b) => a + b.d_calculated_um, 0) / table2Rows.length).toFixed(1)} µm</strong>
              </span>
              <span className="text-slate-400">
                In Millimeters = <strong className="text-emerald-400">{((table2Rows.reduce((a, b) => a + b.d_calculated_um, 0) / table2Rows.length) * 1e-3).toFixed(4)} mm</strong>
              </span>
            </div>
          </div>
        )}

        {activeTab === 'table3' && (
          /* Table 3: Verifying Uncertainty Principle across multiple slits (Manual p. 74) */
          <div className="flex flex-col gap-3">
            <span className="text-xs text-slate-400">
              Table 3: Verifying Heisenberg's Uncertainty Principle quantitatively (Manual p. 74)
            </span>
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 border-r border-slate-800 text-center">Slit Width d (µm)</th>
                    <th className="px-3 py-2.5 border-r border-slate-800 text-center">Distance D (mm)</th>
                    <th className="px-3 py-2.5 border-r border-slate-800 text-center text-amber-300">Minima a₁ (mm)</th>
                    <th className="px-3 py-2.5 border-r border-slate-800 text-center">θ₁ = tan⁻¹(a/D)</th>
                    <th className="px-3 py-2.5 border-r border-slate-800 text-center text-cyan-300">Δp_y (kg·m/s)</th>
                    <th className="px-3 py-2.5 border-r border-slate-800 text-center text-purple-400">(d/λ)·sin(θ₁)</th>
                    <th className="px-3 py-2.5 text-center text-emerald-400">Δy · Δp_y (J·s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {table3Rows.map((r) => (
                    <tr key={r.slitWidth_um} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 text-center font-bold text-white">{r.slitWidth_um}</td>
                      <td className="px-3 py-2.5 text-center">{r.distance_D_mm.toFixed(0)}</td>
                      <td className="px-3 py-2.5 text-center text-amber-300">{r.distance_a_mm.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-center">{r.theta1_deg.toFixed(3)}°</td>
                      <td className="px-3 py-2.5 text-center text-cyan-300">{r.delta_p_y_kg_m_s.toExponential(3)}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-purple-400">{r.dimensionlessFactor.toFixed(4)}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-emerald-400">{r.uncertaintyProduct_J_s.toExponential(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Final Results & Theoretical Insight (Manual p. 74) */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Experimental Findings & Insight (Manual p. 74 Results)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-300">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
              <span className="font-bold text-white">1. Slit Widths from Minima:</span>
              <p className="text-slate-400">
                Diffraction patterns from different single slits were mapped and evaluated using{' '}
                <span className="font-mono text-cyan-300">d = m·λ / sin(θ_m)</span>, confirming high accuracy against optical microscopic tolerances.
              </p>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
              <span className="font-bold text-white">2. Quantum Uncertainty Principle Confirmed:</span>
              <p className="text-slate-400">
                As slit width <span className="font-mono text-rose-300">d (Δy)</span> decreases, transverse momentum distribution{' '}
                <span className="font-mono text-cyan-300">Δp_y</span> increases proportionally, holding the product{' '}
                <span className="font-mono text-emerald-400">Δy · Δp_y ≈ h ≥ h/4π</span> strictly invariant!
              </p>
            </div>
          </div>

          <div className="bg-rose-950/30 border border-rose-500/20 p-3 rounded-lg text-xs italic text-rose-200">
            "When you try to make the light to travel straight by squeezing it refuses to cooperate and start to spread out more... example of uncertainty principle." — (Manual p. 74)
          </div>
        </div>
      </div>

      {/* Manual Ambiguities Modal (AMB-06 & AMB-07) */}
      {showAmbiguityModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                Source Manual Ambiguities & Engineering Resolutions
              </div>
              <button
                onClick={() => setShowAmbiguityModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
              {AMBIGUITIES_E8.map((amb) => (
                <div key={amb.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px]">
                      {amb.id}
                    </span>
                    <span className="text-slate-400 text-[10px]">{amb.sourceLocation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Source Manual Text:</span>
                    <blockquote className="italic text-amber-200/90 border-l-2 border-amber-500 pl-2 mt-0.5 font-mono">
                      "{amb.sourceText}"
                    </blockquote>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-rose-400 block">Identified Inconsistency:</span>
                    <p className="text-slate-300">{amb.issue}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 block">Engineering Solution:</span>
                    <p className="text-slate-300">{amb.engineeringFix}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAmbiguityModal(false)}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-all shadow"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Laser Safety Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                <Shield className="w-5 h-5" />
                Diode Laser Safety Precautions (Class 2 / 3R, 650 nm)
              </div>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3 leading-relaxed text-slate-300">
              <div className="bg-rose-950/40 border border-rose-600/30 p-3 rounded-xl">
                <h5 className="font-bold text-rose-300 mb-1">CAUTION: Direct Laser Radiation Hazard</h5>
                <p>
                  This laboratory utilizes a 650 nm red semiconductor diode laser. Even at low power (3–5 mW),
                  direct specular ocular exposure causes retinal burns.
                </p>
              </div>

              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>
                  <strong>Never look directly into the laser aperture:</strong> Keep eyes above the plane of the optical rail at all times.
                </li>
                <li>
                  <strong>Diffuse Viewing:</strong> Observe the beam spot and diffraction pattern solely via diffuse reflections on the detector pinhole or matte projection cards.
                </li>
                <li>
                  <strong>Remove Reflective Objects:</strong> Avoid wearing watches, rings, or reflective tools while aligning the beam.
                </li>
                <li>
                  <strong>Optical Rail Alignment:</strong> Ensure the beam is terminated safely by the detector carriage at the end of the rail.
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowSafetyModal(false)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-all shadow"
              >
                Acknowledge Safety Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theory & Formulas Modal */}
      {showTheoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                <BookOpen className="w-5 h-5" />
                Single-Slit Uncertainty Theory (Manual pp. 66–68)
              </div>
              <button
                onClick={() => setShowTheoryModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-slate-300">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h5 className="font-bold text-white mb-1">1. Diffraction Minima Condition</h5>
                <p>
                  Destructive interference occurs when path difference across the aperture equals an integer number of wavelengths:
                </p>
                <div className="my-2 p-2 bg-slate-900 rounded font-mono text-center text-cyan-300 font-bold">
                  d · sin(θ_m) = m · λ ⇒ d = m · λ / sin(θ_m)
                </div>
                <p className="text-[11px] text-slate-400">
                  Where θ_m = arctan(a_m / D) measured from central maximum to m-th minimum.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h5 className="font-bold text-white mb-1">2. Heisenberg Principle via Diffraction</h5>
                <p>
                  Before entering the slit, photons possess definite momentum p_x = h / λ along the x-axis, but indeterminate transverse position y.
                  Confining position by passing through slit width d imparts position uncertainty:
                </p>
                <div className="my-2 p-2 bg-slate-900 rounded font-mono text-center text-emerald-300 font-bold">
                  Δy = d
                </div>
                <p>
                  Diffraction bends photons into a transverse momentum distribution with maximum angle θ₁:
                </p>
                <div className="my-2 p-2 bg-slate-900 rounded font-mono text-center text-amber-300 font-bold">
                  Δp_y = p_x · sin(θ₁) = (h / λ) · sin(arctan(a₁ / D))
                </div>
                <div className="my-2 p-2 bg-slate-900 rounded font-mono text-center text-rose-300 font-bold">
                  Δy · Δp_y = d · (h / λ) · sin(θ₁) = h · [(d / λ) · sin(θ₁)] ≈ h
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowTheoryModal(false)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-all shadow"
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

// Mini internal icon helper for Sliders to avoid lucide import conflicts
function SlidersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
