import { ALTERNATE_SETTINGS, EPSILON } from './symmetryGroups';

/**
 * Birss/ITC symbol-convention mapping. Pure labelling/mapping layer -- see
 * docs/references/BIRSS-ITC-CONVENTION-DIVERGENCES.md for the underlying physics. This module
 * NEVER touches generators, frames, or tensor computation; `convention` must not be passed into
 * tensorProjection.ts or any tensor service.
 *
 * Classification is computed once here from `ALTERNATE_SETTINGS` (the rotation angle already
 * encodes which mechanism applies) rather than hand-maintained per group; the derivation-guard
 * test re-derives every set from the app's own operator algebra and asserts no drift.
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
 * badge placement, not the name logic). Mechanically: every `ALTERNATE_SETTINGS` entry using a
 * 30 deg-about-z rotation (the trigonal/hexagonal secondary-family rotation) -- all 20 such
 * groups have a trigonal-only (no proper unprimed 6-fold) unitary part, so there is no
 * group-specific exception here.
 */
export const NAME_SWAP_GROUPS = new Set<string>(
  Object.keys(ALTERNATE_SETTINGS).filter(isRotZ30),
);

/** The sole Sec.-7A exception: the name swaps like any other NAME_SWAP_GROUPS member, but both
 * conventions' tabulated standard is the same physical frame (setting 1), so the badge does not
 * move in ITC mode. */
const BADGE_FIXED_AT_SETTING_1 = "6'/mm'm";

/** Monoclinic groups (Sec. 7B): short symbol identical in both conventions; only the
 * "standard" badge moves, to the b-unique setting (setting 2), in ITC mode. */
export const MONOCLINIC_GROUPS = new Set<string>([
  '2', 'm', '2/m', "2'", "m'", "2'/m", "2'/m'", "2/m'", "21'", "m1'", "2/m1'",
]);

/** `m'm'm` (Sec. 7A): string identical in both conventions; badge moves to the a-unique
 * setting (setting 2), which carries ITC's `mm'm'` orientation (unprimed 2-fold on x). */
const ORTHO_BADGE_GROUP = "m'm'm";

/** Groups that show any convention-related badge at all, in either mode. Everything else
 * ("groups outside the affected classes") renders exactly as today -- no badge. */
const CONVENTION_AFFECTED = new Set<string>([
  ...NAME_SWAP_GROUPS,
  ...MONOCLINIC_GROUPS,
  ORTHO_BADGE_GROUP,
]);

export type Badge = 'birss-standard' | 'itc-standard';

/** Which setting number carries the "standard" badge for this group, under this convention.
 * Returns null for groups with no convention-related badge at all. */
function getStandardSetting(group: string, convention: Convention): number | null {
  if (!CONVENTION_AFFECTED.has(group)) return null;
  if (convention === 'birss') return 1;
  if (group === BADGE_FIXED_AT_SETTING_1) return 1;
  return 2;
}

/** The setting a newly-opened group should default to under the active convention: the
 * convention's standard setting if this group has one, otherwise setting 1. */
export function getDefaultSetting(group: string, convention: Convention): number {
  return getStandardSetting(group, convention) ?? 1;
}

export interface FrameName {
  primary: string;
  synonym?: string;
}

/**
 * The HM name of the currently selected physical frame under the active convention.
 * For NAME_SWAP_GROUPS, the Birss/ITC names swap between setting 1 and setting 2: setting 1's
 * ITC name is exactly setting 2's Birss name (`ALTERNATE_SETTINGS[group][0].name`), and vice
 * versa -- the mechanical swap already present in the settings data, no group-specific text.
 * For every other group, both conventions show the group key (no synonym).
 */
