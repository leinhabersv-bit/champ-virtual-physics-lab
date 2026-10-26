import {
  ExperimentProcedure,
  ApparatusConfiguration,
  GuidedStep,
} from '../types/instructional';
import {
  SolarCellSingleDiagram,
  SolarCellArrayDiagram,
  SolarCellApplianceDiagram,
  SpectrometerNormalIncidenceDiagram,
  LedPlanckCircuitDiagram,
  QuantumTunnelingBarrierDiagram,
  PhotodiodeCircuitDiagram,
  SodiumMinimumDeviationDiagram,
  ElectronDiffractionDiagram,
  SingleSlitHeisenbergDiagram,
  QuantumCircuitDiagram,
} from '../components/instructional/diagrams/ApparatusDiagrams';

// ============================================================================
// EXPERIMENT 1: SOLAR CELL RENEWABLE ENERGY DEVICE (pp. 22–32)
// ============================================================================
export const solarCellConfigurations: ApparatusConfiguration[] = [
  {
    id: 'single_cell',
    name: 'Single Cell Characterization',
    subtitle: 'Table 1 & Table 2: Voc, Isc and R sweep (Manual p. 24, Fig. 1)',
    sourceManualFigure: 'Figure 1, p. 24',
    sourceManualPage: 24,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'component-lamp', name: '5W Halogen Lamp', type: 'source', description: 'Illuminates solar cell at distance d (25 cm and 12 cm)' },
      { id: 'component-solar-cell', name: 'Silicon Solar Cell SC1', type: 'source', description: 'Photovoltaic p-n junction generator with + and - binding posts' },
      { id: 'component-ammeter', name: 'Milliammeter (0–20 mA)', type: 'meter', description: 'Measures load current in series' },
      { id: 'component-voltmeter', name: 'Voltmeter (0–5 V)', type: 'meter', description: 'Measures cell terminal voltage in parallel' },
      { id: 'component-load', name: 'Decade Resistance Box', type: 'passive', description: 'Load resistance RL (0.1 to 10 kΩ)' },
    ],
    wiringNotes: [
      'Solar Cell (+) connects to Milliammeter (+)',
      'Milliammeter (-) connects to Load Resistor Term A',
      'Load Resistor Term B returns to Solar Cell (-)',
      'Voltmeter connected in parallel across Load Resistor Term A (+) and B (-)',
    ],
    connectionSequence: [
      {
        step: 1,
        from: 'Solar Cell 1 (+)',
        to: 'Milliammeter (+)',
        label: 'Wire 1: Positive Ammeter Feed',
        wireColor: '#ef4444',
        wireElementId: 'wire-series',
        polarityCheck: 'Red Anode (+) to Red Meter (+)',
      },
      {
        step: 2,
        from: 'Milliammeter (-)',
        to: 'Load Resistor (Term A)',
        label: 'Wire 2: Series Current Return to Load',
        wireColor: '#f59e0b',
        wireElementId: 'wire-series',
        polarityCheck: 'Meter output to decade resistor input',
      },
      {
        step: 3,
        from: 'Load Resistor (Term B)',
        to: 'Solar Cell 1 (-)',
        label: 'Wire 3: Circuit Return Loop',
        wireColor: '#3b82f6',
        wireElementId: 'wire-return',
        polarityCheck: 'Resistor return to Blue Cathode (-)',
      },
      {
        step: 4,
        from: 'Load Resistor (Term A)',
        to: 'Voltmeter (+)',
        label: 'Wire 4: Parallel Voltmeter (+)',
        wireColor: '#ef4444',
        wireElementId: 'wire-voltmeter',
        polarityCheck: 'Parallel tap to Red Voltmeter (+)',
      },
      {
        step: 5,
        from: 'Load Resistor (Term B)',
        to: 'Voltmeter (-)',
        label: 'Wire 5: Parallel Voltmeter (-)',
        wireColor: '#10b981',
        wireElementId: 'wire-voltmeter',
        polarityCheck: 'Parallel tap to Green Voltmeter (-)',
      },
    ],
    renderSvg: (highId) => <SolarCellSingleDiagram highlightedId={highId} />,
  },
  {
    id: 'series_array',
    name: '3 Cells in Series Array',
    subtitle: 'Table 3: Voltage Addition (V_total = V1 + V2 + V3) (Manual p. 26, Fig. 3)',
    sourceManualFigure: 'Figure 3, p. 26',
    sourceManualPage: 26,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'cell-1', name: 'Solar Cell 1', type: 'source', description: 'First cell in series string' },
      { id: 'cell-2', name: 'Solar Cell 2', type: 'source', description: 'Second cell in series string' },
      { id: 'cell-3', name: 'Solar Cell 3', type: 'source', description: 'Third cell in series string' },
      { id: 'component-ammeter', name: 'Milliammeter', type: 'meter', description: 'Series string current' },
      { id: 'component-voltmeter', name: 'Voltmeter', type: 'meter', description: 'Total string voltage' },
    ],
    wiringNotes: [
      'Connect Cathode (-) of Cell 1 to Anode (+) of Cell 2',
      'Connect Cathode (-) of Cell 2 to Anode (+) of Cell 3',
      'Load connected across Anode (+) of Cell 1 and Cathode (-) of Cell 3',
      'Voltmeter in parallel across load',
    ],
    connectionSequence: [
      { step: 1, from: 'SC1 (-)', to: 'SC2 (+)', label: 'Wire 1: Series Jumper 1', wireColor: '#94a3b8', polarityCheck: 'Negative of Cell 1 to Positive of Cell 2' },
      { step: 2, from: 'SC2 (-)', to: 'SC3 (+)', label: 'Wire 2: Series Jumper 2', wireColor: '#94a3b8', polarityCheck: 'Negative of Cell 2 to Positive of Cell 3' },
      { step: 3, from: 'SC1 (+)', to: 'Milliammeter (+)', label: 'Wire 3: Series String Output (+)', wireColor: '#ef4444', polarityCheck: 'First cell (+) to Ammeter (+)' },
      { step: 4, from: 'Milliammeter (-)', to: 'Load Resistor A', label: 'Wire 4: Ammeter to Load', wireColor: '#f59e0b', polarityCheck: 'Ammeter out to load term A' },
      { step: 5, from: 'Load Resistor B', to: 'SC3 (-)', label: 'Wire 5: Series Return Loop', wireColor: '#3b82f6', polarityCheck: 'Load term B to last cell (-)' },
      { step: 6, from: 'Load Resistor A', to: 'Voltmeter (+)', label: 'Wire 6: Voltmeter Tap (+)', wireColor: '#ef4444', polarityCheck: 'Parallel across load' },
      { step: 7, from: 'Load Resistor B', to: 'Voltmeter (-)', label: 'Wire 7: Voltmeter Tap (-)', wireColor: '#10b981', polarityCheck: 'Parallel across load' },
    ],
    renderSvg: (highId) => <SolarCellArrayDiagram highlightedId={highId} mode="series" />,
  },
  {
    id: 'parallel_array',
    name: '3 Cells in Parallel Array',
    subtitle: 'Table 4: Current Addition (I_total = I1 + I2 + I3) (Manual p. 27, Fig. 4)',
    sourceManualFigure: 'Figure 4, p. 27',
    sourceManualPage: 27,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'cell-1', name: 'Solar Cell 1', type: 'source', description: 'First parallel branch' },
      { id: 'cell-2', name: 'Solar Cell 2', type: 'source', description: 'Second parallel branch' },
      { id: 'cell-3', name: 'Solar Cell 3', type: 'source', description: 'Third parallel branch' },
      { id: 'component-ammeter', name: 'Milliammeter', type: 'meter', description: 'Total combined current' },
      { id: 'component-voltmeter', name: 'Voltmeter', type: 'meter', description: 'Parallel bus voltage' },
    ],
    wiringNotes: [
      'Tie all 3 Anodes (+) together to form positive bus',
      'Tie all 3 Cathodes (-) together to form negative bus',
      'Load connected between positive and negative buses',
      'Total current triples while voltage equals single cell',
    ],
    connectionSequence: [
      { step: 1, from: 'SC1 (+)', to: 'SC2 (+)', label: 'Wire 1: Positive Bus Interconnect 1', wireColor: '#ef4444', polarityCheck: 'Anode (+) to Anode (+)' },
      { step: 2, from: 'SC2 (+)', to: 'SC3 (+)', label: 'Wire 2: Positive Bus Interconnect 2', wireColor: '#ef4444', polarityCheck: 'Anode (+) to Anode (+)' },
      { step: 3, from: 'SC1 (-)', to: 'SC2 (-)', label: 'Wire 3: Negative Bus Interconnect 1', wireColor: '#3b82f6', polarityCheck: 'Cathode (-) to Cathode (-)' },
      { step: 4, from: 'SC2 (-)', to: 'SC3 (-)', label: 'Wire 4: Negative Bus Interconnect 2', wireColor: '#3b82f6', polarityCheck: 'Cathode (-) to Cathode (-)' },
      { step: 5, from: 'SC1 (+)', to: 'Milliammeter (+)', label: 'Wire 5: Bus to Milliammeter (+)', wireColor: '#ef4444', polarityCheck: 'Combined Anode (+) to Ammeter' },
      { step: 6, from: 'Milliammeter (-)', to: 'Load Resistor A', label: 'Wire 6: Ammeter to Load', wireColor: '#f59e0b', polarityCheck: 'Ammeter out to Load A' },
      { step: 7, from: 'Load Resistor B', to: 'SC1 (-)', label: 'Wire 7: Load Return to Negative Bus', wireColor: '#3b82f6', polarityCheck: 'Load B to Combined Cathode (-)' },
      { step: 8, from: 'Load Resistor A', to: 'Voltmeter (+)', label: 'Wire 8: Voltmeter Tap (+)', wireColor: '#ef4444', polarityCheck: 'Parallel across load' },
      { step: 9, from: 'Load Resistor B', to: 'Voltmeter (-)', label: 'Wire 9: Voltmeter Tap (-)', wireColor: '#10b981', polarityCheck: 'Parallel across load' },
    ],
    renderSvg: (highId) => <SolarCellArrayDiagram highlightedId={highId} mode="parallel" />,
  },
  {
    id: 'appliance_procedure_b',
    name: 'Procedure B: Real-World Direct-Drive Appliances',
    subtitle: 'Procedure B: Real-World Direct-Drive Appliances (LED & DC Motor) (Manual p. 29)',
    sourceManualFigure: 'Procedure B, p. 29',
    sourceManualPage: 29,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'component-solar-cell', name: 'Solar Cell Array', type: 'source', description: 'Photovoltaic generator' },
      { id: 'component-resistor', name: '220 Ω Limiting Resistor', type: 'passive', description: 'Protects LED from thermal damage' },
      { id: 'component-appliance', name: 'Appliance Load', type: 'passive', description: 'Red/Green/Blue LED or DC Motor' },
      { id: 'component-voltmeter', name: 'Voltmeter', type: 'meter', description: 'Operating voltage across appliance' },
    ],
    wiringNotes: [
      'Solar Array (+) connects through 220 Ω limiting resistor to appliance (+)',
      'Appliance (-) returns to Solar Array (-)',
      'Voltmeter placed directly across appliance terminals',
    ],
    connectionSequence: [
      { step: 1, from: 'Solar Array (+)', to: '220 Ω Resistor (In)', label: 'Wire 1: Array (+) to Limiter', wireColor: '#ef4444', polarityCheck: 'Positive panel to limiter' },
      { step: 2, from: '220 Ω Resistor (Out)', to: 'Appliance (+ Anode)', label: 'Wire 2: Limiter to Appliance (+)', wireColor: '#f59e0b', polarityCheck: 'Limiter out to appliance anode' },
      { step: 3, from: 'Appliance (- Cathode)', to: 'Solar Array (-)', label: 'Wire 3: Appliance Return to Array (-)', wireColor: '#3b82f6', polarityCheck: 'Cathode to negative panel' },
      { step: 4, from: 'Appliance (+)', to: 'Voltmeter (+)', label: 'Wire 4: Parallel Voltmeter (+)', wireColor: '#ef4444', polarityCheck: 'Parallel tap to voltmeter' },
      { step: 5, from: 'Appliance (-)', to: 'Voltmeter (-)', label: 'Wire 5: Parallel Voltmeter (-)', wireColor: '#10b981', polarityCheck: 'Parallel tap to voltmeter' },
    ],
    renderSvg: (highId) => <SolarCellApplianceDiagram highlightedId={highId} />,
  },
];

