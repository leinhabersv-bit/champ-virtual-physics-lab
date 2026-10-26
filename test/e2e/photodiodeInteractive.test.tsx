import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PhotodiodeWorkbench } from '../../src/components/workbenches/PhotodiodeWorkbench';
import { EXPERIMENTS_DATA } from '../../src/data/experiments';

describe('PhotodiodeWorkbench Interactive User Journey (Experiment 6)', () => {
  const expt6Metadata = EXPERIMENTS_DATA.find((e) => e.id === 'expt-6-photodiode')!;

  it('renders workbench, tests reverse bias wiring, lamp distance, shield toggles, records observations across all 3 tables, and verifies graphs', () => {
    const handleBack = () => {};
    const handleViva = () => {};

    render(
      <PhotodiodeWorkbench
        metadata={expt6Metadata}
        onBackToDashboard={handleBack}
        onOpenViva={handleViva}
      />
    );

    // 1. Initial State & Instruments Verification
    expect(screen.getByText(/Study of I–V characteristics of a photodiode/i)).toBeInTheDocument();
    expect(
      screen.getByText(/\[REVERSE-BIAS PHOTOCONDUCTIVE MODE • TRIPLE PROCEDURE\]/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Optoelectronic Breadboard & Photodiode Testbench/i)).toBeInTheDocument();
    expect(screen.getByText(/0-30V DC SUPPLY/i)).toBeInTheDocument();
    expect(screen.getByText(/MICROAMMETER \(0-100µA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/VOLTMETER \(0-10V\)/i)).toBeInTheDocument();
    expect(screen.getByText(/R = 1 kΩ/i)).toBeInTheDocument();
    expect(screen.getAllByText(/PHOTODIODE/i).length).toBeGreaterThanOrEqual(1);

    // 2. Initial Circuit Status
    expect(screen.getByText(/VALID_REVERSE_BIAS/i)).toBeInTheDocument();

    // 3. Test Voltage Controls
    const plus01Btn = screen.getByRole('button', { name: /\+0\.1V/i });
    fireEvent.click(plus01Btn);
    const plus05Btn = screen.getByRole('button', { name: /\+0\.5V/i });
    fireEvent.click(plus05Btn);
    const minus01Btn = screen.getByRole('button', { name: /-0\.1V/i });
    fireEvent.click(minus01Btn);

    // 4. Test Lamp and Shield Controls
    const lampToggleBtn = screen.getByRole('button', { name: /Lamp: ON/i });
    fireEvent.click(lampToggleBtn);
    expect(screen.getByText(/Lamp: OFF/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Lamp: OFF/i }));
    expect(screen.getByText(/Lamp: ON/i)).toBeInTheDocument();

    // Opaque Shield
    const shieldToggleBtn = screen.getByRole('button', { name: /Shield: OFF/i });
    fireEvent.click(shieldToggleBtn);
    expect(screen.getByText(/Shield: ON/i)).toBeInTheDocument();
    expect(screen.getByText(/DARK SHIELD/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Shield: ON/i }));
    expect(screen.getByText(/Shield: OFF/i)).toBeInTheDocument();

    // 5. Test Distance Preset Buttons
    const dist10Btn = screen.getByRole('button', { name: /10 cm \(D₁\)/i });
    fireEvent.click(dist10Btn);
    expect(screen.getByText(/LED LAMP \(10 cm\)/i)).toBeInTheDocument();

    const dist15Btn = screen.getByRole('button', { name: /15 cm \(D₂\)/i });
    fireEvent.click(dist15Btn);
    expect(screen.getByText(/LED LAMP \(15 cm\)/i)).toBeInTheDocument();

    const dist20Btn = screen.getByRole('button', { name: /20 cm/i });
    fireEvent.click(dist20Btn);
    expect(screen.getByText(/LED LAMP \(20 cm\)/i)).toBeInTheDocument();

    // 6. Test Circuit Wiring Validation
    // Test Forward Bias Warning
    const testFwdBtn = screen.getByRole('button', { name: /Test Forward Bias/i });
    fireEvent.click(testFwdBtn);
    expect(screen.getByText(/FORWARD_BIAS_WARNING/i)).toBeInTheDocument();
    expect(screen.getByText(/Polarity Inversion: Photodiode is FORWARD BIASED!/i)).toBeInTheDocument();

    // Test Disconnect (Open circuit)
    const disconnectBtn = screen.getByRole('button', { name: /Disconnect/i });
    fireEvent.click(disconnectBtn);
    expect(screen.getByText(/OPEN_CIRCUIT/i)).toBeInTheDocument();

    // Restore Valid Reverse Bias
    const autoWireBtn = screen.getByRole('button', { name: /Auto-Wire Reverse Bias \(Standard\)/i });
    fireEvent.click(autoWireBtn);
    expect(screen.getByText(/VALID_REVERSE_BIAS/i)).toBeInTheDocument();

    // 7. Test Graph Mode Toggle
    const intensityGraphBtn = screen.getByRole('button', { name: /Photocurrent vs 1\/d²/i });
    fireEvent.click(intensityGraphBtn);
    expect(screen.getByText(/Relative Optical Intensity 1\/d²/i)).toBeInTheDocument();

    const ivCurvesBtn = screen.getByRole('button', { name: /I–V Curves \(3rd Quadrant\)/i });
    fireEvent.click(ivCurvesBtn);
    expect(screen.getByText(/Reverse Voltage V_R \(V\)/i)).toBeInTheDocument();

    // 8. Test Observation Tables: Tabs & Record Reading
    // Tab 1: Dark Current
    const tab1Btn = screen.getByRole('button', { name: /Table 1: Dark Current/i });
    fireEvent.click(tab1Btn);
    expect(screen.getByText(/Table 1\. Readings for Dark Current \(Manual p\. 58\)/i)).toBeInTheDocument();

    const recordBtn1 = screen.getByRole('button', { name: /Record Reading to Table 1 \(Dark\)/i });
    fireEvent.click(recordBtn1);

    // Tab 2: Fixed Distance
    const tab2Btn = screen.getByRole('button', { name: /Table 2: Fixed Distance \(D₁, D₂\)/i });
    fireEvent.click(tab2Btn);
    expect(screen.getByText(/Table 2\. Photocurrent readings at fixed distance \(Manual p\. 59\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Distance D₁ = 10 cm/i)).toBeInTheDocument();
    expect(screen.getByText(/Distance D₂ = 15 cm/i)).toBeInTheDocument();

    const recordBtn2 = screen.getByRole('button', { name: /Record Reading to Table 2 \(Fixed Dist\)/i });
    fireEvent.click(recordBtn2);

    // Tab 3: Fixed Voltage
    const tab3Btn = screen.getByRole('button', { name: /Table 3: Fixed Reverse Voltage/i });
    fireEvent.click(tab3Btn);
    expect(screen.getByText(/Table 3\. Photocurrent readings at fixed reverse voltage \(Manual p\. 59\)/i)).toBeInTheDocument();

    const recordBtn3 = screen.getByRole('button', { name: /Record Reading to Table 3 \(Fixed Volt\)/i });
    fireEvent.click(recordBtn3);

    // 9. Test Theory & Derivations Drawer
    const theoryBtn = screen.getByRole('button', { name: /Theory & Derivations/i });
    fireEvent.click(theoryBtn);
    expect(screen.getByText(/Experiment 6 Mathematical Theory & Formulae/i)).toBeInTheDocument();
    expect(screen.getByText(/Photocurrent: I_ph = I_illum - I_D \(A\)/i)).toBeInTheDocument();
    expect(screen.getByText(/R = I_ph \/ P_opt \(A\/W\)/i)).toBeInTheDocument();
    expect(screen.getByText(/%Δ = \[\(I_illum - I_D\) \/ I_D\] × 100/i)).toBeInTheDocument();

    const closeTheoryBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeTheoryBtn);

    // 10. Test Guided Mode Step Navigation
    expect(screen.getByText(/Step 1: Dark Current Characterization/i)).toBeInTheDocument();
    const nextStepBtn = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextStepBtn);
    expect(screen.getByText(/Step 2: Photocurrent at Fixed Distances/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Step 3: Photocurrent vs Light Intensity\/Distance/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Step 4: Responsivity \(R = Iph \/ Popt\) & Percentage Change/i)).toBeInTheDocument();

    // 11. Test Reset All Tables
    const resetTablesBtn = screen.getByRole('button', { name: /Reset All Tables/i });
    fireEvent.click(resetTablesBtn);
  });
});
