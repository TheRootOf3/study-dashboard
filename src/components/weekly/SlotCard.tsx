import { useState } from 'react';
import { Train, Moon, BookOpen, Flame, ChevronDown, ChevronUp, ExternalLink, Clock } from 'lucide-react';
import { Checkbox } from '../shared/Checkbox';
import { MarkdownBlock } from '../shared/MarkdownBlock';
import { useProgress } from '../../context/ProgressContext';
import { formatRelativeTime } from '../../utils/dateUtils';
import type { Slot } from '../../utils/progressCalc';

interface SlotCardProps {
  slot: Slot;
  compact?: boolean;
}

export function SlotCard({ slot, compact = false }: SlotCardProps) {
  const { state, toggleCompletion, updateSlotNotes, updateSlotDifficulty } = useProgress();
  const completion = state.completions.get(slot.id);
  const isCompleted = !!completion?.completed;
  const [expanded, setExpanded] = useState(!compact);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesValue, setNotesValue] = useState(completion?.notes || '');

  const Icon = slot.type === 'train' ? Train : Moon;
  const hasCritical = slot.tags.includes('critical');
  const hasKeyExercise = slot.tags.includes('key-exercise');
  const hasCheckpoint = slot.tags.includes('checkpoint');
  const hasTimed = slot.tags.includes('timed');
  const hours = slot.estimatedMinutes / 60;

  const handleToggle = async (checked: boolean) => {
    await toggleCompletion(slot.id, checked);
  };

  const handleNotesSave = async () => {
    await updateSlotNotes(slot.id, notesValue);
    setNotesOpen(false);
  };

  const difficultyColors = ['', 'var(--color-accent-secondary)', 'var(--color-accent-warning)', 'var(--color-accent-primary)'];
  const difficultyLabels = ['', 'Easy', 'Medium', 'Hard'];

  return (
    <div
      className="rounded-lg border transition-all duration-200"
      style={{
        borderColor: isCompleted ? 'var(--color-accent-secondary)' : 'var(--color-border)',
        backgroundColor: isCompleted ? 'color-mix(in srgb, var(--color-accent-secondary) 5%, var(--color-bg-secondary))' : 'var(--color-bg-secondary)',
        opacity: isCompleted ? 0.85 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-3">
        <Checkbox checked={isCompleted} onChange={handleToggle} size={28} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon size={16} style={{ color: slot.isBookSlot ? 'var(--color-accent-book)' : 'var(--color-text-tertiary)' }} />
            {slot.isBookSlot && <BookOpen size={14} style={{ color: 'var(--color-accent-book)' }} />}
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {slot.label}
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
              <Clock size={12} /> {hours}h
            </span>
            {hasCritical && (
              <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-primary) 15%, transparent)', color: 'var(--color-accent-primary)' }}>
                <Flame size={12} /> Critical
              </span>
            )}
            {hasKeyExercise && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-warning) 15%, transparent)', color: 'var(--color-accent-warning)' }}>
                Key Exercise
              </span>
            )}
            {hasCheckpoint && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-book) 15%, transparent)', color: 'var(--color-accent-book)' }}>
                Checkpoint
              </span>
            )}
            {hasTimed && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-tertiary) 15%, transparent)', color: 'var(--color-text-tertiary)' }}>
                Timed
              </span>
            )}
          </div>

          {/* Completed timestamp */}
          {isCompleted && completion?.completed_at && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-accent-secondary)' }}>
              Completed {formatRelativeTime(completion.completed_at)}
            </div>
          )}

          {/* Expandable description */}
          {expanded && (
            <div className="mt-2">
              <MarkdownBlock content={slot.description} />

              {/* Links */}
              {slot.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {slot.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-accent-primary)' }}
                    >
                      <ExternalLink size={12} /> {link.text}
                    </a>
                  ))}
                </div>
              )}

              {/* Difficulty rating (after completion) */}
              {isCompleted && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Difficulty:</span>
                  {[1, 2, 3].map(d => (
                    <button
                      key={d}
                      onClick={() => updateSlotDifficulty(slot.id, completion?.difficulty === d ? null : d)}
                      className="text-xs px-2 py-0.5 rounded cursor-pointer transition-opacity"
                      style={{
                        backgroundColor: completion?.difficulty === d ? difficultyColors[d] : 'var(--color-bg-tertiary)',
                        color: completion?.difficulty === d ? 'white' : 'var(--color-text-tertiary)',
                      }}
                    >
                      {difficultyLabels[d]}
                    </button>
                  ))}
                </div>
              )}

              {/* Notes toggle */}
              <div className="mt-2">
                <button
                  onClick={() => { setNotesOpen(!notesOpen); setNotesValue(completion?.notes || ''); }}
                  className="text-xs hover:underline cursor-pointer"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {completion?.notes ? 'Edit notes' : '+ Add notes'}
                </button>
                {notesOpen && (
                  <div className="mt-1">
                    <textarea
                      value={notesValue}
                      onChange={e => setNotesValue(e.target.value)}
                      className="w-full rounded-md border p-2 text-sm resize-y"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)',
                        minHeight: 60,
                      }}
                      placeholder="Your notes for this slot..."
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={handleNotesSave}
                        className="text-xs px-3 py-1 rounded cursor-pointer"
                        style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setNotesOpen(false)}
                        className="text-xs px-3 py-1 rounded cursor-pointer"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expand/collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 p-1 rounded cursor-pointer"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
}
