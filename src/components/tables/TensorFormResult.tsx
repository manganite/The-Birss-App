import { InlineMath, BlockMath } from 'react-katex';
import {
  type TensorForm,
  type TensorRank,
  type TensorParity,
  type TensorTimeParity,
  type TensorIntrinsic,
} from '../../services/tensorForms';
import { type NyeScheme, SINGLE_SLOTS, PAIR_SLOTS, type NyeSlot } from '../../services/nyeScheme';
import { TermInfo } from '../TermInfo';
import { NyeSchemeDiagram } from './NyeSchemeDiagram';
import { bar } from './shared';

const RANK0_READING: Record<string, string> = {
  'polar-i': 'ordinary scalar — always allowed',
  'axial-i': 'pseudoscalar — allowed for chiral (enantiomorphic) groups',
  'polar-c': 'time-odd scalar — allowed for Type I groups only (any primed operation forbids it)',
  'axial-c': 'time-odd pseudoscalar — the magnetoelectric monopole (trace of α_ij)',
};

/** A "slot" is the crystallographic indices a row/column header stands for: a single index (x/y/z)
 * or a Voigt-compressed pair (xx,yy,zz,yz,zx,xy in the standard 1..6 order). Defined once in
 * `services/nyeScheme.ts`, so this matrix and the dot diagram cannot disagree about the layout. */
type Slot = NyeSlot;
const flatOf = (indices: number[]) => indices.reduce((a, x) => a * 3 + x, 0);

/**
 * Voigt-compressed matrix rendering, shared by the Nye scheme and the new 6x3 / 6x6 forms: the row
 * and column headers are the chosen slots (singles or pairs), and each cell is the tensor component
 * whose indices are the row's slot followed by the column's slot. Header labels use the fixed Voigt
 * order (XX YY ZZ YZ ZX XY) via PAIR_SLOTS.
 */
