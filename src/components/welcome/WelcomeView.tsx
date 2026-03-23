import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Copy, Check, AlertCircle, FileJson, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { studyPlanApi } from '../../api/client';
import { useProgress } from '../../context/ProgressContext';

const LLM_PROMPT = `Generate a structured study plan JSON for learning [SUBJECT] over [N] weeks. Follow this exact schema:

{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "totalWeeks": N,
  "schedule": { "description": "...", "totalHoursPerWeek": N, "sessionStructures": {}, "defaultDayMapping": {} },
  "resources": [{ "name": "...", "url": "...", "category": "course|book|video|paper|reference", "phases": [1] }],
  "phases": [{
    "id": "phase-1",
    "number": 1,
    "title": "...",
    "course": "...",
    "courseUrl": "...",
    "description": "...",
    "bookChapters": "...",
    "bookDescription": "...",
    "weekRange": [1, 7],
    "completionNote": "...",
    "weeks": [{
      "id": "week-1",
      "weekNumber": 1,
      "dateRange": "...",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "title": "...",
      "isBuffer": false,
      "slots": [{
        "id": "week-1-train-1",
        "type": "train",
        "slotNumber": 1,
        "label": "Session 1",
        "description": "Markdown description of what to study",
        "isBookSlot": false,
        "estimatedMinutes": 120,
        "tags": [],
        "links": [{ "text": "...", "url": "..." }],
        "subtasks": [{ "id": "week-1-train-1-sub-1", "label": "..." }]
      }]
    }]
  }]
}

Rules:
- Each week has 7 slots: train-1 through train-4 (longer study sessions) and evening-1 through evening-3 (practice/exercise sessions)
- Slot IDs follow: week-{N}-{type}-{slotNumber}
- Subtask IDs follow: {slotId}-sub-{N}
- train-4 and evening-3 should have isBookSlot: true (parallel reading track)
- Buffer/consolidation weeks should have isBuffer: true
- Tags: "critical", "connection", "key-exercise", "checkpoint", "timed", "from-scratch"
- Include subtasks for each slot (individual checkable items)
- Include links to relevant course materials`;

interface ValidationResult {
  valid: boolean;
  errors: string[];
  summary?: { phases: number; weeks: number; slots: number };
}

function validateStudyPlan(data: unknown): ValidationResult {
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

export function WelcomeView() {
  const navigate = useNavigate();
  const { refreshData } = useProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [parsedPlan, setParsedPlan] = useState<Record<string, unknown> | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadingExample, setLoadingExample] = useState(false);

  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(LLM_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = LLM_PROMPT;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

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

  const uploadPlan = useCallback(async () => {
    if (!parsedPlan || !validation?.valid) return;
    setUploading(true);
    setUploadError(null);
    try {
      await studyPlanApi.update(parsedPlan);
      await refreshData();
      navigate('/');
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }, [parsedPlan, validation, navigate, refreshData]);

  const loadExamplePlan = useCallback(async () => {
    setLoadingExample(true);
    setUploadError(null);
    try {
      // Try fetching the seeded study plan
      const plan = await studyPlanApi.get();
      if (plan) {
        await refreshData();
        navigate('/');
      }
    } catch {
      setUploadError('No example plan found. Upload a study plan JSON to get started.');
    } finally {
      setLoadingExample(false);
    }
  }, [navigate, refreshData]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1
            className="text-3xl lg:text-4xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
          >
            Welcome to Maths Dashboard
          </h1>
          <p
            className="text-lg"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            A focused study tracker to keep your learning on schedule.
            <br />
            To get started, generate a study plan and upload it below.
          </p>
        </div>

        {/* Step 1: Generate Prompt */}
        <div
          className="rounded-xl border p-6 space-y-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0"
              style={{ backgroundColor: 'var(--color-accent-primary)', color: '#fff' }}
            >
              1
            </span>
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
            >
              Generate your study plan
            </h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Copy the prompt below and paste it into your favourite LLM (ChatGPT, Claude, etc.).
            Customise the <strong>[SUBJECT]</strong> and <strong>[N] weeks</strong> placeholders, then save the JSON output to a file.
          </p>

          {/* Prompt code block */}
          <div className="relative">
            <div
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <pre
                className={`text-xs leading-relaxed p-4 overflow-x-auto transition-all ${promptExpanded ? '' : 'max-h-48 overflow-hidden'}`}
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {LLM_PROMPT}
              </pre>
              {!promptExpanded && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                  style={{
                    background: 'linear-gradient(transparent, var(--color-bg-primary))',
                  }}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copyPrompt}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: copied ? 'var(--color-accent-secondary)' : 'var(--color-accent-primary)',
                color: '#fff',
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy prompt'}
            </button>
            <button
              onClick={() => setPromptExpanded(!promptExpanded)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {promptExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {promptExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {/* Step 2: Upload Plan */}
        <div
          className="rounded-xl border p-6 space-y-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0"
              style={{ backgroundColor: 'var(--color-accent-primary)', color: '#fff' }}
            >
              2
            </span>
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
            >
              Upload your plan
            </h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Drop the JSON file here or click to browse. The plan will be validated before upload.
          </p>

          {/* Drop zone */}
          <div
            className="rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
            style={{
              borderColor: dragOver ? 'var(--color-accent-primary)' : 'var(--color-border)',
              backgroundColor: dragOver ? 'color-mix(in srgb, var(--color-accent-primary) 5%, var(--color-bg-primary))' : 'var(--color-bg-primary)',
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
              size={40}
              className="mx-auto mb-3"
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

          {/* Upload button */}
          <button
            onClick={uploadPlan}
            disabled={!validation?.valid || uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: validation?.valid ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
              color: validation?.valid ? '#fff' : 'var(--color-text-tertiary)',
            }}
          >
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Upload study plan'}
          </button>
        </div>

        {/* Load example plan */}
        <div className="text-center">
          <div
            className="inline-block rounded-xl border px-6 py-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Already have a seeded plan in the database?
            </p>
            <button
              onClick={loadExamplePlan}
              disabled={loadingExample}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
              }}
            >
              <Sparkles size={16} />
              {loadingExample ? 'Loading...' : 'Load example plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
