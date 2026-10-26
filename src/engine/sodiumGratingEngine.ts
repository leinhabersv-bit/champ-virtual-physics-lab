/**
 * Sodium Grating Minimum Deviation Engine
 * VIT Chennai BAPHY105 Manual (Experiment 5, pp. 53-55 & Spectrometer Module pp. 18-21)
 *
 * Physics & Theory:
 * 1. Grating element:
 *    (e + d) = (2.54 * 10^-2) / N  (in meters, N = lines per inch)
 * 2. Oblique incidence grating equation:
 *    (e + d) * (sin(i) + sin(theta)) = n * lambda
 *    where:
 *      i = angle of incidence relative to grating normal
 *      theta = angle of diffraction relative to grating normal
 *      Total deviation: D(i) = i + theta(i)
 * 3. Minimum deviation condition:
 *    dD/di = 0  =>  i = theta = Dm / 2
 *    => 2 * (e + d) * sin(Dm / 2) = n * lambda
 *    => lambda = [ 2 * (e + d) * sin(Dm / 2) ] / n
 *
 * 4. Turning Point / Extremum:
 *    As the prism table carrying the grating is rotated continuously in one direction,
 *    deviation D decreases until i = Dm/2, reaching an extremum where dD/di = 0,
 *    and then reverses direction!
 *
 * 5. Spectrometer Vernier System:
 *    1 MSD = 0.5 deg = 30'
 *    30 VSD = 29 MSD => LC = 1 MSD - 1 VSD = 1' = (1/60) deg
 *    TR = MSR + (VSC * 1')
 *    Two diametrically opposite verniers V1 and V2 (180 deg offset)
 *    2*Dm = |a - b| (shortest circular arc between Left and Right telescope positions)
 *    Dm = 2*Dm / 2
 *    Mean Dm = [ Dm(V1) + Dm(V2) ] / 2
 */

export interface SodiumSpectralLine {
  id: 'yellow_1' | 'yellow_2';
  name: string;
  symbol: string;
  lambda_ref_Angstrom: number; // 5896 Å for D1, 5890 Å for D2
  lambda_ref_nm: number;       // 589.6 nm, 589.0 nm
  colorHex: string;
  glowColor: string;
}

export const SODIUM_SPECTRUM: Record<'yellow_1' | 'yellow_2', SodiumSpectralLine> = {
  yellow_1: {
    id: 'yellow_1',
    name: 'Yellow 1 (D₁)',
    symbol: 'D₁',
    lambda_ref_Angstrom: 5896,
    lambda_ref_nm: 589.6,
    colorHex: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.9)',
  },
  yellow_2: {
    id: 'yellow_2',
    name: 'Yellow 2 (D₂)',
    symbol: 'D₂',
    lambda_ref_Angstrom: 5890,
    lambda_ref_nm: 589.0,
    colorHex: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.9)',
  },
};

export const SODIUM_LINE_KEYS: Array<'yellow_1' | 'yellow_2'> = ['yellow_1', 'yellow_2'];

export interface DMS {
  degrees: number;
  minutes: number;
  seconds: number;
  totalDegrees: number;
  formatted: string;
}

export interface VernierReading {
  rawAngle_deg: number;
  msr_deg: number;          // in decimal degrees (multiples of 0.5)
  msr_degrees_part: number; // e.g. 199
  msr_minutes_part: number; // e.g. 30
  msr_str: string;          // e.g. 199° 30'
  vsc: number;              // Vernier Scale Coincidence (0 to 29)
  vsr_minutes: number;      // VSC * LC in minutes
  totalReading_deg: number; // MSR + VSR
  tr_str: string;           // e.g. 199° 33'
  dms: DMS;
}

export interface SodiumObservationRow {
  colorKey: 'yellow_1' | 'yellow_2';
  colorName: string;
  vernier: 'V1' | 'V2';
  leftReading: VernierReading;  // a
  rightReading: VernierReading; // b
  minimumDeviation_2Dm_deg: number; // 2Dm = |a - b|
  minimumDeviation_Dm_deg: number;  // Dm = 2Dm / 2
  calculatedWavelength_nm: number;
  calculatedWavelength_Angstrom: number;
  percentageError: number;
}

