import { ISimulationEngine, ValidationResult } from '../types/simulation';
import { CONSTANTS } from '../utils/units';

/**
 * Experiment 8: Verification of Heisenberg's Uncertainty Principle through Single-Slit Diffraction
 * BAPHY105 Manual pp. 66–74 (printed pp. 63–71)
 *
 * Physics & Equations (from Manual):
 * 1. Single Slit Diffraction Minima:
 *    d · sin(θ_m) = m · λ (m = 1, 2, 3...)
 *    where:
 *      d = slit width (typically 20–120 µm)
 *      λ = laser wavelength = 650 nm (red diode laser)
 *      θ_m = diffraction angle to m-th minimum
 *
 * 2. Geometry & Angle:
 *    tan(θ_m) = a_m / D
 *    θ_m = arctan(a_m / D)
 *    where:
 *      a_m = distance from central maximum to m-th minimum (mm)
 *      D = distance between single slit and detector (mm, typically 600–1200 mm)
 *    Calculated slit width:
 *      d_calc = m · λ / sin(θ_m)
 *
 * 3. Heisenberg Uncertainty Principle Formulation:
 *    - Position uncertainty along transverse y-axis:
 *      Δy = d (Manual eq. 3: photon passing through slit has position uncertainty equal to slit width)
 *    - Incident photon momentum in longitudinal x-direction:
 *      p_x = h / λ (Manual eq. 7)
 *    - Transverse momentum acquired upon diffraction:
 *      Δp_y = p_x · sin(θ_1) = (h / λ) · sin(arctan(a_1 / D)) (Manual eq. 10)
 *    - Uncertainty product:
 *      Δy · Δp_y = d · (h / λ) · sin(arctan(a_1 / D)) = h · [(d / λ) · sin(arctan(a_1 / D))]
 *      Since for first minimum sin(θ_1) ≈ λ / d:
 *      (d / λ) · sin(arctan(a_1 / D)) ≈ 1.0 (Manual eq. 11)
 *      ∴ Δy · Δp_y ≈ h ≥ h / (4π) = ℏ / 2
 *
 * 4. Intensity Profile (Fraunhofer):
 *    I(y) = I_0 · [sin(β) / β]²
 *    β = (π · d / λ) · sin(θ) = (π · d / λ) · (y / √(D² + y²))
 */

export const CONSTANTS_E8 = {
  h: CONSTANTS.h_manual, // 6.626e-34 J*s (Manual p. 72)
  hbar: CONSTANTS.h_manual / (2 * Math.PI), // 1.05457e-34 J*s
  c: 3.0e8, // 3.0e8 m/s (Manual p. 72)
  DEFAULT_WAVELENGTH_NM: 650.0, // 650 nm diode laser (Manual p. 73)
  DEFAULT_WAVELENGTH_M: 650.0e-9,
  DEFAULT_SCREEN_DISTANCE_MM: 1000.0, // D = 1000 mm (1.0 m)
  DEFAULT_SLIT_WIDTH_UM: 40.0, // 40 µm
  PEAK_OUTPUT_CURRENT_UA: 85.0, // 85 µA on digital display (Manual p. 70-71)
};

export interface HeisenbergAmbiguityNote {
  id: string;
  sourceLocation: string;
  sourceText: string;
  issue: string;
  engineeringFix: string;
}

export const AMBIGUITIES_E8: HeisenbergAmbiguityNote[] = [
  {
    id: 'AMB-06',
    sourceLocation: 'Manual p. 73, Table 2 Header',
    sourceText: 'Distance between the detector and screen, D (mm)',
    issue: 'The pinhole detector is mounted on the optical rail at the screen position. D is the distance between the single slit and the detector. Page 74 Table 3 correctly writes "Distance between detector and slit, D (mm)".',
    engineeringFix: 'In all software UI labels and table headers, D is clearly documented as the distance between the single slit carriage and the pinhole detector stage.'
  },
  {
    id: 'AMB-07',
    sourceLocation: 'Manual p. 67, Eq. 2 vs Eq. 8',
    sourceText: 'Mathematically, Δx · Δp_x = h / 4π ... (2) vs Δp_y · Δy = h ... (8)',
    issue: 'The manual first quotes the Kennard minimum variance bound Δx Δp ≥ h / (4π), but subsequently derives Δy Δp_y = h using the central diffraction envelope.',
    engineeringFix: 'Both boundaries are explicitly displayed and explained: h / (4π) represents the theoretical lower quantum limit for Gaussian wavepackets, while the single-slit central diffraction minimum defines Δy Δp_y ≈ h, which safely satisfies the uncertainty principle with an envelope factor of 4π ≈ 12.57.'
  }
];

