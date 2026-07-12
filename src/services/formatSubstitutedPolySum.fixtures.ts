/**
 * formatSubstitutedPolySum.fixtures.ts
 *
 * Regression pins for `formatSubstitutedPolySum` (latexFormatting.ts) — the Simulator's
 * user-visible formula formatter (aniPar/aniPerp/polA0/polA90/anaP0/anaP90 in
 * useSimulatorState.ts), which had NO test coverage before E9. These pins both close that
 * coverage gap and freeze behaviour across the E9 refactor (lifting the six inline
 * harmonic-mapping tables to named module-level constants).
 *
 * PINS ARE ENGINE-DERIVED, captured from base 3351c6c (PR #93 merge) via a direct call to
 * `formatSubstitutedPolySum` on each `terms` input below (vite SSR). They are regression pins
 * in the goldenTensors/rotatedSHG style — NOT independently-derived correctness goldens.
 * Frozen from the E9 refactor commit on; a red pin is a behaviour change to STOP AND REPORT,
 * never to re-capture.
 *
 * INPUTS are minimal hand-built Poly literals chosen for BRANCH COVERAGE of the formatter (per
 * the E8-retrospective volume rule: small inputs for branch coverage, never the ~5.6 KB
 * triclinic-EQ worst case). Every pinned string here is ≤ 80 bytes. Coverage map — which
 * mapping-table entries each case exercises:
 *
 *   theta-{cos,sin,none}-power-{00,11,01}  (9 cases): single non-zero pair → the power branch is
 *       strictly shorter, so it is selected. These directly pin every entry of the three THETA
 *       POWER tables (mode × pair).
 *   theta-{cos,sin,none}-harmonic-combo    (3 cases): pairs {00,11,01} together → the harmonic
 *       form is no longer than the power form, so it is selected. These pin every entry of the
 *       three THETA HARMONIC tables: the 00/11 entries via their cosθ/sinθ sum and their
 *       cos3θ/sin3θ (resp. cos2θ) mutual cancellation, and the 01 entries via its own harmonics.
 *   zero-none / zero-cos / ninety-sin      (3 cases): the parametric ZERO/NINETY builder with
 *       multiplyTrig ∈ {none→'1', cosθ, sinθ}; pins the '1'/cosθ/sinθ substitution and the
 *       pair-gating (ZERO keeps only '00', NINETY only '11').
 *   sign-flip / scale-2 / multi-chi        (3 cases): the global leading-sign flip, the per-term
 *       `scale`, and multi-χ sorting/joining — the output-shaping tail after table lookup.
 */

import type { formatSubstitutedPolySum } from './latexFormatting';

type Terms = Parameters<typeof formatSubstitutedPolySum>[0];

/** Build a single-χ poly from a {pairKey: coeff} record. */
const poly = (chi: string, pairs: Record<string, number>): Map<string, Map<string, number>> =>
  new Map([[chi, new Map(Object.entries(pairs))]]);

const CHI = '\\chi_{xxx}';

export interface SubPolyCase {
  name: string;
  terms: Terms;
  expected: string;
}

