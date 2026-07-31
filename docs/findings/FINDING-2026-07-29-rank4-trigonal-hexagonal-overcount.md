# FINDING (2026-07-29): rank-4 trigonal/hexagonal group projection overcounts by +1 -- blocks the Q1 fixture amendment, exceeds Q1's scope

> **Content:** The rank-4 minimal-basis defect for 3-/6-fold groups: evidence chain, mechanism, census and Q0 verification record.
> **Status:** frozen (2026-07-30)
> **Authority:** historical record. The correction shipped in v0.23.1; the presentation contract it produced lives in Step 5(f) of the conventions reference.

Reported by the WO author during the Q1 symbolicEQHexagonal hand
re-derivation. The two-source crosscheck did exactly its job: calibration
against the fixture's documented provenance anchor exposed the
discrepancy BEFORE any values were transcribed.

## Status of the claim

Confirmed to the extent possible without the printed Birss Table 4f in
hand (maintainer print re-read required, see Open questions). Every
app-side and derivation-side statement below was executed and is
reproducible; the scripts live in the session record (`/tmp/derive2.py`
plus the probe snippets).

## Evidence chain

1. **Direct invariance failure (convention-free).** The old 3m EQ
   xxxx-family documented in `symbolicEQHexagonal.fixtures.ts`
   (chi_xxxx=1, chi_xxyy=chi_yyxx=3, chi_yyyy=1, four xy-quads=1) --
   which reproduces the numeric engine's pinned value to 16 digits, so
   it faithfully represents the engine's form -- is NOT invariant under
   Rz(120) (numerically tested; the mirror passes). Group invariance is
   basis- and convention-independent for a closed group, so no
   active/passive or transpose convention rescues this: the engine's 3m
   form contained a non-C3-invariant admixture.

2. **In-plane isotropy argument (pure mathematics).** Under a 3-fold
   (or 6-fold) z-axis, the purely in-plane block of a rank-4 tensor
   carries only even circular orders m in {-4,-2,0,2,4}; invariance
   requires m = 0 mod 3 (mod 6), leaving m = 0 only -- the in-plane
   block is ISOTROPIC and must satisfy
   chi_xxxx = chi_xxyy + chi_xyxy + chi_xyyx.
   The engine family violates it (1 vs 3+1+1 = 5); the independently
   derived family satisfies it exactly (1 = 0 + 1/2 + 1/2). Note the
   tetragonal case is different (m = 0 mod 4 keeps m = +/-4), which is
   why 4-fold groups are NOT affected -- matching the observed pattern.

3. **Molien/character counts vs the app (independent of my projector).**
   Invariant count = (1/|G|) sum_g (tr R_g)^4 for polar rank-4,
   intrinsic none:
   - C3v (3m): (81 + 2*0 + 3*1)/6 = **14**. App: 15.
   - C6v (6mm): (81 + 2*16 + 2*0 + 1 + 6*1)/12 = **10**. App: 11.
   - C4v (4mm): (81 + 2*1 + 1 + 4*1)/8 = **11**. App: 11. MATCH.
   - Oh (m-3m): **4**. App: 4. MATCH.
   The +1 exists BEFORE any intrinsic symmetrization and only for 3-/6-
   fold groups. My standalone projector (SVD nullspace over the group
   average built from the app's own generator data) reproduces every
   character count.

4. **It survives every intrinsic class, including voigt (elasticity).**
   App counts (live engine, computeTensorForm): 3m: none 15 / jk 11 /
   ij_kl 9 / voigt 7. 6mm: none 11 / jk 8 / ij_kl 7 / voigt 6.
   Independent derivation and standard references: 3m 14 / 10 / 8 /
   **6** (textbook trigonal elasticity), 6mm 10 / 7 / 6 / **5**
   (textbook hexagonal elasticity C11,C12,C13,C33,C44). The
   trigonal/hexagonal ELASTICITY and PHOTOELASTICITY forms shipped in
   the Tables feature are affected (by-type mode certainly; the
   by-effect pipeline shares computeTensorForm and must be re-probed
   explicitly). The textbook counts cited here are standard knowledge
   and still need the maintainer's print check (Nye) for the record.

5. **The corrected values have exact rational structure.** The
   independently derived ij_kl xxxx-family for all four fixture groups
   is chi_xxxx = chi_yyyy = 1, all four in-plane quads = 1/2, chi_xxyy =
   0 (plus z-block entries not touching this contraction), and the
   pinned S_X coefficient becomes exactly -15/64 = -0.234375 at
   (30,45,60) and 0.2671367647553550 at (15,-20,75) -- identical across
   all 14 cells, as before structurally, but with different values than
   the current constants.

## What this means for the in-flight Q1 branch

- The Q1 engine change (ij_kl on the EQ channel) remains scientifically
  CORRECT and required -- Minor-1 is not in question.
- But Q1's premise count table has wrong trigonal/hexagonal cells (they
  were probed from the buggy engine), the re-captured EQ pins for 3-/6-
  fold groups embed the +1 artifact, and the fixture amendment CANNOT be
  issued against the current engine: the honest expected values are the
  -15/64 family above, which the engine will only produce once the
  upstream overcount is fixed. CC's observation that the fixture stayed
  green under ij_kl is thereby explained: both old and new engine carry
  the same spurious direction, so the pinned coefficient never moved.
