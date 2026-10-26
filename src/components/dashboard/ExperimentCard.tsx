import React from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import { ArrowRight, BookOpen, Award, CheckCircle2, Wrench, Play } from 'lucide-react';

interface ExperimentCardProps {
  experiment: ExperimentMetadata;
  onLaunch: (id: string) => void;
  onOpenViva: (id: string) => void;
  vivaScore?: number | null;
  isPractised?: boolean;
}

const EXPERIMENT_TONES: Record<number, { border: string; badge: string; text: string }> = {
  1: { border: 'border-t-amber-500', badge: 'bg-amber-950/60 text-amber-300 border-amber-700/60', text: 'text-amber-400' },
  2: { border: 'border-t-cyan-500', badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60', text: 'text-cyan-400' },
  3: { border: 'border-t-emerald-500', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60', text: 'text-emerald-400' },
  4: { border: 'border-t-violet-500', badge: 'bg-violet-950/60 text-violet-300 border-violet-700/60', text: 'text-violet-400' },
  5: { border: 'border-t-yellow-500', badge: 'bg-yellow-950/60 text-yellow-300 border-yellow-700/60', text: 'text-yellow-400' },
  6: { border: 'border-t-teal-500', badge: 'bg-teal-950/60 text-teal-300 border-teal-700/60', text: 'text-teal-400' },
  7: { border: 'border-t-sky-500', badge: 'bg-sky-950/60 text-sky-300 border-sky-700/60', text: 'text-sky-400' },
  8: { border: 'border-t-rose-500', badge: 'bg-rose-950/60 text-rose-300 border-rose-700/60', text: 'text-rose-400' },
  9: { border: 'border-t-indigo-500', badge: 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60', text: 'text-indigo-400' },
};

export const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment,
  onLaunch,
  onOpenViva,
  vivaScore,
  isPractised = false,
}) => {
  const tone = EXPERIMENT_TONES[experiment.number] || {
    border: 'border-t-indigo-500',
    badge: 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60',
    text: 'text-indigo-400',
  };

  const formattedNum = String(experiment.number).padStart(2, '0');

  return (
    <div
      className={`bg-slate-900/95 border border-slate-800 ${tone.border} border-t-4 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:border-slate-700 hover:-translate-y-1`}
    >
      <div className="space-y-3.5">
        {/* Top Badges & Experiment Identification */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono ${
                experiment.cycle === 1
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/80'
                  : 'bg-purple-950 text-purple-300 border border-purple-800/80'
              }`}
            >
              Cycle {experiment.cycle}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-400">
              #{formattedNum}
            </span>
          </div>

          {/* Real progress status indicator */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border flex items-center gap-1 ${
              isPractised
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70'
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`}
          >
            {isPractised ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Practised</span>
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5 text-slate-400" />
                <span>Ready to explore</span>
              </>
            )}
          </span>
        </div>

        {/* Experiment Title */}
        <div>
          <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug">
            {experiment.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {experiment.aim}
          </p>
        </div>

        {/* Syllabus Page Details */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <BookOpen className={`w-3.5 h-3.5 ${tone.text}`} />
          <span>PDF {experiment.pdfPageRange}</span>
          <span>•</span>
          <span>Printed {experiment.printedPageRange}</span>
        </div>

        {/* Apparatus Preview */}
        <div className="pt-2.5 border-t border-slate-800/80 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Wrench className="w-3 h-3 text-slate-400" /> Key Apparatus Setup
          </span>
          <p className="text-[11px] text-slate-300 line-clamp-2">
            {experiment.apparatus.slice(0, 3).join(', ')}
            {experiment.apparatus.length > 3 ? ` + ${experiment.apparatus.length - 3} more` : ''}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {experiment.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 font-mono"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenViva(experiment.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
            vivaScore !== undefined && vivaScore !== null
              ? 'bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-950/60'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Practice Viva Voce"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          {vivaScore ? `Viva: ${vivaScore}/3` : 'Viva (3M)'}
        </button>

        <button
          type="button"
          onClick={() => onLaunch(experiment.id)}
          className="px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md bg-indigo-600 hover:bg-indigo-500 text-white ring-1 ring-indigo-400/30 hover:ring-indigo-300/50"
        >
          <span>Enter Workbench</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
