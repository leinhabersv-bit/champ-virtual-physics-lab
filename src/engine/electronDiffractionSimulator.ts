import { ISimulationEngine, ValidationResult } from '../types/simulation';
import { CONSTANTS } from '../utils/units';

/**
 * Experiment 7: Electron Diffraction and de Broglie Wavelength
 * BAPHY105 Manual pp. 60–65 (printed pp. 57–62)
 *
 * Core Physical Laws:
 * 1. de Broglie Wavelength:
 *    λ_dB = h / p = h / √(2 * m_e * e * V_A)
 *    where V_A is the accelerating anode voltage in Volts.
 *    Classical relation: K = e * V_A = p² / (2 * m_e).
 *
 * 2. Bragg's Law on Polycrystalline Graphite:
 *    2 * d * sin(θ) = n * λ (n = 1)
 *    From conical diffraction geometry (Manual Fig. 2):
 *    tan(2θ) = (D / 2) / L = D / (2 * L)
 *    where D is ring diameter, L is graphite-to-phosphor screen distance (135 mm).
 *    Exact formula (Manual p. 64 Image 49):
 *    λ_Bragg = 2 * d * sin(0.5 * arctan(D / (2 * L)))
 *    Small-angle approximation (Manual p. 62 Eq. 5):
 *    λ_approx = d * D / (2 * L)
 *
 * 3. Graphite Crystal Plane Spacings (Manual Fig. 5):
 *    Carbon bond length a₀ = 0.142 nm, lattice parameter a = √3 * a₀ = 0.246 nm.
 *    - Inner Ring (Ring 1): {101̄0} planes, d₁ = 0.213 nm = 2.13 × 10⁻¹⁰ m (Manual calls d_inner).
 *    - Outer Ring (Ring 2): {112̄0} planes, d₂ = 0.123 nm = 1.23 × 10⁻¹⁰ m (Manual calls d_outer).
 *    Note: Smaller d produces larger diffraction angle θ, hence d₂ = 0.123 nm creates the outer ring!
 */

export const CONSTANTS_E7 = {
  m_e: CONSTANTS.m_e, // 9.1093837e-31 kg
  e: CONSTANTS.e, // 1.60217663e-19 C
  h: CONSTANTS.h_manual, // 6.626e-34 J*s (matching manual convention)
  c: CONSTANTS.c, // 2.99792458e8 m/s
  L_DEFAULT_MM: 135.0, // Target-to-screen distance L = 135 mm
  L_DEFAULT_M: 0.135,
  D1_LATTICE_SPACING_NM: 0.213, // Ring 1 (Inner) {10-10} planes
  D2_LATTICE_SPACING_NM: 0.123, // Ring 2 (Outer) {11-20} planes
  D1_LATTICE_SPACING_M: 0.213e-9,
  D2_LATTICE_SPACING_M: 0.123e-9,
  GRAPHITE_BOND_LENGTH_NM: 0.142, // C-C bond length
  CALIPER_LC_MM: 0.1, // Vernier caliper least count: 1 mm / 10 div = 0.1 mm
  HEATER_WARMUP_TIME_S: 60, // Step 2: "wait about one minute for the heater temperature to achieve thermal stability"
};

export interface AmbiguityNote {
  id: string;
  sourceLocation: string;
  sourceText: string;
  issue: string;
  engineeringFix: string;
}

export const AMBIGUITIES_E7: AmbiguityNote[] = [
  {
    id: 'AMB-04',
    sourceLocation: 'Manual p. 64, Step 6',
    sourceText: 'Now repeat the same by changing the voltage by a difference of 0.5V.',
    issue: 'Starting at 4 kV (4000 V), a voltage step of 0.5 V produces only ΔD ≈ 0.003 mm, which is two orders of magnitude smaller than the caliper least count (0.1 mm).',
    engineeringFix: 'In practical physical laboratories, the high-voltage supply is stepped in increments of 0.5 kV (500 V), e.g. 3.0, 3.5, 4.0, 4.5, 5.0 kV. Both fine 0.5 V stepping and standard 0.5 kV stepping are supported, with the 0.5 kV stepping flagged as the observable sequence.'
  },
  {
    id: 'AMB-05',
    sourceLocation: 'Manual p. 64, below Eq. 8',
    sourceText: 'Outer diameter: d=0.213nm.',
    issue: 'The manual mixes diameter D with interplanar lattice spacing d, and labels 0.213 nm as "outer" when Fig. 5 clearly shows d_inner = 0.213 nm producing the smaller diffraction angle (inner ring D1 ≈ 24.6 mm). The outer ring (D2 ≈ 42.6 mm) corresponds to d_outer = 0.123 nm.',
    engineeringFix: 'Dual ring physics models both lattice spacings explicitly: d₁ = 0.213 nm for Ring 1 (Inner) and d₂ = 0.123 nm for Ring 2 (Outer), preserving manual numerical values while resolving the geometric labelling error.'
  }
];

