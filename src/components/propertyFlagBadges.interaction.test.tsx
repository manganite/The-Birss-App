/**
 * @vitest-environment jsdom
 *
 * The property-flag badges in the group identity header (B27-S).
 *
 * The truth about which flags a group admits lives in `services/propertyFlags.ts`, which is
 * reference-guarded against ITC Tables 1.5.2.4 / 1.5.8.1 and the classical property-class lists
 * (`propertyFlags.reference.test.ts`). These tests pin the UI against that service -- never the
 * physics. Each witness's expected badge set was read off the service first and then hard-coded, so
 * a change in the service breaks these loudly rather than silently rewriting what the header shows.
 *
 * ENVIRONMENT LIMITATION -- do not "fix" this by reaching for getByRole(role, { name }):
 * accessible-name queries are unusable here while KaTeX MathML is in the tree (jsdom does not
 * implement `style` on MathMLElement, so getComputedStyle throws inside name computation). Same
 * workarounds as `App.interaction.test.tsx`: locate by attribute selector or exact text, assert via
 * attributes and text content, and seed interaction through userEvent.
 *
 * Explicit 30 s timeouts throughout (T1/E29 lesson: survive full-suite contention from day one).
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupIdentityHeader } from './MathComponents';
import { POINT_GROUPS } from '../data/pointGroups';
import { HEADER_FLAG_IDS, propertyFlag } from './propertyFlagDefs';

const TIMEOUT_MS = 30000;

afterEach(cleanup);

const group = (name: string) => POINT_GROUPS.find((p) => p.name === name)!;

const renderHeader = (name: string, onNavigate?: (view: string, tab?: string) => void) =>
  render(
    <GroupIdentityHeader
      group={group(name)}
      setting={1}
      convention="birss"
      onSettingChange={() => {}}
      onNavigate={onNavigate}
    />,
  );

/** The badge row, located by its label rather than by accessible-name computation. */
const badgeList = () => document.querySelector('[aria-label="Properties admitted by this point group"]');
const badges = () => Array.from(badgeList()?.querySelectorAll('li') ?? []).map((li) => li.textContent?.trim() ?? '');

describe('Property flag badges — canonical witnesses', () => {
  // Verified against the service before being written down. `1` is the all-on case: it has no
  // symmetry operation at all, so nothing kills any of the four tensors.
  it.each([
    ['1', ['Polar', 'Chiral', 'Ferromagnetic', 'Magnetoelectric']],
    ["2'/m'", ['Ferromagnetic']],
    ["-3'm'", ['Magnetoelectric']],
  ] as const)(
    '%s shows exactly %j',
    (name, expected) => {
      renderHeader(name);
      expect(badges()).toEqual([...expected]);
    },
    TIMEOUT_MS,
  );

  it(
    'm-3m shows no badge row at all — the negative control',
    () => {
      renderHeader('m-3m');
      expect(badgeList()).toBeNull();
    },
    TIMEOUT_MS,
  );

  it(
    'a grey group admits neither time-odd flag',
    () => {
      // Pure time reversal kills every time-odd tensor, so no grey group is ferromagnetic or
      // magnetoelectric however its classical parent behaves. `11'` is the grey partner of `1`,
      // which admits all four -- the sharpest available contrast.
      renderHeader("11'");
      expect(badges()).toEqual(['Polar', 'Chiral']);
    },
    TIMEOUT_MS,
  );
});

describe('Property flag badges — the info affordance', () => {
  it(
    'opens a brief that cites the reference the flag is guarded against',
    async () => {
      const user = userEvent.setup();
      renderHeader("2'/m'");

      const badge = Array.from(badgeList()!.querySelectorAll('li')).find((li) =>
        li.textContent?.includes('Ferromagnetic'),
      )!;
      await user.click(badge.querySelector('button')!);

      // The popup is portalled to document.body, so search the whole document.
      expect(document.body.textContent).toContain('ITC Table 1.5.2.4');
      // ...and it states what the flag means rather than asserting a material property.
      expect(document.body.textContent).toContain('does not assert an ordered moment');
    },
    TIMEOUT_MS,
  );

  it(
    'carries a distinct provenance per flag, not a blanket ITC citation',
    async () => {
      const user = userEvent.setup();
      // Polar and chiral are anchored against the classical property-class lists, not ITC; a
      // uniform "ITC Table ..." string on all four badges would be a false citation.
      const expected: Record<string, string> = {
        'polar-property': 'Schmid, Ferroelectrics 162, 317 (1994)',
        chiral: '11 enantiomorphic classes',
        'ferromagnetic-property': 'ITC Table 1.5.2.4',
        magnetoelectric: 'ITC Table 1.5.8.1',
      };

      for (const id of HEADER_FLAG_IDS) {
        cleanup();
        renderHeader('1'); // admits all four, so every badge is present to click
        const label = propertyFlag(id).label;
        const badge = Array.from(badgeList()!.querySelectorAll('li')).find((li) => li.textContent?.includes(label))!;
        await user.click(badge.querySelector('button')!);
        expect(document.body.textContent, `${id} provenance`).toContain(expected[id]);
      }
    },
    TIMEOUT_MS,
  );
});

describe('Property flag badges — UI agrees with the service for all 122 groups', () => {
  it(
    'renders every group and shows exactly the flags the service reports',
    () => {
      const mismatches: string[] = [];
      for (const g of POINT_GROUPS) {
        cleanup();
        renderHeader(g.name);
        const shown = badges();
        const expected = HEADER_FLAG_IDS.map(propertyFlag)
          .filter((f) => f.test(g.name))
          .map((f) => f.label);
        if (shown.join('|') !== expected.join('|')) {
          mismatches.push(`${g.name}: shows [${shown}] but the service reports [${expected}]`);
        }
      }
      expect(mismatches).toEqual([]);
    },
    TIMEOUT_MS,
  );
});
