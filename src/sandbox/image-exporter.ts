import { ImageExportTask, ImageMap, ImageMapEntry, FailedExport } from './types';
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
 * Build a Map<nodeId, filename> for every node with an IMAGE fill in the page.
 *
 * Dedup is by Figma's imageHash so two distinct photos that happen to share
 * a layer name ("Image", "Rectangle 12") each get their own file, while
 * multiple usages of the same bitmap collapse to a single export.
 *
 * Filename collisions (different bitmaps slugifying to the same base name)
 * are resolved with a numeric suffix. Both image-exporter and section-parser
 * consume this map so their references stay in lockstep.
 */
export function buildImageFilenameMap(
  pageFrame: SceneNode,
  iconRootIds: Set<string>,
): Map<string, string> {
  const result = new Map<string, string>();
  const hashToFilename = new Map<string, string>();
  const usedFilenames = new Set<string>();

  for (const imgNode of findImageNodes(pageFrame)) {
    if (iconRootIds.has(imgNode.id)) continue;
    if (isInsideIconRoot(imgNode, iconRootIds)) continue;

    const imageHash = getFirstImageHash(imgNode);
    let filename: string | undefined;

    if (imageHash && hashToFilename.has(imageHash)) {
      filename = hashToFilename.get(imageHash)!;
    } else {
      const baseSlug = slugify(imgNode.name) || 'image';
      filename = `${baseSlug}.png`;
      let i = 2;
      while (usedFilenames.has(filename)) {
        filename = `${baseSlug}-${i++}.png`;
      }
      usedFilenames.add(filename);
      if (imageHash) hashToFilename.set(imageHash, filename);
    }

    result.set(imgNode.id, filename);
  }
  return result;
}

/**
 * Build the list of all export tasks for a page frame.
 * Includes: full-page composite screenshot, per-section screenshots,
 * and image assets (PNG for photos, SVG for vector icons).
 *
 * `iconMap` (from icon-detector) decides which nodes become SVG icons and
 * what filename each one gets. `imageMap` does the same for raster IMAGE
 * fills. Both this function and section-parser consume the same maps so
 * the JSON specs reference exactly the files we export.
 */
