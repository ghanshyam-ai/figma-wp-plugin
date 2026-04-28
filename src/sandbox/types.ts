// ─────────────────────────────────────────────
// Discovery Types
// ─────────────────────────────────────────────

export interface PageInfo {
  id: string;
  name: string;
  frames: FrameInfo[];
}

export interface FrameInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  breakpoint: BreakpointClass;
  sectionCount: number;
  hasAutoLayout: boolean;
  /** Matched responsive counterpart (set by responsive matcher) */
  responsivePairId: string | null;
}

export type BreakpointClass = 'mobile' | 'tablet' | 'desktop' | 'large';

// ─────────────────────────────────────────────
// section-specs.json — matches the canonical schema
// ─────────────────────────────────────────────

export interface SectionSpecs {
  figma_canvas_width: number;
  figma_canvas_height?: number;
  mobile_canvas_width?: number;
  page_slug: string;
  extracted_at: string;
  extraction_method: 'plugin';
  sections: Record<string, SectionSpec>;
}

export interface SectionSpec {
  spacingSource: 'auto-layout' | 'absolute-coordinates';
  figmaNodeId: string;
  screenshotFile: string;
  section: SectionStyles;
  elements: Record<string, ElementStyles>;
  grid: GridSpec;
  responsive?: Record<string, ResponsiveOverride>;
  interactions?: InteractionSpec[];
  overlap: OverlapInfo | null;
  /** Layer ordering and position data for every meaningful element */
  layers?: LayerInfo[];
  /** High-level composition analysis (text-over-image, stacking, etc.) */
  composition?: CompositionInfo;
  /** True if section contains form-like elements (inputs, labels, submit button) */
  isFormSection?: boolean;
  /** Detected form fields when isFormSection is true */
  formFields?: FormFieldInfo[];
  /** ALL text nodes in reading order (top-to-bottom, left-to-right).
   *  Used by page-assembler for positional content mapping when designers
   *  do not name layers consistently. Every text from Figma is preserved. */
  textContentInOrder?: TextContentEntry[];
  /** Detected interactive component patterns — carousel, accordion, tabs, modal.
   *  Heuristic-based; low-confidence entries should be verified against the
   *  screenshot before the agent emits specialised markup. */
  componentPatterns?: ComponentPattern[];
  /** True when this section matches (by name) a section on ≥2 selected pages.
   *  Global sections should be promoted to WP theme parts (header.php / footer.php
   *  or template-parts/) instead of duplicated into each page template. */
  isGlobal?: boolean;
  /** Semantic role of a global section when it can be classified. */
  globalRole?: 'header' | 'footer' | null;
  /** Inferred semantic type — the agent uses this to pick the right ACF
   *  flexible-content layout (hero / features / pricing / contact …).
   *  Falls back to 'generic' when nothing matches confidently. */
  sectionType?: SectionType;
  /** Confidence in the sectionType inference:
   *    'high' — explicit layer-name match or strong pattern signal
   *    'low'  — inferred from content shape; agent should double-check */
  sectionTypeConfidence?: 'high' | 'low';
  /** Detected repeater groups inside this section, keyed by container name.
   *  Each entry has a template layer + one content object per item so the
   *  agent can emit an ACF Repeater field instead of individual fields. */
  repeaters?: Record<string, RepeaterInfo>;
  /** Navigation links detected inside this section (usually header/footer). */
  navigation?: NavigationInfo;
}

export type SectionType =
  | 'hero' | 'features' | 'testimonials' | 'cta' | 'faq' | 'pricing'
  | 'contact' | 'logos' | 'footer' | 'header' | 'blog_grid' | 'generic';

export interface ComponentPattern {
  type: 'carousel' | 'accordion' | 'tabs' | 'modal';
  rootNodeId: string;
  rootNodeName: string;
  /** Number of detected items in the pattern (slides, accordion items, tabs). */
  itemCount?: number;
  /** 'high' when the layer name explicitly matches; 'low' when inferred. */
  confidence: 'high' | 'low';
  /** Per-type metadata (accordion items[], carousel layout hints, etc.). */
  meta?: Record<string, unknown>;
}

