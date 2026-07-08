# ITC Table 1.5.2.4 -- Magnetic classes in which ferromagnetism is admitted

Source: International Tables for Crystallography, Vol. D, Chapter 1.5 (local `ch1o5.pdf`,
Table 1.5.2.4, PDF page 6). Transcribed 2026-07-08 from the text extraction of the local PDF with
primes/overbars decoded. Self-check: 31 entries (matches the known count, ITC text: "Only 31
magnetic point groups allow ferromagnetism").
VERIFICATION STATUS: scan-verified 2026-07-08 against the maintainer-provided scan of the printed
table (all 31 rows, including the prime-sensitive rows `2'/m'`, `-42'm'`, `-6m'2'`, `4/mm'm'` and
the four orthorhombic frame symbols, and all Ms directions).

Notation: ASCII; leading `-` = overbar; `'` = prime. `Ms direction` uses `||` (parallel) and
`perp` (perpendicular). The `App key` column gives the group's key in `pointGroups.ts` (frame-
independent identity); where ITC prints a different frame of the same group, the printed symbol is
kept in the HM column and the mapping goes via the Schoenflies column against
`birss-tables/table-nomenclature.md` (authoritative). Rows flagged `[frame]` are printed by ITC in
a non-app-standard frame.

## (a) Triclinic
| Schoenflies | HM (printed) | Ms direction | App key |
|---|---|---|---|
| C1 | 1 | any | 1 |
| Ci | -1 | any | -1 |

## (b) Monoclinic (ITC prints unique axis b)
| Schoenflies | HM (printed) | Ms direction | App key |
|---|---|---|---|
| C2 | 2 | \|\| 2 | 2 |
| C2(C1) | 2' | perp 2' | 2' |
| Cs = C1h | m | perp m | m |
| Cs(C1) | m' | \|\| m' | m' |
| C2h | 2/m | \|\| 2 | 2/m |
| C2h(Ci) | 2'/m' | \|\| m' | 2'/m' |

## (c) Orthorhombic
| Schoenflies | HM (printed) | Ms direction | App key |
|---|---|---|---|
| D2(C2) | 22'2' | \|\| 2 | 2'2'2 [frame] |
| C2v(C2) | m'm'2 | \|\| 2 | m'm'2 |
| C2v(Cs) | m'm2' | perp m | 2'm'm [frame] |
| D2h(C2h) | mm'm' | perp m | m'm'm [frame] |

## (d) Tetragonal
| Schoenflies | HM (printed) | Ms direction | App key |
|---|---|---|---|
| C4 | 4 | \|\| 4 | 4 |
| S4 | -4 | \|\| -4 | -4 |
| C4h | 4/m | \|\| 4 | 4/m |
| D4(C4) | 42'2' | \|\| 4 | 42'2' |
| C4v(C4) | 4m'm' | \|\| 4 | 4m'm' |
| D2d(S4) | -42'm' | \|\| -4 | -42'm' |
| D4h(C4h) | 4/mm'm' | \|\| 4 | 4/mm'm' |

## (e) Trigonal
| Schoenflies | HM (printed) | Ms direction | App key |
|---|---|---|---|
| C3 | 3 | \|\| 3 | 3 |
| S6 | -3 | \|\| 3 | -3 |
| D3(C3) | 32' | \|\| 3 | 32' |
| C3v(C3) | 3m' | \|\| 3 | 3m' |
| D3d(S6) | -3m' | \|\| 3 | -3m' |

## (f) Hexagonal
| Schoenflies | HM (printed) | Ms direction | App key |
|---|---|---|---|
| C6 | 6 | \|\| 6 | 6 |
| C3h | -6 | \|\| -6 | -6 |
| C6h | 6/m | \|\| 6 | 6/m |
| D6(C6) | 62'2' | \|\| 6 | 62'2' |
| C6v(C6) | 6m'm' | \|\| 6 | 6m'm' |
| D3h(C3h) | -6m'2' | \|\| -6 | -6m'2' |
| D6h(C6h) | 6/mm'm' | \|\| 6 | 6/mm'm' |

Total: 31 groups (2 + 6 + 4 + 7 + 5 + 7).
No cubic classes admit ferromagnetism (ITC text, Section 1.5.2 near the table).
