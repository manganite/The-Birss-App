import { InlineMath } from 'react-katex';
import { ChevronDown } from 'lucide-react';
import {
  classicalChainApplies, getFamilyClass, getClassLetter, getTable7Chain,
  TABLE_4A_CLASS_LETTERS, REFERENCE_AXES, type ClassLetters,
} from '../data/groupNotation';
import type { TensorParity, TensorTimeParity } from '../services/tensorForms';
import { TermInfo } from './TermInfo';

/**
 * A monochrome diagram of the Birss lookup chain for the current (group, tensor spec). Three
 * variants, all computed here from the same helpers the breadcrumb uses, so Help examples can never
 * drift from `getTable7Chain`:
 *   - classical (Type I group, or any i-tensor): single-source chain through the group's own family
 *     class -> Table 4a row -> class letter -> rank-table row;
 *   - Table 7 (Type III c-tensor): the A/B fork (unchosen source dimmed), the source's full Table 4a
 *     row strip with the read column highlighted, and the parity-crossover marker;
 *   - grey (Type II c-tensor): time reversal alone forbids the tensor.
 *
 * Palette: strictly two-tone (ink #141414 / paper #E4E3E0). Emphasis is opacity, stroke weight and
 * fill inversion only -- source = ink wash + bold border; unchosen source dimmed; crossover =
 * dashed heavier arrow; chain endpoints (tensor tag, final row chip) = inverted.
 */

