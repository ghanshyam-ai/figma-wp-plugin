/**
 * Convert a single Figma 0-1 float channel to a 2-digit hex string.
 * Uses Math.round() for precision (NOT Math.floor()).
 */
function channelToHex(value: number): string {
  return Math.round(value * 255).toString(16).padStart(2, '0').toUpperCase();
}

/**
 * Convert Figma RGB (0-1 float) to 6-digit uppercase HEX.
 * { r: 0.086, g: 0.22, b: 0.984 } → "#1638FB"
 */
export function rgbToHex(color: { r: number; g: number; b: number }): string {
  return `#${channelToHex(color.r)}${channelToHex(color.g)}${channelToHex(color.b)}`;
}

/**
 * Convert Figma RGBA (0-1 float) to HEX.
 * Returns 6-digit HEX if fully opaque, 8-digit HEX if alpha < 1.
 */
export function rgbaToHex(color: { r: number; g: number; b: number }, opacity: number = 1): string {
  const base = rgbToHex(color);
  if (opacity >= 1) return base;
  return `${base}${channelToHex(opacity)}`;
}

/**
 * Extract the primary background color from a node's fills.
 * Returns 6/8-digit HEX or null.
 */
export function extractBackgroundColor(node: SceneNode & { fills?: readonly Paint[] }): string | null {
  if (!('fills' in node) || !node.fills || !Array.isArray(node.fills)) return null;

  for (const fill of node.fills) {
    if (fill.type === 'SOLID' && fill.visible !== false) {
      const opacity = fill.opacity !== undefined ? fill.opacity : 1;
      return rgbaToHex(fill.color, opacity);
    }
  }
  return null;
}

/**
 * Extract the text color from a TEXT node's fills.
 */
export function extractTextColor(node: TextNode): string | null {
  if (!node.fills || !Array.isArray(node.fills)) return null;

  for (const fill of node.fills as readonly Paint[]) {
    if (fill.type === 'SOLID' && fill.visible !== false) {
      return rgbToHex(fill.color);
    }
  }
  return null;
}

/**
 * Decode the CSS gradient angle from Figma's `gradientTransform` matrix.
 *
 * Figma's gradientTransform is a 2×3 affine matrix that maps actual
 * coordinates back to the unit gradient line (0,0)→(1,0). Inverting the
 * linear part gives the gradient direction in actual coordinates. We then
 * convert that vector to a CSS angle, where 0deg = "to top" and angles
 * increase clockwise.
 *
 * Returns 180 (the CSS default for top-to-bottom) when the matrix is
 * absent or singular, so output stays sensible on edge-case fills.
 */
function gradientAngleFromTransform(t: number[][] | undefined): number {
  if (!t || !Array.isArray(t) || t.length < 2) return 180;
  const a = t[0][0], b = t[0][1];
  const c = t[1][0], d = t[1][1];
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-9) return 180;
  // Direction vector in actual coordinates: inv(linear) * (1, 0) = (d/det, -c/det)
  const vx = d / det;
  const vy = -c / det;
  // CSS angle: 0deg = up, +90 = right, +180 = down. atan2(vx, -vy) gives that.
  let deg = Math.atan2(vx, -vy) * (180 / Math.PI);
  if (deg < 0) deg += 360;
  return Math.round(deg);
}

/**
 * Extract gradient as CSS string, or null if not a gradient.
 *
 * Supports linear, radial, angular (CSS conic-gradient), and diamond
 * (approximated with radial-gradient — no exact CSS equivalent). The
 * angle of linear gradients is decoded from `gradientTransform`, so
 * `linear-gradient(45deg, …)` and `linear-gradient(225deg, …)` no
 * longer collapse to the default direction.
 */
export function extractGradient(node: SceneNode & { fills?: readonly Paint[] }): string | null {
  if (!('fills' in node) || !node.fills || !Array.isArray(node.fills)) return null;

  for (const fill of node.fills) {
    if (fill.visible === false) continue;
    if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL' ||
        fill.type === 'GRADIENT_ANGULAR' || fill.type === 'GRADIENT_DIAMOND') {
      const g = fill as GradientPaint;
      const stops = g.gradientStops
        .map(s => `${rgbToHex(s.color)} ${Math.round(s.position * 100)}%`)
        .join(', ');
      const opacity = (g as any).opacity;
      const stopsWithAlpha = opacity !== undefined && opacity < 1
        ? g.gradientStops.map(s => {
            const a = (s.color.a ?? 1) * opacity;
            return `rgba(${Math.round(s.color.r * 255)}, ${Math.round(s.color.g * 255)}, ${Math.round(s.color.b * 255)}, ${Math.round(a * 100) / 100}) ${Math.round(s.position * 100)}%`;
          }).join(', ')
        : stops;

      switch (fill.type) {
        case 'GRADIENT_LINEAR': {
          const angle = gradientAngleFromTransform((g as any).gradientTransform);
          return `linear-gradient(${angle}deg, ${stopsWithAlpha})`;
        }
        case 'GRADIENT_RADIAL':
          return `radial-gradient(${stopsWithAlpha})`;
        case 'GRADIENT_ANGULAR':
          // Figma's angular = CSS conic-gradient. The `from` angle could be
          // decoded from gradientTransform too, but most agents are happy
          // with the default starting angle. Refine if needed.
          return `conic-gradient(${stopsWithAlpha})`;
        case 'GRADIENT_DIAMOND':
          // No exact CSS equivalent; closest is radial-gradient. Agent should
          // be aware this is an approximation (diamond ≠ radial circle).
          return `radial-gradient(${stopsWithAlpha}) /* approximated from Figma diamond gradient */`;
      }
    }
  }
  return null;
}

