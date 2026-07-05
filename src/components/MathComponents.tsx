import { useState, type ReactNode } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Box, Hexagon, Triangle, Layers, Compass, Info, ChevronDown, ChevronUp, ExternalLink, FlipHorizontal2, BookOpen } from 'lucide-react';
import { hklToPresetAngles } from '../services/orientation';
import { isCentrosymmetric, getParentGroup, getHalvingSubgroup, getSHGConsequenceShort, getAlternateSettings, getFutureSettingCount } from '../services/tensorCalculator';
import { getGroupDisplayName, getSettingLabels, getConventionNote, getBookErrorWarning, CONVENTION_NOTES } from '../services/conventionMapping';
import type { Convention } from '../services/conventionMapping';
import { PointGroupData } from '../data/pointGroups';
import { TermInfo } from './TermInfo';

export function SectionHeader({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h4 className="text-xs uppercase tracking-[0.2em] text-ink/70 flex items-center gap-2">
      {icon}
      {children}
    </h4>
  );
}

export const getCrystalIcon = (system: string) => {
  switch (system.toLowerCase()) {
    case 'cubic': return <Box className="w-5 h-5" />;
    case 'hexagonal': return <Hexagon className="w-5 h-5" />;
    case 'trigonal': return <Triangle className="w-5 h-5" />;
    case 'tetragonal': return <Box className="w-5 h-5 scale-y-125" />;
    case 'orthorhombic': return <Box className="w-5 h-5 scale-x-125" />;
    case 'monoclinic': return <Box className="w-5 h-5 skew-x-12" />;
    case 'triclinic': return <Box className="w-5 h-5 skew-x-12 skew-y-6" />;
    default: return <Layers className="w-5 h-5" />;
  }
};

export interface KPreset {
  label: string;
  math: string;
  tx: number;
  ty: number;
  psi0: number;
}

function makePreset(label: string, h: number, k: number, l: number): KPreset {
  const o = hklToPresetAngles(h, k, l)!;
  return { label, math: `k \\parallel ${label}`, tx: o.tx, ty: o.ty, psi0: o.psi0 };
}

const PRESET_Y = makePreset('[010]', 0, 1, 0);

const ORTHO_PRESETS: KPreset[] = [
  makePreset('[100]', 1, 0, 0),
  makePreset('[010]', 0, 1, 0),
  makePreset('[001]', 0, 0, 1),
];

const HEX_TRIG_PRESETS: KPreset[] = [
  makePreset('[001]', 0, 0, 1),
  makePreset('[100]', 1, 0, 0),
  { label: '[120]', math: 'k \\parallel [120]', tx: PRESET_Y.tx, ty: PRESET_Y.ty, psi0: PRESET_Y.psi0 },
];

const MONO_TRI_PRESETS: KPreset[] = [
  makePreset('[001]', 0, 0, 1),
  makePreset('[100]', 1, 0, 0),
  { label: '[010] ∥ b*', math: 'k \\parallel [010] \\parallel b^*', tx: PRESET_Y.tx, ty: PRESET_Y.ty, psi0: PRESET_Y.psi0 },
];

const PRESETS_BY_SYSTEM: Record<string, KPreset[]> = {
  Cubic: [makePreset('[100]', 1, 0, 0), makePreset('[111]', 1, 1, 1), makePreset('[110]', 1, 1, 0)],
  Tetragonal: [makePreset('[001]', 0, 0, 1), makePreset('[100]', 1, 0, 0), makePreset('[110]', 1, 1, 0)],
  Orthorhombic: ORTHO_PRESETS,
  Hexagonal: HEX_TRIG_PRESETS,
  Trigonal: HEX_TRIG_PRESETS,
  Monoclinic: MONO_TRI_PRESETS,
  Triclinic: MONO_TRI_PRESETS,
};

export function getPresetsForSystem(crystalSystem: string): KPreset[] {
  return PRESETS_BY_SYSTEM[crystalSystem] ?? ORTHO_PRESETS;
}

