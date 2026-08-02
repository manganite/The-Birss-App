/**
 * @vitest-environment jsdom
 *
 * Interaction coverage for the Simulator's sample-orientation widget (SIM-O): that it is mounted
 * where it belongs, that it is live against the slider and cut state, and that its aria-label
 * tracks both.
 *
 * WHAT THIS PINS IS THE WIRING, NOT THE PICTURE. Which corners, faces and axis directions the scene
 * contains is decided in `services/orientationScene.ts` and pinned there against hand-derived
 * values. Nothing here re-derives geometry: the assertions read SVG attributes and compare them
 * before and after a state change, never against an expected coordinate.
 *
 * ENVIRONMENT LIMITATION -- THE DESKTOP-ONLY CUT IS NOT OBSERVABLE HERE. The widget is desktop-only
 * because it sits inside the crystal-rotation controls' unconditional `hidden md:block` container;
 * that is a pure Tailwind breakpoint (STATUS section 5: "Pure Tailwind responsive breakpoints; no UA
 * sniffing"), and jsdom applies no stylesheet, so the element is in the DOM at every viewport and
 * `isVisible`-style assertions are meaningless. Resizing the jsdom window would prove nothing.
 * What CAN be pinned here is the containment contract -- the widget lives inside a container that
 * carries the breakpoint classes, and there is no second, ungated instance -- and that is what the
 * first block does. The rendered cut is browser-layer evidence, measured at review time with
 * Playwright: at 1440 px the widget sits beside the sliders, at 900 px below them, and at 390 px it
 * is not rendered at all. That gap between what the interaction layer can assert and what only a
 * browser can is the standing paragraph-D limitation, recorded in the SIM-O ledger entry rather
 * than re-argued here.
 *
 * A second limitation, inherited: accessible-name queries are unusable against `<App/>` under jsdom
 * while KaTeX MathML is in the tree (getComputedStyle throws on MathMLElement), so controls are
 * located by exact button text, by attribute selector, or -- for the crystal-cut buttons, whose
 * labels ARE KaTeX -- through the MathML `<annotation>` holding the raw TeX. Assertions read
 * attributes via getAttribute; no @testing-library/jest-dom.
 *
 * Explicit 30 s timeouts throughout (T1/E29 lesson: survive full-suite contention from day one).
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

afterEach(cleanup);
const TIMEOUT_MS = 30000;

const navButton = (name: string) => screen.getAllByRole('button').find((b) => b.textContent === name);

const scene = () => document.querySelector<SVGSVGElement>('[data-orientation-scene]');
const faces = () => Array.from(document.querySelectorAll('[data-scene-face]')).map((p) => p.getAttribute('points'));
const axisLine = (name: string) => document.querySelector(`[data-axis="${name}"] line`);
const axisEnd = (name: string) => {
  const line = axisLine(name);
  return `${line?.getAttribute('x2')},${line?.getAttribute('y2')}`;
};
/** The crystal triad's shared tail — the projected anchor corner. */
const anchorPoint = () => {
  const line = axisLine('crystal-x');
  return `${line?.getAttribute('x1')},${line?.getAttribute('y1')}`;
};

/** The crystal-cut buttons render their label as KaTeX, so they are found by the raw TeX. */
const cutButton = (tex: string) =>
  Array.from(document.querySelectorAll('annotation'))
    .find((a) => a.textContent?.trim() === tex)
    ?.closest('button') as HTMLButtonElement | undefined;

const CUT_100 = 'k \\parallel [100] \\parallel x \\parallel a';
const CUT_111 = 'k \\parallel [111]';
const CUT_110 = 'k \\parallel [110]';

const angleInput = (label: string) =>
  document.querySelector<HTMLInputElement>(`input[type="number"][aria-label="${label}"]`)!;

/**
 * Select the cubic group `432` through the F1-pinned combobox path, go to the Simulator, and open
 * the crystal-rotation disclosure (collapsed by default at zero rotation, which is where the widget
 * lives). Cubic is the fixture system because its preset set contains [111] -- the degenerate cut
 * whose anchor corner differs from [100]'s.
 */
async function openRotationControls(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  const combobox = screen.getByRole('combobox');
  await user.click(combobox);
  await user.keyboard('432');
  await user.keyboard('{ArrowDown}{Enter}');
  await user.click(navButton('Simulator')!);

  const toggle = await waitFor(
    () => {
      const button = screen.getAllByRole('button').find((b) => b.textContent?.includes('Crystal Rotation'));
      expect(button).toBeDefined();
      return button!;
    },
    { timeout: 8000 },
  );
  if (toggle.getAttribute('aria-expanded') === 'false') await user.click(toggle);
  await waitFor(() => expect(scene()).not.toBeNull(), { timeout: 8000 });
}

describe('Simulator sample-orientation widget — mounting', () => {
  it(
    'mounts exactly once, inside the desktop-only rotation container',
    async () => {
      const user = userEvent.setup();
      await openRotationControls(user);

      expect(document.querySelectorAll('[data-orientation-scene]')).toHaveLength(1);

      // The containment contract: an ancestor gates the whole block on the md breakpoint. This is
      // what "desktop-only" means structurally; whether it PAINTS is browser-layer (see header).
      const gate = scene()!.closest('.hidden');
      expect(gate).not.toBeNull();
      expect(gate!.classList.contains('hidden')).toBe(true);
      expect(gate!.classList.contains('md:block')).toBe(true);

      // and the sliders it mirrors are inside that same gate — the widget cannot outlive them
      expect(gate!.contains(angleInput('Tilt about lab-x'))).toBe(true);
    },
    TIMEOUT_MS,
  );

  it(
    'is an image with no tab stop and no interactive surface',
    async () => {
      const user = userEvent.setup();
      await openRotationControls(user);

      const svg = scene()!;
      expect(svg.getAttribute('role')).toBe('img');
      expect(svg.getAttribute('focusable')).toBe('false');
      expect(svg.getAttribute('tabindex')).toBeNull();
      expect(svg.querySelectorAll('button, a, input, [tabindex]')).toHaveLength(0);
    },
    TIMEOUT_MS,
  );
});

