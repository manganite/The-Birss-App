import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

const TENSOR_TYPES: { title: string; description: React.ReactNode }[] = [
  {
    title: 'Polar Tensors',
    description: (
      <>
        Transform like standard vectors under spatial inversion (<InlineMath math="\vec{r} \to -\vec{r}" />
        ). Examples include electric dipole moments and polarization. Odd-rank polar tensors strictly vanish in
        centrosymmetric point groups.
      </>
    ),
  },
  {
    title: 'Axial Tensors',
    description: (
      <>
        Also known as pseudotensors. They do not change sign under spatial inversion (e.g., magnetic moments, angular
        momentum). Odd-rank axial tensors can survive in centrosymmetric groups.
      </>
    ),
  },
  {
    title: 'Time Reversal',
    description: (
      <>
        Tensors can be symmetric (i-type) or anti-symmetric (c-type) under time reversal (<InlineMath math="t \to -t" />
        ). Magnetic properties are typically c-type, while electric properties are i-type.
        <br />
        <span className="italic">Deep dive: i-type vs. c-type tensors → Deeper Topics.</span>
      </>
    ),
  },
];

const GROUP_TYPES: { title: string; description: React.ReactNode }[] = [
  {
    title: 'Type I — Ordinary',
    description: <>No time reversal in the group: the 32 classical (colourless) point groups.</>,
  },
  {
    title: 'Type II — Gray',
    description: (
      <>
        Time reversal <InlineMath math="1'" /> is itself a symmetry element (<InlineMath math="G + G1'" />
        ): all c-type (time-odd) tensors vanish; paramagnetic/diamagnetic phases.
      </>
    ),
  },
  {
    title: 'Type III — Black & White',
    description: (
      <>
        Time reversal appears only combined with rotations/mirrors (primed operations): magnetically ordered phases;
        time-odd tensor components can survive.
      </>
    ),
  },
];

const SHG_MULTIPOLES: { title: string; description: React.ReactNode }[] = [
  {
    title: 'Electric Dipole (ED)',
    description: (
      <>
        The leading-order contribution. It is a polar 3rd-rank tensor (<InlineMath math="\chi^{(2)}_{ijk}" />
        ). Because it is odd under spatial inversion, ED SHG strictly vanishes in centrosymmetric materials, making it a
        powerful probe for broken inversion symmetry.
      </>
    ),
  },
  {
    title: 'Magnetic Dipole (MD)',
    description: (
      <>
        A higher-order axial 3rd-rank tensor. Unlike ED, MD contributions do not necessarily vanish in centrosymmetric
        point groups — odd-rank axial tensors pick up an extra sign under inversion relative to polar ones, a parity
        effect independent of whether time-reversal symmetry is broken. This is what makes MD SHG a useful, if weaker,
        probe in centrosymmetric antiferromagnets such as NiO and CoO.
      </>
    ),
  },
  {
    title: 'Electric Quadrupole (EQ)',
    description: (
      <>
        A higher-order polar 4th-rank tensor (<InlineMath math="\chi^{(2)}_{ijkl}" />
        ). Because it is an even-rank tensor, EQ SHG survives inversion symmetry and can generate bulk SHG signals even
        in centrosymmetric crystals.
      </>
    ),
  },
];

