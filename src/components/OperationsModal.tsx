import { useRef } from 'react';
import { motion } from 'motion/react';
import { InlineMath } from 'react-katex';
import { X, Calculator, Activity, Table2, Check, Minus, BookOpen } from 'lucide-react';
import {
  getSymmetryOperations,
  getGeneratorSymbols,
  getAlternateSettings,
  getFutureSettingCount,
  getParentGroup,
  getHalvingSubgroup,
  isCentrosymmetric,
  isPolar,
  isPiezoelectric,
  isFerromagnetic,
  isPiezomagnetic,
  isMagnetoelectric,
  isChiral,
  getLaueClass,
} from '../services/tensorCalculator';
import {
  getGroupDisplayName,
  getSettingLabels,
  getStandardSetting,
  getConventionNote,
} from '../services/conventionMapping';
import type { Convention } from '../services/conventionMapping';
import { FormatPointGroup, FormatSchoenflies, SymmetryOperation } from './notation';
import { ConventionNote } from './axisConventions';
import { TermInfo } from './TermInfo';
import { PointGroupData } from '../data/pointGroups';
import { SHUBNIKOV, FULL_HM, REFERENCE_AXES, getFamilyClass } from '../data/groupNotation';
import { CHIP_TO_EFFECT } from '../data/tensorEffects';
import { POLAR_DIRECTIONS, type SymDirClass } from '../data/polarDirections';
import { CRYSTAL_SYSTEMS } from '../data/crystalSystems';
import { useDialogA11y } from '../hooks/useDialogA11y';

/** Render a Birss reference-axis orientation string ("3//z, -2//y", or the word "any"): `//`
 * becomes a parallel sign and `-n` an overbar, matching the rest of the app's HM rendering. */