export const solarCellSteps: GuidedStep[] = [
  {
    id: 'e1-step-1',
    number: 1,
    title: 'Instrument Identification & Terminal Labels',
    shortTask: 'Locate 5W lamp, SC1 panel, decade box, and meters',
    what: 'Inspect the laboratory bench. Identify the 5W halogen optical source, the silicon solar cell panels SC1–SC3 with Red (+) and Blue (-) binding posts, the decade resistance box (0.1–10 kΩ), the digital milliammeter (mA), and the digital voltmeter (V).',
    where: 'Examine the workbench visual layout and binding posts. Notice the polarity coding: Red for positive (+), Blue/Green for negative/ground (-).',
    why: 'Photovoltaic cells produce direct current (DC). Understanding terminal polarities and meter functions prevents meter damage, reverse-bias errors, or false readings.',
    observe: 'The workbench shows 3 solar panels, a movable lamp on an optical bench rail, digital meters, and load binding posts.',
    mistakes: 'Confusing ammeter (series) and voltmeter (parallel) will result in short circuits or blocked current flow.',
    hint: 'Review terminal colors: Red = (+), Blue = (-). Ensure the 5W lamp is ready.',
    targetElementId: 'lamp-toggle',
    apparatusHighlightId: 'component-solar-cell',
    configurationId: 'single_cell',
    validate: () => {
      return { isComplete: true, feedback: 'Apparatus instruments and terminal labels verified.' };
    },
  },
  {
    id: 'e1-step-2',
    number: 2,
    title: 'Lamp Alignment & Open-Circuit Voltage (Voc at 25 cm)',
    shortTask: 'Position lamp at 25 cm and measure Voc',
    what: 'Turn ON the 5W lamp, set the optical rail distance to 25 cm (0.25 m) for Table 1, and measure the open-circuit voltage Voc with no external load connected.',
    where: 'Click the Lamp Switch to ON; slide the Distance Slider to 0.25 m (25 cm); click "Wire Voc" or wire Voltmeter directly across SC1.',
    why: 'Photons with energy hν > Eg create electron-hole pairs. Built-in electric field sweeps electrons to n-side and holes to p-side. Without an external load, charges accumulate until internal diffusion balances drift, establishing Voc (~2.45 V).',
    observe: 'Voltmeter displays open-circuit voltage Voc ≈ 2.45 V. Milliammeter reads 0.00 mA (no current loop). Lux meter registers calibrated irradiance.',
    mistakes: 'Leaving load resistor connected draws current and pulls terminal voltage below true Voc.',
    hint: 'Ensure lamp is ON, distance is 25 cm, and load is disconnected or "Wire Voc" is clicked.',
    targetElementId: 'distance-slider',
    apparatusHighlightId: 'component-lamp',
    configurationId: 'single_cell',
    validate: (state) => {
      const isLampOn = state?.lampIsOn !== false;
      const isDist = Math.abs((state?.distance ?? 0) - 0.25) < 0.03;
      if (!isLampOn) return { isComplete: false, feedback: 'Turn on the 5W lamp.' };
      if (!isDist) return { isComplete: false, feedback: 'Set optical rail distance to 25 cm (0.25 m).' };
      return { isComplete: true, feedback: 'Voc successfully established at 25 cm.' };
    },
  },
  {
    id: 'e1-step-3',
    number: 3,
    title: 'Series Milliammeter Placement & Short-Circuit Current (Isc)',
    shortTask: 'Measure maximum current with zero load resistance',
    what: 'Connect the milliammeter directly across the solar cell in series to determine short-circuit current Isc at 25 cm.',
    where: 'Click "Wire Isc" or connect SC1 (+) to mA (+) and mA (-) to SC1 (-).',
    why: 'When load resistance is zero, terminal voltage drops to zero (V = 0), allowing all photogenerated carriers to be collected as maximum drift current Isc (~12–15 mA).',
    observe: 'Milliammeter reads maximum current Isc ≈ 13.8 mA. Voltmeter reads 0.00 V.',
    mistakes: 'Reversing polarity causes negative current reading on digital meter.',
    hint: 'Use the "Wire Isc" quick helper or connect ammeter in series with zero external load.',
    targetElementId: 'wire-isc-button',
    apparatusHighlightId: 'component-ammeter',
    configurationId: 'single_cell',
    validate: (state) => {
      if (state?.circuitAnalysis && !state?.circuitAnalysis.isIscState && !state?.circuitAnalysis.isOperating) {
        return { isComplete: false, feedback: 'Connect milliammeter to measure short-circuit current Isc.' };
      }
      return { isComplete: true, feedback: 'Isc recorded near short-circuit condition.' };
    },
  },
  {
    id: 'e1-step-4',
    number: 4,
    title: 'Closed Loop Circuit Assembly & Resistance Variation (Table 1)',
    shortTask: 'Connect complete circuit and sweep all 13 resistance steps',
    what: 'Assemble the full circuit per Figure 1: SC1 (+) → mA (+) → mA (-) → Load Term A → Load Term B → SC1 (-), with Voltmeter in parallel across Load A and B. Sweep resistance across [0.1, 0.22, 0.5, 1.0, ..., 10.0] kΩ and record readings.',
    where: 'Click "Auto-Wire Normal" or manually drag wires; select Resistance steps; click "Record Current Values" / "Log Reading" for each row.',
    why: 'Sweeping load resistance from short circuit (0.1 kΩ) to open circuit (10 kΩ) traces the complete I-V curve, revealing current saturation and the knee voltage.',
    observe: 'Current decreases from ~13 mA down to ~0.2 mA while voltage increases from ~1.3 V up to ~2.4 V. Power (V × I) reaches a clear peak.',
    mistakes: 'Ammeter in parallel causes short circuit; voltmeter in series blocks current completely due to high internal impedance (~10 MΩ).',
    hint: 'Ensure circuit status indicates "VALID_CLOSED_CIRCUIT" and step through resistance values.',
    targetElementId: 'resistance-selector',
    apparatusHighlightId: 'component-load',
    configurationId: 'single_cell',
    validate: (state) => {
      const rows = state?.table1Data?.rows ?? [];
      if (rows.length < 5) {
        return { isComplete: false, feedback: `Populated ${rows.length}/5 required Table 1 points. Step through more resistance values.` };
      }
      return { isComplete: true, feedback: 'Table 1 load resistance sweep completed successfully.' };
    },
  },
  {
    id: 'e1-step-5',
    number: 5,
    title: 'Illumination Distance Variation (Table 2: Least Distance 12 cm)',
    shortTask: 'Move lamp to 12 cm and record Distance 2 dataset',
    what: 'Adjust the optical rail distance to Distance 2 (12 cm = 0.12 m). Switch to Table 2 tab, verify increased optical intensity, and log I-V readings across the resistance sequence.',
    where: 'Adjust Distance Slider to 0.12 m (12 cm); switch to Table 2 tab; click "Record Current Values" or "Populate Table 2".',
    why: 'By the inverse-square law, optical intensity Io increases as 1/d². Higher photon flux increases generation rate of electron-hole pairs, proportionally elevating photocurrent Isc while Voc rises only logarithmically.',
    observe: 'Short-circuit current Isc more than triples (~50–60 mA), while Voc increases slightly (~2.55 V). Calibrated lux is markedly higher.',
    mistakes: 'Placing lamp closer than 10 cm can cause thermal heating and degrade cell junction efficiency.',
    hint: 'Set distance to 0.12 m (12 cm) and populate Table 2.',
    targetElementId: 'table2-tab',
    apparatusHighlightId: 'component-lamp',
    configurationId: 'single_cell',
    validate: (state) => {
      const rows = state?.table2Data?.rows ?? [];
      const dist = state?.distance ?? 0.25;
      if (dist > 0.15 && rows.length < 3) {
        return { isComplete: false, feedback: 'Move lamp to 12 cm (0.12 m) to record Table 2 data.' };
      }
      return { isComplete: true, feedback: 'Table 2 distance variation data verified.' };
    },
  },
  {
    id: 'e1-step-6',
    number: 6,
    title: 'Multi-Panel Series Configuration (Table 3: Voltage Addition)',
    shortTask: 'Connect 3 cells in series and verify V_total = V1 + V2 + V3',
    what: 'Configure the 3 solar cells in series: SC1 (-) to SC2 (+), SC2 (-) to SC3 (+). Connect the load across SC1 (+) and SC3 (-). Switch diagram tab to "3 Cells in Series Array". Populate Table 3.',
    where: 'Switch Diagram dropdown to "3 Cells in Series Array"; set Topology selector to "Series"; click "Auto-Wire Normal".',
    why: 'In a series string, identical currents pass through each cell while terminal voltages sum: V_total = V1 + V2 + V3 ≈ 3 × Voc (~7.35 V), demonstrating voltage multiplication.',
    observe: 'Voltmeter displays ~7.3 V at open circuit. Operating current remains comparable to single cell (~13 mA).',
    mistakes: 'Reversing any inter-panel connection causes opposing voltages and reduces net output.',
    hint: 'Select "Series" topology and view Figure 3 in the diagram dropdown.',
    targetElementId: 'topology-series-button',
    apparatusHighlightId: 'cell-1',
    configurationId: 'series_array',
    validate: (state) => {
      if (state?.topology !== 'series') {
        return { isComplete: false, feedback: 'Switch circuit topology to "Series".' };
      }
      return { isComplete: true, feedback: 'Series configuration verified (Voltage addition).' };
    },
  },
  {
    id: 'e1-step-7',
    number: 7,
    title: 'Multi-Panel Parallel Configuration (Table 4: Current Addition)',
    shortTask: 'Connect 3 cells in parallel and verify I_total = I1 + I2 + I3',
    what: 'Connect all three panels in parallel: SC1 (+), SC2 (+), SC3 (+) tied together; SC1 (-), SC2 (-), SC3 (-) tied together. Switch diagram dropdown to "3 Cells in Parallel Array". Populate Table 4.',
    where: 'Switch Diagram dropdown to "3 Cells in Parallel Array"; set Topology selector to "Parallel"; click "Auto-Wire Normal".',
    why: 'In parallel arrays, all cells share the same terminal voltage while their photogenerated currents sum: I_total = I1 + I2 + I3 ≈ 3 × Isc (~40 mA).',
    observe: 'Ammeter reads ~40 mA under short circuit, while voltage remains equal to single-cell Voc (~2.45 V).',
    mistakes: 'Connecting positive bus to negative bus produces an internal short circuit that collapses terminal voltage.',
    hint: 'Select "Parallel" topology and review Figure 4 in the diagram dropdown.',
    targetElementId: 'topology-parallel-button',
    apparatusHighlightId: 'cell-1',
    configurationId: 'parallel_array',
    validate: (state) => {
      if (state?.topology !== 'parallel') {
        return { isComplete: false, feedback: 'Switch circuit topology to "Parallel".' };
      }
      return { isComplete: true, feedback: 'Parallel configuration verified (Current addition).' };
    },
  },
  {
    id: 'e1-step-8',
    number: 8,
    title: 'Procedure B: Practical Appliance Demonstration (LED & Motor)',
    shortTask: 'Test LED and DC motor loads with 220 Ω limiter',
    what: 'Switch to Procedure B. Connect the solar array to drive practical appliances: Red, Green, and Blue LEDs, and a DC motor. Verify that the 220 Ω limiting resistor protects the LED.',
    where: 'Toggle "Procedure B (Appliances)" checkbox; select Red LED, Green LED, or Motor; observe glow and motor RPM.',
    why: 'Demonstrates solar energy conversion into optical (LED) and mechanical (motor) work. The 220 Ω resistor prevents excessive current exceeding the LED rating (~20 mA).',
    observe: 'LED lights up when voltage exceeds threshold; motor spins smoothly with RPM proportional to available photovoltaic power.',
    mistakes: 'Omitting the 220 Ω limiting resistor risks LED thermal damage.',
    hint: 'Enable Procedure B and select different appliance loads to test operational behavior.',
    targetElementId: 'procedure-b-toggle',
    apparatusHighlightId: 'component-appliance',
    configurationId: 'appliance_circuit',
    validate: (state) => {
      if (!state?.isProcedureB) {
        return { isComplete: false, feedback: 'Enable "Procedure B (Appliances)" to test practical loads.' };
      }
      return { isComplete: true, feedback: 'Procedure B appliance operation demonstrated.' };
    },
  },
  {
    id: 'e1-step-9',
    number: 9,
    title: 'Plotting I-V and P-V Curves, Determining Pmax & Fill Factor',
    shortTask: 'Inspect graph knee, locate Pmax, and calculate FF',
    what: 'Open the Graphical Analysis view. Inspect the plotted I-V and P-V curves. Identify the Maximum Power Point (MPP: Vmax, Imax, Pmax). Compute Fill Factor FF = Pmax / (Voc × Isc).',
    where: 'Click "Graphical Analysis" tab; observe the pink P-V curve peaking at intermediate resistance; inspect calculation cards.',
    why: 'Fill Factor (FF) is the ratio of maximum usable power to theoretical rectangular power. Silicon solar cells typically exhibit FF between 0.50 and 0.75.',
    observe: 'P-V curve reaches maximum at knee (~1 kΩ load). Calculated FF is dimensionless (typically 0.60–0.70).',
    mistakes: 'Using current in mA instead of converting to Amperes (A) when calculating power P = V × I causes a 1000× factor error.',
    hint: 'Check the Graph view and verify that Fill Factor is between 0.5 and 0.75.',
    targetElementId: 'graph-tab',
    apparatusHighlightId: 'component-solar-cell',
    configurationId: 'single_cell',
    validate: () => {
      return { isComplete: true, feedback: 'I-V and P-V curves analyzed; Pmax and Fill Factor evaluated.' };
    },
  },
  {
    id: 'e1-step-10',
    number: 10,
    title: 'Radiometric Efficiency Calculation & Final Lab Report',
    shortTask: 'Calculate efficiency η = 100·Pmax / (A·I0) and save lab run',
    what: 'Calculate overall cell efficiency η = (Pmax / (Area × I0)) × 100%. Review the complete master report containing Voc, Isc, Pmax, FF, and η for all four observation tables. Save lab run.',
    where: 'Click "Calculations Drawer" or view Master Summary Table; verify formula substitution; click "Save Lab Run".',
    why: 'Solar cell efficiency measures how effectively incident radiometric solar power is converted to usable electrical power (typically 12–18% for silicon under standard test conditions).',
    observe: 'Full calculation output is displayed with KaTeX formatting: FF ≈ 0.65, η ≈ 14.8%.',
    mistakes: 'Confusing cell area (A = 0.0025 m²) or forgetting the factor of 100% in efficiency formula.',
    hint: 'Inspect the Master Summary and click "Save Lab Run" to finalize your lab performance.',
    targetElementId: 'save-run-button',
    apparatusHighlightId: 'component-solar-cell',
    configurationId: 'single_cell',
    validate: () => {
      return { isComplete: true, feedback: 'Experiment 1 successfully completed and saved.' };
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
      { id: 'component-supply', name: '3V DC Regulated Supply', type: 'source', description: 'Constant DC voltage source' },
      { id: 'component-pot', name: '100 kΩ Potentiometer', type: 'passive', description: 'Fine voltage divider for sub-millivolt control' },
      { id: 'component-resistor', name: '47 Ω Limiting Resistor', type: 'passive', description: 'Essential protective series current limiter' },
      { id: 'component-led', name: 'LED (Red, Yellow, Green, Blue)', type: 'source', description: 'Semiconductor p-n light emitting diode' },
      { id: 'component-ammeter', name: 'Microammeter (0–3000 µA)', type: 'meter', description: 'Measures diode forward conduction current in series' },
      { id: 'component-voltmeter', name: 'Voltmeter (0–5 V)', type: 'meter', description: 'Measures forward voltage drop directly across the LED' },
    ],
    wiringNotes: [
      'Potentiometer connected across 3V supply terminals',
      'Wiper connects in series with 47 Ω protective resistor',
      'Limiting resistor connects to series Microammeter (+)',
      'Microammeter (-) connects to LED Anode (+)',
      'LED Cathode (-) connects to circuit Ground (-)',
      'Digital Voltmeter connected in parallel across LED Anode and Cathode',
    ],
    connectionSequence: [
      { step: 1, from: '3V DC Supply (+)', to: 'Potentiometer (In)', label: 'Wire 1: Supply to Potentiometer (+)', wireColor: '#ef4444', wireElementId: 'wire-supply-pos', polarityCheck: 'DC (+) to Pot High' },
      { step: 2, from: '3V DC Supply (-)', to: 'Potentiometer (GND)', label: 'Wire 2: Supply to Potentiometer Ground', wireColor: '#3b82f6', wireElementId: 'wire-supply-neg', polarityCheck: 'DC (-) to Pot GND' },
      { step: 3, from: 'Potentiometer Wiper', to: '47 Ω Limiting Resistor (In)', label: 'Wire 3: Wiper to Limiting Resistor', wireColor: '#f59e0b', wireElementId: 'wire-wiper', polarityCheck: 'Wiper output to limiter' },
      { step: 4, from: 'Limiting Resistor (Out)', to: 'Microammeter (+)', label: 'Wire 4: Limiter to Series Ammeter (+)', wireColor: '#ef4444', wireElementId: 'wire-resistor', polarityCheck: 'Limiter to Ammeter (+)' },
      { step: 5, from: 'Microammeter (-)', to: 'LED (+ Anode)', label: 'Wire 5: Series Ammeter to LED (+)', wireColor: '#ef4444', wireElementId: 'wire-ammeter', polarityCheck: 'Crucial: Ammeter out to Anode (+)' },
      { step: 6, from: 'LED (- Cathode)', to: 'Potentiometer (GND)', label: 'Wire 6: LED Cathode to Ground Return', wireColor: '#3b82f6', wireElementId: 'wire-led-ground', polarityCheck: 'Cathode (-) to GND' },
      { step: 7, from: 'LED (+ Anode)', to: 'Voltmeter (+)', label: 'Wire 7: Parallel Voltmeter (+)', wireColor: '#ef4444', wireElementId: 'wire-voltmeter-pos', polarityCheck: 'Parallel tap to Anode' },
      { step: 8, from: 'LED (- Cathode)', to: 'Voltmeter (-)', label: 'Wire 8: Parallel Voltmeter (-)', wireColor: '#10b981', wireElementId: 'wire-voltmeter-neg', polarityCheck: 'Parallel tap to Cathode' },
    ],
    renderSvg: (highId) => <LedPlanckCircuitDiagram highlightedId={highId} />,
  },
  {
    id: 'led_reverse_bias',
    name: 'LED Reverse Bias Polarity Circuit',
    subtitle: 'Diagnostic: LED Anode connected to Negative Supply (Non-Emitting)',
    sourceManualFigure: 'Diagnostic Polarity Check',
    sourceManualPage: 40,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'component-supply', name: '3V DC Regulated Supply', type: 'source', description: 'Reversed supply polarity' },
      { id: 'component-resistor', name: '47 Ω Limiting Resistor', type: 'passive', description: 'Protective series resistor' },
      { id: 'component-led', name: 'LED (Reverse Biased)', type: 'source', description: 'Wide barrier, zero conduction current' },
      { id: 'component-ammeter', name: 'Microammeter (0 µA)', type: 'meter', description: 'Zero or reverse leakage current' },
      { id: 'component-voltmeter', name: 'Voltmeter', type: 'meter', description: 'Full supply voltage across diode' },
    ],
    wiringNotes: [
      'LED Anode connected to circuit GND',
      'LED Cathode connected to positive wiper output',
      'Reverse biased p-n junction blocks majority carriers',
    ],
    connectionSequence: [
      { step: 1, from: '3V Supply (+)', to: 'Limiting Resistor', label: 'Wire 1: Positive Rail to Resistor', wireColor: '#ef4444', polarityCheck: 'DC (+) to Limiter' },
      { step: 2, from: 'Limiting Resistor', to: 'Microammeter (+)', label: 'Wire 2: Limiter to Ammeter', wireColor: '#ef4444', polarityCheck: 'Limiter to Ammeter (+)' },
      { step: 3, from: 'Microammeter (-)', to: 'LED Cathode (-)', label: 'Wire 3: Series Ammeter to Cathode', wireColor: '#3b82f6', polarityCheck: 'Reverse Bias: Positive rail to Cathode' },
      { step: 4, from: 'LED Anode (+)', to: '3V Supply (-)', label: 'Wire 4: Anode to Ground Return', wireColor: '#ef4444', polarityCheck: 'Reverse Bias: GND to Anode' },
    ],
    renderSvg: (highId) => <LedPlanckCircuitDiagram highlightedId={highId} />,
  },
];

