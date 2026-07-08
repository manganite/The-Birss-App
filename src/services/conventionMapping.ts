import { ALTERNATE_SETTINGS, EPSILON } from './symmetryGroups';

/**
 * Birss/ITC symbol-convention mapping. Pure labelling/mapping layer -- see
 * docs/references/BIRSS-ITC-CONVENTION-DIVERGENCES.md for the underlying physics. This module
 * NEVER touches generators, frames, or tensor computation; `convention` must not be passed into
 * tensorProjection.ts or any tensor service.
 *
 * Classification is computed once here from `ALTERNATE_SETTINGS` (the rotation angle and/or the
 * setting-name shape already encode which mechanism applies) rather than hand-maintained per
 * group; the derivation-guard test re-derives every set from the app's own operator algebra (and,
 * for the orthorhombic frame strings, from a token-permutation rule) and asserts no drift.
 */

export type Convention = 'birss' | 'itc';

const ROT_Z_30_COS = Math.cos(Math.PI / 6);

function isRotZ30(group: string): boolean {
  const defs = ALTERNATE_SETTINGS[group];
  if (!defs) return false;
  return Math.abs(defs[0].rotation.m[0][0] - ROT_Z_30_COS) < EPSILON;
}

/**
 * Groups whose displayed HM name swaps between setting 1 and setting 2 under the convention
 * toggle (Sec. 7C naming-conflict class, plus `6'/mm'm` from Sec. 7A -- same swap mechanism,
 * computed 2026-07-04 from the app's operator sets; its only difference from the other 19 is
 * standard-setting placement, not the name logic). Mechanically: every `ALTERNATE_SETTINGS` entry
 * using a 30 deg-about-z rotation (the trigonal/hexagonal secondary-family rotation) -- all 20
 * such groups have a trigonal-only (no proper unprimed 6-fold) unitary part, so there is no
 * group-specific exception here.
 */
export const NAME_SWAP_GROUPS = new Set<string>(
  Object.keys(ALTERNATE_SETTINGS).filter(isRotZ30),
);

/**
 * Orthorhombic axis-setting groups (Sec. 3 "axis-permutation settings"): identified by the
 * `ALTERNATE_SETTINGS` entries' own axis-word names ("a-unique"/"b-unique"), which is how these
 * 7 groups are hand-labelled in `symmetryGroups.ts` -- distinct in shape from both the
 * 30 deg-rotation trig/hex swap groups and the monoclinic "Second (b-unique, ITC)" groups.
 */
export const ORTHO_AXIS_GROUPS = new Set<string>(
  Object.keys(ALTERNATE_SETTINGS).filter(group => {
    const defs = ALTERNATE_SETTINGS[group];
    return defs.length === 2 && defs[0].name === 'a-unique' && defs[1].name === 'b-unique';
  }),
);

/** Monoclinic groups (Sec. 7B): short symbol identical in both conventions; only which setting
 * is standard moves, to the b-unique setting (setting 2), in ITC mode. */
export const MONOCLINIC_GROUPS = new Set<string>([
  '2', 'm', '2/m', "2'", "m'", "2'/m", "2'/m'", "2/m'", "21'", "m1'", "2/m1'",
]);

/**
 * The residual `ALTERNATE_SETTINGS` entries: the tetragonal 45 deg-setting groups (Mechanism A/B).
 * These are NOT Birss<->ITC divergent (Birss's position-2 = y lies inside ITC's secondary
 * direction set for tetragonal, per the session findings), so their setting names are shown
 * as-is, identically in both conventions -- no swap, no axis word, just the setting's own HM name.
 */
const OTHER_SETTING_GROUPS = new Set<string>(
  Object.keys(ALTERNATE_SETTINGS).filter(
    group => !NAME_SWAP_GROUPS.has(group) && !ORTHO_AXIS_GROUPS.has(group) && !MONOCLINIC_GROUPS.has(group),
  ),
);

/** The sole Sec.-7A exception: the name swaps like any other NAME_SWAP_GROUPS member, but both
 * conventions' tabulated standard is the same physical frame (setting 1), so the standard setting
 * does not move in ITC mode. */
const STANDARD_STAYS_AT_SETTING_1 = "6'/mm'm";

/** `m'm'm` (Sec. 7A): string identical in both conventions; the standard setting moves to the
 * a-unique setting (setting 2), which carries ITC's `mm'm'` orientation (unprimed 2-fold on x). */
const ORTHO_STANDARD_DIVERGES = "m'm'm";

/** Groups whose "standard setting" depends on the active convention at all. Everything else
 * (groups outside the affected classes) has the same standard setting (1) in both conventions. */
const CONVENTION_AFFECTED = new Set<string>([
  ...NAME_SWAP_GROUPS,
  ...MONOCLINIC_GROUPS,
  ORTHO_STANDARD_DIVERGES,
]);

