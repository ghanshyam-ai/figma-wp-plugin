import { ValidationResult, FrameInfo } from './types';
import { isDefaultLayerName } from './utils';

/**
 * Run all 9 validation checks against selected frames.
 */
export async function runAllValidations(frameIds: string[]): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (const frameId of frameIds) {
    const node = figma.getNodeById(frameId);
    if (!node || node.type !== 'FRAME') continue;

    const frame = node as FrameNode;
    const sections = frame.children.filter(c =>
      c.visible !== false &&
      (c.type === 'FRAME' || c.type === 'COMPONENT' || c.type === 'INSTANCE' || c.type === 'GROUP')
    );

    // Check 1: Missing auto-layout on sections
    results.push(...checkAutoLayout(sections, frame.name));

    // Check 2: Default layer names
    results.push(...checkLayerNames(sections, frame.name));

    // Check 3: Missing fonts
    results.push(...await checkFonts(frame));

    // Check 4: Inconsistent spacing
    results.push(...checkSpacingConsistency(frame));

    // Check 5: Oversized images
    results.push(...checkOversizedImages(frame));

    // Check 6: Overlapping sections
    results.push(...checkOverlaps(sections, frame.name));

    // Check 9: Text overflow
    results.push(...checkTextOverflow(frame));
  }

  // Check 7: Missing responsive frames (cross-frame check)
  results.push(...checkResponsiveFrames(frameIds));

  return results;
}

// ─── Check 1: Missing Auto-Layout ───

function checkAutoLayout(sections: SceneNode[], frameName: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  for (const section of sections) {
    if (section.type === 'FRAME' || section.type === 'COMPONENT' || section.type === 'INSTANCE') {
      const frame = section as FrameNode;
      if (!frame.layoutMode || frame.layoutMode === 'NONE') {
        results.push({
          severity: 'warning',
          check: 'auto-layout',
          message: `Section "${section.name}" uses absolute positioning. Spacing values will be approximate.`,
          sectionName: section.name,
          nodeId: section.id,
          nodeName: section.name,
          suggestion: 'Apply auto-layout to this section for precise spacing extraction.',
        });
      }
    }
  }
  return results;
}

// ─── Check 2: Default Layer Names ───

function checkLayerNames(sections: SceneNode[], frameName: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  function walk(node: SceneNode, depth: number) {
    if (isDefaultLayerName(node.name)) {
      results.push({
        severity: depth === 0 ? 'warning' : 'info',
        check: 'layer-names',
        message: `Layer "${node.name}" has a default Figma name${depth === 0 ? ' (section level)' : ''}.`,
        sectionName: frameName,
        nodeId: node.id,
        nodeName: node.name,
        suggestion: 'Rename to a descriptive name (e.g., "Hero Section", "Features Grid").',
      });
    }
    if ('children' in node && depth < 2) {
      for (const child of (node as FrameNode).children) {
        walk(child, depth + 1);
      }
    }
  }

  for (const section of sections) {
    walk(section, 0);
  }
  return results;
}

// ─── Check 3: Missing Fonts ───

async function checkFonts(frame: FrameNode): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const checkedFonts = new Set<string>();

  function collectFontNames(node: SceneNode) {
    if (node.type === 'TEXT') {
      const fontName = node.fontName;
      if (fontName !== figma.mixed && fontName) {
        const key = `${fontName.family}::${fontName.style}`;
        if (!checkedFonts.has(key)) {
          checkedFonts.add(key);
        }
      }
    }
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        collectFontNames(child);
      }
    }
  }

  collectFontNames(frame);

  for (const fontKey of checkedFonts) {
    const [family, style] = fontKey.split('::');
    try {
      await figma.loadFontAsync({ family, style });
    } catch {
      results.push({
        severity: 'error',
        check: 'fonts',
        message: `Font "${family} ${style}" is not available. Text extraction may fail.`,
        sectionName: frame.name,
        suggestion: 'Install the font or replace it in the design.',
      });
    }
  }
  return results;
}

// ─── Check 4: Inconsistent Spacing ───

function checkSpacingConsistency(frame: FrameNode): ValidationResult[] {
  const results: ValidationResult[] = [];
  const spacingValues: number[] = [];

  function walk(node: SceneNode) {
    if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      const f = node as FrameNode;
      if (f.layoutMode && f.layoutMode !== 'NONE') {
        spacingValues.push(f.paddingTop, f.paddingBottom, f.paddingLeft, f.paddingRight, f.itemSpacing);
      }
    }
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        walk(child);
      }
    }
  }
  walk(frame);

  // Find near-duplicates
  const unique = [...new Set(spacingValues.filter(v => v > 0))].sort((a, b) => a - b);
  for (let i = 0; i < unique.length - 1; i++) {
    const diff = unique[i + 1] - unique[i];
    if (diff > 0 && diff <= 2) {
      results.push({
        severity: 'info',
        check: 'spacing-consistency',
        message: `Near-duplicate spacing: ${unique[i]}px and ${unique[i + 1]}px — likely same intent?`,
        sectionName: frame.name,
        suggestion: `Consider standardizing to ${Math.round((unique[i] + unique[i + 1]) / 2)}px.`,
      });
    }
  }
  return results;
}

