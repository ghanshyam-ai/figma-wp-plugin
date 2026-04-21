import { BreakpointClass, FrameInfo, ResponsiveMap, ResponsivePair, UnmatchedFrame } from './types';
import { slugify } from './utils';

/**
 * Classify a frame width into a breakpoint category.
 */
export function classifyBreakpoint(width: number): BreakpointClass {
  if (width <= 480) return 'mobile';
  if (width <= 820) return 'tablet';
  if (width <= 1440) return 'desktop';
  return 'large';
}

/**
 * Common suffixes/keywords that denote breakpoints in frame names.
 */
const BREAKPOINT_PATTERNS = [
  /[-–—\s]*(desktop|mobile|tablet|responsive|phone|web|lg|md|sm|xs)/gi,
  /[-–—\s]*(\d{3,4})\s*(?:px)?$/gi,   // trailing width numbers like "1440" or "375px"
  /\((?:desktop|mobile|tablet|phone)\)/gi,
  /\s+$/g,
];

/**
 * Normalize a frame name by stripping breakpoint identifiers.
 * "About - Desktop" → "about"
 * "Homepage 1440" → "homepage"
 * "Services (Mobile)" → "services"
 */
export function normalizeFrameName(name: string): string {
  let normalized = name;
  for (const pattern of BREAKPOINT_PATTERNS) {
    normalized = normalized.replace(pattern, '');
  }
  return normalized.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Match desktop and mobile frames by name similarity.
 * Returns ResponsiveMap with matched pairs and unmatched frames.
 */
export function matchResponsiveFrames(allFrames: FrameInfo[]): ResponsiveMap {
  // Group frames by normalized name
  const groups = new Map<string, FrameInfo[]>();

  for (const frame of allFrames) {
    const normalized = normalizeFrameName(frame.name);
    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(frame);
  }

  const matchedPairs: ResponsivePair[] = [];
  const unmatchedFrames: UnmatchedFrame[] = [];
  const matchedIds = new Set<string>();

  for (const [baseName, frames] of groups) {
    if (frames.length === 1) {
      // Single frame — no responsive pair
      const frame = frames[0];
      if (frame.breakpoint === 'desktop' || frame.breakpoint === 'large') {
        // Desktop without mobile → still a valid page, just no responsive data
        matchedPairs.push({
          pageName: frame.name,
          pageSlug: slugify(baseName || frame.name),
          desktop: { frameId: frame.id, frameName: frame.name, width: frame.width },
          mobile: null,
          tablet: null,
          matchConfidence: 1.0,
          matchMethod: 'name-similarity',
        });
        matchedIds.add(frame.id);
      } else {
        unmatchedFrames.push({
          frameId: frame.id,
          frameName: frame.name,
          width: frame.width,
          breakpoint: frame.breakpoint,
          reason: 'no desktop counterpart found',
        });
        matchedIds.add(frame.id);
      }
      continue;
    }

    // Multiple frames with same base name — match by breakpoint
    const desktop = frames.find(f => f.breakpoint === 'desktop' || f.breakpoint === 'large');
    const mobile = frames.find(f => f.breakpoint === 'mobile');
    const tablet = frames.find(f => f.breakpoint === 'tablet');

    if (desktop) {
      matchedPairs.push({
        pageName: desktop.name,
        pageSlug: slugify(baseName || desktop.name),
        desktop: { frameId: desktop.id, frameName: desktop.name, width: desktop.width },
        mobile: mobile ? { frameId: mobile.id, frameName: mobile.name, width: mobile.width } : null,
        tablet: tablet ? { frameId: tablet.id, frameName: tablet.name, width: tablet.width } : null,
        matchConfidence: 0.95,
        matchMethod: 'name-similarity',
      });
      matchedIds.add(desktop.id);
      if (mobile) matchedIds.add(mobile.id);
      if (tablet) matchedIds.add(tablet.id);
    }

    // Any remaining frames in this group
    for (const frame of frames) {
      if (!matchedIds.has(frame.id)) {
        unmatchedFrames.push({
          frameId: frame.id,
          frameName: frame.name,
          width: frame.width,
          breakpoint: frame.breakpoint,
          reason: 'could not pair with desktop frame',
        });
        matchedIds.add(frame.id);
      }
    }
  }

  // Catch any frames not processed
  for (const frame of allFrames) {
    if (!matchedIds.has(frame.id)) {
      unmatchedFrames.push({
        frameId: frame.id,
        frameName: frame.name,
        width: frame.width,
        breakpoint: frame.breakpoint,
        reason: 'not matched by any method',
      });
    }
  }

  return { matchedPairs, unmatchedFrames };
}

/**
 * Content-based matching fallback: compare child names between two frames.
 * Returns overlap ratio (0-1). >0.6 = likely same page at different breakpoints.
 */
export function computeContentOverlap(frameA: FrameNode, frameB: FrameNode): number {
  const namesA = new Set(frameA.children.map(c => c.name.toLowerCase()));
  const namesB = new Set(frameB.children.map(c => c.name.toLowerCase()));

  if (namesA.size === 0 || namesB.size === 0) return 0;

  let overlap = 0;
  for (const name of namesA) {
    if (namesB.has(name)) overlap++;
  }

  const unionSize = new Set([...namesA, ...namesB]).size;
  return unionSize > 0 ? overlap / unionSize : 0;
}
