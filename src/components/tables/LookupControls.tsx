import {
  type TensorRank,
  type TensorParity,
  type TensorTimeParity,
  type TensorIntrinsic,
} from '../../services/tensorForms';
import { TENSOR_EFFECTS } from '../../data/tensorEffects';
import { intrinsicLabel, INTRINSIC_TOOLTIP } from '../../data/intrinsicLabels';
import { TermInfo } from '../TermInfo';

const chipBase = 'px-3 py-1.5 text-xs tracking-[0.05em] transition-all border border-ink';
const chipOn = 'bg-ink text-paper';
const chipOff = 'hover:bg-ink hover:text-paper text-ink/70 border-opacity-20';

interface LookupControlsProps {
  mode: 'type' | 'effect';
  setMode: (m: 'type' | 'effect') => void;
  selectedEffectId: string;
  setSelectedEffectId: (id: string) => void;
  rank: TensorRank;
  changeRank: (r: TensorRank) => void;
  parity: TensorParity;
  setParity: (p: TensorParity) => void;
  timeParity: TensorTimeParity;
  setTimeParity: (t: TensorTimeParity) => void;
  validIntrinsics: TensorIntrinsic[];
  effIntrinsic: TensorIntrinsic;
  setIntrinsic: (v: TensorIntrinsic) => void;
  onNavigate: (view: string, tab?: string) => void;
}

/** Mode toggle (by tensor type / by effect) plus the corresponding lookup selectors. */
export function LookupControls({
  mode,
  setMode,
  selectedEffectId,
  setSelectedEffectId,
  rank,
  changeRank,
  parity,
  setParity,
  timeParity,
  setTimeParity,
  validIntrinsics,
  effIntrinsic,
  setIntrinsic,
  onNavigate,
}: LookupControlsProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-ink border-opacity-10 pb-8">
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 block">Lookup</span>
        <div className="flex gap-2">
          {(['type', 'effect'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`${chipBase} ${mode === m ? chipOn : chipOff}`}
            >
              {m === 'effect' ? 'By effect' : 'By tensor type'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'effect' ? (
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 block">Effect</span>
          <div className="flex flex-wrap gap-2">
            {TENSOR_EFFECTS.map((e) => (
              <span key={e.id} className="inline-flex items-center gap-1">
                <button
                  type="button"
                  aria-pressed={selectedEffectId === e.id}
                  onClick={() => setSelectedEffectId(e.id)}
                  className={`${chipBase} ${selectedEffectId === e.id ? chipOn : chipOff}`}
                >
                  {e.label}
                </button>
                <TermInfo id={`tbl-eff-${e.id}`} onNavigate={onNavigate} />
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 flex items-center gap-1">
              Rank <TermInfo id="tbl-rank" onNavigate={onNavigate} />
            </span>
            <div className="flex gap-2">
              {([0, 1, 2, 3, 4] as TensorRank[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={rank === r}
                  onClick={() => changeRank(r)}
                  className={`${chipBase} w-9 ${rank === r ? chipOn : chipOff}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 flex items-center gap-1">
              Spatial parity <TermInfo id="tbl-spatial-parity" onNavigate={onNavigate} />
            </span>
            <div className="flex gap-2">
              {(['polar', 'axial'] as TensorParity[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={parity === p}
                  onClick={() => setParity(p)}
                  className={`${chipBase} ${parity === p ? chipOn : chipOff}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 flex items-center gap-1">
              Time parity <TermInfo id="tbl-time-parity" onNavigate={onNavigate} />
            </span>
            <div className="flex gap-2">
              {(['i', 'c'] as TensorTimeParity[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={timeParity === t}
                  onClick={() => setTimeParity(t)}
                  className={`${chipBase} ${timeParity === t ? chipOn : chipOff}`}
                >
                  {t}-type
                </button>
              ))}
            </div>
          </div>
          {validIntrinsics.length > 1 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 flex items-center gap-1">
                Index symmetry <TermInfo id="tbl-index-symmetry" onNavigate={onNavigate} />
              </span>
              <div className="flex gap-2">
                {validIntrinsics.map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={effIntrinsic === v}
                    title={INTRINSIC_TOOLTIP[v]}
                    onClick={() => setIntrinsic(v)}
                    className={`${chipBase} ${effIntrinsic === v ? chipOn : chipOff}`}
                  >
                    {intrinsicLabel(v, rank)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
