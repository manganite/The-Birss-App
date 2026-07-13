/** Render `-N` axis indices as LaTeX overbars (`\bar{N}`) for KaTeX group/class symbols. Shared by
 *  the Tables sub-views (lookup chain and reduced-form result). */
export const bar = (s: string) => s.replace(/-([1-6])/g, '\\bar{$1}');
