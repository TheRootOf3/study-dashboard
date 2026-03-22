import { Link } from 'react-router-dom';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { getPhaseProgress, getWeekProgress, getPhaseColor } from '../../utils/progressCalc';
import { ProgressBar } from '../shared/ProgressBar';

export function PhaseView() {
  const { state, studyPlan } = useProgress();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Phases</h2>

      <div className="space-y-4">
        {studyPlan.phases.map(phase => {
          const pp = getPhaseProgress(phase, state.completions);
          const color = getPhaseColor(phase.number);
          const isExpanded = expandedPhase === phase.id;
          const isComplete = pp.completed === pp.total && pp.total > 0;

          return (
            <div
              key={phase.id}
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--color-border)', borderLeft: `4px solid ${color}` }}
            >
              <div className="p-4" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold" style={{ color: color }}>
                        Phase {phase.number}: {phase.title}
                      </h3>
                      {isComplete && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'var(--color-accent-secondary)', color: 'white' }}>
                          Complete
                        </span>
                      )}
                    </div>
                    <div className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {phase.course}
                    </div>
                    <div className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                      Weeks {phase.weekRange[0]}–{phase.weekRange[1]} &middot; Book: {phase.bookChapters}
                    </div>
                    <ProgressBar percent={pp.percent} color={color} showLabel />
                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      {pp.completed} / {pp.total} slots
                    </div>
                  </div>
                  <a
                    href={phase.courseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 rounded-lg hover:opacity-80"
                    style={{ color: 'var(--color-accent-primary)' }}
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>

                <button
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                  className="flex items-center gap-1 mt-3 text-xs hover:underline cursor-pointer"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {isExpanded ? 'Hide details' : 'Show details'}
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{phase.description}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Book:</strong> {phase.bookDescription}
                    </p>

                    {isComplete && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-secondary) 10%, transparent)' }}>
                        <p className="text-sm" style={{ color: 'var(--color-accent-secondary)' }}>{phase.completionNote}</p>
                      </div>
                    )}

                    <div className="space-y-1">
                      {phase.weeks.map(week => {
                        const wp = getWeekProgress(week, state.completions);
                        return (
                          <Link
                            key={week.id}
                            to={`/week/${week.weekNumber}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:opacity-80 transition-colors"
                            style={{ backgroundColor: 'var(--color-bg-primary)' }}
                          >
                            <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
                              Week {week.weekNumber}: {week.title}
                              {week.isBuffer && <span className="ml-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>(buffer)</span>}
                            </span>
                            <div className="w-24">
                              <ProgressBar percent={wp.percent} color={color} height={4} />
                            </div>
                            <span className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
                              {wp.completed}/{wp.total}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
