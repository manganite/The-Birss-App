import type { ReactNode } from 'react';
import { InlineMath } from 'react-katex';
import { CRYSTAL_SYSTEM_INFO } from '../data/crystalSystemInfo';
import { FormatPointGroup } from './notation';
import { AxisOrientationInfo } from './axisConventions';
import type { Convention } from '../services/conventionMapping';

function InfoBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="p-4 border border-ink border-opacity-10 space-y-2">
      <h4 className="text-xs uppercase tracking-widest text-ink/70">{title}</h4>
      <p className="text-xs leading-relaxed opacity-70">{children}</p>
    </div>
  );
}

interface CrystalSystemInfoPanelProps {
  crystalSystem: string;
  convention: Convention;
  onNavigate?: (view: string, tab?: string) => void;
}

export function CrystalSystemInfoPanel({ crystalSystem, convention, onNavigate }: CrystalSystemInfoPanelProps) {
  const info = CRYSTAL_SYSTEM_INFO[crystalSystem];
  if (!info) return null;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      <InfoBox title="Lattice">
        <InlineMath math={info.lattice} />
      </InfoBox>
      <InfoBox title="Defining Symmetry">{info.definingSymmetry}</InfoBox>
      <InfoBox title="HM Positions">{info.hmPositions}</InfoBox>
      {info.settings && <InfoBox title="Settings">{info.settings}</InfoBox>}
      <InfoBox title="Birss vs ITC">{info.birssVsItc}</InfoBox>
      <AxisOrientationInfo crystalSystem={crystalSystem} convention={convention} onNavigate={onNavigate} />
      <InfoBox title="Reference">
        <>
          Holohedry: <FormatPointGroup name={info.holohedry} />
          <br />
          Example: {info.example}
        </>
      </InfoBox>
    </div>
  );
}
