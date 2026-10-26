import {
  ExperimentProcedure,
  ApparatusConfiguration,
  GuidedStep,
} from '../types/instructional';
import {
  SolarCellSingleDiagram,
  SolarCellArrayDiagram,
  SpectrometerNormalIncidenceDiagram,
  LedPlanckCircuitDiagram,
  QuantumTunnelingBarrierDiagram,
  PhotodiodeCircuitDiagram,
} from '../components/instructional/diagrams/ApparatusDiagrams';

// ============================================================================
// EXPERIMENT 1: SOLAR CELL RENEWABLE ENERGY DEVICE (pp. 22–32)
// ============================================================================
export const solarCellConfigurations: ApparatusConfiguration[] = [
  {
    id: 'single_cell',
    name: 'Single Cell Characterization',
    subtitle: 'Table 1 & Table 2: Voc, Isc and R sweep',
    sourceManualFigure: 'Figure 1, p. 24',
    sourceManualPage: 24,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'component-lamp', name: '5W Light Source', type: 'source', description: 'Illuminates solar cell at distance d' },
      { id: 'component-solar-cell', name: 'Silicon Solar Cell', type: 'source', description: 'Photovoltaic p-n junction generator' },
      { id: 'component-ammeter', name: 'Milliammeter', type: 'meter', description: 'Measures load current in series' },
      { id: 'component-voltmeter', name: 'Voltmeter', type: 'meter', description: 'Measures cell terminal voltage in parallel' },
      { id: 'component-load', name: 'Decade Resistance Box', type: 'passive', description: 'Load resistance RL (0.1 to 10 kΩ)' },
    ],
    wiringNotes: [
      'Solar Cell (+) to Milliammeter (+)',
      'Milliammeter (-) to Load Resistor (Pin 1)',
      'Load Resistor (Pin 2) to Solar Cell (-)',
      'Voltmeter connected in parallel across the Load Resistor',
    ],
    renderSvg: (highId) => <SolarCellSingleDiagram highlightedId={highId} />,
  },
  {
    id: 'series_array',
    name: '3 Cells in Series Array',
    subtitle: 'Table 3: Voltage Addition (V_total = V1 + V2 + V3)',
    sourceManualFigure: 'Figure 3, p. 26',
    sourceManualPage: 26,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'cell-1', name: 'Solar Cell 1', type: 'source', description: 'First cell in series string' },
      { id: 'cell-2', name: 'Solar Cell 2', type: 'source', description: 'Second cell in series string' },
      { id: 'cell-3', name: 'Solar Cell 3', type: 'source', description: 'Third cell in series string' },
    ],
    wiringNotes: [
      'Connect Cathode (-) of Cell 1 to Anode (+) of Cell 2',
      'Connect Cathode (-) of Cell 2 to Anode (+) of Cell 3',
      'Load connected across Anode of Cell 1 and Cathode of Cell 3',
    ],
    renderSvg: (highId) => <SolarCellArrayDiagram highlightedId={highId} mode="series" />,
  },
  {
    id: 'parallel_array',
    name: '3 Cells in Parallel Array',
    subtitle: 'Table 4: Current Addition (I_total = I1 + I2 + I3)',
    sourceManualFigure: 'Figure 4, p. 27',
    sourceManualPage: 27,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'cell-1', name: 'Solar Cell 1', type: 'source', description: 'First parallel branch' },
      { id: 'cell-2', name: 'Solar Cell 2', type: 'source', description: 'Second parallel branch' },
      { id: 'cell-3', name: 'Solar Cell 3', type: 'source', description: 'Third parallel branch' },
    ],
    wiringNotes: [
      'Tie all 3 Anodes (+) together to positive load bus',
      'Tie all 3 Cathodes (-) together to negative load bus',
      'Total current multiplies while voltage equals single cell',
    ],
    renderSvg: (highId) => <SolarCellArrayDiagram highlightedId={highId} mode="parallel" />,
  },
];