export interface HeisenbergParams {
  slitWidth_um: number; // micrometers (e.g. 20 to 120 µm)
  wavelength_nm: number; // laser wavelength, standard: 650 nm
  screenDistance_mm: number; // D in mm (e.g. 600 to 1500 mm)
  micrometerPos_mm: number; // detector scan position y (e.g. -20 to +20 mm)
  laserPower_mW?: number;
  laserAligned?: boolean; // kinematic beam alignment toggle
}

export interface HeisenbergReadings {
  intensity_uA: number; // detector output current in µA
  angle_rad: number; // θ₁
  theta_m_deg: number; // θ₁ in degrees
  firstMinimumDistance_mm: number; // a₁ in mm
  secondMinimumDistance_mm: number; // a₂ in mm
  thirdMinimumDistance_mm: number; // a₃ in mm
  d_calculated_um: number; // recalculated slit width from a₁
  sinTheta1: number;
}

export interface HeisenbergDerived {
  delta_y_m: number; // Uncertainty in position = d (m)
  delta_y_um: number; // Uncertainty in position (µm)
  p_x_kg_m_s: number; // Photon longitudinal momentum h / λ
  delta_p_y_kg_m_s: number; // Uncertainty in transverse momentum (kg·m/s)
  uncertaintyProduct: number; // Δy · Δp_y in J·s
  ratioToPlanckConstant: number; // (Δy · Δp_y) / h (≈ 1.000)
  ratioToHeisenbergLimit: number; // (Δy · Δp_y) / (h / 4π) (≈ 12.57)
  dimensionlessTest: number; // (d / λ) · sin(arctan(a/D)) (Manual eq. 11)
}

/**
 * Table 1 Row: Micrometer scan versus detector output current
 */
export interface MicrometerScanRow {
  slNo: number;
  micrometerReading_mm: number;
  outputCurrent_uA: number;
}

/**
 * Table 2 Row: Multi-order minima for slit width calculation
 */
export interface SlitWidthOrderRow {
  order_m: number;
  distance_D_mm: number;
  distance_a_mm: number;
  theta_deg: number;
  sinTheta: number;
  d_calculated_um: number;
}

/**
 * Table 3 Row: Verifying uncertainty principle across different slits
 */
export interface UncertaintyVerificationRow {
  slitWidth_um: number;
  distance_D_mm: number;
  distance_a_mm: number;
  theta1_deg: number;
  delta_p_y_kg_m_s: number;
  dimensionlessFactor: number; // (d / λ) · sin(θ₁)
  uncertaintyProduct_J_s: number; // Δy · Δp_y
}

/**
 * Pure physics calculations
 */

export function calculateDiffractionIntensity(
  y_mm: number,
  d_um: number,
  D_mm: number,
  lambda_nm = CONSTANTS_E8.DEFAULT_WAVELENGTH_NM,
  peakCurrent_uA = CONSTANTS_E8.PEAK_OUTPUT_CURRENT_UA
): { current_uA: number; beta: number } {
  const d_m = d_um * 1e-6;
  const lambda_m = lambda_nm * 1e-9;
  const D_m = D_mm * 1e-3;
  const y_m = y_mm * 1e-3;

  const sinTheta = y_m / Math.sqrt(D_m * D_m + y_m * y_m);
  const beta = (Math.PI * d_m / lambda_m) * sinTheta;

  let ratio = 1.0;
  if (Math.abs(beta) > 1e-7) {
    ratio = (Math.sin(beta) / beta) ** 2;
  }

  return {
    current_uA: Number((peakCurrent_uA * ratio).toFixed(2)),
    beta,
  };
}

export function calculateMinimaPositions(
  d_um: number,
  D_mm: number,
  lambda_nm = CONSTANTS_E8.DEFAULT_WAVELENGTH_NM
): { a1_mm: number; a2_mm: number; a3_mm: number; theta1_deg: number; theta2_deg: number; theta3_deg: number } {
  const d_m = d_um * 1e-6;
  const lambda_m = lambda_nm * 1e-9;
  const D_m = D_mm * 1e-3;

  // d * sin(theta_m) = m * lambda
  const sin1 = Math.min(1.0, (1 * lambda_m) / d_m);
  const sin2 = Math.min(1.0, (2 * lambda_m) / d_m);
  const sin3 = Math.min(1.0, (3 * lambda_m) / d_m);

  const t1 = Math.asin(sin1);
  const t2 = Math.asin(sin2);
  const t3 = Math.asin(sin3);

  const a1_mm = D_m * Math.tan(t1) * 1e3;
  const a2_mm = D_m * Math.tan(t2) * 1e3;
  const a3_mm = D_m * Math.tan(t3) * 1e3;

  return {
    a1_mm: Number(a1_mm.toFixed(3)),
    a2_mm: Number(a2_mm.toFixed(3)),
    a3_mm: Number(a3_mm.toFixed(3)),
    theta1_deg: Number(((t1 * 180) / Math.PI).toFixed(3)),
    theta2_deg: Number(((t2 * 180) / Math.PI).toFixed(3)),
    theta3_deg: Number(((t3 * 180) / Math.PI).toFixed(3)),
  };
}

