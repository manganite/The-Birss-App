import { useCallback, useState } from 'react';
import { InlineMath } from 'react-katex';
import type { NyeScheme, NyeCell } from '../../services/nyeScheme';
import { formatCoeff } from '../../services/tensorCalculator';

/**
 * The Nye dot diagram for a computed tensor form.
 *
 * GLYPH VOCABULARY, after Nye, as reproduced in ITC Vol. D Sec. 1.1.4 and in Yariv,
 * *Quantum Electronics* 2nd ed., Table 16.1 (which is itself "after" Nye). Both print sources are
 * independent of Birss and of this engine but not of each other; the cell sets this view draws are
 * gated against Yariv in `yarivT161.reference.test.ts`.
 *
 * WHAT IS DELIBERATELY NOT REPRODUCED. The printed tables route static lines between linked
 * components, and at rank 4 that routing becomes unreadable. Class membership is shown here by
 * interaction instead -- hover, tap or focus a cell and its partners light up with transient
 * connectors. So that the information survives without colour and without a pointer, every
 * non-vanishing cell also carries a small class-index badge, and the full partition is available to
 * assistive technology as a list.
 *
 * i/c-AGNOSTICISM. This component never sees the tensor's spatial or time parity; it draws the
 * computed form. Magnetic c-tensors reach their form through Birss's Table 7 and are then drawn by
 * this same code. i/c and the magnetic lookup select WHICH form applies, never how it is notated.
 */

/** Fixed geometry, so connector endpoints are arithmetic rather than measured. */
const CELL = 44;
const HEADER_W = 34;
const HEADER_H = 26;

const cx = (col: number) => HEADER_W + col * CELL + CELL / 2;
const cy = (row: number) => HEADER_H + row * CELL + CELL / 2;

/** Plain-text component index for a cell, e.g. `xzx` -- the row slot followed by the column slot. */
const indexOf = (scheme: NyeScheme, cell: NyeCell) => `${scheme.rows[cell.row].label}${scheme.cols[cell.col].label}`;

/** The coefficient to annotate, or '' when the magnitude is 1 (formatCoeff absorbs float noise). */
const coeffOf = (cell: NyeCell) => formatCoeff(Math.abs(cell.ratio));

function describe(scheme: NyeScheme, cell: NyeCell): string {
  const idx = indexOf(scheme, cell);
  if (cell.kind === 'zero') return `${idx}, vanishes`;
  const n = (cell.classId ?? 0) + 1;
  if (cell.kind === 'composite') return `${idx}, class ${n}, fixed by a relation between classes`;
  const coeff = coeffOf(cell);
  if (cell.kind === 'representative') return `${idx}, class ${n}, independent component`;
  if (coeff !== '')
    return `${idx}, class ${n}, ${coeff} times the class representative${cell.ratio < 0 ? ', opposite in sign' : ''}`;
  return `${idx}, class ${n}, ${cell.ratio < 0 ? 'equal and opposite in sign' : 'equal'}`;
}

/** One class as a readable chain, e.g. `xzx = yyz` or `xxx = -xyy = -yxy`. */
function chainOf(scheme: NyeScheme, classId: number): string {
  const cls = scheme.classes[classId];
  return cls.cells
    .map((index, n) => {
      const cell = scheme.cells[index];
      const coeff = coeffOf(cell);
      const sign = cell.ratio < 0 ? '-' : '';
      return n === 0 ? indexOf(scheme, cell) : `${sign}${coeff}${indexOf(scheme, cell)}`;
    })
    .join(' = ');
}

/** The glyph for one cell, drawn at the origin of its own 44x44 cell box. */
function Glyph({ cell }: { cell: NyeCell }) {
  const half = CELL / 2;
  if (cell.kind === 'zero') {
    return <circle cx={half} cy={half} r={2.5} className="fill-ink/25" />;
  }
  if (cell.kind === 'composite') {
    // Nye marks the DEPENDENT cell, not the ones the relation is built from (his cross sits on the
    // composite modulus). The contributing cells stay ordinary dots and answer on interaction.
    return (
      <g className="stroke-ink" strokeWidth={2} strokeLinecap="round">
        <line x1={half - 6} y1={half - 6} x2={half + 6} y2={half + 6} />
        <line x1={half - 6} y1={half + 6} x2={half + 6} y2={half - 6} />
      </g>
    );
  }
  // A negative partner is drawn as Yariv's open circle -- "numerically equal, but opposite in sign".
  return cell.ratio < 0 ? (
    <circle cx={half} cy={half} r={6} className="fill-paper stroke-ink" strokeWidth={1.75} />
  ) : (
    <circle cx={half} cy={half} r={6.5} className="fill-ink" />
  );
}

