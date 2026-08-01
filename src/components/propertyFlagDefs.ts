import {
  isPolar,
  isChiral,
  isFerromagnetic,
  isMagnetoelectric,
  isPiezoelectric,
  isPiezomagnetic,
} from '../services/propertyFlags';

/**
 * The single definition of what each property flag IS, for every surface that shows one.
 *
 * Two surfaces render these flags: the group identity header (all three of Calculator, Simulator
 * and Tables) and the Explorer's operations modal. Before B27-S each maintained its own idea of
 * which service function backs which label and which glossary entry explains it, which is the
 * shape of divergence the Q0 shared-partition work removed from the tensor displays -- the same
 * lesson, much smaller. The SEMANTICS live here and in the guarded service; only the PRESENTATION
 * is allowed to differ.
 *
 * The two surfaces differ deliberately, and the differences are decisions, not drift
 * (maintainer, 2026-08-01):
 *
 * - **Which flags.** The modal is a lookup view and carries all five chips including the two piezo
 *   flags; the header is present on three pages at all times and carries only the four
 *   material-class flags. Piezo availability is already reachable through the Tables by-effect
 *   view, so repeating it in a persistent header buys nothing.
 * - **Absent flags.** The modal draws them struck through, because in a lookup view the absence of
 *   a property is itself informative. The header omits them: four struck-through chips on every centrosymmetric
 *   crystal, on every page, would be noise.
 *
 * `id` doubles as the glossary term id, so a badge's explanation and its provenance travel with
 * its definition. Provenance is per flag and NOT uniformly ITC: ferromagnetic and magnetoelectric
 * are guarded against ITC Tables 1.5.2.4 and 1.5.8.1, polar against the 10 polar classes (Schmid,
 * Ferroelectrics 162, 317 (1994)) and chiral against the 11 enantiomorphic classes. See
 * `propertyFlags.reference.test.ts` for each anchor.
 */
export interface PropertyFlagDef {
  /** Stable id; also the `GLOSSARY_TERMS` id whose brief explains the flag and cites its anchor. */
  id: string;
  label: string;
  /** The guarded service predicate. Never reimplement a flag at a call site. */
  test: (group: string) => boolean;
}

export const PROPERTY_FLAGS: readonly PropertyFlagDef[] = [
  { id: 'polar-property', label: 'Polar', test: isPolar },
  { id: 'chiral', label: 'Chiral', test: isChiral },
  { id: 'ferromagnetic-property', label: 'Ferromagnetic', test: isFerromagnetic },
  { id: 'magnetoelectric', label: 'Magnetoelectric', test: isMagnetoelectric },
  { id: 'piezoelectric', label: 'Piezoelectric', test: isPiezoelectric },
  { id: 'piezomagnetic', label: 'Piezomagnetic', test: isPiezomagnetic },
];

const byId = new Map(PROPERTY_FLAGS.map((f) => [f.id, f]));

/** Definition for an id; throws rather than rendering a blank badge for a typo'd id. */
export function propertyFlag(id: string): PropertyFlagDef {
  const def = byId.get(id);
  if (!def) throw new Error(`propertyFlag: unknown flag id "${id}"`);
  return def;
}

/** The header's four material-class flags, in display order. */
export const HEADER_FLAG_IDS = ['polar-property', 'chiral', 'ferromagnetic-property', 'magnetoelectric'] as const;

/** The modal's five chips, in the order it has always drawn them. Chiral is not here: the modal
 *  shows it as a Yes/No row in the definition list above the chips, not as a chip. */
export const MODAL_CHIP_IDS = [
  'polar-property',
  'piezoelectric',
  'ferromagnetic-property',
  'piezomagnetic',
  'magnetoelectric',
] as const;

/** The header flags a group actually admits, in display order. Absent flags are omitted. */
export function admittedHeaderFlags(group: string): PropertyFlagDef[] {
  return HEADER_FLAG_IDS.map(propertyFlag).filter((f) => f.test(group));
}
