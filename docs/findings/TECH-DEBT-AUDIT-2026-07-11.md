# Technical Debt Audit — 2026-07-11

> **Findings snapshot as of 2026-07-11; actionable items are tracked as `E#` entries
> in [`docs/planning/TODO-next.md`](../planning/TODO-next.md) — this file is not updated.**
> Wave 1 (H1, M9, M10, M11, L1, L2, L6, L12) has since shipped on `chore/tech-debt-wave1`.

_Scope: engineering/code-quality debt across `src/` (16.5k LOC, 83 files, 33 test
files), plus build/tooling and doc-sync surface. This is complementary to
`docs/planning/TODO-next.md`, which tracks **physics/feature** backlog (`A#` bugs,
`B#` changes); nothing here overlaps those items. Method: static reading of the
services, components, data, types, test, and CI layers — no code was changed._

## Executive summary

The codebase is **healthy and disciplined**: strict TypeScript, Conventional
Commits, PR review, and an unusually strong reference-test suite (~150 golden
fixtures, table-anchored guards). There are **zero critical, correctness-threatening
debts**, essentially no `any`, no `@ts-ignore`, no skipped tests, no dead-obvious
bugs.

The debt that exists is **maintainability and safety-net concentration**:

1. **The reference-test suite is the *only* safety net.** It substitutes for both
   static tooling (no ESLint/Prettier/coverage) and type-level guarantees
   (stringly-typed group keys, scattered domain types). Anything the fixtures don't
   probe — React-hooks bugs, UI interaction, style drift — is uncaught.
2. **Structural duplication from the numeric-vs-symbolic split.** Two near-identical
   ~200-line SHG pipelines, three copies of the 3×3 rotation/matmul primitives, and
   several duplicated formatting/reduction helpers must be hand-synced on every
   physics change.
3. **A few God components** (`TablesPage` 518 lines, `HelpPage` 684 lines) mixing
   physics/linalg, hardcoded content, and JSX.

None of this is urgent; all of it compounds. The highest-leverage, lowest-risk wins
are tooling (ESLint + hooks plugin, `npm ci`) and consolidating the duplicated test
boilerplate.

Severity = impact on correctness-risk/maintainability. Effort: **S** < 2h · **M**
half-day · **L** multi-day.

---

## Prioritized findings

### High severity

| # | Area | Finding | Anchor | Effort |
|---|------|---------|--------|--------|
| H1 | Tooling | **No ESLint / Prettier.** `lint` is `tsc --noEmit` only. For a 15k-line React 19 app, missing-hook-deps, unused vars, dead code, and `any` leaks are uncaught by CI; no format check → style drift across 20+ components. | `package.json:21`, `ci.yml:21` | M |
| H2 | Services | **Parallel numeric/symbolic SHG pipelines are near-duplicates.** `calculateSHGExpressions` (~270 lines) and `calculateSymbolicSHGExpressions` (~170 lines) are line-for-line parallel, differing only in scalar type (`number` vs `TrigPoly`). Every physics change must be made twice by hand with nothing enforcing agreement. Largest single maintenance liability. | `tensorProjection.ts:278-549`, `symbolicProjection.ts:121-293` | L |
| H3 | Services | **Three independent rotation-matrix + 3×3-matmul implementations.** `getRotationX/Y/Z`+`multiply` (`Matrix3x3`), `rotX/Y/Z`+`mat3mul` (`number[][]`), and `symRotX/Y/Z`+`trigMat3Mul` (symbolic). Same trig, same triple-nested multiply, three copies. | `symmetryGroups.ts:50-102`, `tensorProjection.ts:21-43`, `symbolicProjection.ts:32-78` | M |
| H4 | Components | **`TablesPage.tsx` is a 518-line God component** embedding physics/linalg (`rref`, `spanRank`, Voigt index math, `buildLabels`) alongside JSX, 5 tolerance constants, two nested render components, breadcrumb and sharing logic. `services/tensorForms` material leaking into the view. | `TablesPage.tsx:41-124,455` | L |
| H5 | Components | **`HelpPage.tsx` is a 684-line content+layout monolith.** Large hardcoded content arrays (`FEATURES`, `TENSOR_TYPES`, `REFERENCES`…) interleaved with ~500 lines of inline prose JSX. Content belongs in `data/`; each tab should be its own component. | `HelpPage.tsx:6-135` | L |
| H6 | Types | **Group keys & crystal systems are stringly-typed everywhere; no shared `GroupKey`/`CrystalSystem` union.** ~10 parallel `Record<string, …>` maps are keyed by raw group-name strings; consistency with the 122 canonical groups is enforced only by runtime tests. | `pointGroups.ts:10-11`, `groupNotation.ts:34,175,316,400`, `polarDirections.ts:57` | M |
| H7 | Tests | **~12 test files each hand-roll their own markdown-table parser.** A shared `testUtils/birssTableParsers.ts` exists but only 5 files use it (two of which *also* redefine local parsers). 12 copies of `readFileSync`+`__dirname`+`parseRows`/`stripBackticks` boilerplate. | `groupNotation.test.ts:20-40`, `itcData.reference.test.ts:35-60`, +10 | M |
| H8 | Tests | **Components are essentially untested.** 20 component files, only 3 have tests (all SSR string-snapshot, no interaction). Largest UI surfaces — `App`, `HelpPage`, `TablesPage`, `CalculatorPage`, all hooks — have no render/interaction coverage. No jsdom/testing-library configured. | `src/components/*`, `useSimulatorState.ts` | L |

