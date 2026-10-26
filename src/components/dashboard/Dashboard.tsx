import React, { useState, useMemo } from 'react';
import { EXPERIMENTS_DATA } from '../../data/experiments';
import { ExperimentCard } from './ExperimentCard';
import { ProgressSummary } from './ProgressSummary';
import { ShieldCheck, FileText, Search, Sparkles, Filter, CheckCircle2 } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredExperiments = useMemo(() => {
    return EXPERIMENTS_DATA.filter((e) => {
      // Cycle filter
      if (selectedCycle !== 'all' && e.cycle !== selectedCycle) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesAim = e.aim.toLowerCase().includes(q);
        const matchesApparatus = e.apparatus.some((app) => app.toLowerCase().includes(q));
        const matchesTags = e.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchesNum = String(e.number).includes(q);
        return matchesTitle || matchesAim || matchesApparatus || matchesTags || matchesNum;
      }
      return true;
    });
  }, [selectedCycle, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Manus-Inspired Hero Header with Orbital Rings Art */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#101b31] via-[#0f273d] to-[#143b4f] border border-slate-700/60 p-6 md:p-10 shadow-2xl">
        {/* Orbital Rings Background SVG (Manus Visual Accent) */}
        <div className="absolute right-[-40px] md:right-4 top-1/2 -translate-y-1/2 w-64 md:w-80 h-64 md:h-80 pointer-events-none opacity-40 md:opacity-75">
          <svg viewBox="0 0 320 320" className="w-full h-full">
            {/* Core Glowing Orb */}
            <circle cx="160" cy="160" r="14" fill="#14b8a6" className="animate-orbital-pulse" filter="blur(1px)" />
            <circle cx="160" cy="160" r="6" fill="#f0fdfa" />

            {/* Orbit Ring 1 (Teal) */}
            <g className="animate-orbital-1" style={{ transformOrigin: '160px 160px' }}>
              <ellipse cx="160" cy="160" rx="60" ry="26" fill="none" stroke="#14b8a6" strokeWidth="1.2" strokeDasharray="6 4" opacity="0.8" transform="rotate(25 160 160)" />
              <circle cx="215" cy="148" r="4" fill="#38bdf8" />
            </g>

            {/* Orbit Ring 2 (Violet) */}
            <g className="animate-orbital-2" style={{ transformOrigin: '160px 160px' }}>
              <ellipse cx="160" cy="160" rx="100" ry="42" fill="none" stroke="#8b5cf6" strokeWidth="1.2" strokeDasharray="8 6" opacity="0.65" transform="rotate(-35 160 160)" />
              <circle cx="85" cy="130" r="3.5" fill="#c084fc" />
            </g>

            {/* Orbit Ring 3 (Amber) */}
            <g className="animate-orbital-3" style={{ transformOrigin: '160px 160px' }}>
              <ellipse cx="160" cy="160" rx="138" ry="58" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="10 8" opacity="0.5" transform="rotate(65 160 160)" />
              <circle cx="280" cy="175" r="3" fill="#fbbf24" />
            </g>
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              VIT Chennai • SAS Department of Physics
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 text-slate-300 text-xs font-mono border border-slate-700/80">
              BAPHY105 • SCOPE
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-widest text-teal-300/80">
              Physics, in motion.
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              CHAMP Virtual Physics Laboratory
            </h1>
          </div>

          <p className="text-sm md:text-base text-slate-200/90 leading-relaxed max-w-xl">
            A comprehensive, interactive virtual physics laboratory platform for B.Tech First Year students.
            Combines rigorous deterministic simulation engines, collapsible circuit diagrams, guided step-by-step
            procedures, and full 86-page laboratory manual traceability.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>09 Working Experiments</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-400" />
              <span>86 Manual Pages Traced</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>04 Prep Modules Excluded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Continuous Assessment Tracker */}
      <ProgressSummary
        completedExptIds={completedExptIds}
        vivaScores={vivaScores}
        onLaunchDemo={() => onSelectExperiment('expt-1-solar-cell')}
      />

      {/* Search & Cycle Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Cycle Filter Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setSelectedCycle('all')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              selectedCycle === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All (09)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCycle(1)}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
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
            className={`px-3.5 py-2 rounded-lg font-bold transition-all ${
              selectedCycle === 2
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cycle 2 (Expts 5–9)
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[260px] sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search experiments, apparatus..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Showing count indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
        <span>
          Showing {filteredExperiments.length} of 9 laboratory experiments
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        {completedExptIds.length > 0 && (
          <span className="text-emerald-400 font-semibold">
            {completedExptIds.length} of 9 practised
          </span>
        )}
      </div>

      {/* Experiment Cards Grid */}
      {filteredExperiments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <Filter className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-slate-300 font-medium text-sm">No experiments match your search query.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCycle('all');
            }}
            className="text-xs text-indigo-400 hover:underline font-mono"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExperiments.map((expt) => (
            <ExperimentCard
              key={expt.id}
              experiment={expt}
              onLaunch={onSelectExperiment}
              onOpenViva={onOpenViva}
              vivaScore={vivaScores[expt.id]}
              isPractised={completedExptIds.includes(expt.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
