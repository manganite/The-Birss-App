import { describe, it, expect } from 'vitest';
import { ALTERNATE_SETTINGS, getSymmetryOperations } from './symmetryGroups';
import { POINT_GROUPS } from '../data/pointGroups';
import {
  NAME_SWAP_GROUPS,
  MONOCLINIC_GROUPS,
  ORTHO_AXIS_GROUPS,
  ORTHO_FRAME_HM,
  deriveOrthoFrameHM,
  getFrameDisplayName,
  getSettingLabels,
  getGroupDisplayName,
  getDefaultSetting,
} from './conventionMapping';

/**
 * Re-derives the convention-mapping classification from the app's own operator algebra
 * (independent of conventionMapping.ts's own rotation-angle shortcut) and asserts it matches
 * the static sets, so the map cannot silently drift from the underlying physics.
 */

function crystalSystemOf(group: string): string {
  const entry = POINT_GROUPS.find(pg => pg.name === group);
  if (!entry) throw new Error(`No POINT_GROUPS entry for ${group}`);
  return entry.crystalSystem;
}

/** Sec. 7C rule: naming-conflict iff the group has a trigonal/hexagonal alternate setting
 * (basal lateral elements set by the secondary convention) AND its unitary part contains no
 * proper (non-roto-inversion) unprimed 6-fold -- i.e. is trigonal, not hexagonal. */
function hasUnprimedProperSixFold(group: string): boolean {
  const ops = getSymmetryOperations(group, 1);
  return ops.some(op => /^6_z/.test(op) && !op.endsWith("'"));
}

describe('conventionMapping.derivation — classification re-derived from group algebra', () => {
  it('NAME_SWAP_GROUPS = every Trigonal/Hexagonal group with an alternate setting and no unprimed proper 6-fold', () => {
    const derived = new Set(
      Object.keys(ALTERNATE_SETTINGS).filter(group => {
        const system = crystalSystemOf(group);
        if (system !== 'Trigonal' && system !== 'Hexagonal') return false;
        return !hasUnprimedProperSixFold(group);
      }),
    );
    expect([...derived].sort()).toEqual([...NAME_SWAP_GROUPS].sort());
  });

  it("every Trigonal/Hexagonal alternate-setting group is EITHER a name-swap group OR has an unprimed proper 6-fold (no third case)", () => {
    for (const group of Object.keys(ALTERNATE_SETTINGS)) {
      const system = crystalSystemOf(group);
      if (system !== 'Trigonal' && system !== 'Hexagonal') continue;
      expect(NAME_SWAP_GROUPS.has(group)).toBe(!hasUnprimedProperSixFold(group));
    }
  });

  it('MONOCLINIC_GROUPS = every Monoclinic group with an alternate setting', () => {
    const derived = new Set(
      Object.keys(ALTERNATE_SETTINGS).filter(group => crystalSystemOf(group) === 'Monoclinic'),
    );
    expect([...derived].sort()).toEqual([...MONOCLINIC_GROUPS].sort());
  });

  it('ORTHO_AXIS_GROUPS = every Orthorhombic group with an alternate setting', () => {
    const derived = new Set(
      Object.keys(ALTERNATE_SETTINGS).filter(group => crystalSystemOf(group) === 'Orthorhombic'),
    );
    expect([...derived].sort()).toEqual([...ORTHO_AXIS_GROUPS].sort());
  });

  it("the two Sec.-7A groups (m'm'm, 6'/mm'm) are asserted explicitly", () => {
    expect(NAME_SWAP_GROUPS.has("6'/mm'm")).toBe(true);
    expect(NAME_SWAP_GROUPS.has("m'm'm")).toBe(false);
    expect(MONOCLINIC_GROUPS.has("m'm'm")).toBe(false);
    expect(ORTHO_AXIS_GROUPS.has("m'm'm")).toBe(true);
  });

  it('for every NAME_SWAP_GROUPS member, the ITC label at each setting equals the Birss label of the other setting', () => {
    for (const group of NAME_SWAP_GROUPS) {
      const altSettings = ALTERNATE_SETTINGS[group];
      const birssName1 = group;
      const birssName2 = altSettings[0].name;

      const s1Birss = getFrameDisplayName(group, 1, 'birss');
      const s1Itc = getFrameDisplayName(group, 1, 'itc');
      const s2Birss = getFrameDisplayName(group, 2, 'birss');
      const s2Itc = getFrameDisplayName(group, 2, 'itc');

      expect(s1Birss.primary).toBe(birssName1);
      expect(s1Itc.primary).toBe(birssName2);
      expect(s2Birss.primary).toBe(birssName2);
      expect(s2Itc.primary).toBe(birssName1);
    }
  });

  it('getFrameDisplayName is consistent with getSettingLabels for every ALTERNATE_SETTINGS (group, setting, convention) triple', () => {
    for (const group of Object.keys(ALTERNATE_SETTINGS)) {
      for (const convention of ['birss', 'itc'] as const) {
        const labels = getSettingLabels(group, convention);
        for (const { setting, hm } of labels) {
          expect(hm).toBe(getFrameDisplayName(group, setting, convention).primary);
        }
      }
    }
  });

  it('only ORTHO_AXIS_GROUPS and MONOCLINIC_GROUPS setting labels carry an axis word; every other alternate-setting group has axisWord: null', () => {
    for (const group of Object.keys(ALTERNATE_SETTINGS)) {
      const labels = getSettingLabels(group, 'birss');
      const expectAxisWord = ORTHO_AXIS_GROUPS.has(group) || MONOCLINIC_GROUPS.has(group);
      for (const { axisWord } of labels) {
        expect(axisWord !== null).toBe(expectAxisWord);
      }
    }
  });

  it('the standard (default) setting: Birss is always setting 1; ITC is setting 2 for naming-conflict/monoclinic/m\'m\'m groups and setting 1 for 6\'/mm\'m and all unaffected groups', () => {
    for (const group of Object.keys(ALTERNATE_SETTINGS)) {
      expect(getDefaultSetting(group, 'birss')).toBe(1);

      const isAffected = NAME_SWAP_GROUPS.has(group) || MONOCLINIC_GROUPS.has(group) || group === "m'm'm";
      const expectedItcDefault = !isAffected ? 1 : group === "6'/mm'm" ? 1 : 2;
      expect(getDefaultSetting(group, 'itc')).toBe(expectedItcDefault);
    }
  });

  it('ORTHO_FRAME_HM matches the mechanical token-permutation derivation for every row (anti-drift guard)', () => {
    for (const group of Object.keys(ORTHO_FRAME_HM)) {
      expect(deriveOrthoFrameHM(group)).toEqual(ORTHO_FRAME_HM[group]);
    }
  });

  it('getGroupDisplayName: Birss mode always returns the group key, for every one of the 122 point groups', () => {
    for (const pg of POINT_GROUPS) {
      expect(getGroupDisplayName(pg.name, 'birss')).toBe(pg.name);
    }
  });

  it("getGroupDisplayName: ITC mode returns the group key for every point group EXCEPT the two Sec. 7A divergent groups (m'm'm -> mm'm'; 6'/mm'm -> 6'/mmm')", () => {
    const divergent: Record<string, string> = {
      "m'm'm": "mm'm'",
      "6'/mm'm": "6'/mmm'",
    };
    for (const pg of POINT_GROUPS) {
      const expected = divergent[pg.name] ?? pg.name;
      expect(getGroupDisplayName(pg.name, 'itc')).toBe(expected);
    }
  });
});
