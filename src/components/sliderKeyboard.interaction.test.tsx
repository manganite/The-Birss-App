/**
 * @vitest-environment jsdom
 *
 * Interaction coverage for the Simulator sliders' coarse-step keyboard contract (A1).
 *
 * The Shift+Arrow coarse steps are React onKeyDown handlers (jsdom-observable): amplitude steps
 * +/-0.05 clamped to [0,1]; phase steps +/-15 clamped to [0,360]. The native fine-step path
 * (unshifted arrows on a range input) is browser behavior that jsdom does not implement, so it is
 * deliberately NOT tested here (T5a boundary).
 *
 * Route note: the Simulator renders ENABLED sliders only once a group with at least TWO
 * independent components at the current orientation is selected -- with a single component the
 * amplitude/phase are degenerate and the controls are `disabled` (an inert slider ignores the
 * keyboard). The fixture group is `1` (triclinic, 6 ED components at normal incidence). Two
 * physics facts drive this choice: 4mm has NO in-plane components at normal incidence (every ED
 * component carries a z-index -- the T5a lesson), and 3m has exactly ONE (chi_xxx), which the
 * single-component branch disables; `1` is the smallest classical group with multiple. We select
 * it through the F1-pinned combobox path (query "1" -> first option is group `1`), then await the
 * lazy-loaded SimulatorPage before touching the sliders. Sliders are found via raw DOM queries on
 * their E24 aria-labels (MathML-safe; see the App.interaction docblock).
 *
 * Layout note: TensorComponentControls renders two layouts that are both present in the jsdom DOM
 * (Tailwind display classes are inert without a stylesheet) -- a mobile block (`md:hidden`, first
 * in DOM) WITHOUT the Shift+Arrow handlers, and a desktop block (`hidden md:block`, last in DOM)
 * WITH them. We therefore target the LAST slider for a component (the desktop instance); both
 * layouts share the same per-component state, so the assertion holds on any instance.
 *
 * Explicit 30 s timeouts throughout (T1/E29 lesson).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

afterEach(cleanup);
const TIMEOUT_MS = 30000;

const navButton = (name: string) => screen.getAllByRole('button').find((b) => b.textContent === name);
const ampSliders = () =>
  Array.from(document.querySelectorAll<HTMLInputElement>('input[type="range"][aria-label^="Amplitude"]'));
const phaseSliders = () =>
  Array.from(document.querySelectorAll<HTMLInputElement>('input[type="range"][aria-label^="Phase"]'));

/** Select group `1` via search, navigate to the Simulator, and await the (lazy) enabled sliders. */
async function openSimulatorWithSliders(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  const combobox = screen.getByRole('combobox');
  await user.click(combobox);
  await user.keyboard('1');
  await user.keyboard('{ArrowDown}{Enter}'); // selects group `1` (navigates explorer -> calculator)
  await user.click(navButton('Simulator')!);
  await waitFor(() => expect(ampSliders().filter((s) => !s.disabled).length).toBeGreaterThan(0), { timeout: 8000 });
}

describe('Simulator slider coarse-step contract', () => {
  it(
    'Shift+ArrowLeft steps an amplitude slider down by the coarse step',
    async () => {
      const user = userEvent.setup();
      await openSimulatorWithSliders(user);

      const amp = ampSliders().at(-1)!; // desktop instance (carries the Shift handler)
      expect(amp.value).toBe('1'); // default amplitude
      amp.focus();
      await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');

      // 1 + (-1)*0.05 = 0.95 (down is the observable direction; up would clamp at 1).
      expect(amp.value).toBe('0.95');
    },
    TIMEOUT_MS,
  );

  it(
    'Shift+ArrowRight steps a phase slider up by the coarse step',
    async () => {
      const user = userEvent.setup();
      await openSimulatorWithSliders(user);

      const phase = phaseSliders().at(-1)!; // desktop instance (carries the Shift handler)
      expect(phase.value).toBe('0'); // default phase
      phase.focus();
      await user.keyboard('{Shift>}{ArrowRight}{/Shift}');

      // 0 + 1*15 = 15 (up is the observable direction; down would clamp at 0).
      expect(phase.value).toBe('15');
    },
    TIMEOUT_MS,
  );
});
