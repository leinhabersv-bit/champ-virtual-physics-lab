import { describe, it, expect } from 'vitest';
import { EXPERIMENTS_DATA } from '../../src/data/experiments';
import { solarCellEngine } from '../../src/engine/solarCellSimulator';
import { heisenbergEngine } from '../../src/engine/heisenbergSimulator';
import { tunnelingEngine } from '../../src/engine/tunnelingSimulator';
import { spectrometerEngine } from '../../src/engine/spectrometerSimulator';
import { ledPlanckEngine } from '../../src/engine/ledPlanckSimulator';
import { photodiodeEngine } from '../../src/engine/photodiodeSimulator';
import { electronDiffractionEngine } from '../../src/engine/electronDiffractionSimulator';
import { quantumGatesEngine } from '../../src/engine/quantumGatesSimulator';

describe('Per-Experiment End-to-End User Journey Skeletons (Expts 1–9)', () => {
  it('E2E-Expt1: Solar Cell User Flow - Wiring, Sweep, Pmax & Fill Factor', () => {
    const expt = EXPERIMENTS_DATA.find(e => e.id === 'expt-1-solar-cell');
    expect(expt).toBeDefined();
    expect(expt?.isDemoFunctional).toBe(true);

    // User steps: 1. Set distance 20cm
    const dist = 0.20;
    // 2. Measure open circuit & short circuit
    const vocReading = solarCellEngine.calculateReadings({
      distance: dist,
      lampPower: 5,
      cellArea: 0.0025,
      loadResistance: 1e7,
      circuitTopology: 'single',
      panelCount: 3,
    });
    expect(vocReading.voltage).toBeGreaterThan(2.0);

    // 3. Sweep resistances
    const resistances = [100, 220, 500, 1000, 2000, 3000, 5000, 10000];
    const sweptReadings = resistances.map(r =>
      solarCellEngine.calculateReadings({
        distance: dist,
        lampPower: 5,
        cellArea: 0.0025,
        loadResistance: r,
        circuitTopology: 'single',
        panelCount: 3,
      })
    );
    expect(sweptReadings.length).toBe(8);

    // Check power peak
    const powers = sweptReadings.map(r => r.power_W);
    const maxPower = Math.max(...powers);
    expect(maxPower).toBeGreaterThan(0.005);
  });

  it('E2E-Expt2: Mercury Grating - Wavelength from Normal Incidence', () => {
    const reading = spectrometerEngine.calculateReadings({
      method: 'normal_incidence',
      lightSource: 'mercury',
      selectedLine: 'yellow', // 577 nm
      gratingRulingsPerInch: 15000,
      order: 1,
      telescopeAngle_deg: 0,
    });
    expect(reading.calculatedWavelength_nm).toBeCloseTo(577.0, 0);
  });

  it('E2E-Expt3: LED Planck - Knee Voltage to h', () => {
    const reading = ledPlanckEngine.calculateReadings({
      ledColor: 'blue',
      potentiometerRatio: 0.9,
    });
    expect(reading.barrierPotential_VB_V).toBeCloseTo(2.64, 1);
  });

  it('E2E-Expt4: Quantum Tunneling - Varying Width Decay', () => {
    const narrow = tunnelingEngine.calculateReadings({
      particleEnergy_eV: 3.0,
      barrierHeight_eV: 5.0,
      barrierWidth_Angstrom: 1.0,
    });
    const wide = tunnelingEngine.calculateReadings({
      particleEnergy_eV: 3.0,
      barrierHeight_eV: 5.0,
      barrierWidth_Angstrom: 3.0,
    });
    // Wider barrier has strictly smaller transmission T
    expect(wide.transmissionCoefficient_T).toBeLessThan(narrow.transmissionCoefficient_T);
  });

  it('E2E-Expt5: Sodium Grating - Minimum Deviation Doublet Separation', () => {
    const d1 = spectrometerEngine.calculateReadings({
      method: 'minimum_deviation',
      lightSource: 'sodium',
      selectedLine: 'yellow_1',
      gratingRulingsPerInch: 15000,
      order: 1,
      telescopeAngle_deg: 0,
    });
    const d2 = spectrometerEngine.calculateReadings({
      method: 'minimum_deviation',
      lightSource: 'sodium',
      selectedLine: 'yellow_2',
      gratingRulingsPerInch: 15000,
      order: 1,
      telescopeAngle_deg: 0,
    });
    expect(d1.diffractionAngle_deg).toBeGreaterThan(d2.diffractionAngle_deg);
  });

  it('E2E-Expt6: Photodiode - Shielded vs Illuminated Response', () => {
    const dark = photodiodeEngine.calculateReadings({
      reverseVoltage_V: 5.0,
      isShielded: true,
      sourceDistance_cm: 10,
    });
    const light = photodiodeEngine.calculateReadings({
      reverseVoltage_V: 5.0,
      isShielded: false,
      sourceDistance_cm: 10,
    });
    expect(light.totalCurrent_uA).toBeGreaterThan(dark.totalCurrent_uA * 10);
  });

  it('E2E-Expt7: Electron Diffraction - Anode Voltage Dependence', () => {
    const highV = electronDiffractionEngine.calculateReadings({
      anodeVoltage_kV: 5.0,
      screenDistance_mm: 135,
      heaterOn: true,
    });
    const lowV = electronDiffractionEngine.calculateReadings({
      anodeVoltage_kV: 2.5,
      screenDistance_mm: 135,
      heaterOn: true,
    });
    // Higher voltage produces smaller rings (shorter wavelength)
    expect(highV.ring1Diameter_mm).toBeLessThan(lowV.ring1Diameter_mm);
  });

  it('E2E-Expt8: Heisenberg Single-Slit - Width vs Angular Spread Invariant', () => {
    const narrow = heisenbergEngine.calculateReadings({
      slitWidth_um: 30,
      wavelength_nm: 650,
      screenDistance_mm: 1000,
      micrometerPos_mm: 0,
    });
    const wide = heisenbergEngine.calculateReadings({
      slitWidth_um: 90,
      wavelength_nm: 650,
      screenDistance_mm: 1000,
      micrometerPos_mm: 0,
    });
    // Narrower slit creates wider diffraction pattern (larger a1)
    expect(narrow.firstMinimumDistance_mm).toBeGreaterThan(wide.firstMinimumDistance_mm);
  });

  it('E2E-Expt9: Quantum Gates - Gate Composition and Entanglement', () => {
    const res = quantumGatesEngine.calculateReadings({
      theta_rad: 0,
      phi_rad: 0,
      activeGate: 'X',
      twoQubitInputState: '|00>',
      twoQubitGate: 'CNOT',
    });
    // Pauli-X flips |0> to |1> => prob_1 = 1
    expect(res.prob_1).toBeCloseTo(1.0, 1);
  });
});