export interface RepeaterInfo {
  /** Layer name of the parent that holds the repeated items. */
  containerLayerName: string;
  /** Number of detected items. */
  itemCount: number;
  /** Layer name of the first item — a stable key hint for ACF. */
  templateLayerName: string;
  /** Content extracted from each item. */
  items: RepeaterItem[];
}

export interface RepeaterItem {
  /** Per-role text content: { title: "Fast", description: "…" } */
  texts: Record<string, string>;
  /** Image filename when the item has a primary image fill. */
  imageFile?: string;
  /** Alt text if derivable from layer name or component description. */
  alt?: string;
  /** Prototype link URL if the item has an OPEN_URL action. */
  linkUrl?: string;
}

export interface NavigationInfo {
  /** Short text links found inside the section. */
  links: Array<{ label: string; href?: string | null }>;
}

export interface TextContentEntry {
  /** 0-based index in reading order */
  index: number;
  /** Raw text as authored in Figma */
  text: string;
  /** Heuristic role: 'heading' | 'subheading' | 'button_text' | 'caption' | 'body' | 'text_N' */
  role: string;
  /** Original Figma layer name (may be empty/generic — don't rely on it alone) */
  layerName: string;
  /** Font size in px */
  fontSize: number;
  /** Position within the section */
  bounds: { x: number; y: number; width: number; height: number };
}

export interface FormFieldInfo {
  /** Field label from nearby text node */
  label: string;
  /** Detected field type: text, email, textarea, select, checkbox, radio, phone, submit */
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'phone' | 'submit' | 'unknown';
  /** True if field appears required (asterisk in label, or Figma layer name contains 'required') */
  required: boolean;
  /** Placeholder text if detected */
  placeholder?: string;
}

export interface SectionStyles {
  paddingTop: string | null;
  paddingBottom: string | null;
  paddingLeft: string | null;
  paddingRight: string | null;
  backgroundColor: string | null;
  /** CSS-ready value for `background-image`. When the section frame itself
   *  has an IMAGE fill, this resolves to `url(images/<slug>.png)`. */
  backgroundImage: string | null;
  /** Bare filename of the section's background image (no `url(...)` wrapper).
   *  Lets agents resolve the file via `image-map.json` even after the
   *  packager renames extensions (e.g. .png → .jpg via magic-byte detection). */
  backgroundImageFile?: string | null;
  backgroundGradient: string | null;
  minHeight: string | null;
  overflow: string | null;
  /** Multiple shadows + filters for sections that have glass-morphism or elevation */
  boxShadow?: string | null;
  filter?: string | null;
  backdropFilter?: string | null;
  /** Uniform border-radius shorthand (preferred when all 4 corners equal) */
  borderRadius?: string | null;
  borderTopLeftRadius?: string | null;
  borderTopRightRadius?: string | null;
  borderBottomLeftRadius?: string | null;
  borderBottomRightRadius?: string | null;
  borderWidth?: string | null;
  borderTopWidth?: string | null;
  borderRightWidth?: string | null;
  borderBottomWidth?: string | null;
  borderLeftWidth?: string | null;
  borderColor?: string | null;
  borderStyle?: string | null;
  /** Stroke alignment for the section's own border:
   *  inside → CSS `box-sizing: border-box` border (default-friendly)
   *  outside → CSS `outline` (border doesn't inflate the box)
   *  center → no direct CSS equivalent; agent should pick `outline` + half-offset */
  strokeAlign?: 'inside' | 'outside' | 'center' | null;
  opacity?: number | null;
  /** Auto-layout → flex props. Populated when the section frame has
   *  layoutMode HORIZONTAL or VERTICAL. */
  display?: string | null;
  flexDirection?: string | null;
  justifyContent?: string | null;
  alignItems?: string | null;
  flexWrap?: string | null;
  gap?: string | null;
  rowGap?: string | null;
  /** CSS `mix-blend-mode` from Figma's blendMode (multiply, overlay, screen, …).
   *  null when blendMode is NORMAL or PASS_THROUGH. */
  mixBlendMode?: string | null;
}

