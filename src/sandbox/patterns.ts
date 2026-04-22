import {
  ComponentPattern, RepeaterInfo, RepeaterItem, NavigationInfo, SectionType,
} from './types';
import { slugify, isDefaultLayerName } from './utils';
import { hasImageFill } from './color';

/**
 * Compute a loose "structure fingerprint" for a node. Two children with the
 * same fingerprint are treated as siblings of the same repeater template
 * (same card layout repeated 3 times, etc.). We deliberately ignore text
 * content and specific sizes so minor variations still match.
 */
function structureFingerprint(node: SceneNode, depth: number = 0): string {
  const parts: string[] = [`T=${node.type}`];
  if (hasImageFill(node as any)) parts.push('IMG');

  if ('children' in node && depth < 2) {
    const childFps: string[] = [];
    for (const child of (node as FrameNode).children) {
      if (child.visible === false) continue;
      childFps.push(structureFingerprint(child, depth + 1));
    }
    childFps.sort();
    parts.push(`C=[${childFps.join(',')}]`);
  }
  return parts.join('|');
}

const REPEATER_NAME_HINTS = /\b(cards?|items?|list|grid|features?|services?|team|logos?|testimonials?|pricing|plans?|articles?|posts?|blog|faqs?)\b/i;

/**
 * Detect repeater groups inside a section. Conservative:
 *   - ≥3 children share a fingerprint, OR
 *   - ≥2 children share a fingerprint AND the parent name hints repetition
 *     AND the matching group covers ≥60% of visible children.
 *
 * The existing `elements` map is untouched — repeaters are an additive
 * signal the agent can opt into for cleaner ACF Repeater output.
 */
export function detectRepeaters(sectionNode: SceneNode): Record<string, RepeaterInfo> {
  const repeaters: Record<string, RepeaterInfo> = {};
  const usedKeys = new Set<string>();

  function keyFor(containerName: string): string {
    const base = containerName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      || `repeater_${Object.keys(repeaters).length + 1}`;
    if (!usedKeys.has(base)) {
      usedKeys.add(base);
      return base;
    }
    let i = 2;
    while (usedKeys.has(`${base}_${i}`)) i++;
    usedKeys.add(`${base}_${i}`);
    return `${base}_${i}`;
  }

  function walk(node: SceneNode, depth: number): boolean {
    if (depth > 5) return false;
    if (!('children' in node)) return false;

    const kids = (node as FrameNode).children.filter(c => c.visible !== false);
    if (kids.length >= 2) {
      const groups = new Map<string, SceneNode[]>();
      for (const k of kids) {
        const fp = structureFingerprint(k);
        if (!groups.has(fp)) groups.set(fp, []);
        groups.get(fp)!.push(k);
      }
      let bestGroup: SceneNode[] | null = null;
      for (const g of groups.values()) {
        if (!bestGroup || g.length > bestGroup.length) bestGroup = g;
      }
      if (bestGroup && bestGroup.length >= 2) {
        const isBigGroup = bestGroup.length >= 3;
        const hintMatch = REPEATER_NAME_HINTS.test(node.name || '');
        const dominates = bestGroup.length >= Math.ceil(kids.length * 0.6);
        if (isBigGroup || (hintMatch && dominates)) {
          const key = keyFor(node.name || 'repeater');
          repeaters[key] = {
            containerLayerName: node.name,
            itemCount: bestGroup.length,
            templateLayerName: bestGroup[0].name,
            items: bestGroup.map(extractRepeaterItem),
          };
          return true; // Don't recurse into repeater children
        }
      }
    }

    for (const c of kids) walk(c, depth + 1);
    return false;
  }

  if ('children' in sectionNode) {
    for (const c of (sectionNode as FrameNode).children) {
      if (c.visible !== false) walk(c, 0);
    }
  }
  return repeaters;
}