/** Which setting number is standard for this group, under this convention. Returns null for
 * groups whose standard setting doesn't depend on convention (always setting 1). */
export function getStandardSetting(group: string, convention: Convention): number | null {
  if (!CONVENTION_AFFECTED.has(group)) return null;
  if (convention === 'birss') return 1;
  if (group === STANDARD_STAYS_AT_SETTING_1) return 1;
  return 2;
}

/** The setting a newly-opened group should default to under the active convention: the
 * convention's standard setting if this group has one, otherwise setting 1. */
export function getDefaultSetting(group: string, convention: Convention): number {
  return getStandardSetting(group, convention) ?? 1;
}

/**
 * Verified orthorhombic frame HM strings (Sec. 2.1 derivation, orthorhombic positions x=a, y=b,
 * z=c agree in both conventions so these are convention-independent). Setting 1 = the group key
 * (c-unique); setting 2 = a-unique; setting 3 = b-unique. Verified 2026-07-04 by key-token
 * permutation, cross-checked against the ITC Table 1.5.7.1 scan (`mm2 [2mm; m2m]`) and against
 * operator projection for the non-centrosymmetric groups; see the derivation-guard test, which
 * re-derives every row from `deriveOrthoFrameHM` and asserts equality so this table cannot drift.
 */
export const ORTHO_FRAME_HM: Record<string, [string, string, string]> = {
  "2'2'2": ["2'2'2", "22'2'", "2'22'"],
  "2'm'm": ["2'm'm", "m2'm'", "m'm2'"],
  "m'm'2": ["m'm'2", "2m'm'", "m'2m'"],
  "m'm'm": ["m'm'm", "mm'm'", "m'mm'"],
  "mmm'": ["mmm'", "m'mm", "mm'm"],
  "mm2": ["mm2", "2mm", "m2m"],
  "mm21'": ["mm21'", "2mm1'", "m2m1'"],
};

/**
 * Mechanically re-derives a group's 3 orthorhombic frame HM strings by permuting its key's
 * position tokens: a-unique = [t_z, t_x, t_y], b-unique = [t_y, t_z, t_x] (the token at position i
 * names the symmetry element parallel/perpendicular to axis i = x,y,z respectively). Exported
 * solely for the derivation-guard test -- `ORTHO_FRAME_HM` above is the source of truth used at
 * runtime.
 */
export function deriveOrthoFrameHM(group: string): [string, string, string] {
  const suffix = group.endsWith("1'") ? "1'" : '';
  const core = suffix ? group.slice(0, -suffix.length) : group;
  const tokens: string[] = [];
  let i = 0;
  while (i < core.length) {
    const base = core[i];
    if (base !== '2' && base !== 'm') {
      throw new Error(`deriveOrthoFrameHM: unexpected token start "${base}" in "${group}"`);
    }
    i++;
    if (core[i] === "'") {
      tokens.push(base + "'");
      i++;
    } else {
      tokens.push(base);
    }
  }
  if (tokens.length !== 3) {
    throw new Error(`deriveOrthoFrameHM: expected 3 position tokens in "${group}", got ${tokens.length}`);
  }
  const [tx, ty, tz] = tokens;
  const setting1 = group;
  const setting2 = `${tz}${tx}${ty}${suffix}`;
  const setting3 = `${ty}${tz}${tx}${suffix}`;
  return [setting1, setting2, setting3];
}

export interface FrameName {
  primary: string;
  synonym?: string;
}

/**
 * The HM name of the currently selected physical frame under the active convention.
 * - NAME_SWAP_GROUPS: the Birss/ITC names swap between setting 1 and setting 2 -- setting 1's ITC
 *   name is exactly setting 2's Birss name (`ALTERNATE_SETTINGS[group][0].name`), and vice versa.
 * - ORTHO_AXIS_GROUPS: the setting's frame HM string from `ORTHO_FRAME_HM`, convention-independent
 *   (no synonym).
 * - OTHER_SETTING_GROUPS (tetragonal 45 deg pairs): the setting's own HM name (setting 1 = group key,
 *   setting 2 = the alternate setting's name), convention-independent (no synonym).
 * - Every other group (monoclinic, and groups with no alternate settings): the group key at every
 *   setting (no synonym) -- monoclinic's short HM is identical at both settings (Sec. 7B).
 */