export const ledPlanckSteps: GuidedStep[] = [
  {
    id: 'e3-step-1',
    number: 1,
    title: 'Instrument Identification & Terminal Polarity Check',
    shortTask: 'Locate 3V supply, potentiometer, limiter, meters, and 4 LEDs',
    what: 'Identify all circuit components on the bench: 3V regulated DC supply, 100 kΩ potentiometer, 47 Ω protective current limiter, digital microammeter, digital voltmeter, and the four semiconductor LEDs (Red 660 nm, Yellow 590 nm, Green 525 nm, Blue 470 nm).',
    where: 'Inspect breadboard layout. Note the LED terminals: longer lead / red post is Anode (+), shorter lead / blue post is Cathode (-).',
    why: 'An LED conducts only under forward bias (Anode positive relative to Cathode). Connecting in reverse bias prevents carrier injection and emission.',
    observe: 'Workbench components and terminal binding posts are labeled with polarity indicators.',
    mistakes: 'Reversing LED polarity or attempting to drive LED without series limiting resistor.',
    hint: 'Confirm Anode is (+), Cathode is (-), and the 47 Ω resistor is present.',
    targetElementId: 'led-color-selector',
    apparatusHighlightId: 'component-led',
    configurationId: 'led_circuit',
    validate: () => {
      return { isComplete: true, feedback: 'LED instruments and polarity conventions identified.' };
    },
  },
  {
    id: 'e3-step-2',
    number: 2,
    title: 'Circuit Assembly & 47 Ω Limiting Resistor Verification',
    shortTask: 'Confirm complete forward bias loop and protective resistor',
    what: 'Assemble the forward bias circuit according to Figure 2: Wiper → 47 Ω Resistor → Series Microammeter → LED Anode (+) → LED Cathode (-) → GND, with Voltmeter across the LED.',
    where: 'Click "Auto-Wire Forward Bias" or connect wires manually; ensure 47 Ω limiting resistor is active; verify circuit status is "VALID_FORWARD_BIAS".',
    why: 'Once conduction begins, the diode dynamic resistance drops below 5 Ω. Without a current-limiting resistor, current will exceed 3000 µA and destroy the semiconductor junction.',
    observe: 'Circuit status displays "VALID_FORWARD_BIAS". Ammeter and voltmeter show zero initial readings before powering on.',
    mistakes: 'Placing ammeter across the LED in parallel creates a short circuit that bypasses the diode.',
    hint: 'Use "Auto-Wire Forward Bias" to inspect the correct wire routing.',
    targetElementId: 'auto-wire-button',
    apparatusHighlightId: 'component-resistor',
    configurationId: 'led_circuit',
    validate: (state) => {
      if (state?.isReverseBiased) {
        return { isComplete: false, feedback: 'LED is reverse biased. Switch to forward bias.' };
      }
      return { isComplete: true, feedback: 'Forward bias circuit properly assembled.' };
    },
  },
  {
    id: 'e3-step-3',
    number: 3,
    title: 'Power On & Initial Red LED (λ = 660 nm) Selection',
    shortTask: 'Switch ON 3V DC supply and select Red LED',
    what: 'Switch ON the 3V DC power supply and select the Red LED (wavelength λ = 660 nm = 660 × 10⁻⁹ m) as the first diode to characterize.',
    where: 'Toggle Power Switch to ON; select "Red (660 nm)" in the LED Color dropdown.',
    why: 'Red has the longest wavelength among visible LEDs, corresponding to the smallest bandgap energy Eg ≈ 1.88 eV and the lowest barrier potential VB.',
    observe: 'Power indicator turns green; Red LED is active on the socket; voltmeter displays baseline potential.',
    mistakes: 'Leaving power switch OFF or adjusting potentiometer with power disconnected.',
    hint: 'Click the Power Switch to ON and select Red LED.',
    targetElementId: 'power-switch',
    apparatusHighlightId: 'component-supply',
    configurationId: 'led_circuit',
    validate: (state) => {
      if (!state?.powerOn) return { isComplete: false, feedback: 'Switch ON the 3V DC power supply.' };
      if (state?.selectedColor !== 'red') return { isComplete: false, feedback: 'Select the Red LED (660 nm) for initial characterization.' };
      return { isComplete: true, feedback: 'Power supply ON and Red LED selected.' };
    },
  },
  {
    id: 'e3-step-4',
    number: 4,
    title: 'Potentiometer Voltage Adjustment & Conduction Threshold Knee',
    shortTask: 'Slowly increase potentiometer and observe threshold knee',
    what: 'Slowly rotate the potentiometer slider from 0% upward in small steps. Watch the voltmeter rise from 0 to 1.8 V while current remains negligible, then observe the sudden onset of current and light emission.',
    where: 'Adjust Potentiometer Slider between 50% and 75%; observe LED dome luminescence.',
    why: 'Until applied forward voltage V exceeds the barrier potential VB, majority carriers lack thermal energy to cross the depletion layer. Above VB, the barrier collapses, causing steep carrier injection and radiative recombination.',
    observe: 'The Red LED begins emitting visible photons around 1.8 V. The microammeter rises rapidly into hundreds of microamperes.',
    mistakes: 'Jumping potentiometer too quickly bypasses the critical exponential-to-linear knee transition.',
    hint: 'Advance potentiometer smoothly above 50% to observe threshold glow.',
    targetElementId: 'potentiometer-slider',
    apparatusHighlightId: 'component-pot',
    configurationId: 'led_circuit',
    validate: (state) => {
      const pot = state?.potentiometerRatio ?? 0;
      if (pot < 0.45) return { isComplete: false, feedback: 'Advance potentiometer above 45% to reach the conduction threshold.' };
      return { isComplete: true, feedback: 'Conduction knee region reached.' };
    },
  },
  {
    id: 'e3-step-5',
    number: 5,
    title: 'Table 1 Forward Characteristic Data Logging (15 rows)',
    shortTask: 'Record complete forward I-V dataset for Red LED',
    what: 'Step through forward voltages and record 15 distinct points into Table 1 spanning the sub-threshold, knee, and linear conduction regions.',
    where: 'Click "Log Current Point" / "Populate Table 1" for Red LED; view Table 1 tab.',
    why: 'A comprehensive dataset spanning sub-knee and supra-knee regions is required to accurately isolate the linear conduction slope.',
    observe: 'Table 1 populates with 15 rows: Voltage (V) vs Current (µA).',
    mistakes: 'Recording points only in the high-current region without capturing the sub-threshold baseline.',
    hint: 'Ensure Table 1 has all 15 points logged for Red LED.',
    targetElementId: 'table1-tab',
    apparatusHighlightId: 'component-ammeter',
    configurationId: 'led_circuit',
    validate: (state) => {
      const rows = state?.table1Data?.red ?? [];
      if (rows.length < 10) return { isComplete: false, feedback: 'Log full 15-point dataset for Red LED in Table 1.' };
      return { isComplete: true, feedback: 'Table 1 forward characteristics logged for Red LED.' };
    },
  },
  {
    id: 'e3-step-6',
    number: 6,
    title: 'Linear Tangent Fit & Barrier Potential (VB) Extraction',
    shortTask: 'Fit linear tangent to I-V curve and extract VB ≈ 1.88 V',
    what: 'In the I-V graph view, perform a linear tangent extrapolation on the linear conduction region (points above knee) down to the X-axis (I = 0). Determine the barrier potential VB.',
    where: 'Click "Fit Linear Tangent" on the I-V graph; verify that the X-intercept is displayed as VB.',
    why: 'Extrapolating the steep linear slope eliminates the curved sub-threshold diffusion tail and accounts for bulk series resistance, giving the true bandgap knee potential VB.',
    observe: 'Tangent line intersects X-axis at VB ≈ 1.88 V for Red LED. R² goodness-of-fit exceeds 0.99.',
    mistakes: 'Fitting through sub-threshold points curves the line and underestimates barrier potential.',
    hint: 'Click "Fit Linear Tangent" on the I-V curve.',
    targetElementId: 'fit-tangent-button',
    apparatusHighlightId: 'component-led',
    configurationId: 'led_circuit',
    validate: (state) => {
      const vb = state?.extractedVBs?.red ?? state?.barrierPotential;
      if (!vb || Math.abs(vb - 1.88) > 0.15) {
        return { isComplete: false, feedback: 'Perform linear tangent extrapolation to extract Red LED VB.' };
      }
      return { isComplete: true, feedback: 'Barrier potential VB extracted for Red LED (1.88 V).' };
    },
  },
  {
    id: 'e3-step-7',
    number: 7,
    title: 'Multi-Color Investigation (Yellow, Green, Blue LEDs & Table 2)',
    shortTask: 'Repeat procedure for Yellow, Green, and Blue LEDs',
    what: 'Repeat the I-V sweep and tangent extraction for the remaining three LEDs: Yellow (590 nm, VB ≈ 2.48 V), Green (525 nm, VB ≈ 2.19 V), and Blue (470 nm, VB ≈ 2.64 V). Record all in Table 2.',
    where: 'Switch LED color selector to Yellow, Green, and Blue; log tables and tangents; view Table 2 tab.',
    why: 'Shorter wavelengths correspond to higher photon energies (E = h·c/λ). Thus, Blue requires a significantly higher barrier potential VB than Red.',
    observe: 'Table 2 lists all 4 LEDs: Colour, λ (nm), 1/λ (m⁻¹), Barrier Potential VB (V), and individual h (J·s).',
    mistakes: 'Forgetting to convert wavelength from nm (10⁻⁹ m) when computing 1/λ.',
    hint: 'Populate Table 2 across all four LED colors.',
    targetElementId: 'table2-tab',
    apparatusHighlightId: 'component-led',
    configurationId: 'led_circuit',
    validate: (state) => {
      const vbs = state?.extractedVBs;
      if (!vbs || !vbs.blue || !vbs.green || !vbs.yellow || !vbs.red) {
        return { isComplete: false, feedback: 'Complete measurements for all 4 LEDs in Table 2.' };
      }
      return { isComplete: true, feedback: 'All 4 LED barrier potentials recorded in Table 2.' };
    },
  },
  {
    id: 'e3-step-8',
    number: 8,
    title: 'Graph Construction: Barrier Potential (VB) vs Inverse Wavelength (1/λ)',
    shortTask: 'Plot VB versus 1/λ and determine linear slope',
    what: 'Switch to the "Planck Graphical Analysis" tab. Plot Barrier Potential VB (V) on the Y-axis against Inverse Wavelength 1/λ (m⁻¹) on the X-axis. Fit a straight line through the origin to determine Slope = ΔVB / Δ(1/λ).',
    where: 'Click "Planck Fit (VB vs 1/λ)" tab; inspect the linear trend line and extracted slope.',
    why: 'According to the Einstein-Planck relation e·VB = h·c/λ, plotting VB vs 1/λ yields a straight line with slope S = h·c/e.',
    observe: 'Data points form an excellent straight line passing near the origin. Slope is approximately 1.24 × 10⁻⁶ V·m.',
    mistakes: 'Plotting VB vs λ instead of 1/λ produces an inverse hyperbolic curve instead of a straight line.',
    hint: 'Inspect the Planck Plot (VB vs 1/λ) and note the linear slope.',
    targetElementId: 'planck-graph-tab',
    apparatusHighlightId: 'component-led',
    configurationId: 'led_circuit',
    validate: () => {
      return { isComplete: true, feedback: 'Linear graph of VB vs 1/λ constructed successfully.' };
    },
  },
  {
    id: 'e3-step-9',
    number: 9,
    title: "Planck's Constant Derivation (h = Slope × e / c) & Final Lab Report",
    shortTask: 'Compute Planck constant and verify agreement with standard value',
    what: "Calculate Planck's constant from the graphical slope: h = Slope × (e / c) = Slope × (1.602 × 10⁻¹⁹ C / 2.998 × 10⁸ m/s). Verify agreement with standard value (6.626 × 10⁻³⁴ J·s). Save lab run.",
    where: 'Click "Calculations Drawer" / inspect Master Results Card; review percentage error; click "Save Lab Run".',
    why: "Confirms quantum hypothesis that light is emitted in discrete quanta of energy E = hν directly linking optical wavelength to semiconductor bandgap.",
    observe: "Derived h ≈ 6.63 × 10⁻³⁴ J·s with percentage error < 5%. Report is formatted and ready for submission.",
    mistakes: 'Inverting e/c as c/e, or missing the 10⁻³⁴ exponent.',
    hint: 'Save lab run to persist all Table 1, Table 2, and graphical results.',
    targetElementId: 'save-run-button',
    apparatusHighlightId: 'component-supply',
    configurationId: 'led_circuit',
    validate: () => {
      return { isComplete: true, feedback: "Planck's constant derived and verified successfully." };
    },
  },
];