export function LabFrameOrientation({ labFrame }: { labFrame: { X: string; Y: string; Z: string; inverse: { X: string; Y: string; Z: string } } }) {
  const [showInverse, setShowInverse] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const fwd = labFrame;
  const inv = labFrame.inverse;

  return (
    <div className="flex-1 bg-ink/5 p-4 border border-ink/10 rounded-sm w-full">
      <div className="flex items-center justify-between mb-3">
        <SectionHeader>
          {showInverse ? 'Lab axes in the crystal frame' : 'Crystal axes in the lab frame'}
        </SectionHeader>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setShowInverse(v => !v)}
            className="text-xs opacity-70 hover:opacity-100 transition-opacity px-1.5 py-0.5 border border-ink/10 rounded-sm"
            title={showInverse ? 'Show crystal → lab' : 'Show lab → crystal'}
          >{showInverse ? '↔ crystal' : '↔ inverse'}</button>
          <button type="button" onClick={() => setShowLegend(v => !v)}
            className="opacity-40 hover:opacity-80 transition-opacity p-0.5"
            title="Symbol legend"
          ><Info className="w-3 h-3" /></button>
        </div>
      </div>
      <div className="flex flex-col gap-3 text-sm font-mono">
        {showInverse ? (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <InlineMath math={`\\mathbf{X}_{LAB} = ${inv.X}`} />
            <InlineMath math={`\\mathbf{Y}_{LAB} = ${inv.Y}`} />
            <InlineMath math={`\\mathbf{Z}_{LAB} = ${inv.Z}`} />
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <InlineMath math={`\\mathbf{x}_{crys} = ${fwd.X}`} />
            <InlineMath math={`\\mathbf{y}_{crys} = ${fwd.Y}`} />
            <InlineMath math={`\\mathbf{z}_{crys} = ${fwd.Z}`} />
          </div>
        )}
      </div>
      {showLegend && (
        <div className="mt-3 pt-3 border-t border-ink/10 text-xs text-ink/70 leading-relaxed space-y-1">
          <p><strong>x, y, z</strong> (crys) — crystal Cartesian axes (z∥c, y∥b*, x per system convention)</p>
          <p><strong>X, Y, Z</strong> (LAB) — lab axes: Z = beam direction (k), X/Y = polarization plane (0°/90°)</p>
          <p>At zero tilt, the selected crystal cut normal is aligned with Z (the beam).</p>
        </div>
      )}
    </div>
  );
}

interface KDirectionSelectorProps {
  crystalSystem: string;
  thetaX: number; thetaY: number; psi0: number;
  setThetaX: (v: number) => void;
  setThetaY: (v: number) => void;
  setPsi0: (v: number) => void;
  labFrame: { X: string; Y: string; Z: string; inverse: { X: string; Y: string; Z: string } };
  compact?: boolean;
  onNavigate?: (view: string, tab?: string) => void;
}

export function KDirectionSelector({ crystalSystem, thetaX, thetaY, psi0, setThetaX, setThetaY, setPsi0, labFrame, compact, onNavigate }: KDirectionSelectorProps) {
  const presets = getPresetsForSystem(crystalSystem);
  return (
    <div className="space-y-3">
      {!compact && (
        <SectionHeader icon={<Compass className="w-3 h-3" />}>
          Crystal Cut (surface normal ∥ k)
          <TermInfo id="crystal-cut" onNavigate={onNavigate} />
        </SectionHeader>
      )}
      {compact && (
        <span className="text-xs uppercase tracking-[0.2em] text-ink/70 flex items-center gap-1">
          <Compass className="w-3 h-3" />
          Crystal Cut
          <TermInfo id="crystal-cut" onNavigate={onNavigate} />
        </span>
      )}
      <div className="flex flex-wrap gap-3 items-center">
        {presets.map((ori) => (
          <button
            key={ori.label}
            onClick={() => { setThetaX(ori.tx); setThetaY(ori.ty); setPsi0(ori.psi0); }}
            className={`${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs'} tracking-[0.1em] transition-all border border-ink ${
              thetaX === ori.tx && thetaY === ori.ty && psi0 === ori.psi0
                ? 'bg-ink text-paper'
                : `${compact ? '' : 'hover:bg-ink hover:text-paper'} text-ink/70 ${compact ? '' : 'hover:text-ink'} border-opacity-20`
            }`}
          >
            <InlineMath math={ori.math} />
          </button>
        ))}
      </div>
      {!compact && (
        <div className="flex flex-col md:flex-row gap-8 items-start mt-3">
          <LabFrameOrientation labFrame={labFrame} />
        </div>
      )}
    </div>
  );
}

export const TensorTerm = ({ term, isNull }: { term?: string; isNull: boolean }) => {
  if (!term) return null;
  
  return (
    <span className={isNull ? 'opacity-30' : 'text-ink'}>
      <InlineMath math={term} />
    </span>
  );
};

