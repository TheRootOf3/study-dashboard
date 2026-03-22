import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Check, Trash2, AlertTriangle } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { useCurrentWeek } from '../../hooks/useCurrentWeek';
import { differenceInDays, parseISO } from 'date-fns';
import { formatRelativeTime } from '../../utils/dateUtils';

export function ConfusionLogView() {
  const { state, addConfusionEntry, updateConfusionEntry, removeConfusionEntry } = useProgress();
  const { weekNumber } = useCurrentWeek();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [showForm, setShowForm] = useState(false);
  const [formTopic, setFormTopic] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const weekFilter = searchParams.get('week');

  const filtered = state.confusionLog.filter(e => {
    if (filter === 'unresolved' && e.resolved) return false;
    if (filter === 'resolved' && !e.resolved) return false;
    if (weekFilter && e.week_id !== weekFilter) return false;
    return true;
  });

  const handleAdd = async () => {
    if (!formTopic.trim()) return;
    await addConfusionEntry({
      topic: formTopic.trim(),
      description: formDesc.trim(),
      weekId: `week-${weekNumber}`,
    });
    setFormTopic('');
    setFormDesc('');
    setShowForm(false);
  };

  const handleResolve = async (id: string) => {
    await updateConfusionEntry(id, { resolved: 1, resolution: resolutionText });
    setResolvingId(null);
    setResolutionText('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Confusion Log</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
          style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}
        >
          <Plus size={16} /> Add Entry
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-lg border p-4 mb-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <input
            value={formTopic}
            onChange={e => setFormTopic(e.target.value)}
            placeholder="What confused you?"
            className="w-full px-3 py-2 rounded-md border text-sm mb-2"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
          />
          <textarea
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
            placeholder="Details..."
            className="w-full px-3 py-2 rounded-md border text-sm resize-y mb-2"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', minHeight: 60 }}
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="text-sm px-3 py-1.5 rounded cursor-pointer" style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}>
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 rounded cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5 mb-4">
        {(['all', 'unresolved', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded-full cursor-pointer capitalize"
            style={{
              backgroundColor: filter === f ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
              color: filter === f ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            {f} {f === 'unresolved' ? `(${state.confusionLog.filter(e => !e.resolved).length})` : ''}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--color-text-tertiary)' }}>
            No entries {filter !== 'all' ? `(${filter})` : ''}
          </div>
        ) : (
          filtered.map(entry => {
            const isOld = !entry.resolved && differenceInDays(new Date(), parseISO(entry.created_at)) > 14;
            return (
              <div
                key={entry.id}
                className="rounded-lg border p-4"
                style={{
                  borderColor: isOld ? 'var(--color-accent-warning)' : 'var(--color-border)',
                  backgroundColor: entry.resolved ? 'color-mix(in srgb, var(--color-accent-secondary) 5%, var(--color-bg-secondary))' : 'var(--color-bg-secondary)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{entry.topic}</span>
                      {isOld && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-warning) 15%, transparent)', color: 'var(--color-accent-warning)' }}>
                          <AlertTriangle size={10} /> 2+ weeks
                        </span>
                      )}
                      {entry.resolved ? (
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-accent-secondary)', color: 'white' }}>
                          Resolved
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{entry.description}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      {entry.week_id.replace('week-', 'Week ')} &middot; {formatRelativeTime(entry.created_at)}
                    </div>
                    {entry.resolved && entry.resolution && (
                      <div className="mt-2 pl-3 text-sm" style={{ borderLeft: '2px solid var(--color-accent-secondary)', color: 'var(--color-text-secondary)' }}>
                        <strong style={{ color: 'var(--color-accent-secondary)' }}>Resolution:</strong> {entry.resolution}
                      </div>
                    )}

                    {/* Resolution form */}
                    {resolvingId === entry.id && (
                      <div className="mt-2">
                        <textarea
                          value={resolutionText}
                          onChange={e => setResolutionText(e.target.value)}
                          placeholder="How was this resolved?"
                          className="w-full px-3 py-2 rounded-md border text-sm resize-y mb-2"
                          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', minHeight: 60 }}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleResolve(entry.id)} className="text-xs px-3 py-1 rounded cursor-pointer" style={{ backgroundColor: 'var(--color-accent-secondary)', color: 'white' }}>
                            Mark Resolved
                          </button>
                          <button onClick={() => setResolvingId(null)} className="text-xs px-3 py-1 rounded cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!entry.resolved && resolvingId !== entry.id && (
                      <button
                        onClick={() => { setResolvingId(entry.id); setResolutionText(entry.resolution || ''); }}
                        className="p-1.5 rounded cursor-pointer hover:opacity-80"
                        style={{ color: 'var(--color-accent-secondary)' }}
                        title="Resolve"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => removeConfusionEntry(entry.id)}
                      className="p-1.5 rounded cursor-pointer hover:opacity-80"
                      style={{ color: 'var(--color-text-tertiary)' }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
