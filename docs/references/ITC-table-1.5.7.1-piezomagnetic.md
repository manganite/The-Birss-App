# ITC Table 1.5.7.1 -- Piezomagnetic tensor forms (independent MD-c anchor)

> **Content:** Transcription of ITC Table 1.5.7.1, with the app-side notes needed to read it.
> **Status:** living (transcription)
> **Authority:** source-side material: a transcription of the printed ITC table, vendored so the reference tests can re-parse it. Change it only to correct the transcription against print.

**SOURCE: International Tables for Crystallography, Vol. D, Sec. 1.5.7.1, Table 1.5.7.1 (p. 135).
This is ITC data, NOT Birss.** Used as an independent second source for the app's **MD-c**
tensor class (axial rank-3, jk-symmetric, time-odd = the piezomagnetic tensor Lambda_ijk).

**Status: VERIFIED** (maintainer print-check, 2026-07-04). Structure transcribed from the project
PDF text layer; every sign glyph (overbar = minus) and x2 factor was then image-verified against
maintainer scans of the matrix column (blocks 6, 7, 11-15 -- all confirmed, zero deviations). The
monoclinic z-unique matrices (1)/(2) were read from the Sec. 1.5.7.1 running text (p. 134). The Phase-1
reference audit (`itcPiezomagnetic.reference.test.ts`) provides an additional independent cross-check
against the app's Birss-based MD-c projection. The **Schoenflies** symbol is the reliable group key.

**Notation.**
- Voigt Lambda matrix, 3 rows (i = 1,2,3 -> magnetisation M_x, M_y, M_z) x 6 columns
  (alpha = 1..6 -> stress T_xx, T_yy, T_zz, T_yz, T_zx, T_xy). Entry Lambda_ialpha.
- `L<ij>` = the free parameter Lambda_ij (value at row i, Voigt col j). Repeated symbols denote
  equal-by-symmetry entries; `-L11`, `2L22`, `-2L11` denote the signed/scaled relations exactly as
  ITC prints them.
- Each block lists all Schoenflies groups that share the matrix (ITC groups form-identical classes).
- `[...]` after an HM symbol = ITC's *same-form alternative setting* bracket (opposite meaning to
  Birss's rotated-axes parentheses -- see `BIRSS-ITC-CONVENTION-DIVERGENCES.md`).
- Monoclinic is printed **b-unique** ("unique axis y"); ITC's z-unique forms live in the running
  text as matrices (1)/(2) -- see the note after Block 3.

---

## Block 1 -- triclinic (general)
Groups: C1 (`1`); Ci (`-1`)
```
L11 L12 L13 L14 L15 L16
L21 L22 L23 L24 L25 L26
L31 L32 L33 L34 L35 L36
```

## Block 2 -- monoclinic, unitary-2
**ITC main table -- unique axis y (b-unique) = app SETTING 2.** Groups: C2 (`2` = `121`);
Cs (`m` = `1m1`); C2h (`2/m` = `1 2/m 1`)
```
0   0   0   L14 0   L16
L21 L22 L23 0   L25 0
0   0   0   L34 0   L36
```
**z-unique (c-unique) = app SETTING 1 (default)** -- ITC matrix (1), Sec. 1.5.7.1 running text p. 134,
for `112`, `11m`, `11 2/m`:
```
0   0   0   L14 L15 0
0   0   0   L24 L25 0
L31 L32 L33 0   0   L36
```

## Block 3 -- monoclinic, primed-2
**ITC main table -- unique axis y (b-unique) = app SETTING 2.** Groups: C2(C1) (`2'` = `12'1`);
Cs(C1) (`m'` = `1m'1`); C2h(Ci) (`2'/m'` = `1 2'/m' 1`)
```
L11 L12 L13 0   L15 0
0   0   0   L24 0   L26
L31 L32 L33 0   L35 0
```
**z-unique (c-unique) = app SETTING 1 (default)** -- ITC matrix (2), Sec. 1.5.7.1 running text p. 134,
for `112'`, `11m'`, `11 2'/m'`:
```
L11 L12 L13 0   0   L16
L21 L22 L23 0   0   L26
0   0   0   L34 L35 0
```

## Block 4 -- orthorhombic, all-unitary
Groups: D2 (`222`); C2v (`mm2 [2mm; m2m]`); D2h (`mmm`)
```
0 0 0 L14 0   0
0 0 0 0   L25 0
0 0 0 0   0   L36
```

## Block 5 -- orthorhombic, black-white
Groups: D2(C2) (`2'2'2`); C2v(C2) (`m'm'2`); C2v(Cs) (`m'2m [2'm'm]`); D2h(C2h) (`m'm'm`)
```
0   0   0   0   L15 0
0   0   0   L24 0   0
L31 L32 L33 0   0   0
```
> Note on C2v(Cs): unlike this file's other bracketed entries (where the app key precedes the
> bracket, e.g. `-42m [-4m2]`), here **`m'2m` is ITC's own primary-listed form and does not exist
> in the app's `GENERATORS`; `2'm'm` (in brackets) is both ITC's same-form alternative and the
> app's actual key** -- confirmed against the ITC p. 135 scan (maintainer, 2026-07-04). Bracket
> order is left exactly as ITC prints it (not normalised) so this file stays a faithful
> transcription; the reference test resolves the app key by `GENERATORS` membership, not by
> position relative to the bracket.

## Block 6 -- tetragonal/hexagonal 4-/6-fold, all-unitary
Groups: C4, C6 (`4`, `6`); S4, C3h (`-4`, `-6`); C4h, C6h (`4/m`, `6/m`)
```
0   0   0   L14 L15  0
0   0   0   L15 -L14 0
L31 L31 L33 0   0    0
```

