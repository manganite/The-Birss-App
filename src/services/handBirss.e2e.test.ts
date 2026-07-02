import { describe, it, expect } from 'vitest';
import { calculateTensorComponents } from './tensorCalculator';

/**
 * Audit Phase 4 (WORKORDER-audit-close-out.md Part 2): named end-to-end acceptance checks for
 * the app's three risk-surface groups, asserted through `calculateTensorComponents` -- the same
 * public entry point the UI calls (SimulatorPage -> calculateTensorComponents), not any internal
 * projection helper (transformTensor / averageTensor / calculateTensorBasisResults in
 * tensorProjection.ts).
 *
 * `goldenTensors.test.ts` already asserts every fixture in `goldenTensors.fixtures.ts`,
 * including the three below, through this exact same entry point
 * (`calculateTensorComponents(f.group, f.tensor, f.tr, f.setting)`), so these are not new
 * coverage -- they are thin, explicitly-named wrappers that pin the audit's three literal
 * acceptance-criterion cases ("app output = hand-Birss") as their own standalone, discoverable
 * checkpoint, independent of the general fixture sweep. No new projection machinery here.
 */
describe('hand-Birss end-to-end (audit Phase 4)', () => {
  it('mm2 (classical): ED i matches Birss Table 4e row E3, jk-particularized', () => {
    // Anchor: goldenTensors.fixtures.ts, 'mm2' / ED / i fixture (Birss Table 4e row E3, 5
    // independent components: xxz=xzx, yyz=yzy, zxx, zyy, zzz -- Step 5's own worked example).
    expect(calculateTensorComponents('mm2', 'ED', 'i')).toEqual([
      '\\chi_{xxz} = \\chi_{xzx}',
      '\\chi_{yyz} = \\chi_{yzy}',
      '\\chi_{zxx}',
      '\\chi_{zyy}',
      '\\chi_{zzz}',
    ]);
  });

  it("-3'm' (black-white, Cr2O3): ED c matches the canonical magnetoelectric SHG source term", () => {
    // Anchor: goldenTensors.fixtures.ts, "-3'm'" / ED / c fixture -- the textbook Cr2O3 case,
    // independently confirmed against the primary source (Fiebig, Pavlov, Pisarev, JOSA B 22,
    // 96 (2005), Sec. 4.A.3, p.100, citing Birss): "chi^e(c) === chi_yyy = -chi_yxx = -chi_xyx
    // = -chi_xxy, chi_xyz = chi_xzy = -chi_yxz = -chi_yzx".
    expect(calculateTensorComponents("-3'm'", 'ED', 'c')).toEqual([
      '\\chi_{xxy} = \\chi_{xyx} = \\chi_{yxx} = -\\chi_{yyy}',
      '\\chi_{xyz} = \\chi_{xzy} = -\\chi_{yxz} = -\\chi_{yzx}',
    ]);
  });

  it('-43m (cubic): ED i matches Birss Table 4e row U3, jk-particularized', () => {
    // Anchor: goldenTensors.fixtures.ts, '-43m' / ED / i fixture (Birss Table 4e row U3, the
    // Td-type single independent component).
    expect(calculateTensorComponents('-43m', 'ED', 'i')).toEqual([
      '\\chi_{xyz} = \\chi_{xzy} = \\chi_{yxz} = \\chi_{yzx} = \\chi_{zxy} = \\chi_{zyx}',
    ]);
  });
});
