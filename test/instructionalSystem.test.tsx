import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GuidedLabPanel,
  SetupDiagramPanel,
  solarCellConfigurations,
} from '../src/components/instructional';
import { ExperimentProcedure } from '../src/types/instructional';

describe('Reusable Instructional & Guided Lab System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockProcedure: ExperimentProcedure = {
    experimentId: 'test-procedure',
    experimentNumber: 1,
    experimentTitle: 'Test Solar Cell Procedure',
    sourcePages: 'pp. 22–32',
    rubric: { labPerformanceMarks: 7, vivaMarks: 3, totalMarks: 10 },
    configurations: solarCellConfigurations,
    steps: [
      {
        id: 'step_test_1',
        number: 1,
        title: 'Action Step 1: Measure Open-Circuit Voltage Voc',
        shortTask: 'Set lamp distance and measure Voc without load.',
        targetElementId: 'distance-slider',
        apparatusHighlightId: 'vm',
        what: 'Switch on the 5W halogen lamp and place it at exactly 25 cm from the solar panel.',
        where: 'Look at the illumination ruler and digital voltmeter.',
        why: 'Voc is the maximum possible voltage generated under zero current draw.',
        observe: 'The digital voltmeter displays a stable reading of approximately 1.70 to 1.80 V.',
        mistakes: 'Connecting an ammeter in parallel or keeping the lamp turned off.',
        hint: 'Set distance to 25 cm and ensure no load resistance is connected across terminals.',
        validate: (state: any) => {
          if (!state?.lampOn) {
            return { isComplete: false, feedback: 'Turn on the 5W lamp first to illuminate the solar panel.' };
          }
          if (state?.distance !== 0.25) {
            return { isComplete: false, feedback: 'Set illumination distance to exactly 25 cm (0.25 m).' };
          }
          return { isComplete: true, feedback: 'Voc measured accurately at 25 cm with 10 MΩ high-impedance voltmeter.' };
        },
      },
      {
        id: 'step_test_2',
        number: 2,
        title: 'Action Step 2: Measure Short-Circuit Current Isc',
        shortTask: 'Connect ammeter in series directly across solar cell.',
        targetElementId: 'amm',
        apparatusHighlightId: 'amm',
        what: 'Connect the microammeter directly across the solar panel terminals.',
        where: 'Digital microammeter scale.',
        why: 'Isc provides the maximum photo-generated current under zero external voltage.',
        observe: 'Current displays between 15 and 25 mA depending on distance.',
        mistakes: 'Leaving load resistance connected or using reversed polarity.',
        hint: 'Directly short the solar cell terminals through the current meter.',
        validate: (state: any) => {
          if (!state?.lampOn) return { isComplete: false, feedback: 'Turn on lamp.' };
          return { isComplete: true, feedback: 'Isc measured successfully.' };
        },
      },
    ],
  };

  describe('1. GuidedLabPanel Mode Switching & Persistence', () => {
    it('initializes in Beginner mode and displays 5 core instructional pillars', () => {
      render(
        <GuidedLabPanel
          procedure={mockProcedure}
          currentState={{ lampOn: false, distance: 0.5, loadResistance: 1000 }}
        />
      );

      // Check header and mode
      expect(screen.getByText(/Guided Laboratory Protocol/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Beginner/i })).toHaveAttribute('aria-pressed', 'true');

      // Verify 5 pillars exist
      expect(screen.getByText(/WHAT TO DO/i)).toBeInTheDocument();
      expect(screen.getByText(/WHERE TO OPERATE/i)).toBeInTheDocument();
      expect(screen.getByText(/WHY IT MATTERS/i)).toBeInTheDocument();
      expect(screen.getByText(/WHAT YOU SHOULD OBSERVE/i)).toBeInTheDocument();
      expect(screen.getByText(/COMMON PITFALLS/i)).toBeInTheDocument();
    });

    it('switches between Beginner, Practice, and Exam modes cleanly', () => {
      render(
        <GuidedLabPanel
          procedure={mockProcedure}
          currentState={{ lampOn: true, distance: 0.25, loadResistance: 1000 }}
        />
      );

      // Switch to Practice Mode
      const practiceBtn = screen.getByRole('button', { name: /Practice/i });
      fireEvent.click(practiceBtn);
      expect(practiceBtn).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/Practice Mode: Complete procedural actions in sequence/i)).toBeInTheDocument();

      // Switch to Exam Mode
      const examBtn = screen.getByRole('button', { name: /Exam/i });
      fireEvent.click(examBtn);
      expect(examBtn).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/Exam Mode: Independent Laboratory Evaluation/i)).toBeInTheDocument();
      expect(screen.getAllByText(/7 Marks/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/3 Marks/i).length).toBeGreaterThanOrEqual(1);

      // Check localStorage persistence
      const saved = localStorage.getItem(`champ_guided_progress_v1_${mockProcedure.experimentId}`);
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed.mode).toBe('exam');
    });
  });

  describe('2. Strict Physical State Validation & Navigation', () => {
    it('rejects step completion when simulator state is invalid and prevents skipping forward in Beginner mode', () => {
      const handleStepChange = vi.fn();

      // State is INVALID: lamp is OFF and distance is 50cm (needs 25cm and ON)
      const invalidState = { lampOn: false, distance: 0.50, loadResistance: 1000 };

      render(
        <GuidedLabPanel
          procedure={mockProcedure}
          currentState={invalidState}
          onStepChange={handleStepChange}
        />
      );

      // Click "Check Action"
      const checkBtn = screen.getByRole('button', { name: /Check Action/i });
      fireEvent.click(checkBtn);

      // Verification banner should display failure feedback
      expect(screen.getByText(/Step Criteria Incomplete/i)).toBeInTheDocument();
      expect(screen.getByText(/Turn on the 5W lamp first/i)).toBeInTheDocument();

      // Clicking "Next" must NOT advance when incomplete in beginner mode
      const nextBtn = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextBtn);

      // Still on step 1
      expect(screen.getAllByText(/Action Step 1/i).length).toBeGreaterThanOrEqual(1);
    });

    it('validates successfully when physical simulator state matches criteria and unlocks Next', () => {
      const handleStepChange = vi.fn();

      // State is VALID for step 1: lamp is ON, distance is 25 cm
      const validState = { lampOn: true, distance: 0.25, loadResistance: 1000 };

      render(
        <GuidedLabPanel
          procedure={mockProcedure}
          currentState={validState}
          onStepChange={handleStepChange}
        />
      );

      // Click "Check Action"
      const checkBtn = screen.getByRole('button', { name: /Check Action/i });
      fireEvent.click(checkBtn);

      // Feedback confirms physical step verified
      expect(screen.getByText(/Physical Step Verified!/i)).toBeInTheDocument();
      expect(screen.getByText(/Voc measured accurately at 25 cm/i)).toBeInTheDocument();
      expect(screen.getByText(/Validated Complete/i)).toBeInTheDocument();

      // Now click "Next" advances to step 2
      const nextBtn = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextBtn);

      // Now on step 2
      expect(screen.getAllByText(/Action Step 2/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Short-Circuit Current/i).length).toBeGreaterThanOrEqual(1);

      // Back button navigates back to step 1
      const backBtn = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backBtn);
      expect(screen.getAllByText(/Action Step 1/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Hints, Show Me, and Reset Step Actions', () => {
    it('toggles contextual hint without completing the step', () => {
      render(
        <GuidedLabPanel
          procedure={mockProcedure}
          currentState={{ lampOn: false, distance: 0.50, loadResistance: 1000 }}
        />
      );

      const hintBtn = screen.getByRole('button', { name: /Hint/i });
      fireEvent.click(hintBtn);

      // Hint box appears
      expect(screen.getByText(/Pedagogical Hint:/i)).toBeInTheDocument();
      expect(screen.getByText(/Set distance to 25 cm and ensure no load resistance is connected/i)).toBeInTheDocument();
      expect(screen.getByText(/Hints explain the physical requirement; they do not auto-solve the action/i)).toBeInTheDocument();

      // Step must still be incomplete
      expect(screen.getByText(/In Progress/i)).toBeInTheDocument();

      // Toggle off
      fireEvent.click(hintBtn);
      expect(screen.queryByText(/Pedagogical Hint:/i)).not.toBeInTheDocument();
    });

    it('triggers Show Me cue callback with target element location', () => {
      const handleShowMe = vi.fn();

      render(
        <GuidedLabPanel
          procedure={mockProcedure}
          currentState={{ lampOn: false, distance: 0.50, loadResistance: 1000 }}
          onTriggerShowMe={handleShowMe}
        />
      );

      const showMeBtn = screen.getByRole('button', { name: /Show Me/i });
      fireEvent.click(showMeBtn);

      expect(handleShowMe).toHaveBeenCalledTimes(1);
      expect(handleShowMe).toHaveBeenCalledWith(
        expect.objectContaining({
          targetId: 'distance-slider',
        })
      );
    });

    it('resets step state when reset button is pressed', () => {
      const handleReset = vi.fn();

      render(
        <GuidedLabPanel
          procedure={mockProcedure}
          currentState={{ lampOn: true, distance: 0.25, loadResistance: 1000 }}
          onResetStep={handleReset}
        />
      );

      const resetBtn = screen.getByTitle(/Reset step parameters/i);
      fireEvent.click(resetBtn);

      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. SetupDiagramPanel Apparatus Diagram Viewer', () => {
    it('renders diagram panel, toggles collapse, and supports multi-configuration switching', () => {
      const handleSelectConfig = vi.fn();
      const handleTogglePin = vi.fn();

      render(
        <SetupDiagramPanel
          configurations={solarCellConfigurations}
          activeConfigId="single_cell"
          onSelectConfig={handleSelectConfig}
          onTogglePin={handleTogglePin}
          currentStepNumber={1}
          highlightedElementId="component-solar-cell"
        />
      );

      // Title & Figure
      expect(screen.getByText(/Apparatus Setup & Circuit Diagram/i)).toBeInTheDocument();
      expect(screen.getByText(/Figure 1, p. 24/i)).toBeInTheDocument();
      expect(screen.getByText(/Step 1 Active Focus/i)).toBeInTheDocument();

      // Switch configuration tab
      const seriesTab = screen.getByRole('button', { name: /3 Cells in Series Array/i });
      fireEvent.click(seriesTab);
      expect(handleSelectConfig).toHaveBeenCalledWith('series_array');

      // Test Zoom In and Zoom Out
      const zoomInBtn = screen.getByLabelText(/Zoom in/i);
      fireEvent.click(zoomInBtn);
      expect(screen.getByText('120%')).toBeInTheDocument();

      const zoomOutBtn = screen.getByLabelText(/Zoom out/i);
      fireEvent.click(zoomOutBtn);
      expect(screen.getByText('100%')).toBeInTheDocument();

      // Test Pin toggle
      const pinBtn = screen.getByLabelText(/Pin diagram/i);
      fireEvent.click(pinBtn);
      expect(handleTogglePin).toHaveBeenCalledWith(true);

      // Test Collapse toggle
      const collapseBtn = screen.getByLabelText(/Collapse diagram panel/i);
      fireEvent.click(collapseBtn);
      expect(screen.getByLabelText(/Expand diagram panel/i)).toBeInTheDocument();
    });

    it('opens and closes expanded modal view', () => {
      render(
        <SetupDiagramPanel
          configurations={solarCellConfigurations}
          activeConfigId="single_cell"
        />
      );

      const expandBtn = screen.getByLabelText(/Expand diagram modal/i);
      fireEvent.click(expandBtn);

      // Modal dialog appears
      expect(screen.getByRole('dialog', { name: /Expanded Apparatus Setup Diagram/i })).toBeInTheDocument();
      expect(screen.getByText(/Identified Apparatus Components:/i)).toBeInTheDocument();

      // Close modal
      const closeBtn = screen.getByLabelText(/Close expanded diagram modal/i);
      fireEvent.click(closeBtn);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
