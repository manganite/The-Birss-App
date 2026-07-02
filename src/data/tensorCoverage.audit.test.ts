import { describe, it, expect } from 'vitest';
import { calculateTensorComponents } from '../services/tensorCalculator';
import { POINT_GROUPS } from './pointGroups';

/**
 * Audit Phase 3b/3c (WORKORDER-audit-close-out.md Part 1): two living guardrail tests for
 * Step 5's rules in BIRSS-APP-CONVENTIONS-REFERENCE.md, independent of any table-anchored
 * fixture value -- these check *structural* properties of the projection pipeline itself.
 */

const TENSOR_TYPES = ['ED', 'MD', 'EQ'] as const;

describe('audit Phase 3b — grey groups: c-tensor ≡ 0 (Step 5e)', () => {
  const greyGroups = POINT_GROUPS.filter((pg) => pg.type === 'II');

  it('has exactly 32 grey (Type II) groups', () => {
    expect(greyGroups).toHaveLength(32);
  });

  for (const pg of greyGroups) {
    for (const tensor of TENSOR_TYPES) {
      it(`${pg.name} ${tensor} c-type ≡ 0`, () => {
        expect(calculateTensorComponents(pg.name, tensor, 'c')).toEqual(['All components are zero.']);
      });
    }
  }
});

describe("audit Phase 3c — particularization (Step 5d): symmetric in the last two indices only", () => {
  it('ED (rank 3) of group 1 has 18 independent components (jk-symmetrized from 27, no crystal constraint)', () => {
    expect(calculateTensorComponents('1', 'ED', 'i')).toHaveLength(18);
  });

  it('EQ (rank 4) of group 1 has 54 independent components (9 free (i,j) pairs x 6 kl-symmetrized pairs)', () => {
    expect(calculateTensorComponents('1', 'EQ', 'i')).toHaveLength(54);
  });

  it('ED: chi_ijk = chi_ikj IS imposed (last two indices symmetric)', () => {
    const result = calculateTensorComponents('1', 'ED', 'i');
    expect(result).toContain('\\chi_{xxy} = \\chi_{xyx}');
    expect(result).toContain('\\chi_{xyz} = \\chi_{xzy}');
  });

  it('ED: chi_ijk = chi_jik is NOT imposed (first two indices stay independent)', () => {
    const result = calculateTensorComponents('1', 'ED', 'i');
    // xxy (i=x,j=x,k=y, jk-paired with xyx) and yxx (i=y,j=x,k=x) would be forced into the
    // same relation if the app also imposed ij- or ik-symmetry; the app imposes jk-symmetry
    // only, so they must appear as two separate, unmerged list entries.
    expect(result).toContain('\\chi_{xxy} = \\chi_{xyx}');
    expect(result).toContain('\\chi_{yxx}');
  });

  it('EQ: chi_ijkl = chi_ijlk IS imposed on the last two (field) indices only', () => {
    const result = calculateTensorComponents('1', 'EQ', 'i');
    expect(result).toContain('\\chi_{xxxy} = \\chi_{xxyx}');
  });

  it('EQ: the (i,j) output pair stays general -- xxxy and xyxx are independent, not merged', () => {
    const result = calculateTensorComponents('1', 'EQ', 'i');
    expect(result).toContain('\\chi_{xxxy} = \\chi_{xxyx}');
    expect(result).toContain('\\chi_{xyxx}');
    const merged = result.some((r) => r.includes('\\chi_{xxxy}') && r.includes('\\chi_{xyxx}'));
    expect(merged).toBe(false);
  });
});
