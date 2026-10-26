import { ExperimentMetadata } from '../types/experiment';

export const EXPERIMENTS_DATA: ExperimentMetadata[] = [
  {
    id: 'expt-1-solar-cell',
    number: 1,
    cycle: 1,
    title: 'Designing a solar cell based renewable energy device circuits for electric power generation',
    shortTitle: 'Solar Cell I-V & Power Generation',
    aim: 'To design a circuit using solar cell for electricity generation as a renewable energy device and determine its photovoltaic characteristics.',
    apparatus: [
      'Silicon solar cells (3 panel set)',
      '5W light source with variable distance mount',
      'Breadboard with terminal blocks',
      'Digital Voltmeter (DC 0–20V)',
      'Digital Ammeter (DC 0–200mA)',
      'Digital Lux Meter (lumen/m²)',
      'Variable decade resistance box (100Ω – 10kΩ)',
      'Connecting wires & alligator clips'
    ],
    pdfPageRange: 'pp. 22–32',
    printedPageRange: 'pp. 19–29',
    formulaSummary: 'Pmax = Imax × Vmax; Fill Factor FF = Pmax / (Voc × Isc); Efficiency η = Pmax / (A × Io) × 100%',
    isDemoFunctional: true,
    statusBadge: 'Functional Demo',
    tags: ['Cycle 1', 'Optoelectronics', 'Renewable Energy', 'I-V Curves', 'Photovoltaics'],
    precautions: [
      'Do not shade individual cells in series configurations to prevent localized resistive loss.',
      'Allow the 5W lamp to achieve thermal steady state before recording lux intensity.',
      'Ensure proper polarity when wiring voltmeter and ammeter into the circuit.'
    ],
    inconsistencies: [
      'Manual Observation Tables (pp. 28-31) list Current in mA and Power in W, but V × I(mA) yields mW. System internally converts to true SI Watts.'
    ],
    vivaQuestions: [
      {
        id: 'v1-1',
        question: 'What is the physical meaning of the Fill Factor (FF) in a solar cell?',
        answerHint: 'FF is the ratio of maximum usable power (Pmax) to the theoretical maximum product (Voc × Isc). Higher FF indicates lower internal series resistance and better squareness of the I-V curve.',
        sourcePage: 20
      },
      {
        id: 'v1-2',
        question: 'How do series and parallel connections differ in voltage and current outputs of solar cell arrays?',
        answerHint: 'In series, voltages add (Vtotal = V1 + V2 + ...) while current remains limited by the lowest cell; in parallel, currents add (Itotal = I1 + I2 + ...) while voltage remains that of a single cell.',
        sourcePage: 22
      },
      {
        id: 'v1-3',
        question: 'Why does current drop drastically beyond the Knee (Vmax) on the I-V curve?',
        answerHint: 'As forward bias across the internal p-n junction exceeds built-in barrier potential, exponential forward diode diffusion current opposes the light-generated photocurrent.',
        sourcePage: 19
      }
    ]
  },
  {
    id: 'expt-2-mercury-grating',
    number: 2,
    cycle: 1,
    title: 'Determining the wavelength composition of spectral lines of visible light source (Hg lamp) using grating optical element- Normal Incidence Method',
    shortTitle: 'Mercury Spectrum (Normal Incidence)',
    aim: 'Determination of wavelength of different spectral lines of mercury light with a plane transmission grating by normal incidence.',
    apparatus: [
      'Spectrometer with dual verniers (V1, V2)',
      'Mercury vapour lamp (Hg)',
      'Plane transmission diffraction grating (15,000 LPI)',
      'Spirit level & Reading lens'
    ],
    pdfPageRange: 'pp. 33–37',
    printedPageRange: 'pp. 30–34',
    formulaSummary: '(e+d) sin θ = n λ ⇒ λ = (e+d) sin θ / n; (e+d) = 2.54×10⁻² / N',
    isDemoFunctional: true,
    statusBadge: 'Functional Demo',
    tags: ['Cycle 1', 'Wave Optics', 'Diffraction Grating', 'Spectroscopy', 'Mercury Lamp'],
    precautions: [
      'Never touch the ruled surface of the transmission grating.',
      'Ensure prism table is leveled using spirit level before grating mounting.'
    ],
    inconsistencies: [
      'Manual p. 34 formula printed as "(e+d) = n λ / sin θ" (inverted). Rearranged as λ = (e+d) sin θ / n.',
      'Manual p. 36 includes Minimum Deviation formulas in Normal Incidence procedure.'
    ],
    vivaQuestions: [
      {
        id: 'v2-1',
        question: 'Why is normal incidence preferred for diffraction grating experiments?',
        answerHint: 'Normal incidence ensures symmetric diffracted orders on left and right sides of central maximum, simplifying angular measurement to θ = (a - b)/2.',
        sourcePage: 31
      },
      {
        id: 'v2-2',
        question: 'What is grating element (e+d)?',
        answerHint: 'It is the distance between two consecutive transparent slit centers, where e is transparent slit width and d is opaque ruled width.',
        sourcePage: 30
      }
    ]
  },
  {
    id: 'expt-3-led-planck',
    number: 3,
    cycle: 1,
    title: 'Determination of the fundamental constant of quantum physics from the study of semiconductor junctions',
    shortTitle: 'Planck Constant from LED',
    aim: 'To calculate the value of Planck’s constant (h) by studying the I-V characteristics of Light Emitting Diodes (LED).',
    apparatus: [
      'DC Voltage Source (3V)',
      'Current Limiting Resistor (10–100 Ω)',
      'Potentiometer (0–100 kΩ)',
      'Multimeters (Voltmeter 0-20V DC, Ammeter 0-20μA/mA)',
      'Breadboard and 4 LEDs (Blue 470nm, Yellow 500nm, Green 565nm, Red 660nm)'
    ],
    pdfPageRange: 'pp. 38–44',
    printedPageRange: 'pp. 35–41',
    formulaSummary: 'h = VB × λ × (e / c); Slope = hc / e ⇒ h = Slope × (e / c)',
    isDemoFunctional: true,
    statusBadge: 'Functional Demo',
    tags: ['Cycle 1', 'Quantum Physics', 'Planck Constant', 'Semiconductors', 'LEDs'],
    precautions: [
      'Current through LED must not exceed 3 mA (2900 μA) to avoid thermal runaway.',
      'Fix supply voltage to 3 V.'
    ],
    inconsistencies: [
      'Manual p. 42 Step 12 refers to non-existent Eq. 4; actual slope formula is Eq. 3 on p. 41.'
    ],
    vivaQuestions: [
      {
        id: 'v3-1',
        question: 'Why does light emission occur only when applied voltage exceeds barrier potential VB?',
        answerHint: 'Only when forward bias lowers the junction barrier sufficiently do electrons and holes inject across the depletion region to undergo radiative band-to-band recombination.',
        sourcePage: 36
      }
    ]
  },
  {
    id: 'expt-4-quantum-tunneling',
    number: 4,
    cycle: 1,
    title: 'Simulating Quantum Tunneling Through a Potential Barrier',
    shortTitle: 'Quantum Barrier Tunneling',
    aim: 'To simulate quantum mechanical tunneling of a particle through a potential barrier and understand the dependence of transmission probability on energy and barrier parameters.',
    apparatus: [
      'PC/Laptop',
      'Python with numpy, scipy and sympy running on Jupyter notebook / IDE'
    ],
    pdfPageRange: 'pp. 45–52',
    printedPageRange: 'pp. 42–49',
    formulaSummary: 'T = [1 + (V0² sinh²(κ a)) / (4E(V0 - E))]⁻¹; κ = √(2m(V0 - E) / ħ²)',
    isDemoFunctional: true,
    statusBadge: 'Functional Demo',
    tags: ['Cycle 1', 'Quantum Mechanics', 'Wavefunction', 'Schrödinger Equation', 'Simulation'],
    vivaQuestions: [
      {
        id: 'v4-1',
        question: 'Why is the transmission coefficient T non-zero even when particle energy E < V0?',
        answerHint: 'Because the quantum wavefunction does not terminate discontinuously at the barrier boundary; it decays exponentially inside the finite barrier, leaving a non-zero amplitude at the exit.',
        sourcePage: 42
      }
    ]
  },
  {
    id: 'expt-5-sodium-grating',
    number: 5,
    cycle: 2,
    title: 'Wavelength composition of spectral lines of visible light source (Na Lamp) using grating optical element- Minimum Deviation Method',
    shortTitle: 'Sodium Doublet (Minimum Deviation)',
    aim: 'Determination of wavelength of different spectral lines of Sodium light with a plane transmission grating by minimum deviation method.',
    apparatus: [
      'Spectrometer with fine adjustment screws',
      'Sodium vapour lamp (Na)',
      'Transmission grating (15,000 LPI)',
      'Spirit level & Reading lens'
    ],
    pdfPageRange: 'pp. 53–55',
    printedPageRange: 'pp. 50–52',
    formulaSummary: '2(e+d) sin(Dm / 2) = n λ ⇒ λ = 2(e+d) sin(Dm / 2) / n',
    isDemoFunctional: true,
    statusBadge: 'Functional Demo',
    tags: ['Cycle 2', 'Optics', 'Minimum Deviation', 'Sodium Doublet', 'Spectroscopy'],
    inconsistencies: [
      'Manual p. 55 Table column header erroneously writes "2Dm= (a-b)/2", when 2Dm = a-b and Dm = (a-b)/2.'
    ],
    vivaQuestions: [
      {
        id: 'v5-1',
        question: 'What is the characteristic feature of the minimum deviation position in a spectrometer?',
        answerHint: 'As the prism table is rotated in one direction, the spectral line moves towards the direct image, momentarily halts at the turning point, and then reverses direction.',
        sourcePage: 52
      }
    ]
  },
  {
    id: 'expt-6-photodiode',
    number: 6,
    cycle: 2,
    title: 'Study of I–V characteristics of a photodiode',
    shortTitle: 'Photodiode I-V & Responsivity',
    aim: 'To study the current-voltage (I-V) characteristics of a photodiode under dark and illuminated conditions; observe photocurrent changes with reverse voltage and light intensity.',
    apparatus: [
      'Photodiode module',
      'Regulated DC Power Supply (0–30 V)',
      'Microammeter (0–100 µA)',
      'Voltmeter (0–10 V)',
      'LED Lamp light source with optical bench mount',
      'Shielding opaque box / cloth for dark measurements'
    ],
    pdfPageRange: 'pp. 56–59',
    printedPageRange: 'pp. 53–56',
    formulaSummary: 'I = ID + Iph; Iph = Iillum - ID; Responsivity R = Iph / Popt (A/W); %Δ = ((Iillum - ID) / ID) × 100',
    isDemoFunctional: true,
    statusBadge: 'Functional Demo',
    tags: ['Cycle 2', 'Semiconductors', 'Photodiode', 'Dark Current', 'Responsivity'],
    vivaQuestions: [
      {
        id: 'v6-1',
        question: 'Why is a photodiode operated in reverse bias rather than forward bias?',
        answerHint: 'In reverse bias, the dark background current is minuscule (sub-microampere), so optically generated minority carriers produce a substantial, easily measurable percentage change.',
        sourcePage: 53
      }
    ]
  },
  {
    id: 'expt-7-electron-diffraction',
    number: 7,
    cycle: 2,
    title: 'Exploring the wave nature of electrons through diffraction',
    shortTitle: 'Electron Diffraction (de Broglie)',
    aim: 'To observe diffraction of electrons on polycrystalline graphite and confirm the wave nature of electrons; calculate and compare de Broglie and Bragg wavelengths; calculate kinetic energy.',
    apparatus: [
      'Electron diffraction tube with polycrystalline graphite target',
      'Tube holder with protective shield',
      'High voltage power supply (0–5 kV)',
      'Analogue multimeter & Vernier caliper'
    ],
    pdfPageRange: 'pp. 60–65',
    printedPageRange: 'pp. 57–62',
    formulaSummary: 'λ_dB = h / √(2me·e·V); Bragg: 2d sin θ = n λ ⇒ d·(D / 2L) = λ; K = eV',
    isDemoFunctional: true,
    statusBadge: 'Functional Demo',
    tags: ['Cycle 2', 'Modern Physics', 'de Broglie Wavelength', 'Electron Diffraction', 'Bragg Law'],
    inconsistencies: [
      'Manual p. 64 writes "Outer diameter: d=0.213nm", confusing lattice spacing d with diameter D.',
      'Manual p. 64 Step 6 writes "changing voltage by difference of 0.5V" instead of 0.5 kV.'
    ],
    vivaQuestions: [
      {
        id: 'v7-1',
        question: 'Why does increasing anode voltage V cause the diffraction ring diameter D to decrease?',
        answerHint: 'Higher voltage increases electron momentum (p = √(2meV)), shortening the de Broglie wavelength (λ = h/p). By Bragg’s law, smaller λ produces smaller diffraction angles θ and smaller ring diameters.',
        sourcePage: 60
      }
    ]
  },
  {
    id: 'expt-8-heisenberg-slit',
    number: 8,
    cycle: 2,
    title: 'Verification of Heisenberg’s Uncertainty Principle through Single-Slit Diffraction',
    shortTitle: 'Heisenberg Single-Slit Diffraction',
    aim: 'To observe diffraction pattern due to different single slits, calculate slit widths, calculate uncertainty in momentum, and confirm uncertainty principle.',
    apparatus: [
      'Diode Laser Source (λ = 650 nm)',
      'Kinematic laser mount with X/Y alignment screws',
      'Optical rail with carriage carriers',
      'Single slit carriage cell',
      'Pinhole photodetector with linear translation stage & micrometer',
      'Digital output measurement unit (µA)'
    ],
    pdfPageRange: 'pp. 66–74',
    printedPageRange: 'pp. 63–71',
    formulaSummary: 'd = m λ / sin θm; Δy = d; Δpy = (h/λ) sin(tan⁻¹(a/D)); (d/λ) sin(tan⁻¹(a/D)) = 1 ⇒ Δpy·Δy = h',
    isDemoFunctional: true,
    statusBadge: 'Functional Demo',
    tags: ['Cycle 2', 'Quantum Mechanics', 'Uncertainty Principle', 'Laser Diffraction', 'Wave-Particle Duality'],
    inconsistencies: [
      'Manual p. 73 Table header states "Distance between detector and screen D (mm)", whereas D is distance between slit and detector.'
    ],
    vivaQuestions: [
      {
        id: 'v8-1',
        question: 'How does single-slit diffraction demonstrate Heisenberg’s uncertainty principle?',
        answerHint: 'Constraining photon position horizontally or vertically by narrowing slit width (smaller Δy) forces the diffracted beam to spread out wider, imparting a larger transverse momentum uncertainty (larger Δpy).',
        sourcePage: 64
      }
    ]
  },
  {
    id: 'expt-9-quantum-computing',
    number: 9,
    cycle: 2,
    title: 'Single Qubit states and Quantum gates and Hands-on Simulation on Two-Qubit States',
    shortTitle: 'Qubit States & Quantum Gates',
    aim: 'Introduce single qubits, their visualization on Bloch sphere, effect of Pauli and Hadamard gates, and hands-on simulation of two-qubit CNOT and SWAP gates.',
    apparatus: [
      'PC/Laptop',
      'Python 3 with Qiskit, Qiskit-Aer, and Matplotlib libraries'
    ],
    pdfPageRange: 'pp. 75–86',
    printedPageRange: 'pp. 72–83',
    formulaSummary: '|ψ⟩ = cos(θ/2)|0⟩ + e^(iϕ)sin(θ/2)|1⟩; CNOT|c,t⟩ = |c, t⊕c⟩; SWAP|a,b⟩ = |b,a⟩; Bell: (|00⟩+|11⟩)/√2',
    isDemoFunctional: true,
    statusBadge: 'Functional Demo',
    tags: ['Cycle 2', 'Quantum Computing', 'Bloch Sphere', 'Qiskit', 'Entanglement', 'Quantum Gates'],
    inconsistencies: [
      'AMB-08: Qiskit little-endian basis ordering (|q1 q0⟩) contrasts with standard textbook basis ordering (|q0 q1⟩) used in manual Eq. 7.',
      'AMB-09: Manual p. 74 Observation Table repeats θ = -π/2, ϕ = 0 on rows 3 & 4. Clarified with standard cardinal poles.'
    ],
    vivaQuestions: [
      {
        id: 'v9-1',
        question: 'What is the physical significance of the Bell state (|00⟩ + |11⟩) / √2?',
        answerHint: 'It is a maximally entangled state that cannot be factored into independent single-qubit states (|ψ1⟩ ⊗ |ψ2⟩). Measuring one qubit instantly determines the state of the other.',
        sourcePage: 81
      },
      {
        id: 'v9-2',
        question: 'Can every two-qubit state be represented in terms of single-qubit Bloch sphere angles (θ, ϕ)?',
        answerHint: 'No, only product (separable) states can be decomposed into individual Bloch angles. Entangled states possess non-zero concurrence and their reduced states are mixed states located inside the Bloch sphere.',
        sourcePage: 80
      },
      {
        id: 'v9-3',
        question: 'How do the operations of CNOT and SWAP gates differ in symmetry and entanglement generation?',
        answerHint: 'SWAP is symmetric and merely exchanges the state vectors of two wires without generating entanglement from separable inputs. CNOT is asymmetric, acting conditionally based on control, allowing the creation of entangled states from product superpositions.',
        sourcePage: 83
      }
    ]
  }
];
