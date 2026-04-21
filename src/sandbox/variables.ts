import { FigmaVariablesExport } from './types';
import { rgbToHex } from './color';

/**
 * Extract Figma Variables (design tokens) from the current file.
 *
 * When a designer has set up Figma Variables (colors, numbers, strings,
 * booleans) the variable names ARE the design tokens the developer should
 * use. We export them grouped by collection and flat by full name so
 * agents can emit `--clr-primary` instead of `--clr-1c1c1c`.
 *
 * Returns `{ present: false }` when the Figma Variables API is unavailable
 * or no variables exist. Agents fall back to auto-generated names.
 */
export function extractVariables(): FigmaVariablesExport {
  const out: FigmaVariablesExport = {
    collections: {},
    flat: {},
    present: false,
  };

  // Feature-detect — older Figma clients don't have variables API
  if (!figma.variables || typeof figma.variables.getLocalVariables !== 'function') {
    return out;
  }

  let collectionsById: Record<string, any> = {};
  try {
    const localCollections = figma.variables.getLocalVariableCollections();
    for (const col of localCollections) {
      collectionsById[col.id] = col;
    }
  } catch {
    return out;
  }

  let variables: Variable[] = [];
  try {
    variables = figma.variables.getLocalVariables();
  } catch {
    return out;
  }
  if (!variables || variables.length === 0) return out;

  out.present = true;

  for (const v of variables) {
    const collection = collectionsById[v.variableCollectionId];
    if (!collection) continue;

    const defaultModeId = collection.defaultModeId;
    const raw = v.valuesByMode[defaultModeId];
    if (raw === undefined) continue;

    let value: string | number | boolean;
    if (v.resolvedType === 'COLOR') {
      // COLOR values are RGBA objects; convert to hex
      if (raw && typeof raw === 'object' && 'r' in raw) {
        value = rgbToHex(raw as any);
      } else {
        continue;
      }
    } else if (v.resolvedType === 'FLOAT') {
      value = typeof raw === 'number' ? raw : Number(raw);
    } else if (v.resolvedType === 'STRING') {
      value = typeof raw === 'string' ? raw : String(raw);
    } else if (v.resolvedType === 'BOOLEAN') {
      value = Boolean(raw);
    } else {
      continue;
    }

    const collectionName = collection.name || 'Default';
    if (!out.collections[collectionName]) out.collections[collectionName] = {};
    out.collections[collectionName][v.name] = value;

    // Flat key: "<collection>/<variable-name>" so duplicates across collections don't collide
    const flatKey = `${collectionName}/${v.name}`;
    out.flat[flatKey] = value;
  }

  return out;
}

/**
 * Normalize a Figma variable name to a CSS custom property name.
 *   "Colors/Primary" → "--clr-primary"
 *   "Spacing/md" → "--space-md"
 *   "Radius/lg" → "--radius-lg"
 */
export function toCssCustomProperty(variableName: string, collectionName: string): string {
  const col = collectionName.toLowerCase();
  const name = variableName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  if (col.includes('color') || col.includes('colour')) return `--clr-${name}`;
  if (col.includes('spac')) return `--space-${name}`;
  if (col.includes('radius')) return `--radius-${name}`;
  if (col.includes('font') && col.includes('size')) return `--fs-${name}`;
  if (col.includes('font') && col.includes('weight')) return `--fw-${name}`;
  if (col.includes('font') || col.includes('family')) return `--ff-${name}`;
  if (col.includes('line')) return `--lh-${name}`;
  return `--${col.replace(/[^a-z0-9]+/g, '-')}-${name}`;
}
