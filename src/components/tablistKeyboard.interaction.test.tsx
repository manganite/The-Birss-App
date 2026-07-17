/**
 * @vitest-environment jsdom
 *
 * Interaction coverage for the ARIA tabs keyboard pattern (A1) on the HelpPage tablists.
 * Mirrors the existing interaction files (no jsdom shims beyond the environment). The pattern is
 * automatic-activation: moving with the arrow keys / Home / End both moves focus AND selects the
 * tab (via its existing onClick). Both the desktop and mobile Help tablists are in the jsdom DOM
 * (Tailwind's responsive display classes are not applied without a stylesheet), so we target the
 * first (desktop) instance and additionally assert the roving-tabindex invariant across both.
 *
 * Tabs are located with raw DOM queries (`[role="tablist"]` / `[role="tab"]`) rather than
 * getByRole to stay MathML-safe: HelpPage renders KaTeX (MathML) in its panels, and accessible-name
 * / accessibility-tree queries crash on MathMLElement under jsdom (see App.interaction docblock).
 *
 * Explicit 30 s timeouts throughout (T1/E29 lesson).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpPage } from './HelpPage';

afterEach(cleanup);
const TIMEOUT_MS = 30000;

const tablists = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tablist"]'));
const tabsOf = (tablist: HTMLElement) => Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]'));
const selected = (t: HTMLElement) => t.getAttribute('aria-selected') === 'true';

describe('ARIA tabs keyboard pattern (HelpPage tablists)', () => {
  it(
    'ArrowRight moves selection and focus to the next tab',
    async () => {
      const user = userEvent.setup();
      render(<HelpPage />);
      const tabs = tabsOf(tablists()[0]);

      tabs[0].focus();
      expect(selected(tabs[0])).toBe(true); // overview is the default
      await user.keyboard('{ArrowRight}');

      expect(selected(tabs[1])).toBe(true);
      expect(document.activeElement).toBe(tabs[1]);
    },
    TIMEOUT_MS,
  );

  it(
    'arrow navigation wraps at the ends',
    async () => {
      const user = userEvent.setup();
      render(<HelpPage />);
      const tabs = tabsOf(tablists()[0]);
      const last = tabs.length - 1;

      // End -> last, then ArrowRight wraps to first.
      tabs[0].focus();
      await user.keyboard('{End}');
      expect(selected(tabs[last])).toBe(true);
      await user.keyboard('{ArrowRight}');
      expect(selected(tabs[0])).toBe(true);
      expect(document.activeElement).toBe(tabs[0]);

      // ArrowLeft from the first wraps to the last.
      await user.keyboard('{ArrowLeft}');
      expect(selected(tabs[last])).toBe(true);
      expect(document.activeElement).toBe(tabs[last]);
    },
    TIMEOUT_MS,
  );

  it(
    'Home and End jump to the first and last tab',
    async () => {
      const user = userEvent.setup();
      render(<HelpPage />);
      const tabs = tabsOf(tablists()[0]);
      const last = tabs.length - 1;

      tabs[0].focus();
      await user.keyboard('{End}');
      expect(selected(tabs[last])).toBe(true);
      expect(document.activeElement).toBe(tabs[last]);

      await user.keyboard('{Home}');
      expect(selected(tabs[0])).toBe(true);
      expect(document.activeElement).toBe(tabs[0]);
    },
    TIMEOUT_MS,
  );

  it(
    'roving tabindex: exactly one tab is in the tab sequence (both tablist instances)',
    async () => {
      const user = userEvent.setup();
      render(<HelpPage />);
      // Move selection once so the invariant is checked in a non-initial state too.
      const first = tabsOf(tablists()[0]);
      first[0].focus();
      await user.keyboard('{ArrowRight}');

      for (const tablist of tablists()) {
        const tabs = tabsOf(tablist);
        const inSequence = tabs.filter((t) => t.tabIndex === 0);
        expect(inSequence).toHaveLength(1);
        expect(selected(inSequence[0])).toBe(true);
        for (const t of tabs) expect(t.tabIndex).toBe(selected(t) ? 0 : -1);
      }
    },
    TIMEOUT_MS,
  );
});
