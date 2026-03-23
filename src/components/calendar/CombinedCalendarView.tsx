import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { useProjects } from '../../context/ProjectsContext';

export function CombinedCalendarView() {
  const { projects } = useProjects();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
        Calendars
      </h2>

      <div className="space-y-3">
        {projects.map(p => (
          <Link
            key={p.id}
            to={`/p/${p.slug}/calendar`}
            className="flex items-center gap-3 rounded-lg border p-4 hover:opacity-90 transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color || 'var(--color-accent-primary)' }} />
            <Calendar size={18} style={{ color: 'var(--color-text-tertiary)' }} />
            <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {p.name}
            </span>
            <ArrowRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
