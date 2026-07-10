# ANALYSIS -- Birss Tables 4b / 4c / 4d semantics (Tables feature, Phase 1)

**Date:** 2026-07-09
**Author:** engine work order (Tables Phase 1), evidence re-parsed from the vendored tables.
**Purpose:** the DESIGN doc forbids *assuming* what Tables 4b-4d tabulate before writing a
parser/guard. This records, with quoted evidence, exactly what each table tabulates -- rows,
columns, tensor type, axis convention -- and the mapping used to wire the guard
(`src/services/tables4bcd.reference.test.ts`). Result: **all three tables have established
semantics and are wired** (32 classical groups, both parities, rank 0/1/2 -- 34 tests, all green).

Related: `birss-tables/table-4a.md` (the symbol-class key), `docs/references/BIRSS-APP-CONVENTIONS-REFERENCE.md`.

---

## 1. What the tables are

Birss factors the independent-component *form* of a property tensor into **21 symbol classes
(A-U)**. The lookup is two-step (`table-4a.md`, "How to use this table"):

1. **(point group, tensor type) -> symbol class letter**, from **Table 4a**. Each of the 32
   classical point groups has four class letters -- one per tensor type: *Polar even rank m*,
   *Axial even rank m*, *Polar odd rank n*, *Axial odd rank n*. A blank (`-`) means that tensor
   type **vanishes identically** for the group.
2. **(symbol class, rank) -> component form**, from Tables 4b-4f, indexed by the letter + rank
   number: rank 0 -> **4b** (`A0`..`U0`), rank 1 -> **4c** (`A1`..`U1`), rank 2 -> **4d**
   (`A2`..`U2`), rank 3 -> 4e, rank 4 -> 4f.

> Evidence (`table-4a.md:13-21`): "Each row gives a point group's **symbol class** for four tensor
> types ... as a letter A-U. These letters are not tensor values; they are row-keys into Tables
> 4b-4f ... Even rank **m** (m = 0, 2, 4) -> Table 4b (m=0), Table 4d (m=2) ...; Odd rank **n**
> (n = 1, 3) -> Table 4c (n=1), Table 4e (n=3)".

**Time reversal is not in these tables.** Tables 4a-4d are the classical (32-group) scheme with no
i/c distinction. The magnetic i-tensor / c-tensor class reassignment is **Table 7** (out of
Phase-1 scope; see §5). Consequently the guard is restricted to **Type I (classical) groups** and
**time-even (i)** tensors.

## 2. Axis convention

Table 4a's "Orientation of reference axes" column is the **Birss reference frame** -- e.g. `422 ->
4//z, 2//y` (secondary two-fold along **y**). This is the app's **default setting (setting 1)**
after the v0.1.1 switch to the Birss y-secondary convention. The guard therefore compares at
`setting = 1`. Cubic `m3`/`m3m` in Table 4a are the app keys `m-3`/`m-3m` (the only International-
symbol -> app-key divergence among the 32; handled by a two-entry normalization).

## 3. Table 4b (rank 0) -- unambiguous

One column, `x`. Row value is `x` (the scalar survives) or `0` (vanishes).

> Evidence (`table-4b.md:6`): "The header `x` denotes a single tensor component; this table does
> not use grouped permutation shorthand."

Reading: class letter -> `0` => tensor vanishes; `x` => one independent (scalar) component.
Guarded against `computeTensorForm(group, 1, {0, polar|axial, i, none})`.

## 4. Table 4c (rank 1) -- unambiguous

Three columns `x | y | z`; each value is `0` or the bare coordinate. No signs, no cross-references.

> Evidence (`table-4c.md:6`): headers `x`,`y`,`z` "denote single tensor components; this table does
> not use grouped permutation shorthand." Rows: `A1 -> x,y,z`; `B1 -> 0,0,z`; `C1 -> x,y,0`.

Reading: each nonzero column is one independent component; the surviving set is the vector form.
Guarded against `{1, polar|axial, i, none}`.

## 5. Table 4d (rank 2) -- the one that needed analysis

Columns: `xx | yy | zz | xy | yx | xz(2) | yz(2)` (7 columns for a 9-component general rank-2
tensor). `xy` and `yx` are **separate** columns (so the tensor is *general*, not assumed
symmetric), but `xz`/`zx` and `yz`/`zy` are bundled into `xz(2)` / `yz(2)`.

> Evidence (`table-4d.md:6-7`): "Minus signs are literal ... Headers of the form `xz(2)` and
> `yz(2)` denote the two distinct unrestricted permutations of the indicated component: `xz, zx`
> and `yz, zy`."