export interface RingMeasurement {
  ringIndex: 1 | 2;
  planeSpacing_nm: number;
  planeSpacing_m: number;
  theoreticalDiameter_mm: number;
  measuredDiameter_mm: number;
  msr_mm: number; // Main Scale Reading
  vsc: number; // Vernier Scale Coincidence
  tr_mm: number; // Total Reading = MSR + VSC * LC
  tan2Theta: number; // TR / (2 * L)
  theta_rad: number; // 0.5 * arctan(tan2Theta)
  theta_deg: number;
  braggWavelength_m: number; // Exact: 2 * d * sin(theta)
  braggWavelength_nm: number;
  braggWavelengthSmallAngle_m: number; // Approx: d * TR / (2 * L)
  braggWavelengthSmallAngle_nm: number;
  deBroglieWavelength_m: number;
  deBroglieWavelength_nm: number;
  discrepancyPercent: number; // |λ_Bragg - λ_dB| / λ_dB * 100
}

export interface ElectronDiffractionParams {
  anodeVoltage_kV: number; // Accelerating voltage (typically 2.0 to 5.0 kV)
  screenDistance_mm: number; // L = 135 mm
  heaterOn: boolean;
  heaterWarmupPercent?: number; // 0 to 100%
  caliperPosition1_mm?: number; // Optional user measurement for Ring 1
  caliperPosition2_mm?: number; // Optional user measurement for Ring 2
}

export interface ElectronDiffractionReadings {
  deBroglieWavelength_m: number;
  deBroglieWavelength_nm: number;
  deBroglieWavelength_angstrom: number;
  ring1Diameter_mm: number; // Inner ring (d1 = 0.213 nm)
  ring2Diameter_mm: number; // Outer ring (d2 = 0.123 nm)
  braggWavelengthRing1_nm: number;
  braggWavelengthRing2_nm: number;
  theta1_deg: number;
  theta2_deg: number;
  ring1: RingMeasurement;
  ring2: RingMeasurement;
  anodeCurrent_uA: number; // Thermionic beam current (typically 40–120 µA)
  heaterWarmupPercent: number;
  isStable: boolean;
}

export interface ElectronDiffractionDerived {
  kineticEnergy_eV: number;
  kineticEnergy_J: number;
  momentum_kg_m_s: number;
  electronVelocity_m_s: number;
  relativisticBeta: number; // v / c (typically ~0.12 at 4 kV)
  relativisticGamma: number; // 1 / √(1 - β²) (typically ~1.008, justifying non-relativistic treatment)
  theoreticalSlope1_mm_kV_half: number; // D1 vs 1/√V slope
  theoreticalSlope2_mm_kV_half: number; // D2 vs 1/√V slope
}

export interface DiffractionObservationRow {
  sNo: number;
  voltage_kV: number;
  ring1: {
    msr_mm: number;
    vsc: number;
    tr_mm: number;
    tan2Theta: number;
    theta_deg: number;
    braggLambda_m: number;
    deBroglieLambda_m: number;
    discrepancyPercent: number;
  };
  ring2: {
    msr_mm: number;
    vsc: number;
    tr_mm: number;
    tan2Theta: number;
    theta_deg: number;
    braggLambda_m: number;
    deBroglieLambda_m: number;
    discrepancyPercent: number;
  };
  kineticEnergy_eV: number;
  kineticEnergy_J: number;
}

/**
 * Pure physics calculations
 */

