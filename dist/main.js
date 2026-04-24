"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/sandbox/utils.ts
  function slugify(name) {
    return name.toLowerCase().replace(/[—–]/g, "-").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }
  function toLayoutName(name) {
    return name.toLowerCase().replace(/[—–]/g, "_").replace(/[^a-z0-9\s_]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  }
  function toCssValue(value, unit = "px") {
    if (value === void 0 || value === null || isNaN(value)) return null;
    const rounded = Math.round(value * 100) / 100;
    const display = Number.isInteger(rounded) ? rounded : rounded;
    return `${display}${unit}`;
  }
  function screenshotFilename(name) {
    return `${slugify(name)}.png`;
  }
  function computeAspectRatio(width, height) {
    if (!width || !height) return null;
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const d = gcd(Math.round(width), Math.round(height));
    return `${Math.round(width / d)}/${Math.round(height / d)}`;
  }
  function isDefaultLayerName(name) {
    return /^(Frame|Group|Rectangle|Ellipse|Line|Vector|Polygon|Star|Boolean|Slice|Component|Instance)\s*\d*$/i.test(name);
  }
  var init_utils = __esm({
    "src/sandbox/utils.ts"() {
      "use strict";
    }
  });

  // src/sandbox/responsive.ts
  function classifyBreakpoint(width) {
    if (width <= 480) return "mobile";
    if (width <= 820) return "tablet";
    if (width <= 1440) return "desktop";
    return "large";
  }
  function normalizeFrameName(name) {
    let normalized = name;
    for (const pattern of BREAKPOINT_PATTERNS) {
      normalized = normalized.replace(pattern, "");
    }
    return normalized.trim().toLowerCase().replace(/\s+/g, " ");
  }
  function matchResponsiveFrames(allFrames) {
    const groups = /* @__PURE__ */ new Map();
    for (const frame of allFrames) {
      const normalized = normalizeFrameName(frame.name);
      if (!groups.has(normalized)) {
        groups.set(normalized, []);
      }
      groups.get(normalized).push(frame);
    }
    const matchedPairs = [];
    const unmatchedFrames = [];
    const matchedIds = /* @__PURE__ */ new Set();
    for (const [baseName, frames] of groups) {
      if (frames.length === 1) {
        const frame = frames[0];
        if (frame.breakpoint === "desktop" || frame.breakpoint === "large") {
          matchedPairs.push({
            pageName: frame.name,
            pageSlug: slugify(baseName || frame.name),
            desktop: { frameId: frame.id, frameName: frame.name, width: frame.width },
            mobile: null,
            tablet: null,
            matchConfidence: 1,
            matchMethod: "name-similarity"
          });
          matchedIds.add(frame.id);
        } else {
          unmatchedFrames.push({
            frameId: frame.id,
            frameName: frame.name,
            width: frame.width,
            breakpoint: frame.breakpoint,
            reason: "no desktop counterpart found"
          });
          matchedIds.add(frame.id);
        }
        continue;
      }
      const desktop = frames.find((f) => f.breakpoint === "desktop" || f.breakpoint === "large");
      const mobile = frames.find((f) => f.breakpoint === "mobile");
      const tablet = frames.find((f) => f.breakpoint === "tablet");
      if (desktop) {
        matchedPairs.push({
          pageName: desktop.name,
          pageSlug: slugify(baseName || desktop.name),
          desktop: { frameId: desktop.id, frameName: desktop.name, width: desktop.width },
          mobile: mobile ? { frameId: mobile.id, frameName: mobile.name, width: mobile.width } : null,
          tablet: tablet ? { frameId: tablet.id, frameName: tablet.name, width: tablet.width } : null,
          matchConfidence: 0.95,
          matchMethod: "name-similarity"
        });
        matchedIds.add(desktop.id);
        if (mobile) matchedIds.add(mobile.id);
        if (tablet) matchedIds.add(tablet.id);
      }
      for (const frame of frames) {
        if (!matchedIds.has(frame.id)) {
          unmatchedFrames.push({
            frameId: frame.id,
            frameName: frame.name,
            width: frame.width,
            breakpoint: frame.breakpoint,
            reason: "could not pair with desktop frame"
          });
          matchedIds.add(frame.id);
        }
      }
    }
    for (const frame of allFrames) {
      if (!matchedIds.has(frame.id)) {
        unmatchedFrames.push({
          frameId: frame.id,
          frameName: frame.name,
          width: frame.width,
          breakpoint: frame.breakpoint,
          reason: "not matched by any method"
        });
      }
    }
    return { matchedPairs, unmatchedFrames };
  }
  var BREAKPOINT_PATTERNS;
  var init_responsive = __esm({
    "src/sandbox/responsive.ts"() {
      "use strict";
      init_utils();
      BREAKPOINT_PATTERNS = [
        /[-–—\s]*(desktop|mobile|tablet|responsive|phone|web|lg|md|sm|xs)/gi,
        /[-–—\s]*(\d{3,4})\s*(?:px)?$/gi,
        // trailing width numbers like "1440" or "375px"
        /\((?:desktop|mobile|tablet|phone)\)/gi,
        /\s+$/g
      ];
    }
  });

  // src/sandbox/discovery.ts
  function discoverPages() {
    const pages = [];
    for (const page of figma.root.children) {
      const frames = discoverFrames(page);
      if (frames.length > 0) {
        pages.push({
          id: page.id,
          name: page.name,
          frames
        });
      }
    }
    return pages;
  }
  function discoverFrames(page) {
    const frames = [];
    for (const child of page.children) {
      if (child.type !== "FRAME" && child.type !== "COMPONENT" && child.type !== "COMPONENT_SET") {
        continue;
      }
      const frame = child;
      if (frame.width < 300 || frame.height < 200) continue;
      const sectionCount = frame.children.filter(
        (c) => c.visible !== false && (c.type === "FRAME" || c.type === "COMPONENT" || c.type === "INSTANCE" || c.type === "GROUP") && c.absoluteBoundingBox && c.absoluteBoundingBox.height > 50
      ).length;
      const hasAutoLayout = frame.layoutMode !== void 0 && frame.layoutMode !== "NONE";
      frames.push({
        id: frame.id,
        name: frame.name,
        width: Math.round(frame.width),
        height: Math.round(frame.height),
        breakpoint: classifyBreakpoint(Math.round(frame.width)),
        sectionCount,
        hasAutoLayout,
        responsivePairId: null
      });
    }
    return frames;
  }
  var init_discovery = __esm({
    "src/sandbox/discovery.ts"() {
      "use strict";
      init_responsive();
    }
  });

  // src/sandbox/validator.ts
  function runAllValidations(frameIds) {
    return __async(this, null, function* () {
      const results = [];
      for (const frameId of frameIds) {
        const node = figma.getNodeById(frameId);
        if (!node || node.type !== "FRAME") continue;
        const frame = node;
        const sections = frame.children.filter(
          (c) => c.visible !== false && (c.type === "FRAME" || c.type === "COMPONENT" || c.type === "INSTANCE" || c.type === "GROUP")
        );
        results.push(...checkAutoLayout(sections, frame.name));
        results.push(...checkLayerNames(sections, frame.name));
        results.push(...yield checkFonts(frame));
        results.push(...checkSpacingConsistency(frame));
        results.push(...checkOversizedImages(frame));
        results.push(...checkOverlaps(sections, frame.name));
        results.push(...checkTextOverflow(frame));
      }
      results.push(...checkResponsiveFrames(frameIds));
      return results;
    });
  }
  function checkAutoLayout(sections, frameName) {
    const results = [];
    for (const section of sections) {
      if (section.type === "FRAME" || section.type === "COMPONENT" || section.type === "INSTANCE") {
        const frame = section;
        if (!frame.layoutMode || frame.layoutMode === "NONE") {
          results.push({
            severity: "warning",
            check: "auto-layout",
            message: `Section "${section.name}" uses absolute positioning. Spacing values will be approximate.`,
            sectionName: section.name,
            nodeId: section.id,
            nodeName: section.name,
            suggestion: "Apply auto-layout to this section for precise spacing extraction."
          });
        }
      }
    }
    return results;
  }
  function checkLayerNames(sections, frameName) {
    const results = [];
    function walk(node, depth) {
      if (isDefaultLayerName(node.name)) {
        results.push({
          severity: depth === 0 ? "warning" : "info",
          check: "layer-names",
          message: `Layer "${node.name}" has a default Figma name${depth === 0 ? " (section level)" : ""}.`,
          sectionName: frameName,
          nodeId: node.id,
          nodeName: node.name,
          suggestion: 'Rename to a descriptive name (e.g., "Hero Section", "Features Grid").'
        });
      }
      if ("children" in node && depth < 2) {
        for (const child of node.children) {
          walk(child, depth + 1);
        }
      }
    }
    for (const section of sections) {
      walk(section, 0);
    }
    return results;
  }
  function checkFonts(frame) {
    return __async(this, null, function* () {
      const results = [];
      const checkedFonts = /* @__PURE__ */ new Set();
      function collectFontNames(node) {
        if (node.type === "TEXT") {
          const fontName = node.fontName;
          if (fontName !== figma.mixed && fontName) {
            const key = `${fontName.family}::${fontName.style}`;
            if (!checkedFonts.has(key)) {
              checkedFonts.add(key);
            }
          }
        }
        if ("children" in node) {
          for (const child of node.children) {
            collectFontNames(child);
          }
        }
      }
      collectFontNames(frame);
      for (const fontKey of checkedFonts) {
        const [family, style] = fontKey.split("::");
        try {
          yield figma.loadFontAsync({ family, style });
        } catch (e) {
          results.push({
            severity: "error",
            check: "fonts",
            message: `Font "${family} ${style}" is not available. Text extraction may fail.`,
            sectionName: frame.name,
            suggestion: "Install the font or replace it in the design."
          });
        }
      }
      return results;
    });
  }
  function checkSpacingConsistency(frame) {
    const results = [];
    const spacingValues = [];
    function walk(node) {
      if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") {
        const f = node;
        if (f.layoutMode && f.layoutMode !== "NONE") {
          spacingValues.push(f.paddingTop, f.paddingBottom, f.paddingLeft, f.paddingRight, f.itemSpacing);
        }
      }
      if ("children" in node) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(frame);
    const unique = [...new Set(spacingValues.filter((v) => v > 0))].sort((a, b) => a - b);
    for (let i = 0; i < unique.length - 1; i++) {
      const diff = unique[i + 1] - unique[i];
      if (diff > 0 && diff <= 2) {
        results.push({
          severity: "info",
          check: "spacing-consistency",
          message: `Near-duplicate spacing: ${unique[i]}px and ${unique[i + 1]}px \u2014 likely same intent?`,
          sectionName: frame.name,
          suggestion: `Consider standardizing to ${Math.round((unique[i] + unique[i + 1]) / 2)}px.`
        });
      }
    }
    return results;
  }
  function checkOversizedImages(frame) {
    const results = [];
    function walk(node) {
      if ("fills" in node) {
        const fills = node.fills;
        if (Array.isArray(fills)) {
          for (const fill of fills) {
            if (fill.type === "IMAGE" && fill.visible !== false) {
              const bounds = node.absoluteBoundingBox;
              if (bounds) {
                const estimatedBytes = bounds.width * bounds.height * 4;
                const estimatedMB = estimatedBytes / (1024 * 1024);
                if (estimatedMB > 5) {
                  results.push({
                    severity: "warning",
                    check: "image-size",
                    message: `Image in "${node.name}" is estimated at ${estimatedMB.toFixed(1)}MB at 1x export.`,
                    nodeId: node.id,
                    nodeName: node.name,
                    suggestion: "Consider reducing image dimensions or export scale."
                  });
                }
              }
            }
          }
        }
      }
      if ("children" in node) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(frame);
    return results;
  }
  function checkOverlaps(sections, frameName) {
    const results = [];
    const sorted = [...sections].filter((s) => s.absoluteBoundingBox).sort((a, b) => a.absoluteBoundingBox.y - b.absoluteBoundingBox.y);
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i].absoluteBoundingBox;
      const next = sorted[i + 1].absoluteBoundingBox;
      const overlap = curr.y + curr.height - next.y;
      if (overlap > 0) {
        results.push({
          severity: "warning",
          check: "overlap",
          message: `Section "${sorted[i].name}" overlaps with "${sorted[i + 1].name}" by ${Math.round(overlap)}px.`,
          sectionName: sorted[i].name,
          nodeId: sorted[i].id,
          suggestion: "The plugin will record this as a negative margin. Verify the visual result."
        });
      }
    }
    return results;
  }
  function checkResponsiveFrames(frameIds) {
    const results = [];
    const frames = frameIds.map((id) => figma.getNodeById(id)).filter((n) => n && n.type === "FRAME");
    const desktopFrames = frames.filter((f) => f.width > 1024);
    const mobileFrames = frames.filter((f) => f.width <= 480);
    if (desktopFrames.length > 0 && mobileFrames.length === 0) {
      results.push({
        severity: "warning",
        check: "responsive",
        message: `Only desktop frames selected (no mobile frames). Responsive values will be calculated, not extracted.`,
        suggestion: "Include mobile (375px) frames for exact responsive values."
      });
    }
    return results;
  }
  function checkTextOverflow(frame) {
    const results = [];
    function walk(node) {
      if (node.type === "TEXT" && node.absoluteBoundingBox && node.parent && "absoluteBoundingBox" in node.parent) {
        const textBounds = node.absoluteBoundingBox;
        const parentBounds = node.parent.absoluteBoundingBox;
        if (parentBounds) {
          const overflowRight = textBounds.x + textBounds.width - (parentBounds.x + parentBounds.width);
          const overflowBottom = textBounds.y + textBounds.height - (parentBounds.y + parentBounds.height);
          if (overflowRight > 5 || overflowBottom > 5) {
            results.push({
              severity: "warning",
              check: "text-overflow",
              message: `Text "${node.name}" overflows its container by ${Math.max(Math.round(overflowRight), Math.round(overflowBottom))}px.`,
              nodeId: node.id,
              nodeName: node.name,
              suggestion: "Resize the text container or reduce text content."
            });
          }
        }
      }
      if ("children" in node) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(frame);
    return results;
  }
  var init_validator = __esm({
    "src/sandbox/validator.ts"() {
      "use strict";
      init_utils();
    }
  });

  // src/sandbox/color.ts
  function channelToHex(value) {
    return Math.round(value * 255).toString(16).padStart(2, "0").toUpperCase();
  }
  function rgbToHex(color) {
    return `#${channelToHex(color.r)}${channelToHex(color.g)}${channelToHex(color.b)}`;
  }
  function rgbaToHex(color, opacity = 1) {
    const base = rgbToHex(color);
    if (opacity >= 1) return base;
    return `${base}${channelToHex(opacity)}`;
  }
  function extractBackgroundColor(node) {
    if (!("fills" in node) || !node.fills || !Array.isArray(node.fills)) return null;
    for (const fill of node.fills) {
      if (fill.type === "SOLID" && fill.visible !== false) {
        const opacity = fill.opacity !== void 0 ? fill.opacity : 1;
        return rgbaToHex(fill.color, opacity);
      }
    }
    return null;
  }
  function extractTextColor(node) {
    if (!node.fills || !Array.isArray(node.fills)) return null;
    for (const fill of node.fills) {
      if (fill.type === "SOLID" && fill.visible !== false) {
        return rgbToHex(fill.color);
      }
    }
    return null;
  }
  function extractGradient(node) {
    if (!("fills" in node) || !node.fills || !Array.isArray(node.fills)) return null;
    for (const fill of node.fills) {
      if (fill.type === "GRADIENT_LINEAR" && fill.visible !== false) {
        const stops = fill.gradientStops.map((s) => `${rgbToHex(s.color)} ${Math.round(s.position * 100)}%`).join(", ");
        return `linear-gradient(${stops})`;
      }
      if (fill.type === "GRADIENT_RADIAL" && fill.visible !== false) {
        const stops = fill.gradientStops.map((s) => `${rgbToHex(s.color)} ${Math.round(s.position * 100)}%`).join(", ");
        return `radial-gradient(${stops})`;
      }
    }
    return null;
  }
  function hasImageFill(node) {
    if (!("fills" in node) || !node.fills || !Array.isArray(node.fills)) return false;
    return node.fills.some((f) => f.type === "IMAGE" && f.visible !== false);
  }
  function extractBorderStyle(node) {
    if (!("strokes" in node) || !Array.isArray(node.strokes) || node.strokes.length === 0) return null;
    const dashPattern = node.dashPattern;
    if (Array.isArray(dashPattern) && dashPattern.length > 0) {
      const max = Math.max(...dashPattern);
      return max <= 2 ? "dotted" : "dashed";
    }
    return "solid";
  }
  function extractBorderWidths(node) {
    const ind = node.individualStrokeWeights;
    if (ind && typeof ind === "object") {
      return {
        top: ind.top || null,
        right: ind.right || null,
        bottom: ind.bottom || null,
        left: ind.left || null,
        uniform: null
      };
    }
    const w = node.strokeWeight;
    if (typeof w === "number" && w > 0) {
      return { top: null, right: null, bottom: null, left: null, uniform: w };
    }
    return { top: null, right: null, bottom: null, left: null, uniform: null };
  }
  function extractStrokeColor(node) {
    if (!("strokes" in node) || !Array.isArray(node.strokes)) return null;
    for (const stroke of node.strokes) {
      if (stroke.type === "SOLID" && stroke.visible !== false) {
        return rgbToHex(stroke.color);
      }
    }
    return null;
  }
  function collectColors(root) {
    const colors = {};
    function walk(node) {
      if ("fills" in node && node.fills && Array.isArray(node.fills)) {
        for (const fill of node.fills) {
          if (fill.type === "SOLID" && fill.visible !== false) {
            const hex = rgbToHex(fill.color);
            colors[hex] = (colors[hex] || 0) + 1;
          }
        }
      }
      if ("strokes" in node && node.strokes && Array.isArray(node.strokes)) {
        for (const stroke of node.strokes) {
          if (stroke.type === "SOLID" && stroke.visible !== false) {
            const hex = rgbToHex(stroke.color);
            colors[hex] = (colors[hex] || 0) + 1;
          }
        }
      }
      if ("children" in node) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(root);
    return colors;
  }
  var init_color = __esm({
    "src/sandbox/color.ts"() {
      "use strict";
    }
  });

  // src/sandbox/effects.ts
  function rgbaString(color) {
    const a = color.a !== void 0 ? Math.round(color.a * 100) / 100 : 1;
    return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${a})`;
  }
  function shadowToCss(e, inset) {
    const x = Math.round(e.offset.x);
    const y = Math.round(e.offset.y);
    const blur = Math.round(e.radius);
    const spread = Math.round(e.spread || 0);
    const color = rgbaString(e.color);
    const prefix = inset ? "inset " : "";
    return `${prefix}${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }
  function extractEffects(node) {
    const result = {
      boxShadow: null,
      textShadow: null,
      filter: null,
      backdropFilter: null
    };
    if (!node.effects || !Array.isArray(node.effects) || node.effects.length === 0) {
      return result;
    }
    const isText = node.type === "TEXT";
    const shadowStrings = [];
    const textShadowStrings = [];
    const filterParts = [];
    const backdropParts = [];
    for (const effect of node.effects) {
      if (effect.visible === false) continue;
      if (effect.type === "DROP_SHADOW") {
        const e = effect;
        if (isText) {
          const x = Math.round(e.offset.x);
          const y = Math.round(e.offset.y);
          const blur = Math.round(e.radius);
          textShadowStrings.push(`${x}px ${y}px ${blur}px ${rgbaString(e.color)}`);
        } else {
          shadowStrings.push(shadowToCss(e, false));
        }
      } else if (effect.type === "INNER_SHADOW") {
        const e = effect;
        if (!isText) shadowStrings.push(shadowToCss(e, true));
      } else if (effect.type === "LAYER_BLUR") {
        const e = effect;
        filterParts.push(`blur(${Math.round(e.radius)}px)`);
      } else if (effect.type === "BACKGROUND_BLUR") {
        const e = effect;
        backdropParts.push(`blur(${Math.round(e.radius)}px)`);
      }
    }
    if (shadowStrings.length > 0) result.boxShadow = shadowStrings.join(", ");
    if (textShadowStrings.length > 0) result.textShadow = textShadowStrings.join(", ");
    if (filterParts.length > 0) result.filter = filterParts.join(" ");
    if (backdropParts.length > 0) result.backdropFilter = backdropParts.join(" ");
    return result;
  }
  var init_effects = __esm({
    "src/sandbox/effects.ts"() {
      "use strict";
    }
  });

  // src/sandbox/typography.ts
  function fontWeightFromStyle(style) {
    const s = style.toLowerCase();
    if (s.includes("thin") || s.includes("hairline")) return 100;
    if (s.includes("extralight") || s.includes("ultra light") || s.includes("extra light")) return 200;
    if (s.includes("light")) return 300;
    if (s.includes("medium")) return 500;
    if (s.includes("semibold") || s.includes("semi bold") || s.includes("demi bold") || s.includes("demibold")) return 600;
    if (s.includes("extrabold") || s.includes("extra bold") || s.includes("ultra bold") || s.includes("ultrabold")) return 800;
    if (s.includes("black") || s.includes("heavy")) return 900;
    if (s.includes("bold")) return 700;
    return 400;
  }
  function mapTextAlign(align) {
    switch (align) {
      case "LEFT":
        return "left";
      case "CENTER":
        return "center";
      case "RIGHT":
        return "right";
      case "JUSTIFIED":
        return "justify";
      default:
        return null;
    }
  }
  function mapTextCase(textCase) {
    switch (textCase) {
      case "UPPER":
        return "uppercase";
      case "LOWER":
        return "lowercase";
      case "TITLE":
        return "capitalize";
      case "ORIGINAL":
      default:
        return "none";
    }
  }
  function extractTypography(node) {
    const styles = {};
    const fontName = node.fontName;
    if (fontName !== figma.mixed && fontName) {
      styles.fontFamily = fontName.family;
      styles.fontWeight = fontWeightFromStyle(fontName.style);
    }
    const fontSize = node.fontSize;
    if (fontSize !== figma.mixed && typeof fontSize === "number") {
      styles.fontSize = toCssValue(fontSize);
    }
    const lh = node.lineHeight;
    if (lh !== figma.mixed && lh) {
      if (lh.unit === "PIXELS") {
        styles.lineHeight = toCssValue(lh.value);
      } else if (lh.unit === "PERCENT") {
        styles.lineHeight = `${Math.round(lh.value)}%`;
      } else {
        styles.lineHeight = null;
      }
    }
    const ls = node.letterSpacing;
    if (ls !== figma.mixed && ls) {
      if (ls.unit === "PIXELS") {
        styles.letterSpacing = toCssValue(ls.value);
      } else if (ls.unit === "PERCENT") {
        const emValue = Math.round(ls.value / 100 * 100) / 100;
        styles.letterSpacing = `${emValue}em`;
      }
    }
    const textCase = node.textCase;
    if (textCase !== figma.mixed) {
      styles.textTransform = mapTextCase(textCase);
    }
    const textAlign = node.textAlignHorizontal;
    if (textAlign) {
      styles.textAlign = mapTextAlign(textAlign);
    }
    const td = node.textDecoration;
    if (td !== void 0 && td !== figma.mixed) {
      if (td === "UNDERLINE") styles.textDecoration = "underline";
      else if (td === "STRIKETHROUGH") styles.textDecoration = "line-through";
      else styles.textDecoration = null;
    }
    styles.color = extractTextColor(node);
    const effects = extractEffects(node);
    if (effects.textShadow) styles.textShadow = effects.textShadow;
    const styleName = extractTextStyleName(node);
    if (styleName) styles.textStyleName = styleName;
    const segments = extractTextSegments(node);
    if (segments) styles.textSegments = segments;
    return styles;
  }
  function extractTextStyleName(node) {
    try {
      const id = node.textStyleId;
      if (!id || id === figma.mixed || typeof id !== "string") return null;
      const style = figma.getStyleById(id);
      return (style == null ? void 0 : style.name) || null;
    } catch (e) {
      return null;
    }
  }
  function extractTextSegments(node) {
    if (!node.characters) return null;
    try {
      const getSegments = node.getStyledTextSegments;
      if (typeof getSegments !== "function") return null;
      const raw = getSegments.call(node, ["fontName", "fontSize", "fills", "textDecoration"]);
      if (!raw || !Array.isArray(raw) || raw.length <= 1) return null;
      const segments = raw.map((s) => {
        const seg = { text: s.characters || "" };
        if (s.fontName && typeof s.fontName === "object") {
          seg.fontFamily = s.fontName.family;
          seg.fontWeight = fontWeightFromStyle(s.fontName.style);
          if (s.fontName.style.toLowerCase().includes("italic")) seg.italic = true;
        }
        if (typeof s.fontSize === "number") seg.fontSize = s.fontSize;
        if (Array.isArray(s.fills)) {
          for (const f of s.fills) {
            if (f.type === "SOLID" && f.visible !== false) {
              seg.color = rgbToHex(f.color);
              break;
            }
          }
        }
        if (s.textDecoration === "UNDERLINE") seg.textDecoration = "underline";
        else if (s.textDecoration === "STRIKETHROUGH") seg.textDecoration = "line-through";
        return seg;
      });
      const first = segments[0];
      const allSame = segments.every(
        (s) => s.fontFamily === first.fontFamily && s.fontWeight === first.fontWeight && s.fontSize === first.fontSize && s.color === first.color && s.italic === first.italic && s.textDecoration === first.textDecoration
      );
      return allSame ? null : segments;
    } catch (e) {
      return null;
    }
  }
  function collectFonts(root) {
    const fonts = {};
    function walk(node) {
      if (node.type === "TEXT") {
        const fontName = node.fontName;
        if (fontName !== figma.mixed && fontName) {
          const family = fontName.family;
          if (!fonts[family]) {
            fonts[family] = { styles: /* @__PURE__ */ new Set(), sizes: /* @__PURE__ */ new Set(), count: 0 };
          }
          fonts[family].styles.add(fontName.style);
          fonts[family].count++;
          const fontSize = node.fontSize;
          if (fontSize !== figma.mixed && typeof fontSize === "number") {
            fonts[family].sizes.add(fontSize);
          }
        }
      }
      if ("children" in node) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(root);
    return fonts;
  }
  function countTextNodes(root) {
    let count = 0;
    function walk(node) {
      if (node.type === "TEXT") count++;
      if ("children" in node) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(root);
    return count;
  }
  var init_typography = __esm({
    "src/sandbox/typography.ts"() {
      "use strict";
      init_utils();
      init_color();
      init_effects();
    }
  });

  // src/sandbox/spacing.ts
  function extractAutoLayoutSpacing(node) {
    return {
      spacingSource: "auto-layout",
      sectionStyles: {
        paddingTop: toCssValue(node.paddingTop),
        paddingBottom: toCssValue(node.paddingBottom),
        paddingLeft: toCssValue(node.paddingLeft),
        paddingRight: toCssValue(node.paddingRight)
      },
      itemSpacing: toCssValue(node.itemSpacing)
    };
  }
  function extractAbsoluteSpacing(node) {
    const parentBounds = node.absoluteBoundingBox;
    if (!parentBounds) {
      return {
        spacingSource: "absolute-coordinates",
        sectionStyles: {
          paddingTop: null,
          paddingBottom: null,
          paddingLeft: null,
          paddingRight: null
        },
        itemSpacing: null
      };
    }
    const children = node.children.filter((c) => c.visible !== false && c.absoluteBoundingBox).sort((a, b) => a.absoluteBoundingBox.y - b.absoluteBoundingBox.y);
    if (children.length === 0) {
      return {
        spacingSource: "absolute-coordinates",
        sectionStyles: {
          paddingTop: null,
          paddingBottom: null,
          paddingLeft: null,
          paddingRight: null
        },
        itemSpacing: null
      };
    }
    const firstChild = children[0].absoluteBoundingBox;
    const lastChild = children[children.length - 1].absoluteBoundingBox;
    const paddingTop = firstChild.y - parentBounds.y;
    const paddingBottom = parentBounds.y + parentBounds.height - (lastChild.y + lastChild.height);
    const leftMost = Math.min(...children.map((c) => c.absoluteBoundingBox.x));
    const paddingLeft = leftMost - parentBounds.x;
    const rightMost = Math.max(...children.map((c) => c.absoluteBoundingBox.x + c.absoluteBoundingBox.width));
    const paddingRight = parentBounds.x + parentBounds.width - rightMost;
    let totalGap = 0;
    let gapCount = 0;
    for (let i = 0; i < children.length - 1; i++) {
      const currBottom = children[i].absoluteBoundingBox.y + children[i].absoluteBoundingBox.height;
      const nextTop = children[i + 1].absoluteBoundingBox.y;
      const gap = nextTop - currBottom;
      if (gap > 0) {
        totalGap += gap;
        gapCount++;
      }
    }
    const avgGap = gapCount > 0 ? Math.round(totalGap / gapCount) : 0;
    return {
      spacingSource: "absolute-coordinates",
      sectionStyles: {
        paddingTop: toCssValue(Math.max(0, Math.round(paddingTop))),
        paddingBottom: toCssValue(Math.max(0, Math.round(paddingBottom))),
        paddingLeft: toCssValue(Math.max(0, Math.round(paddingLeft))),
        paddingRight: toCssValue(Math.max(0, Math.round(paddingRight)))
      },
      itemSpacing: avgGap > 0 ? toCssValue(avgGap) : null
    };
  }
  function collectSpacing(root) {
    const spacingMap = {};
    function addValue(v) {
      if (v > 0 && v < 1e3) {
        const rounded = Math.round(v);
        spacingMap[rounded] = (spacingMap[rounded] || 0) + 1;
      }
    }
    function walk(node) {
      if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") {
        const frame = node;
        if (frame.layoutMode && frame.layoutMode !== "NONE") {
          addValue(frame.paddingTop);
          addValue(frame.paddingBottom);
          addValue(frame.paddingLeft);
          addValue(frame.paddingRight);
          addValue(frame.itemSpacing);
        }
      }
      if ("children" in node) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(root);
    return Object.entries(spacingMap).map(([value, count]) => ({ value: Number(value), count })).sort((a, b) => a.value - b.value);
  }
  var init_spacing = __esm({
    "src/sandbox/spacing.ts"() {
      "use strict";
      init_utils();
    }
  });

  // src/sandbox/grid.ts
  function detectGrid(node) {
    if (node.layoutMode && node.layoutMode !== "NONE") {
      const isWrapping = "layoutWrap" in node && node.layoutWrap === "WRAP";
      if (isWrapping) {
        const columns2 = estimateColumnsFromChildren(node);
        return {
          layoutMode: "flex",
          columns: columns2,
          gap: toCssValue(node.itemSpacing),
          rowGap: "counterAxisSpacing" in node ? toCssValue(node.counterAxisSpacing) : null,
          columnGap: null,
          itemMinWidth: estimateItemMinWidth(node, columns2)
        };
      }
      const isHorizontal = node.layoutMode === "HORIZONTAL";
      if (isHorizontal) {
        const columns2 = node.children.filter((c) => c.visible !== false).length;
        return {
          layoutMode: "flex",
          columns: columns2,
          gap: toCssValue(node.itemSpacing),
          rowGap: null,
          columnGap: null,
          itemMinWidth: null
        };
      }
      const horizontalChild = node.children.find(
        (c) => c.visible !== false && (c.type === "FRAME" || c.type === "COMPONENT" || c.type === "INSTANCE") && c.layoutMode === "HORIZONTAL"
      );
      if (horizontalChild) {
        const innerColumns = horizontalChild.children.filter((c) => c.visible !== false).length;
        return {
          layoutMode: "flex",
          columns: innerColumns,
          gap: toCssValue(horizontalChild.itemSpacing),
          rowGap: toCssValue(node.itemSpacing),
          columnGap: null,
          itemMinWidth: estimateItemMinWidth(horizontalChild, innerColumns)
        };
      }
      return {
        layoutMode: "flex",
        columns: 1,
        gap: toCssValue(node.itemSpacing),
        rowGap: null,
        columnGap: null,
        itemMinWidth: null
      };
    }
    const columns = estimateColumnsFromAbsoluteChildren(node);
    return {
      layoutMode: "absolute",
      columns,
      gap: estimateGapFromAbsoluteChildren(node),
      rowGap: null,
      columnGap: null,
      itemMinWidth: null
    };
  }
  function estimateColumnsFromChildren(node) {
    const visible = node.children.filter((c) => c.visible !== false && c.absoluteBoundingBox);
    if (visible.length <= 1) return 1;
    const firstY = visible[0].absoluteBoundingBox.y;
    const tolerance = 5;
    let columnsInFirstRow = 0;
    for (const child of visible) {
      if (Math.abs(child.absoluteBoundingBox.y - firstY) <= tolerance) {
        columnsInFirstRow++;
      } else {
        break;
      }
    }
    return Math.max(1, columnsInFirstRow);
  }
  function estimateColumnsFromAbsoluteChildren(node) {
    const visible = node.children.filter((c) => c.visible !== false && c.absoluteBoundingBox).sort((a, b) => a.absoluteBoundingBox.y - b.absoluteBoundingBox.y);
    if (visible.length <= 1) return 1;
    const firstY = visible[0].absoluteBoundingBox.y;
    const tolerance = 10;
    let count = 0;
    for (const child of visible) {
      if (Math.abs(child.absoluteBoundingBox.y - firstY) <= tolerance) {
        count++;
      } else {
        break;
      }
    }
    return Math.max(1, count);
  }
  function estimateGapFromAbsoluteChildren(node) {
    const visible = node.children.filter((c) => c.visible !== false && c.absoluteBoundingBox).sort((a, b) => a.absoluteBoundingBox.x - b.absoluteBoundingBox.x);
    if (visible.length < 2) return null;
    const firstY = visible[0].absoluteBoundingBox.y;
    const tolerance = 10;
    const firstRow = visible.filter(
      (c) => Math.abs(c.absoluteBoundingBox.y - firstY) <= tolerance
    );
    if (firstRow.length < 2) return null;
    let totalGap = 0;
    for (let i = 0; i < firstRow.length - 1; i++) {
      const rightEdge = firstRow[i].absoluteBoundingBox.x + firstRow[i].absoluteBoundingBox.width;
      const nextLeft = firstRow[i + 1].absoluteBoundingBox.x;
      totalGap += nextLeft - rightEdge;
    }
    const avgGap = Math.round(totalGap / (firstRow.length - 1));
    return avgGap > 0 ? toCssValue(avgGap) : null;
  }
  function estimateItemMinWidth(node, columns) {
    if (columns <= 1) return null;
    const visible = node.children.filter((c) => c.visible !== false && c.absoluteBoundingBox);
    if (visible.length === 0) return null;
    const widths = visible.map((c) => c.absoluteBoundingBox.width);
    const minWidth = Math.min(...widths);
    return toCssValue(Math.round(minWidth));
  }
  var init_grid = __esm({
    "src/sandbox/grid.ts"() {
      "use strict";
      init_utils();
    }
  });

  // src/sandbox/interactions.ts
  function mapTrigger(triggerType) {
    switch (triggerType) {
      case "ON_HOVER":
        return "hover";
      case "ON_CLICK":
        return "click";
      case "ON_PRESS":
        return "press";
      case "MOUSE_ENTER":
        return "mouse-enter";
      case "MOUSE_LEAVE":
        return "mouse-leave";
      default:
        return null;
    }
  }
  function mapEasing(easing) {
    if (!easing) return "ease";
    switch (easing.type) {
      case "EASE_IN":
        return "ease-in";
      case "EASE_OUT":
        return "ease-out";
      case "EASE_IN_AND_OUT":
        return "ease-in-out";
      case "LINEAR":
        return "linear";
      case "CUSTOM_CUBIC_BEZIER": {
        const b = easing.easingFunctionCubicBezier;
        if (b) return `cubic-bezier(${b.x1}, ${b.y1}, ${b.x2}, ${b.y2})`;
        return "ease";
      }
      default:
        return "ease";
    }
  }
  function diffNodeStyles(source, dest) {
    const changes = {};
    const srcBg = extractBackgroundColor(source);
    const destBg = extractBackgroundColor(dest);
    if (srcBg && destBg && srcBg !== destBg) {
      changes.backgroundColor = { from: srcBg, to: destBg };
    }
    if ("opacity" in source && "opacity" in dest) {
      const srcOp = source.opacity;
      const destOp = dest.opacity;
      if (srcOp !== void 0 && destOp !== void 0 && Math.abs(srcOp - destOp) > 0.01) {
        changes.opacity = { from: String(srcOp), to: String(destOp) };
      }
    }
    if (source.absoluteBoundingBox && dest.absoluteBoundingBox) {
      const srcW = source.absoluteBoundingBox.width;
      const destW = dest.absoluteBoundingBox.width;
      if (srcW > 0 && destW > 0) {
        const scaleX = Math.round(destW / srcW * 100) / 100;
        if (Math.abs(scaleX - 1) > 0.01) {
          changes.transform = { from: "scale(1)", to: `scale(${scaleX})` };
        }
      }
    }
    if ("cornerRadius" in source && "cornerRadius" in dest) {
      const srcR = source.cornerRadius;
      const destR = dest.cornerRadius;
      if (typeof srcR === "number" && typeof destR === "number" && srcR !== destR) {
        changes.borderRadius = { from: toCssValue(srcR), to: toCssValue(destR) };
      }
    }
    if ("effects" in source && "effects" in dest) {
      const srcShadow = extractBoxShadow(source);
      const destShadow = extractBoxShadow(dest);
      if (srcShadow !== destShadow) {
        changes.boxShadow = { from: srcShadow || "none", to: destShadow || "none" };
      }
    }
    if ("strokes" in source && "strokes" in dest) {
      const srcStroke = extractStrokeColor2(source);
      const destStroke = extractStrokeColor2(dest);
      if (srcStroke && destStroke && srcStroke !== destStroke) {
        changes.borderColor = { from: srcStroke, to: destStroke };
      }
    }
    return changes;
  }
  function extractBoxShadow(node) {
    if (!node.effects) return null;
    for (const effect of node.effects) {
      if (effect.type === "DROP_SHADOW" && effect.visible !== false) {
        const { offset, radius, spread, color } = effect;
        const hex = rgbToHex(color);
        const alpha = Math.round((color.a || 1) * 100) / 100;
        return `${offset.x}px ${offset.y}px ${radius}px ${spread || 0}px rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${alpha})`;
      }
    }
    return null;
  }
  function extractStrokeColor2(node) {
    if (!node.strokes) return null;
    for (const stroke of node.strokes) {
      if (stroke.type === "SOLID" && stroke.visible !== false) {
        return rgbToHex(stroke.color);
      }
    }
    return null;
  }
  function extractInteractions(sectionRoot) {
    const interactions = [];
    function walk(node) {
      var _a;
      if ("reactions" in node) {
        const reactions = node.reactions;
        if (reactions && reactions.length > 0) {
          for (const reaction of reactions) {
            const trigger = mapTrigger((_a = reaction.trigger) == null ? void 0 : _a.type);
            if (!trigger) continue;
            const action = reaction.action || reaction.actions && reaction.actions[0];
            if (!action) continue;
            const transition = action.transition;
            const duration = (transition == null ? void 0 : transition.duration) ? `${transition.duration}s` : "0.3s";
            const easing = mapEasing(transition == null ? void 0 : transition.easing);
            if (action.destinationId && (trigger === "hover" || trigger === "mouse-enter" || trigger === "click")) {
              try {
                const destNode = figma.getNodeById(action.destinationId);
                if (destNode) {
                  const propertyChanges = diffNodeStyles(node, destNode);
                  if (Object.keys(propertyChanges).length > 0) {
                    interactions.push({
                      elementName: node.name,
                      figmaNodeId: node.id,
                      trigger,
                      transition: { duration, easing },
                      propertyChanges
                    });
                  }
                }
              } catch (e) {
              }
            }
          }
        }
      }
      if ("children" in node) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(sectionRoot);
    return interactions;
  }
  var init_interactions = __esm({
    "src/sandbox/interactions.ts"() {
      "use strict";
      init_color();
      init_utils();
    }
  });

  // src/sandbox/variables.ts
  function extractVariables() {
    const out = {
      collections: {},
      flat: {},
      present: false
    };
    if (!figma.variables || typeof figma.variables.getLocalVariables !== "function") {
      return out;
    }
    let collectionsById = {};
    try {
      const localCollections = figma.variables.getLocalVariableCollections();
      for (const col of localCollections) {
        collectionsById[col.id] = col;
      }
    } catch (e) {
      return out;
    }
    let variables = [];
    try {
      variables = figma.variables.getLocalVariables();
    } catch (e) {
      return out;
    }
    if (!variables || variables.length === 0) return out;
    out.present = true;
    for (const v of variables) {
      const collection = collectionsById[v.variableCollectionId];
      if (!collection) continue;
      const defaultModeId = collection.defaultModeId;
      const raw = v.valuesByMode[defaultModeId];
      if (raw === void 0) continue;
      let value;
      if (v.resolvedType === "COLOR") {
        if (raw && typeof raw === "object" && "r" in raw) {
          value = rgbToHex(raw);
        } else {
          continue;
        }
      } else if (v.resolvedType === "FLOAT") {
        value = typeof raw === "number" ? raw : Number(raw);
      } else if (v.resolvedType === "STRING") {
        value = typeof raw === "string" ? raw : String(raw);
      } else if (v.resolvedType === "BOOLEAN") {
        value = Boolean(raw);
      } else {
        continue;
      }
      const collectionName = collection.name || "Default";
      if (!out.collections[collectionName]) out.collections[collectionName] = {};
      out.collections[collectionName][v.name] = value;
      const flatKey = `${collectionName}/${v.name}`;
      out.flat[flatKey] = value;
    }
    return out;
  }
  function toCssCustomProperty(variableName, collectionName) {
    const col = collectionName.toLowerCase();
    const name = variableName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (col.includes("color") || col.includes("colour")) return `--clr-${name}`;
    if (col.includes("spac")) return `--space-${name}`;
    if (col.includes("radius")) return `--radius-${name}`;
    if (col.includes("font") && col.includes("size")) return `--fs-${name}`;
    if (col.includes("font") && col.includes("weight")) return `--fw-${name}`;
    if (col.includes("font") || col.includes("family")) return `--ff-${name}`;
    if (col.includes("line")) return `--lh-${name}`;
    return `--${col.replace(/[^a-z0-9]+/g, "-")}-${name}`;
  }
  var init_variables = __esm({
    "src/sandbox/variables.ts"() {
      "use strict";
      init_color();
    }
  });

  // src/sandbox/patterns.ts
  function structureFingerprint(node, depth = 0) {
    const parts = [`T=${node.type}`];
    if (hasImageFill(node)) parts.push("IMG");
    if ("children" in node && depth < 2) {
      const childFps = [];
      for (const child of node.children) {
        if (child.visible === false) continue;
        childFps.push(structureFingerprint(child, depth + 1));
      }
      childFps.sort();
      parts.push(`C=[${childFps.join(",")}]`);
    }
    return parts.join("|");
  }
  function detectRepeaters(sectionNode) {
    const repeaters = {};
    const usedKeys = /* @__PURE__ */ new Set();
    function keyFor(containerName) {
      const base = containerName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || `repeater_${Object.keys(repeaters).length + 1}`;
      if (!usedKeys.has(base)) {
        usedKeys.add(base);
        return base;
      }
      let i = 2;
      while (usedKeys.has(`${base}_${i}`)) i++;
      usedKeys.add(`${base}_${i}`);
      return `${base}_${i}`;
    }
    function walk(node, depth) {
      if (depth > 5) return false;
      if (!("children" in node)) return false;
      const kids = node.children.filter((c) => c.visible !== false);
      if (kids.length >= 2) {
        const groups = /* @__PURE__ */ new Map();
        for (const k of kids) {
          const fp = structureFingerprint(k);
          if (!groups.has(fp)) groups.set(fp, []);
          groups.get(fp).push(k);
        }
        let bestGroup = null;
        for (const g of groups.values()) {
          if (!bestGroup || g.length > bestGroup.length) bestGroup = g;
        }
        if (bestGroup && bestGroup.length >= 2) {
          const isBigGroup = bestGroup.length >= 3;
          const hintMatch = REPEATER_NAME_HINTS.test(node.name || "");
          const dominates = bestGroup.length >= Math.ceil(kids.length * 0.6);
          if (isBigGroup || hintMatch && dominates) {
            const key = keyFor(node.name || "repeater");
            repeaters[key] = {
              containerLayerName: node.name,
              itemCount: bestGroup.length,
              templateLayerName: bestGroup[0].name,
              items: bestGroup.map(extractRepeaterItem)
            };
            return true;
          }
        }
      }
      for (const c of kids) walk(c, depth + 1);
      return false;
    }
    if ("children" in sectionNode) {
      for (const c of sectionNode.children) {
        if (c.visible !== false) walk(c, 0);
      }
    }
    return repeaters;
  }
  function extractRepeaterItem(node) {
    const item = { texts: {} };
    let textIndex = 0;
    let firstImageName = null;
    let firstImageAlt = null;
    function walk(n) {
      if (n.visible === false) return;
      if (n.type === "TEXT") {
        const t = n;
        const clean = (t.name || "").toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        const role = clean && !/^(text|frame|group|rectangle)\d*$/.test(clean) ? clean : `text_${textIndex}`;
        if (t.characters) item.texts[role] = t.characters;
        textIndex++;
      }
      if (!firstImageName && hasImageFill(n)) {
        firstImageName = `${slugify(n.name || "image")}.png`;
        if (n.name && !isDefaultLayerName(n.name)) {
          firstImageAlt = n.name.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
        }
      }
      if (!item.linkUrl && "reactions" in n) {
        const reactions = n.reactions;
        if (Array.isArray(reactions)) {
          outer: for (const r of reactions) {
            const actions = r.actions || (r.action ? [r.action] : []);
            for (const a of actions) {
              if (a && a.type === "URL" && a.url) {
                item.linkUrl = a.url;
                break outer;
              }
            }
          }
        }
      }
      if ("children" in n) {
        for (const c of n.children) walk(c);
      }
    }
    walk(node);
    if (firstImageName) item.imageFile = firstImageName;
    if (firstImageAlt) item.alt = firstImageAlt;
    return item;
  }
  function detectComponentPatterns(sectionNode) {
    const patterns = [];
    const seenNodeIds = /* @__PURE__ */ new Set();
    function addPattern(p) {
      if (seenNodeIds.has(p.rootNodeId)) return;
      seenNodeIds.add(p.rootNodeId);
      patterns.push(p);
    }
    function walk(node, depth) {
      var _a;
      if (depth > 6 || node.visible === false) return;
      const name = node.name || "";
      if (MODAL_RX.test(name) && "children" in node) {
        addPattern({
          type: "modal",
          rootNodeId: node.id,
          rootNodeName: node.name,
          confidence: "high"
        });
        return;
      }
      if ("children" in node) {
        const frame = node;
        const kids = frame.children.filter((c) => c.visible !== false);
        const nameCarousel = CAROUSEL_RX.test(name);
        const horizontalClipped = frame.layoutMode === "HORIZONTAL" && frame.clipsContent === true;
        if (nameCarousel || horizontalClipped) {
          if (kids.length >= 3) {
            const fp0 = structureFingerprint(kids[0]);
            const matching = kids.filter((k) => structureFingerprint(k) === fp0).length;
            if (matching >= 3) {
              addPattern({
                type: "carousel",
                rootNodeId: node.id,
                rootNodeName: node.name,
                itemCount: matching,
                confidence: nameCarousel ? "high" : "low",
                meta: {
                  layoutMode: frame.layoutMode,
                  clipsContent: frame.clipsContent,
                  itemSpacing: (_a = frame.itemSpacing) != null ? _a : null
                }
              });
              return;
            }
          }
        }
        if (ACCORDION_RX.test(name) && kids.length >= 2) {
          const items = [];
          for (const k of kids) {
            const all = collectAllText(k);
            if (all.length > 0) {
              items.push({ question: all[0], answer: all.slice(1).join(" ") || void 0 });
            }
          }
          if (items.length >= 2) {
            addPattern({
              type: "accordion",
              rootNodeId: node.id,
              rootNodeName: node.name,
              itemCount: items.length,
              confidence: "high",
              meta: { items }
            });
            return;
          }
        }
        if (TABS_RX.test(name) && kids.length >= 2) {
          addPattern({
            type: "tabs",
            rootNodeId: node.id,
            rootNodeName: node.name,
            itemCount: kids.length,
            confidence: "high"
          });
          return;
        }
        for (const c of kids) walk(c, depth + 1);
      }
    }
    walk(sectionNode, 0);
    return patterns;
  }
  function collectAllText(node) {
    const out = [];
    function walk(n) {
      if (n.visible === false) return;
      if (n.type === "TEXT") {
        const chars = (n.characters || "").trim();
        if (chars) out.push(chars);
      }
      if ("children" in n) {
        for (const c of n.children) walk(c);
      }
    }
    walk(node);
    return out;
  }
  function detectNavigation(sectionNode) {
    const links = [];
    const seen = /* @__PURE__ */ new Set();
    function walk(node, depth) {
      if (depth > 6 || node.visible === false) return;
      if (node.type === "TEXT") {
        const t = node;
        const text = (t.characters || "").trim();
        if (!text || text.length > 40) return;
        const fs = t.fontSize !== figma.mixed ? t.fontSize : 16;
        if (fs > 22) return;
        if (seen.has(text.toLowerCase())) return;
        seen.add(text.toLowerCase());
        let href = null;
        const reactions = t.reactions;
        if (Array.isArray(reactions)) {
          outer: for (const r of reactions) {
            const actions = r.actions || (r.action ? [r.action] : []);
            for (const a of actions) {
              if (a && a.type === "URL" && a.url) {
                href = a.url;
                break outer;
              }
            }
          }
        }
        links.push({ label: text, href });
        return;
      }
      if ("children" in node) {
        for (const c of node.children) walk(c, depth + 1);
      }
    }
    walk(sectionNode, 0);
    if (links.length < 2) return null;
    return { links };
  }
  function inferSectionType(p) {
    if (p.isGlobal && p.globalRole === "header") return { type: "header", confidence: "high" };
    if (p.isGlobal && p.globalRole === "footer") return { type: "footer", confidence: "high" };
    const name = (p.layerName || "").toLowerCase();
    const explicit = [
      { rx: /\bhero\b/, type: "hero" },
      { rx: /\b(features?|benefits?|services?)\b/, type: "features" },
      { rx: /\btestimonials?\b/, type: "testimonials" },
      { rx: /\b(cta|call[- ]?to[- ]?action)\b/, type: "cta" },
      { rx: /\b(faqs?|frequently[- ]asked)\b/, type: "faq" },
      { rx: /\b(pricing|plans?)\b/, type: "pricing" },
      { rx: /\bcontact\b/, type: "contact" },
      { rx: /\b(logos?|clients?|partners?|brands?)\b/, type: "logos" },
      { rx: /\bfooter\b/, type: "footer" },
      { rx: /\b(header|nav|navbar|navigation)\b/, type: "header" },
      { rx: /\b(blog|articles?|news|posts?)\b/, type: "blog_grid" }
    ];
    for (const { rx, type } of explicit) {
      if (rx.test(name)) return { type, confidence: "high" };
    }
    if (p.patterns.some((pt) => pt.type === "accordion")) return { type: "faq", confidence: "high" };
    if (p.isFormSection) return { type: "contact", confidence: "high" };
    const repKeys = Object.keys(p.repeaters);
    if (repKeys.length > 0) {
      const rep = p.repeaters[repKeys[0]];
      const first = rep.items[0];
      if (first) {
        const hasImage = !!first.imageFile;
        const textVals = Object.values(first.texts);
        const textKeys = Object.keys(first.texts);
        const joined = textVals.join(" ");
        const hasPrice = /[$€£]\s*\d|\b\d+\s*(\/(mo|yr)|per (month|year))\b/i.test(joined);
        const longQuote = textVals.some((v) => (v || "").length > 100);
        const isLogoOnly = hasImage && textKeys.length === 0;
        const hasDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/i.test(joined) || /\d{4}-\d{2}-\d{2}/.test(joined) || /\b(min read|reading time)\b/i.test(joined);
        if (hasPrice) return { type: "pricing", confidence: "low" };
        if (isLogoOnly) return { type: "logos", confidence: "low" };
        if (hasDate) return { type: "blog_grid", confidence: "low" };
        if (longQuote) return { type: "testimonials", confidence: "low" };
        if (hasImage && textKeys.length >= 2) return { type: "features", confidence: "low" };
      }
    }
    if (p.sectionIndex === 0) {
      const hasBigHeading = p.textContentInOrder.some((t) => t.fontSize >= 40);
      const hasButton = Object.keys(p.elements).some((k) => /button|cta|btn/i.test(k));
      const hasImage = Object.keys(p.elements).some((k) => /image|photo|hero/i.test(k) || k === "background_image");
      if (hasBigHeading && (hasButton || hasImage)) return { type: "hero", confidence: "low" };
    }
    const hasButtonEl = Object.keys(p.elements).filter((k) => /button|cta|btn/i.test(k)).length >= 1;
    const textCount = p.textContentInOrder.length;
    if (hasButtonEl && textCount <= 3 && repKeys.length === 0) {
      return { type: "cta", confidence: "low" };
    }
    return { type: "generic", confidence: "low" };
  }
  function normalizeSectionName(name) {
    return (name || "").toLowerCase().replace(/\s*[—–\-]\s*(desktop|mobile|tablet)\b/gi, "").replace(/\s+\d{3,4}$/g, "").trim();
  }
  function classifyGlobalRole(sectionIndex, totalSections, sectionHeight) {
    if (sectionIndex <= 1 && sectionHeight <= 200) return "header";
    if (sectionIndex >= totalSections - 2) return "footer";
    return null;
  }
  var REPEATER_NAME_HINTS, CAROUSEL_RX, ACCORDION_RX, TABS_RX, MODAL_RX;
  var init_patterns = __esm({
    "src/sandbox/patterns.ts"() {
      "use strict";
      init_utils();
      init_color();
      REPEATER_NAME_HINTS = /\b(cards?|items?|list|grid|features?|services?|team|logos?|testimonials?|pricing|plans?|articles?|posts?|blog|faqs?)\b/i;
      CAROUSEL_RX = /\b(carousel|slider|swiper|gallery|slideshow)\b/i;
      ACCORDION_RX = /\b(accordion|faq|collapse|expander|collapsible)\b/i;
      TABS_RX = /\btabs?\b/i;
      MODAL_RX = /\b(modal|popup|dialog|overlay|lightbox)\b/i;
    }
  });

  // src/sandbox/section-parser.ts
  function identifySections(pageFrame) {
    let candidates = pageFrame.children.filter(
      (c) => c.visible !== false && (c.type === "FRAME" || c.type === "COMPONENT" || c.type === "INSTANCE" || c.type === "GROUP")
    );
    if (candidates.length === 1 && "children" in candidates[0]) {
      const wrapper = candidates[0];
      const innerCandidates = wrapper.children.filter(
        (c) => c.visible !== false && (c.type === "FRAME" || c.type === "COMPONENT" || c.type === "INSTANCE" || c.type === "GROUP")
      );
      if (innerCandidates.length > 1) {
        candidates = innerCandidates;
      }
    }
    return [...candidates].sort((a, b) => {
      var _a, _b, _c, _d;
      const aY = (_b = (_a = a.absoluteBoundingBox) == null ? void 0 : _a.y) != null ? _b : 0;
      const bY = (_d = (_c = b.absoluteBoundingBox) == null ? void 0 : _c.y) != null ? _d : 0;
      return aY - bY;
    });
  }
  function extractSectionStyles(node) {
    const bg = extractBackgroundColor(node);
    const gradient = extractGradient(node);
    const bounds = node.absoluteBoundingBox;
    const effects = extractEffects(node);
    const corners = extractPerCornerRadius(node);
    const styles = {
      paddingTop: null,
      // Set by spacing extractor
      paddingBottom: null,
      paddingLeft: null,
      paddingRight: null,
      backgroundColor: bg,
      backgroundImage: hasImageFill(node) ? "url(...)" : null,
      backgroundGradient: gradient,
      minHeight: bounds ? toCssValue(bounds.height) : null,
      overflow: null,
      boxShadow: effects.boxShadow,
      filter: effects.filter,
      backdropFilter: effects.backdropFilter
    };
    if (corners) {
      if (corners.uniform !== null) {
        styles.borderRadius = toCssValue(corners.uniform);
      } else {
        styles.borderTopLeftRadius = toCssValue(corners.topLeft);
        styles.borderTopRightRadius = toCssValue(corners.topRight);
        styles.borderBottomLeftRadius = toCssValue(corners.bottomLeft);
        styles.borderBottomRightRadius = toCssValue(corners.bottomRight);
      }
    }
    applyStrokes(styles, node);
    if ("opacity" in node && typeof node.opacity === "number" && node.opacity < 1) {
      styles.opacity = Math.round(node.opacity * 100) / 100;
    }
    return styles;
  }
  function extractPerCornerRadius(node) {
    const n = node;
    const cr = n.cornerRadius;
    const tl = typeof n.topLeftRadius === "number" ? n.topLeftRadius : null;
    const tr = typeof n.topRightRadius === "number" ? n.topRightRadius : null;
    const bl = typeof n.bottomLeftRadius === "number" ? n.bottomLeftRadius : null;
    const br = typeof n.bottomRightRadius === "number" ? n.bottomRightRadius : null;
    if (typeof cr === "number" && tl === null) {
      if (cr === 0) return null;
      return { topLeft: cr, topRight: cr, bottomLeft: cr, bottomRight: cr, uniform: cr };
    }
    if (tl !== null || tr !== null || bl !== null || br !== null) {
      return {
        topLeft: tl || 0,
        topRight: tr || 0,
        bottomLeft: bl || 0,
        bottomRight: br || 0,
        uniform: tl === tr && tr === bl && bl === br ? tl || 0 : null
      };
    }
    return null;
  }
  function applyRadius(elem, node) {
    const corners = extractPerCornerRadius(node);
    if (!corners) return;
    if (corners.uniform !== null) {
      elem.borderRadius = toCssValue(corners.uniform);
      return;
    }
    elem.borderTopLeftRadius = toCssValue(corners.topLeft);
    elem.borderTopRightRadius = toCssValue(corners.topRight);
    elem.borderBottomLeftRadius = toCssValue(corners.bottomLeft);
    elem.borderBottomRightRadius = toCssValue(corners.bottomRight);
  }
  function applyStrokes(elem, node) {
    const color = extractStrokeColor(node);
    const widths = extractBorderWidths(node);
    const style = extractBorderStyle(node);
    if (!color) return;
    if (widths.uniform !== null) {
      elem.borderWidth = toCssValue(widths.uniform);
      elem.borderColor = color;
      elem.borderStyle = style;
      return;
    }
    if (widths.top || widths.right || widths.bottom || widths.left) {
      if (widths.top) elem.borderTopWidth = toCssValue(widths.top);
      if (widths.right) elem.borderRightWidth = toCssValue(widths.right);
      if (widths.bottom) elem.borderBottomWidth = toCssValue(widths.bottom);
      if (widths.left) elem.borderLeftWidth = toCssValue(widths.left);
      elem.borderColor = color;
      elem.borderStyle = style;
    }
  }
  function extractObjectPosition(node) {
    if (!node.fills || !Array.isArray(node.fills)) return null;
    const imgFill = node.fills.find((f) => f.type === "IMAGE" && f.visible !== false);
    if (!imgFill) return null;
    const t = imgFill.imageTransform;
    if (!t || !Array.isArray(t) || t.length < 2) return null;
    const tx = t[0] && typeof t[0][2] === "number" ? t[0][2] : 0.5;
    const ty = t[1] && typeof t[1][2] === "number" ? t[1][2] : 0.5;
    if (Math.abs(tx - 0.5) < 0.01 && Math.abs(ty - 0.5) < 0.01) return null;
    const xPct = Math.round(tx * 100);
    const yPct = Math.round(ty * 100);
    return `${xPct}% ${yPct}%`;
  }
  function extractTransform(node) {
    const rt = node.relativeTransform;
    if (!rt || !Array.isArray(rt) || rt.length < 2) return { transform: null };
    const a = rt[0][0], b = rt[0][1], c = rt[1][0], d = rt[1][1];
    const radians = Math.atan2(c, a);
    const degrees = Math.round(radians * 180 / Math.PI);
    const scaleX = Math.sqrt(a * a + c * c);
    const scaleY = Math.sqrt(b * b + d * d);
    const parts = [];
    if (Math.abs(degrees) > 0.5) parts.push(`rotate(${degrees}deg)`);
    if (Math.abs(scaleX - 1) > 0.02) parts.push(`scaleX(${Math.round(scaleX * 100) / 100})`);
    if (Math.abs(scaleY - 1) > 0.02) parts.push(`scaleY(${Math.round(scaleY * 100) / 100})`);
    return { transform: parts.length > 0 ? parts.join(" ") : null };
  }
  function extractFlexChildProps(node) {
    const out = {};
    if (typeof node.layoutGrow === "number") {
      out.flexGrow = node.layoutGrow;
    }
    if (node.layoutAlign) {
      switch (node.layoutAlign) {
        case "STRETCH":
          out.alignSelf = "stretch";
          break;
        case "MIN":
          out.alignSelf = "flex-start";
          break;
        case "CENTER":
          out.alignSelf = "center";
          break;
        case "MAX":
          out.alignSelf = "flex-end";
          break;
        default:
          break;
      }
    }
    return out;
  }
  function extractPerSideMargins(node) {
    const out = {};
    if (!node.absoluteBoundingBox || !node.parent || !("children" in node.parent)) return out;
    const siblings = node.parent.children;
    const idx = siblings.indexOf(node);
    const bb = node.absoluteBoundingBox;
    if (idx >= 0 && idx < siblings.length - 1) {
      const next = siblings[idx + 1];
      if (next.absoluteBoundingBox) {
        const gap = next.absoluteBoundingBox.y - (bb.y + bb.height);
        if (gap > 0) out.marginBottom = toCssValue(Math.round(gap));
      }
    }
    if (idx > 0) {
      const prev = siblings[idx - 1];
      if (prev.absoluteBoundingBox) {
        const gap = bb.y - (prev.absoluteBoundingBox.y + prev.absoluteBoundingBox.height);
        if (gap > 0) out.marginTop = toCssValue(Math.round(gap));
      }
    }
    const parentBB = node.parent.absoluteBoundingBox;
    if (parentBB) {
      const leftGap = bb.x - parentBB.x;
      const rightGap = parentBB.x + parentBB.width - (bb.x + bb.width);
      if (Math.abs(leftGap - rightGap) > 8 && leftGap > 0) {
        out.marginLeft = toCssValue(Math.round(leftGap));
      }
      if (Math.abs(leftGap - rightGap) > 8 && rightGap > 0) {
        out.marginRight = toCssValue(Math.round(rightGap));
      }
    }
    return out;
  }
  function extractLinkUrl(node) {
    const reactions = node.reactions;
    if (!reactions || !Array.isArray(reactions)) return null;
    for (const r of reactions) {
      const actions = r.actions || (r.action ? [r.action] : []);
      for (const a of actions) {
        if (a && a.type === "URL" && a.url) return a.url;
      }
    }
    return null;
  }
  function extractSizingModes(node) {
    const map = (m) => {
      if (m === "HUG") return "hug";
      if (m === "FILL") return "fill";
      if (m === "FIXED") return "fixed";
      return null;
    };
    return {
      widthMode: map(node.layoutSizingHorizontal),
      heightMode: map(node.layoutSizingVertical)
    };
  }
  function extractBoundVariables(node) {
    const bv = node.boundVariables;
    if (!bv || typeof bv !== "object") return null;
    if (!figma.variables || typeof figma.variables.getVariableById !== "function") return null;
    const out = {};
    const resolve = (alias) => {
      var _a, _b;
      if (!alias || !alias.id) return null;
      try {
        const v = figma.variables.getVariableById(alias.id);
        if (!v) return null;
        let colName = "";
        try {
          const col = (_b = (_a = figma.variables).getVariableCollectionById) == null ? void 0 : _b.call(_a, v.variableCollectionId);
          colName = (col == null ? void 0 : col.name) || "";
        } catch (e) {
        }
        return `var(${toCssCustomProperty(v.name, colName)})`;
      } catch (e) {
        return null;
      }
    };
    if (Array.isArray(bv.fills) && bv.fills[0]) {
      const ref = resolve(bv.fills[0]);
      if (ref) out[node.type === "TEXT" ? "color" : "backgroundColor"] = ref;
    }
    if (Array.isArray(bv.strokes) && bv.strokes[0]) {
      const ref = resolve(bv.strokes[0]);
      if (ref) out.borderColor = ref;
    }
    const numericMap = {
      paddingTop: "paddingTop",
      paddingBottom: "paddingBottom",
      paddingLeft: "paddingLeft",
      paddingRight: "paddingRight",
      itemSpacing: "gap",
      cornerRadius: "borderRadius",
      topLeftRadius: "borderTopLeftRadius",
      topRightRadius: "borderTopRightRadius",
      bottomLeftRadius: "borderBottomLeftRadius",
      bottomRightRadius: "borderBottomRightRadius",
      strokeWeight: "borderWidth",
      fontSize: "fontSize",
      lineHeight: "lineHeight",
      letterSpacing: "letterSpacing"
    };
    for (const [figmaKey, cssKey] of Object.entries(numericMap)) {
      if (bv[figmaKey]) {
        const ref = resolve(bv[figmaKey]);
        if (ref) out[cssKey] = ref;
      }
    }
    return Object.keys(out).length > 0 ? out : null;
  }
  function extractComponentInstance(node) {
    var _a;
    if (node.type !== "INSTANCE") return null;
    try {
      const inst = node;
      let name = inst.name;
      try {
        const main = inst.mainComponent;
        if (main) {
          name = ((_a = main.parent) == null ? void 0 : _a.type) === "COMPONENT_SET" ? main.parent.name : main.name;
        }
      } catch (e) {
      }
      const properties = {};
      const props = inst.componentProperties;
      if (props && typeof props === "object") {
        for (const [key, val] of Object.entries(props)) {
          const v = val == null ? void 0 : val.value;
          if (typeof v === "string" || typeof v === "boolean" || typeof v === "number") {
            properties[key] = v;
          }
        }
      }
      return { name, properties };
    } catch (e) {
      return null;
    }
  }
  function extractAltText(node) {
    try {
      if (node.type === "INSTANCE") {
        const main = node.mainComponent;
        if (main && main.description && main.description.trim()) return main.description.trim();
      }
      if (node.type === "COMPONENT") {
        const desc = node.description;
        if (desc && desc.trim()) return desc.trim();
      }
    } catch (e) {
    }
    if (!node.name || isDefaultLayerName(node.name)) return "";
    return node.name.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  function getImageObjectFit(node) {
    if (!node.fills || !Array.isArray(node.fills)) return "cover";
    const imgFill = node.fills.find((f) => f.type === "IMAGE" && f.visible !== false);
    if (!imgFill) return "cover";
    switch (imgFill.scaleMode) {
      case "FIT":
        return "contain";
      case "FILL":
      case "CROP":
      case "TILE":
      default:
        return "cover";
    }
  }
  function applyCommonSignals(elem, node) {
    const cmp = extractComponentInstance(node);
    if (cmp) elem.componentInstance = cmp;
    const size = extractSizingModes(node);
    if (size.widthMode) elem.widthMode = size.widthMode;
    if (size.heightMode) elem.heightMode = size.heightMode;
    const vars = extractBoundVariables(node);
    if (vars) elem.varBindings = vars;
  }
  function extractOpacity(node) {
    if (!("opacity" in node) || typeof node.opacity !== "number") return null;
    if (node.opacity >= 1) return null;
    return Math.round(node.opacity * 100) / 100;
  }
  function hasContainerStyling(node) {
    const n = node;
    if (extractBackgroundColor(n)) return true;
    if (extractGradient(n)) return true;
    if (extractStrokeColor(n)) return true;
    const corners = extractPerCornerRadius(n);
    if (corners) return true;
    const fx = extractEffects(n);
    if (fx.boxShadow || fx.filter || fx.backdropFilter) return true;
    if (extractOpacity(n) !== null) return true;
    return false;
  }
  function extractElements(sectionNode) {
    const elements = {};
    let textIndex = 0;
    let imageIndex = 0;
    function walk(node, depth) {
      var _a, _b;
      if (node.type === "TEXT") {
        const typo = extractTypography(node);
        const fontSize = node.fontSize !== figma.mixed ? node.fontSize : 16;
        let role;
        if (textIndex === 0 && fontSize >= 28) {
          role = "heading";
        } else if (textIndex === 1 && fontSize >= 16) {
          role = "subheading";
        } else if (node.name.toLowerCase().includes("button") || node.name.toLowerCase().includes("cta")) {
          role = "button_text";
        } else if (node.name.toLowerCase().includes("caption") || fontSize <= 14) {
          role = `caption${textIndex > 2 ? "_" + textIndex : ""}`;
        } else {
          role = `text_${textIndex}`;
        }
        const cleanName = node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        if (cleanName && !/^(text|frame|group|rectangle)\d*$/.test(cleanName)) {
          role = cleanName;
        }
        typo.textContent = node.characters || null;
        Object.assign(typo, extractPerSideMargins(node));
        Object.assign(typo, extractFlexChildProps(node));
        const tx = extractTransform(node);
        if (tx.transform) typo.transform = tx.transform;
        const href = extractLinkUrl(node);
        if (href) typo.linkUrl = href;
        if (node.absoluteBoundingBox && ((_a = node.parent) == null ? void 0 : _a.type) === "FRAME") {
          const parentWidth = (_b = node.parent.absoluteBoundingBox) == null ? void 0 : _b.width;
          if (parentWidth && node.absoluteBoundingBox.width < parentWidth * 0.9) {
            typo.maxWidth = toCssValue(Math.round(node.absoluteBoundingBox.width));
          }
        }
        applyCommonSignals(typo, node);
        const textOpacity = extractOpacity(node);
        if (textOpacity !== null) typo.opacity = textOpacity;
        elements[role] = typo;
        textIndex++;
      }
      if (hasImageFill(node) && node.absoluteBoundingBox) {
        const bounds = node.absoluteBoundingBox;
        const nameHintsBg = node.name.toLowerCase().includes("background") || node.name.toLowerCase().includes("bg");
        const sectionBounds = sectionNode.absoluteBoundingBox;
        const spansSection = sectionBounds && bounds.width >= sectionBounds.width * 0.9 && bounds.height >= sectionBounds.height * 0.9;
        const isBackgroundImage = nameHintsBg || spansSection;
        const role = isBackgroundImage ? "background_image" : `image${imageIndex > 0 ? "_" + imageIndex : ""}`;
        const cleanName = node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        const finalRole = cleanName && !/^(image|rectangle|frame)\d*$/.test(cleanName) ? cleanName : role;
        const parentFrame = node.parent;
        const parentClips = parentFrame && "clipsContent" in parentFrame && parentFrame.clipsContent === true;
        const isMasked = "isMask" in node && node.isMask === true || parentClips;
        let clipBorderRadius = "cornerRadius" in node && typeof node.cornerRadius === "number" ? toCssValue(node.cornerRadius) : null;
        if (!clipBorderRadius && parentFrame && "cornerRadius" in parentFrame && typeof parentFrame.cornerRadius === "number") {
          const parentCorner = parentFrame.cornerRadius;
          if (parentCorner > 0) {
            const parentBounds = parentFrame.absoluteBoundingBox;
            if (parentBounds && Math.abs(parentBounds.width - parentBounds.height) < 5 && parentCorner >= parentBounds.width / 2 - 2) {
              clipBorderRadius = "50%";
            } else {
              clipBorderRadius = toCssValue(parentCorner);
            }
          }
        }
        const imgEffects = extractEffects(node);
        const imgObjectPosition = extractObjectPosition(node);
        const imgCorners = extractPerCornerRadius(node);
        const imgElem = {
          width: isBackgroundImage ? "100%" : toCssValue(Math.round(bounds.width)),
          height: isBackgroundImage ? "100%" : "auto",
          aspectRatio: isBackgroundImage ? null : computeAspectRatio(bounds.width, bounds.height),
          objectFit: getImageObjectFit(node),
          objectPosition: imgObjectPosition,
          overflow: parentClips || clipBorderRadius ? "hidden" : null,
          hasMask: isMasked || null,
          boxShadow: imgEffects.boxShadow,
          filter: imgEffects.filter,
          // Mark background images with position data so agents know to use CSS background-image
          position: isBackgroundImage ? "absolute" : null,
          top: isBackgroundImage ? "0px" : null,
          left: isBackgroundImage ? "0px" : null,
          zIndex: isBackgroundImage ? 0 : null
        };
        const imgAlt = extractAltText(node);
        if (imgAlt) imgElem.alt = imgAlt;
        applyCommonSignals(imgElem, node);
        if (imgCorners) {
          if (imgCorners.uniform !== null) {
            imgElem.borderRadius = toCssValue(imgCorners.uniform);
          } else {
            imgElem.borderTopLeftRadius = toCssValue(imgCorners.topLeft);
            imgElem.borderTopRightRadius = toCssValue(imgCorners.topRight);
            imgElem.borderBottomLeftRadius = toCssValue(imgCorners.bottomLeft);
            imgElem.borderBottomRightRadius = toCssValue(imgCorners.bottomRight);
          }
        } else if (clipBorderRadius) {
          imgElem.borderRadius = clipBorderRadius;
        }
        Object.assign(imgElem, extractFlexChildProps(node));
        const imgOpacity = extractOpacity(node);
        if (imgOpacity !== null) imgElem.opacity = imgOpacity;
        elements[finalRole] = imgElem;
        imageIndex++;
      }
      if ((node.type === "FRAME" || node.type === "INSTANCE" || node.type === "COMPONENT") && node.name.toLowerCase().includes("button") || node.name.toLowerCase().includes("btn") || node.name.toLowerCase().includes("cta")) {
        const frame = node;
        const bg = extractBackgroundColor(frame);
        const bounds = frame.absoluteBoundingBox;
        if (bg && bounds) {
          const buttonStyles = {
            backgroundColor: bg
          };
          if (frame.layoutMode && frame.layoutMode !== "NONE") {
            buttonStyles.paddingTop = toCssValue(frame.paddingTop);
            buttonStyles.paddingBottom = toCssValue(frame.paddingBottom);
            buttonStyles.paddingLeft = toCssValue(frame.paddingLeft);
            buttonStyles.paddingRight = toCssValue(frame.paddingRight);
          }
          applyRadius(buttonStyles, frame);
          applyStrokes(buttonStyles, frame);
          const btnEffects = extractEffects(frame);
          if (btnEffects.boxShadow) buttonStyles.boxShadow = btnEffects.boxShadow;
          if (btnEffects.filter) buttonStyles.filter = btnEffects.filter;
          const tx = extractTransform(frame);
          if (tx.transform) buttonStyles.transform = tx.transform;
          const href = extractLinkUrl(frame);
          if (href) buttonStyles.linkUrl = href;
          const textChild = findFirstTextNode(frame);
          if (textChild) {
            const typo = extractTypography(textChild);
            Object.assign(buttonStyles, typo);
            buttonStyles.textContent = textChild.characters || null;
          }
          Object.assign(buttonStyles, extractFlexChildProps(frame));
          applyCommonSignals(buttonStyles, frame);
          const btnOpacity = extractOpacity(frame);
          if (btnOpacity !== null) buttonStyles.opacity = btnOpacity;
          const cleanName = node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
          elements[cleanName || "button"] = buttonStyles;
        }
        return;
      }
      if ((node.type === "FRAME" || node.type === "INSTANCE" || node.type === "COMPONENT") && /\b(input|field|textbox|textarea|select|textfield)\b/i.test(node.name)) {
        const frame = node;
        const inputStyles = {
          backgroundColor: extractBackgroundColor(frame)
        };
        if (frame.layoutMode && frame.layoutMode !== "NONE") {
          inputStyles.paddingTop = toCssValue(frame.paddingTop);
          inputStyles.paddingBottom = toCssValue(frame.paddingBottom);
          inputStyles.paddingLeft = toCssValue(frame.paddingLeft);
          inputStyles.paddingRight = toCssValue(frame.paddingRight);
        }
        applyRadius(inputStyles, frame);
        applyStrokes(inputStyles, frame);
        const placeholderText = findFirstTextNode(frame);
        if (placeholderText) {
          inputStyles.placeholder = placeholderText.characters || null;
          const placeholderTypo = extractTypography(placeholderText);
          inputStyles.placeholderStyles = {
            color: placeholderTypo.color || null,
            fontSize: placeholderTypo.fontSize || null
          };
        }
        applyCommonSignals(inputStyles, frame);
        const inputOpacity = extractOpacity(frame);
        if (inputOpacity !== null) inputStyles.opacity = inputOpacity;
        const inputName = node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "input";
        elements[inputName] = inputStyles;
        return;
      }
      if (depth > 0 && (node.type === "FRAME" || node.type === "INSTANCE" || node.type === "COMPONENT" || node.type === "GROUP") && !hasImageFill(node) && hasContainerStyling(node)) {
        const frame = node;
        const containerStyles = {};
        const bg = extractBackgroundColor(frame);
        if (bg) containerStyles.backgroundColor = bg;
        const gradient = extractGradient(frame);
        if (gradient) containerStyles.backgroundGradient = gradient;
        if (frame.layoutMode && frame.layoutMode !== "NONE") {
          containerStyles.paddingTop = toCssValue(frame.paddingTop);
          containerStyles.paddingBottom = toCssValue(frame.paddingBottom);
          containerStyles.paddingLeft = toCssValue(frame.paddingLeft);
          containerStyles.paddingRight = toCssValue(frame.paddingRight);
          if (typeof frame.itemSpacing === "number" && frame.itemSpacing > 0) {
            containerStyles.gap = toCssValue(frame.itemSpacing);
          }
        }
        applyRadius(containerStyles, frame);
        applyStrokes(containerStyles, frame);
        const fx = extractEffects(frame);
        if (fx.boxShadow) containerStyles.boxShadow = fx.boxShadow;
        if (fx.filter) containerStyles.filter = fx.filter;
        if (fx.backdropFilter) containerStyles.backdropFilter = fx.backdropFilter;
        const tx = extractTransform(frame);
        if (tx.transform) containerStyles.transform = tx.transform;
        const containerOpacity = extractOpacity(frame);
        if (containerOpacity !== null) containerStyles.opacity = containerOpacity;
        Object.assign(containerStyles, extractFlexChildProps(frame));
        applyCommonSignals(containerStyles, frame);
        const cleanName = node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        const role = cleanName && !/^(frame|group|rectangle|ellipse)\d*$/.test(cleanName) ? cleanName : `container_${Object.keys(elements).filter((k) => k.startsWith("container_")).length + 1}`;
        if (!elements[role]) {
          elements[role] = containerStyles;
        }
      }
      if ("children" in node && depth < 6) {
        for (const child of node.children) {
          if (child.visible !== false) {
            walk(child, depth + 1);
          }
        }
      }
    }
    walk(sectionNode, 0);
    return elements;
  }
  function findFirstTextNode(node) {
    if (node.type === "TEXT") return node;
    if ("children" in node) {
      for (const child of node.children) {
        const found = findFirstTextNode(child);
        if (found) return found;
      }
    }
    return null;
  }
  function extractLayers(sectionNode, elements) {
    const layers = [];
    const sectionBounds = sectionNode.absoluteBoundingBox;
    if (!sectionBounds) return layers;
    let layerIndex = 0;
    function walk(node, depth) {
      if (!node.absoluteBoundingBox || depth > 6) return;
      const bounds = node.absoluteBoundingBox;
      const relBounds = {
        x: Math.round(bounds.x - sectionBounds.x),
        y: Math.round(bounds.y - sectionBounds.y),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height)
      };
      let role = null;
      let name = "";
      if (node.type === "TEXT") {
        role = "text";
        const cleanName = node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        name = cleanName && !/^text\d*$/.test(cleanName) ? cleanName : `text_${layerIndex}`;
      } else if (hasImageFill(node)) {
        const nameHintsBg = node.name.toLowerCase().includes("background") || node.name.toLowerCase().includes("bg");
        const spansSection = bounds.width >= sectionBounds.width * 0.9 && bounds.height >= sectionBounds.height * 0.9;
        role = nameHintsBg || spansSection ? "background_image" : "image";
        const cleanName = node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        name = cleanName && !/^(image|rectangle|frame)\d*$/.test(cleanName) ? cleanName : role === "background_image" ? "background_image" : `image_${layerIndex}`;
      } else if ((node.name.toLowerCase().includes("button") || node.name.toLowerCase().includes("btn") || node.name.toLowerCase().includes("cta")) && (node.type === "FRAME" || node.type === "INSTANCE" || node.type === "COMPONENT")) {
        role = "button";
        name = node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "button";
      }
      if (role) {
        layers.push({
          name,
          role,
          type: node.type,
          bounds: relBounds,
          zIndex: layerIndex,
          overlaps: []
          // filled in detectComposition
        });
        layerIndex++;
      }
      if (role !== "button" && "children" in node && depth < 6) {
        for (const child of node.children) {
          if (child.visible !== false) {
            walk(child, depth + 1);
          }
        }
      }
    }
    if ("children" in sectionNode) {
      for (const child of sectionNode.children) {
        if (child.visible !== false) {
          walk(child, 0);
        }
      }
    }
    return layers;
  }
  function detectComposition(layers) {
    const composition = {
      hasTextOverImage: false,
      hasBackgroundImage: false,
      overlayElements: [],
      stackingOrder: layers.map((l) => l.name)
    };
    const bgImageLayers = layers.filter((l) => l.role === "background_image");
    const imageLayers = layers.filter((l) => l.role === "image" || l.role === "background_image");
    const textLayers = layers.filter((l) => l.role === "text");
    const buttonLayers = layers.filter((l) => l.role === "button");
    if (bgImageLayers.length > 0) {
      composition.hasBackgroundImage = true;
    }
    for (const textLayer of [...textLayers, ...buttonLayers]) {
      for (const imgLayer of imageLayers) {
        const tb = textLayer.bounds;
        const ib = imgLayer.bounds;
        const overlapsHorizontally = tb.x < ib.x + ib.width && tb.x + tb.width > ib.x;
        const overlapsVertically = tb.y < ib.y + ib.height && tb.y + tb.height > ib.y;
        if (overlapsHorizontally && overlapsVertically) {
          textLayer.overlaps.push(imgLayer.name);
          imgLayer.overlaps.push(textLayer.name);
          if (!composition.hasTextOverImage) {
            composition.hasTextOverImage = true;
          }
          if (textLayer.zIndex > imgLayer.zIndex) {
            if (!composition.overlayElements.includes(textLayer.name)) {
              composition.overlayElements.push(textLayer.name);
            }
          }
        }
      }
    }
    if (composition.hasBackgroundImage) {
      for (const layer of layers) {
        if (layer.role !== "background_image" && !composition.overlayElements.includes(layer.name)) {
          composition.overlayElements.push(layer.name);
        }
      }
    }
    return composition;
  }
  function detectFormSection(sectionNode) {
    const formKeywords = ["form", "input", "field", "contact", "subscribe", "newsletter", "signup", "sign-up", "enquiry", "inquiry"];
    const inputKeywords = ["input", "field", "text-field", "textfield", "text_field", "email", "phone", "name", "message", "textarea"];
    const submitKeywords = ["submit", "send", "button", "cta", "btn"];
    const sectionName = sectionNode.name.toLowerCase();
    const nameHintsForm = formKeywords.some((kw) => sectionName.includes(kw));
    let inputCount = 0;
    let hasSubmitButton = false;
    const fields = [];
    const textNodes = [];
    const inputNodes = [];
    function walk(node) {
      const name = node.name.toLowerCase();
      if ((node.type === "FRAME" || node.type === "INSTANCE" || node.type === "COMPONENT" || node.type === "RECTANGLE") && node.absoluteBoundingBox) {
        const b = node.absoluteBoundingBox;
        const isInputShape = b.height >= 30 && b.height <= 70 && b.width > b.height * 2;
        const hasInputName = inputKeywords.some((kw) => name.includes(kw));
        if (isInputShape && (hasInputName || nameHintsForm)) {
          inputCount++;
          inputNodes.push({ name: node.name, y: b.y, height: b.height });
          let fieldType = "text";
          if (name.includes("email")) fieldType = "email";
          else if (name.includes("phone") || name.includes("tel")) fieldType = "phone";
          else if (name.includes("textarea") || name.includes("message") || b.height > 80) fieldType = "textarea";
          else if (name.includes("select") || name.includes("dropdown")) fieldType = "select";
          else if (name.includes("checkbox") || name.includes("check")) fieldType = "checkbox";
          else if (name.includes("radio")) fieldType = "radio";
          fields.push({
            label: node.name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            type: fieldType,
            required: name.includes("required") || name.includes("*")
          });
        }
        if (submitKeywords.some((kw) => name.includes(kw)) && b.height >= 30 && b.height <= 70) {
          hasSubmitButton = true;
          if (!fields.find((f) => f.type === "submit")) {
            fields.push({ label: "Submit", type: "submit", required: false });
          }
        }
      }
      if (node.type === "TEXT" && node.absoluteBoundingBox) {
        textNodes.push({
          name: node.name,
          text: node.characters || "",
          y: node.absoluteBoundingBox.y
        });
      }
      if ("children" in node) {
        for (const child of node.children) {
          if (child.visible !== false) walk(child);
        }
      }
    }
    walk(sectionNode);
    for (const field of fields) {
      const fieldInput = inputNodes.find((inp) => inp.name.toLowerCase().includes(field.label.toLowerCase().replace(/ /g, "_")));
      if (fieldInput) {
        const labelAbove = textNodes.find((t) => t.y < fieldInput.y && fieldInput.y - t.y < 40);
        if (labelAbove) {
          field.label = labelAbove.text.replace("*", "").trim();
          if (labelAbove.text.includes("*")) field.required = true;
        }
      }
    }
    const isForm = inputCount >= 2 && hasSubmitButton || nameHintsForm && inputCount >= 1;
    return { isForm, fields: isForm ? fields : [] };
  }
  function extractTextContentInOrder(sectionNode) {
    const sectionBounds = sectionNode.absoluteBoundingBox;
    if (!sectionBounds) return [];
    const collected = [];
    function walk(node, depth) {
      if (node.visible === false) return;
      if (depth > 8) return;
      if (node.type === "TEXT") {
        const t = node;
        const chars = t.characters || "";
        if (!chars.trim()) return;
        const bb = t.absoluteBoundingBox;
        if (!bb) return;
        const fs = t.fontSize !== figma.mixed ? t.fontSize : 16;
        collected.push({
          node: t,
          relY: bb.y - sectionBounds.y,
          relX: bb.x - sectionBounds.x,
          fontSize: fs
        });
        return;
      }
      if ("children" in node) {
        for (const child of node.children) {
          walk(child, depth + 1);
        }
      }
    }
    if ("children" in sectionNode) {
      for (const child of sectionNode.children) {
        walk(child, 0);
      }
    }
    collected.sort((a, b) => {
      if (Math.abs(a.relY - b.relY) < 12) return a.relX - b.relX;
      return a.relY - b.relY;
    });
    let headingAssigned = false;
    let subheadingAssigned = false;
    return collected.map((item, idx) => {
      const text = item.node.characters || "";
      const cleanName = item.node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      const nameHint = cleanName || "";
      let role;
      if (nameHint.includes("button") || nameHint.includes("cta") || nameHint.includes("btn")) {
        role = "button_text";
      } else if (!headingAssigned && item.fontSize >= 28) {
        role = "heading";
        headingAssigned = true;
      } else if (!subheadingAssigned && item.fontSize >= 18 && item.fontSize < 28) {
        role = "subheading";
        subheadingAssigned = true;
      } else if (item.fontSize <= 13 || (nameHint.includes("caption") || nameHint.includes("eyebrow") || nameHint.includes("tag"))) {
        role = "caption";
      } else if (text.length < 30 && item.fontSize <= 16) {
        role = "label";
      } else {
        role = `body_${idx}`;
      }
      const bb = item.node.absoluteBoundingBox;
      return {
        index: idx,
        text,
        role,
        layerName: item.node.name,
        fontSize: Math.round(item.fontSize),
        bounds: {
          x: Math.round(item.relX),
          y: Math.round(item.relY),
          width: Math.round(bb.width),
          height: Math.round(bb.height)
        }
      };
    });
  }
  function parseSections(pageFrame, globalNames) {
    const sectionNodes = identifySections(pageFrame);
    const specs = {};
    let prevBottom = 0;
    for (let i = 0; i < sectionNodes.length; i++) {
      const node = sectionNodes[i];
      const bounds = node.absoluteBoundingBox;
      if (!bounds) continue;
      const layoutName = toLayoutName(node.name);
      const isFrame = node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE";
      const frame = isFrame ? node : null;
      const hasAutoLayout = (frame == null ? void 0 : frame.layoutMode) && frame.layoutMode !== "NONE";
      let spacingSource;
      let sectionStyles;
      let itemSpacing;
      if (hasAutoLayout && frame) {
        const spacing = extractAutoLayoutSpacing(frame);
        spacingSource = spacing.spacingSource;
        sectionStyles = spacing.sectionStyles;
        itemSpacing = spacing.itemSpacing;
      } else if (frame) {
        const spacing = extractAbsoluteSpacing(frame);
        spacingSource = spacing.spacingSource;
        sectionStyles = spacing.sectionStyles;
        itemSpacing = spacing.itemSpacing;
      } else {
        spacingSource = "absolute-coordinates";
        sectionStyles = {};
        itemSpacing = null;
      }
      const baseStyles = extractSectionStyles(node);
      const mergedStyles = __spreadValues(__spreadValues({}, baseStyles), sectionStyles);
      const elements = extractElements(node);
      const grid = frame ? detectGrid(frame) : {
        layoutMode: "absolute",
        columns: 1,
        gap: itemSpacing,
        rowGap: null,
        columnGap: null,
        itemMinWidth: null
      };
      if (!grid.gap && itemSpacing) {
        grid.gap = itemSpacing;
      }
      let overlap = null;
      if (i > 0) {
        const overlapPx = prevBottom - bounds.y;
        if (overlapPx > 0) {
          overlap = {
            withSection: sectionNodes[i - 1].name,
            pixels: Math.round(overlapPx),
            cssMarginTop: `-${Math.round(overlapPx)}px`,
            requiresZIndex: true
          };
        }
      }
      const interactions = extractInteractions(node);
      const layers = extractLayers(node, elements);
      const composition = detectComposition(layers);
      if (composition.hasTextOverImage || composition.hasBackgroundImage) {
        mergedStyles.overflow = mergedStyles.overflow || "hidden";
        for (const [elemName, elemStyles] of Object.entries(elements)) {
          if (composition.overlayElements.includes(elemName) || composition.hasBackgroundImage) {
            const layer = layers.find((l) => l.name === elemName);
            if (layer && layer.role !== "background_image") {
              elemStyles.position = "relative";
              elemStyles.zIndex = layer.zIndex;
            }
          }
        }
      }
      const formResult = detectFormSection(node);
      const textContentInOrder = extractTextContentInOrder(node);
      let componentPatterns;
      try {
        const p = detectComponentPatterns(node);
        if (p.length > 0) componentPatterns = p;
      } catch (e) {
        console.warn("detectComponentPatterns failed for section", node.name, e);
      }
      let repeaters;
      try {
        const r = detectRepeaters(node);
        if (Object.keys(r).length > 0) repeaters = r;
      } catch (e) {
        console.warn("detectRepeaters failed for section", node.name, e);
      }
      const normalized = normalizeSectionName(node.name);
      const isGlobal = globalNames ? globalNames.has(normalized) : false;
      const globalRole = isGlobal ? classifyGlobalRole(i, sectionNodes.length, Math.round(bounds.height)) : null;
      let navigation;
      try {
        const name = (node.name || "").toLowerCase();
        if (isGlobal || /\b(header|footer|nav|navbar|navigation)\b/.test(name)) {
          const nav = detectNavigation(node);
          if (nav) navigation = nav;
        }
      } catch (e) {
        console.warn("detectNavigation failed for section", node.name, e);
      }
      let sectionType = null;
      try {
        sectionType = inferSectionType({
          sectionIndex: i,
          totalSections: sectionNodes.length,
          isFormSection: formResult.isForm,
          patterns: componentPatterns || [],
          repeaters: repeaters || {},
          elements,
          textContentInOrder,
          layerName: node.name || "",
          sectionHeight: Math.round(bounds.height),
          isGlobal,
          globalRole
        });
      } catch (e) {
        console.warn("inferSectionType failed for section", node.name, e);
      }
      specs[layoutName] = {
        spacingSource,
        figmaNodeId: node.id,
        screenshotFile: `screenshots/${screenshotFilename(node.name)}`,
        section: mergedStyles,
        elements,
        grid,
        interactions: interactions.length > 0 ? interactions : void 0,
        overlap,
        layers: layers.length > 0 ? layers : void 0,
        composition: composition.hasTextOverImage || composition.hasBackgroundImage ? composition : void 0,
        isFormSection: formResult.isForm || void 0,
        formFields: formResult.fields.length > 0 ? formResult.fields : void 0,
        textContentInOrder: textContentInOrder.length > 0 ? textContentInOrder : void 0,
        componentPatterns,
        isGlobal: isGlobal || void 0,
        globalRole: isGlobal ? globalRole : void 0,
        sectionType: sectionType == null ? void 0 : sectionType.type,
        sectionTypeConfidence: sectionType == null ? void 0 : sectionType.confidence,
        repeaters,
        navigation
      };
      prevBottom = bounds.y + bounds.height;
    }
    return specs;
  }
  var init_section_parser = __esm({
    "src/sandbox/section-parser.ts"() {
      "use strict";
      init_utils();
      init_color();
      init_typography();
      init_spacing();
      init_grid();
      init_interactions();
      init_effects();
      init_variables();
      init_patterns();
    }
  });

  // src/sandbox/image-exporter.ts
  function identifySectionNodes(pageFrame) {
    let candidates = pageFrame.children.filter(
      (c) => c.visible !== false && (c.type === "FRAME" || c.type === "COMPONENT" || c.type === "INSTANCE" || c.type === "GROUP") && c.absoluteBoundingBox && c.absoluteBoundingBox.height > 50
    );
    if (candidates.length === 1 && "children" in candidates[0]) {
      const wrapper = candidates[0];
      const innerCandidates = wrapper.children.filter(
        (c) => c.visible !== false && (c.type === "FRAME" || c.type === "COMPONENT" || c.type === "INSTANCE" || c.type === "GROUP") && c.absoluteBoundingBox && c.absoluteBoundingBox.height > 50
      );
      if (innerCandidates.length > 1) {
        candidates = innerCandidates;
      }
    }
    return [...candidates].sort((a, b) => a.absoluteBoundingBox.y - b.absoluteBoundingBox.y);
  }
  function buildExportTasks(pageFrame, pageSlug) {
    var _a, _b;
    const tasks = [];
    const pagePath = `pages/${pageSlug}`;
    tasks.push({
      nodeId: pageFrame.id,
      nodeName: pageFrame.name,
      type: "full-page",
      filename: "_full-page.png",
      pagePath,
      format: "PNG",
      scale: 1
    });
    const sections = identifySectionNodes(pageFrame);
    for (let i = 0; i < sections.length; i++) {
      tasks.push({
        nodeId: sections[i].id,
        nodeName: sections[i].name,
        type: "screenshot",
        filename: screenshotFilename(sections[i].name),
        pagePath,
        format: "PNG",
        scale: 1
      });
    }
    const iconNodes = findIconNodes(pageFrame);
    const seenIconIds = /* @__PURE__ */ new Set();
    for (const iconNode of iconNodes) {
      if (seenIconIds.has(iconNode.id)) continue;
      seenIconIds.add(iconNode.id);
      tasks.push({
        nodeId: iconNode.id,
        nodeName: iconNode.name,
        type: "asset",
        filename: `${slugify(iconNode.name)}.svg`,
        pagePath,
        format: "SVG",
        scale: 1,
        preferSvg: true
      });
    }
    const imageNodes = findImageNodes(pageFrame);
    const seenHashes = /* @__PURE__ */ new Set();
    for (const imgNode of imageNodes) {
      if (seenIconIds.has(imgNode.id)) continue;
      const hashKey = `${imgNode.name}_${(_a = imgNode.absoluteBoundingBox) == null ? void 0 : _a.width}_${(_b = imgNode.absoluteBoundingBox) == null ? void 0 : _b.height}`;
      if (seenHashes.has(hashKey)) continue;
      seenHashes.add(hashKey);
      const filename = `${slugify(imgNode.name)}.png`;
      tasks.push({
        nodeId: imgNode.id,
        nodeName: imgNode.name,
        type: "asset",
        filename,
        pagePath,
        format: "PNG",
        scale: 1
      });
    }
    return tasks;
  }
  function findIconNodes(root) {
    const icons = [];
    function isVectorOnly(n) {
      if (n.type === "TEXT") return false;
      if (hasImageFill(n)) return false;
      if ("children" in n) {
        for (const child of n.children) {
          if (child.visible === false) continue;
          if (!isVectorOnly(child)) return false;
        }
      }
      return true;
    }
    function walk(node) {
      if (node.visible === false) return;
      const bb = node.absoluteBoundingBox;
      const smallish = bb && bb.width <= 64 && bb.height <= 64;
      if (node.type === "VECTOR") {
        icons.push(node);
        return;
      }
      const nameHintsIcon = /\bicon\b/i.test(node.name);
      if ((node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "GROUP") && (smallish || nameHintsIcon) && isVectorOnly(node) && "children" in node && node.children.length > 0) {
        icons.push(node);
        return;
      }
      if ("children" in node) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(root);
    return icons;
  }
  function findImageNodes(root) {
    const nodes = [];
    function walk(node) {
      if (hasImageFill(node)) {
        nodes.push(node);
      }
      if ("children" in node) {
        for (const child of node.children) {
          if (child.visible !== false) {
            walk(child);
          }
        }
      }
    }
    walk(root);
    return nodes;
  }
  function exportNode(nodeId, format, scale, taskType) {
    return __async(this, null, function* () {
      const node = figma.getNodeById(nodeId);
      if (!node || !("exportAsync" in node)) {
        throw new Error(`Node ${nodeId} not found or not exportable`);
      }
      if (format === "SVG") {
        return yield node.exportAsync({ format: "SVG" });
      }
      if (taskType === "asset" && format === "PNG") {
        const raw = yield tryExtractRawImageBytes(node);
        if (raw) return raw;
      }
      const exportScale = taskType === "full-page" ? 2 : scale;
      return yield node.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: exportScale }
      });
    });
  }
  function tryExtractRawImageBytes(node) {
    return __async(this, null, function* () {
      const fills = node.fills;
      if (!fills || !Array.isArray(fills)) return null;
      const imageFill = fills.find(
        (f) => f.type === "IMAGE" && f.visible !== false && f.imageHash
      );
      if (!imageFill || !imageFill.imageHash) return null;
      try {
        const image = figma.getImageByHash(imageFill.imageHash);
        if (!image) return null;
        return yield image.getBytesAsync();
      } catch (err) {
        console.warn(`Failed to extract raw image bytes from ${node.name}:`, err);
        return null;
      }
    });
  }
  function executeBatchExport(tasks, onProgress, onData, shouldCancel) {
    return __async(this, null, function* () {
      const total = tasks.length;
      for (let i = 0; i < total; i += BATCH_SIZE) {
        if (shouldCancel()) return;
        const batch = tasks.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map((task) => __async(this, null, function* () {
          try {
            const data = yield exportNode(task.nodeId, task.format, task.scale, task.type);
            onData(task, data);
          } catch (err) {
            console.error(`Failed to export ${task.filename}:`, err);
          }
        }));
        yield Promise.all(batchPromises);
        const done = Math.min(i + BATCH_SIZE, total);
        onProgress(done, total, `Exporting (${done}/${total})...`);
      }
    });
  }
  function buildImageMap(tasks, sections) {
    const images = {};
    const bySectionMap = {};
    const assetTasks = tasks.filter((t) => t.type === "asset");
    for (const task of assetTasks) {
      images[task.filename] = {
        file: task.filename,
        ext: task.format.toLowerCase(),
        nodeNames: [task.nodeName],
        readableName: task.filename,
        dimensions: null,
        usedInSections: []
      };
    }
    for (const section of sections) {
      let walk2 = function(node) {
        if (hasImageFill(node)) {
          const filename = `${slugify(node.name)}.png`;
          sectionImages.push(filename);
          if (images[filename]) {
            images[filename].usedInSections.push(section.name);
          }
        }
        if ("children" in node) {
          for (const child of node.children) {
            walk2(child);
          }
        }
      };
      var walk = walk2;
      const sectionImages = [];
      for (const child of section.children) {
        walk2(child);
      }
      bySectionMap[section.name] = sectionImages;
    }
    return { images, by_section: bySectionMap };
  }
  var BATCH_SIZE;
  var init_image_exporter = __esm({
    "src/sandbox/image-exporter.ts"() {
      "use strict";
      init_utils();
      init_color();
      BATCH_SIZE = 10;
    }
  });

  // src/sandbox/extractor.ts
  function runExtraction(frameIds, responsivePairs, sendMessage, shouldCancel) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d;
      const allDesignTokenColors = {};
      const allDesignTokenFonts = {};
      const allSpacingValues = /* @__PURE__ */ new Set();
      const manifestPages = [];
      let totalSections = 0;
      let totalImages = 0;
      const globalNames = computeGlobalSectionNames(responsivePairs);
      for (const pair of responsivePairs) {
        if (shouldCancel()) return;
        const desktopNode = figma.getNodeById(pair.desktop.frameId);
        if (!desktopNode || desktopNode.type !== "FRAME") continue;
        const desktopFrame = desktopNode;
        sendMessage({
          type: "EXPORT_PROGRESS",
          current: 0,
          total: 100,
          label: `Extracting "${pair.pageName}"...`
        });
        const sections = parseSections(desktopFrame, globalNames);
        const sectionCount = Object.keys(sections).length;
        totalSections += sectionCount;
        if (pair.mobile) {
          const mobileNode = figma.getNodeById(pair.mobile.frameId);
          if (mobileNode && mobileNode.type === "FRAME") {
            const mobileFrame = mobileNode;
            const mobileSections = parseSections(mobileFrame, globalNames);
            mergeResponsiveData(sections, mobileSections, pair.mobile.width);
          }
        }
        const sectionSpecs = {
          figma_canvas_width: Math.round(desktopFrame.width),
          figma_canvas_height: Math.round(desktopFrame.height),
          mobile_canvas_width: (_a = pair.mobile) == null ? void 0 : _a.width,
          page_slug: pair.pageSlug,
          extracted_at: (/* @__PURE__ */ new Date()).toISOString(),
          extraction_method: "plugin",
          sections
        };
        const colors = collectColors(desktopFrame);
        const fonts = collectFonts(desktopFrame);
        const spacing = collectSpacing(desktopFrame);
        const pageTokens = {
          colors,
          fonts: Object.fromEntries(
            Object.entries(fonts).map(([family, data]) => [family, {
              styles: [...data.styles],
              sizes: [...data.sizes].sort((a, b) => a - b),
              count: data.count
            }])
          ),
          spacing,
          sections: buildTokenSections(desktopFrame, pair.pageSlug)
        };
        for (const [hex, count] of Object.entries(colors)) {
          if (count >= 2) {
            const varName = `--clr-${hex.slice(1).toLowerCase()}`;
            allDesignTokenColors[varName] = hex;
          }
        }
        for (const [family, data] of Object.entries(fonts)) {
          allDesignTokenFonts[family] = {
            styles: [...data.styles],
            sizes: [...data.sizes].sort((a, b) => a - b),
            count: data.count
          };
        }
        for (const s of spacing) {
          allSpacingValues.add(s.value);
        }
        const specMd = generateSpecMd(pair.pageName, pair.pageSlug, sectionSpecs, pageTokens);
        sendMessage({
          type: "PAGE_DATA",
          pageSlug: pair.pageSlug,
          sectionSpecs,
          specMd,
          tokens: pageTokens
        });
        const exportTasks = buildExportTasks(desktopFrame, pair.pageSlug);
        const assetCount = exportTasks.filter((t) => t.type === "asset").length;
        totalImages += assetCount;
        yield executeBatchExport(
          exportTasks,
          (current, total, label) => {
            sendMessage({ type: "EXPORT_PROGRESS", current, total, label });
          },
          (task, data) => {
            if (task.type === "screenshot" || task.type === "full-page") {
              sendMessage({
                type: "SCREENSHOT_DATA",
                path: `${task.pagePath}/screenshots`,
                filename: task.filename,
                data
              });
            } else {
              sendMessage({
                type: "IMAGE_DATA",
                path: `${task.pagePath}/images`,
                filename: task.filename,
                data
              });
            }
          },
          shouldCancel
        );
        const sectionChildren = desktopFrame.children.filter((c) => c.visible !== false).map((c) => ({ name: c.name, children: "children" in c ? [...c.children] : [] }));
        const imageMap = buildImageMap(exportTasks, sectionChildren);
        sendMessage({
          type: "IMAGE_MAP_DATA",
          path: `pages/${pair.pageSlug}/images`,
          imageMap
        });
        const hasFullPage = exportTasks.some((t) => t.type === "full-page");
        manifestPages.push({
          slug: pair.pageSlug,
          frameName: pair.desktop.frameName,
          frameId: pair.desktop.frameId,
          canvasWidth: Math.round(desktopFrame.width),
          canvasHeight: Math.round(desktopFrame.height),
          sectionCount,
          imageCount: assetCount,
          hasResponsive: pair.mobile !== null,
          mobileFrameId: (_c = (_b = pair.mobile) == null ? void 0 : _b.frameId) != null ? _c : null,
          interactionCount: Object.values(sections).reduce((sum, s) => {
            var _a2, _b2;
            return sum + ((_b2 = (_a2 = s.interactions) == null ? void 0 : _a2.length) != null ? _b2 : 0);
          }, 0),
          hasFullPageScreenshot: hasFullPage,
          fullPageScreenshotFile: hasFullPage ? "_full-page.png" : null
        });
      }
      const manifest = {
        exportVersion: "1.0",
        exportDate: (/* @__PURE__ */ new Date()).toISOString(),
        figmaFileName: figma.root.name,
        figmaFileKey: (_d = figma.fileKey) != null ? _d : "",
        pluginVersion: "1.0.0",
        pages: manifestPages,
        totalSections,
        totalImages,
        designTokensSummary: {
          colorCount: Object.keys(allDesignTokenColors).length,
          fontCount: Object.keys(allDesignTokenFonts).length,
          spacingValues: allSpacingValues.size
        }
      };
      const variables = extractVariables();
      const designTokens = {
        colors: allDesignTokenColors,
        fonts: allDesignTokenFonts,
        spacing: [...allSpacingValues].sort((a, b) => a - b),
        variables: variables.present ? variables : void 0
      };
      if (variables.present) {
        for (const [colName, vars] of Object.entries(variables.collections)) {
          if (!colName.toLowerCase().includes("color")) continue;
          for (const [varName, value] of Object.entries(vars)) {
            if (typeof value !== "string" || !value.startsWith("#")) continue;
            const safeName = varName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
            const cssVar = `--clr-${safeName}`;
            allDesignTokenColors[cssVar] = value;
          }
        }
        designTokens.colors = allDesignTokenColors;
      }
      const responsiveMap = matchResponsiveFrames(
        responsivePairs.flatMap((p) => {
          const frames = [{
            id: p.desktop.frameId,
            name: p.desktop.frameName,
            width: p.desktop.width,
            height: 0,
            breakpoint: "desktop",
            sectionCount: 0,
            hasAutoLayout: false,
            responsivePairId: null
          }];
          if (p.mobile) {
            frames.push({
              id: p.mobile.frameId,
              name: p.mobile.frameName,
              width: p.mobile.width,
              height: 0,
              breakpoint: "mobile",
              sectionCount: 0,
              hasAutoLayout: false,
              responsivePairId: null
            });
          }
          return frames;
        })
      );
      sendMessage({
        type: "EXPORT_COMPLETE",
        manifest,
        responsiveMap,
        designTokens
      });
    });
  }
  function mergeResponsiveData(desktopSections, mobileSections, mobileWidth) {
    const bpKey = String(mobileWidth);
    for (const [layoutName, desktopSpec] of Object.entries(desktopSections)) {
      const mobileSpec = mobileSections[layoutName];
      if (!mobileSpec) continue;
      const override = {};
      const sectionDiff = {};
      for (const [key, desktopVal] of Object.entries(desktopSpec.section)) {
        const mobileVal = mobileSpec.section[key];
        if (mobileVal && mobileVal !== desktopVal) {
          sectionDiff[key] = mobileVal;
        }
      }
      if (Object.keys(sectionDiff).length > 0) {
        override.section = sectionDiff;
      }
      const elementsDiff = {};
      for (const [elemName, desktopElem] of Object.entries(desktopSpec.elements)) {
        const mobileElem = mobileSpec.elements[elemName];
        if (!mobileElem) continue;
        const diff = {};
        for (const [key, desktopVal] of Object.entries(desktopElem)) {
          const mobileVal = mobileElem[key];
          if (mobileVal !== void 0 && mobileVal !== desktopVal) {
            diff[key] = mobileVal;
          }
        }
        if (Object.keys(diff).length > 0) {
          elementsDiff[elemName] = diff;
        }
      }
      if (Object.keys(elementsDiff).length > 0) {
        override.elements = elementsDiff;
      }
      if (mobileSpec.grid.columns !== desktopSpec.grid.columns || mobileSpec.grid.gap !== desktopSpec.grid.gap) {
        override.grid = {};
        if (mobileSpec.grid.columns !== desktopSpec.grid.columns) {
          override.grid.columns = mobileSpec.grid.columns;
        }
        if (mobileSpec.grid.gap !== desktopSpec.grid.gap) {
          override.grid.gap = mobileSpec.grid.gap;
        }
      }
      if (Object.keys(override).length > 0) {
        if (!desktopSpec.responsive) desktopSpec.responsive = {};
        desktopSpec.responsive[bpKey] = override;
      }
    }
  }
  function buildTokenSections(frame, pageSlug) {
    const sections = frame.children.filter(
      (c) => c.visible !== false && (c.type === "FRAME" || c.type === "COMPONENT" || c.type === "INSTANCE" || c.type === "GROUP") && c.absoluteBoundingBox
    ).sort((a, b) => a.absoluteBoundingBox.y - b.absoluteBoundingBox.y);
    return sections.map((s, i) => {
      const bounds = s.absoluteBoundingBox;
      const parentBounds = frame.absoluteBoundingBox;
      const imageCount = countImages(s);
      const textNodes = countTextNodes(s);
      return {
        index: i + 1,
        name: s.name,
        id: s.id,
        dimensions: { width: Math.round(bounds.width), height: Math.round(bounds.height) },
        y_offset: Math.round(bounds.y - parentBounds.y),
        hasAutoLayout: s.type === "FRAME" && s.layoutMode !== void 0 && s.layoutMode !== "NONE",
        image_count: imageCount,
        image_files: collectImageFileNames(s),
        text_nodes: textNodes,
        screenshot: `screenshots/${slugify(s.name)}.png`,
        screenshot_complete: true
      };
    });
  }
  function countImages(node) {
    let count = 0;
    function walk(n) {
      if ("fills" in n && Array.isArray(n.fills)) {
        if (n.fills.some((f) => f.type === "IMAGE" && f.visible !== false)) count++;
      }
      if ("children" in n) {
        for (const child of n.children) walk(child);
      }
    }
    walk(node);
    return count;
  }
  function computeGlobalSectionNames(pairs) {
    const nameToPageCount = /* @__PURE__ */ new Map();
    for (const pair of pairs) {
      try {
        const node = figma.getNodeById(pair.desktop.frameId);
        if (!node || node.type !== "FRAME") continue;
        const frame = node;
        let candidates = frame.children.filter(
          (c) => c.visible !== false && (c.type === "FRAME" || c.type === "COMPONENT" || c.type === "INSTANCE" || c.type === "GROUP")
        );
        if (candidates.length === 1 && "children" in candidates[0]) {
          const inner = candidates[0].children.filter(
            (c) => c.visible !== false && (c.type === "FRAME" || c.type === "COMPONENT" || c.type === "INSTANCE" || c.type === "GROUP")
          );
          if (inner.length > 1) candidates = inner;
        }
        const seenOnThisPage = /* @__PURE__ */ new Set();
        for (const c of candidates) {
          const key = normalizeSectionName(c.name || "");
          if (!key) continue;
          seenOnThisPage.add(key);
        }
        for (const name of seenOnThisPage) {
          nameToPageCount.set(name, (nameToPageCount.get(name) || 0) + 1);
        }
      } catch (e) {
        console.warn("computeGlobalSectionNames: failed to scan frame", pair.pageName, e);
      }
    }
    const out = /* @__PURE__ */ new Set();
    for (const [name, count] of nameToPageCount) {
      if (count >= 2) out.add(name);
    }
    return out;
  }
  function collectImageFileNames(node) {
    const names = [];
    function walk(n) {
      if ("fills" in n && Array.isArray(n.fills)) {
        if (n.fills.some((f) => f.type === "IMAGE" && f.visible !== false)) {
          names.push(`${slugify(n.name)}.png`);
        }
      }
      if ("children" in n) {
        for (const child of n.children) walk(child);
      }
    }
    walk(node);
    return names;
  }
  function generateSpecMd(pageName, pageSlug, specs, tokens) {
    const lines = [];
    lines.push(`# Design Spec \u2014 ${pageName}`);
    lines.push(`## Source: Figma Plugin Export`);
    lines.push(`## Generated: ${specs.extracted_at}`);
    lines.push("");
    lines.push("## Page Metadata");
    lines.push(`- Page Name: ${pageName}`);
    lines.push(`- Canvas Width: ${specs.figma_canvas_width}px`);
    lines.push(`- Section Count: ${Object.keys(specs.sections).length}`);
    if (specs.mobile_canvas_width) {
      lines.push(`- Mobile Canvas Width: ${specs.mobile_canvas_width}px`);
    }
    lines.push("");
    lines.push("## Colors Used");
    lines.push("| HEX | Usage Count |");
    lines.push("|-----|------------|");
    const sortedColors = Object.entries(tokens.colors).sort((a, b) => b[1] - a[1]);
    for (const [hex, count] of sortedColors.slice(0, 20)) {
      lines.push(`| ${hex} | ${count} |`);
    }
    lines.push("");
    lines.push("## Typography Used");
    lines.push("| Font | Styles | Sizes |");
    lines.push("|------|--------|-------|");
    for (const [family, info] of Object.entries(tokens.fonts)) {
      lines.push(`| ${family} | ${info.styles.join(", ")} | ${info.sizes.join(", ")}px |`);
    }
    lines.push("");
    lines.push("## Sections");
    lines.push("");
    for (const [layoutName, spec] of Object.entries(specs.sections)) {
      lines.push(`### ${layoutName}`);
      lines.push(`- **Spacing Source**: ${spec.spacingSource}`);
      lines.push(`- **Background**: ${spec.section.backgroundColor || "none"}`);
      lines.push(`- **Grid**: ${spec.grid.layoutMode}, ${spec.grid.columns} columns, gap: ${spec.grid.gap || "none"}`);
      if (spec.interactions && spec.interactions.length > 0) {
        lines.push(`- **Interactions**: ${spec.interactions.length} (${spec.interactions.map((i) => i.trigger).join(", ")})`);
      }
      if (spec.overlap) {
        lines.push(`- **Overlap**: ${spec.overlap.pixels}px with "${spec.overlap.withSection}"`);
      }
      lines.push("");
      for (const [elemName, elemStyles] of Object.entries(spec.elements)) {
        const props = Object.entries(elemStyles).filter(([, v]) => v !== null && v !== void 0).map(([k, v]) => `${k}: ${v}`).join(", ");
        lines.push(`  - **${elemName}**: ${props}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }
  var init_extractor = __esm({
    "src/sandbox/extractor.ts"() {
      "use strict";
      init_utils();
      init_color();
      init_typography();
      init_spacing();
      init_section_parser();
      init_responsive();
      init_image_exporter();
      init_variables();
      init_patterns();
    }
  });

  // src/main.ts
  var require_main = __commonJS({
    "src/main.ts"(exports) {
      init_discovery();
      init_validator();
      init_extractor();
      figma.showUI(__html__, { width: 640, height: 520 });
      console.log("WP Theme Builder Export: Plugin initialized");
      var cancelRequested = false;
      figma.ui.onmessage = (msg) => __async(exports, null, function* () {
        console.log("Sandbox received message:", msg.type);
        switch (msg.type) {
          case "DISCOVER_PAGES": {
            try {
              const pages = discoverPages();
              console.log("Pages discovered:", pages.length);
              figma.ui.postMessage({ type: "PAGES_DISCOVERED", pages });
            } catch (err) {
              console.error("Discovery error:", err);
              figma.ui.postMessage({ type: "EXPORT_ERROR", error: String(err) });
            }
            break;
          }
          case "VALIDATE": {
            try {
              const results = yield runAllValidations(msg.frameIds);
              console.log("Validation complete:", results.length, "results");
              figma.ui.postMessage({
                type: "VALIDATION_COMPLETE",
                results,
                frameIds: msg.frameIds
              });
            } catch (err) {
              console.error("Validation error:", err);
              figma.ui.postMessage({
                type: "EXPORT_ERROR",
                error: `Validation failed: ${err}`
              });
            }
            break;
          }
          case "START_EXPORT": {
            cancelRequested = false;
            try {
              yield runExtraction(
                msg.frameIds,
                msg.responsivePairs,
                (message) => figma.ui.postMessage(message),
                () => cancelRequested
              );
            } catch (err) {
              console.error("Export error:", err);
              figma.ui.postMessage({
                type: "EXPORT_ERROR",
                error: `Export failed: ${err}`
              });
            }
            break;
          }
          case "CANCEL_EXPORT": {
            cancelRequested = true;
            console.log("Export cancelled by user");
            break;
          }
        }
      });
    }
  });
  require_main();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3NhbmRib3gvdXRpbHMudHMiLCAiLi4vc3JjL3NhbmRib3gvcmVzcG9uc2l2ZS50cyIsICIuLi9zcmMvc2FuZGJveC9kaXNjb3ZlcnkudHMiLCAiLi4vc3JjL3NhbmRib3gvdmFsaWRhdG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2NvbG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2VmZmVjdHMudHMiLCAiLi4vc3JjL3NhbmRib3gvdHlwb2dyYXBoeS50cyIsICIuLi9zcmMvc2FuZGJveC9zcGFjaW5nLnRzIiwgIi4uL3NyYy9zYW5kYm94L2dyaWQudHMiLCAiLi4vc3JjL3NhbmRib3gvaW50ZXJhY3Rpb25zLnRzIiwgIi4uL3NyYy9zYW5kYm94L3ZhcmlhYmxlcy50cyIsICIuLi9zcmMvc2FuZGJveC9wYXR0ZXJucy50cyIsICIuLi9zcmMvc2FuZGJveC9zZWN0aW9uLXBhcnNlci50cyIsICIuLi9zcmMvc2FuZGJveC9pbWFnZS1leHBvcnRlci50cyIsICIuLi9zcmMvc2FuZGJveC9leHRyYWN0b3IudHMiLCAiLi4vc3JjL21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogQ29udmVydCBhIEZpZ21hIGxheWVyIG5hbWUgdG8gYSBVUkwtc2FmZSBrZWJhYi1jYXNlIHNsdWcuXG4gKiBcIkhlcm8gU2VjdGlvblwiIFx1MjE5MiBcImhlcm8tc2VjdGlvblwiXG4gKiBcIkFib3V0IFVzIFx1MjAxNCBPdmVydmlld1wiIFx1MjE5MiBcImFib3V0LXVzLW92ZXJ2aWV3XCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNsdWdpZnkobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5hbWVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXHUyMDE0XHUyMDEzXS9nLCAnLScpXG4gICAgLnJlcGxhY2UoL1teYS16MC05XFxzLV0vZywgJycpXG4gICAgLnJlcGxhY2UoL1xccysvZywgJy0nKVxuICAgIC5yZXBsYWNlKC8tKy9nLCAnLScpXG4gICAgLnJlcGxhY2UoL14tfC0kL2csICcnKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgRmlnbWEgbGF5ZXIgbmFtZSB0byBBQ0YtY29tcGF0aWJsZSBzbmFrZV9jYXNlIGxheW91dCBuYW1lLlxuICogXCJIZXJvIFNlY3Rpb25cIiBcdTIxOTIgXCJoZXJvX3NlY3Rpb25cIlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9MYXlvdXROYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBuYW1lXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW1x1MjAxNFx1MjAxM10vZywgJ18nKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOVxcc19dL2csICcnKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csICdfJylcbiAgICAucmVwbGFjZSgvXysvZywgJ18nKVxuICAgIC5yZXBsYWNlKC9eX3xfJC9nLCAnJyk7XG59XG5cbi8qKlxuICogQ29udmVydCBhIG51bWVyaWMgdmFsdWUgdG8gYSBDU1MgdmFsdWUgc3RyaW5nIHdpdGggdW5pdC5cbiAqIE5FVkVSIHJldHVybnMgYSBiYXJlIG51bWJlciBcdTIwMTQgYWx3YXlzIFwiTnB4XCIsIFwiTiVcIiwgZXRjLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSB2YWx1ZSBpcyB1bmRlZmluZWQvbnVsbC9OYU4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0Nzc1ZhbHVlKHZhbHVlOiBudW1iZXIgfCB1bmRlZmluZWQgfCBudWxsLCB1bml0OiBzdHJpbmcgPSAncHgnKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IGlzTmFOKHZhbHVlKSkgcmV0dXJuIG51bGw7XG4gIC8vIFJvdW5kIHRvIGF2b2lkIGZsb2F0aW5nLXBvaW50IG5vaXNlIChlLmcuLCA3OS45OTk5OSBcdTIxOTIgODApXG4gIGNvbnN0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKHZhbHVlICogMTAwKSAvIDEwMDtcbiAgLy8gVXNlIGludGVnZXIgd2hlbiBjbG9zZSBlbm91Z2hcbiAgY29uc3QgZGlzcGxheSA9IE51bWJlci5pc0ludGVnZXIocm91bmRlZCkgPyByb3VuZGVkIDogcm91bmRlZDtcbiAgcmV0dXJuIGAke2Rpc3BsYXl9JHt1bml0fWA7XG59XG5cbi8qKlxuICogRm9ybWF0IGEgRmlnbWEgbm9kZSBJRCBmb3Igb3V0cHV0LiBGaWdtYSB1c2VzIFwiMToyMzRcIiBmb3JtYXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub2RlSWRUb1N0cmluZyhpZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlkO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgc2NyZWVuc2hvdCBmaWxlbmFtZSBmcm9tIHRoZSBzZWN0aW9uJ3MgbGF5b3V0IG5hbWUuXG4gKiBcIkhlcm8gU2VjdGlvblwiIFx1MjE5MiBcImhlcm8tc2VjdGlvbi5wbmdcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2NyZWVuc2hvdEZpbGVuYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtzbHVnaWZ5KG5hbWUpfS5wbmdgO1xufVxuXG4vKipcbiAqIENvbXB1dGUgdGhlIGFzcGVjdCByYXRpbyBzdHJpbmcgZnJvbSB3aWR0aCBhbmQgaGVpZ2h0LlxuICogUmV0dXJucyB0aGUgc2ltcGxlc3QgaW50ZWdlciByYXRpbzogMTQ0MC85MDAgXHUyMTkyIFwiMTYvMTBcIlxuICogUmV0dXJucyBudWxsIGlmIGVpdGhlciBkaW1lbnNpb24gaXMgMC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVBc3BlY3RSYXRpbyh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIXdpZHRoIHx8ICFoZWlnaHQpIHJldHVybiBudWxsO1xuICBjb25zdCBnY2QgPSAoYTogbnVtYmVyLCBiOiBudW1iZXIpOiBudW1iZXIgPT4gKGIgPT09IDAgPyBhIDogZ2NkKGIsIGEgJSBiKSk7XG4gIGNvbnN0IGQgPSBnY2QoTWF0aC5yb3VuZCh3aWR0aCksIE1hdGgucm91bmQoaGVpZ2h0KSk7XG4gIHJldHVybiBgJHtNYXRoLnJvdW5kKHdpZHRoIC8gZCl9LyR7TWF0aC5yb3VuZChoZWlnaHQgLyBkKX1gO1xufVxuXG4vKipcbiAqIERldGVjdCBpZiBhIG5vZGUgbmFtZSBpcyBhIGRlZmF1bHQgRmlnbWEtZ2VuZXJhdGVkIG5hbWUuXG4gKiBcIkZyYW1lIDFcIiwgXCJHcm91cCAyM1wiLCBcIlJlY3RhbmdsZSA0XCIsIFwiVmVjdG9yXCIgXHUyMTkyIHRydWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGVmYXVsdExheWVyTmFtZShuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIC9eKEZyYW1lfEdyb3VwfFJlY3RhbmdsZXxFbGxpcHNlfExpbmV8VmVjdG9yfFBvbHlnb258U3RhcnxCb29sZWFufFNsaWNlfENvbXBvbmVudHxJbnN0YW5jZSlcXHMqXFxkKiQvaS50ZXN0KG5hbWUpO1xufVxuIiwgImltcG9ydCB7IEJyZWFrcG9pbnRDbGFzcywgRnJhbWVJbmZvLCBSZXNwb25zaXZlTWFwLCBSZXNwb25zaXZlUGFpciwgVW5tYXRjaGVkRnJhbWUgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHNsdWdpZnkgfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBDbGFzc2lmeSBhIGZyYW1lIHdpZHRoIGludG8gYSBicmVha3BvaW50IGNhdGVnb3J5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NpZnlCcmVha3BvaW50KHdpZHRoOiBudW1iZXIpOiBCcmVha3BvaW50Q2xhc3Mge1xuICBpZiAod2lkdGggPD0gNDgwKSByZXR1cm4gJ21vYmlsZSc7XG4gIGlmICh3aWR0aCA8PSA4MjApIHJldHVybiAndGFibGV0JztcbiAgaWYgKHdpZHRoIDw9IDE0NDApIHJldHVybiAnZGVza3RvcCc7XG4gIHJldHVybiAnbGFyZ2UnO1xufVxuXG4vKipcbiAqIENvbW1vbiBzdWZmaXhlcy9rZXl3b3JkcyB0aGF0IGRlbm90ZSBicmVha3BvaW50cyBpbiBmcmFtZSBuYW1lcy5cbiAqL1xuY29uc3QgQlJFQUtQT0lOVF9QQVRURVJOUyA9IFtcbiAgL1stXHUyMDEzXHUyMDE0XFxzXSooZGVza3RvcHxtb2JpbGV8dGFibGV0fHJlc3BvbnNpdmV8cGhvbmV8d2VifGxnfG1kfHNtfHhzKS9naSxcbiAgL1stXHUyMDEzXHUyMDE0XFxzXSooXFxkezMsNH0pXFxzKig/OnB4KT8kL2dpLCAgIC8vIHRyYWlsaW5nIHdpZHRoIG51bWJlcnMgbGlrZSBcIjE0NDBcIiBvciBcIjM3NXB4XCJcbiAgL1xcKCg/OmRlc2t0b3B8bW9iaWxlfHRhYmxldHxwaG9uZSlcXCkvZ2ksXG4gIC9cXHMrJC9nLFxuXTtcblxuLyoqXG4gKiBOb3JtYWxpemUgYSBmcmFtZSBuYW1lIGJ5IHN0cmlwcGluZyBicmVha3BvaW50IGlkZW50aWZpZXJzLlxuICogXCJBYm91dCAtIERlc2t0b3BcIiBcdTIxOTIgXCJhYm91dFwiXG4gKiBcIkhvbWVwYWdlIDE0NDBcIiBcdTIxOTIgXCJob21lcGFnZVwiXG4gKiBcIlNlcnZpY2VzIChNb2JpbGUpXCIgXHUyMTkyIFwic2VydmljZXNcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRnJhbWVOYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBub3JtYWxpemVkID0gbmFtZTtcbiAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIEJSRUFLUE9JTlRfUEFUVEVSTlMpIHtcbiAgICBub3JtYWxpemVkID0gbm9ybWFsaXplZC5yZXBsYWNlKHBhdHRlcm4sICcnKTtcbiAgfVxuICByZXR1cm4gbm9ybWFsaXplZC50cmltKCkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG59XG5cbi8qKlxuICogTWF0Y2ggZGVza3RvcCBhbmQgbW9iaWxlIGZyYW1lcyBieSBuYW1lIHNpbWlsYXJpdHkuXG4gKiBSZXR1cm5zIFJlc3BvbnNpdmVNYXAgd2l0aCBtYXRjaGVkIHBhaXJzIGFuZCB1bm1hdGNoZWQgZnJhbWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hSZXNwb25zaXZlRnJhbWVzKGFsbEZyYW1lczogRnJhbWVJbmZvW10pOiBSZXNwb25zaXZlTWFwIHtcbiAgLy8gR3JvdXAgZnJhbWVzIGJ5IG5vcm1hbGl6ZWQgbmFtZVxuICBjb25zdCBncm91cHMgPSBuZXcgTWFwPHN0cmluZywgRnJhbWVJbmZvW10+KCk7XG5cbiAgZm9yIChjb25zdCBmcmFtZSBvZiBhbGxGcmFtZXMpIHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplRnJhbWVOYW1lKGZyYW1lLm5hbWUpO1xuICAgIGlmICghZ3JvdXBzLmhhcyhub3JtYWxpemVkKSkge1xuICAgICAgZ3JvdXBzLnNldChub3JtYWxpemVkLCBbXSk7XG4gICAgfVxuICAgIGdyb3Vwcy5nZXQobm9ybWFsaXplZCkhLnB1c2goZnJhbWUpO1xuICB9XG5cbiAgY29uc3QgbWF0Y2hlZFBhaXJzOiBSZXNwb25zaXZlUGFpcltdID0gW107XG4gIGNvbnN0IHVubWF0Y2hlZEZyYW1lczogVW5tYXRjaGVkRnJhbWVbXSA9IFtdO1xuICBjb25zdCBtYXRjaGVkSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCBbYmFzZU5hbWUsIGZyYW1lc10gb2YgZ3JvdXBzKSB7XG4gICAgaWYgKGZyYW1lcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIC8vIFNpbmdsZSBmcmFtZSBcdTIwMTQgbm8gcmVzcG9uc2l2ZSBwYWlyXG4gICAgICBjb25zdCBmcmFtZSA9IGZyYW1lc1swXTtcbiAgICAgIGlmIChmcmFtZS5icmVha3BvaW50ID09PSAnZGVza3RvcCcgfHwgZnJhbWUuYnJlYWtwb2ludCA9PT0gJ2xhcmdlJykge1xuICAgICAgICAvLyBEZXNrdG9wIHdpdGhvdXQgbW9iaWxlIFx1MjE5MiBzdGlsbCBhIHZhbGlkIHBhZ2UsIGp1c3Qgbm8gcmVzcG9uc2l2ZSBkYXRhXG4gICAgICAgIG1hdGNoZWRQYWlycy5wdXNoKHtcbiAgICAgICAgICBwYWdlTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgICBwYWdlU2x1Zzogc2x1Z2lmeShiYXNlTmFtZSB8fCBmcmFtZS5uYW1lKSxcbiAgICAgICAgICBkZXNrdG9wOiB7IGZyYW1lSWQ6IGZyYW1lLmlkLCBmcmFtZU5hbWU6IGZyYW1lLm5hbWUsIHdpZHRoOiBmcmFtZS53aWR0aCB9LFxuICAgICAgICAgIG1vYmlsZTogbnVsbCxcbiAgICAgICAgICB0YWJsZXQ6IG51bGwsXG4gICAgICAgICAgbWF0Y2hDb25maWRlbmNlOiAxLjAsXG4gICAgICAgICAgbWF0Y2hNZXRob2Q6ICduYW1lLXNpbWlsYXJpdHknLFxuICAgICAgICB9KTtcbiAgICAgICAgbWF0Y2hlZElkcy5hZGQoZnJhbWUuaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5tYXRjaGVkRnJhbWVzLnB1c2goe1xuICAgICAgICAgIGZyYW1lSWQ6IGZyYW1lLmlkLFxuICAgICAgICAgIGZyYW1lTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgICB3aWR0aDogZnJhbWUud2lkdGgsXG4gICAgICAgICAgYnJlYWtwb2ludDogZnJhbWUuYnJlYWtwb2ludCxcbiAgICAgICAgICByZWFzb246ICdubyBkZXNrdG9wIGNvdW50ZXJwYXJ0IGZvdW5kJyxcbiAgICAgICAgfSk7XG4gICAgICAgIG1hdGNoZWRJZHMuYWRkKGZyYW1lLmlkKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIE11bHRpcGxlIGZyYW1lcyB3aXRoIHNhbWUgYmFzZSBuYW1lIFx1MjAxNCBtYXRjaCBieSBicmVha3BvaW50XG4gICAgY29uc3QgZGVza3RvcCA9IGZyYW1lcy5maW5kKGYgPT4gZi5icmVha3BvaW50ID09PSAnZGVza3RvcCcgfHwgZi5icmVha3BvaW50ID09PSAnbGFyZ2UnKTtcbiAgICBjb25zdCBtb2JpbGUgPSBmcmFtZXMuZmluZChmID0+IGYuYnJlYWtwb2ludCA9PT0gJ21vYmlsZScpO1xuICAgIGNvbnN0IHRhYmxldCA9IGZyYW1lcy5maW5kKGYgPT4gZi5icmVha3BvaW50ID09PSAndGFibGV0Jyk7XG5cbiAgICBpZiAoZGVza3RvcCkge1xuICAgICAgbWF0Y2hlZFBhaXJzLnB1c2goe1xuICAgICAgICBwYWdlTmFtZTogZGVza3RvcC5uYW1lLFxuICAgICAgICBwYWdlU2x1Zzogc2x1Z2lmeShiYXNlTmFtZSB8fCBkZXNrdG9wLm5hbWUpLFxuICAgICAgICBkZXNrdG9wOiB7IGZyYW1lSWQ6IGRlc2t0b3AuaWQsIGZyYW1lTmFtZTogZGVza3RvcC5uYW1lLCB3aWR0aDogZGVza3RvcC53aWR0aCB9LFxuICAgICAgICBtb2JpbGU6IG1vYmlsZSA/IHsgZnJhbWVJZDogbW9iaWxlLmlkLCBmcmFtZU5hbWU6IG1vYmlsZS5uYW1lLCB3aWR0aDogbW9iaWxlLndpZHRoIH0gOiBudWxsLFxuICAgICAgICB0YWJsZXQ6IHRhYmxldCA/IHsgZnJhbWVJZDogdGFibGV0LmlkLCBmcmFtZU5hbWU6IHRhYmxldC5uYW1lLCB3aWR0aDogdGFibGV0LndpZHRoIH0gOiBudWxsLFxuICAgICAgICBtYXRjaENvbmZpZGVuY2U6IDAuOTUsXG4gICAgICAgIG1hdGNoTWV0aG9kOiAnbmFtZS1zaW1pbGFyaXR5JyxcbiAgICAgIH0pO1xuICAgICAgbWF0Y2hlZElkcy5hZGQoZGVza3RvcC5pZCk7XG4gICAgICBpZiAobW9iaWxlKSBtYXRjaGVkSWRzLmFkZChtb2JpbGUuaWQpO1xuICAgICAgaWYgKHRhYmxldCkgbWF0Y2hlZElkcy5hZGQodGFibGV0LmlkKTtcbiAgICB9XG5cbiAgICAvLyBBbnkgcmVtYWluaW5nIGZyYW1lcyBpbiB0aGlzIGdyb3VwXG4gICAgZm9yIChjb25zdCBmcmFtZSBvZiBmcmFtZXMpIHtcbiAgICAgIGlmICghbWF0Y2hlZElkcy5oYXMoZnJhbWUuaWQpKSB7XG4gICAgICAgIHVubWF0Y2hlZEZyYW1lcy5wdXNoKHtcbiAgICAgICAgICBmcmFtZUlkOiBmcmFtZS5pZCxcbiAgICAgICAgICBmcmFtZU5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgICAgd2lkdGg6IGZyYW1lLndpZHRoLFxuICAgICAgICAgIGJyZWFrcG9pbnQ6IGZyYW1lLmJyZWFrcG9pbnQsXG4gICAgICAgICAgcmVhc29uOiAnY291bGQgbm90IHBhaXIgd2l0aCBkZXNrdG9wIGZyYW1lJyxcbiAgICAgICAgfSk7XG4gICAgICAgIG1hdGNoZWRJZHMuYWRkKGZyYW1lLmlkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBDYXRjaCBhbnkgZnJhbWVzIG5vdCBwcm9jZXNzZWRcbiAgZm9yIChjb25zdCBmcmFtZSBvZiBhbGxGcmFtZXMpIHtcbiAgICBpZiAoIW1hdGNoZWRJZHMuaGFzKGZyYW1lLmlkKSkge1xuICAgICAgdW5tYXRjaGVkRnJhbWVzLnB1c2goe1xuICAgICAgICBmcmFtZUlkOiBmcmFtZS5pZCxcbiAgICAgICAgZnJhbWVOYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgICB3aWR0aDogZnJhbWUud2lkdGgsXG4gICAgICAgIGJyZWFrcG9pbnQ6IGZyYW1lLmJyZWFrcG9pbnQsXG4gICAgICAgIHJlYXNvbjogJ25vdCBtYXRjaGVkIGJ5IGFueSBtZXRob2QnLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgbWF0Y2hlZFBhaXJzLCB1bm1hdGNoZWRGcmFtZXMgfTtcbn1cblxuLyoqXG4gKiBDb250ZW50LWJhc2VkIG1hdGNoaW5nIGZhbGxiYWNrOiBjb21wYXJlIGNoaWxkIG5hbWVzIGJldHdlZW4gdHdvIGZyYW1lcy5cbiAqIFJldHVybnMgb3ZlcmxhcCByYXRpbyAoMC0xKS4gPjAuNiA9IGxpa2VseSBzYW1lIHBhZ2UgYXQgZGlmZmVyZW50IGJyZWFrcG9pbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUNvbnRlbnRPdmVybGFwKGZyYW1lQTogRnJhbWVOb2RlLCBmcmFtZUI6IEZyYW1lTm9kZSk6IG51bWJlciB7XG4gIGNvbnN0IG5hbWVzQSA9IG5ldyBTZXQoZnJhbWVBLmNoaWxkcmVuLm1hcChjID0+IGMubmFtZS50b0xvd2VyQ2FzZSgpKSk7XG4gIGNvbnN0IG5hbWVzQiA9IG5ldyBTZXQoZnJhbWVCLmNoaWxkcmVuLm1hcChjID0+IGMubmFtZS50b0xvd2VyQ2FzZSgpKSk7XG5cbiAgaWYgKG5hbWVzQS5zaXplID09PSAwIHx8IG5hbWVzQi5zaXplID09PSAwKSByZXR1cm4gMDtcblxuICBsZXQgb3ZlcmxhcCA9IDA7XG4gIGZvciAoY29uc3QgbmFtZSBvZiBuYW1lc0EpIHtcbiAgICBpZiAobmFtZXNCLmhhcyhuYW1lKSkgb3ZlcmxhcCsrO1xuICB9XG5cbiAgY29uc3QgdW5pb25TaXplID0gbmV3IFNldChbLi4ubmFtZXNBLCAuLi5uYW1lc0JdKS5zaXplO1xuICByZXR1cm4gdW5pb25TaXplID4gMCA/IG92ZXJsYXAgLyB1bmlvblNpemUgOiAwO1xufVxuIiwgImltcG9ydCB7IFBhZ2VJbmZvLCBGcmFtZUluZm8gfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IGNsYXNzaWZ5QnJlYWtwb2ludCB9IGZyb20gJy4vcmVzcG9uc2l2ZSc7XG5cbi8qKlxuICogRGlzY292ZXIgYWxsIHBhZ2VzIGluIHRoZSBGaWdtYSBmaWxlLlxuICogRWFjaCBwYWdlIGNvbnRhaW5zIGZyYW1lcyB0aGF0IHJlcHJlc2VudCBkZXNpZ24gYXJ0Ym9hcmRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlzY292ZXJQYWdlcygpOiBQYWdlSW5mb1tdIHtcbiAgY29uc3QgcGFnZXM6IFBhZ2VJbmZvW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IHBhZ2Ugb2YgZmlnbWEucm9vdC5jaGlsZHJlbikge1xuICAgIGNvbnN0IGZyYW1lcyA9IGRpc2NvdmVyRnJhbWVzKHBhZ2UpO1xuICAgIGlmIChmcmFtZXMubGVuZ3RoID4gMCkge1xuICAgICAgcGFnZXMucHVzaCh7XG4gICAgICAgIGlkOiBwYWdlLmlkLFxuICAgICAgICBuYW1lOiBwYWdlLm5hbWUsXG4gICAgICAgIGZyYW1lcyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYWdlcztcbn1cblxuLyoqXG4gKiBEaXNjb3ZlciBhbGwgdG9wLWxldmVsIGZyYW1lcyB3aXRoaW4gYSBwYWdlLlxuICogRmlsdGVycyB0byBGUkFNRSwgQ09NUE9ORU5UX1NFVCwgYW5kIENPTVBPTkVOVCBub2RlcyB3aXRoIG1lYW5pbmdmdWwgZGltZW5zaW9ucy5cbiAqL1xuZnVuY3Rpb24gZGlzY292ZXJGcmFtZXMocGFnZTogUGFnZU5vZGUpOiBGcmFtZUluZm9bXSB7XG4gIGNvbnN0IGZyYW1lczogRnJhbWVJbmZvW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGNoaWxkIG9mIHBhZ2UuY2hpbGRyZW4pIHtcbiAgICAvLyBPbmx5IGluY2x1ZGUgdG9wLWxldmVsIGZyYW1lcyAobm90IGdyb3VwcywgdmVjdG9ycywgZXRjLilcbiAgICBpZiAoY2hpbGQudHlwZSAhPT0gJ0ZSQU1FJyAmJiBjaGlsZC50eXBlICE9PSAnQ09NUE9ORU5UJyAmJiBjaGlsZC50eXBlICE9PSAnQ09NUE9ORU5UX1NFVCcpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGZyYW1lID0gY2hpbGQgYXMgRnJhbWVOb2RlO1xuXG4gICAgLy8gU2tpcCB0aW55IGZyYW1lcyAobGlrZWx5IGljb25zIG9yIGNvbXBvbmVudHMsIG5vdCBwYWdlIGRlc2lnbnMpXG4gICAgaWYgKGZyYW1lLndpZHRoIDwgMzAwIHx8IGZyYW1lLmhlaWdodCA8IDIwMCkgY29udGludWU7XG5cbiAgICAvLyBDb3VudCB2aXNpYmxlIHNlY3Rpb25zIChkaXJlY3QgY2hpbGRyZW4gdGhhdCBhcmUgZnJhbWVzKVxuICAgIGNvbnN0IHNlY3Rpb25Db3VudCA9IGZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJykgJiZcbiAgICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveCAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94LmhlaWdodCA+IDUwXG4gICAgKS5sZW5ndGg7XG5cbiAgICAvLyBDaGVjayBpZiBhbnkgc2VjdGlvbiB1c2VzIGF1dG8tbGF5b3V0XG4gICAgY29uc3QgaGFzQXV0b0xheW91dCA9IGZyYW1lLmxheW91dE1vZGUgIT09IHVuZGVmaW5lZCAmJiBmcmFtZS5sYXlvdXRNb2RlICE9PSAnTk9ORSc7XG5cbiAgICBmcmFtZXMucHVzaCh7XG4gICAgICBpZDogZnJhbWUuaWQsXG4gICAgICBuYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgd2lkdGg6IE1hdGgucm91bmQoZnJhbWUud2lkdGgpLFxuICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKGZyYW1lLmhlaWdodCksXG4gICAgICBicmVha3BvaW50OiBjbGFzc2lmeUJyZWFrcG9pbnQoTWF0aC5yb3VuZChmcmFtZS53aWR0aCkpLFxuICAgICAgc2VjdGlvbkNvdW50LFxuICAgICAgaGFzQXV0b0xheW91dCxcbiAgICAgIHJlc3BvbnNpdmVQYWlySWQ6IG51bGwsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gZnJhbWVzO1xufVxuIiwgImltcG9ydCB7IFZhbGlkYXRpb25SZXN1bHQsIEZyYW1lSW5mbyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgaXNEZWZhdWx0TGF5ZXJOYW1lIH0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogUnVuIGFsbCA5IHZhbGlkYXRpb24gY2hlY2tzIGFnYWluc3Qgc2VsZWN0ZWQgZnJhbWVzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuQWxsVmFsaWRhdGlvbnMoZnJhbWVJZHM6IHN0cmluZ1tdKTogUHJvbWlzZTxWYWxpZGF0aW9uUmVzdWx0W10+IHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG5cbiAgZm9yIChjb25zdCBmcmFtZUlkIG9mIGZyYW1lSWRzKSB7XG4gICAgY29uc3Qgbm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKGZyYW1lSWQpO1xuICAgIGlmICghbm9kZSB8fCBub2RlLnR5cGUgIT09ICdGUkFNRScpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgZnJhbWUgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICBjb25zdCBzZWN0aW9ucyA9IGZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJylcbiAgICApO1xuXG4gICAgLy8gQ2hlY2sgMTogTWlzc2luZyBhdXRvLWxheW91dCBvbiBzZWN0aW9uc1xuICAgIHJlc3VsdHMucHVzaCguLi5jaGVja0F1dG9MYXlvdXQoc2VjdGlvbnMsIGZyYW1lLm5hbWUpKTtcblxuICAgIC8vIENoZWNrIDI6IERlZmF1bHQgbGF5ZXIgbmFtZXNcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tMYXllck5hbWVzKHNlY3Rpb25zLCBmcmFtZS5uYW1lKSk7XG5cbiAgICAvLyBDaGVjayAzOiBNaXNzaW5nIGZvbnRzXG4gICAgcmVzdWx0cy5wdXNoKC4uLmF3YWl0IGNoZWNrRm9udHMoZnJhbWUpKTtcblxuICAgIC8vIENoZWNrIDQ6IEluY29uc2lzdGVudCBzcGFjaW5nXG4gICAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrU3BhY2luZ0NvbnNpc3RlbmN5KGZyYW1lKSk7XG5cbiAgICAvLyBDaGVjayA1OiBPdmVyc2l6ZWQgaW1hZ2VzXG4gICAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrT3ZlcnNpemVkSW1hZ2VzKGZyYW1lKSk7XG5cbiAgICAvLyBDaGVjayA2OiBPdmVybGFwcGluZyBzZWN0aW9uc1xuICAgIHJlc3VsdHMucHVzaCguLi5jaGVja092ZXJsYXBzKHNlY3Rpb25zLCBmcmFtZS5uYW1lKSk7XG5cbiAgICAvLyBDaGVjayA5OiBUZXh0IG92ZXJmbG93XG4gICAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrVGV4dE92ZXJmbG93KGZyYW1lKSk7XG4gIH1cblxuICAvLyBDaGVjayA3OiBNaXNzaW5nIHJlc3BvbnNpdmUgZnJhbWVzIChjcm9zcy1mcmFtZSBjaGVjaylcbiAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrUmVzcG9uc2l2ZUZyYW1lcyhmcmFtZUlkcykpO1xuXG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgMTogTWlzc2luZyBBdXRvLUxheW91dCBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tBdXRvTGF5b3V0KHNlY3Rpb25zOiBTY2VuZU5vZGVbXSwgZnJhbWVOYW1lOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcbiAgZm9yIChjb25zdCBzZWN0aW9uIG9mIHNlY3Rpb25zKSB7XG4gICAgaWYgKHNlY3Rpb24udHlwZSA9PT0gJ0ZSQU1FJyB8fCBzZWN0aW9uLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IHNlY3Rpb24udHlwZSA9PT0gJ0lOU1RBTkNFJykge1xuICAgICAgY29uc3QgZnJhbWUgPSBzZWN0aW9uIGFzIEZyYW1lTm9kZTtcbiAgICAgIGlmICghZnJhbWUubGF5b3V0TW9kZSB8fCBmcmFtZS5sYXlvdXRNb2RlID09PSAnTk9ORScpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgICAgIGNoZWNrOiAnYXV0by1sYXlvdXQnLFxuICAgICAgICAgIG1lc3NhZ2U6IGBTZWN0aW9uIFwiJHtzZWN0aW9uLm5hbWV9XCIgdXNlcyBhYnNvbHV0ZSBwb3NpdGlvbmluZy4gU3BhY2luZyB2YWx1ZXMgd2lsbCBiZSBhcHByb3hpbWF0ZS5gLFxuICAgICAgICAgIHNlY3Rpb25OYW1lOiBzZWN0aW9uLm5hbWUsXG4gICAgICAgICAgbm9kZUlkOiBzZWN0aW9uLmlkLFxuICAgICAgICAgIG5vZGVOYW1lOiBzZWN0aW9uLm5hbWUsXG4gICAgICAgICAgc3VnZ2VzdGlvbjogJ0FwcGx5IGF1dG8tbGF5b3V0IHRvIHRoaXMgc2VjdGlvbiBmb3IgcHJlY2lzZSBzcGFjaW5nIGV4dHJhY3Rpb24uJyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgMjogRGVmYXVsdCBMYXllciBOYW1lcyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tMYXllck5hbWVzKHNlY3Rpb25zOiBTY2VuZU5vZGVbXSwgZnJhbWVOYW1lOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcikge1xuICAgIGlmIChpc0RlZmF1bHRMYXllck5hbWUobm9kZS5uYW1lKSkge1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6IGRlcHRoID09PSAwID8gJ3dhcm5pbmcnIDogJ2luZm8nLFxuICAgICAgICBjaGVjazogJ2xheWVyLW5hbWVzJyxcbiAgICAgICAgbWVzc2FnZTogYExheWVyIFwiJHtub2RlLm5hbWV9XCIgaGFzIGEgZGVmYXVsdCBGaWdtYSBuYW1lJHtkZXB0aCA9PT0gMCA/ICcgKHNlY3Rpb24gbGV2ZWwpJyA6ICcnfS5gLFxuICAgICAgICBzZWN0aW9uTmFtZTogZnJhbWVOYW1lLFxuICAgICAgICBub2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgIG5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgIHN1Z2dlc3Rpb246ICdSZW5hbWUgdG8gYSBkZXNjcmlwdGl2ZSBuYW1lIChlLmcuLCBcIkhlcm8gU2VjdGlvblwiLCBcIkZlYXR1cmVzIEdyaWRcIikuJyxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlICYmIGRlcHRoIDwgMikge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQsIGRlcHRoICsgMSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBzZWN0aW9uIG9mIHNlY3Rpb25zKSB7XG4gICAgd2FsayhzZWN0aW9uLCAwKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDM6IE1pc3NpbmcgRm9udHMgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrRm9udHMoZnJhbWU6IEZyYW1lTm9kZSk6IFByb21pc2U8VmFsaWRhdGlvblJlc3VsdFtdPiB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuICBjb25zdCBjaGVja2VkRm9udHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmdW5jdGlvbiBjb2xsZWN0Rm9udE5hbWVzKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgZm9udE5hbWUgPSBub2RlLmZvbnROYW1lO1xuICAgICAgaWYgKGZvbnROYW1lICE9PSBmaWdtYS5taXhlZCAmJiBmb250TmFtZSkge1xuICAgICAgICBjb25zdCBrZXkgPSBgJHtmb250TmFtZS5mYW1pbHl9Ojoke2ZvbnROYW1lLnN0eWxlfWA7XG4gICAgICAgIGlmICghY2hlY2tlZEZvbnRzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgY2hlY2tlZEZvbnRzLmFkZChrZXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICBjb2xsZWN0Rm9udE5hbWVzKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb2xsZWN0Rm9udE5hbWVzKGZyYW1lKTtcblxuICBmb3IgKGNvbnN0IGZvbnRLZXkgb2YgY2hlY2tlZEZvbnRzKSB7XG4gICAgY29uc3QgW2ZhbWlseSwgc3R5bGVdID0gZm9udEtleS5zcGxpdCgnOjonKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZmlnbWEubG9hZEZvbnRBc3luYyh7IGZhbWlseSwgc3R5bGUgfSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJyxcbiAgICAgICAgY2hlY2s6ICdmb250cycsXG4gICAgICAgIG1lc3NhZ2U6IGBGb250IFwiJHtmYW1pbHl9ICR7c3R5bGV9XCIgaXMgbm90IGF2YWlsYWJsZS4gVGV4dCBleHRyYWN0aW9uIG1heSBmYWlsLmAsXG4gICAgICAgIHNlY3Rpb25OYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgICBzdWdnZXN0aW9uOiAnSW5zdGFsbCB0aGUgZm9udCBvciByZXBsYWNlIGl0IGluIHRoZSBkZXNpZ24uJyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDQ6IEluY29uc2lzdGVudCBTcGFjaW5nIFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja1NwYWNpbmdDb25zaXN0ZW5jeShmcmFtZTogRnJhbWVOb2RlKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG4gIGNvbnN0IHNwYWNpbmdWYWx1ZXM6IG51bWJlcltdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnKSB7XG4gICAgICBjb25zdCBmID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBpZiAoZi5sYXlvdXRNb2RlICYmIGYubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgICAgIHNwYWNpbmdWYWx1ZXMucHVzaChmLnBhZGRpbmdUb3AsIGYucGFkZGluZ0JvdHRvbSwgZi5wYWRkaW5nTGVmdCwgZi5wYWRkaW5nUmlnaHQsIGYuaXRlbVNwYWNpbmcpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdhbGsoZnJhbWUpO1xuXG4gIC8vIEZpbmQgbmVhci1kdXBsaWNhdGVzXG4gIGNvbnN0IHVuaXF1ZSA9IFsuLi5uZXcgU2V0KHNwYWNpbmdWYWx1ZXMuZmlsdGVyKHYgPT4gdiA+IDApKV0uc29ydCgoYSwgYikgPT4gYSAtIGIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHVuaXF1ZS5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBjb25zdCBkaWZmID0gdW5pcXVlW2kgKyAxXSAtIHVuaXF1ZVtpXTtcbiAgICBpZiAoZGlmZiA+IDAgJiYgZGlmZiA8PSAyKSB7XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogJ2luZm8nLFxuICAgICAgICBjaGVjazogJ3NwYWNpbmctY29uc2lzdGVuY3knLFxuICAgICAgICBtZXNzYWdlOiBgTmVhci1kdXBsaWNhdGUgc3BhY2luZzogJHt1bmlxdWVbaV19cHggYW5kICR7dW5pcXVlW2kgKyAxXX1weCBcdTIwMTQgbGlrZWx5IHNhbWUgaW50ZW50P2AsXG4gICAgICAgIHNlY3Rpb25OYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgICBzdWdnZXN0aW9uOiBgQ29uc2lkZXIgc3RhbmRhcmRpemluZyB0byAke01hdGgucm91bmQoKHVuaXF1ZVtpXSArIHVuaXF1ZVtpICsgMV0pIC8gMil9cHguYCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDU6IE92ZXJzaXplZCBJbWFnZXMgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrT3ZlcnNpemVkSW1hZ2VzKGZyYW1lOiBGcmFtZU5vZGUpOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmICgnZmlsbHMnIGluIG5vZGUpIHtcbiAgICAgIGNvbnN0IGZpbGxzID0gKG5vZGUgYXMgYW55KS5maWxscztcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGZpbGxzKSkge1xuICAgICAgICBmb3IgKGNvbnN0IGZpbGwgb2YgZmlsbHMpIHtcbiAgICAgICAgICBpZiAoZmlsbC50eXBlID09PSAnSU1BR0UnICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgICAgICAgIGlmIChib3VuZHMpIHtcbiAgICAgICAgICAgICAgLy8gRXN0aW1hdGUgcmF3IGltYWdlIHNpemUgKFJHQkEgYXQgMngpOiB3ICogMiAqIGggKiAyICogNCBieXRlc1xuICAgICAgICAgICAgICAvLyBFc3RpbWF0ZSBhdCAxeCBleHBvcnQ6IHdpZHRoICogaGVpZ2h0ICogNCAoUkdCQSBieXRlcylcbiAgICAgICAgICAgICAgY29uc3QgZXN0aW1hdGVkQnl0ZXMgPSBib3VuZHMud2lkdGggKiBib3VuZHMuaGVpZ2h0ICogNDtcbiAgICAgICAgICAgICAgY29uc3QgZXN0aW1hdGVkTUIgPSBlc3RpbWF0ZWRCeXRlcyAvICgxMDI0ICogMTAyNCk7XG4gICAgICAgICAgICAgIGlmIChlc3RpbWF0ZWRNQiA+IDUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgICAgICAgICAgICAgIGNoZWNrOiAnaW1hZ2Utc2l6ZScsXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgSW1hZ2UgaW4gXCIke25vZGUubmFtZX1cIiBpcyBlc3RpbWF0ZWQgYXQgJHtlc3RpbWF0ZWRNQi50b0ZpeGVkKDEpfU1CIGF0IDF4IGV4cG9ydC5gLFxuICAgICAgICAgICAgICAgICAgbm9kZUlkOiBub2RlLmlkLFxuICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgIHN1Z2dlc3Rpb246ICdDb25zaWRlciByZWR1Y2luZyBpbWFnZSBkaW1lbnNpb25zIG9yIGV4cG9ydCBzY2FsZS4nLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2FsayhmcmFtZSk7XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgNjogT3ZlcmxhcHBpbmcgU2VjdGlvbnMgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrT3ZlcmxhcHMoc2VjdGlvbnM6IFNjZW5lTm9kZVtdLCBmcmFtZU5hbWU6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuICBjb25zdCBzb3J0ZWQgPSBbLi4uc2VjdGlvbnNdXG4gICAgLmZpbHRlcihzID0+IHMuYWJzb2x1dGVCb3VuZGluZ0JveClcbiAgICAuc29ydCgoYSwgYikgPT4gYS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gYi5hYnNvbHV0ZUJvdW5kaW5nQm94IS55KTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNvcnRlZC5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBjb25zdCBjdXJyID0gc29ydGVkW2ldLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IG5leHQgPSBzb3J0ZWRbaSArIDFdLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IG92ZXJsYXAgPSAoY3Vyci55ICsgY3Vyci5oZWlnaHQpIC0gbmV4dC55O1xuICAgIGlmIChvdmVybGFwID4gMCkge1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgICAgY2hlY2s6ICdvdmVybGFwJyxcbiAgICAgICAgbWVzc2FnZTogYFNlY3Rpb24gXCIke3NvcnRlZFtpXS5uYW1lfVwiIG92ZXJsYXBzIHdpdGggXCIke3NvcnRlZFtpICsgMV0ubmFtZX1cIiBieSAke01hdGgucm91bmQob3ZlcmxhcCl9cHguYCxcbiAgICAgICAgc2VjdGlvbk5hbWU6IHNvcnRlZFtpXS5uYW1lLFxuICAgICAgICBub2RlSWQ6IHNvcnRlZFtpXS5pZCxcbiAgICAgICAgc3VnZ2VzdGlvbjogJ1RoZSBwbHVnaW4gd2lsbCByZWNvcmQgdGhpcyBhcyBhIG5lZ2F0aXZlIG1hcmdpbi4gVmVyaWZ5IHRoZSB2aXN1YWwgcmVzdWx0LicsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayA3OiBNaXNzaW5nIFJlc3BvbnNpdmUgRnJhbWVzIFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja1Jlc3BvbnNpdmVGcmFtZXMoZnJhbWVJZHM6IHN0cmluZ1tdKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG4gIGNvbnN0IGZyYW1lcyA9IGZyYW1lSWRzXG4gICAgLm1hcChpZCA9PiBmaWdtYS5nZXROb2RlQnlJZChpZCkpXG4gICAgLmZpbHRlcihuID0+IG4gJiYgbi50eXBlID09PSAnRlJBTUUnKSBhcyBGcmFtZU5vZGVbXTtcblxuICBjb25zdCBkZXNrdG9wRnJhbWVzID0gZnJhbWVzLmZpbHRlcihmID0+IGYud2lkdGggPiAxMDI0KTtcbiAgY29uc3QgbW9iaWxlRnJhbWVzID0gZnJhbWVzLmZpbHRlcihmID0+IGYud2lkdGggPD0gNDgwKTtcblxuICBpZiAoZGVza3RvcEZyYW1lcy5sZW5ndGggPiAwICYmIG1vYmlsZUZyYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICByZXN1bHRzLnB1c2goe1xuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgIGNoZWNrOiAncmVzcG9uc2l2ZScsXG4gICAgICBtZXNzYWdlOiBgT25seSBkZXNrdG9wIGZyYW1lcyBzZWxlY3RlZCAobm8gbW9iaWxlIGZyYW1lcykuIFJlc3BvbnNpdmUgdmFsdWVzIHdpbGwgYmUgY2FsY3VsYXRlZCwgbm90IGV4dHJhY3RlZC5gLFxuICAgICAgc3VnZ2VzdGlvbjogJ0luY2x1ZGUgbW9iaWxlICgzNzVweCkgZnJhbWVzIGZvciBleGFjdCByZXNwb25zaXZlIHZhbHVlcy4nLFxuICAgIH0pO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgOTogVGV4dCBPdmVyZmxvdyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tUZXh0T3ZlcmZsb3coZnJhbWU6IEZyYW1lTm9kZSk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnICYmIG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCAmJiBub2RlLnBhcmVudCAmJiAnYWJzb2x1dGVCb3VuZGluZ0JveCcgaW4gbm9kZS5wYXJlbnQpIHtcbiAgICAgIGNvbnN0IHRleHRCb3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICBjb25zdCBwYXJlbnRCb3VuZHMgPSAobm9kZS5wYXJlbnQgYXMgRnJhbWVOb2RlKS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgaWYgKHBhcmVudEJvdW5kcykge1xuICAgICAgICBjb25zdCBvdmVyZmxvd1JpZ2h0ID0gKHRleHRCb3VuZHMueCArIHRleHRCb3VuZHMud2lkdGgpIC0gKHBhcmVudEJvdW5kcy54ICsgcGFyZW50Qm91bmRzLndpZHRoKTtcbiAgICAgICAgY29uc3Qgb3ZlcmZsb3dCb3R0b20gPSAodGV4dEJvdW5kcy55ICsgdGV4dEJvdW5kcy5oZWlnaHQpIC0gKHBhcmVudEJvdW5kcy55ICsgcGFyZW50Qm91bmRzLmhlaWdodCk7XG4gICAgICAgIGlmIChvdmVyZmxvd1JpZ2h0ID4gNSB8fCBvdmVyZmxvd0JvdHRvbSA+IDUpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgICAgICAgIGNoZWNrOiAndGV4dC1vdmVyZmxvdycsXG4gICAgICAgICAgICBtZXNzYWdlOiBgVGV4dCBcIiR7bm9kZS5uYW1lfVwiIG92ZXJmbG93cyBpdHMgY29udGFpbmVyIGJ5ICR7TWF0aC5tYXgoTWF0aC5yb3VuZChvdmVyZmxvd1JpZ2h0KSwgTWF0aC5yb3VuZChvdmVyZmxvd0JvdHRvbSkpfXB4LmAsXG4gICAgICAgICAgICBub2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgICBub2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgc3VnZ2VzdGlvbjogJ1Jlc2l6ZSB0aGUgdGV4dCBjb250YWluZXIgb3IgcmVkdWNlIHRleHQgY29udGVudC4nLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2FsayhmcmFtZSk7XG4gIHJldHVybiByZXN1bHRzO1xufVxuIiwgIi8qKlxuICogQ29udmVydCBhIHNpbmdsZSBGaWdtYSAwLTEgZmxvYXQgY2hhbm5lbCB0byBhIDItZGlnaXQgaGV4IHN0cmluZy5cbiAqIFVzZXMgTWF0aC5yb3VuZCgpIGZvciBwcmVjaXNpb24gKE5PVCBNYXRoLmZsb29yKCkpLlxuICovXG5mdW5jdGlvbiBjaGFubmVsVG9IZXgodmFsdWU6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMjU1KS50b1N0cmluZygxNikucGFkU3RhcnQoMiwgJzAnKS50b1VwcGVyQ2FzZSgpO1xufVxuXG4vKipcbiAqIENvbnZlcnQgRmlnbWEgUkdCICgwLTEgZmxvYXQpIHRvIDYtZGlnaXQgdXBwZXJjYXNlIEhFWC5cbiAqIHsgcjogMC4wODYsIGc6IDAuMjIsIGI6IDAuOTg0IH0gXHUyMTkyIFwiIzE2MzhGQlwiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZ2JUb0hleChjb2xvcjogeyByOiBudW1iZXI7IGc6IG51bWJlcjsgYjogbnVtYmVyIH0pOiBzdHJpbmcge1xuICByZXR1cm4gYCMke2NoYW5uZWxUb0hleChjb2xvci5yKX0ke2NoYW5uZWxUb0hleChjb2xvci5nKX0ke2NoYW5uZWxUb0hleChjb2xvci5iKX1gO1xufVxuXG4vKipcbiAqIENvbnZlcnQgRmlnbWEgUkdCQSAoMC0xIGZsb2F0KSB0byBIRVguXG4gKiBSZXR1cm5zIDYtZGlnaXQgSEVYIGlmIGZ1bGx5IG9wYXF1ZSwgOC1kaWdpdCBIRVggaWYgYWxwaGEgPCAxLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmdiYVRvSGV4KGNvbG9yOiB7IHI6IG51bWJlcjsgZzogbnVtYmVyOyBiOiBudW1iZXIgfSwgb3BhY2l0eTogbnVtYmVyID0gMSk6IHN0cmluZyB7XG4gIGNvbnN0IGJhc2UgPSByZ2JUb0hleChjb2xvcik7XG4gIGlmIChvcGFjaXR5ID49IDEpIHJldHVybiBiYXNlO1xuICByZXR1cm4gYCR7YmFzZX0ke2NoYW5uZWxUb0hleChvcGFjaXR5KX1gO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIHByaW1hcnkgYmFja2dyb3VuZCBjb2xvciBmcm9tIGEgbm9kZSdzIGZpbGxzLlxuICogUmV0dXJucyA2LzgtZGlnaXQgSEVYIG9yIG51bGwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0QmFja2dyb3VuZENvbG9yKG5vZGU6IFNjZW5lTm9kZSAmIHsgZmlsbHM/OiByZWFkb25seSBQYWludFtdIH0pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCEoJ2ZpbGxzJyBpbiBub2RlKSB8fCAhbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuIG51bGw7XG5cbiAgZm9yIChjb25zdCBmaWxsIG9mIG5vZGUuZmlsbHMpIHtcbiAgICBpZiAoZmlsbC50eXBlID09PSAnU09MSUQnICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IG9wYWNpdHkgPSBmaWxsLm9wYWNpdHkgIT09IHVuZGVmaW5lZCA/IGZpbGwub3BhY2l0eSA6IDE7XG4gICAgICByZXR1cm4gcmdiYVRvSGV4KGZpbGwuY29sb3IsIG9wYWNpdHkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSB0ZXh0IGNvbG9yIGZyb20gYSBURVhUIG5vZGUncyBmaWxscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUZXh0Q29sb3Iobm9kZTogVGV4dE5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFub2RlLmZpbGxzIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZmlsbHMpKSByZXR1cm4gbnVsbDtcblxuICBmb3IgKGNvbnN0IGZpbGwgb2Ygbm9kZS5maWxscyBhcyByZWFkb25seSBQYWludFtdKSB7XG4gICAgaWYgKGZpbGwudHlwZSA9PT0gJ1NPTElEJyAmJiBmaWxsLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gcmdiVG9IZXgoZmlsbC5jb2xvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgZ3JhZGllbnQgYXMgQ1NTIHN0cmluZywgb3IgbnVsbCBpZiBub3QgYSBncmFkaWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RHcmFkaWVudChub2RlOiBTY2VuZU5vZGUgJiB7IGZpbGxzPzogcmVhZG9ubHkgUGFpbnRbXSB9KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghKCdmaWxscycgaW4gbm9kZSkgfHwgIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiBudWxsO1xuXG4gIGZvciAoY29uc3QgZmlsbCBvZiBub2RlLmZpbGxzKSB7XG4gICAgaWYgKGZpbGwudHlwZSA9PT0gJ0dSQURJRU5UX0xJTkVBUicgJiYgZmlsbC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgY29uc3Qgc3RvcHMgPSBmaWxsLmdyYWRpZW50U3RvcHNcbiAgICAgICAgLm1hcChzID0+IGAke3JnYlRvSGV4KHMuY29sb3IpfSAke01hdGgucm91bmQocy5wb3NpdGlvbiAqIDEwMCl9JWApXG4gICAgICAgIC5qb2luKCcsICcpO1xuICAgICAgcmV0dXJuIGBsaW5lYXItZ3JhZGllbnQoJHtzdG9wc30pYDtcbiAgICB9XG4gICAgaWYgKGZpbGwudHlwZSA9PT0gJ0dSQURJRU5UX1JBRElBTCcgJiYgZmlsbC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgY29uc3Qgc3RvcHMgPSBmaWxsLmdyYWRpZW50U3RvcHNcbiAgICAgICAgLm1hcChzID0+IGAke3JnYlRvSGV4KHMuY29sb3IpfSAke01hdGgucm91bmQocy5wb3NpdGlvbiAqIDEwMCl9JWApXG4gICAgICAgIC5qb2luKCcsICcpO1xuICAgICAgcmV0dXJuIGByYWRpYWwtZ3JhZGllbnQoJHtzdG9wc30pYDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBub2RlIGhhcyBhbiBJTUFHRSBmaWxsIChwaG90b2dyYXBoL2JhY2tncm91bmQpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzSW1hZ2VGaWxsKG5vZGU6IFNjZW5lTm9kZSAmIHsgZmlsbHM/OiByZWFkb25seSBQYWludFtdIH0pOiBib29sZWFuIHtcbiAgaWYgKCEoJ2ZpbGxzJyBpbiBub2RlKSB8fCAhbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gbm9kZS5maWxscy5zb21lKGYgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpO1xufVxuXG4vKipcbiAqIE1hcCBGaWdtYSBzdHJva2VBbGlnbiB0byBhIHN1aXRhYmxlIENTUyBib3JkZXItc3R5bGUuXG4gKiBGaWdtYSBzdXBwb3J0cyBzb2xpZCBzdHJva2VzIG5hdGl2ZWx5OyBkYXNoZWQgaXMgaW5mZXJyZWQgZnJvbSBkYXNoUGF0dGVybi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RCb3JkZXJTdHlsZShub2RlOiBhbnkpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCEoJ3N0cm9rZXMnIGluIG5vZGUpIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuc3Ryb2tlcykgfHwgbm9kZS5zdHJva2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGRhc2hQYXR0ZXJuID0gKG5vZGUgYXMgYW55KS5kYXNoUGF0dGVybjtcbiAgaWYgKEFycmF5LmlzQXJyYXkoZGFzaFBhdHRlcm4pICYmIGRhc2hQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAvLyAxLXVuaXQgZGFzaGVzID0gZG90dGVkLCBsYXJnZXIgPSBkYXNoZWRcbiAgICBjb25zdCBtYXggPSBNYXRoLm1heCguLi5kYXNoUGF0dGVybik7XG4gICAgcmV0dXJuIG1heCA8PSAyID8gJ2RvdHRlZCcgOiAnZGFzaGVkJztcbiAgfVxuICByZXR1cm4gJ3NvbGlkJztcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHBlci1zaWRlIGJvcmRlci13aWR0aC4gRmlnbWEncyBpbmRpdmlkdWFsU3Ryb2tlV2VpZ2h0cyAoaWYgc2V0KVxuICogcHJvdmlkZXMgcGVyLXNpZGUgd2lkdGhzOyBvdGhlcndpc2Ugc3Ryb2tlV2VpZ2h0IGlzIHVuaWZvcm0uXG4gKiBSZXR1cm5zIG51bGwgZm9yIGFueSBzaWRlIHRoYXQgaXMgMC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RCb3JkZXJXaWR0aHMobm9kZTogYW55KToge1xuICB0b3A6IG51bWJlciB8IG51bGw7IHJpZ2h0OiBudW1iZXIgfCBudWxsOyBib3R0b206IG51bWJlciB8IG51bGw7IGxlZnQ6IG51bWJlciB8IG51bGw7IHVuaWZvcm06IG51bWJlciB8IG51bGw7XG59IHtcbiAgY29uc3QgaW5kID0gKG5vZGUgYXMgYW55KS5pbmRpdmlkdWFsU3Ryb2tlV2VpZ2h0cztcbiAgaWYgKGluZCAmJiB0eXBlb2YgaW5kID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB7XG4gICAgICB0b3A6IGluZC50b3AgfHwgbnVsbCxcbiAgICAgIHJpZ2h0OiBpbmQucmlnaHQgfHwgbnVsbCxcbiAgICAgIGJvdHRvbTogaW5kLmJvdHRvbSB8fCBudWxsLFxuICAgICAgbGVmdDogaW5kLmxlZnQgfHwgbnVsbCxcbiAgICAgIHVuaWZvcm06IG51bGwsXG4gICAgfTtcbiAgfVxuICBjb25zdCB3ID0gKG5vZGUgYXMgYW55KS5zdHJva2VXZWlnaHQ7XG4gIGlmICh0eXBlb2YgdyA9PT0gJ251bWJlcicgJiYgdyA+IDApIHtcbiAgICByZXR1cm4geyB0b3A6IG51bGwsIHJpZ2h0OiBudWxsLCBib3R0b206IG51bGwsIGxlZnQ6IG51bGwsIHVuaWZvcm06IHcgfTtcbiAgfVxuICByZXR1cm4geyB0b3A6IG51bGwsIHJpZ2h0OiBudWxsLCBib3R0b206IG51bGwsIGxlZnQ6IG51bGwsIHVuaWZvcm06IG51bGwgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSBmaXJzdCB2aXNpYmxlIFNPTElEIHN0cm9rZSBjb2xvciBhcyBoZXguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0U3Ryb2tlQ29sb3Iobm9kZTogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghKCdzdHJva2VzJyBpbiBub2RlKSB8fCAhQXJyYXkuaXNBcnJheShub2RlLnN0cm9rZXMpKSByZXR1cm4gbnVsbDtcbiAgZm9yIChjb25zdCBzdHJva2Ugb2Ygbm9kZS5zdHJva2VzKSB7XG4gICAgaWYgKHN0cm9rZS50eXBlID09PSAnU09MSUQnICYmIHN0cm9rZS52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIHJnYlRvSGV4KHN0cm9rZS5jb2xvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENvbGxlY3QgYWxsIHVuaXF1ZSBjb2xvcnMgZnJvbSBhIG5vZGUgdHJlZS5cbiAqIFJldHVybnMgYSBtYXAgb2YgSEVYIFx1MjE5MiB1c2FnZSBjb3VudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RDb2xvcnMocm9vdDogU2NlbmVOb2RlKTogUmVjb3JkPHN0cmluZywgbnVtYmVyPiB7XG4gIGNvbnN0IGNvbG9yczogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgLy8gRmlsbHNcbiAgICBpZiAoJ2ZpbGxzJyBpbiBub2RlICYmIG5vZGUuZmlsbHMgJiYgQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkge1xuICAgICAgZm9yIChjb25zdCBmaWxsIG9mIG5vZGUuZmlsbHMpIHtcbiAgICAgICAgaWYgKGZpbGwudHlwZSA9PT0gJ1NPTElEJyAmJiBmaWxsLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgY29uc3QgaGV4ID0gcmdiVG9IZXgoZmlsbC5jb2xvcik7XG4gICAgICAgICAgY29sb3JzW2hleF0gPSAoY29sb3JzW2hleF0gfHwgMCkgKyAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFN0cm9rZXNcbiAgICBpZiAoJ3N0cm9rZXMnIGluIG5vZGUgJiYgbm9kZS5zdHJva2VzICYmIEFycmF5LmlzQXJyYXkobm9kZS5zdHJva2VzKSkge1xuICAgICAgZm9yIChjb25zdCBzdHJva2Ugb2Ygbm9kZS5zdHJva2VzKSB7XG4gICAgICAgIGlmIChzdHJva2UudHlwZSA9PT0gJ1NPTElEJyAmJiBzdHJva2UudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBjb25zdCBoZXggPSByZ2JUb0hleChzdHJva2UuY29sb3IpO1xuICAgICAgICAgIGNvbG9yc1toZXhdID0gKGNvbG9yc1toZXhdIHx8IDApICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZWN1cnNlXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdhbGsocm9vdCk7XG4gIHJldHVybiBjb2xvcnM7XG59XG4iLCAiLyoqXG4gKiBFeHRyYWN0IEZpZ21hIEVmZmVjdHMgKHNoYWRvd3MsIGJsdXJzKSBpbnRvIENTUy1yZWFkeSB2YWx1ZXMuXG4gKlxuICogRmlnbWEgc3VwcG9ydHMgYW4gYXJyYXkgb2YgZWZmZWN0cyBwZXIgbm9kZS4gV2UgbWFwOlxuICogICBEUk9QX1NIQURPVyAgXHUyMTkyIGJveC1zaGFkb3cgKG11bHRpcGxlIGFsbG93ZWQsIGNvbW1hLXNlcGFyYXRlZClcbiAqICAgSU5ORVJfU0hBRE9XIFx1MjE5MiBib3gtc2hhZG93IHdpdGggYGluc2V0YCBrZXl3b3JkXG4gKiAgIExBWUVSX0JMVVIgICBcdTIxOTIgZmlsdGVyOiBibHVyKE5weClcbiAqICAgQkFDS0dST1VORF9CTFVSIFx1MjE5MiBiYWNrZHJvcC1maWx0ZXI6IGJsdXIoTnB4KVxuICpcbiAqIFRFWFQgbm9kZXMgZ2V0IHRoZWlyIERST1BfU0hBRE9XIG1hcHBlZCB0byBDU1MgdGV4dC1zaGFkb3cgaW5zdGVhZCBvZlxuICogYm94LXNoYWRvdyAoRE9NIHJlbmRlcmluZzogdGV4dCBub2RlcyBkb24ndCBob25vciBib3gtc2hhZG93IG9uIHRoZVxuICogZ2x5cGhzIHRoZW1zZWx2ZXMpLlxuICovXG5cbmZ1bmN0aW9uIHJnYmFTdHJpbmcoY29sb3I6IHsgcjogbnVtYmVyOyBnOiBudW1iZXI7IGI6IG51bWJlcjsgYT86IG51bWJlciB9KTogc3RyaW5nIHtcbiAgY29uc3QgYSA9IGNvbG9yLmEgIT09IHVuZGVmaW5lZCA/IE1hdGgucm91bmQoY29sb3IuYSAqIDEwMCkgLyAxMDAgOiAxO1xuICByZXR1cm4gYHJnYmEoJHtNYXRoLnJvdW5kKGNvbG9yLnIgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGNvbG9yLmcgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGNvbG9yLmIgKiAyNTUpfSwgJHthfSlgO1xufVxuXG5mdW5jdGlvbiBzaGFkb3dUb0NzcyhlOiBEcm9wU2hhZG93RWZmZWN0IHwgSW5uZXJTaGFkb3dFZmZlY3QsIGluc2V0OiBib29sZWFuKTogc3RyaW5nIHtcbiAgY29uc3QgeCA9IE1hdGgucm91bmQoZS5vZmZzZXQueCk7XG4gIGNvbnN0IHkgPSBNYXRoLnJvdW5kKGUub2Zmc2V0LnkpO1xuICBjb25zdCBibHVyID0gTWF0aC5yb3VuZChlLnJhZGl1cyk7XG4gIGNvbnN0IHNwcmVhZCA9IE1hdGgucm91bmQoKGUgYXMgYW55KS5zcHJlYWQgfHwgMCk7XG4gIGNvbnN0IGNvbG9yID0gcmdiYVN0cmluZyhlLmNvbG9yKTtcbiAgY29uc3QgcHJlZml4ID0gaW5zZXQgPyAnaW5zZXQgJyA6ICcnO1xuICByZXR1cm4gYCR7cHJlZml4fSR7eH1weCAke3l9cHggJHtibHVyfXB4ICR7c3ByZWFkfXB4ICR7Y29sb3J9YDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeHRyYWN0ZWRFZmZlY3RzIHtcbiAgYm94U2hhZG93OiBzdHJpbmcgfCBudWxsOyAgICAgLy8gY29tbWEtc2VwYXJhdGVkIENTUyB2YWx1ZSBmb3IgbXVsdGlwbGUgc2hhZG93c1xuICB0ZXh0U2hhZG93OiBzdHJpbmcgfCBudWxsOyAgICAvLyBmb3IgVEVYVCBub2RlcyAoRFJPUF9TSEFET1cgb24gdGV4dCBiZWNvbWVzIHRleHQtc2hhZG93KVxuICBmaWx0ZXI6IHN0cmluZyB8IG51bGw7ICAgICAgICAvLyBMQVlFUl9CTFVSIFx1MjE5MiBibHVyKE5weCksIGV4dGVuZGFibGVcbiAgYmFja2Ryb3BGaWx0ZXI6IHN0cmluZyB8IG51bGw7IC8vIEJBQ0tHUk9VTkRfQkxVUiBcdTIxOTIgYmx1cihOcHgpXG59XG5cbi8qKlxuICogRXh0cmFjdCBhbGwgZWZmZWN0cyBmcm9tIGEgbm9kZSBhbmQgcmV0dXJuIENTUy1yZWFkeSB2YWx1ZXMuXG4gKiBSZXNwZWN0cyBGaWdtYSdzIHZpc2libGUgZmxhZzsgc2tpcHMgaGlkZGVuIGVmZmVjdHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0RWZmZWN0cyhcbiAgbm9kZTogeyBlZmZlY3RzPzogcmVhZG9ubHkgRWZmZWN0W107IHR5cGU/OiBzdHJpbmcgfSxcbik6IEV4dHJhY3RlZEVmZmVjdHMge1xuICBjb25zdCByZXN1bHQ6IEV4dHJhY3RlZEVmZmVjdHMgPSB7XG4gICAgYm94U2hhZG93OiBudWxsLFxuICAgIHRleHRTaGFkb3c6IG51bGwsXG4gICAgZmlsdGVyOiBudWxsLFxuICAgIGJhY2tkcm9wRmlsdGVyOiBudWxsLFxuICB9O1xuXG4gIGlmICghbm9kZS5lZmZlY3RzIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZWZmZWN0cykgfHwgbm9kZS5lZmZlY3RzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBjb25zdCBpc1RleHQgPSBub2RlLnR5cGUgPT09ICdURVhUJztcbiAgY29uc3Qgc2hhZG93U3RyaW5nczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgdGV4dFNoYWRvd1N0cmluZ3M6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGZpbHRlclBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBiYWNrZHJvcFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgZWZmZWN0IG9mIG5vZGUuZWZmZWN0cykge1xuICAgIGlmIChlZmZlY3QudmlzaWJsZSA9PT0gZmFsc2UpIGNvbnRpbnVlO1xuXG4gICAgaWYgKGVmZmVjdC50eXBlID09PSAnRFJPUF9TSEFET1cnKSB7XG4gICAgICBjb25zdCBlID0gZWZmZWN0IGFzIERyb3BTaGFkb3dFZmZlY3Q7XG4gICAgICBpZiAoaXNUZXh0KSB7XG4gICAgICAgIC8vIHRleHQtc2hhZG93IGZvcm1hdDogPHg+IDx5PiA8Ymx1cj4gPGNvbG9yPiAobm8gc3ByZWFkKVxuICAgICAgICBjb25zdCB4ID0gTWF0aC5yb3VuZChlLm9mZnNldC54KTtcbiAgICAgICAgY29uc3QgeSA9IE1hdGgucm91bmQoZS5vZmZzZXQueSk7XG4gICAgICAgIGNvbnN0IGJsdXIgPSBNYXRoLnJvdW5kKGUucmFkaXVzKTtcbiAgICAgICAgdGV4dFNoYWRvd1N0cmluZ3MucHVzaChgJHt4fXB4ICR7eX1weCAke2JsdXJ9cHggJHtyZ2JhU3RyaW5nKGUuY29sb3IpfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2hhZG93U3RyaW5ncy5wdXNoKHNoYWRvd1RvQ3NzKGUsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlZmZlY3QudHlwZSA9PT0gJ0lOTkVSX1NIQURPVycpIHtcbiAgICAgIGNvbnN0IGUgPSBlZmZlY3QgYXMgSW5uZXJTaGFkb3dFZmZlY3Q7XG4gICAgICAvLyBJTk5FUl9TSEFET1cgb24gVEVYVCBpc24ndCBhIHRoaW5nIGluIENTUyBcdTIwMTQgZmFsbCBiYWNrIHRvIGVtcHR5IGZvciB0ZXh0XG4gICAgICBpZiAoIWlzVGV4dCkgc2hhZG93U3RyaW5ncy5wdXNoKHNoYWRvd1RvQ3NzKGUsIHRydWUpKTtcbiAgICB9IGVsc2UgaWYgKGVmZmVjdC50eXBlID09PSAnTEFZRVJfQkxVUicpIHtcbiAgICAgIGNvbnN0IGUgPSBlZmZlY3QgYXMgQmx1ckVmZmVjdDtcbiAgICAgIGZpbHRlclBhcnRzLnB1c2goYGJsdXIoJHtNYXRoLnJvdW5kKGUucmFkaXVzKX1weClgKTtcbiAgICB9IGVsc2UgaWYgKGVmZmVjdC50eXBlID09PSAnQkFDS0dST1VORF9CTFVSJykge1xuICAgICAgY29uc3QgZSA9IGVmZmVjdCBhcyBCbHVyRWZmZWN0O1xuICAgICAgYmFja2Ryb3BQYXJ0cy5wdXNoKGBibHVyKCR7TWF0aC5yb3VuZChlLnJhZGl1cyl9cHgpYCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHNoYWRvd1N0cmluZ3MubGVuZ3RoID4gMCkgcmVzdWx0LmJveFNoYWRvdyA9IHNoYWRvd1N0cmluZ3Muam9pbignLCAnKTtcbiAgaWYgKHRleHRTaGFkb3dTdHJpbmdzLmxlbmd0aCA+IDApIHJlc3VsdC50ZXh0U2hhZG93ID0gdGV4dFNoYWRvd1N0cmluZ3Muam9pbignLCAnKTtcbiAgaWYgKGZpbHRlclBhcnRzLmxlbmd0aCA+IDApIHJlc3VsdC5maWx0ZXIgPSBmaWx0ZXJQYXJ0cy5qb2luKCcgJyk7XG4gIGlmIChiYWNrZHJvcFBhcnRzLmxlbmd0aCA+IDApIHJlc3VsdC5iYWNrZHJvcEZpbHRlciA9IGJhY2tkcm9wUGFydHMuam9pbignICcpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iLCAiaW1wb3J0IHsgRWxlbWVudFN0eWxlcywgVGV4dFNlZ21lbnQgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHRvQ3NzVmFsdWUgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGV4dHJhY3RUZXh0Q29sb3IsIHJnYlRvSGV4IH0gZnJvbSAnLi9jb2xvcic7XG5pbXBvcnQgeyBleHRyYWN0RWZmZWN0cyB9IGZyb20gJy4vZWZmZWN0cyc7XG5cbi8qKlxuICogRGVyaXZlIENTUyBmb250LXdlaWdodCBmcm9tIGEgRmlnbWEgZm9udCBzdHlsZSBuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9udFdlaWdodEZyb21TdHlsZShzdHlsZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgY29uc3QgcyA9IHN0eWxlLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChzLmluY2x1ZGVzKCd0aGluJykgfHwgcy5pbmNsdWRlcygnaGFpcmxpbmUnKSkgcmV0dXJuIDEwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ2V4dHJhbGlnaHQnKSB8fCBzLmluY2x1ZGVzKCd1bHRyYSBsaWdodCcpIHx8IHMuaW5jbHVkZXMoJ2V4dHJhIGxpZ2h0JykpIHJldHVybiAyMDA7XG4gIGlmIChzLmluY2x1ZGVzKCdsaWdodCcpKSByZXR1cm4gMzAwO1xuICBpZiAocy5pbmNsdWRlcygnbWVkaXVtJykpIHJldHVybiA1MDA7XG4gIGlmIChzLmluY2x1ZGVzKCdzZW1pYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ3NlbWkgYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ2RlbWkgYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ2RlbWlib2xkJykpIHJldHVybiA2MDA7XG4gIGlmIChzLmluY2x1ZGVzKCdleHRyYWJvbGQnKSB8fCBzLmluY2x1ZGVzKCdleHRyYSBib2xkJykgfHwgcy5pbmNsdWRlcygndWx0cmEgYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ3VsdHJhYm9sZCcpKSByZXR1cm4gODAwO1xuICBpZiAocy5pbmNsdWRlcygnYmxhY2snKSB8fCBzLmluY2x1ZGVzKCdoZWF2eScpKSByZXR1cm4gOTAwO1xuICBpZiAocy5pbmNsdWRlcygnYm9sZCcpKSByZXR1cm4gNzAwO1xuICByZXR1cm4gNDAwOyAvLyBSZWd1bGFyIC8gTm9ybWFsIC8gQm9va1xufVxuXG4vKipcbiAqIE1hcCBGaWdtYSB0ZXh0IGFsaWdubWVudCB0byBDU1MgdGV4dC1hbGlnbiB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gbWFwVGV4dEFsaWduKGFsaWduOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgc3dpdGNoIChhbGlnbikge1xuICAgIGNhc2UgJ0xFRlQnOiByZXR1cm4gJ2xlZnQnO1xuICAgIGNhc2UgJ0NFTlRFUic6IHJldHVybiAnY2VudGVyJztcbiAgICBjYXNlICdSSUdIVCc6IHJldHVybiAncmlnaHQnO1xuICAgIGNhc2UgJ0pVU1RJRklFRCc6IHJldHVybiAnanVzdGlmeSc7XG4gICAgZGVmYXVsdDogcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXAgRmlnbWEgdGV4dCBjYXNlIHRvIENTUyB0ZXh0LXRyYW5zZm9ybSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gbWFwVGV4dENhc2UodGV4dENhc2U6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBzd2l0Y2ggKHRleHRDYXNlKSB7XG4gICAgY2FzZSAnVVBQRVInOiByZXR1cm4gJ3VwcGVyY2FzZSc7XG4gICAgY2FzZSAnTE9XRVInOiByZXR1cm4gJ2xvd2VyY2FzZSc7XG4gICAgY2FzZSAnVElUTEUnOiByZXR1cm4gJ2NhcGl0YWxpemUnO1xuICAgIGNhc2UgJ09SSUdJTkFMJzpcbiAgICBkZWZhdWx0OiByZXR1cm4gJ25vbmUnO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdCB0eXBvZ3JhcGh5IHN0eWxlcyBmcm9tIGEgVEVYVCBub2RlLlxuICogUmV0dXJucyBDU1MtcmVhZHkgdmFsdWVzIHdpdGggdW5pdHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VHlwb2dyYXBoeShub2RlOiBUZXh0Tm9kZSk6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4ge1xuICBjb25zdCBzdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7fTtcblxuICAvLyBGb250IGZhbWlseSBcdTIwMTQgaGFuZGxlIG1peGVkIGZvbnRzICh1c2UgZmlyc3Qgc2VnbWVudClcbiAgY29uc3QgZm9udE5hbWUgPSBub2RlLmZvbnROYW1lO1xuICBpZiAoZm9udE5hbWUgIT09IGZpZ21hLm1peGVkICYmIGZvbnROYW1lKSB7XG4gICAgc3R5bGVzLmZvbnRGYW1pbHkgPSBmb250TmFtZS5mYW1pbHk7XG4gICAgc3R5bGVzLmZvbnRXZWlnaHQgPSBmb250V2VpZ2h0RnJvbVN0eWxlKGZvbnROYW1lLnN0eWxlKTtcbiAgfVxuXG4gIC8vIEZvbnQgc2l6ZVxuICBjb25zdCBmb250U2l6ZSA9IG5vZGUuZm9udFNpemU7XG4gIGlmIChmb250U2l6ZSAhPT0gZmlnbWEubWl4ZWQgJiYgdHlwZW9mIGZvbnRTaXplID09PSAnbnVtYmVyJykge1xuICAgIHN0eWxlcy5mb250U2l6ZSA9IHRvQ3NzVmFsdWUoZm9udFNpemUpO1xuICB9XG5cbiAgLy8gTGluZSBoZWlnaHRcbiAgY29uc3QgbGggPSBub2RlLmxpbmVIZWlnaHQ7XG4gIGlmIChsaCAhPT0gZmlnbWEubWl4ZWQgJiYgbGgpIHtcbiAgICBpZiAobGgudW5pdCA9PT0gJ1BJWEVMUycpIHtcbiAgICAgIHN0eWxlcy5saW5lSGVpZ2h0ID0gdG9Dc3NWYWx1ZShsaC52YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChsaC51bml0ID09PSAnUEVSQ0VOVCcpIHtcbiAgICAgIHN0eWxlcy5saW5lSGVpZ2h0ID0gYCR7TWF0aC5yb3VuZChsaC52YWx1ZSl9JWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFVVE8gXHUyMDE0IGRlcml2ZSBmcm9tIGZvbnQgc2l6ZVxuICAgICAgc3R5bGVzLmxpbmVIZWlnaHQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIExldHRlciBzcGFjaW5nXG4gIGNvbnN0IGxzID0gbm9kZS5sZXR0ZXJTcGFjaW5nO1xuICBpZiAobHMgIT09IGZpZ21hLm1peGVkICYmIGxzKSB7XG4gICAgaWYgKGxzLnVuaXQgPT09ICdQSVhFTFMnKSB7XG4gICAgICBzdHlsZXMubGV0dGVyU3BhY2luZyA9IHRvQ3NzVmFsdWUobHMudmFsdWUpO1xuICAgIH0gZWxzZSBpZiAobHMudW5pdCA9PT0gJ1BFUkNFTlQnKSB7XG4gICAgICAvLyBDb252ZXJ0IHBlcmNlbnRhZ2UgdG8gZW0gKEZpZ21hJ3MgMTAwJSA9IDFlbSlcbiAgICAgIGNvbnN0IGVtVmFsdWUgPSBNYXRoLnJvdW5kKChscy52YWx1ZSAvIDEwMCkgKiAxMDApIC8gMTAwO1xuICAgICAgc3R5bGVzLmxldHRlclNwYWNpbmcgPSBgJHtlbVZhbHVlfWVtYDtcbiAgICB9XG4gIH1cblxuICAvLyBUZXh0IHRyYW5zZm9ybVxuICBjb25zdCB0ZXh0Q2FzZSA9IG5vZGUudGV4dENhc2U7XG4gIGlmICh0ZXh0Q2FzZSAhPT0gZmlnbWEubWl4ZWQpIHtcbiAgICBzdHlsZXMudGV4dFRyYW5zZm9ybSA9IG1hcFRleHRDYXNlKHRleHRDYXNlIGFzIHN0cmluZyk7XG4gIH1cblxuICAvLyBUZXh0IGFsaWdubWVudFxuICBjb25zdCB0ZXh0QWxpZ24gPSBub2RlLnRleHRBbGlnbkhvcml6b250YWw7XG4gIGlmICh0ZXh0QWxpZ24pIHtcbiAgICBzdHlsZXMudGV4dEFsaWduID0gbWFwVGV4dEFsaWduKHRleHRBbGlnbik7XG4gIH1cblxuICAvLyBUZXh0IGRlY29yYXRpb24gKHVuZGVybGluZSAvIGxpbmUtdGhyb3VnaCAvIG5vbmUpXG4gIGNvbnN0IHRkID0gKG5vZGUgYXMgYW55KS50ZXh0RGVjb3JhdGlvbjtcbiAgaWYgKHRkICE9PSB1bmRlZmluZWQgJiYgdGQgIT09IGZpZ21hLm1peGVkKSB7XG4gICAgaWYgKHRkID09PSAnVU5ERVJMSU5FJykgc3R5bGVzLnRleHREZWNvcmF0aW9uID0gJ3VuZGVybGluZSc7XG4gICAgZWxzZSBpZiAodGQgPT09ICdTVFJJS0VUSFJPVUdIJykgc3R5bGVzLnRleHREZWNvcmF0aW9uID0gJ2xpbmUtdGhyb3VnaCc7XG4gICAgZWxzZSBzdHlsZXMudGV4dERlY29yYXRpb24gPSBudWxsO1xuICB9XG5cbiAgLy8gQ29sb3JcbiAgc3R5bGVzLmNvbG9yID0gZXh0cmFjdFRleHRDb2xvcihub2RlKTtcblxuICAvLyBUZXh0LXNoYWRvdyBmcm9tIERST1BfU0hBRE9XIGVmZmVjdHMgb24gVEVYVCBub2Rlc1xuICBjb25zdCBlZmZlY3RzID0gZXh0cmFjdEVmZmVjdHMobm9kZSk7XG4gIGlmIChlZmZlY3RzLnRleHRTaGFkb3cpIHN0eWxlcy50ZXh0U2hhZG93ID0gZWZmZWN0cy50ZXh0U2hhZG93O1xuXG4gIC8vIEZpZ21hIFRleHQgU3R5bGUgcmVmZXJlbmNlIChkZXNpZ24gdG9rZW4gZm9yIHR5cG9ncmFwaHkpXG4gIGNvbnN0IHN0eWxlTmFtZSA9IGV4dHJhY3RUZXh0U3R5bGVOYW1lKG5vZGUpO1xuICBpZiAoc3R5bGVOYW1lKSBzdHlsZXMudGV4dFN0eWxlTmFtZSA9IHN0eWxlTmFtZTtcblxuICAvLyBTdHlsZWQgdGV4dCBzZWdtZW50cyBcdTIwMTQgb25seSB3aGVuIHRoZSB0ZXh0IGhhcyBtaXhlZCBpbmxpbmUgc3R5bGVzXG4gIGNvbnN0IHNlZ21lbnRzID0gZXh0cmFjdFRleHRTZWdtZW50cyhub2RlKTtcbiAgaWYgKHNlZ21lbnRzKSBzdHlsZXMudGV4dFNlZ21lbnRzID0gc2VnbWVudHM7XG5cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSBib3VuZCBGaWdtYSBUZXh0IFN0eWxlIG5hbWUgKGUuZy4gXCJIZWFkaW5nL0gyXCIpLlxuICogUmV0dXJucyBudWxsIHdoZW4gdGhlIHRleHQgbm9kZSBoYXMgbm8gc3R5bGUgYmluZGluZywgb3IgdGhlIGJpbmRpbmcgaXMgbWl4ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VGV4dFN0eWxlTmFtZShub2RlOiBUZXh0Tm9kZSk6IHN0cmluZyB8IG51bGwge1xuICB0cnkge1xuICAgIGNvbnN0IGlkID0gKG5vZGUgYXMgYW55KS50ZXh0U3R5bGVJZDtcbiAgICBpZiAoIWlkIHx8IGlkID09PSBmaWdtYS5taXhlZCB8fCB0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBzdHlsZSA9IGZpZ21hLmdldFN0eWxlQnlJZChpZCk7XG4gICAgcmV0dXJuIHN0eWxlPy5uYW1lIHx8IG51bGw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdCBzdHlsZWQgdGV4dCBzZWdtZW50cyBzbyBpbmxpbmUgZm9ybWF0dGluZyAoYm9sZCB3b3JkLCBjb2xvcmVkIHNwYW4sXG4gKiB1bmRlcmxpbmVkIGxpbmsgaW5zaWRlIGEgcGFyYWdyYXBoKSBzdXJ2aXZlcyB0aGUgZXhwb3J0LiBSZXR1cm5zIG51bGwgd2hlblxuICogdGhlIHRleHQgaGFzIG5vIG1peGVkIHN0eWxlcyBcdTIwMTQgaW4gdGhhdCBjYXNlIHRoZSBlbGVtZW50LWxldmVsIHR5cG9ncmFwaHlcbiAqIGFscmVhZHkgZGVzY3JpYmVzIHRoZSB3aG9sZSB0ZXh0IHVuaWZvcm1seS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUZXh0U2VnbWVudHMobm9kZTogVGV4dE5vZGUpOiBUZXh0U2VnbWVudFtdIHwgbnVsbCB7XG4gIGlmICghbm9kZS5jaGFyYWN0ZXJzKSByZXR1cm4gbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCBnZXRTZWdtZW50cyA9IChub2RlIGFzIGFueSkuZ2V0U3R5bGVkVGV4dFNlZ21lbnRzO1xuICAgIGlmICh0eXBlb2YgZ2V0U2VnbWVudHMgIT09ICdmdW5jdGlvbicpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IHJhdyA9IGdldFNlZ21lbnRzLmNhbGwobm9kZSwgWydmb250TmFtZScsICdmb250U2l6ZScsICdmaWxscycsICd0ZXh0RGVjb3JhdGlvbiddKTtcbiAgICBpZiAoIXJhdyB8fCAhQXJyYXkuaXNBcnJheShyYXcpIHx8IHJhdy5sZW5ndGggPD0gMSkgcmV0dXJuIG51bGw7XG5cbiAgICBjb25zdCBzZWdtZW50czogVGV4dFNlZ21lbnRbXSA9IHJhdy5tYXAoKHM6IGFueSkgPT4ge1xuICAgICAgY29uc3Qgc2VnOiBUZXh0U2VnbWVudCA9IHsgdGV4dDogcy5jaGFyYWN0ZXJzIHx8ICcnIH07XG4gICAgICBpZiAocy5mb250TmFtZSAmJiB0eXBlb2Ygcy5mb250TmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgc2VnLmZvbnRGYW1pbHkgPSBzLmZvbnROYW1lLmZhbWlseTtcbiAgICAgICAgc2VnLmZvbnRXZWlnaHQgPSBmb250V2VpZ2h0RnJvbVN0eWxlKHMuZm9udE5hbWUuc3R5bGUpO1xuICAgICAgICBpZiAocy5mb250TmFtZS5zdHlsZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdpdGFsaWMnKSkgc2VnLml0YWxpYyA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHMuZm9udFNpemUgPT09ICdudW1iZXInKSBzZWcuZm9udFNpemUgPSBzLmZvbnRTaXplO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocy5maWxscykpIHtcbiAgICAgICAgZm9yIChjb25zdCBmIG9mIHMuZmlsbHMpIHtcbiAgICAgICAgICBpZiAoZi50eXBlID09PSAnU09MSUQnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHNlZy5jb2xvciA9IHJnYlRvSGV4KGYuY29sb3IpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocy50ZXh0RGVjb3JhdGlvbiA9PT0gJ1VOREVSTElORScpIHNlZy50ZXh0RGVjb3JhdGlvbiA9ICd1bmRlcmxpbmUnO1xuICAgICAgZWxzZSBpZiAocy50ZXh0RGVjb3JhdGlvbiA9PT0gJ1NUUklLRVRIUk9VR0gnKSBzZWcudGV4dERlY29yYXRpb24gPSAnbGluZS10aHJvdWdoJztcbiAgICAgIHJldHVybiBzZWc7XG4gICAgfSk7XG5cbiAgICAvLyBJZiBldmVyeSBzZWdtZW50J3Mgc3R5bGluZyBpcyBpZGVudGljYWwsIHRoZSBzZWdtZW50YXRpb24gYWRkcyBub3RoaW5nLlxuICAgIGNvbnN0IGZpcnN0ID0gc2VnbWVudHNbMF07XG4gICAgY29uc3QgYWxsU2FtZSA9IHNlZ21lbnRzLmV2ZXJ5KHMgPT5cbiAgICAgIHMuZm9udEZhbWlseSA9PT0gZmlyc3QuZm9udEZhbWlseSAmJlxuICAgICAgcy5mb250V2VpZ2h0ID09PSBmaXJzdC5mb250V2VpZ2h0ICYmXG4gICAgICBzLmZvbnRTaXplID09PSBmaXJzdC5mb250U2l6ZSAmJlxuICAgICAgcy5jb2xvciA9PT0gZmlyc3QuY29sb3IgJiZcbiAgICAgIHMuaXRhbGljID09PSBmaXJzdC5pdGFsaWMgJiZcbiAgICAgIHMudGV4dERlY29yYXRpb24gPT09IGZpcnN0LnRleHREZWNvcmF0aW9uXG4gICAgKTtcbiAgICByZXR1cm4gYWxsU2FtZSA/IG51bGwgOiBzZWdtZW50cztcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBDb2xsZWN0IGFsbCB1bmlxdWUgZm9udCB1c2FnZSBkYXRhIGZyb20gYSBub2RlIHRyZWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0Rm9udHMocm9vdDogU2NlbmVOb2RlKTogUmVjb3JkPHN0cmluZywgeyBzdHlsZXM6IFNldDxzdHJpbmc+OyBzaXplczogU2V0PG51bWJlcj47IGNvdW50OiBudW1iZXIgfT4ge1xuICBjb25zdCBmb250czogUmVjb3JkPHN0cmluZywgeyBzdHlsZXM6IFNldDxzdHJpbmc+OyBzaXplczogU2V0PG51bWJlcj47IGNvdW50OiBudW1iZXIgfT4gPSB7fTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgZm9udE5hbWUgPSBub2RlLmZvbnROYW1lO1xuICAgICAgaWYgKGZvbnROYW1lICE9PSBmaWdtYS5taXhlZCAmJiBmb250TmFtZSkge1xuICAgICAgICBjb25zdCBmYW1pbHkgPSBmb250TmFtZS5mYW1pbHk7XG4gICAgICAgIGlmICghZm9udHNbZmFtaWx5XSkge1xuICAgICAgICAgIGZvbnRzW2ZhbWlseV0gPSB7IHN0eWxlczogbmV3IFNldCgpLCBzaXplczogbmV3IFNldCgpLCBjb3VudDogMCB9O1xuICAgICAgICB9XG4gICAgICAgIGZvbnRzW2ZhbWlseV0uc3R5bGVzLmFkZChmb250TmFtZS5zdHlsZSk7XG4gICAgICAgIGZvbnRzW2ZhbWlseV0uY291bnQrKztcblxuICAgICAgICBjb25zdCBmb250U2l6ZSA9IG5vZGUuZm9udFNpemU7XG4gICAgICAgIGlmIChmb250U2l6ZSAhPT0gZmlnbWEubWl4ZWQgJiYgdHlwZW9mIGZvbnRTaXplID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGZvbnRzW2ZhbWlseV0uc2l6ZXMuYWRkKGZvbnRTaXplKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2Fsayhyb290KTtcbiAgcmV0dXJuIGZvbnRzO1xufVxuXG4vKipcbiAqIENvdW50IFRFWFQgbm9kZXMgaW4gYSBzdWJ0cmVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY291bnRUZXh0Tm9kZXMocm9vdDogU2NlbmVOb2RlKTogbnVtYmVyIHtcbiAgbGV0IGNvdW50ID0gMDtcbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIGNvdW50Kys7XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKHJvb3QpO1xuICByZXR1cm4gY291bnQ7XG59XG4iLCAiaW1wb3J0IHsgU2VjdGlvblN0eWxlcyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgdG9Dc3NWYWx1ZSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIEV4dHJhY3Qgc3BhY2luZyBmcm9tIGFuIGF1dG8tbGF5b3V0IGZyYW1lLlxuICogVGhlc2UgdmFsdWVzIG1hcCAxOjEgdG8gQ1NTIFx1MjAxNCBoaWdoIGNvbmZpZGVuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0QXV0b0xheW91dFNwYWNpbmcobm9kZTogRnJhbWVOb2RlKToge1xuICBzcGFjaW5nU291cmNlOiAnYXV0by1sYXlvdXQnO1xuICBzZWN0aW9uU3R5bGVzOiBQYXJ0aWFsPFNlY3Rpb25TdHlsZXM+O1xuICBpdGVtU3BhY2luZzogc3RyaW5nIHwgbnVsbDtcbn0ge1xuICByZXR1cm4ge1xuICAgIHNwYWNpbmdTb3VyY2U6ICdhdXRvLWxheW91dCcsXG4gICAgc2VjdGlvblN0eWxlczoge1xuICAgICAgcGFkZGluZ1RvcDogdG9Dc3NWYWx1ZShub2RlLnBhZGRpbmdUb3ApLFxuICAgICAgcGFkZGluZ0JvdHRvbTogdG9Dc3NWYWx1ZShub2RlLnBhZGRpbmdCb3R0b20pLFxuICAgICAgcGFkZGluZ0xlZnQ6IHRvQ3NzVmFsdWUobm9kZS5wYWRkaW5nTGVmdCksXG4gICAgICBwYWRkaW5nUmlnaHQ6IHRvQ3NzVmFsdWUobm9kZS5wYWRkaW5nUmlnaHQpLFxuICAgIH0sXG4gICAgaXRlbVNwYWNpbmc6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCBzcGFjaW5nIGZyb20gYW4gYWJzb2x1dGVseS1wb3NpdGlvbmVkIGZyYW1lIGJ5IGNvbXB1dGluZ1xuICogZnJvbSBjaGlsZHJlbidzIGJvdW5kaW5nIGJveGVzLiBUaGVzZSB2YWx1ZXMgYXJlIGFwcHJveGltYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEFic29sdXRlU3BhY2luZyhub2RlOiBGcmFtZU5vZGUpOiB7XG4gIHNwYWNpbmdTb3VyY2U6ICdhYnNvbHV0ZS1jb29yZGluYXRlcyc7XG4gIHNlY3Rpb25TdHlsZXM6IFBhcnRpYWw8U2VjdGlvblN0eWxlcz47XG4gIGl0ZW1TcGFjaW5nOiBzdHJpbmcgfCBudWxsO1xufSB7XG4gIGNvbnN0IHBhcmVudEJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgaWYgKCFwYXJlbnRCb3VuZHMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3BhY2luZ1NvdXJjZTogJ2Fic29sdXRlLWNvb3JkaW5hdGVzJyxcbiAgICAgIHNlY3Rpb25TdHlsZXM6IHtcbiAgICAgICAgcGFkZGluZ1RvcDogbnVsbCxcbiAgICAgICAgcGFkZGluZ0JvdHRvbTogbnVsbCxcbiAgICAgICAgcGFkZGluZ0xlZnQ6IG51bGwsXG4gICAgICAgIHBhZGRpbmdSaWdodDogbnVsbCxcbiAgICAgIH0sXG4gICAgICBpdGVtU3BhY2luZzogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuXG4gICAgLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UgJiYgYy5hYnNvbHV0ZUJvdW5kaW5nQm94KVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3BhY2luZ1NvdXJjZTogJ2Fic29sdXRlLWNvb3JkaW5hdGVzJyxcbiAgICAgIHNlY3Rpb25TdHlsZXM6IHtcbiAgICAgICAgcGFkZGluZ1RvcDogbnVsbCxcbiAgICAgICAgcGFkZGluZ0JvdHRvbTogbnVsbCxcbiAgICAgICAgcGFkZGluZ0xlZnQ6IG51bGwsXG4gICAgICAgIHBhZGRpbmdSaWdodDogbnVsbCxcbiAgICAgIH0sXG4gICAgICBpdGVtU3BhY2luZzogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgZmlyc3RDaGlsZCA9IGNoaWxkcmVuWzBdLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICBjb25zdCBsYXN0Q2hpbGQgPSBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXS5hYnNvbHV0ZUJvdW5kaW5nQm94ITtcblxuICBjb25zdCBwYWRkaW5nVG9wID0gZmlyc3RDaGlsZC55IC0gcGFyZW50Qm91bmRzLnk7XG4gIGNvbnN0IHBhZGRpbmdCb3R0b20gPSAocGFyZW50Qm91bmRzLnkgKyBwYXJlbnRCb3VuZHMuaGVpZ2h0KSAtIChsYXN0Q2hpbGQueSArIGxhc3RDaGlsZC5oZWlnaHQpO1xuXG4gIC8vIENvbXB1dGUgbGVmdCBwYWRkaW5nIGZyb20gdGhlIGxlZnRtb3N0IGNoaWxkXG4gIGNvbnN0IGxlZnRNb3N0ID0gTWF0aC5taW4oLi4uY2hpbGRyZW4ubWFwKGMgPT4gYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS54KSk7XG4gIGNvbnN0IHBhZGRpbmdMZWZ0ID0gbGVmdE1vc3QgLSBwYXJlbnRCb3VuZHMueDtcblxuICAvLyBDb21wdXRlIHJpZ2h0IHBhZGRpbmcgZnJvbSB0aGUgcmlnaHRtb3N0IGNoaWxkXG4gIGNvbnN0IHJpZ2h0TW9zdCA9IE1hdGgubWF4KC4uLmNoaWxkcmVuLm1hcChjID0+IGMuYWJzb2x1dGVCb3VuZGluZ0JveCEueCArIGMuYWJzb2x1dGVCb3VuZGluZ0JveCEud2lkdGgpKTtcbiAgY29uc3QgcGFkZGluZ1JpZ2h0ID0gKHBhcmVudEJvdW5kcy54ICsgcGFyZW50Qm91bmRzLndpZHRoKSAtIHJpZ2h0TW9zdDtcblxuICAvLyBFc3RpbWF0ZSB2ZXJ0aWNhbCBnYXAgZnJvbSBjb25zZWN1dGl2ZSBjaGlsZHJlblxuICBsZXQgdG90YWxHYXAgPSAwO1xuICBsZXQgZ2FwQ291bnQgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGNvbnN0IGN1cnJCb3R0b20gPSBjaGlsZHJlbltpXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55ICsgY2hpbGRyZW5baV0uYWJzb2x1dGVCb3VuZGluZ0JveCEuaGVpZ2h0O1xuICAgIGNvbnN0IG5leHRUb3AgPSBjaGlsZHJlbltpICsgMV0uYWJzb2x1dGVCb3VuZGluZ0JveCEueTtcbiAgICBjb25zdCBnYXAgPSBuZXh0VG9wIC0gY3VyckJvdHRvbTtcbiAgICBpZiAoZ2FwID4gMCkge1xuICAgICAgdG90YWxHYXAgKz0gZ2FwO1xuICAgICAgZ2FwQ291bnQrKztcbiAgICB9XG4gIH1cbiAgY29uc3QgYXZnR2FwID0gZ2FwQ291bnQgPiAwID8gTWF0aC5yb3VuZCh0b3RhbEdhcCAvIGdhcENvdW50KSA6IDA7XG5cbiAgcmV0dXJuIHtcbiAgICBzcGFjaW5nU291cmNlOiAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnLFxuICAgIHNlY3Rpb25TdHlsZXM6IHtcbiAgICAgIHBhZGRpbmdUb3A6IHRvQ3NzVmFsdWUoTWF0aC5tYXgoMCwgTWF0aC5yb3VuZChwYWRkaW5nVG9wKSkpLFxuICAgICAgcGFkZGluZ0JvdHRvbTogdG9Dc3NWYWx1ZShNYXRoLm1heCgwLCBNYXRoLnJvdW5kKHBhZGRpbmdCb3R0b20pKSksXG4gICAgICBwYWRkaW5nTGVmdDogdG9Dc3NWYWx1ZShNYXRoLm1heCgwLCBNYXRoLnJvdW5kKHBhZGRpbmdMZWZ0KSkpLFxuICAgICAgcGFkZGluZ1JpZ2h0OiB0b0Nzc1ZhbHVlKE1hdGgubWF4KDAsIE1hdGgucm91bmQocGFkZGluZ1JpZ2h0KSkpLFxuICAgIH0sXG4gICAgaXRlbVNwYWNpbmc6IGF2Z0dhcCA+IDAgPyB0b0Nzc1ZhbHVlKGF2Z0dhcCkgOiBudWxsLFxuICB9O1xufVxuXG4vKipcbiAqIENvbGxlY3QgYWxsIHNwYWNpbmcgdmFsdWVzIHVzZWQgaW4gYSBub2RlIHRyZWUuXG4gKiBSZXR1cm5zIHNvcnRlZCBhcnJheSBvZiB7IHZhbHVlLCBjb3VudCB9LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFNwYWNpbmcocm9vdDogU2NlbmVOb2RlKTogeyB2YWx1ZTogbnVtYmVyOyBjb3VudDogbnVtYmVyIH1bXSB7XG4gIGNvbnN0IHNwYWNpbmdNYXA6IFJlY29yZDxudW1iZXIsIG51bWJlcj4gPSB7fTtcblxuICBmdW5jdGlvbiBhZGRWYWx1ZSh2OiBudW1iZXIpIHtcbiAgICBpZiAodiA+IDAgJiYgdiA8IDEwMDApIHtcbiAgICAgIGNvbnN0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKHYpO1xuICAgICAgc3BhY2luZ01hcFtyb3VuZGVkXSA9IChzcGFjaW5nTWFwW3JvdW5kZWRdIHx8IDApICsgMTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBpZiAoZnJhbWUubGF5b3V0TW9kZSAmJiBmcmFtZS5sYXlvdXRNb2RlICE9PSAnTk9ORScpIHtcbiAgICAgICAgYWRkVmFsdWUoZnJhbWUucGFkZGluZ1RvcCk7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLnBhZGRpbmdCb3R0b20pO1xuICAgICAgICBhZGRWYWx1ZShmcmFtZS5wYWRkaW5nTGVmdCk7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLnBhZGRpbmdSaWdodCk7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLml0ZW1TcGFjaW5nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdhbGsocm9vdCk7XG5cbiAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHNwYWNpbmdNYXApXG4gICAgLm1hcCgoW3ZhbHVlLCBjb3VudF0pID0+ICh7IHZhbHVlOiBOdW1iZXIodmFsdWUpLCBjb3VudCB9KSlcbiAgICAuc29ydCgoYSwgYikgPT4gYS52YWx1ZSAtIGIudmFsdWUpO1xufVxuIiwgImltcG9ydCB7IEdyaWRTcGVjIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyB0b0Nzc1ZhbHVlIH0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogRGV0ZWN0IHRoZSBncmlkL2xheW91dCBzdHJ1Y3R1cmUgb2YgYSBmcmFtZSBhbmQgcmV0dXJuIGEgR3JpZFNwZWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RHcmlkKG5vZGU6IEZyYW1lTm9kZSk6IEdyaWRTcGVjIHtcbiAgLy8gQXV0by1sYXlvdXQgZnJhbWUgXHUyMTkyIGZsZXggb3IgZ3JpZFxuICBpZiAobm9kZS5sYXlvdXRNb2RlICYmIG5vZGUubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgY29uc3QgaXNXcmFwcGluZyA9ICdsYXlvdXRXcmFwJyBpbiBub2RlICYmIChub2RlIGFzIGFueSkubGF5b3V0V3JhcCA9PT0gJ1dSQVAnO1xuXG4gICAgaWYgKGlzV3JhcHBpbmcpIHtcbiAgICAgIC8vIFdyYXBwaW5nIGF1dG8tbGF5b3V0ID0gZmxleC13cmFwIChncmlkLWxpa2UpXG4gICAgICBjb25zdCBjb2x1bW5zID0gZXN0aW1hdGVDb2x1bW5zRnJvbUNoaWxkcmVuKG5vZGUpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0TW9kZTogJ2ZsZXgnLFxuICAgICAgICBjb2x1bW5zLFxuICAgICAgICBnYXA6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gICAgICAgIHJvd0dhcDogJ2NvdW50ZXJBeGlzU3BhY2luZycgaW4gbm9kZSA/IHRvQ3NzVmFsdWUoKG5vZGUgYXMgYW55KS5jb3VudGVyQXhpc1NwYWNpbmcpIDogbnVsbCxcbiAgICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgICBpdGVtTWluV2lkdGg6IGVzdGltYXRlSXRlbU1pbldpZHRoKG5vZGUsIGNvbHVtbnMpLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBOb24td3JhcHBpbmcgYXV0by1sYXlvdXRcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSBub2RlLmxheW91dE1vZGUgPT09ICdIT1JJWk9OVEFMJztcblxuICAgIGlmIChpc0hvcml6b250YWwpIHtcbiAgICAgIC8vIEhvcml6b250YWwgbGF5b3V0IFx1MjAxNCBjaGlsZHJlbiBhcmUgY29sdW1uc1xuICAgICAgY29uc3QgY29sdW1ucyA9IG5vZGUuY2hpbGRyZW4uZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSkubGVuZ3RoO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0TW9kZTogJ2ZsZXgnLFxuICAgICAgICBjb2x1bW5zLFxuICAgICAgICBnYXA6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gICAgICAgIHJvd0dhcDogbnVsbCxcbiAgICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgICBpdGVtTWluV2lkdGg6IG51bGwsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIFZlcnRpY2FsIGxheW91dCBcdTIwMTQgc2luZ2xlIGNvbHVtbiwgY2hpbGRyZW4gYXJlIHJvd3NcbiAgICAvLyBCdXQgY2hlY2sgaWYgYW55IGRpcmVjdCBjaGlsZCBpcyBhIGhvcml6b250YWwgYXV0by1sYXlvdXQgKG5lc3RlZCBncmlkKVxuICAgIGNvbnN0IGhvcml6b250YWxDaGlsZCA9IG5vZGUuY2hpbGRyZW4uZmluZChjID0+XG4gICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnKSAmJlxuICAgICAgKGMgYXMgRnJhbWVOb2RlKS5sYXlvdXRNb2RlID09PSAnSE9SSVpPTlRBTCdcbiAgICApIGFzIEZyYW1lTm9kZSB8IHVuZGVmaW5lZDtcblxuICAgIGlmIChob3Jpem9udGFsQ2hpbGQpIHtcbiAgICAgIGNvbnN0IGlubmVyQ29sdW1ucyA9IGhvcml6b250YWxDaGlsZC5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlKS5sZW5ndGg7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYXlvdXRNb2RlOiAnZmxleCcsXG4gICAgICAgIGNvbHVtbnM6IGlubmVyQ29sdW1ucyxcbiAgICAgICAgZ2FwOiB0b0Nzc1ZhbHVlKGhvcml6b250YWxDaGlsZC5pdGVtU3BhY2luZyksXG4gICAgICAgIHJvd0dhcDogdG9Dc3NWYWx1ZShub2RlLml0ZW1TcGFjaW5nKSxcbiAgICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgICBpdGVtTWluV2lkdGg6IGVzdGltYXRlSXRlbU1pbldpZHRoKGhvcml6b250YWxDaGlsZCwgaW5uZXJDb2x1bW5zKSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxheW91dE1vZGU6ICdmbGV4JyxcbiAgICAgIGNvbHVtbnM6IDEsXG4gICAgICBnYXA6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gICAgICByb3dHYXA6IG51bGwsXG4gICAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgICBpdGVtTWluV2lkdGg6IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIC8vIE5vIGF1dG8tbGF5b3V0IFx1MjE5MiBhYnNvbHV0ZSBwb3NpdGlvbmluZ1xuICBjb25zdCBjb2x1bW5zID0gZXN0aW1hdGVDb2x1bW5zRnJvbUFic29sdXRlQ2hpbGRyZW4obm9kZSk7XG4gIHJldHVybiB7XG4gICAgbGF5b3V0TW9kZTogJ2Fic29sdXRlJyxcbiAgICBjb2x1bW5zLFxuICAgIGdhcDogZXN0aW1hdGVHYXBGcm9tQWJzb2x1dGVDaGlsZHJlbihub2RlKSxcbiAgICByb3dHYXA6IG51bGwsXG4gICAgY29sdW1uR2FwOiBudWxsLFxuICAgIGl0ZW1NaW5XaWR0aDogbnVsbCxcbiAgfTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBjb2x1bW4gY291bnQgZnJvbSB3cmFwcGluZyBhdXRvLWxheW91dCBjaGlsZHJlbi5cbiAqIENvdW50cyBob3cgbWFueSBjaGlsZHJlbiBmaXQgaW4gdGhlIGZpcnN0IFwicm93XCIgKHNpbWlsYXIgWSBwb3NpdGlvbikuXG4gKi9cbmZ1bmN0aW9uIGVzdGltYXRlQ29sdW1uc0Zyb21DaGlsZHJlbihub2RlOiBGcmFtZU5vZGUpOiBudW1iZXIge1xuICBjb25zdCB2aXNpYmxlID0gbm9kZS5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlICYmIGMuYWJzb2x1dGVCb3VuZGluZ0JveCk7XG4gIGlmICh2aXNpYmxlLmxlbmd0aCA8PSAxKSByZXR1cm4gMTtcblxuICBjb25zdCBmaXJzdFkgPSB2aXNpYmxlWzBdLmFic29sdXRlQm91bmRpbmdCb3ghLnk7XG4gIGNvbnN0IHRvbGVyYW5jZSA9IDU7IC8vIHB4XG4gIGxldCBjb2x1bW5zSW5GaXJzdFJvdyA9IDA7XG5cbiAgZm9yIChjb25zdCBjaGlsZCBvZiB2aXNpYmxlKSB7XG4gICAgaWYgKE1hdGguYWJzKGNoaWxkLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBmaXJzdFkpIDw9IHRvbGVyYW5jZSkge1xuICAgICAgY29sdW1uc0luRmlyc3RSb3crKztcbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE1hdGgubWF4KDEsIGNvbHVtbnNJbkZpcnN0Um93KTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBjb2x1bW4gY291bnQgZnJvbSBhYnNvbHV0ZWx5LXBvc2l0aW9uZWQgY2hpbGRyZW4uXG4gKiBHcm91cHMgY2hpbGRyZW4gYnkgWSBwb3NpdGlvbiAoc2FtZSByb3cgPSBzYW1lIFkgXHUwMEIxIHRvbGVyYW5jZSkuXG4gKi9cbmZ1bmN0aW9uIGVzdGltYXRlQ29sdW1uc0Zyb21BYnNvbHV0ZUNoaWxkcmVuKG5vZGU6IEZyYW1lTm9kZSk6IG51bWJlciB7XG4gIGNvbnN0IHZpc2libGUgPSBub2RlLmNoaWxkcmVuXG4gICAgLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UgJiYgYy5hYnNvbHV0ZUJvdW5kaW5nQm94KVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIGlmICh2aXNpYmxlLmxlbmd0aCA8PSAxKSByZXR1cm4gMTtcblxuICBjb25zdCBmaXJzdFkgPSB2aXNpYmxlWzBdLmFic29sdXRlQm91bmRpbmdCb3ghLnk7XG4gIGNvbnN0IHRvbGVyYW5jZSA9IDEwO1xuICBsZXQgY291bnQgPSAwO1xuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgdmlzaWJsZSkge1xuICAgIGlmIChNYXRoLmFicyhjaGlsZC5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gZmlyc3RZKSA8PSB0b2xlcmFuY2UpIHtcbiAgICAgIGNvdW50Kys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBNYXRoLm1heCgxLCBjb3VudCk7XG59XG5cbi8qKlxuICogRXN0aW1hdGUgZ2FwIGJldHdlZW4gYWJzb2x1dGVseS1wb3NpdGlvbmVkIGNoaWxkcmVuIG9uIHRoZSBzYW1lIHJvdy5cbiAqL1xuZnVuY3Rpb24gZXN0aW1hdGVHYXBGcm9tQWJzb2x1dGVDaGlsZHJlbihub2RlOiBGcmFtZU5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgdmlzaWJsZSA9IG5vZGUuY2hpbGRyZW5cbiAgICAuZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSAmJiBjLmFic29sdXRlQm91bmRpbmdCb3gpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueCAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueCk7XG5cbiAgaWYgKHZpc2libGUubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG5cbiAgLy8gVXNlIHRoZSBmaXJzdCByb3cgb2YgY2hpbGRyZW5cbiAgY29uc3QgZmlyc3RZID0gdmlzaWJsZVswXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55O1xuICBjb25zdCB0b2xlcmFuY2UgPSAxMDtcbiAgY29uc3QgZmlyc3RSb3cgPSB2aXNpYmxlLmZpbHRlcihjID0+XG4gICAgTWF0aC5hYnMoYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gZmlyc3RZKSA8PSB0b2xlcmFuY2VcbiAgKTtcblxuICBpZiAoZmlyc3RSb3cubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG5cbiAgbGV0IHRvdGFsR2FwID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdFJvdy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBjb25zdCByaWdodEVkZ2UgPSBmaXJzdFJvd1tpXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS54ICsgZmlyc3RSb3dbaV0uYWJzb2x1dGVCb3VuZGluZ0JveCEud2lkdGg7XG4gICAgY29uc3QgbmV4dExlZnQgPSBmaXJzdFJvd1tpICsgMV0uYWJzb2x1dGVCb3VuZGluZ0JveCEueDtcbiAgICB0b3RhbEdhcCArPSBuZXh0TGVmdCAtIHJpZ2h0RWRnZTtcbiAgfVxuXG4gIGNvbnN0IGF2Z0dhcCA9IE1hdGgucm91bmQodG90YWxHYXAgLyAoZmlyc3RSb3cubGVuZ3RoIC0gMSkpO1xuICByZXR1cm4gYXZnR2FwID4gMCA/IHRvQ3NzVmFsdWUoYXZnR2FwKSA6IG51bGw7XG59XG5cbi8qKlxuICogRXN0aW1hdGUgbWluaW11bSBpdGVtIHdpZHRoIGZyb20gYSBob3Jpem9udGFsIGxheW91dCdzIGNoaWxkcmVuLlxuICovXG5mdW5jdGlvbiBlc3RpbWF0ZUl0ZW1NaW5XaWR0aChub2RlOiBGcmFtZU5vZGUsIGNvbHVtbnM6IG51bWJlcik6IHN0cmluZyB8IG51bGwge1xuICBpZiAoY29sdW1ucyA8PSAxKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdmlzaWJsZSA9IG5vZGUuY2hpbGRyZW4uZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSAmJiBjLmFic29sdXRlQm91bmRpbmdCb3gpO1xuICBpZiAodmlzaWJsZS5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHdpZHRocyA9IHZpc2libGUubWFwKGMgPT4gYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS53aWR0aCk7XG4gIGNvbnN0IG1pbldpZHRoID0gTWF0aC5taW4oLi4ud2lkdGhzKTtcbiAgcmV0dXJuIHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChtaW5XaWR0aCkpO1xufVxuIiwgImltcG9ydCB7IEludGVyYWN0aW9uU3BlYyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgcmdiVG9IZXgsIGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3IgfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IHRvQ3NzVmFsdWUgfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBNYXAgRmlnbWEgdHJpZ2dlciB0eXBlIHRvIG91ciBzaW1wbGlmaWVkIHRyaWdnZXIgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBtYXBUcmlnZ2VyKHRyaWdnZXJUeXBlOiBzdHJpbmcpOiBJbnRlcmFjdGlvblNwZWNbJ3RyaWdnZXInXSB8IG51bGwge1xuICBzd2l0Y2ggKHRyaWdnZXJUeXBlKSB7XG4gICAgY2FzZSAnT05fSE9WRVInOiByZXR1cm4gJ2hvdmVyJztcbiAgICBjYXNlICdPTl9DTElDSyc6IHJldHVybiAnY2xpY2snO1xuICAgIGNhc2UgJ09OX1BSRVNTJzogcmV0dXJuICdwcmVzcyc7XG4gICAgY2FzZSAnTU9VU0VfRU5URVInOiByZXR1cm4gJ21vdXNlLWVudGVyJztcbiAgICBjYXNlICdNT1VTRV9MRUFWRSc6IHJldHVybiAnbW91c2UtbGVhdmUnO1xuICAgIGRlZmF1bHQ6IHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogTWFwIEZpZ21hIGVhc2luZyB0eXBlIHRvIENTUyB0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gbWFwRWFzaW5nKGVhc2luZzogYW55KTogc3RyaW5nIHtcbiAgaWYgKCFlYXNpbmcpIHJldHVybiAnZWFzZSc7XG4gIHN3aXRjaCAoZWFzaW5nLnR5cGUpIHtcbiAgICBjYXNlICdFQVNFX0lOJzogcmV0dXJuICdlYXNlLWluJztcbiAgICBjYXNlICdFQVNFX09VVCc6IHJldHVybiAnZWFzZS1vdXQnO1xuICAgIGNhc2UgJ0VBU0VfSU5fQU5EX09VVCc6IHJldHVybiAnZWFzZS1pbi1vdXQnO1xuICAgIGNhc2UgJ0xJTkVBUic6IHJldHVybiAnbGluZWFyJztcbiAgICBjYXNlICdDVVNUT01fQ1VCSUNfQkVaSUVSJzoge1xuICAgICAgY29uc3QgYiA9IGVhc2luZy5lYXNpbmdGdW5jdGlvbkN1YmljQmV6aWVyO1xuICAgICAgaWYgKGIpIHJldHVybiBgY3ViaWMtYmV6aWVyKCR7Yi54MX0sICR7Yi55MX0sICR7Yi54Mn0sICR7Yi55Mn0pYDtcbiAgICAgIHJldHVybiAnZWFzZSc7XG4gICAgfVxuICAgIGRlZmF1bHQ6IHJldHVybiAnZWFzZSc7XG4gIH1cbn1cblxuLyoqXG4gKiBEaWZmIHRoZSB2aXN1YWwgcHJvcGVydGllcyBiZXR3ZWVuIGEgc291cmNlIG5vZGUgYW5kIGEgZGVzdGluYXRpb24gbm9kZS5cbiAqIFJldHVybnMgYSByZWNvcmQgb2YgQ1NTIHByb3BlcnR5IGNoYW5nZXMuXG4gKi9cbmZ1bmN0aW9uIGRpZmZOb2RlU3R5bGVzKFxuICBzb3VyY2U6IFNjZW5lTm9kZSxcbiAgZGVzdDogU2NlbmVOb2RlXG4pOiBSZWNvcmQ8c3RyaW5nLCB7IGZyb206IHN0cmluZzsgdG86IHN0cmluZyB9PiB7XG4gIGNvbnN0IGNoYW5nZXM6IFJlY29yZDxzdHJpbmcsIHsgZnJvbTogc3RyaW5nOyB0bzogc3RyaW5nIH0+ID0ge307XG5cbiAgLy8gQmFja2dyb3VuZCBjb2xvclxuICBjb25zdCBzcmNCZyA9IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3Ioc291cmNlIGFzIGFueSk7XG4gIGNvbnN0IGRlc3RCZyA9IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3IoZGVzdCBhcyBhbnkpO1xuICBpZiAoc3JjQmcgJiYgZGVzdEJnICYmIHNyY0JnICE9PSBkZXN0QmcpIHtcbiAgICBjaGFuZ2VzLmJhY2tncm91bmRDb2xvciA9IHsgZnJvbTogc3JjQmcsIHRvOiBkZXN0QmcgfTtcbiAgfVxuXG4gIC8vIE9wYWNpdHlcbiAgaWYgKCdvcGFjaXR5JyBpbiBzb3VyY2UgJiYgJ29wYWNpdHknIGluIGRlc3QpIHtcbiAgICBjb25zdCBzcmNPcCA9IChzb3VyY2UgYXMgYW55KS5vcGFjaXR5O1xuICAgIGNvbnN0IGRlc3RPcCA9IChkZXN0IGFzIGFueSkub3BhY2l0eTtcbiAgICBpZiAoc3JjT3AgIT09IHVuZGVmaW5lZCAmJiBkZXN0T3AgIT09IHVuZGVmaW5lZCAmJiBNYXRoLmFicyhzcmNPcCAtIGRlc3RPcCkgPiAwLjAxKSB7XG4gICAgICBjaGFuZ2VzLm9wYWNpdHkgPSB7IGZyb206IFN0cmluZyhzcmNPcCksIHRvOiBTdHJpbmcoZGVzdE9wKSB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIFNpemUgKHRyYW5zZm9ybTogc2NhbGUpXG4gIGlmIChzb3VyY2UuYWJzb2x1dGVCb3VuZGluZ0JveCAmJiBkZXN0LmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICBjb25zdCBzcmNXID0gc291cmNlLmFic29sdXRlQm91bmRpbmdCb3gud2lkdGg7XG4gICAgY29uc3QgZGVzdFcgPSBkZXN0LmFic29sdXRlQm91bmRpbmdCb3gud2lkdGg7XG4gICAgaWYgKHNyY1cgPiAwICYmIGRlc3RXID4gMCkge1xuICAgICAgY29uc3Qgc2NhbGVYID0gTWF0aC5yb3VuZCgoZGVzdFcgLyBzcmNXKSAqIDEwMCkgLyAxMDA7XG4gICAgICBpZiAoTWF0aC5hYnMoc2NhbGVYIC0gMSkgPiAwLjAxKSB7XG4gICAgICAgIGNoYW5nZXMudHJhbnNmb3JtID0geyBmcm9tOiAnc2NhbGUoMSknLCB0bzogYHNjYWxlKCR7c2NhbGVYfSlgIH07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQm9yZGVyIHJhZGl1c1xuICBpZiAoJ2Nvcm5lclJhZGl1cycgaW4gc291cmNlICYmICdjb3JuZXJSYWRpdXMnIGluIGRlc3QpIHtcbiAgICBjb25zdCBzcmNSID0gKHNvdXJjZSBhcyBhbnkpLmNvcm5lclJhZGl1cztcbiAgICBjb25zdCBkZXN0UiA9IChkZXN0IGFzIGFueSkuY29ybmVyUmFkaXVzO1xuICAgIGlmICh0eXBlb2Ygc3JjUiA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGRlc3RSID09PSAnbnVtYmVyJyAmJiBzcmNSICE9PSBkZXN0Uikge1xuICAgICAgY2hhbmdlcy5ib3JkZXJSYWRpdXMgPSB7IGZyb206IHRvQ3NzVmFsdWUoc3JjUikhLCB0bzogdG9Dc3NWYWx1ZShkZXN0UikhIH07XG4gICAgfVxuICB9XG5cbiAgLy8gQm94IHNoYWRvdyAoZWZmZWN0cylcbiAgaWYgKCdlZmZlY3RzJyBpbiBzb3VyY2UgJiYgJ2VmZmVjdHMnIGluIGRlc3QpIHtcbiAgICBjb25zdCBzcmNTaGFkb3cgPSBleHRyYWN0Qm94U2hhZG93KHNvdXJjZSBhcyBhbnkpO1xuICAgIGNvbnN0IGRlc3RTaGFkb3cgPSBleHRyYWN0Qm94U2hhZG93KGRlc3QgYXMgYW55KTtcbiAgICBpZiAoc3JjU2hhZG93ICE9PSBkZXN0U2hhZG93KSB7XG4gICAgICBjaGFuZ2VzLmJveFNoYWRvdyA9IHsgZnJvbTogc3JjU2hhZG93IHx8ICdub25lJywgdG86IGRlc3RTaGFkb3cgfHwgJ25vbmUnIH07XG4gICAgfVxuICB9XG5cbiAgLy8gQm9yZGVyIGNvbG9yL3dpZHRoIGZyb20gc3Ryb2tlc1xuICBpZiAoJ3N0cm9rZXMnIGluIHNvdXJjZSAmJiAnc3Ryb2tlcycgaW4gZGVzdCkge1xuICAgIGNvbnN0IHNyY1N0cm9rZSA9IGV4dHJhY3RTdHJva2VDb2xvcihzb3VyY2UgYXMgYW55KTtcbiAgICBjb25zdCBkZXN0U3Ryb2tlID0gZXh0cmFjdFN0cm9rZUNvbG9yKGRlc3QgYXMgYW55KTtcbiAgICBpZiAoc3JjU3Ryb2tlICYmIGRlc3RTdHJva2UgJiYgc3JjU3Ryb2tlICE9PSBkZXN0U3Ryb2tlKSB7XG4gICAgICBjaGFuZ2VzLmJvcmRlckNvbG9yID0geyBmcm9tOiBzcmNTdHJva2UsIHRvOiBkZXN0U3Ryb2tlIH07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNoYW5nZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdCBib3gtc2hhZG93IENTUyB2YWx1ZSBmcm9tIG5vZGUgZWZmZWN0cy5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEJveFNoYWRvdyhub2RlOiB7IGVmZmVjdHM/OiByZWFkb25seSBFZmZlY3RbXSB9KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghbm9kZS5lZmZlY3RzKSByZXR1cm4gbnVsbDtcbiAgZm9yIChjb25zdCBlZmZlY3Qgb2Ygbm9kZS5lZmZlY3RzKSB7XG4gICAgaWYgKGVmZmVjdC50eXBlID09PSAnRFJPUF9TSEFET1cnICYmIGVmZmVjdC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgY29uc3QgeyBvZmZzZXQsIHJhZGl1cywgc3ByZWFkLCBjb2xvciB9ID0gZWZmZWN0IGFzIERyb3BTaGFkb3dFZmZlY3Q7XG4gICAgICBjb25zdCBoZXggPSByZ2JUb0hleChjb2xvcik7XG4gICAgICBjb25zdCBhbHBoYSA9IE1hdGgucm91bmQoKGNvbG9yLmEgfHwgMSkgKiAxMDApIC8gMTAwO1xuICAgICAgcmV0dXJuIGAke29mZnNldC54fXB4ICR7b2Zmc2V0Lnl9cHggJHtyYWRpdXN9cHggJHtzcHJlYWQgfHwgMH1weCByZ2JhKCR7TWF0aC5yb3VuZChjb2xvci5yICogMjU1KX0sICR7TWF0aC5yb3VuZChjb2xvci5nICogMjU1KX0sICR7TWF0aC5yb3VuZChjb2xvci5iICogMjU1KX0sICR7YWxwaGF9KWA7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgcHJpbWFyeSBzdHJva2UgY29sb3IgZnJvbSBhIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RTdHJva2VDb2xvcihub2RlOiB7IHN0cm9rZXM/OiByZWFkb25seSBQYWludFtdIH0pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFub2RlLnN0cm9rZXMpIHJldHVybiBudWxsO1xuICBmb3IgKGNvbnN0IHN0cm9rZSBvZiBub2RlLnN0cm9rZXMpIHtcbiAgICBpZiAoc3Ryb2tlLnR5cGUgPT09ICdTT0xJRCcgJiYgc3Ryb2tlLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gcmdiVG9IZXgoc3Ryb2tlLmNvbG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBhbGwgcHJvdG90eXBlIGludGVyYWN0aW9ucyBmcm9tIGEgc2VjdGlvbidzIG5vZGUgdHJlZS5cbiAqIFdhbGtzIGFsbCBkZXNjZW5kYW50cywgZmluZHMgbm9kZXMgd2l0aCByZWFjdGlvbnMsIGFuZCBwcm9kdWNlcyBJbnRlcmFjdGlvblNwZWNbXS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RJbnRlcmFjdGlvbnMoc2VjdGlvblJvb3Q6IFNjZW5lTm9kZSk6IEludGVyYWN0aW9uU3BlY1tdIHtcbiAgY29uc3QgaW50ZXJhY3Rpb25zOiBJbnRlcmFjdGlvblNwZWNbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdyZWFjdGlvbnMnIGluIG5vZGUpIHtcbiAgICAgIGNvbnN0IHJlYWN0aW9ucyA9IChub2RlIGFzIGFueSkucmVhY3Rpb25zIGFzIGFueVtdO1xuICAgICAgaWYgKHJlYWN0aW9ucyAmJiByZWFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGNvbnN0IHJlYWN0aW9uIG9mIHJlYWN0aW9ucykge1xuICAgICAgICAgIGNvbnN0IHRyaWdnZXIgPSBtYXBUcmlnZ2VyKHJlYWN0aW9uLnRyaWdnZXI/LnR5cGUpO1xuICAgICAgICAgIGlmICghdHJpZ2dlcikgY29udGludWU7XG5cbiAgICAgICAgICBjb25zdCBhY3Rpb24gPSByZWFjdGlvbi5hY3Rpb24gfHwgKHJlYWN0aW9uLmFjdGlvbnMgJiYgcmVhY3Rpb24uYWN0aW9uc1swXSk7XG4gICAgICAgICAgaWYgKCFhY3Rpb24pIGNvbnRpbnVlO1xuXG4gICAgICAgICAgLy8gR2V0IHRyYW5zaXRpb24gZGF0YVxuICAgICAgICAgIGNvbnN0IHRyYW5zaXRpb24gPSBhY3Rpb24udHJhbnNpdGlvbjtcbiAgICAgICAgICBjb25zdCBkdXJhdGlvbiA9IHRyYW5zaXRpb24/LmR1cmF0aW9uID8gYCR7dHJhbnNpdGlvbi5kdXJhdGlvbn1zYCA6ICcwLjNzJztcbiAgICAgICAgICBjb25zdCBlYXNpbmcgPSBtYXBFYXNpbmcodHJhbnNpdGlvbj8uZWFzaW5nKTtcblxuICAgICAgICAgIC8vIEZvciBob3Zlci9jbGljayB3aXRoIGRlc3RpbmF0aW9uIG5vZGUgXHUyMDE0IGRpZmYgc3R5bGVzXG4gICAgICAgICAgaWYgKGFjdGlvbi5kZXN0aW5hdGlvbklkICYmICh0cmlnZ2VyID09PSAnaG92ZXInIHx8IHRyaWdnZXIgPT09ICdtb3VzZS1lbnRlcicgfHwgdHJpZ2dlciA9PT0gJ2NsaWNrJykpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRlc3ROb2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQoYWN0aW9uLmRlc3RpbmF0aW9uSWQpO1xuICAgICAgICAgICAgICBpZiAoZGVzdE5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eUNoYW5nZXMgPSBkaWZmTm9kZVN0eWxlcyhub2RlLCBkZXN0Tm9kZSBhcyBTY2VuZU5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhwcm9wZXJ0eUNoYW5nZXMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudE5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZmlnbWFOb2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXIsXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246IHsgZHVyYXRpb24sIGVhc2luZyB9LFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eUNoYW5nZXMsXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAvLyBEZXN0aW5hdGlvbiBub2RlIG5vdCBhY2Nlc3NpYmxlIChkaWZmZXJlbnQgcGFnZSwgZXRjLilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2FsayhzZWN0aW9uUm9vdCk7XG4gIHJldHVybiBpbnRlcmFjdGlvbnM7XG59XG4iLCAiaW1wb3J0IHsgRmlnbWFWYXJpYWJsZXNFeHBvcnQgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHJnYlRvSGV4IH0gZnJvbSAnLi9jb2xvcic7XG5cbi8qKlxuICogRXh0cmFjdCBGaWdtYSBWYXJpYWJsZXMgKGRlc2lnbiB0b2tlbnMpIGZyb20gdGhlIGN1cnJlbnQgZmlsZS5cbiAqXG4gKiBXaGVuIGEgZGVzaWduZXIgaGFzIHNldCB1cCBGaWdtYSBWYXJpYWJsZXMgKGNvbG9ycywgbnVtYmVycywgc3RyaW5ncyxcbiAqIGJvb2xlYW5zKSB0aGUgdmFyaWFibGUgbmFtZXMgQVJFIHRoZSBkZXNpZ24gdG9rZW5zIHRoZSBkZXZlbG9wZXIgc2hvdWxkXG4gKiB1c2UuIFdlIGV4cG9ydCB0aGVtIGdyb3VwZWQgYnkgY29sbGVjdGlvbiBhbmQgZmxhdCBieSBmdWxsIG5hbWUgc29cbiAqIGFnZW50cyBjYW4gZW1pdCBgLS1jbHItcHJpbWFyeWAgaW5zdGVhZCBvZiBgLS1jbHItMWMxYzFjYC5cbiAqXG4gKiBSZXR1cm5zIGB7IHByZXNlbnQ6IGZhbHNlIH1gIHdoZW4gdGhlIEZpZ21hIFZhcmlhYmxlcyBBUEkgaXMgdW5hdmFpbGFibGVcbiAqIG9yIG5vIHZhcmlhYmxlcyBleGlzdC4gQWdlbnRzIGZhbGwgYmFjayB0byBhdXRvLWdlbmVyYXRlZCBuYW1lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RWYXJpYWJsZXMoKTogRmlnbWFWYXJpYWJsZXNFeHBvcnQge1xuICBjb25zdCBvdXQ6IEZpZ21hVmFyaWFibGVzRXhwb3J0ID0ge1xuICAgIGNvbGxlY3Rpb25zOiB7fSxcbiAgICBmbGF0OiB7fSxcbiAgICBwcmVzZW50OiBmYWxzZSxcbiAgfTtcblxuICAvLyBGZWF0dXJlLWRldGVjdCBcdTIwMTQgb2xkZXIgRmlnbWEgY2xpZW50cyBkb24ndCBoYXZlIHZhcmlhYmxlcyBBUElcbiAgaWYgKCFmaWdtYS52YXJpYWJsZXMgfHwgdHlwZW9mIGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBsZXQgY29sbGVjdGlvbnNCeUlkOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gIHRyeSB7XG4gICAgY29uc3QgbG9jYWxDb2xsZWN0aW9ucyA9IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlQ29sbGVjdGlvbnMoKTtcbiAgICBmb3IgKGNvbnN0IGNvbCBvZiBsb2NhbENvbGxlY3Rpb25zKSB7XG4gICAgICBjb2xsZWN0aW9uc0J5SWRbY29sLmlkXSA9IGNvbDtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBsZXQgdmFyaWFibGVzOiBWYXJpYWJsZVtdID0gW107XG4gIHRyeSB7XG4gICAgdmFyaWFibGVzID0gZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVzKCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cbiAgaWYgKCF2YXJpYWJsZXMgfHwgdmFyaWFibGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG91dDtcblxuICBvdXQucHJlc2VudCA9IHRydWU7XG5cbiAgZm9yIChjb25zdCB2IG9mIHZhcmlhYmxlcykge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uc0J5SWRbdi52YXJpYWJsZUNvbGxlY3Rpb25JZF07XG4gICAgaWYgKCFjb2xsZWN0aW9uKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGRlZmF1bHRNb2RlSWQgPSBjb2xsZWN0aW9uLmRlZmF1bHRNb2RlSWQ7XG4gICAgY29uc3QgcmF3ID0gdi52YWx1ZXNCeU1vZGVbZGVmYXVsdE1vZGVJZF07XG4gICAgaWYgKHJhdyA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcblxuICAgIGxldCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbjtcbiAgICBpZiAodi5yZXNvbHZlZFR5cGUgPT09ICdDT0xPUicpIHtcbiAgICAgIC8vIENPTE9SIHZhbHVlcyBhcmUgUkdCQSBvYmplY3RzOyBjb252ZXJ0IHRvIGhleFxuICAgICAgaWYgKHJhdyAmJiB0eXBlb2YgcmF3ID09PSAnb2JqZWN0JyAmJiAncicgaW4gcmF3KSB7XG4gICAgICAgIHZhbHVlID0gcmdiVG9IZXgocmF3IGFzIGFueSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHYucmVzb2x2ZWRUeXBlID09PSAnRkxPQVQnKSB7XG4gICAgICB2YWx1ZSA9IHR5cGVvZiByYXcgPT09ICdudW1iZXInID8gcmF3IDogTnVtYmVyKHJhdyk7XG4gICAgfSBlbHNlIGlmICh2LnJlc29sdmVkVHlwZSA9PT0gJ1NUUklORycpIHtcbiAgICAgIHZhbHVlID0gdHlwZW9mIHJhdyA9PT0gJ3N0cmluZycgPyByYXcgOiBTdHJpbmcocmF3KTtcbiAgICB9IGVsc2UgaWYgKHYucmVzb2x2ZWRUeXBlID09PSAnQk9PTEVBTicpIHtcbiAgICAgIHZhbHVlID0gQm9vbGVhbihyYXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IGNvbGxlY3Rpb24ubmFtZSB8fCAnRGVmYXVsdCc7XG4gICAgaWYgKCFvdXQuY29sbGVjdGlvbnNbY29sbGVjdGlvbk5hbWVdKSBvdXQuY29sbGVjdGlvbnNbY29sbGVjdGlvbk5hbWVdID0ge307XG4gICAgb3V0LmNvbGxlY3Rpb25zW2NvbGxlY3Rpb25OYW1lXVt2Lm5hbWVdID0gdmFsdWU7XG5cbiAgICAvLyBGbGF0IGtleTogXCI8Y29sbGVjdGlvbj4vPHZhcmlhYmxlLW5hbWU+XCIgc28gZHVwbGljYXRlcyBhY3Jvc3MgY29sbGVjdGlvbnMgZG9uJ3QgY29sbGlkZVxuICAgIGNvbnN0IGZsYXRLZXkgPSBgJHtjb2xsZWN0aW9uTmFtZX0vJHt2Lm5hbWV9YDtcbiAgICBvdXQuZmxhdFtmbGF0S2V5XSA9IHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgYSBGaWdtYSB2YXJpYWJsZSBuYW1lIHRvIGEgQ1NTIGN1c3RvbSBwcm9wZXJ0eSBuYW1lLlxuICogICBcIkNvbG9ycy9QcmltYXJ5XCIgXHUyMTkyIFwiLS1jbHItcHJpbWFyeVwiXG4gKiAgIFwiU3BhY2luZy9tZFwiIFx1MjE5MiBcIi0tc3BhY2UtbWRcIlxuICogICBcIlJhZGl1cy9sZ1wiIFx1MjE5MiBcIi0tcmFkaXVzLWxnXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvQ3NzQ3VzdG9tUHJvcGVydHkodmFyaWFibGVOYW1lOiBzdHJpbmcsIGNvbGxlY3Rpb25OYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjb2wgPSBjb2xsZWN0aW9uTmFtZS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBuYW1lID0gdmFyaWFibGVOYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXowLTldKy9nLCAnLScpLnJlcGxhY2UoLy0rL2csICctJykucmVwbGFjZSgvXi18LSQvZywgJycpO1xuXG4gIGlmIChjb2wuaW5jbHVkZXMoJ2NvbG9yJykgfHwgY29sLmluY2x1ZGVzKCdjb2xvdXInKSkgcmV0dXJuIGAtLWNsci0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygnc3BhYycpKSByZXR1cm4gYC0tc3BhY2UtJHtuYW1lfWA7XG4gIGlmIChjb2wuaW5jbHVkZXMoJ3JhZGl1cycpKSByZXR1cm4gYC0tcmFkaXVzLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdmb250JykgJiYgY29sLmluY2x1ZGVzKCdzaXplJykpIHJldHVybiBgLS1mcy0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygnZm9udCcpICYmIGNvbC5pbmNsdWRlcygnd2VpZ2h0JykpIHJldHVybiBgLS1mdy0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygnZm9udCcpIHx8IGNvbC5pbmNsdWRlcygnZmFtaWx5JykpIHJldHVybiBgLS1mZi0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygnbGluZScpKSByZXR1cm4gYC0tbGgtJHtuYW1lfWA7XG4gIHJldHVybiBgLS0ke2NvbC5yZXBsYWNlKC9bXmEtejAtOV0rL2csICctJyl9LSR7bmFtZX1gO1xufVxuIiwgImltcG9ydCB7XG4gIENvbXBvbmVudFBhdHRlcm4sIFJlcGVhdGVySW5mbywgUmVwZWF0ZXJJdGVtLCBOYXZpZ2F0aW9uSW5mbywgU2VjdGlvblR5cGUsXG59IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgc2x1Z2lmeSwgaXNEZWZhdWx0TGF5ZXJOYW1lIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBoYXNJbWFnZUZpbGwgfSBmcm9tICcuL2NvbG9yJztcblxuLyoqXG4gKiBDb21wdXRlIGEgbG9vc2UgXCJzdHJ1Y3R1cmUgZmluZ2VycHJpbnRcIiBmb3IgYSBub2RlLiBUd28gY2hpbGRyZW4gd2l0aCB0aGVcbiAqIHNhbWUgZmluZ2VycHJpbnQgYXJlIHRyZWF0ZWQgYXMgc2libGluZ3Mgb2YgdGhlIHNhbWUgcmVwZWF0ZXIgdGVtcGxhdGVcbiAqIChzYW1lIGNhcmQgbGF5b3V0IHJlcGVhdGVkIDMgdGltZXMsIGV0Yy4pLiBXZSBkZWxpYmVyYXRlbHkgaWdub3JlIHRleHRcbiAqIGNvbnRlbnQgYW5kIHNwZWNpZmljIHNpemVzIHNvIG1pbm9yIHZhcmlhdGlvbnMgc3RpbGwgbWF0Y2guXG4gKi9cbmZ1bmN0aW9uIHN0cnVjdHVyZUZpbmdlcnByaW50KG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlciA9IDApOiBzdHJpbmcge1xuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbYFQ9JHtub2RlLnR5cGV9YF07XG4gIGlmIChoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpKSBwYXJ0cy5wdXNoKCdJTUcnKTtcblxuICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlICYmIGRlcHRoIDwgMikge1xuICAgIGNvbnN0IGNoaWxkRnBzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkLnZpc2libGUgPT09IGZhbHNlKSBjb250aW51ZTtcbiAgICAgIGNoaWxkRnBzLnB1c2goc3RydWN0dXJlRmluZ2VycHJpbnQoY2hpbGQsIGRlcHRoICsgMSkpO1xuICAgIH1cbiAgICBjaGlsZEZwcy5zb3J0KCk7XG4gICAgcGFydHMucHVzaChgQz1bJHtjaGlsZEZwcy5qb2luKCcsJyl9XWApO1xuICB9XG4gIHJldHVybiBwYXJ0cy5qb2luKCd8Jyk7XG59XG5cbmNvbnN0IFJFUEVBVEVSX05BTUVfSElOVFMgPSAvXFxiKGNhcmRzP3xpdGVtcz98bGlzdHxncmlkfGZlYXR1cmVzP3xzZXJ2aWNlcz98dGVhbXxsb2dvcz98dGVzdGltb25pYWxzP3xwcmljaW5nfHBsYW5zP3xhcnRpY2xlcz98cG9zdHM/fGJsb2d8ZmFxcz8pXFxiL2k7XG5cbi8qKlxuICogRGV0ZWN0IHJlcGVhdGVyIGdyb3VwcyBpbnNpZGUgYSBzZWN0aW9uLiBDb25zZXJ2YXRpdmU6XG4gKiAgIC0gXHUyMjY1MyBjaGlsZHJlbiBzaGFyZSBhIGZpbmdlcnByaW50LCBPUlxuICogICAtIFx1MjI2NTIgY2hpbGRyZW4gc2hhcmUgYSBmaW5nZXJwcmludCBBTkQgdGhlIHBhcmVudCBuYW1lIGhpbnRzIHJlcGV0aXRpb25cbiAqICAgICBBTkQgdGhlIG1hdGNoaW5nIGdyb3VwIGNvdmVycyBcdTIyNjU2MCUgb2YgdmlzaWJsZSBjaGlsZHJlbi5cbiAqXG4gKiBUaGUgZXhpc3RpbmcgYGVsZW1lbnRzYCBtYXAgaXMgdW50b3VjaGVkIFx1MjAxNCByZXBlYXRlcnMgYXJlIGFuIGFkZGl0aXZlXG4gKiBzaWduYWwgdGhlIGFnZW50IGNhbiBvcHQgaW50byBmb3IgY2xlYW5lciBBQ0YgUmVwZWF0ZXIgb3V0cHV0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0UmVwZWF0ZXJzKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUpOiBSZWNvcmQ8c3RyaW5nLCBSZXBlYXRlckluZm8+IHtcbiAgY29uc3QgcmVwZWF0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBSZXBlYXRlckluZm8+ID0ge307XG4gIGNvbnN0IHVzZWRLZXlzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZnVuY3Rpb24ga2V5Rm9yKGNvbnRhaW5lck5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYmFzZSA9IGNvbnRhaW5lck5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJylcbiAgICAgIHx8IGByZXBlYXRlcl8ke09iamVjdC5rZXlzKHJlcGVhdGVycykubGVuZ3RoICsgMX1gO1xuICAgIGlmICghdXNlZEtleXMuaGFzKGJhc2UpKSB7XG4gICAgICB1c2VkS2V5cy5hZGQoYmFzZSk7XG4gICAgICByZXR1cm4gYmFzZTtcbiAgICB9XG4gICAgbGV0IGkgPSAyO1xuICAgIHdoaWxlICh1c2VkS2V5cy5oYXMoYCR7YmFzZX1fJHtpfWApKSBpKys7XG4gICAgdXNlZEtleXMuYWRkKGAke2Jhc2V9XyR7aX1gKTtcbiAgICByZXR1cm4gYCR7YmFzZX1fJHtpfWA7XG4gIH1cblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmIChkZXB0aCA+IDUpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoISgnY2hpbGRyZW4nIGluIG5vZGUpKSByZXR1cm4gZmFsc2U7XG5cbiAgICBjb25zdCBraWRzID0gKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlKTtcbiAgICBpZiAoa2lkcy5sZW5ndGggPj0gMikge1xuICAgICAgY29uc3QgZ3JvdXBzID0gbmV3IE1hcDxzdHJpbmcsIFNjZW5lTm9kZVtdPigpO1xuICAgICAgZm9yIChjb25zdCBrIG9mIGtpZHMpIHtcbiAgICAgICAgY29uc3QgZnAgPSBzdHJ1Y3R1cmVGaW5nZXJwcmludChrKTtcbiAgICAgICAgaWYgKCFncm91cHMuaGFzKGZwKSkgZ3JvdXBzLnNldChmcCwgW10pO1xuICAgICAgICBncm91cHMuZ2V0KGZwKSEucHVzaChrKTtcbiAgICAgIH1cbiAgICAgIGxldCBiZXN0R3JvdXA6IFNjZW5lTm9kZVtdIHwgbnVsbCA9IG51bGw7XG4gICAgICBmb3IgKGNvbnN0IGcgb2YgZ3JvdXBzLnZhbHVlcygpKSB7XG4gICAgICAgIGlmICghYmVzdEdyb3VwIHx8IGcubGVuZ3RoID4gYmVzdEdyb3VwLmxlbmd0aCkgYmVzdEdyb3VwID0gZztcbiAgICAgIH1cbiAgICAgIGlmIChiZXN0R3JvdXAgJiYgYmVzdEdyb3VwLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgIGNvbnN0IGlzQmlnR3JvdXAgPSBiZXN0R3JvdXAubGVuZ3RoID49IDM7XG4gICAgICAgIGNvbnN0IGhpbnRNYXRjaCA9IFJFUEVBVEVSX05BTUVfSElOVFMudGVzdChub2RlLm5hbWUgfHwgJycpO1xuICAgICAgICBjb25zdCBkb21pbmF0ZXMgPSBiZXN0R3JvdXAubGVuZ3RoID49IE1hdGguY2VpbChraWRzLmxlbmd0aCAqIDAuNik7XG4gICAgICAgIGlmIChpc0JpZ0dyb3VwIHx8IChoaW50TWF0Y2ggJiYgZG9taW5hdGVzKSkge1xuICAgICAgICAgIGNvbnN0IGtleSA9IGtleUZvcihub2RlLm5hbWUgfHwgJ3JlcGVhdGVyJyk7XG4gICAgICAgICAgcmVwZWF0ZXJzW2tleV0gPSB7XG4gICAgICAgICAgICBjb250YWluZXJMYXllck5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgIGl0ZW1Db3VudDogYmVzdEdyb3VwLmxlbmd0aCxcbiAgICAgICAgICAgIHRlbXBsYXRlTGF5ZXJOYW1lOiBiZXN0R3JvdXBbMF0ubmFtZSxcbiAgICAgICAgICAgIGl0ZW1zOiBiZXN0R3JvdXAubWFwKGV4dHJhY3RSZXBlYXRlckl0ZW0pLFxuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIHRydWU7IC8vIERvbid0IHJlY3Vyc2UgaW50byByZXBlYXRlciBjaGlsZHJlblxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjIG9mIGtpZHMpIHdhbGsoYywgZGVwdGggKyAxKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoJ2NoaWxkcmVuJyBpbiBzZWN0aW9uTm9kZSkge1xuICAgIGZvciAoY29uc3QgYyBvZiAoc2VjdGlvbk5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgaWYgKGMudmlzaWJsZSAhPT0gZmFsc2UpIHdhbGsoYywgMCk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXBlYXRlcnM7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RSZXBlYXRlckl0ZW0obm9kZTogU2NlbmVOb2RlKTogUmVwZWF0ZXJJdGVtIHtcbiAgY29uc3QgaXRlbTogUmVwZWF0ZXJJdGVtID0geyB0ZXh0czoge30gfTtcbiAgbGV0IHRleHRJbmRleCA9IDA7XG4gIGxldCBmaXJzdEltYWdlTmFtZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGxldCBmaXJzdEltYWdlQWx0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBmdW5jdGlvbiB3YWxrKG46IFNjZW5lTm9kZSkge1xuICAgIGlmIChuLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBpZiAobi50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIGNvbnN0IHQgPSBuIGFzIFRleHROb2RlO1xuICAgICAgY29uc3QgY2xlYW4gPSAodC5uYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIGNvbnN0IHJvbGUgPSBjbGVhbiAmJiAhL14odGV4dHxmcmFtZXxncm91cHxyZWN0YW5nbGUpXFxkKiQvLnRlc3QoY2xlYW4pXG4gICAgICAgID8gY2xlYW4gOiBgdGV4dF8ke3RleHRJbmRleH1gO1xuICAgICAgaWYgKHQuY2hhcmFjdGVycykgaXRlbS50ZXh0c1tyb2xlXSA9IHQuY2hhcmFjdGVycztcbiAgICAgIHRleHRJbmRleCsrO1xuICAgIH1cblxuICAgIGlmICghZmlyc3RJbWFnZU5hbWUgJiYgaGFzSW1hZ2VGaWxsKG4gYXMgYW55KSkge1xuICAgICAgZmlyc3RJbWFnZU5hbWUgPSBgJHtzbHVnaWZ5KG4ubmFtZSB8fCAnaW1hZ2UnKX0ucG5nYDtcbiAgICAgIGlmIChuLm5hbWUgJiYgIWlzRGVmYXVsdExheWVyTmFtZShuLm5hbWUpKSB7XG4gICAgICAgIGZpcnN0SW1hZ2VBbHQgPSBuLm5hbWUucmVwbGFjZSgvWy1fXS9nLCAnICcpLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKClcbiAgICAgICAgICAucmVwbGFjZSgvXFxiXFx3L2csIGMgPT4gYy50b1VwcGVyQ2FzZSgpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWl0ZW0ubGlua1VybCAmJiAncmVhY3Rpb25zJyBpbiBuKSB7XG4gICAgICBjb25zdCByZWFjdGlvbnMgPSAobiBhcyBhbnkpLnJlYWN0aW9ucztcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlYWN0aW9ucykpIHtcbiAgICAgICAgb3V0ZXI6IGZvciAoY29uc3QgciBvZiByZWFjdGlvbnMpIHtcbiAgICAgICAgICBjb25zdCBhY3Rpb25zID0gci5hY3Rpb25zIHx8IChyLmFjdGlvbiA/IFtyLmFjdGlvbl0gOiBbXSk7XG4gICAgICAgICAgZm9yIChjb25zdCBhIG9mIGFjdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChhICYmIGEudHlwZSA9PT0gJ1VSTCcgJiYgYS51cmwpIHsgaXRlbS5saW5rVXJsID0gYS51cmw7IGJyZWFrIG91dGVyOyB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbikge1xuICAgICAgZm9yIChjb25zdCBjIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoYyk7XG4gICAgfVxuICB9XG4gIHdhbGsobm9kZSk7XG4gIGlmIChmaXJzdEltYWdlTmFtZSkgaXRlbS5pbWFnZUZpbGUgPSBmaXJzdEltYWdlTmFtZTtcbiAgaWYgKGZpcnN0SW1hZ2VBbHQpIGl0ZW0uYWx0ID0gZmlyc3RJbWFnZUFsdDtcbiAgcmV0dXJuIGl0ZW07XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gQ29tcG9uZW50IHBhdHRlcm5zOiBjYXJvdXNlbCAvIGFjY29yZGlvbiAvIHRhYnMgLyBtb2RhbFxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmNvbnN0IENBUk9VU0VMX1JYID0gL1xcYihjYXJvdXNlbHxzbGlkZXJ8c3dpcGVyfGdhbGxlcnl8c2xpZGVzaG93KVxcYi9pO1xuY29uc3QgQUNDT1JESU9OX1JYID0gL1xcYihhY2NvcmRpb258ZmFxfGNvbGxhcHNlfGV4cGFuZGVyfGNvbGxhcHNpYmxlKVxcYi9pO1xuY29uc3QgVEFCU19SWCA9IC9cXGJ0YWJzP1xcYi9pO1xuY29uc3QgTU9EQUxfUlggPSAvXFxiKG1vZGFsfHBvcHVwfGRpYWxvZ3xvdmVybGF5fGxpZ2h0Ym94KVxcYi9pO1xuXG4vKipcbiAqIERldGVjdCBpbnRlcmFjdGl2ZSBjb21wb25lbnQgcGF0dGVybnMuIFdlIGZhdm91ciBleHBsaWNpdCBsYXllci1uYW1lXG4gKiBtYXRjaGVzIG92ZXIgcHVyZSBzdHJ1Y3R1cmFsIGRldGVjdGlvbiB0byBrZWVwIGZhbHNlIHBvc2l0aXZlcyBsb3cuXG4gKiBXaGVuIHRoZSBuYW1lIG1hdGNoZXMsIGNvbmZpZGVuY2UgaXMgJ2hpZ2gnOyB3aGVuIGluZmVycmVkIHN0cnVjdHVyYWxseSxcbiAqIGNvbmZpZGVuY2UgaXMgJ2xvdycgYW5kIHRoZSBhZ2VudCBzaG91bGQgdmVyaWZ5IGFnYWluc3QgdGhlIHNjcmVlbnNob3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDb21wb25lbnRQYXR0ZXJucyhzZWN0aW9uTm9kZTogU2NlbmVOb2RlKTogQ29tcG9uZW50UGF0dGVybltdIHtcbiAgY29uc3QgcGF0dGVybnM6IENvbXBvbmVudFBhdHRlcm5bXSA9IFtdO1xuICBjb25zdCBzZWVuTm9kZUlkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZ1bmN0aW9uIGFkZFBhdHRlcm4ocDogQ29tcG9uZW50UGF0dGVybikge1xuICAgIGlmIChzZWVuTm9kZUlkcy5oYXMocC5yb290Tm9kZUlkKSkgcmV0dXJuO1xuICAgIHNlZW5Ob2RlSWRzLmFkZChwLnJvb3ROb2RlSWQpO1xuICAgIHBhdHRlcm5zLnB1c2gocCk7XG4gIH1cblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcikge1xuICAgIGlmIChkZXB0aCA+IDYgfHwgbm9kZS52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIGNvbnN0IG5hbWUgPSBub2RlLm5hbWUgfHwgJyc7XG5cbiAgICAvLyBNT0RBTCBcdTIwMTQgbmFtZS1vbmx5IGRldGVjdGlvbiAoc3RydWN0dXJhbCBkZXRlY3Rpb24gaXMgdG9vIG5vaXN5KS5cbiAgICBpZiAoTU9EQUxfUlgudGVzdChuYW1lKSAmJiAnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGFkZFBhdHRlcm4oe1xuICAgICAgICB0eXBlOiAnbW9kYWwnLFxuICAgICAgICByb290Tm9kZUlkOiBub2RlLmlkLFxuICAgICAgICByb290Tm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgY29uZmlkZW5jZTogJ2hpZ2gnLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47IC8vIGRvbid0IHJlY3Vyc2UgaW50byBtb2RhbCBpbnRlcm5hbHNcbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgY29uc3Qga2lkcyA9IGZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UpO1xuXG4gICAgICAvLyBDQVJPVVNFTDogZXhwbGljaXQgbmFtZSBPUiAoaG9yaXpvbnRhbCArIGNsaXBzQ29udGVudCArIFx1MjI2NTMgc2ltaWxhciBjaGlsZHJlbilcbiAgICAgIGNvbnN0IG5hbWVDYXJvdXNlbCA9IENBUk9VU0VMX1JYLnRlc3QobmFtZSk7XG4gICAgICBjb25zdCBob3Jpem9udGFsQ2xpcHBlZCA9IGZyYW1lLmxheW91dE1vZGUgPT09ICdIT1JJWk9OVEFMJyAmJiBmcmFtZS5jbGlwc0NvbnRlbnQgPT09IHRydWU7XG4gICAgICBpZiAobmFtZUNhcm91c2VsIHx8IGhvcml6b250YWxDbGlwcGVkKSB7XG4gICAgICAgIGlmIChraWRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgY29uc3QgZnAwID0gc3RydWN0dXJlRmluZ2VycHJpbnQoa2lkc1swXSk7XG4gICAgICAgICAgY29uc3QgbWF0Y2hpbmcgPSBraWRzLmZpbHRlcihrID0+IHN0cnVjdHVyZUZpbmdlcnByaW50KGspID09PSBmcDApLmxlbmd0aDtcbiAgICAgICAgICBpZiAobWF0Y2hpbmcgPj0gMykge1xuICAgICAgICAgICAgYWRkUGF0dGVybih7XG4gICAgICAgICAgICAgIHR5cGU6ICdjYXJvdXNlbCcsXG4gICAgICAgICAgICAgIHJvb3ROb2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgICAgIHJvb3ROb2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICBpdGVtQ291bnQ6IG1hdGNoaW5nLFxuICAgICAgICAgICAgICBjb25maWRlbmNlOiBuYW1lQ2Fyb3VzZWwgPyAnaGlnaCcgOiAnbG93JyxcbiAgICAgICAgICAgICAgbWV0YToge1xuICAgICAgICAgICAgICAgIGxheW91dE1vZGU6IGZyYW1lLmxheW91dE1vZGUsXG4gICAgICAgICAgICAgICAgY2xpcHNDb250ZW50OiBmcmFtZS5jbGlwc0NvbnRlbnQsXG4gICAgICAgICAgICAgICAgaXRlbVNwYWNpbmc6IGZyYW1lLml0ZW1TcGFjaW5nID8/IG51bGwsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQUNDT1JESU9OOiBuYW1lIG1hdGNoICsgXHUyMjY1MiBjaGlsZCBpdGVtc1xuICAgICAgaWYgKEFDQ09SRElPTl9SWC50ZXN0KG5hbWUpICYmIGtpZHMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgY29uc3QgaXRlbXM6IEFycmF5PHsgcXVlc3Rpb246IHN0cmluZzsgYW5zd2VyPzogc3RyaW5nIH0+ID0gW107XG4gICAgICAgIGZvciAoY29uc3QgayBvZiBraWRzKSB7XG4gICAgICAgICAgY29uc3QgYWxsID0gY29sbGVjdEFsbFRleHQoayk7XG4gICAgICAgICAgaWYgKGFsbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpdGVtcy5wdXNoKHsgcXVlc3Rpb246IGFsbFswXSwgYW5zd2VyOiBhbGwuc2xpY2UoMSkuam9pbignICcpIHx8IHVuZGVmaW5lZCB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgYWRkUGF0dGVybih7XG4gICAgICAgICAgICB0eXBlOiAnYWNjb3JkaW9uJyxcbiAgICAgICAgICAgIHJvb3ROb2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgICByb290Tm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgIGl0ZW1Db3VudDogaXRlbXMubGVuZ3RoLFxuICAgICAgICAgICAgY29uZmlkZW5jZTogJ2hpZ2gnLFxuICAgICAgICAgICAgbWV0YTogeyBpdGVtcyB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUQUJTOiBuYW1lIG1hdGNoICsgXHUyMjY1MiBjaGlsZHJlblxuICAgICAgaWYgKFRBQlNfUlgudGVzdChuYW1lKSAmJiBraWRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgIGFkZFBhdHRlcm4oe1xuICAgICAgICAgIHR5cGU6ICd0YWJzJyxcbiAgICAgICAgICByb290Tm9kZUlkOiBub2RlLmlkLFxuICAgICAgICAgIHJvb3ROb2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgIGl0ZW1Db3VudDoga2lkcy5sZW5ndGgsXG4gICAgICAgICAgY29uZmlkZW5jZTogJ2hpZ2gnLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IGMgb2Yga2lkcykgd2FsayhjLCBkZXB0aCArIDEpO1xuICAgIH1cbiAgfVxuXG4gIHdhbGsoc2VjdGlvbk5vZGUsIDApO1xuICByZXR1cm4gcGF0dGVybnM7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RBbGxUZXh0KG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZ1tdIHtcbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBmdW5jdGlvbiB3YWxrKG46IFNjZW5lTm9kZSkge1xuICAgIGlmIChuLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG4gICAgaWYgKG4udHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCBjaGFycyA9ICgobiBhcyBUZXh0Tm9kZSkuY2hhcmFjdGVycyB8fCAnJykudHJpbSgpO1xuICAgICAgaWYgKGNoYXJzKSBvdXQucHVzaChjaGFycyk7XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG4pIHtcbiAgICAgIGZvciAoY29uc3QgYyBvZiAobiBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB3YWxrKGMpO1xuICAgIH1cbiAgfVxuICB3YWxrKG5vZGUpO1xuICByZXR1cm4gb3V0O1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIE5hdmlnYXRpb24gZXh0cmFjdGlvblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbi8qKlxuICogRGV0ZWN0IG5hdmlnYXRpb24gbGlua3MgaW5zaWRlIGEgc2VjdGlvbiBcdTIwMTQgc2hvcnQgdGV4dCBub2RlcyB0aGF0IGxvb2tcbiAqIGxpa2UgbWVudSBpdGVtcyAoXHUyMjY0NDAgY2hhcnMsIGZvbnQgc2l6ZSBcdTIyNjQyMnB4KS4gUmV0dXJucyBudWxsIHdoZW4gdGhlcmVcbiAqIGFyZSBmZXdlciB0aGFuIDIgc3VjaCBsaW5rcyAob25lIGxpbmsgaXNuJ3QgYSBtZW51KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdE5hdmlnYXRpb24oc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSk6IE5hdmlnYXRpb25JbmZvIHwgbnVsbCB7XG4gIGNvbnN0IGxpbmtzOiBBcnJheTx7IGxhYmVsOiBzdHJpbmc7IGhyZWY/OiBzdHJpbmcgfCBudWxsIH0+ID0gW107XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcikge1xuICAgIGlmIChkZXB0aCA+IDYgfHwgbm9kZS52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgdCA9IG5vZGUgYXMgVGV4dE5vZGU7XG4gICAgICBjb25zdCB0ZXh0ID0gKHQuY2hhcmFjdGVycyB8fCAnJykudHJpbSgpO1xuICAgICAgaWYgKCF0ZXh0IHx8IHRleHQubGVuZ3RoID4gNDApIHJldHVybjtcbiAgICAgIGNvbnN0IGZzID0gdC5mb250U2l6ZSAhPT0gZmlnbWEubWl4ZWQgPyAodC5mb250U2l6ZSBhcyBudW1iZXIpIDogMTY7XG4gICAgICBpZiAoZnMgPiAyMikgcmV0dXJuO1xuICAgICAgaWYgKHNlZW4uaGFzKHRleHQudG9Mb3dlckNhc2UoKSkpIHJldHVybjtcbiAgICAgIHNlZW4uYWRkKHRleHQudG9Mb3dlckNhc2UoKSk7XG5cbiAgICAgIGxldCBocmVmOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgIGNvbnN0IHJlYWN0aW9ucyA9ICh0IGFzIGFueSkucmVhY3Rpb25zO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVhY3Rpb25zKSkge1xuICAgICAgICBvdXRlcjogZm9yIChjb25zdCByIG9mIHJlYWN0aW9ucykge1xuICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSByLmFjdGlvbnMgfHwgKHIuYWN0aW9uID8gW3IuYWN0aW9uXSA6IFtdKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGEgb2YgYWN0aW9ucykge1xuICAgICAgICAgICAgaWYgKGEgJiYgYS50eXBlID09PSAnVVJMJyAmJiBhLnVybCkgeyBocmVmID0gYS51cmw7IGJyZWFrIG91dGVyOyB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsaW5rcy5wdXNoKHsgbGFiZWw6IHRleHQsIGhyZWYgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgYyBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB3YWxrKGMsIGRlcHRoICsgMSk7XG4gICAgfVxuICB9XG4gIHdhbGsoc2VjdGlvbk5vZGUsIDApO1xuICBpZiAobGlua3MubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7IGxpbmtzIH07XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gU2VjdGlvbiBzZW1hbnRpYyByb2xlXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuaW50ZXJmYWNlIEluZmVyVHlwZVBhcmFtcyB7XG4gIHNlY3Rpb25JbmRleDogbnVtYmVyO1xuICB0b3RhbFNlY3Rpb25zOiBudW1iZXI7XG4gIGlzRm9ybVNlY3Rpb246IGJvb2xlYW47XG4gIHBhdHRlcm5zOiBDb21wb25lbnRQYXR0ZXJuW107XG4gIHJlcGVhdGVyczogUmVjb3JkPHN0cmluZywgUmVwZWF0ZXJJbmZvPjtcbiAgZWxlbWVudHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICB0ZXh0Q29udGVudEluT3JkZXI6IEFycmF5PHsgdGV4dDogc3RyaW5nOyBmb250U2l6ZTogbnVtYmVyOyByb2xlOiBzdHJpbmcgfT47XG4gIGxheWVyTmFtZTogc3RyaW5nO1xuICBzZWN0aW9uSGVpZ2h0OiBudW1iZXI7XG4gIGlzR2xvYmFsPzogYm9vbGVhbjtcbiAgZ2xvYmFsUm9sZT86ICdoZWFkZXInIHwgJ2Zvb3RlcicgfCBudWxsO1xufVxuXG4vKipcbiAqIEluZmVyIHRoZSBzZW1hbnRpYyB0eXBlIG9mIGEgc2VjdGlvbi4gUHVyZSBpbmZlcmVuY2UgXHUyMDE0IHJldHVybnMgJ2dlbmVyaWMnXG4gKiArICdsb3cnIGNvbmZpZGVuY2Ugd2hlbiBub3RoaW5nIG1hdGNoZXMgY2xlYXJseS4gVGhlIGFnZW50IHNob3VsZCB0cmVhdFxuICogJ2hpZ2gnIGNvbmZpZGVuY2UgYXMgYXV0aG9yaXRhdGl2ZSBhbmQgJ2xvdycgYXMgYSBoaW50IG9ubHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmZlclNlY3Rpb25UeXBlKHA6IEluZmVyVHlwZVBhcmFtcyk6IHsgdHlwZTogU2VjdGlvblR5cGU7IGNvbmZpZGVuY2U6ICdoaWdoJyB8ICdsb3cnIH0ge1xuICAvLyBHbG9iYWwgaGVhZGVyL2Zvb3RlciBvdmVycmlkZXMgZXZlcnl0aGluZ1xuICBpZiAocC5pc0dsb2JhbCAmJiBwLmdsb2JhbFJvbGUgPT09ICdoZWFkZXInKSByZXR1cm4geyB0eXBlOiAnaGVhZGVyJywgY29uZmlkZW5jZTogJ2hpZ2gnIH07XG4gIGlmIChwLmlzR2xvYmFsICYmIHAuZ2xvYmFsUm9sZSA9PT0gJ2Zvb3RlcicpIHJldHVybiB7IHR5cGU6ICdmb290ZXInLCBjb25maWRlbmNlOiAnaGlnaCcgfTtcblxuICBjb25zdCBuYW1lID0gKHAubGF5ZXJOYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBleHBsaWNpdDogQXJyYXk8eyByeDogUmVnRXhwOyB0eXBlOiBTZWN0aW9uVHlwZSB9PiA9IFtcbiAgICB7IHJ4OiAvXFxiaGVyb1xcYi8sIHR5cGU6ICdoZXJvJyB9LFxuICAgIHsgcng6IC9cXGIoZmVhdHVyZXM/fGJlbmVmaXRzP3xzZXJ2aWNlcz8pXFxiLywgdHlwZTogJ2ZlYXR1cmVzJyB9LFxuICAgIHsgcng6IC9cXGJ0ZXN0aW1vbmlhbHM/XFxiLywgdHlwZTogJ3Rlc3RpbW9uaWFscycgfSxcbiAgICB7IHJ4OiAvXFxiKGN0YXxjYWxsWy0gXT90b1stIF0/YWN0aW9uKVxcYi8sIHR5cGU6ICdjdGEnIH0sXG4gICAgeyByeDogL1xcYihmYXFzP3xmcmVxdWVudGx5Wy0gXWFza2VkKVxcYi8sIHR5cGU6ICdmYXEnIH0sXG4gICAgeyByeDogL1xcYihwcmljaW5nfHBsYW5zPylcXGIvLCB0eXBlOiAncHJpY2luZycgfSxcbiAgICB7IHJ4OiAvXFxiY29udGFjdFxcYi8sIHR5cGU6ICdjb250YWN0JyB9LFxuICAgIHsgcng6IC9cXGIobG9nb3M/fGNsaWVudHM/fHBhcnRuZXJzP3xicmFuZHM/KVxcYi8sIHR5cGU6ICdsb2dvcycgfSxcbiAgICB7IHJ4OiAvXFxiZm9vdGVyXFxiLywgdHlwZTogJ2Zvb3RlcicgfSxcbiAgICB7IHJ4OiAvXFxiKGhlYWRlcnxuYXZ8bmF2YmFyfG5hdmlnYXRpb24pXFxiLywgdHlwZTogJ2hlYWRlcicgfSxcbiAgICB7IHJ4OiAvXFxiKGJsb2d8YXJ0aWNsZXM/fG5ld3N8cG9zdHM/KVxcYi8sIHR5cGU6ICdibG9nX2dyaWQnIH0sXG4gIF07XG4gIGZvciAoY29uc3QgeyByeCwgdHlwZSB9IG9mIGV4cGxpY2l0KSB7XG4gICAgaWYgKHJ4LnRlc3QobmFtZSkpIHJldHVybiB7IHR5cGUsIGNvbmZpZGVuY2U6ICdoaWdoJyB9O1xuICB9XG5cbiAgLy8gUGF0dGVybiBzaWduYWxzXG4gIGlmIChwLnBhdHRlcm5zLnNvbWUocHQgPT4gcHQudHlwZSA9PT0gJ2FjY29yZGlvbicpKSByZXR1cm4geyB0eXBlOiAnZmFxJywgY29uZmlkZW5jZTogJ2hpZ2gnIH07XG4gIGlmIChwLmlzRm9ybVNlY3Rpb24pIHJldHVybiB7IHR5cGU6ICdjb250YWN0JywgY29uZmlkZW5jZTogJ2hpZ2gnIH07XG5cbiAgLy8gUmVwZWF0ZXIgY29udGVudCBzaGFwZVxuICBjb25zdCByZXBLZXlzID0gT2JqZWN0LmtleXMocC5yZXBlYXRlcnMpO1xuICBpZiAocmVwS2V5cy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgcmVwID0gcC5yZXBlYXRlcnNbcmVwS2V5c1swXV07XG4gICAgY29uc3QgZmlyc3QgPSByZXAuaXRlbXNbMF07XG4gICAgaWYgKGZpcnN0KSB7XG4gICAgICBjb25zdCBoYXNJbWFnZSA9ICEhZmlyc3QuaW1hZ2VGaWxlO1xuICAgICAgY29uc3QgdGV4dFZhbHMgPSBPYmplY3QudmFsdWVzKGZpcnN0LnRleHRzKTtcbiAgICAgIGNvbnN0IHRleHRLZXlzID0gT2JqZWN0LmtleXMoZmlyc3QudGV4dHMpO1xuICAgICAgY29uc3Qgam9pbmVkID0gdGV4dFZhbHMuam9pbignICcpO1xuICAgICAgY29uc3QgaGFzUHJpY2UgPSAvWyRcdTIwQUNcdTAwQTNdXFxzKlxcZHxcXGJcXGQrXFxzKihcXC8obW98eXIpfHBlciAobW9udGh8eWVhcikpXFxiL2kudGVzdChqb2luZWQpO1xuICAgICAgY29uc3QgbG9uZ1F1b3RlID0gdGV4dFZhbHMuc29tZSh2ID0+ICh2IHx8ICcnKS5sZW5ndGggPiAxMDApO1xuICAgICAgY29uc3QgaXNMb2dvT25seSA9IGhhc0ltYWdlICYmIHRleHRLZXlzLmxlbmd0aCA9PT0gMDtcbiAgICAgIGNvbnN0IGhhc0RhdGUgPSAvXFxiKGphbnxmZWJ8bWFyfGFwcnxtYXl8anVufGp1bHxhdWd8c2VwfG9jdHxub3Z8ZGVjKVxcdypcXHMrXFxkezEsMn0vaS50ZXN0KGpvaW5lZClcbiAgICAgICAgICAgICAgICAgICB8fCAvXFxkezR9LVxcZHsyfS1cXGR7Mn0vLnRlc3Qoam9pbmVkKVxuICAgICAgICAgICAgICAgICAgIHx8IC9cXGIobWluIHJlYWR8cmVhZGluZyB0aW1lKVxcYi9pLnRlc3Qoam9pbmVkKTtcblxuICAgICAgaWYgKGhhc1ByaWNlKSByZXR1cm4geyB0eXBlOiAncHJpY2luZycsIGNvbmZpZGVuY2U6ICdsb3cnIH07XG4gICAgICBpZiAoaXNMb2dvT25seSkgcmV0dXJuIHsgdHlwZTogJ2xvZ29zJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgICAgIGlmIChoYXNEYXRlKSByZXR1cm4geyB0eXBlOiAnYmxvZ19ncmlkJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgICAgIGlmIChsb25nUXVvdGUpIHJldHVybiB7IHR5cGU6ICd0ZXN0aW1vbmlhbHMnLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICAgICAgaWYgKGhhc0ltYWdlICYmIHRleHRLZXlzLmxlbmd0aCA+PSAyKSByZXR1cm4geyB0eXBlOiAnZmVhdHVyZXMnLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIEZpcnN0LXNlY3Rpb24gaGVybyBoZXVyaXN0aWNcbiAgaWYgKHAuc2VjdGlvbkluZGV4ID09PSAwKSB7XG4gICAgY29uc3QgaGFzQmlnSGVhZGluZyA9IHAudGV4dENvbnRlbnRJbk9yZGVyLnNvbWUodCA9PiB0LmZvbnRTaXplID49IDQwKTtcbiAgICBjb25zdCBoYXNCdXR0b24gPSBPYmplY3Qua2V5cyhwLmVsZW1lbnRzKS5zb21lKGsgPT4gL2J1dHRvbnxjdGF8YnRuL2kudGVzdChrKSk7XG4gICAgY29uc3QgaGFzSW1hZ2UgPSBPYmplY3Qua2V5cyhwLmVsZW1lbnRzKS5zb21lKGsgPT4gL2ltYWdlfHBob3RvfGhlcm8vaS50ZXN0KGspIHx8IGsgPT09ICdiYWNrZ3JvdW5kX2ltYWdlJyk7XG4gICAgaWYgKGhhc0JpZ0hlYWRpbmcgJiYgKGhhc0J1dHRvbiB8fCBoYXNJbWFnZSkpIHJldHVybiB7IHR5cGU6ICdoZXJvJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgfVxuXG4gIC8vIFNob3J0IHNlY3Rpb24gd2l0aCBoZWFkaW5nICsgYnV0dG9uIFx1MjE5MiBDVEFcbiAgY29uc3QgaGFzQnV0dG9uRWwgPSBPYmplY3Qua2V5cyhwLmVsZW1lbnRzKS5maWx0ZXIoayA9PiAvYnV0dG9ufGN0YXxidG4vaS50ZXN0KGspKS5sZW5ndGggPj0gMTtcbiAgY29uc3QgdGV4dENvdW50ID0gcC50ZXh0Q29udGVudEluT3JkZXIubGVuZ3RoO1xuICBpZiAoaGFzQnV0dG9uRWwgJiYgdGV4dENvdW50IDw9IDMgJiYgcmVwS2V5cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4geyB0eXBlOiAnY3RhJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgfVxuXG4gIHJldHVybiB7IHR5cGU6ICdnZW5lcmljJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBDcm9zcy1wYWdlIGZpbmdlcnByaW50IGhlbHBlcnMgKGZvciBnbG9iYWwgZGV0ZWN0aW9uIGluIGV4dHJhY3Rvci50cylcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIHNlY3Rpb24ncyBsYXllciBuYW1lIGZvciBjcm9zcy1wYWdlIG1hdGNoaW5nLlxuICogXCJIZWFkZXIgXHUyMDE0IERlc2t0b3BcIiwgXCJIZWFkZXIgMTQ0MFwiLCBcIkhlYWRlclwiIGFsbCBjb2xsYXBzZSB0byBcImhlYWRlclwiLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU2VjdGlvbk5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIChuYW1lIHx8ICcnKVxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1xccypbXHUyMDE0XHUyMDEzXFwtXVxccyooZGVza3RvcHxtb2JpbGV8dGFibGV0KVxcYi9naSwgJycpXG4gICAgLnJlcGxhY2UoL1xccytcXGR7Myw0fSQvZywgJycpXG4gICAgLnRyaW0oKTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIHRvdGFsIHNlY3Rpb24gY291bnQgYW5kIHRoZSBpbmRleCBvZiBhIGdsb2JhbCBzZWN0aW9uLCBndWVzc1xuICogd2hldGhlciBpdCBpcyBhIGhlYWRlciAodG9wLCB0aGluKSBvciBmb290ZXIgKGJvdHRvbSkgXHUyMDE0IG9yIG51bGwgd2hlblxuICogbmVpdGhlciBmaXRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NpZnlHbG9iYWxSb2xlKFxuICBzZWN0aW9uSW5kZXg6IG51bWJlcixcbiAgdG90YWxTZWN0aW9uczogbnVtYmVyLFxuICBzZWN0aW9uSGVpZ2h0OiBudW1iZXIsXG4pOiAnaGVhZGVyJyB8ICdmb290ZXInIHwgbnVsbCB7XG4gIGlmIChzZWN0aW9uSW5kZXggPD0gMSAmJiBzZWN0aW9uSGVpZ2h0IDw9IDIwMCkgcmV0dXJuICdoZWFkZXInO1xuICBpZiAoc2VjdGlvbkluZGV4ID49IHRvdGFsU2VjdGlvbnMgLSAyKSByZXR1cm4gJ2Zvb3Rlcic7XG4gIHJldHVybiBudWxsO1xufVxuIiwgImltcG9ydCB7IFNlY3Rpb25TcGVjLCBTZWN0aW9uU3R5bGVzLCBFbGVtZW50U3R5bGVzLCBPdmVybGFwSW5mbywgTGF5ZXJJbmZvLCBDb21wb3NpdGlvbkluZm8sIEZvcm1GaWVsZEluZm8sIFRleHRDb250ZW50RW50cnksIENvbXBvbmVudEluc3RhbmNlSW5mbyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgdG9Dc3NWYWx1ZSwgdG9MYXlvdXROYW1lLCBzY3JlZW5zaG90RmlsZW5hbWUsIGNvbXB1dGVBc3BlY3RSYXRpbywgaXNEZWZhdWx0TGF5ZXJOYW1lIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBleHRyYWN0QmFja2dyb3VuZENvbG9yLCBleHRyYWN0R3JhZGllbnQsIGhhc0ltYWdlRmlsbCwgZXh0cmFjdEJvcmRlclN0eWxlLCBleHRyYWN0Qm9yZGVyV2lkdGhzLCBleHRyYWN0U3Ryb2tlQ29sb3IgfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IGV4dHJhY3RUeXBvZ3JhcGh5IH0gZnJvbSAnLi90eXBvZ3JhcGh5JztcbmltcG9ydCB7IGV4dHJhY3RBdXRvTGF5b3V0U3BhY2luZywgZXh0cmFjdEFic29sdXRlU3BhY2luZyB9IGZyb20gJy4vc3BhY2luZyc7XG5pbXBvcnQgeyBkZXRlY3RHcmlkIH0gZnJvbSAnLi9ncmlkJztcbmltcG9ydCB7IGV4dHJhY3RJbnRlcmFjdGlvbnMgfSBmcm9tICcuL2ludGVyYWN0aW9ucyc7XG5pbXBvcnQgeyBleHRyYWN0RWZmZWN0cyB9IGZyb20gJy4vZWZmZWN0cyc7XG5pbXBvcnQgeyB0b0Nzc0N1c3RvbVByb3BlcnR5IH0gZnJvbSAnLi92YXJpYWJsZXMnO1xuaW1wb3J0IHtcbiAgZGV0ZWN0UmVwZWF0ZXJzLCBkZXRlY3RDb21wb25lbnRQYXR0ZXJucywgZGV0ZWN0TmF2aWdhdGlvbixcbiAgaW5mZXJTZWN0aW9uVHlwZSwgbm9ybWFsaXplU2VjdGlvbk5hbWUsIGNsYXNzaWZ5R2xvYmFsUm9sZSxcbn0gZnJvbSAnLi9wYXR0ZXJucyc7XG5cbi8qKlxuICogSWRlbnRpZnkgc2VjdGlvbiBmcmFtZXMgd2l0aGluIGEgcGFnZSBmcmFtZS5cbiAqIFNlY3Rpb25zIGFyZSB0aGUgZGlyZWN0IGNoaWxkcmVuIG9mIHRoZSBwYWdlIGZyYW1lLCBzb3J0ZWQgYnkgWSBwb3NpdGlvbi5cbiAqIElmIHRoZSBmcmFtZSBoYXMgYSBzaW5nbGUgd3JhcHBlciBjaGlsZCwgZHJpbGwgb25lIGxldmVsIGRlZXBlci5cbiAqL1xuZnVuY3Rpb24gaWRlbnRpZnlTZWN0aW9ucyhwYWdlRnJhbWU6IEZyYW1lTm9kZSk6IFNjZW5lTm9kZVtdIHtcbiAgbGV0IGNhbmRpZGF0ZXMgPSBwYWdlRnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICk7XG5cbiAgLy8gSWYgdGhlcmUncyBhIHNpbmdsZSBjb250YWluZXIgY2hpbGQsIGRyaWxsIG9uZSBsZXZlbCBkZWVwZXJcbiAgaWYgKGNhbmRpZGF0ZXMubGVuZ3RoID09PSAxICYmICdjaGlsZHJlbicgaW4gY2FuZGlkYXRlc1swXSkge1xuICAgIGNvbnN0IHdyYXBwZXIgPSBjYW5kaWRhdGVzWzBdIGFzIEZyYW1lTm9kZTtcbiAgICBjb25zdCBpbm5lckNhbmRpZGF0ZXMgPSB3cmFwcGVyLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJylcbiAgICApO1xuICAgIGlmIChpbm5lckNhbmRpZGF0ZXMubGVuZ3RoID4gMSkge1xuICAgICAgY2FuZGlkYXRlcyA9IGlubmVyQ2FuZGlkYXRlcztcbiAgICB9XG4gIH1cblxuICAvLyBTb3J0IGJ5IFkgcG9zaXRpb24gKHRvcCB0byBib3R0b20pXG4gIHJldHVybiBbLi4uY2FuZGlkYXRlc10uc29ydCgoYSwgYikgPT4ge1xuICAgIGNvbnN0IGFZID0gYS5hYnNvbHV0ZUJvdW5kaW5nQm94Py55ID8/IDA7XG4gICAgY29uc3QgYlkgPSBiLmFic29sdXRlQm91bmRpbmdCb3g/LnkgPz8gMDtcbiAgICByZXR1cm4gYVkgLSBiWTtcbiAgfSk7XG59XG5cbi8qKlxuICogRXh0cmFjdCBzZWN0aW9uLWxldmVsIHN0eWxlcyBmcm9tIGEgZnJhbWUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RTZWN0aW9uU3R5bGVzKG5vZGU6IFNjZW5lTm9kZSk6IFNlY3Rpb25TdHlsZXMge1xuICBjb25zdCBiZyA9IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3Iobm9kZSBhcyBhbnkpO1xuICBjb25zdCBncmFkaWVudCA9IGV4dHJhY3RHcmFkaWVudChub2RlIGFzIGFueSk7XG4gIGNvbnN0IGJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgY29uc3QgZWZmZWN0cyA9IGV4dHJhY3RFZmZlY3RzKG5vZGUgYXMgYW55KTtcbiAgY29uc3QgY29ybmVycyA9IGV4dHJhY3RQZXJDb3JuZXJSYWRpdXMobm9kZSBhcyBhbnkpO1xuXG4gIGNvbnN0IHN0eWxlczogU2VjdGlvblN0eWxlcyA9IHtcbiAgICBwYWRkaW5nVG9wOiBudWxsLCAgLy8gU2V0IGJ5IHNwYWNpbmcgZXh0cmFjdG9yXG4gICAgcGFkZGluZ0JvdHRvbTogbnVsbCxcbiAgICBwYWRkaW5nTGVmdDogbnVsbCxcbiAgICBwYWRkaW5nUmlnaHQ6IG51bGwsXG4gICAgYmFja2dyb3VuZENvbG9yOiBiZyxcbiAgICBiYWNrZ3JvdW5kSW1hZ2U6IGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkgPyAndXJsKC4uLiknIDogbnVsbCxcbiAgICBiYWNrZ3JvdW5kR3JhZGllbnQ6IGdyYWRpZW50LFxuICAgIG1pbkhlaWdodDogYm91bmRzID8gdG9Dc3NWYWx1ZShib3VuZHMuaGVpZ2h0KSA6IG51bGwsXG4gICAgb3ZlcmZsb3c6IG51bGwsXG4gICAgYm94U2hhZG93OiBlZmZlY3RzLmJveFNoYWRvdyxcbiAgICBmaWx0ZXI6IGVmZmVjdHMuZmlsdGVyLFxuICAgIGJhY2tkcm9wRmlsdGVyOiBlZmZlY3RzLmJhY2tkcm9wRmlsdGVyLFxuICB9O1xuICBpZiAoY29ybmVycykge1xuICAgIGlmIChjb3JuZXJzLnVuaWZvcm0gIT09IG51bGwpIHtcbiAgICAgIHN0eWxlcy5ib3JkZXJSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudW5pZm9ybSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlcy5ib3JkZXJUb3BMZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnRvcExlZnQpO1xuICAgICAgc3R5bGVzLmJvcmRlclRvcFJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnRvcFJpZ2h0KTtcbiAgICAgIHN0eWxlcy5ib3JkZXJCb3R0b21MZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLmJvdHRvbUxlZnQpO1xuICAgICAgc3R5bGVzLmJvcmRlckJvdHRvbVJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLmJvdHRvbVJpZ2h0KTtcbiAgICB9XG4gIH1cbiAgYXBwbHlTdHJva2VzKHN0eWxlcywgbm9kZSk7XG4gIGlmICgnb3BhY2l0eScgaW4gbm9kZSAmJiB0eXBlb2YgKG5vZGUgYXMgYW55KS5vcGFjaXR5ID09PSAnbnVtYmVyJyAmJiAobm9kZSBhcyBhbnkpLm9wYWNpdHkgPCAxKSB7XG4gICAgc3R5bGVzLm9wYWNpdHkgPSBNYXRoLnJvdW5kKChub2RlIGFzIGFueSkub3BhY2l0eSAqIDEwMCkgLyAxMDA7XG4gIH1cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHBlci1jb3JuZXIgYm9yZGVyLXJhZGl1cyBmcm9tIGEgbm9kZS4gRmlnbWEgc3RvcmVzXG4gKiB0b3BMZWZ0UmFkaXVzIC8gdG9wUmlnaHRSYWRpdXMgLyBib3R0b21MZWZ0UmFkaXVzIC8gYm90dG9tUmlnaHRSYWRpdXNcbiAqIGFzIGluZGl2aWR1YWwgcHJvcGVydGllcyBvbiBSZWN0YW5nbGVOb2RlIGFuZCBGcmFtZU5vZGUuIFdoZW4gdGhlXG4gKiB1bmlmb3JtIGNvcm5lclJhZGl1cyBpcyBhIG51bWJlciwgYWxsIGZvdXIgYXJlIGVxdWFsLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSBub2RlIGhhcyBubyBjb3JuZXIgZGF0YS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFBlckNvcm5lclJhZGl1cyhub2RlOiBhbnkpOiB7XG4gIHRvcExlZnQ6IG51bWJlcjsgdG9wUmlnaHQ6IG51bWJlcjsgYm90dG9tTGVmdDogbnVtYmVyOyBib3R0b21SaWdodDogbnVtYmVyOyB1bmlmb3JtOiBudW1iZXIgfCBudWxsO1xufSB8IG51bGwge1xuICBjb25zdCBuID0gbm9kZSBhcyBhbnk7XG4gIGNvbnN0IGNyID0gbi5jb3JuZXJSYWRpdXM7XG4gIGNvbnN0IHRsID0gdHlwZW9mIG4udG9wTGVmdFJhZGl1cyA9PT0gJ251bWJlcicgPyBuLnRvcExlZnRSYWRpdXMgOiBudWxsO1xuICBjb25zdCB0ciA9IHR5cGVvZiBuLnRvcFJpZ2h0UmFkaXVzID09PSAnbnVtYmVyJyA/IG4udG9wUmlnaHRSYWRpdXMgOiBudWxsO1xuICBjb25zdCBibCA9IHR5cGVvZiBuLmJvdHRvbUxlZnRSYWRpdXMgPT09ICdudW1iZXInID8gbi5ib3R0b21MZWZ0UmFkaXVzIDogbnVsbDtcbiAgY29uc3QgYnIgPSB0eXBlb2Ygbi5ib3R0b21SaWdodFJhZGl1cyA9PT0gJ251bWJlcicgPyBuLmJvdHRvbVJpZ2h0UmFkaXVzIDogbnVsbDtcblxuICBpZiAodHlwZW9mIGNyID09PSAnbnVtYmVyJyAmJiB0bCA9PT0gbnVsbCkge1xuICAgIC8vIFVuaWZvcm0gY29ybmVycyAob3IgY29ybmVyUmFkaXVzIGlzIHRoZSBtaXhlZCBzeW1ib2wpXG4gICAgaWYgKGNyID09PSAwKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4geyB0b3BMZWZ0OiBjciwgdG9wUmlnaHQ6IGNyLCBib3R0b21MZWZ0OiBjciwgYm90dG9tUmlnaHQ6IGNyLCB1bmlmb3JtOiBjciB9O1xuICB9XG4gIGlmICh0bCAhPT0gbnVsbCB8fCB0ciAhPT0gbnVsbCB8fCBibCAhPT0gbnVsbCB8fCBiciAhPT0gbnVsbCkge1xuICAgIHJldHVybiB7XG4gICAgICB0b3BMZWZ0OiB0bCB8fCAwLFxuICAgICAgdG9wUmlnaHQ6IHRyIHx8IDAsXG4gICAgICBib3R0b21MZWZ0OiBibCB8fCAwLFxuICAgICAgYm90dG9tUmlnaHQ6IGJyIHx8IDAsXG4gICAgICB1bmlmb3JtOiAodGwgPT09IHRyICYmIHRyID09PSBibCAmJiBibCA9PT0gYnIpID8gKHRsIHx8IDApIDogbnVsbCxcbiAgICB9O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEFwcGx5IHBlci1jb3JuZXIgcmFkaXVzLiBJZiBhbGwgNCBhcmUgZXF1YWwsIGVtaXQgYm9yZGVyUmFkaXVzIHNob3J0aGFuZDtcbiAqIG90aGVyd2lzZSBlbWl0IHRoZSA0IGV4cGxpY2l0IHZhbHVlcy4gV29ya3Mgb24gRWxlbWVudFN0eWxlcyBvciBTZWN0aW9uU3R5bGVzLlxuICovXG5mdW5jdGlvbiBhcHBseVJhZGl1cyhlbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ICYgUGFydGlhbDxTZWN0aW9uU3R5bGVzPiwgbm9kZTogYW55KTogdm9pZCB7XG4gIGNvbnN0IGNvcm5lcnMgPSBleHRyYWN0UGVyQ29ybmVyUmFkaXVzKG5vZGUpO1xuICBpZiAoIWNvcm5lcnMpIHJldHVybjtcbiAgaWYgKGNvcm5lcnMudW5pZm9ybSAhPT0gbnVsbCkge1xuICAgIGVsZW0uYm9yZGVyUmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnVuaWZvcm0pO1xuICAgIHJldHVybjtcbiAgfVxuICBlbGVtLmJvcmRlclRvcExlZnRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudG9wTGVmdCk7XG4gIGVsZW0uYm9yZGVyVG9wUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudG9wUmlnaHQpO1xuICBlbGVtLmJvcmRlckJvdHRvbUxlZnRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMuYm90dG9tTGVmdCk7XG4gIGVsZW0uYm9yZGVyQm90dG9tUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMuYm90dG9tUmlnaHQpO1xufVxuXG4vKipcbiAqIEFwcGx5IHN0cm9rZXM6IHBlci1zaWRlIGJvcmRlci13aWR0aCB3aGVuIEZpZ21hIGhhcyBpbmRpdmlkdWFsU3Ryb2tlV2VpZ2h0cyxcbiAqIHNpbmdsZSBib3JkZXJXaWR0aCBvdGhlcndpc2UuIEFsc28gbWFwcyBzdHlsZSAoc29saWQvZGFzaGVkL2RvdHRlZCkgYW5kXG4gKiBjb2xvci4gV29ya3Mgb24gRWxlbWVudFN0eWxlcyBvciBTZWN0aW9uU3R5bGVzLlxuICovXG5mdW5jdGlvbiBhcHBseVN0cm9rZXMoZWxlbTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiAmIFBhcnRpYWw8U2VjdGlvblN0eWxlcz4sIG5vZGU6IGFueSk6IHZvaWQge1xuICBjb25zdCBjb2xvciA9IGV4dHJhY3RTdHJva2VDb2xvcihub2RlKTtcbiAgY29uc3Qgd2lkdGhzID0gZXh0cmFjdEJvcmRlcldpZHRocyhub2RlKTtcbiAgY29uc3Qgc3R5bGUgPSBleHRyYWN0Qm9yZGVyU3R5bGUobm9kZSk7XG4gIGlmICghY29sb3IpIHJldHVybjtcblxuICBpZiAod2lkdGhzLnVuaWZvcm0gIT09IG51bGwpIHtcbiAgICBlbGVtLmJvcmRlcldpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMudW5pZm9ybSk7XG4gICAgZWxlbS5ib3JkZXJDb2xvciA9IGNvbG9yO1xuICAgIGVsZW0uYm9yZGVyU3R5bGUgPSBzdHlsZTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHdpZHRocy50b3AgfHwgd2lkdGhzLnJpZ2h0IHx8IHdpZHRocy5ib3R0b20gfHwgd2lkdGhzLmxlZnQpIHtcbiAgICBpZiAod2lkdGhzLnRvcCkgZWxlbS5ib3JkZXJUb3BXaWR0aCA9IHRvQ3NzVmFsdWUod2lkdGhzLnRvcCk7XG4gICAgaWYgKHdpZHRocy5yaWdodCkgZWxlbS5ib3JkZXJSaWdodFdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMucmlnaHQpO1xuICAgIGlmICh3aWR0aHMuYm90dG9tKSBlbGVtLmJvcmRlckJvdHRvbVdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMuYm90dG9tKTtcbiAgICBpZiAod2lkdGhzLmxlZnQpIGVsZW0uYm9yZGVyTGVmdFdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMubGVmdCk7XG4gICAgZWxlbS5ib3JkZXJDb2xvciA9IGNvbG9yO1xuICAgIGVsZW0uYm9yZGVyU3R5bGUgPSBzdHlsZTtcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3Qgb2JqZWN0LXBvc2l0aW9uIGZyb20gYW4gaW1hZ2UgZmlsbCdzIGltYWdlVHJhbnNmb3JtIChjcm9wIG9mZnNldCkuXG4gKiBGaWdtYSdzIGltYWdlVHJhbnNmb3JtIGlzIGEgMngzIGFmZmluZSBtYXRyaXguIFdoZW4gdGhlIGltYWdlIGhhcyBiZWVuXG4gKiBjcm9wcGVkL3JlcG9zaXRpb25lZCBpbiBGaWdtYSwgdGhlIHRyYW5zbGF0aW9uIGNvbXBvbmVudHMgdGVsbCB1cyB0aGVcbiAqIGZvY2FsIHBvaW50LiBNYXAgdG8gQ1NTIG9iamVjdC1wb3NpdGlvbiAvIGJhY2tncm91bmQtcG9zaXRpb24uXG4gKlxuICogUmV0dXJucyBudWxsIHdoZW4gdGhlIGltYWdlIGlzIGNlbnRlcmVkIChkZWZhdWx0KSwgb3Igd2hlbiBub2RlIGhhcyBub1xuICogaW1hZ2VUcmFuc2Zvcm0gZGF0YS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdE9iamVjdFBvc2l0aW9uKG5vZGU6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiBudWxsO1xuICBjb25zdCBpbWdGaWxsID0gbm9kZS5maWxscy5maW5kKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpIGFzIEltYWdlUGFpbnQgfCB1bmRlZmluZWQ7XG4gIGlmICghaW1nRmlsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHQgPSAoaW1nRmlsbCBhcyBhbnkpLmltYWdlVHJhbnNmb3JtIGFzIG51bWJlcltdW10gfCB1bmRlZmluZWQ7XG4gIGlmICghdCB8fCAhQXJyYXkuaXNBcnJheSh0KSB8fCB0Lmxlbmd0aCA8IDIpIHJldHVybiBudWxsO1xuICAvLyBpbWFnZVRyYW5zZm9ybSBpcyBhIDJ4MyBtYXRyaXg6IFtbYSwgYiwgdHhdLCBbYywgZCwgdHldXVxuICAvLyB0eC90eSBhcmUgbm9ybWFsaXplZCAoMC4uMSkgdHJhbnNsYXRpb24gXHUyMDE0IDAgPSBsZWZ0L3RvcCwgMC41ID0gY2VudGVyXG4gIGNvbnN0IHR4ID0gdFswXSAmJiB0eXBlb2YgdFswXVsyXSA9PT0gJ251bWJlcicgPyB0WzBdWzJdIDogMC41O1xuICBjb25zdCB0eSA9IHRbMV0gJiYgdHlwZW9mIHRbMV1bMl0gPT09ICdudW1iZXInID8gdFsxXVsyXSA6IDAuNTtcbiAgLy8gRGVmYXVsdCAoY2VudGVyZWQpIFx1MjE5MiBudWxsIChicm93c2VyIHVzZXMgXCI1MCUgNTAlXCIgYnkgZGVmYXVsdClcbiAgaWYgKE1hdGguYWJzKHR4IC0gMC41KSA8IDAuMDEgJiYgTWF0aC5hYnModHkgLSAwLjUpIDwgMC4wMSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHhQY3QgPSBNYXRoLnJvdW5kKHR4ICogMTAwKTtcbiAgY29uc3QgeVBjdCA9IE1hdGgucm91bmQodHkgKiAxMDApO1xuICByZXR1cm4gYCR7eFBjdH0lICR7eVBjdH0lYDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRyYW5zZm9ybSAocm90YXRpb24gKyBzY2FsZSkgZnJvbSBhIG5vZGUncyByZWxhdGl2ZVRyYW5zZm9ybS5cbiAqIEZpZ21hJ3MgcmVsYXRpdmVUcmFuc2Zvcm0gaXMgYSAyeDMgbWF0cml4IFx1MjAxNCB3ZSBkZWNvbXBvc2UgaXQgdG8gcm90YXRpb25cbiAqIGFuZCBzY2FsZSB3aGVuIHRoZXkncmUgbm9uLWlkZW50aXR5LlxuICovXG5mdW5jdGlvbiBleHRyYWN0VHJhbnNmb3JtKG5vZGU6IGFueSk6IHsgdHJhbnNmb3JtOiBzdHJpbmcgfCBudWxsIH0ge1xuICBjb25zdCBydCA9IG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0gYXMgbnVtYmVyW11bXSB8IHVuZGVmaW5lZDtcbiAgaWYgKCFydCB8fCAhQXJyYXkuaXNBcnJheShydCkgfHwgcnQubGVuZ3RoIDwgMikgcmV0dXJuIHsgdHJhbnNmb3JtOiBudWxsIH07XG4gIC8vIEV4dHJhY3Qgcm90YXRpb24gZnJvbSB0aGUgbWF0cml4OiBhbmdsZSA9IGF0YW4yKG1bMV1bMF0sIG1bMF1bMF0pXG4gIGNvbnN0IGEgPSBydFswXVswXSwgYiA9IHJ0WzBdWzFdLCBjID0gcnRbMV1bMF0sIGQgPSBydFsxXVsxXTtcbiAgY29uc3QgcmFkaWFucyA9IE1hdGguYXRhbjIoYywgYSk7XG4gIGNvbnN0IGRlZ3JlZXMgPSBNYXRoLnJvdW5kKChyYWRpYW5zICogMTgwKSAvIE1hdGguUEkpO1xuICBjb25zdCBzY2FsZVggPSBNYXRoLnNxcnQoYSAqIGEgKyBjICogYyk7XG4gIGNvbnN0IHNjYWxlWSA9IE1hdGguc3FydChiICogYiArIGQgKiBkKTtcblxuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgaWYgKE1hdGguYWJzKGRlZ3JlZXMpID4gMC41KSBwYXJ0cy5wdXNoKGByb3RhdGUoJHtkZWdyZWVzfWRlZylgKTtcbiAgaWYgKE1hdGguYWJzKHNjYWxlWCAtIDEpID4gMC4wMikgcGFydHMucHVzaChgc2NhbGVYKCR7TWF0aC5yb3VuZChzY2FsZVggKiAxMDApIC8gMTAwfSlgKTtcbiAgaWYgKE1hdGguYWJzKHNjYWxlWSAtIDEpID4gMC4wMikgcGFydHMucHVzaChgc2NhbGVZKCR7TWF0aC5yb3VuZChzY2FsZVkgKiAxMDApIC8gMTAwfSlgKTtcblxuICByZXR1cm4geyB0cmFuc2Zvcm06IHBhcnRzLmxlbmd0aCA+IDAgPyBwYXJ0cy5qb2luKCcgJykgOiBudWxsIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCBmbGV4LWdyb3cgLyBmbGV4LWJhc2lzIC8gYWxpZ24tc2VsZiBmb3IgYXV0by1sYXlvdXQgY2hpbGRyZW4uXG4gKiBGaWdtYSdzIGxheW91dEdyb3cgaXMgMCBvciAxOyBsYXlvdXRBbGlnbiBpcyBJTkhFUklUIC8gU1RSRVRDSCAvIE1JTiAvIENFTlRFUiAvIE1BWC5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEZsZXhDaGlsZFByb3BzKG5vZGU6IGFueSk6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4ge1xuICBjb25zdCBvdXQ6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7fTtcbiAgaWYgKHR5cGVvZiBub2RlLmxheW91dEdyb3cgPT09ICdudW1iZXInKSB7XG4gICAgb3V0LmZsZXhHcm93ID0gbm9kZS5sYXlvdXRHcm93O1xuICB9XG4gIGlmIChub2RlLmxheW91dEFsaWduKSB7XG4gICAgc3dpdGNoIChub2RlLmxheW91dEFsaWduKSB7XG4gICAgICBjYXNlICdTVFJFVENIJzogb3V0LmFsaWduU2VsZiA9ICdzdHJldGNoJzsgYnJlYWs7XG4gICAgICBjYXNlICdNSU4nOiBvdXQuYWxpZ25TZWxmID0gJ2ZsZXgtc3RhcnQnOyBicmVhaztcbiAgICAgIGNhc2UgJ0NFTlRFUic6IG91dC5hbGlnblNlbGYgPSAnY2VudGVyJzsgYnJlYWs7XG4gICAgICBjYXNlICdNQVgnOiBvdXQuYWxpZ25TZWxmID0gJ2ZsZXgtZW5kJzsgYnJlYWs7XG4gICAgICBkZWZhdWx0OiBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDb21wdXRlIHBlci1zaWRlIG1hcmdpbiBmb3IgYSBub2RlIGJhc2VkIG9uIHNpYmxpbmcgcG9zaXRpb25zIGluIGl0c1xuICogcGFyZW50IGNvbnRhaW5lci4gUmV0dXJucyBvbmx5IHRoZSBzaWRlcyB0aGF0IGhhdmUgYSBjbGVhciBub24temVyb1xuICogbWFyZ2luIChwcmV2aW91cyBzaWJsaW5nIG9uIHRvcCwgbmV4dCBzaWJsaW5nIGJlbG93LCBwYXJlbnQgYm91bmRzIGZvclxuICogbGVmdC9yaWdodCB3aGVuIHBhcmVudCB3aWR0aCBpcyBrbm93bikuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RQZXJTaWRlTWFyZ2lucyhub2RlOiBTY2VuZU5vZGUpOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+IHtcbiAgY29uc3Qgb3V0OiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge307XG4gIGlmICghbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94IHx8ICFub2RlLnBhcmVudCB8fCAhKCdjaGlsZHJlbicgaW4gbm9kZS5wYXJlbnQpKSByZXR1cm4gb3V0O1xuXG4gIGNvbnN0IHNpYmxpbmdzID0gKG5vZGUucGFyZW50IGFzIEZyYW1lTm9kZSkuY2hpbGRyZW47XG4gIGNvbnN0IGlkeCA9IHNpYmxpbmdzLmluZGV4T2Yobm9kZSk7XG4gIGNvbnN0IGJiID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuXG4gIC8vIEJvdHRvbTogZ2FwIHRvIG5leHQgc2libGluZ1xuICBpZiAoaWR4ID49IDAgJiYgaWR4IDwgc2libGluZ3MubGVuZ3RoIC0gMSkge1xuICAgIGNvbnN0IG5leHQgPSBzaWJsaW5nc1tpZHggKyAxXTtcbiAgICBpZiAobmV4dC5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICBjb25zdCBnYXAgPSBuZXh0LmFic29sdXRlQm91bmRpbmdCb3gueSAtIChiYi55ICsgYmIuaGVpZ2h0KTtcbiAgICAgIGlmIChnYXAgPiAwKSBvdXQubWFyZ2luQm90dG9tID0gdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKGdhcCkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRvcDogZ2FwIHRvIHByZXZpb3VzIHNpYmxpbmcgKGZvciBhYnNvbHV0ZS1wb3NpdGlvbiBsYXlvdXRzKVxuICBpZiAoaWR4ID4gMCkge1xuICAgIGNvbnN0IHByZXYgPSBzaWJsaW5nc1tpZHggLSAxXTtcbiAgICBpZiAocHJldi5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICBjb25zdCBnYXAgPSBiYi55IC0gKHByZXYuYWJzb2x1dGVCb3VuZGluZ0JveC55ICsgcHJldi5hYnNvbHV0ZUJvdW5kaW5nQm94LmhlaWdodCk7XG4gICAgICBpZiAoZ2FwID4gMCkgb3V0Lm1hcmdpblRvcCA9IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChnYXApKTtcbiAgICB9XG4gIH1cblxuICAvLyBMZWZ0L3JpZ2h0OiBpbnNldCBmcm9tIHBhcmVudCBlZGdlc1xuICBjb25zdCBwYXJlbnRCQiA9IChub2RlLnBhcmVudCBhcyBGcmFtZU5vZGUpLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGlmIChwYXJlbnRCQikge1xuICAgIGNvbnN0IGxlZnRHYXAgPSBiYi54IC0gcGFyZW50QkIueDtcbiAgICBjb25zdCByaWdodEdhcCA9IChwYXJlbnRCQi54ICsgcGFyZW50QkIud2lkdGgpIC0gKGJiLnggKyBiYi53aWR0aCk7XG4gICAgLy8gT25seSBlbWl0IHdoZW4gZWxlbWVudCBpcyBub3QgY2VudGVyZWQgKHNpZ25pZmljYW50IGFzeW1tZXRyaWMgbWFyZ2luKVxuICAgIGlmIChNYXRoLmFicyhsZWZ0R2FwIC0gcmlnaHRHYXApID4gOCAmJiBsZWZ0R2FwID4gMCkge1xuICAgICAgb3V0Lm1hcmdpbkxlZnQgPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQobGVmdEdhcCkpO1xuICAgIH1cbiAgICBpZiAoTWF0aC5hYnMobGVmdEdhcCAtIHJpZ2h0R2FwKSA+IDggJiYgcmlnaHRHYXAgPiAwKSB7XG4gICAgICBvdXQubWFyZ2luUmlnaHQgPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQocmlnaHRHYXApKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgcHJvdG90eXBlIG5hdmlnYXRpb24gVVJMIGZvciBhIG5vZGUuIEZpZ21hIHN1cHBvcnRzXG4gKiBPUEVOX1VSTCBhY3Rpb25zIGluIHJlYWN0aW9ucyBcdTIwMTQgbWFwIHRvIGxpbmtVcmwuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RMaW5rVXJsKG5vZGU6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCByZWFjdGlvbnMgPSBub2RlLnJlYWN0aW9ucztcbiAgaWYgKCFyZWFjdGlvbnMgfHwgIUFycmF5LmlzQXJyYXkocmVhY3Rpb25zKSkgcmV0dXJuIG51bGw7XG4gIGZvciAoY29uc3QgciBvZiByZWFjdGlvbnMpIHtcbiAgICBjb25zdCBhY3Rpb25zID0gci5hY3Rpb25zIHx8IChyLmFjdGlvbiA/IFtyLmFjdGlvbl0gOiBbXSk7XG4gICAgZm9yIChjb25zdCBhIG9mIGFjdGlvbnMpIHtcbiAgICAgIGlmIChhICYmIGEudHlwZSA9PT0gJ1VSTCcgJiYgYS51cmwpIHJldHVybiBhLnVybDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBGaWdtYSBzaXppbmcgbW9kZXMgKEh1ZyAvIEZpbGwgLyBGaXhlZCkuIFRoZXNlIHRlbGwgdGhlIGFnZW50XG4gKiB3aGV0aGVyIGFuIGVsZW1lbnQgc2hvdWxkIGJlIHdpZHRoOmF1dG8sIHdpZHRoOjEwMCUsIG9yIGEgZml4ZWQgcHggc2l6ZSBcdTIwMTRcbiAqIGNyaXRpY2FsIGZvciBjb3JyZWN0IHJlc3BvbnNpdmUgYmVoYXZpb3IuIFJldHVybnMgbnVsbCBmb3IgZWFjaCBheGlzIHdoZW5cbiAqIHRoZSBtb2RlIGlzIG1pc3NpbmcgKG9sZGVyIEZpZ21hIHZlcnNpb25zLCBub24tYXV0by1sYXlvdXQgY29udGV4dHMpLlxuICovXG5mdW5jdGlvbiBleHRyYWN0U2l6aW5nTW9kZXMobm9kZTogYW55KTogeyB3aWR0aE1vZGU6ICdodWcnfCdmaWxsJ3wnZml4ZWQnfG51bGw7IGhlaWdodE1vZGU6ICdodWcnfCdmaWxsJ3wnZml4ZWQnfG51bGwgfSB7XG4gIGNvbnN0IG1hcCA9IChtOiBzdHJpbmcgfCB1bmRlZmluZWQpOiAnaHVnJ3wnZmlsbCd8J2ZpeGVkJ3xudWxsID0+IHtcbiAgICBpZiAobSA9PT0gJ0hVRycpIHJldHVybiAnaHVnJztcbiAgICBpZiAobSA9PT0gJ0ZJTEwnKSByZXR1cm4gJ2ZpbGwnO1xuICAgIGlmIChtID09PSAnRklYRUQnKSByZXR1cm4gJ2ZpeGVkJztcbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aE1vZGU6IG1hcChub2RlLmxheW91dFNpemluZ0hvcml6b250YWwpLFxuICAgIGhlaWdodE1vZGU6IG1hcChub2RlLmxheW91dFNpemluZ1ZlcnRpY2FsKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IEZpZ21hIFZhcmlhYmxlIGJpbmRpbmdzIG9uIGEgbm9kZSdzIHByb3BlcnRpZXMuIFJldHVybnMgQ1NTIGN1c3RvbVxuICogcHJvcGVydHkgcmVmZXJlbmNlcyAoZS5nLiBcInZhcigtLWNsci1wcmltYXJ5KVwiKSBrZXllZCBieSBDU1MgcHJvcGVydHkgbmFtZS5cbiAqIFdoZW4gdmFyaWFibGVzIGFyZSBib3VuZCwgdGhlIGFnZW50IHNob3VsZCBlbWl0IHRoZXNlIHJlZmVyZW5jZXMgaW5zdGVhZFxuICogb2YgdGhlIHJlc29sdmVkIHJhdyBoZXgvcHggdmFsdWVzIHNvIHRva2VuIGNoYW5nZXMgaW4gRmlnbWEgcHJvcGFnYXRlLlxuICovXG5mdW5jdGlvbiBleHRyYWN0Qm91bmRWYXJpYWJsZXMobm9kZTogYW55KTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IG51bGwge1xuICBjb25zdCBidiA9IG5vZGUuYm91bmRWYXJpYWJsZXM7XG4gIGlmICghYnYgfHwgdHlwZW9mIGJ2ICE9PSAnb2JqZWN0JykgcmV0dXJuIG51bGw7XG4gIGlmICghZmlnbWEudmFyaWFibGVzIHx8IHR5cGVvZiAoZmlnbWEudmFyaWFibGVzIGFzIGFueSkuZ2V0VmFyaWFibGVCeUlkICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICBjb25zdCByZXNvbHZlID0gKGFsaWFzOiBhbnkpOiBzdHJpbmcgfCBudWxsID0+IHtcbiAgICBpZiAoIWFsaWFzIHx8ICFhbGlhcy5pZCkgcmV0dXJuIG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHYgPSAoZmlnbWEudmFyaWFibGVzIGFzIGFueSkuZ2V0VmFyaWFibGVCeUlkKGFsaWFzLmlkKTtcbiAgICAgIGlmICghdikgcmV0dXJuIG51bGw7XG4gICAgICBsZXQgY29sTmFtZSA9ICcnO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY29sID0gKGZpZ21hLnZhcmlhYmxlcyBhcyBhbnkpLmdldFZhcmlhYmxlQ29sbGVjdGlvbkJ5SWQ/Lih2LnZhcmlhYmxlQ29sbGVjdGlvbklkKTtcbiAgICAgICAgY29sTmFtZSA9IGNvbD8ubmFtZSB8fCAnJztcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIHJldHVybiBgdmFyKCR7dG9Dc3NDdXN0b21Qcm9wZXJ0eSh2Lm5hbWUsIGNvbE5hbWUpfSlgO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9O1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGJ2LmZpbGxzKSAmJiBidi5maWxsc1swXSkge1xuICAgIGNvbnN0IHJlZiA9IHJlc29sdmUoYnYuZmlsbHNbMF0pO1xuICAgIGlmIChyZWYpIG91dFtub2RlLnR5cGUgPT09ICdURVhUJyA/ICdjb2xvcicgOiAnYmFja2dyb3VuZENvbG9yJ10gPSByZWY7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkoYnYuc3Ryb2tlcykgJiYgYnYuc3Ryb2tlc1swXSkge1xuICAgIGNvbnN0IHJlZiA9IHJlc29sdmUoYnYuc3Ryb2tlc1swXSk7XG4gICAgaWYgKHJlZikgb3V0LmJvcmRlckNvbG9yID0gcmVmO1xuICB9XG4gIGNvbnN0IG51bWVyaWNNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgcGFkZGluZ1RvcDogJ3BhZGRpbmdUb3AnLCBwYWRkaW5nQm90dG9tOiAncGFkZGluZ0JvdHRvbScsXG4gICAgcGFkZGluZ0xlZnQ6ICdwYWRkaW5nTGVmdCcsIHBhZGRpbmdSaWdodDogJ3BhZGRpbmdSaWdodCcsXG4gICAgaXRlbVNwYWNpbmc6ICdnYXAnLFxuICAgIGNvcm5lclJhZGl1czogJ2JvcmRlclJhZGl1cycsXG4gICAgdG9wTGVmdFJhZGl1czogJ2JvcmRlclRvcExlZnRSYWRpdXMnLCB0b3BSaWdodFJhZGl1czogJ2JvcmRlclRvcFJpZ2h0UmFkaXVzJyxcbiAgICBib3R0b21MZWZ0UmFkaXVzOiAnYm9yZGVyQm90dG9tTGVmdFJhZGl1cycsIGJvdHRvbVJpZ2h0UmFkaXVzOiAnYm9yZGVyQm90dG9tUmlnaHRSYWRpdXMnLFxuICAgIHN0cm9rZVdlaWdodDogJ2JvcmRlcldpZHRoJyxcbiAgICBmb250U2l6ZTogJ2ZvbnRTaXplJywgbGluZUhlaWdodDogJ2xpbmVIZWlnaHQnLCBsZXR0ZXJTcGFjaW5nOiAnbGV0dGVyU3BhY2luZycsXG4gIH07XG4gIGZvciAoY29uc3QgW2ZpZ21hS2V5LCBjc3NLZXldIG9mIE9iamVjdC5lbnRyaWVzKG51bWVyaWNNYXApKSB7XG4gICAgaWYgKGJ2W2ZpZ21hS2V5XSkge1xuICAgICAgY29uc3QgcmVmID0gcmVzb2x2ZShidltmaWdtYUtleV0pO1xuICAgICAgaWYgKHJlZikgb3V0W2Nzc0tleV0gPSByZWY7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKG91dCkubGVuZ3RoID4gMCA/IG91dCA6IG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBjb21wb25lbnQtaW5zdGFuY2UgbWV0YWRhdGE6IG1haW4gY29tcG9uZW50IG5hbWUgKyB2YXJpYW50XG4gKiAvIGJvb2xlYW4gLyB0ZXh0IHByb3BlcnRpZXMuIFJldHVybnMgbnVsbCBmb3Igbm9uLWluc3RhbmNlIG5vZGVzLlxuICogVGhpcyBpcyB0aGUga2V5IHNpZ25hbCB0aGUgYWdlbnQgdXNlcyB0byBkZWR1cGUgcmVwZWF0ZWQgY2FyZHMsIGJ1dHRvbnMsXG4gKiBhbmQgaWNvbnMgaW50byBzaGFyZWQgQUNGIGJsb2NrcyBpbnN0ZWFkIG9mIGlubGluaW5nIGVhY2ggb25lLlxuICovXG5mdW5jdGlvbiBleHRyYWN0Q29tcG9uZW50SW5zdGFuY2Uobm9kZTogU2NlbmVOb2RlKTogQ29tcG9uZW50SW5zdGFuY2VJbmZvIHwgbnVsbCB7XG4gIGlmIChub2RlLnR5cGUgIT09ICdJTlNUQU5DRScpIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IGluc3QgPSBub2RlIGFzIEluc3RhbmNlTm9kZTtcbiAgICBsZXQgbmFtZSA9IGluc3QubmFtZTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWFpbiA9IGluc3QubWFpbkNvbXBvbmVudDtcbiAgICAgIGlmIChtYWluKSB7XG4gICAgICAgIG5hbWUgPSBtYWluLnBhcmVudD8udHlwZSA9PT0gJ0NPTVBPTkVOVF9TRVQnID8gKG1haW4ucGFyZW50IGFzIGFueSkubmFtZSA6IG1haW4ubmFtZTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gICAgY29uc3QgcHJvcGVydGllczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgYm9vbGVhbiB8IG51bWJlcj4gPSB7fTtcbiAgICBjb25zdCBwcm9wcyA9IChpbnN0IGFzIGFueSkuY29tcG9uZW50UHJvcGVydGllcztcbiAgICBpZiAocHJvcHMgJiYgdHlwZW9mIHByb3BzID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWxdIG9mIE9iamVjdC5lbnRyaWVzKHByb3BzKSkge1xuICAgICAgICBjb25zdCB2ID0gKHZhbCBhcyBhbnkpPy52YWx1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdiA9PT0gJ2Jvb2xlYW4nIHx8IHR5cGVvZiB2ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHByb3BlcnRpZXNba2V5XSA9IHY7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgbmFtZSwgcHJvcGVydGllcyB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3QgYWx0IHRleHQgZm9yIGFuIGltYWdlLiBTb3VyY2UgcHJpb3JpdHk6IGNvbXBvbmVudCBkZXNjcmlwdGlvblxuICogKGZvciBJTlNUQU5DRSAvIENPTVBPTkVOVCBub2RlcykgXHUyMTkyIGh1bWFuaXplZCBsYXllciBuYW1lLiBSZXR1cm5zIGVtcHR5XG4gKiBzdHJpbmcgd2hlbiB0aGUgbGF5ZXIgaXMgbmFtZWQgZ2VuZXJpY2FsbHkgKFJlY3RhbmdsZSAxMiwgSW1hZ2UgMywgZXRjLikuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RBbHRUZXh0KG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJykge1xuICAgICAgY29uc3QgbWFpbiA9IChub2RlIGFzIEluc3RhbmNlTm9kZSkubWFpbkNvbXBvbmVudDtcbiAgICAgIGlmIChtYWluICYmIG1haW4uZGVzY3JpcHRpb24gJiYgbWFpbi5kZXNjcmlwdGlvbi50cmltKCkpIHJldHVybiBtYWluLmRlc2NyaXB0aW9uLnRyaW0oKTtcbiAgICB9XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcpIHtcbiAgICAgIGNvbnN0IGRlc2MgPSAobm9kZSBhcyBDb21wb25lbnROb2RlKS5kZXNjcmlwdGlvbjtcbiAgICAgIGlmIChkZXNjICYmIGRlc2MudHJpbSgpKSByZXR1cm4gZGVzYy50cmltKCk7XG4gICAgfVxuICB9IGNhdGNoIHt9XG4gIGlmICghbm9kZS5uYW1lIHx8IGlzRGVmYXVsdExheWVyTmFtZShub2RlLm5hbWUpKSByZXR1cm4gJyc7XG4gIHJldHVybiBub2RlLm5hbWUucmVwbGFjZSgvWy1fXS9nLCAnICcpLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKCkucmVwbGFjZSgvXFxiXFx3L2csIGMgPT4gYy50b1VwcGVyQ2FzZSgpKTtcbn1cblxuLyoqXG4gKiBNYXAgRmlnbWEncyBJTUFHRSBmaWxsIHNjYWxlTW9kZSB0byBDU1Mgb2JqZWN0LWZpdC5cbiAqICAgRklMTCAoZGVmYXVsdCkgXHUyMTkyIGNvdmVyXG4gKiAgIEZJVCAgICAgICAgICAgIFx1MjE5MiBjb250YWluIChpbWFnZSB2aXNpYmxlIGluIGZ1bGwsIGxldHRlcmJveCBpZiBuZWVkZWQpXG4gKiAgIENST1AgICAgICAgICAgIFx1MjE5MiBjb3ZlciAob2JqZWN0LXBvc2l0aW9uIGhhbmRsZWQgc2VwYXJhdGVseSB2aWEgaW1hZ2VUcmFuc2Zvcm0pXG4gKiAgIFRJTEUgICAgICAgICAgIFx1MjE5MiBjb3ZlciAobm8gZGlyZWN0IENTUyBlcXVpdmFsZW50KVxuICovXG5mdW5jdGlvbiBnZXRJbWFnZU9iamVjdEZpdChub2RlOiBhbnkpOiBzdHJpbmcge1xuICBpZiAoIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiAnY292ZXInO1xuICBjb25zdCBpbWdGaWxsID0gbm9kZS5maWxscy5maW5kKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpIGFzIEltYWdlUGFpbnQgfCB1bmRlZmluZWQ7XG4gIGlmICghaW1nRmlsbCkgcmV0dXJuICdjb3Zlcic7XG4gIHN3aXRjaCAoaW1nRmlsbC5zY2FsZU1vZGUpIHtcbiAgICBjYXNlICdGSVQnOiByZXR1cm4gJ2NvbnRhaW4nO1xuICAgIGNhc2UgJ0ZJTEwnOlxuICAgIGNhc2UgJ0NST1AnOlxuICAgIGNhc2UgJ1RJTEUnOlxuICAgIGRlZmF1bHQ6IHJldHVybiAnY292ZXInO1xuICB9XG59XG5cbi8qKlxuICogQXBwbHkgdGhlIHNoYXJlZCBvcHRpb25hbC1zaWduYWwgZmllbGRzIChjb21wb25lbnRJbnN0YW5jZSwgd2lkdGhNb2RlLFxuICogaGVpZ2h0TW9kZSwgdmFyQmluZGluZ3MpIHRvIGFuIGVsZW1lbnQuIENlbnRyYWxpemVkIHNvIGV2ZXJ5IGVsZW1lbnRcbiAqIGtpbmQgKHRleHQsIGltYWdlLCBidXR0b24sIGlucHV0KSBiZW5lZml0cyBjb25zaXN0ZW50bHkuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5Q29tbW9uU2lnbmFscyhlbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+LCBub2RlOiBTY2VuZU5vZGUpOiB2b2lkIHtcbiAgY29uc3QgY21wID0gZXh0cmFjdENvbXBvbmVudEluc3RhbmNlKG5vZGUpO1xuICBpZiAoY21wKSBlbGVtLmNvbXBvbmVudEluc3RhbmNlID0gY21wO1xuXG4gIGNvbnN0IHNpemUgPSBleHRyYWN0U2l6aW5nTW9kZXMobm9kZSk7XG4gIGlmIChzaXplLndpZHRoTW9kZSkgZWxlbS53aWR0aE1vZGUgPSBzaXplLndpZHRoTW9kZTtcbiAgaWYgKHNpemUuaGVpZ2h0TW9kZSkgZWxlbS5oZWlnaHRNb2RlID0gc2l6ZS5oZWlnaHRNb2RlO1xuXG4gIGNvbnN0IHZhcnMgPSBleHRyYWN0Qm91bmRWYXJpYWJsZXMobm9kZSk7XG4gIGlmICh2YXJzKSBlbGVtLnZhckJpbmRpbmdzID0gdmFycztcbn1cblxuLyoqXG4gKiBSZWFkIG5vZGUub3BhY2l0eSBhbmQgcmV0dXJuIGl0IHdoZW4gYmVsb3cgMSAocm91bmRlZCB0byAyIGRlY2ltYWxzKS5cbiAqIFJldHVybnMgbnVsbCBmb3IgZnVsbHkgb3BhcXVlIG5vZGVzIG9yIHdoZW4gdGhlIHByb3BlcnR5IGlzIGFic2VudC5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdE9wYWNpdHkobm9kZTogYW55KTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICghKCdvcGFjaXR5JyBpbiBub2RlKSB8fCB0eXBlb2Ygbm9kZS5vcGFjaXR5ICE9PSAnbnVtYmVyJykgcmV0dXJuIG51bGw7XG4gIGlmIChub2RlLm9wYWNpdHkgPj0gMSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBNYXRoLnJvdW5kKG5vZGUub3BhY2l0eSAqIDEwMCkgLyAxMDA7XG59XG5cbi8qKlxuICogRGVjaWRlIHdoZXRoZXIgYSBub24tdGV4dCwgbm9uLWltYWdlLCBub24tYnV0dG9uLCBub24taW5wdXQgZnJhbWUgY2Fycmllc1xuICogZW5vdWdoIHZpc3VhbCBzdHlsaW5nIChmaWxsLCBzdHJva2UsIHJhZGl1cywgc2hhZG93LCByZWR1Y2VkIG9wYWNpdHkpIHRvXG4gKiB3YXJyYW50IGJlaW5nIGVtaXR0ZWQgYXMgYSBjb250YWluZXIgZWxlbWVudC4gUGxhaW4gc3RydWN0dXJhbCB3cmFwcGVyc1xuICogd2l0aCBubyBzdHlsaW5nIHJldHVybiBmYWxzZSBzbyB3ZSBkb24ndCBmbG9vZCBvdXRwdXQgd2l0aCBlbXB0eSBlbnRyaWVzLlxuICovXG5mdW5jdGlvbiBoYXNDb250YWluZXJTdHlsaW5nKG5vZGU6IFNjZW5lTm9kZSk6IGJvb2xlYW4ge1xuICBjb25zdCBuID0gbm9kZSBhcyBhbnk7XG4gIGlmIChleHRyYWN0QmFja2dyb3VuZENvbG9yKG4pKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKGV4dHJhY3RHcmFkaWVudChuKSkgcmV0dXJuIHRydWU7XG4gIGlmIChleHRyYWN0U3Ryb2tlQ29sb3IobikpIHJldHVybiB0cnVlO1xuICBjb25zdCBjb3JuZXJzID0gZXh0cmFjdFBlckNvcm5lclJhZGl1cyhuKTtcbiAgaWYgKGNvcm5lcnMpIHJldHVybiB0cnVlO1xuICBjb25zdCBmeCA9IGV4dHJhY3RFZmZlY3RzKG4pO1xuICBpZiAoZnguYm94U2hhZG93IHx8IGZ4LmZpbHRlciB8fCBmeC5iYWNrZHJvcEZpbHRlcikgcmV0dXJuIHRydWU7XG4gIGlmIChleHRyYWN0T3BhY2l0eShuKSAhPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBGaW5kIGFuZCBjbGFzc2lmeSBhbGwgbWVhbmluZ2Z1bCBlbGVtZW50cyB3aXRoaW4gYSBzZWN0aW9uLlxuICogV2Fsa3MgdGhlIG5vZGUgdHJlZSBhbmQgZXh0cmFjdHMgdHlwb2dyYXBoeSBmb3IgVEVYVCBub2RlcyxcbiAqIGRpbWVuc2lvbnMgZm9yIGltYWdlIGNvbnRhaW5lcnMsIGV0Yy5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEVsZW1lbnRzKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUpOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+PiB7XG4gIGNvbnN0IGVsZW1lbnRzOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+PiA9IHt9O1xuICBsZXQgdGV4dEluZGV4ID0gMDtcbiAgbGV0IGltYWdlSW5kZXggPSAwO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgLy8gVEVYVCBub2RlcyBcdTIxOTIgdHlwb2dyYXBoeSArIHRleHQgY29udGVudFxuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgdHlwbyA9IGV4dHJhY3RUeXBvZ3JhcGh5KG5vZGUpO1xuICAgICAgY29uc3QgZm9udFNpemUgPSBub2RlLmZvbnRTaXplICE9PSBmaWdtYS5taXhlZCA/IChub2RlLmZvbnRTaXplIGFzIG51bWJlcikgOiAxNjtcblxuICAgICAgLy8gQ2xhc3NpZnkgYnkgcm9sZTogaGVhZGluZ3MgYXJlIGxhcmdlciwgYm9keSB0ZXh0IGlzIHNtYWxsZXJcbiAgICAgIGxldCByb2xlOiBzdHJpbmc7XG4gICAgICBpZiAodGV4dEluZGV4ID09PSAwICYmIGZvbnRTaXplID49IDI4KSB7XG4gICAgICAgIHJvbGUgPSAnaGVhZGluZyc7XG4gICAgICB9IGVsc2UgaWYgKHRleHRJbmRleCA9PT0gMSAmJiBmb250U2l6ZSA+PSAxNikge1xuICAgICAgICByb2xlID0gJ3N1YmhlYWRpbmcnO1xuICAgICAgfSBlbHNlIGlmIChub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYnV0dG9uJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2N0YScpKSB7XG4gICAgICAgIHJvbGUgPSAnYnV0dG9uX3RleHQnO1xuICAgICAgfSBlbHNlIGlmIChub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY2FwdGlvbicpIHx8IGZvbnRTaXplIDw9IDE0KSB7XG4gICAgICAgIHJvbGUgPSBgY2FwdGlvbiR7dGV4dEluZGV4ID4gMiA/ICdfJyArIHRleHRJbmRleCA6ICcnfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByb2xlID0gYHRleHRfJHt0ZXh0SW5kZXh9YDtcbiAgICAgIH1cblxuICAgICAgLy8gVXNlIHRoZSBsYXllciBuYW1lIGlmIGl0J3Mgbm90IGEgZGVmYXVsdCBuYW1lXG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBpZiAoY2xlYW5OYW1lICYmICEvXih0ZXh0fGZyYW1lfGdyb3VwfHJlY3RhbmdsZSlcXGQqJC8udGVzdChjbGVhbk5hbWUpKSB7XG4gICAgICAgIHJvbGUgPSBjbGVhbk5hbWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEV4dHJhY3QgYWN0dWFsIHRleHQgY29udGVudCBmb3IgY29udGVudCBwb3B1bGF0aW9uIGFuZCBjb250ZXh0XG4gICAgICB0eXBvLnRleHRDb250ZW50ID0gbm9kZS5jaGFyYWN0ZXJzIHx8IG51bGw7XG5cbiAgICAgIC8vIFBlci1zaWRlIG1hcmdpbnMgZnJvbSBzaWJsaW5nIHNwYWNpbmcgKHRvcC9yaWdodC9ib3R0b20vbGVmdClcbiAgICAgIE9iamVjdC5hc3NpZ24odHlwbywgZXh0cmFjdFBlclNpZGVNYXJnaW5zKG5vZGUpKTtcblxuICAgICAgLy8gRmxleC1jaGlsZCBwcm9wZXJ0aWVzIChsYXlvdXRHcm93IC8gbGF5b3V0QWxpZ24pXG4gICAgICBPYmplY3QuYXNzaWduKHR5cG8sIGV4dHJhY3RGbGV4Q2hpbGRQcm9wcyhub2RlKSk7XG5cbiAgICAgIC8vIFRyYW5zZm9ybSAocm90YXRlL3NjYWxlKSBpZiBub24taWRlbnRpdHlcbiAgICAgIGNvbnN0IHR4ID0gZXh0cmFjdFRyYW5zZm9ybShub2RlKTtcbiAgICAgIGlmICh0eC50cmFuc2Zvcm0pIHR5cG8udHJhbnNmb3JtID0gdHgudHJhbnNmb3JtO1xuXG4gICAgICAvLyBMaW5rIFVSTCBmcm9tIHByb3RvdHlwZSBuYXZpZ2F0aW9uXG4gICAgICBjb25zdCBocmVmID0gZXh0cmFjdExpbmtVcmwobm9kZSk7XG4gICAgICBpZiAoaHJlZikgdHlwby5saW5rVXJsID0gaHJlZjtcblxuICAgICAgLy8gTWF4IHdpZHRoIGlmIGNvbnN0cmFpbmVkXG4gICAgICBpZiAobm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmIG5vZGUucGFyZW50Py50eXBlID09PSAnRlJBTUUnKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudFdpZHRoID0gKG5vZGUucGFyZW50IGFzIEZyYW1lTm9kZSkuYWJzb2x1dGVCb3VuZGluZ0JveD8ud2lkdGg7XG4gICAgICAgIGlmIChwYXJlbnRXaWR0aCAmJiBub2RlLmFic29sdXRlQm91bmRpbmdCb3gud2lkdGggPCBwYXJlbnRXaWR0aCAqIDAuOSkge1xuICAgICAgICAgIHR5cG8ubWF4V2lkdGggPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQobm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94LndpZHRoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQ29tbW9uIHNpZ25hbHM6IGNvbXBvbmVudEluc3RhbmNlLCBzaXppbmcgbW9kZXMsIGJvdW5kIHZhcmlhYmxlc1xuICAgICAgYXBwbHlDb21tb25TaWduYWxzKHR5cG8sIG5vZGUpO1xuXG4gICAgICBjb25zdCB0ZXh0T3BhY2l0eSA9IGV4dHJhY3RPcGFjaXR5KG5vZGUpO1xuICAgICAgaWYgKHRleHRPcGFjaXR5ICE9PSBudWxsKSB0eXBvLm9wYWNpdHkgPSB0ZXh0T3BhY2l0eTtcblxuICAgICAgZWxlbWVudHNbcm9sZV0gPSB0eXBvO1xuICAgICAgdGV4dEluZGV4Kys7XG4gICAgfVxuXG4gICAgLy8gSU1BR0UgZmlsbHMgXHUyMTkyIGltYWdlIGVsZW1lbnQgKHdpdGggc21hcnQgYmFja2dyb3VuZCBkZXRlY3Rpb24pXG4gICAgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkgJiYgbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG5cbiAgICAgIC8vIFNtYXJ0IGJhY2tncm91bmQgaW1hZ2UgZGV0ZWN0aW9uOlxuICAgICAgLy8gMS4gTGF5ZXIgbmFtZSBjb250YWlucyAnYmFja2dyb3VuZCcgb3IgJ2JnJyBPUlxuICAgICAgLy8gMi4gSW1hZ2Ugc3BhbnMgPj0gOTAlIG9mIHRoZSBzZWN0aW9uJ3Mgd2lkdGggQU5EIGhlaWdodCAoZnVsbC1ibGVlZCBpbWFnZSlcbiAgICAgIGNvbnN0IG5hbWVIaW50c0JnID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2JhY2tncm91bmQnKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYmcnKTtcbiAgICAgIGNvbnN0IHNlY3Rpb25Cb3VuZHMgPSBzZWN0aW9uTm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgY29uc3Qgc3BhbnNTZWN0aW9uID0gc2VjdGlvbkJvdW5kcyAmJlxuICAgICAgICBib3VuZHMud2lkdGggPj0gc2VjdGlvbkJvdW5kcy53aWR0aCAqIDAuOSAmJlxuICAgICAgICBib3VuZHMuaGVpZ2h0ID49IHNlY3Rpb25Cb3VuZHMuaGVpZ2h0ICogMC45O1xuXG4gICAgICBjb25zdCBpc0JhY2tncm91bmRJbWFnZSA9IG5hbWVIaW50c0JnIHx8IHNwYW5zU2VjdGlvbjtcblxuICAgICAgY29uc3Qgcm9sZSA9IGlzQmFja2dyb3VuZEltYWdlXG4gICAgICAgID8gJ2JhY2tncm91bmRfaW1hZ2UnXG4gICAgICAgIDogYGltYWdlJHtpbWFnZUluZGV4ID4gMCA/ICdfJyArIGltYWdlSW5kZXggOiAnJ31gO1xuXG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBjb25zdCBmaW5hbFJvbGUgPSBjbGVhbk5hbWUgJiYgIS9eKGltYWdlfHJlY3RhbmdsZXxmcmFtZSlcXGQqJC8udGVzdChjbGVhbk5hbWUpID8gY2xlYW5OYW1lIDogcm9sZTtcblxuICAgICAgLy8gRGV0ZWN0IG1hc2svY2xpcCBvbiBpbWFnZSBvciBpdHMgcGFyZW50IGNvbnRhaW5lclxuICAgICAgY29uc3QgcGFyZW50RnJhbWUgPSBub2RlLnBhcmVudDtcbiAgICAgIGNvbnN0IHBhcmVudENsaXBzID0gcGFyZW50RnJhbWUgJiYgJ2NsaXBzQ29udGVudCcgaW4gcGFyZW50RnJhbWUgJiYgKHBhcmVudEZyYW1lIGFzIGFueSkuY2xpcHNDb250ZW50ID09PSB0cnVlO1xuICAgICAgY29uc3QgaXNNYXNrZWQgPSAoJ2lzTWFzaycgaW4gbm9kZSAmJiAobm9kZSBhcyBhbnkpLmlzTWFzayA9PT0gdHJ1ZSkgfHwgcGFyZW50Q2xpcHM7XG4gICAgICAvLyBEZXRlY3QgY2lyY3VsYXIvcm91bmRlZCBjbGlwczogaWYgcGFyZW50IGhhcyBlcXVhbCBjb3JuZXJSYWRpdXMgYW5kIGlzIHJvdWdobHkgc3F1YXJlXG4gICAgICBsZXQgY2xpcEJvcmRlclJhZGl1czogc3RyaW5nIHwgbnVsbCA9ICdjb3JuZXJSYWRpdXMnIGluIG5vZGUgJiYgdHlwZW9mIChub2RlIGFzIGFueSkuY29ybmVyUmFkaXVzID09PSAnbnVtYmVyJ1xuICAgICAgICA/IHRvQ3NzVmFsdWUoKG5vZGUgYXMgYW55KS5jb3JuZXJSYWRpdXMpXG4gICAgICAgIDogbnVsbDtcbiAgICAgIGlmICghY2xpcEJvcmRlclJhZGl1cyAmJiBwYXJlbnRGcmFtZSAmJiAnY29ybmVyUmFkaXVzJyBpbiBwYXJlbnRGcmFtZSAmJiB0eXBlb2YgKHBhcmVudEZyYW1lIGFzIGFueSkuY29ybmVyUmFkaXVzID09PSAnbnVtYmVyJykge1xuICAgICAgICBjb25zdCBwYXJlbnRDb3JuZXIgPSAocGFyZW50RnJhbWUgYXMgYW55KS5jb3JuZXJSYWRpdXMgYXMgbnVtYmVyO1xuICAgICAgICBpZiAocGFyZW50Q29ybmVyID4gMCkge1xuICAgICAgICAgIGNvbnN0IHBhcmVudEJvdW5kcyA9IChwYXJlbnRGcmFtZSBhcyBhbnkpLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICAgICAgLy8gSWYgcGFyZW50IGlzIHJvdWdobHkgc3F1YXJlIGFuZCBjb3JuZXJSYWRpdXMgPj0gaGFsZiB0aGUgd2lkdGggXHUyMTkyIGNpcmNsZVxuICAgICAgICAgIGlmIChwYXJlbnRCb3VuZHMgJiYgTWF0aC5hYnMocGFyZW50Qm91bmRzLndpZHRoIC0gcGFyZW50Qm91bmRzLmhlaWdodCkgPCA1ICYmIHBhcmVudENvcm5lciA+PSBwYXJlbnRCb3VuZHMud2lkdGggLyAyIC0gMikge1xuICAgICAgICAgICAgY2xpcEJvcmRlclJhZGl1cyA9ICc1MCUnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGlwQm9yZGVyUmFkaXVzID0gdG9Dc3NWYWx1ZShwYXJlbnRDb3JuZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBpbWdFZmZlY3RzID0gZXh0cmFjdEVmZmVjdHMobm9kZSBhcyBhbnkpO1xuICAgICAgY29uc3QgaW1nT2JqZWN0UG9zaXRpb24gPSBleHRyYWN0T2JqZWN0UG9zaXRpb24obm9kZSk7XG4gICAgICBjb25zdCBpbWdDb3JuZXJzID0gZXh0cmFjdFBlckNvcm5lclJhZGl1cyhub2RlIGFzIGFueSk7XG4gICAgICBjb25zdCBpbWdFbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge1xuICAgICAgICB3aWR0aDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnMTAwJScgOiB0b0Nzc1ZhbHVlKE1hdGgucm91bmQoYm91bmRzLndpZHRoKSksXG4gICAgICAgIGhlaWdodDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnMTAwJScgOiAnYXV0bycsXG4gICAgICAgIGFzcGVjdFJhdGlvOiBpc0JhY2tncm91bmRJbWFnZSA/IG51bGwgOiBjb21wdXRlQXNwZWN0UmF0aW8oYm91bmRzLndpZHRoLCBib3VuZHMuaGVpZ2h0KSxcbiAgICAgICAgb2JqZWN0Rml0OiBnZXRJbWFnZU9iamVjdEZpdChub2RlIGFzIGFueSksXG4gICAgICAgIG9iamVjdFBvc2l0aW9uOiBpbWdPYmplY3RQb3NpdGlvbixcbiAgICAgICAgb3ZlcmZsb3c6IChwYXJlbnRDbGlwcyB8fCBjbGlwQm9yZGVyUmFkaXVzKSA/ICdoaWRkZW4nIDogbnVsbCxcbiAgICAgICAgaGFzTWFzazogaXNNYXNrZWQgfHwgbnVsbCxcbiAgICAgICAgYm94U2hhZG93OiBpbWdFZmZlY3RzLmJveFNoYWRvdyxcbiAgICAgICAgZmlsdGVyOiBpbWdFZmZlY3RzLmZpbHRlcixcbiAgICAgICAgLy8gTWFyayBiYWNrZ3JvdW5kIGltYWdlcyB3aXRoIHBvc2l0aW9uIGRhdGEgc28gYWdlbnRzIGtub3cgdG8gdXNlIENTUyBiYWNrZ3JvdW5kLWltYWdlXG4gICAgICAgIHBvc2l0aW9uOiBpc0JhY2tncm91bmRJbWFnZSA/ICdhYnNvbHV0ZScgOiBudWxsLFxuICAgICAgICB0b3A6IGlzQmFja2dyb3VuZEltYWdlID8gJzBweCcgOiBudWxsLFxuICAgICAgICBsZWZ0OiBpc0JhY2tncm91bmRJbWFnZSA/ICcwcHgnIDogbnVsbCxcbiAgICAgICAgekluZGV4OiBpc0JhY2tncm91bmRJbWFnZSA/IDAgOiBudWxsLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGltZ0FsdCA9IGV4dHJhY3RBbHRUZXh0KG5vZGUpO1xuICAgICAgaWYgKGltZ0FsdCkgaW1nRWxlbS5hbHQgPSBpbWdBbHQ7XG4gICAgICBhcHBseUNvbW1vblNpZ25hbHMoaW1nRWxlbSwgbm9kZSk7XG4gICAgICAvLyBBcHBseSByYWRpdXMgXHUyMDE0IHBlci1jb3JuZXIgaWYgbm9kZSBoYXMgZGlmZmVyaW5nIGNvcm5lcnMsIHVuaWZvcm0gb3RoZXJ3aXNlXG4gICAgICBpZiAoaW1nQ29ybmVycykge1xuICAgICAgICBpZiAoaW1nQ29ybmVycy51bmlmb3JtICE9PSBudWxsKSB7XG4gICAgICAgICAgaW1nRWxlbS5ib3JkZXJSYWRpdXMgPSB0b0Nzc1ZhbHVlKGltZ0Nvcm5lcnMudW5pZm9ybSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW1nRWxlbS5ib3JkZXJUb3BMZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLnRvcExlZnQpO1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyVG9wUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGltZ0Nvcm5lcnMudG9wUmlnaHQpO1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyQm90dG9tTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoaW1nQ29ybmVycy5ib3R0b21MZWZ0KTtcbiAgICAgICAgICBpbWdFbGVtLmJvcmRlckJvdHRvbVJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLmJvdHRvbVJpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjbGlwQm9yZGVyUmFkaXVzKSB7XG4gICAgICAgIGltZ0VsZW0uYm9yZGVyUmFkaXVzID0gY2xpcEJvcmRlclJhZGl1cztcbiAgICAgIH1cbiAgICAgIC8vIEZsZXgtY2hpbGQgcHJvcHMgaWYgaW1hZ2UgaXMgaW5zaWRlIGFuIGF1dG8tbGF5b3V0IHJvd1xuICAgICAgT2JqZWN0LmFzc2lnbihpbWdFbGVtLCBleHRyYWN0RmxleENoaWxkUHJvcHMobm9kZSkpO1xuICAgICAgY29uc3QgaW1nT3BhY2l0eSA9IGV4dHJhY3RPcGFjaXR5KG5vZGUpO1xuICAgICAgaWYgKGltZ09wYWNpdHkgIT09IG51bGwpIGltZ0VsZW0ub3BhY2l0eSA9IGltZ09wYWNpdHk7XG4gICAgICBlbGVtZW50c1tmaW5hbFJvbGVdID0gaW1nRWxlbTtcbiAgICAgIGltYWdlSW5kZXgrKztcbiAgICB9XG5cbiAgICAvLyBCdXR0b24tbGlrZSBmcmFtZXMgKHNtYWxsIGZyYW1lcyB3aXRoIHRleHQgKyBmaWxsKVxuICAgIGlmICgobm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnKSAmJlxuICAgICAgICBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYnV0dG9uJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2J0bicpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjdGEnKSkge1xuICAgICAgY29uc3QgZnJhbWUgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgIGNvbnN0IGJnID0gZXh0cmFjdEJhY2tncm91bmRDb2xvcihmcmFtZSk7XG4gICAgICBjb25zdCBib3VuZHMgPSBmcmFtZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuXG4gICAgICBpZiAoYmcgJiYgYm91bmRzKSB7XG4gICAgICAgIGNvbnN0IGJ1dHRvblN0eWxlczogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGJnLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChmcmFtZS5sYXlvdXRNb2RlICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICAgIGJ1dHRvblN0eWxlcy5wYWRkaW5nVG9wID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nVG9wKTtcbiAgICAgICAgICBidXR0b25TdHlsZXMucGFkZGluZ0JvdHRvbSA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ0JvdHRvbSk7XG4gICAgICAgICAgYnV0dG9uU3R5bGVzLnBhZGRpbmdMZWZ0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nTGVmdCk7XG4gICAgICAgICAgYnV0dG9uU3R5bGVzLnBhZGRpbmdSaWdodCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ1JpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5UmFkaXVzKGJ1dHRvblN0eWxlcywgZnJhbWUpO1xuICAgICAgICBhcHBseVN0cm9rZXMoYnV0dG9uU3R5bGVzLCBmcmFtZSk7XG4gICAgICAgIGNvbnN0IGJ0bkVmZmVjdHMgPSBleHRyYWN0RWZmZWN0cyhmcmFtZSBhcyBhbnkpO1xuICAgICAgICBpZiAoYnRuRWZmZWN0cy5ib3hTaGFkb3cpIGJ1dHRvblN0eWxlcy5ib3hTaGFkb3cgPSBidG5FZmZlY3RzLmJveFNoYWRvdztcbiAgICAgICAgaWYgKGJ0bkVmZmVjdHMuZmlsdGVyKSBidXR0b25TdHlsZXMuZmlsdGVyID0gYnRuRWZmZWN0cy5maWx0ZXI7XG5cbiAgICAgICAgY29uc3QgdHggPSBleHRyYWN0VHJhbnNmb3JtKGZyYW1lIGFzIGFueSk7XG4gICAgICAgIGlmICh0eC50cmFuc2Zvcm0pIGJ1dHRvblN0eWxlcy50cmFuc2Zvcm0gPSB0eC50cmFuc2Zvcm07XG5cbiAgICAgICAgLy8gTGluayBVUkwgZnJvbSBwcm90b3R5cGUgT1BFTl9VUkwgYWN0aW9uXG4gICAgICAgIGNvbnN0IGhyZWYgPSBleHRyYWN0TGlua1VybChmcmFtZSk7XG4gICAgICAgIGlmIChocmVmKSBidXR0b25TdHlsZXMubGlua1VybCA9IGhyZWY7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgdGV4dCBub2RlIGluc2lkZSB0aGUgYnV0dG9uIGZvciB0eXBvZ3JhcGh5XG4gICAgICAgIGNvbnN0IHRleHRDaGlsZCA9IGZpbmRGaXJzdFRleHROb2RlKGZyYW1lKTtcbiAgICAgICAgaWYgKHRleHRDaGlsZCkge1xuICAgICAgICAgIGNvbnN0IHR5cG8gPSBleHRyYWN0VHlwb2dyYXBoeSh0ZXh0Q2hpbGQpO1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24oYnV0dG9uU3R5bGVzLCB0eXBvKTtcbiAgICAgICAgICBidXR0b25TdHlsZXMudGV4dENvbnRlbnQgPSB0ZXh0Q2hpbGQuY2hhcmFjdGVycyB8fCBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihidXR0b25TdHlsZXMsIGV4dHJhY3RGbGV4Q2hpbGRQcm9wcyhmcmFtZSBhcyBhbnkpKTtcblxuICAgICAgICAvLyBDb21tb24gc2lnbmFsczogY29tcG9uZW50SW5zdGFuY2UgKGJ1dHRvbiB2YXJpYW50cyEpLCBzaXppbmcsIHZhcnNcbiAgICAgICAgYXBwbHlDb21tb25TaWduYWxzKGJ1dHRvblN0eWxlcywgZnJhbWUpO1xuXG4gICAgICAgIGNvbnN0IGJ0bk9wYWNpdHkgPSBleHRyYWN0T3BhY2l0eShmcmFtZSk7XG4gICAgICAgIGlmIChidG5PcGFjaXR5ICE9PSBudWxsKSBidXR0b25TdHlsZXMub3BhY2l0eSA9IGJ0bk9wYWNpdHk7XG5cbiAgICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgICBlbGVtZW50c1tjbGVhbk5hbWUgfHwgJ2J1dHRvbiddID0gYnV0dG9uU3R5bGVzO1xuICAgICAgfVxuICAgICAgcmV0dXJuOyAvLyBEb24ndCByZWN1cnNlIGludG8gYnV0dG9uIGludGVybmFsc1xuICAgIH1cblxuICAgIC8vIElucHV0LWxpa2UgZnJhbWVzIChkZXRlY3QgaW5wdXRzIGJ5IGNvbW1vbiBsYXllciBuYW1lcylcbiAgICBpZiAoKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJykgJiZcbiAgICAgICAgL1xcYihpbnB1dHxmaWVsZHx0ZXh0Ym94fHRleHRhcmVhfHNlbGVjdHx0ZXh0ZmllbGQpXFxiL2kudGVzdChub2RlLm5hbWUpKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgY29uc3QgaW5wdXRTdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogZXh0cmFjdEJhY2tncm91bmRDb2xvcihmcmFtZSksXG4gICAgICB9O1xuICAgICAgaWYgKGZyYW1lLmxheW91dE1vZGUgJiYgZnJhbWUubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgICAgIGlucHV0U3R5bGVzLnBhZGRpbmdUb3AgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdUb3ApO1xuICAgICAgICBpbnB1dFN0eWxlcy5wYWRkaW5nQm90dG9tID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nQm90dG9tKTtcbiAgICAgICAgaW5wdXRTdHlsZXMucGFkZGluZ0xlZnQgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdMZWZ0KTtcbiAgICAgICAgaW5wdXRTdHlsZXMucGFkZGluZ1JpZ2h0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nUmlnaHQpO1xuICAgICAgfVxuICAgICAgYXBwbHlSYWRpdXMoaW5wdXRTdHlsZXMsIGZyYW1lKTtcbiAgICAgIGFwcGx5U3Ryb2tlcyhpbnB1dFN0eWxlcywgZnJhbWUpO1xuICAgICAgY29uc3QgcGxhY2Vob2xkZXJUZXh0ID0gZmluZEZpcnN0VGV4dE5vZGUoZnJhbWUpO1xuICAgICAgaWYgKHBsYWNlaG9sZGVyVGV4dCkge1xuICAgICAgICBpbnB1dFN0eWxlcy5wbGFjZWhvbGRlciA9IHBsYWNlaG9sZGVyVGV4dC5jaGFyYWN0ZXJzIHx8IG51bGw7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyVHlwbyA9IGV4dHJhY3RUeXBvZ3JhcGh5KHBsYWNlaG9sZGVyVGV4dCk7XG4gICAgICAgIGlucHV0U3R5bGVzLnBsYWNlaG9sZGVyU3R5bGVzID0ge1xuICAgICAgICAgIGNvbG9yOiBwbGFjZWhvbGRlclR5cG8uY29sb3IgfHwgbnVsbCxcbiAgICAgICAgICBmb250U2l6ZTogcGxhY2Vob2xkZXJUeXBvLmZvbnRTaXplIHx8IG51bGwsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBhcHBseUNvbW1vblNpZ25hbHMoaW5wdXRTdHlsZXMsIGZyYW1lKTtcblxuICAgICAgY29uc3QgaW5wdXRPcGFjaXR5ID0gZXh0cmFjdE9wYWNpdHkoZnJhbWUpO1xuICAgICAgaWYgKGlucHV0T3BhY2l0eSAhPT0gbnVsbCkgaW5wdXRTdHlsZXMub3BhY2l0eSA9IGlucHV0T3BhY2l0eTtcblxuICAgICAgY29uc3QgaW5wdXROYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpIHx8ICdpbnB1dCc7XG4gICAgICBlbGVtZW50c1tpbnB1dE5hbWVdID0gaW5wdXRTdHlsZXM7XG4gICAgICByZXR1cm47IC8vIERvbid0IHJlY3Vyc2UgaW50byBpbnB1dCBpbnRlcm5hbHNcbiAgICB9XG5cbiAgICAvLyBHZW5lcmljIGNvbnRhaW5lciBmcmFtZXMgXHUyMDE0IGNhcmRzLCB3cmFwcGVycywgdGlsZXMgZXRjLiBFbWl0IHN0eWxpbmcgd2hlblxuICAgIC8vIHRoZSBmcmFtZSBoYXMgYW55IHZpc3VhbCBwcm9wZXJ0aWVzIChmaWxsLCBzdHJva2UsIHJhZGl1cywgc2hhZG93LFxuICAgIC8vIG9wYWNpdHkgPCAxKS4gU2tpcCBkZXB0aCAwICh0aGF0J3MgdGhlIHNlY3Rpb24gaXRzZWxmLCBoYW5kbGVkIGJ5XG4gICAgLy8gZXh0cmFjdFNlY3Rpb25TdHlsZXMpLiBTdGlsbCByZWN1cnNlIHNvIG5lc3RlZCB0ZXh0L2ltYWdlcy9idXR0b25zIGFyZVxuICAgIC8vIGNhcHR1cmVkIGFzIHNlcGFyYXRlIGVsZW1lbnRzLlxuICAgIGlmIChkZXB0aCA+IDAgJiZcbiAgICAgICAgKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdHUk9VUCcpICYmXG4gICAgICAgICFoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpICYmXG4gICAgICAgIGhhc0NvbnRhaW5lclN0eWxpbmcobm9kZSkpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBjb25zdCBjb250YWluZXJTdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7fTtcblxuICAgICAgY29uc3QgYmcgPSBleHRyYWN0QmFja2dyb3VuZENvbG9yKGZyYW1lKTtcbiAgICAgIGlmIChiZykgY29udGFpbmVyU3R5bGVzLmJhY2tncm91bmRDb2xvciA9IGJnO1xuICAgICAgY29uc3QgZ3JhZGllbnQgPSBleHRyYWN0R3JhZGllbnQoZnJhbWUpO1xuICAgICAgaWYgKGdyYWRpZW50KSBjb250YWluZXJTdHlsZXMuYmFja2dyb3VuZEdyYWRpZW50ID0gZ3JhZGllbnQ7XG5cbiAgICAgIGlmIChmcmFtZS5sYXlvdXRNb2RlICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICBjb250YWluZXJTdHlsZXMucGFkZGluZ1RvcCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ1RvcCk7XG4gICAgICAgIGNvbnRhaW5lclN0eWxlcy5wYWRkaW5nQm90dG9tID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nQm90dG9tKTtcbiAgICAgICAgY29udGFpbmVyU3R5bGVzLnBhZGRpbmdMZWZ0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nTGVmdCk7XG4gICAgICAgIGNvbnRhaW5lclN0eWxlcy5wYWRkaW5nUmlnaHQgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdSaWdodCk7XG4gICAgICAgIGlmICh0eXBlb2YgZnJhbWUuaXRlbVNwYWNpbmcgPT09ICdudW1iZXInICYmIGZyYW1lLml0ZW1TcGFjaW5nID4gMCkge1xuICAgICAgICAgIGNvbnRhaW5lclN0eWxlcy5nYXAgPSB0b0Nzc1ZhbHVlKGZyYW1lLml0ZW1TcGFjaW5nKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhcHBseVJhZGl1cyhjb250YWluZXJTdHlsZXMsIGZyYW1lKTtcbiAgICAgIGFwcGx5U3Ryb2tlcyhjb250YWluZXJTdHlsZXMsIGZyYW1lKTtcblxuICAgICAgY29uc3QgZnggPSBleHRyYWN0RWZmZWN0cyhmcmFtZSBhcyBhbnkpO1xuICAgICAgaWYgKGZ4LmJveFNoYWRvdykgY29udGFpbmVyU3R5bGVzLmJveFNoYWRvdyA9IGZ4LmJveFNoYWRvdztcbiAgICAgIGlmIChmeC5maWx0ZXIpIGNvbnRhaW5lclN0eWxlcy5maWx0ZXIgPSBmeC5maWx0ZXI7XG4gICAgICBpZiAoZnguYmFja2Ryb3BGaWx0ZXIpIGNvbnRhaW5lclN0eWxlcy5iYWNrZHJvcEZpbHRlciA9IGZ4LmJhY2tkcm9wRmlsdGVyO1xuXG4gICAgICBjb25zdCB0eCA9IGV4dHJhY3RUcmFuc2Zvcm0oZnJhbWUgYXMgYW55KTtcbiAgICAgIGlmICh0eC50cmFuc2Zvcm0pIGNvbnRhaW5lclN0eWxlcy50cmFuc2Zvcm0gPSB0eC50cmFuc2Zvcm07XG5cbiAgICAgIGNvbnN0IGNvbnRhaW5lck9wYWNpdHkgPSBleHRyYWN0T3BhY2l0eShmcmFtZSk7XG4gICAgICBpZiAoY29udGFpbmVyT3BhY2l0eSAhPT0gbnVsbCkgY29udGFpbmVyU3R5bGVzLm9wYWNpdHkgPSBjb250YWluZXJPcGFjaXR5O1xuXG4gICAgICBPYmplY3QuYXNzaWduKGNvbnRhaW5lclN0eWxlcywgZXh0cmFjdEZsZXhDaGlsZFByb3BzKGZyYW1lIGFzIGFueSkpO1xuICAgICAgYXBwbHlDb21tb25TaWduYWxzKGNvbnRhaW5lclN0eWxlcywgZnJhbWUpO1xuXG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBjb25zdCByb2xlID0gY2xlYW5OYW1lICYmICEvXihmcmFtZXxncm91cHxyZWN0YW5nbGV8ZWxsaXBzZSlcXGQqJC8udGVzdChjbGVhbk5hbWUpXG4gICAgICAgID8gY2xlYW5OYW1lXG4gICAgICAgIDogYGNvbnRhaW5lcl8ke09iamVjdC5rZXlzKGVsZW1lbnRzKS5maWx0ZXIoayA9PiBrLnN0YXJ0c1dpdGgoJ2NvbnRhaW5lcl8nKSkubGVuZ3RoICsgMX1gO1xuICAgICAgaWYgKCFlbGVtZW50c1tyb2xlXSkge1xuICAgICAgICBlbGVtZW50c1tyb2xlXSA9IGNvbnRhaW5lclN0eWxlcztcbiAgICAgIH1cbiAgICAgIC8vIEZhbGwgdGhyb3VnaCB0byByZWN1cnNpb24gc28gbmVzdGVkIGVsZW1lbnRzIHN0aWxsIGdldCBleHRyYWN0ZWQuXG4gICAgfVxuXG4gICAgLy8gUmVjdXJzZSBpbnRvIGNoaWxkcmVuIChkZXB0aCBsaW1pdCA2IHRvIGNhcHR1cmUgZGVlcGx5IG5lc3RlZCBlbGVtZW50cylcbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlICYmIGRlcHRoIDwgNikge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIGlmIChjaGlsZC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgIHdhbGsoY2hpbGQsIGRlcHRoICsgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3YWxrKHNlY3Rpb25Ob2RlLCAwKTtcbiAgcmV0dXJuIGVsZW1lbnRzO1xufVxuXG4vKipcbiAqIEZpbmQgdGhlIGZpcnN0IFRFWFQgbm9kZSBpbiBhIHN1YnRyZWUuXG4gKi9cbmZ1bmN0aW9uIGZpbmRGaXJzdFRleHROb2RlKG5vZGU6IFNjZW5lTm9kZSk6IFRleHROb2RlIHwgbnVsbCB7XG4gIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykgcmV0dXJuIG5vZGU7XG4gIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGZvdW5kID0gZmluZEZpcnN0VGV4dE5vZGUoY2hpbGQpO1xuICAgICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgbGF5ZXIgaW5mb3JtYXRpb24gZm9yIGFsbCBtZWFuaW5nZnVsIGNoaWxkcmVuIG9mIGEgc2VjdGlvbi5cbiAqIFJldHVybnMgbGF5ZXJzIHNvcnRlZCBieSBGaWdtYSdzIGxheWVyIG9yZGVyIChiYWNrIHRvIGZyb250KS5cbiAqIEJvdW5kcyBhcmUgcmVsYXRpdmUgdG8gdGhlIHNlY3Rpb24ncyBvcmlnaW4sIG5vdCB0aGUgY2FudmFzLlxuICovXG5mdW5jdGlvbiBleHRyYWN0TGF5ZXJzKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUsIGVsZW1lbnRzOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+Pik6IExheWVySW5mb1tdIHtcbiAgY29uc3QgbGF5ZXJzOiBMYXllckluZm9bXSA9IFtdO1xuICBjb25zdCBzZWN0aW9uQm91bmRzID0gc2VjdGlvbk5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgaWYgKCFzZWN0aW9uQm91bmRzKSByZXR1cm4gbGF5ZXJzO1xuXG4gIGxldCBsYXllckluZGV4ID0gMDtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcikge1xuICAgIGlmICghbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94IHx8IGRlcHRoID4gNikgcmV0dXJuO1xuXG4gICAgY29uc3QgYm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgIGNvbnN0IHJlbEJvdW5kcyA9IHtcbiAgICAgIHg6IE1hdGgucm91bmQoYm91bmRzLnggLSBzZWN0aW9uQm91bmRzIS54KSxcbiAgICAgIHk6IE1hdGgucm91bmQoYm91bmRzLnkgLSBzZWN0aW9uQm91bmRzIS55KSxcbiAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKGJvdW5kcy53aWR0aCksXG4gICAgICBoZWlnaHQ6IE1hdGgucm91bmQoYm91bmRzLmhlaWdodCksXG4gICAgfTtcblxuICAgIGxldCByb2xlOiBMYXllckluZm9bJ3JvbGUnXSB8IG51bGwgPSBudWxsO1xuICAgIGxldCBuYW1lID0gJyc7XG5cbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIHJvbGUgPSAndGV4dCc7XG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBuYW1lID0gY2xlYW5OYW1lICYmICEvXnRleHRcXGQqJC8udGVzdChjbGVhbk5hbWUpID8gY2xlYW5OYW1lIDogYHRleHRfJHtsYXllckluZGV4fWA7XG4gICAgfSBlbHNlIGlmIChoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpKSB7XG4gICAgICBjb25zdCBuYW1lSGludHNCZyA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdiYWNrZ3JvdW5kJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2JnJyk7XG4gICAgICBjb25zdCBzcGFuc1NlY3Rpb24gPSBib3VuZHMud2lkdGggPj0gc2VjdGlvbkJvdW5kcyEud2lkdGggKiAwLjkgJiYgYm91bmRzLmhlaWdodCA+PSBzZWN0aW9uQm91bmRzIS5oZWlnaHQgKiAwLjk7XG4gICAgICByb2xlID0gKG5hbWVIaW50c0JnIHx8IHNwYW5zU2VjdGlvbikgPyAnYmFja2dyb3VuZF9pbWFnZScgOiAnaW1hZ2UnO1xuICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgbmFtZSA9IGNsZWFuTmFtZSAmJiAhL14oaW1hZ2V8cmVjdGFuZ2xlfGZyYW1lKVxcZCokLy50ZXN0KGNsZWFuTmFtZSkgPyBjbGVhbk5hbWUgOiAocm9sZSA9PT0gJ2JhY2tncm91bmRfaW1hZ2UnID8gJ2JhY2tncm91bmRfaW1hZ2UnIDogYGltYWdlXyR7bGF5ZXJJbmRleH1gKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgKG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdidXR0b24nKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYnRuJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2N0YScpKSAmJlxuICAgICAgKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJylcbiAgICApIHtcbiAgICAgIHJvbGUgPSAnYnV0dG9uJztcbiAgICAgIG5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJykgfHwgJ2J1dHRvbic7XG4gICAgfVxuXG4gICAgaWYgKHJvbGUpIHtcbiAgICAgIGxheWVycy5wdXNoKHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgcm9sZSxcbiAgICAgICAgdHlwZTogbm9kZS50eXBlLFxuICAgICAgICBib3VuZHM6IHJlbEJvdW5kcyxcbiAgICAgICAgekluZGV4OiBsYXllckluZGV4LFxuICAgICAgICBvdmVybGFwczogW10sIC8vIGZpbGxlZCBpbiBkZXRlY3RDb21wb3NpdGlvblxuICAgICAgfSk7XG4gICAgICBsYXllckluZGV4Kys7XG4gICAgfVxuXG4gICAgLy8gUmVjdXJzZSAoc2tpcCBidXR0b24gaW50ZXJuYWxzKVxuICAgIGlmIChyb2xlICE9PSAnYnV0dG9uJyAmJiAnY2hpbGRyZW4nIGluIG5vZGUgJiYgZGVwdGggPCA2KSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgd2FsayhjaGlsZCwgZGVwdGggKyAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICgnY2hpbGRyZW4nIGluIHNlY3Rpb25Ob2RlKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiAoc2VjdGlvbk5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgIHdhbGsoY2hpbGQsIDApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsYXllcnM7XG59XG5cbi8qKlxuICogRGV0ZWN0IGNvbXBvc2l0aW9uIHBhdHRlcm5zOiB0ZXh0LW92ZXItaW1hZ2UsIGJhY2tncm91bmQgaW1hZ2VzLCBvdmVybGF5IHN0YWNraW5nLlxuICogVHdvIHJlY3RhbmdsZXMgb3ZlcmxhcCBpZiB0aGV5IHNoYXJlIGFueSBhcmVhLlxuICovXG5mdW5jdGlvbiBkZXRlY3RDb21wb3NpdGlvbihsYXllcnM6IExheWVySW5mb1tdKTogQ29tcG9zaXRpb25JbmZvIHtcbiAgY29uc3QgY29tcG9zaXRpb246IENvbXBvc2l0aW9uSW5mbyA9IHtcbiAgICBoYXNUZXh0T3ZlckltYWdlOiBmYWxzZSxcbiAgICBoYXNCYWNrZ3JvdW5kSW1hZ2U6IGZhbHNlLFxuICAgIG92ZXJsYXlFbGVtZW50czogW10sXG4gICAgc3RhY2tpbmdPcmRlcjogbGF5ZXJzLm1hcChsID0+IGwubmFtZSksXG4gIH07XG5cbiAgY29uc3QgYmdJbWFnZUxheWVycyA9IGxheWVycy5maWx0ZXIobCA9PiBsLnJvbGUgPT09ICdiYWNrZ3JvdW5kX2ltYWdlJyk7XG4gIGNvbnN0IGltYWdlTGF5ZXJzID0gbGF5ZXJzLmZpbHRlcihsID0+IGwucm9sZSA9PT0gJ2ltYWdlJyB8fCBsLnJvbGUgPT09ICdiYWNrZ3JvdW5kX2ltYWdlJyk7XG4gIGNvbnN0IHRleHRMYXllcnMgPSBsYXllcnMuZmlsdGVyKGwgPT4gbC5yb2xlID09PSAndGV4dCcpO1xuICBjb25zdCBidXR0b25MYXllcnMgPSBsYXllcnMuZmlsdGVyKGwgPT4gbC5yb2xlID09PSAnYnV0dG9uJyk7XG5cbiAgaWYgKGJnSW1hZ2VMYXllcnMubGVuZ3RoID4gMCkge1xuICAgIGNvbXBvc2l0aW9uLmhhc0JhY2tncm91bmRJbWFnZSA9IHRydWU7XG4gIH1cblxuICAvLyBDaGVjayBmb3IgYm91bmRpbmcgYm94IG92ZXJsYXBzIGJldHdlZW4gdGV4dC9idXR0b25zIGFuZCBpbWFnZXNcbiAgZm9yIChjb25zdCB0ZXh0TGF5ZXIgb2YgWy4uLnRleHRMYXllcnMsIC4uLmJ1dHRvbkxheWVyc10pIHtcbiAgICBmb3IgKGNvbnN0IGltZ0xheWVyIG9mIGltYWdlTGF5ZXJzKSB7XG4gICAgICBjb25zdCB0YiA9IHRleHRMYXllci5ib3VuZHM7XG4gICAgICBjb25zdCBpYiA9IGltZ0xheWVyLmJvdW5kcztcblxuICAgICAgLy8gQ2hlY2sgcmVjdGFuZ2xlIG92ZXJsYXBcbiAgICAgIGNvbnN0IG92ZXJsYXBzSG9yaXpvbnRhbGx5ID0gdGIueCA8IGliLnggKyBpYi53aWR0aCAmJiB0Yi54ICsgdGIud2lkdGggPiBpYi54O1xuICAgICAgY29uc3Qgb3ZlcmxhcHNWZXJ0aWNhbGx5ID0gdGIueSA8IGliLnkgKyBpYi5oZWlnaHQgJiYgdGIueSArIHRiLmhlaWdodCA+IGliLnk7XG5cbiAgICAgIGlmIChvdmVybGFwc0hvcml6b250YWxseSAmJiBvdmVybGFwc1ZlcnRpY2FsbHkpIHtcbiAgICAgICAgLy8gVGV4dC9idXR0b24gb3ZlcmxhcHMgd2l0aCBpbWFnZVxuICAgICAgICB0ZXh0TGF5ZXIub3ZlcmxhcHMucHVzaChpbWdMYXllci5uYW1lKTtcbiAgICAgICAgaW1nTGF5ZXIub3ZlcmxhcHMucHVzaCh0ZXh0TGF5ZXIubmFtZSk7XG5cbiAgICAgICAgaWYgKCFjb21wb3NpdGlvbi5oYXNUZXh0T3ZlckltYWdlKSB7XG4gICAgICAgICAgY29tcG9zaXRpb24uaGFzVGV4dE92ZXJJbWFnZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFbGVtZW50cyB3aXRoIGhpZ2hlciB6SW5kZXggdGhhdCBvdmVybGFwIGltYWdlcyBhcmUgb3ZlcmxheXNcbiAgICAgICAgaWYgKHRleHRMYXllci56SW5kZXggPiBpbWdMYXllci56SW5kZXgpIHtcbiAgICAgICAgICBpZiAoIWNvbXBvc2l0aW9uLm92ZXJsYXlFbGVtZW50cy5pbmNsdWRlcyh0ZXh0TGF5ZXIubmFtZSkpIHtcbiAgICAgICAgICAgIGNvbXBvc2l0aW9uLm92ZXJsYXlFbGVtZW50cy5wdXNoKHRleHRMYXllci5uYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBJZiB0aGVyZSdzIGEgYmFja2dyb3VuZCBpbWFnZSwgQUxMIG5vbi1iYWNrZ3JvdW5kIGVsZW1lbnRzIGFyZSBvdmVybGF5c1xuICBpZiAoY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlKSB7XG4gICAgZm9yIChjb25zdCBsYXllciBvZiBsYXllcnMpIHtcbiAgICAgIGlmIChsYXllci5yb2xlICE9PSAnYmFja2dyb3VuZF9pbWFnZScgJiYgIWNvbXBvc2l0aW9uLm92ZXJsYXlFbGVtZW50cy5pbmNsdWRlcyhsYXllci5uYW1lKSkge1xuICAgICAgICBjb21wb3NpdGlvbi5vdmVybGF5RWxlbWVudHMucHVzaChsYXllci5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29tcG9zaXRpb247XG59XG5cbi8qKlxuICogRGV0ZWN0IGlmIGEgc2VjdGlvbiBjb250YWlucyBmb3JtLWxpa2UgZWxlbWVudHMuXG4gKiBMb29rcyBmb3IgcGF0dGVybnM6IGlucHV0IHJlY3RhbmdsZXMgKG5hcnJvdyBoZWlnaHQgZnJhbWVzKSwgbGFiZWxzIChzbWFsbCB0ZXh0IG5lYXIgaW5wdXRzKSxcbiAqIHN1Ym1pdCBidXR0b25zLCBhbmQgY29tbW9uIGZvcm0tcmVsYXRlZCBsYXllciBuYW1lcy5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Rm9ybVNlY3Rpb24oc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSk6IHsgaXNGb3JtOiBib29sZWFuOyBmaWVsZHM6IEZvcm1GaWVsZEluZm9bXSB9IHtcbiAgY29uc3QgZm9ybUtleXdvcmRzID0gWydmb3JtJywgJ2lucHV0JywgJ2ZpZWxkJywgJ2NvbnRhY3QnLCAnc3Vic2NyaWJlJywgJ25ld3NsZXR0ZXInLCAnc2lnbnVwJywgJ3NpZ24tdXAnLCAnZW5xdWlyeScsICdpbnF1aXJ5J107XG4gIGNvbnN0IGlucHV0S2V5d29yZHMgPSBbJ2lucHV0JywgJ2ZpZWxkJywgJ3RleHQtZmllbGQnLCAndGV4dGZpZWxkJywgJ3RleHRfZmllbGQnLCAnZW1haWwnLCAncGhvbmUnLCAnbmFtZScsICdtZXNzYWdlJywgJ3RleHRhcmVhJ107XG4gIGNvbnN0IHN1Ym1pdEtleXdvcmRzID0gWydzdWJtaXQnLCAnc2VuZCcsICdidXR0b24nLCAnY3RhJywgJ2J0biddO1xuXG4gIGNvbnN0IHNlY3Rpb25OYW1lID0gc2VjdGlvbk5vZGUubmFtZS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBuYW1lSGludHNGb3JtID0gZm9ybUtleXdvcmRzLnNvbWUoa3cgPT4gc2VjdGlvbk5hbWUuaW5jbHVkZXMoa3cpKTtcblxuICBsZXQgaW5wdXRDb3VudCA9IDA7XG4gIGxldCBoYXNTdWJtaXRCdXR0b24gPSBmYWxzZTtcbiAgY29uc3QgZmllbGRzOiBGb3JtRmllbGRJbmZvW10gPSBbXTtcbiAgY29uc3QgdGV4dE5vZGVzOiB7IG5hbWU6IHN0cmluZzsgdGV4dDogc3RyaW5nOyB5OiBudW1iZXIgfVtdID0gW107XG4gIGNvbnN0IGlucHV0Tm9kZXM6IHsgbmFtZTogc3RyaW5nOyB5OiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH1bXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgY29uc3QgbmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgLy8gRGV0ZWN0IGlucHV0LWxpa2UgZnJhbWVzOiBuYXJyb3cgaGVpZ2h0ICgzMC02MHB4KSwgd2lkZXIgdGhhbiB0YWxsLCB3aXRoIGJvcmRlci9maWxsXG4gICAgaWYgKChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgbm9kZS50eXBlID09PSAnUkVDVEFOR0xFJykgJiYgbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICBjb25zdCBiID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgY29uc3QgaXNJbnB1dFNoYXBlID0gYi5oZWlnaHQgPj0gMzAgJiYgYi5oZWlnaHQgPD0gNzAgJiYgYi53aWR0aCA+IGIuaGVpZ2h0ICogMjtcbiAgICAgIGNvbnN0IGhhc0lucHV0TmFtZSA9IGlucHV0S2V5d29yZHMuc29tZShrdyA9PiBuYW1lLmluY2x1ZGVzKGt3KSk7XG5cbiAgICAgIGlmIChpc0lucHV0U2hhcGUgJiYgKGhhc0lucHV0TmFtZSB8fCBuYW1lSGludHNGb3JtKSkge1xuICAgICAgICBpbnB1dENvdW50Kys7XG4gICAgICAgIGlucHV0Tm9kZXMucHVzaCh7IG5hbWU6IG5vZGUubmFtZSwgeTogYi55LCBoZWlnaHQ6IGIuaGVpZ2h0IH0pO1xuXG4gICAgICAgIC8vIERldGVjdCBmaWVsZCB0eXBlIGZyb20gbmFtZVxuICAgICAgICBsZXQgZmllbGRUeXBlOiBGb3JtRmllbGRJbmZvWyd0eXBlJ10gPSAndGV4dCc7XG4gICAgICAgIGlmIChuYW1lLmluY2x1ZGVzKCdlbWFpbCcpKSBmaWVsZFR5cGUgPSAnZW1haWwnO1xuICAgICAgICBlbHNlIGlmIChuYW1lLmluY2x1ZGVzKCdwaG9uZScpIHx8IG5hbWUuaW5jbHVkZXMoJ3RlbCcpKSBmaWVsZFR5cGUgPSAncGhvbmUnO1xuICAgICAgICBlbHNlIGlmIChuYW1lLmluY2x1ZGVzKCd0ZXh0YXJlYScpIHx8IG5hbWUuaW5jbHVkZXMoJ21lc3NhZ2UnKSB8fCAoYi5oZWlnaHQgPiA4MCkpIGZpZWxkVHlwZSA9ICd0ZXh0YXJlYSc7XG4gICAgICAgIGVsc2UgaWYgKG5hbWUuaW5jbHVkZXMoJ3NlbGVjdCcpIHx8IG5hbWUuaW5jbHVkZXMoJ2Ryb3Bkb3duJykpIGZpZWxkVHlwZSA9ICdzZWxlY3QnO1xuICAgICAgICBlbHNlIGlmIChuYW1lLmluY2x1ZGVzKCdjaGVja2JveCcpIHx8IG5hbWUuaW5jbHVkZXMoJ2NoZWNrJykpIGZpZWxkVHlwZSA9ICdjaGVja2JveCc7XG4gICAgICAgIGVsc2UgaWYgKG5hbWUuaW5jbHVkZXMoJ3JhZGlvJykpIGZpZWxkVHlwZSA9ICdyYWRpbyc7XG5cbiAgICAgICAgZmllbGRzLnB1c2goe1xuICAgICAgICAgIGxhYmVsOiBub2RlLm5hbWUucmVwbGFjZSgvWy1fXS9nLCAnICcpLnJlcGxhY2UoL1xcYlxcdy9nLCBjID0+IGMudG9VcHBlckNhc2UoKSksXG4gICAgICAgICAgdHlwZTogZmllbGRUeXBlLFxuICAgICAgICAgIHJlcXVpcmVkOiBuYW1lLmluY2x1ZGVzKCdyZXF1aXJlZCcpIHx8IG5hbWUuaW5jbHVkZXMoJyonKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIERldGVjdCBzdWJtaXQgYnV0dG9uc1xuICAgICAgaWYgKHN1Ym1pdEtleXdvcmRzLnNvbWUoa3cgPT4gbmFtZS5pbmNsdWRlcyhrdykpICYmIGIuaGVpZ2h0ID49IDMwICYmIGIuaGVpZ2h0IDw9IDcwKSB7XG4gICAgICAgIGhhc1N1Ym1pdEJ1dHRvbiA9IHRydWU7XG4gICAgICAgIGlmICghZmllbGRzLmZpbmQoZiA9PiBmLnR5cGUgPT09ICdzdWJtaXQnKSkge1xuICAgICAgICAgIGZpZWxkcy5wdXNoKHsgbGFiZWw6ICdTdWJtaXQnLCB0eXBlOiAnc3VibWl0JywgcmVxdWlyZWQ6IGZhbHNlIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29sbGVjdCB0ZXh0IG5vZGVzIG5lYXIgaW5wdXRzIGFzIHBvdGVudGlhbCBsYWJlbHNcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcgJiYgbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICB0ZXh0Tm9kZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgdGV4dDogbm9kZS5jaGFyYWN0ZXJzIHx8ICcnLFxuICAgICAgICB5OiBub2RlLmFic29sdXRlQm91bmRpbmdCb3gueSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudmlzaWJsZSAhPT0gZmFsc2UpIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdhbGsoc2VjdGlvbk5vZGUpO1xuXG4gIC8vIE1hdGNoIGxhYmVscyB0byBmaWVsZHM6IHRleHQgbm9kZSBkaXJlY3RseSBhYm92ZSBhbiBpbnB1dCAod2l0aGluIDMwcHgpXG4gIGZvciAoY29uc3QgZmllbGQgb2YgZmllbGRzKSB7XG4gICAgY29uc3QgZmllbGRJbnB1dCA9IGlucHV0Tm9kZXMuZmluZChpbnAgPT4gaW5wLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhmaWVsZC5sYWJlbC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyAvZywgJ18nKSkpO1xuICAgIGlmIChmaWVsZElucHV0KSB7XG4gICAgICBjb25zdCBsYWJlbEFib3ZlID0gdGV4dE5vZGVzLmZpbmQodCA9PiB0LnkgPCBmaWVsZElucHV0LnkgJiYgKGZpZWxkSW5wdXQueSAtIHQueSkgPCA0MCk7XG4gICAgICBpZiAobGFiZWxBYm92ZSkge1xuICAgICAgICBmaWVsZC5sYWJlbCA9IGxhYmVsQWJvdmUudGV4dC5yZXBsYWNlKCcqJywgJycpLnRyaW0oKTtcbiAgICAgICAgaWYgKGxhYmVsQWJvdmUudGV4dC5pbmNsdWRlcygnKicpKSBmaWVsZC5yZXF1aXJlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgaXNGb3JtID0gKGlucHV0Q291bnQgPj0gMiAmJiBoYXNTdWJtaXRCdXR0b24pIHx8IChuYW1lSGludHNGb3JtICYmIGlucHV0Q291bnQgPj0gMSk7XG5cbiAgcmV0dXJuIHsgaXNGb3JtLCBmaWVsZHM6IGlzRm9ybSA/IGZpZWxkcyA6IFtdIH07XG59XG5cbi8qKlxuICogUGFyc2UgYWxsIHNlY3Rpb25zIGZyb20gYSBwYWdlIGZyYW1lIGFuZCBwcm9kdWNlIFNlY3Rpb25TcGVjIG9iamVjdHMuXG4gKi9cbi8qKlxuICogRXh0cmFjdCBldmVyeSBURVhUIG5vZGUgaW4gYSBzZWN0aW9uIGluIHJlYWRpbmcgb3JkZXIgKHRvcC10by1ib3R0b20sXG4gKiB0aGVuIGxlZnQtdG8tcmlnaHQgZm9yIGl0ZW1zIG9uIHRoZSBzYW1lIHJvdyB3aXRoaW4gYSAxMnB4IHRvbGVyYW5jZSkuXG4gKlxuICogVGhpcyBpcyB0aGUgY29udGVudCBzb3VyY2UgZm9yIHBhZ2UtYXNzZW1ibGVyIHdoZW4gZGVzaWduZXJzIGRvbid0IG5hbWVcbiAqIGxheWVycyBjb25zaXN0ZW50bHkuIEl0IHByZXNlcnZlcyBldmVyeSB2aXNpYmxlIHRleHQgZnJvbSB0aGUgRmlnbWEgZGVzaWduXG4gKiBzbyBub3RoaW5nIGNhbiBiZSBzaWxlbnRseSBkcm9wcGVkIGR1cmluZyBBQ0YgcG9wdWxhdGlvbi5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFRleHRDb250ZW50SW5PcmRlcihzZWN0aW9uTm9kZTogU2NlbmVOb2RlKTogVGV4dENvbnRlbnRFbnRyeVtdIHtcbiAgY29uc3Qgc2VjdGlvbkJvdW5kcyA9IHNlY3Rpb25Ob2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGlmICghc2VjdGlvbkJvdW5kcykgcmV0dXJuIFtdO1xuXG4gIHR5cGUgUmF3VGV4dCA9IHsgbm9kZTogVGV4dE5vZGU7IHJlbFk6IG51bWJlcjsgcmVsWDogbnVtYmVyOyBmb250U2l6ZTogbnVtYmVyIH07XG4gIGNvbnN0IGNvbGxlY3RlZDogUmF3VGV4dFtdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIpIHtcbiAgICBpZiAobm9kZS52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIGlmIChkZXB0aCA+IDgpIHJldHVybjtcblxuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgdCA9IG5vZGUgYXMgVGV4dE5vZGU7XG4gICAgICBjb25zdCBjaGFycyA9IHQuY2hhcmFjdGVycyB8fCAnJztcbiAgICAgIGlmICghY2hhcnMudHJpbSgpKSByZXR1cm47IC8vIHNraXAgZW1wdHkgdGV4dCBub2Rlc1xuICAgICAgY29uc3QgYmIgPSB0LmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICBpZiAoIWJiKSByZXR1cm47XG4gICAgICBjb25zdCBmcyA9IHQuZm9udFNpemUgIT09IGZpZ21hLm1peGVkID8gKHQuZm9udFNpemUgYXMgbnVtYmVyKSA6IDE2O1xuICAgICAgY29sbGVjdGVkLnB1c2goe1xuICAgICAgICBub2RlOiB0LFxuICAgICAgICByZWxZOiBiYi55IC0gc2VjdGlvbkJvdW5kcyEueSxcbiAgICAgICAgcmVsWDogYmIueCAtIHNlY3Rpb25Cb3VuZHMhLngsXG4gICAgICAgIGZvbnRTaXplOiBmcyxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuOyAvLyBkb24ndCByZWN1cnNlIGludG8gVEVYVFxuICAgIH1cblxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkLCBkZXB0aCArIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICgnY2hpbGRyZW4nIGluIHNlY3Rpb25Ob2RlKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiAoc2VjdGlvbk5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgd2FsayhjaGlsZCwgMCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVhZGluZyBvcmRlcjogc29ydCBieSBZIChyb3dzKSwgdGhlbiBieSBYIHdpdGhpbiBzYW1lIHJvdyAoMTJweCB0b2xlcmFuY2UpLlxuICBjb2xsZWN0ZWQuc29ydCgoYSwgYikgPT4ge1xuICAgIGlmIChNYXRoLmFicyhhLnJlbFkgLSBiLnJlbFkpIDwgMTIpIHJldHVybiBhLnJlbFggLSBiLnJlbFg7XG4gICAgcmV0dXJuIGEucmVsWSAtIGIucmVsWTtcbiAgfSk7XG5cbiAgLy8gUm9sZSBhc3NpZ25tZW50IFx1MjAxNCB0b3AtbW9zdCBsYXJnZXN0IHRleHQgaXMgJ2hlYWRpbmcnLCBzZWNvbmQgaXMgJ3N1YmhlYWRpbmcnLFxuICAvLyBzbWFsbCBzaG9ydCB0ZXh0cyBuZWFyIGJ1dHRvbnMgYXJlICdidXR0b25fdGV4dCcsIHJlc3QgYXJlICdib2R5JyBvciAndGV4dF9OJy5cbiAgbGV0IGhlYWRpbmdBc3NpZ25lZCA9IGZhbHNlO1xuICBsZXQgc3ViaGVhZGluZ0Fzc2lnbmVkID0gZmFsc2U7XG5cbiAgcmV0dXJuIGNvbGxlY3RlZC5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgIGNvbnN0IHRleHQgPSBpdGVtLm5vZGUuY2hhcmFjdGVycyB8fCAnJztcbiAgICBjb25zdCBjbGVhbk5hbWUgPSBpdGVtLm5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICBjb25zdCBuYW1lSGludCA9IGNsZWFuTmFtZSB8fCAnJztcblxuICAgIGxldCByb2xlOiBzdHJpbmc7XG4gICAgaWYgKG5hbWVIaW50LmluY2x1ZGVzKCdidXR0b24nKSB8fCBuYW1lSGludC5pbmNsdWRlcygnY3RhJykgfHwgbmFtZUhpbnQuaW5jbHVkZXMoJ2J0bicpKSB7XG4gICAgICByb2xlID0gJ2J1dHRvbl90ZXh0JztcbiAgICB9IGVsc2UgaWYgKCFoZWFkaW5nQXNzaWduZWQgJiYgaXRlbS5mb250U2l6ZSA+PSAyOCkge1xuICAgICAgcm9sZSA9ICdoZWFkaW5nJztcbiAgICAgIGhlYWRpbmdBc3NpZ25lZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmICghc3ViaGVhZGluZ0Fzc2lnbmVkICYmIGl0ZW0uZm9udFNpemUgPj0gMTggJiYgaXRlbS5mb250U2l6ZSA8IDI4KSB7XG4gICAgICByb2xlID0gJ3N1YmhlYWRpbmcnO1xuICAgICAgc3ViaGVhZGluZ0Fzc2lnbmVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGl0ZW0uZm9udFNpemUgPD0gMTMgfHwgKG5hbWVIaW50LmluY2x1ZGVzKCdjYXB0aW9uJykgfHwgbmFtZUhpbnQuaW5jbHVkZXMoJ2V5ZWJyb3cnKSB8fCBuYW1lSGludC5pbmNsdWRlcygndGFnJykpKSB7XG4gICAgICByb2xlID0gJ2NhcHRpb24nO1xuICAgIH0gZWxzZSBpZiAodGV4dC5sZW5ndGggPCAzMCAmJiBpdGVtLmZvbnRTaXplIDw9IDE2KSB7XG4gICAgICAvLyBTaG9ydCwgc21hbGwgXHUyMDE0IGxpa2VseSBhIGxpbmsgb3IgbGFiZWxcbiAgICAgIHJvbGUgPSAnbGFiZWwnO1xuICAgIH0gZWxzZSB7XG4gICAgICByb2xlID0gYGJvZHlfJHtpZHh9YDtcbiAgICB9XG5cbiAgICBjb25zdCBiYiA9IGl0ZW0ubm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94ITtcbiAgICByZXR1cm4ge1xuICAgICAgaW5kZXg6IGlkeCxcbiAgICAgIHRleHQsXG4gICAgICByb2xlLFxuICAgICAgbGF5ZXJOYW1lOiBpdGVtLm5vZGUubmFtZSxcbiAgICAgIGZvbnRTaXplOiBNYXRoLnJvdW5kKGl0ZW0uZm9udFNpemUpLFxuICAgICAgYm91bmRzOiB7XG4gICAgICAgIHg6IE1hdGgucm91bmQoaXRlbS5yZWxYKSxcbiAgICAgICAgeTogTWF0aC5yb3VuZChpdGVtLnJlbFkpLFxuICAgICAgICB3aWR0aDogTWF0aC5yb3VuZChiYi53aWR0aCksXG4gICAgICAgIGhlaWdodDogTWF0aC5yb3VuZChiYi5oZWlnaHQpLFxuICAgICAgfSxcbiAgICB9O1xuICB9KTtcbn1cblxuLyoqXG4gKiBQYXJzZSBzZWN0aW9ucyBmcm9tIGEgcGFnZSBmcmFtZS5cbiAqXG4gKiBAcGFyYW0gcGFnZUZyYW1lIFRoZSB0b3AtbGV2ZWwgcGFnZSBmcmFtZSB0byB3YWxrLlxuICogQHBhcmFtIGdsb2JhbE5hbWVzIE9wdGlvbmFsIHNldCBvZiBub3JtYWxpemVkIHNlY3Rpb24gbmFtZXMgdGhhdCBhcHBlYXIgb25cbiAqICAgICAgICAgICAgICAgICAgICBcdTIyNjUyIHNlbGVjdGVkIHBhZ2VzLiBXaGVuIHByb3ZpZGVkLCBtYXRjaGluZyBzZWN0aW9ucyBhcmVcbiAqICAgICAgICAgICAgICAgICAgICBtYXJrZWQgYGlzR2xvYmFsOiB0cnVlYCBzbyB0aGUgYWdlbnQgY2FuIHByb21vdGUgdGhlbSB0b1xuICogICAgICAgICAgICAgICAgICAgIHNoYXJlZCBXUCB0aGVtZSBwYXJ0cyBpbnN0ZWFkIG9mIGR1cGxpY2F0aW5nIHBlci1wYWdlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZWN0aW9ucyhwYWdlRnJhbWU6IEZyYW1lTm9kZSwgZ2xvYmFsTmFtZXM/OiBTZXQ8c3RyaW5nPik6IFJlY29yZDxzdHJpbmcsIFNlY3Rpb25TcGVjPiB7XG4gIGNvbnN0IHNlY3Rpb25Ob2RlcyA9IGlkZW50aWZ5U2VjdGlvbnMocGFnZUZyYW1lKTtcbiAgY29uc3Qgc3BlY3M6IFJlY29yZDxzdHJpbmcsIFNlY3Rpb25TcGVjPiA9IHt9O1xuXG4gIGxldCBwcmV2Qm90dG9tID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlY3Rpb25Ob2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGUgPSBzZWN0aW9uTm9kZXNbaV07XG4gICAgY29uc3QgYm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgIGlmICghYm91bmRzKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGxheW91dE5hbWUgPSB0b0xheW91dE5hbWUobm9kZS5uYW1lKTtcbiAgICBjb25zdCBpc0ZyYW1lID0gbm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnO1xuICAgIGNvbnN0IGZyYW1lID0gaXNGcmFtZSA/IChub2RlIGFzIEZyYW1lTm9kZSkgOiBudWxsO1xuXG4gICAgLy8gRGV0ZXJtaW5lIHNwYWNpbmcgc291cmNlIGFuZCBleHRyYWN0IHNwYWNpbmdcbiAgICBjb25zdCBoYXNBdXRvTGF5b3V0ID0gZnJhbWU/LmxheW91dE1vZGUgJiYgZnJhbWUubGF5b3V0TW9kZSAhPT0gJ05PTkUnO1xuICAgIGxldCBzcGFjaW5nU291cmNlOiAnYXV0by1sYXlvdXQnIHwgJ2Fic29sdXRlLWNvb3JkaW5hdGVzJztcbiAgICBsZXQgc2VjdGlvblN0eWxlczogUGFydGlhbDxTZWN0aW9uU3R5bGVzPjtcbiAgICBsZXQgaXRlbVNwYWNpbmc6IHN0cmluZyB8IG51bGw7XG5cbiAgICBpZiAoaGFzQXV0b0xheW91dCAmJiBmcmFtZSkge1xuICAgICAgY29uc3Qgc3BhY2luZyA9IGV4dHJhY3RBdXRvTGF5b3V0U3BhY2luZyhmcmFtZSk7XG4gICAgICBzcGFjaW5nU291cmNlID0gc3BhY2luZy5zcGFjaW5nU291cmNlO1xuICAgICAgc2VjdGlvblN0eWxlcyA9IHNwYWNpbmcuc2VjdGlvblN0eWxlcztcbiAgICAgIGl0ZW1TcGFjaW5nID0gc3BhY2luZy5pdGVtU3BhY2luZztcbiAgICB9IGVsc2UgaWYgKGZyYW1lKSB7XG4gICAgICBjb25zdCBzcGFjaW5nID0gZXh0cmFjdEFic29sdXRlU3BhY2luZyhmcmFtZSk7XG4gICAgICBzcGFjaW5nU291cmNlID0gc3BhY2luZy5zcGFjaW5nU291cmNlO1xuICAgICAgc2VjdGlvblN0eWxlcyA9IHNwYWNpbmcuc2VjdGlvblN0eWxlcztcbiAgICAgIGl0ZW1TcGFjaW5nID0gc3BhY2luZy5pdGVtU3BhY2luZztcbiAgICB9IGVsc2Uge1xuICAgICAgc3BhY2luZ1NvdXJjZSA9ICdhYnNvbHV0ZS1jb29yZGluYXRlcyc7XG4gICAgICBzZWN0aW9uU3R5bGVzID0ge307XG4gICAgICBpdGVtU3BhY2luZyA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gQmFzZSBzZWN0aW9uIHN0eWxlcyAoYmFja2dyb3VuZCwgZ3JhZGllbnQsIGV0Yy4pXG4gICAgY29uc3QgYmFzZVN0eWxlcyA9IGV4dHJhY3RTZWN0aW9uU3R5bGVzKG5vZGUpO1xuICAgIGNvbnN0IG1lcmdlZFN0eWxlczogU2VjdGlvblN0eWxlcyA9IHtcbiAgICAgIC4uLmJhc2VTdHlsZXMsXG4gICAgICAuLi5zZWN0aW9uU3R5bGVzLFxuICAgIH07XG5cbiAgICAvLyBFbGVtZW50c1xuICAgIGNvbnN0IGVsZW1lbnRzID0gZXh0cmFjdEVsZW1lbnRzKG5vZGUpO1xuXG4gICAgLy8gR3JpZCBkZXRlY3Rpb25cbiAgICBjb25zdCBncmlkID0gZnJhbWUgPyBkZXRlY3RHcmlkKGZyYW1lKSA6IHtcbiAgICAgIGxheW91dE1vZGU6ICdhYnNvbHV0ZScgYXMgY29uc3QsXG4gICAgICBjb2x1bW5zOiAxLFxuICAgICAgZ2FwOiBpdGVtU3BhY2luZyxcbiAgICAgIHJvd0dhcDogbnVsbCxcbiAgICAgIGNvbHVtbkdhcDogbnVsbCxcbiAgICAgIGl0ZW1NaW5XaWR0aDogbnVsbCxcbiAgICB9O1xuXG4gICAgLy8gRW5zdXJlIGdyaWQgZ2FwIGlzIHNldCBmcm9tIGl0ZW1TcGFjaW5nIGlmIG5vdCBhbHJlYWR5XG4gICAgaWYgKCFncmlkLmdhcCAmJiBpdGVtU3BhY2luZykge1xuICAgICAgZ3JpZC5nYXAgPSBpdGVtU3BhY2luZztcbiAgICB9XG5cbiAgICAvLyBPdmVybGFwIGRldGVjdGlvblxuICAgIGxldCBvdmVybGFwOiBPdmVybGFwSW5mbyB8IG51bGwgPSBudWxsO1xuICAgIGlmIChpID4gMCkge1xuICAgICAgY29uc3Qgb3ZlcmxhcFB4ID0gcHJldkJvdHRvbSAtIGJvdW5kcy55O1xuICAgICAgaWYgKG92ZXJsYXBQeCA+IDApIHtcbiAgICAgICAgb3ZlcmxhcCA9IHtcbiAgICAgICAgICB3aXRoU2VjdGlvbjogc2VjdGlvbk5vZGVzW2kgLSAxXS5uYW1lLFxuICAgICAgICAgIHBpeGVsczogTWF0aC5yb3VuZChvdmVybGFwUHgpLFxuICAgICAgICAgIGNzc01hcmdpblRvcDogYC0ke01hdGgucm91bmQob3ZlcmxhcFB4KX1weGAsXG4gICAgICAgICAgcmVxdWlyZXNaSW5kZXg6IHRydWUsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSW50ZXJhY3Rpb25zXG4gICAgY29uc3QgaW50ZXJhY3Rpb25zID0gZXh0cmFjdEludGVyYWN0aW9ucyhub2RlKTtcblxuICAgIC8vIExheWVyIGNvbXBvc2l0aW9uIGFuYWx5c2lzXG4gICAgY29uc3QgbGF5ZXJzID0gZXh0cmFjdExheWVycyhub2RlLCBlbGVtZW50cyk7XG4gICAgY29uc3QgY29tcG9zaXRpb24gPSBkZXRlY3RDb21wb3NpdGlvbihsYXllcnMpO1xuXG4gICAgLy8gRW5yaWNoIGVsZW1lbnRzIHdpdGggcG9zaXRpb24gZGF0YSBmcm9tIGNvbXBvc2l0aW9uXG4gICAgaWYgKGNvbXBvc2l0aW9uLmhhc1RleHRPdmVySW1hZ2UgfHwgY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlKSB7XG4gICAgICAvLyBTZWN0aW9uIG5lZWRzIHBvc2l0aW9uOiByZWxhdGl2ZSBmb3Igb3ZlcmxheSBjaGlsZHJlblxuICAgICAgbWVyZ2VkU3R5bGVzLm92ZXJmbG93ID0gbWVyZ2VkU3R5bGVzLm92ZXJmbG93IHx8ICdoaWRkZW4nO1xuXG4gICAgICBmb3IgKGNvbnN0IFtlbGVtTmFtZSwgZWxlbVN0eWxlc10gb2YgT2JqZWN0LmVudHJpZXMoZWxlbWVudHMpKSB7XG4gICAgICAgIGlmIChjb21wb3NpdGlvbi5vdmVybGF5RWxlbWVudHMuaW5jbHVkZXMoZWxlbU5hbWUpIHx8IGNvbXBvc2l0aW9uLmhhc0JhY2tncm91bmRJbWFnZSkge1xuICAgICAgICAgIC8vIEZpbmQgbWF0Y2hpbmcgbGF5ZXIgZm9yIHBvc2l0aW9uIGRhdGFcbiAgICAgICAgICBjb25zdCBsYXllciA9IGxheWVycy5maW5kKGwgPT4gbC5uYW1lID09PSBlbGVtTmFtZSk7XG4gICAgICAgICAgaWYgKGxheWVyICYmIGxheWVyLnJvbGUgIT09ICdiYWNrZ3JvdW5kX2ltYWdlJykge1xuICAgICAgICAgICAgZWxlbVN0eWxlcy5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgICAgICBlbGVtU3R5bGVzLnpJbmRleCA9IGxheWVyLnpJbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGb3JtIGRldGVjdGlvblxuICAgIGNvbnN0IGZvcm1SZXN1bHQgPSBkZXRlY3RGb3JtU2VjdGlvbihub2RlKTtcblxuICAgIC8vIE9yZGVyZWQgdGV4dCBjb250ZW50IFx1MjAxNCBldmVyeSB0ZXh0IGluIHJlYWRpbmcgb3JkZXIgKGZvciBwYWdlLWFzc2VtYmxlciBtYXBwaW5nKVxuICAgIGNvbnN0IHRleHRDb250ZW50SW5PcmRlciA9IGV4dHJhY3RUZXh0Q29udGVudEluT3JkZXIobm9kZSk7XG5cbiAgICAvLyBQYXR0ZXJuIGRldGVjdGlvbiAoY2Fyb3VzZWwgLyBhY2NvcmRpb24gLyB0YWJzIC8gbW9kYWwpXG4gICAgbGV0IGNvbXBvbmVudFBhdHRlcm5zOiBSZXR1cm5UeXBlPHR5cGVvZiBkZXRlY3RDb21wb25lbnRQYXR0ZXJucz4gfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHAgPSBkZXRlY3RDb21wb25lbnRQYXR0ZXJucyhub2RlKTtcbiAgICAgIGlmIChwLmxlbmd0aCA+IDApIGNvbXBvbmVudFBhdHRlcm5zID0gcDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ2RldGVjdENvbXBvbmVudFBhdHRlcm5zIGZhaWxlZCBmb3Igc2VjdGlvbicsIG5vZGUubmFtZSwgZSk7XG4gICAgfVxuXG4gICAgLy8gUmVwZWF0ZXIgZGV0ZWN0aW9uIChjYXJkcyAvIGZlYXR1cmVzIC8gcHJpY2luZyAvIGV0Yy4pXG4gICAgbGV0IHJlcGVhdGVyczogUmV0dXJuVHlwZTx0eXBlb2YgZGV0ZWN0UmVwZWF0ZXJzPiB8IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGRldGVjdFJlcGVhdGVycyhub2RlKTtcbiAgICAgIGlmIChPYmplY3Qua2V5cyhyKS5sZW5ndGggPiAwKSByZXBlYXRlcnMgPSByO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignZGV0ZWN0UmVwZWF0ZXJzIGZhaWxlZCBmb3Igc2VjdGlvbicsIG5vZGUubmFtZSwgZSk7XG4gICAgfVxuXG4gICAgLy8gR2xvYmFsIGRldGVjdGlvbiAoY3Jvc3MtcGFnZSlcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplU2VjdGlvbk5hbWUobm9kZS5uYW1lKTtcbiAgICBjb25zdCBpc0dsb2JhbCA9IGdsb2JhbE5hbWVzID8gZ2xvYmFsTmFtZXMuaGFzKG5vcm1hbGl6ZWQpIDogZmFsc2U7XG4gICAgY29uc3QgZ2xvYmFsUm9sZSA9IGlzR2xvYmFsXG4gICAgICA/IGNsYXNzaWZ5R2xvYmFsUm9sZShpLCBzZWN0aW9uTm9kZXMubGVuZ3RoLCBNYXRoLnJvdW5kKGJvdW5kcy5oZWlnaHQpKVxuICAgICAgOiBudWxsO1xuXG4gICAgLy8gTmF2aWdhdGlvbiAob25seSB3b3J0aCBjb21wdXRpbmcgZm9yIGhlYWRlci9mb290ZXIgY2FuZGlkYXRlcylcbiAgICBsZXQgbmF2aWdhdGlvbjogTm9uTnVsbGFibGU8UmV0dXJuVHlwZTx0eXBlb2YgZGV0ZWN0TmF2aWdhdGlvbj4+IHwgdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBuYW1lID0gKG5vZGUubmFtZSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChpc0dsb2JhbCB8fCAvXFxiKGhlYWRlcnxmb290ZXJ8bmF2fG5hdmJhcnxuYXZpZ2F0aW9uKVxcYi8udGVzdChuYW1lKSkge1xuICAgICAgICBjb25zdCBuYXYgPSBkZXRlY3ROYXZpZ2F0aW9uKG5vZGUpO1xuICAgICAgICBpZiAobmF2KSBuYXZpZ2F0aW9uID0gbmF2O1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignZGV0ZWN0TmF2aWdhdGlvbiBmYWlsZWQgZm9yIHNlY3Rpb24nLCBub2RlLm5hbWUsIGUpO1xuICAgIH1cblxuICAgIC8vIFNlY3Rpb24gc2VtYW50aWMgcm9sZSBpbmZlcmVuY2VcbiAgICBsZXQgc2VjdGlvblR5cGU6IFJldHVyblR5cGU8dHlwZW9mIGluZmVyU2VjdGlvblR5cGU+IHwgbnVsbCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIHNlY3Rpb25UeXBlID0gaW5mZXJTZWN0aW9uVHlwZSh7XG4gICAgICAgIHNlY3Rpb25JbmRleDogaSxcbiAgICAgICAgdG90YWxTZWN0aW9uczogc2VjdGlvbk5vZGVzLmxlbmd0aCxcbiAgICAgICAgaXNGb3JtU2VjdGlvbjogZm9ybVJlc3VsdC5pc0Zvcm0sXG4gICAgICAgIHBhdHRlcm5zOiBjb21wb25lbnRQYXR0ZXJucyB8fCBbXSxcbiAgICAgICAgcmVwZWF0ZXJzOiByZXBlYXRlcnMgfHwge30sXG4gICAgICAgIGVsZW1lbnRzLFxuICAgICAgICB0ZXh0Q29udGVudEluT3JkZXIsXG4gICAgICAgIGxheWVyTmFtZTogbm9kZS5uYW1lIHx8ICcnLFxuICAgICAgICBzZWN0aW9uSGVpZ2h0OiBNYXRoLnJvdW5kKGJvdW5kcy5oZWlnaHQpLFxuICAgICAgICBpc0dsb2JhbCxcbiAgICAgICAgZ2xvYmFsUm9sZSxcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignaW5mZXJTZWN0aW9uVHlwZSBmYWlsZWQgZm9yIHNlY3Rpb24nLCBub2RlLm5hbWUsIGUpO1xuICAgIH1cblxuICAgIHNwZWNzW2xheW91dE5hbWVdID0ge1xuICAgICAgc3BhY2luZ1NvdXJjZSxcbiAgICAgIGZpZ21hTm9kZUlkOiBub2RlLmlkLFxuICAgICAgc2NyZWVuc2hvdEZpbGU6IGBzY3JlZW5zaG90cy8ke3NjcmVlbnNob3RGaWxlbmFtZShub2RlLm5hbWUpfWAsXG4gICAgICBzZWN0aW9uOiBtZXJnZWRTdHlsZXMsXG4gICAgICBlbGVtZW50cyxcbiAgICAgIGdyaWQsXG4gICAgICBpbnRlcmFjdGlvbnM6IGludGVyYWN0aW9ucy5sZW5ndGggPiAwID8gaW50ZXJhY3Rpb25zIDogdW5kZWZpbmVkLFxuICAgICAgb3ZlcmxhcCxcbiAgICAgIGxheWVyczogbGF5ZXJzLmxlbmd0aCA+IDAgPyBsYXllcnMgOiB1bmRlZmluZWQsXG4gICAgICBjb21wb3NpdGlvbjogKGNvbXBvc2l0aW9uLmhhc1RleHRPdmVySW1hZ2UgfHwgY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlKSA/IGNvbXBvc2l0aW9uIDogdW5kZWZpbmVkLFxuICAgICAgaXNGb3JtU2VjdGlvbjogZm9ybVJlc3VsdC5pc0Zvcm0gfHwgdW5kZWZpbmVkLFxuICAgICAgZm9ybUZpZWxkczogZm9ybVJlc3VsdC5maWVsZHMubGVuZ3RoID4gMCA/IGZvcm1SZXN1bHQuZmllbGRzIDogdW5kZWZpbmVkLFxuICAgICAgdGV4dENvbnRlbnRJbk9yZGVyOiB0ZXh0Q29udGVudEluT3JkZXIubGVuZ3RoID4gMCA/IHRleHRDb250ZW50SW5PcmRlciA6IHVuZGVmaW5lZCxcbiAgICAgIGNvbXBvbmVudFBhdHRlcm5zLFxuICAgICAgaXNHbG9iYWw6IGlzR2xvYmFsIHx8IHVuZGVmaW5lZCxcbiAgICAgIGdsb2JhbFJvbGU6IGlzR2xvYmFsID8gZ2xvYmFsUm9sZSA6IHVuZGVmaW5lZCxcbiAgICAgIHNlY3Rpb25UeXBlOiBzZWN0aW9uVHlwZT8udHlwZSxcbiAgICAgIHNlY3Rpb25UeXBlQ29uZmlkZW5jZTogc2VjdGlvblR5cGU/LmNvbmZpZGVuY2UsXG4gICAgICByZXBlYXRlcnMsXG4gICAgICBuYXZpZ2F0aW9uLFxuICAgIH07XG5cbiAgICBwcmV2Qm90dG9tID0gYm91bmRzLnkgKyBib3VuZHMuaGVpZ2h0O1xuICB9XG5cbiAgcmV0dXJuIHNwZWNzO1xufVxuIiwgImltcG9ydCB7IEltYWdlRXhwb3J0VGFzaywgSW1hZ2VNYXAsIEltYWdlTWFwRW50cnkgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHNsdWdpZnksIHNjcmVlbnNob3RGaWxlbmFtZSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgaGFzSW1hZ2VGaWxsIH0gZnJvbSAnLi9jb2xvcic7XG5cbmNvbnN0IEJBVENIX1NJWkUgPSAxMDtcblxuLyoqXG4gKiBJZGVudGlmeSBzZWN0aW9uLWxldmVsIGNoaWxkcmVuLCBtYXRjaGluZyB0aGUgc2FtZSBsb2dpYyBhcyBzZWN0aW9uLXBhcnNlci50cy5cbiAqIElmIHRoZSBmcmFtZSBoYXMgYSBzaW5nbGUgd3JhcHBlciBjaGlsZCwgZHJpbGwgb25lIGxldmVsIGRlZXBlci5cbiAqL1xuZnVuY3Rpb24gaWRlbnRpZnlTZWN0aW9uTm9kZXMocGFnZUZyYW1lOiBGcmFtZU5vZGUpOiBTY2VuZU5vZGVbXSB7XG4gIGxldCBjYW5kaWRhdGVzID0gcGFnZUZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveCAmJlxuICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveC5oZWlnaHQgPiA1MFxuICApO1xuXG4gIC8vIElmIHRoZXJlJ3MgYSBzaW5nbGUgY29udGFpbmVyIGNoaWxkLCBkcmlsbCBvbmUgbGV2ZWwgZGVlcGVyIChtYXRjaGVzIHNlY3Rpb24tcGFyc2VyLnRzKVxuICBpZiAoY2FuZGlkYXRlcy5sZW5ndGggPT09IDEgJiYgJ2NoaWxkcmVuJyBpbiBjYW5kaWRhdGVzWzBdKSB7XG4gICAgY29uc3Qgd3JhcHBlciA9IGNhbmRpZGF0ZXNbMF0gYXMgRnJhbWVOb2RlO1xuICAgIGNvbnN0IGlubmVyQ2FuZGlkYXRlcyA9IHdyYXBwZXIuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3guaGVpZ2h0ID4gNTBcbiAgICApO1xuICAgIGlmIChpbm5lckNhbmRpZGF0ZXMubGVuZ3RoID4gMSkge1xuICAgICAgY2FuZGlkYXRlcyA9IGlubmVyQ2FuZGlkYXRlcztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gWy4uLmNhbmRpZGF0ZXNdLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueSk7XG59XG5cbi8qKlxuICogQnVpbGQgdGhlIGxpc3Qgb2YgYWxsIGV4cG9ydCB0YXNrcyBmb3IgYSBwYWdlIGZyYW1lLlxuICogSW5jbHVkZXM6IGZ1bGwtcGFnZSBjb21wb3NpdGUgc2NyZWVuc2hvdCwgcGVyLXNlY3Rpb24gc2NyZWVuc2hvdHMsXG4gKiBhbmQgaW1hZ2UgYXNzZXRzIChQTkcgZm9yIHBob3RvcywgU1ZHIGZvciB2ZWN0b3IgaWNvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRFeHBvcnRUYXNrcyhwYWdlRnJhbWU6IEZyYW1lTm9kZSwgcGFnZVNsdWc6IHN0cmluZyk6IEltYWdlRXhwb3J0VGFza1tdIHtcbiAgY29uc3QgdGFza3M6IEltYWdlRXhwb3J0VGFza1tdID0gW107XG4gIGNvbnN0IHBhZ2VQYXRoID0gYHBhZ2VzLyR7cGFnZVNsdWd9YDtcblxuICAvLyBGdWxsLXBhZ2UgY29tcG9zaXRlIHNjcmVlbnNob3QgXHUyMDE0IGNyaXRpY2FsIGZvciBhZ2VudCdzIGZ1bGwtcGFnZSB2aXN1YWwgcmV2aWV3LlxuICB0YXNrcy5wdXNoKHtcbiAgICBub2RlSWQ6IHBhZ2VGcmFtZS5pZCxcbiAgICBub2RlTmFtZTogcGFnZUZyYW1lLm5hbWUsXG4gICAgdHlwZTogJ2Z1bGwtcGFnZScsXG4gICAgZmlsZW5hbWU6ICdfZnVsbC1wYWdlLnBuZycsXG4gICAgcGFnZVBhdGgsXG4gICAgZm9ybWF0OiAnUE5HJyxcbiAgICBzY2FsZTogMSxcbiAgfSk7XG5cbiAgLy8gUGVyLXNlY3Rpb24gc2NyZWVuc2hvdHMgYXQgMXggXHUyMDE0IHVzZXMgc2FtZSB3cmFwcGVyIGRyaWxsLWRvd24gYXMgc2VjdGlvbi1wYXJzZXJcbiAgY29uc3Qgc2VjdGlvbnMgPSBpZGVudGlmeVNlY3Rpb25Ob2RlcyhwYWdlRnJhbWUpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB0YXNrcy5wdXNoKHtcbiAgICAgIG5vZGVJZDogc2VjdGlvbnNbaV0uaWQsXG4gICAgICBub2RlTmFtZTogc2VjdGlvbnNbaV0ubmFtZSxcbiAgICAgIHR5cGU6ICdzY3JlZW5zaG90JyxcbiAgICAgIGZpbGVuYW1lOiBzY3JlZW5zaG90RmlsZW5hbWUoc2VjdGlvbnNbaV0ubmFtZSksXG4gICAgICBwYWdlUGF0aCxcbiAgICAgIGZvcm1hdDogJ1BORycsXG4gICAgICBzY2FsZTogMSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEltYWdlIGFzc2V0cyBcdTIwMTQgZGV0ZWN0IGljb25zICh2ZWN0b3Itb25seSwgc21hbGwpIHZzIHBob3RvcyAocmFzdGVyIGZpbGxzKVxuICBjb25zdCBpY29uTm9kZXMgPSBmaW5kSWNvbk5vZGVzKHBhZ2VGcmFtZSk7XG4gIGNvbnN0IHNlZW5JY29uSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgaWNvbk5vZGUgb2YgaWNvbk5vZGVzKSB7XG4gICAgaWYgKHNlZW5JY29uSWRzLmhhcyhpY29uTm9kZS5pZCkpIGNvbnRpbnVlO1xuICAgIHNlZW5JY29uSWRzLmFkZChpY29uTm9kZS5pZCk7XG4gICAgdGFza3MucHVzaCh7XG4gICAgICBub2RlSWQ6IGljb25Ob2RlLmlkLFxuICAgICAgbm9kZU5hbWU6IGljb25Ob2RlLm5hbWUsXG4gICAgICB0eXBlOiAnYXNzZXQnLFxuICAgICAgZmlsZW5hbWU6IGAke3NsdWdpZnkoaWNvbk5vZGUubmFtZSl9LnN2Z2AsXG4gICAgICBwYWdlUGF0aCxcbiAgICAgIGZvcm1hdDogJ1NWRycsXG4gICAgICBzY2FsZTogMSxcbiAgICAgIHByZWZlclN2ZzogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGltYWdlTm9kZXMgPSBmaW5kSW1hZ2VOb2RlcyhwYWdlRnJhbWUpO1xuICBjb25zdCBzZWVuSGFzaGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCBpbWdOb2RlIG9mIGltYWdlTm9kZXMpIHtcbiAgICAvLyBTa2lwIG5vZGVzIGFscmVhZHkgcXVldWVkIGFzIFNWRyBpY29uc1xuICAgIGlmIChzZWVuSWNvbklkcy5oYXMoaW1nTm9kZS5pZCkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGhhc2hLZXkgPSBgJHtpbWdOb2RlLm5hbWV9XyR7aW1nTm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94Py53aWR0aH1fJHtpbWdOb2RlLmFic29sdXRlQm91bmRpbmdCb3g/LmhlaWdodH1gO1xuICAgIGlmIChzZWVuSGFzaGVzLmhhcyhoYXNoS2V5KSkgY29udGludWU7XG4gICAgc2Vlbkhhc2hlcy5hZGQoaGFzaEtleSk7XG5cbiAgICBjb25zdCBmaWxlbmFtZSA9IGAke3NsdWdpZnkoaW1nTm9kZS5uYW1lKX0ucG5nYDtcbiAgICB0YXNrcy5wdXNoKHtcbiAgICAgIG5vZGVJZDogaW1nTm9kZS5pZCxcbiAgICAgIG5vZGVOYW1lOiBpbWdOb2RlLm5hbWUsXG4gICAgICB0eXBlOiAnYXNzZXQnLFxuICAgICAgZmlsZW5hbWUsXG4gICAgICBwYWdlUGF0aCxcbiAgICAgIGZvcm1hdDogJ1BORycsXG4gICAgICBzY2FsZTogMSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB0YXNrcztcbn1cblxuLyoqXG4gKiBJZGVudGlmeSBpY29uIG5vZGVzIFx1MjAxNCB2ZWN0b3Itb25seSwgdHlwaWNhbGx5IHNtYWxsICg8IDY0cHgpLiBUaGVzZSBhcmVcbiAqIGV4cG9ydGVkIGFzIFNWRyBzbyB0aGUgdGhlbWUgY2FuIGlubGluZSB0aGVtLCByZWNvbG9yIHZpYSBDU1MgY3VycmVudENvbG9yLFxuICogYW5kIHJlbmRlciBzaGFycCBhdCBhbnkgcmVzb2x1dGlvbi5cbiAqXG4gKiBIZXVyaXN0aWNzOlxuICogICAtIG5vZGUudHlwZSA9PT0gJ1ZFQ1RPUicgKHB1cmUgdmVjdG9yIHBhdGgpXG4gKiAgIC0gRlJBTUUvQ09NUE9ORU5UIHdob3NlIGVudGlyZSBzdWJ0cmVlIGlzIHZlY3RvciAobm8gSU1BR0UgZmlsbHMsIG5vIFRFWFQpXG4gKiAgICAgQU5EIGJvdW5kaW5nIGJveCBcdTIyNjQgNjRcdTAwRDc2NFxuICogICAtIExheWVyIG5hbWUgY29udGFpbnMgXCJpY29uXCIgKGhpbnQpXG4gKi9cbmZ1bmN0aW9uIGZpbmRJY29uTm9kZXMocm9vdDogU2NlbmVOb2RlKTogU2NlbmVOb2RlW10ge1xuICBjb25zdCBpY29uczogU2NlbmVOb2RlW10gPSBbXTtcblxuICBmdW5jdGlvbiBpc1ZlY3Rvck9ubHkobjogU2NlbmVOb2RlKTogYm9vbGVhbiB7XG4gICAgaWYgKG4udHlwZSA9PT0gJ1RFWFQnKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGhhc0ltYWdlRmlsbChuIGFzIGFueSkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnZpc2libGUgPT09IGZhbHNlKSBjb250aW51ZTtcbiAgICAgICAgaWYgKCFpc1ZlY3Rvck9ubHkoY2hpbGQpKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIGNvbnN0IGJiID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgIGNvbnN0IHNtYWxsaXNoID0gYmIgJiYgYmIud2lkdGggPD0gNjQgJiYgYmIuaGVpZ2h0IDw9IDY0O1xuXG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1ZFQ1RPUicpIHtcbiAgICAgIGljb25zLnB1c2gobm9kZSk7XG4gICAgICByZXR1cm47IC8vIGRvbid0IHJlY3Vyc2UgaW50byB2ZWN0b3IgcGF0aHNcbiAgICB9XG5cbiAgICBjb25zdCBuYW1lSGludHNJY29uID0gL1xcYmljb25cXGIvaS50ZXN0KG5vZGUubmFtZSk7XG4gICAgaWYgKChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgICAoc21hbGxpc2ggfHwgbmFtZUhpbnRzSWNvbikgJiZcbiAgICAgICAgaXNWZWN0b3JPbmx5KG5vZGUpICYmXG4gICAgICAgICdjaGlsZHJlbicgaW4gbm9kZSAmJiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgIGljb25zLnB1c2gobm9kZSk7XG4gICAgICByZXR1cm47IC8vIGRvbid0IHJlY3Vyc2UgaW50byBpY29uIGludGVybmFsc1xuICAgIH1cblxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2Fsayhyb290KTtcbiAgcmV0dXJuIGljb25zO1xufVxuXG4vKipcbiAqIEZpbmQgYWxsIG5vZGVzIHdpdGggSU1BR0UgZmlsbHMgaW4gYSBzdWJ0cmVlLlxuICovXG5mdW5jdGlvbiBmaW5kSW1hZ2VOb2Rlcyhyb290OiBTY2VuZU5vZGUpOiBTY2VuZU5vZGVbXSB7XG4gIGNvbnN0IG5vZGVzOiBTY2VuZU5vZGVbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkpIHtcbiAgICAgIG5vZGVzLnB1c2gobm9kZSk7XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKHJvb3QpO1xuICByZXR1cm4gbm9kZXM7XG59XG5cbi8qKlxuICogRXhwb3J0IGEgc2luZ2xlIG5vZGUgYXMgUE5HL1NWRyBieXRlcy5cbiAqXG4gKiBGb3Igc2VjdGlvbiBzY3JlZW5zaG90cywgdGhpcyB1c2VzIGV4cG9ydEFzeW5jIHdoaWNoIHJlbmRlcnMgdGhlIGNvbXBvc2l0ZVxuICogKGltYWdlICsgdGV4dCArIG92ZXJsYXlzKSBcdTIwMTQgY29ycmVjdCBmb3Igc2NyZWVuc2hvdHMuXG4gKlxuICogRm9yIGltYWdlIGFzc2V0cywgdGhpcyBwdWxscyB0aGUgUkFXIGltYWdlIGJ5dGVzIGZyb20gdGhlIG5vZGUncyBJTUFHRSBmaWxsXG4gKiB2aWEgZmlnbWEuZ2V0SW1hZ2VCeUhhc2goKS4gVGhpcyByZXR1cm5zIHRoZSBwdXJlIHNvdXJjZSBpbWFnZSB3aXRoIE5PXG4gKiB0ZXh0L3NoYXBlIG92ZXJsYXlzIGJha2VkIGluIFx1MjAxNCBmaXhpbmcgdGhlIGNvbW1vbiBcImhlcm8gaW1hZ2UgaW5jbHVkZXMgdGhlXG4gKiBoZWFkbGluZSB0ZXh0XCIgcHJvYmxlbS4gTWFza3MgYW5kIGNyb3BzIGFyZSBkaXNjYXJkZWQgaW50ZW50aW9uYWxseTsgdGhlXG4gKiB0aGVtZSByZS1hcHBsaWVzIHRoZW0gdmlhIENTUyAob2JqZWN0LWZpdCwgYmFja2dyb3VuZC1zaXplLCBib3JkZXItcmFkaXVzKS5cbiAqXG4gKiBBc3NldCBmYWxsYmFjazogaWYgdGhlIG5vZGUgaGFzIG5vIGltYWdlIGZpbGwgKGUuZy4gYW4gU1ZHIGlsbHVzdHJhdGlvbiksXG4gKiBmYWxsIGJhY2sgdG8gZXhwb3J0QXN5bmMgc28gbG9nb3MvaWNvbnMgc3RpbGwgZXhwb3J0IGNvcnJlY3RseS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZXhwb3J0Tm9kZShcbiAgbm9kZUlkOiBzdHJpbmcsXG4gIGZvcm1hdDogJ1BORycgfCAnU1ZHJyB8ICdKUEcnLFxuICBzY2FsZTogbnVtYmVyLFxuICB0YXNrVHlwZTogJ3NjcmVlbnNob3QnIHwgJ2Z1bGwtcGFnZScgfCAnYXNzZXQnLFxuKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIGNvbnN0IG5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChub2RlSWQpO1xuICBpZiAoIW5vZGUgfHwgISgnZXhwb3J0QXN5bmMnIGluIG5vZGUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBOb2RlICR7bm9kZUlkfSBub3QgZm91bmQgb3Igbm90IGV4cG9ydGFibGVgKTtcbiAgfVxuXG4gIC8vIFNWRyByZXF1ZXN0ZWQgXHUyMDE0IHVzZSBleHBvcnRBc3luYyBkaXJlY3RseSAoZm9yIGljb25zLCB2ZWN0b3IgaWxsdXN0cmF0aW9ucylcbiAgaWYgKGZvcm1hdCA9PT0gJ1NWRycpIHtcbiAgICByZXR1cm4gYXdhaXQgKG5vZGUgYXMgU2NlbmVOb2RlKS5leHBvcnRBc3luYyh7IGZvcm1hdDogJ1NWRycgfSk7XG4gIH1cblxuICAvLyBGb3IgUE5HIGFzc2V0IHRhc2tzOiB0cnkgdG8gcHVsbCByYXcgaW1hZ2UgYnl0ZXMgZnJvbSBhbiBJTUFHRSBmaWxsIGZpcnN0XG4gIC8vIHNvIHdlIGdldCB0aGUgcHVyZSBzb3VyY2UgaW1hZ2Ugd2l0aG91dCBhbnkgYmFrZWQtaW4gdGV4dC9vdmVybGF5cy5cbiAgaWYgKHRhc2tUeXBlID09PSAnYXNzZXQnICYmIGZvcm1hdCA9PT0gJ1BORycpIHtcbiAgICBjb25zdCByYXcgPSBhd2FpdCB0cnlFeHRyYWN0UmF3SW1hZ2VCeXRlcyhub2RlIGFzIFNjZW5lTm9kZSk7XG4gICAgaWYgKHJhdykgcmV0dXJuIHJhdztcbiAgICAvLyBlbHNlIGZhbGwgdGhyb3VnaCB0byBleHBvcnRBc3luYyAoU1ZHIGlsbHVzdHJhdGlvbiwgdmVjdG9yIGdyYXBoaWMsIGV0Yy4pXG4gIH1cblxuICAvLyBGdWxsLXBhZ2UgYW5kIHNlY3Rpb24gc2NyZWVuc2hvdHMgdXNlIGV4cG9ydEFzeW5jIChyZW5kZXJlZCBjb21wb3NpdGUpLlxuICAvLyBTY2FsZSB1cCB0byAyeCBmb3IgZnVsbC1wYWdlIHRvIHByZXNlcnZlIGRldGFpbCB3aGVuIGNvbXBhcmluZyB3aXRoIGJyb3dzZXIuXG4gIGNvbnN0IGV4cG9ydFNjYWxlID0gdGFza1R5cGUgPT09ICdmdWxsLXBhZ2UnID8gMiA6IHNjYWxlO1xuICByZXR1cm4gYXdhaXQgKG5vZGUgYXMgU2NlbmVOb2RlKS5leHBvcnRBc3luYyh7XG4gICAgZm9ybWF0OiAnUE5HJyxcbiAgICBjb25zdHJhaW50OiB7IHR5cGU6ICdTQ0FMRScsIHZhbHVlOiBleHBvcnRTY2FsZSB9LFxuICB9KTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHJhdyBpbWFnZSBieXRlcyBmcm9tIHRoZSBmaXJzdCB2aXNpYmxlIElNQUdFIGZpbGwgb24gYSBub2RlLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSBub2RlIGhhcyBubyBJTUFHRSBmaWxsIG9yIHRoZSBoYXNoIGNhbid0IGJlIHJlc29sdmVkLlxuICovXG5hc3luYyBmdW5jdGlvbiB0cnlFeHRyYWN0UmF3SW1hZ2VCeXRlcyhub2RlOiBTY2VuZU5vZGUpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gIGNvbnN0IGZpbGxzID0gKG5vZGUgYXMgYW55KS5maWxscztcbiAgaWYgKCFmaWxscyB8fCAhQXJyYXkuaXNBcnJheShmaWxscykpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGltYWdlRmlsbCA9IGZpbGxzLmZpbmQoXG4gICAgKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSAmJiAoZiBhcyBJbWFnZVBhaW50KS5pbWFnZUhhc2gsXG4gICkgYXMgSW1hZ2VQYWludCB8IHVuZGVmaW5lZDtcblxuICBpZiAoIWltYWdlRmlsbCB8fCAhaW1hZ2VGaWxsLmltYWdlSGFzaCkgcmV0dXJuIG51bGw7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBpbWFnZSA9IGZpZ21hLmdldEltYWdlQnlIYXNoKGltYWdlRmlsbC5pbWFnZUhhc2gpO1xuICAgIGlmICghaW1hZ2UpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBhd2FpdCBpbWFnZS5nZXRCeXRlc0FzeW5jKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybihgRmFpbGVkIHRvIGV4dHJhY3QgcmF3IGltYWdlIGJ5dGVzIGZyb20gJHtub2RlLm5hbWV9OmAsIGVycik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlIGV4cG9ydCB0YXNrcyBpbiBiYXRjaGVzIG9mIDEwLlxuICogU2VuZHMgZWFjaCByZXN1bHQgdG8gVUkgaW1tZWRpYXRlbHkgdG8gZnJlZSBzYW5kYm94IG1lbW9yeS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVCYXRjaEV4cG9ydChcbiAgdGFza3M6IEltYWdlRXhwb3J0VGFza1tdLFxuICBvblByb2dyZXNzOiAoY3VycmVudDogbnVtYmVyLCB0b3RhbDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKSA9PiB2b2lkLFxuICBvbkRhdGE6ICh0YXNrOiBJbWFnZUV4cG9ydFRhc2ssIGRhdGE6IFVpbnQ4QXJyYXkpID0+IHZvaWQsXG4gIHNob3VsZENhbmNlbDogKCkgPT4gYm9vbGVhbixcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB0b3RhbCA9IHRhc2tzLmxlbmd0aDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsOyBpICs9IEJBVENIX1NJWkUpIHtcbiAgICBpZiAoc2hvdWxkQ2FuY2VsKCkpIHJldHVybjtcblxuICAgIGNvbnN0IGJhdGNoID0gdGFza3Muc2xpY2UoaSwgaSArIEJBVENIX1NJWkUpO1xuICAgIGNvbnN0IGJhdGNoUHJvbWlzZXMgPSBiYXRjaC5tYXAoYXN5bmMgKHRhc2spID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBleHBvcnROb2RlKHRhc2subm9kZUlkLCB0YXNrLmZvcm1hdCwgdGFzay5zY2FsZSwgdGFzay50eXBlKTtcbiAgICAgICAgb25EYXRhKHRhc2ssIGRhdGEpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBleHBvcnQgJHt0YXNrLmZpbGVuYW1lfTpgLCBlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoYmF0Y2hQcm9taXNlcyk7XG4gICAgY29uc3QgZG9uZSA9IE1hdGgubWluKGkgKyBCQVRDSF9TSVpFLCB0b3RhbCk7XG4gICAgb25Qcm9ncmVzcyhkb25lLCB0b3RhbCwgYEV4cG9ydGluZyAoJHtkb25lfS8ke3RvdGFsfSkuLi5gKTtcbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkIHRoZSBpbWFnZS1tYXAuanNvbiBmcm9tIGV4cG9ydCB0YXNrcyBhbmQgc2VjdGlvbiBkYXRhLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRJbWFnZU1hcChcbiAgdGFza3M6IEltYWdlRXhwb3J0VGFza1tdLFxuICBzZWN0aW9uczogeyBuYW1lOiBzdHJpbmc7IGNoaWxkcmVuOiBTY2VuZU5vZGVbXSB9W11cbik6IEltYWdlTWFwIHtcbiAgY29uc3QgaW1hZ2VzOiBSZWNvcmQ8c3RyaW5nLCBJbWFnZU1hcEVudHJ5PiA9IHt9O1xuICBjb25zdCBieVNlY3Rpb25NYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHt9O1xuXG4gIGNvbnN0IGFzc2V0VGFza3MgPSB0YXNrcy5maWx0ZXIodCA9PiB0LnR5cGUgPT09ICdhc3NldCcpO1xuXG4gIGZvciAoY29uc3QgdGFzayBvZiBhc3NldFRhc2tzKSB7XG4gICAgaW1hZ2VzW3Rhc2suZmlsZW5hbWVdID0ge1xuICAgICAgZmlsZTogdGFzay5maWxlbmFtZSxcbiAgICAgIGV4dDogdGFzay5mb3JtYXQudG9Mb3dlckNhc2UoKSxcbiAgICAgIG5vZGVOYW1lczogW3Rhc2subm9kZU5hbWVdLFxuICAgICAgcmVhZGFibGVOYW1lOiB0YXNrLmZpbGVuYW1lLFxuICAgICAgZGltZW5zaW9uczogbnVsbCxcbiAgICAgIHVzZWRJblNlY3Rpb25zOiBbXSxcbiAgICB9O1xuICB9XG5cbiAgZm9yIChjb25zdCBzZWN0aW9uIG9mIHNlY3Rpb25zKSB7XG4gICAgY29uc3Qgc2VjdGlvbkltYWdlczogc3RyaW5nW10gPSBbXTtcbiAgICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgICAgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkpIHtcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBgJHtzbHVnaWZ5KG5vZGUubmFtZSl9LnBuZ2A7XG4gICAgICAgIHNlY3Rpb25JbWFnZXMucHVzaChmaWxlbmFtZSk7XG4gICAgICAgIGlmIChpbWFnZXNbZmlsZW5hbWVdKSB7XG4gICAgICAgICAgaW1hZ2VzW2ZpbGVuYW1lXS51c2VkSW5TZWN0aW9ucy5wdXNoKHNlY3Rpb24ubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBzZWN0aW9uLmNoaWxkcmVuKSB7XG4gICAgICB3YWxrKGNoaWxkKTtcbiAgICB9XG4gICAgYnlTZWN0aW9uTWFwW3NlY3Rpb24ubmFtZV0gPSBzZWN0aW9uSW1hZ2VzO1xuICB9XG5cbiAgcmV0dXJuIHsgaW1hZ2VzLCBieV9zZWN0aW9uOiBieVNlY3Rpb25NYXAgfTtcbn1cbiIsICJpbXBvcnQge1xuICBTZWN0aW9uU3BlY3MsIERlc2lnblRva2VucywgRXhwb3J0TWFuaWZlc3QsIEV4cG9ydE1hbmlmZXN0UGFnZSxcbiAgUmVzcG9uc2l2ZVBhaXIsIFJlc3BvbnNpdmVNYXAsIFBhZ2VUb2tlbnMsIEltYWdlTWFwLCBGb250VG9rZW5JbmZvLFxuICBSZXNwb25zaXZlT3ZlcnJpZGUsIFNlY3Rpb25TcGVjLFxufSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHNsdWdpZnksIHRvTGF5b3V0TmFtZSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgY29sbGVjdENvbG9ycyB9IGZyb20gJy4vY29sb3InO1xuaW1wb3J0IHsgY29sbGVjdEZvbnRzLCBjb3VudFRleHROb2RlcyB9IGZyb20gJy4vdHlwb2dyYXBoeSc7XG5pbXBvcnQgeyBjb2xsZWN0U3BhY2luZyB9IGZyb20gJy4vc3BhY2luZyc7XG5pbXBvcnQgeyBwYXJzZVNlY3Rpb25zIH0gZnJvbSAnLi9zZWN0aW9uLXBhcnNlcic7XG5pbXBvcnQgeyBtYXRjaFJlc3BvbnNpdmVGcmFtZXMgfSBmcm9tICcuL3Jlc3BvbnNpdmUnO1xuaW1wb3J0IHsgYnVpbGRFeHBvcnRUYXNrcywgZXhlY3V0ZUJhdGNoRXhwb3J0LCBidWlsZEltYWdlTWFwIH0gZnJvbSAnLi9pbWFnZS1leHBvcnRlcic7XG5pbXBvcnQgeyBleHRyYWN0VmFyaWFibGVzIH0gZnJvbSAnLi92YXJpYWJsZXMnO1xuaW1wb3J0IHsgbm9ybWFsaXplU2VjdGlvbk5hbWUgfSBmcm9tICcuL3BhdHRlcm5zJztcblxuLyoqXG4gKiBNYXN0ZXIgZXh0cmFjdGlvbiBvcmNoZXN0cmF0b3IuXG4gKiBDb29yZGluYXRlcyBhbGwgbW9kdWxlcyBmb3IgdGhlIHNlbGVjdGVkIGZyYW1lcyBhbmQgc2VuZHMgcmVzdWx0cyB0byBVSS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkV4dHJhY3Rpb24oXG4gIGZyYW1lSWRzOiBzdHJpbmdbXSxcbiAgcmVzcG9uc2l2ZVBhaXJzOiBSZXNwb25zaXZlUGFpcltdLFxuICBzZW5kTWVzc2FnZTogKG1zZzogYW55KSA9PiB2b2lkLFxuICBzaG91bGRDYW5jZWw6ICgpID0+IGJvb2xlYW4sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYWxsRGVzaWduVG9rZW5Db2xvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgY29uc3QgYWxsRGVzaWduVG9rZW5Gb250czogUmVjb3JkPHN0cmluZywgRm9udFRva2VuSW5mbz4gPSB7fTtcbiAgY29uc3QgYWxsU3BhY2luZ1ZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBjb25zdCBtYW5pZmVzdFBhZ2VzOiBFeHBvcnRNYW5pZmVzdFBhZ2VbXSA9IFtdO1xuICBsZXQgdG90YWxTZWN0aW9ucyA9IDA7XG4gIGxldCB0b3RhbEltYWdlcyA9IDA7XG5cbiAgLy8gUHJlLWNvbXB1dGUgdGhlIHNldCBvZiBzZWN0aW9uIG5hbWVzIHRoYXQgYXBwZWFyIG9uIFx1MjI2NTIgc2VsZWN0ZWQgcGFnZXMuXG4gIC8vIFRoZXNlIGFyZSBjYW5kaWRhdGVzIGZvciBnbG9iYWwgV1AgdGhlbWUgcGFydHMgKGhlYWRlci5waHAgLyBmb290ZXIucGhwXG4gIC8vIC8gdGVtcGxhdGUtcGFydHMpLiBwYXJzZVNlY3Rpb25zIHdpbGwgbWFyayBtYXRjaGluZyBzZWN0aW9ucyBpc0dsb2JhbC5cbiAgY29uc3QgZ2xvYmFsTmFtZXMgPSBjb21wdXRlR2xvYmFsU2VjdGlvbk5hbWVzKHJlc3BvbnNpdmVQYWlycyk7XG5cbiAgLy8gUHJvY2VzcyBlYWNoIHJlc3BvbnNpdmUgcGFpciAoZWFjaCA9IG9uZSBwYWdlKVxuICBmb3IgKGNvbnN0IHBhaXIgb2YgcmVzcG9uc2l2ZVBhaXJzKSB7XG4gICAgaWYgKHNob3VsZENhbmNlbCgpKSByZXR1cm47XG5cbiAgICBjb25zdCBkZXNrdG9wTm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKHBhaXIuZGVza3RvcC5mcmFtZUlkKTtcbiAgICBpZiAoIWRlc2t0b3BOb2RlIHx8IGRlc2t0b3BOb2RlLnR5cGUgIT09ICdGUkFNRScpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGRlc2t0b3BGcmFtZSA9IGRlc2t0b3BOb2RlIGFzIEZyYW1lTm9kZTtcblxuICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6ICdFWFBPUlRfUFJPR1JFU1MnLFxuICAgICAgY3VycmVudDogMCxcbiAgICAgIHRvdGFsOiAxMDAsXG4gICAgICBsYWJlbDogYEV4dHJhY3RpbmcgXCIke3BhaXIucGFnZU5hbWV9XCIuLi5gLFxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFBhcnNlIHNlY3Rpb25zIGZyb20gZGVza3RvcCBmcmFtZSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBzZWN0aW9ucyA9IHBhcnNlU2VjdGlvbnMoZGVza3RvcEZyYW1lLCBnbG9iYWxOYW1lcyk7XG4gICAgY29uc3Qgc2VjdGlvbkNvdW50ID0gT2JqZWN0LmtleXMoc2VjdGlvbnMpLmxlbmd0aDtcbiAgICB0b3RhbFNlY3Rpb25zICs9IHNlY3Rpb25Db3VudDtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBNZXJnZSByZXNwb25zaXZlIG92ZXJyaWRlcyBmcm9tIG1vYmlsZSBmcmFtZSBcdTI1MDBcdTI1MDBcbiAgICBpZiAocGFpci5tb2JpbGUpIHtcbiAgICAgIGNvbnN0IG1vYmlsZU5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChwYWlyLm1vYmlsZS5mcmFtZUlkKTtcbiAgICAgIGlmIChtb2JpbGVOb2RlICYmIG1vYmlsZU5vZGUudHlwZSA9PT0gJ0ZSQU1FJykge1xuICAgICAgICBjb25zdCBtb2JpbGVGcmFtZSA9IG1vYmlsZU5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgICBjb25zdCBtb2JpbGVTZWN0aW9ucyA9IHBhcnNlU2VjdGlvbnMobW9iaWxlRnJhbWUsIGdsb2JhbE5hbWVzKTtcbiAgICAgICAgbWVyZ2VSZXNwb25zaXZlRGF0YShzZWN0aW9ucywgbW9iaWxlU2VjdGlvbnMsIHBhaXIubW9iaWxlLndpZHRoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQnVpbGQgc2VjdGlvbi1zcGVjcy5qc29uIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHNlY3Rpb25TcGVjczogU2VjdGlvblNwZWNzID0ge1xuICAgICAgZmlnbWFfY2FudmFzX3dpZHRoOiBNYXRoLnJvdW5kKGRlc2t0b3BGcmFtZS53aWR0aCksXG4gICAgICBmaWdtYV9jYW52YXNfaGVpZ2h0OiBNYXRoLnJvdW5kKGRlc2t0b3BGcmFtZS5oZWlnaHQpLFxuICAgICAgbW9iaWxlX2NhbnZhc193aWR0aDogcGFpci5tb2JpbGU/LndpZHRoLFxuICAgICAgcGFnZV9zbHVnOiBwYWlyLnBhZ2VTbHVnLFxuICAgICAgZXh0cmFjdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBleHRyYWN0aW9uX21ldGhvZDogJ3BsdWdpbicsXG4gICAgICBzZWN0aW9ucyxcbiAgICB9O1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIENvbGxlY3QgdG9rZW5zIGZvciB0aGlzIHBhZ2UgXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgY29sb3JzID0gY29sbGVjdENvbG9ycyhkZXNrdG9wRnJhbWUpO1xuICAgIGNvbnN0IGZvbnRzID0gY29sbGVjdEZvbnRzKGRlc2t0b3BGcmFtZSk7XG4gICAgY29uc3Qgc3BhY2luZyA9IGNvbGxlY3RTcGFjaW5nKGRlc2t0b3BGcmFtZSk7XG5cbiAgICAvLyBCdWlsZCBwYWdlIHRva2Vuc1xuICAgIGNvbnN0IHBhZ2VUb2tlbnM6IFBhZ2VUb2tlbnMgPSB7XG4gICAgICBjb2xvcnMsXG4gICAgICBmb250czogT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgICBPYmplY3QuZW50cmllcyhmb250cykubWFwKChbZmFtaWx5LCBkYXRhXSkgPT4gW2ZhbWlseSwge1xuICAgICAgICAgIHN0eWxlczogWy4uLmRhdGEuc3R5bGVzXSxcbiAgICAgICAgICBzaXplczogWy4uLmRhdGEuc2l6ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKSxcbiAgICAgICAgICBjb3VudDogZGF0YS5jb3VudCxcbiAgICAgICAgfV0pXG4gICAgICApLFxuICAgICAgc3BhY2luZyxcbiAgICAgIHNlY3Rpb25zOiBidWlsZFRva2VuU2VjdGlvbnMoZGVza3RvcEZyYW1lLCBwYWlyLnBhZ2VTbHVnKSxcbiAgICB9O1xuXG4gICAgLy8gTWVyZ2UgaW50byBnbG9iYWwgdG9rZW5zXG4gICAgZm9yIChjb25zdCBbaGV4LCBjb3VudF0gb2YgT2JqZWN0LmVudHJpZXMoY29sb3JzKSkge1xuICAgICAgaWYgKGNvdW50ID49IDIpIHtcbiAgICAgICAgY29uc3QgdmFyTmFtZSA9IGAtLWNsci0ke2hleC5zbGljZSgxKS50b0xvd2VyQ2FzZSgpfWA7XG4gICAgICAgIGFsbERlc2lnblRva2VuQ29sb3JzW3Zhck5hbWVdID0gaGV4O1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IFtmYW1pbHksIGRhdGFdIG9mIE9iamVjdC5lbnRyaWVzKGZvbnRzKSkge1xuICAgICAgYWxsRGVzaWduVG9rZW5Gb250c1tmYW1pbHldID0ge1xuICAgICAgICBzdHlsZXM6IFsuLi5kYXRhLnN0eWxlc10sXG4gICAgICAgIHNpemVzOiBbLi4uZGF0YS5zaXplc10uc29ydCgoYSwgYikgPT4gYSAtIGIpLFxuICAgICAgICBjb3VudDogZGF0YS5jb3VudCxcbiAgICAgIH07XG4gICAgfVxuICAgIGZvciAoY29uc3QgcyBvZiBzcGFjaW5nKSB7XG4gICAgICBhbGxTcGFjaW5nVmFsdWVzLmFkZChzLnZhbHVlKTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgR2VuZXJhdGUgc3BlYy5tZCBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBzcGVjTWQgPSBnZW5lcmF0ZVNwZWNNZChwYWlyLnBhZ2VOYW1lLCBwYWlyLnBhZ2VTbHVnLCBzZWN0aW9uU3BlY3MsIHBhZ2VUb2tlbnMpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFNlbmQgcGFnZSBkYXRhIHRvIFVJIFx1MjUwMFx1MjUwMFxuICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6ICdQQUdFX0RBVEEnLFxuICAgICAgcGFnZVNsdWc6IHBhaXIucGFnZVNsdWcsXG4gICAgICBzZWN0aW9uU3BlY3MsXG4gICAgICBzcGVjTWQsXG4gICAgICB0b2tlbnM6IHBhZ2VUb2tlbnMsXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRXhwb3J0IGltYWdlcyBhbmQgc2NyZWVuc2hvdHMgXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZXhwb3J0VGFza3MgPSBidWlsZEV4cG9ydFRhc2tzKGRlc2t0b3BGcmFtZSwgcGFpci5wYWdlU2x1Zyk7XG4gICAgY29uc3QgYXNzZXRDb3VudCA9IGV4cG9ydFRhc2tzLmZpbHRlcih0ID0+IHQudHlwZSA9PT0gJ2Fzc2V0JykubGVuZ3RoO1xuICAgIHRvdGFsSW1hZ2VzICs9IGFzc2V0Q291bnQ7XG5cbiAgICBhd2FpdCBleGVjdXRlQmF0Y2hFeHBvcnQoXG4gICAgICBleHBvcnRUYXNrcyxcbiAgICAgIChjdXJyZW50LCB0b3RhbCwgbGFiZWwpID0+IHtcbiAgICAgICAgc2VuZE1lc3NhZ2UoeyB0eXBlOiAnRVhQT1JUX1BST0dSRVNTJywgY3VycmVudCwgdG90YWwsIGxhYmVsIH0pO1xuICAgICAgfSxcbiAgICAgICh0YXNrLCBkYXRhKSA9PiB7XG4gICAgICAgIGlmICh0YXNrLnR5cGUgPT09ICdzY3JlZW5zaG90JyB8fCB0YXNrLnR5cGUgPT09ICdmdWxsLXBhZ2UnKSB7XG4gICAgICAgICAgc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogJ1NDUkVFTlNIT1RfREFUQScsXG4gICAgICAgICAgICBwYXRoOiBgJHt0YXNrLnBhZ2VQYXRofS9zY3JlZW5zaG90c2AsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGFzay5maWxlbmFtZSxcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogJ0lNQUdFX0RBVEEnLFxuICAgICAgICAgICAgcGF0aDogYCR7dGFzay5wYWdlUGF0aH0vaW1hZ2VzYCxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB0YXNrLmZpbGVuYW1lLFxuICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHNob3VsZENhbmNlbCxcbiAgICApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIGFuZCBzZW5kIGltYWdlIG1hcCBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBzZWN0aW9uQ2hpbGRyZW4gPSBkZXNrdG9wRnJhbWUuY2hpbGRyZW5cbiAgICAgIC5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlKVxuICAgICAgLm1hcChjID0+ICh7IG5hbWU6IGMubmFtZSwgY2hpbGRyZW46ICdjaGlsZHJlbicgaW4gYyA/IFsuLi4oYyBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuXSA6IFtdIH0pKTtcbiAgICBjb25zdCBpbWFnZU1hcCA9IGJ1aWxkSW1hZ2VNYXAoZXhwb3J0VGFza3MsIHNlY3Rpb25DaGlsZHJlbik7XG4gICAgc2VuZE1lc3NhZ2Uoe1xuICAgICAgdHlwZTogJ0lNQUdFX01BUF9EQVRBJyxcbiAgICAgIHBhdGg6IGBwYWdlcy8ke3BhaXIucGFnZVNsdWd9L2ltYWdlc2AsXG4gICAgICBpbWFnZU1hcCxcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCdWlsZCBtYW5pZmVzdCBwYWdlIGVudHJ5IFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhhc0Z1bGxQYWdlID0gZXhwb3J0VGFza3Muc29tZSh0ID0+IHQudHlwZSA9PT0gJ2Z1bGwtcGFnZScpO1xuICAgIG1hbmlmZXN0UGFnZXMucHVzaCh7XG4gICAgICBzbHVnOiBwYWlyLnBhZ2VTbHVnLFxuICAgICAgZnJhbWVOYW1lOiBwYWlyLmRlc2t0b3AuZnJhbWVOYW1lLFxuICAgICAgZnJhbWVJZDogcGFpci5kZXNrdG9wLmZyYW1lSWQsXG4gICAgICBjYW52YXNXaWR0aDogTWF0aC5yb3VuZChkZXNrdG9wRnJhbWUud2lkdGgpLFxuICAgICAgY2FudmFzSGVpZ2h0OiBNYXRoLnJvdW5kKGRlc2t0b3BGcmFtZS5oZWlnaHQpLFxuICAgICAgc2VjdGlvbkNvdW50LFxuICAgICAgaW1hZ2VDb3VudDogYXNzZXRDb3VudCxcbiAgICAgIGhhc1Jlc3BvbnNpdmU6IHBhaXIubW9iaWxlICE9PSBudWxsLFxuICAgICAgbW9iaWxlRnJhbWVJZDogcGFpci5tb2JpbGU/LmZyYW1lSWQgPz8gbnVsbCxcbiAgICAgIGludGVyYWN0aW9uQ291bnQ6IE9iamVjdC52YWx1ZXMoc2VjdGlvbnMpXG4gICAgICAgIC5yZWR1Y2UoKHN1bSwgcykgPT4gc3VtICsgKHMuaW50ZXJhY3Rpb25zPy5sZW5ndGggPz8gMCksIDApLFxuICAgICAgaGFzRnVsbFBhZ2VTY3JlZW5zaG90OiBoYXNGdWxsUGFnZSxcbiAgICAgIGZ1bGxQYWdlU2NyZWVuc2hvdEZpbGU6IGhhc0Z1bGxQYWdlID8gJ19mdWxsLXBhZ2UucG5nJyA6IG51bGwsXG4gICAgfSk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgQnVpbGQgZmluYWwgbWFuaWZlc3QgYW5kIGdsb2JhbCB0b2tlbnMgXHUyNTAwXHUyNTAwXG4gIGNvbnN0IG1hbmlmZXN0OiBFeHBvcnRNYW5pZmVzdCA9IHtcbiAgICBleHBvcnRWZXJzaW9uOiAnMS4wJyxcbiAgICBleHBvcnREYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgZmlnbWFGaWxlTmFtZTogZmlnbWEucm9vdC5uYW1lLFxuICAgIGZpZ21hRmlsZUtleTogZmlnbWEuZmlsZUtleSA/PyAnJyxcbiAgICBwbHVnaW5WZXJzaW9uOiAnMS4wLjAnLFxuICAgIHBhZ2VzOiBtYW5pZmVzdFBhZ2VzLFxuICAgIHRvdGFsU2VjdGlvbnMsXG4gICAgdG90YWxJbWFnZXMsXG4gICAgZGVzaWduVG9rZW5zU3VtbWFyeToge1xuICAgICAgY29sb3JDb3VudDogT2JqZWN0LmtleXMoYWxsRGVzaWduVG9rZW5Db2xvcnMpLmxlbmd0aCxcbiAgICAgIGZvbnRDb3VudDogT2JqZWN0LmtleXMoYWxsRGVzaWduVG9rZW5Gb250cykubGVuZ3RoLFxuICAgICAgc3BhY2luZ1ZhbHVlczogYWxsU3BhY2luZ1ZhbHVlcy5zaXplLFxuICAgIH0sXG4gIH07XG5cbiAgLy8gRmlnbWEgVmFyaWFibGVzIChhdXRob3JpdGF0aXZlIHRva2VuIG5hbWVzIHdoZW4gYXZhaWxhYmxlKVxuICBjb25zdCB2YXJpYWJsZXMgPSBleHRyYWN0VmFyaWFibGVzKCk7XG5cbiAgY29uc3QgZGVzaWduVG9rZW5zOiBEZXNpZ25Ub2tlbnMgPSB7XG4gICAgY29sb3JzOiBhbGxEZXNpZ25Ub2tlbkNvbG9ycyxcbiAgICBmb250czogYWxsRGVzaWduVG9rZW5Gb250cyxcbiAgICBzcGFjaW5nOiBbLi4uYWxsU3BhY2luZ1ZhbHVlc10uc29ydCgoYSwgYikgPT4gYSAtIGIpLFxuICAgIHZhcmlhYmxlczogdmFyaWFibGVzLnByZXNlbnQgPyB2YXJpYWJsZXMgOiB1bmRlZmluZWQsXG4gIH07XG5cbiAgLy8gV2hlbiBGaWdtYSBWYXJpYWJsZXMgYXJlIGF2YWlsYWJsZSwgcHJlZmVyIHZhcmlhYmxlIG5hbWVzIGZvciBjb2xvcnM6XG4gIC8vIG92ZXJ3cml0ZSB0aGUgYXV0by1nZW5lcmF0ZWQgLS1jbHItPGhleD4gd2l0aCAtLWNsci08dmFyaWFibGUtbmFtZT5cbiAgaWYgKHZhcmlhYmxlcy5wcmVzZW50KSB7XG4gICAgZm9yIChjb25zdCBbY29sTmFtZSwgdmFyc10gb2YgT2JqZWN0LmVudHJpZXModmFyaWFibGVzLmNvbGxlY3Rpb25zKSkge1xuICAgICAgaWYgKCFjb2xOYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2NvbG9yJykpIGNvbnRpbnVlO1xuICAgICAgZm9yIChjb25zdCBbdmFyTmFtZSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHZhcnMpKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnIHx8ICF2YWx1ZS5zdGFydHNXaXRoKCcjJykpIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBzYWZlTmFtZSA9IHZhck5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtejAtOV0rL2csICctJykucmVwbGFjZSgvLSsvZywgJy0nKS5yZXBsYWNlKC9eLXwtJC9nLCAnJyk7XG4gICAgICAgIGNvbnN0IGNzc1ZhciA9IGAtLWNsci0ke3NhZmVOYW1lfWA7XG4gICAgICAgIGFsbERlc2lnblRva2VuQ29sb3JzW2Nzc1Zhcl0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZGVzaWduVG9rZW5zLmNvbG9ycyA9IGFsbERlc2lnblRva2VuQ29sb3JzO1xuICB9XG5cbiAgLy8gQnVpbGQgcmVzcG9uc2l2ZSBtYXAgZnJvbSB0aGUgcGFpcnNcbiAgY29uc3QgcmVzcG9uc2l2ZU1hcCA9IG1hdGNoUmVzcG9uc2l2ZUZyYW1lcyhcbiAgICByZXNwb25zaXZlUGFpcnMuZmxhdE1hcChwID0+IHtcbiAgICAgIGNvbnN0IGZyYW1lcyA9IFt7XG4gICAgICAgIGlkOiBwLmRlc2t0b3AuZnJhbWVJZCxcbiAgICAgICAgbmFtZTogcC5kZXNrdG9wLmZyYW1lTmFtZSxcbiAgICAgICAgd2lkdGg6IHAuZGVza3RvcC53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICBicmVha3BvaW50OiAnZGVza3RvcCcgYXMgY29uc3QsXG4gICAgICAgIHNlY3Rpb25Db3VudDogMCxcbiAgICAgICAgaGFzQXV0b0xheW91dDogZmFsc2UsXG4gICAgICAgIHJlc3BvbnNpdmVQYWlySWQ6IG51bGwsXG4gICAgICB9XTtcbiAgICAgIGlmIChwLm1vYmlsZSkge1xuICAgICAgICBmcmFtZXMucHVzaCh7XG4gICAgICAgICAgaWQ6IHAubW9iaWxlLmZyYW1lSWQsXG4gICAgICAgICAgbmFtZTogcC5tb2JpbGUuZnJhbWVOYW1lLFxuICAgICAgICAgIHdpZHRoOiBwLm1vYmlsZS53aWR0aCxcbiAgICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgICAgYnJlYWtwb2ludDogJ21vYmlsZScgYXMgY29uc3QsXG4gICAgICAgICAgc2VjdGlvbkNvdW50OiAwLFxuICAgICAgICAgIGhhc0F1dG9MYXlvdXQ6IGZhbHNlLFxuICAgICAgICAgIHJlc3BvbnNpdmVQYWlySWQ6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZyYW1lcztcbiAgICB9KVxuICApO1xuXG4gIHNlbmRNZXNzYWdlKHtcbiAgICB0eXBlOiAnRVhQT1JUX0NPTVBMRVRFJyxcbiAgICBtYW5pZmVzdCxcbiAgICByZXNwb25zaXZlTWFwLFxuICAgIGRlc2lnblRva2VucyxcbiAgfSk7XG59XG5cbi8qKlxuICogTWVyZ2UgcmVzcG9uc2l2ZSBvdmVycmlkZXMgZnJvbSBtb2JpbGUgc2VjdGlvbnMgaW50byBkZXNrdG9wIHNlY3Rpb25zLlxuICogT25seSBpbmNsdWRlcyBwcm9wZXJ0aWVzIHRoYXQgZGlmZmVyIGJldHdlZW4gZGVza3RvcCBhbmQgbW9iaWxlLlxuICovXG5mdW5jdGlvbiBtZXJnZVJlc3BvbnNpdmVEYXRhKFxuICBkZXNrdG9wU2VjdGlvbnM6IFJlY29yZDxzdHJpbmcsIFNlY3Rpb25TcGVjPixcbiAgbW9iaWxlU2VjdGlvbnM6IFJlY29yZDxzdHJpbmcsIFNlY3Rpb25TcGVjPixcbiAgbW9iaWxlV2lkdGg6IG51bWJlcixcbik6IHZvaWQge1xuICBjb25zdCBicEtleSA9IFN0cmluZyhtb2JpbGVXaWR0aCk7XG5cbiAgZm9yIChjb25zdCBbbGF5b3V0TmFtZSwgZGVza3RvcFNwZWNdIG9mIE9iamVjdC5lbnRyaWVzKGRlc2t0b3BTZWN0aW9ucykpIHtcbiAgICBjb25zdCBtb2JpbGVTcGVjID0gbW9iaWxlU2VjdGlvbnNbbGF5b3V0TmFtZV07XG4gICAgaWYgKCFtb2JpbGVTcGVjKSBjb250aW51ZTtcblxuICAgIGNvbnN0IG92ZXJyaWRlOiBSZXNwb25zaXZlT3ZlcnJpZGUgPSB7fTtcblxuICAgIC8vIERpZmYgc2VjdGlvbiBzdHlsZXNcbiAgICBjb25zdCBzZWN0aW9uRGlmZjogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgIGZvciAoY29uc3QgW2tleSwgZGVza3RvcFZhbF0gb2YgT2JqZWN0LmVudHJpZXMoZGVza3RvcFNwZWMuc2VjdGlvbikpIHtcbiAgICAgIGNvbnN0IG1vYmlsZVZhbCA9IChtb2JpbGVTcGVjLnNlY3Rpb24gYXMgYW55KVtrZXldO1xuICAgICAgaWYgKG1vYmlsZVZhbCAmJiBtb2JpbGVWYWwgIT09IGRlc2t0b3BWYWwpIHtcbiAgICAgICAgc2VjdGlvbkRpZmZba2V5XSA9IG1vYmlsZVZhbDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKE9iamVjdC5rZXlzKHNlY3Rpb25EaWZmKS5sZW5ndGggPiAwKSB7XG4gICAgICBvdmVycmlkZS5zZWN0aW9uID0gc2VjdGlvbkRpZmY7XG4gICAgfVxuXG4gICAgLy8gRGlmZiBlbGVtZW50IHN0eWxlc1xuICAgIGNvbnN0IGVsZW1lbnRzRGlmZjogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgYW55Pj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtlbGVtTmFtZSwgZGVza3RvcEVsZW1dIG9mIE9iamVjdC5lbnRyaWVzKGRlc2t0b3BTcGVjLmVsZW1lbnRzKSkge1xuICAgICAgY29uc3QgbW9iaWxlRWxlbSA9IG1vYmlsZVNwZWMuZWxlbWVudHNbZWxlbU5hbWVdO1xuICAgICAgaWYgKCFtb2JpbGVFbGVtKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgZGlmZjogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgICAgZm9yIChjb25zdCBba2V5LCBkZXNrdG9wVmFsXSBvZiBPYmplY3QuZW50cmllcyhkZXNrdG9wRWxlbSkpIHtcbiAgICAgICAgY29uc3QgbW9iaWxlVmFsID0gKG1vYmlsZUVsZW0gYXMgYW55KVtrZXldO1xuICAgICAgICBpZiAobW9iaWxlVmFsICE9PSB1bmRlZmluZWQgJiYgbW9iaWxlVmFsICE9PSBkZXNrdG9wVmFsKSB7XG4gICAgICAgICAgZGlmZltrZXldID0gbW9iaWxlVmFsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoT2JqZWN0LmtleXMoZGlmZikubGVuZ3RoID4gMCkge1xuICAgICAgICBlbGVtZW50c0RpZmZbZWxlbU5hbWVdID0gZGlmZjtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKE9iamVjdC5rZXlzKGVsZW1lbnRzRGlmZikubGVuZ3RoID4gMCkge1xuICAgICAgb3ZlcnJpZGUuZWxlbWVudHMgPSBlbGVtZW50c0RpZmY7XG4gICAgfVxuXG4gICAgLy8gRGlmZiBncmlkXG4gICAgaWYgKG1vYmlsZVNwZWMuZ3JpZC5jb2x1bW5zICE9PSBkZXNrdG9wU3BlYy5ncmlkLmNvbHVtbnMgfHwgbW9iaWxlU3BlYy5ncmlkLmdhcCAhPT0gZGVza3RvcFNwZWMuZ3JpZC5nYXApIHtcbiAgICAgIG92ZXJyaWRlLmdyaWQgPSB7fTtcbiAgICAgIGlmIChtb2JpbGVTcGVjLmdyaWQuY29sdW1ucyAhPT0gZGVza3RvcFNwZWMuZ3JpZC5jb2x1bW5zKSB7XG4gICAgICAgIG92ZXJyaWRlLmdyaWQuY29sdW1ucyA9IG1vYmlsZVNwZWMuZ3JpZC5jb2x1bW5zO1xuICAgICAgfVxuICAgICAgaWYgKG1vYmlsZVNwZWMuZ3JpZC5nYXAgIT09IGRlc2t0b3BTcGVjLmdyaWQuZ2FwKSB7XG4gICAgICAgIG92ZXJyaWRlLmdyaWQuZ2FwID0gbW9iaWxlU3BlYy5ncmlkLmdhcDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0LmtleXMob3ZlcnJpZGUpLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmICghZGVza3RvcFNwZWMucmVzcG9uc2l2ZSkgZGVza3RvcFNwZWMucmVzcG9uc2l2ZSA9IHt9O1xuICAgICAgZGVza3RvcFNwZWMucmVzcG9uc2l2ZVticEtleV0gPSBvdmVycmlkZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZCB0b2tlbiBzZWN0aW9uIG1ldGFkYXRhIGZvciB0b2tlbnMuanNvbi5cbiAqL1xuZnVuY3Rpb24gYnVpbGRUb2tlblNlY3Rpb25zKGZyYW1lOiBGcmFtZU5vZGUsIHBhZ2VTbHVnOiBzdHJpbmcpIHtcbiAgY29uc3Qgc2VjdGlvbnMgPSBmcmFtZS5jaGlsZHJlblxuICAgIC5maWx0ZXIoYyA9PlxuICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3hcbiAgICApXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueSk7XG5cbiAgcmV0dXJuIHNlY3Rpb25zLm1hcCgocywgaSkgPT4ge1xuICAgIGNvbnN0IGJvdW5kcyA9IHMuYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gICAgY29uc3QgcGFyZW50Qm91bmRzID0gZnJhbWUuYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gICAgY29uc3QgaW1hZ2VDb3VudCA9IGNvdW50SW1hZ2VzKHMpO1xuICAgIGNvbnN0IHRleHROb2RlcyA9IGNvdW50VGV4dE5vZGVzKHMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGluZGV4OiBpICsgMSxcbiAgICAgIG5hbWU6IHMubmFtZSxcbiAgICAgIGlkOiBzLmlkLFxuICAgICAgZGltZW5zaW9uczogeyB3aWR0aDogTWF0aC5yb3VuZChib3VuZHMud2lkdGgpLCBoZWlnaHQ6IE1hdGgucm91bmQoYm91bmRzLmhlaWdodCkgfSxcbiAgICAgIHlfb2Zmc2V0OiBNYXRoLnJvdW5kKGJvdW5kcy55IC0gcGFyZW50Qm91bmRzLnkpLFxuICAgICAgaGFzQXV0b0xheW91dDogcy50eXBlID09PSAnRlJBTUUnICYmIChzIGFzIEZyYW1lTm9kZSkubGF5b3V0TW9kZSAhPT0gdW5kZWZpbmVkICYmIChzIGFzIEZyYW1lTm9kZSkubGF5b3V0TW9kZSAhPT0gJ05PTkUnLFxuICAgICAgaW1hZ2VfY291bnQ6IGltYWdlQ291bnQsXG4gICAgICBpbWFnZV9maWxlczogY29sbGVjdEltYWdlRmlsZU5hbWVzKHMpLFxuICAgICAgdGV4dF9ub2RlczogdGV4dE5vZGVzLFxuICAgICAgc2NyZWVuc2hvdDogYHNjcmVlbnNob3RzLyR7c2x1Z2lmeShzLm5hbWUpfS5wbmdgLFxuICAgICAgc2NyZWVuc2hvdF9jb21wbGV0ZTogdHJ1ZSxcbiAgICB9O1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY291bnRJbWFnZXMobm9kZTogU2NlbmVOb2RlKTogbnVtYmVyIHtcbiAgbGV0IGNvdW50ID0gMDtcbiAgZnVuY3Rpb24gd2FsayhuOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAoJ2ZpbGxzJyBpbiBuICYmIEFycmF5LmlzQXJyYXkoKG4gYXMgYW55KS5maWxscykpIHtcbiAgICAgIGlmICgobiBhcyBhbnkpLmZpbGxzLnNvbWUoKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSkpIGNvdW50Kys7XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG4pIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG4gYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikgd2FsayhjaGlsZCk7XG4gICAgfVxuICB9XG4gIHdhbGsobm9kZSk7XG4gIHJldHVybiBjb3VudDtcbn1cblxuLyoqXG4gKiBQcmUtY29tcHV0ZSB0aGUgc2V0IG9mIG5vcm1hbGl6ZWQgc2VjdGlvbiBuYW1lcyB0aGF0IGFwcGVhciBvbiBcdTIyNjUyIHNlbGVjdGVkXG4gKiBwYWdlcy4gTWF0Y2hpbmcgc2VjdGlvbnMgd2lsbCBiZSBtYXJrZWQgYGlzR2xvYmFsOiB0cnVlYCBieSBwYXJzZVNlY3Rpb25zXG4gKiBzbyB0aGUgV1AgYWdlbnQgY2FuIGhvaXN0IHRoZW0gaW50byBoZWFkZXIucGhwIC8gZm9vdGVyLnBocCAvIHRlbXBsYXRlLXBhcnRzXG4gKiByYXRoZXIgdGhhbiBpbmxpbmluZyB0aGUgc2FtZSBtYXJrdXAgb24gZXZlcnkgcGFnZS5cbiAqXG4gKiBUaGUgc2NhbiBtaXJyb3JzIGlkZW50aWZ5U2VjdGlvbnMgKGRyaWxscyBvbmUgd3JhcHBlciBkZWVwIHdoZW4gdGhlIHBhZ2VcbiAqIGhhcyBhIHNpbmdsZSBjb250YWluZXIgY2hpbGQpIHNvIHRoZSBtYXRjaGluZyBzdGF5cyBjb25zaXN0ZW50IHdpdGggd2hhdFxuICogcGFyc2VTZWN0aW9ucyBhY3R1YWxseSB0cmVhdHMgYXMgYSBcInNlY3Rpb25cIi5cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUdsb2JhbFNlY3Rpb25OYW1lcyhwYWlyczogUmVzcG9uc2l2ZVBhaXJbXSk6IFNldDxzdHJpbmc+IHtcbiAgY29uc3QgbmFtZVRvUGFnZUNvdW50ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICBmb3IgKGNvbnN0IHBhaXIgb2YgcGFpcnMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgbm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKHBhaXIuZGVza3RvcC5mcmFtZUlkKTtcbiAgICAgIGlmICghbm9kZSB8fCBub2RlLnR5cGUgIT09ICdGUkFNRScpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgZnJhbWUgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgIGxldCBjYW5kaWRhdGVzID0gZnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJylcbiAgICAgICk7XG4gICAgICBpZiAoY2FuZGlkYXRlcy5sZW5ndGggPT09IDEgJiYgJ2NoaWxkcmVuJyBpbiBjYW5kaWRhdGVzWzBdKSB7XG4gICAgICAgIGNvbnN0IGlubmVyID0gKGNhbmRpZGF0ZXNbMF0gYXMgRnJhbWVOb2RlKS5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgICAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJylcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGlubmVyLmxlbmd0aCA+IDEpIGNhbmRpZGF0ZXMgPSBpbm5lcjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNlZW5PblRoaXNQYWdlID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBmb3IgKGNvbnN0IGMgb2YgY2FuZGlkYXRlcykge1xuICAgICAgICBjb25zdCBrZXkgPSBub3JtYWxpemVTZWN0aW9uTmFtZShjLm5hbWUgfHwgJycpO1xuICAgICAgICBpZiAoIWtleSkgY29udGludWU7XG4gICAgICAgIHNlZW5PblRoaXNQYWdlLmFkZChrZXkpO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBuYW1lIG9mIHNlZW5PblRoaXNQYWdlKSB7XG4gICAgICAgIG5hbWVUb1BhZ2VDb3VudC5zZXQobmFtZSwgKG5hbWVUb1BhZ2VDb3VudC5nZXQobmFtZSkgfHwgMCkgKyAxKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ2NvbXB1dGVHbG9iYWxTZWN0aW9uTmFtZXM6IGZhaWxlZCB0byBzY2FuIGZyYW1lJywgcGFpci5wYWdlTmFtZSwgZSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgb3V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgW25hbWUsIGNvdW50XSBvZiBuYW1lVG9QYWdlQ291bnQpIHtcbiAgICBpZiAoY291bnQgPj0gMikgb3V0LmFkZChuYW1lKTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0SW1hZ2VGaWxlTmFtZXMobm9kZTogU2NlbmVOb2RlKTogc3RyaW5nW10ge1xuICBjb25zdCBuYW1lczogc3RyaW5nW10gPSBbXTtcbiAgZnVuY3Rpb24gd2FsayhuOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAoJ2ZpbGxzJyBpbiBuICYmIEFycmF5LmlzQXJyYXkoKG4gYXMgYW55KS5maWxscykpIHtcbiAgICAgIGlmICgobiBhcyBhbnkpLmZpbGxzLnNvbWUoKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSkpIHtcbiAgICAgICAgbmFtZXMucHVzaChgJHtzbHVnaWZ5KG4ubmFtZSl9LnBuZ2ApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoY2hpbGQpO1xuICAgIH1cbiAgfVxuICB3YWxrKG5vZGUpO1xuICByZXR1cm4gbmFtZXM7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgYSBodW1hbi1yZWFkYWJsZSBzcGVjLm1kIGZyb20gZXh0cmFjdGVkIGRhdGEuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlU3BlY01kKHBhZ2VOYW1lOiBzdHJpbmcsIHBhZ2VTbHVnOiBzdHJpbmcsIHNwZWNzOiBTZWN0aW9uU3BlY3MsIHRva2VuczogUGFnZVRva2Vucyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICBsaW5lcy5wdXNoKGAjIERlc2lnbiBTcGVjIFx1MjAxNCAke3BhZ2VOYW1lfWApO1xuICBsaW5lcy5wdXNoKGAjIyBTb3VyY2U6IEZpZ21hIFBsdWdpbiBFeHBvcnRgKTtcbiAgbGluZXMucHVzaChgIyMgR2VuZXJhdGVkOiAke3NwZWNzLmV4dHJhY3RlZF9hdH1gKTtcbiAgbGluZXMucHVzaCgnJyk7XG4gIGxpbmVzLnB1c2goJyMjIFBhZ2UgTWV0YWRhdGEnKTtcbiAgbGluZXMucHVzaChgLSBQYWdlIE5hbWU6ICR7cGFnZU5hbWV9YCk7XG4gIGxpbmVzLnB1c2goYC0gQ2FudmFzIFdpZHRoOiAke3NwZWNzLmZpZ21hX2NhbnZhc193aWR0aH1weGApO1xuICBsaW5lcy5wdXNoKGAtIFNlY3Rpb24gQ291bnQ6ICR7T2JqZWN0LmtleXMoc3BlY3Muc2VjdGlvbnMpLmxlbmd0aH1gKTtcbiAgaWYgKHNwZWNzLm1vYmlsZV9jYW52YXNfd2lkdGgpIHtcbiAgICBsaW5lcy5wdXNoKGAtIE1vYmlsZSBDYW52YXMgV2lkdGg6ICR7c3BlY3MubW9iaWxlX2NhbnZhc193aWR0aH1weGApO1xuICB9XG4gIGxpbmVzLnB1c2goJycpO1xuXG4gIC8vIENvbG9yc1xuICBsaW5lcy5wdXNoKCcjIyBDb2xvcnMgVXNlZCcpO1xuICBsaW5lcy5wdXNoKCd8IEhFWCB8IFVzYWdlIENvdW50IHwnKTtcbiAgbGluZXMucHVzaCgnfC0tLS0tfC0tLS0tLS0tLS0tLXwnKTtcbiAgY29uc3Qgc29ydGVkQ29sb3JzID0gT2JqZWN0LmVudHJpZXModG9rZW5zLmNvbG9ycykuc29ydCgoYSwgYikgPT4gYlsxXSAtIGFbMV0pO1xuICBmb3IgKGNvbnN0IFtoZXgsIGNvdW50XSBvZiBzb3J0ZWRDb2xvcnMuc2xpY2UoMCwgMjApKSB7XG4gICAgbGluZXMucHVzaChgfCAke2hleH0gfCAke2NvdW50fSB8YCk7XG4gIH1cbiAgbGluZXMucHVzaCgnJyk7XG5cbiAgLy8gVHlwb2dyYXBoeVxuICBsaW5lcy5wdXNoKCcjIyBUeXBvZ3JhcGh5IFVzZWQnKTtcbiAgbGluZXMucHVzaCgnfCBGb250IHwgU3R5bGVzIHwgU2l6ZXMgfCcpO1xuICBsaW5lcy5wdXNoKCd8LS0tLS0tfC0tLS0tLS0tfC0tLS0tLS18Jyk7XG4gIGZvciAoY29uc3QgW2ZhbWlseSwgaW5mb10gb2YgT2JqZWN0LmVudHJpZXModG9rZW5zLmZvbnRzKSkge1xuICAgIGxpbmVzLnB1c2goYHwgJHtmYW1pbHl9IHwgJHtpbmZvLnN0eWxlcy5qb2luKCcsICcpfSB8ICR7aW5mby5zaXplcy5qb2luKCcsICcpfXB4IHxgKTtcbiAgfVxuICBsaW5lcy5wdXNoKCcnKTtcblxuICAvLyBTZWN0aW9uc1xuICBsaW5lcy5wdXNoKCcjIyBTZWN0aW9ucycpO1xuICBsaW5lcy5wdXNoKCcnKTtcbiAgZm9yIChjb25zdCBbbGF5b3V0TmFtZSwgc3BlY10gb2YgT2JqZWN0LmVudHJpZXMoc3BlY3Muc2VjdGlvbnMpKSB7XG4gICAgbGluZXMucHVzaChgIyMjICR7bGF5b3V0TmFtZX1gKTtcbiAgICBsaW5lcy5wdXNoKGAtICoqU3BhY2luZyBTb3VyY2UqKjogJHtzcGVjLnNwYWNpbmdTb3VyY2V9YCk7XG4gICAgbGluZXMucHVzaChgLSAqKkJhY2tncm91bmQqKjogJHtzcGVjLnNlY3Rpb24uYmFja2dyb3VuZENvbG9yIHx8ICdub25lJ31gKTtcbiAgICBsaW5lcy5wdXNoKGAtICoqR3JpZCoqOiAke3NwZWMuZ3JpZC5sYXlvdXRNb2RlfSwgJHtzcGVjLmdyaWQuY29sdW1uc30gY29sdW1ucywgZ2FwOiAke3NwZWMuZ3JpZC5nYXAgfHwgJ25vbmUnfWApO1xuICAgIGlmIChzcGVjLmludGVyYWN0aW9ucyAmJiBzcGVjLmludGVyYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICBsaW5lcy5wdXNoKGAtICoqSW50ZXJhY3Rpb25zKio6ICR7c3BlYy5pbnRlcmFjdGlvbnMubGVuZ3RofSAoJHtzcGVjLmludGVyYWN0aW9ucy5tYXAoaSA9PiBpLnRyaWdnZXIpLmpvaW4oJywgJyl9KWApO1xuICAgIH1cbiAgICBpZiAoc3BlYy5vdmVybGFwKSB7XG4gICAgICBsaW5lcy5wdXNoKGAtICoqT3ZlcmxhcCoqOiAke3NwZWMub3ZlcmxhcC5waXhlbHN9cHggd2l0aCBcIiR7c3BlYy5vdmVybGFwLndpdGhTZWN0aW9ufVwiYCk7XG4gICAgfVxuICAgIGxpbmVzLnB1c2goJycpO1xuXG4gICAgLy8gRWxlbWVudHNcbiAgICBmb3IgKGNvbnN0IFtlbGVtTmFtZSwgZWxlbVN0eWxlc10gb2YgT2JqZWN0LmVudHJpZXMoc3BlYy5lbGVtZW50cykpIHtcbiAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmVudHJpZXMoZWxlbVN0eWxlcylcbiAgICAgICAgLmZpbHRlcigoWywgdl0pID0+IHYgIT09IG51bGwgJiYgdiAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAubWFwKChbaywgdl0pID0+IGAke2t9OiAke3Z9YClcbiAgICAgICAgLmpvaW4oJywgJyk7XG4gICAgICBsaW5lcy5wdXNoKGAgIC0gKioke2VsZW1OYW1lfSoqOiAke3Byb3BzfWApO1xuICAgIH1cbiAgICBsaW5lcy5wdXNoKCcnKTtcbiAgfVxuXG4gIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn1cbiIsICJpbXBvcnQgeyBVSVRvU2FuZGJveE1lc3NhZ2UgfSBmcm9tICcuL3NhbmRib3gvdHlwZXMnO1xuaW1wb3J0IHsgZGlzY292ZXJQYWdlcyB9IGZyb20gJy4vc2FuZGJveC9kaXNjb3ZlcnknO1xuaW1wb3J0IHsgcnVuQWxsVmFsaWRhdGlvbnMgfSBmcm9tICcuL3NhbmRib3gvdmFsaWRhdG9yJztcbmltcG9ydCB7IHJ1bkV4dHJhY3Rpb24gfSBmcm9tICcuL3NhbmRib3gvZXh0cmFjdG9yJztcblxuLy8gU2hvdyB0aGUgcGx1Z2luIFVJXG5maWdtYS5zaG93VUkoX19odG1sX18sIHsgd2lkdGg6IDY0MCwgaGVpZ2h0OiA1MjAgfSk7XG5jb25zb2xlLmxvZyhcIldQIFRoZW1lIEJ1aWxkZXIgRXhwb3J0OiBQbHVnaW4gaW5pdGlhbGl6ZWRcIik7XG5cbi8vIENhbmNlbGxhdGlvbiBmbGFnXG5sZXQgY2FuY2VsUmVxdWVzdGVkID0gZmFsc2U7XG5cbi8vIEhhbmRsZSBtZXNzYWdlcyBmcm9tIFVJXG5maWdtYS51aS5vbm1lc3NhZ2UgPSBhc3luYyAobXNnOiBVSVRvU2FuZGJveE1lc3NhZ2UpID0+IHtcbiAgY29uc29sZS5sb2coXCJTYW5kYm94IHJlY2VpdmVkIG1lc3NhZ2U6XCIsIG1zZy50eXBlKTtcblxuICBzd2l0Y2ggKG1zZy50eXBlKSB7XG4gICAgY2FzZSAnRElTQ09WRVJfUEFHRVMnOiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBwYWdlcyA9IGRpc2NvdmVyUGFnZXMoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJQYWdlcyBkaXNjb3ZlcmVkOlwiLCBwYWdlcy5sZW5ndGgpO1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHR5cGU6ICdQQUdFU19ESVNDT1ZFUkVEJywgcGFnZXMgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkRpc2NvdmVyeSBlcnJvcjpcIiwgZXJyKTtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB0eXBlOiAnRVhQT1JUX0VSUk9SJywgZXJyb3I6IFN0cmluZyhlcnIpIH0pO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSAnVkFMSURBVEUnOiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgcnVuQWxsVmFsaWRhdGlvbnMobXNnLmZyYW1lSWRzKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJWYWxpZGF0aW9uIGNvbXBsZXRlOlwiLCByZXN1bHRzLmxlbmd0aCwgXCJyZXN1bHRzXCIpO1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ1ZBTElEQVRJT05fQ09NUExFVEUnLFxuICAgICAgICAgIHJlc3VsdHMsXG4gICAgICAgICAgZnJhbWVJZHM6IG1zZy5mcmFtZUlkcyxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlZhbGlkYXRpb24gZXJyb3I6XCIsIGVycik7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICB0eXBlOiAnRVhQT1JUX0VSUk9SJyxcbiAgICAgICAgICBlcnJvcjogYFZhbGlkYXRpb24gZmFpbGVkOiAke2Vycn1gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgJ1NUQVJUX0VYUE9SVCc6IHtcbiAgICAgIGNhbmNlbFJlcXVlc3RlZCA9IGZhbHNlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcnVuRXh0cmFjdGlvbihcbiAgICAgICAgICBtc2cuZnJhbWVJZHMsXG4gICAgICAgICAgbXNnLnJlc3BvbnNpdmVQYWlycyxcbiAgICAgICAgICAobWVzc2FnZSkgPT4gZmlnbWEudWkucG9zdE1lc3NhZ2UobWVzc2FnZSksXG4gICAgICAgICAgKCkgPT4gY2FuY2VsUmVxdWVzdGVkLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFeHBvcnQgZXJyb3I6XCIsIGVycik7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICB0eXBlOiAnRVhQT1JUX0VSUk9SJyxcbiAgICAgICAgICBlcnJvcjogYEV4cG9ydCBmYWlsZWQ6ICR7ZXJyfWAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSAnQ0FOQ0VMX0VYUE9SVCc6IHtcbiAgICAgIGNhbmNlbFJlcXVlc3RlZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmxvZyhcIkV4cG9ydCBjYW5jZWxsZWQgYnkgdXNlclwiKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS08sV0FBUyxRQUFRLE1BQXNCO0FBQzVDLFdBQU8sS0FDSixZQUFZLEVBQ1osUUFBUSxTQUFTLEdBQUcsRUFDcEIsUUFBUSxpQkFBaUIsRUFBRSxFQUMzQixRQUFRLFFBQVEsR0FBRyxFQUNuQixRQUFRLE9BQU8sR0FBRyxFQUNsQixRQUFRLFVBQVUsRUFBRTtBQUFBLEVBQ3pCO0FBTU8sV0FBUyxhQUFhLE1BQXNCO0FBQ2pELFdBQU8sS0FDSixZQUFZLEVBQ1osUUFBUSxTQUFTLEdBQUcsRUFDcEIsUUFBUSxpQkFBaUIsRUFBRSxFQUMzQixRQUFRLFFBQVEsR0FBRyxFQUNuQixRQUFRLE9BQU8sR0FBRyxFQUNsQixRQUFRLFVBQVUsRUFBRTtBQUFBLEVBQ3pCO0FBT08sV0FBUyxXQUFXLE9BQWtDLE9BQWUsTUFBcUI7QUFDL0YsUUFBSSxVQUFVLFVBQWEsVUFBVSxRQUFRLE1BQU0s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WUFDSCxTQUFTLEtBQUs7QUFDWixzQkFBUSxNQUFNLHFCQUFxQixHQUFHO0FBQ3RDLG9CQUFNLEdBQUcsWUFBWTtBQUFBLGdCQUNuQixNQUFNO0FBQUEsZ0JBQ04sT0FBTyxzQkFBc0IsR0FBRztBQUFBLGNBQ2xDLENBQUM7QUFBQSxZQUNIO0FBQ0E7QUFBQSxVQUNGO0FBQUEsVUFFQSxLQUFLLGdCQUFnQjtBQUNuQiw4QkFBa0I7QUFDbEIsZ0JBQUk7QUFDRixvQkFBTTtBQUFBLGdCQUNKLElBQUk7QUFBQSxnQkFDSixJQUFJO0FBQUEsZ0JBQ0osQ0FBQyxZQUFZLE1BQU0sR0FBRyxZQUFZLE9BQU87QUFBQSxnQkFDekMsTUFBTTtBQUFBLGNBQ1I7QUFBQSxZQUNGLFNBQVMsS0FBSztBQUNaLHNCQUFRLE1BQU0saUJBQWlCLEdBQUc7QUFDbEMsb0JBQU0sR0FBRyxZQUFZO0FBQUEsZ0JBQ25CLE1BQU07QUFBQSxnQkFDTixPQUFPLGtCQUFrQixHQUFHO0FBQUEsY0FDOUIsQ0FBQztBQUFBLFlBQ0g7QUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUVBLEtBQUssaUJBQWlCO0FBQ3BCLDhCQUFrQjtBQUNsQixvQkFBUSxJQUFJLDBCQUEwQjtBQUN0QztBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBO0FBQUE7IiwKICAibmFtZXMiOiBbImNvbHVtbnMiLCAiZXh0cmFjdFN0cm9rZUNvbG9yIiwgIndhbGsiLCAiX2EiLCAiX2IiXQp9Cg==
