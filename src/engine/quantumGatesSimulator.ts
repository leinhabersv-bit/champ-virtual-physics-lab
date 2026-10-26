import { ISimulationEngine, ValidationResult } from '../types/simulation';
import { Complex, cmath } from './tunnelingSimulator';

export interface QuantumParams {
  theta_rad: number; // 0 to pi
  phi_rad: number; // 0 to 2*pi
  activeGate: 'NONE' | 'X' | 'Y' | 'Z' | 'H' | 'S' | 'T';
  twoQubitInputState: string; // '|00>', '|01>', '|10>', '|11>', 'Phi+', etc.
  twoQubitGate: 'NONE' | 'CNOT' | 'CNOT_REV' | 'SWAP' | 'H0' | 'H1' | 'X0' | 'X1';
  basisConvention?: 'TEXTBOOK' | 'QISKIT';
}

export interface QuantumReadings {
  bloch_x: number;
  bloch_y: number;
  bloch_z: number;
  prob_0: number;
  prob_1: number;
  stateKetString: string;
  twoQubitTransformedKet: string;
  isEntangled: boolean;
  concurrence: number;
  twoQubitVector: [Complex, Complex, Complex, Complex];
  twoQubitProbs: [number, number, number, number];
}

export interface QuantumDerived {
  norm: number;
  relativePhase_rad: number;
  concurrence: number; // 0 for product states, 1 for maximally entangled
  purityQubit1: number; // Tr(rho1^2), 1 for pure, 0.5 for maximally mixed
  purityQubit2: number;
}

export interface CircuitGate {
  id: string;
  type: 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'CNOT' | 'SWAP';
  targetWire: 0 | 1;
  controlWire?: 0 | 1; // for CNOT
  timeSlot: number;
}

export interface TwoQubitStateDetails {
  c00: Complex;
  c01: Complex;
  c10: Complex;
  c11: Complex;
  prob00: number;
  prob01: number;
  prob10: number;
  prob11: number;
  norm: number;
  concurrence: number;
  isEntangled: boolean;
  blochQubit1: { x: number; y: number; z: number; purity: number; theta?: number; phi?: number };
  blochQubit2: { x: number; y: number; z: number; purity: number; theta?: number; phi?: number };
  ketTextbook: string;
  ketQiskit: string;
}

export interface AmbiguityItem {
  id: string;
  title: string;
  sourceLocation: string;
  description: string;
  resolution: string;
}

export const QUANTUM_AMBIGUITIES: AmbiguityItem[] = [
  {
    id: 'AMB-08',
    title: 'Qiskit Little-Endian vs Standard Textbook Basis Ordering',
    sourceLocation: 'Manual p. 79 vs Qiskit Standard Documentation',
    description:
      'Standard textbook quantum mechanics (and manual p. 79) orders multi-qubit basis states as |q0 q1⟩ where q0 is the first (top) wire and q1 is the second (bottom) wire. In contrast, Qiskit defaults to little-endian ordering |q1 q0⟩ where q0 is the least significant bit (rightmost). For CNOT with control q0 and target q1, textbook representation writes |10⟩ → |11⟩, whereas Qiskit prints the same state as |01⟩ → |11⟩.',
    resolution:
      'The simulation engine natively tracks the state vector in textbook basis |q0 q1⟩ while providing an explicit basis toggle and visual annotations showing both conventions so students never get confused when comparing manual outputs with Qiskit code.',
  },
  {
    id: 'AMB-09',
    title: 'Duplicate Angle Entries in Manual Table p. 74',
    sourceLocation: 'Manual p. 74 Observation Table Rows 3 & 4',
    description:
      'The manual table on p. 74 repeats the entry (θ = -π/2, ϕ = 0) on both row 3 and row 4 without distinction. In standard spherical coordinates, θ ranges from 0 to π, so θ = -π/2 is geometrically equivalent to θ = π/2 with azimuthal shift ϕ = π (the |-⟩ state on the -X axis).',
    resolution:
      'We document the manual duplicate and offer physically meaningful cardinal Bloch sphere states for rows 3 & 4: |-⟩ (θ = π/2, ϕ = π, -X pole) and |-i⟩ (θ = π/2, ϕ = 3π/2, -Y pole), alongside the literal manual entries.',
  },
];

// Helper functions for complex linear algebra
export const qmath = {
  zero: (): Complex => ({ re: 0, im: 0 }),
  one: (): Complex => ({ re: 1, im: 0 }),
  i: (): Complex => ({ re: 0, im: 1 }),
  negOne: (): Complex => ({ re: -1, im: 0 }),
  negI: (): Complex => ({ re: 0, im: -1 }),
  invSqrt2: (): Complex => ({ re: 1 / Math.SQRT2, im: 0 }),
  negInvSqrt2: (): Complex => ({ re: -1 / Math.SQRT2, im: 0 }),

  modSq: (c: Complex): number => c.re * c.re + c.im * c.im,
  abs: (c: Complex): number => Math.sqrt(c.re * c.re + c.im * c.im),
  phase: (c: Complex): number => Math.atan2(c.im, c.re),

  formatComplex: (c: Complex, precision = 3): string => {
    const re = Math.abs(c.re) < 1e-4 ? 0 : Number(c.re.toFixed(precision));
    const im = Math.abs(c.im) < 1e-4 ? 0 : Number(c.im.toFixed(precision));
    if (im === 0) return `${re}`;
    if (re === 0) {
      if (im === 1) return 'i';
      if (im === -1) return '-i';
      return `${im}i`;
    }
    const sign = im > 0 ? '+' : '-';
    const absIm = Math.abs(im) === 1 ? '' : `${Math.abs(im)}`;
    return `${re} ${sign} ${absIm}i`;
  },
};

