# The Birss App — Agent Guidelines

Scientific React SPA that calculates non-zero susceptibility tensor components (ED, MD, EQ) and SHG source terms for all 32 crystallographic and 122 magnetic point groups.

## Current work (next cycle)

**Start with `STATUS.md` (root)** — the canonical index for the current cycle:
what is done, what is open, and what the standing decisions are.

The detailed backlog lives in two companion documents (derivation and per-item
detail):

- **`docs/planning/TODO-next.md`** — the detailed findings: per-item problem, fix,
  file:line anchors, acceptance, and a `Status:` tag (`Decided` / `Open decision` /
  `Derivation / verification pending`). Items have stable IDs (`A#` = bug,
  `B#` = change). An "Open points at a glance" list near the top shows what still
  needs a decision or derivation.
- **`docs/planning/ROADMAP-next.md`** — the execution plan: items grouped into **Waves A–E** by
  dependency and risk, with a dependency graph, release cadence, and a per-item
  contract. Start here to decide *what to pick up next*.

Working rules for this cycle:

- **Orientation-(in)dependence split** is the organising principle: the Calculator
  owns crystal-frame, orientation-free results (tensor form, induced response, source
  term *frozen at the cut*); the Simulator owns lab-frame, orientation-dependent
  results (*swept* source terms, polarimetry). Group / tensor type / time-reversal /
  setting are a shared group context.
- **Safety net first.** For any data/math item, extend the relevant golden / rotated
  fixture (`goldenTensors.fixtures.ts`, `rotatedSHG.fixtures.ts`) **first** and require
  it green, then change code. Fixtures come from literature, never from app output.
- **Resolve before coding.** An item tagged *Open decision* or *Derivation /
  verification pending* must have that resolved (and its `Status:` updated) before its
  implementation branch opens.
- **Verify, don't guess.** Check claims against the code (or ask) before acting;
  several `docs/planning/TODO-next.md` items are marked *provisional* for exactly this reason.
- **Ask when in doubt.** If the intent, rationale, or scope of a TODO or ROADMAP
  item is unclear, ask for clarification rather than interpreting on your own. The
  items encode specific design decisions and physics reasoning — guessing risks
  implementing the wrong thing.

## Build & Dev

```bash
npm install          # install dependencies
npm run dev          # dev server on http://localhost:3000
npm run build        # production build → dist/
npm run lint         # TypeScript type-check only (tsc --noEmit)
npm run test         # run the Vitest suite once
npm run test:watch   # run Vitest in watch mode
npm run deploy       # build + publish to GitHub Pages via gh-pages
```

`npm run lint` and `npm run test` are the automated quality gates (run in CI via `.github/workflows/ci.yml`, which also regenerates `birss-tables/table-nomenclature.md` from `birss-tables/tools/generate_nomenclature.py` and fails the build on drift; CI additionally runs `npm run build`). Tests for `tensorCalculator.ts` live in `src/services/tensorCalculator.test.ts` and cover: group-order sanity for all 122 point groups, parity invariants (e.g. ED vanishes for centrosymmetric groups, EQ never vanishes, grey groups `G1'` reproduce `G` for i-type), and `formatCoeff`/`isCentrosymmetric` unit tests, plus the convention-audit guardrails: ~150 table-anchored golden fixtures (`goldenTensors.fixtures.ts`, detailed below), the two reference tests (`nomenclature.reference.test.ts`, `operatorSet.reference.test.ts` — parse `birss-tables/table-nomenclature.md` at test time), the grey-c≡0 and particularization checks, and three hand-Birss end-to-end tests (`handBirss.e2e.test.ts`); see `docs/findings/AUDIT-convention-references.md` for the full coverage matrix.

