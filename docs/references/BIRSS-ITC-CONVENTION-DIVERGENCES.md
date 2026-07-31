# The Birss App and the International Tables: Axis Conventions, Settings, and Symbol Divergences

> **Content:** Every Birss<->ITC symbol, setting and orientation divergence the app has had to arbitrate.
> **Status:** living
> **Authority:** AUTHORITATIVE for Birss/ITC divergence questions. Supersedes the older comparison in `docs/findings/DISCREPANCIES.md`.

**Status:** findings document -- the verified basis for the planned in-app transparency layer.
**Revision 2 (2026-07-04):** updated after the v0.14.1 `6'/mm'm` frame correction (PR #52) and the
full 58-row Table-7 audit; see `SESSION-FINDINGS-2026-07-04-6pmmpm-and-table7.md` for the evidence
record. All previously open verification caveats in Sec. 9 are now resolved.
**Scope:** how the app's point-group definitions relate to the *International Tables for
Crystallography* (ITC), which groups diverge, and why. Every factual claim here is anchored to
a primary source (ITC Vol. A Ch. 3.2, ITC Vol. D Ch. 1.5, or Birss 1966); see
[Sec. 9 Verification](#9-verification-status-and-method).

---

## 1. Why this document exists

The app computes tensor forms and SHG source terms in the convention of **Birss,
*Symmetry and Magnetism* (1966)**. Birss's convention is internally consistent and the app is
faithful to it (this is a deliberate design choice, not a bug). But Birss makes two reference-frame
choices that differ from the modern ITC standard, and those differences are **invisible in most
printed symbols** while still changing *which Cartesian tensor component is non-zero*. A user who
arrives with an ITC mental model can therefore read an app symbol they recognise (`-6m2`, `3m`,
`2/m`) and silently assume the wrong orientation -- and hence the wrong tensor.

This document makes those divergences explicit and enumerates the affected groups.

---

## 2. Two things that look like one: **setting** vs **convention**

It helps to separate two distinct sources of "which axis is which," because only their *combination*
produces the confusing cases.

| Level | What it is | Also in ITC? | Effect |
|---|---|---|---|
| **1 -- Setting** | The same group embedded in the axis cross in more than one allowed way (monoclinic b-/c-unique; the 30 deg basal rotation of `-6m2`<->`-62m`; orthorhombic axis permutations). | **Yes** -- ITC lists these too. | Component *labels* move; physics unchanged. In the app this is the **setting selector**. |
| **2a -- Axis/position rule** | Birss's *default* choice of which physical direction a symbol position refers to (position 2 -> **y**; monoclinic unique axis -> **c**). | No -- this is Birss-specific. | Fixes *which orientation a given symbol denotes* -> changes which Cartesian components survive. **Physically relevant.** |
| **2b -- Pure notation** | Spelling only: bar (`m-3` vs `m3`), Schoenflies `C3i` vs `S6`, prime vs underline, short vs full HM. | Mixed. | No physics. Can only trip up *symbol recognition*. |

**The key point:** the visible traps for an ITC user live in the **coupling of Level 1 and Level 2a**,
not in either alone. Example (worked in Sec. 6): the two orientations of `-6m2` are a genuine setting
(Level 1), but Birss's y-rule (Level 2a) attaches the *string* `-6m2` to the orientation that ITC
labels `-62m`. Same string, different orientation, different tensor family.

---

## 3. Axis conventions: x/y/z, a/b/c, and [hkl]

The app fixes an orthonormal **Cartesian** frame (x, y, z) and relates it to the **crystallographic**
axes (a, b, c) and Miller/Bravais directions as follows.

**Trigonal & hexagonal** (app "Axis orientation" box):

```
 z || [001]  || [0001]              (c-axis, the principal 3-/6-fold axis)
 x || [100]  || [2-1-1 0]           (a-axis, a1)
 y || [120]  || [0 1 -1 0]          (perp a1 in the basal plane, 90 deg from x)
```

Two facts about this frame drive everything below:

- **x lies along an a-axis; y does not.** The three a-axes (secondary directions `<100>`) point at
  0 deg, 120 deg, 240 deg. y points at 90 deg, which is a **tertiary** direction (`<1-10>`-type, the app's
  `[120]`). So "along y" and "along an a-axis" are *different* directions, 30 deg/90 deg apart. Under a
  bare 3-fold they are **not** equivalent -- this is the whole reason trigonal groups are sensitive
  to the choice.
- **The 3-fold mixes the two crystallographic families.** Rotating an a-axis (0 deg) by the 3-fold
  gives 120 deg, 240 deg -- still a-axes. Rotating the tertiary y (90 deg) gives 210 deg, 330 deg -- still tertiary.
  So the basal plane carries two inequivalent sets of directions, and any symbol that names "one of
  them" must pick a convention.

**Monoclinic:** the app uses the **first setting, z || c** (Birss). The unique 2-fold / mirror axis is
**c**. ITC's standard is **b-unique** (unique axis b). With z || c the app takes `y || b*`, `x || a`
(Z->Y->X right-handed order). For triclinic and monoclinic the *symbolic* component relations are
convention-independent (those groups commute with in-plane rotations); only the **axis label** on
the free components moves.

**Orthorhombic:** x, y, z are the three mutually perpendicular 2-fold/mirror axes; the divergences
here are axis-*permutation* settings.

---

## 4. How a Hermann-Mauguin symbol encodes orientation

An HM symbol lists symmetry elements by **crystallographic direction (position)**:

- a **rotation axis** symbol (`2`, `3`, `6`) sits at a position when the axis is **parallel** to that
  direction;
- a **mirror** symbol (`m`) sits at a position when the mirror plane is **perpendicular** to that
  direction -- i.e. the symbol names the mirror's **normal**.

ITC states this explicitly. The legend of ITC Vol. D Table 1.5.2.3 reads: *"N(mperp) denotes N mirror
planes with **normals** perpendicular to the principal symmetry axis"* -- mirrors are named by their
normal. The full rule is ITC Vol. A, Sec. 2.2.4.

Positions in the trigonal/hexagonal system:

| Position | ITC direction | Birss default |
|---|---|---|
| 1 (primary) | [001] = c | z = c |
| 2 (secondary) | `<100>` = a-axes | **y** (the tertiary direction!) |
| 3 (tertiary) | `<1-10>` | the a-axis direction |

Row 2 is the crux. **ITC position 2 = a-axis; Birss position 2 = y.** Because y is a *tertiary*
direction, Birss's "position 2" and ITC's "position 2" point at physically different basal-plane
directions.

---

## 5. The mirror-orientation test, made concrete

For `3m`/`-6m2`, "position 2 = m" can mean two physically different mirrors:

```
        ITC  3m1 / -6m2                     Birss/App  3m / -6m2
        mirror perp a-axis (m_x)              mirror || a-axis (m_y)

              y                                   y
              |        / mirror plane             |
              |      /   (normal || x)       ------+------ mirror plane
      --------+--------  x = a-axis               |      (contains x = a-axis;
              |      \                             |       normal || y)
              |        \                           |
   "m at [100]" = m perp a          "m normal along y" = m || a
   normal on a-axis (position 2)  normal on tertiary y (Birss position 2)
```

The two frames are the **same group rotated by 30 deg**. They are *not* the same embedding, and for a
3-fold-only group they give **different non-zero tensor components**.

---

## 6. Worked example: `-6m2` (D3h) -- the canonical case

**Group:** D3h, order 12, the symmetry of a trigonal prism. Non-centrosymmetric => electric-dipole
SHG is allowed, with exactly **one** independent rank-3 component.

**What Birss / the app do.** Birss Table 4a gives `-6m2` with generator `-2//y` (= sigma(4) = [-2_y],
mirror perp y). With `y || [120]`, that mirror **contains the a-axis** -- it is the `m_y` embedding.
Closing {-6_z, m_y} gives the **xxx-family**:

```
   chi_yyx = chi_yxy = chi_xyy = -chi_xxx          (independent: chi_xxx)
```

**What ITC does.** ITC Vol. A Table 3.2.3.2 gives explicit coordinate triplets. For `-6m2` the
vertical-mirror operation is `-x+y, y, z`, which in the Cartesian frame is `(x,y) -> (-x, y)` = **m_x**
(mirror perp a-axis). For `-62m` the corresponding operation is `x-y, -y, z` = `(x,y) -> (x, -y)` = **m_y**.
So in ITC:

```
   ITC -6m2  = m_x embedding  ->  yyy-family:  chi_xxy = chi_xyx = chi_yxx = -chi_yyy
   ITC -62m  = m_y embedding  ->  xxx-family   (same as the app's default -6m2)
```

**Consequence.** The app's **default `-6m2`** is the `m_y`/xxx embedding, which ITC Vol. A draws as
**`-62m`**. The app's **second setting** (labelled `-62m` in-app) is the `m_x`/yyy embedding, which
ITC draws as `-6m2`. The two conventions attach the *opposite* string to each physical orientation.
The symbol string in ITC's magnetic-group table (Vol. D Table 1.5.2.3) is nonetheless `-6m2` for
both -- because each convention, applied to *its own* canonical orientation, prints `-6m2`. The
divergence is real but lives at the **orientation/tensor** level, not in the printed magnetic-group
symbol.

> Independent literature check (orientation-agnostic count): D3h has exactly one independent ED-SHG
> component regardless of setting; which Cartesian family carries it is what flips. Verified by
> group closure and against Birss Table 4e (row R3, print-verified).

**Monoclinic analogue (Level 1 + 2a).** Birss/app use unique axis **c** (`112`, `11m`, `11 2/m`);
ITC Vol. D Table 1.5.2.3 lists monoclinic **b-unique** (`121`, `1m1`, `1 2/m 1`). Same abstract
group, unique axis on a different Cartesian axis. For an ITC user the distinguished index moves
(Birss's `chi_zzz` plays the role of ITC's `chi_yyy`); the component *structure* is equivalent, only the
axis label changes. **Short** HM symbols (`2`, `m`, `2/m`, and their primed forms) are identical in
both conventions -- only the **full** form and the physical unique axis differ.

---

## 7. Catalogue of affected groups

Divergences fall into four classes. **A** and **B** change the printed symbol; **C** does not (same
symbol, different tensor); **D** is cosmetic. All entries in A, B and the trigonal part of C are
read directly from the sources in Sec. 9.

### 7A. HM **string** differs (app symbol != ITC symbol)

Exactly **two** groups print differently, and -- established in the 2026-07-04 session -- they are of
two *different* natures:

| System | Abstract group | App key (Birss) | ITC 1.5.2.3 | Nature |
|---|---|---|---|---|
| Orthorhombic | D2h(C2h) | `m'm'm` (unprimed 2 || z) | `mm'm'` (unprimed 2 || x) | **Different default frames.** Both conventions name settings the same way; they tabulate different defaults. ITC's symbol = the app's alternate setting. |
| Hexagonal | D6h(D3h) | `6'/mm'm` | `6'/mmm'` | **Same physical frame, different string.** Birss's and ITC's default orientations coincide (unprimed mirrors perp a-axes); the strings differ purely by the position-2 convention (Birss: y-family; ITC: a-axes). No component mapping is needed when comparing app output with ITC -- only the label differs. |

*(A previous revision of this document listed D3h(D3) `-6'2m'` here as a third string divergence --
that was wrong: ITC prints `-6'2m'` too (scan-verified). It belongs in Sec. 7C. D6h(D3d) `6'/m'mm'` and
the other four D6h black-white members print identically in both conventions.)*

Note on `6'/mm'm`: the app's default frame matched Birss/ITC only from **v0.14.1** onward -- before
PR #52 the app was embedded 30 deg off due to a transcription-pass error; see the session findings
document.

### 7B. **Full-HM** differs, short form matches -- monoclinic unique axis

All monoclinic groups: app **c-unique** (`11X`) vs ITC **b-unique** (`1X1`). Short symbol identical;
orientation (physical unique axis) differs.

| Schoenflies | App key | App full (c) | ITC full (b) |
|---|---|---|---|
| C2 | `2` | `112` | `121` |
| C2(C1) | `2'` | `112'` | `12'1` |
| Cs | `m` | `11m` | `1m1` |
| Cs(C1) | `m'` | `11m'` | `1m'1` |
| C2h | `2/m` | `11 2/m` | `1 2/m 1` |
| C2h(Ci) | `2'/m'` | `11 2'/m'` | `1 2'/m' 1` |
| C2h(C2) | `2/m'` | `11 2/m'` | `1 2/m' 1` |
| C2h(Cs) | `2'/m` | `11 2'/m` | `1 2'/m 1` |

(plus the three grey monoclinic groups `21'`, `m1'`, `2/m1'`, same c-vs-b difference.)

### 7C. **Same symbol, different orientation** (tensor components differ)

Here the printed HM symbol is identical in both conventions, but the app's Birss frame is embedded
30 deg from ITC's, so the **Cartesian components that survive are different** (as in the `-6m2` xxx<->yyy
example). This is the largest and least visible class.

**Rule (verified mechanism):** a group is orientation-divergent iff (i) it has basal-plane lateral
elements whose direction is set by the secondary convention, and (ii) its symmetry does **not**
contain the 30 deg/x<->y operation that would make the two frames equivalent. Condition (ii) holds
exactly when the group's unitary (unprimed) part is **trigonal, not hexagonal** -- i.e. only a 3-fold,
not a 6-fold, relates the basal directions.

**Trigonal (all verified -- strings identical to ITC 1.5.2.3):**

| Schoenflies | App key | HM (both) |
|---|---|---|
| D3 | `32` | `321` |
| D3(C3) | `32'` | `32'1` |
| C3v | `3m` | `3m1` |
| C3v(C3) | `3m'` | `3m'1` |
| D3d | `-3m` | `-3 2/m 1` |
| D3d(S6) | `-3m'` | `-3 2'/m' 1` |
| D3d(D3) | `-3'm'` | `-3' 2/m' 1` |
| D3d(C3v) | `-3'm` | `-3' 2'/m 1` |

*(D3d(D3) = `-3'm'` is the canonical Cr2O3 magneto-electric group; its two independent components sit
on different Cartesian axes than an ITC reader would expect.)*

**Hexagonal with a trigonal unitary subgroup (same symbol, orientation-divergent):**
D3h (`-6m2`), D3h(D3) (`-6'2m'`), D3h(C3v) (`-6'm2'`), D3h(C3h) (`-6m'2'`), D6(D3) (`6'22'`),
C6v(C3v) (`6'mm'`), D6h(D3d) (`6'/m'mm'`).
*(Strings verified identical to ITC; the per-group tensor-level confirmation is complete since
v0.14.1 -- the permanent 58-row Table-7 rank-3 audit test asserts every group's projected tensors
against the print-verified table, brackets included. The grey derivatives of the trigonal groups --
`321'`, `3m1'`, `-3m1'`, `-6m21'` -- carry the same orientation divergence in their i-tensors.)*

**Checked and NOT divergent (corrections to an earlier revision of this document):**
- C2v(Cs) `2'm'm`: the app's operators {1, m_z, 2'_x, m'_y} equal ITC's standard positional reading
  exactly (orthorhombic positions are x, y, z in both conventions). Birss's "rotated setting"
  label is internal to his derivation (relative to the parent frame), not an ITC divergence.
  *Footnote (verified 2026-07-04): ITC's two tables print different **primary** settings for this
  one group. Table 1.5.2.3 (magnetic point groups) lists `2'm'm` -- the app key, operators
  {1, m_z, 2'_x, m'_y}. Table 1.5.7.1 (piezomagnetic) lists `m'2m [2'm'm]` -- primary `m'2m`, with
  the app key `2'm'm` as the bracketed same-form alternative. Both give the same tensor form; only
  ITC's primary-label choice differs between its tables, so the "not divergent" conclusion is
  unaffected. (This is why the ITC-1.5.7.1 companion data file resolves app keys by Schoenflies,
  not by the pre-bracket symbol.)*
- D6h(C6v) `6/m'mm`: its 6-fold unitary part populates both basal families identically, so the 30 deg
  rotation maps the group onto itself -- no setting ambiguity exists (consistently, the group has no
  alternate-settings entry in the app).

### 7D. Notation only -- no physics

| What | App / Birss | ITC | Note |
|---|---|---|---|
| Schoenflies of the `-3` family | `C3i` | `S6` | Same group (S6 == C3i); HM `-3` identical. |
| Cubic bar | `m-3`, `m-3m`, `m'-3'm'` | same (bar kept) | App matches ITC here; the *barless* forms (`m3`, `m3m`) are Birss Table 6's spelling. |
| Antisymmetric mark | prime `'` | Shubnikov **underline** | e.g. ITC `4:2` (2 underlined) = Birss `4:2'`. |
| Short vs full HM | app shows both | -- | Cosmetic. |

---

## 8. Practical guidance for a reader coming from ITC

1. **Trust the short symbol, question the frame.** For trigonal/hexagonal groups the app's HM string
   usually equals ITC's, but the app's *default orientation* is Birss's (position 2 = y, mirror ||
   a-axis). If you expect the ITC embedding, select the **alternate setting**, or map components with
   the 30 deg rotation (x<->y-type swap of the basal indices).
