import { ImageExportTask, ImageMap, ImageMapEntry } from './types';
import { slugify, screenshotFilename } from './utils';
import { hasImageFill } from './color';

const BATCH_SIZE = 10;

/**
 * Identify section-level children, matching the same logic as section-parser.ts.
 * If the frame has a single wrapper child, drill one level deeper.
 */
function identifySectionNodes(pageFrame: FrameNode): SceneNode[] {
  let candidates = pageFrame.children.filter(c =>
    c.visible !== false &&
    (c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE' || c.type === 'GROUP') &&
    c.absoluteBoundingBox &&
    c.absoluteBoundingBox.height > 50
  );

  // If there's a single container child, drill one level deeper (matches section-parser.ts)
  if (candidates.length === 1 && 'children' in candidates[0]) {
    const wrapper = candidates[0] as FrameNode;
    const innerCandidates = wrapper.children.filter(c =>
      c.visible !== false &&
      (c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE' || c.type === 'GROUP') &&
      c.absoluteBoundingBox &&
      c.absoluteBoundingBox.height > 50
    );
    if (innerCandidates.length > 1) {
      candidates = innerCandidates;
    }
  }

  return [...candidates].sort((a, b) => a.absoluteBoundingBox!.y - b.absoluteBoundingBox!.y);
}

/**
 * Build the list of all export tasks for a page frame.
 * Includes: full-page composite screenshot, per-section screenshots,
 * and image assets (PNG for photos, SVG for vector icons).
 */
export function buildExportTasks(pageFrame: FrameNode, pageSlug: string): ImageExportTask[] {
  const tasks: ImageExportTask[] = [];
  const pagePath = `pages/${pageSlug}`;

  // Full-page composite screenshot — critical for agent's full-page visual review.
  tasks.push({
    nodeId: pageFrame.id,
    nodeName: pageFrame.name,
    type: 'full-page',
    filename: '_full-page.png',
    pagePath,
    format: 'PNG',
    scale: 1,
  });

  // Per-section screenshots at 1x — uses same wrapper drill-down as section-parser
  const sections = identifySectionNodes(pageFrame);

  for (let i = 0; i < sections.length; i++) {
    tasks.push({
      nodeId: sections[i].id,
      nodeName: sections[i].name,
      type: 'screenshot',
      filename: screenshotFilename(sections[i].name),
      pagePath,
      format: 'PNG',
      scale: 1,
    });
  }

  // Image assets — detect icons (vector-only, small) vs photos (raster fills)
  const iconNodes = findIconNodes(pageFrame);
  const seenIconIds = new Set<string>();
  for (const iconNode of iconNodes) {
    if (seenIconIds.has(iconNode.id)) continue;
    seenIconIds.add(iconNode.id);
    tasks.push({
      nodeId: iconNode.id,
      nodeName: iconNode.name,
      type: 'asset',
      filename: `${slugify(iconNode.name)}.svg`,
      pagePath,
      format: 'SVG',
      scale: 1,
      preferSvg: true,
    });
  }

  const imageNodes = findImageNodes(pageFrame);
  const seenHashes = new Set<string>();

  for (const imgNode of imageNodes) {
    // Skip nodes already queued as SVG icons
    if (seenIconIds.has(imgNode.id)) continue;
    const hashKey = `${imgNode.name}_${imgNode.absoluteBoundingBox?.width}_${imgNode.absoluteBoundingBox?.height}`;
    if (seenHashes.has(hashKey)) continue;
    seenHashes.add(hashKey);

    const filename = `${slugify(imgNode.name)}.png`;
    tasks.push({
      nodeId: imgNode.id,
      nodeName: imgNode.name,
      type: 'asset',
      filename,
      pagePath,
      format: 'PNG',
      scale: 1,
    });
  }

  return tasks;
}

/**
 * Identify icon nodes — vector-only, typically small (< 64px). These are
 * exported as SVG so the theme can inline them, recolor via CSS currentColor,
 * and render sharp at any resolution.
 *
 * Heuristics:
 *   - node.type === 'VECTOR' (pure vector path)
 *   - FRAME/COMPONENT whose entire subtree is vector (no IMAGE fills, no TEXT)
 *     AND bounding box ≤ 64×64
 *   - Layer name contains "icon" (hint)
 */
function findIconNodes(root: SceneNode): SceneNode[] {
  const icons: SceneNode[] = [];

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

  function walk(node: SceneNode) {
    if (node.visible === false) return;
    const bb = node.absoluteBoundingBox;
    const smallish = bb && bb.width <= 64 && bb.height <= 64;

    if (node.type === 'VECTOR') {
      icons.push(node);
      return; // don't recurse into vector paths
    }

    const nameHintsIcon = /\bicon\b/i.test(node.name);
    if ((node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'GROUP') &&
        (smallish || nameHintsIcon) &&
        isVectorOnly(node) &&
        'children' in node && (node as FrameNode).children.length > 0) {
      icons.push(node);
      return; // don't recurse into icon internals
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
 * Find all nodes with IMAGE fills in a subtree.
 */
function findImageNodes(root: SceneNode): SceneNode[] {
  const nodes: SceneNode[] = [];

  function walk(node: SceneNode) {
    if (hasImageFill(node as any)) {
      nodes.push(node);
    }
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        if (child.visible !== false) {
          walk(child);
        }
      }
    }
  }
  walk(root);
  return nodes;
}

/**
 * Export a single node as PNG/SVG bytes.
 *
 * For section screenshots, this uses exportAsync which renders the composite
 * (image + text + overlays) — correct for screenshots.
 *
 * For image assets, this pulls the RAW image bytes from the node's IMAGE fill
 * via figma.getImageByHash(). This returns the pure source image with NO
 * text/shape overlays baked in — fixing the common "hero image includes the
 * headline text" problem. Masks and crops are discarded intentionally; the
 * theme re-applies them via CSS (object-fit, background-size, border-radius).
 *
 * Asset fallback: if the node has no image fill (e.g. an SVG illustration),
 * fall back to exportAsync so logos/icons still export correctly.
 */
async function exportNode(
  nodeId: string,
  format: 'PNG' | 'SVG' | 'JPG',
  scale: number,
  taskType: 'screenshot' | 'full-page' | 'asset',
): Promise<Uint8Array> {
  const node = figma.getNodeById(nodeId);
  if (!node || !('exportAsync' in node)) {
    throw new Error(`Node ${nodeId} not found or not exportable`);
  }

  // SVG requested — use exportAsync directly (for icons, vector illustrations)
  if (format === 'SVG') {
    return await (node as SceneNode).exportAsync({ format: 'SVG' });
  }

  // For PNG asset tasks: try to pull raw image bytes from an IMAGE fill first
  // so we get the pure source image without any baked-in text/overlays.
  if (taskType === 'asset' && format === 'PNG') {
    const raw = await tryExtractRawImageBytes(node as SceneNode);
    if (raw) return raw;
    // else fall through to exportAsync (SVG illustration, vector graphic, etc.)
  }

  // Full-page and section screenshots use exportAsync (rendered composite).
  // Scale up to 2x for full-page to preserve detail when comparing with browser.
  const exportScale = taskType === 'full-page' ? 2 : scale;
  return await (node as SceneNode).exportAsync({
    format: 'PNG',
    constraint: { type: 'SCALE', value: exportScale },
  });
}

/**
 * Extract raw image bytes from the first visible IMAGE fill on a node.
 * Returns null if the node has no IMAGE fill or the hash can't be resolved.
 */
async function tryExtractRawImageBytes(node: SceneNode): Promise<Uint8Array | null> {
  const fills = (node as any).fills;
  if (!fills || !Array.isArray(fills)) return null;

  const imageFill = fills.find(
    (f: Paint) => f.type === 'IMAGE' && f.visible !== false && (f as ImagePaint).imageHash,
  ) as ImagePaint | undefined;

  if (!imageFill || !imageFill.imageHash) return null;

  try {
    const image = figma.getImageByHash(imageFill.imageHash);
    if (!image) return null;
    return await image.getBytesAsync();
  } catch (err) {
    console.warn(`Failed to extract raw image bytes from ${node.name}:`, err);
    return null;
  }
}

/**
 * Execute export tasks in batches of 10.
 * Sends each result to UI immediately to free sandbox memory.
 */
export async function executeBatchExport(
  tasks: ImageExportTask[],
  onProgress: (current: number, total: number, label: string) => void,
  onData: (task: ImageExportTask, data: Uint8Array) => void,
  shouldCancel: () => boolean,
): Promise<void> {
  const total = tasks.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    if (shouldCancel()) return;

    const batch = tasks.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (task) => {
      try {
        const data = await exportNode(task.nodeId, task.format, task.scale, task.type);
        onData(task, data);
      } catch (err) {
        console.error(`Failed to export ${task.filename}:`, err);
      }
    });

    await Promise.all(batchPromises);
    const done = Math.min(i + BATCH_SIZE, total);
    onProgress(done, total, `Exporting (${done}/${total})...`);
  }
}

/**
 * Build the image-map.json from export tasks and section data.
 */
export function buildImageMap(
  tasks: ImageExportTask[],
  sections: { name: string; children: SceneNode[] }[]
): ImageMap {
  const images: Record<string, ImageMapEntry> = {};
  const bySectionMap: Record<string, string[]> = {};

  const assetTasks = tasks.filter(t => t.type === 'asset');

  for (const task of assetTasks) {
    images[task.filename] = {
      file: task.filename,
      ext: task.format.toLowerCase(),
      nodeNames: [task.nodeName],
      readableName: task.filename,
      dimensions: null,
      usedInSections: [],
    };
  }

  for (const section of sections) {
    const sectionImages: string[] = [];
    function walk(node: SceneNode) {
      if (hasImageFill(node as any)) {
        const filename = `${slugify(node.name)}.png`;
        sectionImages.push(filename);
        if (images[filename]) {
          images[filename].usedInSections.push(section.name);
        }
      }
      if ('children' in node) {
        for (const child of (node as FrameNode).children) {
          walk(child);
        }
      }
    }
    for (const child of section.children) {
      walk(child);
    }
    bySectionMap[section.name] = sectionImages;
  }

  return { images, by_section: bySectionMap };
}
