import React from 'react';
import { InlineMath } from 'react-katex';
import { ChevronRight } from 'lucide-react';
import { TENSOR_EFFECTS } from '../data/tensorEffects';
import { intrinsicLabel } from '../data/intrinsicLabels';
import type { TensorRank } from '../services/tensorForms';
import { POINT_GROUPS } from '../data/pointGroups';
import { LookupChainDiagram } from './LookupChainDiagram';

/**
 * Content for the Help "Tables" tab. Prose, tables and tooltip copy are taken verbatim from the
 * Tables documentation content spec; the effect catalogue is data-driven from TENSOR_EFFECTS (single
 * source), and the section-(d) worked examples embed live LookupChainDiagram instances so they can
 * never drift from getTable7Chain. Style mirrors the Physics & Group Theory tab.
 */

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-bold uppercase tracking-widest">{children}</h3>
);
const Prose = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm opacity-70 leading-relaxed">{children}</p>
);

const MODES: { title: string; body: React.ReactNode }[] = [
  {
    title: 'By tensor type (the core function)',
    body: <>Build the tensor yourself — any rank from 0 to 4, polar or axial, i-type or c-type, plus an intrinsic index symmetry where meaningful. Every form the book tabulates — classical and magnetic, i-type and c-type — can be reached this way.</>,
  },
  {
    title: 'By effect (a convenience on top)',
    body: <>Choose a named physical effect (pyroelectricity, electric permittivity, the linear magnetoelectric effect, piezoelectricity, piezomagnetism, elasticity, …). The page shows the effect's defining equation and fills in the tensor's rank, parities and index symmetry for you.</>,
  },
];

const RESULTS: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Tensor form',
    body: <>Rendered to fit the rank and its index symmetry: a one-line statement (rank 0), a vector (rank 1), a <InlineMath math="3\times3" /> matrix (rank 2), or a Voigt-compressed matrix wherever an index pair is symmetric — the <InlineMath math="3\times6" /> Nye scheme (rank 3, <InlineMath math="i(jk)" />), a <InlineMath math="6\times3" /> matrix (rank 3, <InlineMath math="(ij)k" />) or a <InlineMath math="6\times6" /> matrix (rank 4 pair symmetries). Otherwise (general rank 3 and rank 4) a list of the independent components and their relations.</>,
  },
  {
    title: 'Independent components',
    body: <>The number of independent components, or the statement that the tensor vanishes identically (the effect is forbidden by symmetry).</>,
  },
  {
    title: 'Lookup chain',
    body: <>Which book route produced this row — the classical chain via Table 4a, or, for c-tensors of black-white groups, the Table 7 route (see the sections below).</>,
  },
  {
    title: 'Groups sharing this form',
    body: <>All point groups whose tensor of this type has the same form.</>,
  },
];

const SELECTORS: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Rank',
    body: <>The number of indices — one index per direction the tensor couples to. A rank-0 tensor is a single number; rank 1 is a vector (one response direction, e.g. a spontaneous polarization); rank 2 is a <InlineMath math="3\times3" /> matrix (response direction × field direction, e.g. permittivity); rank 3 couples one vector to a two-index quantity (e.g. piezoelectricity: polarization from stress); rank 4 connects two two-index quantities (elasticity: stress from strain). Whether the rank is <strong>even</strong> or <strong>odd</strong> matters in the lookup below: it selects the Table 4a column.</>,
  },
  {
    title: 'Spatial parity: polar or axial',
    body: <>Polar quantities behave like arrows: a mirror reflects them the way it reflects an arrow. Electric field <InlineMath math="E" />, polarization <InlineMath math="P" />, and stress are polar (parities belong to physical quantities of any rank — stress is a polar rank-2 quantity). Axial quantities behave like circulation — a rotation sense or a current loop: a mirror reverses them in a different pattern than an arrow. Magnetic field <InlineMath math="H" /> and magnetization <InlineMath math="M" /> are axial. By the product rule, a tensor relating polar to polar is polar (permittivity: <InlineMath math="D" /> from <InlineMath math="E" />); a tensor with one axial quantity on one side is axial (the magnetoelectric tensor: <InlineMath math="P" /> from <InlineMath math="H" />; piezomagnetism: <InlineMath math="M" /> from stress).</>,
  },
  {
    title: 'Time parity: i-type or c-type',
    body: <>Run the film backwards. Quantities tied to motion — currents, magnetic moments, <InlineMath math="M" /> and <InlineMath math="H" /> — reverse sign under time reversal; charges, <InlineMath math="E" />, <InlineMath math="P" /> and stress do not. By the same product rule, a tensor connecting two time-even quantities is i-type (time-<strong>invariant</strong>); a tensor with one time-odd quantity on one side is c-type (time-<strong>noninvariant</strong> — it changes sign). c-type tensors can only survive in crystals whose magnetic order breaks time-reversal symmetry — this is why the magnetoelectric effect and piezomagnetism are markers of magnetic order, and why grey groups (those containing time reversal itself) forbid them outright — see the Table 7 section below.</>,
  },
  {
    title: 'Intrinsic index symmetry',
    body: <>Some index pairs can be swapped for free — not because of the crystal, but because of the physics of the coupling. Piezoelectricity couples to the stress tensor, which is symmetric, so its last two indices satisfy <InlineMath math="d_{ijk} = d_{ikj}" />. Permittivity is symmetric (<InlineMath math="\varepsilon_{ij} = \varepsilon_{ji}" />) on energy grounds. Elasticity carries the full Voigt symmetry — see the Deeper Topics entry <em>Voigt symmetry and Voigt notation</em>. The selector only offers the symmetries that are meaningful at the chosen rank; "none" is always available for the general tensor.</>,
  },
];


