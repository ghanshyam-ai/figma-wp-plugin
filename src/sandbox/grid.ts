import { GridSpec } from './types';
import { toCssValue } from './utils';

/**
 * Detect the grid/layout structure of a frame and return a GridSpec.
 */
export function detectGrid(node: FrameNode): GridSpec {
  // Auto-layout frame → flex or grid
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    const isWrapping = 'layoutWrap' in node && (node as any).layoutWrap === 'WRAP';

    if (isWrapping) {
      // Wrapping auto-layout = flex-wrap (grid-like)
      const columns = estimateColumnsFromChildren(node);
      return {
        layoutMode: 'flex',
        columns,
        gap: toCssValue(node.itemSpacing),
        rowGap: 'counterAxisSpacing' in node ? toCssValue((node as any).counterAxisSpacing) : null,
        columnGap: null,
        itemMinWidth: estimateItemMinWidth(node, columns),
      };
    }

    // Non-wrapping auto-layout
    const isHorizontal = node.layoutMode === 'HORIZONTAL';

    if (isHorizontal) {
      // Horizontal layout — children are columns
      const columns = node.children.filter(c => c.visible !== false).length;
      return {
        layoutMode: 'flex',
        columns,
        gap: toCssValue(node.itemSpacing),
        rowGap: null,
        columnGap: null,
        itemMinWidth: null,
      };
    }

    // Vertical layout — single column, children are rows
    // But check if any direct child is a horizontal auto-layout (nested grid)
    const horizontalChild = node.children.find(c =>
      c.visible !== false &&
      (c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE') &&
      (c as FrameNode).layoutMode === 'HORIZONTAL'
    ) as FrameNode | undefined;

    if (horizontalChild) {
      const innerColumns = horizontalChild.children.filter(c => c.visible !== false).length;
      return {
        layoutMode: 'flex',
        columns: innerColumns,
        gap: toCssValue(horizontalChild.itemSpacing),
        rowGap: toCssValue(node.itemSpacing),
        columnGap: null,
        itemMinWidth: estimateItemMinWidth(horizontalChild, innerColumns),
      };
    }

    return {
      layoutMode: 'flex',
      columns: 1,
      gap: toCssValue(node.itemSpacing),
      rowGap: null,
      columnGap: null,
      itemMinWidth: null,
    };
  }

  // No auto-layout → absolute positioning
  const columns = estimateColumnsFromAbsoluteChildren(node);
  return {
    layoutMode: 'absolute',
    columns,
    gap: estimateGapFromAbsoluteChildren(node),
    rowGap: null,
    columnGap: null,
    itemMinWidth: null,
  };
}

/**
 * Estimate column count from wrapping auto-layout children.
 * Counts how many children fit in the first "row" (similar Y position).
 */
function estimateColumnsFromChildren(node: FrameNode): number {
  const visible = node.children.filter(c => c.visible !== false && c.absoluteBoundingBox);
  if (visible.length <= 1) return 1;

  const firstY = visible[0].absoluteBoundingBox!.y;
  const tolerance = 5; // px
  let columnsInFirstRow = 0;

  for (const child of visible) {
    if (Math.abs(child.absoluteBoundingBox!.y - firstY) <= tolerance) {
      columnsInFirstRow++;
    } else {
      break;
    }
  }

  return Math.max(1, columnsInFirstRow);
}

/**
 * Estimate column count from absolutely-positioned children.
 * Groups children by Y position (same row = same Y ± tolerance).
 */
function estimateColumnsFromAbsoluteChildren(node: FrameNode): number {
  const visible = node.children
    .filter(c => c.visible !== false && c.absoluteBoundingBox)
    .sort((a, b) => a.absoluteBoundingBox!.y - b.absoluteBoundingBox!.y);

  if (visible.length <= 1) return 1;

  const firstY = visible[0].absoluteBoundingBox!.y;
  const tolerance = 10;
  let count = 0;

  for (const child of visible) {
    if (Math.abs(child.absoluteBoundingBox!.y - firstY) <= tolerance) {
      count++;
    } else {
      break;
    }
  }

  return Math.max(1, count);
}

/**
 * Estimate gap between absolutely-positioned children on the same row.
 */
function estimateGapFromAbsoluteChildren(node: FrameNode): string | null {
  const visible = node.children
    .filter(c => c.visible !== false && c.absoluteBoundingBox)
    .sort((a, b) => a.absoluteBoundingBox!.x - b.absoluteBoundingBox!.x);

  if (visible.length < 2) return null;

  // Use the first row of children
  const firstY = visible[0].absoluteBoundingBox!.y;
  const tolerance = 10;
  const firstRow = visible.filter(c =>
    Math.abs(c.absoluteBoundingBox!.y - firstY) <= tolerance
  );

  if (firstRow.length < 2) return null;

  let totalGap = 0;
  for (let i = 0; i < firstRow.length - 1; i++) {
    const rightEdge = firstRow[i].absoluteBoundingBox!.x + firstRow[i].absoluteBoundingBox!.width;
    const nextLeft = firstRow[i + 1].absoluteBoundingBox!.x;
    totalGap += nextLeft - rightEdge;
  }

  const avgGap = Math.round(totalGap / (firstRow.length - 1));
  return avgGap > 0 ? toCssValue(avgGap) : null;
}

/**
 * Estimate minimum item width from a horizontal layout's children.
 */
function estimateItemMinWidth(node: FrameNode, columns: number): string | null {
  if (columns <= 1) return null;
  const visible = node.children.filter(c => c.visible !== false && c.absoluteBoundingBox);
  if (visible.length === 0) return null;

  const widths = visible.map(c => c.absoluteBoundingBox!.width);
  const minWidth = Math.min(...widths);
  return toCssValue(Math.round(minWidth));
}