const bar = (s: string) => s.replace(/-([1-6])/g, '\\bar{$1}');
const axes = (s: string) => bar(s.replace(/\/\//g, ' \\parallel '));
const RANK_TABLE = ['4b', '4c', '4d', '4e', '4f'];

type ColKey = keyof ClassLetters;
const FOUR_A_COLS: { key: ColKey; label: string }[] = [
  { key: 'polarEven', label: 'Polar, even' },
  { key: 'axialEven', label: 'Axial, even' },
  { key: 'polarOdd', label: 'Polar, odd' },
  { key: 'axialOdd', label: 'Axial, odd' },
];
const ownColKey = (parity: TensorParity, rank: number): ColKey => {
  const even = rank % 2 === 0;
  return parity === 'polar' ? (even ? 'polarEven' : 'polarOdd') : (even ? 'axialEven' : 'axialOdd');
};

interface LookupChainDiagramProps {
  groupName: string;
  groupType: 'I' | 'II' | 'III';
  parity: TensorParity;
  rank: number;
  timeParity: TensorTimeParity;
  /** convention-aware display label; defaults to the app key */
  displayName?: string;
  onNavigate?: (view: string, tab?: string) => void;
}

const Sym = ({ s }: { s: string }) => <InlineMath math={bar(s)} />;

/** A chip: the visual building block. `tone` maps to the prototype's emphasis levels. */
function Chip({ tone = 'plain', children }: { tone?: 'plain' | 'source' | 'dim' | 'invert'; children: React.ReactNode }) {
  const cls = {
    plain: 'border border-ink/35 text-ink',
    source: 'border-[1.8px] border-ink bg-ink/10 text-ink font-semibold',
    dim: 'border border-ink/20 text-ink/30',
    invert: 'bg-ink text-paper border border-ink',
  }[tone];
  return <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm ${cls}`}>{children}</div>;
}

const Down = () => <ChevronDown className="w-4 h-4 text-ink/40 my-0.5" aria-hidden />;

/** The source's Table-4a row: four columns, the read column highlighted. */
function Table4aStrip({ classKey, readCol }: { classKey: string; readCol: ColKey }) {
  const letters = TABLE_4A_CLASS_LETTERS[classKey];
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Table 4a — row <span className="font-mono">{classKey}</span></div>
      <div className="flex flex-wrap gap-1.5">
        {FOUR_A_COLS.map(col => {
          const letter = letters?.[col.key] ?? null;
          const read = col.key === readCol;
          return (
            <div key={col.key} className={`px-2.5 py-1.5 rounded-sm text-center min-w-[4.5rem] ${read ? 'border-[1.8px] border-ink bg-ink/10' : 'border border-ink/25'}`}>
              <div className={`text-[9px] uppercase tracking-wide ${read ? 'text-ink font-semibold' : 'text-ink/45'}`}>{col.label}</div>
              <div className={`font-mono text-sm ${read ? 'text-ink font-bold' : 'text-ink/55'}`}>{letter ?? '—'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LookupChainDiagram({ groupName, groupType, parity, rank, timeParity, displayName, onNavigate }: LookupChainDiagramProps) {
  const label = displayName ?? groupName;
  const chainValid = classicalChainApplies(groupType, timeParity);
  const chain = chainValid ? null : getTable7Chain(groupName, parity, rank);
  const evenLabel = rank % 2 === 0 ? 'even' : 'odd';

  const groupChip = (
    <Chip tone="plain">
      <span className="font-serif italic"><Sym s={label} /></span>
    </Chip>
  );

  // Terminal chips shared by the classical / Table-7 variants (class -> rank-table row, or "no form").
  const terminal = (letter: string | null) => (
    letter ? (
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="plain">class <span className="font-mono font-bold ml-1">{letter}</span></Chip>
        <Down />
        <Chip tone="invert">Table {RANK_TABLE[rank]} · row <span className="font-mono ml-1">{letter}{rank}</span></Chip>
      </div>
    ) : (
      <Chip tone="plain"><span className="italic text-ink/60">no allowed form (Table 4a: —)</span></Chip>
    )
  );

  const tensorTag = (
    <Chip tone="invert">your tensor: {parity} · {evenLabel}</Chip>
  );

  // ---- grey variant: Type II c-tensor -------------------------------------------------------
  if (!chainValid && !chain) {
    return (
      <div className="flex flex-col items-start gap-1 border border-ink/10 bg-ink/5 rounded-sm p-5">
        {groupChip}
        <Down />
        <Chip tone="invert">time reversal <InlineMath math="1'" /> is a symmetry</Chip>
        <Down />
        <Chip tone="plain"><span className="italic">c-tensor vanishes identically</span>
          {onNavigate && <TermInfo id="tbl-grey-tail" onNavigate={onNavigate} />}
        </Chip>
      </div>
    );
  }

  // ---- Table-7 variant: Type III c-tensor ---------------------------------------------------
  if (chain) {
    const readCol = chain.fourAColumn === 'Axial-even' ? 'axialEven' : 'polarOdd';
    const srcAxes = REFERENCE_AXES[chain.sourceClass];
    return (
      <div className="flex flex-col items-start gap-1 border border-ink/10 bg-ink/5 rounded-sm p-5">
        {groupChip}
        <div className="text-[10px] uppercase tracking-widest text-ink/45 pl-1 pt-0.5">Table 7 · {chain.column}</div>
        <Down />
        {/* A / B fork: unchosen source dimmed, chosen marked SOURCE */}
        <div className="flex flex-wrap items-start gap-3">
          <Chip tone={chain.source === 'A' ? 'source' : 'dim'}>
            A = <span className="font-serif italic"><Sym s={chain.source === 'A' ? chain.sourceSymbol : altSymbol(groupName, 'A')} /></span>
            {chain.source === 'A' && chain.sourceBracketed && chain.transformLabel && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wide bg-ink/10 text-ink/70 rounded-sm">rotated: {chain.transformLabel}
                {onNavigate && <TermInfo id="tbl-rotated" onNavigate={onNavigate} />}
              </span>
            )}
          </Chip>
          <Chip tone={chain.source === 'B' ? 'source' : 'dim'}>
            B = <span className="font-serif italic"><Sym s={chain.source === 'B' ? chain.sourceSymbol : altSymbol(groupName, 'B')} /></span>
            {chain.source === 'B' && chain.sourceBracketed && chain.transformLabel && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wide bg-ink/10 text-ink/70 rounded-sm">rotated: {chain.transformLabel}
                {onNavigate && <TermInfo id="tbl-rotated" onNavigate={onNavigate} />}
              </span>
            )}
          </Chip>
        </div>
        <div className="text-[11px] text-ink/55 pl-1 pt-1">rule: {parity} + {evenLabel} rank → read {chain.source}</div>
        <Down />
        <div className="flex flex-wrap items-center gap-2 pb-1">
          {tensorTag}
          {chain.parityCrossover && (
            <span className="inline-flex items-center gap-1 text-[11px] italic font-semibold text-ink">
              <span className="inline-block border-t-2 border-dashed border-ink w-6" aria-hidden /> parity crossover
              {onNavigate && <TermInfo id="tbl-crossover" onNavigate={onNavigate} />}
            </span>
          )}
        </div>
        <Table4aStrip classKey={chain.sourceClass} readCol={readCol} />
        {srcAxes && (
          <div className="text-[11px] text-ink/50 pl-1 pt-1">source reference axes: {srcAxes === 'any' ? <span className="italic">any</span> : <InlineMath math={axes(srcAxes)} />}
            {onNavigate && <TermInfo id="tbl-ref-axes" onNavigate={onNavigate} />}
          </div>
        )}
        <Down />
        {terminal(chain.letter)}
        {chain.bookErrorNote && <p className="text-[11px] text-ink/50 italic pt-2">⚠ {chain.bookErrorNote}</p>}
      </div>
    );
  }

  // ---- classical variant: Type I, or any i-tensor -------------------------------------------
  const familyClass = getFamilyClass(groupName);
  const readCol = ownColKey(parity, rank);
  const letter = getClassLetter(groupName, parity, rank);
  const famAxes = REFERENCE_AXES[familyClass];
  return (
    <div className="flex flex-col items-start gap-1 border border-ink/10 bg-ink/5 rounded-sm p-5">
      {groupChip}
      <div className="text-[10px] uppercase tracking-widest text-ink/45 pl-1 pt-0.5">family class <span className="font-serif italic"><Sym s={familyClass} /></span></div>
      <Down />
      <div className="pb-1">{tensorTag}</div>
      <Table4aStrip classKey={familyClass} readCol={readCol} />
      {famAxes && (
        <div className="text-[11px] text-ink/50 pl-1 pt-1">reference axes: {famAxes === 'any' ? <span className="italic">any</span> : <InlineMath math={axes(famAxes)} />}
          {onNavigate && <TermInfo id="tbl-ref-axes" onNavigate={onNavigate} />}
        </div>
      )}
      <Down />
      {terminal(letter)}
    </div>
  );
}

/** The other (unchosen) associated classical group's printed symbol, for the dimmed fork branch.
 * Read straight from the Table-7 row via a throwaway getTable7Chain call that selects it. */
function altSymbol(groupName: string, want: 'A' | 'B'): string {
  // A is the source for axial-even / polar-odd; B for polar-even / axial-odd. Pick a spec that makes
  // `want` the source, so getTable7Chain hands back that symbol.
  const probe = want === 'A'
    ? getTable7Chain(groupName, 'axial', 2)   // axial-even -> source A
    : getTable7Chain(groupName, 'polar', 2);  // polar-even -> source B
  return probe?.sourceSymbol ?? '?';
}