export const solarCellSteps: GuidedStep[] = [
  {
    id: 'e1-step-1',
    number: 1,
    title: 'Lamp Alignment & Open-Circuit Voltage (Voc)',
    shortTask: 'Position lamp at 25 cm and measure Voc',
    what: 'Turn on the 5W lamp, position it at Distance 1 (25 cm), and observe the open-circuit terminal voltage without load connected.',
    where: 'Click Lamp Toggle to ON; slide Optical Rail Distance slider to 0.25 m (25 cm); set Load to Open Circuit.',
    why: 'Photons generate electron-hole pairs in the depletion region. At open circuit, the built-in field separates charges until forward diffusion balances drift, establishing the maximum open-circuit voltage Voc.',
    observe: 'Voltmeter displays ~2.45 V. Milliammeter displays 0.00 mA (zero current because external loop is open).',
    mistakes: 'Leaving load resistor connected or shorting terminals will produce current and underestimate Voc.',
    hint: 'Set distance to 25 cm and ensure no load resistance is connected to isolate Voc.',
    targetElementId: 'distance-slider',
    apparatusHighlightId: 'component-solar-cell',
    configurationId: 'single_cell',
    validate: (state) => {
      const isLampOn = state?.lampOn !== false;
      const isDistCorrect = Math.abs((state?.distance ?? 0) - 0.25) < 0.03;
      if (!isLampOn) return { isComplete: false, feedback: 'Turn on the 5W lamp first.' };
      if (!isDistCorrect) return { isComplete: false, feedback: 'Adjust lamp distance to 25 cm (0.25 m).' };
      return { isComplete: true, feedback: 'Voc measured accurately at 25 cm.' };
    },
  },
  {
    id: 'e1-step-2',
    number: 2,
    title: 'Short-Circuit Current (Isc)',
    shortTask: 'Measure maximum current with zero load resistance',
    what: 'Temporarily short the cell terminals through the series milliammeter to measure the short-circuit current Isc.',
    where: 'Set load resistance setting to minimum (0.1 kΩ / short) and observe current.',
    why: 'Under short circuit, voltage across cell terminals drops to zero, allowing the maximum photogenerated drift current Isc to flow externally.',
    observe: 'Milliammeter reads maximum short-circuit current (~12–15 mA). Voltmeter reads nearly 0.00 V.',
    mistakes: 'Measuring Isc with a high resistance box setting will suppress current and yield an incorrect value.',
    hint: 'Lower the resistance to minimum or record Isc at the lowest load resistance.',
    targetElementId: 'resistance-selector',
    apparatusHighlightId: 'component-ammeter',
    configurationId: 'single_cell',
    validate: (state) => {
      const isLowR = (state?.loadResistance ?? 1000) <= 220;
      if (!isLowR) return { isComplete: false, feedback: 'Set load resistance to 0.1 kΩ (100 Ω) to observe Isc.' };
      return { isComplete: true, feedback: 'Isc recorded near short-circuit condition.' };
    },
  },
  {
    id: 'e1-step-3',
    number: 3,
    title: 'Load Resistance Sweep (Table 1: 0.1 to 10 kΩ)',
    shortTask: 'Step through all 13 resistance values and record I and V',
    what: 'Vary decade resistance box across [0.1, 0.22, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] kΩ and click Log Reading for each.',
    where: 'Use the Decade Resistance Box selector and click "Record Row" / "Log Reading".',
    why: 'Mapping the I-V curve allows plotting power P = V × I to identify the maximum power point (MPP) where the cell operates most efficiently.',
    observe: 'As load resistance increases, current decreases from mA down to zero while voltage rises toward Voc.',
    mistakes: 'Skipping intermediate resistances will prevent accurate detection of the maximum power point knee.',
    hint: 'Log at least 5 distinct resistance values in Table 1 to build the I-V curve.',
    targetElementId: 'log-reading-button',
    apparatusHighlightId: 'component-load',
    configurationId: 'single_cell',
    validate: (state) => {
      const rowCount = state?.observations?.length ?? 0;
      if (rowCount < 4) return { isComplete: false, feedback: `Logged ${rowCount}/4 required data points. Step through more resistances.` };
      return { isComplete: true, feedback: 'I-V characteristic curve successfully logged.' };
    },
  },
  {
    id: 'e1-step-4',
    number: 4,
    title: 'Calculate Pmax, Fill Factor & Efficiency',
    shortTask: 'Identify knee on P-V curve and evaluate Fill Factor',
    what: 'Locate Pmax = Vmax × Imax on the graph. Compute Fill Factor FF = Pmax / (Voc × Isc) and efficiency η = 100·Pmax / (A·I0).',
    where: 'Inspect the Graph tab; toggle P-V curve overlay; examine Master Results Table.',
    why: 'Fill factor (typically 0.5–0.75 for silicon) quantifies squareness of the I-V curve and internal shunt/series resistance losses.',
    observe: 'The P-V curve peaks at an intermediate resistance (around 1 kΩ). FF is dimensionless and strictly < 1.',
    mistakes: 'Using mA instead of A without converting will yield power in mW instead of W, inflating calculated efficiency.',
    hint: 'Check the Results Summary tab to verify calculated Fill Factor is between 0.45 and 0.75.',
    targetElementId: 'results-tab',
    apparatusHighlightId: 'component-solar-cell',
    configurationId: 'single_cell',
    validate: (state) => {
      if (!state?.hasCalculatedResults && (state?.observations?.length ?? 0) < 4) {
        return { isComplete: false, feedback: 'Log enough points to extract Pmax and Fill Factor.' };
      }
      return { isComplete: true, feedback: 'Photovoltaic performance parameters verified.' };
    },
  },
];

