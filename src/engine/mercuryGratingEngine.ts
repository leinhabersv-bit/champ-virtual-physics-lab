/**
 * Mercury Grating Normal Incidence Engine
 * VIT Chennai BAPHY105 Manual (Experiment 2, pp. 33-37 & Spectrometer Module pp. 18-21)
 *
 * Theory:
 * Grating element: (e + d) = 2.54 * 10^-2 / N (m), where N is lines per inch.
 * Normal incidence condition: (e + d) * sin(theta) = n * lambda
 *   => lambda = ((e + d) * sin(theta)) / n
 *
 * Spectrometer Scale:
 * 1 MSD = 0.5 deg = 30'
 * 30 VSD = 29 MSD => 1 VSD = (29/30) * 30' = 29'
 * LC = 1 MSD - 1 VSD = 1' = (1/60) deg
 * TR = MSR + (VSC * LC)
 *
 * Two diametrically opposite verniers V1 and V2 (180 deg offset):
 * Left reading: a, Right reading: b
 * 2*theta = |a - b| (shortest circular arc)
 * theta = (a - b) / 2
 * Mean theta = (theta_V1 + theta_V2) / 2
 */

export interface MercurySpectralLine {
  id: 'blue' | 'green' | 'yellow' | 'red';
  name: string;
  lambda_ref_Angstrom: number; // Manual reference value in Angstroms
  lambda_ref_nm: number;       // nm equivalent
  colorHex: string;
  glowColor: string;
}

export const MERCURY_SPECTRUM: Record<'blue' | 'green' | 'yellow' | 'red', MercurySpectralLine> = {
  blue: {
    id: 'blue',
    name: 'Blue',
    lambda_ref_Angstrom: 4693, // Manual p. 36 & p. 37: 4693 Å
    lambda_ref_nm: 469.3,
    colorHex: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.8)',
  },
  green: {
    id: 'green',
    name: 'Green',
    lambda_ref_Angstrom: 5461, // Manual p. 36 & p. 37: 5461 Å
    lambda_ref_nm: 546.1,
    colorHex: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.85)',
  },
  yellow: {
    id: 'yellow',
    name: 'Yellow',
    lambda_ref_Angstrom: 5770, // Manual p. 36 & p. 37: 5770 Å
    lambda_ref_nm: 577.0,
    colorHex: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.85)',
  },
  red: {
    id: 'red',
    name: 'Red',
    lambda_ref_Angstrom: 6238, // Manual p. 36 & p. 37: 6238 Å
    lambda_ref_nm: 623.8,
    colorHex: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.8)',
  },
};

export const MERCURY_LINE_KEYS: Array<'blue' | 'green' | 'yellow' | 'red'> = [
  'blue',
  'green',
  'yellow',
  'red',
];

export interface DMS {
  degrees: number;
  minutes: number;
  seconds: number;
  totalDegrees: number;
  formatted: string;
}

export interface VernierReading {
  rawAngle_deg: number;
  msr_deg: number;         // in decimal degrees (multiples of 0.5)
  msr_degrees_part: number; // e.g. 110
  msr_minutes_part: number; // e.g. 30
  vsc: number;              // Vernier Scale Coincidence (0 to 29)
  vsr_minutes: number;      // VSC * LC in minutes
  totalReading_deg: number; // MSR + VSR
  dms: DMS;
}

export interface SpectralObservationRow {
  color: 'blue' | 'green' | 'yellow' | 'red';
  colorName: string;
  vernier: 'V1' | 'V2';
  leftReading: VernierReading;  // a
  rightReading: VernierReading; // b
  diffractionAngle_2theta_deg: number; // 2*theta = |a - b|
  diffractionAngle_theta_deg: number;  // theta = 2*theta / 2
  diffractionAngle_theta_dms: DMS;
}

export interface TableLineSummary {
  color: 'blue' | 'green' | 'yellow' | 'red';
  colorName: string;
  v1_theta_deg: number;
  v2_theta_deg: number;
  mean_theta_deg: number;
  mean_theta_dms: DMS;
  calculated_lambda_m: number;
  calculated_lambda_nm: number;
  calculated_lambda_Angstrom: number;
  reference_lambda_Angstrom: number;
  percentageError: number;
}

