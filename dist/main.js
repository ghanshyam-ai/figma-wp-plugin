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
  function screenshotFilename(index, name) {
    const padded = String(index).padStart(2, "0");
    return `${padded}-${slugify(name)}.png`;
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
      } else {
        styles.borderTopLeftRadius = toCssValue(corners.topLeft);
        styles.borderTopRightRadius = toCssValue(corners.topRight);
        styles.borderBottomLeftRadius = toCssValue(corners.bottomLeft);
        styles.borderBottomRightRadius = toCssValue(corners.bottomRight);
      }
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
        const inputName = node.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "input";
        elements[inputName] = inputStyles;
        return;
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
        screenshotFile: `screenshots/${screenshotFilename(i + 1, node.name)}`,
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
        filename: screenshotFilename(i + 1, sections[i].name),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3NhbmRib3gvdXRpbHMudHMiLCAiLi4vc3JjL3NhbmRib3gvcmVzcG9uc2l2ZS50cyIsICIuLi9zcmMvc2FuZGJveC9kaXNjb3ZlcnkudHMiLCAiLi4vc3JjL3NhbmRib3gvdmFsaWRhdG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2NvbG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2VmZmVjdHMudHMiLCAiLi4vc3JjL3NhbmRib3gvdHlwb2dyYXBoeS50cyIsICIuLi9zcmMvc2FuZGJveC9zcGFjaW5nLnRzIiwgIi4uL3NyYy9zYW5kYm94L2dyaWQudHMiLCAiLi4vc3JjL3NhbmRib3gvaW50ZXJhY3Rpb25zLnRzIiwgIi4uL3NyYy9zYW5kYm94L3ZhcmlhYmxlcy50cyIsICIuLi9zcmMvc2FuZGJveC9wYXR0ZXJucy50cyIsICIuLi9zcmMvc2FuZGJveC9zZWN0aW9uLXBhcnNlci50cyIsICIuLi9zcmMvc2FuZGJveC9pbWFnZS1leHBvcnRlci50cyIsICIuLi9zcmMvc2FuZGJveC9leHRyYWN0b3IudHMiLCAiLi4vc3JjL21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogQ29udmVydCBhIEZpZ21hIGxheWVyIG5hbWUgdG8gYSBVUkwtc2FmZSBrZWJhYi1jYXNlIHNsdWcuXG4gKiBcIkhlcm8gU2VjdGlvblwiIFx1MjE5MiBcImhlcm8tc2VjdGlvblwiXG4gKiBcIkFib3V0IFVzIFx1MjAxNCBPdmVydmlld1wiIFx1MjE5MiBcImFib3V0LXVzLW92ZXJ2aWV3XCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNsdWdpZnkobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5hbWVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXHUyMDE0XHUyMDEzXS9nLCAnLScpXG4gICAgLnJlcGxhY2UoL1teYS16MC05XFxzLV0vZywgJycpXG4gICAgLnJlcGxhY2UoL1xccysvZywgJy0nKVxuICAgIC5yZXBsYWNlKC8tKy9nLCAnLScpXG4gICAgLnJlcGxhY2UoL14tfC0kL2csICcnKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgRmlnbWEgbGF5ZXIgbmFtZSB0byBBQ0YtY29tcGF0aWJsZSBzbmFrZV9jYXNlIGxheW91dCBuYW1lLlxuICogXCJIZXJvIFNlY3Rpb25cIiBcdTIxOTIgXCJoZXJvX3NlY3Rpb25cIlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9MYXlvdXROYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBuYW1lXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW1x1MjAxNFx1MjAxM10vZywgJ18nKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOVxcc19dL2csICcnKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csICdfJylcbiAgICAucmVwbGFjZSgvXysvZywgJ18nKVxuICAgIC5yZXBsYWNlKC9eX3xfJC9nLCAnJyk7XG59XG5cbi8qKlxuICogQ29udmVydCBhIG51bWVyaWMgdmFsdWUgdG8gYSBDU1MgdmFsdWUgc3RyaW5nIHdpdGggdW5pdC5cbiAqIE5FVkVSIHJldHVybnMgYSBiYXJlIG51bWJlciBcdTIwMTQgYWx3YXlzIFwiTnB4XCIsIFwiTiVcIiwgZXRjLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSB2YWx1ZSBpcyB1bmRlZmluZWQvbnVsbC9OYU4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0Nzc1ZhbHVlKHZhbHVlOiBudW1iZXIgfCB1bmRlZmluZWQgfCBudWxsLCB1bml0OiBzdHJpbmcgPSAncHgnKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IGlzTmFOKHZhbHVlKSkgcmV0dXJuIG51bGw7XG4gIC8vIFJvdW5kIHRvIGF2b2lkIGZsb2F0aW5nLXBvaW50IG5vaXNlIChlLmcuLCA3OS45OTk5OSBcdTIxOTIgODApXG4gIGNvbnN0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKHZhbHVlICogMTAwKSAvIDEwMDtcbiAgLy8gVXNlIGludGVnZXIgd2hlbiBjbG9zZSBlbm91Z2hcbiAgY29uc3QgZGlzcGxheSA9IE51bWJlci5pc0ludGVnZXIocm91bmRlZCkgPyByb3VuZGVkIDogcm91bmRlZDtcbiAgcmV0dXJuIGAke2Rpc3BsYXl9JHt1bml0fWA7XG59XG5cbi8qKlxuICogRm9ybWF0IGEgRmlnbWEgbm9kZSBJRCBmb3Igb3V0cHV0LiBGaWdtYSB1c2VzIFwiMToyMzRcIiBmb3JtYXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub2RlSWRUb1N0cmluZyhpZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlkO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgemVyby1wYWRkZWQgc2NyZWVuc2hvdCBmaWxlbmFtZS5cbiAqICgxLCBcIkhlcm8gU2VjdGlvblwiKSBcdTIxOTIgXCIwMS1oZXJvLXNlY3Rpb24ucG5nXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjcmVlbnNob3RGaWxlbmFtZShpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwYWRkZWQgPSBTdHJpbmcoaW5kZXgpLnBhZFN0YXJ0KDIsICcwJyk7XG4gIHJldHVybiBgJHtwYWRkZWR9LSR7c2x1Z2lmeShuYW1lKX0ucG5nYDtcbn1cblxuLyoqXG4gKiBDb21wdXRlIHRoZSBhc3BlY3QgcmF0aW8gc3RyaW5nIGZyb20gd2lkdGggYW5kIGhlaWdodC5cbiAqIFJldHVybnMgdGhlIHNpbXBsZXN0IGludGVnZXIgcmF0aW86IDE0NDAvOTAwIFx1MjE5MiBcIjE2LzEwXCJcbiAqIFJldHVybnMgbnVsbCBpZiBlaXRoZXIgZGltZW5zaW9uIGlzIDAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlQXNwZWN0UmF0aW8od2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCF3aWR0aCB8fCAhaGVpZ2h0KSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZ2NkID0gKGE6IG51bWJlciwgYjogbnVtYmVyKTogbnVtYmVyID0+IChiID09PSAwID8gYSA6IGdjZChiLCBhICUgYikpO1xuICBjb25zdCBkID0gZ2NkKE1hdGgucm91bmQod2lkdGgpLCBNYXRoLnJvdW5kKGhlaWdodCkpO1xuICByZXR1cm4gYCR7TWF0aC5yb3VuZCh3aWR0aCAvIGQpfS8ke01hdGgucm91bmQoaGVpZ2h0IC8gZCl9YDtcbn1cblxuLyoqXG4gKiBEZXRlY3QgaWYgYSBub2RlIG5hbWUgaXMgYSBkZWZhdWx0IEZpZ21hLWdlbmVyYXRlZCBuYW1lLlxuICogXCJGcmFtZSAxXCIsIFwiR3JvdXAgMjNcIiwgXCJSZWN0YW5nbGUgNFwiLCBcIlZlY3RvclwiIFx1MjE5MiB0cnVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0RlZmF1bHRMYXllck5hbWUobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiAvXihGcmFtZXxHcm91cHxSZWN0YW5nbGV8RWxsaXBzZXxMaW5lfFZlY3RvcnxQb2x5Z29ufFN0YXJ8Qm9vbGVhbnxTbGljZXxDb21wb25lbnR8SW5zdGFuY2UpXFxzKlxcZCokL2kudGVzdChuYW1lKTtcbn1cbiIsICJpbXBvcnQgeyBCcmVha3BvaW50Q2xhc3MsIEZyYW1lSW5mbywgUmVzcG9uc2l2ZU1hcCwgUmVzcG9uc2l2ZVBhaXIsIFVubWF0Y2hlZEZyYW1lIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBzbHVnaWZ5IH0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogQ2xhc3NpZnkgYSBmcmFtZSB3aWR0aCBpbnRvIGEgYnJlYWtwb2ludCBjYXRlZ29yeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzaWZ5QnJlYWtwb2ludCh3aWR0aDogbnVtYmVyKTogQnJlYWtwb2ludENsYXNzIHtcbiAgaWYgKHdpZHRoIDw9IDQ4MCkgcmV0dXJuICdtb2JpbGUnO1xuICBpZiAod2lkdGggPD0gODIwKSByZXR1cm4gJ3RhYmxldCc7XG4gIGlmICh3aWR0aCA8PSAxNDQwKSByZXR1cm4gJ2Rlc2t0b3AnO1xuICByZXR1cm4gJ2xhcmdlJztcbn1cblxuLyoqXG4gKiBDb21tb24gc3VmZml4ZXMva2V5d29yZHMgdGhhdCBkZW5vdGUgYnJlYWtwb2ludHMgaW4gZnJhbWUgbmFtZXMuXG4gKi9cbmNvbnN0IEJSRUFLUE9JTlRfUEFUVEVSTlMgPSBbXG4gIC9bLVx1MjAxM1x1MjAxNFxcc10qKGRlc2t0b3B8bW9iaWxlfHRhYmxldHxyZXNwb25zaXZlfHBob25lfHdlYnxsZ3xtZHxzbXx4cykvZ2ksXG4gIC9bLVx1MjAxM1x1MjAxNFxcc10qKFxcZHszLDR9KVxccyooPzpweCk/JC9naSwgICAvLyB0cmFpbGluZyB3aWR0aCBudW1iZXJzIGxpa2UgXCIxNDQwXCIgb3IgXCIzNzVweFwiXG4gIC9cXCgoPzpkZXNrdG9wfG1vYmlsZXx0YWJsZXR8cGhvbmUpXFwpL2dpLFxuICAvXFxzKyQvZyxcbl07XG5cbi8qKlxuICogTm9ybWFsaXplIGEgZnJhbWUgbmFtZSBieSBzdHJpcHBpbmcgYnJlYWtwb2ludCBpZGVudGlmaWVycy5cbiAqIFwiQWJvdXQgLSBEZXNrdG9wXCIgXHUyMTkyIFwiYWJvdXRcIlxuICogXCJIb21lcGFnZSAxNDQwXCIgXHUyMTkyIFwiaG9tZXBhZ2VcIlxuICogXCJTZXJ2aWNlcyAoTW9iaWxlKVwiIFx1MjE5MiBcInNlcnZpY2VzXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUZyYW1lTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgbm9ybWFsaXplZCA9IG5hbWU7XG4gIGZvciAoY29uc3QgcGF0dGVybiBvZiBCUkVBS1BPSU5UX1BBVFRFUk5TKSB7XG4gICAgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQucmVwbGFjZShwYXR0ZXJuLCAnJyk7XG4gIH1cbiAgcmV0dXJuIG5vcm1hbGl6ZWQudHJpbSgpLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xufVxuXG4vKipcbiAqIE1hdGNoIGRlc2t0b3AgYW5kIG1vYmlsZSBmcmFtZXMgYnkgbmFtZSBzaW1pbGFyaXR5LlxuICogUmV0dXJucyBSZXNwb25zaXZlTWFwIHdpdGggbWF0Y2hlZCBwYWlycyBhbmQgdW5tYXRjaGVkIGZyYW1lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoUmVzcG9uc2l2ZUZyYW1lcyhhbGxGcmFtZXM6IEZyYW1lSW5mb1tdKTogUmVzcG9uc2l2ZU1hcCB7XG4gIC8vIEdyb3VwIGZyYW1lcyBieSBub3JtYWxpemVkIG5hbWVcbiAgY29uc3QgZ3JvdXBzID0gbmV3IE1hcDxzdHJpbmcsIEZyYW1lSW5mb1tdPigpO1xuXG4gIGZvciAoY29uc3QgZnJhbWUgb2YgYWxsRnJhbWVzKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUZyYW1lTmFtZShmcmFtZS5uYW1lKTtcbiAgICBpZiAoIWdyb3Vwcy5oYXMobm9ybWFsaXplZCkpIHtcbiAgICAgIGdyb3Vwcy5zZXQobm9ybWFsaXplZCwgW10pO1xuICAgIH1cbiAgICBncm91cHMuZ2V0KG5vcm1hbGl6ZWQpIS5wdXNoKGZyYW1lKTtcbiAgfVxuXG4gIGNvbnN0IG1hdGNoZWRQYWlyczogUmVzcG9uc2l2ZVBhaXJbXSA9IFtdO1xuICBjb25zdCB1bm1hdGNoZWRGcmFtZXM6IFVubWF0Y2hlZEZyYW1lW10gPSBbXTtcbiAgY29uc3QgbWF0Y2hlZElkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgW2Jhc2VOYW1lLCBmcmFtZXNdIG9mIGdyb3Vwcykge1xuICAgIGlmIChmcmFtZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAvLyBTaW5nbGUgZnJhbWUgXHUyMDE0IG5vIHJlc3BvbnNpdmUgcGFpclxuICAgICAgY29uc3QgZnJhbWUgPSBmcmFtZXNbMF07XG4gICAgICBpZiAoZnJhbWUuYnJlYWtwb2ludCA9PT0gJ2Rlc2t0b3AnIHx8IGZyYW1lLmJyZWFrcG9pbnQgPT09ICdsYXJnZScpIHtcbiAgICAgICAgLy8gRGVza3RvcCB3aXRob3V0IG1vYmlsZSBcdTIxOTIgc3RpbGwgYSB2YWxpZCBwYWdlLCBqdXN0IG5vIHJlc3BvbnNpdmUgZGF0YVxuICAgICAgICBtYXRjaGVkUGFpcnMucHVzaCh7XG4gICAgICAgICAgcGFnZU5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgICAgcGFnZVNsdWc6IHNsdWdpZnkoYmFzZU5hbWUgfHwgZnJhbWUubmFtZSksXG4gICAgICAgICAgZGVza3RvcDogeyBmcmFtZUlkOiBmcmFtZS5pZCwgZnJhbWVOYW1lOiBmcmFtZS5uYW1lLCB3aWR0aDogZnJhbWUud2lkdGggfSxcbiAgICAgICAgICBtb2JpbGU6IG51bGwsXG4gICAgICAgICAgdGFibGV0OiBudWxsLFxuICAgICAgICAgIG1hdGNoQ29uZmlkZW5jZTogMS4wLFxuICAgICAgICAgIG1hdGNoTWV0aG9kOiAnbmFtZS1zaW1pbGFyaXR5JyxcbiAgICAgICAgfSk7XG4gICAgICAgIG1hdGNoZWRJZHMuYWRkKGZyYW1lLmlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVubWF0Y2hlZEZyYW1lcy5wdXNoKHtcbiAgICAgICAgICBmcmFtZUlkOiBmcmFtZS5pZCxcbiAgICAgICAgICBmcmFtZU5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgICAgd2lkdGg6IGZyYW1lLndpZHRoLFxuICAgICAgICAgIGJyZWFrcG9pbnQ6IGZyYW1lLmJyZWFrcG9pbnQsXG4gICAgICAgICAgcmVhc29uOiAnbm8gZGVza3RvcCBjb3VudGVycGFydCBmb3VuZCcsXG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVkSWRzLmFkZChmcmFtZS5pZCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBNdWx0aXBsZSBmcmFtZXMgd2l0aCBzYW1lIGJhc2UgbmFtZSBcdTIwMTQgbWF0Y2ggYnkgYnJlYWtwb2ludFxuICAgIGNvbnN0IGRlc2t0b3AgPSBmcmFtZXMuZmluZChmID0+IGYuYnJlYWtwb2ludCA9PT0gJ2Rlc2t0b3AnIHx8IGYuYnJlYWtwb2ludCA9PT0gJ2xhcmdlJyk7XG4gICAgY29uc3QgbW9iaWxlID0gZnJhbWVzLmZpbmQoZiA9PiBmLmJyZWFrcG9pbnQgPT09ICdtb2JpbGUnKTtcbiAgICBjb25zdCB0YWJsZXQgPSBmcmFtZXMuZmluZChmID0+IGYuYnJlYWtwb2ludCA9PT0gJ3RhYmxldCcpO1xuXG4gICAgaWYgKGRlc2t0b3ApIHtcbiAgICAgIG1hdGNoZWRQYWlycy5wdXNoKHtcbiAgICAgICAgcGFnZU5hbWU6IGRlc2t0b3AubmFtZSxcbiAgICAgICAgcGFnZVNsdWc6IHNsdWdpZnkoYmFzZU5hbWUgfHwgZGVza3RvcC5uYW1lKSxcbiAgICAgICAgZGVza3RvcDogeyBmcmFtZUlkOiBkZXNrdG9wLmlkLCBmcmFtZU5hbWU6IGRlc2t0b3AubmFtZSwgd2lkdGg6IGRlc2t0b3Aud2lkdGggfSxcbiAgICAgICAgbW9iaWxlOiBtb2JpbGUgPyB7IGZyYW1lSWQ6IG1vYmlsZS5pZCwgZnJhbWVOYW1lOiBtb2JpbGUubmFtZSwgd2lkdGg6IG1vYmlsZS53aWR0aCB9IDogbnVsbCxcbiAgICAgICAgdGFibGV0OiB0YWJsZXQgPyB7IGZyYW1lSWQ6IHRhYmxldC5pZCwgZnJhbWVOYW1lOiB0YWJsZXQubmFtZSwgd2lkdGg6IHRhYmxldC53aWR0aCB9IDogbnVsbCxcbiAgICAgICAgbWF0Y2hDb25maWRlbmNlOiAwLjk1LFxuICAgICAgICBtYXRjaE1ldGhvZDogJ25hbWUtc2ltaWxhcml0eScsXG4gICAgICB9KTtcbiAgICAgIG1hdGNoZWRJZHMuYWRkKGRlc2t0b3AuaWQpO1xuICAgICAgaWYgKG1vYmlsZSkgbWF0Y2hlZElkcy5hZGQobW9iaWxlLmlkKTtcbiAgICAgIGlmICh0YWJsZXQpIG1hdGNoZWRJZHMuYWRkKHRhYmxldC5pZCk7XG4gICAgfVxuXG4gICAgLy8gQW55IHJlbWFpbmluZyBmcmFtZXMgaW4gdGhpcyBncm91cFxuICAgIGZvciAoY29uc3QgZnJhbWUgb2YgZnJhbWVzKSB7XG4gICAgICBpZiAoIW1hdGNoZWRJZHMuaGFzKGZyYW1lLmlkKSkge1xuICAgICAgICB1bm1hdGNoZWRGcmFtZXMucHVzaCh7XG4gICAgICAgICAgZnJhbWVJZDogZnJhbWUuaWQsXG4gICAgICAgICAgZnJhbWVOYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgICAgIHdpZHRoOiBmcmFtZS53aWR0aCxcbiAgICAgICAgICBicmVha3BvaW50OiBmcmFtZS5icmVha3BvaW50LFxuICAgICAgICAgIHJlYXNvbjogJ2NvdWxkIG5vdCBwYWlyIHdpdGggZGVza3RvcCBmcmFtZScsXG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVkSWRzLmFkZChmcmFtZS5pZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQ2F0Y2ggYW55IGZyYW1lcyBub3QgcHJvY2Vzc2VkXG4gIGZvciAoY29uc3QgZnJhbWUgb2YgYWxsRnJhbWVzKSB7XG4gICAgaWYgKCFtYXRjaGVkSWRzLmhhcyhmcmFtZS5pZCkpIHtcbiAgICAgIHVubWF0Y2hlZEZyYW1lcy5wdXNoKHtcbiAgICAgICAgZnJhbWVJZDogZnJhbWUuaWQsXG4gICAgICAgIGZyYW1lTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgd2lkdGg6IGZyYW1lLndpZHRoLFxuICAgICAgICBicmVha3BvaW50OiBmcmFtZS5icmVha3BvaW50LFxuICAgICAgICByZWFzb246ICdub3QgbWF0Y2hlZCBieSBhbnkgbWV0aG9kJyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7IG1hdGNoZWRQYWlycywgdW5tYXRjaGVkRnJhbWVzIH07XG59XG5cbi8qKlxuICogQ29udGVudC1iYXNlZCBtYXRjaGluZyBmYWxsYmFjazogY29tcGFyZSBjaGlsZCBuYW1lcyBiZXR3ZWVuIHR3byBmcmFtZXMuXG4gKiBSZXR1cm5zIG92ZXJsYXAgcmF0aW8gKDAtMSkuID4wLjYgPSBsaWtlbHkgc2FtZSBwYWdlIGF0IGRpZmZlcmVudCBicmVha3BvaW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVDb250ZW50T3ZlcmxhcChmcmFtZUE6IEZyYW1lTm9kZSwgZnJhbWVCOiBGcmFtZU5vZGUpOiBudW1iZXIge1xuICBjb25zdCBuYW1lc0EgPSBuZXcgU2V0KGZyYW1lQS5jaGlsZHJlbi5tYXAoYyA9PiBjLm5hbWUudG9Mb3dlckNhc2UoKSkpO1xuICBjb25zdCBuYW1lc0IgPSBuZXcgU2V0KGZyYW1lQi5jaGlsZHJlbi5tYXAoYyA9PiBjLm5hbWUudG9Mb3dlckNhc2UoKSkpO1xuXG4gIGlmIChuYW1lc0Euc2l6ZSA9PT0gMCB8fCBuYW1lc0Iuc2l6ZSA9PT0gMCkgcmV0dXJuIDA7XG5cbiAgbGV0IG92ZXJsYXAgPSAwO1xuICBmb3IgKGNvbnN0IG5hbWUgb2YgbmFtZXNBKSB7XG4gICAgaWYgKG5hbWVzQi5oYXMobmFtZSkpIG92ZXJsYXArKztcbiAgfVxuXG4gIGNvbnN0IHVuaW9uU2l6ZSA9IG5ldyBTZXQoWy4uLm5hbWVzQSwgLi4ubmFtZXNCXSkuc2l6ZTtcbiAgcmV0dXJuIHVuaW9uU2l6ZSA+IDAgPyBvdmVybGFwIC8gdW5pb25TaXplIDogMDtcbn1cbiIsICJpbXBvcnQgeyBQYWdlSW5mbywgRnJhbWVJbmZvIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBjbGFzc2lmeUJyZWFrcG9pbnQgfSBmcm9tICcuL3Jlc3BvbnNpdmUnO1xuXG4vKipcbiAqIERpc2NvdmVyIGFsbCBwYWdlcyBpbiB0aGUgRmlnbWEgZmlsZS5cbiAqIEVhY2ggcGFnZSBjb250YWlucyBmcmFtZXMgdGhhdCByZXByZXNlbnQgZGVzaWduIGFydGJvYXJkcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc2NvdmVyUGFnZXMoKTogUGFnZUluZm9bXSB7XG4gIGNvbnN0IHBhZ2VzOiBQYWdlSW5mb1tdID0gW107XG5cbiAgZm9yIChjb25zdCBwYWdlIG9mIGZpZ21hLnJvb3QuY2hpbGRyZW4pIHtcbiAgICBjb25zdCBmcmFtZXMgPSBkaXNjb3ZlckZyYW1lcyhwYWdlKTtcbiAgICBpZiAoZnJhbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICBpZDogcGFnZS5pZCxcbiAgICAgICAgbmFtZTogcGFnZS5uYW1lLFxuICAgICAgICBmcmFtZXMsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFnZXM7XG59XG5cbi8qKlxuICogRGlzY292ZXIgYWxsIHRvcC1sZXZlbCBmcmFtZXMgd2l0aGluIGEgcGFnZS5cbiAqIEZpbHRlcnMgdG8gRlJBTUUsIENPTVBPTkVOVF9TRVQsIGFuZCBDT01QT05FTlQgbm9kZXMgd2l0aCBtZWFuaW5nZnVsIGRpbWVuc2lvbnMuXG4gKi9cbmZ1bmN0aW9uIGRpc2NvdmVyRnJhbWVzKHBhZ2U6IFBhZ2VOb2RlKTogRnJhbWVJbmZvW10ge1xuICBjb25zdCBmcmFtZXM6IEZyYW1lSW5mb1tdID0gW107XG5cbiAgZm9yIChjb25zdCBjaGlsZCBvZiBwYWdlLmNoaWxkcmVuKSB7XG4gICAgLy8gT25seSBpbmNsdWRlIHRvcC1sZXZlbCBmcmFtZXMgKG5vdCBncm91cHMsIHZlY3RvcnMsIGV0Yy4pXG4gICAgaWYgKGNoaWxkLnR5cGUgIT09ICdGUkFNRScgJiYgY2hpbGQudHlwZSAhPT0gJ0NPTVBPTkVOVCcgJiYgY2hpbGQudHlwZSAhPT0gJ0NPTVBPTkVOVF9TRVQnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBmcmFtZSA9IGNoaWxkIGFzIEZyYW1lTm9kZTtcblxuICAgIC8vIFNraXAgdGlueSBmcmFtZXMgKGxpa2VseSBpY29ucyBvciBjb21wb25lbnRzLCBub3QgcGFnZSBkZXNpZ25zKVxuICAgIGlmIChmcmFtZS53aWR0aCA8IDMwMCB8fCBmcmFtZS5oZWlnaHQgPCAyMDApIGNvbnRpbnVlO1xuXG4gICAgLy8gQ291bnQgdmlzaWJsZSBzZWN0aW9ucyAoZGlyZWN0IGNoaWxkcmVuIHRoYXQgYXJlIGZyYW1lcylcbiAgICBjb25zdCBzZWN0aW9uQ291bnQgPSBmcmFtZS5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3ggJiZcbiAgICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveC5oZWlnaHQgPiA1MFxuICAgICkubGVuZ3RoO1xuXG4gICAgLy8gQ2hlY2sgaWYgYW55IHNlY3Rpb24gdXNlcyBhdXRvLWxheW91dFxuICAgIGNvbnN0IGhhc0F1dG9MYXlvdXQgPSBmcmFtZS5sYXlvdXRNb2RlICE9PSB1bmRlZmluZWQgJiYgZnJhbWUubGF5b3V0TW9kZSAhPT0gJ05PTkUnO1xuXG4gICAgZnJhbWVzLnB1c2goe1xuICAgICAgaWQ6IGZyYW1lLmlkLFxuICAgICAgbmFtZTogZnJhbWUubmFtZSxcbiAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKGZyYW1lLndpZHRoKSxcbiAgICAgIGhlaWdodDogTWF0aC5yb3VuZChmcmFtZS5oZWlnaHQpLFxuICAgICAgYnJlYWtwb2ludDogY2xhc3NpZnlCcmVha3BvaW50KE1hdGgucm91bmQoZnJhbWUud2lkdGgpKSxcbiAgICAgIHNlY3Rpb25Db3VudCxcbiAgICAgIGhhc0F1dG9MYXlvdXQsXG4gICAgICByZXNwb25zaXZlUGFpcklkOiBudWxsLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGZyYW1lcztcbn1cbiIsICJpbXBvcnQgeyBWYWxpZGF0aW9uUmVzdWx0LCBGcmFtZUluZm8gfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IGlzRGVmYXVsdExheWVyTmFtZSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIFJ1biBhbGwgOSB2YWxpZGF0aW9uIGNoZWNrcyBhZ2FpbnN0IHNlbGVjdGVkIGZyYW1lcy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkFsbFZhbGlkYXRpb25zKGZyYW1lSWRzOiBzdHJpbmdbXSk6IFByb21pc2U8VmFsaWRhdGlvblJlc3VsdFtdPiB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgZnJhbWVJZCBvZiBmcmFtZUlkcykge1xuICAgIGNvbnN0IG5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChmcmFtZUlkKTtcbiAgICBpZiAoIW5vZGUgfHwgbm9kZS50eXBlICE9PSAnRlJBTUUnKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgY29uc3Qgc2VjdGlvbnMgPSBmcmFtZS5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICAgKTtcblxuICAgIC8vIENoZWNrIDE6IE1pc3NpbmcgYXV0by1sYXlvdXQgb24gc2VjdGlvbnNcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tBdXRvTGF5b3V0KHNlY3Rpb25zLCBmcmFtZS5uYW1lKSk7XG5cbiAgICAvLyBDaGVjayAyOiBEZWZhdWx0IGxheWVyIG5hbWVzXG4gICAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrTGF5ZXJOYW1lcyhzZWN0aW9ucywgZnJhbWUubmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgMzogTWlzc2luZyBmb250c1xuICAgIHJlc3VsdHMucHVzaCguLi5hd2FpdCBjaGVja0ZvbnRzKGZyYW1lKSk7XG5cbiAgICAvLyBDaGVjayA0OiBJbmNvbnNpc3RlbnQgc3BhY2luZ1xuICAgIHJlc3VsdHMucHVzaCguLi5jaGVja1NwYWNpbmdDb25zaXN0ZW5jeShmcmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgNTogT3ZlcnNpemVkIGltYWdlc1xuICAgIHJlc3VsdHMucHVzaCguLi5jaGVja092ZXJzaXplZEltYWdlcyhmcmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgNjogT3ZlcmxhcHBpbmcgc2VjdGlvbnNcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tPdmVybGFwcyhzZWN0aW9ucywgZnJhbWUubmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgOTogVGV4dCBvdmVyZmxvd1xuICAgIHJlc3VsdHMucHVzaCguLi5jaGVja1RleHRPdmVyZmxvdyhmcmFtZSkpO1xuICB9XG5cbiAgLy8gQ2hlY2sgNzogTWlzc2luZyByZXNwb25zaXZlIGZyYW1lcyAoY3Jvc3MtZnJhbWUgY2hlY2spXG4gIHJlc3VsdHMucHVzaCguLi5jaGVja1Jlc3BvbnNpdmVGcmFtZXMoZnJhbWVJZHMpKTtcblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDE6IE1pc3NpbmcgQXV0by1MYXlvdXQgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrQXV0b0xheW91dChzZWN0aW9uczogU2NlbmVOb2RlW10sIGZyYW1lTmFtZTogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG4gIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBzZWN0aW9ucykge1xuICAgIGlmIChzZWN0aW9uLnR5cGUgPT09ICdGUkFNRScgfHwgc2VjdGlvbi50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBzZWN0aW9uLnR5cGUgPT09ICdJTlNUQU5DRScpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gc2VjdGlvbiBhcyBGcmFtZU5vZGU7XG4gICAgICBpZiAoIWZyYW1lLmxheW91dE1vZGUgfHwgZnJhbWUubGF5b3V0TW9kZSA9PT0gJ05PTkUnKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgICAgICBjaGVjazogJ2F1dG8tbGF5b3V0JyxcbiAgICAgICAgICBtZXNzYWdlOiBgU2VjdGlvbiBcIiR7c2VjdGlvbi5uYW1lfVwiIHVzZXMgYWJzb2x1dGUgcG9zaXRpb25pbmcuIFNwYWNpbmcgdmFsdWVzIHdpbGwgYmUgYXBwcm94aW1hdGUuYCxcbiAgICAgICAgICBzZWN0aW9uTmFtZTogc2VjdGlvbi5uYW1lLFxuICAgICAgICAgIG5vZGVJZDogc2VjdGlvbi5pZCxcbiAgICAgICAgICBub2RlTmFtZTogc2VjdGlvbi5uYW1lLFxuICAgICAgICAgIHN1Z2dlc3Rpb246ICdBcHBseSBhdXRvLWxheW91dCB0byB0aGlzIHNlY3Rpb24gZm9yIHByZWNpc2Ugc3BhY2luZyBleHRyYWN0aW9uLicsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDI6IERlZmF1bHQgTGF5ZXIgTmFtZXMgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrTGF5ZXJOYW1lcyhzZWN0aW9uczogU2NlbmVOb2RlW10sIGZyYW1lTmFtZTogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIpIHtcbiAgICBpZiAoaXNEZWZhdWx0TGF5ZXJOYW1lKG5vZGUubmFtZSkpIHtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiBkZXB0aCA9PT0gMCA/ICd3YXJuaW5nJyA6ICdpbmZvJyxcbiAgICAgICAgY2hlY2s6ICdsYXllci1uYW1lcycsXG4gICAgICAgIG1lc3NhZ2U6IGBMYXllciBcIiR7bm9kZS5uYW1lfVwiIGhhcyBhIGRlZmF1bHQgRmlnbWEgbmFtZSR7ZGVwdGggPT09IDAgPyAnIChzZWN0aW9uIGxldmVsKScgOiAnJ30uYCxcbiAgICAgICAgc2VjdGlvbk5hbWU6IGZyYW1lTmFtZSxcbiAgICAgICAgbm9kZUlkOiBub2RlLmlkLFxuICAgICAgICBub2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICBzdWdnZXN0aW9uOiAnUmVuYW1lIHRvIGEgZGVzY3JpcHRpdmUgbmFtZSAoZS5nLiwgXCJIZXJvIFNlY3Rpb25cIiwgXCJGZWF0dXJlcyBHcmlkXCIpLicsXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSAmJiBkZXB0aCA8IDIpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkLCBkZXB0aCArIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBzZWN0aW9ucykge1xuICAgIHdhbGsoc2VjdGlvbiwgMCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayAzOiBNaXNzaW5nIEZvbnRzIFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5hc3luYyBmdW5jdGlvbiBjaGVja0ZvbnRzKGZyYW1lOiBGcmFtZU5vZGUpOiBQcm9taXNlPFZhbGlkYXRpb25SZXN1bHRbXT4ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcbiAgY29uc3QgY2hlY2tlZEZvbnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZnVuY3Rpb24gY29sbGVjdEZvbnROYW1lcyhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIGNvbnN0IGZvbnROYW1lID0gbm9kZS5mb250TmFtZTtcbiAgICAgIGlmIChmb250TmFtZSAhPT0gZmlnbWEubWl4ZWQgJiYgZm9udE5hbWUpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gYCR7Zm9udE5hbWUuZmFtaWx5fTo6JHtmb250TmFtZS5zdHlsZX1gO1xuICAgICAgICBpZiAoIWNoZWNrZWRGb250cy5oYXMoa2V5KSkge1xuICAgICAgICAgIGNoZWNrZWRGb250cy5hZGQoa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgY29sbGVjdEZvbnROYW1lcyhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29sbGVjdEZvbnROYW1lcyhmcmFtZSk7XG5cbiAgZm9yIChjb25zdCBmb250S2V5IG9mIGNoZWNrZWRGb250cykge1xuICAgIGNvbnN0IFtmYW1pbHksIHN0eWxlXSA9IGZvbnRLZXkuc3BsaXQoJzo6Jyk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZpZ21hLmxvYWRGb250QXN5bmMoeyBmYW1pbHksIHN0eWxlIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcicsXG4gICAgICAgIGNoZWNrOiAnZm9udHMnLFxuICAgICAgICBtZXNzYWdlOiBgRm9udCBcIiR7ZmFtaWx5fSAke3N0eWxlfVwiIGlzIG5vdCBhdmFpbGFibGUuIFRleHQgZXh0cmFjdGlvbiBtYXkgZmFpbC5gLFxuICAgICAgICBzZWN0aW9uTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgc3VnZ2VzdGlvbjogJ0luc3RhbGwgdGhlIGZvbnQgb3IgcmVwbGFjZSBpdCBpbiB0aGUgZGVzaWduLicsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayA0OiBJbmNvbnNpc3RlbnQgU3BhY2luZyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tTcGFjaW5nQ29uc2lzdGVuY3koZnJhbWU6IEZyYW1lTm9kZSk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuICBjb25zdCBzcGFjaW5nVmFsdWVzOiBudW1iZXJbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJykge1xuICAgICAgY29uc3QgZiA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgaWYgKGYubGF5b3V0TW9kZSAmJiBmLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICBzcGFjaW5nVmFsdWVzLnB1c2goZi5wYWRkaW5nVG9wLCBmLnBhZGRpbmdCb3R0b20sIGYucGFkZGluZ0xlZnQsIGYucGFkZGluZ1JpZ2h0LCBmLml0ZW1TcGFjaW5nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKGZyYW1lKTtcblxuICAvLyBGaW5kIG5lYXItZHVwbGljYXRlc1xuICBjb25zdCB1bmlxdWUgPSBbLi4ubmV3IFNldChzcGFjaW5nVmFsdWVzLmZpbHRlcih2ID0+IHYgPiAwKSldLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmlxdWUubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgY29uc3QgZGlmZiA9IHVuaXF1ZVtpICsgMV0gLSB1bmlxdWVbaV07XG4gICAgaWYgKGRpZmYgPiAwICYmIGRpZmYgPD0gMikge1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdpbmZvJyxcbiAgICAgICAgY2hlY2s6ICdzcGFjaW5nLWNvbnNpc3RlbmN5JyxcbiAgICAgICAgbWVzc2FnZTogYE5lYXItZHVwbGljYXRlIHNwYWNpbmc6ICR7dW5pcXVlW2ldfXB4IGFuZCAke3VuaXF1ZVtpICsgMV19cHggXHUyMDE0IGxpa2VseSBzYW1lIGludGVudD9gLFxuICAgICAgICBzZWN0aW9uTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgc3VnZ2VzdGlvbjogYENvbnNpZGVyIHN0YW5kYXJkaXppbmcgdG8gJHtNYXRoLnJvdW5kKCh1bmlxdWVbaV0gKyB1bmlxdWVbaSArIDFdKSAvIDIpfXB4LmAsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayA1OiBPdmVyc2l6ZWQgSW1hZ2VzIFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja092ZXJzaXplZEltYWdlcyhmcmFtZTogRnJhbWVOb2RlKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAoJ2ZpbGxzJyBpbiBub2RlKSB7XG4gICAgICBjb25zdCBmaWxscyA9IChub2RlIGFzIGFueSkuZmlsbHM7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShmaWxscykpIHtcbiAgICAgICAgZm9yIChjb25zdCBmaWxsIG9mIGZpbGxzKSB7XG4gICAgICAgICAgaWYgKGZpbGwudHlwZSA9PT0gJ0lNQUdFJyAmJiBmaWxsLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICAgICAgICBpZiAoYm91bmRzKSB7XG4gICAgICAgICAgICAgIC8vIEVzdGltYXRlIHJhdyBpbWFnZSBzaXplIChSR0JBIGF0IDJ4KTogdyAqIDIgKiBoICogMiAqIDQgYnl0ZXNcbiAgICAgICAgICAgICAgLy8gRXN0aW1hdGUgYXQgMXggZXhwb3J0OiB3aWR0aCAqIGhlaWdodCAqIDQgKFJHQkEgYnl0ZXMpXG4gICAgICAgICAgICAgIGNvbnN0IGVzdGltYXRlZEJ5dGVzID0gYm91bmRzLndpZHRoICogYm91bmRzLmhlaWdodCAqIDQ7XG4gICAgICAgICAgICAgIGNvbnN0IGVzdGltYXRlZE1CID0gZXN0aW1hdGVkQnl0ZXMgLyAoMTAyNCAqIDEwMjQpO1xuICAgICAgICAgICAgICBpZiAoZXN0aW1hdGVkTUIgPiA1KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICAgICAgICAgICAgICBjaGVjazogJ2ltYWdlLXNpemUnLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEltYWdlIGluIFwiJHtub2RlLm5hbWV9XCIgaXMgZXN0aW1hdGVkIGF0ICR7ZXN0aW1hdGVkTUIudG9GaXhlZCgxKX1NQiBhdCAxeCBleHBvcnQuYCxcbiAgICAgICAgICAgICAgICAgIG5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICAgICAgICAgIG5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICBzdWdnZXN0aW9uOiAnQ29uc2lkZXIgcmVkdWNpbmcgaW1hZ2UgZGltZW5zaW9ucyBvciBleHBvcnQgc2NhbGUuJyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdhbGsoZnJhbWUpO1xuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDY6IE92ZXJsYXBwaW5nIFNlY3Rpb25zIFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja092ZXJsYXBzKHNlY3Rpb25zOiBTY2VuZU5vZGVbXSwgZnJhbWVOYW1lOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcbiAgY29uc3Qgc29ydGVkID0gWy4uLnNlY3Rpb25zXVxuICAgIC5maWx0ZXIocyA9PiBzLmFic29sdXRlQm91bmRpbmdCb3gpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueSk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3J0ZWQubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgY29uc3QgY3VyciA9IHNvcnRlZFtpXS5hYnNvbHV0ZUJvdW5kaW5nQm94ITtcbiAgICBjb25zdCBuZXh0ID0gc29ydGVkW2kgKyAxXS5hYnNvbHV0ZUJvdW5kaW5nQm94ITtcbiAgICBjb25zdCBvdmVybGFwID0gKGN1cnIueSArIGN1cnIuaGVpZ2h0KSAtIG5leHQueTtcbiAgICBpZiAob3ZlcmxhcCA+IDApIHtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICAgIGNoZWNrOiAnb3ZlcmxhcCcsXG4gICAgICAgIG1lc3NhZ2U6IGBTZWN0aW9uIFwiJHtzb3J0ZWRbaV0ubmFtZX1cIiBvdmVybGFwcyB3aXRoIFwiJHtzb3J0ZWRbaSArIDFdLm5hbWV9XCIgYnkgJHtNYXRoLnJvdW5kKG92ZXJsYXApfXB4LmAsXG4gICAgICAgIHNlY3Rpb25OYW1lOiBzb3J0ZWRbaV0ubmFtZSxcbiAgICAgICAgbm9kZUlkOiBzb3J0ZWRbaV0uaWQsXG4gICAgICAgIHN1Z2dlc3Rpb246ICdUaGUgcGx1Z2luIHdpbGwgcmVjb3JkIHRoaXMgYXMgYSBuZWdhdGl2ZSBtYXJnaW4uIFZlcmlmeSB0aGUgdmlzdWFsIHJlc3VsdC4nLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgNzogTWlzc2luZyBSZXNwb25zaXZlIEZyYW1lcyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tSZXNwb25zaXZlRnJhbWVzKGZyYW1lSWRzOiBzdHJpbmdbXSk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuICBjb25zdCBmcmFtZXMgPSBmcmFtZUlkc1xuICAgIC5tYXAoaWQgPT4gZmlnbWEuZ2V0Tm9kZUJ5SWQoaWQpKVxuICAgIC5maWx0ZXIobiA9PiBuICYmIG4udHlwZSA9PT0gJ0ZSQU1FJykgYXMgRnJhbWVOb2RlW107XG5cbiAgY29uc3QgZGVza3RvcEZyYW1lcyA9IGZyYW1lcy5maWx0ZXIoZiA9PiBmLndpZHRoID4gMTAyNCk7XG4gIGNvbnN0IG1vYmlsZUZyYW1lcyA9IGZyYW1lcy5maWx0ZXIoZiA9PiBmLndpZHRoIDw9IDQ4MCk7XG5cbiAgaWYgKGRlc2t0b3BGcmFtZXMubGVuZ3RoID4gMCAmJiBtb2JpbGVGcmFtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICBjaGVjazogJ3Jlc3BvbnNpdmUnLFxuICAgICAgbWVzc2FnZTogYE9ubHkgZGVza3RvcCBmcmFtZXMgc2VsZWN0ZWQgKG5vIG1vYmlsZSBmcmFtZXMpLiBSZXNwb25zaXZlIHZhbHVlcyB3aWxsIGJlIGNhbGN1bGF0ZWQsIG5vdCBleHRyYWN0ZWQuYCxcbiAgICAgIHN1Z2dlc3Rpb246ICdJbmNsdWRlIG1vYmlsZSAoMzc1cHgpIGZyYW1lcyBmb3IgZXhhY3QgcmVzcG9uc2l2ZSB2YWx1ZXMuJyxcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDk6IFRleHQgT3ZlcmZsb3cgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrVGV4dE92ZXJmbG93KGZyYW1lOiBGcmFtZU5vZGUpOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJyAmJiBub2RlLmFic29sdXRlQm91bmRpbmdCb3ggJiYgbm9kZS5wYXJlbnQgJiYgJ2Fic29sdXRlQm91bmRpbmdCb3gnIGluIG5vZGUucGFyZW50KSB7XG4gICAgICBjb25zdCB0ZXh0Qm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgY29uc3QgcGFyZW50Qm91bmRzID0gKG5vZGUucGFyZW50IGFzIEZyYW1lTm9kZSkuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgIGlmIChwYXJlbnRCb3VuZHMpIHtcbiAgICAgICAgY29uc3Qgb3ZlcmZsb3dSaWdodCA9ICh0ZXh0Qm91bmRzLnggKyB0ZXh0Qm91bmRzLndpZHRoKSAtIChwYXJlbnRCb3VuZHMueCArIHBhcmVudEJvdW5kcy53aWR0aCk7XG4gICAgICAgIGNvbnN0IG92ZXJmbG93Qm90dG9tID0gKHRleHRCb3VuZHMueSArIHRleHRCb3VuZHMuaGVpZ2h0KSAtIChwYXJlbnRCb3VuZHMueSArIHBhcmVudEJvdW5kcy5oZWlnaHQpO1xuICAgICAgICBpZiAob3ZlcmZsb3dSaWdodCA+IDUgfHwgb3ZlcmZsb3dCb3R0b20gPiA1KSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICAgICAgICBjaGVjazogJ3RleHQtb3ZlcmZsb3cnLFxuICAgICAgICAgICAgbWVzc2FnZTogYFRleHQgXCIke25vZGUubmFtZX1cIiBvdmVyZmxvd3MgaXRzIGNvbnRhaW5lciBieSAke01hdGgubWF4KE1hdGgucm91bmQob3ZlcmZsb3dSaWdodCksIE1hdGgucm91bmQob3ZlcmZsb3dCb3R0b20pKX1weC5gLFxuICAgICAgICAgICAgbm9kZUlkOiBub2RlLmlkLFxuICAgICAgICAgICAgbm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgIHN1Z2dlc3Rpb246ICdSZXNpemUgdGhlIHRleHQgY29udGFpbmVyIG9yIHJlZHVjZSB0ZXh0IGNvbnRlbnQuJyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdhbGsoZnJhbWUpO1xuICByZXR1cm4gcmVzdWx0cztcbn1cbiIsICIvKipcbiAqIENvbnZlcnQgYSBzaW5nbGUgRmlnbWEgMC0xIGZsb2F0IGNoYW5uZWwgdG8gYSAyLWRpZ2l0IGhleCBzdHJpbmcuXG4gKiBVc2VzIE1hdGgucm91bmQoKSBmb3IgcHJlY2lzaW9uIChOT1QgTWF0aC5mbG9vcigpKS5cbiAqL1xuZnVuY3Rpb24gY2hhbm5lbFRvSGV4KHZhbHVlOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIDI1NSkudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsICcwJykudG9VcHBlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IEZpZ21hIFJHQiAoMC0xIGZsb2F0KSB0byA2LWRpZ2l0IHVwcGVyY2FzZSBIRVguXG4gKiB7IHI6IDAuMDg2LCBnOiAwLjIyLCBiOiAwLjk4NCB9IFx1MjE5MiBcIiMxNjM4RkJcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmdiVG9IZXgoY29sb3I6IHsgcjogbnVtYmVyOyBnOiBudW1iZXI7IGI6IG51bWJlciB9KTogc3RyaW5nIHtcbiAgcmV0dXJuIGAjJHtjaGFubmVsVG9IZXgoY29sb3Iucil9JHtjaGFubmVsVG9IZXgoY29sb3IuZyl9JHtjaGFubmVsVG9IZXgoY29sb3IuYil9YDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IEZpZ21hIFJHQkEgKDAtMSBmbG9hdCkgdG8gSEVYLlxuICogUmV0dXJucyA2LWRpZ2l0IEhFWCBpZiBmdWxseSBvcGFxdWUsIDgtZGlnaXQgSEVYIGlmIGFscGhhIDwgMS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJnYmFUb0hleChjb2xvcjogeyByOiBudW1iZXI7IGc6IG51bWJlcjsgYjogbnVtYmVyIH0sIG9wYWNpdHk6IG51bWJlciA9IDEpOiBzdHJpbmcge1xuICBjb25zdCBiYXNlID0gcmdiVG9IZXgoY29sb3IpO1xuICBpZiAob3BhY2l0eSA+PSAxKSByZXR1cm4gYmFzZTtcbiAgcmV0dXJuIGAke2Jhc2V9JHtjaGFubmVsVG9IZXgob3BhY2l0eSl9YDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSBwcmltYXJ5IGJhY2tncm91bmQgY29sb3IgZnJvbSBhIG5vZGUncyBmaWxscy5cbiAqIFJldHVybnMgNi84LWRpZ2l0IEhFWCBvciBudWxsLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEJhY2tncm91bmRDb2xvcihub2RlOiBTY2VuZU5vZGUgJiB7IGZpbGxzPzogcmVhZG9ubHkgUGFpbnRbXSB9KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghKCdmaWxscycgaW4gbm9kZSkgfHwgIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiBudWxsO1xuXG4gIGZvciAoY29uc3QgZmlsbCBvZiBub2RlLmZpbGxzKSB7XG4gICAgaWYgKGZpbGwudHlwZSA9PT0gJ1NPTElEJyAmJiBmaWxsLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICBjb25zdCBvcGFjaXR5ID0gZmlsbC5vcGFjaXR5ICE9PSB1bmRlZmluZWQgPyBmaWxsLm9wYWNpdHkgOiAxO1xuICAgICAgcmV0dXJuIHJnYmFUb0hleChmaWxsLmNvbG9yLCBvcGFjaXR5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgdGV4dCBjb2xvciBmcm9tIGEgVEVYVCBub2RlJ3MgZmlsbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VGV4dENvbG9yKG5vZGU6IFRleHROb2RlKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuIG51bGw7XG5cbiAgZm9yIChjb25zdCBmaWxsIG9mIG5vZGUuZmlsbHMgYXMgcmVhZG9ubHkgUGFpbnRbXSkge1xuICAgIGlmIChmaWxsLnR5cGUgPT09ICdTT0xJRCcgJiYgZmlsbC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIHJnYlRvSGV4KGZpbGwuY29sb3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGdyYWRpZW50IGFzIENTUyBzdHJpbmcsIG9yIG51bGwgaWYgbm90IGEgZ3JhZGllbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0R3JhZGllbnQobm9kZTogU2NlbmVOb2RlICYgeyBmaWxscz86IHJlYWRvbmx5IFBhaW50W10gfSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoISgnZmlsbHMnIGluIG5vZGUpIHx8ICFub2RlLmZpbGxzIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZmlsbHMpKSByZXR1cm4gbnVsbDtcblxuICBmb3IgKGNvbnN0IGZpbGwgb2Ygbm9kZS5maWxscykge1xuICAgIGlmIChmaWxsLnR5cGUgPT09ICdHUkFESUVOVF9MSU5FQVInICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IHN0b3BzID0gZmlsbC5ncmFkaWVudFN0b3BzXG4gICAgICAgIC5tYXAocyA9PiBgJHtyZ2JUb0hleChzLmNvbG9yKX0gJHtNYXRoLnJvdW5kKHMucG9zaXRpb24gKiAxMDApfSVgKVxuICAgICAgICAuam9pbignLCAnKTtcbiAgICAgIHJldHVybiBgbGluZWFyLWdyYWRpZW50KCR7c3RvcHN9KWA7XG4gICAgfVxuICAgIGlmIChmaWxsLnR5cGUgPT09ICdHUkFESUVOVF9SQURJQUwnICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IHN0b3BzID0gZmlsbC5ncmFkaWVudFN0b3BzXG4gICAgICAgIC5tYXAocyA9PiBgJHtyZ2JUb0hleChzLmNvbG9yKX0gJHtNYXRoLnJvdW5kKHMucG9zaXRpb24gKiAxMDApfSVgKVxuICAgICAgICAuam9pbignLCAnKTtcbiAgICAgIHJldHVybiBgcmFkaWFsLWdyYWRpZW50KCR7c3RvcHN9KWA7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgbm9kZSBoYXMgYW4gSU1BR0UgZmlsbCAocGhvdG9ncmFwaC9iYWNrZ3JvdW5kKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc0ltYWdlRmlsbChub2RlOiBTY2VuZU5vZGUgJiB7IGZpbGxzPzogcmVhZG9ubHkgUGFpbnRbXSB9KTogYm9vbGVhbiB7XG4gIGlmICghKCdmaWxscycgaW4gbm9kZSkgfHwgIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIG5vZGUuZmlsbHMuc29tZShmID0+IGYudHlwZSA9PT0gJ0lNQUdFJyAmJiBmLnZpc2libGUgIT09IGZhbHNlKTtcbn1cblxuLyoqXG4gKiBNYXAgRmlnbWEgc3Ryb2tlQWxpZ24gdG8gYSBzdWl0YWJsZSBDU1MgYm9yZGVyLXN0eWxlLlxuICogRmlnbWEgc3VwcG9ydHMgc29saWQgc3Ryb2tlcyBuYXRpdmVseTsgZGFzaGVkIGlzIGluZmVycmVkIGZyb20gZGFzaFBhdHRlcm4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Qm9yZGVyU3R5bGUobm9kZTogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghKCdzdHJva2VzJyBpbiBub2RlKSB8fCAhQXJyYXkuaXNBcnJheShub2RlLnN0cm9rZXMpIHx8IG5vZGUuc3Ryb2tlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBkYXNoUGF0dGVybiA9IChub2RlIGFzIGFueSkuZGFzaFBhdHRlcm47XG4gIGlmIChBcnJheS5pc0FycmF5KGRhc2hQYXR0ZXJuKSAmJiBkYXNoUGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgLy8gMS11bml0IGRhc2hlcyA9IGRvdHRlZCwgbGFyZ2VyID0gZGFzaGVkXG4gICAgY29uc3QgbWF4ID0gTWF0aC5tYXgoLi4uZGFzaFBhdHRlcm4pO1xuICAgIHJldHVybiBtYXggPD0gMiA/ICdkb3R0ZWQnIDogJ2Rhc2hlZCc7XG4gIH1cbiAgcmV0dXJuICdzb2xpZCc7XG59XG5cbi8qKlxuICogRXh0cmFjdCBwZXItc2lkZSBib3JkZXItd2lkdGguIEZpZ21hJ3MgaW5kaXZpZHVhbFN0cm9rZVdlaWdodHMgKGlmIHNldClcbiAqIHByb3ZpZGVzIHBlci1zaWRlIHdpZHRoczsgb3RoZXJ3aXNlIHN0cm9rZVdlaWdodCBpcyB1bmlmb3JtLlxuICogUmV0dXJucyBudWxsIGZvciBhbnkgc2lkZSB0aGF0IGlzIDAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Qm9yZGVyV2lkdGhzKG5vZGU6IGFueSk6IHtcbiAgdG9wOiBudW1iZXIgfCBudWxsOyByaWdodDogbnVtYmVyIHwgbnVsbDsgYm90dG9tOiBudW1iZXIgfCBudWxsOyBsZWZ0OiBudW1iZXIgfCBudWxsOyB1bmlmb3JtOiBudW1iZXIgfCBudWxsO1xufSB7XG4gIGNvbnN0IGluZCA9IChub2RlIGFzIGFueSkuaW5kaXZpZHVhbFN0cm9rZVdlaWdodHM7XG4gIGlmIChpbmQgJiYgdHlwZW9mIGluZCA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiBpbmQudG9wIHx8IG51bGwsXG4gICAgICByaWdodDogaW5kLnJpZ2h0IHx8IG51bGwsXG4gICAgICBib3R0b206IGluZC5ib3R0b20gfHwgbnVsbCxcbiAgICAgIGxlZnQ6IGluZC5sZWZ0IHx8IG51bGwsXG4gICAgICB1bmlmb3JtOiBudWxsLFxuICAgIH07XG4gIH1cbiAgY29uc3QgdyA9IChub2RlIGFzIGFueSkuc3Ryb2tlV2VpZ2h0O1xuICBpZiAodHlwZW9mIHcgPT09ICdudW1iZXInICYmIHcgPiAwKSB7XG4gICAgcmV0dXJuIHsgdG9wOiBudWxsLCByaWdodDogbnVsbCwgYm90dG9tOiBudWxsLCBsZWZ0OiBudWxsLCB1bmlmb3JtOiB3IH07XG4gIH1cbiAgcmV0dXJuIHsgdG9wOiBudWxsLCByaWdodDogbnVsbCwgYm90dG9tOiBudWxsLCBsZWZ0OiBudWxsLCB1bmlmb3JtOiBudWxsIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgZmlyc3QgdmlzaWJsZSBTT0xJRCBzdHJva2UgY29sb3IgYXMgaGV4LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFN0cm9rZUNvbG9yKG5vZGU6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoISgnc3Ryb2tlcycgaW4gbm9kZSkgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5zdHJva2VzKSkgcmV0dXJuIG51bGw7XG4gIGZvciAoY29uc3Qgc3Ryb2tlIG9mIG5vZGUuc3Ryb2tlcykge1xuICAgIGlmIChzdHJva2UudHlwZSA9PT0gJ1NPTElEJyAmJiBzdHJva2UudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiByZ2JUb0hleChzdHJva2UuY29sb3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDb2xsZWN0IGFsbCB1bmlxdWUgY29sb3JzIGZyb20gYSBub2RlIHRyZWUuXG4gKiBSZXR1cm5zIGEgbWFwIG9mIEhFWCBcdTIxOTIgdXNhZ2UgY291bnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0Q29sb3JzKHJvb3Q6IFNjZW5lTm9kZSk6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4ge1xuICBjb25zdCBjb2xvcnM6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIC8vIEZpbGxzXG4gICAgaWYgKCdmaWxscycgaW4gbm9kZSAmJiBub2RlLmZpbGxzICYmIEFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHtcbiAgICAgIGZvciAoY29uc3QgZmlsbCBvZiBub2RlLmZpbGxzKSB7XG4gICAgICAgIGlmIChmaWxsLnR5cGUgPT09ICdTT0xJRCcgJiYgZmlsbC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgIGNvbnN0IGhleCA9IHJnYlRvSGV4KGZpbGwuY29sb3IpO1xuICAgICAgICAgIGNvbG9yc1toZXhdID0gKGNvbG9yc1toZXhdIHx8IDApICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBTdHJva2VzXG4gICAgaWYgKCdzdHJva2VzJyBpbiBub2RlICYmIG5vZGUuc3Ryb2tlcyAmJiBBcnJheS5pc0FycmF5KG5vZGUuc3Ryb2tlcykpIHtcbiAgICAgIGZvciAoY29uc3Qgc3Ryb2tlIG9mIG5vZGUuc3Ryb2tlcykge1xuICAgICAgICBpZiAoc3Ryb2tlLnR5cGUgPT09ICdTT0xJRCcgJiYgc3Ryb2tlLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgY29uc3QgaGV4ID0gcmdiVG9IZXgoc3Ryb2tlLmNvbG9yKTtcbiAgICAgICAgICBjb2xvcnNbaGV4XSA9IChjb2xvcnNbaGV4XSB8fCAwKSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVjdXJzZVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3YWxrKHJvb3QpO1xuICByZXR1cm4gY29sb3JzO1xufVxuIiwgIi8qKlxuICogRXh0cmFjdCBGaWdtYSBFZmZlY3RzIChzaGFkb3dzLCBibHVycykgaW50byBDU1MtcmVhZHkgdmFsdWVzLlxuICpcbiAqIEZpZ21hIHN1cHBvcnRzIGFuIGFycmF5IG9mIGVmZmVjdHMgcGVyIG5vZGUuIFdlIG1hcDpcbiAqICAgRFJPUF9TSEFET1cgIFx1MjE5MiBib3gtc2hhZG93IChtdWx0aXBsZSBhbGxvd2VkLCBjb21tYS1zZXBhcmF0ZWQpXG4gKiAgIElOTkVSX1NIQURPVyBcdTIxOTIgYm94LXNoYWRvdyB3aXRoIGBpbnNldGAga2V5d29yZFxuICogICBMQVlFUl9CTFVSICAgXHUyMTkyIGZpbHRlcjogYmx1cihOcHgpXG4gKiAgIEJBQ0tHUk9VTkRfQkxVUiBcdTIxOTIgYmFja2Ryb3AtZmlsdGVyOiBibHVyKE5weClcbiAqXG4gKiBURVhUIG5vZGVzIGdldCB0aGVpciBEUk9QX1NIQURPVyBtYXBwZWQgdG8gQ1NTIHRleHQtc2hhZG93IGluc3RlYWQgb2ZcbiAqIGJveC1zaGFkb3cgKERPTSByZW5kZXJpbmc6IHRleHQgbm9kZXMgZG9uJ3QgaG9ub3IgYm94LXNoYWRvdyBvbiB0aGVcbiAqIGdseXBocyB0aGVtc2VsdmVzKS5cbiAqL1xuXG5mdW5jdGlvbiByZ2JhU3RyaW5nKGNvbG9yOiB7IHI6IG51bWJlcjsgZzogbnVtYmVyOyBiOiBudW1iZXI7IGE/OiBudW1iZXIgfSk6IHN0cmluZyB7XG4gIGNvbnN0IGEgPSBjb2xvci5hICE9PSB1bmRlZmluZWQgPyBNYXRoLnJvdW5kKGNvbG9yLmEgKiAxMDApIC8gMTAwIDogMTtcbiAgcmV0dXJuIGByZ2JhKCR7TWF0aC5yb3VuZChjb2xvci5yICogMjU1KX0sICR7TWF0aC5yb3VuZChjb2xvci5nICogMjU1KX0sICR7TWF0aC5yb3VuZChjb2xvci5iICogMjU1KX0sICR7YX0pYDtcbn1cblxuZnVuY3Rpb24gc2hhZG93VG9Dc3MoZTogRHJvcFNoYWRvd0VmZmVjdCB8IElubmVyU2hhZG93RWZmZWN0LCBpbnNldDogYm9vbGVhbik6IHN0cmluZyB7XG4gIGNvbnN0IHggPSBNYXRoLnJvdW5kKGUub2Zmc2V0LngpO1xuICBjb25zdCB5ID0gTWF0aC5yb3VuZChlLm9mZnNldC55KTtcbiAgY29uc3QgYmx1ciA9IE1hdGgucm91bmQoZS5yYWRpdXMpO1xuICBjb25zdCBzcHJlYWQgPSBNYXRoLnJvdW5kKChlIGFzIGFueSkuc3ByZWFkIHx8IDApO1xuICBjb25zdCBjb2xvciA9IHJnYmFTdHJpbmcoZS5jb2xvcik7XG4gIGNvbnN0IHByZWZpeCA9IGluc2V0ID8gJ2luc2V0ICcgOiAnJztcbiAgcmV0dXJuIGAke3ByZWZpeH0ke3h9cHggJHt5fXB4ICR7Ymx1cn1weCAke3NwcmVhZH1weCAke2NvbG9yfWA7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXh0cmFjdGVkRWZmZWN0cyB7XG4gIGJveFNoYWRvdzogc3RyaW5nIHwgbnVsbDsgICAgIC8vIGNvbW1hLXNlcGFyYXRlZCBDU1MgdmFsdWUgZm9yIG11bHRpcGxlIHNoYWRvd3NcbiAgdGV4dFNoYWRvdzogc3RyaW5nIHwgbnVsbDsgICAgLy8gZm9yIFRFWFQgbm9kZXMgKERST1BfU0hBRE9XIG9uIHRleHQgYmVjb21lcyB0ZXh0LXNoYWRvdylcbiAgZmlsdGVyOiBzdHJpbmcgfCBudWxsOyAgICAgICAgLy8gTEFZRVJfQkxVUiBcdTIxOTIgYmx1cihOcHgpLCBleHRlbmRhYmxlXG4gIGJhY2tkcm9wRmlsdGVyOiBzdHJpbmcgfCBudWxsOyAvLyBCQUNLR1JPVU5EX0JMVVIgXHUyMTkyIGJsdXIoTnB4KVxufVxuXG4vKipcbiAqIEV4dHJhY3QgYWxsIGVmZmVjdHMgZnJvbSBhIG5vZGUgYW5kIHJldHVybiBDU1MtcmVhZHkgdmFsdWVzLlxuICogUmVzcGVjdHMgRmlnbWEncyB2aXNpYmxlIGZsYWc7IHNraXBzIGhpZGRlbiBlZmZlY3RzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEVmZmVjdHMoXG4gIG5vZGU6IHsgZWZmZWN0cz86IHJlYWRvbmx5IEVmZmVjdFtdOyB0eXBlPzogc3RyaW5nIH0sXG4pOiBFeHRyYWN0ZWRFZmZlY3RzIHtcbiAgY29uc3QgcmVzdWx0OiBFeHRyYWN0ZWRFZmZlY3RzID0ge1xuICAgIGJveFNoYWRvdzogbnVsbCxcbiAgICB0ZXh0U2hhZG93OiBudWxsLFxuICAgIGZpbHRlcjogbnVsbCxcbiAgICBiYWNrZHJvcEZpbHRlcjogbnVsbCxcbiAgfTtcblxuICBpZiAoIW5vZGUuZWZmZWN0cyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmVmZmVjdHMpIHx8IG5vZGUuZWZmZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgY29uc3QgaXNUZXh0ID0gbm9kZS50eXBlID09PSAnVEVYVCc7XG4gIGNvbnN0IHNoYWRvd1N0cmluZ3M6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHRleHRTaGFkb3dTdHJpbmdzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBmaWx0ZXJQYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgYmFja2Ryb3BQYXJ0czogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGVmZmVjdCBvZiBub2RlLmVmZmVjdHMpIHtcbiAgICBpZiAoZWZmZWN0LnZpc2libGUgPT09IGZhbHNlKSBjb250aW51ZTtcblxuICAgIGlmIChlZmZlY3QudHlwZSA9PT0gJ0RST1BfU0hBRE9XJykge1xuICAgICAgY29uc3QgZSA9IGVmZmVjdCBhcyBEcm9wU2hhZG93RWZmZWN0O1xuICAgICAgaWYgKGlzVGV4dCkge1xuICAgICAgICAvLyB0ZXh0LXNoYWRvdyBmb3JtYXQ6IDx4PiA8eT4gPGJsdXI+IDxjb2xvcj4gKG5vIHNwcmVhZClcbiAgICAgICAgY29uc3QgeCA9IE1hdGgucm91bmQoZS5vZmZzZXQueCk7XG4gICAgICAgIGNvbnN0IHkgPSBNYXRoLnJvdW5kKGUub2Zmc2V0LnkpO1xuICAgICAgICBjb25zdCBibHVyID0gTWF0aC5yb3VuZChlLnJhZGl1cyk7XG4gICAgICAgIHRleHRTaGFkb3dTdHJpbmdzLnB1c2goYCR7eH1weCAke3l9cHggJHtibHVyfXB4ICR7cmdiYVN0cmluZyhlLmNvbG9yKX1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNoYWRvd1N0cmluZ3MucHVzaChzaGFkb3dUb0NzcyhlLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZWZmZWN0LnR5cGUgPT09ICdJTk5FUl9TSEFET1cnKSB7XG4gICAgICBjb25zdCBlID0gZWZmZWN0IGFzIElubmVyU2hhZG93RWZmZWN0O1xuICAgICAgLy8gSU5ORVJfU0hBRE9XIG9uIFRFWFQgaXNuJ3QgYSB0aGluZyBpbiBDU1MgXHUyMDE0IGZhbGwgYmFjayB0byBlbXB0eSBmb3IgdGV4dFxuICAgICAgaWYgKCFpc1RleHQpIHNoYWRvd1N0cmluZ3MucHVzaChzaGFkb3dUb0NzcyhlLCB0cnVlKSk7XG4gICAgfSBlbHNlIGlmIChlZmZlY3QudHlwZSA9PT0gJ0xBWUVSX0JMVVInKSB7XG4gICAgICBjb25zdCBlID0gZWZmZWN0IGFzIEJsdXJFZmZlY3Q7XG4gICAgICBmaWx0ZXJQYXJ0cy5wdXNoKGBibHVyKCR7TWF0aC5yb3VuZChlLnJhZGl1cyl9cHgpYCk7XG4gICAgfSBlbHNlIGlmIChlZmZlY3QudHlwZSA9PT0gJ0JBQ0tHUk9VTkRfQkxVUicpIHtcbiAgICAgIGNvbnN0IGUgPSBlZmZlY3QgYXMgQmx1ckVmZmVjdDtcbiAgICAgIGJhY2tkcm9wUGFydHMucHVzaChgYmx1cigke01hdGgucm91bmQoZS5yYWRpdXMpfXB4KWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChzaGFkb3dTdHJpbmdzLmxlbmd0aCA+IDApIHJlc3VsdC5ib3hTaGFkb3cgPSBzaGFkb3dTdHJpbmdzLmpvaW4oJywgJyk7XG4gIGlmICh0ZXh0U2hhZG93U3RyaW5ncy5sZW5ndGggPiAwKSByZXN1bHQudGV4dFNoYWRvdyA9IHRleHRTaGFkb3dTdHJpbmdzLmpvaW4oJywgJyk7XG4gIGlmIChmaWx0ZXJQYXJ0cy5sZW5ndGggPiAwKSByZXN1bHQuZmlsdGVyID0gZmlsdGVyUGFydHMuam9pbignICcpO1xuICBpZiAoYmFja2Ryb3BQYXJ0cy5sZW5ndGggPiAwKSByZXN1bHQuYmFja2Ryb3BGaWx0ZXIgPSBiYWNrZHJvcFBhcnRzLmpvaW4oJyAnKTtcblxuICByZXR1cm4gcmVzdWx0O1xufVxuIiwgImltcG9ydCB7IEVsZW1lbnRTdHlsZXMsIFRleHRTZWdtZW50IH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyB0b0Nzc1ZhbHVlIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBleHRyYWN0VGV4dENvbG9yLCByZ2JUb0hleCB9IGZyb20gJy4vY29sb3InO1xuaW1wb3J0IHsgZXh0cmFjdEVmZmVjdHMgfSBmcm9tICcuL2VmZmVjdHMnO1xuXG4vKipcbiAqIERlcml2ZSBDU1MgZm9udC13ZWlnaHQgZnJvbSBhIEZpZ21hIGZvbnQgc3R5bGUgbmFtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvbnRXZWlnaHRGcm9tU3R5bGUoc3R5bGU6IHN0cmluZyk6IG51bWJlciB7XG4gIGNvbnN0IHMgPSBzdHlsZS50b0xvd2VyQ2FzZSgpO1xuICBpZiAocy5pbmNsdWRlcygndGhpbicpIHx8IHMuaW5jbHVkZXMoJ2hhaXJsaW5lJykpIHJldHVybiAxMDA7XG4gIGlmIChzLmluY2x1ZGVzKCdleHRyYWxpZ2h0JykgfHwgcy5pbmNsdWRlcygndWx0cmEgbGlnaHQnKSB8fCBzLmluY2x1ZGVzKCdleHRyYSBsaWdodCcpKSByZXR1cm4gMjAwO1xuICBpZiAocy5pbmNsdWRlcygnbGlnaHQnKSkgcmV0dXJuIDMwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ21lZGl1bScpKSByZXR1cm4gNTAwO1xuICBpZiAocy5pbmNsdWRlcygnc2VtaWJvbGQnKSB8fCBzLmluY2x1ZGVzKCdzZW1pIGJvbGQnKSB8fCBzLmluY2x1ZGVzKCdkZW1pIGJvbGQnKSB8fCBzLmluY2x1ZGVzKCdkZW1pYm9sZCcpKSByZXR1cm4gNjAwO1xuICBpZiAocy5pbmNsdWRlcygnZXh0cmFib2xkJykgfHwgcy5pbmNsdWRlcygnZXh0cmEgYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ3VsdHJhIGJvbGQnKSB8fCBzLmluY2x1ZGVzKCd1bHRyYWJvbGQnKSkgcmV0dXJuIDgwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ2JsYWNrJykgfHwgcy5pbmNsdWRlcygnaGVhdnknKSkgcmV0dXJuIDkwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ2JvbGQnKSkgcmV0dXJuIDcwMDtcbiAgcmV0dXJuIDQwMDsgLy8gUmVndWxhciAvIE5vcm1hbCAvIEJvb2tcbn1cblxuLyoqXG4gKiBNYXAgRmlnbWEgdGV4dCBhbGlnbm1lbnQgdG8gQ1NTIHRleHQtYWxpZ24gdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIG1hcFRleHRBbGlnbihhbGlnbjogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIHN3aXRjaCAoYWxpZ24pIHtcbiAgICBjYXNlICdMRUZUJzogcmV0dXJuICdsZWZ0JztcbiAgICBjYXNlICdDRU5URVInOiByZXR1cm4gJ2NlbnRlcic7XG4gICAgY2FzZSAnUklHSFQnOiByZXR1cm4gJ3JpZ2h0JztcbiAgICBjYXNlICdKVVNUSUZJRUQnOiByZXR1cm4gJ2p1c3RpZnknO1xuICAgIGRlZmF1bHQ6IHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogTWFwIEZpZ21hIHRleHQgY2FzZSB0byBDU1MgdGV4dC10cmFuc2Zvcm0gdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIG1hcFRleHRDYXNlKHRleHRDYXNlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgc3dpdGNoICh0ZXh0Q2FzZSkge1xuICAgIGNhc2UgJ1VQUEVSJzogcmV0dXJuICd1cHBlcmNhc2UnO1xuICAgIGNhc2UgJ0xPV0VSJzogcmV0dXJuICdsb3dlcmNhc2UnO1xuICAgIGNhc2UgJ1RJVExFJzogcmV0dXJuICdjYXBpdGFsaXplJztcbiAgICBjYXNlICdPUklHSU5BTCc6XG4gICAgZGVmYXVsdDogcmV0dXJuICdub25lJztcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3QgdHlwb2dyYXBoeSBzdHlsZXMgZnJvbSBhIFRFWFQgbm9kZS5cbiAqIFJldHVybnMgQ1NTLXJlYWR5IHZhbHVlcyB3aXRoIHVuaXRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFR5cG9ncmFwaHkobm9kZTogVGV4dE5vZGUpOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+IHtcbiAgY29uc3Qgc3R5bGVzOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge307XG5cbiAgLy8gRm9udCBmYW1pbHkgXHUyMDE0IGhhbmRsZSBtaXhlZCBmb250cyAodXNlIGZpcnN0IHNlZ21lbnQpXG4gIGNvbnN0IGZvbnROYW1lID0gbm9kZS5mb250TmFtZTtcbiAgaWYgKGZvbnROYW1lICE9PSBmaWdtYS5taXhlZCAmJiBmb250TmFtZSkge1xuICAgIHN0eWxlcy5mb250RmFtaWx5ID0gZm9udE5hbWUuZmFtaWx5O1xuICAgIHN0eWxlcy5mb250V2VpZ2h0ID0gZm9udFdlaWdodEZyb21TdHlsZShmb250TmFtZS5zdHlsZSk7XG4gIH1cblxuICAvLyBGb250IHNpemVcbiAgY29uc3QgZm9udFNpemUgPSBub2RlLmZvbnRTaXplO1xuICBpZiAoZm9udFNpemUgIT09IGZpZ21hLm1peGVkICYmIHR5cGVvZiBmb250U2l6ZSA9PT0gJ251bWJlcicpIHtcbiAgICBzdHlsZXMuZm9udFNpemUgPSB0b0Nzc1ZhbHVlKGZvbnRTaXplKTtcbiAgfVxuXG4gIC8vIExpbmUgaGVpZ2h0XG4gIGNvbnN0IGxoID0gbm9kZS5saW5lSGVpZ2h0O1xuICBpZiAobGggIT09IGZpZ21hLm1peGVkICYmIGxoKSB7XG4gICAgaWYgKGxoLnVuaXQgPT09ICdQSVhFTFMnKSB7XG4gICAgICBzdHlsZXMubGluZUhlaWdodCA9IHRvQ3NzVmFsdWUobGgudmFsdWUpO1xuICAgIH0gZWxzZSBpZiAobGgudW5pdCA9PT0gJ1BFUkNFTlQnKSB7XG4gICAgICBzdHlsZXMubGluZUhlaWdodCA9IGAke01hdGgucm91bmQobGgudmFsdWUpfSVgO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBVVRPIFx1MjAxNCBkZXJpdmUgZnJvbSBmb250IHNpemVcbiAgICAgIHN0eWxlcy5saW5lSGVpZ2h0ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvLyBMZXR0ZXIgc3BhY2luZ1xuICBjb25zdCBscyA9IG5vZGUubGV0dGVyU3BhY2luZztcbiAgaWYgKGxzICE9PSBmaWdtYS5taXhlZCAmJiBscykge1xuICAgIGlmIChscy51bml0ID09PSAnUElYRUxTJykge1xuICAgICAgc3R5bGVzLmxldHRlclNwYWNpbmcgPSB0b0Nzc1ZhbHVlKGxzLnZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKGxzLnVuaXQgPT09ICdQRVJDRU5UJykge1xuICAgICAgLy8gQ29udmVydCBwZXJjZW50YWdlIHRvIGVtIChGaWdtYSdzIDEwMCUgPSAxZW0pXG4gICAgICBjb25zdCBlbVZhbHVlID0gTWF0aC5yb3VuZCgobHMudmFsdWUgLyAxMDApICogMTAwKSAvIDEwMDtcbiAgICAgIHN0eWxlcy5sZXR0ZXJTcGFjaW5nID0gYCR7ZW1WYWx1ZX1lbWA7XG4gICAgfVxuICB9XG5cbiAgLy8gVGV4dCB0cmFuc2Zvcm1cbiAgY29uc3QgdGV4dENhc2UgPSBub2RlLnRleHRDYXNlO1xuICBpZiAodGV4dENhc2UgIT09IGZpZ21hLm1peGVkKSB7XG4gICAgc3R5bGVzLnRleHRUcmFuc2Zvcm0gPSBtYXBUZXh0Q2FzZSh0ZXh0Q2FzZSBhcyBzdHJpbmcpO1xuICB9XG5cbiAgLy8gVGV4dCBhbGlnbm1lbnRcbiAgY29uc3QgdGV4dEFsaWduID0gbm9kZS50ZXh0QWxpZ25Ib3Jpem9udGFsO1xuICBpZiAodGV4dEFsaWduKSB7XG4gICAgc3R5bGVzLnRleHRBbGlnbiA9IG1hcFRleHRBbGlnbih0ZXh0QWxpZ24pO1xuICB9XG5cbiAgLy8gVGV4dCBkZWNvcmF0aW9uICh1bmRlcmxpbmUgLyBsaW5lLXRocm91Z2ggLyBub25lKVxuICBjb25zdCB0ZCA9IChub2RlIGFzIGFueSkudGV4dERlY29yYXRpb247XG4gIGlmICh0ZCAhPT0gdW5kZWZpbmVkICYmIHRkICE9PSBmaWdtYS5taXhlZCkge1xuICAgIGlmICh0ZCA9PT0gJ1VOREVSTElORScpIHN0eWxlcy50ZXh0RGVjb3JhdGlvbiA9ICd1bmRlcmxpbmUnO1xuICAgIGVsc2UgaWYgKHRkID09PSAnU1RSSUtFVEhST1VHSCcpIHN0eWxlcy50ZXh0RGVjb3JhdGlvbiA9ICdsaW5lLXRocm91Z2gnO1xuICAgIGVsc2Ugc3R5bGVzLnRleHREZWNvcmF0aW9uID0gbnVsbDtcbiAgfVxuXG4gIC8vIENvbG9yXG4gIHN0eWxlcy5jb2xvciA9IGV4dHJhY3RUZXh0Q29sb3Iobm9kZSk7XG5cbiAgLy8gVGV4dC1zaGFkb3cgZnJvbSBEUk9QX1NIQURPVyBlZmZlY3RzIG9uIFRFWFQgbm9kZXNcbiAgY29uc3QgZWZmZWN0cyA9IGV4dHJhY3RFZmZlY3RzKG5vZGUpO1xuICBpZiAoZWZmZWN0cy50ZXh0U2hhZG93KSBzdHlsZXMudGV4dFNoYWRvdyA9IGVmZmVjdHMudGV4dFNoYWRvdztcblxuICAvLyBGaWdtYSBUZXh0IFN0eWxlIHJlZmVyZW5jZSAoZGVzaWduIHRva2VuIGZvciB0eXBvZ3JhcGh5KVxuICBjb25zdCBzdHlsZU5hbWUgPSBleHRyYWN0VGV4dFN0eWxlTmFtZShub2RlKTtcbiAgaWYgKHN0eWxlTmFtZSkgc3R5bGVzLnRleHRTdHlsZU5hbWUgPSBzdHlsZU5hbWU7XG5cbiAgLy8gU3R5bGVkIHRleHQgc2VnbWVudHMgXHUyMDE0IG9ubHkgd2hlbiB0aGUgdGV4dCBoYXMgbWl4ZWQgaW5saW5lIHN0eWxlc1xuICBjb25zdCBzZWdtZW50cyA9IGV4dHJhY3RUZXh0U2VnbWVudHMobm9kZSk7XG4gIGlmIChzZWdtZW50cykgc3R5bGVzLnRleHRTZWdtZW50cyA9IHNlZ21lbnRzO1xuXG4gIHJldHVybiBzdHlsZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgYm91bmQgRmlnbWEgVGV4dCBTdHlsZSBuYW1lIChlLmcuIFwiSGVhZGluZy9IMlwiKS5cbiAqIFJldHVybnMgbnVsbCB3aGVuIHRoZSB0ZXh0IG5vZGUgaGFzIG5vIHN0eWxlIGJpbmRpbmcsIG9yIHRoZSBiaW5kaW5nIGlzIG1peGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFRleHRTdHlsZU5hbWUobm9kZTogVGV4dE5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBpZCA9IChub2RlIGFzIGFueSkudGV4dFN0eWxlSWQ7XG4gICAgaWYgKCFpZCB8fCBpZCA9PT0gZmlnbWEubWl4ZWQgfHwgdHlwZW9mIGlkICE9PSAnc3RyaW5nJykgcmV0dXJuIG51bGw7XG4gICAgY29uc3Qgc3R5bGUgPSBmaWdtYS5nZXRTdHlsZUJ5SWQoaWQpO1xuICAgIHJldHVybiBzdHlsZT8ubmFtZSB8fCBudWxsO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3Qgc3R5bGVkIHRleHQgc2VnbWVudHMgc28gaW5saW5lIGZvcm1hdHRpbmcgKGJvbGQgd29yZCwgY29sb3JlZCBzcGFuLFxuICogdW5kZXJsaW5lZCBsaW5rIGluc2lkZSBhIHBhcmFncmFwaCkgc3Vydml2ZXMgdGhlIGV4cG9ydC4gUmV0dXJucyBudWxsIHdoZW5cbiAqIHRoZSB0ZXh0IGhhcyBubyBtaXhlZCBzdHlsZXMgXHUyMDE0IGluIHRoYXQgY2FzZSB0aGUgZWxlbWVudC1sZXZlbCB0eXBvZ3JhcGh5XG4gKiBhbHJlYWR5IGRlc2NyaWJlcyB0aGUgd2hvbGUgdGV4dCB1bmlmb3JtbHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VGV4dFNlZ21lbnRzKG5vZGU6IFRleHROb2RlKTogVGV4dFNlZ21lbnRbXSB8IG51bGwge1xuICBpZiAoIW5vZGUuY2hhcmFjdGVycykgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgZ2V0U2VnbWVudHMgPSAobm9kZSBhcyBhbnkpLmdldFN0eWxlZFRleHRTZWdtZW50cztcbiAgICBpZiAodHlwZW9mIGdldFNlZ21lbnRzICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCByYXcgPSBnZXRTZWdtZW50cy5jYWxsKG5vZGUsIFsnZm9udE5hbWUnLCAnZm9udFNpemUnLCAnZmlsbHMnLCAndGV4dERlY29yYXRpb24nXSk7XG4gICAgaWYgKCFyYXcgfHwgIUFycmF5LmlzQXJyYXkocmF3KSB8fCByYXcubGVuZ3RoIDw9IDEpIHJldHVybiBudWxsO1xuXG4gICAgY29uc3Qgc2VnbWVudHM6IFRleHRTZWdtZW50W10gPSByYXcubWFwKChzOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IHNlZzogVGV4dFNlZ21lbnQgPSB7IHRleHQ6IHMuY2hhcmFjdGVycyB8fCAnJyB9O1xuICAgICAgaWYgKHMuZm9udE5hbWUgJiYgdHlwZW9mIHMuZm9udE5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHNlZy5mb250RmFtaWx5ID0gcy5mb250TmFtZS5mYW1pbHk7XG4gICAgICAgIHNlZy5mb250V2VpZ2h0ID0gZm9udFdlaWdodEZyb21TdHlsZShzLmZvbnROYW1lLnN0eWxlKTtcbiAgICAgICAgaWYgKHMuZm9udE5hbWUuc3R5bGUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnaXRhbGljJykpIHNlZy5pdGFsaWMgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBzLmZvbnRTaXplID09PSAnbnVtYmVyJykgc2VnLmZvbnRTaXplID0gcy5mb250U2l6ZTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHMuZmlsbHMpKSB7XG4gICAgICAgIGZvciAoY29uc3QgZiBvZiBzLmZpbGxzKSB7XG4gICAgICAgICAgaWYgKGYudHlwZSA9PT0gJ1NPTElEJyAmJiBmLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICBzZWcuY29sb3IgPSByZ2JUb0hleChmLmNvbG9yKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHMudGV4dERlY29yYXRpb24gPT09ICdVTkRFUkxJTkUnKSBzZWcudGV4dERlY29yYXRpb24gPSAndW5kZXJsaW5lJztcbiAgICAgIGVsc2UgaWYgKHMudGV4dERlY29yYXRpb24gPT09ICdTVFJJS0VUSFJPVUdIJykgc2VnLnRleHREZWNvcmF0aW9uID0gJ2xpbmUtdGhyb3VnaCc7XG4gICAgICByZXR1cm4gc2VnO1xuICAgIH0pO1xuXG4gICAgLy8gSWYgZXZlcnkgc2VnbWVudCdzIHN0eWxpbmcgaXMgaWRlbnRpY2FsLCB0aGUgc2VnbWVudGF0aW9uIGFkZHMgbm90aGluZy5cbiAgICBjb25zdCBmaXJzdCA9IHNlZ21lbnRzWzBdO1xuICAgIGNvbnN0IGFsbFNhbWUgPSBzZWdtZW50cy5ldmVyeShzID0+XG4gICAgICBzLmZvbnRGYW1pbHkgPT09IGZpcnN0LmZvbnRGYW1pbHkgJiZcbiAgICAgIHMuZm9udFdlaWdodCA9PT0gZmlyc3QuZm9udFdlaWdodCAmJlxuICAgICAgcy5mb250U2l6ZSA9PT0gZmlyc3QuZm9udFNpemUgJiZcbiAgICAgIHMuY29sb3IgPT09IGZpcnN0LmNvbG9yICYmXG4gICAgICBzLml0YWxpYyA9PT0gZmlyc3QuaXRhbGljICYmXG4gICAgICBzLnRleHREZWNvcmF0aW9uID09PSBmaXJzdC50ZXh0RGVjb3JhdGlvblxuICAgICk7XG4gICAgcmV0dXJuIGFsbFNhbWUgPyBudWxsIDogc2VnbWVudHM7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogQ29sbGVjdCBhbGwgdW5pcXVlIGZvbnQgdXNhZ2UgZGF0YSBmcm9tIGEgbm9kZSB0cmVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdEZvbnRzKHJvb3Q6IFNjZW5lTm9kZSk6IFJlY29yZDxzdHJpbmcsIHsgc3R5bGVzOiBTZXQ8c3RyaW5nPjsgc2l6ZXM6IFNldDxudW1iZXI+OyBjb3VudDogbnVtYmVyIH0+IHtcbiAgY29uc3QgZm9udHM6IFJlY29yZDxzdHJpbmcsIHsgc3R5bGVzOiBTZXQ8c3RyaW5nPjsgc2l6ZXM6IFNldDxudW1iZXI+OyBjb3VudDogbnVtYmVyIH0+ID0ge307XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIGNvbnN0IGZvbnROYW1lID0gbm9kZS5mb250TmFtZTtcbiAgICAgIGlmIChmb250TmFtZSAhPT0gZmlnbWEubWl4ZWQgJiYgZm9udE5hbWUpIHtcbiAgICAgICAgY29uc3QgZmFtaWx5ID0gZm9udE5hbWUuZmFtaWx5O1xuICAgICAgICBpZiAoIWZvbnRzW2ZhbWlseV0pIHtcbiAgICAgICAgICBmb250c1tmYW1pbHldID0geyBzdHlsZXM6IG5ldyBTZXQoKSwgc2l6ZXM6IG5ldyBTZXQoKSwgY291bnQ6IDAgfTtcbiAgICAgICAgfVxuICAgICAgICBmb250c1tmYW1pbHldLnN0eWxlcy5hZGQoZm9udE5hbWUuc3R5bGUpO1xuICAgICAgICBmb250c1tmYW1pbHldLmNvdW50Kys7XG5cbiAgICAgICAgY29uc3QgZm9udFNpemUgPSBub2RlLmZvbnRTaXplO1xuICAgICAgICBpZiAoZm9udFNpemUgIT09IGZpZ21hLm1peGVkICYmIHR5cGVvZiBmb250U2l6ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICBmb250c1tmYW1pbHldLnNpemVzLmFkZChmb250U2l6ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdhbGsocm9vdCk7XG4gIHJldHVybiBmb250cztcbn1cblxuLyoqXG4gKiBDb3VudCBURVhUIG5vZGVzIGluIGEgc3VidHJlZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvdW50VGV4dE5vZGVzKHJvb3Q6IFNjZW5lTm9kZSk6IG51bWJlciB7XG4gIGxldCBjb3VudCA9IDA7XG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSBjb3VudCsrO1xuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2Fsayhyb290KTtcbiAgcmV0dXJuIGNvdW50O1xufVxuIiwgImltcG9ydCB7IFNlY3Rpb25TdHlsZXMgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHRvQ3NzVmFsdWUgfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBFeHRyYWN0IHNwYWNpbmcgZnJvbSBhbiBhdXRvLWxheW91dCBmcmFtZS5cbiAqIFRoZXNlIHZhbHVlcyBtYXAgMToxIHRvIENTUyBcdTIwMTQgaGlnaCBjb25maWRlbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEF1dG9MYXlvdXRTcGFjaW5nKG5vZGU6IEZyYW1lTm9kZSk6IHtcbiAgc3BhY2luZ1NvdXJjZTogJ2F1dG8tbGF5b3V0JztcbiAgc2VjdGlvblN0eWxlczogUGFydGlhbDxTZWN0aW9uU3R5bGVzPjtcbiAgaXRlbVNwYWNpbmc6IHN0cmluZyB8IG51bGw7XG59IHtcbiAgcmV0dXJuIHtcbiAgICBzcGFjaW5nU291cmNlOiAnYXV0by1sYXlvdXQnLFxuICAgIHNlY3Rpb25TdHlsZXM6IHtcbiAgICAgIHBhZGRpbmdUb3A6IHRvQ3NzVmFsdWUobm9kZS5wYWRkaW5nVG9wKSxcbiAgICAgIHBhZGRpbmdCb3R0b206IHRvQ3NzVmFsdWUobm9kZS5wYWRkaW5nQm90dG9tKSxcbiAgICAgIHBhZGRpbmdMZWZ0OiB0b0Nzc1ZhbHVlKG5vZGUucGFkZGluZ0xlZnQpLFxuICAgICAgcGFkZGluZ1JpZ2h0OiB0b0Nzc1ZhbHVlKG5vZGUucGFkZGluZ1JpZ2h0KSxcbiAgICB9LFxuICAgIGl0ZW1TcGFjaW5nOiB0b0Nzc1ZhbHVlKG5vZGUuaXRlbVNwYWNpbmcpLFxuICB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3Qgc3BhY2luZyBmcm9tIGFuIGFic29sdXRlbHktcG9zaXRpb25lZCBmcmFtZSBieSBjb21wdXRpbmdcbiAqIGZyb20gY2hpbGRyZW4ncyBib3VuZGluZyBib3hlcy4gVGhlc2UgdmFsdWVzIGFyZSBhcHByb3hpbWF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RBYnNvbHV0ZVNwYWNpbmcobm9kZTogRnJhbWVOb2RlKToge1xuICBzcGFjaW5nU291cmNlOiAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnO1xuICBzZWN0aW9uU3R5bGVzOiBQYXJ0aWFsPFNlY3Rpb25TdHlsZXM+O1xuICBpdGVtU3BhY2luZzogc3RyaW5nIHwgbnVsbDtcbn0ge1xuICBjb25zdCBwYXJlbnRCb3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGlmICghcGFyZW50Qm91bmRzKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNwYWNpbmdTb3VyY2U6ICdhYnNvbHV0ZS1jb29yZGluYXRlcycsXG4gICAgICBzZWN0aW9uU3R5bGVzOiB7XG4gICAgICAgIHBhZGRpbmdUb3A6IG51bGwsXG4gICAgICAgIHBhZGRpbmdCb3R0b206IG51bGwsXG4gICAgICAgIHBhZGRpbmdMZWZ0OiBudWxsLFxuICAgICAgICBwYWRkaW5nUmlnaHQ6IG51bGwsXG4gICAgICB9LFxuICAgICAgaXRlbVNwYWNpbmc6IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlblxuICAgIC5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlICYmIGMuYWJzb2x1dGVCb3VuZGluZ0JveClcbiAgICAuc29ydCgoYSwgYikgPT4gYS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gYi5hYnNvbHV0ZUJvdW5kaW5nQm94IS55KTtcblxuICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNwYWNpbmdTb3VyY2U6ICdhYnNvbHV0ZS1jb29yZGluYXRlcycsXG4gICAgICBzZWN0aW9uU3R5bGVzOiB7XG4gICAgICAgIHBhZGRpbmdUb3A6IG51bGwsXG4gICAgICAgIHBhZGRpbmdCb3R0b206IG51bGwsXG4gICAgICAgIHBhZGRpbmdMZWZ0OiBudWxsLFxuICAgICAgICBwYWRkaW5nUmlnaHQ6IG51bGwsXG4gICAgICB9LFxuICAgICAgaXRlbVNwYWNpbmc6IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGZpcnN0Q2hpbGQgPSBjaGlsZHJlblswXS5hYnNvbHV0ZUJvdW5kaW5nQm94ITtcbiAgY29uc3QgbGFzdENoaWxkID0gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV0uYWJzb2x1dGVCb3VuZGluZ0JveCE7XG5cbiAgY29uc3QgcGFkZGluZ1RvcCA9IGZpcnN0Q2hpbGQueSAtIHBhcmVudEJvdW5kcy55O1xuICBjb25zdCBwYWRkaW5nQm90dG9tID0gKHBhcmVudEJvdW5kcy55ICsgcGFyZW50Qm91bmRzLmhlaWdodCkgLSAobGFzdENoaWxkLnkgKyBsYXN0Q2hpbGQuaGVpZ2h0KTtcblxuICAvLyBDb21wdXRlIGxlZnQgcGFkZGluZyBmcm9tIHRoZSBsZWZ0bW9zdCBjaGlsZFxuICBjb25zdCBsZWZ0TW9zdCA9IE1hdGgubWluKC4uLmNoaWxkcmVuLm1hcChjID0+IGMuYWJzb2x1dGVCb3VuZGluZ0JveCEueCkpO1xuICBjb25zdCBwYWRkaW5nTGVmdCA9IGxlZnRNb3N0IC0gcGFyZW50Qm91bmRzLng7XG5cbiAgLy8gQ29tcHV0ZSByaWdodCBwYWRkaW5nIGZyb20gdGhlIHJpZ2h0bW9zdCBjaGlsZFxuICBjb25zdCByaWdodE1vc3QgPSBNYXRoLm1heCguLi5jaGlsZHJlbi5tYXAoYyA9PiBjLmFic29sdXRlQm91bmRpbmdCb3ghLnggKyBjLmFic29sdXRlQm91bmRpbmdCb3ghLndpZHRoKSk7XG4gIGNvbnN0IHBhZGRpbmdSaWdodCA9IChwYXJlbnRCb3VuZHMueCArIHBhcmVudEJvdW5kcy53aWR0aCkgLSByaWdodE1vc3Q7XG5cbiAgLy8gRXN0aW1hdGUgdmVydGljYWwgZ2FwIGZyb20gY29uc2VjdXRpdmUgY2hpbGRyZW5cbiAgbGV0IHRvdGFsR2FwID0gMDtcbiAgbGV0IGdhcENvdW50ID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBjb25zdCBjdXJyQm90dG9tID0gY2hpbGRyZW5baV0uYWJzb2x1dGVCb3VuZGluZ0JveCEueSArIGNoaWxkcmVuW2ldLmFic29sdXRlQm91bmRpbmdCb3ghLmhlaWdodDtcbiAgICBjb25zdCBuZXh0VG9wID0gY2hpbGRyZW5baSArIDFdLmFic29sdXRlQm91bmRpbmdCb3ghLnk7XG4gICAgY29uc3QgZ2FwID0gbmV4dFRvcCAtIGN1cnJCb3R0b207XG4gICAgaWYgKGdhcCA+IDApIHtcbiAgICAgIHRvdGFsR2FwICs9IGdhcDtcbiAgICAgIGdhcENvdW50Kys7XG4gICAgfVxuICB9XG4gIGNvbnN0IGF2Z0dhcCA9IGdhcENvdW50ID4gMCA/IE1hdGgucm91bmQodG90YWxHYXAgLyBnYXBDb3VudCkgOiAwO1xuXG4gIHJldHVybiB7XG4gICAgc3BhY2luZ1NvdXJjZTogJ2Fic29sdXRlLWNvb3JkaW5hdGVzJyxcbiAgICBzZWN0aW9uU3R5bGVzOiB7XG4gICAgICBwYWRkaW5nVG9wOiB0b0Nzc1ZhbHVlKE1hdGgubWF4KDAsIE1hdGgucm91bmQocGFkZGluZ1RvcCkpKSxcbiAgICAgIHBhZGRpbmdCb3R0b206IHRvQ3NzVmFsdWUoTWF0aC5tYXgoMCwgTWF0aC5yb3VuZChwYWRkaW5nQm90dG9tKSkpLFxuICAgICAgcGFkZGluZ0xlZnQ6IHRvQ3NzVmFsdWUoTWF0aC5tYXgoMCwgTWF0aC5yb3VuZChwYWRkaW5nTGVmdCkpKSxcbiAgICAgIHBhZGRpbmdSaWdodDogdG9Dc3NWYWx1ZShNYXRoLm1heCgwLCBNYXRoLnJvdW5kKHBhZGRpbmdSaWdodCkpKSxcbiAgICB9LFxuICAgIGl0ZW1TcGFjaW5nOiBhdmdHYXAgPiAwID8gdG9Dc3NWYWx1ZShhdmdHYXApIDogbnVsbCxcbiAgfTtcbn1cblxuLyoqXG4gKiBDb2xsZWN0IGFsbCBzcGFjaW5nIHZhbHVlcyB1c2VkIGluIGEgbm9kZSB0cmVlLlxuICogUmV0dXJucyBzb3J0ZWQgYXJyYXkgb2YgeyB2YWx1ZSwgY291bnQgfS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RTcGFjaW5nKHJvb3Q6IFNjZW5lTm9kZSk6IHsgdmFsdWU6IG51bWJlcjsgY291bnQ6IG51bWJlciB9W10ge1xuICBjb25zdCBzcGFjaW5nTWFwOiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+ID0ge307XG5cbiAgZnVuY3Rpb24gYWRkVmFsdWUodjogbnVtYmVyKSB7XG4gICAgaWYgKHYgPiAwICYmIHYgPCAxMDAwKSB7XG4gICAgICBjb25zdCByb3VuZGVkID0gTWF0aC5yb3VuZCh2KTtcbiAgICAgIHNwYWNpbmdNYXBbcm91bmRlZF0gPSAoc3BhY2luZ01hcFtyb3VuZGVkXSB8fCAwKSArIDE7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgaWYgKGZyYW1lLmxheW91dE1vZGUgJiYgZnJhbWUubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLnBhZGRpbmdUb3ApO1xuICAgICAgICBhZGRWYWx1ZShmcmFtZS5wYWRkaW5nQm90dG9tKTtcbiAgICAgICAgYWRkVmFsdWUoZnJhbWUucGFkZGluZ0xlZnQpO1xuICAgICAgICBhZGRWYWx1ZShmcmFtZS5wYWRkaW5nUmlnaHQpO1xuICAgICAgICBhZGRWYWx1ZShmcmFtZS5pdGVtU3BhY2luZyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3YWxrKHJvb3QpO1xuXG4gIHJldHVybiBPYmplY3QuZW50cmllcyhzcGFjaW5nTWFwKVxuICAgIC5tYXAoKFt2YWx1ZSwgY291bnRdKSA9PiAoeyB2YWx1ZTogTnVtYmVyKHZhbHVlKSwgY291bnQgfSkpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEudmFsdWUgLSBiLnZhbHVlKTtcbn1cbiIsICJpbXBvcnQgeyBHcmlkU3BlYyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgdG9Dc3NWYWx1ZSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIERldGVjdCB0aGUgZ3JpZC9sYXlvdXQgc3RydWN0dXJlIG9mIGEgZnJhbWUgYW5kIHJldHVybiBhIEdyaWRTcGVjLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0R3JpZChub2RlOiBGcmFtZU5vZGUpOiBHcmlkU3BlYyB7XG4gIC8vIEF1dG8tbGF5b3V0IGZyYW1lIFx1MjE5MiBmbGV4IG9yIGdyaWRcbiAgaWYgKG5vZGUubGF5b3V0TW9kZSAmJiBub2RlLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgIGNvbnN0IGlzV3JhcHBpbmcgPSAnbGF5b3V0V3JhcCcgaW4gbm9kZSAmJiAobm9kZSBhcyBhbnkpLmxheW91dFdyYXAgPT09ICdXUkFQJztcblxuICAgIGlmIChpc1dyYXBwaW5nKSB7XG4gICAgICAvLyBXcmFwcGluZyBhdXRvLWxheW91dCA9IGZsZXgtd3JhcCAoZ3JpZC1saWtlKVxuICAgICAgY29uc3QgY29sdW1ucyA9IGVzdGltYXRlQ29sdW1uc0Zyb21DaGlsZHJlbihub2RlKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxheW91dE1vZGU6ICdmbGV4JyxcbiAgICAgICAgY29sdW1ucyxcbiAgICAgICAgZ2FwOiB0b0Nzc1ZhbHVlKG5vZGUuaXRlbVNwYWNpbmcpLFxuICAgICAgICByb3dHYXA6ICdjb3VudGVyQXhpc1NwYWNpbmcnIGluIG5vZGUgPyB0b0Nzc1ZhbHVlKChub2RlIGFzIGFueSkuY291bnRlckF4aXNTcGFjaW5nKSA6IG51bGwsXG4gICAgICAgIGNvbHVtbkdhcDogbnVsbCxcbiAgICAgICAgaXRlbU1pbldpZHRoOiBlc3RpbWF0ZUl0ZW1NaW5XaWR0aChub2RlLCBjb2x1bW5zKSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gTm9uLXdyYXBwaW5nIGF1dG8tbGF5b3V0XG4gICAgY29uc3QgaXNIb3Jpem9udGFsID0gbm9kZS5sYXlvdXRNb2RlID09PSAnSE9SSVpPTlRBTCc7XG5cbiAgICBpZiAoaXNIb3Jpem9udGFsKSB7XG4gICAgICAvLyBIb3Jpem9udGFsIGxheW91dCBcdTIwMTQgY2hpbGRyZW4gYXJlIGNvbHVtbnNcbiAgICAgIGNvbnN0IGNvbHVtbnMgPSBub2RlLmNoaWxkcmVuLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UpLmxlbmd0aDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxheW91dE1vZGU6ICdmbGV4JyxcbiAgICAgICAgY29sdW1ucyxcbiAgICAgICAgZ2FwOiB0b0Nzc1ZhbHVlKG5vZGUuaXRlbVNwYWNpbmcpLFxuICAgICAgICByb3dHYXA6IG51bGwsXG4gICAgICAgIGNvbHVtbkdhcDogbnVsbCxcbiAgICAgICAgaXRlbU1pbldpZHRoOiBudWxsLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBWZXJ0aWNhbCBsYXlvdXQgXHUyMDE0IHNpbmdsZSBjb2x1bW4sIGNoaWxkcmVuIGFyZSByb3dzXG4gICAgLy8gQnV0IGNoZWNrIGlmIGFueSBkaXJlY3QgY2hpbGQgaXMgYSBob3Jpem9udGFsIGF1dG8tbGF5b3V0IChuZXN0ZWQgZ3JpZClcbiAgICBjb25zdCBob3Jpem9udGFsQ2hpbGQgPSBub2RlLmNoaWxkcmVuLmZpbmQoYyA9PlxuICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJykgJiZcbiAgICAgIChjIGFzIEZyYW1lTm9kZSkubGF5b3V0TW9kZSA9PT0gJ0hPUklaT05UQUwnXG4gICAgKSBhcyBGcmFtZU5vZGUgfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoaG9yaXpvbnRhbENoaWxkKSB7XG4gICAgICBjb25zdCBpbm5lckNvbHVtbnMgPSBob3Jpem9udGFsQ2hpbGQuY2hpbGRyZW4uZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSkubGVuZ3RoO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0TW9kZTogJ2ZsZXgnLFxuICAgICAgICBjb2x1bW5zOiBpbm5lckNvbHVtbnMsXG4gICAgICAgIGdhcDogdG9Dc3NWYWx1ZShob3Jpem9udGFsQ2hpbGQuaXRlbVNwYWNpbmcpLFxuICAgICAgICByb3dHYXA6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gICAgICAgIGNvbHVtbkdhcDogbnVsbCxcbiAgICAgICAgaXRlbU1pbldpZHRoOiBlc3RpbWF0ZUl0ZW1NaW5XaWR0aChob3Jpem9udGFsQ2hpbGQsIGlubmVyQ29sdW1ucyksXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBsYXlvdXRNb2RlOiAnZmxleCcsXG4gICAgICBjb2x1bW5zOiAxLFxuICAgICAgZ2FwOiB0b0Nzc1ZhbHVlKG5vZGUuaXRlbVNwYWNpbmcpLFxuICAgICAgcm93R2FwOiBudWxsLFxuICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgaXRlbU1pbldpZHRoOiBudWxsLFxuICAgIH07XG4gIH1cblxuICAvLyBObyBhdXRvLWxheW91dCBcdTIxOTIgYWJzb2x1dGUgcG9zaXRpb25pbmdcbiAgY29uc3QgY29sdW1ucyA9IGVzdGltYXRlQ29sdW1uc0Zyb21BYnNvbHV0ZUNoaWxkcmVuKG5vZGUpO1xuICByZXR1cm4ge1xuICAgIGxheW91dE1vZGU6ICdhYnNvbHV0ZScsXG4gICAgY29sdW1ucyxcbiAgICBnYXA6IGVzdGltYXRlR2FwRnJvbUFic29sdXRlQ2hpbGRyZW4obm9kZSksXG4gICAgcm93R2FwOiBudWxsLFxuICAgIGNvbHVtbkdhcDogbnVsbCxcbiAgICBpdGVtTWluV2lkdGg6IG51bGwsXG4gIH07XG59XG5cbi8qKlxuICogRXN0aW1hdGUgY29sdW1uIGNvdW50IGZyb20gd3JhcHBpbmcgYXV0by1sYXlvdXQgY2hpbGRyZW4uXG4gKiBDb3VudHMgaG93IG1hbnkgY2hpbGRyZW4gZml0IGluIHRoZSBmaXJzdCBcInJvd1wiIChzaW1pbGFyIFkgcG9zaXRpb24pLlxuICovXG5mdW5jdGlvbiBlc3RpbWF0ZUNvbHVtbnNGcm9tQ2hpbGRyZW4obm9kZTogRnJhbWVOb2RlKTogbnVtYmVyIHtcbiAgY29uc3QgdmlzaWJsZSA9IG5vZGUuY2hpbGRyZW4uZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSAmJiBjLmFic29sdXRlQm91bmRpbmdCb3gpO1xuICBpZiAodmlzaWJsZS5sZW5ndGggPD0gMSkgcmV0dXJuIDE7XG5cbiAgY29uc3QgZmlyc3RZID0gdmlzaWJsZVswXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55O1xuICBjb25zdCB0b2xlcmFuY2UgPSA1OyAvLyBweFxuICBsZXQgY29sdW1uc0luRmlyc3RSb3cgPSAwO1xuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgdmlzaWJsZSkge1xuICAgIGlmIChNYXRoLmFicyhjaGlsZC5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gZmlyc3RZKSA8PSB0b2xlcmFuY2UpIHtcbiAgICAgIGNvbHVtbnNJbkZpcnN0Um93Kys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBNYXRoLm1heCgxLCBjb2x1bW5zSW5GaXJzdFJvdyk7XG59XG5cbi8qKlxuICogRXN0aW1hdGUgY29sdW1uIGNvdW50IGZyb20gYWJzb2x1dGVseS1wb3NpdGlvbmVkIGNoaWxkcmVuLlxuICogR3JvdXBzIGNoaWxkcmVuIGJ5IFkgcG9zaXRpb24gKHNhbWUgcm93ID0gc2FtZSBZIFx1MDBCMSB0b2xlcmFuY2UpLlxuICovXG5mdW5jdGlvbiBlc3RpbWF0ZUNvbHVtbnNGcm9tQWJzb2x1dGVDaGlsZHJlbihub2RlOiBGcmFtZU5vZGUpOiBudW1iZXIge1xuICBjb25zdCB2aXNpYmxlID0gbm9kZS5jaGlsZHJlblxuICAgIC5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlICYmIGMuYWJzb2x1dGVCb3VuZGluZ0JveClcbiAgICAuc29ydCgoYSwgYikgPT4gYS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gYi5hYnNvbHV0ZUJvdW5kaW5nQm94IS55KTtcblxuICBpZiAodmlzaWJsZS5sZW5ndGggPD0gMSkgcmV0dXJuIDE7XG5cbiAgY29uc3QgZmlyc3RZID0gdmlzaWJsZVswXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55O1xuICBjb25zdCB0b2xlcmFuY2UgPSAxMDtcbiAgbGV0IGNvdW50ID0gMDtcblxuICBmb3IgKGNvbnN0IGNoaWxkIG9mIHZpc2libGUpIHtcbiAgICBpZiAoTWF0aC5hYnMoY2hpbGQuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGZpcnN0WSkgPD0gdG9sZXJhbmNlKSB7XG4gICAgICBjb3VudCsrO1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gTWF0aC5tYXgoMSwgY291bnQpO1xufVxuXG4vKipcbiAqIEVzdGltYXRlIGdhcCBiZXR3ZWVuIGFic29sdXRlbHktcG9zaXRpb25lZCBjaGlsZHJlbiBvbiB0aGUgc2FtZSByb3cuXG4gKi9cbmZ1bmN0aW9uIGVzdGltYXRlR2FwRnJvbUFic29sdXRlQ2hpbGRyZW4obm9kZTogRnJhbWVOb2RlKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHZpc2libGUgPSBub2RlLmNoaWxkcmVuXG4gICAgLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UgJiYgYy5hYnNvbHV0ZUJvdW5kaW5nQm94KVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnggLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLngpO1xuXG4gIGlmICh2aXNpYmxlLmxlbmd0aCA8IDIpIHJldHVybiBudWxsO1xuXG4gIC8vIFVzZSB0aGUgZmlyc3Qgcm93IG9mIGNoaWxkcmVuXG4gIGNvbnN0IGZpcnN0WSA9IHZpc2libGVbMF0uYWJzb2x1dGVCb3VuZGluZ0JveCEueTtcbiAgY29uc3QgdG9sZXJhbmNlID0gMTA7XG4gIGNvbnN0IGZpcnN0Um93ID0gdmlzaWJsZS5maWx0ZXIoYyA9PlxuICAgIE1hdGguYWJzKGMuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGZpcnN0WSkgPD0gdG9sZXJhbmNlXG4gICk7XG5cbiAgaWYgKGZpcnN0Um93Lmxlbmd0aCA8IDIpIHJldHVybiBudWxsO1xuXG4gIGxldCB0b3RhbEdhcCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZmlyc3RSb3cubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgY29uc3QgcmlnaHRFZGdlID0gZmlyc3RSb3dbaV0uYWJzb2x1dGVCb3VuZGluZ0JveCEueCArIGZpcnN0Um93W2ldLmFic29sdXRlQm91bmRpbmdCb3ghLndpZHRoO1xuICAgIGNvbnN0IG5leHRMZWZ0ID0gZmlyc3RSb3dbaSArIDFdLmFic29sdXRlQm91bmRpbmdCb3ghLng7XG4gICAgdG90YWxHYXAgKz0gbmV4dExlZnQgLSByaWdodEVkZ2U7XG4gIH1cblxuICBjb25zdCBhdmdHYXAgPSBNYXRoLnJvdW5kKHRvdGFsR2FwIC8gKGZpcnN0Um93Lmxlbmd0aCAtIDEpKTtcbiAgcmV0dXJuIGF2Z0dhcCA+IDAgPyB0b0Nzc1ZhbHVlKGF2Z0dhcCkgOiBudWxsO1xufVxuXG4vKipcbiAqIEVzdGltYXRlIG1pbmltdW0gaXRlbSB3aWR0aCBmcm9tIGEgaG9yaXpvbnRhbCBsYXlvdXQncyBjaGlsZHJlbi5cbiAqL1xuZnVuY3Rpb24gZXN0aW1hdGVJdGVtTWluV2lkdGgobm9kZTogRnJhbWVOb2RlLCBjb2x1bW5zOiBudW1iZXIpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKGNvbHVtbnMgPD0gMSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHZpc2libGUgPSBub2RlLmNoaWxkcmVuLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UgJiYgYy5hYnNvbHV0ZUJvdW5kaW5nQm94KTtcbiAgaWYgKHZpc2libGUubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCB3aWR0aHMgPSB2aXNpYmxlLm1hcChjID0+IGMuYWJzb2x1dGVCb3VuZGluZ0JveCEud2lkdGgpO1xuICBjb25zdCBtaW5XaWR0aCA9IE1hdGgubWluKC4uLndpZHRocyk7XG4gIHJldHVybiB0b0Nzc1ZhbHVlKE1hdGgucm91bmQobWluV2lkdGgpKTtcbn1cbiIsICJpbXBvcnQgeyBJbnRlcmFjdGlvblNwZWMgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHJnYlRvSGV4LCBleHRyYWN0QmFja2dyb3VuZENvbG9yIH0gZnJvbSAnLi9jb2xvcic7XG5pbXBvcnQgeyB0b0Nzc1ZhbHVlIH0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogTWFwIEZpZ21hIHRyaWdnZXIgdHlwZSB0byBvdXIgc2ltcGxpZmllZCB0cmlnZ2VyIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gbWFwVHJpZ2dlcih0cmlnZ2VyVHlwZTogc3RyaW5nKTogSW50ZXJhY3Rpb25TcGVjWyd0cmlnZ2VyJ10gfCBudWxsIHtcbiAgc3dpdGNoICh0cmlnZ2VyVHlwZSkge1xuICAgIGNhc2UgJ09OX0hPVkVSJzogcmV0dXJuICdob3Zlcic7XG4gICAgY2FzZSAnT05fQ0xJQ0snOiByZXR1cm4gJ2NsaWNrJztcbiAgICBjYXNlICdPTl9QUkVTUyc6IHJldHVybiAncHJlc3MnO1xuICAgIGNhc2UgJ01PVVNFX0VOVEVSJzogcmV0dXJuICdtb3VzZS1lbnRlcic7XG4gICAgY2FzZSAnTU9VU0VfTEVBVkUnOiByZXR1cm4gJ21vdXNlLWxlYXZlJztcbiAgICBkZWZhdWx0OiByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIE1hcCBGaWdtYSBlYXNpbmcgdHlwZSB0byBDU1MgdHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIG1hcEVhc2luZyhlYXNpbmc6IGFueSk6IHN0cmluZyB7XG4gIGlmICghZWFzaW5nKSByZXR1cm4gJ2Vhc2UnO1xuICBzd2l0Y2ggKGVhc2luZy50eXBlKSB7XG4gICAgY2FzZSAnRUFTRV9JTic6IHJldHVybiAnZWFzZS1pbic7XG4gICAgY2FzZSAnRUFTRV9PVVQnOiByZXR1cm4gJ2Vhc2Utb3V0JztcbiAgICBjYXNlICdFQVNFX0lOX0FORF9PVVQnOiByZXR1cm4gJ2Vhc2UtaW4tb3V0JztcbiAgICBjYXNlICdMSU5FQVInOiByZXR1cm4gJ2xpbmVhcic7XG4gICAgY2FzZSAnQ1VTVE9NX0NVQklDX0JFWklFUic6IHtcbiAgICAgIGNvbnN0IGIgPSBlYXNpbmcuZWFzaW5nRnVuY3Rpb25DdWJpY0JlemllcjtcbiAgICAgIGlmIChiKSByZXR1cm4gYGN1YmljLWJlemllcigke2IueDF9LCAke2IueTF9LCAke2IueDJ9LCAke2IueTJ9KWA7XG4gICAgICByZXR1cm4gJ2Vhc2UnO1xuICAgIH1cbiAgICBkZWZhdWx0OiByZXR1cm4gJ2Vhc2UnO1xuICB9XG59XG5cbi8qKlxuICogRGlmZiB0aGUgdmlzdWFsIHByb3BlcnRpZXMgYmV0d2VlbiBhIHNvdXJjZSBub2RlIGFuZCBhIGRlc3RpbmF0aW9uIG5vZGUuXG4gKiBSZXR1cm5zIGEgcmVjb3JkIG9mIENTUyBwcm9wZXJ0eSBjaGFuZ2VzLlxuICovXG5mdW5jdGlvbiBkaWZmTm9kZVN0eWxlcyhcbiAgc291cmNlOiBTY2VuZU5vZGUsXG4gIGRlc3Q6IFNjZW5lTm9kZVxuKTogUmVjb3JkPHN0cmluZywgeyBmcm9tOiBzdHJpbmc7IHRvOiBzdHJpbmcgfT4ge1xuICBjb25zdCBjaGFuZ2VzOiBSZWNvcmQ8c3RyaW5nLCB7IGZyb206IHN0cmluZzsgdG86IHN0cmluZyB9PiA9IHt9O1xuXG4gIC8vIEJhY2tncm91bmQgY29sb3JcbiAgY29uc3Qgc3JjQmcgPSBleHRyYWN0QmFja2dyb3VuZENvbG9yKHNvdXJjZSBhcyBhbnkpO1xuICBjb25zdCBkZXN0QmcgPSBleHRyYWN0QmFja2dyb3VuZENvbG9yKGRlc3QgYXMgYW55KTtcbiAgaWYgKHNyY0JnICYmIGRlc3RCZyAmJiBzcmNCZyAhPT0gZGVzdEJnKSB7XG4gICAgY2hhbmdlcy5iYWNrZ3JvdW5kQ29sb3IgPSB7IGZyb206IHNyY0JnLCB0bzogZGVzdEJnIH07XG4gIH1cblxuICAvLyBPcGFjaXR5XG4gIGlmICgnb3BhY2l0eScgaW4gc291cmNlICYmICdvcGFjaXR5JyBpbiBkZXN0KSB7XG4gICAgY29uc3Qgc3JjT3AgPSAoc291cmNlIGFzIGFueSkub3BhY2l0eTtcbiAgICBjb25zdCBkZXN0T3AgPSAoZGVzdCBhcyBhbnkpLm9wYWNpdHk7XG4gICAgaWYgKHNyY09wICE9PSB1bmRlZmluZWQgJiYgZGVzdE9wICE9PSB1bmRlZmluZWQgJiYgTWF0aC5hYnMoc3JjT3AgLSBkZXN0T3ApID4gMC4wMSkge1xuICAgICAgY2hhbmdlcy5vcGFjaXR5ID0geyBmcm9tOiBTdHJpbmcoc3JjT3ApLCB0bzogU3RyaW5nKGRlc3RPcCkgfTtcbiAgICB9XG4gIH1cblxuICAvLyBTaXplICh0cmFuc2Zvcm06IHNjYWxlKVxuICBpZiAoc291cmNlLmFic29sdXRlQm91bmRpbmdCb3ggJiYgZGVzdC5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgY29uc3Qgc3JjVyA9IHNvdXJjZS5hYnNvbHV0ZUJvdW5kaW5nQm94LndpZHRoO1xuICAgIGNvbnN0IGRlc3RXID0gZGVzdC5hYnNvbHV0ZUJvdW5kaW5nQm94LndpZHRoO1xuICAgIGlmIChzcmNXID4gMCAmJiBkZXN0VyA+IDApIHtcbiAgICAgIGNvbnN0IHNjYWxlWCA9IE1hdGgucm91bmQoKGRlc3RXIC8gc3JjVykgKiAxMDApIC8gMTAwO1xuICAgICAgaWYgKE1hdGguYWJzKHNjYWxlWCAtIDEpID4gMC4wMSkge1xuICAgICAgICBjaGFuZ2VzLnRyYW5zZm9ybSA9IHsgZnJvbTogJ3NjYWxlKDEpJywgdG86IGBzY2FsZSgke3NjYWxlWH0pYCB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEJvcmRlciByYWRpdXNcbiAgaWYgKCdjb3JuZXJSYWRpdXMnIGluIHNvdXJjZSAmJiAnY29ybmVyUmFkaXVzJyBpbiBkZXN0KSB7XG4gICAgY29uc3Qgc3JjUiA9IChzb3VyY2UgYXMgYW55KS5jb3JuZXJSYWRpdXM7XG4gICAgY29uc3QgZGVzdFIgPSAoZGVzdCBhcyBhbnkpLmNvcm5lclJhZGl1cztcbiAgICBpZiAodHlwZW9mIHNyY1IgPT09ICdudW1iZXInICYmIHR5cGVvZiBkZXN0UiA9PT0gJ251bWJlcicgJiYgc3JjUiAhPT0gZGVzdFIpIHtcbiAgICAgIGNoYW5nZXMuYm9yZGVyUmFkaXVzID0geyBmcm9tOiB0b0Nzc1ZhbHVlKHNyY1IpISwgdG86IHRvQ3NzVmFsdWUoZGVzdFIpISB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIEJveCBzaGFkb3cgKGVmZmVjdHMpXG4gIGlmICgnZWZmZWN0cycgaW4gc291cmNlICYmICdlZmZlY3RzJyBpbiBkZXN0KSB7XG4gICAgY29uc3Qgc3JjU2hhZG93ID0gZXh0cmFjdEJveFNoYWRvdyhzb3VyY2UgYXMgYW55KTtcbiAgICBjb25zdCBkZXN0U2hhZG93ID0gZXh0cmFjdEJveFNoYWRvdyhkZXN0IGFzIGFueSk7XG4gICAgaWYgKHNyY1NoYWRvdyAhPT0gZGVzdFNoYWRvdykge1xuICAgICAgY2hhbmdlcy5ib3hTaGFkb3cgPSB7IGZyb206IHNyY1NoYWRvdyB8fCAnbm9uZScsIHRvOiBkZXN0U2hhZG93IHx8ICdub25lJyB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIEJvcmRlciBjb2xvci93aWR0aCBmcm9tIHN0cm9rZXNcbiAgaWYgKCdzdHJva2VzJyBpbiBzb3VyY2UgJiYgJ3N0cm9rZXMnIGluIGRlc3QpIHtcbiAgICBjb25zdCBzcmNTdHJva2UgPSBleHRyYWN0U3Ryb2tlQ29sb3Ioc291cmNlIGFzIGFueSk7XG4gICAgY29uc3QgZGVzdFN0cm9rZSA9IGV4dHJhY3RTdHJva2VDb2xvcihkZXN0IGFzIGFueSk7XG4gICAgaWYgKHNyY1N0cm9rZSAmJiBkZXN0U3Ryb2tlICYmIHNyY1N0cm9rZSAhPT0gZGVzdFN0cm9rZSkge1xuICAgICAgY2hhbmdlcy5ib3JkZXJDb2xvciA9IHsgZnJvbTogc3JjU3Ryb2tlLCB0bzogZGVzdFN0cm9rZSB9O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjaGFuZ2VzO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgYm94LXNoYWRvdyBDU1MgdmFsdWUgZnJvbSBub2RlIGVmZmVjdHMuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RCb3hTaGFkb3cobm9kZTogeyBlZmZlY3RzPzogcmVhZG9ubHkgRWZmZWN0W10gfSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIW5vZGUuZWZmZWN0cykgcmV0dXJuIG51bGw7XG4gIGZvciAoY29uc3QgZWZmZWN0IG9mIG5vZGUuZWZmZWN0cykge1xuICAgIGlmIChlZmZlY3QudHlwZSA9PT0gJ0RST1BfU0hBRE9XJyAmJiBlZmZlY3QudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IHsgb2Zmc2V0LCByYWRpdXMsIHNwcmVhZCwgY29sb3IgfSA9IGVmZmVjdCBhcyBEcm9wU2hhZG93RWZmZWN0O1xuICAgICAgY29uc3QgaGV4ID0gcmdiVG9IZXgoY29sb3IpO1xuICAgICAgY29uc3QgYWxwaGEgPSBNYXRoLnJvdW5kKChjb2xvci5hIHx8IDEpICogMTAwKSAvIDEwMDtcbiAgICAgIHJldHVybiBgJHtvZmZzZXQueH1weCAke29mZnNldC55fXB4ICR7cmFkaXVzfXB4ICR7c3ByZWFkIHx8IDB9cHggcmdiYSgke01hdGgucm91bmQoY29sb3IuciAqIDI1NSl9LCAke01hdGgucm91bmQoY29sb3IuZyAqIDI1NSl9LCAke01hdGgucm91bmQoY29sb3IuYiAqIDI1NSl9LCAke2FscGhhfSlgO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHByaW1hcnkgc3Ryb2tlIGNvbG9yIGZyb20gYSBub2RlLlxuICovXG5mdW5jdGlvbiBleHRyYWN0U3Ryb2tlQ29sb3Iobm9kZTogeyBzdHJva2VzPzogcmVhZG9ubHkgUGFpbnRbXSB9KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghbm9kZS5zdHJva2VzKSByZXR1cm4gbnVsbDtcbiAgZm9yIChjb25zdCBzdHJva2Ugb2Ygbm9kZS5zdHJva2VzKSB7XG4gICAgaWYgKHN0cm9rZS50eXBlID09PSAnU09MSUQnICYmIHN0cm9rZS52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIHJnYlRvSGV4KHN0cm9rZS5jb2xvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgYWxsIHByb3RvdHlwZSBpbnRlcmFjdGlvbnMgZnJvbSBhIHNlY3Rpb24ncyBub2RlIHRyZWUuXG4gKiBXYWxrcyBhbGwgZGVzY2VuZGFudHMsIGZpbmRzIG5vZGVzIHdpdGggcmVhY3Rpb25zLCBhbmQgcHJvZHVjZXMgSW50ZXJhY3Rpb25TcGVjW10uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0SW50ZXJhY3Rpb25zKHNlY3Rpb25Sb290OiBTY2VuZU5vZGUpOiBJbnRlcmFjdGlvblNwZWNbXSB7XG4gIGNvbnN0IGludGVyYWN0aW9uczogSW50ZXJhY3Rpb25TcGVjW10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmICgncmVhY3Rpb25zJyBpbiBub2RlKSB7XG4gICAgICBjb25zdCByZWFjdGlvbnMgPSAobm9kZSBhcyBhbnkpLnJlYWN0aW9ucyBhcyBhbnlbXTtcbiAgICAgIGlmIChyZWFjdGlvbnMgJiYgcmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yIChjb25zdCByZWFjdGlvbiBvZiByZWFjdGlvbnMpIHtcbiAgICAgICAgICBjb25zdCB0cmlnZ2VyID0gbWFwVHJpZ2dlcihyZWFjdGlvbi50cmlnZ2VyPy50eXBlKTtcbiAgICAgICAgICBpZiAoIXRyaWdnZXIpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgY29uc3QgYWN0aW9uID0gcmVhY3Rpb24uYWN0aW9uIHx8IChyZWFjdGlvbi5hY3Rpb25zICYmIHJlYWN0aW9uLmFjdGlvbnNbMF0pO1xuICAgICAgICAgIGlmICghYWN0aW9uKSBjb250aW51ZTtcblxuICAgICAgICAgIC8vIEdldCB0cmFuc2l0aW9uIGRhdGFcbiAgICAgICAgICBjb25zdCB0cmFuc2l0aW9uID0gYWN0aW9uLnRyYW5zaXRpb247XG4gICAgICAgICAgY29uc3QgZHVyYXRpb24gPSB0cmFuc2l0aW9uPy5kdXJhdGlvbiA/IGAke3RyYW5zaXRpb24uZHVyYXRpb259c2AgOiAnMC4zcyc7XG4gICAgICAgICAgY29uc3QgZWFzaW5nID0gbWFwRWFzaW5nKHRyYW5zaXRpb24/LmVhc2luZyk7XG5cbiAgICAgICAgICAvLyBGb3IgaG92ZXIvY2xpY2sgd2l0aCBkZXN0aW5hdGlvbiBub2RlIFx1MjAxNCBkaWZmIHN0eWxlc1xuICAgICAgICAgIGlmIChhY3Rpb24uZGVzdGluYXRpb25JZCAmJiAodHJpZ2dlciA9PT0gJ2hvdmVyJyB8fCB0cmlnZ2VyID09PSAnbW91c2UtZW50ZXInIHx8IHRyaWdnZXIgPT09ICdjbGljaycpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBkZXN0Tm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKGFjdGlvbi5kZXN0aW5hdGlvbklkKTtcbiAgICAgICAgICAgICAgaWYgKGRlc3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHlDaGFuZ2VzID0gZGlmZk5vZGVTdHlsZXMobm9kZSwgZGVzdE5vZGUgYXMgU2NlbmVOb2RlKTtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMocHJvcGVydHlDaGFuZ2VzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnROYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGZpZ21hTm9kZUlkOiBub2RlLmlkLFxuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyLFxuICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiB7IGR1cmF0aW9uLCBlYXNpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlDaGFuZ2VzLFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgLy8gRGVzdGluYXRpb24gbm9kZSBub3QgYWNjZXNzaWJsZSAoZGlmZmVyZW50IHBhZ2UsIGV0Yy4pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdhbGsoc2VjdGlvblJvb3QpO1xuICByZXR1cm4gaW50ZXJhY3Rpb25zO1xufVxuIiwgImltcG9ydCB7IEZpZ21hVmFyaWFibGVzRXhwb3J0IH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyByZ2JUb0hleCB9IGZyb20gJy4vY29sb3InO1xuXG4vKipcbiAqIEV4dHJhY3QgRmlnbWEgVmFyaWFibGVzIChkZXNpZ24gdG9rZW5zKSBmcm9tIHRoZSBjdXJyZW50IGZpbGUuXG4gKlxuICogV2hlbiBhIGRlc2lnbmVyIGhhcyBzZXQgdXAgRmlnbWEgVmFyaWFibGVzIChjb2xvcnMsIG51bWJlcnMsIHN0cmluZ3MsXG4gKiBib29sZWFucykgdGhlIHZhcmlhYmxlIG5hbWVzIEFSRSB0aGUgZGVzaWduIHRva2VucyB0aGUgZGV2ZWxvcGVyIHNob3VsZFxuICogdXNlLiBXZSBleHBvcnQgdGhlbSBncm91cGVkIGJ5IGNvbGxlY3Rpb24gYW5kIGZsYXQgYnkgZnVsbCBuYW1lIHNvXG4gKiBhZ2VudHMgY2FuIGVtaXQgYC0tY2xyLXByaW1hcnlgIGluc3RlYWQgb2YgYC0tY2xyLTFjMWMxY2AuXG4gKlxuICogUmV0dXJucyBgeyBwcmVzZW50OiBmYWxzZSB9YCB3aGVuIHRoZSBGaWdtYSBWYXJpYWJsZXMgQVBJIGlzIHVuYXZhaWxhYmxlXG4gKiBvciBubyB2YXJpYWJsZXMgZXhpc3QuIEFnZW50cyBmYWxsIGJhY2sgdG8gYXV0by1nZW5lcmF0ZWQgbmFtZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VmFyaWFibGVzKCk6IEZpZ21hVmFyaWFibGVzRXhwb3J0IHtcbiAgY29uc3Qgb3V0OiBGaWdtYVZhcmlhYmxlc0V4cG9ydCA9IHtcbiAgICBjb2xsZWN0aW9uczoge30sXG4gICAgZmxhdDoge30sXG4gICAgcHJlc2VudDogZmFsc2UsXG4gIH07XG5cbiAgLy8gRmVhdHVyZS1kZXRlY3QgXHUyMDE0IG9sZGVyIEZpZ21hIGNsaWVudHMgZG9uJ3QgaGF2ZSB2YXJpYWJsZXMgQVBJXG4gIGlmICghZmlnbWEudmFyaWFibGVzIHx8IHR5cGVvZiBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgbGV0IGNvbGxlY3Rpb25zQnlJZDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICB0cnkge1xuICAgIGNvbnN0IGxvY2FsQ29sbGVjdGlvbnMgPSBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZUNvbGxlY3Rpb25zKCk7XG4gICAgZm9yIChjb25zdCBjb2wgb2YgbG9jYWxDb2xsZWN0aW9ucykge1xuICAgICAgY29sbGVjdGlvbnNCeUlkW2NvbC5pZF0gPSBjb2w7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgbGV0IHZhcmlhYmxlczogVmFyaWFibGVbXSA9IFtdO1xuICB0cnkge1xuICAgIHZhcmlhYmxlcyA9IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlcygpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gb3V0O1xuICB9XG4gIGlmICghdmFyaWFibGVzIHx8IHZhcmlhYmxlcy5sZW5ndGggPT09IDApIHJldHVybiBvdXQ7XG5cbiAgb3V0LnByZXNlbnQgPSB0cnVlO1xuXG4gIGZvciAoY29uc3QgdiBvZiB2YXJpYWJsZXMpIHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gY29sbGVjdGlvbnNCeUlkW3YudmFyaWFibGVDb2xsZWN0aW9uSWRdO1xuICAgIGlmICghY29sbGVjdGlvbikgY29udGludWU7XG5cbiAgICBjb25zdCBkZWZhdWx0TW9kZUlkID0gY29sbGVjdGlvbi5kZWZhdWx0TW9kZUlkO1xuICAgIGNvbnN0IHJhdyA9IHYudmFsdWVzQnlNb2RlW2RlZmF1bHRNb2RlSWRdO1xuICAgIGlmIChyYXcgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG5cbiAgICBsZXQgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XG4gICAgaWYgKHYucmVzb2x2ZWRUeXBlID09PSAnQ09MT1InKSB7XG4gICAgICAvLyBDT0xPUiB2YWx1ZXMgYXJlIFJHQkEgb2JqZWN0czsgY29udmVydCB0byBoZXhcbiAgICAgIGlmIChyYXcgJiYgdHlwZW9mIHJhdyA9PT0gJ29iamVjdCcgJiYgJ3InIGluIHJhdykge1xuICAgICAgICB2YWx1ZSA9IHJnYlRvSGV4KHJhdyBhcyBhbnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh2LnJlc29sdmVkVHlwZSA9PT0gJ0ZMT0FUJykge1xuICAgICAgdmFsdWUgPSB0eXBlb2YgcmF3ID09PSAnbnVtYmVyJyA/IHJhdyA6IE51bWJlcihyYXcpO1xuICAgIH0gZWxzZSBpZiAodi5yZXNvbHZlZFR5cGUgPT09ICdTVFJJTkcnKSB7XG4gICAgICB2YWx1ZSA9IHR5cGVvZiByYXcgPT09ICdzdHJpbmcnID8gcmF3IDogU3RyaW5nKHJhdyk7XG4gICAgfSBlbHNlIGlmICh2LnJlc29sdmVkVHlwZSA9PT0gJ0JPT0xFQU4nKSB7XG4gICAgICB2YWx1ZSA9IEJvb2xlYW4ocmF3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSBjb2xsZWN0aW9uLm5hbWUgfHwgJ0RlZmF1bHQnO1xuICAgIGlmICghb3V0LmNvbGxlY3Rpb25zW2NvbGxlY3Rpb25OYW1lXSkgb3V0LmNvbGxlY3Rpb25zW2NvbGxlY3Rpb25OYW1lXSA9IHt9O1xuICAgIG91dC5jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV1bdi5uYW1lXSA9IHZhbHVlO1xuXG4gICAgLy8gRmxhdCBrZXk6IFwiPGNvbGxlY3Rpb24+Lzx2YXJpYWJsZS1uYW1lPlwiIHNvIGR1cGxpY2F0ZXMgYWNyb3NzIGNvbGxlY3Rpb25zIGRvbid0IGNvbGxpZGVcbiAgICBjb25zdCBmbGF0S2V5ID0gYCR7Y29sbGVjdGlvbk5hbWV9LyR7di5uYW1lfWA7XG4gICAgb3V0LmZsYXRbZmxhdEtleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogTm9ybWFsaXplIGEgRmlnbWEgdmFyaWFibGUgbmFtZSB0byBhIENTUyBjdXN0b20gcHJvcGVydHkgbmFtZS5cbiAqICAgXCJDb2xvcnMvUHJpbWFyeVwiIFx1MjE5MiBcIi0tY2xyLXByaW1hcnlcIlxuICogICBcIlNwYWNpbmcvbWRcIiBcdTIxOTIgXCItLXNwYWNlLW1kXCJcbiAqICAgXCJSYWRpdXMvbGdcIiBcdTIxOTIgXCItLXJhZGl1cy1sZ1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0Nzc0N1c3RvbVByb3BlcnR5KHZhcmlhYmxlTmFtZTogc3RyaW5nLCBjb2xsZWN0aW9uTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY29sID0gY29sbGVjdGlvbk5hbWUudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgbmFtZSA9IHZhcmlhYmxlTmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1teYS16MC05XSsvZywgJy0nKS5yZXBsYWNlKC8tKy9nLCAnLScpLnJlcGxhY2UoL14tfC0kL2csICcnKTtcblxuICBpZiAoY29sLmluY2x1ZGVzKCdjb2xvcicpIHx8IGNvbC5pbmNsdWRlcygnY29sb3VyJykpIHJldHVybiBgLS1jbHItJHtuYW1lfWA7XG4gIGlmIChjb2wuaW5jbHVkZXMoJ3NwYWMnKSkgcmV0dXJuIGAtLXNwYWNlLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdyYWRpdXMnKSkgcmV0dXJuIGAtLXJhZGl1cy0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygnZm9udCcpICYmIGNvbC5pbmNsdWRlcygnc2l6ZScpKSByZXR1cm4gYC0tZnMtJHtuYW1lfWA7XG4gIGlmIChjb2wuaW5jbHVkZXMoJ2ZvbnQnKSAmJiBjb2wuaW5jbHVkZXMoJ3dlaWdodCcpKSByZXR1cm4gYC0tZnctJHtuYW1lfWA7XG4gIGlmIChjb2wuaW5jbHVkZXMoJ2ZvbnQnKSB8fCBjb2wuaW5jbHVkZXMoJ2ZhbWlseScpKSByZXR1cm4gYC0tZmYtJHtuYW1lfWA7XG4gIGlmIChjb2wuaW5jbHVkZXMoJ2xpbmUnKSkgcmV0dXJuIGAtLWxoLSR7bmFtZX1gO1xuICByZXR1cm4gYC0tJHtjb2wucmVwbGFjZSgvW15hLXowLTldKy9nLCAnLScpfS0ke25hbWV9YDtcbn1cbiIsICJpbXBvcnQge1xuICBDb21wb25lbnRQYXR0ZXJuLCBSZXBlYXRlckluZm8sIFJlcGVhdGVySXRlbSwgTmF2aWdhdGlvbkluZm8sIFNlY3Rpb25UeXBlLFxufSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHNsdWdpZnksIGlzRGVmYXVsdExheWVyTmFtZSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgaGFzSW1hZ2VGaWxsIH0gZnJvbSAnLi9jb2xvcic7XG5cbi8qKlxuICogQ29tcHV0ZSBhIGxvb3NlIFwic3RydWN0dXJlIGZpbmdlcnByaW50XCIgZm9yIGEgbm9kZS4gVHdvIGNoaWxkcmVuIHdpdGggdGhlXG4gKiBzYW1lIGZpbmdlcnByaW50IGFyZSB0cmVhdGVkIGFzIHNpYmxpbmdzIG9mIHRoZSBzYW1lIHJlcGVhdGVyIHRlbXBsYXRlXG4gKiAoc2FtZSBjYXJkIGxheW91dCByZXBlYXRlZCAzIHRpbWVzLCBldGMuKS4gV2UgZGVsaWJlcmF0ZWx5IGlnbm9yZSB0ZXh0XG4gKiBjb250ZW50IGFuZCBzcGVjaWZpYyBzaXplcyBzbyBtaW5vciB2YXJpYXRpb25zIHN0aWxsIG1hdGNoLlxuICovXG5mdW5jdGlvbiBzdHJ1Y3R1cmVGaW5nZXJwcmludChub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIgPSAwKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW2BUPSR7bm9kZS50eXBlfWBdO1xuICBpZiAoaGFzSW1hZ2VGaWxsKG5vZGUgYXMgYW55KSkgcGFydHMucHVzaCgnSU1HJyk7XG5cbiAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSAmJiBkZXB0aCA8IDIpIHtcbiAgICBjb25zdCBjaGlsZEZwczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZC52aXNpYmxlID09PSBmYWxzZSkgY29udGludWU7XG4gICAgICBjaGlsZEZwcy5wdXNoKHN0cnVjdHVyZUZpbmdlcnByaW50KGNoaWxkLCBkZXB0aCArIDEpKTtcbiAgICB9XG4gICAgY2hpbGRGcHMuc29ydCgpO1xuICAgIHBhcnRzLnB1c2goYEM9WyR7Y2hpbGRGcHMuam9pbignLCcpfV1gKTtcbiAgfVxuICByZXR1cm4gcGFydHMuam9pbignfCcpO1xufVxuXG5jb25zdCBSRVBFQVRFUl9OQU1FX0hJTlRTID0gL1xcYihjYXJkcz98aXRlbXM/fGxpc3R8Z3JpZHxmZWF0dXJlcz98c2VydmljZXM/fHRlYW18bG9nb3M/fHRlc3RpbW9uaWFscz98cHJpY2luZ3xwbGFucz98YXJ0aWNsZXM/fHBvc3RzP3xibG9nfGZhcXM/KVxcYi9pO1xuXG4vKipcbiAqIERldGVjdCByZXBlYXRlciBncm91cHMgaW5zaWRlIGEgc2VjdGlvbi4gQ29uc2VydmF0aXZlOlxuICogICAtIFx1MjI2NTMgY2hpbGRyZW4gc2hhcmUgYSBmaW5nZXJwcmludCwgT1JcbiAqICAgLSBcdTIyNjUyIGNoaWxkcmVuIHNoYXJlIGEgZmluZ2VycHJpbnQgQU5EIHRoZSBwYXJlbnQgbmFtZSBoaW50cyByZXBldGl0aW9uXG4gKiAgICAgQU5EIHRoZSBtYXRjaGluZyBncm91cCBjb3ZlcnMgXHUyMjY1NjAlIG9mIHZpc2libGUgY2hpbGRyZW4uXG4gKlxuICogVGhlIGV4aXN0aW5nIGBlbGVtZW50c2AgbWFwIGlzIHVudG91Y2hlZCBcdTIwMTQgcmVwZWF0ZXJzIGFyZSBhbiBhZGRpdGl2ZVxuICogc2lnbmFsIHRoZSBhZ2VudCBjYW4gb3B0IGludG8gZm9yIGNsZWFuZXIgQUNGIFJlcGVhdGVyIG91dHB1dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdFJlcGVhdGVycyhzZWN0aW9uTm9kZTogU2NlbmVOb2RlKTogUmVjb3JkPHN0cmluZywgUmVwZWF0ZXJJbmZvPiB7XG4gIGNvbnN0IHJlcGVhdGVyczogUmVjb3JkPHN0cmluZywgUmVwZWF0ZXJJbmZvPiA9IHt9O1xuICBjb25zdCB1c2VkS2V5cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZ1bmN0aW9uIGtleUZvcihjb250YWluZXJOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJhc2UgPSBjb250YWluZXJOYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpXG4gICAgICB8fCBgcmVwZWF0ZXJfJHtPYmplY3Qua2V5cyhyZXBlYXRlcnMpLmxlbmd0aCArIDF9YDtcbiAgICBpZiAoIXVzZWRLZXlzLmhhcyhiYXNlKSkge1xuICAgICAgdXNlZEtleXMuYWRkKGJhc2UpO1xuICAgICAgcmV0dXJuIGJhc2U7XG4gICAgfVxuICAgIGxldCBpID0gMjtcbiAgICB3aGlsZSAodXNlZEtleXMuaGFzKGAke2Jhc2V9XyR7aX1gKSkgaSsrO1xuICAgIHVzZWRLZXlzLmFkZChgJHtiYXNlfV8ke2l9YCk7XG4gICAgcmV0dXJuIGAke2Jhc2V9XyR7aX1gO1xuICB9XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBpZiAoZGVwdGggPiA1KSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKCEoJ2NoaWxkcmVuJyBpbiBub2RlKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgY29uc3Qga2lkcyA9IChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4uZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSk7XG4gICAgaWYgKGtpZHMubGVuZ3RoID49IDIpIHtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IG5ldyBNYXA8c3RyaW5nLCBTY2VuZU5vZGVbXT4oKTtcbiAgICAgIGZvciAoY29uc3QgayBvZiBraWRzKSB7XG4gICAgICAgIGNvbnN0IGZwID0gc3RydWN0dXJlRmluZ2VycHJpbnQoayk7XG4gICAgICAgIGlmICghZ3JvdXBzLmhhcyhmcCkpIGdyb3Vwcy5zZXQoZnAsIFtdKTtcbiAgICAgICAgZ3JvdXBzLmdldChmcCkhLnB1c2goayk7XG4gICAgICB9XG4gICAgICBsZXQgYmVzdEdyb3VwOiBTY2VuZU5vZGVbXSB8IG51bGwgPSBudWxsO1xuICAgICAgZm9yIChjb25zdCBnIG9mIGdyb3Vwcy52YWx1ZXMoKSkge1xuICAgICAgICBpZiAoIWJlc3RHcm91cCB8fCBnLmxlbmd0aCA+IGJlc3RHcm91cC5sZW5ndGgpIGJlc3RHcm91cCA9IGc7XG4gICAgICB9XG4gICAgICBpZiAoYmVzdEdyb3VwICYmIGJlc3RHcm91cC5sZW5ndGggPj0gMikge1xuICAgICAgICBjb25zdCBpc0JpZ0dyb3VwID0gYmVzdEdyb3VwLmxlbmd0aCA+PSAzO1xuICAgICAgICBjb25zdCBoaW50TWF0Y2ggPSBSRVBFQVRFUl9OQU1FX0hJTlRTLnRlc3Qobm9kZS5uYW1lIHx8ICcnKTtcbiAgICAgICAgY29uc3QgZG9taW5hdGVzID0gYmVzdEdyb3VwLmxlbmd0aCA+PSBNYXRoLmNlaWwoa2lkcy5sZW5ndGggKiAwLjYpO1xuICAgICAgICBpZiAoaXNCaWdHcm91cCB8fCAoaGludE1hdGNoICYmIGRvbWluYXRlcykpIHtcbiAgICAgICAgICBjb25zdCBrZXkgPSBrZXlGb3Iobm9kZS5uYW1lIHx8ICdyZXBlYXRlcicpO1xuICAgICAgICAgIHJlcGVhdGVyc1trZXldID0ge1xuICAgICAgICAgICAgY29udGFpbmVyTGF5ZXJOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICBpdGVtQ291bnQ6IGJlc3RHcm91cC5sZW5ndGgsXG4gICAgICAgICAgICB0ZW1wbGF0ZUxheWVyTmFtZTogYmVzdEdyb3VwWzBdLm5hbWUsXG4gICAgICAgICAgICBpdGVtczogYmVzdEdyb3VwLm1hcChleHRyYWN0UmVwZWF0ZXJJdGVtKSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBEb24ndCByZWN1cnNlIGludG8gcmVwZWF0ZXIgY2hpbGRyZW5cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgYyBvZiBraWRzKSB3YWxrKGMsIGRlcHRoICsgMSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKCdjaGlsZHJlbicgaW4gc2VjdGlvbk5vZGUpIHtcbiAgICBmb3IgKGNvbnN0IGMgb2YgKHNlY3Rpb25Ob2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjLnZpc2libGUgIT09IGZhbHNlKSB3YWxrKGMsIDApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVwZWF0ZXJzO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0UmVwZWF0ZXJJdGVtKG5vZGU6IFNjZW5lTm9kZSk6IFJlcGVhdGVySXRlbSB7XG4gIGNvbnN0IGl0ZW06IFJlcGVhdGVySXRlbSA9IHsgdGV4dHM6IHt9IH07XG4gIGxldCB0ZXh0SW5kZXggPSAwO1xuICBsZXQgZmlyc3RJbWFnZU5hbWU6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBsZXQgZmlyc3RJbWFnZUFsdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgZnVuY3Rpb24gd2FsayhuOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobi52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgaWYgKG4udHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCB0ID0gbiBhcyBUZXh0Tm9kZTtcbiAgICAgIGNvbnN0IGNsZWFuID0gKHQubmFtZSB8fCAnJykudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBjb25zdCByb2xlID0gY2xlYW4gJiYgIS9eKHRleHR8ZnJhbWV8Z3JvdXB8cmVjdGFuZ2xlKVxcZCokLy50ZXN0KGNsZWFuKVxuICAgICAgICA/IGNsZWFuIDogYHRleHRfJHt0ZXh0SW5kZXh9YDtcbiAgICAgIGlmICh0LmNoYXJhY3RlcnMpIGl0ZW0udGV4dHNbcm9sZV0gPSB0LmNoYXJhY3RlcnM7XG4gICAgICB0ZXh0SW5kZXgrKztcbiAgICB9XG5cbiAgICBpZiAoIWZpcnN0SW1hZ2VOYW1lICYmIGhhc0ltYWdlRmlsbChuIGFzIGFueSkpIHtcbiAgICAgIGZpcnN0SW1hZ2VOYW1lID0gYCR7c2x1Z2lmeShuLm5hbWUgfHwgJ2ltYWdlJyl9LnBuZ2A7XG4gICAgICBpZiAobi5uYW1lICYmICFpc0RlZmF1bHRMYXllck5hbWUobi5uYW1lKSkge1xuICAgICAgICBmaXJzdEltYWdlQWx0ID0gbi5uYW1lLnJlcGxhY2UoL1stX10vZywgJyAnKS5yZXBsYWNlKC9cXHMrL2csICcgJykudHJpbSgpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcYlxcdy9nLCBjID0+IGMudG9VcHBlckNhc2UoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFpdGVtLmxpbmtVcmwgJiYgJ3JlYWN0aW9ucycgaW4gbikge1xuICAgICAgY29uc3QgcmVhY3Rpb25zID0gKG4gYXMgYW55KS5yZWFjdGlvbnM7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyZWFjdGlvbnMpKSB7XG4gICAgICAgIG91dGVyOiBmb3IgKGNvbnN0IHIgb2YgcmVhY3Rpb25zKSB7XG4gICAgICAgICAgY29uc3QgYWN0aW9ucyA9IHIuYWN0aW9ucyB8fCAoci5hY3Rpb24gPyBbci5hY3Rpb25dIDogW10pO1xuICAgICAgICAgIGZvciAoY29uc3QgYSBvZiBhY3Rpb25zKSB7XG4gICAgICAgICAgICBpZiAoYSAmJiBhLnR5cGUgPT09ICdVUkwnICYmIGEudXJsKSB7IGl0ZW0ubGlua1VybCA9IGEudXJsOyBicmVhayBvdXRlcjsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICgnY2hpbGRyZW4nIGluIG4pIHtcbiAgICAgIGZvciAoY29uc3QgYyBvZiAobiBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB3YWxrKGMpO1xuICAgIH1cbiAgfVxuICB3YWxrKG5vZGUpO1xuICBpZiAoZmlyc3RJbWFnZU5hbWUpIGl0ZW0uaW1hZ2VGaWxlID0gZmlyc3RJbWFnZU5hbWU7XG4gIGlmIChmaXJzdEltYWdlQWx0KSBpdGVtLmFsdCA9IGZpcnN0SW1hZ2VBbHQ7XG4gIHJldHVybiBpdGVtO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIENvbXBvbmVudCBwYXR0ZXJuczogY2Fyb3VzZWwgLyBhY2NvcmRpb24gLyB0YWJzIC8gbW9kYWxcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jb25zdCBDQVJPVVNFTF9SWCA9IC9cXGIoY2Fyb3VzZWx8c2xpZGVyfHN3aXBlcnxnYWxsZXJ5fHNsaWRlc2hvdylcXGIvaTtcbmNvbnN0IEFDQ09SRElPTl9SWCA9IC9cXGIoYWNjb3JkaW9ufGZhcXxjb2xsYXBzZXxleHBhbmRlcnxjb2xsYXBzaWJsZSlcXGIvaTtcbmNvbnN0IFRBQlNfUlggPSAvXFxidGFicz9cXGIvaTtcbmNvbnN0IE1PREFMX1JYID0gL1xcYihtb2RhbHxwb3B1cHxkaWFsb2d8b3ZlcmxheXxsaWdodGJveClcXGIvaTtcblxuLyoqXG4gKiBEZXRlY3QgaW50ZXJhY3RpdmUgY29tcG9uZW50IHBhdHRlcm5zLiBXZSBmYXZvdXIgZXhwbGljaXQgbGF5ZXItbmFtZVxuICogbWF0Y2hlcyBvdmVyIHB1cmUgc3RydWN0dXJhbCBkZXRlY3Rpb24gdG8ga2VlcCBmYWxzZSBwb3NpdGl2ZXMgbG93LlxuICogV2hlbiB0aGUgbmFtZSBtYXRjaGVzLCBjb25maWRlbmNlIGlzICdoaWdoJzsgd2hlbiBpbmZlcnJlZCBzdHJ1Y3R1cmFsbHksXG4gKiBjb25maWRlbmNlIGlzICdsb3cnIGFuZCB0aGUgYWdlbnQgc2hvdWxkIHZlcmlmeSBhZ2FpbnN0IHRoZSBzY3JlZW5zaG90LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q29tcG9uZW50UGF0dGVybnMoc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSk6IENvbXBvbmVudFBhdHRlcm5bXSB7XG4gIGNvbnN0IHBhdHRlcm5zOiBDb21wb25lbnRQYXR0ZXJuW10gPSBbXTtcbiAgY29uc3Qgc2Vlbk5vZGVJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmdW5jdGlvbiBhZGRQYXR0ZXJuKHA6IENvbXBvbmVudFBhdHRlcm4pIHtcbiAgICBpZiAoc2Vlbk5vZGVJZHMuaGFzKHAucm9vdE5vZGVJZCkpIHJldHVybjtcbiAgICBzZWVuTm9kZUlkcy5hZGQocC5yb290Tm9kZUlkKTtcbiAgICBwYXR0ZXJucy5wdXNoKHApO1xuICB9XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIpIHtcbiAgICBpZiAoZGVwdGggPiA2IHx8IG5vZGUudmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICBjb25zdCBuYW1lID0gbm9kZS5uYW1lIHx8ICcnO1xuXG4gICAgLy8gTU9EQUwgXHUyMDE0IG5hbWUtb25seSBkZXRlY3Rpb24gKHN0cnVjdHVyYWwgZGV0ZWN0aW9uIGlzIHRvbyBub2lzeSkuXG4gICAgaWYgKE1PREFMX1JYLnRlc3QobmFtZSkgJiYgJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBhZGRQYXR0ZXJuKHtcbiAgICAgICAgdHlwZTogJ21vZGFsJyxcbiAgICAgICAgcm9vdE5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgcm9vdE5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgIGNvbmZpZGVuY2U6ICdoaWdoJyxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuOyAvLyBkb24ndCByZWN1cnNlIGludG8gbW9kYWwgaW50ZXJuYWxzXG4gICAgfVxuXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgY29uc3QgZnJhbWUgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgIGNvbnN0IGtpZHMgPSBmcmFtZS5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlKTtcblxuICAgICAgLy8gQ0FST1VTRUw6IGV4cGxpY2l0IG5hbWUgT1IgKGhvcml6b250YWwgKyBjbGlwc0NvbnRlbnQgKyBcdTIyNjUzIHNpbWlsYXIgY2hpbGRyZW4pXG4gICAgICBjb25zdCBuYW1lQ2Fyb3VzZWwgPSBDQVJPVVNFTF9SWC50ZXN0KG5hbWUpO1xuICAgICAgY29uc3QgaG9yaXpvbnRhbENsaXBwZWQgPSBmcmFtZS5sYXlvdXRNb2RlID09PSAnSE9SSVpPTlRBTCcgJiYgZnJhbWUuY2xpcHNDb250ZW50ID09PSB0cnVlO1xuICAgICAgaWYgKG5hbWVDYXJvdXNlbCB8fCBob3Jpem9udGFsQ2xpcHBlZCkge1xuICAgICAgICBpZiAoa2lkcy5sZW5ndGggPj0gMykge1xuICAgICAgICAgIGNvbnN0IGZwMCA9IHN0cnVjdHVyZUZpbmdlcnByaW50KGtpZHNbMF0pO1xuICAgICAgICAgIGNvbnN0IG1hdGNoaW5nID0ga2lkcy5maWx0ZXIoayA9PiBzdHJ1Y3R1cmVGaW5nZXJwcmludChrKSA9PT0gZnAwKS5sZW5ndGg7XG4gICAgICAgICAgaWYgKG1hdGNoaW5nID49IDMpIHtcbiAgICAgICAgICAgIGFkZFBhdHRlcm4oe1xuICAgICAgICAgICAgICB0eXBlOiAnY2Fyb3VzZWwnLFxuICAgICAgICAgICAgICByb290Tm9kZUlkOiBub2RlLmlkLFxuICAgICAgICAgICAgICByb290Tm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgaXRlbUNvdW50OiBtYXRjaGluZyxcbiAgICAgICAgICAgICAgY29uZmlkZW5jZTogbmFtZUNhcm91c2VsID8gJ2hpZ2gnIDogJ2xvdycsXG4gICAgICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgICAgICBsYXlvdXRNb2RlOiBmcmFtZS5sYXlvdXRNb2RlLFxuICAgICAgICAgICAgICAgIGNsaXBzQ29udGVudDogZnJhbWUuY2xpcHNDb250ZW50LFxuICAgICAgICAgICAgICAgIGl0ZW1TcGFjaW5nOiBmcmFtZS5pdGVtU3BhY2luZyA/PyBudWxsLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFDQ09SRElPTjogbmFtZSBtYXRjaCArIFx1MjI2NTIgY2hpbGQgaXRlbXNcbiAgICAgIGlmIChBQ0NPUkRJT05fUlgudGVzdChuYW1lKSAmJiBraWRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgIGNvbnN0IGl0ZW1zOiBBcnJheTx7IHF1ZXN0aW9uOiBzdHJpbmc7IGFuc3dlcj86IHN0cmluZyB9PiA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGsgb2Yga2lkcykge1xuICAgICAgICAgIGNvbnN0IGFsbCA9IGNvbGxlY3RBbGxUZXh0KGspO1xuICAgICAgICAgIGlmIChhbGwubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaXRlbXMucHVzaCh7IHF1ZXN0aW9uOiBhbGxbMF0sIGFuc3dlcjogYWxsLnNsaWNlKDEpLmpvaW4oJyAnKSB8fCB1bmRlZmluZWQgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChpdGVtcy5sZW5ndGggPj0gMikge1xuICAgICAgICAgIGFkZFBhdHRlcm4oe1xuICAgICAgICAgICAgdHlwZTogJ2FjY29yZGlvbicsXG4gICAgICAgICAgICByb290Tm9kZUlkOiBub2RlLmlkLFxuICAgICAgICAgICAgcm9vdE5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICBpdGVtQ291bnQ6IGl0ZW1zLmxlbmd0aCxcbiAgICAgICAgICAgIGNvbmZpZGVuY2U6ICdoaWdoJyxcbiAgICAgICAgICAgIG1ldGE6IHsgaXRlbXMgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVEFCUzogbmFtZSBtYXRjaCArIFx1MjI2NTIgY2hpbGRyZW5cbiAgICAgIGlmIChUQUJTX1JYLnRlc3QobmFtZSkgJiYga2lkcy5sZW5ndGggPj0gMikge1xuICAgICAgICBhZGRQYXR0ZXJuKHtcbiAgICAgICAgICB0eXBlOiAndGFicycsXG4gICAgICAgICAgcm9vdE5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICByb290Tm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICBpdGVtQ291bnQ6IGtpZHMubGVuZ3RoLFxuICAgICAgICAgIGNvbmZpZGVuY2U6ICdoaWdoJyxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBjIG9mIGtpZHMpIHdhbGsoYywgZGVwdGggKyAxKTtcbiAgICB9XG4gIH1cblxuICB3YWxrKHNlY3Rpb25Ob2RlLCAwKTtcbiAgcmV0dXJuIHBhdHRlcm5zO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0QWxsVGV4dChub2RlOiBTY2VuZU5vZGUpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgZnVuY3Rpb24gd2FsayhuOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobi52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIGlmIChuLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgY2hhcnMgPSAoKG4gYXMgVGV4dE5vZGUpLmNoYXJhY3RlcnMgfHwgJycpLnRyaW0oKTtcbiAgICAgIGlmIChjaGFycykgb3V0LnB1c2goY2hhcnMpO1xuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgICBmb3IgKGNvbnN0IGMgb2YgKG4gYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikgd2FsayhjKTtcbiAgICB9XG4gIH1cbiAgd2Fsayhub2RlKTtcbiAgcmV0dXJuIG91dDtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBOYXZpZ2F0aW9uIGV4dHJhY3Rpb25cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4vKipcbiAqIERldGVjdCBuYXZpZ2F0aW9uIGxpbmtzIGluc2lkZSBhIHNlY3Rpb24gXHUyMDE0IHNob3J0IHRleHQgbm9kZXMgdGhhdCBsb29rXG4gKiBsaWtlIG1lbnUgaXRlbXMgKFx1MjI2NDQwIGNoYXJzLCBmb250IHNpemUgXHUyMjY0MjJweCkuIFJldHVybnMgbnVsbCB3aGVuIHRoZXJlXG4gKiBhcmUgZmV3ZXIgdGhhbiAyIHN1Y2ggbGlua3MgKG9uZSBsaW5rIGlzbid0IGEgbWVudSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3ROYXZpZ2F0aW9uKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUpOiBOYXZpZ2F0aW9uSW5mbyB8IG51bGwge1xuICBjb25zdCBsaW5rczogQXJyYXk8eyBsYWJlbDogc3RyaW5nOyBocmVmPzogc3RyaW5nIHwgbnVsbCB9PiA9IFtdO1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIpIHtcbiAgICBpZiAoZGVwdGggPiA2IHx8IG5vZGUudmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIGNvbnN0IHQgPSBub2RlIGFzIFRleHROb2RlO1xuICAgICAgY29uc3QgdGV4dCA9ICh0LmNoYXJhY3RlcnMgfHwgJycpLnRyaW0oKTtcbiAgICAgIGlmICghdGV4dCB8fCB0ZXh0Lmxlbmd0aCA+IDQwKSByZXR1cm47XG4gICAgICBjb25zdCBmcyA9IHQuZm9udFNpemUgIT09IGZpZ21hLm1peGVkID8gKHQuZm9udFNpemUgYXMgbnVtYmVyKSA6IDE2O1xuICAgICAgaWYgKGZzID4gMjIpIHJldHVybjtcbiAgICAgIGlmIChzZWVuLmhhcyh0ZXh0LnRvTG93ZXJDYXNlKCkpKSByZXR1cm47XG4gICAgICBzZWVuLmFkZCh0ZXh0LnRvTG93ZXJDYXNlKCkpO1xuXG4gICAgICBsZXQgaHJlZjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICBjb25zdCByZWFjdGlvbnMgPSAodCBhcyBhbnkpLnJlYWN0aW9ucztcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlYWN0aW9ucykpIHtcbiAgICAgICAgb3V0ZXI6IGZvciAoY29uc3QgciBvZiByZWFjdGlvbnMpIHtcbiAgICAgICAgICBjb25zdCBhY3Rpb25zID0gci5hY3Rpb25zIHx8IChyLmFjdGlvbiA/IFtyLmFjdGlvbl0gOiBbXSk7XG4gICAgICAgICAgZm9yIChjb25zdCBhIG9mIGFjdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChhICYmIGEudHlwZSA9PT0gJ1VSTCcgJiYgYS51cmwpIHsgaHJlZiA9IGEudXJsOyBicmVhayBvdXRlcjsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGlua3MucHVzaCh7IGxhYmVsOiB0ZXh0LCBocmVmIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGMgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikgd2FsayhjLCBkZXB0aCArIDEpO1xuICAgIH1cbiAgfVxuICB3YWxrKHNlY3Rpb25Ob2RlLCAwKTtcbiAgaWYgKGxpbmtzLmxlbmd0aCA8IDIpIHJldHVybiBudWxsO1xuICByZXR1cm4geyBsaW5rcyB9O1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIFNlY3Rpb24gc2VtYW50aWMgcm9sZVxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmludGVyZmFjZSBJbmZlclR5cGVQYXJhbXMge1xuICBzZWN0aW9uSW5kZXg6IG51bWJlcjtcbiAgdG90YWxTZWN0aW9uczogbnVtYmVyO1xuICBpc0Zvcm1TZWN0aW9uOiBib29sZWFuO1xuICBwYXR0ZXJuczogQ29tcG9uZW50UGF0dGVybltdO1xuICByZXBlYXRlcnM6IFJlY29yZDxzdHJpbmcsIFJlcGVhdGVySW5mbz47XG4gIGVsZW1lbnRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgdGV4dENvbnRlbnRJbk9yZGVyOiBBcnJheTx7IHRleHQ6IHN0cmluZzsgZm9udFNpemU6IG51bWJlcjsgcm9sZTogc3RyaW5nIH0+O1xuICBsYXllck5hbWU6IHN0cmluZztcbiAgc2VjdGlvbkhlaWdodDogbnVtYmVyO1xuICBpc0dsb2JhbD86IGJvb2xlYW47XG4gIGdsb2JhbFJvbGU/OiAnaGVhZGVyJyB8ICdmb290ZXInIHwgbnVsbDtcbn1cblxuLyoqXG4gKiBJbmZlciB0aGUgc2VtYW50aWMgdHlwZSBvZiBhIHNlY3Rpb24uIFB1cmUgaW5mZXJlbmNlIFx1MjAxNCByZXR1cm5zICdnZW5lcmljJ1xuICogKyAnbG93JyBjb25maWRlbmNlIHdoZW4gbm90aGluZyBtYXRjaGVzIGNsZWFybHkuIFRoZSBhZ2VudCBzaG91bGQgdHJlYXRcbiAqICdoaWdoJyBjb25maWRlbmNlIGFzIGF1dGhvcml0YXRpdmUgYW5kICdsb3cnIGFzIGEgaGludCBvbmx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5mZXJTZWN0aW9uVHlwZShwOiBJbmZlclR5cGVQYXJhbXMpOiB7IHR5cGU6IFNlY3Rpb25UeXBlOyBjb25maWRlbmNlOiAnaGlnaCcgfCAnbG93JyB9IHtcbiAgLy8gR2xvYmFsIGhlYWRlci9mb290ZXIgb3ZlcnJpZGVzIGV2ZXJ5dGhpbmdcbiAgaWYgKHAuaXNHbG9iYWwgJiYgcC5nbG9iYWxSb2xlID09PSAnaGVhZGVyJykgcmV0dXJuIHsgdHlwZTogJ2hlYWRlcicsIGNvbmZpZGVuY2U6ICdoaWdoJyB9O1xuICBpZiAocC5pc0dsb2JhbCAmJiBwLmdsb2JhbFJvbGUgPT09ICdmb290ZXInKSByZXR1cm4geyB0eXBlOiAnZm9vdGVyJywgY29uZmlkZW5jZTogJ2hpZ2gnIH07XG5cbiAgY29uc3QgbmFtZSA9IChwLmxheWVyTmFtZSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgZXhwbGljaXQ6IEFycmF5PHsgcng6IFJlZ0V4cDsgdHlwZTogU2VjdGlvblR5cGUgfT4gPSBbXG4gICAgeyByeDogL1xcYmhlcm9cXGIvLCB0eXBlOiAnaGVybycgfSxcbiAgICB7IHJ4OiAvXFxiKGZlYXR1cmVzP3xiZW5lZml0cz98c2VydmljZXM/KVxcYi8sIHR5cGU6ICdmZWF0dXJlcycgfSxcbiAgICB7IHJ4OiAvXFxidGVzdGltb25pYWxzP1xcYi8sIHR5cGU6ICd0ZXN0aW1vbmlhbHMnIH0sXG4gICAgeyByeDogL1xcYihjdGF8Y2FsbFstIF0/dG9bLSBdP2FjdGlvbilcXGIvLCB0eXBlOiAnY3RhJyB9LFxuICAgIHsgcng6IC9cXGIoZmFxcz98ZnJlcXVlbnRseVstIF1hc2tlZClcXGIvLCB0eXBlOiAnZmFxJyB9LFxuICAgIHsgcng6IC9cXGIocHJpY2luZ3xwbGFucz8pXFxiLywgdHlwZTogJ3ByaWNpbmcnIH0sXG4gICAgeyByeDogL1xcYmNvbnRhY3RcXGIvLCB0eXBlOiAnY29udGFjdCcgfSxcbiAgICB7IHJ4OiAvXFxiKGxvZ29zP3xjbGllbnRzP3xwYXJ0bmVycz98YnJhbmRzPylcXGIvLCB0eXBlOiAnbG9nb3MnIH0sXG4gICAgeyByeDogL1xcYmZvb3RlclxcYi8sIHR5cGU6ICdmb290ZXInIH0sXG4gICAgeyByeDogL1xcYihoZWFkZXJ8bmF2fG5hdmJhcnxuYXZpZ2F0aW9uKVxcYi8sIHR5cGU6ICdoZWFkZXInIH0sXG4gICAgeyByeDogL1xcYihibG9nfGFydGljbGVzP3xuZXdzfHBvc3RzPylcXGIvLCB0eXBlOiAnYmxvZ19ncmlkJyB9LFxuICBdO1xuICBmb3IgKGNvbnN0IHsgcngsIHR5cGUgfSBvZiBleHBsaWNpdCkge1xuICAgIGlmIChyeC50ZXN0KG5hbWUpKSByZXR1cm4geyB0eXBlLCBjb25maWRlbmNlOiAnaGlnaCcgfTtcbiAgfVxuXG4gIC8vIFBhdHRlcm4gc2lnbmFsc1xuICBpZiAocC5wYXR0ZXJucy5zb21lKHB0ID0+IHB0LnR5cGUgPT09ICdhY2NvcmRpb24nKSkgcmV0dXJuIHsgdHlwZTogJ2ZhcScsIGNvbmZpZGVuY2U6ICdoaWdoJyB9O1xuICBpZiAocC5pc0Zvcm1TZWN0aW9uKSByZXR1cm4geyB0eXBlOiAnY29udGFjdCcsIGNvbmZpZGVuY2U6ICdoaWdoJyB9O1xuXG4gIC8vIFJlcGVhdGVyIGNvbnRlbnQgc2hhcGVcbiAgY29uc3QgcmVwS2V5cyA9IE9iamVjdC5rZXlzKHAucmVwZWF0ZXJzKTtcbiAgaWYgKHJlcEtleXMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHJlcCA9IHAucmVwZWF0ZXJzW3JlcEtleXNbMF1dO1xuICAgIGNvbnN0IGZpcnN0ID0gcmVwLml0ZW1zWzBdO1xuICAgIGlmIChmaXJzdCkge1xuICAgICAgY29uc3QgaGFzSW1hZ2UgPSAhIWZpcnN0LmltYWdlRmlsZTtcbiAgICAgIGNvbnN0IHRleHRWYWxzID0gT2JqZWN0LnZhbHVlcyhmaXJzdC50ZXh0cyk7XG4gICAgICBjb25zdCB0ZXh0S2V5cyA9IE9iamVjdC5rZXlzKGZpcnN0LnRleHRzKTtcbiAgICAgIGNvbnN0IGpvaW5lZCA9IHRleHRWYWxzLmpvaW4oJyAnKTtcbiAgICAgIGNvbnN0IGhhc1ByaWNlID0gL1skXHUyMEFDXHUwMEEzXVxccypcXGR8XFxiXFxkK1xccyooXFwvKG1vfHlyKXxwZXIgKG1vbnRofHllYXIpKVxcYi9pLnRlc3Qoam9pbmVkKTtcbiAgICAgIGNvbnN0IGxvbmdRdW90ZSA9IHRleHRWYWxzLnNvbWUodiA9PiAodiB8fCAnJykubGVuZ3RoID4gMTAwKTtcbiAgICAgIGNvbnN0IGlzTG9nb09ubHkgPSBoYXNJbWFnZSAmJiB0ZXh0S2V5cy5sZW5ndGggPT09IDA7XG4gICAgICBjb25zdCBoYXNEYXRlID0gL1xcYihqYW58ZmVifG1hcnxhcHJ8bWF5fGp1bnxqdWx8YXVnfHNlcHxvY3R8bm92fGRlYylcXHcqXFxzK1xcZHsxLDJ9L2kudGVzdChqb2luZWQpXG4gICAgICAgICAgICAgICAgICAgfHwgL1xcZHs0fS1cXGR7Mn0tXFxkezJ9Ly50ZXN0KGpvaW5lZClcbiAgICAgICAgICAgICAgICAgICB8fCAvXFxiKG1pbiByZWFkfHJlYWRpbmcgdGltZSlcXGIvaS50ZXN0KGpvaW5lZCk7XG5cbiAgICAgIGlmIChoYXNQcmljZSkgcmV0dXJuIHsgdHlwZTogJ3ByaWNpbmcnLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICAgICAgaWYgKGlzTG9nb09ubHkpIHJldHVybiB7IHR5cGU6ICdsb2dvcycsIGNvbmZpZGVuY2U6ICdsb3cnIH07XG4gICAgICBpZiAoaGFzRGF0ZSkgcmV0dXJuIHsgdHlwZTogJ2Jsb2dfZ3JpZCcsIGNvbmZpZGVuY2U6ICdsb3cnIH07XG4gICAgICBpZiAobG9uZ1F1b3RlKSByZXR1cm4geyB0eXBlOiAndGVzdGltb25pYWxzJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgICAgIGlmIChoYXNJbWFnZSAmJiB0ZXh0S2V5cy5sZW5ndGggPj0gMikgcmV0dXJuIHsgdHlwZTogJ2ZlYXR1cmVzJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgICB9XG4gIH1cblxuICAvLyBGaXJzdC1zZWN0aW9uIGhlcm8gaGV1cmlzdGljXG4gIGlmIChwLnNlY3Rpb25JbmRleCA9PT0gMCkge1xuICAgIGNvbnN0IGhhc0JpZ0hlYWRpbmcgPSBwLnRleHRDb250ZW50SW5PcmRlci5zb21lKHQgPT4gdC5mb250U2l6ZSA+PSA0MCk7XG4gICAgY29uc3QgaGFzQnV0dG9uID0gT2JqZWN0LmtleXMocC5lbGVtZW50cykuc29tZShrID0+IC9idXR0b258Y3RhfGJ0bi9pLnRlc3QoaykpO1xuICAgIGNvbnN0IGhhc0ltYWdlID0gT2JqZWN0LmtleXMocC5lbGVtZW50cykuc29tZShrID0+IC9pbWFnZXxwaG90b3xoZXJvL2kudGVzdChrKSB8fCBrID09PSAnYmFja2dyb3VuZF9pbWFnZScpO1xuICAgIGlmIChoYXNCaWdIZWFkaW5nICYmIChoYXNCdXR0b24gfHwgaGFzSW1hZ2UpKSByZXR1cm4geyB0eXBlOiAnaGVybycsIGNvbmZpZGVuY2U6ICdsb3cnIH07XG4gIH1cblxuICAvLyBTaG9ydCBzZWN0aW9uIHdpdGggaGVhZGluZyArIGJ1dHRvbiBcdTIxOTIgQ1RBXG4gIGNvbnN0IGhhc0J1dHRvbkVsID0gT2JqZWN0LmtleXMocC5lbGVtZW50cykuZmlsdGVyKGsgPT4gL2J1dHRvbnxjdGF8YnRuL2kudGVzdChrKSkubGVuZ3RoID49IDE7XG4gIGNvbnN0IHRleHRDb3VudCA9IHAudGV4dENvbnRlbnRJbk9yZGVyLmxlbmd0aDtcbiAgaWYgKGhhc0J1dHRvbkVsICYmIHRleHRDb3VudCA8PSAzICYmIHJlcEtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogJ2N0YScsIGNvbmZpZGVuY2U6ICdsb3cnIH07XG4gIH1cblxuICByZXR1cm4geyB0eXBlOiAnZ2VuZXJpYycsIGNvbmZpZGVuY2U6ICdsb3cnIH07XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gQ3Jvc3MtcGFnZSBmaW5nZXJwcmludCBoZWxwZXJzIChmb3IgZ2xvYmFsIGRldGVjdGlvbiBpbiBleHRyYWN0b3IudHMpXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqXG4gKiBOb3JtYWxpemUgYSBzZWN0aW9uJ3MgbGF5ZXIgbmFtZSBmb3IgY3Jvc3MtcGFnZSBtYXRjaGluZy5cbiAqIFwiSGVhZGVyIFx1MjAxNCBEZXNrdG9wXCIsIFwiSGVhZGVyIDE0NDBcIiwgXCJIZWFkZXJcIiBhbGwgY29sbGFwc2UgdG8gXCJoZWFkZXJcIi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVNlY3Rpb25OYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiAobmFtZSB8fCAnJylcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9cXHMqW1x1MjAxNFx1MjAxM1xcLV1cXHMqKGRlc2t0b3B8bW9iaWxlfHRhYmxldClcXGIvZ2ksICcnKVxuICAgIC5yZXBsYWNlKC9cXHMrXFxkezMsNH0kL2csICcnKVxuICAgIC50cmltKCk7XG59XG5cbi8qKlxuICogR2l2ZW4gYSB0b3RhbCBzZWN0aW9uIGNvdW50IGFuZCB0aGUgaW5kZXggb2YgYSBnbG9iYWwgc2VjdGlvbiwgZ3Vlc3NcbiAqIHdoZXRoZXIgaXQgaXMgYSBoZWFkZXIgKHRvcCwgdGhpbikgb3IgZm9vdGVyIChib3R0b20pIFx1MjAxNCBvciBudWxsIHdoZW5cbiAqIG5laXRoZXIgZml0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzaWZ5R2xvYmFsUm9sZShcbiAgc2VjdGlvbkluZGV4OiBudW1iZXIsXG4gIHRvdGFsU2VjdGlvbnM6IG51bWJlcixcbiAgc2VjdGlvbkhlaWdodDogbnVtYmVyLFxuKTogJ2hlYWRlcicgfCAnZm9vdGVyJyB8IG51bGwge1xuICBpZiAoc2VjdGlvbkluZGV4IDw9IDEgJiYgc2VjdGlvbkhlaWdodCA8PSAyMDApIHJldHVybiAnaGVhZGVyJztcbiAgaWYgKHNlY3Rpb25JbmRleCA+PSB0b3RhbFNlY3Rpb25zIC0gMikgcmV0dXJuICdmb290ZXInO1xuICByZXR1cm4gbnVsbDtcbn1cbiIsICJpbXBvcnQgeyBTZWN0aW9uU3BlYywgU2VjdGlvblN0eWxlcywgRWxlbWVudFN0eWxlcywgT3ZlcmxhcEluZm8sIExheWVySW5mbywgQ29tcG9zaXRpb25JbmZvLCBGb3JtRmllbGRJbmZvLCBUZXh0Q29udGVudEVudHJ5LCBDb21wb25lbnRJbnN0YW5jZUluZm8gfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHRvQ3NzVmFsdWUsIHRvTGF5b3V0TmFtZSwgc2NyZWVuc2hvdEZpbGVuYW1lLCBjb21wdXRlQXNwZWN0UmF0aW8sIGlzRGVmYXVsdExheWVyTmFtZSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgZXh0cmFjdEJhY2tncm91bmRDb2xvciwgZXh0cmFjdEdyYWRpZW50LCBoYXNJbWFnZUZpbGwsIGV4dHJhY3RCb3JkZXJTdHlsZSwgZXh0cmFjdEJvcmRlcldpZHRocywgZXh0cmFjdFN0cm9rZUNvbG9yIH0gZnJvbSAnLi9jb2xvcic7XG5pbXBvcnQgeyBleHRyYWN0VHlwb2dyYXBoeSB9IGZyb20gJy4vdHlwb2dyYXBoeSc7XG5pbXBvcnQgeyBleHRyYWN0QXV0b0xheW91dFNwYWNpbmcsIGV4dHJhY3RBYnNvbHV0ZVNwYWNpbmcgfSBmcm9tICcuL3NwYWNpbmcnO1xuaW1wb3J0IHsgZGV0ZWN0R3JpZCB9IGZyb20gJy4vZ3JpZCc7XG5pbXBvcnQgeyBleHRyYWN0SW50ZXJhY3Rpb25zIH0gZnJvbSAnLi9pbnRlcmFjdGlvbnMnO1xuaW1wb3J0IHsgZXh0cmFjdEVmZmVjdHMgfSBmcm9tICcuL2VmZmVjdHMnO1xuaW1wb3J0IHsgdG9Dc3NDdXN0b21Qcm9wZXJ0eSB9IGZyb20gJy4vdmFyaWFibGVzJztcbmltcG9ydCB7XG4gIGRldGVjdFJlcGVhdGVycywgZGV0ZWN0Q29tcG9uZW50UGF0dGVybnMsIGRldGVjdE5hdmlnYXRpb24sXG4gIGluZmVyU2VjdGlvblR5cGUsIG5vcm1hbGl6ZVNlY3Rpb25OYW1lLCBjbGFzc2lmeUdsb2JhbFJvbGUsXG59IGZyb20gJy4vcGF0dGVybnMnO1xuXG4vKipcbiAqIElkZW50aWZ5IHNlY3Rpb24gZnJhbWVzIHdpdGhpbiBhIHBhZ2UgZnJhbWUuXG4gKiBTZWN0aW9ucyBhcmUgdGhlIGRpcmVjdCBjaGlsZHJlbiBvZiB0aGUgcGFnZSBmcmFtZSwgc29ydGVkIGJ5IFkgcG9zaXRpb24uXG4gKiBJZiB0aGUgZnJhbWUgaGFzIGEgc2luZ2xlIHdyYXBwZXIgY2hpbGQsIGRyaWxsIG9uZSBsZXZlbCBkZWVwZXIuXG4gKi9cbmZ1bmN0aW9uIGlkZW50aWZ5U2VjdGlvbnMocGFnZUZyYW1lOiBGcmFtZU5vZGUpOiBTY2VuZU5vZGVbXSB7XG4gIGxldCBjYW5kaWRhdGVzID0gcGFnZUZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKVxuICApO1xuXG4gIC8vIElmIHRoZXJlJ3MgYSBzaW5nbGUgY29udGFpbmVyIGNoaWxkLCBkcmlsbCBvbmUgbGV2ZWwgZGVlcGVyXG4gIGlmIChjYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSAmJiAnY2hpbGRyZW4nIGluIGNhbmRpZGF0ZXNbMF0pIHtcbiAgICBjb25zdCB3cmFwcGVyID0gY2FuZGlkYXRlc1swXSBhcyBGcmFtZU5vZGU7XG4gICAgY29uc3QgaW5uZXJDYW5kaWRhdGVzID0gd3JhcHBlci5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICAgKTtcbiAgICBpZiAoaW5uZXJDYW5kaWRhdGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNhbmRpZGF0ZXMgPSBpbm5lckNhbmRpZGF0ZXM7XG4gICAgfVxuICB9XG5cbiAgLy8gU29ydCBieSBZIHBvc2l0aW9uICh0b3AgdG8gYm90dG9tKVxuICByZXR1cm4gWy4uLmNhbmRpZGF0ZXNdLnNvcnQoKGEsIGIpID0+IHtcbiAgICBjb25zdCBhWSA9IGEuYWJzb2x1dGVCb3VuZGluZ0JveD8ueSA/PyAwO1xuICAgIGNvbnN0IGJZID0gYi5hYnNvbHV0ZUJvdW5kaW5nQm94Py55ID8/IDA7XG4gICAgcmV0dXJuIGFZIC0gYlk7XG4gIH0pO1xufVxuXG4vKipcbiAqIEV4dHJhY3Qgc2VjdGlvbi1sZXZlbCBzdHlsZXMgZnJvbSBhIGZyYW1lLlxuICovXG5mdW5jdGlvbiBleHRyYWN0U2VjdGlvblN0eWxlcyhub2RlOiBTY2VuZU5vZGUpOiBTZWN0aW9uU3R5bGVzIHtcbiAgY29uc3QgYmcgPSBleHRyYWN0QmFja2dyb3VuZENvbG9yKG5vZGUgYXMgYW55KTtcbiAgY29uc3QgZ3JhZGllbnQgPSBleHRyYWN0R3JhZGllbnQobm9kZSBhcyBhbnkpO1xuICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGNvbnN0IGVmZmVjdHMgPSBleHRyYWN0RWZmZWN0cyhub2RlIGFzIGFueSk7XG4gIGNvbnN0IGNvcm5lcnMgPSBleHRyYWN0UGVyQ29ybmVyUmFkaXVzKG5vZGUgYXMgYW55KTtcblxuICBjb25zdCBzdHlsZXM6IFNlY3Rpb25TdHlsZXMgPSB7XG4gICAgcGFkZGluZ1RvcDogbnVsbCwgIC8vIFNldCBieSBzcGFjaW5nIGV4dHJhY3RvclxuICAgIHBhZGRpbmdCb3R0b206IG51bGwsXG4gICAgcGFkZGluZ0xlZnQ6IG51bGwsXG4gICAgcGFkZGluZ1JpZ2h0OiBudWxsLFxuICAgIGJhY2tncm91bmRDb2xvcjogYmcsXG4gICAgYmFja2dyb3VuZEltYWdlOiBoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpID8gJ3VybCguLi4pJyA6IG51bGwsXG4gICAgYmFja2dyb3VuZEdyYWRpZW50OiBncmFkaWVudCxcbiAgICBtaW5IZWlnaHQ6IGJvdW5kcyA/IHRvQ3NzVmFsdWUoYm91bmRzLmhlaWdodCkgOiBudWxsLFxuICAgIG92ZXJmbG93OiBudWxsLFxuICAgIGJveFNoYWRvdzogZWZmZWN0cy5ib3hTaGFkb3csXG4gICAgZmlsdGVyOiBlZmZlY3RzLmZpbHRlcixcbiAgICBiYWNrZHJvcEZpbHRlcjogZWZmZWN0cy5iYWNrZHJvcEZpbHRlcixcbiAgfTtcbiAgaWYgKGNvcm5lcnMpIHtcbiAgICBpZiAoY29ybmVycy51bmlmb3JtICE9PSBudWxsKSB7XG4gICAgICAvLyB1bmlmb3JtIGNvcm5lcnMgXHUyMDE0IGFnZW50cyBhcHBseSB2aWEgYm9yZGVyLXJhZGl1cyBzaG9ydGhhbmQgYXQgZWxlbWVudCBsZXZlbDtcbiAgICAgIC8vIHNlY3Rpb25zIHJhcmVseSBoYXZlIGEgc2luZ2xlIHJhZGl1cyBzbyB3ZSBvbmx5IGVtaXQgcGVyLWNvcm5lciB3aGVuIGRpZmZlcmluZ1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMuYm9yZGVyVG9wTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy50b3BMZWZ0KTtcbiAgICAgIHN0eWxlcy5ib3JkZXJUb3BSaWdodFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy50b3BSaWdodCk7XG4gICAgICBzdHlsZXMuYm9yZGVyQm90dG9tTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy5ib3R0b21MZWZ0KTtcbiAgICAgIHN0eWxlcy5ib3JkZXJCb3R0b21SaWdodFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy5ib3R0b21SaWdodCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHlsZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdCBwZXItY29ybmVyIGJvcmRlci1yYWRpdXMgZnJvbSBhIG5vZGUuIEZpZ21hIHN0b3Jlc1xuICogdG9wTGVmdFJhZGl1cyAvIHRvcFJpZ2h0UmFkaXVzIC8gYm90dG9tTGVmdFJhZGl1cyAvIGJvdHRvbVJpZ2h0UmFkaXVzXG4gKiBhcyBpbmRpdmlkdWFsIHByb3BlcnRpZXMgb24gUmVjdGFuZ2xlTm9kZSBhbmQgRnJhbWVOb2RlLiBXaGVuIHRoZVxuICogdW5pZm9ybSBjb3JuZXJSYWRpdXMgaXMgYSBudW1iZXIsIGFsbCBmb3VyIGFyZSBlcXVhbC5cbiAqIFJldHVybnMgbnVsbCBpZiB0aGUgbm9kZSBoYXMgbm8gY29ybmVyIGRhdGEuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RQZXJDb3JuZXJSYWRpdXMobm9kZTogYW55KToge1xuICB0b3BMZWZ0OiBudW1iZXI7IHRvcFJpZ2h0OiBudW1iZXI7IGJvdHRvbUxlZnQ6IG51bWJlcjsgYm90dG9tUmlnaHQ6IG51bWJlcjsgdW5pZm9ybTogbnVtYmVyIHwgbnVsbDtcbn0gfCBudWxsIHtcbiAgY29uc3QgbiA9IG5vZGUgYXMgYW55O1xuICBjb25zdCBjciA9IG4uY29ybmVyUmFkaXVzO1xuICBjb25zdCB0bCA9IHR5cGVvZiBuLnRvcExlZnRSYWRpdXMgPT09ICdudW1iZXInID8gbi50b3BMZWZ0UmFkaXVzIDogbnVsbDtcbiAgY29uc3QgdHIgPSB0eXBlb2Ygbi50b3BSaWdodFJhZGl1cyA9PT0gJ251bWJlcicgPyBuLnRvcFJpZ2h0UmFkaXVzIDogbnVsbDtcbiAgY29uc3QgYmwgPSB0eXBlb2Ygbi5ib3R0b21MZWZ0UmFkaXVzID09PSAnbnVtYmVyJyA/IG4uYm90dG9tTGVmdFJhZGl1cyA6IG51bGw7XG4gIGNvbnN0IGJyID0gdHlwZW9mIG4uYm90dG9tUmlnaHRSYWRpdXMgPT09ICdudW1iZXInID8gbi5ib3R0b21SaWdodFJhZGl1cyA6IG51bGw7XG5cbiAgaWYgKHR5cGVvZiBjciA9PT0gJ251bWJlcicgJiYgdGwgPT09IG51bGwpIHtcbiAgICAvLyBVbmlmb3JtIGNvcm5lcnMgKG9yIGNvcm5lclJhZGl1cyBpcyB0aGUgbWl4ZWQgc3ltYm9sKVxuICAgIGlmIChjciA9PT0gMCkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHsgdG9wTGVmdDogY3IsIHRvcFJpZ2h0OiBjciwgYm90dG9tTGVmdDogY3IsIGJvdHRvbVJpZ2h0OiBjciwgdW5pZm9ybTogY3IgfTtcbiAgfVxuICBpZiAodGwgIT09IG51bGwgfHwgdHIgIT09IG51bGwgfHwgYmwgIT09IG51bGwgfHwgYnIgIT09IG51bGwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdG9wTGVmdDogdGwgfHwgMCxcbiAgICAgIHRvcFJpZ2h0OiB0ciB8fCAwLFxuICAgICAgYm90dG9tTGVmdDogYmwgfHwgMCxcbiAgICAgIGJvdHRvbVJpZ2h0OiBiciB8fCAwLFxuICAgICAgdW5pZm9ybTogKHRsID09PSB0ciAmJiB0ciA9PT0gYmwgJiYgYmwgPT09IGJyKSA/ICh0bCB8fCAwKSA6IG51bGwsXG4gICAgfTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBBcHBseSBwZXItY29ybmVyIHJhZGl1cyB0byBhbiBFbGVtZW50U3R5bGVzLiBJZiBhbGwgNCBhcmUgZXF1YWwsIGVtaXRcbiAqIGJvcmRlclJhZGl1cyBzaG9ydGhhbmQ7IG90aGVyd2lzZSBlbWl0IHRoZSA0IGV4cGxpY2l0IHZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gYXBwbHlSYWRpdXMoZWxlbTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiwgbm9kZTogYW55KTogdm9pZCB7XG4gIGNvbnN0IGNvcm5lcnMgPSBleHRyYWN0UGVyQ29ybmVyUmFkaXVzKG5vZGUpO1xuICBpZiAoIWNvcm5lcnMpIHJldHVybjtcbiAgaWYgKGNvcm5lcnMudW5pZm9ybSAhPT0gbnVsbCkge1xuICAgIGVsZW0uYm9yZGVyUmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnVuaWZvcm0pO1xuICAgIHJldHVybjtcbiAgfVxuICBlbGVtLmJvcmRlclRvcExlZnRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudG9wTGVmdCk7XG4gIGVsZW0uYm9yZGVyVG9wUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudG9wUmlnaHQpO1xuICBlbGVtLmJvcmRlckJvdHRvbUxlZnRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMuYm90dG9tTGVmdCk7XG4gIGVsZW0uYm9yZGVyQm90dG9tUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMuYm90dG9tUmlnaHQpO1xufVxuXG4vKipcbiAqIEFwcGx5IHN0cm9rZXMgdG8gYW4gRWxlbWVudFN0eWxlczogcGVyLXNpZGUgYm9yZGVyLXdpZHRoIHdoZW4gRmlnbWEgaGFzXG4gKiBpbmRpdmlkdWFsU3Ryb2tlV2VpZ2h0cywgc2luZ2xlIGJvcmRlcldpZHRoIG90aGVyd2lzZS4gQWxzbyBtYXBzIHN0eWxlXG4gKiAoc29saWQvZGFzaGVkL2RvdHRlZCkgYW5kIGNvbG9yLlxuICovXG5mdW5jdGlvbiBhcHBseVN0cm9rZXMoZWxlbTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiwgbm9kZTogYW55KTogdm9pZCB7XG4gIGNvbnN0IGNvbG9yID0gZXh0cmFjdFN0cm9rZUNvbG9yKG5vZGUpO1xuICBjb25zdCB3aWR0aHMgPSBleHRyYWN0Qm9yZGVyV2lkdGhzKG5vZGUpO1xuICBjb25zdCBzdHlsZSA9IGV4dHJhY3RCb3JkZXJTdHlsZShub2RlKTtcbiAgaWYgKCFjb2xvcikgcmV0dXJuO1xuXG4gIGlmICh3aWR0aHMudW5pZm9ybSAhPT0gbnVsbCkge1xuICAgIGVsZW0uYm9yZGVyV2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy51bmlmb3JtKTtcbiAgICBlbGVtLmJvcmRlckNvbG9yID0gY29sb3I7XG4gICAgZWxlbS5ib3JkZXJTdHlsZSA9IHN0eWxlO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAod2lkdGhzLnRvcCB8fCB3aWR0aHMucmlnaHQgfHwgd2lkdGhzLmJvdHRvbSB8fCB3aWR0aHMubGVmdCkge1xuICAgIGlmICh3aWR0aHMudG9wKSBlbGVtLmJvcmRlclRvcFdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMudG9wKTtcbiAgICBpZiAod2lkdGhzLnJpZ2h0KSBlbGVtLmJvcmRlclJpZ2h0V2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy5yaWdodCk7XG4gICAgaWYgKHdpZHRocy5ib3R0b20pIGVsZW0uYm9yZGVyQm90dG9tV2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy5ib3R0b20pO1xuICAgIGlmICh3aWR0aHMubGVmdCkgZWxlbS5ib3JkZXJMZWZ0V2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy5sZWZ0KTtcbiAgICBlbGVtLmJvcmRlckNvbG9yID0gY29sb3I7XG4gICAgZWxlbS5ib3JkZXJTdHlsZSA9IHN0eWxlO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdCBvYmplY3QtcG9zaXRpb24gZnJvbSBhbiBpbWFnZSBmaWxsJ3MgaW1hZ2VUcmFuc2Zvcm0gKGNyb3Agb2Zmc2V0KS5cbiAqIEZpZ21hJ3MgaW1hZ2VUcmFuc2Zvcm0gaXMgYSAyeDMgYWZmaW5lIG1hdHJpeC4gV2hlbiB0aGUgaW1hZ2UgaGFzIGJlZW5cbiAqIGNyb3BwZWQvcmVwb3NpdGlvbmVkIGluIEZpZ21hLCB0aGUgdHJhbnNsYXRpb24gY29tcG9uZW50cyB0ZWxsIHVzIHRoZVxuICogZm9jYWwgcG9pbnQuIE1hcCB0byBDU1Mgb2JqZWN0LXBvc2l0aW9uIC8gYmFja2dyb3VuZC1wb3NpdGlvbi5cbiAqXG4gKiBSZXR1cm5zIG51bGwgd2hlbiB0aGUgaW1hZ2UgaXMgY2VudGVyZWQgKGRlZmF1bHQpLCBvciB3aGVuIG5vZGUgaGFzIG5vXG4gKiBpbWFnZVRyYW5zZm9ybSBkYXRhLlxuICovXG5mdW5jdGlvbiBleHRyYWN0T2JqZWN0UG9zaXRpb24obm9kZTogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGltZ0ZpbGwgPSBub2RlLmZpbGxzLmZpbmQoKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSkgYXMgSW1hZ2VQYWludCB8IHVuZGVmaW5lZDtcbiAgaWYgKCFpbWdGaWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdCA9IChpbWdGaWxsIGFzIGFueSkuaW1hZ2VUcmFuc2Zvcm0gYXMgbnVtYmVyW11bXSB8IHVuZGVmaW5lZDtcbiAgaWYgKCF0IHx8ICFBcnJheS5pc0FycmF5KHQpIHx8IHQubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG4gIC8vIGltYWdlVHJhbnNmb3JtIGlzIGEgMngzIG1hdHJpeDogW1thLCBiLCB0eF0sIFtjLCBkLCB0eV1dXG4gIC8vIHR4L3R5IGFyZSBub3JtYWxpemVkICgwLi4xKSB0cmFuc2xhdGlvbiBcdTIwMTQgMCA9IGxlZnQvdG9wLCAwLjUgPSBjZW50ZXJcbiAgY29uc3QgdHggPSB0WzBdICYmIHR5cGVvZiB0WzBdWzJdID09PSAnbnVtYmVyJyA/IHRbMF1bMl0gOiAwLjU7XG4gIGNvbnN0IHR5ID0gdFsxXSAmJiB0eXBlb2YgdFsxXVsyXSA9PT0gJ251bWJlcicgPyB0WzFdWzJdIDogMC41O1xuICAvLyBEZWZhdWx0IChjZW50ZXJlZCkgXHUyMTkyIG51bGwgKGJyb3dzZXIgdXNlcyBcIjUwJSA1MCVcIiBieSBkZWZhdWx0KVxuICBpZiAoTWF0aC5hYnModHggLSAwLjUpIDwgMC4wMSAmJiBNYXRoLmFicyh0eSAtIDAuNSkgPCAwLjAxKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgeFBjdCA9IE1hdGgucm91bmQodHggKiAxMDApO1xuICBjb25zdCB5UGN0ID0gTWF0aC5yb3VuZCh0eSAqIDEwMCk7XG4gIHJldHVybiBgJHt4UGN0fSUgJHt5UGN0fSVgO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdHJhbnNmb3JtIChyb3RhdGlvbiArIHNjYWxlKSBmcm9tIGEgbm9kZSdzIHJlbGF0aXZlVHJhbnNmb3JtLlxuICogRmlnbWEncyByZWxhdGl2ZVRyYW5zZm9ybSBpcyBhIDJ4MyBtYXRyaXggXHUyMDE0IHdlIGRlY29tcG9zZSBpdCB0byByb3RhdGlvblxuICogYW5kIHNjYWxlIHdoZW4gdGhleSdyZSBub24taWRlbnRpdHkuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RUcmFuc2Zvcm0obm9kZTogYW55KTogeyB0cmFuc2Zvcm06IHN0cmluZyB8IG51bGwgfSB7XG4gIGNvbnN0IHJ0ID0gbm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSBhcyBudW1iZXJbXVtdIHwgdW5kZWZpbmVkO1xuICBpZiAoIXJ0IHx8ICFBcnJheS5pc0FycmF5KHJ0KSB8fCBydC5sZW5ndGggPCAyKSByZXR1cm4geyB0cmFuc2Zvcm06IG51bGwgfTtcbiAgLy8gRXh0cmFjdCByb3RhdGlvbiBmcm9tIHRoZSBtYXRyaXg6IGFuZ2xlID0gYXRhbjIobVsxXVswXSwgbVswXVswXSlcbiAgY29uc3QgYSA9IHJ0WzBdWzBdLCBiID0gcnRbMF1bMV0sIGMgPSBydFsxXVswXSwgZCA9IHJ0WzFdWzFdO1xuICBjb25zdCByYWRpYW5zID0gTWF0aC5hdGFuMihjLCBhKTtcbiAgY29uc3QgZGVncmVlcyA9IE1hdGgucm91bmQoKHJhZGlhbnMgKiAxODApIC8gTWF0aC5QSSk7XG4gIGNvbnN0IHNjYWxlWCA9IE1hdGguc3FydChhICogYSArIGMgKiBjKTtcbiAgY29uc3Qgc2NhbGVZID0gTWF0aC5zcXJ0KGIgKiBiICsgZCAqIGQpO1xuXG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoTWF0aC5hYnMoZGVncmVlcykgPiAwLjUpIHBhcnRzLnB1c2goYHJvdGF0ZSgke2RlZ3JlZXN9ZGVnKWApO1xuICBpZiAoTWF0aC5hYnMoc2NhbGVYIC0gMSkgPiAwLjAyKSBwYXJ0cy5wdXNoKGBzY2FsZVgoJHtNYXRoLnJvdW5kKHNjYWxlWCAqIDEwMCkgLyAxMDB9KWApO1xuICBpZiAoTWF0aC5hYnMoc2NhbGVZIC0gMSkgPiAwLjAyKSBwYXJ0cy5wdXNoKGBzY2FsZVkoJHtNYXRoLnJvdW5kKHNjYWxlWSAqIDEwMCkgLyAxMDB9KWApO1xuXG4gIHJldHVybiB7IHRyYW5zZm9ybTogcGFydHMubGVuZ3RoID4gMCA/IHBhcnRzLmpvaW4oJyAnKSA6IG51bGwgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGZsZXgtZ3JvdyAvIGZsZXgtYmFzaXMgLyBhbGlnbi1zZWxmIGZvciBhdXRvLWxheW91dCBjaGlsZHJlbi5cbiAqIEZpZ21hJ3MgbGF5b3V0R3JvdyBpcyAwIG9yIDE7IGxheW91dEFsaWduIGlzIElOSEVSSVQgLyBTVFJFVENIIC8gTUlOIC8gQ0VOVEVSIC8gTUFYLlxuICovXG5mdW5jdGlvbiBleHRyYWN0RmxleENoaWxkUHJvcHMobm9kZTogYW55KTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiB7XG4gIGNvbnN0IG91dDogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHt9O1xuICBpZiAodHlwZW9mIG5vZGUubGF5b3V0R3JvdyA9PT0gJ251bWJlcicpIHtcbiAgICBvdXQuZmxleEdyb3cgPSBub2RlLmxheW91dEdyb3c7XG4gIH1cbiAgaWYgKG5vZGUubGF5b3V0QWxpZ24pIHtcbiAgICBzd2l0Y2ggKG5vZGUubGF5b3V0QWxpZ24pIHtcbiAgICAgIGNhc2UgJ1NUUkVUQ0gnOiBvdXQuYWxpZ25TZWxmID0gJ3N0cmV0Y2gnOyBicmVhaztcbiAgICAgIGNhc2UgJ01JTic6IG91dC5hbGlnblNlbGYgPSAnZmxleC1zdGFydCc7IGJyZWFrO1xuICAgICAgY2FzZSAnQ0VOVEVSJzogb3V0LmFsaWduU2VsZiA9ICdjZW50ZXInOyBicmVhaztcbiAgICAgIGNhc2UgJ01BWCc6IG91dC5hbGlnblNlbGYgPSAnZmxleC1lbmQnOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENvbXB1dGUgcGVyLXNpZGUgbWFyZ2luIGZvciBhIG5vZGUgYmFzZWQgb24gc2libGluZyBwb3NpdGlvbnMgaW4gaXRzXG4gKiBwYXJlbnQgY29udGFpbmVyLiBSZXR1cm5zIG9ubHkgdGhlIHNpZGVzIHRoYXQgaGF2ZSBhIGNsZWFyIG5vbi16ZXJvXG4gKiBtYXJnaW4gKHByZXZpb3VzIHNpYmxpbmcgb24gdG9wLCBuZXh0IHNpYmxpbmcgYmVsb3csIHBhcmVudCBib3VuZHMgZm9yXG4gKiBsZWZ0L3JpZ2h0IHdoZW4gcGFyZW50IHdpZHRoIGlzIGtub3duKS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFBlclNpZGVNYXJnaW5zKG5vZGU6IFNjZW5lTm9kZSk6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4ge1xuICBjb25zdCBvdXQ6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7fTtcbiAgaWYgKCFub2RlLmFic29sdXRlQm91bmRpbmdCb3ggfHwgIW5vZGUucGFyZW50IHx8ICEoJ2NoaWxkcmVuJyBpbiBub2RlLnBhcmVudCkpIHJldHVybiBvdXQ7XG5cbiAgY29uc3Qgc2libGluZ3MgPSAobm9kZS5wYXJlbnQgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbjtcbiAgY29uc3QgaWR4ID0gc2libGluZ3MuaW5kZXhPZihub2RlKTtcbiAgY29uc3QgYmIgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG5cbiAgLy8gQm90dG9tOiBnYXAgdG8gbmV4dCBzaWJsaW5nXG4gIGlmIChpZHggPj0gMCAmJiBpZHggPCBzaWJsaW5ncy5sZW5ndGggLSAxKSB7XG4gICAgY29uc3QgbmV4dCA9IHNpYmxpbmdzW2lkeCArIDFdO1xuICAgIGlmIChuZXh0LmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICAgIGNvbnN0IGdhcCA9IG5leHQuYWJzb2x1dGVCb3VuZGluZ0JveC55IC0gKGJiLnkgKyBiYi5oZWlnaHQpO1xuICAgICAgaWYgKGdhcCA+IDApIG91dC5tYXJnaW5Cb3R0b20gPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQoZ2FwKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gVG9wOiBnYXAgdG8gcHJldmlvdXMgc2libGluZyAoZm9yIGFic29sdXRlLXBvc2l0aW9uIGxheW91dHMpXG4gIGlmIChpZHggPiAwKSB7XG4gICAgY29uc3QgcHJldiA9IHNpYmxpbmdzW2lkeCAtIDFdO1xuICAgIGlmIChwcmV2LmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICAgIGNvbnN0IGdhcCA9IGJiLnkgLSAocHJldi5hYnNvbHV0ZUJvdW5kaW5nQm94LnkgKyBwcmV2LmFic29sdXRlQm91bmRpbmdCb3guaGVpZ2h0KTtcbiAgICAgIGlmIChnYXAgPiAwKSBvdXQubWFyZ2luVG9wID0gdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKGdhcCkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIExlZnQvcmlnaHQ6IGluc2V0IGZyb20gcGFyZW50IGVkZ2VzXG4gIGNvbnN0IHBhcmVudEJCID0gKG5vZGUucGFyZW50IGFzIEZyYW1lTm9kZSkuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgaWYgKHBhcmVudEJCKSB7XG4gICAgY29uc3QgbGVmdEdhcCA9IGJiLnggLSBwYXJlbnRCQi54O1xuICAgIGNvbnN0IHJpZ2h0R2FwID0gKHBhcmVudEJCLnggKyBwYXJlbnRCQi53aWR0aCkgLSAoYmIueCArIGJiLndpZHRoKTtcbiAgICAvLyBPbmx5IGVtaXQgd2hlbiBlbGVtZW50IGlzIG5vdCBjZW50ZXJlZCAoc2lnbmlmaWNhbnQgYXN5bW1ldHJpYyBtYXJnaW4pXG4gICAgaWYgKE1hdGguYWJzKGxlZnRHYXAgLSByaWdodEdhcCkgPiA4ICYmIGxlZnRHYXAgPiAwKSB7XG4gICAgICBvdXQubWFyZ2luTGVmdCA9IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChsZWZ0R2FwKSk7XG4gICAgfVxuICAgIGlmIChNYXRoLmFicyhsZWZ0R2FwIC0gcmlnaHRHYXApID4gOCAmJiByaWdodEdhcCA+IDApIHtcbiAgICAgIG91dC5tYXJnaW5SaWdodCA9IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChyaWdodEdhcCkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogRXh0cmFjdCBwcm90b3R5cGUgbmF2aWdhdGlvbiBVUkwgZm9yIGEgbm9kZS4gRmlnbWEgc3VwcG9ydHNcbiAqIE9QRU5fVVJMIGFjdGlvbnMgaW4gcmVhY3Rpb25zIFx1MjAxNCBtYXAgdG8gbGlua1VybC5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdExpbmtVcmwobm9kZTogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHJlYWN0aW9ucyA9IG5vZGUucmVhY3Rpb25zO1xuICBpZiAoIXJlYWN0aW9ucyB8fCAhQXJyYXkuaXNBcnJheShyZWFjdGlvbnMpKSByZXR1cm4gbnVsbDtcbiAgZm9yIChjb25zdCByIG9mIHJlYWN0aW9ucykge1xuICAgIGNvbnN0IGFjdGlvbnMgPSByLmFjdGlvbnMgfHwgKHIuYWN0aW9uID8gW3IuYWN0aW9uXSA6IFtdKTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgYWN0aW9ucykge1xuICAgICAgaWYgKGEgJiYgYS50eXBlID09PSAnVVJMJyAmJiBhLnVybCkgcmV0dXJuIGEudXJsO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IEZpZ21hIHNpemluZyBtb2RlcyAoSHVnIC8gRmlsbCAvIEZpeGVkKS4gVGhlc2UgdGVsbCB0aGUgYWdlbnRcbiAqIHdoZXRoZXIgYW4gZWxlbWVudCBzaG91bGQgYmUgd2lkdGg6YXV0bywgd2lkdGg6MTAwJSwgb3IgYSBmaXhlZCBweCBzaXplIFx1MjAxNFxuICogY3JpdGljYWwgZm9yIGNvcnJlY3QgcmVzcG9uc2l2ZSBiZWhhdmlvci4gUmV0dXJucyBudWxsIGZvciBlYWNoIGF4aXMgd2hlblxuICogdGhlIG1vZGUgaXMgbWlzc2luZyAob2xkZXIgRmlnbWEgdmVyc2lvbnMsIG5vbi1hdXRvLWxheW91dCBjb250ZXh0cykuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RTaXppbmdNb2Rlcyhub2RlOiBhbnkpOiB7IHdpZHRoTW9kZTogJ2h1Zyd8J2ZpbGwnfCdmaXhlZCd8bnVsbDsgaGVpZ2h0TW9kZTogJ2h1Zyd8J2ZpbGwnfCdmaXhlZCd8bnVsbCB9IHtcbiAgY29uc3QgbWFwID0gKG06IHN0cmluZyB8IHVuZGVmaW5lZCk6ICdodWcnfCdmaWxsJ3wnZml4ZWQnfG51bGwgPT4ge1xuICAgIGlmIChtID09PSAnSFVHJykgcmV0dXJuICdodWcnO1xuICAgIGlmIChtID09PSAnRklMTCcpIHJldHVybiAnZmlsbCc7XG4gICAgaWYgKG0gPT09ICdGSVhFRCcpIHJldHVybiAnZml4ZWQnO1xuICAgIHJldHVybiBudWxsO1xuICB9O1xuICByZXR1cm4ge1xuICAgIHdpZHRoTW9kZTogbWFwKG5vZGUubGF5b3V0U2l6aW5nSG9yaXpvbnRhbCksXG4gICAgaGVpZ2h0TW9kZTogbWFwKG5vZGUubGF5b3V0U2l6aW5nVmVydGljYWwpLFxuICB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgRmlnbWEgVmFyaWFibGUgYmluZGluZ3Mgb24gYSBub2RlJ3MgcHJvcGVydGllcy4gUmV0dXJucyBDU1MgY3VzdG9tXG4gKiBwcm9wZXJ0eSByZWZlcmVuY2VzIChlLmcuIFwidmFyKC0tY2xyLXByaW1hcnkpXCIpIGtleWVkIGJ5IENTUyBwcm9wZXJ0eSBuYW1lLlxuICogV2hlbiB2YXJpYWJsZXMgYXJlIGJvdW5kLCB0aGUgYWdlbnQgc2hvdWxkIGVtaXQgdGhlc2UgcmVmZXJlbmNlcyBpbnN0ZWFkXG4gKiBvZiB0aGUgcmVzb2x2ZWQgcmF3IGhleC9weCB2YWx1ZXMgc28gdG9rZW4gY2hhbmdlcyBpbiBGaWdtYSBwcm9wYWdhdGUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RCb3VuZFZhcmlhYmxlcyhub2RlOiBhbnkpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgbnVsbCB7XG4gIGNvbnN0IGJ2ID0gbm9kZS5ib3VuZFZhcmlhYmxlcztcbiAgaWYgKCFidiB8fCB0eXBlb2YgYnYgIT09ICdvYmplY3QnKSByZXR1cm4gbnVsbDtcbiAgaWYgKCFmaWdtYS52YXJpYWJsZXMgfHwgdHlwZW9mIChmaWdtYS52YXJpYWJsZXMgYXMgYW55KS5nZXRWYXJpYWJsZUJ5SWQgIT09ICdmdW5jdGlvbicpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gIGNvbnN0IHJlc29sdmUgPSAoYWxpYXM6IGFueSk6IHN0cmluZyB8IG51bGwgPT4ge1xuICAgIGlmICghYWxpYXMgfHwgIWFsaWFzLmlkKSByZXR1cm4gbnVsbDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdiA9IChmaWdtYS52YXJpYWJsZXMgYXMgYW55KS5nZXRWYXJpYWJsZUJ5SWQoYWxpYXMuaWQpO1xuICAgICAgaWYgKCF2KSByZXR1cm4gbnVsbDtcbiAgICAgIGxldCBjb2xOYW1lID0gJyc7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb2wgPSAoZmlnbWEudmFyaWFibGVzIGFzIGFueSkuZ2V0VmFyaWFibGVDb2xsZWN0aW9uQnlJZD8uKHYudmFyaWFibGVDb2xsZWN0aW9uSWQpO1xuICAgICAgICBjb2xOYW1lID0gY29sPy5uYW1lIHx8ICcnO1xuICAgICAgfSBjYXRjaCB7fVxuICAgICAgcmV0dXJuIGB2YXIoJHt0b0Nzc0N1c3RvbVByb3BlcnR5KHYubmFtZSwgY29sTmFtZSl9KWA7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoYnYuZmlsbHMpICYmIGJ2LmZpbGxzWzBdKSB7XG4gICAgY29uc3QgcmVmID0gcmVzb2x2ZShidi5maWxsc1swXSk7XG4gICAgaWYgKHJlZikgb3V0W25vZGUudHlwZSA9PT0gJ1RFWFQnID8gJ2NvbG9yJyA6ICdiYWNrZ3JvdW5kQ29sb3InXSA9IHJlZjtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShidi5zdHJva2VzKSAmJiBidi5zdHJva2VzWzBdKSB7XG4gICAgY29uc3QgcmVmID0gcmVzb2x2ZShidi5zdHJva2VzWzBdKTtcbiAgICBpZiAocmVmKSBvdXQuYm9yZGVyQ29sb3IgPSByZWY7XG4gIH1cbiAgY29uc3QgbnVtZXJpY01hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICBwYWRkaW5nVG9wOiAncGFkZGluZ1RvcCcsIHBhZGRpbmdCb3R0b206ICdwYWRkaW5nQm90dG9tJyxcbiAgICBwYWRkaW5nTGVmdDogJ3BhZGRpbmdMZWZ0JywgcGFkZGluZ1JpZ2h0OiAncGFkZGluZ1JpZ2h0JyxcbiAgICBpdGVtU3BhY2luZzogJ2dhcCcsXG4gICAgY29ybmVyUmFkaXVzOiAnYm9yZGVyUmFkaXVzJyxcbiAgICB0b3BMZWZ0UmFkaXVzOiAnYm9yZGVyVG9wTGVmdFJhZGl1cycsIHRvcFJpZ2h0UmFkaXVzOiAnYm9yZGVyVG9wUmlnaHRSYWRpdXMnLFxuICAgIGJvdHRvbUxlZnRSYWRpdXM6ICdib3JkZXJCb3R0b21MZWZ0UmFkaXVzJywgYm90dG9tUmlnaHRSYWRpdXM6ICdib3JkZXJCb3R0b21SaWdodFJhZGl1cycsXG4gICAgc3Ryb2tlV2VpZ2h0OiAnYm9yZGVyV2lkdGgnLFxuICAgIGZvbnRTaXplOiAnZm9udFNpemUnLCBsaW5lSGVpZ2h0OiAnbGluZUhlaWdodCcsIGxldHRlclNwYWNpbmc6ICdsZXR0ZXJTcGFjaW5nJyxcbiAgfTtcbiAgZm9yIChjb25zdCBbZmlnbWFLZXksIGNzc0tleV0gb2YgT2JqZWN0LmVudHJpZXMobnVtZXJpY01hcCkpIHtcbiAgICBpZiAoYnZbZmlnbWFLZXldKSB7XG4gICAgICBjb25zdCByZWYgPSByZXNvbHZlKGJ2W2ZpZ21hS2V5XSk7XG4gICAgICBpZiAocmVmKSBvdXRbY3NzS2V5XSA9IHJlZjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gT2JqZWN0LmtleXMob3V0KS5sZW5ndGggPiAwID8gb3V0IDogbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGNvbXBvbmVudC1pbnN0YW5jZSBtZXRhZGF0YTogbWFpbiBjb21wb25lbnQgbmFtZSArIHZhcmlhbnRcbiAqIC8gYm9vbGVhbiAvIHRleHQgcHJvcGVydGllcy4gUmV0dXJucyBudWxsIGZvciBub24taW5zdGFuY2Ugbm9kZXMuXG4gKiBUaGlzIGlzIHRoZSBrZXkgc2lnbmFsIHRoZSBhZ2VudCB1c2VzIHRvIGRlZHVwZSByZXBlYXRlZCBjYXJkcywgYnV0dG9ucyxcbiAqIGFuZCBpY29ucyBpbnRvIHNoYXJlZCBBQ0YgYmxvY2tzIGluc3RlYWQgb2YgaW5saW5pbmcgZWFjaCBvbmUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RDb21wb25lbnRJbnN0YW5jZShub2RlOiBTY2VuZU5vZGUpOiBDb21wb25lbnRJbnN0YW5jZUluZm8gfCBudWxsIHtcbiAgaWYgKG5vZGUudHlwZSAhPT0gJ0lOU1RBTkNFJykgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgaW5zdCA9IG5vZGUgYXMgSW5zdGFuY2VOb2RlO1xuICAgIGxldCBuYW1lID0gaW5zdC5uYW1lO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtYWluID0gaW5zdC5tYWluQ29tcG9uZW50O1xuICAgICAgaWYgKG1haW4pIHtcbiAgICAgICAgbmFtZSA9IG1haW4ucGFyZW50Py50eXBlID09PSAnQ09NUE9ORU5UX1NFVCcgPyAobWFpbi5wYXJlbnQgYXMgYW55KS5uYW1lIDogbWFpbi5uYW1lO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgICBjb25zdCBwcm9wZXJ0aWVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBib29sZWFuIHwgbnVtYmVyPiA9IHt9O1xuICAgIGNvbnN0IHByb3BzID0gKGluc3QgYXMgYW55KS5jb21wb25lbnRQcm9wZXJ0aWVzO1xuICAgIGlmIChwcm9wcyAmJiB0eXBlb2YgcHJvcHMgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbF0gb2YgT2JqZWN0LmVudHJpZXMocHJvcHMpKSB7XG4gICAgICAgIGNvbnN0IHYgPSAodmFsIGFzIGFueSk/LnZhbHVlO1xuICAgICAgICBpZiAodHlwZW9mIHYgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2ID09PSAnYm9vbGVhbicgfHwgdHlwZW9mIHYgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgcHJvcGVydGllc1trZXldID0gdjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyBuYW1lLCBwcm9wZXJ0aWVzIH07XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdCBhbHQgdGV4dCBmb3IgYW4gaW1hZ2UuIFNvdXJjZSBwcmlvcml0eTogY29tcG9uZW50IGRlc2NyaXB0aW9uXG4gKiAoZm9yIElOU1RBTkNFIC8gQ09NUE9ORU5UIG5vZGVzKSBcdTIxOTIgaHVtYW5pemVkIGxheWVyIG5hbWUuIFJldHVybnMgZW1wdHlcbiAqIHN0cmluZyB3aGVuIHRoZSBsYXllciBpcyBuYW1lZCBnZW5lcmljYWxseSAoUmVjdGFuZ2xlIDEyLCBJbWFnZSAzLCBldGMuKS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEFsdFRleHQobm9kZTogU2NlbmVOb2RlKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnSU5TVEFOQ0UnKSB7XG4gICAgICBjb25zdCBtYWluID0gKG5vZGUgYXMgSW5zdGFuY2VOb2RlKS5tYWluQ29tcG9uZW50O1xuICAgICAgaWYgKG1haW4gJiYgbWFpbi5kZXNjcmlwdGlvbiAmJiBtYWluLmRlc2NyaXB0aW9uLnRyaW0oKSkgcmV0dXJuIG1haW4uZGVzY3JpcHRpb24udHJpbSgpO1xuICAgIH1cbiAgICBpZiAobm9kZS50eXBlID09PSAnQ09NUE9ORU5UJykge1xuICAgICAgY29uc3QgZGVzYyA9IChub2RlIGFzIENvbXBvbmVudE5vZGUpLmRlc2NyaXB0aW9uO1xuICAgICAgaWYgKGRlc2MgJiYgZGVzYy50cmltKCkpIHJldHVybiBkZXNjLnRyaW0oKTtcbiAgICB9XG4gIH0gY2F0Y2gge31cbiAgaWYgKCFub2RlLm5hbWUgfHwgaXNEZWZhdWx0TGF5ZXJOYW1lKG5vZGUubmFtZSkpIHJldHVybiAnJztcbiAgcmV0dXJuIG5vZGUubmFtZS5yZXBsYWNlKC9bLV9dL2csICcgJykucmVwbGFjZSgvXFxzKy9nLCAnICcpLnRyaW0oKS5yZXBsYWNlKC9cXGJcXHcvZywgYyA9PiBjLnRvVXBwZXJDYXNlKCkpO1xufVxuXG4vKipcbiAqIE1hcCBGaWdtYSdzIElNQUdFIGZpbGwgc2NhbGVNb2RlIHRvIENTUyBvYmplY3QtZml0LlxuICogICBGSUxMIChkZWZhdWx0KSBcdTIxOTIgY292ZXJcbiAqICAgRklUICAgICAgICAgICAgXHUyMTkyIGNvbnRhaW4gKGltYWdlIHZpc2libGUgaW4gZnVsbCwgbGV0dGVyYm94IGlmIG5lZWRlZClcbiAqICAgQ1JPUCAgICAgICAgICAgXHUyMTkyIGNvdmVyIChvYmplY3QtcG9zaXRpb24gaGFuZGxlZCBzZXBhcmF0ZWx5IHZpYSBpbWFnZVRyYW5zZm9ybSlcbiAqICAgVElMRSAgICAgICAgICAgXHUyMTkyIGNvdmVyIChubyBkaXJlY3QgQ1NTIGVxdWl2YWxlbnQpXG4gKi9cbmZ1bmN0aW9uIGdldEltYWdlT2JqZWN0Rml0KG5vZGU6IGFueSk6IHN0cmluZyB7XG4gIGlmICghbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuICdjb3Zlcic7XG4gIGNvbnN0IGltZ0ZpbGwgPSBub2RlLmZpbGxzLmZpbmQoKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSkgYXMgSW1hZ2VQYWludCB8IHVuZGVmaW5lZDtcbiAgaWYgKCFpbWdGaWxsKSByZXR1cm4gJ2NvdmVyJztcbiAgc3dpdGNoIChpbWdGaWxsLnNjYWxlTW9kZSkge1xuICAgIGNhc2UgJ0ZJVCc6IHJldHVybiAnY29udGFpbic7XG4gICAgY2FzZSAnRklMTCc6XG4gICAgY2FzZSAnQ1JPUCc6XG4gICAgY2FzZSAnVElMRSc6XG4gICAgZGVmYXVsdDogcmV0dXJuICdjb3Zlcic7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBseSB0aGUgc2hhcmVkIG9wdGlvbmFsLXNpZ25hbCBmaWVsZHMgKGNvbXBvbmVudEluc3RhbmNlLCB3aWR0aE1vZGUsXG4gKiBoZWlnaHRNb2RlLCB2YXJCaW5kaW5ncykgdG8gYW4gZWxlbWVudC4gQ2VudHJhbGl6ZWQgc28gZXZlcnkgZWxlbWVudFxuICoga2luZCAodGV4dCwgaW1hZ2UsIGJ1dHRvbiwgaW5wdXQpIGJlbmVmaXRzIGNvbnNpc3RlbnRseS5cbiAqL1xuZnVuY3Rpb24gYXBwbHlDb21tb25TaWduYWxzKGVsZW06IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4sIG5vZGU6IFNjZW5lTm9kZSk6IHZvaWQge1xuICBjb25zdCBjbXAgPSBleHRyYWN0Q29tcG9uZW50SW5zdGFuY2Uobm9kZSk7XG4gIGlmIChjbXApIGVsZW0uY29tcG9uZW50SW5zdGFuY2UgPSBjbXA7XG5cbiAgY29uc3Qgc2l6ZSA9IGV4dHJhY3RTaXppbmdNb2Rlcyhub2RlKTtcbiAgaWYgKHNpemUud2lkdGhNb2RlKSBlbGVtLndpZHRoTW9kZSA9IHNpemUud2lkdGhNb2RlO1xuICBpZiAoc2l6ZS5oZWlnaHRNb2RlKSBlbGVtLmhlaWdodE1vZGUgPSBzaXplLmhlaWdodE1vZGU7XG5cbiAgY29uc3QgdmFycyA9IGV4dHJhY3RCb3VuZFZhcmlhYmxlcyhub2RlKTtcbiAgaWYgKHZhcnMpIGVsZW0udmFyQmluZGluZ3MgPSB2YXJzO1xufVxuXG4vKipcbiAqIEZpbmQgYW5kIGNsYXNzaWZ5IGFsbCBtZWFuaW5nZnVsIGVsZW1lbnRzIHdpdGhpbiBhIHNlY3Rpb24uXG4gKiBXYWxrcyB0aGUgbm9kZSB0cmVlIGFuZCBleHRyYWN0cyB0eXBvZ3JhcGh5IGZvciBURVhUIG5vZGVzLFxuICogZGltZW5zaW9ucyBmb3IgaW1hZ2UgY29udGFpbmVycywgZXRjLlxuICovXG5mdW5jdGlvbiBleHRyYWN0RWxlbWVudHMoc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSk6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8RWxlbWVudFN0eWxlcz4+IHtcbiAgY29uc3QgZWxlbWVudHM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8RWxlbWVudFN0eWxlcz4+ID0ge307XG4gIGxldCB0ZXh0SW5kZXggPSAwO1xuICBsZXQgaW1hZ2VJbmRleCA9IDA7XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIpIHtcbiAgICAvLyBURVhUIG5vZGVzIFx1MjE5MiB0eXBvZ3JhcGh5ICsgdGV4dCBjb250ZW50XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCB0eXBvID0gZXh0cmFjdFR5cG9ncmFwaHkobm9kZSk7XG4gICAgICBjb25zdCBmb250U2l6ZSA9IG5vZGUuZm9udFNpemUgIT09IGZpZ21hLm1peGVkID8gKG5vZGUuZm9udFNpemUgYXMgbnVtYmVyKSA6IDE2O1xuXG4gICAgICAvLyBDbGFzc2lmeSBieSByb2xlOiBoZWFkaW5ncyBhcmUgbGFyZ2VyLCBib2R5IHRleHQgaXMgc21hbGxlclxuICAgICAgbGV0IHJvbGU6IHN0cmluZztcbiAgICAgIGlmICh0ZXh0SW5kZXggPT09IDAgJiYgZm9udFNpemUgPj0gMjgpIHtcbiAgICAgICAgcm9sZSA9ICdoZWFkaW5nJztcbiAgICAgIH0gZWxzZSBpZiAodGV4dEluZGV4ID09PSAxICYmIGZvbnRTaXplID49IDE2KSB7XG4gICAgICAgIHJvbGUgPSAnc3ViaGVhZGluZyc7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdidXR0b24nKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY3RhJykpIHtcbiAgICAgICAgcm9sZSA9ICdidXR0b25fdGV4dCc7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjYXB0aW9uJykgfHwgZm9udFNpemUgPD0gMTQpIHtcbiAgICAgICAgcm9sZSA9IGBjYXB0aW9uJHt0ZXh0SW5kZXggPiAyID8gJ18nICsgdGV4dEluZGV4IDogJyd9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvbGUgPSBgdGV4dF8ke3RleHRJbmRleH1gO1xuICAgICAgfVxuXG4gICAgICAvLyBVc2UgdGhlIGxheWVyIG5hbWUgaWYgaXQncyBub3QgYSBkZWZhdWx0IG5hbWVcbiAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIGlmIChjbGVhbk5hbWUgJiYgIS9eKHRleHR8ZnJhbWV8Z3JvdXB8cmVjdGFuZ2xlKVxcZCokLy50ZXN0KGNsZWFuTmFtZSkpIHtcbiAgICAgICAgcm9sZSA9IGNsZWFuTmFtZTtcbiAgICAgIH1cblxuICAgICAgLy8gRXh0cmFjdCBhY3R1YWwgdGV4dCBjb250ZW50IGZvciBjb250ZW50IHBvcHVsYXRpb24gYW5kIGNvbnRleHRcbiAgICAgIHR5cG8udGV4dENvbnRlbnQgPSBub2RlLmNoYXJhY3RlcnMgfHwgbnVsbDtcblxuICAgICAgLy8gUGVyLXNpZGUgbWFyZ2lucyBmcm9tIHNpYmxpbmcgc3BhY2luZyAodG9wL3JpZ2h0L2JvdHRvbS9sZWZ0KVxuICAgICAgT2JqZWN0LmFzc2lnbih0eXBvLCBleHRyYWN0UGVyU2lkZU1hcmdpbnMobm9kZSkpO1xuXG4gICAgICAvLyBGbGV4LWNoaWxkIHByb3BlcnRpZXMgKGxheW91dEdyb3cgLyBsYXlvdXRBbGlnbilcbiAgICAgIE9iamVjdC5hc3NpZ24odHlwbywgZXh0cmFjdEZsZXhDaGlsZFByb3BzKG5vZGUpKTtcblxuICAgICAgLy8gVHJhbnNmb3JtIChyb3RhdGUvc2NhbGUpIGlmIG5vbi1pZGVudGl0eVxuICAgICAgY29uc3QgdHggPSBleHRyYWN0VHJhbnNmb3JtKG5vZGUpO1xuICAgICAgaWYgKHR4LnRyYW5zZm9ybSkgdHlwby50cmFuc2Zvcm0gPSB0eC50cmFuc2Zvcm07XG5cbiAgICAgIC8vIExpbmsgVVJMIGZyb20gcHJvdG90eXBlIG5hdmlnYXRpb25cbiAgICAgIGNvbnN0IGhyZWYgPSBleHRyYWN0TGlua1VybChub2RlKTtcbiAgICAgIGlmIChocmVmKSB0eXBvLmxpbmtVcmwgPSBocmVmO1xuXG4gICAgICAvLyBNYXggd2lkdGggaWYgY29uc3RyYWluZWRcbiAgICAgIGlmIChub2RlLmFic29sdXRlQm91bmRpbmdCb3ggJiYgbm9kZS5wYXJlbnQ/LnR5cGUgPT09ICdGUkFNRScpIHtcbiAgICAgICAgY29uc3QgcGFyZW50V2lkdGggPSAobm9kZS5wYXJlbnQgYXMgRnJhbWVOb2RlKS5hYnNvbHV0ZUJvdW5kaW5nQm94Py53aWR0aDtcbiAgICAgICAgaWYgKHBhcmVudFdpZHRoICYmIG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveC53aWR0aCA8IHBhcmVudFdpZHRoICogMC45KSB7XG4gICAgICAgICAgdHlwby5tYXhXaWR0aCA9IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChub2RlLmFic29sdXRlQm91bmRpbmdCb3gud2lkdGgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBDb21tb24gc2lnbmFsczogY29tcG9uZW50SW5zdGFuY2UsIHNpemluZyBtb2RlcywgYm91bmQgdmFyaWFibGVzXG4gICAgICBhcHBseUNvbW1vblNpZ25hbHModHlwbywgbm9kZSk7XG5cbiAgICAgIGVsZW1lbnRzW3JvbGVdID0gdHlwbztcbiAgICAgIHRleHRJbmRleCsrO1xuICAgIH1cblxuICAgIC8vIElNQUdFIGZpbGxzIFx1MjE5MiBpbWFnZSBlbGVtZW50ICh3aXRoIHNtYXJ0IGJhY2tncm91bmQgZGV0ZWN0aW9uKVxuICAgIGlmIChoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpICYmIG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCkge1xuICAgICAgY29uc3QgYm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuXG4gICAgICAvLyBTbWFydCBiYWNrZ3JvdW5kIGltYWdlIGRldGVjdGlvbjpcbiAgICAgIC8vIDEuIExheWVyIG5hbWUgY29udGFpbnMgJ2JhY2tncm91bmQnIG9yICdiZycgT1JcbiAgICAgIC8vIDIuIEltYWdlIHNwYW5zID49IDkwJSBvZiB0aGUgc2VjdGlvbidzIHdpZHRoIEFORCBoZWlnaHQgKGZ1bGwtYmxlZWQgaW1hZ2UpXG4gICAgICBjb25zdCBuYW1lSGludHNCZyA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdiYWNrZ3JvdW5kJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2JnJyk7XG4gICAgICBjb25zdCBzZWN0aW9uQm91bmRzID0gc2VjdGlvbk5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgIGNvbnN0IHNwYW5zU2VjdGlvbiA9IHNlY3Rpb25Cb3VuZHMgJiZcbiAgICAgICAgYm91bmRzLndpZHRoID49IHNlY3Rpb25Cb3VuZHMud2lkdGggKiAwLjkgJiZcbiAgICAgICAgYm91bmRzLmhlaWdodCA+PSBzZWN0aW9uQm91bmRzLmhlaWdodCAqIDAuOTtcblxuICAgICAgY29uc3QgaXNCYWNrZ3JvdW5kSW1hZ2UgPSBuYW1lSGludHNCZyB8fCBzcGFuc1NlY3Rpb247XG5cbiAgICAgIGNvbnN0IHJvbGUgPSBpc0JhY2tncm91bmRJbWFnZVxuICAgICAgICA/ICdiYWNrZ3JvdW5kX2ltYWdlJ1xuICAgICAgICA6IGBpbWFnZSR7aW1hZ2VJbmRleCA+IDAgPyAnXycgKyBpbWFnZUluZGV4IDogJyd9YDtcblxuICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgY29uc3QgZmluYWxSb2xlID0gY2xlYW5OYW1lICYmICEvXihpbWFnZXxyZWN0YW5nbGV8ZnJhbWUpXFxkKiQvLnRlc3QoY2xlYW5OYW1lKSA/IGNsZWFuTmFtZSA6IHJvbGU7XG5cbiAgICAgIC8vIERldGVjdCBtYXNrL2NsaXAgb24gaW1hZ2Ugb3IgaXRzIHBhcmVudCBjb250YWluZXJcbiAgICAgIGNvbnN0IHBhcmVudEZyYW1lID0gbm9kZS5wYXJlbnQ7XG4gICAgICBjb25zdCBwYXJlbnRDbGlwcyA9IHBhcmVudEZyYW1lICYmICdjbGlwc0NvbnRlbnQnIGluIHBhcmVudEZyYW1lICYmIChwYXJlbnRGcmFtZSBhcyBhbnkpLmNsaXBzQ29udGVudCA9PT0gdHJ1ZTtcbiAgICAgIGNvbnN0IGlzTWFza2VkID0gKCdpc01hc2snIGluIG5vZGUgJiYgKG5vZGUgYXMgYW55KS5pc01hc2sgPT09IHRydWUpIHx8IHBhcmVudENsaXBzO1xuICAgICAgLy8gRGV0ZWN0IGNpcmN1bGFyL3JvdW5kZWQgY2xpcHM6IGlmIHBhcmVudCBoYXMgZXF1YWwgY29ybmVyUmFkaXVzIGFuZCBpcyByb3VnaGx5IHNxdWFyZVxuICAgICAgbGV0IGNsaXBCb3JkZXJSYWRpdXM6IHN0cmluZyB8IG51bGwgPSAnY29ybmVyUmFkaXVzJyBpbiBub2RlICYmIHR5cGVvZiAobm9kZSBhcyBhbnkpLmNvcm5lclJhZGl1cyA9PT0gJ251bWJlcidcbiAgICAgICAgPyB0b0Nzc1ZhbHVlKChub2RlIGFzIGFueSkuY29ybmVyUmFkaXVzKVxuICAgICAgICA6IG51bGw7XG4gICAgICBpZiAoIWNsaXBCb3JkZXJSYWRpdXMgJiYgcGFyZW50RnJhbWUgJiYgJ2Nvcm5lclJhZGl1cycgaW4gcGFyZW50RnJhbWUgJiYgdHlwZW9mIChwYXJlbnRGcmFtZSBhcyBhbnkpLmNvcm5lclJhZGl1cyA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgY29uc3QgcGFyZW50Q29ybmVyID0gKHBhcmVudEZyYW1lIGFzIGFueSkuY29ybmVyUmFkaXVzIGFzIG51bWJlcjtcbiAgICAgICAgaWYgKHBhcmVudENvcm5lciA+IDApIHtcbiAgICAgICAgICBjb25zdCBwYXJlbnRCb3VuZHMgPSAocGFyZW50RnJhbWUgYXMgYW55KS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgICAgIC8vIElmIHBhcmVudCBpcyByb3VnaGx5IHNxdWFyZSBhbmQgY29ybmVyUmFkaXVzID49IGhhbGYgdGhlIHdpZHRoIFx1MjE5MiBjaXJjbGVcbiAgICAgICAgICBpZiAocGFyZW50Qm91bmRzICYmIE1hdGguYWJzKHBhcmVudEJvdW5kcy53aWR0aCAtIHBhcmVudEJvdW5kcy5oZWlnaHQpIDwgNSAmJiBwYXJlbnRDb3JuZXIgPj0gcGFyZW50Qm91bmRzLndpZHRoIC8gMiAtIDIpIHtcbiAgICAgICAgICAgIGNsaXBCb3JkZXJSYWRpdXMgPSAnNTAlJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xpcEJvcmRlclJhZGl1cyA9IHRvQ3NzVmFsdWUocGFyZW50Q29ybmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgaW1nRWZmZWN0cyA9IGV4dHJhY3RFZmZlY3RzKG5vZGUgYXMgYW55KTtcbiAgICAgIGNvbnN0IGltZ09iamVjdFBvc2l0aW9uID0gZXh0cmFjdE9iamVjdFBvc2l0aW9uKG5vZGUpO1xuICAgICAgY29uc3QgaW1nQ29ybmVycyA9IGV4dHJhY3RQZXJDb3JuZXJSYWRpdXMobm9kZSBhcyBhbnkpO1xuICAgICAgY29uc3QgaW1nRWxlbTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHtcbiAgICAgICAgd2lkdGg6IGlzQmFja2dyb3VuZEltYWdlID8gJzEwMCUnIDogdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKGJvdW5kcy53aWR0aCkpLFxuICAgICAgICBoZWlnaHQ6IGlzQmFja2dyb3VuZEltYWdlID8gJzEwMCUnIDogJ2F1dG8nLFxuICAgICAgICBhc3BlY3RSYXRpbzogaXNCYWNrZ3JvdW5kSW1hZ2UgPyBudWxsIDogY29tcHV0ZUFzcGVjdFJhdGlvKGJvdW5kcy53aWR0aCwgYm91bmRzLmhlaWdodCksXG4gICAgICAgIG9iamVjdEZpdDogZ2V0SW1hZ2VPYmplY3RGaXQobm9kZSBhcyBhbnkpLFxuICAgICAgICBvYmplY3RQb3NpdGlvbjogaW1nT2JqZWN0UG9zaXRpb24sXG4gICAgICAgIG92ZXJmbG93OiAocGFyZW50Q2xpcHMgfHwgY2xpcEJvcmRlclJhZGl1cykgPyAnaGlkZGVuJyA6IG51bGwsXG4gICAgICAgIGhhc01hc2s6IGlzTWFza2VkIHx8IG51bGwsXG4gICAgICAgIGJveFNoYWRvdzogaW1nRWZmZWN0cy5ib3hTaGFkb3csXG4gICAgICAgIGZpbHRlcjogaW1nRWZmZWN0cy5maWx0ZXIsXG4gICAgICAgIC8vIE1hcmsgYmFja2dyb3VuZCBpbWFnZXMgd2l0aCBwb3NpdGlvbiBkYXRhIHNvIGFnZW50cyBrbm93IHRvIHVzZSBDU1MgYmFja2dyb3VuZC1pbWFnZVxuICAgICAgICBwb3NpdGlvbjogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnYWJzb2x1dGUnIDogbnVsbCxcbiAgICAgICAgdG9wOiBpc0JhY2tncm91bmRJbWFnZSA/ICcwcHgnIDogbnVsbCxcbiAgICAgICAgbGVmdDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnMHB4JyA6IG51bGwsXG4gICAgICAgIHpJbmRleDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAwIDogbnVsbCxcbiAgICAgIH07XG4gICAgICBjb25zdCBpbWdBbHQgPSBleHRyYWN0QWx0VGV4dChub2RlKTtcbiAgICAgIGlmIChpbWdBbHQpIGltZ0VsZW0uYWx0ID0gaW1nQWx0O1xuICAgICAgYXBwbHlDb21tb25TaWduYWxzKGltZ0VsZW0sIG5vZGUpO1xuICAgICAgLy8gQXBwbHkgcmFkaXVzIFx1MjAxNCBwZXItY29ybmVyIGlmIG5vZGUgaGFzIGRpZmZlcmluZyBjb3JuZXJzLCB1bmlmb3JtIG90aGVyd2lzZVxuICAgICAgaWYgKGltZ0Nvcm5lcnMpIHtcbiAgICAgICAgaWYgKGltZ0Nvcm5lcnMudW5pZm9ybSAhPT0gbnVsbCkge1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyUmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLnVuaWZvcm0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyVG9wTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoaW1nQ29ybmVycy50b3BMZWZ0KTtcbiAgICAgICAgICBpbWdFbGVtLmJvcmRlclRvcFJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLnRvcFJpZ2h0KTtcbiAgICAgICAgICBpbWdFbGVtLmJvcmRlckJvdHRvbUxlZnRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGltZ0Nvcm5lcnMuYm90dG9tTGVmdCk7XG4gICAgICAgICAgaW1nRWxlbS5ib3JkZXJCb3R0b21SaWdodFJhZGl1cyA9IHRvQ3NzVmFsdWUoaW1nQ29ybmVycy5ib3R0b21SaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2xpcEJvcmRlclJhZGl1cykge1xuICAgICAgICBpbWdFbGVtLmJvcmRlclJhZGl1cyA9IGNsaXBCb3JkZXJSYWRpdXM7XG4gICAgICB9XG4gICAgICAvLyBGbGV4LWNoaWxkIHByb3BzIGlmIGltYWdlIGlzIGluc2lkZSBhbiBhdXRvLWxheW91dCByb3dcbiAgICAgIE9iamVjdC5hc3NpZ24oaW1nRWxlbSwgZXh0cmFjdEZsZXhDaGlsZFByb3BzKG5vZGUpKTtcbiAgICAgIGVsZW1lbnRzW2ZpbmFsUm9sZV0gPSBpbWdFbGVtO1xuICAgICAgaW1hZ2VJbmRleCsrO1xuICAgIH1cblxuICAgIC8vIEJ1dHRvbi1saWtlIGZyYW1lcyAoc21hbGwgZnJhbWVzIHdpdGggdGV4dCArIGZpbGwpXG4gICAgaWYgKChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcpICYmXG4gICAgICAgIG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdidXR0b24nKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYnRuJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2N0YScpKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgY29uc3QgYmcgPSBleHRyYWN0QmFja2dyb3VuZENvbG9yKGZyYW1lKTtcbiAgICAgIGNvbnN0IGJvdW5kcyA9IGZyYW1lLmFic29sdXRlQm91bmRpbmdCb3g7XG5cbiAgICAgIGlmIChiZyAmJiBib3VuZHMpIHtcbiAgICAgICAgY29uc3QgYnV0dG9uU3R5bGVzOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge1xuICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogYmcsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGZyYW1lLmxheW91dE1vZGUgJiYgZnJhbWUubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgICAgICAgYnV0dG9uU3R5bGVzLnBhZGRpbmdUb3AgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdUb3ApO1xuICAgICAgICAgIGJ1dHRvblN0eWxlcy5wYWRkaW5nQm90dG9tID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nQm90dG9tKTtcbiAgICAgICAgICBidXR0b25TdHlsZXMucGFkZGluZ0xlZnQgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdMZWZ0KTtcbiAgICAgICAgICBidXR0b25TdHlsZXMucGFkZGluZ1JpZ2h0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nUmlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXBwbHlSYWRpdXMoYnV0dG9uU3R5bGVzLCBmcmFtZSk7XG4gICAgICAgIGFwcGx5U3Ryb2tlcyhidXR0b25TdHlsZXMsIGZyYW1lKTtcbiAgICAgICAgY29uc3QgYnRuRWZmZWN0cyA9IGV4dHJhY3RFZmZlY3RzKGZyYW1lIGFzIGFueSk7XG4gICAgICAgIGlmIChidG5FZmZlY3RzLmJveFNoYWRvdykgYnV0dG9uU3R5bGVzLmJveFNoYWRvdyA9IGJ0bkVmZmVjdHMuYm94U2hhZG93O1xuICAgICAgICBpZiAoYnRuRWZmZWN0cy5maWx0ZXIpIGJ1dHRvblN0eWxlcy5maWx0ZXIgPSBidG5FZmZlY3RzLmZpbHRlcjtcblxuICAgICAgICBjb25zdCB0eCA9IGV4dHJhY3RUcmFuc2Zvcm0oZnJhbWUgYXMgYW55KTtcbiAgICAgICAgaWYgKHR4LnRyYW5zZm9ybSkgYnV0dG9uU3R5bGVzLnRyYW5zZm9ybSA9IHR4LnRyYW5zZm9ybTtcblxuICAgICAgICAvLyBMaW5rIFVSTCBmcm9tIHByb3RvdHlwZSBPUEVOX1VSTCBhY3Rpb25cbiAgICAgICAgY29uc3QgaHJlZiA9IGV4dHJhY3RMaW5rVXJsKGZyYW1lKTtcbiAgICAgICAgaWYgKGhyZWYpIGJ1dHRvblN0eWxlcy5saW5rVXJsID0gaHJlZjtcblxuICAgICAgICAvLyBGaW5kIHRoZSB0ZXh0IG5vZGUgaW5zaWRlIHRoZSBidXR0b24gZm9yIHR5cG9ncmFwaHlcbiAgICAgICAgY29uc3QgdGV4dENoaWxkID0gZmluZEZpcnN0VGV4dE5vZGUoZnJhbWUpO1xuICAgICAgICBpZiAodGV4dENoaWxkKSB7XG4gICAgICAgICAgY29uc3QgdHlwbyA9IGV4dHJhY3RUeXBvZ3JhcGh5KHRleHRDaGlsZCk7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbihidXR0b25TdHlsZXMsIHR5cG8pO1xuICAgICAgICAgIGJ1dHRvblN0eWxlcy50ZXh0Q29udGVudCA9IHRleHRDaGlsZC5jaGFyYWN0ZXJzIHx8IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBPYmplY3QuYXNzaWduKGJ1dHRvblN0eWxlcywgZXh0cmFjdEZsZXhDaGlsZFByb3BzKGZyYW1lIGFzIGFueSkpO1xuXG4gICAgICAgIC8vIENvbW1vbiBzaWduYWxzOiBjb21wb25lbnRJbnN0YW5jZSAoYnV0dG9uIHZhcmlhbnRzISksIHNpemluZywgdmFyc1xuICAgICAgICBhcHBseUNvbW1vblNpZ25hbHMoYnV0dG9uU3R5bGVzLCBmcmFtZSk7XG5cbiAgICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgICBlbGVtZW50c1tjbGVhbk5hbWUgfHwgJ2J1dHRvbiddID0gYnV0dG9uU3R5bGVzO1xuICAgICAgfVxuICAgICAgcmV0dXJuOyAvLyBEb24ndCByZWN1cnNlIGludG8gYnV0dG9uIGludGVybmFsc1xuICAgIH1cblxuICAgIC8vIElucHV0LWxpa2UgZnJhbWVzIChkZXRlY3QgaW5wdXRzIGJ5IGNvbW1vbiBsYXllciBuYW1lcylcbiAgICBpZiAoKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJykgJiZcbiAgICAgICAgL1xcYihpbnB1dHxmaWVsZHx0ZXh0Ym94fHRleHRhcmVhfHNlbGVjdHx0ZXh0ZmllbGQpXFxiL2kudGVzdChub2RlLm5hbWUpKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgY29uc3QgaW5wdXRTdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogZXh0cmFjdEJhY2tncm91bmRDb2xvcihmcmFtZSksXG4gICAgICB9O1xuICAgICAgaWYgKGZyYW1lLmxheW91dE1vZGUgJiYgZnJhbWUubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgICAgIGlucHV0U3R5bGVzLnBhZGRpbmdUb3AgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdUb3ApO1xuICAgICAgICBpbnB1dFN0eWxlcy5wYWRkaW5nQm90dG9tID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nQm90dG9tKTtcbiAgICAgICAgaW5wdXRTdHlsZXMucGFkZGluZ0xlZnQgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdMZWZ0KTtcbiAgICAgICAgaW5wdXRTdHlsZXMucGFkZGluZ1JpZ2h0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nUmlnaHQpO1xuICAgICAgfVxuICAgICAgYXBwbHlSYWRpdXMoaW5wdXRTdHlsZXMsIGZyYW1lKTtcbiAgICAgIGFwcGx5U3Ryb2tlcyhpbnB1dFN0eWxlcywgZnJhbWUpO1xuICAgICAgY29uc3QgcGxhY2Vob2xkZXJUZXh0ID0gZmluZEZpcnN0VGV4dE5vZGUoZnJhbWUpO1xuICAgICAgaWYgKHBsYWNlaG9sZGVyVGV4dCkge1xuICAgICAgICBpbnB1dFN0eWxlcy5wbGFjZWhvbGRlciA9IHBsYWNlaG9sZGVyVGV4dC5jaGFyYWN0ZXJzIHx8IG51bGw7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyVHlwbyA9IGV4dHJhY3RUeXBvZ3JhcGh5KHBsYWNlaG9sZGVyVGV4dCk7XG4gICAgICAgIGlucHV0U3R5bGVzLnBsYWNlaG9sZGVyU3R5bGVzID0ge1xuICAgICAgICAgIGNvbG9yOiBwbGFjZWhvbGRlclR5cG8uY29sb3IgfHwgbnVsbCxcbiAgICAgICAgICBmb250U2l6ZTogcGxhY2Vob2xkZXJUeXBvLmZvbnRTaXplIHx8IG51bGwsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBhcHBseUNvbW1vblNpZ25hbHMoaW5wdXRTdHlsZXMsIGZyYW1lKTtcblxuICAgICAgY29uc3QgaW5wdXROYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpIHx8ICdpbnB1dCc7XG4gICAgICBlbGVtZW50c1tpbnB1dE5hbWVdID0gaW5wdXRTdHlsZXM7XG4gICAgICByZXR1cm47IC8vIERvbid0IHJlY3Vyc2UgaW50byBpbnB1dCBpbnRlcm5hbHNcbiAgICB9XG5cbiAgICAvLyBSZWN1cnNlIGludG8gY2hpbGRyZW4gKGRlcHRoIGxpbWl0IDYgdG8gY2FwdHVyZSBkZWVwbHkgbmVzdGVkIGVsZW1lbnRzKVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUgJiYgZGVwdGggPCA2KSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgd2FsayhjaGlsZCwgZGVwdGggKyAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdhbGsoc2VjdGlvbk5vZGUsIDApO1xuICByZXR1cm4gZWxlbWVudHM7XG59XG5cbi8qKlxuICogRmluZCB0aGUgZmlyc3QgVEVYVCBub2RlIGluIGEgc3VidHJlZS5cbiAqL1xuZnVuY3Rpb24gZmluZEZpcnN0VGV4dE5vZGUobm9kZTogU2NlbmVOb2RlKTogVGV4dE5vZGUgfCBudWxsIHtcbiAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSByZXR1cm4gbm9kZTtcbiAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgY29uc3QgZm91bmQgPSBmaW5kRmlyc3RUZXh0Tm9kZShjaGlsZCk7XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBsYXllciBpbmZvcm1hdGlvbiBmb3IgYWxsIG1lYW5pbmdmdWwgY2hpbGRyZW4gb2YgYSBzZWN0aW9uLlxuICogUmV0dXJucyBsYXllcnMgc29ydGVkIGJ5IEZpZ21hJ3MgbGF5ZXIgb3JkZXIgKGJhY2sgdG8gZnJvbnQpLlxuICogQm91bmRzIGFyZSByZWxhdGl2ZSB0byB0aGUgc2VjdGlvbidzIG9yaWdpbiwgbm90IHRoZSBjYW52YXMuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RMYXllcnMoc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSwgZWxlbWVudHM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8RWxlbWVudFN0eWxlcz4+KTogTGF5ZXJJbmZvW10ge1xuICBjb25zdCBsYXllcnM6IExheWVySW5mb1tdID0gW107XG4gIGNvbnN0IHNlY3Rpb25Cb3VuZHMgPSBzZWN0aW9uTm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICBpZiAoIXNlY3Rpb25Cb3VuZHMpIHJldHVybiBsYXllcnM7XG5cbiAgbGV0IGxheWVySW5kZXggPSAwO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgaWYgKCFub2RlLmFic29sdXRlQm91bmRpbmdCb3ggfHwgZGVwdGggPiA2KSByZXR1cm47XG5cbiAgICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgY29uc3QgcmVsQm91bmRzID0ge1xuICAgICAgeDogTWF0aC5yb3VuZChib3VuZHMueCAtIHNlY3Rpb25Cb3VuZHMhLngpLFxuICAgICAgeTogTWF0aC5yb3VuZChib3VuZHMueSAtIHNlY3Rpb25Cb3VuZHMhLnkpLFxuICAgICAgd2lkdGg6IE1hdGgucm91bmQoYm91bmRzLndpZHRoKSxcbiAgICAgIGhlaWdodDogTWF0aC5yb3VuZChib3VuZHMuaGVpZ2h0KSxcbiAgICB9O1xuXG4gICAgbGV0IHJvbGU6IExheWVySW5mb1sncm9sZSddIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IG5hbWUgPSAnJztcblxuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgcm9sZSA9ICd0ZXh0JztcbiAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIG5hbWUgPSBjbGVhbk5hbWUgJiYgIS9edGV4dFxcZCokLy50ZXN0KGNsZWFuTmFtZSkgPyBjbGVhbk5hbWUgOiBgdGV4dF8ke2xheWVySW5kZXh9YDtcbiAgICB9IGVsc2UgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkpIHtcbiAgICAgIGNvbnN0IG5hbWVIaW50c0JnID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2JhY2tncm91bmQnKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYmcnKTtcbiAgICAgIGNvbnN0IHNwYW5zU2VjdGlvbiA9IGJvdW5kcy53aWR0aCA+PSBzZWN0aW9uQm91bmRzIS53aWR0aCAqIDAuOSAmJiBib3VuZHMuaGVpZ2h0ID49IHNlY3Rpb25Cb3VuZHMhLmhlaWdodCAqIDAuOTtcbiAgICAgIHJvbGUgPSAobmFtZUhpbnRzQmcgfHwgc3BhbnNTZWN0aW9uKSA/ICdiYWNrZ3JvdW5kX2ltYWdlJyA6ICdpbWFnZSc7XG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBuYW1lID0gY2xlYW5OYW1lICYmICEvXihpbWFnZXxyZWN0YW5nbGV8ZnJhbWUpXFxkKiQvLnRlc3QoY2xlYW5OYW1lKSA/IGNsZWFuTmFtZSA6IChyb2xlID09PSAnYmFja2dyb3VuZF9pbWFnZScgPyAnYmFja2dyb3VuZF9pbWFnZScgOiBgaW1hZ2VfJHtsYXllckluZGV4fWApO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAobm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2J1dHRvbicpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdidG4nKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY3RhJykpICYmXG4gICAgICAobm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnKVxuICAgICkge1xuICAgICAgcm9sZSA9ICdidXR0b24nO1xuICAgICAgbmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKSB8fCAnYnV0dG9uJztcbiAgICB9XG5cbiAgICBpZiAocm9sZSkge1xuICAgICAgbGF5ZXJzLnB1c2goe1xuICAgICAgICBuYW1lLFxuICAgICAgICByb2xlLFxuICAgICAgICB0eXBlOiBub2RlLnR5cGUsXG4gICAgICAgIGJvdW5kczogcmVsQm91bmRzLFxuICAgICAgICB6SW5kZXg6IGxheWVySW5kZXgsXG4gICAgICAgIG92ZXJsYXBzOiBbXSwgLy8gZmlsbGVkIGluIGRldGVjdENvbXBvc2l0aW9uXG4gICAgICB9KTtcbiAgICAgIGxheWVySW5kZXgrKztcbiAgICB9XG5cbiAgICAvLyBSZWN1cnNlIChza2lwIGJ1dHRvbiBpbnRlcm5hbHMpXG4gICAgaWYgKHJvbGUgIT09ICdidXR0b24nICYmICdjaGlsZHJlbicgaW4gbm9kZSAmJiBkZXB0aCA8IDYpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB3YWxrKGNoaWxkLCBkZXB0aCArIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKCdjaGlsZHJlbicgaW4gc2VjdGlvbk5vZGUpIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChzZWN0aW9uTm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgd2FsayhjaGlsZCwgMCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGxheWVycztcbn1cblxuLyoqXG4gKiBEZXRlY3QgY29tcG9zaXRpb24gcGF0dGVybnM6IHRleHQtb3Zlci1pbWFnZSwgYmFja2dyb3VuZCBpbWFnZXMsIG92ZXJsYXkgc3RhY2tpbmcuXG4gKiBUd28gcmVjdGFuZ2xlcyBvdmVybGFwIGlmIHRoZXkgc2hhcmUgYW55IGFyZWEuXG4gKi9cbmZ1bmN0aW9uIGRldGVjdENvbXBvc2l0aW9uKGxheWVyczogTGF5ZXJJbmZvW10pOiBDb21wb3NpdGlvbkluZm8ge1xuICBjb25zdCBjb21wb3NpdGlvbjogQ29tcG9zaXRpb25JbmZvID0ge1xuICAgIGhhc1RleHRPdmVySW1hZ2U6IGZhbHNlLFxuICAgIGhhc0JhY2tncm91bmRJbWFnZTogZmFsc2UsXG4gICAgb3ZlcmxheUVsZW1lbnRzOiBbXSxcbiAgICBzdGFja2luZ09yZGVyOiBsYXllcnMubWFwKGwgPT4gbC5uYW1lKSxcbiAgfTtcblxuICBjb25zdCBiZ0ltYWdlTGF5ZXJzID0gbGF5ZXJzLmZpbHRlcihsID0+IGwucm9sZSA9PT0gJ2JhY2tncm91bmRfaW1hZ2UnKTtcbiAgY29uc3QgaW1hZ2VMYXllcnMgPSBsYXllcnMuZmlsdGVyKGwgPT4gbC5yb2xlID09PSAnaW1hZ2UnIHx8IGwucm9sZSA9PT0gJ2JhY2tncm91bmRfaW1hZ2UnKTtcbiAgY29uc3QgdGV4dExheWVycyA9IGxheWVycy5maWx0ZXIobCA9PiBsLnJvbGUgPT09ICd0ZXh0Jyk7XG4gIGNvbnN0IGJ1dHRvbkxheWVycyA9IGxheWVycy5maWx0ZXIobCA9PiBsLnJvbGUgPT09ICdidXR0b24nKTtcblxuICBpZiAoYmdJbWFnZUxheWVycy5sZW5ndGggPiAwKSB7XG4gICAgY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIENoZWNrIGZvciBib3VuZGluZyBib3ggb3ZlcmxhcHMgYmV0d2VlbiB0ZXh0L2J1dHRvbnMgYW5kIGltYWdlc1xuICBmb3IgKGNvbnN0IHRleHRMYXllciBvZiBbLi4udGV4dExheWVycywgLi4uYnV0dG9uTGF5ZXJzXSkge1xuICAgIGZvciAoY29uc3QgaW1nTGF5ZXIgb2YgaW1hZ2VMYXllcnMpIHtcbiAgICAgIGNvbnN0IHRiID0gdGV4dExheWVyLmJvdW5kcztcbiAgICAgIGNvbnN0IGliID0gaW1nTGF5ZXIuYm91bmRzO1xuXG4gICAgICAvLyBDaGVjayByZWN0YW5nbGUgb3ZlcmxhcFxuICAgICAgY29uc3Qgb3ZlcmxhcHNIb3Jpem9udGFsbHkgPSB0Yi54IDwgaWIueCArIGliLndpZHRoICYmIHRiLnggKyB0Yi53aWR0aCA+IGliLng7XG4gICAgICBjb25zdCBvdmVybGFwc1ZlcnRpY2FsbHkgPSB0Yi55IDwgaWIueSArIGliLmhlaWdodCAmJiB0Yi55ICsgdGIuaGVpZ2h0ID4gaWIueTtcblxuICAgICAgaWYgKG92ZXJsYXBzSG9yaXpvbnRhbGx5ICYmIG92ZXJsYXBzVmVydGljYWxseSkge1xuICAgICAgICAvLyBUZXh0L2J1dHRvbiBvdmVybGFwcyB3aXRoIGltYWdlXG4gICAgICAgIHRleHRMYXllci5vdmVybGFwcy5wdXNoKGltZ0xheWVyLm5hbWUpO1xuICAgICAgICBpbWdMYXllci5vdmVybGFwcy5wdXNoKHRleHRMYXllci5uYW1lKTtcblxuICAgICAgICBpZiAoIWNvbXBvc2l0aW9uLmhhc1RleHRPdmVySW1hZ2UpIHtcbiAgICAgICAgICBjb21wb3NpdGlvbi5oYXNUZXh0T3ZlckltYWdlID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVsZW1lbnRzIHdpdGggaGlnaGVyIHpJbmRleCB0aGF0IG92ZXJsYXAgaW1hZ2VzIGFyZSBvdmVybGF5c1xuICAgICAgICBpZiAodGV4dExheWVyLnpJbmRleCA+IGltZ0xheWVyLnpJbmRleCkge1xuICAgICAgICAgIGlmICghY29tcG9zaXRpb24ub3ZlcmxheUVsZW1lbnRzLmluY2x1ZGVzKHRleHRMYXllci5uYW1lKSkge1xuICAgICAgICAgICAgY29tcG9zaXRpb24ub3ZlcmxheUVsZW1lbnRzLnB1c2godGV4dExheWVyLm5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIHRoZXJlJ3MgYSBiYWNrZ3JvdW5kIGltYWdlLCBBTEwgbm9uLWJhY2tncm91bmQgZWxlbWVudHMgYXJlIG92ZXJsYXlzXG4gIGlmIChjb21wb3NpdGlvbi5oYXNCYWNrZ3JvdW5kSW1hZ2UpIHtcbiAgICBmb3IgKGNvbnN0IGxheWVyIG9mIGxheWVycykge1xuICAgICAgaWYgKGxheWVyLnJvbGUgIT09ICdiYWNrZ3JvdW5kX2ltYWdlJyAmJiAhY29tcG9zaXRpb24ub3ZlcmxheUVsZW1lbnRzLmluY2x1ZGVzKGxheWVyLm5hbWUpKSB7XG4gICAgICAgIGNvbXBvc2l0aW9uLm92ZXJsYXlFbGVtZW50cy5wdXNoKGxheWVyLm5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb21wb3NpdGlvbjtcbn1cblxuLyoqXG4gKiBEZXRlY3QgaWYgYSBzZWN0aW9uIGNvbnRhaW5zIGZvcm0tbGlrZSBlbGVtZW50cy5cbiAqIExvb2tzIGZvciBwYXR0ZXJuczogaW5wdXQgcmVjdGFuZ2xlcyAobmFycm93IGhlaWdodCBmcmFtZXMpLCBsYWJlbHMgKHNtYWxsIHRleHQgbmVhciBpbnB1dHMpLFxuICogc3VibWl0IGJ1dHRvbnMsIGFuZCBjb21tb24gZm9ybS1yZWxhdGVkIGxheWVyIG5hbWVzLlxuICovXG5mdW5jdGlvbiBkZXRlY3RGb3JtU2VjdGlvbihzZWN0aW9uTm9kZTogU2NlbmVOb2RlKTogeyBpc0Zvcm06IGJvb2xlYW47IGZpZWxkczogRm9ybUZpZWxkSW5mb1tdIH0ge1xuICBjb25zdCBmb3JtS2V5d29yZHMgPSBbJ2Zvcm0nLCAnaW5wdXQnLCAnZmllbGQnLCAnY29udGFjdCcsICdzdWJzY3JpYmUnLCAnbmV3c2xldHRlcicsICdzaWdudXAnLCAnc2lnbi11cCcsICdlbnF1aXJ5JywgJ2lucXVpcnknXTtcbiAgY29uc3QgaW5wdXRLZXl3b3JkcyA9IFsnaW5wdXQnLCAnZmllbGQnLCAndGV4dC1maWVsZCcsICd0ZXh0ZmllbGQnLCAndGV4dF9maWVsZCcsICdlbWFpbCcsICdwaG9uZScsICduYW1lJywgJ21lc3NhZ2UnLCAndGV4dGFyZWEnXTtcbiAgY29uc3Qgc3VibWl0S2V5d29yZHMgPSBbJ3N1Ym1pdCcsICdzZW5kJywgJ2J1dHRvbicsICdjdGEnLCAnYnRuJ107XG5cbiAgY29uc3Qgc2VjdGlvbk5hbWUgPSBzZWN0aW9uTm9kZS5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IG5hbWVIaW50c0Zvcm0gPSBmb3JtS2V5d29yZHMuc29tZShrdyA9PiBzZWN0aW9uTmFtZS5pbmNsdWRlcyhrdykpO1xuXG4gIGxldCBpbnB1dENvdW50ID0gMDtcbiAgbGV0IGhhc1N1Ym1pdEJ1dHRvbiA9IGZhbHNlO1xuICBjb25zdCBmaWVsZHM6IEZvcm1GaWVsZEluZm9bXSA9IFtdO1xuICBjb25zdCB0ZXh0Tm9kZXM6IHsgbmFtZTogc3RyaW5nOyB0ZXh0OiBzdHJpbmc7IHk6IG51bWJlciB9W10gPSBbXTtcbiAgY29uc3QgaW5wdXROb2RlczogeyBuYW1lOiBzdHJpbmc7IHk6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfVtdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBjb25zdCBuYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAvLyBEZXRlY3QgaW5wdXQtbGlrZSBmcmFtZXM6IG5hcnJvdyBoZWlnaHQgKDMwLTYwcHgpLCB3aWRlciB0aGFuIHRhbGwsIHdpdGggYm9yZGVyL2ZpbGxcbiAgICBpZiAoKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdSRUNUQU5HTEUnKSAmJiBub2RlLmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICAgIGNvbnN0IGIgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICBjb25zdCBpc0lucHV0U2hhcGUgPSBiLmhlaWdodCA+PSAzMCAmJiBiLmhlaWdodCA8PSA3MCAmJiBiLndpZHRoID4gYi5oZWlnaHQgKiAyO1xuICAgICAgY29uc3QgaGFzSW5wdXROYW1lID0gaW5wdXRLZXl3b3Jkcy5zb21lKGt3ID0+IG5hbWUuaW5jbHVkZXMoa3cpKTtcblxuICAgICAgaWYgKGlzSW5wdXRTaGFwZSAmJiAoaGFzSW5wdXROYW1lIHx8IG5hbWVIaW50c0Zvcm0pKSB7XG4gICAgICAgIGlucHV0Q291bnQrKztcbiAgICAgICAgaW5wdXROb2Rlcy5wdXNoKHsgbmFtZTogbm9kZS5uYW1lLCB5OiBiLnksIGhlaWdodDogYi5oZWlnaHQgfSk7XG5cbiAgICAgICAgLy8gRGV0ZWN0IGZpZWxkIHR5cGUgZnJvbSBuYW1lXG4gICAgICAgIGxldCBmaWVsZFR5cGU6IEZvcm1GaWVsZEluZm9bJ3R5cGUnXSA9ICd0ZXh0JztcbiAgICAgICAgaWYgKG5hbWUuaW5jbHVkZXMoJ2VtYWlsJykpIGZpZWxkVHlwZSA9ICdlbWFpbCc7XG4gICAgICAgIGVsc2UgaWYgKG5hbWUuaW5jbHVkZXMoJ3Bob25lJykgfHwgbmFtZS5pbmNsdWRlcygndGVsJykpIGZpZWxkVHlwZSA9ICdwaG9uZSc7XG4gICAgICAgIGVsc2UgaWYgKG5hbWUuaW5jbHVkZXMoJ3RleHRhcmVhJykgfHwgbmFtZS5pbmNsdWRlcygnbWVzc2FnZScpIHx8IChiLmhlaWdodCA+IDgwKSkgZmllbGRUeXBlID0gJ3RleHRhcmVhJztcbiAgICAgICAgZWxzZSBpZiAobmFtZS5pbmNsdWRlcygnc2VsZWN0JykgfHwgbmFtZS5pbmNsdWRlcygnZHJvcGRvd24nKSkgZmllbGRUeXBlID0gJ3NlbGVjdCc7XG4gICAgICAgIGVsc2UgaWYgKG5hbWUuaW5jbHVkZXMoJ2NoZWNrYm94JykgfHwgbmFtZS5pbmNsdWRlcygnY2hlY2snKSkgZmllbGRUeXBlID0gJ2NoZWNrYm94JztcbiAgICAgICAgZWxzZSBpZiAobmFtZS5pbmNsdWRlcygncmFkaW8nKSkgZmllbGRUeXBlID0gJ3JhZGlvJztcblxuICAgICAgICBmaWVsZHMucHVzaCh7XG4gICAgICAgICAgbGFiZWw6IG5vZGUubmFtZS5yZXBsYWNlKC9bLV9dL2csICcgJykucmVwbGFjZSgvXFxiXFx3L2csIGMgPT4gYy50b1VwcGVyQ2FzZSgpKSxcbiAgICAgICAgICB0eXBlOiBmaWVsZFR5cGUsXG4gICAgICAgICAgcmVxdWlyZWQ6IG5hbWUuaW5jbHVkZXMoJ3JlcXVpcmVkJykgfHwgbmFtZS5pbmNsdWRlcygnKicpLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gRGV0ZWN0IHN1Ym1pdCBidXR0b25zXG4gICAgICBpZiAoc3VibWl0S2V5d29yZHMuc29tZShrdyA9PiBuYW1lLmluY2x1ZGVzKGt3KSkgJiYgYi5oZWlnaHQgPj0gMzAgJiYgYi5oZWlnaHQgPD0gNzApIHtcbiAgICAgICAgaGFzU3VibWl0QnV0dG9uID0gdHJ1ZTtcbiAgICAgICAgaWYgKCFmaWVsZHMuZmluZChmID0+IGYudHlwZSA9PT0gJ3N1Ym1pdCcpKSB7XG4gICAgICAgICAgZmllbGRzLnB1c2goeyBsYWJlbDogJ1N1Ym1pdCcsIHR5cGU6ICdzdWJtaXQnLCByZXF1aXJlZDogZmFsc2UgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb2xsZWN0IHRleHQgbm9kZXMgbmVhciBpbnB1dHMgYXMgcG90ZW50aWFsIGxhYmVsc1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJyAmJiBub2RlLmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICAgIHRleHROb2Rlcy5wdXNoKHtcbiAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICB0ZXh0OiBub2RlLmNoYXJhY3RlcnMgfHwgJycsXG4gICAgICAgIHk6IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveC55LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIGlmIChjaGlsZC52aXNpYmxlICE9PSBmYWxzZSkgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2FsayhzZWN0aW9uTm9kZSk7XG5cbiAgLy8gTWF0Y2ggbGFiZWxzIHRvIGZpZWxkczogdGV4dCBub2RlIGRpcmVjdGx5IGFib3ZlIGFuIGlucHV0ICh3aXRoaW4gMzBweClcbiAgZm9yIChjb25zdCBmaWVsZCBvZiBmaWVsZHMpIHtcbiAgICBjb25zdCBmaWVsZElucHV0ID0gaW5wdXROb2Rlcy5maW5kKGlucCA9PiBpbnAubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGZpZWxkLmxhYmVsLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvIC9nLCAnXycpKSk7XG4gICAgaWYgKGZpZWxkSW5wdXQpIHtcbiAgICAgIGNvbnN0IGxhYmVsQWJvdmUgPSB0ZXh0Tm9kZXMuZmluZCh0ID0+IHQueSA8IGZpZWxkSW5wdXQueSAmJiAoZmllbGRJbnB1dC55IC0gdC55KSA8IDQwKTtcbiAgICAgIGlmIChsYWJlbEFib3ZlKSB7XG4gICAgICAgIGZpZWxkLmxhYmVsID0gbGFiZWxBYm92ZS50ZXh0LnJlcGxhY2UoJyonLCAnJykudHJpbSgpO1xuICAgICAgICBpZiAobGFiZWxBYm92ZS50ZXh0LmluY2x1ZGVzKCcqJykpIGZpZWxkLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBpc0Zvcm0gPSAoaW5wdXRDb3VudCA+PSAyICYmIGhhc1N1Ym1pdEJ1dHRvbikgfHwgKG5hbWVIaW50c0Zvcm0gJiYgaW5wdXRDb3VudCA+PSAxKTtcblxuICByZXR1cm4geyBpc0Zvcm0sIGZpZWxkczogaXNGb3JtID8gZmllbGRzIDogW10gfTtcbn1cblxuLyoqXG4gKiBQYXJzZSBhbGwgc2VjdGlvbnMgZnJvbSBhIHBhZ2UgZnJhbWUgYW5kIHByb2R1Y2UgU2VjdGlvblNwZWMgb2JqZWN0cy5cbiAqL1xuLyoqXG4gKiBFeHRyYWN0IGV2ZXJ5IFRFWFQgbm9kZSBpbiBhIHNlY3Rpb24gaW4gcmVhZGluZyBvcmRlciAodG9wLXRvLWJvdHRvbSxcbiAqIHRoZW4gbGVmdC10by1yaWdodCBmb3IgaXRlbXMgb24gdGhlIHNhbWUgcm93IHdpdGhpbiBhIDEycHggdG9sZXJhbmNlKS5cbiAqXG4gKiBUaGlzIGlzIHRoZSBjb250ZW50IHNvdXJjZSBmb3IgcGFnZS1hc3NlbWJsZXIgd2hlbiBkZXNpZ25lcnMgZG9uJ3QgbmFtZVxuICogbGF5ZXJzIGNvbnNpc3RlbnRseS4gSXQgcHJlc2VydmVzIGV2ZXJ5IHZpc2libGUgdGV4dCBmcm9tIHRoZSBGaWdtYSBkZXNpZ25cbiAqIHNvIG5vdGhpbmcgY2FuIGJlIHNpbGVudGx5IGRyb3BwZWQgZHVyaW5nIEFDRiBwb3B1bGF0aW9uLlxuICovXG5mdW5jdGlvbiBleHRyYWN0VGV4dENvbnRlbnRJbk9yZGVyKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUpOiBUZXh0Q29udGVudEVudHJ5W10ge1xuICBjb25zdCBzZWN0aW9uQm91bmRzID0gc2VjdGlvbk5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgaWYgKCFzZWN0aW9uQm91bmRzKSByZXR1cm4gW107XG5cbiAgdHlwZSBSYXdUZXh0ID0geyBub2RlOiBUZXh0Tm9kZTsgcmVsWTogbnVtYmVyOyByZWxYOiBudW1iZXI7IGZvbnRTaXplOiBudW1iZXIgfTtcbiAgY29uc3QgY29sbGVjdGVkOiBSYXdUZXh0W10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcikge1xuICAgIGlmIChub2RlLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG4gICAgaWYgKGRlcHRoID4gOCkgcmV0dXJuO1xuXG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCB0ID0gbm9kZSBhcyBUZXh0Tm9kZTtcbiAgICAgIGNvbnN0IGNoYXJzID0gdC5jaGFyYWN0ZXJzIHx8ICcnO1xuICAgICAgaWYgKCFjaGFycy50cmltKCkpIHJldHVybjsgLy8gc2tpcCBlbXB0eSB0ZXh0IG5vZGVzXG4gICAgICBjb25zdCBiYiA9IHQuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgIGlmICghYmIpIHJldHVybjtcbiAgICAgIGNvbnN0IGZzID0gdC5mb250U2l6ZSAhPT0gZmlnbWEubWl4ZWQgPyAodC5mb250U2l6ZSBhcyBudW1iZXIpIDogMTY7XG4gICAgICBjb2xsZWN0ZWQucHVzaCh7XG4gICAgICAgIG5vZGU6IHQsXG4gICAgICAgIHJlbFk6IGJiLnkgLSBzZWN0aW9uQm91bmRzIS55LFxuICAgICAgICByZWxYOiBiYi54IC0gc2VjdGlvbkJvdW5kcyEueCxcbiAgICAgICAgZm9udFNpemU6IGZzLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47IC8vIGRvbid0IHJlY3Vyc2UgaW50byBURVhUXG4gICAgfVxuXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQsIGRlcHRoICsgMSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKCdjaGlsZHJlbicgaW4gc2VjdGlvbk5vZGUpIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChzZWN0aW9uTm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICB3YWxrKGNoaWxkLCAwKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZWFkaW5nIG9yZGVyOiBzb3J0IGJ5IFkgKHJvd3MpLCB0aGVuIGJ5IFggd2l0aGluIHNhbWUgcm93ICgxMnB4IHRvbGVyYW5jZSkuXG4gIGNvbGxlY3RlZC5zb3J0KChhLCBiKSA9PiB7XG4gICAgaWYgKE1hdGguYWJzKGEucmVsWSAtIGIucmVsWSkgPCAxMikgcmV0dXJuIGEucmVsWCAtIGIucmVsWDtcbiAgICByZXR1cm4gYS5yZWxZIC0gYi5yZWxZO1xuICB9KTtcblxuICAvLyBSb2xlIGFzc2lnbm1lbnQgXHUyMDE0IHRvcC1tb3N0IGxhcmdlc3QgdGV4dCBpcyAnaGVhZGluZycsIHNlY29uZCBpcyAnc3ViaGVhZGluZycsXG4gIC8vIHNtYWxsIHNob3J0IHRleHRzIG5lYXIgYnV0dG9ucyBhcmUgJ2J1dHRvbl90ZXh0JywgcmVzdCBhcmUgJ2JvZHknIG9yICd0ZXh0X04nLlxuICBsZXQgaGVhZGluZ0Fzc2lnbmVkID0gZmFsc2U7XG4gIGxldCBzdWJoZWFkaW5nQXNzaWduZWQgPSBmYWxzZTtcblxuICByZXR1cm4gY29sbGVjdGVkLm1hcCgoaXRlbSwgaWR4KSA9PiB7XG4gICAgY29uc3QgdGV4dCA9IGl0ZW0ubm9kZS5jaGFyYWN0ZXJzIHx8ICcnO1xuICAgIGNvbnN0IGNsZWFuTmFtZSA9IGl0ZW0ubm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgIGNvbnN0IG5hbWVIaW50ID0gY2xlYW5OYW1lIHx8ICcnO1xuXG4gICAgbGV0IHJvbGU6IHN0cmluZztcbiAgICBpZiAobmFtZUhpbnQuaW5jbHVkZXMoJ2J1dHRvbicpIHx8IG5hbWVIaW50LmluY2x1ZGVzKCdjdGEnKSB8fCBuYW1lSGludC5pbmNsdWRlcygnYnRuJykpIHtcbiAgICAgIHJvbGUgPSAnYnV0dG9uX3RleHQnO1xuICAgIH0gZWxzZSBpZiAoIWhlYWRpbmdBc3NpZ25lZCAmJiBpdGVtLmZvbnRTaXplID49IDI4KSB7XG4gICAgICByb2xlID0gJ2hlYWRpbmcnO1xuICAgICAgaGVhZGluZ0Fzc2lnbmVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKCFzdWJoZWFkaW5nQXNzaWduZWQgJiYgaXRlbS5mb250U2l6ZSA+PSAxOCAmJiBpdGVtLmZvbnRTaXplIDwgMjgpIHtcbiAgICAgIHJvbGUgPSAnc3ViaGVhZGluZyc7XG4gICAgICBzdWJoZWFkaW5nQXNzaWduZWQgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAoaXRlbS5mb250U2l6ZSA8PSAxMyB8fCAobmFtZUhpbnQuaW5jbHVkZXMoJ2NhcHRpb24nKSB8fCBuYW1lSGludC5pbmNsdWRlcygnZXllYnJvdycpIHx8IG5hbWVIaW50LmluY2x1ZGVzKCd0YWcnKSkpIHtcbiAgICAgIHJvbGUgPSAnY2FwdGlvbic7XG4gICAgfSBlbHNlIGlmICh0ZXh0Lmxlbmd0aCA8IDMwICYmIGl0ZW0uZm9udFNpemUgPD0gMTYpIHtcbiAgICAgIC8vIFNob3J0LCBzbWFsbCBcdTIwMTQgbGlrZWx5IGEgbGluayBvciBsYWJlbFxuICAgICAgcm9sZSA9ICdsYWJlbCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvbGUgPSBgYm9keV8ke2lkeH1gO1xuICAgIH1cblxuICAgIGNvbnN0IGJiID0gaXRlbS5ub2RlLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIHJldHVybiB7XG4gICAgICBpbmRleDogaWR4LFxuICAgICAgdGV4dCxcbiAgICAgIHJvbGUsXG4gICAgICBsYXllck5hbWU6IGl0ZW0ubm9kZS5uYW1lLFxuICAgICAgZm9udFNpemU6IE1hdGgucm91bmQoaXRlbS5mb250U2l6ZSksXG4gICAgICBib3VuZHM6IHtcbiAgICAgICAgeDogTWF0aC5yb3VuZChpdGVtLnJlbFgpLFxuICAgICAgICB5OiBNYXRoLnJvdW5kKGl0ZW0ucmVsWSksXG4gICAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKGJiLndpZHRoKSxcbiAgICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKGJiLmhlaWdodCksXG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xufVxuXG4vKipcbiAqIFBhcnNlIHNlY3Rpb25zIGZyb20gYSBwYWdlIGZyYW1lLlxuICpcbiAqIEBwYXJhbSBwYWdlRnJhbWUgVGhlIHRvcC1sZXZlbCBwYWdlIGZyYW1lIHRvIHdhbGsuXG4gKiBAcGFyYW0gZ2xvYmFsTmFtZXMgT3B0aW9uYWwgc2V0IG9mIG5vcm1hbGl6ZWQgc2VjdGlvbiBuYW1lcyB0aGF0IGFwcGVhciBvblxuICogICAgICAgICAgICAgICAgICAgIFx1MjI2NTIgc2VsZWN0ZWQgcGFnZXMuIFdoZW4gcHJvdmlkZWQsIG1hdGNoaW5nIHNlY3Rpb25zIGFyZVxuICogICAgICAgICAgICAgICAgICAgIG1hcmtlZCBgaXNHbG9iYWw6IHRydWVgIHNvIHRoZSBhZ2VudCBjYW4gcHJvbW90ZSB0aGVtIHRvXG4gKiAgICAgICAgICAgICAgICAgICAgc2hhcmVkIFdQIHRoZW1lIHBhcnRzIGluc3RlYWQgb2YgZHVwbGljYXRpbmcgcGVyLXBhZ2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNlY3Rpb25zKHBhZ2VGcmFtZTogRnJhbWVOb2RlLCBnbG9iYWxOYW1lcz86IFNldDxzdHJpbmc+KTogUmVjb3JkPHN0cmluZywgU2VjdGlvblNwZWM+IHtcbiAgY29uc3Qgc2VjdGlvbk5vZGVzID0gaWRlbnRpZnlTZWN0aW9ucyhwYWdlRnJhbWUpO1xuICBjb25zdCBzcGVjczogUmVjb3JkPHN0cmluZywgU2VjdGlvblNwZWM+ID0ge307XG5cbiAgbGV0IHByZXZCb3R0b20gPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VjdGlvbk5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZSA9IHNlY3Rpb25Ob2Rlc1tpXTtcbiAgICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgaWYgKCFib3VuZHMpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgbGF5b3V0TmFtZSA9IHRvTGF5b3V0TmFtZShub2RlLm5hbWUpO1xuICAgIGNvbnN0IGlzRnJhbWUgPSBub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRSc7XG4gICAgY29uc3QgZnJhbWUgPSBpc0ZyYW1lID8gKG5vZGUgYXMgRnJhbWVOb2RlKSA6IG51bGw7XG5cbiAgICAvLyBEZXRlcm1pbmUgc3BhY2luZyBzb3VyY2UgYW5kIGV4dHJhY3Qgc3BhY2luZ1xuICAgIGNvbnN0IGhhc0F1dG9MYXlvdXQgPSBmcmFtZT8ubGF5b3V0TW9kZSAmJiBmcmFtZS5sYXlvdXRNb2RlICE9PSAnTk9ORSc7XG4gICAgbGV0IHNwYWNpbmdTb3VyY2U6ICdhdXRvLWxheW91dCcgfCAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnO1xuICAgIGxldCBzZWN0aW9uU3R5bGVzOiBQYXJ0aWFsPFNlY3Rpb25TdHlsZXM+O1xuICAgIGxldCBpdGVtU3BhY2luZzogc3RyaW5nIHwgbnVsbDtcblxuICAgIGlmIChoYXNBdXRvTGF5b3V0ICYmIGZyYW1lKSB7XG4gICAgICBjb25zdCBzcGFjaW5nID0gZXh0cmFjdEF1dG9MYXlvdXRTcGFjaW5nKGZyYW1lKTtcbiAgICAgIHNwYWNpbmdTb3VyY2UgPSBzcGFjaW5nLnNwYWNpbmdTb3VyY2U7XG4gICAgICBzZWN0aW9uU3R5bGVzID0gc3BhY2luZy5zZWN0aW9uU3R5bGVzO1xuICAgICAgaXRlbVNwYWNpbmcgPSBzcGFjaW5nLml0ZW1TcGFjaW5nO1xuICAgIH0gZWxzZSBpZiAoZnJhbWUpIHtcbiAgICAgIGNvbnN0IHNwYWNpbmcgPSBleHRyYWN0QWJzb2x1dGVTcGFjaW5nKGZyYW1lKTtcbiAgICAgIHNwYWNpbmdTb3VyY2UgPSBzcGFjaW5nLnNwYWNpbmdTb3VyY2U7XG4gICAgICBzZWN0aW9uU3R5bGVzID0gc3BhY2luZy5zZWN0aW9uU3R5bGVzO1xuICAgICAgaXRlbVNwYWNpbmcgPSBzcGFjaW5nLml0ZW1TcGFjaW5nO1xuICAgIH0gZWxzZSB7XG4gICAgICBzcGFjaW5nU291cmNlID0gJ2Fic29sdXRlLWNvb3JkaW5hdGVzJztcbiAgICAgIHNlY3Rpb25TdHlsZXMgPSB7fTtcbiAgICAgIGl0ZW1TcGFjaW5nID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBCYXNlIHNlY3Rpb24gc3R5bGVzIChiYWNrZ3JvdW5kLCBncmFkaWVudCwgZXRjLilcbiAgICBjb25zdCBiYXNlU3R5bGVzID0gZXh0cmFjdFNlY3Rpb25TdHlsZXMobm9kZSk7XG4gICAgY29uc3QgbWVyZ2VkU3R5bGVzOiBTZWN0aW9uU3R5bGVzID0ge1xuICAgICAgLi4uYmFzZVN0eWxlcyxcbiAgICAgIC4uLnNlY3Rpb25TdHlsZXMsXG4gICAgfTtcblxuICAgIC8vIEVsZW1lbnRzXG4gICAgY29uc3QgZWxlbWVudHMgPSBleHRyYWN0RWxlbWVudHMobm9kZSk7XG5cbiAgICAvLyBHcmlkIGRldGVjdGlvblxuICAgIGNvbnN0IGdyaWQgPSBmcmFtZSA/IGRldGVjdEdyaWQoZnJhbWUpIDoge1xuICAgICAgbGF5b3V0TW9kZTogJ2Fic29sdXRlJyBhcyBjb25zdCxcbiAgICAgIGNvbHVtbnM6IDEsXG4gICAgICBnYXA6IGl0ZW1TcGFjaW5nLFxuICAgICAgcm93R2FwOiBudWxsLFxuICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgaXRlbU1pbldpZHRoOiBudWxsLFxuICAgIH07XG5cbiAgICAvLyBFbnN1cmUgZ3JpZCBnYXAgaXMgc2V0IGZyb20gaXRlbVNwYWNpbmcgaWYgbm90IGFscmVhZHlcbiAgICBpZiAoIWdyaWQuZ2FwICYmIGl0ZW1TcGFjaW5nKSB7XG4gICAgICBncmlkLmdhcCA9IGl0ZW1TcGFjaW5nO1xuICAgIH1cblxuICAgIC8vIE92ZXJsYXAgZGV0ZWN0aW9uXG4gICAgbGV0IG92ZXJsYXA6IE92ZXJsYXBJbmZvIHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKGkgPiAwKSB7XG4gICAgICBjb25zdCBvdmVybGFwUHggPSBwcmV2Qm90dG9tIC0gYm91bmRzLnk7XG4gICAgICBpZiAob3ZlcmxhcFB4ID4gMCkge1xuICAgICAgICBvdmVybGFwID0ge1xuICAgICAgICAgIHdpdGhTZWN0aW9uOiBzZWN0aW9uTm9kZXNbaSAtIDFdLm5hbWUsXG4gICAgICAgICAgcGl4ZWxzOiBNYXRoLnJvdW5kKG92ZXJsYXBQeCksXG4gICAgICAgICAgY3NzTWFyZ2luVG9wOiBgLSR7TWF0aC5yb3VuZChvdmVybGFwUHgpfXB4YCxcbiAgICAgICAgICByZXF1aXJlc1pJbmRleDogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbnRlcmFjdGlvbnNcbiAgICBjb25zdCBpbnRlcmFjdGlvbnMgPSBleHRyYWN0SW50ZXJhY3Rpb25zKG5vZGUpO1xuXG4gICAgLy8gTGF5ZXIgY29tcG9zaXRpb24gYW5hbHlzaXNcbiAgICBjb25zdCBsYXllcnMgPSBleHRyYWN0TGF5ZXJzKG5vZGUsIGVsZW1lbnRzKTtcbiAgICBjb25zdCBjb21wb3NpdGlvbiA9IGRldGVjdENvbXBvc2l0aW9uKGxheWVycyk7XG5cbiAgICAvLyBFbnJpY2ggZWxlbWVudHMgd2l0aCBwb3NpdGlvbiBkYXRhIGZyb20gY29tcG9zaXRpb25cbiAgICBpZiAoY29tcG9zaXRpb24uaGFzVGV4dE92ZXJJbWFnZSB8fCBjb21wb3NpdGlvbi5oYXNCYWNrZ3JvdW5kSW1hZ2UpIHtcbiAgICAgIC8vIFNlY3Rpb24gbmVlZHMgcG9zaXRpb246IHJlbGF0aXZlIGZvciBvdmVybGF5IGNoaWxkcmVuXG4gICAgICBtZXJnZWRTdHlsZXMub3ZlcmZsb3cgPSBtZXJnZWRTdHlsZXMub3ZlcmZsb3cgfHwgJ2hpZGRlbic7XG5cbiAgICAgIGZvciAoY29uc3QgW2VsZW1OYW1lLCBlbGVtU3R5bGVzXSBvZiBPYmplY3QuZW50cmllcyhlbGVtZW50cykpIHtcbiAgICAgICAgaWYgKGNvbXBvc2l0aW9uLm92ZXJsYXlFbGVtZW50cy5pbmNsdWRlcyhlbGVtTmFtZSkgfHwgY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlKSB7XG4gICAgICAgICAgLy8gRmluZCBtYXRjaGluZyBsYXllciBmb3IgcG9zaXRpb24gZGF0YVxuICAgICAgICAgIGNvbnN0IGxheWVyID0gbGF5ZXJzLmZpbmQobCA9PiBsLm5hbWUgPT09IGVsZW1OYW1lKTtcbiAgICAgICAgICBpZiAobGF5ZXIgJiYgbGF5ZXIucm9sZSAhPT0gJ2JhY2tncm91bmRfaW1hZ2UnKSB7XG4gICAgICAgICAgICBlbGVtU3R5bGVzLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgIGVsZW1TdHlsZXMuekluZGV4ID0gbGF5ZXIuekluZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZvcm0gZGV0ZWN0aW9uXG4gICAgY29uc3QgZm9ybVJlc3VsdCA9IGRldGVjdEZvcm1TZWN0aW9uKG5vZGUpO1xuXG4gICAgLy8gT3JkZXJlZCB0ZXh0IGNvbnRlbnQgXHUyMDE0IGV2ZXJ5IHRleHQgaW4gcmVhZGluZyBvcmRlciAoZm9yIHBhZ2UtYXNzZW1ibGVyIG1hcHBpbmcpXG4gICAgY29uc3QgdGV4dENvbnRlbnRJbk9yZGVyID0gZXh0cmFjdFRleHRDb250ZW50SW5PcmRlcihub2RlKTtcblxuICAgIC8vIFBhdHRlcm4gZGV0ZWN0aW9uIChjYXJvdXNlbCAvIGFjY29yZGlvbiAvIHRhYnMgLyBtb2RhbClcbiAgICBsZXQgY29tcG9uZW50UGF0dGVybnM6IFJldHVyblR5cGU8dHlwZW9mIGRldGVjdENvbXBvbmVudFBhdHRlcm5zPiB8IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcCA9IGRldGVjdENvbXBvbmVudFBhdHRlcm5zKG5vZGUpO1xuICAgICAgaWYgKHAubGVuZ3RoID4gMCkgY29tcG9uZW50UGF0dGVybnMgPSBwO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignZGV0ZWN0Q29tcG9uZW50UGF0dGVybnMgZmFpbGVkIGZvciBzZWN0aW9uJywgbm9kZS5uYW1lLCBlKTtcbiAgICB9XG5cbiAgICAvLyBSZXBlYXRlciBkZXRlY3Rpb24gKGNhcmRzIC8gZmVhdHVyZXMgLyBwcmljaW5nIC8gZXRjLilcbiAgICBsZXQgcmVwZWF0ZXJzOiBSZXR1cm5UeXBlPHR5cGVvZiBkZXRlY3RSZXBlYXRlcnM+IHwgdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByID0gZGV0ZWN0UmVwZWF0ZXJzKG5vZGUpO1xuICAgICAgaWYgKE9iamVjdC5rZXlzKHIpLmxlbmd0aCA+IDApIHJlcGVhdGVycyA9IHI7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdkZXRlY3RSZXBlYXRlcnMgZmFpbGVkIGZvciBzZWN0aW9uJywgbm9kZS5uYW1lLCBlKTtcbiAgICB9XG5cbiAgICAvLyBHbG9iYWwgZGV0ZWN0aW9uIChjcm9zcy1wYWdlKVxuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVTZWN0aW9uTmFtZShub2RlLm5hbWUpO1xuICAgIGNvbnN0IGlzR2xvYmFsID0gZ2xvYmFsTmFtZXMgPyBnbG9iYWxOYW1lcy5oYXMobm9ybWFsaXplZCkgOiBmYWxzZTtcbiAgICBjb25zdCBnbG9iYWxSb2xlID0gaXNHbG9iYWxcbiAgICAgID8gY2xhc3NpZnlHbG9iYWxSb2xlKGksIHNlY3Rpb25Ob2Rlcy5sZW5ndGgsIE1hdGgucm91bmQoYm91bmRzLmhlaWdodCkpXG4gICAgICA6IG51bGw7XG5cbiAgICAvLyBOYXZpZ2F0aW9uIChvbmx5IHdvcnRoIGNvbXB1dGluZyBmb3IgaGVhZGVyL2Zvb3RlciBjYW5kaWRhdGVzKVxuICAgIGxldCBuYXZpZ2F0aW9uOiBOb25OdWxsYWJsZTxSZXR1cm5UeXBlPHR5cGVvZiBkZXRlY3ROYXZpZ2F0aW9uPj4gfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG5hbWUgPSAobm9kZS5uYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKGlzR2xvYmFsIHx8IC9cXGIoaGVhZGVyfGZvb3RlcnxuYXZ8bmF2YmFyfG5hdmlnYXRpb24pXFxiLy50ZXN0KG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IG5hdiA9IGRldGVjdE5hdmlnYXRpb24obm9kZSk7XG4gICAgICAgIGlmIChuYXYpIG5hdmlnYXRpb24gPSBuYXY7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdkZXRlY3ROYXZpZ2F0aW9uIGZhaWxlZCBmb3Igc2VjdGlvbicsIG5vZGUubmFtZSwgZSk7XG4gICAgfVxuXG4gICAgLy8gU2VjdGlvbiBzZW1hbnRpYyByb2xlIGluZmVyZW5jZVxuICAgIGxldCBzZWN0aW9uVHlwZTogUmV0dXJuVHlwZTx0eXBlb2YgaW5mZXJTZWN0aW9uVHlwZT4gfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgc2VjdGlvblR5cGUgPSBpbmZlclNlY3Rpb25UeXBlKHtcbiAgICAgICAgc2VjdGlvbkluZGV4OiBpLFxuICAgICAgICB0b3RhbFNlY3Rpb25zOiBzZWN0aW9uTm9kZXMubGVuZ3RoLFxuICAgICAgICBpc0Zvcm1TZWN0aW9uOiBmb3JtUmVzdWx0LmlzRm9ybSxcbiAgICAgICAgcGF0dGVybnM6IGNvbXBvbmVudFBhdHRlcm5zIHx8IFtdLFxuICAgICAgICByZXBlYXRlcnM6IHJlcGVhdGVycyB8fCB7fSxcbiAgICAgICAgZWxlbWVudHMsXG4gICAgICAgIHRleHRDb250ZW50SW5PcmRlcixcbiAgICAgICAgbGF5ZXJOYW1lOiBub2RlLm5hbWUgfHwgJycsXG4gICAgICAgIHNlY3Rpb25IZWlnaHQ6IE1hdGgucm91bmQoYm91bmRzLmhlaWdodCksXG4gICAgICAgIGlzR2xvYmFsLFxuICAgICAgICBnbG9iYWxSb2xlLFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdpbmZlclNlY3Rpb25UeXBlIGZhaWxlZCBmb3Igc2VjdGlvbicsIG5vZGUubmFtZSwgZSk7XG4gICAgfVxuXG4gICAgc3BlY3NbbGF5b3V0TmFtZV0gPSB7XG4gICAgICBzcGFjaW5nU291cmNlLFxuICAgICAgZmlnbWFOb2RlSWQ6IG5vZGUuaWQsXG4gICAgICBzY3JlZW5zaG90RmlsZTogYHNjcmVlbnNob3RzLyR7c2NyZWVuc2hvdEZpbGVuYW1lKGkgKyAxLCBub2RlLm5hbWUpfWAsXG4gICAgICBzZWN0aW9uOiBtZXJnZWRTdHlsZXMsXG4gICAgICBlbGVtZW50cyxcbiAgICAgIGdyaWQsXG4gICAgICBpbnRlcmFjdGlvbnM6IGludGVyYWN0aW9ucy5sZW5ndGggPiAwID8gaW50ZXJhY3Rpb25zIDogdW5kZWZpbmVkLFxuICAgICAgb3ZlcmxhcCxcbiAgICAgIGxheWVyczogbGF5ZXJzLmxlbmd0aCA+IDAgPyBsYXllcnMgOiB1bmRlZmluZWQsXG4gICAgICBjb21wb3NpdGlvbjogKGNvbXBvc2l0aW9uLmhhc1RleHRPdmVySW1hZ2UgfHwgY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlKSA/IGNvbXBvc2l0aW9uIDogdW5kZWZpbmVkLFxuICAgICAgaXNGb3JtU2VjdGlvbjogZm9ybVJlc3VsdC5pc0Zvcm0gfHwgdW5kZWZpbmVkLFxuICAgICAgZm9ybUZpZWxkczogZm9ybVJlc3VsdC5maWVsZHMubGVuZ3RoID4gMCA/IGZvcm1SZXN1bHQuZmllbGRzIDogdW5kZWZpbmVkLFxuICAgICAgdGV4dENvbnRlbnRJbk9yZGVyOiB0ZXh0Q29udGVudEluT3JkZXIubGVuZ3RoID4gMCA/IHRleHRDb250ZW50SW5PcmRlciA6IHVuZGVmaW5lZCxcbiAgICAgIGNvbXBvbmVudFBhdHRlcm5zLFxuICAgICAgaXNHbG9iYWw6IGlzR2xvYmFsIHx8IHVuZGVmaW5lZCxcbiAgICAgIGdsb2JhbFJvbGU6IGlzR2xvYmFsID8gZ2xvYmFsUm9sZSA6IHVuZGVmaW5lZCxcbiAgICAgIHNlY3Rpb25UeXBlOiBzZWN0aW9uVHlwZT8udHlwZSxcbiAgICAgIHNlY3Rpb25UeXBlQ29uZmlkZW5jZTogc2VjdGlvblR5cGU/LmNvbmZpZGVuY2UsXG4gICAgICByZXBlYXRlcnMsXG4gICAgICBuYXZpZ2F0aW9uLFxuICAgIH07XG5cbiAgICBwcmV2Qm90dG9tID0gYm91bmRzLnkgKyBib3VuZHMuaGVpZ2h0O1xuICB9XG5cbiAgcmV0dXJuIHNwZWNzO1xufVxuIiwgImltcG9ydCB7IEltYWdlRXhwb3J0VGFzaywgSW1hZ2VNYXAsIEltYWdlTWFwRW50cnkgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHNsdWdpZnksIHNjcmVlbnNob3RGaWxlbmFtZSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgaGFzSW1hZ2VGaWxsIH0gZnJvbSAnLi9jb2xvcic7XG5cbmNvbnN0IEJBVENIX1NJWkUgPSAxMDtcblxuLyoqXG4gKiBJZGVudGlmeSBzZWN0aW9uLWxldmVsIGNoaWxkcmVuLCBtYXRjaGluZyB0aGUgc2FtZSBsb2dpYyBhcyBzZWN0aW9uLXBhcnNlci50cy5cbiAqIElmIHRoZSBmcmFtZSBoYXMgYSBzaW5nbGUgd3JhcHBlciBjaGlsZCwgZHJpbGwgb25lIGxldmVsIGRlZXBlci5cbiAqL1xuZnVuY3Rpb24gaWRlbnRpZnlTZWN0aW9uTm9kZXMocGFnZUZyYW1lOiBGcmFtZU5vZGUpOiBTY2VuZU5vZGVbXSB7XG4gIGxldCBjYW5kaWRhdGVzID0gcGFnZUZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveCAmJlxuICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveC5oZWlnaHQgPiA1MFxuICApO1xuXG4gIC8vIElmIHRoZXJlJ3MgYSBzaW5nbGUgY29udGFpbmVyIGNoaWxkLCBkcmlsbCBvbmUgbGV2ZWwgZGVlcGVyIChtYXRjaGVzIHNlY3Rpb24tcGFyc2VyLnRzKVxuICBpZiAoY2FuZGlkYXRlcy5sZW5ndGggPT09IDEgJiYgJ2NoaWxkcmVuJyBpbiBjYW5kaWRhdGVzWzBdKSB7XG4gICAgY29uc3Qgd3JhcHBlciA9IGNhbmRpZGF0ZXNbMF0gYXMgRnJhbWVOb2RlO1xuICAgIGNvbnN0IGlubmVyQ2FuZGlkYXRlcyA9IHdyYXBwZXIuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3guaGVpZ2h0ID4gNTBcbiAgICApO1xuICAgIGlmIChpbm5lckNhbmRpZGF0ZXMubGVuZ3RoID4gMSkge1xuICAgICAgY2FuZGlkYXRlcyA9IGlubmVyQ2FuZGlkYXRlcztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gWy4uLmNhbmRpZGF0ZXNdLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueSk7XG59XG5cbi8qKlxuICogQnVpbGQgdGhlIGxpc3Qgb2YgYWxsIGV4cG9ydCB0YXNrcyBmb3IgYSBwYWdlIGZyYW1lLlxuICogSW5jbHVkZXM6IGZ1bGwtcGFnZSBjb21wb3NpdGUgc2NyZWVuc2hvdCwgcGVyLXNlY3Rpb24gc2NyZWVuc2hvdHMsXG4gKiBhbmQgaW1hZ2UgYXNzZXRzIChQTkcgZm9yIHBob3RvcywgU1ZHIGZvciB2ZWN0b3IgaWNvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRFeHBvcnRUYXNrcyhwYWdlRnJhbWU6IEZyYW1lTm9kZSwgcGFnZVNsdWc6IHN0cmluZyk6IEltYWdlRXhwb3J0VGFza1tdIHtcbiAgY29uc3QgdGFza3M6IEltYWdlRXhwb3J0VGFza1tdID0gW107XG4gIGNvbnN0IHBhZ2VQYXRoID0gYHBhZ2VzLyR7cGFnZVNsdWd9YDtcblxuICAvLyBGdWxsLXBhZ2UgY29tcG9zaXRlIHNjcmVlbnNob3QgXHUyMDE0IGNyaXRpY2FsIGZvciBhZ2VudCdzIGZ1bGwtcGFnZSB2aXN1YWwgcmV2aWV3LlxuICB0YXNrcy5wdXNoKHtcbiAgICBub2RlSWQ6IHBhZ2VGcmFtZS5pZCxcbiAgICBub2RlTmFtZTogcGFnZUZyYW1lLm5hbWUsXG4gICAgdHlwZTogJ2Z1bGwtcGFnZScsXG4gICAgZmlsZW5hbWU6ICdfZnVsbC1wYWdlLnBuZycsXG4gICAgcGFnZVBhdGgsXG4gICAgZm9ybWF0OiAnUE5HJyxcbiAgICBzY2FsZTogMSxcbiAgfSk7XG5cbiAgLy8gUGVyLXNlY3Rpb24gc2NyZWVuc2hvdHMgYXQgMXggXHUyMDE0IHVzZXMgc2FtZSB3cmFwcGVyIGRyaWxsLWRvd24gYXMgc2VjdGlvbi1wYXJzZXJcbiAgY29uc3Qgc2VjdGlvbnMgPSBpZGVudGlmeVNlY3Rpb25Ob2RlcyhwYWdlRnJhbWUpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB0YXNrcy5wdXNoKHtcbiAgICAgIG5vZGVJZDogc2VjdGlvbnNbaV0uaWQsXG4gICAgICBub2RlTmFtZTogc2VjdGlvbnNbaV0ubmFtZSxcbiAgICAgIHR5cGU6ICdzY3JlZW5zaG90JyxcbiAgICAgIGZpbGVuYW1lOiBzY3JlZW5zaG90RmlsZW5hbWUoaSArIDEsIHNlY3Rpb25zW2ldLm5hbWUpLFxuICAgICAgcGFnZVBhdGgsXG4gICAgICBmb3JtYXQ6ICdQTkcnLFxuICAgICAgc2NhbGU6IDEsXG4gICAgfSk7XG4gIH1cblxuICAvLyBJbWFnZSBhc3NldHMgXHUyMDE0IGRldGVjdCBpY29ucyAodmVjdG9yLW9ubHksIHNtYWxsKSB2cyBwaG90b3MgKHJhc3RlciBmaWxscylcbiAgY29uc3QgaWNvbk5vZGVzID0gZmluZEljb25Ob2RlcyhwYWdlRnJhbWUpO1xuICBjb25zdCBzZWVuSWNvbklkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IGljb25Ob2RlIG9mIGljb25Ob2Rlcykge1xuICAgIGlmIChzZWVuSWNvbklkcy5oYXMoaWNvbk5vZGUuaWQpKSBjb250aW51ZTtcbiAgICBzZWVuSWNvbklkcy5hZGQoaWNvbk5vZGUuaWQpO1xuICAgIHRhc2tzLnB1c2goe1xuICAgICAgbm9kZUlkOiBpY29uTm9kZS5pZCxcbiAgICAgIG5vZGVOYW1lOiBpY29uTm9kZS5uYW1lLFxuICAgICAgdHlwZTogJ2Fzc2V0JyxcbiAgICAgIGZpbGVuYW1lOiBgJHtzbHVnaWZ5KGljb25Ob2RlLm5hbWUpfS5zdmdgLFxuICAgICAgcGFnZVBhdGgsXG4gICAgICBmb3JtYXQ6ICdTVkcnLFxuICAgICAgc2NhbGU6IDEsXG4gICAgICBwcmVmZXJTdmc6IHRydWUsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBpbWFnZU5vZGVzID0gZmluZEltYWdlTm9kZXMocGFnZUZyYW1lKTtcbiAgY29uc3Qgc2Vlbkhhc2hlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgaW1nTm9kZSBvZiBpbWFnZU5vZGVzKSB7XG4gICAgLy8gU2tpcCBub2RlcyBhbHJlYWR5IHF1ZXVlZCBhcyBTVkcgaWNvbnNcbiAgICBpZiAoc2Vlbkljb25JZHMuaGFzKGltZ05vZGUuaWQpKSBjb250aW51ZTtcbiAgICBjb25zdCBoYXNoS2V5ID0gYCR7aW1nTm9kZS5uYW1lfV8ke2ltZ05vZGUuYWJzb2x1dGVCb3VuZGluZ0JveD8ud2lkdGh9XyR7aW1nTm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94Py5oZWlnaHR9YDtcbiAgICBpZiAoc2Vlbkhhc2hlcy5oYXMoaGFzaEtleSkpIGNvbnRpbnVlO1xuICAgIHNlZW5IYXNoZXMuYWRkKGhhc2hLZXkpO1xuXG4gICAgY29uc3QgZmlsZW5hbWUgPSBgJHtzbHVnaWZ5KGltZ05vZGUubmFtZSl9LnBuZ2A7XG4gICAgdGFza3MucHVzaCh7XG4gICAgICBub2RlSWQ6IGltZ05vZGUuaWQsXG4gICAgICBub2RlTmFtZTogaW1nTm9kZS5uYW1lLFxuICAgICAgdHlwZTogJ2Fzc2V0JyxcbiAgICAgIGZpbGVuYW1lLFxuICAgICAgcGFnZVBhdGgsXG4gICAgICBmb3JtYXQ6ICdQTkcnLFxuICAgICAgc2NhbGU6IDEsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gdGFza3M7XG59XG5cbi8qKlxuICogSWRlbnRpZnkgaWNvbiBub2RlcyBcdTIwMTQgdmVjdG9yLW9ubHksIHR5cGljYWxseSBzbWFsbCAoPCA2NHB4KS4gVGhlc2UgYXJlXG4gKiBleHBvcnRlZCBhcyBTVkcgc28gdGhlIHRoZW1lIGNhbiBpbmxpbmUgdGhlbSwgcmVjb2xvciB2aWEgQ1NTIGN1cnJlbnRDb2xvcixcbiAqIGFuZCByZW5kZXIgc2hhcnAgYXQgYW55IHJlc29sdXRpb24uXG4gKlxuICogSGV1cmlzdGljczpcbiAqICAgLSBub2RlLnR5cGUgPT09ICdWRUNUT1InIChwdXJlIHZlY3RvciBwYXRoKVxuICogICAtIEZSQU1FL0NPTVBPTkVOVCB3aG9zZSBlbnRpcmUgc3VidHJlZSBpcyB2ZWN0b3IgKG5vIElNQUdFIGZpbGxzLCBubyBURVhUKVxuICogICAgIEFORCBib3VuZGluZyBib3ggXHUyMjY0IDY0XHUwMEQ3NjRcbiAqICAgLSBMYXllciBuYW1lIGNvbnRhaW5zIFwiaWNvblwiIChoaW50KVxuICovXG5mdW5jdGlvbiBmaW5kSWNvbk5vZGVzKHJvb3Q6IFNjZW5lTm9kZSk6IFNjZW5lTm9kZVtdIHtcbiAgY29uc3QgaWNvbnM6IFNjZW5lTm9kZVtdID0gW107XG5cbiAgZnVuY3Rpb24gaXNWZWN0b3JPbmx5KG46IFNjZW5lTm9kZSk6IGJvb2xlYW4ge1xuICAgIGlmIChuLnR5cGUgPT09ICdURVhUJykgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChoYXNJbWFnZUZpbGwobiBhcyBhbnkpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbikge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobiBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIGlmIChjaGlsZC52aXNpYmxlID09PSBmYWxzZSkgY29udGludWU7XG4gICAgICAgIGlmICghaXNWZWN0b3JPbmx5KGNoaWxkKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICBjb25zdCBiYiA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICBjb25zdCBzbWFsbGlzaCA9IGJiICYmIGJiLndpZHRoIDw9IDY0ICYmIGJiLmhlaWdodCA8PSA2NDtcblxuICAgIGlmIChub2RlLnR5cGUgPT09ICdWRUNUT1InKSB7XG4gICAgICBpY29ucy5wdXNoKG5vZGUpO1xuICAgICAgcmV0dXJuOyAvLyBkb24ndCByZWN1cnNlIGludG8gdmVjdG9yIHBhdGhzXG4gICAgfVxuXG4gICAgY29uc3QgbmFtZUhpbnRzSWNvbiA9IC9cXGJpY29uXFxiL2kudGVzdChub2RlLm5hbWUpO1xuICAgIGlmICgobm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnIHx8IG5vZGUudHlwZSA9PT0gJ0dST1VQJykgJiZcbiAgICAgICAgKHNtYWxsaXNoIHx8IG5hbWVIaW50c0ljb24pICYmXG4gICAgICAgIGlzVmVjdG9yT25seShub2RlKSAmJlxuICAgICAgICAnY2hpbGRyZW4nIGluIG5vZGUgJiYgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICBpY29ucy5wdXNoKG5vZGUpO1xuICAgICAgcmV0dXJuOyAvLyBkb24ndCByZWN1cnNlIGludG8gaWNvbiBpbnRlcm5hbHNcbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdhbGsocm9vdCk7XG4gIHJldHVybiBpY29ucztcbn1cblxuLyoqXG4gKiBGaW5kIGFsbCBub2RlcyB3aXRoIElNQUdFIGZpbGxzIGluIGEgc3VidHJlZS5cbiAqL1xuZnVuY3Rpb24gZmluZEltYWdlTm9kZXMocm9vdDogU2NlbmVOb2RlKTogU2NlbmVOb2RlW10ge1xuICBjb25zdCBub2RlczogU2NlbmVOb2RlW10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpKSB7XG4gICAgICBub2Rlcy5wdXNoKG5vZGUpO1xuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2Fsayhyb290KTtcbiAgcmV0dXJuIG5vZGVzO1xufVxuXG4vKipcbiAqIEV4cG9ydCBhIHNpbmdsZSBub2RlIGFzIFBORy9TVkcgYnl0ZXMuXG4gKlxuICogRm9yIHNlY3Rpb24gc2NyZWVuc2hvdHMsIHRoaXMgdXNlcyBleHBvcnRBc3luYyB3aGljaCByZW5kZXJzIHRoZSBjb21wb3NpdGVcbiAqIChpbWFnZSArIHRleHQgKyBvdmVybGF5cykgXHUyMDE0IGNvcnJlY3QgZm9yIHNjcmVlbnNob3RzLlxuICpcbiAqIEZvciBpbWFnZSBhc3NldHMsIHRoaXMgcHVsbHMgdGhlIFJBVyBpbWFnZSBieXRlcyBmcm9tIHRoZSBub2RlJ3MgSU1BR0UgZmlsbFxuICogdmlhIGZpZ21hLmdldEltYWdlQnlIYXNoKCkuIFRoaXMgcmV0dXJucyB0aGUgcHVyZSBzb3VyY2UgaW1hZ2Ugd2l0aCBOT1xuICogdGV4dC9zaGFwZSBvdmVybGF5cyBiYWtlZCBpbiBcdTIwMTQgZml4aW5nIHRoZSBjb21tb24gXCJoZXJvIGltYWdlIGluY2x1ZGVzIHRoZVxuICogaGVhZGxpbmUgdGV4dFwiIHByb2JsZW0uIE1hc2tzIGFuZCBjcm9wcyBhcmUgZGlzY2FyZGVkIGludGVudGlvbmFsbHk7IHRoZVxuICogdGhlbWUgcmUtYXBwbGllcyB0aGVtIHZpYSBDU1MgKG9iamVjdC1maXQsIGJhY2tncm91bmQtc2l6ZSwgYm9yZGVyLXJhZGl1cykuXG4gKlxuICogQXNzZXQgZmFsbGJhY2s6IGlmIHRoZSBub2RlIGhhcyBubyBpbWFnZSBmaWxsIChlLmcuIGFuIFNWRyBpbGx1c3RyYXRpb24pLFxuICogZmFsbCBiYWNrIHRvIGV4cG9ydEFzeW5jIHNvIGxvZ29zL2ljb25zIHN0aWxsIGV4cG9ydCBjb3JyZWN0bHkuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGV4cG9ydE5vZGUoXG4gIG5vZGVJZDogc3RyaW5nLFxuICBmb3JtYXQ6ICdQTkcnIHwgJ1NWRycgfCAnSlBHJyxcbiAgc2NhbGU6IG51bWJlcixcbiAgdGFza1R5cGU6ICdzY3JlZW5zaG90JyB8ICdmdWxsLXBhZ2UnIHwgJ2Fzc2V0Jyxcbik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICBjb25zdCBub2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQobm9kZUlkKTtcbiAgaWYgKCFub2RlIHx8ICEoJ2V4cG9ydEFzeW5jJyBpbiBub2RlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgTm9kZSAke25vZGVJZH0gbm90IGZvdW5kIG9yIG5vdCBleHBvcnRhYmxlYCk7XG4gIH1cblxuICAvLyBTVkcgcmVxdWVzdGVkIFx1MjAxNCB1c2UgZXhwb3J0QXN5bmMgZGlyZWN0bHkgKGZvciBpY29ucywgdmVjdG9yIGlsbHVzdHJhdGlvbnMpXG4gIGlmIChmb3JtYXQgPT09ICdTVkcnKSB7XG4gICAgcmV0dXJuIGF3YWl0IChub2RlIGFzIFNjZW5lTm9kZSkuZXhwb3J0QXN5bmMoeyBmb3JtYXQ6ICdTVkcnIH0pO1xuICB9XG5cbiAgLy8gRm9yIFBORyBhc3NldCB0YXNrczogdHJ5IHRvIHB1bGwgcmF3IGltYWdlIGJ5dGVzIGZyb20gYW4gSU1BR0UgZmlsbCBmaXJzdFxuICAvLyBzbyB3ZSBnZXQgdGhlIHB1cmUgc291cmNlIGltYWdlIHdpdGhvdXQgYW55IGJha2VkLWluIHRleHQvb3ZlcmxheXMuXG4gIGlmICh0YXNrVHlwZSA9PT0gJ2Fzc2V0JyAmJiBmb3JtYXQgPT09ICdQTkcnKSB7XG4gICAgY29uc3QgcmF3ID0gYXdhaXQgdHJ5RXh0cmFjdFJhd0ltYWdlQnl0ZXMobm9kZSBhcyBTY2VuZU5vZGUpO1xuICAgIGlmIChyYXcpIHJldHVybiByYXc7XG4gICAgLy8gZWxzZSBmYWxsIHRocm91Z2ggdG8gZXhwb3J0QXN5bmMgKFNWRyBpbGx1c3RyYXRpb24sIHZlY3RvciBncmFwaGljLCBldGMuKVxuICB9XG5cbiAgLy8gRnVsbC1wYWdlIGFuZCBzZWN0aW9uIHNjcmVlbnNob3RzIHVzZSBleHBvcnRBc3luYyAocmVuZGVyZWQgY29tcG9zaXRlKS5cbiAgLy8gU2NhbGUgdXAgdG8gMnggZm9yIGZ1bGwtcGFnZSB0byBwcmVzZXJ2ZSBkZXRhaWwgd2hlbiBjb21wYXJpbmcgd2l0aCBicm93c2VyLlxuICBjb25zdCBleHBvcnRTY2FsZSA9IHRhc2tUeXBlID09PSAnZnVsbC1wYWdlJyA/IDIgOiBzY2FsZTtcbiAgcmV0dXJuIGF3YWl0IChub2RlIGFzIFNjZW5lTm9kZSkuZXhwb3J0QXN5bmMoe1xuICAgIGZvcm1hdDogJ1BORycsXG4gICAgY29uc3RyYWludDogeyB0eXBlOiAnU0NBTEUnLCB2YWx1ZTogZXhwb3J0U2NhbGUgfSxcbiAgfSk7XG59XG5cbi8qKlxuICogRXh0cmFjdCByYXcgaW1hZ2UgYnl0ZXMgZnJvbSB0aGUgZmlyc3QgdmlzaWJsZSBJTUFHRSBmaWxsIG9uIGEgbm9kZS5cbiAqIFJldHVybnMgbnVsbCBpZiB0aGUgbm9kZSBoYXMgbm8gSU1BR0UgZmlsbCBvciB0aGUgaGFzaCBjYW4ndCBiZSByZXNvbHZlZC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gdHJ5RXh0cmFjdFJhd0ltYWdlQnl0ZXMobm9kZTogU2NlbmVOb2RlKTogUHJvbWlzZTxVaW50OEFycmF5IHwgbnVsbD4ge1xuICBjb25zdCBmaWxscyA9IChub2RlIGFzIGFueSkuZmlsbHM7XG4gIGlmICghZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkoZmlsbHMpKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBpbWFnZUZpbGwgPSBmaWxscy5maW5kKFxuICAgIChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UgJiYgKGYgYXMgSW1hZ2VQYWludCkuaW1hZ2VIYXNoLFxuICApIGFzIEltYWdlUGFpbnQgfCB1bmRlZmluZWQ7XG5cbiAgaWYgKCFpbWFnZUZpbGwgfHwgIWltYWdlRmlsbC5pbWFnZUhhc2gpIHJldHVybiBudWxsO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgaW1hZ2UgPSBmaWdtYS5nZXRJbWFnZUJ5SGFzaChpbWFnZUZpbGwuaW1hZ2VIYXNoKTtcbiAgICBpZiAoIWltYWdlKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gYXdhaXQgaW1hZ2UuZ2V0Qnl0ZXNBc3luYygpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBleHRyYWN0IHJhdyBpbWFnZSBieXRlcyBmcm9tICR7bm9kZS5uYW1lfTpgLCBlcnIpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZSBleHBvcnQgdGFza3MgaW4gYmF0Y2hlcyBvZiAxMC5cbiAqIFNlbmRzIGVhY2ggcmVzdWx0IHRvIFVJIGltbWVkaWF0ZWx5IHRvIGZyZWUgc2FuZGJveCBtZW1vcnkuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGVjdXRlQmF0Y2hFeHBvcnQoXG4gIHRhc2tzOiBJbWFnZUV4cG9ydFRhc2tbXSxcbiAgb25Qcm9ncmVzczogKGN1cnJlbnQ6IG51bWJlciwgdG90YWw6IG51bWJlciwgbGFiZWw6IHN0cmluZykgPT4gdm9pZCxcbiAgb25EYXRhOiAodGFzazogSW1hZ2VFeHBvcnRUYXNrLCBkYXRhOiBVaW50OEFycmF5KSA9PiB2b2lkLFxuICBzaG91bGRDYW5jZWw6ICgpID0+IGJvb2xlYW4sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdG90YWwgPSB0YXNrcy5sZW5ndGg7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbDsgaSArPSBCQVRDSF9TSVpFKSB7XG4gICAgaWYgKHNob3VsZENhbmNlbCgpKSByZXR1cm47XG5cbiAgICBjb25zdCBiYXRjaCA9IHRhc2tzLnNsaWNlKGksIGkgKyBCQVRDSF9TSVpFKTtcbiAgICBjb25zdCBiYXRjaFByb21pc2VzID0gYmF0Y2gubWFwKGFzeW5jICh0YXNrKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgZXhwb3J0Tm9kZSh0YXNrLm5vZGVJZCwgdGFzay5mb3JtYXQsIHRhc2suc2NhbGUsIHRhc2sudHlwZSk7XG4gICAgICAgIG9uRGF0YSh0YXNrLCBkYXRhKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gZXhwb3J0ICR7dGFzay5maWxlbmFtZX06YCwgZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGF3YWl0IFByb21pc2UuYWxsKGJhdGNoUHJvbWlzZXMpO1xuICAgIGNvbnN0IGRvbmUgPSBNYXRoLm1pbihpICsgQkFUQ0hfU0laRSwgdG90YWwpO1xuICAgIG9uUHJvZ3Jlc3MoZG9uZSwgdG90YWwsIGBFeHBvcnRpbmcgKCR7ZG9uZX0vJHt0b3RhbH0pLi4uYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZCB0aGUgaW1hZ2UtbWFwLmpzb24gZnJvbSBleHBvcnQgdGFza3MgYW5kIHNlY3Rpb24gZGF0YS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkSW1hZ2VNYXAoXG4gIHRhc2tzOiBJbWFnZUV4cG9ydFRhc2tbXSxcbiAgc2VjdGlvbnM6IHsgbmFtZTogc3RyaW5nOyBjaGlsZHJlbjogU2NlbmVOb2RlW10gfVtdXG4pOiBJbWFnZU1hcCB7XG4gIGNvbnN0IGltYWdlczogUmVjb3JkPHN0cmluZywgSW1hZ2VNYXBFbnRyeT4gPSB7fTtcbiAgY29uc3QgYnlTZWN0aW9uTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7fTtcblxuICBjb25zdCBhc3NldFRhc2tzID0gdGFza3MuZmlsdGVyKHQgPT4gdC50eXBlID09PSAnYXNzZXQnKTtcblxuICBmb3IgKGNvbnN0IHRhc2sgb2YgYXNzZXRUYXNrcykge1xuICAgIGltYWdlc1t0YXNrLmZpbGVuYW1lXSA9IHtcbiAgICAgIGZpbGU6IHRhc2suZmlsZW5hbWUsXG4gICAgICBleHQ6IHRhc2suZm9ybWF0LnRvTG93ZXJDYXNlKCksXG4gICAgICBub2RlTmFtZXM6IFt0YXNrLm5vZGVOYW1lXSxcbiAgICAgIHJlYWRhYmxlTmFtZTogdGFzay5maWxlbmFtZSxcbiAgICAgIGRpbWVuc2lvbnM6IG51bGwsXG4gICAgICB1c2VkSW5TZWN0aW9uczogW10sXG4gICAgfTtcbiAgfVxuXG4gIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBzZWN0aW9ucykge1xuICAgIGNvbnN0IHNlY3Rpb25JbWFnZXM6IHN0cmluZ1tdID0gW107XG4gICAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICAgIGlmIChoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpKSB7XG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gYCR7c2x1Z2lmeShub2RlLm5hbWUpfS5wbmdgO1xuICAgICAgICBzZWN0aW9uSW1hZ2VzLnB1c2goZmlsZW5hbWUpO1xuICAgICAgICBpZiAoaW1hZ2VzW2ZpbGVuYW1lXSkge1xuICAgICAgICAgIGltYWdlc1tmaWxlbmFtZV0udXNlZEluU2VjdGlvbnMucHVzaChzZWN0aW9uLm5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygc2VjdGlvbi5jaGlsZHJlbikge1xuICAgICAgd2FsayhjaGlsZCk7XG4gICAgfVxuICAgIGJ5U2VjdGlvbk1hcFtzZWN0aW9uLm5hbWVdID0gc2VjdGlvbkltYWdlcztcbiAgfVxuXG4gIHJldHVybiB7IGltYWdlcywgYnlfc2VjdGlvbjogYnlTZWN0aW9uTWFwIH07XG59XG4iLCAiaW1wb3J0IHtcbiAgU2VjdGlvblNwZWNzLCBEZXNpZ25Ub2tlbnMsIEV4cG9ydE1hbmlmZXN0LCBFeHBvcnRNYW5pZmVzdFBhZ2UsXG4gIFJlc3BvbnNpdmVQYWlyLCBSZXNwb25zaXZlTWFwLCBQYWdlVG9rZW5zLCBJbWFnZU1hcCwgRm9udFRva2VuSW5mbyxcbiAgUmVzcG9uc2l2ZU92ZXJyaWRlLCBTZWN0aW9uU3BlYyxcbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBzbHVnaWZ5LCB0b0xheW91dE5hbWUgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGNvbGxlY3RDb2xvcnMgfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IGNvbGxlY3RGb250cywgY291bnRUZXh0Tm9kZXMgfSBmcm9tICcuL3R5cG9ncmFwaHknO1xuaW1wb3J0IHsgY29sbGVjdFNwYWNpbmcgfSBmcm9tICcuL3NwYWNpbmcnO1xuaW1wb3J0IHsgcGFyc2VTZWN0aW9ucyB9IGZyb20gJy4vc2VjdGlvbi1wYXJzZXInO1xuaW1wb3J0IHsgbWF0Y2hSZXNwb25zaXZlRnJhbWVzIH0gZnJvbSAnLi9yZXNwb25zaXZlJztcbmltcG9ydCB7IGJ1aWxkRXhwb3J0VGFza3MsIGV4ZWN1dGVCYXRjaEV4cG9ydCwgYnVpbGRJbWFnZU1hcCB9IGZyb20gJy4vaW1hZ2UtZXhwb3J0ZXInO1xuaW1wb3J0IHsgZXh0cmFjdFZhcmlhYmxlcyB9IGZyb20gJy4vdmFyaWFibGVzJztcbmltcG9ydCB7IG5vcm1hbGl6ZVNlY3Rpb25OYW1lIH0gZnJvbSAnLi9wYXR0ZXJucyc7XG5cbi8qKlxuICogTWFzdGVyIGV4dHJhY3Rpb24gb3JjaGVzdHJhdG9yLlxuICogQ29vcmRpbmF0ZXMgYWxsIG1vZHVsZXMgZm9yIHRoZSBzZWxlY3RlZCBmcmFtZXMgYW5kIHNlbmRzIHJlc3VsdHMgdG8gVUkuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5FeHRyYWN0aW9uKFxuICBmcmFtZUlkczogc3RyaW5nW10sXG4gIHJlc3BvbnNpdmVQYWlyczogUmVzcG9uc2l2ZVBhaXJbXSxcbiAgc2VuZE1lc3NhZ2U6IChtc2c6IGFueSkgPT4gdm9pZCxcbiAgc2hvdWxkQ2FuY2VsOiAoKSA9PiBib29sZWFuLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGFsbERlc2lnblRva2VuQ29sb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGNvbnN0IGFsbERlc2lnblRva2VuRm9udHM6IFJlY29yZDxzdHJpbmcsIEZvbnRUb2tlbkluZm8+ID0ge307XG4gIGNvbnN0IGFsbFNwYWNpbmdWYWx1ZXMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgY29uc3QgbWFuaWZlc3RQYWdlczogRXhwb3J0TWFuaWZlc3RQYWdlW10gPSBbXTtcbiAgbGV0IHRvdGFsU2VjdGlvbnMgPSAwO1xuICBsZXQgdG90YWxJbWFnZXMgPSAwO1xuXG4gIC8vIFByZS1jb21wdXRlIHRoZSBzZXQgb2Ygc2VjdGlvbiBuYW1lcyB0aGF0IGFwcGVhciBvbiBcdTIyNjUyIHNlbGVjdGVkIHBhZ2VzLlxuICAvLyBUaGVzZSBhcmUgY2FuZGlkYXRlcyBmb3IgZ2xvYmFsIFdQIHRoZW1lIHBhcnRzIChoZWFkZXIucGhwIC8gZm9vdGVyLnBocFxuICAvLyAvIHRlbXBsYXRlLXBhcnRzKS4gcGFyc2VTZWN0aW9ucyB3aWxsIG1hcmsgbWF0Y2hpbmcgc2VjdGlvbnMgaXNHbG9iYWwuXG4gIGNvbnN0IGdsb2JhbE5hbWVzID0gY29tcHV0ZUdsb2JhbFNlY3Rpb25OYW1lcyhyZXNwb25zaXZlUGFpcnMpO1xuXG4gIC8vIFByb2Nlc3MgZWFjaCByZXNwb25zaXZlIHBhaXIgKGVhY2ggPSBvbmUgcGFnZSlcbiAgZm9yIChjb25zdCBwYWlyIG9mIHJlc3BvbnNpdmVQYWlycykge1xuICAgIGlmIChzaG91bGRDYW5jZWwoKSkgcmV0dXJuO1xuXG4gICAgY29uc3QgZGVza3RvcE5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChwYWlyLmRlc2t0b3AuZnJhbWVJZCk7XG4gICAgaWYgKCFkZXNrdG9wTm9kZSB8fCBkZXNrdG9wTm9kZS50eXBlICE9PSAnRlJBTUUnKSBjb250aW51ZTtcbiAgICBjb25zdCBkZXNrdG9wRnJhbWUgPSBkZXNrdG9wTm9kZSBhcyBGcmFtZU5vZGU7XG5cbiAgICBzZW5kTWVzc2FnZSh7XG4gICAgICB0eXBlOiAnRVhQT1JUX1BST0dSRVNTJyxcbiAgICAgIGN1cnJlbnQ6IDAsXG4gICAgICB0b3RhbDogMTAwLFxuICAgICAgbGFiZWw6IGBFeHRyYWN0aW5nIFwiJHtwYWlyLnBhZ2VOYW1lfVwiLi4uYCxcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBQYXJzZSBzZWN0aW9ucyBmcm9tIGRlc2t0b3AgZnJhbWUgXHUyNTAwXHUyNTAwXG4gICAgY29uc3Qgc2VjdGlvbnMgPSBwYXJzZVNlY3Rpb25zKGRlc2t0b3BGcmFtZSwgZ2xvYmFsTmFtZXMpO1xuICAgIGNvbnN0IHNlY3Rpb25Db3VudCA9IE9iamVjdC5rZXlzKHNlY3Rpb25zKS5sZW5ndGg7XG4gICAgdG90YWxTZWN0aW9ucyArPSBzZWN0aW9uQ291bnQ7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTWVyZ2UgcmVzcG9uc2l2ZSBvdmVycmlkZXMgZnJvbSBtb2JpbGUgZnJhbWUgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHBhaXIubW9iaWxlKSB7XG4gICAgICBjb25zdCBtb2JpbGVOb2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQocGFpci5tb2JpbGUuZnJhbWVJZCk7XG4gICAgICBpZiAobW9iaWxlTm9kZSAmJiBtb2JpbGVOb2RlLnR5cGUgPT09ICdGUkFNRScpIHtcbiAgICAgICAgY29uc3QgbW9iaWxlRnJhbWUgPSBtb2JpbGVOb2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgICAgY29uc3QgbW9iaWxlU2VjdGlvbnMgPSBwYXJzZVNlY3Rpb25zKG1vYmlsZUZyYW1lLCBnbG9iYWxOYW1lcyk7XG4gICAgICAgIG1lcmdlUmVzcG9uc2l2ZURhdGEoc2VjdGlvbnMsIG1vYmlsZVNlY3Rpb25zLCBwYWlyLm1vYmlsZS53aWR0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIHNlY3Rpb24tc3BlY3MuanNvbiBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBzZWN0aW9uU3BlY3M6IFNlY3Rpb25TcGVjcyA9IHtcbiAgICAgIGZpZ21hX2NhbnZhc193aWR0aDogTWF0aC5yb3VuZChkZXNrdG9wRnJhbWUud2lkdGgpLFxuICAgICAgZmlnbWFfY2FudmFzX2hlaWdodDogTWF0aC5yb3VuZChkZXNrdG9wRnJhbWUuaGVpZ2h0KSxcbiAgICAgIG1vYmlsZV9jYW52YXNfd2lkdGg6IHBhaXIubW9iaWxlPy53aWR0aCxcbiAgICAgIHBhZ2Vfc2x1ZzogcGFpci5wYWdlU2x1ZyxcbiAgICAgIGV4dHJhY3RlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgZXh0cmFjdGlvbl9tZXRob2Q6ICdwbHVnaW4nLFxuICAgICAgc2VjdGlvbnMsXG4gICAgfTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBDb2xsZWN0IHRva2VucyBmb3IgdGhpcyBwYWdlIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGNvbG9ycyA9IGNvbGxlY3RDb2xvcnMoZGVza3RvcEZyYW1lKTtcbiAgICBjb25zdCBmb250cyA9IGNvbGxlY3RGb250cyhkZXNrdG9wRnJhbWUpO1xuICAgIGNvbnN0IHNwYWNpbmcgPSBjb2xsZWN0U3BhY2luZyhkZXNrdG9wRnJhbWUpO1xuXG4gICAgLy8gQnVpbGQgcGFnZSB0b2tlbnNcbiAgICBjb25zdCBwYWdlVG9rZW5zOiBQYWdlVG9rZW5zID0ge1xuICAgICAgY29sb3JzLFxuICAgICAgZm9udHM6IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgT2JqZWN0LmVudHJpZXMoZm9udHMpLm1hcCgoW2ZhbWlseSwgZGF0YV0pID0+IFtmYW1pbHksIHtcbiAgICAgICAgICBzdHlsZXM6IFsuLi5kYXRhLnN0eWxlc10sXG4gICAgICAgICAgc2l6ZXM6IFsuLi5kYXRhLnNpemVzXS5zb3J0KChhLCBiKSA9PiBhIC0gYiksXG4gICAgICAgICAgY291bnQ6IGRhdGEuY291bnQsXG4gICAgICAgIH1dKVxuICAgICAgKSxcbiAgICAgIHNwYWNpbmcsXG4gICAgICBzZWN0aW9uczogYnVpbGRUb2tlblNlY3Rpb25zKGRlc2t0b3BGcmFtZSwgcGFpci5wYWdlU2x1ZyksXG4gICAgfTtcblxuICAgIC8vIE1lcmdlIGludG8gZ2xvYmFsIHRva2Vuc1xuICAgIGZvciAoY29uc3QgW2hleCwgY291bnRdIG9mIE9iamVjdC5lbnRyaWVzKGNvbG9ycykpIHtcbiAgICAgIGlmIChjb3VudCA+PSAyKSB7XG4gICAgICAgIGNvbnN0IHZhck5hbWUgPSBgLS1jbHItJHtoZXguc2xpY2UoMSkudG9Mb3dlckNhc2UoKX1gO1xuICAgICAgICBhbGxEZXNpZ25Ub2tlbkNvbG9yc1t2YXJOYW1lXSA9IGhleDtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBbZmFtaWx5LCBkYXRhXSBvZiBPYmplY3QuZW50cmllcyhmb250cykpIHtcbiAgICAgIGFsbERlc2lnblRva2VuRm9udHNbZmFtaWx5XSA9IHtcbiAgICAgICAgc3R5bGVzOiBbLi4uZGF0YS5zdHlsZXNdLFxuICAgICAgICBzaXplczogWy4uLmRhdGEuc2l6ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKSxcbiAgICAgICAgY291bnQ6IGRhdGEuY291bnQsXG4gICAgICB9O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHMgb2Ygc3BhY2luZykge1xuICAgICAgYWxsU3BhY2luZ1ZhbHVlcy5hZGQocy52YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEdlbmVyYXRlIHNwZWMubWQgXHUyNTAwXHUyNTAwXG4gICAgY29uc3Qgc3BlY01kID0gZ2VuZXJhdGVTcGVjTWQocGFpci5wYWdlTmFtZSwgcGFpci5wYWdlU2x1Zywgc2VjdGlvblNwZWNzLCBwYWdlVG9rZW5zKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBTZW5kIHBhZ2UgZGF0YSB0byBVSSBcdTI1MDBcdTI1MDBcbiAgICBzZW5kTWVzc2FnZSh7XG4gICAgICB0eXBlOiAnUEFHRV9EQVRBJyxcbiAgICAgIHBhZ2VTbHVnOiBwYWlyLnBhZ2VTbHVnLFxuICAgICAgc2VjdGlvblNwZWNzLFxuICAgICAgc3BlY01kLFxuICAgICAgdG9rZW5zOiBwYWdlVG9rZW5zLFxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEV4cG9ydCBpbWFnZXMgYW5kIHNjcmVlbnNob3RzIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGV4cG9ydFRhc2tzID0gYnVpbGRFeHBvcnRUYXNrcyhkZXNrdG9wRnJhbWUsIHBhaXIucGFnZVNsdWcpO1xuICAgIGNvbnN0IGFzc2V0Q291bnQgPSBleHBvcnRUYXNrcy5maWx0ZXIodCA9PiB0LnR5cGUgPT09ICdhc3NldCcpLmxlbmd0aDtcbiAgICB0b3RhbEltYWdlcyArPSBhc3NldENvdW50O1xuXG4gICAgYXdhaXQgZXhlY3V0ZUJhdGNoRXhwb3J0KFxuICAgICAgZXhwb3J0VGFza3MsXG4gICAgICAoY3VycmVudCwgdG90YWwsIGxhYmVsKSA9PiB7XG4gICAgICAgIHNlbmRNZXNzYWdlKHsgdHlwZTogJ0VYUE9SVF9QUk9HUkVTUycsIGN1cnJlbnQsIHRvdGFsLCBsYWJlbCB9KTtcbiAgICAgIH0sXG4gICAgICAodGFzaywgZGF0YSkgPT4ge1xuICAgICAgICBpZiAodGFzay50eXBlID09PSAnc2NyZWVuc2hvdCcgfHwgdGFzay50eXBlID09PSAnZnVsbC1wYWdlJykge1xuICAgICAgICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6ICdTQ1JFRU5TSE9UX0RBVEEnLFxuICAgICAgICAgICAgcGF0aDogYCR7dGFzay5wYWdlUGF0aH0vc2NyZWVuc2hvdHNgLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHRhc2suZmlsZW5hbWUsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6ICdJTUFHRV9EQVRBJyxcbiAgICAgICAgICAgIHBhdGg6IGAke3Rhc2sucGFnZVBhdGh9L2ltYWdlc2AsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGFzay5maWxlbmFtZSxcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzaG91bGRDYW5jZWwsXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCdWlsZCBhbmQgc2VuZCBpbWFnZSBtYXAgXHUyNTAwXHUyNTAwXG4gICAgY29uc3Qgc2VjdGlvbkNoaWxkcmVuID0gZGVza3RvcEZyYW1lLmNoaWxkcmVuXG4gICAgICAuZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSlcbiAgICAgIC5tYXAoYyA9PiAoeyBuYW1lOiBjLm5hbWUsIGNoaWxkcmVuOiAnY2hpbGRyZW4nIGluIGMgPyBbLi4uKGMgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbl0gOiBbXSB9KSk7XG4gICAgY29uc3QgaW1hZ2VNYXAgPSBidWlsZEltYWdlTWFwKGV4cG9ydFRhc2tzLCBzZWN0aW9uQ2hpbGRyZW4pO1xuICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6ICdJTUFHRV9NQVBfREFUQScsXG4gICAgICBwYXRoOiBgcGFnZXMvJHtwYWlyLnBhZ2VTbHVnfS9pbWFnZXNgLFxuICAgICAgaW1hZ2VNYXAsXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQnVpbGQgbWFuaWZlc3QgcGFnZSBlbnRyeSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBoYXNGdWxsUGFnZSA9IGV4cG9ydFRhc2tzLnNvbWUodCA9PiB0LnR5cGUgPT09ICdmdWxsLXBhZ2UnKTtcbiAgICBtYW5pZmVzdFBhZ2VzLnB1c2goe1xuICAgICAgc2x1ZzogcGFpci5wYWdlU2x1ZyxcbiAgICAgIGZyYW1lTmFtZTogcGFpci5kZXNrdG9wLmZyYW1lTmFtZSxcbiAgICAgIGZyYW1lSWQ6IHBhaXIuZGVza3RvcC5mcmFtZUlkLFxuICAgICAgY2FudmFzV2lkdGg6IE1hdGgucm91bmQoZGVza3RvcEZyYW1lLndpZHRoKSxcbiAgICAgIGNhbnZhc0hlaWdodDogTWF0aC5yb3VuZChkZXNrdG9wRnJhbWUuaGVpZ2h0KSxcbiAgICAgIHNlY3Rpb25Db3VudCxcbiAgICAgIGltYWdlQ291bnQ6IGFzc2V0Q291bnQsXG4gICAgICBoYXNSZXNwb25zaXZlOiBwYWlyLm1vYmlsZSAhPT0gbnVsbCxcbiAgICAgIG1vYmlsZUZyYW1lSWQ6IHBhaXIubW9iaWxlPy5mcmFtZUlkID8/IG51bGwsXG4gICAgICBpbnRlcmFjdGlvbkNvdW50OiBPYmplY3QudmFsdWVzKHNlY3Rpb25zKVxuICAgICAgICAucmVkdWNlKChzdW0sIHMpID0+IHN1bSArIChzLmludGVyYWN0aW9ucz8ubGVuZ3RoID8/IDApLCAwKSxcbiAgICAgIGhhc0Z1bGxQYWdlU2NyZWVuc2hvdDogaGFzRnVsbFBhZ2UsXG4gICAgICBmdWxsUGFnZVNjcmVlbnNob3RGaWxlOiBoYXNGdWxsUGFnZSA/ICdfZnVsbC1wYWdlLnBuZycgOiBudWxsLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIGZpbmFsIG1hbmlmZXN0IGFuZCBnbG9iYWwgdG9rZW5zIFx1MjUwMFx1MjUwMFxuICBjb25zdCBtYW5pZmVzdDogRXhwb3J0TWFuaWZlc3QgPSB7XG4gICAgZXhwb3J0VmVyc2lvbjogJzEuMCcsXG4gICAgZXhwb3J0RGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIGZpZ21hRmlsZU5hbWU6IGZpZ21hLnJvb3QubmFtZSxcbiAgICBmaWdtYUZpbGVLZXk6IGZpZ21hLmZpbGVLZXkgPz8gJycsXG4gICAgcGx1Z2luVmVyc2lvbjogJzEuMC4wJyxcbiAgICBwYWdlczogbWFuaWZlc3RQYWdlcyxcbiAgICB0b3RhbFNlY3Rpb25zLFxuICAgIHRvdGFsSW1hZ2VzLFxuICAgIGRlc2lnblRva2Vuc1N1bW1hcnk6IHtcbiAgICAgIGNvbG9yQ291bnQ6IE9iamVjdC5rZXlzKGFsbERlc2lnblRva2VuQ29sb3JzKS5sZW5ndGgsXG4gICAgICBmb250Q291bnQ6IE9iamVjdC5rZXlzKGFsbERlc2lnblRva2VuRm9udHMpLmxlbmd0aCxcbiAgICAgIHNwYWNpbmdWYWx1ZXM6IGFsbFNwYWNpbmdWYWx1ZXMuc2l6ZSxcbiAgICB9LFxuICB9O1xuXG4gIC8vIEZpZ21hIFZhcmlhYmxlcyAoYXV0aG9yaXRhdGl2ZSB0b2tlbiBuYW1lcyB3aGVuIGF2YWlsYWJsZSlcbiAgY29uc3QgdmFyaWFibGVzID0gZXh0cmFjdFZhcmlhYmxlcygpO1xuXG4gIGNvbnN0IGRlc2lnblRva2VuczogRGVzaWduVG9rZW5zID0ge1xuICAgIGNvbG9yczogYWxsRGVzaWduVG9rZW5Db2xvcnMsXG4gICAgZm9udHM6IGFsbERlc2lnblRva2VuRm9udHMsXG4gICAgc3BhY2luZzogWy4uLmFsbFNwYWNpbmdWYWx1ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKSxcbiAgICB2YXJpYWJsZXM6IHZhcmlhYmxlcy5wcmVzZW50ID8gdmFyaWFibGVzIDogdW5kZWZpbmVkLFxuICB9O1xuXG4gIC8vIFdoZW4gRmlnbWEgVmFyaWFibGVzIGFyZSBhdmFpbGFibGUsIHByZWZlciB2YXJpYWJsZSBuYW1lcyBmb3IgY29sb3JzOlxuICAvLyBvdmVyd3JpdGUgdGhlIGF1dG8tZ2VuZXJhdGVkIC0tY2xyLTxoZXg+IHdpdGggLS1jbHItPHZhcmlhYmxlLW5hbWU+XG4gIGlmICh2YXJpYWJsZXMucHJlc2VudCkge1xuICAgIGZvciAoY29uc3QgW2NvbE5hbWUsIHZhcnNdIG9mIE9iamVjdC5lbnRyaWVzKHZhcmlhYmxlcy5jb2xsZWN0aW9ucykpIHtcbiAgICAgIGlmICghY29sTmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjb2xvcicpKSBjb250aW51ZTtcbiAgICAgIGZvciAoY29uc3QgW3Zhck5hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh2YXJzKSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAhdmFsdWUuc3RhcnRzV2l0aCgnIycpKSBjb250aW51ZTtcbiAgICAgICAgY29uc3Qgc2FmZU5hbWUgPSB2YXJOYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXowLTldKy9nLCAnLScpLnJlcGxhY2UoLy0rL2csICctJykucmVwbGFjZSgvXi18LSQvZywgJycpO1xuICAgICAgICBjb25zdCBjc3NWYXIgPSBgLS1jbHItJHtzYWZlTmFtZX1gO1xuICAgICAgICBhbGxEZXNpZ25Ub2tlbkNvbG9yc1tjc3NWYXJdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIGRlc2lnblRva2Vucy5jb2xvcnMgPSBhbGxEZXNpZ25Ub2tlbkNvbG9ycztcbiAgfVxuXG4gIC8vIEJ1aWxkIHJlc3BvbnNpdmUgbWFwIGZyb20gdGhlIHBhaXJzXG4gIGNvbnN0IHJlc3BvbnNpdmVNYXAgPSBtYXRjaFJlc3BvbnNpdmVGcmFtZXMoXG4gICAgcmVzcG9uc2l2ZVBhaXJzLmZsYXRNYXAocCA9PiB7XG4gICAgICBjb25zdCBmcmFtZXMgPSBbe1xuICAgICAgICBpZDogcC5kZXNrdG9wLmZyYW1lSWQsXG4gICAgICAgIG5hbWU6IHAuZGVza3RvcC5mcmFtZU5hbWUsXG4gICAgICAgIHdpZHRoOiBwLmRlc2t0b3Aud2lkdGgsXG4gICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgYnJlYWtwb2ludDogJ2Rlc2t0b3AnIGFzIGNvbnN0LFxuICAgICAgICBzZWN0aW9uQ291bnQ6IDAsXG4gICAgICAgIGhhc0F1dG9MYXlvdXQ6IGZhbHNlLFxuICAgICAgICByZXNwb25zaXZlUGFpcklkOiBudWxsLFxuICAgICAgfV07XG4gICAgICBpZiAocC5tb2JpbGUpIHtcbiAgICAgICAgZnJhbWVzLnB1c2goe1xuICAgICAgICAgIGlkOiBwLm1vYmlsZS5mcmFtZUlkLFxuICAgICAgICAgIG5hbWU6IHAubW9iaWxlLmZyYW1lTmFtZSxcbiAgICAgICAgICB3aWR0aDogcC5tb2JpbGUud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICAgIGJyZWFrcG9pbnQ6ICdtb2JpbGUnIGFzIGNvbnN0LFxuICAgICAgICAgIHNlY3Rpb25Db3VudDogMCxcbiAgICAgICAgICBoYXNBdXRvTGF5b3V0OiBmYWxzZSxcbiAgICAgICAgICByZXNwb25zaXZlUGFpcklkOiBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmcmFtZXM7XG4gICAgfSlcbiAgKTtcblxuICBzZW5kTWVzc2FnZSh7XG4gICAgdHlwZTogJ0VYUE9SVF9DT01QTEVURScsXG4gICAgbWFuaWZlc3QsXG4gICAgcmVzcG9uc2l2ZU1hcCxcbiAgICBkZXNpZ25Ub2tlbnMsXG4gIH0pO1xufVxuXG4vKipcbiAqIE1lcmdlIHJlc3BvbnNpdmUgb3ZlcnJpZGVzIGZyb20gbW9iaWxlIHNlY3Rpb25zIGludG8gZGVza3RvcCBzZWN0aW9ucy5cbiAqIE9ubHkgaW5jbHVkZXMgcHJvcGVydGllcyB0aGF0IGRpZmZlciBiZXR3ZWVuIGRlc2t0b3AgYW5kIG1vYmlsZS5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VSZXNwb25zaXZlRGF0YShcbiAgZGVza3RvcFNlY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4sXG4gIG1vYmlsZVNlY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4sXG4gIG1vYmlsZVdpZHRoOiBudW1iZXIsXG4pOiB2b2lkIHtcbiAgY29uc3QgYnBLZXkgPSBTdHJpbmcobW9iaWxlV2lkdGgpO1xuXG4gIGZvciAoY29uc3QgW2xheW91dE5hbWUsIGRlc2t0b3BTcGVjXSBvZiBPYmplY3QuZW50cmllcyhkZXNrdG9wU2VjdGlvbnMpKSB7XG4gICAgY29uc3QgbW9iaWxlU3BlYyA9IG1vYmlsZVNlY3Rpb25zW2xheW91dE5hbWVdO1xuICAgIGlmICghbW9iaWxlU3BlYykgY29udGludWU7XG5cbiAgICBjb25zdCBvdmVycmlkZTogUmVzcG9uc2l2ZU92ZXJyaWRlID0ge307XG5cbiAgICAvLyBEaWZmIHNlY3Rpb24gc3R5bGVzXG4gICAgY29uc3Qgc2VjdGlvbkRpZmY6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGRlc2t0b3BWYWxdIG9mIE9iamVjdC5lbnRyaWVzKGRlc2t0b3BTcGVjLnNlY3Rpb24pKSB7XG4gICAgICBjb25zdCBtb2JpbGVWYWwgPSAobW9iaWxlU3BlYy5zZWN0aW9uIGFzIGFueSlba2V5XTtcbiAgICAgIGlmIChtb2JpbGVWYWwgJiYgbW9iaWxlVmFsICE9PSBkZXNrdG9wVmFsKSB7XG4gICAgICAgIHNlY3Rpb25EaWZmW2tleV0gPSBtb2JpbGVWYWw7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChPYmplY3Qua2V5cyhzZWN0aW9uRGlmZikubGVuZ3RoID4gMCkge1xuICAgICAgb3ZlcnJpZGUuc2VjdGlvbiA9IHNlY3Rpb25EaWZmO1xuICAgIH1cblxuICAgIC8vIERpZmYgZWxlbWVudCBzdHlsZXNcbiAgICBjb25zdCBlbGVtZW50c0RpZmY6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIGFueT4+ID0ge307XG4gICAgZm9yIChjb25zdCBbZWxlbU5hbWUsIGRlc2t0b3BFbGVtXSBvZiBPYmplY3QuZW50cmllcyhkZXNrdG9wU3BlYy5lbGVtZW50cykpIHtcbiAgICAgIGNvbnN0IG1vYmlsZUVsZW0gPSBtb2JpbGVTcGVjLmVsZW1lbnRzW2VsZW1OYW1lXTtcbiAgICAgIGlmICghbW9iaWxlRWxlbSkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IGRpZmY6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgZGVza3RvcFZhbF0gb2YgT2JqZWN0LmVudHJpZXMoZGVza3RvcEVsZW0pKSB7XG4gICAgICAgIGNvbnN0IG1vYmlsZVZhbCA9IChtb2JpbGVFbGVtIGFzIGFueSlba2V5XTtcbiAgICAgICAgaWYgKG1vYmlsZVZhbCAhPT0gdW5kZWZpbmVkICYmIG1vYmlsZVZhbCAhPT0gZGVza3RvcFZhbCkge1xuICAgICAgICAgIGRpZmZba2V5XSA9IG1vYmlsZVZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKE9iamVjdC5rZXlzKGRpZmYpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZWxlbWVudHNEaWZmW2VsZW1OYW1lXSA9IGRpZmY7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChPYmplY3Qua2V5cyhlbGVtZW50c0RpZmYpLmxlbmd0aCA+IDApIHtcbiAgICAgIG92ZXJyaWRlLmVsZW1lbnRzID0gZWxlbWVudHNEaWZmO1xuICAgIH1cblxuICAgIC8vIERpZmYgZ3JpZFxuICAgIGlmIChtb2JpbGVTcGVjLmdyaWQuY29sdW1ucyAhPT0gZGVza3RvcFNwZWMuZ3JpZC5jb2x1bW5zIHx8IG1vYmlsZVNwZWMuZ3JpZC5nYXAgIT09IGRlc2t0b3BTcGVjLmdyaWQuZ2FwKSB7XG4gICAgICBvdmVycmlkZS5ncmlkID0ge307XG4gICAgICBpZiAobW9iaWxlU3BlYy5ncmlkLmNvbHVtbnMgIT09IGRlc2t0b3BTcGVjLmdyaWQuY29sdW1ucykge1xuICAgICAgICBvdmVycmlkZS5ncmlkLmNvbHVtbnMgPSBtb2JpbGVTcGVjLmdyaWQuY29sdW1ucztcbiAgICAgIH1cbiAgICAgIGlmIChtb2JpbGVTcGVjLmdyaWQuZ2FwICE9PSBkZXNrdG9wU3BlYy5ncmlkLmdhcCkge1xuICAgICAgICBvdmVycmlkZS5ncmlkLmdhcCA9IG1vYmlsZVNwZWMuZ3JpZC5nYXA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKE9iamVjdC5rZXlzKG92ZXJyaWRlKS5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAoIWRlc2t0b3BTcGVjLnJlc3BvbnNpdmUpIGRlc2t0b3BTcGVjLnJlc3BvbnNpdmUgPSB7fTtcbiAgICAgIGRlc2t0b3BTcGVjLnJlc3BvbnNpdmVbYnBLZXldID0gb3ZlcnJpZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGQgdG9rZW4gc2VjdGlvbiBtZXRhZGF0YSBmb3IgdG9rZW5zLmpzb24uXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkVG9rZW5TZWN0aW9ucyhmcmFtZTogRnJhbWVOb2RlLCBwYWdlU2x1Zzogc3RyaW5nKSB7XG4gIGNvbnN0IHNlY3Rpb25zID0gZnJhbWUuY2hpbGRyZW5cbiAgICAuZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94XG4gICAgKVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIHJldHVybiBzZWN0aW9ucy5tYXAoKHMsIGkpID0+IHtcbiAgICBjb25zdCBib3VuZHMgPSBzLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IHBhcmVudEJvdW5kcyA9IGZyYW1lLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IGltYWdlQ291bnQgPSBjb3VudEltYWdlcyhzKTtcbiAgICBjb25zdCB0ZXh0Tm9kZXMgPSBjb3VudFRleHROb2RlcyhzKTtcblxuICAgIHJldHVybiB7XG4gICAgICBpbmRleDogaSArIDEsXG4gICAgICBuYW1lOiBzLm5hbWUsXG4gICAgICBpZDogcy5pZCxcbiAgICAgIGRpbWVuc2lvbnM6IHsgd2lkdGg6IE1hdGgucm91bmQoYm91bmRzLndpZHRoKSwgaGVpZ2h0OiBNYXRoLnJvdW5kKGJvdW5kcy5oZWlnaHQpIH0sXG4gICAgICB5X29mZnNldDogTWF0aC5yb3VuZChib3VuZHMueSAtIHBhcmVudEJvdW5kcy55KSxcbiAgICAgIGhhc0F1dG9MYXlvdXQ6IHMudHlwZSA9PT0gJ0ZSQU1FJyAmJiAocyBhcyBGcmFtZU5vZGUpLmxheW91dE1vZGUgIT09IHVuZGVmaW5lZCAmJiAocyBhcyBGcmFtZU5vZGUpLmxheW91dE1vZGUgIT09ICdOT05FJyxcbiAgICAgIGltYWdlX2NvdW50OiBpbWFnZUNvdW50LFxuICAgICAgaW1hZ2VfZmlsZXM6IGNvbGxlY3RJbWFnZUZpbGVOYW1lcyhzKSxcbiAgICAgIHRleHRfbm9kZXM6IHRleHROb2RlcyxcbiAgICAgIHNjcmVlbnNob3Q6IGBzY3JlZW5zaG90cy8ke3NsdWdpZnkocy5uYW1lKX0ucG5nYCxcbiAgICAgIHNjcmVlbnNob3RfY29tcGxldGU6IHRydWUsXG4gICAgfTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvdW50SW1hZ2VzKG5vZGU6IFNjZW5lTm9kZSk6IG51bWJlciB7XG4gIGxldCBjb3VudCA9IDA7XG4gIGZ1bmN0aW9uIHdhbGsobjogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdmaWxscycgaW4gbiAmJiBBcnJheS5pc0FycmF5KChuIGFzIGFueSkuZmlsbHMpKSB7XG4gICAgICBpZiAoKG4gYXMgYW55KS5maWxscy5zb21lKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpKSBjb3VudCsrO1xuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoY2hpbGQpO1xuICAgIH1cbiAgfVxuICB3YWxrKG5vZGUpO1xuICByZXR1cm4gY291bnQ7XG59XG5cbi8qKlxuICogUHJlLWNvbXB1dGUgdGhlIHNldCBvZiBub3JtYWxpemVkIHNlY3Rpb24gbmFtZXMgdGhhdCBhcHBlYXIgb24gXHUyMjY1MiBzZWxlY3RlZFxuICogcGFnZXMuIE1hdGNoaW5nIHNlY3Rpb25zIHdpbGwgYmUgbWFya2VkIGBpc0dsb2JhbDogdHJ1ZWAgYnkgcGFyc2VTZWN0aW9uc1xuICogc28gdGhlIFdQIGFnZW50IGNhbiBob2lzdCB0aGVtIGludG8gaGVhZGVyLnBocCAvIGZvb3Rlci5waHAgLyB0ZW1wbGF0ZS1wYXJ0c1xuICogcmF0aGVyIHRoYW4gaW5saW5pbmcgdGhlIHNhbWUgbWFya3VwIG9uIGV2ZXJ5IHBhZ2UuXG4gKlxuICogVGhlIHNjYW4gbWlycm9ycyBpZGVudGlmeVNlY3Rpb25zIChkcmlsbHMgb25lIHdyYXBwZXIgZGVlcCB3aGVuIHRoZSBwYWdlXG4gKiBoYXMgYSBzaW5nbGUgY29udGFpbmVyIGNoaWxkKSBzbyB0aGUgbWF0Y2hpbmcgc3RheXMgY29uc2lzdGVudCB3aXRoIHdoYXRcbiAqIHBhcnNlU2VjdGlvbnMgYWN0dWFsbHkgdHJlYXRzIGFzIGEgXCJzZWN0aW9uXCIuXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVHbG9iYWxTZWN0aW9uTmFtZXMocGFpcnM6IFJlc3BvbnNpdmVQYWlyW10pOiBTZXQ8c3RyaW5nPiB7XG4gIGNvbnN0IG5hbWVUb1BhZ2VDb3VudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgZm9yIChjb25zdCBwYWlyIG9mIHBhaXJzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChwYWlyLmRlc2t0b3AuZnJhbWVJZCk7XG4gICAgICBpZiAoIW5vZGUgfHwgbm9kZS50eXBlICE9PSAnRlJBTUUnKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBsZXQgY2FuZGlkYXRlcyA9IGZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICAgICApO1xuICAgICAgaWYgKGNhbmRpZGF0ZXMubGVuZ3RoID09PSAxICYmICdjaGlsZHJlbicgaW4gY2FuZGlkYXRlc1swXSkge1xuICAgICAgICBjb25zdCBpbm5lciA9IChjYW5kaWRhdGVzWzBdIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChpbm5lci5sZW5ndGggPiAxKSBjYW5kaWRhdGVzID0gaW5uZXI7XG4gICAgICB9XG4gICAgICBjb25zdCBzZWVuT25UaGlzUGFnZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgZm9yIChjb25zdCBjIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gbm9ybWFsaXplU2VjdGlvbk5hbWUoYy5uYW1lIHx8ICcnKTtcbiAgICAgICAgaWYgKCFrZXkpIGNvbnRpbnVlO1xuICAgICAgICBzZWVuT25UaGlzUGFnZS5hZGQoa2V5KTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBzZWVuT25UaGlzUGFnZSkge1xuICAgICAgICBuYW1lVG9QYWdlQ291bnQuc2V0KG5hbWUsIChuYW1lVG9QYWdlQ291bnQuZ2V0KG5hbWUpIHx8IDApICsgMSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdjb21wdXRlR2xvYmFsU2VjdGlvbk5hbWVzOiBmYWlsZWQgdG8gc2NhbiBmcmFtZScsIHBhaXIucGFnZU5hbWUsIGUpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG91dCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IFtuYW1lLCBjb3VudF0gb2YgbmFtZVRvUGFnZUNvdW50KSB7XG4gICAgaWYgKGNvdW50ID49IDIpIG91dC5hZGQobmFtZSk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gY29sbGVjdEltYWdlRmlsZU5hbWVzKG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbmFtZXM6IHN0cmluZ1tdID0gW107XG4gIGZ1bmN0aW9uIHdhbGsobjogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdmaWxscycgaW4gbiAmJiBBcnJheS5pc0FycmF5KChuIGFzIGFueSkuZmlsbHMpKSB7XG4gICAgICBpZiAoKG4gYXMgYW55KS5maWxscy5zb21lKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpKSB7XG4gICAgICAgIG5hbWVzLnB1c2goYCR7c2x1Z2lmeShuLm5hbWUpfS5wbmdgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbikge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobiBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB3YWxrKGNoaWxkKTtcbiAgICB9XG4gIH1cbiAgd2Fsayhub2RlKTtcbiAgcmV0dXJuIG5hbWVzO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgaHVtYW4tcmVhZGFibGUgc3BlYy5tZCBmcm9tIGV4dHJhY3RlZCBkYXRhLlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVNwZWNNZChwYWdlTmFtZTogc3RyaW5nLCBwYWdlU2x1Zzogc3RyaW5nLCBzcGVjczogU2VjdGlvblNwZWNzLCB0b2tlbnM6IFBhZ2VUb2tlbnMpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcbiAgbGluZXMucHVzaChgIyBEZXNpZ24gU3BlYyBcdTIwMTQgJHtwYWdlTmFtZX1gKTtcbiAgbGluZXMucHVzaChgIyMgU291cmNlOiBGaWdtYSBQbHVnaW4gRXhwb3J0YCk7XG4gIGxpbmVzLnB1c2goYCMjIEdlbmVyYXRlZDogJHtzcGVjcy5leHRyYWN0ZWRfYXR9YCk7XG4gIGxpbmVzLnB1c2goJycpO1xuICBsaW5lcy5wdXNoKCcjIyBQYWdlIE1ldGFkYXRhJyk7XG4gIGxpbmVzLnB1c2goYC0gUGFnZSBOYW1lOiAke3BhZ2VOYW1lfWApO1xuICBsaW5lcy5wdXNoKGAtIENhbnZhcyBXaWR0aDogJHtzcGVjcy5maWdtYV9jYW52YXNfd2lkdGh9cHhgKTtcbiAgbGluZXMucHVzaChgLSBTZWN0aW9uIENvdW50OiAke09iamVjdC5rZXlzKHNwZWNzLnNlY3Rpb25zKS5sZW5ndGh9YCk7XG4gIGlmIChzcGVjcy5tb2JpbGVfY2FudmFzX3dpZHRoKSB7XG4gICAgbGluZXMucHVzaChgLSBNb2JpbGUgQ2FudmFzIFdpZHRoOiAke3NwZWNzLm1vYmlsZV9jYW52YXNfd2lkdGh9cHhgKTtcbiAgfVxuICBsaW5lcy5wdXNoKCcnKTtcblxuICAvLyBDb2xvcnNcbiAgbGluZXMucHVzaCgnIyMgQ29sb3JzIFVzZWQnKTtcbiAgbGluZXMucHVzaCgnfCBIRVggfCBVc2FnZSBDb3VudCB8Jyk7XG4gIGxpbmVzLnB1c2goJ3wtLS0tLXwtLS0tLS0tLS0tLS18Jyk7XG4gIGNvbnN0IHNvcnRlZENvbG9ycyA9IE9iamVjdC5lbnRyaWVzKHRva2Vucy5jb2xvcnMpLnNvcnQoKGEsIGIpID0+IGJbMV0gLSBhWzFdKTtcbiAgZm9yIChjb25zdCBbaGV4LCBjb3VudF0gb2Ygc29ydGVkQ29sb3JzLnNsaWNlKDAsIDIwKSkge1xuICAgIGxpbmVzLnB1c2goYHwgJHtoZXh9IHwgJHtjb3VudH0gfGApO1xuICB9XG4gIGxpbmVzLnB1c2goJycpO1xuXG4gIC8vIFR5cG9ncmFwaHlcbiAgbGluZXMucHVzaCgnIyMgVHlwb2dyYXBoeSBVc2VkJyk7XG4gIGxpbmVzLnB1c2goJ3wgRm9udCB8IFN0eWxlcyB8IFNpemVzIHwnKTtcbiAgbGluZXMucHVzaCgnfC0tLS0tLXwtLS0tLS0tLXwtLS0tLS0tfCcpO1xuICBmb3IgKGNvbnN0IFtmYW1pbHksIGluZm9dIG9mIE9iamVjdC5lbnRyaWVzKHRva2Vucy5mb250cykpIHtcbiAgICBsaW5lcy5wdXNoKGB8ICR7ZmFtaWx5fSB8ICR7aW5mby5zdHlsZXMuam9pbignLCAnKX0gfCAke2luZm8uc2l6ZXMuam9pbignLCAnKX1weCB8YCk7XG4gIH1cbiAgbGluZXMucHVzaCgnJyk7XG5cbiAgLy8gU2VjdGlvbnNcbiAgbGluZXMucHVzaCgnIyMgU2VjdGlvbnMnKTtcbiAgbGluZXMucHVzaCgnJyk7XG4gIGZvciAoY29uc3QgW2xheW91dE5hbWUsIHNwZWNdIG9mIE9iamVjdC5lbnRyaWVzKHNwZWNzLnNlY3Rpb25zKSkge1xuICAgIGxpbmVzLnB1c2goYCMjIyAke2xheW91dE5hbWV9YCk7XG4gICAgbGluZXMucHVzaChgLSAqKlNwYWNpbmcgU291cmNlKio6ICR7c3BlYy5zcGFjaW5nU291cmNlfWApO1xuICAgIGxpbmVzLnB1c2goYC0gKipCYWNrZ3JvdW5kKio6ICR7c3BlYy5zZWN0aW9uLmJhY2tncm91bmRDb2xvciB8fCAnbm9uZSd9YCk7XG4gICAgbGluZXMucHVzaChgLSAqKkdyaWQqKjogJHtzcGVjLmdyaWQubGF5b3V0TW9kZX0sICR7c3BlYy5ncmlkLmNvbHVtbnN9IGNvbHVtbnMsIGdhcDogJHtzcGVjLmdyaWQuZ2FwIHx8ICdub25lJ31gKTtcbiAgICBpZiAoc3BlYy5pbnRlcmFjdGlvbnMgJiYgc3BlYy5pbnRlcmFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgbGluZXMucHVzaChgLSAqKkludGVyYWN0aW9ucyoqOiAke3NwZWMuaW50ZXJhY3Rpb25zLmxlbmd0aH0gKCR7c3BlYy5pbnRlcmFjdGlvbnMubWFwKGkgPT4gaS50cmlnZ2VyKS5qb2luKCcsICcpfSlgKTtcbiAgICB9XG4gICAgaWYgKHNwZWMub3ZlcmxhcCkge1xuICAgICAgbGluZXMucHVzaChgLSAqKk92ZXJsYXAqKjogJHtzcGVjLm92ZXJsYXAucGl4ZWxzfXB4IHdpdGggXCIke3NwZWMub3ZlcmxhcC53aXRoU2VjdGlvbn1cImApO1xuICAgIH1cbiAgICBsaW5lcy5wdXNoKCcnKTtcblxuICAgIC8vIEVsZW1lbnRzXG4gICAgZm9yIChjb25zdCBbZWxlbU5hbWUsIGVsZW1TdHlsZXNdIG9mIE9iamVjdC5lbnRyaWVzKHNwZWMuZWxlbWVudHMpKSB7XG4gICAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5lbnRyaWVzKGVsZW1TdHlsZXMpXG4gICAgICAgIC5maWx0ZXIoKFssIHZdKSA9PiB2ICE9PSBudWxsICYmIHYgIT09IHVuZGVmaW5lZClcbiAgICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHt2fWApXG4gICAgICAgIC5qb2luKCcsICcpO1xuICAgICAgbGluZXMucHVzaChgICAtICoqJHtlbGVtTmFtZX0qKjogJHtwcm9wc31gKTtcbiAgICB9XG4gICAgbGluZXMucHVzaCgnJyk7XG4gIH1cblxuICByZXR1cm4gbGluZXMuam9pbignXFxuJyk7XG59XG4iLCAiaW1wb3J0IHsgVUlUb1NhbmRib3hNZXNzYWdlIH0gZnJvbSAnLi9zYW5kYm94L3R5cGVzJztcbmltcG9ydCB7IGRpc2NvdmVyUGFnZXMgfSBmcm9tICcuL3NhbmRib3gvZGlzY292ZXJ5JztcbmltcG9ydCB7IHJ1bkFsbFZhbGlkYXRpb25zIH0gZnJvbSAnLi9zYW5kYm94L3ZhbGlkYXRvcic7XG5pbXBvcnQgeyBydW5FeHRyYWN0aW9uIH0gZnJvbSAnLi9zYW5kYm94L2V4dHJhY3Rvcic7XG5cbi8vIFNob3cgdGhlIHBsdWdpbiBVSVxuZmlnbWEuc2hvd1VJKF9faHRtbF9fLCB7IHdpZHRoOiA2NDAsIGhlaWdodDogNTIwIH0pO1xuY29uc29sZS5sb2coXCJXUCBUaGVtZSBCdWlsZGVyIEV4cG9ydDogUGx1Z2luIGluaXRpYWxpemVkXCIpO1xuXG4vLyBDYW5jZWxsYXRpb24gZmxhZ1xubGV0IGNhbmNlbFJlcXVlc3RlZCA9IGZhbHNlO1xuXG4vLyBIYW5kbGUgbWVzc2FnZXMgZnJvbSBVSVxuZmlnbWEudWkub25tZXNzYWdlID0gYXN5bmMgKG1zZzogVUlUb1NhbmRib3hNZXNzYWdlKSA9PiB7XG4gIGNvbnNvbGUubG9nKFwiU2FuZGJveCByZWNlaXZlZCBtZXNzYWdlOlwiLCBtc2cudHlwZSk7XG5cbiAgc3dpdGNoIChtc2cudHlwZSkge1xuICAgIGNhc2UgJ0RJU0NPVkVSX1BBR0VTJzoge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGFnZXMgPSBkaXNjb3ZlclBhZ2VzKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUGFnZXMgZGlzY292ZXJlZDpcIiwgcGFnZXMubGVuZ3RoKTtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB0eXBlOiAnUEFHRVNfRElTQ09WRVJFRCcsIHBhZ2VzIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJEaXNjb3ZlcnkgZXJyb3I6XCIsIGVycik7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ0VYUE9SVF9FUlJPUicsIGVycm9yOiBTdHJpbmcoZXJyKSB9KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgJ1ZBTElEQVRFJzoge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHJ1bkFsbFZhbGlkYXRpb25zKG1zZy5mcmFtZUlkcyk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiVmFsaWRhdGlvbiBjb21wbGV0ZTpcIiwgcmVzdWx0cy5sZW5ndGgsIFwicmVzdWx0c1wiKTtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgIHR5cGU6ICdWQUxJREFUSU9OX0NPTVBMRVRFJyxcbiAgICAgICAgICByZXN1bHRzLFxuICAgICAgICAgIGZyYW1lSWRzOiBtc2cuZnJhbWVJZHMsXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJWYWxpZGF0aW9uIGVycm9yOlwiLCBlcnIpO1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ0VYUE9SVF9FUlJPUicsXG4gICAgICAgICAgZXJyb3I6IGBWYWxpZGF0aW9uIGZhaWxlZDogJHtlcnJ9YCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjYXNlICdTVEFSVF9FWFBPUlQnOiB7XG4gICAgICBjYW5jZWxSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJ1bkV4dHJhY3Rpb24oXG4gICAgICAgICAgbXNnLmZyYW1lSWRzLFxuICAgICAgICAgIG1zZy5yZXNwb25zaXZlUGFpcnMsXG4gICAgICAgICAgKG1lc3NhZ2UpID0+IGZpZ21hLnVpLnBvc3RNZXNzYWdlKG1lc3NhZ2UpLFxuICAgICAgICAgICgpID0+IGNhbmNlbFJlcXVlc3RlZCxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXhwb3J0IGVycm9yOlwiLCBlcnIpO1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ0VYUE9SVF9FUlJPUicsXG4gICAgICAgICAgZXJyb3I6IGBFeHBvcnQgZmFpbGVkOiAke2Vycn1gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgJ0NBTkNFTF9FWFBPUlQnOiB7XG4gICAgICBjYW5jZWxSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5sb2coXCJFeHBvcnQgY2FuY2VsbGVkIGJ5IHVzZXJcIik7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn07XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUtPLFdBQVMsUUFBUSxNQUFzQjtBQUM1QyxXQUFPLEtBQ0osWUFBWSxFQUNaLFFBQVEsU0FBUyxHQUFHLEVBQ3BCLFFBQVEsaUJBQWlCLEVBQUUsRUFDM0IsUUFBUSxRQUFRLEdBQUcsRUFDbkIsUUFBUSxPQUFPLEdBQUcsRUFDbEIsUUFBUSxVQUFVLEVBQUU7QUFBQSxFQUN6QjtBQU1PLFdBQVMsYUFBYSxNQUFzQjtBQUNqRCxXQUFPLEtBQ0osWUFBWSxFQUNaLFFBQVEsU0FBUyxHQUFHLEVBQ3BCLFFBQVEsaUJBQWlCLEVBQUUsRUFDM0IsUUFBUSxRQUFRLEdBQUcsRUFDbkIsUUFBUSxPQUFPLEdBQUcsRUFDbEIsUUFBUSxVQUFVLEVBQUU7QUFBQSxFQUN6QjtBQU9PLFdBQVMsV0FBVyxPQUFrQyxPQUFlLE1BQXFCO0FBQy9GLFFBQUksVUFBVSxVQUFhLFVBQVUsUUFBUSxNQUFNLEtBQUssRUFBRyxRQUFPO0FBRWxFLFVBQU0sVUFBVSxLQUFLLE1BQU0sUUFBUSxHQUFHLElBQUk7QUFFMUMsVUFBTSxVQUFVLE9BQU8sVUFBVSxPQUFPLElBQUksVUFBVTtBQUN0RCxXQUFPLEdBQUcsT0FBTyxHQUFHLElBQUk7QUFBQSxFQUMxQjtBQWFPLFdBQVMsbUJBQW1CLE9BQWUsTUFBc0I7QUFDdEUsVUFBTSxTQUFTLE9BQU8sS0FBSyxFQUFFLFNBQVMsR0FBRyxHQUFHO0FBQzVDLFdBQU8sR0FBRyxNQUFNLElBQUksUUFBUSxJQUFJLENBQUM7QUFBQSxFQUNuQztBQU9PLFdBQVMsbUJBQW1CLE9BQWUsUUFBK0I7QUFDL0UsUUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFRLFFBQU87QUFDOUIsVUFBTSxNQUFNLENBQUMsR0FBVyxNQUF1QixNQUFNLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3pFLFVBQU0sSUFBSSxJQUFJLEtBQUssTUFBTSxLQUFLLEdBQUcsS0FBSyxNQUFNLE1BQU0sQ0FBQztBQUNuRCxXQUFPLEdBQUcsS0FBSyxNQUFNLFFBQVEsQ0FBQyxDQUFDLElBQUksS0FBSyxNQUFNLFNBQVMsQ0FBQyxDQUFDO0FBQUEsRUFDM0Q7QUFNTyxXQUFTLG1CQUFtQixNQUF1QjtBQUN4RCxXQUFPLHFHQUFxRyxLQUFLLElBQUk7QUFBQSxFQUN2SDtBQTdFQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNNTyxXQUFTLG1CQUFtQixPQUFnQztBQUNqRSxRQUFJLFNBQVMsSUFBSyxRQUFPO0FBQ3pCLFFBQUksU0FBUyxJQUFLLFFBQU87QUFDekIsUUFBSSxTQUFTLEtBQU0sUUFBTztBQUMxQixXQUFPO0FBQUEsRUFDVDtBQWtCTyxXQUFTLG1CQUFtQixNQUFzQjtBQUN2RCxRQUFJLGFBQWE7QUFDakIsZUFBVyxXQUFXLHFCQUFxQjtBQUN6QyxtQkFBYSxXQUFXLFFBQVEsU0FBUyxFQUFFO0FBQUEsSUFDN0M7QUFDQSxXQUFPLFdBQVcsS0FBSyxFQUFFLFlBQVksRUFBRSxRQUFRLFFBQVEsR0FBRztBQUFBLEVBQzVEO0FBTU8sV0FBUyxzQkFBc0IsV0FBdUM7QUFFM0UsVUFBTSxTQUFTLG9CQUFJLElBQXlCO0FBRTVDLGVBQVcsU0FBUyxXQUFXO0FBQzdCLFlBQU0sYUFBYSxtQkFBbUIsTUFBTSxJQUFJO0FBQ2hELFVBQUksQ0FBQyxPQUFPLElBQUksVUFBVSxHQUFHO0FBQzNCLGVBQU8sSUFBSSxZQUFZLENBQUMsQ0FBQztBQUFBLE1BQzNCO0FBQ0EsYUFBTyxJQUFJLFVBQVUsRUFBRyxLQUFLLEtBQUs7QUFBQSxJQUNwQztBQUVBLFVBQU0sZUFBaUMsQ0FBQztBQUN4QyxVQUFNLGtCQUFvQyxDQUFDO0FBQzNDLFVBQU0sYUFBYSxvQkFBSSxJQUFZO0FBRW5DLGVBQVcsQ0FBQyxVQUFVLE1BQU0sS0FBSyxRQUFRO0FBQ3ZDLFVBQUksT0FBTyxXQUFXLEdBQUc7QUFFdkIsY0FBTSxRQUFRLE9BQU8sQ0FBQztBQUN0QixZQUFJLE1BQU0sZUFBZSxhQUFhLE1BQU0sZUFBZSxTQUFTO0FBRWxFLHVCQUFhLEtBQUs7QUFBQSxZQUNoQixVQUFVLE1BQU07QUFBQSxZQUNoQixVQUFVLFFBQVEsWUFBWSxNQUFNLElBQUk7QUFBQSxZQUN4QyxTQUFTLEVBQUUsU0FBUyxNQUFNLElBQUksV0FBVyxNQUFNLE1BQU0sT0FBTyxNQUFNLE1BQU07QUFBQSxZQUN4RSxRQUFRO0FBQUEsWUFDUixRQUFRO0FBQUEsWUFDUixpQkFBaUI7QUFBQSxZQUNqQixhQUFhO0FBQUEsVUFDZixDQUFDO0FBQ0QscUJBQVcsSUFBSSxNQUFNLEVBQUU7QUFBQSxRQUN6QixPQUFPO0FBQ0wsMEJBQWdCLEtBQUs7QUFBQSxZQUNuQixTQUFTLE1BQU07QUFBQSxZQUNmLFdBQVcsTUFBTTtBQUFBLFlBQ2pCLE9BQU8sTUFBTTtBQUFBLFlBQ2IsWUFBWSxNQUFNO0FBQUEsWUFDbEIsUUFBUTtBQUFBLFVBQ1YsQ0FBQztBQUNELHFCQUFXLElBQUksTUFBTSxFQUFFO0FBQUEsUUFDekI7QUFDQTtBQUFBLE1BQ0Y7QUFHQSxZQUFNLFVBQVUsT0FBTyxLQUFLLE9BQUssRUFBRSxlQUFlLGFBQWEsRUFBRSxlQUFlLE9BQU87QUFDdkYsWUFBTSxTQUFTLE9BQU8sS0FBSyxPQUFLLEVBQUUsZUFBZSxRQUFRO0FBQ3pELFlBQU0sU0FBUyxPQUFPLEtBQUssT0FBSyxFQUFFLGVBQWUsUUFBUTtBQUV6RCxVQUFJLFNBQVM7QUFDWCxxQkFBYSxLQUFLO0FBQUEsVUFDaEIsVUFBVSxRQUFRO0FBQUEsVUFDbEIsVUFBVSxRQUFRLFlBQVksUUFBUSxJQUFJO0FBQUEsVUFDMUMsU0FBUyxFQUFFLFNBQVMsUUFBUSxJQUFJLFdBQVcsUUFBUSxNQUFNLE9BQU8sUUFBUSxNQUFNO0FBQUEsVUFDOUUsUUFBUSxTQUFTLEVBQUUsU0FBUyxPQUFPLElBQUksV0FBVyxPQUFPLE1BQU0sT0FBTyxPQUFPLE1BQU0sSUFBSTtBQUFBLFVBQ3ZGLFFBQVEsU0FBUyxFQUFFLFNBQVMsT0FBTyxJQUFJLFdBQVcsT0FBTyxNQUFNLE9BQU8sT0FBTyxNQUFNLElBQUk7QUFBQSxVQUN2RixpQkFBaUI7QUFBQSxVQUNqQixhQUFhO0FBQUEsUUFDZixDQUFDO0FBQ0QsbUJBQVcsSUFBSSxRQUFRLEVBQUU7QUFDekIsWUFBSSxPQUFRLFlBQVcsSUFBSSxPQUFPLEVBQUU7QUFDcEMsWUFBSSxPQUFRLFlBQVcsSUFBSSxPQUFPLEVBQUU7QUFBQSxNQUN0QztBQUdBLGlCQUFXLFNBQVMsUUFBUTtBQUMxQixZQUFJLENBQUMsV0FBVyxJQUFJLE1BQU0sRUFBRSxHQUFHO0FBQzdCLDBCQUFnQixLQUFLO0FBQUEsWUFDbkIsU0FBUyxNQUFNO0FBQUEsWUFDZixXQUFXLE1BQU07QUFBQSxZQUNqQixPQUFPLE1BQU07QUFBQSxZQUNiLFlBQVksTUFBTTtBQUFBLFlBQ2xCLFFBQVE7QUFBQSxVQUNWLENBQUM7QUFDRCxxQkFBVyxJQUFJLE1BQU0sRUFBRTtBQUFBLFFBQ3pCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFHQSxlQUFXLFNBQVMsV0FBVztBQUM3QixVQUFJLENBQUMsV0FBVyxJQUFJLE1BQU0sRUFBRSxHQUFHO0FBQzdCLHdCQUFnQixLQUFLO0FBQUEsVUFDbkIsU0FBUyxNQUFNO0FBQUEsVUFDZixXQUFXLE1BQU07QUFBQSxVQUNqQixPQUFPLE1BQU07QUFBQSxVQUNiLFlBQVksTUFBTTtBQUFBLFVBQ2xCLFFBQVE7QUFBQSxRQUNWLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUVBLFdBQU8sRUFBRSxjQUFjLGdCQUFnQjtBQUFBLEVBQ3pDO0FBdklBLE1BZ0JNO0FBaEJOO0FBQUE7QUFBQTtBQUNBO0FBZUEsTUFBTSxzQkFBc0I7QUFBQSxRQUMxQjtBQUFBLFFBQ0E7QUFBQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBO0FBQUE7OztBQ2RPLFdBQVMsZ0JBQTRCO0FBQzFDLFVBQU0sUUFBb0IsQ0FBQztBQUUzQixlQUFXLFFBQVEsTUFBTSxLQUFLLFVBQVU7QUFDdEMsWUFBTSxTQUFTLGVBQWUsSUFBSTtBQUNsQyxVQUFJLE9BQU8sU0FBUyxHQUFHO0FBQ3JCLGNBQU0sS0FBSztBQUFBLFVBQ1QsSUFBSSxLQUFLO0FBQUEsVUFDVCxNQUFNLEtBQUs7QUFBQSxVQUNYO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQU1BLFdBQVMsZUFBZSxNQUE2QjtBQUNuRCxVQUFNLFNBQXNCLENBQUM7QUFFN0IsZUFBVyxTQUFTLEtBQUssVUFBVTtBQUVqQyxVQUFJLE1BQU0sU0FBUyxXQUFXLE1BQU0sU0FBUyxlQUFlLE1BQU0sU0FBUyxpQkFBaUI7QUFDMUY7QUFBQSxNQUNGO0FBRUEsWUFBTSxRQUFRO0FBR2QsVUFBSSxNQUFNLFFBQVEsT0FBTyxNQUFNLFNBQVMsSUFBSztBQUc3QyxZQUFNLGVBQWUsTUFBTSxTQUFTO0FBQUEsUUFBTyxPQUN6QyxFQUFFLFlBQVksVUFDYixFQUFFLFNBQVMsV0FBVyxFQUFFLFNBQVMsZUFBZSxFQUFFLFNBQVMsY0FBYyxFQUFFLFNBQVMsWUFDckYsRUFBRSx1QkFDRixFQUFFLG9CQUFvQixTQUFTO0FBQUEsTUFDakMsRUFBRTtBQUdGLFlBQU0sZ0JBQWdCLE1BQU0sZUFBZSxVQUFhLE1BQU0sZUFBZTtBQUU3RSxhQUFPLEtBQUs7QUFBQSxRQUNWLElBQUksTUFBTTtBQUFBLFFBQ1YsTUFBTSxNQUFNO0FBQUEsUUFDWixPQUFPLEtBQUssTUFBTSxNQUFNLEtBQUs7QUFBQSxRQUM3QixRQUFRLEtBQUssTUFBTSxNQUFNLE1BQU07QUFBQSxRQUMvQixZQUFZLG1CQUFtQixLQUFLLE1BQU0sTUFBTSxLQUFLLENBQUM7QUFBQSxRQUN0RDtBQUFBLFFBQ0E7QUFBQSxRQUNBLGtCQUFrQjtBQUFBLE1BQ3BCLENBQUM7QUFBQSxJQUNIO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFsRUE7QUFBQTtBQUFBO0FBQ0E7QUFBQTtBQUFBOzs7QUNLQSxXQUFzQixrQkFBa0IsVUFBaUQ7QUFBQTtBQUN2RixZQUFNLFVBQThCLENBQUM7QUFFckMsaUJBQVcsV0FBVyxVQUFVO0FBQzlCLGNBQU0sT0FBTyxNQUFNLFlBQVksT0FBTztBQUN0QyxZQUFJLENBQUMsUUFBUSxLQUFLLFNBQVMsUUFBUztBQUVwQyxjQUFNLFFBQVE7QUFDZCxjQUFNLFdBQVcsTUFBTSxTQUFTO0FBQUEsVUFBTyxPQUNyQyxFQUFFLFlBQVksVUFDYixFQUFFLFNBQVMsV0FBVyxFQUFFLFNBQVMsZUFBZSxFQUFFLFNBQVMsY0FBYyxFQUFFLFNBQVM7QUFBQSxRQUN2RjtBQUdBLGdCQUFRLEtBQUssR0FBRyxnQkFBZ0IsVUFBVSxNQUFNLElBQUksQ0FBQztBQUdyRCxnQkFBUSxLQUFLLEdBQUcsZ0JBQWdCLFVBQVUsTUFBTSxJQUFJLENBQUM7QUFHckQsZ0JBQVEsS0FBSyxHQUFHLE1BQU0sV0FBVyxLQUFLLENBQUM7QUFHdkMsZ0JBQVEsS0FBSyxHQUFHLHdCQUF3QixLQUFLLENBQUM7QUFHOUMsZ0JBQVEsS0FBSyxHQUFHLHFCQUFxQixLQUFLLENBQUM7QUFHM0MsZ0JBQVEsS0FBSyxHQUFHLGNBQWMsVUFBVSxNQUFNLElBQUksQ0FBQztBQUduRCxnQkFBUSxLQUFLLEdBQUcsa0JBQWtCLEtBQUssQ0FBQztBQUFBLE1BQzFDO0FBR0EsY0FBUSxLQUFLLEdBQUcsc0JBQXNCLFFBQVEsQ0FBQztBQUUvQyxhQUFPO0FBQUEsSUFDVDtBQUFBO0FBSUEsV0FBUyxnQkFBZ0IsVUFBdUIsV0FBdUM7QUFDckYsVUFBTSxVQUE4QixDQUFDO0FBQ3JDLGVBQVcsV0FBVyxVQUFVO0FBQzlCLFVBQUksUUFBUSxTQUFTLFdBQVcsUUFBUSxTQUFTLGVBQWUsUUFBUSxTQUFTLFlBQVk7QUFDM0YsY0FBTSxRQUFRO0FBQ2QsWUFBSSxDQUFDLE1BQU0sY0FBYyxNQUFNLGVBQWUsUUFBUTtBQUNwRCxrQkFBUSxLQUFLO0FBQUEsWUFDWCxVQUFVO0FBQUEsWUFDVixPQUFPO0FBQUEsWUFDUCxTQUFTLFlBQVksUUFBUSxJQUFJO0FBQUEsWUFDakMsYUFBYSxRQUFRO0FBQUEsWUFDckIsUUFBUSxRQUFRO0FBQUEsWUFDaEIsVUFBVSxRQUFRO0FBQUEsWUFDbEIsWUFBWTtBQUFBLFVBQ2QsQ0FBQztBQUFBLFFBQ0g7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBSUEsV0FBUyxnQkFBZ0IsVUFBdUIsV0FBdUM7QUFDckYsVUFBTSxVQUE4QixDQUFDO0FBRXJDLGFBQVMsS0FBSyxNQUFpQixPQUFlO0FBQzVDLFVBQUksbUJBQW1CLEtBQUssSUFBSSxHQUFHO0FBQ2pDLGdCQUFRLEtBQUs7QUFBQSxVQUNYLFVBQVUsVUFBVSxJQUFJLFlBQVk7QUFBQSxVQUNwQyxPQUFPO0FBQUEsVUFDUCxTQUFTLFVBQVUsS0FBSyxJQUFJLDZCQUE2QixVQUFVLElBQUkscUJBQXFCLEVBQUU7QUFBQSxVQUM5RixhQUFhO0FBQUEsVUFDYixRQUFRLEtBQUs7QUFBQSxVQUNiLFVBQVUsS0FBSztBQUFBLFVBQ2YsWUFBWTtBQUFBLFFBQ2QsQ0FBQztBQUFBLE1BQ0g7QUFDQSxVQUFJLGNBQWMsUUFBUSxRQUFRLEdBQUc7QUFDbkMsbUJBQVcsU0FBVSxLQUFtQixVQUFVO0FBQ2hELGVBQUssT0FBTyxRQUFRLENBQUM7QUFBQSxRQUN2QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsZUFBVyxXQUFXLFVBQVU7QUFDOUIsV0FBSyxTQUFTLENBQUM7QUFBQSxJQUNqQjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBSUEsV0FBZSxXQUFXLE9BQStDO0FBQUE7QUFDdkUsWUFBTSxVQUE4QixDQUFDO0FBQ3JDLFlBQU0sZUFBZSxvQkFBSSxJQUFZO0FBRXJDLGVBQVMsaUJBQWlCLE1BQWlCO0FBQ3pDLFlBQUksS0FBSyxTQUFTLFFBQVE7QUFDeEIsZ0JBQU0sV0FBVyxLQUFLO0FBQ3RCLGNBQUksYUFBYSxNQUFNLFNBQVMsVUFBVTtBQUN4QyxrQkFBTSxNQUFNLEdBQUcsU0FBUyxNQUFNLEtBQUssU0FBUyxLQUFLO0FBQ2pELGdCQUFJLENBQUMsYUFBYSxJQUFJLEdBQUcsR0FBRztBQUMxQiwyQkFBYSxJQUFJLEdBQUc7QUFBQSxZQUN0QjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQ0EsWUFBSSxjQUFjLE1BQU07QUFDdEIscUJBQVcsU0FBVSxLQUFtQixVQUFVO0FBQ2hELDZCQUFpQixLQUFLO0FBQUEsVUFDeEI7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUVBLHVCQUFpQixLQUFLO0FBRXRCLGlCQUFXLFdBQVcsY0FBYztBQUNsQyxjQUFNLENBQUMsUUFBUSxLQUFLLElBQUksUUFBUSxNQUFNLElBQUk7QUFDMUMsWUFBSTtBQUNGLGdCQUFNLE1BQU0sY0FBYyxFQUFFLFFBQVEsTUFBTSxDQUFDO0FBQUEsUUFDN0MsU0FBUTtBQUNOLGtCQUFRLEtBQUs7QUFBQSxZQUNYLFVBQVU7QUFBQSxZQUNWLE9BQU87QUFBQSxZQUNQLFNBQVMsU0FBUyxNQUFNLElBQUksS0FBSztBQUFBLFlBQ2pDLGFBQWEsTUFBTTtBQUFBLFlBQ25CLFlBQVk7QUFBQSxVQUNkLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUNBLGFBQU87QUFBQSxJQUNUO0FBQUE7QUFJQSxXQUFTLHdCQUF3QixPQUFzQztBQUNyRSxVQUFNLFVBQThCLENBQUM7QUFDckMsVUFBTSxnQkFBMEIsQ0FBQztBQUVqQyxhQUFTLEtBQUssTUFBaUI7QUFDN0IsVUFBSSxLQUFLLFNBQVMsV0FBVyxLQUFLLFNBQVMsZUFBZSxLQUFLLFNBQVMsWUFBWTtBQUNsRixjQUFNLElBQUk7QUFDVixZQUFJLEVBQUUsY0FBYyxFQUFFLGVBQWUsUUFBUTtBQUMzQyx3QkFBYyxLQUFLLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLFdBQVc7QUFBQSxRQUNoRztBQUFBLE1BQ0Y7QUFDQSxVQUFJLGNBQWMsTUFBTTtBQUN0QixtQkFBVyxTQUFVLEtBQW1CLFVBQVU7QUFDaEQsZUFBSyxLQUFLO0FBQUEsUUFDWjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsU0FBSyxLQUFLO0FBR1YsVUFBTSxTQUFTLENBQUMsR0FBRyxJQUFJLElBQUksY0FBYyxPQUFPLE9BQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDO0FBQ2xGLGFBQVMsSUFBSSxHQUFHLElBQUksT0FBTyxTQUFTLEdBQUcsS0FBSztBQUMxQyxZQUFNLE9BQU8sT0FBTyxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUM7QUFDckMsVUFBSSxPQUFPLEtBQUssUUFBUSxHQUFHO0FBQ3pCLGdCQUFRLEtBQUs7QUFBQSxVQUNYLFVBQVU7QUFBQSxVQUNWLE9BQU87QUFBQSxVQUNQLFNBQVMsMkJBQTJCLE9BQU8sQ0FBQyxDQUFDLFVBQVUsT0FBTyxJQUFJLENBQUMsQ0FBQztBQUFBLFVBQ3BFLGFBQWEsTUFBTTtBQUFBLFVBQ25CLFlBQVksNkJBQTZCLEtBQUssT0FBTyxPQUFPLENBQUMsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUFBLFFBQ3RGLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBSUEsV0FBUyxxQkFBcUIsT0FBc0M7QUFDbEUsVUFBTSxVQUE4QixDQUFDO0FBRXJDLGFBQVMsS0FBSyxNQUFpQjtBQUM3QixVQUFJLFdBQVcsTUFBTTtBQUNuQixjQUFNLFFBQVMsS0FBYTtBQUM1QixZQUFJLE1BQU0sUUFBUSxLQUFLLEdBQUc7QUFDeEIscUJBQVcsUUFBUSxPQUFPO0FBQ3hCLGdCQUFJLEtBQUssU0FBUyxXQUFXLEtBQUssWUFBWSxPQUFPO0FBQ25ELG9CQUFNLFNBQVMsS0FBSztBQUNwQixrQkFBSSxRQUFRO0FBR1Ysc0JBQU0saUJBQWlCLE9BQU8sUUFBUSxPQUFPLFNBQVM7QUFDdEQsc0JBQU0sY0FBYyxrQkFBa0IsT0FBTztBQUM3QyxvQkFBSSxjQUFjLEdBQUc7QUFDbkIsMEJBQVEsS0FBSztBQUFBLG9CQUNYLFVBQVU7QUFBQSxvQkFDVixPQUFPO0FBQUEsb0JBQ1AsU0FBUyxhQUFhLEtBQUssSUFBSSxxQkFBcUIsWUFBWSxRQUFRLENBQUMsQ0FBQztBQUFBLG9CQUMxRSxRQUFRLEtBQUs7QUFBQSxvQkFDYixVQUFVLEtBQUs7QUFBQSxvQkFDZixZQUFZO0FBQUEsa0JBQ2QsQ0FBQztBQUFBLGdCQUNIO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFDQSxVQUFJLGNBQWMsTUFBTTtBQUN0QixtQkFBVyxTQUFVLEtBQW1CLFVBQVU7QUFDaEQsZUFBSyxLQUFLO0FBQUEsUUFDWjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsU0FBSyxLQUFLO0FBQ1YsV0FBTztBQUFBLEVBQ1Q7QUFJQSxXQUFTLGNBQWMsVUFBdUIsV0FBdUM7QUFDbkYsVUFBTSxVQUE4QixDQUFDO0FBQ3JDLFVBQU0sU0FBUyxDQUFDLEdBQUcsUUFBUSxFQUN4QixPQUFPLE9BQUssRUFBRSxtQkFBbUIsRUFDakMsS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLG9CQUFxQixJQUFJLEVBQUUsb0JBQXFCLENBQUM7QUFFckUsYUFBUyxJQUFJLEdBQUcsSUFBSSxPQUFPLFNBQVMsR0FBRyxLQUFLO0FBQzFDLFlBQU0sT0FBTyxPQUFPLENBQUMsRUFBRTtBQUN2QixZQUFNLE9BQU8sT0FBTyxJQUFJLENBQUMsRUFBRTtBQUMzQixZQUFNLFVBQVcsS0FBSyxJQUFJLEtBQUssU0FBVSxLQUFLO0FBQzlDLFVBQUksVUFBVSxHQUFHO0FBQ2YsZ0JBQVEsS0FBSztBQUFBLFVBQ1gsVUFBVTtBQUFBLFVBQ1YsT0FBTztBQUFBLFVBQ1AsU0FBUyxZQUFZLE9BQU8sQ0FBQyxFQUFFLElBQUksb0JBQW9CLE9BQU8sSUFBSSxDQUFDLEVBQUUsSUFBSSxRQUFRLEtBQUssTUFBTSxPQUFPLENBQUM7QUFBQSxVQUNwRyxhQUFhLE9BQU8sQ0FBQyxFQUFFO0FBQUEsVUFDdkIsUUFBUSxPQUFPLENBQUMsRUFBRTtBQUFBLFVBQ2xCLFlBQVk7QUFBQSxRQUNkLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBSUEsV0FBUyxzQkFBc0IsVUFBd0M7QUFDckUsVUFBTSxVQUE4QixDQUFDO0FBQ3JDLFVBQU0sU0FBUyxTQUNaLElBQUksUUFBTSxNQUFNLFlBQVksRUFBRSxDQUFDLEVBQy9CLE9BQU8sT0FBSyxLQUFLLEVBQUUsU0FBUyxPQUFPO0FBRXRDLFVBQU0sZ0JBQWdCLE9BQU8sT0FBTyxPQUFLLEVBQUUsUUFBUSxJQUFJO0FBQ3ZELFVBQU0sZUFBZSxPQUFPLE9BQU8sT0FBSyxFQUFFLFNBQVMsR0FBRztBQUV0RCxRQUFJLGNBQWMsU0FBUyxLQUFLLGFBQWEsV0FBVyxHQUFHO0FBQ3pELGNBQVEsS0FBSztBQUFBLFFBQ1gsVUFBVTtBQUFBLFFBQ1YsT0FBTztBQUFBLFFBQ1AsU0FBUztBQUFBLFFBQ1QsWUFBWTtBQUFBLE1BQ2QsQ0FBQztBQUFBLElBQ0g7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUlBLFdBQVMsa0JBQWtCLE9BQXNDO0FBQy9ELFVBQU0sVUFBOEIsQ0FBQztBQUVyQyxhQUFTLEtBQUssTUFBaUI7QUFDN0IsVUFBSSxLQUFLLFNBQVMsVUFBVSxLQUFLLHVCQUF1QixLQUFLLFVBQVUseUJBQXlCLEtBQUssUUFBUTtBQUMzRyxjQUFNLGFBQWEsS0FBSztBQUN4QixjQUFNLGVBQWdCLEtBQUssT0FBcUI7QUFDaEQsWUFBSSxjQUFjO0FBQ2hCLGdCQUFNLGdCQUFpQixXQUFXLElBQUksV0FBVyxTQUFVLGFBQWEsSUFBSSxhQUFhO0FBQ3pGLGdCQUFNLGlCQUFrQixXQUFXLElBQUksV0FBVyxVQUFXLGFBQWEsSUFBSSxhQUFhO0FBQzNGLGNBQUksZ0JBQWdCLEtBQUssaUJBQWlCLEdBQUc7QUFDM0Msb0JBQVEsS0FBSztBQUFBLGNBQ1gsVUFBVTtBQUFBLGNBQ1YsT0FBTztBQUFBLGNBQ1AsU0FBUyxTQUFTLEtBQUssSUFBSSxnQ0FBZ0MsS0FBSyxJQUFJLEtBQUssTUFBTSxhQUFhLEdBQUcsS0FBSyxNQUFNLGNBQWMsQ0FBQyxDQUFDO0FBQUEsY0FDMUgsUUFBUSxLQUFLO0FBQUEsY0FDYixVQUFVLEtBQUs7QUFBQSxjQUNmLFlBQVk7QUFBQSxZQUNkLENBQUM7QUFBQSxVQUNIO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFDQSxVQUFJLGNBQWMsTUFBTTtBQUN0QixtQkFBVyxTQUFVLEtBQW1CLFVBQVU7QUFDaEQsZUFBSyxLQUFLO0FBQUEsUUFDWjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsU0FBSyxLQUFLO0FBQ1YsV0FBTztBQUFBLEVBQ1Q7QUE5U0E7QUFBQTtBQUFBO0FBQ0E7QUFBQTtBQUFBOzs7QUNHQSxXQUFTLGFBQWEsT0FBdUI7QUFDM0MsV0FBTyxLQUFLLE1BQU0sUUFBUSxHQUFHLEVBQUUsU0FBUyxFQUFFLEVBQUUsU0FBUyxHQUFHLEdBQUcsRUFBRSxZQUFZO0FBQUEsRUFDM0U7QUFNTyxXQUFTLFNBQVMsT0FBb0Q7QUFDM0UsV0FBTyxJQUFJLGFBQWEsTUFBTSxDQUFDLENBQUMsR0FBRyxhQUFhLE1BQU0sQ0FBQyxDQUFDLEdBQUcsYUFBYSxNQUFNLENBQUMsQ0FBQztBQUFBLEVBQ2xGO0FBTU8sV0FBUyxVQUFVLE9BQTRDLFVBQWtCLEdBQVc7QUFDakcsVUFBTSxPQUFPLFNBQVMsS0FBSztBQUMzQixRQUFJLFdBQVcsRUFBRyxRQUFPO0FBQ3pCLFdBQU8sR0FBRyxJQUFJLEdBQUcsYUFBYSxPQUFPLENBQUM7QUFBQSxFQUN4QztBQU1PLFdBQVMsdUJBQXVCLE1BQStEO0FBQ3BHLFFBQUksRUFBRSxXQUFXLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxNQUFNLFFBQVEsS0FBSyxLQUFLLEVBQUcsUUFBTztBQUU1RSxlQUFXLFFBQVEsS0FBSyxPQUFPO0FBQzdCLFVBQUksS0FBSyxTQUFTLFdBQVcsS0FBSyxZQUFZLE9BQU87QUFDbkQsY0FBTSxVQUFVLEtBQUssWUFBWSxTQUFZLEtBQUssVUFBVTtBQUM1RCxlQUFPLFVBQVUsS0FBSyxPQUFPLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUtPLFdBQVMsaUJBQWlCLE1BQStCO0FBQzlELFFBQUksQ0FBQyxLQUFLLFNBQVMsQ0FBQyxNQUFNLFFBQVEsS0FBSyxLQUFLLEVBQUcsUUFBTztBQUV0RCxlQUFXLFFBQVEsS0FBSyxPQUEyQjtBQUNqRCxVQUFJLEtBQUssU0FBUyxXQUFXLEtBQUssWUFBWSxPQUFPO0FBQ25ELGVBQU8sU0FBUyxLQUFLLEtBQUs7QUFBQSxNQUM1QjtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUtPLFdBQVMsZ0JBQWdCLE1BQStEO0FBQzdGLFFBQUksRUFBRSxXQUFXLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxNQUFNLFFBQVEsS0FBSyxLQUFLLEVBQUcsUUFBTztBQUU1RSxlQUFXLFFBQVEsS0FBSyxPQUFPO0FBQzdCLFVBQUksS0FBSyxTQUFTLHFCQUFxQixLQUFLLFlBQVksT0FBTztBQUM3RCxjQUFNLFFBQVEsS0FBSyxjQUNoQixJQUFJLE9BQUssR0FBRyxTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsV0FBVyxHQUFHLENBQUMsR0FBRyxFQUNoRSxLQUFLLElBQUk7QUFDWixlQUFPLG1CQUFtQixLQUFLO0FBQUEsTUFDakM7QUFDQSxVQUFJLEtBQUssU0FBUyxxQkFBcUIsS0FBSyxZQUFZLE9BQU87QUFDN0QsY0FBTSxRQUFRLEtBQUssY0FDaEIsSUFBSSxPQUFLLEdBQUcsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLFdBQVcsR0FBRyxDQUFDLEdBQUcsRUFDaEUsS0FBSyxJQUFJO0FBQ1osZUFBTyxtQkFBbUIsS0FBSztBQUFBLE1BQ2pDO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBS08sV0FBUyxhQUFhLE1BQXlEO0FBQ3BGLFFBQUksRUFBRSxXQUFXLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxNQUFNLFFBQVEsS0FBSyxLQUFLLEVBQUcsUUFBTztBQUM1RSxXQUFPLEtBQUssTUFBTSxLQUFLLE9BQUssRUFBRSxTQUFTLFdBQVcsRUFBRSxZQUFZLEtBQUs7QUFBQSxFQUN2RTtBQU1PLFdBQVMsbUJBQW1CLE1BQTBCO0FBQzNELFFBQUksRUFBRSxhQUFhLFNBQVMsQ0FBQyxNQUFNLFFBQVEsS0FBSyxPQUFPLEtBQUssS0FBSyxRQUFRLFdBQVcsRUFBRyxRQUFPO0FBQzlGLFVBQU0sY0FBZSxLQUFhO0FBQ2xDLFFBQUksTUFBTSxRQUFRLFdBQVcsS0FBSyxZQUFZLFNBQVMsR0FBRztBQUV4RCxZQUFNLE1BQU0sS0FBSyxJQUFJLEdBQUcsV0FBVztBQUNuQyxhQUFPLE9BQU8sSUFBSSxXQUFXO0FBQUEsSUFDL0I7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQU9PLFdBQVMsb0JBQW9CLE1BRWxDO0FBQ0EsVUFBTSxNQUFPLEtBQWE7QUFDMUIsUUFBSSxPQUFPLE9BQU8sUUFBUSxVQUFVO0FBQ2xDLGFBQU87QUFBQSxRQUNMLEtBQUssSUFBSSxPQUFPO0FBQUEsUUFDaEIsT0FBTyxJQUFJLFNBQVM7QUFBQSxRQUNwQixRQUFRLElBQUksVUFBVTtBQUFBLFFBQ3RCLE1BQU0sSUFBSSxRQUFRO0FBQUEsUUFDbEIsU0FBUztBQUFBLE1BQ1g7QUFBQSxJQUNGO0FBQ0EsVUFBTSxJQUFLLEtBQWE7QUFDeEIsUUFBSSxPQUFPLE1BQU0sWUFBWSxJQUFJLEdBQUc7QUFDbEMsYUFBTyxFQUFFLEtBQUssTUFBTSxPQUFPLE1BQU0sUUFBUSxNQUFNLE1BQU0sTUFBTSxTQUFTLEVBQUU7QUFBQSxJQUN4RTtBQUNBLFdBQU8sRUFBRSxLQUFLLE1BQU0sT0FBTyxNQUFNLFFBQVEsTUFBTSxNQUFNLE1BQU0sU0FBUyxLQUFLO0FBQUEsRUFDM0U7QUFLTyxXQUFTLG1CQUFtQixNQUEwQjtBQUMzRCxRQUFJLEVBQUUsYUFBYSxTQUFTLENBQUMsTUFBTSxRQUFRLEtBQUssT0FBTyxFQUFHLFFBQU87QUFDakUsZUFBVyxVQUFVLEtBQUssU0FBUztBQUNqQyxVQUFJLE9BQU8sU0FBUyxXQUFXLE9BQU8sWUFBWSxPQUFPO0FBQ3ZELGVBQU8sU0FBUyxPQUFPLEtBQUs7QUFBQSxNQUM5QjtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQU1PLFdBQVMsY0FBYyxNQUF5QztBQUNyRSxVQUFNLFNBQWlDLENBQUM7QUFFeEMsYUFBUyxLQUFLLE1BQWlCO0FBRTdCLFVBQUksV0FBVyxRQUFRLEtBQUssU0FBUyxNQUFNLFFBQVEsS0FBSyxLQUFLLEdBQUc7QUFDOUQsbUJBQVcsUUFBUSxLQUFLLE9BQU87QUFDN0IsY0FBSSxLQUFLLFNBQVMsV0FBVyxLQUFLLFlBQVksT0FBTztBQUNuRCxrQkFBTSxNQUFNLFNBQVMsS0FBSyxLQUFLO0FBQy9CLG1CQUFPLEdBQUcsS0FBSyxPQUFPLEdBQUcsS0FBSyxLQUFLO0FBQUEsVUFDckM7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUVBLFVBQUksYUFBYSxRQUFRLEtBQUssV0FBVyxNQUFNLFFBQVEsS0FBSyxPQUFPLEdBQUc7QUFDcEUsbUJBQVcsVUFBVSxLQUFLLFNBQVM7QUFDakMsY0FBSSxPQUFPLFNBQVMsV0FBVyxPQUFPLFlBQVksT0FBTztBQUN2RCxrQkFBTSxNQUFNLFNBQVMsT0FBTyxLQUFLO0FBQ2pDLG1CQUFPLEdBQUcsS0FBSyxPQUFPLEdBQUcsS0FBSyxLQUFLO0FBQUEsVUFDckM7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUVBLFVBQUksY0FBYyxNQUFNO0FBQ3RCLG1CQUFXLFNBQVUsS0FBbUIsVUFBVTtBQUNoRCxlQUFLLEtBQUs7QUFBQSxRQUNaO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxTQUFLLElBQUk7QUFDVCxXQUFPO0FBQUEsRUFDVDtBQWhMQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNjQSxXQUFTLFdBQVcsT0FBZ0U7QUFDbEYsVUFBTSxJQUFJLE1BQU0sTUFBTSxTQUFZLEtBQUssTUFBTSxNQUFNLElBQUksR0FBRyxJQUFJLE1BQU07QUFDcEUsV0FBTyxRQUFRLEtBQUssTUFBTSxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxNQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxLQUFLLE1BQU0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUM1RztBQUVBLFdBQVMsWUFBWSxHQUF5QyxPQUF3QjtBQUNwRixVQUFNLElBQUksS0FBSyxNQUFNLEVBQUUsT0FBTyxDQUFDO0FBQy9CLFVBQU0sSUFBSSxLQUFLLE1BQU0sRUFBRSxPQUFPLENBQUM7QUFDL0IsVUFBTSxPQUFPLEtBQUssTUFBTSxFQUFFLE1BQU07QUFDaEMsVUFBTSxTQUFTLEtBQUssTUFBTyxFQUFVLFVBQVUsQ0FBQztBQUNoRCxVQUFNLFFBQVEsV0FBVyxFQUFFLEtBQUs7QUFDaEMsVUFBTSxTQUFTLFFBQVEsV0FBVztBQUNsQyxXQUFPLEdBQUcsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQUEsRUFDOUQ7QUFhTyxXQUFTLGVBQ2QsTUFDa0I7QUFDbEIsVUFBTSxTQUEyQjtBQUFBLE1BQy9CLFdBQVc7QUFBQSxNQUNYLFlBQVk7QUFBQSxNQUNaLFFBQVE7QUFBQSxNQUNSLGdCQUFnQjtBQUFBLElBQ2xCO0FBRUEsUUFBSSxDQUFDLEtBQUssV0FBVyxDQUFDLE1BQU0sUUFBUSxLQUFLLE9BQU8sS0FBSyxLQUFLLFFBQVEsV0FBVyxHQUFHO0FBQzlFLGFBQU87QUFBQSxJQUNUO0FBRUEsVUFBTSxTQUFTLEtBQUssU0FBUztBQUM3QixVQUFNLGdCQUEwQixDQUFDO0FBQ2pDLFVBQU0sb0JBQThCLENBQUM7QUFDckMsVUFBTSxjQUF3QixDQUFDO0FBQy9CLFVBQU0sZ0JBQTBCLENBQUM7QUFFakMsZUFBVyxVQUFVLEtBQUssU0FBUztBQUNqQyxVQUFJLE9BQU8sWUFBWSxNQUFPO0FBRTlCLFVBQUksT0FBTyxTQUFTLGVBQWU7QUFDakMsY0FBTSxJQUFJO0FBQ1YsWUFBSSxRQUFRO0FBRVYsZ0JBQU0sSUFBSSxLQUFLLE1BQU0sRUFBRSxPQUFPLENBQUM7QUFDL0IsZ0JBQU0sSUFBSSxLQUFLLE1BQU0sRUFBRSxPQUFPLENBQUM7QUFDL0IsZ0JBQU0sT0FBTyxLQUFLLE1BQU0sRUFBRSxNQUFNO0FBQ2hDLDRCQUFrQixLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sV0FBVyxFQUFFLEtBQUssQ0FBQyxFQUFFO0FBQUEsUUFDekUsT0FBTztBQUNMLHdCQUFjLEtBQUssWUFBWSxHQUFHLEtBQUssQ0FBQztBQUFBLFFBQzFDO0FBQUEsTUFDRixXQUFXLE9BQU8sU0FBUyxnQkFBZ0I7QUFDekMsY0FBTSxJQUFJO0FBRVYsWUFBSSxDQUFDLE9BQVEsZUFBYyxLQUFLLFlBQVksR0FBRyxJQUFJLENBQUM7QUFBQSxNQUN0RCxXQUFXLE9BQU8sU0FBUyxjQUFjO0FBQ3ZDLGNBQU0sSUFBSTtBQUNWLG9CQUFZLEtBQUssUUFBUSxLQUFLLE1BQU0sRUFBRSxNQUFNLENBQUMsS0FBSztBQUFBLE1BQ3BELFdBQVcsT0FBTyxTQUFTLG1CQUFtQjtBQUM1QyxjQUFNLElBQUk7QUFDVixzQkFBYyxLQUFLLFFBQVEsS0FBSyxNQUFNLEVBQUUsTUFBTSxDQUFDLEtBQUs7QUFBQSxNQUN0RDtBQUFBLElBQ0Y7QUFFQSxRQUFJLGNBQWMsU0FBUyxFQUFHLFFBQU8sWUFBWSxjQUFjLEtBQUssSUFBSTtBQUN4RSxRQUFJLGtCQUFrQixTQUFTLEVBQUcsUUFBTyxhQUFhLGtCQUFrQixLQUFLLElBQUk7QUFDakYsUUFBSSxZQUFZLFNBQVMsRUFBRyxRQUFPLFNBQVMsWUFBWSxLQUFLLEdBQUc7QUFDaEUsUUFBSSxjQUFjLFNBQVMsRUFBRyxRQUFPLGlCQUFpQixjQUFjLEtBQUssR0FBRztBQUU1RSxXQUFPO0FBQUEsRUFDVDtBQTdGQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNRTyxXQUFTLG9CQUFvQixPQUF1QjtBQUN6RCxVQUFNLElBQUksTUFBTSxZQUFZO0FBQzVCLFFBQUksRUFBRSxTQUFTLE1BQU0sS0FBSyxFQUFFLFNBQVMsVUFBVSxFQUFHLFFBQU87QUFDekQsUUFBSSxFQUFFLFNBQVMsWUFBWSxLQUFLLEVBQUUsU0FBUyxhQUFhLEtBQUssRUFBRSxTQUFTLGFBQWEsRUFBRyxRQUFPO0FBQy9GLFFBQUksRUFBRSxTQUFTLE9BQU8sRUFBRyxRQUFPO0FBQ2hDLFFBQUksRUFBRSxTQUFTLFFBQVEsRUFBRyxRQUFPO0FBQ2pDLFFBQUksRUFBRSxTQUFTLFVBQVUsS0FBSyxFQUFFLFNBQVMsV0FBVyxLQUFLLEVBQUUsU0FBUyxXQUFXLEtBQUssRUFBRSxTQUFTLFVBQVUsRUFBRyxRQUFPO0FBQ25ILFFBQUksRUFBRSxTQUFTLFdBQVcsS0FBSyxFQUFFLFNBQVMsWUFBWSxLQUFLLEVBQUUsU0FBUyxZQUFZLEtBQUssRUFBRSxTQUFTLFdBQVcsRUFBRyxRQUFPO0FBQ3ZILFFBQUksRUFBRSxTQUFTLE9BQU8sS0FBSyxFQUFFLFNBQVMsT0FBTyxFQUFHLFFBQU87QUFDdkQsUUFBSSxFQUFFLFNBQVMsTUFBTSxFQUFHLFFBQU87QUFDL0IsV0FBTztBQUFBLEVBQ1Q7QUFLQSxXQUFTLGFBQWEsT0FBOEI7QUFDbEQsWUFBUSxPQUFPO0FBQUEsTUFDYixLQUFLO0FBQVEsZUFBTztBQUFBLE1BQ3BCLEtBQUs7QUFBVSxlQUFPO0FBQUEsTUFDdEIsS0FBSztBQUFTLGVBQU87QUFBQSxNQUNyQixLQUFLO0FBQWEsZUFBTztBQUFBLE1BQ3pCO0FBQVMsZUFBTztBQUFBLElBQ2xCO0FBQUEsRUFDRjtBQUtBLFdBQVMsWUFBWSxVQUFpQztBQUNwRCxZQUFRLFVBQVU7QUFBQSxNQUNoQixLQUFLO0FBQVMsZUFBTztBQUFBLE1BQ3JCLEtBQUs7QUFBUyxlQUFPO0FBQUEsTUFDckIsS0FBSztBQUFTLGVBQU87QUFBQSxNQUNyQixLQUFLO0FBQUEsTUFDTDtBQUFTLGVBQU87QUFBQSxJQUNsQjtBQUFBLEVBQ0Y7QUFNTyxXQUFTLGtCQUFrQixNQUF3QztBQUN4RSxVQUFNLFNBQWlDLENBQUM7QUFHeEMsVUFBTSxXQUFXLEtBQUs7QUFDdEIsUUFBSSxhQUFhLE1BQU0sU0FBUyxVQUFVO0FBQ3hDLGFBQU8sYUFBYSxTQUFTO0FBQzdCLGFBQU8sYUFBYSxvQkFBb0IsU0FBUyxLQUFLO0FBQUEsSUFDeEQ7QUFHQSxVQUFNLFdBQVcsS0FBSztBQUN0QixRQUFJLGFBQWEsTUFBTSxTQUFTLE9BQU8sYUFBYSxVQUFVO0FBQzVELGFBQU8sV0FBVyxXQUFXLFFBQVE7QUFBQSxJQUN2QztBQUdBLFVBQU0sS0FBSyxLQUFLO0FBQ2hCLFFBQUksT0FBTyxNQUFNLFNBQVMsSUFBSTtBQUM1QixVQUFJLEdBQUcsU0FBUyxVQUFVO0FBQ3hCLGVBQU8sYUFBYSxXQUFXLEdBQUcsS0FBSztBQUFBLE1BQ3pDLFdBQVcsR0FBRyxTQUFTLFdBQVc7QUFDaEMsZUFBTyxhQUFhLEdBQUcsS0FBSyxNQUFNLEdBQUcsS0FBSyxDQUFDO0FBQUEsTUFDN0MsT0FBTztBQUVMLGVBQU8sYUFBYTtBQUFBLE1BQ3RCO0FBQUEsSUFDRjtBQUdBLFVBQU0sS0FBSyxLQUFLO0FBQ2hCLFFBQUksT0FBTyxNQUFNLFNBQVMsSUFBSTtBQUM1QixVQUFJLEdBQUcsU0FBUyxVQUFVO0FBQ3hCLGVBQU8sZ0JBQWdCLFdBQVcsR0FBRyxLQUFLO0FBQUEsTUFDNUMsV0FBVyxHQUFHLFNBQVMsV0FBVztBQUVoQyxjQUFNLFVBQVUsS0FBSyxNQUFPLEdBQUcsUUFBUSxNQUFPLEdBQUcsSUFBSTtBQUNyRCxlQUFPLGdCQUFnQixHQUFHLE9BQU87QUFBQSxNQUNuQztBQUFBLElBQ0Y7QUFHQSxVQUFNLFdBQVcsS0FBSztBQUN0QixRQUFJLGFBQWEsTUFBTSxPQUFPO0FBQzVCLGFBQU8sZ0JBQWdCLFlBQVksUUFBa0I7QUFBQSxJQUN2RDtBQUdBLFVBQU0sWUFBWSxLQUFLO0FBQ3ZCLFFBQUksV0FBVztBQUNiLGFBQU8sWUFBWSxhQUFhLFNBQVM7QUFBQSxJQUMzQztBQUdBLFVBQU0sS0FBTSxLQUFhO0FBQ3pCLFFBQUksT0FBTyxVQUFhLE9BQU8sTUFBTSxPQUFPO0FBQzFDLFVBQUksT0FBTyxZQUFhLFFBQU8saUJBQWlCO0FBQUEsZUFDdkMsT0FBTyxnQkFBaUIsUUFBTyxpQkFBaUI7QUFBQSxVQUNwRCxRQUFPLGlCQUFpQjtBQUFBLElBQy9CO0FBR0EsV0FBTyxRQUFRLGlCQUFpQixJQUFJO0FBR3BDLFVBQU0sVUFBVSxlQUFlLElBQUk7QUFDbkMsUUFBSSxRQUFRLFdBQVksUUFBTyxhQUFhLFFBQVE7QUFHcEQsVUFBTSxZQUFZLHFCQUFxQixJQUFJO0FBQzNDLFFBQUksVUFBVyxRQUFPLGdCQUFnQjtBQUd0QyxVQUFNLFdBQVcsb0JBQW9CLElBQUk7QUFDekMsUUFBSSxTQUFVLFFBQU8sZUFBZTtBQUVwQyxXQUFPO0FBQUEsRUFDVDtBQU1PLFdBQVMscUJBQXFCLE1BQStCO0FBQ2xFLFFBQUk7QUFDRixZQUFNLEtBQU0sS0FBYTtBQUN6QixVQUFJLENBQUMsTUFBTSxPQUFPLE1BQU0sU0FBUyxPQUFPLE9BQU8sU0FBVSxRQUFPO0FBQ2hFLFlBQU0sUUFBUSxNQUFNLGFBQWEsRUFBRTtBQUNuQyxjQUFPLCtCQUFPLFNBQVE7QUFBQSxJQUN4QixTQUFRO0FBQ04sYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBUU8sV0FBUyxvQkFBb0IsTUFBc0M7QUFDeEUsUUFBSSxDQUFDLEtBQUssV0FBWSxRQUFPO0FBQzdCLFFBQUk7QUFDRixZQUFNLGNBQWUsS0FBYTtBQUNsQyxVQUFJLE9BQU8sZ0JBQWdCLFdBQVksUUFBTztBQUM5QyxZQUFNLE1BQU0sWUFBWSxLQUFLLE1BQU0sQ0FBQyxZQUFZLFlBQVksU0FBUyxnQkFBZ0IsQ0FBQztBQUN0RixVQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sUUFBUSxHQUFHLEtBQUssSUFBSSxVQUFVLEVBQUcsUUFBTztBQUUzRCxZQUFNLFdBQTBCLElBQUksSUFBSSxDQUFDLE1BQVc7QUFDbEQsY0FBTSxNQUFtQixFQUFFLE1BQU0sRUFBRSxjQUFjLEdBQUc7QUFDcEQsWUFBSSxFQUFFLFlBQVksT0FBTyxFQUFFLGFBQWEsVUFBVTtBQUNoRCxjQUFJLGFBQWEsRUFBRSxTQUFTO0FBQzVCLGNBQUksYUFBYSxvQkFBb0IsRUFBRSxTQUFTLEtBQUs7QUFDckQsY0FBSSxFQUFFLFNBQVMsTUFBTSxZQUFZLEVBQUUsU0FBUyxRQUFRLEVBQUcsS0FBSSxTQUFTO0FBQUEsUUFDdEU7QUFDQSxZQUFJLE9BQU8sRUFBRSxhQUFhLFNBQVUsS0FBSSxXQUFXLEVBQUU7QUFDckQsWUFBSSxNQUFNLFFBQVEsRUFBRSxLQUFLLEdBQUc7QUFDMUIscUJBQVcsS0FBSyxFQUFFLE9BQU87QUFDdkIsZ0JBQUksRUFBRSxTQUFTLFdBQVcsRUFBRSxZQUFZLE9BQU87QUFDN0Msa0JBQUksUUFBUSxTQUFTLEVBQUUsS0FBSztBQUM1QjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUNBLFlBQUksRUFBRSxtQkFBbUIsWUFBYSxLQUFJLGlCQUFpQjtBQUFBLGlCQUNsRCxFQUFFLG1CQUFtQixnQkFBaUIsS0FBSSxpQkFBaUI7QUFDcEUsZUFBTztBQUFBLE1BQ1QsQ0FBQztBQUdELFlBQU0sUUFBUSxTQUFTLENBQUM7QUFDeEIsWUFBTSxVQUFVLFNBQVM7QUFBQSxRQUFNLE9BQzdCLEVBQUUsZUFBZSxNQUFNLGNBQ3ZCLEVBQUUsZUFBZSxNQUFNLGNBQ3ZCLEVBQUUsYUFBYSxNQUFNLFlBQ3JCLEVBQUUsVUFBVSxNQUFNLFNBQ2xCLEVBQUUsV0FBVyxNQUFNLFVBQ25CLEVBQUUsbUJBQW1CLE1BQU07QUFBQSxNQUM3QjtBQUNBLGFBQU8sVUFBVSxPQUFPO0FBQUEsSUFDMUIsU0FBUTtBQUNOLGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUtPLFdBQVMsYUFBYSxNQUE2RjtBQUN4SCxVQUFNLFFBQW9GLENBQUM7QUFFM0YsYUFBUyxLQUFLLE1BQWlCO0FBQzdCLFVBQUksS0FBSyxTQUFTLFFBQVE7QUFDeEIsY0FBTSxXQUFXLEtBQUs7QUFDdEIsWUFBSSxhQUFhLE1BQU0sU0FBUyxVQUFVO0FBQ3hDLGdCQUFNLFNBQVMsU0FBUztBQUN4QixjQUFJLENBQUMsTUFBTSxNQUFNLEdBQUc7QUFDbEIsa0JBQU0sTUFBTSxJQUFJLEVBQUUsUUFBUSxvQkFBSSxJQUFJLEdBQUcsT0FBTyxvQkFBSSxJQUFJLEdBQUcsT0FBTyxFQUFFO0FBQUEsVUFDbEU7QUFDQSxnQkFBTSxNQUFNLEVBQUUsT0FBTyxJQUFJLFNBQVMsS0FBSztBQUN2QyxnQkFBTSxNQUFNLEVBQUU7QUFFZCxnQkFBTSxXQUFXLEtBQUs7QUFDdEIsY0FBSSxhQUFhLE1BQU0sU0FBUyxPQUFPLGFBQWEsVUFBVTtBQUM1RCxrQkFBTSxNQUFNLEVBQUUsTUFBTSxJQUFJLFFBQVE7QUFBQSxVQUNsQztBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsVUFBSSxjQUFjLE1BQU07QUFDdEIsbUJBQVcsU0FBVSxLQUFtQixVQUFVO0FBQ2hELGVBQUssS0FBSztBQUFBLFFBQ1o7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFNBQUssSUFBSTtBQUNULFdBQU87QUFBQSxFQUNUO0FBS08sV0FBUyxlQUFlLE1BQXlCO0FBQ3RELFFBQUksUUFBUTtBQUNaLGFBQVMsS0FBSyxNQUFpQjtBQUM3QixVQUFJLEtBQUssU0FBUyxPQUFRO0FBQzFCLFVBQUksY0FBYyxNQUFNO0FBQ3RCLG1CQUFXLFNBQVUsS0FBbUIsVUFBVTtBQUNoRCxlQUFLLEtBQUs7QUFBQSxRQUNaO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxTQUFLLElBQUk7QUFDVCxXQUFPO0FBQUEsRUFDVDtBQXJQQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBOzs7QUNJTyxXQUFTLHlCQUF5QixNQUl2QztBQUNBLFdBQU87QUFBQSxNQUNMLGVBQWU7QUFBQSxNQUNmLGVBQWU7QUFBQSxRQUNiLFlBQVksV0FBVyxLQUFLLFVBQVU7QUFBQSxRQUN0QyxlQUFlLFdBQVcsS0FBSyxhQUFhO0FBQUEsUUFDNUMsYUFBYSxXQUFXLEtBQUssV0FBVztBQUFBLFFBQ3hDLGNBQWMsV0FBVyxLQUFLLFlBQVk7QUFBQSxNQUM1QztBQUFBLE1BQ0EsYUFBYSxXQUFXLEtBQUssV0FBVztBQUFBLElBQzFDO0FBQUEsRUFDRjtBQU1PLFdBQVMsdUJBQXVCLE1BSXJDO0FBQ0EsVUFBTSxlQUFlLEtBQUs7QUFDMUIsUUFBSSxDQUFDLGNBQWM7QUFDakIsYUFBTztBQUFBLFFBQ0wsZUFBZTtBQUFBLFFBQ2YsZUFBZTtBQUFBLFVBQ2IsWUFBWTtBQUFBLFVBQ1osZUFBZTtBQUFBLFVBQ2YsYUFBYTtBQUFBLFVBQ2IsY0FBYztBQUFBLFFBQ2hCO0FBQUEsUUFDQSxhQUFhO0FBQUEsTUFDZjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFdBQVcsS0FBSyxTQUNuQixPQUFPLE9BQUssRUFBRSxZQUFZLFNBQVMsRUFBRSxtQkFBbUIsRUFDeEQsS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLG9CQUFxQixJQUFJLEVBQUUsb0JBQXFCLENBQUM7QUFFckUsUUFBSSxTQUFTLFdBQVcsR0FBRztBQUN6QixhQUFPO0FBQUEsUUFDTCxlQUFlO0FBQUEsUUFDZixlQUFlO0FBQUEsVUFDYixZQUFZO0FBQUEsVUFDWixlQUFlO0FBQUEsVUFDZixhQUFhO0FBQUEsVUFDYixjQUFjO0FBQUEsUUFDaEI7QUFBQSxRQUNBLGFBQWE7QUFBQSxNQUNmO0FBQUEsSUFDRjtBQUVBLFVBQU0sYUFBYSxTQUFTLENBQUMsRUFBRTtBQUMvQixVQUFNLFlBQVksU0FBUyxTQUFTLFNBQVMsQ0FBQyxFQUFFO0FBRWhELFVBQU0sYUFBYSxXQUFXLElBQUksYUFBYTtBQUMvQyxVQUFNLGdCQUFpQixhQUFhLElBQUksYUFBYSxVQUFXLFVBQVUsSUFBSSxVQUFVO0FBR3hGLFVBQU0sV0FBVyxLQUFLLElBQUksR0FBRyxTQUFTLElBQUksT0FBSyxFQUFFLG9CQUFxQixDQUFDLENBQUM7QUFDeEUsVUFBTSxjQUFjLFdBQVcsYUFBYTtBQUc1QyxVQUFNLFlBQVksS0FBSyxJQUFJLEdBQUcsU0FBUyxJQUFJLE9BQUssRUFBRSxvQkFBcUIsSUFBSSxFQUFFLG9CQUFxQixLQUFLLENBQUM7QUFDeEcsVUFBTSxlQUFnQixhQUFhLElBQUksYUFBYSxRQUFTO0FBRzdELFFBQUksV0FBVztBQUNmLFFBQUksV0FBVztBQUNmLGFBQVMsSUFBSSxHQUFHLElBQUksU0FBUyxTQUFTLEdBQUcsS0FBSztBQUM1QyxZQUFNLGFBQWEsU0FBUyxDQUFDLEVBQUUsb0JBQXFCLElBQUksU0FBUyxDQUFDLEVBQUUsb0JBQXFCO0FBQ3pGLFlBQU0sVUFBVSxTQUFTLElBQUksQ0FBQyxFQUFFLG9CQUFxQjtBQUNyRCxZQUFNLE1BQU0sVUFBVTtBQUN0QixVQUFJLE1BQU0sR0FBRztBQUNYLG9CQUFZO0FBQ1o7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFVBQU0sU0FBUyxXQUFXLElBQUksS0FBSyxNQUFNLFdBQVcsUUFBUSxJQUFJO0FBRWhFLFdBQU87QUFBQSxNQUNMLGVBQWU7QUFBQSxNQUNmLGVBQWU7QUFBQSxRQUNiLFlBQVksV0FBVyxLQUFLLElBQUksR0FBRyxLQUFLLE1BQU0sVUFBVSxDQUFDLENBQUM7QUFBQSxRQUMxRCxlQUFlLFdBQVcsS0FBSyxJQUFJLEdBQUcsS0FBSyxNQUFNLGFBQWEsQ0FBQyxDQUFDO0FBQUEsUUFDaEUsYUFBYSxXQUFXLEtBQUssSUFBSSxHQUFHLEtBQUssTUFBTSxXQUFXLENBQUMsQ0FBQztBQUFBLFFBQzVELGNBQWMsV0FBVyxLQUFLLElBQUksR0FBRyxLQUFLLE1BQU0sWUFBWSxDQUFDLENBQUM7QUFBQSxNQUNoRTtBQUFBLE1BQ0EsYUFBYSxTQUFTLElBQUksV0FBVyxNQUFNLElBQUk7QUFBQSxJQUNqRDtBQUFBLEVBQ0Y7QUFNTyxXQUFTLGVBQWUsTUFBcUQ7QUFDbEYsVUFBTSxhQUFxQyxDQUFDO0FBRTVDLGFBQVMsU0FBUyxHQUFXO0FBQzNCLFVBQUksSUFBSSxLQUFLLElBQUksS0FBTTtBQUNyQixjQUFNLFVBQVUsS0FBSyxNQUFNLENBQUM7QUFDNUIsbUJBQVcsT0FBTyxLQUFLLFdBQVcsT0FBTyxLQUFLLEtBQUs7QUFBQSxNQUNyRDtBQUFBLElBQ0Y7QUFFQSxhQUFTLEtBQUssTUFBaUI7QUFDN0IsVUFBSSxLQUFLLFNBQVMsV0FBVyxLQUFLLFNBQVMsZUFBZSxLQUFLLFNBQVMsWUFBWTtBQUNsRixjQUFNLFFBQVE7QUFDZCxZQUFJLE1BQU0sY0FBYyxNQUFNLGVBQWUsUUFBUTtBQUNuRCxtQkFBUyxNQUFNLFVBQVU7QUFDekIsbUJBQVMsTUFBTSxhQUFhO0FBQzVCLG1CQUFTLE1BQU0sV0FBVztBQUMxQixtQkFBUyxNQUFNLFlBQVk7QUFDM0IsbUJBQVMsTUFBTSxXQUFXO0FBQUEsUUFDNUI7QUFBQSxNQUNGO0FBQ0EsVUFBSSxjQUFjLE1BQU07QUFDdEIsbUJBQVcsU0FBVSxLQUFtQixVQUFVO0FBQ2hELGVBQUssS0FBSztBQUFBLFFBQ1o7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFNBQUssSUFBSTtBQUVULFdBQU8sT0FBTyxRQUFRLFVBQVUsRUFDN0IsSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLE9BQU8sRUFBRSxPQUFPLE9BQU8sS0FBSyxHQUFHLE1BQU0sRUFBRSxFQUN6RCxLQUFLLENBQUMsR0FBRyxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUs7QUFBQSxFQUNyQztBQTdJQTtBQUFBO0FBQUE7QUFDQTtBQUFBO0FBQUE7OztBQ0tPLFdBQVMsV0FBVyxNQUEyQjtBQUVwRCxRQUFJLEtBQUssY0FBYyxLQUFLLGVBQWUsUUFBUTtBQUNqRCxZQUFNLGFBQWEsZ0JBQWdCLFFBQVMsS0FBYSxlQUFlO0FBRXhFLFVBQUksWUFBWTtBQUVkLGNBQU1BLFdBQVUsNEJBQTRCLElBQUk7QUFDaEQsZUFBTztBQUFBLFVBQ0wsWUFBWTtBQUFBLFVBQ1osU0FBQUE7QUFBQSxVQUNBLEtBQUssV0FBVyxLQUFLLFdBQVc7QUFBQSxVQUNoQyxRQUFRLHdCQUF3QixPQUFPLFdBQVksS0FBYSxrQkFBa0IsSUFBSTtBQUFBLFVBQ3RGLFdBQVc7QUFBQSxVQUNYLGNBQWMscUJBQXFCLE1BQU1BLFFBQU87QUFBQSxRQUNsRDtBQUFBLE1BQ0Y7QUFHQSxZQUFNLGVBQWUsS0FBSyxlQUFlO0FBRXpDLFVBQUksY0FBYztBQUVoQixjQUFNQSxXQUFVLEtBQUssU0FBUyxPQUFPLE9BQUssRUFBRSxZQUFZLEtBQUssRUFBRTtBQUMvRCxlQUFPO0FBQUEsVUFDTCxZQUFZO0FBQUEsVUFDWixTQUFBQTtBQUFBLFVBQ0EsS0FBSyxXQUFXLEtBQUssV0FBVztBQUFBLFVBQ2hDLFFBQVE7QUFBQSxVQUNSLFdBQVc7QUFBQSxVQUNYLGNBQWM7QUFBQSxRQUNoQjtBQUFBLE1BQ0Y7QUFJQSxZQUFNLGtCQUFrQixLQUFLLFNBQVM7QUFBQSxRQUFLLE9BQ3pDLEVBQUUsWUFBWSxVQUNiLEVBQUUsU0FBUyxXQUFXLEVBQUUsU0FBUyxlQUFlLEVBQUUsU0FBUyxlQUMzRCxFQUFnQixlQUFlO0FBQUEsTUFDbEM7QUFFQSxVQUFJLGlCQUFpQjtBQUNuQixjQUFNLGVBQWUsZ0JBQWdCLFNBQVMsT0FBTyxPQUFLLEVBQUUsWUFBWSxLQUFLLEVBQUU7QUFDL0UsZUFBTztBQUFBLFVBQ0wsWUFBWTtBQUFBLFVBQ1osU0FBUztBQUFBLFVBQ1QsS0FBSyxXQUFXLGdCQUFnQixXQUFXO0FBQUEsVUFDM0MsUUFBUSxXQUFXLEtBQUssV0FBVztBQUFBLFVBQ25DLFdBQVc7QUFBQSxVQUNYLGNBQWMscUJBQXFCLGlCQUFpQixZQUFZO0FBQUEsUUFDbEU7QUFBQSxNQUNGO0FBRUEsYUFBTztBQUFBLFFBQ0wsWUFBWTtBQUFBLFFBQ1osU0FBUztBQUFBLFFBQ1QsS0FBSyxXQUFXLEtBQUssV0FBVztBQUFBLFFBQ2hDLFFBQVE7QUFBQSxRQUNSLFdBQVc7QUFBQSxRQUNYLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFHQSxVQUFNLFVBQVUsb0NBQW9DLElBQUk7QUFDeEQsV0FBTztBQUFBLE1BQ0wsWUFBWTtBQUFBLE1BQ1o7QUFBQSxNQUNBLEtBQUssZ0NBQWdDLElBQUk7QUFBQSxNQUN6QyxRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsTUFDWCxjQUFjO0FBQUEsSUFDaEI7QUFBQSxFQUNGO0FBTUEsV0FBUyw0QkFBNEIsTUFBeUI7QUFDNUQsVUFBTSxVQUFVLEtBQUssU0FBUyxPQUFPLE9BQUssRUFBRSxZQUFZLFNBQVMsRUFBRSxtQkFBbUI7QUFDdEYsUUFBSSxRQUFRLFVBQVUsRUFBRyxRQUFPO0FBRWhDLFVBQU0sU0FBUyxRQUFRLENBQUMsRUFBRSxvQkFBcUI7QUFDL0MsVUFBTSxZQUFZO0FBQ2xCLFFBQUksb0JBQW9CO0FBRXhCLGVBQVcsU0FBUyxTQUFTO0FBQzNCLFVBQUksS0FBSyxJQUFJLE1BQU0sb0JBQXFCLElBQUksTUFBTSxLQUFLLFdBQVc7QUFDaEU7QUFBQSxNQUNGLE9BQU87QUFDTDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsV0FBTyxLQUFLLElBQUksR0FBRyxpQkFBaUI7QUFBQSxFQUN0QztBQU1BLFdBQVMsb0NBQW9DLE1BQXlCO0FBQ3BFLFVBQU0sVUFBVSxLQUFLLFNBQ2xCLE9BQU8sT0FBSyxFQUFFLFlBQVksU0FBUyxFQUFFLG1CQUFtQixFQUN4RCxLQUFLLENBQUMsR0FBRyxNQUFNLEVBQUUsb0JBQXFCLElBQUksRUFBRSxvQkFBcUIsQ0FBQztBQUVyRSxRQUFJLFFBQVEsVUFBVSxFQUFHLFFBQU87QUFFaEMsVUFBTSxTQUFTLFFBQVEsQ0FBQyxFQUFFLG9CQUFxQjtBQUMvQyxVQUFNLFlBQVk7QUFDbEIsUUFBSSxRQUFRO0FBRVosZUFBVyxTQUFTLFNBQVM7QUFDM0IsVUFBSSxLQUFLLElBQUksTUFBTSxvQkFBcUIsSUFBSSxNQUFNLEtBQUssV0FBVztBQUNoRTtBQUFBLE1BQ0YsT0FBTztBQUNMO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxXQUFPLEtBQUssSUFBSSxHQUFHLEtBQUs7QUFBQSxFQUMxQjtBQUtBLFdBQVMsZ0NBQWdDLE1BQWdDO0FBQ3ZFLFVBQU0sVUFBVSxLQUFLLFNBQ2xCLE9BQU8sT0FBSyxFQUFFLFlBQVksU0FBUyxFQUFFLG1CQUFtQixFQUN4RCxLQUFLLENBQUMsR0FBRyxNQUFNLEVBQUUsb0JBQXFCLElBQUksRUFBRSxvQkFBcUIsQ0FBQztBQUVyRSxRQUFJLFFBQVEsU0FBUyxFQUFHLFFBQU87QUFHL0IsVUFBTSxTQUFTLFFBQVEsQ0FBQyxFQUFFLG9CQUFxQjtBQUMvQyxVQUFNLFlBQVk7QUFDbEIsVUFBTSxXQUFXLFFBQVE7QUFBQSxNQUFPLE9BQzlCLEtBQUssSUFBSSxFQUFFLG9CQUFxQixJQUFJLE1BQU0sS0FBSztBQUFBLElBQ2pEO0FBRUEsUUFBSSxTQUFTLFNBQVMsRUFBRyxRQUFPO0FBRWhDLFFBQUksV0FBVztBQUNmLGFBQVMsSUFBSSxHQUFHLElBQUksU0FBUyxTQUFTLEdBQUcsS0FBSztBQUM1QyxZQUFNLFlBQVksU0FBUyxDQUFDLEVBQUUsb0JBQXFCLElBQUksU0FBUyxDQUFDLEVBQUUsb0JBQXFCO0FBQ3hGLFlBQU0sV0FBVyxTQUFTLElBQUksQ0FBQyxFQUFFLG9CQUFxQjtBQUN0RCxrQkFBWSxXQUFXO0FBQUEsSUFDekI7QUFFQSxVQUFNLFNBQVMsS0FBSyxNQUFNLFlBQVksU0FBUyxTQUFTLEVBQUU7QUFDMUQsV0FBTyxTQUFTLElBQUksV0FBVyxNQUFNLElBQUk7QUFBQSxFQUMzQztBQUtBLFdBQVMscUJBQXFCLE1BQWlCLFNBQWdDO0FBQzdFLFFBQUksV0FBVyxFQUFHLFFBQU87QUFDekIsVUFBTSxVQUFVLEtBQUssU0FBUyxPQUFPLE9BQUssRUFBRSxZQUFZLFNBQVMsRUFBRSxtQkFBbUI7QUFDdEYsUUFBSSxRQUFRLFdBQVcsRUFBRyxRQUFPO0FBRWpDLFVBQU0sU0FBUyxRQUFRLElBQUksT0FBSyxFQUFFLG9CQUFxQixLQUFLO0FBQzVELFVBQU0sV0FBVyxLQUFLLElBQUksR0FBRyxNQUFNO0FBQ25DLFdBQU8sV0FBVyxLQUFLLE1BQU0sUUFBUSxDQUFDO0FBQUEsRUFDeEM7QUE1S0E7QUFBQTtBQUFBO0FBQ0E7QUFBQTtBQUFBOzs7QUNNQSxXQUFTLFdBQVcsYUFBd0Q7QUFDMUUsWUFBUSxhQUFhO0FBQUEsTUFDbkIsS0FBSztBQUFZLGVBQU87QUFBQSxNQUN4QixLQUFLO0FBQVksZUFBTztBQUFBLE1BQ3hCLEtBQUs7QUFBWSxlQUFPO0FBQUEsTUFDeEIsS0FBSztBQUFlLGVBQU87QUFBQSxNQUMzQixLQUFLO0FBQWUsZUFBTztBQUFBLE1BQzNCO0FBQVMsZUFBTztBQUFBLElBQ2xCO0FBQUEsRUFDRjtBQUtBLFdBQVMsVUFBVSxRQUFxQjtBQUN0QyxRQUFJLENBQUMsT0FBUSxRQUFPO0FBQ3BCLFlBQVEsT0FBTyxNQUFNO0FBQUEsTUFDbkIsS0FBSztBQUFXLGVBQU87QUFBQSxNQUN2QixLQUFLO0FBQVksZUFBTztBQUFBLE1BQ3hCLEtBQUs7QUFBbUIsZUFBTztBQUFBLE1BQy9CLEtBQUs7QUFBVSxlQUFPO0FBQUEsTUFDdEIsS0FBSyx1QkFBdUI7QUFDMUIsY0FBTSxJQUFJLE9BQU87QUFDakIsWUFBSSxFQUFHLFFBQU8sZ0JBQWdCLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRTtBQUM3RCxlQUFPO0FBQUEsTUFDVDtBQUFBLE1BQ0E7QUFBUyxlQUFPO0FBQUEsSUFDbEI7QUFBQSxFQUNGO0FBTUEsV0FBUyxlQUNQLFFBQ0EsTUFDOEM7QUFDOUMsVUFBTSxVQUF3RCxDQUFDO0FBRy9ELFVBQU0sUUFBUSx1QkFBdUIsTUFBYTtBQUNsRCxVQUFNLFNBQVMsdUJBQXVCLElBQVc7QUFDakQsUUFBSSxTQUFTLFVBQVUsVUFBVSxRQUFRO0FBQ3ZDLGNBQVEsa0JBQWtCLEVBQUUsTUFBTSxPQUFPLElBQUksT0FBTztBQUFBLElBQ3REO0FBR0EsUUFBSSxhQUFhLFVBQVUsYUFBYSxNQUFNO0FBQzVDLFlBQU0sUUFBUyxPQUFlO0FBQzlCLFlBQU0sU0FBVSxLQUFhO0FBQzdCLFVBQUksVUFBVSxVQUFhLFdBQVcsVUFBYSxLQUFLLElBQUksUUFBUSxNQUFNLElBQUksTUFBTTtBQUNsRixnQkFBUSxVQUFVLEVBQUUsTUFBTSxPQUFPLEtBQUssR0FBRyxJQUFJLE9BQU8sTUFBTSxFQUFFO0FBQUEsTUFDOUQ7QUFBQSxJQUNGO0FBR0EsUUFBSSxPQUFPLHVCQUF1QixLQUFLLHFCQUFxQjtBQUMxRCxZQUFNLE9BQU8sT0FBTyxvQkFBb0I7QUFDeEMsWUFBTSxRQUFRLEtBQUssb0JBQW9CO0FBQ3ZDLFVBQUksT0FBTyxLQUFLLFFBQVEsR0FBRztBQUN6QixjQUFNLFNBQVMsS0FBSyxNQUFPLFFBQVEsT0FBUSxHQUFHLElBQUk7QUFDbEQsWUFBSSxLQUFLLElBQUksU0FBUyxDQUFDLElBQUksTUFBTTtBQUMvQixrQkFBUSxZQUFZLEVBQUUsTUFBTSxZQUFZLElBQUksU0FBUyxNQUFNLElBQUk7QUFBQSxRQUNqRTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBR0EsUUFBSSxrQkFBa0IsVUFBVSxrQkFBa0IsTUFBTTtBQUN0RCxZQUFNLE9BQVEsT0FBZTtBQUM3QixZQUFNLFFBQVMsS0FBYTtBQUM1QixVQUFJLE9BQU8sU0FBUyxZQUFZLE9BQU8sVUFBVSxZQUFZLFNBQVMsT0FBTztBQUMzRSxnQkFBUSxlQUFlLEVBQUUsTUFBTSxXQUFXLElBQUksR0FBSSxJQUFJLFdBQVcsS0FBSyxFQUFHO0FBQUEsTUFDM0U7QUFBQSxJQUNGO0FBR0EsUUFBSSxhQUFhLFVBQVUsYUFBYSxNQUFNO0FBQzVDLFlBQU0sWUFBWSxpQkFBaUIsTUFBYTtBQUNoRCxZQUFNLGFBQWEsaUJBQWlCLElBQVc7QUFDL0MsVUFBSSxjQUFjLFlBQVk7QUFDNUIsZ0JBQVEsWUFBWSxFQUFFLE1BQU0sYUFBYSxRQUFRLElBQUksY0FBYyxPQUFPO0FBQUEsTUFDNUU7QUFBQSxJQUNGO0FBR0EsUUFBSSxhQUFhLFVBQVUsYUFBYSxNQUFNO0FBQzVDLFlBQU0sWUFBWUMsb0JBQW1CLE1BQWE7QUFDbEQsWUFBTSxhQUFhQSxvQkFBbUIsSUFBVztBQUNqRCxVQUFJLGFBQWEsY0FBYyxjQUFjLFlBQVk7QUFDdkQsZ0JBQVEsY0FBYyxFQUFFLE1BQU0sV0FBVyxJQUFJLFdBQVc7QUFBQSxNQUMxRDtBQUFBLElBQ0Y7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUtBLFdBQVMsaUJBQWlCLE1BQXNEO0FBQzlFLFFBQUksQ0FBQyxLQUFLLFFBQVMsUUFBTztBQUMxQixlQUFXLFVBQVUsS0FBSyxTQUFTO0FBQ2pDLFVBQUksT0FBTyxTQUFTLGlCQUFpQixPQUFPLFlBQVksT0FBTztBQUM3RCxjQUFNLEVBQUUsUUFBUSxRQUFRLFFBQVEsTUFBTSxJQUFJO0FBQzFDLGNBQU0sTUFBTSxTQUFTLEtBQUs7QUFDMUIsY0FBTSxRQUFRLEtBQUssT0FBTyxNQUFNLEtBQUssS0FBSyxHQUFHLElBQUk7QUFDakQsZUFBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLE9BQU8sQ0FBQyxNQUFNLE1BQU0sTUFBTSxVQUFVLENBQUMsV0FBVyxLQUFLLE1BQU0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssTUFBTSxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxNQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxLQUFLO0FBQUEsTUFDeks7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFLQSxXQUFTQSxvQkFBbUIsTUFBcUQ7QUFDL0UsUUFBSSxDQUFDLEtBQUssUUFBUyxRQUFPO0FBQzFCLGVBQVcsVUFBVSxLQUFLLFNBQVM7QUFDakMsVUFBSSxPQUFPLFNBQVMsV0FBVyxPQUFPLFlBQVksT0FBTztBQUN2RCxlQUFPLFNBQVMsT0FBTyxLQUFLO0FBQUEsTUFDOUI7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFNTyxXQUFTLG9CQUFvQixhQUEyQztBQUM3RSxVQUFNLGVBQWtDLENBQUM7QUFFekMsYUFBUyxLQUFLLE1BQWlCO0FBN0lqQztBQThJSSxVQUFJLGVBQWUsTUFBTTtBQUN2QixjQUFNLFlBQWEsS0FBYTtBQUNoQyxZQUFJLGFBQWEsVUFBVSxTQUFTLEdBQUc7QUFDckMscUJBQVcsWUFBWSxXQUFXO0FBQ2hDLGtCQUFNLFVBQVUsWUFBVyxjQUFTLFlBQVQsbUJBQWtCLElBQUk7QUFDakQsZ0JBQUksQ0FBQyxRQUFTO0FBRWQsa0JBQU0sU0FBUyxTQUFTLFVBQVcsU0FBUyxXQUFXLFNBQVMsUUFBUSxDQUFDO0FBQ3pFLGdCQUFJLENBQUMsT0FBUTtBQUdiLGtCQUFNLGFBQWEsT0FBTztBQUMxQixrQkFBTSxZQUFXLHlDQUFZLFlBQVcsR0FBRyxXQUFXLFFBQVEsTUFBTTtBQUNwRSxrQkFBTSxTQUFTLFVBQVUseUNBQVksTUFBTTtBQUczQyxnQkFBSSxPQUFPLGtCQUFrQixZQUFZLFdBQVcsWUFBWSxpQkFBaUIsWUFBWSxVQUFVO0FBQ3JHLGtCQUFJO0FBQ0Ysc0JBQU0sV0FBVyxNQUFNLFlBQVksT0FBTyxhQUFhO0FBQ3ZELG9CQUFJLFVBQVU7QUFDWix3QkFBTSxrQkFBa0IsZUFBZSxNQUFNLFFBQXFCO0FBQ2xFLHNCQUFJLE9BQU8sS0FBSyxlQUFlLEVBQUUsU0FBUyxHQUFHO0FBQzNDLGlDQUFhLEtBQUs7QUFBQSxzQkFDaEIsYUFBYSxLQUFLO0FBQUEsc0JBQ2xCLGFBQWEsS0FBSztBQUFBLHNCQUNsQjtBQUFBLHNCQUNBLFlBQVksRUFBRSxVQUFVLE9BQU87QUFBQSxzQkFDL0I7QUFBQSxvQkFDRixDQUFDO0FBQUEsa0JBQ0g7QUFBQSxnQkFDRjtBQUFBLGNBQ0YsU0FBUTtBQUFBLGNBRVI7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBRUEsVUFBSSxjQUFjLE1BQU07QUFDdEIsbUJBQVcsU0FBVSxLQUFtQixVQUFVO0FBQ2hELGVBQUssS0FBSztBQUFBLFFBQ1o7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFNBQUssV0FBVztBQUNoQixXQUFPO0FBQUEsRUFDVDtBQTlMQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQUE7QUFBQTs7O0FDWU8sV0FBUyxtQkFBeUM7QUFDdkQsVUFBTSxNQUE0QjtBQUFBLE1BQ2hDLGFBQWEsQ0FBQztBQUFBLE1BQ2QsTUFBTSxDQUFDO0FBQUEsTUFDUCxTQUFTO0FBQUEsSUFDWDtBQUdBLFFBQUksQ0FBQyxNQUFNLGFBQWEsT0FBTyxNQUFNLFVBQVUsc0JBQXNCLFlBQVk7QUFDL0UsYUFBTztBQUFBLElBQ1Q7QUFFQSxRQUFJLGtCQUF1QyxDQUFDO0FBQzVDLFFBQUk7QUFDRixZQUFNLG1CQUFtQixNQUFNLFVBQVUsNEJBQTRCO0FBQ3JFLGlCQUFXLE9BQU8sa0JBQWtCO0FBQ2xDLHdCQUFnQixJQUFJLEVBQUUsSUFBSTtBQUFBLE1BQzVCO0FBQUEsSUFDRixTQUFRO0FBQ04sYUFBTztBQUFBLElBQ1Q7QUFFQSxRQUFJLFlBQXdCLENBQUM7QUFDN0IsUUFBSTtBQUNGLGtCQUFZLE1BQU0sVUFBVSxrQkFBa0I7QUFBQSxJQUNoRCxTQUFRO0FBQ04sYUFBTztBQUFBLElBQ1Q7QUFDQSxRQUFJLENBQUMsYUFBYSxVQUFVLFdBQVcsRUFBRyxRQUFPO0FBRWpELFFBQUksVUFBVTtBQUVkLGVBQVcsS0FBSyxXQUFXO0FBQ3pCLFlBQU0sYUFBYSxnQkFBZ0IsRUFBRSxvQkFBb0I7QUFDekQsVUFBSSxDQUFDLFdBQVk7QUFFakIsWUFBTSxnQkFBZ0IsV0FBVztBQUNqQyxZQUFNLE1BQU0sRUFBRSxhQUFhLGFBQWE7QUFDeEMsVUFBSSxRQUFRLE9BQVc7QUFFdkIsVUFBSTtBQUNKLFVBQUksRUFBRSxpQkFBaUIsU0FBUztBQUU5QixZQUFJLE9BQU8sT0FBTyxRQUFRLFlBQVksT0FBTyxLQUFLO0FBQ2hELGtCQUFRLFNBQVMsR0FBVTtBQUFBLFFBQzdCLE9BQU87QUFDTDtBQUFBLFFBQ0Y7QUFBQSxNQUNGLFdBQVcsRUFBRSxpQkFBaUIsU0FBUztBQUNyQyxnQkFBUSxPQUFPLFFBQVEsV0FBVyxNQUFNLE9BQU8sR0FBRztBQUFBLE1BQ3BELFdBQVcsRUFBRSxpQkFBaUIsVUFBVTtBQUN0QyxnQkFBUSxPQUFPLFFBQVEsV0FBVyxNQUFNLE9BQU8sR0FBRztBQUFBLE1BQ3BELFdBQVcsRUFBRSxpQkFBaUIsV0FBVztBQUN2QyxnQkFBUSxRQUFRLEdBQUc7QUFBQSxNQUNyQixPQUFPO0FBQ0w7QUFBQSxNQUNGO0FBRUEsWUFBTSxpQkFBaUIsV0FBVyxRQUFRO0FBQzFDLFVBQUksQ0FBQyxJQUFJLFlBQVksY0FBYyxFQUFHLEtBQUksWUFBWSxjQUFjLElBQUksQ0FBQztBQUN6RSxVQUFJLFlBQVksY0FBYyxFQUFFLEVBQUUsSUFBSSxJQUFJO0FBRzFDLFlBQU0sVUFBVSxHQUFHLGNBQWMsSUFBSSxFQUFFLElBQUk7QUFDM0MsVUFBSSxLQUFLLE9BQU8sSUFBSTtBQUFBLElBQ3RCO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFRTyxXQUFTLG9CQUFvQixjQUFzQixnQkFBZ0M7QUFDeEYsVUFBTSxNQUFNLGVBQWUsWUFBWTtBQUN2QyxVQUFNLE9BQU8sYUFBYSxZQUFZLEVBQUUsUUFBUSxlQUFlLEdBQUcsRUFBRSxRQUFRLE9BQU8sR0FBRyxFQUFFLFFBQVEsVUFBVSxFQUFFO0FBRTVHLFFBQUksSUFBSSxTQUFTLE9BQU8sS0FBSyxJQUFJLFNBQVMsUUFBUSxFQUFHLFFBQU8sU0FBUyxJQUFJO0FBQ3pFLFFBQUksSUFBSSxTQUFTLE1BQU0sRUFBRyxRQUFPLFdBQVcsSUFBSTtBQUNoRCxRQUFJLElBQUksU0FBUyxRQUFRLEVBQUcsUUFBTyxZQUFZLElBQUk7QUFDbkQsUUFBSSxJQUFJLFNBQVMsTUFBTSxLQUFLLElBQUksU0FBUyxNQUFNLEVBQUcsUUFBTyxRQUFRLElBQUk7QUFDckUsUUFBSSxJQUFJLFNBQVMsTUFBTSxLQUFLLElBQUksU0FBUyxRQUFRLEVBQUcsUUFBTyxRQUFRLElBQUk7QUFDdkUsUUFBSSxJQUFJLFNBQVMsTUFBTSxLQUFLLElBQUksU0FBUyxRQUFRLEVBQUcsUUFBTyxRQUFRLElBQUk7QUFDdkUsUUFBSSxJQUFJLFNBQVMsTUFBTSxFQUFHLFFBQU8sUUFBUSxJQUFJO0FBQzdDLFdBQU8sS0FBSyxJQUFJLFFBQVEsZUFBZSxHQUFHLENBQUMsSUFBSSxJQUFJO0FBQUEsRUFDckQ7QUF0R0E7QUFBQTtBQUFBO0FBQ0E7QUFBQTtBQUFBOzs7QUNXQSxXQUFTLHFCQUFxQixNQUFpQixRQUFnQixHQUFXO0FBQ3hFLFVBQU0sUUFBa0IsQ0FBQyxLQUFLLEtBQUssSUFBSSxFQUFFO0FBQ3pDLFFBQUksYUFBYSxJQUFXLEVBQUcsT0FBTSxLQUFLLEtBQUs7QUFFL0MsUUFBSSxjQUFjLFFBQVEsUUFBUSxHQUFHO0FBQ25DLFlBQU0sV0FBcUIsQ0FBQztBQUM1QixpQkFBVyxTQUFVLEtBQW1CLFVBQVU7QUFDaEQsWUFBSSxNQUFNLFlBQVksTUFBTztBQUM3QixpQkFBUyxLQUFLLHFCQUFxQixPQUFPLFFBQVEsQ0FBQyxDQUFDO0FBQUEsTUFDdEQ7QUFDQSxlQUFTLEtBQUs7QUFDZCxZQUFNLEtBQUssTUFBTSxTQUFTLEtBQUssR0FBRyxDQUFDLEdBQUc7QUFBQSxJQUN4QztBQUNBLFdBQU8sTUFBTSxLQUFLLEdBQUc7QUFBQSxFQUN2QjtBQWFPLFdBQVMsZ0JBQWdCLGFBQXNEO0FBQ3BGLFVBQU0sWUFBMEMsQ0FBQztBQUNqRCxVQUFNLFdBQVcsb0JBQUksSUFBWTtBQUVqQyxhQUFTLE9BQU8sZUFBK0I7QUFDN0MsWUFBTSxPQUFPLGNBQWMsWUFBWSxFQUFFLFFBQVEsUUFBUSxHQUFHLEVBQUUsUUFBUSxlQUFlLEVBQUUsS0FDbEYsWUFBWSxPQUFPLEtBQUssU0FBUyxFQUFFLFNBQVMsQ0FBQztBQUNsRCxVQUFJLENBQUMsU0FBUyxJQUFJLElBQUksR0FBRztBQUN2QixpQkFBUyxJQUFJLElBQUk7QUFDakIsZUFBTztBQUFBLE1BQ1Q7QUFDQSxVQUFJLElBQUk7QUFDUixhQUFPLFNBQVMsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRztBQUNyQyxlQUFTLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxFQUFFO0FBQzNCLGFBQU8sR0FBRyxJQUFJLElBQUksQ0FBQztBQUFBLElBQ3JCO0FBRUEsYUFBUyxLQUFLLE1BQWlCLE9BQXdCO0FBQ3JELFVBQUksUUFBUSxFQUFHLFFBQU87QUFDdEIsVUFBSSxFQUFFLGNBQWMsTUFBTyxRQUFPO0FBRWxDLFlBQU0sT0FBUSxLQUFtQixTQUFTLE9BQU8sT0FBSyxFQUFFLFlBQVksS0FBSztBQUN6RSxVQUFJLEtBQUssVUFBVSxHQUFHO0FBQ3BCLGNBQU0sU0FBUyxvQkFBSSxJQUF5QjtBQUM1QyxtQkFBVyxLQUFLLE1BQU07QUFDcEIsZ0JBQU0sS0FBSyxxQkFBcUIsQ0FBQztBQUNqQyxjQUFJLENBQUMsT0FBTyxJQUFJLEVBQUUsRUFBRyxRQUFPLElBQUksSUFBSSxDQUFDLENBQUM7QUFDdEMsaUJBQU8sSUFBSSxFQUFFLEVBQUcsS0FBSyxDQUFDO0FBQUEsUUFDeEI7QUFDQSxZQUFJLFlBQWdDO0FBQ3BDLG1CQUFXLEtBQUssT0FBTyxPQUFPLEdBQUc7QUFDL0IsY0FBSSxDQUFDLGFBQWEsRUFBRSxTQUFTLFVBQVUsT0FBUSxhQUFZO0FBQUEsUUFDN0Q7QUFDQSxZQUFJLGFBQWEsVUFBVSxVQUFVLEdBQUc7QUFDdEMsZ0JBQU0sYUFBYSxVQUFVLFVBQVU7QUFDdkMsZ0JBQU0sWUFBWSxvQkFBb0IsS0FBSyxLQUFLLFFBQVEsRUFBRTtBQUMxRCxnQkFBTSxZQUFZLFVBQVUsVUFBVSxLQUFLLEtBQUssS0FBSyxTQUFTLEdBQUc7QUFDakUsY0FBSSxjQUFlLGFBQWEsV0FBWTtBQUMxQyxrQkFBTSxNQUFNLE9BQU8sS0FBSyxRQUFRLFVBQVU7QUFDMUMsc0JBQVUsR0FBRyxJQUFJO0FBQUEsY0FDZixvQkFBb0IsS0FBSztBQUFBLGNBQ3pCLFdBQVcsVUFBVTtBQUFBLGNBQ3JCLG1CQUFtQixVQUFVLENBQUMsRUFBRTtBQUFBLGNBQ2hDLE9BQU8sVUFBVSxJQUFJLG1CQUFtQjtBQUFBLFlBQzFDO0FBQ0EsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFFQSxpQkFBVyxLQUFLLEtBQU0sTUFBSyxHQUFHLFFBQVEsQ0FBQztBQUN2QyxhQUFPO0FBQUEsSUFDVDtBQUVBLFFBQUksY0FBYyxhQUFhO0FBQzdCLGlCQUFXLEtBQU0sWUFBMEIsVUFBVTtBQUNuRCxZQUFJLEVBQUUsWUFBWSxNQUFPLE1BQUssR0FBRyxDQUFDO0FBQUEsTUFDcEM7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFFQSxXQUFTLG9CQUFvQixNQUErQjtBQUMxRCxVQUFNLE9BQXFCLEVBQUUsT0FBTyxDQUFDLEVBQUU7QUFDdkMsUUFBSSxZQUFZO0FBQ2hCLFFBQUksaUJBQWdDO0FBQ3BDLFFBQUksZ0JBQStCO0FBRW5DLGFBQVMsS0FBSyxHQUFjO0FBQzFCLFVBQUksRUFBRSxZQUFZLE1BQU87QUFFekIsVUFBSSxFQUFFLFNBQVMsUUFBUTtBQUNyQixjQUFNLElBQUk7QUFDVixjQUFNLFNBQVMsRUFBRSxRQUFRLElBQUksWUFBWSxFQUFFLFFBQVEsUUFBUSxHQUFHLEVBQUUsUUFBUSxlQUFlLEVBQUU7QUFDekYsY0FBTSxPQUFPLFNBQVMsQ0FBQyxvQ0FBb0MsS0FBSyxLQUFLLElBQ2pFLFFBQVEsUUFBUSxTQUFTO0FBQzdCLFlBQUksRUFBRSxXQUFZLE1BQUssTUFBTSxJQUFJLElBQUksRUFBRTtBQUN2QztBQUFBLE1BQ0Y7QUFFQSxVQUFJLENBQUMsa0JBQWtCLGFBQWEsQ0FBUSxHQUFHO0FBQzdDLHlCQUFpQixHQUFHLFFBQVEsRUFBRSxRQUFRLE9BQU8sQ0FBQztBQUM5QyxZQUFJLEVBQUUsUUFBUSxDQUFDLG1CQUFtQixFQUFFLElBQUksR0FBRztBQUN6QywwQkFBZ0IsRUFBRSxLQUFLLFFBQVEsU0FBUyxHQUFHLEVBQUUsUUFBUSxRQUFRLEdBQUcsRUFBRSxLQUFLLEVBQ3BFLFFBQVEsU0FBUyxPQUFLLEVBQUUsWUFBWSxDQUFDO0FBQUEsUUFDMUM7QUFBQSxNQUNGO0FBRUEsVUFBSSxDQUFDLEtBQUssV0FBVyxlQUFlLEdBQUc7QUFDckMsY0FBTSxZQUFhLEVBQVU7QUFDN0IsWUFBSSxNQUFNLFFBQVEsU0FBUyxHQUFHO0FBQzVCLGdCQUFPLFlBQVcsS0FBSyxXQUFXO0FBQ2hDLGtCQUFNLFVBQVUsRUFBRSxZQUFZLEVBQUUsU0FBUyxDQUFDLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDdkQsdUJBQVcsS0FBSyxTQUFTO0FBQ3ZCLGtCQUFJLEtBQUssRUFBRSxTQUFTLFNBQVMsRUFBRSxLQUFLO0FBQUUscUJBQUssVUFBVSxFQUFFO0FBQUssc0JBQU07QUFBQSxjQUFPO0FBQUEsWUFDM0U7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFFQSxVQUFJLGNBQWMsR0FBRztBQUNuQixtQkFBVyxLQUFNLEVBQWdCLFNBQVUsTUFBSyxDQUFDO0FBQUEsTUFDbkQ7QUFBQSxJQUNGO0FBQ0EsU0FBSyxJQUFJO0FBQ1QsUUFBSSxlQUFnQixNQUFLLFlBQVk7QUFDckMsUUFBSSxjQUFlLE1BQUssTUFBTTtBQUM5QixXQUFPO0FBQUEsRUFDVDtBQWlCTyxXQUFTLHdCQUF3QixhQUE0QztBQUNsRixVQUFNLFdBQStCLENBQUM7QUFDdEMsVUFBTSxjQUFjLG9CQUFJLElBQVk7QUFFcEMsYUFBUyxXQUFXLEdBQXFCO0FBQ3ZDLFVBQUksWUFBWSxJQUFJLEVBQUUsVUFBVSxFQUFHO0FBQ25DLGtCQUFZLElBQUksRUFBRSxVQUFVO0FBQzVCLGVBQVMsS0FBSyxDQUFDO0FBQUEsSUFDakI7QUFFQSxhQUFTLEtBQUssTUFBaUIsT0FBZTtBQTlLaEQ7QUErS0ksVUFBSSxRQUFRLEtBQUssS0FBSyxZQUFZLE1BQU87QUFDekMsWUFBTSxPQUFPLEtBQUssUUFBUTtBQUcxQixVQUFJLFNBQVMsS0FBSyxJQUFJLEtBQUssY0FBYyxNQUFNO0FBQzdDLG1CQUFXO0FBQUEsVUFDVCxNQUFNO0FBQUEsVUFDTixZQUFZLEtBQUs7QUFBQSxVQUNqQixjQUFjLEtBQUs7QUFBQSxVQUNuQixZQUFZO0FBQUEsUUFDZCxDQUFDO0FBQ0Q7QUFBQSxNQUNGO0FBRUEsVUFBSSxjQUFjLE1BQU07QUFDdEIsY0FBTSxRQUFRO0FBQ2QsY0FBTSxPQUFPLE1BQU0sU0FBUyxPQUFPLE9BQUssRUFBRSxZQUFZLEtBQUs7QUFHM0QsY0FBTSxlQUFlLFlBQVksS0FBSyxJQUFJO0FBQzFDLGNBQU0sb0JBQW9CLE1BQU0sZUFBZSxnQkFBZ0IsTUFBTSxpQkFBaUI7QUFDdEYsWUFBSSxnQkFBZ0IsbUJBQW1CO0FBQ3JDLGNBQUksS0FBSyxVQUFVLEdBQUc7QUFDcEIsa0JBQU0sTUFBTSxxQkFBcUIsS0FBSyxDQUFDLENBQUM7QUFDeEMsa0JBQU0sV0FBVyxLQUFLLE9BQU8sT0FBSyxxQkFBcUIsQ0FBQyxNQUFNLEdBQUcsRUFBRTtBQUNuRSxnQkFBSSxZQUFZLEdBQUc7QUFDakIseUJBQVc7QUFBQSxnQkFDVCxNQUFNO0FBQUEsZ0JBQ04sWUFBWSxLQUFLO0FBQUEsZ0JBQ2pCLGNBQWMsS0FBSztBQUFBLGdCQUNuQixXQUFXO0FBQUEsZ0JBQ1gsWUFBWSxlQUFlLFNBQVM7QUFBQSxnQkFDcEMsTUFBTTtBQUFBLGtCQUNKLFlBQVksTUFBTTtBQUFBLGtCQUNsQixjQUFjLE1BQU07QUFBQSxrQkFDcEIsY0FBYSxXQUFNLGdCQUFOLFlBQXFCO0FBQUEsZ0JBQ3BDO0FBQUEsY0FDRixDQUFDO0FBQ0Q7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFHQSxZQUFJLGFBQWEsS0FBSyxJQUFJLEtBQUssS0FBSyxVQUFVLEdBQUc7QUFDL0MsZ0JBQU0sUUFBc0QsQ0FBQztBQUM3RCxxQkFBVyxLQUFLLE1BQU07QUFDcEIsa0JBQU0sTUFBTSxlQUFlLENBQUM7QUFDNUIsZ0JBQUksSUFBSSxTQUFTLEdBQUc7QUFDbEIsb0JBQU0sS0FBSyxFQUFFLFVBQVUsSUFBSSxDQUFDLEdBQUcsUUFBUSxJQUFJLE1BQU0sQ0FBQyxFQUFFLEtBQUssR0FBRyxLQUFLLE9BQVUsQ0FBQztBQUFBLFlBQzlFO0FBQUEsVUFDRjtBQUNBLGNBQUksTUFBTSxVQUFVLEdBQUc7QUFDckIsdUJBQVc7QUFBQSxjQUNULE1BQU07QUFBQSxjQUNOLFlBQVksS0FBSztBQUFBLGNBQ2pCLGNBQWMsS0FBSztBQUFBLGNBQ25CLFdBQVcsTUFBTTtBQUFBLGNBQ2pCLFlBQVk7QUFBQSxjQUNaLE1BQU0sRUFBRSxNQUFNO0FBQUEsWUFDaEIsQ0FBQztBQUNEO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFHQSxZQUFJLFFBQVEsS0FBSyxJQUFJLEtBQUssS0FBSyxVQUFVLEdBQUc7QUFDMUMscUJBQVc7QUFBQSxZQUNULE1BQU07QUFBQSxZQUNOLFlBQVksS0FBSztBQUFBLFlBQ2pCLGNBQWMsS0FBSztBQUFBLFlBQ25CLFdBQVcsS0FBSztBQUFBLFlBQ2hCLFlBQVk7QUFBQSxVQUNkLENBQUM7QUFDRDtBQUFBLFFBQ0Y7QUFFQSxtQkFBVyxLQUFLLEtBQU0sTUFBSyxHQUFHLFFBQVEsQ0FBQztBQUFBLE1BQ3pDO0FBQUEsSUFDRjtBQUVBLFNBQUssYUFBYSxDQUFDO0FBQ25CLFdBQU87QUFBQSxFQUNUO0FBRUEsV0FBUyxlQUFlLE1BQTJCO0FBQ2pELFVBQU0sTUFBZ0IsQ0FBQztBQUN2QixhQUFTLEtBQUssR0FBYztBQUMxQixVQUFJLEVBQUUsWUFBWSxNQUFPO0FBQ3pCLFVBQUksRUFBRSxTQUFTLFFBQVE7QUFDckIsY0FBTSxTQUFVLEVBQWUsY0FBYyxJQUFJLEtBQUs7QUFDdEQsWUFBSSxNQUFPLEtBQUksS0FBSyxLQUFLO0FBQUEsTUFDM0I7QUFDQSxVQUFJLGNBQWMsR0FBRztBQUNuQixtQkFBVyxLQUFNLEVBQWdCLFNBQVUsTUFBSyxDQUFDO0FBQUEsTUFDbkQ7QUFBQSxJQUNGO0FBQ0EsU0FBSyxJQUFJO0FBQ1QsV0FBTztBQUFBLEVBQ1Q7QUFXTyxXQUFTLGlCQUFpQixhQUErQztBQUM5RSxVQUFNLFFBQXdELENBQUM7QUFDL0QsVUFBTSxPQUFPLG9CQUFJLElBQVk7QUFFN0IsYUFBUyxLQUFLLE1BQWlCLE9BQWU7QUFDNUMsVUFBSSxRQUFRLEtBQUssS0FBSyxZQUFZLE1BQU87QUFDekMsVUFBSSxLQUFLLFNBQVMsUUFBUTtBQUN4QixjQUFNLElBQUk7QUFDVixjQUFNLFFBQVEsRUFBRSxjQUFjLElBQUksS0FBSztBQUN2QyxZQUFJLENBQUMsUUFBUSxLQUFLLFNBQVMsR0FBSTtBQUMvQixjQUFNLEtBQUssRUFBRSxhQUFhLE1BQU0sUUFBUyxFQUFFLFdBQXNCO0FBQ2pFLFlBQUksS0FBSyxHQUFJO0FBQ2IsWUFBSSxLQUFLLElBQUksS0FBSyxZQUFZLENBQUMsRUFBRztBQUNsQyxhQUFLLElBQUksS0FBSyxZQUFZLENBQUM7QUFFM0IsWUFBSSxPQUFzQjtBQUMxQixjQUFNLFlBQWEsRUFBVTtBQUM3QixZQUFJLE1BQU0sUUFBUSxTQUFTLEdBQUc7QUFDNUIsZ0JBQU8sWUFBVyxLQUFLLFdBQVc7QUFDaEMsa0JBQU0sVUFBVSxFQUFFLFlBQVksRUFBRSxTQUFTLENBQUMsRUFBRSxNQUFNLElBQUksQ0FBQztBQUN2RCx1QkFBVyxLQUFLLFNBQVM7QUFDdkIsa0JBQUksS0FBSyxFQUFFLFNBQVMsU0FBUyxFQUFFLEtBQUs7QUFBRSx1QkFBTyxFQUFFO0FBQUssc0JBQU07QUFBQSxjQUFPO0FBQUEsWUFDbkU7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUNBLGNBQU0sS0FBSyxFQUFFLE9BQU8sTUFBTSxLQUFLLENBQUM7QUFDaEM7QUFBQSxNQUNGO0FBQ0EsVUFBSSxjQUFjLE1BQU07QUFDdEIsbUJBQVcsS0FBTSxLQUFtQixTQUFVLE1BQUssR0FBRyxRQUFRLENBQUM7QUFBQSxNQUNqRTtBQUFBLElBQ0Y7QUFDQSxTQUFLLGFBQWEsQ0FBQztBQUNuQixRQUFJLE1BQU0sU0FBUyxFQUFHLFFBQU87QUFDN0IsV0FBTyxFQUFFLE1BQU07QUFBQSxFQUNqQjtBQXlCTyxXQUFTLGlCQUFpQixHQUF1RTtBQUV0RyxRQUFJLEVBQUUsWUFBWSxFQUFFLGVBQWUsU0FBVSxRQUFPLEVBQUUsTUFBTSxVQUFVLFlBQVksT0FBTztBQUN6RixRQUFJLEVBQUUsWUFBWSxFQUFFLGVBQWUsU0FBVSxRQUFPLEVBQUUsTUFBTSxVQUFVLFlBQVksT0FBTztBQUV6RixVQUFNLFFBQVEsRUFBRSxhQUFhLElBQUksWUFBWTtBQUM3QyxVQUFNLFdBQXFEO0FBQUEsTUFDekQsRUFBRSxJQUFJLFlBQVksTUFBTSxPQUFPO0FBQUEsTUFDL0IsRUFBRSxJQUFJLHVDQUF1QyxNQUFNLFdBQVc7QUFBQSxNQUM5RCxFQUFFLElBQUkscUJBQXFCLE1BQU0sZUFBZTtBQUFBLE1BQ2hELEVBQUUsSUFBSSxvQ0FBb0MsTUFBTSxNQUFNO0FBQUEsTUFDdEQsRUFBRSxJQUFJLG1DQUFtQyxNQUFNLE1BQU07QUFBQSxNQUNyRCxFQUFFLElBQUksd0JBQXdCLE1BQU0sVUFBVTtBQUFBLE1BQzlDLEVBQUUsSUFBSSxlQUFlLE1BQU0sVUFBVTtBQUFBLE1BQ3JDLEVBQUUsSUFBSSwyQ0FBMkMsTUFBTSxRQUFRO0FBQUEsTUFDL0QsRUFBRSxJQUFJLGNBQWMsTUFBTSxTQUFTO0FBQUEsTUFDbkMsRUFBRSxJQUFJLHNDQUFzQyxNQUFNLFNBQVM7QUFBQSxNQUMzRCxFQUFFLElBQUksb0NBQW9DLE1BQU0sWUFBWTtBQUFBLElBQzlEO0FBQ0EsZUFBVyxFQUFFLElBQUksS0FBSyxLQUFLLFVBQVU7QUFDbkMsVUFBSSxHQUFHLEtBQUssSUFBSSxFQUFHLFFBQU8sRUFBRSxNQUFNLFlBQVksT0FBTztBQUFBLElBQ3ZEO0FBR0EsUUFBSSxFQUFFLFNBQVMsS0FBSyxRQUFNLEdBQUcsU0FBUyxXQUFXLEVBQUcsUUFBTyxFQUFFLE1BQU0sT0FBTyxZQUFZLE9BQU87QUFDN0YsUUFBSSxFQUFFLGNBQWUsUUFBTyxFQUFFLE1BQU0sV0FBVyxZQUFZLE9BQU87QUFHbEUsVUFBTSxVQUFVLE9BQU8sS0FBSyxFQUFFLFNBQVM7QUFDdkMsUUFBSSxRQUFRLFNBQVMsR0FBRztBQUN0QixZQUFNLE1BQU0sRUFBRSxVQUFVLFFBQVEsQ0FBQyxDQUFDO0FBQ2xDLFlBQU0sUUFBUSxJQUFJLE1BQU0sQ0FBQztBQUN6QixVQUFJLE9BQU87QUFDVCxjQUFNLFdBQVcsQ0FBQyxDQUFDLE1BQU07QUFDekIsY0FBTSxXQUFXLE9BQU8sT0FBTyxNQUFNLEtBQUs7QUFDMUMsY0FBTSxXQUFXLE9BQU8sS0FBSyxNQUFNLEtBQUs7QUFDeEMsY0FBTSxTQUFTLFNBQVMsS0FBSyxHQUFHO0FBQ2hDLGNBQU0sV0FBVyxxREFBcUQsS0FBSyxNQUFNO0FBQ2pGLGNBQU0sWUFBWSxTQUFTLEtBQUssUUFBTSxLQUFLLElBQUksU0FBUyxHQUFHO0FBQzNELGNBQU0sYUFBYSxZQUFZLFNBQVMsV0FBVztBQUNuRCxjQUFNLFVBQVUsb0VBQW9FLEtBQUssTUFBTSxLQUMvRSxvQkFBb0IsS0FBSyxNQUFNLEtBQy9CLCtCQUErQixLQUFLLE1BQU07QUFFMUQsWUFBSSxTQUFVLFFBQU8sRUFBRSxNQUFNLFdBQVcsWUFBWSxNQUFNO0FBQzFELFlBQUksV0FBWSxRQUFPLEVBQUUsTUFBTSxTQUFTLFlBQVksTUFBTTtBQUMxRCxZQUFJLFFBQVMsUUFBTyxFQUFFLE1BQU0sYUFBYSxZQUFZLE1BQU07QUFDM0QsWUFBSSxVQUFXLFFBQU8sRUFBRSxNQUFNLGdCQUFnQixZQUFZLE1BQU07QUFDaEUsWUFBSSxZQUFZLFNBQVMsVUFBVSxFQUFHLFFBQU8sRUFBRSxNQUFNLFlBQVksWUFBWSxNQUFNO0FBQUEsTUFDckY7QUFBQSxJQUNGO0FBR0EsUUFBSSxFQUFFLGlCQUFpQixHQUFHO0FBQ3hCLFlBQU0sZ0JBQWdCLEVBQUUsbUJBQW1CLEtBQUssT0FBSyxFQUFFLFlBQVksRUFBRTtBQUNyRSxZQUFNLFlBQVksT0FBTyxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssT0FBSyxrQkFBa0IsS0FBSyxDQUFDLENBQUM7QUFDN0UsWUFBTSxXQUFXLE9BQU8sS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLE9BQUssb0JBQW9CLEtBQUssQ0FBQyxLQUFLLE1BQU0sa0JBQWtCO0FBQzFHLFVBQUksa0JBQWtCLGFBQWEsVUFBVyxRQUFPLEVBQUUsTUFBTSxRQUFRLFlBQVksTUFBTTtBQUFBLElBQ3pGO0FBR0EsVUFBTSxjQUFjLE9BQU8sS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLE9BQUssa0JBQWtCLEtBQUssQ0FBQyxDQUFDLEVBQUUsVUFBVTtBQUM3RixVQUFNLFlBQVksRUFBRSxtQkFBbUI7QUFDdkMsUUFBSSxlQUFlLGFBQWEsS0FBSyxRQUFRLFdBQVcsR0FBRztBQUN6RCxhQUFPLEVBQUUsTUFBTSxPQUFPLFlBQVksTUFBTTtBQUFBLElBQzFDO0FBRUEsV0FBTyxFQUFFLE1BQU0sV0FBVyxZQUFZLE1BQU07QUFBQSxFQUM5QztBQVVPLFdBQVMscUJBQXFCLE1BQXNCO0FBQ3pELFlBQVEsUUFBUSxJQUNiLFlBQVksRUFDWixRQUFRLDJDQUEyQyxFQUFFLEVBQ3JELFFBQVEsZ0JBQWdCLEVBQUUsRUFDMUIsS0FBSztBQUFBLEVBQ1Y7QUFPTyxXQUFTLG1CQUNkLGNBQ0EsZUFDQSxlQUM0QjtBQUM1QixRQUFJLGdCQUFnQixLQUFLLGlCQUFpQixJQUFLLFFBQU87QUFDdEQsUUFBSSxnQkFBZ0IsZ0JBQWdCLEVBQUcsUUFBTztBQUM5QyxXQUFPO0FBQUEsRUFDVDtBQTViQSxNQTRCTSxxQkE2SEEsYUFDQSxjQUNBLFNBQ0E7QUE1Sk47QUFBQTtBQUFBO0FBR0E7QUFDQTtBQXdCQSxNQUFNLHNCQUFzQjtBQTZINUIsTUFBTSxjQUFjO0FBQ3BCLE1BQU0sZUFBZTtBQUNyQixNQUFNLFVBQVU7QUFDaEIsTUFBTSxXQUFXO0FBQUE7QUFBQTs7O0FDeklqQixXQUFTLGlCQUFpQixXQUFtQztBQUMzRCxRQUFJLGFBQWEsVUFBVSxTQUFTO0FBQUEsTUFBTyxPQUN6QyxFQUFFLFlBQVksVUFDYixFQUFFLFNBQVMsV0FBVyxFQUFFLFNBQVMsZUFBZSxFQUFFLFNBQVMsY0FBYyxFQUFFLFNBQVM7QUFBQSxJQUN2RjtBQUdBLFFBQUksV0FBVyxXQUFXLEtBQUssY0FBYyxXQUFXLENBQUMsR0FBRztBQUMxRCxZQUFNLFVBQVUsV0FBVyxDQUFDO0FBQzVCLFlBQU0sa0JBQWtCLFFBQVEsU0FBUztBQUFBLFFBQU8sT0FDOUMsRUFBRSxZQUFZLFVBQ2IsRUFBRSxTQUFTLFdBQVcsRUFBRSxTQUFTLGVBQWUsRUFBRSxTQUFTLGNBQWMsRUFBRSxTQUFTO0FBQUEsTUFDdkY7QUFDQSxVQUFJLGdCQUFnQixTQUFTLEdBQUc7QUFDOUIscUJBQWE7QUFBQSxNQUNmO0FBQUEsSUFDRjtBQUdBLFdBQU8sQ0FBQyxHQUFHLFVBQVUsRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNO0FBdEN4QztBQXVDSSxZQUFNLE1BQUssYUFBRSx3QkFBRixtQkFBdUIsTUFBdkIsWUFBNEI7QUFDdkMsWUFBTSxNQUFLLGFBQUUsd0JBQUYsbUJBQXVCLE1BQXZCLFlBQTRCO0FBQ3ZDLGFBQU8sS0FBSztBQUFBLElBQ2QsQ0FBQztBQUFBLEVBQ0g7QUFLQSxXQUFTLHFCQUFxQixNQUFnQztBQUM1RCxVQUFNLEtBQUssdUJBQXVCLElBQVc7QUFDN0MsVUFBTSxXQUFXLGdCQUFnQixJQUFXO0FBQzVDLFVBQU0sU0FBUyxLQUFLO0FBQ3BCLFVBQU0sVUFBVSxlQUFlLElBQVc7QUFDMUMsVUFBTSxVQUFVLHVCQUF1QixJQUFXO0FBRWxELFVBQU0sU0FBd0I7QUFBQSxNQUM1QixZQUFZO0FBQUE7QUFBQSxNQUNaLGVBQWU7QUFBQSxNQUNmLGFBQWE7QUFBQSxNQUNiLGNBQWM7QUFBQSxNQUNkLGlCQUFpQjtBQUFBLE1BQ2pCLGlCQUFpQixhQUFhLElBQVcsSUFBSSxhQUFhO0FBQUEsTUFDMUQsb0JBQW9CO0FBQUEsTUFDcEIsV0FBVyxTQUFTLFdBQVcsT0FBTyxNQUFNLElBQUk7QUFBQSxNQUNoRCxVQUFVO0FBQUEsTUFDVixXQUFXLFFBQVE7QUFBQSxNQUNuQixRQUFRLFFBQVE7QUFBQSxNQUNoQixnQkFBZ0IsUUFBUTtBQUFBLElBQzFCO0FBQ0EsUUFBSSxTQUFTO0FBQ1gsVUFBSSxRQUFRLFlBQVksTUFBTTtBQUFBLE1BRzlCLE9BQU87QUFDTCxlQUFPLHNCQUFzQixXQUFXLFFBQVEsT0FBTztBQUN2RCxlQUFPLHVCQUF1QixXQUFXLFFBQVEsUUFBUTtBQUN6RCxlQUFPLHlCQUF5QixXQUFXLFFBQVEsVUFBVTtBQUM3RCxlQUFPLDBCQUEwQixXQUFXLFFBQVEsV0FBVztBQUFBLE1BQ2pFO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBU0EsV0FBUyx1QkFBdUIsTUFFdkI7QUFDUCxVQUFNLElBQUk7QUFDVixVQUFNLEtBQUssRUFBRTtBQUNiLFVBQU0sS0FBSyxPQUFPLEVBQUUsa0JBQWtCLFdBQVcsRUFBRSxnQkFBZ0I7QUFDbkUsVUFBTSxLQUFLLE9BQU8sRUFBRSxtQkFBbUIsV0FBVyxFQUFFLGlCQUFpQjtBQUNyRSxVQUFNLEtBQUssT0FBTyxFQUFFLHFCQUFxQixXQUFXLEVBQUUsbUJBQW1CO0FBQ3pFLFVBQU0sS0FBSyxPQUFPLEVBQUUsc0JBQXNCLFdBQVcsRUFBRSxvQkFBb0I7QUFFM0UsUUFBSSxPQUFPLE9BQU8sWUFBWSxPQUFPLE1BQU07QUFFekMsVUFBSSxPQUFPLEVBQUcsUUFBTztBQUNyQixhQUFPLEVBQUUsU0FBUyxJQUFJLFVBQVUsSUFBSSxZQUFZLElBQUksYUFBYSxJQUFJLFNBQVMsR0FBRztBQUFBLElBQ25GO0FBQ0EsUUFBSSxPQUFPLFFBQVEsT0FBTyxRQUFRLE9BQU8sUUFBUSxPQUFPLE1BQU07QUFDNUQsYUFBTztBQUFBLFFBQ0wsU0FBUyxNQUFNO0FBQUEsUUFDZixVQUFVLE1BQU07QUFBQSxRQUNoQixZQUFZLE1BQU07QUFBQSxRQUNsQixhQUFhLE1BQU07QUFBQSxRQUNuQixTQUFVLE9BQU8sTUFBTSxPQUFPLE1BQU0sT0FBTyxLQUFPLE1BQU0sSUFBSztBQUFBLE1BQy9EO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBTUEsV0FBUyxZQUFZLE1BQThCLE1BQWlCO0FBQ2xFLFVBQU0sVUFBVSx1QkFBdUIsSUFBSTtBQUMzQyxRQUFJLENBQUMsUUFBUztBQUNkLFFBQUksUUFBUSxZQUFZLE1BQU07QUFDNUIsV0FBSyxlQUFlLFdBQVcsUUFBUSxPQUFPO0FBQzlDO0FBQUEsSUFDRjtBQUNBLFNBQUssc0JBQXNCLFdBQVcsUUFBUSxPQUFPO0FBQ3JELFNBQUssdUJBQXVCLFdBQVcsUUFBUSxRQUFRO0FBQ3ZELFNBQUsseUJBQXlCLFdBQVcsUUFBUSxVQUFVO0FBQzNELFNBQUssMEJBQTBCLFdBQVcsUUFBUSxXQUFXO0FBQUEsRUFDL0Q7QUFPQSxXQUFTLGFBQWEsTUFBOEIsTUFBaUI7QUFDbkUsVUFBTSxRQUFRLG1CQUFtQixJQUFJO0FBQ3JDLFVBQU0sU0FBUyxvQkFBb0IsSUFBSTtBQUN2QyxVQUFNLFFBQVEsbUJBQW1CLElBQUk7QUFDckMsUUFBSSxDQUFDLE1BQU87QUFFWixRQUFJLE9BQU8sWUFBWSxNQUFNO0FBQzNCLFdBQUssY0FBYyxXQUFXLE9BQU8sT0FBTztBQUM1QyxXQUFLLGNBQWM7QUFDbkIsV0FBSyxjQUFjO0FBQ25CO0FBQUEsSUFDRjtBQUNBLFFBQUksT0FBTyxPQUFPLE9BQU8sU0FBUyxPQUFPLFVBQVUsT0FBTyxNQUFNO0FBQzlELFVBQUksT0FBTyxJQUFLLE1BQUssaUJBQWlCLFdBQVcsT0FBTyxHQUFHO0FBQzNELFVBQUksT0FBTyxNQUFPLE1BQUssbUJBQW1CLFdBQVcsT0FBTyxLQUFLO0FBQ2pFLFVBQUksT0FBTyxPQUFRLE1BQUssb0JBQW9CLFdBQVcsT0FBTyxNQUFNO0FBQ3BFLFVBQUksT0FBTyxLQUFNLE1BQUssa0JBQWtCLFdBQVcsT0FBTyxJQUFJO0FBQzlELFdBQUssY0FBYztBQUNuQixXQUFLLGNBQWM7QUFBQSxJQUNyQjtBQUFBLEVBQ0Y7QUFXQSxXQUFTLHNCQUFzQixNQUEwQjtBQUN2RCxRQUFJLENBQUMsS0FBSyxTQUFTLENBQUMsTUFBTSxRQUFRLEtBQUssS0FBSyxFQUFHLFFBQU87QUFDdEQsVUFBTSxVQUFVLEtBQUssTUFBTSxLQUFLLENBQUMsTUFBYSxFQUFFLFNBQVMsV0FBVyxFQUFFLFlBQVksS0FBSztBQUN2RixRQUFJLENBQUMsUUFBUyxRQUFPO0FBQ3JCLFVBQU0sSUFBSyxRQUFnQjtBQUMzQixRQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sUUFBUSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUcsUUFBTztBQUdwRCxVQUFNLEtBQUssRUFBRSxDQUFDLEtBQUssT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUk7QUFDM0QsVUFBTSxLQUFLLEVBQUUsQ0FBQyxLQUFLLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJO0FBRTNELFFBQUksS0FBSyxJQUFJLEtBQUssR0FBRyxJQUFJLFFBQVEsS0FBSyxJQUFJLEtBQUssR0FBRyxJQUFJLEtBQU0sUUFBTztBQUNuRSxVQUFNLE9BQU8sS0FBSyxNQUFNLEtBQUssR0FBRztBQUNoQyxVQUFNLE9BQU8sS0FBSyxNQUFNLEtBQUssR0FBRztBQUNoQyxXQUFPLEdBQUcsSUFBSSxLQUFLLElBQUk7QUFBQSxFQUN6QjtBQU9BLFdBQVMsaUJBQWlCLE1BQXlDO0FBQ2pFLFVBQU0sS0FBSyxLQUFLO0FBQ2hCLFFBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxRQUFRLEVBQUUsS0FBSyxHQUFHLFNBQVMsRUFBRyxRQUFPLEVBQUUsV0FBVyxLQUFLO0FBRXpFLFVBQU0sSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDO0FBQzNELFVBQU0sVUFBVSxLQUFLLE1BQU0sR0FBRyxDQUFDO0FBQy9CLFVBQU0sVUFBVSxLQUFLLE1BQU8sVUFBVSxNQUFPLEtBQUssRUFBRTtBQUNwRCxVQUFNLFNBQVMsS0FBSyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUM7QUFDdEMsVUFBTSxTQUFTLEtBQUssS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDO0FBRXRDLFVBQU0sUUFBa0IsQ0FBQztBQUN6QixRQUFJLEtBQUssSUFBSSxPQUFPLElBQUksSUFBSyxPQUFNLEtBQUssVUFBVSxPQUFPLE1BQU07QUFDL0QsUUFBSSxLQUFLLElBQUksU0FBUyxDQUFDLElBQUksS0FBTSxPQUFNLEtBQUssVUFBVSxLQUFLLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxHQUFHO0FBQ3ZGLFFBQUksS0FBSyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQU0sT0FBTSxLQUFLLFVBQVUsS0FBSyxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsR0FBRztBQUV2RixXQUFPLEVBQUUsV0FBVyxNQUFNLFNBQVMsSUFBSSxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUs7QUFBQSxFQUNoRTtBQU1BLFdBQVMsc0JBQXNCLE1BQW1DO0FBQ2hFLFVBQU0sTUFBOEIsQ0FBQztBQUNyQyxRQUFJLE9BQU8sS0FBSyxlQUFlLFVBQVU7QUFDdkMsVUFBSSxXQUFXLEtBQUs7QUFBQSxJQUN0QjtBQUNBLFFBQUksS0FBSyxhQUFhO0FBQ3BCLGNBQVEsS0FBSyxhQUFhO0FBQUEsUUFDeEIsS0FBSztBQUFXLGNBQUksWUFBWTtBQUFXO0FBQUEsUUFDM0MsS0FBSztBQUFPLGNBQUksWUFBWTtBQUFjO0FBQUEsUUFDMUMsS0FBSztBQUFVLGNBQUksWUFBWTtBQUFVO0FBQUEsUUFDekMsS0FBSztBQUFPLGNBQUksWUFBWTtBQUFZO0FBQUEsUUFDeEM7QUFBUztBQUFBLE1BQ1g7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFRQSxXQUFTLHNCQUFzQixNQUF5QztBQUN0RSxVQUFNLE1BQThCLENBQUM7QUFDckMsUUFBSSxDQUFDLEtBQUssdUJBQXVCLENBQUMsS0FBSyxVQUFVLEVBQUUsY0FBYyxLQUFLLFFBQVMsUUFBTztBQUV0RixVQUFNLFdBQVksS0FBSyxPQUFxQjtBQUM1QyxVQUFNLE1BQU0sU0FBUyxRQUFRLElBQUk7QUFDakMsVUFBTSxLQUFLLEtBQUs7QUFHaEIsUUFBSSxPQUFPLEtBQUssTUFBTSxTQUFTLFNBQVMsR0FBRztBQUN6QyxZQUFNLE9BQU8sU0FBUyxNQUFNLENBQUM7QUFDN0IsVUFBSSxLQUFLLHFCQUFxQjtBQUM1QixjQUFNLE1BQU0sS0FBSyxvQkFBb0IsS0FBSyxHQUFHLElBQUksR0FBRztBQUNwRCxZQUFJLE1BQU0sRUFBRyxLQUFJLGVBQWUsV0FBVyxLQUFLLE1BQU0sR0FBRyxDQUFDO0FBQUEsTUFDNUQ7QUFBQSxJQUNGO0FBR0EsUUFBSSxNQUFNLEdBQUc7QUFDWCxZQUFNLE9BQU8sU0FBUyxNQUFNLENBQUM7QUFDN0IsVUFBSSxLQUFLLHFCQUFxQjtBQUM1QixjQUFNLE1BQU0sR0FBRyxLQUFLLEtBQUssb0JBQW9CLElBQUksS0FBSyxvQkFBb0I7QUFDMUUsWUFBSSxNQUFNLEVBQUcsS0FBSSxZQUFZLFdBQVcsS0FBSyxNQUFNLEdBQUcsQ0FBQztBQUFBLE1BQ3pEO0FBQUEsSUFDRjtBQUdBLFVBQU0sV0FBWSxLQUFLLE9BQXFCO0FBQzVDLFFBQUksVUFBVTtBQUNaLFlBQU0sVUFBVSxHQUFHLElBQUksU0FBUztBQUNoQyxZQUFNLFdBQVksU0FBUyxJQUFJLFNBQVMsU0FBVSxHQUFHLElBQUksR0FBRztBQUU1RCxVQUFJLEtBQUssSUFBSSxVQUFVLFFBQVEsSUFBSSxLQUFLLFVBQVUsR0FBRztBQUNuRCxZQUFJLGFBQWEsV0FBVyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQUEsTUFDakQ7QUFDQSxVQUFJLEtBQUssSUFBSSxVQUFVLFFBQVEsSUFBSSxLQUFLLFdBQVcsR0FBRztBQUNwRCxZQUFJLGNBQWMsV0FBVyxLQUFLLE1BQU0sUUFBUSxDQUFDO0FBQUEsTUFDbkQ7QUFBQSxJQUNGO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFNQSxXQUFTLGVBQWUsTUFBMEI7QUFDaEQsVUFBTSxZQUFZLEtBQUs7QUFDdkIsUUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLFFBQVEsU0FBUyxFQUFHLFFBQU87QUFDcEQsZUFBVyxLQUFLLFdBQVc7QUFDekIsWUFBTSxVQUFVLEVBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBQ3ZELGlCQUFXLEtBQUssU0FBUztBQUN2QixZQUFJLEtBQUssRUFBRSxTQUFTLFNBQVMsRUFBRSxJQUFLLFFBQU8sRUFBRTtBQUFBLE1BQy9DO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBUUEsV0FBUyxtQkFBbUIsTUFBNEY7QUFDdEgsVUFBTSxNQUFNLENBQUMsTUFBcUQ7QUFDaEUsVUFBSSxNQUFNLE1BQU8sUUFBTztBQUN4QixVQUFJLE1BQU0sT0FBUSxRQUFPO0FBQ3pCLFVBQUksTUFBTSxRQUFTLFFBQU87QUFDMUIsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPO0FBQUEsTUFDTCxXQUFXLElBQUksS0FBSyxzQkFBc0I7QUFBQSxNQUMxQyxZQUFZLElBQUksS0FBSyxvQkFBb0I7QUFBQSxJQUMzQztBQUFBLEVBQ0Y7QUFRQSxXQUFTLHNCQUFzQixNQUEwQztBQUN2RSxVQUFNLEtBQUssS0FBSztBQUNoQixRQUFJLENBQUMsTUFBTSxPQUFPLE9BQU8sU0FBVSxRQUFPO0FBQzFDLFFBQUksQ0FBQyxNQUFNLGFBQWEsT0FBUSxNQUFNLFVBQWtCLG9CQUFvQixXQUFZLFFBQU87QUFFL0YsVUFBTSxNQUE4QixDQUFDO0FBRXJDLFVBQU0sVUFBVSxDQUFDLFVBQThCO0FBeFVqRDtBQXlVSSxVQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBSSxRQUFPO0FBQ2hDLFVBQUk7QUFDRixjQUFNLElBQUssTUFBTSxVQUFrQixnQkFBZ0IsTUFBTSxFQUFFO0FBQzNELFlBQUksQ0FBQyxFQUFHLFFBQU87QUFDZixZQUFJLFVBQVU7QUFDZCxZQUFJO0FBQ0YsZ0JBQU0sT0FBTyxpQkFBTSxXQUFrQiw4QkFBeEIsNEJBQW9ELEVBQUU7QUFDbkUscUJBQVUsMkJBQUssU0FBUTtBQUFBLFFBQ3pCLFNBQVE7QUFBQSxRQUFDO0FBQ1QsZUFBTyxPQUFPLG9CQUFvQixFQUFFLE1BQU0sT0FBTyxDQUFDO0FBQUEsTUFDcEQsU0FBUTtBQUNOLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUVBLFFBQUksTUFBTSxRQUFRLEdBQUcsS0FBSyxLQUFLLEdBQUcsTUFBTSxDQUFDLEdBQUc7QUFDMUMsWUFBTSxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsQ0FBQztBQUMvQixVQUFJLElBQUssS0FBSSxLQUFLLFNBQVMsU0FBUyxVQUFVLGlCQUFpQixJQUFJO0FBQUEsSUFDckU7QUFDQSxRQUFJLE1BQU0sUUFBUSxHQUFHLE9BQU8sS0FBSyxHQUFHLFFBQVEsQ0FBQyxHQUFHO0FBQzlDLFlBQU0sTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUM7QUFDakMsVUFBSSxJQUFLLEtBQUksY0FBYztBQUFBLElBQzdCO0FBQ0EsVUFBTSxhQUFxQztBQUFBLE1BQ3pDLFlBQVk7QUFBQSxNQUFjLGVBQWU7QUFBQSxNQUN6QyxhQUFhO0FBQUEsTUFBZSxjQUFjO0FBQUEsTUFDMUMsYUFBYTtBQUFBLE1BQ2IsY0FBYztBQUFBLE1BQ2QsZUFBZTtBQUFBLE1BQXVCLGdCQUFnQjtBQUFBLE1BQ3RELGtCQUFrQjtBQUFBLE1BQTBCLG1CQUFtQjtBQUFBLE1BQy9ELGNBQWM7QUFBQSxNQUNkLFVBQVU7QUFBQSxNQUFZLFlBQVk7QUFBQSxNQUFjLGVBQWU7QUFBQSxJQUNqRTtBQUNBLGVBQVcsQ0FBQyxVQUFVLE1BQU0sS0FBSyxPQUFPLFFBQVEsVUFBVSxHQUFHO0FBQzNELFVBQUksR0FBRyxRQUFRLEdBQUc7QUFDaEIsY0FBTSxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUM7QUFDaEMsWUFBSSxJQUFLLEtBQUksTUFBTSxJQUFJO0FBQUEsTUFDekI7QUFBQSxJQUNGO0FBRUEsV0FBTyxPQUFPLEtBQUssR0FBRyxFQUFFLFNBQVMsSUFBSSxNQUFNO0FBQUEsRUFDN0M7QUFRQSxXQUFTLHlCQUF5QixNQUErQztBQTFYakY7QUEyWEUsUUFBSSxLQUFLLFNBQVMsV0FBWSxRQUFPO0FBQ3JDLFFBQUk7QUFDRixZQUFNLE9BQU87QUFDYixVQUFJLE9BQU8sS0FBSztBQUNoQixVQUFJO0FBQ0YsY0FBTSxPQUFPLEtBQUs7QUFDbEIsWUFBSSxNQUFNO0FBQ1IsbUJBQU8sVUFBSyxXQUFMLG1CQUFhLFVBQVMsa0JBQW1CLEtBQUssT0FBZSxPQUFPLEtBQUs7QUFBQSxRQUNsRjtBQUFBLE1BQ0YsU0FBUTtBQUFBLE1BQUM7QUFDVCxZQUFNLGFBQXdELENBQUM7QUFDL0QsWUFBTSxRQUFTLEtBQWE7QUFDNUIsVUFBSSxTQUFTLE9BQU8sVUFBVSxVQUFVO0FBQ3RDLG1CQUFXLENBQUMsS0FBSyxHQUFHLEtBQUssT0FBTyxRQUFRLEtBQUssR0FBRztBQUM5QyxnQkFBTSxJQUFLLDJCQUFhO0FBQ3hCLGNBQUksT0FBTyxNQUFNLFlBQVksT0FBTyxNQUFNLGFBQWEsT0FBTyxNQUFNLFVBQVU7QUFDNUUsdUJBQVcsR0FBRyxJQUFJO0FBQUEsVUFDcEI7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUNBLGFBQU8sRUFBRSxNQUFNLFdBQVc7QUFBQSxJQUM1QixTQUFRO0FBQ04sYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBT0EsV0FBUyxlQUFlLE1BQXlCO0FBQy9DLFFBQUk7QUFDRixVQUFJLEtBQUssU0FBUyxZQUFZO0FBQzVCLGNBQU0sT0FBUSxLQUFzQjtBQUNwQyxZQUFJLFFBQVEsS0FBSyxlQUFlLEtBQUssWUFBWSxLQUFLLEVBQUcsUUFBTyxLQUFLLFlBQVksS0FBSztBQUFBLE1BQ3hGO0FBQ0EsVUFBSSxLQUFLLFNBQVMsYUFBYTtBQUM3QixjQUFNLE9BQVEsS0FBdUI7QUFDckMsWUFBSSxRQUFRLEtBQUssS0FBSyxFQUFHLFFBQU8sS0FBSyxLQUFLO0FBQUEsTUFDNUM7QUFBQSxJQUNGLFNBQVE7QUFBQSxJQUFDO0FBQ1QsUUFBSSxDQUFDLEtBQUssUUFBUSxtQkFBbUIsS0FBSyxJQUFJLEVBQUcsUUFBTztBQUN4RCxXQUFPLEtBQUssS0FBSyxRQUFRLFNBQVMsR0FBRyxFQUFFLFFBQVEsUUFBUSxHQUFHLEVBQUUsS0FBSyxFQUFFLFFBQVEsU0FBUyxPQUFLLEVBQUUsWUFBWSxDQUFDO0FBQUEsRUFDMUc7QUFTQSxXQUFTLGtCQUFrQixNQUFtQjtBQUM1QyxRQUFJLENBQUMsS0FBSyxTQUFTLENBQUMsTUFBTSxRQUFRLEtBQUssS0FBSyxFQUFHLFFBQU87QUFDdEQsVUFBTSxVQUFVLEtBQUssTUFBTSxLQUFLLENBQUMsTUFBYSxFQUFFLFNBQVMsV0FBVyxFQUFFLFlBQVksS0FBSztBQUN2RixRQUFJLENBQUMsUUFBUyxRQUFPO0FBQ3JCLFlBQVEsUUFBUSxXQUFXO0FBQUEsTUFDekIsS0FBSztBQUFPLGVBQU87QUFBQSxNQUNuQixLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTDtBQUFTLGVBQU87QUFBQSxJQUNsQjtBQUFBLEVBQ0Y7QUFPQSxXQUFTLG1CQUFtQixNQUE4QixNQUF1QjtBQUMvRSxVQUFNLE1BQU0seUJBQXlCLElBQUk7QUFDekMsUUFBSSxJQUFLLE1BQUssb0JBQW9CO0FBRWxDLFVBQU0sT0FBTyxtQkFBbUIsSUFBSTtBQUNwQyxRQUFJLEtBQUssVUFBVyxNQUFLLFlBQVksS0FBSztBQUMxQyxRQUFJLEtBQUssV0FBWSxNQUFLLGFBQWEsS0FBSztBQUU1QyxVQUFNLE9BQU8sc0JBQXNCLElBQUk7QUFDdkMsUUFBSSxLQUFNLE1BQUssY0FBYztBQUFBLEVBQy9CO0FBT0EsV0FBUyxnQkFBZ0IsYUFBZ0U7QUFDdkYsVUFBTSxXQUFtRCxDQUFDO0FBQzFELFFBQUksWUFBWTtBQUNoQixRQUFJLGFBQWE7QUFFakIsYUFBUyxLQUFLLE1BQWlCLE9BQWU7QUF4ZGhEO0FBMGRJLFVBQUksS0FBSyxTQUFTLFFBQVE7QUFDeEIsY0FBTSxPQUFPLGtCQUFrQixJQUFJO0FBQ25DLGNBQU0sV0FBVyxLQUFLLGFBQWEsTUFBTSxRQUFTLEtBQUssV0FBc0I7QUFHN0UsWUFBSTtBQUNKLFlBQUksY0FBYyxLQUFLLFlBQVksSUFBSTtBQUNyQyxpQkFBTztBQUFBLFFBQ1QsV0FBVyxjQUFjLEtBQUssWUFBWSxJQUFJO0FBQzVDLGlCQUFPO0FBQUEsUUFDVCxXQUFXLEtBQUssS0FBSyxZQUFZLEVBQUUsU0FBUyxRQUFRLEtBQUssS0FBSyxLQUFLLFlBQVksRUFBRSxTQUFTLEtBQUssR0FBRztBQUNoRyxpQkFBTztBQUFBLFFBQ1QsV0FBVyxLQUFLLEtBQUssWUFBWSxFQUFFLFNBQVMsU0FBUyxLQUFLLFlBQVksSUFBSTtBQUN4RSxpQkFBTyxVQUFVLFlBQVksSUFBSSxNQUFNLFlBQVksRUFBRTtBQUFBLFFBQ3ZELE9BQU87QUFDTCxpQkFBTyxRQUFRLFNBQVM7QUFBQSxRQUMxQjtBQUdBLGNBQU0sWUFBWSxLQUFLLEtBQUssWUFBWSxFQUFFLFFBQVEsUUFBUSxHQUFHLEVBQUUsUUFBUSxlQUFlLEVBQUU7QUFDeEYsWUFBSSxhQUFhLENBQUMsb0NBQW9DLEtBQUssU0FBUyxHQUFHO0FBQ3JFLGlCQUFPO0FBQUEsUUFDVDtBQUdBLGFBQUssY0FBYyxLQUFLLGNBQWM7QUFHdEMsZUFBTyxPQUFPLE1BQU0sc0JBQXNCLElBQUksQ0FBQztBQUcvQyxlQUFPLE9BQU8sTUFBTSxzQkFBc0IsSUFBSSxDQUFDO0FBRy9DLGNBQU0sS0FBSyxpQkFBaUIsSUFBSTtBQUNoQyxZQUFJLEdBQUcsVUFBVyxNQUFLLFlBQVksR0FBRztBQUd0QyxjQUFNLE9BQU8sZUFBZSxJQUFJO0FBQ2hDLFlBQUksS0FBTSxNQUFLLFVBQVU7QUFHekIsWUFBSSxLQUFLLHlCQUF1QixVQUFLLFdBQUwsbUJBQWEsVUFBUyxTQUFTO0FBQzdELGdCQUFNLGVBQWUsVUFBSyxPQUFxQix3QkFBMUIsbUJBQStDO0FBQ3BFLGNBQUksZUFBZSxLQUFLLG9CQUFvQixRQUFRLGNBQWMsS0FBSztBQUNyRSxpQkFBSyxXQUFXLFdBQVcsS0FBSyxNQUFNLEtBQUssb0JBQW9CLEtBQUssQ0FBQztBQUFBLFVBQ3ZFO0FBQUEsUUFDRjtBQUdBLDJCQUFtQixNQUFNLElBQUk7QUFFN0IsaUJBQVMsSUFBSSxJQUFJO0FBQ2pCO0FBQUEsTUFDRjtBQUdBLFVBQUksYUFBYSxJQUFXLEtBQUssS0FBSyxxQkFBcUI7QUFDekQsY0FBTSxTQUFTLEtBQUs7QUFLcEIsY0FBTSxjQUFjLEtBQUssS0FBSyxZQUFZLEVBQUUsU0FBUyxZQUFZLEtBQUssS0FBSyxLQUFLLFlBQVksRUFBRSxTQUFTLElBQUk7QUFDM0csY0FBTSxnQkFBZ0IsWUFBWTtBQUNsQyxjQUFNLGVBQWUsaUJBQ25CLE9BQU8sU0FBUyxjQUFjLFFBQVEsT0FDdEMsT0FBTyxVQUFVLGNBQWMsU0FBUztBQUUxQyxjQUFNLG9CQUFvQixlQUFlO0FBRXpDLGNBQU0sT0FBTyxvQkFDVCxxQkFDQSxRQUFRLGFBQWEsSUFBSSxNQUFNLGFBQWEsRUFBRTtBQUVsRCxjQUFNLFlBQVksS0FBSyxLQUFLLFlBQVksRUFBRSxRQUFRLFFBQVEsR0FBRyxFQUFFLFFBQVEsZUFBZSxFQUFFO0FBQ3hGLGNBQU0sWUFBWSxhQUFhLENBQUMsK0JBQStCLEtBQUssU0FBUyxJQUFJLFlBQVk7QUFHN0YsY0FBTSxjQUFjLEtBQUs7QUFDekIsY0FBTSxjQUFjLGVBQWUsa0JBQWtCLGVBQWdCLFlBQW9CLGlCQUFpQjtBQUMxRyxjQUFNLFdBQVksWUFBWSxRQUFTLEtBQWEsV0FBVyxRQUFTO0FBRXhFLFlBQUksbUJBQWtDLGtCQUFrQixRQUFRLE9BQVEsS0FBYSxpQkFBaUIsV0FDbEcsV0FBWSxLQUFhLFlBQVksSUFDckM7QUFDSixZQUFJLENBQUMsb0JBQW9CLGVBQWUsa0JBQWtCLGVBQWUsT0FBUSxZQUFvQixpQkFBaUIsVUFBVTtBQUM5SCxnQkFBTSxlQUFnQixZQUFvQjtBQUMxQyxjQUFJLGVBQWUsR0FBRztBQUNwQixrQkFBTSxlQUFnQixZQUFvQjtBQUUxQyxnQkFBSSxnQkFBZ0IsS0FBSyxJQUFJLGFBQWEsUUFBUSxhQUFhLE1BQU0sSUFBSSxLQUFLLGdCQUFnQixhQUFhLFFBQVEsSUFBSSxHQUFHO0FBQ3hILGlDQUFtQjtBQUFBLFlBQ3JCLE9BQU87QUFDTCxpQ0FBbUIsV0FBVyxZQUFZO0FBQUEsWUFDNUM7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUVBLGNBQU0sYUFBYSxlQUFlLElBQVc7QUFDN0MsY0FBTSxvQkFBb0Isc0JBQXNCLElBQUk7QUFDcEQsY0FBTSxhQUFhLHVCQUF1QixJQUFXO0FBQ3JELGNBQU0sVUFBa0M7QUFBQSxVQUN0QyxPQUFPLG9CQUFvQixTQUFTLFdBQVcsS0FBSyxNQUFNLE9BQU8sS0FBSyxDQUFDO0FBQUEsVUFDdkUsUUFBUSxvQkFBb0IsU0FBUztBQUFBLFVBQ3JDLGFBQWEsb0JBQW9CLE9BQU8sbUJBQW1CLE9BQU8sT0FBTyxPQUFPLE1BQU07QUFBQSxVQUN0RixXQUFXLGtCQUFrQixJQUFXO0FBQUEsVUFDeEMsZ0JBQWdCO0FBQUEsVUFDaEIsVUFBVyxlQUFlLG1CQUFvQixXQUFXO0FBQUEsVUFDekQsU0FBUyxZQUFZO0FBQUEsVUFDckIsV0FBVyxXQUFXO0FBQUEsVUFDdEIsUUFBUSxXQUFXO0FBQUE7QUFBQSxVQUVuQixVQUFVLG9CQUFvQixhQUFhO0FBQUEsVUFDM0MsS0FBSyxvQkFBb0IsUUFBUTtBQUFBLFVBQ2pDLE1BQU0sb0JBQW9CLFFBQVE7QUFBQSxVQUNsQyxRQUFRLG9CQUFvQixJQUFJO0FBQUEsUUFDbEM7QUFDQSxjQUFNLFNBQVMsZUFBZSxJQUFJO0FBQ2xDLFlBQUksT0FBUSxTQUFRLE1BQU07QUFDMUIsMkJBQW1CLFNBQVMsSUFBSTtBQUVoQyxZQUFJLFlBQVk7QUFDZCxjQUFJLFdBQVcsWUFBWSxNQUFNO0FBQy9CLG9CQUFRLGVBQWUsV0FBVyxXQUFXLE9BQU87QUFBQSxVQUN0RCxPQUFPO0FBQ0wsb0JBQVEsc0JBQXNCLFdBQVcsV0FBVyxPQUFPO0FBQzNELG9CQUFRLHVCQUF1QixXQUFXLFdBQVcsUUFBUTtBQUM3RCxvQkFBUSx5QkFBeUIsV0FBVyxXQUFXLFVBQVU7QUFDakUsb0JBQVEsMEJBQTBCLFdBQVcsV0FBVyxXQUFXO0FBQUEsVUFDckU7QUFBQSxRQUNGLFdBQVcsa0JBQWtCO0FBQzNCLGtCQUFRLGVBQWU7QUFBQSxRQUN6QjtBQUVBLGVBQU8sT0FBTyxTQUFTLHNCQUFzQixJQUFJLENBQUM7QUFDbEQsaUJBQVMsU0FBUyxJQUFJO0FBQ3RCO0FBQUEsTUFDRjtBQUdBLFdBQUssS0FBSyxTQUFTLFdBQVcsS0FBSyxTQUFTLGNBQWMsS0FBSyxTQUFTLGdCQUNwRSxLQUFLLEtBQUssWUFBWSxFQUFFLFNBQVMsUUFBUSxLQUFLLEtBQUssS0FBSyxZQUFZLEVBQUUsU0FBUyxLQUFLLEtBQUssS0FBSyxLQUFLLFlBQVksRUFBRSxTQUFTLEtBQUssR0FBRztBQUNwSSxjQUFNLFFBQVE7QUFDZCxjQUFNLEtBQUssdUJBQXVCLEtBQUs7QUFDdkMsY0FBTSxTQUFTLE1BQU07QUFFckIsWUFBSSxNQUFNLFFBQVE7QUFDaEIsZ0JBQU0sZUFBdUM7QUFBQSxZQUMzQyxpQkFBaUI7QUFBQSxVQUNuQjtBQUVBLGNBQUksTUFBTSxjQUFjLE1BQU0sZUFBZSxRQUFRO0FBQ25ELHlCQUFhLGFBQWEsV0FBVyxNQUFNLFVBQVU7QUFDckQseUJBQWEsZ0JBQWdCLFdBQVcsTUFBTSxhQUFhO0FBQzNELHlCQUFhLGNBQWMsV0FBVyxNQUFNLFdBQVc7QUFDdkQseUJBQWEsZUFBZSxXQUFXLE1BQU0sWUFBWTtBQUFBLFVBQzNEO0FBRUEsc0JBQVksY0FBYyxLQUFLO0FBQy9CLHVCQUFhLGNBQWMsS0FBSztBQUNoQyxnQkFBTSxhQUFhLGVBQWUsS0FBWTtBQUM5QyxjQUFJLFdBQVcsVUFBVyxjQUFhLFlBQVksV0FBVztBQUM5RCxjQUFJLFdBQVcsT0FBUSxjQUFhLFNBQVMsV0FBVztBQUV4RCxnQkFBTSxLQUFLLGlCQUFpQixLQUFZO0FBQ3hDLGNBQUksR0FBRyxVQUFXLGNBQWEsWUFBWSxHQUFHO0FBRzlDLGdCQUFNLE9BQU8sZUFBZSxLQUFLO0FBQ2pDLGNBQUksS0FBTSxjQUFhLFVBQVU7QUFHakMsZ0JBQU0sWUFBWSxrQkFBa0IsS0FBSztBQUN6QyxjQUFJLFdBQVc7QUFDYixrQkFBTSxPQUFPLGtCQUFrQixTQUFTO0FBQ3hDLG1CQUFPLE9BQU8sY0FBYyxJQUFJO0FBQ2hDLHlCQUFhLGNBQWMsVUFBVSxjQUFjO0FBQUEsVUFDckQ7QUFFQSxpQkFBTyxPQUFPLGNBQWMsc0JBQXNCLEtBQVksQ0FBQztBQUcvRCw2QkFBbUIsY0FBYyxLQUFLO0FBRXRDLGdCQUFNLFlBQVksS0FBSyxLQUFLLFlBQVksRUFBRSxRQUFRLFFBQVEsR0FBRyxFQUFFLFFBQVEsZUFBZSxFQUFFO0FBQ3hGLG1CQUFTLGFBQWEsUUFBUSxJQUFJO0FBQUEsUUFDcEM7QUFDQTtBQUFBLE1BQ0Y7QUFHQSxXQUFLLEtBQUssU0FBUyxXQUFXLEtBQUssU0FBUyxjQUFjLEtBQUssU0FBUyxnQkFDcEUsdURBQXVELEtBQUssS0FBSyxJQUFJLEdBQUc7QUFDMUUsY0FBTSxRQUFRO0FBQ2QsY0FBTSxjQUFzQztBQUFBLFVBQzFDLGlCQUFpQix1QkFBdUIsS0FBSztBQUFBLFFBQy9DO0FBQ0EsWUFBSSxNQUFNLGNBQWMsTUFBTSxlQUFlLFFBQVE7QUFDbkQsc0JBQVksYUFBYSxXQUFXLE1BQU0sVUFBVTtBQUNwRCxzQkFBWSxnQkFBZ0IsV0FBVyxNQUFNLGFBQWE7QUFDMUQsc0JBQVksY0FBYyxXQUFXLE1BQU0sV0FBVztBQUN0RCxzQkFBWSxlQUFlLFdBQVcsTUFBTSxZQUFZO0FBQUEsUUFDMUQ7QUFDQSxvQkFBWSxhQUFhLEtBQUs7QUFDOUIscUJBQWEsYUFBYSxLQUFLO0FBQy9CLGNBQU0sa0JBQWtCLGtCQUFrQixLQUFLO0FBQy9DLFlBQUksaUJBQWlCO0FBQ25CLHNCQUFZLGNBQWMsZ0JBQWdCLGNBQWM7QUFDeEQsZ0JBQU0sa0JBQWtCLGtCQUFrQixlQUFlO0FBQ3pELHNCQUFZLG9CQUFvQjtBQUFBLFlBQzlCLE9BQU8sZ0JBQWdCLFNBQVM7QUFBQSxZQUNoQyxVQUFVLGdCQUFnQixZQUFZO0FBQUEsVUFDeEM7QUFBQSxRQUNGO0FBQ0EsMkJBQW1CLGFBQWEsS0FBSztBQUVyQyxjQUFNLFlBQVksS0FBSyxLQUFLLFlBQVksRUFBRSxRQUFRLFFBQVEsR0FBRyxFQUFFLFFBQVEsZUFBZSxFQUFFLEtBQUs7QUFDN0YsaUJBQVMsU0FBUyxJQUFJO0FBQ3RCO0FBQUEsTUFDRjtBQUdBLFVBQUksY0FBYyxRQUFRLFFBQVEsR0FBRztBQUNuQyxtQkFBVyxTQUFVLEtBQW1CLFVBQVU7QUFDaEQsY0FBSSxNQUFNLFlBQVksT0FBTztBQUMzQixpQkFBSyxPQUFPLFFBQVEsQ0FBQztBQUFBLFVBQ3ZCO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsU0FBSyxhQUFhLENBQUM7QUFDbkIsV0FBTztBQUFBLEVBQ1Q7QUFLQSxXQUFTLGtCQUFrQixNQUFrQztBQUMzRCxRQUFJLEtBQUssU0FBUyxPQUFRLFFBQU87QUFDakMsUUFBSSxjQUFjLE1BQU07QUFDdEIsaUJBQVcsU0FBVSxLQUFtQixVQUFVO0FBQ2hELGNBQU0sUUFBUSxrQkFBa0IsS0FBSztBQUNyQyxZQUFJLE1BQU8sUUFBTztBQUFBLE1BQ3BCO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBT0EsV0FBUyxjQUFjLGFBQXdCLFVBQStEO0FBQzVHLFVBQU0sU0FBc0IsQ0FBQztBQUM3QixVQUFNLGdCQUFnQixZQUFZO0FBQ2xDLFFBQUksQ0FBQyxjQUFlLFFBQU87QUFFM0IsUUFBSSxhQUFhO0FBRWpCLGFBQVMsS0FBSyxNQUFpQixPQUFlO0FBQzVDLFVBQUksQ0FBQyxLQUFLLHVCQUF1QixRQUFRLEVBQUc7QUFFNUMsWUFBTSxTQUFTLEtBQUs7QUFDcEIsWUFBTSxZQUFZO0FBQUEsUUFDaEIsR0FBRyxLQUFLLE1BQU0sT0FBTyxJQUFJLGNBQWUsQ0FBQztBQUFBLFFBQ3pDLEdBQUcsS0FBSyxNQUFNLE9BQU8sSUFBSSxjQUFlLENBQUM7QUFBQSxRQUN6QyxPQUFPLEtBQUssTUFBTSxPQUFPLEtBQUs7QUFBQSxRQUM5QixRQUFRLEtBQUssTUFBTSxPQUFPLE1BQU07QUFBQSxNQUNsQztBQUVBLFVBQUksT0FBaUM7QUFDckMsVUFBSSxPQUFPO0FBRVgsVUFBSSxLQUFLLFNBQVMsUUFBUTtBQUN4QixlQUFPO0FBQ1AsY0FBTSxZQUFZLEtBQUssS0FBSyxZQUFZLEVBQUUsUUFBUSxRQUFRLEdBQUcsRUFBRSxRQUFRLGVBQWUsRUFBRTtBQUN4RixlQUFPLGFBQWEsQ0FBQyxZQUFZLEtBQUssU0FBUyxJQUFJLFlBQVksUUFBUSxVQUFVO0FBQUEsTUFDbkYsV0FBVyxhQUFhLElBQVcsR0FBRztBQUNwQyxjQUFNLGNBQWMsS0FBSyxLQUFLLFlBQVksRUFBRSxTQUFTLFlBQVksS0FBSyxLQUFLLEtBQUssWUFBWSxFQUFFLFNBQVMsSUFBSTtBQUMzRyxjQUFNLGVBQWUsT0FBTyxTQUFTLGNBQWUsUUFBUSxPQUFPLE9BQU8sVUFBVSxjQUFlLFNBQVM7QUFDNUcsZUFBUSxlQUFlLGVBQWdCLHFCQUFxQjtBQUM1RCxjQUFNLFlBQVksS0FBSyxLQUFLLFlBQVksRUFBRSxRQUFRLFFBQVEsR0FBRyxFQUFFLFFBQVEsZUFBZSxFQUFFO0FBQ3hGLGVBQU8sYUFBYSxDQUFDLCtCQUErQixLQUFLLFNBQVMsSUFBSSxZQUFhLFNBQVMscUJBQXFCLHFCQUFxQixTQUFTLFVBQVU7QUFBQSxNQUMzSixZQUNHLEtBQUssS0FBSyxZQUFZLEVBQUUsU0FBUyxRQUFRLEtBQUssS0FBSyxLQUFLLFlBQVksRUFBRSxTQUFTLEtBQUssS0FBSyxLQUFLLEtBQUssWUFBWSxFQUFFLFNBQVMsS0FBSyxPQUMvSCxLQUFLLFNBQVMsV0FBVyxLQUFLLFNBQVMsY0FBYyxLQUFLLFNBQVMsY0FDcEU7QUFDQSxlQUFPO0FBQ1AsZUFBTyxLQUFLLEtBQUssWUFBWSxFQUFFLFFBQVEsUUFBUSxHQUFHLEVBQUUsUUFBUSxlQUFlLEVBQUUsS0FBSztBQUFBLE1BQ3BGO0FBRUEsVUFBSSxNQUFNO0FBQ1IsZUFBTyxLQUFLO0FBQUEsVUFDVjtBQUFBLFVBQ0E7QUFBQSxVQUNBLE1BQU0sS0FBSztBQUFBLFVBQ1gsUUFBUTtBQUFBLFVBQ1IsUUFBUTtBQUFBLFVBQ1IsVUFBVSxDQUFDO0FBQUE7QUFBQSxRQUNiLENBQUM7QUFDRDtBQUFBLE1BQ0Y7QUFHQSxVQUFJLFNBQVMsWUFBWSxjQUFjLFFBQVEsUUFBUSxHQUFHO0FBQ3hELG1CQUFXLFNBQVUsS0FBbUIsVUFBVTtBQUNoRCxjQUFJLE1BQU0sWUFBWSxPQUFPO0FBQzNCLGlCQUFLLE9BQU8sUUFBUSxDQUFDO0FBQUEsVUFDdkI7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxRQUFJLGNBQWMsYUFBYTtBQUM3QixpQkFBVyxTQUFVLFlBQTBCLFVBQVU7QUFDdkQsWUFBSSxNQUFNLFlBQVksT0FBTztBQUMzQixlQUFLLE9BQU8sQ0FBQztBQUFBLFFBQ2Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFdBQU87QUFBQSxFQUNUO0FBTUEsV0FBUyxrQkFBa0IsUUFBc0M7QUFDL0QsVUFBTSxjQUErQjtBQUFBLE1BQ25DLGtCQUFrQjtBQUFBLE1BQ2xCLG9CQUFvQjtBQUFBLE1BQ3BCLGlCQUFpQixDQUFDO0FBQUEsTUFDbEIsZUFBZSxPQUFPLElBQUksT0FBSyxFQUFFLElBQUk7QUFBQSxJQUN2QztBQUVBLFVBQU0sZ0JBQWdCLE9BQU8sT0FBTyxPQUFLLEVBQUUsU0FBUyxrQkFBa0I7QUFDdEUsVUFBTSxjQUFjLE9BQU8sT0FBTyxPQUFLLEVBQUUsU0FBUyxXQUFXLEVBQUUsU0FBUyxrQkFBa0I7QUFDMUYsVUFBTSxhQUFhLE9BQU8sT0FBTyxPQUFLLEVBQUUsU0FBUyxNQUFNO0FBQ3ZELFVBQU0sZUFBZSxPQUFPLE9BQU8sT0FBSyxFQUFFLFNBQVMsUUFBUTtBQUUzRCxRQUFJLGNBQWMsU0FBUyxHQUFHO0FBQzVCLGtCQUFZLHFCQUFxQjtBQUFBLElBQ25DO0FBR0EsZUFBVyxhQUFhLENBQUMsR0FBRyxZQUFZLEdBQUcsWUFBWSxHQUFHO0FBQ3hELGlCQUFXLFlBQVksYUFBYTtBQUNsQyxjQUFNLEtBQUssVUFBVTtBQUNyQixjQUFNLEtBQUssU0FBUztBQUdwQixjQUFNLHVCQUF1QixHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsU0FBUyxHQUFHLElBQUksR0FBRyxRQUFRLEdBQUc7QUFDNUUsY0FBTSxxQkFBcUIsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLFVBQVUsR0FBRyxJQUFJLEdBQUcsU0FBUyxHQUFHO0FBRTVFLFlBQUksd0JBQXdCLG9CQUFvQjtBQUU5QyxvQkFBVSxTQUFTLEtBQUssU0FBUyxJQUFJO0FBQ3JDLG1CQUFTLFNBQVMsS0FBSyxVQUFVLElBQUk7QUFFckMsY0FBSSxDQUFDLFlBQVksa0JBQWtCO0FBQ2pDLHdCQUFZLG1CQUFtQjtBQUFBLFVBQ2pDO0FBR0EsY0FBSSxVQUFVLFNBQVMsU0FBUyxRQUFRO0FBQ3RDLGdCQUFJLENBQUMsWUFBWSxnQkFBZ0IsU0FBUyxVQUFVLElBQUksR0FBRztBQUN6RCwwQkFBWSxnQkFBZ0IsS0FBSyxVQUFVLElBQUk7QUFBQSxZQUNqRDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFHQSxRQUFJLFlBQVksb0JBQW9CO0FBQ2xDLGlCQUFXLFNBQVMsUUFBUTtBQUMxQixZQUFJLE1BQU0sU0FBUyxzQkFBc0IsQ0FBQyxZQUFZLGdCQUFnQixTQUFTLE1BQU0sSUFBSSxHQUFHO0FBQzFGLHNCQUFZLGdCQUFnQixLQUFLLE1BQU0sSUFBSTtBQUFBLFFBQzdDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQU9BLFdBQVMsa0JBQWtCLGFBQXNFO0FBQy9GLFVBQU0sZUFBZSxDQUFDLFFBQVEsU0FBUyxTQUFTLFdBQVcsYUFBYSxjQUFjLFVBQVUsV0FBVyxXQUFXLFNBQVM7QUFDL0gsVUFBTSxnQkFBZ0IsQ0FBQyxTQUFTLFNBQVMsY0FBYyxhQUFhLGNBQWMsU0FBUyxTQUFTLFFBQVEsV0FBVyxVQUFVO0FBQ2pJLFVBQU0saUJBQWlCLENBQUMsVUFBVSxRQUFRLFVBQVUsT0FBTyxLQUFLO0FBRWhFLFVBQU0sY0FBYyxZQUFZLEtBQUssWUFBWTtBQUNqRCxVQUFNLGdCQUFnQixhQUFhLEtBQUssUUFBTSxZQUFZLFNBQVMsRUFBRSxDQUFDO0FBRXRFLFFBQUksYUFBYTtBQUNqQixRQUFJLGtCQUFrQjtBQUN0QixVQUFNLFNBQTBCLENBQUM7QUFDakMsVUFBTSxZQUF5RCxDQUFDO0FBQ2hFLFVBQU0sYUFBNEQsQ0FBQztBQUVuRSxhQUFTLEtBQUssTUFBaUI7QUFDN0IsWUFBTSxPQUFPLEtBQUssS0FBSyxZQUFZO0FBR25DLFdBQUssS0FBSyxTQUFTLFdBQVcsS0FBSyxTQUFTLGNBQWMsS0FBSyxTQUFTLGVBQWUsS0FBSyxTQUFTLGdCQUFnQixLQUFLLHFCQUFxQjtBQUM3SSxjQUFNLElBQUksS0FBSztBQUNmLGNBQU0sZUFBZSxFQUFFLFVBQVUsTUFBTSxFQUFFLFVBQVUsTUFBTSxFQUFFLFFBQVEsRUFBRSxTQUFTO0FBQzlFLGNBQU0sZUFBZSxjQUFjLEtBQUssUUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO0FBRS9ELFlBQUksaUJBQWlCLGdCQUFnQixnQkFBZ0I7QUFDbkQ7QUFDQSxxQkFBVyxLQUFLLEVBQUUsTUFBTSxLQUFLLE1BQU0sR0FBRyxFQUFFLEdBQUcsUUFBUSxFQUFFLE9BQU8sQ0FBQztBQUc3RCxjQUFJLFlBQW1DO0FBQ3ZDLGNBQUksS0FBSyxTQUFTLE9BQU8sRUFBRyxhQUFZO0FBQUEsbUJBQy9CLEtBQUssU0FBUyxPQUFPLEtBQUssS0FBSyxTQUFTLEtBQUssRUFBRyxhQUFZO0FBQUEsbUJBQzVELEtBQUssU0FBUyxVQUFVLEtBQUssS0FBSyxTQUFTLFNBQVMsS0FBTSxFQUFFLFNBQVMsR0FBSyxhQUFZO0FBQUEsbUJBQ3RGLEtBQUssU0FBUyxRQUFRLEtBQUssS0FBSyxTQUFTLFVBQVUsRUFBRyxhQUFZO0FBQUEsbUJBQ2xFLEtBQUssU0FBUyxVQUFVLEtBQUssS0FBSyxTQUFTLE9BQU8sRUFBRyxhQUFZO0FBQUEsbUJBQ2pFLEtBQUssU0FBUyxPQUFPLEVBQUcsYUFBWTtBQUU3QyxpQkFBTyxLQUFLO0FBQUEsWUFDVixPQUFPLEtBQUssS0FBSyxRQUFRLFNBQVMsR0FBRyxFQUFFLFFBQVEsU0FBUyxPQUFLLEVBQUUsWUFBWSxDQUFDO0FBQUEsWUFDNUUsTUFBTTtBQUFBLFlBQ04sVUFBVSxLQUFLLFNBQVMsVUFBVSxLQUFLLEtBQUssU0FBUyxHQUFHO0FBQUEsVUFDMUQsQ0FBQztBQUFBLFFBQ0g7QUFHQSxZQUFJLGVBQWUsS0FBSyxRQUFNLEtBQUssU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLFVBQVUsTUFBTSxFQUFFLFVBQVUsSUFBSTtBQUNwRiw0QkFBa0I7QUFDbEIsY0FBSSxDQUFDLE9BQU8sS0FBSyxPQUFLLEVBQUUsU0FBUyxRQUFRLEdBQUc7QUFDMUMsbUJBQU8sS0FBSyxFQUFFLE9BQU8sVUFBVSxNQUFNLFVBQVUsVUFBVSxNQUFNLENBQUM7QUFBQSxVQUNsRTtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBR0EsVUFBSSxLQUFLLFNBQVMsVUFBVSxLQUFLLHFCQUFxQjtBQUNwRCxrQkFBVSxLQUFLO0FBQUEsVUFDYixNQUFNLEtBQUs7QUFBQSxVQUNYLE1BQU0sS0FBSyxjQUFjO0FBQUEsVUFDekIsR0FBRyxLQUFLLG9CQUFvQjtBQUFBLFFBQzlCLENBQUM7QUFBQSxNQUNIO0FBRUEsVUFBSSxjQUFjLE1BQU07QUFDdEIsbUJBQVcsU0FBVSxLQUFtQixVQUFVO0FBQ2hELGNBQUksTUFBTSxZQUFZLE1BQU8sTUFBSyxLQUFLO0FBQUEsUUFDekM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFNBQUssV0FBVztBQUdoQixlQUFXLFNBQVMsUUFBUTtBQUMxQixZQUFNLGFBQWEsV0FBVyxLQUFLLFNBQU8sSUFBSSxLQUFLLFlBQVksRUFBRSxTQUFTLE1BQU0sTUFBTSxZQUFZLEVBQUUsUUFBUSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZILFVBQUksWUFBWTtBQUNkLGNBQU0sYUFBYSxVQUFVLEtBQUssT0FBSyxFQUFFLElBQUksV0FBVyxLQUFNLFdBQVcsSUFBSSxFQUFFLElBQUssRUFBRTtBQUN0RixZQUFJLFlBQVk7QUFDZCxnQkFBTSxRQUFRLFdBQVcsS0FBSyxRQUFRLEtBQUssRUFBRSxFQUFFLEtBQUs7QUFDcEQsY0FBSSxXQUFXLEtBQUssU0FBUyxHQUFHLEVBQUcsT0FBTSxXQUFXO0FBQUEsUUFDdEQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFVBQU0sU0FBVSxjQUFjLEtBQUssbUJBQXFCLGlCQUFpQixjQUFjO0FBRXZGLFdBQU8sRUFBRSxRQUFRLFFBQVEsU0FBUyxTQUFTLENBQUMsRUFBRTtBQUFBLEVBQ2hEO0FBYUEsV0FBUywwQkFBMEIsYUFBNEM7QUFDN0UsVUFBTSxnQkFBZ0IsWUFBWTtBQUNsQyxRQUFJLENBQUMsY0FBZSxRQUFPLENBQUM7QUFHNUIsVUFBTSxZQUF1QixDQUFDO0FBRTlCLGFBQVMsS0FBSyxNQUFpQixPQUFlO0FBQzVDLFVBQUksS0FBSyxZQUFZLE1BQU87QUFDNUIsVUFBSSxRQUFRLEVBQUc7QUFFZixVQUFJLEtBQUssU0FBUyxRQUFRO0FBQ3hCLGNBQU0sSUFBSTtBQUNWLGNBQU0sUUFBUSxFQUFFLGNBQWM7QUFDOUIsWUFBSSxDQUFDLE1BQU0sS0FBSyxFQUFHO0FBQ25CLGNBQU0sS0FBSyxFQUFFO0FBQ2IsWUFBSSxDQUFDLEdBQUk7QUFDVCxjQUFNLEtBQUssRUFBRSxhQUFhLE1BQU0sUUFBUyxFQUFFLFdBQXNCO0FBQ2pFLGtCQUFVLEtBQUs7QUFBQSxVQUNiLE1BQU07QUFBQSxVQUNOLE1BQU0sR0FBRyxJQUFJLGNBQWU7QUFBQSxVQUM1QixNQUFNLEdBQUcsSUFBSSxjQUFlO0FBQUEsVUFDNUIsVUFBVTtBQUFBLFFBQ1osQ0FBQztBQUNEO0FBQUEsTUFDRjtBQUVBLFVBQUksY0FBYyxNQUFNO0FBQ3RCLG1CQUFXLFNBQVUsS0FBbUIsVUFBVTtBQUNoRCxlQUFLLE9BQU8sUUFBUSxDQUFDO0FBQUEsUUFDdkI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFFBQUksY0FBYyxhQUFhO0FBQzdCLGlCQUFXLFNBQVUsWUFBMEIsVUFBVTtBQUN2RCxhQUFLLE9BQU8sQ0FBQztBQUFBLE1BQ2Y7QUFBQSxJQUNGO0FBR0EsY0FBVSxLQUFLLENBQUMsR0FBRyxNQUFNO0FBQ3ZCLFVBQUksS0FBSyxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksSUFBSSxHQUFJLFFBQU8sRUFBRSxPQUFPLEVBQUU7QUFDdEQsYUFBTyxFQUFFLE9BQU8sRUFBRTtBQUFBLElBQ3BCLENBQUM7QUFJRCxRQUFJLGtCQUFrQjtBQUN0QixRQUFJLHFCQUFxQjtBQUV6QixXQUFPLFVBQVUsSUFBSSxDQUFDLE1BQU0sUUFBUTtBQUNsQyxZQUFNLE9BQU8sS0FBSyxLQUFLLGNBQWM7QUFDckMsWUFBTSxZQUFZLEtBQUssS0FBSyxLQUFLLFlBQVksRUFBRSxRQUFRLFFBQVEsR0FBRyxFQUFFLFFBQVEsZUFBZSxFQUFFO0FBQzdGLFlBQU0sV0FBVyxhQUFhO0FBRTlCLFVBQUk7QUFDSixVQUFJLFNBQVMsU0FBUyxRQUFRLEtBQUssU0FBUyxTQUFTLEtBQUssS0FBSyxTQUFTLFNBQVMsS0FBSyxHQUFHO0FBQ3ZGLGVBQU87QUFBQSxNQUNULFdBQVcsQ0FBQyxtQkFBbUIsS0FBSyxZQUFZLElBQUk7QUFDbEQsZUFBTztBQUNQLDBCQUFrQjtBQUFBLE1BQ3BCLFdBQVcsQ0FBQyxzQkFBc0IsS0FBSyxZQUFZLE1BQU0sS0FBSyxXQUFXLElBQUk7QUFDM0UsZUFBTztBQUNQLDZCQUFxQjtBQUFBLE1BQ3ZCLFdBQVcsS0FBSyxZQUFZLE9BQU8sU0FBUyxTQUFTLFNBQVMsS0FBSyxTQUFTLFNBQVMsU0FBUyxLQUFLLFNBQVMsU0FBUyxLQUFLLElBQUk7QUFDNUgsZUFBTztBQUFBLE1BQ1QsV0FBVyxLQUFLLFNBQVMsTUFBTSxLQUFLLFlBQVksSUFBSTtBQUVsRCxlQUFPO0FBQUEsTUFDVCxPQUFPO0FBQ0wsZUFBTyxRQUFRLEdBQUc7QUFBQSxNQUNwQjtBQUVBLFlBQU0sS0FBSyxLQUFLLEtBQUs7QUFDckIsYUFBTztBQUFBLFFBQ0wsT0FBTztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFDQSxXQUFXLEtBQUssS0FBSztBQUFBLFFBQ3JCLFVBQVUsS0FBSyxNQUFNLEtBQUssUUFBUTtBQUFBLFFBQ2xDLFFBQVE7QUFBQSxVQUNOLEdBQUcsS0FBSyxNQUFNLEtBQUssSUFBSTtBQUFBLFVBQ3ZCLEdBQUcsS0FBSyxNQUFNLEtBQUssSUFBSTtBQUFBLFVBQ3ZCLE9BQU8sS0FBSyxNQUFNLEdBQUcsS0FBSztBQUFBLFVBQzFCLFFBQVEsS0FBSyxNQUFNLEdBQUcsTUFBTTtBQUFBLFFBQzlCO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFXTyxXQUFTLGNBQWMsV0FBc0IsYUFBd0Q7QUFDMUcsVUFBTSxlQUFlLGlCQUFpQixTQUFTO0FBQy9DLFVBQU0sUUFBcUMsQ0FBQztBQUU1QyxRQUFJLGFBQWE7QUFFakIsYUFBUyxJQUFJLEdBQUcsSUFBSSxhQUFhLFFBQVEsS0FBSztBQUM1QyxZQUFNLE9BQU8sYUFBYSxDQUFDO0FBQzNCLFlBQU0sU0FBUyxLQUFLO0FBQ3BCLFVBQUksQ0FBQyxPQUFRO0FBRWIsWUFBTSxhQUFhLGFBQWEsS0FBSyxJQUFJO0FBQ3pDLFlBQU0sVUFBVSxLQUFLLFNBQVMsV0FBVyxLQUFLLFNBQVMsZUFBZSxLQUFLLFNBQVM7QUFDcEYsWUFBTSxRQUFRLFVBQVcsT0FBcUI7QUFHOUMsWUFBTSxpQkFBZ0IsK0JBQU8sZUFBYyxNQUFNLGVBQWU7QUFDaEUsVUFBSTtBQUNKLFVBQUk7QUFDSixVQUFJO0FBRUosVUFBSSxpQkFBaUIsT0FBTztBQUMxQixjQUFNLFVBQVUseUJBQXlCLEtBQUs7QUFDOUMsd0JBQWdCLFFBQVE7QUFDeEIsd0JBQWdCLFFBQVE7QUFDeEIsc0JBQWMsUUFBUTtBQUFBLE1BQ3hCLFdBQVcsT0FBTztBQUNoQixjQUFNLFVBQVUsdUJBQXVCLEtBQUs7QUFDNUMsd0JBQWdCLFFBQVE7QUFDeEIsd0JBQWdCLFFBQVE7QUFDeEIsc0JBQWMsUUFBUTtBQUFBLE1BQ3hCLE9BQU87QUFDTCx3QkFBZ0I7QUFDaEIsd0JBQWdCLENBQUM7QUFDakIsc0JBQWM7QUFBQSxNQUNoQjtBQUdBLFlBQU0sYUFBYSxxQkFBcUIsSUFBSTtBQUM1QyxZQUFNLGVBQThCLGtDQUMvQixhQUNBO0FBSUwsWUFBTSxXQUFXLGdCQUFnQixJQUFJO0FBR3JDLFlBQU0sT0FBTyxRQUFRLFdBQVcsS0FBSyxJQUFJO0FBQUEsUUFDdkMsWUFBWTtBQUFBLFFBQ1osU0FBUztBQUFBLFFBQ1QsS0FBSztBQUFBLFFBQ0wsUUFBUTtBQUFBLFFBQ1IsV0FBVztBQUFBLFFBQ1gsY0FBYztBQUFBLE1BQ2hCO0FBR0EsVUFBSSxDQUFDLEtBQUssT0FBTyxhQUFhO0FBQzVCLGFBQUssTUFBTTtBQUFBLE1BQ2I7QUFHQSxVQUFJLFVBQThCO0FBQ2xDLFVBQUksSUFBSSxHQUFHO0FBQ1QsY0FBTSxZQUFZLGFBQWEsT0FBTztBQUN0QyxZQUFJLFlBQVksR0FBRztBQUNqQixvQkFBVTtBQUFBLFlBQ1IsYUFBYSxhQUFhLElBQUksQ0FBQyxFQUFFO0FBQUEsWUFDakMsUUFBUSxLQUFLLE1BQU0sU0FBUztBQUFBLFlBQzVCLGNBQWMsSUFBSSxLQUFLLE1BQU0sU0FBUyxDQUFDO0FBQUEsWUFDdkMsZ0JBQWdCO0FBQUEsVUFDbEI7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUdBLFlBQU0sZUFBZSxvQkFBb0IsSUFBSTtBQUc3QyxZQUFNLFNBQVMsY0FBYyxNQUFNLFFBQVE7QUFDM0MsWUFBTSxjQUFjLGtCQUFrQixNQUFNO0FBRzVDLFVBQUksWUFBWSxvQkFBb0IsWUFBWSxvQkFBb0I7QUFFbEUscUJBQWEsV0FBVyxhQUFhLFlBQVk7QUFFakQsbUJBQVcsQ0FBQyxVQUFVLFVBQVUsS0FBSyxPQUFPLFFBQVEsUUFBUSxHQUFHO0FBQzdELGNBQUksWUFBWSxnQkFBZ0IsU0FBUyxRQUFRLEtBQUssWUFBWSxvQkFBb0I7QUFFcEYsa0JBQU0sUUFBUSxPQUFPLEtBQUssT0FBSyxFQUFFLFNBQVMsUUFBUTtBQUNsRCxnQkFBSSxTQUFTLE1BQU0sU0FBUyxvQkFBb0I7QUFDOUMseUJBQVcsV0FBVztBQUN0Qix5QkFBVyxTQUFTLE1BQU07QUFBQSxZQUM1QjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUdBLFlBQU0sYUFBYSxrQkFBa0IsSUFBSTtBQUd6QyxZQUFNLHFCQUFxQiwwQkFBMEIsSUFBSTtBQUd6RCxVQUFJO0FBQ0osVUFBSTtBQUNGLGNBQU0sSUFBSSx3QkFBd0IsSUFBSTtBQUN0QyxZQUFJLEVBQUUsU0FBUyxFQUFHLHFCQUFvQjtBQUFBLE1BQ3hDLFNBQVMsR0FBRztBQUNWLGdCQUFRLEtBQUssOENBQThDLEtBQUssTUFBTSxDQUFDO0FBQUEsTUFDekU7QUFHQSxVQUFJO0FBQ0osVUFBSTtBQUNGLGNBQU0sSUFBSSxnQkFBZ0IsSUFBSTtBQUM5QixZQUFJLE9BQU8sS0FBSyxDQUFDLEVBQUUsU0FBUyxFQUFHLGFBQVk7QUFBQSxNQUM3QyxTQUFTLEdBQUc7QUFDVixnQkFBUSxLQUFLLHNDQUFzQyxLQUFLLE1BQU0sQ0FBQztBQUFBLE1BQ2pFO0FBR0EsWUFBTSxhQUFhLHFCQUFxQixLQUFLLElBQUk7QUFDakQsWUFBTSxXQUFXLGNBQWMsWUFBWSxJQUFJLFVBQVUsSUFBSTtBQUM3RCxZQUFNLGFBQWEsV0FDZixtQkFBbUIsR0FBRyxhQUFhLFFBQVEsS0FBSyxNQUFNLE9BQU8sTUFBTSxDQUFDLElBQ3BFO0FBR0osVUFBSTtBQUNKLFVBQUk7QUFDRixjQUFNLFFBQVEsS0FBSyxRQUFRLElBQUksWUFBWTtBQUMzQyxZQUFJLFlBQVksNENBQTRDLEtBQUssSUFBSSxHQUFHO0FBQ3RFLGdCQUFNLE1BQU0saUJBQWlCLElBQUk7QUFDakMsY0FBSSxJQUFLLGNBQWE7QUFBQSxRQUN4QjtBQUFBLE1BQ0YsU0FBUyxHQUFHO0FBQ1YsZ0JBQVEsS0FBSyx1Q0FBdUMsS0FBSyxNQUFNLENBQUM7QUFBQSxNQUNsRTtBQUdBLFVBQUksY0FBMEQ7QUFDOUQsVUFBSTtBQUNGLHNCQUFjLGlCQUFpQjtBQUFBLFVBQzdCLGNBQWM7QUFBQSxVQUNkLGVBQWUsYUFBYTtBQUFBLFVBQzVCLGVBQWUsV0FBVztBQUFBLFVBQzFCLFVBQVUscUJBQXFCLENBQUM7QUFBQSxVQUNoQyxXQUFXLGFBQWEsQ0FBQztBQUFBLFVBQ3pCO0FBQUEsVUFDQTtBQUFBLFVBQ0EsV0FBVyxLQUFLLFFBQVE7QUFBQSxVQUN4QixlQUFlLEtBQUssTUFBTSxPQUFPLE1BQU07QUFBQSxVQUN2QztBQUFBLFVBQ0E7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNILFNBQVMsR0FBRztBQUNWLGdCQUFRLEtBQUssdUNBQXVDLEtBQUssTUFBTSxDQUFDO0FBQUEsTUFDbEU7QUFFQSxZQUFNLFVBQVUsSUFBSTtBQUFBLFFBQ2xCO0FBQUEsUUFDQSxhQUFhLEtBQUs7QUFBQSxRQUNsQixnQkFBZ0IsZUFBZSxtQkFBbUIsSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDO0FBQUEsUUFDbkUsU0FBUztBQUFBLFFBQ1Q7QUFBQSxRQUNBO0FBQUEsUUFDQSxjQUFjLGFBQWEsU0FBUyxJQUFJLGVBQWU7QUFBQSxRQUN2RDtBQUFBLFFBQ0EsUUFBUSxPQUFPLFNBQVMsSUFBSSxTQUFTO0FBQUEsUUFDckMsYUFBYyxZQUFZLG9CQUFvQixZQUFZLHFCQUFzQixjQUFjO0FBQUEsUUFDOUYsZUFBZSxXQUFXLFVBQVU7QUFBQSxRQUNwQyxZQUFZLFdBQVcsT0FBTyxTQUFTLElBQUksV0FBVyxTQUFTO0FBQUEsUUFDL0Qsb0JBQW9CLG1CQUFtQixTQUFTLElBQUkscUJBQXFCO0FBQUEsUUFDekU7QUFBQSxRQUNBLFVBQVUsWUFBWTtBQUFBLFFBQ3RCLFlBQVksV0FBVyxhQUFhO0FBQUEsUUFDcEMsYUFBYSwyQ0FBYTtBQUFBLFFBQzFCLHVCQUF1QiwyQ0FBYTtBQUFBLFFBQ3BDO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFFQSxtQkFBYSxPQUFPLElBQUksT0FBTztBQUFBLElBQ2pDO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUF4dUNBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQUE7OztBQ0NBLFdBQVMscUJBQXFCLFdBQW1DO0FBQy9ELFFBQUksYUFBYSxVQUFVLFNBQVM7QUFBQSxNQUFPLE9BQ3pDLEVBQUUsWUFBWSxVQUNiLEVBQUUsU0FBUyxXQUFXLEVBQUUsU0FBUyxlQUFlLEVBQUUsU0FBUyxjQUFjLEVBQUUsU0FBUyxZQUNyRixFQUFFLHVCQUNGLEVBQUUsb0JBQW9CLFNBQVM7QUFBQSxJQUNqQztBQUdBLFFBQUksV0FBVyxXQUFXLEtBQUssY0FBYyxXQUFXLENBQUMsR0FBRztBQUMxRCxZQUFNLFVBQVUsV0FBVyxDQUFDO0FBQzVCLFlBQU0sa0JBQWtCLFFBQVEsU0FBUztBQUFBLFFBQU8sT0FDOUMsRUFBRSxZQUFZLFVBQ2IsRUFBRSxTQUFTLFdBQVcsRUFBRSxTQUFTLGVBQWUsRUFBRSxTQUFTLGNBQWMsRUFBRSxTQUFTLFlBQ3JGLEVBQUUsdUJBQ0YsRUFBRSxvQkFBb0IsU0FBUztBQUFBLE1BQ2pDO0FBQ0EsVUFBSSxnQkFBZ0IsU0FBUyxHQUFHO0FBQzlCLHFCQUFhO0FBQUEsTUFDZjtBQUFBLElBQ0Y7QUFFQSxXQUFPLENBQUMsR0FBRyxVQUFVLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLG9CQUFxQixJQUFJLEVBQUUsb0JBQXFCLENBQUM7QUFBQSxFQUMzRjtBQU9PLFdBQVMsaUJBQWlCLFdBQXNCLFVBQXFDO0FBeEM1RjtBQXlDRSxVQUFNLFFBQTJCLENBQUM7QUFDbEMsVUFBTSxXQUFXLFNBQVMsUUFBUTtBQUdsQyxVQUFNLEtBQUs7QUFBQSxNQUNULFFBQVEsVUFBVTtBQUFBLE1BQ2xCLFVBQVUsVUFBVTtBQUFBLE1BQ3BCLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWO0FBQUEsTUFDQSxRQUFRO0FBQUEsTUFDUixPQUFPO0FBQUEsSUFDVCxDQUFDO0FBR0QsVUFBTSxXQUFXLHFCQUFxQixTQUFTO0FBRS9DLGFBQVMsSUFBSSxHQUFHLElBQUksU0FBUyxRQUFRLEtBQUs7QUFDeEMsWUFBTSxLQUFLO0FBQUEsUUFDVCxRQUFRLFNBQVMsQ0FBQyxFQUFFO0FBQUEsUUFDcEIsVUFBVSxTQUFTLENBQUMsRUFBRTtBQUFBLFFBQ3RCLE1BQU07QUFBQSxRQUNOLFVBQVUsbUJBQW1CLElBQUksR0FBRyxTQUFTLENBQUMsRUFBRSxJQUFJO0FBQUEsUUFDcEQ7QUFBQSxRQUNBLFFBQVE7QUFBQSxRQUNSLE9BQU87QUFBQSxNQUNULENBQUM7QUFBQSxJQUNIO0FBR0EsVUFBTSxZQUFZLGNBQWMsU0FBUztBQUN6QyxVQUFNLGNBQWMsb0JBQUksSUFBWTtBQUNwQyxlQUFXLFlBQVksV0FBVztBQUNoQyxVQUFJLFlBQVksSUFBSSxTQUFTLEVBQUUsRUFBRztBQUNsQyxrQkFBWSxJQUFJLFNBQVMsRUFBRTtBQUMzQixZQUFNLEtBQUs7QUFBQSxRQUNULFFBQVEsU0FBUztBQUFBLFFBQ2pCLFVBQVUsU0FBUztBQUFBLFFBQ25CLE1BQU07QUFBQSxRQUNOLFVBQVUsR0FBRyxRQUFRLFNBQVMsSUFBSSxDQUFDO0FBQUEsUUFDbkM7QUFBQSxRQUNBLFFBQVE7QUFBQSxRQUNSLE9BQU87QUFBQSxRQUNQLFdBQVc7QUFBQSxNQUNiLENBQUM7QUFBQSxJQUNIO0FBRUEsVUFBTSxhQUFhLGVBQWUsU0FBUztBQUMzQyxVQUFNLGFBQWEsb0JBQUksSUFBWTtBQUVuQyxlQUFXLFdBQVcsWUFBWTtBQUVoQyxVQUFJLFlBQVksSUFBSSxRQUFRLEVBQUUsRUFBRztBQUNqQyxZQUFNLFVBQVUsR0FBRyxRQUFRLElBQUksS0FBSSxhQUFRLHdCQUFSLG1CQUE2QixLQUFLLEtBQUksYUFBUSx3QkFBUixtQkFBNkIsTUFBTTtBQUM1RyxVQUFJLFdBQVcsSUFBSSxPQUFPLEVBQUc7QUFDN0IsaUJBQVcsSUFBSSxPQUFPO0FBRXRCLFlBQU0sV0FBVyxHQUFHLFFBQVEsUUFBUSxJQUFJLENBQUM7QUFDekMsWUFBTSxLQUFLO0FBQUEsUUFDVCxRQUFRLFFBQVE7QUFBQSxRQUNoQixVQUFVLFFBQVE7QUFBQSxRQUNsQixNQUFNO0FBQUEsUUFDTjtBQUFBLFFBQ0E7QUFBQSxRQUNBLFFBQVE7QUFBQSxRQUNSLE9BQU87QUFBQSxNQUNULENBQUM7QUFBQSxJQUNIO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFhQSxXQUFTLGNBQWMsTUFBOEI7QUFDbkQsVUFBTSxRQUFxQixDQUFDO0FBRTVCLGFBQVMsYUFBYSxHQUF1QjtBQUMzQyxVQUFJLEVBQUUsU0FBUyxPQUFRLFFBQU87QUFDOUIsVUFBSSxhQUFhLENBQVEsRUFBRyxRQUFPO0FBQ25DLFVBQUksY0FBYyxHQUFHO0FBQ25CLG1CQUFXLFNBQVUsRUFBZ0IsVUFBVTtBQUM3QyxjQUFJLE1BQU0sWUFBWSxNQUFPO0FBQzdCLGNBQUksQ0FBQyxhQUFhLEtBQUssRUFBRyxRQUFPO0FBQUEsUUFDbkM7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFFQSxhQUFTLEtBQUssTUFBaUI7QUFDN0IsVUFBSSxLQUFLLFlBQVksTUFBTztBQUM1QixZQUFNLEtBQUssS0FBSztBQUNoQixZQUFNLFdBQVcsTUFBTSxHQUFHLFNBQVMsTUFBTSxHQUFHLFVBQVU7QUFFdEQsVUFBSSxLQUFLLFNBQVMsVUFBVTtBQUMxQixjQUFNLEtBQUssSUFBSTtBQUNmO0FBQUEsTUFDRjtBQUVBLFlBQU0sZ0JBQWdCLFlBQVksS0FBSyxLQUFLLElBQUk7QUFDaEQsV0FBSyxLQUFLLFNBQVMsV0FBVyxLQUFLLFNBQVMsZUFBZSxLQUFLLFNBQVMsY0FBYyxLQUFLLFNBQVMsYUFDaEcsWUFBWSxrQkFDYixhQUFhLElBQUksS0FDakIsY0FBYyxRQUFTLEtBQW1CLFNBQVMsU0FBUyxHQUFHO0FBQ2pFLGNBQU0sS0FBSyxJQUFJO0FBQ2Y7QUFBQSxNQUNGO0FBRUEsVUFBSSxjQUFjLE1BQU07QUFDdEIsbUJBQVcsU0FBVSxLQUFtQixVQUFVO0FBQ2hELGVBQUssS0FBSztBQUFBLFFBQ1o7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFNBQUssSUFBSTtBQUNULFdBQU87QUFBQSxFQUNUO0FBS0EsV0FBUyxlQUFlLE1BQThCO0FBQ3BELFVBQU0sUUFBcUIsQ0FBQztBQUU1QixhQUFTLEtBQUssTUFBaUI7QUFDN0IsVUFBSSxhQUFhLElBQVcsR0FBRztBQUM3QixjQUFNLEtBQUssSUFBSTtBQUFBLE1BQ2pCO0FBQ0EsVUFBSSxjQUFjLE1BQU07QUFDdEIsbUJBQVcsU0FBVSxLQUFtQixVQUFVO0FBQ2hELGNBQUksTUFBTSxZQUFZLE9BQU87QUFDM0IsaUJBQUssS0FBSztBQUFBLFVBQ1o7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxTQUFLLElBQUk7QUFDVCxXQUFPO0FBQUEsRUFDVDtBQWlCQSxXQUFlLFdBQ2IsUUFDQSxRQUNBLE9BQ0EsVUFDcUI7QUFBQTtBQUNyQixZQUFNLE9BQU8sTUFBTSxZQUFZLE1BQU07QUFDckMsVUFBSSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsT0FBTztBQUNyQyxjQUFNLElBQUksTUFBTSxRQUFRLE1BQU0sOEJBQThCO0FBQUEsTUFDOUQ7QUFHQSxVQUFJLFdBQVcsT0FBTztBQUNwQixlQUFPLE1BQU8sS0FBbUIsWUFBWSxFQUFFLFFBQVEsTUFBTSxDQUFDO0FBQUEsTUFDaEU7QUFJQSxVQUFJLGFBQWEsV0FBVyxXQUFXLE9BQU87QUFDNUMsY0FBTSxNQUFNLE1BQU0sd0JBQXdCLElBQWlCO0FBQzNELFlBQUksSUFBSyxRQUFPO0FBQUEsTUFFbEI7QUFJQSxZQUFNLGNBQWMsYUFBYSxjQUFjLElBQUk7QUFDbkQsYUFBTyxNQUFPLEtBQW1CLFlBQVk7QUFBQSxRQUMzQyxRQUFRO0FBQUEsUUFDUixZQUFZLEVBQUUsTUFBTSxTQUFTLE9BQU8sWUFBWTtBQUFBLE1BQ2xELENBQUM7QUFBQSxJQUNIO0FBQUE7QUFNQSxXQUFlLHdCQUF3QixNQUE2QztBQUFBO0FBQ2xGLFlBQU0sUUFBUyxLQUFhO0FBQzVCLFVBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxRQUFRLEtBQUssRUFBRyxRQUFPO0FBRTVDLFlBQU0sWUFBWSxNQUFNO0FBQUEsUUFDdEIsQ0FBQyxNQUFhLEVBQUUsU0FBUyxXQUFXLEVBQUUsWUFBWSxTQUFVLEVBQWlCO0FBQUEsTUFDL0U7QUFFQSxVQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsVUFBVyxRQUFPO0FBRS9DLFVBQUk7QUFDRixjQUFNLFFBQVEsTUFBTSxlQUFlLFVBQVUsU0FBUztBQUN0RCxZQUFJLENBQUMsTUFBTyxRQUFPO0FBQ25CLGVBQU8sTUFBTSxNQUFNLGNBQWM7QUFBQSxNQUNuQyxTQUFTLEtBQUs7QUFDWixnQkFBUSxLQUFLLDBDQUEwQyxLQUFLLElBQUksS0FBSyxHQUFHO0FBQ3hFLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUFBO0FBTUEsV0FBc0IsbUJBQ3BCLE9BQ0EsWUFDQSxRQUNBLGNBQ2U7QUFBQTtBQUNmLFlBQU0sUUFBUSxNQUFNO0FBRXBCLGVBQVMsSUFBSSxHQUFHLElBQUksT0FBTyxLQUFLLFlBQVk7QUFDMUMsWUFBSSxhQUFhLEVBQUc7QUFFcEIsY0FBTSxRQUFRLE1BQU0sTUFBTSxHQUFHLElBQUksVUFBVTtBQUMzQyxjQUFNLGdCQUFnQixNQUFNLElBQUksQ0FBTyxTQUFTO0FBQzlDLGNBQUk7QUFDRixrQkFBTSxPQUFPLE1BQU0sV0FBVyxLQUFLLFFBQVEsS0FBSyxRQUFRLEtBQUssT0FBTyxLQUFLLElBQUk7QUFDN0UsbUJBQU8sTUFBTSxJQUFJO0FBQUEsVUFDbkIsU0FBUyxLQUFLO0FBQ1osb0JBQVEsTUFBTSxvQkFBb0IsS0FBSyxRQUFRLEtBQUssR0FBRztBQUFBLFVBQ3pEO0FBQUEsUUFDRixFQUFDO0FBRUQsY0FBTSxRQUFRLElBQUksYUFBYTtBQUMvQixjQUFNLE9BQU8sS0FBSyxJQUFJLElBQUksWUFBWSxLQUFLO0FBQzNDLG1CQUFXLE1BQU0sT0FBTyxjQUFjLElBQUksSUFBSSxLQUFLLE1BQU07QUFBQSxNQUMzRDtBQUFBLElBQ0Y7QUFBQTtBQUtPLFdBQVMsY0FDZCxPQUNBLFVBQ1U7QUFDVixVQUFNLFNBQXdDLENBQUM7QUFDL0MsVUFBTSxlQUF5QyxDQUFDO0FBRWhELFVBQU0sYUFBYSxNQUFNLE9BQU8sT0FBSyxFQUFFLFNBQVMsT0FBTztBQUV2RCxlQUFXLFFBQVEsWUFBWTtBQUM3QixhQUFPLEtBQUssUUFBUSxJQUFJO0FBQUEsUUFDdEIsTUFBTSxLQUFLO0FBQUEsUUFDWCxLQUFLLEtBQUssT0FBTyxZQUFZO0FBQUEsUUFDN0IsV0FBVyxDQUFDLEtBQUssUUFBUTtBQUFBLFFBQ3pCLGNBQWMsS0FBSztBQUFBLFFBQ25CLFlBQVk7QUFBQSxRQUNaLGdCQUFnQixDQUFDO0FBQUEsTUFDbkI7QUFBQSxJQUNGO0FBRUEsZUFBVyxXQUFXLFVBQVU7QUFFOUIsVUFBU0MsUUFBVCxTQUFjLE1BQWlCO0FBQzdCLFlBQUksYUFBYSxJQUFXLEdBQUc7QUFDN0IsZ0JBQU0sV0FBVyxHQUFHLFFBQVEsS0FBSyxJQUFJLENBQUM7QUFDdEMsd0JBQWMsS0FBSyxRQUFRO0FBQzNCLGNBQUksT0FBTyxRQUFRLEdBQUc7QUFDcEIsbUJBQU8sUUFBUSxFQUFFLGVBQWUsS0FBSyxRQUFRLElBQUk7QUFBQSxVQUNuRDtBQUFBLFFBQ0Y7QUFDQSxZQUFJLGNBQWMsTUFBTTtBQUN0QixxQkFBVyxTQUFVLEtBQW1CLFVBQVU7QUFDaEQsWUFBQUEsTUFBSyxLQUFLO0FBQUEsVUFDWjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBYlMsaUJBQUFBO0FBRFQsWUFBTSxnQkFBMEIsQ0FBQztBQWVqQyxpQkFBVyxTQUFTLFFBQVEsVUFBVTtBQUNwQyxRQUFBQSxNQUFLLEtBQUs7QUFBQSxNQUNaO0FBQ0EsbUJBQWEsUUFBUSxJQUFJLElBQUk7QUFBQSxJQUMvQjtBQUVBLFdBQU8sRUFBRSxRQUFRLFlBQVksYUFBYTtBQUFBLEVBQzVDO0FBblZBLE1BSU07QUFKTjtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBRUEsTUFBTSxhQUFhO0FBQUE7QUFBQTs7O0FDZW5CLFdBQXNCLGNBQ3BCLFVBQ0EsaUJBQ0EsYUFDQSxjQUNlO0FBQUE7QUF4QmpCO0FBeUJFLFlBQU0sdUJBQStDLENBQUM7QUFDdEQsWUFBTSxzQkFBcUQsQ0FBQztBQUM1RCxZQUFNLG1CQUFtQixvQkFBSSxJQUFZO0FBQ3pDLFlBQU0sZ0JBQXNDLENBQUM7QUFDN0MsVUFBSSxnQkFBZ0I7QUFDcEIsVUFBSSxjQUFjO0FBS2xCLFlBQU0sY0FBYywwQkFBMEIsZUFBZTtBQUc3RCxpQkFBVyxRQUFRLGlCQUFpQjtBQUNsQyxZQUFJLGFBQWEsRUFBRztBQUVwQixjQUFNLGNBQWMsTUFBTSxZQUFZLEtBQUssUUFBUSxPQUFPO0FBQzFELFlBQUksQ0FBQyxlQUFlLFlBQVksU0FBUyxRQUFTO0FBQ2xELGNBQU0sZUFBZTtBQUVyQixvQkFBWTtBQUFBLFVBQ1YsTUFBTTtBQUFBLFVBQ04sU0FBUztBQUFBLFVBQ1QsT0FBTztBQUFBLFVBQ1AsT0FBTyxlQUFlLEtBQUssUUFBUTtBQUFBLFFBQ3JDLENBQUM7QUFHRCxjQUFNLFdBQVcsY0FBYyxjQUFjLFdBQVc7QUFDeEQsY0FBTSxlQUFlLE9BQU8sS0FBSyxRQUFRLEVBQUU7QUFDM0MseUJBQWlCO0FBR2pCLFlBQUksS0FBSyxRQUFRO0FBQ2YsZ0JBQU0sYUFBYSxNQUFNLFlBQVksS0FBSyxPQUFPLE9BQU87QUFDeEQsY0FBSSxjQUFjLFdBQVcsU0FBUyxTQUFTO0FBQzdDLGtCQUFNLGNBQWM7QUFDcEIsa0JBQU0saUJBQWlCLGNBQWMsYUFBYSxXQUFXO0FBQzdELGdDQUFvQixVQUFVLGdCQUFnQixLQUFLLE9BQU8sS0FBSztBQUFBLFVBQ2pFO0FBQUEsUUFDRjtBQUdBLGNBQU0sZUFBNkI7QUFBQSxVQUNqQyxvQkFBb0IsS0FBSyxNQUFNLGFBQWEsS0FBSztBQUFBLFVBQ2pELHFCQUFxQixLQUFLLE1BQU0sYUFBYSxNQUFNO0FBQUEsVUFDbkQsc0JBQXFCLFVBQUssV0FBTCxtQkFBYTtBQUFBLFVBQ2xDLFdBQVcsS0FBSztBQUFBLFVBQ2hCLGVBQWMsb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFBQSxVQUNyQyxtQkFBbUI7QUFBQSxVQUNuQjtBQUFBLFFBQ0Y7QUFHQSxjQUFNLFNBQVMsY0FBYyxZQUFZO0FBQ3pDLGNBQU0sUUFBUSxhQUFhLFlBQVk7QUFDdkMsY0FBTSxVQUFVLGVBQWUsWUFBWTtBQUczQyxjQUFNLGFBQXlCO0FBQUEsVUFDN0I7QUFBQSxVQUNBLE9BQU8sT0FBTztBQUFBLFlBQ1osT0FBTyxRQUFRLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVE7QUFBQSxjQUNyRCxRQUFRLENBQUMsR0FBRyxLQUFLLE1BQU07QUFBQSxjQUN2QixPQUFPLENBQUMsR0FBRyxLQUFLLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQztBQUFBLGNBQzNDLE9BQU8sS0FBSztBQUFBLFlBQ2QsQ0FBQyxDQUFDO0FBQUEsVUFDSjtBQUFBLFVBQ0E7QUFBQSxVQUNBLFVBQVUsbUJBQW1CLGNBQWMsS0FBSyxRQUFRO0FBQUEsUUFDMUQ7QUFHQSxtQkFBVyxDQUFDLEtBQUssS0FBSyxLQUFLLE9BQU8sUUFBUSxNQUFNLEdBQUc7QUFDakQsY0FBSSxTQUFTLEdBQUc7QUFDZCxrQkFBTSxVQUFVLFNBQVMsSUFBSSxNQUFNLENBQUMsRUFBRSxZQUFZLENBQUM7QUFDbkQsaUNBQXFCLE9BQU8sSUFBSTtBQUFBLFVBQ2xDO0FBQUEsUUFDRjtBQUNBLG1CQUFXLENBQUMsUUFBUSxJQUFJLEtBQUssT0FBTyxRQUFRLEtBQUssR0FBRztBQUNsRCw4QkFBb0IsTUFBTSxJQUFJO0FBQUEsWUFDNUIsUUFBUSxDQUFDLEdBQUcsS0FBSyxNQUFNO0FBQUEsWUFDdkIsT0FBTyxDQUFDLEdBQUcsS0FBSyxLQUFLLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUM7QUFBQSxZQUMzQyxPQUFPLEtBQUs7QUFBQSxVQUNkO0FBQUEsUUFDRjtBQUNBLG1CQUFXLEtBQUssU0FBUztBQUN2QiwyQkFBaUIsSUFBSSxFQUFFLEtBQUs7QUFBQSxRQUM5QjtBQUdBLGNBQU0sU0FBUyxlQUFlLEtBQUssVUFBVSxLQUFLLFVBQVUsY0FBYyxVQUFVO0FBR3BGLG9CQUFZO0FBQUEsVUFDVixNQUFNO0FBQUEsVUFDTixVQUFVLEtBQUs7QUFBQSxVQUNmO0FBQUEsVUFDQTtBQUFBLFVBQ0EsUUFBUTtBQUFBLFFBQ1YsQ0FBQztBQUdELGNBQU0sY0FBYyxpQkFBaUIsY0FBYyxLQUFLLFFBQVE7QUFDaEUsY0FBTSxhQUFhLFlBQVksT0FBTyxPQUFLLEVBQUUsU0FBUyxPQUFPLEVBQUU7QUFDL0QsdUJBQWU7QUFFZixjQUFNO0FBQUEsVUFDSjtBQUFBLFVBQ0EsQ0FBQyxTQUFTLE9BQU8sVUFBVTtBQUN6Qix3QkFBWSxFQUFFLE1BQU0sbUJBQW1CLFNBQVMsT0FBTyxNQUFNLENBQUM7QUFBQSxVQUNoRTtBQUFBLFVBQ0EsQ0FBQyxNQUFNLFNBQVM7QUFDZCxnQkFBSSxLQUFLLFNBQVMsZ0JBQWdCLEtBQUssU0FBUyxhQUFhO0FBQzNELDBCQUFZO0FBQUEsZ0JBQ1YsTUFBTTtBQUFBLGdCQUNOLE1BQU0sR0FBRyxLQUFLLFFBQVE7QUFBQSxnQkFDdEIsVUFBVSxLQUFLO0FBQUEsZ0JBQ2Y7QUFBQSxjQUNGLENBQUM7QUFBQSxZQUNILE9BQU87QUFDTCwwQkFBWTtBQUFBLGdCQUNWLE1BQU07QUFBQSxnQkFDTixNQUFNLEdBQUcsS0FBSyxRQUFRO0FBQUEsZ0JBQ3RCLFVBQVUsS0FBSztBQUFBLGdCQUNmO0FBQUEsY0FDRixDQUFDO0FBQUEsWUFDSDtBQUFBLFVBQ0Y7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUdBLGNBQU0sa0JBQWtCLGFBQWEsU0FDbEMsT0FBTyxPQUFLLEVBQUUsWUFBWSxLQUFLLEVBQy9CLElBQUksUUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLFVBQVUsY0FBYyxJQUFJLENBQUMsR0FBSSxFQUFnQixRQUFRLElBQUksQ0FBQyxFQUFFLEVBQUU7QUFDL0YsY0FBTSxXQUFXLGNBQWMsYUFBYSxlQUFlO0FBQzNELG9CQUFZO0FBQUEsVUFDVixNQUFNO0FBQUEsVUFDTixNQUFNLFNBQVMsS0FBSyxRQUFRO0FBQUEsVUFDNUI7QUFBQSxRQUNGLENBQUM7QUFHRCxjQUFNLGNBQWMsWUFBWSxLQUFLLE9BQUssRUFBRSxTQUFTLFdBQVc7QUFDaEUsc0JBQWMsS0FBSztBQUFBLFVBQ2pCLE1BQU0sS0FBSztBQUFBLFVBQ1gsV0FBVyxLQUFLLFFBQVE7QUFBQSxVQUN4QixTQUFTLEtBQUssUUFBUTtBQUFBLFVBQ3RCLGFBQWEsS0FBSyxNQUFNLGFBQWEsS0FBSztBQUFBLFVBQzFDLGNBQWMsS0FBSyxNQUFNLGFBQWEsTUFBTTtBQUFBLFVBQzVDO0FBQUEsVUFDQSxZQUFZO0FBQUEsVUFDWixlQUFlLEtBQUssV0FBVztBQUFBLFVBQy9CLGdCQUFlLGdCQUFLLFdBQUwsbUJBQWEsWUFBYixZQUF3QjtBQUFBLFVBQ3ZDLGtCQUFrQixPQUFPLE9BQU8sUUFBUSxFQUNyQyxPQUFPLENBQUMsS0FBSyxNQUFHO0FBckx6QixnQkFBQUMsS0FBQUM7QUFxTDRCLDJCQUFPQSxPQUFBRCxNQUFBLEVBQUUsaUJBQUYsZ0JBQUFBLElBQWdCLFdBQWhCLE9BQUFDLE1BQTBCO0FBQUEsYUFBSSxDQUFDO0FBQUEsVUFDNUQsdUJBQXVCO0FBQUEsVUFDdkIsd0JBQXdCLGNBQWMsbUJBQW1CO0FBQUEsUUFDM0QsQ0FBQztBQUFBLE1BQ0g7QUFHQSxZQUFNLFdBQTJCO0FBQUEsUUFDL0IsZUFBZTtBQUFBLFFBQ2YsYUFBWSxvQkFBSSxLQUFLLEdBQUUsWUFBWTtBQUFBLFFBQ25DLGVBQWUsTUFBTSxLQUFLO0FBQUEsUUFDMUIsZUFBYyxXQUFNLFlBQU4sWUFBaUI7QUFBQSxRQUMvQixlQUFlO0FBQUEsUUFDZixPQUFPO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBLHFCQUFxQjtBQUFBLFVBQ25CLFlBQVksT0FBTyxLQUFLLG9CQUFvQixFQUFFO0FBQUEsVUFDOUMsV0FBVyxPQUFPLEtBQUssbUJBQW1CLEVBQUU7QUFBQSxVQUM1QyxlQUFlLGlCQUFpQjtBQUFBLFFBQ2xDO0FBQUEsTUFDRjtBQUdBLFlBQU0sWUFBWSxpQkFBaUI7QUFFbkMsWUFBTSxlQUE2QjtBQUFBLFFBQ2pDLFFBQVE7QUFBQSxRQUNSLE9BQU87QUFBQSxRQUNQLFNBQVMsQ0FBQyxHQUFHLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDO0FBQUEsUUFDbkQsV0FBVyxVQUFVLFVBQVUsWUFBWTtBQUFBLE1BQzdDO0FBSUEsVUFBSSxVQUFVLFNBQVM7QUFDckIsbUJBQVcsQ0FBQyxTQUFTLElBQUksS0FBSyxPQUFPLFFBQVEsVUFBVSxXQUFXLEdBQUc7QUFDbkUsY0FBSSxDQUFDLFFBQVEsWUFBWSxFQUFFLFNBQVMsT0FBTyxFQUFHO0FBQzlDLHFCQUFXLENBQUMsU0FBUyxLQUFLLEtBQUssT0FBTyxRQUFRLElBQUksR0FBRztBQUNuRCxnQkFBSSxPQUFPLFVBQVUsWUFBWSxDQUFDLE1BQU0sV0FBVyxHQUFHLEVBQUc7QUFDekQsa0JBQU0sV0FBVyxRQUFRLFlBQVksRUFBRSxRQUFRLGVBQWUsR0FBRyxFQUFFLFFBQVEsT0FBTyxHQUFHLEVBQUUsUUFBUSxVQUFVLEVBQUU7QUFDM0csa0JBQU0sU0FBUyxTQUFTLFFBQVE7QUFDaEMsaUNBQXFCLE1BQU0sSUFBSTtBQUFBLFVBQ2pDO0FBQUEsUUFDRjtBQUNBLHFCQUFhLFNBQVM7QUFBQSxNQUN4QjtBQUdBLFlBQU0sZ0JBQWdCO0FBQUEsUUFDcEIsZ0JBQWdCLFFBQVEsT0FBSztBQUMzQixnQkFBTSxTQUFTLENBQUM7QUFBQSxZQUNkLElBQUksRUFBRSxRQUFRO0FBQUEsWUFDZCxNQUFNLEVBQUUsUUFBUTtBQUFBLFlBQ2hCLE9BQU8sRUFBRSxRQUFRO0FBQUEsWUFDakIsUUFBUTtBQUFBLFlBQ1IsWUFBWTtBQUFBLFlBQ1osY0FBYztBQUFBLFlBQ2QsZUFBZTtBQUFBLFlBQ2Ysa0JBQWtCO0FBQUEsVUFDcEIsQ0FBQztBQUNELGNBQUksRUFBRSxRQUFRO0FBQ1osbUJBQU8sS0FBSztBQUFBLGNBQ1YsSUFBSSxFQUFFLE9BQU87QUFBQSxjQUNiLE1BQU0sRUFBRSxPQUFPO0FBQUEsY0FDZixPQUFPLEVBQUUsT0FBTztBQUFBLGNBQ2hCLFFBQVE7QUFBQSxjQUNSLFlBQVk7QUFBQSxjQUNaLGNBQWM7QUFBQSxjQUNkLGVBQWU7QUFBQSxjQUNmLGtCQUFrQjtBQUFBLFlBQ3BCLENBQUM7QUFBQSxVQUNIO0FBQ0EsaUJBQU87QUFBQSxRQUNULENBQUM7QUFBQSxNQUNIO0FBRUEsa0JBQVk7QUFBQSxRQUNWLE1BQU07QUFBQSxRQUNOO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUE7QUFNQSxXQUFTLG9CQUNQLGlCQUNBLGdCQUNBLGFBQ007QUFDTixVQUFNLFFBQVEsT0FBTyxXQUFXO0FBRWhDLGVBQVcsQ0FBQyxZQUFZLFdBQVcsS0FBSyxPQUFPLFFBQVEsZUFBZSxHQUFHO0FBQ3ZFLFlBQU0sYUFBYSxlQUFlLFVBQVU7QUFDNUMsVUFBSSxDQUFDLFdBQVk7QUFFakIsWUFBTSxXQUErQixDQUFDO0FBR3RDLFlBQU0sY0FBbUMsQ0FBQztBQUMxQyxpQkFBVyxDQUFDLEtBQUssVUFBVSxLQUFLLE9BQU8sUUFBUSxZQUFZLE9BQU8sR0FBRztBQUNuRSxjQUFNLFlBQWEsV0FBVyxRQUFnQixHQUFHO0FBQ2pELFlBQUksYUFBYSxjQUFjLFlBQVk7QUFDekMsc0JBQVksR0FBRyxJQUFJO0FBQUEsUUFDckI7QUFBQSxNQUNGO0FBQ0EsVUFBSSxPQUFPLEtBQUssV0FBVyxFQUFFLFNBQVMsR0FBRztBQUN2QyxpQkFBUyxVQUFVO0FBQUEsTUFDckI7QUFHQSxZQUFNLGVBQW9ELENBQUM7QUFDM0QsaUJBQVcsQ0FBQyxVQUFVLFdBQVcsS0FBSyxPQUFPLFFBQVEsWUFBWSxRQUFRLEdBQUc7QUFDMUUsY0FBTSxhQUFhLFdBQVcsU0FBUyxRQUFRO0FBQy9DLFlBQUksQ0FBQyxXQUFZO0FBRWpCLGNBQU0sT0FBNEIsQ0FBQztBQUNuQyxtQkFBVyxDQUFDLEtBQUssVUFBVSxLQUFLLE9BQU8sUUFBUSxXQUFXLEdBQUc7QUFDM0QsZ0JBQU0sWUFBYSxXQUFtQixHQUFHO0FBQ3pDLGNBQUksY0FBYyxVQUFhLGNBQWMsWUFBWTtBQUN2RCxpQkFBSyxHQUFHLElBQUk7QUFBQSxVQUNkO0FBQUEsUUFDRjtBQUNBLFlBQUksT0FBTyxLQUFLLElBQUksRUFBRSxTQUFTLEdBQUc7QUFDaEMsdUJBQWEsUUFBUSxJQUFJO0FBQUEsUUFDM0I7QUFBQSxNQUNGO0FBQ0EsVUFBSSxPQUFPLEtBQUssWUFBWSxFQUFFLFNBQVMsR0FBRztBQUN4QyxpQkFBUyxXQUFXO0FBQUEsTUFDdEI7QUFHQSxVQUFJLFdBQVcsS0FBSyxZQUFZLFlBQVksS0FBSyxXQUFXLFdBQVcsS0FBSyxRQUFRLFlBQVksS0FBSyxLQUFLO0FBQ3hHLGlCQUFTLE9BQU8sQ0FBQztBQUNqQixZQUFJLFdBQVcsS0FBSyxZQUFZLFlBQVksS0FBSyxTQUFTO0FBQ3hELG1CQUFTLEtBQUssVUFBVSxXQUFXLEtBQUs7QUFBQSxRQUMxQztBQUNBLFlBQUksV0FBVyxLQUFLLFFBQVEsWUFBWSxLQUFLLEtBQUs7QUFDaEQsbUJBQVMsS0FBSyxNQUFNLFdBQVcsS0FBSztBQUFBLFFBQ3RDO0FBQUEsTUFDRjtBQUVBLFVBQUksT0FBTyxLQUFLLFFBQVEsRUFBRSxTQUFTLEdBQUc7QUFDcEMsWUFBSSxDQUFDLFlBQVksV0FBWSxhQUFZLGFBQWEsQ0FBQztBQUN2RCxvQkFBWSxXQUFXLEtBQUssSUFBSTtBQUFBLE1BQ2xDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFLQSxXQUFTLG1CQUFtQixPQUFrQixVQUFrQjtBQUM5RCxVQUFNLFdBQVcsTUFBTSxTQUNwQjtBQUFBLE1BQU8sT0FDTixFQUFFLFlBQVksVUFDYixFQUFFLFNBQVMsV0FBVyxFQUFFLFNBQVMsZUFBZSxFQUFFLFNBQVMsY0FBYyxFQUFFLFNBQVMsWUFDckYsRUFBRTtBQUFBLElBQ0osRUFDQyxLQUFLLENBQUMsR0FBRyxNQUFNLEVBQUUsb0JBQXFCLElBQUksRUFBRSxvQkFBcUIsQ0FBQztBQUVyRSxXQUFPLFNBQVMsSUFBSSxDQUFDLEdBQUcsTUFBTTtBQUM1QixZQUFNLFNBQVMsRUFBRTtBQUNqQixZQUFNLGVBQWUsTUFBTTtBQUMzQixZQUFNLGFBQWEsWUFBWSxDQUFDO0FBQ2hDLFlBQU0sWUFBWSxlQUFlLENBQUM7QUFFbEMsYUFBTztBQUFBLFFBQ0wsT0FBTyxJQUFJO0FBQUEsUUFDWCxNQUFNLEVBQUU7QUFBQSxRQUNSLElBQUksRUFBRTtBQUFBLFFBQ04sWUFBWSxFQUFFLE9BQU8sS0FBSyxNQUFNLE9BQU8sS0FBSyxHQUFHLFFBQVEsS0FBSyxNQUFNLE9BQU8sTUFBTSxFQUFFO0FBQUEsUUFDakYsVUFBVSxLQUFLLE1BQU0sT0FBTyxJQUFJLGFBQWEsQ0FBQztBQUFBLFFBQzlDLGVBQWUsRUFBRSxTQUFTLFdBQVksRUFBZ0IsZUFBZSxVQUFjLEVBQWdCLGVBQWU7QUFBQSxRQUNsSCxhQUFhO0FBQUEsUUFDYixhQUFhLHNCQUFzQixDQUFDO0FBQUEsUUFDcEMsWUFBWTtBQUFBLFFBQ1osWUFBWSxlQUFlLFFBQVEsRUFBRSxJQUFJLENBQUM7QUFBQSxRQUMxQyxxQkFBcUI7QUFBQSxNQUN2QjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFFQSxXQUFTLFlBQVksTUFBeUI7QUFDNUMsUUFBSSxRQUFRO0FBQ1osYUFBUyxLQUFLLEdBQWM7QUFDMUIsVUFBSSxXQUFXLEtBQUssTUFBTSxRQUFTLEVBQVUsS0FBSyxHQUFHO0FBQ25ELFlBQUssRUFBVSxNQUFNLEtBQUssQ0FBQyxNQUFhLEVBQUUsU0FBUyxXQUFXLEVBQUUsWUFBWSxLQUFLLEVBQUc7QUFBQSxNQUN0RjtBQUNBLFVBQUksY0FBYyxHQUFHO0FBQ25CLG1CQUFXLFNBQVUsRUFBZ0IsU0FBVSxNQUFLLEtBQUs7QUFBQSxNQUMzRDtBQUFBLElBQ0Y7QUFDQSxTQUFLLElBQUk7QUFDVCxXQUFPO0FBQUEsRUFDVDtBQVlBLFdBQVMsMEJBQTBCLE9BQXNDO0FBQ3ZFLFVBQU0sa0JBQWtCLG9CQUFJLElBQW9CO0FBRWhELGVBQVcsUUFBUSxPQUFPO0FBQ3hCLFVBQUk7QUFDRixjQUFNLE9BQU8sTUFBTSxZQUFZLEtBQUssUUFBUSxPQUFPO0FBQ25ELFlBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxRQUFTO0FBQ3BDLGNBQU0sUUFBUTtBQUNkLFlBQUksYUFBYSxNQUFNLFNBQVM7QUFBQSxVQUFPLE9BQ3JDLEVBQUUsWUFBWSxVQUNiLEVBQUUsU0FBUyxXQUFXLEVBQUUsU0FBUyxlQUFlLEVBQUUsU0FBUyxjQUFjLEVBQUUsU0FBUztBQUFBLFFBQ3ZGO0FBQ0EsWUFBSSxXQUFXLFdBQVcsS0FBSyxjQUFjLFdBQVcsQ0FBQyxHQUFHO0FBQzFELGdCQUFNLFFBQVMsV0FBVyxDQUFDLEVBQWdCLFNBQVM7QUFBQSxZQUFPLE9BQ3pELEVBQUUsWUFBWSxVQUNiLEVBQUUsU0FBUyxXQUFXLEVBQUUsU0FBUyxlQUFlLEVBQUUsU0FBUyxjQUFjLEVBQUUsU0FBUztBQUFBLFVBQ3ZGO0FBQ0EsY0FBSSxNQUFNLFNBQVMsRUFBRyxjQUFhO0FBQUEsUUFDckM7QUFDQSxjQUFNLGlCQUFpQixvQkFBSSxJQUFZO0FBQ3ZDLG1CQUFXLEtBQUssWUFBWTtBQUMxQixnQkFBTSxNQUFNLHFCQUFxQixFQUFFLFFBQVEsRUFBRTtBQUM3QyxjQUFJLENBQUMsSUFBSztBQUNWLHlCQUFlLElBQUksR0FBRztBQUFBLFFBQ3hCO0FBQ0EsbUJBQVcsUUFBUSxnQkFBZ0I7QUFDakMsMEJBQWdCLElBQUksT0FBTyxnQkFBZ0IsSUFBSSxJQUFJLEtBQUssS0FBSyxDQUFDO0FBQUEsUUFDaEU7QUFBQSxNQUNGLFNBQVMsR0FBRztBQUNWLGdCQUFRLEtBQUssbURBQW1ELEtBQUssVUFBVSxDQUFDO0FBQUEsTUFDbEY7QUFBQSxJQUNGO0FBRUEsVUFBTSxNQUFNLG9CQUFJLElBQVk7QUFDNUIsZUFBVyxDQUFDLE1BQU0sS0FBSyxLQUFLLGlCQUFpQjtBQUMzQyxVQUFJLFNBQVMsRUFBRyxLQUFJLElBQUksSUFBSTtBQUFBLElBQzlCO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFFQSxXQUFTLHNCQUFzQixNQUEyQjtBQUN4RCxVQUFNLFFBQWtCLENBQUM7QUFDekIsYUFBUyxLQUFLLEdBQWM7QUFDMUIsVUFBSSxXQUFXLEtBQUssTUFBTSxRQUFTLEVBQVUsS0FBSyxHQUFHO0FBQ25ELFlBQUssRUFBVSxNQUFNLEtBQUssQ0FBQyxNQUFhLEVBQUUsU0FBUyxXQUFXLEVBQUUsWUFBWSxLQUFLLEdBQUc7QUFDbEYsZ0JBQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTTtBQUFBLFFBQ3JDO0FBQUEsTUFDRjtBQUNBLFVBQUksY0FBYyxHQUFHO0FBQ25CLG1CQUFXLFNBQVUsRUFBZ0IsU0FBVSxNQUFLLEtBQUs7QUFBQSxNQUMzRDtBQUFBLElBQ0Y7QUFDQSxTQUFLLElBQUk7QUFDVCxXQUFPO0FBQUEsRUFDVDtBQUtBLFdBQVMsZUFBZSxVQUFrQixVQUFrQixPQUFxQixRQUE0QjtBQUMzRyxVQUFNLFFBQWtCLENBQUM7QUFDekIsVUFBTSxLQUFLLHdCQUFtQixRQUFRLEVBQUU7QUFDeEMsVUFBTSxLQUFLLGdDQUFnQztBQUMzQyxVQUFNLEtBQUssaUJBQWlCLE1BQU0sWUFBWSxFQUFFO0FBQ2hELFVBQU0sS0FBSyxFQUFFO0FBQ2IsVUFBTSxLQUFLLGtCQUFrQjtBQUM3QixVQUFNLEtBQUssZ0JBQWdCLFFBQVEsRUFBRTtBQUNyQyxVQUFNLEtBQUssbUJBQW1CLE1BQU0sa0JBQWtCLElBQUk7QUFDMUQsVUFBTSxLQUFLLG9CQUFvQixPQUFPLEtBQUssTUFBTSxRQUFRLEVBQUUsTUFBTSxFQUFFO0FBQ25FLFFBQUksTUFBTSxxQkFBcUI7QUFDN0IsWUFBTSxLQUFLLDBCQUEwQixNQUFNLG1CQUFtQixJQUFJO0FBQUEsSUFDcEU7QUFDQSxVQUFNLEtBQUssRUFBRTtBQUdiLFVBQU0sS0FBSyxnQkFBZ0I7QUFDM0IsVUFBTSxLQUFLLHVCQUF1QjtBQUNsQyxVQUFNLEtBQUssc0JBQXNCO0FBQ2pDLFVBQU0sZUFBZSxPQUFPLFFBQVEsT0FBTyxNQUFNLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUM3RSxlQUFXLENBQUMsS0FBSyxLQUFLLEtBQUssYUFBYSxNQUFNLEdBQUcsRUFBRSxHQUFHO0FBQ3BELFlBQU0sS0FBSyxLQUFLLEdBQUcsTUFBTSxLQUFLLElBQUk7QUFBQSxJQUNwQztBQUNBLFVBQU0sS0FBSyxFQUFFO0FBR2IsVUFBTSxLQUFLLG9CQUFvQjtBQUMvQixVQUFNLEtBQUssMkJBQTJCO0FBQ3RDLFVBQU0sS0FBSywyQkFBMkI7QUFDdEMsZUFBVyxDQUFDLFFBQVEsSUFBSSxLQUFLLE9BQU8sUUFBUSxPQUFPLEtBQUssR0FBRztBQUN6RCxZQUFNLEtBQUssS0FBSyxNQUFNLE1BQU0sS0FBSyxPQUFPLEtBQUssSUFBSSxDQUFDLE1BQU0sS0FBSyxNQUFNLEtBQUssSUFBSSxDQUFDLE1BQU07QUFBQSxJQUNyRjtBQUNBLFVBQU0sS0FBSyxFQUFFO0FBR2IsVUFBTSxLQUFLLGFBQWE7QUFDeEIsVUFBTSxLQUFLLEVBQUU7QUFDYixlQUFXLENBQUMsWUFBWSxJQUFJLEtBQUssT0FBTyxRQUFRLE1BQU0sUUFBUSxHQUFHO0FBQy9ELFlBQU0sS0FBSyxPQUFPLFVBQVUsRUFBRTtBQUM5QixZQUFNLEtBQUsseUJBQXlCLEtBQUssYUFBYSxFQUFFO0FBQ3hELFlBQU0sS0FBSyxxQkFBcUIsS0FBSyxRQUFRLG1CQUFtQixNQUFNLEVBQUU7QUFDeEUsWUFBTSxLQUFLLGVBQWUsS0FBSyxLQUFLLFVBQVUsS0FBSyxLQUFLLEtBQUssT0FBTyxrQkFBa0IsS0FBSyxLQUFLLE9BQU8sTUFBTSxFQUFFO0FBQy9HLFVBQUksS0FBSyxnQkFBZ0IsS0FBSyxhQUFhLFNBQVMsR0FBRztBQUNyRCxjQUFNLEtBQUssdUJBQXVCLEtBQUssYUFBYSxNQUFNLEtBQUssS0FBSyxhQUFhLElBQUksT0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHO0FBQUEsTUFDcEg7QUFDQSxVQUFJLEtBQUssU0FBUztBQUNoQixjQUFNLEtBQUssa0JBQWtCLEtBQUssUUFBUSxNQUFNLFlBQVksS0FBSyxRQUFRLFdBQVcsR0FBRztBQUFBLE1BQ3pGO0FBQ0EsWUFBTSxLQUFLLEVBQUU7QUFHYixpQkFBVyxDQUFDLFVBQVUsVUFBVSxLQUFLLE9BQU8sUUFBUSxLQUFLLFFBQVEsR0FBRztBQUNsRSxjQUFNLFFBQVEsT0FBTyxRQUFRLFVBQVUsRUFDcEMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sTUFBTSxRQUFRLE1BQU0sTUFBUyxFQUMvQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFDNUIsS0FBSyxJQUFJO0FBQ1osY0FBTSxLQUFLLFNBQVMsUUFBUSxPQUFPLEtBQUssRUFBRTtBQUFBLE1BQzVDO0FBQ0EsWUFBTSxLQUFLLEVBQUU7QUFBQSxJQUNmO0FBRUEsV0FBTyxNQUFNLEtBQUssSUFBSTtBQUFBLEVBQ3hCO0FBamdCQTtBQUFBO0FBQUE7QUFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTtBQUFBOzs7QUNiQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBR0EsWUFBTSxPQUFPLFVBQVUsRUFBRSxPQUFPLEtBQUssUUFBUSxJQUFJLENBQUM7QUFDbEQsY0FBUSxJQUFJLDZDQUE2QztBQUd6RCxVQUFJLGtCQUFrQjtBQUd0QixZQUFNLEdBQUcsWUFBWSxDQUFPLFFBQTRCO0FBQ3RELGdCQUFRLElBQUksNkJBQTZCLElBQUksSUFBSTtBQUVqRCxnQkFBUSxJQUFJLE1BQU07QUFBQSxVQUNoQixLQUFLLGtCQUFrQjtBQUNyQixnQkFBSTtBQUNGLG9CQUFNLFFBQVEsY0FBYztBQUM1QixzQkFBUSxJQUFJLHFCQUFxQixNQUFNLE1BQU07QUFDN0Msb0JBQU0sR0FBRyxZQUFZLEVBQUUsTUFBTSxvQkFBb0IsTUFBTSxDQUFDO0FBQUEsWUFDMUQsU0FBUyxLQUFLO0FBQ1osc0JBQVEsTUFBTSxvQkFBb0IsR0FBRztBQUNyQyxvQkFBTSxHQUFHLFlBQVksRUFBRSxNQUFNLGdCQUFnQixPQUFPLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFBQSxZQUNuRTtBQUNBO0FBQUEsVUFDRjtBQUFBLFVBRUEsS0FBSyxZQUFZO0FBQ2YsZ0JBQUk7QUFDRixvQkFBTSxVQUFVLE1BQU0sa0JBQWtCLElBQUksUUFBUTtBQUNwRCxzQkFBUSxJQUFJLHdCQUF3QixRQUFRLFFBQVEsU0FBUztBQUM3RCxvQkFBTSxHQUFHLFlBQVk7QUFBQSxnQkFDbkIsTUFBTTtBQUFBLGdCQUNOO0FBQUEsZ0JBQ0EsVUFBVSxJQUFJO0FBQUEsY0FDaEIsQ0FBQztBQUFBLFlBQ0gsU0FBUyxLQUFLO0FBQ1osc0JBQVEsTUFBTSxxQkFBcUIsR0FBRztBQUN0QyxvQkFBTSxHQUFHLFlBQVk7QUFBQSxnQkFDbkIsTUFBTTtBQUFBLGdCQUNOLE9BQU8sc0JBQXNCLEdBQUc7QUFBQSxjQUNsQyxDQUFDO0FBQUEsWUFDSDtBQUNBO0FBQUEsVUFDRjtBQUFBLFVBRUEsS0FBSyxnQkFBZ0I7QUFDbkIsOEJBQWtCO0FBQ2xCLGdCQUFJO0FBQ0Ysb0JBQU07QUFBQSxnQkFDSixJQUFJO0FBQUEsZ0JBQ0osSUFBSTtBQUFBLGdCQUNKLENBQUMsWUFBWSxNQUFNLEdBQUcsWUFBWSxPQUFPO0FBQUEsZ0JBQ3pDLE1BQU07QUFBQSxjQUNSO0FBQUEsWUFDRixTQUFTLEtBQUs7QUFDWixzQkFBUSxNQUFNLGlCQUFpQixHQUFHO0FBQ2xDLG9CQUFNLEdBQUcsWUFBWTtBQUFBLGdCQUNuQixNQUFNO0FBQUEsZ0JBQ04sT0FBTyxrQkFBa0IsR0FBRztBQUFBLGNBQzlCLENBQUM7QUFBQSxZQUNIO0FBQ0E7QUFBQSxVQUNGO0FBQUEsVUFFQSxLQUFLLGlCQUFpQjtBQUNwQiw4QkFBa0I7QUFDbEIsb0JBQVEsSUFBSSwwQkFBMEI7QUFDdEM7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQTtBQUFBOyIsCiAgIm5hbWVzIjogWyJjb2x1bW5zIiwgImV4dHJhY3RTdHJva2VDb2xvciIsICJ3YWxrIiwgIl9hIiwgIl9iIl0KfQo=
