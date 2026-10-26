import { describe, it, expect } from 'vitest';
import {
  solarCellEngine,
  OFFICIAL_RESISTANCE_SEQUENCE_KOHM,
} from '../src/engine/solarCellSimulator';

describe('Solar Cell 4-Table Parity & Exact Physics Calculations (Experiment 1)', () => {
  it('TC-TAB-01: Verifies official 13-row resistance sequence', () => {
    expect(OFFICIAL_RESISTANCE_SEQUENCE_KOHM).toEqual([
      0.1, 0.22, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0,
    ]);
    expect(OFFICIAL_RESISTANCE_SEQUENCE_KOHM.length).toBe(13);
  });

  it('TC-TAB-02: Generates Table 1 (Single cell, Distance 1) with all 13 rows', () => {
    const table1 = solarCellEngine.generateFullObservationTable(1, 0.25, 'single');
    expect(table1.tableNumber).toBe(1);
    expect(table1.distance_m).toBe(0.25);
    expect(table1.configuration).toBe('single');
    expect(table1.rows.length).toBe(13);

    // Verify power calculation P = V * I (mA -> A conversion)
    for (const row of table1.rows) {
      const expectedPower_W = row.voltage_V * (row.current_mA / 1000);
      expect(row.power_W).toBeCloseTo(expectedPower_W, 5);
      expect(row.power_mW).toBeCloseTo(expectedPower_W * 1000, 2);
    }

    // Verify Voc, Isc, Pmax, FF, Efficiency
    expect(table1.voc_V).toBeGreaterThan(1.8);
    expect(table1.isc_mA).toBeGreaterThan(5.0);
    expect(table1.pMax_W).toBeGreaterThan(0.005);
    expect(table1.fillFactor).toBeGreaterThan(0.4);
    expect(table1.fillFactor).toBeLessThan(0.85);
    expect(table1.efficiencyPercent).toBeGreaterThan(0);
  });

  it('TC-TAB-03: Generates Table 2 (Single cell, Least Distance) with higher illuminance', () => {
    const table2 = solarCellEngine.generateFullObservationTable(2, 0.12, 'single');
    const table1 = solarCellEngine.generateFullObservationTable(1, 0.25, 'single');

    expect(table2.tableNumber).toBe(2);
    expect(table2.distance_m).toBe(0.12);
    expect(table2.rows.length).toBe(13);

    // Least distance (12cm) must have higher Lux and higher Isc than Distance 1 (25cm)
    expect(table2.lux).toBeGreaterThan(table1.lux);
    expect(table2.isc_mA).toBeGreaterThan(table1.isc_mA);
    expect(table2.pMax_W).toBeGreaterThan(table1.pMax_W);
  });

  it('TC-TAB-04: Generates Table 3 (Series Array) summing voltages', () => {
    const table3 = solarCellEngine.generateFullObservationTable(3, 0.20, 'series');
    const single = solarCellEngine.generateFullObservationTable(1, 0.20, 'single');

    expect(table3.tableNumber).toBe(3);
    expect(table3.configuration).toBe('series');
    expect(table3.rows.length).toBe(13);

    // 3 panels in series: Voc ~ 3 * Voc_single
    expect(table3.voc_V).toBeCloseTo(single.voc_V * 3, 1);
  });

  it('TC-TAB-05: Generates Table 4 (Parallel Array) summing currents', () => {
    const table4 = solarCellEngine.generateFullObservationTable(4, 0.20, 'parallel');
    const single = solarCellEngine.generateFullObservationTable(1, 0.20, 'single');

    expect(table4.tableNumber).toBe(4);
    expect(table4.configuration).toBe('parallel');
    expect(table4.rows.length).toBe(13);

    // 3 panels in parallel: Isc ~ 3 * Isc_single
    expect(table4.isc_mA).toBeCloseTo(single.isc_mA * 3, 1);
  });

  it('TC-CALIB-01: Verifies Lux vs Radiometric Irradiance (Io) separation & calibration factor', () => {
    const { lux, calibratedIo } = solarCellEngine.getOptics(0.20, 5.0, 0.0125);
    expect(lux).toBeGreaterThan(1000);
    // Radiometric Io must be distinct from Lux
    expect(calibratedIo).toBeCloseTo(lux * 0.0125, 1);
    expect(calibratedIo).not.toBe(lux);
  });

  it('TC-GUARD-01: Zero-denominator guards for Fill Factor and Efficiency', () => {
    // Zero irradiance case:
    const zeroIrradiance = solarCellEngine.calculateReadings({
      distance: 100, // very far
      lampPower: 0.00001,
      cellArea: 0.0025,
      loadResistance: 1000,
      circuitTopology: 'single',
      panelCount: 1,
      spectralCalibrationFactor_W_per_m2_per_lux: 0, // uncalibrated
    });
    const derived = solarCellEngine.computeDerived(zeroIrradiance, {
      distance: 100,
      lampPower: 0.00001,
      cellArea: 0.0025,
      loadResistance: 1000,
      circuitTopology: 'single',
      panelCount: 1,
      spectralCalibrationFactor_W_per_m2_per_lux: 0,
    });

    // Guard prevents NaN or Infinity
    expect(Number.isFinite(derived.fillFactor)).toBe(true);
    expect(derived.efficiencyPercent === null || Number.isFinite(derived.efficiencyPercent)).toBe(true);
  });
});
