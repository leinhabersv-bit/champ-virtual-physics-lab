import { ISimulationEngine, ValidationResult } from '../types/simulation';

export interface Complex {
  re: number;
  im: number;
}

export interface QuantumParams {
  theta_rad: number; // 0 to pi
  phi_rad: number; // 0 to 2*pi
  activeGate: 'NONE' | 'X' | 'Y' | 'Z' | 'H';
  twoQubitInputState: string; // '|00>', '|01>', '|10>', '|11>', '(|00>+|11>)/sqrt(2)', etc.
  twoQubitGate: 'NONE' | 'CNOT' | 'SWAP';
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
}

export interface QuantumDerived {
  norm: number;
  relativePhase_rad: number;
  concurrence: number; // 0 for product states, 1 for maximally entangled
}

export class QuantumGatesEngine implements ISimulationEngine<QuantumParams, QuantumReadings, QuantumDerived> {
  readonly experimentId = 'expt-9-quantum-gates';

  readonly defaultParams: QuantumParams = {
    theta_rad: Math.PI / 2, // equator (+X axis)
    phi_rad: 0,
    activeGate: 'NONE',
    twoQubitInputState: '|00>',
    twoQubitGate: 'CNOT',
  };

  validateParams(params: QuantumParams): ValidationResult {
    const errors: string[] = [];
    if (params.theta_rad < 0 || params.theta_rad > Math.PI + 0.001) {
      errors.push('Theta must be within [0, pi].');
    }
    return { isValid: errors.length === 0, errors };
  }

  calculateReadings(params: QuantumParams): QuantumReadings {
    let theta = params.theta_rad;
    let phi = params.phi_rad;

    // Apply single qubit gate if requested
    if (params.activeGate === 'X') {
      // Rotation by pi about X axis: theta -> pi - theta, phi -> -phi
      theta = Math.PI - theta;
      phi = (2 * Math.PI - phi) % (2 * Math.PI);
    } else if (params.activeGate === 'Z') {
      // Rotation by pi about Z axis: phi -> phi + pi
      phi = (phi + Math.PI) % (2 * Math.PI);
    } else if (params.activeGate === 'Y') {
      // Rotation by pi about Y axis
      theta = Math.PI - theta;
      phi = (Math.PI - phi + 2 * Math.PI) % (2 * Math.PI);
    } else if (params.activeGate === 'H') {
      // Hadamard swaps X and Z axes
      const x = Math.sin(theta) * Math.cos(phi);
      const z = Math.cos(theta);
      const newX = z;
      const newZ = x;
      theta = Math.acos(Math.max(-1, Math.min(1, newZ)));
      phi = newX >= 0 ? 0 : Math.PI;
    }

    const bx = Math.sin(theta) * Math.cos(phi);
    const by = Math.sin(theta) * Math.sin(phi);
    const bz = Math.cos(theta);

    const alpha = Math.cos(theta / 2);
    const prob0 = alpha * alpha;
    const prob1 = 1 - prob0;

    const ket = `${alpha.toFixed(3)}|0⟩ + (${(Math.cos(phi) * Math.sin(theta / 2)).toFixed(3)} + ${(Math.sin(phi) * Math.sin(theta / 2)).toFixed(3)}i)|1⟩`;

    // Two-qubit gate simulation
    let twoQubitTransformed = params.twoQubitInputState;
    let isEntangled = false;

    if (params.twoQubitGate === 'CNOT') {
      if (params.twoQubitInputState === '|00>') twoQubitTransformed = '|00⟩';
      else if (params.twoQubitInputState === '|01>') twoQubitTransformed = '|01⟩';
      else if (params.twoQubitInputState === '|10>') twoQubitTransformed = '|11⟩';
      else if (params.twoQubitInputState === '|11>') twoQubitTransformed = '|10⟩';
      else if (params.twoQubitInputState.includes('|+⟩ ⊗ |0⟩') || params.twoQubitInputState.includes('(|00>+|10>)/sqrt(2)')) {
        twoQubitTransformed = '(|00⟩ + |11⟩) / √2 [Bell State |Φ+⟩]';
        isEntangled = true;
      }
    } else if (params.twoQubitGate === 'SWAP') {
      if (params.twoQubitInputState === '|10>') twoQubitTransformed = '|01⟩';
      else if (params.twoQubitInputState === '|01>') twoQubitTransformed = '|10⟩';
      else twoQubitTransformed = params.twoQubitInputState;
    }

    if (params.twoQubitInputState.includes('(|00>+|11>)') || params.twoQubitInputState.includes('(|01>+|10>)')) {
      isEntangled = true;
    }

    return {
      bloch_x: Number(bx.toFixed(3)),
      bloch_y: Number(by.toFixed(3)),
      bloch_z: Number(bz.toFixed(3)),
      prob_0: Number(prob0.toFixed(3)),
      prob_1: Number(prob1.toFixed(3)),
      stateKetString: ket,
      twoQubitTransformedKet: twoQubitTransformed,
      isEntangled,
    };
  }

  computeDerived(readings: QuantumReadings, params: QuantumParams): QuantumDerived {
    const alpha = Math.cos(params.theta_rad / 2);
    const beta = Math.sin(params.theta_rad / 2);
    const norm = Math.sqrt(alpha * alpha + beta * beta);

    return {
      norm: Number(norm.toFixed(4)),
      relativePhase_rad: params.phi_rad,
      concurrence: readings.isEntangled ? 1.0 : 0.0,
    };
  }
}

export const quantumGatesEngine = new QuantumGatesEngine();
