# Allowed ED SHG tensor components (i and c) per magnetic point group

> **Content:** Reference listing of the allowed ED SHG components (i and c) for every magnetic point group.
> **Status:** frozen
> **Authority:** historical record. Generated from a past app state; the engine and its print-anchored tests are authoritative.

For every magnetic point group that permits a **non-zero electric-dipole (ED) second-harmonic** response of either time-reversal parity, this table lists the independent, symmetry-allowed components of the **i-tensor** (time-even) and **c-tensor** (time-odd). Groups whose ED response vanishes for *both* parities are omitted.

**Convention.** ED is a polar rank-3 tensor, intrinsically symmetric in its last two indices (χ_ijk = χ_ikj); each component listed stands for its jk-partner too (e.g. `xxz` ⇒ χ_xxz = χ_xzx). Independent components are comma-separated; `=` / `= -` give the symmetry-forced relations. `0` = that parity is entirely forbidden.

**Provenance.** For each group the app's closed operator set (matrices + antiunitary flags, via `getCachedFullGroup`) was exported; the i-/c-forms below were then computed by an **independent** NumPy projection over those operators — *not* the app's own tensor-projection engine.

**Verification.** (1) The operator sets equal Birss Table 6 for all 122 groups (three-way, book-scan audit). (2) Because a projection over the correct operators is the same first-principles operation from which Table 4e was built, a hand derivation from Table 4e yields the identical content (modulo the presentation choices above) — *provided the projection code is correct*. (3) That projection code was spot-checked against Table 4e / literature on a sample: `-3'm'` (Cr₂O₃) reproduces the Fiebig et al. (JOSA B 22, 96, 2005) L3 form (yyy- and xyz-families, no χ_zzz); `mm2`, `-43m`, `23`, `-4'm2'` match their standard/audited forms. A full row-by-row diff of the app's own `calculateTensorComponents` against this table's projection was run for all 122 groups x {i, c} (244 cells, canonicalised for jk-symmetry, scale and sign convention): **0 mismatches**. Chain closed: table == app (this diff) and app == Table 4e (audit: per-class golden fixtures + print-verified 4e) => table == Birss.

