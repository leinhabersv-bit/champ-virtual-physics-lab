import React, { useState, useEffect, useCallback } from 'react';
import {
  ExperimentProcedure,
  InstructionalMode,
  GuidedStep,
  StepValidationResult,
  ShowMeCue,
  InstructionalProgress,
} from '../../types/instructional';
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Eye,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Target,
  MapPin,
  BookOpen,
  AlertTriangle,
  Award,
  Sparkles,
  Check,
  ShieldAlert,
} from 'lucide-react';

export interface GuidedLabPanelProps {
  procedure: ExperimentProcedure;
  currentState: any;
  onStepChange?: (stepIndex: number, step: GuidedStep) => void;
  onTriggerShowMe?: (cue: ShowMeCue) => void;
  onResetStep?: (step: GuidedStep) => void;
  initialMode?: InstructionalMode;
  className?: string;
}

const STORAGE_PREFIX = 'champ_guided_progress_v1_';

export const GuidedLabPanel: React.FC<GuidedLabPanelProps> = ({
  procedure,
  currentState,
  onStepChange,
  onTriggerShowMe,
  onResetStep,
  initialMode = 'beginner',
  className = '',
}) => {
  const storageKey = `${STORAGE_PREFIX}${procedure.experimentId}`;

  // Load persistent progress or initialize defaults
  const [mode, setMode] = useState<InstructionalMode>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: InstructionalProgress = JSON.parse(saved);
        return parsed.mode || initialMode;
      }
    } catch {
      // fallback
    }
    return initialMode;
  });

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: InstructionalProgress = JSON.parse(saved);
        return Math.min(parsed.currentStepIndex || 0, procedure.steps.length - 1);
      }
    } catch {
      // fallback
    }
    return 0;
  });

  const [completedStepIds, setCompletedStepIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: InstructionalProgress = JSON.parse(saved);
        return parsed.completedStepIds || [];
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [showHint, setShowHint] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<StepValidationResult | null>(null);
  const [showMeActive, setShowMeActive] = useState<boolean>(false);

  const currentStep = procedure.steps[currentStepIndex] || procedure.steps[0];
  const isCurrentStepCompleted = completedStepIds.includes(currentStep?.id);

  // Sync step change to parent workbench
  useEffect(() => {
    if (currentStep) {
      onStepChange?.(currentStepIndex, currentStep);
      setShowHint(false);
      setShowMeActive(false);
      setValidationResult(null);
    }
  }, [currentStepIndex, currentStep, onStepChange]);

  // Persist progress to localStorage whenever state changes
  useEffect(() => {
    try {
      const progress: InstructionalProgress = {
        experimentId: procedure.experimentId,
        mode,
        currentStepIndex,
        completedStepIds,
        isDiagramPinned: false,
        activeConfigurationId: currentStep?.configurationId || procedure.configurations[0]?.id || '',
        hintsUsedCount: 0,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save guided progress', e);
    }
  }, [mode, currentStepIndex, completedStepIds, currentStep, procedure, storageKey]);

  // Validate current step against live simulator state
  const handleValidateStep = useCallback(() => {
    if (!currentStep) return;
    const result = currentStep.validate(currentState);
    setValidationResult(result);

    if (result.isComplete && !completedStepIds.includes(currentStep.id)) {
      setCompletedStepIds((prev) => [...prev, currentStep.id]);
    }
  }, [currentStep, currentState, completedStepIds]);

  const handleNextStep = () => {
    // In beginner mode, strictly verify step is complete before advancing
    if (mode === 'beginner' && !isCurrentStepCompleted) {
      const result = currentStep.validate(currentState);
      setValidationResult(result);
      if (!result.isComplete) return;
      if (!completedStepIds.includes(currentStep.id)) {
        setCompletedStepIds((prev) => [...prev, currentStep.id]);
      }
    }

    if (currentStepIndex < procedure.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleTriggerShowMe = () => {
    setShowMeActive(true);
    if (currentStep.showMeCue) {
      onTriggerShowMe?.(currentStep.showMeCue);
    } else {
      onTriggerShowMe?.({
        targetId: currentStep.targetElementId,
        message: currentStep.where,
      });
    }
  };

  const handleResetStepAction = () => {
    currentStep.resetAction?.();
    onResetStep?.(currentStep);
    setValidationResult(null);
    setShowMeActive(false);
    // Remove current step from completed list if retrying
    setCompletedStepIds((prev) => prev.filter((id) => id !== currentStep.id));
  };

  const handleResetAllProgress = () => {
    if (window.confirm('Reset all guided lab step progress for this experiment?')) {
      setCompletedStepIds([]);
      setCurrentStepIndex(0);
      setValidationResult(null);
      setShowHint(false);
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
  };

  const completionPercent = Math.round(
    (completedStepIds.length / Math.max(1, procedure.steps.length)) * 100
  );

  return (
    <div
      aria-label="Guided Laboratory Assistant"
      className={`rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl overflow-hidden ${className}`}
    >
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Guided Laboratory Protocol
              </h2>
              <span className="rounded bg-indigo-950/80 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300 border border-indigo-800/60">
                {procedure.sourcePages}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              VIT BAPHY105 • {procedure.rubric.labPerformanceMarks} Marks Lab + {procedure.rubric.vivaMarks} Marks Viva
            </div>
          </div>
        </div>

        {/* 3-Mode Pill Selector */}
        <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMode('beginner')}
            aria-pressed={mode === 'beginner'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
              mode === 'beginner'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Beginner</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('practice')}
            aria-pressed={mode === 'practice'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
              mode === 'practice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Practice</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('exam')}
            aria-pressed={mode === 'exam'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
              mode === 'exam'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Exam</span>
          </button>
        </div>
      </div>

      {/* Progress Bar (Visible in Beginner and Practice) */}
      {mode !== 'exam' && (
        <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Step {currentStepIndex + 1} of {procedure.steps.length}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-semibold">{completionPercent}% Complete</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <button
              type="button"
              onClick={handleResetAllProgress}
              title="Reset progress"
              aria-label="Reset all step progress"
              className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* MODE 1: BEGINNER (Detailed 5-Pillar Cards) */}
      {mode === 'beginner' && (
        <div className="p-4 space-y-4">
          {/* Step Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                Action Step {currentStep.number}
              </div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {currentStep.title}
                {isCurrentStepCompleted && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                )}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">{currentStep.shortTask}</p>
            </div>

            {/* Status Pill */}
            <div
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                isCurrentStepCompleted
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
              }`}
            >
              {isCurrentStepCompleted ? 'Validated Complete' : 'In Progress'}
            </div>
          </div>

          {/* 5 Instructional Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            {/* WHAT TO DO */}
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[11px]">
                <Target className="w-3.5 h-3.5" />
                WHAT TO DO
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">{currentStep.what}</p>
            </div>

            {/* WHERE TO CONNECT / ADJUST */}
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sky-300 text-[11px]">
                <MapPin className="w-3.5 h-3.5" />
                WHERE TO OPERATE
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">{currentStep.where}</p>
            </div>

            {/* WHY (THEORY & MECHANISM) */}
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-[11px]">
                <BookOpen className="w-3.5 h-3.5" />
                WHY IT MATTERS (PHYSICS THEORY)
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">{currentStep.why}</p>
            </div>

            {/* WHAT TO OBSERVE */}
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
                <Eye className="w-3.5 h-3.5" />
                WHAT YOU SHOULD OBSERVE
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">{currentStep.observe}</p>
            </div>
          </div>

          {/* HOW TO SPOT MISTAKES */}
          <div className="rounded-lg bg-rose-950/20 p-3 border border-rose-900/40 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-300 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              COMMON PITFALLS &amp; MISTAKES
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">{currentStep.mistakes}</p>
          </div>

          {/* Validation Feedback Banner */}
          {validationResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                validationResult.isComplete
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-800 text-amber-200'
              }`}
            >
              {validationResult.isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">
                  {validationResult.isComplete ? 'Physical Step Verified!' : 'Step Criteria Incomplete'}
                </div>
                <div className="text-[11px] mt-0.5">{validationResult.feedback}</div>
              </div>
            </div>
          )}

          {/* Expandable Hint Drawer */}
          {showHint && (
            <div className="rounded-lg bg-indigo-950/30 p-3 border border-indigo-800/50 text-xs text-indigo-200 flex items-start gap-2 animate-in fade-in">
              <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[11px] text-amber-300">Pedagogical Hint:</div>
                <div className="text-[11px] mt-0.5">{currentStep.hint}</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">
                  * Note: Hints explain the physical requirement; they do not auto-solve the action.
                </div>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  showHint
                    ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-amber-300'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerShowMe}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  showMeActive
                    ? 'bg-sky-950/60 border-sky-800 text-sky-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-sky-300'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Show Me</span>
              </button>

              <button
                type="button"
                onClick={handleResetStepAction}
                title="Reset step parameters"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleValidateStep}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-700/30 flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Check Action</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={currentStepIndex === procedure.steps.length - 1}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  isCurrentStepCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: PRACTICE (Checklist View) */}
      {mode === 'practice' && (
        <div className="p-4 space-y-3">
          <div className="text-xs text-slate-400 font-mono">
            Practice Mode: Complete procedural actions in sequence. Check off steps as you calibrate.
          </div>

          <div className="space-y-2">
            {procedure.steps.map((st, idx) => {
              const isDone = completedStepIds.includes(st.id);
              const isActive = idx === currentStepIndex;

              return (
                <div
                  key={st.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-950 border-indigo-500 ring-1 ring-indigo-500/50'
                      : isDone
                      ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                      : 'bg-slate-950/20 border-slate-800/60 text-slate-400 hover:bg-slate-950/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-mono font-bold ${
                          isDone
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : isActive
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{st.title}</div>
                        <div className="text-[11px] text-slate-400">{st.shortTask}</div>
                      </div>
                    </div>

                    {isActive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleValidateStep();
                        }}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors"
                      >
                        Validate
                      </button>
                    )}
                  </div>

                  {/* Expanded Active Step Summary in Practice Mode */}
                  {isActive && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] space-y-1.5 text-slate-300">
                      <div>
                        <strong className="text-sky-300">Operate:</strong> {st.where}
                      </div>
                      <div>
                        <strong className="text-amber-300">Observe:</strong> {st.observe}
                      </div>
                      {validationResult && (
                        <div
                          className={`p-2 rounded text-[11px] ${
                            validationResult.isComplete
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {validationResult.feedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 3: EXAM (Minimal Independent HUD) */}
      {mode === 'exam' && (
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-amber-300">Exam Mode: Independent Laboratory Evaluation</h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                You are operating under simulated examination conditions. Procedural walkthroughs, hints, and
                "Show Me" indicators are disabled. Carry out initial calibrations, complete observation tables,
                and prepare your final results for oral viva evaluation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400">LAB PERFORMANCE</div>
              <div className="text-base font-bold text-slate-100 mt-0.5">
                {procedure.rubric.labPerformanceMarks} Marks
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Wiring, reading tables &amp; graphs</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400">VIVA VOCE EXAM</div>
              <div className="text-base font-bold text-slate-100 mt-0.5">
                {procedure.rubric.vivaMarks} Marks
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Oral theory &amp; derivation questions</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-400">TOTAL EVALUATION</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">
                {procedure.rubric.totalMarks} Marks
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Complete syllabus weighting</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