export function getFrameDisplayName(group: string, setting: number, convention: Convention): FrameName {
  if (!NAME_SWAP_GROUPS.has(group)) {
    return { primary: group };
  }
  const altSettings = ALTERNATE_SETTINGS[group];
  const birssName1 = group;
  const birssName2 = altSettings[0].name;
  const birssName = setting === 1 ? birssName1 : birssName2;
  const itcName = setting === 1 ? birssName2 : birssName1;
  const primary = convention === 'birss' ? birssName : itcName;
  const synonym = convention === 'birss' ? itcName : birssName;
  return primary === synonym ? { primary } : { primary, synonym };
}

export interface SettingLabel {
  setting: number;
  label: string;
  badge?: Badge;
}

/**
 * Setting-selector button labels and badge placement for the given group/convention, built on
 * top of `ALTERNATE_SETTINGS`. Returns [] for groups with no alternate settings (nothing to
 * label). Label text: NAME_SWAP_GROUPS get the convention-correct HM name at every setting;
 * monoclinic/other groups keep their existing descriptive labels ("First (c-unique, Birss)" /
 * "Default", or the `ALTERNATE_SETTINGS` entry's own `name`) unchanged by convention.
 */
export function getSettingLabels(group: string, convention: Convention): SettingLabel[] {
  const altSettings = ALTERNATE_SETTINGS[group];
  if (!altSettings) return [];

  const standardSetting = getStandardSetting(group, convention);
  const badgeKind: Badge = convention === 'birss' ? 'birss-standard' : 'itc-standard';
  const totalSettings = altSettings.length + 1;

  const labels: SettingLabel[] = [];
  for (let setting = 1; setting <= totalSettings; setting++) {
    let label: string;
    if (NAME_SWAP_GROUPS.has(group)) {
      label = getFrameDisplayName(group, setting, convention).primary;
    } else if (setting === 1) {
      label = MONOCLINIC_GROUPS.has(group) ? 'First (c-unique, Birss)' : 'Default';
    } else {
      label = altSettings[setting - 2].name;
    }
    labels.push({
      setting,
      label,
      badge: setting === standardSetting ? badgeKind : undefined,
    });
  }
  return labels;
}

export type NoteKey = 'naming-conflict' | 'same-frame-different-string' | 'orthorhombic-badge' | 'monoclinic';

/** Groups with a documented Birss Table-7 printing error (app is correct; see the session
 * findings doc Finding D) -- get an extra warning line appended to their convention note. */
const BOOK_ERROR_GROUPS = new Set<string>(["-6'2m'", "-6m'2'"]);

export const CONVENTION_NOTES: Record<NoteKey, string> = {
  'naming-conflict':
    "Birss and ITC assign this symbol to frames 30° apart. Current display uses the active convention's reading; toggle to compare.",
  'same-frame-different-string':
    "Birss `6'/mm'm` = ITC `6'/mmm'` -- same frame, different string.",
  'orthorhombic-badge':
    "Birss and ITC use the same string for this group's default frame, but disagree on which axis carries the unprimed 2-fold; the ITC-standard badge marks ITC's `mm'm'` orientation (a-unique).",
  monoclinic:
    "Birss (c-unique) and ITC (b-unique) name this group identically; the ITC-standard badge marks the b-unique setting.",
};

export const BOOK_ERROR_WARNING =
  "Birss's own Table 7 omits this row's bracket in print (a documented book error, not an app bug) -- the app's value is correct; see BIRSS-ITC-CONVENTION-DIVERGENCES.md.";

/** Which explanation note applies to this group, if any. */
export function getConventionNote(group: string): NoteKey | null {
  if (group === BADGE_FIXED_AT_SETTING_1) return 'same-frame-different-string';
  if (NAME_SWAP_GROUPS.has(group)) return 'naming-conflict';
  if (group === ORTHO_BADGE_GROUP) return 'orthorhombic-badge';
  if (MONOCLINIC_GROUPS.has(group)) return 'monoclinic';
  return null;
}

/** The additional Table-7 book-error warning for this group, if any (appended after the
 * regular convention note). */
export function getBookErrorWarning(group: string): string | null {
  return BOOK_ERROR_GROUPS.has(group) ? BOOK_ERROR_WARNING : null;
}