export const FormatPointGroup = ({ name }: { name: string }) => {
  const latex = name.replace(/-([1-6])/g, '\\bar{$1}');
  return <InlineMath math={latex} />;
};

const HM_SYMBOL_PATTERN = /^[-\d/m']+$/;

export const FormatGroupLabel = ({ label }: { label: string }) => (
  HM_SYMBOL_PATTERN.test(label) ? <FormatPointGroup name={label} /> : <>{label}</>
);

export const FormatSchoenflies = ({ symbol }: { symbol: string }) => {
  const formatOne = (s: string) => {
    const m = s.match(/^([A-Z])(.+)$/);
    return m ? `${m[1]}_{${m[2]}}` : s;
  };
  const match = symbol.match(/^([A-Za-z0-9]+)(?:\(([A-Za-z0-9]+)\))?$/);
  if (!match) return <InlineMath math={symbol} />;
  const [, main, sub] = match;
  const latex = sub ? `${formatOne(main)}(${formatOne(sub)})` : formatOne(main);
  return <InlineMath math={latex} />;
};

export const SymmetryOperation = ({ symbol }: { symbol: string }) => {
  const match = symbol.match(/^(-?\d|m)(?:_([a-z\[\]0-9-°]+))?([⁺⁻])?(')?$/);
  if (!match) return <span className="inline-flex items-center text-xs bg-white/50 px-2 py-1 border border-ink border-opacity-10 rounded-sm"><InlineMath math={symbol} /></span>;
  
  const [, base, axis, sign, prime] = match;
  
  let latex = '';
  
  if (base.startsWith('-')) {
    latex += `\\bar{${base.slice(1)}}`;
  } else {
    latex += base;
  }
  
  if (axis) {
    let cleanAxis = axis.replace('°', '^\\circ');
    latex += `_{${cleanAxis}}`;
  }
  
  let sup = '';
  if (sign === '⁺') sup += '+';
  if (sign === '⁻') sup += '-';
  if (prime) sup += '\\prime';
  
  if (sup) {
    latex += `^{${sup}}`;
  }
  
  return (
    <span className="inline-flex items-center text-xs bg-white/50 px-2 py-1 border border-ink border-opacity-10 rounded-sm">
      <InlineMath math={latex} />
    </span>
  );
};

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

function ConventionNote({ groupName }: { groupName: string }) {
  const noteKey = getConventionNote(groupName);
  const bookErrorWarning = getBookErrorWarning(groupName);
  if (!noteKey) return null;
  return (
    <p className="text-xs text-ink/70 leading-relaxed flex items-start gap-1.5">
      <BookOpen className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
      <span>
        {CONVENTION_NOTES[noteKey]}
        {bookErrorWarning && <span className="block mt-1">{bookErrorWarning}</span>}
      </span>
    </p>
  );
}

export function CrystalSettingControl({
  groupName,
  value,
  onChange,
  onNavigate,
  className = '',
  convention,
}: {
  groupName: string;
  value: number;
  onChange: (s: number) => void;
  className?: string;
  convention: Convention;
  onNavigate?: (view: string, tab?: string) => void;
}) {
  const altSettings = getAlternateSettings(groupName);
  const futureCount = getFutureSettingCount(groupName);
  if (!altSettings && !futureCount) return null;
  const settingLabels = getSettingLabels(groupName, convention);
  return (
    <div className={`space-y-2${className ? ` ${className}` : ''}`}>
      <div className="flex flex-wrap items-center gap-3">
        <SectionHeader>
          Crystal Setting <TermInfo id="crystal-setting" onNavigate={onNavigate} />
        </SectionHeader>
        {altSettings ? (
          <div className="flex flex-wrap gap-3">
            {settingLabels.map(({ setting, axisWord, hm }) => (
              <button
                key={setting}
                type="button"
                aria-pressed={value === setting}
                onClick={() => onChange(setting)}
                className={`px-4 py-2 text-xs transition-all border border-ink ${
                  value === setting
                    ? 'bg-ink text-paper'
                    : 'hover:bg-ink hover:text-paper text-ink/70 border-opacity-20'
                }`}
              >
                {axisWord && <span className="normal-case tracking-normal">{axisWord} </span>}
                <FormatPointGroup name={hm} />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink/70 italic">{futureCount} settings — selection coming</p>
        )}
      </div>
      <ConventionNote groupName={groupName} />
    </div>
  );
}

interface GroupIdentityHeaderProps {
  group: PointGroupData;
  setting: number;
  convention: Convention;
  onSettingChange: (s: number) => void;
  onNavigate?: (view: string, tab?: string) => void;
}

export function GroupIdentityHeader({ group, setting, convention, onSettingChange, onNavigate }: GroupIdentityHeaderProps) {
  const centro = isCentrosymmetric(group.name);
  const parent = getParentGroup(group.name);
  const halvingOps = getHalvingSubgroup(group.name);
  const shgConsequenceShort = getSHGConsequenceShort(group.name);
  const settings = getAlternateSettings(group.name);
  const settingCount = settings ? settings.length + 1 : 1;
  const [expanded, setExpanded] = useState(settingCount > 1);
  const groupTitle = getGroupDisplayName(group.name, convention);

  const panelId = `group-identity-panel-${group.name.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="space-y-0">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center justify-between w-full p-4 border border-ink border-opacity-10 bg-white/30"
      >
        <div className="flex items-center gap-3">
          {getCrystalIcon(group.crystalSystem)}
          <div className="text-left flex items-center flex-wrap gap-x-2 gap-y-1">
            <span className="text-lg font-serif italic"><FormatPointGroup name={groupTitle} /></span>
            {group.schoenflies && <span className="text-xs text-ink/70">(<FormatSchoenflies symbol={group.schoenflies} />)</span>}
            <span className="text-xs text-ink/70">{group.crystalSystem}</span>
            <span className="text-xs text-ink/70">· Type {group.type}</span>
            <span className="text-xs text-ink/70">· {centro ? 'Centrosymmetric' : 'Non-Centrosymmetric'}</span>
            {settingCount > 1 && (
              <span className="text-xs text-ink/70">· Setting {setting}/{settingCount}</span>
            )}
            <span className="text-xs text-ink/70">· {convention === 'birss' ? 'Birss' : 'ITC'}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
      </button>

      {expanded && (
        <section id={panelId} className="border border-ink border-opacity-10 border-t-0 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h2 className="text-4xl font-serif italic"><FormatPointGroup name={groupTitle} /></h2>
              {group.schoenflies && (
                <p className="text-sm text-ink/70 mt-1"><FormatSchoenflies symbol={group.schoenflies} /></p>
              )}
              <p className="text-xs uppercase tracking-widest text-ink/70 mt-1 flex items-center gap-1">
                {group.type === 'I' ? 'Standard' : group.type === 'II' ? 'Gray' : 'Magnetic'} Point Group
                <TermInfo id={`type-${group.type.toLowerCase()}`} onNavigate={onNavigate} />
              </p>
            </div>
            <div className="p-4 border border-ink border-opacity-10 space-y-2">
              <div className="text-xs uppercase tracking-widest text-ink/70 flex items-center gap-1.5">
                {getCrystalIcon(group.crystalSystem)}
                Crystal System
              </div>
              <p className="text-sm font-medium">{group.crystalSystem}</p>
            </div>
            <div className={`p-4 border border-ink space-y-2 ${centro ? 'bg-ink text-paper' : 'border-opacity-10'}`}>
              <div className="text-xs uppercase tracking-widest opacity-70 flex items-center gap-1.5">
                <FlipHorizontal2 className="w-3 h-3" />
                Symmetry Type
              </div>
              <p className="text-sm font-medium">{centro ? 'Centrosymmetric' : 'Non-Centrosymmetric'}</p>
              <p className="text-xs opacity-70 leading-relaxed">{shgConsequenceShort}</p>
            </div>
            <AxisOrientationInfo crystalSystem={group.crystalSystem} convention={convention} setting={setting} onNavigate={onNavigate} />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            {parent && (
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-xs text-ink/70">
                <span>Parent group: <span className="font-serif italic"><FormatPointGroup name={parent} /></span></span>
                {halvingOps && (
                  <span className="inline-flex items-baseline flex-wrap gap-1">
                    H = {'{'}
                    {halvingOps.map((op, idx) => (
                      <span key={op} className="inline-flex items-baseline">
                        <SymmetryOperation symbol={op} />
                        {idx < halvingOps.length - 1 && ','}
                      </span>
                    ))}
                    {'}'}
                  </span>
                )}
              </div>
            )}
            <CrystalSettingControl
              groupName={group.name}
              value={setting}
              onChange={onSettingChange}
              convention={convention}
              onNavigate={onNavigate}
              className="lg:ml-auto"
            />
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('explorer')}
              className="flex items-center gap-1 text-xs text-ink/70 hover:text-ink transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open in Explorer
            </button>
          )}
        </section>
      )}
    </div>
  );
}