function CompressedMatrix({
  labels,
  rowSlots,
  colSlots,
  cornerTip,
  onNavigate,
}: {
  labels: string[];
  rowSlots: readonly Slot[];
  colSlots: readonly Slot[];
  /** glossary id for the top-left help icon (the Nye 3x6 vs the general Voigt-pair layouts differ). */
  cornerTip: string;
  onNavigate?: (view: string, tab?: string) => void;
}) {
  const isPair = (s: Slot) => s.idx.length === 2;
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-center">
        <thead>
          <tr>
            <th className="p-2">
              <TermInfo id={cornerTip} onNavigate={onNavigate} />
            </th>
            {colSlots.map((c) => (
              <th key={c.label} className="p-2 text-xs font-normal text-ink/60 uppercase tracking-wider min-w-[3.5rem]">
                {isPair(c) ? <InlineMath math={`(${c.label})`} /> : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowSlots.map((r) => (
            <tr key={r.label}>
              <th className="p-2 text-xs font-normal text-ink/60 uppercase tracking-wider">
                {isPair(r) ? <InlineMath math={`(${r.label})`} /> : r.label}
              </th>
              {colSlots.map((c) => {
                const v = labels[flatOf([...r.idx, ...c.idx])];
                return (
                  <td key={c.label} className="p-2 border border-ink/10 font-mono text-sm">
                    {v === '0' ? <span className="opacity-30">0</span> : <InlineMath math={v} />}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Rank-3 `none` and rank-4: the list of independent components and their equality/sign relations. */
function RelationList({ relations }: { relations: string[] }) {
  return (
    <ul className="space-y-2">
      {relations.map((r, idx) => (
        <li
          key={idx}
          className="font-mono text-sm bg-white/40 border border-ink/10 px-4 py-2 rounded-sm overflow-x-auto"
        >
          <InlineMath math={r} />
        </li>
      ))}
    </ul>
  );
}

interface TensorFormResultProps {
  form: TensorForm;
  forbiddenName: string;
  isEffect: boolean;
  displayName: string;
  aRank: TensorRank;
  aParity: TensorParity;
  aTime: TensorTimeParity;
  aIntrinsic: TensorIntrinsic;
  usesMatrix: boolean;
  labels: string[];
  formLabel: string;
  independentCount: number;
  vanishing: number;
  dim: number;
  toSym: (s: string) => string;
  onNavigate: (view: string, tab?: string) => void;
  /** The dot-diagram model, or null when this rank/intrinsic combination has no scheme geometry. */
  nyeScheme: NyeScheme | null;
  formView: FormView;
  setFormView: (v: FormView) => void;
}

/** Which representation of the reduced form is showing. `symbolic` is the default everywhere. */
export type FormView = 'symbolic' | 'diagram';

const viewChip = 'px-3 py-1 text-[11px] tracking-[0.05em] transition-all border border-ink';

/** The reduced tensor form: the vanishes/forbidden note, the native/Voigt matrix, or the relation
 *  list, plus the independent-component count and the vanishing-component tally. */
export function TensorFormResult({
  form,
  forbiddenName,
  isEffect,
  displayName,
  aRank,
  aParity,
  aTime,
  aIntrinsic,
  usesMatrix,
  labels,
  formLabel,
  independentCount,
  vanishing,
  dim,
  toSym,
  onNavigate,
  nyeScheme,
  formView,
  setFormView,
}: TensorFormResultProps) {
  // The toggle is offered for exactly the rank/intrinsic combinations that have a scheme geometry,
  // and only when there is something to draw. Everything else keeps its existing display untouched.
  const canDiagram = nyeScheme !== null && !form.isZero;
  const showDiagram = canDiagram && formView === 'diagram';

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm uppercase tracking-[0.2em] text-ink/70 flex items-center gap-1">
          Tensor form
          {!form.isZero && !usesMatrix && aRank >= 3 && <TermInfo id="tbl-relations" onNavigate={onNavigate} />}
        </h2>
        <div className="flex items-baseline gap-4">
          {canDiagram && (
            <div className="flex gap-1" role="group" aria-label="Tensor form representation">
              {(['symbolic', 'diagram'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={formView === v}
                  onClick={() => setFormView(v)}
                  className={`${viewChip} ${
                    formView === v ? 'bg-ink text-paper' : 'hover:bg-ink hover:text-paper text-ink/70 border-opacity-20'
                  }`}
                >
                  {v === 'symbolic' ? 'Symbolic' : 'Dot diagram'}
                </button>
              ))}
            </div>
          )}
          {!form.isZero && aRank > 0 && (
            <span className="text-xs text-ink/50 flex items-center gap-1">
              {independentCount} independent component{independentCount === 1 ? '' : 's'}{' '}
              <TermInfo id="tbl-indep-count" onNavigate={onNavigate} />
            </span>
          )}
        </div>
      </div>

      {showDiagram ? (
        <NyeSchemeDiagram scheme={nyeScheme!} />
      ) : form.isZero ? (
        <div className="border border-ink/20 bg-ink/5 p-6 text-center">
          <p className="text-sm text-ink/70 inline-flex items-center gap-1">
            {forbiddenName} {isEffect ? 'is forbidden' : 'vanishes identically'} for{' '}
            <span className="font-serif italic">
              <InlineMath math={bar(displayName)} />
            </span>
            . <TermInfo id="tbl-vanishes" onNavigate={onNavigate} />
          </p>
        </div>
      ) : aRank === 0 ? (
        <div className="border border-ink/10 p-6">
          <p className="text-sm">Allowed — {RANK0_READING[`${aParity}-${aTime}`]}.</p>
        </div>
      ) : aRank === 1 ? (
        <div className="p-2">
          <BlockMath
            math={`${formLabel} = \\begin{pmatrix} ${labels[0]} \\\\ ${labels[1]} \\\\ ${labels[2]} \\end{pmatrix}`}
          />
        </div>
      ) : aRank === 2 ? (
        <div className="p-2">
          <BlockMath
            math={`${formLabel} = \\begin{pmatrix} ${[0, 1, 2].map((i) => [0, 1, 2].map((j) => labels[i * 3 + j]).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`}
          />
        </div>
      ) : /* Rendering rule: where the chosen intrinsic symmetry compresses an index pair, render the
             Voigt-compressed matrix (rows/cols are the compressed pairs); otherwise the relation
             list; ranks <= 2 render natively above. */
      aRank === 3 && aIntrinsic === 'jk' ? (
        <CompressedMatrix
          labels={labels}
          rowSlots={SINGLE_SLOTS}
          colSlots={PAIR_SLOTS}
          cornerTip="tbl-nye"
          onNavigate={onNavigate}
        />
      ) : aRank === 3 && aIntrinsic === 'ij' ? (
        <CompressedMatrix
          labels={labels}
          rowSlots={PAIR_SLOTS}
          colSlots={SINGLE_SLOTS}
          cornerTip="tbl-voigt-matrix"
          onNavigate={onNavigate}
        />
      ) : aRank === 4 && (aIntrinsic === 'ij_kl' || aIntrinsic === 'voigt') ? (
        <CompressedMatrix
          labels={labels}
          rowSlots={PAIR_SLOTS}
          colSlots={PAIR_SLOTS}
          cornerTip="tbl-voigt-matrix"
          onNavigate={onNavigate}
        />
      ) : (
        <RelationList relations={form.relations.map(toSym)} />
      )}

      {!form.isZero && aRank >= 3 && (aIntrinsic !== 'jk' || aRank === 4) && (
        <p className="text-xs text-ink/50">
          {vanishing} of {dim} components vanish.
        </p>
      )}
    </div>
  );
}
