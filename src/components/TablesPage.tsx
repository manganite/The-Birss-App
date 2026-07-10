import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { InlineMath, BlockMath } from 'react-katex';
import { Table2, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { POINT_GROUPS, PointGroupData } from '../data/pointGroups';
import {
  computeTensorForm, getCanonicalFormSignature,
  type TensorSpec, type TensorRank, type TensorParity, type TensorTimeParity, type TensorIntrinsic,
} from '../services/tensorForms';
import { formatCoeff } from '../services/tensorCalculator';
import { GroupIdentityHeader } from './MathComponents';
import { FormatPointGroup } from './notation';
import { getFamilyClass, getClassLetter, REFERENCE_AXES, classicalChainApplies } from '../data/groupNotation';
import { getGroupDisplayName } from '../services/conventionMapping';
import { TENSOR_EFFECTS, getEffect, effectBaseSymbol } from '../data/tensorEffects';
import type { TensorConfig } from '../types';

interface TablesPageProps {
  selectedGroup: PointGroupData | null;
  tensorConfig: TensorConfig;
  onNavigate: (view: string, tab?: string) => void;
  /** Deep-link: preselect an effect (effect mode) when the page opens. */
  effectId?: string | null;
  /** Select a different group while staying on the Tables page (used by the sharing list). */
  onSelectGroup?: (group: PointGroupData) => void;
}

const CHARS = ['x', 'y', 'z'];
const EPS = 1e-9;
const RANK_TABLE = ['4b', '4c', '4d', '4e', '4f'];
const bar = (s: string) => s.replace(/-([1-6])/g, '\\bar{$1}');

/** Render a string that may contain inline `$...$` LaTeX segments (used for effect blurbs). */
function MathText({ text }: { text: string }) {
  return <>{text.split('$').map((seg, i) => (i % 2 === 1 ? <InlineMath key={i} math={seg} /> : <span key={i}>{seg}</span>))}</>;
}

function toIndices(idx: number, rank: number): number[] {
  const out: number[] = [];
  let t = idx;
  for (let i = 0; i < rank; i++) { out.unshift(t % 3); t = Math.floor(t / 3); }
  return out;
}
const compSymbol = (idx: number, rank: number, base: string) => `${base}_{${toIndices(idx, rank).map(i => CHARS[i]).join('')}}`;

function signedTerm(coeff: number, symbol: string): string {
  const sign = coeff < 0 ? '-' : '';
  return `${sign}${formatCoeff(Math.abs(coeff))}${symbol}`;
}

/**
 * Per-component display labels (length 3^rank): each is `0`, an independent symbol, or a signed
 * multiple of one, using `base` as the tensor letter (`T`, `\alpha`, ...). Valid for the grid
 * renderings (ranks 1-3 crystallographic forms); the relation-list path handles genuine sums.
 */
function buildLabels(basis: number[][], rank: number, base: string): string[] {
  const dim = 3 ** rank;
  const labels = new Array<string>(dim).fill('0');
  for (const b of basis) {
    let lead = -1;
    for (let i = 0; i < dim; i++) if (Math.abs(b[i]) > EPS) { lead = i; break; }
    if (lead < 0) continue;
    const sym = compSymbol(lead, rank, base);
    for (let i = 0; i < dim; i++) if (Math.abs(b[i]) > EPS) labels[i] = signedTerm(b[i] / b[lead], sym);
  }
  return labels;
}

// Gaussian-elimination tolerances (distinct from the display EPS): looser pivot cutoff so float
// noise is never counted as an independent direction, tighter elimination cutoff. Same values as
// the validated Table-4f guard's rank helper. Engine bases are exact group averages (~1e-16 noise).
const RANK_PIVOT_EPS = 1e-7;
const RANK_ELIM_EPS = 1e-12;

/** Rank of a set of vectors (Gaussian elimination) = true independent-component count. */
function spanRank(basis: number[][]): number {
  if (!basis.length) return 0;
  const dim = basis[0].length;
  const M = basis.map(v => [...v]);
  let rank = 0;
  for (let c = 0; c < dim && rank < M.length; c++) {
    let piv = rank;
    for (let r = rank + 1; r < M.length; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < RANK_PIVOT_EPS) continue;
    [M[rank], M[piv]] = [M[piv], M[rank]];
    const pv = M[rank][c];
    for (let j = 0; j < dim; j++) M[rank][j] /= pv;
    for (let r = 0; r < M.length; r++) if (r !== rank && Math.abs(M[r][c]) > RANK_ELIM_EPS) { const f = M[r][c]; for (let j = 0; j < dim; j++) M[r][j] -= f * M[rank][j]; }
    rank++;
  }
  return rank;
}

const INTRINSIC_BY_RANK: Record<number, TensorIntrinsic[]> = { 0: ['none'], 1: ['none'], 2: ['none', 'ij'], 3: ['none', 'jk'], 4: ['none', 'voigt'] };

const RANK0_READING: Record<string, string> = {
  'polar-i': 'ordinary scalar — always allowed',
  'axial-i': 'pseudoscalar — allowed for chiral (enantiomorphic) groups',
  'polar-c': 'time-odd scalar — allowed for Type I groups only (any primed operation forbids it)',
  'axial-c': 'time-odd pseudoscalar — the magnetoelectric monopole (trace of α_ij)',
};

const chipBase = 'px-3 py-1.5 text-xs tracking-[0.05em] transition-all border border-ink';
const chipOn = 'bg-ink text-paper';
const chipOff = 'hover:bg-ink hover:text-paper text-ink/70 border-opacity-20';
const specKeyOf = (s: TensorSpec) => `${s.rank}:${s.parity}:${s.timeParity}:${s.intrinsic}`;

export function TablesPage({ selectedGroup, tensorConfig, onNavigate, effectId, onSelectGroup }: TablesPageProps) {
  const { setting, setSetting, convention } = tensorConfig;
  const [mode, setMode] = useState<'type' | 'effect'>(effectId ? 'effect' : 'type');
  const [selectedEffectId, setSelectedEffectId] = useState<string>(effectId ?? TENSOR_EFFECTS[0].id);
  const [rank, setRank] = useState<TensorRank>(3);
  const [parity, setParity] = useState<TensorParity>('polar');
  const [timeParity, setTimeParity] = useState<TensorTimeParity>('i');
  const [intrinsic, setIntrinsic] = useState<TensorIntrinsic>('jk');
  const [sharingOpen, setSharingOpen] = useState(false);

  const validIntrinsics = INTRINSIC_BY_RANK[rank];
  const effIntrinsic = validIntrinsics.includes(intrinsic) ? intrinsic : 'none';
  const changeRank = (r: TensorRank) => { setRank(r); if (!INTRINSIC_BY_RANK[r].includes(intrinsic)) setIntrinsic('none'); };

  const effect = mode === 'effect' ? getEffect(selectedEffectId) : undefined;
  const spec: TensorSpec = effect ? effect.spec : { rank, parity, timeParity, intrinsic: effIntrinsic };
  const { rank: aRank, parity: aParity, timeParity: aTime, intrinsic: aIntrinsic } = spec;
  const base = effect ? effectBaseSymbol(effect) : 'T';
  const formLabel = effect ? effect.symbol : '\\mathbf{T}';
  const specKey = specKeyOf(spec);

  const form = useMemo(
    () => (selectedGroup ? computeTensorForm(selectedGroup.name, setting, spec) : null),
    [selectedGroup, setting, specKey],
  );

  // The class of groups sharing this form (frame-canonical signature). Computed only when the
  // section is expanded; heavy for rank 4 but cached in the engine. See findings §9.
  const groupName = selectedGroup?.name;
  const sharing = useMemo(() => {
    if (!sharingOpen || !groupName) return null;
    const sig = getCanonicalFormSignature(groupName, spec);
    return POINT_GROUPS.filter(g => getCanonicalFormSignature(g.name, spec) === sig);
  }, [sharingOpen, groupName, specKey]);

  if (!selectedGroup) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 border border-ink border-dashed rounded-full flex items-center justify-center animate-spin-slow">
          <Table2 className="w-8 h-8 opacity-20" />
        </div>
        <div className="space-y-2">
          <p className="text-xl font-serif italic text-ink/70">Select a point group to look up its tensor forms</p>
          <p className="text-xs uppercase tracking-[0.3em] opacity-30">Use the Explorer or the header search</p>
        </div>
      </div>
    );
  }

  const displayName = getGroupDisplayName(selectedGroup.name, convention);
  const basis = form!.basisResults;
  const dim = 3 ** aRank;
  const labels = aRank >= 1 && aRank <= 3 ? buildLabels(basis, aRank, base) : [];

  const nonzero = new Set<number>();
  for (const b of basis) for (let i = 0; i < dim; i++) if (Math.abs(b[i]) > EPS) nonzero.add(i);
  const vanishing = dim - nonzero.size;
  const independentCount = spanRank(basis);

  const familyClass = getFamilyClass(selectedGroup.name);
  const classLetter = getClassLetter(selectedGroup.name, aParity, aRank);
  const refAxes = REFERENCE_AXES[familyClass];
  const chainValid = classicalChainApplies(selectedGroup.type, aTime);

  const toSym = (s: string) => s.replace(/\\chi/g, base);
  const forbiddenName = effect ? effect.label : 'This tensor';

  return (
    <motion.div key={selectedGroup.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <GroupIdentityHeader group={selectedGroup} setting={setting} convention={convention} onSettingChange={setSetting} onNavigate={onNavigate} />

      {/* Mode toggle + selectors */}
      <div className="flex flex-col gap-5 border-b border-ink border-opacity-10 pb-8">
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 block">Lookup</span>
          <div className="flex gap-2">
            {(['effect', 'type'] as const).map(m => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`${chipBase} ${mode === m ? chipOn : chipOff}`}>{m === 'effect' ? 'By effect' : 'By tensor type'}</button>
            ))}
          </div>
        </div>

        {mode === 'effect' ? (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 block">Effect</span>
            <div className="flex flex-wrap gap-2">
              {TENSOR_EFFECTS.map(e => (
                <button key={e.id} type="button" aria-pressed={selectedEffectId === e.id} onClick={() => setSelectedEffectId(e.id)} className={`${chipBase} ${selectedEffectId === e.id ? chipOn : chipOff}`}>{e.label}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 block">Rank</span>
              <div className="flex gap-2">
                {([0, 1, 2, 3, 4] as TensorRank[]).map(r => (
                  <button key={r} type="button" aria-pressed={rank === r} onClick={() => changeRank(r)} className={`${chipBase} w-9 ${rank === r ? chipOn : chipOff}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 block">Spatial parity</span>
              <div className="flex gap-2">
                {(['polar', 'axial'] as TensorParity[]).map(p => (
                  <button key={p} type="button" aria-pressed={parity === p} onClick={() => setParity(p)} className={`${chipBase} ${parity === p ? chipOn : chipOff}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 block">Time parity</span>
              <div className="flex gap-2">
                {(['i', 'c'] as TensorTimeParity[]).map(t => (
                  <button key={t} type="button" aria-pressed={timeParity === t} onClick={() => setTimeParity(t)} className={`${chipBase} ${timeParity === t ? chipOn : chipOff}`}>{t}-type</button>
                ))}
              </div>
            </div>
            {validIntrinsics.length > 1 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 block">Index symmetry</span>
                <div className="flex gap-2">
                  {validIntrinsics.map(v => (
                    <button key={v} type="button" aria-pressed={effIntrinsic === v} onClick={() => setIntrinsic(v)} className={`${chipBase} ${effIntrinsic === v ? chipOn : chipOff}`}>{v}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Effect info: label, blurb, defining equation */}
      {effect && (
        <div className="border border-ink/10 bg-white/30 p-5 space-y-2">
          <h3 className="text-base font-medium flex items-baseline gap-2"><InlineMath math={effect.symbol} /> · {effect.label}</h3>
          <p className="text-sm text-ink/70 leading-relaxed"><MathText text={effect.blurb} /></p>
          {effect.equation && <div className="py-1"><BlockMath math={effect.equation} /></div>}
          <p className="text-xs text-ink/40">{effect.reference}</p>
        </div>
      )}

      {/* Lookup chain */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/60 bg-ink/5 border border-ink/10 px-4 py-2.5 rounded-sm">
        <span className="font-serif italic text-ink"><InlineMath math={bar(displayName)} /></span>
        <ChevronRight className="w-3 h-3 opacity-40" />
        <span>family class <span className="font-serif italic text-ink/80"><InlineMath math={bar(familyClass)} /></span> <span className="opacity-50">(Table 4a)</span></span>
        {refAxes && (<><ChevronRight className="w-3 h-3 opacity-40" /><span>ref. axes {refAxes === 'any' ? <span className="italic">any</span> : <InlineMath math={bar(refAxes.replace(/\/\//g, ' \\parallel '))} />}</span></>)}
        <ChevronRight className="w-3 h-3 opacity-40" />
        {!chainValid
          ? <span className="italic">c-tensor lookup runs via Birss Table 7 (magnetic classes) — chain display planned.</span>
          : classLetter
            ? <span>Table {RANK_TABLE[aRank]} row <span className="font-mono text-ink/80">{classLetter}{aRank}</span></span>
            : <span className="italic">no allowed form (Table 4a: —)</span>}
      </div>

      {/* Result */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm uppercase tracking-[0.2em] text-ink/70">Symmetry-reduced form</h2>
          {!form!.isZero && aRank > 0 && <span className="text-xs text-ink/50">{independentCount} independent component{independentCount === 1 ? '' : 's'}</span>}
        </div>

        {form!.isZero ? (
          <div className="border border-ink/20 bg-ink/5 p-6 text-center">
            <p className="text-sm text-ink/70">{forbiddenName} {effect ? 'is forbidden' : 'vanishes identically'} for <span className="font-serif italic"><InlineMath math={bar(displayName)} /></span>.</p>
          </div>
        ) : aRank === 0 ? (
          <div className="border border-ink/10 p-6"><p className="text-sm">Allowed — {RANK0_READING[`${aParity}-${aTime}`]}.</p></div>
        ) : aRank === 1 ? (
          <div className="p-2"><BlockMath math={`${formLabel} = \\begin{pmatrix} ${labels[0]} \\\\ ${labels[1]} \\\\ ${labels[2]} \\end{pmatrix}`} /></div>
        ) : aRank === 2 ? (
          <div className="p-2"><BlockMath math={`${formLabel} = \\begin{pmatrix} ${[0, 1, 2].map(i => [0, 1, 2].map(j => labels[i * 3 + j]).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`} /></div>
        ) : aRank === 3 && aIntrinsic === 'jk' ? (
          <NyeScheme labels={labels} />
        ) : (
          <RelationList relations={form!.relations.map(toSym)} />
        )}

        {!form!.isZero && aRank >= 3 && (aIntrinsic !== 'jk' || aRank === 4) && (
          <p className="text-xs text-ink/50">{vanishing} of {dim} components vanish.</p>
        )}
      </div>

      {/* Groups sharing this form */}
      <div className="border-t border-ink border-opacity-10 pt-4">
        <button type="button" aria-expanded={sharingOpen} onClick={() => setSharingOpen(v => !v)} className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink/70 hover:text-ink">
          {sharingOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Groups sharing this form{sharing ? ` (${sharing.length})` : ''}
        </button>
        {sharingOpen && sharing && (
          <div className="mt-4 flex flex-wrap gap-2 max-h-64 overflow-y-auto">
            {sharing.map(g => {
              const isCurrent = g.name === selectedGroup.name;
              return (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => !isCurrent && onSelectGroup?.(g)}
                  className={`px-2.5 py-1 text-sm border transition-colors ${isCurrent ? 'bg-ink text-paper border-ink' : 'border-ink/20 hover:bg-ink hover:text-paper'}`}
                >
                  <FormatPointGroup name={getGroupDisplayName(g.name, convention)} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Rank-3, jk-symmetric: the 3x6 Nye scheme (rows i = x,y,z; columns jk = xx,yy,zz,yz,zx,xy). */
function NyeScheme({ labels }: { labels: string[] }) {
  const cols: [string, number][] = [['xx', 0], ['yy', 4], ['zz', 8], ['yz', 5], ['zx', 6], ['xy', 1]]; // (j,k) flat within a row
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-center">
        <thead>
          <tr>
            <th className="p-2" />
            {cols.map(([name]) => (
              <th key={name} className="p-2 text-xs font-normal text-ink/60 uppercase tracking-wider min-w-[3.5rem]"><InlineMath math={`(${name})`} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2].map(i => (
            <tr key={i}>
              <th className="p-2 text-xs font-normal text-ink/60 uppercase tracking-wider">{CHARS[i]}</th>
              {cols.map(([name, off]) => {
                const v = labels[i * 9 + off];
                return (
                  <td key={name} className="p-2 border border-ink/10 font-mono text-sm">
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
        <li key={idx} className="font-mono text-sm bg-white/40 border border-ink/10 px-4 py-2 rounded-sm overflow-x-auto">
          <InlineMath math={r} />
        </li>
      ))}
    </ul>
  );
}
