# FINDING 2026-07-31: ITC Vol. D Ch. 1.1 (2nd ed., 2013) -- four defects in the rank-3 scheme material

> **Content:** Four erratum candidates in ITC-D Ch. 1.1's rank-3 scheme material, the chapter's two rank-3 treatments and their conventions, and the anchor rules this binds on the Nye-diagram work.
> **Status:** frozen (2026-07-31)
> **Authority:** historical record of what was established on that date. The binding rules it produced are restated in the NYE series entry in `docs/planning/LEDGER.md`.

Status: erratum candidates, UNCONFIRMED upstream (no IUCr erratum found
for these sections). Documented from concurring independent sources.
Provenance: analysis and print readings 2026-07-31 -- maintainer
(screenshots and print inspection), work-order author (derivations,
Birss cross-checks), executor (systematic extracted-text sweep of both
sections against the engine, which found defects 3 and 4; edition and
grid-convention confirmations).

Edition: International Tables for Crystallography (2013), Vol. D,
Chapter 1.1 (A. Authier), pp. 3-33 -- the chapter's own provenance
line. Defects 1 and 2 sit on p. 19; defects 3 and 4 in the same
chapter's two rank-3 treatments.

## The chapter's two rank-3 treatments (context)

- Sec. 1.1.4.8 (pp. 17-20): the GENERAL third-rank tensor, 3x9 scheme
  (three 3x3 submatrices; column order 11 22 33 | 23 31 12 | 32 13 21
  per Sec. 1.1.4.10.3 -- CONFIRMED from the chapter text, no longer an
  assumption). App equivalent: rank 3, intrinsic `none`.
- Sec. 1.1.4.10.4 (pp. 25-26): the piezoelectric MATRIX d_i-mu, 3x6
  Voigt scheme. App equivalent of the grid geometry: rank 3, intrinsic
  `jk` -- but NOT of the cell values: the d_i-mu convention places
  factors 2 on mu = 4,5,6 (the section's own factor glyph, defined
  1.1.4.10.4.4(i): "twice minus ... for d_ijk and minus ... for
  e_ijk"), whereas the app's grid renders raw chi_i(jk) components
  (engine: class 3 gives the 26-cell ratio exactly -1, not -2), the
  same field-product convention as Yariv Table 16.1 (defined at his
  Eq. 16.1-4).

## Defect 1 -- Sec. 1.1.4.8.5.6 (-42m, general): printed count wrong, diagrams right

Both settings print "6" ("There are 6 independent components." /
"The number of independent components is of course the same, 6." --
verbatim, confirmed by text extraction). The schemes themselves, read
under the chapter's own legend, give 3 (setting i: six dots in three
linked pairs; setting ii: three dot--minus-circle pairs). Concurring:
direct S4 derivation (t123 = t213, t132 = t231, t312 = t321);
character count (27-2-1-2+2)/8 = 3; Birss Table 4e row J3
(print-verified in birss-tables/); the engine. Likely mechanism
(hypothesis): "6" counts nonzero cells (six in both settings, making
"of course the same" literally true under that reading) or carries
over from the -4 building block, which genuinely has 6.

## Defect 2 -- Sec. 1.1.4.8.5.3 (4mm, general): stray dot, printed count right

The scheme shows an isolated, full-diameter component dot at the t312
position (maintainer print inspection: same size as all component
marks, no line attachments -- not a routing artifact). t312 is doubly
killed under 4mm (sigma_v: t312 = -t312 = 0; independently C4 gives
t312 = -t321 while sigma_d gives t312 = +t321). Birss row I3 carries no
xyz-family entry; the section's own printed count "4" is consistent
only with the seven legitimate cells. Verdict: stray-dot misprint in
the diagram; count correct -- opposite polarity to defect 1.

## Defect 3 -- Sec. 1.1.4.8.4.3 (3m, general): printed 4, correct 5

Found by the executor's systematic sweep (Sec. 1.1.4.8 vs engine,
rank-3 `none`: 15 of 17 entries match; the mismatches are defect 1 and
this). Character count, independent: C3v, |G| = 6,
n = (27 + 2*0 + 3*1)/6 = 5. The engine agrees (5).

## Defect 4 -- Sec. 1.1.4.10.4.4(ii) (32, Voigt): printed 4, correct 2

Found by the same sweep (Sec. 1.1.4.10.4 vs engine, rank-3 `jk`: 20 of
21 match; this is the one mismatch). Yariv Table 16.1 prints (2); the
textbook piezoelectric class 32 has exactly two moduli (d11, d14); the
engine agrees (2).

Joint mechanism for defects 3+4 (hypothesis): cross-contamination
within the trigonal block -- all four trigonal entries print "4"; the
two correct ones are 1.1.4.8.4.2 (32 general = 4) and 1.1.4.10.4.4(iii)
(3m Voigt = 4); each WRONG entry carries exactly the OTHER section's
value for the same group.

## Source-ancestry note

Both scheme sources trace to Nye: ITC-D introduces the notation as
"(Nye, 1957, 1985)" (Sec. 1.1.4.7.1) and Yariv's Table 16.1 is "after
Reference 2" = Nye, Physical Properties of Crystals (1st ed. 1957
Clarendon; rev. ed. 1985 OUP). Both are independent of Birss and of the
engine -- which is what anti-circularity requires -- but they are NOT
independent of each other; "Yariv corroborates ITC-D" is not a claim
this project makes.

## Binding consequences (Nye-view work order)

1. ITC-D Ch. 1.1 rank-3 scheme material -- BOTH sections -- is not
   acceptable as a sole anchor for any cell set or count. The chapter's
   legend/glyph vocabulary remains usable and print-verified.
2. The print anchor for the app's 3x6 rank-3 `jk` grid is Yariv Table
   16.1 (matching field-product convention, per-scheme parenthetical
   counts, settings variants), gated as below.
3. Fixture gate, mandatory per scheme: transcribe cells + links +
   glyphs positionally; DERIVE the class count from the transcription;
   validate cells and count against the engine and Birss 4a-4f before
   any expected value freezes. Printed prose counts are metadata only.
   A gate failure stops the fixture and produces a finding -- this
   document is the precedent, four times over.
4. Prose counts are the weakest link in ANY source; the project's own
   authoring rule (no derived counts in prose, only enumerations)
   demonstrably applies to reference works of record.

## Open

- Optional upstream report to the IUCr (maintainer's call).