### The ambiguity
A single cell under `xz(2)` cannot, on its face, distinguish "**xz and zx both survive as two
independent free components**" (multiplicity 2) from "**xz = zx** (one constrained component)".

### Resolution (multiplicity reading), and its confirmation
Adopted reading:
- **Scalar columns** (`xx,yy,zz,xy,yx`): the cell value is `0` (that component vanishes) or a
  (possibly signed) symbol naming the free family the component belongs to -- e.g. F2:
  `yy = xx` (so chi_yy = chi_xx), `yx = -xy` (so chi_yx = -chi_xy).
- **`(2)` columns**: value `0` => the pair vanishes together; a symbol => **both members survive as
  two independent free components** (never mutually constrained).

This reading is forced by class **A2** (triclinic `1`, the fully general rank-2 tensor), whose row
is `xx yy zz xy yx xz yz` -- i.e. all seven columns nonzero. Under the multiplicity reading that is
**9 independent components** (5 scalar + 2 + 2), exactly the general rank-2 tensor. Under an
"xz = zx" reading it would be only 7, which is wrong for `1`.

**Empirical confirmation:** the guard builds the expected family set from Table 4d under this
reading and compares it, component-for-component (zero structure **and** equality/sign relations),
to `computeTensorForm(group, 1, {2, polar|axial, i, none})` for **all 32 classical groups, both
parities**. All pass. In particular no class ever links `xz` to `zx` (or `yz` to `zy`), so the
`(2)` compression is lossless for every class -- the semantics are established.

Worked check (axial rank-2 of `m`, class `C`): row `C2 = 0 0 0 0 0 | xz | yz`. Under the mirror
`m_z` (det -1, axial), the diagonal and `xy/yx` are killed while `xz,zx,yz,zy` survive as four
independent components -- matching the engine and the table.

## 6. Coverage wired

| Table | Rank | Tensor types guarded | Groups | Status |
|---|---|---|---|---|
| 4b | 0 | polar-i, axial-i | 32 classical (Type I) | wired, green |
| 4c | 1 | polar-i, axial-i | 32 classical (Type I) | wired, green |
| 4d | 2 | polar-i, axial-i | 32 classical (Type I) | wired, green |

Guard: `src/services/tables4bcd.reference.test.ts` (re-parses 4a + 4b/4c/4d at test time;
anti-circular -- no expected value comes from `computeTensorForm`).

## 7. Explicitly NOT covered here (later phases)

- **Magnetic (Type II/III) groups' i/c class reassignment -- Table 7.** Tables 4a-4d assign
  classes for the 32 classical groups only; the 90 magnetic groups reuse the same A-U forms but via
  a Table-7 i-tensor / c-tensor class map that the app does not yet encode as a function. Wiring a
  4b-4d guard *through Table 7* is deferred. (The engine itself already produces magnetic-group
  forms correctly -- anchored independently in `tensorForms.test.ts` via ITC 1.5.8.1 and the ED/MD
  golden paths; only the *Birss-class-indexed* guard is deferred.)