export const SUB_POLY_CASES: SubPolyCase[] = [
  // THETA, multiplyTrig = cosθ — power branch (single pair)
  {
    name: 'theta-cos-power-00',
    terms: [{ poly: poly(CHI, { '00': 1 }), mode: 'THETA', multiplyTrig: '\\cos\\theta' }],
    expected: '\\chi_{xxx} E_0^2 \\cos^3\\theta',
  },
  {
    name: 'theta-cos-power-11',
    terms: [{ poly: poly(CHI, { '11': 1 }), mode: 'THETA', multiplyTrig: '\\cos\\theta' }],
    expected: '\\chi_{xxx} E_0^2 \\cos\\theta \\sin^2\\theta',
  },
  {
    name: 'theta-cos-power-01',
    terms: [{ poly: poly(CHI, { '01': 1 }), mode: 'THETA', multiplyTrig: '\\cos\\theta' }],
    expected: '\\chi_{xxx} E_0^2 \\cos^2\\theta \\sin\\theta',
  },
  // THETA, multiplyTrig = sinθ — power branch (single pair)
  {
    name: 'theta-sin-power-00',
    terms: [{ poly: poly(CHI, { '00': 1 }), mode: 'THETA', multiplyTrig: '\\sin\\theta' }],
    expected: '\\chi_{xxx} E_0^2 \\cos^2\\theta \\sin\\theta',
  },
  {
    name: 'theta-sin-power-11',
    terms: [{ poly: poly(CHI, { '11': 1 }), mode: 'THETA', multiplyTrig: '\\sin\\theta' }],
    expected: '\\chi_{xxx} E_0^2 \\sin^3\\theta',
  },
  {
    name: 'theta-sin-power-01',
    terms: [{ poly: poly(CHI, { '01': 1 }), mode: 'THETA', multiplyTrig: '\\sin\\theta' }],
    expected: '\\chi_{xxx} E_0^2 \\cos\\theta \\sin^2\\theta',
  },
  // THETA, no multiplyTrig — power branch (single pair)
  {
    name: 'theta-none-power-00',
    terms: [{ poly: poly(CHI, { '00': 1 }), mode: 'THETA' }],
    expected: '\\chi_{xxx} E_0^2 \\cos^2\\theta',
  },
  {
    name: 'theta-none-power-11',
    terms: [{ poly: poly(CHI, { '11': 1 }), mode: 'THETA' }],
    expected: '\\chi_{xxx} E_0^2 \\sin^2\\theta',
  },
  {
    name: 'theta-none-power-01',
    terms: [{ poly: poly(CHI, { '01': 1 }), mode: 'THETA' }],
    expected: '\\frac{1}{2}\\chi_{xxx} E_0^2 \\sin 2\\theta',
  },
  // THETA — harmonic branch (pairs 00+11+01 together)
  {
    name: 'theta-cos-harmonic-combo',
    terms: [{ poly: poly(CHI, { '00': 1, '11': 1, '01': 1 }), mode: 'THETA', multiplyTrig: '\\cos\\theta' }],
    expected: '\\chi_{xxx} E_0^2(\\cos\\theta + \\frac{1}{4} \\sin\\theta + \\frac{1}{4} \\sin 3\\theta)',
  },
  {
    name: 'theta-sin-harmonic-combo',
    terms: [{ poly: poly(CHI, { '00': 1, '11': 1, '01': 1 }), mode: 'THETA', multiplyTrig: '\\sin\\theta' }],
    expected: '\\chi_{xxx} E_0^2(\\frac{1}{4} \\cos\\theta + \\sin\\theta - \\frac{1}{4} \\cos 3\\theta)',
  },
  {
    name: 'theta-none-harmonic-combo',
    terms: [{ poly: poly(CHI, { '00': 1, '11': 1, '01': 1 }), mode: 'THETA' }],
    expected: '\\chi_{xxx} E_0^2(1 + \\frac{1}{2} \\sin 2\\theta)',
  },
  // ZERO / NINETY — parametric multiplyTrig substitution + pair gating
  {
    name: 'zero-none',
    terms: [{ poly: poly(CHI, { '00': 1, '11': 1 }), mode: 'ZERO' }],
    expected: '\\chi_{xxx} E_0^2',
  },
  {
    name: 'zero-cos',
    terms: [{ poly: poly(CHI, { '00': 1 }), mode: 'ZERO', multiplyTrig: '\\cos\\theta' }],
    expected: '\\chi_{xxx} E_0^2 \\cos\\theta',
  },
  {
    name: 'ninety-sin',
    terms: [{ poly: poly(CHI, { '11': 1 }), mode: 'NINETY', multiplyTrig: '\\sin\\theta' }],
    expected: '\\chi_{xxx} E_0^2 \\sin\\theta',
  },
  // output-shaping tail: leading-sign flip, per-term scale, multi-χ join
  {
    name: 'sign-flip',
    terms: [{ poly: poly(CHI, { '00': -1 }), mode: 'THETA' }],
    expected: '\\chi_{xxx} E_0^2 \\cos^2\\theta',
  },
  {
    name: 'scale-2',
    terms: [{ poly: poly(CHI, { '00': 1 }), mode: 'THETA', scale: 2 }],
    expected: '2\\chi_{xxx} E_0^2 \\cos^2\\theta',
  },
  {
    name: 'multi-chi',
    terms: [
      {
        poly: new Map([
          ['\\chi_{xxx}', new Map([['00', 1]])],
          ['\\chi_{yyy}', new Map([['11', 1]])],
        ]),
        mode: 'THETA',
      },
    ],
    expected: '\\chi_{xxx} E_0^2 \\cos^2\\theta + \\chi_{yyy} E_0^2 \\sin^2\\theta',
  },
];
