import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SolarCellWorkbench } from '../../src/components/workbenches/SolarCellWorkbench';
import { LedPlanckWorkbench } from '../../src/components/workbenches/LedPlanckWorkbench';
import { PhotodiodeWorkbench } from '../../src/components/workbenches/PhotodiodeWorkbench';
import { EXPERIMENTS_DATA } from '../../src/data/experiments';

describe('Beginner Journeys & Circuit Diagrams (Experiments 1, 3, 6)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const expt1Metadata = EXPERIMENTS_DATA.find((e) => e.id === 'expt-1-solar-cell')!;
  const expt3Metadata = EXPERIMENTS_DATA.find((e) => e.id === 'expt-3-led-planck')!;
  const expt6Metadata = EXPERIMENTS_DATA.find((e) => e.id === 'expt-6-photodiode')!;

  describe('Experiment 1: Solar Cell Renewable Energy Circuit', () => {
    it('walks through beginner mode, checks polarity, switches diagrams, and exercises connection sequence', () => {
      render(
        <SolarCellWorkbench
          metadata={expt1Metadata}
          onBackToDashboard={() => {}}
          onOpenViva={() => {}}
        />
      );

      // 1. Beginner Mode & 5 Pillars
      expect(screen.getByRole('button', { name: /Beginner/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/WHAT TO DO/i)).toBeInTheDocument();
      expect(screen.getByText(/WHERE TO OPERATE/i)).toBeInTheDocument();
      expect(screen.getByText(/WHY IT MATTERS/i)).toBeInTheDocument();
      expect(screen.getByText(/WHAT YOU SHOULD OBSERVE/i)).toBeInTheDocument();
      expect(screen.getByText(/COMMON PITFALLS/i)).toBeInTheDocument();

      // Step 1: Component identification
      expect(screen.getByText(/Instrument Identification & Terminal Labels/i)).toBeInTheDocument();
      const checkBtn = screen.getByRole('button', { name: /Check Action/i });
      fireEvent.click(checkBtn);
      expect(screen.getByText(/Physical Step Verified!/i)).toBeInTheDocument();

      // Unlock and advance to Step 2
      const nextBtn = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextBtn);
      expect(screen.getByText(/Lamp Alignment & Open-Circuit Voltage \(Voc at 25 cm\)/i)).toBeInTheDocument();

      // 2. View Circuit Diagram Dropdown & Collapsible Panel
      const diagramSelect = screen.getByRole('combobox', { name: /View Circuit Diagram/i });
      expect(diagramSelect).toBeInTheDocument();

      // Select Series Array diagram
      fireEvent.change(diagramSelect, { target: { value: 'series_array' } });
      expect(screen.getAllByText(/Table 3: Voltage Addition/i).length).toBeGreaterThanOrEqual(1);

      // Select Parallel Array diagram
      fireEvent.change(diagramSelect, { target: { value: 'parallel_array' } });
      expect(screen.getAllByText(/Table 4: Current Addition/i).length).toBeGreaterThanOrEqual(1);

      // Select Procedure B Appliance diagram
      fireEvent.change(diagramSelect, { target: { value: 'appliance_procedure_b' } });
      expect(screen.getAllByText(/Procedure B: Real-World Direct-Drive Appliances/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/220 Ω Limiter/i)).toBeInTheDocument();

      // Switch back to Single Cell Characterization
      fireEvent.change(diagramSelect, { target: { value: 'single_cell' } });
      expect(screen.getAllByText(/Single Cell Characterization/i).length).toBeGreaterThanOrEqual(1);

      // 3. Show Connection Sequence Feature
      const showSeqBtn = screen.getByRole('button', { name: /Show Connection Sequence/i });
      fireEvent.click(showSeqBtn);

      // Verify connection sequence HUD
      expect(screen.getByText(/Connection Sequence Guide/i)).toBeInTheDocument();
      expect(screen.getByText(/Wire 1: Positive Ammeter Feed/i)).toBeInTheDocument();
      expect(screen.getByText(/Red Anode \(\+\) to Red Meter \(\+\)/i)).toBeInTheDocument();

      // Step through connection sequence
      const nextSeqBtn = screen.getByRole('button', { name: /Next Wire/i });
      fireEvent.click(nextSeqBtn);
      expect(screen.getByText(/Wire 2: Series Current Return to Load/i)).toBeInTheDocument();

      // Exit connection sequence
      const exitSeqBtn = screen.getByRole('button', { name: /Close Sequence/i });
      fireEvent.click(exitSeqBtn);
      expect(screen.queryByText(/Connection Sequence Guide/i)).not.toBeInTheDocument();

      // 4. Polarity & Mistake Detection in Beginner Mode
      // Reverse wire polarity manually: disconnect load or reverse
      const disconnectBtn = screen.getByTitle('Clear All Wires');
      fireEvent.click(disconnectBtn);
      expect(screen.getByText(/Open Circuit: Wires do not form a complete closed loop/i)).toBeInTheDocument();

      // Quick wire Voc helper
      const wireVocBtn = screen.getByRole('button', { name: /Wire Voc/i });
      fireEvent.click(wireVocBtn);
      expect(screen.getByText(/Open-Circuit \(Voc\) Measurement/i)).toBeInTheDocument();

      // Distance variation
      const dist12Btn = screen.getByRole('button', { name: /Least Dist \(12cm\)/i });
      fireEvent.click(dist12Btn);
      expect(screen.getAllByText(/12 cm/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Experiment 3: Planck’s Constant Using Semiconductor LEDs', () => {
    it('guides student through LED circuit, color selection, linear fit, and Planck derivation', () => {
      render(
        <LedPlanckWorkbench
          metadata={expt3Metadata}
          onBackToDashboard={() => {}}
          onOpenViva={() => {}}
        />
      );

      // 1. Beginner Mode & Step 1
      expect(screen.getByRole('button', { name: /Beginner/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/Instrument Identification & Terminal Polarity Check/i)).toBeInTheDocument();

      // 2. View Circuit Diagram & Sequence Stepper
      const diagramSelect = screen.getByRole('combobox', { name: /View Circuit Diagram/i });
      expect(diagramSelect).toBeInTheDocument();
      expect(screen.getByText(/Figure 2, p. 40/i)).toBeInTheDocument();

      const showSeqBtn = screen.getByRole('button', { name: /Show Connection Sequence/i });
      fireEvent.click(showSeqBtn);
      expect(screen.getByText(/Wire 1: Supply to Potentiometer \(\+\)/i)).toBeInTheDocument();
      expect(screen.getByText(/DC \(\+\) to Pot High/i)).toBeInTheDocument();

      // Step forward to Wire 5 (LED Anode)
      const nextSeqBtn = screen.getByRole('button', { name: /Next Wire/i });
      fireEvent.click(nextSeqBtn); // Wire 2
      fireEvent.click(nextSeqBtn); // Wire 3
      fireEvent.click(nextSeqBtn); // Wire 4
      fireEvent.click(nextSeqBtn); // Wire 5
      expect(screen.getByText(/Wire 5: Series Ammeter to LED \(\+\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Crucial: Ammeter out to Anode \(\+\)/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Close Sequence/i }));

      // 3. Multi-LED Color Selection & Polarity
      const yellowBtn = screen.getByRole('button', { name: /Yellow/i });
      fireEvent.click(yellowBtn);
      expect(screen.getAllByText(/590 nm/i).length).toBeGreaterThanOrEqual(1);

      const greenBtn = screen.getByRole('button', { name: /Green/i });
      fireEvent.click(greenBtn);
      expect(screen.getAllByText(/525 nm/i).length).toBeGreaterThanOrEqual(1);

      const blueBtn = screen.getByRole('button', { name: /Blue/i });
      fireEvent.click(blueBtn);
      expect(screen.getAllByText(/470 nm/i).length).toBeGreaterThanOrEqual(1);

      // 4. Test Reverse Bias Mistake Detection
      const flipPolarityBtn = screen.getByRole('button', { name: /Flip LED Polarity/i });
      fireEvent.click(flipPolarityBtn);
      expect(screen.getByText(/LED is reverse-biased/i)).toBeInTheDocument();

      // Restore Forward Bias
      fireEvent.click(flipPolarityBtn);
      expect(screen.getByText(/Circuit properly wired/i)).toBeInTheDocument();

      // 5. Linear Tangent Fitting & Slope h Derivation
      const tab2Btn = screen.getByRole('button', { name: /Table 2: Planck's Constant/i });
      fireEvent.click(tab2Btn);
      expect(screen.getAllByText(/Planck's Constant from each LED/i).length).toBeGreaterThanOrEqual(1);

      // Switch to Planck Linear Regression Graph
      const planckGraphBtn = screen.getByRole('button', { name: /VB vs 1\/λ/i });
      fireEvent.click(planckGraphBtn);
      expect(screen.getByText(/VB vs 1\/λ \(Planck Slope\)/i)).toBeInTheDocument();
    });
  });

  describe('Experiment 6: Photodiode I–V Characteristics', () => {
    it('guides student through reverse bias, dark current shielding, distance sweep, and responsivity', () => {
      render(
        <PhotodiodeWorkbench
          metadata={expt6Metadata}
          onBackToDashboard={() => {}}
          onOpenViva={() => {}}
        />
      );

      // 1. Beginner Mode & Step 1
      expect(screen.getByRole('button', { name: /Beginner/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/Instrument Identification & Reverse-Bias Terminals/i)).toBeInTheDocument();

      // Check Action Step 1
      const checkBtn = screen.getByRole('button', { name: /Check Action/i });
      fireEvent.click(checkBtn);
      expect(screen.getByText(/Physical Step Verified!/i)).toBeInTheDocument();

      // 2. View Circuit Diagram Dropdown & Shield Synchronization
      const diagramSelect = screen.getByRole('combobox', { name: /View Circuit Diagram/i });
      expect(diagramSelect).toBeInTheDocument();

      // Select Dark Current Diagram
      fireEvent.change(diagramSelect, { target: { value: 'photodiode_dark_shield' } });
      expect(screen.getAllByText(/Dark Current Measurement \(Shielded Condition\)/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /Shield: ON/i })).toBeInTheDocument();

      // Select Reverse Bias Standard Diagram
      fireEvent.change(diagramSelect, { target: { value: 'photodiode_reverse_bias' } });
      expect(screen.getAllByText(/Standard Reverse-Bias Characterization/i).length).toBeGreaterThanOrEqual(1);

      // 3. Connection Sequence Guide
      const showSeqBtn = screen.getByRole('button', { name: /Show Connection Sequence/i });
      fireEvent.click(showSeqBtn);
      expect(screen.getByText(/Connection Sequence Guide/i)).toBeInTheDocument();
      expect(screen.getByText(/Wire 1: Positive Rail to Resistor/i)).toBeInTheDocument();
      expect(screen.getByText(/0-30V DC Supply \(\+\)/i)).toBeInTheDocument();

      // Wire 3: Photodiode Reverse Bias Polarity Check
      const nextSeqBtn = screen.getByRole('button', { name: /Next Wire/i });
      fireEvent.click(nextSeqBtn); // Wire 2
      fireEvent.click(nextSeqBtn); // Wire 3
      expect(screen.getByText(/Wire 3: Series Ammeter to Cathode/i)).toBeInTheDocument();
      expect(screen.getByText(/Strict: Ammeter \(\-\) to Cathode K \(\-\)/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Close Sequence/i }));

      // 4. Mistake Detection: Forward Bias Polarity Error
      const testFwdBtn = screen.getByRole('button', { name: /Test Forward Bias/i });
      fireEvent.click(testFwdBtn);
      expect(screen.getByText(/FORWARD_BIAS_WARNING/i)).toBeInTheDocument();
      expect(screen.getByText(/Polarity Inversion: Photodiode is FORWARD BIASED!/i)).toBeInTheDocument();

      // Restore Standard Reverse Bias
      const autoWireBtn = screen.getByRole('button', { name: /Auto-Wire Reverse Bias \(Standard\)/i });
      fireEvent.click(autoWireBtn);
      expect(screen.getByText(/VALID_REVERSE_BIAS/i)).toBeInTheDocument();

      // 5. Dark Current vs Illuminated Current Verification
      const shieldBtn = screen.getByRole('button', { name: /Shield: OFF/i });
      fireEvent.click(shieldBtn);
      expect(screen.getByText(/Shield: ON/i)).toBeInTheDocument();

      // In dark condition, current is minimal (< 1 µA)
      expect(screen.getAllByText(/DARK SHIELD/i).length).toBeGreaterThanOrEqual(1);

      // Turn shield OFF and test distance presets
      fireEvent.click(screen.getByRole('button', { name: /Shield: ON/i }));
      const dist10Btn = screen.getByRole('button', { name: /10 cm \(D₁\)/i });
      fireEvent.click(dist10Btn);
      expect(screen.getByText(/LED LAMP \(10 cm\)/i)).toBeInTheDocument();

      // 6. Optical Responsivity & Formulas
      const theoryBtn = screen.getByRole('button', { name: /Theory & Derivations/i });
      fireEvent.click(theoryBtn);
      expect(screen.getByText(/Responsivity \(R\)/i)).toBeInTheDocument();
      expect(screen.getByText(/R = I_ph \/ P_opt \(A\/W\)/i)).toBeInTheDocument();
    });
  });
});