- Proposal: HOLD the Q1 branch as-is (local, unpushed). Fix the
  upstream projection bug first (new investigation WO), then rebase or
  re-execute Q1's re-captures on the corrected base, then land the
  fixture with the derived constants as its literature-grade goldens.

## Open questions for the investigation WO (draft scope)

1. MECHANICAL localization: where does the spurious direction enter?
   Candidate: numerical rank/rref tolerance interaction with the
   irrational (sqrt(3)/2) trigonal matrix entries (RANK_PIVOT_EPS =
   1e-7). Decisive probe: materialize the app's 15 basis vectors for 3m
   at none, test each for Rz(120)-invariance numerically -- the
   spurious one(s) fail; then trace their origin through the pipeline.
2. PRINT re-read (maintainer): Birss Table 4f rows feeding the trigonal
   and hexagonal rank-4 classes, held against the derived 14-form
   (3m/none) -- distinguishing (a) faithful transcription of a Birss
   print error, (b) a transcription slip surviving the 2026-07-09
   verification, (c) a class/row mapping error. Nye elasticity /
   photoelasticity pages for the affected classes as the second print
   anchor (6mm elasticity = 5 is bedrock).
3. Blast radius: all rank-4 outputs for the twelve 3-/6-fold classical
   groups and their magnetic derivatives, every intrinsic class incl.
   the by-effect elasticity/photoelasticity surfaces; rank 0-3
   unaffected as far as tested (rank-3 goldens are human-signed-off and
   the character counts there were not re-checked -- include a rank-3
   spot-check in the WO for completeness).
4. Whether the tables4f reference fixtures themselves encode the +1
   (engine passes them, so yes for the affected rows) -- they are
   EXPECTED to change after the print re-read resolves 2.

## Derived reference forms (independent, for the print comparison)

3m, rank 4, polar, i-type, intrinsic none, independent count 14; the
xxxx family under ij_kl as listed above. Full component listings are
reproducible from the session script; they will be attached to the
investigation WO rather than transcribed here by hand.

---

# ADDENDUM (2026-07-30): mechanism resolved; print re-read complete; census

## The complete mechanism (all claims verified on the live tree)

1. The seed-projection basis generator emits, for 3-/6-fold groups at rank
   4, a NON-MINIMAL spanning set: its dedup catches proportional pairs
   only, not multi-vector dependencies. For 3m/6mm the in-plane block
   yields four families with the exact dependency
   chain2 + chain4 + chain5 = 3 * chain1 (rank 3). Each family is
   individually group-invariant and lies inside the correct subspace --
   the SPACE the engine computes is right; the presented family list is
   redundant.
2. The rank machinery downstream (spanRank, R1 linalg) is CORRECT: the
   Tables header count (14 for 3m none), and the by-effect elasticity
   counts (3m voigt 6, 6mm voigt 5 -- textbook values) are all right.
3. Two consumers use the unreduced list and inherit the bug:
   (a) the relation/chain formatter -- the Tables page displays one chain
   per basis vector: 15 chains under a "14 independent components"
   header, four of them overlapping at T_xxxx and mutually contradictory
   under the natural constraints reading (literally read, they imply
   T_xxxx = 0 -- while the same page counts those components as
   non-vanishing);
   (b) the entry-point parameter attribution (tensorProjection rawPoly)
   -- Calculator/Simulator treat the redundant families as free
   parameters: an unidentifiable parametrization for fitting, and the
   ill-defined "coefficient of chi_xxxx" that produced the non-invariant
   symbolicEQHexagonal provenance family of 2026-07-11.
