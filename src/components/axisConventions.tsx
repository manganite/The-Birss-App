import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Compass, BookOpen } from 'lucide-react';
import { getConventionNote, getBookErrorWarning, CONVENTION_NOTES } from '../services/conventionMapping';
import type { Convention } from '../services/conventionMapping';
import { TermInfo } from './TermInfo';

export type MonoclinicFrame = 'c-unique' | 'b-unique';

/**
 * Which monoclinic setting's frame to display: the explicit setting wins when known
 * (Calculator/Simulator, where a group is open); otherwise falls back to the active convention's
 * standard setting (Explorer, where no per-group setting is selected yet).
 */
export function getMonoclinicFrame(setting: number | undefined, convention: Convention): MonoclinicFrame {
  if (setting !== undefined) return setting === 2 ? 'b-unique' : 'c-unique';
  return convention === 'itc' ? 'b-unique' : 'c-unique';
}

/**
 * Verified Cartesian-axis labels for each monoclinic setting (Haussuehl / IRE 1949 convention;
 * handedness X = Y x Z). Display-only -- the tensor is unaffected by which in-plane axis about the
 * unique axis is labelled which.
 */
export const MONOCLINIC_FRAMES: Record<MonoclinicFrame, { unique: 'y' | 'z'; x: string; y: string; z: string }> = {
  'c-unique': { unique: 'z', z: 'c', x: 'a', y: 'b^*' },
  'b-unique': { unique: 'y', y: 'b', z: 'c', x: 'a^*' },
};

const AXIS_TOOLTIP_ID: Record<string, string> = {
  Triclinic: 'axis-triclinic',
  Monoclinic: 'axis-monoclinic',
  Orthorhombic: 'axis-orthorhombic',
  Tetragonal: 'axis-orthorhombic',
  Cubic: 'axis-orthorhombic',
  Trigonal: 'axis-trigonal',
  Hexagonal: 'axis-trigonal',
};

/** The glossary id for this crystal system's axis-orientation tooltip, or null if the system has
 * no axis-orientation box at all (keeps the id map and the box's own switch in one place). */
export function getAxisTooltipId(crystalSystem: string): string | null {
  return AXIS_TOOLTIP_ID[crystalSystem] ?? null;
}

export function AxisOrientationInfo({ crystalSystem, convention, setting, onNavigate }: {
  crystalSystem: string;
  convention?: Convention;
  setting?: number;
  onNavigate?: (view: string, tab?: string) => void;
}) {
  let content = null;
  switch (crystalSystem) {
    case 'Triclinic':
      content = (
        <>
          <span className="font-mono font-medium">z</span> ∥ <InlineMath math="c" /><br/>
          <span className="font-mono font-medium">y</span> ∥ (<InlineMath math="c \times a" />) (∥ <InlineMath math="b^*" />)<br/>
          <span className="font-mono font-medium">x</span> = <InlineMath math="y \times z" /> (projection of <InlineMath math="a" /> onto plane ⊥ <InlineMath math="c" />)
        </>
      );
      break;
    case 'Monoclinic': {
      const frame = MONOCLINIC_FRAMES[getMonoclinicFrame(setting, convention ?? 'birss')];
      const qualifier = ' (unique axis: ∥ 2-fold or ⊥ mirror)';
      content = frame.unique === 'z' ? (
        <>
          <span className="font-mono font-medium">z</span> ∥ <InlineMath math={frame.z} />{qualifier}<br/>
          <span className="font-mono font-medium">x</span> ∥ <InlineMath math={frame.x} /><br/>
          <span className="font-mono font-medium">y</span> ∥ <InlineMath math={frame.y} /> (completing the right-handed frame)
        </>
      ) : (
        <>
          <span className="font-mono font-medium">y</span> ∥ <InlineMath math={frame.y} />{qualifier}<br/>
          <span className="font-mono font-medium">z</span> ∥ <InlineMath math={frame.z} /><br/>
          <span className="font-mono font-medium">x</span> ∥ <InlineMath math={frame.x} /> (completing the right-handed frame)
        </>
      );
      break;
    }
    case 'Orthorhombic':
    case 'Tetragonal':
    case 'Cubic':
      content = (
        <>
          <span className="font-mono font-medium">x</span> ∥ <InlineMath math="[100]" />, <span className="font-mono font-medium">y</span> ∥ <InlineMath math="[010]" />, <span className="font-mono font-medium">z</span> ∥ <InlineMath math="[001]" />
        </>
      );
      break;
    case 'Trigonal':
    case 'Hexagonal':
      content = (
        <>
          <span className="font-mono font-medium">z</span> ∥ <InlineMath math="[001]" /> / <InlineMath math="[0001]" /> (c-axis)<br/>
          <span className="font-mono font-medium">x</span> ∥ <InlineMath math="[100]" /> / <InlineMath math="[2\bar{1}\bar{1}0]" /> (a-axis)<br/>
          <span className="font-mono font-medium">y</span> ∥ <InlineMath math="[120]" /> / <InlineMath math="[01\bar{1}0]" />
        </>
      );
      break;
  }

  if (!content) return null;

  const tooltipId = getAxisTooltipId(crystalSystem);

  return (
    <div className="p-4 border border-ink border-opacity-10 space-y-2 bg-ink/5">
      <div className="text-xs uppercase tracking-widest text-ink/70 flex items-center gap-1.5">
        <Compass className="w-3 h-3" />
        Axis Orientation
        {tooltipId && <TermInfo id={tooltipId} onNavigate={onNavigate} />}
      </div>
      <p className="text-xs leading-relaxed opacity-70">
        {content}
      </p>
    </div>
  );
}

export function ConventionNote({ groupName }: { groupName: string }) {
  const noteKey = getConventionNote(groupName);
  const bookErrorWarning = getBookErrorWarning(groupName);
  if (!noteKey) return null;
  return (
    <p className="text-xs text-ink/70 leading-relaxed flex items-start gap-1.5 w-0 min-w-full">
      <BookOpen className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
      <span>
        {CONVENTION_NOTES[noteKey]}
        {bookErrorWarning && <span className="block mt-1">{bookErrorWarning}</span>}
      </span>
    </p>
  );
}