2. **`-6m2` specifically:** app default `-6m2` = ITC `-62m` orientation (xxx-family). The app's
   `-62m` setting = ITC `-6m2` orientation (yyy-family).
3. **Monoclinic:** app is c-unique. If your reference is b-unique, the distinguished axis is b, not c
   -- swap the roles of the app's z and y when reading component labels.
4. **Watch the two genuine string differences** (Sec. 7A) -- and note they behave oppositely:
   `m'm'm`/`mm'm'` (frames differ -- use the app's alternate setting or permute axes) vs
   `6'/mm'm`/`6'/mmm'` (frames identical -- translate only the label, components match as-is).
5. **Ignore Level-2b spelling** (`C3i`/`S6`, bar, underline) -- it never changes the physics.

---

## 9. Verification status and method

**Anti-circularity.** Every expected value is transcribed from a primary source, never from the
app's own output.

**Sources read directly for this document:**

- **ITC Vol. D, Ch. 1.5, Table 1.5.2.3** ("The 90 magnetic point groups of types 2 and 3"),
  pp. 111-112 -- magnetic-group Schoenflies / Shubnikov / short + full HM / symmetry operators.
  Read from the rendered table pages (the primed and fraction glyphs are unreliable in text
  extraction and were confirmed at 400 dpi).
- **ITC Vol. A, Ch. 3.2, Table 3.2.3.2** -- the `-6m2` / `-62m` coordinate triplets that fix the
  physical mirror orientation (`m_x` vs `m_y`).
- **ITC Vol. A, Sec. 2.2.4** -- the HM symmetry-direction convention (mirror named by its normal).
- **Birss (1966), Table 4a** (`-6m2 = 3//z, -2//y`) and **Table 4e** (rank-3 forms, row R3,
  print-verified) via the in-repo `birss-tables/`.

**Cross-checks:** group closure of {-6_z, m_y} vs {-6_z, m_x} reproduces the xxx- vs yyy-family split;
independent literature (Cr2O3 under `-3'm'`, Fiebig *et al.* 2005) confirms the two-component
D3d(D3) form.

**Previously open items -- resolved (2026-07-04, v0.14.1):**

- **The "47".** Clarified: 47 is the number of `ALTERNATE_SETTINGS` entries in the app (groups with
  a setting selector, guarded by a coverage test since PR #51) -- a *different* set from the
  ITC-divergent groups. The two overlap but neither contains the other: e.g. the tetragonal
  45 deg-setting groups (`4'mm'`, `-42m`, ...) are among the 47 but are **not** Birss<->ITC divergent
  (Birss's position 2 = y lies inside ITC's secondary direction set for tetragonal), while the
  string-only case `6'/mm'm` is divergent without any frame difference.
- **Per-group tensor confirmation.** Complete: the permanent 58-row Table-7 rank-3 audit test
  (introduced in PR #52, v0.14.1) verifies every black-white group's four rank-3 tensor projections
  against the print-verified `table-7.md`, including Birss's parenthesis (rotated-axes) semantics.
  In the course of building it, one app error (`6'/mm'm`, fixed) and two printing errors in Birss's
  own Table 7 (bracket omissions at the `(-6'2m')` and `-6m'2'` rows, both scan-proven) were found --
  see the session findings document for the full evidence chains.
- **Tetragonal and cubic** carry **no** orientation divergence (the 4-fold makes x == y; cubic bar is
  notation only), so they are absent from Sec. 7C by design.

---

## 10. References

- **Birss, R. R. (1966).** *Symmetry and Magnetism.* North-Holland, Amsterdam. -- Authoritative source
  for the app's magnetic point groups and tensor forms. Transcribed reference tables (Tables 3, 4a-4f,
  6, 7, nomenclature): **https://github.com/manganite/birss-tables** (also vendored in-app under
  `birss-tables/`).
- **International Tables for Crystallography, Vol. A (2016), Ch. 3.2** -- Hahn, Klapper, Mueller &
  Aroyo, *Point groups and crystal classes*, pp. 720-776. Table 3.2.3.2 (coordinate triplets, special
  projections); Sec. 2.2.4 (HM symmetry directions).
- **International Tables for Crystallography, Vol. D (2013/2003), Ch. 1.5** -- Borovik-Romanov, Grimmer
  & Kenzelmann, *Magnetic properties*, pp. 106-152. Table 1.5.2.3 (the 90 magnetic point groups),
  Tables 1.5.2.1-1.5.2.4.
- **Fiebig, M. *et al.* (2005).** Second-harmonic generation as a tool for studying electronic and
  magnetic structures of crystals. *J. Opt. Soc. Am. B* **22**, 96. -- Independent tensor anchor for
  Cr2O3 (`-3'm'`).
- **Session findings record:** `SESSION-FINDINGS-2026-07-04-6pmmpm-and-table7.md` -- evidence
  chains for the `6'/mm'm` correction, the Table-7 bracket semantics (including Birss's own
  bracket-explanation passage and the application tables 9/10), the 58-row audit, and the five
  first-hand-verified Birss book errors.
- **App convention contract:** `docs/references/BIRSS-APP-CONVENTIONS-REFERENCE.md` and
  `birss-tables/table-nomenclature.md` (the two current, authoritative in-repo references). Note: the
  older `docs/findings/DISCREPANCIES.md` and `birss-tables/birss-itc-comparison.md` predate the
  current convention lock-in and contain a superseded "no swap" reading of `-6m2`; they should not be
  relied on for the trigonal/hexagonal orientation question.

---

## Changelog

- **2026-07-04 (Revision 2b):** Added a C2v(Cs) footnote in Sec. 7C recording that ITC Table
  1.5.2.3 (`2'm'm`) and Table 1.5.7.1 (`m'2m [2'm'm]`) use different primary settings for this group
  (same tensor form) -- both symbols scan/text-verified; surfaced during the ITC-1.5.7.1
  piezomagnetic anchor work. Also normalized the whole file to pure ASCII (subscripts, arrows,
  box-drawing, Greek) to make it immune to encoding round-trips on Windows/WSL transfer.
- **2026-07-04 (Revision 2, after v0.14.1 / PR #52):** Corrected Sec. 7A -- removed the erroneous
  `-6'2m'` string-divergence row (ITC prints `-6'2m'`; moved to Sec. 7C) and reclassified
  `6'/mm'm`/`6'/mmm'` as *same frame, different string* (position-convention artefact; the app
  matches this frame from v0.14.1). Corrected Sec. 7C -- added D3h(D3), removed `2'm'm` and `6/m'mm`
  (both verified non-divergent), upgraded the verification status to the permanent 58-row Table-7
  audit, added the grey-derivative note. Updated Sec. 8 guidance and Sec. 9: the "~47" resolved as the
  alternate-settings count; per-group tensor confirmation complete. Added findings-record
  reference.
- **2026-07-03/04 (Revision 1):** Initial version, written before the Table-7 bracket
  investigation; contained the three errors corrected above.