// ============================================================================
// EXPERIMENT 2: MERCURY GRATING NORMAL INCIDENCE (pp. 33–37)
// ============================================================================
export const mercuryConfigurations: ApparatusConfiguration[] = [
  {
    id: 'normal_incidence',
    name: 'Normal Incidence Spectrometer Setup',
    subtitle: 'Table 1: 1st Order Mercury Spectrum (Blue, Green, Yellow, Red)',
    sourceManualFigure: 'Figure 1 & 2, pp. 33–35',
    sourceManualPage: 34,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'collimator', name: 'Collimator', type: 'optical', description: 'Produces parallel beam from Hg lamp slit' },
      { id: 'grating', name: 'Transmission Grating', type: 'optical', description: '15,000 lines per inch ruled surface' },
      { id: 'telescope', name: 'Telescope', type: 'optical', description: 'Rotatable arm with ocular crosshair reticle' },
      { id: 'vernier-v1', name: 'Vernier 1 (V1)', type: 'meter', description: 'Primary circular scale (30 VSD = 29 MSD)' },
      { id: 'vernier-v2', name: 'Vernier 2 (V2)', type: 'meter', description: 'Secondary circular scale (180° offset)' },
    ],
    wiringNotes: [
      'Align telescope with direct collimator ray (180°)',
      'Rotate telescope 90° and reflect ray off grating face by turning prism table 45°',
      'Rotate table further by 45° to position grating surface exactly normal to incident beam',
    ],
    renderSvg: (highId) => <SpectrometerNormalIncidenceDiagram highlightedId={highId} />,
  },
];

