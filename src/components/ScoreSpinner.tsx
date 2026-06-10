import { Minus, Plus } from 'lucide-react';

interface ScoreSpinnerProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}

export default function ScoreSpinner({ value, onChange, disabled, label }: ScoreSpinnerProps) {
  return (
    <div className="spinner-group" aria-label={label}>
      <button
        type="button"
        className="spinner-btn"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
        aria-label="Restar gol"
      >
        <Minus size={14} />
      </button>
      <input
        className="input score-input"
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const next = Math.min(99, Math.max(0, Number(e.target.value) || 0));
          onChange(next);
        }}
      />
      <button
        type="button"
        className="spinner-btn"
        onClick={() => onChange(Math.min(99, value + 1))}
        disabled={disabled || value >= 99}
        aria-label="Sumar gol"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
