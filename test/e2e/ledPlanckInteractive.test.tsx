import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LedPlanckWorkbench } from '../../src/components/workbenches/LedPlanckWorkbench';
import { EXPERIMENTS_DATA } from '../../src/data/experiments';

describe('LedPlanckWorkbench Interactive User Journey (Experiment 3)', () => {
  const expt3Metadata = EXPERIMENTS_DATA.find((e) => e.id === 'expt-3-led-planck')!;

  it('renders workbench, tests wiring, adjusts potentiometer, fits linear tangent, and verifies Planck constant calculations', () => {
    const handleBack = () => {};
    const handleViva = () => {};

    render(
      <LedPlanckWorkbench
        metadata={expt3Metadata}
        onBackToDashboard={handleBack}
        onOpenViva={handleViva}
      />
    );

    // 1. Initial State & Apparatus Title
    expect(screen.getByText(/Determination of the fundamental constant of quantum physics/i)).toBeInTheDocument();
    expect(screen.getByText(/Semiconductor Diode Circuit & Breadboard Netlist/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SERIES AMMETER/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/3V REGULATED/i)).toBeInTheDocument();

    // Netlist status should initially be valid forward bias
    expect(screen.getByText(/Circuit properly wired/i)).toBeInTheDocument();

    // 2. Limiting Resistor & Supply Controls
    const r10Btn = screen.getByRole('button', { name: /10Ω/i });
    const r47Btn = screen.getByRole('button', { name: /47Ω/i });
    const r100Btn = screen.getByRole('button', { name: /100Ω/i });
    expect(r10Btn).toBeInTheDocument();
    expect(r47Btn).toBeInTheDocument();
    expect(r100Btn).toBeInTheDocument();

    // Switch resistor to 100 ohm
    fireEvent.click(r100Btn);

    // Toggle 3V Power Supply
    const supplyBtn = screen.getByRole('button', { name: /3V Supply: ON/i });
    fireEvent.click(supplyBtn);
    expect(screen.getByText(/3V Supply: OFF/i)).toBeInTheDocument();
    expect(screen.getByText(/Power supply OFF/i)).toBeInTheDocument();

    // Turn supply back ON
    fireEvent.click(screen.getByRole('button', { name: /3V Supply: OFF/i }));
    expect(screen.getByText(/Circuit properly wired/i)).toBeInTheDocument();

    // 3. LED Color Selection & Wavelength Verification
    // Switch to Blue LED (470 nm)
    const blueLedBtn = screen.getByRole('button', { name: /Blue/i });
    fireEvent.click(blueLedBtn);
    expect(screen.getAllByText(/470 nm/i).length).toBeGreaterThanOrEqual(1);

    // Switch to Green LED (565 nm)
    const greenLedBtn = screen.getByRole('button', { name: /Green/i });
    fireEvent.click(greenLedBtn);
    expect(screen.getAllByText(/565 nm/i).length).toBeGreaterThanOrEqual(1);

    // Switch to Yellow LED (500 nm)
    const yellowLedBtn = screen.getByRole('button', { name: /Yellow/i });
    fireEvent.click(yellowLedBtn);
    expect(screen.getAllByText(/500 nm/i).length).toBeGreaterThanOrEqual(1);

    // Switch back to Red LED (660 nm)
    const redLedBtn = screen.getByRole('button', { name: /Red/i });
    fireEvent.click(redLedBtn);
    expect(screen.getAllByText(/660 nm/i).length).toBeGreaterThanOrEqual(1);

    // 4. Potentiometer Dial Adjustment
    const potSlider = screen.getByRole('slider', { name: /Adjust potentiometer voltage/i });
    expect(potSlider).toBeInTheDocument();
    fireEvent.change(potSlider, { target: { value: '0.85' } });

    // Step buttons: +1% and -1%
    const plus1Btn = screen.getByRole('button', { name: /\+1%/i });
    fireEvent.click(plus1Btn);
    const minus1Btn = screen.getByRole('button', { name: /-1%/i });
    fireEvent.click(minus1Btn);

    // 5. Test Circuit Netlist Malfunctions: Polarity Flip & Clear Wires
    const flipPolarityBtn = screen.getByRole('button', { name: /Flip LED Polarity/i });
    fireEvent.click(flipPolarityBtn);
    expect(screen.getByText(/reverse-biased/i)).toBeInTheDocument();

    // Flip back
    fireEvent.click(flipPolarityBtn);
    expect(screen.getByText(/Circuit properly wired/i)).toBeInTheDocument();

    // Clear wires -> Disconnected
    const clearWiresBtn = screen.getByTitle(/Clear Wires/i);
    fireEvent.click(clearWiresBtn);
    expect(screen.getByText(/Circuit is open/i)).toBeInTheDocument();

    // Auto-Wire Normal -> Restored
    const autoWireBtn = screen.getByRole('button', { name: /Auto-Wire Normal/i });
    fireEvent.click(autoWireBtn);
    expect(screen.getByText(/Circuit properly wired/i)).toBeInTheDocument();

    // 6. Observation Tables Tab Navigation
    const table1Tab = screen.getByRole('button', { name: /Table 1: I-V Data Collection/i });
    const table2Tab = screen.getByRole('button', { name: /Table 2: Planck's Constant/i });
    expect(table1Tab).toBeInTheDocument();
    expect(table2Tab).toBeInTheDocument();

    // Switch to Table 2 Tab
    fireEvent.click(table2Tab);
    expect(screen.getByText(/Table 2\. Planck's Constant from each LED/i)).toBeInTheDocument();
    expect(screen.getAllByText(/6.626/i).length).toBeGreaterThanOrEqual(1);

    // Switch back to Table 1 Tab
    fireEvent.click(table1Tab);
    expect(screen.getByText(/Table 1\. Data Collection for I-V Curve of the LEDs/i)).toBeInTheDocument();

    // 7. Linear Fit Tangent & Barrier Extrapolation
    const applyVbBtn = screen.getByRole('button', { name: /Apply VB .* to Table 2/i });
    expect(applyVbBtn).toBeInTheDocument();
    fireEvent.click(applyVbBtn);

    // 8. Sample Calculation Sheet Drawer
    const showStepsBtn = screen.getByRole('button', { name: /Show Steps/i });
    fireEvent.click(showStepsBtn);
    expect(screen.getByText(/1. Direct Planck Constant Formula/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Graphical Slope Formula/i)).toBeInTheDocument();

    // Close calculation sheet drawer
    const hideStepsBtn = screen.getByRole('button', { name: /Hide Steps/i });
    fireEvent.click(hideStepsBtn);

    // 9. Guided Mode Step Progression
    const nextStepBtn = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextStepBtn); // Step 2
    expect(screen.getByText(/Step 2: Vary Potentiometer Voltage & Log Diode I-V Readings/i)).toBeInTheDocument();
    fireEvent.click(nextStepBtn); // Step 3
    expect(screen.getByText(/Step 3: Fit Linear Tangent to Conduction Region to Find Barrier Potential VB/i)).toBeInTheDocument();
    fireEvent.click(nextStepBtn); // Step 4
    expect(screen.getByText(/Step 4: Repeat for 4 LEDs & Determine Planck Constant h from Slope/i)).toBeInTheDocument();
  });
});