### Medium severity

| # | Area | Finding | Anchor | Effort |
|---|------|---------|--------|--------|
| M1 | Services | **Duplicated independent-basis reduction ("isNew" ratio matcher)** reimplemented in three places; `tensorForms` is documented as a generalization of `calculateTensorBasisResults` yet copies the reducer instead of calling it. | `tensorProjection.ts:216-247`, `tensorForms.ts:177-199`, `propertyFlags.ts:59-68` | M |
| M2 | Services | **`formatSubstitutedPolySum` (~210 lines)** with six inline harmonic/power lookup tables of magic factors (0.75/0.25/0.5…) and a 14-branch stringly-keyed ordinal function — trig product-to-sum identities as opaque numbers, no derivation anchor. | `latexFormatting.ts:25-234` | L |
| M3 | Services | **`formatMatrixSymbol` (~120 lines)**, 4+ nesting levels, two near-identical rotation-vs-mirror axis-extraction blocks differing only by sign. Hard to modify safely. | `symmetryGroups.ts:454-573` | M |
| M4 | Services | **Duplicated relation-formatting.** `formatResults` and `formatFormRelations` are the same `\chi_{…} = …` builder, self-documented as "kept in lockstep" — a manual-sync copy. | `latexFormatting.ts:236-265`, `tensorForms.ts:117-147` | S |
| M5 | Components | **Grouped prop objects rebuilt every render.** `tensorConfig`/`orientation`/`simulation` are fresh literals each App render (not `useMemo`d) → new identities defeat child memoization and cascade re-renders. | `App.tsx:124-138` | S |
| M6 | Components | **`useSimulatorState` takes 14 positional parameters** and computes SHG intensity physics (180-angle sweep, coherent complex sum, magic field-pair map) inside the hook — should accept the existing prop objects and delegate physics to `services/`. | `useSimulatorState.ts:11-26,164-243` | M |
| M7 | Components | **Triplicated empty-state / "Try c-type/EQ/MD" fallback.** Same three-branch message + four recovery buttons copy-pasted in three components; should be one `<NoComponentsFallback>`. | `CalculatorPage.tsx:307-354`, `TensorComponentControls.tsx:128-154`, `PolarimetrySection.tsx:101-111` | M |
| M8 | Components | **Fragile string-parsing of service output.** Null-state inferred by scanning display strings for `'zero'`/`'none'`/`'not supported'` and `.split('=')`. Service should return structured `{ isNull, lhs, rhs }`. | `CalculatorPage.tsx:171,185` | M |
| M9 | Tooling | **CI uses `npm install`, not `npm ci`.** Lockfile not enforced → non-reproducible CI/deploy builds. Compounds with caret-ranged toolchain deps. | `ci.yml:20`, `deploy.yml:42` | S |
| M10 | Tooling | **No coverage collection or gate** anywhere (no `vitest` coverage config/dep/threshold) — zero visibility into the component gap (H8). | — | S–M |
| M11 | Tooling | **Inconsistent dependency-pinning policy.** Most deps exact-pinned; build-critical tools caret-ranged (`vite ^6`, `vitest ^4`, `vite-plugin-pwa ^1.3`, `@types/react*`). With `npm install` this makes builds non-deterministic. | `package.json:27-51` | S |
| M12 | Types | **`types.ts` is not a coherent home for domain types.** It holds only React prop bundles + `TENSOR_META`; every real domain type (`PointGroupData`, `Table7Row`, `TensorSpec`, `ClassLetters`…) is scattered, and `parity:'polar'\|'axial'` / `timeParity:'i'\|'c'` are re-inlined across many signatures instead of shared named unions. | `types.ts` | M |
| M13 | Data | **~8 files independently re-enumerate the 32/122 group registry** with no single source-of-truth object; consistency enforced only post-hoc by tests. Data-gen is also asymmetric — `table7Data.ts` is generated (`DO NOT EDIT`) but `groupNotation.ts` (545 lines) is hand-transcribed from the same vendored markdown. | `pointGroups.ts`, `groupNotation.ts`, `polarDirections.ts`, `table7Data.ts`, … | L |

