/**
 * hoshiEQ.reference.fixtures.ts -- the electric-quadrupole (rank-4) tensor form printed by
 * Hoshi et al., Phys. Rev. B 52, 12355 (1995), Eqs. (11)-(12), as a literature anchor for the app's
 * EQ channel. Closes the EQ series (Q2); see docs/planning/TODO-next.md, Q-series.
 *
 * CITATION AND PRINT VERIFICATION
 * Hoshi, Yamada, Ishikawa, Takezoe, Fukuda, "Second-harmonic generation in centrosymmetric molecular
 * films: Analysis under anisotropic conditions", Phys. Rev. B 52, 12355 (1995), §II.A.3, Eqs. (11)
 * and (12). Project PDF under docs/references/. Print-verified by the maintainer on 2026-07-30 from
 * the printed page.
 *
 * TRANSCRIPTION WARNING (do not "fix" this file from the PDF text layer): the extracted OCR of this
 * paper LOSES signs and numeric factors -- e.g. the `-2` coefficients of Eq. (12) do not survive
 * extraction. The values below come from the maintainer's verified reading of the printed page, not
 * from OCR. Re-verify against print, never against a text dump.
 *
 * INDEX CONVENTION -- identical to the app's, so no translation is applied. Hoshi writes
 * `Q_ij = Lambda_ijkl E_k E_l` with axis 3 the C axis: leading pair = the induced quadrupole,
 * trailing pair = the two driving fields, 3 = z parallel to c. Component labels below are the app's
 * (x, y, z) spelling of his (1, 2, 3).
 *
 * HIS CONSTRAINT SET vs THE APP'S. Hoshi imposes three things: the quadrupole's own index symmetry
 * (ij), the SHG field-pair symmetry (kl), and TRACELESSNESS Q_ii = 0. The app imposes the first two
 * (the `ij_kl` intrinsic class, Q1) and deliberately NOT the third -- it keeps the 36-component SHG
 * baseline (maintainer decision 2026-07-29; recorded in BIRSS-APP-CONVENTIONS-REFERENCE.md Step
 * 5(d)). So the app's space is strictly LARGER than his, and the two are related by an explicit
 * conversion rather than by equality. That conversion is what the accompanying test pins.
 *
 * PROVENANCE DECOMPOSITION -- the whole point of this fixture. Hoshi's printed relations do NOT all
 * have the same standing against the app:
 *
 *   (a) Eq. (11)'s four equality chains        -> GROUP THEORY. The app must satisfy them
 *                                                 identically, with no conversion. Positive anchors.
 *   (b) Eq. (12) line 2, L1111 = L1122 + 2*L1212
 *                                              -> GROUP THEORY. This is the in-plane isotropy
 *                                                 closure, the same relation Birss prints as the
 *                                                 Table 4f row-L4 sum cell and the app has derived
 *                                                 for itself since Q0. Positive anchor.
 *   (c) Eq. (12) lines 1 and 3, the two with a -2
 *                                              -> TRACE-DEPENDENT. They follow from Q_ii = 0, which
 *                                                 the app does not enforce. They must NOT hold in
 *                                                 the app's space, and enter only through the
 *                                                 conversion layer.
 *
 * Transcribing Eq. (12) wholesale as an app expectation would silently smuggle his trace convention
 * into the app's; splitting it this way is what makes the anchor honest.
 *
 * LIMIT-GROUP MAPPING. Hoshi states his form for the limit groups D(inf)h, C(inf)v and K_h, which
 * are not crystallographic. At RANK 4 the mapping to crystallographic groups is exact rather than
 * approximate: D(inf)h -> 6/mmm and C(inf)v -> 6mm, because a 6-fold axis already forces in-plane
 * isotropy for a fourth-rank tensor. (The in-plane block carries only even circular orders
 * |m| <= 4; invariance under a 6-fold axis needs m = 0 mod 6, leaving m = 0 alone -- the same
 * argument that makes the trigonal/hexagonal in-plane block isotropic in the Q0 finding.) So the
 * hexagonal and continuous-limit rank-4 forms coincide exactly, and the app's 6/mmm and 6mm EQ
 * forms are identical to each other -- which the test asserts, matching Hoshi's own presentation of
 * ONE form for both symmetries. K_h (full rotation group) has no crystallographic realization and
 * is OUT OF SCOPE here.
 *
 * ENGINE LEVEL ASSERTED: `calculateTensorBasisResults(group, 'EQ', 'i')` -- the entry point that
 * feeds the Calculator and Simulator, i.e. the app's actual EQ output surface. Since the F2 bridge
 * pins that entry point against `computeTensorForm(group, 1, {rank: 4, polar, i, ij_kl})` for all
 * 122 groups and both time parities, asserting either level is equivalent; the entry point is
 * chosen so this golden guards what users actually see.
 */

/** The two crystallographic groups Hoshi's limit groups map onto exactly at rank 4. */
export const HOSHI_GROUPS: { group: string; limitGroup: string }[] = [
  { group: '6/mmm', limitGroup: 'D(inf)h' },
  { group: '6mm', limitGroup: 'C(inf)v' },
];

/**
 * Eq. (11) -- the four independent components, each with the components printed as equal to it.
 * Group theory alone; the app must satisfy every chain identically.
 */
