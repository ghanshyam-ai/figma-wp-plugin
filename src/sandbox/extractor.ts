import {
  SectionSpecs, DesignTokens, ExportManifest, ExportManifestPage,
  ResponsivePair, ResponsiveMap, PageTokens, ImageMap, FontTokenInfo,
  ResponsiveOverride, SectionSpec, FailedExport,
} from './types';
import { slugify, toLayoutName } from './utils';
import { collectColors } from './color';
import { collectFonts, countTextNodes } from './typography';
import { collectSpacing } from './spacing';
import { parseSections } from './section-parser';
import { matchResponsiveFrames } from './responsive';
import { buildExportTasks, executeBatchExport, buildImageMap, buildImageFilenameMap } from './image-exporter';
import { extractVariables } from './variables';
import { normalizeSectionName } from './patterns';
import { buildIconFilenameMap } from './icon-detector';

/**
 * Master extraction orchestrator.
 * Coordinates all modules for the selected frames and sends results to UI.
 */
export async function runExtraction(
  frameIds: string[],
  responsivePairs: ResponsivePair[],
  sendMessage: (msg: any) => void,
  shouldCancel: () => boolean,
): Promise<void> {
  const allDesignTokenColors: Record<string, string> = {};
  const allDesignTokenFonts: Record<string, FontTokenInfo> = {};
  const allSpacingValues = new Set<number>();
  const manifestPages: ExportManifestPage[] = [];
  const allFailedExports: FailedExport[] = [];
  let totalSections = 0;
  let totalImages = 0;

  // Pre-compute the set of section names that appear on ≥2 selected pages.
  // These are candidates for global WP theme parts (header.php / footer.php
  // / template-parts). parseSections will mark matching sections isGlobal.
  const globalNames = computeGlobalSectionNames(responsivePairs);

  // Process each responsive pair (each = one page)
  for (const pair of responsivePairs) {
    if (shouldCancel()) return;

    const desktopNode = figma.getNodeById(pair.desktop.frameId);
    if (!desktopNode || desktopNode.type !== 'FRAME') continue;
    const desktopFrame = desktopNode as FrameNode;

    sendMessage({
      type: 'EXPORT_PROGRESS',
      current: 0,
      total: 100,
      label: `Extracting "${pair.pageName}"...`,
    });

    // ── Build the icon AND raster-image filename maps FIRST so section-parser
    //    and image-exporter agree on (a) which nodes are icons vs raster
    //    images and (b) what filename each one receives. Without this shared
    //    state the spec ends up referencing files that never made it into
    //    the ZIP, which is the original "icon/image missing" bug. ──
    const iconMap = buildIconFilenameMap(desktopFrame);
    const iconRootIds = new Set(iconMap.keys());
    const imageMap = buildImageFilenameMap(desktopFrame, iconRootIds);

    // ── Parse sections from desktop frame ──
    const sections = parseSections(desktopFrame, iconMap, imageMap, globalNames);
    const sectionCount = Object.keys(sections).length;
    totalSections += sectionCount;

    // ── Merge responsive overrides from mobile frame ──
    if (pair.mobile) {
      const mobileNode = figma.getNodeById(pair.mobile.frameId);
      if (mobileNode && mobileNode.type === 'FRAME') {
        const mobileFrame = mobileNode as FrameNode;
        const mobileIconMap = buildIconFilenameMap(mobileFrame);
        const mobileIconRootIds = new Set(mobileIconMap.keys());
        const mobileImageMap = buildImageFilenameMap(mobileFrame, mobileIconRootIds);
        const mobileSections = parseSections(mobileFrame, mobileIconMap, mobileImageMap, globalNames);
        mergeResponsiveData(sections, mobileSections, pair.mobile.width);
      }
    }

    // ── Collect tokens for this page ──
    const colors = collectColors(desktopFrame);
    const fonts = collectFonts(desktopFrame);
    const spacing = collectSpacing(desktopFrame);

    // Build page tokens
    const pageTokens: PageTokens = {
      colors,
      fonts: Object.fromEntries(
        Object.entries(fonts).map(([family, data]) => [family, {
          styles: [...data.styles],
          sizes: [...data.sizes].sort((a, b) => a - b),
          count: data.count,
        }])
      ),
      spacing,
      sections: buildTokenSections(desktopFrame, pair.pageSlug),
    };

    // Merge into global tokens
    for (const [hex, count] of Object.entries(colors)) {
      if (count >= 2) {
        const varName = `--clr-${hex.slice(1).toLowerCase()}`;
        allDesignTokenColors[varName] = hex;
      }
    }
    for (const [family, data] of Object.entries(fonts)) {
      allDesignTokenFonts[family] = {
        styles: [...data.styles],
        sizes: [...data.sizes].sort((a, b) => a - b),
        count: data.count,
      };
    }
    for (const s of spacing) {
      allSpacingValues.add(s.value);
    }

    // ── Export images and screenshots ──
    const exportTasks = buildExportTasks(desktopFrame, pair.pageSlug, iconMap, imageMap);
    const assetCount = exportTasks.filter(t => t.type === 'asset').length;
    totalImages += assetCount;

    const pageFailures = await executeBatchExport(
      exportTasks,
      (current, total, label) => {
        sendMessage({ type: 'EXPORT_PROGRESS', current, total, label });
      },
      (task, data) => {
        if (task.type === 'screenshot' || task.type === 'full-page') {
          sendMessage({
            type: 'SCREENSHOT_DATA',
            path: `${task.pagePath}/screenshots`,
            filename: task.filename,
            data,
          });
        } else {
          sendMessage({
            type: 'IMAGE_DATA',
            path: `${task.pagePath}/images`,
            filename: task.filename,
            data,
          });
        }
      },
      shouldCancel,
    );
    allFailedExports.push(...pageFailures);

    // ── Patch iconFile references for failed/fallback SVG exports.
    //    If SVG export failed but PNG fallback succeeded, redirect
    //    iconFile to the .png. If both failed, drop iconFile (alt text
    //    still survives so the agent has a textual cue). ──
    if (pageFailures.length > 0) {
      const fallbackMap = new Map<string, string>();
      const droppedSet = new Set<string>();
      for (const f of pageFailures) {
        if (f.fallbackFilename) fallbackMap.set(f.filename, f.fallbackFilename);
        else droppedSet.add(f.filename);
      }
      patchIconReferences(sections, fallbackMap, droppedSet);
    }

    // ── Build section-specs.json (now with patched iconFile refs) ──
    const sectionSpecs: SectionSpecs = {
      figma_canvas_width: Math.round(desktopFrame.width),
      figma_canvas_height: Math.round(desktopFrame.height),
      mobile_canvas_width: pair.mobile?.width,
      page_slug: pair.pageSlug,
      extracted_at: new Date().toISOString(),
      extraction_method: 'plugin',
      sections,
    };

    // ── Generate spec.md AFTER patches so it matches section-specs ──
    const specMd = generateSpecMd(pair.pageName, pair.pageSlug, sectionSpecs, pageTokens);

    // ── Send page data to UI (post-export so iconFile refs are accurate) ──
    sendMessage({
      type: 'PAGE_DATA',
      pageSlug: pair.pageSlug,
      sectionSpecs,
      specMd,
      tokens: pageTokens,
    });

    // ── Build and send image map ──
    const sectionChildren = desktopFrame.children
      .filter(c => c.visible !== false)
      .map(c => ({ name: c.name, children: 'children' in c ? [...(c as FrameNode).children] : [] }));
    const imageMapJson = buildImageMap(exportTasks, sectionChildren, iconMap, imageMap);
    sendMessage({
      type: 'IMAGE_MAP_DATA',
      path: `pages/${pair.pageSlug}/images`,
      imageMap: imageMapJson,
    });

    // ── Build manifest page entry ──
    const hasFullPage = exportTasks.some(t => t.type === 'full-page');
    manifestPages.push({
      slug: pair.pageSlug,
      frameName: pair.desktop.frameName,
      frameId: pair.desktop.frameId,
      canvasWidth: Math.round(desktopFrame.width),
      canvasHeight: Math.round(desktopFrame.height),
      sectionCount,
      imageCount: assetCount,
      hasResponsive: pair.mobile !== null,
      mobileFrameId: pair.mobile?.frameId ?? null,
      interactionCount: Object.values(sections)
        .reduce((sum, s) => sum + (s.interactions?.length ?? 0), 0),
      hasFullPageScreenshot: hasFullPage,
      fullPageScreenshotFile: hasFullPage ? '_full-page.png' : null,
    });
  }

  // ── Build final manifest and global tokens ──
  const manifest: ExportManifest = {
    exportVersion: '1.0',
    exportDate: new Date().toISOString(),
    figmaFileName: figma.root.name,
    figmaFileKey: figma.fileKey ?? '',
    pluginVersion: '1.0.0',
    pages: manifestPages,
    totalSections,
    totalImages,
    designTokensSummary: {
      colorCount: Object.keys(allDesignTokenColors).length,
      fontCount: Object.keys(allDesignTokenFonts).length,
      spacingValues: allSpacingValues.size,
    },
    failedExports: allFailedExports.length > 0 ? allFailedExports : undefined,
  };

  // Figma Variables (authoritative token names when available)
  const variables = extractVariables();

  const designTokens: DesignTokens = {
    colors: allDesignTokenColors,
    fonts: allDesignTokenFonts,
    spacing: [...allSpacingValues].sort((a, b) => a - b),
    variables: variables.present ? variables : undefined,
  };

  // When Figma Variables are available, prefer variable names for colors:
  // overwrite the auto-generated --clr-<hex> with --clr-<variable-name>
  if (variables.present) {
    for (const [colName, vars] of Object.entries(variables.collections)) {
      if (!colName.toLowerCase().includes('color')) continue;
      for (const [varName, value] of Object.entries(vars)) {
        if (typeof value !== 'string' || !value.startsWith('#')) continue;
        const safeName = varName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const cssVar = `--clr-${safeName}`;
        allDesignTokenColors[cssVar] = value;
      }
    }
    designTokens.colors = allDesignTokenColors;
  }

  // Build responsive map from the pairs
  const responsiveMap = matchResponsiveFrames(
    responsivePairs.flatMap(p => {
      const frames = [{
        id: p.desktop.frameId,
        name: p.desktop.frameName,
        width: p.desktop.width,
        height: 0,
        breakpoint: 'desktop' as const,
        sectionCount: 0,
        hasAutoLayout: false,
        responsivePairId: null,
      }];
      if (p.mobile) {
        frames.push({
          id: p.mobile.frameId,
          name: p.mobile.frameName,
          width: p.mobile.width,
          height: 0,
          breakpoint: 'mobile' as const,
          sectionCount: 0,
          hasAutoLayout: false,
          responsivePairId: null,
        });
      }
      return frames;
    })
  );

  sendMessage({
    type: 'EXPORT_COMPLETE',
    manifest,
    responsiveMap,
    designTokens,
  });
}

