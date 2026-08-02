import { describe, it, expect } from 'vitest';
import {
  buildOrientationScene,
  anchorCornerFor,
  pointsIntoBody,
  crystalAxisInLab,
  project,
  CORNER_SIGNS,
  HALF_EXTENTS,
  AXO_X,
  AXO_Y,
  AXO_Z,
  CAMERA,
  CAM_AZIMUTH_DEG,
  CAM_ELEVATION_DEG,
  VIEW_TO_CAMERA,
  LAB_ORIGIN,
  LAB_AXIS_SCALE,
  SCALE,
  BODY_ORIGIN,
  CRYSTAL_AXIS_LENGTH,
  SCENE_WIDTH,
  SCENE_HEIGHT,
} from './orientationScene';
import { composeOrientationMatrix, getLabFrameVectors } from './tensorProjection';
import { hklToPresetAngles } from './orientation';
import { AXIS_EPSILON } from './tolerances';

/**
 * Unit anchors for the Simulator's sample-orientation scene model.
 *
 * ANTI-CIRCULARITY. The rotation matrix itself is NOT re-derived here: `composeOrientationMatrix` is
 * guarded upstream by rotatedSHG, shgUnification.pins and azimuthConvention, and re-deriving it
 * would only restate the convention against itself. What IS pinned independently is everything this
 * module adds on top of it -- the projection, the anchor-corner rule, and the identities that tie the
 * drawing to the engine. Expected values below are hand-derived, with the derivation in the comment
 * above each fixture, and no value was read out of the app.
 *
 * The one exception is deliberate and is the point of the first block: the zero-rotation triad is
 * asserted to equal the Simulator's crystal-axes equation box, and BOTH sides are pinned to
 * independently hand-written values, so the assertion has content in both directions.
 */

const rad = (d: number) => (d * Math.PI) / 180;

/** The five reachable cuts. `KDirectionSelector` is the only writer of the preset angles, and it
 *  offers exactly these five directions across all seven crystal systems -- so this is the complete
 *  cut space, not a sample of it. */
const CUTS = {
  '[100]': [1, 0, 0],
  '[010]': [0, 1, 0],
  '[001]': [0, 0, 1],
  '[110]': [1, 1, 0],
  '[111]': [1, 1, 1],
} as const;

const presetFor = (cut: keyof typeof CUTS) => {
  const [h, k, l] = CUTS[cut];
  const o = hklToPresetAngles(h, k, l)!;
  return { thetaX: o.tx, thetaY: o.ty, psi0: o.psi0 };
};

const closeTo = (v: readonly number[], expected: readonly number[], p = 6) => {
  expect(v).toHaveLength(expected.length);
  expected.forEach((e, i) => expect(v[i]).toBeCloseTo(e, p));
};

// ===========================================================================================