## Block 7 -- tetragonal primed 4-fold
Groups: C4(C2) (`4'`); S4(C2) (`-4'`); C4h(C2h) (`4'/m`)
```
0   0    0   L14  L15 0
0   0    0   -L15 L14 0
L31 -L31 0   0    0   L36
```

## Block 8 -- tetragonal/hexagonal D-type, all-unitary
Groups: D4, D6 (`422`, `622`); C4v, C6v (`4mm`, `6mm`); D2d, D3h (`-42m [-4m2]`, `-6m2 [-62m]`);
D4h, D6h (`4/mmm`, `6/mmm`)
```
0 0 0 L14 0    0
0 0 0 0   -L14 0
0 0 0 0   0    0
```

## Block 9 -- tetragonal/hexagonal D-type, primed lateral
Groups: D4(C4), D6(C6) (`42'2'`, `62'2'`); C4v(C4), C6v(C6) (`4m'm'`, `6m'm'`);
D2d(S4), D3h(C3h) (`-42'm' [-4m'2']`, `-6m'2' [-62m']`); D4h(C4h), D6h(C6h) (`4/mm'm'`, `6/mm'm'`)
```
0   0   0   0   L15 0
0   0   0   L15 0   0
L31 L31 L33 0   0   0
```

## Block 10 -- tetragonal primed 4-fold, D-type
Groups: D4(D2) (`4'22'`); C4v(C2v) (`4'mm'`); D2d(D2), D2d(C2v) (`-4'2m'`, `-4'm2'`);
D4h(D2h) (`4'/mmm'`)
```
0 0 0 L14 0   0
0 0 0 0   L14 0
0 0 0 0   0   L36
```

## Block 11 -- trigonal C3/S6
Groups: C3 (`3`); S6 (`-3`)
```
L11  -L11 0   L14 L15  -2L22
-L22 L22  0   L15 -L14 -2L11
L31  L31  L33 0   0    0
```

## Block 12 -- trigonal D3/C3v/D3d (all-unitary)
Groups: D3 (`32` = `321`); C3v (`3m` = `3m1`); D3d (`-3m` = `-3m1`)
```
L11 -L11 0   L14 0    0
0   0    0   0   -L14 -2L11
0   0    0   0   0    0
```

## Block 13 -- trigonal D3/C3v/D3d, primed lateral
Groups: D3(C3) (`32'` = `32'1`); C3v(C3) (`3m'` = `3m'1`); D3d(S6) (`-3m'` = `-3m'1`)
```
0    0   0   0   L15 -2L22
-L22 L22 0   L15 0   0
L31  L31 L33 0   0   0
```

## Block 14 -- hexagonal primed 6-fold, C-type
Groups: C6(C3) (`6'`); C3h(C3) (`-6'`); C6h(S6) (`6'/m'`)
```
L11  -L11 0 0 0 -2L22
-L22 L22  0 0 0 -2L11
0    0    0 0 0 0
```

## Block 15 -- hexagonal primed 6-fold, D-type [the "(R_n)" groups]
Groups: D6(D3) (`6'22'`); C6v(C3v) (`6'mm'`); D3h(D3) (`-6'2m'`), D3h(C3v) (`-6'm2'`);
D6h(D3d) (`6'/m'mm'`)
```
L11 -L11 0 0 0 0
0   0    0 0 0 -2L11
0   0    0 0 0 0
```
> Note: this xxx-family form is in ITC's frame (position-2 = a-axis). The app's Birss default is
> the 30 deg-rotated yyy-family; the Phase-1 audit is expected to match these five groups in the app's
> **alternate** setting -- the independent confirmation of Sec.3.7 of the session findings.

## Block 16 -- cubic
Groups: T, Th (`23`, `m-3`); O(T) (`4'32'`); Td(T) (`-4'3m'`); Oh(Th) (`m-3m'`)
```
0 0 0 L14 0   0
0 0 0 0   L14 0
0 0 0 0   0   L14
```

---

## Changelog

- **2026-07-04** (later same day): Removed the `(?)` uncertainty marker from Block 16's Oh(Th)
  entry (`m-3m'`). The Phase-1 reference audit computes the app's MD-c projection for `m-3m'`
  (no `ALTERNATE_SETTINGS` entry, setting 1 only) and it matches this block's `L14` family
  cleanly with zero deviation, resolving the transcription doubt empirically.
- **2026-07-04** (later same day): Added a note to Block 5's C2v(Cs) entry clarifying that
  `m'2m [2'm'm]` is not a bracket-order slip: ITC's own primary-listed form (`m'2m`) is not an
  app key, while the bracketed same-form alternative (`2'm'm`) is -- confirmed against the ITC
  p. 135 scan. Bracket order left as printed; the reference test resolves app keys by
  `GENERATORS` membership rather than position relative to the bracket.
- **2026-07-04** (later same day): **Upgraded VERIFY -> VERIFIED.** All sign glyphs and x2 factors
  image-verified against maintainer scans of the p. 135 matrix column (blocks 6, 7, 11-15 -- zero
  deviations from the text-layer transcription). Added the monoclinic z-unique matrices (1)/(2)
  (app setting-1 default) from the Sec. 1.5.7.1 running text p. 134 to blocks 2 and 3. No outstanding
  transcription items.
- **2026-07-04**: Initial transcription of ITC Vol. D Table 1.5.7.1 (p. 135) from the project-PDF
  text layer (Status VERIFY at that point).
