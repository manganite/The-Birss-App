import { describe, it, expect } from 'vitest';
import { calculateTensorBasisResults } from './tensorProjection';
import { calculateTensorComponents } from './tensorCalculator';
import { getFrameDisplayName, getSettingLabels, getConventionNote, getBookErrorWarning } from './conventionMapping';

describe('conventionMapping — label behaviour for representative groups', () => {
  it("'32' (naming-conflict, swap): names swap between settings", () => {
    expect(getFrameDisplayName('32', 1, 'birss')).toEqual({ primary: '32', synonym: '312' });
    expect(getFrameDisplayName('32', 1, 'itc')).toEqual({ primary: '312', synonym: '32' });
    expect(getFrameDisplayName('32', 2, 'birss')).toEqual({ primary: '312', synonym: '32' });
    expect(getFrameDisplayName('32', 2, 'itc')).toEqual({ primary: '32', synonym: '312' });
    expect(getConventionNote('32')).toBe('naming-conflict');
  });

  it("6'mm' (naming-conflict, swap): names swap, badge moves to setting 2 in ITC mode", () => {
    expect(getFrameDisplayName("6'mm'", 1, 'itc')).toEqual({ primary: "6'm'm", synonym: "6'mm'" });
    expect(getFrameDisplayName("6'mm'", 2, 'itc')).toEqual({ primary: "6'mm'", synonym: "6'm'm" });
    const birssLabels = getSettingLabels("6'mm'", 'birss');
    const itcLabels = getSettingLabels("6'mm'", 'itc');
    expect(birssLabels.find(l => l.badge)?.setting).toBe(1);
    expect(itcLabels.find(l => l.badge)?.setting).toBe(2);
  });

  it("-42m (tetragonal 45° pair): no label change, no badge, in either convention", () => {
    expect(getFrameDisplayName('-42m', 1, 'birss')).toEqual({ primary: '-42m' });
    expect(getFrameDisplayName('-42m', 1, 'itc')).toEqual({ primary: '-42m' });
    expect(getFrameDisplayName('-42m', 2, 'itc')).toEqual({ primary: '-42m' });
    const itcLabels = getSettingLabels('-42m', 'itc');
    expect(itcLabels.every(l => l.badge === undefined)).toBe(true);
    expect(getConventionNote('-42m')).toBeNull();
  });

  it("'2' (monoclinic): no name change; badge moves to setting 2 (b-unique) in ITC mode", () => {
    expect(getFrameDisplayName('2', 1, 'birss')).toEqual({ primary: '2' });
    expect(getFrameDisplayName('2', 2, 'itc')).toEqual({ primary: '2' });
    const birssLabels = getSettingLabels('2', 'birss');
    const itcLabels = getSettingLabels('2', 'itc');
    expect(birssLabels.find(l => l.badge)?.setting).toBe(1);
    expect(itcLabels.find(l => l.badge)?.setting).toBe(2);
    expect(itcLabels.map(l => l.label)).toEqual(['First (c-unique, Birss)', 'Second (b-unique, ITC)']);
    expect(getConventionNote('2')).toBe('monoclinic');
  });

  it("m'm'm (Sec. 7A, different default frames): string identical; badge moves to a-unique (setting 2) in ITC mode", () => {
    expect(getFrameDisplayName("m'm'm", 1, 'birss')).toEqual({ primary: "m'm'm" });
    expect(getFrameDisplayName("m'm'm", 2, 'itc')).toEqual({ primary: "m'm'm" });
    const birssLabels = getSettingLabels("m'm'm", 'birss');
    const itcLabels = getSettingLabels("m'm'm", 'itc');
    expect(itcLabels.map(l => l.label)).toEqual(['Default', 'a-unique', 'b-unique']);
    expect(birssLabels.find(l => l.badge)?.setting).toBe(1);
    expect(itcLabels.find(l => l.badge)?.setting).toBe(2);
    expect(getConventionNote("m'm'm")).toBe('orthorhombic-badge');
  });

  it("6'/mm'm (Sec. 7A, same frame different string): name swaps like naming-conflict, but badge stays on setting 1 in ITC mode", () => {
    expect(getFrameDisplayName("6'/mm'm", 1, 'birss')).toEqual({ primary: "6'/mm'm", synonym: "6'/mmm'" });
    expect(getFrameDisplayName("6'/mm'm", 1, 'itc')).toEqual({ primary: "6'/mmm'", synonym: "6'/mm'm" });
    expect(getFrameDisplayName("6'/mm'm", 2, 'itc')).toEqual({ primary: "6'/mm'm", synonym: "6'/mmm'" });
    const itcLabels = getSettingLabels("6'/mm'm", 'itc');
    expect(itcLabels.find(l => l.badge)?.setting).toBe(1);
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