export interface NormalIncidenceAlignmentState {
  stage: 'DIRECT_IMAGE' | 'SWING_90' | 'GRATING_45' | 'NORMAL_SET' | 'ALIGNED';
  telescopeAngle_deg: number;
  prismTableAngle_deg: number;
  directAngle_deg: number;
  isNormalIncidenceAchieved: boolean;
  message: string;
}

export class MercuryGratingEngine {
  // Constants from BAPHY105 Manual
  public readonly INCH_TO_METRE = 2.54e-2; // 2.54 * 10^-2 m/inch
  public readonly DEFAULT_RULINGS_PER_INCH = 15000;
  public readonly LEAST_COUNT_MINUTES = 1; // 1 minute of arc (1/60 deg)
  public readonly LEAST_COUNT_DEG = 1 / 60;
  public readonly ONE_MSD_DEG = 0.5; // 30 minutes
  public readonly VSD_DIVISIONS = 30;

  /**
   * Calculates grating element (e + d) in metres.
   * Manual p. 36: (e + d) = 2.54 * 10^-2 / N
   */
  public calculateGratingElement(rulingsPerInch: number = this.DEFAULT_RULINGS_PER_INCH): {
    rulingsPerInch: number;
    rulingsPerMetre: number;
    gratingElement_m: number;
    gratingElement_nm: number;
    gratingElement_Angstrom: number;
  } {
    if (rulingsPerInch <= 0) {
      throw new Error('Grating rulings per inch must be greater than zero.');
    }
    const rulingsPerMetre = rulingsPerInch / this.INCH_TO_METRE;
    const gratingElement_m = this.INCH_TO_METRE / rulingsPerInch;
    return {
      rulingsPerInch,
      rulingsPerMetre: Math.round(rulingsPerMetre),
      gratingElement_m,
      gratingElement_nm: gratingElement_m * 1e9,
      gratingElement_Angstrom: gratingElement_m * 1e10,
    };
  }

  /**
   * Normalizes an angle to [0, 360) degrees.
   */
  public normalizeAngle(angle_deg: number): number {
    let a = angle_deg % 360;
    if (a < 0) a += 360;
    // Guard against floating point imprecision giving 360.0
    return a >= 360 ? 0 : a;
  }

  /**
   * Computes shortest circular angular distance between two angles in [0, 360).
   * Automatically handles modular wraparound across the 0° / 360° boundary.
   */
  public circularDistance(angleA_deg: number, angleB_deg: number): number {
    const normA = this.normalizeAngle(angleA_deg);
    const normB = this.normalizeAngle(angleB_deg);
    const diff = Math.abs(normA - normB);
    const shortest = diff > 180 ? 360 - diff : diff;
    return shortest;
  }

  /**
   * Decimal degrees to Degree-Minute-Second (DMS) structure.
   */
  public decimalToDMS(decimalDeg: number): DMS {
    const normalized = Math.abs(decimalDeg);
    const degrees = Math.floor(normalized);
    const totalMinutes = (normalized - degrees) * 60;
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.round((totalMinutes - minutes) * 60);

    // Roll-over seconds if 60
    let adjMinutes = minutes;
    let adjDegrees = degrees;
    let adjSeconds = seconds;
    if (adjSeconds >= 60) {
      adjSeconds = 0;
      adjMinutes += 1;
    }
    if (adjMinutes >= 60) {
      adjMinutes = 0;
      adjDegrees += 1;
    }

    const sign = decimalDeg < 0 ? '-' : '';
    const formatted = `${sign}${adjDegrees}° ${adjMinutes.toString().padStart(2, '0')}' ${adjSeconds.toString().padStart(2, '0')}''`;

    return {
      degrees: adjDegrees,
      minutes: adjMinutes,
      seconds: adjSeconds,
      totalDegrees: decimalDeg,
      formatted,
    };
  }