export interface SodiumSummaryRow {
  colorKey: 'yellow_1' | 'yellow_2';
  colorName: string;
  standardWavelength_nm: number;
  standardWavelength_Angstrom: number;
  mean_Dm_V1_deg: number;
  mean_Dm_V2_deg: number;
  mean_Dm_deg: number;
  mean_Dm_dms: DMS;
  observedWavelength_nm: number;
  observedWavelength_Angstrom: number;
  percentageError: number;
}

export interface MinimumDeviationState {
  tableAngle_deg: number;
  telescopeAngle_deg: number;
  incidentAngle_i_deg: number;
  diffractionAngle_theta_deg: number;
  deviationAngle_D_deg: number;
  isAtExtremum: boolean;
  turningVelocity: number; // dD/di
  extremum_Dm_deg: number;
}

/**
 * Normalizes an angle into [0, 360) degrees.
 */
export function normalizeAngle(angleDeg: number): number {
  const mod = angleDeg % 360;
  return mod < 0 ? mod + 360 : mod;
}

/**
 * Computes shortest angular distance around 360° circle.
 */
export function circularDistance(angleA: number, angleB: number): number {
  const normA = normalizeAngle(angleA);
  const normB = normalizeAngle(angleB);
  let diff = Math.abs(normA - normB);
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}

/**
 * Converts decimal degrees to DMS structure.
 */
export function toDMS(decimalDeg: number): DMS {
  const total = normalizeAngle(decimalDeg);
  const totalSeconds = Math.round(total * 3600);
  const degrees = Math.floor(totalSeconds / 3600);
  const remSeconds = totalSeconds % 3600;
  const minutes = Math.floor(remSeconds / 60);
  const seconds = remSeconds % 60;

  const formatted = `${degrees}° ${String(minutes).padStart(2, '0')}'${
    seconds > 0 ? ` ${String(seconds).padStart(2, '0')}''` : ''
  }`;

  return {
    degrees,
    minutes,
    seconds,
    totalDegrees: degrees + minutes / 60 + seconds / 3600,
    formatted,
  };
}

/**
 * Decomposes an angle into spectrometer MSR, VSC, and TR using LC = 1'.
 * Main scale has ticks every 0.5° (30'). Vernier has 30 divisions for 29 MSD.
 */
export function decomposeAngleToVernier(angleDeg: number): VernierReading {
  const norm = normalizeAngle(angleDeg);
  const totalMinutes = Math.round(norm * 60);
  const msrMinutes = Math.floor(totalMinutes / 30) * 30;
  let vsc = totalMinutes - msrMinutes;

  if (vsc >= 30) {
    vsc = 29;
  }

  const msrDegreesPart = Math.floor(msrMinutes / 60);
  const msrMinutesPart = msrMinutes % 60;
  const msrDeg = msrMinutes / 60;
  const trMinutes = msrMinutes + vsc;
  const trDeg = trMinutes / 60;

  return {
    rawAngle_deg: norm,
    msr_deg: msrDeg,
    msr_degrees_part: msrDegreesPart,
    msr_minutes_part: msrMinutesPart,
    msr_str: `${msrDegreesPart}° ${msrMinutesPart}'`,
    vsc,
    vsr_minutes: vsc, // LC = 1'
    totalReading_deg: trDeg,
    tr_str: `${Math.floor(trDeg)}° ${trMinutes % 60}'`,
    dms: toDMS(trDeg),
  };
}

export class SodiumGratingEngine {
  /**
   * Calculates grating element (e + d) in meters.
   * Default N = 15,000 lines/inch => (e + d) = 1.693333e-6 m.
   */
  calculateGratingElement(linesPerInch = 15000): number {
    return 0.0254 / linesPerInch;
  }

