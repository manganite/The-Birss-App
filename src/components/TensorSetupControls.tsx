import { Activity, Zap } from 'lucide-react';
import type { TensorType, TensorTimeReversal } from '../services/tensorCalculator';
import { TENSOR_META } from '../types';
import { SectionHeader } from './MathComponents';
import { TermInfo } from './TermInfo';

interface NavigateProp {
  onNavigate?: (view: string, tab?: string) => void;
}

export function TensorClassificationControl({
  value,
  onChange,
  onNavigate,
}: {
  value: TensorType;
  onChange: (t: TensorType) => void;
} & NavigateProp) {
  return (
    <div className="flex-1 space-y-4">
      <SectionHeader icon={<Zap className="w-3 h-3" />}>Tensor Classification</SectionHeader>
      <div className="flex flex-wrap gap-2">
        {(['ED', 'MD', 'EQ'] as const).map((type) => (
          <div key={type} className="flex items-center gap-1">
            <button
              type="button"
              aria-pressed={value === type}
              onClick={() => onChange(type)}
              className={`px-4 py-2 text-xs font-medium transition-colors border border-ink ${
                value === type
                  ? 'bg-ink text-paper'
                  : 'hover:bg-ink/5 text-ink/70 hover:text-ink border-opacity-20'
              }`}
            >
              {TENSOR_META[type].label}
            </button>
            <TermInfo id={type.toLowerCase()} onNavigate={onNavigate} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimeReversalControl({
  value,
  onChange,
  onNavigate,
}: {
  value: TensorTimeReversal;
  onChange: (tr: TensorTimeReversal) => void;
} & NavigateProp) {
  return (
    <div className="flex-1 space-y-4">
      <SectionHeader icon={<Activity className="w-3 h-3" />}>Time-Reversal Symmetry</SectionHeader>
      <div className="flex flex-wrap gap-2">
        {(['i', 'c'] as const).map((tr) => (
          <div key={tr} className="flex items-center gap-1">
            <button
              type="button"
              aria-pressed={value === tr}
              onClick={() => onChange(tr)}
              className={`px-4 py-2 text-xs font-medium transition-colors border border-ink ${
                value === tr
                  ? 'bg-ink text-paper'
                  : 'hover:bg-ink/5 text-ink/70 hover:text-ink border-opacity-20'
              }`}
            >
              {tr === 'i' ? 'i-type (Time-Even)' : 'c-type (Time-Odd)'}
            </button>
            <TermInfo id={`${tr}-type`} onNavigate={onNavigate} />
          </div>
        ))}
      </div>
    </div>
  );
}