export const mercurySteps: GuidedStep[] = [
  {
    id: 'e2-step-1',
    number: 1,
    title: 'Initial Adjustments & Slit Alignment',
    shortTask: 'Turn on Hg lamp and focus crosshair on vertical slit',
    what: 'Turn on the Mercury vapour lamp, align the telescope with the collimator at 180°, and adjust slit width for a sharp vertical line.',
    where: 'Click Lamp Toggle to ON; rotate Telescope Angle to 180.00°; inspect the Eyepiece Reticle.',
    why: 'Parallel light from the collimator must be sharply focused on the crosshairs before inserting the diffraction grating to prevent systematic zero errors.',
    observe: 'A sharp, bright white vertical slit image is centered on the reticle crosshairs.',
    mistakes: 'Wide slit introduces parallax and chromatic blurring, preventing precise vernier readings.',
    hint: 'Set telescope angle to 180° and narrow the slit to around 0.8 mm.',
    targetElementId: 'telescope-angle-slider',
    apparatusHighlightId: 'collimator',
    configurationId: 'normal_incidence',
    validate: (state) => {
      const isAngleDirect = Math.abs((state?.telescopeAngle ?? 0) - 180) < 1.0;
      if (!isAngleDirect) return { isComplete: false, feedback: 'Center telescope at direct ray position (180°).' };
      return { isComplete: true, feedback: 'Collimator direct slit image centered.' };
    },
  },
  {
    id: 'e2-step-2',
    number: 2,
    title: 'Normal Incidence Calibration',
    shortTask: 'Perform 4-step Schuster alignment wizard',
    what: 'Execute the normal incidence procedure: Swing telescope 90°, rotate table 45° to catch reflection, then rotate 45° to set grating normal.',
    where: 'Click "Auto-Align Normal Incidence" or complete the 4-step alignment wizard.',
    why: 'The grating equation (e+d)·sin θ = n·λ strictly assumes normal incidence (angle of incidence i = 0). Non-normal incidence introduces asymmetric left-right errors.',
    observe: 'The grating normal lock indicator turns green; grating surface is perpendicular to collimator axis.',
    mistakes: 'Attempting to read spectral lines before completing normal incidence invalidates wavelength calculations.',
    hint: 'Click "Auto-Align Normal Incidence" if manual 90°/45° rotation is complete.',
    targetElementId: 'auto-align-button',
    apparatusHighlightId: 'grating',
    configurationId: 'normal_incidence',
    validate: (state) => {
      if (!state?.isNormalIncidenceAligned) {
        return { isComplete: false, feedback: 'Grating must be aligned for normal incidence.' };
      }
      return { isComplete: true, feedback: 'Normal incidence condition established.' };
    },
  },
  {
    id: 'e2-step-3',
    number: 3,
    title: 'Record Left (a) Spectral Lines',
    shortTask: 'Rotate telescope left to Blue, Green, Yellow, Red',
    what: 'Rotate telescope counter-clockwise to observe 1st order spectral lines: Blue (4693 Å), Green (5461 Å), Yellow (5770 Å), Red (6238 Å). Record V1 and V2.',
    where: 'Adjust telescope to left diffraction angles (~163° to ~158°) and click "Record Line".',
    why: 'Diffraction angle increases with wavelength (Red deviates more than Blue), proving angular dispersion.',
    observe: 'Distinct colored lines appear in eyepiece reticle. Verniers V1 and V2 record MSR + VSC.',
    mistakes: 'Mixing up Left and Right observations will invert difference (a - b).',
    hint: 'Rotate telescope counter-clockwise below 180° until colored lines align with crosshairs.',
    targetElementId: 'record-line-button',
    apparatusHighlightId: 'telescope',
    configurationId: 'normal_incidence',
    validate: (state) => {
      const rowCount = state?.observations?.filter((o: any) => o.side === 'left')?.length ?? 0;
      if (rowCount < 2) return { isComplete: false, feedback: `Record at least 2 lines on the Left side (${rowCount}/2 recorded).` };
      return { isComplete: true, feedback: 'Left spectral lines recorded.' };
    },
  },
  {
    id: 'e2-step-4',
    number: 4,
    title: 'Record Right (b) Lines & Compute Wavelengths',
    shortTask: 'Rotate telescope right and verify 2θ = |a - b|',
    what: 'Rotate telescope clockwise past 180° to capture corresponding Right order lines. Verify 2θ = |a - b| and λ = (e+d)·sin θ / n.',
    where: 'Rotate telescope to right diffraction angles (~196° to ~202°) and record corresponding lines.',
    why: 'Averaging across Left and Right verniers eliminates spectrometer eccentricity errors.',
    observe: 'Calculated wavelengths match known mercury values within 0.1% error.',
    mistakes: 'Forgetting 360° circular modular arithmetic when telescope crosses 0°/360°.',
    hint: 'Record corresponding lines on the Right side to calculate mean diffraction angle θ.',
    targetElementId: 'record-line-button',
    apparatusHighlightId: 'vernier-v1',
    configurationId: 'normal_incidence',
    validate: (state) => {
      const rightCount = state?.observations?.filter((o: any) => o.side === 'right')?.length ?? 0;
      if (rightCount < 2) return { isComplete: false, feedback: `Record at least 2 lines on the Right side (${rightCount}/2 recorded).` };
      return { isComplete: true, feedback: 'Mercury spectral wavelengths calculated and verified.' };
    },
  },
];

