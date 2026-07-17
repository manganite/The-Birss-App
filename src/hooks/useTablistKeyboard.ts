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
 * It acts ONLY when the event originated from a `[role="tab"]` element of this tablist -- a keydown
 * on an interleaved non-tab control (e.g. the TermInfo button inside PolarimetrySection's tablist)
 * is left untouched, so the arrow keys are not hijacked while that control has focus. It then
 * operates on the `[role="tab"]` descendants of `event.currentTarget` in DOM order; the reference
 * point is the currently selected tab (`aria-selected="true"`), falling back to the originating tab.
 * The target tab is activated by `.click()` (reusing the existing onClick, so selection follows
 * focus) and then `.focus()`ed; `preventDefault()` fires only for the four handled keys. The hook is
 * stateless with respect to React -- it derives everything from the live DOM -- and is a hook only
 * for call-site ergonomics (stable identity via useCallback).
 */
export function useTablistKeyboard() {
  return useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    const { key, currentTarget, target } = event;
    if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') return;

    // Only navigate when the key came from a tab of THIS tablist; otherwise an arrow press on an
    // interleaved non-tab control (e.g. a TermInfo button) would hijack the keys and move the tab.
    const originTab = (target as HTMLElement).closest?.<HTMLElement>('[role="tab"]');
    if (!originTab || !currentTarget.contains(originTab)) return;

    const tabs = Array.from(currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
    if (tabs.length === 0) return;

    const current = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const from = current === -1 ? tabs.indexOf(originTab) : current;
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
