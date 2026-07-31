/**
 * @vitest-environment jsdom
 *
 * Interaction coverage for the Nye dot-diagram view on the Tables page: the toggle beside the
 * symbolic representation, its session persistence, the legend, the per-cell descriptions, the
 * composite marker with its relation, and the keyboard route through the grid.
 *
 * What these pin is the WIRING, not the physics: which cells are drawn and how they are partitioned
 * comes from `services/nyeScheme.ts` (unit-anchored in `nyeScheme.test.ts`) and is gated against
 * print in `yarivT161.reference.test.ts`. Nothing here re-derives a form.
 *
 * Route note: the toggle exists only for the rank/intrinsic combinations that have a scheme geometry
 * (rank 2; rank 3 `jk`; rank 4 `ij_kl`/`voigt`) AND only when the form does not vanish. The Tables
 * page opens on rank 3 `jk`, so the default route already has it; the two negative controls drive
 * the page to a combination with no geometry, and to a group whose form is identically zero.
 *
 * ENVIRONMENT LIMITATION -- do not "fix" this by reaching for getByRole(role, { name }):
 * accessible-name queries are unusable here while KaTeX MathML is in the tree. TablesPage renders
 * group symbols and relations via react-katex, which emits MathML; jsdom does not implement `style`
 * on MathMLElement, so getComputedStyle() throws on those nodes, and dom-accessibility-api calls it
 * while computing a name -- any name-matching query crashes as it walks the tree. Same limitation,
 * same reasoning as `App.interaction.test.tsx`; it is a TEST-ENVIRONMENT limitation, not an app
 * accessibility defect. Controls are therefore located by exact button text or by attribute
 * selector, and assertions read attributes directly via getAttribute -- no @testing-library/jest-dom.
 *
 * Explicit 30 s timeouts throughout (T1/E29 lesson: survive full-suite contention from day one).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TablesPage } from './TablesPage';
import { POINT_GROUPS } from '../data/pointGroups';
import type { TensorConfig } from '../types';

const TIMEOUT_MS = 30000;
const FORM_VIEW_STORAGE_KEY = 'birss-app:tables-form-view';

// Explicit cleanup, as in the other interaction suites: this project runs vitest without
// `globals`, so testing-library's automatic afterEach teardown is not registered.
afterEach(cleanup);
beforeEach(() => sessionStorage.clear());

const group = (name: string) => POINT_GROUPS.find((p) => p.name === name)!;

const config: TensorConfig = {
  type: 'ED',
  setType: () => {},
  timeReversal: 'i',
  setTimeReversal: () => {},
  setting: 1,
  setSetting: () => {},
  convention: 'birss',
  setConvention: () => {},
};

const renderTables = (name: string) =>
  render(<TablesPage selectedGroup={group(name)} tensorConfig={config} onNavigate={() => {}} />);

/** Located by exact button text, not accessible name -- see the ENVIRONMENT LIMITATION note. */
function button(text: string): HTMLButtonElement {
  const found = Array.from(document.querySelectorAll('button')).filter((b) => b.textContent?.trim() === text);
  if (found.length !== 1) throw new Error(`expected exactly one button "${text}", found ${found.length}`);
  return found[0];
}
const maybeButton = (text: string) =>
  Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);

/** The diagram's interactive cells, in reading order. Each carries its component index. */
const cells = () => Array.from(document.querySelectorAll<HTMLButtonElement>('[data-cell]'));
const cell = (index: string) => document.querySelector<HTMLButtonElement>(`[data-cell="${index}"]`);
const describedAs = (index: string) => cell(index)?.textContent?.trim();
/** The diagram's live read-out. Queried by attribute: the sr-only class list carries the same
 *  wording, so an unscoped text query would be ambiguous. */
const status = () => document.querySelector('[data-nye-status]')?.textContent?.trim();

describe('Nye diagram — the toggle', () => {
  it(
    'defaults to the symbolic representation and switches to the diagram',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');

      expect(button('Symbolic').getAttribute('aria-pressed')).toBe('true');
      expect(button('Dot diagram').getAttribute('aria-pressed')).toBe('false');
      expect(cells()).toHaveLength(0);

      await user.click(button('Dot diagram'));

      expect(button('Dot diagram').getAttribute('aria-pressed')).toBe('true');
      expect(button('Symbolic').getAttribute('aria-pressed')).toBe('false');
      expect(screen.getByText(/Glyph vocabulary after Nye/)).toBeTruthy();
    },
    TIMEOUT_MS,
  );

  it(
    'states, in the legend, that the printed line routing is not reproduced',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');
      await user.click(button('Dot diagram'));

      expect(screen.getByText(/routing is not reproduced here/)).toBeTruthy();
      // The i/c-agnosticism declaration.
      expect(screen.getByText(/does not depend on the tensor being time-even or time-odd/)).toBeTruthy();
    },
    TIMEOUT_MS,
  );

  it(
    'persists the choice for the session and restores it on a remount',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');
      await user.click(button('Dot diagram'));
      expect(sessionStorage.getItem(FORM_VIEW_STORAGE_KEY)).toBe('diagram');

      cleanup();
      renderTables('3m');
      expect(button('Dot diagram').getAttribute('aria-pressed')).toBe('true');
      expect(cells().length).toBeGreaterThan(0);
    },
    TIMEOUT_MS,
  );

  it(
    'is not offered where the spec has no scheme geometry',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');
      expect(maybeButton('Dot diagram')).toBeTruthy();

      // Rank 3 with no compressible index pair renders the relation list, which has no diagram.
      await user.click(button('none'));
      expect(maybeButton('Dot diagram')).toBeUndefined();
      expect(cells()).toHaveLength(0);
    },
    TIMEOUT_MS,
  );

  it(
    'is offered for the converse 6x3 layout too, with the pair axis down the rows',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');
      await user.click(button('(ij)k'));
      await user.click(button('Dot diagram'));

      // The transpose of the classical scheme: the same five components of 4mm, read down the
      // pair axis. Class ids follow reading order, so chi_zzz is class 2 here, not class 3.
      expect(cells().map((c) => c.getAttribute('data-cell'))).toEqual(['xxz', 'yyz', 'zzz', 'yzy', 'zxx']);
      expect(describedAs('xxz')).toBe('xxz, class 1, independent component');
      expect(describedAs('zzz')).toBe('zzz, class 2, independent component');
      expect(describedAs('zxx')).toBe('zxx, class 3, equal');
    },
    TIMEOUT_MS,
  );

  it(
    'is not offered when the tensor vanishes identically',
    async () => {
      const user = userEvent.setup();
      // A grey group's c-tensor is identically zero (Table 6 note): the vanishes statement stands
      // alone, with nothing to draw.
      renderTables("4mm1'");
      expect(maybeButton('Dot diagram')).toBeTruthy();

      await user.click(button('c-type'));
      expect(maybeButton('Dot diagram')).toBeUndefined();
      expect(cells()).toHaveLength(0);
    },
    TIMEOUT_MS,
  );
});

