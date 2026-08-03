import { buildOrientationScene, SCENE_WIDTH, SCENE_HEIGHT, type SceneAxis } from '../services/orientationScene';

/**
 * The sample-orientation scene beside the Simulator's crystal-rotation sliders.
 *
 * A fixed-viewpoint axonometric picture of the experiment: the sample as a flat slab that turns in
 * real time with the sliders, carrying the crystal axes x/y/z from one of its corners, in front of a
 * lab triad X/Y/Z that never moves and whose Z is the beam.
 *
 * IT DRAWS, IT DOES NOT DERIVE. Every coordinate comes from `services/orientationScene`, which in
 * turn takes its rotation matrix from the engine's `composeOrientationMatrix` -- the same function
 * the Simulator contracts the tensor with. This is the app's first PICTURE of that convention, and
 * the crystal-axes equation box a few rows above is the same information at zero rotation, in
 * symbols: the two cannot disagree, because neither derives the matrix itself. That box, which keeps
 * its subscripts, is also this widget's legend, which is why the labels here carry none.
 *
 * LABELLING. Lower-case x/y/z for the crystal axes, upper-case X/Y/Z for the lab axes -- the app's
 * established case convention, doing the work that subscripts do elsewhere. Lab Z carries a "|| k"
 * tag because the beam direction is the one fact the picture cannot show.
 *
 * VISUAL RESTRAINT, after the Nye view: ink and paper only, no new colour vocabulary. Depth is
 * carried by face opacity, and the triads are drawn last over a paper halo so an arrow is never
 * broken by an edge it passes behind.
 *
 * ACCESSIBILITY. The scene is a mirror of the slider state and adds no information a user could not
 * get from the sliders themselves, so it is one labelled image, not a set of controls: no tab stop,
 * no interactive surface, and an aria-label that names the cut and the three angles in the same
 * words the sliders use.
 */

/** Arrowhead half-width and length, in SVG user units. */
const HEAD_LENGTH = 7;
const HEAD_WIDTH = 3.1;

/** How far past the tip a label sits. */
const LABEL_GAP = 9;

function arrowHead(axis: SceneAxis): string {
  const dx = axis.to.x - axis.from.x;
  const dy = axis.to.y - axis.from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const bx = axis.to.x - HEAD_LENGTH * ux;
  const by = axis.to.y - HEAD_LENGTH * uy;
  // Normal to the shaft, for the two base corners.
  return [
    `${axis.to.x},${axis.to.y}`,
    `${bx - HEAD_WIDTH * uy},${by + HEAD_WIDTH * ux}`,
    `${bx + HEAD_WIDTH * uy},${by - HEAD_WIDTH * ux}`,
  ].join(' ');
}

function labelPoint(axis: SceneAxis) {
  const dx = axis.to.x - axis.from.x;
  const dy = axis.to.y - axis.from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: axis.to.x + (LABEL_GAP * dx) / len, y: axis.to.y + (LABEL_GAP * dy) / len + 3 };
}

/**
 * One arrow. Drawn twice: a paper-coloured halo first, then the ink stroke, so the triads read as
 * being in front of the body without the body having to be cut away behind them.
 */
function Axis({ axis, tag, strong }: { axis: SceneAxis; tag?: string; strong?: boolean }) {
  const label = labelPoint(axis);
  const head = arrowHead(axis);
  const width = strong ? 1.7 : 1.35;
  return (
    // `data-axis` is the interaction layer's handle on an individual arrow: `crystal-x`, `lab-Z`.
    // The case of the label already distinguishes the two triads, so the prefix only spells it out.
    <g data-axis={`${strong ? 'crystal' : 'lab'}-${axis.label}`}>
      <g className="stroke-paper fill-paper" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1={axis.from.x} y1={axis.from.y} x2={axis.to.x} y2={axis.to.y} />
        <polygon points={head} />
      </g>
      <g className={strong ? 'stroke-ink fill-ink' : 'stroke-ink/70 fill-ink/70'} strokeLinecap="round">
        <line x1={axis.from.x} y1={axis.from.y} x2={axis.to.x} y2={axis.to.y} strokeWidth={width} />
        <polygon points={head} strokeWidth={0.5} />
      </g>
      <text
        x={label.x}
        y={label.y}
        textAnchor="middle"
        className={`${strong ? 'fill-ink' : 'fill-ink/70'} stroke-paper text-[11px] italic`}
        strokeWidth={2.5}
        style={{ paintOrder: 'stroke' }}
      >
        {axis.label}
        {tag && (
          <tspan className="fill-ink/50 not-italic text-[8px]" dx={2}>
            {tag}
          </tspan>
        )}
      </text>
    </g>
  );
}

interface OrientationSceneViewProps {
  /** The active crystal-cut label, e.g. `[111]`, or `Custom` when the angles match no preset. */
  cutLabel: string;
  thetaX: number;
  thetaY: number;
  psi0: number;
  phiX: number;
  phiY: number;
  psi: number;
}

export function OrientationSceneView({ cutLabel, thetaX, thetaY, psi0, phiX, phiY, psi }: OrientationSceneViewProps) {
  const scene = buildOrientationScene({ thetaX, thetaY, psi0, phiX, phiY, psi });

  // Same wording as the slider labels, so the picture and the controls describe the state alike.
  const description =
    `Sample orientation. Crystal cut ${cutLabel}. ` +
    `Tilt about lab-x ${phiX}°, tilt about lab-y ${phiY}°, azimuth about k ${psi}°.`;

  return (
    <svg
      role="img"
      aria-label={description}
      data-orientation-scene=""
      focusable="false"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      className="shrink-0 max-w-full self-start"
    >
      {/* The sample. Camera-facing faces only, painter's order; opacity carries the depth. */}
      {scene.faces.map((face) => (
        <polygon
          key={face.corners.join('-')}
          data-scene-face=""
          points={face.points.map((p) => `${p.x},${p.y}`).join(' ')}
          className="fill-ink stroke-ink/45"
          fillOpacity={0.05 + 0.11 * face.depth}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      ))}

      {/* The crystal triad, from the anchor corner — the subject of the picture, so it is the
          stronger of the two. */}
      {scene.crystalAxes.map((axis) => (
        <Axis key={axis.label} axis={axis} strong />
      ))}

      {/* The lab frame, fixed. Z is the beam, and says so. */}
      {scene.labAxes.map((axis) => (
        <Axis key={axis.label} axis={axis} tag={axis.label === 'Z' ? '∥ k' : undefined} />
      ))}
    </svg>
  );
}
