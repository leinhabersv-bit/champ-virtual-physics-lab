import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SodiumSpectrometerWorkbench } from '../../src/components/workbenches/SodiumSpectrometerWorkbench';
import { EXPERIMENTS_DATA } from '../../src/data/experiments';

describe('SodiumSpectrometerWorkbench Interactive User Journey (Experiment 5)', () => {
  const expt5Metadata = EXPERIMENTS_DATA.find((e) => e.id === 'expt-5-sodium-grating')!;

  it('renders workbench, tests table incidence and telescope rotations, extremum turning point, records observations, and verifies yellow doublet wavelengths', () => {
    const handleBack = () => {};
    const handleViva = () => {};

    render(
      <SodiumSpectrometerWorkbench
        metadata={expt5Metadata}
        onBackToDashboard={handleBack}
        onOpenViva={handleViva}
      />
    );

    // 1. Initial State & Instruments Verification
    expect(
      screen.getByText(/Wavelength composition of spectral lines of visible light source \(Na Lamp\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/\[MINIMUM DEVIATION METHOD • VALIDATED OPTICAL PHYSICS\]/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Telescope Eyepiece Reticle \(4° Optical FOV\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Vernier 1 \(V₁\) Magnifying Loupe/i)).toBeInTheDocument();
    expect(screen.getByText(/Vernier 2 \(V₂\) Magnifying Loupe/i)).toBeInTheDocument();

    // 2. Optical Hardware Controls
    // Toggle lamp state
    const lampToggleBtn = screen.getByRole('button', { name: /Lamp: ON/i });
    fireEvent.click(lampToggleBtn);
    expect(screen.getByText(/Lamp: OFF/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Lamp: OFF/i }));
    expect(screen.getByText(/Lamp: ON/i)).toBeInTheDocument();

    // 3. Prism Table Rotation & Minimum Deviation Turning Point
    // Check initial extremum state
    expect(screen.getByText(/STATIONARY POINT \(Dm\)/i)).toBeInTheDocument();

    // Adjust table angle away from extremum
    const plus1DegTableBtn = screen.getByRole('button', { name: /\+1\.0°/i });
    fireEvent.click(plus1DegTableBtn);
    expect(screen.getByText(/Rotating towards extremum/i)).toBeInTheDocument();

    // Return to extremum using minus button
    const minus1DegTableBtn = screen.getByRole('button', { name: /-1\.0°/i });
    fireEvent.click(minus1DegTableBtn);
    expect(screen.getByText(/STATIONARY POINT \(Dm\)/i)).toBeInTheDocument();

    // 4. Telescope Fine Rotation & Clamping
    const clampBtn = screen.getByRole('button', { name: /UNCLAMPED/i });
    fireEvent.click(clampBtn);
    expect(screen.getByText(/CLAMPED/i)).toBeInTheDocument();

    // Unclamp
    fireEvent.click(screen.getByRole('button', { name: /CLAMPED/i }));
    expect(screen.getByText(/UNCLAMPED/i)).toBeInTheDocument();

    // Fine tangent screw test (+1' LC)
    const plus1MinBtn = screen.getByRole('button', { name: /\+1' \(LC\)/i });
    fireEvent.click(plus1MinBtn);

    // 5. Test Auto-Alignment for Left and Right Minimum Deviation
    const alignLeftBtn = screen.getByRole('button', { name: /Align Left Min Deviation \(Y1\)/i });
    fireEvent.click(alignLeftBtn);
    expect(screen.getByText(/Centered: Yellow 1 \(D₁\)/i)).toBeInTheDocument();

    // Record Left Yellow 1 reading
    const recordLeftY1Btn = screen.getByRole('button', { name: /Record Yellow 1 \(LEFT\)/i });
    fireEvent.click(recordLeftY1Btn);

    // Align and record Right Minimum Deviation
    const alignRightBtn = screen.getByRole('button', { name: /Align Right Min Deviation \(Y1\)/i });
    fireEvent.click(alignRightBtn);
    expect(screen.getByText(/Centered: Yellow 1 \(D₁\)/i)).toBeInTheDocument();

    const recordRightY1Btn = screen.getByRole('button', { name: /Record Yellow 1 \(RIGHT\)/i });
    fireEvent.click(recordRightY1Btn);

    // 6. Test Derivations & Calculations Drawer
    const viewDerivationsBtn = screen.getByRole('button', { name: /Theory & Derivations/i });
    fireEvent.click(viewDerivationsBtn);
    expect(
      screen.getByText(/Experiment 5 Mathematical Theory & Minimum Deviation Condition/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Oblique Incidence Grating Equation/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Minimum Deviation Condition:/i)
    ).toBeInTheDocument();

    // Close derivations drawer
    const closeDrawerBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeDrawerBtn);

    // 7. Verify Manual Observation Table & Results
    expect(
      screen.getByText(/Observation Table: Determination of Angle of Minimum Deviation for 1st Order Spectrum/i)
    ).toBeInTheDocument();

    // Verify Verniers V1 and V2 are represented
    expect(screen.getAllByText(/V1/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/V2/i).length).toBeGreaterThanOrEqual(2);

    // Verify Master Results Summary table exists with standard wavelengths
    expect(
      screen.getByText(/Result: Calculated Wavelengths of Sodium Doublet Spectral Lines/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/5896 Å/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/5890 Å/i).length).toBeGreaterThanOrEqual(1);

    // 8. Test Guided Mode Step Navigation
    expect(screen.getByText(/Step 1: Initial Spectrometer Adjustments/i)).toBeInTheDocument();
    const nextStepBtn = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextStepBtn);
    expect(screen.getByText(/Step 2: Observe Direct Beam at 180°/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Step 3: Rotate Prism Table to Locate Minimum Deviation Turning Point/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Step 4: Record Verniers V1 & V2 on Left & Right Sides/i)).toBeInTheDocument();

    // 9. Test Reset Observations
    const resetBtn = screen.getByRole('button', { name: /Reset Theoretical/i });
    fireEvent.click(resetBtn);
  });
});