  /**
   * Calculates minimum deviation angle Dm (in degrees) for given wavelength and grating element.
   * 2 * (e + d) * sin(Dm / 2) = n * lambda
   * => Dm = 2 * asin( (n * lambda) / (2 * (e + d)) )
   */
  calculateMinimumDeviationAngle(
    lambda_nm: number,
    linesPerInch = 15000,
    order = 1
  ): number {
    const gratingElement_m = this.calculateGratingElement(linesPerInch);
    const lambda_m = lambda_nm * 1e-9;
    const sinHalfDm = (order * lambda_m) / (2 * gratingElement_m);
    const clampedSin = Math.max(-1, Math.min(1, sinHalfDm));
    const halfDm_rad = Math.asin(clampedSin);
    return (2 * halfDm_rad * 180) / Math.PI;
  }

  /**
   * Computes deviation D(i) = i + theta(i) for general incident angle i.
   * (e + d) * (sin(i) + sin(theta)) = n * lambda
   * => sin(theta) = (n * lambda) / (e + d) - sin(i)
   */
  calculateDeviationAtIncidence(
    i_deg: number,
    lambda_nm: number,
    linesPerInch = 15000,
    order = 1
  ): {
    diffractionAngle_theta_deg: number;
    deviationAngle_D_deg: number;
    dD_di: number;
    isPhysical: boolean;
  } {
    const gratingElement_m = this.calculateGratingElement(linesPerInch);
    const lambda_m = lambda_nm * 1e-9;
    const i_rad = (i_deg * Math.PI) / 180;
    const sinTheta = (order * lambda_m) / gratingElement_m - Math.sin(i_rad);

    if (Math.abs(sinTheta) > 1.0) {
      return {
        diffractionAngle_theta_deg: NaN,
        deviationAngle_D_deg: NaN,
        dD_di: NaN,
        isPhysical: false,
      };
    }

    const theta_rad = Math.asin(sinTheta);
    const theta_deg = (theta_rad * 180) / Math.PI;
    const D_deg = i_deg + theta_deg;
    const dD_di = 1 - Math.cos(i_rad) / Math.cos(theta_rad);

    return {
      diffractionAngle_theta_deg: theta_deg,
      deviationAngle_D_deg: D_deg,
      dD_di,
      isPhysical: true,
    };
  }

  /**
   * Calculates wavelength from minimum deviation angle Dm.
   * lambda = [ 2 * (e + d) * sin(Dm / 2) ] / n
   */
  calculateWavelengthFromDm(
    Dm_deg: number,
    linesPerInch = 15000,
    order = 1
  ): {
    wavelength_m: number;
    wavelength_nm: number;
    wavelength_Angstrom: number;
  } {
    const gratingElement_m = this.calculateGratingElement(linesPerInch);
    const halfDm_rad = ((Dm_deg / 2) * Math.PI) / 180;
    const lambda_m = (2 * gratingElement_m * Math.sin(halfDm_rad)) / order;
    const wavelength_nm = lambda_m * 1e9;
    const wavelength_Angstrom = lambda_m * 1e10;

    return {
      wavelength_m: lambda_m,
      wavelength_nm: Number(wavelength_nm.toFixed(2)),
      wavelength_Angstrom: Number(wavelength_Angstrom.toFixed(1)),
    };
  }