// Standard Gate Unitary Matrices (2x2)
export const SINGLE_GATES = {
  I: [
    [qmath.one(), qmath.zero()],
    [qmath.zero(), qmath.one()],
  ],
  X: [
    [qmath.zero(), qmath.one()],
    [qmath.one(), qmath.zero()],
  ],
  Y: [
    [qmath.zero(), qmath.negI()],
    [qmath.i(), qmath.zero()],
  ],
  Z: [
    [qmath.one(), qmath.zero()],
    [qmath.zero(), qmath.negOne()],
  ],
  H: [
    [qmath.invSqrt2(), qmath.invSqrt2()],
    [qmath.invSqrt2(), qmath.negInvSqrt2()],
  ],
  S: [
    [qmath.one(), qmath.zero()],
    [qmath.zero(), qmath.i()],
  ],
  T: [
    [qmath.one(), qmath.zero()],
    [qmath.zero(), { re: Math.cos(Math.PI / 4), im: Math.sin(Math.PI / 4) }],
  ],
};

// 4x4 Two-Qubit Unitary Matrices in Textbook Basis [|00>, |01>, |10>, |11>]
export const TWO_QUBIT_GATES = {
  // CNOT with control = q0, target = q1: |c, t> -> |c, t ⊕ c>
  CNOT_01: [
    [qmath.one(), qmath.zero(), qmath.zero(), qmath.zero()],
    [qmath.zero(), qmath.one(), qmath.zero(), qmath.zero()],
    [qmath.zero(), qmath.zero(), qmath.zero(), qmath.one()],
    [qmath.zero(), qmath.zero(), qmath.one(), qmath.zero()],
  ],
  // CNOT with control = q1, target = q0: flips q0 if q1 is 1
  CNOT_10: [
    [qmath.one(), qmath.zero(), qmath.zero(), qmath.zero()],
    [qmath.zero(), qmath.zero(), qmath.zero(), qmath.one()],
    [qmath.zero(), qmath.zero(), qmath.one(), qmath.zero()],
    [qmath.zero(), qmath.one(), qmath.zero(), qmath.zero()],
  ],
  // SWAP: |a, b> -> |b, a>
  SWAP: [
    [qmath.one(), qmath.zero(), qmath.zero(), qmath.zero()],
    [qmath.zero(), qmath.zero(), qmath.one(), qmath.zero()],
    [qmath.zero(), qmath.one(), qmath.zero(), qmath.zero()],
    [qmath.zero(), qmath.zero(), qmath.zero(), qmath.one()],
  ],
};

// Apply 4x4 matrix to 4-vector
export function applyMatrix4x4(
  matrix: Complex[][],
  vector: [Complex, Complex, Complex, Complex]
): [Complex, Complex, Complex, Complex] {
  const result: [Complex, Complex, Complex, Complex] = [
    qmath.zero(),
    qmath.zero(),
    qmath.zero(),
    qmath.zero(),
  ];

  for (let r = 0; r < 4; r++) {
    let sum = qmath.zero();
    for (let c = 0; c < 4; c++) {
      const prod = cmath.mul(matrix[r][c], vector[c]);
      sum = cmath.add(sum, prod);
    }
    result[r] = sum;
  }
  return result;
}

// Compute single qubit state from theta and phi
export function computeSingleQubitState(theta_rad: number, phi_rad: number, gate: string = 'NONE') {
  // Base state |psi> = cos(theta/2)|0> + e^(i*phi)*sin(theta/2)|1>
  let alpha: Complex = { re: Math.cos(theta_rad / 2), im: 0 };
  let beta: Complex = {
    re: Math.cos(phi_rad) * Math.sin(theta_rad / 2),
    im: Math.sin(phi_rad) * Math.sin(theta_rad / 2),
  };

  if (gate === 'X') {
    // X |psi> = beta |0> + alpha |1>
    const newAlpha = beta;
    const newBeta = alpha;
    alpha = newAlpha;
    beta = newBeta;
  } else if (gate === 'Y') {
    // Y |psi> = -i*beta |0> + i*alpha |1>
    const newAlpha = cmath.mul(qmath.negI(), beta);
    const newBeta = cmath.mul(qmath.i(), alpha);
    alpha = newAlpha;
    beta = newBeta;
  } else if (gate === 'Z') {
    // Z |psi> = alpha |0> - beta |1>
    const newAlpha = alpha;
    const newBeta = cmath.mul(qmath.negOne(), beta);
    alpha = newAlpha;
    beta = newBeta;
  } else if (gate === 'H') {
    // H |psi> = (alpha + beta)/sqrt(2) |0> + (alpha - beta)/sqrt(2) |1>
    const sum = cmath.add(alpha, beta);
    const diff = cmath.sub(alpha, beta);
    alpha = cmath.scale(sum, 1 / Math.SQRT2);
    beta = cmath.scale(diff, 1 / Math.SQRT2);
  } else if (gate === 'S') {
    beta = cmath.mul(qmath.i(), beta);
  } else if (gate === 'T') {
    beta = cmath.mul({ re: Math.cos(Math.PI / 4), im: Math.sin(Math.PI / 4) }, beta);
  }

  // Normalization
  const p0 = qmath.modSq(alpha);
  const p1 = qmath.modSq(beta);
  const norm = Math.sqrt(p0 + p1);

  // Bloch vector coordinates:
  // rx = 2*Re(alpha* * beta)
  // ry = 2*Im(alpha* * beta)
  // rz = |alpha|^2 - |beta|^2
  const alphaConj: Complex = { re: alpha.re, im: -alpha.im };
  const alphaConjBeta = cmath.mul(alphaConj, beta);
  const rx = 2 * alphaConjBeta.re;
  const ry = 2 * alphaConjBeta.im;
  const rz = p0 - p1;

  // Back-calculated spherical angles
  const derivedTheta = Math.acos(Math.max(-1, Math.min(1, rz / (norm || 1))));
  const derivedPhi = (Math.atan2(ry, rx) + 2 * Math.PI) % (2 * Math.PI);

  const ketString = `${qmath.formatComplex(alpha)}|0⟩ + (${qmath.formatComplex(beta)})|1⟩`;

  return {
    alpha,
    beta,
    prob0: p0,
    prob1: p1,
    norm,
    bloch_x: rx,
    bloch_y: ry,
    bloch_z: rz,
    theta_rad: derivedTheta,
    phi_rad: derivedPhi,
    ketString,
  };
}

