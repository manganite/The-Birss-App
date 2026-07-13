import type { Dispatch, SetStateAction } from 'react';
import { InlineMath } from 'react-katex';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { PointGroupData } from '../../data/pointGroups';
import { type TensorRank, type TensorParity, type TensorTimeParity } from '../../services/tensorForms';
import { type Table7Chain } from '../../data/groupNotation';
import { LookupChainDiagram } from '../LookupChainDiagram';
import { TermInfo } from '../TermInfo';
import { bar } from './shared';

const RANK_TABLE = ['4b', '4c', '4d', '4e', '4f'];

interface LookupChainProps {
  displayName: string;
  chainValid: boolean;
  familyClass: string;
  refAxes: string | undefined;
  classLetter: string | null;
  aRank: TensorRank;
  aParity: TensorParity;
  aTime: TensorTimeParity;
  t7chain: Table7Chain | null;
  t7Contradiction: boolean;
  t7SourceRefAxes: string | undefined;
  diagramOpen: boolean;
  setDiagramOpen: Dispatch<SetStateAction<boolean>>;
  selectedGroup: PointGroupData;
  onNavigate: (view: string, tab?: string) => void;
}

/** The Birss/ITC lookup-chain breadcrumb (classical family-class path or the Table-7 magnetic path),
 *  plus the expandable diagram. */
export function LookupChain({
  displayName,
  chainValid,
  familyClass,
  refAxes,
  classLetter,
  aRank,
  aParity,
  aTime,
  t7chain,
  t7Contradiction,
  t7SourceRefAxes,
  diagramOpen,
  setDiagramOpen,
  selectedGroup,
  onNavigate,
}: LookupChainProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/60 bg-ink/5 border border-ink/10 px-4 py-2.5 rounded-sm">
        <span className="font-serif italic text-ink">
          <InlineMath math={bar(displayName)} />
        </span>

        {chainValid ? (
          <>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span>
              family class{' '}
              <span className="font-serif italic text-ink/80">
                <InlineMath math={bar(familyClass)} />
              </span>{' '}
              <span className="opacity-50">(Table 4a)</span>
            </span>
            {refAxes && (
              <>
                <ChevronRight className="w-3 h-3 opacity-40" />
                <span className="inline-flex items-center gap-1">
                  ref. axes{' '}
                  {refAxes === 'any' ? (
                    <span className="italic">any</span>
                  ) : (
                    <InlineMath math={bar(refAxes.replace(/\/\//g, ' \\parallel '))} />
                  )}{' '}
                  <TermInfo id="tbl-ref-axes" onNavigate={onNavigate} />
                </span>
              </>
            )}
            <ChevronRight className="w-3 h-3 opacity-40" />
            {classLetter ? (
              <span>
                Table {RANK_TABLE[aRank]} row{' '}
                <span className="font-mono text-ink/80">
                  {classLetter}
                  {aRank}
                </span>
              </span>
            ) : (
              <span className="italic inline-flex items-center gap-1">
                no allowed form (Table 4a: —) <TermInfo id="tbl-no-form" onNavigate={onNavigate} />
              </span>
            )}
          </>
        ) : t7chain && !t7Contradiction ? (
          <>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span>
              Table 7 <span className="opacity-50">({t7chain.column})</span>
            </span>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span>
              {t7chain.source} ={' '}
              <span className="font-serif italic text-ink/80">
                <InlineMath math={bar(t7chain.sourceSymbol)} />
              </span>
              {t7chain.sourceBracketed && t7chain.transformLabel && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wide bg-ink/10 text-ink/70 rounded-sm inline-flex items-center gap-1">
                  rotated: {t7chain.transformLabel}
                  <TermInfo id="tbl-rotated" onNavigate={onNavigate} />
                </span>
              )}
            </span>
            {t7SourceRefAxes && (
              <>
                <ChevronRight className="w-3 h-3 opacity-40" />
                <span className="inline-flex items-center gap-1">
                  ref. axes{' '}
                  {t7SourceRefAxes === 'any' ? (
                    <span className="italic">any</span>
                  ) : (
                    <InlineMath math={bar(t7SourceRefAxes.replace(/\/\//g, ' \\parallel '))} />
                  )}{' '}
                  <TermInfo id="tbl-ref-axes" onNavigate={onNavigate} />
                </span>
              </>
            )}
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="inline-flex items-center">
              Table 4a, {t7chain.fourAColumn} column
              {t7chain.parityCrossover && (
                <span className="text-ink font-semibold ml-0.5">
                  *<TermInfo id="tbl-crossover" onNavigate={onNavigate} />
                </span>
              )}
            </span>
            <ChevronRight className="w-3 h-3 opacity-40" />
            {t7chain.letter ? (
              <span>
                class {t7chain.letter} <ChevronRight className="inline w-3 h-3 opacity-40" /> Table {RANK_TABLE[aRank]}{' '}
                row{' '}
                <span className="font-mono text-ink/80">
                  {t7chain.letter}
                  {aRank}
                </span>
              </span>
            ) : (
              <span className="italic inline-flex items-center gap-1">
                no allowed form (Table 4a: —) <TermInfo id="tbl-no-form" onNavigate={onNavigate} />
              </span>
            )}
          </>
        ) : t7chain ? (
          <>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="italic">c-tensor lookup runs via Birss Table 7 (magnetic classes)</span>
          </>
        ) : (
          <>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="italic inline-flex items-center gap-1">
              grey group <ChevronRight className="inline w-3 h-3 opacity-40" /> time reversal alone is a symmetry{' '}
              <ChevronRight className="inline w-3 h-3 opacity-40" /> c-tensor vanishes identically (no Table-7 row){' '}
              <TermInfo id="tbl-grey-tail" onNavigate={onNavigate} />
            </span>
          </>
        )}
      </div>
      {t7chain?.bookErrorNote && (
        <p className="text-[11px] text-ink/50 italic px-1">
          ⚠ {t7chain.bookErrorNote}
          {onNavigate && (
            <>
              {' '}
              <button
                type="button"
                onClick={() => onNavigate('help', 'deeper')}
                className="not-italic uppercase tracking-wider text-ink/60 hover:text-ink"
              >
                Learn more →
              </button>
            </>
          )}
        </p>
      )}
      <div>
        <button
          type="button"
          aria-expanded={diagramOpen}
          onClick={() => setDiagramOpen((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-ink/50 hover:text-ink"
        >
          {diagramOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {diagramOpen ? 'Hide diagram' : 'Show diagram'}
        </button>
        {diagramOpen && (
          <div className="mt-3">
            <LookupChainDiagram
              groupName={selectedGroup.name}
              groupType={selectedGroup.type}
              parity={aParity}
              rank={aRank}
              timeParity={aTime}
              displayName={displayName}
              onNavigate={onNavigate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
