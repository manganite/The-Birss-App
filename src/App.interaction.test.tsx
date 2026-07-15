/**
 * @vitest-environment jsdom
 *
 * App-level interaction smoke (T5a): the convention toggle's persistence wiring and the group
 * search combobox. These cover the two pieces of App state that survive a reload or drive
 * keyboard-only navigation -- the parts a pure-function test cannot reach.
 *
 * Two properties of the wiring keep this deterministic:
 * - The default `explorer` view is EAGERLY imported (lazy() covers only the other views), so
 *   rendering <App/> resolves no Suspense boundary here.
 * - The only timer in the search wiring is the 200 ms blur delay, so these tests never blur the
 *   input themselves. (The Escape handler does blur, but it clears `isSearchFocused`
 *   synchronously first, so the assertion holds and the delayed callback is a no-op re-set.)
 *
 * ENVIRONMENT LIMITATION -- do not "fix" this by reaching for getByRole(role, { name }):
 * accessible-name queries are unusable in this file while KaTeX MathML is in the tree. The
 * Explorer renders group symbols via react-katex, which emits MathML (<math>, <semantics>,
 * <mrow>, ...); jsdom does not implement `style` on MathMLElement, so getComputedStyle() throws on
 * those nodes, and dom-accessibility-api's isHidden() calls getComputedStyle while computing a
 * name -- so any name-matching query crashes as it walks the tree. (Reproduced on jsdom 26 and 29
 * alike; it is not a version regression.) This is a TEST-ENVIRONMENT limitation, NOT an app
 * accessibility defect: the buttons' text content is their accessible name in a real browser, and
 * such queries would work under a real-browser runner. Hence the convention buttons are located by
 * scoped text below, while the combobox uses a role query WITHOUT a name option (which does not
 * invoke accessible-name computation and therefore works).
 *
 * Assertions read attributes directly via getAttribute -- no @testing-library/jest-dom.
 * Explicit 30 s timeouts throughout (T1/E29 lesson: survive full-suite contention from day one).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const TIMEOUT_MS = 30000;
const CONVENTION_STORAGE_KEY = 'birss-app:convention';

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

/** The convention toggle's container (App.tsx: role="group" aria-label="Symbol convention"). */
function conventionGroup(): HTMLElement {
  const group = screen.getAllByRole('group').find((el) => el.getAttribute('aria-label') === 'Symbol convention');
  if (!group) throw new Error('convention toggle group not found');
  return group;
}

/** Located by scoped text, not accessible name -- see the ENVIRONMENT LIMITATION note above. */
const conventionButton = (label: 'Birss' | 'ITC') => within(conventionGroup()).getByText(label);

describe('App — convention persistence (jsdom)', () => {
  it(
    'defaults to the Birss convention',
    () => {
      render(<App />);

      expect(conventionButton('Birss').getAttribute('aria-pressed')).toBe('true');
      expect(conventionButton('ITC').getAttribute('aria-pressed')).toBe('false');
    },
    TIMEOUT_MS,
  );

  it(
    'restores a persisted ITC convention',
    () => {
      localStorage.setItem(CONVENTION_STORAGE_KEY, 'itc');
      render(<App />);

      expect(conventionButton('ITC').getAttribute('aria-pressed')).toBe('true');
      expect(conventionButton('Birss').getAttribute('aria-pressed')).toBe('false');
    },
    TIMEOUT_MS,
  );

  it(
    'persists a convention change',
    async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(conventionButton('ITC'));

      expect(conventionButton('ITC').getAttribute('aria-pressed')).toBe('true');
      expect(localStorage.getItem(CONVENTION_STORAGE_KEY)).toBe('itc');
    },
    TIMEOUT_MS,
  );
});

describe('App — group search combobox (jsdom)', () => {
  it(
    'typing filters the group search',
    async () => {
      const user = userEvent.setup();
      render(<App />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      await user.type(combobox, '4mm');

      expect(combobox.getAttribute('aria-expanded')).toBe('true');
      expect(document.getElementById('group-option-4mm')).not.toBeNull();
    },
    TIMEOUT_MS,
  );

  it(
    'supports keyboard navigation and closes on a synchronous Escape',
    async () => {
      const user = userEvent.setup();
      render(<App />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      await user.type(combobox, '4mm');

      // ArrowDown highlights the first filtered option.
      await user.keyboard('{ArrowDown}');
      const firstOption = within(screen.getByRole('listbox')).getAllByRole('option')[0];
      expect(combobox.getAttribute('aria-activedescendant')).toBe(firstOption.id);

      // Escape clears the open state synchronously.
      await user.keyboard('{Escape}');
      expect(combobox.getAttribute('aria-expanded')).toBe('false');
    },
    TIMEOUT_MS,
  );

  it(
    'selecting a result with Enter propagates the selection',
    async () => {
      const user = userEvent.setup();
      render(<App />);
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      await user.keyboard('4mm');
      await user.keyboard('{ArrowDown}{Enter}');

      // handleSelect clears the query and closes the list synchronously (no timer involved).
      expect((combobox as HTMLInputElement).value).toBe('');
      expect(combobox.getAttribute('aria-expanded')).toBe('false');

      // ... navigates explorer -> calculator (semantic, name-free landmark) ...
      const calculatorNav = screen.getAllByRole('button').find((b) => b.textContent === 'Calculator');
      expect(calculatorNav?.getAttribute('aria-current')).toBe('page');

      // ... and the selected group is reflected in the UI (plain-text query -- MathML-safe).
      expect((await screen.findAllByText(/4mm/)).length).toBeGreaterThan(0);
    },
    TIMEOUT_MS,
  );
});