// ============================================================================
// EXPERIMENT 3: PLANCK'S CONSTANT VIA LEDS (pp. 38–44)
// ============================================================================
export const ledPlanckConfigurations: ApparatusConfiguration[] = [
  {
    id: 'led_circuit',
    name: 'LED Forward Bias Circuit',
    subtitle: 'Figure 2 (p. 40): 3V Supply, Potentiometer, Limiter, LED & Dual Meters',
    sourceManualFigure: 'Figure 2, p. 40',
    sourceManualPage: 40,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'component-supply', name: '3V DC Supply', type: 'source', description: 'Regulated DC source' },
      { id: 'component-pot', name: 'Potentiometer', type: 'passive', description: 'Voltage divider for fine stepping' },
      { id: 'component-resistor', name: 'Limiting Resistor', type: 'passive', description: 'Protective resistor (47 Ω default)' },
      { id: 'component-led', name: 'Semiconductor LED', type: 'source', description: 'Red, Green, Yellow, or Blue diode' },
      { id: 'component-ammeter', name: 'Microammeter', type: 'meter', description: 'Measures diode forward current in series' },
      { id: 'component-voltmeter', name: 'Voltmeter', type: 'meter', description: 'Measures voltage drop across LED in parallel' },
    ],
    wiringNotes: [
      'Potentiometer wired across 3V supply',
      'Wiper connects to 47 Ω limiting resistor',
      'Limiting resistor connects to series Microammeter (+)',
      'Microammeter (-) connects to LED Anode (+)',
      'LED Cathode (-) connects to circuit Ground (-)',
      'Voltmeter connected directly across LED terminals',
    ],
    renderSvg: (highId) => <LedPlanckCircuitDiagram highlightedId={highId} />,
  },
];

