# Table 3 (Transcribed)

Source: scanned PDF pages 28-29 in `Birss Symmetry & Magnetism komplett.pdf`  
(printed book pages 36-39; the table is printed rotated by 90 degrees and spans two scanned pages)

Notation:
- Minus signs in the symbols denote barred symmetry elements (roto-inversions), as in the book's
  original notation, e.g. `-3_z`, `-4_z`, `-6_z`, `-2_z` (= mirror perpendicular to z), `-1` (= inversion).
- `±` denotes a "plus or minus" pair of symmetry operations and is preferred over the book's `+/-`
  notation (see `conventions-reference.md`). `±n_z` = the pair of proper n-fold rotations about z
  (e.g. `±3_z` = the two non-identity rotations of a 3-fold axis); `±-n_z` = the pair of n-fold
  roto-inversions about z (e.g. `±-4_z`, `±-6_z`, `±-3_z`).
- The generating matrices are written as `σ(N)`, referring to a shared pool of named
  matrices defined in `conventions-reference.md` (the book's "sigma" notation, σ^(N));
  this is the same `σ(N)`/`σ'(N)` notation used in Table 6.
- The symbol ⊥ in the symmetry operations (e.g. `3(2⊥)`) denotes 2-fold axes/mirrors perpendicular to
  the principal axis, used for the trigonal and hexagonal classes which have a single principal axis.
  In the original book a perpendicular sign is used; here it is replaced by ⊥ for clarity.
- `n(m)` (or `n(±m)`, `n(±-m)`) groups n equivalent m-type operations; for the cubic classes (no single
  principal axis) this grouping notation is used without `⊥`, e.g. `3(2)`, `9(2)`, `4(±3)`, `3(±4)`,
  `3(±-4)`.
- Diagonal 2-fold axes/mirrors in the tetragonal classes are written `2_xy` and `2_-xy` (and
  `-2_xy`/`-2_-xy` for the corresponding mirrors), denoting the two axes along the in-plane diagonals
  perpendicular to each other (e.g. [110] and [1-10]-type directions).

## How this table connects to the others

This table is the base list of the 32 classical (non-magnetic) crystallographic point
groups and is referenced by the other tables:
- **Table 6** extends this table to the 122 magnetic point groups, reusing the same
  `σ(N)`/`σ'(N)` generating-matrix notation and the symmetry-operation conventions
  (`±`, `⊥`, `n(m)`, diagonal-axis labels) defined here.
- **Table 4a** uses these same 32 point-group symbols as its row keys, assigning each
  one a set of tensor-symbol classes used by Tables 4b-4f.
- **`conventions-reference.md`** uses the generating matrices `σ(N)` from this table's
  last column as the input to the systematic tensor-form-derivation procedure (§5),
  whose pre-computed results are Tables 4b-4f.

| System | Intl. abbreviated | Full | Schoenflies | Shubnikov | Symmetry operations | Number | Generating matrices |
|---|---|---|---|---|---|---:|---|
| Triclinic | 1 | 1 | C<sub>1</sub> | 1 | 1 | 1 | σ(0) |
| Triclinic | -1 | -1 | C<sub>i</sub>(S<sub>2</sub>) | -2 | 1, -1 | 2 | σ(1) |
| Monoclinic | 2 | 2 | C<sub>2</sub> | 2 | 1, 2_z | 2 | σ(3) |
| Monoclinic | m | m | C<sub>s</sub>(C<sub>1h</sub>) | m | 1, -2_z | 2 | σ(5) |
| Monoclinic | 2/m | 2/m | C<sub>2h</sub> | 2:m | 1, -1, 2_z, -2_z | 4 | σ(1), σ(3) |
| Orthorhombic | 222 | 222 | D<sub>2</sub>(V) | 2:2 | 1, 2_x, 2_y, 2_z | 4 | σ(2), σ(3) |
| Orthorhombic | mm2 | mm2 | C<sub>2v</sub> | 2.m | 1, 2_z, -2_x, -2_y | 4 | σ(3), σ(4) |
| Orthorhombic | mmm | mmm | D<sub>2h</sub>(V<sub>h</sub>) | m.2:m | 1, -1, 2_x, 2_y, 2_z, -2_x, -2_y, -2_z | 8 | σ(1), σ(2), σ(3) |
| Tetragonal | 4 | 4 | C<sub>4</sub> | 4 | 1, 2_z, ±4_z | 4 | σ(7) |
| Tetragonal | -4 | -4 | S<sub>4</sub> | -4 | 1, 2_z, ±-4_z | 4 | σ(8) |
| Tetragonal | 4/m | 4/m | C<sub>4h</sub> | 4:m | 1, -1, 2_z, -2_z, ±4_z, ±-4_z | 8 | σ(1), σ(7) |
| Tetragonal | 422 | 422 | D<sub>4</sub> | 4:2 | 1, 2_x, 2_y, 2_z, 2_xy, 2_-xy, ±4_z | 8 | σ(2), σ(7) |
| Tetragonal | 4mm | 4mm | C<sub>4v</sub> | 4.m | 1, 2_z, -2_x, -2_y, -2_xy, -2_-xy, ±4_z | 8 | σ(4), σ(7) |
| Tetragonal | -42m | -42m | D<sub>2d</sub>(V<sub>d</sub>) | -4.m | 1, 2_x, 2_y, 2_z, -2_xy, -2_-xy, ±-4_z | 8 | σ(2), σ(8) |
| Tetragonal | 4/mmm | 4/mmm | D<sub>4h</sub> | m.4:m | 1, -1, 2_x, 2_y, 2_z, 2_xy, 2_-xy, -2_x, -2_y, -2_z, -2_xy, -2_-xy, ±4_z, ±-4_z | 16 | σ(1), σ(2), σ(7) |
| Trigonal | 3 | 3 | C<sub>3</sub> | 3 | 1, ±3_z | 3 | σ(6) |
| Trigonal | -3 | -3 | C<sub>3i</sub>(S<sub>6</sub>) | -6 | 1, -1, ±3_z, ±-3_z | 6 | σ(1), σ(6) |
| Trigonal | 32 | 32 | D<sub>3</sub> | 3:2 | 1, 3(2⊥), ±3_z | 6 | σ(2), σ(6) |
| Trigonal | 3m | 3m | C<sub>3v</sub> | 3.m | 1, 3(-2⊥), ±3_z | 6 | σ(4), σ(6) |
| Trigonal | -3m | -3m | D<sub>3d</sub> | -6.m | 1, -1, 3(2⊥), 3(-2⊥), ±3_z, ±-3_z | 12 | σ(1), σ(2), σ(6) |
| Hexagonal | 6 | 6 | C<sub>6</sub> | 6 | 1, 2_z, ±3_z, ±6_z | 6 | σ(3), σ(6) |
| Hexagonal | -6 | -6 | C<sub>3h</sub> | 3:m | 1, -2_z, ±3_z, ±-6_z | 6 | σ(5), σ(6) |
| Hexagonal | 6/m | 6/m | C<sub>6h</sub> | 6:m | 1, -1, 2_z, -2_z, ±3_z, ±-3_z, ±6_z, ±-6_z | 12 | σ(1), σ(3), σ(6) |
| Hexagonal | 622 | 622 | D<sub>6</sub> | 6:2 | 1, 6(2⊥), 2_z, ±3_z, ±6_z | 12 | σ(2), σ(3), σ(6) |
| Hexagonal | 6mm | 6mm | C<sub>6v</sub> | 6.m | 1, 2_z, 6(-2⊥), ±3_z, ±6_z | 12 | σ(3), σ(4), σ(6) |
| Hexagonal | -6m2 | -6m2 | D<sub>3h</sub> | m.3:m | 1, 3(2⊥), 3(-2⊥), -2_z, ±3_z, ±-6_z | 12 | σ(4), σ(5), σ(6) |
| Hexagonal | 6/mmm | 6/mmm | D<sub>6h</sub> | m.6:m | 1, -1, 6(2⊥), 2_z, 6(-2⊥), -2_z, ±3_z, ±-3_z, ±6_z, ±-6_z | 24 | σ(1), σ(2), σ(3), σ(6) |
| Cubic | 23 | 23 | T | 3/2 | 1, 3(2), 4(±3) | 12 | σ(3), σ(9) |
| Cubic | m3 | m3 | T<sub>h</sub> | -6/2 | 1, -1, 3(2), 3(-2), 4(±3), 4(±-3) | 24 | σ(1), σ(3), σ(9) |
| Cubic | 432 | 432 | O | 3/4 | 1, 9(2), 4(±3), 3(±4) | 24 | σ(7), σ(9) |
| Cubic | -43m | -43m | T<sub>d</sub> | 3/-4 | 1, 3(2), 6(-2), 4(±3), 3(±-4) | 24 | σ(8), σ(9) |
| Cubic | m3m | m3m | O<sub>h</sub> | -6/4 | 1, -1, 9(2), 9(-2), 4(±3), 4(±-3), 3(±4), 3(±-4) | 48 | σ(1), σ(7), σ(9) |

## Changelog

- **2026-06-16** (`83e2abb`): Initial transcription.
- **2026-06-16** (`53a17ed`): Fixed two generator misprints inherited from the book: `6mm`
  σ(4),σ(4),σ(6) → σ(3),σ(4),σ(6); `-6m2` σ(2),σ(5),σ(6) → σ(4),σ(5),σ(6). Confirmed by
  cross-referencing with Table 6, which independently lists generators for the same 32 classical
  groups.
- **2026-06-17** (`0e05601`): Fixed a Schoenflies symbol typo for `-1`: C<sub>1</sub>(S<sub>2</sub>)
  → C<sub>i</sub>(S<sub>2</sub>) (the subscript "i" had been misread as "1" during OCR).
