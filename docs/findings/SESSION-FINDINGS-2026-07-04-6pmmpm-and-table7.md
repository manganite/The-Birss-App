# Session Findings 2026-07-04 — `6'/mm'm` Frame Error, Table-7 Bracket Semantics, and the Full 58-Row Audit

> **Content:** The `6'/mm'm` frame error, Table-7 bracket semantics, and the full 58-row audit.
> **Status:** frozen (2026-07-04)
> **Authority:** historical record, and the evidence base for the Birss/ITC divergences reference.

**Status:** verified findings record. Companion documents:
`WORKORDER-6pmmpm-frame-fix-and-table7-guard.md` (implementation),
`BIRSS-ITC-CONVENTION-DIVERGENCES.md` (convention framework; to be updated after the fix).
**Verification standard:** every claim below is anchored to (a) a maintainer-provided book scan
dated 2026-07-04, (b) a repo file at commit `dcb8359` (v0.14.0 + PR #51), or (c) a numeric
computation reproduced in this session. No claim rests on symbol-level plausibility alone.

---

## 1. Executive summary

1. The app's **`6'/mm'm` (D₆ₕ(D₃ₕ)) default setting is embedded 30° from Birss's book** — the only
   physical app error found. Its ED-c tensor is currently the xxx-family; the book requires the
   yyy-family. Root cause: the 2026-07-02 transcription pass 5 overrode the book's printed
   generator σ(2) to σ(4), anchoring on an ITC-derived full-HM string read with the wrong position
   convention. The correct physics already exists in the app as setting 2 (default and alternate
   are effectively swapped).
2. The precise meaning of **Birss's parentheses in Table 7** was established from the book's own
   explanatory text and verified empirically across all 58 black-white rows: parentheses mark
   symbols/forms referred to rotated reference axes, propagating from group cells to tensor cells
   exactly when the form is frame-sensitive.
3. A **full audit of all 58 BW rows** (four rank-3 tensor columns each, app projections vs
   Table 7 + Table 4e) found: 55 rows fully consistent; 1 app error (`6'/mm'm`); **2 previously
   unknown printing errors in Birss's Table 7 itself** (bracket omissions at rows `(-6'2m')` and
   `-6m'2'`), both proven by the book's own Table-6 generators plus group algebra.
4. All **five documented Birss book errors** (3 previously known + 2 new) were re-verified
   first-hand against maintainer scans in this session.
5. The correctness claim previously attached to `ED-tensor-components-per-group.md` was too
   strong; exactly **1 of its 87 rows is wrong** (`6'/mm'm` c-ED). The audit simultaneously
   *strengthened* the verification status of the remaining rows.

---

## 2. Finding A — the `6'/mm'm` frame error (app bug, PATCH-level)

### 2.1 What is wrong

`GENERATORS["6'/mm'm"]` (symmetryGroups.ts, ~line 233) encodes {6′_z, **m_y**, −1′}. The book's
row requires {6′_z, **2_y**, −1′} (equivalently the printed σ-set {σ(2), σ(5), σ(6)} = {2_y, m_z,
3_z} plus σ̲(1) = −1′). The two closures are the same abstract group in frames 30° apart:

| Generator reading | unitary 2-folds | unitary mirror normals | ED-c (rank 3) |
|---|---|---|---|
| Book: {2_y, m_z, 3_z} + −1′ | y-family (30°/90°/150°) | x-family (0°/60°/120°) | **yyy-family**: χ_xxy = χ_xyx = χ_yxx = −χ_yyy |
| App: {m_y, m_z, 3_z} + −1′ | x-family | y-family | **xxx-family**: χ_yyx = χ_yxy = χ_xyy = −χ_xxx |

Numerically verified in-session by group closure (|M| = 24, |H| = 12 for both) and rank-3
c-tensor projection (script pattern: close with antiunitary flags; project with sign −1 on
antiunitary elements).

### 2.2 The evidence chain (why the book reading is certain)

Three independent book-internal signals, each scan-verified 2026-07-04, converge on the same
frame:

1. **Printed generator.** Table 6, row `6̲/mm̲m` prints σ(2), σ(5), σ(6) / σ̲(1). Seen twice in
   this session on two independent scans (the isolated row scan and the full 6/mmm-block scan).
