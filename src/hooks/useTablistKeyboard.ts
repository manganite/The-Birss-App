import { useCallback } from 'react';

/**
 * Keyboard handler for an ARIA tablist container (WAI-ARIA APG "Tabs" pattern,
 * automatic-activation / selection-follows-focus variant).
 *
 * Attach the returned handler to the `role="tablist"` element's `onKeyDown`:
 * - ArrowRight / ArrowLeft move to the next / previous tab, WRAPPING at the ends.
 * - Home / End move to the first / last tab.
 * - All other keys pass through untouched.
 *
 * It operates on the `[role="tab"]` descendants of `event.currentTarget` in DOM order, so any
 * non-tab controls inside the container (e.g. an interleaved TermInfo button) are skipped. The
 * reference point is the currently selected tab (`aria-selected="true"`), falling back to the event
 * target when it is itself a tab. The target tab is activated by `.click()` (reusing the existing
 * onClick, so selection follows focus) and then `.focus()`ed; `preventDefault()` fires only for the
 * four handled keys. The hook is stateless with respect to React -- it derives everything from the
 * live DOM -- and is a hook only for call-site ergonomics (stable identity via useCallback).
 */
export function useTablistKeyboard() {
  return useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    const { key, currentTarget, target } = event;
    if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') return;

    const tabs = Array.from(currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
    if (tabs.length === 0) return;

    const current = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const from = current === -1 ? tabs.indexOf(target as HTMLElement) : current;
    const anchor = from === -1 ? 0 : from;

    let next: number;
    switch (key) {
      case 'ArrowRight':
        next = (anchor + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        next = (anchor - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    tabs[next].click();
    tabs[next].focus();
  }, []);
}
