import { SectionSpec, SectionStyles, ElementStyles, OverlapInfo, LayerInfo, CompositionInfo, FormFieldInfo, TextContentEntry, ComponentInstanceInfo } from './types';
import { toCssValue, toLayoutName, screenshotFilename, computeAspectRatio, isDefaultLayerName } from './utils';
import { extractBackgroundColor, extractGradient, hasImageFill, extractBorderStyle, extractBorderWidths, extractStrokeColor } from './color';
import { extractTypography } from './typography';
import { extractAutoLayoutSpacing, extractAbsoluteSpacing } from './spacing';
import { detectGrid } from './grid';
import { extractInteractions } from './interactions';
import { extractEffects } from './effects';
import { toCssCustomProperty } from './variables';
import {
  detectRepeaters, detectComponentPatterns, detectNavigation,
  inferSectionType, normalizeSectionName, classifyGlobalRole,
} from './patterns';
import { rgbToHex } from './color';

/**
 * Identify section frames within a page frame.
 * Sections are the direct children of the page frame, sorted by Y position.
 * If the frame has a single wrapper child, drill one level deeper.
 */
function identifySections(pageFrame: FrameNode): SceneNode[] {
  let candidates = pageFrame.children.filter(c =>
    c.visible !== false &&
    (c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE' || c.type === 'GROUP')
  );

  // If there's a single container child, drill one level deeper
  if (candidates.length === 1 && 'children' in candidates[0]) {
    const wrapper = candidates[0] as FrameNode;
    const innerCandidates = wrapper.children.filter(c =>
      c.visible !== false &&
      (c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE' || c.type === 'GROUP')
    );
    if (innerCandidates.length > 1) {
      candidates = innerCandidates;
    }
  }

  // Sort by Y position (top to bottom)
  return [...candidates].sort((a, b) => {
    const aY = a.absoluteBoundingBox?.y ?? 0;
    const bY = b.absoluteBoundingBox?.y ?? 0;
    return aY - bY;
  });
}

/**
 * Extract section-level styles from a frame.
 */
function extractSectionStyles(node: SceneNode): SectionStyles {
  const bg = extractBackgroundColor(node as any);
  const gradient = extractGradient(node as any);
  const bounds = node.absoluteBoundingBox;
  const effects = extractEffects(node as any);
  const corners = extractPerCornerRadius(node as any);

  const styles: SectionStyles = {
    paddingTop: null,  // Set by spacing extractor
    paddingBottom: null,
    paddingLeft: null,
    paddingRight: null,
    backgroundColor: bg,
    backgroundImage: hasImageFill(node as any) ? 'url(...)' : null,
    backgroundGradient: gradient,
    minHeight: bounds ? toCssValue(bounds.height) : null,
    overflow: null,
    boxShadow: effects.boxShadow,
    filter: effects.filter,
    backdropFilter: effects.backdropFilter,
  };
  if (corners) {
    if (corners.uniform !== null) {
      styles.borderRadius = toCssValue(corners.uniform);
    } else {
      styles.borderTopLeftRadius = toCssValue(corners.topLeft);
      styles.borderTopRightRadius = toCssValue(corners.topRight);
      styles.borderBottomLeftRadius = toCssValue(corners.bottomLeft);
      styles.borderBottomRightRadius = toCssValue(corners.bottomRight);
    }
  }
  applyStrokes(styles, node);
  if ('opacity' in node && typeof (node as any).opacity === 'number' && (node as any).opacity < 1) {
    styles.opacity = Math.round((node as any).opacity * 100) / 100;
  }
  return styles;
}

/**
 * Extract per-corner border-radius from a node. Figma stores
 * topLeftRadius / topRightRadius / bottomLeftRadius / bottomRightRadius
 * as individual properties on RectangleNode and FrameNode. When the
 * uniform cornerRadius is a number, all four are equal.
 * Returns null if the node has no corner data.
 */
function extractPerCornerRadius(node: any): {
  topLeft: number; topRight: number; bottomLeft: number; bottomRight: number; uniform: number | null;
} | null {
  const n = node as any;
  const cr = n.cornerRadius;
  const tl = typeof n.topLeftRadius === 'number' ? n.topLeftRadius : null;
  const tr = typeof n.topRightRadius === 'number' ? n.topRightRadius : null;
  const bl = typeof n.bottomLeftRadius === 'number' ? n.bottomLeftRadius : null;
  const br = typeof n.bottomRightRadius === 'number' ? n.bottomRightRadius : null;

  if (typeof cr === 'number' && tl === null) {
    // Uniform corners (or cornerRadius is the mixed symbol)
    if (cr === 0) return null;
    return { topLeft: cr, topRight: cr, bottomLeft: cr, bottomRight: cr, uniform: cr };
  }
  if (tl !== null || tr !== null || bl !== null || br !== null) {
    return {
      topLeft: tl || 0,
      topRight: tr || 0,
      bottomLeft: bl || 0,
      bottomRight: br || 0,
      uniform: (tl === tr && tr === bl && bl === br) ? (tl || 0) : null,
    };
  }
  return null;
}

/**
 * Apply per-corner radius. If all 4 are equal, emit borderRadius shorthand;
 * otherwise emit the 4 explicit values. Works on ElementStyles or SectionStyles.
 */
function applyRadius(elem: Partial<ElementStyles> & Partial<SectionStyles>, node: any): void {
  const corners = extractPerCornerRadius(node);
  if (!corners) return;
  if (corners.uniform !== null) {
    elem.borderRadius = toCssValue(corners.uniform);
    return;
  }
  elem.borderTopLeftRadius = toCssValue(corners.topLeft);
  elem.borderTopRightRadius = toCssValue(corners.topRight);
  elem.borderBottomLeftRadius = toCssValue(corners.bottomLeft);
  elem.borderBottomRightRadius = toCssValue(corners.bottomRight);
}

/**
 * Apply strokes: per-side border-width when Figma has individualStrokeWeights,
 * single borderWidth otherwise. Also maps style (solid/dashed/dotted) and
 * color. Works on ElementStyles or SectionStyles.
 */
function applyStrokes(elem: Partial<ElementStyles> & Partial<SectionStyles>, node: any): void {
  const color = extractStrokeColor(node);
  const widths = extractBorderWidths(node);
  const style = extractBorderStyle(node);
  if (!color) return;

  if (widths.uniform !== null) {
    elem.borderWidth = toCssValue(widths.uniform);
    elem.borderColor = color;
    elem.borderStyle = style;
    return;
  }
  if (widths.top || widths.right || widths.bottom || widths.left) {
    if (widths.top) elem.borderTopWidth = toCssValue(widths.top);
    if (widths.right) elem.borderRightWidth = toCssValue(widths.right);
    if (widths.bottom) elem.borderBottomWidth = toCssValue(widths.bottom);
    if (widths.left) elem.borderLeftWidth = toCssValue(widths.left);
    elem.borderColor = color;
    elem.borderStyle = style;
  }
}

/**
 * Extract object-position from an image fill's imageTransform (crop offset).
 * Figma's imageTransform is a 2x3 affine matrix. When the image has been
 * cropped/repositioned in Figma, the translation components tell us the
 * focal point. Map to CSS object-position / background-position.
 *
 * Returns null when the image is centered (default), or when node has no
 * imageTransform data.
 */
function extractObjectPosition(node: any): string | null {
  if (!node.fills || !Array.isArray(node.fills)) return null;
  const imgFill = node.fills.find((f: Paint) => f.type === 'IMAGE' && f.visible !== false) as ImagePaint | undefined;
  if (!imgFill) return null;
  const t = (imgFill as any).imageTransform as number[][] | undefined;
  if (!t || !Array.isArray(t) || t.length < 2) return null;
  // imageTransform is a 2x3 matrix: [[a, b, tx], [c, d, ty]]
  // tx/ty are normalized (0..1) translation — 0 = left/top, 0.5 = center
  const tx = t[0] && typeof t[0][2] === 'number' ? t[0][2] : 0.5;
  const ty = t[1] && typeof t[1][2] === 'number' ? t[1][2] : 0.5;
  // Default (centered) → null (browser uses "50% 50%" by default)
  if (Math.abs(tx - 0.5) < 0.01 && Math.abs(ty - 0.5) < 0.01) return null;
  const xPct = Math.round(tx * 100);
  const yPct = Math.round(ty * 100);
  return `${xPct}% ${yPct}%`;
}

/**
 * Extract transform (rotation + scale) from a node's relativeTransform.
 * Figma's relativeTransform is a 2x3 matrix — we decompose it to rotation
 * and scale when they're non-identity.
 */
function extractTransform(node: any): { transform: string | null } {
  const rt = node.relativeTransform as number[][] | undefined;
  if (!rt || !Array.isArray(rt) || rt.length < 2) return { transform: null };
  // Extract rotation from the matrix: angle = atan2(m[1][0], m[0][0])
  const a = rt[0][0], b = rt[0][1], c = rt[1][0], d = rt[1][1];
  const radians = Math.atan2(c, a);
  const degrees = Math.round((radians * 180) / Math.PI);
  const scaleX = Math.sqrt(a * a + c * c);
  const scaleY = Math.sqrt(b * b + d * d);

  const parts: string[] = [];
  if (Math.abs(degrees) > 0.5) parts.push(`rotate(${degrees}deg)`);
  if (Math.abs(scaleX - 1) > 0.02) parts.push(`scaleX(${Math.round(scaleX * 100) / 100})`);
  if (Math.abs(scaleY - 1) > 0.02) parts.push(`scaleY(${Math.round(scaleY * 100) / 100})`);

  return { transform: parts.length > 0 ? parts.join(' ') : null };
}

/**
 * Extract flex-grow / flex-basis / align-self for auto-layout children.
 * Figma's layoutGrow is 0 or 1; layoutAlign is INHERIT / STRETCH / MIN / CENTER / MAX.
 */
function extractFlexChildProps(node: any): Partial<ElementStyles> {
  const out: Partial<ElementStyles> = {};
  if (typeof node.layoutGrow === 'number') {
    out.flexGrow = node.layoutGrow;
  }
  if (node.layoutAlign) {
    switch (node.layoutAlign) {
      case 'STRETCH': out.alignSelf = 'stretch'; break;
      case 'MIN': out.alignSelf = 'flex-start'; break;
      case 'CENTER': out.alignSelf = 'center'; break;
      case 'MAX': out.alignSelf = 'flex-end'; break;
      default: break;
    }
  }
  return out;
}

/**
 * Compute per-side margin for a node based on sibling positions in its
 * parent container. Returns only the sides that have a clear non-zero
 * margin (previous sibling on top, next sibling below, parent bounds for
 * left/right when parent width is known).
 */
function extractPerSideMargins(node: SceneNode): Partial<ElementStyles> {
  const out: Partial<ElementStyles> = {};
  if (!node.absoluteBoundingBox || !node.parent || !('children' in node.parent)) return out;

  const siblings = (node.parent as FrameNode).children;
  const idx = siblings.indexOf(node);
  const bb = node.absoluteBoundingBox;

  // Bottom: gap to next sibling
  if (idx >= 0 && idx < siblings.length - 1) {
    const next = siblings[idx + 1];
    if (next.absoluteBoundingBox) {
      const gap = next.absoluteBoundingBox.y - (bb.y + bb.height);
      if (gap > 0) out.marginBottom = toCssValue(Math.round(gap));
    }
  }

  // Top: gap to previous sibling (for absolute-position layouts)
  if (idx > 0) {
    const prev = siblings[idx - 1];
    if (prev.absoluteBoundingBox) {
      const gap = bb.y - (prev.absoluteBoundingBox.y + prev.absoluteBoundingBox.height);
      if (gap > 0) out.marginTop = toCssValue(Math.round(gap));
    }
  }

  // Left/right: inset from parent edges
  const parentBB = (node.parent as FrameNode).absoluteBoundingBox;
  if (parentBB) {
    const leftGap = bb.x - parentBB.x;
    const rightGap = (parentBB.x + parentBB.width) - (bb.x + bb.width);
    // Only emit when element is not centered (significant asymmetric margin)
    if (Math.abs(leftGap - rightGap) > 8 && leftGap > 0) {
      out.marginLeft = toCssValue(Math.round(leftGap));
    }
    if (Math.abs(leftGap - rightGap) > 8 && rightGap > 0) {
      out.marginRight = toCssValue(Math.round(rightGap));
    }
  }

  return out;
}

/**
 * Extract prototype navigation URL for a node. Figma supports
 * OPEN_URL actions in reactions — map to linkUrl.
 */
function extractLinkUrl(node: any): string | null {
  const reactions = node.reactions;
  if (!reactions || !Array.isArray(reactions)) return null;
  for (const r of reactions) {
    const actions = r.actions || (r.action ? [r.action] : []);
    for (const a of actions) {
      if (a && a.type === 'URL' && a.url) return a.url;
    }
  }
  return null;
}

/**
 * Extract Figma sizing modes (Hug / Fill / Fixed). These tell the agent
 * whether an element should be width:auto, width:100%, or a fixed px size —
 * critical for correct responsive behavior. Returns null for each axis when
 * the mode is missing (older Figma versions, non-auto-layout contexts).
 */
function extractSizingModes(node: any): { widthMode: 'hug'|'fill'|'fixed'|null; heightMode: 'hug'|'fill'|'fixed'|null } {
  const map = (m: string | undefined): 'hug'|'fill'|'fixed'|null => {
    if (m === 'HUG') return 'hug';
    if (m === 'FILL') return 'fill';
    if (m === 'FIXED') return 'fixed';
    return null;
  };
  return {
    widthMode: map(node.layoutSizingHorizontal),
    heightMode: map(node.layoutSizingVertical),
  };
}

/**
 * Extract Figma Variable bindings on a node's properties. Returns CSS custom
 * property references (e.g. "var(--clr-primary)") keyed by CSS property name.
 * When variables are bound, the agent should emit these references instead
 * of the resolved raw hex/px values so token changes in Figma propagate.
 */
function extractBoundVariables(node: any): Record<string, string> | null {
  const bv = node.boundVariables;
  if (!bv || typeof bv !== 'object') return null;
  if (!figma.variables || typeof (figma.variables as any).getVariableById !== 'function') return null;

  const out: Record<string, string> = {};

  const resolve = (alias: any): string | null => {
    if (!alias || !alias.id) return null;
    try {
      const v = (figma.variables as any).getVariableById(alias.id);
      if (!v) return null;
      let colName = '';
      try {
        const col = (figma.variables as any).getVariableCollectionById?.(v.variableCollectionId);
        colName = col?.name || '';
      } catch {}
      return `var(${toCssCustomProperty(v.name, colName)})`;
    } catch {
      return null;
    }
  };

  if (Array.isArray(bv.fills) && bv.fills[0]) {
    const ref = resolve(bv.fills[0]);
    if (ref) out[node.type === 'TEXT' ? 'color' : 'backgroundColor'] = ref;
  }
  if (Array.isArray(bv.strokes) && bv.strokes[0]) {
    const ref = resolve(bv.strokes[0]);
    if (ref) out.borderColor = ref;
  }
  const numericMap: Record<string, string> = {
    paddingTop: 'paddingTop', paddingBottom: 'paddingBottom',
    paddingLeft: 'paddingLeft', paddingRight: 'paddingRight',
    itemSpacing: 'gap',
    cornerRadius: 'borderRadius',
    topLeftRadius: 'borderTopLeftRadius', topRightRadius: 'borderTopRightRadius',
    bottomLeftRadius: 'borderBottomLeftRadius', bottomRightRadius: 'borderBottomRightRadius',
    strokeWeight: 'borderWidth',
    fontSize: 'fontSize', lineHeight: 'lineHeight', letterSpacing: 'letterSpacing',
  };
  for (const [figmaKey, cssKey] of Object.entries(numericMap)) {
    if (bv[figmaKey]) {
      const ref = resolve(bv[figmaKey]);
      if (ref) out[cssKey] = ref;
    }
  }

  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Extract component-instance metadata: main component name + variant
 * / boolean / text properties. Returns null for non-instance nodes.
 * This is the key signal the agent uses to dedupe repeated cards, buttons,
 * and icons into shared ACF blocks instead of inlining each one.
 */
function extractComponentInstance(node: SceneNode): ComponentInstanceInfo | null {
  if (node.type !== 'INSTANCE') return null;
  try {
    const inst = node as InstanceNode;
    let name = inst.name;
    try {
      const main = inst.mainComponent;
      if (main) {
        name = main.parent?.type === 'COMPONENT_SET' ? (main.parent as any).name : main.name;
      }
    } catch {}
    const properties: Record<string, string | boolean | number> = {};
    const props = (inst as any).componentProperties;
    if (props && typeof props === 'object') {
      for (const [key, val] of Object.entries(props)) {
        const v = (val as any)?.value;
        if (typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number') {
          properties[key] = v;
        }
      }
    }
    return { name, properties };
  } catch {
    return null;
  }
}

/**
 * Extract alt text for an image. Source priority: component description
 * (for INSTANCE / COMPONENT nodes) → humanized layer name. Returns empty
 * string when the layer is named generically (Rectangle 12, Image 3, etc.).
 */
function extractAltText(node: SceneNode): string {
  try {
    if (node.type === 'INSTANCE') {
      const main = (node as InstanceNode).mainComponent;
      if (main && main.description && main.description.trim()) return main.description.trim();
    }
    if (node.type === 'COMPONENT') {
      const desc = (node as ComponentNode).description;
      if (desc && desc.trim()) return desc.trim();
    }
  } catch {}
  if (!node.name || isDefaultLayerName(node.name)) return '';
  return node.name.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Map Figma's IMAGE fill scaleMode to CSS object-fit.
 *   FILL (default) → cover
 *   FIT            → contain (image visible in full, letterbox if needed)
 *   CROP           → cover (object-position handled separately via imageTransform)
 *   TILE           → cover (no direct CSS equivalent)
 */
function getImageObjectFit(node: any): string {
  if (!node.fills || !Array.isArray(node.fills)) return 'cover';
  const imgFill = node.fills.find((f: Paint) => f.type === 'IMAGE' && f.visible !== false) as ImagePaint | undefined;
  if (!imgFill) return 'cover';
  switch (imgFill.scaleMode) {
    case 'FIT': return 'contain';
    case 'FILL':
    case 'CROP':
    case 'TILE':
    default: return 'cover';
  }
}

/**
 * Apply the shared optional-signal fields (componentInstance, widthMode,
 * heightMode, varBindings) to an element. Centralized so every element
 * kind (text, image, button, input) benefits consistently.
 */
function applyCommonSignals(elem: Partial<ElementStyles>, node: SceneNode): void {
  const cmp = extractComponentInstance(node);
  if (cmp) elem.componentInstance = cmp;

  const size = extractSizingModes(node);
  if (size.widthMode) elem.widthMode = size.widthMode;
  if (size.heightMode) elem.heightMode = size.heightMode;

  const vars = extractBoundVariables(node);
  if (vars) elem.varBindings = vars;
}

/**
 * Read node.opacity and return it when below 1 (rounded to 2 decimals).
 * Returns null for fully opaque nodes or when the property is absent.
 */
function extractOpacity(node: any): number | null {
  if (!('opacity' in node) || typeof node.opacity !== 'number') return null;
  if (node.opacity >= 1) return null;
  return Math.round(node.opacity * 100) / 100;
}

/**
 * Decide whether a non-text, non-image, non-button, non-input frame carries
 * enough visual styling (fill, stroke, radius, shadow, reduced opacity) to
 * warrant being emitted as a container element. Plain structural wrappers
 * with no styling return false so we don't flood output with empty entries.
 */
function hasContainerStyling(node: SceneNode): boolean {
  const n = node as any;
  if (extractBackgroundColor(n)) return true;
  if (extractGradient(n)) return true;
  if (extractStrokeColor(n)) return true;
  const corners = extractPerCornerRadius(n);
  if (corners) return true;
  const fx = extractEffects(n);
  if (fx.boxShadow || fx.filter || fx.backdropFilter) return true;
  if (extractOpacity(n) !== null) return true;
  return false;
}

/**
 * Walk an icon subtree to find its primary SOLID fill color. Used to
 * suggest a CSS color for the inlined SVG (the agent can override with
 * `currentColor` if it wants the icon to inherit). Returns null when no
 * solid fill is found.
 */
function findFirstSolidFillColor(node: SceneNode): string | null {
  const fills = (node as any).fills;
  if (Array.isArray(fills)) {
    for (const f of fills) {
      if (f && f.type === 'SOLID' && f.visible !== false && f.color) {
        return rgbToHex(f.color);
      }
    }
  }
  if ('children' in node) {
    for (const child of (node as FrameNode).children) {
      if (child.visible === false) continue;
      const c = findFirstSolidFillColor(child);
      if (c) return c;
    }
  }
  return null;
}

/**
 * Build an element entry for an icon node. Encodes the SVG filename so
 * the agent knows which file to inline, plus dimensions, alt text, and
 * a suggested fill color.
 */
function buildIconElement(node: SceneNode, filename: string): Partial<ElementStyles> {
  const bb = node.absoluteBoundingBox;
  const elem: Partial<ElementStyles> = {
    iconFile: filename,
    width: bb ? toCssValue(Math.round(bb.width)) : null,
    height: bb ? toCssValue(Math.round(bb.height)) : null,
  };
  const color = findFirstSolidFillColor(node);
  if (color) elem.color = color;
  const alt = extractAltText(node);
  if (alt) elem.alt = alt;
  Object.assign(elem, extractFlexChildProps(node as any));
  applyCommonSignals(elem, node);
  const op = extractOpacity(node);
  if (op !== null) elem.opacity = op;
  const tx = extractTransform(node as any);
  if (tx.transform) elem.transform = tx.transform;
  const href = extractLinkUrl(node as any);
  if (href) elem.linkUrl = href;
  return elem;
}

/**
 * Find and classify all meaningful elements within a section.
 * Walks the node tree and extracts typography for TEXT nodes,
 * dimensions for image containers, etc.
 */
function extractElements(
  sectionNode: SceneNode,
  iconMap: Map<string, string>,
): Record<string, Partial<ElementStyles>> {
  const elements: Record<string, Partial<ElementStyles>> = {};
  let textIndex = 0;
  let imageIndex = 0;
  let iconIndex = 0;

  function walk(node: SceneNode, depth: number) {
    // Icon roots → emit iconFile reference and stop. iconMap is built by
    // icon-detector and shared with image-exporter, so the filename here
    // matches exactly what gets written into pages/<slug>/images/.
    const iconFilename = iconMap.get(node.id);
    if (iconFilename) {
      const cleanName = node.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const role = cleanName && !/^(vector|icon|frame|group|rectangle|ellipse|boolean)\d*$/.test(cleanName)
        ? cleanName
        : `icon${iconIndex > 0 ? '_' + iconIndex : ''}`;
      if (!elements[role]) {
        elements[role] = buildIconElement(node, iconFilename);
      }
      iconIndex++;
      return; // don't descend into the icon's vector children
    }

    // TEXT nodes → typography + text content
    if (node.type === 'TEXT') {
      const typo = extractTypography(node);
      const fontSize = node.fontSize !== figma.mixed ? (node.fontSize as number) : 16;

      // Classify by role: headings are larger, body text is smaller
      let role: string;
      if (textIndex === 0 && fontSize >= 28) {
        role = 'heading';
      } else if (textIndex === 1 && fontSize >= 16) {
        role = 'subheading';
      } else if (node.name.toLowerCase().includes('button') || node.name.toLowerCase().includes('cta')) {
        role = 'button_text';
      } else if (node.name.toLowerCase().includes('caption') || fontSize <= 14) {
        role = `caption${textIndex > 2 ? '_' + textIndex : ''}`;
      } else {
        role = `text_${textIndex}`;
      }

      // Use the layer name if it's not a default name
      const cleanName = node.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (cleanName && !/^(text|frame|group|rectangle)\d*$/.test(cleanName)) {
        role = cleanName;
      }

      // Extract actual text content for content population and context
      typo.textContent = node.characters || null;

      // Per-side margins from sibling spacing (top/right/bottom/left)
      Object.assign(typo, extractPerSideMargins(node));

      // Flex-child properties (layoutGrow / layoutAlign)
      Object.assign(typo, extractFlexChildProps(node));

      // Transform (rotate/scale) if non-identity
      const tx = extractTransform(node);
      if (tx.transform) typo.transform = tx.transform;

      // Link URL from prototype navigation
      const href = extractLinkUrl(node);
      if (href) typo.linkUrl = href;

      // Max width if constrained
      if (node.absoluteBoundingBox && node.parent?.type === 'FRAME') {
        const parentWidth = (node.parent as FrameNode).absoluteBoundingBox?.width;
        if (parentWidth && node.absoluteBoundingBox.width < parentWidth * 0.9) {
          typo.maxWidth = toCssValue(Math.round(node.absoluteBoundingBox.width));
        }
      }

      // Common signals: componentInstance, sizing modes, bound variables
      applyCommonSignals(typo, node);

      const textOpacity = extractOpacity(node);
      if (textOpacity !== null) typo.opacity = textOpacity;

      elements[role] = typo;
      textIndex++;
    }

    // IMAGE fills → image element (with smart background detection)
    if (hasImageFill(node as any) && node.absoluteBoundingBox) {
      const bounds = node.absoluteBoundingBox;

      // Smart background image detection:
      // 1. Layer name contains 'background' or 'bg' OR
      // 2. Image spans >= 90% of the section's width AND height (full-bleed image)
      const nameHintsBg = node.name.toLowerCase().includes('background') || node.name.toLowerCase().includes('bg');
      const sectionBounds = sectionNode.absoluteBoundingBox;
      const spansSection = sectionBounds &&
        bounds.width >= sectionBounds.width * 0.9 &&
        bounds.height >= sectionBounds.height * 0.9;

      const isBackgroundImage = nameHintsBg || spansSection;

      const role = isBackgroundImage
        ? 'background_image'
        : `image${imageIndex > 0 ? '_' + imageIndex : ''}`;

      const cleanName = node.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const finalRole = cleanName && !/^(image|rectangle|frame)\d*$/.test(cleanName) ? cleanName : role;

      // Detect mask/clip on image or its parent container
      const parentFrame = node.parent;
      const parentClips = parentFrame && 'clipsContent' in parentFrame && (parentFrame as any).clipsContent === true;
      const isMasked = ('isMask' in node && (node as any).isMask === true) || parentClips;
      // Detect circular/rounded clips: if parent has equal cornerRadius and is roughly square
      let clipBorderRadius: string | null = 'cornerRadius' in node && typeof (node as any).cornerRadius === 'number'
        ? toCssValue((node as any).cornerRadius)
        : null;
      if (!clipBorderRadius && parentFrame && 'cornerRadius' in parentFrame && typeof (parentFrame as any).cornerRadius === 'number') {
        const parentCorner = (parentFrame as any).cornerRadius as number;
        if (parentCorner > 0) {
          const parentBounds = (parentFrame as any).absoluteBoundingBox;
          // If parent is roughly square and cornerRadius >= half the width → circle
          if (parentBounds && Math.abs(parentBounds.width - parentBounds.height) < 5 && parentCorner >= parentBounds.width / 2 - 2) {
            clipBorderRadius = '50%';
          } else {
            clipBorderRadius = toCssValue(parentCorner);
          }
        }
      }

      const imgEffects = extractEffects(node as any);
      const imgObjectPosition = extractObjectPosition(node);
      const imgCorners = extractPerCornerRadius(node as any);
      const imgElem: Partial<ElementStyles> = {
        width: isBackgroundImage ? '100%' : toCssValue(Math.round(bounds.width)),
        height: isBackgroundImage ? '100%' : 'auto',
        aspectRatio: isBackgroundImage ? null : computeAspectRatio(bounds.width, bounds.height),
        objectFit: getImageObjectFit(node as any),
        objectPosition: imgObjectPosition,
        overflow: (parentClips || clipBorderRadius) ? 'hidden' : null,
        hasMask: isMasked || null,
        boxShadow: imgEffects.boxShadow,
        filter: imgEffects.filter,
        // Mark background images with position data so agents know to use CSS background-image
        position: isBackgroundImage ? 'absolute' : null,
        top: isBackgroundImage ? '0px' : null,
        left: isBackgroundImage ? '0px' : null,
        zIndex: isBackgroundImage ? 0 : null,
      };
      const imgAlt = extractAltText(node);
      if (imgAlt) imgElem.alt = imgAlt;
      applyCommonSignals(imgElem, node);
      // Apply radius — per-corner if node has differing corners, uniform otherwise
      if (imgCorners) {
        if (imgCorners.uniform !== null) {
          imgElem.borderRadius = toCssValue(imgCorners.uniform);
        } else {
          imgElem.borderTopLeftRadius = toCssValue(imgCorners.topLeft);
          imgElem.borderTopRightRadius = toCssValue(imgCorners.topRight);
          imgElem.borderBottomLeftRadius = toCssValue(imgCorners.bottomLeft);
          imgElem.borderBottomRightRadius = toCssValue(imgCorners.bottomRight);
        }
      } else if (clipBorderRadius) {
        imgElem.borderRadius = clipBorderRadius;
      }
      // Flex-child props if image is inside an auto-layout row
      Object.assign(imgElem, extractFlexChildProps(node));
      const imgOpacity = extractOpacity(node);
      if (imgOpacity !== null) imgElem.opacity = imgOpacity;
      elements[finalRole] = imgElem;
      imageIndex++;
    }

    // Button-like frames (small frames with text + fill)
    if ((node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') &&
        node.name.toLowerCase().includes('button') || node.name.toLowerCase().includes('btn') || node.name.toLowerCase().includes('cta')) {
      const frame = node as FrameNode;
      const bg = extractBackgroundColor(frame);
      const bounds = frame.absoluteBoundingBox;

      if (bg && bounds) {
        const buttonStyles: Partial<ElementStyles> = {
          backgroundColor: bg,
        };

        if (frame.layoutMode && frame.layoutMode !== 'NONE') {
          buttonStyles.paddingTop = toCssValue(frame.paddingTop);
          buttonStyles.paddingBottom = toCssValue(frame.paddingBottom);
          buttonStyles.paddingLeft = toCssValue(frame.paddingLeft);
          buttonStyles.paddingRight = toCssValue(frame.paddingRight);
        }

        applyRadius(buttonStyles, frame);
        applyStrokes(buttonStyles, frame);
        const btnEffects = extractEffects(frame as any);
        if (btnEffects.boxShadow) buttonStyles.boxShadow = btnEffects.boxShadow;
        if (btnEffects.filter) buttonStyles.filter = btnEffects.filter;

        const tx = extractTransform(frame as any);
        if (tx.transform) buttonStyles.transform = tx.transform;

        // Link URL from prototype OPEN_URL action
        const href = extractLinkUrl(frame);
        if (href) buttonStyles.linkUrl = href;

        // Find the text node inside the button for typography
        const textChild = findFirstTextNode(frame);
        if (textChild) {
          const typo = extractTypography(textChild);
          Object.assign(buttonStyles, typo);
          buttonStyles.textContent = textChild.characters || null;
        }

        Object.assign(buttonStyles, extractFlexChildProps(frame as any));

        // Common signals: componentInstance (button variants!), sizing, vars
        applyCommonSignals(buttonStyles, frame);

        const btnOpacity = extractOpacity(frame);
        if (btnOpacity !== null) buttonStyles.opacity = btnOpacity;

        const cleanName = node.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        elements[cleanName || 'button'] = buttonStyles;
      }
      return; // Don't recurse into button internals
    }

    // Input-like frames (detect inputs by common layer names)
    if ((node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') &&
        /\b(input|field|textbox|textarea|select|textfield)\b/i.test(node.name)) {
      const frame = node as FrameNode;
      const inputStyles: Partial<ElementStyles> = {
        backgroundColor: extractBackgroundColor(frame),
      };
      if (frame.layoutMode && frame.layoutMode !== 'NONE') {
        inputStyles.paddingTop = toCssValue(frame.paddingTop);
        inputStyles.paddingBottom = toCssValue(frame.paddingBottom);
        inputStyles.paddingLeft = toCssValue(frame.paddingLeft);
        inputStyles.paddingRight = toCssValue(frame.paddingRight);
      }
      applyRadius(inputStyles, frame);
      applyStrokes(inputStyles, frame);
      const placeholderText = findFirstTextNode(frame);
      if (placeholderText) {
        inputStyles.placeholder = placeholderText.characters || null;
        const placeholderTypo = extractTypography(placeholderText);
        inputStyles.placeholderStyles = {
          color: placeholderTypo.color || null,
          fontSize: placeholderTypo.fontSize || null,
        };
      }
      applyCommonSignals(inputStyles, frame);

      const inputOpacity = extractOpacity(frame);
      if (inputOpacity !== null) inputStyles.opacity = inputOpacity;

      const inputName = node.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'input';
      elements[inputName] = inputStyles;
      return; // Don't recurse into input internals
    }

    // Generic container frames — cards, wrappers, tiles etc. Emit styling when
    // the frame has any visual properties (fill, stroke, radius, shadow,
    // opacity < 1). Skip depth 0 (that's the section itself, handled by
    // extractSectionStyles). Still recurse so nested text/images/buttons are
    // captured as separate elements.
    if (depth > 0 &&
        (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT' || node.type === 'GROUP') &&
        !hasImageFill(node as any) &&
        hasContainerStyling(node)) {
      const frame = node as FrameNode;
      const containerStyles: Partial<ElementStyles> = {};

      const bg = extractBackgroundColor(frame);
      if (bg) containerStyles.backgroundColor = bg;
      const gradient = extractGradient(frame);
      if (gradient) containerStyles.backgroundGradient = gradient;

      if (frame.layoutMode && frame.layoutMode !== 'NONE') {
        containerStyles.paddingTop = toCssValue(frame.paddingTop);
        containerStyles.paddingBottom = toCssValue(frame.paddingBottom);
        containerStyles.paddingLeft = toCssValue(frame.paddingLeft);
        containerStyles.paddingRight = toCssValue(frame.paddingRight);
        if (typeof frame.itemSpacing === 'number' && frame.itemSpacing > 0) {
          containerStyles.gap = toCssValue(frame.itemSpacing);
        }
      }

      applyRadius(containerStyles, frame);
      applyStrokes(containerStyles, frame);

      const fx = extractEffects(frame as any);
      if (fx.boxShadow) containerStyles.boxShadow = fx.boxShadow;
      if (fx.filter) containerStyles.filter = fx.filter;
      if (fx.backdropFilter) containerStyles.backdropFilter = fx.backdropFilter;

      const tx = extractTransform(frame as any);
      if (tx.transform) containerStyles.transform = tx.transform;

      const containerOpacity = extractOpacity(frame);
      if (containerOpacity !== null) containerStyles.opacity = containerOpacity;

      Object.assign(containerStyles, extractFlexChildProps(frame as any));
      applyCommonSignals(containerStyles, frame);

      const cleanName = node.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const role = cleanName && !/^(frame|group|rectangle|ellipse)\d*$/.test(cleanName)
        ? cleanName
        : `container_${Object.keys(elements).filter(k => k.startsWith('container_')).length + 1}`;
      if (!elements[role]) {
        elements[role] = containerStyles;
      }
      // Fall through to recursion so nested elements still get extracted.
    }

    // Recurse into children (depth limit 6 to capture deeply nested elements)
    if ('children' in node && depth < 6) {
      for (const child of (node as FrameNode).children) {
        if (child.visible !== false) {
          walk(child, depth + 1);
        }
      }
    }
  }

  walk(sectionNode, 0);
  return elements;
}

/**
 * Find the first TEXT node in a subtree.
 */
function findFirstTextNode(node: SceneNode): TextNode | null {
  if (node.type === 'TEXT') return node;
  if ('children' in node) {
    for (const child of (node as FrameNode).children) {
      const found = findFirstTextNode(child);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Extract layer information for all meaningful children of a section.
 * Returns layers sorted by Figma's layer order (back to front).
 * Bounds are relative to the section's origin, not the canvas.
 */
function extractLayers(
  sectionNode: SceneNode,
  elements: Record<string, Partial<ElementStyles>>,
  iconMap: Map<string, string>,
): LayerInfo[] {
  const layers: LayerInfo[] = [];
  const sectionBounds = sectionNode.absoluteBoundingBox;
  if (!sectionBounds) return layers;

  let layerIndex = 0;

  function walk(node: SceneNode, depth: number) {
    if (!node.absoluteBoundingBox || depth > 6) return;

    const bounds = node.absoluteBoundingBox;
    const relBounds = {
      x: Math.round(bounds.x - sectionBounds!.x),
      y: Math.round(bounds.y - sectionBounds!.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
    };

    let role: LayerInfo['role'] | null = null;
    let name = '';

    if (iconMap.has(node.id)) {
      role = 'icon';
      const cleanName = node.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      name = cleanName && !/^(vector|icon|frame|group|rectangle|ellipse|boolean)\d*$/.test(cleanName)
        ? cleanName
        : `icon_${layerIndex}`;
    } else if (node.type === 'TEXT') {
      role = 'text';
      const cleanName = node.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      name = cleanName && !/^text\d*$/.test(cleanName) ? cleanName : `text_${layerIndex}`;
    } else if (hasImageFill(node as any)) {
      const nameHintsBg = node.name.toLowerCase().includes('background') || node.name.toLowerCase().includes('bg');
      const spansSection = bounds.width >= sectionBounds!.width * 0.9 && bounds.height >= sectionBounds!.height * 0.9;
      role = (nameHintsBg || spansSection) ? 'background_image' : 'image';
      const cleanName = node.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      name = cleanName && !/^(image|rectangle|frame)\d*$/.test(cleanName) ? cleanName : (role === 'background_image' ? 'background_image' : `image_${layerIndex}`);
    } else if (
      (node.name.toLowerCase().includes('button') || node.name.toLowerCase().includes('btn') || node.name.toLowerCase().includes('cta')) &&
      (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT')
    ) {
      role = 'button';
      name = node.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'button';
    }

    if (role) {
      layers.push({
        name,
        role,
        type: node.type,
        bounds: relBounds,
        zIndex: layerIndex,
        overlaps: [], // filled in detectComposition
      });
      layerIndex++;
    }

    // Recurse (skip button and icon internals — icon children are vector
    // paths that already exported as one composed SVG)
    if (role !== 'button' && role !== 'icon' && 'children' in node && depth < 6) {
      for (const child of (node as FrameNode).children) {
        if (child.visible !== false) {
          walk(child, depth + 1);
        }
      }
    }
  }

  if ('children' in sectionNode) {
    for (const child of (sectionNode as FrameNode).children) {
      if (child.visible !== false) {
        walk(child, 0);
      }
    }
  }

  return layers;
}

/**
 * Detect composition patterns: text-over-image, background images, overlay stacking.
 * Two rectangles overlap if they share any area.
 */
function detectComposition(layers: LayerInfo[]): CompositionInfo {
  const composition: CompositionInfo = {
    hasTextOverImage: false,
    hasBackgroundImage: false,
    overlayElements: [],
    stackingOrder: layers.map(l => l.name),
  };

  const bgImageLayers = layers.filter(l => l.role === 'background_image');
  const imageLayers = layers.filter(l => l.role === 'image' || l.role === 'background_image');
  const textLayers = layers.filter(l => l.role === 'text');
  const buttonLayers = layers.filter(l => l.role === 'button');

  if (bgImageLayers.length > 0) {
    composition.hasBackgroundImage = true;
  }

  // Check for bounding box overlaps between text/buttons and images
  for (const textLayer of [...textLayers, ...buttonLayers]) {
    for (const imgLayer of imageLayers) {
      const tb = textLayer.bounds;
      const ib = imgLayer.bounds;

      // Check rectangle overlap
      const overlapsHorizontally = tb.x < ib.x + ib.width && tb.x + tb.width > ib.x;
      const overlapsVertically = tb.y < ib.y + ib.height && tb.y + tb.height > ib.y;

      if (overlapsHorizontally && overlapsVertically) {
        // Text/button overlaps with image
        textLayer.overlaps.push(imgLayer.name);
        imgLayer.overlaps.push(textLayer.name);

        if (!composition.hasTextOverImage) {
          composition.hasTextOverImage = true;
        }

        // Elements with higher zIndex that overlap images are overlays
        if (textLayer.zIndex > imgLayer.zIndex) {
          if (!composition.overlayElements.includes(textLayer.name)) {
            composition.overlayElements.push(textLayer.name);
          }
        }
      }
    }
  }

  // If there's a background image, ALL non-background elements are overlays
  if (composition.hasBackgroundImage) {
    for (const layer of layers) {
      if (layer.role !== 'background_image' && !composition.overlayElements.includes(layer.name)) {
        composition.overlayElements.push(layer.name);
      }
    }
  }

  return composition;
}

/**
 * Detect if a section contains form-like elements.
 * Looks for patterns: input rectangles (narrow height frames), labels (small text near inputs),
 * submit buttons, and common form-related layer names.
 */
function detectFormSection(sectionNode: SceneNode): { isForm: boolean; fields: FormFieldInfo[] } {
  const formKeywords = ['form', 'input', 'field', 'contact', 'subscribe', 'newsletter', 'signup', 'sign-up', 'enquiry', 'inquiry'];
  const inputKeywords = ['input', 'field', 'text-field', 'textfield', 'text_field', 'email', 'phone', 'name', 'message', 'textarea'];
  const submitKeywords = ['submit', 'send', 'button', 'cta', 'btn'];

  const sectionName = sectionNode.name.toLowerCase();
  const nameHintsForm = formKeywords.some(kw => sectionName.includes(kw));

  let inputCount = 0;
  let hasSubmitButton = false;
  const fields: FormFieldInfo[] = [];
  const textNodes: { name: string; text: string; y: number }[] = [];
  const inputNodes: { name: string; y: number; height: number }[] = [];

  function walk(node: SceneNode) {
    const name = node.name.toLowerCase();

    // Detect input-like frames: narrow height (30-60px), wider than tall, with border/fill
    if ((node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT' || node.type === 'RECTANGLE') && node.absoluteBoundingBox) {
      const b = node.absoluteBoundingBox;
      const isInputShape = b.height >= 30 && b.height <= 70 && b.width > b.height * 2;
      const hasInputName = inputKeywords.some(kw => name.includes(kw));

      if (isInputShape && (hasInputName || nameHintsForm)) {
        inputCount++;
        inputNodes.push({ name: node.name, y: b.y, height: b.height });

        // Detect field type from name
        let fieldType: FormFieldInfo['type'] = 'text';
        if (name.includes('email')) fieldType = 'email';
        else if (name.includes('phone') || name.includes('tel')) fieldType = 'phone';
        else if (name.includes('textarea') || name.includes('message') || (b.height > 80)) fieldType = 'textarea';
        else if (name.includes('select') || name.includes('dropdown')) fieldType = 'select';
        else if (name.includes('checkbox') || name.includes('check')) fieldType = 'checkbox';
        else if (name.includes('radio')) fieldType = 'radio';

        fields.push({
          label: node.name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          type: fieldType,
          required: name.includes('required') || name.includes('*'),
        });
      }

      // Detect submit buttons
      if (submitKeywords.some(kw => name.includes(kw)) && b.height >= 30 && b.height <= 70) {
        hasSubmitButton = true;
        if (!fields.find(f => f.type === 'submit')) {
          fields.push({ label: 'Submit', type: 'submit', required: false });
        }
      }
    }

    // Collect text nodes near inputs as potential labels
    if (node.type === 'TEXT' && node.absoluteBoundingBox) {
      textNodes.push({
        name: node.name,
        text: node.characters || '',
        y: node.absoluteBoundingBox.y,
      });
    }

    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        if (child.visible !== false) walk(child);
      }
    }
  }

  walk(sectionNode);

  // Match labels to fields: text node directly above an input (within 30px)
  for (const field of fields) {
    const fieldInput = inputNodes.find(inp => inp.name.toLowerCase().includes(field.label.toLowerCase().replace(/ /g, '_')));
    if (fieldInput) {
      const labelAbove = textNodes.find(t => t.y < fieldInput.y && (fieldInput.y - t.y) < 40);
      if (labelAbove) {
        field.label = labelAbove.text.replace('*', '').trim();
        if (labelAbove.text.includes('*')) field.required = true;
      }
    }
  }

  const isForm = (inputCount >= 2 && hasSubmitButton) || (nameHintsForm && inputCount >= 1);

  return { isForm, fields: isForm ? fields : [] };
}

/**
 * Parse all sections from a page frame and produce SectionSpec objects.
 */
/**
 * Extract every TEXT node in a section in reading order (top-to-bottom,
 * then left-to-right for items on the same row within a 12px tolerance).
 *
 * This is the content source for page-assembler when designers don't name
 * layers consistently. It preserves every visible text from the Figma design
 * so nothing can be silently dropped during ACF population.
 */
function extractTextContentInOrder(sectionNode: SceneNode): TextContentEntry[] {
  const sectionBounds = sectionNode.absoluteBoundingBox;
  if (!sectionBounds) return [];

  type RawText = { node: TextNode; relY: number; relX: number; fontSize: number };
  const collected: RawText[] = [];

  function walk(node: SceneNode, depth: number) {
    if (node.visible === false) return;
    if (depth > 8) return;

    if (node.type === 'TEXT') {
      const t = node as TextNode;
      const chars = t.characters || '';
      if (!chars.trim()) return; // skip empty text nodes
      const bb = t.absoluteBoundingBox;
      if (!bb) return;
      const fs = t.fontSize !== figma.mixed ? (t.fontSize as number) : 16;
      collected.push({
        node: t,
        relY: bb.y - sectionBounds!.y,
        relX: bb.x - sectionBounds!.x,
        fontSize: fs,
      });
      return; // don't recurse into TEXT
    }

    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        walk(child, depth + 1);
      }
    }
  }

  if ('children' in sectionNode) {
    for (const child of (sectionNode as FrameNode).children) {
      walk(child, 0);
    }
  }

  // Reading order: sort by Y (rows), then by X within same row (12px tolerance).
  collected.sort((a, b) => {
    if (Math.abs(a.relY - b.relY) < 12) return a.relX - b.relX;
    return a.relY - b.relY;
  });

  // Role assignment — top-most largest text is 'heading', second is 'subheading',
  // small short texts near buttons are 'button_text', rest are 'body' or 'text_N'.
  let headingAssigned = false;
  let subheadingAssigned = false;

  return collected.map((item, idx) => {
    const text = item.node.characters || '';
    const cleanName = item.node.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const nameHint = cleanName || '';

    let role: string;
    if (nameHint.includes('button') || nameHint.includes('cta') || nameHint.includes('btn')) {
      role = 'button_text';
    } else if (!headingAssigned && item.fontSize >= 28) {
      role = 'heading';
      headingAssigned = true;
    } else if (!subheadingAssigned && item.fontSize >= 18 && item.fontSize < 28) {
      role = 'subheading';
      subheadingAssigned = true;
    } else if (item.fontSize <= 13 || (nameHint.includes('caption') || nameHint.includes('eyebrow') || nameHint.includes('tag'))) {
      role = 'caption';
    } else if (text.length < 30 && item.fontSize <= 16) {
      // Short, small — likely a link or label
      role = 'label';
    } else {
      role = `body_${idx}`;
    }

    const bb = item.node.absoluteBoundingBox!;
    return {
      index: idx,
      text,
      role,
      layerName: item.node.name,
      fontSize: Math.round(item.fontSize),
      bounds: {
        x: Math.round(item.relX),
        y: Math.round(item.relY),
        width: Math.round(bb.width),
        height: Math.round(bb.height),
      },
    };
  });
}

/**
 * Parse sections from a page frame.
 *
 * @param pageFrame The top-level page frame to walk.
 * @param iconMap Map<nodeId, svgFilename> from icon-detector. Section
 *                elements that match an icon root receive an `iconFile`
 *                pointing at the same filename image-exporter writes.
 * @param globalNames Optional set of normalized section names that appear on
 *                    ≥2 selected pages. When provided, matching sections are
 *                    marked `isGlobal: true` so the agent can promote them to
 *                    shared WP theme parts instead of duplicating per-page.
 */
export function parseSections(
  pageFrame: FrameNode,
  iconMap: Map<string, string>,
  globalNames?: Set<string>,
): Record<string, SectionSpec> {
  const sectionNodes = identifySections(pageFrame);
  const specs: Record<string, SectionSpec> = {};

  let prevBottom = 0;

  for (let i = 0; i < sectionNodes.length; i++) {
    const node = sectionNodes[i];
    const bounds = node.absoluteBoundingBox;
    if (!bounds) continue;

    const layoutName = toLayoutName(node.name);
    const isFrame = node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE';
    const frame = isFrame ? (node as FrameNode) : null;

    // Determine spacing source and extract spacing
    const hasAutoLayout = frame?.layoutMode && frame.layoutMode !== 'NONE';
    let spacingSource: 'auto-layout' | 'absolute-coordinates';
    let sectionStyles: Partial<SectionStyles>;
    let itemSpacing: string | null;

    if (hasAutoLayout && frame) {
      const spacing = extractAutoLayoutSpacing(frame);
      spacingSource = spacing.spacingSource;
      sectionStyles = spacing.sectionStyles;
      itemSpacing = spacing.itemSpacing;
    } else if (frame) {
      const spacing = extractAbsoluteSpacing(frame);
      spacingSource = spacing.spacingSource;
      sectionStyles = spacing.sectionStyles;
      itemSpacing = spacing.itemSpacing;
    } else {
      spacingSource = 'absolute-coordinates';
      sectionStyles = {};
      itemSpacing = null;
    }

    // Base section styles (background, gradient, etc.)
    const baseStyles = extractSectionStyles(node);
    const mergedStyles: SectionStyles = {
      ...baseStyles,
      ...sectionStyles,
    };

    // Elements
    const elements = extractElements(node, iconMap);

    // Grid detection
    const grid = frame ? detectGrid(frame) : {
      layoutMode: 'absolute' as const,
      columns: 1,
      gap: itemSpacing,
      rowGap: null,
      columnGap: null,
      itemMinWidth: null,
    };

    // Ensure grid gap is set from itemSpacing if not already
    if (!grid.gap && itemSpacing) {
      grid.gap = itemSpacing;
    }

    // Overlap detection
    let overlap: OverlapInfo | null = null;
    if (i > 0) {
      const overlapPx = prevBottom - bounds.y;
      if (overlapPx > 0) {
        overlap = {
          withSection: sectionNodes[i - 1].name,
          pixels: Math.round(overlapPx),
          cssMarginTop: `-${Math.round(overlapPx)}px`,
          requiresZIndex: true,
        };
      }
    }

    // Interactions
    const interactions = extractInteractions(node);

    // Layer composition analysis
    const layers = extractLayers(node, elements, iconMap);
    const composition = detectComposition(layers);

    // Enrich elements with position data from composition
    if (composition.hasTextOverImage || composition.hasBackgroundImage) {
      // Section needs position: relative for overlay children
      mergedStyles.overflow = mergedStyles.overflow || 'hidden';

      for (const [elemName, elemStyles] of Object.entries(elements)) {
        if (composition.overlayElements.includes(elemName) || composition.hasBackgroundImage) {
          // Find matching layer for position data
          const layer = layers.find(l => l.name === elemName);
          if (layer && layer.role !== 'background_image') {
            elemStyles.position = 'relative';
            elemStyles.zIndex = layer.zIndex;
          }
        }
      }
    }

    // Form detection
    const formResult = detectFormSection(node);

    // Ordered text content — every text in reading order (for page-assembler mapping)
    const textContentInOrder = extractTextContentInOrder(node);

    // Pattern detection (carousel / accordion / tabs / modal)
    let componentPatterns: ReturnType<typeof detectComponentPatterns> | undefined;
    try {
      const p = detectComponentPatterns(node);
      if (p.length > 0) componentPatterns = p;
    } catch (e) {
      console.warn('detectComponentPatterns failed for section', node.name, e);
    }

    // Repeater detection (cards / features / pricing / etc.)
    let repeaters: ReturnType<typeof detectRepeaters> | undefined;
    try {
      const r = detectRepeaters(node);
      if (Object.keys(r).length > 0) repeaters = r;
    } catch (e) {
      console.warn('detectRepeaters failed for section', node.name, e);
    }

    // Global detection (cross-page)
    const normalized = normalizeSectionName(node.name);
    const isGlobal = globalNames ? globalNames.has(normalized) : false;
    const globalRole = isGlobal
      ? classifyGlobalRole(i, sectionNodes.length, Math.round(bounds.height))
      : null;

    // Navigation (only worth computing for header/footer candidates)
    let navigation: NonNullable<ReturnType<typeof detectNavigation>> | undefined;
    try {
      const name = (node.name || '').toLowerCase();
      if (isGlobal || /\b(header|footer|nav|navbar|navigation)\b/.test(name)) {
        const nav = detectNavigation(node);
        if (nav) navigation = nav;
      }
    } catch (e) {
      console.warn('detectNavigation failed for section', node.name, e);
    }

    // Section semantic role inference
    let sectionType: ReturnType<typeof inferSectionType> | null = null;
    try {
      sectionType = inferSectionType({
        sectionIndex: i,
        totalSections: sectionNodes.length,
        isFormSection: formResult.isForm,
        patterns: componentPatterns || [],
        repeaters: repeaters || {},
        elements,
        textContentInOrder,
        layerName: node.name || '',
        sectionHeight: Math.round(bounds.height),
        isGlobal,
        globalRole,
      });
    } catch (e) {
      console.warn('inferSectionType failed for section', node.name, e);
    }

    specs[layoutName] = {
      spacingSource,
      figmaNodeId: node.id,
      screenshotFile: `screenshots/${screenshotFilename(node.name)}`,
      section: mergedStyles,
      elements,
      grid,
      interactions: interactions.length > 0 ? interactions : undefined,
      overlap,
      layers: layers.length > 0 ? layers : undefined,
      composition: (composition.hasTextOverImage || composition.hasBackgroundImage) ? composition : undefined,
      isFormSection: formResult.isForm || undefined,
      formFields: formResult.fields.length > 0 ? formResult.fields : undefined,
      textContentInOrder: textContentInOrder.length > 0 ? textContentInOrder : undefined,
      componentPatterns,
      isGlobal: isGlobal || undefined,
      globalRole: isGlobal ? globalRole : undefined,
      sectionType: sectionType?.type,
      sectionTypeConfidence: sectionType?.confidence,
      repeaters,
      navigation,
    };

    prevBottom = bounds.y + bounds.height;
  }

  return specs;
}