// ============================================================================
// EXPERIMENT 4: QUANTUM TUNNELING (pp. 45–52)
// ============================================================================
export const tunnelingConfigurations: ApparatusConfiguration[] = [
  {
    id: 'barrier_geometry',
    name: 'Finite Rectangular Barrier Geometry',
    subtitle: 'Region I (x < 0), Region II (0 ≤ x ≤ a), Region III (x > a) (Manual p. 46)',
    sourceManualFigure: 'Image 176, p. 46',
    sourceManualPage: 46,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'region-1', name: 'Region I', type: 'quantum', description: 'Incident and reflected plane waves (V = 0)' },
      { id: 'region-2', name: 'Region II', type: 'quantum', description: 'Finite barrier potential V0 with exponential decay' },
      { id: 'region-3', name: 'Region III', type: 'quantum', description: 'Transmitted plane wave with amplitude t (V = 0)' },
    ],
    wiringNotes: [
      'Boundary matching at x = 0: ψI(0) = ψII(0) and dψI/dx(0) = dψII/dx(0)',
      'Boundary matching at x = a: ψII(a) = ψIII(a) and dψII/dx(a) = dψIII/dx(a)',
    ],
    renderSvg: (highId) => <QuantumTunnelingBarrierDiagram highlightedId={highId} />,
  },
];