describe('Nye diagram — what it renders', () => {
  it(
    'makes every non-vanishing cell a described control, and nothing else',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');
      await user.click(button('Dot diagram'));

      // 4mm rank-3 jk: 5 non-vanishing cells in 3 classes -- {d15,d24}, {d31,d32}, {d33}.
      expect(cells().map((c) => c.getAttribute('data-cell'))).toEqual(['xzx', 'yyz', 'zxx', 'zyy', 'zzz']);
      expect(describedAs('xzx')).toBe('xzx, class 1, independent component');
      expect(describedAs('yyz')).toBe('yyz, class 1, equal');
      expect(describedAs('zxx')).toBe('zxx, class 2, independent component');
      expect(describedAs('zzz')).toBe('zzz, class 3, independent component');

      // The partition is available without a pointer, one entry per class.
      const list = document.querySelector('[aria-label="Component classes"]')!;
      expect(list.querySelectorAll('li')).toHaveLength(3);
      expect(list.querySelectorAll('li')[0].textContent).toContain('Class 1: xzx = yyz');
    },
    TIMEOUT_MS,
  );

  it(
    'reports the class chain when a component is activated',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');
      await user.click(button('Dot diagram'));

      expect(status()).toMatch(/Hover, tap or focus a component/);
      await user.click(cell('xzx')!);
      expect(status()).toBe('Class 1: xzx = yyz');
    },
    TIMEOUT_MS,
  );

  it(
    'distinguishes a sign partner from an equal one',
    async () => {
      const user = userEvent.setup();
      renderTables('3');
      await user.click(button('Dot diagram'));

      // Class 3 rank-3 jk: chi_xyy is the open-circle partner of chi_xxx; chi_yyz equals chi_xzx.
      expect(describedAs('xxx')).toBe('xxx, class 1, independent component');
      expect(describedAs('xyy')).toBe('xyy, class 1, equal and opposite in sign');
      expect(describedAs('yxy')).toBe('yxy, class 1, equal and opposite in sign');
      expect(describedAs('yyz')).toBe('yyz, class 3, equal');
    },
    TIMEOUT_MS,
  );

  it(
    'marks only the class a composite relation fixes, and shows that relation',
    async () => {
      const user = userEvent.setup();
      renderTables('3m');

      // Rank 4 with the pair-only intrinsic symmetry: 3m carries the single composite relation
      // chi_xxxx = chi_xxyy + 2 chi_xyxy, which fixes the xyxy class and no other.
      await user.click(button('4'));
      await user.click(button('(ij)(kl)'));
      await user.click(button('Dot diagram'));

      const marked = cells().filter((c) => /fixed by a relation between classes/.test(c.textContent ?? ''));
      expect(marked.map((c) => c.getAttribute('data-cell'))).toEqual(['xyxy']);

      await user.click(marked[0]);
      // The class chain, then the relation that fixes it (rendered through KaTeX).
      // All four flat components of that class collapse onto the single Voigt cell (xy, xy), so the
      // chain is one cell long; the relation that fixes it follows.
      expect(status()).toMatch(/^Class \d+: xyxy —/);
    },
    TIMEOUT_MS,
  );
});

describe('Nye diagram — keyboard', () => {
  it(
    'moves focus between components with the arrow keys, wrapping at both ends',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');
      await user.click(button('Dot diagram'));

      const grid = cells();
      await user.click(grid[0]);
      expect(document.activeElement).toBe(grid[0]);

      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(grid[1]);

      await user.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(grid[0]);

      await user.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(grid[grid.length - 1]);

      await user.keyboard('{Home}');
      expect(document.activeElement).toBe(grid[0]);
    },
    TIMEOUT_MS,
  );

  it(
    'reports the focused component class, so the keyboard route carries the same information',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');
      await user.click(button('Dot diagram'));

      // Seeded through userEvent, not a bare .focus(): a raw focus call is outside act(), so React
      // would not have flushed the resulting render before the assertion.
      await user.click(cells()[0]);
      expect(status()).toBe('Class 1: xzx = yyz');

      await user.keyboard('{ArrowRight}{ArrowRight}');
      expect(status()).toBe('Class 2: zxx = zyy');
    },
    TIMEOUT_MS,
  );
});