| System | Schoenflies | Group | Type | i-tensor (time-even) | c-tensor (time-odd) |
|---|---|---|---|---|---|
| Triclinic | C1 | `1` | colourless | xxx, xxy, xxz, xyy, xyz, xzz, yxx, yxy, yxz, yyy, yyz, yzz, zxx, zxy, zxz, zyy, zyz, zzz | xxx, xxy, xxz, xyy, xyz, xzz, yxx, yxy, yxz, yyy, yyz, yzz, zxx, zxy, zxz, zyy, zyz, zzz |
| Monoclinic | C2 | `2` | colourless | xxz, xyz, yxz, yyz, zxx, zxy, zyy, zzz | xxz, xyz, yxz, yyz, zxx, zxy, zyy, zzz |
| Trigonal | C3 | `3` | colourless | xxx = -xyy = -yxy, xxy = yxx = -yyy, xxz = yyz, xyz = -yxz, zxx = zyy, zzz | xxx = -xyy = -yxy, xxy = yxx = -yyy, xxz = yyz, xyz = -yxz, zxx = zyy, zzz |
| Tetragonal | C4 | `4` | colourless | xxz = yyz, xyz = -yxz, zxx = zyy, zzz | xxz = yyz, xyz = -yxz, zxx = zyy, zzz |
| Hexagonal | C6 | `6` | colourless | xxz = yyz, xyz = -yxz, zxx = zyy, zzz | xxz = yyz, xyz = -yxz, zxx = zyy, zzz |
| Cubic | T | `23` | colourless | xyz = yxz = zxy | xyz = yxz = zxy |
| Trigonal | D3 | `32` | colourless | xxy = yxx = -yyy, xyz = -yxz | xxy = yxx = -yyy, xyz = -yxz |
| Orthorhombic | D2 | `222` | colourless | xyz, yxz, zxy | xyz, yxz, zxy |
| Tetragonal | D4 | `422` | colourless | xyz = -yxz | xyz = -yxz |
| Hexagonal | D6 | `622` | colourless | xyz = -yxz | xyz = -yxz |
| Monoclinic | Cs | `m` | colourless | xxx, xxy, xyy, xzz, yxx, yxy, yyy, yzz, zxz, zyz | xxx, xxy, xyy, xzz, yxx, yxy, yyy, yzz, zxz, zyz |
| Orthorhombic | C2v | `mm2` | colourless | xxz, yyz, zxx, zyy, zzz | xxz, yyz, zxx, zyy, zzz |
| Tetragonal | S4 | `-4` | colourless | xxz = -yyz, xyz = yxz, zxx = -zyy, zxy | xxz = -yyz, xyz = yxz, zxx = -zyy, zxy |
| Tetragonal | C4v | `4mm` | colourless | xxz = yyz, zxx = zyy, zzz | xxz = yyz, zxx = zyy, zzz |
| Tetragonal | D2d | `-42m` | colourless | xyz = yxz, zxy | xyz = yxz, zxy |
| Trigonal | C3v | `3m` | colourless | xxx = -xyy = -yxy, xxz = yyz, zxx = zyy, zzz | xxx = -xyy = -yxy, xxz = yyz, zxx = zyy, zzz |
| Hexagonal | C3h | `-6` | colourless | xxx = -xyy = -yxy, xxy = yxx = -yyy | xxx = -xyy = -yxy, xxy = yxx = -yyy |
| Hexagonal | C6v | `6mm` | colourless | xxz = yyz, zxx = zyy, zzz | xxz = yyz, zxx = zyy, zzz |
| Hexagonal | D3h | `-6m2` | colourless | xxx = -xyy = -yxy | xxx = -xyy = -yxy |
| Cubic | Td | `-43m` | colourless | xyz = yxz = zxy | xyz = yxz = zxy |
| Triclinic | C1R | `11'` | grey (II) | xxx, xxy, xxz, xyy, xyz, xzz, yxx, yxy, yxz, yyy, yyz, yzz, zxx, zxy, zxz, zyy, zyz, zzz | 0 |
| Monoclinic | C2R | `21'` | grey (II) | xxz, xyz, yxz, yyz, zxx, zxy, zyy, zzz | 0 |
| Monoclinic | CsR | `m1'` | grey (II) | xxx, xxy, xyy, xzz, yxx, yxy, yyy, yzz, zxz, zyz | 0 |
| Orthorhombic | D2R | `2221'` | grey (II) | xyz, yxz, zxy | 0 |
| Orthorhombic | C2vR | `mm21'` | grey (II) | xxz, yyz, zxx, zyy, zzz | 0 |
| Tetragonal | C4R | `41'` | grey (II) | xxz = yyz, xyz = -yxz, zxx = zyy, zzz | 0 |
| Tetragonal | S4R | `-41'` | grey (II) | xxz = -yyz, xyz = yxz, zxx = -zyy, zxy | 0 |
| Tetragonal | D4R | `4221'` | grey (II) | xyz = -yxz | 0 |
| Tetragonal | C4vR | `4mm1'` | grey (II) | xxz = yyz, zxx = zyy, zzz | 0 |
| Tetragonal | D2dR | `-42m1'` | grey (II) | xyz = yxz, zxy | 0 |
| Trigonal | C3R | `31'` | grey (II) | xxx = -xyy = -yxy, xxy = yxx = -yyy, xxz = yyz, xyz = -yxz, zxx = zyy, zzz | 0 |
| Trigonal | D3R | `321'` | grey (II) | xxy = yxx = -yyy, xyz = -yxz | 0 |
| Trigonal | C3vR | `3m1'` | grey (II) | xxx = -xyy = -yxy, xxz = yyz, zxx = zyy, zzz | 0 |
| Hexagonal | C6R | `61'` | grey (II) | xxz = yyz, xyz = -yxz, zxx = zyy, zzz | 0 |
| Hexagonal | C3hR | `-61'` | grey (II) | xxx = -xyy = -yxy, xxy = yxx = -yyy | 0 |
| Hexagonal | D6R | `6221'` | grey (II) | xyz = -yxz | 0 |
| Hexagonal | C6vR | `6mm1'` | grey (II) | xxz = yyz, zxx = zyy, zzz | 0 |
| Hexagonal | D3hR | `-6m21'` | grey (II) | xxx = -xyy = -yxy | 0 |
| Cubic | TR | `231'` | grey (II) | xyz = yxz = zxy | 0 |
| Cubic | TdR | `-43m1'` | grey (II) | xyz = yxz = zxy | 0 |
| Triclinic | Ci(C1) | `-1'` | black-white | 0 | xxx, xxy, xxz, xyy, xyz, xzz, yxx, yxy, yxz, yyy, yyz, yzz, zxx, zxy, zxz, zyy, zyz, zzz |
| Monoclinic | C2(C1) | `2'` | black-white | xxz, xyz, yxz, yyz, zxx, zxy, zyy, zzz | xxx, xxy, xyy, xzz, yxx, yxy, yyy, yzz, zxz, zyz |
| Monoclinic | Cs(C1) | `m'` | black-white | xxx, xxy, xyy, xzz, yxx, yxy, yyy, yzz, zxz, zyz | xxz, xyz, yxz, yyz, zxx, zxy, zyy, zzz |
| Monoclinic | C2h(C2) | `2/m'` | black-white | 0 | xxz, xyz, yxz, yyz, zxx, zxy, zyy, zzz |
| Monoclinic | C2h(Cs) | `2'/m` | black-white | 0 | xxx, xxy, xyy, xzz, yxx, yxy, yyy, yzz, zxz, zyz |
| Orthorhombic | D2(C2) | `2'2'2` | black-white | xyz, yxz, zxy | xxz, yyz, zxx, zyy, zzz |
| Orthorhombic | C2v(C2) | `m'm'2` | black-white | xxz, yyz, zxx, zyy, zzz | xyz, yxz, zxy |
| Orthorhombic | C2v(Cs) | `2'm'm` | black-white | xxx, xyy, xzz, yxy, zxz | xxy, yxx, yyy, yzz, zyz |
| Orthorhombic | D2h(D2) | `m'm'm'` | black-white | 0 | xyz, yxz, zxy |
| Orthorhombic | D2h(C2v) | `mmm'` | black-white | 0 | xxz, yyz, zxx, zyy, zzz |
| Tetragonal | C4(C2) | `4'` | black-white | xxz = yyz, xyz = -yxz, zxx = zyy, zzz | xxz = -yyz, xyz = yxz, zxx = -zyy, zxy |
| Tetragonal | S4(C2) | `-4'` | black-white | xxz = -yyz, xyz = yxz, zxx = -zyy, zxy | xxz = yyz, xyz = -yxz, zxx = zyy, zzz |
| Tetragonal | C4h(S4) | `4'/m'` | black-white | 0 | xxz = -yyz, xyz = yxz, zxx = -zyy, zxy |
| Tetragonal | C4h(C4) | `4/m'` | black-white | 0 | xxz = yyz, xyz = -yxz, zxx = zyy, zzz |
| Tetragonal | D4(D2) | `4'22'` | black-white | xyz = -yxz | xyz = yxz, zxy |
| Tetragonal | D4(C4) | `42'2'` | black-white | xyz = -yxz | xxz = yyz, zxx = zyy, zzz |
| Tetragonal | C4v(C2v) | `4'mm'` | black-white | xxz = yyz, zxx = zyy, zzz | xxz = -yyz, zxx = -zyy |
| Tetragonal | C4v(C4) | `4m'm'` | black-white | xxz = yyz, zxx = zyy, zzz | xyz = -yxz |
| Tetragonal | D2d(D2) | `-4'2m'` | black-white | xyz = yxz, zxy | xyz = -yxz |
| Tetragonal | D2d(C2v) | `-4'm2'` | black-white | xxz = -yyz, zxx = -zyy | xxz = yyz, zxx = zyy, zzz |
| Tetragonal | D2d(S4) | `-42'm'` | black-white | xyz = yxz, zxy | xxz = -yyz, zxx = -zyy |
| Tetragonal | D4h(D4) | `4/m'm'm'` | black-white | 0 | xyz = -yxz |
| Tetragonal | D4h(C4v) | `4/m'mm` | black-white | 0 | xxz = yyz, zxx = zyy, zzz |
| Tetragonal | D4h(D2d) | `4'/m'm'm` | black-white | 0 | xyz = yxz, zxy |
| Trigonal | C3i(C3) | `-3'` | black-white | 0 | xxx = -xyy = -yxy, xxy = yxx = -yyy, xxz = yyz, xyz = -yxz, zxx = zyy, zzz |
| Trigonal | D3(C3) | `32'` | black-white | xxy = yxx = -yyy, xyz = -yxz | xxx = -xyy = -yxy, xxz = yyz, zxx = zyy, zzz |
| Trigonal | C3v(C3) | `3m'` | black-white | xxx = -xyy = -yxy, xxz = yyz, zxx = zyy, zzz | xxy = yxx = -yyy, xyz = -yxz |
| Trigonal | D3d(D3) | `-3'm'` | black-white | 0 | xxy = yxx = -yyy, xyz = -yxz |
| Trigonal | D3d(C3v) | `-3'm` | black-white | 0 | xxx = -xyy = -yxy, xxz = yyz, zxx = zyy, zzz |
| Hexagonal | C6(C3) | `6'` | black-white | xxz = yyz, xyz = -yxz, zxx = zyy, zzz | xxx = -xyy = -yxy, xxy = yxx = -yyy |
| Hexagonal | C3h(C3) | `-6'` | black-white | xxx = -xyy = -yxy, xxy = yxx = -yyy | xxz = yyz, xyz = -yxz, zxx = zyy, zzz |
| Hexagonal | C6h(C6) | `6/m'` | black-white | 0 | xxz = yyz, xyz = -yxz, zxx = zyy, zzz |
| Hexagonal | C6h(C3h) | `6'/m` | black-white | 0 | xxx = -xyy = -yxy, xxy = yxx = -yyy |
| Hexagonal | D6(D3) | `6'22'` | black-white | xyz = -yxz | xxy = yxx = -yyy |
| Hexagonal | D6(C6) | `62'2'` | black-white | xyz = -yxz | xxz = yyz, zxx = zyy, zzz |
| Hexagonal | C6v(C3v) | `6'mm'` | black-white | xxz = yyz, zxx = zyy, zzz | xxx = -xyy = -yxy |
| Hexagonal | C6v(C6) | `6m'm'` | black-white | xxz = yyz, zxx = zyy, zzz | xyz = -yxz |
| Hexagonal | D3h(D3) | `-6'2m'` | black-white | xxy = yxx = -yyy | xyz = -yxz |
| Hexagonal | D3h(C3v) | `-6'm2'` | black-white | xxx = -xyy = -yxy | xxz = yyz, zxx = zyy, zzz |
| Hexagonal | D3h(C3h) | `-6m'2'` | black-white | xxx = -xyy = -yxy | xxy = yxx = -yyy |
| Hexagonal | D6h(D6) | `6/m'm'm'` | black-white | 0 | xyz = -yxz |
| Hexagonal | D6h(C6v) | `6/m'mm` | black-white | 0 | xxz = yyz, zxx = zyy, zzz |
| Hexagonal | D6h(D3h) | `6'/mm'm` | black-white | 0 | xxy = yxx = -yyy |
| Cubic | Th(T) | `m'-3'` | black-white | 0 | xyz = yxz = zxy |
| Cubic | O(T) | `4'32'` | black-white | 0 | xyz = yxz = zxy |
| Cubic | Td(T) | `-4'3m'` | black-white | xyz = yxz = zxy | 0 |
| Cubic | Oh(Td) | `m'-3'm` | black-white | 0 | xyz = yxz = zxy |