// Parse preset two-qubit input state string into 4-vector [c00, c01, c10, c11]
export function parseTwoQubitPreset(stateStr: string): [Complex, Complex, Complex, Complex] {
  const norm1_sqrt2 = 1 / Math.SQRT2;
  const half = 0.5;

  switch (stateStr) {
    case '|00>':
    case '|00⟩':
      return [qmath.one(), qmath.zero(), qmath.zero(), qmath.zero()];
    case '|01>':
    case '|01⟩':
      return [qmath.zero(), qmath.one(), qmath.zero(), qmath.zero()];
    case '|10>':
    case '|10⟩':
      return [qmath.zero(), qmath.zero(), qmath.one(), qmath.zero()];
    case '|11>':
    case '|11⟩':
      return [qmath.zero(), qmath.zero(), qmath.zero(), qmath.one()];
    case 'Phi+':
    case '(|00>+|11>)/sqrt(2)':
    case '1/√2 (|00⟩+|11⟩)':
      return [{ re: norm1_sqrt2, im: 0 }, qmath.zero(), qmath.zero(), { re: norm1_sqrt2, im: 0 }];
    case 'Phi-':
    case '(|00>-|11>)/sqrt(2)':
    case '1/√2 (|00⟩-|11⟩)':
      return [{ re: norm1_sqrt2, im: 0 }, qmath.zero(), qmath.zero(), { re: -norm1_sqrt2, im: 0 }];
    case 'Psi+':
    case '(|01>+|10>)/sqrt(2)':
    case '1/√2 (|01⟩+|10⟩)':
      return [qmath.zero(), { re: norm1_sqrt2, im: 0 }, { re: norm1_sqrt2, im: 0 }, qmath.zero()];
    case 'Psi-':
    case '(|01>-|10>)/sqrt(2)':
    case '1/√2 (|01⟩-|10⟩)':
      return [qmath.zero(), { re: norm1_sqrt2, im: 0 }, { re: -norm1_sqrt2, im: 0 }, qmath.zero()];
    case '1/√2 (|00⟩+i|11⟩)':
      return [{ re: norm1_sqrt2, im: 0 }, qmath.zero(), qmath.zero(), { re: 0, im: norm1_sqrt2 }];
    case '1/√2 (|01⟩-i|10⟩)':
      return [qmath.zero(), { re: norm1_sqrt2, im: 0 }, { re: 0, im: -norm1_sqrt2 }, qmath.zero()];
    case '1/√2 (|00⟩+|10⟩)':
    case '|+⟩ ⊗ |0⟩':
      // (|0> + |1>)/sqrt(2) (x) |0> = (|00> + |10>)/sqrt(2)
      return [{ re: norm1_sqrt2, im: 0 }, qmath.zero(), { re: norm1_sqrt2, im: 0 }, qmath.zero()];
    case '1/√2 (|00⟩+|01⟩)':
    case '|0⟩ ⊗ |+⟩':
      // |0> (x) (|0> + |1>)/sqrt(2) = (|00> + |01>)/sqrt(2)
      return [{ re: norm1_sqrt2, im: 0 }, { re: norm1_sqrt2, im: 0 }, qmath.zero(), qmath.zero()];
    case '1/√2 (|10⟩+|11⟩)':
    case '|1⟩ ⊗ |+⟩':
      return [qmath.zero(), qmath.zero(), { re: norm1_sqrt2, im: 0 }, { re: norm1_sqrt2, im: 0 }];
    case '1/2 (|00⟩+|01⟩+|10⟩+|11⟩)':
    case '|+⟩ ⊗ |+⟩':
      return [{ re: half, im: 0 }, { re: half, im: 0 }, { re: half, im: 0 }, { re: half, im: 0 }];
    default:
      return [qmath.one(), qmath.zero(), qmath.zero(), qmath.zero()];
  }
}