describe('orientationScene — the fixed viewpoint', () => {
  /**
   * THE METRIC PIN -- the class of defect that reached visual acceptance twice.
   *
   * The first revision got the axis DIRECTIONS wrong (a cyclic permutation); the second got them
   * right but the METRIC wrong. Free axis-image constants specify a general PARALLEL projection, and
   * only some of those are orthographic: by Gauss's theorem of axonometry the three images, read as
   * complex numbers, must satisfy z1^2 + z2^2 + z3^2 = 0. The previous triple gave 0.3396 + 1.0648i,
   * so the picture was sheared -- a slab drawn as a rhomboid, with the axes still pointing the right
   * way. No orientation test can see that, because shear preserves direction of the axes it is
   * defined by.
   *
   * The camera is now a ROTATION, so orthonormality is structural rather than checked-for. This test
   * asserts it anyway, at the matrix level (M M^T = I) and at the level a reader can see (Gauss),
   * because the point of a pin is to fail if someone later replaces the construction with constants.
   */
  it('is metrically a rotation: M M^T = I, and the axis images satisfy Gauss', () => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const entry = CAMERA[i][0] * CAMERA[j][0] + CAMERA[i][1] * CAMERA[j][1] + CAMERA[i][2] * CAMERA[j][2];
        expect(Math.abs(entry - (i === j ? 1 : 0))).toBeLessThan(AXIS_EPSILON);
      }
    }

    // det = +1: a proper rotation, not a rotation composed with a reflection (which would flip the
    // handedness of everything drawn while leaving M M^T = I intact).
    const det =
      CAMERA[0][0] * (CAMERA[1][1] * CAMERA[2][2] - CAMERA[1][2] * CAMERA[2][1]) -
      CAMERA[0][1] * (CAMERA[1][0] * CAMERA[2][2] - CAMERA[1][2] * CAMERA[2][0]) +
      CAMERA[0][2] * (CAMERA[1][0] * CAMERA[2][1] - CAMERA[1][1] * CAMERA[2][0]);
    expect(det).toBeCloseTo(1, 12);

    // Gauss's theorem of axonometry, the same fact stated in the picture plane: sum of the squared
    // axis images, as complex numbers, vanishes for an orthographic projection.
    let re = 0;
    let im = 0;
    for (const a of [AXO_X, AXO_Y, AXO_Z]) {
      re += a.u * a.u - a.v * a.v;
      im += 2 * a.u * a.v;
    }
    expect(Math.abs(re)).toBeLessThan(AXIS_EPSILON);
    expect(Math.abs(im)).toBeLessThan(AXIS_EPSILON);

    // The same theorem in its more familiar form: the three squared foreshortening factors of an
    // orthographic axonometry sum to 2. Here 0.274691 + 0.883022 + 0.842287 = 2.000000.
    const squares = [AXO_X, AXO_Y, AXO_Z].reduce((acc, a) => acc + a.u * a.u + a.v * a.v, 0);
    expect(squares).toBeCloseTo(2, 9);
  });

  /**
   * THE ORIENTATION CONTRACT: where the camera puts the axes. Structure only -- the magnitudes
   * follow from the two angles and are free to be re-aimed.
   */
  it('places the lab axes on screen as the contract requires', () => {
    // Y_lab: exactly vertical, up. Exactly, not approximately -- the azimuth turns ABOUT Y and the
    // row supplying u carries a zero in the y slot, so nothing can tip the plumb line.
    expect(AXO_Y.u).toBe(0);
    expect(AXO_Y.v).toBeGreaterThan(0);

    // Z_lab (the beam): to the right. Its VERTICAL sense is deliberately NOT pinned -- it is the one
    // open aesthetic choice (elevation -20 lowers it, +20 raises it and tips X up with it). What is
    // pinned is that it reads as a direction ACROSS the picture, not as a second vertical.
    expect(AXO_Z.u).toBeGreaterThan(0);
    expect(Math.abs(AXO_Z.v)).toBeLessThan(AXO_Z.u / 2);

    // X_lab: to the left and down.
    expect(AXO_X.u).toBeLessThan(0);
    expect(AXO_X.v).toBeLessThan(0);

    // No two axes may project onto the same line, or the picture would be degenerate.
    const images = [AXO_X, AXO_Y, AXO_Z];
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        expect(Math.abs(images[i].u * images[j].v - images[i].v * images[j].u)).toBeGreaterThan(0.1);
      }
    }
  });

  /**
   * DERIVATION. M = Rx(-20) Ry(115), with cos115 = -0.4226183, sin115 = 0.9063078,
   * cos(-20) = 0.9396926, sin(-20) = -0.3420201.
   *
   *   Ry(115) = [[-0.4226183, 0, 0.9063078], [0, 1, 0], [-0.9063078, 0, -0.4226183]]
   *   Rx(-20) = [[1, 0, 0], [0, 0.9396926, 0.3420201], [0, -0.3420201, 0.9396926]]
   *
   *   row0 = (1,0,0) Ry             = (-0.4226183,  0,          0.9063078)
   *   row1 = 0.9396926 (0,1,0) + 0.3420201 (-0.9063078, 0, -0.4226183)
   *                                 = (-0.3099755,  0.9396926, -0.1445440)
   *   row2 = -0.3420201 (0,1,0) + 0.9396926 (-0.9063078, 0, -0.4226183)
   *                                 = (-0.8516507, -0.3420201, -0.3971313)
   *
   * The axis images are the COLUMNS of the first two rows, so
   *   X (-0.4226183, -0.3099755), Y (0, 0.9396926), Z (0.9063078, -0.1445440).
   *
   * row2 is the line of sight, and for a proper rotation row0 x row1 = row2 exactly, so it points
   * towards the viewer without a sign having to be chosen. Its NEGATIVE z-component is load-bearing:
   * the camera is on the -Z side, so the visible large face is the -Z one and the slab's thickness
   * runs off to the RIGHT, towards the "∥ k" arrow.
   */
  it('has the hand-derived camera rows and line of sight', () => {
    expect(CAM_AZIMUTH_DEG).toBe(115);
    expect(CAM_ELEVATION_DEG).toBe(-20);

    closeTo(CAMERA[0], [-0.4226183, 0, 0.9063078]);
    closeTo(CAMERA[1], [-0.3099755, 0.9396926, -0.144544]);
    closeTo(CAMERA[2], [-0.8516507, -0.3420201, -0.3971313]);

    closeTo([AXO_X.u, AXO_X.v], [-0.4226183, -0.3099755]);
    closeTo([AXO_Y.u, AXO_Y.v], [0, 0.9396926]);
    closeTo([AXO_Z.u, AXO_Z.v], [0.9063078, -0.144544]);

    closeTo(VIEW_TO_CAMERA, CAMERA[2]);
    expect(Math.hypot(...VIEW_TO_CAMERA)).toBeCloseTo(1, 12);
    expect(VIEW_TO_CAMERA[2]).toBeLessThan(0);

    // row0 x row1 = row2 -- the identity the projected-handedness test rests on
    const cross = [
      CAMERA[0][1] * CAMERA[1][2] - CAMERA[0][2] * CAMERA[1][1],
      CAMERA[0][2] * CAMERA[1][0] - CAMERA[0][0] * CAMERA[1][2],
      CAMERA[0][0] * CAMERA[1][1] - CAMERA[0][1] * CAMERA[1][0],
    ];
    closeTo(cross, CAMERA[2], 12);

    // and the line of sight really is annihilated by the projection
    const origin = project([0, 0, 0], { x: 0, y: 0 }, 1);
    const along = project(VIEW_TO_CAMERA, { x: 0, y: 0 }, 1);
    expect(along.x - origin.x).toBeCloseTo(0, 12);
    expect(along.y - origin.y).toBeCloseTo(0, 12);
  });

  /**
   * DERIVATION. The lab triad is drawn at LAB_ORIGIN = (40, 168) with LAB_AXIS_SCALE = 26, and
   * screen = (origin.x + s*u, origin.y - s*v):
   *   X: x = 40 + 26(-0.4226183) = 29.01193   y = 168 - 26(-0.3099755) = 176.05936
   *   Y: x = 40 + 26(0)          = 40         y = 168 - 26(0.9396926)  = 143.56799
   *   Z: x = 40 + 26(0.9063078)  = 63.56400   y = 168 - 26(-0.1445440) = 171.75814
   */
  it('projects the lab triad to its hand-derived screen positions', () => {
    const scene = buildOrientationScene();
    const [X, Y, Z] = scene.labAxes;
    expect(X.label).toBe('X');
    expect(Y.label).toBe('Y');
    expect(Z.label).toBe('Z');

    expect(X.to.x).toBeCloseTo(29.01193, 5);
    expect(X.to.y).toBeCloseTo(176.05936, 5);
    expect(Y.to.x).toBeCloseTo(40, 12);
    expect(Y.to.y).toBeCloseTo(143.56799, 5);
    expect(Z.to.x).toBeCloseTo(63.564, 4);
    expect(Z.to.y).toBeCloseTo(171.75814, 5);
  });

  /** Y is the plumb line: it leaves the origin straight up, with no horizontal component at all. */
  it('draws lab Y exactly vertical and the beam across the picture', () => {
    const [X, Y, Z] = buildOrientationScene().labAxes;
    expect(Y.to.x - Y.from.x).toBe(0);
    expect(Y.to.y).toBeLessThan(Y.from.y); // up, in SVG coordinates

    // the beam runs to the right and departs from the horizontal only slightly, either way
    expect(Z.to.x).toBeGreaterThan(Z.from.x);
    expect(Math.abs(Z.to.y - Z.from.y)).toBeLessThan((Z.to.x - Z.from.x) / 2);

    // and X goes left and down
    expect(X.to.x).toBeLessThan(X.from.x);
    expect(X.to.y).toBeGreaterThan(X.from.y);
  });

  it('holds the lab triad fixed under every rotation', () => {
    const moved = buildOrientationScene({ thetaX: 45, thetaY: -35.264, psi0: 120, phiX: 40, phiY: -25, psi: 75 });
    const still = buildOrientationScene();
    expect(moved.labAxes).toEqual(still.labAxes);
  });
});

