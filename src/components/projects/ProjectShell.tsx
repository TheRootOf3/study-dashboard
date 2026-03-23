import { useParams, Outlet } from 'react-router-dom';
import { useProjects } from '../../context/ProjectsContext';
import { ProgressProvider } from '../../context/ProgressContext';

export function ProjectShell() {
  const { slug } = useParams<{ slug: string }>();
  const { projects } = useProjects();
  const project = projects.find(p => p.slug === slug);

  if (!project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Project not found
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            No project with slug &ldquo;{slug}&rdquo; exists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProgressProvider
      projectId={project.id}
      projectSlug={project.slug}
      scheduleConfigJson={project.schedule_config}
      actualStartDate={project.actual_start_date}
    >
      <Outlet />
    </ProgressProvider>
  );
}
