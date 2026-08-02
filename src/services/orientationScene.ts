import { composeOrientationMatrix, rotX, rotY, mat3mul, type OrientationAngles } from './tensorProjection';
import { AXIS_EPSILON } from './tolerances';

/**
 * orientationScene.ts -- the pure scene model behind the Simulator's sample-orientation widget.
 *
 * WHAT IT IS. A fixed-viewpoint axonometric picture of the experiment: a flat cuboid sample that
 * turns in real time with the crystal-rotation sliders, carrying the crystal axes x/y/z anchored at
 * one of its corners, in front of a lab triad X/Y/Z that never moves (Z is the beam, k).
 *
 * WHAT IT IS NOT. It is not a second opinion on the app's rotation convention. The rotation matrix
 * comes from `composeOrientationMatrix` (tensorProjection) -- the same function, in the same order,
 * that `calculateSHGExpressions` contracts the tensor with and that `getLabFrameVectors` formats
 * into the Simulator's crystal-axes equation box. That box is this widget's zero-rotation special
 * case and its legend; the two cannot disagree, because neither derives the matrix itself.
 *
 * THE THREE GEOMETRIC DECISIONS, all of them fixed here rather than in the component:
 *
 *   (1) The BODY is cut-independent. Its large face is perpendicular to k at zero user rotation, for
 *       every cut. Only the user rotation (phiX, phiY, psi) turns it -- R_user, i.e. the composition
 *       with the preset angles left at zero. What the cut changes is where the crystal axes point
 *       inside the body, not the shape of the body.
 *
 *   (2) The CRYSTAL TRIAD is the columns of the full matrix R: crystal axis i expressed in the lab
 *       basis. At zero user rotation those columns are R_preset, so the drawn triad reproduces the
 *       equation box exactly. Under rotation it rides rigidly with the body, and that is an identity
 *       rather than a coincidence: R = R_user * R_preset, so rotating the body by R_user carries the
 *       zero-rotation triad onto the columns of R.
 *
 *   (3) The ANCHOR CORNER is the corner maximizing the MINIMUM outward component of the three
 *       crystal axes -- see `anchorCornerFor`. It depends on the CUT only, never on the rotation.
 *
 * All coordinates the view model exposes are already SVG user units; the geometry constants below
 * are the only place they are decided, so the component draws arithmetic rather than measurements
 * (the NyeSchemeDiagram precedent).
 */

// ===========================================================================================
// Fixed geometry. Lab units for anything 3-D; SVG user units for anything projected.
// ===========================================================================================

/**
 * Canvas, in SVG user units. Sized from the measured envelope rather than guessed: over the whole
 * reachable space the body and its triad sweep a DISC about BODY_ORIGIN -- +-71 units either way at
 * SCALE 28 -- and the labels add roughly 11 more. That the envelope is round rather than oblong is
 * itself a consequence of the camera being orthonormal: the sweep is rotation-covariant, so a
 * projection that preserves lengths must trace a circle. The lower left stays clear of it for the
 * lab triad.
 */
export const SCENE_WIDTH = 272;
export const SCENE_HEIGHT = 200;

/** Where the body's centre projects to. Right of centre, leaving the lower left for the lab triad. */
export const BODY_ORIGIN = { x: 166, y: 94 };

/** Lab units -> SVG user units for the body and the crystal triad. */
export const SCALE = 28;

/**
 * Half-extents of the sample slab in lab units at zero rotation: a flat plate whose large face is
 * perpendicular to k (z is the short one). x and y differ slightly ON PURPOSE -- a square plate
 * gives no cue about which way it turned, and can project two faces onto the same outline.
 */
export const HALF_EXTENTS = { x: 1.1, y: 0.9, z: 0.26 };

/** Length of a drawn crystal axis, in lab units. Short enough that the sample stays the subject. */
export const CRYSTAL_AXIS_LENGTH = 1.2;

/** The lab triad: fixed screen origin, and its own (smaller) scale in SVG units per lab unit. */
export const LAB_ORIGIN = { x: 40, y: 168 };
export const LAB_AXIS_SCALE = 26;

const dot3 = (a: readonly number[], b: readonly number[]): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = (v: readonly number[]): number[] => {
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
};

/** A screen-space direction: `u` to the right, `v` UP. SVG's downward y is applied in `project`. */
export interface AxoImage {
  u: number;
  v: number;
}