// ===========================================================================================

describe('orientationScene — the zero-rotation special case', () => {
  /**
   * The crystal-axes equation box (`getLabFrameVectors`, rendered by `LabFrameOrientation`) is the
   * widget's legend AND its zero-rotation special case. Both sides are hand-written here.
   *
   * DERIVATION of the direction columns, from the preset R_preset = Rz(psi0) Ry(ty) Rx(tx) with the
   * angles `hklToPresetAngles` assigns (also asserted, so a drift in the cut mapping shows up here):
   *
   *   [001]  (0, 0, 0)          R_preset = I                  -> x=X, y=Y, z=Z
   *   [100]  (0, -90, 0)        Ry(-90) sends X->-Z, Z->X     -> x=Z, y=Y, z=-X
   *   [010]  (90, 0, 0)         Rx(90) sends Y->Z, Z->-Y      -> x=X, y=Z, z=-Y
   *   [110]  (90, -45, 90)      x,y at 45 deg in the lab YZ-plane, z along X
   *   [111]  (45, -35.2644, 120) the cube diagonal along the beam: every axis gets 1/sqrt(3) of Z
   */
  const EXPECTED = {
    '[001]': {
      angles: [0, 0, 0],
      dirs: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      latex: ['\\mathbf{X}_{LAB}', '\\mathbf{Y}_{LAB}', '\\mathbf{Z}_{LAB}'],
    },
    '[100]': {
      angles: [0, -90, 0],
      dirs: [
        [0, 0, 1],
        [0, 1, 0],
        [-1, 0, 0],
      ],
      latex: ['\\mathbf{Z}_{LAB}', '\\mathbf{Y}_{LAB}', '-\\mathbf{X}_{LAB}'],
    },
    '[010]': {
      angles: [90, 0, 0],
      dirs: [
        [1, 0, 0],
        [0, 0, 1],
        [0, -1, 0],
      ],
      latex: ['\\mathbf{X}_{LAB}', '\\mathbf{Z}_{LAB}', '-\\mathbf{Y}_{LAB}'],
    },
    '[110]': {
      angles: [90, -45, 90],
      dirs: [
        [0, Math.SQRT1_2, Math.SQRT1_2],
        [0, -Math.SQRT1_2, Math.SQRT1_2],
        [1, 0, 0],
      ],
      latex: [
        '\\frac{1}{\\sqrt{2}}\\mathbf{Y}_{LAB} +\\frac{1}{\\sqrt{2}}\\mathbf{Z}_{LAB}',
        '-\\frac{1}{\\sqrt{2}}\\mathbf{Y}_{LAB} +\\frac{1}{\\sqrt{2}}\\mathbf{Z}_{LAB}',
        '\\mathbf{X}_{LAB}',
      ],
    },
    '[111]': {
      angles: [45, -35.2643897, 120],
      dirs: [
        [-1 / Math.sqrt(6), Math.SQRT1_2, 1 / Math.sqrt(3)],
        [-1 / Math.sqrt(6), -Math.SQRT1_2, 1 / Math.sqrt(3)],
        [2 / Math.sqrt(6), 0, 1 / Math.sqrt(3)],
      ],
      latex: [
        '-\\frac{1}{\\sqrt{6}}\\mathbf{X}_{LAB} +\\frac{1}{\\sqrt{2}}\\mathbf{Y}_{LAB} +\\frac{1}{\\sqrt{3}}\\mathbf{Z}_{LAB}',
        '-\\frac{1}{\\sqrt{6}}\\mathbf{X}_{LAB} -\\frac{1}{\\sqrt{2}}\\mathbf{Y}_{LAB} +\\frac{1}{\\sqrt{3}}\\mathbf{Z}_{LAB}',
        '\\frac{2}{\\sqrt{6}}\\mathbf{X}_{LAB} +\\frac{1}{\\sqrt{3}}\\mathbf{Z}_{LAB}',
      ],
    },
  } as const;

  (Object.keys(EXPECTED) as Array<keyof typeof EXPECTED>).forEach((cut) => {
    const { angles, dirs, latex } = EXPECTED[cut];

    it(`${cut}: the preset angles are the hand-derived triple`, () => {
      const p = presetFor(cut);
      expect(p.thetaX).toBeCloseTo(angles[0], 6);
      expect(p.thetaY).toBeCloseTo(angles[1], 6);
      expect(p.psi0).toBeCloseTo(angles[2], 6);
    });

    it(`${cut}: the drawn triad at zero rotation IS the equation box`, () => {
      const preset = presetFor(cut);
      const scene = buildOrientationScene(preset);

      // side 1 — the scene's triad against hand-derived direction cosines
      expect(scene.crystalAxes.map((a) => a.label)).toEqual(['x', 'y', 'z']);
      scene.crystalAxes.forEach((axis, i) => closeTo(axis.direction, dirs[i]));

      // side 2 — the equation box against hand-written LaTeX
      const box = getLabFrameVectors(preset);
      expect([box.X, box.Y, box.Z]).toEqual([...latex]);
    });
  });

  /**
   * THE SCREEN-IDENTITY PIN -- the picture-level witness for both shipped camera defects.
   *
   * At cut [001] with no rotation the equation box reads x = X, y = Y, z = Z: the crystal frame IS
   * the lab frame. So the three crystal arrows and the three lab arrows must be THE SAME PICTURE,
   * not merely parallel -- same directions, and the same relative lengths, since the two triads
   * differ only by where they are drawn and by their two length conventions. A permutation breaks
   * the pairing; a shear breaks the relative lengths, because it foreshortens the three axes by
   * unequal factors. Both shipped defects fail here.
   *
   * ITS BLIND SPOT, stated because the division of labour only works if each pin's reach is known:
   * at [001] the preset is the IDENTITY, so the rows and the columns of R coincide and a transposed
   * triad is invisible to this test. That is the parallelism pin's job, and it is set at [100]
   * precisely because the preset there is not the identity. Verified by mutation, not assumed --
   * see the table in the ledger entry.
   *
   * The comparison divides out the two conventions: each arrow is scaled by its own triad's
   * (length x scale), leaving the raw axis image, and translation is removed by working with
   * deltas rather than endpoints.
   */
  it('[001]: the crystal triad and the lab triad are the same picture, to scale', () => {
    const scene = buildOrientationScene(presetFor('[001]'));
    const delta = (axis: { from: { x: number; y: number }; to: { x: number; y: number } }, unit: number) => ({
      x: (axis.to.x - axis.from.x) / unit,
      y: (axis.to.y - axis.from.y) / unit,
    });

    const crystal = scene.crystalAxes.map((a) => delta(a, SCALE * CRYSTAL_AXIS_LENGTH));
    const lab = scene.labAxes.map((a) => delta(a, LAB_AXIS_SCALE));

    crystal.forEach((c, i) => {
      expect(Math.abs(c.x - lab[i].x)).toBeLessThan(AXIS_EPSILON);
      expect(Math.abs(c.y - lab[i].y)).toBeLessThan(AXIS_EPSILON);
    });

    // and each normalized arrow is exactly the axis image (u, -v) -- the SVG flip, once
    expect(crystal[0].x).toBeCloseTo(AXO_X.u, 9);
    expect(crystal[0].y).toBeCloseTo(-AXO_X.v, 9);
    expect(crystal[1].x).toBeCloseTo(AXO_Y.u, 9);
    expect(crystal[1].y).toBeCloseTo(-AXO_Y.v, 9);
    expect(crystal[2].x).toBeCloseTo(AXO_Z.u, 9);
    expect(crystal[2].y).toBeCloseTo(-AXO_Z.v, 9);

    // Relative lengths on screen: unequal foreshortening is what a shear would show up as, and an
    // orthographic camera fixes the three ratios completely. |X| = |Y| = |Z| = 1 in lab space, so
    // the drawn ratios are the images' lengths: 0.5241, 0.9397, 0.9178.
    const len = (d: { x: number; y: number }) => Math.hypot(d.x, d.y);
    expect(len(crystal[0])).toBeCloseTo(0.5241, 4);
    expect(len(crystal[1])).toBeCloseTo(0.9397, 4);
    expect(len(crystal[2])).toBeCloseTo(0.9178, 4);
  });

  /**
   * THE EQUATION BOX IN SCREEN SPACE.
   *
   * Everything else in this block asserts LAB-space directions, which a wrongly aimed or wrongly
   * wired camera leaves untouched. Two assertions close that gap, and they divide the work:
   * the camera contract above pins the axis IMAGES, so wrong constants fail there; this one compares
   * DRAWN arrows against DRAWN arrows, so a mismatch between the two triads fails here whatever the
   * constants are. Verified by mutation while writing: the old camera trips the contract test (and
   * five others) but not this one; reading the triad off the rows of R instead of its columns trips
   * this one.
   *
   * DERIVATION, cut [100] at zero rotation. The equation box reads x = Z, y = Y, z = -X, so on
   * screen the crystal arrows must lie along the lab arrows for exactly those axes, with exactly
   * those signs -- x parallel to the Z arrow, y to the Y arrow, and z ANTI-parallel to the X arrow.
   * The two triads are drawn at different scales and from different origins, so the comparison is of
   * unit directions, not endpoints. Parallelism is |cross| < AXIS_EPSILON, the tolerance
   * `tolerances.ts` documents for exactly this kind of geometric sign check; the sense is the sign
   * of the dot product, which is what carries the minus.
   */
  it('[100]: the drawn crystal arrows lie along the drawn lab arrows, signs included', () => {
    const scene = buildOrientationScene(presetFor('[100]'));
    const dir = (axis: { from: { x: number; y: number }; to: { x: number; y: number } }) => {
      const dx = axis.to.x - axis.from.x;
      const dy = axis.to.y - axis.from.y;
      const n = Math.hypot(dx, dy);
      return { x: dx / n, y: dy / n };
    };
    const cross = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x * b.y - a.y * b.x;
    const dot = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x * b.x + a.y * b.y;

    const [xc, yc, zc] = scene.crystalAxes.map(dir);
    const [Xl, Yl, Zl] = scene.labAxes.map(dir);

    // x_crys ∥ Z_lab, same sense
    expect(Math.abs(cross(xc, Zl))).toBeLessThan(AXIS_EPSILON);
    expect(dot(xc, Zl)).toBeGreaterThan(0);

    // y_crys ∥ Y_lab, same sense
    expect(Math.abs(cross(yc, Yl))).toBeLessThan(AXIS_EPSILON);
    expect(dot(yc, Yl)).toBeGreaterThan(0);

    // z_crys ∥ -X_lab: parallel to the X arrow's LINE, opposite in sense
    expect(Math.abs(cross(zc, Xl))).toBeLessThan(AXIS_EPSILON);
    expect(dot(zc, Xl)).toBeLessThan(0);

    // and the negative control: x_crys is NOT along the X arrow
    expect(Math.abs(cross(xc, Xl))).toBeGreaterThan(0.1);
  });

  /** The lower-case/upper-case split is the widget's whole labelling convention: crystal axes are
   *  lower case, lab axes upper case, and neither carries a subscript (the equation box next to it
   *  keeps the subscripts and serves as the legend). */
  it('labels crystal axes lower case and lab axes upper case, without subscripts', () => {
    const scene = buildOrientationScene(presetFor('[111]'));
    expect(scene.crystalAxes.map((a) => a.label)).toEqual(['x', 'y', 'z']);
    expect(scene.labAxes.map((a) => a.label)).toEqual(['X', 'Y', 'Z']);
    [...scene.crystalAxes, ...scene.labAxes].forEach((a) => expect(a.label).toMatch(/^[xyzXYZ]$/));
  });
});