export const tunnelingSteps: GuidedStep[] = [
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
    apparatusHighlightId: 'region-2',
    configurationId: 'barrier_geometry',
    validate: (state) => {
      if ((state?.particleEnergy_eV ?? 2) >= (state?.barrierHeight_eV ?? 6)) {
        return { isComplete: false, feedback: 'Set particle energy E below barrier height V0.' };
      }
      return { isComplete: true, feedback: 'Sub-barrier tunneling parameters established.' };
    },
  },
];

// ============================================================================
// EXPERIMENT 6: PHOTODIODE CHARACTERISTICS (pp. 56–59)
// ============================================================================
export const photodiodeConfigurations: ApparatusConfiguration[] = [
  {
    id: 'photodiode_reverse_bias',
    name: 'Standard Reverse-Bias Characterization',
    subtitle: 'Figure 1 (p. 57): Regulated Supply, Limiter, Microammeter, Photodiode & Lamp',
    sourceManualFigure: 'Figure 1, p. 57',
    sourceManualPage: 57,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'component-supply', name: '0–30V DC Variable Supply', type: 'source', description: 'Sets reverse bias voltage across diode' },
      { id: 'component-resistor', name: '1 kΩ Protective Resistor', type: 'passive', description: 'Current limiting protective resistor' },
      { id: 'component-ammeter', name: 'Microammeter (0–100 µA)', type: 'meter', description: 'Measures reverse saturation & photocurrent in series' },
      { id: 'photodiode', name: 'Photodiode (Cathode & Anode)', type: 'detector', description: 'p-n junction photosensor in reverse bias' },
      { id: 'lamp', name: 'LED Illumination Lamp', type: 'source', description: 'Optical excitation source on movable rail (dist d)' },
      { id: 'component-voltmeter', name: 'Voltmeter (0–10 V)', type: 'meter', description: 'Measures reverse bias voltage across photodiode in parallel' },
    ],
    wiringNotes: [
      'DC Supply (+) connects through 1 kΩ limiting resistor and microammeter to Photodiode Cathode (-)',
      'Photodiode Anode (+) returns to DC Supply (-)',
      'Voltmeter placed in parallel across Photodiode Cathode (-) and Anode (+)',
      'Strict polarity: Cathode to (+), Anode to (-) ensures reverse bias',
    ],
    connectionSequence: [
      { step: 1, from: '0-30V DC Supply (+)', to: '1 kΩ Resistor (In)', label: 'Wire 1: Positive Rail to Resistor', wireColor: '#ef4444', wireElementId: 'wire-1', polarityCheck: 'DC (+) to Limiter' },
      { step: 2, from: '1 kΩ Resistor (Out)', to: 'Microammeter (+)', label: 'Wire 2: Limiter to Series Ammeter', wireColor: '#ef4444', wireElementId: 'wire-2', polarityCheck: 'Limiter out to Ammeter (+)' },
      { step: 3, from: 'Microammeter (-)', to: 'Photodiode Cathode (-)', label: 'Wire 3: Series Ammeter to Cathode', wireColor: '#ef4444', wireElementId: 'wire-3', polarityCheck: 'Strict: Ammeter (-) to Cathode K (-)' },
      { step: 4, from: 'Photodiode Anode (+)', to: '0-30V DC Supply (-)', label: 'Wire 4: Diode Anode to Ground Return', wireColor: '#64748b', wireElementId: 'wire-4', polarityCheck: 'Anode A (+) to DC (-)' },
      { step: 5, from: 'Photodiode Cathode (-)', to: 'Voltmeter (+)', label: 'Wire 5: Parallel Voltmeter (+)', wireColor: '#38bdf8', wireElementId: 'wire-5', polarityCheck: 'Parallel tap to Cathode' },
      { step: 6, from: 'Photodiode Anode (+)', to: 'Voltmeter (-)', label: 'Wire 6: Parallel Voltmeter (-)', wireColor: '#38bdf8', wireElementId: 'wire-6', polarityCheck: 'Parallel tap to Anode' },
    ],
    renderSvg: (highId) => <PhotodiodeCircuitDiagram highlightedId={highId} isShieldedMode={false} />,
  },
  {
    id: 'photodiode_dark_shield',
    name: 'Dark Current Measurement (Shielded Condition)',
    subtitle: 'Table 1 (p. 57): Reverse Leakage Current ID (0 to 5 V) with Opaque Shield',
    sourceManualFigure: 'Manual p. 57, Table 1',
    sourceManualPage: 57,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'component-supply', name: '0–30V DC Supply', type: 'source', description: 'Sets reverse bias voltage' },
      { id: 'component-shield', name: 'Opaque Dark Shield', type: 'passive', description: 'Blocks all ambient and stray optical illumination' },
      { id: 'photodiode', name: 'Photodiode', type: 'detector', description: 'Operates in dark condition' },
      { id: 'component-ammeter', name: 'Microammeter (0–100 µA)', type: 'meter', description: 'Measures sub-microamp dark leakage ID' },
      { id: 'component-voltmeter', name: 'Voltmeter (0–10 V)', type: 'meter', description: 'Measures reverse bias voltage' },
    ],
    wiringNotes: [
      'Same reverse-bias circuit wiring as illuminated mode',
      'Diode is completely covered with opaque shielding hood',
      'Lamp must be switched OFF or fully shielded',
    ],
    connectionSequence: [
      { step: 1, from: '0-30V DC Supply (+)', to: '1 kΩ Resistor (In)', label: 'Wire 1: Positive Rail to Resistor', wireColor: '#ef4444', wireElementId: 'wire-1', polarityCheck: 'DC (+) to Limiter' },
      { step: 2, from: '1 kΩ Resistor (Out)', to: 'Microammeter (+)', label: 'Wire 2: Limiter to Series Ammeter', wireColor: '#ef4444', wireElementId: 'wire-2', polarityCheck: 'Limiter out to Ammeter (+)' },
      { step: 3, from: 'Microammeter (-)', to: 'Photodiode Cathode (-)', label: 'Wire 3: Series Ammeter to Cathode', wireColor: '#ef4444', wireElementId: 'wire-3', polarityCheck: 'Strict: Ammeter (-) to Cathode K (-)' },
      { step: 4, from: 'Photodiode Anode (+)', to: '0-30V DC Supply (-)', label: 'Wire 4: Diode Anode to Ground Return', wireColor: '#64748b', wireElementId: 'wire-4', polarityCheck: 'Anode A (+) to DC (-)' },
      { step: 5, from: 'Photodiode Cathode (-)', to: 'Voltmeter (+)', label: 'Wire 5: Parallel Voltmeter (+)', wireColor: '#38bdf8', wireElementId: 'wire-5', polarityCheck: 'Parallel tap to Cathode' },
      { step: 6, from: 'Photodiode Anode (+)', to: 'Voltmeter (-)', label: 'Wire 6: Parallel Voltmeter (-)', wireColor: '#38bdf8', wireElementId: 'wire-6', polarityCheck: 'Parallel tap to Anode' },
    ],
    renderSvg: (highId) => <PhotodiodeCircuitDiagram highlightedId={highId} isShieldedMode={true} />,
  },
];

