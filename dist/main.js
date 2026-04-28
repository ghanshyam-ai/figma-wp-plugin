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
  function gradientAngleFromTransform(t) {
    if (!t || !Array.isArray(t) || t.length < 2) return 180;
    const a = t[0][0], b = t[0][1];
    const c = t[1][0], d = t[1][1];
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-9) return 180;
    const vx = d / det;
    const vy = -c / det;
    let deg = Math.atan2(vx, -vy) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return Math.round(deg);
  }
  function extractGradient(node) {
    if (!("fills" in node) || !node.fills || !Array.isArray(node.fills)) return null;
    for (const fill of node.fills) {
      if (fill.visible === false) continue;
      if (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_RADIAL" || fill.type === "GRADIENT_ANGULAR" || fill.type === "GRADIENT_DIAMOND") {
        const g = fill;
        const stops = g.gradientStops.map((s) => `${rgbToHex(s.color)} ${Math.round(s.position * 100)}%`).join(", ");
        const opacity = g.opacity;
        const stopsWithAlpha = opacity !== void 0 && opacity < 1 ? g.gradientStops.map((s) => {
          var _a;
          const a = ((_a = s.color.a) != null ? _a : 1) * opacity;
          return `rgba(${Math.round(s.color.r * 255)}, ${Math.round(s.color.g * 255)}, ${Math.round(s.color.b * 255)}, ${Math.round(a * 100) / 100}) ${Math.round(s.position * 100)}%`;
        }).join(", ") : stops;
        switch (fill.type) {
          case "GRADIENT_LINEAR": {
            const angle = gradientAngleFromTransform(g.gradientTransform);
            return `linear-gradient(${angle}deg, ${stopsWithAlpha})`;
          }
          case "GRADIENT_RADIAL":
            return `radial-gradient(${stopsWithAlpha})`;
          case "GRADIENT_ANGULAR":
            return `conic-gradient(${stopsWithAlpha})`;
          case "GRADIENT_DIAMOND":
            return `radial-gradient(${stopsWithAlpha}) /* approximated from Figma diamond gradient */`;
        }
      }
    }
    return null;
  }
  function extractStrokeAlign(node) {
    const s = node == null ? void 0 : node.strokeAlign;
    if (s === "INSIDE") return "inside";
    if (s === "OUTSIDE") return "outside";
    if (s === "CENTER") return "center";
    return null;
  }
  function extractMixBlendMode(node) {
    const bm = node == null ? void 0 : node.blendMode;
    if (!bm || typeof bm !== "string") return null;
    switch (bm) {
      case "NORMAL":
      case "PASS_THROUGH":
        return null;
      case "MULTIPLY":
        return "multiply";
      case "SCREEN":
        return "screen";
      case "OVERLAY":
        return "overlay";
      case "DARKEN":
        return "darken";
      case "LIGHTEN":
        return "lighten";
      case "COLOR_DODGE":
        return "color-dodge";
      case "COLOR_BURN":
        return "color-burn";
      case "HARD_LIGHT":
        return "hard-light";
      case "SOFT_LIGHT":
        return "soft-light";
      case "DIFFERENCE":
        return "difference";
      case "EXCLUSION":
        return "exclusion";
      case "HUE":
        return "hue";
      case "SATURATION":
        return "saturation";
      case "COLOR":
        return "color";
      case "LUMINOSITY":
        return "luminosity";
      case "LINEAR_BURN":
        return "multiply";
      case "LINEAR_DODGE":
        return "screen";
      default:
        return null;
    }
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
  function extractSectionStyles(node, imageMap) {
    const bg = extractBackgroundColor(node);
    const gradient = extractGradient(node);
    const bounds = node.absoluteBoundingBox;
    const effects = extractEffects(node);
    const corners = extractPerCornerRadius(node);
    const sectionBgFile = hasImageFill(node) ? imageMap.get(node.id) || `${slugify(node.name)}.png` : null;
    const styles = {
      paddingTop: null,
      // Set by spacing extractor
      paddingBottom: null,
      paddingLeft: null,
      paddingRight: null,
      backgroundColor: bg,
      backgroundImage: sectionBgFile ? `url(images/${sectionBgFile})` : null,
      backgroundImageFile: sectionBgFile,
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
    Object.assign(styles, extractAutoLayoutFlex(node));
    const blend = extractMixBlendMode(node);
    if (blend) styles.mixBlendMode = blend;
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
  function extractAutoLayoutFlex(frame) {
    if (!frame || !frame.layoutMode || frame.layoutMode === "NONE") return {};
    const out = {};
    out.display = "flex";
    out.flexDirection = frame.layoutMode === "HORIZONTAL" ? "row" : "column";
    const mapPrimary = (v) => {
      switch (v) {
        case "MIN":
          return "flex-start";
        case "CENTER":
          return "center";
        case "MAX":
          return "flex-end";
        case "SPACE_BETWEEN":
          return "space-between";
        default:
          return null;
      }
    };
    const mapCounter = (v) => {
      switch (v) {
        case "MIN":
          return "flex-start";
        case "CENTER":
          return "center";
        case "MAX":
          return "flex-end";
        case "BASELINE":
          return "baseline";
        default:
          return null;
      }
    };
    const jc = mapPrimary(frame.primaryAxisAlignItems);
    const ai = mapCounter(frame.counterAxisAlignItems);
    if (jc) out.justifyContent = jc;
    if (ai) out.alignItems = ai;
    if (frame.layoutWrap === "WRAP") {
      out.flexWrap = "wrap";
      if (typeof frame.counterAxisSpacing === "number" && frame.counterAxisSpacing > 0) {
        out.rowGap = toCssValue(frame.counterAxisSpacing);
      }
    }
    return out;
  }
  function extractConstraints(node) {
    const c = node == null ? void 0 : node.constraints;
    if (!c || typeof c !== "object") return {};
    const map = (v) => {
      if (v === "MIN") return "min";
      if (v === "CENTER") return "center";
      if (v === "MAX") return "max";
      if (v === "STRETCH") return "stretch";
      if (v === "SCALE") return "scale";
      return null;
    };
    return { horizontal: map(c.horizontal), vertical: map(c.vertical) };
  }
  function extractLayoutPositioning(node) {
    const p = node == null ? void 0 : node.layoutPositioning;
    if (p === "ABSOLUTE") return "absolute";
    if (p === "AUTO") return "auto";
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
    const align = extractStrokeAlign(node);
    if (!color) return;
    if (widths.uniform !== null) {
      elem.borderWidth = toCssValue(widths.uniform);
      elem.borderColor = color;
      elem.borderStyle = style;
      if (align) elem.strokeAlign = align;
      return;
    }
    if (widths.top || widths.right || widths.bottom || widths.left) {
      if (widths.top) elem.borderTopWidth = toCssValue(widths.top);
      if (widths.right) elem.borderRightWidth = toCssValue(widths.right);
      if (widths.bottom) elem.borderBottomWidth = toCssValue(widths.bottom);
      if (widths.left) elem.borderLeftWidth = toCssValue(widths.left);
      elem.borderColor = color;
      elem.borderStyle = style;
      if (align) elem.strokeAlign = align;
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
    const blend = extractMixBlendMode(node);
    if (blend) elem.mixBlendMode = blend;
    const lp = extractLayoutPositioning(node);
    if (lp === "absolute") elem.layoutPositioning = "absolute";
    const cons = extractConstraints(node);
    if (cons.horizontal) elem.constraintsHorizontal = cons.horizontal;
    if (cons.vertical) elem.constraintsVertical = cons.vertical;
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
  function extractElements(sectionNode, iconMap, imageMap) {
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
        const imgFilename = imageMap.get(node.id) || `${slugify(node.name)}.png`;
        const imgElem = {
          imageFile: imgFilename,
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
            if (typeof frame.itemSpacing === "number" && frame.itemSpacing > 0) {
              buttonStyles.gap = toCssValue(frame.itemSpacing);
            }
            Object.assign(buttonStyles, extractAutoLayoutFlex(frame));
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
          Object.assign(containerStyles, extractAutoLayoutFlex(frame));
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
  function parseSections(pageFrame, iconMap, imageMap, globalNames) {
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
      const baseStyles = extractSectionStyles(node, imageMap);
      const mergedStyles = __spreadValues(__spreadValues({}, baseStyles), sectionStyles);
      const elements = extractElements(node, iconMap, imageMap);
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
  function buildImageFilenameMap(pageFrame, iconRootIds) {
    const result = /* @__PURE__ */ new Map();
    const hashToFilename = /* @__PURE__ */ new Map();
    const usedFilenames = /* @__PURE__ */ new Set();
    for (const imgNode of findImageNodes(pageFrame)) {
      if (iconRootIds.has(imgNode.id)) continue;
      if (isInsideIconRoot(imgNode, iconRootIds)) continue;
      const imageHash = getFirstImageHash(imgNode);
      let filename;
      if (imageHash && hashToFilename.has(imageHash)) {
        filename = hashToFilename.get(imageHash);
      } else {
        const baseSlug = slugify(imgNode.name) || "image";
        filename = `${baseSlug}.png`;
        let i = 2;
        while (usedFilenames.has(filename)) {
          filename = `${baseSlug}-${i++}.png`;
        }
        usedFilenames.add(filename);
        if (imageHash) hashToFilename.set(imageHash, filename);
      }
      result.set(imgNode.id, filename);
    }
    return result;
  }
  function buildExportTasks(pageFrame, pageSlug, iconMap, imageMap) {
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
    const filenameToFirstImageNodeId = /* @__PURE__ */ new Map();
    for (const [nodeId, filename] of imageMap) {
      if (!filenameToFirstImageNodeId.has(filename)) {
        filenameToFirstImageNodeId.set(filename, nodeId);
      }
    }
    for (const [filename, nodeId] of filenameToFirstImageNodeId) {
      const node = figma.getNodeById(nodeId);
      if (!node) continue;
      tasks.push({
        nodeId,
        nodeName: node.name,
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
  function getFirstImageHash(node) {
    const fills = node.fills;
    if (!fills || !Array.isArray(fills)) return null;
    for (const f of fills) {
      if (f && f.type === "IMAGE" && f.visible !== false && f.imageHash) {
        return f.imageHash || null;
      }
    }
    return null;
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
  function buildImageMap(tasks, sections, iconMap, imageMap) {
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
          const filename = imageMap.get(node.id);
          if (filename) {
            sectionImages.add(filename);
            if (images[filename] && !images[filename].usedInSections.includes(section.name)) {
              images[filename].usedInSections.push(section.name);
            }
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
    if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION" || node.type === "LINE") {
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
      ICON_NAME_HINT = /\b(icon|chevron|arrow|caret|check|tick|close|cross|menu|burger|hamburger|search|plus|minus|star|heart|logo|social|symbol|glyph|play|pause|stop|next|prev|share|download|upload|edit|trash|delete|info|warning|error|success|facebook|twitter|instagram|linkedin|youtube|github|tiktok|whatsapp|telegram|discord|pinterest|snapchat|mail|envelope|phone|telephone|home|house|user|profile|account|lock|unlock|gear|settings|cog|bell|notification|calendar|clock|time|bookmark|tag|filter|sort|grid|list|map|pin|location|cart|bag|basket|wallet|card|gift|globe|world|link|external|copy|paste|refresh|reload|sync|eye|view|hide|visible|invisible|sun|moon|theme|light|dark|wifi|battery|camera|video|microphone|volume|mute|file|folder|attach|paperclip|cloud|database|chart|graph|trend|dot|divider|separator|shape|graphic|illustration|decoration|svg|vector|asset)\b/i;
      ICON_SIZE_CAP = 256;
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
        const iconRootIds = new Set(iconMap.keys());
        const imageMap = buildImageFilenameMap(desktopFrame, iconRootIds);
        const sections = parseSections(desktopFrame, iconMap, imageMap, globalNames);
        const sectionCount = Object.keys(sections).length;
        totalSections += sectionCount;
        if (pair.mobile) {
          const mobileNode = figma.getNodeById(pair.mobile.frameId);
          if (mobileNode && mobileNode.type === "FRAME") {
            const mobileFrame = mobileNode;
            const mobileIconMap = buildIconFilenameMap(mobileFrame);
            const mobileIconRootIds = new Set(mobileIconMap.keys());
            const mobileImageMap = buildImageFilenameMap(mobileFrame, mobileIconRootIds);
            const mobileSections = parseSections(mobileFrame, mobileIconMap, mobileImageMap, globalNames);
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
        const exportTasks = buildExportTasks(desktopFrame, pair.pageSlug, iconMap, imageMap);
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
        const imageMapJson = buildImageMap(exportTasks, sectionChildren, iconMap, imageMap);
        sendMessage({
          type: "IMAGE_MAP_DATA",
          path: `pages/${pair.pageSlug}/images`,
          imageMap: imageMapJson
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3NhbmRib3gvdXRpbHMudHMiLCAiLi4vc3JjL3NhbmRib3gvcmVzcG9uc2l2ZS50cyIsICIuLi9zcmMvc2FuZGJveC9kaXNjb3ZlcnkudHMiLCAiLi4vc3JjL3NhbmRib3gvdmFsaWRhdG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2NvbG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2VmZmVjdHMudHMiLCAiLi4vc3JjL3NhbmRib3gvdHlwb2dyYXBoeS50cyIsICIuLi9zcmMvc2FuZGJveC9zcGFjaW5nLnRzIiwgIi4uL3NyYy9zYW5kYm94L2dyaWQudHMiLCAiLi4vc3JjL3NhbmRib3gvaW50ZXJhY3Rpb25zLnRzIiwgIi4uL3NyYy9zYW5kYm94L3ZhcmlhYmxlcy50cyIsICIuLi9zcmMvc2FuZGJveC9wYXR0ZXJucy50cyIsICIuLi9zcmMvc2FuZGJveC9zZWN0aW9uLXBhcnNlci50cyIsICIuLi9zcmMvc2FuZGJveC9pbWFnZS1leHBvcnRlci50cyIsICIuLi9zcmMvc2FuZGJveC9pY29uLWRldGVjdG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2V4dHJhY3Rvci50cyIsICIuLi9zcmMvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBDb252ZXJ0IGEgRmlnbWEgbGF5ZXIgbmFtZSB0byBhIFVSTC1zYWZlIGtlYmFiLWNhc2Ugc2x1Zy5cbiAqIFwiSGVybyBTZWN0aW9uXCIgXHUyMTkyIFwiaGVyby1zZWN0aW9uXCJcbiAqIFwiQWJvdXQgVXMgXHUyMDE0IE92ZXJ2aWV3XCIgXHUyMTkyIFwiYWJvdXQtdXMtb3ZlcnZpZXdcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbmFtZVxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1tcdTIwMTRcdTIwMTNdL2csICctJylcbiAgICAucmVwbGFjZSgvW15hLXowLTlcXHMtXS9nLCAnJylcbiAgICAucmVwbGFjZSgvXFxzKy9nLCAnLScpXG4gICAgLnJlcGxhY2UoLy0rL2csICctJylcbiAgICAucmVwbGFjZSgvXi18LSQvZywgJycpO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSBGaWdtYSBsYXllciBuYW1lIHRvIEFDRi1jb21wYXRpYmxlIHNuYWtlX2Nhc2UgbGF5b3V0IG5hbWUuXG4gKiBcIkhlcm8gU2VjdGlvblwiIFx1MjE5MiBcImhlcm9fc2VjdGlvblwiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0xheW91dE5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5hbWVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXHUyMDE0XHUyMDEzXS9nLCAnXycpXG4gICAgLnJlcGxhY2UoL1teYS16MC05XFxzX10vZywgJycpXG4gICAgLnJlcGxhY2UoL1xccysvZywgJ18nKVxuICAgIC5yZXBsYWNlKC9fKy9nLCAnXycpXG4gICAgLnJlcGxhY2UoL15ffF8kL2csICcnKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgbnVtZXJpYyB2YWx1ZSB0byBhIENTUyB2YWx1ZSBzdHJpbmcgd2l0aCB1bml0LlxuICogTkVWRVIgcmV0dXJucyBhIGJhcmUgbnVtYmVyIFx1MjAxNCBhbHdheXMgXCJOcHhcIiwgXCJOJVwiLCBldGMuXG4gKiBSZXR1cm5zIG51bGwgaWYgdGhlIHZhbHVlIGlzIHVuZGVmaW5lZC9udWxsL05hTi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvQ3NzVmFsdWUodmFsdWU6IG51bWJlciB8IHVuZGVmaW5lZCB8IG51bGwsIHVuaXQ6IHN0cmluZyA9ICdweCcpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgaXNOYU4odmFsdWUpKSByZXR1cm4gbnVsbDtcbiAgLy8gUm91bmQgdG8gYXZvaWQgZmxvYXRpbmctcG9pbnQgbm9pc2UgKGUuZy4sIDc5Ljk5OTk5IFx1MjE5MiA4MClcbiAgY29uc3Qgcm91bmRlZCA9IE1hdGgucm91bmQodmFsdWUgKiAxMDApIC8gMTAwO1xuICAvLyBVc2UgaW50ZWdlciB3aGVuIGNsb3NlIGVub3VnaFxuICBjb25zdCBkaXNwbGF5ID0gTnVtYmVyLmlzSW50ZWdlcihyb3VuZGVkKSA/IHJvdW5kZWQgOiByb3VuZGVkO1xuICByZXR1cm4gYCR7ZGlzcGxheX0ke3VuaXR9YDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgYSBGaWdtYSBub2RlIElEIGZvciBvdXRwdXQuIEZpZ21hIHVzZXMgXCIxOjIzNFwiIGZvcm1hdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vZGVJZFRvU3RyaW5nKGlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaWQ7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgYSBzY3JlZW5zaG90IGZpbGVuYW1lIGZyb20gdGhlIHNlY3Rpb24ncyBsYXlvdXQgbmFtZS5cbiAqIFwiSGVybyBTZWN0aW9uXCIgXHUyMTkyIFwiaGVyby1zZWN0aW9uLnBuZ1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY3JlZW5zaG90RmlsZW5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3NsdWdpZnkobmFtZSl9LnBuZ2A7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgYXNwZWN0IHJhdGlvIHN0cmluZyBmcm9tIHdpZHRoIGFuZCBoZWlnaHQuXG4gKiBSZXR1cm5zIHRoZSBzaW1wbGVzdCBpbnRlZ2VyIHJhdGlvOiAxNDQwLzkwMCBcdTIxOTIgXCIxNi8xMFwiXG4gKiBSZXR1cm5zIG51bGwgaWYgZWl0aGVyIGRpbWVuc2lvbiBpcyAwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUFzcGVjdFJhdGlvKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghd2lkdGggfHwgIWhlaWdodCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGdjZCA9IChhOiBudW1iZXIsIGI6IG51bWJlcik6IG51bWJlciA9PiAoYiA9PT0gMCA/IGEgOiBnY2QoYiwgYSAlIGIpKTtcbiAgY29uc3QgZCA9IGdjZChNYXRoLnJvdW5kKHdpZHRoKSwgTWF0aC5yb3VuZChoZWlnaHQpKTtcbiAgcmV0dXJuIGAke01hdGgucm91bmQod2lkdGggLyBkKX0vJHtNYXRoLnJvdW5kKGhlaWdodCAvIGQpfWA7XG59XG5cbi8qKlxuICogRGV0ZWN0IGlmIGEgbm9kZSBuYW1lIGlzIGEgZGVmYXVsdCBGaWdtYS1nZW5lcmF0ZWQgbmFtZS5cbiAqIFwiRnJhbWUgMVwiLCBcIkdyb3VwIDIzXCIsIFwiUmVjdGFuZ2xlIDRcIiwgXCJWZWN0b3JcIiBcdTIxOTIgdHJ1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEZWZhdWx0TGF5ZXJOYW1lKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gL14oRnJhbWV8R3JvdXB8UmVjdGFuZ2xlfEVsbGlwc2V8TGluZXxWZWN0b3J8UG9seWdvbnxTdGFyfEJvb2xlYW58U2xpY2V8Q29tcG9uZW50fEluc3RhbmNlKVxccypcXGQqJC9pLnRlc3QobmFtZSk7XG59XG4iLCAiaW1wb3J0IHsgQnJlYWtwb2ludENsYXNzLCBGcmFtZUluZm8sIFJlc3BvbnNpdmVNYXAsIFJlc3BvbnNpdmVQYWlyLCBVbm1hdGNoZWRGcmFtZSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgc2x1Z2lmeSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIENsYXNzaWZ5IGEgZnJhbWUgd2lkdGggaW50byBhIGJyZWFrcG9pbnQgY2F0ZWdvcnkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc2lmeUJyZWFrcG9pbnQod2lkdGg6IG51bWJlcik6IEJyZWFrcG9pbnRDbGFzcyB7XG4gIGlmICh3aWR0aCA8PSA0ODApIHJldHVybiAnbW9iaWxlJztcbiAgaWYgKHdpZHRoIDw9IDgyMCkgcmV0dXJuICd0YWJsZXQnO1xuICBpZiAod2lkdGggPD0gMTQ0MCkgcmV0dXJuICdkZXNrdG9wJztcbiAgcmV0dXJuICdsYXJnZSc7XG59XG5cbi8qKlxuICogQ29tbW9uIHN1ZmZpeGVzL2tleXdvcmRzIHRoYXQgZGVub3RlIGJyZWFrcG9pbnRzIGluIGZyYW1lIG5hbWVzLlxuICovXG5jb25zdCBCUkVBS1BPSU5UX1BBVFRFUk5TID0gW1xuICAvWy1cdTIwMTNcdTIwMTRcXHNdKihkZXNrdG9wfG1vYmlsZXx0YWJsZXR8cmVzcG9uc2l2ZXxwaG9uZXx3ZWJ8bGd8bWR8c218eHMpL2dpLFxuICAvWy1cdTIwMTNcdTIwMTRcXHNdKihcXGR7Myw0fSlcXHMqKD86cHgpPyQvZ2ksICAgLy8gdHJhaWxpbmcgd2lkdGggbnVtYmVycyBsaWtlIFwiMTQ0MFwiIG9yIFwiMzc1cHhcIlxuICAvXFwoKD86ZGVza3RvcHxtb2JpbGV8dGFibGV0fHBob25lKVxcKS9naSxcbiAgL1xccyskL2csXG5dO1xuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIGZyYW1lIG5hbWUgYnkgc3RyaXBwaW5nIGJyZWFrcG9pbnQgaWRlbnRpZmllcnMuXG4gKiBcIkFib3V0IC0gRGVza3RvcFwiIFx1MjE5MiBcImFib3V0XCJcbiAqIFwiSG9tZXBhZ2UgMTQ0MFwiIFx1MjE5MiBcImhvbWVwYWdlXCJcbiAqIFwiU2VydmljZXMgKE1vYmlsZSlcIiBcdTIxOTIgXCJzZXJ2aWNlc1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVGcmFtZU5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG5vcm1hbGl6ZWQgPSBuYW1lO1xuICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgQlJFQUtQT0lOVF9QQVRURVJOUykge1xuICAgIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVkLnJlcGxhY2UocGF0dGVybiwgJycpO1xuICB9XG4gIHJldHVybiBub3JtYWxpemVkLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbn1cblxuLyoqXG4gKiBNYXRjaCBkZXNrdG9wIGFuZCBtb2JpbGUgZnJhbWVzIGJ5IG5hbWUgc2ltaWxhcml0eS5cbiAqIFJldHVybnMgUmVzcG9uc2l2ZU1hcCB3aXRoIG1hdGNoZWQgcGFpcnMgYW5kIHVubWF0Y2hlZCBmcmFtZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaFJlc3BvbnNpdmVGcmFtZXMoYWxsRnJhbWVzOiBGcmFtZUluZm9bXSk6IFJlc3BvbnNpdmVNYXAge1xuICAvLyBHcm91cCBmcmFtZXMgYnkgbm9ybWFsaXplZCBuYW1lXG4gIGNvbnN0IGdyb3VwcyA9IG5ldyBNYXA8c3RyaW5nLCBGcmFtZUluZm9bXT4oKTtcblxuICBmb3IgKGNvbnN0IGZyYW1lIG9mIGFsbEZyYW1lcykge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVGcmFtZU5hbWUoZnJhbWUubmFtZSk7XG4gICAgaWYgKCFncm91cHMuaGFzKG5vcm1hbGl6ZWQpKSB7XG4gICAgICBncm91cHMuc2V0KG5vcm1hbGl6ZWQsIFtdKTtcbiAgICB9XG4gICAgZ3JvdXBzLmdldChub3JtYWxpemVkKSEucHVzaChmcmFtZSk7XG4gIH1cblxuICBjb25zdCBtYXRjaGVkUGFpcnM6IFJlc3BvbnNpdmVQYWlyW10gPSBbXTtcbiAgY29uc3QgdW5tYXRjaGVkRnJhbWVzOiBVbm1hdGNoZWRGcmFtZVtdID0gW107XG4gIGNvbnN0IG1hdGNoZWRJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IFtiYXNlTmFtZSwgZnJhbWVzXSBvZiBncm91cHMpIHtcbiAgICBpZiAoZnJhbWVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgLy8gU2luZ2xlIGZyYW1lIFx1MjAxNCBubyByZXNwb25zaXZlIHBhaXJcbiAgICAgIGNvbnN0IGZyYW1lID0gZnJhbWVzWzBdO1xuICAgICAgaWYgKGZyYW1lLmJyZWFrcG9pbnQgPT09ICdkZXNrdG9wJyB8fCBmcmFtZS5icmVha3BvaW50ID09PSAnbGFyZ2UnKSB7XG4gICAgICAgIC8vIERlc2t0b3Agd2l0aG91dCBtb2JpbGUgXHUyMTkyIHN0aWxsIGEgdmFsaWQgcGFnZSwganVzdCBubyByZXNwb25zaXZlIGRhdGFcbiAgICAgICAgbWF0Y2hlZFBhaXJzLnB1c2goe1xuICAgICAgICAgIHBhZ2VOYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgICAgIHBhZ2VTbHVnOiBzbHVnaWZ5KGJhc2VOYW1lIHx8IGZyYW1lLm5hbWUpLFxuICAgICAgICAgIGRlc2t0b3A6IHsgZnJhbWVJZDogZnJhbWUuaWQsIGZyYW1lTmFtZTogZnJhbWUubmFtZSwgd2lkdGg6IGZyYW1lLndpZHRoIH0sXG4gICAgICAgICAgbW9iaWxlOiBudWxsLFxuICAgICAgICAgIHRhYmxldDogbnVsbCxcbiAgICAgICAgICBtYXRjaENvbmZpZGVuY2U6IDEuMCxcbiAgICAgICAgICBtYXRjaE1ldGhvZDogJ25hbWUtc2ltaWxhcml0eScsXG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVkSWRzLmFkZChmcmFtZS5pZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bm1hdGNoZWRGcmFtZXMucHVzaCh7XG4gICAgICAgICAgZnJhbWVJZDogZnJhbWUuaWQsXG4gICAgICAgICAgZnJhbWVOYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgICAgIHdpZHRoOiBmcmFtZS53aWR0aCxcbiAgICAgICAgICBicmVha3BvaW50OiBmcmFtZS5icmVha3BvaW50LFxuICAgICAgICAgIHJlYXNvbjogJ25vIGRlc2t0b3AgY291bnRlcnBhcnQgZm91bmQnLFxuICAgICAgICB9KTtcbiAgICAgICAgbWF0Y2hlZElkcy5hZGQoZnJhbWUuaWQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gTXVsdGlwbGUgZnJhbWVzIHdpdGggc2FtZSBiYXNlIG5hbWUgXHUyMDE0IG1hdGNoIGJ5IGJyZWFrcG9pbnRcbiAgICBjb25zdCBkZXNrdG9wID0gZnJhbWVzLmZpbmQoZiA9PiBmLmJyZWFrcG9pbnQgPT09ICdkZXNrdG9wJyB8fCBmLmJyZWFrcG9pbnQgPT09ICdsYXJnZScpO1xuICAgIGNvbnN0IG1vYmlsZSA9IGZyYW1lcy5maW5kKGYgPT4gZi5icmVha3BvaW50ID09PSAnbW9iaWxlJyk7XG4gICAgY29uc3QgdGFibGV0ID0gZnJhbWVzLmZpbmQoZiA9PiBmLmJyZWFrcG9pbnQgPT09ICd0YWJsZXQnKTtcblxuICAgIGlmIChkZXNrdG9wKSB7XG4gICAgICBtYXRjaGVkUGFpcnMucHVzaCh7XG4gICAgICAgIHBhZ2VOYW1lOiBkZXNrdG9wLm5hbWUsXG4gICAgICAgIHBhZ2VTbHVnOiBzbHVnaWZ5KGJhc2VOYW1lIHx8IGRlc2t0b3AubmFtZSksXG4gICAgICAgIGRlc2t0b3A6IHsgZnJhbWVJZDogZGVza3RvcC5pZCwgZnJhbWVOYW1lOiBkZXNrdG9wLm5hbWUsIHdpZHRoOiBkZXNrdG9wLndpZHRoIH0sXG4gICAgICAgIG1vYmlsZTogbW9iaWxlID8geyBmcmFtZUlkOiBtb2JpbGUuaWQsIGZyYW1lTmFtZTogbW9iaWxlLm5hbWUsIHdpZHRoOiBtb2JpbGUud2lkdGggfSA6IG51bGwsXG4gICAgICAgIHRhYmxldDogdGFibGV0ID8geyBmcmFtZUlkOiB0YWJsZXQuaWQsIGZyYW1lTmFtZTogdGFibGV0Lm5hbWUsIHdpZHRoOiB0YWJsZXQud2lkdGggfSA6IG51bGwsXG4gICAgICAgIG1hdGNoQ29uZmlkZW5jZTogMC45NSxcbiAgICAgICAgbWF0Y2hNZXRob2Q6ICduYW1lLXNpbWlsYXJpdHknLFxuICAgICAgfSk7XG4gICAgICBtYXRjaGVkSWRzLmFkZChkZXNrdG9wLmlkKTtcbiAgICAgIGlmIChtb2JpbGUpIG1hdGNoZWRJZHMuYWRkKG1vYmlsZS5pZCk7XG4gICAgICBpZiAodGFibGV0KSBtYXRjaGVkSWRzLmFkZCh0YWJsZXQuaWQpO1xuICAgIH1cblxuICAgIC8vIEFueSByZW1haW5pbmcgZnJhbWVzIGluIHRoaXMgZ3JvdXBcbiAgICBmb3IgKGNvbnN0IGZyYW1lIG9mIGZyYW1lcykge1xuICAgICAgaWYgKCFtYXRjaGVkSWRzLmhhcyhmcmFtZS5pZCkpIHtcbiAgICAgICAgdW5tYXRjaGVkRnJhbWVzLnB1c2goe1xuICAgICAgICAgIGZyYW1lSWQ6IGZyYW1lLmlkLFxuICAgICAgICAgIGZyYW1lTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgICB3aWR0aDogZnJhbWUud2lkdGgsXG4gICAgICAgICAgYnJlYWtwb2ludDogZnJhbWUuYnJlYWtwb2ludCxcbiAgICAgICAgICByZWFzb246ICdjb3VsZCBub3QgcGFpciB3aXRoIGRlc2t0b3AgZnJhbWUnLFxuICAgICAgICB9KTtcbiAgICAgICAgbWF0Y2hlZElkcy5hZGQoZnJhbWUuaWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIENhdGNoIGFueSBmcmFtZXMgbm90IHByb2Nlc3NlZFxuICBmb3IgKGNvbnN0IGZyYW1lIG9mIGFsbEZyYW1lcykge1xuICAgIGlmICghbWF0Y2hlZElkcy5oYXMoZnJhbWUuaWQpKSB7XG4gICAgICB1bm1hdGNoZWRGcmFtZXMucHVzaCh7XG4gICAgICAgIGZyYW1lSWQ6IGZyYW1lLmlkLFxuICAgICAgICBmcmFtZU5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgIHdpZHRoOiBmcmFtZS53aWR0aCxcbiAgICAgICAgYnJlYWtwb2ludDogZnJhbWUuYnJlYWtwb2ludCxcbiAgICAgICAgcmVhc29uOiAnbm90IG1hdGNoZWQgYnkgYW55IG1ldGhvZCcsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4geyBtYXRjaGVkUGFpcnMsIHVubWF0Y2hlZEZyYW1lcyB9O1xufVxuXG4vKipcbiAqIENvbnRlbnQtYmFzZWQgbWF0Y2hpbmcgZmFsbGJhY2s6IGNvbXBhcmUgY2hpbGQgbmFtZXMgYmV0d2VlbiB0d28gZnJhbWVzLlxuICogUmV0dXJucyBvdmVybGFwIHJhdGlvICgwLTEpLiA+MC42ID0gbGlrZWx5IHNhbWUgcGFnZSBhdCBkaWZmZXJlbnQgYnJlYWtwb2ludHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlQ29udGVudE92ZXJsYXAoZnJhbWVBOiBGcmFtZU5vZGUsIGZyYW1lQjogRnJhbWVOb2RlKTogbnVtYmVyIHtcbiAgY29uc3QgbmFtZXNBID0gbmV3IFNldChmcmFtZUEuY2hpbGRyZW4ubWFwKGMgPT4gYy5uYW1lLnRvTG93ZXJDYXNlKCkpKTtcbiAgY29uc3QgbmFtZXNCID0gbmV3IFNldChmcmFtZUIuY2hpbGRyZW4ubWFwKGMgPT4gYy5uYW1lLnRvTG93ZXJDYXNlKCkpKTtcblxuICBpZiAobmFtZXNBLnNpemUgPT09IDAgfHwgbmFtZXNCLnNpemUgPT09IDApIHJldHVybiAwO1xuXG4gIGxldCBvdmVybGFwID0gMDtcbiAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzQSkge1xuICAgIGlmIChuYW1lc0IuaGFzKG5hbWUpKSBvdmVybGFwKys7XG4gIH1cblxuICBjb25zdCB1bmlvblNpemUgPSBuZXcgU2V0KFsuLi5uYW1lc0EsIC4uLm5hbWVzQl0pLnNpemU7XG4gIHJldHVybiB1bmlvblNpemUgPiAwID8gb3ZlcmxhcCAvIHVuaW9uU2l6ZSA6IDA7XG59XG4iLCAiaW1wb3J0IHsgUGFnZUluZm8sIEZyYW1lSW5mbyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgY2xhc3NpZnlCcmVha3BvaW50IH0gZnJvbSAnLi9yZXNwb25zaXZlJztcblxuLyoqXG4gKiBEaXNjb3ZlciBhbGwgcGFnZXMgaW4gdGhlIEZpZ21hIGZpbGUuXG4gKiBFYWNoIHBhZ2UgY29udGFpbnMgZnJhbWVzIHRoYXQgcmVwcmVzZW50IGRlc2lnbiBhcnRib2FyZHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb3ZlclBhZ2VzKCk6IFBhZ2VJbmZvW10ge1xuICBjb25zdCBwYWdlczogUGFnZUluZm9bXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgcGFnZSBvZiBmaWdtYS5yb290LmNoaWxkcmVuKSB7XG4gICAgY29uc3QgZnJhbWVzID0gZGlzY292ZXJGcmFtZXMocGFnZSk7XG4gICAgaWYgKGZyYW1lcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYWdlcy5wdXNoKHtcbiAgICAgICAgaWQ6IHBhZ2UuaWQsXG4gICAgICAgIG5hbWU6IHBhZ2UubmFtZSxcbiAgICAgICAgZnJhbWVzLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhZ2VzO1xufVxuXG4vKipcbiAqIERpc2NvdmVyIGFsbCB0b3AtbGV2ZWwgZnJhbWVzIHdpdGhpbiBhIHBhZ2UuXG4gKiBGaWx0ZXJzIHRvIEZSQU1FLCBDT01QT05FTlRfU0VULCBhbmQgQ09NUE9ORU5UIG5vZGVzIHdpdGggbWVhbmluZ2Z1bCBkaW1lbnNpb25zLlxuICovXG5mdW5jdGlvbiBkaXNjb3ZlckZyYW1lcyhwYWdlOiBQYWdlTm9kZSk6IEZyYW1lSW5mb1tdIHtcbiAgY29uc3QgZnJhbWVzOiBGcmFtZUluZm9bXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgcGFnZS5jaGlsZHJlbikge1xuICAgIC8vIE9ubHkgaW5jbHVkZSB0b3AtbGV2ZWwgZnJhbWVzIChub3QgZ3JvdXBzLCB2ZWN0b3JzLCBldGMuKVxuICAgIGlmIChjaGlsZC50eXBlICE9PSAnRlJBTUUnICYmIGNoaWxkLnR5cGUgIT09ICdDT01QT05FTlQnICYmIGNoaWxkLnR5cGUgIT09ICdDT01QT05FTlRfU0VUJykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgZnJhbWUgPSBjaGlsZCBhcyBGcmFtZU5vZGU7XG5cbiAgICAvLyBTa2lwIHRpbnkgZnJhbWVzIChsaWtlbHkgaWNvbnMgb3IgY29tcG9uZW50cywgbm90IHBhZ2UgZGVzaWducylcbiAgICBpZiAoZnJhbWUud2lkdGggPCAzMDAgfHwgZnJhbWUuaGVpZ2h0IDwgMjAwKSBjb250aW51ZTtcblxuICAgIC8vIENvdW50IHZpc2libGUgc2VjdGlvbnMgKGRpcmVjdCBjaGlsZHJlbiB0aGF0IGFyZSBmcmFtZXMpXG4gICAgY29uc3Qgc2VjdGlvbkNvdW50ID0gZnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3guaGVpZ2h0ID4gNTBcbiAgICApLmxlbmd0aDtcblxuICAgIC8vIENoZWNrIGlmIGFueSBzZWN0aW9uIHVzZXMgYXV0by1sYXlvdXRcbiAgICBjb25zdCBoYXNBdXRvTGF5b3V0ID0gZnJhbWUubGF5b3V0TW9kZSAhPT0gdW5kZWZpbmVkICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJztcblxuICAgIGZyYW1lcy5wdXNoKHtcbiAgICAgIGlkOiBmcmFtZS5pZCxcbiAgICAgIG5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICB3aWR0aDogTWF0aC5yb3VuZChmcmFtZS53aWR0aCksXG4gICAgICBoZWlnaHQ6IE1hdGgucm91bmQoZnJhbWUuaGVpZ2h0KSxcbiAgICAgIGJyZWFrcG9pbnQ6IGNsYXNzaWZ5QnJlYWtwb2ludChNYXRoLnJvdW5kKGZyYW1lLndpZHRoKSksXG4gICAgICBzZWN0aW9uQ291bnQsXG4gICAgICBoYXNBdXRvTGF5b3V0LFxuICAgICAgcmVzcG9uc2l2ZVBhaXJJZDogbnVsbCxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBmcmFtZXM7XG59XG4iLCAiaW1wb3J0IHsgVmFsaWRhdGlvblJlc3VsdCwgRnJhbWVJbmZvIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBpc0RlZmF1bHRMYXllck5hbWUgfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBSdW4gYWxsIDkgdmFsaWRhdGlvbiBjaGVja3MgYWdhaW5zdCBzZWxlY3RlZCBmcmFtZXMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5BbGxWYWxpZGF0aW9ucyhmcmFtZUlkczogc3RyaW5nW10pOiBQcm9taXNlPFZhbGlkYXRpb25SZXN1bHRbXT4ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGZyYW1lSWQgb2YgZnJhbWVJZHMpIHtcbiAgICBjb25zdCBub2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQoZnJhbWVJZCk7XG4gICAgaWYgKCFub2RlIHx8IG5vZGUudHlwZSAhPT0gJ0ZSQU1FJykgY29udGludWU7XG5cbiAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgIGNvbnN0IHNlY3Rpb25zID0gZnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKVxuICAgICk7XG5cbiAgICAvLyBDaGVjayAxOiBNaXNzaW5nIGF1dG8tbGF5b3V0IG9uIHNlY3Rpb25zXG4gICAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrQXV0b0xheW91dChzZWN0aW9ucywgZnJhbWUubmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgMjogRGVmYXVsdCBsYXllciBuYW1lc1xuICAgIHJlc3VsdHMucHVzaCguLi5jaGVja0xheWVyTmFtZXMoc2VjdGlvbnMsIGZyYW1lLm5hbWUpKTtcblxuICAgIC8vIENoZWNrIDM6IE1pc3NpbmcgZm9udHNcbiAgICByZXN1bHRzLnB1c2goLi4uYXdhaXQgY2hlY2tGb250cyhmcmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgNDogSW5jb25zaXN0ZW50IHNwYWNpbmdcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tTcGFjaW5nQ29uc2lzdGVuY3koZnJhbWUpKTtcblxuICAgIC8vIENoZWNrIDU6IE92ZXJzaXplZCBpbWFnZXNcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tPdmVyc2l6ZWRJbWFnZXMoZnJhbWUpKTtcblxuICAgIC8vIENoZWNrIDY6IE92ZXJsYXBwaW5nIHNlY3Rpb25zXG4gICAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrT3ZlcmxhcHMoc2VjdGlvbnMsIGZyYW1lLm5hbWUpKTtcblxuICAgIC8vIENoZWNrIDk6IFRleHQgb3ZlcmZsb3dcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tUZXh0T3ZlcmZsb3coZnJhbWUpKTtcbiAgfVxuXG4gIC8vIENoZWNrIDc6IE1pc3NpbmcgcmVzcG9uc2l2ZSBmcmFtZXMgKGNyb3NzLWZyYW1lIGNoZWNrKVxuICByZXN1bHRzLnB1c2goLi4uY2hlY2tSZXNwb25zaXZlRnJhbWVzKGZyYW1lSWRzKSk7XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayAxOiBNaXNzaW5nIEF1dG8tTGF5b3V0IFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja0F1dG9MYXlvdXQoc2VjdGlvbnM6IFNjZW5lTm9kZVtdLCBmcmFtZU5hbWU6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2Ygc2VjdGlvbnMpIHtcbiAgICBpZiAoc2VjdGlvbi50eXBlID09PSAnRlJBTUUnIHx8IHNlY3Rpb24udHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgc2VjdGlvbi50eXBlID09PSAnSU5TVEFOQ0UnKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IHNlY3Rpb24gYXMgRnJhbWVOb2RlO1xuICAgICAgaWYgKCFmcmFtZS5sYXlvdXRNb2RlIHx8IGZyYW1lLmxheW91dE1vZGUgPT09ICdOT05FJykge1xuICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICAgICAgY2hlY2s6ICdhdXRvLWxheW91dCcsXG4gICAgICAgICAgbWVzc2FnZTogYFNlY3Rpb24gXCIke3NlY3Rpb24ubmFtZX1cIiB1c2VzIGFic29sdXRlIHBvc2l0aW9uaW5nLiBTcGFjaW5nIHZhbHVlcyB3aWxsIGJlIGFwcHJveGltYXRlLmAsXG4gICAgICAgICAgc2VjdGlvbk5hbWU6IHNlY3Rpb24ubmFtZSxcbiAgICAgICAgICBub2RlSWQ6IHNlY3Rpb24uaWQsXG4gICAgICAgICAgbm9kZU5hbWU6IHNlY3Rpb24ubmFtZSxcbiAgICAgICAgICBzdWdnZXN0aW9uOiAnQXBwbHkgYXV0by1sYXlvdXQgdG8gdGhpcyBzZWN0aW9uIGZvciBwcmVjaXNlIHNwYWNpbmcgZXh0cmFjdGlvbi4nLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayAyOiBEZWZhdWx0IExheWVyIE5hbWVzIFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja0xheWVyTmFtZXMoc2VjdGlvbnM6IFNjZW5lTm9kZVtdLCBmcmFtZU5hbWU6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgaWYgKGlzRGVmYXVsdExheWVyTmFtZShub2RlLm5hbWUpKSB7XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogZGVwdGggPT09IDAgPyAnd2FybmluZycgOiAnaW5mbycsXG4gICAgICAgIGNoZWNrOiAnbGF5ZXItbmFtZXMnLFxuICAgICAgICBtZXNzYWdlOiBgTGF5ZXIgXCIke25vZGUubmFtZX1cIiBoYXMgYSBkZWZhdWx0IEZpZ21hIG5hbWUke2RlcHRoID09PSAwID8gJyAoc2VjdGlvbiBsZXZlbCknIDogJyd9LmAsXG4gICAgICAgIHNlY3Rpb25OYW1lOiBmcmFtZU5hbWUsXG4gICAgICAgIG5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgbm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgc3VnZ2VzdGlvbjogJ1JlbmFtZSB0byBhIGRlc2NyaXB0aXZlIG5hbWUgKGUuZy4sIFwiSGVybyBTZWN0aW9uXCIsIFwiRmVhdHVyZXMgR3JpZFwiKS4nLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUgJiYgZGVwdGggPCAyKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCwgZGVwdGggKyAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2Ygc2VjdGlvbnMpIHtcbiAgICB3YWxrKHNlY3Rpb24sIDApO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgMzogTWlzc2luZyBGb250cyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuYXN5bmMgZnVuY3Rpb24gY2hlY2tGb250cyhmcmFtZTogRnJhbWVOb2RlKTogUHJvbWlzZTxWYWxpZGF0aW9uUmVzdWx0W10+IHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG4gIGNvbnN0IGNoZWNrZWRGb250cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZ1bmN0aW9uIGNvbGxlY3RGb250TmFtZXMobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCBmb250TmFtZSA9IG5vZGUuZm9udE5hbWU7XG4gICAgICBpZiAoZm9udE5hbWUgIT09IGZpZ21hLm1peGVkICYmIGZvbnROYW1lKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGAke2ZvbnROYW1lLmZhbWlseX06OiR7Zm9udE5hbWUuc3R5bGV9YDtcbiAgICAgICAgaWYgKCFjaGVja2VkRm9udHMuaGFzKGtleSkpIHtcbiAgICAgICAgICBjaGVja2VkRm9udHMuYWRkKGtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIGNvbGxlY3RGb250TmFtZXMoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbGxlY3RGb250TmFtZXMoZnJhbWUpO1xuXG4gIGZvciAoY29uc3QgZm9udEtleSBvZiBjaGVja2VkRm9udHMpIHtcbiAgICBjb25zdCBbZmFtaWx5LCBzdHlsZV0gPSBmb250S2V5LnNwbGl0KCc6OicpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmaWdtYS5sb2FkRm9udEFzeW5jKHsgZmFtaWx5LCBzdHlsZSB9KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InLFxuICAgICAgICBjaGVjazogJ2ZvbnRzJyxcbiAgICAgICAgbWVzc2FnZTogYEZvbnQgXCIke2ZhbWlseX0gJHtzdHlsZX1cIiBpcyBub3QgYXZhaWxhYmxlLiBUZXh0IGV4dHJhY3Rpb24gbWF5IGZhaWwuYCxcbiAgICAgICAgc2VjdGlvbk5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgIHN1Z2dlc3Rpb246ICdJbnN0YWxsIHRoZSBmb250IG9yIHJlcGxhY2UgaXQgaW4gdGhlIGRlc2lnbi4nLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgNDogSW5jb25zaXN0ZW50IFNwYWNpbmcgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrU3BhY2luZ0NvbnNpc3RlbmN5KGZyYW1lOiBGcmFtZU5vZGUpOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcbiAgY29uc3Qgc3BhY2luZ1ZhbHVlczogbnVtYmVyW10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScpIHtcbiAgICAgIGNvbnN0IGYgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgIGlmIChmLmxheW91dE1vZGUgJiYgZi5sYXlvdXRNb2RlICE9PSAnTk9ORScpIHtcbiAgICAgICAgc3BhY2luZ1ZhbHVlcy5wdXNoKGYucGFkZGluZ1RvcCwgZi5wYWRkaW5nQm90dG9tLCBmLnBhZGRpbmdMZWZ0LCBmLnBhZGRpbmdSaWdodCwgZi5pdGVtU3BhY2luZyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2FsayhmcmFtZSk7XG5cbiAgLy8gRmluZCBuZWFyLWR1cGxpY2F0ZXNcbiAgY29uc3QgdW5pcXVlID0gWy4uLm5ldyBTZXQoc3BhY2luZ1ZhbHVlcy5maWx0ZXIodiA9PiB2ID4gMCkpXS5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdW5pcXVlLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGNvbnN0IGRpZmYgPSB1bmlxdWVbaSArIDFdIC0gdW5pcXVlW2ldO1xuICAgIGlmIChkaWZmID4gMCAmJiBkaWZmIDw9IDIpIHtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiAnaW5mbycsXG4gICAgICAgIGNoZWNrOiAnc3BhY2luZy1jb25zaXN0ZW5jeScsXG4gICAgICAgIG1lc3NhZ2U6IGBOZWFyLWR1cGxpY2F0ZSBzcGFjaW5nOiAke3VuaXF1ZVtpXX1weCBhbmQgJHt1bmlxdWVbaSArIDFdfXB4IFx1MjAxNCBsaWtlbHkgc2FtZSBpbnRlbnQ/YCxcbiAgICAgICAgc2VjdGlvbk5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgIHN1Z2dlc3Rpb246IGBDb25zaWRlciBzdGFuZGFyZGl6aW5nIHRvICR7TWF0aC5yb3VuZCgodW5pcXVlW2ldICsgdW5pcXVlW2kgKyAxXSkgLyAyKX1weC5gLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgNTogT3ZlcnNpemVkIEltYWdlcyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tPdmVyc2l6ZWRJbWFnZXMoZnJhbWU6IEZyYW1lTm9kZSk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdmaWxscycgaW4gbm9kZSkge1xuICAgICAgY29uc3QgZmlsbHMgPSAobm9kZSBhcyBhbnkpLmZpbGxzO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZmlsbHMpKSB7XG4gICAgICAgIGZvciAoY29uc3QgZmlsbCBvZiBmaWxscykge1xuICAgICAgICAgIGlmIChmaWxsLnR5cGUgPT09ICdJTUFHRScgJiYgZmlsbC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgY29uc3QgYm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgICAgICAgaWYgKGJvdW5kcykge1xuICAgICAgICAgICAgICAvLyBFc3RpbWF0ZSByYXcgaW1hZ2Ugc2l6ZSAoUkdCQSBhdCAyeCk6IHcgKiAyICogaCAqIDIgKiA0IGJ5dGVzXG4gICAgICAgICAgICAgIC8vIEVzdGltYXRlIGF0IDF4IGV4cG9ydDogd2lkdGggKiBoZWlnaHQgKiA0IChSR0JBIGJ5dGVzKVxuICAgICAgICAgICAgICBjb25zdCBlc3RpbWF0ZWRCeXRlcyA9IGJvdW5kcy53aWR0aCAqIGJvdW5kcy5oZWlnaHQgKiA0O1xuICAgICAgICAgICAgICBjb25zdCBlc3RpbWF0ZWRNQiA9IGVzdGltYXRlZEJ5dGVzIC8gKDEwMjQgKiAxMDI0KTtcbiAgICAgICAgICAgICAgaWYgKGVzdGltYXRlZE1CID4gNSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgICAgICAgICAgICAgY2hlY2s6ICdpbWFnZS1zaXplJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBJbWFnZSBpbiBcIiR7bm9kZS5uYW1lfVwiIGlzIGVzdGltYXRlZCBhdCAke2VzdGltYXRlZE1CLnRvRml4ZWQoMSl9TUIgYXQgMXggZXhwb3J0LmAsXG4gICAgICAgICAgICAgICAgICBub2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgICAgICAgICBub2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgc3VnZ2VzdGlvbjogJ0NvbnNpZGVyIHJlZHVjaW5nIGltYWdlIGRpbWVuc2lvbnMgb3IgZXhwb3J0IHNjYWxlLicsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKGZyYW1lKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayA2OiBPdmVybGFwcGluZyBTZWN0aW9ucyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tPdmVybGFwcyhzZWN0aW9uczogU2NlbmVOb2RlW10sIGZyYW1lTmFtZTogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG4gIGNvbnN0IHNvcnRlZCA9IFsuLi5zZWN0aW9uc11cbiAgICAuZmlsdGVyKHMgPT4gcy5hYnNvbHV0ZUJvdW5kaW5nQm94KVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc29ydGVkLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGNvbnN0IGN1cnIgPSBzb3J0ZWRbaV0uYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gICAgY29uc3QgbmV4dCA9IHNvcnRlZFtpICsgMV0uYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gICAgY29uc3Qgb3ZlcmxhcCA9IChjdXJyLnkgKyBjdXJyLmhlaWdodCkgLSBuZXh0Lnk7XG4gICAgaWYgKG92ZXJsYXAgPiAwKSB7XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgICBjaGVjazogJ292ZXJsYXAnLFxuICAgICAgICBtZXNzYWdlOiBgU2VjdGlvbiBcIiR7c29ydGVkW2ldLm5hbWV9XCIgb3ZlcmxhcHMgd2l0aCBcIiR7c29ydGVkW2kgKyAxXS5uYW1lfVwiIGJ5ICR7TWF0aC5yb3VuZChvdmVybGFwKX1weC5gLFxuICAgICAgICBzZWN0aW9uTmFtZTogc29ydGVkW2ldLm5hbWUsXG4gICAgICAgIG5vZGVJZDogc29ydGVkW2ldLmlkLFxuICAgICAgICBzdWdnZXN0aW9uOiAnVGhlIHBsdWdpbiB3aWxsIHJlY29yZCB0aGlzIGFzIGEgbmVnYXRpdmUgbWFyZ2luLiBWZXJpZnkgdGhlIHZpc3VhbCByZXN1bHQuJyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDc6IE1pc3NpbmcgUmVzcG9uc2l2ZSBGcmFtZXMgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrUmVzcG9uc2l2ZUZyYW1lcyhmcmFtZUlkczogc3RyaW5nW10pOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcbiAgY29uc3QgZnJhbWVzID0gZnJhbWVJZHNcbiAgICAubWFwKGlkID0+IGZpZ21hLmdldE5vZGVCeUlkKGlkKSlcbiAgICAuZmlsdGVyKG4gPT4gbiAmJiBuLnR5cGUgPT09ICdGUkFNRScpIGFzIEZyYW1lTm9kZVtdO1xuXG4gIGNvbnN0IGRlc2t0b3BGcmFtZXMgPSBmcmFtZXMuZmlsdGVyKGYgPT4gZi53aWR0aCA+IDEwMjQpO1xuICBjb25zdCBtb2JpbGVGcmFtZXMgPSBmcmFtZXMuZmlsdGVyKGYgPT4gZi53aWR0aCA8PSA0ODApO1xuXG4gIGlmIChkZXNrdG9wRnJhbWVzLmxlbmd0aCA+IDAgJiYgbW9iaWxlRnJhbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgY2hlY2s6ICdyZXNwb25zaXZlJyxcbiAgICAgIG1lc3NhZ2U6IGBPbmx5IGRlc2t0b3AgZnJhbWVzIHNlbGVjdGVkIChubyBtb2JpbGUgZnJhbWVzKS4gUmVzcG9uc2l2ZSB2YWx1ZXMgd2lsbCBiZSBjYWxjdWxhdGVkLCBub3QgZXh0cmFjdGVkLmAsXG4gICAgICBzdWdnZXN0aW9uOiAnSW5jbHVkZSBtb2JpbGUgKDM3NXB4KSBmcmFtZXMgZm9yIGV4YWN0IHJlc3BvbnNpdmUgdmFsdWVzLicsXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayA5OiBUZXh0IE92ZXJmbG93IFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja1RleHRPdmVyZmxvdyhmcmFtZTogRnJhbWVOb2RlKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcgJiYgbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmIG5vZGUucGFyZW50ICYmICdhYnNvbHV0ZUJvdW5kaW5nQm94JyBpbiBub2RlLnBhcmVudCkge1xuICAgICAgY29uc3QgdGV4dEJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgIGNvbnN0IHBhcmVudEJvdW5kcyA9IChub2RlLnBhcmVudCBhcyBGcmFtZU5vZGUpLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICBpZiAocGFyZW50Qm91bmRzKSB7XG4gICAgICAgIGNvbnN0IG92ZXJmbG93UmlnaHQgPSAodGV4dEJvdW5kcy54ICsgdGV4dEJvdW5kcy53aWR0aCkgLSAocGFyZW50Qm91bmRzLnggKyBwYXJlbnRCb3VuZHMud2lkdGgpO1xuICAgICAgICBjb25zdCBvdmVyZmxvd0JvdHRvbSA9ICh0ZXh0Qm91bmRzLnkgKyB0ZXh0Qm91bmRzLmhlaWdodCkgLSAocGFyZW50Qm91bmRzLnkgKyBwYXJlbnRCb3VuZHMuaGVpZ2h0KTtcbiAgICAgICAgaWYgKG92ZXJmbG93UmlnaHQgPiA1IHx8IG92ZXJmbG93Qm90dG9tID4gNSkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgICAgICAgY2hlY2s6ICd0ZXh0LW92ZXJmbG93JyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBUZXh0IFwiJHtub2RlLm5hbWV9XCIgb3ZlcmZsb3dzIGl0cyBjb250YWluZXIgYnkgJHtNYXRoLm1heChNYXRoLnJvdW5kKG92ZXJmbG93UmlnaHQpLCBNYXRoLnJvdW5kKG92ZXJmbG93Qm90dG9tKSl9cHguYCxcbiAgICAgICAgICAgIG5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICAgIG5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICBzdWdnZXN0aW9uOiAnUmVzaXplIHRoZSB0ZXh0IGNvbnRhaW5lciBvciByZWR1Y2UgdGV4dCBjb250ZW50LicsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKGZyYW1lKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59XG4iLCAiLyoqXG4gKiBDb252ZXJ0IGEgc2luZ2xlIEZpZ21hIDAtMSBmbG9hdCBjaGFubmVsIHRvIGEgMi1kaWdpdCBoZXggc3RyaW5nLlxuICogVXNlcyBNYXRoLnJvdW5kKCkgZm9yIHByZWNpc2lvbiAoTk9UIE1hdGguZmxvb3IoKSkuXG4gKi9cbmZ1bmN0aW9uIGNoYW5uZWxUb0hleCh2YWx1ZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiAyNTUpLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpLnRvVXBwZXJDYXNlKCk7XG59XG5cbi8qKlxuICogQ29udmVydCBGaWdtYSBSR0IgKDAtMSBmbG9hdCkgdG8gNi1kaWdpdCB1cHBlcmNhc2UgSEVYLlxuICogeyByOiAwLjA4NiwgZzogMC4yMiwgYjogMC45ODQgfSBcdTIxOTIgXCIjMTYzOEZCXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJnYlRvSGV4KGNvbG9yOiB7IHI6IG51bWJlcjsgZzogbnVtYmVyOyBiOiBudW1iZXIgfSk6IHN0cmluZyB7XG4gIHJldHVybiBgIyR7Y2hhbm5lbFRvSGV4KGNvbG9yLnIpfSR7Y2hhbm5lbFRvSGV4KGNvbG9yLmcpfSR7Y2hhbm5lbFRvSGV4KGNvbG9yLmIpfWA7XG59XG5cbi8qKlxuICogQ29udmVydCBGaWdtYSBSR0JBICgwLTEgZmxvYXQpIHRvIEhFWC5cbiAqIFJldHVybnMgNi1kaWdpdCBIRVggaWYgZnVsbHkgb3BhcXVlLCA4LWRpZ2l0IEhFWCBpZiBhbHBoYSA8IDEuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZ2JhVG9IZXgoY29sb3I6IHsgcjogbnVtYmVyOyBnOiBudW1iZXI7IGI6IG51bWJlciB9LCBvcGFjaXR5OiBudW1iZXIgPSAxKTogc3RyaW5nIHtcbiAgY29uc3QgYmFzZSA9IHJnYlRvSGV4KGNvbG9yKTtcbiAgaWYgKG9wYWNpdHkgPj0gMSkgcmV0dXJuIGJhc2U7XG4gIHJldHVybiBgJHtiYXNlfSR7Y2hhbm5lbFRvSGV4KG9wYWNpdHkpfWA7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgcHJpbWFyeSBiYWNrZ3JvdW5kIGNvbG9yIGZyb20gYSBub2RlJ3MgZmlsbHMuXG4gKiBSZXR1cm5zIDYvOC1kaWdpdCBIRVggb3IgbnVsbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3Iobm9kZTogU2NlbmVOb2RlICYgeyBmaWxscz86IHJlYWRvbmx5IFBhaW50W10gfSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoISgnZmlsbHMnIGluIG5vZGUpIHx8ICFub2RlLmZpbGxzIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZmlsbHMpKSByZXR1cm4gbnVsbDtcblxuICBmb3IgKGNvbnN0IGZpbGwgb2Ygbm9kZS5maWxscykge1xuICAgIGlmIChmaWxsLnR5cGUgPT09ICdTT0xJRCcgJiYgZmlsbC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgY29uc3Qgb3BhY2l0eSA9IGZpbGwub3BhY2l0eSAhPT0gdW5kZWZpbmVkID8gZmlsbC5vcGFjaXR5IDogMTtcbiAgICAgIHJldHVybiByZ2JhVG9IZXgoZmlsbC5jb2xvciwgb3BhY2l0eSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIHRleHQgY29sb3IgZnJvbSBhIFRFWFQgbm9kZSdzIGZpbGxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFRleHRDb2xvcihub2RlOiBUZXh0Tm9kZSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiBudWxsO1xuXG4gIGZvciAoY29uc3QgZmlsbCBvZiBub2RlLmZpbGxzIGFzIHJlYWRvbmx5IFBhaW50W10pIHtcbiAgICBpZiAoZmlsbC50eXBlID09PSAnU09MSUQnICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiByZ2JUb0hleChmaWxsLmNvbG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRGVjb2RlIHRoZSBDU1MgZ3JhZGllbnQgYW5nbGUgZnJvbSBGaWdtYSdzIGBncmFkaWVudFRyYW5zZm9ybWAgbWF0cml4LlxuICpcbiAqIEZpZ21hJ3MgZ3JhZGllbnRUcmFuc2Zvcm0gaXMgYSAyXHUwMEQ3MyBhZmZpbmUgbWF0cml4IHRoYXQgbWFwcyBhY3R1YWxcbiAqIGNvb3JkaW5hdGVzIGJhY2sgdG8gdGhlIHVuaXQgZ3JhZGllbnQgbGluZSAoMCwwKVx1MjE5MigxLDApLiBJbnZlcnRpbmcgdGhlXG4gKiBsaW5lYXIgcGFydCBnaXZlcyB0aGUgZ3JhZGllbnQgZGlyZWN0aW9uIGluIGFjdHVhbCBjb29yZGluYXRlcy4gV2UgdGhlblxuICogY29udmVydCB0aGF0IHZlY3RvciB0byBhIENTUyBhbmdsZSwgd2hlcmUgMGRlZyA9IFwidG8gdG9wXCIgYW5kIGFuZ2xlc1xuICogaW5jcmVhc2UgY2xvY2t3aXNlLlxuICpcbiAqIFJldHVybnMgMTgwICh0aGUgQ1NTIGRlZmF1bHQgZm9yIHRvcC10by1ib3R0b20pIHdoZW4gdGhlIG1hdHJpeCBpc1xuICogYWJzZW50IG9yIHNpbmd1bGFyLCBzbyBvdXRwdXQgc3RheXMgc2Vuc2libGUgb24gZWRnZS1jYXNlIGZpbGxzLlxuICovXG5mdW5jdGlvbiBncmFkaWVudEFuZ2xlRnJvbVRyYW5zZm9ybSh0OiBudW1iZXJbXVtdIHwgdW5kZWZpbmVkKTogbnVtYmVyIHtcbiAgaWYgKCF0IHx8ICFBcnJheS5pc0FycmF5KHQpIHx8IHQubGVuZ3RoIDwgMikgcmV0dXJuIDE4MDtcbiAgY29uc3QgYSA9IHRbMF1bMF0sIGIgPSB0WzBdWzFdO1xuICBjb25zdCBjID0gdFsxXVswXSwgZCA9IHRbMV1bMV07XG4gIGNvbnN0IGRldCA9IGEgKiBkIC0gYiAqIGM7XG4gIGlmIChNYXRoLmFicyhkZXQpIDwgMWUtOSkgcmV0dXJuIDE4MDtcbiAgLy8gRGlyZWN0aW9uIHZlY3RvciBpbiBhY3R1YWwgY29vcmRpbmF0ZXM6IGludihsaW5lYXIpICogKDEsIDApID0gKGQvZGV0LCAtYy9kZXQpXG4gIGNvbnN0IHZ4ID0gZCAvIGRldDtcbiAgY29uc3QgdnkgPSAtYyAvIGRldDtcbiAgLy8gQ1NTIGFuZ2xlOiAwZGVnID0gdXAsICs5MCA9IHJpZ2h0LCArMTgwID0gZG93bi4gYXRhbjIodngsIC12eSkgZ2l2ZXMgdGhhdC5cbiAgbGV0IGRlZyA9IE1hdGguYXRhbjIodngsIC12eSkgKiAoMTgwIC8gTWF0aC5QSSk7XG4gIGlmIChkZWcgPCAwKSBkZWcgKz0gMzYwO1xuICByZXR1cm4gTWF0aC5yb3VuZChkZWcpO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgZ3JhZGllbnQgYXMgQ1NTIHN0cmluZywgb3IgbnVsbCBpZiBub3QgYSBncmFkaWVudC5cbiAqXG4gKiBTdXBwb3J0cyBsaW5lYXIsIHJhZGlhbCwgYW5ndWxhciAoQ1NTIGNvbmljLWdyYWRpZW50KSwgYW5kIGRpYW1vbmRcbiAqIChhcHByb3hpbWF0ZWQgd2l0aCByYWRpYWwtZ3JhZGllbnQgXHUyMDE0IG5vIGV4YWN0IENTUyBlcXVpdmFsZW50KS4gVGhlXG4gKiBhbmdsZSBvZiBsaW5lYXIgZ3JhZGllbnRzIGlzIGRlY29kZWQgZnJvbSBgZ3JhZGllbnRUcmFuc2Zvcm1gLCBzb1xuICogYGxpbmVhci1ncmFkaWVudCg0NWRlZywgXHUyMDI2KWAgYW5kIGBsaW5lYXItZ3JhZGllbnQoMjI1ZGVnLCBcdTIwMjYpYCBub1xuICogbG9uZ2VyIGNvbGxhcHNlIHRvIHRoZSBkZWZhdWx0IGRpcmVjdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RHcmFkaWVudChub2RlOiBTY2VuZU5vZGUgJiB7IGZpbGxzPzogcmVhZG9ubHkgUGFpbnRbXSB9KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghKCdmaWxscycgaW4gbm9kZSkgfHwgIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiBudWxsO1xuXG4gIGZvciAoY29uc3QgZmlsbCBvZiBub2RlLmZpbGxzKSB7XG4gICAgaWYgKGZpbGwudmlzaWJsZSA9PT0gZmFsc2UpIGNvbnRpbnVlO1xuICAgIGlmIChmaWxsLnR5cGUgPT09ICdHUkFESUVOVF9MSU5FQVInIHx8IGZpbGwudHlwZSA9PT0gJ0dSQURJRU5UX1JBRElBTCcgfHxcbiAgICAgICAgZmlsbC50eXBlID09PSAnR1JBRElFTlRfQU5HVUxBUicgfHwgZmlsbC50eXBlID09PSAnR1JBRElFTlRfRElBTU9ORCcpIHtcbiAgICAgIGNvbnN0IGcgPSBmaWxsIGFzIEdyYWRpZW50UGFpbnQ7XG4gICAgICBjb25zdCBzdG9wcyA9IGcuZ3JhZGllbnRTdG9wc1xuICAgICAgICAubWFwKHMgPT4gYCR7cmdiVG9IZXgocy5jb2xvcil9ICR7TWF0aC5yb3VuZChzLnBvc2l0aW9uICogMTAwKX0lYClcbiAgICAgICAgLmpvaW4oJywgJyk7XG4gICAgICBjb25zdCBvcGFjaXR5ID0gKGcgYXMgYW55KS5vcGFjaXR5O1xuICAgICAgY29uc3Qgc3RvcHNXaXRoQWxwaGEgPSBvcGFjaXR5ICE9PSB1bmRlZmluZWQgJiYgb3BhY2l0eSA8IDFcbiAgICAgICAgPyBnLmdyYWRpZW50U3RvcHMubWFwKHMgPT4ge1xuICAgICAgICAgICAgY29uc3QgYSA9IChzLmNvbG9yLmEgPz8gMSkgKiBvcGFjaXR5O1xuICAgICAgICAgICAgcmV0dXJuIGByZ2JhKCR7TWF0aC5yb3VuZChzLmNvbG9yLnIgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKHMuY29sb3IuZyAqIDI1NSl9LCAke01hdGgucm91bmQocy5jb2xvci5iICogMjU1KX0sICR7TWF0aC5yb3VuZChhICogMTAwKSAvIDEwMH0pICR7TWF0aC5yb3VuZChzLnBvc2l0aW9uICogMTAwKX0lYDtcbiAgICAgICAgICB9KS5qb2luKCcsICcpXG4gICAgICAgIDogc3RvcHM7XG5cbiAgICAgIHN3aXRjaCAoZmlsbC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ0dSQURJRU5UX0xJTkVBUic6IHtcbiAgICAgICAgICBjb25zdCBhbmdsZSA9IGdyYWRpZW50QW5nbGVGcm9tVHJhbnNmb3JtKChnIGFzIGFueSkuZ3JhZGllbnRUcmFuc2Zvcm0pO1xuICAgICAgICAgIHJldHVybiBgbGluZWFyLWdyYWRpZW50KCR7YW5nbGV9ZGVnLCAke3N0b3BzV2l0aEFscGhhfSlgO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ0dSQURJRU5UX1JBRElBTCc6XG4gICAgICAgICAgcmV0dXJuIGByYWRpYWwtZ3JhZGllbnQoJHtzdG9wc1dpdGhBbHBoYX0pYDtcbiAgICAgICAgY2FzZSAnR1JBRElFTlRfQU5HVUxBUic6XG4gICAgICAgICAgLy8gRmlnbWEncyBhbmd1bGFyID0gQ1NTIGNvbmljLWdyYWRpZW50LiBUaGUgYGZyb21gIGFuZ2xlIGNvdWxkIGJlXG4gICAgICAgICAgLy8gZGVjb2RlZCBmcm9tIGdyYWRpZW50VHJhbnNmb3JtIHRvbywgYnV0IG1vc3QgYWdlbnRzIGFyZSBoYXBweVxuICAgICAgICAgIC8vIHdpdGggdGhlIGRlZmF1bHQgc3RhcnRpbmcgYW5nbGUuIFJlZmluZSBpZiBuZWVkZWQuXG4gICAgICAgICAgcmV0dXJuIGBjb25pYy1ncmFkaWVudCgke3N0b3BzV2l0aEFscGhhfSlgO1xuICAgICAgICBjYXNlICdHUkFESUVOVF9ESUFNT05EJzpcbiAgICAgICAgICAvLyBObyBleGFjdCBDU1MgZXF1aXZhbGVudDsgY2xvc2VzdCBpcyByYWRpYWwtZ3JhZGllbnQuIEFnZW50IHNob3VsZFxuICAgICAgICAgIC8vIGJlIGF3YXJlIHRoaXMgaXMgYW4gYXBwcm94aW1hdGlvbiAoZGlhbW9uZCBcdTIyNjAgcmFkaWFsIGNpcmNsZSkuXG4gICAgICAgICAgcmV0dXJuIGByYWRpYWwtZ3JhZGllbnQoJHtzdG9wc1dpdGhBbHBoYX0pIC8qIGFwcHJveGltYXRlZCBmcm9tIEZpZ21hIGRpYW1vbmQgZ3JhZGllbnQgKi9gO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBNYXAgRmlnbWEncyBzdHJva2VBbGlnbiAoJ0lOU0lERScgfCAnT1VUU0lERScgfCAnQ0VOVEVSJykgdG8gYSBsb3dlcmNhc2VcbiAqIENTUy1mcmllbmRseSB0b2tlbi4gUmV0dXJucyBudWxsIHdoZW4gdGhlIG5vZGUgaGFzIG5vIHJlc29sdmFibGUgc3Ryb2tlQWxpZ24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0U3Ryb2tlQWxpZ24obm9kZTogYW55KTogJ2luc2lkZScgfCAnb3V0c2lkZScgfCAnY2VudGVyJyB8IG51bGwge1xuICBjb25zdCBzID0gbm9kZT8uc3Ryb2tlQWxpZ247XG4gIGlmIChzID09PSAnSU5TSURFJykgcmV0dXJuICdpbnNpZGUnO1xuICBpZiAocyA9PT0gJ09VVFNJREUnKSByZXR1cm4gJ291dHNpZGUnO1xuICBpZiAocyA9PT0gJ0NFTlRFUicpIHJldHVybiAnY2VudGVyJztcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogTWFwIEZpZ21hJ3MgYmxlbmRNb2RlIHRvIENTUyBgbWl4LWJsZW5kLW1vZGVgLiBSZXR1cm5zIG51bGwgZm9yIE5PUk1BTFxuICogYW5kIFBBU1NfVEhST1VHSCAod2hpY2ggYXJlIENTUyBkZWZhdWx0cykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0TWl4QmxlbmRNb2RlKG5vZGU6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBibSA9IG5vZGU/LmJsZW5kTW9kZTtcbiAgaWYgKCFibSB8fCB0eXBlb2YgYm0gIT09ICdzdHJpbmcnKSByZXR1cm4gbnVsbDtcbiAgc3dpdGNoIChibSkge1xuICAgIGNhc2UgJ05PUk1BTCc6XG4gICAgY2FzZSAnUEFTU19USFJPVUdIJzpcbiAgICAgIHJldHVybiBudWxsO1xuICAgIGNhc2UgJ01VTFRJUExZJzogcmV0dXJuICdtdWx0aXBseSc7XG4gICAgY2FzZSAnU0NSRUVOJzogcmV0dXJuICdzY3JlZW4nO1xuICAgIGNhc2UgJ09WRVJMQVknOiByZXR1cm4gJ292ZXJsYXknO1xuICAgIGNhc2UgJ0RBUktFTic6IHJldHVybiAnZGFya2VuJztcbiAgICBjYXNlICdMSUdIVEVOJzogcmV0dXJuICdsaWdodGVuJztcbiAgICBjYXNlICdDT0xPUl9ET0RHRSc6IHJldHVybiAnY29sb3ItZG9kZ2UnO1xuICAgIGNhc2UgJ0NPTE9SX0JVUk4nOiByZXR1cm4gJ2NvbG9yLWJ1cm4nO1xuICAgIGNhc2UgJ0hBUkRfTElHSFQnOiByZXR1cm4gJ2hhcmQtbGlnaHQnO1xuICAgIGNhc2UgJ1NPRlRfTElHSFQnOiByZXR1cm4gJ3NvZnQtbGlnaHQnO1xuICAgIGNhc2UgJ0RJRkZFUkVOQ0UnOiByZXR1cm4gJ2RpZmZlcmVuY2UnO1xuICAgIGNhc2UgJ0VYQ0xVU0lPTic6IHJldHVybiAnZXhjbHVzaW9uJztcbiAgICBjYXNlICdIVUUnOiByZXR1cm4gJ2h1ZSc7XG4gICAgY2FzZSAnU0FUVVJBVElPTic6IHJldHVybiAnc2F0dXJhdGlvbic7XG4gICAgY2FzZSAnQ09MT1InOiByZXR1cm4gJ2NvbG9yJztcbiAgICBjYXNlICdMVU1JTk9TSVRZJzogcmV0dXJuICdsdW1pbm9zaXR5JztcbiAgICAvLyBBcHByb3hpbWF0aW9ucyBcdTIwMTQgbm8gZGlyZWN0IENTUyBlcXVpdmFsZW50XG4gICAgY2FzZSAnTElORUFSX0JVUk4nOiByZXR1cm4gJ211bHRpcGx5JztcbiAgICBjYXNlICdMSU5FQVJfRE9ER0UnOiByZXR1cm4gJ3NjcmVlbic7XG4gICAgZGVmYXVsdDogcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIG5vZGUgaGFzIGFuIElNQUdFIGZpbGwgKHBob3RvZ3JhcGgvYmFja2dyb3VuZCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNJbWFnZUZpbGwobm9kZTogU2NlbmVOb2RlICYgeyBmaWxscz86IHJlYWRvbmx5IFBhaW50W10gfSk6IGJvb2xlYW4ge1xuICBpZiAoISgnZmlsbHMnIGluIG5vZGUpIHx8ICFub2RlLmZpbGxzIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZmlsbHMpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBub2RlLmZpbGxzLnNvbWUoZiA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSk7XG59XG5cbi8qKlxuICogTWFwIEZpZ21hIHN0cm9rZUFsaWduIHRvIGEgc3VpdGFibGUgQ1NTIGJvcmRlci1zdHlsZS5cbiAqIEZpZ21hIHN1cHBvcnRzIHNvbGlkIHN0cm9rZXMgbmF0aXZlbHk7IGRhc2hlZCBpcyBpbmZlcnJlZCBmcm9tIGRhc2hQYXR0ZXJuLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEJvcmRlclN0eWxlKG5vZGU6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoISgnc3Ryb2tlcycgaW4gbm9kZSkgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5zdHJva2VzKSB8fCBub2RlLnN0cm9rZXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZGFzaFBhdHRlcm4gPSAobm9kZSBhcyBhbnkpLmRhc2hQYXR0ZXJuO1xuICBpZiAoQXJyYXkuaXNBcnJheShkYXNoUGF0dGVybikgJiYgZGFzaFBhdHRlcm4ubGVuZ3RoID4gMCkge1xuICAgIC8vIDEtdW5pdCBkYXNoZXMgPSBkb3R0ZWQsIGxhcmdlciA9IGRhc2hlZFxuICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KC4uLmRhc2hQYXR0ZXJuKTtcbiAgICByZXR1cm4gbWF4IDw9IDIgPyAnZG90dGVkJyA6ICdkYXNoZWQnO1xuICB9XG4gIHJldHVybiAnc29saWQnO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgcGVyLXNpZGUgYm9yZGVyLXdpZHRoLiBGaWdtYSdzIGluZGl2aWR1YWxTdHJva2VXZWlnaHRzIChpZiBzZXQpXG4gKiBwcm92aWRlcyBwZXItc2lkZSB3aWR0aHM7IG90aGVyd2lzZSBzdHJva2VXZWlnaHQgaXMgdW5pZm9ybS5cbiAqIFJldHVybnMgbnVsbCBmb3IgYW55IHNpZGUgdGhhdCBpcyAwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEJvcmRlcldpZHRocyhub2RlOiBhbnkpOiB7XG4gIHRvcDogbnVtYmVyIHwgbnVsbDsgcmlnaHQ6IG51bWJlciB8IG51bGw7IGJvdHRvbTogbnVtYmVyIHwgbnVsbDsgbGVmdDogbnVtYmVyIHwgbnVsbDsgdW5pZm9ybTogbnVtYmVyIHwgbnVsbDtcbn0ge1xuICBjb25zdCBpbmQgPSAobm9kZSBhcyBhbnkpLmluZGl2aWR1YWxTdHJva2VXZWlnaHRzO1xuICBpZiAoaW5kICYmIHR5cGVvZiBpbmQgPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogaW5kLnRvcCB8fCBudWxsLFxuICAgICAgcmlnaHQ6IGluZC5yaWdodCB8fCBudWxsLFxuICAgICAgYm90dG9tOiBpbmQuYm90dG9tIHx8IG51bGwsXG4gICAgICBsZWZ0OiBpbmQubGVmdCB8fCBudWxsLFxuICAgICAgdW5pZm9ybTogbnVsbCxcbiAgICB9O1xuICB9XG4gIGNvbnN0IHcgPSAobm9kZSBhcyBhbnkpLnN0cm9rZVdlaWdodDtcbiAgaWYgKHR5cGVvZiB3ID09PSAnbnVtYmVyJyAmJiB3ID4gMCkge1xuICAgIHJldHVybiB7IHRvcDogbnVsbCwgcmlnaHQ6IG51bGwsIGJvdHRvbTogbnVsbCwgbGVmdDogbnVsbCwgdW5pZm9ybTogdyB9O1xuICB9XG4gIHJldHVybiB7IHRvcDogbnVsbCwgcmlnaHQ6IG51bGwsIGJvdHRvbTogbnVsbCwgbGVmdDogbnVsbCwgdW5pZm9ybTogbnVsbCB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIGZpcnN0IHZpc2libGUgU09MSUQgc3Ryb2tlIGNvbG9yIGFzIGhleC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RTdHJva2VDb2xvcihub2RlOiBhbnkpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCEoJ3N0cm9rZXMnIGluIG5vZGUpIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuc3Ryb2tlcykpIHJldHVybiBudWxsO1xuICBmb3IgKGNvbnN0IHN0cm9rZSBvZiBub2RlLnN0cm9rZXMpIHtcbiAgICBpZiAoc3Ryb2tlLnR5cGUgPT09ICdTT0xJRCcgJiYgc3Ryb2tlLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gcmdiVG9IZXgoc3Ryb2tlLmNvbG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ29sbGVjdCBhbGwgdW5pcXVlIGNvbG9ycyBmcm9tIGEgbm9kZSB0cmVlLlxuICogUmV0dXJucyBhIG1hcCBvZiBIRVggXHUyMTkyIHVzYWdlIGNvdW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdENvbG9ycyhyb290OiBTY2VuZU5vZGUpOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+IHtcbiAgY29uc3QgY29sb3JzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICAvLyBGaWxsc1xuICAgIGlmICgnZmlsbHMnIGluIG5vZGUgJiYgbm9kZS5maWxscyAmJiBBcnJheS5pc0FycmF5KG5vZGUuZmlsbHMpKSB7XG4gICAgICBmb3IgKGNvbnN0IGZpbGwgb2Ygbm9kZS5maWxscykge1xuICAgICAgICBpZiAoZmlsbC50eXBlID09PSAnU09MSUQnICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBjb25zdCBoZXggPSByZ2JUb0hleChmaWxsLmNvbG9yKTtcbiAgICAgICAgICBjb2xvcnNbaGV4XSA9IChjb2xvcnNbaGV4XSB8fCAwKSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gU3Ryb2tlc1xuICAgIGlmICgnc3Ryb2tlcycgaW4gbm9kZSAmJiBub2RlLnN0cm9rZXMgJiYgQXJyYXkuaXNBcnJheShub2RlLnN0cm9rZXMpKSB7XG4gICAgICBmb3IgKGNvbnN0IHN0cm9rZSBvZiBub2RlLnN0cm9rZXMpIHtcbiAgICAgICAgaWYgKHN0cm9rZS50eXBlID09PSAnU09MSUQnICYmIHN0cm9rZS52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgIGNvbnN0IGhleCA9IHJnYlRvSGV4KHN0cm9rZS5jb2xvcik7XG4gICAgICAgICAgY29sb3JzW2hleF0gPSAoY29sb3JzW2hleF0gfHwgMCkgKyAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlY3Vyc2VcbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2Fsayhyb290KTtcbiAgcmV0dXJuIGNvbG9ycztcbn1cbiIsICIvKipcbiAqIEV4dHJhY3QgRmlnbWEgRWZmZWN0cyAoc2hhZG93cywgYmx1cnMpIGludG8gQ1NTLXJlYWR5IHZhbHVlcy5cbiAqXG4gKiBGaWdtYSBzdXBwb3J0cyBhbiBhcnJheSBvZiBlZmZlY3RzIHBlciBub2RlLiBXZSBtYXA6XG4gKiAgIERST1BfU0hBRE9XICBcdTIxOTIgYm94LXNoYWRvdyAobXVsdGlwbGUgYWxsb3dlZCwgY29tbWEtc2VwYXJhdGVkKVxuICogICBJTk5FUl9TSEFET1cgXHUyMTkyIGJveC1zaGFkb3cgd2l0aCBgaW5zZXRgIGtleXdvcmRcbiAqICAgTEFZRVJfQkxVUiAgIFx1MjE5MiBmaWx0ZXI6IGJsdXIoTnB4KVxuICogICBCQUNLR1JPVU5EX0JMVVIgXHUyMTkyIGJhY2tkcm9wLWZpbHRlcjogYmx1cihOcHgpXG4gKlxuICogVEVYVCBub2RlcyBnZXQgdGhlaXIgRFJPUF9TSEFET1cgbWFwcGVkIHRvIENTUyB0ZXh0LXNoYWRvdyBpbnN0ZWFkIG9mXG4gKiBib3gtc2hhZG93IChET00gcmVuZGVyaW5nOiB0ZXh0IG5vZGVzIGRvbid0IGhvbm9yIGJveC1zaGFkb3cgb24gdGhlXG4gKiBnbHlwaHMgdGhlbXNlbHZlcykuXG4gKi9cblxuZnVuY3Rpb24gcmdiYVN0cmluZyhjb2xvcjogeyByOiBudW1iZXI7IGc6IG51bWJlcjsgYjogbnVtYmVyOyBhPzogbnVtYmVyIH0pOiBzdHJpbmcge1xuICBjb25zdCBhID0gY29sb3IuYSAhPT0gdW5kZWZpbmVkID8gTWF0aC5yb3VuZChjb2xvci5hICogMTAwKSAvIDEwMCA6IDE7XG4gIHJldHVybiBgcmdiYSgke01hdGgucm91bmQoY29sb3IuciAqIDI1NSl9LCAke01hdGgucm91bmQoY29sb3IuZyAqIDI1NSl9LCAke01hdGgucm91bmQoY29sb3IuYiAqIDI1NSl9LCAke2F9KWA7XG59XG5cbmZ1bmN0aW9uIHNoYWRvd1RvQ3NzKGU6IERyb3BTaGFkb3dFZmZlY3QgfCBJbm5lclNoYWRvd0VmZmVjdCwgaW5zZXQ6IGJvb2xlYW4pOiBzdHJpbmcge1xuICBjb25zdCB4ID0gTWF0aC5yb3VuZChlLm9mZnNldC54KTtcbiAgY29uc3QgeSA9IE1hdGgucm91bmQoZS5vZmZzZXQueSk7XG4gIGNvbnN0IGJsdXIgPSBNYXRoLnJvdW5kKGUucmFkaXVzKTtcbiAgY29uc3Qgc3ByZWFkID0gTWF0aC5yb3VuZCgoZSBhcyBhbnkpLnNwcmVhZCB8fCAwKTtcbiAgY29uc3QgY29sb3IgPSByZ2JhU3RyaW5nKGUuY29sb3IpO1xuICBjb25zdCBwcmVmaXggPSBpbnNldCA/ICdpbnNldCAnIDogJyc7XG4gIHJldHVybiBgJHtwcmVmaXh9JHt4fXB4ICR7eX1weCAke2JsdXJ9cHggJHtzcHJlYWR9cHggJHtjb2xvcn1gO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV4dHJhY3RlZEVmZmVjdHMge1xuICBib3hTaGFkb3c6IHN0cmluZyB8IG51bGw7ICAgICAvLyBjb21tYS1zZXBhcmF0ZWQgQ1NTIHZhbHVlIGZvciBtdWx0aXBsZSBzaGFkb3dzXG4gIHRleHRTaGFkb3c6IHN0cmluZyB8IG51bGw7ICAgIC8vIGZvciBURVhUIG5vZGVzIChEUk9QX1NIQURPVyBvbiB0ZXh0IGJlY29tZXMgdGV4dC1zaGFkb3cpXG4gIGZpbHRlcjogc3RyaW5nIHwgbnVsbDsgICAgICAgIC8vIExBWUVSX0JMVVIgXHUyMTkyIGJsdXIoTnB4KSwgZXh0ZW5kYWJsZVxuICBiYWNrZHJvcEZpbHRlcjogc3RyaW5nIHwgbnVsbDsgLy8gQkFDS0dST1VORF9CTFVSIFx1MjE5MiBibHVyKE5weClcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGFsbCBlZmZlY3RzIGZyb20gYSBub2RlIGFuZCByZXR1cm4gQ1NTLXJlYWR5IHZhbHVlcy5cbiAqIFJlc3BlY3RzIEZpZ21hJ3MgdmlzaWJsZSBmbGFnOyBza2lwcyBoaWRkZW4gZWZmZWN0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RFZmZlY3RzKFxuICBub2RlOiB7IGVmZmVjdHM/OiByZWFkb25seSBFZmZlY3RbXTsgdHlwZT86IHN0cmluZyB9LFxuKTogRXh0cmFjdGVkRWZmZWN0cyB7XG4gIGNvbnN0IHJlc3VsdDogRXh0cmFjdGVkRWZmZWN0cyA9IHtcbiAgICBib3hTaGFkb3c6IG51bGwsXG4gICAgdGV4dFNoYWRvdzogbnVsbCxcbiAgICBmaWx0ZXI6IG51bGwsXG4gICAgYmFja2Ryb3BGaWx0ZXI6IG51bGwsXG4gIH07XG5cbiAgaWYgKCFub2RlLmVmZmVjdHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5lZmZlY3RzKSB8fCBub2RlLmVmZmVjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGNvbnN0IGlzVGV4dCA9IG5vZGUudHlwZSA9PT0gJ1RFWFQnO1xuICBjb25zdCBzaGFkb3dTdHJpbmdzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB0ZXh0U2hhZG93U3RyaW5nczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZmlsdGVyUGFydHM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGJhY2tkcm9wUGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCBlZmZlY3Qgb2Ygbm9kZS5lZmZlY3RzKSB7XG4gICAgaWYgKGVmZmVjdC52aXNpYmxlID09PSBmYWxzZSkgY29udGludWU7XG5cbiAgICBpZiAoZWZmZWN0LnR5cGUgPT09ICdEUk9QX1NIQURPVycpIHtcbiAgICAgIGNvbnN0IGUgPSBlZmZlY3QgYXMgRHJvcFNoYWRvd0VmZmVjdDtcbiAgICAgIGlmIChpc1RleHQpIHtcbiAgICAgICAgLy8gdGV4dC1zaGFkb3cgZm9ybWF0OiA8eD4gPHk+IDxibHVyPiA8Y29sb3I+IChubyBzcHJlYWQpXG4gICAgICAgIGNvbnN0IHggPSBNYXRoLnJvdW5kKGUub2Zmc2V0LngpO1xuICAgICAgICBjb25zdCB5ID0gTWF0aC5yb3VuZChlLm9mZnNldC55KTtcbiAgICAgICAgY29uc3QgYmx1ciA9IE1hdGgucm91bmQoZS5yYWRpdXMpO1xuICAgICAgICB0ZXh0U2hhZG93U3RyaW5ncy5wdXNoKGAke3h9cHggJHt5fXB4ICR7Ymx1cn1weCAke3JnYmFTdHJpbmcoZS5jb2xvcil9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaGFkb3dTdHJpbmdzLnB1c2goc2hhZG93VG9Dc3MoZSwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGVmZmVjdC50eXBlID09PSAnSU5ORVJfU0hBRE9XJykge1xuICAgICAgY29uc3QgZSA9IGVmZmVjdCBhcyBJbm5lclNoYWRvd0VmZmVjdDtcbiAgICAgIC8vIElOTkVSX1NIQURPVyBvbiBURVhUIGlzbid0IGEgdGhpbmcgaW4gQ1NTIFx1MjAxNCBmYWxsIGJhY2sgdG8gZW1wdHkgZm9yIHRleHRcbiAgICAgIGlmICghaXNUZXh0KSBzaGFkb3dTdHJpbmdzLnB1c2goc2hhZG93VG9Dc3MoZSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSBpZiAoZWZmZWN0LnR5cGUgPT09ICdMQVlFUl9CTFVSJykge1xuICAgICAgY29uc3QgZSA9IGVmZmVjdCBhcyBCbHVyRWZmZWN0O1xuICAgICAgZmlsdGVyUGFydHMucHVzaChgYmx1cigke01hdGgucm91bmQoZS5yYWRpdXMpfXB4KWApO1xuICAgIH0gZWxzZSBpZiAoZWZmZWN0LnR5cGUgPT09ICdCQUNLR1JPVU5EX0JMVVInKSB7XG4gICAgICBjb25zdCBlID0gZWZmZWN0IGFzIEJsdXJFZmZlY3Q7XG4gICAgICBiYWNrZHJvcFBhcnRzLnB1c2goYGJsdXIoJHtNYXRoLnJvdW5kKGUucmFkaXVzKX1weClgKTtcbiAgICB9XG4gIH1cblxuICBpZiAoc2hhZG93U3RyaW5ncy5sZW5ndGggPiAwKSByZXN1bHQuYm94U2hhZG93ID0gc2hhZG93U3RyaW5ncy5qb2luKCcsICcpO1xuICBpZiAodGV4dFNoYWRvd1N0cmluZ3MubGVuZ3RoID4gMCkgcmVzdWx0LnRleHRTaGFkb3cgPSB0ZXh0U2hhZG93U3RyaW5ncy5qb2luKCcsICcpO1xuICBpZiAoZmlsdGVyUGFydHMubGVuZ3RoID4gMCkgcmVzdWx0LmZpbHRlciA9IGZpbHRlclBhcnRzLmpvaW4oJyAnKTtcbiAgaWYgKGJhY2tkcm9wUGFydHMubGVuZ3RoID4gMCkgcmVzdWx0LmJhY2tkcm9wRmlsdGVyID0gYmFja2Ryb3BQYXJ0cy5qb2luKCcgJyk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiIsICJpbXBvcnQgeyBFbGVtZW50U3R5bGVzLCBUZXh0U2VnbWVudCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgdG9Dc3NWYWx1ZSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgZXh0cmFjdFRleHRDb2xvciwgcmdiVG9IZXggfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IGV4dHJhY3RFZmZlY3RzIH0gZnJvbSAnLi9lZmZlY3RzJztcblxuLyoqXG4gKiBEZXJpdmUgQ1NTIGZvbnQtd2VpZ2h0IGZyb20gYSBGaWdtYSBmb250IHN0eWxlIG5hbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb250V2VpZ2h0RnJvbVN0eWxlKHN0eWxlOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBzID0gc3R5bGUudG9Mb3dlckNhc2UoKTtcbiAgaWYgKHMuaW5jbHVkZXMoJ3RoaW4nKSB8fCBzLmluY2x1ZGVzKCdoYWlybGluZScpKSByZXR1cm4gMTAwO1xuICBpZiAocy5pbmNsdWRlcygnZXh0cmFsaWdodCcpIHx8IHMuaW5jbHVkZXMoJ3VsdHJhIGxpZ2h0JykgfHwgcy5pbmNsdWRlcygnZXh0cmEgbGlnaHQnKSkgcmV0dXJuIDIwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ2xpZ2h0JykpIHJldHVybiAzMDA7XG4gIGlmIChzLmluY2x1ZGVzKCdtZWRpdW0nKSkgcmV0dXJuIDUwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ3NlbWlib2xkJykgfHwgcy5pbmNsdWRlcygnc2VtaSBib2xkJykgfHwgcy5pbmNsdWRlcygnZGVtaSBib2xkJykgfHwgcy5pbmNsdWRlcygnZGVtaWJvbGQnKSkgcmV0dXJuIDYwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ2V4dHJhYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ2V4dHJhIGJvbGQnKSB8fCBzLmluY2x1ZGVzKCd1bHRyYSBib2xkJykgfHwgcy5pbmNsdWRlcygndWx0cmFib2xkJykpIHJldHVybiA4MDA7XG4gIGlmIChzLmluY2x1ZGVzKCdibGFjaycpIHx8IHMuaW5jbHVkZXMoJ2hlYXZ5JykpIHJldHVybiA5MDA7XG4gIGlmIChzLmluY2x1ZGVzKCdib2xkJykpIHJldHVybiA3MDA7XG4gIHJldHVybiA0MDA7IC8vIFJlZ3VsYXIgLyBOb3JtYWwgLyBCb29rXG59XG5cbi8qKlxuICogTWFwIEZpZ21hIHRleHQgYWxpZ25tZW50IHRvIENTUyB0ZXh0LWFsaWduIHZhbHVlLlxuICovXG5mdW5jdGlvbiBtYXBUZXh0QWxpZ24oYWxpZ246IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBzd2l0Y2ggKGFsaWduKSB7XG4gICAgY2FzZSAnTEVGVCc6IHJldHVybiAnbGVmdCc7XG4gICAgY2FzZSAnQ0VOVEVSJzogcmV0dXJuICdjZW50ZXInO1xuICAgIGNhc2UgJ1JJR0hUJzogcmV0dXJuICdyaWdodCc7XG4gICAgY2FzZSAnSlVTVElGSUVEJzogcmV0dXJuICdqdXN0aWZ5JztcbiAgICBkZWZhdWx0OiByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIE1hcCBGaWdtYSB0ZXh0IGNhc2UgdG8gQ1NTIHRleHQtdHJhbnNmb3JtIHZhbHVlLlxuICovXG5mdW5jdGlvbiBtYXBUZXh0Q2FzZSh0ZXh0Q2FzZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIHN3aXRjaCAodGV4dENhc2UpIHtcbiAgICBjYXNlICdVUFBFUic6IHJldHVybiAndXBwZXJjYXNlJztcbiAgICBjYXNlICdMT1dFUic6IHJldHVybiAnbG93ZXJjYXNlJztcbiAgICBjYXNlICdUSVRMRSc6IHJldHVybiAnY2FwaXRhbGl6ZSc7XG4gICAgY2FzZSAnT1JJR0lOQUwnOlxuICAgIGRlZmF1bHQ6IHJldHVybiAnbm9uZSc7XG4gIH1cbn1cblxuLyoqXG4gKiBFeHRyYWN0IHR5cG9ncmFwaHkgc3R5bGVzIGZyb20gYSBURVhUIG5vZGUuXG4gKiBSZXR1cm5zIENTUy1yZWFkeSB2YWx1ZXMgd2l0aCB1bml0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUeXBvZ3JhcGh5KG5vZGU6IFRleHROb2RlKTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiB7XG4gIGNvbnN0IHN0eWxlczogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHt9O1xuXG4gIC8vIEZvbnQgZmFtaWx5IFx1MjAxNCBoYW5kbGUgbWl4ZWQgZm9udHMgKHVzZSBmaXJzdCBzZWdtZW50KVxuICBjb25zdCBmb250TmFtZSA9IG5vZGUuZm9udE5hbWU7XG4gIGlmIChmb250TmFtZSAhPT0gZmlnbWEubWl4ZWQgJiYgZm9udE5hbWUpIHtcbiAgICBzdHlsZXMuZm9udEZhbWlseSA9IGZvbnROYW1lLmZhbWlseTtcbiAgICBzdHlsZXMuZm9udFdlaWdodCA9IGZvbnRXZWlnaHRGcm9tU3R5bGUoZm9udE5hbWUuc3R5bGUpO1xuICB9XG5cbiAgLy8gRm9udCBzaXplXG4gIGNvbnN0IGZvbnRTaXplID0gbm9kZS5mb250U2l6ZTtcbiAgaWYgKGZvbnRTaXplICE9PSBmaWdtYS5taXhlZCAmJiB0eXBlb2YgZm9udFNpemUgPT09ICdudW1iZXInKSB7XG4gICAgc3R5bGVzLmZvbnRTaXplID0gdG9Dc3NWYWx1ZShmb250U2l6ZSk7XG4gIH1cblxuICAvLyBMaW5lIGhlaWdodFxuICBjb25zdCBsaCA9IG5vZGUubGluZUhlaWdodDtcbiAgaWYgKGxoICE9PSBmaWdtYS5taXhlZCAmJiBsaCkge1xuICAgIGlmIChsaC51bml0ID09PSAnUElYRUxTJykge1xuICAgICAgc3R5bGVzLmxpbmVIZWlnaHQgPSB0b0Nzc1ZhbHVlKGxoLnZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKGxoLnVuaXQgPT09ICdQRVJDRU5UJykge1xuICAgICAgc3R5bGVzLmxpbmVIZWlnaHQgPSBgJHtNYXRoLnJvdW5kKGxoLnZhbHVlKX0lYDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQVVUTyBcdTIwMTQgZGVyaXZlIGZyb20gZm9udCBzaXplXG4gICAgICBzdHlsZXMubGluZUhlaWdodCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLy8gTGV0dGVyIHNwYWNpbmdcbiAgY29uc3QgbHMgPSBub2RlLmxldHRlclNwYWNpbmc7XG4gIGlmIChscyAhPT0gZmlnbWEubWl4ZWQgJiYgbHMpIHtcbiAgICBpZiAobHMudW5pdCA9PT0gJ1BJWEVMUycpIHtcbiAgICAgIHN0eWxlcy5sZXR0ZXJTcGFjaW5nID0gdG9Dc3NWYWx1ZShscy52YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChscy51bml0ID09PSAnUEVSQ0VOVCcpIHtcbiAgICAgIC8vIENvbnZlcnQgcGVyY2VudGFnZSB0byBlbSAoRmlnbWEncyAxMDAlID0gMWVtKVxuICAgICAgY29uc3QgZW1WYWx1ZSA9IE1hdGgucm91bmQoKGxzLnZhbHVlIC8gMTAwKSAqIDEwMCkgLyAxMDA7XG4gICAgICBzdHlsZXMubGV0dGVyU3BhY2luZyA9IGAke2VtVmFsdWV9ZW1gO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRleHQgdHJhbnNmb3JtXG4gIGNvbnN0IHRleHRDYXNlID0gbm9kZS50ZXh0Q2FzZTtcbiAgaWYgKHRleHRDYXNlICE9PSBmaWdtYS5taXhlZCkge1xuICAgIHN0eWxlcy50ZXh0VHJhbnNmb3JtID0gbWFwVGV4dENhc2UodGV4dENhc2UgYXMgc3RyaW5nKTtcbiAgfVxuXG4gIC8vIFRleHQgYWxpZ25tZW50XG4gIGNvbnN0IHRleHRBbGlnbiA9IG5vZGUudGV4dEFsaWduSG9yaXpvbnRhbDtcbiAgaWYgKHRleHRBbGlnbikge1xuICAgIHN0eWxlcy50ZXh0QWxpZ24gPSBtYXBUZXh0QWxpZ24odGV4dEFsaWduKTtcbiAgfVxuXG4gIC8vIFRleHQgZGVjb3JhdGlvbiAodW5kZXJsaW5lIC8gbGluZS10aHJvdWdoIC8gbm9uZSlcbiAgY29uc3QgdGQgPSAobm9kZSBhcyBhbnkpLnRleHREZWNvcmF0aW9uO1xuICBpZiAodGQgIT09IHVuZGVmaW5lZCAmJiB0ZCAhPT0gZmlnbWEubWl4ZWQpIHtcbiAgICBpZiAodGQgPT09ICdVTkRFUkxJTkUnKSBzdHlsZXMudGV4dERlY29yYXRpb24gPSAndW5kZXJsaW5lJztcbiAgICBlbHNlIGlmICh0ZCA9PT0gJ1NUUklLRVRIUk9VR0gnKSBzdHlsZXMudGV4dERlY29yYXRpb24gPSAnbGluZS10aHJvdWdoJztcbiAgICBlbHNlIHN0eWxlcy50ZXh0RGVjb3JhdGlvbiA9IG51bGw7XG4gIH1cblxuICAvLyBDb2xvclxuICBzdHlsZXMuY29sb3IgPSBleHRyYWN0VGV4dENvbG9yKG5vZGUpO1xuXG4gIC8vIFRleHQtc2hhZG93IGZyb20gRFJPUF9TSEFET1cgZWZmZWN0cyBvbiBURVhUIG5vZGVzXG4gIGNvbnN0IGVmZmVjdHMgPSBleHRyYWN0RWZmZWN0cyhub2RlKTtcbiAgaWYgKGVmZmVjdHMudGV4dFNoYWRvdykgc3R5bGVzLnRleHRTaGFkb3cgPSBlZmZlY3RzLnRleHRTaGFkb3c7XG5cbiAgLy8gRmlnbWEgVGV4dCBTdHlsZSByZWZlcmVuY2UgKGRlc2lnbiB0b2tlbiBmb3IgdHlwb2dyYXBoeSlcbiAgY29uc3Qgc3R5bGVOYW1lID0gZXh0cmFjdFRleHRTdHlsZU5hbWUobm9kZSk7XG4gIGlmIChzdHlsZU5hbWUpIHN0eWxlcy50ZXh0U3R5bGVOYW1lID0gc3R5bGVOYW1lO1xuXG4gIC8vIFN0eWxlZCB0ZXh0IHNlZ21lbnRzIFx1MjAxNCBvbmx5IHdoZW4gdGhlIHRleHQgaGFzIG1peGVkIGlubGluZSBzdHlsZXNcbiAgY29uc3Qgc2VnbWVudHMgPSBleHRyYWN0VGV4dFNlZ21lbnRzKG5vZGUpO1xuICBpZiAoc2VnbWVudHMpIHN0eWxlcy50ZXh0U2VnbWVudHMgPSBzZWdtZW50cztcblxuICByZXR1cm4gc3R5bGVzO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIGJvdW5kIEZpZ21hIFRleHQgU3R5bGUgbmFtZSAoZS5nLiBcIkhlYWRpbmcvSDJcIikuXG4gKiBSZXR1cm5zIG51bGwgd2hlbiB0aGUgdGV4dCBub2RlIGhhcyBubyBzdHlsZSBiaW5kaW5nLCBvciB0aGUgYmluZGluZyBpcyBtaXhlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUZXh0U3R5bGVOYW1lKG5vZGU6IFRleHROb2RlKTogc3RyaW5nIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgY29uc3QgaWQgPSAobm9kZSBhcyBhbnkpLnRleHRTdHlsZUlkO1xuICAgIGlmICghaWQgfHwgaWQgPT09IGZpZ21hLm1peGVkIHx8IHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IHN0eWxlID0gZmlnbWEuZ2V0U3R5bGVCeUlkKGlkKTtcbiAgICByZXR1cm4gc3R5bGU/Lm5hbWUgfHwgbnVsbDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBFeHRyYWN0IHN0eWxlZCB0ZXh0IHNlZ21lbnRzIHNvIGlubGluZSBmb3JtYXR0aW5nIChib2xkIHdvcmQsIGNvbG9yZWQgc3BhbixcbiAqIHVuZGVybGluZWQgbGluayBpbnNpZGUgYSBwYXJhZ3JhcGgpIHN1cnZpdmVzIHRoZSBleHBvcnQuIFJldHVybnMgbnVsbCB3aGVuXG4gKiB0aGUgdGV4dCBoYXMgbm8gbWl4ZWQgc3R5bGVzIFx1MjAxNCBpbiB0aGF0IGNhc2UgdGhlIGVsZW1lbnQtbGV2ZWwgdHlwb2dyYXBoeVxuICogYWxyZWFkeSBkZXNjcmliZXMgdGhlIHdob2xlIHRleHQgdW5pZm9ybWx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFRleHRTZWdtZW50cyhub2RlOiBUZXh0Tm9kZSk6IFRleHRTZWdtZW50W10gfCBudWxsIHtcbiAgaWYgKCFub2RlLmNoYXJhY3RlcnMpIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IGdldFNlZ21lbnRzID0gKG5vZGUgYXMgYW55KS5nZXRTdHlsZWRUZXh0U2VnbWVudHM7XG4gICAgaWYgKHR5cGVvZiBnZXRTZWdtZW50cyAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgcmF3ID0gZ2V0U2VnbWVudHMuY2FsbChub2RlLCBbJ2ZvbnROYW1lJywgJ2ZvbnRTaXplJywgJ2ZpbGxzJywgJ3RleHREZWNvcmF0aW9uJ10pO1xuICAgIGlmICghcmF3IHx8ICFBcnJheS5pc0FycmF5KHJhdykgfHwgcmF3Lmxlbmd0aCA8PSAxKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IHNlZ21lbnRzOiBUZXh0U2VnbWVudFtdID0gcmF3Lm1hcCgoczogYW55KSA9PiB7XG4gICAgICBjb25zdCBzZWc6IFRleHRTZWdtZW50ID0geyB0ZXh0OiBzLmNoYXJhY3RlcnMgfHwgJycgfTtcbiAgICAgIGlmIChzLmZvbnROYW1lICYmIHR5cGVvZiBzLmZvbnROYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgICBzZWcuZm9udEZhbWlseSA9IHMuZm9udE5hbWUuZmFtaWx5O1xuICAgICAgICBzZWcuZm9udFdlaWdodCA9IGZvbnRXZWlnaHRGcm9tU3R5bGUocy5mb250TmFtZS5zdHlsZSk7XG4gICAgICAgIGlmIChzLmZvbnROYW1lLnN0eWxlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2l0YWxpYycpKSBzZWcuaXRhbGljID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2Ygcy5mb250U2l6ZSA9PT0gJ251bWJlcicpIHNlZy5mb250U2l6ZSA9IHMuZm9udFNpemU7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShzLmZpbGxzKSkge1xuICAgICAgICBmb3IgKGNvbnN0IGYgb2Ygcy5maWxscykge1xuICAgICAgICAgIGlmIChmLnR5cGUgPT09ICdTT0xJRCcgJiYgZi52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgc2VnLmNvbG9yID0gcmdiVG9IZXgoZi5jb2xvcik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzLnRleHREZWNvcmF0aW9uID09PSAnVU5ERVJMSU5FJykgc2VnLnRleHREZWNvcmF0aW9uID0gJ3VuZGVybGluZSc7XG4gICAgICBlbHNlIGlmIChzLnRleHREZWNvcmF0aW9uID09PSAnU1RSSUtFVEhST1VHSCcpIHNlZy50ZXh0RGVjb3JhdGlvbiA9ICdsaW5lLXRocm91Z2gnO1xuICAgICAgcmV0dXJuIHNlZztcbiAgICB9KTtcblxuICAgIC8vIElmIGV2ZXJ5IHNlZ21lbnQncyBzdHlsaW5nIGlzIGlkZW50aWNhbCwgdGhlIHNlZ21lbnRhdGlvbiBhZGRzIG5vdGhpbmcuXG4gICAgY29uc3QgZmlyc3QgPSBzZWdtZW50c1swXTtcbiAgICBjb25zdCBhbGxTYW1lID0gc2VnbWVudHMuZXZlcnkocyA9PlxuICAgICAgcy5mb250RmFtaWx5ID09PSBmaXJzdC5mb250RmFtaWx5ICYmXG4gICAgICBzLmZvbnRXZWlnaHQgPT09IGZpcnN0LmZvbnRXZWlnaHQgJiZcbiAgICAgIHMuZm9udFNpemUgPT09IGZpcnN0LmZvbnRTaXplICYmXG4gICAgICBzLmNvbG9yID09PSBmaXJzdC5jb2xvciAmJlxuICAgICAgcy5pdGFsaWMgPT09IGZpcnN0Lml0YWxpYyAmJlxuICAgICAgcy50ZXh0RGVjb3JhdGlvbiA9PT0gZmlyc3QudGV4dERlY29yYXRpb25cbiAgICApO1xuICAgIHJldHVybiBhbGxTYW1lID8gbnVsbCA6IHNlZ21lbnRzO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIENvbGxlY3QgYWxsIHVuaXF1ZSBmb250IHVzYWdlIGRhdGEgZnJvbSBhIG5vZGUgdHJlZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RGb250cyhyb290OiBTY2VuZU5vZGUpOiBSZWNvcmQ8c3RyaW5nLCB7IHN0eWxlczogU2V0PHN0cmluZz47IHNpemVzOiBTZXQ8bnVtYmVyPjsgY291bnQ6IG51bWJlciB9PiB7XG4gIGNvbnN0IGZvbnRzOiBSZWNvcmQ8c3RyaW5nLCB7IHN0eWxlczogU2V0PHN0cmluZz47IHNpemVzOiBTZXQ8bnVtYmVyPjsgY291bnQ6IG51bWJlciB9PiA9IHt9O1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCBmb250TmFtZSA9IG5vZGUuZm9udE5hbWU7XG4gICAgICBpZiAoZm9udE5hbWUgIT09IGZpZ21hLm1peGVkICYmIGZvbnROYW1lKSB7XG4gICAgICAgIGNvbnN0IGZhbWlseSA9IGZvbnROYW1lLmZhbWlseTtcbiAgICAgICAgaWYgKCFmb250c1tmYW1pbHldKSB7XG4gICAgICAgICAgZm9udHNbZmFtaWx5XSA9IHsgc3R5bGVzOiBuZXcgU2V0KCksIHNpemVzOiBuZXcgU2V0KCksIGNvdW50OiAwIH07XG4gICAgICAgIH1cbiAgICAgICAgZm9udHNbZmFtaWx5XS5zdHlsZXMuYWRkKGZvbnROYW1lLnN0eWxlKTtcbiAgICAgICAgZm9udHNbZmFtaWx5XS5jb3VudCsrO1xuXG4gICAgICAgIGNvbnN0IGZvbnRTaXplID0gbm9kZS5mb250U2l6ZTtcbiAgICAgICAgaWYgKGZvbnRTaXplICE9PSBmaWdtYS5taXhlZCAmJiB0eXBlb2YgZm9udFNpemUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgZm9udHNbZmFtaWx5XS5zaXplcy5hZGQoZm9udFNpemUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3YWxrKHJvb3QpO1xuICByZXR1cm4gZm9udHM7XG59XG5cbi8qKlxuICogQ291bnQgVEVYVCBub2RlcyBpbiBhIHN1YnRyZWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb3VudFRleHROb2Rlcyhyb290OiBTY2VuZU5vZGUpOiBudW1iZXIge1xuICBsZXQgY291bnQgPSAwO1xuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykgY291bnQrKztcbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdhbGsocm9vdCk7XG4gIHJldHVybiBjb3VudDtcbn1cbiIsICJpbXBvcnQgeyBTZWN0aW9uU3R5bGVzIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyB0b0Nzc1ZhbHVlIH0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogRXh0cmFjdCBzcGFjaW5nIGZyb20gYW4gYXV0by1sYXlvdXQgZnJhbWUuXG4gKiBUaGVzZSB2YWx1ZXMgbWFwIDE6MSB0byBDU1MgXHUyMDE0IGhpZ2ggY29uZmlkZW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RBdXRvTGF5b3V0U3BhY2luZyhub2RlOiBGcmFtZU5vZGUpOiB7XG4gIHNwYWNpbmdTb3VyY2U6ICdhdXRvLWxheW91dCc7XG4gIHNlY3Rpb25TdHlsZXM6IFBhcnRpYWw8U2VjdGlvblN0eWxlcz47XG4gIGl0ZW1TcGFjaW5nOiBzdHJpbmcgfCBudWxsO1xufSB7XG4gIHJldHVybiB7XG4gICAgc3BhY2luZ1NvdXJjZTogJ2F1dG8tbGF5b3V0JyxcbiAgICBzZWN0aW9uU3R5bGVzOiB7XG4gICAgICBwYWRkaW5nVG9wOiB0b0Nzc1ZhbHVlKG5vZGUucGFkZGluZ1RvcCksXG4gICAgICBwYWRkaW5nQm90dG9tOiB0b0Nzc1ZhbHVlKG5vZGUucGFkZGluZ0JvdHRvbSksXG4gICAgICBwYWRkaW5nTGVmdDogdG9Dc3NWYWx1ZShub2RlLnBhZGRpbmdMZWZ0KSxcbiAgICAgIHBhZGRpbmdSaWdodDogdG9Dc3NWYWx1ZShub2RlLnBhZGRpbmdSaWdodCksXG4gICAgfSxcbiAgICBpdGVtU3BhY2luZzogdG9Dc3NWYWx1ZShub2RlLml0ZW1TcGFjaW5nKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHNwYWNpbmcgZnJvbSBhbiBhYnNvbHV0ZWx5LXBvc2l0aW9uZWQgZnJhbWUgYnkgY29tcHV0aW5nXG4gKiBmcm9tIGNoaWxkcmVuJ3MgYm91bmRpbmcgYm94ZXMuIFRoZXNlIHZhbHVlcyBhcmUgYXBwcm94aW1hdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0QWJzb2x1dGVTcGFjaW5nKG5vZGU6IEZyYW1lTm9kZSk6IHtcbiAgc3BhY2luZ1NvdXJjZTogJ2Fic29sdXRlLWNvb3JkaW5hdGVzJztcbiAgc2VjdGlvblN0eWxlczogUGFydGlhbDxTZWN0aW9uU3R5bGVzPjtcbiAgaXRlbVNwYWNpbmc6IHN0cmluZyB8IG51bGw7XG59IHtcbiAgY29uc3QgcGFyZW50Qm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICBpZiAoIXBhcmVudEJvdW5kcykge1xuICAgIHJldHVybiB7XG4gICAgICBzcGFjaW5nU291cmNlOiAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnLFxuICAgICAgc2VjdGlvblN0eWxlczoge1xuICAgICAgICBwYWRkaW5nVG9wOiBudWxsLFxuICAgICAgICBwYWRkaW5nQm90dG9tOiBudWxsLFxuICAgICAgICBwYWRkaW5nTGVmdDogbnVsbCxcbiAgICAgICAgcGFkZGluZ1JpZ2h0OiBudWxsLFxuICAgICAgfSxcbiAgICAgIGl0ZW1TcGFjaW5nOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW5cbiAgICAuZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSAmJiBjLmFic29sdXRlQm91bmRpbmdCb3gpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueSk7XG5cbiAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBzcGFjaW5nU291cmNlOiAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnLFxuICAgICAgc2VjdGlvblN0eWxlczoge1xuICAgICAgICBwYWRkaW5nVG9wOiBudWxsLFxuICAgICAgICBwYWRkaW5nQm90dG9tOiBudWxsLFxuICAgICAgICBwYWRkaW5nTGVmdDogbnVsbCxcbiAgICAgICAgcGFkZGluZ1JpZ2h0OiBudWxsLFxuICAgICAgfSxcbiAgICAgIGl0ZW1TcGFjaW5nOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBmaXJzdENoaWxkID0gY2hpbGRyZW5bMF0uYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gIGNvbnN0IGxhc3RDaGlsZCA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdLmFic29sdXRlQm91bmRpbmdCb3ghO1xuXG4gIGNvbnN0IHBhZGRpbmdUb3AgPSBmaXJzdENoaWxkLnkgLSBwYXJlbnRCb3VuZHMueTtcbiAgY29uc3QgcGFkZGluZ0JvdHRvbSA9IChwYXJlbnRCb3VuZHMueSArIHBhcmVudEJvdW5kcy5oZWlnaHQpIC0gKGxhc3RDaGlsZC55ICsgbGFzdENoaWxkLmhlaWdodCk7XG5cbiAgLy8gQ29tcHV0ZSBsZWZ0IHBhZGRpbmcgZnJvbSB0aGUgbGVmdG1vc3QgY2hpbGRcbiAgY29uc3QgbGVmdE1vc3QgPSBNYXRoLm1pbiguLi5jaGlsZHJlbi5tYXAoYyA9PiBjLmFic29sdXRlQm91bmRpbmdCb3ghLngpKTtcbiAgY29uc3QgcGFkZGluZ0xlZnQgPSBsZWZ0TW9zdCAtIHBhcmVudEJvdW5kcy54O1xuXG4gIC8vIENvbXB1dGUgcmlnaHQgcGFkZGluZyBmcm9tIHRoZSByaWdodG1vc3QgY2hpbGRcbiAgY29uc3QgcmlnaHRNb3N0ID0gTWF0aC5tYXgoLi4uY2hpbGRyZW4ubWFwKGMgPT4gYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS54ICsgYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS53aWR0aCkpO1xuICBjb25zdCBwYWRkaW5nUmlnaHQgPSAocGFyZW50Qm91bmRzLnggKyBwYXJlbnRCb3VuZHMud2lkdGgpIC0gcmlnaHRNb3N0O1xuXG4gIC8vIEVzdGltYXRlIHZlcnRpY2FsIGdhcCBmcm9tIGNvbnNlY3V0aXZlIGNoaWxkcmVuXG4gIGxldCB0b3RhbEdhcCA9IDA7XG4gIGxldCBnYXBDb3VudCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgY29uc3QgY3VyckJvdHRvbSA9IGNoaWxkcmVuW2ldLmFic29sdXRlQm91bmRpbmdCb3ghLnkgKyBjaGlsZHJlbltpXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS5oZWlnaHQ7XG4gICAgY29uc3QgbmV4dFRvcCA9IGNoaWxkcmVuW2kgKyAxXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55O1xuICAgIGNvbnN0IGdhcCA9IG5leHRUb3AgLSBjdXJyQm90dG9tO1xuICAgIGlmIChnYXAgPiAwKSB7XG4gICAgICB0b3RhbEdhcCArPSBnYXA7XG4gICAgICBnYXBDb3VudCsrO1xuICAgIH1cbiAgfVxuICBjb25zdCBhdmdHYXAgPSBnYXBDb3VudCA+IDAgPyBNYXRoLnJvdW5kKHRvdGFsR2FwIC8gZ2FwQ291bnQpIDogMDtcblxuICByZXR1cm4ge1xuICAgIHNwYWNpbmdTb3VyY2U6ICdhYnNvbHV0ZS1jb29yZGluYXRlcycsXG4gICAgc2VjdGlvblN0eWxlczoge1xuICAgICAgcGFkZGluZ1RvcDogdG9Dc3NWYWx1ZShNYXRoLm1heCgwLCBNYXRoLnJvdW5kKHBhZGRpbmdUb3ApKSksXG4gICAgICBwYWRkaW5nQm90dG9tOiB0b0Nzc1ZhbHVlKE1hdGgubWF4KDAsIE1hdGgucm91bmQocGFkZGluZ0JvdHRvbSkpKSxcbiAgICAgIHBhZGRpbmdMZWZ0OiB0b0Nzc1ZhbHVlKE1hdGgubWF4KDAsIE1hdGgucm91bmQocGFkZGluZ0xlZnQpKSksXG4gICAgICBwYWRkaW5nUmlnaHQ6IHRvQ3NzVmFsdWUoTWF0aC5tYXgoMCwgTWF0aC5yb3VuZChwYWRkaW5nUmlnaHQpKSksXG4gICAgfSxcbiAgICBpdGVtU3BhY2luZzogYXZnR2FwID4gMCA/IHRvQ3NzVmFsdWUoYXZnR2FwKSA6IG51bGwsXG4gIH07XG59XG5cbi8qKlxuICogQ29sbGVjdCBhbGwgc3BhY2luZyB2YWx1ZXMgdXNlZCBpbiBhIG5vZGUgdHJlZS5cbiAqIFJldHVybnMgc29ydGVkIGFycmF5IG9mIHsgdmFsdWUsIGNvdW50IH0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0U3BhY2luZyhyb290OiBTY2VuZU5vZGUpOiB7IHZhbHVlOiBudW1iZXI7IGNvdW50OiBudW1iZXIgfVtdIHtcbiAgY29uc3Qgc3BhY2luZ01hcDogUmVjb3JkPG51bWJlciwgbnVtYmVyPiA9IHt9O1xuXG4gIGZ1bmN0aW9uIGFkZFZhbHVlKHY6IG51bWJlcikge1xuICAgIGlmICh2ID4gMCAmJiB2IDwgMTAwMCkge1xuICAgICAgY29uc3Qgcm91bmRlZCA9IE1hdGgucm91bmQodik7XG4gICAgICBzcGFjaW5nTWFwW3JvdW5kZWRdID0gKHNwYWNpbmdNYXBbcm91bmRlZF0gfHwgMCkgKyAxO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJykge1xuICAgICAgY29uc3QgZnJhbWUgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgIGlmIChmcmFtZS5sYXlvdXRNb2RlICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICBhZGRWYWx1ZShmcmFtZS5wYWRkaW5nVG9wKTtcbiAgICAgICAgYWRkVmFsdWUoZnJhbWUucGFkZGluZ0JvdHRvbSk7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLnBhZGRpbmdMZWZ0KTtcbiAgICAgICAgYWRkVmFsdWUoZnJhbWUucGFkZGluZ1JpZ2h0KTtcbiAgICAgICAgYWRkVmFsdWUoZnJhbWUuaXRlbVNwYWNpbmcpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2Fsayhyb290KTtcblxuICByZXR1cm4gT2JqZWN0LmVudHJpZXMoc3BhY2luZ01hcClcbiAgICAubWFwKChbdmFsdWUsIGNvdW50XSkgPT4gKHsgdmFsdWU6IE51bWJlcih2YWx1ZSksIGNvdW50IH0pKVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLnZhbHVlIC0gYi52YWx1ZSk7XG59XG4iLCAiaW1wb3J0IHsgR3JpZFNwZWMgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHRvQ3NzVmFsdWUgfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBEZXRlY3QgdGhlIGdyaWQvbGF5b3V0IHN0cnVjdHVyZSBvZiBhIGZyYW1lIGFuZCByZXR1cm4gYSBHcmlkU3BlYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdEdyaWQobm9kZTogRnJhbWVOb2RlKTogR3JpZFNwZWMge1xuICAvLyBBdXRvLWxheW91dCBmcmFtZSBcdTIxOTIgZmxleCBvciBncmlkXG4gIGlmIChub2RlLmxheW91dE1vZGUgJiYgbm9kZS5sYXlvdXRNb2RlICE9PSAnTk9ORScpIHtcbiAgICBjb25zdCBpc1dyYXBwaW5nID0gJ2xheW91dFdyYXAnIGluIG5vZGUgJiYgKG5vZGUgYXMgYW55KS5sYXlvdXRXcmFwID09PSAnV1JBUCc7XG5cbiAgICBpZiAoaXNXcmFwcGluZykge1xuICAgICAgLy8gV3JhcHBpbmcgYXV0by1sYXlvdXQgPSBmbGV4LXdyYXAgKGdyaWQtbGlrZSlcbiAgICAgIGNvbnN0IGNvbHVtbnMgPSBlc3RpbWF0ZUNvbHVtbnNGcm9tQ2hpbGRyZW4obm9kZSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYXlvdXRNb2RlOiAnZmxleCcsXG4gICAgICAgIGNvbHVtbnMsXG4gICAgICAgIGdhcDogdG9Dc3NWYWx1ZShub2RlLml0ZW1TcGFjaW5nKSxcbiAgICAgICAgcm93R2FwOiAnY291bnRlckF4aXNTcGFjaW5nJyBpbiBub2RlID8gdG9Dc3NWYWx1ZSgobm9kZSBhcyBhbnkpLmNvdW50ZXJBeGlzU3BhY2luZykgOiBudWxsLFxuICAgICAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgICAgIGl0ZW1NaW5XaWR0aDogZXN0aW1hdGVJdGVtTWluV2lkdGgobm9kZSwgY29sdW1ucyksXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIE5vbi13cmFwcGluZyBhdXRvLWxheW91dFxuICAgIGNvbnN0IGlzSG9yaXpvbnRhbCA9IG5vZGUubGF5b3V0TW9kZSA9PT0gJ0hPUklaT05UQUwnO1xuXG4gICAgaWYgKGlzSG9yaXpvbnRhbCkge1xuICAgICAgLy8gSG9yaXpvbnRhbCBsYXlvdXQgXHUyMDE0IGNoaWxkcmVuIGFyZSBjb2x1bW5zXG4gICAgICBjb25zdCBjb2x1bW5zID0gbm9kZS5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlKS5sZW5ndGg7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYXlvdXRNb2RlOiAnZmxleCcsXG4gICAgICAgIGNvbHVtbnMsXG4gICAgICAgIGdhcDogdG9Dc3NWYWx1ZShub2RlLml0ZW1TcGFjaW5nKSxcbiAgICAgICAgcm93R2FwOiBudWxsLFxuICAgICAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgICAgIGl0ZW1NaW5XaWR0aDogbnVsbCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gVmVydGljYWwgbGF5b3V0IFx1MjAxNCBzaW5nbGUgY29sdW1uLCBjaGlsZHJlbiBhcmUgcm93c1xuICAgIC8vIEJ1dCBjaGVjayBpZiBhbnkgZGlyZWN0IGNoaWxkIGlzIGEgaG9yaXpvbnRhbCBhdXRvLWxheW91dCAobmVzdGVkIGdyaWQpXG4gICAgY29uc3QgaG9yaXpvbnRhbENoaWxkID0gbm9kZS5jaGlsZHJlbi5maW5kKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScpICYmXG4gICAgICAoYyBhcyBGcmFtZU5vZGUpLmxheW91dE1vZGUgPT09ICdIT1JJWk9OVEFMJ1xuICAgICkgYXMgRnJhbWVOb2RlIHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKGhvcml6b250YWxDaGlsZCkge1xuICAgICAgY29uc3QgaW5uZXJDb2x1bW5zID0gaG9yaXpvbnRhbENoaWxkLmNoaWxkcmVuLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UpLmxlbmd0aDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxheW91dE1vZGU6ICdmbGV4JyxcbiAgICAgICAgY29sdW1uczogaW5uZXJDb2x1bW5zLFxuICAgICAgICBnYXA6IHRvQ3NzVmFsdWUoaG9yaXpvbnRhbENoaWxkLml0ZW1TcGFjaW5nKSxcbiAgICAgICAgcm93R2FwOiB0b0Nzc1ZhbHVlKG5vZGUuaXRlbVNwYWNpbmcpLFxuICAgICAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgICAgIGl0ZW1NaW5XaWR0aDogZXN0aW1hdGVJdGVtTWluV2lkdGgoaG9yaXpvbnRhbENoaWxkLCBpbm5lckNvbHVtbnMpLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbGF5b3V0TW9kZTogJ2ZsZXgnLFxuICAgICAgY29sdW1uczogMSxcbiAgICAgIGdhcDogdG9Dc3NWYWx1ZShub2RlLml0ZW1TcGFjaW5nKSxcbiAgICAgIHJvd0dhcDogbnVsbCxcbiAgICAgIGNvbHVtbkdhcDogbnVsbCxcbiAgICAgIGl0ZW1NaW5XaWR0aDogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgLy8gTm8gYXV0by1sYXlvdXQgXHUyMTkyIGFic29sdXRlIHBvc2l0aW9uaW5nXG4gIGNvbnN0IGNvbHVtbnMgPSBlc3RpbWF0ZUNvbHVtbnNGcm9tQWJzb2x1dGVDaGlsZHJlbihub2RlKTtcbiAgcmV0dXJuIHtcbiAgICBsYXlvdXRNb2RlOiAnYWJzb2x1dGUnLFxuICAgIGNvbHVtbnMsXG4gICAgZ2FwOiBlc3RpbWF0ZUdhcEZyb21BYnNvbHV0ZUNoaWxkcmVuKG5vZGUpLFxuICAgIHJvd0dhcDogbnVsbCxcbiAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgaXRlbU1pbldpZHRoOiBudWxsLFxuICB9O1xufVxuXG4vKipcbiAqIEVzdGltYXRlIGNvbHVtbiBjb3VudCBmcm9tIHdyYXBwaW5nIGF1dG8tbGF5b3V0IGNoaWxkcmVuLlxuICogQ291bnRzIGhvdyBtYW55IGNoaWxkcmVuIGZpdCBpbiB0aGUgZmlyc3QgXCJyb3dcIiAoc2ltaWxhciBZIHBvc2l0aW9uKS5cbiAqL1xuZnVuY3Rpb24gZXN0aW1hdGVDb2x1bW5zRnJvbUNoaWxkcmVuKG5vZGU6IEZyYW1lTm9kZSk6IG51bWJlciB7XG4gIGNvbnN0IHZpc2libGUgPSBub2RlLmNoaWxkcmVuLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UgJiYgYy5hYnNvbHV0ZUJvdW5kaW5nQm94KTtcbiAgaWYgKHZpc2libGUubGVuZ3RoIDw9IDEpIHJldHVybiAxO1xuXG4gIGNvbnN0IGZpcnN0WSA9IHZpc2libGVbMF0uYWJzb2x1dGVCb3VuZGluZ0JveCEueTtcbiAgY29uc3QgdG9sZXJhbmNlID0gNTsgLy8gcHhcbiAgbGV0IGNvbHVtbnNJbkZpcnN0Um93ID0gMDtcblxuICBmb3IgKGNvbnN0IGNoaWxkIG9mIHZpc2libGUpIHtcbiAgICBpZiAoTWF0aC5hYnMoY2hpbGQuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGZpcnN0WSkgPD0gdG9sZXJhbmNlKSB7XG4gICAgICBjb2x1bW5zSW5GaXJzdFJvdysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gTWF0aC5tYXgoMSwgY29sdW1uc0luRmlyc3RSb3cpO1xufVxuXG4vKipcbiAqIEVzdGltYXRlIGNvbHVtbiBjb3VudCBmcm9tIGFic29sdXRlbHktcG9zaXRpb25lZCBjaGlsZHJlbi5cbiAqIEdyb3VwcyBjaGlsZHJlbiBieSBZIHBvc2l0aW9uIChzYW1lIHJvdyA9IHNhbWUgWSBcdTAwQjEgdG9sZXJhbmNlKS5cbiAqL1xuZnVuY3Rpb24gZXN0aW1hdGVDb2x1bW5zRnJvbUFic29sdXRlQ2hpbGRyZW4obm9kZTogRnJhbWVOb2RlKTogbnVtYmVyIHtcbiAgY29uc3QgdmlzaWJsZSA9IG5vZGUuY2hpbGRyZW5cbiAgICAuZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSAmJiBjLmFic29sdXRlQm91bmRpbmdCb3gpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueSk7XG5cbiAgaWYgKHZpc2libGUubGVuZ3RoIDw9IDEpIHJldHVybiAxO1xuXG4gIGNvbnN0IGZpcnN0WSA9IHZpc2libGVbMF0uYWJzb2x1dGVCb3VuZGluZ0JveCEueTtcbiAgY29uc3QgdG9sZXJhbmNlID0gMTA7XG4gIGxldCBjb3VudCA9IDA7XG5cbiAgZm9yIChjb25zdCBjaGlsZCBvZiB2aXNpYmxlKSB7XG4gICAgaWYgKE1hdGguYWJzKGNoaWxkLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBmaXJzdFkpIDw9IHRvbGVyYW5jZSkge1xuICAgICAgY291bnQrKztcbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE1hdGgubWF4KDEsIGNvdW50KTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBnYXAgYmV0d2VlbiBhYnNvbHV0ZWx5LXBvc2l0aW9uZWQgY2hpbGRyZW4gb24gdGhlIHNhbWUgcm93LlxuICovXG5mdW5jdGlvbiBlc3RpbWF0ZUdhcEZyb21BYnNvbHV0ZUNoaWxkcmVuKG5vZGU6IEZyYW1lTm9kZSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCB2aXNpYmxlID0gbm9kZS5jaGlsZHJlblxuICAgIC5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlICYmIGMuYWJzb2x1dGVCb3VuZGluZ0JveClcbiAgICAuc29ydCgoYSwgYikgPT4gYS5hYnNvbHV0ZUJvdW5kaW5nQm94IS54IC0gYi5hYnNvbHV0ZUJvdW5kaW5nQm94IS54KTtcblxuICBpZiAodmlzaWJsZS5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDtcblxuICAvLyBVc2UgdGhlIGZpcnN0IHJvdyBvZiBjaGlsZHJlblxuICBjb25zdCBmaXJzdFkgPSB2aXNpYmxlWzBdLmFic29sdXRlQm91bmRpbmdCb3ghLnk7XG4gIGNvbnN0IHRvbGVyYW5jZSA9IDEwO1xuICBjb25zdCBmaXJzdFJvdyA9IHZpc2libGUuZmlsdGVyKGMgPT5cbiAgICBNYXRoLmFicyhjLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBmaXJzdFkpIDw9IHRvbGVyYW5jZVxuICApO1xuXG4gIGlmIChmaXJzdFJvdy5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDtcblxuICBsZXQgdG90YWxHYXAgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpcnN0Um93Lmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGNvbnN0IHJpZ2h0RWRnZSA9IGZpcnN0Um93W2ldLmFic29sdXRlQm91bmRpbmdCb3ghLnggKyBmaXJzdFJvd1tpXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS53aWR0aDtcbiAgICBjb25zdCBuZXh0TGVmdCA9IGZpcnN0Um93W2kgKyAxXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS54O1xuICAgIHRvdGFsR2FwICs9IG5leHRMZWZ0IC0gcmlnaHRFZGdlO1xuICB9XG5cbiAgY29uc3QgYXZnR2FwID0gTWF0aC5yb3VuZCh0b3RhbEdhcCAvIChmaXJzdFJvdy5sZW5ndGggLSAxKSk7XG4gIHJldHVybiBhdmdHYXAgPiAwID8gdG9Dc3NWYWx1ZShhdmdHYXApIDogbnVsbDtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBtaW5pbXVtIGl0ZW0gd2lkdGggZnJvbSBhIGhvcml6b250YWwgbGF5b3V0J3MgY2hpbGRyZW4uXG4gKi9cbmZ1bmN0aW9uIGVzdGltYXRlSXRlbU1pbldpZHRoKG5vZGU6IEZyYW1lTm9kZSwgY29sdW1uczogbnVtYmVyKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmIChjb2x1bW5zIDw9IDEpIHJldHVybiBudWxsO1xuICBjb25zdCB2aXNpYmxlID0gbm9kZS5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlICYmIGMuYWJzb2x1dGVCb3VuZGluZ0JveCk7XG4gIGlmICh2aXNpYmxlLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3Qgd2lkdGhzID0gdmlzaWJsZS5tYXAoYyA9PiBjLmFic29sdXRlQm91bmRpbmdCb3ghLndpZHRoKTtcbiAgY29uc3QgbWluV2lkdGggPSBNYXRoLm1pbiguLi53aWR0aHMpO1xuICByZXR1cm4gdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKG1pbldpZHRoKSk7XG59XG4iLCAiaW1wb3J0IHsgSW50ZXJhY3Rpb25TcGVjIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyByZ2JUb0hleCwgZXh0cmFjdEJhY2tncm91bmRDb2xvciB9IGZyb20gJy4vY29sb3InO1xuaW1wb3J0IHsgdG9Dc3NWYWx1ZSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIE1hcCBGaWdtYSB0cmlnZ2VyIHR5cGUgdG8gb3VyIHNpbXBsaWZpZWQgdHJpZ2dlciBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIG1hcFRyaWdnZXIodHJpZ2dlclR5cGU6IHN0cmluZyk6IEludGVyYWN0aW9uU3BlY1sndHJpZ2dlciddIHwgbnVsbCB7XG4gIHN3aXRjaCAodHJpZ2dlclR5cGUpIHtcbiAgICBjYXNlICdPTl9IT1ZFUic6IHJldHVybiAnaG92ZXInO1xuICAgIGNhc2UgJ09OX0NMSUNLJzogcmV0dXJuICdjbGljayc7XG4gICAgY2FzZSAnT05fUFJFU1MnOiByZXR1cm4gJ3ByZXNzJztcbiAgICBjYXNlICdNT1VTRV9FTlRFUic6IHJldHVybiAnbW91c2UtZW50ZXInO1xuICAgIGNhc2UgJ01PVVNFX0xFQVZFJzogcmV0dXJuICdtb3VzZS1sZWF2ZSc7XG4gICAgZGVmYXVsdDogcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXAgRmlnbWEgZWFzaW5nIHR5cGUgdG8gQ1NTIHRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBtYXBFYXNpbmcoZWFzaW5nOiBhbnkpOiBzdHJpbmcge1xuICBpZiAoIWVhc2luZykgcmV0dXJuICdlYXNlJztcbiAgc3dpdGNoIChlYXNpbmcudHlwZSkge1xuICAgIGNhc2UgJ0VBU0VfSU4nOiByZXR1cm4gJ2Vhc2UtaW4nO1xuICAgIGNhc2UgJ0VBU0VfT1VUJzogcmV0dXJuICdlYXNlLW91dCc7XG4gICAgY2FzZSAnRUFTRV9JTl9BTkRfT1VUJzogcmV0dXJuICdlYXNlLWluLW91dCc7XG4gICAgY2FzZSAnTElORUFSJzogcmV0dXJuICdsaW5lYXInO1xuICAgIGNhc2UgJ0NVU1RPTV9DVUJJQ19CRVpJRVInOiB7XG4gICAgICBjb25zdCBiID0gZWFzaW5nLmVhc2luZ0Z1bmN0aW9uQ3ViaWNCZXppZXI7XG4gICAgICBpZiAoYikgcmV0dXJuIGBjdWJpYy1iZXppZXIoJHtiLngxfSwgJHtiLnkxfSwgJHtiLngyfSwgJHtiLnkyfSlgO1xuICAgICAgcmV0dXJuICdlYXNlJztcbiAgICB9XG4gICAgZGVmYXVsdDogcmV0dXJuICdlYXNlJztcbiAgfVxufVxuXG4vKipcbiAqIERpZmYgdGhlIHZpc3VhbCBwcm9wZXJ0aWVzIGJldHdlZW4gYSBzb3VyY2Ugbm9kZSBhbmQgYSBkZXN0aW5hdGlvbiBub2RlLlxuICogUmV0dXJucyBhIHJlY29yZCBvZiBDU1MgcHJvcGVydHkgY2hhbmdlcy5cbiAqL1xuZnVuY3Rpb24gZGlmZk5vZGVTdHlsZXMoXG4gIHNvdXJjZTogU2NlbmVOb2RlLFxuICBkZXN0OiBTY2VuZU5vZGVcbik6IFJlY29yZDxzdHJpbmcsIHsgZnJvbTogc3RyaW5nOyB0bzogc3RyaW5nIH0+IHtcbiAgY29uc3QgY2hhbmdlczogUmVjb3JkPHN0cmluZywgeyBmcm9tOiBzdHJpbmc7IHRvOiBzdHJpbmcgfT4gPSB7fTtcblxuICAvLyBCYWNrZ3JvdW5kIGNvbG9yXG4gIGNvbnN0IHNyY0JnID0gZXh0cmFjdEJhY2tncm91bmRDb2xvcihzb3VyY2UgYXMgYW55KTtcbiAgY29uc3QgZGVzdEJnID0gZXh0cmFjdEJhY2tncm91bmRDb2xvcihkZXN0IGFzIGFueSk7XG4gIGlmIChzcmNCZyAmJiBkZXN0QmcgJiYgc3JjQmcgIT09IGRlc3RCZykge1xuICAgIGNoYW5nZXMuYmFja2dyb3VuZENvbG9yID0geyBmcm9tOiBzcmNCZywgdG86IGRlc3RCZyB9O1xuICB9XG5cbiAgLy8gT3BhY2l0eVxuICBpZiAoJ29wYWNpdHknIGluIHNvdXJjZSAmJiAnb3BhY2l0eScgaW4gZGVzdCkge1xuICAgIGNvbnN0IHNyY09wID0gKHNvdXJjZSBhcyBhbnkpLm9wYWNpdHk7XG4gICAgY29uc3QgZGVzdE9wID0gKGRlc3QgYXMgYW55KS5vcGFjaXR5O1xuICAgIGlmIChzcmNPcCAhPT0gdW5kZWZpbmVkICYmIGRlc3RPcCAhPT0gdW5kZWZpbmVkICYmIE1hdGguYWJzKHNyY09wIC0gZGVzdE9wKSA+IDAuMDEpIHtcbiAgICAgIGNoYW5nZXMub3BhY2l0eSA9IHsgZnJvbTogU3RyaW5nKHNyY09wKSwgdG86IFN0cmluZyhkZXN0T3ApIH07XG4gICAgfVxuICB9XG5cbiAgLy8gU2l6ZSAodHJhbnNmb3JtOiBzY2FsZSlcbiAgaWYgKHNvdXJjZS5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmIGRlc3QuYWJzb2x1dGVCb3VuZGluZ0JveCkge1xuICAgIGNvbnN0IHNyY1cgPSBzb3VyY2UuYWJzb2x1dGVCb3VuZGluZ0JveC53aWR0aDtcbiAgICBjb25zdCBkZXN0VyA9IGRlc3QuYWJzb2x1dGVCb3VuZGluZ0JveC53aWR0aDtcbiAgICBpZiAoc3JjVyA+IDAgJiYgZGVzdFcgPiAwKSB7XG4gICAgICBjb25zdCBzY2FsZVggPSBNYXRoLnJvdW5kKChkZXN0VyAvIHNyY1cpICogMTAwKSAvIDEwMDtcbiAgICAgIGlmIChNYXRoLmFicyhzY2FsZVggLSAxKSA+IDAuMDEpIHtcbiAgICAgICAgY2hhbmdlcy50cmFuc2Zvcm0gPSB7IGZyb206ICdzY2FsZSgxKScsIHRvOiBgc2NhbGUoJHtzY2FsZVh9KWAgfTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBCb3JkZXIgcmFkaXVzXG4gIGlmICgnY29ybmVyUmFkaXVzJyBpbiBzb3VyY2UgJiYgJ2Nvcm5lclJhZGl1cycgaW4gZGVzdCkge1xuICAgIGNvbnN0IHNyY1IgPSAoc291cmNlIGFzIGFueSkuY29ybmVyUmFkaXVzO1xuICAgIGNvbnN0IGRlc3RSID0gKGRlc3QgYXMgYW55KS5jb3JuZXJSYWRpdXM7XG4gICAgaWYgKHR5cGVvZiBzcmNSID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgZGVzdFIgPT09ICdudW1iZXInICYmIHNyY1IgIT09IGRlc3RSKSB7XG4gICAgICBjaGFuZ2VzLmJvcmRlclJhZGl1cyA9IHsgZnJvbTogdG9Dc3NWYWx1ZShzcmNSKSEsIHRvOiB0b0Nzc1ZhbHVlKGRlc3RSKSEgfTtcbiAgICB9XG4gIH1cblxuICAvLyBCb3ggc2hhZG93IChlZmZlY3RzKVxuICBpZiAoJ2VmZmVjdHMnIGluIHNvdXJjZSAmJiAnZWZmZWN0cycgaW4gZGVzdCkge1xuICAgIGNvbnN0IHNyY1NoYWRvdyA9IGV4dHJhY3RCb3hTaGFkb3coc291cmNlIGFzIGFueSk7XG4gICAgY29uc3QgZGVzdFNoYWRvdyA9IGV4dHJhY3RCb3hTaGFkb3coZGVzdCBhcyBhbnkpO1xuICAgIGlmIChzcmNTaGFkb3cgIT09IGRlc3RTaGFkb3cpIHtcbiAgICAgIGNoYW5nZXMuYm94U2hhZG93ID0geyBmcm9tOiBzcmNTaGFkb3cgfHwgJ25vbmUnLCB0bzogZGVzdFNoYWRvdyB8fCAnbm9uZScgfTtcbiAgICB9XG4gIH1cblxuICAvLyBCb3JkZXIgY29sb3Ivd2lkdGggZnJvbSBzdHJva2VzXG4gIGlmICgnc3Ryb2tlcycgaW4gc291cmNlICYmICdzdHJva2VzJyBpbiBkZXN0KSB7XG4gICAgY29uc3Qgc3JjU3Ryb2tlID0gZXh0cmFjdFN0cm9rZUNvbG9yKHNvdXJjZSBhcyBhbnkpO1xuICAgIGNvbnN0IGRlc3RTdHJva2UgPSBleHRyYWN0U3Ryb2tlQ29sb3IoZGVzdCBhcyBhbnkpO1xuICAgIGlmIChzcmNTdHJva2UgJiYgZGVzdFN0cm9rZSAmJiBzcmNTdHJva2UgIT09IGRlc3RTdHJva2UpIHtcbiAgICAgIGNoYW5nZXMuYm9yZGVyQ29sb3IgPSB7IGZyb206IHNyY1N0cm9rZSwgdG86IGRlc3RTdHJva2UgfTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY2hhbmdlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGJveC1zaGFkb3cgQ1NTIHZhbHVlIGZyb20gbm9kZSBlZmZlY3RzLlxuICovXG5mdW5jdGlvbiBleHRyYWN0Qm94U2hhZG93KG5vZGU6IHsgZWZmZWN0cz86IHJlYWRvbmx5IEVmZmVjdFtdIH0pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFub2RlLmVmZmVjdHMpIHJldHVybiBudWxsO1xuICBmb3IgKGNvbnN0IGVmZmVjdCBvZiBub2RlLmVmZmVjdHMpIHtcbiAgICBpZiAoZWZmZWN0LnR5cGUgPT09ICdEUk9QX1NIQURPVycgJiYgZWZmZWN0LnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICBjb25zdCB7IG9mZnNldCwgcmFkaXVzLCBzcHJlYWQsIGNvbG9yIH0gPSBlZmZlY3QgYXMgRHJvcFNoYWRvd0VmZmVjdDtcbiAgICAgIGNvbnN0IGhleCA9IHJnYlRvSGV4KGNvbG9yKTtcbiAgICAgIGNvbnN0IGFscGhhID0gTWF0aC5yb3VuZCgoY29sb3IuYSB8fCAxKSAqIDEwMCkgLyAxMDA7XG4gICAgICByZXR1cm4gYCR7b2Zmc2V0Lnh9cHggJHtvZmZzZXQueX1weCAke3JhZGl1c31weCAke3NwcmVhZCB8fCAwfXB4IHJnYmEoJHtNYXRoLnJvdW5kKGNvbG9yLnIgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGNvbG9yLmcgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGNvbG9yLmIgKiAyNTUpfSwgJHthbHBoYX0pYDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBwcmltYXJ5IHN0cm9rZSBjb2xvciBmcm9tIGEgbm9kZS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFN0cm9rZUNvbG9yKG5vZGU6IHsgc3Ryb2tlcz86IHJlYWRvbmx5IFBhaW50W10gfSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIW5vZGUuc3Ryb2tlcykgcmV0dXJuIG51bGw7XG4gIGZvciAoY29uc3Qgc3Ryb2tlIG9mIG5vZGUuc3Ryb2tlcykge1xuICAgIGlmIChzdHJva2UudHlwZSA9PT0gJ1NPTElEJyAmJiBzdHJva2UudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiByZ2JUb0hleChzdHJva2UuY29sb3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGFsbCBwcm90b3R5cGUgaW50ZXJhY3Rpb25zIGZyb20gYSBzZWN0aW9uJ3Mgbm9kZSB0cmVlLlxuICogV2Fsa3MgYWxsIGRlc2NlbmRhbnRzLCBmaW5kcyBub2RlcyB3aXRoIHJlYWN0aW9ucywgYW5kIHByb2R1Y2VzIEludGVyYWN0aW9uU3BlY1tdLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEludGVyYWN0aW9ucyhzZWN0aW9uUm9vdDogU2NlbmVOb2RlKTogSW50ZXJhY3Rpb25TcGVjW10ge1xuICBjb25zdCBpbnRlcmFjdGlvbnM6IEludGVyYWN0aW9uU3BlY1tdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAoJ3JlYWN0aW9ucycgaW4gbm9kZSkge1xuICAgICAgY29uc3QgcmVhY3Rpb25zID0gKG5vZGUgYXMgYW55KS5yZWFjdGlvbnMgYXMgYW55W107XG4gICAgICBpZiAocmVhY3Rpb25zICYmIHJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgcmVhY3Rpb24gb2YgcmVhY3Rpb25zKSB7XG4gICAgICAgICAgY29uc3QgdHJpZ2dlciA9IG1hcFRyaWdnZXIocmVhY3Rpb24udHJpZ2dlcj8udHlwZSk7XG4gICAgICAgICAgaWYgKCF0cmlnZ2VyKSBjb250aW51ZTtcblxuICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IHJlYWN0aW9uLmFjdGlvbiB8fCAocmVhY3Rpb24uYWN0aW9ucyAmJiByZWFjdGlvbi5hY3Rpb25zWzBdKTtcbiAgICAgICAgICBpZiAoIWFjdGlvbikgY29udGludWU7XG5cbiAgICAgICAgICAvLyBHZXQgdHJhbnNpdGlvbiBkYXRhXG4gICAgICAgICAgY29uc3QgdHJhbnNpdGlvbiA9IGFjdGlvbi50cmFuc2l0aW9uO1xuICAgICAgICAgIGNvbnN0IGR1cmF0aW9uID0gdHJhbnNpdGlvbj8uZHVyYXRpb24gPyBgJHt0cmFuc2l0aW9uLmR1cmF0aW9ufXNgIDogJzAuM3MnO1xuICAgICAgICAgIGNvbnN0IGVhc2luZyA9IG1hcEVhc2luZyh0cmFuc2l0aW9uPy5lYXNpbmcpO1xuXG4gICAgICAgICAgLy8gRm9yIGhvdmVyL2NsaWNrIHdpdGggZGVzdGluYXRpb24gbm9kZSBcdTIwMTQgZGlmZiBzdHlsZXNcbiAgICAgICAgICBpZiAoYWN0aW9uLmRlc3RpbmF0aW9uSWQgJiYgKHRyaWdnZXIgPT09ICdob3ZlcicgfHwgdHJpZ2dlciA9PT0gJ21vdXNlLWVudGVyJyB8fCB0cmlnZ2VyID09PSAnY2xpY2snKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgZGVzdE5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChhY3Rpb24uZGVzdGluYXRpb25JZCk7XG4gICAgICAgICAgICAgIGlmIChkZXN0Tm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5Q2hhbmdlcyA9IGRpZmZOb2RlU3R5bGVzKG5vZGUsIGRlc3ROb2RlIGFzIFNjZW5lTm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHByb3BlcnR5Q2hhbmdlcykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50TmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBmaWdtYU5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcixcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogeyBkdXJhdGlvbiwgZWFzaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5Q2hhbmdlcyxcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIC8vIERlc3RpbmF0aW9uIG5vZGUgbm90IGFjY2Vzc2libGUgKGRpZmZlcmVudCBwYWdlLCBldGMuKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3YWxrKHNlY3Rpb25Sb290KTtcbiAgcmV0dXJuIGludGVyYWN0aW9ucztcbn1cbiIsICJpbXBvcnQgeyBGaWdtYVZhcmlhYmxlc0V4cG9ydCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgcmdiVG9IZXggfSBmcm9tICcuL2NvbG9yJztcblxuLyoqXG4gKiBFeHRyYWN0IEZpZ21hIFZhcmlhYmxlcyAoZGVzaWduIHRva2VucykgZnJvbSB0aGUgY3VycmVudCBmaWxlLlxuICpcbiAqIFdoZW4gYSBkZXNpZ25lciBoYXMgc2V0IHVwIEZpZ21hIFZhcmlhYmxlcyAoY29sb3JzLCBudW1iZXJzLCBzdHJpbmdzLFxuICogYm9vbGVhbnMpIHRoZSB2YXJpYWJsZSBuYW1lcyBBUkUgdGhlIGRlc2lnbiB0b2tlbnMgdGhlIGRldmVsb3BlciBzaG91bGRcbiAqIHVzZS4gV2UgZXhwb3J0IHRoZW0gZ3JvdXBlZCBieSBjb2xsZWN0aW9uIGFuZCBmbGF0IGJ5IGZ1bGwgbmFtZSBzb1xuICogYWdlbnRzIGNhbiBlbWl0IGAtLWNsci1wcmltYXJ5YCBpbnN0ZWFkIG9mIGAtLWNsci0xYzFjMWNgLlxuICpcbiAqIFJldHVybnMgYHsgcHJlc2VudDogZmFsc2UgfWAgd2hlbiB0aGUgRmlnbWEgVmFyaWFibGVzIEFQSSBpcyB1bmF2YWlsYWJsZVxuICogb3Igbm8gdmFyaWFibGVzIGV4aXN0LiBBZ2VudHMgZmFsbCBiYWNrIHRvIGF1dG8tZ2VuZXJhdGVkIG5hbWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFZhcmlhYmxlcygpOiBGaWdtYVZhcmlhYmxlc0V4cG9ydCB7XG4gIGNvbnN0IG91dDogRmlnbWFWYXJpYWJsZXNFeHBvcnQgPSB7XG4gICAgY29sbGVjdGlvbnM6IHt9LFxuICAgIGZsYXQ6IHt9LFxuICAgIHByZXNlbnQ6IGZhbHNlLFxuICB9O1xuXG4gIC8vIEZlYXR1cmUtZGV0ZWN0IFx1MjAxNCBvbGRlciBGaWdtYSBjbGllbnRzIGRvbid0IGhhdmUgdmFyaWFibGVzIEFQSVxuICBpZiAoIWZpZ21hLnZhcmlhYmxlcyB8fCB0eXBlb2YgZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGxldCBjb2xsZWN0aW9uc0J5SWQ6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgdHJ5IHtcbiAgICBjb25zdCBsb2NhbENvbGxlY3Rpb25zID0gZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVDb2xsZWN0aW9ucygpO1xuICAgIGZvciAoY29uc3QgY29sIG9mIGxvY2FsQ29sbGVjdGlvbnMpIHtcbiAgICAgIGNvbGxlY3Rpb25zQnlJZFtjb2wuaWRdID0gY29sO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGxldCB2YXJpYWJsZXM6IFZhcmlhYmxlW10gPSBbXTtcbiAgdHJ5IHtcbiAgICB2YXJpYWJsZXMgPSBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZXMoKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuICBpZiAoIXZhcmlhYmxlcyB8fCB2YXJpYWJsZXMubGVuZ3RoID09PSAwKSByZXR1cm4gb3V0O1xuXG4gIG91dC5wcmVzZW50ID0gdHJ1ZTtcblxuICBmb3IgKGNvbnN0IHYgb2YgdmFyaWFibGVzKSB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zQnlJZFt2LnZhcmlhYmxlQ29sbGVjdGlvbklkXTtcbiAgICBpZiAoIWNvbGxlY3Rpb24pIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgZGVmYXVsdE1vZGVJZCA9IGNvbGxlY3Rpb24uZGVmYXVsdE1vZGVJZDtcbiAgICBjb25zdCByYXcgPSB2LnZhbHVlc0J5TW9kZVtkZWZhdWx0TW9kZUlkXTtcbiAgICBpZiAocmF3ID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgbGV0IHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xuICAgIGlmICh2LnJlc29sdmVkVHlwZSA9PT0gJ0NPTE9SJykge1xuICAgICAgLy8gQ09MT1IgdmFsdWVzIGFyZSBSR0JBIG9iamVjdHM7IGNvbnZlcnQgdG8gaGV4XG4gICAgICBpZiAocmF3ICYmIHR5cGVvZiByYXcgPT09ICdvYmplY3QnICYmICdyJyBpbiByYXcpIHtcbiAgICAgICAgdmFsdWUgPSByZ2JUb0hleChyYXcgYXMgYW55KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodi5yZXNvbHZlZFR5cGUgPT09ICdGTE9BVCcpIHtcbiAgICAgIHZhbHVlID0gdHlwZW9mIHJhdyA9PT0gJ251bWJlcicgPyByYXcgOiBOdW1iZXIocmF3KTtcbiAgICB9IGVsc2UgaWYgKHYucmVzb2x2ZWRUeXBlID09PSAnU1RSSU5HJykge1xuICAgICAgdmFsdWUgPSB0eXBlb2YgcmF3ID09PSAnc3RyaW5nJyA/IHJhdyA6IFN0cmluZyhyYXcpO1xuICAgIH0gZWxzZSBpZiAodi5yZXNvbHZlZFR5cGUgPT09ICdCT09MRUFOJykge1xuICAgICAgdmFsdWUgPSBCb29sZWFuKHJhdyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gY29sbGVjdGlvbi5uYW1lIHx8ICdEZWZhdWx0JztcbiAgICBpZiAoIW91dC5jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV0pIG91dC5jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV0gPSB7fTtcbiAgICBvdXQuY29sbGVjdGlvbnNbY29sbGVjdGlvbk5hbWVdW3YubmFtZV0gPSB2YWx1ZTtcblxuICAgIC8vIEZsYXQga2V5OiBcIjxjb2xsZWN0aW9uPi88dmFyaWFibGUtbmFtZT5cIiBzbyBkdXBsaWNhdGVzIGFjcm9zcyBjb2xsZWN0aW9ucyBkb24ndCBjb2xsaWRlXG4gICAgY29uc3QgZmxhdEtleSA9IGAke2NvbGxlY3Rpb25OYW1lfS8ke3YubmFtZX1gO1xuICAgIG91dC5mbGF0W2ZsYXRLZXldID0gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIEZpZ21hIHZhcmlhYmxlIG5hbWUgdG8gYSBDU1MgY3VzdG9tIHByb3BlcnR5IG5hbWUuXG4gKiAgIFwiQ29sb3JzL1ByaW1hcnlcIiBcdTIxOTIgXCItLWNsci1wcmltYXJ5XCJcbiAqICAgXCJTcGFjaW5nL21kXCIgXHUyMTkyIFwiLS1zcGFjZS1tZFwiXG4gKiAgIFwiUmFkaXVzL2xnXCIgXHUyMTkyIFwiLS1yYWRpdXMtbGdcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9Dc3NDdXN0b21Qcm9wZXJ0eSh2YXJpYWJsZU5hbWU6IHN0cmluZywgY29sbGVjdGlvbk5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNvbCA9IGNvbGxlY3Rpb25OYW1lLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IG5hbWUgPSB2YXJpYWJsZU5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtejAtOV0rL2csICctJykucmVwbGFjZSgvLSsvZywgJy0nKS5yZXBsYWNlKC9eLXwtJC9nLCAnJyk7XG5cbiAgaWYgKGNvbC5pbmNsdWRlcygnY29sb3InKSB8fCBjb2wuaW5jbHVkZXMoJ2NvbG91cicpKSByZXR1cm4gYC0tY2xyLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdzcGFjJykpIHJldHVybiBgLS1zcGFjZS0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygncmFkaXVzJykpIHJldHVybiBgLS1yYWRpdXMtJHtuYW1lfWA7XG4gIGlmIChjb2wuaW5jbHVkZXMoJ2ZvbnQnKSAmJiBjb2wuaW5jbHVkZXMoJ3NpemUnKSkgcmV0dXJuIGAtLWZzLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdmb250JykgJiYgY29sLmluY2x1ZGVzKCd3ZWlnaHQnKSkgcmV0dXJuIGAtLWZ3LSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdmb250JykgfHwgY29sLmluY2x1ZGVzKCdmYW1pbHknKSkgcmV0dXJuIGAtLWZmLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdsaW5lJykpIHJldHVybiBgLS1saC0ke25hbWV9YDtcbiAgcmV0dXJuIGAtLSR7Y29sLnJlcGxhY2UoL1teYS16MC05XSsvZywgJy0nKX0tJHtuYW1lfWA7XG59XG4iLCAiaW1wb3J0IHtcbiAgQ29tcG9uZW50UGF0dGVybiwgUmVwZWF0ZXJJbmZvLCBSZXBlYXRlckl0ZW0sIE5hdmlnYXRpb25JbmZvLCBTZWN0aW9uVHlwZSxcbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBzbHVnaWZ5LCBpc0RlZmF1bHRMYXllck5hbWUgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGhhc0ltYWdlRmlsbCB9IGZyb20gJy4vY29sb3InO1xuXG4vKipcbiAqIENvbXB1dGUgYSBsb29zZSBcInN0cnVjdHVyZSBmaW5nZXJwcmludFwiIGZvciBhIG5vZGUuIFR3byBjaGlsZHJlbiB3aXRoIHRoZVxuICogc2FtZSBmaW5nZXJwcmludCBhcmUgdHJlYXRlZCBhcyBzaWJsaW5ncyBvZiB0aGUgc2FtZSByZXBlYXRlciB0ZW1wbGF0ZVxuICogKHNhbWUgY2FyZCBsYXlvdXQgcmVwZWF0ZWQgMyB0aW1lcywgZXRjLikuIFdlIGRlbGliZXJhdGVseSBpZ25vcmUgdGV4dFxuICogY29udGVudCBhbmQgc3BlY2lmaWMgc2l6ZXMgc28gbWlub3IgdmFyaWF0aW9ucyBzdGlsbCBtYXRjaC5cbiAqL1xuZnVuY3Rpb24gc3RydWN0dXJlRmluZ2VycHJpbnQobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyID0gMCk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtgVD0ke25vZGUudHlwZX1gXTtcbiAgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkpIHBhcnRzLnB1c2goJ0lNRycpO1xuXG4gIGlmICgnY2hpbGRyZW4nIGluIG5vZGUgJiYgZGVwdGggPCAyKSB7XG4gICAgY29uc3QgY2hpbGRGcHM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQudmlzaWJsZSA9PT0gZmFsc2UpIGNvbnRpbnVlO1xuICAgICAgY2hpbGRGcHMucHVzaChzdHJ1Y3R1cmVGaW5nZXJwcmludChjaGlsZCwgZGVwdGggKyAxKSk7XG4gICAgfVxuICAgIGNoaWxkRnBzLnNvcnQoKTtcbiAgICBwYXJ0cy5wdXNoKGBDPVske2NoaWxkRnBzLmpvaW4oJywnKX1dYCk7XG4gIH1cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJ3wnKTtcbn1cblxuY29uc3QgUkVQRUFURVJfTkFNRV9ISU5UUyA9IC9cXGIoY2FyZHM/fGl0ZW1zP3xsaXN0fGdyaWR8ZmVhdHVyZXM/fHNlcnZpY2VzP3x0ZWFtfGxvZ29zP3x0ZXN0aW1vbmlhbHM/fHByaWNpbmd8cGxhbnM/fGFydGljbGVzP3xwb3N0cz98YmxvZ3xmYXFzPylcXGIvaTtcblxuLyoqXG4gKiBEZXRlY3QgcmVwZWF0ZXIgZ3JvdXBzIGluc2lkZSBhIHNlY3Rpb24uIENvbnNlcnZhdGl2ZTpcbiAqICAgLSBcdTIyNjUzIGNoaWxkcmVuIHNoYXJlIGEgZmluZ2VycHJpbnQsIE9SXG4gKiAgIC0gXHUyMjY1MiBjaGlsZHJlbiBzaGFyZSBhIGZpbmdlcnByaW50IEFORCB0aGUgcGFyZW50IG5hbWUgaGludHMgcmVwZXRpdGlvblxuICogICAgIEFORCB0aGUgbWF0Y2hpbmcgZ3JvdXAgY292ZXJzIFx1MjI2NTYwJSBvZiB2aXNpYmxlIGNoaWxkcmVuLlxuICpcbiAqIFRoZSBleGlzdGluZyBgZWxlbWVudHNgIG1hcCBpcyB1bnRvdWNoZWQgXHUyMDE0IHJlcGVhdGVycyBhcmUgYW4gYWRkaXRpdmVcbiAqIHNpZ25hbCB0aGUgYWdlbnQgY2FuIG9wdCBpbnRvIGZvciBjbGVhbmVyIEFDRiBSZXBlYXRlciBvdXRwdXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RSZXBlYXRlcnMoc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSk6IFJlY29yZDxzdHJpbmcsIFJlcGVhdGVySW5mbz4ge1xuICBjb25zdCByZXBlYXRlcnM6IFJlY29yZDxzdHJpbmcsIFJlcGVhdGVySW5mbz4gPSB7fTtcbiAgY29uc3QgdXNlZEtleXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmdW5jdGlvbiBrZXlGb3IoY29udGFpbmVyTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBiYXNlID0gY29udGFpbmVyTmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKVxuICAgICAgfHwgYHJlcGVhdGVyXyR7T2JqZWN0LmtleXMocmVwZWF0ZXJzKS5sZW5ndGggKyAxfWA7XG4gICAgaWYgKCF1c2VkS2V5cy5oYXMoYmFzZSkpIHtcbiAgICAgIHVzZWRLZXlzLmFkZChiYXNlKTtcbiAgICAgIHJldHVybiBiYXNlO1xuICAgIH1cbiAgICBsZXQgaSA9IDI7XG4gICAgd2hpbGUgKHVzZWRLZXlzLmhhcyhgJHtiYXNlfV8ke2l9YCkpIGkrKztcbiAgICB1c2VkS2V5cy5hZGQoYCR7YmFzZX1fJHtpfWApO1xuICAgIHJldHVybiBgJHtiYXNlfV8ke2l9YDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgaWYgKGRlcHRoID4gNSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghKCdjaGlsZHJlbicgaW4gbm9kZSkpIHJldHVybiBmYWxzZTtcblxuICAgIGNvbnN0IGtpZHMgPSAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UpO1xuICAgIGlmIChraWRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICBjb25zdCBncm91cHMgPSBuZXcgTWFwPHN0cmluZywgU2NlbmVOb2RlW10+KCk7XG4gICAgICBmb3IgKGNvbnN0IGsgb2Yga2lkcykge1xuICAgICAgICBjb25zdCBmcCA9IHN0cnVjdHVyZUZpbmdlcnByaW50KGspO1xuICAgICAgICBpZiAoIWdyb3Vwcy5oYXMoZnApKSBncm91cHMuc2V0KGZwLCBbXSk7XG4gICAgICAgIGdyb3Vwcy5nZXQoZnApIS5wdXNoKGspO1xuICAgICAgfVxuICAgICAgbGV0IGJlc3RHcm91cDogU2NlbmVOb2RlW10gfCBudWxsID0gbnVsbDtcbiAgICAgIGZvciAoY29uc3QgZyBvZiBncm91cHMudmFsdWVzKCkpIHtcbiAgICAgICAgaWYgKCFiZXN0R3JvdXAgfHwgZy5sZW5ndGggPiBiZXN0R3JvdXAubGVuZ3RoKSBiZXN0R3JvdXAgPSBnO1xuICAgICAgfVxuICAgICAgaWYgKGJlc3RHcm91cCAmJiBiZXN0R3JvdXAubGVuZ3RoID49IDIpIHtcbiAgICAgICAgY29uc3QgaXNCaWdHcm91cCA9IGJlc3RHcm91cC5sZW5ndGggPj0gMztcbiAgICAgICAgY29uc3QgaGludE1hdGNoID0gUkVQRUFURVJfTkFNRV9ISU5UUy50ZXN0KG5vZGUubmFtZSB8fCAnJyk7XG4gICAgICAgIGNvbnN0IGRvbWluYXRlcyA9IGJlc3RHcm91cC5sZW5ndGggPj0gTWF0aC5jZWlsKGtpZHMubGVuZ3RoICogMC42KTtcbiAgICAgICAgaWYgKGlzQmlnR3JvdXAgfHwgKGhpbnRNYXRjaCAmJiBkb21pbmF0ZXMpKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0ga2V5Rm9yKG5vZGUubmFtZSB8fCAncmVwZWF0ZXInKTtcbiAgICAgICAgICByZXBlYXRlcnNba2V5XSA9IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckxheWVyTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgaXRlbUNvdW50OiBiZXN0R3JvdXAubGVuZ3RoLFxuICAgICAgICAgICAgdGVtcGxhdGVMYXllck5hbWU6IGJlc3RHcm91cFswXS5uYW1lLFxuICAgICAgICAgICAgaXRlbXM6IGJlc3RHcm91cC5tYXAoZXh0cmFjdFJlcGVhdGVySXRlbSksXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gRG9uJ3QgcmVjdXJzZSBpbnRvIHJlcGVhdGVyIGNoaWxkcmVuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGMgb2Yga2lkcykgd2FsayhjLCBkZXB0aCArIDEpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICgnY2hpbGRyZW4nIGluIHNlY3Rpb25Ob2RlKSB7XG4gICAgZm9yIChjb25zdCBjIG9mIChzZWN0aW9uTm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoYy52aXNpYmxlICE9PSBmYWxzZSkgd2FsayhjLCAwKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcGVhdGVycztcbn1cblxuZnVuY3Rpb24gZXh0cmFjdFJlcGVhdGVySXRlbShub2RlOiBTY2VuZU5vZGUpOiBSZXBlYXRlckl0ZW0ge1xuICBjb25zdCBpdGVtOiBSZXBlYXRlckl0ZW0gPSB7IHRleHRzOiB7fSB9O1xuICBsZXQgdGV4dEluZGV4ID0gMDtcbiAgbGV0IGZpcnN0SW1hZ2VOYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgbGV0IGZpcnN0SW1hZ2VBbHQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHdhbGsobjogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG4udmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgIGlmIChuLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgdCA9IG4gYXMgVGV4dE5vZGU7XG4gICAgICBjb25zdCBjbGVhbiA9ICh0Lm5hbWUgfHwgJycpLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgY29uc3Qgcm9sZSA9IGNsZWFuICYmICEvXih0ZXh0fGZyYW1lfGdyb3VwfHJlY3RhbmdsZSlcXGQqJC8udGVzdChjbGVhbilcbiAgICAgICAgPyBjbGVhbiA6IGB0ZXh0XyR7dGV4dEluZGV4fWA7XG4gICAgICBpZiAodC5jaGFyYWN0ZXJzKSBpdGVtLnRleHRzW3JvbGVdID0gdC5jaGFyYWN0ZXJzO1xuICAgICAgdGV4dEluZGV4Kys7XG4gICAgfVxuXG4gICAgaWYgKCFmaXJzdEltYWdlTmFtZSAmJiBoYXNJbWFnZUZpbGwobiBhcyBhbnkpKSB7XG4gICAgICBmaXJzdEltYWdlTmFtZSA9IGAke3NsdWdpZnkobi5uYW1lIHx8ICdpbWFnZScpfS5wbmdgO1xuICAgICAgaWYgKG4ubmFtZSAmJiAhaXNEZWZhdWx0TGF5ZXJOYW1lKG4ubmFtZSkpIHtcbiAgICAgICAgZmlyc3RJbWFnZUFsdCA9IG4ubmFtZS5yZXBsYWNlKC9bLV9dL2csICcgJykucmVwbGFjZSgvXFxzKy9nLCAnICcpLnRyaW0oKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXGJcXHcvZywgYyA9PiBjLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghaXRlbS5saW5rVXJsICYmICdyZWFjdGlvbnMnIGluIG4pIHtcbiAgICAgIGNvbnN0IHJlYWN0aW9ucyA9IChuIGFzIGFueSkucmVhY3Rpb25zO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVhY3Rpb25zKSkge1xuICAgICAgICBvdXRlcjogZm9yIChjb25zdCByIG9mIHJlYWN0aW9ucykge1xuICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSByLmFjdGlvbnMgfHwgKHIuYWN0aW9uID8gW3IuYWN0aW9uXSA6IFtdKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGEgb2YgYWN0aW9ucykge1xuICAgICAgICAgICAgaWYgKGEgJiYgYS50eXBlID09PSAnVVJMJyAmJiBhLnVybCkgeyBpdGVtLmxpbmtVcmwgPSBhLnVybDsgYnJlYWsgb3V0ZXI7IH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgICBmb3IgKGNvbnN0IGMgb2YgKG4gYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikgd2FsayhjKTtcbiAgICB9XG4gIH1cbiAgd2Fsayhub2RlKTtcbiAgaWYgKGZpcnN0SW1hZ2VOYW1lKSBpdGVtLmltYWdlRmlsZSA9IGZpcnN0SW1hZ2VOYW1lO1xuICBpZiAoZmlyc3RJbWFnZUFsdCkgaXRlbS5hbHQgPSBmaXJzdEltYWdlQWx0O1xuICByZXR1cm4gaXRlbTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBDb21wb25lbnQgcGF0dGVybnM6IGNhcm91c2VsIC8gYWNjb3JkaW9uIC8gdGFicyAvIG1vZGFsXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgQ0FST1VTRUxfUlggPSAvXFxiKGNhcm91c2VsfHNsaWRlcnxzd2lwZXJ8Z2FsbGVyeXxzbGlkZXNob3cpXFxiL2k7XG5jb25zdCBBQ0NPUkRJT05fUlggPSAvXFxiKGFjY29yZGlvbnxmYXF8Y29sbGFwc2V8ZXhwYW5kZXJ8Y29sbGFwc2libGUpXFxiL2k7XG5jb25zdCBUQUJTX1JYID0gL1xcYnRhYnM/XFxiL2k7XG5jb25zdCBNT0RBTF9SWCA9IC9cXGIobW9kYWx8cG9wdXB8ZGlhbG9nfG92ZXJsYXl8bGlnaHRib3gpXFxiL2k7XG5cbi8qKlxuICogRGV0ZWN0IGludGVyYWN0aXZlIGNvbXBvbmVudCBwYXR0ZXJucy4gV2UgZmF2b3VyIGV4cGxpY2l0IGxheWVyLW5hbWVcbiAqIG1hdGNoZXMgb3ZlciBwdXJlIHN0cnVjdHVyYWwgZGV0ZWN0aW9uIHRvIGtlZXAgZmFsc2UgcG9zaXRpdmVzIGxvdy5cbiAqIFdoZW4gdGhlIG5hbWUgbWF0Y2hlcywgY29uZmlkZW5jZSBpcyAnaGlnaCc7IHdoZW4gaW5mZXJyZWQgc3RydWN0dXJhbGx5LFxuICogY29uZmlkZW5jZSBpcyAnbG93JyBhbmQgdGhlIGFnZW50IHNob3VsZCB2ZXJpZnkgYWdhaW5zdCB0aGUgc2NyZWVuc2hvdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENvbXBvbmVudFBhdHRlcm5zKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUpOiBDb21wb25lbnRQYXR0ZXJuW10ge1xuICBjb25zdCBwYXR0ZXJuczogQ29tcG9uZW50UGF0dGVybltdID0gW107XG4gIGNvbnN0IHNlZW5Ob2RlSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZnVuY3Rpb24gYWRkUGF0dGVybihwOiBDb21wb25lbnRQYXR0ZXJuKSB7XG4gICAgaWYgKHNlZW5Ob2RlSWRzLmhhcyhwLnJvb3ROb2RlSWQpKSByZXR1cm47XG4gICAgc2Vlbk5vZGVJZHMuYWRkKHAucm9vdE5vZGVJZCk7XG4gICAgcGF0dGVybnMucHVzaChwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgaWYgKGRlcHRoID4gNiB8fCBub2RlLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG4gICAgY29uc3QgbmFtZSA9IG5vZGUubmFtZSB8fCAnJztcblxuICAgIC8vIE1PREFMIFx1MjAxNCBuYW1lLW9ubHkgZGV0ZWN0aW9uIChzdHJ1Y3R1cmFsIGRldGVjdGlvbiBpcyB0b28gbm9pc3kpLlxuICAgIGlmIChNT0RBTF9SWC50ZXN0KG5hbWUpICYmICdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgYWRkUGF0dGVybih7XG4gICAgICAgIHR5cGU6ICdtb2RhbCcsXG4gICAgICAgIHJvb3ROb2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgIHJvb3ROb2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICBjb25maWRlbmNlOiAnaGlnaCcsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjsgLy8gZG9uJ3QgcmVjdXJzZSBpbnRvIG1vZGFsIGludGVybmFsc1xuICAgIH1cblxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBjb25zdCBraWRzID0gZnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSk7XG5cbiAgICAgIC8vIENBUk9VU0VMOiBleHBsaWNpdCBuYW1lIE9SIChob3Jpem9udGFsICsgY2xpcHNDb250ZW50ICsgXHUyMjY1MyBzaW1pbGFyIGNoaWxkcmVuKVxuICAgICAgY29uc3QgbmFtZUNhcm91c2VsID0gQ0FST1VTRUxfUlgudGVzdChuYW1lKTtcbiAgICAgIGNvbnN0IGhvcml6b250YWxDbGlwcGVkID0gZnJhbWUubGF5b3V0TW9kZSA9PT0gJ0hPUklaT05UQUwnICYmIGZyYW1lLmNsaXBzQ29udGVudCA9PT0gdHJ1ZTtcbiAgICAgIGlmIChuYW1lQ2Fyb3VzZWwgfHwgaG9yaXpvbnRhbENsaXBwZWQpIHtcbiAgICAgICAgaWYgKGtpZHMubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICBjb25zdCBmcDAgPSBzdHJ1Y3R1cmVGaW5nZXJwcmludChraWRzWzBdKTtcbiAgICAgICAgICBjb25zdCBtYXRjaGluZyA9IGtpZHMuZmlsdGVyKGsgPT4gc3RydWN0dXJlRmluZ2VycHJpbnQoaykgPT09IGZwMCkubGVuZ3RoO1xuICAgICAgICAgIGlmIChtYXRjaGluZyA+PSAzKSB7XG4gICAgICAgICAgICBhZGRQYXR0ZXJuKHtcbiAgICAgICAgICAgICAgdHlwZTogJ2Nhcm91c2VsJyxcbiAgICAgICAgICAgICAgcm9vdE5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICAgICAgcm9vdE5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgIGl0ZW1Db3VudDogbWF0Y2hpbmcsXG4gICAgICAgICAgICAgIGNvbmZpZGVuY2U6IG5hbWVDYXJvdXNlbCA/ICdoaWdoJyA6ICdsb3cnLFxuICAgICAgICAgICAgICBtZXRhOiB7XG4gICAgICAgICAgICAgICAgbGF5b3V0TW9kZTogZnJhbWUubGF5b3V0TW9kZSxcbiAgICAgICAgICAgICAgICBjbGlwc0NvbnRlbnQ6IGZyYW1lLmNsaXBzQ29udGVudCxcbiAgICAgICAgICAgICAgICBpdGVtU3BhY2luZzogZnJhbWUuaXRlbVNwYWNpbmcgPz8gbnVsbCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBQ0NPUkRJT046IG5hbWUgbWF0Y2ggKyBcdTIyNjUyIGNoaWxkIGl0ZW1zXG4gICAgICBpZiAoQUNDT1JESU9OX1JYLnRlc3QobmFtZSkgJiYga2lkcy5sZW5ndGggPj0gMikge1xuICAgICAgICBjb25zdCBpdGVtczogQXJyYXk8eyBxdWVzdGlvbjogc3RyaW5nOyBhbnN3ZXI/OiBzdHJpbmcgfT4gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBrIG9mIGtpZHMpIHtcbiAgICAgICAgICBjb25zdCBhbGwgPSBjb2xsZWN0QWxsVGV4dChrKTtcbiAgICAgICAgICBpZiAoYWxsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGl0ZW1zLnB1c2goeyBxdWVzdGlvbjogYWxsWzBdLCBhbnN3ZXI6IGFsbC5zbGljZSgxKS5qb2luKCcgJykgfHwgdW5kZWZpbmVkIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICBhZGRQYXR0ZXJuKHtcbiAgICAgICAgICAgIHR5cGU6ICdhY2NvcmRpb24nLFxuICAgICAgICAgICAgcm9vdE5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICAgIHJvb3ROb2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgaXRlbUNvdW50OiBpdGVtcy5sZW5ndGgsXG4gICAgICAgICAgICBjb25maWRlbmNlOiAnaGlnaCcsXG4gICAgICAgICAgICBtZXRhOiB7IGl0ZW1zIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRBQlM6IG5hbWUgbWF0Y2ggKyBcdTIyNjUyIGNoaWxkcmVuXG4gICAgICBpZiAoVEFCU19SWC50ZXN0KG5hbWUpICYmIGtpZHMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgYWRkUGF0dGVybih7XG4gICAgICAgICAgdHlwZTogJ3RhYnMnLFxuICAgICAgICAgIHJvb3ROb2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgcm9vdE5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgaXRlbUNvdW50OiBraWRzLmxlbmd0aCxcbiAgICAgICAgICBjb25maWRlbmNlOiAnaGlnaCcsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgYyBvZiBraWRzKSB3YWxrKGMsIGRlcHRoICsgMSk7XG4gICAgfVxuICB9XG5cbiAgd2FsayhzZWN0aW9uTm9kZSwgMCk7XG4gIHJldHVybiBwYXR0ZXJucztcbn1cblxuZnVuY3Rpb24gY29sbGVjdEFsbFRleHQobm9kZTogU2NlbmVOb2RlKTogc3RyaW5nW10ge1xuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGZ1bmN0aW9uIHdhbGsobjogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG4udmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICBpZiAobi50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIGNvbnN0IGNoYXJzID0gKChuIGFzIFRleHROb2RlKS5jaGFyYWN0ZXJzIHx8ICcnKS50cmltKCk7XG4gICAgICBpZiAoY2hhcnMpIG91dC5wdXNoKGNoYXJzKTtcbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbikge1xuICAgICAgZm9yIChjb25zdCBjIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoYyk7XG4gICAgfVxuICB9XG4gIHdhbGsobm9kZSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gTmF2aWdhdGlvbiBleHRyYWN0aW9uXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqXG4gKiBEZXRlY3QgbmF2aWdhdGlvbiBsaW5rcyBpbnNpZGUgYSBzZWN0aW9uIFx1MjAxNCBzaG9ydCB0ZXh0IG5vZGVzIHRoYXQgbG9va1xuICogbGlrZSBtZW51IGl0ZW1zIChcdTIyNjQ0MCBjaGFycywgZm9udCBzaXplIFx1MjI2NDIycHgpLiBSZXR1cm5zIG51bGwgd2hlbiB0aGVyZVxuICogYXJlIGZld2VyIHRoYW4gMiBzdWNoIGxpbmtzIChvbmUgbGluayBpc24ndCBhIG1lbnUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0TmF2aWdhdGlvbihzZWN0aW9uTm9kZTogU2NlbmVOb2RlKTogTmF2aWdhdGlvbkluZm8gfCBudWxsIHtcbiAgY29uc3QgbGlua3M6IEFycmF5PHsgbGFiZWw6IHN0cmluZzsgaHJlZj86IHN0cmluZyB8IG51bGwgfT4gPSBbXTtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgaWYgKGRlcHRoID4gNiB8fCBub2RlLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCB0ID0gbm9kZSBhcyBUZXh0Tm9kZTtcbiAgICAgIGNvbnN0IHRleHQgPSAodC5jaGFyYWN0ZXJzIHx8ICcnKS50cmltKCk7XG4gICAgICBpZiAoIXRleHQgfHwgdGV4dC5sZW5ndGggPiA0MCkgcmV0dXJuO1xuICAgICAgY29uc3QgZnMgPSB0LmZvbnRTaXplICE9PSBmaWdtYS5taXhlZCA/ICh0LmZvbnRTaXplIGFzIG51bWJlcikgOiAxNjtcbiAgICAgIGlmIChmcyA+IDIyKSByZXR1cm47XG4gICAgICBpZiAoc2Vlbi5oYXModGV4dC50b0xvd2VyQ2FzZSgpKSkgcmV0dXJuO1xuICAgICAgc2Vlbi5hZGQodGV4dC50b0xvd2VyQ2FzZSgpKTtcblxuICAgICAgbGV0IGhyZWY6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgICAgY29uc3QgcmVhY3Rpb25zID0gKHQgYXMgYW55KS5yZWFjdGlvbnM7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyZWFjdGlvbnMpKSB7XG4gICAgICAgIG91dGVyOiBmb3IgKGNvbnN0IHIgb2YgcmVhY3Rpb25zKSB7XG4gICAgICAgICAgY29uc3QgYWN0aW9ucyA9IHIuYWN0aW9ucyB8fCAoci5hY3Rpb24gPyBbci5hY3Rpb25dIDogW10pO1xuICAgICAgICAgIGZvciAoY29uc3QgYSBvZiBhY3Rpb25zKSB7XG4gICAgICAgICAgICBpZiAoYSAmJiBhLnR5cGUgPT09ICdVUkwnICYmIGEudXJsKSB7IGhyZWYgPSBhLnVybDsgYnJlYWsgb3V0ZXI7IH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxpbmtzLnB1c2goeyBsYWJlbDogdGV4dCwgaHJlZiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoYywgZGVwdGggKyAxKTtcbiAgICB9XG4gIH1cbiAgd2FsayhzZWN0aW9uTm9kZSwgMCk7XG4gIGlmIChsaW5rcy5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHsgbGlua3MgfTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBTZWN0aW9uIHNlbWFudGljIHJvbGVcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5pbnRlcmZhY2UgSW5mZXJUeXBlUGFyYW1zIHtcbiAgc2VjdGlvbkluZGV4OiBudW1iZXI7XG4gIHRvdGFsU2VjdGlvbnM6IG51bWJlcjtcbiAgaXNGb3JtU2VjdGlvbjogYm9vbGVhbjtcbiAgcGF0dGVybnM6IENvbXBvbmVudFBhdHRlcm5bXTtcbiAgcmVwZWF0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBSZXBlYXRlckluZm8+O1xuICBlbGVtZW50czogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gIHRleHRDb250ZW50SW5PcmRlcjogQXJyYXk8eyB0ZXh0OiBzdHJpbmc7IGZvbnRTaXplOiBudW1iZXI7IHJvbGU6IHN0cmluZyB9PjtcbiAgbGF5ZXJOYW1lOiBzdHJpbmc7XG4gIHNlY3Rpb25IZWlnaHQ6IG51bWJlcjtcbiAgaXNHbG9iYWw/OiBib29sZWFuO1xuICBnbG9iYWxSb2xlPzogJ2hlYWRlcicgfCAnZm9vdGVyJyB8IG51bGw7XG59XG5cbi8qKlxuICogSW5mZXIgdGhlIHNlbWFudGljIHR5cGUgb2YgYSBzZWN0aW9uLiBQdXJlIGluZmVyZW5jZSBcdTIwMTQgcmV0dXJucyAnZ2VuZXJpYydcbiAqICsgJ2xvdycgY29uZmlkZW5jZSB3aGVuIG5vdGhpbmcgbWF0Y2hlcyBjbGVhcmx5LiBUaGUgYWdlbnQgc2hvdWxkIHRyZWF0XG4gKiAnaGlnaCcgY29uZmlkZW5jZSBhcyBhdXRob3JpdGF0aXZlIGFuZCAnbG93JyBhcyBhIGhpbnQgb25seS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluZmVyU2VjdGlvblR5cGUocDogSW5mZXJUeXBlUGFyYW1zKTogeyB0eXBlOiBTZWN0aW9uVHlwZTsgY29uZmlkZW5jZTogJ2hpZ2gnIHwgJ2xvdycgfSB7XG4gIC8vIEdsb2JhbCBoZWFkZXIvZm9vdGVyIG92ZXJyaWRlcyBldmVyeXRoaW5nXG4gIGlmIChwLmlzR2xvYmFsICYmIHAuZ2xvYmFsUm9sZSA9PT0gJ2hlYWRlcicpIHJldHVybiB7IHR5cGU6ICdoZWFkZXInLCBjb25maWRlbmNlOiAnaGlnaCcgfTtcbiAgaWYgKHAuaXNHbG9iYWwgJiYgcC5nbG9iYWxSb2xlID09PSAnZm9vdGVyJykgcmV0dXJuIHsgdHlwZTogJ2Zvb3RlcicsIGNvbmZpZGVuY2U6ICdoaWdoJyB9O1xuXG4gIGNvbnN0IG5hbWUgPSAocC5sYXllck5hbWUgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGV4cGxpY2l0OiBBcnJheTx7IHJ4OiBSZWdFeHA7IHR5cGU6IFNlY3Rpb25UeXBlIH0+ID0gW1xuICAgIHsgcng6IC9cXGJoZXJvXFxiLywgdHlwZTogJ2hlcm8nIH0sXG4gICAgeyByeDogL1xcYihmZWF0dXJlcz98YmVuZWZpdHM/fHNlcnZpY2VzPylcXGIvLCB0eXBlOiAnZmVhdHVyZXMnIH0sXG4gICAgeyByeDogL1xcYnRlc3RpbW9uaWFscz9cXGIvLCB0eXBlOiAndGVzdGltb25pYWxzJyB9LFxuICAgIHsgcng6IC9cXGIoY3RhfGNhbGxbLSBdP3RvWy0gXT9hY3Rpb24pXFxiLywgdHlwZTogJ2N0YScgfSxcbiAgICB7IHJ4OiAvXFxiKGZhcXM/fGZyZXF1ZW50bHlbLSBdYXNrZWQpXFxiLywgdHlwZTogJ2ZhcScgfSxcbiAgICB7IHJ4OiAvXFxiKHByaWNpbmd8cGxhbnM/KVxcYi8sIHR5cGU6ICdwcmljaW5nJyB9LFxuICAgIHsgcng6IC9cXGJjb250YWN0XFxiLywgdHlwZTogJ2NvbnRhY3QnIH0sXG4gICAgeyByeDogL1xcYihsb2dvcz98Y2xpZW50cz98cGFydG5lcnM/fGJyYW5kcz8pXFxiLywgdHlwZTogJ2xvZ29zJyB9LFxuICAgIHsgcng6IC9cXGJmb290ZXJcXGIvLCB0eXBlOiAnZm9vdGVyJyB9LFxuICAgIHsgcng6IC9cXGIoaGVhZGVyfG5hdnxuYXZiYXJ8bmF2aWdhdGlvbilcXGIvLCB0eXBlOiAnaGVhZGVyJyB9LFxuICAgIHsgcng6IC9cXGIoYmxvZ3xhcnRpY2xlcz98bmV3c3xwb3N0cz8pXFxiLywgdHlwZTogJ2Jsb2dfZ3JpZCcgfSxcbiAgXTtcbiAgZm9yIChjb25zdCB7IHJ4LCB0eXBlIH0gb2YgZXhwbGljaXQpIHtcbiAgICBpZiAocngudGVzdChuYW1lKSkgcmV0dXJuIHsgdHlwZSwgY29uZmlkZW5jZTogJ2hpZ2gnIH07XG4gIH1cblxuICAvLyBQYXR0ZXJuIHNpZ25hbHNcbiAgaWYgKHAucGF0dGVybnMuc29tZShwdCA9PiBwdC50eXBlID09PSAnYWNjb3JkaW9uJykpIHJldHVybiB7IHR5cGU6ICdmYXEnLCBjb25maWRlbmNlOiAnaGlnaCcgfTtcbiAgaWYgKHAuaXNGb3JtU2VjdGlvbikgcmV0dXJuIHsgdHlwZTogJ2NvbnRhY3QnLCBjb25maWRlbmNlOiAnaGlnaCcgfTtcblxuICAvLyBSZXBlYXRlciBjb250ZW50IHNoYXBlXG4gIGNvbnN0IHJlcEtleXMgPSBPYmplY3Qua2V5cyhwLnJlcGVhdGVycyk7XG4gIGlmIChyZXBLZXlzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCByZXAgPSBwLnJlcGVhdGVyc1tyZXBLZXlzWzBdXTtcbiAgICBjb25zdCBmaXJzdCA9IHJlcC5pdGVtc1swXTtcbiAgICBpZiAoZmlyc3QpIHtcbiAgICAgIGNvbnN0IGhhc0ltYWdlID0gISFmaXJzdC5pbWFnZUZpbGU7XG4gICAgICBjb25zdCB0ZXh0VmFscyA9IE9iamVjdC52YWx1ZXMoZmlyc3QudGV4dHMpO1xuICAgICAgY29uc3QgdGV4dEtleXMgPSBPYmplY3Qua2V5cyhmaXJzdC50ZXh0cyk7XG4gICAgICBjb25zdCBqb2luZWQgPSB0ZXh0VmFscy5qb2luKCcgJyk7XG4gICAgICBjb25zdCBoYXNQcmljZSA9IC9bJFx1MjBBQ1x1MDBBM11cXHMqXFxkfFxcYlxcZCtcXHMqKFxcLyhtb3x5cil8cGVyIChtb250aHx5ZWFyKSlcXGIvaS50ZXN0KGpvaW5lZCk7XG4gICAgICBjb25zdCBsb25nUXVvdGUgPSB0ZXh0VmFscy5zb21lKHYgPT4gKHYgfHwgJycpLmxlbmd0aCA+IDEwMCk7XG4gICAgICBjb25zdCBpc0xvZ29Pbmx5ID0gaGFzSW1hZ2UgJiYgdGV4dEtleXMubGVuZ3RoID09PSAwO1xuICAgICAgY29uc3QgaGFzRGF0ZSA9IC9cXGIoamFufGZlYnxtYXJ8YXByfG1heXxqdW58anVsfGF1Z3xzZXB8b2N0fG5vdnxkZWMpXFx3KlxccytcXGR7MSwyfS9pLnRlc3Qoam9pbmVkKVxuICAgICAgICAgICAgICAgICAgIHx8IC9cXGR7NH0tXFxkezJ9LVxcZHsyfS8udGVzdChqb2luZWQpXG4gICAgICAgICAgICAgICAgICAgfHwgL1xcYihtaW4gcmVhZHxyZWFkaW5nIHRpbWUpXFxiL2kudGVzdChqb2luZWQpO1xuXG4gICAgICBpZiAoaGFzUHJpY2UpIHJldHVybiB7IHR5cGU6ICdwcmljaW5nJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgICAgIGlmIChpc0xvZ29Pbmx5KSByZXR1cm4geyB0eXBlOiAnbG9nb3MnLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICAgICAgaWYgKGhhc0RhdGUpIHJldHVybiB7IHR5cGU6ICdibG9nX2dyaWQnLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICAgICAgaWYgKGxvbmdRdW90ZSkgcmV0dXJuIHsgdHlwZTogJ3Rlc3RpbW9uaWFscycsIGNvbmZpZGVuY2U6ICdsb3cnIH07XG4gICAgICBpZiAoaGFzSW1hZ2UgJiYgdGV4dEtleXMubGVuZ3RoID49IDIpIHJldHVybiB7IHR5cGU6ICdmZWF0dXJlcycsIGNvbmZpZGVuY2U6ICdsb3cnIH07XG4gICAgfVxuICB9XG5cbiAgLy8gRmlyc3Qtc2VjdGlvbiBoZXJvIGhldXJpc3RpY1xuICBpZiAocC5zZWN0aW9uSW5kZXggPT09IDApIHtcbiAgICBjb25zdCBoYXNCaWdIZWFkaW5nID0gcC50ZXh0Q29udGVudEluT3JkZXIuc29tZSh0ID0+IHQuZm9udFNpemUgPj0gNDApO1xuICAgIGNvbnN0IGhhc0J1dHRvbiA9IE9iamVjdC5rZXlzKHAuZWxlbWVudHMpLnNvbWUoayA9PiAvYnV0dG9ufGN0YXxidG4vaS50ZXN0KGspKTtcbiAgICBjb25zdCBoYXNJbWFnZSA9IE9iamVjdC5rZXlzKHAuZWxlbWVudHMpLnNvbWUoayA9PiAvaW1hZ2V8cGhvdG98aGVyby9pLnRlc3QoaykgfHwgayA9PT0gJ2JhY2tncm91bmRfaW1hZ2UnKTtcbiAgICBpZiAoaGFzQmlnSGVhZGluZyAmJiAoaGFzQnV0dG9uIHx8IGhhc0ltYWdlKSkgcmV0dXJuIHsgdHlwZTogJ2hlcm8nLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICB9XG5cbiAgLy8gU2hvcnQgc2VjdGlvbiB3aXRoIGhlYWRpbmcgKyBidXR0b24gXHUyMTkyIENUQVxuICBjb25zdCBoYXNCdXR0b25FbCA9IE9iamVjdC5rZXlzKHAuZWxlbWVudHMpLmZpbHRlcihrID0+IC9idXR0b258Y3RhfGJ0bi9pLnRlc3QoaykpLmxlbmd0aCA+PSAxO1xuICBjb25zdCB0ZXh0Q291bnQgPSBwLnRleHRDb250ZW50SW5PcmRlci5sZW5ndGg7XG4gIGlmIChoYXNCdXR0b25FbCAmJiB0ZXh0Q291bnQgPD0gMyAmJiByZXBLZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7IHR5cGU6ICdjdGEnLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICB9XG5cbiAgcmV0dXJuIHsgdHlwZTogJ2dlbmVyaWMnLCBjb25maWRlbmNlOiAnbG93JyB9O1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIENyb3NzLXBhZ2UgZmluZ2VycHJpbnQgaGVscGVycyAoZm9yIGdsb2JhbCBkZXRlY3Rpb24gaW4gZXh0cmFjdG9yLnRzKVxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbi8qKlxuICogTm9ybWFsaXplIGEgc2VjdGlvbidzIGxheWVyIG5hbWUgZm9yIGNyb3NzLXBhZ2UgbWF0Y2hpbmcuXG4gKiBcIkhlYWRlciBcdTIwMTQgRGVza3RvcFwiLCBcIkhlYWRlciAxNDQwXCIsIFwiSGVhZGVyXCIgYWxsIGNvbGxhcHNlIHRvIFwiaGVhZGVyXCIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTZWN0aW9uTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gKG5hbWUgfHwgJycpXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvXFxzKltcdTIwMTRcdTIwMTNcXC1dXFxzKihkZXNrdG9wfG1vYmlsZXx0YWJsZXQpXFxiL2dpLCAnJylcbiAgICAucmVwbGFjZSgvXFxzK1xcZHszLDR9JC9nLCAnJylcbiAgICAudHJpbSgpO1xufVxuXG4vKipcbiAqIEdpdmVuIGEgdG90YWwgc2VjdGlvbiBjb3VudCBhbmQgdGhlIGluZGV4IG9mIGEgZ2xvYmFsIHNlY3Rpb24sIGd1ZXNzXG4gKiB3aGV0aGVyIGl0IGlzIGEgaGVhZGVyICh0b3AsIHRoaW4pIG9yIGZvb3RlciAoYm90dG9tKSBcdTIwMTQgb3IgbnVsbCB3aGVuXG4gKiBuZWl0aGVyIGZpdHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc2lmeUdsb2JhbFJvbGUoXG4gIHNlY3Rpb25JbmRleDogbnVtYmVyLFxuICB0b3RhbFNlY3Rpb25zOiBudW1iZXIsXG4gIHNlY3Rpb25IZWlnaHQ6IG51bWJlcixcbik6ICdoZWFkZXInIHwgJ2Zvb3RlcicgfCBudWxsIHtcbiAgaWYgKHNlY3Rpb25JbmRleCA8PSAxICYmIHNlY3Rpb25IZWlnaHQgPD0gMjAwKSByZXR1cm4gJ2hlYWRlcic7XG4gIGlmIChzZWN0aW9uSW5kZXggPj0gdG90YWxTZWN0aW9ucyAtIDIpIHJldHVybiAnZm9vdGVyJztcbiAgcmV0dXJuIG51bGw7XG59XG4iLCAiaW1wb3J0IHsgU2VjdGlvblNwZWMsIFNlY3Rpb25TdHlsZXMsIEVsZW1lbnRTdHlsZXMsIE92ZXJsYXBJbmZvLCBMYXllckluZm8sIENvbXBvc2l0aW9uSW5mbywgRm9ybUZpZWxkSW5mbywgVGV4dENvbnRlbnRFbnRyeSwgQ29tcG9uZW50SW5zdGFuY2VJbmZvIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyB0b0Nzc1ZhbHVlLCB0b0xheW91dE5hbWUsIHNjcmVlbnNob3RGaWxlbmFtZSwgY29tcHV0ZUFzcGVjdFJhdGlvLCBpc0RlZmF1bHRMYXllck5hbWUsIHNsdWdpZnkgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3IsIGV4dHJhY3RHcmFkaWVudCwgaGFzSW1hZ2VGaWxsLCBleHRyYWN0Qm9yZGVyU3R5bGUsIGV4dHJhY3RCb3JkZXJXaWR0aHMsIGV4dHJhY3RTdHJva2VDb2xvciwgZXh0cmFjdFN0cm9rZUFsaWduLCBleHRyYWN0TWl4QmxlbmRNb2RlIH0gZnJvbSAnLi9jb2xvcic7XG5pbXBvcnQgeyBleHRyYWN0VHlwb2dyYXBoeSB9IGZyb20gJy4vdHlwb2dyYXBoeSc7XG5pbXBvcnQgeyBleHRyYWN0QXV0b0xheW91dFNwYWNpbmcsIGV4dHJhY3RBYnNvbHV0ZVNwYWNpbmcgfSBmcm9tICcuL3NwYWNpbmcnO1xuaW1wb3J0IHsgZGV0ZWN0R3JpZCB9IGZyb20gJy4vZ3JpZCc7XG5pbXBvcnQgeyBleHRyYWN0SW50ZXJhY3Rpb25zIH0gZnJvbSAnLi9pbnRlcmFjdGlvbnMnO1xuaW1wb3J0IHsgZXh0cmFjdEVmZmVjdHMgfSBmcm9tICcuL2VmZmVjdHMnO1xuaW1wb3J0IHsgdG9Dc3NDdXN0b21Qcm9wZXJ0eSB9IGZyb20gJy4vdmFyaWFibGVzJztcbmltcG9ydCB7XG4gIGRldGVjdFJlcGVhdGVycywgZGV0ZWN0Q29tcG9uZW50UGF0dGVybnMsIGRldGVjdE5hdmlnYXRpb24sXG4gIGluZmVyU2VjdGlvblR5cGUsIG5vcm1hbGl6ZVNlY3Rpb25OYW1lLCBjbGFzc2lmeUdsb2JhbFJvbGUsXG59IGZyb20gJy4vcGF0dGVybnMnO1xuaW1wb3J0IHsgcmdiVG9IZXggfSBmcm9tICcuL2NvbG9yJztcblxuLyoqXG4gKiBJZGVudGlmeSBzZWN0aW9uIGZyYW1lcyB3aXRoaW4gYSBwYWdlIGZyYW1lLlxuICogU2VjdGlvbnMgYXJlIHRoZSBkaXJlY3QgY2hpbGRyZW4gb2YgdGhlIHBhZ2UgZnJhbWUsIHNvcnRlZCBieSBZIHBvc2l0aW9uLlxuICogSWYgdGhlIGZyYW1lIGhhcyBhIHNpbmdsZSB3cmFwcGVyIGNoaWxkLCBkcmlsbCBvbmUgbGV2ZWwgZGVlcGVyLlxuICovXG5mdW5jdGlvbiBpZGVudGlmeVNlY3Rpb25zKHBhZ2VGcmFtZTogRnJhbWVOb2RlKTogU2NlbmVOb2RlW10ge1xuICBsZXQgY2FuZGlkYXRlcyA9IHBhZ2VGcmFtZS5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJylcbiAgKTtcblxuICAvLyBJZiB0aGVyZSdzIGEgc2luZ2xlIGNvbnRhaW5lciBjaGlsZCwgZHJpbGwgb25lIGxldmVsIGRlZXBlclxuICBpZiAoY2FuZGlkYXRlcy5sZW5ndGggPT09IDEgJiYgJ2NoaWxkcmVuJyBpbiBjYW5kaWRhdGVzWzBdKSB7XG4gICAgY29uc3Qgd3JhcHBlciA9IGNhbmRpZGF0ZXNbMF0gYXMgRnJhbWVOb2RlO1xuICAgIGNvbnN0IGlubmVyQ2FuZGlkYXRlcyA9IHdyYXBwZXIuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKVxuICAgICk7XG4gICAgaWYgKGlubmVyQ2FuZGlkYXRlcy5sZW5ndGggPiAxKSB7XG4gICAgICBjYW5kaWRhdGVzID0gaW5uZXJDYW5kaWRhdGVzO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNvcnQgYnkgWSBwb3NpdGlvbiAodG9wIHRvIGJvdHRvbSlcbiAgcmV0dXJuIFsuLi5jYW5kaWRhdGVzXS5zb3J0KChhLCBiKSA9PiB7XG4gICAgY29uc3QgYVkgPSBhLmFic29sdXRlQm91bmRpbmdCb3g/LnkgPz8gMDtcbiAgICBjb25zdCBiWSA9IGIuYWJzb2x1dGVCb3VuZGluZ0JveD8ueSA/PyAwO1xuICAgIHJldHVybiBhWSAtIGJZO1xuICB9KTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHNlY3Rpb24tbGV2ZWwgc3R5bGVzIGZyb20gYSBmcmFtZS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFNlY3Rpb25TdHlsZXMobm9kZTogU2NlbmVOb2RlLCBpbWFnZU1hcDogTWFwPHN0cmluZywgc3RyaW5nPik6IFNlY3Rpb25TdHlsZXMge1xuICBjb25zdCBiZyA9IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3Iobm9kZSBhcyBhbnkpO1xuICBjb25zdCBncmFkaWVudCA9IGV4dHJhY3RHcmFkaWVudChub2RlIGFzIGFueSk7XG4gIGNvbnN0IGJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgY29uc3QgZWZmZWN0cyA9IGV4dHJhY3RFZmZlY3RzKG5vZGUgYXMgYW55KTtcbiAgY29uc3QgY29ybmVycyA9IGV4dHJhY3RQZXJDb3JuZXJSYWRpdXMobm9kZSBhcyBhbnkpO1xuXG4gIC8vIFNlY3Rpb24gZnJhbWUncyBvd24gSU1BR0UgZmlsbCBcdTIwMTQgcmVzb2x2ZSB2aWEgc2hhcmVkIGltYWdlTWFwIHNvIHRoZVxuICAvLyBzcGVjIHJlZmVyZW5jZXMgZXhhY3RseSB3aGF0IGltYWdlLWV4cG9ydGVyIHdyb3RlIChhZnRlciBkZWR1cCArXG4gIC8vIGNvbGxpc2lvbi1zdWZmaXhpbmcpLiBGYWxscyBiYWNrIHRvIHNsdWdpZmllZCBuYW1lIHdoZW4gdGhlIHNlY3Rpb25cbiAgLy8gbm9kZSBpc24ndCBpbiB0aGUgbWFwIChlLmcuIGltYWdlIGZpbGwgZGV0ZWN0ZWQgYnV0IG5vIHJlc29sdmFibGUgaGFzaCkuXG4gIGNvbnN0IHNlY3Rpb25CZ0ZpbGUgPSBoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpXG4gICAgPyAoaW1hZ2VNYXAuZ2V0KG5vZGUuaWQpIHx8IGAke3NsdWdpZnkobm9kZS5uYW1lKX0ucG5nYClcbiAgICA6IG51bGw7XG5cbiAgY29uc3Qgc3R5bGVzOiBTZWN0aW9uU3R5bGVzID0ge1xuICAgIHBhZGRpbmdUb3A6IG51bGwsICAvLyBTZXQgYnkgc3BhY2luZyBleHRyYWN0b3JcbiAgICBwYWRkaW5nQm90dG9tOiBudWxsLFxuICAgIHBhZGRpbmdMZWZ0OiBudWxsLFxuICAgIHBhZGRpbmdSaWdodDogbnVsbCxcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IGJnLFxuICAgIGJhY2tncm91bmRJbWFnZTogc2VjdGlvbkJnRmlsZSA/IGB1cmwoaW1hZ2VzLyR7c2VjdGlvbkJnRmlsZX0pYCA6IG51bGwsXG4gICAgYmFja2dyb3VuZEltYWdlRmlsZTogc2VjdGlvbkJnRmlsZSxcbiAgICBiYWNrZ3JvdW5kR3JhZGllbnQ6IGdyYWRpZW50LFxuICAgIG1pbkhlaWdodDogYm91bmRzID8gdG9Dc3NWYWx1ZShib3VuZHMuaGVpZ2h0KSA6IG51bGwsXG4gICAgb3ZlcmZsb3c6IG51bGwsXG4gICAgYm94U2hhZG93OiBlZmZlY3RzLmJveFNoYWRvdyxcbiAgICBmaWx0ZXI6IGVmZmVjdHMuZmlsdGVyLFxuICAgIGJhY2tkcm9wRmlsdGVyOiBlZmZlY3RzLmJhY2tkcm9wRmlsdGVyLFxuICB9O1xuICBpZiAoY29ybmVycykge1xuICAgIGlmIChjb3JuZXJzLnVuaWZvcm0gIT09IG51bGwpIHtcbiAgICAgIHN0eWxlcy5ib3JkZXJSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudW5pZm9ybSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlcy5ib3JkZXJUb3BMZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnRvcExlZnQpO1xuICAgICAgc3R5bGVzLmJvcmRlclRvcFJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnRvcFJpZ2h0KTtcbiAgICAgIHN0eWxlcy5ib3JkZXJCb3R0b21MZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLmJvdHRvbUxlZnQpO1xuICAgICAgc3R5bGVzLmJvcmRlckJvdHRvbVJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLmJvdHRvbVJpZ2h0KTtcbiAgICB9XG4gIH1cbiAgYXBwbHlTdHJva2VzKHN0eWxlcywgbm9kZSk7XG4gIGlmICgnb3BhY2l0eScgaW4gbm9kZSAmJiB0eXBlb2YgKG5vZGUgYXMgYW55KS5vcGFjaXR5ID09PSAnbnVtYmVyJyAmJiAobm9kZSBhcyBhbnkpLm9wYWNpdHkgPCAxKSB7XG4gICAgc3R5bGVzLm9wYWNpdHkgPSBNYXRoLnJvdW5kKChub2RlIGFzIGFueSkub3BhY2l0eSAqIDEwMCkgLyAxMDA7XG4gIH1cbiAgLy8gQXV0by1sYXlvdXQgZmxleCBwcm9wcyBvbiB0aGUgc2VjdGlvbiBmcmFtZSBpdHNlbGZcbiAgT2JqZWN0LmFzc2lnbihzdHlsZXMsIGV4dHJhY3RBdXRvTGF5b3V0RmxleChub2RlIGFzIGFueSkpO1xuICAvLyBCbGVuZCBtb2RlIChtdWx0aXBseSAvIG92ZXJsYXkgLyBzY3JlZW4gLyBcdTIwMjYpXG4gIGNvbnN0IGJsZW5kID0gZXh0cmFjdE1peEJsZW5kTW9kZShub2RlIGFzIGFueSk7XG4gIGlmIChibGVuZCkgc3R5bGVzLm1peEJsZW5kTW9kZSA9IGJsZW5kO1xuICByZXR1cm4gc3R5bGVzO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgcGVyLWNvcm5lciBib3JkZXItcmFkaXVzIGZyb20gYSBub2RlLiBGaWdtYSBzdG9yZXNcbiAqIHRvcExlZnRSYWRpdXMgLyB0b3BSaWdodFJhZGl1cyAvIGJvdHRvbUxlZnRSYWRpdXMgLyBib3R0b21SaWdodFJhZGl1c1xuICogYXMgaW5kaXZpZHVhbCBwcm9wZXJ0aWVzIG9uIFJlY3RhbmdsZU5vZGUgYW5kIEZyYW1lTm9kZS4gV2hlbiB0aGVcbiAqIHVuaWZvcm0gY29ybmVyUmFkaXVzIGlzIGEgbnVtYmVyLCBhbGwgZm91ciBhcmUgZXF1YWwuXG4gKiBSZXR1cm5zIG51bGwgaWYgdGhlIG5vZGUgaGFzIG5vIGNvcm5lciBkYXRhLlxuICovXG5mdW5jdGlvbiBleHRyYWN0UGVyQ29ybmVyUmFkaXVzKG5vZGU6IGFueSk6IHtcbiAgdG9wTGVmdDogbnVtYmVyOyB0b3BSaWdodDogbnVtYmVyOyBib3R0b21MZWZ0OiBudW1iZXI7IGJvdHRvbVJpZ2h0OiBudW1iZXI7IHVuaWZvcm06IG51bWJlciB8IG51bGw7XG59IHwgbnVsbCB7XG4gIGNvbnN0IG4gPSBub2RlIGFzIGFueTtcbiAgY29uc3QgY3IgPSBuLmNvcm5lclJhZGl1cztcbiAgY29uc3QgdGwgPSB0eXBlb2Ygbi50b3BMZWZ0UmFkaXVzID09PSAnbnVtYmVyJyA/IG4udG9wTGVmdFJhZGl1cyA6IG51bGw7XG4gIGNvbnN0IHRyID0gdHlwZW9mIG4udG9wUmlnaHRSYWRpdXMgPT09ICdudW1iZXInID8gbi50b3BSaWdodFJhZGl1cyA6IG51bGw7XG4gIGNvbnN0IGJsID0gdHlwZW9mIG4uYm90dG9tTGVmdFJhZGl1cyA9PT0gJ251bWJlcicgPyBuLmJvdHRvbUxlZnRSYWRpdXMgOiBudWxsO1xuICBjb25zdCBiciA9IHR5cGVvZiBuLmJvdHRvbVJpZ2h0UmFkaXVzID09PSAnbnVtYmVyJyA/IG4uYm90dG9tUmlnaHRSYWRpdXMgOiBudWxsO1xuXG4gIGlmICh0eXBlb2YgY3IgPT09ICdudW1iZXInICYmIHRsID09PSBudWxsKSB7XG4gICAgLy8gVW5pZm9ybSBjb3JuZXJzIChvciBjb3JuZXJSYWRpdXMgaXMgdGhlIG1peGVkIHN5bWJvbClcbiAgICBpZiAoY3IgPT09IDApIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7IHRvcExlZnQ6IGNyLCB0b3BSaWdodDogY3IsIGJvdHRvbUxlZnQ6IGNyLCBib3R0b21SaWdodDogY3IsIHVuaWZvcm06IGNyIH07XG4gIH1cbiAgaWYgKHRsICE9PSBudWxsIHx8IHRyICE9PSBudWxsIHx8IGJsICE9PSBudWxsIHx8IGJyICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcExlZnQ6IHRsIHx8IDAsXG4gICAgICB0b3BSaWdodDogdHIgfHwgMCxcbiAgICAgIGJvdHRvbUxlZnQ6IGJsIHx8IDAsXG4gICAgICBib3R0b21SaWdodDogYnIgfHwgMCxcbiAgICAgIHVuaWZvcm06ICh0bCA9PT0gdHIgJiYgdHIgPT09IGJsICYmIGJsID09PSBicikgPyAodGwgfHwgMCkgOiBudWxsLFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogTWFwIEZpZ21hJ3MgYXV0by1sYXlvdXQgcHJpbWFyeS9jb3VudGVyLWF4aXMgYWxpZ25tZW50IHRvIENTUyBmbGV4IHByb3BzLlxuICogT25seSBhcHBsaWVzIHRvIGZyYW1lcyB3aXRoIGBsYXlvdXRNb2RlID09PSAnSE9SSVpPTlRBTCcgfCAnVkVSVElDQUwnYC5cbiAqXG4gKiBSZXR1cm5zIGEgcGFydGlhbCBvYmplY3Qgd2l0aCBkaXNwbGF5L2ZsZXhEaXJlY3Rpb24vanVzdGlmeUNvbnRlbnQvYWxpZ25JdGVtcy9mbGV4V3JhcC9cbiAqIGdhcC9yb3dHYXAuIEVtcHR5IHdoZW4gdGhlIGZyYW1lIGlzbid0IGF1dG8tbGF5b3V0LCBzbyBjYWxsZXJzIGNhbiBzcHJlYWRcbiAqIHVuY29uZGl0aW9uYWxseS5cbiAqXG4gKiBGaWdtYSBcdTIxOTIgQ1NTIGF4aXMgbWFwcGluZzpcbiAqICAgSG9yaXpvbnRhbCBsYXlvdXQ6IHByaW1hcnkgPSBob3Jpem9udGFsLCBjb3VudGVyID0gdmVydGljYWxcbiAqICAgICBcdTIxOTIgcHJpbWFyeUF4aXNBbGlnbkl0ZW1zIFx1MjE5MiBqdXN0aWZ5LWNvbnRlbnQsIGNvdW50ZXJBeGlzQWxpZ25JdGVtcyBcdTIxOTIgYWxpZ24taXRlbXNcbiAqICAgVmVydGljYWwgbGF5b3V0OiBwcmltYXJ5ID0gdmVydGljYWwsIGNvdW50ZXIgPSBob3Jpem9udGFsXG4gKiAgICAgXHUyMTkyIHByaW1hcnlBeGlzQWxpZ25JdGVtcyBcdTIxOTIganVzdGlmeS1jb250ZW50IChmbGV4LWRpcmVjdGlvbjpjb2x1bW4pLCBjb3VudGVyIFx1MjE5MiBhbGlnbi1pdGVtc1xuICpcbiAqIFZhbHVlIG1hcHBpbmc6XG4gKiAgIE1JTiBcdTIxOTIgZmxleC1zdGFydCwgQ0VOVEVSIFx1MjE5MiBjZW50ZXIsIE1BWCBcdTIxOTIgZmxleC1lbmQsIFNQQUNFX0JFVFdFRU4gXHUyMTkyIHNwYWNlLWJldHdlZW5cbiAqICAgY291bnRlciBCQVNFTElORSBcdTIxOTIgYmFzZWxpbmUgKG9ubHkgdmFsaWQgZm9yIGhvcml6b250YWwgbGF5b3V0cylcbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEF1dG9MYXlvdXRGbGV4KGZyYW1lOiBhbnkpOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ICYgUGFydGlhbDxTZWN0aW9uU3R5bGVzPiB7XG4gIGlmICghZnJhbWUgfHwgIWZyYW1lLmxheW91dE1vZGUgfHwgZnJhbWUubGF5b3V0TW9kZSA9PT0gJ05PTkUnKSByZXR1cm4ge307XG4gIGNvbnN0IG91dDogUGFydGlhbDxFbGVtZW50U3R5bGVzPiAmIFBhcnRpYWw8U2VjdGlvblN0eWxlcz4gPSB7fTtcbiAgb3V0LmRpc3BsYXkgPSAnZmxleCc7XG4gIG91dC5mbGV4RGlyZWN0aW9uID0gZnJhbWUubGF5b3V0TW9kZSA9PT0gJ0hPUklaT05UQUwnID8gJ3JvdycgOiAnY29sdW1uJztcblxuICBjb25zdCBtYXBQcmltYXJ5ID0gKHY6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB8IG51bGwgPT4ge1xuICAgIHN3aXRjaCAodikge1xuICAgICAgY2FzZSAnTUlOJzogcmV0dXJuICdmbGV4LXN0YXJ0JztcbiAgICAgIGNhc2UgJ0NFTlRFUic6IHJldHVybiAnY2VudGVyJztcbiAgICAgIGNhc2UgJ01BWCc6IHJldHVybiAnZmxleC1lbmQnO1xuICAgICAgY2FzZSAnU1BBQ0VfQkVUV0VFTic6IHJldHVybiAnc3BhY2UtYmV0d2Vlbic7XG4gICAgICBkZWZhdWx0OiByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH07XG4gIGNvbnN0IG1hcENvdW50ZXIgPSAodjogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gICAgc3dpdGNoICh2KSB7XG4gICAgICBjYXNlICdNSU4nOiByZXR1cm4gJ2ZsZXgtc3RhcnQnO1xuICAgICAgY2FzZSAnQ0VOVEVSJzogcmV0dXJuICdjZW50ZXInO1xuICAgICAgY2FzZSAnTUFYJzogcmV0dXJuICdmbGV4LWVuZCc7XG4gICAgICBjYXNlICdCQVNFTElORSc6IHJldHVybiAnYmFzZWxpbmUnO1xuICAgICAgZGVmYXVsdDogcmV0dXJuIG51bGw7XG4gICAgfVxuICB9O1xuICBjb25zdCBqYyA9IG1hcFByaW1hcnkoZnJhbWUucHJpbWFyeUF4aXNBbGlnbkl0ZW1zKTtcbiAgY29uc3QgYWkgPSBtYXBDb3VudGVyKGZyYW1lLmNvdW50ZXJBeGlzQWxpZ25JdGVtcyk7XG4gIGlmIChqYykgb3V0Lmp1c3RpZnlDb250ZW50ID0gamM7XG4gIGlmIChhaSkgb3V0LmFsaWduSXRlbXMgPSBhaTtcblxuICBpZiAoZnJhbWUubGF5b3V0V3JhcCA9PT0gJ1dSQVAnKSB7XG4gICAgb3V0LmZsZXhXcmFwID0gJ3dyYXAnO1xuICAgIGlmICh0eXBlb2YgZnJhbWUuY291bnRlckF4aXNTcGFjaW5nID09PSAnbnVtYmVyJyAmJiBmcmFtZS5jb3VudGVyQXhpc1NwYWNpbmcgPiAwKSB7XG4gICAgICBvdXQucm93R2FwID0gdG9Dc3NWYWx1ZShmcmFtZS5jb3VudGVyQXhpc1NwYWNpbmcpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogTWFwIEZpZ21hIGxheW91dCBjb25zdHJhaW50cyAoJ01JTicgfCAnQ0VOVEVSJyB8ICdNQVgnIHwgJ1NUUkVUQ0gnIHwgJ1NDQUxFJylcbiAqIHRvIGxvd2VyY2FzZSB0b2tlbnMuIENvbnN0cmFpbnRzIGRlc2NyaWJlIGhvdyBhIGNoaWxkIGFuY2hvcnMgd2hlbiBpdHNcbiAqIHBhcmVudCByZXNpemVzIFx1MjAxNCBvbmx5IG1lYW5pbmdmdWwgZm9yIG5vbi1hdXRvLWxheW91dCBwYXJlbnRzIE9SIGZvclxuICogYWJzb2x1dGVseS1wb3NpdGlvbmVkIGNoaWxkcmVuIGluc2lkZSBhbiBhdXRvLWxheW91dCBwYXJlbnQuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RDb25zdHJhaW50cyhub2RlOiBhbnkpOiB7IGhvcml6b250YWw/OiBhbnk7IHZlcnRpY2FsPzogYW55IH0ge1xuICBjb25zdCBjID0gbm9kZT8uY29uc3RyYWludHM7XG4gIGlmICghYyB8fCB0eXBlb2YgYyAhPT0gJ29iamVjdCcpIHJldHVybiB7fTtcbiAgY29uc3QgbWFwID0gKHY6IHN0cmluZyB8IHVuZGVmaW5lZCk6IGFueSA9PiB7XG4gICAgaWYgKHYgPT09ICdNSU4nKSByZXR1cm4gJ21pbic7XG4gICAgaWYgKHYgPT09ICdDRU5URVInKSByZXR1cm4gJ2NlbnRlcic7XG4gICAgaWYgKHYgPT09ICdNQVgnKSByZXR1cm4gJ21heCc7XG4gICAgaWYgKHYgPT09ICdTVFJFVENIJykgcmV0dXJuICdzdHJldGNoJztcbiAgICBpZiAodiA9PT0gJ1NDQUxFJykgcmV0dXJuICdzY2FsZSc7XG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG4gIHJldHVybiB7IGhvcml6b250YWw6IG1hcChjLmhvcml6b250YWwpLCB2ZXJ0aWNhbDogbWFwKGMudmVydGljYWwpIH07XG59XG5cbi8qKlxuICogRGV0ZWN0IHdoZXRoZXIgdGhlIG5vZGUgaXMgcG9zaXRpb25lZCBhYnNvbHV0ZWx5IElOU0lERSBpdHMgYXV0by1sYXlvdXRcbiAqIHBhcmVudCAoRmlnbWEncyBgbGF5b3V0UG9zaXRpb25pbmcgPT09ICdBQlNPTFVURSdgKS4gV2hlbiB0cnVlIHRoZSBhZ2VudFxuICogc2hvdWxkIGVtaXQgYHBvc2l0aW9uOiBhYnNvbHV0ZWAgYW5kIHVzZSBib3VuZGluZy1ib3ggb2Zmc2V0cyArIHRoZVxuICogZXh0cmFjdGVkIGNvbnN0cmFpbnRzIHRvIGFuY2hvciBpdCBjb3JyZWN0bHkuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RMYXlvdXRQb3NpdGlvbmluZyhub2RlOiBhbnkpOiAnYXV0bycgfCAnYWJzb2x1dGUnIHwgbnVsbCB7XG4gIGNvbnN0IHAgPSBub2RlPy5sYXlvdXRQb3NpdGlvbmluZztcbiAgaWYgKHAgPT09ICdBQlNPTFVURScpIHJldHVybiAnYWJzb2x1dGUnO1xuICBpZiAocCA9PT0gJ0FVVE8nKSByZXR1cm4gJ2F1dG8nO1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBBcHBseSBwZXItY29ybmVyIHJhZGl1cy4gSWYgYWxsIDQgYXJlIGVxdWFsLCBlbWl0IGJvcmRlclJhZGl1cyBzaG9ydGhhbmQ7XG4gKiBvdGhlcndpc2UgZW1pdCB0aGUgNCBleHBsaWNpdCB2YWx1ZXMuIFdvcmtzIG9uIEVsZW1lbnRTdHlsZXMgb3IgU2VjdGlvblN0eWxlcy5cbiAqL1xuZnVuY3Rpb24gYXBwbHlSYWRpdXMoZWxlbTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiAmIFBhcnRpYWw8U2VjdGlvblN0eWxlcz4sIG5vZGU6IGFueSk6IHZvaWQge1xuICBjb25zdCBjb3JuZXJzID0gZXh0cmFjdFBlckNvcm5lclJhZGl1cyhub2RlKTtcbiAgaWYgKCFjb3JuZXJzKSByZXR1cm47XG4gIGlmIChjb3JuZXJzLnVuaWZvcm0gIT09IG51bGwpIHtcbiAgICBlbGVtLmJvcmRlclJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy51bmlmb3JtKTtcbiAgICByZXR1cm47XG4gIH1cbiAgZWxlbS5ib3JkZXJUb3BMZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnRvcExlZnQpO1xuICBlbGVtLmJvcmRlclRvcFJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnRvcFJpZ2h0KTtcbiAgZWxlbS5ib3JkZXJCb3R0b21MZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLmJvdHRvbUxlZnQpO1xuICBlbGVtLmJvcmRlckJvdHRvbVJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLmJvdHRvbVJpZ2h0KTtcbn1cblxuLyoqXG4gKiBBcHBseSBzdHJva2VzOiBwZXItc2lkZSBib3JkZXItd2lkdGggd2hlbiBGaWdtYSBoYXMgaW5kaXZpZHVhbFN0cm9rZVdlaWdodHMsXG4gKiBzaW5nbGUgYm9yZGVyV2lkdGggb3RoZXJ3aXNlLiBBbHNvIG1hcHMgc3R5bGUgKHNvbGlkL2Rhc2hlZC9kb3R0ZWQpIGFuZFxuICogY29sb3IuIFdvcmtzIG9uIEVsZW1lbnRTdHlsZXMgb3IgU2VjdGlvblN0eWxlcy5cbiAqL1xuZnVuY3Rpb24gYXBwbHlTdHJva2VzKGVsZW06IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gJiBQYXJ0aWFsPFNlY3Rpb25TdHlsZXM+LCBub2RlOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgY29sb3IgPSBleHRyYWN0U3Ryb2tlQ29sb3Iobm9kZSk7XG4gIGNvbnN0IHdpZHRocyA9IGV4dHJhY3RCb3JkZXJXaWR0aHMobm9kZSk7XG4gIGNvbnN0IHN0eWxlID0gZXh0cmFjdEJvcmRlclN0eWxlKG5vZGUpO1xuICBjb25zdCBhbGlnbiA9IGV4dHJhY3RTdHJva2VBbGlnbihub2RlKTtcbiAgaWYgKCFjb2xvcikgcmV0dXJuO1xuXG4gIGlmICh3aWR0aHMudW5pZm9ybSAhPT0gbnVsbCkge1xuICAgIGVsZW0uYm9yZGVyV2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy51bmlmb3JtKTtcbiAgICBlbGVtLmJvcmRlckNvbG9yID0gY29sb3I7XG4gICAgZWxlbS5ib3JkZXJTdHlsZSA9IHN0eWxlO1xuICAgIGlmIChhbGlnbikgZWxlbS5zdHJva2VBbGlnbiA9IGFsaWduO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAod2lkdGhzLnRvcCB8fCB3aWR0aHMucmlnaHQgfHwgd2lkdGhzLmJvdHRvbSB8fCB3aWR0aHMubGVmdCkge1xuICAgIGlmICh3aWR0aHMudG9wKSBlbGVtLmJvcmRlclRvcFdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMudG9wKTtcbiAgICBpZiAod2lkdGhzLnJpZ2h0KSBlbGVtLmJvcmRlclJpZ2h0V2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy5yaWdodCk7XG4gICAgaWYgKHdpZHRocy5ib3R0b20pIGVsZW0uYm9yZGVyQm90dG9tV2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy5ib3R0b20pO1xuICAgIGlmICh3aWR0aHMubGVmdCkgZWxlbS5ib3JkZXJMZWZ0V2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy5sZWZ0KTtcbiAgICBlbGVtLmJvcmRlckNvbG9yID0gY29sb3I7XG4gICAgZWxlbS5ib3JkZXJTdHlsZSA9IHN0eWxlO1xuICAgIGlmIChhbGlnbikgZWxlbS5zdHJva2VBbGlnbiA9IGFsaWduO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdCBvYmplY3QtcG9zaXRpb24gZnJvbSBhbiBpbWFnZSBmaWxsJ3MgaW1hZ2VUcmFuc2Zvcm0gKGNyb3Agb2Zmc2V0KS5cbiAqIEZpZ21hJ3MgaW1hZ2VUcmFuc2Zvcm0gaXMgYSAyeDMgYWZmaW5lIG1hdHJpeC4gV2hlbiB0aGUgaW1hZ2UgaGFzIGJlZW5cbiAqIGNyb3BwZWQvcmVwb3NpdGlvbmVkIGluIEZpZ21hLCB0aGUgdHJhbnNsYXRpb24gY29tcG9uZW50cyB0ZWxsIHVzIHRoZVxuICogZm9jYWwgcG9pbnQuIE1hcCB0byBDU1Mgb2JqZWN0LXBvc2l0aW9uIC8gYmFja2dyb3VuZC1wb3NpdGlvbi5cbiAqXG4gKiBSZXR1cm5zIG51bGwgd2hlbiB0aGUgaW1hZ2UgaXMgY2VudGVyZWQgKGRlZmF1bHQpLCBvciB3aGVuIG5vZGUgaGFzIG5vXG4gKiBpbWFnZVRyYW5zZm9ybSBkYXRhLlxuICovXG5mdW5jdGlvbiBleHRyYWN0T2JqZWN0UG9zaXRpb24obm9kZTogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGltZ0ZpbGwgPSBub2RlLmZpbGxzLmZpbmQoKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSkgYXMgSW1hZ2VQYWludCB8IHVuZGVmaW5lZDtcbiAgaWYgKCFpbWdGaWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdCA9IChpbWdGaWxsIGFzIGFueSkuaW1hZ2VUcmFuc2Zvcm0gYXMgbnVtYmVyW11bXSB8IHVuZGVmaW5lZDtcbiAgaWYgKCF0IHx8ICFBcnJheS5pc0FycmF5KHQpIHx8IHQubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG4gIC8vIGltYWdlVHJhbnNmb3JtIGlzIGEgMngzIG1hdHJpeDogW1thLCBiLCB0eF0sIFtjLCBkLCB0eV1dXG4gIC8vIHR4L3R5IGFyZSBub3JtYWxpemVkICgwLi4xKSB0cmFuc2xhdGlvbiBcdTIwMTQgMCA9IGxlZnQvdG9wLCAwLjUgPSBjZW50ZXJcbiAgY29uc3QgdHggPSB0WzBdICYmIHR5cGVvZiB0WzBdWzJdID09PSAnbnVtYmVyJyA/IHRbMF1bMl0gOiAwLjU7XG4gIGNvbnN0IHR5ID0gdFsxXSAmJiB0eXBlb2YgdFsxXVsyXSA9PT0gJ251bWJlcicgPyB0WzFdWzJdIDogMC41O1xuICAvLyBEZWZhdWx0IChjZW50ZXJlZCkgXHUyMTkyIG51bGwgKGJyb3dzZXIgdXNlcyBcIjUwJSA1MCVcIiBieSBkZWZhdWx0KVxuICBpZiAoTWF0aC5hYnModHggLSAwLjUpIDwgMC4wMSAmJiBNYXRoLmFicyh0eSAtIDAuNSkgPCAwLjAxKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgeFBjdCA9IE1hdGgucm91bmQodHggKiAxMDApO1xuICBjb25zdCB5UGN0ID0gTWF0aC5yb3VuZCh0eSAqIDEwMCk7XG4gIHJldHVybiBgJHt4UGN0fSUgJHt5UGN0fSVgO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdHJhbnNmb3JtIChyb3RhdGlvbiArIHNjYWxlKSBmcm9tIGEgbm9kZSdzIHJlbGF0aXZlVHJhbnNmb3JtLlxuICogRmlnbWEncyByZWxhdGl2ZVRyYW5zZm9ybSBpcyBhIDJ4MyBtYXRyaXggXHUyMDE0IHdlIGRlY29tcG9zZSBpdCB0byByb3RhdGlvblxuICogYW5kIHNjYWxlIHdoZW4gdGhleSdyZSBub24taWRlbnRpdHkuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RUcmFuc2Zvcm0obm9kZTogYW55KTogeyB0cmFuc2Zvcm06IHN0cmluZyB8IG51bGwgfSB7XG4gIGNvbnN0IHJ0ID0gbm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSBhcyBudW1iZXJbXVtdIHwgdW5kZWZpbmVkO1xuICBpZiAoIXJ0IHx8ICFBcnJheS5pc0FycmF5KHJ0KSB8fCBydC5sZW5ndGggPCAyKSByZXR1cm4geyB0cmFuc2Zvcm06IG51bGwgfTtcbiAgLy8gRXh0cmFjdCByb3RhdGlvbiBmcm9tIHRoZSBtYXRyaXg6IGFuZ2xlID0gYXRhbjIobVsxXVswXSwgbVswXVswXSlcbiAgY29uc3QgYSA9IHJ0WzBdWzBdLCBiID0gcnRbMF1bMV0sIGMgPSBydFsxXVswXSwgZCA9IHJ0WzFdWzFdO1xuICBjb25zdCByYWRpYW5zID0gTWF0aC5hdGFuMihjLCBhKTtcbiAgY29uc3QgZGVncmVlcyA9IE1hdGgucm91bmQoKHJhZGlhbnMgKiAxODApIC8gTWF0aC5QSSk7XG4gIGNvbnN0IHNjYWxlWCA9IE1hdGguc3FydChhICogYSArIGMgKiBjKTtcbiAgY29uc3Qgc2NhbGVZID0gTWF0aC5zcXJ0KGIgKiBiICsgZCAqIGQpO1xuXG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoTWF0aC5hYnMoZGVncmVlcykgPiAwLjUpIHBhcnRzLnB1c2goYHJvdGF0ZSgke2RlZ3JlZXN9ZGVnKWApO1xuICBpZiAoTWF0aC5hYnMoc2NhbGVYIC0gMSkgPiAwLjAyKSBwYXJ0cy5wdXNoKGBzY2FsZVgoJHtNYXRoLnJvdW5kKHNjYWxlWCAqIDEwMCkgLyAxMDB9KWApO1xuICBpZiAoTWF0aC5hYnMoc2NhbGVZIC0gMSkgPiAwLjAyKSBwYXJ0cy5wdXNoKGBzY2FsZVkoJHtNYXRoLnJvdW5kKHNjYWxlWSAqIDEwMCkgLyAxMDB9KWApO1xuXG4gIHJldHVybiB7IHRyYW5zZm9ybTogcGFydHMubGVuZ3RoID4gMCA/IHBhcnRzLmpvaW4oJyAnKSA6IG51bGwgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGZsZXgtZ3JvdyAvIGZsZXgtYmFzaXMgLyBhbGlnbi1zZWxmIGZvciBhdXRvLWxheW91dCBjaGlsZHJlbi5cbiAqIEZpZ21hJ3MgbGF5b3V0R3JvdyBpcyAwIG9yIDE7IGxheW91dEFsaWduIGlzIElOSEVSSVQgLyBTVFJFVENIIC8gTUlOIC8gQ0VOVEVSIC8gTUFYLlxuICovXG5mdW5jdGlvbiBleHRyYWN0RmxleENoaWxkUHJvcHMobm9kZTogYW55KTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiB7XG4gIGNvbnN0IG91dDogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHt9O1xuICBpZiAodHlwZW9mIG5vZGUubGF5b3V0R3JvdyA9PT0gJ251bWJlcicpIHtcbiAgICBvdXQuZmxleEdyb3cgPSBub2RlLmxheW91dEdyb3c7XG4gIH1cbiAgaWYgKG5vZGUubGF5b3V0QWxpZ24pIHtcbiAgICBzd2l0Y2ggKG5vZGUubGF5b3V0QWxpZ24pIHtcbiAgICAgIGNhc2UgJ1NUUkVUQ0gnOiBvdXQuYWxpZ25TZWxmID0gJ3N0cmV0Y2gnOyBicmVhaztcbiAgICAgIGNhc2UgJ01JTic6IG91dC5hbGlnblNlbGYgPSAnZmxleC1zdGFydCc7IGJyZWFrO1xuICAgICAgY2FzZSAnQ0VOVEVSJzogb3V0LmFsaWduU2VsZiA9ICdjZW50ZXInOyBicmVhaztcbiAgICAgIGNhc2UgJ01BWCc6IG91dC5hbGlnblNlbGYgPSAnZmxleC1lbmQnOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENvbXB1dGUgcGVyLXNpZGUgbWFyZ2luIGZvciBhIG5vZGUgYmFzZWQgb24gc2libGluZyBwb3NpdGlvbnMgaW4gaXRzXG4gKiBwYXJlbnQgY29udGFpbmVyLiBSZXR1cm5zIG9ubHkgdGhlIHNpZGVzIHRoYXQgaGF2ZSBhIGNsZWFyIG5vbi16ZXJvXG4gKiBtYXJnaW4gKHByZXZpb3VzIHNpYmxpbmcgb24gdG9wLCBuZXh0IHNpYmxpbmcgYmVsb3csIHBhcmVudCBib3VuZHMgZm9yXG4gKiBsZWZ0L3JpZ2h0IHdoZW4gcGFyZW50IHdpZHRoIGlzIGtub3duKS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFBlclNpZGVNYXJnaW5zKG5vZGU6IFNjZW5lTm9kZSk6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4ge1xuICBjb25zdCBvdXQ6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7fTtcbiAgaWYgKCFub2RlLmFic29sdXRlQm91bmRpbmdCb3ggfHwgIW5vZGUucGFyZW50IHx8ICEoJ2NoaWxkcmVuJyBpbiBub2RlLnBhcmVudCkpIHJldHVybiBvdXQ7XG5cbiAgY29uc3Qgc2libGluZ3MgPSAobm9kZS5wYXJlbnQgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbjtcbiAgY29uc3QgaWR4ID0gc2libGluZ3MuaW5kZXhPZihub2RlKTtcbiAgY29uc3QgYmIgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG5cbiAgLy8gQm90dG9tOiBnYXAgdG8gbmV4dCBzaWJsaW5nXG4gIGlmIChpZHggPj0gMCAmJiBpZHggPCBzaWJsaW5ncy5sZW5ndGggLSAxKSB7XG4gICAgY29uc3QgbmV4dCA9IHNpYmxpbmdzW2lkeCArIDFdO1xuICAgIGlmIChuZXh0LmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICAgIGNvbnN0IGdhcCA9IG5leHQuYWJzb2x1dGVCb3VuZGluZ0JveC55IC0gKGJiLnkgKyBiYi5oZWlnaHQpO1xuICAgICAgaWYgKGdhcCA+IDApIG91dC5tYXJnaW5Cb3R0b20gPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQoZ2FwKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gVG9wOiBnYXAgdG8gcHJldmlvdXMgc2libGluZyAoZm9yIGFic29sdXRlLXBvc2l0aW9uIGxheW91dHMpXG4gIGlmIChpZHggPiAwKSB7XG4gICAgY29uc3QgcHJldiA9IHNpYmxpbmdzW2lkeCAtIDFdO1xuICAgIGlmIChwcmV2LmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICAgIGNvbnN0IGdhcCA9IGJiLnkgLSAocHJldi5hYnNvbHV0ZUJvdW5kaW5nQm94LnkgKyBwcmV2LmFic29sdXRlQm91bmRpbmdCb3guaGVpZ2h0KTtcbiAgICAgIGlmIChnYXAgPiAwKSBvdXQubWFyZ2luVG9wID0gdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKGdhcCkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIExlZnQvcmlnaHQ6IGluc2V0IGZyb20gcGFyZW50IGVkZ2VzXG4gIGNvbnN0IHBhcmVudEJCID0gKG5vZGUucGFyZW50IGFzIEZyYW1lTm9kZSkuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgaWYgKHBhcmVudEJCKSB7XG4gICAgY29uc3QgbGVmdEdhcCA9IGJiLnggLSBwYXJlbnRCQi54O1xuICAgIGNvbnN0IHJpZ2h0R2FwID0gKHBhcmVudEJCLnggKyBwYXJlbnRCQi53aWR0aCkgLSAoYmIueCArIGJiLndpZHRoKTtcbiAgICAvLyBPbmx5IGVtaXQgd2hlbiBlbGVtZW50IGlzIG5vdCBjZW50ZXJlZCAoc2lnbmlmaWNhbnQgYXN5bW1ldHJpYyBtYXJnaW4pXG4gICAgaWYgKE1hdGguYWJzKGxlZnRHYXAgLSByaWdodEdhcCkgPiA4ICYmIGxlZnRHYXAgPiAwKSB7XG4gICAgICBvdXQubWFyZ2luTGVmdCA9IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChsZWZ0R2FwKSk7XG4gICAgfVxuICAgIGlmIChNYXRoLmFicyhsZWZ0R2FwIC0gcmlnaHRHYXApID4gOCAmJiByaWdodEdhcCA+IDApIHtcbiAgICAgIG91dC5tYXJnaW5SaWdodCA9IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChyaWdodEdhcCkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogRXh0cmFjdCBwcm90b3R5cGUgbmF2aWdhdGlvbiBVUkwgZm9yIGEgbm9kZS4gRmlnbWEgc3VwcG9ydHNcbiAqIE9QRU5fVVJMIGFjdGlvbnMgaW4gcmVhY3Rpb25zIFx1MjAxNCBtYXAgdG8gbGlua1VybC5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdExpbmtVcmwobm9kZTogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHJlYWN0aW9ucyA9IG5vZGUucmVhY3Rpb25zO1xuICBpZiAoIXJlYWN0aW9ucyB8fCAhQXJyYXkuaXNBcnJheShyZWFjdGlvbnMpKSByZXR1cm4gbnVsbDtcbiAgZm9yIChjb25zdCByIG9mIHJlYWN0aW9ucykge1xuICAgIGNvbnN0IGFjdGlvbnMgPSByLmFjdGlvbnMgfHwgKHIuYWN0aW9uID8gW3IuYWN0aW9uXSA6IFtdKTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgYWN0aW9ucykge1xuICAgICAgaWYgKGEgJiYgYS50eXBlID09PSAnVVJMJyAmJiBhLnVybCkgcmV0dXJuIGEudXJsO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IEZpZ21hIHNpemluZyBtb2RlcyAoSHVnIC8gRmlsbCAvIEZpeGVkKS4gVGhlc2UgdGVsbCB0aGUgYWdlbnRcbiAqIHdoZXRoZXIgYW4gZWxlbWVudCBzaG91bGQgYmUgd2lkdGg6YXV0bywgd2lkdGg6MTAwJSwgb3IgYSBmaXhlZCBweCBzaXplIFx1MjAxNFxuICogY3JpdGljYWwgZm9yIGNvcnJlY3QgcmVzcG9uc2l2ZSBiZWhhdmlvci4gUmV0dXJucyBudWxsIGZvciBlYWNoIGF4aXMgd2hlblxuICogdGhlIG1vZGUgaXMgbWlzc2luZyAob2xkZXIgRmlnbWEgdmVyc2lvbnMsIG5vbi1hdXRvLWxheW91dCBjb250ZXh0cykuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RTaXppbmdNb2Rlcyhub2RlOiBhbnkpOiB7IHdpZHRoTW9kZTogJ2h1Zyd8J2ZpbGwnfCdmaXhlZCd8bnVsbDsgaGVpZ2h0TW9kZTogJ2h1Zyd8J2ZpbGwnfCdmaXhlZCd8bnVsbCB9IHtcbiAgY29uc3QgbWFwID0gKG06IHN0cmluZyB8IHVuZGVmaW5lZCk6ICdodWcnfCdmaWxsJ3wnZml4ZWQnfG51bGwgPT4ge1xuICAgIGlmIChtID09PSAnSFVHJykgcmV0dXJuICdodWcnO1xuICAgIGlmIChtID09PSAnRklMTCcpIHJldHVybiAnZmlsbCc7XG4gICAgaWYgKG0gPT09ICdGSVhFRCcpIHJldHVybiAnZml4ZWQnO1xuICAgIHJldHVybiBudWxsO1xuICB9O1xuICByZXR1cm4ge1xuICAgIHdpZHRoTW9kZTogbWFwKG5vZGUubGF5b3V0U2l6aW5nSG9yaXpvbnRhbCksXG4gICAgaGVpZ2h0TW9kZTogbWFwKG5vZGUubGF5b3V0U2l6aW5nVmVydGljYWwpLFxuICB9O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgRmlnbWEgVmFyaWFibGUgYmluZGluZ3Mgb24gYSBub2RlJ3MgcHJvcGVydGllcy4gUmV0dXJucyBDU1MgY3VzdG9tXG4gKiBwcm9wZXJ0eSByZWZlcmVuY2VzIChlLmcuIFwidmFyKC0tY2xyLXByaW1hcnkpXCIpIGtleWVkIGJ5IENTUyBwcm9wZXJ0eSBuYW1lLlxuICogV2hlbiB2YXJpYWJsZXMgYXJlIGJvdW5kLCB0aGUgYWdlbnQgc2hvdWxkIGVtaXQgdGhlc2UgcmVmZXJlbmNlcyBpbnN0ZWFkXG4gKiBvZiB0aGUgcmVzb2x2ZWQgcmF3IGhleC9weCB2YWx1ZXMgc28gdG9rZW4gY2hhbmdlcyBpbiBGaWdtYSBwcm9wYWdhdGUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RCb3VuZFZhcmlhYmxlcyhub2RlOiBhbnkpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgbnVsbCB7XG4gIGNvbnN0IGJ2ID0gbm9kZS5ib3VuZFZhcmlhYmxlcztcbiAgaWYgKCFidiB8fCB0eXBlb2YgYnYgIT09ICdvYmplY3QnKSByZXR1cm4gbnVsbDtcbiAgaWYgKCFmaWdtYS52YXJpYWJsZXMgfHwgdHlwZW9mIChmaWdtYS52YXJpYWJsZXMgYXMgYW55KS5nZXRWYXJpYWJsZUJ5SWQgIT09ICdmdW5jdGlvbicpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IG91dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gIGNvbnN0IHJlc29sdmUgPSAoYWxpYXM6IGFueSk6IHN0cmluZyB8IG51bGwgPT4ge1xuICAgIGlmICghYWxpYXMgfHwgIWFsaWFzLmlkKSByZXR1cm4gbnVsbDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdiA9IChmaWdtYS52YXJpYWJsZXMgYXMgYW55KS5nZXRWYXJpYWJsZUJ5SWQoYWxpYXMuaWQpO1xuICAgICAgaWYgKCF2KSByZXR1cm4gbnVsbDtcbiAgICAgIGxldCBjb2xOYW1lID0gJyc7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb2wgPSAoZmlnbWEudmFyaWFibGVzIGFzIGFueSkuZ2V0VmFyaWFibGVDb2xsZWN0aW9uQnlJZD8uKHYudmFyaWFibGVDb2xsZWN0aW9uSWQpO1xuICAgICAgICBjb2xOYW1lID0gY29sPy5uYW1lIHx8ICcnO1xuICAgICAgfSBjYXRjaCB7fVxuICAgICAgcmV0dXJuIGB2YXIoJHt0b0Nzc0N1c3RvbVByb3BlcnR5KHYubmFtZSwgY29sTmFtZSl9KWA7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoYnYuZmlsbHMpICYmIGJ2LmZpbGxzWzBdKSB7XG4gICAgY29uc3QgcmVmID0gcmVzb2x2ZShidi5maWxsc1swXSk7XG4gICAgaWYgKHJlZikgb3V0W25vZGUudHlwZSA9PT0gJ1RFWFQnID8gJ2NvbG9yJyA6ICdiYWNrZ3JvdW5kQ29sb3InXSA9IHJlZjtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShidi5zdHJva2VzKSAmJiBidi5zdHJva2VzWzBdKSB7XG4gICAgY29uc3QgcmVmID0gcmVzb2x2ZShidi5zdHJva2VzWzBdKTtcbiAgICBpZiAocmVmKSBvdXQuYm9yZGVyQ29sb3IgPSByZWY7XG4gIH1cbiAgY29uc3QgbnVtZXJpY01hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICBwYWRkaW5nVG9wOiAncGFkZGluZ1RvcCcsIHBhZGRpbmdCb3R0b206ICdwYWRkaW5nQm90dG9tJyxcbiAgICBwYWRkaW5nTGVmdDogJ3BhZGRpbmdMZWZ0JywgcGFkZGluZ1JpZ2h0OiAncGFkZGluZ1JpZ2h0JyxcbiAgICBpdGVtU3BhY2luZzogJ2dhcCcsXG4gICAgY29ybmVyUmFkaXVzOiAnYm9yZGVyUmFkaXVzJyxcbiAgICB0b3BMZWZ0UmFkaXVzOiAnYm9yZGVyVG9wTGVmdFJhZGl1cycsIHRvcFJpZ2h0UmFkaXVzOiAnYm9yZGVyVG9wUmlnaHRSYWRpdXMnLFxuICAgIGJvdHRvbUxlZnRSYWRpdXM6ICdib3JkZXJCb3R0b21MZWZ0UmFkaXVzJywgYm90dG9tUmlnaHRSYWRpdXM6ICdib3JkZXJCb3R0b21SaWdodFJhZGl1cycsXG4gICAgc3Ryb2tlV2VpZ2h0OiAnYm9yZGVyV2lkdGgnLFxuICAgIGZvbnRTaXplOiAnZm9udFNpemUnLCBsaW5lSGVpZ2h0OiAnbGluZUhlaWdodCcsIGxldHRlclNwYWNpbmc6ICdsZXR0ZXJTcGFjaW5nJyxcbiAgfTtcbiAgZm9yIChjb25zdCBbZmlnbWFLZXksIGNzc0tleV0gb2YgT2JqZWN0LmVudHJpZXMobnVtZXJpY01hcCkpIHtcbiAgICBpZiAoYnZbZmlnbWFLZXldKSB7XG4gICAgICBjb25zdCByZWYgPSByZXNvbHZlKGJ2W2ZpZ21hS2V5XSk7XG4gICAgICBpZiAocmVmKSBvdXRbY3NzS2V5XSA9IHJlZjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gT2JqZWN0LmtleXMob3V0KS5sZW5ndGggPiAwID8gb3V0IDogbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGNvbXBvbmVudC1pbnN0YW5jZSBtZXRhZGF0YTogbWFpbiBjb21wb25lbnQgbmFtZSArIHZhcmlhbnRcbiAqIC8gYm9vbGVhbiAvIHRleHQgcHJvcGVydGllcy4gUmV0dXJucyBudWxsIGZvciBub24taW5zdGFuY2Ugbm9kZXMuXG4gKiBUaGlzIGlzIHRoZSBrZXkgc2lnbmFsIHRoZSBhZ2VudCB1c2VzIHRvIGRlZHVwZSByZXBlYXRlZCBjYXJkcywgYnV0dG9ucyxcbiAqIGFuZCBpY29ucyBpbnRvIHNoYXJlZCBBQ0YgYmxvY2tzIGluc3RlYWQgb2YgaW5saW5pbmcgZWFjaCBvbmUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RDb21wb25lbnRJbnN0YW5jZShub2RlOiBTY2VuZU5vZGUpOiBDb21wb25lbnRJbnN0YW5jZUluZm8gfCBudWxsIHtcbiAgaWYgKG5vZGUudHlwZSAhPT0gJ0lOU1RBTkNFJykgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgaW5zdCA9IG5vZGUgYXMgSW5zdGFuY2VOb2RlO1xuICAgIGxldCBuYW1lID0gaW5zdC5uYW1lO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtYWluID0gaW5zdC5tYWluQ29tcG9uZW50O1xuICAgICAgaWYgKG1haW4pIHtcbiAgICAgICAgbmFtZSA9IG1haW4ucGFyZW50Py50eXBlID09PSAnQ09NUE9ORU5UX1NFVCcgPyAobWFpbi5wYXJlbnQgYXMgYW55KS5uYW1lIDogbWFpbi5uYW1lO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge31cbiAgICBjb25zdCBwcm9wZXJ0aWVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBib29sZWFuIHwgbnVtYmVyPiA9IHt9O1xuICAgIGNvbnN0IHByb3BzID0gKGluc3QgYXMgYW55KS5jb21wb25lbnRQcm9wZXJ0aWVzO1xuICAgIGlmIChwcm9wcyAmJiB0eXBlb2YgcHJvcHMgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbF0gb2YgT2JqZWN0LmVudHJpZXMocHJvcHMpKSB7XG4gICAgICAgIGNvbnN0IHYgPSAodmFsIGFzIGFueSk/LnZhbHVlO1xuICAgICAgICBpZiAodHlwZW9mIHYgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2ID09PSAnYm9vbGVhbicgfHwgdHlwZW9mIHYgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgcHJvcGVydGllc1trZXldID0gdjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyBuYW1lLCBwcm9wZXJ0aWVzIH07XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdCBhbHQgdGV4dCBmb3IgYW4gaW1hZ2UuIFNvdXJjZSBwcmlvcml0eTogY29tcG9uZW50IGRlc2NyaXB0aW9uXG4gKiAoZm9yIElOU1RBTkNFIC8gQ09NUE9ORU5UIG5vZGVzKSBcdTIxOTIgaHVtYW5pemVkIGxheWVyIG5hbWUuIFJldHVybnMgZW1wdHlcbiAqIHN0cmluZyB3aGVuIHRoZSBsYXllciBpcyBuYW1lZCBnZW5lcmljYWxseSAoUmVjdGFuZ2xlIDEyLCBJbWFnZSAzLCBldGMuKS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEFsdFRleHQobm9kZTogU2NlbmVOb2RlKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnSU5TVEFOQ0UnKSB7XG4gICAgICBjb25zdCBtYWluID0gKG5vZGUgYXMgSW5zdGFuY2VOb2RlKS5tYWluQ29tcG9uZW50O1xuICAgICAgaWYgKG1haW4gJiYgbWFpbi5kZXNjcmlwdGlvbiAmJiBtYWluLmRlc2NyaXB0aW9uLnRyaW0oKSkgcmV0dXJuIG1haW4uZGVzY3JpcHRpb24udHJpbSgpO1xuICAgIH1cbiAgICBpZiAobm9kZS50eXBlID09PSAnQ09NUE9ORU5UJykge1xuICAgICAgY29uc3QgZGVzYyA9IChub2RlIGFzIENvbXBvbmVudE5vZGUpLmRlc2NyaXB0aW9uO1xuICAgICAgaWYgKGRlc2MgJiYgZGVzYy50cmltKCkpIHJldHVybiBkZXNjLnRyaW0oKTtcbiAgICB9XG4gIH0gY2F0Y2gge31cbiAgaWYgKCFub2RlLm5hbWUgfHwgaXNEZWZhdWx0TGF5ZXJOYW1lKG5vZGUubmFtZSkpIHJldHVybiAnJztcbiAgcmV0dXJuIG5vZGUubmFtZS5yZXBsYWNlKC9bLV9dL2csICcgJykucmVwbGFjZSgvXFxzKy9nLCAnICcpLnRyaW0oKS5yZXBsYWNlKC9cXGJcXHcvZywgYyA9PiBjLnRvVXBwZXJDYXNlKCkpO1xufVxuXG4vKipcbiAqIE1hcCBGaWdtYSdzIElNQUdFIGZpbGwgc2NhbGVNb2RlIHRvIENTUyBvYmplY3QtZml0LlxuICogICBGSUxMIChkZWZhdWx0KSBcdTIxOTIgY292ZXJcbiAqICAgRklUICAgICAgICAgICAgXHUyMTkyIGNvbnRhaW4gKGltYWdlIHZpc2libGUgaW4gZnVsbCwgbGV0dGVyYm94IGlmIG5lZWRlZClcbiAqICAgQ1JPUCAgICAgICAgICAgXHUyMTkyIGNvdmVyIChvYmplY3QtcG9zaXRpb24gaGFuZGxlZCBzZXBhcmF0ZWx5IHZpYSBpbWFnZVRyYW5zZm9ybSlcbiAqICAgVElMRSAgICAgICAgICAgXHUyMTkyIGNvdmVyIChubyBkaXJlY3QgQ1NTIGVxdWl2YWxlbnQpXG4gKi9cbmZ1bmN0aW9uIGdldEltYWdlT2JqZWN0Rml0KG5vZGU6IGFueSk6IHN0cmluZyB7XG4gIGlmICghbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuICdjb3Zlcic7XG4gIGNvbnN0IGltZ0ZpbGwgPSBub2RlLmZpbGxzLmZpbmQoKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSkgYXMgSW1hZ2VQYWludCB8IHVuZGVmaW5lZDtcbiAgaWYgKCFpbWdGaWxsKSByZXR1cm4gJ2NvdmVyJztcbiAgc3dpdGNoIChpbWdGaWxsLnNjYWxlTW9kZSkge1xuICAgIGNhc2UgJ0ZJVCc6IHJldHVybiAnY29udGFpbic7XG4gICAgY2FzZSAnRklMTCc6XG4gICAgY2FzZSAnQ1JPUCc6XG4gICAgY2FzZSAnVElMRSc6XG4gICAgZGVmYXVsdDogcmV0dXJuICdjb3Zlcic7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBseSB0aGUgc2hhcmVkIG9wdGlvbmFsLXNpZ25hbCBmaWVsZHMgKGNvbXBvbmVudEluc3RhbmNlLCB3aWR0aE1vZGUsXG4gKiBoZWlnaHRNb2RlLCB2YXJCaW5kaW5ncykgdG8gYW4gZWxlbWVudC4gQ2VudHJhbGl6ZWQgc28gZXZlcnkgZWxlbWVudFxuICoga2luZCAodGV4dCwgaW1hZ2UsIGJ1dHRvbiwgaW5wdXQpIGJlbmVmaXRzIGNvbnNpc3RlbnRseS5cbiAqL1xuZnVuY3Rpb24gYXBwbHlDb21tb25TaWduYWxzKGVsZW06IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4sIG5vZGU6IFNjZW5lTm9kZSk6IHZvaWQge1xuICBjb25zdCBjbXAgPSBleHRyYWN0Q29tcG9uZW50SW5zdGFuY2Uobm9kZSk7XG4gIGlmIChjbXApIGVsZW0uY29tcG9uZW50SW5zdGFuY2UgPSBjbXA7XG5cbiAgY29uc3Qgc2l6ZSA9IGV4dHJhY3RTaXppbmdNb2Rlcyhub2RlKTtcbiAgaWYgKHNpemUud2lkdGhNb2RlKSBlbGVtLndpZHRoTW9kZSA9IHNpemUud2lkdGhNb2RlO1xuICBpZiAoc2l6ZS5oZWlnaHRNb2RlKSBlbGVtLmhlaWdodE1vZGUgPSBzaXplLmhlaWdodE1vZGU7XG5cbiAgY29uc3QgdmFycyA9IGV4dHJhY3RCb3VuZFZhcmlhYmxlcyhub2RlKTtcbiAgaWYgKHZhcnMpIGVsZW0udmFyQmluZGluZ3MgPSB2YXJzO1xuXG4gIC8vIEJsZW5kIG1vZGUgKG1peC1ibGVuZC1tb2RlKVxuICBjb25zdCBibGVuZCA9IGV4dHJhY3RNaXhCbGVuZE1vZGUobm9kZSBhcyBhbnkpO1xuICBpZiAoYmxlbmQpIGVsZW0ubWl4QmxlbmRNb2RlID0gYmxlbmQ7XG5cbiAgLy8gTGF5b3V0IHBvc2l0aW9uaW5nIGluc2lkZSBhbiBhdXRvLWxheW91dCBwYXJlbnQ6ICdhdXRvJyB8ICdhYnNvbHV0ZScuXG4gIC8vIFdlIG9ubHkgZW1pdCB3aGVuIEFCU09MVVRFIFx1MjAxNCAnYXV0bycgaXMgdGhlIGRlZmF1bHQgYW5kIHdvdWxkIGp1c3QgYmUgbm9pc2UuXG4gIGNvbnN0IGxwID0gZXh0cmFjdExheW91dFBvc2l0aW9uaW5nKG5vZGUgYXMgYW55KTtcbiAgaWYgKGxwID09PSAnYWJzb2x1dGUnKSBlbGVtLmxheW91dFBvc2l0aW9uaW5nID0gJ2Fic29sdXRlJztcblxuICAvLyBMYXlvdXQgY29uc3RyYWludHMgKG9ubHkgbWVhbmluZ2Z1bCBmb3Igbm9uLWF1dG8tbGF5b3V0IHBhcmVudHMgT1JcbiAgLy8gYWJzb2x1dGVseS1wb3NpdGlvbmVkIGNoaWxkcmVuIGluc2lkZSBhdXRvLWxheW91dCkuIFdlIGFsd2F5cyBlbWl0IHdoZW5cbiAgLy8gcHJlc2VudCBcdTIwMTQgYWdlbnQgZGVjaWRlcyB3aGV0aGVyIHRoZXkgYXBwbHkgYmFzZWQgb24gY29udGV4dC5cbiAgY29uc3QgY29ucyA9IGV4dHJhY3RDb25zdHJhaW50cyhub2RlIGFzIGFueSk7XG4gIGlmIChjb25zLmhvcml6b250YWwpIGVsZW0uY29uc3RyYWludHNIb3Jpem9udGFsID0gY29ucy5ob3Jpem9udGFsO1xuICBpZiAoY29ucy52ZXJ0aWNhbCkgZWxlbS5jb25zdHJhaW50c1ZlcnRpY2FsID0gY29ucy52ZXJ0aWNhbDtcbn1cblxuLyoqXG4gKiBSZWFkIG5vZGUub3BhY2l0eSBhbmQgcmV0dXJuIGl0IHdoZW4gYmVsb3cgMSAocm91bmRlZCB0byAyIGRlY2ltYWxzKS5cbiAqIFJldHVybnMgbnVsbCBmb3IgZnVsbHkgb3BhcXVlIG5vZGVzIG9yIHdoZW4gdGhlIHByb3BlcnR5IGlzIGFic2VudC5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdE9wYWNpdHkobm9kZTogYW55KTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICghKCdvcGFjaXR5JyBpbiBub2RlKSB8fCB0eXBlb2Ygbm9kZS5vcGFjaXR5ICE9PSAnbnVtYmVyJykgcmV0dXJuIG51bGw7XG4gIGlmIChub2RlLm9wYWNpdHkgPj0gMSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBNYXRoLnJvdW5kKG5vZGUub3BhY2l0eSAqIDEwMCkgLyAxMDA7XG59XG5cbi8qKlxuICogRGVjaWRlIHdoZXRoZXIgYSBub24tdGV4dCwgbm9uLWltYWdlLCBub24tYnV0dG9uLCBub24taW5wdXQgZnJhbWUgY2Fycmllc1xuICogZW5vdWdoIHZpc3VhbCBzdHlsaW5nIChmaWxsLCBzdHJva2UsIHJhZGl1cywgc2hhZG93LCByZWR1Y2VkIG9wYWNpdHkpIHRvXG4gKiB3YXJyYW50IGJlaW5nIGVtaXR0ZWQgYXMgYSBjb250YWluZXIgZWxlbWVudC4gUGxhaW4gc3RydWN0dXJhbCB3cmFwcGVyc1xuICogd2l0aCBubyBzdHlsaW5nIHJldHVybiBmYWxzZSBzbyB3ZSBkb24ndCBmbG9vZCBvdXRwdXQgd2l0aCBlbXB0eSBlbnRyaWVzLlxuICovXG5mdW5jdGlvbiBoYXNDb250YWluZXJTdHlsaW5nKG5vZGU6IFNjZW5lTm9kZSk6IGJvb2xlYW4ge1xuICBjb25zdCBuID0gbm9kZSBhcyBhbnk7XG4gIGlmIChleHRyYWN0QmFja2dyb3VuZENvbG9yKG4pKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKGV4dHJhY3RHcmFkaWVudChuKSkgcmV0dXJuIHRydWU7XG4gIGlmIChleHRyYWN0U3Ryb2tlQ29sb3IobikpIHJldHVybiB0cnVlO1xuICBjb25zdCBjb3JuZXJzID0gZXh0cmFjdFBlckNvcm5lclJhZGl1cyhuKTtcbiAgaWYgKGNvcm5lcnMpIHJldHVybiB0cnVlO1xuICBjb25zdCBmeCA9IGV4dHJhY3RFZmZlY3RzKG4pO1xuICBpZiAoZnguYm94U2hhZG93IHx8IGZ4LmZpbHRlciB8fCBmeC5iYWNrZHJvcEZpbHRlcikgcmV0dXJuIHRydWU7XG4gIGlmIChleHRyYWN0T3BhY2l0eShuKSAhPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBXYWxrIGFuIGljb24gc3VidHJlZSB0byBmaW5kIGl0cyBwcmltYXJ5IFNPTElEIGZpbGwgY29sb3IuIFVzZWQgdG9cbiAqIHN1Z2dlc3QgYSBDU1MgY29sb3IgZm9yIHRoZSBpbmxpbmVkIFNWRyAodGhlIGFnZW50IGNhbiBvdmVycmlkZSB3aXRoXG4gKiBgY3VycmVudENvbG9yYCBpZiBpdCB3YW50cyB0aGUgaWNvbiB0byBpbmhlcml0KS4gUmV0dXJucyBudWxsIHdoZW4gbm9cbiAqIHNvbGlkIGZpbGwgaXMgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGZpbmRGaXJzdFNvbGlkRmlsbENvbG9yKG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBmaWxscyA9IChub2RlIGFzIGFueSkuZmlsbHM7XG4gIGlmIChBcnJheS5pc0FycmF5KGZpbGxzKSkge1xuICAgIGZvciAoY29uc3QgZiBvZiBmaWxscykge1xuICAgICAgaWYgKGYgJiYgZi50eXBlID09PSAnU09MSUQnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UgJiYgZi5jb2xvcikge1xuICAgICAgICByZXR1cm4gcmdiVG9IZXgoZi5jb2xvcik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZC52aXNpYmxlID09PSBmYWxzZSkgY29udGludWU7XG4gICAgICBjb25zdCBjID0gZmluZEZpcnN0U29saWRGaWxsQ29sb3IoY2hpbGQpO1xuICAgICAgaWYgKGMpIHJldHVybiBjO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBCdWlsZCBhbiBlbGVtZW50IGVudHJ5IGZvciBhbiBpY29uIG5vZGUuIEVuY29kZXMgdGhlIFNWRyBmaWxlbmFtZSBzb1xuICogdGhlIGFnZW50IGtub3dzIHdoaWNoIGZpbGUgdG8gaW5saW5lLCBwbHVzIGRpbWVuc2lvbnMsIGFsdCB0ZXh0LCBhbmRcbiAqIGEgc3VnZ2VzdGVkIGZpbGwgY29sb3IuXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkSWNvbkVsZW1lbnQobm9kZTogU2NlbmVOb2RlLCBmaWxlbmFtZTogc3RyaW5nKTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiB7XG4gIGNvbnN0IGJiID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICBjb25zdCBlbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge1xuICAgIGljb25GaWxlOiBmaWxlbmFtZSxcbiAgICB3aWR0aDogYmIgPyB0b0Nzc1ZhbHVlKE1hdGgucm91bmQoYmIud2lkdGgpKSA6IG51bGwsXG4gICAgaGVpZ2h0OiBiYiA/IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChiYi5oZWlnaHQpKSA6IG51bGwsXG4gIH07XG4gIGNvbnN0IGNvbG9yID0gZmluZEZpcnN0U29saWRGaWxsQ29sb3Iobm9kZSk7XG4gIGlmIChjb2xvcikgZWxlbS5jb2xvciA9IGNvbG9yO1xuICBjb25zdCBhbHQgPSBleHRyYWN0QWx0VGV4dChub2RlKTtcbiAgaWYgKGFsdCkgZWxlbS5hbHQgPSBhbHQ7XG4gIE9iamVjdC5hc3NpZ24oZWxlbSwgZXh0cmFjdEZsZXhDaGlsZFByb3BzKG5vZGUgYXMgYW55KSk7XG4gIGFwcGx5Q29tbW9uU2lnbmFscyhlbGVtLCBub2RlKTtcbiAgY29uc3Qgb3AgPSBleHRyYWN0T3BhY2l0eShub2RlKTtcbiAgaWYgKG9wICE9PSBudWxsKSBlbGVtLm9wYWNpdHkgPSBvcDtcbiAgY29uc3QgdHggPSBleHRyYWN0VHJhbnNmb3JtKG5vZGUgYXMgYW55KTtcbiAgaWYgKHR4LnRyYW5zZm9ybSkgZWxlbS50cmFuc2Zvcm0gPSB0eC50cmFuc2Zvcm07XG4gIGNvbnN0IGhyZWYgPSBleHRyYWN0TGlua1VybChub2RlIGFzIGFueSk7XG4gIGlmIChocmVmKSBlbGVtLmxpbmtVcmwgPSBocmVmO1xuICByZXR1cm4gZWxlbTtcbn1cblxuLyoqXG4gKiBGaW5kIGFuZCBjbGFzc2lmeSBhbGwgbWVhbmluZ2Z1bCBlbGVtZW50cyB3aXRoaW4gYSBzZWN0aW9uLlxuICogV2Fsa3MgdGhlIG5vZGUgdHJlZSBhbmQgZXh0cmFjdHMgdHlwb2dyYXBoeSBmb3IgVEVYVCBub2RlcyxcbiAqIGRpbWVuc2lvbnMgZm9yIGltYWdlIGNvbnRhaW5lcnMsIGV0Yy5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEVsZW1lbnRzKFxuICBzZWN0aW9uTm9kZTogU2NlbmVOb2RlLFxuICBpY29uTWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuICBpbWFnZU1hcDogTWFwPHN0cmluZywgc3RyaW5nPixcbik6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8RWxlbWVudFN0eWxlcz4+IHtcbiAgY29uc3QgZWxlbWVudHM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8RWxlbWVudFN0eWxlcz4+ID0ge307XG4gIGxldCB0ZXh0SW5kZXggPSAwO1xuICBsZXQgaW1hZ2VJbmRleCA9IDA7XG4gIGxldCBpY29uSW5kZXggPSAwO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgLy8gSWNvbiByb290cyBcdTIxOTIgZW1pdCBpY29uRmlsZSByZWZlcmVuY2UgYW5kIHN0b3AuIGljb25NYXAgaXMgYnVpbHQgYnlcbiAgICAvLyBpY29uLWRldGVjdG9yIGFuZCBzaGFyZWQgd2l0aCBpbWFnZS1leHBvcnRlciwgc28gdGhlIGZpbGVuYW1lIGhlcmVcbiAgICAvLyBtYXRjaGVzIGV4YWN0bHkgd2hhdCBnZXRzIHdyaXR0ZW4gaW50byBwYWdlcy88c2x1Zz4vaW1hZ2VzLy5cbiAgICBjb25zdCBpY29uRmlsZW5hbWUgPSBpY29uTWFwLmdldChub2RlLmlkKTtcbiAgICBpZiAoaWNvbkZpbGVuYW1lKSB7XG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBjb25zdCByb2xlID0gY2xlYW5OYW1lICYmICEvXih2ZWN0b3J8aWNvbnxmcmFtZXxncm91cHxyZWN0YW5nbGV8ZWxsaXBzZXxib29sZWFuKVxcZCokLy50ZXN0KGNsZWFuTmFtZSlcbiAgICAgICAgPyBjbGVhbk5hbWVcbiAgICAgICAgOiBgaWNvbiR7aWNvbkluZGV4ID4gMCA/ICdfJyArIGljb25JbmRleCA6ICcnfWA7XG4gICAgICBpZiAoIWVsZW1lbnRzW3JvbGVdKSB7XG4gICAgICAgIGVsZW1lbnRzW3JvbGVdID0gYnVpbGRJY29uRWxlbWVudChub2RlLCBpY29uRmlsZW5hbWUpO1xuICAgICAgfVxuICAgICAgaWNvbkluZGV4Kys7XG4gICAgICByZXR1cm47IC8vIGRvbid0IGRlc2NlbmQgaW50byB0aGUgaWNvbidzIHZlY3RvciBjaGlsZHJlblxuICAgIH1cblxuICAgIC8vIFRFWFQgbm9kZXMgXHUyMTkyIHR5cG9ncmFwaHkgKyB0ZXh0IGNvbnRlbnRcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIGNvbnN0IHR5cG8gPSBleHRyYWN0VHlwb2dyYXBoeShub2RlKTtcbiAgICAgIGNvbnN0IGZvbnRTaXplID0gbm9kZS5mb250U2l6ZSAhPT0gZmlnbWEubWl4ZWQgPyAobm9kZS5mb250U2l6ZSBhcyBudW1iZXIpIDogMTY7XG5cbiAgICAgIC8vIENsYXNzaWZ5IGJ5IHJvbGU6IGhlYWRpbmdzIGFyZSBsYXJnZXIsIGJvZHkgdGV4dCBpcyBzbWFsbGVyXG4gICAgICBsZXQgcm9sZTogc3RyaW5nO1xuICAgICAgaWYgKHRleHRJbmRleCA9PT0gMCAmJiBmb250U2l6ZSA+PSAyOCkge1xuICAgICAgICByb2xlID0gJ2hlYWRpbmcnO1xuICAgICAgfSBlbHNlIGlmICh0ZXh0SW5kZXggPT09IDEgJiYgZm9udFNpemUgPj0gMTYpIHtcbiAgICAgICAgcm9sZSA9ICdzdWJoZWFkaW5nJztcbiAgICAgIH0gZWxzZSBpZiAobm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2J1dHRvbicpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjdGEnKSkge1xuICAgICAgICByb2xlID0gJ2J1dHRvbl90ZXh0JztcbiAgICAgIH0gZWxzZSBpZiAobm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2NhcHRpb24nKSB8fCBmb250U2l6ZSA8PSAxNCkge1xuICAgICAgICByb2xlID0gYGNhcHRpb24ke3RleHRJbmRleCA+IDIgPyAnXycgKyB0ZXh0SW5kZXggOiAnJ31gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm9sZSA9IGB0ZXh0XyR7dGV4dEluZGV4fWA7XG4gICAgICB9XG5cbiAgICAgIC8vIFVzZSB0aGUgbGF5ZXIgbmFtZSBpZiBpdCdzIG5vdCBhIGRlZmF1bHQgbmFtZVxuICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgaWYgKGNsZWFuTmFtZSAmJiAhL14odGV4dHxmcmFtZXxncm91cHxyZWN0YW5nbGUpXFxkKiQvLnRlc3QoY2xlYW5OYW1lKSkge1xuICAgICAgICByb2xlID0gY2xlYW5OYW1lO1xuICAgICAgfVxuXG4gICAgICAvLyBFeHRyYWN0IGFjdHVhbCB0ZXh0IGNvbnRlbnQgZm9yIGNvbnRlbnQgcG9wdWxhdGlvbiBhbmQgY29udGV4dFxuICAgICAgdHlwby50ZXh0Q29udGVudCA9IG5vZGUuY2hhcmFjdGVycyB8fCBudWxsO1xuXG4gICAgICAvLyBQZXItc2lkZSBtYXJnaW5zIGZyb20gc2libGluZyBzcGFjaW5nICh0b3AvcmlnaHQvYm90dG9tL2xlZnQpXG4gICAgICBPYmplY3QuYXNzaWduKHR5cG8sIGV4dHJhY3RQZXJTaWRlTWFyZ2lucyhub2RlKSk7XG5cbiAgICAgIC8vIEZsZXgtY2hpbGQgcHJvcGVydGllcyAobGF5b3V0R3JvdyAvIGxheW91dEFsaWduKVxuICAgICAgT2JqZWN0LmFzc2lnbih0eXBvLCBleHRyYWN0RmxleENoaWxkUHJvcHMobm9kZSkpO1xuXG4gICAgICAvLyBUcmFuc2Zvcm0gKHJvdGF0ZS9zY2FsZSkgaWYgbm9uLWlkZW50aXR5XG4gICAgICBjb25zdCB0eCA9IGV4dHJhY3RUcmFuc2Zvcm0obm9kZSk7XG4gICAgICBpZiAodHgudHJhbnNmb3JtKSB0eXBvLnRyYW5zZm9ybSA9IHR4LnRyYW5zZm9ybTtcblxuICAgICAgLy8gTGluayBVUkwgZnJvbSBwcm90b3R5cGUgbmF2aWdhdGlvblxuICAgICAgY29uc3QgaHJlZiA9IGV4dHJhY3RMaW5rVXJsKG5vZGUpO1xuICAgICAgaWYgKGhyZWYpIHR5cG8ubGlua1VybCA9IGhyZWY7XG5cbiAgICAgIC8vIE1heCB3aWR0aCBpZiBjb25zdHJhaW5lZFxuICAgICAgaWYgKG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCAmJiBub2RlLnBhcmVudD8udHlwZSA9PT0gJ0ZSQU1FJykge1xuICAgICAgICBjb25zdCBwYXJlbnRXaWR0aCA9IChub2RlLnBhcmVudCBhcyBGcmFtZU5vZGUpLmFic29sdXRlQm91bmRpbmdCb3g/LndpZHRoO1xuICAgICAgICBpZiAocGFyZW50V2lkdGggJiYgbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94LndpZHRoIDwgcGFyZW50V2lkdGggKiAwLjkpIHtcbiAgICAgICAgICB0eXBvLm1heFdpZHRoID0gdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveC53aWR0aCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIENvbW1vbiBzaWduYWxzOiBjb21wb25lbnRJbnN0YW5jZSwgc2l6aW5nIG1vZGVzLCBib3VuZCB2YXJpYWJsZXNcbiAgICAgIGFwcGx5Q29tbW9uU2lnbmFscyh0eXBvLCBub2RlKTtcblxuICAgICAgY29uc3QgdGV4dE9wYWNpdHkgPSBleHRyYWN0T3BhY2l0eShub2RlKTtcbiAgICAgIGlmICh0ZXh0T3BhY2l0eSAhPT0gbnVsbCkgdHlwby5vcGFjaXR5ID0gdGV4dE9wYWNpdHk7XG5cbiAgICAgIGVsZW1lbnRzW3JvbGVdID0gdHlwbztcbiAgICAgIHRleHRJbmRleCsrO1xuICAgIH1cblxuICAgIC8vIElNQUdFIGZpbGxzIFx1MjE5MiBpbWFnZSBlbGVtZW50ICh3aXRoIHNtYXJ0IGJhY2tncm91bmQgZGV0ZWN0aW9uKVxuICAgIGlmIChoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpICYmIG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCkge1xuICAgICAgY29uc3QgYm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuXG4gICAgICAvLyBTbWFydCBiYWNrZ3JvdW5kIGltYWdlIGRldGVjdGlvbjpcbiAgICAgIC8vIDEuIExheWVyIG5hbWUgY29udGFpbnMgJ2JhY2tncm91bmQnIG9yICdiZycgT1JcbiAgICAgIC8vIDIuIEltYWdlIHNwYW5zID49IDkwJSBvZiB0aGUgc2VjdGlvbidzIHdpZHRoIEFORCBoZWlnaHQgKGZ1bGwtYmxlZWQgaW1hZ2UpXG4gICAgICBjb25zdCBuYW1lSGludHNCZyA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdiYWNrZ3JvdW5kJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2JnJyk7XG4gICAgICBjb25zdCBzZWN0aW9uQm91bmRzID0gc2VjdGlvbk5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgIGNvbnN0IHNwYW5zU2VjdGlvbiA9IHNlY3Rpb25Cb3VuZHMgJiZcbiAgICAgICAgYm91bmRzLndpZHRoID49IHNlY3Rpb25Cb3VuZHMud2lkdGggKiAwLjkgJiZcbiAgICAgICAgYm91bmRzLmhlaWdodCA+PSBzZWN0aW9uQm91bmRzLmhlaWdodCAqIDAuOTtcblxuICAgICAgY29uc3QgaXNCYWNrZ3JvdW5kSW1hZ2UgPSBuYW1lSGludHNCZyB8fCBzcGFuc1NlY3Rpb247XG5cbiAgICAgIGNvbnN0IHJvbGUgPSBpc0JhY2tncm91bmRJbWFnZVxuICAgICAgICA/ICdiYWNrZ3JvdW5kX2ltYWdlJ1xuICAgICAgICA6IGBpbWFnZSR7aW1hZ2VJbmRleCA+IDAgPyAnXycgKyBpbWFnZUluZGV4IDogJyd9YDtcblxuICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgY29uc3QgZmluYWxSb2xlID0gY2xlYW5OYW1lICYmICEvXihpbWFnZXxyZWN0YW5nbGV8ZnJhbWUpXFxkKiQvLnRlc3QoY2xlYW5OYW1lKSA/IGNsZWFuTmFtZSA6IHJvbGU7XG5cbiAgICAgIC8vIERldGVjdCBtYXNrL2NsaXAgb24gaW1hZ2Ugb3IgaXRzIHBhcmVudCBjb250YWluZXJcbiAgICAgIGNvbnN0IHBhcmVudEZyYW1lID0gbm9kZS5wYXJlbnQ7XG4gICAgICBjb25zdCBwYXJlbnRDbGlwcyA9IHBhcmVudEZyYW1lICYmICdjbGlwc0NvbnRlbnQnIGluIHBhcmVudEZyYW1lICYmIChwYXJlbnRGcmFtZSBhcyBhbnkpLmNsaXBzQ29udGVudCA9PT0gdHJ1ZTtcbiAgICAgIGNvbnN0IGlzTWFza2VkID0gKCdpc01hc2snIGluIG5vZGUgJiYgKG5vZGUgYXMgYW55KS5pc01hc2sgPT09IHRydWUpIHx8IHBhcmVudENsaXBzO1xuICAgICAgLy8gRGV0ZWN0IGNpcmN1bGFyL3JvdW5kZWQgY2xpcHM6IGlmIHBhcmVudCBoYXMgZXF1YWwgY29ybmVyUmFkaXVzIGFuZCBpcyByb3VnaGx5IHNxdWFyZVxuICAgICAgbGV0IGNsaXBCb3JkZXJSYWRpdXM6IHN0cmluZyB8IG51bGwgPSAnY29ybmVyUmFkaXVzJyBpbiBub2RlICYmIHR5cGVvZiAobm9kZSBhcyBhbnkpLmNvcm5lclJhZGl1cyA9PT0gJ251bWJlcidcbiAgICAgICAgPyB0b0Nzc1ZhbHVlKChub2RlIGFzIGFueSkuY29ybmVyUmFkaXVzKVxuICAgICAgICA6IG51bGw7XG4gICAgICBpZiAoIWNsaXBCb3JkZXJSYWRpdXMgJiYgcGFyZW50RnJhbWUgJiYgJ2Nvcm5lclJhZGl1cycgaW4gcGFyZW50RnJhbWUgJiYgdHlwZW9mIChwYXJlbnRGcmFtZSBhcyBhbnkpLmNvcm5lclJhZGl1cyA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgY29uc3QgcGFyZW50Q29ybmVyID0gKHBhcmVudEZyYW1lIGFzIGFueSkuY29ybmVyUmFkaXVzIGFzIG51bWJlcjtcbiAgICAgICAgaWYgKHBhcmVudENvcm5lciA+IDApIHtcbiAgICAgICAgICBjb25zdCBwYXJlbnRCb3VuZHMgPSAocGFyZW50RnJhbWUgYXMgYW55KS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgICAgIC8vIElmIHBhcmVudCBpcyByb3VnaGx5IHNxdWFyZSBhbmQgY29ybmVyUmFkaXVzID49IGhhbGYgdGhlIHdpZHRoIFx1MjE5MiBjaXJjbGVcbiAgICAgICAgICBpZiAocGFyZW50Qm91bmRzICYmIE1hdGguYWJzKHBhcmVudEJvdW5kcy53aWR0aCAtIHBhcmVudEJvdW5kcy5oZWlnaHQpIDwgNSAmJiBwYXJlbnRDb3JuZXIgPj0gcGFyZW50Qm91bmRzLndpZHRoIC8gMiAtIDIpIHtcbiAgICAgICAgICAgIGNsaXBCb3JkZXJSYWRpdXMgPSAnNTAlJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xpcEJvcmRlclJhZGl1cyA9IHRvQ3NzVmFsdWUocGFyZW50Q29ybmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgaW1nRWZmZWN0cyA9IGV4dHJhY3RFZmZlY3RzKG5vZGUgYXMgYW55KTtcbiAgICAgIGNvbnN0IGltZ09iamVjdFBvc2l0aW9uID0gZXh0cmFjdE9iamVjdFBvc2l0aW9uKG5vZGUpO1xuICAgICAgY29uc3QgaW1nQ29ybmVycyA9IGV4dHJhY3RQZXJDb3JuZXJSYWRpdXMobm9kZSBhcyBhbnkpO1xuICAgICAgLy8gaW1hZ2UtZXhwb3J0ZXIgd3JpdGVzIHJhc3RlciBmaWxscyB1c2luZyB0aGUgc2hhcmVkIGltYWdlTWFwLlxuICAgICAgLy8gUmVzb2x2ZSB0aHJvdWdoIHRoZSBzYW1lIG1hcCBzbyB0aGUgc3BlYydzIGBpbWFnZUZpbGVgIG1hdGNoZXMgdGhlXG4gICAgICAvLyBleGFjdCBmaWxlbmFtZSB0aGUgWklQIGNvbnRhaW5zIChhZnRlciBkZWR1cCArIHN1ZmZpeGluZykuXG4gICAgICBjb25zdCBpbWdGaWxlbmFtZSA9IGltYWdlTWFwLmdldChub2RlLmlkKSB8fCBgJHtzbHVnaWZ5KG5vZGUubmFtZSl9LnBuZ2A7XG4gICAgICBjb25zdCBpbWdFbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge1xuICAgICAgICBpbWFnZUZpbGU6IGltZ0ZpbGVuYW1lLFxuICAgICAgICB3aWR0aDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnMTAwJScgOiB0b0Nzc1ZhbHVlKE1hdGgucm91bmQoYm91bmRzLndpZHRoKSksXG4gICAgICAgIGhlaWdodDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnMTAwJScgOiAnYXV0bycsXG4gICAgICAgIGFzcGVjdFJhdGlvOiBpc0JhY2tncm91bmRJbWFnZSA/IG51bGwgOiBjb21wdXRlQXNwZWN0UmF0aW8oYm91bmRzLndpZHRoLCBib3VuZHMuaGVpZ2h0KSxcbiAgICAgICAgb2JqZWN0Rml0OiBnZXRJbWFnZU9iamVjdEZpdChub2RlIGFzIGFueSksXG4gICAgICAgIG9iamVjdFBvc2l0aW9uOiBpbWdPYmplY3RQb3NpdGlvbixcbiAgICAgICAgb3ZlcmZsb3c6IChwYXJlbnRDbGlwcyB8fCBjbGlwQm9yZGVyUmFkaXVzKSA/ICdoaWRkZW4nIDogbnVsbCxcbiAgICAgICAgaGFzTWFzazogaXNNYXNrZWQgfHwgbnVsbCxcbiAgICAgICAgYm94U2hhZG93OiBpbWdFZmZlY3RzLmJveFNoYWRvdyxcbiAgICAgICAgZmlsdGVyOiBpbWdFZmZlY3RzLmZpbHRlcixcbiAgICAgICAgLy8gTWFyayBiYWNrZ3JvdW5kIGltYWdlcyB3aXRoIHBvc2l0aW9uIGRhdGEgc28gYWdlbnRzIGtub3cgdG8gdXNlIENTUyBiYWNrZ3JvdW5kLWltYWdlXG4gICAgICAgIHBvc2l0aW9uOiBpc0JhY2tncm91bmRJbWFnZSA/ICdhYnNvbHV0ZScgOiBudWxsLFxuICAgICAgICB0b3A6IGlzQmFja2dyb3VuZEltYWdlID8gJzBweCcgOiBudWxsLFxuICAgICAgICBsZWZ0OiBpc0JhY2tncm91bmRJbWFnZSA/ICcwcHgnIDogbnVsbCxcbiAgICAgICAgekluZGV4OiBpc0JhY2tncm91bmRJbWFnZSA/IDAgOiBudWxsLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGltZ0FsdCA9IGV4dHJhY3RBbHRUZXh0KG5vZGUpO1xuICAgICAgaWYgKGltZ0FsdCkgaW1nRWxlbS5hbHQgPSBpbWdBbHQ7XG4gICAgICBhcHBseUNvbW1vblNpZ25hbHMoaW1nRWxlbSwgbm9kZSk7XG4gICAgICAvLyBBcHBseSByYWRpdXMgXHUyMDE0IHBlci1jb3JuZXIgaWYgbm9kZSBoYXMgZGlmZmVyaW5nIGNvcm5lcnMsIHVuaWZvcm0gb3RoZXJ3aXNlXG4gICAgICBpZiAoaW1nQ29ybmVycykge1xuICAgICAgICBpZiAoaW1nQ29ybmVycy51bmlmb3JtICE9PSBudWxsKSB7XG4gICAgICAgICAgaW1nRWxlbS5ib3JkZXJSYWRpdXMgPSB0b0Nzc1ZhbHVlKGltZ0Nvcm5lcnMudW5pZm9ybSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW1nRWxlbS5ib3JkZXJUb3BMZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLnRvcExlZnQpO1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyVG9wUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGltZ0Nvcm5lcnMudG9wUmlnaHQpO1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyQm90dG9tTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoaW1nQ29ybmVycy5ib3R0b21MZWZ0KTtcbiAgICAgICAgICBpbWdFbGVtLmJvcmRlckJvdHRvbVJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLmJvdHRvbVJpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjbGlwQm9yZGVyUmFkaXVzKSB7XG4gICAgICAgIGltZ0VsZW0uYm9yZGVyUmFkaXVzID0gY2xpcEJvcmRlclJhZGl1cztcbiAgICAgIH1cbiAgICAgIC8vIEZsZXgtY2hpbGQgcHJvcHMgaWYgaW1hZ2UgaXMgaW5zaWRlIGFuIGF1dG8tbGF5b3V0IHJvd1xuICAgICAgT2JqZWN0LmFzc2lnbihpbWdFbGVtLCBleHRyYWN0RmxleENoaWxkUHJvcHMobm9kZSkpO1xuICAgICAgY29uc3QgaW1nT3BhY2l0eSA9IGV4dHJhY3RPcGFjaXR5KG5vZGUpO1xuICAgICAgaWYgKGltZ09wYWNpdHkgIT09IG51bGwpIGltZ0VsZW0ub3BhY2l0eSA9IGltZ09wYWNpdHk7XG4gICAgICBlbGVtZW50c1tmaW5hbFJvbGVdID0gaW1nRWxlbTtcbiAgICAgIGltYWdlSW5kZXgrKztcbiAgICB9XG5cbiAgICAvLyBCdXR0b24tbGlrZSBmcmFtZXMgKHNtYWxsIGZyYW1lcyB3aXRoIHRleHQgKyBmaWxsKVxuICAgIGlmICgobm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnKSAmJlxuICAgICAgICBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYnV0dG9uJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2J0bicpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjdGEnKSkge1xuICAgICAgY29uc3QgZnJhbWUgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgIGNvbnN0IGJnID0gZXh0cmFjdEJhY2tncm91bmRDb2xvcihmcmFtZSk7XG4gICAgICBjb25zdCBib3VuZHMgPSBmcmFtZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuXG4gICAgICBpZiAoYmcgJiYgYm91bmRzKSB7XG4gICAgICAgIGNvbnN0IGJ1dHRvblN0eWxlczogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGJnLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChmcmFtZS5sYXlvdXRNb2RlICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICAgIGJ1dHRvblN0eWxlcy5wYWRkaW5nVG9wID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nVG9wKTtcbiAgICAgICAgICBidXR0b25TdHlsZXMucGFkZGluZ0JvdHRvbSA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ0JvdHRvbSk7XG4gICAgICAgICAgYnV0dG9uU3R5bGVzLnBhZGRpbmdMZWZ0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nTGVmdCk7XG4gICAgICAgICAgYnV0dG9uU3R5bGVzLnBhZGRpbmdSaWdodCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ1JpZ2h0KTtcbiAgICAgICAgICBpZiAodHlwZW9mIGZyYW1lLml0ZW1TcGFjaW5nID09PSAnbnVtYmVyJyAmJiBmcmFtZS5pdGVtU3BhY2luZyA+IDApIHtcbiAgICAgICAgICAgIGJ1dHRvblN0eWxlcy5nYXAgPSB0b0Nzc1ZhbHVlKGZyYW1lLml0ZW1TcGFjaW5nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gRmxleCBsYXlvdXQgKGljb24gKyBsYWJlbCBldGMuKVxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oYnV0dG9uU3R5bGVzLCBleHRyYWN0QXV0b0xheW91dEZsZXgoZnJhbWUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5UmFkaXVzKGJ1dHRvblN0eWxlcywgZnJhbWUpO1xuICAgICAgICBhcHBseVN0cm9rZXMoYnV0dG9uU3R5bGVzLCBmcmFtZSk7XG4gICAgICAgIGNvbnN0IGJ0bkVmZmVjdHMgPSBleHRyYWN0RWZmZWN0cyhmcmFtZSBhcyBhbnkpO1xuICAgICAgICBpZiAoYnRuRWZmZWN0cy5ib3hTaGFkb3cpIGJ1dHRvblN0eWxlcy5ib3hTaGFkb3cgPSBidG5FZmZlY3RzLmJveFNoYWRvdztcbiAgICAgICAgaWYgKGJ0bkVmZmVjdHMuZmlsdGVyKSBidXR0b25TdHlsZXMuZmlsdGVyID0gYnRuRWZmZWN0cy5maWx0ZXI7XG5cbiAgICAgICAgY29uc3QgdHggPSBleHRyYWN0VHJhbnNmb3JtKGZyYW1lIGFzIGFueSk7XG4gICAgICAgIGlmICh0eC50cmFuc2Zvcm0pIGJ1dHRvblN0eWxlcy50cmFuc2Zvcm0gPSB0eC50cmFuc2Zvcm07XG5cbiAgICAgICAgLy8gTGluayBVUkwgZnJvbSBwcm90b3R5cGUgT1BFTl9VUkwgYWN0aW9uXG4gICAgICAgIGNvbnN0IGhyZWYgPSBleHRyYWN0TGlua1VybChmcmFtZSk7XG4gICAgICAgIGlmIChocmVmKSBidXR0b25TdHlsZXMubGlua1VybCA9IGhyZWY7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgdGV4dCBub2RlIGluc2lkZSB0aGUgYnV0dG9uIGZvciB0eXBvZ3JhcGh5XG4gICAgICAgIGNvbnN0IHRleHRDaGlsZCA9IGZpbmRGaXJzdFRleHROb2RlKGZyYW1lKTtcbiAgICAgICAgaWYgKHRleHRDaGlsZCkge1xuICAgICAgICAgIGNvbnN0IHR5cG8gPSBleHRyYWN0VHlwb2dyYXBoeSh0ZXh0Q2hpbGQpO1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24oYnV0dG9uU3R5bGVzLCB0eXBvKTtcbiAgICAgICAgICBidXR0b25TdHlsZXMudGV4dENvbnRlbnQgPSB0ZXh0Q2hpbGQuY2hhcmFjdGVycyB8fCBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihidXR0b25TdHlsZXMsIGV4dHJhY3RGbGV4Q2hpbGRQcm9wcyhmcmFtZSBhcyBhbnkpKTtcblxuICAgICAgICAvLyBDb21tb24gc2lnbmFsczogY29tcG9uZW50SW5zdGFuY2UgKGJ1dHRvbiB2YXJpYW50cyEpLCBzaXppbmcsIHZhcnNcbiAgICAgICAgYXBwbHlDb21tb25TaWduYWxzKGJ1dHRvblN0eWxlcywgZnJhbWUpO1xuXG4gICAgICAgIGNvbnN0IGJ0bk9wYWNpdHkgPSBleHRyYWN0T3BhY2l0eShmcmFtZSk7XG4gICAgICAgIGlmIChidG5PcGFjaXR5ICE9PSBudWxsKSBidXR0b25TdHlsZXMub3BhY2l0eSA9IGJ0bk9wYWNpdHk7XG5cbiAgICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgICBlbGVtZW50c1tjbGVhbk5hbWUgfHwgJ2J1dHRvbiddID0gYnV0dG9uU3R5bGVzO1xuICAgICAgfVxuICAgICAgcmV0dXJuOyAvLyBEb24ndCByZWN1cnNlIGludG8gYnV0dG9uIGludGVybmFsc1xuICAgIH1cblxuICAgIC8vIElucHV0LWxpa2UgZnJhbWVzIChkZXRlY3QgaW5wdXRzIGJ5IGNvbW1vbiBsYXllciBuYW1lcylcbiAgICBpZiAoKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJykgJiZcbiAgICAgICAgL1xcYihpbnB1dHxmaWVsZHx0ZXh0Ym94fHRleHRhcmVhfHNlbGVjdHx0ZXh0ZmllbGQpXFxiL2kudGVzdChub2RlLm5hbWUpKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgY29uc3QgaW5wdXRTdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogZXh0cmFjdEJhY2tncm91bmRDb2xvcihmcmFtZSksXG4gICAgICB9O1xuICAgICAgaWYgKGZyYW1lLmxheW91dE1vZGUgJiYgZnJhbWUubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgICAgIGlucHV0U3R5bGVzLnBhZGRpbmdUb3AgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdUb3ApO1xuICAgICAgICBpbnB1dFN0eWxlcy5wYWRkaW5nQm90dG9tID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nQm90dG9tKTtcbiAgICAgICAgaW5wdXRTdHlsZXMucGFkZGluZ0xlZnQgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdMZWZ0KTtcbiAgICAgICAgaW5wdXRTdHlsZXMucGFkZGluZ1JpZ2h0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nUmlnaHQpO1xuICAgICAgfVxuICAgICAgYXBwbHlSYWRpdXMoaW5wdXRTdHlsZXMsIGZyYW1lKTtcbiAgICAgIGFwcGx5U3Ryb2tlcyhpbnB1dFN0eWxlcywgZnJhbWUpO1xuICAgICAgY29uc3QgcGxhY2Vob2xkZXJUZXh0ID0gZmluZEZpcnN0VGV4dE5vZGUoZnJhbWUpO1xuICAgICAgaWYgKHBsYWNlaG9sZGVyVGV4dCkge1xuICAgICAgICBpbnB1dFN0eWxlcy5wbGFjZWhvbGRlciA9IHBsYWNlaG9sZGVyVGV4dC5jaGFyYWN0ZXJzIHx8IG51bGw7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyVHlwbyA9IGV4dHJhY3RUeXBvZ3JhcGh5KHBsYWNlaG9sZGVyVGV4dCk7XG4gICAgICAgIGlucHV0U3R5bGVzLnBsYWNlaG9sZGVyU3R5bGVzID0ge1xuICAgICAgICAgIGNvbG9yOiBwbGFjZWhvbGRlclR5cG8uY29sb3IgfHwgbnVsbCxcbiAgICAgICAgICBmb250U2l6ZTogcGxhY2Vob2xkZXJUeXBvLmZvbnRTaXplIHx8IG51bGwsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBhcHBseUNvbW1vblNpZ25hbHMoaW5wdXRTdHlsZXMsIGZyYW1lKTtcblxuICAgICAgY29uc3QgaW5wdXRPcGFjaXR5ID0gZXh0cmFjdE9wYWNpdHkoZnJhbWUpO1xuICAgICAgaWYgKGlucHV0T3BhY2l0eSAhPT0gbnVsbCkgaW5wdXRTdHlsZXMub3BhY2l0eSA9IGlucHV0T3BhY2l0eTtcblxuICAgICAgY29uc3QgaW5wdXROYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpIHx8ICdpbnB1dCc7XG4gICAgICBlbGVtZW50c1tpbnB1dE5hbWVdID0gaW5wdXRTdHlsZXM7XG4gICAgICByZXR1cm47IC8vIERvbid0IHJlY3Vyc2UgaW50byBpbnB1dCBpbnRlcm5hbHNcbiAgICB9XG5cbiAgICAvLyBHZW5lcmljIGNvbnRhaW5lciBmcmFtZXMgXHUyMDE0IGNhcmRzLCB3cmFwcGVycywgdGlsZXMgZXRjLiBFbWl0IHN0eWxpbmcgd2hlblxuICAgIC8vIHRoZSBmcmFtZSBoYXMgYW55IHZpc3VhbCBwcm9wZXJ0aWVzIChmaWxsLCBzdHJva2UsIHJhZGl1cywgc2hhZG93LFxuICAgIC8vIG9wYWNpdHkgPCAxKS4gU2tpcCBkZXB0aCAwICh0aGF0J3MgdGhlIHNlY3Rpb24gaXRzZWxmLCBoYW5kbGVkIGJ5XG4gICAgLy8gZXh0cmFjdFNlY3Rpb25TdHlsZXMpLiBTdGlsbCByZWN1cnNlIHNvIG5lc3RlZCB0ZXh0L2ltYWdlcy9idXR0b25zIGFyZVxuICAgIC8vIGNhcHR1cmVkIGFzIHNlcGFyYXRlIGVsZW1lbnRzLlxuICAgIGlmIChkZXB0aCA+IDAgJiZcbiAgICAgICAgKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdHUk9VUCcpICYmXG4gICAgICAgICFoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpICYmXG4gICAgICAgIGhhc0NvbnRhaW5lclN0eWxpbmcobm9kZSkpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBjb25zdCBjb250YWluZXJTdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7fTtcblxuICAgICAgY29uc3QgYmcgPSBleHRyYWN0QmFja2dyb3VuZENvbG9yKGZyYW1lKTtcbiAgICAgIGlmIChiZykgY29udGFpbmVyU3R5bGVzLmJhY2tncm91bmRDb2xvciA9IGJnO1xuICAgICAgY29uc3QgZ3JhZGllbnQgPSBleHRyYWN0R3JhZGllbnQoZnJhbWUpO1xuICAgICAgaWYgKGdyYWRpZW50KSBjb250YWluZXJTdHlsZXMuYmFja2dyb3VuZEdyYWRpZW50ID0gZ3JhZGllbnQ7XG5cbiAgICAgIGlmIChmcmFtZS5sYXlvdXRNb2RlICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICBjb250YWluZXJTdHlsZXMucGFkZGluZ1RvcCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ1RvcCk7XG4gICAgICAgIGNvbnRhaW5lclN0eWxlcy5wYWRkaW5nQm90dG9tID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nQm90dG9tKTtcbiAgICAgICAgY29udGFpbmVyU3R5bGVzLnBhZGRpbmdMZWZ0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nTGVmdCk7XG4gICAgICAgIGNvbnRhaW5lclN0eWxlcy5wYWRkaW5nUmlnaHQgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdSaWdodCk7XG4gICAgICAgIGlmICh0eXBlb2YgZnJhbWUuaXRlbVNwYWNpbmcgPT09ICdudW1iZXInICYmIGZyYW1lLml0ZW1TcGFjaW5nID4gMCkge1xuICAgICAgICAgIGNvbnRhaW5lclN0eWxlcy5nYXAgPSB0b0Nzc1ZhbHVlKGZyYW1lLml0ZW1TcGFjaW5nKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBGbGV4IGRpcmVjdGlvbiArIGFsaWdubWVudCBmcm9tIGF1dG8tbGF5b3V0XG4gICAgICAgIE9iamVjdC5hc3NpZ24oY29udGFpbmVyU3R5bGVzLCBleHRyYWN0QXV0b0xheW91dEZsZXgoZnJhbWUpKTtcbiAgICAgIH1cblxuICAgICAgYXBwbHlSYWRpdXMoY29udGFpbmVyU3R5bGVzLCBmcmFtZSk7XG4gICAgICBhcHBseVN0cm9rZXMoY29udGFpbmVyU3R5bGVzLCBmcmFtZSk7XG5cbiAgICAgIGNvbnN0IGZ4ID0gZXh0cmFjdEVmZmVjdHMoZnJhbWUgYXMgYW55KTtcbiAgICAgIGlmIChmeC5ib3hTaGFkb3cpIGNvbnRhaW5lclN0eWxlcy5ib3hTaGFkb3cgPSBmeC5ib3hTaGFkb3c7XG4gICAgICBpZiAoZnguZmlsdGVyKSBjb250YWluZXJTdHlsZXMuZmlsdGVyID0gZnguZmlsdGVyO1xuICAgICAgaWYgKGZ4LmJhY2tkcm9wRmlsdGVyKSBjb250YWluZXJTdHlsZXMuYmFja2Ryb3BGaWx0ZXIgPSBmeC5iYWNrZHJvcEZpbHRlcjtcblxuICAgICAgY29uc3QgdHggPSBleHRyYWN0VHJhbnNmb3JtKGZyYW1lIGFzIGFueSk7XG4gICAgICBpZiAodHgudHJhbnNmb3JtKSBjb250YWluZXJTdHlsZXMudHJhbnNmb3JtID0gdHgudHJhbnNmb3JtO1xuXG4gICAgICBjb25zdCBjb250YWluZXJPcGFjaXR5ID0gZXh0cmFjdE9wYWNpdHkoZnJhbWUpO1xuICAgICAgaWYgKGNvbnRhaW5lck9wYWNpdHkgIT09IG51bGwpIGNvbnRhaW5lclN0eWxlcy5vcGFjaXR5ID0gY29udGFpbmVyT3BhY2l0eTtcblxuICAgICAgT2JqZWN0LmFzc2lnbihjb250YWluZXJTdHlsZXMsIGV4dHJhY3RGbGV4Q2hpbGRQcm9wcyhmcmFtZSBhcyBhbnkpKTtcbiAgICAgIGFwcGx5Q29tbW9uU2lnbmFscyhjb250YWluZXJTdHlsZXMsIGZyYW1lKTtcblxuICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgY29uc3Qgcm9sZSA9IGNsZWFuTmFtZSAmJiAhL14oZnJhbWV8Z3JvdXB8cmVjdGFuZ2xlfGVsbGlwc2UpXFxkKiQvLnRlc3QoY2xlYW5OYW1lKVxuICAgICAgICA/IGNsZWFuTmFtZVxuICAgICAgICA6IGBjb250YWluZXJfJHtPYmplY3Qua2V5cyhlbGVtZW50cykuZmlsdGVyKGsgPT4gay5zdGFydHNXaXRoKCdjb250YWluZXJfJykpLmxlbmd0aCArIDF9YDtcbiAgICAgIGlmICghZWxlbWVudHNbcm9sZV0pIHtcbiAgICAgICAgZWxlbWVudHNbcm9sZV0gPSBjb250YWluZXJTdHlsZXM7XG4gICAgICB9XG4gICAgICAvLyBGYWxsIHRocm91Z2ggdG8gcmVjdXJzaW9uIHNvIG5lc3RlZCBlbGVtZW50cyBzdGlsbCBnZXQgZXh0cmFjdGVkLlxuICAgIH1cblxuICAgIC8vIFJlY3Vyc2UgaW50byBjaGlsZHJlbiAoZGVwdGggbGltaXQgNiB0byBjYXB0dXJlIGRlZXBseSBuZXN0ZWQgZWxlbWVudHMpXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSAmJiBkZXB0aCA8IDYpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB3YWxrKGNoaWxkLCBkZXB0aCArIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2FsayhzZWN0aW9uTm9kZSwgMCk7XG4gIHJldHVybiBlbGVtZW50cztcbn1cblxuLyoqXG4gKiBGaW5kIHRoZSBmaXJzdCBURVhUIG5vZGUgaW4gYSBzdWJ0cmVlLlxuICovXG5mdW5jdGlvbiBmaW5kRmlyc3RUZXh0Tm9kZShub2RlOiBTY2VuZU5vZGUpOiBUZXh0Tm9kZSB8IG51bGwge1xuICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIHJldHVybiBub2RlO1xuICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICBjb25zdCBmb3VuZCA9IGZpbmRGaXJzdFRleHROb2RlKGNoaWxkKTtcbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGZvdW5kO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGxheWVyIGluZm9ybWF0aW9uIGZvciBhbGwgbWVhbmluZ2Z1bCBjaGlsZHJlbiBvZiBhIHNlY3Rpb24uXG4gKiBSZXR1cm5zIGxheWVycyBzb3J0ZWQgYnkgRmlnbWEncyBsYXllciBvcmRlciAoYmFjayB0byBmcm9udCkuXG4gKiBCb3VuZHMgYXJlIHJlbGF0aXZlIHRvIHRoZSBzZWN0aW9uJ3Mgb3JpZ2luLCBub3QgdGhlIGNhbnZhcy5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdExheWVycyhcbiAgc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSxcbiAgZWxlbWVudHM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8RWxlbWVudFN0eWxlcz4+LFxuICBpY29uTWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuKTogTGF5ZXJJbmZvW10ge1xuICBjb25zdCBsYXllcnM6IExheWVySW5mb1tdID0gW107XG4gIGNvbnN0IHNlY3Rpb25Cb3VuZHMgPSBzZWN0aW9uTm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICBpZiAoIXNlY3Rpb25Cb3VuZHMpIHJldHVybiBsYXllcnM7XG5cbiAgbGV0IGxheWVySW5kZXggPSAwO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgaWYgKCFub2RlLmFic29sdXRlQm91bmRpbmdCb3ggfHwgZGVwdGggPiA2KSByZXR1cm47XG5cbiAgICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgY29uc3QgcmVsQm91bmRzID0ge1xuICAgICAgeDogTWF0aC5yb3VuZChib3VuZHMueCAtIHNlY3Rpb25Cb3VuZHMhLngpLFxuICAgICAgeTogTWF0aC5yb3VuZChib3VuZHMueSAtIHNlY3Rpb25Cb3VuZHMhLnkpLFxuICAgICAgd2lkdGg6IE1hdGgucm91bmQoYm91bmRzLndpZHRoKSxcbiAgICAgIGhlaWdodDogTWF0aC5yb3VuZChib3VuZHMuaGVpZ2h0KSxcbiAgICB9O1xuXG4gICAgbGV0IHJvbGU6IExheWVySW5mb1sncm9sZSddIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IG5hbWUgPSAnJztcblxuICAgIGlmIChpY29uTWFwLmhhcyhub2RlLmlkKSkge1xuICAgICAgcm9sZSA9ICdpY29uJztcbiAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIG5hbWUgPSBjbGVhbk5hbWUgJiYgIS9eKHZlY3RvcnxpY29ufGZyYW1lfGdyb3VwfHJlY3RhbmdsZXxlbGxpcHNlfGJvb2xlYW4pXFxkKiQvLnRlc3QoY2xlYW5OYW1lKVxuICAgICAgICA/IGNsZWFuTmFtZVxuICAgICAgICA6IGBpY29uXyR7bGF5ZXJJbmRleH1gO1xuICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIHJvbGUgPSAndGV4dCc7XG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBuYW1lID0gY2xlYW5OYW1lICYmICEvXnRleHRcXGQqJC8udGVzdChjbGVhbk5hbWUpID8gY2xlYW5OYW1lIDogYHRleHRfJHtsYXllckluZGV4fWA7XG4gICAgfSBlbHNlIGlmIChoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpKSB7XG4gICAgICBjb25zdCBuYW1lSGludHNCZyA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdiYWNrZ3JvdW5kJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2JnJyk7XG4gICAgICBjb25zdCBzcGFuc1NlY3Rpb24gPSBib3VuZHMud2lkdGggPj0gc2VjdGlvbkJvdW5kcyEud2lkdGggKiAwLjkgJiYgYm91bmRzLmhlaWdodCA+PSBzZWN0aW9uQm91bmRzIS5oZWlnaHQgKiAwLjk7XG4gICAgICByb2xlID0gKG5hbWVIaW50c0JnIHx8IHNwYW5zU2VjdGlvbikgPyAnYmFja2dyb3VuZF9pbWFnZScgOiAnaW1hZ2UnO1xuICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgbmFtZSA9IGNsZWFuTmFtZSAmJiAhL14oaW1hZ2V8cmVjdGFuZ2xlfGZyYW1lKVxcZCokLy50ZXN0KGNsZWFuTmFtZSkgPyBjbGVhbk5hbWUgOiAocm9sZSA9PT0gJ2JhY2tncm91bmRfaW1hZ2UnID8gJ2JhY2tncm91bmRfaW1hZ2UnIDogYGltYWdlXyR7bGF5ZXJJbmRleH1gKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgKG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdidXR0b24nKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYnRuJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2N0YScpKSAmJlxuICAgICAgKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJylcbiAgICApIHtcbiAgICAgIHJvbGUgPSAnYnV0dG9uJztcbiAgICAgIG5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJykgfHwgJ2J1dHRvbic7XG4gICAgfVxuXG4gICAgaWYgKHJvbGUpIHtcbiAgICAgIGxheWVycy5wdXNoKHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgcm9sZSxcbiAgICAgICAgdHlwZTogbm9kZS50eXBlLFxuICAgICAgICBib3VuZHM6IHJlbEJvdW5kcyxcbiAgICAgICAgekluZGV4OiBsYXllckluZGV4LFxuICAgICAgICBvdmVybGFwczogW10sIC8vIGZpbGxlZCBpbiBkZXRlY3RDb21wb3NpdGlvblxuICAgICAgfSk7XG4gICAgICBsYXllckluZGV4Kys7XG4gICAgfVxuXG4gICAgLy8gUmVjdXJzZSAoc2tpcCBidXR0b24gYW5kIGljb24gaW50ZXJuYWxzIFx1MjAxNCBpY29uIGNoaWxkcmVuIGFyZSB2ZWN0b3JcbiAgICAvLyBwYXRocyB0aGF0IGFscmVhZHkgZXhwb3J0ZWQgYXMgb25lIGNvbXBvc2VkIFNWRylcbiAgICBpZiAocm9sZSAhPT0gJ2J1dHRvbicgJiYgcm9sZSAhPT0gJ2ljb24nICYmICdjaGlsZHJlbicgaW4gbm9kZSAmJiBkZXB0aCA8IDYpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB3YWxrKGNoaWxkLCBkZXB0aCArIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKCdjaGlsZHJlbicgaW4gc2VjdGlvbk5vZGUpIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChzZWN0aW9uTm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgd2FsayhjaGlsZCwgMCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGxheWVycztcbn1cblxuLyoqXG4gKiBEZXRlY3QgY29tcG9zaXRpb24gcGF0dGVybnM6IHRleHQtb3Zlci1pbWFnZSwgYmFja2dyb3VuZCBpbWFnZXMsIG92ZXJsYXkgc3RhY2tpbmcuXG4gKiBUd28gcmVjdGFuZ2xlcyBvdmVybGFwIGlmIHRoZXkgc2hhcmUgYW55IGFyZWEuXG4gKi9cbmZ1bmN0aW9uIGRldGVjdENvbXBvc2l0aW9uKGxheWVyczogTGF5ZXJJbmZvW10pOiBDb21wb3NpdGlvbkluZm8ge1xuICBjb25zdCBjb21wb3NpdGlvbjogQ29tcG9zaXRpb25JbmZvID0ge1xuICAgIGhhc1RleHRPdmVySW1hZ2U6IGZhbHNlLFxuICAgIGhhc0JhY2tncm91bmRJbWFnZTogZmFsc2UsXG4gICAgb3ZlcmxheUVsZW1lbnRzOiBbXSxcbiAgICBzdGFja2luZ09yZGVyOiBsYXllcnMubWFwKGwgPT4gbC5uYW1lKSxcbiAgfTtcblxuICBjb25zdCBiZ0ltYWdlTGF5ZXJzID0gbGF5ZXJzLmZpbHRlcihsID0+IGwucm9sZSA9PT0gJ2JhY2tncm91bmRfaW1hZ2UnKTtcbiAgY29uc3QgaW1hZ2VMYXllcnMgPSBsYXllcnMuZmlsdGVyKGwgPT4gbC5yb2xlID09PSAnaW1hZ2UnIHx8IGwucm9sZSA9PT0gJ2JhY2tncm91bmRfaW1hZ2UnKTtcbiAgY29uc3QgdGV4dExheWVycyA9IGxheWVycy5maWx0ZXIobCA9PiBsLnJvbGUgPT09ICd0ZXh0Jyk7XG4gIGNvbnN0IGJ1dHRvbkxheWVycyA9IGxheWVycy5maWx0ZXIobCA9PiBsLnJvbGUgPT09ICdidXR0b24nKTtcblxuICBpZiAoYmdJbWFnZUxheWVycy5sZW5ndGggPiAwKSB7XG4gICAgY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIENoZWNrIGZvciBib3VuZGluZyBib3ggb3ZlcmxhcHMgYmV0d2VlbiB0ZXh0L2J1dHRvbnMgYW5kIGltYWdlc1xuICBmb3IgKGNvbnN0IHRleHRMYXllciBvZiBbLi4udGV4dExheWVycywgLi4uYnV0dG9uTGF5ZXJzXSkge1xuICAgIGZvciAoY29uc3QgaW1nTGF5ZXIgb2YgaW1hZ2VMYXllcnMpIHtcbiAgICAgIGNvbnN0IHRiID0gdGV4dExheWVyLmJvdW5kcztcbiAgICAgIGNvbnN0IGliID0gaW1nTGF5ZXIuYm91bmRzO1xuXG4gICAgICAvLyBDaGVjayByZWN0YW5nbGUgb3ZlcmxhcFxuICAgICAgY29uc3Qgb3ZlcmxhcHNIb3Jpem9udGFsbHkgPSB0Yi54IDwgaWIueCArIGliLndpZHRoICYmIHRiLnggKyB0Yi53aWR0aCA+IGliLng7XG4gICAgICBjb25zdCBvdmVybGFwc1ZlcnRpY2FsbHkgPSB0Yi55IDwgaWIueSArIGliLmhlaWdodCAmJiB0Yi55ICsgdGIuaGVpZ2h0ID4gaWIueTtcblxuICAgICAgaWYgKG92ZXJsYXBzSG9yaXpvbnRhbGx5ICYmIG92ZXJsYXBzVmVydGljYWxseSkge1xuICAgICAgICAvLyBUZXh0L2J1dHRvbiBvdmVybGFwcyB3aXRoIGltYWdlXG4gICAgICAgIHRleHRMYXllci5vdmVybGFwcy5wdXNoKGltZ0xheWVyLm5hbWUpO1xuICAgICAgICBpbWdMYXllci5vdmVybGFwcy5wdXNoKHRleHRMYXllci5uYW1lKTtcblxuICAgICAgICBpZiAoIWNvbXBvc2l0aW9uLmhhc1RleHRPdmVySW1hZ2UpIHtcbiAgICAgICAgICBjb21wb3NpdGlvbi5oYXNUZXh0T3ZlckltYWdlID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVsZW1lbnRzIHdpdGggaGlnaGVyIHpJbmRleCB0aGF0IG92ZXJsYXAgaW1hZ2VzIGFyZSBvdmVybGF5c1xuICAgICAgICBpZiAodGV4dExheWVyLnpJbmRleCA+IGltZ0xheWVyLnpJbmRleCkge1xuICAgICAgICAgIGlmICghY29tcG9zaXRpb24ub3ZlcmxheUVsZW1lbnRzLmluY2x1ZGVzKHRleHRMYXllci5uYW1lKSkge1xuICAgICAgICAgICAgY29tcG9zaXRpb24ub3ZlcmxheUVsZW1lbnRzLnB1c2godGV4dExheWVyLm5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIHRoZXJlJ3MgYSBiYWNrZ3JvdW5kIGltYWdlLCBBTEwgbm9uLWJhY2tncm91bmQgZWxlbWVudHMgYXJlIG92ZXJsYXlzXG4gIGlmIChjb21wb3NpdGlvbi5oYXNCYWNrZ3JvdW5kSW1hZ2UpIHtcbiAgICBmb3IgKGNvbnN0IGxheWVyIG9mIGxheWVycykge1xuICAgICAgaWYgKGxheWVyLnJvbGUgIT09ICdiYWNrZ3JvdW5kX2ltYWdlJyAmJiAhY29tcG9zaXRpb24ub3ZlcmxheUVsZW1lbnRzLmluY2x1ZGVzKGxheWVyLm5hbWUpKSB7XG4gICAgICAgIGNvbXBvc2l0aW9uLm92ZXJsYXlFbGVtZW50cy5wdXNoKGxheWVyLm5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb21wb3NpdGlvbjtcbn1cblxuLyoqXG4gKiBEZXRlY3QgaWYgYSBzZWN0aW9uIGNvbnRhaW5zIGZvcm0tbGlrZSBlbGVtZW50cy5cbiAqIExvb2tzIGZvciBwYXR0ZXJuczogaW5wdXQgcmVjdGFuZ2xlcyAobmFycm93IGhlaWdodCBmcmFtZXMpLCBsYWJlbHMgKHNtYWxsIHRleHQgbmVhciBpbnB1dHMpLFxuICogc3VibWl0IGJ1dHRvbnMsIGFuZCBjb21tb24gZm9ybS1yZWxhdGVkIGxheWVyIG5hbWVzLlxuICovXG5mdW5jdGlvbiBkZXRlY3RGb3JtU2VjdGlvbihzZWN0aW9uTm9kZTogU2NlbmVOb2RlKTogeyBpc0Zvcm06IGJvb2xlYW47IGZpZWxkczogRm9ybUZpZWxkSW5mb1tdIH0ge1xuICBjb25zdCBmb3JtS2V5d29yZHMgPSBbJ2Zvcm0nLCAnaW5wdXQnLCAnZmllbGQnLCAnY29udGFjdCcsICdzdWJzY3JpYmUnLCAnbmV3c2xldHRlcicsICdzaWdudXAnLCAnc2lnbi11cCcsICdlbnF1aXJ5JywgJ2lucXVpcnknXTtcbiAgY29uc3QgaW5wdXRLZXl3b3JkcyA9IFsnaW5wdXQnLCAnZmllbGQnLCAndGV4dC1maWVsZCcsICd0ZXh0ZmllbGQnLCAndGV4dF9maWVsZCcsICdlbWFpbCcsICdwaG9uZScsICduYW1lJywgJ21lc3NhZ2UnLCAndGV4dGFyZWEnXTtcbiAgY29uc3Qgc3VibWl0S2V5d29yZHMgPSBbJ3N1Ym1pdCcsICdzZW5kJywgJ2J1dHRvbicsICdjdGEnLCAnYnRuJ107XG5cbiAgY29uc3Qgc2VjdGlvbk5hbWUgPSBzZWN0aW9uTm9kZS5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IG5hbWVIaW50c0Zvcm0gPSBmb3JtS2V5d29yZHMuc29tZShrdyA9PiBzZWN0aW9uTmFtZS5pbmNsdWRlcyhrdykpO1xuXG4gIGxldCBpbnB1dENvdW50ID0gMDtcbiAgbGV0IGhhc1N1Ym1pdEJ1dHRvbiA9IGZhbHNlO1xuICBjb25zdCBmaWVsZHM6IEZvcm1GaWVsZEluZm9bXSA9IFtdO1xuICBjb25zdCB0ZXh0Tm9kZXM6IHsgbmFtZTogc3RyaW5nOyB0ZXh0OiBzdHJpbmc7IHk6IG51bWJlciB9W10gPSBbXTtcbiAgY29uc3QgaW5wdXROb2RlczogeyBuYW1lOiBzdHJpbmc7IHk6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfVtdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBjb25zdCBuYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAvLyBEZXRlY3QgaW5wdXQtbGlrZSBmcmFtZXM6IG5hcnJvdyBoZWlnaHQgKDMwLTYwcHgpLCB3aWRlciB0aGFuIHRhbGwsIHdpdGggYm9yZGVyL2ZpbGxcbiAgICBpZiAoKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdSRUNUQU5HTEUnKSAmJiBub2RlLmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICAgIGNvbnN0IGIgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICBjb25zdCBpc0lucHV0U2hhcGUgPSBiLmhlaWdodCA+PSAzMCAmJiBiLmhlaWdodCA8PSA3MCAmJiBiLndpZHRoID4gYi5oZWlnaHQgKiAyO1xuICAgICAgY29uc3QgaGFzSW5wdXROYW1lID0gaW5wdXRLZXl3b3Jkcy5zb21lKGt3ID0+IG5hbWUuaW5jbHVkZXMoa3cpKTtcblxuICAgICAgaWYgKGlzSW5wdXRTaGFwZSAmJiAoaGFzSW5wdXROYW1lIHx8IG5hbWVIaW50c0Zvcm0pKSB7XG4gICAgICAgIGlucHV0Q291bnQrKztcbiAgICAgICAgaW5wdXROb2Rlcy5wdXNoKHsgbmFtZTogbm9kZS5uYW1lLCB5OiBiLnksIGhlaWdodDogYi5oZWlnaHQgfSk7XG5cbiAgICAgICAgLy8gRGV0ZWN0IGZpZWxkIHR5cGUgZnJvbSBuYW1lXG4gICAgICAgIGxldCBmaWVsZFR5cGU6IEZvcm1GaWVsZEluZm9bJ3R5cGUnXSA9ICd0ZXh0JztcbiAgICAgICAgaWYgKG5hbWUuaW5jbHVkZXMoJ2VtYWlsJykpIGZpZWxkVHlwZSA9ICdlbWFpbCc7XG4gICAgICAgIGVsc2UgaWYgKG5hbWUuaW5jbHVkZXMoJ3Bob25lJykgfHwgbmFtZS5pbmNsdWRlcygndGVsJykpIGZpZWxkVHlwZSA9ICdwaG9uZSc7XG4gICAgICAgIGVsc2UgaWYgKG5hbWUuaW5jbHVkZXMoJ3RleHRhcmVhJykgfHwgbmFtZS5pbmNsdWRlcygnbWVzc2FnZScpIHx8IChiLmhlaWdodCA+IDgwKSkgZmllbGRUeXBlID0gJ3RleHRhcmVhJztcbiAgICAgICAgZWxzZSBpZiAobmFtZS5pbmNsdWRlcygnc2VsZWN0JykgfHwgbmFtZS5pbmNsdWRlcygnZHJvcGRvd24nKSkgZmllbGRUeXBlID0gJ3NlbGVjdCc7XG4gICAgICAgIGVsc2UgaWYgKG5hbWUuaW5jbHVkZXMoJ2NoZWNrYm94JykgfHwgbmFtZS5pbmNsdWRlcygnY2hlY2snKSkgZmllbGRUeXBlID0gJ2NoZWNrYm94JztcbiAgICAgICAgZWxzZSBpZiAobmFtZS5pbmNsdWRlcygncmFkaW8nKSkgZmllbGRUeXBlID0gJ3JhZGlvJztcblxuICAgICAgICBmaWVsZHMucHVzaCh7XG4gICAgICAgICAgbGFiZWw6IG5vZGUubmFtZS5yZXBsYWNlKC9bLV9dL2csICcgJykucmVwbGFjZSgvXFxiXFx3L2csIGMgPT4gYy50b1VwcGVyQ2FzZSgpKSxcbiAgICAgICAgICB0eXBlOiBmaWVsZFR5cGUsXG4gICAgICAgICAgcmVxdWlyZWQ6IG5hbWUuaW5jbHVkZXMoJ3JlcXVpcmVkJykgfHwgbmFtZS5pbmNsdWRlcygnKicpLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gRGV0ZWN0IHN1Ym1pdCBidXR0b25zXG4gICAgICBpZiAoc3VibWl0S2V5d29yZHMuc29tZShrdyA9PiBuYW1lLmluY2x1ZGVzKGt3KSkgJiYgYi5oZWlnaHQgPj0gMzAgJiYgYi5oZWlnaHQgPD0gNzApIHtcbiAgICAgICAgaGFzU3VibWl0QnV0dG9uID0gdHJ1ZTtcbiAgICAgICAgaWYgKCFmaWVsZHMuZmluZChmID0+IGYudHlwZSA9PT0gJ3N1Ym1pdCcpKSB7XG4gICAgICAgICAgZmllbGRzLnB1c2goeyBsYWJlbDogJ1N1Ym1pdCcsIHR5cGU6ICdzdWJtaXQnLCByZXF1aXJlZDogZmFsc2UgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb2xsZWN0IHRleHQgbm9kZXMgbmVhciBpbnB1dHMgYXMgcG90ZW50aWFsIGxhYmVsc1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJyAmJiBub2RlLmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICAgIHRleHROb2Rlcy5wdXNoKHtcbiAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICB0ZXh0OiBub2RlLmNoYXJhY3RlcnMgfHwgJycsXG4gICAgICAgIHk6IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveC55LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIGlmIChjaGlsZC52aXNpYmxlICE9PSBmYWxzZSkgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2FsayhzZWN0aW9uTm9kZSk7XG5cbiAgLy8gTWF0Y2ggbGFiZWxzIHRvIGZpZWxkczogdGV4dCBub2RlIGRpcmVjdGx5IGFib3ZlIGFuIGlucHV0ICh3aXRoaW4gMzBweClcbiAgZm9yIChjb25zdCBmaWVsZCBvZiBmaWVsZHMpIHtcbiAgICBjb25zdCBmaWVsZElucHV0ID0gaW5wdXROb2Rlcy5maW5kKGlucCA9PiBpbnAubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGZpZWxkLmxhYmVsLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvIC9nLCAnXycpKSk7XG4gICAgaWYgKGZpZWxkSW5wdXQpIHtcbiAgICAgIGNvbnN0IGxhYmVsQWJvdmUgPSB0ZXh0Tm9kZXMuZmluZCh0ID0+IHQueSA8IGZpZWxkSW5wdXQueSAmJiAoZmllbGRJbnB1dC55IC0gdC55KSA8IDQwKTtcbiAgICAgIGlmIChsYWJlbEFib3ZlKSB7XG4gICAgICAgIGZpZWxkLmxhYmVsID0gbGFiZWxBYm92ZS50ZXh0LnJlcGxhY2UoJyonLCAnJykudHJpbSgpO1xuICAgICAgICBpZiAobGFiZWxBYm92ZS50ZXh0LmluY2x1ZGVzKCcqJykpIGZpZWxkLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBpc0Zvcm0gPSAoaW5wdXRDb3VudCA+PSAyICYmIGhhc1N1Ym1pdEJ1dHRvbikgfHwgKG5hbWVIaW50c0Zvcm0gJiYgaW5wdXRDb3VudCA+PSAxKTtcblxuICByZXR1cm4geyBpc0Zvcm0sIGZpZWxkczogaXNGb3JtID8gZmllbGRzIDogW10gfTtcbn1cblxuLyoqXG4gKiBQYXJzZSBhbGwgc2VjdGlvbnMgZnJvbSBhIHBhZ2UgZnJhbWUgYW5kIHByb2R1Y2UgU2VjdGlvblNwZWMgb2JqZWN0cy5cbiAqL1xuLyoqXG4gKiBFeHRyYWN0IGV2ZXJ5IFRFWFQgbm9kZSBpbiBhIHNlY3Rpb24gaW4gcmVhZGluZyBvcmRlciAodG9wLXRvLWJvdHRvbSxcbiAqIHRoZW4gbGVmdC10by1yaWdodCBmb3IgaXRlbXMgb24gdGhlIHNhbWUgcm93IHdpdGhpbiBhIDEycHggdG9sZXJhbmNlKS5cbiAqXG4gKiBUaGlzIGlzIHRoZSBjb250ZW50IHNvdXJjZSBmb3IgcGFnZS1hc3NlbWJsZXIgd2hlbiBkZXNpZ25lcnMgZG9uJ3QgbmFtZVxuICogbGF5ZXJzIGNvbnNpc3RlbnRseS4gSXQgcHJlc2VydmVzIGV2ZXJ5IHZpc2libGUgdGV4dCBmcm9tIHRoZSBGaWdtYSBkZXNpZ25cbiAqIHNvIG5vdGhpbmcgY2FuIGJlIHNpbGVudGx5IGRyb3BwZWQgZHVyaW5nIEFDRiBwb3B1bGF0aW9uLlxuICovXG5mdW5jdGlvbiBleHRyYWN0VGV4dENvbnRlbnRJbk9yZGVyKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUpOiBUZXh0Q29udGVudEVudHJ5W10ge1xuICBjb25zdCBzZWN0aW9uQm91bmRzID0gc2VjdGlvbk5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgaWYgKCFzZWN0aW9uQm91bmRzKSByZXR1cm4gW107XG5cbiAgdHlwZSBSYXdUZXh0ID0geyBub2RlOiBUZXh0Tm9kZTsgcmVsWTogbnVtYmVyOyByZWxYOiBudW1iZXI7IGZvbnRTaXplOiBudW1iZXIgfTtcbiAgY29uc3QgY29sbGVjdGVkOiBSYXdUZXh0W10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcikge1xuICAgIGlmIChub2RlLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG4gICAgaWYgKGRlcHRoID4gOCkgcmV0dXJuO1xuXG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCB0ID0gbm9kZSBhcyBUZXh0Tm9kZTtcbiAgICAgIGNvbnN0IGNoYXJzID0gdC5jaGFyYWN0ZXJzIHx8ICcnO1xuICAgICAgaWYgKCFjaGFycy50cmltKCkpIHJldHVybjsgLy8gc2tpcCBlbXB0eSB0ZXh0IG5vZGVzXG4gICAgICBjb25zdCBiYiA9IHQuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgIGlmICghYmIpIHJldHVybjtcbiAgICAgIGNvbnN0IGZzID0gdC5mb250U2l6ZSAhPT0gZmlnbWEubWl4ZWQgPyAodC5mb250U2l6ZSBhcyBudW1iZXIpIDogMTY7XG4gICAgICBjb2xsZWN0ZWQucHVzaCh7XG4gICAgICAgIG5vZGU6IHQsXG4gICAgICAgIHJlbFk6IGJiLnkgLSBzZWN0aW9uQm91bmRzIS55LFxuICAgICAgICByZWxYOiBiYi54IC0gc2VjdGlvbkJvdW5kcyEueCxcbiAgICAgICAgZm9udFNpemU6IGZzLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47IC8vIGRvbid0IHJlY3Vyc2UgaW50byBURVhUXG4gICAgfVxuXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQsIGRlcHRoICsgMSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKCdjaGlsZHJlbicgaW4gc2VjdGlvbk5vZGUpIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChzZWN0aW9uTm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICB3YWxrKGNoaWxkLCAwKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZWFkaW5nIG9yZGVyOiBzb3J0IGJ5IFkgKHJvd3MpLCB0aGVuIGJ5IFggd2l0aGluIHNhbWUgcm93ICgxMnB4IHRvbGVyYW5jZSkuXG4gIGNvbGxlY3RlZC5zb3J0KChhLCBiKSA9PiB7XG4gICAgaWYgKE1hdGguYWJzKGEucmVsWSAtIGIucmVsWSkgPCAxMikgcmV0dXJuIGEucmVsWCAtIGIucmVsWDtcbiAgICByZXR1cm4gYS5yZWxZIC0gYi5yZWxZO1xuICB9KTtcblxuICAvLyBSb2xlIGFzc2lnbm1lbnQgXHUyMDE0IHRvcC1tb3N0IGxhcmdlc3QgdGV4dCBpcyAnaGVhZGluZycsIHNlY29uZCBpcyAnc3ViaGVhZGluZycsXG4gIC8vIHNtYWxsIHNob3J0IHRleHRzIG5lYXIgYnV0dG9ucyBhcmUgJ2J1dHRvbl90ZXh0JywgcmVzdCBhcmUgJ2JvZHknIG9yICd0ZXh0X04nLlxuICBsZXQgaGVhZGluZ0Fzc2lnbmVkID0gZmFsc2U7XG4gIGxldCBzdWJoZWFkaW5nQXNzaWduZWQgPSBmYWxzZTtcblxuICByZXR1cm4gY29sbGVjdGVkLm1hcCgoaXRlbSwgaWR4KSA9PiB7XG4gICAgY29uc3QgdGV4dCA9IGl0ZW0ubm9kZS5jaGFyYWN0ZXJzIHx8ICcnO1xuICAgIGNvbnN0IGNsZWFuTmFtZSA9IGl0ZW0ubm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgIGNvbnN0IG5hbWVIaW50ID0gY2xlYW5OYW1lIHx8ICcnO1xuXG4gICAgbGV0IHJvbGU6IHN0cmluZztcbiAgICBpZiAobmFtZUhpbnQuaW5jbHVkZXMoJ2J1dHRvbicpIHx8IG5hbWVIaW50LmluY2x1ZGVzKCdjdGEnKSB8fCBuYW1lSGludC5pbmNsdWRlcygnYnRuJykpIHtcbiAgICAgIHJvbGUgPSAnYnV0dG9uX3RleHQnO1xuICAgIH0gZWxzZSBpZiAoIWhlYWRpbmdBc3NpZ25lZCAmJiBpdGVtLmZvbnRTaXplID49IDI4KSB7XG4gICAgICByb2xlID0gJ2hlYWRpbmcnO1xuICAgICAgaGVhZGluZ0Fzc2lnbmVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKCFzdWJoZWFkaW5nQXNzaWduZWQgJiYgaXRlbS5mb250U2l6ZSA+PSAxOCAmJiBpdGVtLmZvbnRTaXplIDwgMjgpIHtcbiAgICAgIHJvbGUgPSAnc3ViaGVhZGluZyc7XG4gICAgICBzdWJoZWFkaW5nQXNzaWduZWQgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAoaXRlbS5mb250U2l6ZSA8PSAxMyB8fCAobmFtZUhpbnQuaW5jbHVkZXMoJ2NhcHRpb24nKSB8fCBuYW1lSGludC5pbmNsdWRlcygnZXllYnJvdycpIHx8IG5hbWVIaW50LmluY2x1ZGVzKCd0YWcnKSkpIHtcbiAgICAgIHJvbGUgPSAnY2FwdGlvbic7XG4gICAgfSBlbHNlIGlmICh0ZXh0Lmxlbmd0aCA8IDMwICYmIGl0ZW0uZm9udFNpemUgPD0gMTYpIHtcbiAgICAgIC8vIFNob3J0LCBzbWFsbCBcdTIwMTQgbGlrZWx5IGEgbGluayBvciBsYWJlbFxuICAgICAgcm9sZSA9ICdsYWJlbCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvbGUgPSBgYm9keV8ke2lkeH1gO1xuICAgIH1cblxuICAgIGNvbnN0IGJiID0gaXRlbS5ub2RlLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIHJldHVybiB7XG4gICAgICBpbmRleDogaWR4LFxuICAgICAgdGV4dCxcbiAgICAgIHJvbGUsXG4gICAgICBsYXllck5hbWU6IGl0ZW0ubm9kZS5uYW1lLFxuICAgICAgZm9udFNpemU6IE1hdGgucm91bmQoaXRlbS5mb250U2l6ZSksXG4gICAgICBib3VuZHM6IHtcbiAgICAgICAgeDogTWF0aC5yb3VuZChpdGVtLnJlbFgpLFxuICAgICAgICB5OiBNYXRoLnJvdW5kKGl0ZW0ucmVsWSksXG4gICAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKGJiLndpZHRoKSxcbiAgICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKGJiLmhlaWdodCksXG4gICAgICB9LFxuICAgIH07XG4gIH0pO1xufVxuXG4vKipcbiAqIFBhcnNlIHNlY3Rpb25zIGZyb20gYSBwYWdlIGZyYW1lLlxuICpcbiAqIEBwYXJhbSBwYWdlRnJhbWUgVGhlIHRvcC1sZXZlbCBwYWdlIGZyYW1lIHRvIHdhbGsuXG4gKiBAcGFyYW0gaWNvbk1hcCBNYXA8bm9kZUlkLCBzdmdGaWxlbmFtZT4gZnJvbSBpY29uLWRldGVjdG9yLiBTZWN0aW9uXG4gKiAgICAgICAgICAgICAgICBlbGVtZW50cyB0aGF0IG1hdGNoIGFuIGljb24gcm9vdCByZWNlaXZlIGFuIGBpY29uRmlsZWBcbiAqICAgICAgICAgICAgICAgIHBvaW50aW5nIGF0IHRoZSBzYW1lIGZpbGVuYW1lIGltYWdlLWV4cG9ydGVyIHdyaXRlcy5cbiAqIEBwYXJhbSBnbG9iYWxOYW1lcyBPcHRpb25hbCBzZXQgb2Ygbm9ybWFsaXplZCBzZWN0aW9uIG5hbWVzIHRoYXQgYXBwZWFyIG9uXG4gKiAgICAgICAgICAgICAgICAgICAgXHUyMjY1MiBzZWxlY3RlZCBwYWdlcy4gV2hlbiBwcm92aWRlZCwgbWF0Y2hpbmcgc2VjdGlvbnMgYXJlXG4gKiAgICAgICAgICAgICAgICAgICAgbWFya2VkIGBpc0dsb2JhbDogdHJ1ZWAgc28gdGhlIGFnZW50IGNhbiBwcm9tb3RlIHRoZW0gdG9cbiAqICAgICAgICAgICAgICAgICAgICBzaGFyZWQgV1AgdGhlbWUgcGFydHMgaW5zdGVhZCBvZiBkdXBsaWNhdGluZyBwZXItcGFnZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VjdGlvbnMoXG4gIHBhZ2VGcmFtZTogRnJhbWVOb2RlLFxuICBpY29uTWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuICBpbWFnZU1hcDogTWFwPHN0cmluZywgc3RyaW5nPixcbiAgZ2xvYmFsTmFtZXM/OiBTZXQ8c3RyaW5nPixcbik6IFJlY29yZDxzdHJpbmcsIFNlY3Rpb25TcGVjPiB7XG4gIGNvbnN0IHNlY3Rpb25Ob2RlcyA9IGlkZW50aWZ5U2VjdGlvbnMocGFnZUZyYW1lKTtcbiAgY29uc3Qgc3BlY3M6IFJlY29yZDxzdHJpbmcsIFNlY3Rpb25TcGVjPiA9IHt9O1xuXG4gIGxldCBwcmV2Qm90dG9tID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlY3Rpb25Ob2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGUgPSBzZWN0aW9uTm9kZXNbaV07XG4gICAgY29uc3QgYm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgIGlmICghYm91bmRzKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGxheW91dE5hbWUgPSB0b0xheW91dE5hbWUobm9kZS5uYW1lKTtcbiAgICBjb25zdCBpc0ZyYW1lID0gbm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnO1xuICAgIGNvbnN0IGZyYW1lID0gaXNGcmFtZSA/IChub2RlIGFzIEZyYW1lTm9kZSkgOiBudWxsO1xuXG4gICAgLy8gRGV0ZXJtaW5lIHNwYWNpbmcgc291cmNlIGFuZCBleHRyYWN0IHNwYWNpbmdcbiAgICBjb25zdCBoYXNBdXRvTGF5b3V0ID0gZnJhbWU/LmxheW91dE1vZGUgJiYgZnJhbWUubGF5b3V0TW9kZSAhPT0gJ05PTkUnO1xuICAgIGxldCBzcGFjaW5nU291cmNlOiAnYXV0by1sYXlvdXQnIHwgJ2Fic29sdXRlLWNvb3JkaW5hdGVzJztcbiAgICBsZXQgc2VjdGlvblN0eWxlczogUGFydGlhbDxTZWN0aW9uU3R5bGVzPjtcbiAgICBsZXQgaXRlbVNwYWNpbmc6IHN0cmluZyB8IG51bGw7XG5cbiAgICBpZiAoaGFzQXV0b0xheW91dCAmJiBmcmFtZSkge1xuICAgICAgY29uc3Qgc3BhY2luZyA9IGV4dHJhY3RBdXRvTGF5b3V0U3BhY2luZyhmcmFtZSk7XG4gICAgICBzcGFjaW5nU291cmNlID0gc3BhY2luZy5zcGFjaW5nU291cmNlO1xuICAgICAgc2VjdGlvblN0eWxlcyA9IHNwYWNpbmcuc2VjdGlvblN0eWxlcztcbiAgICAgIGl0ZW1TcGFjaW5nID0gc3BhY2luZy5pdGVtU3BhY2luZztcbiAgICB9IGVsc2UgaWYgKGZyYW1lKSB7XG4gICAgICBjb25zdCBzcGFjaW5nID0gZXh0cmFjdEFic29sdXRlU3BhY2luZyhmcmFtZSk7XG4gICAgICBzcGFjaW5nU291cmNlID0gc3BhY2luZy5zcGFjaW5nU291cmNlO1xuICAgICAgc2VjdGlvblN0eWxlcyA9IHNwYWNpbmcuc2VjdGlvblN0eWxlcztcbiAgICAgIGl0ZW1TcGFjaW5nID0gc3BhY2luZy5pdGVtU3BhY2luZztcbiAgICB9IGVsc2Uge1xuICAgICAgc3BhY2luZ1NvdXJjZSA9ICdhYnNvbHV0ZS1jb29yZGluYXRlcyc7XG4gICAgICBzZWN0aW9uU3R5bGVzID0ge307XG4gICAgICBpdGVtU3BhY2luZyA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gQmFzZSBzZWN0aW9uIHN0eWxlcyAoYmFja2dyb3VuZCwgZ3JhZGllbnQsIGV0Yy4pXG4gICAgY29uc3QgYmFzZVN0eWxlcyA9IGV4dHJhY3RTZWN0aW9uU3R5bGVzKG5vZGUsIGltYWdlTWFwKTtcbiAgICBjb25zdCBtZXJnZWRTdHlsZXM6IFNlY3Rpb25TdHlsZXMgPSB7XG4gICAgICAuLi5iYXNlU3R5bGVzLFxuICAgICAgLi4uc2VjdGlvblN0eWxlcyxcbiAgICB9O1xuXG4gICAgLy8gRWxlbWVudHNcbiAgICBjb25zdCBlbGVtZW50cyA9IGV4dHJhY3RFbGVtZW50cyhub2RlLCBpY29uTWFwLCBpbWFnZU1hcCk7XG5cbiAgICAvLyBHcmlkIGRldGVjdGlvblxuICAgIGNvbnN0IGdyaWQgPSBmcmFtZSA/IGRldGVjdEdyaWQoZnJhbWUpIDoge1xuICAgICAgbGF5b3V0TW9kZTogJ2Fic29sdXRlJyBhcyBjb25zdCxcbiAgICAgIGNvbHVtbnM6IDEsXG4gICAgICBnYXA6IGl0ZW1TcGFjaW5nLFxuICAgICAgcm93R2FwOiBudWxsLFxuICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgaXRlbU1pbldpZHRoOiBudWxsLFxuICAgIH07XG5cbiAgICAvLyBFbnN1cmUgZ3JpZCBnYXAgaXMgc2V0IGZyb20gaXRlbVNwYWNpbmcgaWYgbm90IGFscmVhZHlcbiAgICBpZiAoIWdyaWQuZ2FwICYmIGl0ZW1TcGFjaW5nKSB7XG4gICAgICBncmlkLmdhcCA9IGl0ZW1TcGFjaW5nO1xuICAgIH1cblxuICAgIC8vIE92ZXJsYXAgZGV0ZWN0aW9uXG4gICAgbGV0IG92ZXJsYXA6IE92ZXJsYXBJbmZvIHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKGkgPiAwKSB7XG4gICAgICBjb25zdCBvdmVybGFwUHggPSBwcmV2Qm90dG9tIC0gYm91bmRzLnk7XG4gICAgICBpZiAob3ZlcmxhcFB4ID4gMCkge1xuICAgICAgICBvdmVybGFwID0ge1xuICAgICAgICAgIHdpdGhTZWN0aW9uOiBzZWN0aW9uTm9kZXNbaSAtIDFdLm5hbWUsXG4gICAgICAgICAgcGl4ZWxzOiBNYXRoLnJvdW5kKG92ZXJsYXBQeCksXG4gICAgICAgICAgY3NzTWFyZ2luVG9wOiBgLSR7TWF0aC5yb3VuZChvdmVybGFwUHgpfXB4YCxcbiAgICAgICAgICByZXF1aXJlc1pJbmRleDogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbnRlcmFjdGlvbnNcbiAgICBjb25zdCBpbnRlcmFjdGlvbnMgPSBleHRyYWN0SW50ZXJhY3Rpb25zKG5vZGUpO1xuXG4gICAgLy8gTGF5ZXIgY29tcG9zaXRpb24gYW5hbHlzaXNcbiAgICBjb25zdCBsYXllcnMgPSBleHRyYWN0TGF5ZXJzKG5vZGUsIGVsZW1lbnRzLCBpY29uTWFwKTtcbiAgICBjb25zdCBjb21wb3NpdGlvbiA9IGRldGVjdENvbXBvc2l0aW9uKGxheWVycyk7XG5cbiAgICAvLyBFbnJpY2ggZWxlbWVudHMgd2l0aCBwb3NpdGlvbiBkYXRhIGZyb20gY29tcG9zaXRpb25cbiAgICBpZiAoY29tcG9zaXRpb24uaGFzVGV4dE92ZXJJbWFnZSB8fCBjb21wb3NpdGlvbi5oYXNCYWNrZ3JvdW5kSW1hZ2UpIHtcbiAgICAgIC8vIFNlY3Rpb24gbmVlZHMgcG9zaXRpb246IHJlbGF0aXZlIGZvciBvdmVybGF5IGNoaWxkcmVuXG4gICAgICBtZXJnZWRTdHlsZXMub3ZlcmZsb3cgPSBtZXJnZWRTdHlsZXMub3ZlcmZsb3cgfHwgJ2hpZGRlbic7XG5cbiAgICAgIGZvciAoY29uc3QgW2VsZW1OYW1lLCBlbGVtU3R5bGVzXSBvZiBPYmplY3QuZW50cmllcyhlbGVtZW50cykpIHtcbiAgICAgICAgaWYgKGNvbXBvc2l0aW9uLm92ZXJsYXlFbGVtZW50cy5pbmNsdWRlcyhlbGVtTmFtZSkgfHwgY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlKSB7XG4gICAgICAgICAgLy8gRmluZCBtYXRjaGluZyBsYXllciBmb3IgcG9zaXRpb24gZGF0YVxuICAgICAgICAgIGNvbnN0IGxheWVyID0gbGF5ZXJzLmZpbmQobCA9PiBsLm5hbWUgPT09IGVsZW1OYW1lKTtcbiAgICAgICAgICBpZiAobGF5ZXIgJiYgbGF5ZXIucm9sZSAhPT0gJ2JhY2tncm91bmRfaW1hZ2UnKSB7XG4gICAgICAgICAgICBlbGVtU3R5bGVzLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgIGVsZW1TdHlsZXMuekluZGV4ID0gbGF5ZXIuekluZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZvcm0gZGV0ZWN0aW9uXG4gICAgY29uc3QgZm9ybVJlc3VsdCA9IGRldGVjdEZvcm1TZWN0aW9uKG5vZGUpO1xuXG4gICAgLy8gT3JkZXJlZCB0ZXh0IGNvbnRlbnQgXHUyMDE0IGV2ZXJ5IHRleHQgaW4gcmVhZGluZyBvcmRlciAoZm9yIHBhZ2UtYXNzZW1ibGVyIG1hcHBpbmcpXG4gICAgY29uc3QgdGV4dENvbnRlbnRJbk9yZGVyID0gZXh0cmFjdFRleHRDb250ZW50SW5PcmRlcihub2RlKTtcblxuICAgIC8vIFBhdHRlcm4gZGV0ZWN0aW9uIChjYXJvdXNlbCAvIGFjY29yZGlvbiAvIHRhYnMgLyBtb2RhbClcbiAgICBsZXQgY29tcG9uZW50UGF0dGVybnM6IFJldHVyblR5cGU8dHlwZW9mIGRldGVjdENvbXBvbmVudFBhdHRlcm5zPiB8IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcCA9IGRldGVjdENvbXBvbmVudFBhdHRlcm5zKG5vZGUpO1xuICAgICAgaWYgKHAubGVuZ3RoID4gMCkgY29tcG9uZW50UGF0dGVybnMgPSBwO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignZGV0ZWN0Q29tcG9uZW50UGF0dGVybnMgZmFpbGVkIGZvciBzZWN0aW9uJywgbm9kZS5uYW1lLCBlKTtcbiAgICB9XG5cbiAgICAvLyBSZXBlYXRlciBkZXRlY3Rpb24gKGNhcmRzIC8gZmVhdHVyZXMgLyBwcmljaW5nIC8gZXRjLilcbiAgICBsZXQgcmVwZWF0ZXJzOiBSZXR1cm5UeXBlPHR5cGVvZiBkZXRlY3RSZXBlYXRlcnM+IHwgdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByID0gZGV0ZWN0UmVwZWF0ZXJzKG5vZGUpO1xuICAgICAgaWYgKE9iamVjdC5rZXlzKHIpLmxlbmd0aCA+IDApIHJlcGVhdGVycyA9IHI7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdkZXRlY3RSZXBlYXRlcnMgZmFpbGVkIGZvciBzZWN0aW9uJywgbm9kZS5uYW1lLCBlKTtcbiAgICB9XG5cbiAgICAvLyBHbG9iYWwgZGV0ZWN0aW9uIChjcm9zcy1wYWdlKVxuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVTZWN0aW9uTmFtZShub2RlLm5hbWUpO1xuICAgIGNvbnN0IGlzR2xvYmFsID0gZ2xvYmFsTmFtZXMgPyBnbG9iYWxOYW1lcy5oYXMobm9ybWFsaXplZCkgOiBmYWxzZTtcbiAgICBjb25zdCBnbG9iYWxSb2xlID0gaXNHbG9iYWxcbiAgICAgID8gY2xhc3NpZnlHbG9iYWxSb2xlKGksIHNlY3Rpb25Ob2Rlcy5sZW5ndGgsIE1hdGgucm91bmQoYm91bmRzLmhlaWdodCkpXG4gICAgICA6IG51bGw7XG5cbiAgICAvLyBOYXZpZ2F0aW9uIChvbmx5IHdvcnRoIGNvbXB1dGluZyBmb3IgaGVhZGVyL2Zvb3RlciBjYW5kaWRhdGVzKVxuICAgIGxldCBuYXZpZ2F0aW9uOiBOb25OdWxsYWJsZTxSZXR1cm5UeXBlPHR5cGVvZiBkZXRlY3ROYXZpZ2F0aW9uPj4gfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG5hbWUgPSAobm9kZS5uYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKGlzR2xvYmFsIHx8IC9cXGIoaGVhZGVyfGZvb3RlcnxuYXZ8bmF2YmFyfG5hdmlnYXRpb24pXFxiLy50ZXN0KG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IG5hdiA9IGRldGVjdE5hdmlnYXRpb24obm9kZSk7XG4gICAgICAgIGlmIChuYXYpIG5hdmlnYXRpb24gPSBuYXY7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdkZXRlY3ROYXZpZ2F0aW9uIGZhaWxlZCBmb3Igc2VjdGlvbicsIG5vZGUubmFtZSwgZSk7XG4gICAgfVxuXG4gICAgLy8gU2VjdGlvbiBzZW1hbnRpYyByb2xlIGluZmVyZW5jZVxuICAgIGxldCBzZWN0aW9uVHlwZTogUmV0dXJuVHlwZTx0eXBlb2YgaW5mZXJTZWN0aW9uVHlwZT4gfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgc2VjdGlvblR5cGUgPSBpbmZlclNlY3Rpb25UeXBlKHtcbiAgICAgICAgc2VjdGlvbkluZGV4OiBpLFxuICAgICAgICB0b3RhbFNlY3Rpb25zOiBzZWN0aW9uTm9kZXMubGVuZ3RoLFxuICAgICAgICBpc0Zvcm1TZWN0aW9uOiBmb3JtUmVzdWx0LmlzRm9ybSxcbiAgICAgICAgcGF0dGVybnM6IGNvbXBvbmVudFBhdHRlcm5zIHx8IFtdLFxuICAgICAgICByZXBlYXRlcnM6IHJlcGVhdGVycyB8fCB7fSxcbiAgICAgICAgZWxlbWVudHMsXG4gICAgICAgIHRleHRDb250ZW50SW5PcmRlcixcbiAgICAgICAgbGF5ZXJOYW1lOiBub2RlLm5hbWUgfHwgJycsXG4gICAgICAgIHNlY3Rpb25IZWlnaHQ6IE1hdGgucm91bmQoYm91bmRzLmhlaWdodCksXG4gICAgICAgIGlzR2xvYmFsLFxuICAgICAgICBnbG9iYWxSb2xlLFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdpbmZlclNlY3Rpb25UeXBlIGZhaWxlZCBmb3Igc2VjdGlvbicsIG5vZGUubmFtZSwgZSk7XG4gICAgfVxuXG4gICAgc3BlY3NbbGF5b3V0TmFtZV0gPSB7XG4gICAgICBzcGFjaW5nU291cmNlLFxuICAgICAgZmlnbWFOb2RlSWQ6IG5vZGUuaWQsXG4gICAgICBzY3JlZW5zaG90RmlsZTogYHNjcmVlbnNob3RzLyR7c2NyZWVuc2hvdEZpbGVuYW1lKG5vZGUubmFtZSl9YCxcbiAgICAgIHNlY3Rpb246IG1lcmdlZFN0eWxlcyxcbiAgICAgIGVsZW1lbnRzLFxuICAgICAgZ3JpZCxcbiAgICAgIGludGVyYWN0aW9uczogaW50ZXJhY3Rpb25zLmxlbmd0aCA+IDAgPyBpbnRlcmFjdGlvbnMgOiB1bmRlZmluZWQsXG4gICAgICBvdmVybGFwLFxuICAgICAgbGF5ZXJzOiBsYXllcnMubGVuZ3RoID4gMCA/IGxheWVycyA6IHVuZGVmaW5lZCxcbiAgICAgIGNvbXBvc2l0aW9uOiAoY29tcG9zaXRpb24uaGFzVGV4dE92ZXJJbWFnZSB8fCBjb21wb3NpdGlvbi5oYXNCYWNrZ3JvdW5kSW1hZ2UpID8gY29tcG9zaXRpb24gOiB1bmRlZmluZWQsXG4gICAgICBpc0Zvcm1TZWN0aW9uOiBmb3JtUmVzdWx0LmlzRm9ybSB8fCB1bmRlZmluZWQsXG4gICAgICBmb3JtRmllbGRzOiBmb3JtUmVzdWx0LmZpZWxkcy5sZW5ndGggPiAwID8gZm9ybVJlc3VsdC5maWVsZHMgOiB1bmRlZmluZWQsXG4gICAgICB0ZXh0Q29udGVudEluT3JkZXI6IHRleHRDb250ZW50SW5PcmRlci5sZW5ndGggPiAwID8gdGV4dENvbnRlbnRJbk9yZGVyIDogdW5kZWZpbmVkLFxuICAgICAgY29tcG9uZW50UGF0dGVybnMsXG4gICAgICBpc0dsb2JhbDogaXNHbG9iYWwgfHwgdW5kZWZpbmVkLFxuICAgICAgZ2xvYmFsUm9sZTogaXNHbG9iYWwgPyBnbG9iYWxSb2xlIDogdW5kZWZpbmVkLFxuICAgICAgc2VjdGlvblR5cGU6IHNlY3Rpb25UeXBlPy50eXBlLFxuICAgICAgc2VjdGlvblR5cGVDb25maWRlbmNlOiBzZWN0aW9uVHlwZT8uY29uZmlkZW5jZSxcbiAgICAgIHJlcGVhdGVycyxcbiAgICAgIG5hdmlnYXRpb24sXG4gICAgfTtcblxuICAgIHByZXZCb3R0b20gPSBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQ7XG4gIH1cblxuICByZXR1cm4gc3BlY3M7XG59XG4iLCAiaW1wb3J0IHsgSW1hZ2VFeHBvcnRUYXNrLCBJbWFnZU1hcCwgSW1hZ2VNYXBFbnRyeSwgRmFpbGVkRXhwb3J0IH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBzbHVnaWZ5LCBzY3JlZW5zaG90RmlsZW5hbWUgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGhhc0ltYWdlRmlsbCB9IGZyb20gJy4vY29sb3InO1xuXG5jb25zdCBCQVRDSF9TSVpFID0gMTA7XG5cbi8qKlxuICogSWRlbnRpZnkgc2VjdGlvbi1sZXZlbCBjaGlsZHJlbiwgbWF0Y2hpbmcgdGhlIHNhbWUgbG9naWMgYXMgc2VjdGlvbi1wYXJzZXIudHMuXG4gKiBJZiB0aGUgZnJhbWUgaGFzIGEgc2luZ2xlIHdyYXBwZXIgY2hpbGQsIGRyaWxsIG9uZSBsZXZlbCBkZWVwZXIuXG4gKi9cbmZ1bmN0aW9uIGlkZW50aWZ5U2VjdGlvbk5vZGVzKHBhZ2VGcmFtZTogRnJhbWVOb2RlKTogU2NlbmVOb2RlW10ge1xuICBsZXQgY2FuZGlkYXRlcyA9IHBhZ2VGcmFtZS5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJykgJiZcbiAgICBjLmFic29sdXRlQm91bmRpbmdCb3ggJiZcbiAgICBjLmFic29sdXRlQm91bmRpbmdCb3guaGVpZ2h0ID4gNTBcbiAgKTtcblxuICAvLyBJZiB0aGVyZSdzIGEgc2luZ2xlIGNvbnRhaW5lciBjaGlsZCwgZHJpbGwgb25lIGxldmVsIGRlZXBlciAobWF0Y2hlcyBzZWN0aW9uLXBhcnNlci50cylcbiAgaWYgKGNhbmRpZGF0ZXMubGVuZ3RoID09PSAxICYmICdjaGlsZHJlbicgaW4gY2FuZGlkYXRlc1swXSkge1xuICAgIGNvbnN0IHdyYXBwZXIgPSBjYW5kaWRhdGVzWzBdIGFzIEZyYW1lTm9kZTtcbiAgICBjb25zdCBpbm5lckNhbmRpZGF0ZXMgPSB3cmFwcGVyLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJykgJiZcbiAgICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveCAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94LmhlaWdodCA+IDUwXG4gICAgKTtcbiAgICBpZiAoaW5uZXJDYW5kaWRhdGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNhbmRpZGF0ZXMgPSBpbm5lckNhbmRpZGF0ZXM7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFsuLi5jYW5kaWRhdGVzXS5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgTWFwPG5vZGVJZCwgZmlsZW5hbWU+IGZvciBldmVyeSBub2RlIHdpdGggYW4gSU1BR0UgZmlsbCBpbiB0aGUgcGFnZS5cbiAqXG4gKiBEZWR1cCBpcyBieSBGaWdtYSdzIGltYWdlSGFzaCBzbyB0d28gZGlzdGluY3QgcGhvdG9zIHRoYXQgaGFwcGVuIHRvIHNoYXJlXG4gKiBhIGxheWVyIG5hbWUgKFwiSW1hZ2VcIiwgXCJSZWN0YW5nbGUgMTJcIikgZWFjaCBnZXQgdGhlaXIgb3duIGZpbGUsIHdoaWxlXG4gKiBtdWx0aXBsZSB1c2FnZXMgb2YgdGhlIHNhbWUgYml0bWFwIGNvbGxhcHNlIHRvIGEgc2luZ2xlIGV4cG9ydC5cbiAqXG4gKiBGaWxlbmFtZSBjb2xsaXNpb25zIChkaWZmZXJlbnQgYml0bWFwcyBzbHVnaWZ5aW5nIHRvIHRoZSBzYW1lIGJhc2UgbmFtZSlcbiAqIGFyZSByZXNvbHZlZCB3aXRoIGEgbnVtZXJpYyBzdWZmaXguIEJvdGggaW1hZ2UtZXhwb3J0ZXIgYW5kIHNlY3Rpb24tcGFyc2VyXG4gKiBjb25zdW1lIHRoaXMgbWFwIHNvIHRoZWlyIHJlZmVyZW5jZXMgc3RheSBpbiBsb2Nrc3RlcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkSW1hZ2VGaWxlbmFtZU1hcChcbiAgcGFnZUZyYW1lOiBTY2VuZU5vZGUsXG4gIGljb25Sb290SWRzOiBTZXQ8c3RyaW5nPixcbik6IE1hcDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCByZXN1bHQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBjb25zdCBoYXNoVG9GaWxlbmFtZSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IHVzZWRGaWxlbmFtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IGltZ05vZGUgb2YgZmluZEltYWdlTm9kZXMocGFnZUZyYW1lKSkge1xuICAgIGlmIChpY29uUm9vdElkcy5oYXMoaW1nTm9kZS5pZCkpIGNvbnRpbnVlO1xuICAgIGlmIChpc0luc2lkZUljb25Sb290KGltZ05vZGUsIGljb25Sb290SWRzKSkgY29udGludWU7XG5cbiAgICBjb25zdCBpbWFnZUhhc2ggPSBnZXRGaXJzdEltYWdlSGFzaChpbWdOb2RlKTtcbiAgICBsZXQgZmlsZW5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgIGlmIChpbWFnZUhhc2ggJiYgaGFzaFRvRmlsZW5hbWUuaGFzKGltYWdlSGFzaCkpIHtcbiAgICAgIGZpbGVuYW1lID0gaGFzaFRvRmlsZW5hbWUuZ2V0KGltYWdlSGFzaCkhO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBiYXNlU2x1ZyA9IHNsdWdpZnkoaW1nTm9kZS5uYW1lKSB8fCAnaW1hZ2UnO1xuICAgICAgZmlsZW5hbWUgPSBgJHtiYXNlU2x1Z30ucG5nYDtcbiAgICAgIGxldCBpID0gMjtcbiAgICAgIHdoaWxlICh1c2VkRmlsZW5hbWVzLmhhcyhmaWxlbmFtZSkpIHtcbiAgICAgICAgZmlsZW5hbWUgPSBgJHtiYXNlU2x1Z30tJHtpKyt9LnBuZ2A7XG4gICAgICB9XG4gICAgICB1c2VkRmlsZW5hbWVzLmFkZChmaWxlbmFtZSk7XG4gICAgICBpZiAoaW1hZ2VIYXNoKSBoYXNoVG9GaWxlbmFtZS5zZXQoaW1hZ2VIYXNoLCBmaWxlbmFtZSk7XG4gICAgfVxuXG4gICAgcmVzdWx0LnNldChpbWdOb2RlLmlkLCBmaWxlbmFtZSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBCdWlsZCB0aGUgbGlzdCBvZiBhbGwgZXhwb3J0IHRhc2tzIGZvciBhIHBhZ2UgZnJhbWUuXG4gKiBJbmNsdWRlczogZnVsbC1wYWdlIGNvbXBvc2l0ZSBzY3JlZW5zaG90LCBwZXItc2VjdGlvbiBzY3JlZW5zaG90cyxcbiAqIGFuZCBpbWFnZSBhc3NldHMgKFBORyBmb3IgcGhvdG9zLCBTVkcgZm9yIHZlY3RvciBpY29ucykuXG4gKlxuICogYGljb25NYXBgIChmcm9tIGljb24tZGV0ZWN0b3IpIGRlY2lkZXMgd2hpY2ggbm9kZXMgYmVjb21lIFNWRyBpY29ucyBhbmRcbiAqIHdoYXQgZmlsZW5hbWUgZWFjaCBvbmUgZ2V0cy4gYGltYWdlTWFwYCBkb2VzIHRoZSBzYW1lIGZvciByYXN0ZXIgSU1BR0VcbiAqIGZpbGxzLiBCb3RoIHRoaXMgZnVuY3Rpb24gYW5kIHNlY3Rpb24tcGFyc2VyIGNvbnN1bWUgdGhlIHNhbWUgbWFwcyBzb1xuICogdGhlIEpTT04gc3BlY3MgcmVmZXJlbmNlIGV4YWN0bHkgdGhlIGZpbGVzIHdlIGV4cG9ydC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRXhwb3J0VGFza3MoXG4gIHBhZ2VGcmFtZTogRnJhbWVOb2RlLFxuICBwYWdlU2x1Zzogc3RyaW5nLFxuICBpY29uTWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuICBpbWFnZU1hcDogTWFwPHN0cmluZywgc3RyaW5nPixcbik6IEltYWdlRXhwb3J0VGFza1tdIHtcbiAgY29uc3QgdGFza3M6IEltYWdlRXhwb3J0VGFza1tdID0gW107XG4gIGNvbnN0IHBhZ2VQYXRoID0gYHBhZ2VzLyR7cGFnZVNsdWd9YDtcblxuICAvLyBGdWxsLXBhZ2UgY29tcG9zaXRlIHNjcmVlbnNob3QgXHUyMDE0IGNyaXRpY2FsIGZvciBhZ2VudCdzIGZ1bGwtcGFnZSB2aXN1YWwgcmV2aWV3LlxuICB0YXNrcy5wdXNoKHtcbiAgICBub2RlSWQ6IHBhZ2VGcmFtZS5pZCxcbiAgICBub2RlTmFtZTogcGFnZUZyYW1lLm5hbWUsXG4gICAgdHlwZTogJ2Z1bGwtcGFnZScsXG4gICAgZmlsZW5hbWU6ICdfZnVsbC1wYWdlLnBuZycsXG4gICAgcGFnZVBhdGgsXG4gICAgZm9ybWF0OiAnUE5HJyxcbiAgICBzY2FsZTogMSxcbiAgfSk7XG5cbiAgLy8gUGVyLXNlY3Rpb24gc2NyZWVuc2hvdHMgYXQgMXggXHUyMDE0IHVzZXMgc2FtZSB3cmFwcGVyIGRyaWxsLWRvd24gYXMgc2VjdGlvbi1wYXJzZXJcbiAgY29uc3Qgc2VjdGlvbnMgPSBpZGVudGlmeVNlY3Rpb25Ob2RlcyhwYWdlRnJhbWUpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB0YXNrcy5wdXNoKHtcbiAgICAgIG5vZGVJZDogc2VjdGlvbnNbaV0uaWQsXG4gICAgICBub2RlTmFtZTogc2VjdGlvbnNbaV0ubmFtZSxcbiAgICAgIHR5cGU6ICdzY3JlZW5zaG90JyxcbiAgICAgIGZpbGVuYW1lOiBzY3JlZW5zaG90RmlsZW5hbWUoc2VjdGlvbnNbaV0ubmFtZSksXG4gICAgICBwYWdlUGF0aCxcbiAgICAgIGZvcm1hdDogJ1BORycsXG4gICAgICBzY2FsZTogMSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEljb24gU1ZHIHRhc2tzIFx1MjAxNCBvbmUgcGVyIHVuaXF1ZSBmaWxlbmFtZS4gTXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZVxuICAvLyBzYW1lIGxpYnJhcnkgaWNvbiBjb2xsYXBzZSB0byBhIHNpbmdsZSBleHBvcnQgKGhhbmRsZWQgYnkgaWNvbi1kZXRlY3RvcikuXG4gIGNvbnN0IGZpbGVuYW1lVG9GaXJzdE5vZGVJZCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgW25vZGVJZCwgZmlsZW5hbWVdIG9mIGljb25NYXApIHtcbiAgICBpZiAoIWZpbGVuYW1lVG9GaXJzdE5vZGVJZC5oYXMoZmlsZW5hbWUpKSB7XG4gICAgICBmaWxlbmFtZVRvRmlyc3ROb2RlSWQuc2V0KGZpbGVuYW1lLCBub2RlSWQpO1xuICAgIH1cbiAgfVxuICBjb25zdCBpY29uUm9vdElkcyA9IG5ldyBTZXQoaWNvbk1hcC5rZXlzKCkpO1xuICBmb3IgKGNvbnN0IFtmaWxlbmFtZSwgbm9kZUlkXSBvZiBmaWxlbmFtZVRvRmlyc3ROb2RlSWQpIHtcbiAgICBjb25zdCBub2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQobm9kZUlkKTtcbiAgICBpZiAoIW5vZGUpIGNvbnRpbnVlO1xuICAgIHRhc2tzLnB1c2goe1xuICAgICAgbm9kZUlkLFxuICAgICAgbm9kZU5hbWU6IChub2RlIGFzIFNjZW5lTm9kZSkubmFtZSxcbiAgICAgIHR5cGU6ICdhc3NldCcsXG4gICAgICBmaWxlbmFtZSxcbiAgICAgIHBhZ2VQYXRoLFxuICAgICAgZm9ybWF0OiAnU1ZHJyxcbiAgICAgIHNjYWxlOiAxLFxuICAgICAgcHJlZmVyU3ZnOiB0cnVlLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gUmFzdGVyIGltYWdlIHRhc2tzIFx1MjAxNCBvbmUgdGFzayBwZXIgdW5pcXVlIGZpbGVuYW1lIGluIGBpbWFnZU1hcGAuXG4gIC8vIFRoZSBtYXAgYWxyZWFkeSBoYW5kbGVzIGltYWdlSGFzaC1iYXNlZCBkZWR1cCBhbmQgY29sbGlzaW9uLXN1ZmZpeGluZztcbiAgLy8gd2UganVzdCB3YWxrIGl0IGFuZCBxdWV1ZSBvbmUgZXhwb3J0IHBlciBvdXRwdXQgZmlsZS5cbiAgY29uc3QgZmlsZW5hbWVUb0ZpcnN0SW1hZ2VOb2RlSWQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IFtub2RlSWQsIGZpbGVuYW1lXSBvZiBpbWFnZU1hcCkge1xuICAgIGlmICghZmlsZW5hbWVUb0ZpcnN0SW1hZ2VOb2RlSWQuaGFzKGZpbGVuYW1lKSkge1xuICAgICAgZmlsZW5hbWVUb0ZpcnN0SW1hZ2VOb2RlSWQuc2V0KGZpbGVuYW1lLCBub2RlSWQpO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IFtmaWxlbmFtZSwgbm9kZUlkXSBvZiBmaWxlbmFtZVRvRmlyc3RJbWFnZU5vZGVJZCkge1xuICAgIGNvbnN0IG5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChub2RlSWQpO1xuICAgIGlmICghbm9kZSkgY29udGludWU7XG4gICAgdGFza3MucHVzaCh7XG4gICAgICBub2RlSWQsXG4gICAgICBub2RlTmFtZTogKG5vZGUgYXMgU2NlbmVOb2RlKS5uYW1lLFxuICAgICAgdHlwZTogJ2Fzc2V0JyxcbiAgICAgIGZpbGVuYW1lLFxuICAgICAgcGFnZVBhdGgsXG4gICAgICBmb3JtYXQ6ICdQTkcnLFxuICAgICAgc2NhbGU6IDEsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gdGFza3M7XG59XG5cbi8qKlxuICogV2FsayBhIG5vZGUncyBhbmNlc3RyeSBjaGVja2luZyB3aGV0aGVyIGFueSBhbmNlc3RvciBpcyBhbiBpY29uIHJvb3QuXG4gKiBVc2VkIHRvIHN1cHByZXNzIGR1cGxpY2F0ZSBleHBvcnRzIGZvciB2ZWN0b3JzIGluc2lkZSBhbiBpY29uIGdyb3VwLlxuICovXG5mdW5jdGlvbiBpc0luc2lkZUljb25Sb290KG5vZGU6IFNjZW5lTm9kZSwgaWNvblJvb3RJZHM6IFNldDxzdHJpbmc+KTogYm9vbGVhbiB7XG4gIGxldCBwOiBCYXNlTm9kZSB8IG51bGwgPSBub2RlLnBhcmVudDtcbiAgd2hpbGUgKHApIHtcbiAgICBpZiAoJ2lkJyBpbiBwICYmIGljb25Sb290SWRzLmhhcygocCBhcyBhbnkpLmlkKSkgcmV0dXJuIHRydWU7XG4gICAgcCA9IChwIGFzIGFueSkucGFyZW50O1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGltYWdlSGFzaCBvZiB0aGUgZmlyc3QgdmlzaWJsZSBJTUFHRSBmaWxsIG9uIGEgbm9kZSwgb3IgbnVsbFxuICogaWYgdGhlIG5vZGUgaGFzIG5vIHJlc29sdmFibGUgSU1BR0UgZmlsbC4gVXNlZCB0byBkZWR1cGUgaWRlbnRpY2FsXG4gKiByYXN0ZXIgYml0bWFwcyBhY3Jvc3MgdGhlIHBhZ2Ugc28gd2UgZG9uJ3QgZW1pdCBvbmUgZmlsZSBwZXIgdXNhZ2UuXG4gKi9cbmZ1bmN0aW9uIGdldEZpcnN0SW1hZ2VIYXNoKG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBmaWxscyA9IChub2RlIGFzIGFueSkuZmlsbHM7XG4gIGlmICghZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkoZmlsbHMpKSByZXR1cm4gbnVsbDtcbiAgZm9yIChjb25zdCBmIG9mIGZpbGxzKSB7XG4gICAgaWYgKGYgJiYgZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UgJiYgKGYgYXMgSW1hZ2VQYWludCkuaW1hZ2VIYXNoKSB7XG4gICAgICByZXR1cm4gKGYgYXMgSW1hZ2VQYWludCkuaW1hZ2VIYXNoIHx8IG51bGw7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEZpbmQgYWxsIG5vZGVzIHdpdGggSU1BR0UgZmlsbHMgaW4gYSBzdWJ0cmVlLlxuICovXG5mdW5jdGlvbiBmaW5kSW1hZ2VOb2Rlcyhyb290OiBTY2VuZU5vZGUpOiBTY2VuZU5vZGVbXSB7XG4gIGNvbnN0IG5vZGVzOiBTY2VuZU5vZGVbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkpIHtcbiAgICAgIG5vZGVzLnB1c2gobm9kZSk7XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKHJvb3QpO1xuICByZXR1cm4gbm9kZXM7XG59XG5cbi8qKlxuICogRXhwb3J0IGEgc2luZ2xlIG5vZGUgYXMgUE5HL1NWRyBieXRlcy5cbiAqXG4gKiBGb3Igc2VjdGlvbiBzY3JlZW5zaG90cywgdGhpcyB1c2VzIGV4cG9ydEFzeW5jIHdoaWNoIHJlbmRlcnMgdGhlIGNvbXBvc2l0ZVxuICogKGltYWdlICsgdGV4dCArIG92ZXJsYXlzKSBcdTIwMTQgY29ycmVjdCBmb3Igc2NyZWVuc2hvdHMuXG4gKlxuICogRm9yIGltYWdlIGFzc2V0cywgdGhpcyBwdWxscyB0aGUgUkFXIGltYWdlIGJ5dGVzIGZyb20gdGhlIG5vZGUncyBJTUFHRSBmaWxsXG4gKiB2aWEgZmlnbWEuZ2V0SW1hZ2VCeUhhc2goKS4gVGhpcyByZXR1cm5zIHRoZSBwdXJlIHNvdXJjZSBpbWFnZSB3aXRoIE5PXG4gKiB0ZXh0L3NoYXBlIG92ZXJsYXlzIGJha2VkIGluIFx1MjAxNCBmaXhpbmcgdGhlIGNvbW1vbiBcImhlcm8gaW1hZ2UgaW5jbHVkZXMgdGhlXG4gKiBoZWFkbGluZSB0ZXh0XCIgcHJvYmxlbS4gTWFza3MgYW5kIGNyb3BzIGFyZSBkaXNjYXJkZWQgaW50ZW50aW9uYWxseTsgdGhlXG4gKiB0aGVtZSByZS1hcHBsaWVzIHRoZW0gdmlhIENTUyAob2JqZWN0LWZpdCwgYmFja2dyb3VuZC1zaXplLCBib3JkZXItcmFkaXVzKS5cbiAqXG4gKiBBc3NldCBmYWxsYmFjazogaWYgdGhlIG5vZGUgaGFzIG5vIGltYWdlIGZpbGwgKGUuZy4gYW4gU1ZHIGlsbHVzdHJhdGlvbiksXG4gKiBmYWxsIGJhY2sgdG8gZXhwb3J0QXN5bmMgc28gbG9nb3MvaWNvbnMgc3RpbGwgZXhwb3J0IGNvcnJlY3RseS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZXhwb3J0Tm9kZShcbiAgbm9kZUlkOiBzdHJpbmcsXG4gIGZvcm1hdDogJ1BORycgfCAnU1ZHJyB8ICdKUEcnLFxuICBzY2FsZTogbnVtYmVyLFxuICB0YXNrVHlwZTogJ3NjcmVlbnNob3QnIHwgJ2Z1bGwtcGFnZScgfCAnYXNzZXQnLFxuKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIGNvbnN0IG5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChub2RlSWQpO1xuICBpZiAoIW5vZGUgfHwgISgnZXhwb3J0QXN5bmMnIGluIG5vZGUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBOb2RlICR7bm9kZUlkfSBub3QgZm91bmQgb3Igbm90IGV4cG9ydGFibGVgKTtcbiAgfVxuXG4gIC8vIFNWRyByZXF1ZXN0ZWQgXHUyMDE0IHVzZSBleHBvcnRBc3luYyBkaXJlY3RseSAoZm9yIGljb25zLCB2ZWN0b3IgaWxsdXN0cmF0aW9ucylcbiAgaWYgKGZvcm1hdCA9PT0gJ1NWRycpIHtcbiAgICByZXR1cm4gYXdhaXQgKG5vZGUgYXMgU2NlbmVOb2RlKS5leHBvcnRBc3luYyh7IGZvcm1hdDogJ1NWRycgfSk7XG4gIH1cblxuICAvLyBGb3IgUE5HIGFzc2V0IHRhc2tzOiB0cnkgdG8gcHVsbCByYXcgaW1hZ2UgYnl0ZXMgZnJvbSBhbiBJTUFHRSBmaWxsIGZpcnN0XG4gIC8vIHNvIHdlIGdldCB0aGUgcHVyZSBzb3VyY2UgaW1hZ2Ugd2l0aG91dCBhbnkgYmFrZWQtaW4gdGV4dC9vdmVybGF5cy5cbiAgaWYgKHRhc2tUeXBlID09PSAnYXNzZXQnICYmIGZvcm1hdCA9PT0gJ1BORycpIHtcbiAgICBjb25zdCByYXcgPSBhd2FpdCB0cnlFeHRyYWN0UmF3SW1hZ2VCeXRlcyhub2RlIGFzIFNjZW5lTm9kZSk7XG4gICAgaWYgKHJhdykgcmV0dXJuIHJhdztcbiAgICAvLyBlbHNlIGZhbGwgdGhyb3VnaCB0byBleHBvcnRBc3luYyAoU1ZHIGlsbHVzdHJhdGlvbiwgdmVjdG9yIGdyYXBoaWMsIGV0Yy4pXG4gIH1cblxuICAvLyBGdWxsLXBhZ2UgYW5kIHNlY3Rpb24gc2NyZWVuc2hvdHMgdXNlIGV4cG9ydEFzeW5jIChyZW5kZXJlZCBjb21wb3NpdGUpLlxuICAvLyBTY2FsZSB1cCB0byAyeCBmb3IgZnVsbC1wYWdlIHRvIHByZXNlcnZlIGRldGFpbCB3aGVuIGNvbXBhcmluZyB3aXRoIGJyb3dzZXIuXG4gIGNvbnN0IGV4cG9ydFNjYWxlID0gdGFza1R5cGUgPT09ICdmdWxsLXBhZ2UnID8gMiA6IHNjYWxlO1xuICByZXR1cm4gYXdhaXQgKG5vZGUgYXMgU2NlbmVOb2RlKS5leHBvcnRBc3luYyh7XG4gICAgZm9ybWF0OiAnUE5HJyxcbiAgICBjb25zdHJhaW50OiB7IHR5cGU6ICdTQ0FMRScsIHZhbHVlOiBleHBvcnRTY2FsZSB9LFxuICB9KTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHJhdyBpbWFnZSBieXRlcyBmcm9tIHRoZSBmaXJzdCB2aXNpYmxlIElNQUdFIGZpbGwgb24gYSBub2RlLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSBub2RlIGhhcyBubyBJTUFHRSBmaWxsIG9yIHRoZSBoYXNoIGNhbid0IGJlIHJlc29sdmVkLlxuICovXG5hc3luYyBmdW5jdGlvbiB0cnlFeHRyYWN0UmF3SW1hZ2VCeXRlcyhub2RlOiBTY2VuZU5vZGUpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gIGNvbnN0IGZpbGxzID0gKG5vZGUgYXMgYW55KS5maWxscztcbiAgaWYgKCFmaWxscyB8fCAhQXJyYXkuaXNBcnJheShmaWxscykpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGltYWdlRmlsbCA9IGZpbGxzLmZpbmQoXG4gICAgKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSAmJiAoZiBhcyBJbWFnZVBhaW50KS5pbWFnZUhhc2gsXG4gICkgYXMgSW1hZ2VQYWludCB8IHVuZGVmaW5lZDtcblxuICBpZiAoIWltYWdlRmlsbCB8fCAhaW1hZ2VGaWxsLmltYWdlSGFzaCkgcmV0dXJuIG51bGw7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBpbWFnZSA9IGZpZ21hLmdldEltYWdlQnlIYXNoKGltYWdlRmlsbC5pbWFnZUhhc2gpO1xuICAgIGlmICghaW1hZ2UpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBhd2FpdCBpbWFnZS5nZXRCeXRlc0FzeW5jKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybihgRmFpbGVkIHRvIGV4dHJhY3QgcmF3IGltYWdlIGJ5dGVzIGZyb20gJHtub2RlLm5hbWV9OmAsIGVycik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlIGV4cG9ydCB0YXNrcyBpbiBiYXRjaGVzIG9mIDEwLlxuICogU2VuZHMgZWFjaCByZXN1bHQgdG8gVUkgaW1tZWRpYXRlbHkgdG8gZnJlZSBzYW5kYm94IG1lbW9yeS5cbiAqXG4gKiBPbiBTVkcgZXhwb3J0IGZhaWx1cmUgKHNvbWUgRmlnbWEgdmVjdG9yIGZlYXR1cmVzIGNhbid0IHNlcmlhbGl6ZSksXG4gKiBhdXRvbWF0aWNhbGx5IHJldHJpZXMgYXMgUE5HIEAgMnggYW5kIGVtaXRzIHRoZSAucG5nIGZpbGVuYW1lIGluc3RlYWQuXG4gKiBCb3RoIHRoZSBvcmlnaW5hbCBmYWlsdXJlIGFuZCB0aGUgZmFsbGJhY2sgYXJlIHJlY29yZGVkIGluIHRoZSByZXR1cm5lZFxuICogYGZhaWxlZGAgbGlzdCBzbyB0aGUgZXh0cmFjdG9yIGNhbiBwYXRjaCBlbGVtZW50IHJlZmVyZW5jZXMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGVjdXRlQmF0Y2hFeHBvcnQoXG4gIHRhc2tzOiBJbWFnZUV4cG9ydFRhc2tbXSxcbiAgb25Qcm9ncmVzczogKGN1cnJlbnQ6IG51bWJlciwgdG90YWw6IG51bWJlciwgbGFiZWw6IHN0cmluZykgPT4gdm9pZCxcbiAgb25EYXRhOiAodGFzazogSW1hZ2VFeHBvcnRUYXNrLCBkYXRhOiBVaW50OEFycmF5KSA9PiB2b2lkLFxuICBzaG91bGRDYW5jZWw6ICgpID0+IGJvb2xlYW4sXG4pOiBQcm9taXNlPEZhaWxlZEV4cG9ydFtdPiB7XG4gIGNvbnN0IHRvdGFsID0gdGFza3MubGVuZ3RoO1xuICBjb25zdCBmYWlsZWQ6IEZhaWxlZEV4cG9ydFtdID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbDsgaSArPSBCQVRDSF9TSVpFKSB7XG4gICAgaWYgKHNob3VsZENhbmNlbCgpKSByZXR1cm4gZmFpbGVkO1xuXG4gICAgY29uc3QgYmF0Y2ggPSB0YXNrcy5zbGljZShpLCBpICsgQkFUQ0hfU0laRSk7XG4gICAgY29uc3QgYmF0Y2hQcm9taXNlcyA9IGJhdGNoLm1hcChhc3luYyAodGFzaykgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGV4cG9ydE5vZGUodGFzay5ub2RlSWQsIHRhc2suZm9ybWF0LCB0YXNrLnNjYWxlLCB0YXNrLnR5cGUpO1xuICAgICAgICBvbkRhdGEodGFzaywgZGF0YSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgcmVhc29uID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuXG4gICAgICAgIC8vIFNWRyBjYW4gZmFpbCBmb3IgdmVjdG9ycyB3aXRoIHVuc3VwcG9ydGVkIGZlYXR1cmVzIChvcGVuIHBhdGhzXG4gICAgICAgIC8vIHdpdGggc3Ryb2tlIGNhcHMsIGNlcnRhaW4gYmxlbmQgbW9kZXMsIGJvdW5kIHZhcmlhYmxlcyBvbiBmaWxscykuXG4gICAgICAgIC8vIEZhbGwgYmFjayB0byBQTkcgQCAyeCBzbyB0aGUgZGVzaWduIGlzbid0IHZpc3VhbGx5IG1pc3NpbmcuXG4gICAgICAgIGlmICh0YXNrLmZvcm1hdCA9PT0gJ1NWRycpIHtcbiAgICAgICAgICBjb25zdCBwbmdGaWxlbmFtZSA9IHRhc2suZmlsZW5hbWUucmVwbGFjZSgvXFwuc3ZnJC9pLCAnLnBuZycpO1xuICAgICAgICAgIGNvbnN0IHBuZ1Rhc2s6IEltYWdlRXhwb3J0VGFzayA9IHtcbiAgICAgICAgICAgIC4uLnRhc2ssXG4gICAgICAgICAgICBmaWxlbmFtZTogcG5nRmlsZW5hbWUsXG4gICAgICAgICAgICBmb3JtYXQ6ICdQTkcnLFxuICAgICAgICAgICAgc2NhbGU6IDIsXG4gICAgICAgICAgfTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGV4cG9ydE5vZGUodGFzay5ub2RlSWQsICdQTkcnLCAyLCB0YXNrLnR5cGUpO1xuICAgICAgICAgICAgb25EYXRhKHBuZ1Rhc2ssIGRhdGEpO1xuICAgICAgICAgICAgZmFpbGVkLnB1c2goe1xuICAgICAgICAgICAgICBmaWxlbmFtZTogdGFzay5maWxlbmFtZSxcbiAgICAgICAgICAgICAgbm9kZU5hbWU6IHRhc2subm9kZU5hbWUsXG4gICAgICAgICAgICAgIHJlYXNvbjogYFNWRyBleHBvcnQgZmFpbGVkICgke3JlYXNvbn0pOyBmZWxsIGJhY2sgdG8gUE5HYCxcbiAgICAgICAgICAgICAgZmFsbGJhY2tGaWxlbmFtZTogcG5nRmlsZW5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGNhdGNoIChwbmdFcnIpIHtcbiAgICAgICAgICAgIGNvbnN0IHBuZ1JlYXNvbiA9IHBuZ0VyciBpbnN0YW5jZW9mIEVycm9yID8gcG5nRXJyLm1lc3NhZ2UgOiBTdHJpbmcocG5nRXJyKTtcbiAgICAgICAgICAgIGZhaWxlZC5wdXNoKHtcbiAgICAgICAgICAgICAgZmlsZW5hbWU6IHRhc2suZmlsZW5hbWUsXG4gICAgICAgICAgICAgIG5vZGVOYW1lOiB0YXNrLm5vZGVOYW1lLFxuICAgICAgICAgICAgICByZWFzb246IGBTVkcgYW5kIFBORyBmYWxsYmFjayBib3RoIGZhaWxlZDogJHtyZWFzb259IC8gJHtwbmdSZWFzb259YCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBleHBvcnQgJHt0YXNrLmZpbGVuYW1lfTpgLCBlcnIpO1xuICAgICAgICBmYWlsZWQucHVzaCh7XG4gICAgICAgICAgZmlsZW5hbWU6IHRhc2suZmlsZW5hbWUsXG4gICAgICAgICAgbm9kZU5hbWU6IHRhc2subm9kZU5hbWUsXG4gICAgICAgICAgcmVhc29uLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGF3YWl0IFByb21pc2UuYWxsKGJhdGNoUHJvbWlzZXMpO1xuICAgIGNvbnN0IGRvbmUgPSBNYXRoLm1pbihpICsgQkFUQ0hfU0laRSwgdG90YWwpO1xuICAgIG9uUHJvZ3Jlc3MoZG9uZSwgdG90YWwsIGBFeHBvcnRpbmcgKCR7ZG9uZX0vJHt0b3RhbH0pLi4uYCk7XG4gIH1cblxuICByZXR1cm4gZmFpbGVkO1xufVxuXG4vKipcbiAqIEJ1aWxkIHRoZSBpbWFnZS1tYXAuanNvbiBmcm9tIGV4cG9ydCB0YXNrcyBhbmQgc2VjdGlvbiBkYXRhLlxuICpcbiAqIGBpY29uTWFwYCBwb3B1bGF0ZXMgYGJ5X3NlY3Rpb25gIGZvciBpY29uIHVzYWdlIHNvIHRoZSBhZ2VudCBjYW4gdHJhY2VcbiAqIFwic2VjdGlvbiBYIHVzZXMgY2hldnJvbi1yaWdodC5zdmdcIiBpbnN0ZWFkIG9mIGdldHRpbmcgYSBjb250ZXh0LWxlc3NcbiAqIGdsb2JhbCBsaXN0IG9mIFNWR3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEltYWdlTWFwKFxuICB0YXNrczogSW1hZ2VFeHBvcnRUYXNrW10sXG4gIHNlY3Rpb25zOiB7IG5hbWU6IHN0cmluZzsgY2hpbGRyZW46IFNjZW5lTm9kZVtdIH1bXSxcbiAgaWNvbk1hcDogTWFwPHN0cmluZywgc3RyaW5nPixcbiAgaW1hZ2VNYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4pOiBJbWFnZU1hcCB7XG4gIGNvbnN0IGltYWdlczogUmVjb3JkPHN0cmluZywgSW1hZ2VNYXBFbnRyeT4gPSB7fTtcbiAgY29uc3QgYnlTZWN0aW9uTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7fTtcblxuICBjb25zdCBhc3NldFRhc2tzID0gdGFza3MuZmlsdGVyKHQgPT4gdC50eXBlID09PSAnYXNzZXQnKTtcblxuICBmb3IgKGNvbnN0IHRhc2sgb2YgYXNzZXRUYXNrcykge1xuICAgIGltYWdlc1t0YXNrLmZpbGVuYW1lXSA9IHtcbiAgICAgIGZpbGU6IHRhc2suZmlsZW5hbWUsXG4gICAgICBleHQ6IHRhc2suZm9ybWF0LnRvTG93ZXJDYXNlKCksXG4gICAgICBub2RlTmFtZXM6IFt0YXNrLm5vZGVOYW1lXSxcbiAgICAgIHJlYWRhYmxlTmFtZTogdGFzay5maWxlbmFtZSxcbiAgICAgIGRpbWVuc2lvbnM6IG51bGwsXG4gICAgICB1c2VkSW5TZWN0aW9uczogW10sXG4gICAgfTtcbiAgfVxuXG4gIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBzZWN0aW9ucykge1xuICAgIGNvbnN0IHNlY3Rpb25JbWFnZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgICAvLyBJY29uIHJvb3QgXHUyMDE0IHJlY29yZCBTVkcgYW5kIHN0b3AgKGRvbid0IGRlc2NlbmQgaW50byB2ZWN0b3IgaW50ZXJuYWxzKVxuICAgICAgY29uc3QgaWNvbkZpbGVuYW1lID0gaWNvbk1hcC5nZXQobm9kZS5pZCk7XG4gICAgICBpZiAoaWNvbkZpbGVuYW1lKSB7XG4gICAgICAgIHNlY3Rpb25JbWFnZXMuYWRkKGljb25GaWxlbmFtZSk7XG4gICAgICAgIGlmIChpbWFnZXNbaWNvbkZpbGVuYW1lXSAmJiAhaW1hZ2VzW2ljb25GaWxlbmFtZV0udXNlZEluU2VjdGlvbnMuaW5jbHVkZXMoc2VjdGlvbi5uYW1lKSkge1xuICAgICAgICAgIGltYWdlc1tpY29uRmlsZW5hbWVdLnVzZWRJblNlY3Rpb25zLnB1c2goc2VjdGlvbi5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpKSB7XG4gICAgICAgIC8vIFJlc29sdmUgdmlhIHRoZSBzaGFyZWQgaW1hZ2VNYXAgc28gcGVyLXNlY3Rpb24gcmVmcyBtYXRjaCB0aGVcbiAgICAgICAgLy8gZmlsZW5hbWVzIHRoYXQgYWN0dWFsbHkgbGFuZGVkIGluIHRoZSBaSVAgKHBvc3QgY29sbGlzaW9uLXN1ZmZpeCkuXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gaW1hZ2VNYXAuZ2V0KG5vZGUuaWQpO1xuICAgICAgICBpZiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICBzZWN0aW9uSW1hZ2VzLmFkZChmaWxlbmFtZSk7XG4gICAgICAgICAgaWYgKGltYWdlc1tmaWxlbmFtZV0gJiYgIWltYWdlc1tmaWxlbmFtZV0udXNlZEluU2VjdGlvbnMuaW5jbHVkZXMoc2VjdGlvbi5uYW1lKSkge1xuICAgICAgICAgICAgaW1hZ2VzW2ZpbGVuYW1lXS51c2VkSW5TZWN0aW9ucy5wdXNoKHNlY3Rpb24ubmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHNlY3Rpb24uY2hpbGRyZW4pIHtcbiAgICAgIHdhbGsoY2hpbGQpO1xuICAgIH1cbiAgICBieVNlY3Rpb25NYXBbc2VjdGlvbi5uYW1lXSA9IFsuLi5zZWN0aW9uSW1hZ2VzXTtcbiAgfVxuXG4gIHJldHVybiB7IGltYWdlcywgYnlfc2VjdGlvbjogYnlTZWN0aW9uTWFwIH07XG59XG4iLCAiaW1wb3J0IHsgaGFzSW1hZ2VGaWxsIH0gZnJvbSAnLi9jb2xvcic7XG5pbXBvcnQgeyBzbHVnaWZ5LCBpc0RlZmF1bHRMYXllck5hbWUgfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBTaGFyZWQgaWNvbiBkZXRlY3Rpb24gZm9yIGltYWdlLWV4cG9ydGVyIChkZWNpZGVzIHdoYXQgdG8gU1ZHLWV4cG9ydClcbiAqIGFuZCBzZWN0aW9uLXBhcnNlciAoZGVjaWRlcyB3aGljaCBlbGVtZW50cyBnZXQgYW4gYGljb25GaWxlYCByZWZlcmVuY2UpLlxuICpcbiAqIEJvdGggbW9kdWxlcyBNVVNUIGFncmVlIG9uIChhKSB3aGljaCBub2RlcyBhcmUgaWNvbnMgYW5kIChiKSB0aGUgZmlsZW5hbWVcbiAqIGVhY2ggaWNvbiByZWNlaXZlcyBcdTIwMTQgb3RoZXJ3aXNlIHNlY3Rpb24tc3BlY3MuanNvbiBwb2ludHMgYXQgZmlsZXMgdGhhdFxuICogbmV2ZXIgbWFkZSBpdCBpbnRvIHRoZSBaSVAsIHdoaWNoIGlzIHRoZSBvcmlnaW5hbCBcImljb24gbWlzc2luZ1wiIGJ1Zy5cbiAqXG4gKiBGaWxlbmFtZSB1bmlxdWVuZXNzIGlzIHRoZSByZXNwb25zaWJpbGl0eSBvZiBgYnVpbGRJY29uRmlsZW5hbWVNYXBgOlxuICogSU5TVEFOQ0Ugbm9kZXMgcG9pbnRpbmcgYXQgdGhlIHNhbWUgbWFpbiBjb21wb25lbnQgY29sbGFwc2UgdG8gb25lIGZpbGUsXG4gKiBhbmQgc2x1ZyBjb2xsaXNpb25zIGdldCBhIG51bWVyaWMgc3VmZml4LlxuICovXG5cbmNvbnN0IElDT05fTkFNRV9ISU5UID0gL1xcYihpY29ufGNoZXZyb258YXJyb3d8Y2FyZXR8Y2hlY2t8dGlja3xjbG9zZXxjcm9zc3xtZW51fGJ1cmdlcnxoYW1idXJnZXJ8c2VhcmNofHBsdXN8bWludXN8c3RhcnxoZWFydHxsb2dvfHNvY2lhbHxzeW1ib2x8Z2x5cGh8cGxheXxwYXVzZXxzdG9wfG5leHR8cHJldnxzaGFyZXxkb3dubG9hZHx1cGxvYWR8ZWRpdHx0cmFzaHxkZWxldGV8aW5mb3x3YXJuaW5nfGVycm9yfHN1Y2Nlc3N8ZmFjZWJvb2t8dHdpdHRlcnxpbnN0YWdyYW18bGlua2VkaW58eW91dHViZXxnaXRodWJ8dGlrdG9rfHdoYXRzYXBwfHRlbGVncmFtfGRpc2NvcmR8cGludGVyZXN0fHNuYXBjaGF0fG1haWx8ZW52ZWxvcGV8cGhvbmV8dGVsZXBob25lfGhvbWV8aG91c2V8dXNlcnxwcm9maWxlfGFjY291bnR8bG9ja3x1bmxvY2t8Z2VhcnxzZXR0aW5nc3xjb2d8YmVsbHxub3RpZmljYXRpb258Y2FsZW5kYXJ8Y2xvY2t8dGltZXxib29rbWFya3x0YWd8ZmlsdGVyfHNvcnR8Z3JpZHxsaXN0fG1hcHxwaW58bG9jYXRpb258Y2FydHxiYWd8YmFza2V0fHdhbGxldHxjYXJkfGdpZnR8Z2xvYmV8d29ybGR8bGlua3xleHRlcm5hbHxjb3B5fHBhc3RlfHJlZnJlc2h8cmVsb2FkfHN5bmN8ZXllfHZpZXd8aGlkZXx2aXNpYmxlfGludmlzaWJsZXxzdW58bW9vbnx0aGVtZXxsaWdodHxkYXJrfHdpZml8YmF0dGVyeXxjYW1lcmF8dmlkZW98bWljcm9waG9uZXx2b2x1bWV8bXV0ZXxmaWxlfGZvbGRlcnxhdHRhY2h8cGFwZXJjbGlwfGNsb3VkfGRhdGFiYXNlfGNoYXJ0fGdyYXBofHRyZW5kfGRvdHxkaXZpZGVyfHNlcGFyYXRvcnxzaGFwZXxncmFwaGljfGlsbHVzdHJhdGlvbnxkZWNvcmF0aW9ufHN2Z3x2ZWN0b3J8YXNzZXQpXFxiL2k7XG5jb25zdCBJQ09OX1NJWkVfQ0FQID0gMjU2O1xuXG4vKipcbiAqIFRydWUgaWYgdGhlIG5vZGUgaXMgXCJ2ZWN0b3Itb25seVwiIFx1MjAxNCBubyBURVhULCBubyBJTUFHRSBmaWxsIGFueXdoZXJlIGluXG4gKiBpdHMgc3VidHJlZS4gUHVyZS12ZWN0b3IgaWNvbnMgY2FuIGJlIGV4cG9ydGVkIGFzIFNWRyB3aXRob3V0IGxvc2luZ1xuICogZmlkZWxpdHk7IG1peGVkIHN1YnRyZWVzIG11c3QgZmFsbCBiYWNrIHRvIFBORy5cbiAqL1xuZnVuY3Rpb24gaXNWZWN0b3JPbmx5KG46IFNjZW5lTm9kZSk6IGJvb2xlYW4ge1xuICBpZiAobi50eXBlID09PSAnVEVYVCcpIHJldHVybiBmYWxzZTtcbiAgaWYgKGhhc0ltYWdlRmlsbChuIGFzIGFueSkpIHJldHVybiBmYWxzZTtcbiAgaWYgKCdjaGlsZHJlbicgaW4gbikge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG4gYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkLnZpc2libGUgPT09IGZhbHNlKSBjb250aW51ZTtcbiAgICAgIGlmICghaXNWZWN0b3JPbmx5KGNoaWxkKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBQcmVkaWNhdGU6IGlzIHRoaXMgbm9kZSBhbiBpY29uIHJvb3QgdGhhdCBzaG91bGQgYmUgZXhwb3J0ZWQgYXMgU1ZHP1xuICpcbiAqIEhldXJpc3RpY3MgKGFueSBvbmUgaXMgc3VmZmljaWVudCk6XG4gKiAgIDEuIG5vZGUudHlwZSA9PT0gVkVDVE9SIC8gQk9PTEVBTl9PUEVSQVRJT04gLyBMSU5FIChyYXcgdmVjdG9yIHByaW1pdGl2ZXMpXG4gKiAgIDIuIEZSQU1FIC8gR1JPVVAgLyBDT01QT05FTlQgLyBJTlNUQU5DRSB3aG9zZSBlbnRpcmUgc3VidHJlZSBpcyB2ZWN0b3Itb25seVxuICogICAgICBBTkQgYW55IG9uZSBvZjpcbiAqICAgICAgICBhLiBoYXMgYSBuYW1lIGhpbnQgKGljb24sIGxvZ28sIGNoZXZyb24sIGZhY2Vib29rLCBcdTIwMjYpIFx1MjAxNCBhbnkgc2l6ZVxuICogICAgICAgIGIuIGlzIHNtYWxsIChcdTIyNjQyNTZcdTAwRDcyNTYpIFx1MjAxNCBuYW1lIGlycmVsZXZhbnRcbiAqICAgICAgV3JhcHBlci1hcy1zaW5nbGUtaWNvbiBleHBvcnQga2VlcHMgbXVsdGktcGF0aCBsb2dvcyBjb21wb3NlZDsgdGhlXG4gKiAgICAgIG9sZCAxMjhweCBjYXAgc3BsaXQgYSAyMDBcdTAwRDcyMDAgbG9nbyBpbnRvIGluZGl2aWR1YWxseS1kaXNjb25uZWN0ZWRcbiAqICAgICAgVkVDVE9SIGV4cG9ydHMuIEJ1bXBpbmcgdG8gMjU2ICsgbmFtZS1oaW50IG92ZXJyaWRlIGZpeGVzIHRoYXQuXG4gKlxuICogV2hhdGV2ZXIgdGhpcyByZXR1cm5zIHRydWUgZm9yLCBpbWFnZS1leHBvcnRlciB3aWxsIHF1ZXVlIGFuIFNWRyBleHBvcnRcbiAqIEFORCBzZWN0aW9uLXBhcnNlciB3aWxsIGVtaXQgYW4gYGljb25GaWxlYCByZWZlcmVuY2Ugb24gdGhlIG1hdGNoaW5nIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0ljb25Ob2RlKG5vZGU6IFNjZW5lTm9kZSk6IGJvb2xlYW4ge1xuICBpZiAobm9kZS52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIFB1cmUgdmVjdG9yIHByaW1pdGl2ZXMgYXJlIGFsd2F5cyBTVkctZXhwb3J0YWJsZS5cbiAgaWYgKG5vZGUudHlwZSA9PT0gJ1ZFQ1RPUicgfHwgbm9kZS50eXBlID09PSAnQk9PTEVBTl9PUEVSQVRJT04nIHx8IG5vZGUudHlwZSA9PT0gJ0xJTkUnKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAobm9kZS50eXBlICE9PSAnRlJBTUUnICYmIG5vZGUudHlwZSAhPT0gJ0NPTVBPTkVOVCcgJiZcbiAgICAgIG5vZGUudHlwZSAhPT0gJ0lOU1RBTkNFJyAmJiBub2RlLnR5cGUgIT09ICdHUk9VUCcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoISgnY2hpbGRyZW4nIGluIG5vZGUpIHx8IChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgYmIgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGNvbnN0IHNtYWxsaXNoID0gISFiYiAmJiBiYi53aWR0aCA8PSBJQ09OX1NJWkVfQ0FQICYmIGJiLmhlaWdodCA8PSBJQ09OX1NJWkVfQ0FQO1xuICBjb25zdCBuYW1lSGludHNJY29uID0gSUNPTl9OQU1FX0hJTlQudGVzdChub2RlLm5hbWUgfHwgJycpO1xuXG4gIGlmICghc21hbGxpc2ggJiYgIW5hbWVIaW50c0ljb24pIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIGlzVmVjdG9yT25seShub2RlKTtcbn1cblxuLyoqXG4gKiBXYWxrIHRoZSB0cmVlIGFuZCBjb2xsZWN0IGV2ZXJ5IGljb24tcm9vdCBub2RlLiBEb24ndCByZWN1cnNlIGludG8gYW5cbiAqIGljb24ncyBjaGlsZHJlbiBcdTIwMTQgdGhlIHBhcmVudCBpcyB0aGUgY29tcG9zZWQgZXhwb3J0LCB0aGUgY2hpbGRyZW4gYXJlXG4gKiBqdXN0IHBhdGhzIGluc2lkZSBpdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRJY29uTm9kZXMocm9vdDogU2NlbmVOb2RlKTogU2NlbmVOb2RlW10ge1xuICBjb25zdCBpY29uczogU2NlbmVOb2RlW10gPSBbXTtcbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIGlmIChpc0ljb25Ob2RlKG5vZGUpKSB7XG4gICAgICBpY29ucy5wdXNoKG5vZGUpO1xuICAgICAgcmV0dXJuOyAvLyBkb24ndCByZWN1cnNlIGludG8gdGhlIGljb25cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKHJvb3QpO1xuICByZXR1cm4gaWNvbnM7XG59XG5cbi8qKlxuICogUGljayBhIGh1bWFuLW1lYW5pbmdmdWwgYmFzZSBuYW1lIGZvciBhbiBpY29uLiBPcmRlciBvZiBwcmVmZXJlbmNlOlxuICogICAxLiBJTlNUQU5DRSBcdTIxOTIgbWFpbiBjb21wb25lbnQgLyBjb21wb25lbnQtc2V0IG5hbWVcbiAqICAgMi4gVGhlIG5vZGUncyBvd24gbmFtZSwgaWYgbm90IGEgZGVmYXVsdCBGaWdtYSBuYW1lXG4gKiAgIDMuIE5lYXJlc3QgbmFtZWQgYW5jZXN0b3IgKyBcIi1pY29uXCIgc3VmZml4XG4gKiAgIDQuIFwiaWNvblwiIGZhbGxiYWNrXG4gKi9cbmZ1bmN0aW9uIGdldEljb25CYXNlTmFtZShub2RlOiBTY2VuZU5vZGUpOiBzdHJpbmcge1xuICBsZXQgYmFzZU5hbWUgPSBub2RlLm5hbWUgfHwgJyc7XG5cbiAgaWYgKG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtYWluID0gKG5vZGUgYXMgSW5zdGFuY2VOb2RlKS5tYWluQ29tcG9uZW50O1xuICAgICAgaWYgKG1haW4pIHtcbiAgICAgICAgY29uc3QgY2FuZGlkYXRlID0gbWFpbi5wYXJlbnQ/LnR5cGUgPT09ICdDT01QT05FTlRfU0VUJ1xuICAgICAgICAgID8gKG1haW4ucGFyZW50IGFzIGFueSkubmFtZVxuICAgICAgICAgIDogbWFpbi5uYW1lO1xuICAgICAgICBpZiAoY2FuZGlkYXRlICYmICFpc0RlZmF1bHRMYXllck5hbWUoY2FuZGlkYXRlKSkge1xuICAgICAgICAgIGJhc2VOYW1lID0gY2FuZGlkYXRlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBtYWluQ29tcG9uZW50IGFjY2VzcyBjYW4gdGhyb3cgb24gZGV0YWNoZWQgaW5zdGFuY2VzIFx1MjAxNCBmYWxsIHRocm91Z2hcbiAgICB9XG4gIH1cblxuICBpZiAoIWJhc2VOYW1lIHx8IGlzRGVmYXVsdExheWVyTmFtZShiYXNlTmFtZSkpIHtcbiAgICBsZXQgcDogQmFzZU5vZGUgfCBudWxsID0gbm9kZS5wYXJlbnQ7XG4gICAgd2hpbGUgKHAgJiYgJ25hbWUnIGluIHAgJiYgaXNEZWZhdWx0TGF5ZXJOYW1lKChwIGFzIGFueSkubmFtZSkpIHtcbiAgICAgIHAgPSAocCBhcyBhbnkpLnBhcmVudDtcbiAgICB9XG4gICAgaWYgKHAgJiYgJ25hbWUnIGluIHAgJiYgKHAgYXMgYW55KS5uYW1lICYmICFpc0RlZmF1bHRMYXllck5hbWUoKHAgYXMgYW55KS5uYW1lKSkge1xuICAgICAgYmFzZU5hbWUgPSBgJHsocCBhcyBhbnkpLm5hbWV9LWljb25gO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYXNlTmFtZSA9ICdpY29uJztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYmFzZU5hbWU7XG59XG5cbi8qKlxuICogRGVkdXAga2V5IFx1MjAxNCBjb2xsYXBzZXMgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIGxpYnJhcnkgaWNvbiBpbnRvXG4gKiBhIHNpbmdsZSBleHBvcnQuIFN0YW5kYWxvbmUgdmVjdG9yIG5vZGVzIGRlZHVwIGJ5IHRoZWlyIG93biBpZC5cbiAqL1xuZnVuY3Rpb24gZGVkdXBlS2V5KG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZyB7XG4gIGlmIChub2RlLnR5cGUgPT09ICdJTlNUQU5DRScpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWFpbiA9IChub2RlIGFzIEluc3RhbmNlTm9kZSkubWFpbkNvbXBvbmVudDtcbiAgICAgIGlmIChtYWluKSByZXR1cm4gYG1jOiR7bWFpbi5pZH1gO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gZmFsbCB0aHJvdWdoXG4gICAgfVxuICB9XG4gIHJldHVybiBgbjoke25vZGUuaWR9YDtcbn1cblxuLyoqXG4gKiBCdWlsZCB0aGUgY2Fub25pY2FsIE1hcDxub2RlSWQsIHN2Z0ZpbGVuYW1lPiBmb3IgYSBwYWdlIGZyYW1lLlxuICogQm90aCBpbWFnZS1leHBvcnRlciBhbmQgc2VjdGlvbi1wYXJzZXIgY29uc3VtZSB0aGlzIHNvIHRoZXkgYWdyZWUgb25cbiAqIHdoaWNoIG5vZGVzIGFyZSBpY29ucyBBTkQgd2hhdCBmaWxlbmFtZSBlYWNoIGljb24gZW5kcyB1cCB3aXRoLlxuICpcbiAqIEd1YXJhbnRlZXM6XG4gKiAgIC0gRXZlcnkgZW50cnkncyBmaWxlbmFtZSBpcyB1bmlxdWUgYWNyb3NzIHRoZSByZXR1cm5lZCBtYXAuXG4gKiAgIC0gTXVsdGlwbGUgSU5TVEFOQ0Ugbm9kZXMgb2YgdGhlIHNhbWUgbWFpbiBjb21wb25lbnQgbWFwIHRvIHRoZSBzYW1lXG4gKiAgICAgZmlsZW5hbWUgKG9uZSBzaGFyZWQgU1ZHIGZpbGUgZm9yIHRoZSBwYWdlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkSWNvbkZpbGVuYW1lTWFwKHJvb3Q6IFNjZW5lTm9kZSk6IE1hcDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCBub2RlSWRUb0ZpbGVuYW1lID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgY29uc3QgZGVkdXBLZXlUb0ZpbGVuYW1lID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgY29uc3QgdXNlZEZpbGVuYW1lcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3Qgbm9kZSBvZiBmaW5kSWNvbk5vZGVzKHJvb3QpKSB7XG4gICAgY29uc3Qga2V5ID0gZGVkdXBlS2V5KG5vZGUpO1xuICAgIGxldCBmaWxlbmFtZSA9IGRlZHVwS2V5VG9GaWxlbmFtZS5nZXQoa2V5KTtcbiAgICBpZiAoIWZpbGVuYW1lKSB7XG4gICAgICBjb25zdCBiYXNlID0gc2x1Z2lmeShnZXRJY29uQmFzZU5hbWUobm9kZSkpIHx8ICdpY29uJztcbiAgICAgIGZpbGVuYW1lID0gYCR7YmFzZX0uc3ZnYDtcbiAgICAgIGxldCBpID0gMjtcbiAgICAgIHdoaWxlICh1c2VkRmlsZW5hbWVzLmhhcyhmaWxlbmFtZSkpIHtcbiAgICAgICAgZmlsZW5hbWUgPSBgJHtiYXNlfS0ke2krK30uc3ZnYDtcbiAgICAgIH1cbiAgICAgIHVzZWRGaWxlbmFtZXMuYWRkKGZpbGVuYW1lKTtcbiAgICAgIGRlZHVwS2V5VG9GaWxlbmFtZS5zZXQoa2V5LCBmaWxlbmFtZSk7XG4gICAgfVxuICAgIG5vZGVJZFRvRmlsZW5hbWUuc2V0KG5vZGUuaWQsIGZpbGVuYW1lKTtcbiAgfVxuXG4gIHJldHVybiBub2RlSWRUb0ZpbGVuYW1lO1xufVxuIiwgImltcG9ydCB7XG4gIFNlY3Rpb25TcGVjcywgRGVzaWduVG9rZW5zLCBFeHBvcnRNYW5pZmVzdCwgRXhwb3J0TWFuaWZlc3RQYWdlLFxuICBSZXNwb25zaXZlUGFpciwgUmVzcG9uc2l2ZU1hcCwgUGFnZVRva2VucywgSW1hZ2VNYXAsIEZvbnRUb2tlbkluZm8sXG4gIFJlc3BvbnNpdmVPdmVycmlkZSwgU2VjdGlvblNwZWMsIEZhaWxlZEV4cG9ydCxcbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBzbHVnaWZ5LCB0b0xheW91dE5hbWUgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGNvbGxlY3RDb2xvcnMgfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IGNvbGxlY3RGb250cywgY291bnRUZXh0Tm9kZXMgfSBmcm9tICcuL3R5cG9ncmFwaHknO1xuaW1wb3J0IHsgY29sbGVjdFNwYWNpbmcgfSBmcm9tICcuL3NwYWNpbmcnO1xuaW1wb3J0IHsgcGFyc2VTZWN0aW9ucyB9IGZyb20gJy4vc2VjdGlvbi1wYXJzZXInO1xuaW1wb3J0IHsgbWF0Y2hSZXNwb25zaXZlRnJhbWVzIH0gZnJvbSAnLi9yZXNwb25zaXZlJztcbmltcG9ydCB7IGJ1aWxkRXhwb3J0VGFza3MsIGV4ZWN1dGVCYXRjaEV4cG9ydCwgYnVpbGRJbWFnZU1hcCwgYnVpbGRJbWFnZUZpbGVuYW1lTWFwIH0gZnJvbSAnLi9pbWFnZS1leHBvcnRlcic7XG5pbXBvcnQgeyBleHRyYWN0VmFyaWFibGVzIH0gZnJvbSAnLi92YXJpYWJsZXMnO1xuaW1wb3J0IHsgbm9ybWFsaXplU2VjdGlvbk5hbWUgfSBmcm9tICcuL3BhdHRlcm5zJztcbmltcG9ydCB7IGJ1aWxkSWNvbkZpbGVuYW1lTWFwIH0gZnJvbSAnLi9pY29uLWRldGVjdG9yJztcblxuLyoqXG4gKiBNYXN0ZXIgZXh0cmFjdGlvbiBvcmNoZXN0cmF0b3IuXG4gKiBDb29yZGluYXRlcyBhbGwgbW9kdWxlcyBmb3IgdGhlIHNlbGVjdGVkIGZyYW1lcyBhbmQgc2VuZHMgcmVzdWx0cyB0byBVSS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkV4dHJhY3Rpb24oXG4gIGZyYW1lSWRzOiBzdHJpbmdbXSxcbiAgcmVzcG9uc2l2ZVBhaXJzOiBSZXNwb25zaXZlUGFpcltdLFxuICBzZW5kTWVzc2FnZTogKG1zZzogYW55KSA9PiB2b2lkLFxuICBzaG91bGRDYW5jZWw6ICgpID0+IGJvb2xlYW4sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYWxsRGVzaWduVG9rZW5Db2xvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgY29uc3QgYWxsRGVzaWduVG9rZW5Gb250czogUmVjb3JkPHN0cmluZywgRm9udFRva2VuSW5mbz4gPSB7fTtcbiAgY29uc3QgYWxsU3BhY2luZ1ZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBjb25zdCBtYW5pZmVzdFBhZ2VzOiBFeHBvcnRNYW5pZmVzdFBhZ2VbXSA9IFtdO1xuICBjb25zdCBhbGxGYWlsZWRFeHBvcnRzOiBGYWlsZWRFeHBvcnRbXSA9IFtdO1xuICBsZXQgdG90YWxTZWN0aW9ucyA9IDA7XG4gIGxldCB0b3RhbEltYWdlcyA9IDA7XG5cbiAgLy8gUHJlLWNvbXB1dGUgdGhlIHNldCBvZiBzZWN0aW9uIG5hbWVzIHRoYXQgYXBwZWFyIG9uIFx1MjI2NTIgc2VsZWN0ZWQgcGFnZXMuXG4gIC8vIFRoZXNlIGFyZSBjYW5kaWRhdGVzIGZvciBnbG9iYWwgV1AgdGhlbWUgcGFydHMgKGhlYWRlci5waHAgLyBmb290ZXIucGhwXG4gIC8vIC8gdGVtcGxhdGUtcGFydHMpLiBwYXJzZVNlY3Rpb25zIHdpbGwgbWFyayBtYXRjaGluZyBzZWN0aW9ucyBpc0dsb2JhbC5cbiAgY29uc3QgZ2xvYmFsTmFtZXMgPSBjb21wdXRlR2xvYmFsU2VjdGlvbk5hbWVzKHJlc3BvbnNpdmVQYWlycyk7XG5cbiAgLy8gUHJvY2VzcyBlYWNoIHJlc3BvbnNpdmUgcGFpciAoZWFjaCA9IG9uZSBwYWdlKVxuICBmb3IgKGNvbnN0IHBhaXIgb2YgcmVzcG9uc2l2ZVBhaXJzKSB7XG4gICAgaWYgKHNob3VsZENhbmNlbCgpKSByZXR1cm47XG5cbiAgICBjb25zdCBkZXNrdG9wTm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKHBhaXIuZGVza3RvcC5mcmFtZUlkKTtcbiAgICBpZiAoIWRlc2t0b3BOb2RlIHx8IGRlc2t0b3BOb2RlLnR5cGUgIT09ICdGUkFNRScpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGRlc2t0b3BGcmFtZSA9IGRlc2t0b3BOb2RlIGFzIEZyYW1lTm9kZTtcblxuICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6ICdFWFBPUlRfUFJPR1JFU1MnLFxuICAgICAgY3VycmVudDogMCxcbiAgICAgIHRvdGFsOiAxMDAsXG4gICAgICBsYWJlbDogYEV4dHJhY3RpbmcgXCIke3BhaXIucGFnZU5hbWV9XCIuLi5gLFxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIHRoZSBpY29uIEFORCByYXN0ZXItaW1hZ2UgZmlsZW5hbWUgbWFwcyBGSVJTVCBzbyBzZWN0aW9uLXBhcnNlclxuICAgIC8vICAgIGFuZCBpbWFnZS1leHBvcnRlciBhZ3JlZSBvbiAoYSkgd2hpY2ggbm9kZXMgYXJlIGljb25zIHZzIHJhc3RlclxuICAgIC8vICAgIGltYWdlcyBhbmQgKGIpIHdoYXQgZmlsZW5hbWUgZWFjaCBvbmUgcmVjZWl2ZXMuIFdpdGhvdXQgdGhpcyBzaGFyZWRcbiAgICAvLyAgICBzdGF0ZSB0aGUgc3BlYyBlbmRzIHVwIHJlZmVyZW5jaW5nIGZpbGVzIHRoYXQgbmV2ZXIgbWFkZSBpdCBpbnRvXG4gICAgLy8gICAgdGhlIFpJUCwgd2hpY2ggaXMgdGhlIG9yaWdpbmFsIFwiaWNvbi9pbWFnZSBtaXNzaW5nXCIgYnVnLiBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBpY29uTWFwID0gYnVpbGRJY29uRmlsZW5hbWVNYXAoZGVza3RvcEZyYW1lKTtcbiAgICBjb25zdCBpY29uUm9vdElkcyA9IG5ldyBTZXQoaWNvbk1hcC5rZXlzKCkpO1xuICAgIGNvbnN0IGltYWdlTWFwID0gYnVpbGRJbWFnZUZpbGVuYW1lTWFwKGRlc2t0b3BGcmFtZSwgaWNvblJvb3RJZHMpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFBhcnNlIHNlY3Rpb25zIGZyb20gZGVza3RvcCBmcmFtZSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBzZWN0aW9ucyA9IHBhcnNlU2VjdGlvbnMoZGVza3RvcEZyYW1lLCBpY29uTWFwLCBpbWFnZU1hcCwgZ2xvYmFsTmFtZXMpO1xuICAgIGNvbnN0IHNlY3Rpb25Db3VudCA9IE9iamVjdC5rZXlzKHNlY3Rpb25zKS5sZW5ndGg7XG4gICAgdG90YWxTZWN0aW9ucyArPSBzZWN0aW9uQ291bnQ7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgTWVyZ2UgcmVzcG9uc2l2ZSBvdmVycmlkZXMgZnJvbSBtb2JpbGUgZnJhbWUgXHUyNTAwXHUyNTAwXG4gICAgaWYgKHBhaXIubW9iaWxlKSB7XG4gICAgICBjb25zdCBtb2JpbGVOb2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQocGFpci5tb2JpbGUuZnJhbWVJZCk7XG4gICAgICBpZiAobW9iaWxlTm9kZSAmJiBtb2JpbGVOb2RlLnR5cGUgPT09ICdGUkFNRScpIHtcbiAgICAgICAgY29uc3QgbW9iaWxlRnJhbWUgPSBtb2JpbGVOb2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgICAgY29uc3QgbW9iaWxlSWNvbk1hcCA9IGJ1aWxkSWNvbkZpbGVuYW1lTWFwKG1vYmlsZUZyYW1lKTtcbiAgICAgICAgY29uc3QgbW9iaWxlSWNvblJvb3RJZHMgPSBuZXcgU2V0KG1vYmlsZUljb25NYXAua2V5cygpKTtcbiAgICAgICAgY29uc3QgbW9iaWxlSW1hZ2VNYXAgPSBidWlsZEltYWdlRmlsZW5hbWVNYXAobW9iaWxlRnJhbWUsIG1vYmlsZUljb25Sb290SWRzKTtcbiAgICAgICAgY29uc3QgbW9iaWxlU2VjdGlvbnMgPSBwYXJzZVNlY3Rpb25zKG1vYmlsZUZyYW1lLCBtb2JpbGVJY29uTWFwLCBtb2JpbGVJbWFnZU1hcCwgZ2xvYmFsTmFtZXMpO1xuICAgICAgICBtZXJnZVJlc3BvbnNpdmVEYXRhKHNlY3Rpb25zLCBtb2JpbGVTZWN0aW9ucywgcGFpci5tb2JpbGUud2lkdGgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBDb2xsZWN0IHRva2VucyBmb3IgdGhpcyBwYWdlIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGNvbG9ycyA9IGNvbGxlY3RDb2xvcnMoZGVza3RvcEZyYW1lKTtcbiAgICBjb25zdCBmb250cyA9IGNvbGxlY3RGb250cyhkZXNrdG9wRnJhbWUpO1xuICAgIGNvbnN0IHNwYWNpbmcgPSBjb2xsZWN0U3BhY2luZyhkZXNrdG9wRnJhbWUpO1xuXG4gICAgLy8gQnVpbGQgcGFnZSB0b2tlbnNcbiAgICBjb25zdCBwYWdlVG9rZW5zOiBQYWdlVG9rZW5zID0ge1xuICAgICAgY29sb3JzLFxuICAgICAgZm9udHM6IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgT2JqZWN0LmVudHJpZXMoZm9udHMpLm1hcCgoW2ZhbWlseSwgZGF0YV0pID0+IFtmYW1pbHksIHtcbiAgICAgICAgICBzdHlsZXM6IFsuLi5kYXRhLnN0eWxlc10sXG4gICAgICAgICAgc2l6ZXM6IFsuLi5kYXRhLnNpemVzXS5zb3J0KChhLCBiKSA9PiBhIC0gYiksXG4gICAgICAgICAgY291bnQ6IGRhdGEuY291bnQsXG4gICAgICAgIH1dKVxuICAgICAgKSxcbiAgICAgIHNwYWNpbmcsXG4gICAgICBzZWN0aW9uczogYnVpbGRUb2tlblNlY3Rpb25zKGRlc2t0b3BGcmFtZSwgcGFpci5wYWdlU2x1ZyksXG4gICAgfTtcblxuICAgIC8vIE1lcmdlIGludG8gZ2xvYmFsIHRva2Vuc1xuICAgIGZvciAoY29uc3QgW2hleCwgY291bnRdIG9mIE9iamVjdC5lbnRyaWVzKGNvbG9ycykpIHtcbiAgICAgIGlmIChjb3VudCA+PSAyKSB7XG4gICAgICAgIGNvbnN0IHZhck5hbWUgPSBgLS1jbHItJHtoZXguc2xpY2UoMSkudG9Mb3dlckNhc2UoKX1gO1xuICAgICAgICBhbGxEZXNpZ25Ub2tlbkNvbG9yc1t2YXJOYW1lXSA9IGhleDtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBbZmFtaWx5LCBkYXRhXSBvZiBPYmplY3QuZW50cmllcyhmb250cykpIHtcbiAgICAgIGFsbERlc2lnblRva2VuRm9udHNbZmFtaWx5XSA9IHtcbiAgICAgICAgc3R5bGVzOiBbLi4uZGF0YS5zdHlsZXNdLFxuICAgICAgICBzaXplczogWy4uLmRhdGEuc2l6ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKSxcbiAgICAgICAgY291bnQ6IGRhdGEuY291bnQsXG4gICAgICB9O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHMgb2Ygc3BhY2luZykge1xuICAgICAgYWxsU3BhY2luZ1ZhbHVlcy5hZGQocy52YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEV4cG9ydCBpbWFnZXMgYW5kIHNjcmVlbnNob3RzIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGV4cG9ydFRhc2tzID0gYnVpbGRFeHBvcnRUYXNrcyhkZXNrdG9wRnJhbWUsIHBhaXIucGFnZVNsdWcsIGljb25NYXAsIGltYWdlTWFwKTtcbiAgICBjb25zdCBhc3NldENvdW50ID0gZXhwb3J0VGFza3MuZmlsdGVyKHQgPT4gdC50eXBlID09PSAnYXNzZXQnKS5sZW5ndGg7XG4gICAgdG90YWxJbWFnZXMgKz0gYXNzZXRDb3VudDtcblxuICAgIGNvbnN0IHBhZ2VGYWlsdXJlcyA9IGF3YWl0IGV4ZWN1dGVCYXRjaEV4cG9ydChcbiAgICAgIGV4cG9ydFRhc2tzLFxuICAgICAgKGN1cnJlbnQsIHRvdGFsLCBsYWJlbCkgPT4ge1xuICAgICAgICBzZW5kTWVzc2FnZSh7IHR5cGU6ICdFWFBPUlRfUFJPR1JFU1MnLCBjdXJyZW50LCB0b3RhbCwgbGFiZWwgfSk7XG4gICAgICB9LFxuICAgICAgKHRhc2ssIGRhdGEpID0+IHtcbiAgICAgICAgaWYgKHRhc2sudHlwZSA9PT0gJ3NjcmVlbnNob3QnIHx8IHRhc2sudHlwZSA9PT0gJ2Z1bGwtcGFnZScpIHtcbiAgICAgICAgICBzZW5kTWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiAnU0NSRUVOU0hPVF9EQVRBJyxcbiAgICAgICAgICAgIHBhdGg6IGAke3Rhc2sucGFnZVBhdGh9L3NjcmVlbnNob3RzYCxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB0YXNrLmZpbGVuYW1lLFxuICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZW5kTWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiAnSU1BR0VfREFUQScsXG4gICAgICAgICAgICBwYXRoOiBgJHt0YXNrLnBhZ2VQYXRofS9pbWFnZXNgLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHRhc2suZmlsZW5hbWUsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgc2hvdWxkQ2FuY2VsLFxuICAgICk7XG4gICAgYWxsRmFpbGVkRXhwb3J0cy5wdXNoKC4uLnBhZ2VGYWlsdXJlcyk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgUGF0Y2ggaWNvbkZpbGUgcmVmZXJlbmNlcyBmb3IgZmFpbGVkL2ZhbGxiYWNrIFNWRyBleHBvcnRzLlxuICAgIC8vICAgIElmIFNWRyBleHBvcnQgZmFpbGVkIGJ1dCBQTkcgZmFsbGJhY2sgc3VjY2VlZGVkLCByZWRpcmVjdFxuICAgIC8vICAgIGljb25GaWxlIHRvIHRoZSAucG5nLiBJZiBib3RoIGZhaWxlZCwgZHJvcCBpY29uRmlsZSAoYWx0IHRleHRcbiAgICAvLyAgICBzdGlsbCBzdXJ2aXZlcyBzbyB0aGUgYWdlbnQgaGFzIGEgdGV4dHVhbCBjdWUpLiBcdTI1MDBcdTI1MDBcbiAgICBpZiAocGFnZUZhaWx1cmVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGZhbGxiYWNrTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgICAgIGNvbnN0IGRyb3BwZWRTZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIGZvciAoY29uc3QgZiBvZiBwYWdlRmFpbHVyZXMpIHtcbiAgICAgICAgaWYgKGYuZmFsbGJhY2tGaWxlbmFtZSkgZmFsbGJhY2tNYXAuc2V0KGYuZmlsZW5hbWUsIGYuZmFsbGJhY2tGaWxlbmFtZSk7XG4gICAgICAgIGVsc2UgZHJvcHBlZFNldC5hZGQoZi5maWxlbmFtZSk7XG4gICAgICB9XG4gICAgICBwYXRjaEljb25SZWZlcmVuY2VzKHNlY3Rpb25zLCBmYWxsYmFja01hcCwgZHJvcHBlZFNldCk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIHNlY3Rpb24tc3BlY3MuanNvbiAobm93IHdpdGggcGF0Y2hlZCBpY29uRmlsZSByZWZzKSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBzZWN0aW9uU3BlY3M6IFNlY3Rpb25TcGVjcyA9IHtcbiAgICAgIGZpZ21hX2NhbnZhc193aWR0aDogTWF0aC5yb3VuZChkZXNrdG9wRnJhbWUud2lkdGgpLFxuICAgICAgZmlnbWFfY2FudmFzX2hlaWdodDogTWF0aC5yb3VuZChkZXNrdG9wRnJhbWUuaGVpZ2h0KSxcbiAgICAgIG1vYmlsZV9jYW52YXNfd2lkdGg6IHBhaXIubW9iaWxlPy53aWR0aCxcbiAgICAgIHBhZ2Vfc2x1ZzogcGFpci5wYWdlU2x1ZyxcbiAgICAgIGV4dHJhY3RlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgZXh0cmFjdGlvbl9tZXRob2Q6ICdwbHVnaW4nLFxuICAgICAgc2VjdGlvbnMsXG4gICAgfTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBHZW5lcmF0ZSBzcGVjLm1kIEFGVEVSIHBhdGNoZXMgc28gaXQgbWF0Y2hlcyBzZWN0aW9uLXNwZWNzIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHNwZWNNZCA9IGdlbmVyYXRlU3BlY01kKHBhaXIucGFnZU5hbWUsIHBhaXIucGFnZVNsdWcsIHNlY3Rpb25TcGVjcywgcGFnZVRva2Vucyk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgU2VuZCBwYWdlIGRhdGEgdG8gVUkgKHBvc3QtZXhwb3J0IHNvIGljb25GaWxlIHJlZnMgYXJlIGFjY3VyYXRlKSBcdTI1MDBcdTI1MDBcbiAgICBzZW5kTWVzc2FnZSh7XG4gICAgICB0eXBlOiAnUEFHRV9EQVRBJyxcbiAgICAgIHBhZ2VTbHVnOiBwYWlyLnBhZ2VTbHVnLFxuICAgICAgc2VjdGlvblNwZWNzLFxuICAgICAgc3BlY01kLFxuICAgICAgdG9rZW5zOiBwYWdlVG9rZW5zLFxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIGFuZCBzZW5kIGltYWdlIG1hcCBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBzZWN0aW9uQ2hpbGRyZW4gPSBkZXNrdG9wRnJhbWUuY2hpbGRyZW5cbiAgICAgIC5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlKVxuICAgICAgLm1hcChjID0+ICh7IG5hbWU6IGMubmFtZSwgY2hpbGRyZW46ICdjaGlsZHJlbicgaW4gYyA/IFsuLi4oYyBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuXSA6IFtdIH0pKTtcbiAgICBjb25zdCBpbWFnZU1hcEpzb24gPSBidWlsZEltYWdlTWFwKGV4cG9ydFRhc2tzLCBzZWN0aW9uQ2hpbGRyZW4sIGljb25NYXAsIGltYWdlTWFwKTtcbiAgICBzZW5kTWVzc2FnZSh7XG4gICAgICB0eXBlOiAnSU1BR0VfTUFQX0RBVEEnLFxuICAgICAgcGF0aDogYHBhZ2VzLyR7cGFpci5wYWdlU2x1Z30vaW1hZ2VzYCxcbiAgICAgIGltYWdlTWFwOiBpbWFnZU1hcEpzb24sXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQnVpbGQgbWFuaWZlc3QgcGFnZSBlbnRyeSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBoYXNGdWxsUGFnZSA9IGV4cG9ydFRhc2tzLnNvbWUodCA9PiB0LnR5cGUgPT09ICdmdWxsLXBhZ2UnKTtcbiAgICBtYW5pZmVzdFBhZ2VzLnB1c2goe1xuICAgICAgc2x1ZzogcGFpci5wYWdlU2x1ZyxcbiAgICAgIGZyYW1lTmFtZTogcGFpci5kZXNrdG9wLmZyYW1lTmFtZSxcbiAgICAgIGZyYW1lSWQ6IHBhaXIuZGVza3RvcC5mcmFtZUlkLFxuICAgICAgY2FudmFzV2lkdGg6IE1hdGgucm91bmQoZGVza3RvcEZyYW1lLndpZHRoKSxcbiAgICAgIGNhbnZhc0hlaWdodDogTWF0aC5yb3VuZChkZXNrdG9wRnJhbWUuaGVpZ2h0KSxcbiAgICAgIHNlY3Rpb25Db3VudCxcbiAgICAgIGltYWdlQ291bnQ6IGFzc2V0Q291bnQsXG4gICAgICBoYXNSZXNwb25zaXZlOiBwYWlyLm1vYmlsZSAhPT0gbnVsbCxcbiAgICAgIG1vYmlsZUZyYW1lSWQ6IHBhaXIubW9iaWxlPy5mcmFtZUlkID8/IG51bGwsXG4gICAgICBpbnRlcmFjdGlvbkNvdW50OiBPYmplY3QudmFsdWVzKHNlY3Rpb25zKVxuICAgICAgICAucmVkdWNlKChzdW0sIHMpID0+IHN1bSArIChzLmludGVyYWN0aW9ucz8ubGVuZ3RoID8/IDApLCAwKSxcbiAgICAgIGhhc0Z1bGxQYWdlU2NyZWVuc2hvdDogaGFzRnVsbFBhZ2UsXG4gICAgICBmdWxsUGFnZVNjcmVlbnNob3RGaWxlOiBoYXNGdWxsUGFnZSA/ICdfZnVsbC1wYWdlLnBuZycgOiBudWxsLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIGZpbmFsIG1hbmlmZXN0IGFuZCBnbG9iYWwgdG9rZW5zIFx1MjUwMFx1MjUwMFxuICBjb25zdCBtYW5pZmVzdDogRXhwb3J0TWFuaWZlc3QgPSB7XG4gICAgZXhwb3J0VmVyc2lvbjogJzEuMCcsXG4gICAgZXhwb3J0RGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIGZpZ21hRmlsZU5hbWU6IGZpZ21hLnJvb3QubmFtZSxcbiAgICBmaWdtYUZpbGVLZXk6IGZpZ21hLmZpbGVLZXkgPz8gJycsXG4gICAgcGx1Z2luVmVyc2lvbjogJzEuMC4wJyxcbiAgICBwYWdlczogbWFuaWZlc3RQYWdlcyxcbiAgICB0b3RhbFNlY3Rpb25zLFxuICAgIHRvdGFsSW1hZ2VzLFxuICAgIGRlc2lnblRva2Vuc1N1bW1hcnk6IHtcbiAgICAgIGNvbG9yQ291bnQ6IE9iamVjdC5rZXlzKGFsbERlc2lnblRva2VuQ29sb3JzKS5sZW5ndGgsXG4gICAgICBmb250Q291bnQ6IE9iamVjdC5rZXlzKGFsbERlc2lnblRva2VuRm9udHMpLmxlbmd0aCxcbiAgICAgIHNwYWNpbmdWYWx1ZXM6IGFsbFNwYWNpbmdWYWx1ZXMuc2l6ZSxcbiAgICB9LFxuICAgIGZhaWxlZEV4cG9ydHM6IGFsbEZhaWxlZEV4cG9ydHMubGVuZ3RoID4gMCA/IGFsbEZhaWxlZEV4cG9ydHMgOiB1bmRlZmluZWQsXG4gIH07XG5cbiAgLy8gRmlnbWEgVmFyaWFibGVzIChhdXRob3JpdGF0aXZlIHRva2VuIG5hbWVzIHdoZW4gYXZhaWxhYmxlKVxuICBjb25zdCB2YXJpYWJsZXMgPSBleHRyYWN0VmFyaWFibGVzKCk7XG5cbiAgY29uc3QgZGVzaWduVG9rZW5zOiBEZXNpZ25Ub2tlbnMgPSB7XG4gICAgY29sb3JzOiBhbGxEZXNpZ25Ub2tlbkNvbG9ycyxcbiAgICBmb250czogYWxsRGVzaWduVG9rZW5Gb250cyxcbiAgICBzcGFjaW5nOiBbLi4uYWxsU3BhY2luZ1ZhbHVlc10uc29ydCgoYSwgYikgPT4gYSAtIGIpLFxuICAgIHZhcmlhYmxlczogdmFyaWFibGVzLnByZXNlbnQgPyB2YXJpYWJsZXMgOiB1bmRlZmluZWQsXG4gIH07XG5cbiAgLy8gV2hlbiBGaWdtYSBWYXJpYWJsZXMgYXJlIGF2YWlsYWJsZSwgcHJlZmVyIHZhcmlhYmxlIG5hbWVzIGZvciBjb2xvcnM6XG4gIC8vIG92ZXJ3cml0ZSB0aGUgYXV0by1nZW5lcmF0ZWQgLS1jbHItPGhleD4gd2l0aCAtLWNsci08dmFyaWFibGUtbmFtZT5cbiAgaWYgKHZhcmlhYmxlcy5wcmVzZW50KSB7XG4gICAgZm9yIChjb25zdCBbY29sTmFtZSwgdmFyc10gb2YgT2JqZWN0LmVudHJpZXModmFyaWFibGVzLmNvbGxlY3Rpb25zKSkge1xuICAgICAgaWYgKCFjb2xOYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2NvbG9yJykpIGNvbnRpbnVlO1xuICAgICAgZm9yIChjb25zdCBbdmFyTmFtZSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHZhcnMpKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnIHx8ICF2YWx1ZS5zdGFydHNXaXRoKCcjJykpIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBzYWZlTmFtZSA9IHZhck5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtejAtOV0rL2csICctJykucmVwbGFjZSgvLSsvZywgJy0nKS5yZXBsYWNlKC9eLXwtJC9nLCAnJyk7XG4gICAgICAgIGNvbnN0IGNzc1ZhciA9IGAtLWNsci0ke3NhZmVOYW1lfWA7XG4gICAgICAgIGFsbERlc2lnblRva2VuQ29sb3JzW2Nzc1Zhcl0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZGVzaWduVG9rZW5zLmNvbG9ycyA9IGFsbERlc2lnblRva2VuQ29sb3JzO1xuICB9XG5cbiAgLy8gQnVpbGQgcmVzcG9uc2l2ZSBtYXAgZnJvbSB0aGUgcGFpcnNcbiAgY29uc3QgcmVzcG9uc2l2ZU1hcCA9IG1hdGNoUmVzcG9uc2l2ZUZyYW1lcyhcbiAgICByZXNwb25zaXZlUGFpcnMuZmxhdE1hcChwID0+IHtcbiAgICAgIGNvbnN0IGZyYW1lcyA9IFt7XG4gICAgICAgIGlkOiBwLmRlc2t0b3AuZnJhbWVJZCxcbiAgICAgICAgbmFtZTogcC5kZXNrdG9wLmZyYW1lTmFtZSxcbiAgICAgICAgd2lkdGg6IHAuZGVza3RvcC53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICBicmVha3BvaW50OiAnZGVza3RvcCcgYXMgY29uc3QsXG4gICAgICAgIHNlY3Rpb25Db3VudDogMCxcbiAgICAgICAgaGFzQXV0b0xheW91dDogZmFsc2UsXG4gICAgICAgIHJlc3BvbnNpdmVQYWlySWQ6IG51bGwsXG4gICAgICB9XTtcbiAgICAgIGlmIChwLm1vYmlsZSkge1xuICAgICAgICBmcmFtZXMucHVzaCh7XG4gICAgICAgICAgaWQ6IHAubW9iaWxlLmZyYW1lSWQsXG4gICAgICAgICAgbmFtZTogcC5tb2JpbGUuZnJhbWVOYW1lLFxuICAgICAgICAgIHdpZHRoOiBwLm1vYmlsZS53aWR0aCxcbiAgICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgICAgYnJlYWtwb2ludDogJ21vYmlsZScgYXMgY29uc3QsXG4gICAgICAgICAgc2VjdGlvbkNvdW50OiAwLFxuICAgICAgICAgIGhhc0F1dG9MYXlvdXQ6IGZhbHNlLFxuICAgICAgICAgIHJlc3BvbnNpdmVQYWlySWQ6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZyYW1lcztcbiAgICB9KVxuICApO1xuXG4gIHNlbmRNZXNzYWdlKHtcbiAgICB0eXBlOiAnRVhQT1JUX0NPTVBMRVRFJyxcbiAgICBtYW5pZmVzdCxcbiAgICByZXNwb25zaXZlTWFwLFxuICAgIGRlc2lnblRva2VucyxcbiAgfSk7XG59XG5cbi8qKlxuICogTWVyZ2UgcmVzcG9uc2l2ZSBvdmVycmlkZXMgZnJvbSBtb2JpbGUgc2VjdGlvbnMgaW50byBkZXNrdG9wIHNlY3Rpb25zLlxuICogT25seSBpbmNsdWRlcyBwcm9wZXJ0aWVzIHRoYXQgZGlmZmVyIGJldHdlZW4gZGVza3RvcCBhbmQgbW9iaWxlLlxuICovXG5mdW5jdGlvbiBtZXJnZVJlc3BvbnNpdmVEYXRhKFxuICBkZXNrdG9wU2VjdGlvbnM6IFJlY29yZDxzdHJpbmcsIFNlY3Rpb25TcGVjPixcbiAgbW9iaWxlU2VjdGlvbnM6IFJlY29yZDxzdHJpbmcsIFNlY3Rpb25TcGVjPixcbiAgbW9iaWxlV2lkdGg6IG51bWJlcixcbik6IHZvaWQge1xuICBjb25zdCBicEtleSA9IFN0cmluZyhtb2JpbGVXaWR0aCk7XG5cbiAgZm9yIChjb25zdCBbbGF5b3V0TmFtZSwgZGVza3RvcFNwZWNdIG9mIE9iamVjdC5lbnRyaWVzKGRlc2t0b3BTZWN0aW9ucykpIHtcbiAgICBjb25zdCBtb2JpbGVTcGVjID0gbW9iaWxlU2VjdGlvbnNbbGF5b3V0TmFtZV07XG4gICAgaWYgKCFtb2JpbGVTcGVjKSBjb250aW51ZTtcblxuICAgIGNvbnN0IG92ZXJyaWRlOiBSZXNwb25zaXZlT3ZlcnJpZGUgPSB7fTtcblxuICAgIC8vIERpZmYgc2VjdGlvbiBzdHlsZXNcbiAgICBjb25zdCBzZWN0aW9uRGlmZjogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgIGZvciAoY29uc3QgW2tleSwgZGVza3RvcFZhbF0gb2YgT2JqZWN0LmVudHJpZXMoZGVza3RvcFNwZWMuc2VjdGlvbikpIHtcbiAgICAgIGNvbnN0IG1vYmlsZVZhbCA9IChtb2JpbGVTcGVjLnNlY3Rpb24gYXMgYW55KVtrZXldO1xuICAgICAgaWYgKG1vYmlsZVZhbCAmJiBtb2JpbGVWYWwgIT09IGRlc2t0b3BWYWwpIHtcbiAgICAgICAgc2VjdGlvbkRpZmZba2V5XSA9IG1vYmlsZVZhbDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKE9iamVjdC5rZXlzKHNlY3Rpb25EaWZmKS5sZW5ndGggPiAwKSB7XG4gICAgICBvdmVycmlkZS5zZWN0aW9uID0gc2VjdGlvbkRpZmY7XG4gICAgfVxuXG4gICAgLy8gRGlmZiBlbGVtZW50IHN0eWxlc1xuICAgIGNvbnN0IGVsZW1lbnRzRGlmZjogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgYW55Pj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtlbGVtTmFtZSwgZGVza3RvcEVsZW1dIG9mIE9iamVjdC5lbnRyaWVzKGRlc2t0b3BTcGVjLmVsZW1lbnRzKSkge1xuICAgICAgY29uc3QgbW9iaWxlRWxlbSA9IG1vYmlsZVNwZWMuZWxlbWVudHNbZWxlbU5hbWVdO1xuICAgICAgaWYgKCFtb2JpbGVFbGVtKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgZGlmZjogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgICAgZm9yIChjb25zdCBba2V5LCBkZXNrdG9wVmFsXSBvZiBPYmplY3QuZW50cmllcyhkZXNrdG9wRWxlbSkpIHtcbiAgICAgICAgY29uc3QgbW9iaWxlVmFsID0gKG1vYmlsZUVsZW0gYXMgYW55KVtrZXldO1xuICAgICAgICBpZiAobW9iaWxlVmFsICE9PSB1bmRlZmluZWQgJiYgbW9iaWxlVmFsICE9PSBkZXNrdG9wVmFsKSB7XG4gICAgICAgICAgZGlmZltrZXldID0gbW9iaWxlVmFsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoT2JqZWN0LmtleXMoZGlmZikubGVuZ3RoID4gMCkge1xuICAgICAgICBlbGVtZW50c0RpZmZbZWxlbU5hbWVdID0gZGlmZjtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKE9iamVjdC5rZXlzKGVsZW1lbnRzRGlmZikubGVuZ3RoID4gMCkge1xuICAgICAgb3ZlcnJpZGUuZWxlbWVudHMgPSBlbGVtZW50c0RpZmY7XG4gICAgfVxuXG4gICAgLy8gRGlmZiBncmlkXG4gICAgaWYgKG1vYmlsZVNwZWMuZ3JpZC5jb2x1bW5zICE9PSBkZXNrdG9wU3BlYy5ncmlkLmNvbHVtbnMgfHwgbW9iaWxlU3BlYy5ncmlkLmdhcCAhPT0gZGVza3RvcFNwZWMuZ3JpZC5nYXApIHtcbiAgICAgIG92ZXJyaWRlLmdyaWQgPSB7fTtcbiAgICAgIGlmIChtb2JpbGVTcGVjLmdyaWQuY29sdW1ucyAhPT0gZGVza3RvcFNwZWMuZ3JpZC5jb2x1bW5zKSB7XG4gICAgICAgIG92ZXJyaWRlLmdyaWQuY29sdW1ucyA9IG1vYmlsZVNwZWMuZ3JpZC5jb2x1bW5zO1xuICAgICAgfVxuICAgICAgaWYgKG1vYmlsZVNwZWMuZ3JpZC5nYXAgIT09IGRlc2t0b3BTcGVjLmdyaWQuZ2FwKSB7XG4gICAgICAgIG92ZXJyaWRlLmdyaWQuZ2FwID0gbW9iaWxlU3BlYy5ncmlkLmdhcDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0LmtleXMob3ZlcnJpZGUpLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmICghZGVza3RvcFNwZWMucmVzcG9uc2l2ZSkgZGVza3RvcFNwZWMucmVzcG9uc2l2ZSA9IHt9O1xuICAgICAgZGVza3RvcFNwZWMucmVzcG9uc2l2ZVticEtleV0gPSBvdmVycmlkZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZCB0b2tlbiBzZWN0aW9uIG1ldGFkYXRhIGZvciB0b2tlbnMuanNvbi5cbiAqL1xuZnVuY3Rpb24gYnVpbGRUb2tlblNlY3Rpb25zKGZyYW1lOiBGcmFtZU5vZGUsIHBhZ2VTbHVnOiBzdHJpbmcpIHtcbiAgY29uc3Qgc2VjdGlvbnMgPSBmcmFtZS5jaGlsZHJlblxuICAgIC5maWx0ZXIoYyA9PlxuICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3hcbiAgICApXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueSk7XG5cbiAgcmV0dXJuIHNlY3Rpb25zLm1hcCgocywgaSkgPT4ge1xuICAgIGNvbnN0IGJvdW5kcyA9IHMuYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gICAgY29uc3QgcGFyZW50Qm91bmRzID0gZnJhbWUuYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gICAgY29uc3QgaW1hZ2VDb3VudCA9IGNvdW50SW1hZ2VzKHMpO1xuICAgIGNvbnN0IHRleHROb2RlcyA9IGNvdW50VGV4dE5vZGVzKHMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGluZGV4OiBpICsgMSxcbiAgICAgIG5hbWU6IHMubmFtZSxcbiAgICAgIGlkOiBzLmlkLFxuICAgICAgZGltZW5zaW9uczogeyB3aWR0aDogTWF0aC5yb3VuZChib3VuZHMud2lkdGgpLCBoZWlnaHQ6IE1hdGgucm91bmQoYm91bmRzLmhlaWdodCkgfSxcbiAgICAgIHlfb2Zmc2V0OiBNYXRoLnJvdW5kKGJvdW5kcy55IC0gcGFyZW50Qm91bmRzLnkpLFxuICAgICAgaGFzQXV0b0xheW91dDogcy50eXBlID09PSAnRlJBTUUnICYmIChzIGFzIEZyYW1lTm9kZSkubGF5b3V0TW9kZSAhPT0gdW5kZWZpbmVkICYmIChzIGFzIEZyYW1lTm9kZSkubGF5b3V0TW9kZSAhPT0gJ05PTkUnLFxuICAgICAgaW1hZ2VfY291bnQ6IGltYWdlQ291bnQsXG4gICAgICBpbWFnZV9maWxlczogY29sbGVjdEltYWdlRmlsZU5hbWVzKHMpLFxuICAgICAgdGV4dF9ub2RlczogdGV4dE5vZGVzLFxuICAgICAgc2NyZWVuc2hvdDogYHNjcmVlbnNob3RzLyR7c2x1Z2lmeShzLm5hbWUpfS5wbmdgLFxuICAgICAgc2NyZWVuc2hvdF9jb21wbGV0ZTogdHJ1ZSxcbiAgICB9O1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY291bnRJbWFnZXMobm9kZTogU2NlbmVOb2RlKTogbnVtYmVyIHtcbiAgbGV0IGNvdW50ID0gMDtcbiAgZnVuY3Rpb24gd2FsayhuOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAoJ2ZpbGxzJyBpbiBuICYmIEFycmF5LmlzQXJyYXkoKG4gYXMgYW55KS5maWxscykpIHtcbiAgICAgIGlmICgobiBhcyBhbnkpLmZpbGxzLnNvbWUoKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSkpIGNvdW50Kys7XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG4pIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG4gYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikgd2FsayhjaGlsZCk7XG4gICAgfVxuICB9XG4gIHdhbGsobm9kZSk7XG4gIHJldHVybiBjb3VudDtcbn1cblxuLyoqXG4gKiBQcmUtY29tcHV0ZSB0aGUgc2V0IG9mIG5vcm1hbGl6ZWQgc2VjdGlvbiBuYW1lcyB0aGF0IGFwcGVhciBvbiBcdTIyNjUyIHNlbGVjdGVkXG4gKiBwYWdlcy4gTWF0Y2hpbmcgc2VjdGlvbnMgd2lsbCBiZSBtYXJrZWQgYGlzR2xvYmFsOiB0cnVlYCBieSBwYXJzZVNlY3Rpb25zXG4gKiBzbyB0aGUgV1AgYWdlbnQgY2FuIGhvaXN0IHRoZW0gaW50byBoZWFkZXIucGhwIC8gZm9vdGVyLnBocCAvIHRlbXBsYXRlLXBhcnRzXG4gKiByYXRoZXIgdGhhbiBpbmxpbmluZyB0aGUgc2FtZSBtYXJrdXAgb24gZXZlcnkgcGFnZS5cbiAqXG4gKiBUaGUgc2NhbiBtaXJyb3JzIGlkZW50aWZ5U2VjdGlvbnMgKGRyaWxscyBvbmUgd3JhcHBlciBkZWVwIHdoZW4gdGhlIHBhZ2VcbiAqIGhhcyBhIHNpbmdsZSBjb250YWluZXIgY2hpbGQpIHNvIHRoZSBtYXRjaGluZyBzdGF5cyBjb25zaXN0ZW50IHdpdGggd2hhdFxuICogcGFyc2VTZWN0aW9ucyBhY3R1YWxseSB0cmVhdHMgYXMgYSBcInNlY3Rpb25cIi5cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUdsb2JhbFNlY3Rpb25OYW1lcyhwYWlyczogUmVzcG9uc2l2ZVBhaXJbXSk6IFNldDxzdHJpbmc+IHtcbiAgY29uc3QgbmFtZVRvUGFnZUNvdW50ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICBmb3IgKGNvbnN0IHBhaXIgb2YgcGFpcnMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgbm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKHBhaXIuZGVza3RvcC5mcmFtZUlkKTtcbiAgICAgIGlmICghbm9kZSB8fCBub2RlLnR5cGUgIT09ICdGUkFNRScpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgZnJhbWUgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgIGxldCBjYW5kaWRhdGVzID0gZnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJylcbiAgICAgICk7XG4gICAgICBpZiAoY2FuZGlkYXRlcy5sZW5ndGggPT09IDEgJiYgJ2NoaWxkcmVuJyBpbiBjYW5kaWRhdGVzWzBdKSB7XG4gICAgICAgIGNvbnN0IGlubmVyID0gKGNhbmRpZGF0ZXNbMF0gYXMgRnJhbWVOb2RlKS5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgICAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJylcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGlubmVyLmxlbmd0aCA+IDEpIGNhbmRpZGF0ZXMgPSBpbm5lcjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNlZW5PblRoaXNQYWdlID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBmb3IgKGNvbnN0IGMgb2YgY2FuZGlkYXRlcykge1xuICAgICAgICBjb25zdCBrZXkgPSBub3JtYWxpemVTZWN0aW9uTmFtZShjLm5hbWUgfHwgJycpO1xuICAgICAgICBpZiAoIWtleSkgY29udGludWU7XG4gICAgICAgIHNlZW5PblRoaXNQYWdlLmFkZChrZXkpO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBuYW1lIG9mIHNlZW5PblRoaXNQYWdlKSB7XG4gICAgICAgIG5hbWVUb1BhZ2VDb3VudC5zZXQobmFtZSwgKG5hbWVUb1BhZ2VDb3VudC5nZXQobmFtZSkgfHwgMCkgKyAxKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ2NvbXB1dGVHbG9iYWxTZWN0aW9uTmFtZXM6IGZhaWxlZCB0byBzY2FuIGZyYW1lJywgcGFpci5wYWdlTmFtZSwgZSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgb3V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgW25hbWUsIGNvdW50XSBvZiBuYW1lVG9QYWdlQ291bnQpIHtcbiAgICBpZiAoY291bnQgPj0gMikgb3V0LmFkZChuYW1lKTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0SW1hZ2VGaWxlTmFtZXMobm9kZTogU2NlbmVOb2RlKTogc3RyaW5nW10ge1xuICBjb25zdCBuYW1lczogc3RyaW5nW10gPSBbXTtcbiAgZnVuY3Rpb24gd2FsayhuOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAoJ2ZpbGxzJyBpbiBuICYmIEFycmF5LmlzQXJyYXkoKG4gYXMgYW55KS5maWxscykpIHtcbiAgICAgIGlmICgobiBhcyBhbnkpLmZpbGxzLnNvbWUoKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSkpIHtcbiAgICAgICAgbmFtZXMucHVzaChgJHtzbHVnaWZ5KG4ubmFtZSl9LnBuZ2ApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoY2hpbGQpO1xuICAgIH1cbiAgfVxuICB3YWxrKG5vZGUpO1xuICByZXR1cm4gbmFtZXM7XG59XG5cbi8qKlxuICogV2FsayBldmVyeSBlbGVtZW50IGluIHRoZSBzZWN0aW9uIG1hcCBhbmQgcmVjb25jaWxlIGBpY29uRmlsZWAgYWdhaW5zdFxuICogdGhlIHBvc3QtZXhwb3J0IHJlYWxpdHk6XG4gKiAgIC0gSWYgdGhlIC5zdmcgZmVsbCBiYWNrIHRvIC5wbmcsIHJld3JpdGUgaWNvbkZpbGUgdG8gdGhlIC5wbmcgZmlsZW5hbWUuXG4gKiAgIC0gSWYgdGhlIGV4cG9ydCBmYWlsZWQgZW50aXJlbHkgd2l0aCBubyBmYWxsYmFjaywgZHJvcCBpY29uRmlsZSBzbyB0aGVcbiAqICAgICBhZ2VudCBkb2Vzbid0IHJlZmVyZW5jZSBhIG5vbi1leGlzdGVudCBhc3NldCAoYWx0IHRleHQgc3RpbGxcbiAqICAgICBzdXJ2aXZlcyBhcyBhIHRleHR1YWwgY3VlKS5cbiAqL1xuZnVuY3Rpb24gcGF0Y2hJY29uUmVmZXJlbmNlcyhcbiAgc2VjdGlvbnM6IFJlY29yZDxzdHJpbmcsIFNlY3Rpb25TcGVjPixcbiAgZmFsbGJhY2tNYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4gIGRyb3BwZWRTZXQ6IFNldDxzdHJpbmc+LFxuKTogdm9pZCB7XG4gIGZvciAoY29uc3Qgc3BlYyBvZiBPYmplY3QudmFsdWVzKHNlY3Rpb25zKSkge1xuICAgIGZvciAoY29uc3QgZWxlbSBvZiBPYmplY3QudmFsdWVzKHNwZWMuZWxlbWVudHMpKSB7XG4gICAgICBjb25zdCBmID0gKGVsZW0gYXMgYW55KS5pY29uRmlsZSBhcyBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKCFmKSBjb250aW51ZTtcbiAgICAgIGlmIChmYWxsYmFja01hcC5oYXMoZikpIHtcbiAgICAgICAgKGVsZW0gYXMgYW55KS5pY29uRmlsZSA9IGZhbGxiYWNrTWFwLmdldChmKTtcbiAgICAgIH0gZWxzZSBpZiAoZHJvcHBlZFNldC5oYXMoZikpIHtcbiAgICAgICAgZGVsZXRlIChlbGVtIGFzIGFueSkuaWNvbkZpbGU7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGUgYSBodW1hbi1yZWFkYWJsZSBzcGVjLm1kIGZyb20gZXh0cmFjdGVkIGRhdGEuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlU3BlY01kKHBhZ2VOYW1lOiBzdHJpbmcsIHBhZ2VTbHVnOiBzdHJpbmcsIHNwZWNzOiBTZWN0aW9uU3BlY3MsIHRva2VuczogUGFnZVRva2Vucyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICBsaW5lcy5wdXNoKGAjIERlc2lnbiBTcGVjIFx1MjAxNCAke3BhZ2VOYW1lfWApO1xuICBsaW5lcy5wdXNoKGAjIyBTb3VyY2U6IEZpZ21hIFBsdWdpbiBFeHBvcnRgKTtcbiAgbGluZXMucHVzaChgIyMgR2VuZXJhdGVkOiAke3NwZWNzLmV4dHJhY3RlZF9hdH1gKTtcbiAgbGluZXMucHVzaCgnJyk7XG4gIGxpbmVzLnB1c2goJyMjIFBhZ2UgTWV0YWRhdGEnKTtcbiAgbGluZXMucHVzaChgLSBQYWdlIE5hbWU6ICR7cGFnZU5hbWV9YCk7XG4gIGxpbmVzLnB1c2goYC0gQ2FudmFzIFdpZHRoOiAke3NwZWNzLmZpZ21hX2NhbnZhc193aWR0aH1weGApO1xuICBsaW5lcy5wdXNoKGAtIFNlY3Rpb24gQ291bnQ6ICR7T2JqZWN0LmtleXMoc3BlY3Muc2VjdGlvbnMpLmxlbmd0aH1gKTtcbiAgaWYgKHNwZWNzLm1vYmlsZV9jYW52YXNfd2lkdGgpIHtcbiAgICBsaW5lcy5wdXNoKGAtIE1vYmlsZSBDYW52YXMgV2lkdGg6ICR7c3BlY3MubW9iaWxlX2NhbnZhc193aWR0aH1weGApO1xuICB9XG4gIGxpbmVzLnB1c2goJycpO1xuXG4gIC8vIENvbG9yc1xuICBsaW5lcy5wdXNoKCcjIyBDb2xvcnMgVXNlZCcpO1xuICBsaW5lcy5wdXNoKCd8IEhFWCB8IFVzYWdlIENvdW50IHwnKTtcbiAgbGluZXMucHVzaCgnfC0tLS0tfC0tLS0tLS0tLS0tLXwnKTtcbiAgY29uc3Qgc29ydGVkQ29sb3JzID0gT2JqZWN0LmVudHJpZXModG9rZW5zLmNvbG9ycykuc29ydCgoYSwgYikgPT4gYlsxXSAtIGFbMV0pO1xuICBmb3IgKGNvbnN0IFtoZXgsIGNvdW50XSBvZiBzb3J0ZWRDb2xvcnMuc2xpY2UoMCwgMjApKSB7XG4gICAgbGluZXMucHVzaChgfCAke2hleH0gfCAke2NvdW50fSB8YCk7XG4gIH1cbiAgbGluZXMucHVzaCgnJyk7XG5cbiAgLy8gVHlwb2dyYXBoeVxuICBsaW5lcy5wdXNoKCcjIyBUeXBvZ3JhcGh5IFVzZWQnKTtcbiAgbGluZXMucHVzaCgnfCBGb250IHwgU3R5bGVzIHwgU2l6ZXMgfCcpO1xuICBsaW5lcy5wdXNoKCd8LS0tLS0tfC0tLS0tLS0tfC0tLS0tLS18Jyk7XG4gIGZvciAoY29uc3QgW2ZhbWlseSwgaW5mb10gb2YgT2JqZWN0LmVudHJpZXModG9rZW5zLmZvbnRzKSkge1xuICAgIGxpbmVzLnB1c2goYHwgJHtmYW1pbHl9IHwgJHtpbmZvLnN0eWxlcy5qb2luKCcsICcpfSB8ICR7aW5mby5zaXplcy5qb2luKCcsICcpfXB4IHxgKTtcbiAgfVxuICBsaW5lcy5wdXNoKCcnKTtcblxuICAvLyBTZWN0aW9uc1xuICBsaW5lcy5wdXNoKCcjIyBTZWN0aW9ucycpO1xuICBsaW5lcy5wdXNoKCcnKTtcbiAgZm9yIChjb25zdCBbbGF5b3V0TmFtZSwgc3BlY10gb2YgT2JqZWN0LmVudHJpZXMoc3BlY3Muc2VjdGlvbnMpKSB7XG4gICAgbGluZXMucHVzaChgIyMjICR7bGF5b3V0TmFtZX1gKTtcbiAgICBsaW5lcy5wdXNoKGAtICoqU3BhY2luZyBTb3VyY2UqKjogJHtzcGVjLnNwYWNpbmdTb3VyY2V9YCk7XG4gICAgbGluZXMucHVzaChgLSAqKkJhY2tncm91bmQqKjogJHtzcGVjLnNlY3Rpb24uYmFja2dyb3VuZENvbG9yIHx8ICdub25lJ31gKTtcbiAgICBsaW5lcy5wdXNoKGAtICoqR3JpZCoqOiAke3NwZWMuZ3JpZC5sYXlvdXRNb2RlfSwgJHtzcGVjLmdyaWQuY29sdW1uc30gY29sdW1ucywgZ2FwOiAke3NwZWMuZ3JpZC5nYXAgfHwgJ25vbmUnfWApO1xuICAgIGlmIChzcGVjLmludGVyYWN0aW9ucyAmJiBzcGVjLmludGVyYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICBsaW5lcy5wdXNoKGAtICoqSW50ZXJhY3Rpb25zKio6ICR7c3BlYy5pbnRlcmFjdGlvbnMubGVuZ3RofSAoJHtzcGVjLmludGVyYWN0aW9ucy5tYXAoaSA9PiBpLnRyaWdnZXIpLmpvaW4oJywgJyl9KWApO1xuICAgIH1cbiAgICBpZiAoc3BlYy5vdmVybGFwKSB7XG4gICAgICBsaW5lcy5wdXNoKGAtICoqT3ZlcmxhcCoqOiAke3NwZWMub3ZlcmxhcC5waXhlbHN9cHggd2l0aCBcIiR7c3BlYy5vdmVybGFwLndpdGhTZWN0aW9ufVwiYCk7XG4gICAgfVxuICAgIGxpbmVzLnB1c2goJycpO1xuXG4gICAgLy8gRWxlbWVudHNcbiAgICBmb3IgKGNvbnN0IFtlbGVtTmFtZSwgZWxlbVN0eWxlc10gb2YgT2JqZWN0LmVudHJpZXMoc3BlYy5lbGVtZW50cykpIHtcbiAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmVudHJpZXMoZWxlbVN0eWxlcylcbiAgICAgICAgLmZpbHRlcigoWywgdl0pID0+IHYgIT09IG51bGwgJiYgdiAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAubWFwKChbaywgdl0pID0+IGAke2t9OiAke3Z9YClcbiAgICAgICAgLmpvaW4oJywgJyk7XG4gICAgICBsaW5lcy5wdXNoKGAgIC0gKioke2VsZW1OYW1lfSoqOiAke3Byb3BzfWApO1xuICAgIH1cbiAgICBsaW5lcy5wdXNoKCcnKTtcbiAgfVxuXG4gIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn1cbiIsICJpbXBvcnQgeyBVSVRvU2FuZGJveE1lc3NhZ2UgfSBmcm9tICcuL3NhbmRib3gvdHlwZXMnO1xuaW1wb3J0IHsgZGlzY292ZXJQYWdlcyB9IGZyb20gJy4vc2FuZGJveC9kaXNjb3ZlcnknO1xuaW1wb3J0IHsgcnVuQWxsVmFsaWRhdGlvbnMgfSBmcm9tICcuL3NhbmRib3gvdmFsaWRhdG9yJztcbmltcG9ydCB7IHJ1bkV4dHJhY3Rpb24gfSBmcm9tICcuL3NhbmRib3gvZXh0cmFjdG9yJztcblxuLy8gU2hvdyB0aGUgcGx1Z2luIFVJXG5maWdtYS5zaG93VUkoX19odG1sX18sIHsgd2lkdGg6IDY0MCwgaGVpZ2h0OiA1MjAgfSk7XG5jb25zb2xlLmxvZyhcIldQIFRoZW1lIEJ1aWxkZXIgRXhwb3J0OiBQbHVnaW4gaW5pdGlhbGl6ZWRcIik7XG5cbi8vIENhbmNlbGxhdGlvbiBmbGFnXG5sZXQgY2FuY2VsUmVxdWVzdGVkID0gZmFsc2U7XG5cbi8vIEhhbmRsZSBtZXNzYWdlcyBmcm9tIFVJXG5maWdtYS51aS5vbm1lc3NhZ2UgPSBhc3luYyAobXNnOiBVSVRvU2FuZGJveE1lc3NhZ2UpID0+IHtcbiAgY29uc29sZS5sb2coXCJTYW5kYm94IHJlY2VpdmVkIG1lc3NhZ2U6XCIsIG1zZy50eXBlKTtcblxuICBzd2l0Y2ggKG1zZy50eXBlKSB7XG4gICAgY2FzZSAnRElTQ09WRVJfUEFHRVMnOiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBwYWdlcyA9IGRpc2NvdmVyUGFnZXMoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJQYWdlcyBkaXNjb3ZlcmVkOlwiLCBwYWdlcy5sZW5ndGgpO1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHR5cGU6ICdQQUdFU19ESVNDT1ZFUkVEJywgcGFnZXMgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkRpc2NvdmVyeSBlcnJvcjpcIiwgZXJyKTtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB0eXBlOiAnRVhQT1JUX0VSUk9SJywgZXJyb3I6IFN0cmluZyhlcnIpIH0pO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSAnVkFMSURBVEUnOiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgcnVuQWxsVmFsaWRhdGlvbnMobXNnLmZyYW1lSWRzKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJWYWxpZGF0aW9uIGNvbXBsZXRlOlwiLCByZXN1bHRzLmxlbmd0aCwgXCJyZXN1bHRzXCIpO1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ1ZBTElEQVRJT05fQ09NUExFVEUnLFxuICAgICAgICAgIHJlc3VsdHMsXG4gICAgICAgICAgZnJhbWVJZHM6IG1zZy5mcmFtZUlkcyxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlZhbGlkYXRpb24gZXJyb3I6XCIsIGVycik7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICB0eXBlOiAnRVhQT1JUX0VSUk9SJyxcbiAgICAgICAgICBlcnJvcjogYFZhbGlkYXRpb24gZmFpbGVkOiAke2Vycn1gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgJ1NUQVJUX0VYUE9SVCc6IHtcbiAgICAgIGNhbmNlbFJlcXVlc3RlZCA9IGZhbHNlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcnVuRXh0cmFjdGlvbihcbiAgICAgICAgICBtc2cuZnJhbWVJZHMsXG4gICAgICAgICAgbXNnLnJlc3BvbnNpdmVQYWlycyxcbiAgICAgICAgICAobWVzc2FnZSkgPT4gZmlnbWEudWkucG9zdE1lc3NhZ2UobWVzc2FnZSksXG4gICAgICAgICAgKCkgPT4gY2FuY2VsUmVxdWVzdGVkLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFeHBvcnQgZXJyb3I6XCIsIGVycik7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICB0eXBlOiAnRVhQT1JUX0VSUk9SJyxcbiAgICAgICAgICBlcnJvcjogYEV4cG9ydCBmYWlsZWQ6ICR7ZXJyfWAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSAnQ0FOQ0VMX0VYUE9SVCc6IHtcbiAgICAgIGNhbmNlbFJlcXVlc3RlZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmxvZyhcIkV4cG9ydCBjYW5jZWxsZWQgYnkgdXNlclwiKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS08sV0FBUyxRQUFRLE1BQXNCO0FBQzVDLFdBQU8sS0FDSixZQUFZLEVBQ1osUUFBUSxTQUFTLEdBQUcsRUFDcEIsUUFBUSxpQkFBaUIsRUFBRSxFQUMzQixRQUFRLFFBQVEsR0FBRyxFQUNuQixRQUFRLE9BQU8sR0FBRyxFQUNsQixRQUFRLFVBQVUsRUFBRTtBQUFBLEVBQ3pCO0FBTU8sV0FBUyxhQUFhLE1BQXNCO0FBQ2pELFdBQU8sS0FDSixZQUFZLEVBQ1osUUFBUSxTQUFTLEdBQUcsRUFDcEIsUUFBUSxpQkFBaUIsRUFBRSxFQUMzQixRQUFRLFFBQVEsR0FBRyxFQUNuQixRQUFRLE9BQU8sR0FBRyxFQUNsQixRQUFRLFVBQVUsRUFBRTtBQUFBLEVBQ3pCO0FBT08sV0FBUyxXQUFXLE9BQWtDLE9BQWUsTUFBcUI7QUFDL0YsUUFBSSxVQUFVLFVBQWEsVUFBVSxRQUFRLE1BQU0sS0FBSyxFQUFHLFFBQU87QUFFbEUsVUFBTSxVQUFVLEtBQUssTUFBTSxRQUFRLEdBQUcsSUFBSTtBQUUxQyxVQUFNLFVBQVUsT0FBTyxVQUFVLE9BQU8sSUFBSSxVQUFVO0FBQ3RELFdBQU8sR0FBRyxPQUFPLEdBQUcsSUFBSTtBQUFBLEVBQzFCO0FBYU8sV0FBUyxtQkFBbUIsTUFBc0I7QUFDdkQsV0FBTyxHQUFHLFFBQVEsSUFBSSxDQUFDO0FBQUEsRUFDekI7QUFPTyxXQUFTLG1CQUFtQixPQUFlLFFBQStCO0FBQy9FLFFBQUksQ0FBQyxT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QUFRLElBQUksQ0FBQztBQUNsRCxjQUFRLElBQUksNkNBQTZDO0FBR3pELFVBQUksa0JBQWtCO0FBR3RCLFlBQU0sR0FBRyxZQUFZLENBQU8sUUFBNEI7QUFDdEQsZ0JBQVEsSUFBSSw2QkFBNkIsSUFBSSxJQUFJO0FBRWpELGdCQUFRLElBQUksTUFBTTtBQUFBLFVBQ2hCLEtBQUssa0JBQWtCO0FBQ3JCLGdCQUFJO0FBQ0Ysb0JBQU0sUUFBUSxjQUFjO0FBQzVCLHNCQUFRLElBQUkscUJBQXFCLE1BQU0sTUFBTTtBQUM3QyxvQkFBTSxHQUFHLFlBQVksRUFBRSxNQUFNLG9CQUFvQixNQUFNLENBQUM7QUFBQSxZQUMxRCxTQUFTLEtBQUs7QUFDWixzQkFBUSxNQUFNLG9CQUFvQixHQUFHO0FBQ3JDLG9CQUFNLEdBQUcsWUFBWSxFQUFFLE1BQU0sZ0JBQWdCLE9BQU8sT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUFBLFlBQ25FO0FBQ0E7QUFBQSxVQUNGO0FBQUEsVUFFQSxLQUFLLFlBQVk7QUFDZixnQkFBSTtBQUNGLG9CQUFNLFVBQVUsTUFBTSxrQkFBa0IsSUFBSSxRQUFRO0FBQ3BELHNCQUFRLElBQUksd0JBQXdCLFFBQVEsUUFBUSxTQUFTO0FBQzdELG9CQUFNLEdBQUcsWUFBWTtBQUFBLGdCQUNuQixNQUFNO0FBQUEsZ0JBQ047QUFBQSxnQkFDQSxVQUFVLElBQUk7QUFBQSxjQUNoQixDQUFDO0FBQUEsWUFDSCxTQUFTLEtBQUs7QUFDWixzQkFBUSxNQUFNLHFCQUFxQixHQUFHO0FBQ3RDLG9CQUFNLEdBQUcsWUFBWTtBQUFBLGdCQUNuQixNQUFNO0FBQUEsZ0JBQ04sT0FBTyxzQkFBc0IsR0FBRztBQUFBLGNBQ2xDLENBQUM7QUFBQSxZQUNIO0FBQ0E7QUFBQSxVQUNGO0FBQUEsVUFFQSxLQUFLLGdCQUFnQjtBQUNuQiw4QkFBa0I7QUFDbEIsZ0JBQUk7QUFDRixvQkFBTTtBQUFBLGdCQUNKLElBQUk7QUFBQSxnQkFDSixJQUFJO0FBQUEsZ0JBQ0osQ0FBQyxZQUFZLE1BQU0sR0FBRyxZQUFZLE9BQU87QUFBQSxnQkFDekMsTUFBTTtBQUFBLGNBQ1I7QUFBQSxZQUNGLFNBQVMsS0FBSztBQUNaLHNCQUFRLE1BQU0saUJBQWlCLEdBQUc7QUFDbEMsb0JBQU0sR0FBRyxZQUFZO0FBQUEsZ0JBQ25CLE1BQU07QUFBQSxnQkFDTixPQUFPLGtCQUFrQixHQUFHO0FBQUEsY0FDOUIsQ0FBQztBQUFBLFlBQ0g7QUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUVBLEtBQUssaUJBQWlCO0FBQ3BCLDhCQUFrQjtBQUNsQixvQkFBUSxJQUFJLDBCQUEwQjtBQUN0QztBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBO0FBQUE7IiwKICAibmFtZXMiOiBbImNvbHVtbnMiLCAiZXh0cmFjdFN0cm9rZUNvbG9yIiwgIndhbGsiLCAiX2EiLCAiX2IiXQp9Cg==
