import { Train, Moon, BookOpen, Sun, PencilLine, GraduationCap, Circle, type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'train': Train,
  'moon': Moon,
  'book-open': BookOpen,
  'sun': Sun,
  'pencil-line': PencilLine,
  'graduation-cap': GraduationCap,
  'circle': Circle,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Circle;
}
