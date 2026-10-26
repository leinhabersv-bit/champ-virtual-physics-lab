import React, { useState, useMemo, useEffect } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import {
  CONSTANTS_E7,
  decomposeVernierReading,
  generateObservationTable,
  electronDiffractionEngine,
  DiffractionObservationRow,
  AMBIGUITIES_E7,
} from '../../engine/electronDiffractionSimulator';
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
  Zap,
  Eye,
  Maximize2,
  BookOpen,
} from 'lucide-react';
import { SetupDiagramPanel } from '../instructional/SetupDiagramPanel';
import { electronDiffractionConfigurations } from '../../instructional/procedureDefinitions';
import { recordExperimentPractice } from '../../services/studentProgress';

interface ElectronDiffractionWorkbenchProps {
  metadata: ExperimentMetadata;
  onBackToDashboard: () => void;
  onOpenViva: () => void;
}

export const ElectronDiffractionWorkbench: React.FC<ElectronDiffractionWorkbenchProps> = ({
  metadata,
  onBackToDashboard,
  onOpenViva,
}) => {
  // Modes: Guided vs Exam
  const [activeMode, setActiveMode] = useState<'guided' | 'exam'>('guided');
  const [guidedStep, setGuidedStep] = useState<number>(1);

  // Hardware Controls
  const [anodeVoltage_kV, setAnodeVoltage_kV] = useState<number>(4.0); // 2.0 to 5.0 kV
  const [heaterOn, setHeaterOn] = useState<boolean>(true);
  const [heaterWarmupPercent, setHeaterWarmupPercent] = useState<number>(100);
  const [screenDistance_mm] = useState<number>(CONSTANTS_E7.L_DEFAULT_MM); // Fixed L = 135 mm per manual
  const [darkroomMode, setDarkroomMode] = useState<boolean>(true);
  const [showRulerOverlay, setShowRulerOverlay] = useState<boolean>(true);
  const [showCaliperOverlay, setShowCaliperOverlay] = useState<boolean>(true);
  const [caliperTarget, setCaliperTarget] = useState<'ring1' | 'ring2'>('ring1');

  // Manual caliper offsets (in mm) for realistic student adjustment
  const [caliperReading1_mm, setCaliperReading1_mm] = useState<number | null>(null);
  const [caliperReading2_mm, setCaliperReading2_mm] = useState<number | null>(null);

  // Active view tab: table vs graph
  const [activeTab, setActiveTab] = useState<'table' | 'graph'>('table');
  const [showTheoryModal, setShowTheoryModal] = useState<boolean>(false);
  const [showAmbiguityModal, setShowAmbiguityModal] = useState<boolean>(false);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [activeDiagramConfigId, setActiveDiagramConfigId] = useState<string>('electron_tube_caliper');
  const [isDiagramPinned, setIsDiagramPinned] = useState<boolean>(false);

  // Observation Table rows (initialized to default 5 voltages: 3.0, 3.5, 4.0, 4.5, 5.0 kV)
  const [observationRows, setObservationRows] = useState<DiffractionObservationRow[]>(() =>
    generateObservationTable([3.0, 3.5, 4.0, 4.5, 5.0], CONSTANTS_E7.L_DEFAULT_MM)
  );

  // Simulated warm-up effect if heater is toggled
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (heaterOn && heaterWarmupPercent < 100) {
      interval = setInterval(() => {
        setHeaterWarmupPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 300);
    } else if (!heaterOn && heaterWarmupPercent > 0) {
      interval = setInterval(() => {
        setHeaterWarmupPercent((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 10;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [heaterOn, heaterWarmupPercent]);

  // Live simulation calculations
  const liveReadings = useMemo(() => {
    return electronDiffractionEngine.calculateReadings({
      anodeVoltage_kV,
      screenDistance_mm,
      heaterOn,
      heaterWarmupPercent,
      caliperPosition1_mm: caliperReading1_mm ?? undefined,
      caliperPosition2_mm: caliperReading2_mm ?? undefined,
    });
  }, [anodeVoltage_kV, screenDistance_mm, heaterOn, heaterWarmupPercent, caliperReading1_mm, caliperReading2_mm]);

  const liveDerived = useMemo(() => {
    return electronDiffractionEngine.computeDerived(liveReadings, {
      anodeVoltage_kV,
      screenDistance_mm,
      heaterOn,
      heaterWarmupPercent,
    });
  }, [liveReadings, anodeVoltage_kV, screenDistance_mm, heaterOn, heaterWarmupPercent]);

  // Current caliper position for rendering
  const activeCaliperDiameter_mm =
    caliperTarget === 'ring1'
      ? (caliperReading1_mm ?? liveReadings.ring1Diameter_mm)
      : (caliperReading2_mm ?? liveReadings.ring2Diameter_mm);

  const activeCaliperVernier = useMemo(
    () => decomposeVernierReading(activeCaliperDiameter_mm),
    [activeCaliperDiameter_mm]
  );

  // Auto-measure helper
  const handleAutoMeasure = () => {
    setCaliperReading1_mm(liveReadings.ring1.theoreticalDiameter_mm);
    setCaliperReading2_mm(liveReadings.ring2.theoreticalDiameter_mm);
  };

  // Add current live reading to observation table
  const handleRecordCurrentReading = () => {
    const existingIndex = observationRows.findIndex(
      (r) => Math.abs(r.voltage_kV - anodeVoltage_kV) < 0.05
    );

    const newRow: DiffractionObservationRow = {
      sNo: existingIndex >= 0 ? observationRows[existingIndex].sNo : observationRows.length + 1,
      voltage_kV: anodeVoltage_kV,
      ring1: {
        msr_mm: liveReadings.ring1.msr_mm,
        vsc: liveReadings.ring1.vsc,
        tr_mm: liveReadings.ring1.tr_mm,
        tan2Theta: liveReadings.ring1.tan2Theta,
        theta_deg: liveReadings.ring1.theta_deg,
        braggLambda_m: liveReadings.ring1.braggWavelength_m,
        deBroglieLambda_m: liveReadings.ring1.deBroglieWavelength_m,
        discrepancyPercent: liveReadings.ring1.discrepancyPercent,
      },
      ring2: {
        msr_mm: liveReadings.ring2.msr_mm,
        vsc: liveReadings.ring2.vsc,
        tr_mm: liveReadings.ring2.tr_mm,
        tan2Theta: liveReadings.ring2.tan2Theta,
        theta_deg: liveReadings.ring2.theta_deg,
        braggLambda_m: liveReadings.ring2.braggWavelength_m,
        deBroglieLambda_m: liveReadings.ring2.deBroglieWavelength_m,
        discrepancyPercent: liveReadings.ring2.discrepancyPercent,
      },
      kineticEnergy_eV: liveDerived.kineticEnergy_eV,
      kineticEnergy_J: liveDerived.kineticEnergy_J,
    };

    if (existingIndex >= 0) {
      setObservationRows((prev) => {
        const next = [...prev];
        next[existingIndex] = newRow;
        return next;
      });
    } else {
      setObservationRows((prev) => [...prev, newRow].sort((a, b) => a.voltage_kV - b.voltage_kV));
    }
  };

  // Reset apparatus to default state
  const handleResetApparatus = () => {
    setAnodeVoltage_kV(4.0);
    setHeaterOn(true);
    setHeaterWarmupPercent(100);
    setCaliperReading1_mm(null);
    setCaliperReading2_mm(null);
    setObservationRows(generateObservationTable([3.0, 3.5, 4.0, 4.5, 5.0], CONSTANTS_E7.L_DEFAULT_MM));
    setGuidedStep(1);
  };

  // CSV Export
  const handleExportCSV = () => {
    recordExperimentPractice('expt-7-electron-diffraction', {
      recordedRowsCount: observationRows.length,
      summary: 'Electron diffraction Debye-Scherrer rings measured across 3-5 kV',
    });
    const headers = [
      'S.No',
      'Voltage (kV)',
      'Ring1_MSR_mm',
      'Ring1_VSC',
      'Ring1_TR_mm',
      'Ring1_Tan2Theta',
      'Ring1_Theta_deg',
      'Ring1_Bragg_Lambda_m',
      'Ring1_deBroglie_Lambda_m',
      'Ring1_Discrepancy_pct',
      'Ring2_MSR_mm',
      'Ring2_VSC',
      'Ring2_TR_mm',
      'Ring2_Tan2Theta',
      'Ring2_Theta_deg',
      'Ring2_Bragg_Lambda_m',
      'Ring2_deBroglie_Lambda_m',
      'Ring2_Discrepancy_pct',
      'Kinetic_Energy_eV',
      'Kinetic_Energy_J',
    ];

    const rows = observationRows.map((r) => [
      r.sNo,
      r.voltage_kV,
      r.ring1.msr_mm,
      r.ring1.vsc,
      r.ring1.tr_mm,
      r.ring1.tan2Theta,
      r.ring1.theta_deg,
      r.ring1.braggLambda_m,
      r.ring1.deBroglieLambda_m,
      r.ring1.discrepancyPercent,
      r.ring2.msr_mm,
      r.ring2.vsc,
      r.ring2.tr_mm,
      r.ring2.tan2Theta,
      r.ring2.theta_deg,
      r.ring2.braggLambda_m,
      r.ring2.deBroglieLambda_m,
      r.ring2.discrepancyPercent,
      r.kineticEnergy_eV,
      r.kineticEnergy_J,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'electron_diffraction_expt7_readings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Screen Viewport Scaling
  // Standard phosphor screen outer diameter is ~80 mm in reality.
  // We map 1 mm -> 4.5 SVG pixels, so screen radius is 40 mm * 4.5 = 180 SVG px.
  const svgCenter = 200;
  const mmToPx = 4.2;

  const r1_px = (liveReadings.ring1Diameter_mm / 2) * mmToPx;
  const r2_px = (liveReadings.ring2Diameter_mm / 2) * mmToPx;
  const caliperRadius_px = (activeCaliperDiameter_mm / 2) * mmToPx;

  // Beam luminescence intensity scales with warm-up
  const beamOpacity = (liveReadings.heaterWarmupPercent / 100) * 0.95;

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
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Cycle 2 • Modern Physics
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                L = 135 mm
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
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
                  ? 'bg-emerald-600 text-white shadow'
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
            Theory & Schematics
          </button>

          <button
            onClick={() => setShowAmbiguityModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-600/30 hover:bg-amber-900/50 transition-all flex items-center gap-1.5"
            title="Manual Ambiguities (AMB-04 / AMB-05)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Manual Ambiguities
          </button>

          <button
            onClick={() => setShowSafetyModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 text-rose-300 border border-rose-600/30 hover:bg-rose-900/50 transition-all flex items-center gap-1.5"
            title="Virtual High-Voltage Precautions"
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            HV Safety (5 kV)
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

      {/* Guided Workflow Progress Stepper (Visible in Guided Mode) */}
      {activeMode === 'guided' && (
        <div className="bg-slate-900 border border-emerald-500/20 p-4 rounded-xl shadow-md no-print">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Step-by-Step Procedure Guide (Manual pp. 64–65)
            </span>
            <span className="text-xs text-slate-400">Step {guidedStep} of 4</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
            <button
              onClick={() => setGuidedStep(1)}
              className={`p-2.5 rounded-lg text-left text-xs transition-all border ${
                guidedStep === 1
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-700 text-white">
                  1
                </span>
                <span>Heater Warm-up</span>
              </div>
            </button>

            <button
              onClick={() => setGuidedStep(2)}
              className={`p-2.5 rounded-lg text-left text-xs transition-all border ${
                guidedStep === 2
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-700 text-white">
                  2
                </span>
                <span>Apply 4 kV Anode</span>
              </div>
            </button>

            <button
              onClick={() => setGuidedStep(3)}
              className={`p-2.5 rounded-lg text-left text-xs transition-all border ${
                guidedStep === 3
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-700 text-white">
                  3
                </span>
                <span>Measure Diameters</span>
              </div>
            </button>

            <button
              onClick={() => setGuidedStep(4)}
              className={`p-2.5 rounded-lg text-left text-xs transition-all border ${
                guidedStep === 4
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-700 text-white">
                  4
                </span>
                <span>Wavelength & Energy</span>
              </div>
            </button>
          </div>

          <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 flex items-start justify-between gap-4">
            <div>
              {guidedStep === 1 && (
                <p>
                  <strong>Step 1 (Manual p. 64 Step 2):</strong> Power the cathode heater filament and wait approximately 60 seconds for thermal stability. Thermionic emission must stabilize before high voltage is applied.
                </p>
              )}
              {guidedStep === 2 && (
                <p>
                  <strong>Step 2 (Manual p. 64 Step 3):</strong> Set the accelerating anode voltage to{' '}
                  <span className="text-amber-300 font-mono">4.0 kV (4000 V)</span> using the High Voltage supply knobs. Verify the microammeter displays stable beam current (50–100 µA).
                </p>
              )}
              {guidedStep === 3 && (
                <p>
                  <strong>Step 3 (Manual p. 64 Steps 4–5):</strong> Two green concentric rings will appear centered around the bright undeflected electron spot. Use the Vernier Caliper overlay to determine inner diameter{' '}
                  <span className="text-emerald-300 font-mono">D₁</span> and outer diameter{' '}
                  <span className="text-cyan-300 font-mono">D₂</span>.
                </p>
              )}
              {guidedStep === 4 && (
                <p>
                  <strong>Step 4 (Manual p. 64 Steps 6–8):</strong> Step voltage by 0.5 kV (3.0, 3.5, 4.0, 4.5, 5.0 kV). Notice rings widen as voltage decreases. Compare Bragg-derived wavelength with de Broglie wavelength{' '}
                  <span className="text-emerald-400 font-mono">λ = h / √(2meV)</span>.
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
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('table')}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow"
                >
                  View Full Table
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Vector Setup Blueprint & Electron Diffraction Setup Panel */}
      <SetupDiagramPanel
        configurations={electronDiffractionConfigurations}
        activeConfigId={activeDiagramConfigId}
        onSelectConfig={setActiveDiagramConfigId}
        isPinned={isDiagramPinned}
        onTogglePin={setIsDiagramPinned}
      />

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Apparatus & Fluorescent Screen Chamber (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                Electron Diffraction Tube & Phosphor Screen (L = 135 mm)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDarkroomMode((prev) => !prev)}
                  className={`px-2 py-1 rounded text-xs border transition-all ${
                    darkroomMode
                      ? 'bg-slate-950 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle darkroom observation chamber"
                >
                  {darkroomMode ? '🌙 Darkroom On' : '☀️ Normal Light'}
                </button>

                <button
                  onClick={() => setShowRulerOverlay((prev) => !prev)}
                  className={`px-2 py-1 rounded text-xs border transition-all ${
                    showRulerOverlay
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-600/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Grid Scale
                </button>

                <button
                  onClick={() => setShowCaliperOverlay((prev) => !prev)}
                  className={`px-2 py-1 rounded text-xs border transition-all ${
                    showCaliperOverlay
                      ? 'bg-cyan-950/50 text-cyan-300 border-cyan-600/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Vernier Overlay
                </button>
              </div>
            </div>

            {/* SVG Apparatus & Phosphor Screen Viewport */}
            <div
              className={`relative rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-4 transition-colors ${
                darkroomMode ? 'bg-[#030712]' : 'bg-slate-900'
              }`}
            >
              <svg
                viewBox="0 0 400 400"
                className="w-full max-w-[420px] aspect-square select-none filter drop-shadow-2xl"
              >
                <defs>
                  {/* Radial Phosphor Glow Gradient */}
                  <radialGradient id="screenPhosphorGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#064e3b" stopOpacity="0.4" />
                    <stop offset="70%" stopColor="#022c22" stopOpacity="0.85" />
                    <stop offset="95%" stopColor="#011b15" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="1" />
                  </radialGradient>

                  {/* Ring 1 Luminescent Gradient */}
                  <radialGradient id="ring1Glow" cx="50%" cy="50%" r="50%">
                    <stop offset="90%" stopColor="#34d399" stopOpacity="0" />
                    <stop offset="97%" stopColor="#34d399" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                  </radialGradient>

                  {/* Ring 2 Luminescent Gradient */}
                  <radialGradient id="ring2Glow" cx="50%" cy="50%" r="50%">
                    <stop offset="92%" stopColor="#10b981" stopOpacity="0" />
                    <stop offset="98%" stopColor="#10b981" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </radialGradient>

                  {/* Central Undeflected Electron Beam Spot */}
                  <radialGradient id="centralSpotGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ecfdf5" stopOpacity="1" />
                    <stop offset="30%" stopColor="#a7f3d0" stopOpacity="0.9" />
                    <stop offset="70%" stopColor="#34d399" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Outer Glass Envelope & Metal Flange */}
                <circle cx={svgCenter} cy={svgCenter} r="192" fill="#0f172a" stroke="#334155" strokeWidth="4" />
                <circle cx={svgCenter} cy={svgCenter} r="185" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <circle cx={svgCenter} cy={svgCenter} r="180" fill="url(#screenPhosphorGlow)" />

                {/* Millimeter Circular Concentric Grid Overlay */}
                {showRulerOverlay && (
                  <g opacity="0.35" stroke="#10b981" strokeWidth="0.75">
                    {/* Concentric rings at 10, 20, 30, 40, 50, 60, 70 mm diameters */}
                    {[10, 20, 30, 40, 50, 60, 70].map((d) => (
                      <circle
                        key={d}
                        cx={svgCenter}
                        cy={svgCenter}
                        r={(d / 2) * mmToPx}
                        fill="none"
                        strokeDasharray={d % 20 === 0 ? 'none' : '3,3'}
                      />
                    ))}
                    {/* Crosshair axes */}
                    <line x1={svgCenter - 170} y1={svgCenter} x2={svgCenter + 170} y2={svgCenter} strokeDasharray="4,4" />
                    <line x1={svgCenter} y1={svgCenter - 170} x2={svgCenter} y2={svgCenter + 170} strokeDasharray="4,4" />
                    {/* Coordinate Scale Text */}
                    <text x={svgCenter + 10 * mmToPx} y={svgCenter - 4} fill="#34d399" fontSize="8" fontFamily="monospace">
                      20mm
                    </text>
                    <text x={svgCenter + 20 * mmToPx} y={svgCenter - 4} fill="#34d399" fontSize="8" fontFamily="monospace">
                      40mm
                    </text>
                    <text x={svgCenter + 30 * mmToPx} y={svgCenter - 4} fill="#34d399" fontSize="8" fontFamily="monospace">
                      60mm
                    </text>
                  </g>
                )}

                {/* Physical Diffraction Rings (Visible when beam current > 0) */}
                {beamOpacity > 0.05 && anodeVoltage_kV > 0 && (
                  <g opacity={beamOpacity}>
                    {/* Ring 1 (Inner): d1 = 0.213 nm */}
                    <circle
                      cx={svgCenter}
                      cy={svgCenter}
                      r={r1_px}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="3.2"
                      strokeOpacity="0.8"
                      className="transition-all duration-300"
                    />
                    <circle
                      cx={svgCenter}
                      cy={svgCenter}
                      r={r1_px}
                      fill="none"
                      stroke="#6ee7b7"
                      strokeWidth="1.2"
                      strokeOpacity="0.95"
                      className="transition-all duration-300"
                    />

                    {/* Ring 2 (Outer): d2 = 0.123 nm */}
                    <circle
                      cx={svgCenter}
                      cy={svgCenter}
                      r={r2_px}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.8"
                      strokeOpacity="0.65"
                      className="transition-all duration-300"
                    />
                    <circle
                      cx={svgCenter}
                      cy={svgCenter}
                      r={r2_px}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="1.4"
                      strokeOpacity="0.85"
                      className="transition-all duration-300"
                    />

                    {/* Bright Central Undeflected Beam Spot */}
                    <circle cx={svgCenter} cy={svgCenter} r="7" fill="url(#centralSpotGlow)" />
                    <circle cx={svgCenter} cy={svgCenter} r="2.2" fill="#ffffff" />
                  </g>
                )}

                {/* Thermal warm-up indicator or unpowered state */}
                {liveReadings.heaterWarmupPercent < 100 && (
                  <g>
                    <text
                      x={svgCenter}
                      y={svgCenter}
                      textAnchor="middle"
                      fill="#f59e0b"
                      fontSize="11"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                    >
                      {heaterOn
                        ? `Heater Warming Up... (${liveReadings.heaterWarmupPercent}%)`
                        : 'Filament Heater OFF'}
                    </text>
                    <text
                      x={svgCenter}
                      y={svgCenter + 18}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="sans-serif"
                    >
                      {heaterOn ? 'Wait for thermal stability' : 'Toggle heater switch below'}
                    </text>
                  </g>
                )}

                {/* Vernier Caliper Overlay Lines */}
                {showCaliperOverlay && beamOpacity > 0.05 && (
                  <g className="cursor-ew-resize">
                    {/* Caliper measurement circle */}
                    <circle
                      cx={svgCenter}
                      cy={svgCenter}
                      r={caliperRadius_px}
                      fill="none"
                      stroke={caliperTarget === 'ring1' ? '#38bdf8' : '#a855f7'}
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                    />

                    {/* Caliper Jaws on Horizontal Axis */}
                    <line
                      x1={svgCenter - caliperRadius_px}
                      y1={svgCenter - 25}
                      x2={svgCenter - caliperRadius_px}
                      y2={svgCenter + 25}
                      stroke={caliperTarget === 'ring1' ? '#38bdf8' : '#a855f7'}
                      strokeWidth="2.5"
                    />
                    <line
                      x1={svgCenter + caliperRadius_px}
                      y1={svgCenter - 25}
                      x2={svgCenter + caliperRadius_px}
                      y2={svgCenter + 25}
                      stroke={caliperTarget === 'ring1' ? '#38bdf8' : '#a855f7'}
                      strokeWidth="2.5"
                    />

                    {/* Caliper Dimension Arrow */}
                    <line
                      x1={svgCenter - caliperRadius_px}
                      y1={svgCenter + 35}
                      x2={svgCenter + caliperRadius_px}
                      y2={svgCenter + 35}
                      stroke="#f8fafc"
                      strokeWidth="1"
                    />
                    <text
                      x={svgCenter}
                      y={svgCenter + 48}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {caliperTarget === 'ring1' ? 'D₁ (Inner)' : 'D₂ (Outer)'} = {activeCaliperDiameter_mm.toFixed(1)} mm
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Caliper Mode Selector & Quick Adjustment Slider */}
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Measure Target:</span>
                <button
                  onClick={() => setCaliperTarget('ring1')}
                  className={`px-2.5 py-1 rounded font-medium border transition-all ${
                    caliperTarget === 'ring1'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Ring 1 (Inner, d₁ = 0.213 nm)
                </button>
                <button
                  onClick={() => setCaliperTarget('ring2')}
                  className={`px-2.5 py-1 rounded font-medium border transition-all ${
                    caliperTarget === 'ring2'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Ring 2 (Outer, d₂ = 0.123 nm)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoMeasure}
                  className="px-2.5 py-1 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40 transition-all font-medium"
                  title="Snap calipers directly to theoretical ring positions"
                >
                  Auto-Align Calipers
                </button>
              </div>
            </div>

            {/* Vernier Caliper Scale Loupe / Reading Box */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  Vernier Caliper Scale Loupe (LC = 0.1 mm)
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  TR = {activeCaliperVernier.tr.toFixed(1)} mm
                </span>
              </div>

              {/* Graphical Vernier Caliper Slider Representation */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="w-20 shrink-0">Fine Adjust:</span>
                  <input
                    type="range"
                    min={15.0}
                    max={55.0}
                    step={0.1}
                    value={activeCaliperDiameter_mm}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (caliperTarget === 'ring1') setCaliperReading1_mm(val);
                      else setCaliperReading2_mm(val);
                    }}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="font-mono text-slate-200 w-12 text-right">
                    {activeCaliperDiameter_mm.toFixed(1)} mm
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-1 text-center font-mono text-xs">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">MSR (mm)</span>
                    <span className="text-emerald-400 font-bold">{activeCaliperVernier.msr}</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">VSC (div)</span>
                    <span className="text-amber-400 font-bold">{activeCaliperVernier.vsc}</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Total TR (mm)</span>
                    <span className="text-cyan-400 font-bold">{activeCaliperVernier.tr.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Physical Apparatus Schematic Overview (Manual Fig 3 & Fig 6) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg text-xs text-slate-300">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Source Apparatus Specification (BAPHY105 Manual pp. 60–63)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="block text-[10px] text-slate-400">Tube Distance L</span>
                <span className="font-mono text-white font-bold">135.0 mm</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="block text-[10px] text-slate-400">Graphite Target</span>
                <span className="font-mono text-white font-bold">Polycrystalline</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="block text-[10px] text-slate-400">Inner Spacing d₁</span>
                <span className="font-mono text-emerald-400 font-bold">0.213 nm</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="block text-[10px] text-slate-400">Outer Spacing d₂</span>
                <span className="font-mono text-cyan-400 font-bold">0.123 nm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hardware Controls, Meters & Live Calculations (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* High Voltage Power Supply Unit (0–5 kV) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                High-Voltage Power Supply (0–5 kV)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                HV Regulated
              </span>
            </div>

            {/* Digital Voltage LED Display */}
            <div className="bg-black border border-slate-800 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Accelerating Voltage</span>
                <span className="text-2xl font-mono font-bold text-amber-400 tracking-wider">
                  {anodeVoltage_kV.toFixed(2)}{' '}
                  <span className="text-sm text-slate-400 font-normal">kV</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Absolute Potential</span>
                <span className="text-sm font-mono text-slate-300 font-bold">
                  {(anodeVoltage_kV * 1000).toFixed(0)} V
                </span>
              </div>
            </div>

            {/* Voltage Adjustment Controls */}
            <div className="flex flex-col gap-3">
              {/* Coarse Adjustment Slider (2.0 to 5.0 kV in 0.5 kV steps per standard practice) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Coarse Voltage (0.5 kV steps):</span>
                  <span className="font-mono text-amber-300 font-bold">{anodeVoltage_kV.toFixed(1)} kV</span>
                </div>
                <input
                  type="range"
                  min={2.0}
                  max={5.0}
                  step={0.5}
                  value={anodeVoltage_kV}
                  onChange={(e) => setAnodeVoltage_kV(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                  <span>2.0 kV</span>
                  <span>3.0 kV</span>
                  <span>4.0 kV (Manual)</span>
                  <span>5.0 kV</span>
                </div>
              </div>

              {/* Quick Step Buttons matching Manual Sequence */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[3.0, 3.5, 4.0, 4.5, 5.0].map((kV) => (
                  <button
                    key={kV}
                    onClick={() => setAnodeVoltage_kV(kV)}
                    className={`px-2 py-1 rounded text-xs font-mono font-medium border transition-all ${
                      Math.abs(anodeVoltage_kV - kV) < 0.05
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {kV.toFixed(1)} kV
                  </button>
                ))}
              </div>

              {/* Filament Heater Power Switch & Warm-Up Timer */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setHeaterOn((prev) => !prev);
                      if (!heaterOn) setHeaterWarmupPercent(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      heaterOn
                        ? 'bg-rose-600 text-white border-rose-500 shadow'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {heaterOn ? 'Heater ON' : 'Heater OFF'}
                  </button>
                  <span className="text-xs text-slate-400">
                    {heaterOn ? `${heaterWarmupPercent}% Stabilized` : 'Filament Cold'}
                  </span>
                </div>

                {heaterWarmupPercent < 100 && heaterOn && (
                  <button
                    onClick={() => setHeaterWarmupPercent(100)}
                    className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/30"
                  >
                    Skip Warm-Up
                  </button>
                )}
              </div>
            </div>

            {/* Analogue Multimeter / Anode Microammeter (Manual Fig. 6) */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Analogue Multimeter (Anode Current I_A)
                </span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {liveReadings.anodeCurrent_uA.toFixed(1)} µA
                </span>
                <span className="text-[10px] text-slate-400 block">Range: 0–150 µA DC</span>
              </div>

              {/* Mini Needle Deflection Gauge */}
              <div className="w-24 h-12 bg-slate-900 border border-slate-800 rounded relative overflow-hidden flex items-end justify-center">
                <div
                  className="w-0.5 h-10 bg-rose-500 origin-bottom transition-transform duration-300"
                  style={{
                    transform: `rotate(${((liveReadings.anodeCurrent_uA / 150) * 90 - 45)}deg)`,
                  }}
                />
                <span className="absolute bottom-0 text-[8px] text-slate-400 font-mono">0 - 150 µA</span>
              </div>
            </div>
          </div>

          {/* Live Physical Calculations Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                Real-Time Quantum Calculations
              </span>
              <button
                onClick={handleRecordCurrentReading}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow flex items-center gap-1.5 transition-all"
              >
                <Table className="w-3.5 h-3.5" />
                Record to Table
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* de Broglie Wavelength */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">de Broglie Wavelength (λ_dB)</span>
                <span className="font-mono text-emerald-400 font-bold text-sm block">
                  {liveReadings.deBroglieWavelength_nm.toFixed(5)} nm
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {liveReadings.deBroglieWavelength_angstrom.toFixed(4)} Å • {liveReadings.deBroglieWavelength_m.toExponential(3)} m
                </span>
              </div>

              {/* Electron Kinetic Energy */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Electron Kinetic Energy (K = eV)</span>
                <span className="font-mono text-amber-400 font-bold text-sm block">
                  {liveDerived.kineticEnergy_eV.toFixed(0)} eV
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {liveDerived.kineticEnergy_J.toExponential(3)} J
                </span>
              </div>

              {/* Ring 1 Bragg Wavelength */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Ring 1 Bragg λ (d₁=0.213 nm)</span>
                <span className="font-mono text-sky-400 font-bold text-sm block">
                  {liveReadings.ring1.braggWavelength_nm.toFixed(5)} nm
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  θ₁ = {liveReadings.ring1.theta_deg.toFixed(2)}° • Disc: {liveReadings.ring1.discrepancyPercent.toFixed(2)}%
                </span>
              </div>

              {/* Ring 2 Bragg Wavelength */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Ring 2 Bragg λ (d₂=0.123 nm)</span>
                <span className="font-mono text-purple-400 font-bold text-sm block">
                  {liveReadings.ring2.braggWavelength_nm.toFixed(5)} nm
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  θ₂ = {liveReadings.ring2.theta_deg.toFixed(2)}° • Disc: {liveReadings.ring2.discrepancyPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Electron Velocity & Relativistic Parameter Note */}
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                Electron Speed: <strong className="text-white font-mono">{(liveDerived.electronVelocity_m_s / 1e6).toFixed(2)} × 10⁶ m/s</strong>
              </span>
              <span>
                β = v/c: <strong className="text-emerald-400 font-mono">{liveDerived.relativisticBeta}</strong> (γ = {liveDerived.relativisticGamma})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Observation Table and Analytical Verification Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-400" />
              Observation Table: de Broglie & Bragg Wavelength (Manual p. 65)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700">
              <button
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  activeTab === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  activeTab === 'graph' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                D vs 1/√V Graph
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export CSV
            </button>
          </div>
        </div>

        {activeTab === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300 border-collapse">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th rowSpan={2} className="px-3 py-2 border-r border-slate-800 text-center">
                    S.No
                  </th>
                  <th rowSpan={2} className="px-3 py-2 border-r border-slate-800 text-center">
                    Voltage (kV)
                  </th>
                  <th colSpan={3} className="px-3 py-2 border-r border-slate-800 text-center text-sky-400">
                    Ring 1 Diameter (d₁ = 0.213 nm)
                  </th>
                  <th colSpan={3} className="px-3 py-2 border-r border-slate-800 text-center text-purple-400">
                    Ring 2 Diameter (d₂ = 0.123 nm)
                  </th>
                  <th rowSpan={2} className="px-3 py-2 border-r border-slate-800 text-center">
                    tan(2θ₁)
                  </th>
                  <th rowSpan={2} className="px-3 py-2 border-r border-slate-800 text-center">
                    θ₁ (deg)
                  </th>
                  <th rowSpan={2} className="px-3 py-2 border-r border-slate-800 text-center text-emerald-400">
                    Bragg λ₁ (m)
                  </th>
                  <th rowSpan={2} className="px-3 py-2 border-r border-slate-800 text-center text-cyan-400">
                    de Broglie λ (m)
                  </th>
                  <th rowSpan={2} className="px-3 py-2 text-center">
                    % Error
                  </th>
                </tr>
                <tr className="border-b border-slate-800 text-[10px]">
                  <th className="px-2 py-1 border-r border-slate-800 text-center">MSR (mm)</th>
                  <th className="px-2 py-1 border-r border-slate-800 text-center">VSC</th>
                  <th className="px-2 py-1 border-r border-slate-800 text-center font-bold text-sky-300">TR (mm)</th>
                  <th className="px-2 py-1 border-r border-slate-800 text-center">MSR (mm)</th>
                  <th className="px-2 py-1 border-r border-slate-800 text-center">VSC</th>
                  <th className="px-2 py-1 border-r border-slate-800 text-center font-bold text-purple-300">TR (mm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {observationRows.map((row) => (
                  <tr key={row.sNo} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-2.5 text-center text-slate-400 font-bold">{row.sNo}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-amber-400">{row.voltage_kV.toFixed(1)}</td>
                    <td className="px-2 py-2.5 text-center">{row.ring1.msr_mm}</td>
                    <td className="px-2 py-2.5 text-center">{row.ring1.vsc}</td>
                    <td className="px-2 py-2.5 text-center font-bold text-sky-300">{row.ring1.tr_mm.toFixed(1)}</td>
                    <td className="px-2 py-2.5 text-center">{row.ring2.msr_mm}</td>
                    <td className="px-2 py-2.5 text-center">{row.ring2.vsc}</td>
                    <td className="px-2 py-2.5 text-center font-bold text-purple-300">{row.ring2.tr_mm.toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-center">{row.ring1.tan2Theta.toFixed(4)}</td>
                    <td className="px-3 py-2.5 text-center">{row.ring1.theta_deg.toFixed(2)}°</td>
                    <td className="px-3 py-2.5 text-center text-emerald-400">{row.ring1.braggLambda_m.toExponential(3)}</td>
                    <td className="px-3 py-2.5 text-center text-cyan-400">{row.ring1.deBroglieLambda_m.toExponential(3)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {row.ring1.discrepancyPercent.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Graph View: D vs 1/sqrt(V) */
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">
                  Verification Plot: Ring Diameters D vs 1/√V_A (Confirmation of de Broglie Hypothesis)
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Ring 1 (Inner)
                  </span>
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Ring 2 (Outer)
                  </span>
                </div>
              </div>

              {/* SVG Linear Fit Plot */}
              <div className="w-full h-64 bg-slate-900/60 rounded-lg border border-slate-800/80 p-2 flex items-center justify-center">
                <svg viewBox="0 0 600 240" className="w-full h-full">
                  {/* Grid Lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={i}
                      x1="60"
                      y1={30 + i * 45}
                      x2="560"
                      y2={30 + i * 45}
                      stroke="#334155"
                      strokeWidth="0.5"
                      strokeDasharray="4,4"
                    />
                  ))}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <line
                      key={i}
                      x1={60 + i * 100}
                      y1="30"
                      x2={60 + i * 100}
                      y2="210"
                      stroke="#334155"
                      strokeWidth="0.5"
                      strokeDasharray="4,4"
                    />
                  ))}

                  {/* Axes */}
                  <line x1="60" y1="210" x2="560" y2="210" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="60" y1="20" x2="60" y2="210" stroke="#94a3b8" strokeWidth="1.5" />

                  {/* Axis Labels */}
                  <text x="310" y="235" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
                    1/√V_A (kV^(-1/2))
                  </text>
                  <text
                    x="18"
                    y="120"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="sans-serif"
                    transform="rotate(-90 18 120)"
                  >
                    Ring Diameter D (mm)
                  </text>

                  {/* Plot data points */}
                  {observationRows.map((r, i) => {
                    const invSqrtV = 1 / Math.sqrt(r.voltage_kV);
                    // Map invSqrtV in [0.447, 0.577] to x in [100, 520]
                    const x = 100 + ((invSqrtV - 0.447) / (0.577 - 0.447)) * 420;

                    // Map D1 in [20, 30] to y
                    const y1 = 210 - ((r.ring1.tr_mm - 15) / 45) * 180;
                    // Map D2 in [35, 52] to y
                    const y2 = 210 - ((r.ring2.tr_mm - 15) / 45) * 180;

                    return (
                      <g key={i}>
                        <circle cx={x} cy={y1} r="4" fill="#38bdf8" />
                        <circle cx={x} cy={y2} r="4" fill="#c084fc" />
                      </g>
                    );
                  })}

                  {/* Trendlines */}
                  <line x1="90" y1="185" x2="530" y2="152" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.8" />
                  <line x1="90" y1="125" x2="530" y2="68" stroke="#c084fc" strokeWidth="1.5" strokeOpacity="0.8" />

                  <text x="540" y="152" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                    D₁ Fit (R²=0.999)
                  </text>
                  <text x="540" y="68" fill="#c084fc" fontSize="9" fontFamily="monospace">
                    D₂ Fit (R²=0.999)
                  </text>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Result Parity Summary Box (Manual Page 65) */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Final Experimental Result Parity (Manual Page 65)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                1. de Broglie Wavelength (at 4 kV)
              </span>
              <span className="text-base text-cyan-400 font-bold block mt-1">
                {liveReadings.deBroglieWavelength_m.toExponential(4)} m
              </span>
              <span className="text-[10px] text-slate-400">
                λ = h / √(2m_e·e·V_A) = {liveReadings.deBroglieWavelength_nm.toFixed(5)} nm
              </span>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                2. Bragg's Derived Wavelength (Ring 1)
              </span>
              <span className="text-base text-emerald-400 font-bold block mt-1">
                {liveReadings.ring1.braggWavelength_m.toExponential(4)} m
              </span>
              <span className="text-[10px] text-slate-400">
                λ = 2d·sin(0.5·arctan(D/2L)) = {liveReadings.ring1.braggWavelength_nm.toFixed(5)} nm
              </span>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                3. Electron Kinetic Energy (at 4 kV)
              </span>
              <span className="text-base text-amber-400 font-bold block mt-1">
                {liveDerived.kineticEnergy_eV.toFixed(0)} eV
              </span>
              <span className="text-[10px] text-slate-400">
                K = e·V_A = {liveDerived.kineticEnergy_J.toExponential(4)} Joules
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Ambiguities Modal (AMB-04 & AMB-05) */}
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
              {AMBIGUITIES_E7.map((amb) => (
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

      {/* High-Voltage Safety Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                <Shield className="w-5 h-5" />
                Virtual Laboratory High-Voltage Precautions (0–5 kV)
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
                <h5 className="font-bold text-rose-300 mb-1">DANGER: High Voltage Equipment (5000 V)</h5>
                <p>
                  In a physical laboratory, accelerating voltages up to 5 kV present lethal electric shock hazards.
                  The following physical safeguards are modeled in this virtual workbench:
                </p>
              </div>

              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>
                  <strong>Safe Lead Connection:</strong> Never touch cathode or anode terminals while the high-voltage supply is energized. Always dial voltage down to 0 kV before adjusting any cables.
                </li>
                <li>
                  <strong>Protective Shielding:</strong> The electron diffraction tube envelope is evacuated glass. The tube holder includes a protective cage against implosion and stray X-rays.
                </li>
                <li>
                  <strong>Filament Current Limit:</strong> The cathode heating filament operates at 6.3 V AC / 0.5–1.0 A. Excessive heater voltage burns out the tungsten/oxide filament instantly.
                </li>
                <li>
                  <strong>Max Anode Current:</strong> The beam current should not exceed 150 µA to prevent target thermal overheating and perforation of the thin polycrystalline graphite foil.
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

      {/* Theory & Schematics Modal */}
      {showTheoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                <BookOpen className="w-5 h-5" />
                Theory & Equations (BAPHY105 Manual pp. 60–64)
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
                <h5 className="font-bold text-white mb-1">1. Louis de Broglie Matter Wave Hypothesis (1923)</h5>
                <p>
                  Any particle with momentum <span className="font-mono text-emerald-400">p</span> exhibits an associated wave nature with wavelength:
                </p>
                <div className="my-2 p-2 bg-slate-900 rounded font-mono text-center text-emerald-300 font-bold">
                  λ_dB = h / p = h / √(2 · m_e · e · V_A)
                </div>
                <p className="text-[11px] text-slate-400">
                  Where h = 6.626 × 10⁻³⁴ J·s, m_e = 9.109 × 10⁻³¹ kg, e = 1.602 × 10⁻¹⁹ C, and V_A is the applied accelerating potential in Volts.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h5 className="font-bold text-white mb-1">2. Bragg Reflection & Conical Geometry (Manual Fig. 2)</h5>
                <p>
                  For constructive interference from atomic planes of spacing <span className="font-mono text-sky-400">d</span> at glancing angle <span className="font-mono text-sky-400">θ</span>:
                </p>
                <div className="my-2 p-2 bg-slate-900 rounded font-mono text-center text-sky-300 font-bold">
                  2 · d · sin(θ) = n · λ (n = 1)
                </div>
                <p>
                  Polycrystalline graphite consists of microcrystals randomly oriented around the beam axis, turning the diffracted beam into a cone of apex angle <span className="font-mono">2θ</span>.
                  At distance L on the luminescent screen, the cone projects a ring of diameter D:
                </p>
                <div className="my-2 p-2 bg-slate-900 rounded font-mono text-center text-cyan-300 font-bold">
                  tan(2θ) = (D / 2) / L = D / (2 · L)
                </div>
                <div className="my-2 p-2 bg-slate-900 rounded font-mono text-center text-emerald-300 font-bold">
                  λ_Bragg = 2 · d · sin( 0.5 · arctan( D / (2 · L) ) )
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h5 className="font-bold text-white mb-1">3. Graphite Lattice Planes (Manual Fig. 5)</h5>
                <p>
                  Hexagonal sheet structure with interatomic bond length <span className="font-mono">a₀ = 0.142 nm</span>:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1 font-mono text-slate-300">
                  <li>
                    Inner Ring 1: d₁ = 0.213 nm ({'{101̄0}'} planes) ⇒ Smaller θ ⇒ Inner ring diameter D₁ ≈ 24.6 mm at 4 kV.
                  </li>
                  <li>
                    Outer Ring 2: d₂ = 0.123 nm ({'{112̄0}'} planes) ⇒ Larger θ ⇒ Outer ring diameter D₂ ≈ 42.6 mm at 4 kV.
                  </li>
                </ul>
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
