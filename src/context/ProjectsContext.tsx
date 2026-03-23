import { createContext, useContext, useEffect, useCallback, useState, useRef, type ReactNode } from 'react';
import { projectsApi, globalSettingsApi, type Project, type GlobalSettings } from '../api/client';

interface ProjectsContextValue {
  projects: Project[];
  createProject: (name: string, color?: string) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  globalTheme: string;
  setGlobalTheme: (theme: string) => Promise<void>;
  loading: boolean;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [globalTheme, setGlobalThemeState] = useState<string>('light');
  const [loading, setLoading] = useState(true);

  const systemThemeApplied = useRef(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectList, settings] = await Promise.all([
        projectsApi.list(),
        globalSettingsApi.get().catch((): GlobalSettings => ({ theme: 'light' })),
      ]);
      setProjects(projectList);
      setGlobalThemeState(settings.theme);
    } catch {
      // On a completely fresh DB both calls may fail -- start with defaults
      setProjects([]);
      setGlobalThemeState('light');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // On first load, detect OS theme preference and apply if DB theme is 'light'
  useEffect(() => {
    if (loading || systemThemeApplied.current) return;
    systemThemeApplied.current = true;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark && globalTheme === 'light') {
      setGlobalTheme('dark');
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Always sync the dark class with the current theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', globalTheme === 'dark');
  }, [globalTheme]);

  const createProject = useCallback(async (name: string, color?: string) => {
    const project = await projectsApi.create({ name, color });
    setProjects(prev => [...prev, project]);
    return project;
  }, []);

  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    const updated = await projectsApi.update(id, data);
    setProjects(prev => prev.map(p => (p.id === id ? updated : p)));
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await projectsApi.remove(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const refreshProjects = useCallback(async () => {
    const list = await projectsApi.list();
    setProjects(list);
  }, []);

  const setGlobalTheme = useCallback(async (theme: string) => {
    const settings = await globalSettingsApi.update({ theme });
    setGlobalThemeState(settings.theme);
  }, []);

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects,
        globalTheme,
        setGlobalTheme,
        loading,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider');
  return ctx;
}