/**
 * Map Figma's strokeAlign ('INSIDE' | 'OUTSIDE' | 'CENTER') to a lowercase
 * CSS-friendly token. Returns null when the node has no resolvable strokeAlign.
 */
export function extractStrokeAlign(node: any): 'inside' | 'outside' | 'center' | null {
  const s = node?.strokeAlign;
  if (s === 'INSIDE') return 'inside';
  if (s === 'OUTSIDE') return 'outside';
  if (s === 'CENTER') return 'center';
  return null;
}

/**
 * Map Figma's blendMode to CSS `mix-blend-mode`. Returns null for NORMAL
 * and PASS_THROUGH (which are CSS defaults).
 */
export function extractMixBlendMode(node: any): string | null {
  const bm = node?.blendMode;
  if (!bm || typeof bm !== 'string') return null;
  switch (bm) {
    case 'NORMAL':
    case 'PASS_THROUGH':
      return null;
    case 'MULTIPLY': return 'multiply';
    case 'SCREEN': return 'screen';
    case 'OVERLAY': return 'overlay';
    case 'DARKEN': return 'darken';
    case 'LIGHTEN': return 'lighten';
    case 'COLOR_DODGE': return 'color-dodge';
    case 'COLOR_BURN': return 'color-burn';
    case 'HARD_LIGHT': return 'hard-light';
    case 'SOFT_LIGHT': return 'soft-light';
    case 'DIFFERENCE': return 'difference';
    case 'EXCLUSION': return 'exclusion';
    case 'HUE': return 'hue';
    case 'SATURATION': return 'saturation';
    case 'COLOR': return 'color';
    case 'LUMINOSITY': return 'luminosity';
    // Approximations — no direct CSS equivalent
    case 'LINEAR_BURN': return 'multiply';
    case 'LINEAR_DODGE': return 'screen';
    default: return null;
  }
}

/**
 * Check if a node has an IMAGE fill (photograph/background).
 */
export function hasImageFill(node: SceneNode & { fills?: readonly Paint[] }): boolean {
  if (!('fills' in node) || !node.fills || !Array.isArray(node.fills)) return false;
  return node.fills.some(f => f.type === 'IMAGE' && f.visible !== false);
}

/**
 * Map Figma strokeAlign to a suitable CSS border-style.
 * Figma supports solid strokes natively; dashed is inferred from dashPattern.
 */
export function extractBorderStyle(node: any): string | null {
  if (!('strokes' in node) || !Array.isArray(node.strokes) || node.strokes.length === 0) return null;
  const dashPattern = (node as any).dashPattern;
  if (Array.isArray(dashPattern) && dashPattern.length > 0) {
    // 1-unit dashes = dotted, larger = dashed
    const max = Math.max(...dashPattern);
    return max <= 2 ? 'dotted' : 'dashed';
  }
  return 'solid';
}

/**
 * Extract per-side border-width. Figma's individualStrokeWeights (if set)
 * provides per-side widths; otherwise strokeWeight is uniform.
 * Returns null for any side that is 0.
 */
export function extractBorderWidths(node: any): {
  top: number | null; right: number | null; bottom: number | null; left: number | null; uniform: number | null;
} {
  const ind = (node as any).individualStrokeWeights;
  if (ind && typeof ind === 'object') {
    return {
      top: ind.top || null,
      right: ind.right || null,
      bottom: ind.bottom || null,
      left: ind.left || null,
      uniform: null,
    };
  }
  const w = (node as any).strokeWeight;
  if (typeof w === 'number' && w > 0) {
    return { top: null, right: null, bottom: null, left: null, uniform: w };
  }
  return { top: null, right: null, bottom: null, left: null, uniform: null };
}

/**
 * Extract the first visible SOLID stroke color as hex.
 */
export function extractStrokeColor(node: any): string | null {
  if (!('strokes' in node) || !Array.isArray(node.strokes)) return null;
  for (const stroke of node.strokes) {
    if (stroke.type === 'SOLID' && stroke.visible !== false) {
      return rgbToHex(stroke.color);
    }
  }
  return null;
}

/**
 * Collect all unique colors from a node tree.
 * Returns a map of HEX → usage count.
 */
export function collectColors(root: SceneNode): Record<string, number> {
  const colors: Record<string, number> = {};

  function walk(node: SceneNode) {
    // Fills
    if ('fills' in node && node.fills && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID' && fill.visible !== false) {
          const hex = rgbToHex(fill.color);
          colors[hex] = (colors[hex] || 0) + 1;
        }
      }
    }
    // Strokes
    if ('strokes' in node && node.strokes && Array.isArray(node.strokes)) {
      for (const stroke of node.strokes) {
        if (stroke.type === 'SOLID' && stroke.visible !== false) {
          const hex = rgbToHex(stroke.color);
          colors[hex] = (colors[hex] || 0) + 1;
        }
      }
    }
    // Recurse
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        walk(child);
      }
    }
  }

  walk(root);
  return colors;
}