/**
 * THE VIEWPOINT, as a camera rotation rather than as three hand-chosen axis images.
 *
 * `CAMERA` is a rotation of the lab frame into the viewer's frame: its first two rows are the screen
 * right and screen up directions in lab coordinates, its third the line of sight. Projecting is
 * therefore just taking the first two components of the rotated vector, and the projection is
 * ORTHONORMAL BY CONSTRUCTION -- no shear, no differential foreshortening, whatever the two angles.
 *
 * WHY IT IS BUILT AND NOT WRITTEN DOWN. The previous revision stated the three axis images as free
 * constants. That is a complete specification of a general PARALLEL projection, but not every such
 * triple is an ORTHOGRAPHIC one: by Gauss's theorem of axonometry, the images z1, z2, z3 read as
 * complex numbers must satisfy z1^2 + z2^2 + z3^2 = 0, and the chosen triple gave 0.3396 + 1.0648i.
 * The picture was consequently sheared -- correct axis directions, distorted body. Constants cannot
 * enforce a constraint they are free to violate; a rotation cannot violate it.
 *
 * THE ANGLES. Azimuth turns about lab Y, elevation about lab X, applied in that order. At
 * (115 deg, -20 deg) the axes land at
 *
 *   Y_lab      ( 0.0000,  0.9397)   exactly vertical, up -- the picture's plumb line
 *   Z_lab ∥ k  ( 0.9063, -0.1445)   to the right, slightly lowered
 *   X_lab      (-0.4226, -0.3100)   to the left and down
 *
 * Y's zero is exact, not rounded: the azimuth is a rotation ABOUT Y, and the elevation row that
 * supplies `u` has a zero in the y slot, so nothing can tip the plumb line.
 *
 * A NOTE ON THE BRIEF, for the record: the maintainer's sketch had Z slightly RAISED. With Y
 * vertical and X pointing down, that is not reachable by any orthographic camera -- the three
 * directions would have to sum, as squares, to something other than zero. This is the standard
 * view-from-above instead (Z slightly lowered), which is the nearest true camera; the mirror choice
 * is elevation +20 deg, which raises Z but then also tips X upward.
 *
 * WHAT IT MAKES THE PICTURE. The slab's large face is perpendicular to k = Z_lab, so at zero
 * rotation it spans the images of X and Y: the sample STANDS like an obliquely seen wall, and its
 * thickness runs off to the right, along the "∥ k" arrow.
 */
export const CAM_AZIMUTH_DEG = 115;
export const CAM_ELEVATION_DEG = -20;

/** Lab -> viewer rotation. Rows: screen right, screen up, line of sight. */
export const CAMERA: readonly number[][] = mat3mul(rotX(CAM_ELEVATION_DEG), rotY(CAM_AZIMUTH_DEG));

/** The screen images of the three lab axes -- the columns of the camera's first two rows. Derived,
 *  never authored: they are how the camera READS, not how it is defined. */
const axoImage = (i: number): AxoImage => ({ u: CAMERA[0][i], v: CAMERA[1][i] });
export const AXO_X: AxoImage = axoImage(0);
export const AXO_Y: AxoImage = axoImage(1);
export const AXO_Z: AxoImage = axoImage(2);

/**
 * The line of sight: the projection's kernel, and the camera's third row. For a proper rotation the
 * rows are a right-handed orthonormal frame, so row0 x row1 = row2 exactly -- the sign convention
 * that makes this point TOWARDS the viewer comes for free instead of having to be chosen.
 *
 * It lands on the -Z side, which is what puts the sample's thickness to the RIGHT of its visible
 * large face rather than to the left. Unit length, unlike the sheared predecessor.
 */
export const VIEW_TO_CAMERA: readonly number[] = CAMERA[2];

// ===========================================================================================
// Corners and faces of the slab.
// ===========================================================================================

/**
 * The eight corners, in the FIXED priority order that also breaks anchor-corner ties:
 * index = (sx < 0 ? 4 : 0) + (sy < 0 ? 2 : 0) + (sz < 0 ? 1 : 0) -- plus before minus, x most
 * significant. Two cuts are genuinely degenerate ([110] and [111], see `anchorCornerFor`), so this
 * order is part of the contract, not an implementation detail: it is what makes the widget show the
 * same corner on every render for the same cut.
 */
