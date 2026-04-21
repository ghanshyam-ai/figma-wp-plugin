/**
 * Extract Figma Effects (shadows, blurs) into CSS-ready values.
 *
 * Figma supports an array of effects per node. We map:
 *   DROP_SHADOW  → box-shadow (multiple allowed, comma-separated)
 *   INNER_SHADOW → box-shadow with `inset` keyword
 *   LAYER_BLUR   → filter: blur(Npx)
 *   BACKGROUND_BLUR → backdrop-filter: blur(Npx)
 *
 * TEXT nodes get their DROP_SHADOW mapped to CSS text-shadow instead of
 * box-shadow (DOM rendering: text nodes don't honor box-shadow on the
 * glyphs themselves).
 */

function rgbaString(color: { r: number; g: number; b: number; a?: number }): string {
  const a = color.a !== undefined ? Math.round(color.a * 100) / 100 : 1;
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${a})`;
}

function shadowToCss(e: DropShadowEffect | InnerShadowEffect, inset: boolean): string {
  const x = Math.round(e.offset.x);
  const y = Math.round(e.offset.y);
  const blur = Math.round(e.radius);
  const spread = Math.round((e as any).spread || 0);
  const color = rgbaString(e.color);
  const prefix = inset ? 'inset ' : '';
  return `${prefix}${x}px ${y}px ${blur}px ${spread}px ${color}`;
}

export interface ExtractedEffects {
  boxShadow: string | null;     // comma-separated CSS value for multiple shadows
  textShadow: string | null;    // for TEXT nodes (DROP_SHADOW on text becomes text-shadow)
  filter: string | null;        // LAYER_BLUR → blur(Npx), extendable
  backdropFilter: string | null; // BACKGROUND_BLUR → blur(Npx)
}

/**
 * Extract all effects from a node and return CSS-ready values.
 * Respects Figma's visible flag; skips hidden effects.
 */
export function extractEffects(
  node: { effects?: readonly Effect[]; type?: string },
): ExtractedEffects {
  const result: ExtractedEffects = {
    boxShadow: null,
    textShadow: null,
    filter: null,
    backdropFilter: null,
  };

  if (!node.effects || !Array.isArray(node.effects) || node.effects.length === 0) {
    return result;
  }

  const isText = node.type === 'TEXT';
  const shadowStrings: string[] = [];
  const textShadowStrings: string[] = [];
  const filterParts: string[] = [];
  const backdropParts: string[] = [];

  for (const effect of node.effects) {
    if (effect.visible === false) continue;

    if (effect.type === 'DROP_SHADOW') {
      const e = effect as DropShadowEffect;
      if (isText) {
        // text-shadow format: <x> <y> <blur> <color> (no spread)
        const x = Math.round(e.offset.x);
        const y = Math.round(e.offset.y);
        const blur = Math.round(e.radius);
        textShadowStrings.push(`${x}px ${y}px ${blur}px ${rgbaString(e.color)}`);
      } else {
        shadowStrings.push(shadowToCss(e, false));
      }
    } else if (effect.type === 'INNER_SHADOW') {
      const e = effect as InnerShadowEffect;
      // INNER_SHADOW on TEXT isn't a thing in CSS — fall back to empty for text
      if (!isText) shadowStrings.push(shadowToCss(e, true));
    } else if (effect.type === 'LAYER_BLUR') {
      const e = effect as BlurEffect;
      filterParts.push(`blur(${Math.round(e.radius)}px)`);
    } else if (effect.type === 'BACKGROUND_BLUR') {
      const e = effect as BlurEffect;
      backdropParts.push(`blur(${Math.round(e.radius)}px)`);
    }
  }

  if (shadowStrings.length > 0) result.boxShadow = shadowStrings.join(', ');
  if (textShadowStrings.length > 0) result.textShadow = textShadowStrings.join(', ');
  if (filterParts.length > 0) result.filter = filterParts.join(' ');
  if (backdropParts.length > 0) result.backdropFilter = backdropParts.join(' ');

  return result;
}