export const ledPlanckSteps: GuidedStep[] = [
  {
    id: 'e3-step-1',
    number: 1,
    title: 'Circuit Assembly & Limiting Resistor Verification',
    shortTask: 'Confirm forward bias wiring and 47 Ω limiter',
    what: 'Verify complete forward-bias loop with series ammeter, parallel voltmeter, and current-limiting resistor.',
    where: 'Inspect breadboard wiring; confirm 47 Ω resistor is in place; power on supply.',
    why: 'Operating without a current-limiting resistor or exceeding 2900 µA can cause thermal runaway and destroy the LED.',
    observe: 'DC supply reads 3.0 V; wiring status shows "VALID_FORWARD_BIAS".',
    mistakes: 'Connecting ammeter in parallel creates a short; reversing LED polarity prevents forward conduction.',
    hint: 'Ensure limiting resistor is selected and wiring polarity is correct.',
    targetElementId: 'power-switch',
    apparatusHighlightId: 'component-resistor',
    configurationId: 'led_circuit',
    validate: (state) => {
      if (state?.isReverseBiased) return { isComplete: false, feedback: 'LED is reverse biased. Switch to forward bias.' };
      if (!state?.powerOn) return { isComplete: false, feedback: 'Turn on the 3V DC supply.' };
      return { isComplete: true, feedback: 'Forward bias circuit properly configured.' };
    },
  },
  {
    id: 'e3-step-2',
    number: 2,
    title: 'Potentiometer Sweep & Linear Knee Region',
    shortTask: 'Gradually increase voltage and observe threshold knee',
    what: 'Slowly rotate potentiometer from 0% upward. Note sub-threshold exponential region transitioning into linear conduction.',
    where: 'Use the Potentiometer Dial or fine nudge buttons; observe the LED dome beginning to glow.',
    why: 'Until applied voltage exceeds the junction barrier potential VB, electrons cannot overcome the bandgap energy Eg.',
    observe: 'Current remains near 0 µA until voltage reaches ~1.8V for Red, then rises steeply in a straight line.',
    mistakes: 'Advancing potentiometer too fast jumps past the knee region.',
    hint: 'Rotate potentiometer smoothly between 50% and 85% to trace the knee.',
    targetElementId: 'potentiometer-dial',
    apparatusHighlightId: 'component-pot',
    configurationId: 'led_circuit',
    validate: (state) => {
      const pot = state?.potentiometerRatio ?? 0;
      if (pot < 0.4) return { isComplete: false, feedback: 'Advance potentiometer above 40% to reach conduction threshold.' };
      return { isComplete: true, feedback: 'Conduction knee reached.' };
    },
  },
  {
    id: 'e3-step-3',
    number: 3,
    title: 'Linear Tangent Fit & Barrier Potential (VB)',
    shortTask: 'Extrapolate linear I-V region to X-axis intercept',
    what: 'Fit a straight line through the linear portion of the I-V curve to extract the voltage intercept VB.',
    where: 'Click "Fit Linear Tangent" on the I-V graph.',
    why: 'Extrapolating the linear slope to I = 0 yields the true barrier potential VB without series resistance distortion.',
    observe: 'Fitted tangent intersects X-axis at VB (e.g. 1.88 V for Red 660 nm, 2.64 V for Blue 470 nm). R² > 0.98.',
    mistakes: 'Including sub-threshold curved points in the linear fit distorts the intercept.',
    hint: 'Select data points on the steep linear region above 500 µA for the fit.',
    targetElementId: 'fit-tangent-button',
    apparatusHighlightId: 'component-led',
    configurationId: 'led_circuit',
    validate: (state) => {
      if (!state?.hasFittedTangent && !state?.barrierPotential) {
        return { isComplete: false, feedback: 'Perform linear tangent extrapolation on the I-V curve.' };
      }
      return { isComplete: true, feedback: 'Barrier potential VB extracted.' };
    },
  },
  {
    id: 'e3-step-4',
    number: 4,
    title: 'Multi-Color Planck Constant Determination',
    shortTask: 'Repeat for all 4 LEDs and compute mean h',
    what: 'Calculate h = e·VB·λ / c for each LED and verify mean h across Red, Green, Yellow, Blue.',
    where: 'Switch LED colors; populate Table 2; inspect the Graphical Analysis (VB vs 1/λ).',
    why: 'Planck relation Eg = h·c/λ predicts a linear relationship between VB and 1/λ with slope h·c/e.',
    observe: 'Calculated h is close to accepted physical constant 6.626 × 10⁻³⁴ J·s.',
    mistakes: 'Using wavelength in nm without multiplying by 10⁻⁹ m produces an exponent error of 10⁹.',
    hint: 'Complete observations across multiple LEDs to compute average h.',
    targetElementId: 'table2-tab',
    apparatusHighlightId: 'component-led',
    configurationId: 'led_circuit',
    validate: (state) => {
      const activeCount = state?.completedLedsCount ?? 1;
      if (activeCount < 1) return { isComplete: false, feedback: 'Log data for at least 1 LED.' };
      return { isComplete: true, feedback: 'Planck constant successfully derived.' };
    },
  },
];

