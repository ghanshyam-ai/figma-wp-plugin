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
          fixHint: [
            'Select the section frame in the Figma canvas.',
            'Open the right panel → Auto layout → click the "+" icon.',
            'Choose Vertical (most sections) or Horizontal direction.',
            'Set padding (top/right/bottom/left) and gap to match the design intent.',
            'Re-run validation — the warning should disappear.',
          ],
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
        fixHint: [
          'Click the layer in the canvas — it will be selected automatically.',
          'In the Layers panel (left), double-click the name and rename it.',
          'Use semantic names: "Hero", "Features", "CTA", "Footer" for sections; "Heading", "Subheading", "Primary CTA" for elements.',
          'Avoid generic names: Frame, Group, Rectangle, Vector, etc.',
          'Good names become ACF layout keys downstream — they directly affect the WordPress output.',
        ],
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
        fixHint: [
          `Install "${family}" in this style: ${style}.`,
          'On macOS: open Font Book → File → Add Fonts → select the font file.',
          'For Google Fonts: download from fonts.google.com and install locally, OR set up Figma\'s font sync via the desktop app.',
          'Alternative: replace this font in the design with one that\'s already installed.',
          'Restart Figma after installing — the font won\'t appear until then.',
        ],
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
        fixHint: [
          `You have ${unique[i]}px and ${unique[i + 1]}px used as spacing — likely the same value off by 1-2px.`,
          `Pick one value (suggested: ${Math.round((unique[i] + unique[i + 1]) / 2)}px) and apply it everywhere.`,
          'Best practice: define a Figma Variable in a "Spacing" collection (e.g. spacing/md = 32) and bind padding/gap to it.',
          'Variables propagate one rename across the whole file and become CSS custom properties in the export.',
          'This is informational only — export will still work, but the WordPress theme will be tidier with consistent values.',
        ],
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
                  fixHint: [
                    `Image bounds: ${Math.round(bounds.width)}×${Math.round(bounds.height)}px — that\'s why it\'s heavy.`,
                    'Replace the source image with a pre-compressed version (TinyPNG, ImageOptim, Squoosh).',
                    'For background images, a 1920px or 2560px max width is usually enough — anything larger wastes bandwidth.',
                    'If the image will be cropped at runtime, downscale BEFORE placing in Figma.',
                    'After replacing, re-run validation — the warning should disappear.',
                  ],
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
        fixHint: [
          `"${sorted[i].name}" extends ${Math.round(overlap)}px below where "${sorted[i + 1].name}" starts.`,
          'If this is intentional (e.g. a card overlaps the next section by design), no action needed — the plugin emits a negative margin-top and z-index.',
          'If unintentional, drag one of the sections so their bounding boxes don\'t overlap on the Y axis.',
          'Tip: in Figma, holding Shift while dragging snaps to integer Y values.',
          'After moving, re-run validation to confirm.',
        ],
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
      fixHint: [
        'Without a mobile frame, the plugin can only guess at how the design adapts below 768px.',
        'Best practice: design at least one mobile frame (375px wide) per page.',
        'Name it consistently with the desktop counterpart: e.g. "Home — Desktop" + "Home — Mobile" so the plugin can pair them automatically.',
        'Then go back to Step 1 and select both frames before re-running validation.',
        'You can export desktop-only — the agent will derive mobile from CSS-driven scaling — but extracted values are always more accurate than calculated ones.',
      ],
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
            fixHint: [
              'The text node\'s bounding box extends past its parent — content will be cut off in the export.',
              'Option 1: Resize the parent frame so the text fits.',
              'Option 2: Set the text\'s "Auto-resize" to "Width and Height" or "Height" so it grows with the content.',
              'Option 3: Shorten the copy if it\'s placeholder text.',
              'In auto-layout containers, also ensure the text\'s "Fill container" option matches the parent\'s direction.',
            ],
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
