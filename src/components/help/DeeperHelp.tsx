import { InlineMath } from 'react-katex';
import { BookOpen } from 'lucide-react';

const REFERENCES: { href: string; title: string; description: string; openAccess?: boolean }[] = [
  {
    href: 'https://doi.org/10.1107/97809553602060000114',
    title: 'International Tables for Crystallography',
    description: 'Volume A: Space-group symmetry. General crystal symmetry aspects and point group definitions.',
  },
  {
    href: 'https://ethz.ch/content/dam/ethz/special-interest/matl/multi-ferroic-materials-dam/documents/education/Nonlinear%20Optics%20on%20Ferroic%20Materials/Birss%20Symmetry%20&%20Magnetism%20komplett.pdf',
    title: 'Symmetry and Magnetism',
    description:
      'Birss, R. R. (1966). Comprehensive derivation of magnetic point groups and tensor properties. The tables used by this app are transcribed and included in the project repository (birss-tables/); most are print-verified.',
    openAccess: true,
  },
  {
    href: 'https://archive.org/details/yu.-i.-sirotin-m.-p.-shaskolskaya-fundamentals-of-crystal-physics-mir-1982',
    title: 'Fundamentals of Crystal Physics',
    description:
      "Sirotin, Yu. I. & Shaskol'skaya, M. P. (1982). Standard reference tables for tensor properties of crystals under point-group symmetry.",
    openAccess: true,
  },
  {
    href: 'https://doi.org/10.1002/9783527621156',
    title: 'Physical Properties of Crystals: An Introduction',
    description:
      'Haussuehl, S. (2007, Wiley-VCH; German original: Kristallphysik, 1983). Source of the Cartesian axis convention for the triclinic and monoclinic systems (IRE 1949 standard).',
  },
  {
    href: 'https://www.sciencedirect.com/book/9780123694706/nonlinear-optics',
    title: 'Nonlinear Optics',
    description:
      'Boyd, R. W. (2008). 3rd ed. Appendix tables of nonvanishing d-tensor components by point-group symmetry.',
  },
  {
    href: 'https://doi.org/10.1103/PhysRev.130.919',
    title: 'Nonlinear Optical Properties of Solids',
    description: 'Pershan, P. S. (1963). Nonlinear optical multipole contributions.',
  },
  {
    href: 'https://doi.org/10.1007/s003400050650',
    title: 'Nonlinear spectroscopy of antiferromagnetics',
    description: 'Fröhlich, D., et al. (1999). Source term calculation.',
  },
  {
    href: 'https://doi.org/10.1070/PU1966v009n02ABEH002879',
    title: 'Macroscopic Symmetry and Properties of Crystals',
    description: 'V. A. Koptsik (1966). Shubnikov groups and their physical applications.',
  },
  {
    href: 'https://www.cryst.ehu.es/',
    title: 'Bilbao Crystallographic Server',
    description: 'Online tools for crystallography, magnetic symmetry, and group theory.',
    openAccess: true,
  },
  {
    href: 'https://doi.org/10.1364/JOSAB.22.000096',
    title: 'SHG as a Tool for Studying Electronic and Magnetic Structures of Crystals',
    description:
      'Fiebig, M., Pavlov, V. V., & Pisarev, R. V. (2005). Review of magnetic SHG, including the Cr2O3 magnetoelectric tensor and its symmetry derivation. J. Opt. Soc. Am. B 22, 96.',
  },
];

