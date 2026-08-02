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
  AXO_KERNEL,
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
   * THE CAMERA CONTRACT. The projection is stated as the screen images of the three lab axes, so the
   * contract is a statement about those images: sign structure, not magnitudes. This is the
   * assertion whose absence let a cyclic axis permutation ship -- every other direction test in this
   * file compares LAB-space vectors and is blind to where the camera puts them.
   *
   * Screen convention: u to the right, v UP (SVG's downward y is applied inside `project`).
   */
  it('places the lab axes on screen as the contract requires', () => {
    // Y_lab: exactly vertical, up. Exactly, not approximately -- it is the picture's plumb line.
    expect(AXO_Y.u).toBe(0);
    expect(AXO_Y.v).toBeGreaterThan(0);

    // Z_lab (the beam): to the right, slightly raised. The rise is small -- it must read as a
    // direction ACROSS the picture, not as a second vertical.
    expect(AXO_Z.u).toBeGreaterThan(0);
    expect(AXO_Z.v).toBeGreaterThan(0);
    expect(AXO_Z.v).toBeLessThan(AXO_Z.u / 2);

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
   * DERIVATION of the line of sight. The projection's two rows are
   *     p_u = (X.u, Y.u, Z.u) = (-0.82, 0, 0.94)
   *     p_v = (X.v, Y.v, Z.v) = (-0.42, 1, 0.20)
   * and its kernel is their cross product:
   *     i = 0(0.20) - 0.94(1)        = -0.94
   *     j = 0.94(-0.42) - (-0.82)(0.20) = -0.3948 + 0.164 = -0.2308
   *     k = (-0.82)(1) - 0(-0.42)    = -0.82
   * so AXO_KERNEL = (-0.94, -0.2308, -0.82), of length
   *     sqrt(0.8836 + 0.05326864 + 0.6724) = sqrt(1.60926864) = 1.2685695,
   * giving the unit line of sight (-0.7409919, -0.1819374, -0.6463970).
   *
   * Its NEGATIVE z-component is the load-bearing part: the camera sits on the -Z side, so the large
   * face the viewer sees is the -Z one and the slab's thickness runs off to the RIGHT, towards the
   * "∥ k" arrow, instead of to the left.
   */
  it('has the hand-derived line of sight, on the -Z side', () => {
    closeTo(AXO_KERNEL, [-0.94, -0.2308, -0.82]);
    expect(Math.hypot(...AXO_KERNEL)).toBeCloseTo(1.2685695, 6);
    closeTo(VIEW_TO_CAMERA, [-0.7409919, -0.1819374, -0.646397]);
    expect(Math.hypot(...VIEW_TO_CAMERA)).toBeCloseTo(1, 12);
    expect(VIEW_TO_CAMERA[2]).toBeLessThan(0);

    // the kernel really is annihilated by the projection
    const origin = project([0, 0, 0], { x: 0, y: 0 }, 1);
    const along = project(AXO_KERNEL, { x: 0, y: 0 }, 1);
    expect(along.x - origin.x).toBeCloseTo(0, 12);
    expect(along.y - origin.y).toBeCloseTo(0, 12);
  });

  /**
   * DERIVATION. The lab triad is drawn at LAB_ORIGIN = (40, 180) with LAB_AXIS_SCALE = 24, and
   * screen = (origin.x + s*u, origin.y - s*v):
   *   X: x = 40 + 24(-0.82) = 20.32   y = 180 - 24(-0.42) = 190.08
   *   Y: x = 40 + 24(0)     = 40      y = 180 - 24(1)     = 156
   *   Z: x = 40 + 24(0.94)  = 62.56   y = 180 - 24(0.20)  = 175.20
   */
  it('projects the lab triad to its hand-derived screen positions', () => {
    const scene = buildOrientationScene();
    const [X, Y, Z] = scene.labAxes;
    expect(X.label).toBe('X');
    expect(Y.label).toBe('Y');
    expect(Z.label).toBe('Z');

    expect(X.to.x).toBeCloseTo(20.32, 9);
    expect(X.to.y).toBeCloseTo(190.08, 9);
    expect(Y.to.x).toBeCloseTo(40, 12);
    expect(Y.to.y).toBeCloseTo(156, 12);
    expect(Z.to.x).toBeCloseTo(62.56, 9);
    expect(Z.to.y).toBeCloseTo(175.2, 9);
  });

  /** Y is the plumb line: it leaves the origin straight up, with no horizontal component at all. */
  it('draws lab Y exactly vertical and the beam across the picture', () => {
    const [X, Y, Z] = buildOrientationScene().labAxes;
    expect(Y.to.x - Y.from.x).toBe(0);
    expect(Y.to.y).toBeLessThan(Y.from.y); // up, in SVG coordinates

    // the beam runs to the right and rises only slightly
    expect(Z.to.x).toBeGreaterThan(Z.from.x);
    expect(Z.from.y - Z.to.y).toBeGreaterThan(0);
    expect(Z.from.y - Z.to.y).toBeLessThan((Z.to.x - Z.from.x) / 2);

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
   * outward normal has a positive component along the line of sight (-0.7410, -0.1819, -0.6464):
   * the three NEGATIVE faces, with depths 0.7410 (-x), 0.1819 (-y) and 0.6464 (-z). Painter's order
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
    expect(faces.map((f) => +f.depth.toFixed(4))).toEqual([0.1819, 0.6464, 0.741]);

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
   *                           = -(L s)^2 (e1 x e2) . (p_u x p_v),
   * and p_u x p_v is AXO_KERNEL, so for a RIGHT-handed triad, where e1 x e2 = e3,
   *     cross2(d1, d2) = -(L s)^2 (e3 . AXO_KERNEL).
   * That identity is what "the triad is right-handed as drawn" means for a flat picture: it ties the
   * 2-D winding on screen to the third axis's depth. A left-handed triad would flip its sign. Note
   * the kernel enters UNNORMALIZED — its length is the projection's area scale, and a general
   * axonometric does not preserve area the way an orthonormal camera does.
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
            expect(cross2(delta(x), delta(y))).toBeCloseTo(-s * s * dot(z.direction, AXO_KERNEL), 6);
          }
        }
      }
    });
  });

  it('draws a right-handed lab triad', () => {
    const s = LAB_AXIS_SCALE;
    const [X, Y, Z] = buildOrientationScene().labAxes;
    expect(cross2(delta(X), delta(Y))).toBeCloseTo(-s * s * dot(Z.direction, AXO_KERNEL), 9);
    // and concretely: Z . AXO_KERNEL = -0.82, so cross2 = 24^2 * 0.82 = 472.32, positive in SVG
    // coordinates. Checked against the deltas directly: X = (-19.68, 10.08), Y = (0, -24), and
    // (-19.68)(-24) - (10.08)(0) = 472.32.
    expect(cross2(delta(X), delta(Y))).toBeCloseTo(472.32, 9);
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