### Low severity

| # | Area | Finding | Anchor | Effort |
|---|------|---------|--------|--------|
| L1 | Services | **Dead stub `getFutureSettingCount`.** `GROUPS_WITH_FUTURE_SETTINGS` is `{}`, so it always returns `null`; still exported and consumed by two components that render nothing. | `symmetryGroups.ts:416-424` | S |
| L2 | Services | **Unused public API** `trigSub`, `trigEval`, `TRIG_ONE` — no non-test callers. | `trigPoly.ts:61,118,202` | S |
| L3 | Services | **Duplicated epsilon constants** (`COEFF_EPSILON=1e-5` in two files, plus `AXIS_EPSILON`, `EPSILON`, `ROOT_MATCH_EPSILON`) distinguished only by prose. | `tensorProjection.ts:46`, `trigPolyFormat.ts:12`, `symmetryGroups.ts:16` | S |
| L4 | Services | **Duplicated field-label maps** (`{'00':'E_X^2',…}`) in three modules; duplicated `multiplyLinear`/`addPoly` numeric vs `…Sym`; duplicated sort-order array + index-flattening (`getIndices` has no `toFlatIndex` inverse). | `tensorProjection.ts:358-369`, `symbolicProjection.ts:220-223`, `trigPolyFormat.ts:123-126` | M |
| L5 | Components | **Section-header styling inlined despite shared `SectionHeader`** (AGENTS.md §163 says to use it) in ~9 files with `text-[10px]`/`xs`/`sm` and `/40`/`/50`/`/70` variants — a header family with no shared abstraction. | `CalculatorPage.tsx:162,221,260,270`, `TablesPage.tsx:240-288`, `OperationsModal.tsx:312+` | S |
| L6 | Docs | **`SectionHeader` doc-drift.** AGENTS.md §163 says the component lives in `MathComponents.tsx` with `text-[10px] … opacity-50`; it actually lives in `notation.tsx` with `text-xs … text-ink/70`. Wrong file *and* wrong class. | `AGENTS.md:163` vs `notation.tsx:6-13` | S |
| L7 | Components | **Repeated markup**: 5× nav-pill className (`App.tsx:158-187`), 6× 8-prop `PolarimetryPlot` blocks (`PolarimetrySection.tsx:139-212`), duplicated desktop/mobile tab menus and footer link rows. Table-drive from existing maps. | — | S |
| L8 | A11y | **Tab strips lack ARIA tab semantics** (`role=tablist/tab/tabpanel`, `aria-selected`); nav pills lack `aria-current`; range sliders/number inputs lack `aria-label`/`aria-valuetext`. | `HelpPage.tsx:174-200`, `App.tsx:158-187`, `TensorComponentControls.tsx:95-116` | M |
| L9 | Components | **`as any` on `RADAR_TICKS`** (`PolarimetryPlot.tsx:13`) silences typing on the whole array; `as unknown as TickItem[]` is narrower. Loose `[key:string]:number` data prop erases known dataKeys. | `PolarimetryPlot.tsx:13,23` | S |
| L10 | Types | **`TENSOR_META` weakly typed** — `rank:'3'` as string (should be numeric); `satisfies` widens `type` to `string` instead of `'POLAR'\|'AXIAL'`. Prop bundle `TensorConfig` also omits `setConvention` that App's object carries. | `types.ts:5-9` | S |
| L11 | Build | **`recharts` not code-split.** `manualChunks` splits react/katex/motion but not the heavy chart lib → larger initial entry. `@` vite alias points at repo root (not `src/`), letting app code import `birss-tables/`. | `vite.config.ts:41-56` | S |
| L12 | Tests | **Misleading test filename** `itcData.reference.test.ts` guards `polarDirections.ts`+`crystalSystems.ts`; there is no `itcData.ts`. | `src/data/itcData.reference.test.ts` | S |
| L13 | Docs | **Heavy hand-maintained docs with no sync automation** — `TODO-next.md` (1690 lines), `ROADMAP.md` (834), `STATUS.md`, `AGENTS.md` drift silently against code; only CHANGELOG→release and nomenclature-md are automated. The 1690-line TODO is itself a smell. | `docs/planning/*` | M (ongoing) |

---

## Recommended refactoring plan

Sequenced to front-load **safety-net additions** (so later refactors are guarded),
then **behaviour-preserving deduplication**, then **structural splits**. Each wave is
independently shippable; respect the repo rule — extend the relevant golden/reference
fixture *first* for anything touching tensor math, and gate on
`npm run lint && npm run test`.

