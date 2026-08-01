import { TermInfo } from './TermInfo';
import { admittedHeaderFlags } from './propertyFlagDefs';

/**
 * The property flags a point group admits, as compact badges under the group identity header.
 *
 * Only ADMITTED flags are drawn -- an absent one is simply not there. The header is present on the
 * Calculator, Simulator and Tables pages at all times, so it has to stay quiet: four struck-through
 * badges on every centrosymmetric crystal would be noise on every page. The Explorer's operations
 * modal makes the opposite choice deliberately, because in a lookup view absence is the answer; see
 * `propertyFlagDefs.ts`.
 *
 * Each badge states what the symmetry PERMITS, never what a material does: `2'/m'` admits a
 * spontaneous magnetization, which is a statement about the point group, not a claim that any
 * particular crystal in it is magnetically ordered. The glossary brief behind each badge's info
 * affordance says so, and cites the reference that flag is guarded against.
 *
 * Placement: this renders as its own row BELOW the collapsible header block, not inside it. The
 * header's summary row is itself a `<button>`, and an info affordance nested inside a button is
 * invalid and unusable; putting the badges in the expandable panel instead would hide them for
 * every group without alternate settings, since the panel starts collapsed for those -- which is
 * most groups, and would defeat the point of surfacing the flags at all.
 */
export function PropertyFlagBadges({
  groupName,
  onNavigate,
}: {
  groupName: string;
  onNavigate?: (view: string, tab?: string) => void;
}) {
  const admitted = admittedHeaderFlags(groupName);
  if (admitted.length === 0) return null;

  return (
    <ul aria-label="Properties admitted by this point group" className="flex flex-wrap gap-1.5 mt-2">
      {admitted.map((flag) => (
        <li
          key={flag.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-ink border-opacity-20 text-ink/70"
        >
          {flag.label}
          <TermInfo id={flag.id} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
  );
}
