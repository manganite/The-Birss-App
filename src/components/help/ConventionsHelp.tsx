import { InlineMath } from 'react-katex';
import { Compass, Info } from 'lucide-react';

/** The Conventions tab of the Help page. */
export function ConventionsHelp() {
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <Compass className="w-4 h-4" />
          Coordinate Systems
        </h3>
        <p className="text-sm opacity-70 leading-relaxed">
          The calculator uses the standard Cartesian coordinate system (x, y, z) for tensor components. The orientation
          of these axes relative to the crystallographic axes (a, b, c) depends on the crystal system:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">Triclinic</h4>
            <p className="text-xs opacity-70 leading-relaxed">
              <InlineMath math="z \parallel c" />, <InlineMath math="y \parallel (c \times a) \parallel b^*" />,{' '}
              <InlineMath math="x = y \times z" /> (projection of <InlineMath math="a" /> onto the plane ⊥{' '}
              <InlineMath math="c" />
              ).
            </p>
          </div>
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">Monoclinic</h4>
            <p className="text-xs opacity-70 leading-relaxed">
              Two frames, following the selected setting.
              <br />
              <strong>c-unique:</strong> <InlineMath math="z \parallel c" /> (unique axis),{' '}
              <InlineMath math="x \parallel a" />, <InlineMath math="y \parallel b^*" />.<br />
              <strong>b-unique:</strong> <InlineMath math="y \parallel b" /> (unique axis),{' '}
              <InlineMath math="z \parallel c" />, <InlineMath math="x \parallel a^*" />.
            </p>
          </div>
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">Orthorhombic, Tetragonal, Cubic</h4>
            <p className="text-xs opacity-70 leading-relaxed">
              <InlineMath math="x \parallel [100]" />, <InlineMath math="y \parallel [010]" />,{' '}
              <InlineMath math="z \parallel [001]" />.
            </p>
          </div>
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">Trigonal & Hexagonal</h4>
            <p className="text-xs opacity-70 leading-relaxed">
              The Cartesian axes are orthogonal, while the crystallographic axes (<InlineMath math="a_1, a_2" />) are
              separated by 120°.
            </p>
            <ul className="text-xs opacity-70 list-[circle] list-inside space-y-1">
              <li>
                <InlineMath math="z \parallel [001]" /> / <InlineMath math="[0001]" /> (c-axis)
              </li>
              <li>
                <InlineMath math="x \parallel [100]" /> / <InlineMath math="[2\bar{1}\bar{1}0]" /> (a-axis)
              </li>
              <li>
                <InlineMath math="y \parallel [120]" /> / <InlineMath math="[01\bar{1}0]" /> (orthogonal to x)
              </li>
            </ul>
          </div>
        </div>
        <p className="text-sm opacity-70 leading-relaxed mt-4">
          The triclinic and monoclinic conventions follow the standard crystal-physics prescription (Haussuehl 1983,
          based on IRE 1949): <InlineMath math="z \parallel c" />, <InlineMath math="y \parallel (c \times a)" />,{' '}
          <InlineMath math="x = y \times z" />. The set of independent and zero tensor components does{' '}
          <strong>not</strong> depend on this choice, but the numeric component values — and therefore the orientation
          of simulated polarimetry patterns — <strong>do</strong>.
        </p>
        <p className="text-sm opacity-70 leading-relaxed mt-2">
          <strong>Why there is no monoclinic-angle control:</strong> The angle <InlineMath math="\beta" /> does not
          enter the symmetry calculation directly. A crystal with a different <InlineMath math="\beta" /> is a different
          material with different tensor values, so it is represented by adjusting the relevant in-plane component
          values — not by a separate geometric control. Linear-optical effects such as birefringence, which do depend on{' '}
          <InlineMath math="\beta" />, are outside the scope of this symmetry calculator.
        </p>
        <p className="text-xs opacity-70 leading-relaxed italic">
          For lattice conditions and defining symmetry per system, see the Explorer's per-crystal-system info panel.
        </p>
      </div>

      <div className="space-y-3 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest">Settings</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          Some magnetic point groups admit more than one valid orientation of their symmetry elements relative to the
          Cartesian axes; each valid choice is a <strong>setting</strong>. A different setting never changes which
          tensor components are independent or zero — only which axis labels they carry. Matching the setting of your
          reference data matters when comparing component values; it never changes whether an effect is allowed.
          Example: <InlineMath math="6'mm'" /> and <InlineMath math="6'm'm" /> are two settings of the same group, 30°
          apart.
        </p>
        <p className="text-sm opacity-70 leading-relaxed">
          The app implements all settings via the similarity transform <InlineMath math="G' = S \cdot G \cdot S^{-1}" />{' '}
          applied to the base generators. A setting selector appears in the group info header, shared by the Calculator
          and the Simulator, whenever a group has multiple settings, and the choice persists between the two views. No
          group has more than 3 settings.
        </p>
        <p className="text-sm opacity-70 leading-relaxed">
          Buttons are labelled with the distinct HM symbol wherever the setting changes it
          (tetragonal/trigonal/hexagonal pairs, e.g. <InlineMath math="\bar{4}2m/\bar{4}m2" /> or{' '}
          <InlineMath math="6'mm'/6'm'm" />
          ); where the short symbol is identical for every setting (orthorhombic, monoclinic), buttons instead read an
          axis word — c-unique, a-unique, or b-unique — plus that shared symbol.
        </p>
        <p className="text-xs opacity-70 leading-relaxed italic">
          Deep dive: the three mechanisms behind these settings → Deeper Topics.
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest">Symbol Conventions: Birss vs ITC</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          <strong>Convention</strong> is a separate choice from <strong>setting</strong> above: setting picks{' '}
          <em>which</em> physical frame is selected; convention only picks <em>which naming rule</em> labels that frame.
          Switching convention never changes the selected frame or any computed tensor value — only which symbol is
          displayed.
        </p>
        <p className="text-sm opacity-70 leading-relaxed">
          The convention is a single global toggle (<strong>BIRSS | ITC</strong>) in the app header. It relabels group
          names app-wide — Explorer, search, Calculator, and Simulator — and opens newly selected groups on the active
          convention's standard frame. Toggling it while a group is already open keeps the current physical frame; it
          only relabels it.
        </p>
        <p className="text-sm opacity-70 leading-relaxed">
          The two rules disagree on one point: for trigonal/hexagonal groups, Birss reads HM position 2 from the{' '}
          <InlineMath math="y" />
          -axis family, while ITC reads it from the <InlineMath math="x" /> (a-axis) family — the two families are 30°
          apart. This has three distinct effects:
        </p>
        <ul className="text-sm opacity-70 list-disc list-inside space-y-2 ml-4">
          <li>
            <strong>Mechanism-B trigonal/hexagonal pairs swap names:</strong> for a group like{' '}
            <InlineMath math="6'mm'" />, the app's default frame is Birss's <InlineMath math="6'mm'" /> and ITC's{' '}
            <InlineMath math="6'm'm" />; the alternate setting is Birss's <InlineMath math="6'm'm" /> and ITC's{' '}
            <InlineMath math="6'mm'" />. The physics is identical (labels swap; ITC mode opens the group on the setting
            ITC would call by the group's key); this covers the trigonal <InlineMath math="32/3m/\bar{3}m" /> family and
            the seven affected hexagonal groups.
          </li>
          <li>
            <strong>Tetragonal Mechanism-A pairs are convention-neutral:</strong> for groups like{' '}
            <InlineMath math="\bar{4}2m" />, the 4-fold makes the <InlineMath math="x" /> and <InlineMath math="y" />{' '}
            secondary families equivalent, so Birss's and ITC's position-2 readings always agree — no label change in
            either mode.
          </li>
          <li>
            <InlineMath math="m'm'm" />: <strong>orthorhombic frame symbols are convention-independent</strong> (the
            c-unique frame is always <InlineMath math="m'm'm" />, the a-unique frame always <InlineMath math="mm'm'" />
            ). The conventions differ only in which frame is the standard — Birss: c-unique (
            <InlineMath math="m'm'm" />
            ); ITC: a-unique (<InlineMath math="mm'm'" />) — so the displayed group name follows the mode without
            relabelling any frame.
          </li>
          <li>
            <InlineMath math="6'/mm'm" />: <strong>the names swap exactly like the Mechanism-B pairs</strong> (setting 1
            is Birss's <InlineMath math="6'/mm'm" /> and ITC's <InlineMath math="6'/mmm'" />
            ), but this group opens on setting 1 in both conventions: both tabulated standards are the same physical
            frame.
          </li>
        </ul>
        <p className="text-sm opacity-70 leading-relaxed">
          Monoclinic groups keep the same short symbol in both conventions (settings are labelled First/Second, i.e.
          c-unique/b-unique); only which setting opens by default differs — ITC mode opens on the b-unique (Second)
          setting.
        </p>
        <p className="text-xs opacity-70 leading-relaxed italic">
          Deep dive: reading Birss's parentheses → Deeper Topics.
        </p>
      </div>

      <div className="space-y-3 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest">The Birss lookup chain</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          Birss's tables answer tensor-form questions in two steps: a group is first mapped to its classical family
          class with fixed reference-axis orientations (Table 4a), and that class selects a row in the rank-specific
          form tables (4b–4f). The Tables page shows this chain as a breadcrumb above each result, so the app lookup and
          the manual book lookup stay recognizably the same procedure. A step-by-step walkthrough with examples is in
          the Tables tab.
        </p>
        <p className="text-xs opacity-70 leading-relaxed italic">
          Forms for every rank are verified against the printed tables — see Deeper Topics → References.
        </p>
      </div>

      <div className="space-y-3 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <Info className="w-4 h-4" />
          Symmetry Operations
        </h3>
        <p className="text-sm opacity-70 leading-relaxed">
          Symmetry operations are denoted using standard Hermann-Mauguin notation:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">
              <InlineMath math="\bar{1}, \bar{4}" /> — Overbar
            </h4>
            <p className="text-xs opacity-70 leading-relaxed">
              Indicates a roto-inversion axis (a rotation combined with spatial inversion).
            </p>
          </div>
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">
              <InlineMath math="2', m'" /> — Prime
            </h4>
            <p className="text-xs opacity-70 leading-relaxed">
              Indicates an operation combined with time-reversal (anti-symmetry).
            </p>
          </div>
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">
              <InlineMath math="3_z^+, m_y" /> — Subscript
            </h4>
            <p className="text-xs opacity-70 leading-relaxed">
              The operation's characteristic direction: the rotation axis for rotations and roto-inversions, the mirror
              normal for <InlineMath math="m" />. Cardinal directions are x, y, z; in-plane directions are given as the
              azimuth from +x in degrees (0–180°), e.g. <InlineMath math="m_{150^\circ}" /> is the mirror whose normal
              lies in the basal plane at 150° from x.
            </p>
          </div>
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">
              <InlineMath math="3^+ / 3^-" /> — Superscript
            </h4>
            <p className="text-xs opacity-70 leading-relaxed">
              The rotation sense about the axis (right-hand rule: + counter-clockwise, − clockwise). Shown for rotations
              of order 3 and higher, where the two senses are distinct operations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