export interface ElementStyles {
  fontFamily?: string | null;
  fontSize?: string | null;
  fontWeight?: string | number | null;
  lineHeight?: string | null;
  letterSpacing?: string | null;
  textTransform?: string | null;
  textAlign?: string | null;
  /** Text decoration from Figma TEXT node: 'underline' | 'line-through' | 'none' */
  textDecoration?: string | null;
  color?: string | null;
  backgroundColor?: string | null;
  width?: string | null;
  height?: string | null;
  maxWidth?: string | null;
  aspectRatio?: string | null;
  marginTop?: string | null;
  marginBottom?: string | null;
  marginLeft?: string | null;
  marginRight?: string | null;
  paddingTop?: string | null;
  paddingBottom?: string | null;
  paddingLeft?: string | null;
  paddingRight?: string | null;
  gap?: string | null;
  /** Uniform border-radius shorthand (preferred when all 4 corners equal) */
  borderRadius?: string | null;
  /** Per-corner radius — set when corners differ (e.g. rounded top only) */
  borderTopLeftRadius?: string | null;
  borderTopRightRadius?: string | null;
  borderBottomLeftRadius?: string | null;
  borderBottomRightRadius?: string | null;
  borderWidth?: string | null;
  /** Per-side border-width when sides differ (e.g. bottom border only) */
  borderTopWidth?: string | null;
  borderRightWidth?: string | null;
  borderBottomWidth?: string | null;
  borderLeftWidth?: string | null;
  borderColor?: string | null;
  borderStyle?: string | null;
  /** CSS box-shadow value — may contain multiple shadows separated by commas */
  boxShadow?: string | null;
  /** CSS filter value (blur, brightness, etc.) from LAYER_BLUR effects */
  filter?: string | null;
  /** CSS backdrop-filter value from BACKGROUND_BLUR effects */
  backdropFilter?: string | null;
  /** CSS text-shadow from TEXT node DROP_SHADOW effects */
  textShadow?: string | null;
  /** CSS transform value (rotate/scale/translate) from node rotation/scale */
  transform?: string | null;
  transformOrigin?: string | null;
  opacity?: number | null;
  objectFit?: string | null;
  /** object-position for image fills that are cropped off-center */
  objectPosition?: string | null;
  display?: string | null;
  flexDirection?: string | null;
  alignItems?: string | null;
  justifyContent?: string | null;
  /** Auto-layout children: flex-grow (Figma layoutGrow 0/1) */
  flexGrow?: number | null;
  /** Auto-layout children: flex-basis hint (usually 'auto' or 0) */
  flexBasis?: string | null;
  /** Auto-layout children: align-self override */
  alignSelf?: string | null;
  /** Actual text content from Figma (for content population and context) */
  textContent?: string | null;
  /** Placeholder text extracted from input-looking nodes */
  placeholder?: string | null;
  /** Placeholder styling (color, fontSize) when different from main text */
  placeholderStyles?: { color?: string | null; fontSize?: string | null } | null;
  /** CSS position when element needs absolute/relative positioning */
  position?: string | null;
  /** Position offsets — only set when element requires non-static positioning */
  top?: string | null;
  left?: string | null;
  right?: string | null;
  bottom?: string | null;
  /** Layer stacking order (from composition analysis) */
  zIndex?: number | null;
  /** True when the element or its container uses a mask/clip in Figma */
  hasMask?: boolean | null;
  /** CSS overflow — set to 'hidden' when Figma frame has clipsContent enabled */
  overflow?: string | null;
  /** Prototype link destination URL (if Figma prototype points to external URL) */
  linkUrl?: string | null;
  /** Figma Text Style name bound to this text node (e.g., "Heading/H2").
   *  When present, the agent should map to the theme's typography class/token
   *  instead of re-inlining fontSize/lineHeight/etc. */
  textStyleName?: string | null;
  /** Inline rich-text segments — emitted ONLY when the text has mixed styles
   *  (e.g. a bold word inside a paragraph, or a colored span). When absent,
   *  the uniform styles on this element apply to the entire textContent. */
  textSegments?: TextSegment[] | null;
  /** Alt text for images — sourced from component description when the node
   *  is a component instance, otherwise a humanized layer name. Empty when
   *  the source is a default Figma-generated name. */
  alt?: string | null;
  /** SVG filename for icon-like elements (vector-only, exported as SVG).
   *  Resolves relative to the page's images/ directory — the agent should
   *  inline this asset rather than treat it as a raster image. */
  iconFile?: string | null;
  /** Raster image filename for elements with an IMAGE fill. Resolves relative
   *  to the page's images/ directory. The packager may rename the extension
   *  (PNG → JPG/WebP) based on the source format — agents should consult
   *  `image-map.json` for the authoritative filename when this hint is stale. */
  imageFile?: string | null;
  /** Component instance metadata — present when the node is a Figma INSTANCE.
   *  Lets the agent deduplicate repeated instances into a shared ACF block/pattern. */
  componentInstance?: ComponentInstanceInfo | null;
  /** Figma width sizing mode: 'hug' (auto) | 'fill' (100%) | 'fixed' (explicit px). */
  widthMode?: 'hug' | 'fill' | 'fixed' | null;
  /** Figma height sizing mode: 'hug' (auto) | 'fill' (100%) | 'fixed' (explicit px). */
  heightMode?: 'hug' | 'fill' | 'fixed' | null;
  /** Bound Figma Variable references on this element's properties, as CSS
   *  custom-property references (e.g. { color: "var(--clr-primary)" }).
   *  Agents should prefer these over raw hex/px values when present. */
  varBindings?: Record<string, string> | null;
  /** CSS `mix-blend-mode` from Figma's blendMode (multiply, overlay, screen, …).
   *  null when blendMode is NORMAL or PASS_THROUGH. Useful for image overlays. */
  mixBlendMode?: string | null;
  /** Stroke alignment from Figma — affects whether the border inflates dimensions:
   *  inside → keeps box-size, agent should use `box-sizing: border-box`
   *  outside → doesn't inflate, agent should emit `outline` instead of `border`
   *  center → no direct CSS equivalent */
  strokeAlign?: 'inside' | 'outside' | 'center' | null;
  /** Figma's flex-wrap (`layoutWrap` property): 'wrap' or null. */
  flexWrap?: string | null;
  /** Row gap (used when flexWrap=wrap and counterAxisSpacing is set). */
  rowGap?: string | null;
  /** Layout-positioning mode for children INSIDE an auto-layout parent:
   *  'auto' → child flows in the layout (default)
   *  'absolute' → child is taken out of flow; pair with `top`/`left`/`right`/`bottom` */
  layoutPositioning?: 'auto' | 'absolute' | null;
  /** Layout constraint on the horizontal axis (only meaningful when the parent
   *  is NOT auto-layout, or when layoutPositioning is 'absolute'):
   *    min   → pin to left edge
   *    center → stay centered horizontally
   *    max   → pin to right edge
   *    stretch → grow with parent width (left + right both anchored)
   *    scale → resize proportionally with parent
   */
  constraintsHorizontal?: 'min' | 'center' | 'max' | 'stretch' | 'scale' | null;
  /** Layout constraint on the vertical axis (analogous to horizontal). */
  constraintsVertical?: 'min' | 'center' | 'max' | 'stretch' | 'scale' | null;
}

