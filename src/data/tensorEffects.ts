import type { TensorSpec } from '../services/tensorForms';

/**
 * Effect catalogue for the Tables page "By effect" mode (design decisions 2 & 7). Each entry maps a
 * named physical effect to its tensor `spec`, a display `symbol` (LaTeX, indexed), a defining
 * `equation` (LaTeX), a one-line `blurb`, and a literature `reference`. Extending the catalogue is a
 * single array entry.
 */
export interface TensorEffect {
  id: string;
  label: string;
  /** LaTeX symbol with indices, e.g. `\alpha_{ij}` — shown in the header. The bare base letter
   * (`\alpha`) used to render the reduced form is derived from this (see `effectBaseSymbol`). */
  symbol: string;
  spec: TensorSpec;
  blurb: string;
  equation?: string;
  reference: string;
}

export const TENSOR_EFFECTS: TensorEffect[] = [
  {
    id: 'pyroelectricity',
    label: 'Pyroelectricity / spontaneous polarization',
    symbol: 'p_i',
    spec: { rank: 1, parity: 'polar', timeParity: 'i', intrinsic: 'none' },
    blurb: 'A change in temperature induces a change in spontaneous polarization along the pyroelectric vector.',
    equation: '\\Delta P_i = p_i\\,\\Delta T',
    reference: 'ITC Vol. D (doi:10.1107/97809553602060000113)',
  },
  {
    id: 'spontaneous-magnetization',
    label: 'Pyromagnetism / spontaneous magnetization',
    symbol: 'q_i',
    spec: { rank: 1, parity: 'axial', timeParity: 'c', intrinsic: 'none' },
    blurb: 'A change in temperature induces a change in spontaneous magnetization (a time-odd axial vector).',
    equation: '\\Delta M_i = q_i\\,\\Delta T',
    reference: 'Birss, Symmetry and Magnetism (1966), ch. 4; ITC Vol. D (doi:10.1107/97809553602060000113).',
  },
  {
    id: 'permittivity',
    label: 'Electric permittivity',
    symbol: '\\varepsilon_{ij}',
    spec: { rank: 2, parity: 'polar', timeParity: 'i', intrinsic: 'ij' },
    blurb: 'The symmetric second-rank tensor relating the electric displacement to the applied field.',
    equation: 'D_i = \\varepsilon_0\\,\\varepsilon_{ij} E_j',
    reference: 'ITC Vol. D (doi:10.1107/97809553602060000113)',
  },
  {
    id: 'magnetoelectric',
    label: 'Linear magnetoelectric effect',
    symbol: '\\alpha_{ij}',
    spec: { rank: 2, parity: 'axial', timeParity: 'c', intrinsic: 'none' },
    blurb: 'A magnetic field induces an electric polarization (and, conversely, an electric field induces a magnetization: $M_j = \\alpha_{ij} E_i$).',
    equation: 'P_i = \\alpha_{ij} H_j',
    reference: 'ITC Vol. D Table 1.5.8.1 (doi:10.1107/97809553602060000113); Birss (1966), ch. 4.',
  },
  {
    id: 'piezoelectricity',
    label: 'Piezoelectricity',
    symbol: 'd_{ijk}',
    spec: { rank: 3, parity: 'polar', timeParity: 'i', intrinsic: 'jk' },
    blurb: 'Mechanical stress induces an electric polarization (the same symmetry class as electric-dipole SHG).',
    equation: 'P_i = d_{ijk}\\,\\sigma_{jk}',
    reference: 'ITC Vol. D (doi:10.1107/97809553602060000113)',
  },
  {
    id: 'piezomagnetism',
    label: 'Piezomagnetism',
    symbol: '\\Lambda_{ijk}',
    spec: { rank: 3, parity: 'axial', timeParity: 'c', intrinsic: 'jk' },
    blurb: 'Mechanical stress induces a magnetization (a time-odd axial third-rank tensor).',
    equation: 'M_i = \\Lambda_{ijk}\\,\\sigma_{jk}',
    reference: 'ITC Vol. D Table 1.5.7.1 (doi:10.1107/97809553602060000113); Birss (1966), ch. 4.',
  },
  {
    id: 'elasticity',
    label: 'Elasticity',
    symbol: 'c_{ijkl}',
    spec: { rank: 4, parity: 'polar', timeParity: 'i', intrinsic: 'voigt' },
    blurb: 'The fourth-rank stiffness tensor relating stress to strain, with full Voigt (pair) index symmetry.',
    equation: '\\sigma_{ij} = c_{ijkl}\\,\\varepsilon_{kl}',
    reference: 'ITC Vol. D (doi:10.1107/97809553602060000113)',
  },
];

export const getEffect = (id: string): TensorEffect | undefined => TENSOR_EFFECTS.find(e => e.id === id);

/** The bare base symbol used to render the reduced form (e.g. `\alpha_{ij}` -> `\alpha`, `p_i` -> `p`). */
export const effectBaseSymbol = (effect: TensorEffect): string => effect.symbol.replace(/_(\{[^}]*\}|.)$/, '');

/** Allowed Explorer property-chip id -> effect id (design decision 6). Forbidden chips do not link. */
export const CHIP_TO_EFFECT: Record<string, string> = {
  'polar-property': 'pyroelectricity',
  'ferromagnetic-property': 'spontaneous-magnetization',
  'piezoelectric': 'piezoelectricity',
  'piezomagnetic': 'piezomagnetism',
  'magnetoelectric': 'magnetoelectric',
};
