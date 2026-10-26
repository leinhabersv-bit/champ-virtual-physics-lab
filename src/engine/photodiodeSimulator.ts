/**
 * Photodiode I-V Characteristics Engine (Experiment 6 - BAPHY105 Manual pp. 56–59)
 *
 * Implements:
 * 1. Reverse-bias junction physics with thermal dark current and surface shunt leakage.
 * 2. Optical illumination modeling with inverse-square distance irradiance.
 * 3. Total current: I_total = I_D + I_ph.
 * 4. Photocurrent: I_ph = I_illum - I_D (A).
 * 5. Responsivity: R = I_ph / P_opt (A/W).
 * 6. Percentage change: %Δ = ((I_illum - I_D) / I_D) * 100 with zero-dark-current protection.
 * 7. Observation tables 1, 2, and 3 matching manual specifications.
 */

export interface PhotodiodeParameters {
  darkSaturationCurrent_I0_uA: number; // typically 0.05 - 0.2 µA
  thermalVoltage_VT_V: number; // 0.0259 V at 300 K
  shuntResistance_Rsh_MOhm: number; // 25 MΩ leakage path
  idealityFactor_eta: number; // 1.3
  responsivity_R_AW: number; // 0.55 A/W at 650 nm
  lampReferencePower_mW: number; // 50 mW emitted at source
  lampReferenceDistance_cm: number; // 10 cm reference
  detectorArea_cm2: number; // 0.05 cm² active optical area
}

export const DEFAULT_PHOTODIODE_PARAMS: PhotodiodeParameters = {
  darkSaturationCurrent_I0_uA: 0.12,
  thermalVoltage_VT_V: 0.0259,
  shuntResistance_Rsh_MOhm: 25.0,
  idealityFactor_eta: 1.3,
  responsivity_R_AW: 0.45,
  lampReferencePower_mW: 40.0,
  lampReferenceDistance_cm: 10.0,
  detectorArea_cm2: 0.05,
};

export interface DarkCurrentReading {
  sNo: number;
  reverseVoltage_V: number;
  darkCurrent_uA: number;
  darkCurrent_A: number;
}

export interface FixedDistanceReading {
  sNo: number;
  reverseVoltage_V: number;
  current_D1_uA: number; // D1 = 10 cm
  current_D1_A: number;
  current_D2_uA: number; // D2 = 15 cm
  current_D2_A: number;
  photocurrent_D1_uA: number;
  photocurrent_D2_uA: number;
}

export interface FixedVoltageReading {
  sNo: number;
  distance_cm: number;
  reverseVoltage_V: number;
  current_uA: number;
  current_A: number;
  photocurrent_uA: number;
  opticalPower_uW: number;
  responsivity_AW: number | null;
  percentageChange_pct: number | null;
}

export class PhotodiodeSimulator {
  private params: PhotodiodeParameters;

  constructor(params: Partial<PhotodiodeParameters> = {}) {
    this.params = { ...DEFAULT_PHOTODIODE_PARAMS, ...params };
  }

  public getParams(): PhotodiodeParameters {
    return { ...this.params };
  }

  /**
   * Optical power incident on photodiode at distance d (cm).
   * Follows inverse square law: P_opt(d) = P_ref * (d_ref / d)^2
   * Returns optical power in Watts (W) and microwatts (µW).
   */
  public calculateOpticalPower(distance_cm: number, lampIsOn: boolean = true, isShielded: boolean = false): {
    power_W: number;
    power_uW: number;
  } {
    if (!lampIsOn || isShielded || distance_cm <= 0) {
      return { power_W: 0.0, power_uW: 0.0 };
    }

    // Reference power at reference distance (10 cm)
    // E.g. at 10 cm, ~ 45 µW incident
    const P_ref_uW = 45.0;
    const ratio = this.params.lampReferenceDistance_cm / distance_cm;
    const power_uW = P_ref_uW * (ratio * ratio);
    const power_W = power_uW * 1e-6;

    return {
      power_W: Number(power_W.toExponential(6)),
      power_uW: Number(power_uW.toFixed(3)),
    };
  }

