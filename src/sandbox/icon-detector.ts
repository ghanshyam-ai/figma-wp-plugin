import { hasImageFill } from './color';
import { slugify, isDefaultLayerName } from './utils';

/**
 * Shared icon detection for image-exporter (decides what to SVG-export)
 * and section-parser (decides which elements get an `iconFile` reference).
 *
 * Both modules MUST agree on (a) which nodes are icons and (b) the filename
 * each icon receives — otherwise section-specs.json points at files that
 * never made it into the ZIP, which is the original "icon missing" bug.
 *
 * Filename uniqueness is the responsibility of `buildIconFilenameMap`:
 * INSTANCE nodes pointing at the same main component collapse to one file,
 * and slug collisions get a numeric suffix.
 */

const ICON_NAME_HINT = /\b(icon|chevron|arrow|caret|check|tick|close|cross|menu|burger|hamburger|search|plus|minus|star|heart|logo|social|symbol|glyph|play|pause|stop|next|prev|share|download|upload|edit|trash|delete|info|warning|error|success|facebook|twitter|instagram|linkedin|youtube|github|tiktok|whatsapp|telegram|discord|pinterest|snapchat|mail|envelope|phone|telephone|home|house|user|profile|account|lock|unlock|gear|settings|cog|bell|notification|calendar|clock|time|bookmark|tag|filter|sort|grid|list|map|pin|location|cart|bag|basket|wallet|card|gift|globe|world|link|external|copy|paste|refresh|reload|sync|eye|view|hide|visible|invisible|sun|moon|theme|light|dark|wifi|battery|camera|video|microphone|volume|mute|file|folder|attach|paperclip|cloud|database|chart|graph|trend|dot|divider|separator|shape|graphic|illustration|decoration|svg|vector|asset)\b/i;
const ICON_SIZE_CAP = 256;

/**
 * True if the node is "vector-only" — no TEXT, no IMAGE fill anywhere in
 * its subtree. Pure-vector icons can be exported as SVG without losing
 * fidelity; mixed subtrees must fall back to PNG.
 */
function isVectorOnly(n: SceneNode): boolean {
  if (n.type === 'TEXT') return false;
  if (hasImageFill(n as any)) return false;
  if ('children' in n) {
    for (const child of (n as FrameNode).children) {
      if (child.visible === false) continue;
      if (!isVectorOnly(child)) return false;
    }
  }
  return true;
}

/**
 * Predicate: is this node an icon root that should be exported as SVG?
 *
 * Heuristics (any one is sufficient):
 *   1. node.type === VECTOR / BOOLEAN_OPERATION / LINE (raw vector primitives)
 *   2. FRAME / GROUP / COMPONENT / INSTANCE whose entire subtree is vector-only
 *      AND any one of:
 *        a. has a name hint (icon, logo, chevron, facebook, …) — any size
 *        b. is small (≤256×256) — name irrelevant
 *      Wrapper-as-single-icon export keeps multi-path logos composed; the
 *      old 128px cap split a 200×200 logo into individually-disconnected
 *      VECTOR exports. Bumping to 256 + name-hint override fixes that.
 *
 * Whatever this returns true for, image-exporter will queue an SVG export
 * AND section-parser will emit an `iconFile` reference on the matching element.
 */
export function isIconNode(node: SceneNode): boolean {
  if (node.visible === false) return false;

  // Pure vector primitives are always SVG-exportable.
  if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION' || node.type === 'LINE') {
    return true;
  }

  if (node.type !== 'FRAME' && node.type !== 'COMPONENT' &&
      node.type !== 'INSTANCE' && node.type !== 'GROUP') {
    return false;
  }

  if (!('children' in node) || (node as FrameNode).children.length === 0) {
    return false;
  }

  const bb = node.absoluteBoundingBox;
  const smallish = !!bb && bb.width <= ICON_SIZE_CAP && bb.height <= ICON_SIZE_CAP;
  const nameHintsIcon = ICON_NAME_HINT.test(node.name || '');

  if (!smallish && !nameHintsIcon) return false;
  return isVectorOnly(node);
}

/**
 * Walk the tree and collect every icon-root node. Don't recurse into an
 * icon's children — the parent is the composed export, the children are
 * just paths inside it.
 */
export function findIconNodes(root: SceneNode): SceneNode[] {
  const icons: SceneNode[] = [];
  function walk(node: SceneNode) {
    if (node.visible === false) return;
    if (isIconNode(node)) {
      icons.push(node);
      return; // don't recurse into the icon
    }
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        walk(child);
      }
    }
  }
  walk(root);
  return icons;
}

/**
 * Pick a human-meaningful base name for an icon. Order of preference:
 *   1. INSTANCE → main component / component-set name
 *   2. The node's own name, if not a default Figma name
 *   3. Nearest named ancestor + "-icon" suffix
 *   4. "icon" fallback
 */
function getIconBaseName(node: SceneNode): string {
  let baseName = node.name || '';

  if (node.type === 'INSTANCE') {
    try {
      const main = (node as InstanceNode).mainComponent;
      if (main) {
        const candidate = main.parent?.type === 'COMPONENT_SET'
          ? (main.parent as any).name
          : main.name;
        if (candidate && !isDefaultLayerName(candidate)) {
          baseName = candidate;
        }
      }
    } catch {
      // mainComponent access can throw on detached instances — fall through
    }
  }

  if (!baseName || isDefaultLayerName(baseName)) {
    let p: BaseNode | null = node.parent;
    while (p && 'name' in p && isDefaultLayerName((p as any).name)) {
      p = (p as any).parent;
    }
    if (p && 'name' in p && (p as any).name && !isDefaultLayerName((p as any).name)) {
      baseName = `${(p as any).name}-icon`;
    } else {
      baseName = 'icon';
    }
  }

  return baseName;
}

/**
 * Dedup key — collapses multiple instances of the same library icon into
 * a single export. Standalone vector nodes dedup by their own id.
 */
function dedupeKey(node: SceneNode): string {
  if (node.type === 'INSTANCE') {
    try {
      const main = (node as InstanceNode).mainComponent;
      if (main) return `mc:${main.id}`;
    } catch {
      // fall through
    }
  }
  return `n:${node.id}`;
}

/**
 * Build the canonical Map<nodeId, svgFilename> for a page frame.
 * Both image-exporter and section-parser consume this so they agree on
 * which nodes are icons AND what filename each icon ends up with.
 *
 * Guarantees:
 *   - Every entry's filename is unique across the returned map.
 *   - Multiple INSTANCE nodes of the same main component map to the same
 *     filename (one shared SVG file for the page).
 */
export function buildIconFilenameMap(root: SceneNode): Map<string, string> {
  const nodeIdToFilename = new Map<string, string>();
  const dedupKeyToFilename = new Map<string, string>();
  const usedFilenames = new Set<string>();

  for (const node of findIconNodes(root)) {
    const key = dedupeKey(node);
    let filename = dedupKeyToFilename.get(key);
    if (!filename) {
      const base = slugify(getIconBaseName(node)) || 'icon';
      filename = `${base}.svg`;
      let i = 2;
      while (usedFilenames.has(filename)) {
        filename = `${base}-${i++}.svg`;
      }
      usedFilenames.add(filename);
      dedupKeyToFilename.set(key, filename);
    }
    nodeIdToFilename.set(node.id, filename);
  }

  return nodeIdToFilename;
}
