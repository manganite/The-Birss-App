import { describe, it, expect } from 'vitest';
import { getMonoclinicFrame, MONOCLINIC_FRAMES, getAxisTooltipId } from './MathComponents';
import { GLOSSARY_TERMS } from '../data/glossary';

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
    const ids = new Set(['Triclinic', 'Monoclinic', 'Orthorhombic', 'Tetragonal', 'Cubic', 'Trigonal', 'Hexagonal'].map(getAxisTooltipId));
    for (const id of ids) {
      const term = GLOSSARY_TERMS.find(t => t.id === id);
      expect(term).toBeDefined();
      expect(term?.helpTab).toBe('conventions');
    }
  });

  it('the trigonal/hexagonal position-2 explanation is reachable independent of convention (no convention parameter gates it)', () => {
    // getAxisTooltipId takes only crystalSystem -- there is no convention branch, so the tooltip
    // (and hence the position-2 explanation) is available in both Birss and ITC mode alike.
    const term = GLOSSARY_TERMS.find(t => t.id === getAxisTooltipId('Trigonal'));
    expect(term?.brief.toLowerCase()).toContain('position-2');
    expect(term?.brief).toContain('30°');
  });
});
