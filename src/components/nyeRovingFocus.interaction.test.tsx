/**
 * @vitest-environment jsdom
 *
 * The Nye dot diagram's TAB CONTRACT, isolated (NYE-F).
 *
 * A roving-focus composite has one defining property: however many interactive cells it holds, it
 * occupies exactly ONE tab stop, and that stop follows the focused cell. Before NYE-F the diagram
 * had the arrow navigation and the focus read-out but no `tabIndex` management at all, so every
 * cell was its own tab stop -- 18 of them for 3m rank 4, where there should be one.
 *
 * This file asserts ONLY that contract. Arrow stepping, wrapping, Home/End, Escape, the class
 * read-out and the hover/tap semantics are pinned in `nyeDiagram.interaction.test.tsx` and are
 * deliberately not re-asserted here, so a failure in this file localises to the tab stop and a
 * failure there localises to navigation.
 *
 * ENVIRONMENT LIMITATION -- do not "fix" this by reaching for getByRole(role, { name }):
 * accessible-name queries are unusable here while KaTeX MathML is in the tree (jsdom does not
 * implement `style` on MathMLElement, so getComputedStyle throws inside name computation). Same
 * limitation and same workarounds as `App.interaction.test.tsx` and
 * `nyeDiagram.interaction.test.tsx`: locate by exact button text or attribute selector, assert via
 * attributes, and seed focus through userEvent rather than a raw `.focus()` -- a bare focus call is
 * outside act(), so React would not have flushed the resulting render before the assertion.
 *
 * Explicit 30 s timeouts throughout (T1/E29 lesson: survive full-suite contention from day one).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TablesPage } from './TablesPage';
import { POINT_GROUPS } from '../data/pointGroups';
import type { TensorConfig } from '../types';

const TIMEOUT_MS = 30000;

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

const cells = () => Array.from(document.querySelectorAll<HTMLButtonElement>('[data-cell]'));

/**
 * The cells that are reachable by Tab. A button with no `tabindex` attribute is tabbable, and
 * `HTMLElement.tabIndex` reports 0 for it -- so this counts correctly both before and after the
 * fix, without assuming which mechanism is in use.
 */
const tabStops = () => cells().filter((c) => c.tabIndex >= 0);

/** Drive the page to a spec, then show the diagram. */
async function showDiagram(user: ReturnType<typeof userEvent.setup>, ...controls: string[]) {
  for (const label of controls) await user.click(button(label));
  await user.click(button('Dot diagram'));
}

describe('Nye diagram — the roving tab contract', () => {
  it(
    '3m rank 4: 18 interactive cells, exactly one tab stop',
    async () => {
      const user = userEvent.setup();
      renderTables('3m');
      await showDiagram(user, '4', '(ij)(kl)');

      // The red-proof case named in the work order: before NYE-F every one of these was its own
      // tab stop, so tabbing through the grid took 18 presses.
      expect(cells()).toHaveLength(18);
      expect(tabStops()).toHaveLength(1);
    },
    TIMEOUT_MS,
  );

  it(
    'holds one tab stop across every diagram geometry',
    async () => {
      const user = userEvent.setup();
      // 3x6 (rank 3 jk, the default spec), then 6x3, then 3x3, then 6x6.
      renderTables('4mm');
      await user.click(button('Dot diagram'));
      expect(tabStops(), '3x6').toHaveLength(1);

      await user.click(button('(ij)k'));
      expect(tabStops(), '6x3').toHaveLength(1);

      await user.click(button('2'));
      expect(tabStops(), '3x3').toHaveLength(1);

      await user.click(button('4'));
      await user.click(button('(ij)(kl)'));
      expect(tabStops(), '6x6').toHaveLength(1);
    },
    TIMEOUT_MS,
  );

  it(
    'starts at the first interactive cell in reading order',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');
      await user.click(button('Dot diagram'));

      // The length assertion is what makes this non-vacuous: without it the test also passes on a
      // grid where every cell is a tab stop, since the first of those is the first cell.
      expect(tabStops()).toHaveLength(1);
      expect(tabStops()[0]).toBe(cells()[0]);
      expect(tabStops()[0].getAttribute('data-cell')).toBe('xzx');
    },
    TIMEOUT_MS,
  );

  it(
    'moves the tab stop to whichever cell the arrow keys focus',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');
      await user.click(button('Dot diagram'));

      await user.click(cells()[0]);
      await user.keyboard('{ArrowRight}{ArrowRight}');

      const focused = document.activeElement as HTMLElement;
      expect(focused.getAttribute('data-cell')).toBe('zxx');
      expect(tabStops()).toHaveLength(1);
      expect(tabStops()[0]).toBe(focused);
    },
    TIMEOUT_MS,
  );

  it(
    'enters the grid at the active cell and leaves it on the next Tab',
    async () => {
      const user = userEvent.setup();
      renderTables('4mm');
      await user.click(button('Dot diagram'));

      // Move the stop away from the default, then tab in from outside the grid.
      await user.click(cells()[0]);
      await user.keyboard('{ArrowRight}');
      const stop = tabStops()[0];
      expect(stop.getAttribute('data-cell')).toBe('yyz');

      // Tab in from before the grid. The number of controls between the toggle and the grid is not
      // this test's business, so walk forward until focus first enters the grid rather than
      // assuming adjacency -- but bound the walk, so a broken contract fails instead of hanging.
      await user.click(button('Dot diagram'));
      let entered: Element | null = null;
      for (let press = 0; press < 12 && entered === null; press++) {
        await user.tab();
        if (cells().includes(document.activeElement as HTMLButtonElement)) entered = document.activeElement;
      }
      expect(entered, 'Tab never reached the grid').not.toBeNull();
      expect(entered).toBe(stop);

      // ...and the next Tab must LEAVE the grid rather than walk its remaining cells. This is the
      // property the pre-NYE-F tests could not see: navigation looked right while the widget still
      // held one tab stop per cell.
      await user.tab();
      expect(cells()).not.toContain(document.activeElement);
    },
    TIMEOUT_MS,
  );

  it(
    'keeps the invariant through Escape and Home/End',
    async () => {
      const user = userEvent.setup();
      renderTables('3');
      await user.click(button('Dot diagram'));

      await user.click(cells()[0]);
      await user.keyboard('{End}');
      expect(tabStops()).toHaveLength(1);
      expect(tabStops()[0]).toBe(cells()[cells().length - 1]);

      await user.keyboard('{Home}');
      expect(tabStops()).toHaveLength(1);
      expect(tabStops()[0]).toBe(cells()[0]);

      // Escape clears the highlight; it must not disturb the tab stop.
      await user.keyboard('{Escape}');
      expect(tabStops()).toHaveLength(1);
      expect(tabStops()[0]).toBe(cells()[0]);
    },
    TIMEOUT_MS,
  );
});
