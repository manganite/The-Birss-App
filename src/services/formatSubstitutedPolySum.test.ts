/**
 * Regression pins for formatSubstitutedPolySum — the Simulator's user-visible formula formatter.
 * See formatSubstitutedPolySum.fixtures.ts for the coverage map and capture provenance (base
 * 3351c6c). Byte-exact; a red pin is a behaviour change to STOP AND REPORT, never re-capture.
 */
import { describe, it, expect } from 'vitest';
import { formatSubstitutedPolySum } from './latexFormatting';
import { SUB_POLY_CASES } from './formatSubstitutedPolySum.fixtures';

describe('formatSubstitutedPolySum regression pins', () => {
  for (const { name, terms, expected } of SUB_POLY_CASES) {
    it(name, () => {
      expect(formatSubstitutedPolySum(terms)).toBe(expected);
    });
  }
});