export interface TextSegment {
  text: string;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  color?: string;
  italic?: boolean;
  textDecoration?: string;
}

export interface ComponentInstanceInfo {
  /** Main component or component-set name (e.g., "Button", "Card/Primary"). */
  name: string;
  /** Variant / boolean / text properties set on this instance. */
  properties: Record<string, string | boolean | number>;
}

export interface GridSpec {
  layoutMode: 'flex' | 'grid' | 'absolute';
  columns: number;
  gap: string | null;
  rowGap?: string | null;
  columnGap?: string | null;
  itemMinWidth?: string | null;
}

export interface ResponsiveOverride {
  section?: Partial<SectionStyles>;
  elements?: Record<string, Partial<ElementStyles>>;
  grid?: Partial<GridSpec>;
}

// ─────────────────────────────────────────────
// Layer Composition (for structural accuracy)
// ─────────────────────────────────────────────

export interface LayerInfo {
  /** Element name (matches key in elements Record) */
  name: string;
  /** Semantic role: text, image, background_image, button, container, shape, icon */
  role: 'text' | 'image' | 'background_image' | 'button' | 'container' | 'shape' | 'icon';
  /** Figma node type */
  type: string;
  /** Bounding box relative to section origin (not absolute canvas) */
  bounds: { x: number; y: number; width: number; height: number };
  /** Layer order: 0 = backmost, higher = frontmost */
  zIndex: number;
  /** Names of other layers this element visually overlaps with */
  overlaps: string[];
}