`src/services/goldenTensors.fixtures.ts` + `goldenTensors.test.ts` extend this with golden component-relation fixtures for **every Type-III crystal family**, c-type ED (incl. the canonical Cr2O3 `-3'm'` magnetoelectric SHG tensor), and the axial (MD) `det(g)` branch — each pinning down the *identity* of a hand-curated `GENERATORS` entry, not just its order or invariants. Most of these fixtures are derived directly from each group's generators via the rank-3/4 transformation law (Birss, *Symmetry and Magnetism* (1966), eq. 3.22/3.27), independently re-implemented and calibrated against the six pre-existing fixtures; see each fixture's `source`/`note` for the citation and any group-theory cross-checks. 11 of these (the six generator-set corrections' fixtures plus five more) carry a `// VERIFIED:` comment — signed off directly against printed Birss Table 4e (2026-07-02); the rest rely on the independently re-implemented transformation law and calibration against those, not a direct book read.

## Architecture

```
src/
  types.ts                       # Shared prop interfaces (TensorConfig, OrientationState, SimulationState), domain unions (CrystalSystem, Parity, TimeParity, GroupType, GroupKey) and TENSOR_META
  data/pointGroups.ts            # Static registry of all 122 magnetic point groups
  services/
    tensorCalculator.ts          # Thin barrel re-exporting the public API below
    symmetryGroups.ts            # Matrix algebra, GENERATORS table, group closure, getSymmetryOperations
    tensorProjection.ts          # Numeric tensor projection (transform/average/basis), SHG polynomials, lab-frame vectors
    orientation.ts               # Miller index → preset angles (hklToPresetAngles), azimuth-zero convention
    trigPoly.ts                  # Trigonometric polynomial algebra for symbolic rotation angles (phiX, phiY, psi)
    symbolicProjection.ts        # Symbolic SHG source terms — parallel path producing TrigPoly coefficients
    trigPolyFormat.ts            # LaTeX formatting for TrigPoly and SymPoly expressions
    latexFormatting.ts           # LaTeX rendering: calculateTensorComponents, formatSubstitutedPolySum
    simulatorEngine.ts           # Pure polarimetry intensity sweep (extracted from useSimulatorState)
  components/
    MathComponents.tsx           # Shared KaTeX render helpers (TensorTerm, FormatPointGroup, SymmetryOperation)
    CalculatorPage.tsx           # Calculator page — tensor components, induced response, source terms
    PointGroupExplorer.tsx       # Explorer page — browse & filter the 122 groups
    OperationsModal.tsx          # Modal showing symmetry operations for a selected group
    SimulatorPage.tsx            # Simulator page — radar chart polarimetry, Fourier series formulas
    TablesPage.tsx               # Tables page — interactive Birss-table lookup
    tables/                      # Tables-page sub-views (LookupControls, LookupChain, TensorFormResult, GroupSharingList, …)
    help/                        # Help-page per-tab sub-views (Overview, Conventions, Physics, Simulation, Deeper)
    HelpPage.tsx                 # Help page shell — composes the per-tab views under help/
  App.tsx                        # Root: global state, tab routing, header, footer
```

All cross-page state (selected group, tensor type, time-reversal, rotation angles, amplitudes, phases) lives in `App.tsx` and is passed down via grouped prop objects (`TensorConfig`, `OrientationState`, `SimulationState` from `types.ts`). There is no state management library.

### `services/` module dependency direction

`tensorCalculator.ts` is a barrel: it only re-exports symbols from the modules
below and should stay short. Dependencies flow one way —
**`trigPolyFormat` → `symbolicProjection` → `trigPoly`** and
**`latexFormatting` → `tensorProjection` → `symmetryGroups`** (formatting may import
physics, never the reverse). The symbolic path is a parallel layer that imports from
the numeric path but never the other way round:

- **`symmetryGroups.ts`** — `Matrix3x3`, the `GENERATORS` table, matrix algebra
  (`multiply`/`det`), group closure + caching, `isCentrosymmetric`,
  `getSymmetryOperations`, and the shared `EPSILON`/`AXIS_EPSILON` constants. No
  dependencies on the other modules.
- **`tensorProjection.ts`** — the numeric projection core
  (`calculateTensorBasisResults`, `calculateSHGExpressions`, `getLabFrameVectors`,
  `transformTensor`/`averageTensor`), plus four dependency-free leaf helpers
  (`getIndices`, `getLabel`, `formatCoeff`, `cleanupExpressionSigns`). These leaves
  are needed by both this module (`calculateSHGExpressions`, `getLabFrameVectors`)
  and by `latexFormatting.ts` (`formatResults`, `formatSubstitutedPolySum`); per the
  "shared utilities live in the lower module" rule they're defined here rather than
  in `latexFormatting.ts`, so that `latexFormatting` can depend on `tensorProjection`
  without creating a reverse dependency. Depends only on `symmetryGroups`.
- **`trigPoly.ts`** — trigonometric polynomial representation (`TrigPoly`) and
  algebra (`trigAdd`, `trigMul`, `trigEval`, `trigSimplify`) for three rotation angles
  (phiX, phiY, psi). No dependencies on other modules.
- **`symbolicProjection.ts`** — `calculateSymbolicSHGExpressions`: builds a
  symbolic rotation matrix (`TrigMat3`) with preset angles numeric and user angles
  symbolic, then contracts source terms with `TrigPoly` coefficients. Depends on
  `trigPoly`, `tensorProjection`, and `symmetryGroups`.
- **`trigPolyFormat.ts`** — `formatTrigPoly` and `formatSymbolicSourceTerm`:
  LaTeX rendering for `TrigPoly` and `SymPoly` values. Depends on
  `trigPoly`, `symbolicProjection`, and `tensorProjection` (for `formatCoeff`).
- **`latexFormatting.ts`** — `calculateTensorComponents` (thin wrapper around
  `calculateTensorBasisResults` + a local `formatResults`) and
  `formatSubstitutedPolySum`. Depends on `tensorProjection` and `symmetryGroups`.

## Key Conventions

### Convention references (authoritative — read before touching group data or tensor logic)
The following cross-linked documents are the single source of truth for how the
app maps onto the Birss/ITC conventions:
- **`docs/references/BIRSS-APP-CONVENTIONS-REFERENCE.md`** — the convention contract &
  verification ladder. Self-contained: axis orientation per crystal system, the σ(0)–σ(9)
  generator pool, bracketed/rotated groups, tensor particularization, and a per-step
  anti-circular test. Where Birss and ITC diverge, **Birss wins**.
- **`birss-tables/table-nomenclature.md`** — the 122-group table: app key → Schoenflies
  → full HM → Shubnikov → symmetry operators → generators σ(N)/σ'(N) → type, with every
  App↔Birss↔ITC divergence flagged.
- **`docs/references/BIRSS-ITC-CONVENTION-DIVERGENCES.md`** — authoritative for all
  Birss↔ITC symbol/orientation questions: the two string divergences, the 30° position-2
  offset (trigonal/hexagonal), monoclinic c-vs-b, and Birss's Table-7 parenthesis
  (rotated-axes) semantics. Consult before interpreting ITC sources or any user report of
  a "wrong" symbol/component. Evidence record:
  `docs/findings/SESSION-FINDINGS-2026-07-04-6pmmpm-and-table7.md`.

Together they trace the chain **app key → Schoenflies / full HM → operators / generators →
tensor form**. All expected values are anchored to the frozen Birss tables (`birss-tables/`,
in-repo) or ITC 1.5.2.3 — **never** derived from the app's own output (anti-circularity).

### Physics / Domain
- **Tensor types**: `'ED'` (Electric Dipole, χ²), `'MD'` (Magnetic Dipole), `'EQ'` (Electric Quadrupole).
- **Time-reversal**: `'i'` = time-even (i-type), `'c'` = time-odd (c-type). Represented by `TensorTimeReversal` in `tensorCalculator.ts`.
- **Point group types**: `'I'` Standard (32), `'II'` Gray (32), `'III'` Black & White (58) — defined in `PointGroupData.type`.
- Light propagates along the **Z-axis** in the Lab Frame → `E_Z = 0` by convention throughout.
- Crystal rotation is parameterised by **phiX**, **phiY** (lab-fixed tilts) and **psi** (crystal-tied azimuth), in degrees -- see `trigPoly.ts` / `tensorProjection.ts` for the composition `R = Ry(phiY) * Rx(phiX) * Rz(psi) * R_preset`.
- Anti-unitary operations (time-reversal combined) are flagged via `isAntiUnitary?: boolean` on the `Matrix3x3` interface.

### Math rendering
- All in-line math uses `<InlineMath math="..." />` from `react-katex`.
- Block math uses `<BlockMath math="..." />`.
- `import 'katex/dist/katex.min.css'` is required wherever KaTeX components are used.
- The `FormatPointGroup` component converts Hermann–Mauguin notation to KaTeX (e.g. `-6` → `\bar{6}`).

### Styling
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin, not the classic PostCSS config).
- Global palette: background `#E4E3E0`, foreground/text `#141414`.
- No CSS Modules, no Styled Components. All styling is inline Tailwind utility classes.
- One custom utility in `index.css`: `.overline` for text-decoration.
- **Section header pattern**: `text-xs uppercase tracking-[0.2em] text-ink/70 flex items-center gap-2` — use the shared `SectionHeader` component from `notation.tsx` rather than inlining this string.