// ===========================================================================================

describe('orientationScene — rotation', () => {
  /**
   * DERIVATION, one 90-degree case per axis, on the [001] cut (R_preset = I), using the closed forms
   * Rx(90): Y->Z, Z->-Y | Ry(90): X->-Z, Z->X | Rz(90): X->Y, Y->-X.
   * Corner 0 of the slab is the body point (+1.1, +0.9, +0.26).
   */
  it('phiX = 90 turns the triad Y->Z, Z->-Y and carries corner 0 with it', () => {
    const scene = buildOrientationScene({ phiX: 90 });
    closeTo(scene.crystalAxes[0].direction, [1, 0, 0]);
    closeTo(scene.crystalAxes[1].direction, [0, 0, 1]);
    closeTo(scene.crystalAxes[2].direction, [0, -1, 0]);
    closeTo(scene.corners3[0], [HALF_EXTENTS.x, -HALF_EXTENTS.z, HALF_EXTENTS.y]);
    closeTo(scene.corners3[0], [1.1, -0.26, 0.9]);
  });

  it('phiY = 90 turns the triad X->-Z, Z->X', () => {
    const scene = buildOrientationScene({ phiY: 90 });
    closeTo(scene.crystalAxes[0].direction, [0, 0, -1]);
    closeTo(scene.crystalAxes[1].direction, [0, 1, 0]);
    closeTo(scene.crystalAxes[2].direction, [1, 0, 0]);
    closeTo(scene.corners3[0], [HALF_EXTENTS.z, HALF_EXTENTS.y, -HALF_EXTENTS.x]);
    closeTo(scene.corners3[0], [0.26, 0.9, -1.1]);
  });

  it('psi = 90 turns the triad X->Y, Y->-X and leaves the beam axis alone', () => {
    const scene = buildOrientationScene({ psi: 90 });
    closeTo(scene.crystalAxes[0].direction, [0, 1, 0]);
    closeTo(scene.crystalAxes[1].direction, [-1, 0, 0]);
    closeTo(scene.crystalAxes[2].direction, [0, 0, 1]);
    closeTo(scene.corners3[0], [-HALF_EXTENTS.y, HALF_EXTENTS.x, HALF_EXTENTS.z]);
    closeTo(scene.corners3[0], [-0.9, 1.1, 0.26]);
  });

  /**
   * A generic triple, on the [111] cut. The expectation is built from an INDEPENDENT re-derivation:
   * the three rotation matrices are written out here from their closed forms and multiplied by a
   * local matmul, in the documented order R = Ry(phiY) Rx(phiX) Rz(psi) R_preset. This pins that the
   * SCENE uses that composition and reads the triad off the COLUMNS of it -- it does not re-derive
   * the composition itself, which is guarded upstream.
   */
  it('a generic angle triple matches an independent re-derivation', () => {
    const [phiX, phiY, psi] = [31, -23, 47];
    const preset = presetFor('[111]');

    const mul = (A: number[][], B: number[][]) =>
      A.map((row, i) => [0, 1, 2].map((j) => [0, 1, 2].reduce((acc, k) => acc + A[i][k] * B[k][j], 0)));
    const Rx = (d: number) => [
      [1, 0, 0],
      [0, Math.cos(rad(d)), -Math.sin(rad(d))],
      [0, Math.sin(rad(d)), Math.cos(rad(d))],
    ];
    const Ry = (d: number) => [
      [Math.cos(rad(d)), 0, Math.sin(rad(d))],
      [0, 1, 0],
      [-Math.sin(rad(d)), 0, Math.cos(rad(d))],
    ];
    const Rz = (d: number) => [
      [Math.cos(rad(d)), -Math.sin(rad(d)), 0],
      [Math.sin(rad(d)), Math.cos(rad(d)), 0],
      [0, 0, 1],
    ];

    const Rpreset = mul(Rz(preset.psi0), mul(Ry(preset.thetaY), Rx(preset.thetaX)));
    const R = mul(Ry(phiY), mul(Rx(phiX), mul(Rz(psi), Rpreset)));

    const scene = buildOrientationScene({ ...preset, phiX, phiY, psi });
    scene.crystalAxes.forEach((axis, i) => closeTo(axis.direction, [R[0][i], R[1][i], R[2][i]]));

    // and the body carries the USER rotation only
    const Ruser = mul(Ry(phiY), mul(Rx(phiX), Rz(psi)));
    const s = CORNER_SIGNS[0];
    const body = [s[0] * HALF_EXTENTS.x, s[1] * HALF_EXTENTS.y, s[2] * HALF_EXTENTS.z];
    closeTo(scene.corners3[0], [0, 1, 2].map((i) => [0, 1, 2].reduce((acc, k) => acc + Ruser[i][k] * body[k], 0)));
  });

  /** Decision (1): the cuboid is cut-independent. Same rotation, five cuts, identical body. */
  it('gives the same body for every cut at the same rotation', () => {
    const rotation = { phiX: 37, phiY: -12, psi: 61 };
    const reference = buildOrientationScene({ ...presetFor('[001]'), ...rotation });
    (Object.keys(CUTS) as Array<keyof typeof CUTS>).forEach((cut) => {
      const scene = buildOrientationScene({ ...presetFor(cut), ...rotation });
      expect(scene.corners3).toEqual(reference.corners3);
      expect(scene.corners).toEqual(reference.corners);
      expect(scene.faces.map((f) => f.corners)).toEqual(reference.faces.map((f) => f.corners));
    });
  });
});