2. **Table 7 associated group A = (6̄2m), parenthesized.** Because −1′ ∈ M, the associated group
   A = H ∪ (−c₁)H collapses to **H exactly** (choose c₁ = −1, then −c₁ = 1). The book therefore
   directly names H's setting: the D₃ₕ group referred to axes rotated π/6 from the standard
   `-6m2` axes — i.e. unprimed 2-folds on the y-family. Scan-verified.
3. **Table 7 c-tensor symbols (R_m), (R_n), parenthesized.** (R_n) = Table-4e row R3 referred to
   the rotated axes = R3 rotated 30° = the yyy-family. The σ(2) closure reproduces this exactly;
   the σ(4) closure contradicts it. Scan-verified.

Additionally, the printed short symbol `6'/mm'm` is itself consistent with the σ(2) frame under
Birss's position rule (position 2 = y): the y-family carries {2 unprimed, m′ primed} → letter m′.
There is no contradiction anywhere in the book for this row.

### 2.3 Root cause of the app error

Transcription pass 5 (2026-07-02, table-6.md) declared the printed σ(2) a misprint "analogous to
Table 3's documented `-6m2` case" and transcribed σ(4). Its sole anchor was the full-HM string
`6'/m 2'/m 2/m'` from `table-nomenclature.md` — which is **transcribed from ITC Table 1.5.2.3**
and therefore carries ITC's position convention (position 2 = a-axes). Reading it with Birss's
convention (position 2 = y) inverts the frame. This is precisely the `-6m2`-style ITC↔Birss
position trap, applied in reverse. Table 7's A-column and tensor parentheses — the decisive
book-internal arbiters — were not consulted for that decision.

### 2.4 Why no fixture caught it

