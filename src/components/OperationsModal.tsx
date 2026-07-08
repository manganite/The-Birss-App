import { useRef } from 'react';
import { motion } from 'motion/react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { X, Calculator, Activity } from 'lucide-react';
import { getSymmetryOperations, getGeneratorSymbols, getAlternateSettings, getFutureSettingCount, getParentGroup, getHalvingSubgroup, isCentrosymmetric } from '../services/tensorCalculator';
import { getGroupDisplayName, getSettingLabels, getStandardSetting, getConventionNote } from '../services/conventionMapping';
import type { Convention } from '../services/conventionMapping';
import { FormatPointGroup, FormatSchoenflies, SymmetryOperation, ConventionNote } from './MathComponents';
import { PointGroupData } from '../data/pointGroups';
import { SHUBNIKOV, REFERENCE_AXES, getFamilyClass } from '../data/groupNotation';
import { useDialogA11y } from '../hooks/useDialogA11y';

/** Render a Birss reference-axis orientation string ("3//z, -2//y", or the word "any"): `//`
 * becomes a parallel sign and `-n` an overbar, matching the rest of the app's HM rendering. */
function ReferenceAxes({ value }: { value: string }) {
  if (value === 'any') return <span className="italic">any</span>;
  const latex = value.replace(/\/\//g, ' \\parallel ').replace(/-([1-6])/g, '\\bar{$1}');
  return <InlineMath math={latex} />;
}

interface OperationsModalProps {
  group: PointGroupData;
  convention: Convention;
  onClose: () => void;
  onOpenInCalculator?: () => void;
  onOpenInSimulator?: () => void;
}

export const OperationsModal = ({ group, convention, onClose, onOpenInCalculator, onOpenInSimulator }: OperationsModalProps) => {
  const operations = getSymmetryOperations(group.name);
  const generators = getGeneratorSymbols(group.name);
  const altSettings = getAlternateSettings(group.name);
  const futureSettingCount = getFutureSettingCount(group.name);
  const groupTitle = getGroupDisplayName(group.name, convention);

  const shubnikov = SHUBNIKOV[group.name];
  const parent = getParentGroup(group.name);
  const halvingOps = getHalvingSubgroup(group.name);
  const referenceAxes = REFERENCE_AXES[getFamilyClass(group.name)];
  const settingLabels = altSettings ? getSettingLabels(group.name, convention) : [];
  const birssStandard = getStandardSetting(group.name, 'birss');
  const itcStandard = getStandardSetting(group.name, 'itc');
  const conventionAffected = getConventionNote(group.name) !== null;

  const containerRef = useRef<HTMLDivElement>(null);
  useDialogA11y({ onClose, containerRef });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="operations-modal-title"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-paper w-full max-w-2xl border border-ink shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-ink shrink-0">
          <div className="flex items-center gap-4">
            <h2 id="operations-modal-title" className="text-xl font-medium tracking-tight">
              <FormatPointGroup name={groupTitle} />
            </h2>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink/70 hidden sm:flex">
              {group.schoenflies && (
                <>
                  <span className="normal-case"><FormatSchoenflies symbol={group.schoenflies} /></span>
                  <span>•</span>
                </>
              )}
              <span>{group.crystalSystem}</span>
              <span>•</span>
              <span>Type {group.type}</span>
              <span>•</span>
              <span>{isCentrosymmetric(group.name) ? 'Centrosymmetric' : 'Non-Centrosymmetric'}</span>
              {!altSettings && futureSettingCount && (
                <>
                  <span>•</span>
                  <span className="normal-case">{futureSettingCount} settings — selection coming</span>
                </>
              )}
              <span>•</span>
              <span>{convention === 'birss' ? 'Birss' : 'ITC'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-ink/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 items-baseline text-sm">
            {shubnikov && (
              <>
                <dt className="text-xs uppercase tracking-widest text-ink/70">Shubnikov</dt>
                <dd className="font-serif italic"><FormatPointGroup name={shubnikov} /></dd>
              </>
            )}
            <dt className="text-xs uppercase tracking-widest text-ink/70">Order</dt>
            <dd>{operations.length}</dd>
            {group.type === 'III' && parent && (
              <>
                <dt className="text-xs uppercase tracking-widest text-ink/70">Parent group</dt>
                <dd className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <span className="font-serif italic"><FormatPointGroup name={parent} /></span>
                  {halvingOps && (
                    <span className="inline-flex items-baseline flex-wrap gap-1 text-ink/70">
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
                </dd>
              </>
            )}
            {altSettings && (
              <>
                <dt className="text-xs uppercase tracking-widest text-ink/70">Settings</dt>
                <dd className="flex flex-wrap items-baseline gap-y-1">
                  {settingLabels.map(({ setting, axisWord, hm }, idx) => (
                    <span key={setting} className="inline-flex items-baseline gap-1.5">
                      {idx > 0 && <span className="text-ink/30 mx-2">·</span>}
                      {axisWord && <span className="normal-case text-xs text-ink/60">{axisWord}</span>}
                      <FormatPointGroup name={hm} />
                      {conventionAffected && setting === birssStandard && (
                        <span className="text-xs text-ink/50">(Birss standard)</span>
                      )}
                      {conventionAffected && setting === itcStandard && (
                        <span className="text-xs text-ink/50">(ITC standard)</span>
                      )}
                    </span>
                  ))}
                </dd>
              </>
            )}
            {referenceAxes && (
              <>
                <dt className="text-xs uppercase tracking-widest text-ink/70">Reference axes</dt>
                <dd><ReferenceAxes value={referenceAxes} /></dd>
              </>
            )}
            {conventionAffected && (
              <>
                <dt className="text-xs uppercase tracking-widest text-ink/70">Convention</dt>
                <dd><ConventionNote groupName={group.name} /></dd>
              </>
            )}
          </dl>
          {generators.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-ink/70 mb-4">Generators ({generators.length})</h3>
              <div className="flex flex-wrap gap-2">
                {generators.map((gen, idx) => (
                  <SymmetryOperation key={idx} symbol={gen} />
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-ink/70 mb-4">Symmetry Operations ({operations.length})</h3>
            <div className="flex flex-wrap gap-2">
              {operations.map((op, idx) => (
                <SymmetryOperation key={idx} symbol={op} />
              ))}
            </div>
          </div>
        </div>

        {(onOpenInCalculator || onOpenInSimulator) && (
          <div className="p-4 border-t border-ink bg-ink/5 flex justify-end gap-2 shrink-0">
            {onOpenInCalculator && (
              <button
                onClick={() => {
                  onOpenInCalculator();
                  onClose();
                }}
                className="px-4 py-2 bg-ink text-paper text-sm uppercase tracking-widest hover:bg-transparent hover:text-ink border border-ink transition-colors flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Open in Calculator
              </button>
            )}
            {onOpenInSimulator && (
              <button
                onClick={() => {
                  onOpenInSimulator();
                  onClose();
                }}
                className="px-4 py-2 bg-ink text-paper text-sm uppercase tracking-widest hover:bg-transparent hover:text-ink border border-ink transition-colors flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Open in Simulator
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