// ─── Check 5: Oversized Images ───

function checkOversizedImages(frame: FrameNode): ValidationResult[] {
  const results: ValidationResult[] = [];

  function walk(node: SceneNode) {
    if ('fills' in node) {
      const fills = (node as any).fills;
      if (Array.isArray(fills)) {
        for (const fill of fills) {
          if (fill.type === 'IMAGE' && fill.visible !== false) {
            const bounds = node.absoluteBoundingBox;
            if (bounds) {
              // Estimate raw image size (RGBA at 2x): w * 2 * h * 2 * 4 bytes
              // Estimate at 1x export: width * height * 4 (RGBA bytes)
              const estimatedBytes = bounds.width * bounds.height * 4;
              const estimatedMB = estimatedBytes / (1024 * 1024);
              if (estimatedMB > 5) {
                results.push({
                  severity: 'warning',
                  check: 'image-size',
                  message: `Image in "${node.name}" is estimated at ${estimatedMB.toFixed(1)}MB at 1x export.`,
                  nodeId: node.id,
                  nodeName: node.name,
                  suggestion: 'Consider reducing image dimensions or export scale.',
                });
              }
            }
          }
        }
      }
    }
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        walk(child);
      }
    }
  }
  walk(frame);
  return results;
}

// ─── Check 6: Overlapping Sections ───

function checkOverlaps(sections: SceneNode[], frameName: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  const sorted = [...sections]
    .filter(s => s.absoluteBoundingBox)
    .sort((a, b) => a.absoluteBoundingBox!.y - b.absoluteBoundingBox!.y);

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i].absoluteBoundingBox!;
    const next = sorted[i + 1].absoluteBoundingBox!;
    const overlap = (curr.y + curr.height) - next.y;
    if (overlap > 0) {
      results.push({
        severity: 'warning',
        check: 'overlap',
        message: `Section "${sorted[i].name}" overlaps with "${sorted[i + 1].name}" by ${Math.round(overlap)}px.`,
        sectionName: sorted[i].name,
        nodeId: sorted[i].id,
        suggestion: 'The plugin will record this as a negative margin. Verify the visual result.',
      });
    }
  }
  return results;
}

// ─── Check 7: Missing Responsive Frames ───

function checkResponsiveFrames(frameIds: string[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  const frames = frameIds
    .map(id => figma.getNodeById(id))
    .filter(n => n && n.type === 'FRAME') as FrameNode[];

  const desktopFrames = frames.filter(f => f.width > 1024);
  const mobileFrames = frames.filter(f => f.width <= 480);

  if (desktopFrames.length > 0 && mobileFrames.length === 0) {
    results.push({
      severity: 'warning',
      check: 'responsive',
      message: `Only desktop frames selected (no mobile frames). Responsive values will be calculated, not extracted.`,
      suggestion: 'Include mobile (375px) frames for exact responsive values.',
    });
  }
  return results;
}

// ─── Check 9: Text Overflow ───

function checkTextOverflow(frame: FrameNode): ValidationResult[] {
  const results: ValidationResult[] = [];

  function walk(node: SceneNode) {
    if (node.type === 'TEXT' && node.absoluteBoundingBox && node.parent && 'absoluteBoundingBox' in node.parent) {
      const textBounds = node.absoluteBoundingBox;
      const parentBounds = (node.parent as FrameNode).absoluteBoundingBox;
      if (parentBounds) {
        const overflowRight = (textBounds.x + textBounds.width) - (parentBounds.x + parentBounds.width);
        const overflowBottom = (textBounds.y + textBounds.height) - (parentBounds.y + parentBounds.height);
        if (overflowRight > 5 || overflowBottom > 5) {
          results.push({
            severity: 'warning',
            check: 'text-overflow',
            message: `Text "${node.name}" overflows its container by ${Math.max(Math.round(overflowRight), Math.round(overflowBottom))}px.`,
            nodeId: node.id,
            nodeName: node.name,
            suggestion: 'Resize the text container or reduce text content.',
          });
        }
      }
    }
    if ('children' in node) {
      for (const child of (node as FrameNode).children) {
        walk(child);
      }
    }
  }
  walk(frame);
  return results;
}
