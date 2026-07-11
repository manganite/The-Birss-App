# ITC Table 3.2.2.1 -- Laue classes, noncentrosymmetric point groups, property occurrence and counts

Source: International Tables for Crystallography, Vol. D, Chapter 3.2,
Table 3.2.2.1 (page scan 19 of ch3o2.pdf).
Transcribed: 2026-07-11 from (i) user-provided screenshot, (ii) the page
scan at full resolution, (iii) the OCR sidecar as a third read.
STATUS: triple-read by Claude; provisionally confirmed by the user
2026-07-11 ("appears correct"). Guard-eligible with stop-and-report on
any count mismatch (no silent reconciliation).

Transcription conventions: a leading minus sign denotes an overbar
(-4 = 4-bar); "inf" = the infinity symbol. Counts in parentheses are the
numbers of non-zero independent tensor components as printed. "+" =
property occurs, "-" = property forbidden. Daggered entries per the
printed footnotes.

Printed header notes: for first-rank tensors the direction [uvw] of the
property vector is given. There are 10 pyroelectric, 20 piezoelectric,
11 enantiomorphic and 15 optically active crystal classes.

| System       | Laue class   | Group | Rank-1 (pyroelectricity)   | Rank-3 (piezo/SHG) | Enantiomorphism | Axial rank-2 (optical activity) |
|--------------|--------------|-------|----------------------------|--------------------|-----------------|---------------------------------|
| Triclinic    | -1           | 1     | + (3) [uvw]                | + (18)             | +               | + (6)                           |
| Monoclinic   | 2/m          | 2     | + (1) [010] (a)            | + (8)              | +               | + (4)                           |
|              |              | m     | + (2) [u0w] (a)            | + (10)             | -               | + (2)                           |
| Orthorhombic | 2/m2/m2/m    | 222   | -                          | + (3)              | +               | + (3)                           |
|              |              | mm2   | + (1) [001]                | + (5)              | -               | + (1)                           |
| Tetragonal   | 4/m          | 4     | + (1) [001]                | + (4)              | +               | + (2)                           |
|              |              | -4    | -                          | + (4)              | -               | + (2)                           |
|              | 4/m2/m2/m    | 422   | -                          | + (1)              | +               | + (2)                           |
|              |              | 4mm   | + (1) [001]                | + (3)              | -               | -                               |
|              |              | -42m  | -                          | + (2)              | -               | + (1)                           |
| Trigonal     | -3           | 3     | + (1) [001] (b)            | + (6)              | +               | + (2)                           |
|              | -32/m        | 32    | -                          | + (2)              | +               | + (2)                           |
|              |              | 3m    | + (1) [001] (b)            | + (4)              | -               | -                               |
| Hexagonal    | 6/m          | 6     | + (1) [001]                | + (4)              | +               | + (2)                           |
|              |              | -6    | -                          | + (2)              | -               | -                               |
|              | 6/m2/m2/m    | 622   | -                          | + (1)              | +               | + (2)                           |
|              |              | 6mm   | + (1) [001]                | + (3)              | -               | -                               |
|              |              | -62m  | -                          | + (1)              | -               | -                               |
| Cubic        | 2/m-3        | 23    | -                          | + (1)              | +               | + (1)                           |
|              | 4/m-32/m     | 432   | -                          | -                  | +               | + (1)                           |
|              |              | -43m  | -                          | + (1)              | -               | -                               |
| Icosahedral  | m-3-5 (-5-3m)| 235 (532) | -                      | -                  | +               | + (1)                           |
| Spherical    | m-inf (inf inf m) | 2-inf (inf inf) | -            | -                  | +               | + (1)                           |

Printed footnotes: (a) = dagger: unique axis b. (b) = double dagger:
hexagonal axes.

## Spec mapping for guard use (Claude's analysis, 2026-07-11 -- verify)

The printed counts correspond to the following app TensorSpecs (all
i-type, classical groups only):
- Rank-1 column: { rank: 1, parity: polar, timeParity: i, intrinsic: none }.
- Rank-3 column: { rank: 3, parity: polar, timeParity: i, intrinsic: jk }
  (piezoelectric counts; class 1 = 18 = 3x6 proves jk-symmetric).
- Axial rank-2 column: { rank: 2, parity: axial, timeParity: i,
  intrinsic: SYMMETRIC ij } -- class 1 = 6 (not 9) proves the column
  assumes the symmetric gyration tensor.
- Enantiomorphism: not a tensor count; a boolean flag (group contains
  proper rotations only). Cross-anchor for propertyFlags.ts if a matching
  flag exists.
- The 11 centrosymmetric Laue groups are implicitly all "-"/0 in the
  three tensor columns.
- Structural assertions: 10 pyroelectric, 20 piezoelectric (21 minus
  432), 11 enantiomorphic, 15 optically active classes; monoclinic
  rank-1 counts 1 (group 2) + 2 (group m) = 3 (group 1).

## Convention notes

- The monoclinic rank-1 directions are printed in the UNIQUE-AXIS-B
  setting (dagger footnote). The app uses the first setting (z || c);
  any direction-level guard must permute b-unique -> c-unique first.
  The counts themselves are setting-independent.
- Icosahedral and spherical rows lie outside the app's 32 groups;
  transcribed for completeness only.