  /**
   * Decomposes a continuous angle into Spectrometer Vernier Reading components:
   * 1 MSD = 0.5° (30')
   * LC = 1'
   * MSR is the largest multiple of 0.5° less than or equal to angle.
   * VSC is the vernier coincidence mark (0 to 29) closest to the remainder.
   */
  public angleToVernierReading(angle_deg: number): VernierReading {
    const normAngle = this.normalizeAngle(angle_deg);

    // Number of half-degree intervals
    const halfDegreeIntervals = Math.floor(normAngle / this.ONE_MSD_DEG);
    const msr_deg = halfDegreeIntervals * this.ONE_MSD_DEG;
    const msr_degrees_part = Math.floor(msr_deg);
    const msr_minutes_part = Math.round((msr_deg - msr_degrees_part) * 60); // 0 or 30

    // Remainder in minutes
    const remainderDeg = normAngle - msr_deg;
    const remainderMin = remainderDeg * 60;

    // VSC is the number of 1-minute steps
    let vsc = Math.round(remainderMin / this.LEAST_COUNT_MINUTES);
    if (vsc >= this.VSD_DIVISIONS) {
      vsc = this.VSD_DIVISIONS - 1;
    }
    if (vsc < 0) vsc = 0;

    const vsr_minutes = vsc * this.LEAST_COUNT_MINUTES;
    const totalReading_deg = msr_deg + vsr_minutes / 60;
    const dms = this.decimalToDMS(totalReading_deg);

    return {
      rawAngle_deg: Number(normAngle.toFixed(4)),
      msr_deg,
      msr_degrees_part,
      msr_minutes_part,
      vsc,
      vsr_minutes,
      totalReading_deg: Number(totalReading_deg.toFixed(4)),
      dms,
    };
  }

  /**
   * Reconstitutes total reading from entered MSR and VSC values.
   */
  public composeVernierReading(
    msr_degrees: number,
    msr_minutes: 0 | 30,
    vsc: number
  ): VernierReading {
    const clampedVSC = Math.min(29, Math.max(0, Math.round(vsc)));
    const msr_deg = msr_degrees + msr_minutes / 60;
    const vsr_min = clampedVSC * this.LEAST_COUNT_MINUTES;
    const total_deg = this.normalizeAngle(msr_deg + vsr_min / 60);
    const dms = this.decimalToDMS(total_deg);

    return {
      rawAngle_deg: total_deg,
      msr_deg,
      msr_degrees_part: msr_degrees,
      msr_minutes_part: msr_minutes,
      vsc: clampedVSC,
      vsr_minutes: vsr_min,
      totalReading_deg: total_deg,
      dms,
    };
  }

  /**
   * Theoretical diffraction angle theta for normal incidence:
   * (e + d) * sin(theta) = n * lambda
   * => sin(theta) = (n * lambda) / (e + d)
   */
  public calculateDiffractionAngle(
    lambda_nm: number,
    rulingsPerInch: number = this.DEFAULT_RULINGS_PER_INCH,
    order: number = 1
  ): {
    theta_rad: number;
    theta_deg: number;
    isPhysical: boolean;
    sinTheta: number;
  } {
    const { gratingElement_m } = this.calculateGratingElement(rulingsPerInch);
    const lambda_m = lambda_nm * 1e-9;
    const sinTheta = (order * lambda_m) / gratingElement_m;

    if (sinTheta > 1.0) {
      return {
        theta_rad: Math.PI / 2,
        theta_deg: 90,
        isPhysical: false,
        sinTheta,
      };
    }

    const theta_rad = Math.asin(sinTheta);
    const theta_deg = (theta_rad * 180) / Math.PI;

    return {
      theta_rad,
      theta_deg,
      isPhysical: true,
      sinTheta,
    };
  }