function extractRepeaterItem(node: SceneNode): RepeaterItem {
  const item: RepeaterItem = { texts: {} };
  let textIndex = 0;
  let firstImageName: string | null = null;
  let firstImageAlt: string | null = null;

  function walk(n: SceneNode) {
    if (n.visible === false) return;

    if (n.type === 'TEXT') {
      const t = n as TextNode;
      const clean = (t.name || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const role = clean && !/^(text|frame|group|rectangle)\d*$/.test(clean)
        ? clean : `text_${textIndex}`;
      if (t.characters) item.texts[role] = t.characters;
      textIndex++;
    }

    if (!firstImageName && hasImageFill(n as any)) {
      firstImageName = `${slugify(n.name || 'image')}.png`;
      if (n.name && !isDefaultLayerName(n.name)) {
        firstImageAlt = n.name.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
          .replace(/\b\w/g, c => c.toUpperCase());
      }
    }

    if (!item.linkUrl && 'reactions' in n) {
      const reactions = (n as any).reactions;
      if (Array.isArray(reactions)) {
        outer: for (const r of reactions) {
          const actions = r.actions || (r.action ? [r.action] : []);
          for (const a of actions) {
            if (a && a.type === 'URL' && a.url) { item.linkUrl = a.url; break outer; }
          }
        }
      }
    }

    if ('children' in n) {
      for (const c of (n as FrameNode).children) walk(c);
    }
  }
  walk(node);
  if (firstImageName) item.imageFile = firstImageName;
  if (firstImageAlt) item.alt = firstImageAlt;
  return item;
}

// ─────────────────────────────────────────────
// Component patterns: carousel / accordion / tabs / modal
// ─────────────────────────────────────────────

const CAROUSEL_RX = /\b(carousel|slider|swiper|gallery|slideshow)\b/i;
const ACCORDION_RX = /\b(accordion|faq|collapse|expander|collapsible)\b/i;
const TABS_RX = /\btabs?\b/i;
const MODAL_RX = /\b(modal|popup|dialog|overlay|lightbox)\b/i;

/**
 * Detect interactive component patterns. We favour explicit layer-name
 * matches over pure structural detection to keep false positives low.
 * When the name matches, confidence is 'high'; when inferred structurally,
 * confidence is 'low' and the agent should verify against the screenshot.
 */
export function detectComponentPatterns(sectionNode: SceneNode): ComponentPattern[] {
  const patterns: ComponentPattern[] = [];
  const seenNodeIds = new Set<string>();

  function addPattern(p: ComponentPattern) {
    if (seenNodeIds.has(p.rootNodeId)) return;
    seenNodeIds.add(p.rootNodeId);
    patterns.push(p);
  }

  function walk(node: SceneNode, depth: number) {
    if (depth > 6 || node.visible === false) return;
    const name = node.name || '';

    // MODAL — name-only detection (structural detection is too noisy).
    if (MODAL_RX.test(name) && 'children' in node) {
      addPattern({
        type: 'modal',
        rootNodeId: node.id,
        rootNodeName: node.name,
        confidence: 'high',
      });
      return; // don't recurse into modal internals
    }

    if ('children' in node) {
      const frame = node as FrameNode;
      const kids = frame.children.filter(c => c.visible !== false);

      // CAROUSEL: explicit name OR (horizontal + clipsContent + ≥3 similar children)
      const nameCarousel = CAROUSEL_RX.test(name);
      const horizontalClipped = frame.layoutMode === 'HORIZONTAL' && frame.clipsContent === true;
      if (nameCarousel || horizontalClipped) {
        if (kids.length >= 3) {
          const fp0 = structureFingerprint(kids[0]);
          const matching = kids.filter(k => structureFingerprint(k) === fp0).length;
          if (matching >= 3) {
            addPattern({
              type: 'carousel',
              rootNodeId: node.id,
              rootNodeName: node.name,
              itemCount: matching,
              confidence: nameCarousel ? 'high' : 'low',
              meta: {
                layoutMode: frame.layoutMode,
                clipsContent: frame.clipsContent,
                itemSpacing: frame.itemSpacing ?? null,
              },
            });
            return;
          }
        }
      }

      // ACCORDION: name match + ≥2 child items
      if (ACCORDION_RX.test(name) && kids.length >= 2) {
        const items: Array<{ question: string; answer?: string }> = [];
        for (const k of kids) {
          const all = collectAllText(k);
          if (all.length > 0) {
            items.push({ question: all[0], answer: all.slice(1).join(' ') || undefined });
          }
        }
        if (items.length >= 2) {
          addPattern({
            type: 'accordion',
            rootNodeId: node.id,
            rootNodeName: node.name,
            itemCount: items.length,
            confidence: 'high',
            meta: { items },
          });
          return;
        }
      }

      // TABS: name match + ≥2 children
      if (TABS_RX.test(name) && kids.length >= 2) {
        addPattern({
          type: 'tabs',
          rootNodeId: node.id,
          rootNodeName: node.name,
          itemCount: kids.length,
          confidence: 'high',
        });
        return;
      }

      for (const c of kids) walk(c, depth + 1);
    }
  }

  walk(sectionNode, 0);
  return patterns;
}

function collectAllText(node: SceneNode): string[] {
  const out: string[] = [];
  function walk(n: SceneNode) {
    if (n.visible === false) return;
    if (n.type === 'TEXT') {
      const chars = ((n as TextNode).characters || '').trim();
      if (chars) out.push(chars);
    }
    if ('children' in n) {
      for (const c of (n as FrameNode).children) walk(c);
    }
  }
  walk(node);
  return out;
}

// ─────────────────────────────────────────────
// Navigation extraction
// ─────────────────────────────────────────────

/**
 * Detect navigation links inside a section — short text nodes that look
 * like menu items (≤40 chars, font size ≤22px). Returns null when there
 * are fewer than 2 such links (one link isn't a menu).
 */
export function detectNavigation(sectionNode: SceneNode): NavigationInfo | null {
  const links: Array<{ label: string; href?: string | null }> = [];
  const seen = new Set<string>();

  function walk(node: SceneNode, depth: number) {
    if (depth > 6 || node.visible === false) return;
    if (node.type === 'TEXT') {
      const t = node as TextNode;
      const text = (t.characters || '').trim();
      if (!text || text.length > 40) return;
      const fs = t.fontSize !== figma.mixed ? (t.fontSize as number) : 16;
      if (fs > 22) return;
      if (seen.has(text.toLowerCase())) return;
      seen.add(text.toLowerCase());

      let href: string | null = null;
      const reactions = (t as any).reactions;
      if (Array.isArray(reactions)) {
        outer: for (const r of reactions) {
          const actions = r.actions || (r.action ? [r.action] : []);
          for (const a of actions) {
            if (a && a.type === 'URL' && a.url) { href = a.url; break outer; }
          }
        }
      }
      links.push({ label: text, href });
      return;
    }
    if ('children' in node) {
      for (const c of (node as FrameNode).children) walk(c, depth + 1);
    }
  }
  walk(sectionNode, 0);
  if (links.length < 2) return null;
  return { links };
}

// ─────────────────────────────────────────────
// Section semantic role
// ─────────────────────────────────────────────

interface InferTypeParams {
  sectionIndex: number;
  totalSections: number;
  isFormSection: boolean;
  patterns: ComponentPattern[];
  repeaters: Record<string, RepeaterInfo>;
  elements: Record<string, unknown>;
  textContentInOrder: Array<{ text: string; fontSize: number; role: string }>;
  layerName: string;
  sectionHeight: number;
  isGlobal?: boolean;
  globalRole?: 'header' | 'footer' | null;
}

/**
 * Infer the semantic type of a section. Pure inference — returns 'generic'
 * + 'low' confidence when nothing matches clearly. The agent should treat
 * 'high' confidence as authoritative and 'low' as a hint only.
 */
export function inferSectionType(p: InferTypeParams): { type: SectionType; confidence: 'high' | 'low' } {
  // Global header/footer overrides everything
  if (p.isGlobal && p.globalRole === 'header') return { type: 'header', confidence: 'high' };
  if (p.isGlobal && p.globalRole === 'footer') return { type: 'footer', confidence: 'high' };

  const name = (p.layerName || '').toLowerCase();
  const explicit: Array<{ rx: RegExp; type: SectionType }> = [
    { rx: /\bhero\b/, type: 'hero' },
    { rx: /\b(features?|benefits?|services?)\b/, type: 'features' },
    { rx: /\btestimonials?\b/, type: 'testimonials' },
    { rx: /\b(cta|call[- ]?to[- ]?action)\b/, type: 'cta' },
    { rx: /\b(faqs?|frequently[- ]asked)\b/, type: 'faq' },
    { rx: /\b(pricing|plans?)\b/, type: 'pricing' },
    { rx: /\bcontact\b/, type: 'contact' },
    { rx: /\b(logos?|clients?|partners?|brands?)\b/, type: 'logos' },
    { rx: /\bfooter\b/, type: 'footer' },
    { rx: /\b(header|nav|navbar|navigation)\b/, type: 'header' },
    { rx: /\b(blog|articles?|news|posts?)\b/, type: 'blog_grid' },
  ];
  for (const { rx, type } of explicit) {
    if (rx.test(name)) return { type, confidence: 'high' };
  }

  // Pattern signals
  if (p.patterns.some(pt => pt.type === 'accordion')) return { type: 'faq', confidence: 'high' };
  if (p.isFormSection) return { type: 'contact', confidence: 'high' };

  // Repeater content shape
  const repKeys = Object.keys(p.repeaters);
  if (repKeys.length > 0) {
    const rep = p.repeaters[repKeys[0]];
    const first = rep.items[0];
    if (first) {
      const hasImage = !!first.imageFile;
      const textVals = Object.values(first.texts);
      const textKeys = Object.keys(first.texts);
      const joined = textVals.join(' ');
      const hasPrice = /[$€£]\s*\d|\b\d+\s*(\/(mo|yr)|per (month|year))\b/i.test(joined);
      const longQuote = textVals.some(v => (v || '').length > 100);
      const isLogoOnly = hasImage && textKeys.length === 0;
      const hasDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/i.test(joined)
                   || /\d{4}-\d{2}-\d{2}/.test(joined)
                   || /\b(min read|reading time)\b/i.test(joined);

      if (hasPrice) return { type: 'pricing', confidence: 'low' };
      if (isLogoOnly) return { type: 'logos', confidence: 'low' };
      if (hasDate) return { type: 'blog_grid', confidence: 'low' };
      if (longQuote) return { type: 'testimonials', confidence: 'low' };
      if (hasImage && textKeys.length >= 2) return { type: 'features', confidence: 'low' };
    }
  }

  // First-section hero heuristic
  if (p.sectionIndex === 0) {
    const hasBigHeading = p.textContentInOrder.some(t => t.fontSize >= 40);
    const hasButton = Object.keys(p.elements).some(k => /button|cta|btn/i.test(k));
    const hasImage = Object.keys(p.elements).some(k => /image|photo|hero/i.test(k) || k === 'background_image');
    if (hasBigHeading && (hasButton || hasImage)) return { type: 'hero', confidence: 'low' };
  }

  // Short section with heading + button → CTA
  const hasButtonEl = Object.keys(p.elements).filter(k => /button|cta|btn/i.test(k)).length >= 1;
  const textCount = p.textContentInOrder.length;
  if (hasButtonEl && textCount <= 3 && repKeys.length === 0) {
    return { type: 'cta', confidence: 'low' };
  }

  return { type: 'generic', confidence: 'low' };
}

// ─────────────────────────────────────────────
// Cross-page fingerprint helpers (for global detection in extractor.ts)
// ─────────────────────────────────────────────

/**
 * Normalize a section's layer name for cross-page matching.
 * "Header — Desktop", "Header 1440", "Header" all collapse to "header".
 */
export function normalizeSectionName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/\s*[—–\-]\s*(desktop|mobile|tablet)\b/gi, '')
    .replace(/\s+\d{3,4}$/g, '')
    .trim();
}

/**
 * Given a total section count and the index of a global section, guess
 * whether it is a header (top, thin) or footer (bottom) — or null when
 * neither fits.
 */
export function classifyGlobalRole(
  sectionIndex: number,
  totalSections: number,
  sectionHeight: number,
): 'header' | 'footer' | null {
  if (sectionIndex <= 1 && sectionHeight <= 200) return 'header';
  if (sectionIndex >= totalSections - 2) return 'footer';
  return null;
}