**87 groups** allow an i- and/or c-ED response; **35** are omitted (ED forbidden for both parities — the groups with a unitary inversion, plus the 432/O-type classes that forbid polar rank-3 outright).

## Changelog

- **2026-07-04** (v0.14.1, PR #52): Regenerated on v0.14.1 after the `6'/mm'm` frame correction.
  Exactly one cell changed: `6'/mm'm` c-tensor, `xxx = -xyy = -yxy` → `xxy = yxx = -yyy`
  (the app's earlier default frame was rotated 30° from Birss; corrected per Birss Table 7,
  row `6'/mm'm`: A = (-62m), c-polar-odd = (R_n) — see `SESSION-FINDINGS-2026-07-04` and the
  table-6.md pass-5 note reversal). Regeneration method identical in spirit to the original
  (independent projection over the app's closed operator sets, jk-symmetrised, not the app's
  tensor engine); all 244 cells recomputed and diffed against the previous version: 243
  byte-identical, 1 changed as stated; all 35 omitted groups verified still ED-forbidden for
  both parities. The remainder of the table is thereby re-confirmed on v0.14.1, now additionally
  guarded by the 58-row Table-7 rank-3 audit test introduced in PR #52.
- **2026-07-03**: Initial version (v0.14.0), generated from the app's operator sets with
  independent NumPy projection; 244-cell diff against `calculateTensorComponents`: 0 mismatches.