### Wave 1 — Guardrails first (low risk, high leverage) · ~1–1.5 days
Do these before any refactor so the later waves have a wider net.
- **H1** Add ESLint + `@typescript-eslint` + `eslint-plugin-react-hooks` + Prettier;
  wire a `lint:eslint` + `format:check` CI step. Start with hooks-deps and
  no-unused as errors, the rest as warnings to avoid a big-bang cleanup.
- **M9 / M11** Switch CI/deploy to `npm ci`; settle one pinning policy (recommend
  exact-pin the toolchain to match the app deps).
- **M10** Add `@vitest/coverage-v8` + a baseline (non-blocking) coverage report.
- **L1, L2, L12, L6** Quick hygiene: delete the `getFutureSettingCount` dead stub and
  its two no-op call sites, drop unused `trigPoly` exports, rename
  `itcData.reference.test.ts`, fix the AGENTS.md `SectionHeader` doc-drift.

_Exit:_ CI runs ESLint + reproducible install + coverage; obvious dead code gone.

### Wave 2 — De-duplicate the safety-net & primitives (behaviour-preserving) · ~2–3 days
- **H7** Consolidate the 12 hand-rolled markdown parsers into the existing
  `testUtils/birssTableParsers.ts`; delete local redefinitions. (Pure test refactor,
  self-verifying.)
- **H3** Extract one rotation/matmul module (`Matrix3x3` + generic multiply) and have
  `tensorProjection` + `symbolicProjection` consume it.
- **M1, M4, L3, L4** Extract the shared basis-reducer, the `\chi=…` relation
  formatter, one epsilon module, and the field-label map + a `toFlatIndex` inverse to
  `getIndices`.

_Exit:_ core linear-algebra and formatting primitives exist once; fixtures stay green.

### Wave 3 — Tame the numeric/symbolic split (highest liability) · ~3–5 days
- **H2** Unify `calculateSHGExpressions` / `calculateSymbolicSHGExpressions` behind a
  generic scalar/semiring interface (`number` and `TrigPoly` as two instances) so the
  contraction logic exists once. This is the biggest single win but the riskiest —
  extend `rotatedSHG.fixtures.ts` first and keep both paths' outputs pinned during the
  migration. Land via PR (physics-output rule).
- **M2, M3** Follow with the two remaining long/complex formatters
  (`formatSubstitutedPolySum`, `formatMatrixSymbol`), each behind its own fixtures.

_Exit:_ a physics change to the SHG contraction is made once, not twice.

### Wave 4 — Component structure & types · ~3–4 days
- **M5** `useMemo` the grouped prop objects in `App.tsx` (trivial, do early).
- **M6** Move the SHG-intensity sweep out of `useSimulatorState` into `services/`;
  make the hook accept `TensorConfig`/`OrientationState`/`SimulationState`.
- **H4, H5** Split `TablesPage` (extract linalg to `tensorForms`,
  content/sub-views to components) and `HelpPage` (content → `data/`, one component
  per tab).
- **M7, M8, L5, L7** Extract `<NoComponentsFallback>`, return structured null-state
  from the service (kill string-scanning), and fold the inlined section headers /
  repeated markup into shared components.
- **H6, M12, L10** Introduce `type CrystalSystem` and `GroupKey` unions and a shared
  `parity`/`timeParity` type; give `types.ts` (or a new `domain/` types module) the
  scattered domain types; tighten `TENSOR_META`.

_Exit:_ no view component exceeds ~250 lines; group keys are compile-time checked.

### Wave 5 — Longer-horizon / optional · schedule as capacity allows
- **H8** Add jsdom + testing-library and interaction tests for `App` routing/search,
  `useSimulatorState`, and the Calculator/Tables state flows (the untested surface).
- **M13** Decide one policy for the group registry: generate the hand-transcribed maps
  (`groupNotation.ts`) from the vendored tables like `table7Data.ts`, or accept
  hand-maintenance but centralize a single source-of-truth registry object.
- **L8** A11y pass on tab semantics and slider labels.
- **L9, L11, L13** Narrow the `as any`, code-split `recharts`, tighten the `@` alias,
  and add a lightweight doc-sync check (or trim `TODO-next.md`).

### Sequencing notes
- Waves 1–2 are pure-mechanical / test-only and can land as `chore/` + `test/` local
  merges. Wave 3 and the physics-touching parts of Wave 4 are **PR + fixtures-first**
  per the repo's physics-output rule.
- Rough total for Waves 1–4: **~9–13 engineer-days**; Wave 5 is open-ended.
- Biggest ROI if time-boxed: **Wave 1 (tooling) + H2 (SHG unification) + H7 (test
  parser consolidation)** — they remove the most future rework per unit effort.