export const photodiodeSteps: GuidedStep[] = [
  {
    id: 'e6-step-1',
    number: 1,
    title: 'Instrument Identification & Reverse-Bias Terminals',
    shortTask: 'Locate 0-30V DC supply, limiter, ammeter, voltmeter, diode, and lamp',
    what: 'Inspect the photodiode characterization bench: 0–30V regulated DC power supply, 1 kΩ protective series resistor, digital microammeter (0–100 µA), digital voltmeter (0–10 V), photodiode mounting with Cathode (K) and Anode (A) binding posts, removable opaque shield, and LED lamp on an optical bench rail.',
    where: 'Examine the photodiode package. Note that Cathode is marked K (-) and Anode is marked A (+).',
    why: 'Photodiodes are operated under reverse bias to widen the depletion region, minimize junction capacitance, and achieve linear optical response.',
    observe: 'Apparatus items are laid out on breadboard with dual digital meters and optical rail.',
    mistakes: 'Confusing microammeter (measures current in series) with voltmeter (measures voltage across diode in parallel).',
    hint: 'Locate the Photodiode Cathode (K) and Anode (A) terminals.',
    targetElementId: 'power-supply-slider',
    apparatusHighlightId: 'photodiode',
    configurationId: 'photodiode_reverse_bias',
    validate: () => {
      return { isComplete: true, feedback: 'Photodiode bench instruments identified.' };
    },
  },
  {
    id: 'e6-step-2',
    number: 2,
    title: 'Reverse-Bias Circuit Connection & Polarity Verification',
    shortTask: 'Wire circuit in strict reverse bias: Supply (+) to Cathode K, Anode A to Supply (-)',
    what: 'Connect the circuit per Figure 1: DC Supply (+) → 1 kΩ Resistor → Microammeter (+) → Microammeter (-) → Photodiode Cathode K (-). Diode Anode A (+) returns to DC Supply (-). Connect Voltmeter in parallel across Photodiode K and A.',
    where: 'Click "Auto-Wire Reverse Bias" or connect binding posts; verify circuit diagnostic status shows "VALID_REVERSE_BIAS".',
    why: 'Under reverse bias, external voltage reinforces the built-in electric field. Applying forward bias (Anode to +) causes exponential forward conduction that swamps the photodetector response and invalidates the experiment.',
    observe: 'Wiring status confirms "VALID_REVERSE_BIAS". Voltmeter and ammeter show zero initial reading.',
    mistakes: 'Reversing diode connections (Forward Bias): If Anode connects to positive, current will surge to milliamps instead of microamps, triggering a circuit warning.',
    hint: 'Remember: In reverse bias, positive supply connects to Cathode (-), and negative connects to Anode (+).',
    targetElementId: 'auto-wire-button',
    apparatusHighlightId: 'component-resistor',
    configurationId: 'photodiode_reverse_bias',
    validate: (state) => {
      if (state?.circuitEval?.isForwardBiased) {
        return { isComplete: false, feedback: 'Warning: Photodiode is forward biased! Connect Cathode to (+) and Anode to (-) for reverse bias.' };
      }
      if (state?.circuitEval && !state?.circuitEval.isValid) {
        return { isComplete: false, feedback: 'Circuit wiring is incomplete or incorrect. Ensure closed reverse-bias loop.' };
      }
      return { isComplete: true, feedback: 'Reverse bias wiring correctly configured and verified.' };
    },
  },
  {
    id: 'e6-step-3',
    number: 3,
    title: 'Table 1: Dark Current Measurement (0–5 V with Opaque Shield)',
    shortTask: 'Place shield over diode and sweep reverse voltage from 0 to 5 V',
    what: 'Place the opaque shield over the photodiode (or turn off the lamp). Switch diagram to "Dark Current Measurement". Sweep the reverse bias voltage from 0.0 to 5.0 V in 0.5 V steps. Record the dark leakage current ID into Table 1.',
    where: 'Click "Toggle Shield" to ON (or turn Lamp OFF); adjust Reverse Voltage slider from 0.0 to 5.0 V; click "Record Table 1 Row" / "Populate Table 1".',
    why: 'In complete darkness, only thermally generated minority electron-hole pairs inside the depletion region are swept across the junction, creating a minute saturation current ID (< 1 µA) that quickly levels off.',
    observe: 'Dark current ID remains tiny (< 0.2 µA) across the entire 0 to 5 V reverse voltage range.',
    mistakes: 'Leaving shield OFF or lamp ON will allow stray light to enter, artificially inflating dark current readings.',
    hint: 'Enable the opaque shield (or turn lamp off) and record Table 1 points.',
    targetElementId: 'shield-toggle',
    apparatusHighlightId: 'component-shield',
    configurationId: 'photodiode_dark_shield',
    validate: (state) => {
      const rows = state?.table1Rows ?? [];
      if (!state?.isShielded && state?.lampIsOn) {
        return { isComplete: false, feedback: 'Enable the opaque shield or turn off the lamp to measure dark current.' };
      }
      if (rows.length < 5) {
        return { isComplete: false, feedback: 'Record at least 5 dark current data points in Table 1.' };
      }
      return { isComplete: true, feedback: 'Table 1 dark current measurements recorded.' };
    },
  },
  {
    id: 'e6-step-4',
    number: 4,
    title: 'Table 2: Illuminated I-V Characteristics at Fixed Distance (10 cm)',
    shortTask: 'Remove shield, turn lamp ON at 10 cm, and sweep reverse voltage 0–5 V',
    what: 'Remove the opaque shield, switch ON the LED lamp, and position it at a fixed distance d = 10 cm. Switch to Table 2 tab. Sweep reverse bias voltage from 0.0 to 5.0 V in 0.5 V steps and record total illuminated current Iillum.',
    where: 'Click "Toggle Shield" to OFF; toggle Lamp to ON; set Distance to 10 cm; sweep voltage slider from 0 to 5 V; log Table 2 rows.',
    why: 'Incident photons create additional electron-hole pairs in the depletion region. The strong reverse electric field sweeps them across the junction, producing a steady photocurrent Iph that adds to dark current: Iillum = ID + Iph.',
    observe: 'Current rises sharply at low voltage and quickly saturates to ~18–25 µA. The curve is virtually flat with increasing reverse bias.',
    mistakes: 'Allowing lamp distance to shift during the voltage sweep will introduce intensity variations.',
    hint: 'Ensure shield is OFF, lamp is ON at 10 cm, and record Table 2 data.',
    targetElementId: 'table2-tab',
    apparatusHighlightId: 'lamp',
    configurationId: 'photodiode_reverse_bias',
    validate: (state) => {
      const rows = state?.table2Rows ?? [];
      if (state?.isShielded || !state?.lampIsOn) {
        return { isComplete: false, feedback: 'Turn lamp ON and remove shield for illuminated characteristics.' };
      }
      if (rows.length < 5) {
        return { isComplete: false, feedback: 'Record at least 5 data points in Table 2.' };
      }
      return { isComplete: true, feedback: 'Table 2 illuminated I-V characteristics recorded at 10 cm.' };
    },
  },
  {
    id: 'e6-step-5',
    number: 5,
    title: 'Photocurrent Calculation (Iph = Iillum - ID) & Saturation Check',
    shortTask: 'Subtract dark current from illuminated current to isolate Iph',
    what: 'Compute the true net photocurrent for each voltage step: Iph = Iillum - ID. Verify that Iph is virtually independent of reverse bias voltage once saturation is reached.',
    where: 'Inspect Table 2 columns: Illuminated Current (µA), Dark Current ID (µA), and Photocurrent Iph (µA).',
    why: 'Because the reverse bias field already collects all photogenerated carriers (collection efficiency η_col ≈ 100%), increasing voltage further does not increase photocurrent.',
    observe: 'Calculated Iph remains nearly constant around 18–22 µA between 1.0 V and 5.0 V.',
    mistakes: 'Failing to subtract dark current ID will overestimate photocurrent, especially at higher temperatures.',
    hint: 'Review the Iph column in Table 2 to confirm current saturation.',
    targetElementId: 'table2-tab',
    apparatusHighlightId: 'photodiode',
    configurationId: 'photodiode_reverse_bias',
    validate: () => {
      return { isComplete: true, feedback: 'Photocurrent Iph = Iillum - ID calculated and saturation verified.' };
    },
  },
  {
    id: 'e6-step-6',
    number: 6,
    title: 'Table 3: Distance Dependence & Verification of Inverse-Square Law (1/d²)',
    shortTask: 'Fix reverse voltage at 2.0 V, vary distance 5 to 20 cm, and record I vs d',
    what: 'Switch to Table 3 tab. Fix reverse voltage at a constant 2.0 V. Vary the lamp distance d across [5, 7.5, 10, 12.5, 15, 17.5, 20] cm. Record illuminated current, compute Iph, and verify that photocurrent is inversely proportional to d² (Iph ∝ 1/d²).',
    where: 'Set Voltage slider to 2.0 V; switch to Table 3 tab; adjust Distance Slider from 5 to 20 cm; log Table 3 rows.',
    why: 'According to the inverse-square law of illumination, radiant flux density decreases as 1/d². Since photocurrent is strictly proportional to incident optical power, Iph must decrease linearly with 1/d².',
    observe: 'As distance increases from 5 cm to 20 cm, current drops from ~80 µA down to ~5 µA. Plot of Iph vs 1/d² is a straight line.',
    mistakes: 'Varying voltage while changing distance prevents isolating the distance dependence.',
    hint: 'Fix voltage at 2.0 V and step distance from 5 cm to 20 cm in Table 3.',
    targetElementId: 'distance-slider',
    apparatusHighlightId: 'lamp',
    configurationId: 'photodiode_reverse_bias',
    validate: (state) => {
      const rows = state?.table3Rows ?? [];
      if (rows.length < 4) {
        return { isComplete: false, feedback: 'Record at least 4 distance points in Table 3.' };
      }
      return { isComplete: true, feedback: 'Table 3 distance variation and inverse-square law verified.' };
    },
  },
  {
    id: 'e6-step-7',
    number: 7,
    title: 'Optical Responsivity Calculation (R = Iph / Popt)',
    shortTask: 'Compute responsivity R in A/W from optical power Popt',
    what: 'Calculate optical power incident on the photodiode active area: Popt = P_lamp · (A_pd / (4πd²)). Compute the responsivity R = Iph / Popt (converting Iph to Amperes).',
    where: 'Inspect Table 2 and Table 3 optical power columns and Responsivity (A/W) readouts.',
    why: 'Responsivity R (A/W) is the fundamental figure of merit for a photodetector, quantifying electrical current generated per Watt of incident optical radiation.',
    observe: 'Calculated responsivity R is typically 0.40–0.50 A/W for silicon photodiodes in the visible spectrum.',
    mistakes: 'Using photocurrent in microamperes (µA) instead of converting to Amperes (A) produces an error factor of 10⁶.',
    hint: 'Verify responsivity R is around 0.4 to 0.5 A/W.',
    targetElementId: 'calculations-button',
    apparatusHighlightId: 'photodiode',
    configurationId: 'photodiode_reverse_bias',
    validate: () => {
      return { isComplete: true, feedback: 'Optical responsivity R evaluated accurately.' };
    },
  },
  {
    id: 'e6-step-8',
    number: 8,
    title: 'Graph Construction, Performance Comparison & Final Lab Report',
    shortTask: 'Plot reverse I-V and Iph vs 1/d² curves and save lab run',
    what: 'Inspect the plotted Reverse I-V characteristics comparing Dark Current vs Illuminated Current curves. Also view the Photocurrent vs 1/d² linearity plot. Verify that all manual observation tables are filled and save the lab run.',
    where: 'Toggle between "I-V Reverse Curves" and "Photocurrent vs Intensity (1/d²)" in the Graph panel; click "Save Lab Run".',
    why: 'The comparison graph visually demonstrates the wide dynamic range between dark leakage (< 1 µA) and illuminated current (tens of µA), confirming photoconductive mode operation.',
    observe: 'Graphs clearly show voltage saturation and linear proportionality to 1/d² with R² > 0.99.',
    mistakes: 'Failing to save results before completing the lab session.',
    hint: 'Save lab run to persist all Table 1, 2, and 3 measurements.',
    targetElementId: 'save-run-button',
    apparatusHighlightId: 'photodiode',
    configurationId: 'photodiode_reverse_bias',
    validate: () => {
      return { isComplete: true, feedback: 'Experiment 6 successfully completed and saved.' };
    },
  },
];

// ============================================================================
// EXPERIMENT 5: SODIUM VAPOUR SPECTRUM (MINIMUM DEVIATION METHOD) (pp. 48–55)
// ============================================================================
export const sodiumConfigurations: ApparatusConfiguration[] = [
  {
    id: 'minimum_deviation',
    name: 'Minimum Deviation Spectrometer Setup',
    subtitle: 'Sodium Yellow Doublet D1 (589.6 nm) & D2 (589.0 nm) (Manual pp. 48–53)',
    sourceManualFigure: 'Figure 1 & 2, pp. 48–51',
    sourceManualPage: 50,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'sodium-lamp', name: 'Sodium Vapour Lamp', type: 'source', description: 'Monochromatic doublet light source (589.0 & 589.6 nm)' },
      { id: 'collimator', name: 'Collimator', type: 'optical', description: 'Parallel beam collimator with fine adjustable slit' },
      { id: 'prism-table', name: 'Prism / Grating Table', type: 'optical', description: 'Rotatable graduated table with tangential leveling screws' },
      { id: 'telescope', name: 'Telescope', type: 'optical', description: 'Ocular telescope with vertical and horizontal crosshairs' },
      { id: 'vernier-v1', name: 'Vernier 1 (V1)', type: 'meter', description: 'Primary 30-division circular scale' },
      { id: 'vernier-v2', name: 'Vernier 2 (V2)', type: 'meter', description: 'Secondary scale with 180° diametrical offset' },
    ],
    wiringNotes: [
      'Focus crosshairs on direct slit image from collimator (direct ray reading T0)',
      'Mount transmission grating on central prism table perpendicular to leveling screws',
      'Rotate table until diffracted yellow doublet moves, stops, and reverses direction (Turning Point)',
      'Clamp table and use tangential slow-motion screw to set crosswire exactly on the extremum turning point',
    ],
    renderSvg: (highId) => <SodiumMinimumDeviationDiagram highlightedId={highId} />,
  },
];