const Chevron = () => <ChevronRight className="w-3 h-3 opacity-40 inline align-middle" aria-hidden />;

/** A faithful static replica of the Tables-page breadcrumb line (identical classes) for the section
 * (c) worked example: 32 + piezoelectricity (classical i-type chain). */
function ClassicalBreadcrumbExample() {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/60 bg-ink/5 border border-ink/10 px-4 py-2.5 rounded-sm">
      <span className="font-serif italic text-ink"><InlineMath math="32" /></span>
      <Chevron />
      <span>family class <span className="font-serif italic text-ink/80"><InlineMath math="L" /></span> <span className="opacity-50">(Table 4a)</span></span>
      <Chevron />
      <span>ref. axes <InlineMath math="3 \parallel z,\, 2 \parallel y" /></span>
      <Chevron />
      <span>Table 4e row <span className="font-mono text-ink/80">L3</span></span>
    </div>
  );
}

function HelpDiagram({ name, parity, rank, timeParity }: { name: string; parity: 'polar' | 'axial'; rank: TensorRank; timeParity: 'i' | 'c' }) {
  const group = POINT_GROUPS.find(g => g.name === name);
  if (!group) return null;
  return <LookupChainDiagram groupName={name} groupType={group.type} parity={parity} rank={rank} timeParity={timeParity} />;
}

