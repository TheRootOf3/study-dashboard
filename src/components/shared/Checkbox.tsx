import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: number;
}

export function Checkbox({ checked, onChange, size = 24 }: CheckboxProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110"
      style={{
        width: size,
        height: size,
        borderColor: checked ? 'var(--color-accent-secondary)' : 'var(--color-border)',
        backgroundColor: checked ? 'var(--color-accent-secondary)' : 'transparent',
      }}
    >
      {checked && (
        <Check size={size - 8} color="white" strokeWidth={3} className="checkmark-animate" />
      )}
    </button>
  );
}