export const CORNER_SIGNS: ReadonlyArray<readonly number[]> = [
  [1, 1, 1], // 0
  [1, 1, -1], // 1
  [1, -1, 1], // 2
  [1, -1, -1], // 3
  [-1, 1, 1], // 4
  [-1, 1, -1], // 5
  [-1, -1, 1], // 6
  [-1, -1, -1], // 7
];

/**
 * The six faces: outward normal axis (0=x, 1=y, 2=z) with its sign, and the four corner indices
 * wound counter-clockwise as seen from OUTSIDE. The winding is not load-bearing -- visibility is
 * decided in 3-D against the outward normal, never from the projected polygon -- but a consistent
 * one keeps the emitted point lists readable.
 */
const FACES: ReadonlyArray<{ axis: number; sign: number; corners: readonly number[] }> = [
  { axis: 0, sign: 1, corners: [0, 2, 3, 1] },
  { axis: 0, sign: -1, corners: [5, 7, 6, 4] },
  { axis: 1, sign: 1, corners: [0, 1, 5, 4] },
  { axis: 1, sign: -1, corners: [2, 6, 7, 3] },
  { axis: 2, sign: 1, corners: [0, 4, 6, 2] },
  { axis: 2, sign: -1, corners: [1, 3, 7, 5] },
];

// ===========================================================================================
// View model
// ===========================================================================================

export interface ScenePoint {
  x: number;
  y: number;
}

export interface SceneFace {
  /** Corner indices, counter-clockwise seen from outside. */
  corners: readonly number[];
  /** The same corners, projected. */
  points: ScenePoint[];
  /** Outward normal in lab coordinates, after rotation. */
  normal: number[];
  /** Depth along the view direction; larger is nearer the camera. Faces are emitted far -> near. */
  depth: number;
}

export interface SceneAxis {
  /** `x`/`y`/`z` for the crystal triad, `X`/`Y`/`Z` for the lab triad -- the app's case convention. */
  label: string;
  /** Unit direction in lab coordinates. */
  direction: number[];
  /** Projected tail and head. */
  from: ScenePoint;
  to: ScenePoint;
}

export interface OrientationScene {
  /** The eight corners in lab coordinates, in CORNER_SIGNS order. */
  corners3: number[][];
  /** The same corners, projected. */
  corners: ScenePoint[];
  /** Camera-facing faces only, painter's order (far first). The body is convex, so they never overlap. */
  faces: SceneFace[];
  /** Index into `corners` of the corner the crystal triad hangs from. */
  anchorCorner: number;
  /** The crystal triad x, y, z, drawn from the anchor corner. */
  crystalAxes: SceneAxis[];
  /** The lab triad X, Y, Z, drawn at a fixed screen position. Never moves. */
  labAxes: SceneAxis[];
}

/** Matrix-times-vector. Plain algebra -- the CONVENTION lives in composeOrientationMatrix. */
const apply = (M: number[][], v: readonly number[]): number[] => [
  M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
  M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
  M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
];

/** Axonometric projection of a lab-space point onto the canvas, about a given screen origin. */
export function project(v: readonly number[], origin: ScenePoint = BODY_ORIGIN, scale = SCALE): ScenePoint {
  const u = dot3(v, CAMERA[0]);
  const w = dot3(v, CAMERA[1]);
  return {
    x: origin.x + scale * u,
    // SVG y grows downward, so screen-up is negated here and nowhere else.
    y: origin.y - scale * w,
  };
}

/** Crystal axis i (0=x, 1=y, 2=z) expressed in the lab basis: column i of R. */
export function crystalAxisInLab(R: number[][], i: number): number[] {
  return [R[0][i], R[1][i], R[2][i]];
}

