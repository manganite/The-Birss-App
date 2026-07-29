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

  // Explicit generous timeout, same reasoning as PIN_TIMEOUT_MS in shgUnification.pins.test.ts: the
  // heaviest cells here are rank-4 EQ projections over an order-96 grey group (m-3m1' measures ~1.7 s
  // cold in isolation), so under full-suite contention they can exceed vitest's 5 s default -- an
  // intermittent flake that passes when the file runs alone. These assertions fail on a CHANGED VALUE,
  // never on duration; performance is the bench's job (tensorForms.bench.ts).
  const GREY_TIMEOUT_MS = 30000;

  for (const pg of greyGroups) {
    for (const tensor of TENSOR_TYPES) {
      it(
        `${pg.name} ${tensor} c-type ≡ 0`,
        () => {
          expect(calculateTensorComponents(pg.name, tensor, 'c')).toEqual(['All components are zero.']);
        },
        GREY_TIMEOUT_MS,
      );
    }
  }
});

describe('audit Phase 3c — particularization (Step 5d): the per-channel intrinsic symmetry', () => {
  it('ED (rank 3) of group 1 has 18 independent components (jk-symmetrized from 27, no crystal constraint)', () => {
    expect(calculateTensorComponents('1', 'ED', 'i')).toHaveLength(18);
  });

  it('EQ (rank 4) of group 1 has 36 independent components (6 ij-symmetrized x 6 kl-symmetrized pairs)', () => {
    // Q1 (2026-07-29): was 54 = 9 free (i,j) x 6 kl-pairs, before the quadrupole's own index
    // symmetry Q_ij = Q_ji was enforced. Both pairs are now symmetric and independent of each
    // other (the `ij_kl` class, no pair exchange, no trace condition), so the count is 6 x 6.
    // See BIRSS-APP-CONVENTIONS-REFERENCE.md Step 5(d).
    expect(calculateTensorComponents('1', 'EQ', 'i')).toHaveLength(36);
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

  it('EQ: chi_ijkl = chi_ijlk IS imposed on the last two (field) indices', () => {
    const result = calculateTensorComponents('1', 'EQ', 'i');
    expect(result).toContain('\\chi_{xxxy} = \\chi_{xxyx}');
  });

  it('EQ: chi_ijkl = chi_jikl IS imposed on the leading (quadrupole) pair -- xyxx merges with yxxx', () => {
    // Q1 (2026-07-29), the inverse of the pre-Q1 guardrail: the (i,j) output pair used to stay
    // general (xyxx appeared alone). The physical quadrupole is symmetric in its own indices
    // (Pershan 1963; Hoshi 1995 eq. 10), so xyxx and yxxx are one component now. See
    // BIRSS-APP-CONVENTIONS-REFERENCE.md Step 5(d).
    const result = calculateTensorComponents('1', 'EQ', 'i');
    expect(result).toContain('\\chi_{xyxx} = \\chi_{yxxx}');
    expect(result).not.toContain('\\chi_{xyxx}');
  });

  it('EQ: the two pairs stay INDEPENDENT of each other -- no pair exchange, xxxy and xyxx unmerged', () => {
    // The class is `ij_kl`, not Voigt: each pair is symmetric internally, but (ij) <-> (kl)
    // exchange is NOT imposed. Nor is Hoshi's trace condition chi_iikl = 0 (maintainer decision
    // 2026-07-29 -- the 36-component SHG baseline).
    const result = calculateTensorComponents('1', 'EQ', 'i');
    const merged = result.some((r) => r.includes('\\chi_{xxxy}') && r.includes('\\chi_{xyxx}'));
    expect(merged).toBe(false);
  });
});
