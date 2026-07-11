import { describe, it, expect } from 'vitest';
import { calculateSymbolicSHGExpressions } from './symbolicProjection';
import { trigEval } from './trigPoly';
import { SYMBOLIC_EQ_HEX_FIXTURES } from './symbolicEQHexagonal.fixtures';

/**
 * Regression guard for E1: the symbolic SHG source term for EQ tensors on
 * 3-/6-fold groups must reproduce the (independently confirmed) numeric
 * coefficients at generic azimuth. See symbolicEQHexagonal.fixtures.ts for
 * the anti-circular provenance of the expected values.
 */
describe('E1 — symbolic EQ source coefficients on 3-/6-fold groups (generic angles)', () => {
  for (const f of SYMBOLIC_EQ_HEX_FIXTURES) {
    it(`${f.id}: ${f.sourceComponent} ${f.chi} ${f.pair} at (${f.phiX},${f.phiY},${f.psi})`, () => {
      const sym = calculateSymbolicSHGExpressions({
        groupName: f.groupName,
        tensorType: 'EQ',
        trType: f.trType,
        thetaX: 0,
        thetaY: 0,
      });
      const src = sym.source.find((s) => s.component === f.sourceComponent);
      expect(src, `source component ${f.sourceComponent} present`).toBeDefined();

      const tp = src!.symbolicPoly.get(f.chi)?.get(f.pair);
      expect(tp, `coefficient ${f.chi} ${f.pair} present`).toBeDefined();

      const value = trigEval(tp!, f.phiX, f.phiY, f.psi);
      expect(value).toBeCloseTo(f.expected, 9);
    });
  }
});
