import React, { useState, useMemo } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import {
  sodiumGratingEngine,
  SODIUM_SPECTRUM,
  SodiumObservationRow,
  SodiumSummaryRow,
  decomposeAngleToVernier,
  circularDistance,
  normalizeAngle,
} from '../../engine/sodiumGratingEngine';
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
  CheckCircle,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { SetupDiagramPanel } from '../instructional/SetupDiagramPanel';
import { sodiumConfigurations } from '../../instructional/procedureDefinitions';
import { recordExperimentPractice } from '../../services/studentProgress';

interface SodiumSpectrometerWorkbenchProps {
  metadata: ExperimentMetadata;
  onBackToDashboard: () => void;
  onOpenViva: () => void;
}

export const SodiumSpectrometerWorkbench: React.FC<SodiumSpectrometerWorkbenchProps> = ({
  metadata,
  onBackToDashboard,
  onOpenViva,
}) => {
  // Mode: Guided vs Exam vs Viva
  const [activeMode, setActiveMode] = useState<'guided' | 'exam'>('guided');
  const [guidedStep, setGuidedStep] = useState<number>(1);

  // Optical Hardware State
  const [lampIsOn, setLampIsOn] = useState<boolean>(true);
  const [slitWidth, setSlitWidth] = useState<number>(0.8); // 0.2 to 2.0 mm
  const [gratingRulingsPerInch, setGratingRulingsPerInch] = useState<number>(15000);
  const [directRayAngle] = useState<number>(180.0); // Direct line axis at 180°

  // Spectrometer Rotational Axes
  // Prism table angle controls angle of incidence i relative to minimum condition
  // At tableAngle = 10.03°, i = Dm/2 (minimum deviation for yellow lines)
  const [tableAngle_deg, setTableAngle_deg] = useState<number>(10.03);
  const [telescopeAngle, setTelescopeAngle] = useState<number>(180.0 - 20.05); // Initial near Left Yellow 1
  const [isTelescopeClamped, setIsTelescopeClamped] = useState<boolean>(false);
  const [isTableClamped, setIsTableClamped] = useState<boolean>(false);
  const [showCalculationsDrawer, setShowCalculationsDrawer] = useState<boolean>(false);
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left');
  const [selectedTargetLine, setSelectedTargetLine] = useState<'yellow_1' | 'yellow_2'>('yellow_1');
  const [activeDiagramConfigId, setActiveDiagramConfigId] = useState<string>('minimum_deviation');
  const [isDiagramPinned, setIsDiagramPinned] = useState<boolean>(false);

  // Grating physical element
  const gratingElement_m = useMemo(
    () => sodiumGratingEngine.calculateGratingElement(gratingRulingsPerInch),
    [gratingRulingsPerInch]
  );

  // Live Vernier Readings for V1 and V2
  const currentV1 = useMemo(
    () => decomposeAngleToVernier(telescopeAngle),
    [telescopeAngle]
  );
  const currentV2 = useMemo(
    () => decomposeAngleToVernier(telescopeAngle + 180),
    [telescopeAngle]
  );

  // Minimum deviation angle for currently selected target line
  const targetLineInfo = SODIUM_SPECTRUM[selectedTargetLine];
  const targetDm = useMemo(() => {
    return sodiumGratingEngine.calculateMinimumDeviationAngle(
      targetLineInfo.lambda_ref_nm,
      gratingRulingsPerInch,
      1
    );
  }, [targetLineInfo, gratingRulingsPerInch]);

  // Current incident angle i based on table rotation
  const currentIncidentAngle_i = Math.abs(tableAngle_deg);

  // Compute deviation D(i) for Yellow 1 and Yellow 2 at current table angle
  const deviationY1 = useMemo(() => {
    return sodiumGratingEngine.calculateDeviationAtIncidence(
      currentIncidentAngle_i,
      SODIUM_SPECTRUM.yellow_1.lambda_ref_nm,
      gratingRulingsPerInch,
      1
    );
  }, [currentIncidentAngle_i, gratingRulingsPerInch]);

  const deviationY2 = useMemo(() => {
    return sodiumGratingEngine.calculateDeviationAtIncidence(
      currentIncidentAngle_i,
      SODIUM_SPECTRUM.yellow_2.lambda_ref_nm,
      gratingRulingsPerInch,
      1
    );
  }, [currentIncidentAngle_i, gratingRulingsPerInch]);

  // Check if optical table is at minimum deviation extremum (dD/di ~ 0)
  const isAtExtremum = useMemo(() => {
    const halfDm = targetDm / 2;
    return Math.abs(currentIncidentAngle_i - halfDm) <= 0.08;
  }, [currentIncidentAngle_i, targetDm]);

  // FOV Spectral Lines visible through telescope reticle (4° Optical Field of View)
  const fovLines = useMemo(() => {
    if (!lampIsOn) return [];

    const lines: Array<{
      id: string;
      name: string;
      colorHex: string;
      glowColor: string;
      absoluteAngle_deg: number;
      offsetFromCrosshair_deg: number;
      isDirectRay?: boolean;
    }> = [];

    // 1. Direct Slit Image (at 180°)
    const directOffset = circularDistance(telescopeAngle, directRayAngle);
    const directSignedOffset =
      normalizeAngle(telescopeAngle - directRayAngle) > 180
        ? directOffset
        : -directOffset;

    if (Math.abs(directSignedOffset) <= 2.2) {
      lines.push({
        id: 'direct_slit',
        name: 'Direct Slit Image (White/Gold)',
        colorHex: '#fef08a',
        glowColor: 'rgba(254, 240, 138, 0.9)',
        absoluteAngle_deg: directRayAngle,
        offsetFromCrosshair_deg: directSignedOffset,
        isDirectRay: true,
      });
    }

    // 2. Diffracted Sodium Doublet (Left or Right side depending on side observed)
    if (deviationY1.isPhysical && deviationY2.isPhysical) {
      // Left side positions: 180° - D
      const leftAngleY1 = normalizeAngle(directRayAngle - deviationY1.deviationAngle_D_deg);
      const leftAngleY2 = normalizeAngle(directRayAngle - deviationY2.deviationAngle_D_deg);

      // Right side positions: 180° + D
      const rightAngleY1 = normalizeAngle(directRayAngle + deviationY1.deviationAngle_D_deg);
      const rightAngleY2 = normalizeAngle(directRayAngle + deviationY2.deviationAngle_D_deg);

      const testSideLines =
        activeSide === 'left'
          ? [
              { key: 'yellow_1' as const, angle: leftAngleY1 },
              { key: 'yellow_2' as const, angle: leftAngleY2 },
            ]
          : [
              { key: 'yellow_1' as const, angle: rightAngleY1 },
              { key: 'yellow_2' as const, angle: rightAngleY2 },
            ];

      for (const item of testSideLines) {
        const spec = SODIUM_SPECTRUM[item.key];
        const signedOffset =
          normalizeAngle(item.angle - telescopeAngle) > 180
            ? -(360 - normalizeAngle(item.angle - telescopeAngle))
            : normalizeAngle(item.angle - telescopeAngle);

        if (Math.abs(signedOffset) <= 2.2) {
          lines.push({
            id: item.key,
            name: spec.name,
            colorHex: spec.colorHex,
            glowColor: spec.glowColor,
            absoluteAngle_deg: item.angle,
            offsetFromCrosshair_deg: signedOffset,
          });
        }
      }
    }

    return lines;
  }, [
    lampIsOn,
    telescopeAngle,
    directRayAngle,
    deviationY1,
    deviationY2,
    activeSide,
  ]);

  // Closest spectral line to vertical crosshair (within 0.25°)
  const centeredLine = useMemo(() => {
    return fovLines.find((line) => Math.abs(line.offsetFromCrosshair_deg) <= 0.25);
  }, [fovLines]);

  // Observations store (Full 4 rows + 2 summaries matching Manual p. 55)
  const [observationRows, setObservationRows] = useState<SodiumObservationRow[]>(() =>
    sodiumGratingEngine.generateTheoreticalTable(directRayAngle, 15000, 1)
  );

  const summaryResults: SodiumSummaryRow[] = useMemo(() => {
    return sodiumGratingEngine.generateSummaryResults(observationRows, gratingRulingsPerInch, 1);
  }, [observationRows, gratingRulingsPerInch]);

  // Table & Telescope Adjustments
  const adjustTelescope = (deltaDeg: number) => {
    if (isTelescopeClamped) return;
    setTelescopeAngle((prev) => normalizeAngle(prev + deltaDeg));
  };

  const adjustTable = (deltaDeg: number) => {
    if (isTableClamped) return;
    setTableAngle_deg((prev) => Number((prev + deltaDeg).toFixed(3)));
  };

  // Align telescope to exact minimum deviation position for target line
  const handleAutoAlignMinimumDeviation = (side: 'left' | 'right') => {
    setIsTableClamped(false);
    setIsTelescopeClamped(false);
    setActiveSide(side);

    // Set table to optimal minimum deviation angle i = Dm / 2
    const optimalTable = targetDm / 2;
    setTableAngle_deg(Number(optimalTable.toFixed(3)));

    // Set telescope to direct +- Dm
    const targetAngle = side === 'left' ? directRayAngle - targetDm : directRayAngle + targetDm;
    setTelescopeAngle(normalizeAngle(targetAngle));
  };

  // Record current telescope reading into observation table
  const handleRecordReading = (colorKey: 'yellow_1' | 'yellow_2', side: 'left' | 'right') => {
    setObservationRows((prev) => {
      const updated = [...prev];
      const v1Idx = updated.findIndex((r) => r.colorKey === colorKey && r.vernier === 'V1');
      const v2Idx = updated.findIndex((r) => r.colorKey === colorKey && r.vernier === 'V2');

      if (v1Idx >= 0) {
        const row = { ...updated[v1Idx] };
        if (side === 'left') {
          row.leftReading = currentV1;
        } else {
          row.rightReading = currentV1;
        }
        const diff2Dm = circularDistance(row.leftReading.totalReading_deg, row.rightReading.totalReading_deg);
        row.minimumDeviation_2Dm_deg = Number(diff2Dm.toFixed(4));
        row.minimumDeviation_Dm_deg = Number((diff2Dm / 2).toFixed(4));
        const calc = sodiumGratingEngine.calculateWavelengthFromDm(row.minimumDeviation_Dm_deg, gratingRulingsPerInch, 1);
        row.calculatedWavelength_nm = calc.wavelength_nm;
        row.calculatedWavelength_Angstrom = calc.wavelength_Angstrom;
        const line = SODIUM_SPECTRUM[colorKey];
        row.percentageError = Number((Math.abs((calc.wavelength_nm - line.lambda_ref_nm) / line.lambda_ref_nm) * 100).toFixed(2));
        updated[v1Idx] = row;
      }

      if (v2Idx >= 0) {
        const row = { ...updated[v2Idx] };
        if (side === 'left') {
          row.leftReading = currentV2;
        } else {
          row.rightReading = currentV2;
        }
        const diff2Dm = circularDistance(row.leftReading.totalReading_deg, row.rightReading.totalReading_deg);
        row.minimumDeviation_2Dm_deg = Number(diff2Dm.toFixed(4));
        row.minimumDeviation_Dm_deg = Number((diff2Dm / 2).toFixed(4));
        const calc = sodiumGratingEngine.calculateWavelengthFromDm(row.minimumDeviation_Dm_deg, gratingRulingsPerInch, 1);
        row.calculatedWavelength_nm = calc.wavelength_nm;
        row.calculatedWavelength_Angstrom = calc.wavelength_Angstrom;
        const line = SODIUM_SPECTRUM[colorKey];
        row.percentageError = Number((Math.abs((calc.wavelength_nm - line.lambda_ref_nm) / line.lambda_ref_nm) * 100).toFixed(2));
        updated[v2Idx] = row;
      }

      return updated;
    });
  };

  const handleResetObservations = () => {
    setObservationRows(sodiumGratingEngine.generateTheoreticalTable(directRayAngle, gratingRulingsPerInch, 1));
  };

  const handleExportCSV = () => {
    recordExperimentPractice('expt-5-sodium-grating', {
      recordedRowsCount: observationRows.length,
      summary: 'Sodium yellow doublet D1 and D2 minimum deviation measurements recorded',
    });
    let csv = 'Colour,Vernier,Left MSR,Left VSC,Left TR (deg),Right MSR,Right VSC,Right TR (deg),2Dm (deg),Dm (deg),Wavelength (nm),Wavelength (A),Error (%)\n';
    observationRows.forEach((r) => {
      csv += `"${r.colorName}","${r.vernier}","${r.leftReading.msr_degrees_part}° ${r.leftReading.msr_minutes_part}'",${r.leftReading.vsc},${r.leftReading.totalReading_deg.toFixed(4)},"${r.rightReading.msr_degrees_part}° ${r.rightReading.msr_minutes_part}'",${r.rightReading.vsc},${r.rightReading.totalReading_deg.toFixed(4)},${r.minimumDeviation_2Dm_deg.toFixed(4)},${r.minimumDeviation_Dm_deg.toFixed(4)},${r.calculatedWavelength_nm},${r.calculatedWavelength_Angstrom},${r.percentageError}\n`;
    });
    csv += '\nSummary Results:\nColour,Standard Wavelength (nm),Observed Mean Dm (deg),Calculated Wavelength (nm),Calculated Wavelength (A),Percentage Error (%)\n';
    summaryResults.forEach((s) => {
      csv += `"${s.colorName}",${s.standardWavelength_nm},${s.mean_Dm_deg.toFixed(4)},${s.observedWavelength_nm},${s.observedWavelength_Angstrom},${s.percentageError}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sodium_grating_minimum_deviation_table.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
                EXPT 05 • BAPHY105
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                [MINIMUM DEVIATION METHOD • VALIDATED OPTICAL PHYSICS]
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
                  ? 'bg-amber-600 text-white shadow-sm'
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
            onClick={() => setShowCalculationsDrawer(!showCalculationsDrawer)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            Theory &amp; Derivations
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
            title="Print Laboratory Worksheet"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guided Mode Instructions Banner */}
      {activeMode === 'guided' && (
        <div className="bg-amber-950/30 border border-amber-800/60 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-amber-200 no-print">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold shrink-0">
              {guidedStep}
            </div>
            <div>
              <span className="font-bold text-amber-100">
                {guidedStep === 1 && 'Step 1: Initial Spectrometer Adjustments & Eyepiece Reticle Focusing'}
                {guidedStep === 2 && 'Step 2: Observe Direct Beam at 180° & Switch to 1st Order Diffraction'}
                {guidedStep === 3 && 'Step 3: Rotate Prism Table to Locate Minimum Deviation Turning Point'}
                {guidedStep === 4 && 'Step 4: Record Verniers V1 & V2 on Left & Right Sides; Calculate Wavelengths'}
              </span>
              <p className="text-amber-300/90 text-[11px] mt-0.5">
                {guidedStep === 1 && 'Verify Sodium Lamp is ON. Focus crosshairs in ocular reticle. Check spirit level on prism table.'}
                {guidedStep === 2 && 'Align telescope to 180° direct image. Verify narrow slit width (0.8 mm) for high spectral resolution.'}
                {guidedStep === 3 && 'Rotate the prism table slowly in one direction. Observe Yellow 1 & 2 move towards direct ray, halt at turning point (extremum dD/di = 0), and reverse! Clamp at turning point.'}
                {guidedStep === 4 && 'Align vertical crosshair to Yellow 1 & Yellow 2 on Left and Right sides. Record MSR and VSC. Verify λ matches 589.6 nm and 589.0 nm.'}
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
              className="px-3 py-1 text-xs rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1 disabled:opacity-40"
            >
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Vector Setup Blueprint & Minimum Deviation Spectrometer Panel */}
      <SetupDiagramPanel
        configurations={sodiumConfigurations}
        activeConfigId={activeDiagramConfigId}
        onSelectConfig={setActiveDiagramConfigId}
        isPinned={isDiagramPinned}
        onTogglePin={setIsDiagramPinned}
      />

      {/* Main Interactive Spectrometer Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Visual Spectrometer Stage & Reticle (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Stage Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Spectrometer Optical Bench (Sodium Lamp &amp; Grating)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  (e+d) = {(gratingElement_m * 1e6).toFixed(4)} µm
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs no-print">
                <button
                  type="button"
                  onClick={() => handleAutoAlignMinimumDeviation('left')}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-800 text-amber-300 font-medium"
                >
                  Auto-Align Min Deviation (Left)
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoAlignMinimumDeviation('right')}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-800 text-amber-300 font-medium"
                >
                  Auto-Align Min Deviation (Right)
                </button>
                <button
                  type="button"
                  onClick={() => setTelescopeAngle(directRayAngle)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Direct Ray (180°)
                </button>
                <button
                  type="button"
                  onClick={() => setLampIsOn(!lampIsOn)}
                  className={`px-2 py-1 rounded-lg font-medium border ${
                    lampIsOn
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Na Lamp: {lampIsOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Visual Vector SVG Spectrometer Chassis */}
            <div className="relative w-full aspect-[16/8] bg-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden shadow-inner flex items-center justify-center">
              <svg viewBox="0 0 760 360" className="w-full h-full select-none">
                <defs>
                  <radialGradient id="sodiumLampGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#d97706" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="sodiumBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.7" />
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
                          x={380 + Math.cos(rad) * 110}
                          y={180 + Math.sin(rad) * 110 + 3}
                          fill="#64748b"
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

                {/* Collimator Assembly (Fixed on left at 180° horizontal ray) */}
                <g transform="translate(140, 180)">
                  <rect x="0" y="-12" width="180" height="24" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  <rect x="-25" y="-18" width="25" height="36" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                  {/* Adjustable slit opening */}
                  <rect x="-4" y={-slitWidth * 4} width="4" height={slitWidth * 8} fill="#fef08a" />
                  <text x="90" y="4" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    COLLIMATOR
                  </text>
                </g>

                {/* Sodium Vapour Lamp Light Source Housing */}
                <g transform="translate(90, 180)">
                  <rect x="-40" y="-35" width="40" height="70" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="-20" cy="0" r="16" fill={lampIsOn ? 'url(#sodiumLampGlow)' : '#0f172a'} />
                  {lampIsOn && <circle cx="-20" cy="0" r="8" fill="#fef08a" />}
                  <text x="-20" y="45" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    Na LAMP
                  </text>
                </g>

                {/* Parallel Collimated Light Beam */}
                {lampIsOn && (
                  <path d="M 320 176 L 380 176 L 380 184 L 320 184 Z" fill="url(#sodiumBeam)" opacity="0.8" />
                )}

                {/* Prism Table with Grating Mount (Rotates with tableAngle_deg) */}
                <g transform={`translate(380, 180) rotate(${tableAngle_deg})`}>
                  {/* Circular Table Top */}
                  <circle cx="0" cy="0" r="48" fill="#1e293b" stroke="#d97706" strokeWidth="2" />
                  <circle cx="0" cy="0" r="44" fill="#0f172a" stroke="#475569" strokeDasharray="2 2" />

                  {/* Leveling Screws & Spirit Level */}
                  <circle cx="-25" cy="-25" r="5" fill="#64748b" stroke="#94a3b8" />
                  <circle cx="25" cy="-25" r="5" fill="#64748b" stroke="#94a3b8" />
                  <circle cx="0" cy="30" r="5" fill="#64748b" stroke="#94a3b8" />

                  {/* Spirit Level Bubble */}
                  <rect x="-14" y="-38" width="28" height="8" rx="4" fill="#065f46" stroke="#10b981" />
                  <circle cx="0" cy="-34" r="2.5" fill="#a7f3d0" />

                  {/* Transmission Grating Plate clamped on table */}
                  <g transform="rotate(90)">
                    <rect x="-4" y="-38" width="8" height="76" rx="2" fill="#38bdf8" opacity="0.45" stroke="#0284c7" strokeWidth="1.5" />
                    {/* Grating Rulings Engraved Lines */}
                    {[-25, -15, -5, 5, 15, 25].map((ly) => (
                      <line key={ly} x1="-3" y1={ly} x2="3" y2={ly} stroke="#ffffff" strokeWidth="1" opacity="0.8" />
                    ))}
                    <text x="8" y="3" fill="#f59e0b" fontSize="7" fontWeight="bold" fontFamily="monospace">
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
                    <rect x="-18" y="-10" width="36" height="20" rx="4" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="0" y="3" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      V2
                    </text>
                  </g>
                </g>
              </svg>

              {/* Status overlay badge */}
              <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono space-y-0.5">
                <div className="text-slate-400">
                  Telescope V1: <span className="text-amber-300 font-bold">{currentV1.dms.formatted}</span> ({telescopeAngle.toFixed(2)}°)
                </div>
                <div className="text-slate-400">
                  Table Incidence i: <span className="text-sky-300 font-bold">{currentIncidentAngle_i.toFixed(2)}°</span>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-slate-400">Extremum:</span>
                  {isAtExtremum ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> STATIONARY POINT (Dm)
                    </span>
                  ) : (
                    <span className="text-amber-400">Rotating towards extremum</span>
                  )}
                </div>
              </div>
            </div>

            {/* Dual Telescope Eyepiece & Vernier Magnifier Deck */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ocular Reticle (Eyepiece Crosshairs View) */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
                <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    Telescope Eyepiece Reticle (4° Optical FOV)
                  </span>
                  {centeredLine && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Centered: {centeredLine.name}
                    </span>
                  )}
                </div>

                {/* Circular Eyepiece Field of View */}
                <div className="relative my-3 w-56 h-56 rounded-full bg-slate-950 border-4 border-slate-800 shadow-2xl flex items-center justify-center overflow-hidden">
                  <svg viewBox="-100 -100 200 200" className="w-full h-full">
                    {/* Dark aperture background */}
                    <circle cx="0" cy="0" r="98" fill="#020617" />

                    {/* FOV Fine Degree Scale ticks */}
                    {[-1.5, -1.0, -0.5, 0.5, 1.0, 1.5].map((t) => (
                      <line
                        key={t}
                        x1={t * 45}
                        y1="-6"
                        x2={t * 45}
                        y2="6"
                        stroke="#475569"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Horizontal & Vertical Crosshairs */}
                    <line x1="-98" y1="0" x2="98" y2="0" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
                    <line x1="0" y1="-98" x2="0" y2="98" stroke="#f43f5e" strokeWidth="1.5" />

                    {/* Render Visible Spectral Lines within Reticle */}
                    {fovLines.map((line) => {
                      // 1 degree = 45 SVG units
                      const svgX = line.offsetFromCrosshair_deg * 45;
                      const lineWidth = line.isDirectRay ? slitWidth * 6 : slitWidth * 3.5;
                      return (
                        <g key={line.id} transform={`translate(${svgX}, 0)`}>
                          {/* Glow halo */}
                          <rect
                            x={-lineWidth * 1.5}
                            y="-90"
                            width={lineWidth * 3}
                            height="180"
                            fill={line.colorHex}
                            opacity="0.25"
                          />
                          {/* Main spectral line */}
                          <rect
                            x={-lineWidth / 2}
                            y="-90"
                            width={lineWidth}
                            height="180"
                            fill={line.colorHex}
                            opacity="0.95"
                          />
                          {/* Top label */}
                          <text
                            x="0"
                            y="-75"
                            fill={line.colorHex}
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {line.id === 'direct_slit' ? 'DIRECT' : line.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>FOV Span: ±2.0°</span>
                  <span>Extremum Status: <strong className={isAtExtremum ? 'text-emerald-400' : 'text-amber-400'}>{isAtExtremum ? 'Dm Turning Point' : 'In Transit'}</strong></span>
                </div>
              </div>

              {/* Dual Vernier Magnifiers Deck (V1 and V2) */}
              <div className="space-y-3">
                {/* Vernier 1 Magnifier Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5" />
                      Vernier 1 (V₁) Magnifying Loupe
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">Offset: 0°</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">MSR (0.5°)</div>
                      <div className="text-xs font-bold text-slate-200">{currentV1.msr_str}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">VSC (0-29)</div>
                      <div className="text-xs font-bold text-amber-400">{currentV1.vsc} div</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Total TR</div>
                      <div className="text-xs font-bold text-emerald-400">{currentV1.tr_str}</div>
                    </div>
                  </div>
                </div>

                {/* Vernier 2 Magnifier Card (180° Diametrically Opposite) */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-sky-400 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5" />
                      Vernier 2 (V₂) Magnifying Loupe
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">Offset: 180°</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">MSR (0.5°)</div>
                      <div className="text-xs font-bold text-slate-200">{currentV2.msr_str}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">VSC (0-29)</div>
                      <div className="text-xs font-bold text-sky-400">{currentV2.vsc} div</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Total TR</div>
                      <div className="text-xs font-bold text-emerald-400">{currentV2.tr_str}</div>
                    </div>
                  </div>
                </div>

                {/* Quick Observation Recording Toolbar */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Record Current Angles to Observation Table</span>
                    <span className="text-amber-400 font-mono">Side: {activeSide.toUpperCase()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleRecordReading('yellow_1', activeSide)}
                      className="py-1.5 px-2 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-200 font-semibold"
                    >
                      Record Yellow 1 ({activeSide.toUpperCase()})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecordReading('yellow_2', activeSide)}
                      className="py-1.5 px-2 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-200 font-semibold"
                    >
                      Record Yellow 2 ({activeSide.toUpperCase()})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rotational Micrometer Controls & Alignment Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Prism Table Angle & Turning Point Controller */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Prism Table Rotation (Incidence i)
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-400">
                i = {currentIncidentAngle_i.toFixed(2)}°
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <label htmlFor="table-angle-slider" className="text-[11px]">Table Angle (Normal to Grating):</label>
                <span className="font-mono text-slate-200 font-bold">{tableAngle_deg.toFixed(2)}°</span>
              </div>
              <input
                id="table-angle-slider"
                aria-label="Adjust prism table angle"
                type="range"
                min="0.0"
                max="25.0"
                step="0.05"
                value={tableAngle_deg}
                onChange={(e) => adjustTable(parseFloat(e.target.value) - tableAngle_deg)}
                className="w-full accent-amber-500 cursor-pointer"
              />

              <div className="flex items-center justify-between gap-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => adjustTable(-1.0)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  -1.0°
                </button>
                <button
                  type="button"
                  onClick={() => adjustTable(-0.1)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  -0.1°
                </button>
                <button
                  type="button"
                  onClick={() => adjustTable(0.1)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  +0.1°
                </button>
                <button
                  type="button"
                  onClick={() => adjustTable(1.0)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  +1.0°
                </button>
              </div>

              {/* Turning Point Extremum Alert Card */}
              <div className={`p-2.5 rounded-xl border text-[11px] font-mono ${
                isAtExtremum
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>Theoretical Dm/2:</span>
                  <span className="text-amber-400">{(targetDm / 2).toFixed(3)}°</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Deviation Gradient dD/di:</span>
                  <span className={isAtExtremum ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                    {deviationY1.dD_di.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Telescope Angle & Fine Tangent Screw Controller */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Telescope Rotation &amp; Tangent Screw
              </span>
              <button
                type="button"
                onClick={() => setIsTelescopeClamped(!isTelescopeClamped)}
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                  isTelescopeClamped
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isTelescopeClamped ? 'CLAMPED' : 'UNCLAMPED'}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <label htmlFor="telescope-angle-slider" className="text-[11px]">Telescope Rotation Angle:</label>
                <span className="font-mono text-slate-200 font-bold">{telescopeAngle.toFixed(2)}°</span>
              </div>
              <input
                id="telescope-angle-slider"
                aria-label="Adjust telescope angle"
                type="range"
                min="140.0"
                max="220.0"
                step="0.05"
                value={telescopeAngle}
                disabled={isTelescopeClamped}
                onChange={(e) => setTelescopeAngle(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer disabled:opacity-40"
              />

              {/* Tangent Screw Fine Steps (1 minute = 0.0167°) */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 font-mono">Fine Tangent Screw:</div>
                <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
                  <button
                    type="button"
                    disabled={isTelescopeClamped}
                    onClick={() => adjustTelescope(-0.1)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                  >
                    -6' (-0.1°)
                  </button>
                  <button
                    type="button"
                    disabled={isTelescopeClamped}
                    onClick={() => adjustTelescope(-1 / 60)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                  >
                    -1' (LC)
                  </button>
                  <button
                    type="button"
                    disabled={isTelescopeClamped}
                    onClick={() => adjustTelescope(1 / 60)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                  >
                    +1' (LC)
                  </button>
                  <button
                    type="button"
                    disabled={isTelescopeClamped}
                    onClick={() => adjustTelescope(0.1)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                  >
                    +6' (+0.1°)
                  </button>
                </div>
              </div>

              {/* Auto-Alignment Helpers */}
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Auto-Alignment Helpers:</div>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleAutoAlignMinimumDeviation('left')}
                    className="p-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 text-amber-200"
                  >
                    Align Left Min Deviation (Y1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoAlignMinimumDeviation('right')}
                    className="p-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 text-amber-200"
                  >
                    Align Right Min Deviation (Y1)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Target Spectral Line Selector & Apparatus Specs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
              Optical Settings &amp; Target Sodium Line
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedTargetLine('yellow_1')}
                className={`p-2 rounded-xl border flex flex-col text-left transition-all ${
                  selectedTargetLine === 'yellow_1'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-bold">Yellow 1 (D₁)</span>
                <span className="text-[10px] font-mono text-amber-400">λ = 589.6 nm</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTargetLine('yellow_2')}
                className={`p-2 rounded-xl border flex flex-col text-left transition-all ${
                  selectedTargetLine === 'yellow_2'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-bold">Yellow 2 (D₂)</span>
                <span className="text-[10px] font-mono text-amber-400">λ = 589.0 nm</span>
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span>Grating Rulings (N):</span>
                <select
                  aria-label="Select grating rulings"
                  value={gratingRulingsPerInch}
                  onChange={(e) => setGratingRulingsPerInch(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-[11px]"
                >
                  <option value={15000}>15,000 LPI (Standard)</option>
                  <option value={25000}>25,000 LPI</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span>Slit Width:</span>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Adjust collimator slit width"
                    type="range"
                    min="0.2"
                    max="1.5"
                    step="0.1"
                    value={slitWidth}
                    onChange={(e) => setSlitWidth(parseFloat(e.target.value))}
                    className="w-16 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-slate-200">{slitWidth.toFixed(1)} mm</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Least Count (LC):</span>
                <span className="text-slate-200">1' = (1/60)°</span>
              </div>
              <div className="flex justify-between">
                <span>Diffraction Order n:</span>
                <span className="text-slate-200">1 (First Order)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theory & Derivations Expandable Drawer */}
      {showCalculationsDrawer && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              Experiment 5 Mathematical Theory &amp; Minimum Deviation Condition
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
              <div className="font-bold text-amber-300">1. Oblique Incidence Grating Equation:</div>
              <p className="text-slate-400">
                (e + d)(sin i + sin θ) = n λ<br />
                Total Deviation: D(i) = i + θ(i)
              </p>
              <div className="font-bold text-amber-300 pt-1">2. Minimum Deviation Condition:</div>
              <p className="text-slate-400">
                dD/di = 1 + dθ/di = 0  ⇒  cos i - cos θ = 0  ⇒  i = θ = D_m / 2
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="font-bold text-amber-300">3. Wavelength Equation (Manual p. 54):</div>
              <p className="text-emerald-400 font-bold">
                2(e + d) sin(D_m / 2) = n λ  ⇒  λ = [2(e + d) sin(D_m / 2)] / n
              </p>
              <div className="font-bold text-amber-300 pt-1">4. Erratum in Printed Syllabus:</div>
              <p className="text-rose-300 text-[10px]">
                Manual p. 55 Table writes "2Dm = (a-b)/2", which confuses 2Dm = |a-b| with Dm = |a-b|/2.
                The software calculates true minimum deviation angle Dm = |a - b| / 2.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Observation Table Section (Manual p. 55) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Observation Table: Determination of Angle of Minimum Deviation for 1st Order Spectrum (Manual p. 55)
            </h3>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleResetObservations}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Theoretical
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

        {/* Observation Table with Exact Headers */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold text-center">
                <th rowSpan={2} className="p-2.5 border-r border-slate-800">Colour of spectral line</th>
                <th rowSpan={2} className="p-2.5 border-r border-slate-800">Vernier side</th>
                <th colSpan={3} className="p-2.5 border-r border-slate-800 bg-slate-900/40">
                  Left side reading of Telescope (a)
                </th>
                <th colSpan={3} className="p-2.5 border-r border-slate-800 bg-slate-900/40">
                  Right side reading of telescope (b)
                </th>
                <th rowSpan={2} className="p-2.5 border-r border-slate-800 text-amber-300">
                  Minimum Deviation<br />
                  2Dm = |a - b|
                </th>
                <th rowSpan={2} className="p-2.5 text-emerald-400">
                  Dm = (a - b)/2
                </th>
              </tr>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 text-[11px] text-center">
                <th className="p-1.5 border-r border-slate-800">MSR</th>
                <th className="p-1.5 border-r border-slate-800">VSC</th>
                <th className="p-1.5 border-r border-slate-800 text-slate-300">TR (a)</th>
                <th className="p-1.5 border-r border-slate-800">MSR</th>
                <th className="p-1.5 border-r border-slate-800">VSC</th>
                <th className="p-1.5 border-r border-slate-800 text-slate-300">TR (b)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-center">
              {observationRows.map((r, idx) => (
                <tr key={`${r.colorKey}_${r.vernier}`} className="hover:bg-slate-800/30">
                  {idx % 2 === 0 && (
                    <td rowSpan={2} className="p-2.5 font-bold text-amber-300 border-r border-slate-800">
                      {r.colorName}
                    </td>
                  )}
                  <td className="p-2.5 font-bold text-sky-400 border-r border-slate-800">{r.vernier}</td>

                  {/* Left (a) */}
                  <td className="p-2 border-r border-slate-800 text-slate-300">{r.leftReading.msr_str}</td>
                  <td className="p-2 border-r border-slate-800 text-amber-400">{r.leftReading.vsc}'</td>
                  <td className="p-2 border-r border-slate-800 font-bold text-slate-200">{r.leftReading.tr_str}</td>

                  {/* Right (b) */}
                  <td className="p-2 border-r border-slate-800 text-slate-300">{r.rightReading.msr_str}</td>
                  <td className="p-2 border-r border-slate-800 text-amber-400">{r.rightReading.vsc}'</td>
                  <td className="p-2 border-r border-slate-800 font-bold text-slate-200">{r.rightReading.tr_str}</td>

                  {/* 2Dm and Dm */}
                  <td className="p-2 border-r border-slate-800 font-bold text-amber-300">
                    {r.minimumDeviation_2Dm_deg.toFixed(2)}°
                  </td>
                  <td className="p-2 font-bold text-emerald-400">
                    {r.minimumDeviation_Dm_deg.toFixed(2)}°
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Final Result Table (Manual p. 55) */}
        <div className="space-y-2 pt-2">
          <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
            Result: Calculated Wavelengths of Sodium Doublet Spectral Lines
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold text-center">
                  <th className="p-2.5">Colours</th>
                  <th className="p-2.5">Standard Wavelength (Å / nm)</th>
                  <th className="p-2.5">Mean Minimum Deviation (Dm)</th>
                  <th className="p-2.5 text-emerald-400">Observed Wavelength λ (nm)</th>
                  <th className="p-2.5 text-emerald-400">Observed Wavelength λ (Å)</th>
                  <th className="p-2.5">Percentage Error (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-center">
                {summaryResults.map((s) => (
                  <tr key={s.colorKey} className="hover:bg-slate-800/30">
                    <td className="p-2.5 font-bold text-amber-300">{s.colorName}</td>
                    <td className="p-2.5 text-slate-300">{s.standardWavelength_Angstrom} Å ({s.standardWavelength_nm} nm)</td>
                    <td className="p-2.5 text-amber-400 font-bold">{s.mean_Dm_deg.toFixed(2)}° ({s.mean_Dm_dms.formatted})</td>
                    <td className="p-2.5 font-bold text-emerald-400">{s.observedWavelength_nm.toFixed(1)} nm</td>
                    <td className="p-2.5 font-bold text-emerald-400">{s.observedWavelength_Angstrom.toFixed(0)} Å</td>
                    <td className="p-2.5 text-slate-400">{s.percentageError.toFixed(2)}%</td>
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
