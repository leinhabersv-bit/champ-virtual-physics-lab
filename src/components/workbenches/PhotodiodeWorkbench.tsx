import React, { useState, useMemo } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import {
  photodiodeSimulator,
  DarkCurrentReading,
  FixedDistanceReading,
  FixedVoltageReading,
} from '../../engine/photodiodeSimulator';
import {
  photodiodeNetlistValidator,
  WireConnection,
} from '../../engine/photodiodeNetlist';
import {
  Sun,
  Moon,
  ArrowLeft,
  Printer,
  Compass,
  Award,
  HelpCircle,
  Calculator,
  Download,
  Table,
  Sliders,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';

interface PhotodiodeWorkbenchProps {
  metadata: ExperimentMetadata;
  onBackToDashboard: () => void;
  onOpenViva: () => void;
}

export const PhotodiodeWorkbench: React.FC<PhotodiodeWorkbenchProps> = ({
  metadata,
  onBackToDashboard,
  onOpenViva,
}) => {
  // Mode: Guided vs Exam vs Viva
  const [activeMode, setActiveMode] = useState<'guided' | 'exam'>('guided');
  const [guidedStep, setGuidedStep] = useState<number>(1);

  // Hardware Controls
  const [powerSupplyVoltage_V, setPowerSupplyVoltage_V] = useState<number>(2.0); // 0.0 to 5.0 V
  const [lampDistance_cm, setLampDistance_cm] = useState<number>(10.0); // 5 to 25 cm
  const [lampIsOn, setLampIsOn] = useState<boolean>(true);
  const [isShielded, setIsShielded] = useState<boolean>(false);
  const [wiringConfiguration, setWiringConfiguration] = useState<WireConnection[]>(
    photodiodeNetlistValidator.getDefaultCorrectWiring()
  );
  const [activeTableTab, setActiveTableTab] = useState<'table1' | 'table2' | 'table3'>('table1');
  const [showTheoryDrawer, setShowTheoryDrawer] = useState<boolean>(false);
  const [graphMode, setGraphMode] = useState<'iv_curves' | 'intensity'>('iv_curves');

  // Observation Tables State (Initialized to theoretical baselines)
  const [table1Rows, setTable1Rows] = useState<DarkCurrentReading[]>(() =>
    photodiodeSimulator.generateTable1DarkCurrent()
  );
  const [table2Rows, setTable2Rows] = useState<FixedDistanceReading[]>(() =>
    photodiodeSimulator.generateTable2FixedDistance()
  );
  const [table3Rows, setTable3Rows] = useState<FixedVoltageReading[]>(() =>
    photodiodeSimulator.generateTable3FixedVoltage()
  );

  // Circuit topology validation
  const circuitEval = useMemo(
    () => photodiodeNetlistValidator.evaluateCircuit(wiringConfiguration),
    [wiringConfiguration]
  );

  // Live simulation calculations
  const liveReadings = useMemo(() => {
    if (!circuitEval.isValid) {
      if (circuitEval.isForwardBiased) {
        // Forward bias high current
        const fwd = photodiodeSimulator.calculateForwardBiasCurrent(powerSupplyVoltage_V);
        return {
          voltmeter_V: powerSupplyVoltage_V,
          ammeter_uA: fwd.current_mA * 1000,
          totalCurrent_A: (fwd.current_mA * 1000) * 1e-6,
          darkCurrent_uA: 0.0,
          photocurrent_uA: 0.0,
          opticalPower_uW: 0.0,
          opticalPower_W: 0.0,
          responsivity_AW: null,
          percentageChange_pct: null,
          isForwardBiased: true,
        };
      }
      return {
        voltmeter_V: 0.0,
        ammeter_uA: 0.0,
        totalCurrent_A: 0.0,
        darkCurrent_uA: 0.0,
        photocurrent_uA: 0.0,
        opticalPower_uW: 0.0,
        opticalPower_W: 0.0,
        responsivity_AW: null,
        percentageChange_pct: null,
        isForwardBiased: false,
      };
    }

    const calc = photodiodeSimulator.calculateTotalCurrent(
      powerSupplyVoltage_V,
      lampDistance_cm,
      lampIsOn,
      isShielded
    );

    return {
      voltmeter_V: powerSupplyVoltage_V,
      ammeter_uA: calc.totalCurrent_uA,
      totalCurrent_A: calc.totalCurrent_A,
      darkCurrent_uA: calc.darkCurrent_uA,
      photocurrent_uA: calc.photocurrent_uA,
      opticalPower_uW: calc.opticalPower_uW,
      opticalPower_W: calc.opticalPower_W,
      responsivity_AW: calc.responsivity_AW,
      percentageChange_pct: calc.percentageChange_pct,
      isForwardBiased: false,
    };
  }, [circuitEval, powerSupplyVoltage_V, lampDistance_cm, lampIsOn, isShielded]);

  // Record current measurement point into active table
  const handleRecordActivePoint = () => {
    if (activeTableTab === 'table1') {
      // Find row matching current voltage or append
      setTable1Rows((prev) => {
        const existingIdx = prev.findIndex((r) => Math.abs(r.reverseVoltage_V - powerSupplyVoltage_V) < 0.1);
        const newReading: DarkCurrentReading = {
          sNo: existingIdx >= 0 ? prev[existingIdx].sNo : prev.length + 1,
          reverseVoltage_V: Number(powerSupplyVoltage_V.toFixed(2)),
          darkCurrent_uA: liveReadings.ammeter_uA,
          darkCurrent_A: liveReadings.totalCurrent_A,
        };
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newReading;
          return updated;
        }
        return [...prev, newReading].sort((a, b) => a.reverseVoltage_V - b.reverseVoltage_V);
      });
    } else if (activeTableTab === 'table2') {
      setTable2Rows((prev) => {
        const existingIdx = prev.findIndex((r) => Math.abs(r.reverseVoltage_V - powerSupplyVoltage_V) < 0.1);
        if (existingIdx >= 0) {
          const updated = [...prev];
          const row = { ...updated[existingIdx] };
          if (Math.abs(lampDistance_cm - 10.0) < 2.0) {
            row.current_D1_uA = liveReadings.ammeter_uA;
            row.current_D1_A = liveReadings.totalCurrent_A;
            row.photocurrent_D1_uA = liveReadings.photocurrent_uA;
          } else {
            row.current_D2_uA = liveReadings.ammeter_uA;
            row.current_D2_A = liveReadings.totalCurrent_A;
            row.photocurrent_D2_uA = liveReadings.photocurrent_uA;
          }
          updated[existingIdx] = row;
          return updated;
        }
        return prev;
      });
    } else if (activeTableTab === 'table3') {
      setTable3Rows((prev) => {
        const existingIdx = prev.findIndex(
          (r) =>
            Math.abs(r.reverseVoltage_V - powerSupplyVoltage_V) < 0.2 &&
            Math.abs(r.distance_cm - lampDistance_cm) < 1.0
        );
        const newRow: FixedVoltageReading = {
          sNo: existingIdx >= 0 ? prev[existingIdx].sNo : prev.length + 1,
          distance_cm: Math.round(lampDistance_cm),
          reverseVoltage_V: Number(powerSupplyVoltage_V.toFixed(1)),
          current_uA: liveReadings.ammeter_uA,
          current_A: liveReadings.totalCurrent_A,
          photocurrent_uA: liveReadings.photocurrent_uA,
          opticalPower_uW: liveReadings.opticalPower_uW,
          responsivity_AW: liveReadings.responsivity_AW,
          percentageChange_pct: liveReadings.percentageChange_pct,
        };
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newRow;
          return updated;
        }
        return [...prev, newRow];
      });
    }
  };

  // Wire presets
  const handleAutoWireReverseBias = () => {
    setWiringConfiguration(photodiodeNetlistValidator.getDefaultCorrectWiring());
  };

  const handleWireForwardBias = () => {
    // Inverted polarity
    setWiringConfiguration([
      { id: 'w1', fromTerminal: 'psu_pos', toTerminal: 'resistor_t1', color: '#ef4444' },
      { id: 'w2', fromTerminal: 'resistor_t2', toTerminal: 'ammeter_pos', color: '#ef4444' },
      { id: 'w3', fromTerminal: 'ammeter_neg', toTerminal: 'photodiode_anode', color: '#ef4444' }, // Polarity error!
      { id: 'w4', fromTerminal: 'photodiode_cathode', toTerminal: 'psu_neg', color: '#000000' },
      { id: 'w5', fromTerminal: 'photodiode_anode', toTerminal: 'voltmeter_pos', color: '#3b82f6' },
      { id: 'w6', fromTerminal: 'photodiode_cathode', toTerminal: 'voltmeter_neg', color: '#000000' },
    ]);
  };

  const handleDisconnectWires = () => {
    setWiringConfiguration([]);
  };

  // Export CSV function for observation tables
  const handleExportCSV = () => {
    let csv = '=== TABLE 1: DARK CURRENT READINGS (0 TO 5 V) ===\n';
    csv += 'S.No,Voltmeter Reading (V),Dark Current (uA),Dark Current (A)\n';
    table1Rows.forEach((r) => {
      csv += `${r.sNo},${r.reverseVoltage_V.toFixed(2)},${r.darkCurrent_uA.toFixed(4)},${r.darkCurrent_A.toExponential(4)}\n`;
    });

    csv += '\n=== TABLE 2: PHOTOCURRENT READINGS AT FIXED DISTANCE (D1=10 cm, D2=15 cm) ===\n';
    csv += 'S.No,Voltmeter (V),Current D1=10cm (uA),Current D1 (A),Current D2=15cm (uA),Current D2 (A),Iph D1 (uA),Iph D2 (uA)\n';
    table2Rows.forEach((r) => {
      csv += `${r.sNo},${r.reverseVoltage_V.toFixed(2)},${r.current_D1_uA.toFixed(3)},${r.current_D1_A.toExponential(4)},${r.current_D2_uA.toFixed(3)},${r.current_D2_A.toExponential(4)},${r.photocurrent_D1_uA.toFixed(3)},${r.photocurrent_D2_uA.toFixed(3)}\n`;
    });

    csv += '\n=== TABLE 3: PHOTOCURRENT READINGS AT FIXED REVERSE VOLTAGE ===\n';
    csv += 'S.No,Distance (cm),Voltmeter (V),Ammeter (uA),Current (A),Photocurrent Iph (uA),Optical Power (uW),Responsivity (A/W),Percentage Change (%)\n';
    table3Rows.forEach((r) => {
      csv += `${r.sNo},${r.distance_cm},${r.reverseVoltage_V.toFixed(1)},${r.current_uA.toFixed(3)},${r.current_A.toExponential(4)},${r.photocurrent_uA.toFixed(3)},${r.opticalPower_uW.toFixed(2)},${r.responsivity_AW ?? 'N/A'},${r.percentageChange_pct ?? 'N/A'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'photodiode_iv_characteristics_experiment6.csv');
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
                EXPT 06 • BAPHY105
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                [REVERSE-BIAS PHOTOCONDUCTIVE MODE • TRIPLE PROCEDURE]
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
            onClick={() => setShowTheoryDrawer(!showTheoryDrawer)}
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

      {/* Guided Mode Stepper Banner */}
      {activeMode === 'guided' && (
        <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-900/60 rounded-2xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold shrink-0">
              {guidedStep}
            </div>
            <div>
              <span className="font-bold text-amber-100 text-xs">
                {guidedStep === 1 && 'Step 1: Dark Current Characterization (Opaque Shield ON, 0 to 5 V)'}
                {guidedStep === 2 && 'Step 2: Photocurrent at Fixed Distances (D1 = 10 cm, D2 = 15 cm)'}
                {guidedStep === 3 && 'Step 3: Photocurrent vs Light Intensity/Distance at Fixed Reverse Bias (1V, 2V, 3V)'}
                {guidedStep === 4 && 'Step 4: Responsivity (R = Iph / Popt) & Percentage Change (%Δ) Analysis'}
              </span>
              <p className="text-amber-300/90 text-[11px] mt-0.5">
                {guidedStep === 1 && 'Verify reverse bias wiring. Apply opaque shielding box or turn lamp OFF. Vary reverse voltage from 0 to 5 V to record Table 1 dark current ID.'}
                {guidedStep === 2 && 'Remove shield and switch ON LED lamp. Fix distance at D1 = 10 cm, then D2 = 15 cm. Vary VR from 0 to 5 V and record Table 2.'}
                {guidedStep === 3 && 'Fix reverse voltage at 1V, 2V, 3V. Vary lamp carriage distance between 5 cm and 20 cm to observe 1/d² intensity dependence in Table 3.'}
                {guidedStep === 4 && 'Calculate Iph = Iillum - ID, optical power Popt, responsivity R (A/W), and %Δ. Verify linear photocurrent vs optical irradiance.'}
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

      {/* Main Interactive Stage & Controls Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Visual Circuit Bench & SVG Hardware (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Optoelectronic Breadboard &amp; Photodiode Testbench
              </span>

              {/* Quick Wiring Control Tools */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={handleAutoWireReverseBias}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-semibold"
                >
                  Auto-Wire Reverse Bias (Standard)
                </button>
                <button
                  type="button"
                  onClick={handleWireForwardBias}
                  className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold"
                  title="Test wrong polarity warning"
                >
                  Test Forward Bias
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectWires}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Circuit Status Notification Alert */}
            <div
              className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
                circuitEval.isValid
                  ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                  : circuitEval.isForwardBiased
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {circuitEval.isValid ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{circuitEval.message}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                {circuitEval.status}
              </span>
            </div>

            {/* SVG Apparatus & Optical Rail Canvas */}
            <div className="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-3">
              <svg viewBox="0 0 760 360" className="w-full h-auto max-h-[380px] select-none">
                <defs>
                  {/* Glowing gradients for optical beam and LED lamp */}
                  <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.15" />
                  </linearGradient>

                  <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
                    <stop offset="30%" stopColor="#fde047" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Wooden Optical Bench Base */}
                <rect x="20" y="290" width="720" height="40" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                {/* Distance Scale Markings on Rail (5 to 30 cm) */}
                {Array.from({ length: 26 }).map((_, i) => {
                  const cm = i + 5;
                  const x = 50 + (cm - 5) * 26;
                  return (
                    <g key={cm}>
                      <line x1={x} y1="290" x2={x} y2={cm % 5 === 0 ? "304" : "296"} stroke="#64748b" strokeWidth={cm % 5 === 0 ? 1.5 : 1} />
                      {cm % 5 === 0 && (
                        <text x={x} y="318" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                          {cm}cm
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* 1. DC Power Supply Chassis (Left) */}
                <g transform="translate(40, 40)">
                  <rect x="0" y="0" width="160" height="110" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  <rect x="15" y="15" width="130" height="32" rx="4" fill="#0f172a" stroke="#334155" />
                  <text x="80" y="37" fill="#38bdf8" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {powerSupplyVoltage_V.toFixed(2)} V
                  </text>
                  <text x="80" y="60" fill="#94a3b8" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                    0-30V DC SUPPLY
                  </text>
                  {/* Output Terminals */}
                  <circle cx="45" cy="85" r="9" fill="#dc2626" stroke="#f87171" strokeWidth="1.5" />
                  <text x="45" y="88" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">+</text>
                  <circle cx="115" cy="85" r="9" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                  <text x="115" y="88" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">-</text>
                </g>

                {/* 2. Microammeter Gauge (Top Center, 0–100 µA) */}
                <g transform="translate(230, 30)">
                  <rect x="0" y="0" width="130" height="120" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  {/* Gauge Window */}
                  <path d="M 15 70 A 50 50 0 0 1 115 70 Z" fill="#0f172a" stroke="#334155" />
                  {/* Ticks on scale 0 to 100 */}
                  {Array.from({ length: 6 }).map((_, i) => {
                    const uA = i * 20;
                    const angle = -135 + i * 18; // -135 to -45 deg
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 65 + Math.cos(rad) * 44;
                    const y1 = 70 + Math.sin(rad) * 44;
                    const x2 = 65 + Math.cos(rad) * 38;
                    const y2 = 70 + Math.sin(rad) * 38;
                    return <line key={uA} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="1" />;
                  })}
                  {/* Needle */}
                  {(() => {
                    const clampedVal = Math.min(100, Math.max(0, liveReadings.ammeter_uA));
                    const needleAngle = -135 + (clampedVal / 100) * 90;
                    const nRad = (needleAngle * Math.PI) / 180;
                    const nx = 65 + Math.cos(nRad) * 42;
                    const ny = 70 + Math.sin(nRad) * 42;
                    return <line x1="65" y1="70" x2={nx} y2={ny} stroke="#ef4444" strokeWidth="1.8" />;
                  })()}
                  <circle cx="65" cy="70" r="4" fill="#64748b" />
                  <text x="65" y="85" fill="#f59e0b" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {liveReadings.ammeter_uA.toFixed(2)} µA
                  </text>
                  <text x="65" y="98" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    MICROAMMETER (0-100µA)
                  </text>
                  {/* Terminals */}
                  <circle cx="35" cy="110" r="6" fill="#dc2626" />
                  <circle cx="95" cy="110" r="6" fill="#0f172a" stroke="#64748b" />
                </g>

                {/* 3. Voltmeter Gauge (Top Right, 0–10 V) */}
                <g transform="translate(390, 30)">
                  <rect x="0" y="0" width="130" height="120" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  <rect x="15" y="20" width="100" height="40" rx="4" fill="#0f172a" stroke="#334155" />
                  <text x="65" y="47" fill="#38bdf8" fontSize="15" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {liveReadings.voltmeter_V.toFixed(2)} V
                  </text>
                  <text x="65" y="80" fill="#94a3b8" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                    VOLTMETER (0-10V)
                  </text>
                  <text x="65" y="95" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    Across Photodiode
                  </text>
                  {/* Terminals */}
                  <circle cx="35" cy="110" r="6" fill="#dc2626" />
                  <circle cx="95" cy="110" r="6" fill="#0f172a" stroke="#64748b" />
                </g>

                {/* 4. Protective Current Limiting Resistor (1 kΩ) */}
                <g transform="translate(110, 180)">
                  <rect x="0" y="0" width="80" height="28" rx="6" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                  {/* Color bands: Brown (1), Black (0), Red (x100), Gold (5%) = 1 kΩ */}
                  <rect x="20" y="0" width="5" height="28" fill="#78350f" />
                  <rect x="32" y="0" width="5" height="28" fill="#0f172a" />
                  <rect x="44" y="0" width="5" height="28" fill="#dc2626" />
                  <rect x="58" y="0" width="5" height="28" fill="#fbbf24" />
                  <text x="40" y="38" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    R = 1 kΩ
                  </text>
                </g>

                {/* 5. Photodiode Mount on Optical Rail (Fixed at 50 cm SVG mark = 5 cm origin) */}
                <g transform="translate(180, 210)">
                  {/* Stand Post */}
                  <rect x="25" y="30" width="10" height="50" fill="#475569" stroke="#64748b" />
                  <rect x="10" y="75" width="40" height="8" rx="2" fill="#1e293b" stroke="#64748b" />
                  {/* Photodiode Can Package (TO-18 / Circular Window) */}
                  <circle cx="30" cy="20" r="18" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
                  <circle cx="30" cy="20" r="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                  {/* Semiconductor Die Active Area */}
                  <rect x="25" y="15" width="10" height="10" fill="#0369a1" />

                  {/* Cathode (-) and Anode (+) Terminal Leads */}
                  <circle cx="15" cy="20" r="4" fill="#f59e0b" />
                  <text x="8" y="23" fill="#f59e0b" fontSize="8" fontWeight="bold">K (-)</text>
                  <circle cx="45" cy="20" r="4" fill="#ef4444" />
                  <text x="52" y="23" fill="#ef4444" fontSize="8" fontWeight="bold">A (+)</text>

                  <text x="30" y="-4" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    PHOTODIODE
                  </text>

                  {/* Removable Opaque Shielding Box (Rendered if isShielded) */}
                  {isShielded && (
                    <g transform="translate(5, -2)">
                      <rect x="0" y="0" width="50" height="42" rx="4" fill="#020617" stroke="#475569" strokeWidth="2" />
                      <text x="25" y="24" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        DARK SHIELD
                      </text>
                    </g>
                  )}
                </g>

                {/* 6. Movable LED Light Source Carriage */}
                {(() => {
                  // Rail mapping: distance 5 cm to 25 cm -> x = 240 + (distance - 5) * 22
                  const lampX = 240 + (lampDistance_cm - 5) * 22;
                  return (
                    <g transform={`translate(${lampX}, 210)`}>
                      {/* Optical Conical Beam (directed towards photodiode on left) */}
                      {lampIsOn && !isShielded && (
                        <polygon
                          points={`0,20 -${lampX - 210},10 -${lampX - 210},30`}
                          fill="url(#beamGradient)"
                          opacity="0.8"
                        />
                      )}

                      {/* Lamp Stand Post on Rail */}
                      <rect x="0" y="30" width="10" height="50" fill="#475569" stroke="#64748b" />
                      <rect x="-15" y="75" width="40" height="8" rx="2" fill="#1e293b" stroke="#64748b" />

                      {/* Lamp Housing */}
                      <rect x="0" y="4" width="30" height="32" rx="5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                      <circle cx="2" cy="20" r="8" fill={lampIsOn ? 'url(#lampGlow)' : '#0f172a'} />
                      {lampIsOn && <circle cx="2" cy="20" r="4" fill="#ffffff" />}

                      <text x="15" y="-4" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        LED LAMP ({lampDistance_cm} cm)
                      </text>
                    </g>
                  );
                })()}

                {/* 7. Animated Circuit Wires */}
                {circuitEval.isValid && (
                  <g strokeWidth="2" strokeLinecap="round" fill="none">
                    {/* PSU(+) to Resistor */}
                    <path d="M 85 125 L 85 194 L 110 194" stroke="#ef4444" />
                    {/* Resistor to Microammeter(+) */}
                    <path d="M 190 194 L 265 194 L 265 140" stroke="#ef4444" />
                    {/* Microammeter(-) to Photodiode Cathode (-) */}
                    <path d="M 325 140 L 325 180 L 195 180 L 195 230" stroke="#f59e0b" />
                    {/* Photodiode Anode (+) to PSU(-) */}
                    <path d="M 225 230 L 225 260 L 155 260 L 155 125" stroke="#000000" />
                    {/* Voltmeter across Photodiode */}
                    <path d="M 425 140 L 425 190 L 195 190 L 195 230" stroke="#3b82f6" strokeDasharray="3 3" />
                    <path d="M 485 140 L 485 245 L 225 245 L 225 230" stroke="#000000" strokeDasharray="3 3" />
                  </g>
                )}
              </svg>
            </div>

            {/* Live Measurements Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Reverse Bias (V_R)</div>
                <div className="text-sm font-bold text-sky-400">{liveReadings.voltmeter_V.toFixed(2)} V</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Total Reverse Current</div>
                <div className="text-sm font-bold text-amber-400">{liveReadings.ammeter_uA.toFixed(2)} µA</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Photocurrent (I_ph)</div>
                <div className="text-sm font-bold text-emerald-400">{liveReadings.photocurrent_uA.toFixed(2)} µA</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Optical Power (P_opt)</div>
                <div className="text-sm font-bold text-slate-200">{liveReadings.opticalPower_uW.toFixed(1)} µW</div>
              </div>
            </div>
          </div>

          {/* Interactive Plotter Section (Image225 Replication) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Experimental Graphical Plot: Reverse I–V Characteristics (Manual p. 58 Image225)
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setGraphMode('iv_curves')}
                  className={`px-2.5 py-1 rounded-lg ${
                    graphMode === 'iv_curves' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  I–V Curves (3rd Quadrant)
                </button>
                <button
                  type="button"
                  onClick={() => setGraphMode('intensity')}
                  className={`px-2.5 py-1 rounded-lg ${
                    graphMode === 'intensity' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Photocurrent vs 1/d²
                </button>
              </div>
            </div>

            {/* SVG Plotter Viewport */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
              {graphMode === 'iv_curves' ? (
                <svg viewBox="0 0 540 260" className="w-full h-auto max-h-[260px] select-none font-mono">
                  {/* Grid Lines */}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line key={`x-${i}`} x1={60 + i * 85} y1="30" x2={60 + i * 85} y2="210" stroke="#1e293b" strokeWidth="1" />
                  ))}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <line key={`y-${i}`} x1="60" y1={30 + i * 45} x2="485" y2={30 + i * 45} stroke="#1e293b" strokeWidth="1" />
                  ))}

                  {/* Axes */}
                  <line x1="60" y1="210" x2="485" y2="210" stroke="#475569" strokeWidth="2" />
                  <line x1="60" y1="30" x2="60" y2="210" stroke="#475569" strokeWidth="2" />

                  {/* Labels on Axes */}
                  <text x="270" y="240" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">
                    Reverse Voltage V_R (V)
                  </text>
                  <text x="20" y="120" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold" transform="rotate(-90, 20, 120)">
                    Reverse Current I_R (µA)
                  </text>

                  {/* Tick labels */}
                  {[0, 1, 2, 3, 4, 5].map((v) => (
                    <text key={v} x={60 + v * 85} y="224" fill="#64748b" fontSize="9" textAnchor="middle">
                      {v}V
                    </text>
                  ))}
                  {[0, 20, 40, 60, 80].map((u, i) => (
                    <text key={u} x="52" y={214 - i * 45} fill="#64748b" fontSize="9" textAnchor="end">
                      {u}
                    </text>
                  ))}

                  {/* 1. Curve A: Dark Current ID (Grey dotted) */}
                  <path
                    d={`M 60 210 ${table1Rows.map((r) => `L ${60 + r.reverseVoltage_V * 85} ${210 - (r.darkCurrent_uA / 80) * 180}`).join(' ')}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />

                  {/* 2. Curve B: D1 = 10 cm (Amber curve) */}
                  <path
                    d={`M 60 210 ${table2Rows.map((r) => `L ${60 + r.reverseVoltage_V * 85} ${210 - (r.current_D1_uA / 80) * 180}`).join(' ')}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />

                  {/* 3. Curve C: D2 = 15 cm (Sky curve) */}
                  <path
                    d={`M 60 210 ${table2Rows.map((r) => `L ${60 + r.reverseVoltage_V * 85} ${210 - (r.current_D2_uA / 80) * 180}`).join(' ')}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />

                  {/* Operating Point Cursor */}
                  {circuitEval.isValid && (
                    <circle
                      cx={60 + liveReadings.voltmeter_V * 85}
                      cy={210 - (Math.min(80, liveReadings.ammeter_uA) / 80) * 180}
                      r="5"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}

                  {/* Graph Legend */}
                  <g transform="translate(320, 45)">
                    <rect x="0" y="0" width="155" height="65" rx="6" fill="#0f172a" stroke="#334155" opacity="0.9" />
                    <line x1="10" y1="15" x2="30" y2="15" stroke="#f59e0b" strokeWidth="2" />
                    <text x="35" y="18" fill="#f59e0b" fontSize="9">Illuminated (D₁ = 10 cm)</text>
                    <line x1="10" y1="32" x2="30" y2="32" stroke="#38bdf8" strokeWidth="2" />
                    <text x="35" y="35" fill="#38bdf8" fontSize="9">Illuminated (D₂ = 15 cm)</text>
                    <line x1="10" y1="49" x2="30" y2="49" stroke="#94a3b8" strokeWidth="2" strokeDasharray="2 2" />
                    <text x="35" y="52" fill="#94a3b8" fontSize="9">Dark Current (I_D)</text>
                  </g>
                </svg>
              ) : (
                /* Intensity Mode: Photocurrent vs 1/d² (Linear response) */
                <svg viewBox="0 0 540 260" className="w-full h-auto max-h-[260px] select-none font-mono">
                  <line x1="60" y1="210" x2="485" y2="210" stroke="#475569" strokeWidth="2" />
                  <line x1="60" y1="30" x2="60" y2="210" stroke="#475569" strokeWidth="2" />
                  <text x="270" y="240" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">
                    Relative Optical Intensity 1/d² (cm⁻²)
                  </text>
                  <text x="20" y="120" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold" transform="rotate(-90, 20, 120)">
                    Photocurrent I_ph (µA)
                  </text>

                  {/* Scatter points for Table 3 */}
                  {table3Rows.map((r) => {
                    const invD2 = 1 / (r.distance_cm * r.distance_cm);
                    const x = 60 + (invD2 / 0.04) * 400; // 0 to 0.04 cm^-2 (5 cm)
                    const y = 210 - (r.photocurrent_uA / 100) * 170;
                    return (
                      <circle
                        key={r.sNo}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                  <text x="350" y="60" fill="#10b981" fontSize="10" fontWeight="bold">
                    Direct Linear Proportion: I_ph ∝ 1/d²
                  </text>
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Physical Controls & Experiment Operation (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Regulated DC Power Supply Controller */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Regulated Reverse Bias (0 to 5 V)
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">
                {powerSupplyVoltage_V.toFixed(2)} V
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label htmlFor="psu-voltage-slider" className="text-[11px] text-slate-400">
                Adjust DC Voltage Knob:
              </label>
              <input
                id="psu-voltage-slider"
                aria-label="Adjust reverse bias voltage"
                type="range"
                min="0.0"
                max="5.0"
                step="0.1"
                value={powerSupplyVoltage_V}
                onChange={(e) => setPowerSupplyVoltage_V(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />

              <div className="grid grid-cols-4 gap-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setPowerSupplyVoltage_V((v) => Math.max(0, Number((v - 0.5).toFixed(2))))}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-center"
                >
                  -0.5V
                </button>
                <button
                  type="button"
                  onClick={() => setPowerSupplyVoltage_V((v) => Math.max(0, Number((v - 0.1).toFixed(2))))}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-center"
                >
                  -0.1V
                </button>
                <button
                  type="button"
                  onClick={() => setPowerSupplyVoltage_V((v) => Math.min(5, Number((v + 0.1).toFixed(2))))}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-center"
                >
                  +0.1V
                </button>
                <button
                  type="button"
                  onClick={() => setPowerSupplyVoltage_V((v) => Math.min(5, Number((v + 0.5).toFixed(2))))}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-center"
                >
                  +0.5V
                </button>
              </div>
            </div>
          </div>

          {/* Optical Lamp & Carriage Distance Controller */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Optical Lamp &amp; Bench Distance
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                {lampDistance_cm} cm
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Lamp Switch and Shield Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLampIsOn(!lampIsOn)}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                    lampIsOn
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {lampIsOn ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                  {lampIsOn ? 'Lamp: ON' : 'Lamp: OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsShielded(!isShielded)}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                    isShielded
                      ? 'bg-slate-800 border-slate-600 text-slate-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Shield className="w-4 h-4 text-sky-400" />
                  {isShielded ? 'Shield: ON' : 'Shield: OFF'}
                </button>
              </div>

              {/* Distance Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <label htmlFor="distance-slider">Carriage Distance (d):</label>
                  <span className="font-mono text-slate-200 font-bold">{lampDistance_cm} cm</span>
                </div>
                <input
                  id="distance-slider"
                  aria-label="Adjust lamp distance"
                  type="range"
                  min="5"
                  max="25"
                  step="1"
                  value={lampDistance_cm}
                  onChange={(e) => setLampDistance_cm(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Fast Distance Presets for Manual Procedures */}
              <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setLampDistance_cm(5)}
                  className={`p-1 rounded ${lampDistance_cm === 5 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  5 cm
                </button>
                <button
                  type="button"
                  onClick={() => setLampDistance_cm(10)}
                  className={`p-1 rounded ${lampDistance_cm === 10 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  10 cm (D₁)
                </button>
                <button
                  type="button"
                  onClick={() => setLampDistance_cm(15)}
                  className={`p-1 rounded ${lampDistance_cm === 15 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  15 cm (D₂)
                </button>
                <button
                  type="button"
                  onClick={() => setLampDistance_cm(20)}
                  className={`p-1 rounded ${lampDistance_cm === 20 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  20 cm
                </button>
              </div>
            </div>
          </div>

          {/* Record to Active Observation Table Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Observation Table Recording</span>
              <span className="text-[10px] font-mono text-amber-400 uppercase">
                Active: {activeTableTab.toUpperCase()}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRecordActivePoint}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Record Reading to {activeTableTab === 'table1' ? 'Table 1 (Dark)' : activeTableTab === 'table2' ? 'Table 2 (Fixed Dist)' : 'Table 3 (Fixed Volt)'}
            </button>
          </div>
        </div>
      </div>

      {/* Theory & Derivations Expandable Drawer */}
      {showTheoryDrawer && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              Experiment 6 Mathematical Theory &amp; Formulae (Manual pp. 56–57)
            </h3>
            <button
              type="button"
              onClick={() => setShowTheoryDrawer(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px] text-slate-300">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="font-bold text-amber-300">1. Total Reverse Current:</div>
              <p className="text-slate-400">
                I = I_D + I_ph<br />
                Photocurrent: I_ph = I_illum - I_D (A)<br />
                where I_D = dark current (measured under opaque shielding), I_illum = current under illumination.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="font-bold text-amber-300">2. Responsivity (R):</div>
              <p className="text-emerald-400 font-bold">
                R = I_ph / P_opt (A/W)<br />
                P_opt = incident optical power (W)<br />
                P_opt ∝ 1 / d² (Inverse-square law from distance d).
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="font-bold text-amber-300">3. Percentage Change (%Δ):</div>
              <p className="text-amber-200">
                %Δ = [(I_illum - I_D) / I_D] × 100<br />
                Safe Zero-Dark-Current Protection: undefined at zero bias (I_D = 0).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Observation Tables Deck (Tables 1, 2, and 3 from Manual pp. 58–59) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        {/* Table Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTableTab('table1')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTableTab === 'table1'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table 1: Dark Current
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('table2')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTableTab === 'table2'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table 2: Fixed Distance (D₁, D₂)
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('table3')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTableTab === 'table3'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table 3: Fixed Reverse Voltage
            </button>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={() => {
                setTable1Rows(photodiodeSimulator.generateTable1DarkCurrent());
                setTable2Rows(photodiodeSimulator.generateTable2FixedDistance());
                setTable3Rows(photodiodeSimulator.generateTable3FixedVoltage());
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Tables
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

        {/* Tab 1: Readings for Dark Current (Manual p. 58 Table 1) */}
        {activeTableTab === 'table1' && (
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              Table 1. Readings for Dark Current (Manual p. 58)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold text-center">
                    <th className="p-2.5 border-r border-slate-800">S.No</th>
                    <th className="p-2.5 border-r border-slate-800 text-sky-400">Voltmeter reading (V)</th>
                    <th className="p-2.5 border-r border-slate-800 text-amber-400">Ammeter readings (µA)</th>
                    <th className="p-2.5 text-slate-300">Dark Current I_D (A)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-center">
                  {table1Rows.map((r) => (
                    <tr key={r.sNo} className="hover:bg-slate-800/30">
                      <td className="p-2 border-r border-slate-800 font-bold text-slate-400">{r.sNo}</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-sky-300">{r.reverseVoltage_V.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-amber-300">{r.darkCurrent_uA.toFixed(4)}</td>
                      <td className="p-2 text-slate-300">{r.darkCurrent_A.toExponential(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Photocurrent readings at fixed distance (Manual p. 59 Table 2) */}
        {activeTableTab === 'table2' && (
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              Table 2. Photocurrent readings at fixed distance (Manual p. 59)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold text-center">
                    <th rowSpan={2} className="p-2.5 border-r border-slate-800">S.No</th>
                    <th colSpan={3} className="p-2.5 border-r border-slate-800 bg-amber-950/20 text-amber-300">
                      Distance D₁ = 10 cm
                    </th>
                    <th colSpan={3} className="p-2.5 border-r border-slate-800 bg-sky-950/20 text-sky-300">
                      Distance D₂ = 15 cm
                    </th>
                  </tr>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 text-[11px] text-center">
                    <th className="p-1.5 border-r border-slate-800 text-sky-300">Voltmeter (V)</th>
                    <th className="p-1.5 border-r border-slate-800 text-amber-300">Ammeter (µA)</th>
                    <th className="p-1.5 border-r border-slate-800 text-emerald-400">I_ph (µA)</th>
                    <th className="p-1.5 border-r border-slate-800 text-sky-300">Voltmeter (V)</th>
                    <th className="p-1.5 border-r border-slate-800 text-amber-300">Ammeter (µA)</th>
                    <th className="p-1.5 text-emerald-400">I_ph (µA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-center">
                  {table2Rows.map((r) => (
                    <tr key={r.sNo} className="hover:bg-slate-800/30">
                      <td className="p-2 border-r border-slate-800 font-bold text-slate-400">{r.sNo}</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-sky-300">{r.reverseVoltage_V.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-amber-300">{r.current_D1_uA.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-emerald-400">{r.photocurrent_D1_uA.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-sky-300">{r.reverseVoltage_V.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-amber-300">{r.current_D2_uA.toFixed(2)}</td>
                      <td className="p-2 font-bold text-emerald-400">{r.photocurrent_D2_uA.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Photocurrent readings at fixed reverse voltage (Manual p. 59 Table 3) */}
        {activeTableTab === 'table3' && (
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              Table 3. Photocurrent readings at fixed reverse voltage (Manual p. 59)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold text-center">
                    <th className="p-2.5 border-r border-slate-800">S.No</th>
                    <th className="p-2.5 border-r border-slate-800 text-amber-300">Distance (cm)</th>
                    <th className="p-2.5 border-r border-slate-800 text-sky-400">Voltmeter (V)</th>
                    <th className="p-2.5 border-r border-slate-800 text-amber-400">Ammeter (µA)</th>
                    <th className="p-2.5 border-r border-slate-800 text-emerald-400">I_ph (µA)</th>
                    <th className="p-2.5 border-r border-slate-800 text-slate-300">Optical Power P_opt (µW)</th>
                    <th className="p-2.5 border-r border-slate-800 text-emerald-300">Responsivity R (A/W)</th>
                    <th className="p-2.5 text-purple-400">% Change (%Δ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-center">
                  {table3Rows.map((r) => (
                    <tr key={r.sNo} className="hover:bg-slate-800/30">
                      <td className="p-2 border-r border-slate-800 font-bold text-slate-400">{r.sNo}</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-amber-300">{r.distance_cm} cm</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-sky-300">{r.reverseVoltage_V.toFixed(1)} V</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-amber-300">{r.current_uA.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-emerald-400">{r.photocurrent_uA.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-800 text-slate-300">{r.opticalPower_uW.toFixed(1)}</td>
                      <td className="p-2 border-r border-slate-800 font-bold text-emerald-400">
                        {r.responsivity_AW ? `${r.responsivity_AW} A/W` : 'N/A'}
                      </td>
                      <td className="p-2 font-bold text-purple-300">
                        {r.percentageChange_pct ? `${r.percentageChange_pct.toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results & Conclusions Section */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 font-mono text-xs">
          <div className="font-bold text-amber-300 uppercase">Results &amp; Physical Verification (Manual p. 56):</div>
          <p className="text-slate-300">
            1. The I–V characteristics of the photodiode were plotted in the reverse-bias quadrant.<br />
            2. The dark current was measured as tiny reverse leakage current (I_D &lt; 0.6 µA) in the absence of light (opaque shield).<br />
            3. The photocurrent increased monotonically with light intensity (inversely proportional to the square of the distance: I_ph ∝ 1/d²).<br />
            4. Mean responsivity of silicon photodiode R ≈ 0.55 A/W in full agreement with typical optoelectronic semiconductor specifications.
          </p>
        </div>
      </div>
    </div>
  );
};
