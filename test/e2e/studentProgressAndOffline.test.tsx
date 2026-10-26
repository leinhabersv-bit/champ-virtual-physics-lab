import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  loadStudentProgress,
  recordExperimentPractice,
  recordVivaScore,
  resetStudentProgress,
} from '../../src/services/studentProgress';
import {
  getPwaStatus,
  subscribePwaStatus,
  checkPwaStatus,
} from '../../src/services/pwaStatus';
import { Dashboard } from '../../src/components/dashboard/Dashboard';
import { App } from '../../src/App';

describe('Truthful Student Progress Tracking & PWA Readiness', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStudentProgress();
    vi.restoreAllMocks();
  });

  it('initializes with 0 completed experiments by default (no hardcoded completions)', () => {
    const initialProgress = loadStudentProgress();
    expect(initialProgress.completedExperimentIds).toEqual([]);
    expect(Object.keys(initialProgress.records).length).toBe(9);
    for (const record of Object.values(initialProgress.records)) {
      expect(record.isPractised).toBe(false);
      expect(record.completedSteps).toEqual([]);
      expect(record.recordedRowsCount).toBe(0);
    }
  });

  it('honestly marks an experiment as practiced only when student fulfills criteria', () => {
    // Before practice
    expect(loadStudentProgress().completedExperimentIds).not.toContain('expt-1-solar-cell');

    // 1 step is not yet sufficient for completion
    const step1 = recordExperimentPractice('expt-1-solar-cell', {
      completedSteps: [1],
      recordedRowsCount: 0,
    });
    expect(step1.isPractised).toBe(false);
    expect(loadStudentProgress().completedExperimentIds).not.toContain('expt-1-solar-cell');

    // Completing 2 steps qualifies as practiced
    const step2 = recordExperimentPractice('expt-1-solar-cell', {
      completedSteps: [2],
      recordedRowsCount: 0,
    });
    expect(step2.isPractised).toBe(true);
    expect(loadStudentProgress().completedExperimentIds).toContain('expt-1-solar-cell');

    // Verify localStorage persistence
    const saved = JSON.parse(localStorage.getItem('champ_lab_student_progress_v2') || '{}');
    expect(saved.completedExperimentIds).toContain('expt-1-solar-cell');
    expect(saved.records['expt-1-solar-cell'].isPractised).toBe(true);
  });

  it('records and accumulates viva voce scores accurately', () => {
    recordVivaScore('expt-1-solar-cell', 3);
    recordVivaScore('expt-2-mercury-grating', 2);

    const progress = loadStudentProgress();
    expect(progress.vivaScores['expt-1-solar-cell']).toBe(3);
    expect(progress.vivaScores['expt-2-mercury-grating']).toBe(2);
    expect(progress.records['expt-1-solar-cell'].vivaScore).toBe(3);
    expect(progress.records['expt-2-mercury-grating'].vivaScore).toBe(2);
  });

  it('evaluates truthful PWA status based on network and service worker', async () => {
    const initialStatus = getPwaStatus();
    expect(initialStatus.statusLabel).toBeDefined();

    let latestStatus = initialStatus;
    const unsubscribe = subscribePwaStatus((status) => {
      latestStatus = status;
    });

    const checked = await checkPwaStatus();
    expect(checked.isOnline).toBe(typeof navigator !== 'undefined' ? navigator.onLine : true);
    expect(latestStatus.level).toBeDefined();
    unsubscribe();
  });

  it('renders Dashboard with search filtering and cycle tabs', () => {
    const mockOnSelect = vi.fn();
    const mockOnViva = vi.fn();

    render(
      <Dashboard
        onSelectExperiment={mockOnSelect}
        onOpenViva={mockOnViva}
        completedExptIds={['expt-1-solar-cell']}
        vivaScores={{ 'expt-1-solar-cell': 3 }}
      />
    );

    // Initial render shows all 9 experiments
    expect(screen.getByText(/Showing 9 of 9 laboratory experiments/i)).toBeInTheDocument();
    expect(screen.getByText(/1 of 9 practised/i)).toBeInTheDocument();
    expect(screen.getByText(/Physics, in motion\./i)).toBeInTheDocument();

    // Filter by Cycle 1
    const cycle1Btn = screen.getByRole('button', { name: /Cycle 1 \(Expts 1–4\)/i });
    fireEvent.click(cycle1Btn);
    expect(screen.getByText(/Showing 4 of 9 laboratory experiments/i)).toBeInTheDocument();

    // Filter by Cycle 2
    const cycle2Btn = screen.getByRole('button', { name: /Cycle 2 \(Expts 5–9\)/i });
    fireEvent.click(cycle2Btn);
    expect(screen.getByText(/Showing 5 of 9 laboratory experiments/i)).toBeInTheDocument();

    // Reset to All
    const allBtn = screen.getByRole('button', { name: /All \(09\)/i });
    fireEvent.click(allBtn);
    expect(screen.getByText(/Showing 9 of 9 laboratory experiments/i)).toBeInTheDocument();

    // Search for "sodium"
    const searchInput = screen.getByPlaceholderText(/Search experiments, apparatus\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'sodium' } });
    expect(screen.getAllByText(/Minimum Deviation Method/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Showing 1 of 9 laboratory experiments/i)).toBeInTheDocument();
  });

  it('renders App shell with truthful offline status badge and progress record', () => {
    render(<App />);

    expect(screen.getAllByText(/CHAMP Virtual Physics Lab/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/VIT Chennai • BAPHY105/i)).toBeInTheDocument();

    // Status badge must be present and reflect real state (e.g. Live Web Mode or PWA)
    const statusBadge = screen.getByTitle(/Connected to live web server|Service Worker/i);
    expect(statusBadge).toBeInTheDocument();
  });
});
