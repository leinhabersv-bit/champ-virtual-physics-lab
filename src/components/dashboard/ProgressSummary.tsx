import React from 'react';
import { EXPERIMENTS_DATA } from '../../data/experiments';
import { CheckCircle2, Award, BookCheck, ShieldCheck, Sparkles } from 'lucide-react';

interface ProgressSummaryProps {
  completedExptIds: string[];
  vivaScores: Record<string, number>;
  onLaunchDemo: () => void;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  completedExptIds,
  vivaScores,
  onLaunchDemo,
}) => {
  const total = EXPERIMENTS_DATA.length; // 9 experiments
  const cycle1List = EXPERIMENTS_DATA.filter((e) => e.cycle === 1);
  const cycle2List = EXPERIMENTS_DATA.filter((e) => e.cycle === 2);

  const cycle1Practised = cycle1List.filter((e) => completedExptIds.includes(e.id)).length;
  const cycle2Practised = cycle2List.filter((e) => completedExptIds.includes(e.id)).length;
  const completedCount = completedExptIds.length;
  const progressPercent = Math.round((completedCount / total) * 100);

  const totalVivaMarks = Object.values(vivaScores).reduce((acc, curr) => acc + curr, 0);
  const maxPossibleViva = total * 3; // 27 marks
  const vivaEvaluatedCount = Object.keys(vivaScores).length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
      {/* Header and Progress Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-teal-400 tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Your Lab Record • Continuous Assessment
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-100">
            {completedCount === 0
              ? 'Ready to Begin Laboratory Simulations'
              : `${completedCount} of 9 Experiments Practised (${progressPercent}%)`}
          </h2>
        </div>

        <button
          type="button"
          onClick={onLaunchDemo}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-900/30 transition-all hover:scale-[1.02]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Launch Experiment 1 Live Demo</span>
        </button>
      </div>

      {/* Live Linear Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono text-slate-400">
          <span>Overall Lab Completion</span>
          <span className="text-teal-400 font-semibold">{completedCount} / 9 Experiments</span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-violet-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(progressPercent, 4)}%` }}
          />
        </div>
      </div>

      {/* 4 Assessment Grid Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <BookCheck className="w-4 h-4 text-indigo-400" />
            <span>Cycle 1 (Expts 1–4)</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {cycle1Practised} / 4 <span className="text-xs text-slate-400 font-normal">Done</span>
          </div>
          <div className="text-[10px] text-teal-400 font-mono">
            {cycle1Practised === 4 ? 'All Completed' : `${4 - cycle1Practised} Remaining`}
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <BookCheck className="w-4 h-4 text-purple-400" />
            <span>Cycle 2 (Expts 5–9)</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {cycle2Practised} / 5 <span className="text-xs text-slate-400 font-normal">Done</span>
          </div>
          <div className="text-[10px] text-indigo-400 font-mono">
            {cycle2Practised === 5 ? 'All Completed' : `${5 - cycle2Practised} Remaining`}
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Viva Voce Accrual</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {totalVivaMarks} / {maxPossibleViva} <span className="text-xs text-slate-400">Marks</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {vivaEvaluatedCount} of 9 evaluated
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Manual Traceability</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            86 / 86 <span className="text-xs text-slate-400">Pages</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Expts 1–9 Fully Traced
          </div>
        </div>
      </div>
    </div>
  );
};
