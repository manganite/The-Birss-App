import { describe, it, expect } from 'vitest';
import { CRYSTAL_SYSTEM_INFO } from './crystalSystemInfo';

const CRYSTAL_SYSTEMS = ['Triclinic', 'Monoclinic', 'Orthorhombic', 'Tetragonal', 'Trigonal', 'Hexagonal', 'Cubic'];

describe('CRYSTAL_SYSTEM_INFO', () => {
  it('has an entry for all 7 crystal systems', () => {
    for (const system of CRYSTAL_SYSTEMS) {
      expect(CRYSTAL_SYSTEM_INFO[system]).toBeDefined();
    }
    expect(Object.keys(CRYSTAL_SYSTEM_INFO)).toHaveLength(CRYSTAL_SYSTEMS.length);
  });

  it('every entry has non-empty lattice/definingSymmetry/hmPositions/birssVsItc/holohedry/example text', () => {
    for (const system of CRYSTAL_SYSTEMS) {
      const info = CRYSTAL_SYSTEM_INFO[system];
      expect(info.lattice.length).toBeGreaterThan(0);
      expect(info.definingSymmetry.length).toBeGreaterThan(0);
      expect(info.hmPositions.length).toBeGreaterThan(0);
      expect(info.birssVsItc.length).toBeGreaterThan(0);
      expect(info.holohedry.length).toBeGreaterThan(0);
      expect(info.example.length).toBeGreaterThan(0);
    }
  });

  it('settings is null exactly for Triclinic and Cubic (no distinguished axis / no setting choice)', () => {
    const nullSettings = CRYSTAL_SYSTEMS.filter(s => CRYSTAL_SYSTEM_INFO[s].settings === null);
    expect(nullSettings.sort()).toEqual(['Cubic', 'Triclinic']);
    for (const system of CRYSTAL_SYSTEMS) {
      if (nullSettings.includes(system)) continue;
      expect(CRYSTAL_SYSTEM_INFO[system].settings).toBeTruthy();
    }
  });
});