export interface CompositionInfo {
  /** True when text elements visually overlap an image element */
  hasTextOverImage: boolean;
  /** True when an image spans the full section and should be CSS background-image */
  hasBackgroundImage: boolean;
  /** Element names that sit on top of the background (need position: absolute or similar) */
  overlayElements: string[];
  /** Element names from back to front (Figma layer order) */
  stackingOrder: string[];
}

// ─────────────────────────────────────────────
// Interactions (from prototype reactions)
// ─────────────────────────────────────────────

export interface InteractionSpec {
  elementName: string;
  figmaNodeId: string;
  trigger: 'hover' | 'click' | 'press' | 'mouse-enter' | 'mouse-leave';
  transition: {
    duration: string;
    easing: string;
  };
  propertyChanges: Record<string, { from: string; to: string }>;
}

export interface OverlapInfo {
  withSection: string;
  pixels: number;
  cssMarginTop: string;
  requiresZIndex: boolean;
}

// ─────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────

export interface DesignTokens {
  colors: Record<string, string>;
  fonts: Record<string, FontTokenInfo>;
  spacing: number[];
  /** Figma Variables when available — authoritative names + values.
   *  When present, agents should prefer these over auto-generated names. */
  variables?: FigmaVariablesExport;
}

export interface FigmaVariablesExport {
  /** Variables grouped by collection (e.g. "Colors/Primary", "Spacing/Scale") */
  collections: Record<string, Record<string, string | number | boolean>>;
  /** Flat lookup: variable name → resolved value for the default mode */
  flat: Record<string, string | number | boolean>;
  /** True if Figma Variables API returned data for this file */
  present: boolean;
}

export interface FontTokenInfo {
  styles: string[];
  sizes: number[];
  count: number;
}

export interface PageTokens {
  colors: Record<string, number>;
  fonts: Record<string, FontTokenInfo>;
  spacing: { value: number; count: number }[];
  sections: PageTokenSection[];
}

export interface PageTokenSection {
  index: number;
  name: string;
  id: string;
  dimensions: { width: number; height: number };
  y_offset: number;
  hasAutoLayout: boolean;
  image_count: number;
  image_files: string[];
  text_nodes: number;
  screenshot: string;
  screenshot_complete: boolean;
}

// ─────────────────────────────────────────────
// Responsive Map
// ─────────────────────────────────────────────

export interface ResponsiveMap {
  matchedPairs: ResponsivePair[];
  unmatchedFrames: UnmatchedFrame[];
}

export interface ResponsivePair {
  pageName: string;
  pageSlug: string;
  desktop: { frameId: string; frameName: string; width: number };
  mobile: { frameId: string; frameName: string; width: number } | null;
  tablet: { frameId: string; frameName: string; width: number } | null;
  matchConfidence: number;
  matchMethod: 'name-similarity' | 'content-overlap' | 'manual';
}

export interface UnmatchedFrame {
  frameId: string;
  frameName: string;
  width: number;
  breakpoint: BreakpointClass;
  reason: string;
}

// ─────────────────────────────────────────────
// Export Manifest (root manifest.json in ZIP)
// ─────────────────────────────────────────────

