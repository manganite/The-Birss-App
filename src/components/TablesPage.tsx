import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { InlineMath, BlockMath } from 'react-katex';
import { Table2, ChevronRight } from 'lucide-react';
import { PointGroupData } from '../data/pointGroups';
import {
  computeTensorForm,
  type TensorSpec, type TensorRank, type TensorParity, type TensorTimeParity, type TensorIntrinsic,
} from '../services/tensorForms';
import { formatCoeff } from '../services/tensorCalculator';
import { GroupIdentityHeader } from './MathComponents';
import { getFamilyClass, getClassLetter, REFERENCE_AXES, classicalChainApplies } from '../data/groupNotation';
import { getGroupDisplayName } from '../services/conventionMapping';
import type { TensorConfig } from '../types';

interface TablesPageProps {
  selectedGroup: PointGroupData | null;
  tensorConfig: TensorConfig;
  onNavigate: (view: string, tab?: string) => void;
}

const CHARS = ['x', 'y', 'z'];
const EPS = 1e-9;
const RANK_TABLE = ['4b', '4c', '4d', '4e', '4f'];

/** flat index -> [i0,i1,...] */
function toIndices(idx: number, rank: number): number[] {
  const out: number[] = [];
  let t = idx;
  for (let i = 0; i < rank; i++) { out.unshift(t % 3); t = Math.floor(t / 3); }
  return out;
}
const tSymbol = (idx: number, rank: number) => `T_{${toIndices(idx, rank).map(i => CHARS[i]).join('')}}`;

/** LaTeX for `coeff * symbol` with sign, using the app's coefficient formatter (1 -> "", -1 -> "-"). */
function signedTerm(coeff: number, symbol: string): string {
  const sign = coeff < 0 ? '-' : '';
  const c = formatCoeff(Math.abs(coeff)); // "" for 1, else fraction/root/decimal
  return `${sign}${c}${symbol}`;
}

/**
 * Per-component display labels (length 3^rank): each component is `0`, an independent symbol, or a
 * signed multiple of one. Valid for the grid renderings (ranks 1-3 with the crystallographic forms,
 * where every component is +/- a single free component); the relation-list path is used where a
 * component can be a genuine sum (rank 3 `none`, rank 4).
 */
function buildLabels(basis: number[][], rank: number): string[] {
  const dim = 3 ** rank;
  const labels = new Array<string>(dim).fill('0');
  for (const b of basis) {
    let lead = -1;
    for (let i = 0; i < dim; i++) if (Math.abs(b[i]) > EPS) { lead = i; break; }
    if (lead < 0) continue;
    const sym = tSymbol(lead, rank);
    for (let i = 0; i < dim; i++) if (Math.abs(b[i]) > EPS) labels[i] = signedTerm(b[i] / b[lead], sym);
  }
  return labels;
}

// Gaussian-elimination tolerances (distinct from the display EPS): a looser pivot cutoff so that
// float noise is never counted as an independent direction, and a tighter elimination cutoff so
// only genuinely-nonzero entries are reduced. Same values as the validated Table-4f guard's rank
// helper (tables4f.reference.test.ts). Engine bases are exact group averages, so noise sits near
// machine epsilon (~1e-16), far from either cutoff.
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

