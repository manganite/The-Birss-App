import { InlineMath, BlockMath } from 'react-katex';
import { Compass, Zap } from 'lucide-react';

/** The Simulation tab of the Help page. */
export function SimulationHelp() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Workflow
        </h3>
        <ol className="text-sm opacity-70 list-decimal list-inside space-y-2 ml-4">
          <li>Select the point group, tensor type, and time-reversal symmetry from the main controls.</li>
          <li>
            Adjust the crystal tilt (<InlineMath math="\varphi_X, \varphi_Y" />) to set the incidence angle of the
            light, and the azimuth (<InlineMath math="\psi" />) to rotate the crystal about its surface normal.
          </li>
          <li>
            The simulator automatically isolates the independent tensor components (
            <InlineMath math="\chi_{ijk\dots}" />) that contribute to the transverse source terms (
            <InlineMath math="S_X, S_Y" />
            ).
          </li>
          <li>Adjust the relative amplitude and phase of each independent tensor component using the sliders.</li>
          <li>
            Switch between the <strong>Anisotropy</strong>, <strong>Polarizer</strong>, and <strong>Analyzer</strong>{' '}
            tabs to observe the resulting SHG intensity polarimetry patterns in the radar charts.
          </li>
        </ol>
      </div>

      <div className="p-4 border border-ink border-opacity-10 space-y-2">
        <h4 className="font-medium">Components & phases</h4>
        <p className="text-xs opacity-70 leading-relaxed">
          Each independent tensor component enters with an adjustable relative amplitude and phase. The measured pattern
          is the squared modulus of a coherent sum, so relative phases matter: components interfere, and changing a
          phase can reshape or rotate lobes without changing any amplitude. Values are relative (arbitrary units); only
          ratios and phase differences affect the pattern shape.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <Compass className="w-4 h-4" />
          Physical Background
        </h3>
        <p className="text-sm opacity-70 leading-relaxed">
          In a typical SHG polarimetry experiment, linearly polarized light is incident on the crystal. The polarization
          of the incident light (polarizer) and the detected SHG light (analyzer) are rotated to probe the symmetry of
          the nonlinear susceptibility tensor. The simulator provides three distinct views:
        </p>
        <ul className="text-sm opacity-70 list-disc list-inside space-y-2 ml-4">
          <li>
            <strong>Anisotropy:</strong> The radar charts display the SHG intensity as the{' '}
            <strong>polarizer angle</strong> is rotated from <InlineMath math="0^\circ" /> to{' '}
            <InlineMath math="360^\circ" />.
            <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
              <li>
                <strong>Parallel Configuration:</strong> The polarizer and analyzer are aligned and rotate together.
              </li>
              <li>
                <strong>Crossed Configuration:</strong> The polarizer and analyzer are orthogonal (the analyzer is at{' '}
                <InlineMath math="+90^\circ" /> relative to the polarizer).
              </li>
            </ul>
          </li>
          <li>
            <strong>Polarizer:</strong> The analyzer is fixed at <InlineMath math="0^\circ" /> or{' '}
            <InlineMath math="90^\circ" />, and the intensity is plotted as a function of the{' '}
            <strong>polarizer angle</strong>.
          </li>
          <li>
            <strong>Analyzer:</strong> The polarizer is fixed at <InlineMath math="0^\circ" /> or{' '}
            <InlineMath math="90^\circ" />, and the intensity is plotted as a function of the{' '}
            <strong>analyzer angle</strong>.
          </li>
        </ul>
      </div>

      <div className="space-y-3 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest">Crystal Cut</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          <strong>
            Surface normal ∥ <InlineMath math="k" />.
          </strong>{' '}
          The cut presets choose which crystal direction faces the beam: the selected direction is aligned with the lab
          Z axis (<InlineMath math="k" />
          ), the polarization plane is X/Y. Each preset aligns a Cartesian axis (x, y or z) or a symmetry diagonal; the
          button shows every valid designation (<InlineMath math="[hkl]" />, Cartesian axis, crystallographic axis).
          Additional tilts (<InlineMath math="\varphi_X, \varphi_Y" />) and the azimuth (<InlineMath math="\psi" />) are
          applied on top of the preset.
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest">Crystal Rotation (Lab Frame)</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          The crystal orientation in the lab frame is controlled by a preset plus three continuous rotation angles:
        </p>
        <div className="space-y-3 pl-4 border-l-2 border-ink border-opacity-20 my-4">
          <p className="text-sm opacity-70 leading-relaxed">
            <strong>
              Preset (<InlineMath math="k \parallel [hkl]" />
              ):
            </strong>{' '}
            Selects which crystal direction is aligned with the beam axis (lab Z). Defines{' '}
            <InlineMath math="R_{\text{preset}}" />.
          </p>
          <p className="text-sm opacity-70 leading-relaxed">
            <strong>
              <InlineMath math="\varphi_X, \varphi_Y" /> (tilt):
            </strong>{' '}
            Tilt the crystal surface away from normal incidence, rotating about the lab X and Y axes. Range: ±90°.
          </p>
          <p className="text-sm opacity-70 leading-relaxed">
            <strong>
              <InlineMath math="\psi" /> (azimuth):
            </strong>{' '}
            Rotate the crystal about its surface normal (crystal-tied azimuth). At zero tilt this coincides with the
            beam axis (lab Z). This is the in-plane rotation that sweeps the crystallographic directions through the
            polarizer plane. Range: ±180°.
          </p>
        </div>
        <p className="text-sm opacity-70 leading-relaxed">
          The full rotation matrix is{' '}
          <InlineMath math="R = R_y(\varphi_Y) \cdot R_x(\varphi_X) \cdot R_z(\psi) \cdot R_{\text{preset}}" />, applied
          right-to-left: the preset alignment first, then the crystal-tied azimuth <InlineMath math="\psi" />, then the
          lab-fixed tilts <InlineMath math="\varphi_X" /> and <InlineMath math="\varphi_Y" />. At{' '}
          <InlineMath math="\varphi_X = \varphi_Y = \psi = 0" />, the result is purely the preset alignment.
        </p>
      </div>

      <div className="p-6 bg-ink/5 border border-ink border-opacity-10 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest">Calculating the Intensity</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          The polarizer sets the incident field direction (angle <InlineMath math="\theta_{pol}" />
          ); the analyzer selects the detected component (angle <InlineMath math="\theta_{ana}" />
          ). The incident field induces the transverse source terms <InlineMath math="S_X" />, <InlineMath math="S_Y" />{' '}
          (see Physics → Source Terms & Transverse Fields); the detected signal is proportional to the source-term
          component along the analyzer. The Simulator's Mathematical Model box shows these formulas evaluated live for
          the selected group and orientation.
        </p>
        <div className="text-center overflow-x-auto py-2">
          <BlockMath math="\vec{E}^{\omega} = E_0 (\cos\theta_{pol}, \sin\theta_{pol}, 0)" />
        </div>
        <div className="text-center overflow-x-auto py-2">
          <BlockMath math="I(\theta_{pol}, \theta_{ana}) \propto |S_X(\theta_{pol})\cos\theta_{ana} + S_Y(\theta_{pol})\sin\theta_{ana}|^2" />
        </div>
        <p className="text-sm opacity-70 leading-relaxed">
          Every plotted configuration is a specialization of this formula: Parallel (
          <InlineMath math="\theta_{ana} = \theta_{pol} = \theta" />
          ), Crossed (<InlineMath math="\theta_{ana} = \theta_{pol} + 90^\circ" />
          ), the Polarizer scans (<InlineMath math="\theta_{ana}" /> fixed at <InlineMath math="0^\circ" /> /{' '}
          <InlineMath math="90^\circ" />
          ), and the Analyzer scans (<InlineMath math="\theta_{pol}" /> fixed at <InlineMath math="0^\circ" /> /{' '}
          <InlineMath math="90^\circ" />
          ).
        </p>

        <div className="space-y-4 mt-4">
          <div>
            <h4 className="font-medium text-sm">Parallel Configuration</h4>
            <div className="text-center overflow-x-auto py-2">
              <BlockMath math="I_{\parallel} \propto |S_X\cos\theta + S_Y\sin\theta|^2" />
            </div>
            <p className="text-sm opacity-70 leading-relaxed">
              with <InlineMath math="\theta = \theta_{pol} = \theta_{ana}" />.
            </p>
          </div>

          <div className="pt-4 border-t border-ink border-opacity-10">
            <h4 className="font-medium text-sm">Crossed Configuration</h4>
            <div className="text-center overflow-x-auto py-2">
              <BlockMath math="I_{\perp} \propto |{-S_X\sin\theta + S_Y\cos\theta}|^2" />
            </div>
            <p className="text-sm opacity-70 leading-relaxed">
              with <InlineMath math="\theta_{ana} = \theta + 90^\circ" />.
            </p>
          </div>
          <div className="pt-4 border-t border-ink border-opacity-10">
            <h4 className="font-medium text-sm">Formula Simplification</h4>
            <p className="text-sm opacity-70 leading-relaxed mt-1">
              The expanded intensity formulas displayed in the simulator are mathematically simplified using power
              reduction and multiple-angle trigonometric identities (e.g.,{' '}
              <InlineMath math="\sin^2\theta = \frac{1}{2}(1 - \cos 2\theta)" /> and{' '}
              <InlineMath math="\cos^3\theta = \frac{1}{4}(3\cos\theta + \cos 3\theta)" />
              ).
            </p>
            <p className="text-sm opacity-70 leading-relaxed mt-2">
              This converts the trigonometric polynomials into a harmonic Fourier series representation, making the
              rotational symmetries of the crystal lattice (like 2-fold, 3-fold, or 4-fold symmetry) immediately
              obvious. The harmonic form is preferred by default; the power form is used only when it is strictly
              shorter (fewer terms) for that particular component, and unnecessary minus signs are factored out of the
              absolute value expressions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