### Component patterns
- All page components receive state as grouped prop objects from `App.tsx` (`TensorConfig`, `OrientationState`, etc.) — no Context API or Zustand.
- `useMemo` is used extensively in `SimulatorPage.tsx` and `App.tsx` for expensive tensor calculations.
- Animations use `motion` from `motion/react` (Framer Motion v12), with `AnimatePresence` for exit animations.
- Icons come exclusively from `lucide-react`.

### Path aliases
- `@/*` maps to `src/` (defined in both `tsconfig.json` and `vite.config.ts`).

## Git Workflow & Releases

Single-maintainer project using **GitHub Flow + Semantic Versioning**. `main` is
always shippable (and CI-checked via `.github/workflows/ci.yml`), but merging to it
does **not** by itself go live — the deployed site only updates on a `vX.Y.Z` release
tag (see `.github/workflows/deploy.yml`). This decouples "merged" from "released":
`main` can accumulate tested changes, and going live is the deliberate act of cutting
a release (see "Cutting a release" below). **Never commit directly to `main`.**

### GitHub hygiene
Regularly check the GitHub repository for items that need attention:
- **PR review comments** (Copilot, human reviewers) — address before merging.
- **Code scanning alerts** — fix promptly; CodeQL runs on every push to `main` and weekly.
- **Dependabot alerts and PRs** — review vulnerability alerts and routine version-update PRs.
- **Open issues** — triage and respond.