- **Tables 4e (rank 3) and 4f (rank 4):** analyzed in the §8 addendum below -- **both now wired**
  (4e directly; 4f was initially a STOP, then resolved by Birss's lockstep rule, §8.3.1). This
  supersedes the earlier "already covered / blocked on F4" notes here.

---

## 8. Addendum (2026-07-09b) -- Tables 4e (rank 3) and 4f (rank 4)

**Date:** 2026-07-09 (second same-day work order: rank-3/4 guards).
**Purpose:** extend the classical-groups guard to rank 3 (Table 4e) and rank 4 (Table 4f) now that
4f is print-verified (PR #77). Same discipline: analyze cell semantics with quoted evidence before
parsing; STOP for any table whose conventions stay ambiguous.

### 8.1 What 4e / 4f tabulate

Same two-step lookup as 4b-4d (Table 4a class letter -> form row), for the ODD-rank letters
(rank 3 -> Table 4c/4e) and EVEN-rank letters (rank 4 -> Table 4f). Both are classical tables (no
time reversal), so the guard runs Type I groups, time-even (i) forms, setting 1. Because classical
groups have no antiunitary element, the i- and c-forms coincide -- the guard asserts this
programmatically (`computeTensorForm` i-form == c-form for every classical group) before comparing
the i-form to the table.

Both tables describe the GENERAL tensor (no intrinsic index symmetry): the columns partition all
3^rank components into families (via permutation shorthand), and for the lowest class A the family
members are independent, giving the full 27 (4e) / 81 (4f) -- the "multiplicity" reading already
established for 4d's `xz(2)` columns.

### 8.2 Table 4e -- established and WIRED

> Evidence (`table-4e.md:8-9`): "Headers such as `xxy(3)` denote the distinct unrestricted
> permutations of `xxy`." Print-verified 2026-07-02 (changelog: "checked cell-by-cell ... No
> transcription errors found").

15 columns partition the 27 components: 3 singletons (`xxx`,`yyy`,`zzz`), six `(3)` families
(full 3-permutation orbits), and the six all-distinct `xyz`-permutation singletons. Every cell is
one of four unambiguous forms:
- `0` -> those components vanish;
- **self-reference** (cell == column base) -> the family is free (independent);
- **single mult-1 reference** (e.g. `xxy(3) = -yyy`) -> every family member = +/- that one
  component (unambiguous, since the reference is a singleton);
- **cross-reference to a same-size family** (e.g. `yyz(3) = xxz`) -> the two families are related by
  an **axis relabel** (here x<->y), which is a bijection on components, so the pairing is
  well-defined: `chi_{sigma(m)} = +/- chi_m`.

Comparison = subspace equality: the engine basis must satisfy every parsed relation AND match the
table's independent-component count (27 - rank of the relation matrix). **Result: all 32 classical
groups x both parities pass** (`tables4e.reference.test.ts`). No ambiguity; wired.

### 8.3 Table 4f -- initially STOP, then RESOLVED (lockstep rule, see 8.3.1)

> Evidence (`table-4f.md:8-15`): the families use FIVE different permutation rules -- `(4)` = all
> unrestricted permutations, `(c4)` = four cyclic permutations, `(x.3)` = "fix the last index,
> permute the others", `(x:3)` = "fix the first index, permute the others", `(xy:6)` = the six
> perms preserving the x-before-y order.

Unlike 4e's single uniform rule, 4f's mixed partial-permutation families make the cell -> component
pairing underdetermined. Two concrete, unresolvable problems (empirically checked against the
independently-validated engine for all 32 classical groups):

1. **The `(c4)`-block cross-references have no defining relabel.** In the trigonal/hexagonal rows
   K4/L4/M4/O4/R4 the c4 columns read e.g. `xxyz(c4) = -yyyz` and `yyxz(c4) = -xxxz`. The multisets
   differ (`{x,x,y,z}` vs `{y,y,y,z}`), so NO axis relabel maps one family onto the other, and the
   notation does not say whether this means "each of the four cyclic components = -chi_yyyz (one
   component)" or a positional family pairing. The single-component reading was tested and the
   engine does **not** satisfy it (`sat=false` for `3`, `-3`, `32`, `3m`, `-3m`, ...); no positional
   order is specified by the file.
2. **Even the relabel-clean hexagonal rows (N4/P4/Q4, whose c4 block is all zero) mismatch on
   dimension.** Under the same axis-relabel + sum-cell reading that works perfectly for 4e, the
   engine reports e.g. 21 independent components for class N (hexagonal `6`) while the parsed table
   yields 19 -- so the multi-member family pairing that 4f's mixed rules imply does not reproduce
   the (validated) rank-4 engine either.

Both candidate readings I could principle-derive from the notation *as then transcribed* fail
against the engine, and the file did not pin down the component ordering needed to disambiguate.
The STOP was recorded pending the exact pairing convention from the printed book.

#### 8.3.1 RESOLVED (2026-07-09b) -- Birss's lockstep rule

Source: maintainer-provided book text (printed pages 62-66, preceding Table 4f), now recorded in
`table-4f.md`'s Notation section. Quote: *"Notations of the type xz(2), xxy(3), yxxx(x.3),
xxxz(4), xxyy(x:3), xxyz(c4) and zzxy(xy:6) indicate certain permutations which must be applied to
every component in the column. Thus, in considering a permutation of a component at the top of a
column, the same permutation must be applied to all the components listed in that column for the
various crystal classes."*

So the header annotation defines a set of **index-position** permutations, and each cell value is
expanded by the **same** position permutations -- **lockstep** -- emitting one relation per family
member. It is *not* an axis relabel (which is exactly why the relabel candidate failed) and *not*
"all members equal one component" (why the single-component candidate failed). Worked example, row
`K4`, column `xxyz(c4) = -yyyz`: the four cyclic shifts give `T_xxyz=-T_yyyz`, `T_zxxy=-T_zyyy`,
`T_yzxx=-T_yzyy`, `T_xyzx=-T_yyzy`. Sum cells (single-component columns, e.g.
`xxxx = yyxx+xyyx+yxyx`) are direct equalities, no expansion.

Under this rule the guard **passes for all 32 classical groups x both parities** at rank 4
(`tables4f.reference.test.ts`). The 6/mmm `P4` row -- Birss's own worked example (eq. 2.23) -- is
among the passes; its resulting equalities are reported in the guard's PR for a book eyeball.

**One implementation note (engine, not the table).** For a *general* (intrinsic-none) rank-4
tensor the engine's seed projection (`computeTensorForm(...).basisResults`) returns a **non-minimal
spanning set** -- it dedups seeds only by proportionality, so it can keep vectors that are linearly
dependent without being scalar multiples (e.g. 11 vectors spanning a 10-dim space for class P).
The guard therefore compares the **rank of the engine's span** to the table's solution-space
dimension (plus the per-relation satisfaction check) -- i.e. genuine subspace equality -- rather
than `basisResults.length`. This does not affect ED/MD/EQ or ranks 0-3 (where the projection is
already minimal); a future Tables UI that displays an independent-component *count* for general
rank-4 must apply the same rank reduction.

### 8.4 Coverage added

| Table | Rank | Groups | Status |
|---|---|---|---|
| 4e | 3 | 32 classical, both parities | wired, green (`tables4e.reference.test.ts`) |
| 4f | 4 | 32 classical, both parities | wired, green (`tables4f.reference.test.ts`) -- lockstep rule (8.3.1) |

---

## 9. Addendum (2026-07-10) -- form-signature "sharing": setting-1 refines the F-blocks; use the canonical signature

**Context.** The Tables Phase-3 "Groups sharing this form" feature partitions the 122 groups by a
form signature (`getFormSignature`) and lists co-members. The natural anchor is ITC Table 1.5.8.1:
for the linear magnetoelectric tensor `{2, axial, c, none}` the 58 groups should partition exactly
into the printed F1-F11 form blocks.

**Finding (setting-1 signature is a strict refinement).** Using the plain frame-specific signature
at **setting 1** (`getFormSignature(g, 1, spec)`), the partition over the 58 ME groups does **not**
equal the F-block partition -- it strictly **refines** it: 9 of the 11 blocks (and the zero class of
the other 64 groups) match exactly, but two blocks split:

- **F5** `{2'2'2, 2'm'm, mm2, mmm'}` splits into `{2'2'2, mm2, mmm'}` and `{2'm'm}`.
- **F10** `{-42'm', -42m, 4'/m'm'm, 4'22', 4'mm'}` splits into `{-42m, 4'/m'm'm, 4'22'}` and
  `{-42'm', 4'mm'}`.

The mechanism is a **frame** difference, not a form difference. At setting 1 the same abstract form
places its free components in different axis pairs: e.g. `mm2`'s magnetoelectric tensor is
`[[0, a12, 0], [a21, 0, 0], [0, 0, 0]]` (the **xy/yx** pair), while `2'm'm`'s is
`[[0, 0, a13], [0, 0, 0], [a31, 0, 0]]` (the **xz/zx** pair). Same F5 form (two off-diagonal free
components), different axis pair, so a frame-specific signature separates them. The split groups are
exactly the ones whose setting-1 (Birss standard) frame differs from the ITC-printed frame -- the
bracketed / rotated-setting groups. The refinement never merges across blocks (each signature class
is contained in one block).

**Resolution (frame-canonical signature).** "Same printed-table form" is an **abstract-form**
(frame-independent) notion -- ITC itself proves this by printing, per group, the bracketed alternate
whose components match the block matrix (`2'mm' [m2'm']` in F5; `-4m'2'` for a setting of `-42'm'`
in F10). The feature therefore uses `getCanonicalFormSignature(g, spec)` = the lexicographic minimum
of `getFormSignature(g, s, spec)` over **every setting the app already tabulates** for `g`
(`ALTERNATE_SETTINGS`; setting 1 if none). No new O(3) canonicalization is needed -- the app's own
`S·G·S⁻¹` setting machinery already produces those frames. Under this signature the partition
**equals** the F-blocks (F5 heals via the orthorhombic axis-permutation settings, F10 via the
`Rz(45°)` settings); anchored in `src/services/formSignature.reference.test.ts`. The plain
`getFormSignature` is kept as-is (frame-specific, used by the result panel); only "sharing" uses the
canonical variant.
