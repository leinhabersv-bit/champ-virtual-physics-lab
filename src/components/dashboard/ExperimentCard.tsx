import React from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import { ArrowRight, BookOpen, Award, CheckCircle2, Wrench } from 'lucide-react';

interface ExperimentCardProps {
  experiment: ExperimentMetadata;
  onLaunch: (id: string) => void;
  onOpenViva: (id: string) => void;
  vivaScore?: number | null;
}

export const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment,
  onLaunch,
  onOpenViva,
  vivaScore,
}) => {
  const isDemo = experiment.isDemoFunctional;

  return (
    <div
      className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] ${
        isDemo
          ? 'border-emerald-500/50 shadow-emerald-500/5 hover:border-emerald-400'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono ${
                experiment.cycle === 1
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  : 'bg-purple-950 text-purple-300 border border-purple-800'
              }`}
            >
              Cycle {experiment.cycle}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Expt #{experiment.number}
            </span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
              isDemo
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700 flex items-center gap-1'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {isDemo && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            {experiment.statusBadge}
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
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>PDF {experiment.pdfPageRange}</span>
          <span>•</span>
          <span>Printed {experiment.printedPageRange}</span>
        </div>

        {/* Apparatus Preview */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Wrench className="w-3 h-3 text-slate-400" /> Key Apparatus
          </span>
          <p className="text-[11px] text-slate-300 line-clamp-2">
            {experiment.apparatus.slice(0, 3).join(', ')}
            {experiment.apparatus.length > 3 ? ` + ${experiment.apparatus.length - 3} more` : ''}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 pt-1">
          {experiment.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono"
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
              ? 'bg-amber-950/40 text-amber-300 border-amber-800'
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
          className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
            isDemo
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-1 ring-emerald-400/40'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isDemo ? 'Open Demo Bench' : 'Inspect Contract'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
