import { InteractionSpec } from './types';
import { rgbToHex, extractBackgroundColor } from './color';
import { toCssValue } from './utils';

/**
 * Map Figma trigger type to our simplified trigger string.
 */
function mapTrigger(triggerType: string): InteractionSpec['trigger'] | null {
  switch (triggerType) {
    case 'ON_HOVER': return 'hover';
    case 'ON_CLICK': return 'click';
    case 'ON_PRESS': return 'press';
    case 'MOUSE_ENTER': return 'mouse-enter';
    case 'MOUSE_LEAVE': return 'mouse-leave';
    default: return null;
  }
}

/**
 * Map Figma easing type to CSS transition-timing-function.
 */
function mapEasing(easing: any): string {
  if (!easing) return 'ease';
  switch (easing.type) {
    case 'EASE_IN': return 'ease-in';
    case 'EASE_OUT': return 'ease-out';
    case 'EASE_IN_AND_OUT': return 'ease-in-out';
    case 'LINEAR': return 'linear';
    case 'CUSTOM_CUBIC_BEZIER': {
      const b = easing.easingFunctionCubicBezier;
      if (b) return `cubic-bezier(${b.x1}, ${b.y1}, ${b.x2}, ${b.y2})`;
      return 'ease';
    }
    default: return 'ease';
  }
}

/**
 * Diff the visual properties between a source node and a destination node.
 * Returns a record of CSS property changes.
 */
function diffNodeStyles(
  source: SceneNode,
  dest: SceneNode
): Record<string, { from: string; to: string }> {
  const changes: Record<string, { from: string; to: string }> = {};

  // Background color
  const srcBg = extractBackgroundColor(source as any);
  const destBg = extractBackgroundColor(dest as any);
  if (srcBg && destBg && srcBg !== destBg) {
    changes.backgroundColor = { from: srcBg, to: destBg };
  }

  // Opacity
  if ('opacity' in source && 'opacity' in dest) {
    const srcOp = (source as any).opacity;
    const destOp = (dest as any).opacity;
    if (srcOp !== undefined && destOp !== undefined && Math.abs(srcOp - destOp) > 0.01) {
      changes.opacity = { from: String(srcOp), to: String(destOp) };
    }
  }

  // Size (transform: scale)
  if (source.absoluteBoundingBox && dest.absoluteBoundingBox) {
    const srcW = source.absoluteBoundingBox.width;
    const destW = dest.absoluteBoundingBox.width;
    if (srcW > 0 && destW > 0) {
      const scaleX = Math.round((destW / srcW) * 100) / 100;
      if (Math.abs(scaleX - 1) > 0.01) {
        changes.transform = { from: 'scale(1)', to: `scale(${scaleX})` };
      }
    }
  }

  // Border radius
  if ('cornerRadius' in source && 'cornerRadius' in dest) {
    const srcR = (source as any).cornerRadius;
    const destR = (dest as any).cornerRadius;
    if (typeof srcR === 'number' && typeof destR === 'number' && srcR !== destR) {
      changes.borderRadius = { from: toCssValue(srcR)!, to: toCssValue(destR)! };
    }
  }

  // Box shadow (effects)
  if ('effects' in source && 'effects' in dest) {
    const srcShadow = extractBoxShadow(source as any);
    const destShadow = extractBoxShadow(dest as any);
    if (srcShadow !== destShadow) {
      changes.boxShadow = { from: srcShadow || 'none', to: destShadow || 'none' };
    }
  }

  // Border color/width from strokes
  if ('strokes' in source && 'strokes' in dest) {
    const srcStroke = extractStrokeColor(source as any);
    const destStroke = extractStrokeColor(dest as any);
    if (srcStroke && destStroke && srcStroke !== destStroke) {
      changes.borderColor = { from: srcStroke, to: destStroke };
    }
  }

  return changes;
}

/**
 * Extract box-shadow CSS value from node effects.
 */
function extractBoxShadow(node: { effects?: readonly Effect[] }): string | null {
  if (!node.effects) return null;
  for (const effect of node.effects) {
    if (effect.type === 'DROP_SHADOW' && effect.visible !== false) {
      const { offset, radius, spread, color } = effect as DropShadowEffect;
      const hex = rgbToHex(color);
      const alpha = Math.round((color.a || 1) * 100) / 100;
      return `${offset.x}px ${offset.y}px ${radius}px ${spread || 0}px rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${alpha})`;
    }
  }
  return null;
}

/**
 * Extract primary stroke color from a node.
 */
function extractStrokeColor(node: { strokes?: readonly Paint[] }): string | null {
  if (!node.strokes) return null;
  for (const stroke of node.strokes) {
    if (stroke.type === 'SOLID' && stroke.visible !== false) {
      return rgbToHex(stroke.color);
    }
  }
  return null;
}

/**
 * Extract all prototype interactions from a section's node tree.
 * Walks all descendants, finds nodes with reactions, and produces InteractionSpec[].
 */
export function extractInteractions(sectionRoot: SceneNode): InteractionSpec[] {
  const interactions: InteractionSpec[] = [];

  function walk(node: SceneNode) {
    if ('reactions' in node) {
      const reactions = (node as any).reactions as any[];
      if (reactions && reactions.length > 0) {
        for (const reaction of reactions) {
          const trigger = mapTrigger(reaction.trigger?.type);
          if (!trigger) continue;

          const action = reaction.action || (reaction.actions && reaction.actions[0]);
          if (!action) continue;

          // Get transition data
          const transition = action.transition;
          const duration = transition?.duration ? `${transition.duration}s` : '0.3s';
          const easing = mapEasing(transition?.easing);

          // For hover/click with destination node — diff styles
          if (action.destinationId && (trigger === 'hover' || trigger === 'mouse-enter' || trigger === 'click')) {
            try {
              const destNode = figma.getNodeById(action.destinationId);
              if (destNode) {
                const propertyChanges = diffNodeStyles(node, destNode as SceneNode);
                if (Object.keys(propertyChanges).length > 0) {
                  interactions.push({
                    elementName: node.name,
                    figmaNodeId: node.id,
                    trigger,
                    transition: { duration, easing },
                    propertyChanges,
                  });
                }
              }
            } catch {
              // Destination node not accessible (different page, etc.)
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

  walk(sectionRoot);
  return interactions;
}
