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
  backgroundImage: string | null;
  backgroundGradient: string | null;
  minHeight: string | null;
  overflow: string | null;
  /** Multiple shadows + filters for sections that have glass-morphism or elevation */
  boxShadow?: string | null;
  filter?: string | null;
  backdropFilter?: string | null;
  borderTopLeftRadius?: string | null;
  borderTopRightRadius?: string | null;
  borderBottomLeftRadius?: string | null;
  borderBottomRightRadius?: string | null;
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
  /** Semantic role: text, image, background_image, button, container, shape */
  role: 'text' | 'image' | 'background_image' | 'button' | 'container' | 'shape';
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
  | { type: 'CANCEL_EXPORT' };

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
