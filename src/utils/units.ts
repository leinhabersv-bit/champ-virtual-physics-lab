/**
 * CHAMP Virtual Physics Lab — Standard SI Physical Constants & Precision Unit Conversion Engine
 */

export const CONSTANTS = {
  /** Speed of light in vacuum (m/s) — standard manual value: 3.0e8 */
  c: 2.99792458e8,
  c_manual: 3.0e8,
  /** Elementary charge (Coulombs) */
  e: 1.602176634e-19,
  /** Planck's constant (J·s) — standard manual value: 6.626e-34 */
  h: 6.62607015e-34,
  h_manual: 6.626e-34,
  /** Reduced Planck's constant (J·s) */
  hbar: 1.054571817e-34,
  /** Electron rest mass (kg) */
  m_e: 9.1093837e-31,
  /** Boltzmann constant (J/K) */
  k_B: 1.380649e-23,
  /** Permittivity of free space (F/m) */
  epsilon_0: 8.8541878128e-12,
  /** Standard room temperature (K) */
  T_room: 300,
} as const;

export type LengthUnit = 'm' | 'cm' | 'mm' | 'um' | 'nm' | 'angstrom';
export type VoltageUnit = 'V' | 'mV' | 'kV';
export type CurrentUnit = 'A' | 'mA' | 'uA';
export type PowerUnit = 'W' | 'mW' | 'uW';
export type AngleUnit = 'deg' | 'rad' | 'arcmin';
export type ResistanceUnit = 'ohm' | 'kohm' | 'Mohm';

const LENGTH_FACTORS: Record<LengthUnit, number> = {
  m: 1,
  cm: 1e-2,
  mm: 1e-3,
  um: 1e-6,
  nm: 1e-9,
  angstrom: 1e-10,
};

const VOLTAGE_FACTORS: Record<VoltageUnit, number> = {
  V: 1,
  mV: 1e-3,
  kV: 1e3,
};

const CURRENT_FACTORS: Record<CurrentUnit, number> = {
  A: 1,
  mA: 1e-3,
  uA: 1e-6,
};

const POWER_FACTORS: Record<PowerUnit, number> = {
  W: 1,
  mW: 1e-3,
  uW: 1e-6,
};

const RESISTANCE_FACTORS: Record<ResistanceUnit, number> = {
  ohm: 1,
  kohm: 1e3,
  Mohm: 1e6,
};

export function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  const inMeters = value * LENGTH_FACTORS[from];
  return inMeters / LENGTH_FACTORS[to];
}

export function convertVoltage(value: number, from: VoltageUnit, to: VoltageUnit): number {
  const inVolts = value * VOLTAGE_FACTORS[from];
  return inVolts / VOLTAGE_FACTORS[to];
}

export function convertCurrent(value: number, from: CurrentUnit, to: CurrentUnit): number {
  const inAmperes = value * CURRENT_FACTORS[from];
  return inAmperes / CURRENT_FACTORS[to];
}

export function convertPower(value: number, from: PowerUnit, to: PowerUnit): number {
  const inWatts = value * POWER_FACTORS[from];
  return inWatts / POWER_FACTORS[to];
}

export function convertResistance(value: number, from: ResistanceUnit, to: ResistanceUnit): number {
  const inOhms = value * RESISTANCE_FACTORS[from];
  return inOhms / RESISTANCE_FACTORS[to];
}

export function convertAngle(value: number, from: AngleUnit, to: AngleUnit): number {
  if (from === to) return value;
  let inDegrees: number;
  if (from === 'deg') inDegrees = value;
  else if (from === 'rad') inDegrees = (value * 180) / Math.PI;
  else inDegrees = value / 60; // arcmin to deg

  if (to === 'deg') return inDegrees;
  if (to === 'rad') return (inDegrees * Math.PI) / 180;
  return inDegrees * 60; // to arcmin
}

export function formatEng(val: number, decimals: number = 3): string {
  if (val === 0) return '0';
  const abs = Math.abs(val);
  if (abs >= 1e-3 && abs < 1e4) {
    return val.toFixed(decimals);
  }
  return val.toExponential(decimals);
}
