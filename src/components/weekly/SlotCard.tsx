import { useState, useRef, useEffect } from 'react';
import { Flame, ChevronDown, ChevronUp, ExternalLink, Clock, Check, Pencil, ArrowUpDown } from 'lucide-react';
import { Checkbox } from '../shared/Checkbox';
import { MarkdownBlock } from '../shared/MarkdownBlock';
import { useProgress } from '../../context/ProgressContext';
import { formatRelativeTime } from '../../utils/dateUtils';
import { getSlotDisplay } from '../../utils/scheduleConfig';
import { getIcon } from '../../utils/iconMap';
import { updateSlotInPlan, reorderSlotInPlan, moveSlotToWeek, getAllWeeks } from '../../utils/planEditor';
import type { Slot } from '../../utils/progressCalc';

interface SlotCardProps {
  slot: Slot;
  compact?: boolean;
  /** Week number this slot belongs to. Required for editing features. */
  weekNumber?: number;
  /** All slot IDs in display order within the same group, for reordering. */
  siblingSlotIds?: string[];
}

export function SlotCard({ slot, compact = false, weekNumber, siblingSlotIds }: SlotCardProps) {
  const { state, studyPlan, scheduleConfig, toggleCompletion, toggleSubtask, updateSlotNotes, updateSlotDifficulty, updateStudyPlan } = useProgress();
  const completion = state.completions.get(slot.id);
  const isCompleted = !!completion?.completed;
  const [expanded, setExpanded] = useState(!compact);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesValue, setNotesValue] = useState(completion?.notes || '');

  // Editing state
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(slot.description);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const moveMenuRef = useRef<HTMLDivElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  const canEdit = weekNumber !== undefined;

  // Close move menu on outside click
  useEffect(() => {
    if (!moveMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setMoveMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moveMenuOpen]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingDescription && descTextareaRef.current) {
      descTextareaRef.current.focus();
      descTextareaRef.current.selectionStart = descTextareaRef.current.value.length;
    }
  }, [editingDescription]);

  const slotKey = `${slot.type}-${slot.slotNumber}`;
  const displayConfig = getSlotDisplay(slotKey, scheduleConfig);
  const Icon = getIcon(displayConfig.icon);
  const hasCritical = slot.tags.includes('critical');
  const hasKeyExercise = slot.tags.includes('key-exercise');
  const hasCheckpoint = slot.tags.includes('checkpoint');
  const hasTimed = slot.tags.includes('timed');
  const hours = slot.estimatedMinutes / 60;
  const hasSubtasks = slot.subtasks && slot.subtasks.length > 1;

  // Count completed subtasks
  const completedSubtasks = hasSubtasks
    ? slot.subtasks.filter(st => state.subtaskCompletions.has(st.id)).length
    : 0;

  const handleSlotToggle = async (checked: boolean) => {
    await toggleCompletion(slot.id, checked);
    // When toggling the whole slot, also toggle all subtasks
    if (hasSubtasks) {
      for (const st of slot.subtasks) {
        const isSubDone = state.subtaskCompletions.has(st.id);
        if (checked !== isSubDone) {
          await toggleSubtask(st.id, checked, slot.id, slot.subtasks.length);
        }
      }
    }
  };

  const handleSubtaskToggle = async (subtaskId: string, checked: boolean) => {
    await toggleSubtask(subtaskId, checked, slot.id, slot.subtasks.length);
  };

  const handleNotesSave = async () => {
    await updateSlotNotes(slot.id, notesValue);
    setNotesOpen(false);
  };

  // --- Edit description ---
  const handleDescriptionSave = async () => {
    if (!canEdit || descriptionValue === slot.description) {
      setEditingDescription(false);
      return;
    }
    setSaving(true);
    const newPlan = updateSlotInPlan(studyPlan, weekNumber!, slot.id, { description: descriptionValue });
    await updateStudyPlan(newPlan);
    setSaving(false);
    setEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setDescriptionValue(slot.description);
    setEditingDescription(false);
  };

  // --- Move to week ---
  const handleMoveToWeek = async (targetWeekNumber: number) => {
    if (!canEdit || targetWeekNumber === weekNumber) return;
    setSaving(true);
    setMoveMenuOpen(false);
    const newPlan = moveSlotToWeek(studyPlan, weekNumber!, targetWeekNumber, slot.id);
    await updateStudyPlan(newPlan);
    setSaving(false);
  };

  // --- Reorder within week ---
  const handleReorder = async (direction: 'up' | 'down') => {
    if (!canEdit || !siblingSlotIds) return;
    const idx = siblingSlotIds.indexOf(slot.id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblingSlotIds.length) return;
    setSaving(true);
    const newPlan = reorderSlotInPlan(studyPlan, weekNumber!, slot.id, siblingSlotIds[swapIdx]);
    await updateStudyPlan(newPlan);
    setSaving(false);
  };

  const canMoveUp = siblingSlotIds ? siblingSlotIds.indexOf(slot.id) > 0 : false;
  const canMoveDown = siblingSlotIds ? siblingSlotIds.indexOf(slot.id) < siblingSlotIds.length - 1 : false;

  const allWeeks = canEdit ? getAllWeeks(studyPlan) : [];

  const difficultyColors = ['', 'var(--color-accent-secondary)', 'var(--color-accent-warning)', 'var(--color-accent-primary)'];
  const difficultyLabels = ['', 'Easy', 'Medium', 'Hard'];

  return (
    <div
      className="rounded-lg border transition-all duration-200"
      style={{
        borderColor: isCompleted
          ? 'var(--color-accent-secondary)'
          : slot.isAdditionalContent
            ? 'color-mix(in srgb, var(--color-accent-book) 40%, var(--color-border))'
            : 'var(--color-border)',
        borderLeft: slot.isAdditionalContent ? '3px solid var(--color-accent-book)' : undefined,
        backgroundColor: isCompleted
          ? 'color-mix(in srgb, var(--color-accent-secondary) 5%, var(--color-bg-secondary))'
          : slot.isAdditionalContent
            ? 'color-mix(in srgb, var(--color-accent-book) 4%, var(--color-bg-secondary))'
            : 'var(--color-bg-secondary)',
        opacity: isCompleted ? 0.85 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-3">
        <Checkbox checked={isCompleted} onChange={handleSlotToggle} size={28} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon size={16} style={{ color: slot.isAdditionalContent ? 'var(--color-accent-book)' : 'var(--color-text-tertiary)' }} />
            {slot.isAdditionalContent && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-book) 15%, transparent)', color: 'var(--color-accent-book)' }}>
                Additional
              </span>
            )}
            <span className="font-semibold text-sm" style={{ color: slot.isAdditionalContent ? 'var(--color-accent-book)' : 'var(--color-text-primary)' }}>
              {displayConfig.label}
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
              <Clock size={12} /> {hours}h
            </span>
            {hasSubtasks && (
              <span className="text-xs font-mono" style={{ color: completedSubtasks === slot.subtasks.length ? 'var(--color-accent-secondary)' : 'var(--color-text-tertiary)' }}>
                {completedSubtasks}/{slot.subtasks.length}
              </span>
            )}
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
            {saving && (
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Saving...</span>
            )}
          </div>

          {/* Completed timestamp */}
          {isCompleted && completion?.completed_at && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-accent-secondary)' }}>
              Completed {formatRelativeTime(completion.completed_at)}
            </div>
          )}

          {/* Subtask checklist */}
          {expanded && hasSubtasks && (
            <div className="mt-2 space-y-1">
              {slot.subtasks.map(st => {
                const isDone = state.subtaskCompletions.has(st.id);
                return (
                  <label
                    key={st.id}
                    className="flex items-start gap-2 py-1 px-2 rounded-md cursor-pointer hover:opacity-80 transition-colors"
                    style={{ backgroundColor: isDone ? 'color-mix(in srgb, var(--color-accent-secondary) 6%, transparent)' : 'transparent' }}
                  >
                    <button
                      onClick={() => handleSubtaskToggle(st.id, !isDone)}
                      className="flex-shrink-0 mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer"
                      style={{
                        borderColor: isDone ? 'var(--color-accent-secondary)' : 'var(--color-border)',
                        backgroundColor: isDone ? 'var(--color-accent-secondary)' : 'transparent',
                      }}
                    >
                      {isDone && <Check size={12} color="white" strokeWidth={3} />}
                    </button>
                    <span
                      className="text-sm leading-snug"
                      style={{
                        color: isDone ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}
                    >
                      {st.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Expandable description */}
          {expanded && (
            <div className="mt-2">
              {editingDescription ? (
                <div>
                  <textarea
                    ref={descTextareaRef}
                    value={descriptionValue}
                    onChange={e => setDescriptionValue(e.target.value)}
                    className="w-full rounded-md border p-2 text-sm resize-y font-mono"
                    style={{
                      borderColor: 'var(--color-accent-primary)',
                      backgroundColor: 'var(--color-bg-primary)',
                      color: 'var(--color-text-primary)',
                      minHeight: 80,
                    }}
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={handleDescriptionSave}
                      disabled={saving}
                      className="text-xs px-3 py-1 rounded cursor-pointer"
                      style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleDescriptionCancel}
                      className="text-xs px-3 py-1 rounded cursor-pointer"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <MarkdownBlock content={slot.description} />
              )}

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

              {/* Edit toolbar — only when expanded and weekNumber is provided */}
              {canEdit && !editingDescription && (
                <div className="flex items-center gap-1 mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  {/* Edit description */}
                  <button
                    onClick={() => { setDescriptionValue(slot.description); setEditingDescription(true); }}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-80 cursor-pointer transition-opacity"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    title="Edit description"
                  >
                    <Pencil size={12} /> Edit
                  </button>

                  {/* Move to week */}
                  <div className="relative" ref={moveMenuRef}>
                    <button
                      onClick={() => setMoveMenuOpen(!moveMenuOpen)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-80 cursor-pointer transition-opacity"
                      style={{ color: 'var(--color-text-tertiary)' }}
                      title="Move to another week"
                    >
                      <ArrowUpDown size={12} /> Move to...
                    </button>
                    {moveMenuOpen && (
                      <div
                        className="absolute left-0 bottom-full mb-1 z-50 rounded-lg border shadow-lg overflow-y-auto"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          borderColor: 'var(--color-border)',
                          maxHeight: 240,
                          minWidth: 220,
                        }}
                      >
                        {allWeeks.map(w => (
                          <button
                            key={w.weekNumber}
                            disabled={w.weekNumber === weekNumber}
                            onClick={() => handleMoveToWeek(w.weekNumber)}
                            className="block w-full text-left text-xs px-3 py-1.5 hover:opacity-80 cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-default"
                            style={{
                              color: w.weekNumber === weekNumber ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                              backgroundColor: w.weekNumber === weekNumber ? 'var(--color-bg-tertiary)' : 'transparent',
                            }}
                          >
                            Week {w.weekNumber}: {w.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reorder up/down */}
                  {siblingSlotIds && siblingSlotIds.length > 1 && (
                    <>
                      <button
                        onClick={() => handleReorder('up')}
                        disabled={!canMoveUp || saving}
                        className="inline-flex items-center text-xs p-1 rounded hover:opacity-80 cursor-pointer transition-opacity disabled:opacity-30 disabled:cursor-default"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        title="Move up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleReorder('down')}
                        disabled={!canMoveDown || saving}
                        className="inline-flex items-center text-xs p-1 rounded hover:opacity-80 cursor-pointer transition-opacity disabled:opacity-30 disabled:cursor-default"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        title="Move down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </>
                  )}
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