  /**
   * Dark current under reverse bias VR (V).
   * ID(VR) = I0 * (1 - exp(-VR / (eta * VT))) + VR / Rsh
   * Returns current in µA and A.
   */
  public calculateDarkCurrent(reverseVoltage_V: number): {
    current_uA: number;
    current_A: number;
  } {
    const VR = Math.max(0, reverseVoltage_V);
    if (VR === 0) {
      return { current_uA: 0.0, current_A: 0.0 };
    }

    const VT_eff = this.params.idealityFactor_eta * this.params.thermalVoltage_VT_V;
    const expTerm = 1 - Math.exp(-VR / VT_eff);
    const junctionDark_uA = this.params.darkSaturationCurrent_I0_uA * expTerm;
    const shuntLeakage_uA = VR / this.params.shuntResistance_Rsh_MOhm; // V / MΩ = µA

    const totalDark_uA = junctionDark_uA + shuntLeakage_uA;
    const totalDark_A = totalDark_uA * 1e-6;

    return {
      current_uA: Number(totalDark_uA.toFixed(4)),
      current_A: Number(totalDark_A.toExponential(6)),
    };
  }

  /**
   * Total reverse current under illumination or dark.
   * I_rev = I_D + I_ph
   * where I_ph = R * P_opt * (1 - 0.15 * exp(-VR / 0.25)) for realistic collection efficiency.
   */
  public calculateTotalCurrent(
    reverseVoltage_V: number,
    distance_cm: number,
    lampIsOn: boolean = true,
    isShielded: boolean = false
  ): {
    totalCurrent_uA: number;
    totalCurrent_A: number;
    darkCurrent_uA: number;
    photocurrent_uA: number;
    opticalPower_uW: number;
    opticalPower_W: number;
    responsivity_AW: number | null;
    percentageChange_pct: number | null;
  } {
    const VR = Math.max(0, reverseVoltage_V);
    const dark = this.calculateDarkCurrent(VR);
    const optical = this.calculateOpticalPower(distance_cm, lampIsOn, isShielded);

    let photocurrent_uA = 0.0;
    if (optical.power_W > 0) {
      // Photocurrent collection efficiency saturation with reverse bias
      // Even at VR = 0 V (photovoltaic mode), current flows; at VR >= 0.2 V, full collection
      const collectionFactor = VR === 0 ? 0.85 : 1 - 0.15 * Math.exp(-VR / 0.25);
      const I_ph_A = this.params.responsivity_R_AW * optical.power_W * collectionFactor;
      photocurrent_uA = I_ph_A * 1e6;
    }

    const total_uA = dark.current_uA + photocurrent_uA;
    const total_A = total_uA * 1e-6;

    // Responsivity: R = I_ph / P_opt (A/W)
    let responsivity_AW: number | null = null;
    if (optical.power_W > 0 && photocurrent_uA > 0) {
      responsivity_AW = Number(((photocurrent_uA * 1e-6) / optical.power_W).toFixed(4));
    }

    // Percentage Change: %Δ = ((I_illum - I_D) / I_D) * 100
    // Zero-dark-current protection: if I_D is 0, percentage change is undefined / not applicable
    let percentageChange_pct: number | null = null;
    if (dark.current_uA > 0.0001 && optical.power_W > 0) {
      const pct = (photocurrent_uA / dark.current_uA) * 100;
      percentageChange_pct = Number(pct.toFixed(2));
    }

    return {
      totalCurrent_uA: Number(total_uA.toFixed(3)),
      totalCurrent_A: Number(total_A.toExponential(6)),
      darkCurrent_uA: dark.current_uA,
      photocurrent_uA: Number(photocurrent_uA.toFixed(3)),
      opticalPower_uW: optical.power_uW,
      opticalPower_W: optical.power_W,
      responsivity_AW,
      percentageChange_pct,
    };
  }

  /**
   * Forward bias current if user incorrectly wires photodiode with positive supply to anode.
   * I_fwd = I0 * (exp(V / (eta * VT)) - 1)
   */
  public calculateForwardBiasCurrent(forwardVoltage_V: number): {
    current_mA: number;
    isDangerous: boolean;
  } {
    const Vf = Math.max(0, forwardVoltage_V);
    const VT_eff = this.params.idealityFactor_eta * this.params.thermalVoltage_VT_V;
    const i_A = (this.params.darkSaturationCurrent_I0_uA * 1e-6) * (Math.exp(Math.min(25, Vf / VT_eff)) - 1);
    const current_mA = i_A * 1e3;
    return {
      current_mA: Number(current_mA.toFixed(3)),
      isDangerous: current_mA > 50.0,
    };
  }

  /**
   * Generates Table 1: Dark Current readings across 0 V to 5 V.
   */
  public generateTable1DarkCurrent(): DarkCurrentReading[] {
    const voltages = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
    return voltages.map((v, idx) => {
      const res = this.calculateDarkCurrent(v);
      return {
        sNo: idx + 1,
        reverseVoltage_V: v,
        darkCurrent_uA: res.current_uA,
        darkCurrent_A: res.current_A,
      };
    });
  }

