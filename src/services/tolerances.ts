/**
 * tolerances.ts -- one home for the numeric comparison tolerances used across the services layer.
 *
 * The values DIFFER on purpose: each gates a different quantity, so re-homing them here (Wave-2 E6)
 * does NOT unify them. The only value-duplicate collapsed here is COEFF_EPSILON, which the numeric
 * coefficient formatter (tensorProjection.formatCoeff) and the trig-polynomial coefficient formatter
 * (trigPolyFormat) both used at 1e-5.
 */

/** General tolerance for tensor/coefficient/matrix comparisons. */
export const EPSILON = 1e-6;

/** Geometric tolerance for normalized axis-vector "is zero" / dot-product sign checks. */
export const AXIS_EPSILON = 1e-5;

/** Cardinal-axis / in-plane-axis detection tolerance in formatAxis. */
export const CARDINAL_AXIS_EPSILON = 1e-3;

/** Coefficient formatting: "is this an integer / matches a simple fraction" tolerance (same value as
 * AXIS_EPSILON, kept separate -- unrelated quantities). Shared by formatCoeff and trigPolyFormat. */
export const COEFF_EPSILON = 1e-5;

/** formatCoeff's irrational-root (sqrt) matching tolerance. */
export const ROOT_MATCH_EPSILON = 1e-4;