/**
 * Merge responsive overrides from mobile sections into desktop sections.
 * Only includes properties that differ between desktop and mobile.
 */
function mergeResponsiveData(
  desktopSections: Record<string, SectionSpec>,
  mobileSections: Record<string, SectionSpec>,
  mobileWidth: number,
): void {
  const bpKey = String(mobileWidth);

  for (const [layoutName, desktopSpec] of Object.entries(desktopSections)) {
    const mobileSpec = mobileSections[layoutName];
    if (!mobileSpec) continue;

    const override: ResponsiveOverride = {};

    // Diff section styles
    const sectionDiff: Record<string, any> = {};
    for (const [key, desktopVal] of Object.entries(desktopSpec.section)) {
      const mobileVal = (mobileSpec.section as any)[key];
      if (mobileVal && mobileVal !== desktopVal) {
        sectionDiff[key] = mobileVal;
      }
    }
    if (Object.keys(sectionDiff).length > 0) {
      override.section = sectionDiff;
    }

    // Diff element styles
    const elementsDiff: Record<string, Record<string, any>> = {};
    for (const [elemName, desktopElem] of Object.entries(desktopSpec.elements)) {
      const mobileElem = mobileSpec.elements[elemName];
      if (!mobileElem) continue;

      const diff: Record<string, any> = {};
      for (const [key, desktopVal] of Object.entries(desktopElem)) {
        const mobileVal = (mobileElem as any)[key];
        if (mobileVal !== undefined && mobileVal !== desktopVal) {
          diff[key] = mobileVal;
        }
      }
      if (Object.keys(diff).length > 0) {
        elementsDiff[elemName] = diff;
      }
    }
    if (Object.keys(elementsDiff).length > 0) {
      override.elements = elementsDiff;
    }

    // Diff grid
    if (mobileSpec.grid.columns !== desktopSpec.grid.columns || mobileSpec.grid.gap !== desktopSpec.grid.gap) {
      override.grid = {};
      if (mobileSpec.grid.columns !== desktopSpec.grid.columns) {
        override.grid.columns = mobileSpec.grid.columns;
      }
      if (mobileSpec.grid.gap !== desktopSpec.grid.gap) {
        override.grid.gap = mobileSpec.grid.gap;
      }
    }

    if (Object.keys(override).length > 0) {
      if (!desktopSpec.responsive) desktopSpec.responsive = {};
      desktopSpec.responsive[bpKey] = override;
    }
  }
}