  /**
   * Generates full left and right vernier observations for all 4 Mercury lines.
   * Matches Manual Table p. 36:
   * - Blue (4693 Å)
   * - Green (5461 Å)
   * - Yellow (5770 Å)
   * - Red (6238 Å)
   */
  public generateFullObservationTable(
    directAngle_deg: number = 180.0,
    rulingsPerInch: number = this.DEFAULT_RULINGS_PER_INCH
  ): {
    rows: SpectralObservationRow[];
    summaries: TableLineSummary[];
  } {
    const rows: SpectralObservationRow[] = [];
    const summaries: TableLineSummary[] = [];

    const normDirect = this.normalizeAngle(directAngle_deg);
    const { gratingElement_m } = this.calculateGratingElement(rulingsPerInch);

    for (const key of MERCURY_LINE_KEYS) {
      const line = MERCURY_SPECTRUM[key];
      const { theta_deg } = this.calculateDiffractionAngle(line.lambda_ref_nm, rulingsPerInch, 1);

      // Left side is direct - theta
      const leftAngleV1 = this.normalizeAngle(normDirect - theta_deg);
      const rightAngleV1 = this.normalizeAngle(normDirect + theta_deg);

      // Vernier 2 is diametrically opposite (offset by 180°)
      const leftAngleV2 = this.normalizeAngle(leftAngleV1 + 180);
      const rightAngleV2 = this.normalizeAngle(rightAngleV1 + 180);

      // Vernier readings breakdown
      const leftV1 = this.angleToVernierReading(leftAngleV1);
      const rightV1 = this.angleToVernierReading(rightAngleV1);
      const leftV2 = this.angleToVernierReading(leftAngleV2);
      const rightV2 = this.angleToVernierReading(rightAngleV2);

      // 2*theta = |a - b| using modular circular distance
      const diff2ThetaV1 = this.circularDistance(leftV1.totalReading_deg, rightV1.totalReading_deg);
      const thetaV1 = diff2ThetaV1 / 2;

      const diff2ThetaV2 = this.circularDistance(leftV2.totalReading_deg, rightV2.totalReading_deg);
      const thetaV2 = diff2ThetaV2 / 2;

      const rowV1: SpectralObservationRow = {
        color: key,
        colorName: line.name,
        vernier: 'V1',
        leftReading: leftV1,
        rightReading: rightV1,
        diffractionAngle_2theta_deg: Number(diff2ThetaV1.toFixed(4)),
        diffractionAngle_theta_deg: Number(thetaV1.toFixed(4)),
        diffractionAngle_theta_dms: this.decimalToDMS(thetaV1),
      };

      const rowV2: SpectralObservationRow = {
        color: key,
        colorName: line.name,
        vernier: 'V2',
        leftReading: leftV2,
        rightReading: rightV2,
        diffractionAngle_2theta_deg: Number(diff2ThetaV2.toFixed(4)),
        diffractionAngle_theta_deg: Number(thetaV2.toFixed(4)),
        diffractionAngle_theta_dms: this.decimalToDMS(thetaV2),
      };

      rows.push(rowV1, rowV2);

      // Mean theta across V1 and V2
      const meanTheta = (thetaV1 + thetaV2) / 2;
      const meanThetaRad = (meanTheta * Math.PI) / 180;

      // Calculated lambda = (e + d) * sin(theta) / 1
      const calcLambda_m = gratingElement_m * Math.sin(meanThetaRad);
      const calcLambda_nm = calcLambda_m * 1e9;
      const calcLambda_Angstrom = calcLambda_m * 1e10;

      const pctError =
        (Math.abs(calcLambda_Angstrom - line.lambda_ref_Angstrom) / line.lambda_ref_Angstrom) * 100;

      summaries.push({
        color: key,
        colorName: line.name,
        v1_theta_deg: Number(thetaV1.toFixed(4)),
        v2_theta_deg: Number(thetaV2.toFixed(4)),
        mean_theta_deg: Number(meanTheta.toFixed(4)),
        mean_theta_dms: this.decimalToDMS(meanTheta),
        calculated_lambda_m: calcLambda_m,
        calculated_lambda_nm: Number(calcLambda_nm.toFixed(2)),
        calculated_lambda_Angstrom: Math.round(calcLambda_Angstrom),
        reference_lambda_Angstrom: line.lambda_ref_Angstrom,
        percentageError: Number(pctError.toFixed(2)),
      });
    }

    return { rows, summaries };
  }

  /**
   * Calculates lambda from user-supplied Left and Right readings for a spectral line.
   */
  public computeWavelengthFromReadings(
    leftReadingV1_deg: number,
    rightReadingV1_deg: number,
    leftReadingV2_deg: number,
    rightReadingV2_deg: number,
    refLambda_Angstrom: number,
    rulingsPerInch: number = this.DEFAULT_RULINGS_PER_INCH,
    order: number = 1
  ): {
    thetaV1_deg: number;
    thetaV2_deg: number;
    meanTheta_deg: number;
    lambda_m: number;
    lambda_nm: number;
    lambda_Angstrom: number;
    percentageError: number;
  } {
    const { gratingElement_m } = this.calculateGratingElement(rulingsPerInch);

    const diffV1 = this.circularDistance(leftReadingV1_deg, rightReadingV1_deg);
    const thetaV1 = diffV1 / 2;

    const diffV2 = this.circularDistance(leftReadingV2_deg, rightReadingV2_deg);
    const thetaV2 = diffV2 / 2;

    const meanTheta_deg = (thetaV1 + thetaV2) / 2;
    const sinTheta = Math.sin((meanTheta_deg * Math.PI) / 180);

    const lambda_m = (gratingElement_m * sinTheta) / order;
    const lambda_nm = lambda_m * 1e9;
    const lambda_Angstrom = lambda_m * 1e10;

    const percentageError =
      refLambda_Angstrom > 0
        ? (Math.abs(lambda_Angstrom - refLambda_Angstrom) / refLambda_Angstrom) * 100
        : 0;

    return {
      thetaV1_deg: Number(thetaV1.toFixed(4)),
      thetaV2_deg: Number(thetaV2.toFixed(4)),
      meanTheta_deg: Number(meanTheta_deg.toFixed(4)),
      lambda_m,
      lambda_nm: Number(lambda_nm.toFixed(2)),
      lambda_Angstrom: Math.round(lambda_Angstrom),
      percentageError: Number(percentageError.toFixed(2)),
    };
  }

