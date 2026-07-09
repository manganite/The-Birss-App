import { useState } from 'react';
import { ChevronDown, ChevronUp, FlipHorizontal2 } from 'lucide-react';
import { isCentrosymmetric, getParentGroup, getHalvingSubgroup, getSHGConsequenceShort, getAlternateSettings, getFutureSettingCount } from '../services/tensorCalculator';
import { getGroupDisplayName, getSettingLabels } from '../services/conventionMapping';
import type { Convention } from '../services/conventionMapping';
import { PointGroupData } from '../data/pointGroups';
import { TermInfo } from './TermInfo';
import { SectionHeader, getCrystalIcon, FormatPointGroup, FormatSchoenflies, SymmetryOperation } from './notation';
import { AxisOrientationInfo, ConventionNote } from './axisConventions';

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
        </section>
      )}
    </div>
  );
}