// ===========================================================================================

describe('orientationScene — visible faces', () => {
  it('emits only camera-facing faces, in painter order, for every rotation', () => {
    for (let phiX = -90; phiX <= 90; phiX += 30) {
      for (let phiY = -90; phiY <= 90; phiY += 30) {
        for (let psi = -180; psi <= 180; psi += 45) {
          const { faces } = buildOrientationScene({ phiX, phiY, psi });
          expect(faces.length).toBeGreaterThanOrEqual(1);
          expect(faces.length).toBeLessThanOrEqual(3);
          faces.forEach((f) => {
            expect(f.depth).toBeGreaterThan(0);
            expect(f.points).toHaveLength(4);
          });
          const depths = faces.map((f) => f.depth);
          expect([...depths].sort((a, b) => a - b)).toEqual(depths);
        }
      }
    }
  });

  /**
   * DERIVATION. At zero rotation the slab is axis-aligned, so a face is visible exactly when its
   * outward normal has a positive component along the line of sight (-0.8517, -0.3420, -0.3971):
   * the three NEGATIVE faces, with depths 0.8517 (-x), 0.3420 (-y) and 0.3971 (-z). Painter's order
   * is ascending depth, so -y is drawn first and -x last.
   *
   * That the visible large face is -z is the whole geometric consequence of the viewpoint: the
   * sample stands as a wall facing the viewer and its thickness runs off to the right, along +Z,
   * towards the "∥ k" arrow.
   */
  it('shows the -z large face at zero rotation, thickness running towards +Z', () => {
    const { faces } = buildOrientationScene();
    expect(faces).toHaveLength(3);
    expect(faces.map((f) => f.normal.map((v) => Math.round(v)))).toEqual([
      [0, -1, 0],
      [0, 0, -1],
      [-1, 0, 0],
    ]);
    expect(faces.map((f) => +f.depth.toFixed(4))).toEqual([0.342, 0.3971, 0.8517]);

    // the far large face projects to the RIGHT of the near one — that is "thickness runs right"
    const near = project([0, 0, -HALF_EXTENTS.z]);
    const far = project([0, 0, HALF_EXTENTS.z]);
    expect(far.x).toBeGreaterThan(near.x);
  });
});