  /**
   * Computes the visible spectral lines within the current telescope field of view.
   * Field of view is typically ~4 degrees wide.
   */
  public getTelescopeFieldOfView(
    telescopeAngle_deg: number,
    directAngle_deg: number = 180.0,
    rulingsPerInch: number = this.DEFAULT_RULINGS_PER_INCH,
    fovSpan_deg: number = 4.0
  ): Array<{
    colorKey: 'central' | 'blue' | 'green' | 'yellow' | 'red';
    name: string;
    side: 'central' | 'left' | 'right';
    targetAngle_deg: number;
    offsetFromCrosshair_deg: number; // positive = to the right of crosshair
    colorHex: string;
    glowColor: string;
    intensity: number;
  }> {
    const normTelescope = this.normalizeAngle(telescopeAngle_deg);
    const normDirect = this.normalizeAngle(directAngle_deg);

    const lines: Array<{
      colorKey: 'central' | 'blue' | 'green' | 'yellow' | 'red';
      name: string;
      side: 'central' | 'left' | 'right';
      targetAngle_deg: number;
      offsetFromCrosshair_deg: number;
      colorHex: string;
      glowColor: string;
      intensity: number;
    }> = [];

    // 1. Central Zeroth-Order Image (Direct Slit)
    const centralDist = this.circularDistance(normTelescope, normDirect);
    // Determine sign: direct relative to telescope
    const rawDiffCentral = (normDirect - normTelescope + 540) % 360 - 180;
    if (centralDist <= fovSpan_deg / 2) {
      lines.push({
        colorKey: 'central',
        name: 'Zeroth Order Direct Image',
        side: 'central',
        targetAngle_deg: normDirect,
        offsetFromCrosshair_deg: rawDiffCentral,
        colorHex: '#fef08a',
        glowColor: 'rgba(254, 240, 138, 0.95)',
        intensity: 1.0,
      });
    }

    // 2. First-Order Dispersed Lines (Left and Right)
    for (const key of MERCURY_LINE_KEYS) {
      const line = MERCURY_SPECTRUM[key];
      const { theta_deg, isPhysical } = this.calculateDiffractionAngle(
        line.lambda_ref_nm,
        rulingsPerInch,
        1
      );
      if (!isPhysical) continue;

      // Left side: direct - theta
      const leftTarget = this.normalizeAngle(normDirect - theta_deg);
      const leftOffset = (leftTarget - normTelescope + 540) % 360 - 180;
      if (Math.abs(leftOffset) <= fovSpan_deg / 2) {
        lines.push({
          colorKey: key,
          name: `${line.name} (1st Order Left)`,
          side: 'left',
          targetAngle_deg: leftTarget,
          offsetFromCrosshair_deg: leftOffset,
          colorHex: line.colorHex,
          glowColor: line.glowColor,
          intensity: 0.85,
        });
      }

      // Right side: direct + theta
      const rightTarget = this.normalizeAngle(normDirect + theta_deg);
      const rightOffset = (rightTarget - normTelescope + 540) % 360 - 180;
      if (Math.abs(rightOffset) <= fovSpan_deg / 2) {
        lines.push({
          colorKey: key,
          name: `${line.name} (1st Order Right)`,
          side: 'right',
          targetAngle_deg: rightTarget,
          offsetFromCrosshair_deg: rightOffset,
          colorHex: line.colorHex,
          glowColor: line.glowColor,
          intensity: 0.85,
        });
      }
    }

    return lines;
  }
}

export const mercuryGratingEngine = new MercuryGratingEngine();