// Compute comprehensive analysis of two-qubit state vector
export function analyzeTwoQubitState(vec: [Complex, Complex, Complex, Complex]): TwoQubitStateDetails {
  const [c00, c01, c10, c11] = vec;

  const p00 = qmath.modSq(c00);
  const p01 = qmath.modSq(c01);
  const p10 = qmath.modSq(c10);
  const p11 = qmath.modSq(c11);
  const norm = Math.sqrt(p00 + p01 + p10 + p11);

  // Concurrence C = 2 * |c00*c11 - c01*c10|
  const term1 = cmath.mul(c00, c11);
  const term2 = cmath.mul(c01, c10);
  const diff = cmath.sub(term1, term2);
  const concurrence = Math.min(1.0, 2 * qmath.abs(diff));
  const isEntangled = concurrence > 0.005;

  // Reduced density matrix for Qubit 1 (tracing out Qubit 2)
  // rho1_00 = |c00|^2 + |c01|^2
  // rho1_11 = |c10|^2 + |c11|^2
  // rho1_01 = c00*c10* + c01*c11*
  const rho1_00 = p00 + p01;
  const rho1_11 = p10 + p11;
  const c10_conj: Complex = { re: c10.re, im: -c10.im };
  const c11_conj: Complex = { re: c11.re, im: -c11.im };
  const rho1_01 = cmath.add(cmath.mul(c00, c10_conj), cmath.mul(c01, c11_conj));

  const b1_x = 2 * rho1_01.re;
  const b1_y = -2 * rho1_01.im; // Tr(rho * sigma_y)
  const b1_z = rho1_00 - rho1_11;
  const purity1 = rho1_00 * rho1_00 + rho1_11 * rho1_11 + 2 * qmath.modSq(rho1_01);

  // Reduced density matrix for Qubit 2 (tracing out Qubit 1)
  // rho2_00 = |c00|^2 + |c10|^2
  // rho2_11 = |c01|^2 + |c11|^2
  // rho2_01 = c00*c01* + c10*c11*
  const rho2_00 = p00 + p10;
  const rho2_11 = p01 + p11;
  const c01_conj: Complex = { re: c01.re, im: -c01.im };
  const rho2_01 = cmath.add(cmath.mul(c00, c01_conj), cmath.mul(c10, c11_conj));

  const b2_x = 2 * rho2_01.re;
  const b2_y = -2 * rho2_01.im;
  const b2_z = rho2_00 - rho2_11;
  const purity2 = rho2_00 * rho2_00 + rho2_11 * rho2_11 + 2 * qmath.modSq(rho2_01);

  // Extract single-qubit angles if separable
  let q1_theta: number | undefined;
  let q1_phi: number | undefined;
  let q2_theta: number | undefined;
  let q2_phi: number | undefined;

  if (!isEntangled) {
    q1_theta = Math.acos(Math.max(-1, Math.min(1, b1_z)));
    q1_phi = (Math.atan2(b1_y, b1_x) + 2 * Math.PI) % (2 * Math.PI);
    q2_theta = Math.acos(Math.max(-1, Math.min(1, b2_z)));
    q2_phi = (Math.atan2(b2_y, b2_x) + 2 * Math.PI) % (2 * Math.PI);
  }

  // Format Dirac kets
  const formatTerm = (c: Complex, basis: string) => {
    if (qmath.abs(c) < 1e-4) return '';
    const formatted = qmath.formatComplex(c);
    return `${formatted === '1' ? '' : formatted === '-1' ? '-' : formatted}${basis}`;
  };

  // Textbook basis: |00>, |01>, |10>, |11>
  const termsTextbook = [
    formatTerm(c00, '|00⟩'),
    formatTerm(c01, '|01⟩'),
    formatTerm(c10, '|10⟩'),
    formatTerm(c11, '|11⟩'),
  ].filter(Boolean);
  const ketTextbook = termsTextbook.length > 0 ? termsTextbook.join(' + ').replace(/\+\s-/g, '- ') : '0';

  // Qiskit little-endian basis: |q1 q0> -> index 0: |00>, index 1: |10>, index 2: |01>, index 3: |11>
  const termsQiskit = [
    formatTerm(c00, '|00⟩_Q'),
    formatTerm(c01, '|10⟩_Q'),
    formatTerm(c10, '|01⟩_Q'),
    formatTerm(c11, '|11⟩_Q'),
  ].filter(Boolean);
  const ketQiskit = termsQiskit.length > 0 ? termsQiskit.join(' + ').replace(/\+\s-/g, '- ') : '0';

  return {
    c00,
    c01,
    c10,
    c11,
    prob00: p00,
    prob01: p01,
    prob10: p10,
    prob11: p11,
    norm,
    concurrence,
    isEntangled,
    blochQubit1: {
      x: Number(b1_x.toFixed(3)),
      y: Number(b1_y.toFixed(3)),
      z: Number(b1_z.toFixed(3)),
      purity: Number(purity1.toFixed(3)),
      theta: q1_theta !== undefined ? Number(q1_theta.toFixed(3)) : undefined,
      phi: q1_phi !== undefined ? Number(q1_phi.toFixed(3)) : undefined,
    },
    blochQubit2: {
      x: Number(b2_x.toFixed(3)),
      y: Number(b2_y.toFixed(3)),
      z: Number(b2_z.toFixed(3)),
      purity: Number(purity2.toFixed(3)),
      theta: q2_theta !== undefined ? Number(q2_theta.toFixed(3)) : undefined,
      phi: q2_phi !== undefined ? Number(q2_phi.toFixed(3)) : undefined,
    },
    ketTextbook,
    ketQiskit,
  };
}