export function TablesHelp() {
  return (
    <section className="space-y-8">
      {/* ---- Section (a): What the Tables page shows ---- */}
      <div className="space-y-4">
        <H3>What the Tables page shows</H3>
        <Prose>
          The Tables page is the app's interactive version of consulting the tables in R. R. Birss, <em>Symmetry and Magnetism</em> (1966) — the reference this whole app is built on. Instead of walking the multi-step lookup by hand, you pick a point group and a tensor, and the page shows the resulting symmetry-reduced form together with the lookup route that produced it.
        </Prose>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODES.map(m => (
            <div key={m.title} className="p-4 border border-ink border-opacity-10 space-y-2">
              <h4 className="font-medium">{m.title}</h4>
              <p className="text-xs opacity-70 leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs uppercase tracking-widest text-ink/50 pt-2">What you get</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RESULTS.map(r => (
            <div key={r.title} className="p-4 border border-ink border-opacity-10 space-y-2">
              <h4 className="font-medium">{r.title}</h4>
              <p className="text-xs opacity-70 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs opacity-70 leading-relaxed italic">
          Colourless (classical) groups contain no time-reversal element; <strong>grey</strong> groups contain time reversal itself; <strong>black-white</strong> groups contain it only in combination with rotations or mirrors. The three types are described under Group Types in Physics &amp; Group Theory.
        </p>
        <p className="text-xs opacity-70 leading-relaxed italic">
          All forms are computed by the app's engine and verified against table transcriptions that were themselves checked line by line against the printed book.
        </p>
      </div>

      {/* ---- Section (b): Choosing a tensor ---- */}
      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <H3>Choosing a tensor</H3>
        <div className="p-6 bg-ink/5 border border-ink border-opacity-10 space-y-3">
          <Prose>
            Every selector on the Tables page answers one question about the physical quantity you are interested in. A property tensor <em>connects</em> physical quantities (a response to a field, a moment to a temperature change), and it inherits its character from the quantities it connects.
          </Prose>
          <p className="text-sm leading-relaxed">
            <strong>Product rule: the tensor's parity is the product of the parities of the quantities on either side of its defining equation.</strong> Both the spatial (polar/axial) and time (i/c) parities follow it.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SELECTORS.map(s => (
            <div key={s.title} className="p-4 border border-ink border-opacity-10 space-y-2">
              <h4 className="font-medium">{s.title}</h4>
              <p className="text-xs opacity-70 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="text-xs uppercase tracking-widest text-ink/50 pt-2">The effect catalogue</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink/20 text-ink/60 uppercase tracking-wider">
                <th className="p-2 font-medium">Effect</th>
                <th className="p-2 font-medium">Equation</th>
                <th className="p-2 font-medium">Rank</th>
                <th className="p-2 font-medium">Spatial</th>
                <th className="p-2 font-medium">Time</th>
                <th className="p-2 font-medium">Index symmetry</th>
              </tr>
            </thead>
            <tbody>
              {TENSOR_EFFECTS.map(e => (
                <tr key={e.id} className="border-b border-ink/10">
                  <td className="p-2">{e.label}</td>
                  <td className="p-2">{e.equation ? <InlineMath math={e.equation} /> : '—'}</td>
                  <td className="p-2 font-mono">{e.spec.rank}</td>
                  <td className="p-2">{e.spec.parity}</td>
                  <td className="p-2">{e.spec.timeParity}</td>
                  <td className="p-2">{intrinsicLabel(e.spec.intrinsic, e.spec.rank)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Prose>
          Reading the table against the product rule is a good exercise: every "axial" and every "c" in it comes from exactly one <InlineMath math="M" /> or <InlineMath math="H" /> in the defining equation.
        </Prose>
        <p className="text-xs opacity-70 leading-relaxed italic">
          The formal version of both parities — the <InlineMath math="[\det(R)]^p" /> factor and the <InlineMath math="\varepsilon" /> factor in Neumann's principle — is derived in Physics &amp; Group Theory.
        </p>
      </div>

      {/* ---- Section (c): The classical lookup chain (Table 4a) ---- */}
      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <H3>The classical lookup chain (Table 4a)</H3>
        <Prose>
          For classical (colourless) groups, Birss's tables answer every tensor-form question in two steps. The Tables page walks the same two steps and shows them as the breadcrumb above each result — the app lookup and the manual book lookup are recognizably the same procedure.
        </Prose>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">Step 1: group → class letter</h4>
            <p className="text-xs opacity-70 leading-relaxed">
              Table 4a sorts the 32 classical point groups into symbol classes named by letters A to U. Groups in one class have identical tensor forms, so the letter — not the individual group — selects the row in the form tables. Each group carries one letter for polar-even/axial-odd tensors and one for axial-even/polar-odd tensors — at most <strong>two</strong> distinct letters per group, not four. For purely rotational groups the two coincide (<InlineMath math="32" /> is L for every species); for groups with mirrors they usually differ (<InlineMath math="mm2" /> is D for polar-even but E for axial-even). Where Table 4a shows a dash instead of a letter, that tensor species is forbidden outright — e.g. a centrosymmetric group has no odd-rank polar tensors: inversion alone kills them. The class also fixes the <strong>reference axes</strong>: the tabulated forms are written in one specific orientation of the group.
            </p>
          </div>
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">Step 2: class letter + rank → table row</h4>
            <p className="text-xs opacity-70 leading-relaxed">
              The rank picks the form table — 4b (rank 0), 4c (rank 1), 4d (rank 2), 4e (rank 3), 4f (rank 4) — and the row is named <span className="font-mono">letter + rank</span>: class E at rank 2 is row E2 of Table 4d. The row lists which components vanish, which are equal, and which differ by a sign; the independent ones that remain are the tensor's free parameters.
            </p>
          </div>
        </div>
        <div className="space-y-3 pl-4 border-l-2 border-ink border-opacity-20 my-2">
          <p className="text-sm opacity-70 leading-relaxed">
            <strong>Worked example.</strong> Quartz, point group <InlineMath math="32" />, piezoelectricity (rank 3, polar, i-type, jk-symmetric). Step 1: Table 4a puts <InlineMath math="32" /> in class L. Step 2: rank 3 selects Table 4e, row L3. That row lists four independent components (before any intrinsic index symmetry); applying the piezoelectric jk-symmetry reduces them to two. The breadcrumb on the Tables page shows exactly this route:
          </p>
          <ClassicalBreadcrumbExample />
        </div>
        <div className="p-4 border border-ink/10 bg-ink/5 space-y-2">
          <Prose>
            Magnetic groups reuse this chain for <em>half</em> of their tensors: the i-type tensors of any magnetic group are those of its unprimed classical skeleton, looked up exactly as above. The c-type tensors of black-white groups take a different route through the book — Birss's Table 7, next section. For grey groups the c-route ends before it starts: every c-tensor vanishes.
          </Prose>
        </div>
      </div>

      {/* ---- Section (d): Magnetic c-tensors -- the Table 7 route ---- */}
      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <H3>Magnetic c-tensors — the Table 7 route</H3>
        <Prose>
          For colourless groups — and for i-type tensors of any group — the app looks a tensor form up through the classical chain above. For a c-type tensor of a black-white group that chain does not apply. Birss instead assigns every black-white group two <strong>associated classical groups</strong>, called A and B (his Table 7), and the c-tensor form is read from the Table 4a entry of A or B.
        </Prose>
        <p className="text-xs opacity-70 leading-relaxed italic">
          Table 7 also lists the resulting class letters directly — see the Deeper Topics note <em>Table 7: reading the letter columns directly</em>. The app walks the construction instead, because it makes the parity crossover visible and needs the source symbol for the rotation step.
        </p>

        <div className="p-6 bg-ink/5 border border-ink border-opacity-10 space-y-3">
          <p className="text-xs uppercase tracking-widest text-ink/60">The recipe</p>
          <ol className="text-sm opacity-70 leading-relaxed list-decimal list-inside space-y-2">
            <li>Find the magnetic group's row in Table 7 and read off its two associated classical groups A and B.</li>
            <li>From your tensor's <strong>spatial parity</strong> (polar/axial) and its <strong>rank parity</strong> (even/odd), pick the source group and the Table 4a column to read — see the table below.</li>
            <li>Look up that source group's class letter in Table 4a, in that column. (This reproduces the letter printed in your tensor's own column of Table 7.)</li>
            <li>Open the rank table (4b to 4f) at the row <span className="font-mono">letter + rank</span>.</li>
            <li>If the source symbol is printed in parentheses, the tabulated form is valid in a <strong>rotated axis setting</strong>; in the group's own reference frame the form is the transformed one. (See <em>Reading Birss's Parentheses</em> under Deeper Topics.) The app always shows the form in the group's own frame.</li>
          </ol>
        </div>

        <p className="text-xs uppercase tracking-widest text-ink/50">The cross-formula</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink/20 text-ink/60 uppercase tracking-wider">
                <th className="p-2 font-medium">your c-tensor</th>
                <th className="p-2 font-medium">source group</th>
                <th className="p-2 font-medium">Table 4a column read</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink/10"><td className="p-2">polar, even rank</td><td className="p-2 font-mono">B</td><td className="p-2">Axial, even rank <span className="font-bold" title="parity crossover">*</span></td></tr>
              <tr className="border-b border-ink/10"><td className="p-2">axial, even rank</td><td className="p-2 font-mono">A</td><td className="p-2">Axial, even rank</td></tr>
              <tr className="border-b border-ink/10"><td className="p-2">polar, odd rank</td><td className="p-2 font-mono">A</td><td className="p-2">Polar, odd rank</td></tr>
              <tr className="border-b border-ink/10"><td className="p-2">axial, odd rank</td><td className="p-2 font-mono">B</td><td className="p-2">Polar, odd rank <span className="font-bold" title="parity crossover">*</span></td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs opacity-70 leading-relaxed">
          <span className="font-bold">*</span> <strong>Parity crossover:</strong> in these two cases the Table 4a column has the <em>opposite</em> spatial parity to your tensor. This is deliberate — it is how Birss's bookkeeping works out — and the lookup-chain display marks these steps, so you can always see when a polar tensor is being read from an axial column (or vice versa).
        </p>

        <div className="p-4 border border-ink/10 bg-ink/5">
          <Prose>
            <strong>Grey groups</strong> contain time reversal <em>itself</em> as a symmetry element. A c-type tensor changes sign under time reversal alone, so every component must equal its own negative: the tensor vanishes identically, for every rank and parity. Grey groups therefore have no Table 7 row, and the app shows this as a short chain ending in "vanishes identically".
          </Prose>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <p className="text-sm opacity-70 leading-relaxed"><strong>Example 1 — parity crossover.</strong> Group <InlineMath math="m'm'm" />, polar c-tensor of rank 2. Table 7 gives A = mmm, B = mm2. Polar + even rank → source B = mm2, read in the Axial-even column of Table 4a → class E → Table 4d, row E2. A polar tensor, read from an axial column: the crossover at work.</p>
            <HelpDiagram name="m'm'm" parity="polar" rank={2} timeParity="c" />
          </div>
          <div className="space-y-2">
            <p className="text-sm opacity-70 leading-relaxed"><strong>Example 2 — rotated source.</strong> Group <InlineMath math="4'mm'" />, polar c-tensor of rank 3 (the tensor type of optical second-harmonic generation, the app's main use case — see Physics &amp; Group Theory). Table 7 gives A = <InlineMath math="(\bar{4}m2)" />, B = <InlineMath math="\bar{4}2m" />. Polar + odd rank → source A, Polar-odd column → class J → Table 4e, row J3. A is printed in parentheses: the row J3 form is valid in axes rotated by 45° about z; the app transforms it back and displays the form in the group's own frame.</p>
            <HelpDiagram name="4'mm'" parity="polar" rank={3} timeParity="c" />
          </div>
          <div className="space-y-2">
            <p className="text-sm opacity-70 leading-relaxed"><strong>Example 3 — grey group.</strong> Group <InlineMath math="321'" />. Time reversal alone is a symmetry element, so every c-tensor vanishes identically — there is no Table 7 row to consult. The i-tensors of <InlineMath math="321'" /> are simply those of <InlineMath math="32" />.</p>
            <HelpDiagram name="321'" parity="polar" rank={3} timeParity="c" />
          </div>
        </div>

        <p className="text-xs opacity-70 leading-relaxed italic">
          Two rows of the printed Table 7 contain documented misprints (see the project's convention-divergences reference). Where a misprint would change the physical form, the app follows the row's own generators and marks the affected lookup with a footnote.
        </p>
      </div>

      {/* ---- Section (e): Reading the results ---- */}
      <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
        <H3>Reading the results</H3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">The reduced form</h4>
            <p className="text-xs opacity-70 leading-relaxed">Whatever the rank-specific rendering, every reduced form encodes the same three things: which components <strong>vanish</strong>, which are <strong>equal</strong> (possibly up to a sign), and which remain <strong>free</strong>.</p>
          </div>
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">Independent components</h4>
            <p className="text-xs opacity-70 leading-relaxed"><strong>Symmetry fixes the pattern — the zeros, equalities and signs — but never the values.</strong> The free components are material constants that only experiment (or a microscopic calculation) can supply. Two crystals in the same point group share the pattern, not the numbers.</p>
          </div>
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">Vanishes identically / forbidden</h4>
            <p className="text-xs opacity-70 leading-relaxed"><strong>Exactly zero by symmetry, not merely small.</strong> Measuring a clearly nonzero response where the assumed group forbids one means the assumed symmetry is wrong (or has been broken, e.g. by strain or magnetic ordering). One caution: "forbidden" refers to this tensor order only; a signal may still arise from higher-order contributions with their own, less restrictive tensor forms.</p>
          </div>
          <div className="p-4 border border-ink border-opacity-10 space-y-2">
            <h4 className="font-medium">Groups sharing this form</h4>
            <p className="text-xs opacity-70 leading-relaxed"><strong>A measurement of this tensor alone cannot distinguish the groups in the list.</strong> Forms are first transformed into one common reference frame and only then compared, so a group tabulated in a rotated setting still counts as sharing. For the linear magnetoelectric effect, these blocks reproduce the standard classification of the 58 magnetoelectric groups into the eleven distinct matrix forms known from the ITC tables.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
