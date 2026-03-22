import { useState, useMemo } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { getPhaseColor } from '../../utils/progressCalc';

const CATEGORY_LABELS: Record<string, string> = {
  course: 'Courses',
  book: 'Books',
  video: 'Video Playlists',
  paper: 'Papers',
  reference: 'Reference',
};

const CATEGORY_COLORS: Record<string, string> = {
  course: 'var(--color-accent-primary)',
  book: 'var(--color-accent-book)',
  video: 'var(--color-accent-secondary)',
  paper: 'var(--color-phase-4)',
  reference: 'var(--color-text-tertiary)',
};

export function ResourcesView() {
  const { studyPlan } = useProgress();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(studyPlan.resources.map(r => r.category));
    return Array.from(cats);
  }, [studyPlan.resources]);

  const filtered = useMemo(() => {
    return studyPlan.resources.filter(r => {
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [studyPlan.resources, search, categoryFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const r of filtered) {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Resources</h2>

      {/* Search and filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
          />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setCategoryFilter(null)}
            className="text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors"
            style={{
              backgroundColor: !categoryFilter ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
              color: !categoryFilter ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className="text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors"
              style={{
                backgroundColor: categoryFilter === cat ? CATEGORY_COLORS[cat] : 'var(--color-bg-tertiary)',
                color: categoryFilter === cat ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource cards */}
      {Object.entries(grouped).map(([category, resources]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: CATEGORY_COLORS[category] }}>
            {CATEGORY_LABELS[category] || category}
          </h3>
          <div className="grid gap-2">
            {resources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{r.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `color-mix(in srgb, ${CATEGORY_COLORS[r.category]} 15%, transparent)`, color: CATEGORY_COLORS[r.category] }}
                    >
                      {r.category}
                    </span>
                    {r.phases.map(p => (
                      <span key={p} className="text-xs" style={{ color: getPhaseColor(p) }}>
                        Phase {p}
                      </span>
                    ))}
                  </div>
                </div>
                <ExternalLink size={16} style={{ color: 'var(--color-accent-primary)' }} />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
