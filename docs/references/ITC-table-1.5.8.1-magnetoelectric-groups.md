# ITC Table 1.5.8.1 -- Magnetic point groups admitting the linear magnetoelectric effect

> **Content:** Transcription of ITC Table 1.5.8.1, with the app-side notes needed to read it.
> **Status:** living (transcription)
> **Authority:** source-side material: a transcription of the printed ITC table, vendored so the reference tests can re-parse it. Change it only to correct the transcription against print.

Source: International Tables for Crystallography, Vol. D, Chapter 1.5, Table 1.5.8.1 ("The forms
of the tensor characterizing the linear magnetoelectric effect"). Transcribed 2026-07-08 from the
maintainer-provided screenshot of the printed table.
VERIFICATION STATUS: transcribed directly from the screenshot; maintainer spot-check 2026-07-08
confirmed the prime-sensitive F8/F9 rows (D2d(D2) `-4'2m'` vs D2d(C2v) `-4'2'm`) against the scan,
cross-checked group-theoretically (unitary subgroup determines the primes) and against the known
Cr2O3 `-3'm'` diagonal form in F8.
Self-check: 58 groups total (matches ITC text: "All remaining 58 magnetic point groups in which
the linear magnetoelectric effect is possible are listed in Table 1.5.8.1").

Notation: ASCII; leading `-` = overbar; `'` = prime. Symbols in square brackets are the alternate
settings printed by ITC. Monoclinic rows are printed with unique axis y (ITC b-unique; the full
symbols in parentheses in the printed table, e.g. `2 (= 121)`, are omitted here). The `Form`
column refers to the matrix patterns listed at the end. App-key mapping goes via the Schoenflies
column against `birss-tables/table-nomenclature.md` where the printed frame differs from the app
key.

## Group list (11 form blocks)

| Block | Schoenflies | HM (printed) [alternates] |
|---|---|---|
| F1 | C1 | 1 |
| F1 | Ci(C1) | -1' |
| F2 | C2 | 2 |
| F2 | Cs(C1) | m' |
| F2 | C2h(C2) | 2/m' |
| F3 | Cs | m |
| F3 | C2(C1) | 2' |
| F3 | C2h(Cs) | 2'/m |
| F4 | D2 | 222 |
| F4 | C2v(C2) | m'm'2 [2m'm', m'2m'] |
| F4 | D2h(D2) | m'm'm' |
| F5 | C2v | mm2 |
| F5 | D2(C2) | 2'2'2 |
| F5 | C2v(Cs) | 2'mm' [m2'm'] |
| F5 | D2h(C2v) | mmm' |
| F6 | C4 | 4 |
| F6 | S4(C2) | -4' |
| F6 | C4h(C4) | 4/m' |
| F6 | C3 | 3 |
| F6 | S6(C3) | -3' |
| F6 | C6 | 6 |
| F6 | C3h(C3) | -6' |
| F6 | C6h(C6) | 6/m' |
| F7 | S4 | -4 |
| F7 | C4(C2) | 4' |
| F7 | C4h(S4) | 4'/m' |
| F8 | D4 | 422 |
| F8 | C4v(C4) | 4m'm' |
| F8 | D2d(D2) | -4'2m' [-4'm'2] |
| F8 | D4h(D4) | 4/m'm'm' |
| F8 | D3 | 32 |
| F8 | C3v(C3) | 3m' |
| F8 | D3d(D3) | -3'm' |
| F8 | D6 | 622 |
| F8 | C6v(C6) | 6m'm' |
| F8 | D3h(D3) | -6'm'2 [-6'2m'] |
| F8 | D6h(D6) | 6/m'm'm' |
| F9 | C4v | 4mm |
| F9 | D4(C4) | 42'2' |
| F9 | D2d(C2v) | -4'2'm [-4'm2'] |
| F9 | D4h(C4v) | 4/m'mm |
| F9 | C3v | 3m |
| F9 | D3(C3) | 32' |
| F9 | D3d(C3v) | -3'm |
| F9 | C6v | 6mm |
| F9 | D6(C6) | 62'2' |
| F9 | D3h(C3v) | -6'm2' [-6'2'm] |
| F9 | D6h(C6v) | 6/m'mm |
| F10 | D2d | -42m |
| F10 | D2d(S4) | -4m'2' |
| F10 | D4(D2) | 4'22' |
| F10 | C4v(C2v) | 4'm'm |
| F10 | D4h(D2d) | 4'/m'm'm |
| F11 | T | 23 |
| F11 | Th(T) | m'-3' |
| F11 | O | 432 |
| F11 | Td(T) | -4'3m' |
| F11 | Oh(O) | m'-3'm' |

Total: 58 groups (2 + 3 + 3 + 3 + 4 + 8 + 3 + 11 + 11 + 5 + 5).

## Matrix forms (alpha_ij patterns per block)
- F1: all nine components independent.
- F2: [[a11, 0, a13], [0, a22, 0], [a31, 0, a33]]  (unique axis y)
- F3: [[0, a12, 0], [a21, 0, a23], [0, a32, 0]]  (unique axis y)
- F4: [[a11, 0, 0], [0, a22, 0], [0, 0, a33]]
- F5: [[0, a12, 0], [a21, 0, 0], [0, 0, 0]]
- F6: [[a11, a12, 0], [-a12, a11, 0], [0, 0, a33]]
- F7: [[a11, a12, 0], [a12, -a11, 0], [0, 0, 0]]
- F8: [[a11, 0, 0], [0, a11, 0], [0, 0, a33]]
- F9: [[0, a12, 0], [-a12, 0, 0], [0, 0, 0]]
- F10: [[a11, 0, 0], [0, -a11, 0], [0, 0, 0]]
- F11: [[a11, 0, 0], [0, a11, 0], [0, 0, a11]]