The group has exactly **one** golden fixture (ED-c, setting 2), whose source is "Similarity
transform Rz(30°)" — i.e. derived from the app's own default. The default setting has no
literature-anchored fixture. Both the app and the transcribed table-6.md inherited the same
single upstream decision, so all internal consistency checks passed while both were wrong. This
is the residual-circularity failure mode the anti-circularity policy exists to prevent; the gap
was the absence of a Table-7-anchored check (closed by Finding C's guard test).

### 2.5 Uniqueness check: the only short↔full inconsistency in the nomenclature

A mechanical collapse check over all 122 rows of `table-nomenclature.md` (does the Full-HM
column, read with Birss positions, collapse to the app key under the standard short-symbol
rules?) found **exactly one** genuine discrepancy: `6'/mm'm` (full `6'/m 2'/m 2/m'` collapses to
`6'/mmm'`). All other raw flags were collapse-convention artifacts (monoclinic keeps its single
fraction as the short; position-1 fractions collapse to `m` for N = 2 but stay for N ≥ 3;
placeholder `1`s and the grey `1'` suffix are stripped). Counter-probe: the structurally closest
row `6'/m'mm'` (full `6'/m' 2/m 2'/m'` → `6'/m'mm'`) is clean, as are the entire 4/mmm and
6/mmm families otherwise. This confirms the error-class analysis: the ITC→Birss position
conversion during full-HM transcription only bites where the two basal families carry unequal
content AND the string is frame-sensitive — which singles out this one row. The corrected full
`6'/m 2/m' 2'/m` collapses to the key exactly, restoring consistency; a permanent collapse guard
in `generate_nomenclature.py` is now part of the work order (step 3.6).

### 2.5a Consequences

- Generator fix (m_y → 2_y), new Table-7-anchored VERIFIED default fixture (yyy), flipped
  setting-2 fixture (xxx). `ALTERNATE_SETTINGS` labels stay textually unchanged (slot-convention
  invariant under the flip). CHANGELOG PATCH with data flag.
- The Birss↔ITC classification of this group changes: app/Birss `6'/mm'm` and ITC `6'/mmm'`
  denote the **same physical orientation** (ITC full `6'/m 2'/m 2/m'` in ITC positions = the σ(2)
  frame); the strings differ purely by the position-2 convention. This is a **new divergence
  class** ("same orientation, different short string"), distinct from `m'm'm`/`mm'm'` (different
  default frames) and from `-6m2` (same string, different orientations). Nomenclature full-HM for
  the row changes to `6'/m 2/m' 2'/m` (Birss positions).
- `ED-tensor-components-per-group.md`: exactly 1 of 87 rows wrong (this group's c-ED); regenerate
  after merge.

---

## 3. Finding B — Table-7 bracket semantics, established and verified

### 3.1 The book's own definition

Birss's explanatory text (following Table 6; scan provided 2026-07-04) states that parentheses
around group symbols **"and the brackets around the symbols E_m and E_n representing the property
tensors, indicate that the orientation of the reference axes is not the same"** as for the
standard group of the family, and quantifies the offsets: π/4 for `4̄m2`-type vs `4̄2m`, π/6 for
`6̄2m`-type vs `6̄m2`, axis permutations for the orthorhombic `(2mm)`/`(m2m)` vs `mm2`.

Operational content (verified, §3.3): a parenthesized tensor symbol's Table-4x form is valid in
those rotated axes; expressed in the row's fixed frame the components are the correspondingly
transformed form. The class letter itself is unaffected (bracketed ≡ unbracketed for Table-4a
lookups).

### 3.2 The propagation rule

Empirically established across all 58 BW rows and scan-verified at the critical cells:

> A tensor cell is parenthesized **iff** its source group is parenthesized **and** the letter's
> rank-3 form actually changes under that source's transform. Sources: G = unprime(column 2) for
> the four i-columns; A for c-Axial-even and c-Polar-odd; B for c-Polar-even and c-Axial-odd.

Frame-neutral letters stay unparenthesized even for bracketed sources — printed exactly so in the
book: row `(2̲m̲m)` brackets (E_m),(E_n) but not D_m,D_n; row `(4̄m2̲)` brackets (J_m),(J_n) but
not H_m,H_n (both scan-verified 2026-07-04). Frame sensitivity at rank 3 is pure table
mathematics: span(4e-row) vs span(rotated 4e-row) — sensitive: E (permutations), J (45°), R
(30°); neutral: D (permutations), H/I (45°), P/Q (30°).

### 3.3 Ground-truth demonstration (row `(2'm'm)`)

The book's own worked example fixes the operators: ℳ = [xyz; 2̲m̲m] = {1, m_z, 2′_x, m′_y}.
Direct projection (no table lookup) gives i-ED = x-distinguished E-form and c-ED =
y-distinguished E-form — matching (E_n) from G = 2mm (2∥x) and (E_n) from A = (m2m) (2∥y)
respectively, and *not* the tabulated z-distinguished standard E3. The parentheses therefore
carry real component-level content; they are not merely decorative. (They are, equally, not an
instruction to alter the Table-4a letter — both halves of the earlier discussion were correct on
their own level.)

### 3.4 A caveat discovered: bracket spelling is loose

Rows `4'mm'` and `-42'm'` print A = **(-4m2)** and A = **(-42m)** respectively for the physically
identical group (same rotated D₂d; identically confirmed by both rows printing (J_n); closures
verified). The letter order *inside* the parentheses is therefore not reliable; the physical
statement is carried by the parentheses plus the tensor symbols.

### 3.5 Associated-group formulas (status note)

A = H ∪ (−c₁)H is well-defined (coset-independent) and was applied throughout; it is exact
whenever used above. For B a construction was derived in-session (replace each unitary h by
det(h)·h and each primed c by −det(c)·c) and verified against **one** row (`-6m'2'`: yields 6mm,
matching print) — treat as plausible, **not** yet verified generally. The audit itself never
relies on constructing B; it uses the printed B letters directly.

### 3.6 Bracket migration in the application tables (Tables 9, 10, …)

Birss's effect tables (Table 9 magnetoelectric, Table 10 piezomagnetic; maintainer scans
2026-07-04) parenthesize **more** group symbols than Table 7's column 2. Explanation, established
and ground-truth verified: the application tables are derived views of Table 7 in which the
bracket information — distributed in Table 7 over column 2, the A/B columns, and the tensor
cells — is relocated onto the only remaining carrier, the group symbol. A group is parenthesized
there whenever the Table-7 cell governing that effect was parenthesized (or the group is itself
column-2-parenthesized).

Verification against the app's real generators (rank-2 c-axial projection = the magnetoelectric
tensor Q_ij):

