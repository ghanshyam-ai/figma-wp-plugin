"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
  function findFirstSolidFillColor(node) {
    const fills = node.fills;
    if (Array.isArray(fills)) {
      for (const f of fills) {
        if (f && f.type === "SOLID" && f.visible !== false && f.color) {
          return rgbToHex(f.color);
        }
      }
    }
    if ("children" in node) {
      for (const child of node.children) {
        if (child.visible === false) continue;
        const c = findFirstSolidFillColor(child);
        if (c) return c;
      }
    }
    return null;
  }
  function buildIconElement(node, filename) {
    const bb = node.absoluteBoundingBox;
    const elem = {
      iconFile: filename,
      width: bb ? toCssValue(Math.round(bb.width)) : null,
      height: bb ? toCssValue(Math.round(bb.height)) : null
    };
    const color = findFirstSolidFillColor(node);
    if (color) elem.color = color;
    const alt = extractAltText(node);
    if (alt) elem.alt = alt;
    Object.assign(elem, extractFlexChildProps(node));
    applyCommonSignals(elem, node);
    const op = extractOpacity(node);
    if (op !== null) elem.opacity = op;
    const tx = extractTransform(node);
    if (tx.transform) elem.transform = tx.transform;
    const href = extractLinkUrl(node);
    if (href) elem.linkUrl = href;
    return elem;
  }
  function extractElements(sectionNode, iconMap) {
    const elements = {};
    let textIndex = 0;
    let imageIndex = 0;
    let iconIndex = 0;
    function walk(node, depth) {
      var _a, _b;
      const iconFilename = iconMap.get(node.id);
      if (iconFilename) {
        const cleanName = node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        const role = cleanName && !/^(vector|icon|frame|group|rectangle|ellipse|boolean)\d*$/.test(cleanName) ? cleanName : `icon${iconIndex > 0 ? "_" + iconIndex : ""}`;
        if (!elements[role]) {
          elements[role] = buildIconElement(node, iconFilename);
        }
        iconIndex++;
        return;
      }
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
  function extractLayers(sectionNode, elements, iconMap) {
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
      if (iconMap.has(node.id)) {
        role = "icon";
        const cleanName = node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        name = cleanName && !/^(vector|icon|frame|group|rectangle|ellipse|boolean)\d*$/.test(cleanName) ? cleanName : `icon_${layerIndex}`;
      } else if (node.type === "TEXT") {
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
      if (role !== "button" && role !== "icon" && "children" in node && depth < 6) {
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
  function parseSections(pageFrame, iconMap, globalNames) {
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
      const elements = extractElements(node, iconMap);
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
      const layers = extractLayers(node, elements, iconMap);
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
      init_color();
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
  function buildExportTasks(pageFrame, pageSlug, iconMap) {
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
    const filenameToFirstNodeId = /* @__PURE__ */ new Map();
    for (const [nodeId, filename] of iconMap) {
      if (!filenameToFirstNodeId.has(filename)) {
        filenameToFirstNodeId.set(filename, nodeId);
      }
    }
    const iconRootIds = new Set(iconMap.keys());
    for (const [filename, nodeId] of filenameToFirstNodeId) {
      const node = figma.getNodeById(nodeId);
      if (!node) continue;
      tasks.push({
        nodeId,
        nodeName: node.name,
        type: "asset",
        filename,
        pagePath,
        format: "SVG",
        scale: 1,
        preferSvg: true
      });
    }
    const imageNodes = findImageNodes(pageFrame);
    const seenHashes = /* @__PURE__ */ new Set();
    for (const imgNode of imageNodes) {
      if (iconRootIds.has(imgNode.id)) continue;
      if (isInsideIconRoot(imgNode, iconRootIds)) continue;
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
  function isInsideIconRoot(node, iconRootIds) {
    let p = node.parent;
    while (p) {
      if ("id" in p && iconRootIds.has(p.id)) return true;
      p = p.parent;
    }
    return false;
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
      const failed = [];
      for (let i = 0; i < total; i += BATCH_SIZE) {
        if (shouldCancel()) return failed;
        const batch = tasks.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map((task) => __async(this, null, function* () {
          try {
            const data = yield exportNode(task.nodeId, task.format, task.scale, task.type);
            onData(task, data);
          } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            if (task.format === "SVG") {
              const pngFilename = task.filename.replace(/\.svg$/i, ".png");
              const pngTask = __spreadProps(__spreadValues({}, task), {
                filename: pngFilename,
                format: "PNG",
                scale: 2
              });
              try {
                const data = yield exportNode(task.nodeId, "PNG", 2, task.type);
                onData(pngTask, data);
                failed.push({
                  filename: task.filename,
                  nodeName: task.nodeName,
                  reason: `SVG export failed (${reason}); fell back to PNG`,
                  fallbackFilename: pngFilename
                });
                return;
              } catch (pngErr) {
                const pngReason = pngErr instanceof Error ? pngErr.message : String(pngErr);
                failed.push({
                  filename: task.filename,
                  nodeName: task.nodeName,
                  reason: `SVG and PNG fallback both failed: ${reason} / ${pngReason}`
                });
                return;
              }
            }
            console.error(`Failed to export ${task.filename}:`, err);
            failed.push({
              filename: task.filename,
              nodeName: task.nodeName,
              reason
            });
          }
        }));
        yield Promise.all(batchPromises);
        const done = Math.min(i + BATCH_SIZE, total);
        onProgress(done, total, `Exporting (${done}/${total})...`);
      }
      return failed;
    });
  }
  function buildImageMap(tasks, sections, iconMap) {
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
        const iconFilename = iconMap.get(node.id);
        if (iconFilename) {
          sectionImages.add(iconFilename);
          if (images[iconFilename] && !images[iconFilename].usedInSections.includes(section.name)) {
            images[iconFilename].usedInSections.push(section.name);
          }
          return;
        }
        if (hasImageFill(node)) {
          const filename = `${slugify(node.name)}.png`;
          sectionImages.add(filename);
          if (images[filename] && !images[filename].usedInSections.includes(section.name)) {
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
      const sectionImages = /* @__PURE__ */ new Set();
      for (const child of section.children) {
        walk2(child);
      }
      bySectionMap[section.name] = [...sectionImages];
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

  // src/sandbox/icon-detector.ts
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
  function isIconNode(node) {
    if (node.visible === false) return false;
    if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION") {
      return true;
    }
    if (node.type !== "FRAME" && node.type !== "COMPONENT" && node.type !== "INSTANCE" && node.type !== "GROUP") {
      return false;
    }
    if (!("children" in node) || node.children.length === 0) {
      return false;
    }
    const bb = node.absoluteBoundingBox;
    const smallish = !!bb && bb.width <= ICON_SIZE_CAP && bb.height <= ICON_SIZE_CAP;
    const nameHintsIcon = ICON_NAME_HINT.test(node.name || "");
    if (!smallish && !nameHintsIcon) return false;
    return isVectorOnly(node);
  }
  function findIconNodes(root) {
    const icons = [];
    function walk(node) {
      if (node.visible === false) return;
      if (isIconNode(node)) {
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
  function getIconBaseName(node) {
    var _a;
    let baseName = node.name || "";
    if (node.type === "INSTANCE") {
      try {
        const main = node.mainComponent;
        if (main) {
          const candidate = ((_a = main.parent) == null ? void 0 : _a.type) === "COMPONENT_SET" ? main.parent.name : main.name;
          if (candidate && !isDefaultLayerName(candidate)) {
            baseName = candidate;
          }
        }
      } catch (e) {
      }
    }
    if (!baseName || isDefaultLayerName(baseName)) {
      let p = node.parent;
      while (p && "name" in p && isDefaultLayerName(p.name)) {
        p = p.parent;
      }
      if (p && "name" in p && p.name && !isDefaultLayerName(p.name)) {
        baseName = `${p.name}-icon`;
      } else {
        baseName = "icon";
      }
    }
    return baseName;
  }
  function dedupeKey(node) {
    if (node.type === "INSTANCE") {
      try {
        const main = node.mainComponent;
        if (main) return `mc:${main.id}`;
      } catch (e) {
      }
    }
    return `n:${node.id}`;
  }
  function buildIconFilenameMap(root) {
    const nodeIdToFilename = /* @__PURE__ */ new Map();
    const dedupKeyToFilename = /* @__PURE__ */ new Map();
    const usedFilenames = /* @__PURE__ */ new Set();
    for (const node of findIconNodes(root)) {
      const key = dedupeKey(node);
      let filename = dedupKeyToFilename.get(key);
      if (!filename) {
        const base = slugify(getIconBaseName(node)) || "icon";
        filename = `${base}.svg`;
        let i = 2;
        while (usedFilenames.has(filename)) {
          filename = `${base}-${i++}.svg`;
        }
        usedFilenames.add(filename);
        dedupKeyToFilename.set(key, filename);
      }
      nodeIdToFilename.set(node.id, filename);
    }
    return nodeIdToFilename;
  }
  var ICON_NAME_HINT, ICON_SIZE_CAP;
  var init_icon_detector = __esm({
    "src/sandbox/icon-detector.ts"() {
      "use strict";
      init_color();
      init_utils();
      ICON_NAME_HINT = /\b(icon|chevron|arrow|caret|check|tick|close|cross|menu|burger|hamburger|search|plus|minus|star|heart|logo|social|symbol|glyph|play|pause|stop|next|prev|share|download|upload|edit|trash|delete|info|warning|error|success)\b/i;
      ICON_SIZE_CAP = 128;
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
      const allFailedExports = [];
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
        const iconMap = buildIconFilenameMap(desktopFrame);
        const sections = parseSections(desktopFrame, iconMap, globalNames);
        const sectionCount = Object.keys(sections).length;
        totalSections += sectionCount;
        if (pair.mobile) {
          const mobileNode = figma.getNodeById(pair.mobile.frameId);
          if (mobileNode && mobileNode.type === "FRAME") {
            const mobileFrame = mobileNode;
            const mobileIconMap = buildIconFilenameMap(mobileFrame);
            const mobileSections = parseSections(mobileFrame, mobileIconMap, globalNames);
            mergeResponsiveData(sections, mobileSections, pair.mobile.width);
          }
        }
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
        const exportTasks = buildExportTasks(desktopFrame, pair.pageSlug, iconMap);
        const assetCount = exportTasks.filter((t) => t.type === "asset").length;
        totalImages += assetCount;
        const pageFailures = yield executeBatchExport(
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
        allFailedExports.push(...pageFailures);
        if (pageFailures.length > 0) {
          const fallbackMap = /* @__PURE__ */ new Map();
          const droppedSet = /* @__PURE__ */ new Set();
          for (const f of pageFailures) {
            if (f.fallbackFilename) fallbackMap.set(f.filename, f.fallbackFilename);
            else droppedSet.add(f.filename);
          }
          patchIconReferences(sections, fallbackMap, droppedSet);
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
        const specMd = generateSpecMd(pair.pageName, pair.pageSlug, sectionSpecs, pageTokens);
        sendMessage({
          type: "PAGE_DATA",
          pageSlug: pair.pageSlug,
          sectionSpecs,
          specMd,
          tokens: pageTokens
        });
        const sectionChildren = desktopFrame.children.filter((c) => c.visible !== false).map((c) => ({ name: c.name, children: "children" in c ? [...c.children] : [] }));
        const imageMap = buildImageMap(exportTasks, sectionChildren, iconMap);
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
        },
        failedExports: allFailedExports.length > 0 ? allFailedExports : void 0
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
  function patchIconReferences(sections, fallbackMap, droppedSet) {
    for (const spec of Object.values(sections)) {
      for (const elem of Object.values(spec.elements)) {
        const f = elem.iconFile;
        if (!f) continue;
        if (fallbackMap.has(f)) {
          elem.iconFile = fallbackMap.get(f);
        } else if (droppedSet.has(f)) {
          delete elem.iconFile;
        }
      }
    }
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
      init_icon_detector();
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3NhbmRib3gvdXRpbHMudHMiLCAiLi4vc3JjL3NhbmRib3gvcmVzcG9uc2l2ZS50cyIsICIuLi9zcmMvc2FuZGJveC9kaXNjb3ZlcnkudHMiLCAiLi4vc3JjL3NhbmRib3gvdmFsaWRhdG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2NvbG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2VmZmVjdHMudHMiLCAiLi4vc3JjL3NhbmRib3gvdHlwb2dyYXBoeS50cyIsICIuLi9zcmMvc2FuZGJveC9zcGFjaW5nLnRzIiwgIi4uL3NyYy9zYW5kYm94L2dyaWQudHMiLCAiLi4vc3JjL3NhbmRib3gvaW50ZXJhY3Rpb25zLnRzIiwgIi4uL3NyYy9zYW5kYm94L3ZhcmlhYmxlcy50cyIsICIuLi9zcmMvc2FuZGJveC9wYXR0ZXJucy50cyIsICIuLi9zcmMvc2FuZGJveC9zZWN0aW9uLXBhcnNlci50cyIsICIuLi9zcmMvc2FuZGJveC9pbWFnZS1leHBvcnRlci50cyIsICIuLi9zcmMvc2FuZGJveC9pY29uLWRldGVjdG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2V4dHJhY3Rvci50cyIsICIuLi9zcmMvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBDb252ZXJ0IGEgRmlnbWEgbGF5ZXIgbmFtZSB0byBhIFVSTC1zYWZlIGtlYmFiLWNhc2Ugc2x1Zy5cbiAqIFwiSGVybyBTZWN0aW9uXCIgXHUyMTkyIFwiaGVyby1zZWN0aW9uXCJcbiAqIFwiQWJvdXQgVXMgXHUyMDE0IE92ZXJ2aWV3XCIgXHUyMTkyIFwiYWJvdXQtdXMtb3ZlcnZpZXdcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbmFtZVxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1tcdTIwMTRcdTIwMTNdL2csICctJylcbiAgICAucmVwbGFjZSgvW15hLXowLTlcXHMtXS9nLCAnJylcbiAgICAucmVwbGFjZSgvXFxzKy9nLCAnLScpXG4gICAgLnJlcGxhY2UoLy0rL2csICctJylcbiAgICAucmVwbGFjZSgvXi18LSQvZywgJycpO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSBGaWdtYSBsYXllciBuYW1lIHRvIEFDRi1jb21wYXRpYmxlIHNuYWtlX2Nhc2UgbGF5b3V0IG5hbWUuXG4gKiBcIkhlcm8gU2VjdGlvblwiIFx1MjE5MiBcImhlcm9fc2VjdGlvblwiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0xheW91dE5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5hbWVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXHUyMDE0XHUyMDEzXS9nLCAnXycpXG4gICAgLnJlcGxhY2UoL1teYS16MC05XFxzX10vZywgJycpXG4gICAgLnJlcGxhY2UoL1xccysvZywgJ18nKVxuICAgIC5yZXBsYWNlKC9fKy9nLCAnXycpXG4gICAgLnJlcGxhY2UoL15ffF8kL2csICcnKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgbnVtZXJpYyB2YWx1ZSB0byBhIENTUyB2YWx1ZSBzdHJpbmcgd2l0aCB1bml0LlxuICogTkVWRVIgcmV0dXJucyBhIGJhcmUgbnVtYmVyIFx1MjAxNCBhbHdheXMgXCJOcHhcIiwgXCJOJVwiLCBldGMuXG4gKiBSZXR1cm5zIG51bGwgaWYgdGhlIHZhbHVlIGlzIHVuZGVmaW5lZC9udWxsL05hTi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvQ3NzVmFsdWUodmFsdWU6IG51bWJlciB8IHVuZGVmaW5lZCB8IG51bGwsIHVuaXQ6IHN0cmluZyA9ICdweCcpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgaXNOYU4odmFsdWUpKSByZXR1cm4gbnVsbDtcbiAgLy8gUm91bmQgdG8gYXZvaWQgZmxvYXRpbmctcG9pbnQgbm9pc2UgKGUuZy4sIDc5Ljk5OTk5IFx1MjE5MiA4MClcbiAgY29uc3Qgcm91bmRlZCA9IE1hdGgucm91bmQodmFsdWUgKiAxMDApIC8gMTAwO1xuICAvLyBVc2UgaW50ZWdlciB3aGVuIGNsb3NlIGVub3VnaFxuICBjb25zdCBkaXNwbGF5ID0gTnVtYmVyLmlzSW50ZWdlcihyb3VuZGVkKSA/IHJvdW5kZWQgOiByb3VuZGVkO1xuICByZXR1cm4gYCR7ZGlzcGxheX0ke3VuaXR9YDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgYSBGaWdtYSBub2RlIElEIGZvciBvdXRwdXQuIEZpZ21hIHVzZXMgXCIxOjIzNFwiIGZvcm1hdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vZGVJZFRvU3RyaW5nKGlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaWQ7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgYSBzY3JlZW5zaG90IGZpbGVuYW1lIGZyb20gdGhlIHNlY3Rpb24ncyBsYXlvdXQgbmFtZS5cbiAqIFwiSGVybyBTZWN0aW9uXCIgXHUyMTkyIFwiaGVyby1zZWN0aW9uLnBuZ1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY3JlZW5zaG90RmlsZW5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3NsdWdpZnkobmFtZSl9LnBuZ2A7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgYXNwZWN0IHJhdGlvIHN0cmluZyBmcm9tIHdpZHRoIGFuZCBoZWlnaHQuXG4gKiBSZXR1cm5zIHRoZSBzaW1wbGVzdCBpbnRlZ2VyIHJhdGlvOiAxNDQwLzkwMCBcdTIxOTIgXCIxNi8xMFwiXG4gKiBSZXR1cm5zIG51bGwgaWYgZWl0aGVyIGRpbWVuc2lvbiBpcyAwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUFzcGVjdFJhdGlvKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghd2lkdGggfHwgIWhlaWdodCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGdjZCA9IChhOiBudW1iZXIsIGI6IG51bWJlcik6IG51bWJlciA9PiAoYiA9PT0gMCA/IGEgOiBnY2QoYiwgYSAlIGIpKTtcbiAgY29uc3QgZCA9IGdjZChNYXRoLnJvdW5kKHdpZHRoKSwgTWF0aC5yb3VuZChoZWlnaHQpKTtcbiAgcmV0dXJuIGAke01hdGgucm91bmQod2lkdGggLyBkKX0vJHtNYXRoLnJvdW5kKGhlaWdodCAvIGQpfWA7XG59XG5cbi8qKlxuICogRGV0ZWN0IGlmIGEgbm9kZSBuYW1lIGlzIGEgZGVmYXVsdCBGaWdtYS1nZW5lcmF0ZWQgbmFtZS5cbiAqIFwiRnJhbWUgMVwiLCBcIkdyb3VwIDIzXCIsIFwiUmVjdGFuZ2xlIDRcIiwgXCJWZWN0b3JcIiBcdTIxOTIgdHJ1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEZWZhdWx0TGF5ZXJOYW1lKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gL14oRnJhbWV8R3JvdXB8UmVjdGFuZ2xlfEVsbGlwc2V8TGluZXxWZWN0b3J8UG9seWdvbnxTdGFyfEJvb2xlYW58U2xpY2V8Q29tcG9uZW50fEluc3RhbmNlKVxccypcXGQqJC9pLnRlc3QobmFtZSk7XG59XG4iLCAiaW1wb3J0IHsgQnJlYWtwb2ludENsYXNzLCBGcmFtZUluZm8sIFJlc3BvbnNpdmVNYXAsIFJlc3BvbnNpdmVQYWlyLCBVbm1hdGNoZWRGcmFtZSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgc2x1Z2lmeSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIENsYXNzaWZ5IGEgZnJhbWUgd2lkdGggaW50byBhIGJyZWFrcG9pbnQgY2F0ZWdvcnkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc2lmeUJyZWFrcG9pbnQod2lkdGg6IG51bWJlcik6IEJyZWFrcG9pbnRDbGFzcyB7XG4gIGlmICh3aWR0aCA8PSA0ODApIHJldHVybiAnbW9iaWxlJztcbiAgaWYgKHdpZHRoIDw9IDgyMCkgcmV0dXJuICd0YWJsZXQnO1xuICBpZiAod2lkdGggPD0gMTQ0MCkgcmV0dXJuICdkZXNrdG9wJztcbiAgcmV0dXJuICdsYXJnZSc7XG59XG5cbi8qKlxuICogQ29tbW9uIHN1ZmZpeGVzL2tleXdvcmRzIHRoYXQgZGVub3RlIGJyZWFrcG9pbnRzIGluIGZyYW1lIG5hbWVzLlxuICovXG5jb25zdCBCUkVBS1BPSU5UX1BBVFRFUk5TID0gW1xuICAvWy1cdTIwMTNcdTIwMTRcXHNdKihkZXNrdG9wfG1vYmlsZXx0YWJsZXR8cmVzcG9uc2l2ZXxwaG9uZXx3ZWJ8bGd8bWR8c218eHMpL2dpLFxuICAvWy1cdTIwMTNcdTIwMTRcXHNdKihcXGR7Myw0fSlcXHMqKD86cHgpPyQvZ2ksICAgLy8gdHJhaWxpbmcgd2lkdGggbnVtYmVycyBsaWtlIFwiMTQ0MFwiIG9yIFwiMzc1cHhcIlxuICAvXFwoKD86ZGVza3RvcHxtb2JpbGV8dGFibGV0fHBob25lKVxcKS9naSxcbiAgL1xccyskL2csXG5dO1xuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIGZyYW1lIG5hbWUgYnkgc3RyaXBwaW5nIGJyZWFrcG9pbnQgaWRlbnRpZmllcnMuXG4gKiBcIkFib3V0IC0gRGVza3RvcFwiIFx1MjE5MiBcImFib3V0XCJcbiAqIFwiSG9tZXBhZ2UgMTQ0MFwiIFx1MjE5MiBcImhvbWVwYWdlXCJcbiAqIFwiU2VydmljZXMgKE1vYmlsZSlcIiBcdTIxOTIgXCJzZXJ2aWNlc1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVGcmFtZU5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG5vcm1hbGl6ZWQgPSBuYW1lO1xuICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgQlJFQUtQT0lOVF9QQVRURVJOUykge1xuICAgIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVkLnJlcGxhY2UocGF0dGVybiwgJycpO1xuICB9XG4gIHJldHVybiBub3JtYWxpemVkLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbn1cblxuLyoqXG4gKiBNYXRjaCBkZXNrdG9wIGFuZCBtb2JpbGUgZnJhbWVzIGJ5IG5hbWUgc2ltaWxhcml0eS5cbiAqIFJldHVybnMgUmVzcG9uc2l2ZU1hcCB3aXRoIG1hdGNoZWQgcGFpcnMgYW5kIHVubWF0Y2hlZCBmcmFtZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaFJlc3BvbnNpdmVGcmFtZXMoYWxsRnJhbWVzOiBGcmFtZUluZm9bXSk6IFJlc3BvbnNpdmVNYXAge1xuICAvLyBHcm91cCBmcmFtZXMgYnkgbm9ybWFsaXplZCBuYW1lXG4gIGNvbnN0IGdyb3VwcyA9IG5ldyBNYXA8c3RyaW5nLCBGcmFtZUluZm9bXT4oKTtcblxuICBmb3IgKGNvbnN0IGZyYW1lIG9mIGFsbEZyYW1lcykge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVGcmFtZU5hbWUoZnJhbWUubmFtZSk7XG4gICAgaWYgKCFncm91cHMuaGFzKG5vcm1hbGl6ZWQpKSB7XG4gICAgICBncm91cHMuc2V0KG5vcm1hbGl6ZWQsIFtdKTtcbiAgICB9XG4gICAgZ3JvdXBzLmdldChub3JtYWxpemVkKSEucHVzaChmcmFtZSk7XG4gIH1cblxuICBjb25zdCBtYXRjaGVkUGFpcnM6IFJlc3BvbnNpdmVQYWlyW10gPSBbXTtcbiAgY29uc3QgdW5tYXRjaGVkRnJhbWVzOiBVbm1hdGNoZWRGcmFtZVtdID0gW107XG4gIGNvbnN0IG1hdGNoZWRJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IFtiYXNlTmFtZSwgZnJhbWVzXSBvZiBncm91cHMpIHtcbiAgICBpZiAoZnJhbWVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgLy8gU2luZ2xlIGZyYW1lIFx1MjAxNCBubyByZXNwb25zaXZlIHBhaXJcbiAgICAgIGNvbnN0IGZyYW1lID0gZnJhbWVzWzBdO1xuICAgICAgaWYgKGZyYW1lLmJyZWFrcG9pbnQgPT09ICdkZXNrdG9wJyB8fCBmcmFtZS5icmVha3BvaW50ID09PSAnbGFyZ2UnKSB7XG4gICAgICAgIC8vIERlc2t0b3Agd2l0aG91dCBtb2JpbGUgXHUyMTkyIHN0aWxsIGEgdmFsaWQgcGFnZSwganVzdCBubyByZXNwb25zaXZlIGRhdGFcbiAgICAgICAgbWF0Y2hlZFBhaXJzLnB1c2goe1xuICAgICAgICAgIHBhZ2VOYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgICAgIHBhZ2VTbHVnOiBzbHVnaWZ5KGJhc2VOYW1lIHx8IGZyYW1lLm5hbWUpLFxuICAgICAgICAgIGRlc2t0b3A6IHsgZnJhbWVJZDogZnJhbWUuaWQsIGZyYW1lTmFtZTogZnJhbWUubmFtZSwgd2lkdGg6IGZyYW1lLndpZHRoIH0sXG4gICAgICAgICAgbW9iaWxlOiBudWxsLFxuICAgICAgICAgIHRhYmxldDogbnVsbCxcbiAgICAgICAgICBtYXRjaENvbmZpZGVuY2U6IDEuMCxcbiAgICAgICAgICBtYXRjaE1ldGhvZDogJ25hbWUtc2ltaWxhcml0eScsXG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVkSWRzLmFkZChmcmFtZS5pZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bm1hdGNoZWRGcmFtZXMucHVzaCh7XG4gICAgICAgICAgZnJhbWVJZDogZnJhbWUuaWQsXG4gICAgICAgICAgZnJhbWVOYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgICAgIHdpZHRoOiBmcmFtZS53aWR0aCxcbiAgICAgICAgICBicmVha3BvaW50OiBmcmFtZS5icmVha3BvaW50LFxuICAgICAgICAgIHJlYXNvbjogJ25vIGRlc2t0b3AgY291bnRlcnBhcnQgZm91bmQnLFxuICAgICAgICB9KTtcbiAgICAgICAgbWF0Y2hlZElkcy5hZGQoZnJhbWUuaWQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gTXVsdGlwbGUgZnJhbWVzIHdpdGggc2FtZSBiYXNlIG5hbWUgXHUyMDE0IG1hdGNoIGJ5IGJyZWFrcG9pbnRcbiAgICBjb25zdCBkZXNrdG9wID0gZnJhbWVzLmZpbmQoZiA9PiBmLmJyZWFrcG9pbnQgPT09ICdkZXNrdG9wJyB8fCBmLmJyZWFrcG9pbnQgPT09ICdsYXJnZScpO1xuICAgIGNvbnN0IG1vYmlsZSA9IGZyYW1lcy5maW5kKGYgPT4gZi5icmVha3BvaW50ID09PSAnbW9iaWxlJyk7XG4gICAgY29uc3QgdGFibGV0ID0gZnJhbWVzLmZpbmQoZiA9PiBmLmJyZWFrcG9pbnQgPT09ICd0YWJsZXQnKTtcblxuICAgIGlmIChkZXNrdG9wKSB7XG4gICAgICBtYXRjaGVkUGFpcnMucHVzaCh7XG4gICAgICAgIHBhZ2VOYW1lOiBkZXNrdG9wLm5hbWUsXG4gICAgICAgIHBhZ2VTbHVnOiBzbHVnaWZ5KGJhc2VOYW1lIHx8IGRlc2t0b3AubmFtZSksXG4gICAgICAgIGRlc2t0b3A6IHsgZnJhbWVJZDogZGVza3RvcC5pZCwgZnJhbWVOYW1lOiBkZXNrdG9wLm5hbWUsIHdpZHRoOiBkZXNrdG9wLndpZHRoIH0sXG4gICAgICAgIG1vYmlsZTogbW9iaWxlID8geyBmcmFtZUlkOiBtb2JpbGUuaWQsIGZyYW1lTmFtZTogbW9iaWxlLm5hbWUsIHdpZHRoOiBtb2JpbGUud2lkdGggfSA6IG51bGwsXG4gICAgICAgIHRhYmxldDogdGFibGV0ID8geyBmcmFtZUlkOiB0YWJsZXQuaWQsIGZyYW1lTmFtZTogdGFibGV0Lm5hbWUsIHdpZHRoOiB0YWJsZXQud2lkdGggfSA6IG51bGwsXG4gICAgICAgIG1hdGNoQ29uZmlkZW5jZTogMC45NSxcbiAgICAgICAgbWF0Y2hNZXRob2Q6ICduYW1lLXNpbWlsYXJpdHknLFxuICAgICAgfSk7XG4gICAgICBtYXRjaGVkSWRzLmFkZChkZXNrdG9wLmlkKTtcbiAgICAgIGlmIChtb2JpbGUpIG1hdGNoZWRJZHMuYWRkKG1vYmlsZS5pZCk7XG4gICAgICBpZiAodGFibGV0KSBtYXRjaGVkSWRzLmFkZCh0YWJsZXQuaWQpO1xuICAgIH1cblxuICAgIC8vIEFueSByZW1haW5pbmcgZnJhbWVzIGluIHRoaXMgZ3JvdXBcbiAgICBmb3IgKGNvbnN0IGZyYW1lIG9mIGZyYW1lcykge1xuICAgICAgaWYgKCFtYXRjaGVkSWRzLmhhcyhmcmFtZS5pZCkpIHtcbiAgICAgICAgdW5tYXRjaGVkRnJhbWVzLnB1c2goe1xuICAgICAgICAgIGZyYW1lSWQ6IGZyYW1lLmlkLFxuICAgICAgICAgIGZyYW1lTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgICB3aWR0aDogZnJhbWUud2lkdGgsXG4gICAgICAgICAgYnJlYWtwb2ludDogZnJhbWUuYnJlYWtwb2ludCxcbiAgICAgICAgICByZWFzb246ICdjb3VsZCBub3QgcGFpciB3aXRoIGRlc2t0b3AgZnJhbWUnLFxuICAgICAgICB9KTtcbiAgICAgICAgbWF0Y2hlZElkcy5hZGQoZnJhbWUuaWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIENhdGNoIGFueSBmcmFtZXMgbm90IHByb2Nlc3NlZFxuICBmb3IgKGNvbnN0IGZyYW1lIG9mIGFsbEZyYW1lcykge1xuICAgIGlmICghbWF0Y2hlZElkcy5oYXMoZnJhbWUuaWQpKSB7XG4gICAgICB1bm1hdGNoZWRGcmFtZXMucHVzaCh7XG4gICAgICAgIGZyYW1lSWQ6IGZyYW1lLmlkLFxuICAgICAgICBmcmFtZU5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgIHdpZHRoOiBmcmFtZS53aWR0aCxcbiAgICAgICAgYnJlYWtwb2ludDogZnJhbWUuYnJlYWtwb2ludCxcbiAgICAgICAgcmVhc29uOiAnbm90IG1hdGNoZWQgYnkgYW55IG1ldGhvZCcsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4geyBtYXRjaGVkUGFpcnMsIHVubWF0Y2hlZEZyYW1lcyB9O1xufVxuXG4vKipcbiAqIENvbnRlbnQtYmFzZWQgbWF0Y2hpbmcgZmFsbGJhY2s6IGNvbXBhcmUgY2hpbGQgbmFtZXMgYmV0d2VlbiB0d28gZnJhbWVzLlxuICogUmV0dXJucyBvdmVybGFwIHJhdGlvICgwLTEpLiA+MC42ID0gbGlrZWx5IHNhbWUgcGFnZSBhdCBkaWZmZXJlbnQgYnJlYWtwb2ludHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlQ29udGVudE92ZXJsYXAoZnJhbWVBOiBGcmFtZU5vZGUsIGZyYW1lQjogRnJhbWVOb2RlKTogbnVtYmVyIHtcbiAgY29uc3QgbmFtZXNBID0gbmV3IFNldChmcmFtZUEuY2hpbGRyZW4ubWFwKGMgPT4gYy5uYW1lLnRvTG93ZXJDYXNlKCkpKTtcbiAgY29uc3QgbmFtZXNCID0gbmV3IFNldChmcmFtZUIuY2hpbGRyZW4ubWFwKGMgPT4gYy5uYW1lLnRvTG93ZXJDYXNlKCkpKTtcblxuICBpZiAobmFtZXNBLnNpemUgPT09IDAgfHwgbmFtZXNCLnNpemUgPT09IDApIHJldHVybiAwO1xuXG4gIGxldCBvdmVybGFwID0gMDtcbiAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzQSkge1xuICAgIGlmIChuYW1lc0IuaGFzKG5hbWUpKSBvdmVybGFwKys7XG4gIH1cblxuICBjb25zdCB1bmlvblNpemUgPSBuZXcgU2V0KFsuLi5uYW1lc0EsIC4uLm5hbWVzQl0pLnNpemU7XG4gIHJldHVybiB1bmlvblNpemUgPiAwID8gb3ZlcmxhcCAvIHVuaW9uU2l6ZSA6IDA7XG59XG4iLCAiaW1wb3J0IHsgUGFnZUluZm8sIEZyYW1lSW5mbyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgY2xhc3NpZnlCcmVha3BvaW50IH0gZnJvbSAnLi9yZXNwb25zaXZlJztcblxuLyoqXG4gKiBEaXNjb3ZlciBhbGwgcGFnZXMgaW4gdGhlIEZpZ21hIGZpbGUuXG4gKiBFYWNoIHBhZ2UgY29udGFpbnMgZnJhbWVzIHRoYXQgcmVwcmVzZW50IGRlc2lnbiBhcnRib2FyZHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb3ZlclBhZ2VzKCk6IFBhZ2VJbmZvW10ge1xuICBjb25zdCBwYWdlczogUGFnZUluZm9bXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgcGFnZSBvZiBmaWdtYS5yb290LmNoaWxkcmVuKSB7XG4gICAgY29uc3QgZnJhbWVzID0gZGlzY292ZXJGcmFtZXMocGFnZSk7XG4gICAgaWYgKGZyYW1lcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYWdlcy5wdXNoKHtcbiAgICAgICAgaWQ6IHBhZ2UuaWQsXG4gICAgICAgIG5hbWU6IHBhZ2UubmFtZSxcbiAgICAgICAgZnJhbWVzLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhZ2VzO1xufVxuXG4vKipcbiAqIERpc2NvdmVyIGFsbCB0b3AtbGV2ZWwgZnJhbWVzIHdpdGhpbiBhIHBhZ2UuXG4gKiBGaWx0ZXJzIHRvIEZSQU1FLCBDT01QT05FTlRfU0VULCBhbmQgQ09NUE9ORU5UIG5vZGVzIHdpdGggbWVhbmluZ2Z1bCBkaW1lbnNpb25zLlxuICovXG5mdW5jdGlvbiBkaXNjb3ZlckZyYW1lcyhwYWdlOiBQYWdlTm9kZSk6IEZyYW1lSW5mb1tdIHtcbiAgY29uc3QgZnJhbWVzOiBGcmFtZUluZm9bXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgcGFnZS5jaGlsZHJlbikge1xuICAgIC8vIE9ubHkgaW5jbHVkZSB0b3AtbGV2ZWwgZnJhbWVzIChub3QgZ3JvdXBzLCB2ZWN0b3JzLCBldGMuKVxuICAgIGlmIChjaGlsZC50eXBlICE9PSAnRlJBTUUnICYmIGNoaWxkLnR5cGUgIT09ICdDT01QT05FTlQnICYmIGNoaWxkLnR5cGUgIT09ICdDT01QT05FTlRfU0VUJykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgZnJhbWUgPSBjaGlsZCBhcyBGcmFtZU5vZGU7XG5cbiAgICAvLyBTa2lwIHRpbnkgZnJhbWVzIChsaWtlbHkgaWNvbnMgb3IgY29tcG9uZW50cywgbm90IHBhZ2UgZGVzaWducylcbiAgICBpZiAoZnJhbWUud2lkdGggPCAzMDAgfHwgZnJhbWUuaGVpZ2h0IDwgMjAwKSBjb250aW51ZTtcblxuICAgIC8vIENvdW50IHZpc2libGUgc2VjdGlvbnMgKGRpcmVjdCBjaGlsZHJlbiB0aGF0IGFyZSBmcmFtZXMpXG4gICAgY29uc3Qgc2VjdGlvbkNvdW50ID0gZnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3guaGVpZ2h0ID4gNTBcbiAgICApLmxlbmd0aDtcblxuICAgIC8vIENoZWNrIGlmIGFueSBzZWN0aW9uIHVzZXMgYXV0by1sYXlvdXRcbiAgICBjb25zdCBoYXNBdXRvTGF5b3V0ID0gZnJhbWUubGF5b3V0TW9kZSAhPT0gdW5kZWZpbmVkICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJztcblxuICAgIGZyYW1lcy5wdXNoKHtcbiAgICAgIGlkOiBmcmFtZS5pZCxcbiAgICAgIG5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICB3aWR0aDogTWF0aC5yb3VuZChmcmFtZS53aWR0aCksXG4gICAgICBoZWlnaHQ6IE1hdGgucm91bmQoZnJhbWUuaGVpZ2h0KSxcbiAgICAgIGJyZWFrcG9pbnQ6IGNsYXNzaWZ5QnJlYWtwb2ludChNYXRoLnJvdW5kKGZyYW1lLndpZHRoKSksXG4gICAgICBzZWN0aW9uQ291bnQsXG4gICAgICBoYXNBdXRvTGF5b3V0LFxuICAgICAgcmVzcG9uc2l2ZVBhaXJJZDogbnVsbCxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBmcmFtZXM7XG59XG4iLCAiaW1wb3J0IHsgVmFsaWRhdGlvblJlc3VsdCwgRnJhbWVJbmZvIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBpc0RlZmF1bHRMYXllck5hbWUgfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBSdW4gYWxsIDkgdmFsaWRhdGlvbiBjaGVja3MgYWdhaW5zdCBzZWxlY3RlZCBmcmFtZXMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5BbGxWYWxpZGF0aW9ucyhmcmFtZUlkczogc3RyaW5nW10pOiBQcm9taXNlPFZhbGlkYXRpb25SZXN1bHRbXT4ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGZyYW1lSWQgb2YgZnJhbWVJZHMpIHtcbiAgICBjb25zdCBub2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQoZnJhbWVJZCk7XG4gICAgaWYgKCFub2RlIHx8IG5vZGUudHlwZSAhPT0gJ0ZSQU1FJykgY29udGludWU7XG5cbiAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgIGNvbnN0IHNlY3Rpb25zID0gZnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKVxuICAgICk7XG5cbiAgICAvLyBDaGVjayAxOiBNaXNzaW5nIGF1dG8tbGF5b3V0IG9uIHNlY3Rpb25zXG4gICAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrQXV0b0xheW91dChzZWN0aW9ucywgZnJhbWUubmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgMjogRGVmYXVsdCBsYXllciBuYW1lc1xuICAgIHJlc3VsdHMucHVzaCguLi5jaGVja0xheWVyTmFtZXMoc2VjdGlvbnMsIGZyYW1lLm5hbWUpKTtcblxuICAgIC8vIENoZWNrIDM6IE1pc3NpbmcgZm9udHNcbiAgICByZXN1bHRzLnB1c2goLi4uYXdhaXQgY2hlY2tGb250cyhmcmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgNDogSW5jb25zaXN0ZW50IHNwYWNpbmdcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tTcGFjaW5nQ29uc2lzdGVuY3koZnJhbWUpKTtcblxuICAgIC8vIENoZWNrIDU6IE92ZXJzaXplZCBpbWFnZXNcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tPdmVyc2l6ZWRJbWFnZXMoZnJhbWUpKTtcblxuICAgIC8vIENoZWNrIDY6IE92ZXJsYXBwaW5nIHNlY3Rpb25zXG4gICAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrT3ZlcmxhcHMoc2VjdGlvbnMsIGZyYW1lLm5hbWUpKTtcblxuICAgIC8vIENoZWNrIDk6IFRleHQgb3ZlcmZsb3dcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tUZXh0T3ZlcmZsb3coZnJhbWUpKTtcbiAgfVxuXG4gIC8vIENoZWNrIDc6IE1pc3NpbmcgcmVzcG9uc2l2ZSBmcmFtZXMgKGNyb3NzLWZyYW1lIGNoZWNrKVxuICByZXN1bHRzLnB1c2goLi4uY2hlY2tSZXNwb25zaXZlRnJhbWVzKGZyYW1lSWRzKSk7XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayAxOiBNaXNzaW5nIEF1dG8tTGF5b3V0IFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja0F1dG9MYXlvdXQoc2VjdGlvbnM6IFNjZW5lTm9kZVtdLCBmcmFtZU5hbWU6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2Ygc2VjdGlvbnMpIHtcbiAgICBpZiAoc2VjdGlvbi50eXBlID09PSAnRlJBTUUnIHx8IHNlY3Rpb24udHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgc2VjdGlvbi50eXBlID09PSAnSU5TVEFOQ0UnKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IHNlY3Rpb24gYXMgRnJhbWVOb2RlO1xuICAgICAgaWYgKCFmcmFtZS5sYXlvdXRNb2RlIHx8IGZyYW1lLmxheW91dE1vZGUgPT09ICdOT05FJykge1xuICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICAgICAgY2hlY2s6ICdhdXRvLWxheW91dCcsXG4gICAgICAgICAgbWVzc2FnZTogYFNlY3Rpb24gXCIke3NlY3Rpb24ubmFtZX1cIiB1c2VzIGFic29sdXRlIHBvc2l0aW9uaW5nLiBTcGFjaW5nIHZhbHVlcyB3aWxsIGJlIGFwcHJveGltYXRlLmAsXG4gICAgICAgICAgc2VjdGlvbk5hbWU6IHNlY3Rpb24ubmFtZSxcbiAgICAgICAgICBub2RlSWQ6IHNlY3Rpb24uaWQsXG4gICAgICAgICAgbm9kZU5hbWU6IHNlY3Rpb24ubmFtZSxcbiAgICAgICAgICBzdWdnZXN0aW9uOiAnQXBwbHkgYXV0by1sYXlvdXQgdG8gdGhpcyBzZWN0aW9uIGZvciBwcmVjaXNlIHNwYWNpbmcgZXh0cmFjdGlvbi4nLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayAyOiBEZWZhdWx0IExheWVyIE5hbWVzIFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja0xheWVyTmFtZXMoc2VjdGlvbnM6IFNjZW5lTm9kZVtdLCBmcmFtZU5hbWU6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgaWYgKGlzRGVmYXVsdExheWVyTmFtZShub2RlLm5hbWUpKSB7XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogZGVwdGggPT09IDAgPyAnd2FybmluZycgOiAnaW5mbycsXG4gICAgICAgIGNoZWNrOiAnbGF5ZXItbmFtZXMnLFxuICAgICAgICBtZXNzYWdlOiBgTGF5ZXIgXCIke25vZGUubmFtZX1cIiBoYXMgYSBkZWZhdWx0IEZpZ21hIG5hbWUke2RlcHRoID09PSAwID8gJyAoc2VjdGlvbiBsZXZlbCknIDogJyd9LmAsXG4gICAgICAgIHNlY3Rpb25OYW1lOiBmcmFtZU5hbWUsXG4gICAgICAgIG5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgbm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgc3VnZ2VzdGlvbjogJ1JlbmFtZSB0byBhIGRlc2NyaXB0aXZlIG5hbWUgKGUuZy4sIFwiSGVybyBTZWN0aW9uXCIsIFwiRmVhdHVyZXMgR3JpZFwiKS4nLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUgJiYgZGVwdGggPCAyKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCwgZGVwdGggKyAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2Ygc2VjdGlvbnMpIHtcbiAgICB3YWxrKHNlY3Rpb24sIDApO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgMzogTWlzc2luZyBGb250cyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuYXN5bmMgZnVuY3Rpb24gY2hlY2tGb250cyhmcmFtZTogRnJhbWVOb2RlKTogUHJvbWlzZTxWYWxpZGF0aW9uUmVzdWx0W10+IHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG4gIGNvbnN0IGNoZWNrZWRGb250cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZ1bmN0aW9uIGNvbGxlY3RGb250TmFtZXMobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCBmb250TmFtZSA9IG5vZGUuZm9udE5hbWU7XG4gICAgICBpZiAoZm9udE5hbWUgIT09IGZpZ21hLm1peGVkICYmIGZvbnROYW1lKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGAke2ZvbnROYW1lLmZhbWlseX06OiR7Zm9udE5hbWUuc3R5bGV9YDtcbiAgICAgICAgaWYgKCFjaGVja2VkRm9udHMuaGFzKGtleSkpIHtcbiAgICAgICAgICBjaGVja2VkRm9udHMuYWRkKGtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIGNvbGxlY3RGb250TmFtZXMoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbGxlY3RGb250TmFtZXMoZnJhbWUpO1xuXG4gIGZvciAoY29uc3QgZm9udEtleSBvZiBjaGVja2VkRm9udHMpIHtcbiAgICBjb25zdCBbZmFtaWx5LCBzdHlsZV0gPSBmb250S2V5LnNwbGl0KCc6OicpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmaWdtYS5sb2FkRm9udEFzeW5jKHsgZmFtaWx5LCBzdHlsZSB9KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InLFxuICAgICAgICBjaGVjazogJ2ZvbnRzJyxcbiAgICAgICAgbWVzc2FnZTogYEZvbnQgXCIke2ZhbWlseX0gJHtzdHlsZX1cIiBpcyBub3QgYXZhaWxhYmxlLiBUZXh0IGV4dHJhY3Rpb24gbWF5IGZhaWwuYCxcbiAgICAgICAgc2VjdGlvbk5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgIHN1Z2dlc3Rpb246ICdJbnN0YWxsIHRoZSBmb250IG9yIHJlcGxhY2UgaXQgaW4gdGhlIGRlc2lnbi4nLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgNDogSW5jb25zaXN0ZW50IFNwYWNpbmcgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrU3BhY2luZ0NvbnNpc3RlbmN5KGZyYW1lOiBGcmFtZU5vZGUpOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcbiAgY29uc3Qgc3BhY2luZ1ZhbHVlczogbnVtYmVyW10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScpIHtcbiAgICAgIGNvbnN0IGYgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgIGlmIChmLmxheW91dE1vZGUgJiYgZi5sYXlvdXRNb2RlICE9PSAnTk9ORScpIHtcbiAgICAgICAgc3BhY2luZ1ZhbHVlcy5wdXNoKGYucGFkZGluZ1RvcCwgZi5wYWRkaW5nQm90dG9tLCBmLnBhZGRpbmdMZWZ0LCBmLnBhZGRpbmdSaWdodCwgZi5pdGVtU3BhY2luZyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2FsayhmcmFtZSk7XG5cbiAgLy8gRmluZCBuZWFyLWR1cGxpY2F0ZXNcbiAgY29uc3QgdW5pcXVlID0gWy4uLm5ldyBTZXQoc3BhY2luZ1ZhbHVlcy5maWx0ZXIodiA9PiB2ID4gMCkpXS5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdW5pcXVlLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGNvbnN0IGRpZmYgPSB1bmlxdWVbaSArIDFdIC0gdW5pcXVlW2ldO1xuICAgIGlmIChkaWZmID4gMCAmJiBkaWZmIDw9IDIpIHtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiAnaW5mbycsXG4gICAgICAgIGNoZWNrOiAnc3BhY2luZy1jb25zaXN0ZW5jeScsXG4gICAgICAgIG1lc3NhZ2U6IGBOZWFyLWR1cGxpY2F0ZSBzcGFjaW5nOiAke3VuaXF1ZVtpXX1weCBhbmQgJHt1bmlxdWVbaSArIDFdfXB4IFx1MjAxNCBsaWtlbHkgc2FtZSBpbnRlbnQ/YCxcbiAgICAgICAgc2VjdGlvbk5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgIHN1Z2dlc3Rpb246IGBDb25zaWRlciBzdGFuZGFyZGl6aW5nIHRvICR7TWF0aC5yb3VuZCgodW5pcXVlW2ldICsgdW5pcXVlW2kgKyAxXSkgLyAyKX1weC5gLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgNTogT3ZlcnNpemVkIEltYWdlcyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tPdmVyc2l6ZWRJbWFnZXMoZnJhbWU6IEZyYW1lTm9kZSk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdmaWxscycgaW4gbm9kZSkge1xuICAgICAgY29uc3QgZmlsbHMgPSAobm9kZSBhcyBhbnkpLmZpbGxzO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZmlsbHMpKSB7XG4gICAgICAgIGZvciAoY29uc3QgZmlsbCBvZiBmaWxscykge1xuICAgICAgICAgIGlmIChmaWxsLnR5cGUgPT09ICdJTUFHRScgJiYgZmlsbC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgY29uc3QgYm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgICAgICAgaWYgKGJvdW5kcykge1xuICAgICAgICAgICAgICAvLyBFc3RpbWF0ZSByYXcgaW1hZ2Ugc2l6ZSAoUkdCQSBhdCAyeCk6IHcgKiAyICogaCAqIDIgKiA0IGJ5dGVzXG4gICAgICAgICAgICAgIC8vIEVzdGltYXRlIGF0IDF4IGV4cG9ydDogd2lkdGggKiBoZWlnaHQgKiA0IChSR0JBIGJ5dGVzKVxuICAgICAgICAgICAgICBjb25zdCBlc3RpbWF0ZWRCeXRlcyA9IGJvdW5kcy53aWR0aCAqIGJvdW5kcy5oZWlnaHQgKiA0O1xuICAgICAgICAgICAgICBjb25zdCBlc3RpbWF0ZWRNQiA9IGVzdGltYXRlZEJ5dGVzIC8gKDEwMjQgKiAxMDI0KTtcbiAgICAgICAgICAgICAgaWYgKGVzdGltYXRlZE1CID4gNSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgICAgICAgICAgICAgY2hlY2s6ICdpbWFnZS1zaXplJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBJbWFnZSBpbiBcIiR7bm9kZS5uYW1lfVwiIGlzIGVzdGltYXRlZCBhdCAke2VzdGltYXRlZE1CLnRvRml4ZWQoMSl9TUIgYXQgMXggZXhwb3J0LmAsXG4gICAgICAgICAgICAgICAgICBub2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgICAgICAgICBub2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgc3VnZ2VzdGlvbjogJ0NvbnNpZGVyIHJlZHVjaW5nIGltYWdlIGRpbWVuc2lvbnMgb3IgZXhwb3J0IHNjYWxlLicsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKGZyYW1lKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayA2OiBPdmVybGFwcGluZyBTZWN0aW9ucyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tPdmVybGFwcyhzZWN0aW9uczogU2NlbmVOb2RlW10sIGZyYW1lTmFtZTogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG4gIGNvbnN0IHNvcnRlZCA9IFsuLi5zZWN0aW9uc11cbiAgICAuZmlsdGVyKHMgPT4gcy5hYnNvbHV0ZUJvdW5kaW5nQm94KVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc29ydGVkLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGNvbnN0IGN1cnIgPSBzb3J0ZWRbaV0uYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gICAgY29uc3QgbmV4dCA9IHNvcnRlZFtpICsgMV0uYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gICAgY29uc3Qgb3ZlcmxhcCA9IChjdXJyLnkgKyBjdXJyLmhlaWdodCkgLSBuZXh0Lnk7XG4gICAgaWYgKG92ZXJsYXAgPiAwKSB7XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgICBjaGVjazogJ292ZXJsYXAnLFxuICAgICAgICBtZXNzYWdlOiBgU2VjdGlvbiBcIiR7c29ydGVkW2ldLm5hbWV9XCIgb3ZlcmxhcHMgd2l0aCBcIiR7c29ydGVkW2kgKyAxXS5uYW1lfVwiIGJ5ICR7TWF0aC5yb3VuZChvdmVybGFwKX1weC5gLFxuICAgICAgICBzZWN0aW9uTmFtZTogc29ydGVkW2ldLm5hbWUsXG4gICAgICAgIG5vZGVJZDogc29ydGVkW2ldLmlkLFxuICAgICAgICBzdWdnZXN0aW9uOiAnVGhlIHBsdWdpbiB3aWxsIHJlY29yZCB0aGlzIGFzIGEgbmVnYXRpdmUgbWFyZ2luLiBWZXJpZnkgdGhlIHZpc3VhbCByZXN1bHQuJyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDc6IE1pc3NpbmcgUmVzcG9uc2l2ZSBGcmFtZXMgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrUmVzcG9uc2l2ZUZyYW1lcyhmcmFtZUlkczogc3RyaW5nW10pOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcbiAgY29uc3QgZnJhbWVzID0gZnJhbWVJZHNcbiAgICAubWFwKGlkID0+IGZpZ21hLmdldE5vZGVCeUlkKGlkKSlcbiAgICAuZmlsdGVyKG4gPT4gbiAmJiBuLnR5cGUgPT09ICdGUkFNRScpIGFzIEZyYW1lTm9kZVtdO1xuXG4gIGNvbnN0IGRlc2t0b3BGcmFtZXMgPSBmcmFtZXMuZmlsdGVyKGYgPT4gZi53aWR0aCA+IDEwMjQpO1xuICBjb25zdCBtb2JpbGVGcmFtZXMgPSBmcmFtZXMuZmlsdGVyKGYgPT4gZi53aWR0aCA8PSA0ODApO1xuXG4gIGlmIChkZXNrdG9wRnJhbWVzLmxlbmd0aCA+IDAgJiYgbW9iaWxlRnJhbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgY2hlY2s6ICdyZXNwb25zaXZlJyxcbiAgICAgIG1lc3NhZ2U6IGBPbmx5IGRlc2t0b3AgZnJhbWVzIHNlbGVjdGVkIChubyBtb2JpbGUgZnJhbWVzKS4gUmVzcG9uc2l2ZSB2YWx1ZXMgd2lsbCBiZSBjYWxjdWxhdGVkLCBub3QgZXh0cmFjdGVkLmAsXG4gICAgICBzdWdnZXN0aW9uOiAnSW5jbHVkZSBtb2JpbGUgKDM3NXB4KSBmcmFtZXMgZm9yIGV4YWN0IHJlc3BvbnNpdmUgdmFsdWVzLicsXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayA5OiBUZXh0IE92ZXJmbG93IFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja1RleHRPdmVyZmxvdyhmcmFtZTogRnJhbWVOb2RlKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcgJiYgbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmIG5vZGUucGFyZW50ICYmICdhYnNvbHV0ZUJvdW5kaW5nQm94JyBpbiBub2RlLnBhcmVudCkge1xuICAgICAgY29uc3QgdGV4dEJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgIGNvbnN0IHBhcmVudEJvdW5kcyA9IChub2RlLnBhcmVudCBhcyBGcmFtZU5vZGUpLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICBpZiAocGFyZW50Qm91bmRzKSB7XG4gICAgICAgIGNvbnN0IG92ZXJmbG93UmlnaHQgPSAodGV4dEJvdW5kcy54ICsgdGV4dEJvdW5kcy53aWR0aCkgLSAocGFyZW50Qm91bmRzLnggKyBwYXJlbnRCb3VuZHMud2lkdGgpO1xuICAgICAgICBjb25zdCBvdmVyZmxvd0JvdHRvbSA9ICh0ZXh0Qm91bmRzLnkgKyB0ZXh0Qm91bmRzLmhlaWdodCkgLSAocGFyZW50Qm91bmRzLnkgKyBwYXJlbnRCb3VuZHMuaGVpZ2h0KTtcbiAgICAgICAgaWYgKG92ZXJmbG93UmlnaHQgPiA1IHx8IG92ZXJmbG93Qm90dG9tID4gNSkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgICAgICAgY2hlY2s6ICd0ZXh0LW92ZXJmbG93JyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBUZXh0IFwiJHtub2RlLm5hbWV9XCIgb3ZlcmZsb3dzIGl0cyBjb250YWluZXIgYnkgJHtNYXRoLm1heChNYXRoLnJvdW5kKG92ZXJmbG93UmlnaHQpLCBNYXRoLnJvdW5kKG92ZXJmbG93Qm90dG9tKSl9cHguYCxcbiAgICAgICAgICAgIG5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICAgIG5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICBzdWdnZXN0aW9uOiAnUmVzaXplIHRoZSB0ZXh0IGNvbnRhaW5lciBvciByZWR1Y2UgdGV4dCBjb250ZW50LicsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKGZyYW1lKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59XG4iLCAiLyoqXG4gKiBDb252ZXJ0IGEgc2luZ2xlIEZpZ21hIDAtMSBmbG9hdCBjaGFubmVsIHRvIGEgMi1kaWdpdCBoZXggc3RyaW5nLlxuICogVXNlcyBNYXRoLnJvdW5kKCkgZm9yIHByZWNpc2lvbiAoTk9UIE1hdGguZmxvb3IoKSkuXG4gKi9cbmZ1bmN0aW9uIGNoYW5uZWxUb0hleCh2YWx1ZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiAyNTUpLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpLnRvVXBwZXJDYXNlKCk7XG59XG5cbi8qKlxuICogQ29udmVydCBGaWdtYSBSR0IgKDAtMSBmbG9hdCkgdG8gNi1kaWdpdCB1cHBlcmNhc2UgSEVYLlxuICogeyByOiAwLjA4NiwgZzogMC4yMiwgYjogMC45ODQgfSBcdTIxOTIgXCIjMTYzOEZCXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJnYlRvSGV4KGNvbG9yOiB7IHI6IG51bWJlcjsgZzogbnVtYmVyOyBiOiBudW1iZXIgfSk6IHN0cmluZyB7XG4gIHJldHVybiBgIyR7Y2hhbm5lbFRvSGV4KGNvbG9yLnIpfSR7Y2hhbm5lbFRvSGV4KGNvbG9yLmcpfSR7Y2hhbm5lbFRvSGV4KGNvbG9yLmIpfWA7XG59XG5cbi8qKlxuICogQ29udmVydCBGaWdtYSBSR0JBICgwLTEgZmxvYXQpIHRvIEhFWC5cbiAqIFJldHVybnMgNi1kaWdpdCBIRVggaWYgZnVsbHkgb3BhcXVlLCA4LWRpZ2l0IEhFWCBpZiBhbHBoYSA8IDEuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZ2JhVG9IZXgoY29sb3I6IHsgcjogbnVtYmVyOyBnOiBudW1iZXI7IGI6IG51bWJlciB9LCBvcGFjaXR5OiBudW1iZXIgPSAxKTogc3RyaW5nIHtcbiAgY29uc3QgYmFzZSA9IHJnYlRvSGV4KGNvbG9yKTtcbiAgaWYgKG9wYWNpdHkgPj0gMSkgcmV0dXJuIGJhc2U7XG4gIHJldHVybiBgJHtiYXNlfSR7Y2hhbm5lbFRvSGV4KG9wYWNpdHkpfWA7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgcHJpbWFyeSBiYWNrZ3JvdW5kIGNvbG9yIGZyb20gYSBub2RlJ3MgZmlsbHMuXG4gKiBSZXR1cm5zIDYvOC1kaWdpdCBIRVggb3IgbnVsbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3Iobm9kZTogU2NlbmVOb2RlICYgeyBmaWxscz86IHJlYWRvbmx5IFBhaW50W10gfSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoISgnZmlsbHMnIGluIG5vZGUpIHx8ICFub2RlLmZpbGxzIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZmlsbHMpKSByZXR1cm4gbnVsbDtcblxuICBmb3IgKGNvbnN0IGZpbGwgb2Ygbm9kZS5maWxscykge1xuICAgIGlmIChmaWxsLnR5cGUgPT09ICdTT0xJRCcgJiYgZmlsbC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgY29uc3Qgb3BhY2l0eSA9IGZpbGwub3BhY2l0eSAhPT0gdW5kZWZpbmVkID8gZmlsbC5vcGFjaXR5IDogMTtcbiAgICAgIHJldHVybiByZ2JhVG9IZXgoZmlsbC5jb2xvciwgb3BhY2l0eSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIHRleHQgY29sb3IgZnJvbSBhIFRFWFQgbm9kZSdzIGZpbGxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFRleHRDb2xvcihub2RlOiBUZXh0Tm9kZSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiBudWxsO1xuXG4gIGZvciAoY29uc3QgZmlsbCBvZiBub2RlLmZpbGxzIGFzIHJlYWRvbmx5IFBhaW50W10pIHtcbiAgICBpZiAoZmlsbC50eXBlID09PSAnU09MSUQnICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiByZ2JUb0hleChmaWxsLmNvbG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBncmFkaWVudCBhcyBDU1Mgc3RyaW5nLCBvciBudWxsIGlmIG5vdCBhIGdyYWRpZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEdyYWRpZW50KG5vZGU6IFNjZW5lTm9kZSAmIHsgZmlsbHM/OiByZWFkb25seSBQYWludFtdIH0pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCEoJ2ZpbGxzJyBpbiBub2RlKSB8fCAhbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuIG51bGw7XG5cbiAgZm9yIChjb25zdCBmaWxsIG9mIG5vZGUuZmlsbHMpIHtcbiAgICBpZiAoZmlsbC50eXBlID09PSAnR1JBRElFTlRfTElORUFSJyAmJiBmaWxsLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICBjb25zdCBzdG9wcyA9IGZpbGwuZ3JhZGllbnRTdG9wc1xuICAgICAgICAubWFwKHMgPT4gYCR7cmdiVG9IZXgocy5jb2xvcil9ICR7TWF0aC5yb3VuZChzLnBvc2l0aW9uICogMTAwKX0lYClcbiAgICAgICAgLmpvaW4oJywgJyk7XG4gICAgICByZXR1cm4gYGxpbmVhci1ncmFkaWVudCgke3N0b3BzfSlgO1xuICAgIH1cbiAgICBpZiAoZmlsbC50eXBlID09PSAnR1JBRElFTlRfUkFESUFMJyAmJiBmaWxsLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICBjb25zdCBzdG9wcyA9IGZpbGwuZ3JhZGllbnRTdG9wc1xuICAgICAgICAubWFwKHMgPT4gYCR7cmdiVG9IZXgocy5jb2xvcil9ICR7TWF0aC5yb3VuZChzLnBvc2l0aW9uICogMTAwKX0lYClcbiAgICAgICAgLmpvaW4oJywgJyk7XG4gICAgICByZXR1cm4gYHJhZGlhbC1ncmFkaWVudCgke3N0b3BzfSlgO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIG5vZGUgaGFzIGFuIElNQUdFIGZpbGwgKHBob3RvZ3JhcGgvYmFja2dyb3VuZCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNJbWFnZUZpbGwobm9kZTogU2NlbmVOb2RlICYgeyBmaWxscz86IHJlYWRvbmx5IFBhaW50W10gfSk6IGJvb2xlYW4ge1xuICBpZiAoISgnZmlsbHMnIGluIG5vZGUpIHx8ICFub2RlLmZpbGxzIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZmlsbHMpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBub2RlLmZpbGxzLnNvbWUoZiA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSk7XG59XG5cbi8qKlxuICogTWFwIEZpZ21hIHN0cm9rZUFsaWduIHRvIGEgc3VpdGFibGUgQ1NTIGJvcmRlci1zdHlsZS5cbiAqIEZpZ21hIHN1cHBvcnRzIHNvbGlkIHN0cm9rZXMgbmF0aXZlbHk7IGRhc2hlZCBpcyBpbmZlcnJlZCBmcm9tIGRhc2hQYXR0ZXJuLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEJvcmRlclN0eWxlKG5vZGU6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoISgnc3Ryb2tlcycgaW4gbm9kZSkgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5zdHJva2VzKSB8fCBub2RlLnN0cm9rZXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZGFzaFBhdHRlcm4gPSAobm9kZSBhcyBhbnkpLmRhc2hQYXR0ZXJuO1xuICBpZiAoQXJyYXkuaXNBcnJheShkYXNoUGF0dGVybikgJiYgZGFzaFBhdHRlcm4ubGVuZ3RoID4gMCkge1xuICAgIC8vIDEtdW5pdCBkYXNoZXMgPSBkb3R0ZWQsIGxhcmdlciA9IGRhc2hlZFxuICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KC4uLmRhc2hQYXR0ZXJuKTtcbiAgICByZXR1cm4gbWF4IDw9IDIgPyAnZG90dGVkJyA6ICdkYXNoZWQnO1xuICB9XG4gIHJldHVybiAnc29saWQnO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgcGVyLXNpZGUgYm9yZGVyLXdpZHRoLiBGaWdtYSdzIGluZGl2aWR1YWxTdHJva2VXZWlnaHRzIChpZiBzZXQpXG4gKiBwcm92aWRlcyBwZXItc2lkZSB3aWR0aHM7IG90aGVyd2lzZSBzdHJva2VXZWlnaHQgaXMgdW5pZm9ybS5cbiAqIFJldHVybnMgbnVsbCBmb3IgYW55IHNpZGUgdGhhdCBpcyAwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEJvcmRlcldpZHRocyhub2RlOiBhbnkpOiB7XG4gIHRvcDogbnVtYmVyIHwgbnVsbDsgcmlnaHQ6IG51bWJlciB8IG51bGw7IGJvdHRvbTogbnVtYmVyIHwgbnVsbDsgbGVmdDogbnVtYmVyIHwgbnVsbDsgdW5pZm9ybTogbnVtYmVyIHwgbnVsbDtcbn0ge1xuICBjb25zdCBpbmQgPSAobm9kZSBhcyBhbnkpLmluZGl2aWR1YWxTdHJva2VXZWlnaHRzO1xuICBpZiAoaW5kICYmIHR5cGVvZiBpbmQgPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogaW5kLnRvcCB8fCBudWxsLFxuICAgICAgcmlnaHQ6IGluZC5yaWdodCB8fCBudWxsLFxuICAgICAgYm90dG9tOiBpbmQuYm90dG9tIHx8IG51bGwsXG4gICAgICBsZWZ0OiBpbmQubGVmdCB8fCBudWxsLFxuICAgICAgdW5pZm9ybTogbnVsbCxcbiAgICB9O1xuICB9XG4gIGNvbnN0IHcgPSAobm9kZSBhcyBhbnkpLnN0cm9rZVdlaWdodDtcbiAgaWYgKHR5cGVvZiB3ID09PSAnbnVtYmVyJyAmJiB3ID4gMCkge1xuICAgIHJldHVybiB7IHRvcDogbnVsbCwgcmlnaHQ6IG51bGwsIGJvdHRvbTogbnVsbCwgbGVmdDogbnVsbCwgdW5pZm9ybTogdyB9O1xuICB9XG4gIHJldHVybiB7IHRvcDogbnVsbCwgcmlnaHQ6IG51bGwsIGJvdHRvbTogbnVsbCwgbGVmdDogbnVsbCwgdW5pZm9ybTogbnVsbCB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIGZpcnN0IHZpc2libGUgU09MSUQgc3Ryb2tlIGNvbG9yIGFzIGhleC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RTdHJva2VDb2xvcihub2RlOiBhbnkpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCEoJ3N0cm9rZXMnIGluIG5vZGUpIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuc3Ryb2tlcykpIHJldHVybiBudWxsO1xuICBmb3IgKGNvbnN0IHN0cm9rZSBvZiBub2RlLnN0cm9rZXMpIHtcbiAgICBpZiAoc3Ryb2tlLnR5cGUgPT09ICdTT0xJRCcgJiYgc3Ryb2tlLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gcmdiVG9IZXgoc3Ryb2tlLmNvbG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ29sbGVjdCBhbGwgdW5pcXVlIGNvbG9ycyBmcm9tIGEgbm9kZSB0cmVlLlxuICogUmV0dXJucyBhIG1hcCBvZiBIRVggXHUyMTkyIHVzYWdlIGNvdW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdENvbG9ycyhyb290OiBTY2VuZU5vZGUpOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+IHtcbiAgY29uc3QgY29sb3JzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICAvLyBGaWxsc1xuICAgIGlmICgnZmlsbHMnIGluIG5vZGUgJiYgbm9kZS5maWxscyAmJiBBcnJheS5pc0FycmF5KG5vZGUuZmlsbHMpKSB7XG4gICAgICBmb3IgKGNvbnN0IGZpbGwgb2Ygbm9kZS5maWxscykge1xuICAgICAgICBpZiAoZmlsbC50eXBlID09PSAnU09MSUQnICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBjb25zdCBoZXggPSByZ2JUb0hleChmaWxsLmNvbG9yKTtcbiAgICAgICAgICBjb2xvcnNbaGV4XSA9IChjb2xvcnNbaGV4XSB8fCAwKSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU3Ryb2tlc1xuICAgIGlmICgnc3Ryb2tlcycgaW4gbm9kZSAmJiBub2RlLnN0cm9rZXMgJiYgQXJyYXkuaXNBcnJheShub2RlLnN0cm9rZXMpKSB7XG4gICAgICBmb3IgKGNvbnN0IHN0cm9rZSBvZiBub2RlLnN0cm9rZXMpIHtcbiAgICAgICAgaWYgKHN0cm9rZS50eXBlID09PSAnU09MSUQnICYmIHN0cm9rZS52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgIGNvbnN0IGhleCA9IHJnYlRvSGV4KHN0cm9rZS5jb2xvcik7XG4gICAgICAgICAgY29sb3JzW2hleF0gPSAoY29sb3JzW2hleF0gfHwgMCkgKyAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlY3Vyc2VcbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2Fsayhyb290KTtcbiAgcmV0dXJuIGNvbG9ycztcbn1cbiIsICIvKipcbiAqIEV4dHJhY3QgRmlnbWEgRWZmZWN0cyAoc2hhZG93cywgYmx1cnMpIGludG8gQ1NTLXJlYWR5IHZhbHVlcy5cbiAqXG4gKiBGaWdtYSBzdXBwb3J0cyBhbiBhcnJheSBvZiBlZmZlY3RzIHBlciBub2RlLiBXZSBtYXA6XG4gKiAgIERST1BfU0hBRE9XICBcdTIxOTIgYm94LXNoYWRvdyAobXVsdGlwbGUgYWxsb3dlZCwgY29tbWEtc2VwYXJhdGVkKVxuICogICBJTk5FUl9TSEFET1cgXHUyMTkyIGJveC1zaGFkb3cgd2l0aCBgaW5zZXRgIGtleXdvcmRcbiAqICAgTEFZRVJfQkxVUiAgIFx1MjE5MiBmaWx0ZXI6IGJsdXIoTnB4KVxuICogICBCQUNLR1JPVU5EX0JMVVIgXHUyMTkyIGJhY2tkcm9wLWZpbHRlcjogYmx1cihOcHgpXG4gKlxuICogVEVYVCBub2RlcyBnZXQgdGhlaXIgRFJPUF9TSEFET1cgbWFwcGVkIHRvIENTUyB0ZXh0LXNoYWRvdyBpbnN0ZWFkIG9mXG4gKiBib3gtc2hhZG93IChET00gcmVuZGVyaW5nOiB0ZXh0IG5vZGVzIGRvbid0IGhvbm9yIGJveC1zaGFkb3cgb24gdGhlXG4gKiBnbHlwaHMgdGhlbXNlbHZlcykuXG4gKi9cblxuZnVuY3Rpb24gcmdiYVN0cmluZyhjb2xvcjogeyByOiBudW1iZXI7IGc6IG51bWJlcjsgYjogbnVtYmVyOyBhPzogbnVtYmVyIH0pOiBzdHJpbmcge1xuICBjb25zdCBhID0gY29sb3IuYSAhPT0gdW5kZWZpbmVkID8gTWF0aC5yb3VuZChjb2xvci5hICogMTAwKSAvIDEwMCA6IDE7XG4gIHJldHVybiBgcmdiYSgke01hdGgucm91bmQoY29sb3IuciAqIDI1NSl9LCAke01hdGgucm91bmQoY29sb3IuZyAqIDI1NSl9LCAke01hdGgucm91bmQoY29sb3IuYiAqIDI1NSl9LCAke2F9KWA7XG59XG5cbmZ1bmN0aW9uIHNoYWRvd1RvQ3NzKGU6IERyb3BTaGFkb3dFZmZlY3QgfCBJbm5lclNoYWRvd0VmZmVjdCwgaW5zZXQ6IGJvb2xlYW4pOiBzdHJpbmcge1xuICBjb25zdCB4ID0gTWF0aC5yb3VuZChlLm9mZnNldC54KTtcbiAgY29uc3QgeSA9IE1hdGgucm91bmQoZS5vZmZzZXQueSk7XG4gIGNvbnN0IGJsdXIgPSBNYXRoLnJvdW5kKGUucmFkaXVzKTtcbiAgY29uc3Qgc3ByZWFkID0gTWF0aC5yb3VuZCgoZSBhcyBhbnkpLnNwcmVhZCB8fCAwKTtcbiAgY29uc3QgY29sb3IgPSByZ2JhU3RyaW5nKGUuY29sb3IpO1xuICBjb25zdCBwcmVmaXggPSBpbnNldCA/ICdpbnNldCAnIDogJyc7XG4gIHJldHVybiBgJHtwcmVmaXh9JHt4fXB4ICR7eX1weCAke2JsdXJ9cHggJHtzcHJlYWR9cHggJHtjb2xvcn1gO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV4dHJhY3RlZEVmZmVjdHMge1xuICBib3hTaGFkb3c6IHN0cmluZyB8IG51bGw7ICAgICAvLyBjb21tYS1zZXBhcmF0ZWQgQ1NTIHZhbHVlIGZvciBtdWx0aXBsZSBzaGFkb3dzXG4gIHRleHRTaGFkb3c6IHN0cmluZyB8IG51bGw7ICAgIC8vIGZvciBURVhUIG5vZGVzIChEUk9QX1NIQURPVyBvbiB0ZXh0IGJlY29tZXMgdGV4dC1zaGFkb3cpXG4gIGZpbHRlcjogc3RyaW5nIHwgbnVsbDsgICAgICAgIC8vIExBWUVSX0JMVVIgXHUyMTkyIGJsdXIoTnB4KSwgZXh0ZW5kYWJsZVxuICBiYWNrZHJvcEZpbHRlcjogc3RyaW5nIHwgbnVsbDsgLy8gQkFDS0dST1VORF9CTFVSIFx1MjE5MiBibHVyKE5weClcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGFsbCBlZmZlY3RzIGZyb20gYSBub2RlIGFuZCByZXR1cm4gQ1NTLXJlYWR5IHZhbHVlcy5cbiAqIFJlc3BlY3RzIEZpZ21hJ3MgdmlzaWJsZSBmbGFnOyBza2lwcyBoaWRkZW4gZWZmZWN0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RFZmZlY3RzKFxuICBub2RlOiB7IGVmZmVjdHM/OiByZWFkb25seSBFZmZlY3RbXTsgdHlwZT86IHN0cmluZyB9LFxuKTogRXh0cmFjdGVkRWZmZWN0cyB7XG4gIGNvbnN0IHJlc3VsdDogRXh0cmFjdGVkRWZmZWN0cyA9IHtcbiAgICBib3hTaGFkb3c6IG51bGwsXG4gICAgdGV4dFNoYWRvdzogbnVsbCxcbiAgICBmaWx0ZXI6IG51bGwsXG4gICAgYmFja2Ryb3BGaWx0ZXI6IG51bGwsXG4gIH07XG5cbiAgaWYgKCFub2RlLmVmZmVjdHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5lZmZlY3RzKSB8fCBub2RlLmVmZmVjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGNvbnN0IGlzVGV4dCA9IG5vZGUudHlwZSA9PT0gJ1RFWFQnO1xuICBjb25zdCBzaGFkb3dTdHJpbmdzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB0ZXh0U2hhZG93U3RyaW5nczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZmlsdGVyUGFydHM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGJhY2tkcm9wUGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCBlZmZlY3Qgb2Ygbm9kZS5lZmZlY3RzKSB7XG4gICAgaWYgKGVmZmVjdC52aXNpYmxlID09PSBmYWxzZSkgY29udGludWU7XG5cbiAgICBpZiAoZWZmZWN0LnR5cGUgPT09ICdEUk9QX1NIQURPVycpIHtcbiAgICAgIGNvbnN0IGUgPSBlZmZlY3QgYXMgRHJvcFNoYWRvd0VmZmVjdDtcbiAgICAgIGlmIChpc1RleHQpIHtcbiAgICAgICAgLy8gdGV4dC1zaGFkb3cgZm9ybWF0OiA8eD4gPHk+IDxibHVyPiA8Y29sb3I+IChubyBzcHJlYWQpXG4gICAgICAgIGNvbnN0IHggPSBNYXRoLnJvdW5kKGUub2Zmc2V0LngpO1xuICAgICAgICBjb25zdCB5ID0gTWF0aC5yb3VuZChlLm9mZnNldC55KTtcbiAgICAgICAgY29uc3QgYmx1ciA9IE1hdGgucm91bmQoZS5yYWRpdXMpO1xuICAgICAgICB0ZXh0U2hhZG93U3RyaW5ncy5wdXNoKGAke3h9cHggJHt5fXB4ICR7Ymx1cn1weCAke3JnYmFTdHJpbmcoZS5jb2xvcil9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaGFkb3dTdHJpbmdzLnB1c2goc2hhZG93VG9Dc3MoZSwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVmZmVjdC50eXBlID09PSAnSU5ORVJfU0hBRE9XJykge1xuICAgICAgY29uc3QgZSA9IGVmZmVjdCBhcyBJbm5lclNoYWRvd0VmZmVjdDtcbiAgICAgIC8vIElOTkVSX1NIQURPVyBvbiBURVhUIGlzbid0IGEgdGhpbmcgaW4gQ1NTIFx1MjAxNCBmYWxsIGJhY2sgdG8gZW1wdHkgZm9yIHRleHRcbiAgICAgIGlmICghaXNUZXh0KSBzaGFkb3dTdHJpbmdzLnB1c2goc2hhZG93VG9Dc3MoZSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSBpZiAoZWZmZWN0LnR5cGUgPT09ICdMQVlFUl9CTFVSJykge1xuICAgICAgY29uc3QgZSA9IGVmZmVjdCBhcyBCbHVyRWZmZWN0O1xuICAgICAgZmlsdGVyUGFydHMucHVzaChgYmx1cigke01hdGgucm91bmQoZS5yYWRpdXMpfXB4KWApO1xuICAgIH0gZWxzZSBpZiAoZWZmZWN0LnR5cGUgPT09ICdCQUNLR1JPVU5EX0JMVVInKSB7XG4gICAgICBjb25zdCBlID0gZWZmZWN0IGFzIEJsdXJFZmZlY3Q7XG4gICAgICBiYWNrZHJvcFBhcnRzLnB1c2goYGJsdXIoJHtNYXRoLnJvdW5kKGUucmFkaXVzKX1weClgKTtcbiAgICB9XG4gIH1cblxuICBpZiAoc2hhZG93U3RyaW5ncy5sZW5ndGggPiAwKSByZXN1bHQuYm94U2hhZG93ID0gc2hhZG93U3RyaW5ncy5qb2luKCcsICcpO1xuICBpZiAodGV4dFNoYWRvd1N0cmluZ3MubGVuZ3RoID4gMCkgcmVzdWx0LnRleHRTaGFkb3cgPSB0ZXh0U2hhZG93U3RyaW5ncy5qb2luKCcsICcpO1xuICBpZiAoZmlsdGVyUGFydHMubGVuZ3RoID4gMCkgcmVzdWx0LmZpbHRlciA9IGZpbHRlclBhcnRzLmpvaW4oJyAnKTtcbiAgaWYgKGJhY2tkcm9wUGFydHMubGVuZ3RoID4gMCkgcmVzdWx0LmJhY2tkcm9wRmlsdGVyID0gYmFja2Ryb3BQYXJ0cy5qb2luKCcgJyk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiIsICJpbXBvcnQgeyBFbGVtZW50U3R5bGVzLCBUZXh0U2VnbWVudCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgdG9Dc3NWYWx1ZSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgZXh0cmFjdFRleHRDb2xvciwgcmdiVG9IZXggfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IGV4dHJhY3RFZmZlY3RzIH0gZnJvbSAnLi9lZmZlY3RzJztcblxuLyoqXG4gKiBEZXJpdmUgQ1NTIGZvbnQtd2VpZ2h0IGZyb20gYSBGaWdtYSBmb250IHN0eWxlIG5hbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb250V2VpZ2h0RnJvbVN0eWxlKHN0eWxlOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBzID0gc3R5bGUudG9Mb3dlckNhc2UoKTtcbiAgaWYgKHMuaW5jbHVkZXMoJ3RoaW4nKSB8fCBzLmluY2x1ZGVzKCdoYWlybGluZScpKSByZXR1cm4gMTAwO1xuICBpZiAocy5pbmNsdWRlcygnZXh0cmFsaWdodCcpIHx8IHMuaW5jbHVkZXMoJ3VsdHJhIGxpZ2h0JykgfHwgcy5pbmNsdWRlcygnZXh0cmEgbGlnaHQnKSkgcmV0dXJuIDIwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ2xpZ2h0JykpIHJldHVybiAzMDA7XG4gIGlmIChzLmluY2x1ZGVzKCdtZWRpdW0nKSkgcmV0dXJuIDUwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ3NlbWlib2xkJykgfHwgcy5pbmNsdWRlcygnc2VtaSBib2xkJykgfHwgcy5pbmNsdWRlcygnZGVtaSBib2xkJykgfHwgcy5pbmNsdWRlcygnZGVtaWJvbGQnKSkgcmV0dXJuIDYwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ2V4dHJhYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ2V4dHJhIGJvbGQnKSB8fCBzLmluY2x1ZGVzKCd1bHRyYSBib2xkJykgfHwgcy5pbmNsdWRlcygndWx0cmFib2xkJykpIHJldHVybiA4MDA7XG4gIGlmIChzLmluY2x1ZGVzKCdibGFjaycpIHx8IHMuaW5jbHVkZXMoJ2hlYXZ5JykpIHJldHVybiA5MDA7XG4gIGlmIChzLmluY2x1ZGVzKCdib2xkJykpIHJldHVybiA3MDA7XG4gIHJldHVybiA0MDA7IC8vIFJlZ3VsYXIgLyBOb3JtYWwgLyBCb29rXG59XG5cbi8qKlxuICogTWFwIEZpZ21hIHRleHQgYWxpZ25tZW50IHRvIENTUyB0ZXh0LWFsaWduIHZhbHVlLlxuICovXG5mdW5jdGlvbiBtYXBUZXh0QWxpZ24oYWxpZ246IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBzd2l0Y2ggKGFsaWduKSB7XG4gICAgY2FzZSAnTEVGVCc6IHJldHVybiAnbGVmdCc7XG4gICAgY2FzZSAnQ0VOVEVSJzogcmV0dXJuICdjZW50ZXInO1xuICAgIGNhc2UgJ1JJR0hUJzogcmV0dXJuICdyaWdodCc7XG4gICAgY2FzZSAnSlVTVElGSUVEJzogcmV0dXJuICdqdXN0aWZ5JztcbiAgICBkZWZhdWx0OiByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIE1hcCBGaWdtYSB0ZXh0IGNhc2UgdG8gQ1NTIHRleHQtdHJhbnNmb3JtIHZhbHVlLlxuICovXG5mdW5jdGlvbiBtYXBUZXh0Q2FzZSh0ZXh0Q2FzZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIHN3aXRjaCAodGV4dENhc2UpIHtcbiAgICBjYXNlICdVUFBFUic6IHJldHVybiAndXBwZXJjYXNlJztcbiAgICBjYXNlICdMT1dFUic6IHJldHVybiAnbG93ZXJjYXNlJztcbiAgICBjYXNlICdUSVRMRSc6IHJldHVybiAnY2FwaXRhbGl6ZSc7XG4gICAgY2FzZSAnT1JJR0lOQUwnOlxuICAgIGRlZmF1bHQ6IHJldHVybiAnbm9uZSc7XG4gIH1cbn1cblxuLyoqXG4gKiBFeHRyYWN0IHR5cG9ncmFwaHkgc3R5bGVzIGZyb20gYSBURVhUIG5vZGUuXG4gKiBSZXR1cm5zIENTUy1yZWFkeSB2YWx1ZXMgd2l0aCB1bml0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUeXBvZ3JhcGh5KG5vZGU6IFRleHROb2RlKTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiB7XG4gIGNvbnN0IHN0eWxlczogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHt9O1xuXG4gIC8vIEZvbnQgZmFtaWx5IFx1MjAxNCBoYW5kbGUgbWl4ZWQgZm9udHMgKHVzZSBmaXJzdCBzZWdtZW50KVxuICBjb25zdCBmb250TmFtZSA9IG5vZGUuZm9udE5hbWU7XG4gIGlmIChmb250TmFtZSAhPT0gZmlnbWEubWl4ZWQgJiYgZm9udE5hbWUpIHtcbiAgICBzdHlsZXMuZm9udEZhbWlseSA9IGZvbnROYW1lLmZhbWlseTtcbiAgICBzdHlsZXMuZm9udFdlaWdodCA9IGZvbnRXZWlnaHRGcm9tU3R5bGUoZm9udE5hbWUuc3R5bGUpO1xuICB9XG5cbiAgLy8gRm9udCBzaXplXG4gIGNvbnN0IGZvbnRTaXplID0gbm9kZS5mb250U2l6ZTtcbiAgaWYgKGZvbnRTaXplICE9PSBmaWdtYS5taXhlZCAmJiB0eXBlb2YgZm9udFNpemUgPT09ICdudW1iZXInKSB7XG4gICAgc3R5bGVzLmZvbnRTaXplID0gdG9Dc3NWYWx1ZShmb250U2l6ZSk7XG4gIH1cblxuICAvLyBMaW5lIGhlaWdodFxuICBjb25zdCBsaCA9IG5vZGUubGluZUhlaWdodDtcbiAgaWYgKGxoICE9PSBmaWdtYS5taXhlZCAmJiBsaCkge1xuICAgIGlmIChsaC51bml0ID09PSAnUElYRUxTJykge1xuICAgICAgc3R5bGVzLmxpbmVIZWlnaHQgPSB0b0Nzc1ZhbHVlKGxoLnZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKGxoLnVuaXQgPT09ICdQRVJDRU5UJykge1xuICAgICAgc3R5bGVzLmxpbmVIZWlnaHQgPSBgJHtNYXRoLnJvdW5kKGxoLnZhbHVlKX0lYDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQVVUTyBcdTIwMTQgZGVyaXZlIGZyb20gZm9udCBzaXplXG4gICAgICBzdHlsZXMubGluZUhlaWdodCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLy8gTGV0dGVyIHNwYWNpbmdcbiAgY29uc3QgbHMgPSBub2RlLmxldHRlclNwYWNpbmc7XG4gIGlmIChscyAhPT0gZmlnbWEubWl4ZWQgJiYgbHMpIHtcbiAgICBpZiAobHMudW5pdCA9PT0gJ1BJWEVMUycpIHtcbiAgICAgIHN0eWxlcy5sZXR0ZXJTcGFjaW5nID0gdG9Dc3NWYWx1ZShscy52YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChscy51bml0ID09PSAnUEVSQ0VOVCcpIHtcbiAgICAgIC8vIENvbnZlcnQgcGVyY2VudGFnZSB0byBlbSAoRmlnbWEncyAxMDAlID0gMWVtKVxuICAgICAgY29uc3QgZW1WYWx1ZSA9IE1hdGgucm91bmQoKGxzLnZhbHVlIC8gMTAwKSAqIDEwMCkgLyAxMDA7XG4gICAgICBzdHlsZXMubGV0dGVyU3BhY2luZyA9IGAke2VtVmFsdWV9ZW1gO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRleHQgdHJhbnNmb3JtXG4gIGNvbnN0IHRleHRDYXNlID0gbm9kZS50ZXh0Q2FzZTtcbiAgaWYgKHRleHRDYXNlICE9PSBmaWdtYS5taXhlZCkge1xuICAgIHN0eWxlcy50ZXh0VHJhbnNmb3JtID0gbWFwVGV4dENhc2UodGV4dENhc2UgYXMgc3RyaW5nKTtcbiAgfVxuXG4gIC8vIFRleHQgYWxpZ25tZW50XG4gIGNvbnN0IHRleHRBbGlnbiA9IG5vZGUudGV4dEFsaWduSG9yaXpvbnRhbDtcbiAgaWYgKHRleHRBbGlnbikge1xuICAgIHN0eWxlcy50ZXh0QWxpZ24gPSBtYXBUZXh0QWxpZ24odGV4dEFsaWduKTtcbiAgfVxuXG4gIC8vIFRleHQgZGVjb3JhdGlvbiAodW5kZXJsaW5lIC8gbGluZS10aHJvdWdoIC8gbm9uZSlcbiAgY29uc3QgdGQgPSAobm9kZSBhcyBhbnkpLnRleHREZWNvcmF0aW9uO1xuICBpZiAodGQgIT09IHVuZGVmaW5lZCAmJiB0ZCAhPT0gZmlnbWEubWl4ZWQpIHtcbiAgICBpZiAodGQgPT09ICdVTkRFUkxJTkUnKSBzdHlsZXMudGV4dERlY29yYXRpb24gPSAndW5kZXJsaW5lJztcbiAgICBlbHNlIGlmICh0ZCA9PT0gJ1NUUklLRVRIUk9VR0gnKSBzdHlsZXMudGV4dERlY29yYXRpb24gPSAnbGluZS10aHJvdWdoJztcbiAgICBlbHNlIHN0eWxlcy50ZXh0RGVjb3JhdGlvbiA9IG51bGw7XG4gIH1cblxuICAvLyBDb2xvclxuICBzdHlsZXMuY29sb3IgPSBleHRyYWN0VGV4dENvbG9yKG5vZGUpO1xuXG4gIC8vIFRleHQtc2hhZG93IGZyb20gRFJPUF9TSEFET1cgZWZmZWN0cyBvbiBURVhUIG5vZGVzXG4gIGNvbnN0IGVmZmVjdHMgPSBleHRyYWN0RWZmZWN0cyhub2RlKTtcbiAgaWYgKGVmZmVjdHMudGV4dFNoYWRvdykgc3R5bGVzLnRleHRTaGFkb3cgPSBlZmZlY3RzLnRleHRTaGFkb3c7XG5cbiAgLy8gRmlnbWEgVGV4dCBTdHlsZSByZWZlcmVuY2UgKGRlc2lnbiB0b2tlbiBmb3IgdHlwb2dyYXBoeSlcbiAgY29uc3Qgc3R5bGVOYW1lID0gZXh0cmFjdFRleHRTdHlsZU5hbWUobm9kZSk7XG4gIGlmIChzdHlsZU5hbWUpIHN0eWxlcy50ZXh0U3R5bGVOYW1lID0gc3R5bGVOYW1lO1xuXG4gIC8vIFN0eWxlZCB0ZXh0IHNlZ21lbnRzIFx1MjAxNCBvbmx5IHdoZW4gdGhlIHRleHQgaGFzIG1peGVkIGlubGluZSBzdHlsZXNcbiAgY29uc3Qgc2VnbWVudHMgPSBleHRyYWN0VGV4dFNlZ21lbnRzKG5vZGUpO1xuICBpZiAoc2VnbWVudHMpIHN0eWxlcy50ZXh0U2VnbWVudHMgPSBzZWdtZW50cztcblxuICByZXR1cm4gc3R5bGVzO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIGJvdW5kIEZpZ21hIFRleHQgU3R5bGUgbmFtZSAoZS5nLiBcIkhlYWRpbmcvSDJcIikuXG4gKiBSZXR1cm5zIG51bGwgd2hlbiB0aGUgdGV4dCBub2RlIGhhcyBubyBzdHlsZSBiaW5kaW5nLCBvciB0aGUgYmluZGluZyBpcyBtaXhlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUZXh0U3R5bGVOYW1lKG5vZGU6IFRleHROb2RlKTogc3RyaW5nIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgY29uc3QgaWQgPSAobm9kZSBhcyBhbnkpLnRleHRTdHlsZUlkO1xuICAgIGlmICghaWQgfHwgaWQgPT09IGZpZ21hLm1peGVkIHx8IHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IHN0eWxlID0gZmlnbWEuZ2V0U3R5bGVCeUlkKGlkKTtcbiAgICByZXR1cm4gc3R5bGU/Lm5hbWUgfHwgbnVsbDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBFeHRyYWN0IHN0eWxlZCB0ZXh0IHNlZ21lbnRzIHNvIGlubGluZSBmb3JtYXR0aW5nIChib2xkIHdvcmQsIGNvbG9yZWQgc3BhbixcbiAqIHVuZGVybGluZWQgbGluayBpbnNpZGUgYSBwYXJhZ3JhcGgpIHN1cnZpdmVzIHRoZSBleHBvcnQuIFJldHVybnMgbnVsbCB3aGVuXG4gKiB0aGUgdGV4dCBoYXMgbm8gbWl4ZWQgc3R5bGVzIFx1MjAxNCBpbiB0aGF0IGNhc2UgdGhlIGVsZW1lbnQtbGV2ZWwgdHlwb2dyYXBoeVxuICogYWxyZWFkeSBkZXNjcmliZXMgdGhlIHdob2xlIHRleHQgdW5pZm9ybWx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFRleHRTZWdtZW50cyhub2RlOiBUZXh0Tm9kZSk6IFRleHRTZWdtZW50W10gfCBudWxsIHtcbiAgaWYgKCFub2RlLmNoYXJhY3RlcnMpIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IGdldFNlZ21lbnRzID0gKG5vZGUgYXMgYW55KS5nZXRTdHlsZWRUZXh0U2VnbWVudHM7XG4gICAgaWYgKHR5cGVvZiBnZXRTZWdtZW50cyAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgcmF3ID0gZ2V0U2VnbWVudHMuY2FsbChub2RlLCBbJ2ZvbnROYW1lJywgJ2ZvbnRTaXplJywgJ2ZpbGxzJywgJ3RleHREZWNvcmF0aW9uJ10pO1xuICAgIGlmICghcmF3IHx8ICFBcnJheS5pc0FycmF5KHJhdykgfHwgcmF3Lmxlbmd0aCA8PSAxKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IHNlZ21lbnRzOiBUZXh0U2VnbWVudFtdID0gcmF3Lm1hcCgoczogYW55KSA9PiB7XG4gICAgICBjb25zdCBzZWc6IFRleHRTZWdtZW50ID0geyB0ZXh0OiBzLmNoYXJhY3RlcnMgfHwgJycgfTtcbiAgICAgIGlmIChzLmZvbnROYW1lICYmIHR5cGVvZiBzLmZvbnROYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgICBzZWcuZm9udEZhbWlseSA9IHMuZm9udE5hbWUuZmFtaWx5O1xuICAgICAgICBzZWcuZm9udFdlaWdodCA9IGZvbnRXZWlnaHRGcm9tU3R5bGUocy5mb250TmFtZS5zdHlsZSk7XG4gICAgICAgIGlmIChzLmZvbnROYW1lLnN0eWxlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2l0YWxpYycpKSBzZWcuaXRhbGljID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2Ygcy5mb250U2l6ZSA9PT0gJ251bWJlcicpIHNlZy5mb250U2l6ZSA9IHMuZm9udFNpemU7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShzLmZpbGxzKSkge1xuICAgICAgICBmb3IgKGNvbnN0IGYgb2Ygcy5maWxscykge1xuICAgICAgICAgIGlmIChmLnR5cGUgPT09ICdTT0xJRCcgJiYgZi52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgc2VnLmNvbG9yID0gcmdiVG9IZXgoZi5jb2xvcik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzLnRleHREZWNvcmF0aW9uID09PSAnVU5ERVJMSU5FJykgc2VnLnRleHREZWNvcmF0aW9uID0gJ3VuZGVybGluZSc7XG4gICAgICBlbHNlIGlmIChzLnRleHREZWNvcmF0aW9uID09PSAnU1RSSUtFVEhST1VHSCcpIHNlZy50ZXh0RGVjb3JhdGlvbiA9ICdsaW5lLXRocm91Z2gnO1xuICAgICAgcmV0dXJuIHNlZztcbiAgICB9KTtcblxuICAgIC8vIElmIGV2ZXJ5IHNlZ21lbnQncyBzdHlsaW5nIGlzIGlkZW50aWNhbCwgdGhlIHNlZ21lbnRhdGlvbiBhZGRzIG5vdGhpbmcuXG4gICAgY29uc3QgZmlyc3QgPSBzZWdtZW50c1swXTtcbiAgICBjb25zdCBhbGxTYW1lID0gc2VnbWVudHMuZXZlcnkocyA9PlxuICAgICAgcy5mb250RmFtaWx5ID09PSBmaXJzdC5mb250RmFtaWx5ICYmXG4gICAgICBzLmZvbnRXZWlnaHQgPT09IGZpcnN0LmZvbnRXZWlnaHQgJiZcbiAgICAgIHMuZm9udFNpemUgPT09IGZpcnN0LmZvbnRTaXplICYmXG4gICAgICBzLmNvbG9yID09PSBmaXJzdC5jb2xvciAmJlxuICAgICAgcy5pdGFsaWMgPT09IGZpcnN0Lml0YWxpYyAmJlxuICAgICAgcy50ZXh0RGVjb3JhdGlvbiA9PT0gZmlyc3QudGV4dERlY29yYXRpb25cbiAgICApO1xuICAgIHJldHVybiBhbGxTYW1lID8gbnVsbCA6IHNlZ21lbnRzO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIENvbGxlY3QgYWxsIHVuaXF1ZSBmb250IHVzYWdlIGRhdGEgZnJvbSBhIG5vZGUgdHJlZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RGb250cyhyb290OiBTY2VuZU5vZGUpOiBSZWNvcmQ8c3RyaW5nLCB7IHN0eWxlczogU2V0PHN0cmluZz47IHNpemVzOiBTZXQ8bnVtYmVyPjsgY291bnQ6IG51bWJlciB9PiB7XG4gIGNvbnN0IGZvbnRzOiBSZWNvcmQ8c3RyaW5nLCB7IHN0eWxlczogU2V0PHN0cmluZz47IHNpemVzOiBTZXQ8bnVtYmVyPjsgY291bnQ6IG51bWJlciB9PiA9IHt9O1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCBmb250TmFtZSA9IG5vZGUuZm9udE5hbWU7XG4gICAgICBpZiAoZm9udE5hbWUgIT09IGZpZ21hLm1peGVkICYmIGZvbnROYW1lKSB7XG4gICAgICAgIGNvbnN0IGZhbWlseSA9IGZvbnROYW1lLmZhbWlseTtcbiAgICAgICAgaWYgKCFmb250c1tmYW1pbHldKSB7XG4gICAgICAgICAgZm9udHNbZmFtaWx5XSA9IHsgc3R5bGVzOiBuZXcgU2V0KCksIHNpemVzOiBuZXcgU2V0KCksIGNvdW50OiAwIH07XG4gICAgICAgIH1cbiAgICAgICAgZm9udHNbZmFtaWx5XS5zdHlsZXMuYWRkKGZvbnROYW1lLnN0eWxlKTtcbiAgICAgICAgZm9udHNbZmFtaWx5XS5jb3VudCsrO1xuXG4gICAgICAgIGNvbnN0IGZvbnRTaXplID0gbm9kZS5mb250U2l6ZTtcbiAgICAgICAgaWYgKGZvbnRTaXplICE9PSBmaWdtYS5taXhlZCAmJiB0eXBlb2YgZm9udFNpemUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgZm9udHNbZmFtaWx5XS5zaXplcy5hZGQoZm9udFNpemUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3YWxrKHJvb3QpO1xuICByZXR1cm4gZm9udHM7XG59XG5cbi8qKlxuICogQ291bnQgVEVYVCBub2RlcyBpbiBhIHN1YnRyZWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb3VudFRleHROb2Rlcyhyb290OiBTY2VuZU5vZGUpOiBudW1iZXIge1xuICBsZXQgY291bnQgPSAwO1xuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykgY291bnQrKztcbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdhbGsocm9vdCk7XG4gIHJldHVybiBjb3VudDtcbn1cbiIsICJpbXBvcnQgeyBTZWN0aW9uU3R5bGVzIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyB0b0Nzc1ZhbHVlIH0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogRXh0cmFjdCBzcGFjaW5nIGZyb20gYW4gYXV0by1sYXlvdXQgZnJhbWUuXG4gKiBUaGVzZSB2YWx1ZXMgbWFwIDE6MSB0byBDU1MgXHUyMDE0IGhpZ2ggY29uZmlkZW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RBdXRvTGF5b3V0U3BhY2luZyhub2RlOiBGcmFtZU5vZGUpOiB7XG4gIHNwYWNpbmdTb3VyY2U6ICdhdXRvLWxheW91dCc7XG4gIHNlY3Rpb25TdHlsZXM6IFBhcnRpYWw8U2VjdGlvblN0eWxlcz47XG4gIGl0ZW1TcGFjaW5nOiBzdHJpbmcgfCBudWxsO1xufSB7XG4gIHJldHVybiB7XG4gICAgc3BhY2luZ1NvdXJjZTogJ2F1dG8tbGF5b3V0JyxcbiAgICBzZWN0aW9uU3R5bGVzOiB7XG4gICAgICBwYWRkaW5nVG9wOiB0b0Nzc1ZhbHVlKG5vZGUucGFkZGluZ1RvcCksXG4gICAgICBwYWRkaW5nQm90dG9tOiB0b0Nzc1ZhbHVlKG5vZGUucGFkZGluZ0JvdHRvbSksXG4gICAgICBwYWRkaW5nTGVmdDogdG9Dc3NWYWx1ZShub2RlLnBhZGRpbmdMZWZ0KSxcbiAgICAgIHBhZGRpbmdSaWdodDogdG9Dc3NWYWx1ZShub2RlLnBhZGRpbmdSaWdodCksXG4gICAgfSxcbiAgICBpdGVtU3BhY2luZzogdG9Dc3NWYWx1ZShub2RlLml0ZW1TcGFjaW5nKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHNwYWNpbmcgZnJvbSBhbiBhYnNvbHV0ZWx5LXBvc2l0aW9uZWQgZnJhbWUgYnkgY29tcHV0aW5nXG4gKiBmcm9tIGNoaWxkcmVuJ3MgYm91bmRpbmcgYm94ZXMuIFRoZXNlIHZhbHVlcyBhcmUgYXBwcm94aW1hdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0QWJzb2x1dGVTcGFjaW5nKG5vZGU6IEZyYW1lTm9kZSk6IHtcbiAgc3BhY2luZ1NvdXJjZTogJ2Fic29sdXRlLWNvb3JkaW5hdGVzJztcbiAgc2VjdGlvblN0eWxlczogUGFydGlhbDxTZWN0aW9uU3R5bGVzPjtcbiAgaXRlbVNwYWNpbmc6IHN0cmluZyB8IG51bGw7XG59IHtcbiAgY29uc3QgcGFyZW50Qm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICBpZiAoIXBhcmVudEJvdW5kcykge1xuICAgIHJldHVybiB7XG4gICAgICBzcGFjaW5nU291cmNlOiAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnLFxuICAgICAgc2VjdGlvblN0eWxlczoge1xuICAgICAgICBwYWRkaW5nVG9wOiBudWxsLFxuICAgICAgICBwYWRkaW5nQm90dG9tOiBudWxsLFxuICAgICAgICBwYWRkaW5nTGVmdDogbnVsbCxcbiAgICAgICAgcGFkZGluZ1JpZ2h0OiBudWxsLFxuICAgICAgfSxcbiAgICAgIGl0ZW1TcGFjaW5nOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW5cbiAgICAuZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSAmJiBjLmFic29sdXRlQm91bmRpbmdCb3gpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueSk7XG5cbiAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBzcGFjaW5nU291cmNlOiAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnLFxuICAgICAgc2VjdGlvblN0eWxlczoge1xuICAgICAgICBwYWRkaW5nVG9wOiBudWxsLFxuICAgICAgICBwYWRkaW5nQm90dG9tOiBudWxsLFxuICAgICAgICBwYWRkaW5nTGVmdDogbnVsbCxcbiAgICAgICAgcGFkZGluZ1JpZ2h0OiBudWxsLFxuICAgICAgfSxcbiAgICAgIGl0ZW1TcGFjaW5nOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBmaXJzdENoaWxkID0gY2hpbGRyZW5bMF0uYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gIGNvbnN0IGxhc3RDaGlsZCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdLmFic29sdXRlQm91bmRpbmdCb3ghO1xuXG4gIGNvbnN0IHBhZGRpbmdUb3AgPSBmaXJzdENoaWxkLnkgLSBwYXJlbnRCb3VuZHMueTtcbiAgY29uc3QgcGFkZGluZ0JvdHRvbSA9IChwYXJlbnRCb3VuZHMueSArIHBhcmVudEJvdW5kcy5oZWlnaHQpIC0gKGxhc3RDaGlsZC55ICsgbGFzdENoaWxkLmhlaWdodCk7XG5cbiAgLy8gQ29tcHV0ZSBsZWZ0IHBhZGRpbmcgZnJvbSB0aGUgbGVmdG1vc3QgY2hpbGRcbiAgY29uc3QgbGVmdE1vc3QgPSBNYXRoLm1pbiguLi5jaGlsZHJlbi5tYXAoYyA9PiBjLmFic29sdXRlQm91bmRpbmdCb3ghLngpKTtcbiAgY29uc3QgcGFkZGluZ0xlZnQgPSBsZWZ0TW9zdCAtIHBhcmVudEJvdW5kcy54O1xuXG4gIC8vIENvbXB1dGUgcmlnaHQgcGFkZGluZyBmcm9tIHRoZSByaWdodG1vc3QgY2hpbGRcbiAgY29uc3QgcmlnaHRNb3N0ID0gTWF0aC5tYXgoLi4uY2hpbGRyZW4ubWFwKGMgPT4gYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS54ICsgYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS53aWR0aCkpO1xuICBjb25zdCBwYWRkaW5nUmlnaHQgPSAocGFyZW50Qm91bmRzLnggKyBwYXJlbnRCb3VuZHMud2lkdGgpIC0gcmlnaHRNb3N0O1xuXG4gIC8vIEVzdGltYXRlIHZlcnRpY2FsIGdhcCBmcm9tIGNvbnNlY3V0aXZlIGNoaWxkcmVuXG4gIGxldCB0b3RhbEdhcCA9IDA7XG4gIGxldCBnYXBDb3VudCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgY29uc3QgY3VyckJvdHRvbSA9IGNoaWxkcmVuW2ldLmFic29sdXRlQm91bmRpbmdCb3ghLnkgKyBjaGlsZHJlbltpXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS5oZWlnaHQ7XG4gICAgY29uc3QgbmV4dFRvcCA9IGNoaWxkcmVuW2kgKyAxXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55O1xuICAgIGNvbnN0IGdhcCA9IG5leHRUb3AgLSBjdXJyQm90dG9tO1xuICAgIGlmIChnYXAgPiAwKSB7XG4gICAgICB0b3RhbEdhcCArPSBnYXA7XG4gICAgICBnYXBDb3VudCsrO1xuICAgIH1cbiAgfVxuICBjb25zdCBhdmdHYXAgPSBnYXBDb3VudCA+IDAgPyBNYXRoLnJvdW5kKHRvdGFsR2FwIC8gZ2FwQ291bnQpIDogMDtcblxuICByZXR1cm4ge1xuICAgIHNwYWNpbmdTb3VyY2U6ICdhYnNvbHV0ZS1jb29yZGluYXRlcycsXG4gICAgc2VjdGlvblN0eWxlczoge1xuICAgICAgcGFkZGluZ1RvcDogdG9Dc3NWYWx1ZShNYXRoLm1heCgwLCBNYXRoLnJvdW5kKHBhZGRpbmdUb3ApKSksXG4gICAgICBwYWRkaW5nQm90dG9tOiB0b0Nzc1ZhbHVlKE1hdGgubWF4KDAsIE1hdGgucm91bmQocGFkZGluZ0JvdHRvbSkpKSxcbiAgICAgIHBhZGRpbmdMZWZ0OiB0b0Nzc1ZhbHVlKE1hdGgubWF4KDAsIE1hdGgucm91bmQocGFkZGluZ0xlZnQpKSksXG4gICAgICBwYWRkaW5nUmlnaHQ6IHRvQ3NzVmFsdWUoTWF0aC5tYXgoMCwgTWF0aC5yb3VuZChwYWRkaW5nUmlnaHQpKSksXG4gICAgfSxcbiAgICBpdGVtU3BhY2luZzogYXZnR2FwID4gMCA/IHRvQ3NzVmFsdWUoYXZnR2FwKSA6IG51bGwsXG4gIH07XG59XG5cbi8qKlxuICogQ29sbGVjdCBhbGwgc3BhY2luZyB2YWx1ZXMgdXNlZCBpbiBhIG5vZGUgdHJlZS5cbiAqIFJldHVybnMgc29ydGVkIGFycmF5IG9mIHsgdmFsdWUsIGNvdW50IH0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0U3BhY2luZyhyb290OiBTY2VuZU5vZGUpOiB7IHZhbHVlOiBudW1iZXI7IGNvdW50OiBudW1iZXIgfVtdIHtcbiAgY29uc3Qgc3BhY2luZ01hcDogUmVjb3JkPG51bWJlciwgbnVtYmVyPiA9IHt9O1xuXG4gIGZ1bmN0aW9uIGFkZFZhbHVlKHY6IG51bWJlcikge1xuICAgIGlmICh2ID4gMCAmJiB2IDwgMTAwMCkge1xuICAgICAgY29uc3Qgcm91bmRlZCA9IE1hdGgucm91bmQodik7XG4gICAgICBzcGFjaW5nTWFwW3JvdW5kZWRdID0gKHNwYWNpbmdNYXBbcm91bmRlZF0gfHwgMCkgKyAxO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJykge1xuICAgICAgY29uc3QgZnJhbWUgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgIGlmIChmcmFtZS5sYXlvdXRNb2RlICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICBhZGRWYWx1ZShmcmFtZS5wYWRkaW5nVG9wKTtcbiAgICAgICAgYWRkVmFsdWUoZnJhbWUucGFkZGluZ0JvdHRvbSk7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLnBhZGRpbmdMZWZ0KTtcbiAgICAgICAgYWRkVmFsdWUoZnJhbWUucGFkZGluZ1JpZ2h0KTtcbiAgICAgICAgYWRkVmFsdWUoZnJhbWUuaXRlbVNwYWNpbmcpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2Fsayhyb290KTtcblxuICByZXR1cm4gT2JqZWN0LmVudHJpZXMoc3BhY2luZ01hcClcbiAgICAubWFwKChbdmFsdWUsIGNvdW50XSkgPT4gKHsgdmFsdWU6IE51bWJlcih2YWx1ZSksIGNvdW50IH0pKVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLnZhbHVlIC0gYi52YWx1ZSk7XG59XG4iLCAiaW1wb3J0IHsgR3JpZFNwZWMgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHRvQ3NzVmFsdWUgfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBEZXRlY3QgdGhlIGdyaWQvbGF5b3V0IHN0cnVjdHVyZSBvZiBhIGZyYW1lIGFuZCByZXR1cm4gYSBHcmlkU3BlYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdEdyaWQobm9kZTogRnJhbWVOb2RlKTogR3JpZFNwZWMge1xuICAvLyBBdXRvLWxheW91dCBmcmFtZSBcdTIxOTIgZmxleCBvciBncmlkXG4gIGlmIChub2RlLmxheW91dE1vZGUgJiYgbm9kZS5sYXlvdXRNb2RlICE9PSAnTk9ORScpIHtcbiAgICBjb25zdCBpc1dyYXBwaW5nID0gJ2xheW91dFdyYXAnIGluIG5vZGUgJiYgKG5vZGUgYXMgYW55KS5sYXlvdXRXcmFwID09PSAnV1JBUCc7XG5cbiAgICBpZiAoaXNXcmFwcGluZykge1xuICAgICAgLy8gV3JhcHBpbmcgYXV0by1sYXlvdXQgPSBmbGV4LXdyYXAgKGdyaWQtbGlrZSlcbiAgICAgIGNvbnN0IGNvbHVtbnMgPSBlc3RpbWF0ZUNvbHVtbnNGcm9tQ2hpbGRyZW4obm9kZSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYXlvdXRNb2RlOiAnZmxleCcsXG4gICAgICAgIGNvbHVtbnMsXG4gICAgICAgIGdhcDogdG9Dc3NWYWx1ZShub2RlLml0ZW1TcGFjaW5nKSxcbiAgICAgICAgcm93R2FwOiAnY291bnRlckF4aXNTcGFjaW5nJyBpbiBub2RlID8gdG9Dc3NWYWx1ZSgobm9kZSBhcyBhbnkpLmNvdW50ZXJBeGlzU3BhY2luZykgOiBudWxsLFxuICAgICAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgICAgIGl0ZW1NaW5XaWR0aDogZXN0aW1hdGVJdGVtTWluV2lkdGgobm9kZSwgY29sdW1ucyksXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIE5vbi13cmFwcGluZyBhdXRvLWxheW91dFxuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IG5vZGUubGF5b3V0TW9kZSA9PT0gJ0hPUklaT05UQUwnO1xuXG4gICAgaWYgKGlzSG9yaXpvbnRhbCkge1xuICAgICAgLy8gSG9yaXpvbnRhbCBsYXlvdXQgXHUyMDE0IGNoaWxkcmVuIGFyZSBjb2x1bW5zXG4gICAgICBjb25zdCBjb2x1bW5zID0gbm9kZS5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlKS5sZW5ndGg7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYXlvdXRNb2RlOiAnZmxleCcsXG4gICAgICAgIGNvbHVtbnMsXG4gICAgICAgIGdhcDogdG9Dc3NWYWx1ZShub2RlLml0ZW1TcGFjaW5nKSxcbiAgICAgICAgcm93R2FwOiBudWxsLFxuICAgICAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgICAgIGl0ZW1NaW5XaWR0aDogbnVsbCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gVmVydGljYWwgbGF5b3V0IFx1MjAxNCBzaW5nbGUgY29sdW1uLCBjaGlsZHJlbiBhcmUgcm93c1xuICAgIC8vIEJ1dCBjaGVjayBpZiBhbnkgZGlyZWN0IGNoaWxkIGlzIGEgaG9yaXpvbnRhbCBhdXRvLWxheW91dCAobmVzdGVkIGdyaWQpXG4gICAgY29uc3QgaG9yaXpvbnRhbENoaWxkID0gbm9kZS5jaGlsZHJlbi5maW5kKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScpICYmXG4gICAgICAoYyBhcyBGcmFtZU5vZGUpLmxheW91dE1vZGUgPT09ICdIT1JJWk9OVEFMJ1xuICAgICkgYXMgRnJhbWVOb2RlIHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKGhvcml6b250YWxDaGlsZCkge1xuICAgICAgY29uc3QgaW5uZXJDb2x1bW5zID0gaG9yaXpvbnRhbENoaWxkLmNoaWxkcmVuLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UpLmxlbmd0aDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxheW91dE1vZGU6ICdmbGV4JyxcbiAgICAgICAgY29sdW1uczogaW5uZXJDb2x1bW5zLFxuICAgICAgICBnYXA6IHRvQ3NzVmFsdWUoaG9yaXpvbnRhbENoaWxkLml0ZW1TcGFjaW5nKSxcbiAgICAgICAgcm93R2FwOiB0b0Nzc1ZhbHVlKG5vZGUuaXRlbVNwYWNpbmcpLFxuICAgICAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgICAgIGl0ZW1NaW5XaWR0aDogZXN0aW1hdGVJdGVtTWluV2lkdGgoaG9yaXpvbnRhbENoaWxkLCBpbm5lckNvbHVtbnMpLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbGF5b3V0TW9kZTogJ2ZsZXgnLFxuICAgICAgY29sdW1uczogMSxcbiAgICAgIGdhcDogdG9Dc3NWYWx1ZShub2RlLml0ZW1TcGFjaW5nKSxcbiAgICAgIHJvd0dhcDogbnVsbCxcbiAgICAgIGNvbHVtbkdhcDogbnVsbCxcbiAgICAgIGl0ZW1NaW5XaWR0aDogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgLy8gTm8gYXV0by1sYXlvdXQgXHUyMTkyIGFic29sdXRlIHBvc2l0aW9uaW5nXG4gIGNvbnN0IGNvbHVtbnMgPSBlc3RpbWF0ZUNvbHVtbnNGcm9tQWJzb2x1dGVDaGlsZHJlbihub2RlKTtcbiAgcmV0dXJuIHtcbiAgICBsYXlvdXRNb2RlOiAnYWJzb2x1dGUnLFxuICAgIGNvbHVtbnMsXG4gICAgZ2FwOiBlc3RpbWF0ZUdhcEZyb21BYnNvbHV0ZUNoaWxkcmVuKG5vZGUpLFxuICAgIHJvd0dhcDogbnVsbCxcbiAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgaXRlbU1pbldpZHRoOiBudWxsLFxuICB9O1xufVxuXG4vKipcbiAqIEVzdGltYXRlIGNvbHVtbiBjb3VudCBmcm9tIHdyYXBwaW5nIGF1dG8tbGF5b3V0IGNoaWxkcmVuLlxuICogQ291bnRzIGhvdyBtYW55IGNoaWxkcmVuIGZpdCBpbiB0aGUgZmlyc3QgXCJyb3dcIiAoc2ltaWxhciBZIHBvc2l0aW9uKS5cbiAqL1xuZnVuY3Rpb24gZXN0aW1hdGVDb2x1bW5zRnJvbUNoaWxkcmVuKG5vZGU6IEZyYW1lTm9kZSk6IG51bWJlciB7XG4gIGNvbnN0IHZpc2libGUgPSBub2RlLmNoaWxkcmVuLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UgJiYgYy5hYnNvbHV0ZUJvdW5kaW5nQm94KTtcbiAgaWYgKHZpc2libGUubGVuZ3RoIDw9IDEpIHJldHVybiAxO1xuXG4gIGNvbnN0IGZpcnN0WSA9IHZpc2libGVbMF0uYWJzb2x1dGVCb3VuZGluZ0JveCEueTtcbiAgY29uc3QgdG9sZXJhbmNlID0gNTsgLy8gcHhcbiAgbGV0IGNvbHVtbnNJbkZpcnN0Um93ID0gMDtcblxuICBmb3IgKGNvbnN0IGNoaWxkIG9mIHZpc2libGUpIHtcbiAgICBpZiAoTWF0aC5hYnMoY2hpbGQuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGZpcnN0WSkgPD0gdG9sZXJhbmNlKSB7XG4gICAgICBjb2x1bW5zSW5GaXJzdFJvdysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gTWF0aC5tYXgoMSwgY29sdW1uc0luRmlyc3RSb3cpO1xufVxuXG4vKipcbiAqIEVzdGltYXRlIGNvbHVtbiBjb3VudCBmcm9tIGFic29sdXRlbHktcG9zaXRpb25lZCBjaGlsZHJlbi5cbiAqIEdyb3VwcyBjaGlsZHJlbiBieSBZIHBvc2l0aW9uIChzYW1lIHJvdyA9IHNhbWUgWSBcdTAwQjEgdG9sZXJhbmNlKS5cbiAqL1xuZnVuY3Rpb24gZXN0aW1hdGVDb2x1bW5zRnJvbUFic29sdXRlQ2hpbGRyZW4obm9kZTogRnJhbWVOb2RlKTogbnVtYmVyIHtcbiAgY29uc3QgdmlzaWJsZSA9IG5vZGUuY2hpbGRyZW5cbiAgICAuZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSAmJiBjLmFic29sdXRlQm91bmRpbmdCb3gpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueSk7XG5cbiAgaWYgKHZpc2libGUubGVuZ3RoIDw9IDEpIHJldHVybiAxO1xuXG4gIGNvbnN0IGZpcnN0WSA9IHZpc2libGVbMF0uYWJzb2x1dGVCb3VuZGluZ0JveCEueTtcbiAgY29uc3QgdG9sZXJhbmNlID0gMTA7XG4gIGxldCBjb3VudCA9IDA7XG5cbiAgZm9yIChjb25zdCBjaGlsZCBvZiB2aXNpYmxlKSB7XG4gICAgaWYgKE1hdGguYWJzKGNoaWxkLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBmaXJzdFkpIDw9IHRvbGVyYW5jZSkge1xuICAgICAgY291bnQrKztcbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE1hdGgubWF4KDEsIGNvdW50KTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBnYXAgYmV0d2VlbiBhYnNvbHV0ZWx5LXBvc2l0aW9uZWQgY2hpbGRyZW4gb24gdGhlIHNhbWUgcm93LlxuICovXG5mdW5jdGlvbiBlc3RpbWF0ZUdhcEZyb21BYnNvbHV0ZUNoaWxkcmVuKG5vZGU6IEZyYW1lTm9kZSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCB2aXNpYmxlID0gbm9kZS5jaGlsZHJlblxuICAgIC5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlICYmIGMuYWJzb2x1dGVCb3VuZGluZ0JveClcbiAgICAuc29ydCgoYSwgYikgPT4gYS5hYnNvbHV0ZUJvdW5kaW5nQm94IS54IC0gYi5hYnNvbHV0ZUJvdW5kaW5nQm94IS54KTtcblxuICBpZiAodmlzaWJsZS5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDtcblxuICAvLyBVc2UgdGhlIGZpcnN0IHJvdyBvZiBjaGlsZHJlblxuICBjb25zdCBmaXJzdFkgPSB2aXNpYmxlWzBdLmFic29sdXRlQm91bmRpbmdCb3ghLnk7XG4gIGNvbnN0IHRvbGVyYW5jZSA9IDEwO1xuICBjb25zdCBmaXJzdFJvdyA9IHZpc2libGUuZmlsdGVyKGMgPT5cbiAgICBNYXRoLmFicyhjLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBmaXJzdFkpIDw9IHRvbGVyYW5jZVxuICApO1xuXG4gIGlmIChmaXJzdFJvdy5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDtcblxuICBsZXQgdG90YWxHYXAgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpcnN0Um93Lmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGNvbnN0IHJpZ2h0RWRnZSA9IGZpcnN0Um93W2ldLmFic29sdXRlQm91bmRpbmdCb3ghLnggKyBmaXJzdFJvd1tpXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS53aWR0aDtcbiAgICBjb25zdCBuZXh0TGVmdCA9IGZpcnN0Um93W2kgKyAxXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS54O1xuICAgIHRvdGFsR2FwICs9IG5leHRMZWZ0IC0gcmlnaHRFZGdlO1xuICB9XG5cbiAgY29uc3QgYXZnR2FwID0gTWF0aC5yb3VuZCh0b3RhbEdhcCAvIChmaXJzdFJvdy5sZW5ndGggLSAxKSk7XG4gIHJldHVybiBhdmdHYXAgPiAwID8gdG9Dc3NWYWx1ZShhdmdHYXApIDogbnVsbDtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBtaW5pbXVtIGl0ZW0gd2lkdGggZnJvbSBhIGhvcml6b250YWwgbGF5b3V0J3MgY2hpbGRyZW4uXG4gKi9cbmZ1bmN0aW9uIGVzdGltYXRlSXRlbU1pbldpZHRoKG5vZGU6IEZyYW1lTm9kZSwgY29sdW1uczogbnVtYmVyKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmIChjb2x1bW5zIDw9IDEpIHJldHVybiBudWxsO1xuICBjb25zdCB2aXNpYmxlID0gbm9kZS5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlICYmIGMuYWJzb2x1dGVCb3VuZGluZ0JveCk7XG4gIGlmICh2aXNpYmxlLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3Qgd2lkdGhzID0gdmlzaWJsZS5tYXAoYyA9PiBjLmFic29sdXRlQm91bmRpbmdCb3ghLndpZHRoKTtcbiAgY29uc3QgbWluV2lkdGggPSBNYXRoLm1pbiguLi53aWR0aHMpO1xuICByZXR1cm4gdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKG1pbldpZHRoKSk7XG59XG4iLCAiaW1wb3J0IHsgSW50ZXJhY3Rpb25TcGVjIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyByZ2JUb0hleCwgZXh0cmFjdEJhY2tncm91bmRDb2xvciB9IGZyb20gJy4vY29sb3InO1xuaW1wb3J0IHsgdG9Dc3NWYWx1ZSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIE1hcCBGaWdtYSB0cmlnZ2VyIHR5cGUgdG8gb3VyIHNpbXBsaWZpZWQgdHJpZ2dlciBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIG1hcFRyaWdnZXIodHJpZ2dlclR5cGU6IHN0cmluZyk6IEludGVyYWN0aW9uU3BlY1sndHJpZ2dlciddIHwgbnVsbCB7XG4gIHN3aXRjaCAodHJpZ2dlclR5cGUpIHtcbiAgICBjYXNlICdPTl9IT1ZFUic6IHJldHVybiAnaG92ZXInO1xuICAgIGNhc2UgJ09OX0NMSUNLJzogcmV0dXJuICdjbGljayc7XG4gICAgY2FzZSAnT05fUFJFU1MnOiByZXR1cm4gJ3ByZXNzJztcbiAgICBjYXNlICdNT1VTRV9FTlRFUic6IHJldHVybiAnbW91c2UtZW50ZXInO1xuICAgIGNhc2UgJ01PVVNFX0xFQVZFJzogcmV0dXJuICdtb3VzZS1sZWF2ZSc7XG4gICAgZGVmYXVsdDogcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXAgRmlnbWEgZWFzaW5nIHR5cGUgdG8gQ1NTIHRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBtYXBFYXNpbmcoZWFzaW5nOiBhbnkpOiBzdHJpbmcge1xuICBpZiAoIWVhc2luZykgcmV0dXJuICdlYXNlJztcbiAgc3dpdGNoIChlYXNpbmcudHlwZSkge1xuICAgIGNhc2UgJ0VBU0VfSU4nOiByZXR1cm4gJ2Vhc2UtaW4nO1xuICAgIGNhc2UgJ0VBU0VfT1VUJzogcmV0dXJuICdlYXNlLW91dCc7XG4gICAgY2FzZSAnRUFTRV9JTl9BTkRfT1VUJzogcmV0dXJuICdlYXNlLWluLW91dCc7XG4gICAgY2FzZSAnTElORUFSJzogcmV0dXJuICdsaW5lYXInO1xuICAgIGNhc2UgJ0NVU1RPTV9DVUJJQ19CRVpJRVInOiB7XG4gICAgICBjb25zdCBiID0gZWFzaW5nLmVhc2luZ0Z1bmN0aW9uQ3ViaWNCZXppZXI7XG4gICAgICBpZiAoYikgcmV0dXJuIGBjdWJpYy1iZXppZXIoJHtiLngxfSwgJHtiLnkxfSwgJHtiLngyfSwgJHtiLnkyfSlgO1xuICAgICAgcmV0dXJuICdlYXNlJztcbiAgICB9XG4gICAgZGVmYXVsdDogcmV0dXJuICdlYXNlJztcbiAgfVxufVxuXG4vKipcbiAqIERpZmYgdGhlIHZpc3VhbCBwcm9wZXJ0aWVzIGJldHdlZW4gYSBzb3VyY2Ugbm9kZSBhbmQgYSBkZXN0aW5hdGlvbiBub2RlLlxuICogUmV0dXJucyBhIHJlY29yZCBvZiBDU1MgcHJvcGVydHkgY2hhbmdlcy5cbiAqL1xuZnVuY3Rpb24gZGlmZk5vZGVTdHlsZXMoXG4gIHNvdXJjZTogU2NlbmVOb2RlLFxuICBkZXN0OiBTY2VuZU5vZGVcbik6IFJlY29yZDxzdHJpbmcsIHsgZnJvbTogc3RyaW5nOyB0bzogc3RyaW5nIH0+IHtcbiAgY29uc3QgY2hhbmdlczogUmVjb3JkPHN0cmluZywgeyBmcm9tOiBzdHJpbmc7IHRvOiBzdHJpbmcgfT4gPSB7fTtcblxuICAvLyBCYWNrZ3JvdW5kIGNvbG9yXG4gIGNvbnN0IHNyY0JnID0gZXh0cmFjdEJhY2tncm91bmRDb2xvcihzb3VyY2UgYXMgYW55KTtcbiAgY29uc3QgZGVzdEJnID0gZXh0cmFjdEJhY2tncm91bmRDb2xvcihkZXN0IGFzIGFueSk7XG4gIGlmIChzcmNCZyAmJiBkZXN0QmcgJiYgc3JjQmcgIT09IGRlc3RCZykge1xuICAgIGNoYW5nZXMuYmFja2dyb3VuZENvbG9yID0geyBmcm9tOiBzcmNCZywgdG86IGRlc3RCZyB9O1xuICB9XG5cbiAgLy8gT3BhY2l0eVxuICBpZiAoJ29wYWNpdHknIGluIHNvdXJjZSAmJiAnb3BhY2l0eScgaW4gZGVzdCkge1xuICAgIGNvbnN0IHNyY09wID0gKHNvdXJjZSBhcyBhbnkpLm9wYWNpdHk7XG4gICAgY29uc3QgZGVzdE9wID0gKGRlc3QgYXMgYW55KS5vcGFjaXR5O1xuICAgIGlmIChzcmNPcCAhPT0gdW5kZWZpbmVkICYmIGRlc3RPcCAhPT0gdW5kZWZpbmVkICYmIE1hdGguYWJzKHNyY09wIC0gZGVzdE9wKSA+IDAuMDEpIHtcbiAgICAgIGNoYW5nZXMub3BhY2l0eSA9IHsgZnJvbTogU3RyaW5nKHNyY09wKSwgdG86IFN0cmluZyhkZXN0T3ApIH07XG4gICAgfVxuICB9XG5cbiAgLy8gU2l6ZSAodHJhbnNmb3JtOiBzY2FsZSlcbiAgaWYgKHNvdXJjZS5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmIGRlc3QuYWJzb2x1dGVCb3VuZGluZ0JveCkge1xuICAgIGNvbnN0IHNyY1cgPSBzb3VyY2UuYWJzb2x1dGVCb3VuZGluZ0JveC53aWR0aDtcbiAgICBjb25zdCBkZXN0VyA9IGRlc3QuYWJzb2x1dGVCb3VuZGluZ0JveC53aWR0aDtcbiAgICBpZiAoc3JjVyA+IDAgJiYgZGVzdFcgPiAwKSB7XG4gICAgICBjb25zdCBzY2FsZVggPSBNYXRoLnJvdW5kKChkZXN0VyAvIHNyY1cpICogMTAwKSAvIDEwMDtcbiAgICAgIGlmIChNYXRoLmFicyhzY2FsZVggLSAxKSA+IDAuMDEpIHtcbiAgICAgICAgY2hhbmdlcy50cmFuc2Zvcm0gPSB7IGZyb206ICdzY2FsZSgxKScsIHRvOiBgc2NhbGUoJHtzY2FsZVh9KWAgfTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBCb3JkZXIgcmFkaXVzXG4gIGlmICgnY29ybmVyUmFkaXVzJyBpbiBzb3VyY2UgJiYgJ2Nvcm5lclJhZGl1cycgaW4gZGVzdCkge1xuICAgIGNvbnN0IHNyY1IgPSAoc291cmNlIGFzIGFueSkuY29ybmVyUmFkaXVzO1xuICAgIGNvbnN0IGRlc3RSID0gKGRlc3QgYXMgYW55KS5jb3JuZXJSYWRpdXM7XG4gICAgaWYgKHR5cGVvZiBzcmNSID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgZGVzdFIgPT09ICdudW1iZXInICYmIHNyY1IgIT09IGRlc3RSKSB7XG4gICAgICBjaGFuZ2VzLmJvcmRlclJhZGl1cyA9IHsgZnJvbTogdG9Dc3NWYWx1ZShzcmNSKSEsIHRvOiB0b0Nzc1ZhbHVlKGRlc3RSKSEgfTtcbiAgICB9XG4gIH1cblxuICAvLyBCb3ggc2hhZG93IChlZmZlY3RzKVxuICBpZiAoJ2VmZmVjdHMnIGluIHNvdXJjZSAmJiAnZWZmZWN0cycgaW4gZGVzdCkge1xuICAgIGNvbnN0IHNyY1NoYWRvdyA9IGV4dHJhY3RCb3hTaGFkb3coc291cmNlIGFzIGFueSk7XG4gICAgY29uc3QgZGVzdFNoYWRvdyA9IGV4dHJhY3RCb3hTaGFkb3coZGVzdCBhcyBhbnkpO1xuICAgIGlmIChzcmNTaGFkb3cgIT09IGRlc3RTaGFkb3cpIHtcbiAgICAgIGNoYW5nZXMuYm94U2hhZG93ID0geyBmcm9tOiBzcmNTaGFkb3cgfHwgJ25vbmUnLCB0bzogZGVzdFNoYWRvdyB8fCAnbm9uZScgfTtcbiAgICB9XG4gIH1cblxuICAvLyBCb3JkZXIgY29sb3Ivd2lkdGggZnJvbSBzdHJva2VzXG4gIGlmICgnc3Ryb2tlcycgaW4gc291cmNlICYmICdzdHJva2VzJyBpbiBkZXN0KSB7XG4gICAgY29uc3Qgc3JjU3Ryb2tlID0gZXh0cmFjdFN0cm9rZUNvbG9yKHNvdXJjZSBhcyBhbnkpO1xuICAgIGNvbnN0IGRlc3RTdHJva2UgPSBleHRyYWN0U3Ryb2tlQ29sb3IoZGVzdCBhcyBhbnkpO1xuICAgIGlmIChzcmNTdHJva2UgJiYgZGVzdFN0cm9rZSAmJiBzcmNTdHJva2UgIT09IGRlc3RTdHJva2UpIHtcbiAgICAgIGNoYW5nZXMuYm9yZGVyQ29sb3IgPSB7IGZyb206IHNyY1N0cm9rZSwgdG86IGRlc3RTdHJva2UgfTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY2hhbmdlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGJveC1zaGFkb3cgQ1NTIHZhbHVlIGZyb20gbm9kZSBlZmZlY3RzLlxuICovXG5mdW5jdGlvbiBleHRyYWN0Qm94U2hhZG93KG5vZGU6IHsgZWZmZWN0cz86IHJlYWRvbmx5IEVmZmVjdFtdIH0pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFub2RlLmVmZmVjdHMpIHJldHVybiBudWxsO1xuICBmb3IgKGNvbnN0IGVmZmVjdCBvZiBub2RlLmVmZmVjdHMpIHtcbiAgICBpZiAoZWZmZWN0LnR5cGUgPT09ICdEUk9QX1NIQURPVycgJiYgZWZmZWN0LnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICBjb25zdCB7IG9mZnNldCwgcmFkaXVzLCBzcHJlYWQsIGNvbG9yIH0gPSBlZmZlY3QgYXMgRHJvcFNoYWRvd0VmZmVjdDtcbiAgICAgIGNvbnN0IGhleCA9IHJnYlRvSGV4KGNvbG9yKTtcbiAgICAgIGNvbnN0IGFscGhhID0gTWF0aC5yb3VuZCgoY29sb3IuYSB8fCAxKSAqIDEwMCkgLyAxMDA7XG4gICAgICByZXR1cm4gYCR7b2Zmc2V0Lnh9cHggJHtvZmZzZXQueX1weCAke3JhZGl1c31weCAke3NwcmVhZCB8fCAwfXB4IHJnYmEoJHtNYXRoLnJvdW5kKGNvbG9yLnIgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGNvbG9yLmcgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGNvbG9yLmIgKiAyNTUpfSwgJHthbHBoYX0pYDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBwcmltYXJ5IHN0cm9rZSBjb2xvciBmcm9tIGEgbm9kZS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFN0cm9rZUNvbG9yKG5vZGU6IHsgc3Ryb2tlcz86IHJlYWRvbmx5IFBhaW50W10gfSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIW5vZGUuc3Ryb2tlcykgcmV0dXJuIG51bGw7XG4gIGZvciAoY29uc3Qgc3Ryb2tlIG9mIG5vZGUuc3Ryb2tlcykge1xuICAgIGlmIChzdHJva2UudHlwZSA9PT0gJ1NPTElEJyAmJiBzdHJva2UudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiByZ2JUb0hleChzdHJva2UuY29sb3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGFsbCBwcm90b3R5cGUgaW50ZXJhY3Rpb25zIGZyb20gYSBzZWN0aW9uJ3Mgbm9kZSB0cmVlLlxuICogV2Fsa3MgYWxsIGRlc2NlbmRhbnRzLCBmaW5kcyBub2RlcyB3aXRoIHJlYWN0aW9ucywgYW5kIHByb2R1Y2VzIEludGVyYWN0aW9uU3BlY1tdLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEludGVyYWN0aW9ucyhzZWN0aW9uUm9vdDogU2NlbmVOb2RlKTogSW50ZXJhY3Rpb25TcGVjW10ge1xuICBjb25zdCBpbnRlcmFjdGlvbnM6IEludGVyYWN0aW9uU3BlY1tdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAoJ3JlYWN0aW9ucycgaW4gbm9kZSkge1xuICAgICAgY29uc3QgcmVhY3Rpb25zID0gKG5vZGUgYXMgYW55KS5yZWFjdGlvbnMgYXMgYW55W107XG4gICAgICBpZiAocmVhY3Rpb25zICYmIHJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgcmVhY3Rpb24gb2YgcmVhY3Rpb25zKSB7XG4gICAgICAgICAgY29uc3QgdHJpZ2dlciA9IG1hcFRyaWdnZXIocmVhY3Rpb24udHJpZ2dlcj8udHlwZSk7XG4gICAgICAgICAgaWYgKCF0cmlnZ2VyKSBjb250aW51ZTtcblxuICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IHJlYWN0aW9uLmFjdGlvbiB8fCAocmVhY3Rpb24uYWN0aW9ucyAmJiByZWFjdGlvbi5hY3Rpb25zWzBdKTtcbiAgICAgICAgICBpZiAoIWFjdGlvbikgY29udGludWU7XG5cbiAgICAgICAgICAvLyBHZXQgdHJhbnNpdGlvbiBkYXRhXG4gICAgICAgICAgY29uc3QgdHJhbnNpdGlvbiA9IGFjdGlvbi50cmFuc2l0aW9uO1xuICAgICAgICAgIGNvbnN0IGR1cmF0aW9uID0gdHJhbnNpdGlvbj8uZHVyYXRpb24gPyBgJHt0cmFuc2l0aW9uLmR1cmF0aW9ufXNgIDogJzAuM3MnO1xuICAgICAgICAgIGNvbnN0IGVhc2luZyA9IG1hcEVhc2luZyh0cmFuc2l0aW9uPy5lYXNpbmcpO1xuXG4gICAgICAgICAgLy8gRm9yIGhvdmVyL2NsaWNrIHdpdGggZGVzdGluYXRpb24gbm9kZSBcdTIwMTQgZGlmZiBzdHlsZXNcbiAgICAgICAgICBpZiAoYWN0aW9uLmRlc3RpbmF0aW9uSWQgJiYgKHRyaWdnZXIgPT09ICdob3ZlcicgfHwgdHJpZ2dlciA9PT0gJ21vdXNlLWVudGVyJyB8fCB0cmlnZ2VyID09PSAnY2xpY2snKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgZGVzdE5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChhY3Rpb24uZGVzdGluYXRpb25JZCk7XG4gICAgICAgICAgICAgIGlmIChkZXN0Tm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5Q2hhbmdlcyA9IGRpZmZOb2RlU3R5bGVzKG5vZGUsIGRlc3ROb2RlIGFzIFNjZW5lTm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHByb3BlcnR5Q2hhbmdlcykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50TmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBmaWdtYU5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcixcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogeyBkdXJhdGlvbiwgZWFzaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5Q2hhbmdlcyxcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIC8vIERlc3RpbmF0aW9uIG5vZGUgbm90IGFjY2Vzc2libGUgKGRpZmZlcmVudCBwYWdlLCBldGMuKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3YWxrKHNlY3Rpb25Sb290KTtcbiAgcmV0dXJuIGludGVyYWN0aW9ucztcbn1cbiIsICJpbXBvcnQgeyBGaWdtYVZhcmlhYmxlc0V4cG9ydCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgcmdiVG9IZXggfSBmcm9tICcuL2NvbG9yJztcblxuLyoqXG4gKiBFeHRyYWN0IEZpZ21hIFZhcmlhYmxlcyAoZGVzaWduIHRva2VucykgZnJvbSB0aGUgY3VycmVudCBmaWxlLlxuICpcbiAqIFdoZW4gYSBkZXNpZ25lciBoYXMgc2V0IHVwIEZpZ21hIFZhcmlhYmxlcyAoY29sb3JzLCBudW1iZXJzLCBzdHJpbmdzLFxuICogYm9vbGVhbnMpIHRoZSB2YXJpYWJsZSBuYW1lcyBBUkUgdGhlIGRlc2lnbiB0b2tlbnMgdGhlIGRldmVsb3BlciBzaG91bGRcbiAqIHVzZS4gV2UgZXhwb3J0IHRoZW0gZ3JvdXBlZCBieSBjb2xsZWN0aW9uIGFuZCBmbGF0IGJ5IGZ1bGwgbmFtZSBzb1xuICogYWdlbnRzIGNhbiBlbWl0IGAtLWNsci1wcmltYXJ5YCBpbnN0ZWFkIG9mIGAtLWNsci0xYzFjMWNgLlxuICpcbiAqIFJldHVybnMgYHsgcHJlc2VudDogZmFsc2UgfWAgd2hlbiB0aGUgRmlnbWEgVmFyaWFibGVzIEFQSSBpcyB1bmF2YWlsYWJsZVxuICogb3Igbm8gdmFyaWFibGVzIGV4aXN0LiBBZ2VudHMgZmFsbCBiYWNrIHRvIGF1dG8tZ2VuZXJhdGVkIG5hbWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFZhcmlhYmxlcygpOiBGaWdtYVZhcmlhYmxlc0V4cG9ydCB7XG4gIGNvbnN0IG91dDogRmlnbWFWYXJpYWJsZXNFeHBvcnQgPSB7XG4gICAgY29sbGVjdGlvbnM6IHt9LFxuICAgIGZsYXQ6IHt9LFxuICAgIHByZXNlbnQ6IGZhbHNlLFxuICB9O1xuXG4gIC8vIEZlYXR1cmUtZGV0ZWN0IFx1MjAxNCBvbGRlciBGaWdtYSBjbGllbnRzIGRvbid0IGhhdmUgdmFyaWFibGVzIEFQSVxuICBpZiAoIWZpZ21hLnZhcmlhYmxlcyB8fCB0eXBlb2YgZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGxldCBjb2xsZWN0aW9uc0J5SWQ6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgdHJ5IHtcbiAgICBjb25zdCBsb2NhbENvbGxlY3Rpb25zID0gZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVDb2xsZWN0aW9ucygpO1xuICAgIGZvciAoY29uc3QgY29sIG9mIGxvY2FsQ29sbGVjdGlvbnMpIHtcbiAgICAgIGNvbGxlY3Rpb25zQnlJZFtjb2wuaWRdID0gY29sO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGxldCB2YXJpYWJsZXM6IFZhcmlhYmxlW10gPSBbXTtcbiAgdHJ5IHtcbiAgICB2YXJpYWJsZXMgPSBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZXMoKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuICBpZiAoIXZhcmlhYmxlcyB8fCB2YXJpYWJsZXMubGVuZ3RoID09PSAwKSByZXR1cm4gb3V0O1xuXG4gIG91dC5wcmVzZW50ID0gdHJ1ZTtcblxuICBmb3IgKGNvbnN0IHYgb2YgdmFyaWFibGVzKSB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zQnlJZFt2LnZhcmlhYmxlQ29sbGVjdGlvbklkXTtcbiAgICBpZiAoIWNvbGxlY3Rpb24pIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgZGVmYXVsdE1vZGVJZCA9IGNvbGxlY3Rpb24uZGVmYXVsdE1vZGVJZDtcbiAgICBjb25zdCByYXcgPSB2LnZhbHVlc0J5TW9kZVtkZWZhdWx0TW9kZUlkXTtcbiAgICBpZiAocmF3ID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgbGV0IHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xuICAgIGlmICh2LnJlc29sdmVkVHlwZSA9PT0gJ0NPTE9SJykge1xuICAgICAgLy8gQ09MT1IgdmFsdWVzIGFyZSBSR0JBIG9iamVjdHM7IGNvbnZlcnQgdG8gaGV4XG4gICAgICBpZiAocmF3ICYmIHR5cGVvZiByYXcgPT09ICdvYmplY3QnICYmICdyJyBpbiByYXcpIHtcbiAgICAgICAgdmFsdWUgPSByZ2JUb0hleChyYXcgYXMgYW55KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodi5yZXNvbHZlZFR5cGUgPT09ICdGTE9BVCcpIHtcbiAgICAgIHZhbHVlID0gdHlwZW9mIHJhdyA9PT0gJ251bWJlcicgPyByYXcgOiBOdW1iZXIocmF3KTtcbiAgICB9IGVsc2UgaWYgKHYucmVzb2x2ZWRUeXBlID09PSAnU1RSSU5HJykge1xuICAgICAgdmFsdWUgPSB0eXBlb2YgcmF3ID09PSAnc3RyaW5nJyA/IHJhdyA6IFN0cmluZyhyYXcpO1xuICAgIH0gZWxzZSBpZiAodi5yZXNvbHZlZFR5cGUgPT09ICdCT09MRUFOJykge1xuICAgICAgdmFsdWUgPSBCb29sZWFuKHJhdyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gY29sbGVjdGlvbi5uYW1lIHx8ICdEZWZhdWx0JztcbiAgICBpZiAoIW91dC5jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV0pIG91dC5jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV0gPSB7fTtcbiAgICBvdXQuY29sbGVjdGlvbnNbY29sbGVjdGlvbk5hbWVdW3YubmFtZV0gPSB2YWx1ZTtcblxuICAgIC8vIEZsYXQga2V5OiBcIjxjb2xsZWN0aW9uPi88dmFyaWFibGUtbmFtZT5cIiBzbyBkdXBsaWNhdGVzIGFjcm9zcyBjb2xsZWN0aW9ucyBkb24ndCBjb2xsaWRlXG4gICAgY29uc3QgZmxhdEtleSA9IGAke2NvbGxlY3Rpb25OYW1lfS8ke3YubmFtZX1gO1xuICAgIG91dC5mbGF0W2ZsYXRLZXldID0gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIEZpZ21hIHZhcmlhYmxlIG5hbWUgdG8gYSBDU1MgY3VzdG9tIHByb3BlcnR5IG5hbWUuXG4gKiAgIFwiQ29sb3JzL1ByaW1hcnlcIiBcdTIxOTIgXCItLWNsci1wcmltYXJ5XCJcbiAqICAgXCJTcGFjaW5nL21kXCIgXHUyMTkyIFwiLS1zcGFjZS1tZFwiXG4gKiAgIFwiUmFkaXVzL2xnXCIgXHUyMTkyIFwiLS1yYWRpdXMtbGdcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9Dc3NDdXN0b21Qcm9wZXJ0eSh2YXJpYWJsZU5hbWU6IHN0cmluZywgY29sbGVjdGlvbk5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNvbCA9IGNvbGxlY3Rpb25OYW1lLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IG5hbWUgPSB2YXJpYWJsZU5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtejAtOV0rL2csICctJykucmVwbGFjZSgvLSsvZywgJy0nKS5yZXBsYWNlKC9eLXwtJC9nLCAnJyk7XG5cbiAgaWYgKGNvbC5pbmNsdWRlcygnY29sb3InKSB8fCBjb2wuaW5jbHVkZXMoJ2NvbG91cicpKSByZXR1cm4gYC0tY2xyLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdzcGFjJykpIHJldHVybiBgLS1zcGFjZS0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygncmFkaXVzJykpIHJldHVybiBgLS1yYWRpdXMtJHtuYW1lfWA7XG4gIGlmIChjb2wuaW5jbHVkZXMoJ2ZvbnQnKSAmJiBjb2wuaW5jbHVkZXMoJ3NpemUnKSkgcmV0dXJuIGAtLWZzLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdmb250JykgJiYgY29sLmluY2x1ZGVzKCd3ZWlnaHQnKSkgcmV0dXJuIGAtLWZ3LSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdmb250JykgfHwgY29sLmluY2x1ZGVzKCdmYW1pbHknKSkgcmV0dXJuIGAtLWZmLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdsaW5lJykpIHJldHVybiBgLS1saC0ke25hbWV9YDtcbiAgcmV0dXJuIGAtLSR7Y29sLnJlcGxhY2UoL1teYS16MC05XSsvZywgJy0nKX0tJHtuYW1lfWA7XG59XG4iLCAiaW1wb3J0IHtcbiAgQ29tcG9uZW50UGF0dGVybiwgUmVwZWF0ZXJJbmZvLCBSZXBlYXRlckl0ZW0sIE5hdmlnYXRpb25JbmZvLCBTZWN0aW9uVHlwZSxcbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBzbHVnaWZ5LCBpc0RlZmF1bHRMYXllck5hbWUgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGhhc0ltYWdlRmlsbCB9IGZyb20gJy4vY29sb3InO1xuXG4vKipcbiAqIENvbXB1dGUgYSBsb29zZSBcInN0cnVjdHVyZSBmaW5nZXJwcmludFwiIGZvciBhIG5vZGUuIFR3byBjaGlsZHJlbiB3aXRoIHRoZVxuICogc2FtZSBmaW5nZXJwcmludCBhcmUgdHJlYXRlZCBhcyBzaWJsaW5ncyBvZiB0aGUgc2FtZSByZXBlYXRlciB0ZW1wbGF0ZVxuICogKHNhbWUgY2FyZCBsYXlvdXQgcmVwZWF0ZWQgMyB0aW1lcywgZXRjLikuIFdlIGRlbGliZXJhdGVseSBpZ25vcmUgdGV4dFxuICogY29udGVudCBhbmQgc3BlY2lmaWMgc2l6ZXMgc28gbWlub3IgdmFyaWF0aW9ucyBzdGlsbCBtYXRjaC5cbiAqL1xuZnVuY3Rpb24gc3RydWN0dXJlRmluZ2VycHJpbnQobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyID0gMCk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtgVD0ke25vZGUudHlwZX1gXTtcbiAgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkpIHBhcnRzLnB1c2goJ0lNRycpO1xuXG4gIGlmICgnY2hpbGRyZW4nIGluIG5vZGUgJiYgZGVwdGggPCAyKSB7XG4gICAgY29uc3QgY2hpbGRGcHM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQudmlzaWJsZSA9PT0gZmFsc2UpIGNvbnRpbnVlO1xuICAgICAgY2hpbGRGcHMucHVzaChzdHJ1Y3R1cmVGaW5nZXJwcmludChjaGlsZCwgZGVwdGggKyAxKSk7XG4gICAgfVxuICAgIGNoaWxkRnBzLnNvcnQoKTtcbiAgICBwYXJ0cy5wdXNoKGBDPVske2NoaWxkRnBzLmpvaW4oJywnKX1dYCk7XG4gIH1cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJ3wnKTtcbn1cblxuY29uc3QgUkVQRUFURVJfTkFNRV9ISU5UUyA9IC9cXGIoY2FyZHM/fGl0ZW1zP3xsaXN0fGdyaWR8ZmVhdHVyZXM/fHNlcnZpY2VzP3x0ZWFtfGxvZ29zP3x0ZXN0aW1vbmlhbHM/fHByaWNpbmd8cGxhbnM/fGFydGljbGVzP3xwb3N0cz98YmxvZ3xmYXFzPylcXGIvaTtcblxuLyoqXG4gKiBEZXRlY3QgcmVwZWF0ZXIgZ3JvdXBzIGluc2lkZSBhIHNlY3Rpb24uIENvbnNlcnZhdGl2ZTpcbiAqICAgLSBcdTIyNjUzIGNoaWxkcmVuIHNoYXJlIGEgZmluZ2VycHJpbnQsIE9SXG4gKiAgIC0gXHUyMjY1MiBjaGlsZHJlbiBzaGFyZSBhIGZpbmdlcnByaW50IEFORCB0aGUgcGFyZW50IG5hbWUgaGludHMgcmVwZXRpdGlvblxuICogICAgIEFORCB0aGUgbWF0Y2hpbmcgZ3JvdXAgY292ZXJzIFx1MjI2NTYwJSBvZiB2aXNpYmxlIGNoaWxkcmVuLlxuICpcbiAqIFRoZSBleGlzdGluZyBgZWxlbWVudHNgIG1hcCBpcyB1bnRvdWNoZWQgXHUyMDE0IHJlcGVhdGVycyBhcmUgYW4gYWRkaXRpdmVcbiAqIHNpZ25hbCB0aGUgYWdlbnQgY2FuIG9wdCBpbnRvIGZvciBjbGVhbmVyIEFDRiBSZXBlYXRlciBvdXRwdXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RSZXBlYXRlcnMoc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSk6IFJlY29yZDxzdHJpbmcsIFJlcGVhdGVySW5mbz4ge1xuICBjb25zdCByZXBlYXRlcnM6IFJlY29yZDxzdHJpbmcsIFJlcGVhdGVySW5mbz4gPSB7fTtcbiAgY29uc3QgdXNlZEtleXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmdW5jdGlvbiBrZXlGb3IoY29udGFpbmVyTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBiYXNlID0gY29udGFpbmVyTmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKVxuICAgICAgfHwgYHJlcGVhdGVyXyR7T2JqZWN0LmtleXMocmVwZWF0ZXJzKS5sZW5ndGggKyAxfWA7XG4gICAgaWYgKCF1c2VkS2V5cy5oYXMoYmFzZSkpIHtcbiAgICAgIHVzZWRLZXlzLmFkZChiYXNlKTtcbiAgICAgIHJldHVybiBiYXNlO1xuICAgIH1cbiAgICBsZXQgaSA9IDI7XG4gICAgd2hpbGUgKHVzZWRLZXlzLmhhcyhgJHtiYXNlfV8ke2l9YCkpIGkrKztcbiAgICB1c2VkS2V5cy5hZGQoYCR7YmFzZX1fJHtpfWApO1xuICAgIHJldHVybiBgJHtiYXNlfV8ke2l9YDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKGRlcHRoID4gNSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghKCdjaGlsZHJlbicgaW4gbm9kZSkpIHJldHVybiBmYWxzZTtcblxuICAgIGNvbnN0IGtpZHMgPSAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UpO1xuICAgIGlmIChraWRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICBjb25zdCBncm91cHMgPSBuZXcgTWFwPHN0cmluZywgU2NlbmVOb2RlW10+KCk7XG4gICAgICBmb3IgKGNvbnN0IGsgb2Yga2lkcykge1xuICAgICAgICBjb25zdCBmcCA9IHN0cnVjdHVyZUZpbmdlcnByaW50KGspO1xuICAgICAgICBpZiAoIWdyb3Vwcy5oYXMoZnApKSBncm91cHMuc2V0KGZwLCBbXSk7XG4gICAgICAgIGdyb3Vwcy5nZXQoZnApIS5wdXNoKGspO1xuICAgICAgfVxuICAgICAgbGV0IGJlc3RHcm91cDogU2NlbmVOb2RlW10gfCBudWxsID0gbnVsbDtcbiAgICAgIGZvciAoY29uc3QgZyBvZiBncm91cHMudmFsdWVzKCkpIHtcbiAgICAgICAgaWYgKCFiZXN0R3JvdXAgfHwgZy5sZW5ndGggPiBiZXN0R3JvdXAubGVuZ3RoKSBiZXN0R3JvdXAgPSBnO1xuICAgICAgfVxuICAgICAgaWYgKGJlc3RHcm91cCAmJiBiZXN0R3JvdXAubGVuZ3RoID49IDIpIHtcbiAgICAgICAgY29uc3QgaXNCaWdHcm91cCA9IGJlc3RHcm91cC5sZW5ndGggPj0gMztcbiAgICAgICAgY29uc3QgaGludE1hdGNoID0gUkVQRUFURVJfTkFNRV9ISU5UUy50ZXN0KG5vZGUubmFtZSB8fCAnJyk7XG4gICAgICAgIGNvbnN0IGRvbWluYXRlcyA9IGJlc3RHcm91cC5sZW5ndGggPj0gTWF0aC5jZWlsKGtpZHMubGVuZ3RoICogMC42KTtcbiAgICAgICAgaWYgKGlzQmlnR3JvdXAgfHwgKGhpbnRNYXRjaCAmJiBkb21pbmF0ZXMpKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0ga2V5Rm9yKG5vZGUubmFtZSB8fCAncmVwZWF0ZXInKTtcbiAgICAgICAgICByZXBlYXRlcnNba2V5XSA9IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckxheWVyTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgaXRlbUNvdW50OiBiZXN0R3JvdXAubGVuZ3RoLFxuICAgICAgICAgICAgdGVtcGxhdGVMYXllck5hbWU6IGJlc3RHcm91cFswXS5uYW1lLFxuICAgICAgICAgICAgaXRlbXM6IGJlc3RHcm91cC5tYXAoZXh0cmFjdFJlcGVhdGVySXRlbSksXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gRG9uJ3QgcmVjdXJzZSBpbnRvIHJlcGVhdGVyIGNoaWxkcmVuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGMgb2Yga2lkcykgd2FsayhjLCBkZXB0aCArIDEpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICgnY2hpbGRyZW4nIGluIHNlY3Rpb25Ob2RlKSB7XG4gICAgZm9yIChjb25zdCBjIG9mIChzZWN0aW9uTm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoYy52aXNpYmxlICE9PSBmYWxzZSkgd2FsayhjLCAwKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcGVhdGVycztcbn1cblxuZnVuY3Rpb24gZXh0cmFjdFJlcGVhdGVySXRlbShub2RlOiBTY2VuZU5vZGUpOiBSZXBlYXRlckl0ZW0ge1xuICBjb25zdCBpdGVtOiBSZXBlYXRlckl0ZW0gPSB7IHRleHRzOiB7fSB9O1xuICBsZXQgdGV4dEluZGV4ID0gMDtcbiAgbGV0IGZpcnN0SW1hZ2VOYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgbGV0IGZpcnN0SW1hZ2VBbHQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHdhbGsobjogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG4udmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgIGlmIChuLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgdCA9IG4gYXMgVGV4dE5vZGU7XG4gICAgICBjb25zdCBjbGVhbiA9ICh0Lm5hbWUgfHwgJycpLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgY29uc3Qgcm9sZSA9IGNsZWFuICYmICEvXih0ZXh0fGZyYW1lfGdyb3VwfHJlY3RhbmdsZSlcXGQqJC8udGVzdChjbGVhbilcbiAgICAgICAgPyBjbGVhbiA6IGB0ZXh0XyR7dGV4dEluZGV4fWA7XG4gICAgICBpZiAodC5jaGFyYWN0ZXJzKSBpdGVtLnRleHRzW3JvbGVdID0gdC5jaGFyYWN0ZXJzO1xuICAgICAgdGV4dEluZGV4Kys7XG4gICAgfVxuXG4gICAgaWYgKCFmaXJzdEltYWdlTmFtZSAmJiBoYXNJbWFnZUZpbGwobiBhcyBhbnkpKSB7XG4gICAgICBmaXJzdEltYWdlTmFtZSA9IGAke3NsdWdpZnkobi5uYW1lIHx8ICdpbWFnZScpfS5wbmdgO1xuICAgICAgaWYgKG4ubmFtZSAmJiAhaXNEZWZhdWx0TGF5ZXJOYW1lKG4ubmFtZSkpIHtcbiAgICAgICAgZmlyc3RJbWFnZUFsdCA9IG4ubmFtZS5yZXBsYWNlKC9bLV9dL2csICcgJykucmVwbGFjZSgvXFxzKy9nLCAnICcpLnRyaW0oKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXGJcXHcvZywgYyA9PiBjLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghaXRlbS5saW5rVXJsICYmICdyZWFjdGlvbnMnIGluIG4pIHtcbiAgICAgIGNvbnN0IHJlYWN0aW9ucyA9IChuIGFzIGFueSkucmVhY3Rpb25zO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVhY3Rpb25zKSkge1xuICAgICAgICBvdXRlcjogZm9yIChjb25zdCByIG9mIHJlYWN0aW9ucykge1xuICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSByLmFjdGlvbnMgfHwgKHIuYWN0aW9uID8gW3IuYWN0aW9uXSA6IFtdKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGEgb2YgYWN0aW9ucykge1xuICAgICAgICAgICAgaWYgKGEgJiYgYS50eXBlID09PSAnVVJMJyAmJiBhLnVybCkgeyBpdGVtLmxpbmtVcmwgPSBhLnVybDsgYnJlYWsgb3V0ZXI7IH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgICBmb3IgKGNvbnN0IGMgb2YgKG4gYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikgd2FsayhjKTtcbiAgICB9XG4gIH1cbiAgd2Fsayhub2RlKTtcbiAgaWYgKGZpcnN0SW1hZ2VOYW1lKSBpdGVtLmltYWdlRmlsZSA9IGZpcnN0SW1hZ2VOYW1lO1xuICBpZiAoZmlyc3RJbWFnZUFsdCkgaXRlbS5hbHQgPSBmaXJzdEltYWdlQWx0O1xuICByZXR1cm4gaXRlbTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBDb21wb25lbnQgcGF0dGVybnM6IGNhcm91c2VsIC8gYWNjb3JkaW9uIC8gdGFicyAvIG1vZGFsXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgQ0FST1VTRUxfUlggPSAvXFxiKGNhcm91c2VsfHNsaWRlcnxzd2lwZXJ8Z2FsbGVyeXxzbGlkZXNob3cpXFxiL2k7XG5jb25zdCBBQ0NPUkRJT05fUlggPSAvXFxiKGFjY29yZGlvbnxmYXF8Y29sbGFwc2V8ZXhwYW5kZXJ8Y29sbGFwc2libGUpXFxiL2k7XG5jb25zdCBUQUJTX1JYID0gL1xcYnRhYnM/XFxiL2k7XG5jb25zdCBNT0RBTF9SWCA9IC9cXGIobW9kYWx8cG9wdXB8ZGlhbG9nfG92ZXJsYXl8bGlnaHRib3gpXFxiL2k7XG5cbi8qKlxuICogRGV0ZWN0IGludGVyYWN0aXZlIGNvbXBvbmVudCBwYXR0ZXJucy4gV2UgZmF2b3VyIGV4cGxpY2l0IGxheWVyLW5hbWVcbiAqIG1hdGNoZXMgb3ZlciBwdXJlIHN0cnVjdHVyYWwgZGV0ZWN0aW9uIHRvIGtlZXAgZmFsc2UgcG9zaXRpdmVzIGxvdy5cbiAqIFdoZW4gdGhlIG5hbWUgbWF0Y2hlcywgY29uZmlkZW5jZSBpcyAnaGlnaCc7IHdoZW4gaW5mZXJyZWQgc3RydWN0dXJhbGx5LFxuICogY29uZmlkZW5jZSBpcyAnbG93JyBhbmQgdGhlIGFnZW50IHNob3VsZCB2ZXJpZnkgYWdhaW5zdCB0aGUgc2NyZWVuc2hvdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENvbXBvbmVudFBhdHRlcm5zKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUpOiBDb21wb25lbnRQYXR0ZXJuW10ge1xuICBjb25zdCBwYXR0ZXJuczogQ29tcG9uZW50UGF0dGVybltdID0gW107XG4gIGNvbnN0IHNlZW5Ob2RlSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZnVuY3Rpb24gYWRkUGF0dGVybihwOiBDb21wb25lbnRQYXR0ZXJuKSB7XG4gICAgaWYgKHNlZW5Ob2RlSWRzLmhhcyhwLnJvb3ROb2RlSWQpKSByZXR1cm47XG4gICAgc2Vlbk5vZGVJZHMuYWRkKHAucm9vdE5vZGVJZCk7XG4gICAgcGF0dGVybnMucHVzaChwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgaWYgKGRlcHRoID4gNiB8fCBub2RlLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG4gICAgY29uc3QgbmFtZSA9IG5vZGUubmFtZSB8fCAnJztcblxuICAgIC8vIE1PREFMIFx1MjAxNCBuYW1lLW9ubHkgZGV0ZWN0aW9uIChzdHJ1Y3R1cmFsIGRldGVjdGlvbiBpcyB0b28gbm9pc3kpLlxuICAgIGlmIChNT0RBTF9SWC50ZXN0KG5hbWUpICYmICdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgYWRkUGF0dGVybih7XG4gICAgICAgIHR5cGU6ICdtb2RhbCcsXG4gICAgICAgIHJvb3ROb2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgIHJvb3ROb2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICBjb25maWRlbmNlOiAnaGlnaCcsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjsgLy8gZG9uJ3QgcmVjdXJzZSBpbnRvIG1vZGFsIGludGVybmFsc1xuICAgIH1cblxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBjb25zdCBraWRzID0gZnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSk7XG5cbiAgICAgIC8vIENBUk9VU0VMOiBleHBsaWNpdCBuYW1lIE9SIChob3Jpem9udGFsICsgY2xpcHNDb250ZW50ICsgXHUyMjY1MyBzaW1pbGFyIGNoaWxkcmVuKVxuICAgICAgY29uc3QgbmFtZUNhcm91c2VsID0gQ0FST1VTRUxfUlgudGVzdChuYW1lKTtcbiAgICAgIGNvbnN0IGhvcml6b250YWxDbGlwcGVkID0gZnJhbWUubGF5b3V0TW9kZSA9PT0gJ0hPUklaT05UQUwnICYmIGZyYW1lLmNsaXBzQ29udGVudCA9PT0gdHJ1ZTtcbiAgICAgIGlmIChuYW1lQ2Fyb3VzZWwgfHwgaG9yaXpvbnRhbENsaXBwZWQpIHtcbiAgICAgICAgaWYgKGtpZHMubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICBjb25zdCBmcDAgPSBzdHJ1Y3R1cmVGaW5nZXJwcmludChraWRzWzBdKTtcbiAgICAgICAgICBjb25zdCBtYXRjaGluZyA9IGtpZHMuZmlsdGVyKGsgPT4gc3RydWN0dXJlRmluZ2VycHJpbnQoaykgPT09IGZwMCkubGVuZ3RoO1xuICAgICAgICAgIGlmIChtYXRjaGluZyA+PSAzKSB7XG4gICAgICAgICAgICBhZGRQYXR0ZXJuKHtcbiAgICAgICAgICAgICAgdHlwZTogJ2Nhcm91c2VsJyxcbiAgICAgICAgICAgICAgcm9vdE5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICAgICAgcm9vdE5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgIGl0ZW1Db3VudDogbWF0Y2hpbmcsXG4gICAgICAgICAgICAgIGNvbmZpZGVuY2U6IG5hbWVDYXJvdXNlbCA/ICdoaWdoJyA6ICdsb3cnLFxuICAgICAgICAgICAgICBtZXRhOiB7XG4gICAgICAgICAgICAgICAgbGF5b3V0TW9kZTogZnJhbWUubGF5b3V0TW9kZSxcbiAgICAgICAgICAgICAgICBjbGlwc0NvbnRlbnQ6IGZyYW1lLmNsaXBzQ29udGVudCxcbiAgICAgICAgICAgICAgICBpdGVtU3BhY2luZzogZnJhbWUuaXRlbVNwYWNpbmcgPz8gbnVsbCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBQ0NPUkRJT046IG5hbWUgbWF0Y2ggKyBcdTIyNjUyIGNoaWxkIGl0ZW1zXG4gICAgICBpZiAoQUNDT1JESU9OX1JYLnRlc3QobmFtZSkgJiYga2lkcy5sZW5ndGggPj0gMikge1xuICAgICAgICBjb25zdCBpdGVtczogQXJyYXk8eyBxdWVzdGlvbjogc3RyaW5nOyBhbnN3ZXI/OiBzdHJpbmcgfT4gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBrIG9mIGtpZHMpIHtcbiAgICAgICAgICBjb25zdCBhbGwgPSBjb2xsZWN0QWxsVGV4dChrKTtcbiAgICAgICAgICBpZiAoYWxsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGl0ZW1zLnB1c2goeyBxdWVzdGlvbjogYWxsWzBdLCBhbnN3ZXI6IGFsbC5zbGljZSgxKS5qb2luKCcgJykgfHwgdW5kZWZpbmVkIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICBhZGRQYXR0ZXJuKHtcbiAgICAgICAgICAgIHR5cGU6ICdhY2NvcmRpb24nLFxuICAgICAgICAgICAgcm9vdE5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICAgIHJvb3ROb2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgaXRlbUNvdW50OiBpdGVtcy5sZW5ndGgsXG4gICAgICAgICAgICBjb25maWRlbmNlOiAnaGlnaCcsXG4gICAgICAgICAgICBtZXRhOiB7IGl0ZW1zIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRBQlM6IG5hbWUgbWF0Y2ggKyBcdTIyNjUyIGNoaWxkcmVuXG4gICAgICBpZiAoVEFCU19SWC50ZXN0KG5hbWUpICYmIGtpZHMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgYWRkUGF0dGVybih7XG4gICAgICAgICAgdHlwZTogJ3RhYnMnLFxuICAgICAgICAgIHJvb3ROb2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgcm9vdE5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgaXRlbUNvdW50OiBraWRzLmxlbmd0aCxcbiAgICAgICAgICBjb25maWRlbmNlOiAnaGlnaCcsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgYyBvZiBraWRzKSB3YWxrKGMsIGRlcHRoICsgMSk7XG4gICAgfVxuICB9XG5cbiAgd2FsayhzZWN0aW9uTm9kZSwgMCk7XG4gIHJldHVybiBwYXR0ZXJucztcbn1cblxuZnVuY3Rpb24gY29sbGVjdEFsbFRleHQobm9kZTogU2NlbmVOb2RlKTogc3RyaW5nW10ge1xuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGZ1bmN0aW9uIHdhbGsobjogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG4udmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICBpZiAobi50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIGNvbnN0IGNoYXJzID0gKChuIGFzIFRleHROb2RlKS5jaGFyYWN0ZXJzIHx8ICcnKS50cmltKCk7XG4gICAgICBpZiAoY2hhcnMpIG91dC5wdXNoKGNoYXJzKTtcbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbikge1xuICAgICAgZm9yIChjb25zdCBjIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoYyk7XG4gICAgfVxuICB9XG4gIHdhbGsobm9kZSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gTmF2aWdhdGlvbiBleHRyYWN0aW9uXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqXG4gKiBEZXRlY3QgbmF2aWdhdGlvbiBsaW5rcyBpbnNpZGUgYSBzZWN0aW9uIFx1MjAxNCBzaG9ydCB0ZXh0IG5vZGVzIHRoYXQgbG9va1xuICogbGlrZSBtZW51IGl0ZW1zIChcdTIyNjQ0MCBjaGFycywgZm9udCBzaXplIFx1MjI2NDIycHgpLiBSZXR1cm5zIG51bGwgd2hlbiB0aGVyZVxuICogYXJlIGZld2VyIHRoYW4gMiBzdWNoIGxpbmtzIChvbmUgbGluayBpc24ndCBhIG1lbnUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0TmF2aWdhdGlvbihzZWN0aW9uTm9kZTogU2NlbmVOb2RlKTogTmF2aWdhdGlvbkluZm8gfCBudWxsIHtcbiAgY29uc3QgbGlua3M6IEFycmF5PHsgbGFiZWw6IHN0cmluZzsgaHJlZj86IHN0cmluZyB8IG51bGwgfT4gPSBbXTtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgaWYgKGRlcHRoID4gNiB8fCBub2RlLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCB0ID0gbm9kZSBhcyBUZXh0Tm9kZTtcbiAgICAgIGNvbnN0IHRleHQgPSAodC5jaGFyYWN0ZXJzIHx8ICcnKS50cmltKCk7XG4gICAgICBpZiAoIXRleHQgfHwgdGV4dC5sZW5ndGggPiA0MCkgcmV0dXJuO1xuICAgICAgY29uc3QgZnMgPSB0LmZvbnRTaXplICE9PSBmaWdtYS5taXhlZCA/ICh0LmZvbnRTaXplIGFzIG51bWJlcikgOiAxNjtcbiAgICAgIGlmIChmcyA+IDIyKSByZXR1cm47XG4gICAgICBpZiAoc2Vlbi5oYXModGV4dC50b0xvd2VyQ2FzZSgpKSkgcmV0dXJuO1xuICAgICAgc2Vlbi5hZGQodGV4dC50b0xvd2VyQ2FzZSgpKTtcblxuICAgICAgbGV0IGhyZWY6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgICAgY29uc3QgcmVhY3Rpb25zID0gKHQgYXMgYW55KS5yZWFjdGlvbnM7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyZWFjdGlvbnMpKSB7XG4gICAgICAgIG91dGVyOiBmb3IgKGNvbnN0IHIgb2YgcmVhY3Rpb25zKSB7XG4gICAgICAgICAgY29uc3QgYWN0aW9ucyA9IHIuYWN0aW9ucyB8fCAoci5hY3Rpb24gPyBbci5hY3Rpb25dIDogW10pO1xuICAgICAgICAgIGZvciAoY29uc3QgYSBvZiBhY3Rpb25zKSB7XG4gICAgICAgICAgICBpZiAoYSAmJiBhLnR5cGUgPT09ICdVUkwnICYmIGEudXJsKSB7IGhyZWYgPSBhLnVybDsgYnJlYWsgb3V0ZXI7IH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxpbmtzLnB1c2goeyBsYWJlbDogdGV4dCwgaHJlZiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoYywgZGVwdGggKyAxKTtcbiAgICB9XG4gIH1cbiAgd2FsayhzZWN0aW9uTm9kZSwgMCk7XG4gIGlmIChsaW5rcy5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHsgbGlua3MgfTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBTZWN0aW9uIHNlbWFudGljIHJvbGVcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5pbnRlcmZhY2UgSW5mZXJUeXBlUGFyYW1zIHtcbiAgc2VjdGlvbkluZGV4OiBudW1iZXI7XG4gIHRvdGFsU2VjdGlvbnM6IG51bWJlcjtcbiAgaXNGb3JtU2VjdGlvbjogYm9vbGVhbjtcbiAgcGF0dGVybnM6IENvbXBvbmVudFBhdHRlcm5bXTtcbiAgcmVwZWF0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBSZXBlYXRlckluZm8+O1xuICBlbGVtZW50czogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gIHRleHRDb250ZW50SW5PcmRlcjogQXJyYXk8eyB0ZXh0OiBzdHJpbmc7IGZvbnRTaXplOiBudW1iZXI7IHJvbGU6IHN0cmluZyB9PjtcbiAgbGF5ZXJOYW1lOiBzdHJpbmc7XG4gIHNlY3Rpb25IZWlnaHQ6IG51bWJlcjtcbiAgaXNHbG9iYWw/OiBib29sZWFuO1xuICBnbG9iYWxSb2xlPzogJ2hlYWRlcicgfCAnZm9vdGVyJyB8IG51bGw7XG59XG5cbi8qKlxuICogSW5mZXIgdGhlIHNlbWFudGljIHR5cGUgb2YgYSBzZWN0aW9uLiBQdXJlIGluZmVyZW5jZSBcdTIwMTQgcmV0dXJucyAnZ2VuZXJpYydcbiAqICsgJ2xvdycgY29uZmlkZW5jZSB3aGVuIG5vdGhpbmcgbWF0Y2hlcyBjbGVhcmx5LiBUaGUgYWdlbnQgc2hvdWxkIHRyZWF0XG4gKiAnaGlnaCcgY29uZmlkZW5jZSBhcyBhdXRob3JpdGF0aXZlIGFuZCAnbG93JyBhcyBhIGhpbnQgb25seS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluZmVyU2VjdGlvblR5cGUocDogSW5mZXJUeXBlUGFyYW1zKTogeyB0eXBlOiBTZWN0aW9uVHlwZTsgY29uZmlkZW5jZTogJ2hpZ2gnIHwgJ2xvdycgfSB7XG4gIC8vIEdsb2JhbCBoZWFkZXIvZm9vdGVyIG92ZXJyaWRlcyBldmVyeXRoaW5nXG4gIGlmIChwLmlzR2xvYmFsICYmIHAuZ2xvYmFsUm9sZSA9PT0gJ2hlYWRlcicpIHJldHVybiB7IHR5cGU6ICdoZWFkZXInLCBjb25maWRlbmNlOiAnaGlnaCcgfTtcbiAgaWYgKHAuaXNHbG9iYWwgJiYgcC5nbG9iYWxSb2xlID09PSAnZm9vdGVyJykgcmV0dXJuIHsgdHlwZTogJ2Zvb3RlcicsIGNvbmZpZGVuY2U6ICdoaWdoJyB9O1xuXG4gIGNvbnN0IG5hbWUgPSAocC5sYXllck5hbWUgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGV4cGxpY2l0OiBBcnJheTx7IHJ4OiBSZWdFeHA7IHR5cGU6IFNlY3Rpb25UeXBlIH0+ID0gW1xuICAgIHsgcng6IC9cXGJoZXJvXFxiLywgdHlwZTogJ2hlcm8nIH0sXG4gICAgeyByeDogL1xcYihmZWF0dXJlcz98YmVuZWZpdHM/fHNlcnZpY2VzPylcXGIvLCB0eXBlOiAnZmVhdHVyZXMnIH0sXG4gICAgeyByeDogL1xcYnRlc3RpbW9uaWFscz9cXGIvLCB0eXBlOiAndGVzdGltb25pYWxzJyB9LFxuICAgIHsgcng6IC9cXGIoY3RhfGNhbGxbLSBdP3RvWy0gXT9hY3Rpb24pXFxiLywgdHlwZTogJ2N0YScgfSxcbiAgICB7IHJ4OiAvXFxiKGZhcXM/fGZyZXF1ZW50bHlbLSBdYXNrZWQpXFxiLywgdHlwZTogJ2ZhcScgfSxcbiAgICB7IHJ4OiAvXFxiKHByaWNpbmd8cGxhbnM/KVxcYi8sIHR5cGU6ICdwcmljaW5nJyB9LFxuICAgIHsgcng6IC9cXGJjb250YWN0XFxiLywgdHlwZTogJ2NvbnRhY3QnIH0sXG4gICAgeyByeDogL1xcYihsb2dvcz98Y2xpZW50cz98cGFydG5lcnM/fGJyYW5kcz8pXFxiLywgdHlwZTogJ2xvZ29zJyB9LFxuICAgIHsgcng6IC9cXGJmb290ZXJcXGIvLCB0eXBlOiAnZm9vdGVyJyB9LFxuICAgIHsgcng6IC9cXGIoaGVhZGVyfG5hdnxuYXZiYXJ8bmF2aWdhdGlvbilcXGIvLCB0eXBlOiAnaGVhZGVyJyB9LFxuICAgIHsgcng6IC9cXGIoYmxvZ3xhcnRpY2xlcz98bmV3c3xwb3N0cz8pXFxiLywgdHlwZTogJ2Jsb2dfZ3JpZCcgfSxcbiAgXTtcbiAgZm9yIChjb25zdCB7IHJ4LCB0eXBlIH0gb2YgZXhwbGljaXQpIHtcbiAgICBpZiAocngudGVzdChuYW1lKSkgcmV0dXJuIHsgdHlwZSwgY29uZmlkZW5jZTogJ2hpZ2gnIH07XG4gIH1cblxuICAvLyBQYXR0ZXJuIHNpZ25hbHNcbiAgaWYgKHAucGF0dGVybnMuc29tZShwdCA9PiBwdC50eXBlID09PSAnYWNjb3JkaW9uJykpIHJldHVybiB7IHR5cGU6ICdmYXEnLCBjb25maWRlbmNlOiAnaGlnaCcgfTtcbiAgaWYgKHAuaXNGb3JtU2VjdGlvbikgcmV0dXJuIHsgdHlwZTogJ2NvbnRhY3QnLCBjb25maWRlbmNlOiAnaGlnaCcgfTtcblxuICAvLyBSZXBlYXRlciBjb250ZW50IHNoYXBlXG4gIGNvbnN0IHJlcEtleXMgPSBPYmplY3Qua2V5cyhwLnJlcGVhdGVycyk7XG4gIGlmIChyZXBLZXlzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCByZXAgPSBwLnJlcGVhdGVyc1tyZXBLZXlzWzBdXTtcbiAgICBjb25zdCBmaXJzdCA9IHJlcC5pdGVtc1swXTtcbiAgICBpZiAoZmlyc3QpIHtcbiAgICAgIGNvbnN0IGhhc0ltYWdlID0gISFmaXJzdC5pbWFnZUZpbGU7XG4gICAgICBjb25zdCB0ZXh0VmFscyA9IE9iamVjdC52YWx1ZXMoZmlyc3QudGV4dHMpO1xuICAgICAgY29uc3QgdGV4dEtleXMgPSBPYmplY3Qua2V5cyhmaXJzdC50ZXh0cyk7XG4gICAgICBjb25zdCBqb2luZWQgPSB0ZXh0VmFscy5qb2luKCcgJyk7XG4gICAgICBjb25zdCBoYXNQcmljZSA9IC9bJFx1MjBBQ1x1MDBBM11cXHMqXFxkfFxcYlxcZCtcXHMqKFxcLyhtb3x5cil8cGVyIChtb250aHx5ZWFyKSlcXGIvaS50ZXN0KGpvaW5lZCk7XG4gICAgICBjb25zdCBsb25nUXVvdGUgPSB0ZXh0VmFscy5zb21lKHYgPT4gKHYgfHwgJycpLmxlbmd0aCA+IDEwMCk7XG4gICAgICBjb25zdCBpc0xvZ29Pbmx5ID0gaGFzSW1hZ2UgJiYgdGV4dEtleXMubGVuZ3RoID09PSAwO1xuICAgICAgY29uc3QgaGFzRGF0ZSA9IC9cXGIoamFufGZlYnxtYXJ8YXByfG1heXxqdW58anVsfGF1Z3xzZXB8b2N0fG5vdnxkZWMpXFx3KlxccytcXGR7MSwyfS9pLnRlc3Qoam9pbmVkKVxuICAgICAgICAgICAgICAgICAgIHx8IC9cXGR7NH0tXFxkezJ9LVxcZHsyfS8udGVzdChqb2luZWQpXG4gICAgICAgICAgICAgICAgICAgfHwgL1xcYihtaW4gcmVhZHxyZWFkaW5nIHRpbWUpXFxiL2kudGVzdChqb2luZWQpO1xuXG4gICAgICBpZiAoaGFzUHJpY2UpIHJldHVybiB7IHR5cGU6ICdwcmljaW5nJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgICAgIGlmIChpc0xvZ29Pbmx5KSByZXR1cm4geyB0eXBlOiAnbG9nb3MnLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICAgICAgaWYgKGhhc0RhdGUpIHJldHVybiB7IHR5cGU6ICdibG9nX2dyaWQnLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICAgICAgaWYgKGxvbmdRdW90ZSkgcmV0dXJuIHsgdHlwZTogJ3Rlc3RpbW9uaWFscycsIGNvbmZpZGVuY2U6ICdsb3cnIH07XG4gICAgICBpZiAoaGFzSW1hZ2UgJiYgdGV4dEtleXMubGVuZ3RoID49IDIpIHJldHVybiB7IHR5cGU6ICdmZWF0dXJlcycsIGNvbmZpZGVuY2U6ICdsb3cnIH07XG4gICAgfVxuICB9XG5cbiAgLy8gRmlyc3Qtc2VjdGlvbiBoZXJvIGhldXJpc3RpY1xuICBpZiAocC5zZWN0aW9uSW5kZXggPT09IDApIHtcbiAgICBjb25zdCBoYXNCaWdIZWFkaW5nID0gcC50ZXh0Q29udGVudEluT3JkZXIuc29tZSh0ID0+IHQuZm9udFNpemUgPj0gNDApO1xuICAgIGNvbnN0IGhhc0J1dHRvbiA9IE9iamVjdC5rZXlzKHAuZWxlbWVudHMpLnNvbWUoayA9PiAvYnV0dG9ufGN0YXxidG4vaS50ZXN0KGspKTtcbiAgICBjb25zdCBoYXNJbWFnZSA9IE9iamVjdC5rZXlzKHAuZWxlbWVudHMpLnNvbWUoayA9PiAvaW1hZ2V8cGhvdG98aGVyby9pLnRlc3QoaykgfHwgayA9PT0gJ2JhY2tncm91bmRfaW1hZ2UnKTtcbiAgICBpZiAoaGFzQmlnSGVhZGluZyAmJiAoaGFzQnV0dG9uIHx8IGhhc0ltYWdlKSkgcmV0dXJuIHsgdHlwZTogJ2hlcm8nLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICB9XG5cbiAgLy8gU2hvcnQgc2VjdGlvbiB3aXRoIGhlYWRpbmcgKyBidXR0b24gXHUyMTkyIENUQVxuICBjb25zdCBoYXNCdXR0b25FbCA9IE9iamVjdC5rZXlzKHAuZWxlbWVudHMpLmZpbHRlcihrID0+IC9idXR0b258Y3RhfGJ0bi9pLnRlc3QoaykpLmxlbmd0aCA+PSAxO1xuICBjb25zdCB0ZXh0Q291bnQgPSBwLnRleHRDb250ZW50SW5PcmRlci5sZW5ndGg7XG4gIGlmIChoYXNCdXR0b25FbCAmJiB0ZXh0Q291bnQgPD0gMyAmJiByZXBLZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7IHR5cGU6ICdjdGEnLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICB9XG5cbiAgcmV0dXJuIHsgdHlwZTogJ2dlbmVyaWMnLCBjb25maWRlbmNlOiAnbG93JyB9O1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIENyb3NzLXBhZ2UgZmluZ2VycHJpbnQgaGVscGVycyAoZm9yIGdsb2JhbCBkZXRlY3Rpb24gaW4gZXh0cmFjdG9yLnRzKVxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbi8qKlxuICogTm9ybWFsaXplIGEgc2VjdGlvbidzIGxheWVyIG5hbWUgZm9yIGNyb3NzLXBhZ2UgbWF0Y2hpbmcuXG4gKiBcIkhlYWRlciBcdTIwMTQgRGVza3RvcFwiLCBcIkhlYWRlciAxNDQwXCIsIFwiSGVhZGVyXCIgYWxsIGNvbGxhcHNlIHRvIFwiaGVhZGVyXCIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTZWN0aW9uTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gKG5hbWUgfHwgJycpXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvXFxzKltcdTIwMTRcdTIwMTNcXC1dXFxzKihkZXNrdG9wfG1vYmlsZXx0YWJsZXQpXFxiL2dpLCAnJylcbiAgICAucmVwbGFjZSgvXFxzK1xcZHszLDR9JC9nLCAnJylcbiAgICAudHJpbSgpO1xufVxuXG4vKipcbiAqIEdpdmVuIGEgdG90YWwgc2VjdGlvbiBjb3VudCBhbmQgdGhlIGluZGV4IG9mIGEgZ2xvYmFsIHNlY3Rpb24sIGd1ZXNzXG4gKiB3aGV0aGVyIGl0IGlzIGEgaGVhZGVyICh0b3AsIHRoaW4pIG9yIGZvb3RlciAoYm90dG9tKSBcdTIwMTQgb3IgbnVsbCB3aGVuXG4gKiBuZWl0aGVyIGZpdHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc2lmeUdsb2JhbFJvbGUoXG4gIHNlY3Rpb25JbmRleDogbnVtYmVyLFxuICB0b3RhbFNlY3Rpb25zOiBudW1iZXIsXG4gIHNlY3Rpb25IZWlnaHQ6IG51bWJlcixcbik6ICdoZWFkZXInIHwgJ2Zvb3RlcicgfCBudWxsIHtcbiAgaWYgKHNlY3Rpb25JbmRleCA8PSAxICYmIHNlY3Rpb25IZWlnaHQgPD0gMjAwKSByZXR1cm4gJ2hlYWRlcic7XG4gIGlmIChzZWN0aW9uSW5kZXggPj0gdG90YWxTZWN0aW9ucyAtIDIpIHJldHVybiAnZm9vdGVyJztcbiAgcmV0dXJuIG51bGw7XG59XG4iLCAiaW1wb3J0IHsgU2VjdGlvblNwZWMsIFNlY3Rpb25TdHlsZXMsIEVsZW1lbnRTdHlsZXMsIE92ZXJsYXBJbmZvLCBMYXllckluZm8sIENvbXBvc2l0aW9uSW5mbywgRm9ybUZpZWxkSW5mbywgVGV4dENvbnRlbnRFbnRyeSwgQ29tcG9uZW50SW5zdGFuY2VJbmZvIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyB0b0Nzc1ZhbHVlLCB0b0xheW91dE5hbWUsIHNjcmVlbnNob3RGaWxlbmFtZSwgY29tcHV0ZUFzcGVjdFJhdGlvLCBpc0RlZmF1bHRMYXllck5hbWUgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3IsIGV4dHJhY3RHcmFkaWVudCwgaGFzSW1hZ2VGaWxsLCBleHRyYWN0Qm9yZGVyU3R5bGUsIGV4dHJhY3RCb3JkZXJXaWR0aHMsIGV4dHJhY3RTdHJva2VDb2xvciB9IGZyb20gJy4vY29sb3InO1xuaW1wb3J0IHsgZXh0cmFjdFR5cG9ncmFwaHkgfSBmcm9tICcuL3R5cG9ncmFwaHknO1xuaW1wb3J0IHsgZXh0cmFjdEF1dG9MYXlvdXRTcGFjaW5nLCBleHRyYWN0QWJzb2x1dGVTcGFjaW5nIH0gZnJvbSAnLi9zcGFjaW5nJztcbmltcG9ydCB7IGRldGVjdEdyaWQgfSBmcm9tICcuL2dyaWQnO1xuaW1wb3J0IHsgZXh0cmFjdEludGVyYWN0aW9ucyB9IGZyb20gJy4vaW50ZXJhY3Rpb25zJztcbmltcG9ydCB7IGV4dHJhY3RFZmZlY3RzIH0gZnJvbSAnLi9lZmZlY3RzJztcbmltcG9ydCB7IHRvQ3NzQ3VzdG9tUHJvcGVydHkgfSBmcm9tICcuL3ZhcmlhYmxlcyc7XG5pbXBvcnQge1xuICBkZXRlY3RSZXBlYXRlcnMsIGRldGVjdENvbXBvbmVudFBhdHRlcm5zLCBkZXRlY3ROYXZpZ2F0aW9uLFxuICBpbmZlclNlY3Rpb25UeXBlLCBub3JtYWxpemVTZWN0aW9uTmFtZSwgY2xhc3NpZnlHbG9iYWxSb2xlLFxufSBmcm9tICcuL3BhdHRlcm5zJztcbmltcG9ydCB7IHJnYlRvSGV4IH0gZnJvbSAnLi9jb2xvcic7XG5cbi8qKlxuICogSWRlbnRpZnkgc2VjdGlvbiBmcmFtZXMgd2l0aGluIGEgcGFnZSBmcmFtZS5cbiAqIFNlY3Rpb25zIGFyZSB0aGUgZGlyZWN0IGNoaWxkcmVuIG9mIHRoZSBwYWdlIGZyYW1lLCBzb3J0ZWQgYnkgWSBwb3NpdGlvbi5cbiAqIElmIHRoZSBmcmFtZSBoYXMgYSBzaW5nbGUgd3JhcHBlciBjaGlsZCwgZHJpbGwgb25lIGxldmVsIGRlZXBlci5cbiAqL1xuZnVuY3Rpb24gaWRlbnRpZnlTZWN0aW9ucyhwYWdlRnJhbWU6IEZyYW1lTm9kZSk6IFNjZW5lTm9kZVtdIHtcbiAgbGV0IGNhbmRpZGF0ZXMgPSBwYWdlRnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICk7XG5cbiAgLy8gSWYgdGhlcmUncyBhIHNpbmdsZSBjb250YWluZXIgY2hpbGQsIGRyaWxsIG9uZSBsZXZlbCBkZWVwZXJcbiAgaWYgKGNhbmRpZGF0ZXMubGVuZ3RoID09PSAxICYmICdjaGlsZHJlbicgaW4gY2FuZGlkYXRlc1swXSkge1xuICAgIGNvbnN0IHdyYXBwZXIgPSBjYW5kaWRhdGVzWzBdIGFzIEZyYW1lTm9kZTtcbiAgICBjb25zdCBpbm5lckNhbmRpZGF0ZXMgPSB3cmFwcGVyLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJylcbiAgICApO1xuICAgIGlmIChpbm5lckNhbmRpZGF0ZXMubGVuZ3RoID4gMSkge1xuICAgICAgY2FuZGlkYXRlcyA9IGlubmVyQ2FuZGlkYXRlcztcbiAgICB9XG4gIH1cblxuICAvLyBTb3J0IGJ5IFkgcG9zaXRpb24gKHRvcCB0byBib3R0b20pXG4gIHJldHVybiBbLi4uY2FuZGlkYXRlc10uc29ydCgoYSwgYikgPT4ge1xuICAgIGNvbnN0IGFZID0gYS5hYnNvbHV0ZUJvdW5kaW5nQm94Py55ID8/IDA7XG4gICAgY29uc3QgYlkgPSBiLmFic29sdXRlQm91bmRpbmdCb3g/LnkgPz8gMDtcbiAgICByZXR1cm4gYVkgLSBiWTtcbiAgfSk7XG59XG5cbi8qKlxuICogRXh0cmFjdCBzZWN0aW9uLWxldmVsIHN0eWxlcyBmcm9tIGEgZnJhbWUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RTZWN0aW9uU3R5bGVzKG5vZGU6IFNjZW5lTm9kZSk6IFNlY3Rpb25TdHlsZXMge1xuICBjb25zdCBiZyA9IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3Iobm9kZSBhcyBhbnkpO1xuICBjb25zdCBncmFkaWVudCA9IGV4dHJhY3RHcmFkaWVudChub2RlIGFzIGFueSk7XG4gIGNvbnN0IGJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgY29uc3QgZWZmZWN0cyA9IGV4dHJhY3RFZmZlY3RzKG5vZGUgYXMgYW55KTtcbiAgY29uc3QgY29ybmVycyA9IGV4dHJhY3RQZXJDb3JuZXJSYWRpdXMobm9kZSBhcyBhbnkpO1xuXG4gIGNvbnN0IHN0eWxlczogU2VjdGlvblN0eWxlcyA9IHtcbiAgICBwYWRkaW5nVG9wOiBudWxsLCAgLy8gU2V0IGJ5IHNwYWNpbmcgZXh0cmFjdG9yXG4gICAgcGFkZGluZ0JvdHRvbTogbnVsbCxcbiAgICBwYWRkaW5nTGVmdDogbnVsbCxcbiAgICBwYWRkaW5nUmlnaHQ6IG51bGwsXG4gICAgYmFja2dyb3VuZENvbG9yOiBiZyxcbiAgICBiYWNrZ3JvdW5kSW1hZ2U6IGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkgPyAndXJsKC4uLiknIDogbnVsbCxcbiAgICBiYWNrZ3JvdW5kR3JhZGllbnQ6IGdyYWRpZW50LFxuICAgIG1pbkhlaWdodDogYm91bmRzID8gdG9Dc3NWYWx1ZShib3VuZHMuaGVpZ2h0KSA6IG51bGwsXG4gICAgb3ZlcmZsb3c6IG51bGwsXG4gICAgYm94U2hhZG93OiBlZmZlY3RzLmJveFNoYWRvdyxcbiAgICBmaWx0ZXI6IGVmZmVjdHMuZmlsdGVyLFxuICAgIGJhY2tkcm9wRmlsdGVyOiBlZmZlY3RzLmJhY2tkcm9wRmlsdGVyLFxuICB9O1xuICBpZiAoY29ybmVycykge1xuICAgIGlmIChjb3JuZXJzLnVuaWZvcm0gIT09IG51bGwpIHtcbiAgICAgIHN0eWxlcy5ib3JkZXJSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudW5pZm9ybSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlcy5ib3JkZXJUb3BMZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnRvcExlZnQpO1xuICAgICAgc3R5bGVzLmJvcmRlclRvcFJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnRvcFJpZ2h0KTtcbiAgICAgIHN0eWxlcy5ib3JkZXJCb3R0b21MZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLmJvdHRvbUxlZnQpO1xuICAgICAgc3R5bGVzLmJvcmRlckJvdHRvbVJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLmJvdHRvbVJpZ2h0KTtcbiAgICB9XG4gIH1cbiAgYXBwbHlTdHJva2VzKHN0eWxlcywgbm9kZSk7XG4gIGlmICgnb3BhY2l0eScgaW4gbm9kZSAmJiB0eXBlb2YgKG5vZGUgYXMgYW55KS5vcGFjaXR5ID09PSAnbnVtYmVyJyAmJiAobm9kZSBhcyBhbnkpLm9wYWNpdHkgPCAxKSB7XG4gICAgc3R5bGVzLm9wYWNpdHkgPSBNYXRoLnJvdW5kKChub2RlIGFzIGFueSkub3BhY2l0eSAqIDEwMCkgLyAxMDA7XG4gIH1cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHBlci1jb3JuZXIgYm9yZGVyLXJhZGl1cyBmcm9tIGEgbm9kZS4gRmlnbWEgc3RvcmVzXG4gKiB0b3BMZWZ0UmFkaXVzIC8gdG9wUmlnaHRSYWRpdXMgLyBib3R0b21MZWZ0UmFkaXVzIC8gYm90dG9tUmlnaHRSYWRpdXNcbiAqIGFzIGluZGl2aWR1YWwgcHJvcGVydGllcyBvbiBSZWN0YW5nbGVOb2RlIGFuZCBGcmFtZU5vZGUuIFdoZW4gdGhlXG4gKiB1bmlmb3JtIGNvcm5lclJhZGl1cyBpcyBhIG51bWJlciwgYWxsIGZvdXIgYXJlIGVxdWFsLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSBub2RlIGhhcyBubyBjb3JuZXIgZGF0YS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFBlckNvcm5lclJhZGl1cyhub2RlOiBhbnkpOiB7XG4gIHRvcExlZnQ6IG51bWJlcjsgdG9wUmlnaHQ6IG51bWJlcjsgYm90dG9tTGVmdDogbnVtYmVyOyBib3R0b21SaWdodDogbnVtYmVyOyB1bmlmb3JtOiBudW1iZXIgfCBudWxsO1xufSB8IG51bGwge1xuICBjb25zdCBuID0gbm9kZSBhcyBhbnk7XG4gIGNvbnN0IGNyID0gbi5jb3JuZXJSYWRpdXM7XG4gIGNvbnN0IHRsID0gdHlwZW9mIG4udG9wTGVmdFJhZGl1cyA9PT0gJ251bWJlcicgPyBuLnRvcExlZnRSYWRpdXMgOiBudWxsO1xuICBjb25zdCB0ciA9IHR5cGVvZiBuLnRvcFJpZ2h0UmFkaXVzID09PSAnbnVtYmVyJyA/IG4udG9wUmlnaHRSYWRpdXMgOiBudWxsO1xuICBjb25zdCBibCA9IHR5cGVvZiBuLmJvdHRvbUxlZnRSYWRpdXMgPT09ICdudW1iZXInID8gbi5ib3R0b21MZWZ0UmFkaXVzIDogbnVsbDtcbiAgY29uc3QgYnIgPSB0eXBlb2Ygbi5ib3R0b21SaWdodFJhZGl1cyA9PT0gJ251bWJlcicgPyBuLmJvdHRvbVJpZ2h0UmFkaXVzIDogbnVsbDtcblxuICBpZiAodHlwZW9mIGNyID09PSAnbnVtYmVyJyAmJiB0bCA9PT0gbnVsbCkge1xuICAgIC8vIFVuaWZvcm0gY29ybmVycyAob3IgY29ybmVyUmFkaXVzIGlzIHRoZSBtaXhlZCBzeW1ib2wpXG4gICAgaWYgKGNyID09PSAwKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4geyB0b3BMZWZ0OiBjciwgdG9wUmlnaHQ6IGNyLCBib3R0b21MZWZ0OiBjciwgYm90dG9tUmlnaHQ6IGNyLCB1bmlmb3JtOiBjciB9O1xuICB9XG4gIGlmICh0bCAhPT0gbnVsbCB8fCB0ciAhPT0gbnVsbCB8fCBibCAhPT0gbnVsbCB8fCBiciAhPT0gbnVsbCkge1xuICAgIHJldHVybiB7XG4gICAgICB0b3BMZWZ0OiB0bCB8fCAwLFxuICAgICAgdG9wUmlnaHQ6IHRyIHx8IDAsXG4gICAgICBib3R0b21MZWZ0OiBibCB8fCAwLFxuICAgICAgYm90dG9tUmlnaHQ6IGJyIHx8IDAsXG4gICAgICB1bmlmb3JtOiAodGwgPT09IHRyICYmIHRyID09PSBibCAmJiBibCA9PT0gYnIpID8gKHRsIHx8IDApIDogbnVsbCxcbiAgICB9O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEFwcGx5IHBlci1jb3JuZXIgcmFkaXVzLiBJZiBhbGwgNCBhcmUgZXF1YWwsIGVtaXQgYm9yZGVyUmFkaXVzIHNob3J0aGFuZDtcbiAqIG90aGVyd2lzZSBlbWl0IHRoZSA0IGV4cGxpY2l0IHZhbHVlcy4gV29ya3Mgb24gRWxlbWVudFN0eWxlcyBvciBTZWN0aW9uU3R5bGVzLlxuICovXG5mdW5jdGlvbiBhcHBseVJhZGl1cyhlbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ICYgUGFydGlhbDxTZWN0aW9uU3R5bGVzPiwgbm9kZTogYW55KTogdm9pZCB7XG4gIGNvbnN0IGNvcm5lcnMgPSBleHRyYWN0UGVyQ29ybmVyUmFkaXVzKG5vZGUpO1xuICBpZiAoIWNvcm5lcnMpIHJldHVybjtcbiAgaWYgKGNvcm5lcnMudW5pZm9ybSAhPT0gbnVsbCkge1xuICAgIGVsZW0uYm9yZGVyUmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnVuaWZvcm0pO1xuICAgIHJldHVybjtcbiAgfVxuICBlbGVtLmJvcmRlclRvcExlZnRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudG9wTGVmdCk7XG4gIGVsZW0uYm9yZGVyVG9wUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudG9wUmlnaHQpO1xuICBlbGVtLmJvcmRlckJvdHRvbUxlZnRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMuYm90dG9tTGVmdCk7XG4gIGVsZW0uYm9yZGVyQm90dG9tUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMuYm90dG9tUmlnaHQpO1xufVxuXG4vKipcbiAqIEFwcGx5IHN0cm9rZXM6IHBlci1zaWRlIGJvcmRlci13aWR0aCB3aGVuIEZpZ21hIGhhcyBpbmRpdmlkdWFsU3Ryb2tlV2VpZ2h0cyxcbiAqIHNpbmdsZSBib3JkZXJXaWR0aCBvdGhlcndpc2UuIEFsc28gbWFwcyBzdHlsZSAoc29saWQvZGFzaGVkL2RvdHRlZCkgYW5kXG4gKiBjb2xvci4gV29ya3Mgb24gRWxlbWVudFN0eWxlcyBvciBTZWN0aW9uU3R5bGVzLlxuICovXG5mdW5jdGlvbiBhcHBseVN0cm9rZXMoZWxlbTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiAmIFBhcnRpYWw8U2VjdGlvblN0eWxlcz4sIG5vZGU6IGFueSk6IHZvaWQge1xuICBjb25zdCBjb2xvciA9IGV4dHJhY3RTdHJva2VDb2xvcihub2RlKTtcbiAgY29uc3Qgd2lkdGhzID0gZXh0cmFjdEJvcmRlcldpZHRocyhub2RlKTtcbiAgY29uc3Qgc3R5bGUgPSBleHRyYWN0Qm9yZGVyU3R5bGUobm9kZSk7XG4gIGlmICghY29sb3IpIHJldHVybjtcblxuICBpZiAod2lkdGhzLnVuaWZvcm0gIT09IG51bGwpIHtcbiAgICBlbGVtLmJvcmRlcldpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMudW5pZm9ybSk7XG4gICAgZWxlbS5ib3JkZXJDb2xvciA9IGNvbG9yO1xuICAgIGVsZW0uYm9yZGVyU3R5bGUgPSBzdHlsZTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHdpZHRocy50b3AgfHwgd2lkdGhzLnJpZ2h0IHx8IHdpZHRocy5ib3R0b20gfHwgd2lkdGhzLmxlZnQpIHtcbiAgICBpZiAod2lkdGhzLnRvcCkgZWxlbS5ib3JkZXJUb3BXaWR0aCA9IHRvQ3NzVmFsdWUod2lkdGhzLnRvcCk7XG4gICAgaWYgKHdpZHRocy5yaWdodCkgZWxlbS5ib3JkZXJSaWdodFdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMucmlnaHQpO1xuICAgIGlmICh3aWR0aHMuYm90dG9tKSBlbGVtLmJvcmRlckJvdHRvbVdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMuYm90dG9tKTtcbiAgICBpZiAod2lkdGhzLmxlZnQpIGVsZW0uYm9yZGVyTGVmdFdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMubGVmdCk7XG4gICAgZWxlbS5ib3JkZXJDb2xvciA9IGNvbG9yO1xuICAgIGVsZW0uYm9yZGVyU3R5bGUgPSBzdHlsZTtcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3Qgb2JqZWN0LXBvc2l0aW9uIGZyb20gYW4gaW1hZ2UgZmlsbCdzIGltYWdlVHJhbnNmb3JtIChjcm9wIG9mZnNldCkuXG4gKiBGaWdtYSdzIGltYWdlVHJhbnNmb3JtIGlzIGEgMngzIGFmZmluZSBtYXRyaXguIFdoZW4gdGhlIGltYWdlIGhhcyBiZWVuXG4gKiBjcm9wcGVkL3JlcG9zaXRpb25lZCBpbiBGaWdtYSwgdGhlIHRyYW5zbGF0aW9uIGNvbXBvbmVudHMgdGVsbCB1cyB0aGVcbiAqIGZvY2FsIHBvaW50LiBNYXAgdG8gQ1NTIG9iamVjdC1wb3NpdGlvbiAvIGJhY2tncm91bmQtcG9zaXRpb24uXG4gKlxuICogUmV0dXJucyBudWxsIHdoZW4gdGhlIGltYWdlIGlzIGNlbnRlcmVkIChkZWZhdWx0KSwgb3Igd2hlbiBub2RlIGhhcyBub1xuICogaW1hZ2VUcmFuc2Zvcm0gZGF0YS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdE9iamVjdFBvc2l0aW9uKG5vZGU6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiBudWxsO1xuICBjb25zdCBpbWdGaWxsID0gbm9kZS5maWxscy5maW5kKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpIGFzIEltYWdlUGFpbnQgfCB1bmRlZmluZWQ7XG4gIGlmICghaW1nRmlsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHQgPSAoaW1nRmlsbCBhcyBhbnkpLmltYWdlVHJhbnNmb3JtIGFzIG51bWJlcltdW10gfCB1bmRlZmluZWQ7XG4gIGlmICghdCB8fCAhQXJyYXkuaXNBcnJheSh0KSB8fCB0Lmxlbmd0aCA8IDIpIHJldHVybiBudWxsO1xuICAvLyBpbWFnZVRyYW5zZm9ybSBpcyBhIDJ4MyBtYXRyaXg6IFtbYSwgYiwgdHhdLCBbYywgZCwgdHldXVxuICAvLyB0eC90eSBhcmUgbm9ybWFsaXplZCAoMC4uMSkgdHJhbnNsYXRpb24gXHUyMDE0IDAgPSBsZWZ0L3RvcCwgMC41ID0gY2VudGVyXG4gIGNvbnN0IHR4ID0gdFswXSAmJiB0eXBlb2YgdFswXVsyXSA9PT0gJ251bWJlcicgPyB0WzBdWzJdIDogMC41O1xuICBjb25zdCB0eSA9IHRbMV0gJiYgdHlwZW9mIHRbMV1bMl0gPT09ICdudW1iZXInID8gdFsxXVsyXSA6IDAuNTtcbiAgLy8gRGVmYXVsdCAoY2VudGVyZWQpIFx1MjE5MiBudWxsIChicm93c2VyIHVzZXMgXCI1MCUgNTAlXCIgYnkgZGVmYXVsdClcbiAgaWYgKE1hdGguYWJzKHR4IC0gMC41KSA8IDAuMDEgJiYgTWF0aC5hYnModHkgLSAwLjUpIDwgMC4wMSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHhQY3QgPSBNYXRoLnJvdW5kKHR4ICogMTAwKTtcbiAgY29uc3QgeVBjdCA9IE1hdGgucm91bmQodHkgKiAxMDApO1xuICByZXR1cm4gYCR7eFBjdH0lICR7eVBjdH0lYDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRyYW5zZm9ybSAocm90YXRpb24gKyBzY2FsZSkgZnJvbSBhIG5vZGUncyByZWxhdGl2ZVRyYW5zZm9ybS5cbiAqIEZpZ21hJ3MgcmVsYXRpdmVUcmFuc2Zvcm0gaXMgYSAyeDMgbWF0cml4IFx1MjAxNCB3ZSBkZWNvbXBvc2UgaXQgdG8gcm90YXRpb25cbiAqIGFuZCBzY2FsZSB3aGVuIHRoZXkncmUgbm9uLWlkZW50aXR5LlxuICovXG5mdW5jdGlvbiBleHRyYWN0VHJhbnNmb3JtKG5vZGU6IGFueSk6IHsgdHJhbnNmb3JtOiBzdHJpbmcgfCBudWxsIH0ge1xuICBjb25zdCBydCA9IG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0gYXMgbnVtYmVyW11bXSB8IHVuZGVmaW5lZDtcbiAgaWYgKCFydCB8fCAhQXJyYXkuaXNBcnJheShydCkgfHwgcnQubGVuZ3RoIDwgMikgcmV0dXJuIHsgdHJhbnNmb3JtOiBudWxsIH07XG4gIC8vIEV4dHJhY3Qgcm90YXRpb24gZnJvbSB0aGUgbWF0cml4OiBhbmdsZSA9IGF0YW4yKG1bMV1bMF0sIG1bMF1bMF0pXG4gIGNvbnN0IGEgPSBydFswXVswXSwgYiA9IHJ0WzBdWzFdLCBjID0gcnRbMV1bMF0sIGQgPSBydFsxXVsxXTtcbiAgY29uc3QgcmFkaWFucyA9IE1hdGguYXRhbjIoYywgYSk7XG4gIGNvbnN0IGRlZ3JlZXMgPSBNYXRoLnJvdW5kKChyYWRpYW5zICogMTgwKSAvIE1hdGguUEkpO1xuICBjb25zdCBzY2FsZVggPSBNYXRoLnNxcnQoYSAqIGEgKyBjICogYyk7XG4gIGNvbnN0IHNjYWxlWSA9IE1hdGguc3FydChiICogYiArIGQgKiBkKTtcblxuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgaWYgKE1hdGguYWJzKGRlZ3JlZXMpID4gMC41KSBwYXJ0cy5wdXNoKGByb3RhdGUoJHtkZWdyZWVzfWRlZylgKTtcbiAgaWYgKE1hdGguYWJzKHNjYWxlWCAtIDEpID4gMC4wMikgcGFydHMucHVzaChgc2NhbGVYKCR7TWF0aC5yb3VuZChzY2FsZVggKiAxMDApIC8gMTAwfSlgKTtcbiAgaWYgKE1hdGguYWJzKHNjYWxlWSAtIDEpID4gMC4wMikgcGFydHMucHVzaChgc2NhbGVZKCR7TWF0aC5yb3VuZChzY2FsZVkgKiAxMDApIC8gMTAwfSlgKTtcblxuICByZXR1cm4geyB0cmFuc2Zvcm06IHBhcnRzLmxlbmd0aCA+IDAgPyBwYXJ0cy5qb2luKCcgJykgOiBudWxsIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCBmbGV4LWdyb3cgLyBmbGV4LWJhc2lzIC8gYWxpZ24tc2VsZiBmb3IgYXV0by1sYXlvdXQgY2hpbGRyZW4uXG4gKiBGaWdtYSdzIGxheW91dEdyb3cgaXMgMCBvciAxOyBsYXlvdXRBbGlnbiBpcyBJTkhFUklUIC8gU1RSRVRDSCAvIE1JTiAvIENFTlRFUiAvIE1BWC5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEZsZXhDaGlsZFByb3BzKG5vZGU6IGFueSk6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4ge1xuICBjb25zdCBvdXQ6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7fTtcbiAgaWYgKHR5cGVvZiBub2RlLmxheW91dEdyb3cgPT09ICdudW1iZXInKSB7XG4gICAgb3V0LmZsZXhHcm93ID0gbm9kZS5sYXlvdXRHcm93O1xuICB9XG4gIGlmIChub2RlLmxheW91dEFsaWduKSB7XG4gICAgc3dpdGNoIChub2RlLmxheW91dEFsaWduKSB7XG4gICAgICBjYXNlICdTVFJFVENIJzogb3V0LmFsaWduU2VsZiA9ICdzdHJldGNoJzsgYnJlYWs7XG4gICAgICBjYXNlICdNSU4nOiBvdXQuYWxpZ25TZWxmID0gJ2ZsZXgtc3RhcnQnOyBicmVhaztcbiAgICAgIGNhc2UgJ0NFTlRFUic6IG91dC5hbGlnblNlbGYgPSAnY2VudGVyJzsgYnJlYWs7XG4gICAgICBjYXNlICdNQVgnOiBvdXQuYWxpZ25TZWxmID0gJ2ZsZXgtZW5kJzsgYnJlYWs7XG4gICAgICBkZWZhdWx0OiBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDb21wdXRlIHBlci1zaWRlIG1hcmdpbiBmb3IgYSBub2RlIGJhc2VkIG9uIHNpYmxpbmcgcG9zaXRpb25zIGluIGl0c1xuICogcGFyZW50IGNvbnRhaW5lci4gUmV0dXJucyBvbmx5IHRoZSBzaWRlcyB0aGF0IGhhdmUgYSBjbGVhciBub24temVyb1xuICogbWFyZ2luIChwcmV2aW91cyBzaWJsaW5nIG9uIHRvcCwgbmV4dCBzaWJsaW5nIGJlbG93LCBwYXJlbnQgYm91bmRzIGZvclxuICogbGVmdC9yaWdodCB3aGVuIHBhcmVudCB3aWR0aCBpcyBrbm93bikuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RQZXJTaWRlTWFyZ2lucyhub2RlOiBTY2VuZU5vZGUpOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+IHtcbiAgY29uc3Qgb3V0OiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge307XG4gIGlmICghbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94IHx8ICFub2RlLnBhcmVudCB8fCAhKCdjaGlsZHJlbicgaW4gbm9kZS5wYXJlbnQpKSByZXR1cm4gb3V0O1xuXG4gIGNvbnN0IHNpYmxpbmdzID0gKG5vZGUucGFyZW50IGFzIEZyYW1lTm9kZSkuY2hpbGRyZW47XG4gIGNvbnN0IGlkeCA9IHNpYmxpbmdzLmluZGV4T2Yobm9kZSk7XG4gIGNvbnN0IGJiID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuXG4gIC8vIEJvdHRvbTogZ2FwIHRvIG5leHQgc2libGluZ1xuICBpZiAoaWR4ID49IDAgJiYgaWR4IDwgc2libGluZ3MubGVuZ3RoIC0gMSkge1xuICAgIGNvbnN0IG5leHQgPSBzaWJsaW5nc1tpZHggKyAxXTtcbiAgICBpZiAobmV4dC5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICBjb25zdCBnYXAgPSBuZXh0LmFic29sdXRlQm91bmRpbmdCb3gueSAtIChiYi55ICsgYmIuaGVpZ2h0KTtcbiAgICAgIGlmIChnYXAgPiAwKSBvdXQubWFyZ2luQm90dG9tID0gdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKGdhcCkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRvcDogZ2FwIHRvIHByZXZpb3VzIHNpYmxpbmcgKGZvciBhYnNvbHV0ZS1wb3NpdGlvbiBsYXlvdXRzKVxuICBpZiAoaWR4ID4gMCkge1xuICAgIGNvbnN0IHByZXYgPSBzaWJsaW5nc1tpZHggLSAxXTtcbiAgICBpZiAocHJldi5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICBjb25zdCBnYXAgPSBiYi55IC0gKHByZXYuYWJzb2x1dGVCb3VuZGluZ0JveC55ICsgcHJldi5hYnNvbHV0ZUJvdW5kaW5nQm94LmhlaWdodCk7XG4gICAgICBpZiAoZ2FwID4gMCkgb3V0Lm1hcmdpblRvcCA9IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChnYXApKTtcbiAgICB9XG4gIH1cblxuICAvLyBMZWZ0L3JpZ2h0OiBpbnNldCBmcm9tIHBhcmVudCBlZGdlc1xuICBjb25zdCBwYXJlbnRCQiA9IChub2RlLnBhcmVudCBhcyBGcmFtZU5vZGUpLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGlmIChwYXJlbnRCQikge1xuICAgIGNvbnN0IGxlZnRHYXAgPSBiYi54IC0gcGFyZW50QkIueDtcbiAgICBjb25zdCByaWdodEdhcCA9IChwYXJlbnRCQi54ICsgcGFyZW50QkIud2lkdGgpIC0gKGJiLnggKyBiYi53aWR0aCk7XG4gICAgLy8gT25seSBlbWl0IHdoZW4gZWxlbWVudCBpcyBub3QgY2VudGVyZWQgKHNpZ25pZmljYW50IGFzeW1tZXRyaWMgbWFyZ2luKVxuICAgIGlmIChNYXRoLmFicyhsZWZ0R2FwIC0gcmlnaHRHYXApID4gOCAmJiBsZWZ0R2FwID4gMCkge1xuICAgICAgb3V0Lm1hcmdpbkxlZnQgPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQobGVmdEdhcCkpO1xuICAgIH1cbiAgICBpZiAoTWF0aC5hYnMobGVmdEdhcCAtIHJpZ2h0R2FwKSA+IDggJiYgcmlnaHRHYXAgPiAwKSB7XG4gICAgICBvdXQubWFyZ2luUmlnaHQgPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQocmlnaHRHYXApKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgcHJvdG90eXBlIG5hdmlnYXRpb24gVVJMIGZvciBhIG5vZGUuIEZpZ21hIHN1cHBvcnRzXG4gKiBPUEVOX1VSTCBhY3Rpb25zIGluIHJlYWN0aW9ucyBcdTIwMTQgbWFwIHRvIGxpbmtVcmwuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RMaW5rVXJsKG5vZGU6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCByZWFjdGlvbnMgPSBub2RlLnJlYWN0aW9ucztcbiAgaWYgKCFyZWFjdGlvbnMgfHwgIUFycmF5LmlzQXJyYXkocmVhY3Rpb25zKSkgcmV0dXJuIG51bGw7XG4gIGZvciAoY29uc3QgciBvZiByZWFjdGlvbnMpIHtcbiAgICBjb25zdCBhY3Rpb25zID0gci5hY3Rpb25zIHx8IChyLmFjdGlvbiA/IFtyLmFjdGlvbl0gOiBbXSk7XG4gICAgZm9yIChjb25zdCBhIG9mIGFjdGlvbnMpIHtcbiAgICAgIGlmIChhICYmIGEudHlwZSA9PT0gJ1VSTCcgJiYgYS51cmwpIHJldHVybiBhLnVybDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBGaWdtYSBzaXppbmcgbW9kZXMgKEh1ZyAvIEZpbGwgLyBGaXhlZCkuIFRoZXNlIHRlbGwgdGhlIGFnZW50XG4gKiB3aGV0aGVyIGFuIGVsZW1lbnQgc2hvdWxkIGJlIHdpZHRoOmF1dG8sIHdpZHRoOjEwMCUsIG9yIGEgZml4ZWQgcHggc2l6ZSBcdTIwMTRcbiAqIGNyaXRpY2FsIGZvciBjb3JyZWN0IHJlc3BvbnNpdmUgYmVoYXZpb3IuIFJldHVybnMgbnVsbCBmb3IgZWFjaCBheGlzIHdoZW5cbiAqIHRoZSBtb2RlIGlzIG1pc3NpbmcgKG9sZGVyIEZpZ21hIHZlcnNpb25zLCBub24tYXV0by1sYXlvdXQgY29udGV4dHMpLlxuICovXG5mdW5jdGlvbiBleHRyYWN0U2l6aW5nTW9kZXMobm9kZTogYW55KTogeyB3aWR0aE1vZGU6ICdodWcnfCdmaWxsJ3wnZml4ZWQnfG51bGw7IGhlaWdodE1vZGU6ICdodWcnfCdmaWxsJ3wnZml4ZWQnfG51bGwgfSB7XG4gIGNvbnN0IG1hcCA9IChtOiBzdHJpbmcgfCB1bmRlZmluZWQpOiAnaHVnJ3wnZmlsbCd8J2ZpeGVkJ3xudWxsID0+IHtcbiAgICBpZiAobSA9PT0gJ0hVRycpIHJldHVybiAnaHVnJztcbiAgICBpZiAobSA9PT0gJ0ZJTEwnKSByZXR1cm4gJ2ZpbGwnO1xuICAgIGlmIChtID09PSAnRklYRUQnKSByZXR1cm4gJ2ZpeGVkJztcbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aE1vZGU6IG1hcChub2RlLmxheW91dFNpemluZ0hvcml6b250YWwpLFxuICAgIGhlaWdodE1vZGU6IG1hcChub2RlLmxheW91dFNpemluZ1ZlcnRpY2FsKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IEZpZ21hIFZhcmlhYmxlIGJpbmRpbmdzIG9uIGEgbm9kZSdzIHByb3BlcnRpZXMuIFJldHVybnMgQ1NTIGN1c3RvbVxuICogcHJvcGVydHkgcmVmZXJlbmNlcyAoZS5nLiBcInZhcigtLWNsci1wcmltYXJ5KVwiKSBrZXllZCBieSBDU1MgcHJvcGVydHkgbmFtZS5cbiAqIFdoZW4gdmFyaWFibGVzIGFyZSBib3VuZCwgdGhlIGFnZW50IHNob3VsZCBlbWl0IHRoZXNlIHJlZmVyZW5jZXMgaW5zdGVhZFxuICogb2YgdGhlIHJlc29sdmVkIHJhdyBoZXgvcHggdmFsdWVzIHNvIHRva2VuIGNoYW5nZXMgaW4gRmlnbWEgcHJvcGFnYXRlLlxuICovXG5mdW5jdGlvbiBleHRyYWN0Qm91bmRWYXJpYWJsZXMobm9kZTogYW55KTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IG51bGwge1xuICBjb25zdCBidiA9IG5vZGUuYm91bmRWYXJpYWJsZXM7XG4gIGlmICghYnYgfHwgdHlwZW9mIGJ2ICE9PSAnb2JqZWN0JykgcmV0dXJuIG51bGw7XG4gIGlmICghZmlnbWEudmFyaWFibGVzIHx8IHR5cGVvZiAoZmlnbWEudmFyaWFibGVzIGFzIGFueSkuZ2V0VmFyaWFibGVCeUlkICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICBjb25zdCByZXNvbHZlID0gKGFsaWFzOiBhbnkpOiBzdHJpbmcgfCBudWxsID0+IHtcbiAgICBpZiAoIWFsaWFzIHx8ICFhbGlhcy5pZCkgcmV0dXJuIG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHYgPSAoZmlnbWEudmFyaWFibGVzIGFzIGFueSkuZ2V0VmFyaWFibGVCeUlkKGFsaWFzLmlkKTtcbiAgICAgIGlmICghdikgcmV0dXJuIG51bGw7XG4gICAgICBsZXQgY29sTmFtZSA9ICcnO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY29sID0gKGZpZ21hLnZhcmlhYmxlcyBhcyBhbnkpLmdldFZhcmlhYmxlQ29sbGVjdGlvbkJ5SWQ/Lih2LnZhcmlhYmxlQ29sbGVjdGlvbklkKTtcbiAgICAgICAgY29sTmFtZSA9IGNvbD8ubmFtZSB8fCAnJztcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIHJldHVybiBgdmFyKCR7dG9Dc3NDdXN0b21Qcm9wZXJ0eSh2Lm5hbWUsIGNvbE5hbWUpfSlgO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9O1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGJ2LmZpbGxzKSAmJiBidi5maWxsc1swXSkge1xuICAgIGNvbnN0IHJlZiA9IHJlc29sdmUoYnYuZmlsbHNbMF0pO1xuICAgIGlmIChyZWYpIG91dFtub2RlLnR5cGUgPT09ICdURVhUJyA/ICdjb2xvcicgOiAnYmFja2dyb3VuZENvbG9yJ10gPSByZWY7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkoYnYuc3Ryb2tlcykgJiYgYnYuc3Ryb2tlc1swXSkge1xuICAgIGNvbnN0IHJlZiA9IHJlc29sdmUoYnYuc3Ryb2tlc1swXSk7XG4gICAgaWYgKHJlZikgb3V0LmJvcmRlckNvbG9yID0gcmVmO1xuICB9XG4gIGNvbnN0IG51bWVyaWNNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgcGFkZGluZ1RvcDogJ3BhZGRpbmdUb3AnLCBwYWRkaW5nQm90dG9tOiAncGFkZGluZ0JvdHRvbScsXG4gICAgcGFkZGluZ0xlZnQ6ICdwYWRkaW5nTGVmdCcsIHBhZGRpbmdSaWdodDogJ3BhZGRpbmdSaWdodCcsXG4gICAgaXRlbVNwYWNpbmc6ICdnYXAnLFxuICAgIGNvcm5lclJhZGl1czogJ2JvcmRlclJhZGl1cycsXG4gICAgdG9wTGVmdFJhZGl1czogJ2JvcmRlclRvcExlZnRSYWRpdXMnLCB0b3BSaWdodFJhZGl1czogJ2JvcmRlclRvcFJpZ2h0UmFkaXVzJyxcbiAgICBib3R0b21MZWZ0UmFkaXVzOiAnYm9yZGVyQm90dG9tTGVmdFJhZGl1cycsIGJvdHRvbVJpZ2h0UmFkaXVzOiAnYm9yZGVyQm90dG9tUmlnaHRSYWRpdXMnLFxuICAgIHN0cm9rZVdlaWdodDogJ2JvcmRlcldpZHRoJyxcbiAgICBmb250U2l6ZTogJ2ZvbnRTaXplJywgbGluZUhlaWdodDogJ2xpbmVIZWlnaHQnLCBsZXR0ZXJTcGFjaW5nOiAnbGV0dGVyU3BhY2luZycsXG4gIH07XG4gIGZvciAoY29uc3QgW2ZpZ21hS2V5LCBjc3NLZXldIG9mIE9iamVjdC5lbnRyaWVzKG51bWVyaWNNYXApKSB7XG4gICAgaWYgKGJ2W2ZpZ21hS2V5XSkge1xuICAgICAgY29uc3QgcmVmID0gcmVzb2x2ZShidltmaWdtYUtleV0pO1xuICAgICAgaWYgKHJlZikgb3V0W2Nzc0tleV0gPSByZWY7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKG91dCkubGVuZ3RoID4gMCA/IG91dCA6IG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBjb21wb25lbnQtaW5zdGFuY2UgbWV0YWRhdGE6IG1haW4gY29tcG9uZW50IG5hbWUgKyB2YXJpYW50XG4gKiAvIGJvb2xlYW4gLyB0ZXh0IHByb3BlcnRpZXMuIFJldHVybnMgbnVsbCBmb3Igbm9uLWluc3RhbmNlIG5vZGVzLlxuICogVGhpcyBpcyB0aGUga2V5IHNpZ25hbCB0aGUgYWdlbnQgdXNlcyB0byBkZWR1cGUgcmVwZWF0ZWQgY2FyZHMsIGJ1dHRvbnMsXG4gKiBhbmQgaWNvbnMgaW50byBzaGFyZWQgQUNGIGJsb2NrcyBpbnN0ZWFkIG9mIGlubGluaW5nIGVhY2ggb25lLlxuICovXG5mdW5jdGlvbiBleHRyYWN0Q29tcG9uZW50SW5zdGFuY2Uobm9kZTogU2NlbmVOb2RlKTogQ29tcG9uZW50SW5zdGFuY2VJbmZvIHwgbnVsbCB7XG4gIGlmIChub2RlLnR5cGUgIT09ICdJTlNUQU5DRScpIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IGluc3QgPSBub2RlIGFzIEluc3RhbmNlTm9kZTtcbiAgICBsZXQgbmFtZSA9IGluc3QubmFtZTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWFpbiA9IGluc3QubWFpbkNvbXBvbmVudDtcbiAgICAgIGlmIChtYWluKSB7XG4gICAgICAgIG5hbWUgPSBtYWluLnBhcmVudD8udHlwZSA9PT0gJ0NPTVBPTkVOVF9TRVQnID8gKG1haW4ucGFyZW50IGFzIGFueSkubmFtZSA6IG1haW4ubmFtZTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gICAgY29uc3QgcHJvcGVydGllczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgYm9vbGVhbiB8IG51bWJlcj4gPSB7fTtcbiAgICBjb25zdCBwcm9wcyA9IChpbnN0IGFzIGFueSkuY29tcG9uZW50UHJvcGVydGllcztcbiAgICBpZiAocHJvcHMgJiYgdHlwZW9mIHByb3BzID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWxdIG9mIE9iamVjdC5lbnRyaWVzKHByb3BzKSkge1xuICAgICAgICBjb25zdCB2ID0gKHZhbCBhcyBhbnkpPy52YWx1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdiA9PT0gJ2Jvb2xlYW4nIHx8IHR5cGVvZiB2ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHByb3BlcnRpZXNba2V5XSA9IHY7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgbmFtZSwgcHJvcGVydGllcyB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3QgYWx0IHRleHQgZm9yIGFuIGltYWdlLiBTb3VyY2UgcHJpb3JpdHk6IGNvbXBvbmVudCBkZXNjcmlwdGlvblxuICogKGZvciBJTlNUQU5DRSAvIENPTVBPTkVOVCBub2RlcykgXHUyMTkyIGh1bWFuaXplZCBsYXllciBuYW1lLiBSZXR1cm5zIGVtcHR5XG4gKiBzdHJpbmcgd2hlbiB0aGUgbGF5ZXIgaXMgbmFtZWQgZ2VuZXJpY2FsbHkgKFJlY3RhbmdsZSAxMiwgSW1hZ2UgMywgZXRjLikuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RBbHRUZXh0KG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJykge1xuICAgICAgY29uc3QgbWFpbiA9IChub2RlIGFzIEluc3RhbmNlTm9kZSkubWFpbkNvbXBvbmVudDtcbiAgICAgIGlmIChtYWluICYmIG1haW4uZGVzY3JpcHRpb24gJiYgbWFpbi5kZXNjcmlwdGlvbi50cmltKCkpIHJldHVybiBtYWluLmRlc2NyaXB0aW9uLnRyaW0oKTtcbiAgICB9XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcpIHtcbiAgICAgIGNvbnN0IGRlc2MgPSAobm9kZSBhcyBDb21wb25lbnROb2RlKS5kZXNjcmlwdGlvbjtcbiAgICAgIGlmIChkZXNjICYmIGRlc2MudHJpbSgpKSByZXR1cm4gZGVzYy50cmltKCk7XG4gICAgfVxuICB9IGNhdGNoIHt9XG4gIGlmICghbm9kZS5uYW1lIHx8IGlzRGVmYXVsdExheWVyTmFtZShub2RlLm5hbWUpKSByZXR1cm4gJyc7XG4gIHJldHVybiBub2RlLm5hbWUucmVwbGFjZSgvWy1fXS9nLCAnICcpLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKCkucmVwbGFjZSgvXFxiXFx3L2csIGMgPT4gYy50b1VwcGVyQ2FzZSgpKTtcbn1cblxuLyoqXG4gKiBNYXAgRmlnbWEncyBJTUFHRSBmaWxsIHNjYWxlTW9kZSB0byBDU1Mgb2JqZWN0LWZpdC5cbiAqICAgRklMTCAoZGVmYXVsdCkgXHUyMTkyIGNvdmVyXG4gKiAgIEZJVCAgICAgICAgICAgIFx1MjE5MiBjb250YWluIChpbWFnZSB2aXNpYmxlIGluIGZ1bGwsIGxldHRlcmJveCBpZiBuZWVkZWQpXG4gKiAgIENST1AgICAgICAgICAgIFx1MjE5MiBjb3ZlciAob2JqZWN0LXBvc2l0aW9uIGhhbmRsZWQgc2VwYXJhdGVseSB2aWEgaW1hZ2VUcmFuc2Zvcm0pXG4gKiAgIFRJTEUgICAgICAgICAgIFx1MjE5MiBjb3ZlciAobm8gZGlyZWN0IENTUyBlcXVpdmFsZW50KVxuICovXG5mdW5jdGlvbiBnZXRJbWFnZU9iamVjdEZpdChub2RlOiBhbnkpOiBzdHJpbmcge1xuICBpZiAoIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiAnY292ZXInO1xuICBjb25zdCBpbWdGaWxsID0gbm9kZS5maWxscy5maW5kKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpIGFzIEltYWdlUGFpbnQgfCB1bmRlZmluZWQ7XG4gIGlmICghaW1nRmlsbCkgcmV0dXJuICdjb3Zlcic7XG4gIHN3aXRjaCAoaW1nRmlsbC5zY2FsZU1vZGUpIHtcbiAgICBjYXNlICdGSVQnOiByZXR1cm4gJ2NvbnRhaW4nO1xuICAgIGNhc2UgJ0ZJTEwnOlxuICAgIGNhc2UgJ0NST1AnOlxuICAgIGNhc2UgJ1RJTEUnOlxuICAgIGRlZmF1bHQ6IHJldHVybiAnY292ZXInO1xuICB9XG59XG5cbi8qKlxuICogQXBwbHkgdGhlIHNoYXJlZCBvcHRpb25hbC1zaWduYWwgZmllbGRzIChjb21wb25lbnRJbnN0YW5jZSwgd2lkdGhNb2RlLFxuICogaGVpZ2h0TW9kZSwgdmFyQmluZGluZ3MpIHRvIGFuIGVsZW1lbnQuIENlbnRyYWxpemVkIHNvIGV2ZXJ5IGVsZW1lbnRcbiAqIGtpbmQgKHRleHQsIGltYWdlLCBidXR0b24sIGlucHV0KSBiZW5lZml0cyBjb25zaXN0ZW50bHkuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5Q29tbW9uU2lnbmFscyhlbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+LCBub2RlOiBTY2VuZU5vZGUpOiB2b2lkIHtcbiAgY29uc3QgY21wID0gZXh0cmFjdENvbXBvbmVudEluc3RhbmNlKG5vZGUpO1xuICBpZiAoY21wKSBlbGVtLmNvbXBvbmVudEluc3RhbmNlID0gY21wO1xuXG4gIGNvbnN0IHNpemUgPSBleHRyYWN0U2l6aW5nTW9kZXMobm9kZSk7XG4gIGlmIChzaXplLndpZHRoTW9kZSkgZWxlbS53aWR0aE1vZGUgPSBzaXplLndpZHRoTW9kZTtcbiAgaWYgKHNpemUuaGVpZ2h0TW9kZSkgZWxlbS5oZWlnaHRNb2RlID0gc2l6ZS5oZWlnaHRNb2RlO1xuXG4gIGNvbnN0IHZhcnMgPSBleHRyYWN0Qm91bmRWYXJpYWJsZXMobm9kZSk7XG4gIGlmICh2YXJzKSBlbGVtLnZhckJpbmRpbmdzID0gdmFycztcbn1cblxuLyoqXG4gKiBSZWFkIG5vZGUub3BhY2l0eSBhbmQgcmV0dXJuIGl0IHdoZW4gYmVsb3cgMSAocm91bmRlZCB0byAyIGRlY2ltYWxzKS5cbiAqIFJldHVybnMgbnVsbCBmb3IgZnVsbHkgb3BhcXVlIG5vZGVzIG9yIHdoZW4gdGhlIHByb3BlcnR5IGlzIGFic2VudC5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdE9wYWNpdHkobm9kZTogYW55KTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICghKCdvcGFjaXR5JyBpbiBub2RlKSB8fCB0eXBlb2Ygbm9kZS5vcGFjaXR5ICE9PSAnbnVtYmVyJykgcmV0dXJuIG51bGw7XG4gIGlmIChub2RlLm9wYWNpdHkgPj0gMSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBNYXRoLnJvdW5kKG5vZGUub3BhY2l0eSAqIDEwMCkgLyAxMDA7XG59XG5cbi8qKlxuICogRGVjaWRlIHdoZXRoZXIgYSBub24tdGV4dCwgbm9uLWltYWdlLCBub24tYnV0dG9uLCBub24taW5wdXQgZnJhbWUgY2Fycmllc1xuICogZW5vdWdoIHZpc3VhbCBzdHlsaW5nIChmaWxsLCBzdHJva2UsIHJhZGl1cywgc2hhZG93LCByZWR1Y2VkIG9wYWNpdHkpIHRvXG4gKiB3YXJyYW50IGJlaW5nIGVtaXR0ZWQgYXMgYSBjb250YWluZXIgZWxlbWVudC4gUGxhaW4gc3RydWN0dXJhbCB3cmFwcGVyc1xuICogd2l0aCBubyBzdHlsaW5nIHJldHVybiBmYWxzZSBzbyB3ZSBkb24ndCBmbG9vZCBvdXRwdXQgd2l0aCBlbXB0eSBlbnRyaWVzLlxuICovXG5mdW5jdGlvbiBoYXNDb250YWluZXJTdHlsaW5nKG5vZGU6IFNjZW5lTm9kZSk6IGJvb2xlYW4ge1xuICBjb25zdCBuID0gbm9kZSBhcyBhbnk7XG4gIGlmIChleHRyYWN0QmFja2dyb3VuZENvbG9yKG4pKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKGV4dHJhY3RHcmFkaWVudChuKSkgcmV0dXJuIHRydWU7XG4gIGlmIChleHRyYWN0U3Ryb2tlQ29sb3IobikpIHJldHVybiB0cnVlO1xuICBjb25zdCBjb3JuZXJzID0gZXh0cmFjdFBlckNvcm5lclJhZGl1cyhuKTtcbiAgaWYgKGNvcm5lcnMpIHJldHVybiB0cnVlO1xuICBjb25zdCBmeCA9IGV4dHJhY3RFZmZlY3RzKG4pO1xuICBpZiAoZnguYm94U2hhZG93IHx8IGZ4LmZpbHRlciB8fCBmeC5iYWNrZHJvcEZpbHRlcikgcmV0dXJuIHRydWU7XG4gIGlmIChleHRyYWN0T3BhY2l0eShuKSAhPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBXYWxrIGFuIGljb24gc3VidHJlZSB0byBmaW5kIGl0cyBwcmltYXJ5IFNPTElEIGZpbGwgY29sb3IuIFVzZWQgdG9cbiAqIHN1Z2dlc3QgYSBDU1MgY29sb3IgZm9yIHRoZSBpbmxpbmVkIFNWRyAodGhlIGFnZW50IGNhbiBvdmVycmlkZSB3aXRoXG4gKiBgY3VycmVudENvbG9yYCBpZiBpdCB3YW50cyB0aGUgaWNvbiB0byBpbmhlcml0KS4gUmV0dXJucyBudWxsIHdoZW4gbm9cbiAqIHNvbGlkIGZpbGwgaXMgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGZpbmRGaXJzdFNvbGlkRmlsbENvbG9yKG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBmaWxscyA9IChub2RlIGFzIGFueSkuZmlsbHM7XG4gIGlmIChBcnJheS5pc0FycmF5KGZpbGxzKSkge1xuICAgIGZvciAoY29uc3QgZiBvZiBmaWxscykge1xuICAgICAgaWYgKGYgJiYgZi50eXBlID09PSAnU09MSUQnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UgJiYgZi5jb2xvcikge1xuICAgICAgICByZXR1cm4gcmdiVG9IZXgoZi5jb2xvcik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZC52aXNpYmxlID09PSBmYWxzZSkgY29udGludWU7XG4gICAgICBjb25zdCBjID0gZmluZEZpcnN0U29saWRGaWxsQ29sb3IoY2hpbGQpO1xuICAgICAgaWYgKGMpIHJldHVybiBjO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBCdWlsZCBhbiBlbGVtZW50IGVudHJ5IGZvciBhbiBpY29uIG5vZGUuIEVuY29kZXMgdGhlIFNWRyBmaWxlbmFtZSBzb1xuICogdGhlIGFnZW50IGtub3dzIHdoaWNoIGZpbGUgdG8gaW5saW5lLCBwbHVzIGRpbWVuc2lvbnMsIGFsdCB0ZXh0LCBhbmRcbiAqIGEgc3VnZ2VzdGVkIGZpbGwgY29sb3IuXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkSWNvbkVsZW1lbnQobm9kZTogU2NlbmVOb2RlLCBmaWxlbmFtZTogc3RyaW5nKTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiB7XG4gIGNvbnN0IGJiID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICBjb25zdCBlbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge1xuICAgIGljb25GaWxlOiBmaWxlbmFtZSxcbiAgICB3aWR0aDogYmIgPyB0b0Nzc1ZhbHVlKE1hdGgucm91bmQoYmIud2lkdGgpKSA6IG51bGwsXG4gICAgaGVpZ2h0OiBiYiA/IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChiYi5oZWlnaHQpKSA6IG51bGwsXG4gIH07XG4gIGNvbnN0IGNvbG9yID0gZmluZEZpcnN0U29saWRGaWxsQ29sb3Iobm9kZSk7XG4gIGlmIChjb2xvcikgZWxlbS5jb2xvciA9IGNvbG9yO1xuICBjb25zdCBhbHQgPSBleHRyYWN0QWx0VGV4dChub2RlKTtcbiAgaWYgKGFsdCkgZWxlbS5hbHQgPSBhbHQ7XG4gIE9iamVjdC5hc3NpZ24oZWxlbSwgZXh0cmFjdEZsZXhDaGlsZFByb3BzKG5vZGUgYXMgYW55KSk7XG4gIGFwcGx5Q29tbW9uU2lnbmFscyhlbGVtLCBub2RlKTtcbiAgY29uc3Qgb3AgPSBleHRyYWN0T3BhY2l0eShub2RlKTtcbiAgaWYgKG9wICE9PSBudWxsKSBlbGVtLm9wYWNpdHkgPSBvcDtcbiAgY29uc3QgdHggPSBleHRyYWN0VHJhbnNmb3JtKG5vZGUgYXMgYW55KTtcbiAgaWYgKHR4LnRyYW5zZm9ybSkgZWxlbS50cmFuc2Zvcm0gPSB0eC50cmFuc2Zvcm07XG4gIGNvbnN0IGhyZWYgPSBleHRyYWN0TGlua1VybChub2RlIGFzIGFueSk7XG4gIGlmIChocmVmKSBlbGVtLmxpbmtVcmwgPSBocmVmO1xuICByZXR1cm4gZWxlbTtcbn1cblxuLyoqXG4gKiBGaW5kIGFuZCBjbGFzc2lmeSBhbGwgbWVhbmluZ2Z1bCBlbGVtZW50cyB3aXRoaW4gYSBzZWN0aW9uLlxuICogV2Fsa3MgdGhlIG5vZGUgdHJlZSBhbmQgZXh0cmFjdHMgdHlwb2dyYXBoeSBmb3IgVEVYVCBub2RlcyxcbiAqIGRpbWVuc2lvbnMgZm9yIGltYWdlIGNvbnRhaW5lcnMsIGV0Yy5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEVsZW1lbnRzKFxuICBzZWN0aW9uTm9kZTogU2NlbmVOb2RlLFxuICBpY29uTWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuKTogUmVjb3JkPHN0cmluZywgUGFydGlhbDxFbGVtZW50U3R5bGVzPj4ge1xuICBjb25zdCBlbGVtZW50czogUmVjb3JkPHN0cmluZywgUGFydGlhbDxFbGVtZW50U3R5bGVzPj4gPSB7fTtcbiAgbGV0IHRleHRJbmRleCA9IDA7XG4gIGxldCBpbWFnZUluZGV4ID0gMDtcbiAgbGV0IGljb25JbmRleCA9IDA7XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIpIHtcbiAgICAvLyBJY29uIHJvb3RzIFx1MjE5MiBlbWl0IGljb25GaWxlIHJlZmVyZW5jZSBhbmQgc3RvcC4gaWNvbk1hcCBpcyBidWlsdCBieVxuICAgIC8vIGljb24tZGV0ZWN0b3IgYW5kIHNoYXJlZCB3aXRoIGltYWdlLWV4cG9ydGVyLCBzbyB0aGUgZmlsZW5hbWUgaGVyZVxuICAgIC8vIG1hdGNoZXMgZXhhY3RseSB3aGF0IGdldHMgd3JpdHRlbiBpbnRvIHBhZ2VzLzxzbHVnPi9pbWFnZXMvLlxuICAgIGNvbnN0IGljb25GaWxlbmFtZSA9IGljb25NYXAuZ2V0KG5vZGUuaWQpO1xuICAgIGlmIChpY29uRmlsZW5hbWUpIHtcbiAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIGNvbnN0IHJvbGUgPSBjbGVhbk5hbWUgJiYgIS9eKHZlY3RvcnxpY29ufGZyYW1lfGdyb3VwfHJlY3RhbmdsZXxlbGxpcHNlfGJvb2xlYW4pXFxkKiQvLnRlc3QoY2xlYW5OYW1lKVxuICAgICAgICA/IGNsZWFuTmFtZVxuICAgICAgICA6IGBpY29uJHtpY29uSW5kZXggPiAwID8gJ18nICsgaWNvbkluZGV4IDogJyd9YDtcbiAgICAgIGlmICghZWxlbWVudHNbcm9sZV0pIHtcbiAgICAgICAgZWxlbWVudHNbcm9sZV0gPSBidWlsZEljb25FbGVtZW50KG5vZGUsIGljb25GaWxlbmFtZSk7XG4gICAgICB9XG4gICAgICBpY29uSW5kZXgrKztcbiAgICAgIHJldHVybjsgLy8gZG9uJ3QgZGVzY2VuZCBpbnRvIHRoZSBpY29uJ3MgdmVjdG9yIGNoaWxkcmVuXG4gICAgfVxuXG4gICAgLy8gVEVYVCBub2RlcyBcdTIxOTIgdHlwb2dyYXBoeSArIHRleHQgY29udGVudFxuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgdHlwbyA9IGV4dHJhY3RUeXBvZ3JhcGh5KG5vZGUpO1xuICAgICAgY29uc3QgZm9udFNpemUgPSBub2RlLmZvbnRTaXplICE9PSBmaWdtYS5taXhlZCA/IChub2RlLmZvbnRTaXplIGFzIG51bWJlcikgOiAxNjtcblxuICAgICAgLy8gQ2xhc3NpZnkgYnkgcm9sZTogaGVhZGluZ3MgYXJlIGxhcmdlciwgYm9keSB0ZXh0IGlzIHNtYWxsZXJcbiAgICAgIGxldCByb2xlOiBzdHJpbmc7XG4gICAgICBpZiAodGV4dEluZGV4ID09PSAwICYmIGZvbnRTaXplID49IDI4KSB7XG4gICAgICAgIHJvbGUgPSAnaGVhZGluZyc7XG4gICAgICB9IGVsc2UgaWYgKHRleHRJbmRleCA9PT0gMSAmJiBmb250U2l6ZSA+PSAxNikge1xuICAgICAgICByb2xlID0gJ3N1YmhlYWRpbmcnO1xuICAgICAgfSBlbHNlIGlmIChub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYnV0dG9uJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2N0YScpKSB7XG4gICAgICAgIHJvbGUgPSAnYnV0dG9uX3RleHQnO1xuICAgICAgfSBlbHNlIGlmIChub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY2FwdGlvbicpIHx8IGZvbnRTaXplIDw9IDE0KSB7XG4gICAgICAgIHJvbGUgPSBgY2FwdGlvbiR7dGV4dEluZGV4ID4gMiA/ICdfJyArIHRleHRJbmRleCA6ICcnfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByb2xlID0gYHRleHRfJHt0ZXh0SW5kZXh9YDtcbiAgICAgIH1cblxuICAgICAgLy8gVXNlIHRoZSBsYXllciBuYW1lIGlmIGl0J3Mgbm90IGEgZGVmYXVsdCBuYW1lXG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBpZiAoY2xlYW5OYW1lICYmICEvXih0ZXh0fGZyYW1lfGdyb3VwfHJlY3RhbmdsZSlcXGQqJC8udGVzdChjbGVhbk5hbWUpKSB7XG4gICAgICAgIHJvbGUgPSBjbGVhbk5hbWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEV4dHJhY3QgYWN0dWFsIHRleHQgY29udGVudCBmb3IgY29udGVudCBwb3B1bGF0aW9uIGFuZCBjb250ZXh0XG4gICAgICB0eXBvLnRleHRDb250ZW50ID0gbm9kZS5jaGFyYWN0ZXJzIHx8IG51bGw7XG5cbiAgICAgIC8vIFBlci1zaWRlIG1hcmdpbnMgZnJvbSBzaWJsaW5nIHNwYWNpbmcgKHRvcC9yaWdodC9ib3R0b20vbGVmdClcbiAgICAgIE9iamVjdC5hc3NpZ24odHlwbywgZXh0cmFjdFBlclNpZGVNYXJnaW5zKG5vZGUpKTtcblxuICAgICAgLy8gRmxleC1jaGlsZCBwcm9wZXJ0aWVzIChsYXlvdXRHcm93IC8gbGF5b3V0QWxpZ24pXG4gICAgICBPYmplY3QuYXNzaWduKHR5cG8sIGV4dHJhY3RGbGV4Q2hpbGRQcm9wcyhub2RlKSk7XG5cbiAgICAgIC8vIFRyYW5zZm9ybSAocm90YXRlL3NjYWxlKSBpZiBub24taWRlbnRpdHlcbiAgICAgIGNvbnN0IHR4ID0gZXh0cmFjdFRyYW5zZm9ybShub2RlKTtcbiAgICAgIGlmICh0eC50cmFuc2Zvcm0pIHR5cG8udHJhbnNmb3JtID0gdHgudHJhbnNmb3JtO1xuXG4gICAgICAvLyBMaW5rIFVSTCBmcm9tIHByb3RvdHlwZSBuYXZpZ2F0aW9uXG4gICAgICBjb25zdCBocmVmID0gZXh0cmFjdExpbmtVcmwobm9kZSk7XG4gICAgICBpZiAoaHJlZikgdHlwby5saW5rVXJsID0gaHJlZjtcblxuICAgICAgLy8gTWF4IHdpZHRoIGlmIGNvbnN0cmFpbmVkXG4gICAgICBpZiAobm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmIG5vZGUucGFyZW50Py50eXBlID09PSAnRlJBTUUnKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudFdpZHRoID0gKG5vZGUucGFyZW50IGFzIEZyYW1lTm9kZSkuYWJzb2x1dGVCb3VuZGluZ0JveD8ud2lkdGg7XG4gICAgICAgIGlmIChwYXJlbnRXaWR0aCAmJiBub2RlLmFic29sdXRlQm91bmRpbmdCb3gud2lkdGggPCBwYXJlbnRXaWR0aCAqIDAuOSkge1xuICAgICAgICAgIHR5cG8ubWF4V2lkdGggPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQobm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94LndpZHRoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQ29tbW9uIHNpZ25hbHM6IGNvbXBvbmVudEluc3RhbmNlLCBzaXppbmcgbW9kZXMsIGJvdW5kIHZhcmlhYmxlc1xuICAgICAgYXBwbHlDb21tb25TaWduYWxzKHR5cG8sIG5vZGUpO1xuXG4gICAgICBjb25zdCB0ZXh0T3BhY2l0eSA9IGV4dHJhY3RPcGFjaXR5KG5vZGUpO1xuICAgICAgaWYgKHRleHRPcGFjaXR5ICE9PSBudWxsKSB0eXBvLm9wYWNpdHkgPSB0ZXh0T3BhY2l0eTtcblxuICAgICAgZWxlbWVudHNbcm9sZV0gPSB0eXBvO1xuICAgICAgdGV4dEluZGV4Kys7XG4gICAgfVxuXG4gICAgLy8gSU1BR0UgZmlsbHMgXHUyMTkyIGltYWdlIGVsZW1lbnQgKHdpdGggc21hcnQgYmFja2dyb3VuZCBkZXRlY3Rpb24pXG4gICAgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkgJiYgbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG5cbiAgICAgIC8vIFNtYXJ0IGJhY2tncm91bmQgaW1hZ2UgZGV0ZWN0aW9uOlxuICAgICAgLy8gMS4gTGF5ZXIgbmFtZSBjb250YWlucyAnYmFja2dyb3VuZCcgb3IgJ2JnJyBPUlxuICAgICAgLy8gMi4gSW1hZ2Ugc3BhbnMgPj0gOTAlIG9mIHRoZSBzZWN0aW9uJ3Mgd2lkdGggQU5EIGhlaWdodCAoZnVsbC1ibGVlZCBpbWFnZSlcbiAgICAgIGNvbnN0IG5hbWVIaW50c0JnID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2JhY2tncm91bmQnKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYmcnKTtcbiAgICAgIGNvbnN0IHNlY3Rpb25Cb3VuZHMgPSBzZWN0aW9uTm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgY29uc3Qgc3BhbnNTZWN0aW9uID0gc2VjdGlvbkJvdW5kcyAmJlxuICAgICAgICBib3VuZHMud2lkdGggPj0gc2VjdGlvbkJvdW5kcy53aWR0aCAqIDAuOSAmJlxuICAgICAgICBib3VuZHMuaGVpZ2h0ID49IHNlY3Rpb25Cb3VuZHMuaGVpZ2h0ICogMC45O1xuXG4gICAgICBjb25zdCBpc0JhY2tncm91bmRJbWFnZSA9IG5hbWVIaW50c0JnIHx8IHNwYW5zU2VjdGlvbjtcblxuICAgICAgY29uc3Qgcm9sZSA9IGlzQmFja2dyb3VuZEltYWdlXG4gICAgICAgID8gJ2JhY2tncm91bmRfaW1hZ2UnXG4gICAgICAgIDogYGltYWdlJHtpbWFnZUluZGV4ID4gMCA/ICdfJyArIGltYWdlSW5kZXggOiAnJ31gO1xuXG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBjb25zdCBmaW5hbFJvbGUgPSBjbGVhbk5hbWUgJiYgIS9eKGltYWdlfHJlY3RhbmdsZXxmcmFtZSlcXGQqJC8udGVzdChjbGVhbk5hbWUpID8gY2xlYW5OYW1lIDogcm9sZTtcblxuICAgICAgLy8gRGV0ZWN0IG1hc2svY2xpcCBvbiBpbWFnZSBvciBpdHMgcGFyZW50IGNvbnRhaW5lclxuICAgICAgY29uc3QgcGFyZW50RnJhbWUgPSBub2RlLnBhcmVudDtcbiAgICAgIGNvbnN0IHBhcmVudENsaXBzID0gcGFyZW50RnJhbWUgJiYgJ2NsaXBzQ29udGVudCcgaW4gcGFyZW50RnJhbWUgJiYgKHBhcmVudEZyYW1lIGFzIGFueSkuY2xpcHNDb250ZW50ID09PSB0cnVlO1xuICAgICAgY29uc3QgaXNNYXNrZWQgPSAoJ2lzTWFzaycgaW4gbm9kZSAmJiAobm9kZSBhcyBhbnkpLmlzTWFzayA9PT0gdHJ1ZSkgfHwgcGFyZW50Q2xpcHM7XG4gICAgICAvLyBEZXRlY3QgY2lyY3VsYXIvcm91bmRlZCBjbGlwczogaWYgcGFyZW50IGhhcyBlcXVhbCBjb3JuZXJSYWRpdXMgYW5kIGlzIHJvdWdobHkgc3F1YXJlXG4gICAgICBsZXQgY2xpcEJvcmRlclJhZGl1czogc3RyaW5nIHwgbnVsbCA9ICdjb3JuZXJSYWRpdXMnIGluIG5vZGUgJiYgdHlwZW9mIChub2RlIGFzIGFueSkuY29ybmVyUmFkaXVzID09PSAnbnVtYmVyJ1xuICAgICAgICA/IHRvQ3NzVmFsdWUoKG5vZGUgYXMgYW55KS5jb3JuZXJSYWRpdXMpXG4gICAgICAgIDogbnVsbDtcbiAgICAgIGlmICghY2xpcEJvcmRlclJhZGl1cyAmJiBwYXJlbnRGcmFtZSAmJiAnY29ybmVyUmFkaXVzJyBpbiBwYXJlbnRGcmFtZSAmJiB0eXBlb2YgKHBhcmVudEZyYW1lIGFzIGFueSkuY29ybmVyUmFkaXVzID09PSAnbnVtYmVyJykge1xuICAgICAgICBjb25zdCBwYXJlbnRDb3JuZXIgPSAocGFyZW50RnJhbWUgYXMgYW55KS5jb3JuZXJSYWRpdXMgYXMgbnVtYmVyO1xuICAgICAgICBpZiAocGFyZW50Q29ybmVyID4gMCkge1xuICAgICAgICAgIGNvbnN0IHBhcmVudEJvdW5kcyA9IChwYXJlbnRGcmFtZSBhcyBhbnkpLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICAgICAgLy8gSWYgcGFyZW50IGlzIHJvdWdobHkgc3F1YXJlIGFuZCBjb3JuZXJSYWRpdXMgPj0gaGFsZiB0aGUgd2lkdGggXHUyMTkyIGNpcmNsZVxuICAgICAgICAgIGlmIChwYXJlbnRCb3VuZHMgJiYgTWF0aC5hYnMocGFyZW50Qm91bmRzLndpZHRoIC0gcGFyZW50Qm91bmRzLmhlaWdodCkgPCA1ICYmIHBhcmVudENvcm5lciA+PSBwYXJlbnRCb3VuZHMud2lkdGggLyAyIC0gMikge1xuICAgICAgICAgICAgY2xpcEJvcmRlclJhZGl1cyA9ICc1MCUnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGlwQm9yZGVyUmFkaXVzID0gdG9Dc3NWYWx1ZShwYXJlbnRDb3JuZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBpbWdFZmZlY3RzID0gZXh0cmFjdEVmZmVjdHMobm9kZSBhcyBhbnkpO1xuICAgICAgY29uc3QgaW1nT2JqZWN0UG9zaXRpb24gPSBleHRyYWN0T2JqZWN0UG9zaXRpb24obm9kZSk7XG4gICAgICBjb25zdCBpbWdDb3JuZXJzID0gZXh0cmFjdFBlckNvcm5lclJhZGl1cyhub2RlIGFzIGFueSk7XG4gICAgICBjb25zdCBpbWdFbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge1xuICAgICAgICB3aWR0aDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnMTAwJScgOiB0b0Nzc1ZhbHVlKE1hdGgucm91bmQoYm91bmRzLndpZHRoKSksXG4gICAgICAgIGhlaWdodDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnMTAwJScgOiAnYXV0bycsXG4gICAgICAgIGFzcGVjdFJhdGlvOiBpc0JhY2tncm91bmRJbWFnZSA/IG51bGwgOiBjb21wdXRlQXNwZWN0UmF0aW8oYm91bmRzLndpZHRoLCBib3VuZHMuaGVpZ2h0KSxcbiAgICAgICAgb2JqZWN0Rml0OiBnZXRJbWFnZU9iamVjdEZpdChub2RlIGFzIGFueSksXG4gICAgICAgIG9iamVjdFBvc2l0aW9uOiBpbWdPYmplY3RQb3NpdGlvbixcbiAgICAgICAgb3ZlcmZsb3c6IChwYXJlbnRDbGlwcyB8fCBjbGlwQm9yZGVyUmFkaXVzKSA/ICdoaWRkZW4nIDogbnVsbCxcbiAgICAgICAgaGFzTWFzazogaXNNYXNrZWQgfHwgbnVsbCxcbiAgICAgICAgYm94U2hhZG93OiBpbWdFZmZlY3RzLmJveFNoYWRvdyxcbiAgICAgICAgZmlsdGVyOiBpbWdFZmZlY3RzLmZpbHRlcixcbiAgICAgICAgLy8gTWFyayBiYWNrZ3JvdW5kIGltYWdlcyB3aXRoIHBvc2l0aW9uIGRhdGEgc28gYWdlbnRzIGtub3cgdG8gdXNlIENTUyBiYWNrZ3JvdW5kLWltYWdlXG4gICAgICAgIHBvc2l0aW9uOiBpc0JhY2tncm91bmRJbWFnZSA/ICdhYnNvbHV0ZScgOiBudWxsLFxuICAgICAgICB0b3A6IGlzQmFja2dyb3VuZEltYWdlID8gJzBweCcgOiBudWxsLFxuICAgICAgICBsZWZ0OiBpc0JhY2tncm91bmRJbWFnZSA/ICcwcHgnIDogbnVsbCxcbiAgICAgICAgekluZGV4OiBpc0JhY2tncm91bmRJbWFnZSA/IDAgOiBudWxsLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGltZ0FsdCA9IGV4dHJhY3RBbHRUZXh0KG5vZGUpO1xuICAgICAgaWYgKGltZ0FsdCkgaW1nRWxlbS5hbHQgPSBpbWdBbHQ7XG4gICAgICBhcHBseUNvbW1vblNpZ25hbHMoaW1nRWxlbSwgbm9kZSk7XG4gICAgICAvLyBBcHBseSByYWRpdXMgXHUyMDE0IHBlci1jb3JuZXIgaWYgbm9kZSBoYXMgZGlmZmVyaW5nIGNvcm5lcnMsIHVuaWZvcm0gb3RoZXJ3aXNlXG4gICAgICBpZiAoaW1nQ29ybmVycykge1xuICAgICAgICBpZiAoaW1nQ29ybmVycy51bmlmb3JtICE9PSBudWxsKSB7XG4gICAgICAgICAgaW1nRWxlbS5ib3JkZXJSYWRpdXMgPSB0b0Nzc1ZhbHVlKGltZ0Nvcm5lcnMudW5pZm9ybSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW1nRWxlbS5ib3JkZXJUb3BMZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLnRvcExlZnQpO1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyVG9wUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGltZ0Nvcm5lcnMudG9wUmlnaHQpO1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyQm90dG9tTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoaW1nQ29ybmVycy5ib3R0b21MZWZ0KTtcbiAgICAgICAgICBpbWdFbGVtLmJvcmRlckJvdHRvbVJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLmJvdHRvbVJpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjbGlwQm9yZGVyUmFkaXVzKSB7XG4gICAgICAgIGltZ0VsZW0uYm9yZGVyUmFkaXVzID0gY2xpcEJvcmRlclJhZGl1cztcbiAgICAgIH1cbiAgICAgIC8vIEZsZXgtY2hpbGQgcHJvcHMgaWYgaW1hZ2UgaXMgaW5zaWRlIGFuIGF1dG8tbGF5b3V0IHJvd1xuICAgICAgT2JqZWN0LmFzc2lnbihpbWdFbGVtLCBleHRyYWN0RmxleENoaWxkUHJvcHMobm9kZSkpO1xuICAgICAgY29uc3QgaW1nT3BhY2l0eSA9IGV4dHJhY3RPcGFjaXR5KG5vZGUpO1xuICAgICAgaWYgKGltZ09wYWNpdHkgIT09IG51bGwpIGltZ0VsZW0ub3BhY2l0eSA9IGltZ09wYWNpdHk7XG4gICAgICBlbGVtZW50c1tmaW5hbFJvbGVdID0gaW1nRWxlbTtcbiAgICAgIGltYWdlSW5kZXgrKztcbiAgICB9XG5cbiAgICAvLyBCdXR0b24tbGlrZSBmcmFtZXMgKHNtYWxsIGZyYW1lcyB3aXRoIHRleHQgKyBmaWxsKVxuICAgIGlmICgobm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnKSAmJlxuICAgICAgICBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYnV0dG9uJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2J0bicpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjdGEnKSkge1xuICAgICAgY29uc3QgZnJhbWUgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgIGNvbnN0IGJnID0gZXh0cmFjdEJhY2tncm91bmRDb2xvcihmcmFtZSk7XG4gICAgICBjb25zdCBib3VuZHMgPSBmcmFtZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuXG4gICAgICBpZiAoYmcgJiYgYm91bmRzKSB7XG4gICAgICAgIGNvbnN0IGJ1dHRvblN0eWxlczogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGJnLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChmcmFtZS5sYXlvdXRNb2RlICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICAgIGJ1dHRvblN0eWxlcy5wYWRkaW5nVG9wID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nVG9wKTtcbiAgICAgICAgICBidXR0b25TdHlsZXMucGFkZGluZ0JvdHRvbSA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ0JvdHRvbSk7XG4gICAgICAgICAgYnV0dG9uU3R5bGVzLnBhZGRpbmdMZWZ0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nTGVmdCk7XG4gICAgICAgICAgYnV0dG9uU3R5bGVzLnBhZGRpbmdSaWdodCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ1JpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5UmFkaXVzKGJ1dHRvblN0eWxlcywgZnJhbWUpO1xuICAgICAgICBhcHBseVN0cm9rZXMoYnV0dG9uU3R5bGVzLCBmcmFtZSk7XG4gICAgICAgIGNvbnN0IGJ0bkVmZmVjdHMgPSBleHRyYWN0RWZmZWN0cyhmcmFtZSBhcyBhbnkpO1xuICAgICAgICBpZiAoYnRuRWZmZWN0cy5ib3hTaGFkb3cpIGJ1dHRvblN0eWxlcy5ib3hTaGFkb3cgPSBidG5FZmZlY3RzLmJveFNoYWRvdztcbiAgICAgICAgaWYgKGJ0bkVmZmVjdHMuZmlsdGVyKSBidXR0b25TdHlsZXMuZmlsdGVyID0gYnRuRWZmZWN0cy5maWx0ZXI7XG5cbiAgICAgICAgY29uc3QgdHggPSBleHRyYWN0VHJhbnNmb3JtKGZyYW1lIGFzIGFueSk7XG4gICAgICAgIGlmICh0eC50cmFuc2Zvcm0pIGJ1dHRvblN0eWxlcy50cmFuc2Zvcm0gPSB0eC50cmFuc2Zvcm07XG5cbiAgICAgICAgLy8gTGluayBVUkwgZnJvbSBwcm90b3R5cGUgT1BFTl9VUkwgYWN0aW9uXG4gICAgICAgIGNvbnN0IGhyZWYgPSBleHRyYWN0TGlua1VybChmcmFtZSk7XG4gICAgICAgIGlmIChocmVmKSBidXR0b25TdHlsZXMubGlua1VybCA9IGhyZWY7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgdGV4dCBub2RlIGluc2lkZSB0aGUgYnV0dG9uIGZvciB0eXBvZ3JhcGh5XG4gICAgICAgIGNvbnN0IHRleHRDaGlsZCA9IGZpbmRGaXJzdFRleHROb2RlKGZyYW1lKTtcbiAgICAgICAgaWYgKHRleHRDaGlsZCkge1xuICAgICAgICAgIGNvbnN0IHR5cG8gPSBleHRyYWN0VHlwb2dyYXBoeSh0ZXh0Q2hpbGQpO1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24oYnV0dG9uU3R5bGVzLCB0eXBvKTtcbiAgICAgICAgICBidXR0b25TdHlsZXMudGV4dENvbnRlbnQgPSB0ZXh0Q2hpbGQuY2hhcmFjdGVycyB8fCBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihidXR0b25TdHlsZXMsIGV4dHJhY3RGbGV4Q2hpbGRQcm9wcyhmcmFtZSBhcyBhbnkpKTtcblxuICAgICAgICAvLyBDb21tb24gc2lnbmFsczogY29tcG9uZW50SW5zdGFuY2UgKGJ1dHRvbiB2YXJpYW50cyEpLCBzaXppbmcsIHZhcnNcbiAgICAgICAgYXBwbHlDb21tb25TaWduYWxzKGJ1dHRvblN0eWxlcywgZnJhbWUpO1xuXG4gICAgICAgIGNvbnN0IGJ0bk9wYWNpdHkgPSBleHRyYWN0T3BhY2l0eShmcmFtZSk7XG4gICAgICAgIGlmIChidG5PcGFjaXR5ICE9PSBudWxsKSBidXR0b25TdHlsZXMub3BhY2l0eSA9IGJ0bk9wYWNpdHk7XG5cbiAgICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgICBlbGVtZW50c1tjbGVhbk5hbWUgfHwgJ2J1dHRvbiddID0gYnV0dG9uU3R5bGVzO1xuICAgICAgfVxuICAgICAgcmV0dXJuOyAvLyBEb24ndCByZWN1cnNlIGludG8gYnV0dG9uIGludGVybmFsc1xuICAgIH1cblxuICAgIC8vIElucHV0LWxpa2UgZnJhbWVzIChkZXRlY3QgaW5wdXRzIGJ5IGNvbW1vbiBsYXllciBuYW1lcylcbiAgICBpZiAoKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJykgJiZcbiAgICAgICAgL1xcYihpbnB1dHxmaWVsZHx0ZXh0Ym94fHRleHRhcmVhfHNlbGVjdHx0ZXh0ZmllbGQpXFxiL2kudGVzdChub2RlLm5hbWUpKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgY29uc3QgaW5wdXRTdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogZXh0cmFjdEJhY2tncm91bmRDb2xvcihmcmFtZSksXG4gICAgICB9O1xuICAgICAgaWYgKGZyYW1lLmxheW91dE1vZGUgJiYgZnJhbWUubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgICAgIGlucHV0U3R5bGVzLnBhZGRpbmdUb3AgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdUb3ApO1xuICAgICAgICBpbnB1dFN0eWxlcy5wYWRkaW5nQm90dG9tID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nQm90dG9tKTtcbiAgICAgICAgaW5wdXRTdHlsZXMucGFkZGluZ0xlZnQgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdMZWZ0KTtcbiAgICAgICAgaW5wdXRTdHlsZXMucGFkZGluZ1JpZ2h0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nUmlnaHQpO1xuICAgICAgfVxuICAgICAgYXBwbHlSYWRpdXMoaW5wdXRTdHlsZXMsIGZyYW1lKTtcbiAgICAgIGFwcGx5U3Ryb2tlcyhpbnB1dFN0eWxlcywgZnJhbWUpO1xuICAgICAgY29uc3QgcGxhY2Vob2xkZXJUZXh0ID0gZmluZEZpcnN0VGV4dE5vZGUoZnJhbWUpO1xuICAgICAgaWYgKHBsYWNlaG9sZGVyVGV4dCkge1xuICAgICAgICBpbnB1dFN0eWxlcy5wbGFjZWhvbGRlciA9IHBsYWNlaG9sZGVyVGV4dC5jaGFyYWN0ZXJzIHx8IG51bGw7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyVHlwbyA9IGV4dHJhY3RUeXBvZ3JhcGh5KHBsYWNlaG9sZGVyVGV4dCk7XG4gICAgICAgIGlucHV0U3R5bGVzLnBsYWNlaG9sZGVyU3R5bGVzID0ge1xuICAgICAgICAgIGNvbG9yOiBwbGFjZWhvbGRlclR5cG8uY29sb3IgfHwgbnVsbCxcbiAgICAgICAgICBmb250U2l6ZTogcGxhY2Vob2xkZXJUeXBvLmZvbnRTaXplIHx8IG51bGwsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBhcHBseUNvbW1vblNpZ25hbHMoaW5wdXRTdHlsZXMsIGZyYW1lKTtcblxuICAgICAgY29uc3QgaW5wdXRPcGFjaXR5ID0gZXh0cmFjdE9wYWNpdHkoZnJhbWUpO1xuICAgICAgaWYgKGlucHV0T3BhY2l0eSAhPT0gbnVsbCkgaW5wdXRTdHlsZXMub3BhY2l0eSA9IGlucHV0T3BhY2l0eTtcblxuICAgICAgY29uc3QgaW5wdXROYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpIHx8ICdpbnB1dCc7XG4gICAgICBlbGVtZW50c1tpbnB1dE5hbWVdID0gaW5wdXRTdHlsZXM7XG4gICAgICByZXR1cm47IC8vIERvbid0IHJlY3Vyc2UgaW50byBpbnB1dCBpbnRlcm5hbHNcbiAgICB9XG5cbiAgICAvLyBHZW5lcmljIGNvbnRhaW5lciBmcmFtZXMgXHUyMDE0IGNhcmRzLCB3cmFwcGVycywgdGlsZXMgZXRjLiBFbWl0IHN0eWxpbmcgd2hlblxuICAgIC8vIHRoZSBmcmFtZSBoYXMgYW55IHZpc3VhbCBwcm9wZXJ0aWVzIChmaWxsLCBzdHJva2UsIHJhZGl1cywgc2hhZG93LFxuICAgIC8vIG9wYWNpdHkgPCAxKS4gU2tpcCBkZXB0aCAwICh0aGF0J3MgdGhlIHNlY3Rpb24gaXRzZWxmLCBoYW5kbGVkIGJ5XG4gICAgLy8gZXh0cmFjdFNlY3Rpb25TdHlsZXMpLiBTdGlsbCByZWN1cnNlIHNvIG5lc3RlZCB0ZXh0L2ltYWdlcy9idXR0b25zIGFyZVxuICAgIC8vIGNhcHR1cmVkIGFzIHNlcGFyYXRlIGVsZW1lbnRzLlxuICAgIGlmIChkZXB0aCA+IDAgJiZcbiAgICAgICAgKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdHUk9VUCcpICYmXG4gICAgICAgICFoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpICYmXG4gICAgICAgIGhhc0NvbnRhaW5lclN0eWxpbmcobm9kZSkpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBjb25zdCBjb250YWluZXJTdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7fTtcblxuICAgICAgY29uc3QgYmcgPSBleHRyYWN0QmFja2dyb3VuZENvbG9yKGZyYW1lKTtcbiAgICAgIGlmIChiZykgY29udGFpbmVyU3R5bGVzLmJhY2tncm91bmRDb2xvciA9IGJnO1xuICAgICAgY29uc3QgZ3JhZGllbnQgPSBleHRyYWN0R3JhZGllbnQoZnJhbWUpO1xuICAgICAgaWYgKGdyYWRpZW50KSBjb250YWluZXJTdHlsZXMuYmFja2dyb3VuZEdyYWRpZW50ID0gZ3JhZGllbnQ7XG5cbiAgICAgIGlmIChmcmFtZS5sYXlvdXRNb2RlICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICBjb250YWluZXJTdHlsZXMucGFkZGluZ1RvcCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ1RvcCk7XG4gICAgICAgIGNvbnRhaW5lclN0eWxlcy5wYWRkaW5nQm90dG9tID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nQm90dG9tKTtcbiAgICAgICAgY29udGFpbmVyU3R5bGVzLnBhZGRpbmdMZWZ0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nTGVmdCk7XG4gICAgICAgIGNvbnRhaW5lclN0eWxlcy5wYWRkaW5nUmlnaHQgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdSaWdodCk7XG4gICAgICAgIGlmICh0eXBlb2YgZnJhbWUuaXRlbVNwYWNpbmcgPT09ICdudW1iZXInICYmIGZyYW1lLml0ZW1TcGFjaW5nID4gMCkge1xuICAgICAgICAgIGNvbnRhaW5lclN0eWxlcy5nYXAgPSB0b0Nzc1ZhbHVlKGZyYW1lLml0ZW1TcGFjaW5nKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhcHBseVJhZGl1cyhjb250YWluZXJTdHlsZXMsIGZyYW1lKTtcbiAgICAgIGFwcGx5U3Ryb2tlcyhjb250YWluZXJTdHlsZXMsIGZyYW1lKTtcblxuICAgICAgY29uc3QgZnggPSBleHRyYWN0RWZmZWN0cyhmcmFtZSBhcyBhbnkpO1xuICAgICAgaWYgKGZ4LmJveFNoYWRvdykgY29udGFpbmVyU3R5bGVzLmJveFNoYWRvdyA9IGZ4LmJveFNoYWRvdztcbiAgICAgIGlmIChmeC5maWx0ZXIpIGNvbnRhaW5lclN0eWxlcy5maWx0ZXIgPSBmeC5maWx0ZXI7XG4gICAgICBpZiAoZnguYmFja2Ryb3BGaWx0ZXIpIGNvbnRhaW5lclN0eWxlcy5iYWNrZHJvcEZpbHRlciA9IGZ4LmJhY2tkcm9wRmlsdGVyO1xuXG4gICAgICBjb25zdCB0eCA9IGV4dHJhY3RUcmFuc2Zvcm0oZnJhbWUgYXMgYW55KTtcbiAgICAgIGlmICh0eC50cmFuc2Zvcm0pIGNvbnRhaW5lclN0eWxlcy50cmFuc2Zvcm0gPSB0eC50cmFuc2Zvcm07XG5cbiAgICAgIGNvbnN0IGNvbnRhaW5lck9wYWNpdHkgPSBleHRyYWN0T3BhY2l0eShmcmFtZSk7XG4gICAgICBpZiAoY29udGFpbmVyT3BhY2l0eSAhPT0gbnVsbCkgY29udGFpbmVyU3R5bGVzLm9wYWNpdHkgPSBjb250YWluZXJPcGFjaXR5O1xuXG4gICAgICBPYmplY3QuYXNzaWduKGNvbnRhaW5lclN0eWxlcywgZXh0cmFjdEZsZXhDaGlsZFByb3BzKGZyYW1lIGFzIGFueSkpO1xuICAgICAgYXBwbHlDb21tb25TaWduYWxzKGNvbnRhaW5lclN0eWxlcywgZnJhbWUpO1xuXG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBjb25zdCByb2xlID0gY2xlYW5OYW1lICYmICEvXihmcmFtZXxncm91cHxyZWN0YW5nbGV8ZWxsaXBzZSlcXGQqJC8udGVzdChjbGVhbk5hbWUpXG4gICAgICAgID8gY2xlYW5OYW1lXG4gICAgICAgIDogYGNvbnRhaW5lcl8ke09iamVjdC5rZXlzKGVsZW1lbnRzKS5maWx0ZXIoayA9PiBrLnN0YXJ0c1dpdGgoJ2NvbnRhaW5lcl8nKSkubGVuZ3RoICsgMX1gO1xuICAgICAgaWYgKCFlbGVtZW50c1tyb2xlXSkge1xuICAgICAgICBlbGVtZW50c1tyb2xlXSA9IGNvbnRhaW5lclN0eWxlcztcbiAgICAgIH1cbiAgICAgIC8vIEZhbGwgdGhyb3VnaCB0byByZWN1cnNpb24gc28gbmVzdGVkIGVsZW1lbnRzIHN0aWxsIGdldCBleHRyYWN0ZWQuXG4gICAgfVxuXG4gICAgLy8gUmVjdXJzZSBpbnRvIGNoaWxkcmVuIChkZXB0aCBsaW1pdCA2IHRvIGNhcHR1cmUgZGVlcGx5IG5lc3RlZCBlbGVtZW50cylcbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlICYmIGRlcHRoIDwgNikge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIGlmIChjaGlsZC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgIHdhbGsoY2hpbGQsIGRlcHRoICsgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3YWxrKHNlY3Rpb25Ob2RlLCAwKTtcbiAgcmV0dXJuIGVsZW1lbnRzO1xufVxuXG4vKipcbiAqIEZpbmQgdGhlIGZpcnN0IFRFWFQgbm9kZSBpbiBhIHN1YnRyZWUuXG4gKi9cbmZ1bmN0aW9uIGZpbmRGaXJzdFRleHROb2RlKG5vZGU6IFNjZW5lTm9kZSk6IFRleHROb2RlIHwgbnVsbCB7XG4gIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykgcmV0dXJuIG5vZGU7XG4gIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGZvdW5kID0gZmluZEZpcnN0VGV4dE5vZGUoY2hpbGQpO1xuICAgICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgbGF5ZXIgaW5mb3JtYXRpb24gZm9yIGFsbCBtZWFuaW5nZnVsIGNoaWxkcmVuIG9mIGEgc2VjdGlvbi5cbiAqIFJldHVybnMgbGF5ZXJzIHNvcnRlZCBieSBGaWdtYSdzIGxheWVyIG9yZGVyIChiYWNrIHRvIGZyb250KS5cbiAqIEJvdW5kcyBhcmUgcmVsYXRpdmUgdG8gdGhlIHNlY3Rpb24ncyBvcmlnaW4sIG5vdCB0aGUgY2FudmFzLlxuICovXG5mdW5jdGlvbiBleHRyYWN0TGF5ZXJzKFxuICBzZWN0aW9uTm9kZTogU2NlbmVOb2RlLFxuICBlbGVtZW50czogUmVjb3JkPHN0cmluZywgUGFydGlhbDxFbGVtZW50U3R5bGVzPj4sXG4gIGljb25NYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4pOiBMYXllckluZm9bXSB7XG4gIGNvbnN0IGxheWVyczogTGF5ZXJJbmZvW10gPSBbXTtcbiAgY29uc3Qgc2VjdGlvbkJvdW5kcyA9IHNlY3Rpb25Ob2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGlmICghc2VjdGlvbkJvdW5kcykgcmV0dXJuIGxheWVycztcblxuICBsZXQgbGF5ZXJJbmRleCA9IDA7XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIpIHtcbiAgICBpZiAoIW5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCB8fCBkZXB0aCA+IDYpIHJldHVybjtcblxuICAgIGNvbnN0IGJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICBjb25zdCByZWxCb3VuZHMgPSB7XG4gICAgICB4OiBNYXRoLnJvdW5kKGJvdW5kcy54IC0gc2VjdGlvbkJvdW5kcyEueCksXG4gICAgICB5OiBNYXRoLnJvdW5kKGJvdW5kcy55IC0gc2VjdGlvbkJvdW5kcyEueSksXG4gICAgICB3aWR0aDogTWF0aC5yb3VuZChib3VuZHMud2lkdGgpLFxuICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKGJvdW5kcy5oZWlnaHQpLFxuICAgIH07XG5cbiAgICBsZXQgcm9sZTogTGF5ZXJJbmZvWydyb2xlJ10gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgbmFtZSA9ICcnO1xuXG4gICAgaWYgKGljb25NYXAuaGFzKG5vZGUuaWQpKSB7XG4gICAgICByb2xlID0gJ2ljb24nO1xuICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgbmFtZSA9IGNsZWFuTmFtZSAmJiAhL14odmVjdG9yfGljb258ZnJhbWV8Z3JvdXB8cmVjdGFuZ2xlfGVsbGlwc2V8Ym9vbGVhbilcXGQqJC8udGVzdChjbGVhbk5hbWUpXG4gICAgICAgID8gY2xlYW5OYW1lXG4gICAgICAgIDogYGljb25fJHtsYXllckluZGV4fWA7XG4gICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgcm9sZSA9ICd0ZXh0JztcbiAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIG5hbWUgPSBjbGVhbk5hbWUgJiYgIS9edGV4dFxcZCokLy50ZXN0KGNsZWFuTmFtZSkgPyBjbGVhbk5hbWUgOiBgdGV4dF8ke2xheWVySW5kZXh9YDtcbiAgICB9IGVsc2UgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkpIHtcbiAgICAgIGNvbnN0IG5hbWVIaW50c0JnID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2JhY2tncm91bmQnKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYmcnKTtcbiAgICAgIGNvbnN0IHNwYW5zU2VjdGlvbiA9IGJvdW5kcy53aWR0aCA+PSBzZWN0aW9uQm91bmRzIS53aWR0aCAqIDAuOSAmJiBib3VuZHMuaGVpZ2h0ID49IHNlY3Rpb25Cb3VuZHMhLmhlaWdodCAqIDAuOTtcbiAgICAgIHJvbGUgPSAobmFtZUhpbnRzQmcgfHwgc3BhbnNTZWN0aW9uKSA/ICdiYWNrZ3JvdW5kX2ltYWdlJyA6ICdpbWFnZSc7XG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBuYW1lID0gY2xlYW5OYW1lICYmICEvXihpbWFnZXxyZWN0YW5nbGV8ZnJhbWUpXFxkKiQvLnRlc3QoY2xlYW5OYW1lKSA/IGNsZWFuTmFtZSA6IChyb2xlID09PSAnYmFja2dyb3VuZF9pbWFnZScgPyAnYmFja2dyb3VuZF9pbWFnZScgOiBgaW1hZ2VfJHtsYXllckluZGV4fWApO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAobm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2J1dHRvbicpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdidG4nKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY3RhJykpICYmXG4gICAgICAobm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnKVxuICAgICkge1xuICAgICAgcm9sZSA9ICdidXR0b24nO1xuICAgICAgbmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKSB8fCAnYnV0dG9uJztcbiAgICB9XG5cbiAgICBpZiAocm9sZSkge1xuICAgICAgbGF5ZXJzLnB1c2goe1xuICAgICAgICBuYW1lLFxuICAgICAgICByb2xlLFxuICAgICAgICB0eXBlOiBub2RlLnR5cGUsXG4gICAgICAgIGJvdW5kczogcmVsQm91bmRzLFxuICAgICAgICB6SW5kZXg6IGxheWVySW5kZXgsXG4gICAgICAgIG92ZXJsYXBzOiBbXSwgLy8gZmlsbGVkIGluIGRldGVjdENvbXBvc2l0aW9uXG4gICAgICB9KTtcbiAgICAgIGxheWVySW5kZXgrKztcbiAgICB9XG5cbiAgICAvLyBSZWN1cnNlIChza2lwIGJ1dHRvbiBhbmQgaWNvbiBpbnRlcm5hbHMgXHUyMDE0IGljb24gY2hpbGRyZW4gYXJlIHZlY3RvclxuICAgIC8vIHBhdGhzIHRoYXQgYWxyZWFkeSBleHBvcnRlZCBhcyBvbmUgY29tcG9zZWQgU1ZHKVxuICAgIGlmIChyb2xlICE9PSAnYnV0dG9uJyAmJiByb2xlICE9PSAnaWNvbicgJiYgJ2NoaWxkcmVuJyBpbiBub2RlICYmIGRlcHRoIDwgNikge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIGlmIChjaGlsZC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgIHdhbGsoY2hpbGQsIGRlcHRoICsgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoJ2NoaWxkcmVuJyBpbiBzZWN0aW9uTm9kZSkge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKHNlY3Rpb25Ob2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICB3YWxrKGNoaWxkLCAwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbGF5ZXJzO1xufVxuXG4vKipcbiAqIERldGVjdCBjb21wb3NpdGlvbiBwYXR0ZXJuczogdGV4dC1vdmVyLWltYWdlLCBiYWNrZ3JvdW5kIGltYWdlcywgb3ZlcmxheSBzdGFja2luZy5cbiAqIFR3byByZWN0YW5nbGVzIG92ZXJsYXAgaWYgdGhleSBzaGFyZSBhbnkgYXJlYS5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q29tcG9zaXRpb24obGF5ZXJzOiBMYXllckluZm9bXSk6IENvbXBvc2l0aW9uSW5mbyB7XG4gIGNvbnN0IGNvbXBvc2l0aW9uOiBDb21wb3NpdGlvbkluZm8gPSB7XG4gICAgaGFzVGV4dE92ZXJJbWFnZTogZmFsc2UsXG4gICAgaGFzQmFja2dyb3VuZEltYWdlOiBmYWxzZSxcbiAgICBvdmVybGF5RWxlbWVudHM6IFtdLFxuICAgIHN0YWNraW5nT3JkZXI6IGxheWVycy5tYXAobCA9PiBsLm5hbWUpLFxuICB9O1xuXG4gIGNvbnN0IGJnSW1hZ2VMYXllcnMgPSBsYXllcnMuZmlsdGVyKGwgPT4gbC5yb2xlID09PSAnYmFja2dyb3VuZF9pbWFnZScpO1xuICBjb25zdCBpbWFnZUxheWVycyA9IGxheWVycy5maWx0ZXIobCA9PiBsLnJvbGUgPT09ICdpbWFnZScgfHwgbC5yb2xlID09PSAnYmFja2dyb3VuZF9pbWFnZScpO1xuICBjb25zdCB0ZXh0TGF5ZXJzID0gbGF5ZXJzLmZpbHRlcihsID0+IGwucm9sZSA9PT0gJ3RleHQnKTtcbiAgY29uc3QgYnV0dG9uTGF5ZXJzID0gbGF5ZXJzLmZpbHRlcihsID0+IGwucm9sZSA9PT0gJ2J1dHRvbicpO1xuXG4gIGlmIChiZ0ltYWdlTGF5ZXJzLmxlbmd0aCA+IDApIHtcbiAgICBjb21wb3NpdGlvbi5oYXNCYWNrZ3JvdW5kSW1hZ2UgPSB0cnVlO1xuICB9XG5cbiAgLy8gQ2hlY2sgZm9yIGJvdW5kaW5nIGJveCBvdmVybGFwcyBiZXR3ZWVuIHRleHQvYnV0dG9ucyBhbmQgaW1hZ2VzXG4gIGZvciAoY29uc3QgdGV4dExheWVyIG9mIFsuLi50ZXh0TGF5ZXJzLCAuLi5idXR0b25MYXllcnNdKSB7XG4gICAgZm9yIChjb25zdCBpbWdMYXllciBvZiBpbWFnZUxheWVycykge1xuICAgICAgY29uc3QgdGIgPSB0ZXh0TGF5ZXIuYm91bmRzO1xuICAgICAgY29uc3QgaWIgPSBpbWdMYXllci5ib3VuZHM7XG5cbiAgICAgIC8vIENoZWNrIHJlY3RhbmdsZSBvdmVybGFwXG4gICAgICBjb25zdCBvdmVybGFwc0hvcml6b250YWxseSA9IHRiLnggPCBpYi54ICsgaWIud2lkdGggJiYgdGIueCArIHRiLndpZHRoID4gaWIueDtcbiAgICAgIGNvbnN0IG92ZXJsYXBzVmVydGljYWxseSA9IHRiLnkgPCBpYi55ICsgaWIuaGVpZ2h0ICYmIHRiLnkgKyB0Yi5oZWlnaHQgPiBpYi55O1xuXG4gICAgICBpZiAob3ZlcmxhcHNIb3Jpem9udGFsbHkgJiYgb3ZlcmxhcHNWZXJ0aWNhbGx5KSB7XG4gICAgICAgIC8vIFRleHQvYnV0dG9uIG92ZXJsYXBzIHdpdGggaW1hZ2VcbiAgICAgICAgdGV4dExheWVyLm92ZXJsYXBzLnB1c2goaW1nTGF5ZXIubmFtZSk7XG4gICAgICAgIGltZ0xheWVyLm92ZXJsYXBzLnB1c2godGV4dExheWVyLm5hbWUpO1xuXG4gICAgICAgIGlmICghY29tcG9zaXRpb24uaGFzVGV4dE92ZXJJbWFnZSkge1xuICAgICAgICAgIGNvbXBvc2l0aW9uLmhhc1RleHRPdmVySW1hZ2UgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRWxlbWVudHMgd2l0aCBoaWdoZXIgekluZGV4IHRoYXQgb3ZlcmxhcCBpbWFnZXMgYXJlIG92ZXJsYXlzXG4gICAgICAgIGlmICh0ZXh0TGF5ZXIuekluZGV4ID4gaW1nTGF5ZXIuekluZGV4KSB7XG4gICAgICAgICAgaWYgKCFjb21wb3NpdGlvbi5vdmVybGF5RWxlbWVudHMuaW5jbHVkZXModGV4dExheWVyLm5hbWUpKSB7XG4gICAgICAgICAgICBjb21wb3NpdGlvbi5vdmVybGF5RWxlbWVudHMucHVzaCh0ZXh0TGF5ZXIubmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgdGhlcmUncyBhIGJhY2tncm91bmQgaW1hZ2UsIEFMTCBub24tYmFja2dyb3VuZCBlbGVtZW50cyBhcmUgb3ZlcmxheXNcbiAgaWYgKGNvbXBvc2l0aW9uLmhhc0JhY2tncm91bmRJbWFnZSkge1xuICAgIGZvciAoY29uc3QgbGF5ZXIgb2YgbGF5ZXJzKSB7XG4gICAgICBpZiAobGF5ZXIucm9sZSAhPT0gJ2JhY2tncm91bmRfaW1hZ2UnICYmICFjb21wb3NpdGlvbi5vdmVybGF5RWxlbWVudHMuaW5jbHVkZXMobGF5ZXIubmFtZSkpIHtcbiAgICAgICAgY29tcG9zaXRpb24ub3ZlcmxheUVsZW1lbnRzLnB1c2gobGF5ZXIubmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbXBvc2l0aW9uO1xufVxuXG4vKipcbiAqIERldGVjdCBpZiBhIHNlY3Rpb24gY29udGFpbnMgZm9ybS1saWtlIGVsZW1lbnRzLlxuICogTG9va3MgZm9yIHBhdHRlcm5zOiBpbnB1dCByZWN0YW5nbGVzIChuYXJyb3cgaGVpZ2h0IGZyYW1lcyksIGxhYmVscyAoc21hbGwgdGV4dCBuZWFyIGlucHV0cyksXG4gKiBzdWJtaXQgYnV0dG9ucywgYW5kIGNvbW1vbiBmb3JtLXJlbGF0ZWQgbGF5ZXIgbmFtZXMuXG4gKi9cbmZ1bmN0aW9uIGRldGVjdEZvcm1TZWN0aW9uKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUpOiB7IGlzRm9ybTogYm9vbGVhbjsgZmllbGRzOiBGb3JtRmllbGRJbmZvW10gfSB7XG4gIGNvbnN0IGZvcm1LZXl3b3JkcyA9IFsnZm9ybScsICdpbnB1dCcsICdmaWVsZCcsICdjb250YWN0JywgJ3N1YnNjcmliZScsICduZXdzbGV0dGVyJywgJ3NpZ251cCcsICdzaWduLXVwJywgJ2VucXVpcnknLCAnaW5xdWlyeSddO1xuICBjb25zdCBpbnB1dEtleXdvcmRzID0gWydpbnB1dCcsICdmaWVsZCcsICd0ZXh0LWZpZWxkJywgJ3RleHRmaWVsZCcsICd0ZXh0X2ZpZWxkJywgJ2VtYWlsJywgJ3Bob25lJywgJ25hbWUnLCAnbWVzc2FnZScsICd0ZXh0YXJlYSddO1xuICBjb25zdCBzdWJtaXRLZXl3b3JkcyA9IFsnc3VibWl0JywgJ3NlbmQnLCAnYnV0dG9uJywgJ2N0YScsICdidG4nXTtcblxuICBjb25zdCBzZWN0aW9uTmFtZSA9IHNlY3Rpb25Ob2RlLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgbmFtZUhpbnRzRm9ybSA9IGZvcm1LZXl3b3Jkcy5zb21lKGt3ID0+IHNlY3Rpb25OYW1lLmluY2x1ZGVzKGt3KSk7XG5cbiAgbGV0IGlucHV0Q291bnQgPSAwO1xuICBsZXQgaGFzU3VibWl0QnV0dG9uID0gZmFsc2U7XG4gIGNvbnN0IGZpZWxkczogRm9ybUZpZWxkSW5mb1tdID0gW107XG4gIGNvbnN0IHRleHROb2RlczogeyBuYW1lOiBzdHJpbmc7IHRleHQ6IHN0cmluZzsgeTogbnVtYmVyIH1bXSA9IFtdO1xuICBjb25zdCBpbnB1dE5vZGVzOiB7IG5hbWU6IHN0cmluZzsgeTogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9W10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGNvbnN0IG5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgIC8vIERldGVjdCBpbnB1dC1saWtlIGZyYW1lczogbmFycm93IGhlaWdodCAoMzAtNjBweCksIHdpZGVyIHRoYW4gdGFsbCwgd2l0aCBib3JkZXIvZmlsbFxuICAgIGlmICgobm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IG5vZGUudHlwZSA9PT0gJ1JFQ1RBTkdMRScpICYmIG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCkge1xuICAgICAgY29uc3QgYiA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgIGNvbnN0IGlzSW5wdXRTaGFwZSA9IGIuaGVpZ2h0ID49IDMwICYmIGIuaGVpZ2h0IDw9IDcwICYmIGIud2lkdGggPiBiLmhlaWdodCAqIDI7XG4gICAgICBjb25zdCBoYXNJbnB1dE5hbWUgPSBpbnB1dEtleXdvcmRzLnNvbWUoa3cgPT4gbmFtZS5pbmNsdWRlcyhrdykpO1xuXG4gICAgICBpZiAoaXNJbnB1dFNoYXBlICYmIChoYXNJbnB1dE5hbWUgfHwgbmFtZUhpbnRzRm9ybSkpIHtcbiAgICAgICAgaW5wdXRDb3VudCsrO1xuICAgICAgICBpbnB1dE5vZGVzLnB1c2goeyBuYW1lOiBub2RlLm5hbWUsIHk6IGIueSwgaGVpZ2h0OiBiLmhlaWdodCB9KTtcblxuICAgICAgICAvLyBEZXRlY3QgZmllbGQgdHlwZSBmcm9tIG5hbWVcbiAgICAgICAgbGV0IGZpZWxkVHlwZTogRm9ybUZpZWxkSW5mb1sndHlwZSddID0gJ3RleHQnO1xuICAgICAgICBpZiAobmFtZS5pbmNsdWRlcygnZW1haWwnKSkgZmllbGRUeXBlID0gJ2VtYWlsJztcbiAgICAgICAgZWxzZSBpZiAobmFtZS5pbmNsdWRlcygncGhvbmUnKSB8fCBuYW1lLmluY2x1ZGVzKCd0ZWwnKSkgZmllbGRUeXBlID0gJ3Bob25lJztcbiAgICAgICAgZWxzZSBpZiAobmFtZS5pbmNsdWRlcygndGV4dGFyZWEnKSB8fCBuYW1lLmluY2x1ZGVzKCdtZXNzYWdlJykgfHwgKGIuaGVpZ2h0ID4gODApKSBmaWVsZFR5cGUgPSAndGV4dGFyZWEnO1xuICAgICAgICBlbHNlIGlmIChuYW1lLmluY2x1ZGVzKCdzZWxlY3QnKSB8fCBuYW1lLmluY2x1ZGVzKCdkcm9wZG93bicpKSBmaWVsZFR5cGUgPSAnc2VsZWN0JztcbiAgICAgICAgZWxzZSBpZiAobmFtZS5pbmNsdWRlcygnY2hlY2tib3gnKSB8fCBuYW1lLmluY2x1ZGVzKCdjaGVjaycpKSBmaWVsZFR5cGUgPSAnY2hlY2tib3gnO1xuICAgICAgICBlbHNlIGlmIChuYW1lLmluY2x1ZGVzKCdyYWRpbycpKSBmaWVsZFR5cGUgPSAncmFkaW8nO1xuXG4gICAgICAgIGZpZWxkcy5wdXNoKHtcbiAgICAgICAgICBsYWJlbDogbm9kZS5uYW1lLnJlcGxhY2UoL1stX10vZywgJyAnKS5yZXBsYWNlKC9cXGJcXHcvZywgYyA9PiBjLnRvVXBwZXJDYXNlKCkpLFxuICAgICAgICAgIHR5cGU6IGZpZWxkVHlwZSxcbiAgICAgICAgICByZXF1aXJlZDogbmFtZS5pbmNsdWRlcygncmVxdWlyZWQnKSB8fCBuYW1lLmluY2x1ZGVzKCcqJyksXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXRlY3Qgc3VibWl0IGJ1dHRvbnNcbiAgICAgIGlmIChzdWJtaXRLZXl3b3Jkcy5zb21lKGt3ID0+IG5hbWUuaW5jbHVkZXMoa3cpKSAmJiBiLmhlaWdodCA+PSAzMCAmJiBiLmhlaWdodCA8PSA3MCkge1xuICAgICAgICBoYXNTdWJtaXRCdXR0b24gPSB0cnVlO1xuICAgICAgICBpZiAoIWZpZWxkcy5maW5kKGYgPT4gZi50eXBlID09PSAnc3VibWl0JykpIHtcbiAgICAgICAgICBmaWVsZHMucHVzaCh7IGxhYmVsOiAnU3VibWl0JywgdHlwZTogJ3N1Ym1pdCcsIHJlcXVpcmVkOiBmYWxzZSB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvbGxlY3QgdGV4dCBub2RlcyBuZWFyIGlucHV0cyBhcyBwb3RlbnRpYWwgbGFiZWxzXG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnICYmIG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCkge1xuICAgICAgdGV4dE5vZGVzLnB1c2goe1xuICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgIHRleHQ6IG5vZGUuY2hhcmFjdGVycyB8fCAnJyxcbiAgICAgICAgeTogbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94LnksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnZpc2libGUgIT09IGZhbHNlKSB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3YWxrKHNlY3Rpb25Ob2RlKTtcblxuICAvLyBNYXRjaCBsYWJlbHMgdG8gZmllbGRzOiB0ZXh0IG5vZGUgZGlyZWN0bHkgYWJvdmUgYW4gaW5wdXQgKHdpdGhpbiAzMHB4KVxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIGZpZWxkcykge1xuICAgIGNvbnN0IGZpZWxkSW5wdXQgPSBpbnB1dE5vZGVzLmZpbmQoaW5wID0+IGlucC5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoZmllbGQubGFiZWwudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC8gL2csICdfJykpKTtcbiAgICBpZiAoZmllbGRJbnB1dCkge1xuICAgICAgY29uc3QgbGFiZWxBYm92ZSA9IHRleHROb2Rlcy5maW5kKHQgPT4gdC55IDwgZmllbGRJbnB1dC55ICYmIChmaWVsZElucHV0LnkgLSB0LnkpIDwgNDApO1xuICAgICAgaWYgKGxhYmVsQWJvdmUpIHtcbiAgICAgICAgZmllbGQubGFiZWwgPSBsYWJlbEFib3ZlLnRleHQucmVwbGFjZSgnKicsICcnKS50cmltKCk7XG4gICAgICAgIGlmIChsYWJlbEFib3ZlLnRleHQuaW5jbHVkZXMoJyonKSkgZmllbGQucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGlzRm9ybSA9IChpbnB1dENvdW50ID49IDIgJiYgaGFzU3VibWl0QnV0dG9uKSB8fCAobmFtZUhpbnRzRm9ybSAmJiBpbnB1dENvdW50ID49IDEpO1xuXG4gIHJldHVybiB7IGlzRm9ybSwgZmllbGRzOiBpc0Zvcm0gPyBmaWVsZHMgOiBbXSB9O1xufVxuXG4vKipcbiAqIFBhcnNlIGFsbCBzZWN0aW9ucyBmcm9tIGEgcGFnZSBmcmFtZSBhbmQgcHJvZHVjZSBTZWN0aW9uU3BlYyBvYmplY3RzLlxuICovXG4vKipcbiAqIEV4dHJhY3QgZXZlcnkgVEVYVCBub2RlIGluIGEgc2VjdGlvbiBpbiByZWFkaW5nIG9yZGVyICh0b3AtdG8tYm90dG9tLFxuICogdGhlbiBsZWZ0LXRvLXJpZ2h0IGZvciBpdGVtcyBvbiB0aGUgc2FtZSByb3cgd2l0aGluIGEgMTJweCB0b2xlcmFuY2UpLlxuICpcbiAqIFRoaXMgaXMgdGhlIGNvbnRlbnQgc291cmNlIGZvciBwYWdlLWFzc2VtYmxlciB3aGVuIGRlc2lnbmVycyBkb24ndCBuYW1lXG4gKiBsYXllcnMgY29uc2lzdGVudGx5LiBJdCBwcmVzZXJ2ZXMgZXZlcnkgdmlzaWJsZSB0ZXh0IGZyb20gdGhlIEZpZ21hIGRlc2lnblxuICogc28gbm90aGluZyBjYW4gYmUgc2lsZW50bHkgZHJvcHBlZCBkdXJpbmcgQUNGIHBvcHVsYXRpb24uXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RUZXh0Q29udGVudEluT3JkZXIoc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSk6IFRleHRDb250ZW50RW50cnlbXSB7XG4gIGNvbnN0IHNlY3Rpb25Cb3VuZHMgPSBzZWN0aW9uTm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICBpZiAoIXNlY3Rpb25Cb3VuZHMpIHJldHVybiBbXTtcblxuICB0eXBlIFJhd1RleHQgPSB7IG5vZGU6IFRleHROb2RlOyByZWxZOiBudW1iZXI7IHJlbFg6IG51bWJlcjsgZm9udFNpemU6IG51bWJlciB9O1xuICBjb25zdCBjb2xsZWN0ZWQ6IFJhd1RleHRbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgaWYgKG5vZGUudmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICBpZiAoZGVwdGggPiA4KSByZXR1cm47XG5cbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIGNvbnN0IHQgPSBub2RlIGFzIFRleHROb2RlO1xuICAgICAgY29uc3QgY2hhcnMgPSB0LmNoYXJhY3RlcnMgfHwgJyc7XG4gICAgICBpZiAoIWNoYXJzLnRyaW0oKSkgcmV0dXJuOyAvLyBza2lwIGVtcHR5IHRleHQgbm9kZXNcbiAgICAgIGNvbnN0IGJiID0gdC5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgaWYgKCFiYikgcmV0dXJuO1xuICAgICAgY29uc3QgZnMgPSB0LmZvbnRTaXplICE9PSBmaWdtYS5taXhlZCA/ICh0LmZvbnRTaXplIGFzIG51bWJlcikgOiAxNjtcbiAgICAgIGNvbGxlY3RlZC5wdXNoKHtcbiAgICAgICAgbm9kZTogdCxcbiAgICAgICAgcmVsWTogYmIueSAtIHNlY3Rpb25Cb3VuZHMhLnksXG4gICAgICAgIHJlbFg6IGJiLnggLSBzZWN0aW9uQm91bmRzIS54LFxuICAgICAgICBmb250U2l6ZTogZnMsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjsgLy8gZG9uJ3QgcmVjdXJzZSBpbnRvIFRFWFRcbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCwgZGVwdGggKyAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoJ2NoaWxkcmVuJyBpbiBzZWN0aW9uTm9kZSkge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKHNlY3Rpb25Ob2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgIHdhbGsoY2hpbGQsIDApO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlYWRpbmcgb3JkZXI6IHNvcnQgYnkgWSAocm93cyksIHRoZW4gYnkgWCB3aXRoaW4gc2FtZSByb3cgKDEycHggdG9sZXJhbmNlKS5cbiAgY29sbGVjdGVkLnNvcnQoKGEsIGIpID0+IHtcbiAgICBpZiAoTWF0aC5hYnMoYS5yZWxZIC0gYi5yZWxZKSA8IDEyKSByZXR1cm4gYS5yZWxYIC0gYi5yZWxYO1xuICAgIHJldHVybiBhLnJlbFkgLSBiLnJlbFk7XG4gIH0pO1xuXG4gIC8vIFJvbGUgYXNzaWdubWVudCBcdTIwMTQgdG9wLW1vc3QgbGFyZ2VzdCB0ZXh0IGlzICdoZWFkaW5nJywgc2Vjb25kIGlzICdzdWJoZWFkaW5nJyxcbiAgLy8gc21hbGwgc2hvcnQgdGV4dHMgbmVhciBidXR0b25zIGFyZSAnYnV0dG9uX3RleHQnLCByZXN0IGFyZSAnYm9keScgb3IgJ3RleHRfTicuXG4gIGxldCBoZWFkaW5nQXNzaWduZWQgPSBmYWxzZTtcbiAgbGV0IHN1YmhlYWRpbmdBc3NpZ25lZCA9IGZhbHNlO1xuXG4gIHJldHVybiBjb2xsZWN0ZWQubWFwKChpdGVtLCBpZHgpID0+IHtcbiAgICBjb25zdCB0ZXh0ID0gaXRlbS5ub2RlLmNoYXJhY3RlcnMgfHwgJyc7XG4gICAgY29uc3QgY2xlYW5OYW1lID0gaXRlbS5ub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgY29uc3QgbmFtZUhpbnQgPSBjbGVhbk5hbWUgfHwgJyc7XG5cbiAgICBsZXQgcm9sZTogc3RyaW5nO1xuICAgIGlmIChuYW1lSGludC5pbmNsdWRlcygnYnV0dG9uJykgfHwgbmFtZUhpbnQuaW5jbHVkZXMoJ2N0YScpIHx8IG5hbWVIaW50LmluY2x1ZGVzKCdidG4nKSkge1xuICAgICAgcm9sZSA9ICdidXR0b25fdGV4dCc7XG4gICAgfSBlbHNlIGlmICghaGVhZGluZ0Fzc2lnbmVkICYmIGl0ZW0uZm9udFNpemUgPj0gMjgpIHtcbiAgICAgIHJvbGUgPSAnaGVhZGluZyc7XG4gICAgICBoZWFkaW5nQXNzaWduZWQgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAoIXN1YmhlYWRpbmdBc3NpZ25lZCAmJiBpdGVtLmZvbnRTaXplID49IDE4ICYmIGl0ZW0uZm9udFNpemUgPCAyOCkge1xuICAgICAgcm9sZSA9ICdzdWJoZWFkaW5nJztcbiAgICAgIHN1YmhlYWRpbmdBc3NpZ25lZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChpdGVtLmZvbnRTaXplIDw9IDEzIHx8IChuYW1lSGludC5pbmNsdWRlcygnY2FwdGlvbicpIHx8IG5hbWVIaW50LmluY2x1ZGVzKCdleWVicm93JykgfHwgbmFtZUhpbnQuaW5jbHVkZXMoJ3RhZycpKSkge1xuICAgICAgcm9sZSA9ICdjYXB0aW9uJztcbiAgICB9IGVsc2UgaWYgKHRleHQubGVuZ3RoIDwgMzAgJiYgaXRlbS5mb250U2l6ZSA8PSAxNikge1xuICAgICAgLy8gU2hvcnQsIHNtYWxsIFx1MjAxNCBsaWtlbHkgYSBsaW5rIG9yIGxhYmVsXG4gICAgICByb2xlID0gJ2xhYmVsJztcbiAgICB9IGVsc2Uge1xuICAgICAgcm9sZSA9IGBib2R5XyR7aWR4fWA7XG4gICAgfVxuXG4gICAgY29uc3QgYmIgPSBpdGVtLm5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gICAgcmV0dXJuIHtcbiAgICAgIGluZGV4OiBpZHgsXG4gICAgICB0ZXh0LFxuICAgICAgcm9sZSxcbiAgICAgIGxheWVyTmFtZTogaXRlbS5ub2RlLm5hbWUsXG4gICAgICBmb250U2l6ZTogTWF0aC5yb3VuZChpdGVtLmZvbnRTaXplKSxcbiAgICAgIGJvdW5kczoge1xuICAgICAgICB4OiBNYXRoLnJvdW5kKGl0ZW0ucmVsWCksXG4gICAgICAgIHk6IE1hdGgucm91bmQoaXRlbS5yZWxZKSxcbiAgICAgICAgd2lkdGg6IE1hdGgucm91bmQoYmIud2lkdGgpLFxuICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQoYmIuaGVpZ2h0KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG59XG5cbi8qKlxuICogUGFyc2Ugc2VjdGlvbnMgZnJvbSBhIHBhZ2UgZnJhbWUuXG4gKlxuICogQHBhcmFtIHBhZ2VGcmFtZSBUaGUgdG9wLWxldmVsIHBhZ2UgZnJhbWUgdG8gd2Fsay5cbiAqIEBwYXJhbSBpY29uTWFwIE1hcDxub2RlSWQsIHN2Z0ZpbGVuYW1lPiBmcm9tIGljb24tZGV0ZWN0b3IuIFNlY3Rpb25cbiAqICAgICAgICAgICAgICAgIGVsZW1lbnRzIHRoYXQgbWF0Y2ggYW4gaWNvbiByb290IHJlY2VpdmUgYW4gYGljb25GaWxlYFxuICogICAgICAgICAgICAgICAgcG9pbnRpbmcgYXQgdGhlIHNhbWUgZmlsZW5hbWUgaW1hZ2UtZXhwb3J0ZXIgd3JpdGVzLlxuICogQHBhcmFtIGdsb2JhbE5hbWVzIE9wdGlvbmFsIHNldCBvZiBub3JtYWxpemVkIHNlY3Rpb24gbmFtZXMgdGhhdCBhcHBlYXIgb25cbiAqICAgICAgICAgICAgICAgICAgICBcdTIyNjUyIHNlbGVjdGVkIHBhZ2VzLiBXaGVuIHByb3ZpZGVkLCBtYXRjaGluZyBzZWN0aW9ucyBhcmVcbiAqICAgICAgICAgICAgICAgICAgICBtYXJrZWQgYGlzR2xvYmFsOiB0cnVlYCBzbyB0aGUgYWdlbnQgY2FuIHByb21vdGUgdGhlbSB0b1xuICogICAgICAgICAgICAgICAgICAgIHNoYXJlZCBXUCB0aGVtZSBwYXJ0cyBpbnN0ZWFkIG9mIGR1cGxpY2F0aW5nIHBlci1wYWdlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZWN0aW9ucyhcbiAgcGFnZUZyYW1lOiBGcmFtZU5vZGUsXG4gIGljb25NYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4gIGdsb2JhbE5hbWVzPzogU2V0PHN0cmluZz4sXG4pOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4ge1xuICBjb25zdCBzZWN0aW9uTm9kZXMgPSBpZGVudGlmeVNlY3Rpb25zKHBhZ2VGcmFtZSk7XG4gIGNvbnN0IHNwZWNzOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4gPSB7fTtcblxuICBsZXQgcHJldkJvdHRvbSA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWN0aW9uTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlID0gc2VjdGlvbk5vZGVzW2ldO1xuICAgIGNvbnN0IGJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICBpZiAoIWJvdW5kcykgY29udGludWU7XG5cbiAgICBjb25zdCBsYXlvdXROYW1lID0gdG9MYXlvdXROYW1lKG5vZGUubmFtZSk7XG4gICAgY29uc3QgaXNGcmFtZSA9IG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJztcbiAgICBjb25zdCBmcmFtZSA9IGlzRnJhbWUgPyAobm9kZSBhcyBGcmFtZU5vZGUpIDogbnVsbDtcblxuICAgIC8vIERldGVybWluZSBzcGFjaW5nIHNvdXJjZSBhbmQgZXh0cmFjdCBzcGFjaW5nXG4gICAgY29uc3QgaGFzQXV0b0xheW91dCA9IGZyYW1lPy5sYXlvdXRNb2RlICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJztcbiAgICBsZXQgc3BhY2luZ1NvdXJjZTogJ2F1dG8tbGF5b3V0JyB8ICdhYnNvbHV0ZS1jb29yZGluYXRlcyc7XG4gICAgbGV0IHNlY3Rpb25TdHlsZXM6IFBhcnRpYWw8U2VjdGlvblN0eWxlcz47XG4gICAgbGV0IGl0ZW1TcGFjaW5nOiBzdHJpbmcgfCBudWxsO1xuXG4gICAgaWYgKGhhc0F1dG9MYXlvdXQgJiYgZnJhbWUpIHtcbiAgICAgIGNvbnN0IHNwYWNpbmcgPSBleHRyYWN0QXV0b0xheW91dFNwYWNpbmcoZnJhbWUpO1xuICAgICAgc3BhY2luZ1NvdXJjZSA9IHNwYWNpbmcuc3BhY2luZ1NvdXJjZTtcbiAgICAgIHNlY3Rpb25TdHlsZXMgPSBzcGFjaW5nLnNlY3Rpb25TdHlsZXM7XG4gICAgICBpdGVtU3BhY2luZyA9IHNwYWNpbmcuaXRlbVNwYWNpbmc7XG4gICAgfSBlbHNlIGlmIChmcmFtZSkge1xuICAgICAgY29uc3Qgc3BhY2luZyA9IGV4dHJhY3RBYnNvbHV0ZVNwYWNpbmcoZnJhbWUpO1xuICAgICAgc3BhY2luZ1NvdXJjZSA9IHNwYWNpbmcuc3BhY2luZ1NvdXJjZTtcbiAgICAgIHNlY3Rpb25TdHlsZXMgPSBzcGFjaW5nLnNlY3Rpb25TdHlsZXM7XG4gICAgICBpdGVtU3BhY2luZyA9IHNwYWNpbmcuaXRlbVNwYWNpbmc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNwYWNpbmdTb3VyY2UgPSAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnO1xuICAgICAgc2VjdGlvblN0eWxlcyA9IHt9O1xuICAgICAgaXRlbVNwYWNpbmcgPSBudWxsO1xuICAgIH1cblxuICAgIC8vIEJhc2Ugc2VjdGlvbiBzdHlsZXMgKGJhY2tncm91bmQsIGdyYWRpZW50LCBldGMuKVxuICAgIGNvbnN0IGJhc2VTdHlsZXMgPSBleHRyYWN0U2VjdGlvblN0eWxlcyhub2RlKTtcbiAgICBjb25zdCBtZXJnZWRTdHlsZXM6IFNlY3Rpb25TdHlsZXMgPSB7XG4gICAgICAuLi5iYXNlU3R5bGVzLFxuICAgICAgLi4uc2VjdGlvblN0eWxlcyxcbiAgICB9O1xuXG4gICAgLy8gRWxlbWVudHNcbiAgICBjb25zdCBlbGVtZW50cyA9IGV4dHJhY3RFbGVtZW50cyhub2RlLCBpY29uTWFwKTtcblxuICAgIC8vIEdyaWQgZGV0ZWN0aW9uXG4gICAgY29uc3QgZ3JpZCA9IGZyYW1lID8gZGV0ZWN0R3JpZChmcmFtZSkgOiB7XG4gICAgICBsYXlvdXRNb2RlOiAnYWJzb2x1dGUnIGFzIGNvbnN0LFxuICAgICAgY29sdW1uczogMSxcbiAgICAgIGdhcDogaXRlbVNwYWNpbmcsXG4gICAgICByb3dHYXA6IG51bGwsXG4gICAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgICBpdGVtTWluV2lkdGg6IG51bGwsXG4gICAgfTtcblxuICAgIC8vIEVuc3VyZSBncmlkIGdhcCBpcyBzZXQgZnJvbSBpdGVtU3BhY2luZyBpZiBub3QgYWxyZWFkeVxuICAgIGlmICghZ3JpZC5nYXAgJiYgaXRlbVNwYWNpbmcpIHtcbiAgICAgIGdyaWQuZ2FwID0gaXRlbVNwYWNpbmc7XG4gICAgfVxuXG4gICAgLy8gT3ZlcmxhcCBkZXRlY3Rpb25cbiAgICBsZXQgb3ZlcmxhcDogT3ZlcmxhcEluZm8gfCBudWxsID0gbnVsbDtcbiAgICBpZiAoaSA+IDApIHtcbiAgICAgIGNvbnN0IG92ZXJsYXBQeCA9IHByZXZCb3R0b20gLSBib3VuZHMueTtcbiAgICAgIGlmIChvdmVybGFwUHggPiAwKSB7XG4gICAgICAgIG92ZXJsYXAgPSB7XG4gICAgICAgICAgd2l0aFNlY3Rpb246IHNlY3Rpb25Ob2Rlc1tpIC0gMV0ubmFtZSxcbiAgICAgICAgICBwaXhlbHM6IE1hdGgucm91bmQob3ZlcmxhcFB4KSxcbiAgICAgICAgICBjc3NNYXJnaW5Ub3A6IGAtJHtNYXRoLnJvdW5kKG92ZXJsYXBQeCl9cHhgLFxuICAgICAgICAgIHJlcXVpcmVzWkluZGV4OiB0cnVlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEludGVyYWN0aW9uc1xuICAgIGNvbnN0IGludGVyYWN0aW9ucyA9IGV4dHJhY3RJbnRlcmFjdGlvbnMobm9kZSk7XG5cbiAgICAvLyBMYXllciBjb21wb3NpdGlvbiBhbmFseXNpc1xuICAgIGNvbnN0IGxheWVycyA9IGV4dHJhY3RMYXllcnMobm9kZSwgZWxlbWVudHMsIGljb25NYXApO1xuICAgIGNvbnN0IGNvbXBvc2l0aW9uID0gZGV0ZWN0Q29tcG9zaXRpb24obGF5ZXJzKTtcblxuICAgIC8vIEVucmljaCBlbGVtZW50cyB3aXRoIHBvc2l0aW9uIGRhdGEgZnJvbSBjb21wb3NpdGlvblxuICAgIGlmIChjb21wb3NpdGlvbi5oYXNUZXh0T3ZlckltYWdlIHx8IGNvbXBvc2l0aW9uLmhhc0JhY2tncm91bmRJbWFnZSkge1xuICAgICAgLy8gU2VjdGlvbiBuZWVkcyBwb3NpdGlvbjogcmVsYXRpdmUgZm9yIG92ZXJsYXkgY2hpbGRyZW5cbiAgICAgIG1lcmdlZFN0eWxlcy5vdmVyZmxvdyA9IG1lcmdlZFN0eWxlcy5vdmVyZmxvdyB8fCAnaGlkZGVuJztcblxuICAgICAgZm9yIChjb25zdCBbZWxlbU5hbWUsIGVsZW1TdHlsZXNdIG9mIE9iamVjdC5lbnRyaWVzKGVsZW1lbnRzKSkge1xuICAgICAgICBpZiAoY29tcG9zaXRpb24ub3ZlcmxheUVsZW1lbnRzLmluY2x1ZGVzKGVsZW1OYW1lKSB8fCBjb21wb3NpdGlvbi5oYXNCYWNrZ3JvdW5kSW1hZ2UpIHtcbiAgICAgICAgICAvLyBGaW5kIG1hdGNoaW5nIGxheWVyIGZvciBwb3NpdGlvbiBkYXRhXG4gICAgICAgICAgY29uc3QgbGF5ZXIgPSBsYXllcnMuZmluZChsID0+IGwubmFtZSA9PT0gZWxlbU5hbWUpO1xuICAgICAgICAgIGlmIChsYXllciAmJiBsYXllci5yb2xlICE9PSAnYmFja2dyb3VuZF9pbWFnZScpIHtcbiAgICAgICAgICAgIGVsZW1TdHlsZXMucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgICAgICAgICAgZWxlbVN0eWxlcy56SW5kZXggPSBsYXllci56SW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRm9ybSBkZXRlY3Rpb25cbiAgICBjb25zdCBmb3JtUmVzdWx0ID0gZGV0ZWN0Rm9ybVNlY3Rpb24obm9kZSk7XG5cbiAgICAvLyBPcmRlcmVkIHRleHQgY29udGVudCBcdTIwMTQgZXZlcnkgdGV4dCBpbiByZWFkaW5nIG9yZGVyIChmb3IgcGFnZS1hc3NlbWJsZXIgbWFwcGluZylcbiAgICBjb25zdCB0ZXh0Q29udGVudEluT3JkZXIgPSBleHRyYWN0VGV4dENvbnRlbnRJbk9yZGVyKG5vZGUpO1xuXG4gICAgLy8gUGF0dGVybiBkZXRlY3Rpb24gKGNhcm91c2VsIC8gYWNjb3JkaW9uIC8gdGFicyAvIG1vZGFsKVxuICAgIGxldCBjb21wb25lbnRQYXR0ZXJuczogUmV0dXJuVHlwZTx0eXBlb2YgZGV0ZWN0Q29tcG9uZW50UGF0dGVybnM+IHwgdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwID0gZGV0ZWN0Q29tcG9uZW50UGF0dGVybnMobm9kZSk7XG4gICAgICBpZiAocC5sZW5ndGggPiAwKSBjb21wb25lbnRQYXR0ZXJucyA9IHA7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdkZXRlY3RDb21wb25lbnRQYXR0ZXJucyBmYWlsZWQgZm9yIHNlY3Rpb24nLCBub2RlLm5hbWUsIGUpO1xuICAgIH1cblxuICAgIC8vIFJlcGVhdGVyIGRldGVjdGlvbiAoY2FyZHMgLyBmZWF0dXJlcyAvIHByaWNpbmcgLyBldGMuKVxuICAgIGxldCByZXBlYXRlcnM6IFJldHVyblR5cGU8dHlwZW9mIGRldGVjdFJlcGVhdGVycz4gfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBkZXRlY3RSZXBlYXRlcnMobm9kZSk7XG4gICAgICBpZiAoT2JqZWN0LmtleXMocikubGVuZ3RoID4gMCkgcmVwZWF0ZXJzID0gcjtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ2RldGVjdFJlcGVhdGVycyBmYWlsZWQgZm9yIHNlY3Rpb24nLCBub2RlLm5hbWUsIGUpO1xuICAgIH1cblxuICAgIC8vIEdsb2JhbCBkZXRlY3Rpb24gKGNyb3NzLXBhZ2UpXG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVNlY3Rpb25OYW1lKG5vZGUubmFtZSk7XG4gICAgY29uc3QgaXNHbG9iYWwgPSBnbG9iYWxOYW1lcyA/IGdsb2JhbE5hbWVzLmhhcyhub3JtYWxpemVkKSA6IGZhbHNlO1xuICAgIGNvbnN0IGdsb2JhbFJvbGUgPSBpc0dsb2JhbFxuICAgICAgPyBjbGFzc2lmeUdsb2JhbFJvbGUoaSwgc2VjdGlvbk5vZGVzLmxlbmd0aCwgTWF0aC5yb3VuZChib3VuZHMuaGVpZ2h0KSlcbiAgICAgIDogbnVsbDtcblxuICAgIC8vIE5hdmlnYXRpb24gKG9ubHkgd29ydGggY29tcHV0aW5nIGZvciBoZWFkZXIvZm9vdGVyIGNhbmRpZGF0ZXMpXG4gICAgbGV0IG5hdmlnYXRpb246IE5vbk51bGxhYmxlPFJldHVyblR5cGU8dHlwZW9mIGRldGVjdE5hdmlnYXRpb24+PiB8IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbmFtZSA9IChub2RlLm5hbWUgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAoaXNHbG9iYWwgfHwgL1xcYihoZWFkZXJ8Zm9vdGVyfG5hdnxuYXZiYXJ8bmF2aWdhdGlvbilcXGIvLnRlc3QobmFtZSkpIHtcbiAgICAgICAgY29uc3QgbmF2ID0gZGV0ZWN0TmF2aWdhdGlvbihub2RlKTtcbiAgICAgICAgaWYgKG5hdikgbmF2aWdhdGlvbiA9IG5hdjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ2RldGVjdE5hdmlnYXRpb24gZmFpbGVkIGZvciBzZWN0aW9uJywgbm9kZS5uYW1lLCBlKTtcbiAgICB9XG5cbiAgICAvLyBTZWN0aW9uIHNlbWFudGljIHJvbGUgaW5mZXJlbmNlXG4gICAgbGV0IHNlY3Rpb25UeXBlOiBSZXR1cm5UeXBlPHR5cGVvZiBpbmZlclNlY3Rpb25UeXBlPiB8IG51bGwgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICBzZWN0aW9uVHlwZSA9IGluZmVyU2VjdGlvblR5cGUoe1xuICAgICAgICBzZWN0aW9uSW5kZXg6IGksXG4gICAgICAgIHRvdGFsU2VjdGlvbnM6IHNlY3Rpb25Ob2Rlcy5sZW5ndGgsXG4gICAgICAgIGlzRm9ybVNlY3Rpb246IGZvcm1SZXN1bHQuaXNGb3JtLFxuICAgICAgICBwYXR0ZXJuczogY29tcG9uZW50UGF0dGVybnMgfHwgW10sXG4gICAgICAgIHJlcGVhdGVyczogcmVwZWF0ZXJzIHx8IHt9LFxuICAgICAgICBlbGVtZW50cyxcbiAgICAgICAgdGV4dENvbnRlbnRJbk9yZGVyLFxuICAgICAgICBsYXllck5hbWU6IG5vZGUubmFtZSB8fCAnJyxcbiAgICAgICAgc2VjdGlvbkhlaWdodDogTWF0aC5yb3VuZChib3VuZHMuaGVpZ2h0KSxcbiAgICAgICAgaXNHbG9iYWwsXG4gICAgICAgIGdsb2JhbFJvbGUsXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ2luZmVyU2VjdGlvblR5cGUgZmFpbGVkIGZvciBzZWN0aW9uJywgbm9kZS5uYW1lLCBlKTtcbiAgICB9XG5cbiAgICBzcGVjc1tsYXlvdXROYW1lXSA9IHtcbiAgICAgIHNwYWNpbmdTb3VyY2UsXG4gICAgICBmaWdtYU5vZGVJZDogbm9kZS5pZCxcbiAgICAgIHNjcmVlbnNob3RGaWxlOiBgc2NyZWVuc2hvdHMvJHtzY3JlZW5zaG90RmlsZW5hbWUobm9kZS5uYW1lKX1gLFxuICAgICAgc2VjdGlvbjogbWVyZ2VkU3R5bGVzLFxuICAgICAgZWxlbWVudHMsXG4gICAgICBncmlkLFxuICAgICAgaW50ZXJhY3Rpb25zOiBpbnRlcmFjdGlvbnMubGVuZ3RoID4gMCA/IGludGVyYWN0aW9ucyA6IHVuZGVmaW5lZCxcbiAgICAgIG92ZXJsYXAsXG4gICAgICBsYXllcnM6IGxheWVycy5sZW5ndGggPiAwID8gbGF5ZXJzIDogdW5kZWZpbmVkLFxuICAgICAgY29tcG9zaXRpb246IChjb21wb3NpdGlvbi5oYXNUZXh0T3ZlckltYWdlIHx8IGNvbXBvc2l0aW9uLmhhc0JhY2tncm91bmRJbWFnZSkgPyBjb21wb3NpdGlvbiA6IHVuZGVmaW5lZCxcbiAgICAgIGlzRm9ybVNlY3Rpb246IGZvcm1SZXN1bHQuaXNGb3JtIHx8IHVuZGVmaW5lZCxcbiAgICAgIGZvcm1GaWVsZHM6IGZvcm1SZXN1bHQuZmllbGRzLmxlbmd0aCA+IDAgPyBmb3JtUmVzdWx0LmZpZWxkcyA6IHVuZGVmaW5lZCxcbiAgICAgIHRleHRDb250ZW50SW5PcmRlcjogdGV4dENvbnRlbnRJbk9yZGVyLmxlbmd0aCA+IDAgPyB0ZXh0Q29udGVudEluT3JkZXIgOiB1bmRlZmluZWQsXG4gICAgICBjb21wb25lbnRQYXR0ZXJucyxcbiAgICAgIGlzR2xvYmFsOiBpc0dsb2JhbCB8fCB1bmRlZmluZWQsXG4gICAgICBnbG9iYWxSb2xlOiBpc0dsb2JhbCA/IGdsb2JhbFJvbGUgOiB1bmRlZmluZWQsXG4gICAgICBzZWN0aW9uVHlwZTogc2VjdGlvblR5cGU/LnR5cGUsXG4gICAgICBzZWN0aW9uVHlwZUNvbmZpZGVuY2U6IHNlY3Rpb25UeXBlPy5jb25maWRlbmNlLFxuICAgICAgcmVwZWF0ZXJzLFxuICAgICAgbmF2aWdhdGlvbixcbiAgICB9O1xuXG4gICAgcHJldkJvdHRvbSA9IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodDtcbiAgfVxuXG4gIHJldHVybiBzcGVjcztcbn1cbiIsICJpbXBvcnQgeyBJbWFnZUV4cG9ydFRhc2ssIEltYWdlTWFwLCBJbWFnZU1hcEVudHJ5LCBGYWlsZWRFeHBvcnQgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHNsdWdpZnksIHNjcmVlbnNob3RGaWxlbmFtZSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgaGFzSW1hZ2VGaWxsIH0gZnJvbSAnLi9jb2xvcic7XG5cbmNvbnN0IEJBVENIX1NJWkUgPSAxMDtcblxuLyoqXG4gKiBJZGVudGlmeSBzZWN0aW9uLWxldmVsIGNoaWxkcmVuLCBtYXRjaGluZyB0aGUgc2FtZSBsb2dpYyBhcyBzZWN0aW9uLXBhcnNlci50cy5cbiAqIElmIHRoZSBmcmFtZSBoYXMgYSBzaW5nbGUgd3JhcHBlciBjaGlsZCwgZHJpbGwgb25lIGxldmVsIGRlZXBlci5cbiAqL1xuZnVuY3Rpb24gaWRlbnRpZnlTZWN0aW9uTm9kZXMocGFnZUZyYW1lOiBGcmFtZU5vZGUpOiBTY2VuZU5vZGVbXSB7XG4gIGxldCBjYW5kaWRhdGVzID0gcGFnZUZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveCAmJlxuICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveC5oZWlnaHQgPiA1MFxuICApO1xuXG4gIC8vIElmIHRoZXJlJ3MgYSBzaW5nbGUgY29udGFpbmVyIGNoaWxkLCBkcmlsbCBvbmUgbGV2ZWwgZGVlcGVyIChtYXRjaGVzIHNlY3Rpb24tcGFyc2VyLnRzKVxuICBpZiAoY2FuZGlkYXRlcy5sZW5ndGggPT09IDEgJiYgJ2NoaWxkcmVuJyBpbiBjYW5kaWRhdGVzWzBdKSB7XG4gICAgY29uc3Qgd3JhcHBlciA9IGNhbmRpZGF0ZXNbMF0gYXMgRnJhbWVOb2RlO1xuICAgIGNvbnN0IGlubmVyQ2FuZGlkYXRlcyA9IHdyYXBwZXIuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3guaGVpZ2h0ID4gNTBcbiAgICApO1xuICAgIGlmIChpbm5lckNhbmRpZGF0ZXMubGVuZ3RoID4gMSkge1xuICAgICAgY2FuZGlkYXRlcyA9IGlubmVyQ2FuZGlkYXRlcztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gWy4uLmNhbmRpZGF0ZXNdLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueSk7XG59XG5cbi8qKlxuICogQnVpbGQgdGhlIGxpc3Qgb2YgYWxsIGV4cG9ydCB0YXNrcyBmb3IgYSBwYWdlIGZyYW1lLlxuICogSW5jbHVkZXM6IGZ1bGwtcGFnZSBjb21wb3NpdGUgc2NyZWVuc2hvdCwgcGVyLXNlY3Rpb24gc2NyZWVuc2hvdHMsXG4gKiBhbmQgaW1hZ2UgYXNzZXRzIChQTkcgZm9yIHBob3RvcywgU1ZHIGZvciB2ZWN0b3IgaWNvbnMpLlxuICpcbiAqIGBpY29uTWFwYCAoZnJvbSBpY29uLWRldGVjdG9yKSBkZWNpZGVzIHdoaWNoIG5vZGVzIGJlY29tZSBTVkcgaWNvbnMgYW5kXG4gKiB3aGF0IGZpbGVuYW1lIGVhY2ggb25lIGdldHMuIEJvdGggdGhpcyBmdW5jdGlvbiBhbmQgc2VjdGlvbi1wYXJzZXJcbiAqIGNvbnN1bWUgdGhlIHNhbWUgbWFwIHNvIHRoZSBKU09OIHNwZWNzIHJlZmVyZW5jZSBleGFjdGx5IHRoZSBmaWxlcyB3ZVxuICogZXhwb3J0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRFeHBvcnRUYXNrcyhcbiAgcGFnZUZyYW1lOiBGcmFtZU5vZGUsXG4gIHBhZ2VTbHVnOiBzdHJpbmcsXG4gIGljb25NYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4pOiBJbWFnZUV4cG9ydFRhc2tbXSB7XG4gIGNvbnN0IHRhc2tzOiBJbWFnZUV4cG9ydFRhc2tbXSA9IFtdO1xuICBjb25zdCBwYWdlUGF0aCA9IGBwYWdlcy8ke3BhZ2VTbHVnfWA7XG5cbiAgLy8gRnVsbC1wYWdlIGNvbXBvc2l0ZSBzY3JlZW5zaG90IFx1MjAxNCBjcml0aWNhbCBmb3IgYWdlbnQncyBmdWxsLXBhZ2UgdmlzdWFsIHJldmlldy5cbiAgdGFza3MucHVzaCh7XG4gICAgbm9kZUlkOiBwYWdlRnJhbWUuaWQsXG4gICAgbm9kZU5hbWU6IHBhZ2VGcmFtZS5uYW1lLFxuICAgIHR5cGU6ICdmdWxsLXBhZ2UnLFxuICAgIGZpbGVuYW1lOiAnX2Z1bGwtcGFnZS5wbmcnLFxuICAgIHBhZ2VQYXRoLFxuICAgIGZvcm1hdDogJ1BORycsXG4gICAgc2NhbGU6IDEsXG4gIH0pO1xuXG4gIC8vIFBlci1zZWN0aW9uIHNjcmVlbnNob3RzIGF0IDF4IFx1MjAxNCB1c2VzIHNhbWUgd3JhcHBlciBkcmlsbC1kb3duIGFzIHNlY3Rpb24tcGFyc2VyXG4gIGNvbnN0IHNlY3Rpb25zID0gaWRlbnRpZnlTZWN0aW9uTm9kZXMocGFnZUZyYW1lKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdGFza3MucHVzaCh7XG4gICAgICBub2RlSWQ6IHNlY3Rpb25zW2ldLmlkLFxuICAgICAgbm9kZU5hbWU6IHNlY3Rpb25zW2ldLm5hbWUsXG4gICAgICB0eXBlOiAnc2NyZWVuc2hvdCcsXG4gICAgICBmaWxlbmFtZTogc2NyZWVuc2hvdEZpbGVuYW1lKHNlY3Rpb25zW2ldLm5hbWUpLFxuICAgICAgcGFnZVBhdGgsXG4gICAgICBmb3JtYXQ6ICdQTkcnLFxuICAgICAgc2NhbGU6IDEsXG4gICAgfSk7XG4gIH1cblxuICAvLyBJY29uIFNWRyB0YXNrcyBcdTIwMTQgb25lIHBlciB1bmlxdWUgZmlsZW5hbWUuIE11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGVcbiAgLy8gc2FtZSBsaWJyYXJ5IGljb24gY29sbGFwc2UgdG8gYSBzaW5nbGUgZXhwb3J0IChoYW5kbGVkIGJ5IGljb24tZGV0ZWN0b3IpLlxuICBjb25zdCBmaWxlbmFtZVRvRmlyc3ROb2RlSWQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IFtub2RlSWQsIGZpbGVuYW1lXSBvZiBpY29uTWFwKSB7XG4gICAgaWYgKCFmaWxlbmFtZVRvRmlyc3ROb2RlSWQuaGFzKGZpbGVuYW1lKSkge1xuICAgICAgZmlsZW5hbWVUb0ZpcnN0Tm9kZUlkLnNldChmaWxlbmFtZSwgbm9kZUlkKTtcbiAgICB9XG4gIH1cbiAgY29uc3QgaWNvblJvb3RJZHMgPSBuZXcgU2V0KGljb25NYXAua2V5cygpKTtcbiAgZm9yIChjb25zdCBbZmlsZW5hbWUsIG5vZGVJZF0gb2YgZmlsZW5hbWVUb0ZpcnN0Tm9kZUlkKSB7XG4gICAgY29uc3Qgbm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKG5vZGVJZCk7XG4gICAgaWYgKCFub2RlKSBjb250aW51ZTtcbiAgICB0YXNrcy5wdXNoKHtcbiAgICAgIG5vZGVJZCxcbiAgICAgIG5vZGVOYW1lOiAobm9kZSBhcyBTY2VuZU5vZGUpLm5hbWUsXG4gICAgICB0eXBlOiAnYXNzZXQnLFxuICAgICAgZmlsZW5hbWUsXG4gICAgICBwYWdlUGF0aCxcbiAgICAgIGZvcm1hdDogJ1NWRycsXG4gICAgICBzY2FsZTogMSxcbiAgICAgIHByZWZlclN2ZzogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFJhc3RlciBpbWFnZSB0YXNrcyBcdTIwMTQgc2tpcCBhbnl0aGluZyBpbnNpZGUgYW4gaWNvbiByb290IChkZXNjZW5kYW50XG4gIC8vIHZlY3RvcnMgZG9uJ3QgbmVlZCB0aGVpciBvd24gZXhwb3J0KS5cbiAgY29uc3QgaW1hZ2VOb2RlcyA9IGZpbmRJbWFnZU5vZGVzKHBhZ2VGcmFtZSk7XG4gIGNvbnN0IHNlZW5IYXNoZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IGltZ05vZGUgb2YgaW1hZ2VOb2Rlcykge1xuICAgIGlmIChpY29uUm9vdElkcy5oYXMoaW1nTm9kZS5pZCkpIGNvbnRpbnVlO1xuICAgIGlmIChpc0luc2lkZUljb25Sb290KGltZ05vZGUsIGljb25Sb290SWRzKSkgY29udGludWU7XG4gICAgY29uc3QgaGFzaEtleSA9IGAke2ltZ05vZGUubmFtZX1fJHtpbWdOb2RlLmFic29sdXRlQm91bmRpbmdCb3g/LndpZHRofV8ke2ltZ05vZGUuYWJzb2x1dGVCb3VuZGluZ0JveD8uaGVpZ2h0fWA7XG4gICAgaWYgKHNlZW5IYXNoZXMuaGFzKGhhc2hLZXkpKSBjb250aW51ZTtcbiAgICBzZWVuSGFzaGVzLmFkZChoYXNoS2V5KTtcblxuICAgIGNvbnN0IGZpbGVuYW1lID0gYCR7c2x1Z2lmeShpbWdOb2RlLm5hbWUpfS5wbmdgO1xuICAgIHRhc2tzLnB1c2goe1xuICAgICAgbm9kZUlkOiBpbWdOb2RlLmlkLFxuICAgICAgbm9kZU5hbWU6IGltZ05vZGUubmFtZSxcbiAgICAgIHR5cGU6ICdhc3NldCcsXG4gICAgICBmaWxlbmFtZSxcbiAgICAgIHBhZ2VQYXRoLFxuICAgICAgZm9ybWF0OiAnUE5HJyxcbiAgICAgIHNjYWxlOiAxLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHRhc2tzO1xufVxuXG4vKipcbiAqIFdhbGsgYSBub2RlJ3MgYW5jZXN0cnkgY2hlY2tpbmcgd2hldGhlciBhbnkgYW5jZXN0b3IgaXMgYW4gaWNvbiByb290LlxuICogVXNlZCB0byBzdXBwcmVzcyBkdXBsaWNhdGUgZXhwb3J0cyBmb3IgdmVjdG9ycyBpbnNpZGUgYW4gaWNvbiBncm91cC5cbiAqL1xuZnVuY3Rpb24gaXNJbnNpZGVJY29uUm9vdChub2RlOiBTY2VuZU5vZGUsIGljb25Sb290SWRzOiBTZXQ8c3RyaW5nPik6IGJvb2xlYW4ge1xuICBsZXQgcDogQmFzZU5vZGUgfCBudWxsID0gbm9kZS5wYXJlbnQ7XG4gIHdoaWxlIChwKSB7XG4gICAgaWYgKCdpZCcgaW4gcCAmJiBpY29uUm9vdElkcy5oYXMoKHAgYXMgYW55KS5pZCkpIHJldHVybiB0cnVlO1xuICAgIHAgPSAocCBhcyBhbnkpLnBhcmVudDtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogRmluZCBhbGwgbm9kZXMgd2l0aCBJTUFHRSBmaWxscyBpbiBhIHN1YnRyZWUuXG4gKi9cbmZ1bmN0aW9uIGZpbmRJbWFnZU5vZGVzKHJvb3Q6IFNjZW5lTm9kZSk6IFNjZW5lTm9kZVtdIHtcbiAgY29uc3Qgbm9kZXM6IFNjZW5lTm9kZVtdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAoaGFzSW1hZ2VGaWxsKG5vZGUgYXMgYW55KSkge1xuICAgICAgbm9kZXMucHVzaChub2RlKTtcbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIGlmIChjaGlsZC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdhbGsocm9vdCk7XG4gIHJldHVybiBub2Rlcztcbn1cblxuLyoqXG4gKiBFeHBvcnQgYSBzaW5nbGUgbm9kZSBhcyBQTkcvU1ZHIGJ5dGVzLlxuICpcbiAqIEZvciBzZWN0aW9uIHNjcmVlbnNob3RzLCB0aGlzIHVzZXMgZXhwb3J0QXN5bmMgd2hpY2ggcmVuZGVycyB0aGUgY29tcG9zaXRlXG4gKiAoaW1hZ2UgKyB0ZXh0ICsgb3ZlcmxheXMpIFx1MjAxNCBjb3JyZWN0IGZvciBzY3JlZW5zaG90cy5cbiAqXG4gKiBGb3IgaW1hZ2UgYXNzZXRzLCB0aGlzIHB1bGxzIHRoZSBSQVcgaW1hZ2UgYnl0ZXMgZnJvbSB0aGUgbm9kZSdzIElNQUdFIGZpbGxcbiAqIHZpYSBmaWdtYS5nZXRJbWFnZUJ5SGFzaCgpLiBUaGlzIHJldHVybnMgdGhlIHB1cmUgc291cmNlIGltYWdlIHdpdGggTk9cbiAqIHRleHQvc2hhcGUgb3ZlcmxheXMgYmFrZWQgaW4gXHUyMDE0IGZpeGluZyB0aGUgY29tbW9uIFwiaGVybyBpbWFnZSBpbmNsdWRlcyB0aGVcbiAqIGhlYWRsaW5lIHRleHRcIiBwcm9ibGVtLiBNYXNrcyBhbmQgY3JvcHMgYXJlIGRpc2NhcmRlZCBpbnRlbnRpb25hbGx5OyB0aGVcbiAqIHRoZW1lIHJlLWFwcGxpZXMgdGhlbSB2aWEgQ1NTIChvYmplY3QtZml0LCBiYWNrZ3JvdW5kLXNpemUsIGJvcmRlci1yYWRpdXMpLlxuICpcbiAqIEFzc2V0IGZhbGxiYWNrOiBpZiB0aGUgbm9kZSBoYXMgbm8gaW1hZ2UgZmlsbCAoZS5nLiBhbiBTVkcgaWxsdXN0cmF0aW9uKSxcbiAqIGZhbGwgYmFjayB0byBleHBvcnRBc3luYyBzbyBsb2dvcy9pY29ucyBzdGlsbCBleHBvcnQgY29ycmVjdGx5LlxuICovXG5hc3luYyBmdW5jdGlvbiBleHBvcnROb2RlKFxuICBub2RlSWQ6IHN0cmluZyxcbiAgZm9ybWF0OiAnUE5HJyB8ICdTVkcnIHwgJ0pQRycsXG4gIHNjYWxlOiBudW1iZXIsXG4gIHRhc2tUeXBlOiAnc2NyZWVuc2hvdCcgfCAnZnVsbC1wYWdlJyB8ICdhc3NldCcsXG4pOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgY29uc3Qgbm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKG5vZGVJZCk7XG4gIGlmICghbm9kZSB8fCAhKCdleHBvcnRBc3luYycgaW4gbm9kZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vZGUgJHtub2RlSWR9IG5vdCBmb3VuZCBvciBub3QgZXhwb3J0YWJsZWApO1xuICB9XG5cbiAgLy8gU1ZHIHJlcXVlc3RlZCBcdTIwMTQgdXNlIGV4cG9ydEFzeW5jIGRpcmVjdGx5IChmb3IgaWNvbnMsIHZlY3RvciBpbGx1c3RyYXRpb25zKVxuICBpZiAoZm9ybWF0ID09PSAnU1ZHJykge1xuICAgIHJldHVybiBhd2FpdCAobm9kZSBhcyBTY2VuZU5vZGUpLmV4cG9ydEFzeW5jKHsgZm9ybWF0OiAnU1ZHJyB9KTtcbiAgfVxuXG4gIC8vIEZvciBQTkcgYXNzZXQgdGFza3M6IHRyeSB0byBwdWxsIHJhdyBpbWFnZSBieXRlcyBmcm9tIGFuIElNQUdFIGZpbGwgZmlyc3RcbiAgLy8gc28gd2UgZ2V0IHRoZSBwdXJlIHNvdXJjZSBpbWFnZSB3aXRob3V0IGFueSBiYWtlZC1pbiB0ZXh0L292ZXJsYXlzLlxuICBpZiAodGFza1R5cGUgPT09ICdhc3NldCcgJiYgZm9ybWF0ID09PSAnUE5HJykge1xuICAgIGNvbnN0IHJhdyA9IGF3YWl0IHRyeUV4dHJhY3RSYXdJbWFnZUJ5dGVzKG5vZGUgYXMgU2NlbmVOb2RlKTtcbiAgICBpZiAocmF3KSByZXR1cm4gcmF3O1xuICAgIC8vIGVsc2UgZmFsbCB0aHJvdWdoIHRvIGV4cG9ydEFzeW5jIChTVkcgaWxsdXN0cmF0aW9uLCB2ZWN0b3IgZ3JhcGhpYywgZXRjLilcbiAgfVxuXG4gIC8vIEZ1bGwtcGFnZSBhbmQgc2VjdGlvbiBzY3JlZW5zaG90cyB1c2UgZXhwb3J0QXN5bmMgKHJlbmRlcmVkIGNvbXBvc2l0ZSkuXG4gIC8vIFNjYWxlIHVwIHRvIDJ4IGZvciBmdWxsLXBhZ2UgdG8gcHJlc2VydmUgZGV0YWlsIHdoZW4gY29tcGFyaW5nIHdpdGggYnJvd3Nlci5cbiAgY29uc3QgZXhwb3J0U2NhbGUgPSB0YXNrVHlwZSA9PT0gJ2Z1bGwtcGFnZScgPyAyIDogc2NhbGU7XG4gIHJldHVybiBhd2FpdCAobm9kZSBhcyBTY2VuZU5vZGUpLmV4cG9ydEFzeW5jKHtcbiAgICBmb3JtYXQ6ICdQTkcnLFxuICAgIGNvbnN0cmFpbnQ6IHsgdHlwZTogJ1NDQUxFJywgdmFsdWU6IGV4cG9ydFNjYWxlIH0sXG4gIH0pO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgcmF3IGltYWdlIGJ5dGVzIGZyb20gdGhlIGZpcnN0IHZpc2libGUgSU1BR0UgZmlsbCBvbiBhIG5vZGUuXG4gKiBSZXR1cm5zIG51bGwgaWYgdGhlIG5vZGUgaGFzIG5vIElNQUdFIGZpbGwgb3IgdGhlIGhhc2ggY2FuJ3QgYmUgcmVzb2x2ZWQuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHRyeUV4dHJhY3RSYXdJbWFnZUJ5dGVzKG5vZGU6IFNjZW5lTm9kZSk6IFByb21pc2U8VWludDhBcnJheSB8IG51bGw+IHtcbiAgY29uc3QgZmlsbHMgPSAobm9kZSBhcyBhbnkpLmZpbGxzO1xuICBpZiAoIWZpbGxzIHx8ICFBcnJheS5pc0FycmF5KGZpbGxzKSkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgaW1hZ2VGaWxsID0gZmlsbHMuZmluZChcbiAgICAoZjogUGFpbnQpID0+IGYudHlwZSA9PT0gJ0lNQUdFJyAmJiBmLnZpc2libGUgIT09IGZhbHNlICYmIChmIGFzIEltYWdlUGFpbnQpLmltYWdlSGFzaCxcbiAgKSBhcyBJbWFnZVBhaW50IHwgdW5kZWZpbmVkO1xuXG4gIGlmICghaW1hZ2VGaWxsIHx8ICFpbWFnZUZpbGwuaW1hZ2VIYXNoKSByZXR1cm4gbnVsbDtcblxuICB0cnkge1xuICAgIGNvbnN0IGltYWdlID0gZmlnbWEuZ2V0SW1hZ2VCeUhhc2goaW1hZ2VGaWxsLmltYWdlSGFzaCk7XG4gICAgaWYgKCFpbWFnZSkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIGF3YWl0IGltYWdlLmdldEJ5dGVzQXN5bmMoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS53YXJuKGBGYWlsZWQgdG8gZXh0cmFjdCByYXcgaW1hZ2UgYnl0ZXMgZnJvbSAke25vZGUubmFtZX06YCwgZXJyKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIEV4ZWN1dGUgZXhwb3J0IHRhc2tzIGluIGJhdGNoZXMgb2YgMTAuXG4gKiBTZW5kcyBlYWNoIHJlc3VsdCB0byBVSSBpbW1lZGlhdGVseSB0byBmcmVlIHNhbmRib3ggbWVtb3J5LlxuICpcbiAqIE9uIFNWRyBleHBvcnQgZmFpbHVyZSAoc29tZSBGaWdtYSB2ZWN0b3IgZmVhdHVyZXMgY2FuJ3Qgc2VyaWFsaXplKSxcbiAqIGF1dG9tYXRpY2FsbHkgcmV0cmllcyBhcyBQTkcgQCAyeCBhbmQgZW1pdHMgdGhlIC5wbmcgZmlsZW5hbWUgaW5zdGVhZC5cbiAqIEJvdGggdGhlIG9yaWdpbmFsIGZhaWx1cmUgYW5kIHRoZSBmYWxsYmFjayBhcmUgcmVjb3JkZWQgaW4gdGhlIHJldHVybmVkXG4gKiBgZmFpbGVkYCBsaXN0IHNvIHRoZSBleHRyYWN0b3IgY2FuIHBhdGNoIGVsZW1lbnQgcmVmZXJlbmNlcy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVCYXRjaEV4cG9ydChcbiAgdGFza3M6IEltYWdlRXhwb3J0VGFza1tdLFxuICBvblByb2dyZXNzOiAoY3VycmVudDogbnVtYmVyLCB0b3RhbDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKSA9PiB2b2lkLFxuICBvbkRhdGE6ICh0YXNrOiBJbWFnZUV4cG9ydFRhc2ssIGRhdGE6IFVpbnQ4QXJyYXkpID0+IHZvaWQsXG4gIHNob3VsZENhbmNlbDogKCkgPT4gYm9vbGVhbixcbik6IFByb21pc2U8RmFpbGVkRXhwb3J0W10+IHtcbiAgY29uc3QgdG90YWwgPSB0YXNrcy5sZW5ndGg7XG4gIGNvbnN0IGZhaWxlZDogRmFpbGVkRXhwb3J0W10gPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsOyBpICs9IEJBVENIX1NJWkUpIHtcbiAgICBpZiAoc2hvdWxkQ2FuY2VsKCkpIHJldHVybiBmYWlsZWQ7XG5cbiAgICBjb25zdCBiYXRjaCA9IHRhc2tzLnNsaWNlKGksIGkgKyBCQVRDSF9TSVpFKTtcbiAgICBjb25zdCBiYXRjaFByb21pc2VzID0gYmF0Y2gubWFwKGFzeW5jICh0YXNrKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgZXhwb3J0Tm9kZSh0YXNrLm5vZGVJZCwgdGFzay5mb3JtYXQsIHRhc2suc2NhbGUsIHRhc2sudHlwZSk7XG4gICAgICAgIG9uRGF0YSh0YXNrLCBkYXRhKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCByZWFzb24gPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG5cbiAgICAgICAgLy8gU1ZHIGNhbiBmYWlsIGZvciB2ZWN0b3JzIHdpdGggdW5zdXBwb3J0ZWQgZmVhdHVyZXMgKG9wZW4gcGF0aHNcbiAgICAgICAgLy8gd2l0aCBzdHJva2UgY2FwcywgY2VydGFpbiBibGVuZCBtb2RlcywgYm91bmQgdmFyaWFibGVzIG9uIGZpbGxzKS5cbiAgICAgICAgLy8gRmFsbCBiYWNrIHRvIFBORyBAIDJ4IHNvIHRoZSBkZXNpZ24gaXNuJ3QgdmlzdWFsbHkgbWlzc2luZy5cbiAgICAgICAgaWYgKHRhc2suZm9ybWF0ID09PSAnU1ZHJykge1xuICAgICAgICAgIGNvbnN0IHBuZ0ZpbGVuYW1lID0gdGFzay5maWxlbmFtZS5yZXBsYWNlKC9cXC5zdmckL2ksICcucG5nJyk7XG4gICAgICAgICAgY29uc3QgcG5nVGFzazogSW1hZ2VFeHBvcnRUYXNrID0ge1xuICAgICAgICAgICAgLi4udGFzayxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBwbmdGaWxlbmFtZSxcbiAgICAgICAgICAgIGZvcm1hdDogJ1BORycsXG4gICAgICAgICAgICBzY2FsZTogMixcbiAgICAgICAgICB9O1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgZXhwb3J0Tm9kZSh0YXNrLm5vZGVJZCwgJ1BORycsIDIsIHRhc2sudHlwZSk7XG4gICAgICAgICAgICBvbkRhdGEocG5nVGFzaywgZGF0YSk7XG4gICAgICAgICAgICBmYWlsZWQucHVzaCh7XG4gICAgICAgICAgICAgIGZpbGVuYW1lOiB0YXNrLmZpbGVuYW1lLFxuICAgICAgICAgICAgICBub2RlTmFtZTogdGFzay5ub2RlTmFtZSxcbiAgICAgICAgICAgICAgcmVhc29uOiBgU1ZHIGV4cG9ydCBmYWlsZWQgKCR7cmVhc29ufSk7IGZlbGwgYmFjayB0byBQTkdgLFxuICAgICAgICAgICAgICBmYWxsYmFja0ZpbGVuYW1lOiBwbmdGaWxlbmFtZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0gY2F0Y2ggKHBuZ0Vycikge1xuICAgICAgICAgICAgY29uc3QgcG5nUmVhc29uID0gcG5nRXJyIGluc3RhbmNlb2YgRXJyb3IgPyBwbmdFcnIubWVzc2FnZSA6IFN0cmluZyhwbmdFcnIpO1xuICAgICAgICAgICAgZmFpbGVkLnB1c2goe1xuICAgICAgICAgICAgICBmaWxlbmFtZTogdGFzay5maWxlbmFtZSxcbiAgICAgICAgICAgICAgbm9kZU5hbWU6IHRhc2subm9kZU5hbWUsXG4gICAgICAgICAgICAgIHJlYXNvbjogYFNWRyBhbmQgUE5HIGZhbGxiYWNrIGJvdGggZmFpbGVkOiAke3JlYXNvbn0gLyAke3BuZ1JlYXNvbn1gLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIGV4cG9ydCAke3Rhc2suZmlsZW5hbWV9OmAsIGVycik7XG4gICAgICAgIGZhaWxlZC5wdXNoKHtcbiAgICAgICAgICBmaWxlbmFtZTogdGFzay5maWxlbmFtZSxcbiAgICAgICAgICBub2RlTmFtZTogdGFzay5ub2RlTmFtZSxcbiAgICAgICAgICByZWFzb24sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoYmF0Y2hQcm9taXNlcyk7XG4gICAgY29uc3QgZG9uZSA9IE1hdGgubWluKGkgKyBCQVRDSF9TSVpFLCB0b3RhbCk7XG4gICAgb25Qcm9ncmVzcyhkb25lLCB0b3RhbCwgYEV4cG9ydGluZyAoJHtkb25lfS8ke3RvdGFsfSkuLi5gKTtcbiAgfVxuXG4gIHJldHVybiBmYWlsZWQ7XG59XG5cbi8qKlxuICogQnVpbGQgdGhlIGltYWdlLW1hcC5qc29uIGZyb20gZXhwb3J0IHRhc2tzIGFuZCBzZWN0aW9uIGRhdGEuXG4gKlxuICogYGljb25NYXBgIHBvcHVsYXRlcyBgYnlfc2VjdGlvbmAgZm9yIGljb24gdXNhZ2Ugc28gdGhlIGFnZW50IGNhbiB0cmFjZVxuICogXCJzZWN0aW9uIFggdXNlcyBjaGV2cm9uLXJpZ2h0LnN2Z1wiIGluc3RlYWQgb2YgZ2V0dGluZyBhIGNvbnRleHQtbGVzc1xuICogZ2xvYmFsIGxpc3Qgb2YgU1ZHcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkSW1hZ2VNYXAoXG4gIHRhc2tzOiBJbWFnZUV4cG9ydFRhc2tbXSxcbiAgc2VjdGlvbnM6IHsgbmFtZTogc3RyaW5nOyBjaGlsZHJlbjogU2NlbmVOb2RlW10gfVtdLFxuICBpY29uTWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuKTogSW1hZ2VNYXAge1xuICBjb25zdCBpbWFnZXM6IFJlY29yZDxzdHJpbmcsIEltYWdlTWFwRW50cnk+ID0ge307XG4gIGNvbnN0IGJ5U2VjdGlvbk1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge307XG5cbiAgY29uc3QgYXNzZXRUYXNrcyA9IHRhc2tzLmZpbHRlcih0ID0+IHQudHlwZSA9PT0gJ2Fzc2V0Jyk7XG5cbiAgZm9yIChjb25zdCB0YXNrIG9mIGFzc2V0VGFza3MpIHtcbiAgICBpbWFnZXNbdGFzay5maWxlbmFtZV0gPSB7XG4gICAgICBmaWxlOiB0YXNrLmZpbGVuYW1lLFxuICAgICAgZXh0OiB0YXNrLmZvcm1hdC50b0xvd2VyQ2FzZSgpLFxuICAgICAgbm9kZU5hbWVzOiBbdGFzay5ub2RlTmFtZV0sXG4gICAgICByZWFkYWJsZU5hbWU6IHRhc2suZmlsZW5hbWUsXG4gICAgICBkaW1lbnNpb25zOiBudWxsLFxuICAgICAgdXNlZEluU2VjdGlvbnM6IFtdLFxuICAgIH07XG4gIH1cblxuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2Ygc2VjdGlvbnMpIHtcbiAgICBjb25zdCBzZWN0aW9uSW1hZ2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgICAgLy8gSWNvbiByb290IFx1MjAxNCByZWNvcmQgU1ZHIGFuZCBzdG9wIChkb24ndCBkZXNjZW5kIGludG8gdmVjdG9yIGludGVybmFscylcbiAgICAgIGNvbnN0IGljb25GaWxlbmFtZSA9IGljb25NYXAuZ2V0KG5vZGUuaWQpO1xuICAgICAgaWYgKGljb25GaWxlbmFtZSkge1xuICAgICAgICBzZWN0aW9uSW1hZ2VzLmFkZChpY29uRmlsZW5hbWUpO1xuICAgICAgICBpZiAoaW1hZ2VzW2ljb25GaWxlbmFtZV0gJiYgIWltYWdlc1tpY29uRmlsZW5hbWVdLnVzZWRJblNlY3Rpb25zLmluY2x1ZGVzKHNlY3Rpb24ubmFtZSkpIHtcbiAgICAgICAgICBpbWFnZXNbaWNvbkZpbGVuYW1lXS51c2VkSW5TZWN0aW9ucy5wdXNoKHNlY3Rpb24ubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaGFzSW1hZ2VGaWxsKG5vZGUgYXMgYW55KSkge1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGAke3NsdWdpZnkobm9kZS5uYW1lKX0ucG5nYDtcbiAgICAgICAgc2VjdGlvbkltYWdlcy5hZGQoZmlsZW5hbWUpO1xuICAgICAgICBpZiAoaW1hZ2VzW2ZpbGVuYW1lXSAmJiAhaW1hZ2VzW2ZpbGVuYW1lXS51c2VkSW5TZWN0aW9ucy5pbmNsdWRlcyhzZWN0aW9uLm5hbWUpKSB7XG4gICAgICAgICAgaW1hZ2VzW2ZpbGVuYW1lXS51c2VkSW5TZWN0aW9ucy5wdXNoKHNlY3Rpb24ubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygc2VjdGlvbi5jaGlsZHJlbikge1xuICAgICAgd2FsayhjaGlsZCk7XG4gICAgfVxuICAgIGJ5U2VjdGlvbk1hcFtzZWN0aW9uLm5hbWVdID0gWy4uLnNlY3Rpb25JbWFnZXNdO1xuICB9XG5cbiAgcmV0dXJuIHsgaW1hZ2VzLCBieV9zZWN0aW9uOiBieVNlY3Rpb25NYXAgfTtcbn1cbiIsICJpbXBvcnQgeyBoYXNJbWFnZUZpbGwgfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IHNsdWdpZnksIGlzRGVmYXVsdExheWVyTmFtZSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIFNoYXJlZCBpY29uIGRldGVjdGlvbiBmb3IgaW1hZ2UtZXhwb3J0ZXIgKGRlY2lkZXMgd2hhdCB0byBTVkctZXhwb3J0KVxuICogYW5kIHNlY3Rpb24tcGFyc2VyIChkZWNpZGVzIHdoaWNoIGVsZW1lbnRzIGdldCBhbiBgaWNvbkZpbGVgIHJlZmVyZW5jZSkuXG4gKlxuICogQm90aCBtb2R1bGVzIE1VU1QgYWdyZWUgb24gKGEpIHdoaWNoIG5vZGVzIGFyZSBpY29ucyBhbmQgKGIpIHRoZSBmaWxlbmFtZVxuICogZWFjaCBpY29uIHJlY2VpdmVzIFx1MjAxNCBvdGhlcndpc2Ugc2VjdGlvbi1zcGVjcy5qc29uIHBvaW50cyBhdCBmaWxlcyB0aGF0XG4gKiBuZXZlciBtYWRlIGl0IGludG8gdGhlIFpJUCwgd2hpY2ggaXMgdGhlIG9yaWdpbmFsIFwiaWNvbiBtaXNzaW5nXCIgYnVnLlxuICpcbiAqIEZpbGVuYW1lIHVuaXF1ZW5lc3MgaXMgdGhlIHJlc3BvbnNpYmlsaXR5IG9mIGBidWlsZEljb25GaWxlbmFtZU1hcGA6XG4gKiBJTlNUQU5DRSBub2RlcyBwb2ludGluZyBhdCB0aGUgc2FtZSBtYWluIGNvbXBvbmVudCBjb2xsYXBzZSB0byBvbmUgZmlsZSxcbiAqIGFuZCBzbHVnIGNvbGxpc2lvbnMgZ2V0IGEgbnVtZXJpYyBzdWZmaXguXG4gKi9cblxuY29uc3QgSUNPTl9OQU1FX0hJTlQgPSAvXFxiKGljb258Y2hldnJvbnxhcnJvd3xjYXJldHxjaGVja3x0aWNrfGNsb3NlfGNyb3NzfG1lbnV8YnVyZ2VyfGhhbWJ1cmdlcnxzZWFyY2h8cGx1c3xtaW51c3xzdGFyfGhlYXJ0fGxvZ298c29jaWFsfHN5bWJvbHxnbHlwaHxwbGF5fHBhdXNlfHN0b3B8bmV4dHxwcmV2fHNoYXJlfGRvd25sb2FkfHVwbG9hZHxlZGl0fHRyYXNofGRlbGV0ZXxpbmZvfHdhcm5pbmd8ZXJyb3J8c3VjY2VzcylcXGIvaTtcbmNvbnN0IElDT05fU0laRV9DQVAgPSAxMjg7XG5cbi8qKlxuICogVHJ1ZSBpZiB0aGUgbm9kZSBpcyBcInZlY3Rvci1vbmx5XCIgXHUyMDE0IG5vIFRFWFQsIG5vIElNQUdFIGZpbGwgYW55d2hlcmUgaW5cbiAqIGl0cyBzdWJ0cmVlLiBQdXJlLXZlY3RvciBpY29ucyBjYW4gYmUgZXhwb3J0ZWQgYXMgU1ZHIHdpdGhvdXQgbG9zaW5nXG4gKiBmaWRlbGl0eTsgbWl4ZWQgc3VidHJlZXMgbXVzdCBmYWxsIGJhY2sgdG8gUE5HLlxuICovXG5mdW5jdGlvbiBpc1ZlY3Rvck9ubHkobjogU2NlbmVOb2RlKTogYm9vbGVhbiB7XG4gIGlmIChuLnR5cGUgPT09ICdURVhUJykgcmV0dXJuIGZhbHNlO1xuICBpZiAoaGFzSW1hZ2VGaWxsKG4gYXMgYW55KSkgcmV0dXJuIGZhbHNlO1xuICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiAobiBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQudmlzaWJsZSA9PT0gZmFsc2UpIGNvbnRpbnVlO1xuICAgICAgaWYgKCFpc1ZlY3Rvck9ubHkoY2hpbGQpKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFByZWRpY2F0ZTogaXMgdGhpcyBub2RlIGFuIGljb24gcm9vdCB0aGF0IHNob3VsZCBiZSBleHBvcnRlZCBhcyBTVkc/XG4gKlxuICogSGV1cmlzdGljcyAoYW55IG9uZSBpcyBzdWZmaWNpZW50KTpcbiAqICAgMS4gbm9kZS50eXBlID09PSBWRUNUT1Igb3IgQk9PTEVBTl9PUEVSQVRJT04gKHJhdyB2ZWN0b3IgcGF0aCAvIFVuaW9uKVxuICogICAyLiBGUkFNRSAvIEdST1VQIC8gQ09NUE9ORU5UIC8gSU5TVEFOQ0Ugd2hvc2UgZW50aXJlIHN1YnRyZWUgaXMgdmVjdG9yLW9ubHlcbiAqICAgICAgQU5EIGlzIGVpdGhlciBzbWFsbCAoPD0xMjhcdTAwRDcxMjgpIE9SIGhhcyBhIG5hbWUgaGludCAoaWNvbiwgY2hldnJvbiwgXHUyMDI2KVxuICpcbiAqIFdoYXRldmVyIHRoaXMgcmV0dXJucyB0cnVlIGZvciwgaW1hZ2UtZXhwb3J0ZXIgd2lsbCBxdWV1ZSBhbiBTVkcgZXhwb3J0XG4gKiBBTkQgc2VjdGlvbi1wYXJzZXIgd2lsbCBlbWl0IGFuIGBpY29uRmlsZWAgcmVmZXJlbmNlIG9uIHRoZSBtYXRjaGluZyBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJY29uTm9kZShub2RlOiBTY2VuZU5vZGUpOiBib29sZWFuIHtcbiAgaWYgKG5vZGUudmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybiBmYWxzZTtcblxuICBpZiAobm9kZS50eXBlID09PSAnVkVDVE9SJyB8fCBub2RlLnR5cGUgPT09ICdCT09MRUFOX09QRVJBVElPTicpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmIChub2RlLnR5cGUgIT09ICdGUkFNRScgJiYgbm9kZS50eXBlICE9PSAnQ09NUE9ORU5UJyAmJlxuICAgICAgbm9kZS50eXBlICE9PSAnSU5TVEFOQ0UnICYmIG5vZGUudHlwZSAhPT0gJ0dST1VQJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICghKCdjaGlsZHJlbicgaW4gbm9kZSkgfHwgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBiYiA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgY29uc3Qgc21hbGxpc2ggPSAhIWJiICYmIGJiLndpZHRoIDw9IElDT05fU0laRV9DQVAgJiYgYmIuaGVpZ2h0IDw9IElDT05fU0laRV9DQVA7XG4gIGNvbnN0IG5hbWVIaW50c0ljb24gPSBJQ09OX05BTUVfSElOVC50ZXN0KG5vZGUubmFtZSB8fCAnJyk7XG5cbiAgaWYgKCFzbWFsbGlzaCAmJiAhbmFtZUhpbnRzSWNvbikgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gaXNWZWN0b3JPbmx5KG5vZGUpO1xufVxuXG4vKipcbiAqIFdhbGsgdGhlIHRyZWUgYW5kIGNvbGxlY3QgZXZlcnkgaWNvbi1yb290IG5vZGUuIERvbid0IHJlY3Vyc2UgaW50byBhblxuICogaWNvbidzIGNoaWxkcmVuIFx1MjAxNCB0aGUgcGFyZW50IGlzIHRoZSBjb21wb3NlZCBleHBvcnQsIHRoZSBjaGlsZHJlbiBhcmVcbiAqIGp1c3QgcGF0aHMgaW5zaWRlIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEljb25Ob2Rlcyhyb290OiBTY2VuZU5vZGUpOiBTY2VuZU5vZGVbXSB7XG4gIGNvbnN0IGljb25zOiBTY2VuZU5vZGVbXSA9IFtdO1xuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG4gICAgaWYgKGlzSWNvbk5vZGUobm9kZSkpIHtcbiAgICAgIGljb25zLnB1c2gobm9kZSk7XG4gICAgICByZXR1cm47IC8vIGRvbid0IHJlY3Vyc2UgaW50byB0aGUgaWNvblxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdhbGsocm9vdCk7XG4gIHJldHVybiBpY29ucztcbn1cblxuLyoqXG4gKiBQaWNrIGEgaHVtYW4tbWVhbmluZ2Z1bCBiYXNlIG5hbWUgZm9yIGFuIGljb24uIE9yZGVyIG9mIHByZWZlcmVuY2U6XG4gKiAgIDEuIElOU1RBTkNFIFx1MjE5MiBtYWluIGNvbXBvbmVudCAvIGNvbXBvbmVudC1zZXQgbmFtZVxuICogICAyLiBUaGUgbm9kZSdzIG93biBuYW1lLCBpZiBub3QgYSBkZWZhdWx0IEZpZ21hIG5hbWVcbiAqICAgMy4gTmVhcmVzdCBuYW1lZCBhbmNlc3RvciArIFwiLWljb25cIiBzdWZmaXhcbiAqICAgNC4gXCJpY29uXCIgZmFsbGJhY2tcbiAqL1xuZnVuY3Rpb24gZ2V0SWNvbkJhc2VOYW1lKG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZyB7XG4gIGxldCBiYXNlTmFtZSA9IG5vZGUubmFtZSB8fCAnJztcblxuICBpZiAobm9kZS50eXBlID09PSAnSU5TVEFOQ0UnKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1haW4gPSAobm9kZSBhcyBJbnN0YW5jZU5vZGUpLm1haW5Db21wb25lbnQ7XG4gICAgICBpZiAobWFpbikge1xuICAgICAgICBjb25zdCBjYW5kaWRhdGUgPSBtYWluLnBhcmVudD8udHlwZSA9PT0gJ0NPTVBPTkVOVF9TRVQnXG4gICAgICAgICAgPyAobWFpbi5wYXJlbnQgYXMgYW55KS5uYW1lXG4gICAgICAgICAgOiBtYWluLm5hbWU7XG4gICAgICAgIGlmIChjYW5kaWRhdGUgJiYgIWlzRGVmYXVsdExheWVyTmFtZShjYW5kaWRhdGUpKSB7XG4gICAgICAgICAgYmFzZU5hbWUgPSBjYW5kaWRhdGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIG1haW5Db21wb25lbnQgYWNjZXNzIGNhbiB0aHJvdyBvbiBkZXRhY2hlZCBpbnN0YW5jZXMgXHUyMDE0IGZhbGwgdGhyb3VnaFxuICAgIH1cbiAgfVxuXG4gIGlmICghYmFzZU5hbWUgfHwgaXNEZWZhdWx0TGF5ZXJOYW1lKGJhc2VOYW1lKSkge1xuICAgIGxldCBwOiBCYXNlTm9kZSB8IG51bGwgPSBub2RlLnBhcmVudDtcbiAgICB3aGlsZSAocCAmJiAnbmFtZScgaW4gcCAmJiBpc0RlZmF1bHRMYXllck5hbWUoKHAgYXMgYW55KS5uYW1lKSkge1xuICAgICAgcCA9IChwIGFzIGFueSkucGFyZW50O1xuICAgIH1cbiAgICBpZiAocCAmJiAnbmFtZScgaW4gcCAmJiAocCBhcyBhbnkpLm5hbWUgJiYgIWlzRGVmYXVsdExheWVyTmFtZSgocCBhcyBhbnkpLm5hbWUpKSB7XG4gICAgICBiYXNlTmFtZSA9IGAkeyhwIGFzIGFueSkubmFtZX0taWNvbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhc2VOYW1lID0gJ2ljb24nO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBiYXNlTmFtZTtcbn1cblxuLyoqXG4gKiBEZWR1cCBrZXkgXHUyMDE0IGNvbGxhcHNlcyBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgbGlicmFyeSBpY29uIGludG9cbiAqIGEgc2luZ2xlIGV4cG9ydC4gU3RhbmRhbG9uZSB2ZWN0b3Igbm9kZXMgZGVkdXAgYnkgdGhlaXIgb3duIGlkLlxuICovXG5mdW5jdGlvbiBkZWR1cGVLZXkobm9kZTogU2NlbmVOb2RlKTogc3RyaW5nIHtcbiAgaWYgKG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtYWluID0gKG5vZGUgYXMgSW5zdGFuY2VOb2RlKS5tYWluQ29tcG9uZW50O1xuICAgICAgaWYgKG1haW4pIHJldHVybiBgbWM6JHttYWluLmlkfWA7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBmYWxsIHRocm91Z2hcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGBuOiR7bm9kZS5pZH1gO1xufVxuXG4vKipcbiAqIEJ1aWxkIHRoZSBjYW5vbmljYWwgTWFwPG5vZGVJZCwgc3ZnRmlsZW5hbWU+IGZvciBhIHBhZ2UgZnJhbWUuXG4gKiBCb3RoIGltYWdlLWV4cG9ydGVyIGFuZCBzZWN0aW9uLXBhcnNlciBjb25zdW1lIHRoaXMgc28gdGhleSBhZ3JlZSBvblxuICogd2hpY2ggbm9kZXMgYXJlIGljb25zIEFORCB3aGF0IGZpbGVuYW1lIGVhY2ggaWNvbiBlbmRzIHVwIHdpdGguXG4gKlxuICogR3VhcmFudGVlczpcbiAqICAgLSBFdmVyeSBlbnRyeSdzIGZpbGVuYW1lIGlzIHVuaXF1ZSBhY3Jvc3MgdGhlIHJldHVybmVkIG1hcC5cbiAqICAgLSBNdWx0aXBsZSBJTlNUQU5DRSBub2RlcyBvZiB0aGUgc2FtZSBtYWluIGNvbXBvbmVudCBtYXAgdG8gdGhlIHNhbWVcbiAqICAgICBmaWxlbmFtZSAob25lIHNoYXJlZCBTVkcgZmlsZSBmb3IgdGhlIHBhZ2UpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRJY29uRmlsZW5hbWVNYXAocm9vdDogU2NlbmVOb2RlKTogTWFwPHN0cmluZywgc3RyaW5nPiB7XG4gIGNvbnN0IG5vZGVJZFRvRmlsZW5hbWUgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBjb25zdCBkZWR1cEtleVRvRmlsZW5hbWUgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBjb25zdCB1c2VkRmlsZW5hbWVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCBub2RlIG9mIGZpbmRJY29uTm9kZXMocm9vdCkpIHtcbiAgICBjb25zdCBrZXkgPSBkZWR1cGVLZXkobm9kZSk7XG4gICAgbGV0IGZpbGVuYW1lID0gZGVkdXBLZXlUb0ZpbGVuYW1lLmdldChrZXkpO1xuICAgIGlmICghZmlsZW5hbWUpIHtcbiAgICAgIGNvbnN0IGJhc2UgPSBzbHVnaWZ5KGdldEljb25CYXNlTmFtZShub2RlKSkgfHwgJ2ljb24nO1xuICAgICAgZmlsZW5hbWUgPSBgJHtiYXNlfS5zdmdgO1xuICAgICAgbGV0IGkgPSAyO1xuICAgICAgd2hpbGUgKHVzZWRGaWxlbmFtZXMuaGFzKGZpbGVuYW1lKSkge1xuICAgICAgICBmaWxlbmFtZSA9IGAke2Jhc2V9LSR7aSsrfS5zdmdgO1xuICAgICAgfVxuICAgICAgdXNlZEZpbGVuYW1lcy5hZGQoZmlsZW5hbWUpO1xuICAgICAgZGVkdXBLZXlUb0ZpbGVuYW1lLnNldChrZXksIGZpbGVuYW1lKTtcbiAgICB9XG4gICAgbm9kZUlkVG9GaWxlbmFtZS5zZXQobm9kZS5pZCwgZmlsZW5hbWUpO1xuICB9XG5cbiAgcmV0dXJuIG5vZGVJZFRvRmlsZW5hbWU7XG59XG4iLCAiaW1wb3J0IHtcbiAgU2VjdGlvblNwZWNzLCBEZXNpZ25Ub2tlbnMsIEV4cG9ydE1hbmlmZXN0LCBFeHBvcnRNYW5pZmVzdFBhZ2UsXG4gIFJlc3BvbnNpdmVQYWlyLCBSZXNwb25zaXZlTWFwLCBQYWdlVG9rZW5zLCBJbWFnZU1hcCwgRm9udFRva2VuSW5mbyxcbiAgUmVzcG9uc2l2ZU92ZXJyaWRlLCBTZWN0aW9uU3BlYywgRmFpbGVkRXhwb3J0LFxufSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHNsdWdpZnksIHRvTGF5b3V0TmFtZSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgY29sbGVjdENvbG9ycyB9IGZyb20gJy4vY29sb3InO1xuaW1wb3J0IHsgY29sbGVjdEZvbnRzLCBjb3VudFRleHROb2RlcyB9IGZyb20gJy4vdHlwb2dyYXBoeSc7XG5pbXBvcnQgeyBjb2xsZWN0U3BhY2luZyB9IGZyb20gJy4vc3BhY2luZyc7XG5pbXBvcnQgeyBwYXJzZVNlY3Rpb25zIH0gZnJvbSAnLi9zZWN0aW9uLXBhcnNlcic7XG5pbXBvcnQgeyBtYXRjaFJlc3BvbnNpdmVGcmFtZXMgfSBmcm9tICcuL3Jlc3BvbnNpdmUnO1xuaW1wb3J0IHsgYnVpbGRFeHBvcnRUYXNrcywgZXhlY3V0ZUJhdGNoRXhwb3J0LCBidWlsZEltYWdlTWFwIH0gZnJvbSAnLi9pbWFnZS1leHBvcnRlcic7XG5pbXBvcnQgeyBleHRyYWN0VmFyaWFibGVzIH0gZnJvbSAnLi92YXJpYWJsZXMnO1xuaW1wb3J0IHsgbm9ybWFsaXplU2VjdGlvbk5hbWUgfSBmcm9tICcuL3BhdHRlcm5zJztcbmltcG9ydCB7IGJ1aWxkSWNvbkZpbGVuYW1lTWFwIH0gZnJvbSAnLi9pY29uLWRldGVjdG9yJztcblxuLyoqXG4gKiBNYXN0ZXIgZXh0cmFjdGlvbiBvcmNoZXN0cmF0b3IuXG4gKiBDb29yZGluYXRlcyBhbGwgbW9kdWxlcyBmb3IgdGhlIHNlbGVjdGVkIGZyYW1lcyBhbmQgc2VuZHMgcmVzdWx0cyB0byBVSS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkV4dHJhY3Rpb24oXG4gIGZyYW1lSWRzOiBzdHJpbmdbXSxcbiAgcmVzcG9uc2l2ZVBhaXJzOiBSZXNwb25zaXZlUGFpcltdLFxuICBzZW5kTWVzc2FnZTogKG1zZzogYW55KSA9PiB2b2lkLFxuICBzaG91bGRDYW5jZWw6ICgpID0+IGJvb2xlYW4sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYWxsRGVzaWduVG9rZW5Db2xvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgY29uc3QgYWxsRGVzaWduVG9rZW5Gb250czogUmVjb3JkPHN0cmluZywgRm9udFRva2VuSW5mbz4gPSB7fTtcbiAgY29uc3QgYWxsU3BhY2luZ1ZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBjb25zdCBtYW5pZmVzdFBhZ2VzOiBFeHBvcnRNYW5pZmVzdFBhZ2VbXSA9IFtdO1xuICBjb25zdCBhbGxGYWlsZWRFeHBvcnRzOiBGYWlsZWRFeHBvcnRbXSA9IFtdO1xuICBsZXQgdG90YWxTZWN0aW9ucyA9IDA7XG4gIGxldCB0b3RhbEltYWdlcyA9IDA7XG5cbiAgLy8gUHJlLWNvbXB1dGUgdGhlIHNldCBvZiBzZWN0aW9uIG5hbWVzIHRoYXQgYXBwZWFyIG9uIFx1MjI2NTIgc2VsZWN0ZWQgcGFnZXMuXG4gIC8vIFRoZXNlIGFyZSBjYW5kaWRhdGVzIGZvciBnbG9iYWwgV1AgdGhlbWUgcGFydHMgKGhlYWRlci5waHAgLyBmb290ZXIucGhwXG4gIC8vIC8gdGVtcGxhdGUtcGFydHMpLiBwYXJzZVNlY3Rpb25zIHdpbGwgbWFyayBtYXRjaGluZyBzZWN0aW9ucyBpc0dsb2JhbC5cbiAgY29uc3QgZ2xvYmFsTmFtZXMgPSBjb21wdXRlR2xvYmFsU2VjdGlvbk5hbWVzKHJlc3BvbnNpdmVQYWlycyk7XG5cbiAgLy8gUHJvY2VzcyBlYWNoIHJlc3BvbnNpdmUgcGFpciAoZWFjaCA9IG9uZSBwYWdlKVxuICBmb3IgKGNvbnN0IHBhaXIgb2YgcmVzcG9uc2l2ZVBhaXJzKSB7XG4gICAgaWYgKHNob3VsZENhbmNlbCgpKSByZXR1cm47XG5cbiAgICBjb25zdCBkZXNrdG9wTm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKHBhaXIuZGVza3RvcC5mcmFtZUlkKTtcbiAgICBpZiAoIWRlc2t0b3BOb2RlIHx8IGRlc2t0b3BOb2RlLnR5cGUgIT09ICdGUkFNRScpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGRlc2t0b3BGcmFtZSA9IGRlc2t0b3BOb2RlIGFzIEZyYW1lTm9kZTtcblxuICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6ICdFWFBPUlRfUFJPR1JFU1MnLFxuICAgICAgY3VycmVudDogMCxcbiAgICAgIHRvdGFsOiAxMDAsXG4gICAgICBsYWJlbDogYEV4dHJhY3RpbmcgXCIke3BhaXIucGFnZU5hbWV9XCIuLi5gLFxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIHRoZSBpY29uIGZpbGVuYW1lIG1hcCBGSVJTVCBzbyBzZWN0aW9uLXBhcnNlciBhbmQgdGhlXG4gICAgLy8gICAgaW1hZ2UtZXhwb3J0ZXIgYWdyZWUgb24gd2hpY2ggbm9kZXMgYXJlIGljb25zIGFuZCB3aGF0IGZpbGVuYW1lc1xuICAgIC8vICAgIHRoZXkgcmVjZWl2ZS4gVGhpcyBpcyB0aGUgbGluY2hwaW4gdGhhdCBwcmV2ZW50c1xuICAgIC8vICAgIFwic2VjdGlvbi1zcGVjIHJlZmVyZW5jZXMgWC5zdmcgYnV0IFguc3ZnIGRvZXNuJ3QgZXhpc3RcIi4gXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaWNvbk1hcCA9IGJ1aWxkSWNvbkZpbGVuYW1lTWFwKGRlc2t0b3BGcmFtZSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgUGFyc2Ugc2VjdGlvbnMgZnJvbSBkZXNrdG9wIGZyYW1lIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHNlY3Rpb25zID0gcGFyc2VTZWN0aW9ucyhkZXNrdG9wRnJhbWUsIGljb25NYXAsIGdsb2JhbE5hbWVzKTtcbiAgICBjb25zdCBzZWN0aW9uQ291bnQgPSBPYmplY3Qua2V5cyhzZWN0aW9ucykubGVuZ3RoO1xuICAgIHRvdGFsU2VjdGlvbnMgKz0gc2VjdGlvbkNvdW50O1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1lcmdlIHJlc3BvbnNpdmUgb3ZlcnJpZGVzIGZyb20gbW9iaWxlIGZyYW1lIFx1MjUwMFx1MjUwMFxuICAgIGlmIChwYWlyLm1vYmlsZSkge1xuICAgICAgY29uc3QgbW9iaWxlTm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKHBhaXIubW9iaWxlLmZyYW1lSWQpO1xuICAgICAgaWYgKG1vYmlsZU5vZGUgJiYgbW9iaWxlTm9kZS50eXBlID09PSAnRlJBTUUnKSB7XG4gICAgICAgIGNvbnN0IG1vYmlsZUZyYW1lID0gbW9iaWxlTm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICAgIGNvbnN0IG1vYmlsZUljb25NYXAgPSBidWlsZEljb25GaWxlbmFtZU1hcChtb2JpbGVGcmFtZSk7XG4gICAgICAgIGNvbnN0IG1vYmlsZVNlY3Rpb25zID0gcGFyc2VTZWN0aW9ucyhtb2JpbGVGcmFtZSwgbW9iaWxlSWNvbk1hcCwgZ2xvYmFsTmFtZXMpO1xuICAgICAgICBtZXJnZVJlc3BvbnNpdmVEYXRhKHNlY3Rpb25zLCBtb2JpbGVTZWN0aW9ucywgcGFpci5tb2JpbGUud2lkdGgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBDb2xsZWN0IHRva2VucyBmb3IgdGhpcyBwYWdlIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGNvbG9ycyA9IGNvbGxlY3RDb2xvcnMoZGVza3RvcEZyYW1lKTtcbiAgICBjb25zdCBmb250cyA9IGNvbGxlY3RGb250cyhkZXNrdG9wRnJhbWUpO1xuICAgIGNvbnN0IHNwYWNpbmcgPSBjb2xsZWN0U3BhY2luZyhkZXNrdG9wRnJhbWUpO1xuXG4gICAgLy8gQnVpbGQgcGFnZSB0b2tlbnNcbiAgICBjb25zdCBwYWdlVG9rZW5zOiBQYWdlVG9rZW5zID0ge1xuICAgICAgY29sb3JzLFxuICAgICAgZm9udHM6IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgT2JqZWN0LmVudHJpZXMoZm9udHMpLm1hcCgoW2ZhbWlseSwgZGF0YV0pID0+IFtmYW1pbHksIHtcbiAgICAgICAgICBzdHlsZXM6IFsuLi5kYXRhLnN0eWxlc10sXG4gICAgICAgICAgc2l6ZXM6IFsuLi5kYXRhLnNpemVzXS5zb3J0KChhLCBiKSA9PiBhIC0gYiksXG4gICAgICAgICAgY291bnQ6IGRhdGEuY291bnQsXG4gICAgICAgIH1dKVxuICAgICAgKSxcbiAgICAgIHNwYWNpbmcsXG4gICAgICBzZWN0aW9uczogYnVpbGRUb2tlblNlY3Rpb25zKGRlc2t0b3BGcmFtZSwgcGFpci5wYWdlU2x1ZyksXG4gICAgfTtcblxuICAgIC8vIE1lcmdlIGludG8gZ2xvYmFsIHRva2Vuc1xuICAgIGZvciAoY29uc3QgW2hleCwgY291bnRdIG9mIE9iamVjdC5lbnRyaWVzKGNvbG9ycykpIHtcbiAgICAgIGlmIChjb3VudCA+PSAyKSB7XG4gICAgICAgIGNvbnN0IHZhck5hbWUgPSBgLS1jbHItJHtoZXguc2xpY2UoMSkudG9Mb3dlckNhc2UoKX1gO1xuICAgICAgICBhbGxEZXNpZ25Ub2tlbkNvbG9yc1t2YXJOYW1lXSA9IGhleDtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBbZmFtaWx5LCBkYXRhXSBvZiBPYmplY3QuZW50cmllcyhmb250cykpIHtcbiAgICAgIGFsbERlc2lnblRva2VuRm9udHNbZmFtaWx5XSA9IHtcbiAgICAgICAgc3R5bGVzOiBbLi4uZGF0YS5zdHlsZXNdLFxuICAgICAgICBzaXplczogWy4uLmRhdGEuc2l6ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKSxcbiAgICAgICAgY291bnQ6IGRhdGEuY291bnQsXG4gICAgICB9O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHMgb2Ygc3BhY2luZykge1xuICAgICAgYWxsU3BhY2luZ1ZhbHVlcy5hZGQocy52YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEV4cG9ydCBpbWFnZXMgYW5kIHNjcmVlbnNob3RzIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGV4cG9ydFRhc2tzID0gYnVpbGRFeHBvcnRUYXNrcyhkZXNrdG9wRnJhbWUsIHBhaXIucGFnZVNsdWcsIGljb25NYXApO1xuICAgIGNvbnN0IGFzc2V0Q291bnQgPSBleHBvcnRUYXNrcy5maWx0ZXIodCA9PiB0LnR5cGUgPT09ICdhc3NldCcpLmxlbmd0aDtcbiAgICB0b3RhbEltYWdlcyArPSBhc3NldENvdW50O1xuXG4gICAgY29uc3QgcGFnZUZhaWx1cmVzID0gYXdhaXQgZXhlY3V0ZUJhdGNoRXhwb3J0KFxuICAgICAgZXhwb3J0VGFza3MsXG4gICAgICAoY3VycmVudCwgdG90YWwsIGxhYmVsKSA9PiB7XG4gICAgICAgIHNlbmRNZXNzYWdlKHsgdHlwZTogJ0VYUE9SVF9QUk9HUkVTUycsIGN1cnJlbnQsIHRvdGFsLCBsYWJlbCB9KTtcbiAgICAgIH0sXG4gICAgICAodGFzaywgZGF0YSkgPT4ge1xuICAgICAgICBpZiAodGFzay50eXBlID09PSAnc2NyZWVuc2hvdCcgfHwgdGFzay50eXBlID09PSAnZnVsbC1wYWdlJykge1xuICAgICAgICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6ICdTQ1JFRU5TSE9UX0RBVEEnLFxuICAgICAgICAgICAgcGF0aDogYCR7dGFzay5wYWdlUGF0aH0vc2NyZWVuc2hvdHNgLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHRhc2suZmlsZW5hbWUsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6ICdJTUFHRV9EQVRBJyxcbiAgICAgICAgICAgIHBhdGg6IGAke3Rhc2sucGFnZVBhdGh9L2ltYWdlc2AsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGFzay5maWxlbmFtZSxcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzaG91bGRDYW5jZWwsXG4gICAgKTtcbiAgICBhbGxGYWlsZWRFeHBvcnRzLnB1c2goLi4ucGFnZUZhaWx1cmVzKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBQYXRjaCBpY29uRmlsZSByZWZlcmVuY2VzIGZvciBmYWlsZWQvZmFsbGJhY2sgU1ZHIGV4cG9ydHMuXG4gICAgLy8gICAgSWYgU1ZHIGV4cG9ydCBmYWlsZWQgYnV0IFBORyBmYWxsYmFjayBzdWNjZWVkZWQsIHJlZGlyZWN0XG4gICAgLy8gICAgaWNvbkZpbGUgdG8gdGhlIC5wbmcuIElmIGJvdGggZmFpbGVkLCBkcm9wIGljb25GaWxlIChhbHQgdGV4dFxuICAgIC8vICAgIHN0aWxsIHN1cnZpdmVzIHNvIHRoZSBhZ2VudCBoYXMgYSB0ZXh0dWFsIGN1ZSkuIFx1MjUwMFx1MjUwMFxuICAgIGlmIChwYWdlRmFpbHVyZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgZmFsbGJhY2tNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICAgICAgY29uc3QgZHJvcHBlZFNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgZm9yIChjb25zdCBmIG9mIHBhZ2VGYWlsdXJlcykge1xuICAgICAgICBpZiAoZi5mYWxsYmFja0ZpbGVuYW1lKSBmYWxsYmFja01hcC5zZXQoZi5maWxlbmFtZSwgZi5mYWxsYmFja0ZpbGVuYW1lKTtcbiAgICAgICAgZWxzZSBkcm9wcGVkU2V0LmFkZChmLmZpbGVuYW1lKTtcbiAgICAgIH1cbiAgICAgIHBhdGNoSWNvblJlZmVyZW5jZXMoc2VjdGlvbnMsIGZhbGxiYWNrTWFwLCBkcm9wcGVkU2V0KTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQnVpbGQgc2VjdGlvbi1zcGVjcy5qc29uIChub3cgd2l0aCBwYXRjaGVkIGljb25GaWxlIHJlZnMpIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHNlY3Rpb25TcGVjczogU2VjdGlvblNwZWNzID0ge1xuICAgICAgZmlnbWFfY2FudmFzX3dpZHRoOiBNYXRoLnJvdW5kKGRlc2t0b3BGcmFtZS53aWR0aCksXG4gICAgICBmaWdtYV9jYW52YXNfaGVpZ2h0OiBNYXRoLnJvdW5kKGRlc2t0b3BGcmFtZS5oZWlnaHQpLFxuICAgICAgbW9iaWxlX2NhbnZhc193aWR0aDogcGFpci5tb2JpbGU/LndpZHRoLFxuICAgICAgcGFnZV9zbHVnOiBwYWlyLnBhZ2VTbHVnLFxuICAgICAgZXh0cmFjdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBleHRyYWN0aW9uX21ldGhvZDogJ3BsdWdpbicsXG4gICAgICBzZWN0aW9ucyxcbiAgICB9O1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEdlbmVyYXRlIHNwZWMubWQgQUZURVIgcGF0Y2hlcyBzbyBpdCBtYXRjaGVzIHNlY3Rpb24tc3BlY3MgXHUyNTAwXHUyNTAwXG4gICAgY29uc3Qgc3BlY01kID0gZ2VuZXJhdGVTcGVjTWQocGFpci5wYWdlTmFtZSwgcGFpci5wYWdlU2x1Zywgc2VjdGlvblNwZWNzLCBwYWdlVG9rZW5zKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBTZW5kIHBhZ2UgZGF0YSB0byBVSSAocG9zdC1leHBvcnQgc28gaWNvbkZpbGUgcmVmcyBhcmUgYWNjdXJhdGUpIFx1MjUwMFx1MjUwMFxuICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6ICdQQUdFX0RBVEEnLFxuICAgICAgcGFnZVNsdWc6IHBhaXIucGFnZVNsdWcsXG4gICAgICBzZWN0aW9uU3BlY3MsXG4gICAgICBzcGVjTWQsXG4gICAgICB0b2tlbnM6IHBhZ2VUb2tlbnMsXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQnVpbGQgYW5kIHNlbmQgaW1hZ2UgbWFwIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHNlY3Rpb25DaGlsZHJlbiA9IGRlc2t0b3BGcmFtZS5jaGlsZHJlblxuICAgICAgLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UpXG4gICAgICAubWFwKGMgPT4gKHsgbmFtZTogYy5uYW1lLCBjaGlsZHJlbjogJ2NoaWxkcmVuJyBpbiBjID8gWy4uLihjIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW5dIDogW10gfSkpO1xuICAgIGNvbnN0IGltYWdlTWFwID0gYnVpbGRJbWFnZU1hcChleHBvcnRUYXNrcywgc2VjdGlvbkNoaWxkcmVuLCBpY29uTWFwKTtcbiAgICBzZW5kTWVzc2FnZSh7XG4gICAgICB0eXBlOiAnSU1BR0VfTUFQX0RBVEEnLFxuICAgICAgcGF0aDogYHBhZ2VzLyR7cGFpci5wYWdlU2x1Z30vaW1hZ2VzYCxcbiAgICAgIGltYWdlTWFwLFxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIG1hbmlmZXN0IHBhZ2UgZW50cnkgXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaGFzRnVsbFBhZ2UgPSBleHBvcnRUYXNrcy5zb21lKHQgPT4gdC50eXBlID09PSAnZnVsbC1wYWdlJyk7XG4gICAgbWFuaWZlc3RQYWdlcy5wdXNoKHtcbiAgICAgIHNsdWc6IHBhaXIucGFnZVNsdWcsXG4gICAgICBmcmFtZU5hbWU6IHBhaXIuZGVza3RvcC5mcmFtZU5hbWUsXG4gICAgICBmcmFtZUlkOiBwYWlyLmRlc2t0b3AuZnJhbWVJZCxcbiAgICAgIGNhbnZhc1dpZHRoOiBNYXRoLnJvdW5kKGRlc2t0b3BGcmFtZS53aWR0aCksXG4gICAgICBjYW52YXNIZWlnaHQ6IE1hdGgucm91bmQoZGVza3RvcEZyYW1lLmhlaWdodCksXG4gICAgICBzZWN0aW9uQ291bnQsXG4gICAgICBpbWFnZUNvdW50OiBhc3NldENvdW50LFxuICAgICAgaGFzUmVzcG9uc2l2ZTogcGFpci5tb2JpbGUgIT09IG51bGwsXG4gICAgICBtb2JpbGVGcmFtZUlkOiBwYWlyLm1vYmlsZT8uZnJhbWVJZCA/PyBudWxsLFxuICAgICAgaW50ZXJhY3Rpb25Db3VudDogT2JqZWN0LnZhbHVlcyhzZWN0aW9ucylcbiAgICAgICAgLnJlZHVjZSgoc3VtLCBzKSA9PiBzdW0gKyAocy5pbnRlcmFjdGlvbnM/Lmxlbmd0aCA/PyAwKSwgMCksXG4gICAgICBoYXNGdWxsUGFnZVNjcmVlbnNob3Q6IGhhc0Z1bGxQYWdlLFxuICAgICAgZnVsbFBhZ2VTY3JlZW5zaG90RmlsZTogaGFzRnVsbFBhZ2UgPyAnX2Z1bGwtcGFnZS5wbmcnIDogbnVsbCxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBCdWlsZCBmaW5hbCBtYW5pZmVzdCBhbmQgZ2xvYmFsIHRva2VucyBcdTI1MDBcdTI1MDBcbiAgY29uc3QgbWFuaWZlc3Q6IEV4cG9ydE1hbmlmZXN0ID0ge1xuICAgIGV4cG9ydFZlcnNpb246ICcxLjAnLFxuICAgIGV4cG9ydERhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBmaWdtYUZpbGVOYW1lOiBmaWdtYS5yb290Lm5hbWUsXG4gICAgZmlnbWFGaWxlS2V5OiBmaWdtYS5maWxlS2V5ID8/ICcnLFxuICAgIHBsdWdpblZlcnNpb246ICcxLjAuMCcsXG4gICAgcGFnZXM6IG1hbmlmZXN0UGFnZXMsXG4gICAgdG90YWxTZWN0aW9ucyxcbiAgICB0b3RhbEltYWdlcyxcbiAgICBkZXNpZ25Ub2tlbnNTdW1tYXJ5OiB7XG4gICAgICBjb2xvckNvdW50OiBPYmplY3Qua2V5cyhhbGxEZXNpZ25Ub2tlbkNvbG9ycykubGVuZ3RoLFxuICAgICAgZm9udENvdW50OiBPYmplY3Qua2V5cyhhbGxEZXNpZ25Ub2tlbkZvbnRzKS5sZW5ndGgsXG4gICAgICBzcGFjaW5nVmFsdWVzOiBhbGxTcGFjaW5nVmFsdWVzLnNpemUsXG4gICAgfSxcbiAgICBmYWlsZWRFeHBvcnRzOiBhbGxGYWlsZWRFeHBvcnRzLmxlbmd0aCA+IDAgPyBhbGxGYWlsZWRFeHBvcnRzIDogdW5kZWZpbmVkLFxuICB9O1xuXG4gIC8vIEZpZ21hIFZhcmlhYmxlcyAoYXV0aG9yaXRhdGl2ZSB0b2tlbiBuYW1lcyB3aGVuIGF2YWlsYWJsZSlcbiAgY29uc3QgdmFyaWFibGVzID0gZXh0cmFjdFZhcmlhYmxlcygpO1xuXG4gIGNvbnN0IGRlc2lnblRva2VuczogRGVzaWduVG9rZW5zID0ge1xuICAgIGNvbG9yczogYWxsRGVzaWduVG9rZW5Db2xvcnMsXG4gICAgZm9udHM6IGFsbERlc2lnblRva2VuRm9udHMsXG4gICAgc3BhY2luZzogWy4uLmFsbFNwYWNpbmdWYWx1ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKSxcbiAgICB2YXJpYWJsZXM6IHZhcmlhYmxlcy5wcmVzZW50ID8gdmFyaWFibGVzIDogdW5kZWZpbmVkLFxuICB9O1xuXG4gIC8vIFdoZW4gRmlnbWEgVmFyaWFibGVzIGFyZSBhdmFpbGFibGUsIHByZWZlciB2YXJpYWJsZSBuYW1lcyBmb3IgY29sb3JzOlxuICAvLyBvdmVyd3JpdGUgdGhlIGF1dG8tZ2VuZXJhdGVkIC0tY2xyLTxoZXg+IHdpdGggLS1jbHItPHZhcmlhYmxlLW5hbWU+XG4gIGlmICh2YXJpYWJsZXMucHJlc2VudCkge1xuICAgIGZvciAoY29uc3QgW2NvbE5hbWUsIHZhcnNdIG9mIE9iamVjdC5lbnRyaWVzKHZhcmlhYmxlcy5jb2xsZWN0aW9ucykpIHtcbiAgICAgIGlmICghY29sTmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjb2xvcicpKSBjb250aW51ZTtcbiAgICAgIGZvciAoY29uc3QgW3Zhck5hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh2YXJzKSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAhdmFsdWUuc3RhcnRzV2l0aCgnIycpKSBjb250aW51ZTtcbiAgICAgICAgY29uc3Qgc2FmZU5hbWUgPSB2YXJOYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXowLTldKy9nLCAnLScpLnJlcGxhY2UoLy0rL2csICctJykucmVwbGFjZSgvXi18LSQvZywgJycpO1xuICAgICAgICBjb25zdCBjc3NWYXIgPSBgLS1jbHItJHtzYWZlTmFtZX1gO1xuICAgICAgICBhbGxEZXNpZ25Ub2tlbkNvbG9yc1tjc3NWYXJdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIGRlc2lnblRva2Vucy5jb2xvcnMgPSBhbGxEZXNpZ25Ub2tlbkNvbG9ycztcbiAgfVxuXG4gIC8vIEJ1aWxkIHJlc3BvbnNpdmUgbWFwIGZyb20gdGhlIHBhaXJzXG4gIGNvbnN0IHJlc3BvbnNpdmVNYXAgPSBtYXRjaFJlc3BvbnNpdmVGcmFtZXMoXG4gICAgcmVzcG9uc2l2ZVBhaXJzLmZsYXRNYXAocCA9PiB7XG4gICAgICBjb25zdCBmcmFtZXMgPSBbe1xuICAgICAgICBpZDogcC5kZXNrdG9wLmZyYW1lSWQsXG4gICAgICAgIG5hbWU6IHAuZGVza3RvcC5mcmFtZU5hbWUsXG4gICAgICAgIHdpZHRoOiBwLmRlc2t0b3Aud2lkdGgsXG4gICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgYnJlYWtwb2ludDogJ2Rlc2t0b3AnIGFzIGNvbnN0LFxuICAgICAgICBzZWN0aW9uQ291bnQ6IDAsXG4gICAgICAgIGhhc0F1dG9MYXlvdXQ6IGZhbHNlLFxuICAgICAgICByZXNwb25zaXZlUGFpcklkOiBudWxsLFxuICAgICAgfV07XG4gICAgICBpZiAocC5tb2JpbGUpIHtcbiAgICAgICAgZnJhbWVzLnB1c2goe1xuICAgICAgICAgIGlkOiBwLm1vYmlsZS5mcmFtZUlkLFxuICAgICAgICAgIG5hbWU6IHAubW9iaWxlLmZyYW1lTmFtZSxcbiAgICAgICAgICB3aWR0aDogcC5tb2JpbGUud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICAgIGJyZWFrcG9pbnQ6ICdtb2JpbGUnIGFzIGNvbnN0LFxuICAgICAgICAgIHNlY3Rpb25Db3VudDogMCxcbiAgICAgICAgICBoYXNBdXRvTGF5b3V0OiBmYWxzZSxcbiAgICAgICAgICByZXNwb25zaXZlUGFpcklkOiBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmcmFtZXM7XG4gICAgfSlcbiAgKTtcblxuICBzZW5kTWVzc2FnZSh7XG4gICAgdHlwZTogJ0VYUE9SVF9DT01QTEVURScsXG4gICAgbWFuaWZlc3QsXG4gICAgcmVzcG9uc2l2ZU1hcCxcbiAgICBkZXNpZ25Ub2tlbnMsXG4gIH0pO1xufVxuXG4vKipcbiAqIE1lcmdlIHJlc3BvbnNpdmUgb3ZlcnJpZGVzIGZyb20gbW9iaWxlIHNlY3Rpb25zIGludG8gZGVza3RvcCBzZWN0aW9ucy5cbiAqIE9ubHkgaW5jbHVkZXMgcHJvcGVydGllcyB0aGF0IGRpZmZlciBiZXR3ZWVuIGRlc2t0b3AgYW5kIG1vYmlsZS5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VSZXNwb25zaXZlRGF0YShcbiAgZGVza3RvcFNlY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4sXG4gIG1vYmlsZVNlY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4sXG4gIG1vYmlsZVdpZHRoOiBudW1iZXIsXG4pOiB2b2lkIHtcbiAgY29uc3QgYnBLZXkgPSBTdHJpbmcobW9iaWxlV2lkdGgpO1xuXG4gIGZvciAoY29uc3QgW2xheW91dE5hbWUsIGRlc2t0b3BTcGVjXSBvZiBPYmplY3QuZW50cmllcyhkZXNrdG9wU2VjdGlvbnMpKSB7XG4gICAgY29uc3QgbW9iaWxlU3BlYyA9IG1vYmlsZVNlY3Rpb25zW2xheW91dE5hbWVdO1xuICAgIGlmICghbW9iaWxlU3BlYykgY29udGludWU7XG5cbiAgICBjb25zdCBvdmVycmlkZTogUmVzcG9uc2l2ZU92ZXJyaWRlID0ge307XG5cbiAgICAvLyBEaWZmIHNlY3Rpb24gc3R5bGVzXG4gICAgY29uc3Qgc2VjdGlvbkRpZmY6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGRlc2t0b3BWYWxdIG9mIE9iamVjdC5lbnRyaWVzKGRlc2t0b3BTcGVjLnNlY3Rpb24pKSB7XG4gICAgICBjb25zdCBtb2JpbGVWYWwgPSAobW9iaWxlU3BlYy5zZWN0aW9uIGFzIGFueSlba2V5XTtcbiAgICAgIGlmIChtb2JpbGVWYWwgJiYgbW9iaWxlVmFsICE9PSBkZXNrdG9wVmFsKSB7XG4gICAgICAgIHNlY3Rpb25EaWZmW2tleV0gPSBtb2JpbGVWYWw7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChPYmplY3Qua2V5cyhzZWN0aW9uRGlmZikubGVuZ3RoID4gMCkge1xuICAgICAgb3ZlcnJpZGUuc2VjdGlvbiA9IHNlY3Rpb25EaWZmO1xuICAgIH1cblxuICAgIC8vIERpZmYgZWxlbWVudCBzdHlsZXNcbiAgICBjb25zdCBlbGVtZW50c0RpZmY6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIGFueT4+ID0ge307XG4gICAgZm9yIChjb25zdCBbZWxlbU5hbWUsIGRlc2t0b3BFbGVtXSBvZiBPYmplY3QuZW50cmllcyhkZXNrdG9wU3BlYy5lbGVtZW50cykpIHtcbiAgICAgIGNvbnN0IG1vYmlsZUVsZW0gPSBtb2JpbGVTcGVjLmVsZW1lbnRzW2VsZW1OYW1lXTtcbiAgICAgIGlmICghbW9iaWxlRWxlbSkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IGRpZmY6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgZGVza3RvcFZhbF0gb2YgT2JqZWN0LmVudHJpZXMoZGVza3RvcEVsZW0pKSB7XG4gICAgICAgIGNvbnN0IG1vYmlsZVZhbCA9IChtb2JpbGVFbGVtIGFzIGFueSlba2V5XTtcbiAgICAgICAgaWYgKG1vYmlsZVZhbCAhPT0gdW5kZWZpbmVkICYmIG1vYmlsZVZhbCAhPT0gZGVza3RvcFZhbCkge1xuICAgICAgICAgIGRpZmZba2V5XSA9IG1vYmlsZVZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKE9iamVjdC5rZXlzKGRpZmYpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZWxlbWVudHNEaWZmW2VsZW1OYW1lXSA9IGRpZmY7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChPYmplY3Qua2V5cyhlbGVtZW50c0RpZmYpLmxlbmd0aCA+IDApIHtcbiAgICAgIG92ZXJyaWRlLmVsZW1lbnRzID0gZWxlbWVudHNEaWZmO1xuICAgIH1cblxuICAgIC8vIERpZmYgZ3JpZFxuICAgIGlmIChtb2JpbGVTcGVjLmdyaWQuY29sdW1ucyAhPT0gZGVza3RvcFNwZWMuZ3JpZC5jb2x1bW5zIHx8IG1vYmlsZVNwZWMuZ3JpZC5nYXAgIT09IGRlc2t0b3BTcGVjLmdyaWQuZ2FwKSB7XG4gICAgICBvdmVycmlkZS5ncmlkID0ge307XG4gICAgICBpZiAobW9iaWxlU3BlYy5ncmlkLmNvbHVtbnMgIT09IGRlc2t0b3BTcGVjLmdyaWQuY29sdW1ucykge1xuICAgICAgICBvdmVycmlkZS5ncmlkLmNvbHVtbnMgPSBtb2JpbGVTcGVjLmdyaWQuY29sdW1ucztcbiAgICAgIH1cbiAgICAgIGlmIChtb2JpbGVTcGVjLmdyaWQuZ2FwICE9PSBkZXNrdG9wU3BlYy5ncmlkLmdhcCkge1xuICAgICAgICBvdmVycmlkZS5ncmlkLmdhcCA9IG1vYmlsZVNwZWMuZ3JpZC5nYXA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKE9iamVjdC5rZXlzKG92ZXJyaWRlKS5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAoIWRlc2t0b3BTcGVjLnJlc3BvbnNpdmUpIGRlc2t0b3BTcGVjLnJlc3BvbnNpdmUgPSB7fTtcbiAgICAgIGRlc2t0b3BTcGVjLnJlc3BvbnNpdmVbYnBLZXldID0gb3ZlcnJpZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGQgdG9rZW4gc2VjdGlvbiBtZXRhZGF0YSBmb3IgdG9rZW5zLmpzb24uXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkVG9rZW5TZWN0aW9ucyhmcmFtZTogRnJhbWVOb2RlLCBwYWdlU2x1Zzogc3RyaW5nKSB7XG4gIGNvbnN0IHNlY3Rpb25zID0gZnJhbWUuY2hpbGRyZW5cbiAgICAuZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94XG4gICAgKVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIHJldHVybiBzZWN0aW9ucy5tYXAoKHMsIGkpID0+IHtcbiAgICBjb25zdCBib3VuZHMgPSBzLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IHBhcmVudEJvdW5kcyA9IGZyYW1lLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IGltYWdlQ291bnQgPSBjb3VudEltYWdlcyhzKTtcbiAgICBjb25zdCB0ZXh0Tm9kZXMgPSBjb3VudFRleHROb2RlcyhzKTtcblxuICAgIHJldHVybiB7XG4gICAgICBpbmRleDogaSArIDEsXG4gICAgICBuYW1lOiBzLm5hbWUsXG4gICAgICBpZDogcy5pZCxcbiAgICAgIGRpbWVuc2lvbnM6IHsgd2lkdGg6IE1hdGgucm91bmQoYm91bmRzLndpZHRoKSwgaGVpZ2h0OiBNYXRoLnJvdW5kKGJvdW5kcy5oZWlnaHQpIH0sXG4gICAgICB5X29mZnNldDogTWF0aC5yb3VuZChib3VuZHMueSAtIHBhcmVudEJvdW5kcy55KSxcbiAgICAgIGhhc0F1dG9MYXlvdXQ6IHMudHlwZSA9PT0gJ0ZSQU1FJyAmJiAocyBhcyBGcmFtZU5vZGUpLmxheW91dE1vZGUgIT09IHVuZGVmaW5lZCAmJiAocyBhcyBGcmFtZU5vZGUpLmxheW91dE1vZGUgIT09ICdOT05FJyxcbiAgICAgIGltYWdlX2NvdW50OiBpbWFnZUNvdW50LFxuICAgICAgaW1hZ2VfZmlsZXM6IGNvbGxlY3RJbWFnZUZpbGVOYW1lcyhzKSxcbiAgICAgIHRleHRfbm9kZXM6IHRleHROb2RlcyxcbiAgICAgIHNjcmVlbnNob3Q6IGBzY3JlZW5zaG90cy8ke3NsdWdpZnkocy5uYW1lKX0ucG5nYCxcbiAgICAgIHNjcmVlbnNob3RfY29tcGxldGU6IHRydWUsXG4gICAgfTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvdW50SW1hZ2VzKG5vZGU6IFNjZW5lTm9kZSk6IG51bWJlciB7XG4gIGxldCBjb3VudCA9IDA7XG4gIGZ1bmN0aW9uIHdhbGsobjogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdmaWxscycgaW4gbiAmJiBBcnJheS5pc0FycmF5KChuIGFzIGFueSkuZmlsbHMpKSB7XG4gICAgICBpZiAoKG4gYXMgYW55KS5maWxscy5zb21lKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpKSBjb3VudCsrO1xuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoY2hpbGQpO1xuICAgIH1cbiAgfVxuICB3YWxrKG5vZGUpO1xuICByZXR1cm4gY291bnQ7XG59XG5cbi8qKlxuICogUHJlLWNvbXB1dGUgdGhlIHNldCBvZiBub3JtYWxpemVkIHNlY3Rpb24gbmFtZXMgdGhhdCBhcHBlYXIgb24gXHUyMjY1MiBzZWxlY3RlZFxuICogcGFnZXMuIE1hdGNoaW5nIHNlY3Rpb25zIHdpbGwgYmUgbWFya2VkIGBpc0dsb2JhbDogdHJ1ZWAgYnkgcGFyc2VTZWN0aW9uc1xuICogc28gdGhlIFdQIGFnZW50IGNhbiBob2lzdCB0aGVtIGludG8gaGVhZGVyLnBocCAvIGZvb3Rlci5waHAgLyB0ZW1wbGF0ZS1wYXJ0c1xuICogcmF0aGVyIHRoYW4gaW5saW5pbmcgdGhlIHNhbWUgbWFya3VwIG9uIGV2ZXJ5IHBhZ2UuXG4gKlxuICogVGhlIHNjYW4gbWlycm9ycyBpZGVudGlmeVNlY3Rpb25zIChkcmlsbHMgb25lIHdyYXBwZXIgZGVlcCB3aGVuIHRoZSBwYWdlXG4gKiBoYXMgYSBzaW5nbGUgY29udGFpbmVyIGNoaWxkKSBzbyB0aGUgbWF0Y2hpbmcgc3RheXMgY29uc2lzdGVudCB3aXRoIHdoYXRcbiAqIHBhcnNlU2VjdGlvbnMgYWN0dWFsbHkgdHJlYXRzIGFzIGEgXCJzZWN0aW9uXCIuXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVHbG9iYWxTZWN0aW9uTmFtZXMocGFpcnM6IFJlc3BvbnNpdmVQYWlyW10pOiBTZXQ8c3RyaW5nPiB7XG4gIGNvbnN0IG5hbWVUb1BhZ2VDb3VudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgZm9yIChjb25zdCBwYWlyIG9mIHBhaXJzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChwYWlyLmRlc2t0b3AuZnJhbWVJZCk7XG4gICAgICBpZiAoIW5vZGUgfHwgbm9kZS50eXBlICE9PSAnRlJBTUUnKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBsZXQgY2FuZGlkYXRlcyA9IGZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICAgICApO1xuICAgICAgaWYgKGNhbmRpZGF0ZXMubGVuZ3RoID09PSAxICYmICdjaGlsZHJlbicgaW4gY2FuZGlkYXRlc1swXSkge1xuICAgICAgICBjb25zdCBpbm5lciA9IChjYW5kaWRhdGVzWzBdIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChpbm5lci5sZW5ndGggPiAxKSBjYW5kaWRhdGVzID0gaW5uZXI7XG4gICAgICB9XG4gICAgICBjb25zdCBzZWVuT25UaGlzUGFnZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgZm9yIChjb25zdCBjIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gbm9ybWFsaXplU2VjdGlvbk5hbWUoYy5uYW1lIHx8ICcnKTtcbiAgICAgICAgaWYgKCFrZXkpIGNvbnRpbnVlO1xuICAgICAgICBzZWVuT25UaGlzUGFnZS5hZGQoa2V5KTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBzZWVuT25UaGlzUGFnZSkge1xuICAgICAgICBuYW1lVG9QYWdlQ291bnQuc2V0KG5hbWUsIChuYW1lVG9QYWdlQ291bnQuZ2V0KG5hbWUpIHx8IDApICsgMSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdjb21wdXRlR2xvYmFsU2VjdGlvbk5hbWVzOiBmYWlsZWQgdG8gc2NhbiBmcmFtZScsIHBhaXIucGFnZU5hbWUsIGUpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG91dCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IFtuYW1lLCBjb3VudF0gb2YgbmFtZVRvUGFnZUNvdW50KSB7XG4gICAgaWYgKGNvdW50ID49IDIpIG91dC5hZGQobmFtZSk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gY29sbGVjdEltYWdlRmlsZU5hbWVzKG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbmFtZXM6IHN0cmluZ1tdID0gW107XG4gIGZ1bmN0aW9uIHdhbGsobjogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdmaWxscycgaW4gbiAmJiBBcnJheS5pc0FycmF5KChuIGFzIGFueSkuZmlsbHMpKSB7XG4gICAgICBpZiAoKG4gYXMgYW55KS5maWxscy5zb21lKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpKSB7XG4gICAgICAgIG5hbWVzLnB1c2goYCR7c2x1Z2lmeShuLm5hbWUpfS5wbmdgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbikge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobiBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB3YWxrKGNoaWxkKTtcbiAgICB9XG4gIH1cbiAgd2Fsayhub2RlKTtcbiAgcmV0dXJuIG5hbWVzO1xufVxuXG4vKipcbiAqIFdhbGsgZXZlcnkgZWxlbWVudCBpbiB0aGUgc2VjdGlvbiBtYXAgYW5kIHJlY29uY2lsZSBgaWNvbkZpbGVgIGFnYWluc3RcbiAqIHRoZSBwb3N0LWV4cG9ydCByZWFsaXR5OlxuICogICAtIElmIHRoZSAuc3ZnIGZlbGwgYmFjayB0byAucG5nLCByZXdyaXRlIGljb25GaWxlIHRvIHRoZSAucG5nIGZpbGVuYW1lLlxuICogICAtIElmIHRoZSBleHBvcnQgZmFpbGVkIGVudGlyZWx5IHdpdGggbm8gZmFsbGJhY2ssIGRyb3AgaWNvbkZpbGUgc28gdGhlXG4gKiAgICAgYWdlbnQgZG9lc24ndCByZWZlcmVuY2UgYSBub24tZXhpc3RlbnQgYXNzZXQgKGFsdCB0ZXh0IHN0aWxsXG4gKiAgICAgc3Vydml2ZXMgYXMgYSB0ZXh0dWFsIGN1ZSkuXG4gKi9cbmZ1bmN0aW9uIHBhdGNoSWNvblJlZmVyZW5jZXMoXG4gIHNlY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4sXG4gIGZhbGxiYWNrTWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuICBkcm9wcGVkU2V0OiBTZXQ8c3RyaW5nPixcbik6IHZvaWQge1xuICBmb3IgKGNvbnN0IHNwZWMgb2YgT2JqZWN0LnZhbHVlcyhzZWN0aW9ucykpIHtcbiAgICBmb3IgKGNvbnN0IGVsZW0gb2YgT2JqZWN0LnZhbHVlcyhzcGVjLmVsZW1lbnRzKSkge1xuICAgICAgY29uc3QgZiA9IChlbGVtIGFzIGFueSkuaWNvbkZpbGUgYXMgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgICAgIGlmICghZikgY29udGludWU7XG4gICAgICBpZiAoZmFsbGJhY2tNYXAuaGFzKGYpKSB7XG4gICAgICAgIChlbGVtIGFzIGFueSkuaWNvbkZpbGUgPSBmYWxsYmFja01hcC5nZXQoZik7XG4gICAgICB9IGVsc2UgaWYgKGRyb3BwZWRTZXQuaGFzKGYpKSB7XG4gICAgICAgIGRlbGV0ZSAoZWxlbSBhcyBhbnkpLmljb25GaWxlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgaHVtYW4tcmVhZGFibGUgc3BlYy5tZCBmcm9tIGV4dHJhY3RlZCBkYXRhLlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVNwZWNNZChwYWdlTmFtZTogc3RyaW5nLCBwYWdlU2x1Zzogc3RyaW5nLCBzcGVjczogU2VjdGlvblNwZWNzLCB0b2tlbnM6IFBhZ2VUb2tlbnMpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcbiAgbGluZXMucHVzaChgIyBEZXNpZ24gU3BlYyBcdTIwMTQgJHtwYWdlTmFtZX1gKTtcbiAgbGluZXMucHVzaChgIyMgU291cmNlOiBGaWdtYSBQbHVnaW4gRXhwb3J0YCk7XG4gIGxpbmVzLnB1c2goYCMjIEdlbmVyYXRlZDogJHtzcGVjcy5leHRyYWN0ZWRfYXR9YCk7XG4gIGxpbmVzLnB1c2goJycpO1xuICBsaW5lcy5wdXNoKCcjIyBQYWdlIE1ldGFkYXRhJyk7XG4gIGxpbmVzLnB1c2goYC0gUGFnZSBOYW1lOiAke3BhZ2VOYW1lfWApO1xuICBsaW5lcy5wdXNoKGAtIENhbnZhcyBXaWR0aDogJHtzcGVjcy5maWdtYV9jYW52YXNfd2lkdGh9cHhgKTtcbiAgbGluZXMucHVzaChgLSBTZWN0aW9uIENvdW50OiAke09iamVjdC5rZXlzKHNwZWNzLnNlY3Rpb25zKS5sZW5ndGh9YCk7XG4gIGlmIChzcGVjcy5tb2JpbGVfY2FudmFzX3dpZHRoKSB7XG4gICAgbGluZXMucHVzaChgLSBNb2JpbGUgQ2FudmFzIFdpZHRoOiAke3NwZWNzLm1vYmlsZV9jYW52YXNfd2lkdGh9cHhgKTtcbiAgfVxuICBsaW5lcy5wdXNoKCcnKTtcblxuICAvLyBDb2xvcnNcbiAgbGluZXMucHVzaCgnIyMgQ29sb3JzIFVzZWQnKTtcbiAgbGluZXMucHVzaCgnfCBIRVggfCBVc2FnZSBDb3VudCB8Jyk7XG4gIGxpbmVzLnB1c2goJ3wtLS0tLXwtLS0tLS0tLS0tLS18Jyk7XG4gIGNvbnN0IHNvcnRlZENvbG9ycyA9IE9iamVjdC5lbnRyaWVzKHRva2Vucy5jb2xvcnMpLnNvcnQoKGEsIGIpID0+IGJbMV0gLSBhWzFdKTtcbiAgZm9yIChjb25zdCBbaGV4LCBjb3VudF0gb2Ygc29ydGVkQ29sb3JzLnNsaWNlKDAsIDIwKSkge1xuICAgIGxpbmVzLnB1c2goYHwgJHtoZXh9IHwgJHtjb3VudH0gfGApO1xuICB9XG4gIGxpbmVzLnB1c2goJycpO1xuXG4gIC8vIFR5cG9ncmFwaHlcbiAgbGluZXMucHVzaCgnIyMgVHlwb2dyYXBoeSBVc2VkJyk7XG4gIGxpbmVzLnB1c2goJ3wgRm9udCB8IFN0eWxlcyB8IFNpemVzIHwnKTtcbiAgbGluZXMucHVzaCgnfC0tLS0tLXwtLS0tLS0tLXwtLS0tLS0tfCcpO1xuICBmb3IgKGNvbnN0IFtmYW1pbHksIGluZm9dIG9mIE9iamVjdC5lbnRyaWVzKHRva2Vucy5mb250cykpIHtcbiAgICBsaW5lcy5wdXNoKGB8ICR7ZmFtaWx5fSB8ICR7aW5mby5zdHlsZXMuam9pbignLCAnKX0gfCAke2luZm8uc2l6ZXMuam9pbignLCAnKX1weCB8YCk7XG4gIH1cbiAgbGluZXMucHVzaCgnJyk7XG5cbiAgLy8gU2VjdGlvbnNcbiAgbGluZXMucHVzaCgnIyMgU2VjdGlvbnMnKTtcbiAgbGluZXMucHVzaCgnJyk7XG4gIGZvciAoY29uc3QgW2xheW91dE5hbWUsIHNwZWNdIG9mIE9iamVjdC5lbnRyaWVzKHNwZWNzLnNlY3Rpb25zKSkge1xuICAgIGxpbmVzLnB1c2goYCMjIyAke2xheW91dE5hbWV9YCk7XG4gICAgbGluZXMucHVzaChgLSAqKlNwYWNpbmcgU291cmNlKio6ICR7c3BlYy5zcGFjaW5nU291cmNlfWApO1xuICAgIGxpbmVzLnB1c2goYC0gKipCYWNrZ3JvdW5kKio6ICR7c3BlYy5zZWN0aW9uLmJhY2tncm91bmRDb2xvciB8fCAnbm9uZSd9YCk7XG4gICAgbGluZXMucHVzaChgLSAqKkdyaWQqKjogJHtzcGVjLmdyaWQubGF5b3V0TW9kZX0sICR7c3BlYy5ncmlkLmNvbHVtbnN9IGNvbHVtbnMsIGdhcDogJHtzcGVjLmdyaWQuZ2FwIHx8ICdub25lJ31gKTtcbiAgICBpZiAoc3BlYy5pbnRlcmFjdGlvbnMgJiYgc3BlYy5pbnRlcmFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgbGluZXMucHVzaChgLSAqKkludGVyYWN0aW9ucyoqOiAke3NwZWMuaW50ZXJhY3Rpb25zLmxlbmd0aH0gKCR7c3BlYy5pbnRlcmFjdGlvbnMubWFwKGkgPT4gaS50cmlnZ2VyKS5qb2luKCcsICcpfSlgKTtcbiAgICB9XG4gICAgaWYgKHNwZWMub3ZlcmxhcCkge1xuICAgICAgbGluZXMucHVzaChgLSAqKk92ZXJsYXAqKjogJHtzcGVjLm92ZXJsYXAucGl4ZWxzfXB4IHdpdGggXCIke3NwZWMub3ZlcmxhcC53aXRoU2VjdGlvbn1cImApO1xuICAgIH1cbiAgICBsaW5lcy5wdXNoKCcnKTtcblxuICAgIC8vIEVsZW1lbnRzXG4gICAgZm9yIChjb25zdCBbZWxlbU5hbWUsIGVsZW1TdHlsZXNdIG9mIE9iamVjdC5lbnRyaWVzKHNwZWMuZWxlbWVudHMpKSB7XG4gICAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5lbnRyaWVzKGVsZW1TdHlsZXMpXG4gICAgICAgIC5maWx0ZXIoKFssIHZdKSA9PiB2ICE9PSBudWxsICYmIHYgIT09IHVuZGVmaW5lZClcbiAgICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHt2fWApXG4gICAgICAgIC5qb2luKCcsICcpO1xuICAgICAgbGluZXMucHVzaChgICAtICoqJHtlbGVtTmFtZX0qKjogJHtwcm9wc31gKTtcbiAgICB9XG4gICAgbGluZXMucHVzaCgnJyk7XG4gIH1cblxuICByZXR1cm4gbGluZXMuam9pbignXFxuJyk7XG59XG4iLCAiaW1wb3J0IHsgVUlUb1NhbmRib3hNZXNzYWdlIH0gZnJvbSAnLi9zYW5kYm94L3R5cGVzJztcbmltcG9ydCB7IGRpc2NvdmVyUGFnZXMgfSBmcm9tICcuL3NhbmRib3gvZGlzY292ZXJ5JztcbmltcG9ydCB7IHJ1bkFsbFZhbGlkYXRpb25zIH0gZnJvbSAnLi9zYW5kYm94L3ZhbGlkYXRvcic7XG5pbXBvcnQgeyBydW5FeHRyYWN0aW9uIH0gZnJvbSAnLi9zYW5kYm94L2V4dHJhY3Rvcic7XG5cbi8vIFNob3cgdGhlIHBsdWdpbiBVSVxuZmlnbWEuc2hvd1VJKF9faHRtbF9fLCB7IHdpZHRoOiA2NDAsIGhlaWdodDogNTIwIH0pO1xuY29uc29sZS5sb2coXCJXUCBUaGVtZSBCdWlsZGVyIEV4cG9ydDogUGx1Z2luIGluaXRpYWxpemVkXCIpO1xuXG4vLyBDYW5jZWxsYXRpb24gZmxhZ1xubGV0IGNhbmNlbFJlcXVlc3RlZCA9IGZhbHNlO1xuXG4vLyBIYW5kbGUgbWVzc2FnZXMgZnJvbSBVSVxuZmlnbWEudWkub25tZXNzYWdlID0gYXN5bmMgKG1zZzogVUlUb1NhbmRib3hNZXNzYWdlKSA9PiB7XG4gIGNvbnNvbGUubG9nKFwiU2FuZGJveCByZWNlaXZlZCBtZXNzYWdlOlwiLCBtc2cudHlwZSk7XG5cbiAgc3dpdGNoIChtc2cudHlwZSkge1xuICAgIGNhc2UgJ0RJU0NPVkVSX1BBR0VTJzoge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGFnZXMgPSBkaXNjb3ZlclBhZ2VzKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUGFnZXMgZGlzY292ZXJlZDpcIiwgcGFnZXMubGVuZ3RoKTtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB0eXBlOiAnUEFHRVNfRElTQ09WRVJFRCcsIHBhZ2VzIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJEaXNjb3ZlcnkgZXJyb3I6XCIsIGVycik7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ0VYUE9SVF9FUlJPUicsIGVycm9yOiBTdHJpbmcoZXJyKSB9KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgJ1ZBTElEQVRFJzoge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHJ1bkFsbFZhbGlkYXRpb25zKG1zZy5mcmFtZUlkcyk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiVmFsaWRhdGlvbiBjb21wbGV0ZTpcIiwgcmVzdWx0cy5sZW5ndGgsIFwicmVzdWx0c1wiKTtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgIHR5cGU6ICdWQUxJREFUSU9OX0NPTVBMRVRFJyxcbiAgICAgICAgICByZXN1bHRzLFxuICAgICAgICAgIGZyYW1lSWRzOiBtc2cuZnJhbWVJZHMsXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJWYWxpZGF0aW9uIGVycm9yOlwiLCBlcnIpO1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ0VYUE9SVF9FUlJPUicsXG4gICAgICAgICAgZXJyb3I6IGBWYWxpZGF0aW9uIGZhaWxlZDogJHtlcnJ9YCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjYXNlICdTVEFSVF9FWFBPUlQnOiB7XG4gICAgICBjYW5jZWxSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJ1bkV4dHJhY3Rpb24oXG4gICAgICAgICAgbXNnLmZyYW1lSWRzLFxuICAgICAgICAgIG1zZy5yZXNwb25zaXZlUGFpcnMsXG4gICAgICAgICAgKG1lc3NhZ2UpID0+IGZpZ21hLnVpLnBvc3RNZXNzYWdlKG1lc3NhZ2UpLFxuICAgICAgICAgICgpID0+IGNhbmNlbFJlcXVlc3RlZCxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXhwb3J0IGVycm9yOlwiLCBlcnIpO1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ0VYUE9SVF9FUlJPUicsXG4gICAgICAgICAgZXJyb3I6IGBFeHBvcnQgZmFpbGVkOiAke2Vycn1gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgJ0NBTkNFTF9FWFBPUlQnOiB7XG4gICAgICBjYW5jZWxSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5sb2coXCJFeHBvcnQgY2FuY2VsbGVkIGJ5IHVzZXJcIik7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn07XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUtPLFdBQVMsUUFBUSxNQUFzQjtBQUM1QyxXQUFPLEtBQ0osWUFBWSxFQUNaLFFBQVEsU0FBUyxHQUFHLEVBQ3BCLFFBQVEsaUJBQWlCLEVBQUUsRUFDM0IsUUFBUSxRQUFRLEdBQUcsRUFDbkIsUUFBUSxPQUFPLEdBQUcsRUFDbEIsUUFBUSxVQUFVLEVBQUU7QUFBQSxFQUN6QjtBQU1PLFdBQVMsYUFBYSxNQUFzQjtBQUNqRCxXQUFPLEtBQ0osWUFBWSxFQUNaLFFBQVEsU0FBUyxHQUFHLEVBQ3BCLFFBQVEsaUJBQWlCLEVBQUUsRUFDM0IsUUFBUSxRQUFRLEdBQUcsRUFDbkIsUUFBUSxPQUFPLEdBQUcsRUFDbEIsUUFBUSxVQUFVLEVBQUU7QUFBQSxFQUN6QjtBQU9PLFdBQVMsV0FBVyxPQUFrQyxPQUFlLE1BQXFCO0FBQy9GLFFBQUksVUFBVSxVQUFhLFVBQVUsUUFBUSxNQUFNLEtBQUssRUFBRyxRQUFPO0FBRWxFLFVBQU0sVUFBVSxLQUFLLE1BQU0sUUFBUSxHQUFHLElBQUk7QUFFMUMsVUFBTSxVQUFVLE9BQU8sVUFBVSxPQUFPLElBQUksVUFBVTtBQUN0RCxXQUFPLEdBQUcsT0FBTyxHQUFHLElBQUk7QUFBQSxFQUMxQjtBQWFPLFdBQVMsbUJBQW1CLE1BQXNCO0FBQ3ZELFdBQU8sR0FBRyxRQUFRLElBQUksQ0FBQztBQUFBLEVBQ3pCO0FBT08sV0FBUyxtQkFBbUIsT0FBZSxRQUErQjtBQUMvRSxRQUFJLENBQUMsU0FBUyxDQUFDLE9BQVEsUUFBTztBQUM5QixVQUFNLE1BQU0sQ0FBQyxHQUFXLE1BQXVCLE1BQU0sSUFBSSxJQUFJ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