export const HOSHI_EQ11_CHAINS: { name: string; components: string[] }[] = [
  { name: 'L1122', components: ['xxyy', 'yyxx'] },
  { name: 'L1212', components: ['xyxy', 'yxyx', 'xyyx', 'yxxy'] },
  { name: 'L1133', components: ['xxzz', 'yyzz'] },
  {
    name: 'L1313',
    components: ['xzxz', 'zxzx', 'xzzx', 'zxxz', 'yzyz', 'zyzy', 'yzzy', 'zyyz'],
  },
];

/** A printed linear relation `component = sum(coeff * component)`, as transcribed. */
export interface HoshiRelation {
  printed: string;
  lhs: string;
  rhs: { coeff: number; component: string }[];
}

/**
 * Eq. (12) line 2 -- the in-plane isotropy closure. GROUP THEORY (see the provenance decomposition):
 * a positive anchor the app must satisfy identically, independent of the trace convention.
 */
export const HOSHI_CLOSURE: HoshiRelation[] = [
  {
    printed: 'L1111 = L1122 + 2*L1212',
    lhs: 'xxxx',
    rhs: [
      { coeff: 1, component: 'xxyy' },
      { coeff: 2, component: 'xyxy' },
    ],
  },
  {
    printed: 'L2222 = L1122 + 2*L1212',
    lhs: 'yyyy',
    rhs: [
      { coeff: 1, component: 'xxyy' },
      { coeff: 2, component: 'xyxy' },
    ],
  },
];

/**
 * Eq. (12) lines 1 and 3 -- TRACE-DEPENDENT. These follow from Q_ii = 0 and must NOT hold in the
 * app's space; the test uses them as a negative control on the maintainer decision.
 */
export const HOSHI_TRACE_DEPENDENT: HoshiRelation[] = [
  {
    printed: 'L3311 = -2*L1122 - 2*L1212',
    lhs: 'zzxx',
    rhs: [
      { coeff: -2, component: 'xxyy' },
      { coeff: -2, component: 'xyxy' },
    ],
  },
  {
    printed: 'L3322 = -2*L1122 - 2*L1212',
    lhs: 'zzyy',
    rhs: [
      { coeff: -2, component: 'xxyy' },
      { coeff: -2, component: 'xyxy' },
    ],
  },
  {
    printed: 'L3333 = -2*L1133',
    lhs: 'zzzz',
    rhs: [{ coeff: -2, component: 'xxzz' }],
  },
];

/**
 * Hoshi's complete form as a coefficient table over his FOUR free parameters
 * `[a, b, c, d] = [L1122, L1212, L1133, L1313]` -- Eqs. (11) and (12) together, transcribed
 * component by component so each row can be checked against the printed page in isolation.
 * Every component not listed here is zero in his form.
 */
export const HOSHI_FREE_PARAMETERS = ['L1122', 'L1212', 'L1133', 'L1313'] as const;

export const HOSHI_FORM: { component: string; coeffs: [number, number, number, number]; eq: 11 | 12 }[] = [
  // Eq. (11): the four independent components and their equality chains.
  { component: 'xxyy', coeffs: [1, 0, 0, 0], eq: 11 },
  { component: 'yyxx', coeffs: [1, 0, 0, 0], eq: 11 },
  { component: 'xyxy', coeffs: [0, 1, 0, 0], eq: 11 },
  { component: 'yxyx', coeffs: [0, 1, 0, 0], eq: 11 },
  { component: 'xyyx', coeffs: [0, 1, 0, 0], eq: 11 },
  { component: 'yxxy', coeffs: [0, 1, 0, 0], eq: 11 },
  { component: 'xxzz', coeffs: [0, 0, 1, 0], eq: 11 },
  { component: 'yyzz', coeffs: [0, 0, 1, 0], eq: 11 },
  { component: 'xzxz', coeffs: [0, 0, 0, 1], eq: 11 },
  { component: 'zxzx', coeffs: [0, 0, 0, 1], eq: 11 },
  { component: 'xzzx', coeffs: [0, 0, 0, 1], eq: 11 },
  { component: 'zxxz', coeffs: [0, 0, 0, 1], eq: 11 },
  { component: 'yzyz', coeffs: [0, 0, 0, 1], eq: 11 },
  { component: 'zyzy', coeffs: [0, 0, 0, 1], eq: 11 },
  { component: 'yzzy', coeffs: [0, 0, 0, 1], eq: 11 },
  { component: 'zyyz', coeffs: [0, 0, 0, 1], eq: 11 },
  // Eq. (12): "the other components", expressed in the same four parameters.
  { component: 'zzxx', coeffs: [-2, -2, 0, 0], eq: 12 }, // L3311 = -2*L1122 - 2*L1212
  { component: 'zzyy', coeffs: [-2, -2, 0, 0], eq: 12 }, // L3322 = same
  { component: 'xxxx', coeffs: [1, 2, 0, 0], eq: 12 }, // L1111 = L1122 + 2*L1212
  { component: 'yyyy', coeffs: [1, 2, 0, 0], eq: 12 }, // L2222 = same
  { component: 'zzzz', coeffs: [0, 0, -2, 0], eq: 12 }, // L3333 = -2*L1133
];