/**
 * The anchor corner for a cut: the corner maximizing the MINIMUM outward component of the three
 * crystal axes, where "outward component" is the axis's component along the corner's outward
 * diagonal (its sign vector, normalized).
 *
 * ONLY THE CUT MATTERS. Both the axes and the corner ride on the body under a user rotation, so
 * every dot product below is invariant under it -- the anchor is computed from R_preset and stays
 * put while the sliders move. That is the "cut switch re-anchors, rotation does not" rule, and it is
 * a property of the metric rather than a special case in the caller.
 *
 * TIE-BREAK. Two of the five reachable cuts are genuinely degenerate: [110] has two corners at
 * exactly the same score (0 and -0 in floating point -- without a tolerance the sign of a zero would
 * pick the corner) and [111] has two at -0.138. Ties therefore go to the lowest CORNER_SIGNS index,
 * and a challenger must beat the incumbent by more than AXIS_EPSILON to displace it.
 *
 * WHAT THE SCORE IS NOT. A negative score does NOT mean an axis points into the body. An arrow from
 * a corner enters the slab only if it runs inward along ALL THREE adjacent face normals at once; the
 * score is the stricter single-diagonal measure, so it goes negative for [110]/[111] while every
 * drawn axis still leaves the body. The face-normal test is the defect criterion and is asserted for
 * all five cuts in the unit tests; the score is only how the corner is CHOSEN.
 */
export function anchorCornerFor(presetAngles: OrientationAngles): number {
  const R = composeOrientationMatrix({
    thetaX: presetAngles.thetaX,
    thetaY: presetAngles.thetaY,
    psi0: presetAngles.psi0,
  });
  const axes = [0, 1, 2].map((i) => crystalAxisInLab(R, i));

  let best = 0;
  let bestScore = -Infinity;
  CORNER_SIGNS.forEach((s, index) => {
    const outward = norm3([s[0], s[1], s[2]]);
    const score = Math.min(...axes.map((axis) => dot3(axis, outward)));
    if (score > bestScore + AXIS_EPSILON) {
      bestScore = score;
      best = index;
    }
  });
  return best;
}

/**
 * True when the axis direction `d`, drawn from the corner with sign vector `s`, runs into the slab.
 * It does so only if it moves inward along all three of the corner's face normals at once; if any
 * component is outward (or grazes), the ray leaves the body immediately. Exported because it is the
 * anchor rule's DEFECT criterion -- the unit tests assert it is false for every axis, every cut.
 */
export function pointsIntoBody(direction: readonly number[], cornerSigns: readonly number[]): boolean {
  return [0, 1, 2].every((j) => cornerSigns[j] * direction[j] < -AXIS_EPSILON);
}

/** The complete scene for a cut and a user rotation. */
export function buildOrientationScene(angles: OrientationAngles = {}): OrientationScene {
  const { thetaX = 0, thetaY = 0, psi0 = 0, phiX = 0, phiY = 0, psi = 0 } = angles;

  // The body carries the USER rotation only -- the cut does not reshape the sample (decision 1).
  const R_user = composeOrientationMatrix({ phiX, phiY, psi });
  // The triad carries the full crystal -> lab matrix (decision 2).
  const R_full = composeOrientationMatrix({ thetaX, thetaY, psi0, phiX, phiY, psi });

  const corners3 = CORNER_SIGNS.map((s) =>
    apply(R_user, [s[0] * HALF_EXTENTS.x, s[1] * HALF_EXTENTS.y, s[2] * HALF_EXTENTS.z]),
  );
  const corners = corners3.map((c) => project(c));

  const faces: SceneFace[] = FACES.map((face) => {
    const n = [0, 0, 0];
    n[face.axis] = face.sign;
    const normal = apply(R_user, n);
    return {
      corners: face.corners,
      points: face.corners.map((i) => corners[i]),
      normal,
      depth: dot3(normal, VIEW_TO_CAMERA),
    };
  })
    .filter((face) => face.depth > 0)
    .sort((a, b) => a.depth - b.depth);

  const anchorCorner = anchorCornerFor({ thetaX, thetaY, psi0 });
  const anchor3 = corners3[anchorCorner];
  const anchorPoint = corners[anchorCorner];

  const crystalAxes: SceneAxis[] = ['x', 'y', 'z'].map((label, i) => {
    const direction = crystalAxisInLab(R_full, i);
    return {
      label,
      direction,
      from: anchorPoint,
      to: project([0, 1, 2].map((j) => anchor3[j] + CRYSTAL_AXIS_LENGTH * direction[j])),
    };
  });

  const labAxes: SceneAxis[] = ['X', 'Y', 'Z'].map((label, i) => {
    const direction = [0, 0, 0];
    direction[i] = 1;
    return {
      label,
      direction,
      from: LAB_ORIGIN,
      to: project(direction, LAB_ORIGIN, LAB_AXIS_SCALE),
    };
  });

  return { corners3, corners, faces, anchorCorner, crystalAxes, labAxes };
}