### Branches
- Every change goes through a short-lived branch, merged back into `main` with
  `--no-ff` (keeps a merge commit marking the change as a unit) and deleted
  afterward. There is no `develop` branch.
- Prefixes (lowercase, words separated by hyphens):

  | Prefix      | Purpose                                     | Example                          |
  |-------------|---------------------------------------------|----------------------------------|
  | `feature/`  | New functionality                           | `feature/domain-export`          |
  | `fix/`      | Bug fix                                     | `fix/phase-angle-rounding`       |
  | `hotfix/`   | Urgent fix applied directly to a release    | `hotfix/crash-on-export`         |
  | `refactor/` | Behavior-preserving restructuring           | `refactor/signature-migration`   |
  | `docs/`     | Documentation-only changes                  | `docs/oblique-axis-convention`   |
  | `chore/`    | Tooling, CI, dependencies, non-code cleanup | `chore/color-tokens`             |

```bash
git switch main && git pull
git switch -c feature/<short-name>
# ... work, commit (Conventional Commits — see below) ...
```

### Merging: local merge vs. pull request

Use the merge method that fits the risk level of the change:

| Change type | Method | Why |
|---|---|---|
| Physics output (generators, tensor logic, group data) | **Pull request** | Gets Copilot review, CodeQL runs pre-merge, creates auditable record for changes that affect calculated results |
| New features, UI changes, refactors touching multiple files | **Pull request** | Benefits from automated review and a visible diff summary |
| Chores (CI config, dependency bumps, doc formatting, typos) | **Local merge** | Low risk, no review needed, faster |

