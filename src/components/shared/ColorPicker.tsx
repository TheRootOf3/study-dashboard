const COLORS = [
  '#6366f1', // indigo (default)
  '#e74c3c', // red
  '#e67e22', // orange
  '#f1c40f', // yellow
  '#2ecc71', // green
  '#1abc9c', // teal
  '#3498db', // blue
  '#9b59b6', // purple
  '#e91e63', // pink
  '#795548', // brown
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const selected = value || COLORS[0];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {COLORS.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="w-6 h-6 rounded-full cursor-pointer shrink-0 transition-transform"
          style={{
            backgroundColor: color,
            boxShadow: selected === color ? `0 0 0 2px var(--color-bg-secondary), 0 0 0 4px ${color}` : 'none',
            transform: selected === color ? 'scale(1.15)' : 'scale(1)',
          }}
          title={color}
        />
      ))}
    </div>
  );
}

export { COLORS };