/**
 * Build token section metadata for tokens.json.
 */
function buildTokenSections(frame: FrameNode, pageSlug: string) {
  const sections = frame.children
    .filter(c =>
      c.visible !== false &&
      (c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE' || c.type === 'GROUP') &&
      c.absoluteBoundingBox
    )
    .sort((a, b) => a.absoluteBoundingBox!.y - b.absoluteBoundingBox!.y);

  return sections.map((s, i) => {
    const bounds = s.absoluteBoundingBox!;
    const parentBounds = frame.absoluteBoundingBox!;
    const imageCount = countImages(s);
    const textNodes = countTextNodes(s);

    return {
      index: i + 1,
      name: s.name,
      id: s.id,
      dimensions: { width: Math.round(bounds.width), height: Math.round(bounds.height) },
      y_offset: Math.round(bounds.y - parentBounds.y),
      hasAutoLayout: s.type === 'FRAME' && (s as FrameNode).layoutMode !== undefined && (s as FrameNode).layoutMode !== 'NONE',
      image_count: imageCount,
      image_files: collectImageFileNames(s),
      text_nodes: textNodes,
      screenshot: `screenshots/${slugify(s.name)}.png`,
      screenshot_complete: true,
    };
  });
}

function countImages(node: SceneNode): number {
  let count = 0;
  function walk(n: SceneNode) {
    if ('fills' in n && Array.isArray((n as any).fills)) {
      if ((n as any).fills.some((f: Paint) => f.type === 'IMAGE' && f.visible !== false)) count++;
    }
    if ('children' in n) {
      for (const child of (n as FrameNode).children) walk(child);
    }
  }
  walk(node);
  return count;
}

/**
 * Pre-compute the set of normalized section names that appear on ≥2 selected
 * pages. Matching sections will be marked `isGlobal: true` by parseSections
 * so the WP agent can hoist them into header.php / footer.php / template-parts
 * rather than inlining the same markup on every page.
 *
 * The scan mirrors identifySections (drills one wrapper deep when the page
 * has a single container child) so the matching stays consistent with what
 * parseSections actually treats as a "section".
 */
function computeGlobalSectionNames(pairs: ResponsivePair[]): Set<string> {
  const nameToPageCount = new Map<string, number>();

  for (const pair of pairs) {
    try {
      const node = figma.getNodeById(pair.desktop.frameId);
      if (!node || node.type !== 'FRAME') continue;
      const frame = node as FrameNode;
      let candidates = frame.children.filter(c =>
        c.visible !== false &&
        (c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE' || c.type === 'GROUP')
      );
      if (candidates.length === 1 && 'children' in candidates[0]) {
        const inner = (candidates[0] as FrameNode).children.filter(c =>
          c.visible !== false &&
          (c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE' || c.type === 'GROUP')
        );
        if (inner.length > 1) candidates = inner;
      }
      const seenOnThisPage = new Set<string>();
      for (const c of candidates) {
        const key = normalizeSectionName(c.name || '');
        if (!key) continue;
        seenOnThisPage.add(key);
      }
      for (const name of seenOnThisPage) {
        nameToPageCount.set(name, (nameToPageCount.get(name) || 0) + 1);
      }
    } catch (e) {
      console.warn('computeGlobalSectionNames: failed to scan frame', pair.pageName, e);
    }
  }

  const out = new Set<string>();
  for (const [name, count] of nameToPageCount) {
    if (count >= 2) out.add(name);
  }
  return out;
}

function collectImageFileNames(node: SceneNode): string[] {
  const names: string[] = [];
  function walk(n: SceneNode) {
    if ('fills' in n && Array.isArray((n as any).fills)) {
      if ((n as any).fills.some((f: Paint) => f.type === 'IMAGE' && f.visible !== false)) {
        names.push(`${slugify(n.name)}.png`);
      }
    }
    if ('children' in n) {
      for (const child of (n as FrameNode).children) walk(child);
    }
  }
  walk(node);
  return names;
}

/**
 * Walk every element in the section map and reconcile `iconFile` against
 * the post-export reality:
 *   - If the .svg fell back to .png, rewrite iconFile to the .png filename.
 *   - If the export failed entirely with no fallback, drop iconFile so the
 *     agent doesn't reference a non-existent asset (alt text still
 *     survives as a textual cue).
 */
function patchIconReferences(
  sections: Record<string, SectionSpec>,
  fallbackMap: Map<string, string>,
  droppedSet: Set<string>,
): void {
  for (const spec of Object.values(sections)) {
    for (const elem of Object.values(spec.elements)) {
      const f = (elem as any).iconFile as string | null | undefined;
      if (!f) continue;
      if (fallbackMap.has(f)) {
        (elem as any).iconFile = fallbackMap.get(f);
      } else if (droppedSet.has(f)) {
        delete (elem as any).iconFile;
      }
    }
  }
}

/**
 * Generate a human-readable spec.md from extracted data.
 */
function generateSpecMd(pageName: string, pageSlug: string, specs: SectionSpecs, tokens: PageTokens): string {
  const lines: string[] = [];
  lines.push(`# Design Spec — ${pageName}`);
  lines.push(`## Source: Figma Plugin Export`);
  lines.push(`## Generated: ${specs.extracted_at}`);
  lines.push('');
  lines.push('## Page Metadata');
  lines.push(`- Page Name: ${pageName}`);
  lines.push(`- Canvas Width: ${specs.figma_canvas_width}px`);
  lines.push(`- Section Count: ${Object.keys(specs.sections).length}`);
  if (specs.mobile_canvas_width) {
    lines.push(`- Mobile Canvas Width: ${specs.mobile_canvas_width}px`);
  }
  lines.push('');

  // Colors
  lines.push('## Colors Used');
  lines.push('| HEX | Usage Count |');
  lines.push('|-----|------------|');
  const sortedColors = Object.entries(tokens.colors).sort((a, b) => b[1] - a[1]);
  for (const [hex, count] of sortedColors.slice(0, 20)) {
    lines.push(`| ${hex} | ${count} |`);
  }
  lines.push('');

  // Typography
  lines.push('## Typography Used');
  lines.push('| Font | Styles | Sizes |');
  lines.push('|------|--------|-------|');
  for (const [family, info] of Object.entries(tokens.fonts)) {
    lines.push(`| ${family} | ${info.styles.join(', ')} | ${info.sizes.join(', ')}px |`);
  }
  lines.push('');

  // Sections
  lines.push('## Sections');
  lines.push('');
  for (const [layoutName, spec] of Object.entries(specs.sections)) {
    lines.push(`### ${layoutName}`);
    lines.push(`- **Spacing Source**: ${spec.spacingSource}`);
    lines.push(`- **Background**: ${spec.section.backgroundColor || 'none'}`);
    lines.push(`- **Grid**: ${spec.grid.layoutMode}, ${spec.grid.columns} columns, gap: ${spec.grid.gap || 'none'}`);
    if (spec.interactions && spec.interactions.length > 0) {
      lines.push(`- **Interactions**: ${spec.interactions.length} (${spec.interactions.map(i => i.trigger).join(', ')})`);
    }
    if (spec.overlap) {
      lines.push(`- **Overlap**: ${spec.overlap.pixels}px with "${spec.overlap.withSection}"`);
    }
    lines.push('');

    // Elements
    for (const [elemName, elemStyles] of Object.entries(spec.elements)) {
      const props = Object.entries(elemStyles)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      lines.push(`  - **${elemName}**: ${props}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