describe('Simulator sample-orientation widget — live against the sliders', () => {
  it(
    'redraws the body and the triad when a rotation slider moves',
    async () => {
      const user = userEvent.setup();
      await openRotationControls(user);

      const beforeFaces = faces();
      const beforeCrystal = axisEnd('crystal-x');
      const beforeLab = axisEnd('lab-Z');
      expect(beforeFaces.length).toBeGreaterThan(0);

      const input = angleInput('Tilt about lab-x');
      await user.clear(input);
      await user.type(input, '40');

      await waitFor(() => expect(faces()).not.toEqual(beforeFaces), { timeout: 8000 });
      expect(axisEnd('crystal-x')).not.toBe(beforeCrystal);
      // the lab frame is fixed and must NOT follow
      expect(axisEnd('lab-Z')).toBe(beforeLab);
    },
    TIMEOUT_MS,
  );

  it(
    'keeps the aria-label in step with the angles',
    async () => {
      const user = userEvent.setup();
      await openRotationControls(user);

      expect(scene()!.getAttribute('aria-label')).toContain('azimuth about k 0°');

      const input = angleInput('Azimuth about k');
      await user.clear(input);
      await user.type(input, '55');

      await waitFor(() => expect(scene()!.getAttribute('aria-label')).toContain('azimuth about k 55°'), {
        timeout: 8000,
      });
      expect(scene()!.getAttribute('aria-label')).toContain('Sample orientation');
    },
    TIMEOUT_MS,
  );
});

describe('Simulator sample-orientation widget — live against the crystal cut', () => {
  /**
   * WHICH CUT RE-ANCHORS. The work order expected [111] to anchor at a different corner from [100];
   * it does not. Both land on corner 4, (-,+,+): under [100] the axes are (z, y, -x) and under [111]
   * they all carry +1/sqrt(3) of Z, and both sets are best served by the same corner. In the cubic
   * preset set it is [110] -- anchor corner 0, (+,+,+) -- that differs. The unit tests hold the
   * corner indices for all five cuts; this pair is chosen here because it is the one whose
   * re-anchoring is observable in the DOM.
   */
  it(
    'switching [100] -> [111] re-maps the triad without moving the body',
    async () => {
      const user = userEvent.setup();
      await openRotationControls(user);

      await user.click(cutButton(CUT_100)!);
      await waitFor(() => expect(scene()!.getAttribute('aria-label')).toContain('[100]'), { timeout: 8000 });
      const bodyAt100 = faces();
      const triadAt100 = ['crystal-x', 'crystal-y', 'crystal-z'].map(axisEnd);
      const anchorAt100 = anchorPoint();

      await user.click(cutButton(CUT_111)!);
      await waitFor(() => expect(scene()!.getAttribute('aria-label')).toContain('[111]'), { timeout: 8000 });

      // the triad re-maps ...
      expect(['crystal-x', 'crystal-y', 'crystal-z'].map(axisEnd)).not.toEqual(triadAt100);
      // ... from the SAME corner, which these two cuts share ...
      expect(anchorPoint()).toBe(anchorAt100);
      // ... while the sample itself is cut-independent and does not move at all.
      expect(faces()).toEqual(bodyAt100);
    },
    TIMEOUT_MS,
  );

  it(
    'switching [100] -> [110] re-anchors the triad to another corner',
    async () => {
      const user = userEvent.setup();
      await openRotationControls(user);

      await user.click(cutButton(CUT_100)!);
      await waitFor(() => expect(scene()!.getAttribute('aria-label')).toContain('[100]'), { timeout: 8000 });
      const bodyAt100 = faces();
      const anchorAt100 = anchorPoint();

      await user.click(cutButton(CUT_110)!);
      await waitFor(() => expect(scene()!.getAttribute('aria-label')).toContain('[110]'), { timeout: 8000 });

      expect(anchorPoint()).not.toBe(anchorAt100);
      expect(faces()).toEqual(bodyAt100);
    },
    TIMEOUT_MS,
  );

  it(
    'rotation does not re-anchor',
    async () => {
      const user = userEvent.setup();
      await openRotationControls(user);

      await user.click(cutButton(CUT_111)!);
      await waitFor(() => expect(scene()!.getAttribute('aria-label')).toContain('[111]'), { timeout: 8000 });

      // The anchor corner rides with the body, so its PROJECTED position moves under rotation while
      // the corner it names does not change. Its identity is asserted in the unit tests; what is
      // checked here is that the triad still hangs off one single corner of the drawn body.
      const cornerOf = () => {
        const tails = ['crystal-x', 'crystal-y', 'crystal-z'].map((name) => {
          const line = axisLine(name);
          return `${line?.getAttribute('x1')},${line?.getAttribute('y1')}`;
        });
        return new Set(tails);
      };
      expect(cornerOf().size).toBe(1);

      const input = angleInput('Tilt about lab-y');
      await user.clear(input);
      await user.type(input, '35');
      await waitFor(() => expect(scene()!.getAttribute('aria-label')).toContain('tilt about lab-y 35°'), {
        timeout: 8000,
      });

      expect(cornerOf().size).toBe(1);
      expect(scene()!.getAttribute('aria-label')).toContain('[111]');
    },
    TIMEOUT_MS,
  );
});
