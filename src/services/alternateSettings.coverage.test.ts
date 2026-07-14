import { describe, it, expect } from 'vitest';
import { ALTERNATE_SETTINGS } from './symmetryGroups';
import { GOLDEN_FIXTURES } from './goldenTensors.fixtures';

// Groups with no table-anchored setting-2 fixture. Their setting-2 operators are correct by
// construction (similarity transform of the print-verified default); this documents the absence
// of an independent literature check, not a doubt about correctness.
//
// Shrunk from 8 to 2 by the ITC Table 1.5.7.1 piezomagnetic MD-c anchor (see
// docs/references/ITC-table-1.5.7.1-piezomagnetic.md, itcPiezomagnetic.reference.test.ts).
// ITC anchors setting 2 directly for 2/m, 2'/m', -3m, and 6'/m'mm'. For 4'/mmm' and m'm'm,
// ITC's own matrix matches the app's DEFAULT setting 1 rather than setting 2 -- but setting 2 is
// still ITC-rooted, via the group's own ALTERNATE_SETTINGS transform (Rz(45°) / ORTHO_CYCLIC)
// applied to the ITC-anchored default by independent rank-3 tensor algebra (see the two
// corresponding fixtures in goldenTensors.fixtures.ts for the by-hand rotation/permutation
// check). All 6 are now covered by MD-c fixtures.
//
// The remaining 2 are the grey groups, genuinely unanchorable: ITC's table has no grey-group
// entries at all -- expected, since a grey group's antiunitary pure-1' element forces any
// time-odd (c-type) tensor, including MD-c, to vanish identically (Curie/Neumann principle),
// leaving nothing to anchor.
const NO_ANCHOR = new Set(["2/m1'", "-3m1'"]);

describe('every alternate setting has a table-anchored setting-2 test', () => {
  const covered = new Set<string>(GOLDEN_FIXTURES.filter((f) => f.setting === 2).map((f) => f.group));
  for (const group of Object.keys(ALTERNATE_SETTINGS)) {
    it(`${group}`, () => {
      if (NO_ANCHOR.has(group)) return;
      expect(covered.has(group)).toBe(true);
    });
  }
});