**Pull request workflow:**
```bash
git push -u origin feature/<short-name>
gh pr create --title "..." --body "..."
# Wait for Copilot review + CI checks; address comments
# Merge via GitHub UI (use "Create a merge commit", not squash)
# Delete remote branch via GitHub UI
git switch main && git pull
git branch -d feature/<short-name>
```

**Local merge workflow** (still merges a branch — never commit directly on main):
```bash
# Before merging: ensure `npm run lint && npm run test` pass locally
git switch main && git pull
git merge --no-ff feature/<short-name>
git branch -d feature/<short-name>
git push origin main
```

### Versioning
- The app version (`package.json` `version`) is injected into the footer via Vite's `define` (`__APP_VERSION__`, declared in `src/vite-env.d.ts`). Keep `package-lock.json`'s top-level `version` in sync (`npm install --package-lock-only`).
- Follow [Semantic Versioning](https://semver.org/):

  | Change                                        | Bump  | Example           |
  |------------------------------------------------|-------|-------------------|
  | New feature                                     | MINOR | `v1.2.0 → v1.3.0` |
  | Corrected error in calculated output            | PATCH | `v1.3.0 → v1.3.1` |
  | Incompatible change to output format/values     | MAJOR | `v1.3.1 → v2.0.0` |

### Changelog
- On every user-facing change (behavior, UI, or capability — Added/Changed/Fixed/Removed in the Keep a Changelog sense), add an entry under `## [Unreleased]` in `CHANGELOG.md`. For corrections to calculated output, record **what** was wrong and **from which version** it's fixed — needed to interpret old results correctly later. Internal-only changes (chores, tests, CI, tooling/config with no runtime effect) generally don't need an entry.

### Cutting a release
1. Bump `version` in `package.json`/`package-lock.json`.
2. Move the `Unreleased` entries under a new `## [x.y.z] - YYYY-MM-DD` heading, and update the compare/release links at the bottom of `CHANGELOG.md`.
3. Bump `STATUS.md`'s current-release block (the `## Current release: vX.Y.Z` heading, its one-line summary, the `_Last updated:_` date, and demote the previous release to a `### vX.Y.Z` past entry). Keeps the canonical cycle index from going stale.
4. Commit, then on `main`: `git tag -a vX.Y.Z -m "..."` and `git push origin main --tags`.
5. Pushing the tag triggers two workflows: `release.yml` creates the GitHub Release automatically, using the matching `## [x.y.z]` section of `CHANGELOG.md` as the release notes; `deploy.yml` builds and publishes the tagged commit to GitHub Pages — this is the point where the live site actually updates.

### Commit messages
- [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): lowercase summary`, e.g. `feat(simulator): add polarimetry tooltip`. Common types are `feat`, `fix`, `refactor`, `test`, `docs`, `chore`. Scope is optional and usually the affected component/module. Keep the summary line short (~72 chars); use the body for details.
- For fixes affecting calculated output, mention which output values are affected.

### License
- MIT (`LICENSE` at repo root). Keep the `@license SPDX-License-Identifier: MIT` header in `App.tsx` consistent with this.

### Release checklist
- [ ] All feature/fix branches merged (`--no-ff`) and deleted
- [ ] `main` up to date locally (`git pull`)
- [ ] `npm run lint && npm run test` pass
- [ ] Version bumped per SemVer
- [ ] `CHANGELOG.md` updated
- [ ] `STATUS.md` current-release block bumped (heading, summary, `_Last updated:_`, previous release demoted)
- [ ] Tag created and pushed with `--tags` (triggers the GitHub Release via `release.yml` and the live deploy via `deploy.yml`)

## Important Constraints

- **No backend**: all tensor math runs client-side in `tensorCalculator.ts`. Do not add server-side routes.
- **PWA**: the app registers a service worker (`vite-plugin-pwa`). Manifest assets (`favicon.svg`, `icon-192.svg`, `icon-512.svg`) live in `public/`. Do not rename or remove them.
- **TypeScript strict mode is on** (`strict: true` in `tsconfig.json`), enforced by `npm run lint` in CI.
- **Vitest is the test framework** — see `npm run test` above. Do not switch to Jest or another runner without explicit instruction.