// Generate observation tables required by manual
export function generateManualTable1(): Array<{
  sno: number;
  theta_str: string;
  phi_str: string;
  theta_val: number;
  phi_val: number;
  stateKet: string;
  norm: number;
  remarks: string;
}> {
  const rows = [
    { sno: 1, theta_str: 'π/2', phi_str: 'π/2', theta_val: Math.PI / 2, phi_val: Math.PI / 2, remarks: '|+i⟩ state, oriented along +Y axis' },
    { sno: 2, theta_str: 'π/2', phi_str: '0', theta_val: Math.PI / 2, phi_val: 0, remarks: '|+⟩ state, oriented along +X axis' },
    { sno: 3, theta_str: '-π/2 (or π/2)', phi_str: '0 (or π)', theta_val: Math.PI / 2, phi_val: Math.PI, remarks: '|-⟩ state, oriented along -X axis' },
    { sno: 4, theta_str: 'π/2', phi_str: '3π/2', theta_val: Math.PI / 2, phi_val: (3 * Math.PI) / 2, remarks: '|-i⟩ state, oriented along -Y axis' },
    { sno: 5, theta_str: '0', phi_str: '0', theta_val: 0, phi_val: 0, remarks: '|0⟩ North Pole (+Z axis)' },
    { sno: 6, theta_str: 'π', phi_str: '0', theta_val: Math.PI, phi_val: 0, remarks: '|1⟩ South Pole (-Z axis)' },
    { sno: 7, theta_str: 'π/3', phi_str: '0', theta_val: Math.PI / 3, phi_val: 0, remarks: 'Superposition 0.866|0⟩ + 0.5|1⟩' },
    { sno: 8, theta_str: '2π/3', phi_str: 'π', theta_val: (2 * Math.PI) / 3, phi_val: Math.PI, remarks: 'Superposition 0.5|0⟩ - 0.866|1⟩' },
    { sno: 9, theta_str: 'π/4', phi_str: 'π/4', theta_val: Math.PI / 4, phi_val: Math.PI / 4, remarks: 'General pure state, |α|² ≈ 0.854' },
    { sno: 10, theta_str: '3π/4', phi_str: 'π/2', theta_val: (3 * Math.PI) / 4, phi_val: Math.PI / 2, remarks: 'General pure state, |α|² ≈ 0.146' },
  ];

  return rows.map((r) => {
    const res = computeSingleQubitState(r.theta_val, r.phi_val);
    return {
      sno: r.sno,
      theta_str: r.theta_str,
      phi_str: r.phi_str,
      theta_val: r.theta_val,
      phi_val: r.phi_val,
      stateKet: res.ketString,
      norm: Number(res.norm.toFixed(4)),
      remarks: r.remarks,
    };
  });
}

export function generateManualTable2(): Array<{
  sno: number;
  theta_str: string;
  phi_str: string;
  inputKet: string;
  xKet: string;
  yKet: string;
  zKet: string;
}> {
  const items = [
    { sno: 1, theta: Math.PI / 2, phi: 0, input: '1/√2 |0⟩ + 1/√2 |1⟩' },
    { sno: 2, theta: (2 * Math.PI) / 3, phi: Math.PI, input: '1/2 |0⟩ - √3/2 |1⟩' },
    { sno: 3, theta: (2 * Math.PI) / 3, phi: (3 * Math.PI) / 2, input: '1/2 |0⟩ - i√3/2 |1⟩' },
    { sno: 4, theta: (2 * Math.PI) / 3, phi: Math.PI / 2, input: '1/2 |0⟩ + i√3/2 |1⟩' },
    { sno: 5, theta: 0, phi: 0, input: '|0⟩' },
    { sno: 6, theta: Math.PI, phi: 0, input: '|1⟩' },
    { sno: 7, theta: Math.PI / 2, phi: Math.PI / 2, input: '1/√2 |0⟩ + i/√2 |1⟩' },
    { sno: 8, theta: Math.PI / 2, phi: Math.PI, input: '1/√2 |0⟩ - 1/√2 |1⟩' },
    { sno: 9, theta: Math.PI / 3, phi: 0, input: '√3/2 |0⟩ + 1/2 |1⟩' },
    { sno: 10, theta: (2 * Math.PI) / 3, phi: 0, input: '1/2 |0⟩ + √3/2 |1⟩' },
  ];

  return items.map((it) => {
    const xRes = computeSingleQubitState(it.theta, it.phi, 'X');
    const yRes = computeSingleQubitState(it.theta, it.phi, 'Y');
    const zRes = computeSingleQubitState(it.theta, it.phi, 'Z');
    return {
      sno: it.sno,
      theta_str: it.theta.toFixed(2),
      phi_str: it.phi.toFixed(2),
      inputKet: it.input,
      xKet: xRes.ketString,
      yKet: yRes.ketString,
      zKet: zRes.ketString,
    };
  });
}

