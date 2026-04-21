import { PageInfo, FrameInfo } from './types';
import { classifyBreakpoint } from './responsive';

/**
 * Discover all pages in the Figma file.
 * Each page contains frames that represent design artboards.
 */
export function discoverPages(): PageInfo[] {
  const pages: PageInfo[] = [];

  for (const page of figma.root.children) {
    const frames = discoverFrames(page);
    if (frames.length > 0) {
      pages.push({
        id: page.id,
        name: page.name,
        frames,
      });
    }
  }

  return pages;
}

/**
 * Discover all top-level frames within a page.
 * Filters to FRAME, COMPONENT_SET, and COMPONENT nodes with meaningful dimensions.
 */
function discoverFrames(page: PageNode): FrameInfo[] {
  const frames: FrameInfo[] = [];

  for (const child of page.children) {
    // Only include top-level frames (not groups, vectors, etc.)
    if (child.type !== 'FRAME' && child.type !== 'COMPONENT' && child.type !== 'COMPONENT_SET') {
      continue;
    }

    const frame = child as FrameNode;

    // Skip tiny frames (likely icons or components, not page designs)
    if (frame.width < 300 || frame.height < 200) continue;

    // Count visible sections (direct children that are frames)
    const sectionCount = frame.children.filter(c =>
      c.visible !== false &&
      (c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE' || c.type === 'GROUP') &&
      c.absoluteBoundingBox &&
      c.absoluteBoundingBox.height > 50
    ).length;

    // Check if any section uses auto-layout
    const hasAutoLayout = frame.layoutMode !== undefined && frame.layoutMode !== 'NONE';

    frames.push({
      id: frame.id,
      name: frame.name,
      width: Math.round(frame.width),
      height: Math.round(frame.height),
      breakpoint: classifyBreakpoint(Math.round(frame.width)),
      sectionCount,
      hasAutoLayout,
      responsivePairId: null,
    });
  }

  return frames;
}
