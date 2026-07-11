import { describe, it, expect } from 'vitest';
import { getMonoclinicFrame, MONOCLINIC_FRAMES, getAxisTooltipId } from './axisConventions';
import { getPresetsForSystem } from './crystalCut';
import { GLOSSARY_TERMS } from '../data/glossary';

describe('getPresetsForSystem', () => {
  it('Monoclinic setting 1 (c-unique) vs setting 2 (b-unique) return different label sets', () => {
    const c = getPresetsForSystem('Monoclinic', 1);
    const b = getPresetsForSystem('Monoclinic', 2);
    expect(c.map((p) => p.label)).toEqual(['[001]', '[100]', 'y']);
    expect(b.map((p) => p.label)).toEqual(['[001]', 'x', '[010]']);
    expect(c.map((p) => p.math)).not.toEqual(b.map((p) => p.math));
  });

  it('defaults to setting 1 (c-unique) when no setting is given', () => {
    expect(getPresetsForSystem('Monoclinic')).toEqual(getPresetsForSystem('Monoclinic', 1));
  });

  it('a representative label per system matches the confirmed designation table', () => {
    expect(getPresetsForSystem('Orthorhombic')[0].math).toBe('k \\parallel [100] \\parallel x \\parallel a');
    expect(getPresetsForSystem('Tetragonal')[2].math).toBe('k \\parallel [110]');
    expect(getPresetsForSystem('Cubic')[1].math).toBe('k \\parallel [111]');
    expect(getPresetsForSystem('Hexagonal')[2].math).toBe('k \\parallel [120] \\parallel y');
    expect(getPresetsForSystem('Trigonal')[2].math).toBe('k \\parallel [120] \\parallel y');
    expect(getPresetsForSystem('Triclinic')[1].math).toBe('k \\parallel x \\parallel y \\times z');
    expect(getPresetsForSystem('Triclinic')[2].math).toBe('k \\parallel y \\parallel b^* \\parallel (c \\times a)');
    expect(getPresetsForSystem('Monoclinic', 1)[2].math).toBe('k \\parallel y \\parallel b^* \\parallel (c \\times a)');
    expect(getPresetsForSystem('Monoclinic', 2)[1].math).toBe('k \\parallel x \\parallel a^* \\parallel (b \\times c)');
  });

  it('tx/ty/psi0 for every preset are unchanged from the pre-edit direction-derived values', () => {
    const X = { tx: 0, ty: -90, psi0: 0 };
    const Y = { tx: 90, ty: 0, psi0: 0 };
    const Z = { tx: 0, ty: 0, psi0: 0 };
    const D110 = { tx: 90, ty: -45, psi0: 90 };
    const D111 = { tx: 45, ty: -35.264389682754654, psi0: 120 };

    // atan2-derived angles carry float noise (e.g. -0, 90.00000000000001), so compare with a
    // tolerance rather than exact equality.
    const expectAngles = (
      presets: { tx: number; ty: number; psi0: number }[],
      expected: { tx: number; ty: number; psi0: number }[],
    ) => {
      expect(presets).toHaveLength(expected.length);
      presets.forEach((p, i) => {
        expect(p.tx).toBeCloseTo(expected[i].tx, 9);
        expect(p.ty).toBeCloseTo(expected[i].ty, 9);
        expect(p.psi0).toBeCloseTo(expected[i].psi0, 9);
      });
    };

    expectAngles(getPresetsForSystem('Orthorhombic'), [X, Y, Z]);
    expectAngles(getPresetsForSystem('Tetragonal'), [Z, X, D110]);
    expectAngles(getPresetsForSystem('Cubic'), [X, D111, D110]);
    expectAngles(getPresetsForSystem('Hexagonal'), [Z, X, Y]);
    expectAngles(getPresetsForSystem('Trigonal'), [Z, X, Y]);
    expectAngles(getPresetsForSystem('Triclinic'), [Z, X, Y]);
    expectAngles(getPresetsForSystem('Monoclinic', 1), [Z, X, Y]);
    expectAngles(getPresetsForSystem('Monoclinic', 2), [Z, X, Y]);
  });

  it('falls back to ORTHO_PRESETS for an unrecognized crystal system', () => {
    expect(getPresetsForSystem('NotASystem')).toEqual(getPresetsForSystem('Orthorhombic'));
  });
});

describe('getMonoclinicFrame', () => {
  it('the explicit setting wins when known (Calculator/Simulator)', () => {
    expect(getMonoclinicFrame(1, 'birss')).toBe('c-unique');
    expect(getMonoclinicFrame(1, 'itc')).toBe('c-unique');
    expect(getMonoclinicFrame(2, 'birss')).toBe('b-unique');
    expect(getMonoclinicFrame(2, 'itc')).toBe('b-unique');
  });

  it('falls back to the convention-derived standard setting when no setting is given (Explorer)', () => {
    expect(getMonoclinicFrame(undefined, 'birss')).toBe('c-unique');
    expect(getMonoclinicFrame(undefined, 'itc')).toBe('b-unique');
  });
});

describe('MONOCLINIC_FRAMES — verified axis-label strings', () => {
  it('c-unique (setting 1, Birss standard): z||c unique, x||a, y||b*', () => {
    expect(MONOCLINIC_FRAMES['c-unique']).toEqual({ unique: 'z', z: 'c', x: 'a', y: 'b^*' });
  });

  it('b-unique (setting 2, ITC standard): y||b unique, z||c, x||a*', () => {
    expect(MONOCLINIC_FRAMES['b-unique']).toEqual({ unique: 'y', y: 'b', z: 'c', x: 'a^*' });
  });
});

describe('getAxisTooltipId', () => {
  it('maps each of the 7 crystal systems to a glossary id, sharing ids where the box content is shared', () => {
    expect(getAxisTooltipId('Triclinic')).toBe('axis-triclinic');
    expect(getAxisTooltipId('Monoclinic')).toBe('axis-monoclinic');
    expect(getAxisTooltipId('Orthorhombic')).toBe('axis-orthorhombic');
    expect(getAxisTooltipId('Tetragonal')).toBe('axis-orthorhombic');
    expect(getAxisTooltipId('Cubic')).toBe('axis-orthorhombic');
    expect(getAxisTooltipId('Trigonal')).toBe('axis-trigonal');
    expect(getAxisTooltipId('Hexagonal')).toBe('axis-trigonal');
  });

  it('returns null for an unrecognized crystal system', () => {
    expect(getAxisTooltipId('NotASystem')).toBeNull();
  });

  it('every id returned by getAxisTooltipId resolves to a real glossary entry under the conventions help tab', () => {
    const ids = new Set(
      ['Triclinic', 'Monoclinic', 'Orthorhombic', 'Tetragonal', 'Cubic', 'Trigonal', 'Hexagonal'].map(getAxisTooltipId),
    );
    for (const id of ids) {
      const term = GLOSSARY_TERMS.find((t) => t.id === id);
      expect(term).toBeDefined();
      expect(term?.helpTab).toBe('conventions');
    }
  });

  it('the trigonal/hexagonal position-2 explanation is reachable independent of convention (no convention parameter gates it)', () => {
    // getAxisTooltipId takes only crystalSystem -- there is no convention branch, so the tooltip
    // (and hence the position-2 explanation) is available in both Birss and ITC mode alike.
    const term = GLOSSARY_TERMS.find((t) => t.id === getAxisTooltipId('Trigonal'));
    expect(term?.brief.toLowerCase()).toContain('position-2');
    expect(term?.brief).toContain('30°');
  });
});