export function calculateDeBroglieWavelength(voltage_V: number): {
  lambda_m: number;
  lambda_nm: number;
  lambda_angstrom: number;
  momentum_kg_m_s: number;
} {
  if (voltage_V <= 0) {
    return { lambda_m: 0, lambda_nm: 0, lambda_angstrom: 0, momentum_kg_m_s: 0 };
  }
  const m = CONSTANTS_E7.m_e;
  const e = CONSTANTS_E7.e;
  const h = CONSTANTS_E7.h;

  // p = √(2 * m * e * V)
  const p = Math.sqrt(2 * m * e * voltage_V);
  const lambda_m = h / p;
  const lambda_nm = lambda_m * 1e9;
  const lambda_angstrom = lambda_m * 1e10;

  return { lambda_m, lambda_nm, lambda_angstrom, momentum_kg_m_s: p };
}

export function decomposeVernierReading(diameter_mm: number, lc_mm = CONSTANTS_E7.CALIPER_LC_MM): {
  msr: number;
  vsc: number;
  tr: number;
} {
  if (diameter_mm <= 0) {
    return { msr: 0, vsc: 0, tr: 0 };
  }
  const msr = Math.floor(diameter_mm);
  const remainder = diameter_mm - msr;
  const vsc = Math.min(9, Math.max(0, Math.round(remainder / lc_mm)));
  const tr = Number((msr + vsc * lc_mm).toFixed(2));
  return { msr, vsc, tr };
}

export function calculateRingDiameterExact(lambda_m: number, d_m: number, L_m: number): number {
  if (lambda_m <= 0 || d_m <= 0 || L_m <= 0) return 0;
  // Bragg: sin(theta) = lambda / (2 * d)
  const sinTheta = lambda_m / (2 * d_m);
  if (sinTheta >= 1) return 0;
  const theta = Math.asin(sinTheta);
  // Cone half-angle is 2 * theta: tan(2 * theta) = (D / 2) / L
  const tan2Theta = Math.tan(2 * theta);
  const D_m = 2 * L_m * tan2Theta;
  return D_m * 1e3; // return in mm
}

export function calculateRingDiameterSmallAngle(lambda_m: number, d_m: number, L_m: number): number {
  if (lambda_m <= 0 || d_m <= 0 || L_m <= 0) return 0;
  // Small angle: D = 2 * L * lambda / d
  return ((2 * L_m * lambda_m) / d_m) * 1e3;
}

export function calculateBraggWavelengthExact(D_mm: number, d_m: number, L_mm: number): number {
  if (D_mm <= 0 || d_m <= 0 || L_mm <= 0) return 0;
  const D_m = D_mm * 1e-3;
  const L_m = L_mm * 1e-3;
  // tan(2theta) = D / (2*L)
  const tan2Theta = D_m / (2 * L_m);
  const twoTheta = Math.atan(tan2Theta);
  const theta = twoTheta / 2;
  return 2 * d_m * Math.sin(theta);
}

export function calculateBraggWavelengthApprox(D_mm: number, d_m: number, L_mm: number): number {
  if (D_mm <= 0 || d_m <= 0 || L_mm <= 0) return 0;
  const D_m = D_mm * 1e-3;
  const L_m = L_mm * 1e-3;
  return (d_m * D_m) / (2 * L_m);
}

