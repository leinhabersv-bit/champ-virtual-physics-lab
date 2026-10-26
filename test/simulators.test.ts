import { describe, it, expect } from 'vitest';
import { solarCellEngine } from '../src/engine/solarCellSimulator';
import { heisenbergEngine } from '../src/engine/heisenbergSimulator';
import { tunnelingEngine } from '../src/engine/tunnelingSimulator';
import { spectrometerEngine } from '../src/engine/spectrometerSimulator';
import { ledPlanckEngine } from '../src/engine/ledPlanckSimulator';
import { photodiodeEngine } from '../src/engine/photodiodeSimulator';
import { electronDiffractionEngine } from '../src/engine/electronDiffractionSimulator';
import { quantumGatesEngine } from '../src/engine/quantumGatesSimulator';

describe('Deterministic Physics Simulator Contracts (Expts 1–9)', () => {
  it('TC-E1: Solar Cell Engine computes Voc, Isc, Pmax, and Fill Factor', () => {
    const params = {
      distance: 0.20,
      lampPower: 5.0,
      cellArea: 0.0025,
      loadResistance: 1000,
      circuitTopology: 'single' as const,
      panelCount: 3,
    };
    const readings = solarCellEngine.calculateReadings(params);
    expect(readings.openCircuitVoltage_Voc).toBeGreaterThan(1.5);
    expect(readings.shortCircuitCurrent_Isc_mA).toBeGreaterThan(5.0);
    expect(readings.voltage).toBeGreaterThan(0);
    expect(readings.current_mA).toBeGreaterThan(0);

    const derived = solarCellEngine.computeDerived(readings, params);
    expect(derived.fillFactor).toBeGreaterThan(0.3);
    expect(derived.fillFactor).toBeLessThan(0.9);
    expect(derived.efficiencyPercent).toBeGreaterThan(0);
  });

  it('TC-E1-SERIES: Solar cell series configuration sums voltages', () => {
    const single = solarCellEngine.calculateReadings({
      distance: 0.20,
      lampPower: 5.0,
      cellArea: 0.0025,
      loadResistance: 1000,
      circuitTopology: 'single',
      panelCount: 1,
    });
    const series = solarCellEngine.calculateReadings({
      distance: 0.20,
      lampPower: 5.0,
      cellArea: 0.0025,
      loadResistance: 3000,
      circuitTopology: 'series',
      panelCount: 3,
    });
    expect(series.openCircuitVoltage_Voc).toBeCloseTo(single.openCircuitVoltage_Voc * 3, 1);
  });

  it('TC-E2: Spectrometer calculates Hg spectral line diffraction angles', () => {
    const readings = spectrometerEngine.calculateReadings({
      method: 'normal_incidence',
      lightSource: 'mercury',
      selectedLine: 'green', // 546.1 nm
      gratingRulingsPerInch: 15000,
      order: 1,
      telescopeAngle_deg: 0,
    });
    // Expected theta ~ 18.8°
    expect(readings.diffractionAngle_deg).toBeGreaterThan(18.0);
    expect(readings.diffractionAngle_deg).toBeLessThan(19.5);
    expect(readings.percentageError).toBeLessThan(1.0);
  });

  it('TC-E3: LED Planck engine computes h close to physical constant', () => {
    const readings = ledPlanckEngine.calculateReadings({
      ledColor: 'red',
      potentiometerRatio: 0.8,
    });
    expect(readings.barrierPotential_VB_V).toBeCloseTo(1.88, 1);
    const derived = ledPlanckEngine.computeDerived(readings, {
      ledColor: 'red',
      potentiometerRatio: 0.8,
    });
    expect(derived.planckConstantDirect_J_s).toBeGreaterThan(6.0e-34);
    expect(derived.planckConstantDirect_J_s).toBeLessThan(7.2e-34);
  });

  it('TC-E4: Quantum tunneling reproduces sub-barrier exponential decay', () => {
    const readings = tunnelingEngine.calculateReadings({
      particleEnergy_eV: 2.0,
      barrierHeight_eV: 6.0,
      barrierWidth_Angstrom: 1.5,
    });
    expect(readings.transmissionCoefficient_T).toBeGreaterThan(0.01);
    expect(readings.transmissionCoefficient_T).toBeLessThan(0.3);
    expect(readings.transmittedAmplitude_t).toBeCloseTo(Math.sqrt(readings.transmissionCoefficient_T), 4);
    expect(readings.log_e_T).toBeLessThan(0);
  });

  it('TC-E6: Photodiode responsivity and dark current behavior', () => {
    const dark = photodiodeEngine.calculateReadings({
      reverseVoltage_V: 3.0,
      isShielded: true,
      sourceDistance_cm: 10,
    });
    expect(dark.photocurrent_uA).toBe(0);
    expect(dark.darkCurrent_uA).toBeGreaterThan(0.05);

    const illum = photodiodeEngine.calculateReadings({
      reverseVoltage_V: 3.0,
      isShielded: false,
      sourceDistance_cm: 10,
    });
    expect(illum.photocurrent_uA).toBeGreaterThan(0);
    const derived = photodiodeEngine.computeDerived(illum, {
      reverseVoltage_V: 3.0,
      isShielded: false,
      sourceDistance_cm: 10,
    });
    expect(derived.responsivity_A_per_W).toBeCloseTo(0.45, 1);
  });

  it('TC-E7: Electron diffraction calculates de Broglie wavelength and ring diameters', () => {
    const readings = electronDiffractionEngine.calculateReadings({
      anodeVoltage_kV: 4.0,
      screenDistance_mm: 135.0,
      heaterOn: true,
    });
    // lambda ~ 0.0194 nm at 4 kV
    expect(readings.deBroglieWavelength_nm).toBeGreaterThan(0.018);
    expect(readings.deBroglieWavelength_nm).toBeLessThan(0.021);
    expect(readings.ring1Diameter_mm).toBeGreaterThan(15);
    expect(readings.ring2Diameter_mm).toBeGreaterThan(readings.ring1Diameter_mm);
  });

  it('TC-E8: Heisenberg single-slit diffraction proves Delta p_y * Delta y = h', () => {
    const params = {
      slitWidth_um: 40.0,
      wavelength_nm: 650.0,
      screenDistance_mm: 1000.0,
      micrometerPos_mm: 0.0,
    };
    const readings = heisenbergEngine.calculateReadings(params);
    expect(readings.firstMinimumDistance_mm).toBeGreaterThan(10);
    const derived = heisenbergEngine.computeDerived(readings, params);
    // (d / lambda) * sin(theta1) = 1 => Delta py * Delta y = h
    expect(derived.ratioToPlanckConstant).toBeCloseTo(1.0, 2);
  });

  it('TC-E9: Quantum Gates engine verifies Hadamard superposition and Bell state', () => {
    const singleQubit = quantumGatesEngine.calculateReadings({
      theta_rad: 0,
      phi_rad: 0,
      activeGate: 'H',
      twoQubitInputState: '|00>',
      twoQubitGate: 'NONE',
    });
    expect(singleQubit.prob_0).toBeCloseTo(0.5, 1);
    expect(singleQubit.prob_1).toBeCloseTo(0.5, 1);

    const bell = quantumGatesEngine.calculateReadings({
      theta_rad: Math.PI / 2,
      phi_rad: 0,
      activeGate: 'NONE',
      twoQubitInputState: '|+⟩ ⊗ |0⟩',
      twoQubitGate: 'CNOT',
    });
    expect(bell.isEntangled).toBe(true);
    expect(bell.twoQubitTransformedKet).toContain('Bell State');
  });
});
