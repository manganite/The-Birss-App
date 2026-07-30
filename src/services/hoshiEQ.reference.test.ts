import { describe, it, expect } from 'vitest';
import { calculateTensorBasisResults } from './tensorProjection';
import { spanRank, rref, RANK_PIVOT_EPS } from './linalg';
import {
  HOSHI_GROUPS,
  HOSHI_EQ11_CHAINS,
  HOSHI_CLOSURE,
  HOSHI_TRACE_DEPENDENT,
  HOSHI_FORM,
  HOSHI_FREE_PARAMETERS,
  type HoshiRelation,
} from './hoshiEQ.reference.fixtures';

/**
 * Q2 -- the app's EQ (rank-4) form against Hoshi 1995 Eqs. (11)-(12). See the fixture header for the
 * citation, the print-verification record, the index convention, the provenance decomposition and
 * the limit-group mapping.
 *
 * The interesting part is that Hoshi's constraint set is NOT the app's: he additionally imposes
 * tracelessness Q_ii = 0, which the app deliberately does not (maintainer decision 2026-07-29). So
 * this is not a "does the app equal print" guard. It is three separate claims:
 *
 *   1. everything in his form that follows from GROUP THEORY holds in the app identically;
 *   2. the app's space, INTERSECTED with the trace condition, is exactly his space -- the explicit
 *      conversion between the two conventions, sign factors and all;
 *   3. the app's space is strictly larger than his, i.e. the trace really is not enforced.
 *
 * Claim 3 is the adversarial half: it turns the maintainer decision into a guard, so a future change
 * that silently starts enforcing tracelessness fails here rather than passing quietly.
 */

const DIM = 81;
const EPS = 1e-9;

/** Flat index of a component label such as 'xxyy'. */
const idxOf = (label: string): number => {
  expect(label, 'component label is rank 4').toHaveLength(4);
  return [...label].reduce((acc, ch) => acc * 3 + 'xyz'.indexOf(ch), 0);
};

/** The app's EQ basis for a group -- the entry point the Calculator and Simulator consume. */
const appBasis = (group: string): number[][] => calculateTensorBasisResults(group, 'EQ', 'i', 1)!.basisResults;

/** A printed relation as a coefficient row over the 81 components: lhs - sum(rhs) = 0. */
const relationRow = (rel: HoshiRelation): number[] => {
  const row = new Array(DIM).fill(0);
  row[idxOf(rel.lhs)] += 1;
  for (const t of rel.rhs) row[idxOf(t.component)] -= t.coeff;
  return row;
};

/** Does `row . x = 0` hold for every x in the span of `basis`? */
const holdsIdentically = (row: number[], basis: number[][]): boolean =>
  basis.every((b) => Math.abs(row.reduce((s, a, c) => s + a * b[c], 0)) < EPS);

/** The nine trace equations sum_i Lambda_iikl = 0, one per field pair (k,l). */
const traceRows = (): number[][] => {
  const rows: number[][] = [];
  for (let k = 0; k < 3; k++)
    for (let l = 0; l < 3; l++) {
      const row = new Array(DIM).fill(0);
      for (let i = 0; i < 3; i++) row[i * 27 + i * 9 + k * 3 + l] += 1;
      rows.push(row);
    }
  return rows;
};

/** Basis of { x in span(basis) : row . x = 0 for every row }, computed in basis coordinates. */
const intersectWith = (basis: number[][], rows: number[][]): number[][] => {
  const M = rows.map((row) => basis.map((b) => row.reduce((s, a, c) => s + a * b[c], 0)));
  const R = rref(M, basis.length);
  const pivots = R.map((r) => r.findIndex((x) => Math.abs(x) > RANK_PIVOT_EPS));
  const free = [...Array(basis.length).keys()].filter((c) => !pivots.includes(c));
  return free.map((f) => {
    const coord = new Array(basis.length).fill(0);
    coord[f] = 1;
    R.forEach((r, i) => {
      if (pivots[i] >= 0) coord[pivots[i]] = -r[f];
    });
    const v = new Array(DIM).fill(0);
    coord.forEach((cf, m) => {
      if (cf !== 0) for (let c = 0; c < DIM; c++) v[c] += cf * basis[m][c];
    });
    return v;
  });
};

/** Hoshi's space, built from the transcribed coefficient table: one spanning vector per parameter. */
const hoshiSpace = (): number[][] =>
  HOSHI_FREE_PARAMETERS.map((_, p) => {
    const v = new Array(DIM).fill(0);
    for (const row of HOSHI_FORM) v[idxOf(row.component)] = row.coeffs[p];
    return v;
  });

/** Subspace equality: same dimension, and the union spans no more than either. */
const spansEqual = (A: number[][], B: number[][]): boolean => {
  const a = spanRank(A);
  return a === spanRank(B) && spanRank([...A, ...B]) === a;
};

