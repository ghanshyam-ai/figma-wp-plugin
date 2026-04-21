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
 * Extract gradient as CSS string, or null if not a gradient.
 */
export function extractGradient(node: SceneNode & { fills?: readonly Paint[] }): string | null {
  if (!('fills' in node) || !node.fills || !Array.isArray(node.fills)) return null;

  for (const fill of node.fills) {
    if (fill.type === 'GRADIENT_LINEAR' && fill.visible !== false) {
      const stops = fill.gradientStops
        .map(s => `${rgbToHex(s.color)} ${Math.round(s.position * 100)}%`)
        .join(', ');
      return `linear-gradient(${stops})`;
    }
    if (fill.type === 'GRADIENT_RADIAL' && fill.visible !== false) {
      const stops = fill.gradientStops
        .map(s => `${rgbToHex(s.color)} ${Math.round(s.position * 100)}%`)
        .join(', ');
      return `radial-gradient(${stops})`;
    }
  }
  return null;
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
