import { Activity, Zap, BookOpen } from 'lucide-react';
import { getAlternateSettings, getFutureSettingCount } from '../services/tensorCalculator';
import type { TensorType, TensorTimeReversal } from '../services/tensorCalculator';
import { getSettingLabels, getConventionNote, getBookErrorWarning, CONVENTION_NOTES } from '../services/conventionMapping';
import type { Convention } from '../services/conventionMapping';
import { TENSOR_META } from '../types';
import { SectionHeader } from './MathComponents';
import { TermInfo } from './TermInfo';

interface NavigateProp {
  onNavigate?: (view: string, tab?: string) => void;
}

export function ConventionControl({
  value,
  onChange,
  onNavigate,
}: {
  value: Convention;
  onChange: (c: Convention) => void;
} & NavigateProp) {
  return (
    <div className="flex-1 space-y-4">
      <SectionHeader>
        Symbol Convention <TermInfo id="convention" onNavigate={onNavigate} />
      </SectionHeader>
      <div className="flex flex-wrap gap-2">
        {(['birss', 'itc'] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={value === c}
            onClick={() => onChange(c)}
            className={`px-4 py-2 text-xs font-medium transition-colors border border-ink ${
              value === c
                ? 'bg-ink text-paper'
                : 'hover:bg-ink/5 opacity-50 hover:opacity-100 border-opacity-20'
            }`}
          >
            {c === 'birss' ? 'Birss (app default)' : 'ITC'}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConventionNote({ groupName }: { groupName: string }) {
  const noteKey = getConventionNote(groupName);
  const bookErrorWarning = getBookErrorWarning(groupName);
  if (!noteKey) return null;
  return (
    <p className="text-xs opacity-60 leading-relaxed flex items-start gap-1.5">
      <BookOpen className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
      <span>
        {CONVENTION_NOTES[noteKey]}
        {bookErrorWarning && <span className="block mt-1">{bookErrorWarning}</span>}
      </span>
    </p>
  );
}

function SettingBadge({ badge }: { badge?: 'birss-standard' | 'itc-standard' }) {
  if (!badge) return null;
  return (
    <span className="opacity-60 normal-case tracking-normal">
      {' '}— {badge === 'birss-standard' ? 'Birss default' : 'ITC standard'}
    </span>
  );
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
                  : 'hover:bg-ink/5 opacity-50 hover:opacity-100 border-opacity-20'
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
                  : 'hover:bg-ink/5 opacity-50 hover:opacity-100 border-opacity-20'
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

export function CrystalSettingControl({
  groupName,
  value,
  onChange,
  onNavigate,
  className = '',
  convention,
}: {
  groupName: string;
  value: number;
  onChange: (s: number) => void;
  className?: string;
  convention: Convention;
} & NavigateProp) {
  const altSettings = getAlternateSettings(groupName);
  const futureCount = getFutureSettingCount(groupName);
  if (!altSettings && !futureCount) return null;
  const settingLabels = getSettingLabels(groupName, convention);
  return (
    <div className={`space-y-3${className ? ` ${className}` : ''}`}>
      <SectionHeader>
        Crystal Setting <TermInfo id="crystal-setting" onNavigate={onNavigate} />
      </SectionHeader>
      {altSettings ? (
        <>
          <div className="flex flex-wrap gap-3">
            {settingLabels.map(({ setting, label, badge }) => (
              <button
                key={setting}
                type="button"
                aria-pressed={value === setting}
                onClick={() => onChange(setting)}
                className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-all border border-ink ${
                  value === setting
                    ? 'bg-ink text-paper'
                    : 'hover:bg-ink hover:text-paper opacity-50 hover:opacity-100 border-opacity-20'
                }`}
              >
                {label}
                <SettingBadge badge={badge} />
              </button>
            ))}
          </div>
          <ConventionNote groupName={groupName} />
        </>
      ) : (
        <>
          <p className="text-xs opacity-40 italic">{futureCount} settings — selection coming</p>
          <ConventionNote groupName={groupName} />
        </>
      )}
    </div>
  );
}
