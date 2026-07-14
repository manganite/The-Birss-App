import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { POINT_GROUPS, PointGroupData } from '../data/pointGroups';
import {
  computeTensorForm,
  type TensorSpec,
  type TensorRank,
  type TensorParity,
  type TensorTimeParity,
  type TensorIntrinsic,
} from '../services/tensorForms';
import { INTRINSIC_BY_RANK, specKeyOf } from '../data/uiTensorSpecs';
import { SHARING_PARTITIONS } from '../data/sharingPartitions';
import { formatCoeff } from '../services/tensorCalculator';
import { GroupIdentityHeader } from './MathComponents';
import {
  getFamilyClass,
  getClassLetter,
  REFERENCE_AXES,
  classicalChainApplies,
  getTable7Chain,
} from '../data/groupNotation';
import { getGroupDisplayName } from '../services/conventionMapping';
import { TENSOR_EFFECTS, getEffect, effectBaseSymbol } from '../data/tensorEffects';
import type { TensorConfig } from '../types';
import { TablesEmptyState } from './tables/TablesEmptyState';
import { LookupControls } from './tables/LookupControls';
import { EffectInfo } from './tables/EffectInfo';
import { LookupChain } from './tables/LookupChain';
import { TensorFormResult } from './tables/TensorFormResult';
import { GroupSharingList } from './tables/GroupSharingList';

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

function toIndices(idx: number, rank: number): number[] {
  const out: number[] = [];
  let t = idx;
  for (let i = 0; i < rank; i++) {
    out.unshift(t % 3);
    t = Math.floor(t / 3);
  }
  return out;
}
const compSymbol = (idx: number, rank: number, base: string) =>
  `${base}_{${toIndices(idx, rank)
    .map((i) => CHARS[i])
    .join('')}}`;

/**
 * Per-component display labels (length 3^rank): each is `0`, an independent symbol, or a linear
 * combination of the independent symbols, using `base` as the tensor letter (`T`, `\alpha`, ...).
 * Each basis vector is normalised to its lead component = 1 (that lead names a free parameter);
 * a component's label ACCUMULATES its contribution from every basis vector, so genuine sums like the
 * hexagonal Voigt cell c_66 = (c_11 - c_12)/2 render correctly (not just monomial forms).
 */
/** Reduced row echelon form: makes each free parameter the lowest-index independent component, so
 * labels come out in the natural form (pivots monomial, dependents as clean combinations of them --
 * e.g. the Voigt c_66 = (c_11 - c_12)/2 rather than an arbitrary basis combination). */
function rref(basis: number[][], dim: number): number[][] {
  const M = basis.map((v) => [...v]);
  let pr = 0;
  for (let c = 0; c < dim && pr < M.length; c++) {
    let piv = pr;
    for (let r = pr + 1; r < M.length; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < RANK_PIVOT_EPS) continue;
    [M[pr], M[piv]] = [M[piv], M[pr]];
    const pv = M[pr][c];
    for (let j = 0; j < dim; j++) M[pr][j] /= pv;
    for (let r = 0; r < M.length; r++)
      if (r !== pr && Math.abs(M[r][c]) > RANK_ELIM_EPS) {
        const f = M[r][c];
        for (let j = 0; j < dim; j++) M[r][j] -= f * M[pr][j];
      }
    pr++;
  }
  return M.slice(0, pr);
}