  /**
   * Generates Table 2: Photocurrent readings at fixed distances D1 = 10 cm and D2 = 15 cm.
   */
  public generateTable2FixedDistance(): FixedDistanceReading[] {
    const voltages = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
    return voltages.map((v, idx) => {
      const resD1 = this.calculateTotalCurrent(v, 10.0, true, false);
      const resD2 = this.calculateTotalCurrent(v, 15.0, true, false);

      return {
        sNo: idx + 1,
        reverseVoltage_V: v,
        current_D1_uA: resD1.totalCurrent_uA,
        current_D1_A: resD1.totalCurrent_A,
        current_D2_uA: resD2.totalCurrent_uA,
        current_D2_A: resD2.totalCurrent_A,
        photocurrent_D1_uA: resD1.photocurrent_uA,
        photocurrent_D2_uA: resD2.photocurrent_uA,
      };
    });
  }

  /**
   * Generates Table 3: Photocurrent readings at fixed reverse voltages (1V, 2V, 3V)
   * across distances (5 cm, 10 cm, 15 cm, 20 cm).
   */
  public generateTable3FixedVoltage(): FixedVoltageReading[] {
    const conditions = [
      { v: 1.0, dList: [5, 10, 15, 20] },
      { v: 2.0, dList: [5, 10, 15, 20] },
      { v: 3.0, dList: [5, 10, 15, 20] },
    ];

    const rows: FixedVoltageReading[] = [];
    let count = 1;

    for (const cond of conditions) {
      for (const d of cond.dList) {
        const res = this.calculateTotalCurrent(cond.v, d, true, false);
        rows.push({
          sNo: count++,
          distance_cm: d,
          reverseVoltage_V: cond.v,
          current_uA: res.totalCurrent_uA,
          current_A: res.totalCurrent_A,
          photocurrent_uA: res.photocurrent_uA,
          opticalPower_uW: res.opticalPower_uW,
          responsivity_AW: res.responsivity_AW,
          percentageChange_pct: res.percentageChange_pct,
        });
      }
    }

    return rows;
  }
}

export const photodiodeSimulator = new PhotodiodeSimulator();

export interface PhotodiodeEngineParams {
  reverseVoltage_V: number;
  isShielded: boolean;
  sourceDistance_cm: number;
}

export interface PhotodiodeEngineReadings {
  voltage: number;
  reverseVoltage_V: number;
  darkCurrent_uA: number;
  photocurrent_uA: number;
  totalCurrent_uA: number;
  opticalPower_uW: number;
}

export interface PhotodiodeEngineDerived {
  responsivity_A_per_W: number;
  percentageChange: number;
  opticalPower_uW: number;
}

export const photodiodeEngine = {
  calculateReadings(params: PhotodiodeEngineParams): PhotodiodeEngineReadings {
    const res = photodiodeSimulator.calculateTotalCurrent(
      params.reverseVoltage_V,
      params.sourceDistance_cm,
      true,
      params.isShielded
    );
    return {
      voltage: params.reverseVoltage_V,
      reverseVoltage_V: params.reverseVoltage_V,
      darkCurrent_uA: res.darkCurrent_uA,
      photocurrent_uA: res.photocurrent_uA,
      totalCurrent_uA: res.totalCurrent_uA,
      opticalPower_uW: res.opticalPower_uW,
    };
  },
  computeDerived(_readings: PhotodiodeEngineReadings, params: PhotodiodeEngineParams): PhotodiodeEngineDerived {
    const res = photodiodeSimulator.calculateTotalCurrent(
      params.reverseVoltage_V,
      params.sourceDistance_cm,
      true,
      params.isShielded
    );
    return {
      responsivity_A_per_W: res.responsivity_AW ?? 0.55,
      percentageChange: res.percentageChange_pct ?? 0,
      opticalPower_uW: res.opticalPower_uW,
    };
  },
  generateModelCurve(params: PhotodiodeEngineParams, steps: number = 40): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const maxV = 5.0;
    for (let i = 0; i <= steps; i++) {
      const v = (i / steps) * maxV;
      const res = photodiodeSimulator.calculateTotalCurrent(
        v,
        params.sourceDistance_cm,
        true,
        params.isShielded
      );
      points.push({ x: v, y: res.totalCurrent_uA });
    }
    return points;
  },
};
