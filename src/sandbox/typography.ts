import { ElementStyles, TextSegment } from './types';
import { toCssValue } from './utils';
import { extractTextColor, rgbToHex } from './color';
import { extractEffects } from './effects';

/**
 * Derive CSS font-weight from a Figma font style name.
 */
export function fontWeightFromStyle(style: string): number {
  const s = style.toLowerCase();
  if (s.includes('thin') || s.includes('hairline')) return 100;
  if (s.includes('extralight') || s.includes('ultra light') || s.includes('extra light')) return 200;
  if (s.includes('light')) return 300;
  if (s.includes('medium')) return 500;
  if (s.includes('semibold') || s.includes('semi bold') || s.includes('demi bold') || s.includes('demibold')) return 600;
  if (s.includes('extrabold') || s.includes('extra bold') || s.includes('ultra bold') || s.includes('ultrabold')) return 800;
  if (s.includes('black') || s.includes('heavy')) return 900;
  if (s.includes('bold')) return 700;
  return 400; // Regular / Normal / Book
}

/**
 * Map Figma text alignment to CSS text-align value.
 */
function mapTextAlign(align: string): string | null {
  switch (align) {
    case 'LEFT': return 'left';
    case 'CENTER': return 'center';
    case 'RIGHT': return 'right';
    case 'JUSTIFIED': return 'justify';
    default: return null;
  }
}

/**
 * Map Figma text case to CSS text-transform value.
 */
function mapTextCase(textCase: string): string | null {
  switch (textCase) {
    case 'UPPER': return 'uppercase';
    case 'LOWER': return 'lowercase';
    case 'TITLE': return 'capitalize';
    case 'ORIGINAL':
    default: return 'none';
  }
}

/**
 * Extract typography styles from a TEXT node.
 * Returns CSS-ready values with units.
 */
export function extractTypography(node: TextNode): Partial<ElementStyles> {
  const styles: Partial<ElementStyles> = {};

  // Font family — handle mixed fonts (use first segment)
  const fontName = node.fontName;
  if (fontName !== figma.mixed && fontName) {
    styles.fontFamily = fontName.family;
    styles.fontWeight = fontWeightFromStyle(fontName.style);
  }

  // Font size
  const fontSize = node.fontSize;
  if (fontSize !== figma.mixed && typeof fontSize === 'number') {
    styles.fontSize = toCssValue(fontSize);
  }

  // Line height
  const lh = node.lineHeight;
  if (lh !== figma.mixed && lh) {
    if (lh.unit === 'PIXELS') {
      styles.lineHeight = toCssValue(lh.value);
    } else if (lh.unit === 'PERCENT') {
      styles.lineHeight = `${Math.round(lh.value)}%`;
    } else {
      // AUTO — derive from font size
      styles.lineHeight = null;
    }
  }

  // Letter spacing
  const ls = node.letterSpacing;
  if (ls !== figma.mixed && ls) {
    if (ls.unit === 'PIXELS') {
      styles.letterSpacing = toCssValue(ls.value);
    } else if (ls.unit === 'PERCENT') {
      // Convert percentage to em (Figma's 100% = 1em)
      const emValue = Math.round((ls.value / 100) * 100) / 100;
      styles.letterSpacing = `${emValue}em`;
    }
  }

  // Text transform
  const textCase = node.textCase;
  if (textCase !== figma.mixed) {
    styles.textTransform = mapTextCase(textCase as string);
  }

  // Text alignment
  const textAlign = node.textAlignHorizontal;
  if (textAlign) {
    styles.textAlign = mapTextAlign(textAlign);
  }

  // Text decoration (underline / line-through / none)
  const td = (node as any).textDecoration;
  if (td !== undefined && td !== figma.mixed) {
    if (td === 'UNDERLINE') styles.textDecoration = 'underline';
    else if (td === 'STRIKETHROUGH') styles.textDecoration = 'line-through';
    else styles.textDecoration = null;
  }

  // Color
  styles.color = extractTextColor(node);

  // Text-shadow from DROP_SHADOW effects on TEXT nodes
  const effects = extractEffects(node);
  if (effects.textShadow) styles.textShadow = effects.textShadow;

  // Figma Text Style reference (design token for typography)
  const styleName = extractTextStyleName(node);
  if (styleName) styles.textStyleName = styleName;

  // Styled text segments — only when the text has mixed inline styles
  const segments = extractTextSegments(node);
  if (segments) styles.textSegments = segments;

  return styles;
}