export function generateManualTable3(): Array<{
  sno: number;
  theta_str: string;
  phi_str: string;
  inputKet: string;
  hKet: string;
}> {
  const items = [
    { sno: 1, theta: 0, phi: 0, input: '|0⟩' },
    { sno: 2, theta: Math.PI, phi: 0, input: '|1⟩' },
    { sno: 3, theta: Math.PI / 2, phi: 0, input: '1/√2 |0⟩ + 1/√2 |1⟩ (|+⟩)' },
    { sno: 4, theta: Math.PI / 2, phi: Math.PI, input: '1/√2 |0⟩ - 1/√2 |1⟩ (|-⟩)' },
    { sno: 5, theta: Math.PI / 2, phi: Math.PI / 2, input: '1/√2 |0⟩ + i/√2 |1⟩ (|+i⟩)' },
    { sno: 6, theta: Math.PI / 2, phi: (3 * Math.PI) / 2, input: '1/√2 |0⟩ - i/√2 |1⟩ (|-i⟩)' },
    { sno: 7, theta: Math.PI / 3, phi: 0, input: '√3/2 |0⟩ + 1/2 |1⟩' },
    { sno: 8, theta: (2 * Math.PI) / 3, phi: 0, input: '1/2 |0⟩ + √3/2 |1⟩' },
    { sno: 9, theta: (2 * Math.PI) / 3, phi: Math.PI, input: '1/2 |0⟩ - √3/2 |1⟩' },
    { sno: 10, theta: Math.PI / 4, phi: 0, input: 'cos(π/8)|0⟩ + sin(π/8)|1⟩' },
  ];

  return items.map((it) => {
    const hRes = computeSingleQubitState(it.theta, it.phi, 'H');
    return {
      sno: it.sno,
      theta_str: it.theta.toFixed(2),
      phi_str: it.phi.toFixed(2),
      inputKet: it.input,
      hKet: hRes.ketString,
    };
  });
}

export function generateManualTable4(): Array<{
  sno: number;
  stateStr: string;
  theta1: string;
  phi1: string;
  theta2: string;
  phi2: string;
  isEntangled: boolean;
  type: string;
}> {
  const list = [
    { sno: 1, str: '|00⟩', t1: '0', p1: '0', t2: '0', p2: '0', ent: false, type: 'Product (Separable)' },
    { sno: 2, str: '|01⟩', t1: '0', p1: '0', t2: 'π (3.14)', p2: '0', ent: false, type: 'Product (Separable)' },
    { sno: 3, str: '|10⟩', t1: 'π (3.14)', p1: '0', t2: '0', p2: '0', ent: false, type: 'Product (Separable)' },
    { sno: 4, str: '|11⟩', t1: 'π (3.14)', p1: '0', t2: 'π (3.14)', p2: '0', ent: false, type: 'Product (Separable)' },
    { sno: 5, str: '1/√2 (|00⟩+|11⟩)', t1: 'Undefined', p1: 'Undefined', t2: 'Undefined', p2: 'Undefined', ent: true, type: 'Bell State |Φ+⟩ (Entangled)' },
    { sno: 6, str: '1/√2 (|01⟩+|10⟩)', t1: 'Undefined', p1: 'Undefined', t2: 'Undefined', p2: 'Undefined', ent: true, type: 'Bell State |Ψ+⟩ (Entangled)' },
    { sno: 7, str: '1/2 (|00⟩+|01⟩+|10⟩+|11⟩)', t1: 'π/2 (1.57)', p1: '0', t2: 'π/2 (1.57)', p2: '0', ent: false, type: 'Product |+⟩ ⊗ |+⟩ (Separable)' },
    { sno: 8, str: '1/√2 (|00⟩+i|11⟩)', t1: 'Undefined', p1: 'Undefined', t2: 'Undefined', p2: 'Undefined', ent: true, type: 'Maximally Entangled' },
    { sno: 9, str: '1/√2 (|00⟩-|11⟩)', t1: 'Undefined', p1: 'Undefined', t2: 'Undefined', p2: 'Undefined', ent: true, type: 'Bell State |Φ-⟩ (Entangled)' },
    { sno: 10, str: '1/√2 (|01⟩-i|10⟩)', t1: 'Undefined', p1: 'Undefined', t2: 'Undefined', p2: 'Undefined', ent: true, type: 'Maximally Entangled' },
  ];

  return list.map((it) => ({
    sno: it.sno,
    stateStr: it.str,
    theta1: it.t1,
    phi1: it.p1,
    theta2: it.t2,
    phi2: it.p2,
    isEntangled: it.ent,
    type: it.type,
  }));
}