export function getFrameDisplayName(group: string, setting: number, convention: Convention): FrameName {
  if (NAME_SWAP_GROUPS.has(group)) {
    const altSettings = ALTERNATE_SETTINGS[group];
    const birssName1 = group;
    const birssName2 = altSettings[0].name;
    const birssName = setting === 1 ? birssName1 : birssName2;
    const itcName = setting === 1 ? birssName2 : birssName1;
    const primary = convention === 'birss' ? birssName : itcName;
    const synonym = convention === 'birss' ? itcName : birssName;
    return primary === synonym ? { primary } : { primary, synonym };
  }
  if (ORTHO_AXIS_GROUPS.has(group)) {
    return { primary: ORTHO_FRAME_HM[group][setting - 1] };
  }
  if (OTHER_SETTING_GROUPS.has(group)) {
    const altSettings = ALTERNATE_SETTINGS[group];
    return { primary: setting === 1 ? group : altSettings[setting - 2].name };
  }
  return { primary: group };
}

/**
 * The setting-independent group-standard display name: the standard setting's frame name. No
 * per-group special-casing -- this yields a divergent name for EXACTLY `6'/mm'm` (`6'/mmm'` in
 * ITC) and `m'm'm` (`mm'm'` in ITC); every other group (incl. all Sec. 7C and all monoclinic
 * groups) returns the same string in both conventions.
 */
export function getGroupDisplayName(group: string, convention: Convention): string {
  return getFrameDisplayName(group, getStandardSetting(group, convention) ?? 1, convention).primary;
}

const ORTHO_AXIS_WORDS = ['c-unique', 'a-unique', 'b-unique'];
const MONOCLINIC_AXIS_WORDS = ['c-unique', 'b-unique'];

export interface SettingLabel {
  setting: number;
  /** Plain-text axis qualifier ("c-unique", "a-unique", "b-unique"), or null for groups with no
   * axis-choice concept (trig/hex name-swap and tetragonal groups: HM name alone). */
  axisWord: string | null;
  /** The HM symbol to render (through the LaTeX formatter); always a real HM string. */
  hm: string;
}

/**
 * Setting-selector button labels for the given group/convention, built on top of
 * `ALTERNATE_SETTINGS`. Returns [] for groups with no alternate settings. The selected (highlighted)
 * button IS the standard setting -- no separate badge/text marks it.
 */
export function getSettingLabels(group: string, convention: Convention): SettingLabel[] {
  const altSettings = ALTERNATE_SETTINGS[group];
  if (!altSettings) return [];

  const totalSettings = altSettings.length + 1;
  const axisWords = ORTHO_AXIS_GROUPS.has(group)
    ? ORTHO_AXIS_WORDS
    : MONOCLINIC_GROUPS.has(group)
    ? MONOCLINIC_AXIS_WORDS
    : null;

  const labels: SettingLabel[] = [];
  for (let setting = 1; setting <= totalSettings; setting++) {
    labels.push({
      setting,
      axisWord: axisWords ? axisWords[setting - 1] : null,
      hm: getFrameDisplayName(group, setting, convention).primary,
    });
  }
  return labels;
}

export type NoteKey = 'naming-conflict' | 'same-frame-different-string' | 'orthorhombic-frame' | 'monoclinic';

/** Groups with a documented Birss Table-7 printing error (app is correct; see the session
 * findings doc Finding D) -- get an extra warning line appended to their convention note. */
const BOOK_ERROR_GROUPS = new Set<string>(["-6'2m'", "-6m'2'"]);

export const CONVENTION_NOTES: Record<NoteKey, string> = {
  'naming-conflict':
    "Birss and ITC assign this symbol to frames 30° apart. Current display uses the active convention's reading; toggle to compare.",
  'same-frame-different-string':
    "Birss `6'/mm'm` = ITC `6'/mmm'` -- same frame, different string.",
  'orthorhombic-frame':
    "Birss and ITC use the same string for this group's default frame, but disagree on which axis carries the unprimed 2-fold; ITC's standard is the `mm'm'` orientation (a-unique).",
  monoclinic:
    "Birss (c-unique) and ITC (b-unique) name this group identically; ITC's standard is the b-unique setting.",
};

export const BOOK_ERROR_WARNING =
  "Birss's own Table 7 omits this row's bracket in print (a documented book error, not an app bug) -- the app's value is correct; see BIRSS-ITC-CONVENTION-DIVERGENCES.md.";

/** Which explanation note applies to this group, if any. */
export function getConventionNote(group: string): NoteKey | null {
  if (group === STANDARD_STAYS_AT_SETTING_1) return 'same-frame-different-string';
  if (NAME_SWAP_GROUPS.has(group)) return 'naming-conflict';
  if (group === ORTHO_STANDARD_DIVERGES) return 'orthorhombic-frame';
  if (MONOCLINIC_GROUPS.has(group)) return 'monoclinic';
  return null;
}

/** The additional Table-7 book-error warning for this group, if any (appended after the
 * regular convention note). */
export function getBookErrorWarning(group: string): string | null {
  return BOOK_ERROR_GROUPS.has(group) ? BOOK_ERROR_WARNING : null;
}