4. PRINT RE-READ (maintainer, 2026-07-30): Birss Table 4f row L4 shows
   the composite relation verbatim -- xxxx = yyxx + xyyx + yxyx = yyyy,
   plus the three pair equalities. 3 in-plane + 11 z-block = 14. No
   Birss erratum; no transcription slip (the vendored table carries the
   sum cell verbatim, parsed by the guard).
5. WHY THE GUARD PASSES (resolved from the test source): the 4f guard
   deliberately compares matrixRank(basis) to tableDim -- its own
   comment documents the non-minimal spanning set ("deduped only by
   proportionality") -- and its relation check verifies that every
   emitted family satisfies every parsed relation, which all four
   redundant families do (they lie in the true space). The guard is
   sound for its target (subspace equality) but asserts no MINIMALITY;
   nobody connected the acknowledged non-minimality to the display and
   rawPoly consumers.

## Census (rank 4, 32 classical groups, polar+axial, four intrinsic classes)

68 redundant cells: every 3-/6-fold group in every intrinsic class,
both parities; redundancy +1 for the -m2/-mm classes, +2 for the bare
3-/6-fold groups (e.g. 3 none: 29 vs rank 27; 6 none: 21 vs 19). The
122-group magnetic sweep multiplies this and belongs in the
investigation WO. The earlier "app count" statements in this finding
that read basisResults/relations lengths (15/11/9/7...) are hereby
recontextualized: they measured the redundant LIST length; the engine's
rank-level counts were correct throughout.

## Investigation WO scope (final)

(a) Reduce the basis (RREF via the existing linalg) at the source or
before both consumers; rank-3 and rank <= 2 paths must be proven
bit-identical (they never exhibit redundancy -- verify by census).
(b) Extend the relation formatter to express composite relations, with
the printed Birss style (row L4) as the canonical model; a pure
chain language CANNOT represent these blocks.
(c) Add the minimality guard basis.length === matrixRank(basis) to the
reference tests (one line; would have caught this).
(d) Census sweep as a permanent audit test across all 122 groups.
(e) Entry-point parametrization fix (rawPoly over the reduced basis);
then rebase Q1, re-run its red report, and land the
symbolicEQHexagonal constants from the independent derivation
(-15/64 family) as the fixture goldens.

---

# ADDENDUM 2 (2026-07-30, executor): the attribution is quantitatively wrong, not merely redundant; Q0 verification record

Added during Q0 execution, before vendoring. Everything below was
executed on the live tree and is reproducible from the Q0 session
record.

## The misattribution probe (the sharpest statement of the defect)

Addendum item 3(b) describes the entry-point consequence as an
unidentifiable parametrization with an ill-defined per-parameter
coefficient. It is stronger than that: the pre-Q0 attribution is
**quantitatively wrong**.

`computeShg` labelled each component by the lowest-index nonzero of its
own projected seed and scaled by a ratio, which asserts that
`T_ijkl / T_label` is constant over the whole invariant subspace. That
holds only inside a proportionality class. Probed against a GENERAL
invariant tensor (a fixed pseudo-random combination of the engine's own
basis, so it is by construction a legal tensor for the group):

```
3m  EQ: list=9 rank=8 -> 6 of 81 components misattributed
   xxyy: engine claims 3.0000*chi_xxxx = 4.500000, actual T = 0.071429
   xyxy: engine claims 1.0000*chi_xxxx = 1.500000, actual T = 0.714286
   (likewise xyyx, yxxy, yxyx, yyxx)
6mm EQ: list=7 rank=6 -> 6 of 81 misattributed
4mm / mm2 / m-3m: 0 of 81
```

The family this attribution implies is exactly
`chi_xxxx=1, chi_xxyy=chi_yyxx=3, four xy-quads=1` -- the
non-invariant family of evidence-chain item 1, violating the in-plane
isotropy condition of item 2 (1 vs 3+1+1). The loop closes: the
2026-07-11 fixture provenance family was not a transcription accident,
it was this attribution's output.

Consequence, since `simulatorEngine.buildSimulationData` evaluates
`rawPoly` directly (`S = sum_chi A_chi e^{i delta_chi} * fieldFactor`,
one amplitude/phase slider per chi key, with no separate tensor
materialization step): for the twelve 3-/6-fold classical classes and
their magnetic derivatives, the Simulator's rank-4 EQ polarimetry was
computed from a tensor that no crystal of that symmetry can have. This
is an OUTPUT correctness defect, not only a presentation/parametrization
one, and the CHANGELOG entry is written accordingly.

## Q0 verification record

- **Census, independently reproduced.** 12200 tensorForms cells (ranks
  0-4 x 5 intrinsic classes x polar/axial x i/c x 122 groups): 478
  redundant, **all at rank 4**, none at ranks 0-3; excess +1 in 385
  cells, +2 in 93. Restricted to this finding's scope (32 classical x
  {polar,axial} x 4 classes x i-type) the count is **68**, matching the
  addendum exactly. Entry point: 59 redundant cells, all EQ; ED/MD zero.
