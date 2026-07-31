# Sign-off report -- the seven rank-3 VERIFY fixtures (goldenTensors.fixtures.ts)

> **Content:** Human sign-off record for the seven rank-3 VERIFY golden fixtures.
> **Status:** frozen (2026-07-09)
> **Authority:** historical record. The sign-off it documents is reflected in the fixture comments themselves.

Date: 2026-07-09. Scope: the seven fixtures carrying `// VERIFY: pending human sign-off ...`
markers (lines ~978, 984, 1343, 1349, 1360, 1366, 1372 at base `b988cbe`).
Method: (A) literature check against the LOCAL Fiebig et al., JOSA B 22, 96 (2005) PDF;
(B) independent numeric projection -- own contraction code (not the app pipeline), using only the
group generators and the app's `ALTERNATE_SETTINGS` rotations (S G S^-1) for setting 2; for each
fixture: all stated equality/sign chains checked numerically AND the count of independent
components matched against the fixture's implied count.

## A. Fiebig anchor (fixtures 1-2: `-3m'` MD-i, settings 1 and 2)
Fiebig Sec. 3 (text located and decoded in the local PDF): "With -3m as magnetic symmetry, axial
i tensors and polar c tensors of odd rank are allowed in Cr2O3 [ref 50 = Birss]. This leads to two
independent components each for MD SHG and ED SHG which are given by chi^{m(i)}: chi_yyy =
-chi_yxx = -chi_xyx = -chi_xxy, chi_xyz = chi_xzy = -chi_yxz = -chi_yzx ..."
-> Identical (rearranged) to the setting-1 fixture's two chains; the yyy-family fixes the
standard setting as the fixture's source states. Setting 2 is the 30-degree-rotated xxx-family
(verified numerically below). ANCHOR CONFIRMED.

## B. Independent numeric projection (all seven)
| Fixture | indep (computed / expected) | relation chains |
|---|---|---|
| `-3m'` MD-i setting 1 | 2 / 2 | xxy=xyx=yxx=-yyy ; xyz=xzy=-yxz=-yzx : OK |
| `-3m'` MD-i setting 2 | 2 / 2 | xxx=-xyy=-yxy=-yyx ; xyz-family : OK |
| `4'/m'm'm` ED-i setting 2 | 0 / 0 | identically zero (max comp 5.6e-17) : OK |
| `4'/m'm'm` ED-c setting 2 | 2 / 2 | xxz=xzx=-yyz=-yzy ; zxx=-zyy : OK |
| `m1'` ED-i setting 2 | 10 / 10 | the three pairings xxz=xzx, yxy=yyx, zxz=zzx : OK |
| `3m1'` ED-i setting 2 | 4 / 4 | xxy-family ; xxz-family ; zxx=zyy : OK |
| `-6m21'` ED-i setting 2 | 1 / 1 | xxy=xyx=yxx=-yyy : OK |

Notes: the grey-rule fixtures (5-7) additionally rest on the exact statement that 1' acts as the
identity on time-even tensors, so ED-i of G1' equals ED-i of the table-anchored parent -- the
numeric check reproduces this independently. The `4'/m'm'm` ED-i zero follows from the antiunitary
inversion -1' acting spatially on a time-even odd-rank polar tensor (orientation-independent),
also reproduced numerically.

## Recommendation
All seven fixtures are correct. Upon maintainer sign-off, replace each
`// VERIFY: pending human sign-off ...` comment with
`// Signed off 2026-07-09: Fiebig (2005) PDF check + independent numeric projection (see docs/findings).`
and file this report under `docs/findings/SIGNOFF-rank3-verify-2026-07-09.md`.
