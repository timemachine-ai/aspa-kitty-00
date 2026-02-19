/**
 * TimeMachine Contour - Graph Plotter Module
 *
 * Detects equations containing the variable 'x' and renders a
 * Desmos-style interactive SVG graph inside the Contour panel.
 *
 * Trigger patterns:
 *   y = sin(x)        → explicit y = … prefix
 *   f(x) = x^2 + 3x   → f(x) = … prefix
 *   sin(x)            → expression with x + math ops
 *   x^2 + 3x + 7      → expression with x and ^
 *   2x + 5            → linear with implicit mult
 *   |x|               → absolute value
 */

export interface GraphResult {
  /** The full original user input (equation) */
  eq1: string;
  isPartial: boolean;
}

function hasMathOps(s: string): boolean {
  return /[+\-*\/^()|]|sin|cos|tan|sqrt|abs|ln|log|exp|pi|π/.test(s);
}

/**
 * Detect whether the input is a plottable equation containing 'x'.
 * Returns null if the input does not look like a graph equation.
 */
export function detectGraph(input: string): GraphResult | null {
  const s = input.trim();
  if (!s) return null;

  // Must contain 'x' as a word-bounded variable token
  if (!/\bx\b/.test(s)) return null;

  // Explicit "y = …", "f(x) = …", "g(x) = …" forms — always trigger
  if (/^[yfg]\s*(\(\s*x\s*\))?\s*=/i.test(s)) {
    const rhs = s.replace(/^[yfg]\s*(\(\s*x\s*\))?\s*=\s*/i, '').trim();
    if (rhs) return { eq1: s, isPartial: false };
  }

  // Expression with x and at least one math operator or known function
  if (hasMathOps(s)) {
    return { eq1: s, isPartial: false };
  }

  // Just 'x' alone (identity / linear y=x)
  if (s === 'x') {
    return { eq1: s, isPartial: false };
  }

  return null;
}