export function generateManualTable5(): Array<{
  sno: number;
  inputState: string;
  cnotOutput: string;
  swapOutput: string;
  isCnotEntangled: boolean;
  notes: string;
}> {
  const bench = [
    { sno: 1, input: '|00⟩', cnot: '|00⟩', swap: '|00⟩', ent: false, notes: 'Control=0: unchanged' },
    { sno: 2, input: '|01⟩', cnot: '|01⟩', swap: '|10⟩', ent: false, notes: 'Control=0: unchanged; SWAP exchanges wires' },
    { sno: 3, input: '|10⟩', cnot: '|11⟩', swap: '|01⟩', ent: false, notes: 'Control=1: flips target 0->1' },
    { sno: 4, input: '|11⟩', cnot: '|10⟩', swap: '|11⟩', ent: false, notes: 'Control=1: flips target 1->0' },
    { sno: 5, input: '1/√2 (|00⟩+|10⟩)', cnot: '1/√2 (|00⟩+|11⟩)', swap: '1/√2 (|00⟩+|01⟩)', ent: true, notes: 'Generates Bell state |Φ+⟩!' },
    { sno: 6, input: '1/√2 (|00⟩+|01⟩)', cnot: '1/√2 (|00⟩+|01⟩)', swap: '1/√2 (|00⟩+|10⟩)', ent: false, notes: 'Target in |+⟩ eigenstate: unchanged' },
    { sno: 7, input: '1/√2 (|10⟩+|11⟩)', cnot: '1/√2 (|11⟩+|10⟩)', swap: '1/√2 (|01⟩+|11⟩)', ent: false, notes: 'Flips target, remains product state' },
    { sno: 8, input: '1/2 (|00⟩+|01⟩+|10⟩+|11⟩)', cnot: '1/2 (|00⟩+|01⟩+|10⟩+|11⟩)', swap: '1/2 (|00⟩+|01⟩+|10⟩+|11⟩)', ent: false, notes: 'Symmetric |+⟩⊗|+⟩ state: invariant under both' },
    { sno: 9, input: '1/√2 (|01⟩+|10⟩)', cnot: '1/√2 (|01⟩+|11⟩)', swap: '1/√2 (|10⟩+|01⟩)', ent: false, notes: 'Disentangles Bell state |Ψ+⟩ to product |+⟩⊗|1⟩!' },
    { sno: 10, input: '|+⟩ ⊗ |0⟩', cnot: '1/√2 (|00⟩+|11⟩)', swap: '|0⟩ ⊗ |+⟩', ent: true, notes: 'Canonical Bell state creation circuit' },
  ];

  return bench.map((b) => ({
    sno: b.sno,
    inputState: b.input,
    cnotOutput: b.cnot,
    swapOutput: b.swap,
    isCnotEntangled: b.ent,
    notes: b.notes,
  }));
}

// Generate faithful Python / Qiskit script matching manual instructions
export function generateQiskitScript(): string {
  return `"""
Engineering Physics (BAPHY105) - Experiment 9: Single & Two-Qubit Quantum Gates
VIT Chennai • School of Advanced Sciences & SCOPE

Software Requirements:
  pip install qiskit qiskit-aer matplotlib numpy
"""

import numpy as np
import matplotlib.pyplot as plt
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from qiskit.visualization import plot_bloch_multivector, plot_histogram
from qiskit.quantum_info import Statevector

print("=== PART 1: SINGLE-QUBIT BLOCH SPHERE VISUALIZATION ===")
# Define spherical angles theta, phi
theta = np.pi / 2  # Equator
phi = np.pi / 2    # |+i> state along +Y axis

# Prepare state: |psi> = cos(theta/2)|0> + e^(i*phi)*sin(theta/2)|1>
alpha = np.cos(theta / 2)
beta = np.exp(1j * phi) * np.sin(theta / 2)
psi_single = Statevector([alpha, beta])

print(f"Prepared State |psi>: {psi_single}")
print(f"Norm <psi|psi>: {np.linalg.norm(psi_single.data):.4f}")
print(f"Probabilities [P(0), P(1)]: {[np.abs(alpha)**2, np.abs(beta)**2]}")

print("\\n=== PART 2: SINGLE-QUBIT QUANTUM GATES (X, Y, Z, H) ===")
qc_single = QuantumCircuit(1)
# Apply Hadamard gate to prepare |+> state
qc_single.h(0)
sv_after_h = Statevector.from_instruction(qc_single)
print("After Hadamard Gate H|0>:")
print(sv_after_h)

# Apply Pauli-X (NOT) gate
qc_single.x(0)
sv_after_x = Statevector.from_instruction(qc_single)
print("After Pauli-X Gate:")
print(sv_after_x)

print("\\n=== PART 3: TWO-QUBIT GATES & ENTANGLEMENT (CNOT & SWAP) ===")
# NOTE: Qiskit orders qubits in little-endian |q1 q0>!
# Create Bell State |Phi+> = (|00> + |11>) / sqrt(2)
qc_two = QuantumCircuit(2)
qc_two.h(0)        # Qubit 0 in superposition: (|0> + |1>)/sqrt(2)
qc_two.cx(0, 1)    # CNOT with control=0, target=1

sv_two = Statevector.from_instruction(qc_two)
print("Two-Qubit State Vector (|Phi+> Bell State):")
print(sv_two)

# Measure state probabilities
probs = sv_two.probabilities_dict()
print(f"Measurement Probabilities: {probs}")

# Test SWAP Gate
qc_swap = QuantumCircuit(2)
qc_swap.x(0)       # Initialize state |01> in Qiskit (|q1 q0>)
qc_swap.swap(0, 1) # SWAP qubits 0 and 1
sv_swap = Statevector.from_instruction(qc_swap)
print("\\nAfter SWAP Gate on |01>:")
print(sv_swap)

print("\\nSimulation complete. Browser workbench executes deterministic equivalent.")
`;
}