export interface ExportManifest {
  exportVersion: string;
  exportDate: string;
  figmaFileName: string;
  figmaFileKey: string;
  pluginVersion: string;
  pages: ExportManifestPage[];
  totalSections: number;
  totalImages: number;
  designTokensSummary: {
    colorCount: number;
    fontCount: number;
    spacingValues: number;
  };
  /** Image/icon export tasks that failed during the run. The agent should
   *  treat any element referencing one of these filenames as missing and
   *  fall back to its alt text or a generic placeholder. Empty when every
   *  asset exported successfully. */
  failedExports?: FailedExport[];
}

export interface FailedExport {
  filename: string;
  nodeName: string;
  reason: string;
  /** When set, this asset was retried in a different format and saved
   *  under `fallbackFilename`. Element references to `filename` should
   *  be redirected to `fallbackFilename` (extractor handles this). */
  fallbackFilename?: string;
}

export interface ExportManifestPage {
  slug: string;
  frameName: string;
  frameId: string;
  canvasWidth: number;
  canvasHeight: number;
  sectionCount: number;
  imageCount: number;
  hasResponsive: boolean;
  mobileFrameId: string | null;
  interactionCount: number;
  /** Whether a full-page composite screenshot was exported for this page */
  hasFullPageScreenshot: boolean;
  /** Filename of the full-page screenshot (relative to pages/<slug>/figma/screenshots/) */
  fullPageScreenshotFile: string | null;
}

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationResult {
  severity: ValidationSeverity;
  check: string;
  message: string;
  sectionName?: string;
  nodeId?: string;
  nodeName?: string;
  suggestion?: string;
  /** Multi-step fix instructions shown in the "How to fix" panel.
   *  Each line is rendered as a separate bullet. Use plain text — no Markdown. */
  fixHint?: string[];
}

// ─────────────────────────────────────────────
// Image Export
// ─────────────────────────────────────────────

export interface ImageExportTask {
  nodeId: string;
  nodeName: string;
  type: 'screenshot' | 'full-page' | 'asset';
  filename: string;
  pagePath: string;
  format: 'PNG' | 'SVG' | 'JPG';
  scale: number;
  /** True when this asset should export as SVG (icons, vector graphics).
   *  PNG is used for photographs and complex raster images. */
  preferSvg?: boolean;
}

export interface ImageMapEntry {
  file: string;
  ext: string;
  nodeNames: string[];
  readableName: string;
  dimensions: string | null;
  usedInSections: string[];
}

export interface ImageMap {
  images: Record<string, ImageMapEntry>;
  by_section: Record<string, string[]>;
}

// ─────────────────────────────────────────────
// Plugin Messages (sandbox <-> UI)
// ─────────────────────────────────────────────

// UI → Sandbox
export type UIToSandboxMessage =
  | { type: 'DISCOVER_PAGES' }
  | { type: 'VALIDATE'; frameIds: string[] }
  | { type: 'START_EXPORT'; frameIds: string[]; responsivePairs: ResponsivePair[] }
  | { type: 'CANCEL_EXPORT' }
  | { type: 'FOCUS_NODE'; nodeId: string };

// Sandbox → UI
export type SandboxToUIMessage =
  | { type: 'PAGES_DISCOVERED'; pages: PageInfo[] }
  | { type: 'VALIDATION_COMPLETE'; results: ValidationResult[]; frameIds: string[] }
  | { type: 'EXPORT_PROGRESS'; current: number; total: number; label: string }
  | { type: 'PAGE_DATA'; pageSlug: string; sectionSpecs: SectionSpecs; specMd: string; tokens: PageTokens }
  | { type: 'SCREENSHOT_DATA'; path: string; filename: string; data: Uint8Array }
  | { type: 'IMAGE_DATA'; path: string; filename: string; data: Uint8Array }
  | { type: 'IMAGE_MAP_DATA'; path: string; imageMap: ImageMap }
  | { type: 'EXPORT_COMPLETE'; manifest: ExportManifest; responsiveMap: ResponsiveMap; designTokens: DesignTokens }
  | { type: 'EXPORT_ERROR'; error: string };
