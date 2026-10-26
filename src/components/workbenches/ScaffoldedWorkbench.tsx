import React, { useState, useMemo } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import { FormulaDefinition } from '../../types/workbench';
import { FormulaPanel } from '../primitives/FormulaPanel';
import { LabGraph, GraphSeries } from '../primitives/LabGraph';
import { heisenbergEngine } from '../../engine/heisenbergSimulator';
import { tunnelingEngine } from '../../engine/tunnelingSimulator';
import { ledPlanckEngine, LED_SPECS } from '../../engine/ledPlanckSimulator';
import { electronDiffractionEngine } from '../../engine/electronDiffractionSimulator';
import { spectrometerEngine } from '../../engine/spectrometerSimulator';
import { photodiodeEngine } from '../../engine/photodiodeSimulator';
import { quantumGatesEngine } from '../../engine/quantumGatesSimulator';
import { ArrowLeft, Cpu, AlertCircle, Award, CheckCircle } from 'lucide-react';

interface ScaffoldedWorkbenchProps {
  metadata: ExperimentMetadata;
  onBackToDashboard: () => void;
  onOpenViva: () => void;
}

export const ScaffoldedWorkbench: React.FC<ScaffoldedWorkbenchProps> = ({
  metadata,
  onBackToDashboard,
  onOpenViva,
}) => {
  // Experiment-specific state for interactive engine testing
  const [heisenbergSlitWidth, setHeisenbergSlitWidth] = useState<number>(40);
  const [tunnelingE, setTunnelingE] = useState<number>(2.0);
  const [tunnelingV0, setTunnelingV0] = useState<number>(6.0);
  const [tunnelingA, setTunnelingA] = useState<number>(1.5);
  const [ledColor, setLedColor] = useState<'blue' | 'yellow' | 'green' | 'red'>('red');
  const [ledVoltRatio, setLedVoltRatio] = useState<number>(0.65);
  const [diffractionVoltage_kV, setDiffractionVoltage_kV] = useState<number>(4.0);

  // KaTeX formula definitions per experiment
  const formulas: FormulaDefinition[] = useMemo(() => {
    switch (metadata.number) {
      case 2:
        return [
          {
            title: 'Grating Equation (Normal Incidence)',
            latex: '(e+d) \\sin\\theta = n \\lambda \\implies \\lambda = \\frac{(e+d)\\sin\\theta}{n}',
            explanation: 'Angle of diffraction θ obtained from symmetric orders: θ = (a - b) / 2.',
            sourceNote: 'Manual p. 30',
          },
          {
            title: 'Grating Element (e+d)',
            latex: 'e+d = \\frac{2.54 \\times 10^{-2}}{N} \\quad \\text{(m)}',
            explanation: 'N is the number of rulings per inch (e.g. 15,000 lines/inch).',
            sourceNote: 'Manual p. 33',
          },
        ];
      case 3:
        return [
          {
            title: "Planck's Constant from LED Knee Voltage",
            latex: 'h = V_B \\lambda \\left(\\frac{e}{c}\\right) \\quad \\text{J}\\cdot\\text{s}',
            explanation: 'Barrier potential VB determined by tangent intercept of linear region on X-axis.',
            sourceNote: 'Manual p. 35',
          },
          {
            title: 'Graphical Slope Relation',
            latex: 'V_B = \\left(\\frac{hc}{e}\\right) \\frac{1}{\\lambda} \\implies h = \\text{Slope} \\times \\left(\\frac{e}{c}\\right)',
            explanation: 'Plot of VB vs 1/λ yields straight line through origin with slope hc/e.',
            sourceNote: 'Manual p. 38',
          },
        ];
      case 4:
        return [
          {
            title: 'Transmission Coefficient (E < V0)',
            latex: 'T = \\left[1 + \\frac{V_0^2 \\sinh^2(\\kappa a)}{4E(V_0 - E)}\\right]^{-1}, \\quad \\kappa = \\sqrt{\\frac{2m(V_0 - E)}{\\hbar^2}}',
            explanation: 'Quantum probability of particle tunneling through rectangular barrier.',
            sourceNote: 'Manual p. 42',
          },
          {
            title: 'Transmitted Amplitude',
            latex: 't = \\sqrt{T}, \\quad \\log_e(T) \\propto -2\\kappa a',
            explanation: 'Exponential decay of wavefunction amplitude with increasing barrier width a.',
            sourceNote: 'Manual p. 47',
          },
        ];
      case 5:
        return [
          {
            title: 'Grating at Minimum Deviation',
            latex: '2(e+d) \\sin\\left(\\frac{D_m}{2}\\right) = n \\lambda \\implies \\lambda = \\frac{2(e+d)\\sin(D_m / 2)}{n}',
            explanation: 'Dm is the minimum deviation angle obtained when spectrum turns and reverses.',
            sourceNote: 'Manual p. 50',
          },
        ];
      case 6:
        return [
          {
            title: 'Total Photodiode Reverse Current',
            latex: 'I = I_D + I_{ph}, \\quad I_{ph} = I_{illum} - I_D',
            explanation: 'ID is dark leakage current; Iph is photocurrent proportional to illumination.',
            sourceNote: 'Manual p. 53',
          },
          {
            title: 'Responsivity (R)',
            latex: 'R = \\frac{I_{ph}}{P_{opt}} \\quad \\text{(A/W)}',
            explanation: 'Ratio of generated photocurrent to incident optical power on junction.',
            sourceNote: 'Manual p. 54',
          },
        ];
      case 7:
        return [
          {
            title: 'de Broglie Matter Wavelength',
            latex: '\\lambda_{dB} = \\frac{h}{\\sqrt{2 m_e e V}}',
            explanation: 'Wavelength of electron beam accelerated through anode voltage V.',
            sourceNote: 'Manual p. 60',
          },
          {
            title: "Thomson-Bragg Ring Diameter Relation",
            latex: 'D \\frac{d}{2L} = \\lambda \\implies D = \\frac{2L\\lambda}{d}',
            explanation: 'L is graphite-to-screen distance (135 mm); d is crystal interplanar spacing.',
            sourceNote: 'Manual p. 59',
          },
        ];
      case 8:
        return [
          {
            title: "Heisenberg Uncertainty Formulation",
            latex: '\\Delta y \\cdot \\Delta p_y = h, \\quad \\Delta y = d, \\quad \\Delta p_y = \\frac{h}{\\lambda} \\sin\\left(\\tan^{-1}\\left(\\frac{a}{D}\\right)\\right)',
            explanation: 'Transverse spatial restriction d forces momentum spread Δpy.',
            sourceNote: 'Manual p. 65',
          },
          {
            title: 'Single-Slit Quantitative Verification',
            latex: '\\frac{d}{\\lambda} \\sin\\left(\\tan^{-1}\\left(\\frac{a}{D}\\right)\\right) = 1',
            explanation: 'Universal dimensionless invariant confirming quantum uncertainty.',
            sourceNote: 'Manual p. 65 Eq. 11',
          },
        ];
      case 9:
        return [
          {
            title: 'Single Qubit Bloch Representation',
            latex: '|\\psi\\rangle = \\cos\\left(\\frac{\\theta}{2}\\right)|0\\rangle + e^{i\\phi}\\sin\\left(\\frac{\\theta}{2}\\right)|1\\rangle',
            explanation: 'Pure state on unit Bloch sphere parameterized by polar angle θ and azimuthal phase ϕ.',
            sourceNote: 'Manual p. 72',
          },
          {
            title: 'Entangled Bell State via CNOT',
            latex: '\\text{CNOT}(|+\\rangle \\otimes |0\\rangle) = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}} = |\\Phi^+\\rangle',
            explanation: 'Maximally entangled two-qubit state with non-separable density matrix.',
            sourceNote: 'Manual p. 81',
          },
        ];
      default:
        return [];
    }
  }, [metadata.number]);

  // Dynamic simulation engine output and curves for scaffolded experiments
  const liveSimulationData = useMemo(() => {
    switch (metadata.number) {
      case 8: {
        const p = { slitWidth_um: heisenbergSlitWidth, wavelength_nm: 650, screenDistance_mm: 1000, micrometerPos_mm: 0 };
        const readings = heisenbergEngine.calculateReadings(p);
        const derived = heisenbergEngine.computeDerived(readings, p);
        const curve = heisenbergEngine.generateModelCurve(p, 80);
        return {
          type: 'heisenberg',
          readings,
          derived,
          curve,
          series: [{ id: 'diff-pattern', name: 'Diffraction Intensity Profile', points: curve, color: '#f43f5e', unitY: 'µA' }] as GraphSeries[],
        };
      }
      case 4: {
        const p = { particleEnergy_eV: tunnelingE, barrierHeight_eV: tunnelingV0, barrierWidth_Angstrom: tunnelingA };
        const readings = tunnelingEngine.calculateReadings(p);
        const derived = tunnelingEngine.computeDerived(readings, p);
        const curve = tunnelingEngine.generateModelCurve(p, 80);
        return {
          type: 'tunneling',
          readings,
          derived,
          curve,
          series: [{ id: 'wavefunc', name: 'Wavefunction Re(ψ)', points: curve, color: '#38bdf8', unitY: 'arb' }] as GraphSeries[],
        };
      }
      case 3: {
        const p = { ledColor, potentiometerRatio: ledVoltRatio };
        const readings = ledPlanckEngine.calculateReadings(p);
        const derived = ledPlanckEngine.computeDerived(readings, p);
        const curve = ledPlanckEngine.generateModelCurve(p, 50);
        return {
          type: 'led',
          readings,
          derived,
          curve,
          series: [{ id: 'led-iv', name: `${LED_SPECS[ledColor].color} LED I-V`, points: curve, color: LED_SPECS[ledColor].hex, unitY: 'µA' }] as GraphSeries[],
        };
      }
      case 7: {
        const p = { anodeVoltage_kV: diffractionVoltage_kV, screenDistance_mm: 135, heaterOn: true };
        const readings = electronDiffractionEngine.calculateReadings(p);
        const derived = electronDiffractionEngine.computeDerived(readings, p);
        return { type: 'diffraction', readings, derived, series: [] };
      }
      case 2:
      case 5: {
        const p = {
          method: metadata.number === 2 ? ('normal_incidence' as const) : ('minimum_deviation' as const),
          lightSource: metadata.number === 2 ? ('mercury' as const) : ('sodium' as const),
          selectedLine: metadata.number === 2 ? 'green' : 'yellow_1',
          gratingRulingsPerInch: 15000,
          order: 1,
          telescopeAngle_deg: 0,
        };
        const readings = spectrometerEngine.calculateReadings(p);
        const derived = spectrometerEngine.computeDerived(readings, p);
        return { type: 'spectrometer', readings, derived, series: [] };
      }
      case 6: {
        const p = { reverseVoltage_V: 3.0, isShielded: false, sourceDistance_cm: 10.0 };
        const readings = photodiodeEngine.calculateReadings(p);
        const derived = photodiodeEngine.computeDerived(readings, p);
        const curve = photodiodeEngine.generateModelCurve(p, 40);
        return {
          type: 'photodiode',
          readings,
          derived,
          curve,
          series: [{ id: 'pd-iv', name: 'Photodiode Reverse I-V', points: curve, color: '#a855f7', unitY: 'µA' }] as GraphSeries[],
        };
      }
      case 9: {
        const p = { theta_rad: Math.PI / 2, phi_rad: 0, activeGate: 'H' as const, twoQubitInputState: '|00>', twoQubitGate: 'CNOT' as const };
        const readings = quantumGatesEngine.calculateReadings(p);
        const derived = quantumGatesEngine.computeDerived(readings, p);
        return { type: 'quantum', readings, derived, series: [] };
      }
      default:
        return null;
    }
  }, [metadata.number, heisenbergSlitWidth, tunnelingE, tunnelingV0, tunnelingA, ledColor, ledVoltRatio, diffractionVoltage_kV]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-[11px] font-bold tracking-wide uppercase">
                {metadata.statusBadge}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                BAPHY105 • {metadata.pdfPageRange} (Printed {metadata.printedPageRange})
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-100 mt-0.5">
              Experiment {metadata.number}: {metadata.shortTitle}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenViva}
          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
        >
          <Award className="w-4 h-4" />
          Viva Voce Practice
        </button>
      </div>

      {/* Transparent Integrity Notice */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-4 shadow-md flex items-start gap-3">
        <Cpu className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h2 className="font-bold text-indigo-300 text-sm">
            Simulation Contract Scaffolded &amp; Deterministic Core Active
          </h2>
          <p className="text-slate-300 leading-relaxed">
            Per project engineering standards, this module is transparently registered as a
            <strong className="text-indigo-200"> Contract Scaffolded</strong> experiment. The analytical
            and numerical physics equations, unit conversion bounds, and test fixtures are fully implemented
            in the core simulator engine. The tactile drag-and-drop apparatus canvas for this experiment
            will be mounted in the subsequent development cycle. (See <strong className="text-emerald-300">Experiment 1</strong> for the live reference workbench implementation).
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Theory, Apparatus, and Live Engine Playground */}
        <div className="lg:col-span-8 space-y-4">
          {/* Syllabus Aim & Required Apparatus */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Official Syllabus Aim</h2>
              <p className="text-sm text-slate-100 mt-1 font-medium">{metadata.aim}</p>
            </div>

            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Laboratory Apparatus</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {metadata.apparatus.map((app, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{app}</span>
                  </div>
                ))}
              </div>
            </div>

            {metadata.precautions && metadata.precautions.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Lab Precautions
                </h2>
                <ul className="list-disc list-inside text-xs text-slate-300 mt-1 space-y-1">
                  {metadata.precautions.map((pr, idx) => (
                    <li key={idx}>{pr}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Interactive Physics Engine Verification Playground */}
          {liveSimulationData && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Deterministic Engine Playground (Live Verification)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                  Engine Ready
                </span>
              </div>

              {/* Dynamic Controls depending on experiment */}
              {metadata.number === 8 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Slit Width d: {heisenbergSlitWidth} µm</span>
                    <input
                      type="range"
                      min={20}
                      max={120}
                      step={10}
                      value={heisenbergSlitWidth}
                      onChange={(e) => setHeisenbergSlitWidth(parseFloat(e.target.value))}
                      className="w-48 accent-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">1st Min Angle θ₁</div>
                      <div className="text-sm font-bold text-rose-400">
                        {(liveSimulationData.readings as { theta_m_deg: number }).theta_m_deg}°
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Distance a₁ (mm)</div>
                      <div className="text-sm font-bold text-slate-200">
                        {(liveSimulationData.readings as { firstMinimumDistance_mm: number }).firstMinimumDistance_mm}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Δpy · Δy Product</div>
                      <div className="text-sm font-bold text-indigo-300">
                        {(liveSimulationData.derived as { uncertaintyProduct: number }).uncertaintyProduct.toExponential(3)} J·s
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Product / h Ratio</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {(liveSimulationData.derived as { ratioToPlanckConstant: number }).ratioToPlanckConstant} (Exact 1.0)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {metadata.number === 4 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Energy E: {tunnelingE} eV</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={8.0}
                        step={0.5}
                        value={tunnelingE}
                        onChange={(e) => setTunnelingE(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Barrier V₀: {tunnelingV0} eV</span>
                      </div>
                      <input
                        type="range"
                        min={4.0}
                        max={10.0}
                        step={0.5}
                        value={tunnelingV0}
                        onChange={(e) => setTunnelingV0(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Width a: {tunnelingA} Å</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={4.0}
                        step={0.2}
                        value={tunnelingA}
                        onChange={(e) => setTunnelingA(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Transmission T</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {(liveSimulationData.readings as { transmissionCoefficient_T: number }).transmissionCoefficient_T}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Amplitude |t|</div>
                      <div className="text-sm font-bold text-sky-300">
                        {(liveSimulationData.readings as { transmittedAmplitude_t: number }).transmittedAmplitude_t}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">loge(T) (Table 2.2)</div>
                      <div className="text-sm font-bold text-slate-200">
                        {(liveSimulationData.readings as { log_e_T: number }).log_e_T}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Penetration Depth</div>
                      <div className="text-sm font-bold text-indigo-300">
                        {(liveSimulationData.derived as { penetrationDepth_nm: number }).penetrationDepth_nm} nm
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {metadata.number === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">LED Color:</span>
                    {(['red', 'green', 'yellow', 'blue'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setLedColor(c)}
                        className={`px-2.5 py-1 text-xs rounded font-bold uppercase transition-all ${
                          ledColor === c ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {c} ({LED_SPECS[c].lambda_nm} nm)
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Potentiometer Voltage: {(ledVoltRatio * 3.0).toFixed(2)} V</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={ledVoltRatio}
                      onChange={(e) => setLedVoltRatio(parseFloat(e.target.value))}
                      className="w-48 accent-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Barrier Potential VB</div>
                      <div className="text-sm font-bold text-amber-300">
                        {(liveSimulationData.readings as { barrierPotential_VB_V: number }).barrierPotential_VB_V} V
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Diode Current</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {(liveSimulationData.readings as { diodeCurrent_uA: number }).diodeCurrent_uA} µA
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Calculated h</div>
                      <div className="text-sm font-bold text-indigo-300">
                        {(liveSimulationData.derived as { planckConstantDirect_J_s: number }).planckConstantDirect_J_s.toExponential(3)} J·s
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Error vs 6.626e-34</div>
                      <div className="text-sm font-bold text-slate-300">
                        {(liveSimulationData.derived as { percentageErrorVsTrue_h: number }).percentageErrorVsTrue_h}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {metadata.number === 7 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">High Anode Voltage V: {diffractionVoltage_kV.toFixed(1)} kV</span>
                    <input
                      type="range"
                      min={2.5}
                      max={5.0}
                      step={0.5}
                      value={diffractionVoltage_kV}
                      onChange={(e) => setDiffractionVoltage_kV(parseFloat(e.target.value))}
                      className="w-48 accent-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">de Broglie λ</div>
                      <div className="text-sm font-bold text-sky-400">
                        {(liveSimulationData.readings as { deBroglieWavelength_nm: number }).deBroglieWavelength_nm} nm
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Ring 1 Dia D₁ (mm)</div>
                      <div className="text-sm font-bold text-amber-300">
                        {(liveSimulationData.readings as { ring1Diameter_mm: number }).ring1Diameter_mm}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Ring 2 Dia D₂ (mm)</div>
                      <div className="text-sm font-bold text-amber-300">
                        {(liveSimulationData.readings as { ring2Diameter_mm: number }).ring2Diameter_mm}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Kinetic Energy</div>
                      <div className="text-sm font-bold text-indigo-300">
                        {(liveSimulationData.derived as { kineticEnergy_eV: number }).kineticEnergy_eV} eV
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Render dynamic graph if curve exists */}
              {liveSimulationData.series && liveSimulationData.series.length > 0 && (
                <div className="pt-2">
                  <LabGraph
                    title={`Model Curve: ${metadata.shortTitle}`}
                    series={liveSimulationData.series}
                    xLabel="Domain Parameter"
                    xUnit="SI"
                    yLabel="Output Physical Quantity"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Formulas & Ambiguities */}
        <div className="lg:col-span-4 space-y-4">
          <FormulaPanel
            formulas={formulas}
            inconsistencyWarning={metadata.inconsistencies?.[0]}
          />

          {/* Observations Format Reference */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Manual Observation Fields
            </h3>
            <p className="text-xs text-slate-400">
              Corresponds to VIT Chennai laboratory record table on {metadata.pdfPageRange}.
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] font-mono text-indigo-300">
              {metadata.formulaSummary}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