// Deterministic Simulation Engine Implementation
export class QuantumGatesEngine implements ISimulationEngine<QuantumParams, QuantumReadings, QuantumDerived> {
  readonly experimentId = 'expt-9-quantum-gates';

  readonly defaultParams: QuantumParams = {
    theta_rad: Math.PI / 2, // equator (+X axis)
    phi_rad: 0,
    activeGate: 'NONE',
    twoQubitInputState: '|00>',
    twoQubitGate: 'CNOT',
    basisConvention: 'TEXTBOOK',
  };

  validateParams(params: QuantumParams): ValidationResult {
    const errors: string[] = [];
    if (params.theta_rad < -Math.PI || params.theta_rad > 2 * Math.PI) {
      errors.push('Theta must be within physical range [-pi, 2pi].');
    }
    return { isValid: errors.length === 0, errors };
  }

  calculateReadings(params: QuantumParams): QuantumReadings {
    // 1. Single Qubit Simulation
    const single = computeSingleQubitState(params.theta_rad, params.phi_rad, params.activeGate);

    // 2. Two Qubit Simulation
    const initialVec = parseTwoQubitPreset(params.twoQubitInputState);
    let transformedVec: [Complex, Complex, Complex, Complex] = [...initialVec];

    if (params.twoQubitGate === 'CNOT') {
      transformedVec = applyMatrix4x4(TWO_QUBIT_GATES.CNOT_01, initialVec);
    } else if (params.twoQubitGate === 'CNOT_REV') {
      transformedVec = applyMatrix4x4(TWO_QUBIT_GATES.CNOT_10, initialVec);
    } else if (params.twoQubitGate === 'SWAP') {
      transformedVec = applyMatrix4x4(TWO_QUBIT_GATES.SWAP, initialVec);
    } else if (params.twoQubitGate === 'H0') {
      // H on qubit 0: H (x) I
      const H_I = [
        [qmath.invSqrt2(), qmath.zero(), qmath.invSqrt2(), qmath.zero()],
        [qmath.zero(), qmath.invSqrt2(), qmath.zero(), qmath.invSqrt2()],
        [qmath.invSqrt2(), qmath.zero(), qmath.negInvSqrt2(), qmath.zero()],
        [qmath.zero(), qmath.invSqrt2(), qmath.zero(), qmath.negInvSqrt2()],
      ];
      transformedVec = applyMatrix4x4(H_I, initialVec);
    } else if (params.twoQubitGate === 'H1') {
      // H on qubit 1: I (x) H
      const I_H = [
        [qmath.invSqrt2(), qmath.invSqrt2(), qmath.zero(), qmath.zero()],
        [qmath.invSqrt2(), qmath.negInvSqrt2(), qmath.zero(), qmath.zero()],
        [qmath.zero(), qmath.zero(), qmath.invSqrt2(), qmath.invSqrt2()],
        [qmath.zero(), qmath.zero(), qmath.invSqrt2(), qmath.negInvSqrt2()],
      ];
      transformedVec = applyMatrix4x4(I_H, initialVec);
    }

    const twoDetails = analyzeTwoQubitState(transformedVec);

    let twoKetDisplay = twoDetails.ketTextbook;
    if (twoDetails.isEntangled) {
      if (Math.abs(twoDetails.prob00 - 0.5) < 0.05 && Math.abs(twoDetails.prob11 - 0.5) < 0.05) {
        twoKetDisplay = '(|00⟩ + |11⟩) / √2 [Bell State |Φ+⟩]';
      } else if (Math.abs(twoDetails.prob01 - 0.5) < 0.05 && Math.abs(twoDetails.prob10 - 0.5) < 0.05) {
        twoKetDisplay = '(|01⟩ + |10⟩) / √2 [Bell State |Ψ+⟩]';
      }
    }

    return {
      bloch_x: Number(single.bloch_x.toFixed(3)),
      bloch_y: Number(single.bloch_y.toFixed(3)),
      bloch_z: Number(single.bloch_z.toFixed(3)),
      prob_0: Number(single.prob0.toFixed(3)),
      prob_1: Number(single.prob1.toFixed(3)),
      stateKetString: single.ketString,
      twoQubitTransformedKet: twoKetDisplay,
      isEntangled: twoDetails.isEntangled,
      concurrence: Number(twoDetails.concurrence.toFixed(4)),
      twoQubitVector: transformedVec,
      twoQubitProbs: [
        Number(twoDetails.prob00.toFixed(3)),
        Number(twoDetails.prob01.toFixed(3)),
        Number(twoDetails.prob10.toFixed(3)),
        Number(twoDetails.prob11.toFixed(3)),
      ],
    };
  }

  computeDerived(readings: QuantumReadings, params: QuantumParams): QuantumDerived {
    const single = computeSingleQubitState(params.theta_rad, params.phi_rad, params.activeGate);
    const twoDetails = analyzeTwoQubitState(readings.twoQubitVector);

    return {
      norm: Number(single.norm.toFixed(4)),
      relativePhase_rad: params.phi_rad,
      concurrence: readings.concurrence,
      purityQubit1: twoDetails.blochQubit1.purity,
      purityQubit2: twoDetails.blochQubit2.purity,
    };
  }
}

export const quantumGatesEngine = new QuantumGatesEngine();
