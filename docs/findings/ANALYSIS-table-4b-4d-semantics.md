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
- **Table 4e (rank 3):** already covered by the existing table-anchored golden fixtures
  (`goldenTensors.fixtures.ts`, Birss Table 4e) and the ED-i / MD-c reproduction anchor in
  `tensorForms.test.ts`.
- **Table 4f (rank 4):** BLOCKED on print-verification (roadmap gap F4). The engine's rank-4
  support is in scope and partially anchored (EQ-i reproduction spot-check), but the 4f guard waits
  on the maintainer/scan verification loop.
