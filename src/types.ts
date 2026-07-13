import type { Dispatch, SetStateAction } from 'react';
import type { TensorType, TensorTimeReversal } from './services/tensorCalculator';
import type { Convention } from './services/conventionMapping';
import type { TensorParity } from './services/tensorForms';

/**
 * The seven crystal systems, capitalized exactly as stored in `PointGroupData.crystalSystem`
 * and keyed in `CRYSTAL_SYSTEMS`. Canonical union — replaces the loose `string` typing at the
 * crystal-system data and prop sites.
 */
export type CrystalSystem =
  'Triclinic' | 'Monoclinic' | 'Orthorhombic' | 'Tetragonal' | 'Trigonal' | 'Hexagonal' | 'Cubic';

/** Spatial parity of a tensor property ('polar' | 'axial'). Canonical alias of the engine's
 *  `TensorParity`, re-exported here as the single app-facing home. */
export type Parity = TensorParity;

/** Time-reversal parity ('i' = time-even, 'c' = time-odd). Canonical alias of the engine's
 *  `TensorTimeReversal`, re-exported here as the single app-facing home. */
export type TimeParity = TensorTimeReversal;

/** Magnetic point-group class: I = standard, II = grey, III = black-and-white. Canonical home
 *  for the union re-inlined at pointGroups, groupNotation, and LookupChainDiagram. */
export type GroupType = 'I' | 'II' | 'III';

export const TENSOR_META = {
  ED: { label: 'Electric Dipole', rank: '3', type: 'POLAR' },
  MD: { label: 'Magnetic Dipole', rank: '3', type: 'AXIAL' },
  EQ: { label: 'Electric Quadrupole', rank: '4', type: 'POLAR' },
} as const satisfies Record<TensorType, { label: string; rank: string; type: string }>;

export interface TensorConfig {
  type: TensorType;
  setType: (t: TensorType) => void;
  timeReversal: TensorTimeReversal;
  setTimeReversal: (t: TensorTimeReversal) => void;
  setting: number;
  setSetting: (s: number) => void;
  convention: Convention;
}

export interface OrientationState {
  thetaX: number;
  setThetaX: (v: number) => void;
  thetaY: number;
  setThetaY: (v: number) => void;
  psi0: number;
  setPsi0: (v: number) => void;
  phiX: number;
  setPhiX: (v: number) => void;
  phiY: number;
  setPhiY: (v: number) => void;
  psi: number;
  setPsi: (v: number) => void;
}

export interface PresetAnglesState {
  thetaX: number;
  setThetaX: (v: number) => void;
  thetaY: number;
  setThetaY: (v: number) => void;
  psi0: number;
  setPsi0: (v: number) => void;
}

export interface SimulationState {
  amplitudes: Record<string, number>;
  setAmplitudes: Dispatch<SetStateAction<Record<string, number>>>;
  phases: Record<string, number>;
  setPhases: Dispatch<SetStateAction<Record<string, number>>>;
}