/** The Deeper tab of the Help page. */
export function DeeperHelp() {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest">i-type vs. c-type Tensors</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          Every magnetic point group <InlineMath math="G" /> can be written as <InlineMath math="G = H + 1'(G - H)" />,
          where <InlineMath math="H" /> is the halving subgroup of elements that do not include time reversal, and{' '}
          <InlineMath math="1'" /> is the time-reversal operation.
        </p>
        <p className="text-sm opacity-70 leading-relaxed">
          <strong>i-type (time-even):</strong> The tensor is invariant under <em>all</em> operations of{' '}
          <InlineMath math="G" />, including the time-reversed ones. Physically, i-type tensors describe properties that
          do not depend on the magnetic order — they survive even when the material is demagnetized. Example: the
          crystal structure contribution to SHG.
        </p>
        <p className="text-sm opacity-70 leading-relaxed">
          <strong>c-type (time-odd):</strong> The tensor is invariant under <InlineMath math="H" /> but changes sign
          under the time-reversed operations. Physically, c-type tensors describe properties that reverse with the
          magnetic order. Example: the magnetization-induced SHG contribution that flips sign when the sample is
          demagnetized or the magnetic domains are reversed. For gray groups (
          <InlineMath math="G = H \times \{1, 1'\}" />
          ), the c-type tensor is identically zero.
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest">Why settings exist: the three mechanisms</h3>
        <div className="space-y-3 pl-4 border-l-2 border-ink border-opacity-20 my-4">
          <p className="text-sm opacity-70 leading-relaxed">
            <strong>Mechanism A (classical setting ambiguity):</strong> inherited from the spatial group — the two
            in-plane symmetry-direction sets carry <em>different</em> element types (e.g. 2-folds vs. mirrors in
            tetragonal <InlineMath math="\bar{4}2m" /> vs. <InlineMath math="\bar{4}m2" />
            ).
          </p>
          <p className="text-sm opacity-70 leading-relaxed">
            <strong>Mechanism B (time-reversal-broken equivalence):</strong> the two in-plane direction sets carry the{' '}
            <em>same</em> element type, so the non-magnetic parent has only one setting; priming one set but not the
            other (e.g. <InlineMath math="6'mm'" /> vs. <InlineMath math="6'm'm" />) breaks that equivalence.
          </p>
          <p className="text-sm opacity-70 leading-relaxed">
            <strong>Axis orientation (orthorhombic):</strong> three settings (c-unique, a-unique, and b-unique) choosing
            which crystal axis carries the group's distinguished direction — the axis that differs from the other two.
            The distinction is either classical (the unique polar / 2-fold axis, e.g. <InlineMath math="mm2" />) or
            time-reversal-driven (the operation whose primed / un-primed status is unique, e.g. the un-primed 2-fold in{' '}
            <InlineMath math="2'2'2" />, or the primed mirror in <InlineMath math="mmm'" />
            ). Groups whose three axes are equivalent — <InlineMath math="222" />, <InlineMath math="mmm" />,{' '}
            <InlineMath math="m'm'm'" />, and the gray forms <InlineMath math="2221'" />, <InlineMath math="mmm1'" /> —
            have a single setting only.
          </p>
          <p className="text-sm opacity-70 leading-relaxed">
            <strong>Axis convention (monoclinic, 2 settings):</strong> not a different orientation but a different
            naming convention for the same physical axis choice — <em>First</em> (
            <InlineMath math="c" />
            -unique, Birss) and <em>Second</em> (<InlineMath math="b" />
            -unique, ITC).
          </p>
        </div>
        <p className="text-sm opacity-70 leading-relaxed">
          Mechanisms A and B never co-occur in the same group (one requires the two direction sets to differ in element
          type, the other requires them to match), and the orthorhombic/monoclinic axis mechanisms are unrelated to time
          reversal entirely — so the maximum is 3 settings, never 4.
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest">Voigt symmetry and Voigt notation</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          <strong>Voigt symmetry</strong> is the full set of intrinsic symmetries of the elastic tensor:{' '}
          <InlineMath math="c_{ijkl}" /> is unchanged when you swap <InlineMath math="i" /> and <InlineMath math="j" />,
          when you swap <InlineMath math="k" /> and <InlineMath math="l" /> (stress and strain are themselves
          symmetric), and when you exchange the pair <InlineMath math="ij" /> with the pair <InlineMath math="kl" /> (an
          energy argument: the elastic energy is a quadratic form). Together these cut the 81 components of a general
          rank-4 tensor down to at most 21 independent ones — before any crystal symmetry is applied. Some rank-4
          tensors carry only the pair symmetries without the pair exchange (the photoelastic tensor is the standard
          example); their Voigt matrix is a general, not a symmetric, 6x6 array.
        </p>
        <p className="text-sm opacity-70 leading-relaxed">
          <strong>Voigt notation</strong> is the bookkeeping that exploits this: a symmetric index pair takes only six
          values, so it is compressed to a single index 1…6 in the fixed order{' '}
          <InlineMath math="xx \to 1,\ yy \to 2,\ zz \to 3,\ yz \to 4,\ zx \to 5,\ xy \to 6" />. The elastic tensor{' '}
          <InlineMath math="c_{ijkl}" /> then becomes a symmetric <InlineMath math="6\times6" /> matrix{' '}
          <InlineMath math="c_{mn}" />, and a rank-3 tensor with a symmetric jk pair (piezoelectricity{' '}
          <InlineMath math="d_{ijk}" />) becomes the <InlineMath math="3\times6" /> scheme <InlineMath math="d_{im}" />.
          This is exactly the Nye scheme the Tables page displays: its rows are the free index{' '}
          <InlineMath math="i = x, y, z" /> and its columns are the compressed pairs in the order above.
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest">Reading Birss's Parentheses</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          Birss's Table 7 marks some group symbols and tensor-form letters with parentheses -- e.g.{' '}
          <InlineMath math="(-6'2m')" /> -- to flag that the printed tensor form is expressed in axes rotated away from
          the row's standard orientation (30° for trigonal/hexagonal pairs, 45° for tetragonal). The bracket is a frame
          assertion, not decoration: the app's fixed-frame tensor output already accounts for it by direct projection,
          so no bracket-tracking step is needed at runtime. See{' '}
          <code className="text-xs">docs/references/BIRSS-ITC-CONVENTION-DIVERGENCES.md</code> for the full derivation.
        </p>
        <p className="text-sm opacity-70 leading-relaxed">
          Two rows of Birss's own printed Table 7 omit brackets that its own generator column (Table 6) requires:{' '}
          <InlineMath math="(\bar{6}'2m')" /> (i-cells) and <InlineMath math="\bar{6}m'2'" /> (A- and c-cells). These
          are documented book printing errors -- the app's values for both groups are correct and independently verified
          against the book's own generators and against ITC Table 1.5.7.1.
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest">Table 7: reading the letter columns directly</h3>
        <p className="text-sm opacity-70 leading-relaxed">
          The printed Table 7 also lists the resulting class letters directly, in its last eight columns — with the book
          in hand, you can read your letter straight off. Those columns are <strong>built</strong> from A and B by the
          cross-formula, and the app's chain display walks that construction rather than the shortcut, for two reasons:
          the rotation step (step 5 of the recipe in the Tables tab) needs the source symbol anyway, and only the
          construction makes visible why a polar tensor can end up being read from an axial column.
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          References
        </h3>
        <ul className="text-sm opacity-70 space-y-4 list-none">
          {REFERENCES.map((reference) => (
            <li
              key={reference.href}
              className="p-4 border border-ink border-opacity-10 hover:bg-ink/5 transition-colors"
            >
              <a href={reference.href} target="_blank" rel="noopener noreferrer" className="block space-y-1">
                <span className="font-medium underline">
                  {reference.title}
                  {reference.openAccess && (
                    <span className="ml-2 text-xs uppercase tracking-widest text-ink/70 no-underline">Open Access</span>
                  )}
                </span>
                <span className="block opacity-80 text-xs">{reference.description}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm opacity-70">
          <span className="font-medium">Sources & reference.</span> The same Birss tables and convention notes the app
          is built on are available in full in the project repository under{' '}
          <a
            href="https://github.com/manganite/birss-app/tree/main/birss-tables"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            birss-tables/
          </a>
          .
        </p>
      </div>
    </section>
  );
}
