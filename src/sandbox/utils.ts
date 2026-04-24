/**
 * Convert a Figma layer name to a URL-safe kebab-case slug.
 * "Hero Section" → "hero-section"
 * "About Us — Overview" → "about-us-overview"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Convert a Figma layer name to ACF-compatible snake_case layout name.
 * "Hero Section" → "hero_section"
 */
export function toLayoutName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[—–]/g, '_')
    .replace(/[^a-z0-9\s_]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Convert a numeric value to a CSS value string with unit.
 * NEVER returns a bare number — always "Npx", "N%", etc.
 * Returns null if the value is undefined/null/NaN.
 */
export function toCssValue(value: number | undefined | null, unit: string = 'px'): string | null {
  if (value === undefined || value === null || isNaN(value)) return null;
  // Round to avoid floating-point noise (e.g., 79.99999 → 80)
  const rounded = Math.round(value * 100) / 100;
  // Use integer when close enough
  const display = Number.isInteger(rounded) ? rounded : rounded;
  return `${display}${unit}`;
}

/**
 * Format a Figma node ID for output. Figma uses "1:234" format.
 */
export function nodeIdToString(id: string): string {
  return id;
}

/**
 * Generate a screenshot filename from the section's layout name.
 * "Hero Section" → "hero-section.png"
 */
export function screenshotFilename(name: string): string {
  return `${slugify(name)}.png`;
}

/**
 * Compute the aspect ratio string from width and height.
 * Returns the simplest integer ratio: 1440/900 → "16/10"
 * Returns null if either dimension is 0.
 */
export function computeAspectRatio(width: number, height: number): string | null {
  if (!width || !height) return null;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(Math.round(width), Math.round(height));
  return `${Math.round(width / d)}/${Math.round(height / d)}`;
}

/**
 * Detect if a node name is a default Figma-generated name.
 * "Frame 1", "Group 23", "Rectangle 4", "Vector" → true
 */
export function isDefaultLayerName(name: string): boolean {
  return /^(Frame|Group|Rectangle|Ellipse|Line|Vector|Polygon|Star|Boolean|Slice|Component|Instance)\s*\d*$/i.test(name);
}