| Group | Governing Table-7 cell | App Q_ij (standard frame) | Table 9 prints | Reading |
|---|---|---|---|---|
| `4'22'` | J_m unbracketed | diag(Q₁₁, −Q₁₁, 0) | same matrix, unbracketed | matrix applies as printed |
| `4'mm'` | **(J_m)** | symmetric off-diagonal = the 45°-rotated form | same shared diag matrix, symbol **bracketed** | printed matrix valid only in the rotated axes |
| `-42'm'` | **(J_m)** | symmetric off-diagonal | bracketed, same row | ditto |
| `2'm'm` | **(E_m)** | xz/zx independent | xy/yx row, symbol bracketed | = printed form under the A-permutation (z↔y, A = m2m) |
| `-6'2m'` | column 2 bracketed | diag(Q₁₁, Q₁₁, Q₃₃) | same matrix, bracketed | form rotation-invariant; bracket = inherited provenance flag |

Two consistent sub-conventions: where bracketed and unbracketed groups **share** one printed
matrix, the matrix is the standard class form and bracketed groups must transform it; where a
form class contains **only** bracketed groups, Birss prints the already-rotated components —
Table 10's piezomagnetic row for exactly the five c-Axial-odd-(R_n) groups (`6'22'`, `6'mm'`,
`-6'2m'`, `-6'm2'`, `6'/m'mm'`) shows the yyy-family with the free parameter deliberately named
Q₂₂ — and keeps the brackets as provenance flags. The set of five matches the audit's (R_n) list
exactly, and the yyy form matches their audit-verified standard-frame tensors.

Corollary/absence explained: `6'22'`, `6'mm'`, `6'/m'mm'`, `6'/mm'm` are missing from Table 9
entirely because their governing cell is (R_m) and **R₂ is the null form** — Q_ij ≡ 0 for all
four, verified by projection.

Caveat: underline placement in the scans is not everywhere resolvable; group identifications in
the table above rest on the uniquely matching computed tensor forms.

Consequence: the application tables provide additional independent book-internal cross-checks of
Table 7 (they independently confirm the (J_m) brackets of `4'mm'`/`-42'm'` and the column-2
bracket of `(-6'2m')`), and the table-7.md bracket-semantics section gains a corresponding
paragraph (work order step 3.3).

### 3.7 ITC's bracket-free solution and Birss↔ITC tensor concordance (ITC Vol. D §1.5.7/1.5.8)

ITC treats the same effects (piezomagnetism Table 1.5.7.1 p. 135, magnetoelectric Table 1.5.8.1
p. 139) without Birss-style parentheses, via three mechanisms stated explicitly on p. 134:

