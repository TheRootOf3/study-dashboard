import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { studyPlanApi, projectsApi } from '../../api/client';
import { useProjects } from '../../context/ProjectsContext';
import { ColorPicker, COLORS } from '../shared/ColorPicker';
import { StudyPlanUploader } from '../shared/StudyPlanUploader';
import { LLM_PROMPT } from '../../utils/llmPrompt';


export function WelcomeView() {
  const navigate = useNavigate();
  const { refreshProjects } = useProjects();

  const [projectName, setProjectName] = useState('');
  const [projectColor, setProjectColor] = useState(COLORS[0]);
  const [copied, setCopied] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);

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

  const handleUpload = useCallback(async (planData: Record<string, unknown>) => {
    const name = projectName.trim() || 'My Study Plan';
    // 1. Create a project
    const project = await projectsApi.create({ name, color: projectColor });
    // 2. Upload the study plan to that project
    await studyPlanApi(project.id).update(planData);
    // 3. Set the actual_start_date from the plan
    if (planData.startDate && typeof planData.startDate === 'string') {
      await projectsApi.update(project.id, { actual_start_date: planData.startDate });
    }
    // 4. Refresh and navigate
    await refreshProjects();
    navigate('/');
  }, [projectName, projectColor, navigate, refreshProjects]);

  const handleCancel = useCallback(() => {
    // No-op on welcome screen -- user can simply not upload
  }, []);

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
            Welcome to Study Dashboard
          </h1>
          <p
            className="text-lg"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            Track multiple study projects with flexible schedules.
          </p>
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Define any number of phases, weeks, and sessions per week.
            Use an LLM to generate your study plan, then upload it.
            You can add more projects later from Settings.
          </p>
        </div>

        {/* Step 0: Project name */}
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
              Name your project
            </h2>
          </div>
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="e.g. Mathematics Recap, ML Foundations..."
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
            }}
          />
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-tertiary)' }}>
              Project color
            </label>
            <ColorPicker value={projectColor} onChange={setProjectColor} />
          </div>
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
              2
            </span>
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)' }}
            >
              Generate your study plan
            </h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Copy the prompt below and paste it into an LLM (Claude, ChatGPT, etc.).
            Fill in the <strong>[SUBJECT]</strong>, <strong>[N] weeks</strong>, and <strong>[SCHEDULE]</strong> placeholders.
            The plan structure is fully flexible — any number of phases, weeks, and sessions.
            Save the JSON output to a file.
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
              3
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

          <StudyPlanUploader
            onUpload={handleUpload}
            onCancel={handleCancel}
            cancelLabel="Skip"
          />
        </div>
      </div>
    </div>
  );
}
