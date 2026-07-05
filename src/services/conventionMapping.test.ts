import { describe, it, expect } from 'vitest';
import { calculateTensorBasisResults } from './tensorProjection';
import { calculateTensorComponents } from './tensorCalculator';
import {
  getFrameDisplayName,
  getSettingLabels,
  getConventionNote,
  getBookErrorWarning,
  getGroupDisplayName,
  getDefaultSetting,
} from './conventionMapping';
import { ALTERNATE_SETTINGS } from './symmetryGroups';

describe('conventionMapping — label behaviour for representative groups', () => {
  it("'32' (naming-conflict, swap): names swap between settings", () => {
    expect(getFrameDisplayName('32', 1, 'birss')).toEqual({ primary: '32', synonym: '312' });
    expect(getFrameDisplayName('32', 1, 'itc')).toEqual({ primary: '312', synonym: '32' });
    expect(getFrameDisplayName('32', 2, 'birss')).toEqual({ primary: '312', synonym: '32' });
    expect(getFrameDisplayName('32', 2, 'itc')).toEqual({ primary: '32', synonym: '312' });
    expect(getConventionNote('32')).toBe('naming-conflict');
  });

  it("6'mm' (naming-conflict, swap): names swap, standard setting moves to setting 2 in ITC mode", () => {
    expect(getFrameDisplayName("6'mm'", 1, 'itc')).toEqual({ primary: "6'm'm", synonym: "6'mm'" });
    expect(getFrameDisplayName("6'mm'", 2, 'itc')).toEqual({ primary: "6'mm'", synonym: "6'm'm" });
    expect(getDefaultSetting("6'mm'", 'birss')).toBe(1);
    expect(getDefaultSetting("6'mm'", 'itc')).toBe(2);
    expect(getGroupDisplayName("6'mm'", 'birss')).toBe("6'mm'");
    expect(getGroupDisplayName("6'mm'", 'itc')).toBe("6'mm'");
  });

  it("-42m (tetragonal 45° pair): setting-dependent HM name, identical in both conventions, no standard-setting divergence", () => {
    expect(getFrameDisplayName('-42m', 1, 'birss')).toEqual({ primary: '-42m' });
    expect(getFrameDisplayName('-42m', 1, 'itc')).toEqual({ primary: '-42m' });
    expect(getFrameDisplayName('-42m', 2, 'birss')).toEqual({ primary: '-4m2' });
    expect(getFrameDisplayName('-42m', 2, 'itc')).toEqual({ primary: '-4m2' });
    expect(getDefaultSetting('-42m', 'birss')).toBe(1);
    expect(getDefaultSetting('-42m', 'itc')).toBe(1);
    const itcLabels = getSettingLabels('-42m', 'itc');
    expect(itcLabels).toEqual([
      { setting: 1, axisWord: null, hm: '-42m' },
      { setting: 2, axisWord: null, hm: '-4m2' },
    ]);
    expect(getConventionNote('-42m')).toBeNull();
  });

  it("'2' (monoclinic): no name change; standard setting moves to setting 2 (b-unique) in ITC mode", () => {
    expect(getFrameDisplayName('2', 1, 'birss')).toEqual({ primary: '2' });
    expect(getFrameDisplayName('2', 2, 'itc')).toEqual({ primary: '2' });
    expect(getDefaultSetting('2', 'birss')).toBe(1);
    expect(getDefaultSetting('2', 'itc')).toBe(2);
    const itcLabels = getSettingLabels('2', 'itc');
    expect(itcLabels).toEqual([
      { setting: 1, axisWord: 'c-unique', hm: '2' },
      { setting: 2, axisWord: 'b-unique', hm: '2' },
    ]);
    expect(getConventionNote('2')).toBe('monoclinic');
  });

  it("m'm'm (Sec. 7A, different default frames): frame name diverges by setting; standard setting moves to a-unique (setting 2) in ITC mode", () => {
    expect(getFrameDisplayName("m'm'm", 1, 'birss')).toEqual({ primary: "m'm'm" });
    expect(getFrameDisplayName("m'm'm", 2, 'itc')).toEqual({ primary: "mm'm'" });
    expect(getFrameDisplayName("m'm'm", 3, 'itc')).toEqual({ primary: "m'mm'" });
    const labels = getSettingLabels("m'm'm", 'itc');
    expect(labels).toEqual([
      { setting: 1, axisWord: 'c-unique', hm: "m'm'm" },
      { setting: 2, axisWord: 'a-unique', hm: "mm'm'" },
      { setting: 3, axisWord: 'b-unique', hm: "m'mm'" },
    ]);
    expect(getDefaultSetting("m'm'm", 'birss')).toBe(1);
    expect(getDefaultSetting("m'm'm", 'itc')).toBe(2);
    expect(getGroupDisplayName("m'm'm", 'birss')).toBe("m'm'm");
    expect(getGroupDisplayName("m'm'm", 'itc')).toBe("mm'm'");
    expect(getConventionNote("m'm'm")).toBe('orthorhombic-frame');
  });

  it("6'/mm'm (Sec. 7A, same frame different string): name swaps like naming-conflict, but standard setting stays on setting 1 in ITC mode", () => {
    expect(getFrameDisplayName("6'/mm'm", 1, 'birss')).toEqual({ primary: "6'/mm'm", synonym: "6'/mmm'" });
    expect(getFrameDisplayName("6'/mm'm", 1, 'itc')).toEqual({ primary: "6'/mmm'", synonym: "6'/mm'm" });
    expect(getFrameDisplayName("6'/mm'm", 2, 'itc')).toEqual({ primary: "6'/mm'm", synonym: "6'/mmm'" });
    expect(getDefaultSetting("6'/mm'm", 'birss')).toBe(1);
    expect(getDefaultSetting("6'/mm'm", 'itc')).toBe(1);
    expect(getGroupDisplayName("6'/mm'm", 'birss')).toBe("6'/mm'm");
    expect(getGroupDisplayName("6'/mm'm", 'itc')).toBe("6'/mmm'");
    expect(getConventionNote("6'/mm'm")).toBe('same-frame-different-string');
  });

  it("book-error groups (-6'2m', -6m'2') get the extra Table-7 warning; others don't", () => {
    expect(getBookErrorWarning("-6'2m'")).not.toBeNull();
    expect(getBookErrorWarning("-6m'2'")).not.toBeNull();
    expect(getBookErrorWarning('32')).toBeNull();
  });

  it("'1' and 'm-3m'' (no alternate settings at all): no effect", () => {
    expect(getFrameDisplayName('1', 1, 'birss')).toEqual({ primary: '1' });
    expect(getFrameDisplayName('1', 1, 'itc')).toEqual({ primary: '1' });
    expect(getFrameDisplayName("m-3m'", 1, 'itc')).toEqual({ primary: "m-3m'" });
    expect(getSettingLabels('1', 'itc')).toEqual([]);
    expect(getSettingLabels("m-3m'", 'itc')).toEqual([]);
    expect(getConventionNote('1')).toBeNull();
    expect(getConventionNote("m-3m'")).toBeNull();
    expect(getDefaultSetting('1', 'itc')).toBe(1);
    expect(getGroupDisplayName('1', 'itc')).toBe('1');
    expect(getGroupDisplayName("m-3m'", 'itc')).toBe("m-3m'");
  });

  it('no setting label ever contains "standard" or "Default" text', () => {
    const groupsToCheck = ['2', "m'm'm", "6'mm'", '-42m', 'mm2', "mm21'"];
    for (const group of groupsToCheck) {
      for (const convention of ['birss', 'itc'] as const) {
        for (const { axisWord, hm } of getSettingLabels(group, convention)) {
          expect((axisWord ?? '').toLowerCase()).not.toContain('standard');
          expect((axisWord ?? '').toLowerCase()).not.toContain('default');
          expect(hm.toLowerCase()).not.toContain('standard');
          expect(hm.toLowerCase()).not.toContain('default');
        }
      }
    }
  });
});

