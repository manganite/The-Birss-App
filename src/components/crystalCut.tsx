import { useState } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Compass, Info } from 'lucide-react';
import { hklToPresetAngles } from '../services/orientation';
import type { Orientation } from '../services/orientation';
import { SectionHeader } from './notation';
import { TermInfo } from './TermInfo';

export interface KPreset {
  label: string;
  math: string;
  tx: number;
  ty: number;
  psi0: number;
}

function preset(label: string, math: string, o: Orientation): KPreset {
  return { label, math, tx: o.tx, ty: o.ty, psi0: o.psi0 };
}

// Shared direction angles (Cartesian, per orientation.ts convention) -- every preset below reuses
// one of these five so tx/ty/psi0 stay tied to the direction, independent of its label(s).
const ANGLES_X = hklToPresetAngles(1, 0, 0)!;
const ANGLES_Y = hklToPresetAngles(0, 1, 0)!;
const ANGLES_Z = hklToPresetAngles(0, 0, 1)!;
const ANGLES_110 = hklToPresetAngles(1, 1, 0)!;
const ANGLES_111 = hklToPresetAngles(1, 1, 1)!;

const ORTHO_PRESETS: KPreset[] = [
  preset('[100]', 'k \\parallel [100] \\parallel x \\parallel a', ANGLES_X),
  preset('[010]', 'k \\parallel [010] \\parallel y \\parallel b', ANGLES_Y),
  preset('[001]', 'k \\parallel [001] \\parallel z \\parallel c', ANGLES_Z),
];

const TETRA_PRESETS: KPreset[] = [
  preset('[001]', 'k \\parallel [001] \\parallel z \\parallel c', ANGLES_Z),
  preset('[100]', 'k \\parallel [100] \\parallel x \\parallel a', ANGLES_X),
  preset('[110]', 'k \\parallel [110]', ANGLES_110),
];

const CUBIC_PRESETS: KPreset[] = [
  preset('[100]', 'k \\parallel [100] \\parallel x \\parallel a', ANGLES_X),
  preset('[111]', 'k \\parallel [111]', ANGLES_111),
  preset('[110]', 'k \\parallel [110]', ANGLES_110),
];

const HEX_TRIG_PRESETS: KPreset[] = [
  preset('[001]', 'k \\parallel [001] \\parallel z \\parallel c', ANGLES_Z),
  preset('[100]', 'k \\parallel [100] \\parallel x \\parallel a', ANGLES_X),
  preset('[120]', 'k \\parallel [120] \\parallel y', ANGLES_Y),
];

const TRICLINIC_PRESETS: KPreset[] = [
  preset('[001]', 'k \\parallel [001] \\parallel z \\parallel c', ANGLES_Z),
  preset('x', 'k \\parallel x \\parallel y \\times z', ANGLES_X),
  preset('y', 'k \\parallel y \\parallel b^* \\parallel (c \\times a)', ANGLES_Y),
];

// Setting 1 (c-unique): the standard Birss frame.
const MONO_C_PRESETS: KPreset[] = [
  preset('[001]', 'k \\parallel [001] \\parallel z \\parallel c', ANGLES_Z),
  preset('[100]', 'k \\parallel [100] \\parallel x \\parallel a', ANGLES_X),
  preset('y', 'k \\parallel y \\parallel b^* \\parallel (c \\times a)', ANGLES_Y),
];

// Setting 2 (b-unique): the ITC frame -- here y IS the real crystallographic [010]/b axis.
const MONO_B_PRESETS: KPreset[] = [
  preset('[001]', 'k \\parallel [001] \\parallel z \\parallel c', ANGLES_Z),
  preset('x', 'k \\parallel x \\parallel a^* \\parallel (b \\times c)', ANGLES_X),
  preset('[010]', 'k \\parallel [010] \\parallel y \\parallel b', ANGLES_Y),
];

const PRESETS_BY_SYSTEM: Record<string, KPreset[]> = {
  Cubic: CUBIC_PRESETS,
  Tetragonal: TETRA_PRESETS,
  Orthorhombic: ORTHO_PRESETS,
  Hexagonal: HEX_TRIG_PRESETS,
  Trigonal: HEX_TRIG_PRESETS,
  Triclinic: TRICLINIC_PRESETS,
};

export function getPresetsForSystem(crystalSystem: string, setting: number = 1): KPreset[] {
  if (crystalSystem === 'Monoclinic') return setting === 2 ? MONO_B_PRESETS : MONO_C_PRESETS;
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
          <p><strong>x, y, z</strong> (crys) — the crystal Cartesian axes; their orientation relative to the crystallographic axes is defined per crystal system (and setting) in the AXIS ORIENTATION box above.</p>
          <p><strong>X, Y, Z</strong> (LAB) — lab axes: Z = beam direction (k), X/Y = polarization plane (0°/90°)</p>
          <p>At zero tilt, the selected crystal cut normal is aligned with Z (the beam).</p>
        </div>
      )}
    </div>
  );
}

interface KDirectionSelectorProps {
  crystalSystem: string;
  setting?: number;
  thetaX: number; thetaY: number; psi0: number;
  setThetaX: (v: number) => void;
  setThetaY: (v: number) => void;
  setPsi0: (v: number) => void;
  labFrame: { X: string; Y: string; Z: string; inverse: { X: string; Y: string; Z: string } };
  compact?: boolean;
  onNavigate?: (view: string, tab?: string) => void;
}

export function KDirectionSelector({ crystalSystem, setting, thetaX, thetaY, psi0, setThetaX, setThetaY, setPsi0, labFrame, compact, onNavigate }: KDirectionSelectorProps) {
  const presets = getPresetsForSystem(crystalSystem, setting);
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