  /**
   * Generates exact theoretical observation table matching Manual p. 55:
   * 4 rows total (Yellow 1 with V1/V2, Yellow 2 with V1/V2).
   */
  generateTheoreticalTable(
    directAngle_deg = 180.0,
    linesPerInch = 15000,
    order = 1
  ): SodiumObservationRow[] {
    const rows: SodiumObservationRow[] = [];

    for (const key of SODIUM_LINE_KEYS) {
      const line = SODIUM_SPECTRUM[key];
      const Dm = this.calculateMinimumDeviationAngle(line.lambda_ref_nm, linesPerInch, order);

      // Left and Right telescope positions relative to direct image
      const leftAngle = normalizeAngle(directAngle_deg - Dm);
      const rightAngle = normalizeAngle(directAngle_deg + Dm);

      // Vernier 1 readings
      const leftV1 = decomposeAngleToVernier(leftAngle);
      const rightV1 = decomposeAngleToVernier(rightAngle);
      const diff2Dm_V1 = circularDistance(leftV1.totalReading_deg, rightV1.totalReading_deg);
      const Dm_V1 = diff2Dm_V1 / 2;
      const calcV1 = this.calculateWavelengthFromDm(Dm_V1, linesPerInch, order);
      const errV1 = Math.abs((calcV1.wavelength_nm - line.lambda_ref_nm) / line.lambda_ref_nm) * 100;

      rows.push({
        colorKey: key,
        colorName: line.name,
        vernier: 'V1',
        leftReading: leftV1,
        rightReading: rightV1,
        minimumDeviation_2Dm_deg: Number(diff2Dm_V1.toFixed(4)),
        minimumDeviation_Dm_deg: Number(Dm_V1.toFixed(4)),
        calculatedWavelength_nm: calcV1.wavelength_nm,
        calculatedWavelength_Angstrom: calcV1.wavelength_Angstrom,
        percentageError: Number(errV1.toFixed(2)),
      });

      // Vernier 2 readings (180° offset)
      const leftV2 = decomposeAngleToVernier(leftAngle + 180);
      const rightV2 = decomposeAngleToVernier(rightAngle + 180);
      const diff2Dm_V2 = circularDistance(leftV2.totalReading_deg, rightV2.totalReading_deg);
      const Dm_V2 = diff2Dm_V2 / 2;
      const calcV2 = this.calculateWavelengthFromDm(Dm_V2, linesPerInch, order);
      const errV2 = Math.abs((calcV2.wavelength_nm - line.lambda_ref_nm) / line.lambda_ref_nm) * 100;

      rows.push({
        colorKey: key,
        colorName: line.name,
        vernier: 'V2',
        leftReading: leftV2,
        rightReading: rightV2,
        minimumDeviation_2Dm_deg: Number(diff2Dm_V2.toFixed(4)),
        minimumDeviation_Dm_deg: Number(Dm_V2.toFixed(4)),
        calculatedWavelength_nm: calcV2.wavelength_nm,
        calculatedWavelength_Angstrom: calcV2.wavelength_Angstrom,
        percentageError: Number(errV2.toFixed(2)),
      });
    }

    return rows;
  }

  /**
   * Computes final Summary Results matching Manual p. 55 Result section:
   * Observed vs Standard Wavelengths for Yellow 1 and Yellow 2.
   */
  generateSummaryResults(
    rows: SodiumObservationRow[],
    linesPerInch = 15000,
    order = 1
  ): SodiumSummaryRow[] {
    const summary: SodiumSummaryRow[] = [];

    for (const key of SODIUM_LINE_KEYS) {
      const line = SODIUM_SPECTRUM[key];
      const v1Row = rows.find((r) => r.colorKey === key && r.vernier === 'V1');
      const v2Row = rows.find((r) => r.colorKey === key && r.vernier === 'V2');

      const dmV1 = v1Row ? v1Row.minimumDeviation_Dm_deg : 0;
      const dmV2 = v2Row ? v2Row.minimumDeviation_Dm_deg : 0;
      const meanDm = (dmV1 + dmV2) / 2;

      const calc = this.calculateWavelengthFromDm(meanDm, linesPerInch, order);
      const pctError = Math.abs((calc.wavelength_nm - line.lambda_ref_nm) / line.lambda_ref_nm) * 100;

      summary.push({
        colorKey: key,
        colorName: line.name,
        standardWavelength_nm: line.lambda_ref_nm,
        standardWavelength_Angstrom: line.lambda_ref_Angstrom,
        mean_Dm_V1_deg: Number(dmV1.toFixed(4)),
        mean_Dm_V2_deg: Number(dmV2.toFixed(4)),
        mean_Dm_deg: Number(meanDm.toFixed(4)),
        mean_Dm_dms: toDMS(meanDm),
        observedWavelength_nm: calc.wavelength_nm,
        observedWavelength_Angstrom: calc.wavelength_Angstrom,
        percentageError: Number(pctError.toFixed(2)),
      });
    }

    return summary;
  }
}

export const sodiumGratingEngine = new SodiumGratingEngine();