describe('Q2 — Hoshi 1995 Eqs. (11)-(12): the group-theory anchors', () => {
  for (const { group, limitGroup } of HOSHI_GROUPS) {
    describe(`${group} (Hoshi's ${limitGroup})`, () => {
      it('every Eq. (11) equality chain holds identically in the app', () => {
        const basis = appBasis(group);
        for (const chain of HOSHI_EQ11_CHAINS) {
          const [head, ...rest] = chain.components;
          for (const other of rest) {
            const row = new Array(DIM).fill(0);
            row[idxOf(head)] += 1;
            row[idxOf(other)] -= 1;
            expect(holdsIdentically(row, basis), `${chain.name}: ${head} = ${other}`).toBe(true);
          }
        }
      });

      it('the Eq. (12) in-plane closure L1111 = L1122 + 2*L1212 holds identically', () => {
        // Group theory, not a trace consequence: the same closure Birss prints as the Table 4f
        // row-L4 sum cell, which the app derives for itself since Q0.
        const basis = appBasis(group);
        for (const rel of HOSHI_CLOSURE) {
          expect(holdsIdentically(relationRow(rel), basis), rel.printed).toBe(true);
        }
      });

      it('the app EQ space is 6-dimensional', () => {
        const basis = appBasis(group);
        expect(basis.length).toBe(6);
        expect(spanRank(basis)).toBe(6);
      });
    });
  }

  it('6/mmm and 6mm have the identical EQ form (Hoshi prints ONE form for both symmetries)', () => {
    // Exact at rank 4, not an approximation -- see the limit-group argument in the fixture header.
    const [a, b] = HOSHI_GROUPS.map((h) => appBasis(h.group));
    expect(spansEqual(a, b), '6/mmm and 6mm EQ spaces coincide').toBe(true);
    for (const chain of HOSHI_EQ11_CHAINS)
      for (const comp of chain.components) {
        const row = new Array(DIM).fill(0);
        row[idxOf(comp)] = 1;
        expect(holdsIdentically(row, a), `${comp} vanishes in 6/mmm`).toBe(holdsIdentically(row, b));
      }
  });
});

describe('Q2 — the trace conversion between the app and Hoshi', () => {
  it("Hoshi's transcribed form is 4-dimensional, as printed", () => {
    expect(HOSHI_FREE_PARAMETERS).toHaveLength(4);
    expect(spanRank(hoshiSpace())).toBe(4);
  });

  for (const { group } of HOSHI_GROUPS) {
    it(`${group}: the trace condition cuts the app's 6 dimensions to exactly Hoshi's 4`, () => {
      const basis = appBasis(group);
      const rows = traceRows();

      // The nine trace equations are far from independent here: their RANK on the app's space is 2
      // (three of them -- (kl) = xx, yy, zz -- are individually nontrivial, but xx and yy impose the
      // same constraint by the in-plane symmetry; the six off-diagonal ones are vacuous because
      // every component they touch already vanishes). 6 - 2 = 4 = Hoshi's count.
      const coordRows = rows.map((row) => basis.map((b) => row.reduce((s, a, c) => s + a * b[c], 0)));
      expect(spanRank(coordRows), 'rank of the trace condition on the app space').toBe(2);

      const intersection = intersectWith(basis, rows);
      expect(spanRank(intersection), 'dimension after imposing Q_ii = 0').toBe(4);
      expect(
        spansEqual(intersection, hoshiSpace()),
        `${group}: (app space INTERSECT trace) must equal Hoshi's Eqs. (11)+(12) space exactly`,
      ).toBe(true);
    });

    it(`${group}: inside that intersection the trace-dependent Eq. (12) lines hold, -2 factors included`, () => {
      const intersection = intersectWith(appBasis(group), traceRows());
      for (const rel of HOSHI_TRACE_DEPENDENT) {
        expect(holdsIdentically(relationRow(rel), intersection), rel.printed).toBe(true);
      }
    });
  }
});

describe('Q2 — negative control: tracelessness is NOT enforced (maintainer decision 2026-07-29)', () => {
  // The app keeps the 36-component SHG baseline: Q_ii = 0 appears in Hoshi and in the general
  // multipole literature, but Hoshi is alone in imposing it in the SHG context and modern EQ-SHG-RA
  // practice works without it. See BIRSS-APP-CONVENTIONS-REFERENCE.md Step 5(d). This test exists so
  // that silently starting to enforce the trace becomes a test failure rather than a quiet change.
  for (const { group } of HOSHI_GROUPS) {
    it(`${group}: the app space is strictly larger than Hoshi's (6, not 4)`, () => {
      const basis = appBasis(group);
      expect(spanRank(basis)).toBe(6);
      expect(spanRank(basis)).not.toBe(4);
      expect(spansEqual(basis, hoshiSpace()), "app space must NOT equal Hoshi's traceless space").toBe(false);
    });

    it(`${group}: each trace-dependent Eq. (12) line FAILS to hold in the app space`, () => {
      const basis = appBasis(group);
      for (const rel of HOSHI_TRACE_DEPENDENT) {
        expect(
          holdsIdentically(relationRow(rel), basis),
          `${rel.printed} must NOT hold identically -- it needs Q_ii = 0`,
        ).toBe(false);
      }
    });
  }
});