function buildLabels(rawBasis: number[][], rank: number, base: string): string[] {
  const dim = 3 ** rank;
  const basis = rref(rawBasis, dim);
  const terms = basis
    .map((b) => {
      let lead = -1;
      for (let i = 0; i < dim; i++)
        if (Math.abs(b[i]) > EPS) {
          lead = i;
          break;
        }
      return lead < 0 ? null : { sym: compSymbol(lead, rank, base), vec: b.map((x) => x / b[lead]) };
    })
    .filter((t): t is { sym: string; vec: number[] } => t !== null);

  return Array.from({ length: dim }, (_, c) => {
    let s = '';
    for (const t of terms) {
      const coeff = t.vec[c];
      if (Math.abs(coeff) <= EPS) continue;
      const piece = formatCoeff(Math.abs(coeff)) + t.sym;
      s += s === '' ? (coeff < 0 ? '-' : '') + piece : (coeff < 0 ? ' - ' : ' + ') + piece;
    }
    return s === '' ? '0' : s;
  });
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
  const M = basis.map((v) => [...v]);
  let rank = 0;
  for (let c = 0; c < dim && rank < M.length; c++) {
    let piv = rank;
    for (let r = rank + 1; r < M.length; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < RANK_PIVOT_EPS) continue;
    [M[rank], M[piv]] = [M[piv], M[rank]];
    const pv = M[rank][c];
    for (let j = 0; j < dim; j++) M[rank][j] /= pv;
    for (let r = 0; r < M.length; r++)
      if (r !== rank && Math.abs(M[r][c]) > RANK_ELIM_EPS) {
        const f = M[r][c];
        for (let j = 0; j < dim; j++) M[r][j] -= f * M[rank][j];
      }
    rank++;
  }
  return rank;
}