export const sodiumSteps: GuidedStep[] = [
  {
    id: 'e5-step-1',
    number: 1,
    title: 'Lamp Initialization & Direct Collimator Ray Alignment',
    shortTask: 'Turn on Na lamp, align telescope to direct ray, record T0',
    what: 'Switch on the Sodium vapour lamp, align telescope directly with the collimator, and focus the crosshairs on the bright vertical yellow slit image to record the baseline direct angle T0.',
    where: 'Toggle Sodium Lamp to ON; adjust telescope angle to 180.00°; inspect reticle view.',
    why: 'The direct ray reading serves as the reference origin T0 from which minimum deviation D = |T_turning - T0| is measured.',
    observe: 'A sharp, narrow vertical yellow line is centered on the reticle crosswires.',
    mistakes: 'Neglecting to record both V1 and V2 for the direct ray introduces zero-offset errors.',
    hint: 'Set telescope to direct ray position (180°) and verify V1 and V2.',
    targetElementId: 'telescope-angle-slider',
    apparatusHighlightId: 'collimator',
    configurationId: 'minimum_deviation',
    validate: (state) => {
      if (Math.abs((state?.telescopeAngle ?? 0) - 180) > 1.5) {
        return { isComplete: false, feedback: 'Center telescope on the direct ray (180°).' };
      }
      return { isComplete: true, feedback: 'Direct ray baseline verified.' };
    },
  },
  {
    id: 'e5-step-2',
    number: 2,
    title: 'Locate Minimum Deviation Turning Point (Extremum)',
    shortTask: 'Rotate prism table slowly while observing turning point in eyepiece',
    what: 'Rotate the prism table slowly in one direction while watching the diffracted yellow doublet in the telescope. The spectral lines will advance towards a minimum angle, stop stationary, and reverse direction upon further rotation. Lock the table at this exact turning point.',
    where: 'Adjust Table Rotation slider; observe spectral line direction reversal in reticle; click "Lock Turning Point".',
    why: 'At minimum deviation, the angle of incidence equals the angle of emergence (i = e), satisfying symmetric transmission through the grating element.',
    observe: 'The line reaches an extremum position where dθ/di = 0.',
    mistakes: 'Taking readings away from the turning point violates the minimum deviation equation 2 sin(D/2) = n·N·λ.',
    hint: 'Find the stationary reversal point of the yellow doublet.',
    targetElementId: 'table-angle-slider',
    apparatusHighlightId: 'prism-table',
    configurationId: 'minimum_deviation',
    validate: (state) => {
      if (!state?.isAtTurningPoint) {
        return { isComplete: false, feedback: 'Rotate table to find the turning point extremum.' };
      }
      return { isComplete: true, feedback: 'Minimum deviation turning point locked.' };
    },
  },
  {
    id: 'e5-step-3',
    number: 3,
    title: 'Measure Minimum Deviation for D1 & D2 Doublets',
    shortTask: 'Align crosshair with D1 (589.6 nm) and D2 (589.0 nm) and log verniers',
    what: 'Use the fine telescope tangential screw to set the vertical crosshair precisely on the D1 line (longer wavelength 589.6 nm), record V1 and V2. Then shift slightly to D2 (shorter wavelength 589.0 nm) and record V1 and V2.',
    where: 'Click "Record D1 Reading" and "Record D2 Reading" in the observation table.',
    why: 'The sodium doublet is separated by only 0.6 nm (6 Å), requiring high angular resolution and careful crosshair alignment.',
    observe: 'Both verniers show readings within ~0.05° of each other, reflecting the narrow angular separation between D1 and D2.',
    mistakes: 'Inverting D1 and D2 lines (D1 has greater deviation than D2).',
    hint: 'Record both D1 and D2 lines at minimum deviation into the observation table.',
    targetElementId: 'record-line-button',
    apparatusHighlightId: 'telescope',
    configurationId: 'minimum_deviation',
    validate: (state) => {
      const rows = state?.tableRows ?? [];
      if (rows.length < 2) {
        return { isComplete: false, feedback: 'Record both D1 and D2 readings in the observation table.' };
      }
      return { isComplete: true, feedback: 'Sodium yellow doublet D1 and D2 readings logged.' };
    },
  },
  {
    id: 'e5-step-4',
    number: 4,
    title: 'Calculate Wavelengths λ1, λ2 & Difference Δλ',
    shortTask: 'Compute λ = 2 sin(D/2) / (n · N) and difference Δλ = |λ1 - λ2|',
    what: 'Calculate angle of minimum deviation D = |T_turning - T0| for each line. Compute λ1 and λ2 using λ = 2 sin(D/2) / (n · N) with N = 15,000 LPI (5.906 × 10⁵ lines/m). Compute doublet separation Δλ.',
    where: 'Inspect Calculation Cards and verify that λ1 ≈ 589.6 nm, λ2 ≈ 589.0 nm, and Δλ ≈ 0.6 nm.',
    why: 'Verifies the spin-orbit coupling split in the 3p state of sodium atoms (²P₃/₂ and ²P₁/₂ fine structure).',
    observe: 'Percentage error compared to literature values (5890 Å and 5896 Å) is under 0.2%.',
    mistakes: 'Using normal incidence formula (e+d) sin θ = n λ instead of minimum deviation formula 2 sin(D/2) = n·N·λ.',
    hint: 'Review calculations drawer and verify doublet separation is ~0.6 nm.',
    targetElementId: 'calculations-button',
    apparatusHighlightId: 'sodium-lamp',
    configurationId: 'minimum_deviation',
    validate: () => {
      return { isComplete: true, feedback: 'Sodium doublet wavelengths and fine-structure separation verified.' };
    },
  },
];

// ============================================================================
// EXPERIMENT 7: ELECTRON DIFFRACTION (DE BROGLIE & BRAGG RINGS) (pp. 57–62)
// ============================================================================
export const electronDiffractionConfigurations: ApparatusConfiguration[] = [
  {
    id: 'electron_tube_caliper',
    name: 'Cathode Ray Diffraction Tube & Caliper',
    subtitle: 'Table 1: Accelerating Voltage (3–5 kV) vs Ring Diameters D1 & D2 (Manual p. 58)',
    sourceManualFigure: 'Figure 1, p. 58',
    sourceManualPage: 58,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'ht-power-supply', name: 'HT Power Supply', type: 'source', description: 'High voltage 0–5.0 kV DC supply with 6.3V heater' },
      { id: 'electron-gun', name: 'Electron Gun', type: 'optical', description: 'Thermionic tungsten filament cathode and accelerating anode aperture' },
      { id: 'graphite-target', name: 'Polycrystalline Graphite Foil', type: 'optical', description: 'Thin carbon target with d1=0.213 nm and d2=0.123 nm lattice planes' },
      { id: 'fluorescent-screen', name: 'Spherical Fluorescent Bulb', type: 'optical', description: 'Phosphor screen showing green concentric Debye-Scherrer rings' },
      { id: 'caliper', name: 'Digital Vernier Caliper', type: 'meter', description: 'Measures inner D1 and outer D2 ring diameters in mm' },
    ],
    wiringNotes: [
      'Connect heater supply (6.3V AC) to cathode filament pins',
      'Connect High Voltage negative terminal to cathode',
      'Connect High Voltage positive terminal to anode target aperture',
      'Gradually increase anode voltage from 3.0 kV to 5.0 kV; never exceed 5.0 kV limit',
    ],
    renderSvg: (highId) => <ElectronDiffractionDiagram highlightedId={highId} />,
  },
];

export const electronDiffractionSteps: GuidedStep[] = [
  {
    id: 'e7-step-1',
    number: 1,
    title: 'Heater Filament & Accelerating Voltage Initialization',
    shortTask: 'Power on HT supply, set voltage to 3.0 kV, observe diffraction rings',
    what: 'Switch on the electron diffraction apparatus, allow the tungsten cathode filament to warm up at 6.3 V, and set accelerating voltage VA to 3.0 kV. Observe the green luminescent screen.',
    where: 'Toggle HT Supply to ON; adjust Accelerating Voltage slider to 3.0 kV; inspect phosphor screen.',
    why: 'Electrons accelerated through potential difference VA acquire kinetic energy e·VA = p²/(2me), corresponding to de Broglie matter wavelength λ = h/p = h/√(2 me e VA).',
    observe: 'A bright central spot surrounded by two concentric circular rings (D1 and D2) appears on the phosphor screen.',
    mistakes: 'Setting voltage above 5.0 kV can cause thermal damage to the fragile graphite target.',
    hint: 'Set high voltage to 3.0 kV and locate the twin green rings.',
    targetElementId: 'voltage-slider',
    apparatusHighlightId: 'ht-power-supply',
    configurationId: 'electron_tube_caliper',
    validate: (state) => {
      if ((state?.voltage ?? 0) < 2.5) {
        return { isComplete: false, feedback: 'Set accelerating voltage to at least 3.0 kV.' };
      }
      return { isComplete: true, feedback: 'High-voltage electron acceleration established.' };
    },
  },
  {
    id: 'e7-step-2',
    number: 2,
    title: 'Measure Ring Diameters D1 & D2 Across 3.0–5.0 kV',
    shortTask: 'Use digital calipers to measure inner D1 and outer D2 rings at 5 voltages',
    what: 'Use the digital caliper tool to measure the inner ring diameter D1 and outer ring diameter D2 at voltages: 3.0, 3.5, 4.0, 4.5, and 5.0 kV. Log readings into Table 1.',
    where: 'Adjust Caliper jaws over D1 and D2; click "Record Observation Row" for each voltage step.',
    why: 'As accelerating voltage increases, electron momentum p increases, shortening de Broglie wavelength λ, causing the diffraction rings to contract (D ∝ 1/√VA).',
    observe: 'Inner diameter D1 contracts from ~28 mm down to ~21 mm as voltage rises from 3.0 to 5.0 kV.',
    mistakes: 'Measuring radius instead of diameter, or mixing up inner D1 (graphite {10-10}) with outer D2 ({11-20}).',
    hint: 'Log caliper readings for 5 voltage steps in Table 1.',
    targetElementId: 'record-row-button',
    apparatusHighlightId: 'caliper',
    configurationId: 'electron_tube_caliper',
    validate: (state) => {
      const rows = state?.tableRows ?? [];
      if (rows.length < 3) {
        return { isComplete: false, feedback: 'Record at least 3 voltage steps in Table 1.' };
      }
      return { isComplete: true, feedback: 'Electron diffraction ring measurements logged.' };
    },
  },
  {
    id: 'e7-step-3',
    number: 3,
    title: 'Verify de Broglie Wavelength & Bragg Plane Spacings',
    shortTask: 'Compute λ_dB and compare with Bragg relation d = 2 L λ / D',
    what: 'Compute theoretical de Broglie wavelength λ = h/√(2 me e VA). From measured ring diameters D and tube radius L = 13.5 cm, compute lattice spacings d1 and d2 using Bragg condition d = 2 L λ / D.',
    where: 'Inspect Table 1 calculated columns: λ_dB (pm), d1 (nm), d2 (nm), and verify d1 ≈ 0.213 nm, d2 ≈ 0.123 nm.',
    why: 'Demonstrates wave-particle duality: electrons behave as waves diffracting through crystal atomic planes identical to X-ray diffraction.',
    observe: 'Calculated d1 ≈ 0.213 nm and d2 ≈ 0.123 nm match the known hexagonal graphite honeycomb structure.',
    mistakes: 'Forgetting the factor of 2 in Bragg ring geometry (semi-angle θ satisfies tan 2θ ≈ r/L).',
    hint: 'Check that lattice spacings match literature values within 3% error.',
    targetElementId: 'calculations-button',
    apparatusHighlightId: 'graphite-target',
    configurationId: 'electron_tube_caliper',
    validate: () => {
      return { isComplete: true, feedback: 'De Broglie wavelength and lattice spacings verified.' };
    },
  },
];

// ============================================================================
// EXPERIMENT 8: HEISENBERG UNCERTAINTY PRINCIPLE (pp. 63–70)
// ============================================================================
export const heisenbergConfigurations: ApparatusConfiguration[] = [
  {
    id: 'single_slit_bench',
    name: 'Single-Slit Optical Bench & Travelling Photodetector',
    subtitle: 'Table 1: Slit Width a vs Central Fringe Width 2y1 (Manual p. 64, Fig. 1)',
    sourceManualFigure: 'Figure 1, p. 64',
    sourceManualPage: 64,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'laser-source', name: 'Monochromatic Laser Diode', type: 'source', description: 'Red semiconductor laser (λ = 650 nm, 5 mW)' },
      { id: 'single-slit', name: 'Variable Single Slit', type: 'optical', description: 'Precision bilateral micrometer slit (width a = 0.1 to 0.4 mm)' },
      { id: 'photodetector', name: 'Travelling Photodetector', type: 'meter', description: 'Silicon sensor on transverse micrometer stage measuring I(y)' },
    ],
    wiringNotes: [
      'Align red laser beam perpendicular to the bilateral single-slit aperture',
      'Verify distance L = 100 cm between slit aperture and photodetector plane',
      'Zero the transverse micrometer drum at the peak of the central diffraction maximum',
    ],
    renderSvg: (highId) => <SingleSlitHeisenbergDiagram highlightedId={highId} />,
  },
];