export function buildExportTasks(
  pageFrame: FrameNode,
  pageSlug: string,
  iconMap: Map<string, string>,
  imageMap: Map<string, string>,
): ImageExportTask[] {
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

  // Icon SVG tasks — one per unique filename. Multiple instances of the
  // same library icon collapse to a single export (handled by icon-detector).
  const filenameToFirstNodeId = new Map<string, string>();
  for (const [nodeId, filename] of iconMap) {
    if (!filenameToFirstNodeId.has(filename)) {
      filenameToFirstNodeId.set(filename, nodeId);
    }
  }
  const iconRootIds = new Set(iconMap.keys());
  for (const [filename, nodeId] of filenameToFirstNodeId) {
    const node = figma.getNodeById(nodeId);
    if (!node) continue;
    tasks.push({
      nodeId,
      nodeName: (node as SceneNode).name,
      type: 'asset',
      filename,
      pagePath,
      format: 'SVG',
      scale: 1,
      preferSvg: true,
    });
  }

  // Raster image tasks — one task per unique filename in `imageMap`.
  // The map already handles imageHash-based dedup and collision-suffixing;
  // we just walk it and queue one export per output file.
  const filenameToFirstImageNodeId = new Map<string, string>();
  for (const [nodeId, filename] of imageMap) {
    if (!filenameToFirstImageNodeId.has(filename)) {
      filenameToFirstImageNodeId.set(filename, nodeId);
    }
  }
  for (const [filename, nodeId] of filenameToFirstImageNodeId) {
    const node = figma.getNodeById(nodeId);
    if (!node) continue;
    tasks.push({
      nodeId,
      nodeName: (node as SceneNode).name,
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
 * Walk a node's ancestry checking whether any ancestor is an icon root.
 * Used to suppress duplicate exports for vectors inside an icon group.
 */
function isInsideIconRoot(node: SceneNode, iconRootIds: Set<string>): boolean {
  let p: BaseNode | null = node.parent;
  while (p) {
    if ('id' in p && iconRootIds.has((p as any).id)) return true;
    p = (p as any).parent;
  }
  return false;
}

/**
 * Return the imageHash of the first visible IMAGE fill on a node, or null
 * if the node has no resolvable IMAGE fill. Used to dedupe identical
 * raster bitmaps across the page so we don't emit one file per usage.
 */
function getFirstImageHash(node: SceneNode): string | null {
  const fills = (node as any).fills;
  if (!fills || !Array.isArray(fills)) return null;
  for (const f of fills) {
    if (f && f.type === 'IMAGE' && f.visible !== false && (f as ImagePaint).imageHash) {
      return (f as ImagePaint).imageHash || null;
    }
  }
  return null;
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
 *
 * On SVG export failure (some Figma vector features can't serialize),
 * automatically retries as PNG @ 2x and emits the .png filename instead.
 * Both the original failure and the fallback are recorded in the returned
 * `failed` list so the extractor can patch element references.
 */
export async function executeBatchExport(
  tasks: ImageExportTask[],
  onProgress: (current: number, total: number, label: string) => void,
  onData: (task: ImageExportTask, data: Uint8Array) => void,
  shouldCancel: () => boolean,
): Promise<FailedExport[]> {
  const total = tasks.length;
  const failed: FailedExport[] = [];

  for (let i = 0; i < total; i += BATCH_SIZE) {
    if (shouldCancel()) return failed;

    const batch = tasks.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (task) => {
      try {
        const data = await exportNode(task.nodeId, task.format, task.scale, task.type);
        onData(task, data);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);

        // SVG can fail for vectors with unsupported features (open paths
        // with stroke caps, certain blend modes, bound variables on fills).
        // Fall back to PNG @ 2x so the design isn't visually missing.
        if (task.format === 'SVG') {
          const pngFilename = task.filename.replace(/\.svg$/i, '.png');
          const pngTask: ImageExportTask = {
            ...task,
            filename: pngFilename,
            format: 'PNG',
            scale: 2,
          };
          try {
            const data = await exportNode(task.nodeId, 'PNG', 2, task.type);
            onData(pngTask, data);
            failed.push({
              filename: task.filename,
              nodeName: task.nodeName,
              reason: `SVG export failed (${reason}); fell back to PNG`,
              fallbackFilename: pngFilename,
            });
            return;
          } catch (pngErr) {
            const pngReason = pngErr instanceof Error ? pngErr.message : String(pngErr);
            failed.push({
              filename: task.filename,
              nodeName: task.nodeName,
              reason: `SVG and PNG fallback both failed: ${reason} / ${pngReason}`,
            });
            return;
          }
        }

        console.error(`Failed to export ${task.filename}:`, err);
        failed.push({
          filename: task.filename,
          nodeName: task.nodeName,
          reason,
        });
      }
    });

    await Promise.all(batchPromises);
    const done = Math.min(i + BATCH_SIZE, total);
    onProgress(done, total, `Exporting (${done}/${total})...`);
  }

  return failed;
}

/**
 * Build the image-map.json from export tasks and section data.
 *
 * `iconMap` populates `by_section` for icon usage so the agent can trace
 * "section X uses chevron-right.svg" instead of getting a context-less
 * global list of SVGs.
 */
export function buildImageMap(
  tasks: ImageExportTask[],
  sections: { name: string; children: SceneNode[] }[],
  iconMap: Map<string, string>,
  imageMap: Map<string, string>,
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
    const sectionImages = new Set<string>();

    function walk(node: SceneNode) {
      // Icon root — record SVG and stop (don't descend into vector internals)
      const iconFilename = iconMap.get(node.id);
      if (iconFilename) {
        sectionImages.add(iconFilename);
        if (images[iconFilename] && !images[iconFilename].usedInSections.includes(section.name)) {
          images[iconFilename].usedInSections.push(section.name);
        }
        return;
      }

      if (hasImageFill(node as any)) {
        // Resolve via the shared imageMap so per-section refs match the
        // filenames that actually landed in the ZIP (post collision-suffix).
        const filename = imageMap.get(node.id);
        if (filename) {
          sectionImages.add(filename);
          if (images[filename] && !images[filename].usedInSections.includes(section.name)) {
            images[filename].usedInSections.push(section.name);
          }
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
    bySectionMap[section.name] = [...sectionImages];
  }

  return { images, by_section: bySectionMap };
}