// Master lookup for all 9 experiments
export const PROCEDURES_BY_EXPERIMENT: Record<string, ExperimentProcedure> = {
  'expt-1-solar-cell': {
    experimentId: 'expt-1-solar-cell',
    experimentNumber: 1,
    experimentTitle: 'Solar Cell Renewable Energy Device Circuit',
    sourcePages: 'pp. 22–32',
    rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
    configurations: solarCellConfigurations,
    steps: solarCellSteps,
  },
  'expt-2-mercury-grating': {
    experimentId: 'expt-2-mercury-grating',
    experimentNumber: 2,
    experimentTitle: 'Mercury Lamp Spectral Wavelengths (Normal Incidence)',
    sourcePages: 'pp. 33–37',
    rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
    configurations: mercuryConfigurations,
    steps: mercurySteps,
  },
  'expt-3-led-planck': {
    experimentId: 'expt-3-led-planck',
    experimentNumber: 3,
    experimentTitle: "Planck's Constant via Semiconductor LEDs",
    sourcePages: 'pp. 38–44',
    rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
    configurations: ledPlanckConfigurations,
    steps: ledPlanckSteps,
  },
  'expt-4-quantum-tunneling': {
    experimentId: 'expt-4-quantum-tunneling',
    experimentNumber: 4,
    experimentTitle: 'Quantum Tunneling Through a Finite Potential Barrier',
    sourcePages: 'pp. 45–52',
    rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
    configurations: [
      {
        id: 'barrier_geometry',
        name: 'Finite Rectangular Barrier Geometry',
        subtitle: 'Region I (x < 0), Region II (0 ≤ x ≤ a), Region III (x > a)',
        sourceManualFigure: 'Image 176, p. 46',
        sourceManualPage: 46,
        svgViewBox: '0 0 500 320',
        components: [
          { id: 'region-1', name: 'Region I', type: 'quantum', description: 'Incident and reflected plane waves' },
          { id: 'region-2', name: 'Region II', type: 'quantum', description: 'Barrier potential V0 with exponential decay' },
          { id: 'region-3', name: 'Region III', type: 'quantum', description: 'Transmitted plane wave with amplitude t' },
        ],
        wiringNotes: ['Boundary matching at x = 0: ψI(0) = ψII(0) and dψI/dx(0) = dψII/dx(0)', 'Boundary matching at x = a: ψII(a) = ψIII(a) and dψII/dx(a) = dψIII/dx(a)'],
        renderSvg: (highId) => <QuantumTunnelingBarrierDiagram highlightedId={highId} />,
      },
    ],
    steps: [
      {
        id: 'e4-step-1',
        number: 1,
        title: 'Barrier Setup & Sub-Barrier Energy Regime (E < V0)',
        shortTask: 'Set E = 2.0 eV, V0 = 6.0 eV, a = 1.5 Å',
        what: 'Configure a sub-barrier tunneling scenario with particle energy E below barrier height V0.',
        where: 'Adjust Energy E, Barrier V0, and Width a sliders.',
        why: 'Classical physics forbids entry into Region II (negative kinetic energy). Quantum mechanics permits finite penetration depth and non-zero transmission.',
        observe: 'Wavefunction exponentially attenuates in Region II with attenuation coefficient κ; non-zero transmitted wave emerges in Region III.',
        mistakes: 'Confusing complex amplitude t with scalar transmission probability T = |t|².',
        hint: 'Ensure E < V0 to study the exponential decay regime.',
        targetElementId: 'energy-slider',
        validate: (state) => {
          if ((state?.particleEnergy_eV ?? 2) >= (state?.barrierHeight_eV ?? 6)) {
            return { isComplete: false, feedback: 'Set particle energy E below barrier height V0.' };
          }
          return { isComplete: true, feedback: 'Sub-barrier tunneling parameters established.' };
        },
      },
      {
        id: 'e4-step-2',
        number: 2,
        title: 'Transmission Dependence on Particle Energy (Table 1.1)',
        shortTask: 'Sweep energy E from 0.5 to 6.0 eV at fixed a = 1.5 Å',
        what: 'Log transmission coefficient T as energy increases toward barrier threshold V0.',
        where: 'Step Energy E slider and record data into Table 1.1.',
        why: 'Transmission probability increases steeply as E approaches V0 because effective barrier height (V0 - E) diminishes.',
        observe: 'T increases from ~0.001 at 1 eV to over 0.70 near threshold.',
        mistakes: 'Assuming transmission reaches 1.0 at E = V0 (classical transmission only reaches unity well above V0 due to quantum reflection).',
        hint: 'Log data across multiple energy steps.',
        targetElementId: 'table-selector',
        validate: () => {
          return { isComplete: true, feedback: 'Energy dependence examined.' };
        },
      },
    ],
  },
  'expt-6-photodiode': {
    experimentId: 'expt-6-photodiode',
    experimentNumber: 6,
    experimentTitle: 'Photodiode I–V Characteristics',
    sourcePages: 'pp. 56–59',
    rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
    configurations: [
      {
        id: 'photodiode_circuit',
        name: 'Photodiode Reverse Bias Circuit',
        subtitle: 'Figure 1 (p. 57): Regulated Supply, Limiter, Microammeter, Photodiode & Lamp',
        sourceManualFigure: 'Figure 1, p. 57',
        sourceManualPage: 57,
        svgViewBox: '0 0 500 320',
        components: [
          { id: 'component-supply', name: '0–30V DC Supply', type: 'source', description: 'Variable reverse bias supply' },
          { id: 'component-resistor', name: '1 kΩ Resistor', type: 'passive', description: 'Protective current limiter' },
          { id: 'component-ammeter', name: 'Microammeter (0–100 µA)', type: 'meter', description: 'Measures reverse leakage & photocurrent' },
          { id: 'photodiode', name: 'Photodiode', type: 'detector', description: 'Reverse-biased p-n photosensor' },
          { id: 'lamp', name: 'LED Illumination Lamp', type: 'source', description: 'Optical source on movable rail' },
        ],
        wiringNotes: ['DC Supply (+) connects through 1 kΩ resistor and ammeter to Photodiode Cathode (-)', 'Photodiode Anode (+) connects to DC Supply (-)'],
        renderSvg: (highId) => <PhotodiodeCircuitDiagram highlightedId={highId} />,
      },
    ],
    steps: [
      {
        id: 'e6-step-1',
        number: 1,
        title: 'Dark Current Measurement (Table 1: 0–5V Reverse Bias)',
        shortTask: 'Shield photodiode from light and sweep reverse voltage',
        what: 'Place opaque shield over the photodiode (or turn off lamp) and measure dark current ID from 0 to 5 V in 0.5 V steps.',
        where: 'Click "Toggle Shield" to ON; adjust Reverse Voltage slider from 0 to 5 V.',
        why: 'In the dark, only thermally generated minority carriers contribute to saturation current I0 plus tiny surface shunt leakage.',
        observe: 'Current is small (< 1 µA) and saturates quickly with reverse voltage.',
        mistakes: 'Forward biasing the photodiode causes massive current flow that does not reflect photoconductive operation.',
        hint: 'Ensure shield is ON or lamp is OFF for dark current characterization.',
        targetElementId: 'shield-toggle',
        validate: (state) => {
          if (!state?.isShielded && state?.lampIsOn) {
            return { isComplete: false, feedback: 'Shield photodiode or turn off lamp to measure dark current.' };
          }
          return { isComplete: true, feedback: 'Dark current measurements recorded.' };
        },
      },
      {
        id: 'e6-step-2',
        number: 2,
        title: 'Illuminated Current & Responsivity (Table 2: Distance Dependence)',
        shortTask: 'Illuminate photodiode and calculate Iph and R',
        what: 'Remove shield, turn lamp ON at 10 cm, measure illuminated current, and compute photocurrent Iph = Iillum - ID and Responsivity R = Iph / Popt.',
        where: 'Click "Toggle Shield" to OFF; set Lamp Distance to 10 cm; record readings.',
        why: 'Incident photons create additional electron-hole pairs, producing a photocurrent proportional to optical flux.',
        observe: 'Current rises sharply to tens of microamperes. Responsivity R is typically 0.4–0.5 A/W for silicon.',
        mistakes: 'Failing to subtract dark current ID underestimates true photocurrent.',
        hint: 'Turn lamp ON at 10 cm without shield.',
        targetElementId: 'lamp-toggle',
        validate: (state) => {
          if (state?.isShielded || !state?.lampIsOn) {
            return { isComplete: false, feedback: 'Turn lamp ON and remove shield.' };
          }
          return { isComplete: true, feedback: 'Illuminated photoresponse verified.' };
        },
      },
    ],
  },
};
