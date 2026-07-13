import type { Dispatch, SetStateAction } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PointGroupData } from '../../data/pointGroups';
import { FormatPointGroup } from '../notation';
import { TermInfo } from '../TermInfo';
import { getGroupDisplayName } from '../../services/conventionMapping';
import type { Convention } from '../../services/conventionMapping';

/** Sub-blocks for the "Groups sharing this form" list, in colour-name-primary nomenclature, ordered
 * I -> II -> III. Empty blocks are omitted at render. */
const SHARING_TYPE_BLOCKS: [PointGroupData['type'], string][] = [
  ['I', 'colourless (Type I)'],
  ['II', 'grey (Type II)'],
  ['III', 'black-white (Type III)'],
];

interface GroupSharingListProps {
  sharingOpen: boolean;
  setSharingOpen: Dispatch<SetStateAction<boolean>>;
  sharing: PointGroupData[] | null;
  selectedGroupName: string;
  onSelectGroup?: (group: PointGroupData) => void;
  convention: Convention;
  onNavigate: (view: string, tab?: string) => void;
}

/** The collapsible "Groups sharing this form" list, grouped by magnetic type. */
export function GroupSharingList({
  sharingOpen,
  setSharingOpen,
  sharing,
  selectedGroupName,
  onSelectGroup,
  convention,
  onNavigate,
}: GroupSharingListProps) {
  return (
    <div className="border-t border-ink border-opacity-10 pt-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={sharingOpen}
          onClick={() => setSharingOpen((v) => !v)}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink/70 hover:text-ink"
        >
          {sharingOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Groups sharing this form{sharing ? ` (${sharing.length})` : ''}
        </button>
        <TermInfo id="tbl-sharing" onNavigate={onNavigate} />
      </div>
      {sharingOpen && sharing && (
        <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
          {SHARING_TYPE_BLOCKS.map(([type, label]) => {
            const groups = sharing.filter((g) => g.type === type);
            if (groups.length === 0) return null;
            return (
              <div key={type}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 mb-1.5">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => {
                    const isCurrent = g.name === selectedGroupName;
                    const interactive = !isCurrent && !!onSelectGroup;
                    return (
                      <button
                        key={g.name}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && onSelectGroup!(g)}
                        className={`px-2.5 py-1 text-sm border transition-colors ${isCurrent ? 'bg-ink text-paper border-ink' : interactive ? 'border-ink/20 hover:bg-ink hover:text-paper' : 'border-ink/20 text-ink/50 cursor-default'}`}
                      >
                        <FormatPointGroup name={getGroupDisplayName(g.name, convention)} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
