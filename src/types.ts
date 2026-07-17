import type { Dispatch, SetStateAction } from 'react';
import type { TensorType, TensorTimeReversal } from './services/tensorCalculator';
import type { Convention } from './services/conventionMapping';
import type { TensorParity } from './services/tensorForms';

/** Canonical app group-key union. Defined next to its source list (`GROUP_KEYS`/`POINT_GROUPS`) and
 *  re-exported here as the domain-type home, alongside CrystalSystem/Parity/TimeParity/GroupType. */
export type { GroupKey } from './data/pointGroups';

// Dependency-free primitive unions live in domainTypes (cycle-free by construction);
// re-exported here so src/types.ts remains the app-facing domain-type home.
export type { CrystalSystem, GroupType } from './domainTypes';

/** Spatial parity of a tensor property ('polar' | 'axial'). Canonical alias of the engine's
 *  `TensorParity`, re-exported here as the single app-facing home. */
export type Parity = TensorParity;

/** Time-reversal parity ('i' = time-even, 'c' = time-odd). Canonical alias of the engine's
 *  `TensorTimeReversal`, re-exported here as the single app-facing home. */
export type TimeParity = TensorTimeReversal;

export const TENSOR_META = {
  ED: { label: 'Electric Dipole', rank: 3, type: 'POLAR' },
  MD: { label: 'Magnetic Dipole', rank: 3, type: 'AXIAL' },
  EQ: { label: 'Electric Quadrupole', rank: 4, type: 'POLAR' },
} as const satisfies Record<TensorType, { label: string; rank: number; type: 'POLAR' | 'AXIAL' }>;

export interface TensorConfig {
  type: TensorType;
  setType: (t: TensorType) => void;
  timeReversal: TensorTimeReversal;
  setTimeReversal: (t: TensorTimeReversal) => void;
  setting: number;
  setSetting: (s: number) => void;
  convention: Convention;
  setConvention: (c: Convention) => void;
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