describe('conventionMapping — architectural rule: convention never reaches tensor computation', () => {
  // `Convention` is a UI/state-only value; TensorConfig.convention is never read by
  // tensorProjection.ts or tensorCalculator.ts, whose signatures below take no such parameter.
  // This test is a determinism backstop: identical (group, tensorType, tr, setting) inputs must
  // always produce byte-identical output, independent of anything the UI layer is doing.
  const samples: Array<[string, 'ED' | 'MD' | 'EQ', 'i' | 'c', number]> = [
    ['32', 'ED', 'i', 1],
    ['32', 'ED', 'i', 2],
    ["6'mm'", 'MD', 'c', 1],
    ["6'mm'", 'MD', 'c', 2],
    ['-42m', 'ED', 'i', 1],
    ['-42m', 'ED', 'i', 2],
    ['2', 'ED', 'i', 1],
    ['2', 'ED', 'i', 2],
    ["m'm'm", 'MD', 'c', 1],
    ["m'm'm", 'MD', 'c', 2],
    ["6'/mm'm", 'MD', 'c', 1],
    ["6'/mm'm", 'MD', 'c', 2],
    ['1', 'EQ', 'i', 1],
    ["m-3m'", 'ED', 'i', 1],
  ];

  it.each(samples)('%s %s %s-type setting %i: repeated calls are byte-identical', (group, tensorType, tr, setting) => {
    const a = calculateTensorBasisResults(group, tensorType, tr, setting);
    const b = calculateTensorBasisResults(group, tensorType, tr, setting);
    expect(a).toEqual(b);

    const compA = calculateTensorComponents(group, tensorType, tr, setting);
    const compB = calculateTensorComponents(group, tensorType, tr, setting);
    expect(compA).toEqual(compB);
  });
});

describe('grey (Type II) groups WITH alternate settings — every setting label carries the 1\' suffix', () => {
  const greyGroupsWithSettings = Object.keys(ALTERNATE_SETTINGS).filter(k => k.endsWith("1'"));

  it('the fixture itself is non-empty (guards against a silently-vacuous it.each below)', () => {
    expect(greyGroupsWithSettings.length).toBeGreaterThan(0);
  });

  it.each(greyGroupsWithSettings)('%s: all setting labels end with 1\' in both conventions', (group) => {
    for (const convention of ['birss', 'itc'] as const) {
      const labels = getSettingLabels(group, convention);
      expect(labels.length).toBeGreaterThan(0);
      for (const { hm } of labels) {
        expect(hm.endsWith("1'")).toBe(true);
      }
    }
  });
});