// ===========================================================================================

describe('orientationScene — the anchor corner', () => {
  /**
   * DERIVATION. The score of a corner is min over the three crystal axes of (axis . s_hat), with
   * s_hat the corner's sign vector over sqrt(3). With the zero-rotation triads derived above:
   *
   *   [001]  x=X, y=Y, z=Z          -> only (+,+,+) scores +1/sqrt(3); all others contain a -1/sqrt(3).
   *   [100]  x=Z, y=Y, z=-X         -> the winner must be + in y and z and - in x: (-,+,+), index 4.
   *   [010]  x=X, y=Z, z=-Y         -> + in x and z, - in y: (+,-,+), index 2.
   *   [110]  x=(0,1,1)/r2, y=(0,-1,1)/r2, z=X. s=(+,+,+) scores min(1,0,... ) -> the y term gives
   *          (-1+1)/(r2 r3) = 0 exactly, and s=(+,-,+) scores 0 by the same cancellation on x.
   *          A TWO-WAY TIE AT EXACTLY ZERO -- and in floating point at 0 versus -0, which is why the
   *          tie-break needs a tolerance and not a bare `>`. Lowest index wins: index 0.
   *   [111]  x,y,z each carry +1/sqrt(3) of Z, so any corner with sz=-1 is badly negative; among the
   *          sz=+1 corners, (-,+,+) and (-,-,+) both score (-2/sqrt(6) + 1/sqrt(3))/sqrt(3)
   *          = -0.138071. ANOTHER TWO-WAY TIE. Lowest index wins: index 4.
   *
   * The work order named only [111] as degenerate; [110] is degenerate too, and more sharply so.
   */
  const EXPECTED_ANCHOR = {
    '[001]': 0,
    '[100]': 4,
    '[010]': 2,
    '[110]': 0,
    '[111]': 4,
  } as const;

  (Object.keys(EXPECTED_ANCHOR) as Array<keyof typeof EXPECTED_ANCHOR>).forEach((cut) => {
    it(`${cut}: anchors at the hand-derived corner`, () => {
      expect(anchorCornerFor(presetFor(cut))).toBe(EXPECTED_ANCHOR[cut]);
      expect(buildOrientationScene(presetFor(cut)).anchorCorner).toBe(EXPECTED_ANCHOR[cut]);
    });

    /** Determinism, for the degenerate cuts as much as the clean ones: same input, same corner,
     *  every call. A bare `>` comparison would let 0 versus -0 flip [110] between renders. */
    it(`${cut}: is deterministic across repeated calls`, () => {
      const first = anchorCornerFor(presetFor(cut));
      for (let n = 0; n < 64; n++) expect(anchorCornerFor(presetFor(cut))).toBe(first);
    });
  });

  /** The two degenerate cuts, called out explicitly: a second corner ties the winner's score, and
   *  the documented priority order (lowest CORNER_SIGNS index) is what decides. */
  it('[110] and [111] are genuinely degenerate, and the priority order decides', () => {
    const scoreOf = (preset: ReturnType<typeof presetFor>, index: number) => {
      const R = composeOrientationMatrix(preset);
      const s = CORNER_SIGNS[index];
      const hat = s.map((v) => v / Math.sqrt(3));
      return Math.min(
        ...[0, 1, 2].map((i) => {
          const a = crystalAxisInLab(R, i);
          return a[0] * hat[0] + a[1] * hat[1] + a[2] * hat[2];
        }),
      );
    };

    // [110]: corners 0 = (+,+,+) and 2 = (+,-,+) both score exactly 0; 0 is chosen.
    expect(scoreOf(presetFor('[110]'), 0)).toBeCloseTo(0, 12);
    expect(scoreOf(presetFor('[110]'), 2)).toBeCloseTo(0, 12);
    expect(anchorCornerFor(presetFor('[110]'))).toBe(0);

    // [111]: corners 4 = (-,+,+) and 6 = (-,-,+) both score -0.138071; 4 is chosen.
    expect(scoreOf(presetFor('[111]'), 4)).toBeCloseTo(-0.1380712, 6);
    expect(scoreOf(presetFor('[111]'), 6)).toBeCloseTo(-0.1380712, 6);
    expect(anchorCornerFor(presetFor('[111]'))).toBe(4);
  });

  /** The rigid-ride property: the anchor is a function of the CUT alone. Rotating the sample must
   *  not make the triad jump to another corner — it rides with the body. */
  it('keeps the anchor corner fixed under every rotation', () => {
    const drifted: string[] = [];
    (Object.keys(CUTS) as Array<keyof typeof CUTS>).forEach((cut) => {
      const preset = presetFor(cut);
      const atRest = buildOrientationScene(preset).anchorCorner;
      for (let phiX = -90; phiX <= 90; phiX += 15) {
        for (let phiY = -90; phiY <= 90; phiY += 15) {
          for (let psi = -180; psi <= 180; psi += 30) {
            const seen = buildOrientationScene({ ...preset, phiX, phiY, psi }).anchorCorner;
            if (seen !== atRest) drifted.push(`${cut} (${phiX}, ${phiY}, ${psi}): ${atRest} -> ${seen}`);
          }
        }
      }
    });
    // Collected rather than fail-on-first: a drift would be a property failure, and the pattern of
    // WHERE it drifts is what would diagnose it. Also keeps ~11k iterations off the assertion clock.
    expect(drifted).toEqual([]);
  });

  /**
   * A correction to the recorded expectation: the work order assumed [111] anchors differently from
   * [100]. It does not — both land on corner 4, (-,+,+). Under [100] the axes are (z, y, -x); under
   * [111] all three carry +1/sqrt(3) of Z; the same corner serves both best. Within the cubic preset
   * set it is [110] that re-anchors, to corner 0. Recorded as an assertion so the coincidence cannot
   * be mistaken for a bug later.
   */
  it('[100] and [111] share an anchor corner, [110] does not', () => {
    expect(anchorCornerFor(presetFor('[111]'))).toBe(anchorCornerFor(presetFor('[100]')));
    expect(anchorCornerFor(presetFor('[110]'))).not.toBe(anchorCornerFor(presetFor('[100]')));
  });

  /** Switching the cut DOES re-anchor — the negative control for the test above. */
  it('re-anchors when the cut changes', () => {
    const rotation = { phiX: 20, phiY: 40, psi: -70 };
    const a = buildOrientationScene({ ...presetFor('[100]'), ...rotation }).anchorCorner;
    const b = buildOrientationScene({ ...presetFor('[010]'), ...rotation }).anchorCorner;
    const c = buildOrientationScene({ ...presetFor('[001]'), ...rotation }).anchorCorner;
    expect(new Set([a, b, c]).size).toBe(3);
  });

  /**
   * THE DEFECT CRITERION for the anchor rule, and the reason the score's sign is not it: an arrow
   * leaves the body unless it runs inward along ALL THREE of the corner's adjacent face normals.
   * The test is done in the BODY frame, where the crystal axes are the columns of R_preset and the
   * corner's normals are its sign vector — both the axes and the body carry the user rotation, so
   * this is rotation-independent and the five cuts are an exhaustive check, not a sample.
   *
   * [110] anchors at score 0 and [111] at score -0.138071, and no axis of either points into the
   * body: the score is how the corner is CHOSEN, never whether the choice is sound.
   */
  it('never points a crystal axis into the body, for any cut', () => {
    (Object.keys(CUTS) as Array<keyof typeof CUTS>).forEach((cut) => {
      const preset = presetFor(cut);
      const Rpreset = composeOrientationMatrix(preset);
      const signs = CORNER_SIGNS[anchorCornerFor(preset)];
      [0, 1, 2].forEach((i) => {
        expect(pointsIntoBody(crystalAxisInLab(Rpreset, i), signs)).toBe(false);
      });
    });
  });

  /** The criterion is not vacuous: the corner diagonally opposite the anchor does take axes inward. */
  it('the defect criterion has teeth', () => {
    const preset = presetFor('[001]');
    const Rpreset = composeOrientationMatrix(preset);
    const opposite = CORNER_SIGNS[7]; // (-,-,-), opposite the [001] anchor at (+,+,+)
    const inward = [0, 1, 2].filter((i) => pointsIntoBody(crystalAxisInLab(Rpreset, i), opposite));
    expect(inward).toHaveLength(0); // axis-aligned axes graze the faces rather than enter
    // From the (-,-,-) corner, the body lies in the (+,+,+) direction — that ray does enter it,
    // and the same ray from the opposing corner does not.
    expect(pointsIntoBody([1, 1, 1], opposite)).toBe(true);
    expect(pointsIntoBody([1, 1, 1], CORNER_SIGNS[0])).toBe(false);
  });

  it('hangs the crystal triad off the anchor corner', () => {
    (Object.keys(CUTS) as Array<keyof typeof CUTS>).forEach((cut) => {
      const scene = buildOrientationScene({ ...presetFor(cut), phiX: 25, phiY: -15, psi: 55 });
      scene.crystalAxes.forEach((axis) => expect(axis.from).toEqual(scene.corners[scene.anchorCorner]));
    });
  });
});