export function generateTable1Scan(
  d_um = 40.0,
  D_mm = 1000.0,
  span_mm = 25.0,
  step_mm = 1.0,
  lambda_nm = 650.0
): MicrometerScanRow[] {
  const rows: MicrometerScanRow[] = [];
  let sNo = 1;
  for (let pos = -span_mm; pos <= span_mm + 1e-5; pos += step_mm) {
    const { current_uA } = calculateDiffractionIntensity(pos, d_um, D_mm, lambda_nm);
    rows.push({
      slNo: sNo++,
      micrometerReading_mm: Number(pos.toFixed(1)),
      outputCurrent_uA: current_uA,
    });
  }
  return rows;
}

export function generateTable2Orders(
  d_um = 40.0,
  D_mm = 1000.0,
  lambda_nm = 650.0
): SlitWidthOrderRow[] {
  const lambda_m = lambda_nm * 1e-9;
  const D_m = D_mm * 1e-3;
  const { a1_mm, a2_mm, a3_mm } = calculateMinimaPositions(d_um, D_mm, lambda_nm);

  const orders = [
    { m: 1, a_mm: a1_mm },
    { m: 2, a_mm: a2_mm },
    { m: 3, a_mm: a3_mm },
  ];

  return orders.map((ord) => {
    const a_m = ord.a_mm * 1e-3;
    const theta_rad = Math.atan(a_m / D_m);
    const theta_deg = (theta_rad * 180) / Math.PI;
    const sinTheta = Math.sin(theta_rad);
    const d_calc_m = (ord.m * lambda_m) / sinTheta;
    const d_calc_um = d_calc_m * 1e6;

    return {
      order_m: ord.m,
      distance_D_mm: D_mm,
      distance_a_mm: ord.a_mm,
      theta_deg: Number(theta_deg.toFixed(3)),
      sinTheta: Number(sinTheta.toFixed(5)),
      d_calculated_um: Number(d_calc_um.toFixed(2)),
    };
  });
}

export function generateTable3Uncertainty(
  slits_um = [40.0, 80.0, 120.0],
  D_mm = 1000.0,
  lambda_nm = 650.0
): UncertaintyVerificationRow[] {
  const lambda_m = lambda_nm * 1e-9;
  const D_m = D_mm * 1e-3;
  const h = CONSTANTS_E8.h;

  return slits_um.map((slit_um) => {
    const { a1_mm } = calculateMinimaPositions(slit_um, D_mm, lambda_nm);
    const a_m = a1_mm * 1e-3;
    const theta1_rad = Math.atan(a_m / D_m);
    const theta1_deg = (theta1_rad * 180) / Math.PI;
    const sinTheta1 = Math.sin(theta1_rad);

    // Delta p_y = (h / lambda) * sin(theta_1)
    const delta_p_y = (h / lambda_m) * sinTheta1;

    // Dimensionless factor = (d / lambda) * sin(theta_1)
    const d_m = slit_um * 1e-6;
    const dimFactor = (d_m / lambda_m) * sinTheta1;

    // Uncertainty product = Delta y * Delta p_y
    const product = d_m * delta_p_y;

    return {
      slitWidth_um: slit_um,
      distance_D_mm: D_mm,
      distance_a_mm: a1_mm,
      theta1_deg: Number(theta1_deg.toFixed(3)),
      delta_p_y_kg_m_s: Number(delta_p_y.toExponential(4)),
      dimensionlessFactor: Number(dimFactor.toFixed(4)),
      uncertaintyProduct_J_s: Number(product.toExponential(4)),
    };
  });
}

/**
 * Standard Engine Class implementing ISimulationEngine
 */
export class HeisenbergEngine implements ISimulationEngine<HeisenbergParams, HeisenbergReadings, HeisenbergDerived> {
  readonly experimentId = 'expt-8-heisenberg-slit';

  readonly defaultParams: HeisenbergParams = {
    slitWidth_um: CONSTANTS_E8.DEFAULT_SLIT_WIDTH_UM,
    wavelength_nm: CONSTANTS_E8.DEFAULT_WAVELENGTH_NM,
    screenDistance_mm: CONSTANTS_E8.DEFAULT_SCREEN_DISTANCE_MM,
    micrometerPos_mm: 0.0,
    laserPower_mW: 5.0,
    laserAligned: true,
  };

