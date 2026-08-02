import { describe, it, expect } from 'vitest';
import {
  buildOrientationScene,
  anchorCornerFor,
  pointsIntoBody,
  crystalAxisInLab,
  project,
  CORNER_SIGNS,
  HALF_EXTENTS,
  SCREEN_RIGHT,
  SCREEN_UP,
  VIEW_TO_CAMERA,
  VIEW_AZIMUTH_DEG,
  VIEW_ELEVATION_DEG,
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
   * DERIVATION. The camera is given as azimuth a = 34 deg in the lab XY-plane and elevation
   * e = 21 deg above it, so the unit vector from the scene towards the camera is
   *     c = (cos e cos a, cos e sin a, sin e).
   * The screen basis follows in closed form:
   *     r = normalize(Z x c) = normalize((-cos e sin a, cos e cos a, 0)) = (-sin a, cos a, 0)
   *         -- the cos e cancels, which is why the horizon never tilts with elevation;
   *     u = c x r = (-sin e cos a, -sin e sin a, cos e).
   * Numerically, with sin34 = 0.5591929, cos34 = 0.8290376, sin21 = 0.3583679, cos21 = 0.9335804.
   */
  it('has the hand-derived screen basis', () => {
    const a = rad(VIEW_AZIMUTH_DEG);
    const e = rad(VIEW_ELEVATION_DEG);

    closeTo(VIEW_TO_CAMERA, [0.7739732, 0.5220516, 0.3583679]);
    closeTo(VIEW_TO_CAMERA, [Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e)]);

    closeTo(SCREEN_RIGHT, [-0.5591929, 0.8290376, 0]);
    closeTo(SCREEN_RIGHT, [-Math.sin(a), Math.cos(a), 0]);

    closeTo(SCREEN_UP, [-0.2971001, -0.2003968, 0.9335804]);
    closeTo(SCREEN_UP, [-Math.sin(e) * Math.cos(a), -Math.sin(e) * Math.sin(a), Math.cos(e)]);
  });

  /** (r, u, c) must be right-handed and orthonormal — the projected-handedness identity further
   *  down is derived from r x u = c, so if that ever stopped holding the identity would be vacuous. */
  it('has an orthonormal right-handed screen frame, r x u = c', () => {
    const cross = [
      SCREEN_RIGHT[1] * SCREEN_UP[2] - SCREEN_RIGHT[2] * SCREEN_UP[1],
      SCREEN_RIGHT[2] * SCREEN_UP[0] - SCREEN_RIGHT[0] * SCREEN_UP[2],
      SCREEN_RIGHT[0] * SCREEN_UP[1] - SCREEN_RIGHT[1] * SCREEN_UP[0],
    ];
    closeTo(cross, VIEW_TO_CAMERA);
    expect(Math.hypot(...SCREEN_RIGHT)).toBeCloseTo(1, 12);
    expect(Math.hypot(...SCREEN_UP)).toBeCloseTo(1, 12);
    expect(SCREEN_RIGHT[0] * SCREEN_UP[0] + SCREEN_RIGHT[1] * SCREEN_UP[1] + SCREEN_RIGHT[2] * SCREEN_UP[2]).toBeCloseTo(
      0,
      12,
    );
  });

  /**
   * DERIVATION. Lab Z projects to (origin.x + s * (Z . r), origin.y - s * (Z . u)). Z . r = 0 by
   * construction (r lies in the lab XY-plane), so the beam axis is drawn EXACTLY vertical, with
   * length s * cos e = 25 * 0.9335804 = 23.33951 upward: y = 170 - 23.33951 = 146.66049.
   */
  it('draws the beam axis exactly vertical', () => {
    const z = project([0, 0, 1], LAB_ORIGIN, LAB_AXIS_SCALE);
    expect(z.x).toBeCloseTo(LAB_ORIGIN.x, 12);
    expect(z.x).toBeCloseTo(38, 12);
    expect(z.y).toBeCloseTo(146.66049, 5);
  });

  /** DERIVATION. Lab X: x = 38 + 25*(-0.5591929) = 24.02018; y = 170 - 25*(-0.2971001) = 177.42750.
   *  Lab Y: x = 38 + 25*(0.8290376) = 58.72594;  y = 170 - 25*(-0.2003968) = 175.00992. */
  it('projects the lab triad to its hand-derived screen positions', () => {
    const scene = buildOrientationScene();
    const [X, Y, Z] = scene.labAxes;
    expect(X.label).toBe('X');
    expect(Y.label).toBe('Y');
    expect(Z.label).toBe('Z');

    expect(X.to.x).toBeCloseTo(24.02018, 5);
    expect(X.to.y).toBeCloseTo(177.4275, 4);
    expect(Y.to.x).toBeCloseTo(58.72594, 5);
    expect(Y.to.y).toBeCloseTo(175.00992, 5);
    expect(Z.to.x).toBeCloseTo(38, 12);
    expect(Z.to.y).toBeCloseTo(146.66049, 5);
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

  /** At zero rotation the slab lies flat with its large face towards the beam, and the camera sits
   *  above and to the side: the +z face and exactly one face from each of the +x/+y pairs show. */
  it('shows the large +z face at zero rotation', () => {
    const { faces } = buildOrientationScene();
    expect(faces).toHaveLength(3);
    const normals = faces.map((f) => f.normal.map((v) => Math.round(v)));
    expect(normals).toContainEqual([0, 0, 1]);
    expect(normals).toContainEqual([1, 0, 0]);
    expect(normals).toContainEqual([0, 1, 0]);
    // The camera sits at 21 deg elevation and 34 deg azimuth, so the two side faces face it more
    // squarely than the large one: +x (cos 34) is nearest, then +y (sin 34), then +z (sin 21).
    expect(faces.map((f) => f.normal.map((v) => Math.round(v)))).toEqual([
      [0, 0, 1],
      [0, 1, 0],
      [1, 0, 0],
    ]);
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
   * DERIVATION. For projected axis deltas d_i = (s (e_i . r), -s (e_i . u)) — the minus is SVG's
   * downward y — the 2-D cross product is
   *     d1.x d2.y - d1.y d2.x = -s^2 [ (e1.r)(e2.u) - (e1.u)(e2.r) ] = -s^2 (e1 x e2) . (r x u),
   * and r x u = c (asserted above), so for a RIGHT-handed triad, where e1 x e2 = e3,
   *     cross2(d1, d2) = -s^2 (e3 . c).
   * That identity is what "the triad is right-handed as drawn" means for a flat picture: it ties the
   * 2-D winding on screen to the third axis's depth. A left-handed triad would flip its sign.
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
    // and concretely: Z . c = sin(21 deg) > 0, so the winding is negative in SVG coordinates
    expect(cross2(delta(X), delta(Y))).toBeLessThan(0);
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