// ===========================================================================================

describe('orientationScene — handedness as drawn', () => {
  /**
   * DERIVATION. Write P for the 2x3 projection whose columns are the axis images. A 3-D direction e
   * of drawn length L is the screen delta d = (L s (Pe)_u, -L s (Pe)_v) — the minus is SVG's
   * downward y. The 2-D cross product of two such deltas is
   *     d1.x d2.y - d1.y d2.x = -(L s)^2 [ (Pe1)_u (Pe2)_v - (Pe1)_v (Pe2)_u ]
   *                           = -(L s)^2 (e1 x e2) . (row0 x row1),
   * and row0 x row1 = row2 = VIEW_TO_CAMERA, so for a RIGHT-handed triad, where e1 x e2 = e3,
   *     cross2(d1, d2) = -(L s)^2 (e3 . VIEW_TO_CAMERA).
   * That identity is what "the triad is right-handed as drawn" means for a flat picture: it ties the
   * 2-D winding on screen to the third axis's depth. A left-handed triad would flip its sign. The
   * camera being a rotation is what lets the line of sight enter with unit length -- under the
   * sheared predecessor an area factor had to be carried along.
   */
  const cross2 = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x * b.y - a.y * b.x;
  const delta = (axis: { from: { x: number; y: number }; to: { x: number; y: number } }) => ({
    x: axis.to.x - axis.from.x,
    y: axis.to.y - axis.from.y,
  });
  const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  it('draws a right-handed crystal triad for every cut and rotation', () => {
    const s = SCALE * CRYSTAL_AXIS_LENGTH;
    (Object.keys(CUTS) as Array<keyof typeof CUTS>).forEach((cut) => {
      const preset = presetFor(cut);
      for (let phiX = -90; phiX <= 90; phiX += 45) {
        for (let phiY = -90; phiY <= 90; phiY += 45) {
          for (let psi = -180; psi <= 180; psi += 60) {
            const { crystalAxes } = buildOrientationScene({ ...preset, phiX, phiY, psi });
            const [x, y, z] = crystalAxes;
            expect(cross2(delta(x), delta(y))).toBeCloseTo(-s * s * dot(z.direction, VIEW_TO_CAMERA), 6);
          }
        }
      }
    });
  });

  it('draws a right-handed lab triad', () => {
    const s = LAB_AXIS_SCALE;
    const [X, Y, Z] = buildOrientationScene().labAxes;
    expect(cross2(delta(X), delta(Y))).toBeCloseTo(-s * s * dot(Z.direction, VIEW_TO_CAMERA), 9);
    // and concretely: Z . VIEW_TO_CAMERA = -0.3971313, so cross2 = 26^2 * 0.3971313 = 268.46074,
    // positive in SVG coordinates. Checked against the deltas directly: X = (-10.98808, 8.05936),
    // Y = (0, -24.43201), and (-10.98808)(-24.43201) - (8.05936)(0) = 268.46074.
    expect(cross2(delta(X), delta(Y))).toBeCloseTo(268.46074, 4);
  });
});

