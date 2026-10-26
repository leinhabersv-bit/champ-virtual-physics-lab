import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MercurySpectrometerWorkbench } from '../../src/components/workbenches/MercurySpectrometerWorkbench';
import { EXPERIMENTS_DATA } from '../../src/data/experiments';

describe('MercurySpectrometerWorkbench Interactive User Journey (Experiment 2)', () => {
  const expt2Metadata = EXPERIMENTS_DATA.find((e) => e.id === 'expt-2-mercury-grating')!;

  it('renders workbench, interacts with spectrometer, records spectral lines, and verifies wavelengths', () => {
    const handleBack = () => {};
    const handleViva = () => {};

    render(
      <MercurySpectrometerWorkbench
        metadata={expt2Metadata}
        onBackToDashboard={handleBack}
        onOpenViva={handleViva}
      />
    );

    // 1. Initial State & Instruments Verification
    expect(screen.getByText(/Determining the wavelength composition of spectral lines/i)).toBeInTheDocument();
    expect(screen.getByText(/Optical Spectrometer & Transmission Grating Bench/i)).toBeInTheDocument();
    expect(screen.getByText(/Telescope Eyepiece Reticle \(4° FOV\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Vernier Magnifier Windows \(LC = 1'\)/i)).toBeInTheDocument();
    expect(screen.getByText(/15,000 LPI \(Standard\)/i)).toBeInTheDocument();

    // 2. Test Telescope Controls & Vernier Readings
    // Initial angle is at direct ray (180°)
    expect(screen.getAllByText(/180.00°/i).length).toBeGreaterThanOrEqual(1);

    // Step 1 arcminute with tangent screw
    const plus1MinBtn = screen.getByRole('button', { name: /\+1' \(LC\)/i });
    fireEvent.click(plus1MinBtn);

    // Test Fast Target Spectral Line Selector
    // Click Left Green Line (L-Gre)
    const leftGreenBtn = screen.getByTitle(/Turn to Left 1st Order Green/i);
    fireEvent.click(leftGreenBtn);

    // Eyepiece reticle should now indicate Green line centered
    expect(screen.getByText(/Centered: Green \(1st Order Left\)/i)).toBeInTheDocument();

    // Record Left button should appear
    const recordLeftBtn = screen.getByRole('button', { name: /Record Left \(a\)/i });
    fireEvent.click(recordLeftBtn);

    // Now turn to Right Green Line (R-Gre)
    const rightGreenBtn = screen.getByTitle(/Turn to Right 1st Order Green/i);
    fireEvent.click(rightGreenBtn);
    expect(screen.getByText(/Centered: Green \(1st Order Right\)/i)).toBeInTheDocument();

    const recordRightBtn = screen.getByRole('button', { name: /Record Right \(b\)/i });
    fireEvent.click(recordRightBtn);

    // 3. Test Telescope Clamp Toggle
    const clampBtn = screen.getByRole('button', { name: /Clamp: UNCLAMPED/i });
    fireEvent.click(clampBtn);
    expect(screen.getByText(/Clamp: LOCKED/i)).toBeInTheDocument();

    // Unclamp
    fireEvent.click(screen.getByRole('button', { name: /Clamp: LOCKED/i }));
    expect(screen.getByText(/Clamp: UNCLAMPED/i)).toBeInTheDocument();

    // 4. Test Step-by-Step Calculations Drawer
    const calcToggleBtn = screen.getByRole('button', { name: /Show Steps/i });
    fireEvent.click(calcToggleBtn);
    expect(screen.getByText(/1\. Least Count \(LC\) of Spectrometer/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Grating Element \(e \+ d\)/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Diffraction Angle Modular Arithmetic/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Wavelength Calculation/i)).toBeInTheDocument();

    // 5. Test Auto-Measure All 4 Lines (Full 8 rows table completion)
    const autoMeasureBtn = screen.getByRole('button', { name: /Auto-Measure All 4 Lines/i });
    fireEvent.click(autoMeasureBtn);

    // Verify all 4 spectral colors in table
    expect(screen.getAllByText(/Blue/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Green/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Yellow/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Red/i).length).toBeGreaterThanOrEqual(1);

    // Verify Verniers V1 and V2 are represented
    expect(screen.getAllByText(/V1/i).length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText(/V2/i).length).toBeGreaterThanOrEqual(4);

    // Verify manual standard reference wavelengths from p. 36 & p. 37:
    // Blue: 4693 Å, Green: 5461 Å, Yellow: 5770 Å, Red: 6238 Å
    expect(screen.getAllByText(/4693 Å/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/5461 Å/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/5770 Å/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/6238 Å/i).length).toBeGreaterThanOrEqual(1);

    // Verify Master Results Summary table exists
    expect(
      screen.getByText(/Master Results Summary: Calculated Wavelengths vs Standard Values/i)
    ).toBeInTheDocument();
  });
});