  validateParams(params: HeisenbergParams): ValidationResult {
    const errors: string[] = [];
    if (params.slitWidth_um <= 0) errors.push('Slit width must be strictly positive.');
    if (params.slitWidth_um > 500) errors.push('Slit width must be under 500 µm for measurable single-slit diffraction.');
    if (params.wavelength_nm <= 0) errors.push('Laser wavelength must be strictly positive.');
    if (params.screenDistance_mm <= 0) errors.push('Screen distance D must be strictly positive.');
    return { isValid: errors.length === 0, errors };
  }

  calculateReadings(params: HeisenbergParams): HeisenbergReadings {
    const isAligned = params.laserAligned ?? true;
    if (!isAligned) {
      return {
        intensity_uA: 0.0,
        angle_rad: 0.0,
        theta_m_deg: 0.0,
        firstMinimumDistance_mm: 0.0,
        secondMinimumDistance_mm: 0.0,
        thirdMinimumDistance_mm: 0.0,
        d_calculated_um: 0.0,
        sinTheta1: 0.0,
      };
    }

    const { current_uA } = calculateDiffractionIntensity(
      params.micrometerPos_mm,
      params.slitWidth_um,
      params.screenDistance_mm,
      params.wavelength_nm
    );

    const { a1_mm, a2_mm, a3_mm, theta1_deg } = calculateMinimaPositions(
      params.slitWidth_um,
      params.screenDistance_mm,
      params.wavelength_nm
    );

    const theta1_rad = (theta1_deg * Math.PI) / 180;
    const sinTheta1 = Math.sin(theta1_rad);
    const lambda_m = params.wavelength_nm * 1e-9;
    const d_calc_um = (lambda_m / sinTheta1) * 1e6;

    return {
      intensity_uA: current_uA,
      angle_rad: theta1_rad,
      theta_m_deg: theta1_deg,
      firstMinimumDistance_mm: a1_mm,
      secondMinimumDistance_mm: a2_mm,
      thirdMinimumDistance_mm: a3_mm,
      d_calculated_um: Number(d_calc_um.toFixed(2)),
      sinTheta1: Number(sinTheta1.toFixed(5)),
    };
  }

  computeDerived(readings: HeisenbergReadings, params: HeisenbergParams): HeisenbergDerived {
    const d_m = params.slitWidth_um * 1e-6;
    const lambda_m = params.wavelength_nm * 1e-9;
    const h = CONSTANTS_E8.h;

    // Delta y = d (Manual eq. 3)
    const delta_y_m = d_m;
    const delta_y_um = params.slitWidth_um;

    // Momentum p_x = h / lambda (Manual eq. 7)
    const p_x_kg_m_s = h / lambda_m;

    // Transverse momentum uncertainty: Delta p_y = (h / lambda) * sin(theta_1) (Manual eq. 10)
    const sinTheta1 = readings.sinTheta1 > 0 ? readings.sinTheta1 : Math.sin(readings.angle_rad);
    const delta_p_y_kg_m_s = p_x_kg_m_s * sinTheta1;

    // Uncertainty product: Delta y * Delta p_y (Manual eq. 8)
    const uncertaintyProduct = delta_y_m * delta_p_y_kg_m_s;
    const ratioToPlanck = uncertaintyProduct / h;

    // Heisenberg lower bound: h / (4 * pi)
    const heisenbergBound = h / (4 * Math.PI);
    const ratioToHeisenberg = uncertaintyProduct / heisenbergBound;

    // Dimensionless factor: (d / lambda) * sin(theta_1) (Manual eq. 11)
    const dimensionlessTest = (d_m / lambda_m) * sinTheta1;

    return {
      delta_y_m,
      delta_y_um,
      p_x_kg_m_s,
      delta_p_y_kg_m_s,
      uncertaintyProduct,
      ratioToPlanckConstant: Number(ratioToPlanck.toFixed(4)),
      ratioToHeisenbergLimit: Number(ratioToHeisenberg.toFixed(2)),
      dimensionlessTest: Number(dimensionlessTest.toFixed(4)),
    };
  }

  generateModelCurve(params: HeisenbergParams, sampleCount = 140): Array<{ x: number; y: number; label?: string }> {
    const { a1_mm } = calculateMinimaPositions(params.slitWidth_um, params.screenDistance_mm, params.wavelength_nm);
    const span = Math.max(25, a1_mm * 2.8);
    const points: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= sampleCount; i++) {
      const pos_mm = -span + (2 * span * i) / sampleCount;
      const { current_uA } = calculateDiffractionIntensity(
        pos_mm,
        params.slitWidth_um,
        params.screenDistance_mm,
        params.wavelength_nm
      );
      points.push({
        x: Number(pos_mm.toFixed(2)),
        y: current_uA,
      });
    }

    return points;
  }
}

export const heisenbergEngine = new HeisenbergEngine();
