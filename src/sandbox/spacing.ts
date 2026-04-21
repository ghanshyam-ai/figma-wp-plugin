import { SectionStyles } from './types';
import { toCssValue } from './utils';

/**
 * Extract spacing from an auto-layout frame.
 * These values map 1:1 to CSS — high confidence.
 */
export function extractAutoLayoutSpacing(node: FrameNode): {
  spacingSource: 'auto-layout';
  sectionStyles: Partial<SectionStyles>;
  itemSpacing: string | null;
} {
  return {
    spacingSource: 'auto-layout',
    sectionStyles: {
      paddingTop: toCssValue(node.paddingTop),
      paddingBottom: toCssValue(node.paddingBottom),
      paddingLeft: toCssValue(node.paddingLeft),
      paddingRight: toCssValue(node.paddingRight),
    },
    itemSpacing: toCssValue(node.itemSpacing),
  };
}

/**
 * Extract spacing from an absolutely-positioned frame by computing
 * from children's bounding boxes. These values are approximate.
 */
export function extractAbsoluteSpacing(node: FrameNode): {
  spacingSource: 'absolute-coordinates';
  sectionStyles: Partial<SectionStyles>;
  itemSpacing: string | null;
} {
  const parentBounds = node.absoluteBoundingBox;
  if (!parentBounds) {
    return {
      spacingSource: 'absolute-coordinates',
      sectionStyles: {
        paddingTop: null,
        paddingBottom: null,
        paddingLeft: null,
        paddingRight: null,
      },
      itemSpacing: null,
    };
  }

  const children = node.children
    .filter(c => c.visible !== false && c.absoluteBoundingBox)
    .sort((a, b) => a.absoluteBoundingBox!.y - b.absoluteBoundingBox!.y);

  if (children.length === 0) {
    return {
      spacingSource: 'absolute-coordinates',
      sectionStyles: {
        paddingTop: null,
        paddingBottom: null,
        paddingLeft: null,
        paddingRight: null,
      },
      itemSpacing: null,
    };
  }

  const firstChild = children[0].absoluteBoundingBox!;
  const lastChild = children[children.length - 1].absoluteBoundingBox!;

  const paddingTop = firstChild.y - parentBounds.y;
  const paddingBottom = (parentBounds.y + parentBounds.height) - (lastChild.y + lastChild.height);

  // Compute left padding from the leftmost child
  const leftMost = Math.min(...children.map(c => c.absoluteBoundingBox!.x));
  const paddingLeft = leftMost - parentBounds.x;

  // Compute right padding from the rightmost child
  const rightMost = Math.max(...children.map(c => c.absoluteBoundingBox!.x + c.absoluteBoundingBox!.width));
  const paddingRight = (parentBounds.x + parentBounds.width) - rightMost;

  // Estimate vertical gap from consecutive children
  let totalGap = 0;
  let gapCount = 0;
  for (let i = 0; i < children.length - 1; i++) {
    const currBottom = children[i].absoluteBoundingBox!.y + children[i].absoluteBoundingBox!.height;
    const nextTop = children[i + 1].absoluteBoundingBox!.y;
    const gap = nextTop - currBottom;
    if (gap > 0) {
      totalGap += gap;
      gapCount++;
    }
  }
  const avgGap = gapCount > 0 ? Math.round(totalGap / gapCount) : 0;

  return {
    spacingSource: 'absolute-coordinates',
    sectionStyles: {
      paddingTop: toCssValue(Math.max(0, Math.round(paddingTop))),
      paddingBottom: toCssValue(Math.max(0, Math.round(paddingBottom))),
      paddingLeft: toCssValue(Math.max(0, Math.round(paddingLeft))),
      paddingRight: toCssValue(Math.max(0, Math.round(paddingRight))),
    },
    itemSpacing: avgGap > 0 ? toCssValue(avgGap) : null,
  };
}

/**
 * Collect all spacing values used in a node tree.
 * Returns sorted array of { value, count }.
 */
export function collectSpacing(root: SceneNode): { value: number; count: number }[] {
  const spacingMap: Record<number, number> = {};

  function addValue(v: number) {
    if (v > 0 && v < 1000) {
      const rounded = Math.round(v);
      spacingMap[rounded] = (spacingMap[rounded] || 0) + 1;
    }
  }

  function walk(node: SceneNode) {
    if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      const frame = node as FrameNode;
      if (frame.layoutMode && frame.layoutMode !== 'NONE') {
        addValue(frame.paddingTop);
        addValue(frame.paddingBottom);
        addValue(frame.paddingLeft);
        addValue(frame.paddingRight);
        addValue(frame.itemSpacing);
      }
    }
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        walk(child);
      }
    }
  }

  walk(root);

  return Object.entries(spacingMap)
    .map(([value, count]) => ({ value: Number(value), count }))
    .sort((a, b) => a.value - b.value);
}