/**
 * Extract the bound Figma Text Style name (e.g. "Heading/H2").
 * Returns null when the text node has no style binding, or the binding is mixed.
 */
export function extractTextStyleName(node: TextNode): string | null {
  try {
    const id = (node as any).textStyleId;
    if (!id || id === figma.mixed || typeof id !== 'string') return null;
    const style = figma.getStyleById(id);
    return style?.name || null;
  } catch {
    return null;
  }
}

/**
 * Extract styled text segments so inline formatting (bold word, colored span,
 * underlined link inside a paragraph) survives the export. Returns null when
 * the text has no mixed styles — in that case the element-level typography
 * already describes the whole text uniformly.
 */
export function extractTextSegments(node: TextNode): TextSegment[] | null {
  if (!node.characters) return null;
  try {
    const getSegments = (node as any).getStyledTextSegments;
    if (typeof getSegments !== 'function') return null;
    const raw = getSegments.call(node, ['fontName', 'fontSize', 'fills', 'textDecoration']);
    if (!raw || !Array.isArray(raw) || raw.length <= 1) return null;

    const segments: TextSegment[] = raw.map((s: any) => {
      const seg: TextSegment = { text: s.characters || '' };
      if (s.fontName && typeof s.fontName === 'object') {
        seg.fontFamily = s.fontName.family;
        seg.fontWeight = fontWeightFromStyle(s.fontName.style);
        if (s.fontName.style.toLowerCase().includes('italic')) seg.italic = true;
      }
      if (typeof s.fontSize === 'number') seg.fontSize = s.fontSize;
      if (Array.isArray(s.fills)) {
        for (const f of s.fills) {
          if (f.type === 'SOLID' && f.visible !== false) {
            seg.color = rgbToHex(f.color);
            break;
          }
        }
      }
      if (s.textDecoration === 'UNDERLINE') seg.textDecoration = 'underline';
      else if (s.textDecoration === 'STRIKETHROUGH') seg.textDecoration = 'line-through';
      return seg;
    });

    // If every segment's styling is identical, the segmentation adds nothing.
    const first = segments[0];
    const allSame = segments.every(s =>
      s.fontFamily === first.fontFamily &&
      s.fontWeight === first.fontWeight &&
      s.fontSize === first.fontSize &&
      s.color === first.color &&
      s.italic === first.italic &&
      s.textDecoration === first.textDecoration
    );
    return allSame ? null : segments;
  } catch {
    return null;
  }
}

/**
 * Collect all unique font usage data from a node tree.
 */
export function collectFonts(root: SceneNode): Record<string, { styles: Set<string>; sizes: Set<number>; count: number }> {
  const fonts: Record<string, { styles: Set<string>; sizes: Set<number>; count: number }> = {};

  function walk(node: SceneNode) {
    if (node.type === 'TEXT') {
      const fontName = node.fontName;
      if (fontName !== figma.mixed && fontName) {
        const family = fontName.family;
        if (!fonts[family]) {
          fonts[family] = { styles: new Set(), sizes: new Set(), count: 0 };
        }
        fonts[family].styles.add(fontName.style);
        fonts[family].count++;

        const fontSize = node.fontSize;
        if (fontSize !== figma.mixed && typeof fontSize === 'number') {
          fonts[family].sizes.add(fontSize);
        }
      }
    }
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        walk(child);
      }
    }
  }

  walk(root);
  return fonts;
}

/**
 * Count TEXT nodes in a subtree.
 */
export function countTextNodes(root: SceneNode): number {
  let count = 0;
  function walk(node: SceneNode) {
    if (node.type === 'TEXT') count++;
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        walk(child);
      }
    }
  }
  walk(root);
  return count;
}