export function TablesPage({ selectedGroup, tensorConfig, onNavigate }: TablesPageProps) {
  const { setting, setSetting, convention } = tensorConfig;
  const [rank, setRank] = useState<TensorRank>(3);
  const [parity, setParity] = useState<TensorParity>('polar');
  const [timeParity, setTimeParity] = useState<TensorTimeParity>('i');
  const [intrinsic, setIntrinsic] = useState<TensorIntrinsic>('jk');

  // Keep intrinsic valid for the current rank.
  const validIntrinsics = INTRINSIC_BY_RANK[rank];
  const effIntrinsic = validIntrinsics.includes(intrinsic) ? intrinsic : 'none';
  const changeRank = (r: TensorRank) => {
    setRank(r);
    if (!INTRINSIC_BY_RANK[r].includes(intrinsic)) setIntrinsic('none');
  };

  const spec: TensorSpec = { rank, parity, timeParity, intrinsic: effIntrinsic };
  const form = useMemo(
    () => (selectedGroup ? computeTensorForm(selectedGroup.name, setting, spec) : null),
    [selectedGroup, setting, rank, parity, timeParity, effIntrinsic],
  );

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

  const groupName = selectedGroup.name;
  const displayName = getGroupDisplayName(groupName, convention);
  const basis = form!.basisResults;
  const dim = 3 ** rank;
  const labels = rank >= 1 && rank <= 3 ? buildLabels(basis, rank) : [];

  // vanishing-component count
  const nonzero = new Set<number>();
  for (const b of basis) for (let i = 0; i < dim; i++) if (Math.abs(b[i]) > EPS) nonzero.add(i);
  const vanishing = dim - nonzero.size;
  const independentCount = spanRank(basis);

  // lookup chain
  const familyClass = getFamilyClass(groupName);
  const classLetter = getClassLetter(groupName, parity, rank);
  const refAxes = REFERENCE_AXES[familyClass];
  // The classical Table-4a tail only describes the form for i-tensors or Type I groups; for a
  // magnetic group's c-tensor Birss's lookup runs via Table 7, so the classical letter / "no
  // allowed form" would contradict the computed result (see classicalChainApplies).
  const chainValid = classicalChainApplies(selectedGroup.type, timeParity);

  const toT = (s: string) => s.replace(/\\chi/g, 'T');

  return (
    <motion.div key={groupName} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <GroupIdentityHeader group={selectedGroup} setting={setting} convention={convention} onSettingChange={setSetting} onNavigate={onNavigate} />

      {/* Spec selectors */}
      <div className="flex flex-col gap-5 border-b border-ink border-opacity-10 pb-8">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
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
      </div>

      {/* Lookup chain */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/60 bg-ink/5 border border-ink/10 px-4 py-2.5 rounded-sm">
        <span className="font-serif italic text-ink"><InlineMath math={displayName.replace(/-([1-6])/g, '\\bar{$1}')} /></span>
        <ChevronRight className="w-3 h-3 opacity-40" />
        <span>family class <span className="font-serif italic text-ink/80"><InlineMath math={familyClass.replace(/-([1-6])/g, '\\bar{$1}')} /></span> <span className="opacity-50">(Table 4a)</span></span>
        {refAxes && (<><ChevronRight className="w-3 h-3 opacity-40" /><span>ref. axes {refAxes === 'any' ? <span className="italic">any</span> : <InlineMath math={refAxes.replace(/\/\//g, ' \\parallel ').replace(/-([1-6])/g, '\\bar{$1}')} />}</span></>)}
        <ChevronRight className="w-3 h-3 opacity-40" />
        {!chainValid
          ? <span className="italic">c-tensor lookup runs via Birss Table 7 (magnetic classes) — chain display planned.</span>
          : classLetter
            ? <span>Table {RANK_TABLE[rank]} row <span className="font-mono text-ink/80">{classLetter}{rank}</span></span>
            : <span className="italic">no allowed form (Table 4a: —)</span>}
      </div>

      {/* Result */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm uppercase tracking-[0.2em] text-ink/70">Symmetry-reduced form</h2>
          {!form!.isZero && rank > 0 && <span className="text-xs text-ink/50">{independentCount} independent component{independentCount === 1 ? '' : 's'}</span>}
        </div>

        {form!.isZero ? (
          <div className="border border-ink/20 bg-ink/5 p-6 text-center">
            <p className="text-sm text-ink/70">This tensor vanishes identically for <span className="font-serif italic"><InlineMath math={displayName.replace(/-([1-6])/g, '\\bar{$1}')} /></span>.</p>
          </div>
        ) : rank === 0 ? (
          <div className="border border-ink/10 p-6">
            <p className="text-sm">Allowed — {RANK0_READING[`${parity}-${timeParity}`]}.</p>
          </div>
        ) : rank === 1 ? (
          <div className="p-2"><BlockMath math={`\\mathbf{T} = \\begin{pmatrix} ${labels[0]} \\\\ ${labels[1]} \\\\ ${labels[2]} \\end{pmatrix}`} /></div>
        ) : rank === 2 ? (
          <div className="p-2"><BlockMath math={`\\mathbf{T} = \\begin{pmatrix} ${[0, 1, 2].map(i => [0, 1, 2].map(j => labels[i * 3 + j]).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`} /></div>
        ) : rank === 3 && effIntrinsic === 'jk' ? (
          <NyeScheme labels={labels} />
        ) : (
          <RelationList relations={form!.relations.map(toT)} />
        )}

        {!form!.isZero && rank >= 3 && (effIntrinsic !== 'jk' || rank === 4) && (
          <p className="text-xs text-ink/50">{vanishing} of {dim} components vanish.</p>
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
