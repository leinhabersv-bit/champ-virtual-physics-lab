import { describe, it, expect } from 'vitest';
import {
  CONSTANTS,
  convertLength,
  convertCurrent,
  convertVoltage,
  convertPower,
  convertAngle,
  convertResistance,
} from '../src/utils/units';

describe('SI Units & Physical Constants Engine', () => {
  it('TC-UNIT-01: converts length dimensions accurately', () => {
    expect(convertLength(1.5, 'nm', 'm')).toBeCloseTo(1.5e-9, 15);
    expect(convertLength(650, 'nm', 'um')).toBeCloseTo(0.65, 6);
    expect(convertLength(10, 'cm', 'm')).toBeCloseTo(0.1, 6);
    expect(convertLength(1.5, 'angstrom', 'nm')).toBeCloseTo(0.15, 6);
  });

  it('TC-UNIT-02: converts current dimensions accurately', () => {
    expect(convertCurrent(2.5, 'mA', 'A')).toBeCloseTo(0.0025, 6);
    expect(convertCurrent(100, 'uA', 'mA')).toBeCloseTo(0.1, 6);
    expect(convertCurrent(0.5, 'A', 'mA')).toBeCloseTo(500, 3);
  });

  it('TC-UNIT-03: converts electrical potential and power', () => {
    expect(convertVoltage(4.0, 'kV', 'V')).toBe(4000);
    expect(convertPower(15.6, 'mW', 'W')).toBeCloseTo(0.0156, 6);
    expect(convertResistance(1.0, 'kohm', 'ohm')).toBe(1000);
  });

  it('TC-UNIT-04: converts angular units for spectrometer', () => {
    expect(convertAngle(30, 'arcmin', 'deg')).toBeCloseTo(0.5, 6);
    expect(convertAngle(180, 'deg', 'rad')).toBeCloseTo(Math.PI, 6);
    expect(convertAngle(Math.PI / 2, 'rad', 'deg')).toBeCloseTo(90, 6);
  });

  it('TC-CONST-01: verifies standard constants against physics literature', () => {
    expect(CONSTANTS.c_manual).toBe(3.0e8);
    expect(CONSTANTS.h_manual).toBe(6.626e-34);
    expect(CONSTANTS.e).toBeCloseTo(1.602176634e-19, 25);
    expect(CONSTANTS.m_e).toBeCloseTo(9.1093837e-31, 35);
  });
});
