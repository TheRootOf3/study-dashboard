import { useState, useCallback, useRef } from 'react';
import { Upload, Check, AlertCircle, FileJson, X } from 'lucide-react';

// ── Validation ──────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  summary?: { phases: number; weeks: number; slots: number };
}

export function validateStudyPlan(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['JSON root must be an object'] };
  }

  const plan = data as Record<string, unknown>;

  // Top-level required fields
  if (!plan.startDate || typeof plan.startDate !== 'string') errors.push('Missing or invalid "startDate"');
  if (!plan.endDate || typeof plan.endDate !== 'string') errors.push('Missing or invalid "endDate"');
  if (typeof plan.totalWeeks !== 'number') errors.push('Missing or invalid "totalWeeks"');
  if (!plan.schedule || typeof plan.schedule !== 'object') errors.push('Missing or invalid "schedule"');
  if (!Array.isArray(plan.resources)) errors.push('Missing "resources" array');

  if (!Array.isArray(plan.phases) || plan.phases.length === 0) {
    errors.push('Missing or empty "phases" array');
    return { valid: false, errors };
  }

  let totalWeeks = 0;
  let totalSlots = 0;

  for (let pi = 0; pi < plan.phases.length; pi++) {
    const phase = plan.phases[pi] as Record<string, unknown>;
    const phaseLabel = `Phase ${pi + 1}`;

    if (!phase.id) errors.push(`${phaseLabel}: missing "id"`);
    if (typeof phase.number !== 'number') errors.push(`${phaseLabel}: missing "number"`);
    if (!phase.title) errors.push(`${phaseLabel}: missing "title"`);
    if (!Array.isArray(phase.weekRange)) errors.push(`${phaseLabel}: missing "weekRange"`);

    if (!Array.isArray(phase.weeks) || phase.weeks.length === 0) {
      errors.push(`${phaseLabel}: missing or empty "weeks" array`);
      continue;
    }

    for (let wi = 0; wi < phase.weeks.length; wi++) {
      const week = phase.weeks[wi] as Record<string, unknown>;
      const weekLabel = `${phaseLabel} > Week ${wi + 1}`;

      if (!week.id) errors.push(`${weekLabel}: missing "id"`);
      if (typeof week.weekNumber !== 'number') errors.push(`${weekLabel}: missing "weekNumber"`);
      if (typeof week.title !== 'string') errors.push(`${weekLabel}: missing "title"`);

      if (!Array.isArray(week.slots) || week.slots.length === 0) {
        errors.push(`${weekLabel}: missing or empty "slots" array`);
        continue;
      }

      for (let si = 0; si < week.slots.length; si++) {
        const slot = week.slots[si] as Record<string, unknown>;
        const slotLabel = `${weekLabel} > Slot ${si + 1}`;

        if (!slot.id) errors.push(`${slotLabel}: missing "id"`);
        if (!slot.type) errors.push(`${slotLabel}: missing "type"`);
        if (typeof slot.slotNumber !== 'number') errors.push(`${slotLabel}: missing "slotNumber"`);
        if (!slot.label) errors.push(`${slotLabel}: missing "label"`);
      }

      totalSlots += week.slots.length;
      totalWeeks++;
    }
  }

  // Cap errors to avoid overwhelming the user
  const cappedErrors = errors.slice(0, 10);
  if (errors.length > 10) {
    cappedErrors.push(`...and ${errors.length - 10} more errors`);
  }

  return {
    valid: cappedErrors.length === 0,
    errors: cappedErrors,
    summary: { phases: plan.phases.length, weeks: totalWeeks, slots: totalSlots },
  };
}

// ── Component ───────────────────────────────────────────────────────────

interface StudyPlanUploaderProps {
  /** Called with the validated plan data when the user clicks Upload */
  onUpload: (data: Record<string, unknown>) => Promise<void>;
  /** Called when the user cancels / skips */
  onCancel: () => void;
  /** Label for the cancel button (default: "Skip") */
  cancelLabel?: string;
}

export function StudyPlanUploader({ onUpload, onCancel, cancelLabel = 'Skip' }: StudyPlanUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [parsedPlan, setParsedPlan] = useState<Record<string, unknown> | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setParsedPlan(null);
    setValidation(null);
    setParseError(null);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const result = validateStudyPlan(json);
        setParsedPlan(json);
        setValidation(result);
      } catch (err) {
        setParseError(`Invalid JSON: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleUpload = useCallback(async () => {
    if (!parsedPlan || !validation?.valid) return;
    setUploading(true);
    setUploadError(null);
    try {
      await onUpload(parsedPlan);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }, [parsedPlan, validation, onUpload]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className="rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors"
        style={{
          borderColor: dragOver ? 'var(--color-accent-primary)' : 'var(--color-border)',
          backgroundColor: dragOver
            ? 'color-mix(in srgb, var(--color-accent-primary) 5%, var(--color-bg-primary))'
            : 'var(--color-bg-primary)',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileSelect}
        />
        <FileJson
          size={32}
          className="mx-auto mb-2"
          style={{ color: 'var(--color-text-tertiary)' }}
        />
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Drag and drop a <code style={{ fontFamily: 'var(--font-mono)' }}>studyPlan.json</code> file here
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          or click to browse
        </p>
      </div>

      {/* Parse error */}
      {parseError && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: 'color-mix(in srgb, #e53e3e 10%, var(--color-bg-primary))',
            color: '#e53e3e',
          }}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{parseError}</span>
        </div>
      )}

      {/* Validation errors */}
      {validation && !validation.valid && (
        <div
          className="p-4 rounded-lg space-y-2"
          style={{
            backgroundColor: 'color-mix(in srgb, #e53e3e 8%, var(--color-bg-primary))',
          }}
        >
          <p className="text-sm font-semibold" style={{ color: '#e53e3e' }}>
            Validation failed
          </p>
          <ul className="list-disc list-inside space-y-1">
            {validation.errors.map((err, i) => (
              <li
                key={i}
                className="text-xs"
                style={{ color: '#e53e3e', fontFamily: 'var(--font-mono)' }}
              >
                {err}
              </li>
            ))}
          </ul>
          {validation.summary && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
              Detected: {validation.summary.phases} phases, {validation.summary.weeks} weeks, {validation.summary.slots} slots
            </p>
          )}
        </div>
      )}

      {/* Validation success */}
      {validation?.valid && (
        <div
          className="p-4 rounded-lg space-y-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-accent-secondary) 10%, var(--color-bg-primary))',
          }}
        >
          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-accent-secondary)' }}>
            <Check size={16} />
            Plan is valid
          </p>
          {validation.summary && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {validation.summary.phases} phase{validation.summary.phases !== 1 ? 's' : ''},{' '}
              {validation.summary.weeks} week{validation.summary.weeks !== 1 ? 's' : ''},{' '}
              {validation.summary.slots} slot{validation.summary.slots !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: 'color-mix(in srgb, #e53e3e 10%, var(--color-bg-primary))',
            color: '#e53e3e',
          }}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleUpload}
          disabled={!validation?.valid || uploading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: validation?.valid ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
            color: validation?.valid ? '#fff' : 'var(--color-text-tertiary)',
          }}
        >
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Upload study plan'}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <X size={14} />
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
