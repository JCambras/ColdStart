// Design tokens — re-exported from Style Dictionary generated output.
// Edit tokens in tokens/*.json, then run `npm run tokens:build`.

export { colors, text, spacing, radius, layout, shadow, transition, nav } from './theme.generated';

/** Build a CSS padding/margin string from spacing token values. */
export function pad(...values: number[]): string {
  return values.map(v => `${v}px`).join(' ');
}