function ReferenceAxes({ value }: { value: string }) {
  if (value === 'any') return <span className="italic">any</span>;
  const latex = value.replace(/\/\//g, ' \\parallel ').replace(/-([1-6])/g, '\\bar{$1}');
  return <InlineMath math={latex} />;
}

const SYM_DIR_LABEL: Record<SymDirClass, string> = {
  primary: '⊥ primary axis',
  secondary: '⊥ secondary axes',
  tertiary: '⊥ tertiary axes',
};
/** Crystallographic direction string -> overbar rendering (`[1-10]` -> `[11̄0]`, `[-u0w]` -> `[ū0w]`). */
const fmtDir = (s: string) => s.replace(/-(.)/g, '$1̅');
/** Systems whose direction indices are hexagonal (a note is shown for them). */
const HEX_INDEX_SYSTEMS = new Set(['Trigonal', 'Hexagonal']);

/**
 * Polar (symmetry) axes and nonpolar directions for the group. A direction's polarity depends only
 * on the spatial action, and a primed operation R' acts on directions exactly as its unprimed R --
 * so every magnetic group's polar/nonpolar directions equal those of its unprimed classical skeleton
 * (`getFamilyClass`). Centrosymmetric skeletons have no polar directions.
 */
function PolarDirections({ group }: { group: PointGroupData }) {
  const skeleton = getFamilyClass(group.name);
  const row = POLAR_DIRECTIONS[skeleton];
  const isMagnetic = group.name.includes("'");
  const hexNote = HEX_INDEX_SYSTEMS.has(group.crystalSystem) || group.crystalSystem === 'Cubic';

  return (
    <div className="mt-5 pt-4 border-t border-ink/10 space-y-2">
      <h4 className="text-xs uppercase tracking-widest text-ink/70 flex items-center gap-1.5">
        Polar directions <TermInfo id="polar-directions" />
      </h4>

      {!row ? (
        <p className="text-sm text-ink/70">No polar directions (centrosymmetric).</p>
      ) : (
        <dl className="text-sm space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-xs uppercase tracking-widest text-ink/50">Polar axes</dt>
            <dd className="font-mono text-ink/80">
              {row.polarAxes.length === 0 ? (
                <span className="font-sans italic text-ink/60">
                  {row.allDirectionsNote ? 'None (every direction is polar)' : 'None'}
                </span>
              ) : (
                row.polarAxes.map((d, i) => (
                  <span key={d}>
                    {i > 0 ? ', ' : ''}
                    {d.startsWith('[') ? fmtDir(d) : <span className="font-sans italic">{d}</span>}
                  </span>
                ))
              )}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-xs uppercase tracking-widest text-ink/50">Nonpolar</dt>
            <dd className="flex flex-col gap-0.5">
              {row.nonpolar.length === 0 ? (
                <span className="font-sans italic text-ink/60">None</span>
              ) : (
                row.nonpolar.map((set, i) => (
                  <span key={i}>
                    <span className="font-mono text-ink/80">{set.directions.map(fmtDir).join(' ')}</span>
                    <span className="text-xs text-ink/45 ml-2">{SYM_DIR_LABEL[set.cls]}</span>
                  </span>
                ))
              )}
            </dd>
          </div>
        </dl>
      )}

      {row && hexNote && <p className="text-[11px] text-ink/45">Crystallographic (hexagonal/cubic) indices.</p>}

      {isMagnetic && (
        <p className="text-[11px] text-ink/50 leading-relaxed">
          Spatial directions: primes act spatially like their unprimed operations, so the polar/nonpolar directions
          equal those of{' '}
          <span className="font-serif italic">
            <FormatPointGroup name={skeleton} />
          </span>
          .
        </p>
      )}

      {row?.frameDivergent && (
        <p className="text-[11px] text-ink/50 italic leading-relaxed flex items-start gap-1.5">
          <BookOpen className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
          <span>
            Directions given in the app's Birss frame; ITC's positional reading of this symbol is rotated 30°
            (documented trigonal orientation divergence).
          </span>
        </p>
      )}

      {row?.printOmission && (
        <p className="text-[11px] text-ink/50 italic leading-relaxed flex items-start gap-1.5">
          <BookOpen className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
          <span>{row.printOmission}</span>
        </p>
      )}
    </div>
  );
}

interface OperationsModalProps {
  group: PointGroupData;
  convention: Convention;
  onClose: () => void;
  onOpenInCalculator?: () => void;
  onOpenInSimulator?: () => void;
  onOpenInTables?: (effectId?: string) => void;
}

export const OperationsModal = ({
  group,
  convention,
  onClose,
  onOpenInCalculator,
  onOpenInSimulator,
  onOpenInTables,
}: OperationsModalProps) => {
  const operations = getSymmetryOperations(group.name);
  const generators = getGeneratorSymbols(group.name);
  const altSettings = getAlternateSettings(group.name);
  const futureSettingCount = getFutureSettingCount(group.name);
  const groupTitle = getGroupDisplayName(group.name, convention);

  const shubnikov = SHUBNIKOV[group.name];
  const fullHM = FULL_HM[group.name];
  const showFullHM = fullHM !== undefined;
  const parent = getParentGroup(group.name);
  const halvingOps = getHalvingSubgroup(group.name);
  const referenceAxes = REFERENCE_AXES[getFamilyClass(group.name)];
  const systemInfo = CRYSTAL_SYSTEMS[group.crystalSystem];
  const settingLabels = altSettings ? getSettingLabels(group.name, convention) : [];
  const birssStandard = getStandardSetting(group.name, 'birss');
  const itcStandard = getStandardSetting(group.name, 'itc');
  const conventionAffected = getConventionNote(group.name) !== null;
  // List the active convention's standard frame first, so the first setting always matches the
  // popup title. Non-affected groups have no standard setting -> activeStandard = 1 -> order 1..N.
  const activeStandard = getStandardSetting(group.name, convention) ?? 1;
  const orderedSettingLabels = [...settingLabels].sort((a, b) =>
    a.setting === activeStandard ? -1 : b.setting === activeStandard ? 1 : a.setting - b.setting,
  );

  const laueClass = getLaueClass(group.name);
  const properties = [
    { id: 'polar-property', label: 'Polar', allowed: isPolar(group.name) },
    { id: 'piezoelectric', label: 'Piezoelectric', allowed: isPiezoelectric(group.name) },
    { id: 'ferromagnetic-property', label: 'Ferromagnetic', allowed: isFerromagnetic(group.name) },
    { id: 'piezomagnetic', label: 'Piezomagnetic', allowed: isPiezomagnetic(group.name) },
    { id: 'magnetoelectric', label: 'Magnetoelectric', allowed: isMagnetoelectric(group.name) },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  useDialogA11y({ onClose, containerRef });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="operations-modal-title"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-paper w-full max-w-3xl border border-ink shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
                  <span className="normal-case">
                    <FormatSchoenflies symbol={group.schoenflies} />
                  </span>
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
          <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-ink/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {showFullHM && (
              <div>
                <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1">Full HM</dt>
                <dd className="font-serif italic">
                  {fullHM.split(' ').map((position, idx) => (
                    <span key={idx}>
                      {idx > 0 ? ' ' : ''}
                      <FormatPointGroup name={position} />
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {shubnikov && (
              <div>
                <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1">Shubnikov</dt>
                <dd className="font-serif italic">
                  <FormatPointGroup name={shubnikov} />
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1">Order</dt>
              <dd>{operations.length}</dd>
            </div>
            {referenceAxes && (
              <div>
                <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1">Reference axes</dt>
                <dd>
                  <ReferenceAxes value={referenceAxes} />
                </dd>
              </div>
            )}
            {systemInfo && (
              <>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1">Cell restrictions</dt>
                  <dd>{systemInfo.restrictions}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1">Free parameters</dt>
                  <dd>
                    {systemInfo.freeParams.join(', ')}{' '}
                    <span className="text-ink/50">({systemInfo.freeParams.length})</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1">Bravais lattices</dt>
                  <dd className="font-mono">{systemInfo.bravais.join(', ')}</dd>
                </div>
                {systemInfo.note && (
                  <div className="sm:col-span-2">
                    <dt className="sr-only">Crystal-system note</dt>
                    <dd className="text-xs text-ink/60 leading-relaxed">{systemInfo.note}</dd>
                  </div>
                )}
              </>
            )}
            {group.type === 'III' && parent && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1">Parent group</dt>
                <dd className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <span className="font-serif italic">
                    <FormatPointGroup name={parent} />
                  </span>
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
              </div>
            )}
            {altSettings && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1">Settings</dt>
                <dd className="flex flex-wrap items-baseline gap-y-1">
                  {orderedSettingLabels.map(({ setting, axisWord, hm }, idx) => (
                    <span key={setting} className="inline-flex items-baseline gap-1.5">
                      {idx > 0 && <span className="text-ink/30 mx-2">·</span>}
                      {axisWord && <span className="normal-case text-xs text-ink/60">{axisWord}</span>}
                      <FormatPointGroup name={hm} />
                      {conventionAffected &&
                        (birssStandard === itcStandard && setting === birssStandard ? (
                          <span className="text-xs text-ink/50">(standard frame in Birss and ITC)</span>
                        ) : (
                          <>
                            {setting === birssStandard && (
                              <span className="text-xs text-ink/50">(standard frame in Birss)</span>
                            )}
                            {setting === itcStandard && (
                              <span className="text-xs text-ink/50">(standard frame in ITC)</span>
                            )}
                          </>
                        ))}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {conventionAffected && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1">Convention</dt>
                <dd>
                  <ConventionNote groupName={group.name} />
                </dd>
              </div>
            )}
          </dl>

          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-ink/70 mb-4">Properties</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm mb-4">
              <div>
                <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1 flex items-center gap-1.5">
                  Laue class <TermInfo id="laue-class" />
                </dt>
                <dd className="font-serif italic">
                  <FormatPointGroup name={laueClass} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-ink/70 mb-1 flex items-center gap-1.5">
                  Chiral <TermInfo id="chiral" />
                </dt>
                <dd>{isChiral(group.name) ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-1.5">
              {properties.map((p) => {
                const effectId = CHIP_TO_EFFECT[p.id];
                const linkable = p.allowed && effectId && onOpenInTables;
                return (
                  <span
                    key={p.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs border ${p.allowed ? 'bg-ink text-paper border-ink' : 'border-ink/20 text-ink/40'}`}
                  >
                    {linkable ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenInTables!(effectId);
                          onClose();
                        }}
                        title="Open in Tables"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <Check className="w-3 h-3" />
                        {p.label}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        {p.allowed ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {p.label}
                      </span>
                    )}
                    <TermInfo id={p.id} />
                  </span>
                );
              })}
            </div>
            <PolarDirections group={group} />
          </div>

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
            <h3 className="text-xs uppercase tracking-[0.2em] text-ink/70 mb-4">
              Symmetry Operations ({operations.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {operations.map((op, idx) => (
                <SymmetryOperation key={idx} symbol={op} />
              ))}
            </div>
          </div>
        </div>

        {(onOpenInCalculator || onOpenInSimulator || onOpenInTables) && (
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
            {onOpenInTables && (
              <button
                onClick={() => {
                  onOpenInTables();
                  onClose();
                }}
                className="px-4 py-2 bg-ink text-paper text-sm uppercase tracking-widest hover:bg-transparent hover:text-ink border border-ink transition-colors flex items-center gap-2"
              >
                <Table2 className="w-4 h-4" />
                Open in Tables
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
