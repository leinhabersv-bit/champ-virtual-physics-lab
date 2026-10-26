import React, { useState } from 'react';
import { EXPERIMENTS_DATA } from '../../data/experiments';
import { ExperimentCard } from './ExperimentCard';
import { ProgressSummary } from './ProgressSummary';
import { Atom, ShieldCheck, FileText, ExternalLink } from 'lucide-react';

interface DashboardProps {
  onSelectExperiment: (id: string) => void;
  onOpenViva: (id: string) => void;
  completedExptIds: string[];
  vivaScores: Record<string, number>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectExperiment,
  onOpenViva,
  completedExptIds,
  vivaScores,
}) => {
  const [selectedCycle, setSelectedCycle] = useState<'all' | 1 | 2>('all');

  const filteredExperiments = EXPERIMENTS_DATA.filter((e) => {
    if (selectedCycle === 'all') return true;
    return e.cycle === selectedCycle;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <Atom className="w-4 h-4 text-indigo-400" />
              VIT Chennai • SAS Department of Physics
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 text-xs font-mono">
              BAPHY105 — CHAMP Manual
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            CHAMP Virtual Physics Laboratory
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Rigorous, interactive laboratory simulation platform designed for B.Tech First Year (SCOPE).
            Featuring deterministic physics engines, accessible vector workbenches, KaTeX formula integration,
            and offline local persistence.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full 86-page PDF Traceability</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>4 Preparatory Modules Excluded</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>10-Mark Assessment Rubric</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Audit Overview */}
      <ProgressSummary
        completedExptIds={completedExptIds}
        vivaScores={vivaScores}
        onLaunchDemo={() => onSelectExperiment('expt-1-solar-cell')}
      />

      {/* Cycle Filtering Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setSelectedCycle('all')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              selectedCycle === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All 9 Experiments
          </button>
          <button
            type="button"
            onClick={() => setSelectedCycle(1)}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              selectedCycle === 1
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cycle 1 (Expts 1–4)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCycle(2)}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              selectedCycle === 2
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cycle 2 (Expts 5–9)
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredExperiments.length} of 9 laboratory experiments
        </span>
      </div>

      {/* Experiment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExperiments.map((expt) => (
          <ExperimentCard
            key={expt.id}
            experiment={expt}
            onLaunch={onSelectExperiment}
            onOpenViva={onOpenViva}
            vivaScore={vivaScores[expt.id]}
          />
        ))}
      </div>
    </div>
  );
};