// ===========================================================================================

describe('orientationScene — the canvas', () => {
  /**
   * Everything the component draws has to land inside the viewBox, with room for the labels. The
   * bound is measured over the whole reachable space rather than trusted from the constants.
   *
   * The envelope is accumulated and asserted ONCE rather than per point: the sweep visits ~2200
   * scenes, and four expectations per point put ~10^5 assertions on the clock, which timed out
   * under full-suite contention (the T1/E29 lesson, in its unit-test form). Collecting also makes
   * the failure message useful -- it reports the extent that broke the bound, not just that one did.
   */
  it('keeps every drawn point inside the canvas with margin', () => {
    const MARGIN = 8; // room for a label beside an arrow tip
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    (Object.keys(CUTS) as Array<keyof typeof CUTS>).forEach((cut) => {
      const preset = presetFor(cut);
      for (let phiX = -90; phiX <= 90; phiX += 30) {
        for (let phiY = -90; phiY <= 90; phiY += 30) {
          for (let psi = -180; psi <= 180; psi += 45) {
            const scene = buildOrientationScene({ ...preset, phiX, phiY, psi });
            for (const p of [
              ...scene.corners,
              ...scene.crystalAxes.flatMap((a) => [a.from, a.to]),
              ...scene.labAxes.flatMap((a) => [a.from, a.to]),
            ]) {
              if (p.x < minX) minX = p.x;
              if (p.x > maxX) maxX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.y > maxY) maxY = p.y;
            }
          }
        }
      }
    });

    // Infinity on either side would mean the sweep never ran; the four bounds below reject that.
    expect(minX).toBeGreaterThan(MARGIN);
    expect(maxX).toBeLessThan(SCENE_WIDTH - MARGIN);
    expect(minY).toBeGreaterThan(MARGIN);
    expect(maxY).toBeLessThan(SCENE_HEIGHT - MARGIN);
  });

  it('projects the body about the body origin', () => {
    const scene = buildOrientationScene();
    const mean = scene.corners.reduce((acc, p) => ({ x: acc.x + p.x / 8, y: acc.y + p.y / 8 }), { x: 0, y: 0 });
    expect(mean.x).toBeCloseTo(BODY_ORIGIN.x, 9);
    expect(mean.y).toBeCloseTo(BODY_ORIGIN.y, 9);
  });
});