export function generateObservationTable(
  voltages_kV = [3.0, 3.5, 4.0, 4.5, 5.0],
  L_mm = CONSTANTS_E7.L_DEFAULT_MM
): DiffractionObservationRow[] {
  const d1_m = CONSTANTS_E7.D1_LATTICE_SPACING_M;
  const d2_m = CONSTANTS_E7.D2_LATTICE_SPACING_M;
  const L_m = L_mm * 1e-3;

  return voltages_kV.map((kV, index) => {
    const V = kV * 1e3;
    const { lambda_m } = calculateDeBroglieWavelength(V);

    const D1_theo = calculateRingDiameterExact(lambda_m, d1_m, L_m);
    const D2_theo = calculateRingDiameterExact(lambda_m, d2_m, L_m);

    const r1V = decomposeVernierReading(D1_theo);
    const r2V = decomposeVernierReading(D2_theo);

    const tan2Theta1 = (r1V.tr * 1e-3) / (2 * L_m);
    const theta1_rad = 0.5 * Math.atan(tan2Theta1);
    const theta1_deg = (theta1_rad * 180) / Math.PI;
    const bragg1_m = 2 * d1_m * Math.sin(theta1_rad);
    const disc1 = Math.abs((bragg1_m - lambda_m) / lambda_m) * 100;

    const tan2Theta2 = (r2V.tr * 1e-3) / (2 * L_m);
    const theta2_rad = 0.5 * Math.atan(tan2Theta2);
    const theta2_deg = (theta2_rad * 180) / Math.PI;
    const bragg2_m = 2 * d2_m * Math.sin(theta2_rad);
    const disc2 = Math.abs((bragg2_m - lambda_m) / lambda_m) * 100;

    const K_eV = V;
    const K_J = V * CONSTANTS_E7.e;

    return {
      sNo: index + 1,
      voltage_kV: kV,
      ring1: {
        msr_mm: r1V.msr,
        vsc: r1V.vsc,
        tr_mm: r1V.tr,
        tan2Theta: Number(tan2Theta1.toFixed(5)),
        theta_deg: Number(theta1_deg.toFixed(3)),
        braggLambda_m: Number(bragg1_m.toExponential(4)),
        deBroglieLambda_m: Number(lambda_m.toExponential(4)),
        discrepancyPercent: Number(disc1.toFixed(2)),
      },
      ring2: {
        msr_mm: r2V.msr,
        vsc: r2V.vsc,
        tr_mm: r2V.tr,
        tan2Theta: Number(tan2Theta2.toFixed(5)),
        theta_deg: Number(theta2_deg.toFixed(3)),
        braggLambda_m: Number(bragg2_m.toExponential(4)),
        deBroglieLambda_m: Number(lambda_m.toExponential(4)),
        discrepancyPercent: Number(disc2.toFixed(2)),
      },
      kineticEnergy_eV: K_eV,
      kineticEnergy_J: Number(K_J.toExponential(4)),
    };
  });
}

/**
 * Standard Engine Class implementing ISimulationEngine
 */