/** The Physics tab of the Help page. */
export function PhysicsHelp() {
  return (
    <section className="space-y-6">
      <div className="p-6 bg-ink/5 border border-ink border-opacity-10 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest">Neumann's Principle</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          The fundamental principle underlying this calculator is Neumann's Principle, which states that the symmetry
          elements of any physical property of a crystal must include the symmetry elements of the point group of the
          crystal.
        </p>
        <p className="text-sm opacity-70 leading-relaxed">
          Mathematically, if a crystal has a symmetry operation represented by a transformation matrix{' '}
          <InlineMath math="R" />, a property tensor <InlineMath math="T" /> must be invariant under this
          transformation:
        </p>
        <div className="text-center overflow-x-auto py-2">
          <BlockMath math="T_{ijk\dots} = \varepsilon \cdot [\det(R)]^p \cdot R_{ia} R_{jb} R_{kc} \dots T_{abc\dots}" />
        </div>
        <p className="text-sm opacity-70 leading-relaxed">
          The <InlineMath math="[\det(R)]^p" /> factor is the polar/axial distinction: <InlineMath math="p = 1" /> for
          axial (pseudo-)tensors, where it flips sign under improper operations (<InlineMath math="\det(R) = -1" />
          ); <InlineMath math="p = 0" /> for polar tensors, where it has no effect. The{' '}
          <InlineMath math="\varepsilon" /> factor is the i-/c-type distinction: <InlineMath math="\varepsilon = -1" />{' '}
          for c-type tensors when <InlineMath math="R" /> is combined with time reversal, and <InlineMath math="+1" />{' '}
          otherwise. By applying this equation for all symmetry operations in a point group, we obtain a system of
          linear equations that constrains the tensor components, forcing some to be zero and others to be equal or
          related by signs.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest">Tensor Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TENSOR_TYPES.map((tensorType) => (
            <div key={tensorType.title} className="p-4 border border-ink border-opacity-10 space-y-2">
              <h4 className="font-medium">{tensorType.title}</h4>
              <p className="text-xs opacity-70 leading-relaxed">{tensorType.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest">Group Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GROUP_TYPES.map((groupType) => (
            <div key={groupType.title} className="p-4 border border-ink border-opacity-10 space-y-2">
              <h4 className="font-medium">{groupType.title}</h4>
              <p className="text-xs opacity-70 leading-relaxed">{groupType.description}</p>
            </div>
          ))}
        </div>
        <p className="text-xs opacity-70 leading-relaxed italic">
          App numbering follows Bradley-Cracknell; colour names are the primary identifier.
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest">Nonlinear Optics & SHG</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          <strong>Second Harmonic Generation (SHG)</strong> is a nonlinear optical process where two photons of
          frequency <InlineMath math="\omega" /> interact within a material to generate a single photon at twice the
          frequency (<InlineMath math="2\omega" />
          ). The calculator focuses on three multipole contributions to this process:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SHG_MULTIPOLES.map((multipole) => (
            <div key={multipole.title} className="p-4 border border-ink border-opacity-10 space-y-2">
              <h4 className="font-medium">{multipole.title}</h4>
              <p className="text-xs opacity-70 leading-relaxed">{multipole.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-ink/5 border border-ink border-opacity-10 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest">Source Terms & Transverse Fields</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          The incident light field induces multipole moments in the material. These induced moments act as the{' '}
          <strong>source terms</strong> (<InlineMath math="S_i" />) that radiate the SHG signal. The effective nonlinear
          source term (or effective polarization) is a combination of these different multipole contributions:
        </p>
        <div className="space-y-3 pl-4 border-l-2 border-ink border-opacity-20 my-4">
          <p className="text-sm opacity-70 leading-relaxed">
            <strong>Electric Dipole:</strong> Contributes directly (linearly) to the source term.
            <br />
            <span className="inline-block mt-1">
              <InlineMath math="S_i^{\text{ED}} \propto P_i" />
            </span>
          </p>
          <p className="text-sm opacity-70 leading-relaxed">
            <strong>Magnetic Dipole:</strong> Contributes via the curl (rotation) of the induced magnetization.
            <br />
            <span className="inline-block mt-1">
              <InlineMath math="S_i^{\text{MD}} \propto (\nabla \times \vec{M})_i" />
            </span>
          </p>
          <p className="text-sm opacity-70 leading-relaxed">
            <strong>Electric Quadrupole:</strong> Contributes via the divergence (spatial gradient) of the quadrupole
            tensor.
            <br />
            <span className="inline-block mt-1">
              <InlineMath math="S_i^{\text{EQ}} \propto -\nabla_j Q_{ij}" />
            </span>
          </p>
        </div>
        <p className="text-sm opacity-70 leading-relaxed">
          The calculator displays how the incoming electric field components (<InlineMath math="E_j, E_k" />) couple
          through the non-zero tensor components to generate these induced source terms.
        </p>
        <p className="text-sm opacity-70 leading-relaxed">
          <strong>Longitudinal vs. Transverse:</strong> For light propagating along the Z-axis in the laboratory frame,
          the incoming electric field is purely <strong>transverse</strong> (
          <InlineMath math="E_X, E_Y \neq 0" />, <InlineMath math="E_Z = 0" />
          ). The material may generate an induced polarization with a <strong>longitudinal</strong> component (
          <InlineMath math="S_Z \neq 0" />
          ). However, an oscillating dipole does not radiate along its axis of oscillation. Therefore, only the
          transverse source components (<InlineMath math="S_X, S_Y" />) will emit SHG light in the forward (Z)
          direction.
        </p>
      </div>
    </section>
  );
}
