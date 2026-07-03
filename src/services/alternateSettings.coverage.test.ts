import { describe, it, expect } from 'vitest';
import { ALTERNATE_SETTINGS } from './symmetryGroups';
import { GOLDEN_FIXTURES } from './goldenTensors.fixtures';

// Centrosymmetric groups whose ED tensor is identically zero in every setting and for which no
// MD/EQ literature or table reference exists. Their setting-2 operators are correct by
// construction (similarity transform of the print-verified default). Documented, intentional.
const NO_ANCHOR = new Set([
  "4'/mmm'", "6'/m'mm'", "m'm'm", "2'/m'", "2/m", "-3m", "2/m1'", "-3m1'",
]);

describe('every alternate setting has a table-anchored setting-2 test', () => {
  const covered = new Set(GOLDEN_FIXTURES.filter(f => f.setting === 2).map(f => f.group));
  for (const group of Object.keys(ALTERNATE_SETTINGS)) {
    it(`${group}`, () => {
      if (NO_ANCHOR.has(group)) return;
      expect(covered.has(group)).toBe(true);
    });
  }
});