export function TablesPage({ selectedGroup, tensorConfig, onNavigate, effectId, onSelectGroup }: TablesPageProps) {
  const { setting, setSetting, convention } = tensorConfig;
  const [mode, setMode] = useState<'type' | 'effect'>(effectId ? 'effect' : 'type');
  const [selectedEffectId, setSelectedEffectId] = useState<string>(effectId ?? TENSOR_EFFECTS[0].id);
  const [rank, setRank] = useState<TensorRank>(3);
  const [parity, setParity] = useState<TensorParity>('polar');
  const [timeParity, setTimeParity] = useState<TensorTimeParity>('i');
  const [intrinsic, setIntrinsic] = useState<TensorIntrinsic>('jk');
  const [sharingOpen, setSharingOpen] = useState(false);
  const [diagramOpen, setDiagramOpen] = useState(false);

  const validIntrinsics = INTRINSIC_BY_RANK[rank];
  const effIntrinsic = validIntrinsics.includes(intrinsic) ? intrinsic : 'none';
  const changeRank = (r: TensorRank) => {
    setRank(r);
    if (!INTRINSIC_BY_RANK[r].includes(intrinsic)) setIntrinsic('none');
  };

  const effect = mode === 'effect' ? getEffect(selectedEffectId) : undefined;
  const spec: TensorSpec = effect ? effect.spec : { rank, parity, timeParity, intrinsic: effIntrinsic };
  const { rank: aRank, parity: aParity, timeParity: aTime, intrinsic: aIntrinsic } = spec;
  const base = effect ? effectBaseSymbol(effect) : 'T';
  const formLabel = effect ? effect.symbol : '\\mathbf{T}';
  const specKey = specKeyOf(spec);

  const form = useMemo(
    () => (selectedGroup ? computeTensorForm(selectedGroup.name, setting, spec) : null),
    // specKey is a stable string derived from spec; keying on it (not the fresh `spec` object) avoids
    // recomputing on every render when spec's identity changes but its contents don't.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedGroup, setting, specKey],
  );

  // The class of groups sharing this form (frame-canonical signature). O(1) lookup into the
  // precomputed partition (src/data/sharingPartitions.ts, `npm run sharingdata`) -- the 122-group
  // signature sweep is static per spec, so it is generated at build time rather than run on the main
  // thread. See findings §9.
  const groupName = selectedGroup?.name;
  const sharing = useMemo(() => {
    if (!sharingOpen || !groupName) return null;
    const partition = SHARING_PARTITIONS[specKey];
    const cls = partition?.find((c) => c.includes(groupName));
    if (!cls) return null;
    const byName = new Map<string, PointGroupData>(POINT_GROUPS.map((g) => [g.name, g]));
    return cls.map((n) => byName.get(n)).filter((g): g is PointGroupData => g !== undefined);
  }, [sharingOpen, groupName, specKey]);

  if (!selectedGroup) {
    return <TablesEmptyState />;
  }

  const displayName = getGroupDisplayName(selectedGroup.name, convention);
  const basis = form!.basisResults;
  const dim = 3 ** aRank;
  // A Voigt-compressed matrix (or a native rank-1/2 form) is rendered whenever the spec is a matrix
  // rendering; those need per-component labels. Rank-3/4 with no compressible pair use the list.
  const usesMatrix =
    (aRank >= 1 && aRank <= 2) ||
    (aRank === 3 && (aIntrinsic === 'jk' || aIntrinsic === 'ij')) ||
    (aRank === 4 && (aIntrinsic === 'ij_kl' || aIntrinsic === 'voigt'));
  const labels = usesMatrix ? buildLabels(basis, aRank, base) : [];

  const nonzero = new Set<number>();
  for (const b of basis) for (let i = 0; i < dim; i++) if (Math.abs(b[i]) > EPS) nonzero.add(i);
  const vanishing = dim - nonzero.size;
  const independentCount = spanRank(basis);

  const familyClass = getFamilyClass(selectedGroup.name);
  const classLetter = getClassLetter(selectedGroup.name, aParity, aRank);
  const refAxes = REFERENCE_AXES[familyClass];
  const chainValid = classicalChainApplies(selectedGroup.type, aTime);
  // c-tensor of a magnetic group: Birss's lookup runs via Table 7. Type III -> a chain; Type II
  // grey -> null (the c-tensor vanishes, rendered as the grey tail).
  const t7chain = !chainValid ? getTable7Chain(selectedGroup.name, aParity, aRank) : null;
  const t7SourceRefAxes = t7chain ? REFERENCE_AXES[t7chain.sourceClass] : undefined;
  // Dev-only guard: never show a "no allowed form" chain when the engine actually computes one.
  // (The reverse -- a class letter whose form vanishes at this particular rank, e.g. Table 4d R2 = 0
  // -- is NOT a contradiction: the classical branch likewise shows the row for a zero form, and the
  // reduced-form section reports "vanishes identically" separately.)
  const t7Contradiction = !!t7chain && t7chain.letter === null && !form!.isZero;
  if (t7Contradiction && import.meta.env.DEV) {
    console.error(
      `Table-7 chain says "no allowed form" but the engine computes a non-zero form for ${selectedGroup.name} ${aParity} rank ${aRank}`,
    );
  }

  const toSym = (s: string) => s.replace(/\\chi/g, base);
  const forbiddenName = effect ? effect.label : 'This tensor';

  return (
    <motion.div key={selectedGroup.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <GroupIdentityHeader
        group={selectedGroup}
        setting={setting}
        convention={convention}
        onSettingChange={setSetting}
        onNavigate={onNavigate}
      />

      <LookupControls
        mode={mode}
        setMode={setMode}
        selectedEffectId={selectedEffectId}
        setSelectedEffectId={setSelectedEffectId}
        rank={rank}
        changeRank={changeRank}
        parity={parity}
        setParity={setParity}
        timeParity={timeParity}
        setTimeParity={setTimeParity}
        validIntrinsics={validIntrinsics}
        effIntrinsic={effIntrinsic}
        setIntrinsic={setIntrinsic}
        onNavigate={onNavigate}
      />

      {effect && <EffectInfo effect={effect} />}

      <LookupChain
        displayName={displayName}
        chainValid={chainValid}
        familyClass={familyClass}
        refAxes={refAxes}
        classLetter={classLetter}
        aRank={aRank}
        aParity={aParity}
        aTime={aTime}
        t7chain={t7chain}
        t7Contradiction={t7Contradiction}
        t7SourceRefAxes={t7SourceRefAxes}
        diagramOpen={diagramOpen}
        setDiagramOpen={setDiagramOpen}
        selectedGroup={selectedGroup}
        onNavigate={onNavigate}
      />

      <TensorFormResult
        form={form!}
        forbiddenName={forbiddenName}
        isEffect={!!effect}
        displayName={displayName}
        aRank={aRank}
        aParity={aParity}
        aTime={aTime}
        aIntrinsic={aIntrinsic}
        usesMatrix={usesMatrix}
        labels={labels}
        formLabel={formLabel}
        independentCount={independentCount}
        vanishing={vanishing}
        dim={dim}
        toSym={toSym}
        onNavigate={onNavigate}
      />

      <GroupSharingList
        sharingOpen={sharingOpen}
        setSharingOpen={setSharingOpen}
        sharing={sharing}
        selectedGroupName={selectedGroup.name}
        onSelectGroup={onSelectGroup}
        convention={convention}
        onNavigate={onNavigate}
      />
    </motion.div>
  );
}
