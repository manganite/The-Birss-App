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
- **Tables 4e (rank 3) and 4f (rank 4):** analyzed and resolved in the §8 addendum below (4e wired;
  4f a documented STOP). This supersedes the earlier "already covered / blocked on F4" notes here.

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

### 8.3 Table 4f -- STOP (semantics underdetermined by the notation)

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

Both readings I could principle-derive from the notation fail against the engine, and the file does
not pin down the component ordering needed to disambiguate. Per the work order ("If any cell
convention remains ambiguous, STOP for that table and report"), **Table 4f is NOT wired.**

What would unblock it: an explicit statement (from the printed book layout, or added to
`table-4f.md`) of the component ORDER within each `(c4)`/`(4)`/`(x.3)`/`(x:3)`/`(xy:6)` family and
the pairing convention for cross-references between different-rule families -- i.e. exactly which
component each cell entry maps to. That is a transcription/print task (like the 4f value
verification itself), not something to guess here.

The rank-4 engine is not left unanchored: `tensorForms.test.ts` already anchors rank-4 EQ-i
(jk-symmetric) against the app's book-verified EQ path, and the four rank-0 / rank-2 ME anchors
exercise the axial `det(R)` and time-odd branches. Only the *Birss-4f-class-indexed general-tensor*
guard is deferred.

### 8.4 Coverage added

| Table | Rank | Groups | Status |
|---|---|---|---|
| 4e | 3 | 32 classical, both parities | wired, green (`tables4e.reference.test.ts`) |
| 4f | 4 | -- | **STOP** -- semantics underdetermined (see 8.3) |