- **Character counts confirm the rank, not the list length**: 3m none
  14, 6mm none 10, 3 none 27, 4mm none 11 (clean), m-3m 4 (clean); 3m
  voigt 6 and 6mm voigt 5 reproduce the textbook elasticity counts.
- **D1's no-op premise holds**: over all 5935 non-redundant non-zero
  cells, RREF changes **zero** relation strings.
- **RREF is gated on the rank** (reduce only when non-minimal) and the
  historical per-seed attribution is kept verbatim where it does not
  fire. Reason, found during execution: the two attribution routes are
  mathematically identical for an uncoupled cell but differ by ~1 ULP,
  and on the irrational trigonal entries that is enough to tip a
  display rounding boundary (5/16 printing as `0.313` vs `0.312`;
  neither route is more accurate -- they straddle the exact value).
  Gating makes the census complement BIT-identical rather than merely
  equivalent.
- **Invariants, mechanically verified** over a 15259-record base-vs-Q0
  surface dump: ED/MD component lists and induced/source expressions 0
  changed records; tensorForms exactly the 478 census cells, 0
  already-minimal cells, 0 spanRank changes; EQ rawPoly/induced 66
  records over 47 groups, all 3-/6-fold. The `m-3m` EQ golden, the grey
  EQ-c audit, the Table-4f/4b-4e and Table-7 guards, the ITC 3.2.2.1
  counts, the by-effect elasticity counts and the generated sharing
  partitions (guarded by a live full recompute + deep compare) are all
  unchanged -- so no `npm run sharingdata` regeneration was needed.
- **Red report**: 16 tests, all expected -- the 14 `symbolicEQHexagonal`
  cells plus 2 EQ pin cells (`-3'm EQ i`, `6mm EQ i`; the other 26 pin
  cells byte-identical).
- **Two-source crosscheck (D3) passed.** The maintainer's independently
  hand-derived constants and the corrected engine agree to ~1e-16 from
  wholly separate routes:

  | cell | hand derivation | corrected engine |
  |---|---|---|
  | (30,45,60) | -0.234375 (= -15/64) | -0.23437499999999994 |
  | (15,-20,75) | 0.2671367647553550 | 0.2671367647553548 |

- **Display acceptance criterion met** for 3m rank-4 polar i `none`: the
  three pair equalities, `T_xxxx = T_yyyy`, the 11 z-block chains, and
  `T_xxxx = T_xxyy + T_xyxy + T_xyyx` on its own line -- Birss row L4's
  content with each partner the canonical (lowest-index) member of its
  class, under the unchanged "14 independent components" header.
- **Scope refinement.** `TablesPage.buildLabels` already applied `rref`
  before rendering the Voigt-compressed matrix, so the rank-4
  `ij_kl`/`voigt` and rank-3 `jk`/`ij` matrix views were always
  faithful. The display defect was confined to the `RelationList` path
  (rank-4 `none`/`ij`, rank-3 `none`) and to the Calculator, which had
  no reduction anywhere. This is why the contradiction was never visible
  in the matrix views.
- **Both new guards red-proofed** against the pre-Q0 engine: the rank-4
  minimality census fails with its offender list and the coupled-cell
  display-faithfulness check fails, while the ranks-0-3 census and the
  disjoint-cell check pass.
