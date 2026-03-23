import { useState } from 'react';
import { Download, Upload, Sun, Moon, Trash2, Plus, Pencil, Check, X, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { useProjects } from '../../context/ProjectsContext';
import { backupApi, studyPlanApi, projectsApi } from '../../api/client';
import { ColorPicker } from '../shared/ColorPicker';
import { StudyPlanUploader } from '../shared/StudyPlanUploader';
import { LLM_PROMPT } from '../../utils/llmPrompt';

export function SettingsView() {
  const { projects, globalTheme, setGlobalTheme, createProject, updateProject, deleteProject, refreshProjects } = useProjects();
  const [message, setMessage] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const [uploadingForProjectId, setUploadingForProjectId] = useState<string | null>(null);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const flash = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 2000); };

  const isDark = globalTheme === 'dark';

  // --- Data ---
  const handleExport = async () => {
    const data = await backupApi.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `study-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    flash('Progress exported');
  };
  const handleImport = async () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
      await backupApi.importData(JSON.parse(await file.text()));
      await refreshProjects();
      flash('Progress imported');
    };
    input.click();
  };
  const handleCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    const project = await createProject(name);
    setNewProjectName('');
    setUploadingForProjectId(project.id);
    flash('Project created — upload a study plan or skip');
  };

  const handleStudyPlanUpload = async (projectId: string, data: Record<string, unknown>) => {
    await studyPlanApi(projectId).update(data);
    if (data.startDate && typeof data.startDate === 'string') {
      await projectsApi.update(projectId, { actual_start_date: data.startDate });
      await refreshProjects();
    }
    setUploadingForProjectId(null);
    flash('Study plan uploaded');
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project and all its data?')) return;
    await deleteProject(id);
    flash('Project deleted');
  };

  const handleRenameProject = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    await updateProject(id, { name });
    setEditingId(null);
    flash('Project renamed');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>

      {message && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-secondary) 10%, transparent)', color: 'var(--color-accent-secondary)' }}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Theme */}
        <Section title="Theme">
          <button
            onClick={() => setGlobalTheme(isDark ? 'light' : 'dark')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer"
            style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          </button>
        </Section>

        {/* Projects */}
        <Section title="Projects" subtitle="Manage your study projects.">
          <div className="space-y-2 mb-3">
            {projects.map(p => (
              <div key={p.id} className="px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-3 h-3 rounded-full shrink-0 cursor-pointer transition-transform hover:scale-125"
                    style={{ backgroundColor: p.color || 'var(--color-accent-primary)' }}
                    onClick={() => setColorPickerId(colorPickerId === p.id ? null : p.id)}
                    title="Change project color"
                  />
                  {editingId === p.id ? (
                    <>
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 rounded border text-sm"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameProject(p.id); if (e.key === 'Escape') setEditingId(null); }}
                        autoFocus
                      />
                      <button onClick={() => handleRenameProject(p.id)} className="p-1 rounded cursor-pointer" style={{ color: 'var(--color-accent-secondary)' }}><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 rounded cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.name}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{p.slug}</span>
                      <button onClick={() => { setEditingId(p.id); setEditName(p.name); }} className="p-1 rounded cursor-pointer hover:opacity-70" style={{ color: 'var(--color-text-tertiary)' }}><Pencil size={14} /></button>
                      <button onClick={() => handleDeleteProject(p.id)} className="p-1 rounded cursor-pointer hover:opacity-70" style={{ color: 'var(--color-text-tertiary)' }}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
                {colorPickerId === p.id && (
                  <div className="mt-2 ml-5">
                    <ColorPicker
                      value={p.color || '#6366f1'}
                      onChange={async (color) => {
                        await updateProject(p.id, { color });
                        setColorPickerId(null);
                        flash('Project color updated');
                      }}
                    />
                  </div>
                )}
                {uploadingForProjectId === p.id && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Upload a study plan for <strong>{p.name}</strong>
                    </p>
                    <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      Use an LLM to generate a plan, then upload the JSON.
                    </p>

                    {/* LLM Prompt */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => setPromptExpanded(!promptExpanded)}
                          className="flex items-center gap-1 text-xs cursor-pointer hover:opacity-80"
                          style={{ color: 'var(--color-accent-primary)' }}
                        >
                          {promptExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {promptExpanded ? 'Hide prompt' : 'Show LLM prompt'}
                        </button>
                        <button
                          onClick={async () => {
                            try { await navigator.clipboard.writeText(LLM_PROMPT); } catch { /* fallback */ }
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="flex items-center gap-1 text-xs cursor-pointer hover:opacity-80"
                          style={{ color: copied ? 'var(--color-accent-secondary)' : 'var(--color-text-tertiary)' }}
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          {copied ? 'Copied!' : 'Copy prompt'}
                        </button>
                      </div>
                      {promptExpanded && (
                        <pre
                          className="text-xs leading-relaxed p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-tertiary)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {LLM_PROMPT}
                        </pre>
                      )}
                    </div>

                    <StudyPlanUploader
                      onUpload={(data) => handleStudyPlanUpload(p.id, data)}
                      onCancel={() => setUploadingForProjectId(null)}
                      cancelLabel="Skip"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              placeholder="New project name..."
              className="flex-1 px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateProject(); }}
            />
            <button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-md text-sm cursor-pointer disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-accent-primary)', color: 'white' }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </Section>

        {/* Export/Import */}
        <Section title="Data">
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
              <Download size={16} /> Export
            </button>
            <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
              <Upload size={16} /> Import
            </button>
          </div>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
      {subtitle && <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>{subtitle}</p>}
      {children}
    </div>
  );
}