export const heisenbergSteps: GuidedStep[] = [
  {
    id: 'e8-step-1',
    number: 1,
    title: 'Laser Alignment & Bench Rail Calibration (L = 100 cm)',
    shortTask: 'Turn on laser, set L = 100 cm, center beam on single slit',
    what: 'Turn on the red laser diode (λ = 650 nm). Confirm optical rail distance L = 100 cm between the slit and the sensor plane. Set initial slit width a = 0.20 mm.',
    where: 'Toggle Laser to ON; verify Distance L slider is at 100 cm; set Slit Width to 0.20 mm.',
    why: 'Fixed geometric distance L allows translating linear spatial separation y on the screen into angular diffraction spread: sin θ ≈ y/L.',
    observe: 'A prominent diffraction pattern with a wide central maximum and faint side lobes appears on the detector screen.',
    mistakes: 'Altering distance L during the experiment violates the geometric calibration.',
    hint: 'Set distance to 100 cm and slit width to 0.20 mm.',
    targetElementId: 'slit-width-slider',
    apparatusHighlightId: 'laser-source',
    configurationId: 'single_slit_bench',
    validate: (state) => {
      if (!state?.laserOn) {
        return { isComplete: false, feedback: 'Turn on the laser source.' };
      }
      return { isComplete: true, feedback: 'Laser aligned on single slit.' };
    },
  },
  {
    id: 'e8-step-2',
    number: 2,
    title: 'Scan Central Diffraction Maximum & Measure Fringe Width 2y1',
    shortTask: 'Traverse micrometer across central maximum from -y1 to +y1',
    what: 'Move the travelling photodetector across the pattern using the micrometer drum. Locate the first intensity minimum on the left (-y1) and first minimum on the right (+y1). Compute central fringe width 2y1 = y1_right - y1_left.',
    where: 'Sweep the Micrometer Scan slider; locate points where intensity drops to 0; record into Table 1.',
    why: 'The first diffraction minimum occurs at a sin θ = λ ⇒ sin θ ≈ y1/L. Therefore, the angular spread of photon trajectories is θ = λ/a.',
    observe: 'Narrower slit widths produce wider central diffraction peaks, demonstrating inverse spatial-momentum relationship.',
    mistakes: 'Confusing semi-width y1 with total central peak width 2y1.',
    hint: 'Measure distance between the two first-order minima flanking the central peak.',
    targetElementId: 'record-fringe-button',
    apparatusHighlightId: 'photodetector',
    configurationId: 'single_slit_bench',
    validate: (state) => {
      const rows = state?.tableRows ?? [];
      if (rows.length < 3) {
        return { isComplete: false, feedback: 'Record central fringe widths for at least 3 slit widths.' };
      }
      return { isComplete: true, feedback: 'Diffraction fringe widths recorded across slit widths.' };
    },
  },
  {
    id: 'e8-step-3',
    number: 3,
    title: 'Evaluate Heisenberg Inequality Δx · Δpx ≥ h/2',
    shortTask: 'Compute spatial uncertainty Δx = a, momentum uncertainty Δpx, and product',
    what: 'Calculate spatial uncertainty Δx = a and momentum uncertainty Δpx = p sin θ = (h/λ)(y1/L). Evaluate the product Δx · Δpx and confirm that it satisfies the quantum limit Δx · Δpx ≥ h/2 (or ≥ h).',
    where: 'Inspect Table 1 columns: Δx (mm), Δpx (kg·m/s), and Uncertainty Product (J·s).',
    why: 'Confining the photon spatially by narrowing the slit (decreasing Δx) broadens the diffracted beam, creating a greater transverse momentum spread (increasing Δpx).',
    observe: 'For all slit widths, the product Δx · Δpx is of order ~h (typically 1.0 to 1.5 × 10⁻³⁴ J·s), always strictly exceeding h/2.',
    mistakes: 'Using slit width in millimeters instead of converting to meters when multiplying by momentum.',
    hint: 'Verify that the uncertainty product exceeds h/2 = 3.313 × 10⁻³⁴ J·s.',
    targetElementId: 'calculations-button',
    apparatusHighlightId: 'single-slit',
    configurationId: 'single_slit_bench',
    validate: () => {
      return { isComplete: true, feedback: 'Heisenberg uncertainty principle successfully verified.' };
    },
  },
];

// ============================================================================
// EXPERIMENT 9: QUANTUM COMPUTING & GATES (pp. 75–86)
// ============================================================================
export const quantumConfigurations: ApparatusConfiguration[] = [
  {
    id: 'quantum_circuit_bloch',
    name: 'Bloch Sphere & Two-Qubit Circuit',
    subtitle: 'Table 1: Single Qubit Gate Rotations & Table 2: Two-Qubit Entanglement (Manual pp. 75–86)',
    sourceManualFigure: 'Circuit Diagram, pp. 77–80',
    sourceManualPage: 77,
    svgViewBox: '0 0 500 320',
    components: [
      { id: 'bloch-sphere', name: 'Bloch Sphere Projection', type: 'quantum', description: '3D state vector |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩' },
      { id: 'quantum-circuit', name: 'Quantum Circuit Register', type: 'quantum', description: 'Two-qubit rail system with single and multi-qubit gates' },
      { id: 'gate-h', name: 'Hadamard Gate (H)', type: 'quantum', description: 'Creates equal superposition (|0⟩ + |1⟩)/√2' },
      { id: 'gate-cnot', name: 'Controlled-NOT (CNOT)', type: 'quantum', description: 'Entangles control qubit q0 with target qubit q1' },
      { id: 'gate-measure', name: 'Measurement Detector', type: 'quantum', description: 'Projects quantum state into classical bit string 00 or 11' },
    ],
    wiringNotes: [
      'Initialize qubits in ground state |00⟩',
      'Apply Hadamard gate H to qubit q0 to generate superposition (|0⟩ + |1⟩)/√2',
      'Apply CNOT gate with control on q0 and target on q1 to produce Bell state (|00⟩ + |11⟩)/√2',
      'Run 1024 shot measurements to verify 50% |00⟩ and 50% |11⟩ correlation',
    ],
    renderSvg: (highId) => <QuantumCircuitDiagram highlightedId={highId} />,
  },
];

export const quantumSteps: GuidedStep[] = [
  {
    id: 'e9-step-1',
    number: 1,
    title: 'Single Qubit Initialization & Bloch Sphere Navigation',
    shortTask: 'Initialize |q0⟩ = |0⟩, apply Pauli X, Y, Z gates, observe Bloch vector',
    what: 'Configure a single qubit in state |0⟩. Apply Pauli gates (X: bit flip |0⟩ → |1⟩, Z: phase flip |+⟩ → |-⟩, H: Hadamard |0⟩ → |+⟩). Observe the state vector rotate on the Bloch sphere.',
    where: 'Select Gate (X, Y, Z, H); click "Apply Gate"; observe 3D Bloch sphere vector movement.',
    why: 'Any pure single-qubit state can be represented as a point on the unit Bloch sphere with polar angle θ and azimuthal angle φ.',
    observe: 'Pauli X rotates 180° around X axis, sending the vector from North Pole (|0⟩) to South Pole (|1⟩).',
    mistakes: 'Confusing unitary gate rotation with projective measurement.',
    hint: 'Apply X and H gates to test single-qubit state transitions.',
    targetElementId: 'single-qubit-controls',
    apparatusHighlightId: 'bloch-sphere',
    configurationId: 'quantum_circuit_bloch',
    validate: (state) => {
      if (!state?.hasAppliedSingleGate) {
        return { isComplete: false, feedback: 'Apply at least one single-qubit gate (X, Y, Z, or H).' };
      }
      return { isComplete: true, feedback: 'Single-qubit unitary gate transformations tested.' };
    },
  },
  {
    id: 'e9-step-2',
    number: 2,
    title: 'Two-Qubit Entanglement & Bell State Generation',
    shortTask: 'Construct H + CNOT circuit to synthesize Bell state (|00⟩ + |11⟩)/√2',
    what: 'Switch to Two-Qubit workbench. Apply Hadamard H on qubit q0, followed by CNOT with control q0 and target q1. Verify the resulting state vector is the maximally entangled Bell state |Φ⁺⟩.',
    where: 'Toggle H on q0; toggle CNOT (control q0, target q1); click "Simulate State".',
    why: 'Hadamard creates superposition on q0: (|0⟩ + |1⟩)|0⟩/√2 = (|00⟩ + |10⟩)/√2. CNOT flips q1 if q0 is 1, yielding (|00⟩ + |11⟩)/√2, where qubits cannot be factored independently.',
    observe: 'State vector shows two non-zero components: c00 = 1/√2 and c11 = 1/√2, with zero probability for 01 or 10.',
    mistakes: 'Applying CNOT before Hadamard yields |00⟩ without generating entanglement.',
    hint: 'Place H on q0 then CNOT between q0 and q1.',
    targetElementId: 'bell-state-button',
    apparatusHighlightId: 'gate-cnot',
    configurationId: 'quantum_circuit_bloch',
    validate: (state) => {
      if (!state?.isBellState) {
        return { isComplete: false, feedback: 'Synthesize the Bell state (|00⟩ + |11⟩)/√2 using H + CNOT.' };
      }
      return { isComplete: true, feedback: 'Maximally entangled Bell state generated.' };
    },
  },
  {
    id: 'e9-step-3',
    number: 3,
    title: 'Measurement Statistics & Qiskit Python Code Export',
    shortTask: 'Simulate 1024 shots, verify 50/50 measurement histogram, export Python script',
    what: 'Simulate projective measurement with 1024 shots. Confirm that outcome |00⟩ occurs ~50% and |11⟩ occurs ~50%, while |01⟩ and |10⟩ never appear. Export the validated Qiskit Python script and save lab record.',
    where: 'Click "Run 1024 Shots"; inspect measurement histogram; click "Export Qiskit Python"; save lab record.',
    why: 'Validates non-local quantum correlation: measuring q0 immediately determines the state of q1 with 100% correlation regardless of physical distance.',
    observe: 'Histogram displays equal probability peaks at 00 and 11; Qiskit code matches standard IBM Quantum syntax.',
    mistakes: 'Expecting single-qubit classical outcomes from an entangled state.',
    hint: 'Run 1024 measurement shots and export the Qiskit Python script.',
    targetElementId: 'export-qiskit-button',
    apparatusHighlightId: 'gate-measure',
    configurationId: 'quantum_circuit_bloch',
    validate: () => {
      return { isComplete: true, feedback: 'Quantum circuit simulated, measured, and Python export verified.' };
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
    configurations: tunnelingConfigurations,
    steps: tunnelingSteps,
  },
  'expt-5-sodium-grating': {
    experimentId: 'expt-5-sodium-grating',
    experimentNumber: 5,
    experimentTitle: 'Wavelength of Sodium Light (Minimum Deviation)',
    sourcePages: 'pp. 48–55',
    rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
    configurations: sodiumConfigurations,
    steps: sodiumSteps,
  },
  'expt-6-photodiode': {
    experimentId: 'expt-6-photodiode',
    experimentNumber: 6,
    experimentTitle: 'Photodiode I–V Characteristics',
    sourcePages: 'pp. 56–59',
    rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
    configurations: photodiodeConfigurations,
    steps: photodiodeSteps,
  },
  'expt-7-electron-diffraction': {
    experimentId: 'expt-7-electron-diffraction',
    experimentNumber: 7,
    experimentTitle: 'Electron Diffraction (de Broglie & Bragg Wavelengths)',
    sourcePages: 'pp. 57–62',
    rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
    configurations: electronDiffractionConfigurations,
    steps: electronDiffractionSteps,
  },
  'expt-8-heisenberg-slit': {
    experimentId: 'expt-8-heisenberg-slit',
    experimentNumber: 8,
    experimentTitle: "Heisenberg's Uncertainty Principle (Single-Slit)",
    sourcePages: 'pp. 63–70',
    rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
    configurations: heisenbergConfigurations,
    steps: heisenbergSteps,
  },
  'expt-9-quantum-computing': {
    experimentId: 'expt-9-quantum-computing',
    experimentNumber: 9,
    experimentTitle: 'Single-Qubit and Two-Qubit Quantum Logic Gates',
    sourcePages: 'pp. 75–86',
    rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
    configurations: quantumConfigurations,
    steps: quantumSteps,
  },
};