1. **The HM symbol is the frame declaration.** "The usual orientations of the CCS … can be
   expressed by the order of the entries in the Hermann–Mauguin symbol", with the positional
   rule: trigonal/hexagonal **z, x, y ∥ entries 1, 2, 3** — ITC position 2 = x, the exact
   counterpart of Birss's position 2 = y. Every group is re-oriented to its own standard setting
   and its tensor printed in that frame. (ITC adds: "the Schoenflies notation does not allow us
   to distinguish different orientations".)
2. **Square brackets [] mean "same form".** Alternative-setting symbols with identical tensor
   form are merged, e.g. `mm2 [2mm; m2m]`, `-42m [-4m2]`, `-6m2 [-62m]` — the merges occur
   exactly where the form class is rotation/permutation-neutral (the Π₁₄-type classes; the same
   neutrality our rank-3 audit established). Information direction is opposite to Birss:
   ITC's bracket = "setting-independent", Birss's = "rotated axes, form differs".
3. **Form-changing settings get their own explicit matrices** — either as separate symbol rows
   (`-6'2m'; -6'm2'` with the ITC-frame matrix) or as numbered extra matrices in the running
   text, which include the **z-unique monoclinic forms `112`, `11m`, `11 2/m`** — i.e. the
   Birss/app monoclinic setting, printed by ITC itself.

**Concordance verified:** Birss's five parenthesized piezomagnetic groups (`6'22'`, `6'mm'`,
`-6'2m'`, `-6'm2'`, `6'/m'mm'`) appear in ITC as one row with the **xxx-family** matrix
(Π₁₁ = −Π₁₂, Π₂₆ = −2Π₁₁); Birss Table 10 prints the **yyy-family** (Q₂₂). The two are exactly
the 30° rotation between ITC's x-secondary and Birss's y-secondary frames — same physics,
different declared frames. Further checks: classical `321/3m1/-3m1` row = xxx + Π₁₄ in ITC
(app/Birss: yyy + xyz, the known Level-1×2a divergence, consistent); `6'/mm'm` correctly absent
(contains −1′, piezomagnetism forbidden — matches Birss's '−' at c-Axial-odd); rank-2 ME merges
`321/312` etc. as form-identical, matching the rank-2 rotation-invariance argument (R₂ ≡ 0
analysis). No contradiction found anywhere: Birss-with-parentheses and ITC-with-symbol-frames are
two encodings of the same tensors. The structural trade is mirror-symmetric: ITC gives up the
shared parent-family frame; Birss gives up bracket-freedom.

**Anchor gain:** piezomagnetism = time-odd axial rank 3 = the app's **MD-c** SHG tensor class
(jk-symmetrized: the stress index pair). ITC Table 1.5.7.1 is therefore an independent literature
anchor for MD-c fixtures — including for **six of the eight NO_ANCHOR groups** of PR #51
(`2/m`, `2'/m'`, `m'm'm`, `-3m`, `4'/mmm'`, `6'/m'mm'` all appear in 1.5.7.1; the two grey
entries `2/m1'`, `-3m1'` have no c-tensors at all). Frame mapping: ITC's main-table settings
coincide with the app's setting 2 for the trigonal/hexagonal 30° pairs and for b-unique
monoclinic; ITC's extra text matrices (1)/(2) anchor the app's monoclinic **default** (z-unique)
directly. Caveat: 1.5.7.1 pins the jk-symmetric part only (complete for the fully symmetric
R/L/M-type classes; partial for xyz-block classes) and covers c-type only (no MD-i anchor).

---

## 4. Finding C — the full 58-row audit

### 4.1 Method

For each of the 58 BW rows of `table-7.md`: close the app's `GENERATORS` entry with the app's own
`getFullGroup`; project the four rank-3 invariant spaces (polar/axial × i/c; axial with det
factor, c with sign −1 on antiunitary elements); compare against the row's printed letters in
columns i-Polar-odd, i-Axial-odd, c-Polar-odd, c-Axial-odd, with 4e forms transformed per the
§3.2 rule. Both tables parsed at runtime from the repo files (no re-transcription). Cell grammar
fully covered (`-` → zero assertion; `0`/`±xyz` cells in 4e). Sharp negative test (opposite frame
must not fit) applied where the app-space dimension equals the 4e symbol count; containment-only
where 4e's encoding is symmetrized (letters with merged permutation cells, e.g. E/I/Q).
Cubic key mapping per the documented barless convention (`m'3` → `m'-3'` etc.).

### 4.2 Results

| Outcome | Rows |
|---|---|
| Fully consistent (physics + print pattern) | 55, including all other bracketed rows: `2'm'm`, `4'mm'`, `-4'm2'`, `-42'm'`, `6'22'`, `6'mm'`, `-6'2m'`\*, `-6'm2'`, `6'/m'mm'` |
| App error | `6'/mm'm` (Finding A) |
| Book printing errors (app correct) | `(-6'2m')` i-cells\*, `-6m'2'` A- and c-cells (Finding D) |

\* `(-6'2m')` passes all physical assertions (the group *is* the rotated setting by its own
bracketed column 2); only the print pattern deviates.

The prototype (`audit_t7_full.ts`, this session) becomes a permanent repo test per the work
order; it would have caught Finding A and will catch any future frame regression in any of the
58 groups.

---

## 5. Finding D — two new printing errors in Birss's Table 7

### 5.1 Row `(6̄2m̲)` = `(-6'2m')`: missing i-cell parentheses

The book prints the i-cells `R_m`, `R_n` **without** parentheses (scan 2026-07-04), although
column 2 is parenthesized and R is frame-sensitive. The orthorhombic and tetragonal analogues
(`(2̲m̲m)`, `(4̄m2̲)`) **do** parenthesize their i-cells — scan-verified — so this is an omission,
not a convention. Physics is unaffected and unambiguous: the group is the rotated setting by
definition of its bracketed column 2; the app's i-ED (yyy-family) is forced and verified.

### 5.2 Row `6̄m̲2̲` = `-6m'2'`: missing A- and c-cell parentheses

The book prints A = `6̄m2` and c-cells `R_m`, `R_n` unparenthesized (scan 2026-07-04). This
contradicts the book's **own** Table-6 generator for the row, σ̲(4) = m′⊥y (scan-verified):

- Group algebra: with primed mirrors ⊥ y-family, A = H ∪ (−c₁)H (H = C₃ₕ; −m_y = 2_y) is the D₃ₕ
  with 2-folds on the y-family — the rotated setting. Consistent printing requires (6̄2m),
  (R_m), (R_n).
- Tensor proof by hand: the c-condition under m′_y reads χ = −(m_y-transform of χ); component
  xxx → xxx forces xxx = 0, component yyy → −yyy survives. Hence ED-c = yyy-family (rotated R3),
  not the printed standard R_n. Confirmed numerically.
- The structurally mirrored neighbour row `6̲̄m2̲` (`-6'm2'`) is printed correctly with (6̄2m),
  (R_m), (R_n).

The app is verified correct here (default ED-c = yyy; existing setting-2 fixtures coherent). No
app change; table-7.md receives a documented book-error note and the guard test an
expected-transform override for this row.

---

## 6. Complete Birss book-error inventory (all first-hand re-verified 2026-07-04)

| # | Location | Error | Correct value | Evidence |
|---|---|---|---|---|
| 1 | Table 3, `6mm` generators | σ(4), σ(4), σ(6) | σ(3), σ(4), σ(6) | repeated σ(4) cannot generate a 6-fold; Table 6's `6mm` row prints σ(3), σ(4), σ(6) — both cells seen on scan |
| 2 | Table 3, `-6m2` generators | σ(2), σ(5), σ(6) | σ(4), σ(5), σ(6) | Table 4a (`3//z, -2//y`) + Table 6's classical `-6m2` row printing σ(4) — both seen on scan |
| 3 | Table 6, `6'/m'mm'` σ̲-cell | σ̲(2) | σ̲(3) | σ̲(2) = 2′_y collides with unprimed 2_y ∈ H = -3m (printed as σ(2) among the same row's unitary generators); closure yields the grey group `-3m1'`, not type III. Seen on scan; the adjacent `6/mm'm'` row carries σ̲(2) legitimately (likely typesetting slip between neighbouring rows) |
| 4 | Table 7, `(6̄2m̲)` i-cells | R_m, R_n unparenthesized | (R_m), (R_n) | §5.1 |
| 5 | Table 7, `6̄m̲2̲` A- and c-cells | A = 6̄m2; R_m, R_n unparenthesized | (6̄2m); (R_m), (R_n) | §5.2 |

Plus one **spelling caveat** (not an error class of its own): §3.4.

Cross-check with no domino effect: reversing the pass-5 `6'/mm'm` decision does **not** weaken
errors #1–#2 — their evidence (Table 6 counterparts) was independently re-confirmed on today's
scans. The pass-5 mistake was over-generalizing the σ(2)↔σ(4) misprint *pattern* to a row where
three independent book signals said otherwise.

---

## 7. Methodological consequences

1. **Table 7 is the arbiter for generator disputes.** The A-column (with its parentheses) and the
   tensor-cell parentheses are frame assertions by the book itself; σ-symbol plausibility
   arguments and cross-table pattern-matching are not sufficient. This is now codified in
   `conventions-reference.md` (work order step 3.8) and automated by the 58-row guard test.
2. **Position conventions must travel with their strings.** Any HM string imported from ITC
   carries ITC positions; reading it in Birss positions (or vice versa) silently rotates
   trigonal/hexagonal frames by 30°. The nomenclature table's ITC-derived columns need this
   provenance stated wherever they are used as anchors.
3. **Internal consistency ≠ correctness.** App, transcription, and derived documents can agree
   perfectly while sharing one wrong upstream decision. Every group needs at least one anchor
   that is independent of that chain — for the c-tensors, Table 7 provides exactly that, now
   enforced by test.
4. **Bracket-aware transcription checking.** The two new book errors were only findable because
   parenthesization was treated as content, not decoration. The propagation rule (§3.2) gives a
   mechanical check for any future table work.

## 7a. Transparency layer — building blocks for the bracket topic (decided 2026-07-04)

Why brackets exist at all (for the in-app explanation): the orientations of the derived objects
H, A, B are mathematical consequences of the parent frame plus the priming pattern, not free
choices — and they cannot be defined away. Proof by example (scan-verified rows): `6'mm'` has
A = `-6m2` (standard) and B = `(-62m)` (rotated); `4'mm'` has A = `(-4m2)` and B = `-42m`. A and
B sit 30°/45° apart, so no reorientation of M can make both bracket-free simultaneously.
Additional reasons: family coherence (one frame per parent family keeps cross-group tensor
comparisons meaningful) and table economy (Tables 4b–4f print each form class once, in one
setting; the bracket lets Table 7 reuse them instead of duplicating rotated variants).

How the app guarantees bracket-equivalent results: the app has no lookup step in which a bracket
could be lost — the frame information lives numerically in the generator matrices (transcribed
from Table 6); tensors are computed by direct projection; alternate settings by similarity
transform. The only bracket-sensitive step is human transcription/anchoring (where the `6'/mm'm`
error occurred), now machine-guarded: the 58-row test parses `table-7.md` **including
parentheses** and asserts every app projection reproduces letter ⊗ bracket state. Verified fact:
the UI currently never displays the form-class letters (they occur only in test fixtures), so no
in-UI bracket display exists today.

Four building blocks for the future UI transparency work order:

1. **Per-group note** in the group popup for the affected groups (the 10 bracketed Table-7 rows
   plus the application-table migration set): state the Table-7 letter and bracket, the rotation,
   and that the app shows fixed-frame components (e.g. `6'/mm'm`: "(R_n) → 4e form R3 in axes
   rotated 30°; app shows the yyy-family"). Data source: the same runtime-parsed table the guard
   test uses — one source of truth, no drift.
2. **Help section "Reading Birss's parentheses"** in the planned Notations & Conventions tab:
   bracket definition, propagation rule (§3.2), the `6'/mm'm` worked example, and the migration
   rule for the application tables (§3.6 — Tables 9/10 bracket the group symbols).
3. **Explicit warnings for the two book-error rows** (`(6̄2m̲)` i-cells; `6̄m̲2̲` A- and c-cells):
   without them, a user checking exactly those rows against the book will necessarily conclude
   the app is wrong.
4. Optional (scope decision for the UI work order): display the Table-7 letter including its
   parentheses next to the tensor output, making the book correspondence one-to-one.

---

## 8. Corrected-claims register (this session)

- "All tensors in `ED-tensor-components-per-group.md` were correctly generated" (earlier chat,
  2026-07-03/04): **overclaimed.** The validation covered operator-vs-transcription fidelity and
  per-class projection machinery, not per-group frames vs Table 7. Corrected status: 86/87 rows
  confirmed (and now more strongly than before); 1 row (`6'/mm'm` c-ED) wrong, pending the fix.
- Earlier in-session statements superseded by scan evidence: the D₃ₕ(D₃) `-6'2m'`/`-6'm'2` string
  divergence (wrong — ITC prints `-6'2m'`; reclassified as same-string orientation divergence);
  the `2'm'm` orientation divergence (wrong — app operators match ITC's standard reading);
  the initial attribution of book error #3 to `-3'm` (wrong — it belongs to `6'/m'mm'`).

---

## Changelog

- **2026-07-04** (later same session): Added §2.5 — short↔full collapse check over all 122
  nomenclature rows: `6'/mm'm` confirmed as the unique genuine inconsistency; collapse guard
  added to work order step 3.6.
- **2026-07-04** (later same session): Added §3.7 — ITC's bracket-free mechanism (Vol. D §1.5.7,
  p. 134 CCS rules; square brackets = same form; explicit extra matrices), verified Birss↔ITC
  tensor concordance (five (R_n) groups: ITC xxx vs Birss yyy = the documented 30°), and the MD-c
  anchor gain from Table 1.5.7.1 including six of the eight NO_ANCHOR groups.
- **2026-07-04** (later same session): Added §7a — rationale for Birss's brackets (A/B
  simultaneity argument, scan-verified rows `6'mm'`/`4'mm'`), how the app guarantees
  bracket-equivalent results, and the four transparency-layer building blocks for the future UI
  work order.
- **2026-07-04** (later same session): Added §3.6 — bracket migration in Birss's application
  tables (Tables 9/10), ground-truth verified via rank-2 magnetoelectric projections from the
  app's generators against maintainer scans; explains why the effect tables parenthesize more
  groups than Table 7 column 2. Work order §3.3 extended accordingly.
- **2026-07-04**: Initial version. All findings, evidence anchors (maintainer scans 2026-07-04;
  repo state `dcb8359` / v0.14.0 + PR #51), numeric verifications, and consequences recorded at
  the end of the investigation session that produced
  `WORKORDER-6pmmpm-frame-fix-and-table7-guard.md`.
