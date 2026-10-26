import React, { useState, useMemo } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import {
  mercuryGratingEngine,
  MERCURY_SPECTRUM,
  MERCURY_LINE_KEYS,
  SpectralObservationRow,
  TableLineSummary,
} from '../../engine/mercuryGratingEngine';
import {
  Sparkles,
  ArrowLeft,
  Printer,
  Compass,
  Award,
  HelpCircle,
  Calculator,
  Download,
  Table,
  Eye,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { SetupDiagramPanel } from '../instructional/SetupDiagramPanel';
import { mercuryConfigurations } from '../../instructional/procedureDefinitions';
import { recordExperimentPractice } from '../../services/studentProgress';

interface MercurySpectrometerWorkbenchProps {
  metadata: ExperimentMetadata;
  onBackToDashboard: () => void;
  onOpenViva: () => void;
}

export const MercurySpectrometerWorkbench: React.FC<MercurySpectrometerWorkbenchProps> = ({
  metadata,
  onBackToDashboard,
  onOpenViva,
}) => {
  // Mode: Guided vs Exam vs Viva
  const [activeMode, setActiveMode] = useState<'guided' | 'exam' | 'viva'>('guided');
  const [guidedStep, setGuidedStep] = useState<number>(1);

  // Spectrometer Hardware State
  const [lampIsOn, setLampIsOn] = useState<boolean>(true);
  const [slitWidth, setSlitWidth] = useState<number>(1.0); // 0.2 to 2.0 mm
  const [gratingRulingsPerInch, setGratingRulingsPerInch] = useState<number>(15000);
  const [directRayAngle] = useState<number>(180.0); // Direct line axis at 180°
  const [telescopeAngle, setTelescopeAngle] = useState<number>(180.0);
  const [isTelescopeClamped, setIsTelescopeClamped] = useState<boolean>(false);
  const [isNormalIncidenceAligned, setIsNormalIncidenceAligned] = useState<boolean>(true);
  const [showCalculationsDrawer, setShowCalculationsDrawer] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | undefined>(undefined);
  const [activeDiagramConfigId, setActiveDiagramConfigId] = useState<string>('normal_incidence');
  const [isDiagramPinned, setIsDiagramPinned] = useState<boolean>(false);

  // Manual alignment wizard step (1 to 4)
  const [alignStep, setAlignStep] = useState<number>(4);

  // Grating physical element
  const gratingInfo = useMemo(
    () => mercuryGratingEngine.calculateGratingElement(gratingRulingsPerInch),
    [gratingRulingsPerInch]
  );

  // Live Vernier Readings for V1 and V2
  const currentV1 = useMemo(
    () => mercuryGratingEngine.angleToVernierReading(telescopeAngle),
    [telescopeAngle]
  );
  const currentV2 = useMemo(
    () => mercuryGratingEngine.angleToVernierReading(telescopeAngle + 180),
    [telescopeAngle]
  );

  // FOV Lines currently visible through telescope eyepiece
  const fovLines = useMemo(() => {
    if (!lampIsOn) return [];
    return mercuryGratingEngine.getTelescopeFieldOfView(
      telescopeAngle,
      directRayAngle,
      gratingRulingsPerInch,
      4.0 // 4 degree optical FOV
    );
  }, [lampIsOn, telescopeAngle, directRayAngle, gratingRulingsPerInch]);

  // Closest spectral line to vertical crosshair (within 0.3°)
  const centeredLine = useMemo(() => {
    return fovLines.find((line) => Math.abs(line.offsetFromCrosshair_deg) <= 0.35);
  }, [fovLines]);

  // Observations store (Full 8 rows + 4 summaries matching Manual p. 36)
  const [observations, setObservations] = useState<{
    rows: SpectralObservationRow[];
    summaries: TableLineSummary[];
  }>(() => mercuryGratingEngine.generateFullObservationTable(directRayAngle, 15000));

  // Handle fine and coarse telescope adjustments
  const adjustTelescope = (deltaDeg: number) => {
    if (isTelescopeClamped) return;
    setTelescopeAngle((prev) => mercuryGratingEngine.normalizeAngle(prev + deltaDeg));
  };

  // Align telescope directly to a target spectral line or direct ray
  const alignTelescopeTo = (targetDeg: number) => {
    setIsTelescopeClamped(false);
    setTelescopeAngle(mercuryGratingEngine.normalizeAngle(targetDeg));
  };

  // Auto-align normal incidence setup sequence
  const handleAutoAlignNormal = () => {
    setIsNormalIncidenceAligned(true);
    setAlignStep(4);
    setTelescopeAngle(directRayAngle);
  };

  // Auto-measure all 4 lines (Full observation table generation)
  const handleAutoMeasureAll = () => {
    const table = mercuryGratingEngine.generateFullObservationTable(
      directRayAngle,
      gratingRulingsPerInch
    );
    setObservations(table);
    setLastSaved(new Date().toLocaleTimeString());
    recordExperimentPractice('expt-2-mercury-grating', {
      recordedRowsCount: table.rows.length,
      summary: 'Mercury 1st order spectrum recorded for all 4 spectral lines',
    });
  };

  // Record current telescope angle to a specific color and side (left/right)
  const handleRecordCurrentPosition = (colorKey: 'blue' | 'green' | 'yellow' | 'red', side: 'left' | 'right') => {
    setObservations((prev) => {
      const newRows = prev.rows.map((row) => {
        if (row.color === colorKey) {
          if (row.vernier === 'V1') {
            const left = side === 'left' ? currentV1 : row.leftReading;
            const right = side === 'right' ? currentV1 : row.rightReading;
            const diff = mercuryGratingEngine.circularDistance(left.totalReading_deg, right.totalReading_deg);
            const theta = diff / 2;
            return {
              ...row,
              leftReading: left,
              rightReading: right,
              diffractionAngle_2theta_deg: Number(diff.toFixed(4)),
              diffractionAngle_theta_deg: Number(theta.toFixed(4)),
              diffractionAngle_theta_dms: mercuryGratingEngine.decimalToDMS(theta),
            };
          } else {
            const left = side === 'left' ? currentV2 : row.leftReading;
            const right = side === 'right' ? currentV2 : row.rightReading;
            const diff = mercuryGratingEngine.circularDistance(left.totalReading_deg, right.totalReading_deg);
            const theta = diff / 2;
            return {
              ...row,
              leftReading: left,
              rightReading: right,
              diffractionAngle_2theta_deg: Number(diff.toFixed(4)),
              diffractionAngle_theta_deg: Number(theta.toFixed(4)),
              diffractionAngle_theta_dms: mercuryGratingEngine.decimalToDMS(theta),
            };
          }
        }
        return row;
      });

      // Recompute summary for this color
      const rowV1 = newRows.find((r) => r.color === colorKey && r.vernier === 'V1')!;
      const rowV2 = newRows.find((r) => r.color === colorKey && r.vernier === 'V2')!;
      const meanTheta = (rowV1.diffractionAngle_theta_deg + rowV2.diffractionAngle_theta_deg) / 2;
      const meanThetaRad = (meanTheta * Math.PI) / 180;
      const calcLambda_m = gratingInfo.gratingElement_m * Math.sin(meanThetaRad);
      const calcLambda_nm = calcLambda_m * 1e9;
      const calcLambda_Angstrom = calcLambda_m * 1e10;
      const refAngstrom = MERCURY_SPECTRUM[colorKey].lambda_ref_Angstrom;
      const pctError = (Math.abs(calcLambda_Angstrom - refAngstrom) / refAngstrom) * 100;

      const newSummaries = prev.summaries.map((s) => {
        if (s.color === colorKey) {
          return {
            ...s,
            v1_theta_deg: rowV1.diffractionAngle_theta_deg,
            v2_theta_deg: rowV2.diffractionAngle_theta_deg,
            mean_theta_deg: Number(meanTheta.toFixed(4)),
            mean_theta_dms: mercuryGratingEngine.decimalToDMS(meanTheta),
            calculated_lambda_m: calcLambda_m,
            calculated_lambda_nm: Number(calcLambda_nm.toFixed(2)),
            calculated_lambda_Angstrom: Math.round(calcLambda_Angstrom),
            percentageError: Number(pctError.toFixed(2)),
          };
        }
        return s;
      });

      return { rows: newRows, summaries: newSummaries };
    });
    setLastSaved(new Date().toLocaleTimeString());
  };

  // CSV Export for Table
  const handleExportCSV = () => {
    let csv = 'Colour,Vernier,Left_MSR,Left_VSC,Left_TR_deg,Right_MSR,Right_VSC,Right_TR_deg,2Theta_deg,Theta_deg,Theta_DMS,MeanTheta_deg,Calc_Lambda_A,Std_Lambda_A,Error_Pct\n';
    for (const color of MERCURY_LINE_KEYS) {
      const rowsForColor = observations.rows.filter((r) => r.color === color);
      const summary = observations.summaries.find((s) => s.color === color);
      for (const r of rowsForColor) {
        csv += `${r.colorName},${r.vernier},${r.leftReading.msr_deg},${r.leftReading.vsc},${r.leftReading.totalReading_deg},${r.rightReading.msr_deg},${r.rightReading.vsc},${r.rightReading.totalReading_deg},${r.diffractionAngle_2theta_deg},${r.diffractionAngle_theta_deg},"${r.diffractionAngle_theta_dms.formatted}",${summary?.mean_theta_deg ?? ''},${summary?.calculated_lambda_Angstrom ?? ''},${summary?.reference_lambda_Angstrom ?? ''},${summary?.percentageError ?? ''}\n`;
      }
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Experiment2_Mercury_Spectrometer_Observations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Line-by-line calculations for the first color (or active line)
  const sampleColor = observations.summaries[1] || observations.summaries[0]; // Green or Blue

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
                EXPT 02 • BAPHY105
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
          {/* Guided vs Exam switcher */}
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

      {/* Guided Instructions Banner */}
      {activeMode === 'guided' && (
        <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-indigo-200 no-print">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
              {guidedStep}
            </div>
            <div>
              <span className="font-bold text-indigo-100">
                {guidedStep === 1 && 'Step 1: Check Collimator Alignment & Direct Ray (180°)'}
                {guidedStep === 2 && 'Step 2: Normal Incidence Alignment (Grating Element Setup)'}
                {guidedStep === 3 && 'Step 3: Rotate Telescope Left & Right for 1st Order Spectral Lines'}
                {guidedStep === 4 && 'Step 4: Record Verniers V1 and V2 for all 4 Mercury Lines (Table p. 36)'}
              </span>
              <p className="text-indigo-300 text-[11px] mt-0.5">
                {guidedStep === 1 && 'Ensure the mercury lamp is ON and the slit width is clear. The direct zeroth-order image appears at exactly 180°.'}
                {guidedStep === 2 && 'Set telescope to 90° from collimator, turn grating table to 45° reflection, then rotate 45° to achieve normal incidence.'}
                {guidedStep === 3 && 'Rotate the telescope slowly to the left (~16° to 22°) to view Violet/Blue, Green, Yellow, and Red spectral lines on crosshairs.'}
                {guidedStep === 4 && 'Capture Left reading (a) and Right reading (b) for each color. The engine calculates 2θ = |a - b| and λ = (e+d)sinθ.'}
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

      {/* Collapsible Vector Setup Blueprint & Spectrometer Setup Panel */}
      <SetupDiagramPanel
        configurations={mercuryConfigurations}
        activeConfigId={activeDiagramConfigId}
        onSelectConfig={setActiveDiagramConfigId}
        isPinned={isDiagramPinned}
        onTogglePin={setIsDiagramPinned}
      />

      {/* Main Optical Bench & Spectrometer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Spectrometer Vector Apparatus & Eyepiece Reticle (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Spectrometer Header & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                  Optical Spectrometer &amp; Transmission Grating Bench
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs no-print">
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-400">Slit:</span>
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.1"
                    value={slitWidth}
                    onChange={(e) => setSlitWidth(parseFloat(e.target.value))}
                    className="w-14 accent-indigo-500"
                    aria-label="Collimator slit width"
                  />
                  <span className="text-slate-300 font-bold">{slitWidth}mm</span>
                </div>

                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 text-[10px]">
                  {[1, 2, 3, 4].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => {
                        setAlignStep(step);
                        if (step === 1) alignTelescopeTo(180);
                        else if (step === 2) alignTelescopeTo(270);
                        else if (step === 3) setIsNormalIncidenceAligned(false);
                        else if (step === 4) {
                          setIsNormalIncidenceAligned(true);
                          alignTelescopeTo(180);
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded font-mono font-bold transition-all ${
                        alignStep === step
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={`Alignment Step ${step}`}
                    >
                      Step {step}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAutoAlignNormal}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-300 font-medium"
                >
                  Auto-Align Normal (45° Method)
                </button>
                <button
                  type="button"
                  onClick={() => alignTelescopeTo(directRayAngle)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Direct Ray (180°)
                </button>
                <button
                  type="button"
                  onClick={() => setLampIsOn(!lampIsOn)}
                  className={`px-2 py-1 rounded-lg font-medium border ${
                    lampIsOn
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Hg Lamp: {lampIsOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Visual Vector SVG Spectrometer Chassis */}
            <div className="relative w-full aspect-[16/8] bg-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden shadow-inner flex items-center justify-center">
              <svg viewBox="0 0 760 360" className="w-full h-full select-none">
                <defs>
                  <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#0284c7" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="mercuryBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#4ade80" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#fef08a" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {/* Dark circular spectrometer base */}
                <circle cx="380" cy="180" r="140" fill="#0f172a" stroke="#334155" strokeWidth="3" />
                <circle cx="380" cy="180" r="130" fill="#1e293b" stroke="#475569" strokeWidth="1" strokeDasharray="2 3" />

                {/* Circular Degree Scale Marks */}
                {Array.from({ length: 36 }).map((_, i) => {
                  const deg = i * 10;
                  const rad = (deg * Math.PI) / 180;
                  const x1 = 380 + Math.cos(rad) * 120;
                  const y1 = 180 + Math.sin(rad) * 120;
                  const x2 = 380 + Math.cos(rad) * 130;
                  const y2 = 180 + Math.sin(rad) * 130;
                  return (
                    <g key={deg}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth={deg % 30 === 0 ? 2 : 1} />
                      {deg % 30 === 0 && (
                        <text
                          x={380 + Math.cos(rad) * 108}
                          y={180 + Math.sin(rad) * 108 + 3}
                          fill="#94a3b8"
                          fontSize="8"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {deg}°
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Fixed Collimator Arm (at Left, 180° towards center) */}
                <g>
                  {/* Mercury Lamp Housing */}
                  <rect x="50" y="150" width="70" height="60" rx="8" fill="#1e293b" stroke="#0ea5e9" strokeWidth="2" />
                  <text x="85" y="185" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    Hg Lamp
                  </text>
                  {lampIsOn && <circle cx="85" cy="180" r="35" fill="url(#lampGlow)" />}

                  {/* Collimator Tube */}
                  <rect x="120" y="170" width="130" height="20" rx="3" fill="#334155" stroke="#475569" strokeWidth="1.5" />
                  {/* Slit adjustment screw */}
                  <rect x="125" y="162" width="10" height="36" rx="2" fill="#64748b" />
                  <circle cx="130" cy="180" r="3" fill="#38bdf8" />
                  <text x="185" y="184" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    Collimator (Slit: {slitWidth}mm)
                  </text>

                  {/* Collimated Parallel Beam towards Prism Table */}
                  {lampIsOn && (
                    <polygon
                      points="250,174 380,174 380,186 250,186"
                      fill="url(#mercuryBeam)"
                      opacity="0.6"
                    />
                  )}
                </g>

                {/* Central Prism Table & Transmission Grating */}
                <g transform="translate(380, 180)">
                  <circle cx="0" cy="0" r="55" fill="#1e293b" stroke="#0ea5e9" strokeWidth="2" />
                  {/* Spirit Level */}
                  <rect x="-24" y="-38" width="48" height="12" rx="6" fill="#0f172a" stroke="#22c55e" strokeWidth="1" />
                  <circle cx="0" cy="-32" r="3" fill="#22c55e" opacity="0.8" />
                  <text x="0" y="-43" fill="#22c55e" fontSize="7" textAnchor="middle" fontFamily="monospace">
                    SPIRIT LEVEL: BALANCED
                  </text>

                  {/* Transmission Grating Mount (Normal to horizontal beam if aligned) */}
                  <g transform={`rotate(${isNormalIncidenceAligned ? 90 : 45})`}>
                    <rect x="-4" y="-42" width="8" height="84" rx="2" fill="#38bdf8" opacity="0.4" stroke="#0284c7" strokeWidth="1.5" />
                    {/* Grating Rulings Engraved Lines */}
                    {[-30, -20, -10, 0, 10, 20, 30].map((ly) => (
                      <line key={ly} x1="-3" y1={ly} x2="3" y2={ly} stroke="#ffffff" strokeWidth="1" opacity="0.8" />
                    ))}
                    <text x="12" y="3" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      15,000 LPI
                    </text>
                  </g>
                </g>

                {/* Rotating Telescope Arm & Eyepiece Assembly */}
                <g transform={`translate(380, 180) rotate(${telescopeAngle})`}>
                  {/* Telescope Main Tube */}
                  <rect x="0" y="-12" width="160" height="24" rx="4" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />
                  {/* Objective Lens */}
                  <rect x="0" y="-14" width="10" height="28" rx="2" fill="#64748b" />
                  {/* Eyepiece / Crosshairs end */}
                  <rect x="150" y="-15" width="22" height="30" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="161" cy="0" r="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />

                  <text x="80" y="4" fill="#f8fafc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    TELESCOPE
                  </text>

                  {/* Vernier 1 Marker at Telescope End */}
                  <polygon points="175,-5 185,0 175,5" fill="#f59e0b" />
                </g>

                {/* Vernier 1 & 2 Labels on Circular Rim */}
                <g transform="translate(380, 180)">
                  {/* V1 at angle */}
                  <g transform={`rotate(${telescopeAngle}) translate(195, 0)`}>
                    <rect x="-18" y="-10" width="36" height="20" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                    <text x="0" y="3" fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      V1
                    </text>
                  </g>
                  {/* V2 diametrically opposite at angle + 180 */}
                  <g transform={`rotate(${telescopeAngle + 180}) translate(195, 0)`}>
                    <rect x="-18" y="-10" width="36" height="20" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="0" y="3" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      V2
                    </text>
                  </g>
                </g>
              </svg>

              {/* Status overlay badge */}
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono space-y-0.5">
                <div className="text-slate-400">Telescope Angle: <span className="text-amber-300 font-bold">{telescopeAngle.toFixed(2)}°</span> ({currentV1.dms.formatted})</div>
                <div className="text-slate-400">Normal Incidence: <span className="text-emerald-400 font-bold">ACHIEVED</span></div>
              </div>
            </div>

            {/* Dual Telescope Eyepiece & Vernier Magnifier Deck */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ocular Reticle (Eyepiece Crosshairs View) */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
                <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    Telescope Eyepiece Reticle (4° FOV)
                  </span>
                  {centeredLine && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Centered: {centeredLine.name}
                    </span>
                  )}
                </div>

                {/* Circular Reticle Viewport */}
                <div className="relative w-48 h-48 my-3 rounded-full bg-black border-4 border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
                  {/* Subtle glass reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/5 pointer-events-none" />

                  {/* Crosshairs etched on reticle glass */}
                  <div className="absolute w-full h-[1px] bg-slate-600/80 pointer-events-none" />
                  <div className="absolute h-full w-[1px] bg-slate-600/80 pointer-events-none" />
                  <div className="absolute w-3 h-3 rounded-full border border-amber-500/60 pointer-events-none" />

                  {/* Dispersed Spectral Lines inside 4° FOV */}
                  {lampIsOn &&
                    fovLines.map((line, idx) => {
                      // Map offset (-2° to +2°) to x pixel (-96px to +96px)
                      const xOffsetPx = (line.offsetFromCrosshair_deg / 2.0) * 88;
                      const isTarget = Math.abs(line.offsetFromCrosshair_deg) <= 0.15;
                      return (
                        <div
                          key={idx}
                          className="absolute h-full flex flex-col items-center justify-center transition-transform duration-75"
                          style={{
                            transform: `translateX(${xOffsetPx}px)`,
                          }}
                        >
                          {/* Spectral slit line bar */}
                          <div
                            className="h-full rounded-sm transition-all"
                            style={{
                              width: `${Math.max(2, slitWidth * 2.5)}px`,
                              backgroundColor: line.colorHex,
                              boxShadow: `0 0 ${isTarget ? 16 : 8}px ${line.glowColor}`,
                              opacity: line.intensity,
                            }}
                          />
                          {/* Label attached to line */}
                          <span
                            className="absolute bottom-2 text-[9px] font-mono font-bold px-1 rounded bg-black/80 border border-slate-800"
                            style={{ color: line.colorHex }}
                          >
                            {line.colorKey.toUpperCase()}
                          </span>
                        </div>
                      );
                    })}

                  {!lampIsOn && (
                    <div className="text-[11px] font-mono text-slate-600 text-center px-4">
                      Lamp OFF
                    </div>
                  )}
                </div>

                {/* Quick alignment helpers for centered line */}
                {centeredLine && centeredLine.colorKey !== 'central' && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleRecordCurrentPosition(
                          centeredLine.colorKey as 'blue' | 'green' | 'yellow' | 'red',
                          'left'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-700 font-semibold text-[11px]"
                    >
                      Record Left (a)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleRecordCurrentPosition(
                          centeredLine.colorKey as 'blue' | 'green' | 'yellow' | 'red',
                          'right'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 font-semibold text-[11px]"
                    >
                      Record Right (b)
                    </button>
                  </div>
                )}
              </div>

              {/* Vernier 1 & 2 Magnifiers */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    Vernier Magnifier Windows (LC = 1')
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1 MSD = 30' • 30 VSD</span>
                </div>

                <div className="space-y-2 py-2">
                  {/* Vernier 1 Details */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span>Vernier 1 (V1):</span>
                      <span>{currentV1.dms.formatted}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400 pt-0.5">
                      <div>MSR: <span className="text-slate-200 font-bold">{currentV1.msr_degrees_part}° {currentV1.msr_minutes_part}'</span></div>
                      <div>VSC: <span className="text-slate-200 font-bold">{currentV1.vsc} div</span></div>
                      <div>TR: <span className="text-amber-300 font-bold">{currentV1.totalReading_deg.toFixed(2)}°</span></div>
                    </div>
                  </div>

                  {/* Vernier 2 Details (180° Diametrically Opposite) */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-sky-500/30 font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between text-sky-300 font-bold">
                      <span>Vernier 2 (V2):</span>
                      <span>{currentV2.dms.formatted}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400 pt-0.5">
                      <div>MSR: <span className="text-slate-200 font-bold">{currentV2.msr_degrees_part}° {currentV2.msr_minutes_part}'</span></div>
                      <div>VSC: <span className="text-slate-200 font-bold">{currentV2.vsc} div</span></div>
                      <div>TR: <span className="text-sky-300 font-bold">{currentV2.totalReading_deg.toFixed(2)}°</span></div>
                    </div>
                  </div>
                </div>

                {/* Quick alignment shortcuts to all 4 first-order spectral lines */}
                <div className="border-t border-slate-800 pt-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Fast Target Spectral Line Selector:
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {MERCURY_LINE_KEYS.map((key) => {
                      const line = MERCURY_SPECTRUM[key];
                      const { theta_deg } = mercuryGratingEngine.calculateDiffractionAngle(
                        line.lambda_ref_nm,
                        gratingRulingsPerInch,
                        1
                      );
                      const leftAngle = mercuryGratingEngine.normalizeAngle(directRayAngle - theta_deg);
                      const rightAngle = mercuryGratingEngine.normalizeAngle(directRayAngle + theta_deg);

                      return (
                        <div key={key} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => alignTelescopeTo(leftAngle)}
                            className="w-full py-1 text-[10px] font-bold rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-300 flex items-center justify-center gap-1"
                            title={`Turn to Left 1st Order ${line.name}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: line.colorHex }} />
                            L-{line.name.slice(0, 3)}
                          </button>
                          <button
                            type="button"
                            onClick={() => alignTelescopeTo(rightAngle)}
                            className="w-full py-1 text-[10px] font-bold rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 flex items-center justify-center gap-1"
                            title={`Turn to Right 1st Order ${line.name}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: line.colorHex }} />
                            R-{line.name.slice(0, 3)}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Telescope Rotation Controls Deck */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Telescope Rotation &amp; Tangent Screw Controls
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsTelescopeClamped(!isTelescopeClamped)}
                    className={`px-2.5 py-0.5 rounded font-bold transition-all ${
                      isTelescopeClamped
                        ? 'bg-rose-900/80 text-rose-200 border border-rose-700'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Clamp: {isTelescopeClamped ? 'LOCKED' : 'UNCLAMPED'}
                  </button>
                </div>
              </div>

              {/* Coarse continuous slider */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 w-12">0°</span>
                <input
                  type="range"
                  min="0"
                  max="359.9"
                  step="0.05"
                  disabled={isTelescopeClamped}
                  value={telescopeAngle}
                  onChange={(e) => setTelescopeAngle(parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-500 disabled:opacity-30"
                  aria-label="Telescope rotation angle"
                />
                <span className="text-[11px] font-mono text-slate-400 w-12 text-right">360°</span>
              </div>

              {/* Tangent fine-adjustment screw buttons */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isTelescopeClamped}
                    onClick={() => adjustTelescope(-1.0)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30"
                  >
                    -1.0°
                  </button>
                  <button
                    type="button"
                    disabled={isTelescopeClamped}
                    onClick={() => adjustTelescope(-0.1)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30"
                  >
                    -0.1°
                  </button>
                  <button
                    type="button"
                    disabled={isTelescopeClamped}
                    onClick={() => adjustTelescope(-0.0167)} // 1 arcminute
                    className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 font-bold disabled:opacity-30"
                    title="Step 1 arcminute (Least Count)"
                  >
                    -1' (LC)
                  </button>
                </div>

                <span className="font-mono font-bold text-amber-300 text-sm">
                  {telescopeAngle.toFixed(2)}°
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isTelescopeClamped}
                    onClick={() => adjustTelescope(+0.0167)} // 1 arcminute
                    className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 font-bold disabled:opacity-30"
                    title="Step 1 arcminute (Least Count)"
                  >
                    +1' (LC)
                  </button>
                  <button
                    type="button"
                    disabled={isTelescopeClamped}
                    onClick={() => adjustTelescope(+0.1)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30"
                  >
                    +0.1°
                  </button>
                  <button
                    type="button"
                    disabled={isTelescopeClamped}
                    onClick={() => adjustTelescope(+1.0)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30"
                  >
                    +1.0°
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Instrument Parameters & Step-by-Step Calculations (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Grating Element Specifications Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              Grating Optical Element (e + d)
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rulings / inch (N):</span>
                <select
                  value={gratingRulingsPerInch}
                  onChange={(e) => setGratingRulingsPerInch(parseInt(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded px-2 py-0.5"
                >
                  <option value={15000}>15,000 LPI (Standard)</option>
                  <option value={7500}>7,500 LPI</option>
                  <option value={2500}>2,500 LPI</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Rulings / metre:</span>
                <span className="text-slate-200 font-bold">
                  {gratingInfo.rulingsPerMetre.toLocaleString()} lines/m
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400">Grating Element (e + d) = 2.54×10⁻² / N:</div>
                <div className="text-sm font-bold text-emerald-400">
                  {gratingInfo.gratingElement_m.toExponential(4)} m
                </div>
                <div className="text-[10px] text-slate-500">
                  = {gratingInfo.gratingElement_nm.toFixed(1)} nm ({gratingInfo.gratingElement_Angstrom.toFixed(1)} Å)
                </div>
              </div>
            </div>

            {/* Formula Reference */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
              <div className="font-bold text-indigo-300">Normal Incidence Law:</div>
              <div>(e + d) · sin(θ) = n · λ</div>
              <div className="text-[10px] text-slate-400">
                λ = [(e + d) · sin(θ)] / n (Order n = 1)
              </div>
            </div>
          </div>

          {/* Line-by-Line Calculations Drawer Toggle */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                Line-by-Line Sample Calculations
              </span>
              <button
                type="button"
                onClick={() => setShowCalculationsDrawer(!showCalculationsDrawer)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
              >
                {showCalculationsDrawer ? 'Hide' : 'Show Steps'}
              </button>
            </div>

            <div className="text-xs text-slate-300">
              <span className="font-bold text-emerald-300">Demonstration for {sampleColor.colorName} Line:</span>
              <div className="font-mono text-[11px] mt-1 space-y-1 text-slate-400">
                <div>• θ(V1) = {sampleColor.v1_theta_deg}° | θ(V2) = {sampleColor.v2_theta_deg}°</div>
                <div>• Mean θ = {sampleColor.mean_theta_deg}° ({sampleColor.mean_theta_dms.formatted})</div>
                <div>• λ_calc = <strong className="text-amber-300">{sampleColor.calculated_lambda_Angstrom} Å</strong> (Std: {sampleColor.reference_lambda_Angstrom} Å)</div>
                <div>• Error = <strong className="text-slate-200">{sampleColor.percentageError}%</strong></div>
              </div>
            </div>

            {showCalculationsDrawer && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2.5 animate-fadeIn">
                <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1">
                  1. Least Count (LC) of Spectrometer (Manual p. 19):
                </div>
                <div className="font-mono text-[11px]">
                  LC = 1 MSD - 1 VSD = 0.5° - 29/30 × 30' = 1' = (1/60)°
                </div>

                <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1">
                  2. Grating Element (e + d) (Manual p. 36):
                </div>
                <div className="font-mono text-[11px]">
                  (e + d) = 2.54×10⁻² / {gratingRulingsPerInch} = {gratingInfo.gratingElement_m.toExponential(4)} m
                </div>

                <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1">
                  3. Diffraction Angle Modular Arithmetic:
                </div>
                <div className="font-mono text-[11px]">
                  2θ = |Left (a) - Right (b)| (shortest arc across 0°/360°)
                  <br />
                  θ = 2θ / 2; Mean θ = [θ(V1) + θ(V2)] / 2
                </div>

                <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1">
                  4. Wavelength Calculation:
                </div>
                <div className="font-mono text-[11px]">
                  λ = (e + d) · sin({sampleColor.mean_theta_deg}°) / 1
                  <br />
                  λ = {gratingInfo.gratingElement_m.toExponential(3)} · {Math.sin((sampleColor.mean_theta_deg * Math.PI) / 180).toFixed(4)}
                  <br />
                  λ = {sampleColor.calculated_lambda_Angstrom} Å (Std: {sampleColor.reference_lambda_Angstrom} Å)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Observation Table & Master Results Section (Manual pp. 36-37) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
              Observation Sheet &amp; Results Parity (Manual pp. 36–37)
            </h3>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleAutoMeasureAll}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
            >
              Auto-Measure All 4 Lines
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

        {/* 1st Order Spectrum Table (Manual p. 36) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200">
              Table for the Determination of Angle of Diffraction for 1st Order Spectrum (n = 1)
            </h4>
            {lastSaved && <span className="text-[11px] font-mono text-emerald-400">Last updated: {lastSaved}</span>}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono font-semibold">
                  <th className="p-2.5 w-24">Colour</th>
                  <th className="p-2.5 w-16 text-center">Vernier</th>
                  <th className="p-2.5 text-center bg-slate-900/60" colSpan={3}>
                    Left side reading (a)
                  </th>
                  <th className="p-2.5 text-center bg-slate-900/40" colSpan={3}>
                    Right side reading (b)
                  </th>
                  <th className="p-2.5 w-24 text-center">2θ = |a - b|</th>
                  <th className="p-2.5 w-24 text-center">θ = (a - b)/2</th>
                  <th className="p-2.5 w-28 text-center text-amber-300">Mean θ</th>
                  <th className="p-2.5 w-24 text-center text-emerald-300">λ (Å)</th>
                </tr>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-500 font-mono text-[10px]">
                  <th></th>
                  <th></th>
                  <th className="p-1 text-center">MSR</th>
                  <th className="p-1 text-center">VSC</th>
                  <th className="p-1 text-center font-bold text-slate-300">TR*</th>
                  <th className="p-1 text-center">MSR</th>
                  <th className="p-1 text-center">VSC</th>
                  <th className="p-1 text-center font-bold text-slate-300">TR*</th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {MERCURY_LINE_KEYS.map((colorKey) => {
                  const lineInfo = MERCURY_SPECTRUM[colorKey];
                  const rowsForColor = observations.rows.filter((r) => r.color === colorKey);
                  const summary = observations.summaries.find((s) => s.color === colorKey)!;

                  return (
                    <React.Fragment key={colorKey}>
                      {rowsForColor.map((row, rIdx) => (
                        <tr
                          key={`${colorKey}_${row.vernier}`}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          {rIdx === 0 && (
                            <td
                              rowSpan={2}
                              className="p-2.5 font-bold border-r border-slate-800 align-middle"
                              style={{ color: lineInfo.colorHex }}
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: lineInfo.colorHex }}
                                />
                                {row.colorName}
                              </div>
                            </td>
                          )}
                          <td className="p-2.5 text-center font-bold text-slate-300 border-r border-slate-800">
                            {row.vernier}
                          </td>
                          {/* Left readings */}
                          <td className="p-1.5 text-center text-slate-400">
                            {row.leftReading.msr_degrees_part}° {row.leftReading.msr_minutes_part}'
                          </td>
                          <td className="p-1.5 text-center text-slate-400">{row.leftReading.vsc}</td>
                          <td className="p-1.5 text-center font-bold text-slate-200 bg-slate-900/40 border-r border-slate-800">
                            {row.leftReading.dms.formatted}
                          </td>
                          {/* Right readings */}
                          <td className="p-1.5 text-center text-slate-400">
                            {row.rightReading.msr_degrees_part}° {row.rightReading.msr_minutes_part}'
                          </td>
                          <td className="p-1.5 text-center text-slate-400">{row.rightReading.vsc}</td>
                          <td className="p-1.5 text-center font-bold text-slate-200 bg-slate-900/40 border-r border-slate-800">
                            {row.rightReading.dms.formatted}
                          </td>
                          {/* 2θ and θ */}
                          <td className="p-1.5 text-center text-slate-300">{row.diffractionAngle_2theta_deg}°</td>
                          <td className="p-1.5 text-center font-semibold text-slate-200 border-r border-slate-800">
                            {row.diffractionAngle_theta_dms.formatted}
                          </td>
                          {/* Mean θ and calculated λ (spanning both verniers) */}
                          {rIdx === 0 && (
                            <>
                              <td
                                rowSpan={2}
                                className="p-2.5 text-center font-bold text-amber-300 border-r border-slate-800 align-middle"
                              >
                                {summary.mean_theta_dms.formatted}
                                <div className="text-[10px] text-slate-500 font-normal">
                                  ({summary.mean_theta_deg}°)
                                </div>
                              </td>
                              <td
                                rowSpan={2}
                                className="p-2.5 text-center font-bold text-emerald-400 align-middle"
                              >
                                {summary.calculated_lambda_Angstrom} Å
                                <div className="text-[10px] text-slate-500 font-normal">
                                  Std: {summary.reference_lambda_Angstrom} Å
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            *TR = MSR + (VSC × LC) where Least Count LC = 1 minute of arc (1'). All angles evaluated using circular modular difference.
          </div>
        </div>

        {/* Master Results Table (Manual p. 37) */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <h4 className="text-sm font-bold text-slate-200">
            Master Results Summary: Calculated Wavelengths vs Standard Values (Manual p. 37)
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono font-semibold">
                  <th className="p-2.5">Colour</th>
                  <th className="p-2.5 text-center">Standard Wavelength (Å)</th>
                  <th className="p-2.5 text-center text-amber-300">Mean Angle θ</th>
                  <th className="p-2.5 text-center text-emerald-400">Observed Wavelength (Å)</th>
                  <th className="p-2.5 text-center">Observed (nm)</th>
                  <th className="p-2.5 text-center">Percentage Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {observations.summaries.map((s) => (
                  <tr key={s.color} className="hover:bg-slate-800/30">
                    <td className="p-2.5 font-bold" style={{ color: MERCURY_SPECTRUM[s.color].colorHex }}>
                      {s.colorName}
                    </td>
                    <td className="p-2.5 text-center text-slate-300">{s.reference_lambda_Angstrom} Å</td>
                    <td className="p-2.5 text-center font-bold text-amber-300">{s.mean_theta_dms.formatted}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-400">{s.calculated_lambda_Angstrom} Å</td>
                    <td className="p-2.5 text-center text-slate-300">{s.calculated_lambda_nm} nm</td>
                    <td className="p-2.5 text-center text-slate-300">{s.percentageError}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