export class ElectronDiffractionEngine
  implements ISimulationEngine<ElectronDiffractionParams, ElectronDiffractionReadings, ElectronDiffractionDerived>
{
  readonly experimentId = 'expt-7-electron-diffraction';

  readonly defaultParams: ElectronDiffractionParams = {
    anodeVoltage_kV: 4.0, // 4.0 kV per Manual p. 64 Step 3
    screenDistance_mm: CONSTANTS_E7.L_DEFAULT_MM,
    heaterOn: true,
    heaterWarmupPercent: 100,
  };

  validateParams(params: ElectronDiffractionParams): ValidationResult {
    const errors: string[] = [];
    if (params.anodeVoltage_kV <= 0) errors.push('Anode voltage must be strictly positive.');
    if (params.anodeVoltage_kV > 6.0) errors.push('Anode voltage exceeds safe 5.0 kV operating limit of tube.');
    if (params.screenDistance_mm <= 0) errors.push('Target-to-screen distance L must be strictly positive.');
    return { isValid: errors.length === 0, errors };
  }

  calculateReadings(params: ElectronDiffractionParams): ElectronDiffractionReadings {
    const warmup = params.heaterWarmupPercent ?? (params.heaterOn ? 100 : 0);
    const isStable = params.heaterOn && warmup >= 100;

    if (!params.heaterOn || warmup <= 0) {
      const zeroRing: RingMeasurement = {
        ringIndex: 1,
        planeSpacing_nm: CONSTANTS_E7.D1_LATTICE_SPACING_NM,
        planeSpacing_m: CONSTANTS_E7.D1_LATTICE_SPACING_M,
        theoreticalDiameter_mm: 0,
        measuredDiameter_mm: 0,
        msr_mm: 0,
        vsc: 0,
        tr_mm: 0,
        tan2Theta: 0,
        theta_rad: 0,
        theta_deg: 0,
        braggWavelength_m: 0,
        braggWavelength_nm: 0,
        braggWavelengthSmallAngle_m: 0,
        braggWavelengthSmallAngle_nm: 0,
        deBroglieWavelength_m: 0,
        deBroglieWavelength_nm: 0,
        discrepancyPercent: 0,
      };

      return {
        deBroglieWavelength_m: 0,
        deBroglieWavelength_nm: 0,
        deBroglieWavelength_angstrom: 0,
        ring1Diameter_mm: 0,
        ring2Diameter_mm: 0,
        braggWavelengthRing1_nm: 0,
        braggWavelengthRing2_nm: 0,
        theta1_deg: 0,
        theta2_deg: 0,
        ring1: zeroRing,
        ring2: { ...zeroRing, ringIndex: 2, planeSpacing_nm: CONSTANTS_E7.D2_LATTICE_SPACING_NM, planeSpacing_m: CONSTANTS_E7.D2_LATTICE_SPACING_M },
        anodeCurrent_uA: 0,
        heaterWarmupPercent: warmup,
        isStable: false,
      };
    }

    const V = params.anodeVoltage_kV * 1e3;
    const L_m = params.screenDistance_mm * 1e-3;
    const { lambda_m, lambda_nm, lambda_angstrom } = calculateDeBroglieWavelength(V);

    const d1_m = CONSTANTS_E7.D1_LATTICE_SPACING_M;
    const d2_m = CONSTANTS_E7.D2_LATTICE_SPACING_M;

    // Theoretical exact diameters
    const D1_exact_mm = calculateRingDiameterExact(lambda_m, d1_m, L_m);
    const D2_exact_mm = calculateRingDiameterExact(lambda_m, d2_m, L_m);

    // Vernier decomposed reading for theoretical diameter
    const v1 = decomposeVernierReading(params.caliperPosition1_mm ?? D1_exact_mm);
    const v2 = decomposeVernierReading(params.caliperPosition2_mm ?? D2_exact_mm);

    // Effective diameter used for measurement
    const D1_meas_mm = params.caliperPosition1_mm ?? v1.tr;
    const D2_meas_mm = params.caliperPosition2_mm ?? v2.tr;

    // Angles & Bragg wavelength from measurement
    const tan2Theta1 = (D1_meas_mm * 1e-3) / (2 * L_m);
    const theta1_rad = 0.5 * Math.atan(tan2Theta1);
    const theta1_deg = (theta1_rad * 180) / Math.PI;
    const bragg1_m = 2 * d1_m * Math.sin(theta1_rad);
    const bragg1_nm = bragg1_m * 1e9;
    const bragg1_approx_m = calculateBraggWavelengthApprox(D1_meas_mm, d1_m, params.screenDistance_mm);

    const tan2Theta2 = (D2_meas_mm * 1e-3) / (2 * L_m);
    const theta2_rad = 0.5 * Math.atan(tan2Theta2);
    const theta2_deg = (theta2_rad * 180) / Math.PI;
    const bragg2_m = 2 * d2_m * Math.sin(theta2_rad);
    const bragg2_nm = bragg2_m * 1e9;
    const bragg2_approx_m = calculateBraggWavelengthApprox(D2_meas_mm, d2_m, params.screenDistance_mm);

    const disc1 = Math.abs((bragg1_m - lambda_m) / lambda_m) * 100;
    const disc2 = Math.abs((bragg2_m - lambda_m) / lambda_m) * 100;

    // Beam current scales with warm-up and sqrt(V) Child-Langmuir / space-charge saturation
    const baseCurrent_uA = 75; // typical tube anode current ~75 uA at 4 kV
    const anodeCurrent_uA = (warmup / 100) * baseCurrent_uA * Math.sqrt(params.anodeVoltage_kV / 4.0);

    const ring1: RingMeasurement = {
      ringIndex: 1,
      planeSpacing_nm: CONSTANTS_E7.D1_LATTICE_SPACING_NM,
      planeSpacing_m: d1_m,
      theoreticalDiameter_mm: Number(D1_exact_mm.toFixed(2)),
      measuredDiameter_mm: Number(D1_meas_mm.toFixed(2)),
      msr_mm: v1.msr,
      vsc: v1.vsc,
      tr_mm: v1.tr,
      tan2Theta: Number(tan2Theta1.toFixed(5)),
      theta_rad: Number(theta1_rad.toFixed(5)),
      theta_deg: Number(theta1_deg.toFixed(3)),
      braggWavelength_m: Number(bragg1_m.toExponential(4)),
      braggWavelength_nm: Number(bragg1_nm.toFixed(5)),
      braggWavelengthSmallAngle_m: Number(bragg1_approx_m.toExponential(4)),
      braggWavelengthSmallAngle_nm: Number((bragg1_approx_m * 1e9).toFixed(5)),
      deBroglieWavelength_m: Number(lambda_m.toExponential(4)),
      deBroglieWavelength_nm: Number(lambda_nm.toFixed(5)),
      discrepancyPercent: Number(disc1.toFixed(2)),
    };

    const ring2: RingMeasurement = {
      ringIndex: 2,
      planeSpacing_nm: CONSTANTS_E7.D2_LATTICE_SPACING_NM,
      planeSpacing_m: d2_m,
      theoreticalDiameter_mm: Number(D2_exact_mm.toFixed(2)),
      measuredDiameter_mm: Number(D2_meas_mm.toFixed(2)),
      msr_mm: v2.msr,
      vsc: v2.vsc,
      tr_mm: v2.tr,
      tan2Theta: Number(tan2Theta2.toFixed(5)),
      theta_rad: Number(theta2_rad.toFixed(5)),
      theta_deg: Number(theta2_deg.toFixed(3)),
      braggWavelength_m: Number(bragg2_m.toExponential(4)),
      braggWavelength_nm: Number(bragg2_nm.toFixed(5)),
      braggWavelengthSmallAngle_m: Number(bragg2_approx_m.toExponential(4)),
      braggWavelengthSmallAngle_nm: Number((bragg2_approx_m * 1e9).toFixed(5)),
      deBroglieWavelength_m: Number(lambda_m.toExponential(4)),
      deBroglieWavelength_nm: Number(lambda_nm.toFixed(5)),
      discrepancyPercent: Number(disc2.toFixed(2)),
    };

    return {
      deBroglieWavelength_m: lambda_m,
      deBroglieWavelength_nm: Number(lambda_nm.toFixed(5)),
      deBroglieWavelength_angstrom: Number(lambda_angstrom.toFixed(4)),
      ring1Diameter_mm: Number(D1_exact_mm.toFixed(2)),
      ring2Diameter_mm: Number(D2_exact_mm.toFixed(2)),
      braggWavelengthRing1_nm: Number(bragg1_nm.toFixed(5)),
      braggWavelengthRing2_nm: Number(bragg2_nm.toFixed(5)),
      theta1_deg: Number(theta1_deg.toFixed(3)),
      theta2_deg: Number(theta2_deg.toFixed(3)),
      ring1,
      ring2,
      anodeCurrent_uA: Number(anodeCurrent_uA.toFixed(1)),
      heaterWarmupPercent: warmup,
      isStable,
    };
  }

  computeDerived(_readings: ElectronDiffractionReadings, params: ElectronDiffractionParams): ElectronDiffractionDerived {
    const V = params.anodeVoltage_kV * 1e3;
    const kineticEnergy_eV = V;
    const kineticEnergy_J = V * CONSTANTS_E7.e;
    const p = Math.sqrt(2 * CONSTANTS_E7.m_e * kineticEnergy_J);
    const velocity = p / CONSTANTS_E7.m_e;
    const beta = velocity / CONSTANTS_E7.c;
    const gamma = 1 / Math.sqrt(1 - beta * beta);

    // Slope D vs 1/√V_kV:
    // D(V) ≈ (2 * L * h) / (d * √(2 * m * e)) * 1/√V
    // In mm vs (kV)^(-1/2):
    // 1/√V_V = 1/(√1000 * √V_kV)
    const factor = (2 * (params.screenDistance_mm * 1e-3) * CONSTANTS_E7.h) / Math.sqrt(2 * CONSTANTS_E7.m_e * CONSTANTS_E7.e);
    const slope1_SI = factor / CONSTANTS_E7.D1_LATTICE_SPACING_M; // m * V^(1/2)
    const slope2_SI = factor / CONSTANTS_E7.D2_LATTICE_SPACING_M;

    // Convert to mm * (kV)^(1/2):
    // D [mm] = (slope_SI * 1e3) / (√1000 * √(V_kV)) = (slope_SI * 1e3 / √1000) * 1/√(V_kV)
    const slope1_mm_kV_half = (slope1_SI * 1e3) / Math.sqrt(1000);
    const slope2_mm_kV_half = (slope2_SI * 1e3) / Math.sqrt(1000);

    return {
      kineticEnergy_eV,
      kineticEnergy_J,
      momentum_kg_m_s: p,
      electronVelocity_m_s: velocity,
      relativisticBeta: Number(beta.toFixed(4)),
      relativisticGamma: Number(gamma.toFixed(4)),
      theoreticalSlope1_mm_kV_half: Number(slope1_mm_kV_half.toFixed(2)),
      theoreticalSlope2_mm_kV_half: Number(slope2_mm_kV_half.toFixed(2)),
    };
  }
}

export const electronDiffractionEngine = new ElectronDiffractionEngine();