const LEGEND: Array<{ draw: React.ReactNode; text: string }> = [
  { draw: <circle cx={11} cy={11} r={2.5} className="fill-ink/25" />, text: 'vanishes' },
  { draw: <circle cx={11} cy={11} r={6.5} className="fill-ink" />, text: 'independent, or equal to its partner' },
  {
    draw: <circle cx={11} cy={11} r={6} className="fill-paper stroke-ink" strokeWidth={1.75} />,
    text: 'numerically equal, opposite in sign',
  },
  {
    draw: (
      <g className="stroke-ink" strokeWidth={2} strokeLinecap="round">
        <line x1={5} y1={5} x2={17} y2={17} />
        <line x1={5} y1={17} x2={17} y2={5} />
      </g>
    ),
    text: 'fixed by a relation between classes',
  },
];

export function NyeSchemeDiagram({ scheme }: { scheme: NyeScheme }) {
  const [active, setActive] = useState<number | null>(null);

  /**
   * Roving tabindex (WAI-ARIA composite pattern, as `useTablistKeyboard` does it for the tab
   * widgets). The grid holds exactly ONE tab stop however many cells it has: the stop carries
   * `tabIndex={0}` and every other interactive cell `tabIndex={-1}`, so Tab enters the grid once
   * and the next Tab leaves it. Arrow keys move focus, and the stop follows via `onFocus`.
   *
   * The stop PERSISTS after focus leaves, per the A-series precedent -- returning by Tab lands
   * where the user left, not back at the start.
   *
   * `tabStop` holds a cell index rather than an ordinal, and is validated against the current
   * scheme on every render: switching group or spec replaces the cell set, and a stale index must
   * fall back to the first interactive cell rather than leave the grid with no tab stop at all.
   * Doing that in the render pass rather than an effect means there is never a frame without one.
   */
  const interactive = scheme.cells.reduce<number[]>((acc, cell, index) => {
    if (cell.kind !== 'zero') acc.push(index);
    return acc;
  }, []);
  const [tabStop, setTabStop] = useState<number | null>(null);
  const activeTabStop = tabStop !== null && interactive.includes(tabStop) ? tabStop : (interactive[0] ?? null);

  const width = HEADER_W + scheme.cols.length * CELL;
  const height = HEADER_H + scheme.rows.length * CELL;

  /**
   * Roving focus across the interactive cells, in READING ORDER -- not by grid position. The
   * non-vanishing cells are a sparse subset of the grid, so column-wise movement would keep landing
   * on gaps; all four arrow keys therefore step one cell forward or back through the same sequence
   * (Right/Down forward, Left/Up back), wrapping at both ends, with Home/End for the extremes and
   * Escape to clear the highlight.
   */
  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key, currentTarget, target } = event;
    if (key === 'Escape') {
      setActive(null);
      return;
    }
    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    const origin = (target as HTMLElement).closest?.<HTMLElement>('[data-cell]');
    if (!origin) return;
    const cells = Array.from(currentTarget.querySelectorAll<HTMLElement>('[data-cell]'));
    const at = cells.indexOf(origin);
    if (at === -1) return;
    event.preventDefault();
    const step = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
    const next = key === 'Home' ? 0 : key === 'End' ? cells.length - 1 : (at + step + cells.length) % cells.length;
    cells[next].focus();
  }, []);

  const activeCells = active === null ? [] : scheme.classes[active].cells;
  const activeComposite =
    active === null ? undefined : scheme.composites.find((c) => c.cells.some((i) => activeCells.includes(i)));

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="relative" style={{ width, height }} onKeyDown={onKeyDown} onMouseLeave={() => setActive(null)}>
          {/* Glyph and connector layer. Presentational: every cell is also a real control below. */}
          <svg width={width} height={height} className="absolute inset-0" aria-hidden="true" focusable="false">
            {scheme.cols.map((c, col) => (
              <text
                key={c.label}
                x={cx(col)}
                y={HEADER_H - 9}
                textAnchor="middle"
                className="fill-ink/50 text-[10px] uppercase tracking-wider"
              >
                {c.label}
              </text>
            ))}
            {scheme.rows.map((r, row) => (
              <text
                key={r.label}
                x={HEADER_W - 12}
                y={cy(row) + 4}
                textAnchor="middle"
                className="fill-ink/50 text-[10px] uppercase tracking-wider"
              >
                {r.label}
              </text>
            ))}

            {/* Transient connectors: only for the active class, plain orthogonal routing, crossings
                accepted. Nothing is routed when nothing is active -- see the component note. */}
            {activeCells.slice(1).map((index) => {
              const from = scheme.cells[activeCells[0]];
              const to = scheme.cells[index];
              return (
                <polyline
                  key={index}
                  points={`${cx(from.col)},${cy(from.row)} ${cx(from.col)},${cy(to.row)} ${cx(to.col)},${cy(to.row)}`}
                  className="fill-none stroke-ink/45"
                  strokeWidth={1.25}
                />
              );
            })}

            {scheme.cells.map((cell, index) => {
              const on = activeCells.includes(index);
              const coeff = cell.kind === 'zero' ? '' : coeffOf(cell);
              return (
                <g key={index} transform={`translate(${HEADER_W + cell.col * CELL}, ${HEADER_H + cell.row * CELL})`}>
                  {on && <rect x={2} y={2} width={CELL - 4} height={CELL - 4} rx={2} className="fill-ink/8" />}
                  <Glyph cell={cell} />
                  {cell.classId !== null && (
                    <text x={CELL - 7} y={13} textAnchor="end" className="fill-ink/55 text-[9px]">
                      {cell.classId + 1}
                    </text>
                  )}
                  {coeff !== '' && (
                    <text x={7} y={CELL - 7} className="fill-ink/70 text-[9px]">
                      {coeff}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Control layer: one focusable cell per grid position, transparent over the glyphs. */}
          {scheme.cells.map((cell, index) =>
            cell.kind === 'zero' ? null : (
              <button
                key={index}
                type="button"
                data-cell={indexOf(scheme, cell)}
                tabIndex={index === activeTabStop ? 0 : -1}
                className="absolute focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                style={{ left: HEADER_W + cell.col * CELL, top: HEADER_H + cell.row * CELL, width: CELL, height: CELL }}
                onMouseEnter={() => setActive(cell.classId)}
                // The tab stop follows focus, whatever moved it -- arrow keys, Tab, or a click.
                onFocus={() => {
                  setActive(cell.classId);
                  setTabStop(index);
                }}
                // Selects, never toggles: with a mouse the hover has already selected this class, so
                // a toggling click would clear the very highlight it was meant to show. Leaving the
                // grid or pressing Escape is what clears it.
                onClick={() => setActive(cell.classId)}
              >
                <span className="sr-only">{describe(scheme, cell)}</span>
              </button>
            ),
          )}
        </div>
      </div>

      {/* Interaction read-out: the active class's chain, and any relation binding it. */}
      <p className="text-xs text-ink/70 min-h-[1.5rem]" aria-live="polite" data-nye-status="">
        {active === null ? (
          <span className="text-ink/45">Hover, tap or focus a component to see the class it belongs to.</span>
        ) : (
          <span className="font-mono">
            Class {active + 1}: {chainOf(scheme, active)}
            {activeComposite && (
              <>
                {' — '}
                <InlineMath math={activeComposite.text} />
              </>
            )}
          </span>
        )}
      </p>

      {/* The partition, for assistive technology and for anyone without a pointer. */}
      <ul className="sr-only" aria-label="Component classes">
        {scheme.classes.map((cls) => (
          <li key={cls.id}>
            Class {cls.id + 1}: {chainOf(scheme, cls.id)}
            {cls.determined ? ', fixed by a relation between classes' : ''}
          </li>
        ))}
      </ul>

      <div className="border-t border-ink/10 pt-3 space-y-2">
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {LEGEND.map((item) => (
            <li key={item.text} className="flex items-center gap-2 text-xs text-ink/70">
              <svg width={22} height={22} aria-hidden="true" className="shrink-0">
                {item.draw}
              </svg>
              {item.text}
            </li>
          ))}
        </ul>
        <p className="text-[11px] leading-relaxed text-ink/55">
          Glyph vocabulary after Nye, as reproduced in International Tables for Crystallography Vol. D Sec. 1.1.4 and in
          Yariv, <span className="italic">Quantum Electronics</span> 2nd ed., Table 16.1. The printed tables route
          static lines between linked components; that routing is not reproduced here — class membership is shown by the
          badges and by the highlight above.
        </p>
        <p className="text-[11px] leading-relaxed text-ink/55">
          The notation does not depend on the tensor being time-even or time-odd: a magnetic c-tensor reaches its form
          through Birss&apos;s Table 7 and is then drawn by this same diagram. Time reversal selects which form applies,
          never how it is written.
        </p>
      </div>
    </div>
  );
}
