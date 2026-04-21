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
    return styles;
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
          objectFit: "cover",
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
  function parseSections(pageFrame) {
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
        textContentInOrder: textContentInOrder.length > 0 ? textContentInOrder : void 0
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
  var init_variables = __esm({
    "src/sandbox/variables.ts"() {
      "use strict";
      init_color();
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
        const sections = parseSections(desktopFrame);
        const sectionCount = Object.keys(sections).length;
        totalSections += sectionCount;
        if (pair.mobile) {
          const mobileNode = figma.getNodeById(pair.mobile.frameId);
          if (mobileNode && mobileNode.type === "FRAME") {
            const mobileFrame = mobileNode;
            const mobileSections = parseSections(mobileFrame);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3NhbmRib3gvdXRpbHMudHMiLCAiLi4vc3JjL3NhbmRib3gvcmVzcG9uc2l2ZS50cyIsICIuLi9zcmMvc2FuZGJveC9kaXNjb3ZlcnkudHMiLCAiLi4vc3JjL3NhbmRib3gvdmFsaWRhdG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2NvbG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2VmZmVjdHMudHMiLCAiLi4vc3JjL3NhbmRib3gvdHlwb2dyYXBoeS50cyIsICIuLi9zcmMvc2FuZGJveC9zcGFjaW5nLnRzIiwgIi4uL3NyYy9zYW5kYm94L2dyaWQudHMiLCAiLi4vc3JjL3NhbmRib3gvaW50ZXJhY3Rpb25zLnRzIiwgIi4uL3NyYy9zYW5kYm94L3NlY3Rpb24tcGFyc2VyLnRzIiwgIi4uL3NyYy9zYW5kYm94L2ltYWdlLWV4cG9ydGVyLnRzIiwgIi4uL3NyYy9zYW5kYm94L3ZhcmlhYmxlcy50cyIsICIuLi9zcmMvc2FuZGJveC9leHRyYWN0b3IudHMiLCAiLi4vc3JjL21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogQ29udmVydCBhIEZpZ21hIGxheWVyIG5hbWUgdG8gYSBVUkwtc2FmZSBrZWJhYi1jYXNlIHNsdWcuXG4gKiBcIkhlcm8gU2VjdGlvblwiIFx1MjE5MiBcImhlcm8tc2VjdGlvblwiXG4gKiBcIkFib3V0IFVzIFx1MjAxNCBPdmVydmlld1wiIFx1MjE5MiBcImFib3V0LXVzLW92ZXJ2aWV3XCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNsdWdpZnkobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5hbWVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXHUyMDE0XHUyMDEzXS9nLCAnLScpXG4gICAgLnJlcGxhY2UoL1teYS16MC05XFxzLV0vZywgJycpXG4gICAgLnJlcGxhY2UoL1xccysvZywgJy0nKVxuICAgIC5yZXBsYWNlKC8tKy9nLCAnLScpXG4gICAgLnJlcGxhY2UoL14tfC0kL2csICcnKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgRmlnbWEgbGF5ZXIgbmFtZSB0byBBQ0YtY29tcGF0aWJsZSBzbmFrZV9jYXNlIGxheW91dCBuYW1lLlxuICogXCJIZXJvIFNlY3Rpb25cIiBcdTIxOTIgXCJoZXJvX3NlY3Rpb25cIlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9MYXlvdXROYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBuYW1lXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW1x1MjAxNFx1MjAxM10vZywgJ18nKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOVxcc19dL2csICcnKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csICdfJylcbiAgICAucmVwbGFjZSgvXysvZywgJ18nKVxuICAgIC5yZXBsYWNlKC9eX3xfJC9nLCAnJyk7XG59XG5cbi8qKlxuICogQ29udmVydCBhIG51bWVyaWMgdmFsdWUgdG8gYSBDU1MgdmFsdWUgc3RyaW5nIHdpdGggdW5pdC5cbiAqIE5FVkVSIHJldHVybnMgYSBiYXJlIG51bWJlciBcdTIwMTQgYWx3YXlzIFwiTnB4XCIsIFwiTiVcIiwgZXRjLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSB2YWx1ZSBpcyB1bmRlZmluZWQvbnVsbC9OYU4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0Nzc1ZhbHVlKHZhbHVlOiBudW1iZXIgfCB1bmRlZmluZWQgfCBudWxsLCB1bml0OiBzdHJpbmcgPSAncHgnKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsIHx8IGlzTmFOKHZhbHVlKSkgcmV0dXJuIG51bGw7XG4gIC8vIFJvdW5kIHRvIGF2b2lkIGZsb2F0aW5nLXBvaW50IG5vaXNlIChlLmcuLCA3OS45OTk5OSBcdTIxOTIgODApXG4gIGNvbnN0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKHZhbHVlICogMTAwKSAvIDEwMDtcbiAgLy8gVXNlIGludGVnZXIgd2hlbiBjbG9zZSBlbm91Z2hcbiAgY29uc3QgZGlzcGxheSA9IE51bWJlci5pc0ludGVnZXIocm91bmRlZCkgPyByb3VuZGVkIDogcm91bmRlZDtcbiAgcmV0dXJuIGAke2Rpc3BsYXl9JHt1bml0fWA7XG59XG5cbi8qKlxuICogRm9ybWF0IGEgRmlnbWEgbm9kZSBJRCBmb3Igb3V0cHV0LiBGaWdtYSB1c2VzIFwiMToyMzRcIiBmb3JtYXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub2RlSWRUb1N0cmluZyhpZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlkO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgemVyby1wYWRkZWQgc2NyZWVuc2hvdCBmaWxlbmFtZS5cbiAqICgxLCBcIkhlcm8gU2VjdGlvblwiKSBcdTIxOTIgXCIwMS1oZXJvLXNlY3Rpb24ucG5nXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjcmVlbnNob3RGaWxlbmFtZShpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwYWRkZWQgPSBTdHJpbmcoaW5kZXgpLnBhZFN0YXJ0KDIsICcwJyk7XG4gIHJldHVybiBgJHtwYWRkZWR9LSR7c2x1Z2lmeShuYW1lKX0ucG5nYDtcbn1cblxuLyoqXG4gKiBDb21wdXRlIHRoZSBhc3BlY3QgcmF0aW8gc3RyaW5nIGZyb20gd2lkdGggYW5kIGhlaWdodC5cbiAqIFJldHVybnMgdGhlIHNpbXBsZXN0IGludGVnZXIgcmF0aW86IDE0NDAvOTAwIFx1MjE5MiBcIjE2LzEwXCJcbiAqIFJldHVybnMgbnVsbCBpZiBlaXRoZXIgZGltZW5zaW9uIGlzIDAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlQXNwZWN0UmF0aW8od2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCF3aWR0aCB8fCAhaGVpZ2h0KSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZ2NkID0gKGE6IG51bWJlciwgYjogbnVtYmVyKTogbnVtYmVyID0+IChiID09PSAwID8gYSA6IGdjZChiLCBhICUgYikpO1xuICBjb25zdCBkID0gZ2NkKE1hdGgucm91bmQod2lkdGgpLCBNYXRoLnJvdW5kKGhlaWdodCkpO1xuICByZXR1cm4gYCR7TWF0aC5yb3VuZCh3aWR0aCAvIGQpfS8ke01hdGgucm91bmQoaGVpZ2h0IC8gZCl9YDtcbn1cblxuLyoqXG4gKiBEZXRlY3QgaWYgYSBub2RlIG5hbWUgaXMgYSBkZWZhdWx0IEZpZ21hLWdlbmVyYXRlZCBuYW1lLlxuICogXCJGcmFtZSAxXCIsIFwiR3JvdXAgMjNcIiwgXCJSZWN0YW5nbGUgNFwiLCBcIlZlY3RvclwiIFx1MjE5MiB0cnVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0RlZmF1bHRMYXllck5hbWUobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiAvXihGcmFtZXxHcm91cHxSZWN0YW5nbGV8RWxsaXBzZXxMaW5lfFZlY3RvcnxQb2x5Z29ufFN0YXJ8Qm9vbGVhbnxTbGljZXxDb21wb25lbnR8SW5zdGFuY2UpXFxzKlxcZCokL2kudGVzdChuYW1lKTtcbn1cbiIsICJpbXBvcnQgeyBCcmVha3BvaW50Q2xhc3MsIEZyYW1lSW5mbywgUmVzcG9uc2l2ZU1hcCwgUmVzcG9uc2l2ZVBhaXIsIFVubWF0Y2hlZEZyYW1lIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBzbHVnaWZ5IH0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogQ2xhc3NpZnkgYSBmcmFtZSB3aWR0aCBpbnRvIGEgYnJlYWtwb2ludCBjYXRlZ29yeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzaWZ5QnJlYWtwb2ludCh3aWR0aDogbnVtYmVyKTogQnJlYWtwb2ludENsYXNzIHtcbiAgaWYgKHdpZHRoIDw9IDQ4MCkgcmV0dXJuICdtb2JpbGUnO1xuICBpZiAod2lkdGggPD0gODIwKSByZXR1cm4gJ3RhYmxldCc7XG4gIGlmICh3aWR0aCA8PSAxNDQwKSByZXR1cm4gJ2Rlc2t0b3AnO1xuICByZXR1cm4gJ2xhcmdlJztcbn1cblxuLyoqXG4gKiBDb21tb24gc3VmZml4ZXMva2V5d29yZHMgdGhhdCBkZW5vdGUgYnJlYWtwb2ludHMgaW4gZnJhbWUgbmFtZXMuXG4gKi9cbmNvbnN0IEJSRUFLUE9JTlRfUEFUVEVSTlMgPSBbXG4gIC9bLVx1MjAxM1x1MjAxNFxcc10qKGRlc2t0b3B8bW9iaWxlfHRhYmxldHxyZXNwb25zaXZlfHBob25lfHdlYnxsZ3xtZHxzbXx4cykvZ2ksXG4gIC9bLVx1MjAxM1x1MjAxNFxcc10qKFxcZHszLDR9KVxccyooPzpweCk/JC9naSwgICAvLyB0cmFpbGluZyB3aWR0aCBudW1iZXJzIGxpa2UgXCIxNDQwXCIgb3IgXCIzNzVweFwiXG4gIC9cXCgoPzpkZXNrdG9wfG1vYmlsZXx0YWJsZXR8cGhvbmUpXFwpL2dpLFxuICAvXFxzKyQvZyxcbl07XG5cbi8qKlxuICogTm9ybWFsaXplIGEgZnJhbWUgbmFtZSBieSBzdHJpcHBpbmcgYnJlYWtwb2ludCBpZGVudGlmaWVycy5cbiAqIFwiQWJvdXQgLSBEZXNrdG9wXCIgXHUyMTkyIFwiYWJvdXRcIlxuICogXCJIb21lcGFnZSAxNDQwXCIgXHUyMTkyIFwiaG9tZXBhZ2VcIlxuICogXCJTZXJ2aWNlcyAoTW9iaWxlKVwiIFx1MjE5MiBcInNlcnZpY2VzXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUZyYW1lTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgbm9ybWFsaXplZCA9IG5hbWU7XG4gIGZvciAoY29uc3QgcGF0dGVybiBvZiBCUkVBS1BPSU5UX1BBVFRFUk5TKSB7XG4gICAgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQucmVwbGFjZShwYXR0ZXJuLCAnJyk7XG4gIH1cbiAgcmV0dXJuIG5vcm1hbGl6ZWQudHJpbSgpLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xufVxuXG4vKipcbiAqIE1hdGNoIGRlc2t0b3AgYW5kIG1vYmlsZSBmcmFtZXMgYnkgbmFtZSBzaW1pbGFyaXR5LlxuICogUmV0dXJucyBSZXNwb25zaXZlTWFwIHdpdGggbWF0Y2hlZCBwYWlycyBhbmQgdW5tYXRjaGVkIGZyYW1lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoUmVzcG9uc2l2ZUZyYW1lcyhhbGxGcmFtZXM6IEZyYW1lSW5mb1tdKTogUmVzcG9uc2l2ZU1hcCB7XG4gIC8vIEdyb3VwIGZyYW1lcyBieSBub3JtYWxpemVkIG5hbWVcbiAgY29uc3QgZ3JvdXBzID0gbmV3IE1hcDxzdHJpbmcsIEZyYW1lSW5mb1tdPigpO1xuXG4gIGZvciAoY29uc3QgZnJhbWUgb2YgYWxsRnJhbWVzKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUZyYW1lTmFtZShmcmFtZS5uYW1lKTtcbiAgICBpZiAoIWdyb3Vwcy5oYXMobm9ybWFsaXplZCkpIHtcbiAgICAgIGdyb3Vwcy5zZXQobm9ybWFsaXplZCwgW10pO1xuICAgIH1cbiAgICBncm91cHMuZ2V0KG5vcm1hbGl6ZWQpIS5wdXNoKGZyYW1lKTtcbiAgfVxuXG4gIGNvbnN0IG1hdGNoZWRQYWlyczogUmVzcG9uc2l2ZVBhaXJbXSA9IFtdO1xuICBjb25zdCB1bm1hdGNoZWRGcmFtZXM6IFVubWF0Y2hlZEZyYW1lW10gPSBbXTtcbiAgY29uc3QgbWF0Y2hlZElkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgW2Jhc2VOYW1lLCBmcmFtZXNdIG9mIGdyb3Vwcykge1xuICAgIGlmIChmcmFtZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAvLyBTaW5nbGUgZnJhbWUgXHUyMDE0IG5vIHJlc3BvbnNpdmUgcGFpclxuICAgICAgY29uc3QgZnJhbWUgPSBmcmFtZXNbMF07XG4gICAgICBpZiAoZnJhbWUuYnJlYWtwb2ludCA9PT0gJ2Rlc2t0b3AnIHx8IGZyYW1lLmJyZWFrcG9pbnQgPT09ICdsYXJnZScpIHtcbiAgICAgICAgLy8gRGVza3RvcCB3aXRob3V0IG1vYmlsZSBcdTIxOTIgc3RpbGwgYSB2YWxpZCBwYWdlLCBqdXN0IG5vIHJlc3BvbnNpdmUgZGF0YVxuICAgICAgICBtYXRjaGVkUGFpcnMucHVzaCh7XG4gICAgICAgICAgcGFnZU5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgICAgcGFnZVNsdWc6IHNsdWdpZnkoYmFzZU5hbWUgfHwgZnJhbWUubmFtZSksXG4gICAgICAgICAgZGVza3RvcDogeyBmcmFtZUlkOiBmcmFtZS5pZCwgZnJhbWVOYW1lOiBmcmFtZS5uYW1lLCB3aWR0aDogZnJhbWUud2lkdGggfSxcbiAgICAgICAgICBtb2JpbGU6IG51bGwsXG4gICAgICAgICAgdGFibGV0OiBudWxsLFxuICAgICAgICAgIG1hdGNoQ29uZmlkZW5jZTogMS4wLFxuICAgICAgICAgIG1hdGNoTWV0aG9kOiAnbmFtZS1zaW1pbGFyaXR5JyxcbiAgICAgICAgfSk7XG4gICAgICAgIG1hdGNoZWRJZHMuYWRkKGZyYW1lLmlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVubWF0Y2hlZEZyYW1lcy5wdXNoKHtcbiAgICAgICAgICBmcmFtZUlkOiBmcmFtZS5pZCxcbiAgICAgICAgICBmcmFtZU5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgICAgd2lkdGg6IGZyYW1lLndpZHRoLFxuICAgICAgICAgIGJyZWFrcG9pbnQ6IGZyYW1lLmJyZWFrcG9pbnQsXG4gICAgICAgICAgcmVhc29uOiAnbm8gZGVza3RvcCBjb3VudGVycGFydCBmb3VuZCcsXG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVkSWRzLmFkZChmcmFtZS5pZCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBNdWx0aXBsZSBmcmFtZXMgd2l0aCBzYW1lIGJhc2UgbmFtZSBcdTIwMTQgbWF0Y2ggYnkgYnJlYWtwb2ludFxuICAgIGNvbnN0IGRlc2t0b3AgPSBmcmFtZXMuZmluZChmID0+IGYuYnJlYWtwb2ludCA9PT0gJ2Rlc2t0b3AnIHx8IGYuYnJlYWtwb2ludCA9PT0gJ2xhcmdlJyk7XG4gICAgY29uc3QgbW9iaWxlID0gZnJhbWVzLmZpbmQoZiA9PiBmLmJyZWFrcG9pbnQgPT09ICdtb2JpbGUnKTtcbiAgICBjb25zdCB0YWJsZXQgPSBmcmFtZXMuZmluZChmID0+IGYuYnJlYWtwb2ludCA9PT0gJ3RhYmxldCcpO1xuXG4gICAgaWYgKGRlc2t0b3ApIHtcbiAgICAgIG1hdGNoZWRQYWlycy5wdXNoKHtcbiAgICAgICAgcGFnZU5hbWU6IGRlc2t0b3AubmFtZSxcbiAgICAgICAgcGFnZVNsdWc6IHNsdWdpZnkoYmFzZU5hbWUgfHwgZGVza3RvcC5uYW1lKSxcbiAgICAgICAgZGVza3RvcDogeyBmcmFtZUlkOiBkZXNrdG9wLmlkLCBmcmFtZU5hbWU6IGRlc2t0b3AubmFtZSwgd2lkdGg6IGRlc2t0b3Aud2lkdGggfSxcbiAgICAgICAgbW9iaWxlOiBtb2JpbGUgPyB7IGZyYW1lSWQ6IG1vYmlsZS5pZCwgZnJhbWVOYW1lOiBtb2JpbGUubmFtZSwgd2lkdGg6IG1vYmlsZS53aWR0aCB9IDogbnVsbCxcbiAgICAgICAgdGFibGV0OiB0YWJsZXQgPyB7IGZyYW1lSWQ6IHRhYmxldC5pZCwgZnJhbWVOYW1lOiB0YWJsZXQubmFtZSwgd2lkdGg6IHRhYmxldC53aWR0aCB9IDogbnVsbCxcbiAgICAgICAgbWF0Y2hDb25maWRlbmNlOiAwLjk1LFxuICAgICAgICBtYXRjaE1ldGhvZDogJ25hbWUtc2ltaWxhcml0eScsXG4gICAgICB9KTtcbiAgICAgIG1hdGNoZWRJZHMuYWRkKGRlc2t0b3AuaWQpO1xuICAgICAgaWYgKG1vYmlsZSkgbWF0Y2hlZElkcy5hZGQobW9iaWxlLmlkKTtcbiAgICAgIGlmICh0YWJsZXQpIG1hdGNoZWRJZHMuYWRkKHRhYmxldC5pZCk7XG4gICAgfVxuXG4gICAgLy8gQW55IHJlbWFpbmluZyBmcmFtZXMgaW4gdGhpcyBncm91cFxuICAgIGZvciAoY29uc3QgZnJhbWUgb2YgZnJhbWVzKSB7XG4gICAgICBpZiAoIW1hdGNoZWRJZHMuaGFzKGZyYW1lLmlkKSkge1xuICAgICAgICB1bm1hdGNoZWRGcmFtZXMucHVzaCh7XG4gICAgICAgICAgZnJhbWVJZDogZnJhbWUuaWQsXG4gICAgICAgICAgZnJhbWVOYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgICAgIHdpZHRoOiBmcmFtZS53aWR0aCxcbiAgICAgICAgICBicmVha3BvaW50OiBmcmFtZS5icmVha3BvaW50LFxuICAgICAgICAgIHJlYXNvbjogJ2NvdWxkIG5vdCBwYWlyIHdpdGggZGVza3RvcCBmcmFtZScsXG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVkSWRzLmFkZChmcmFtZS5pZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQ2F0Y2ggYW55IGZyYW1lcyBub3QgcHJvY2Vzc2VkXG4gIGZvciAoY29uc3QgZnJhbWUgb2YgYWxsRnJhbWVzKSB7XG4gICAgaWYgKCFtYXRjaGVkSWRzLmhhcyhmcmFtZS5pZCkpIHtcbiAgICAgIHVubWF0Y2hlZEZyYW1lcy5wdXNoKHtcbiAgICAgICAgZnJhbWVJZDogZnJhbWUuaWQsXG4gICAgICAgIGZyYW1lTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgd2lkdGg6IGZyYW1lLndpZHRoLFxuICAgICAgICBicmVha3BvaW50OiBmcmFtZS5icmVha3BvaW50LFxuICAgICAgICByZWFzb246ICdub3QgbWF0Y2hlZCBieSBhbnkgbWV0aG9kJyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7IG1hdGNoZWRQYWlycywgdW5tYXRjaGVkRnJhbWVzIH07XG59XG5cbi8qKlxuICogQ29udGVudC1iYXNlZCBtYXRjaGluZyBmYWxsYmFjazogY29tcGFyZSBjaGlsZCBuYW1lcyBiZXR3ZWVuIHR3byBmcmFtZXMuXG4gKiBSZXR1cm5zIG92ZXJsYXAgcmF0aW8gKDAtMSkuID4wLjYgPSBsaWtlbHkgc2FtZSBwYWdlIGF0IGRpZmZlcmVudCBicmVha3BvaW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVDb250ZW50T3ZlcmxhcChmcmFtZUE6IEZyYW1lTm9kZSwgZnJhbWVCOiBGcmFtZU5vZGUpOiBudW1iZXIge1xuICBjb25zdCBuYW1lc0EgPSBuZXcgU2V0KGZyYW1lQS5jaGlsZHJlbi5tYXAoYyA9PiBjLm5hbWUudG9Mb3dlckNhc2UoKSkpO1xuICBjb25zdCBuYW1lc0IgPSBuZXcgU2V0KGZyYW1lQi5jaGlsZHJlbi5tYXAoYyA9PiBjLm5hbWUudG9Mb3dlckNhc2UoKSkpO1xuXG4gIGlmIChuYW1lc0Euc2l6ZSA9PT0gMCB8fCBuYW1lc0Iuc2l6ZSA9PT0gMCkgcmV0dXJuIDA7XG5cbiAgbGV0IG92ZXJsYXAgPSAwO1xuICBmb3IgKGNvbnN0IG5hbWUgb2YgbmFtZXNBKSB7XG4gICAgaWYgKG5hbWVzQi5oYXMobmFtZSkpIG92ZXJsYXArKztcbiAgfVxuXG4gIGNvbnN0IHVuaW9uU2l6ZSA9IG5ldyBTZXQoWy4uLm5hbWVzQSwgLi4ubmFtZXNCXSkuc2l6ZTtcbiAgcmV0dXJuIHVuaW9uU2l6ZSA+IDAgPyBvdmVybGFwIC8gdW5pb25TaXplIDogMDtcbn1cbiIsICJpbXBvcnQgeyBQYWdlSW5mbywgRnJhbWVJbmZvIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBjbGFzc2lmeUJyZWFrcG9pbnQgfSBmcm9tICcuL3Jlc3BvbnNpdmUnO1xuXG4vKipcbiAqIERpc2NvdmVyIGFsbCBwYWdlcyBpbiB0aGUgRmlnbWEgZmlsZS5cbiAqIEVhY2ggcGFnZSBjb250YWlucyBmcmFtZXMgdGhhdCByZXByZXNlbnQgZGVzaWduIGFydGJvYXJkcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc2NvdmVyUGFnZXMoKTogUGFnZUluZm9bXSB7XG4gIGNvbnN0IHBhZ2VzOiBQYWdlSW5mb1tdID0gW107XG5cbiAgZm9yIChjb25zdCBwYWdlIG9mIGZpZ21hLnJvb3QuY2hpbGRyZW4pIHtcbiAgICBjb25zdCBmcmFtZXMgPSBkaXNjb3ZlckZyYW1lcyhwYWdlKTtcbiAgICBpZiAoZnJhbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICBpZDogcGFnZS5pZCxcbiAgICAgICAgbmFtZTogcGFnZS5uYW1lLFxuICAgICAgICBmcmFtZXMsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFnZXM7XG59XG5cbi8qKlxuICogRGlzY292ZXIgYWxsIHRvcC1sZXZlbCBmcmFtZXMgd2l0aGluIGEgcGFnZS5cbiAqIEZpbHRlcnMgdG8gRlJBTUUsIENPTVBPTkVOVF9TRVQsIGFuZCBDT01QT05FTlQgbm9kZXMgd2l0aCBtZWFuaW5nZnVsIGRpbWVuc2lvbnMuXG4gKi9cbmZ1bmN0aW9uIGRpc2NvdmVyRnJhbWVzKHBhZ2U6IFBhZ2VOb2RlKTogRnJhbWVJbmZvW10ge1xuICBjb25zdCBmcmFtZXM6IEZyYW1lSW5mb1tdID0gW107XG5cbiAgZm9yIChjb25zdCBjaGlsZCBvZiBwYWdlLmNoaWxkcmVuKSB7XG4gICAgLy8gT25seSBpbmNsdWRlIHRvcC1sZXZlbCBmcmFtZXMgKG5vdCBncm91cHMsIHZlY3RvcnMsIGV0Yy4pXG4gICAgaWYgKGNoaWxkLnR5cGUgIT09ICdGUkFNRScgJiYgY2hpbGQudHlwZSAhPT0gJ0NPTVBPTkVOVCcgJiYgY2hpbGQudHlwZSAhPT0gJ0NPTVBPTkVOVF9TRVQnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBmcmFtZSA9IGNoaWxkIGFzIEZyYW1lTm9kZTtcblxuICAgIC8vIFNraXAgdGlueSBmcmFtZXMgKGxpa2VseSBpY29ucyBvciBjb21wb25lbnRzLCBub3QgcGFnZSBkZXNpZ25zKVxuICAgIGlmIChmcmFtZS53aWR0aCA8IDMwMCB8fCBmcmFtZS5oZWlnaHQgPCAyMDApIGNvbnRpbnVlO1xuXG4gICAgLy8gQ291bnQgdmlzaWJsZSBzZWN0aW9ucyAoZGlyZWN0IGNoaWxkcmVuIHRoYXQgYXJlIGZyYW1lcylcbiAgICBjb25zdCBzZWN0aW9uQ291bnQgPSBmcmFtZS5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3ggJiZcbiAgICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveC5oZWlnaHQgPiA1MFxuICAgICkubGVuZ3RoO1xuXG4gICAgLy8gQ2hlY2sgaWYgYW55IHNlY3Rpb24gdXNlcyBhdXRvLWxheW91dFxuICAgIGNvbnN0IGhhc0F1dG9MYXlvdXQgPSBmcmFtZS5sYXlvdXRNb2RlICE9PSB1bmRlZmluZWQgJiYgZnJhbWUubGF5b3V0TW9kZSAhPT0gJ05PTkUnO1xuXG4gICAgZnJhbWVzLnB1c2goe1xuICAgICAgaWQ6IGZyYW1lLmlkLFxuICAgICAgbmFtZTogZnJhbWUubmFtZSxcbiAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKGZyYW1lLndpZHRoKSxcbiAgICAgIGhlaWdodDogTWF0aC5yb3VuZChmcmFtZS5oZWlnaHQpLFxuICAgICAgYnJlYWtwb2ludDogY2xhc3NpZnlCcmVha3BvaW50KE1hdGgucm91bmQoZnJhbWUud2lkdGgpKSxcbiAgICAgIHNlY3Rpb25Db3VudCxcbiAgICAgIGhhc0F1dG9MYXlvdXQsXG4gICAgICByZXNwb25zaXZlUGFpcklkOiBudWxsLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGZyYW1lcztcbn1cbiIsICJpbXBvcnQgeyBWYWxpZGF0aW9uUmVzdWx0LCBGcmFtZUluZm8gfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IGlzRGVmYXVsdExheWVyTmFtZSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIFJ1biBhbGwgOSB2YWxpZGF0aW9uIGNoZWNrcyBhZ2FpbnN0IHNlbGVjdGVkIGZyYW1lcy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkFsbFZhbGlkYXRpb25zKGZyYW1lSWRzOiBzdHJpbmdbXSk6IFByb21pc2U8VmFsaWRhdGlvblJlc3VsdFtdPiB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgZnJhbWVJZCBvZiBmcmFtZUlkcykge1xuICAgIGNvbnN0IG5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChmcmFtZUlkKTtcbiAgICBpZiAoIW5vZGUgfHwgbm9kZS50eXBlICE9PSAnRlJBTUUnKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgY29uc3Qgc2VjdGlvbnMgPSBmcmFtZS5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICAgKTtcblxuICAgIC8vIENoZWNrIDE6IE1pc3NpbmcgYXV0by1sYXlvdXQgb24gc2VjdGlvbnNcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tBdXRvTGF5b3V0KHNlY3Rpb25zLCBmcmFtZS5uYW1lKSk7XG5cbiAgICAvLyBDaGVjayAyOiBEZWZhdWx0IGxheWVyIG5hbWVzXG4gICAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrTGF5ZXJOYW1lcyhzZWN0aW9ucywgZnJhbWUubmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgMzogTWlzc2luZyBmb250c1xuICAgIHJlc3VsdHMucHVzaCguLi5hd2FpdCBjaGVja0ZvbnRzKGZyYW1lKSk7XG5cbiAgICAvLyBDaGVjayA0OiBJbmNvbnNpc3RlbnQgc3BhY2luZ1xuICAgIHJlc3VsdHMucHVzaCguLi5jaGVja1NwYWNpbmdDb25zaXN0ZW5jeShmcmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgNTogT3ZlcnNpemVkIGltYWdlc1xuICAgIHJlc3VsdHMucHVzaCguLi5jaGVja092ZXJzaXplZEltYWdlcyhmcmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgNjogT3ZlcmxhcHBpbmcgc2VjdGlvbnNcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tPdmVybGFwcyhzZWN0aW9ucywgZnJhbWUubmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgOTogVGV4dCBvdmVyZmxvd1xuICAgIHJlc3VsdHMucHVzaCguLi5jaGVja1RleHRPdmVyZmxvdyhmcmFtZSkpO1xuICB9XG5cbiAgLy8gQ2hlY2sgNzogTWlzc2luZyByZXNwb25zaXZlIGZyYW1lcyAoY3Jvc3MtZnJhbWUgY2hlY2spXG4gIHJlc3VsdHMucHVzaCguLi5jaGVja1Jlc3BvbnNpdmVGcmFtZXMoZnJhbWVJZHMpKTtcblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDE6IE1pc3NpbmcgQXV0by1MYXlvdXQgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrQXV0b0xheW91dChzZWN0aW9uczogU2NlbmVOb2RlW10sIGZyYW1lTmFtZTogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG4gIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBzZWN0aW9ucykge1xuICAgIGlmIChzZWN0aW9uLnR5cGUgPT09ICdGUkFNRScgfHwgc2VjdGlvbi50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBzZWN0aW9uLnR5cGUgPT09ICdJTlNUQU5DRScpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gc2VjdGlvbiBhcyBGcmFtZU5vZGU7XG4gICAgICBpZiAoIWZyYW1lLmxheW91dE1vZGUgfHwgZnJhbWUubGF5b3V0TW9kZSA9PT0gJ05PTkUnKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgICAgICBjaGVjazogJ2F1dG8tbGF5b3V0JyxcbiAgICAgICAgICBtZXNzYWdlOiBgU2VjdGlvbiBcIiR7c2VjdGlvbi5uYW1lfVwiIHVzZXMgYWJzb2x1dGUgcG9zaXRpb25pbmcuIFNwYWNpbmcgdmFsdWVzIHdpbGwgYmUgYXBwcm94aW1hdGUuYCxcbiAgICAgICAgICBzZWN0aW9uTmFtZTogc2VjdGlvbi5uYW1lLFxuICAgICAgICAgIG5vZGVJZDogc2VjdGlvbi5pZCxcbiAgICAgICAgICBub2RlTmFtZTogc2VjdGlvbi5uYW1lLFxuICAgICAgICAgIHN1Z2dlc3Rpb246ICdBcHBseSBhdXRvLWxheW91dCB0byB0aGlzIHNlY3Rpb24gZm9yIHByZWNpc2Ugc3BhY2luZyBleHRyYWN0aW9uLicsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDI6IERlZmF1bHQgTGF5ZXIgTmFtZXMgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrTGF5ZXJOYW1lcyhzZWN0aW9uczogU2NlbmVOb2RlW10sIGZyYW1lTmFtZTogc3RyaW5nKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIpIHtcbiAgICBpZiAoaXNEZWZhdWx0TGF5ZXJOYW1lKG5vZGUubmFtZSkpIHtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiBkZXB0aCA9PT0gMCA/ICd3YXJuaW5nJyA6ICdpbmZvJyxcbiAgICAgICAgY2hlY2s6ICdsYXllci1uYW1lcycsXG4gICAgICAgIG1lc3NhZ2U6IGBMYXllciBcIiR7bm9kZS5uYW1lfVwiIGhhcyBhIGRlZmF1bHQgRmlnbWEgbmFtZSR7ZGVwdGggPT09IDAgPyAnIChzZWN0aW9uIGxldmVsKScgOiAnJ30uYCxcbiAgICAgICAgc2VjdGlvbk5hbWU6IGZyYW1lTmFtZSxcbiAgICAgICAgbm9kZUlkOiBub2RlLmlkLFxuICAgICAgICBub2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICBzdWdnZXN0aW9uOiAnUmVuYW1lIHRvIGEgZGVzY3JpcHRpdmUgbmFtZSAoZS5nLiwgXCJIZXJvIFNlY3Rpb25cIiwgXCJGZWF0dXJlcyBHcmlkXCIpLicsXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSAmJiBkZXB0aCA8IDIpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkLCBkZXB0aCArIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3Qgc2VjdGlvbiBvZiBzZWN0aW9ucykge1xuICAgIHdhbGsoc2VjdGlvbiwgMCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayAzOiBNaXNzaW5nIEZvbnRzIFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5hc3luYyBmdW5jdGlvbiBjaGVja0ZvbnRzKGZyYW1lOiBGcmFtZU5vZGUpOiBQcm9taXNlPFZhbGlkYXRpb25SZXN1bHRbXT4ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcbiAgY29uc3QgY2hlY2tlZEZvbnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZnVuY3Rpb24gY29sbGVjdEZvbnROYW1lcyhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIGNvbnN0IGZvbnROYW1lID0gbm9kZS5mb250TmFtZTtcbiAgICAgIGlmIChmb250TmFtZSAhPT0gZmlnbWEubWl4ZWQgJiYgZm9udE5hbWUpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gYCR7Zm9udE5hbWUuZmFtaWx5fTo6JHtmb250TmFtZS5zdHlsZX1gO1xuICAgICAgICBpZiAoIWNoZWNrZWRGb250cy5oYXMoa2V5KSkge1xuICAgICAgICAgIGNoZWNrZWRGb250cy5hZGQoa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgY29sbGVjdEZvbnROYW1lcyhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29sbGVjdEZvbnROYW1lcyhmcmFtZSk7XG5cbiAgZm9yIChjb25zdCBmb250S2V5IG9mIGNoZWNrZWRGb250cykge1xuICAgIGNvbnN0IFtmYW1pbHksIHN0eWxlXSA9IGZvbnRLZXkuc3BsaXQoJzo6Jyk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZpZ21hLmxvYWRGb250QXN5bmMoeyBmYW1pbHksIHN0eWxlIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcicsXG4gICAgICAgIGNoZWNrOiAnZm9udHMnLFxuICAgICAgICBtZXNzYWdlOiBgRm9udCBcIiR7ZmFtaWx5fSAke3N0eWxlfVwiIGlzIG5vdCBhdmFpbGFibGUuIFRleHQgZXh0cmFjdGlvbiBtYXkgZmFpbC5gLFxuICAgICAgICBzZWN0aW9uTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgc3VnZ2VzdGlvbjogJ0luc3RhbGwgdGhlIGZvbnQgb3IgcmVwbGFjZSBpdCBpbiB0aGUgZGVzaWduLicsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayA0OiBJbmNvbnNpc3RlbnQgU3BhY2luZyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tTcGFjaW5nQ29uc2lzdGVuY3koZnJhbWU6IEZyYW1lTm9kZSk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuICBjb25zdCBzcGFjaW5nVmFsdWVzOiBudW1iZXJbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJykge1xuICAgICAgY29uc3QgZiA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgaWYgKGYubGF5b3V0TW9kZSAmJiBmLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICBzcGFjaW5nVmFsdWVzLnB1c2goZi5wYWRkaW5nVG9wLCBmLnBhZGRpbmdCb3R0b20sIGYucGFkZGluZ0xlZnQsIGYucGFkZGluZ1JpZ2h0LCBmLml0ZW1TcGFjaW5nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKGZyYW1lKTtcblxuICAvLyBGaW5kIG5lYXItZHVwbGljYXRlc1xuICBjb25zdCB1bmlxdWUgPSBbLi4ubmV3IFNldChzcGFjaW5nVmFsdWVzLmZpbHRlcih2ID0+IHYgPiAwKSldLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmlxdWUubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgY29uc3QgZGlmZiA9IHVuaXF1ZVtpICsgMV0gLSB1bmlxdWVbaV07XG4gICAgaWYgKGRpZmYgPiAwICYmIGRpZmYgPD0gMikge1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdpbmZvJyxcbiAgICAgICAgY2hlY2s6ICdzcGFjaW5nLWNvbnNpc3RlbmN5JyxcbiAgICAgICAgbWVzc2FnZTogYE5lYXItZHVwbGljYXRlIHNwYWNpbmc6ICR7dW5pcXVlW2ldfXB4IGFuZCAke3VuaXF1ZVtpICsgMV19cHggXHUyMDE0IGxpa2VseSBzYW1lIGludGVudD9gLFxuICAgICAgICBzZWN0aW9uTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgc3VnZ2VzdGlvbjogYENvbnNpZGVyIHN0YW5kYXJkaXppbmcgdG8gJHtNYXRoLnJvdW5kKCh1bmlxdWVbaV0gKyB1bmlxdWVbaSArIDFdKSAvIDIpfXB4LmAsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayA1OiBPdmVyc2l6ZWQgSW1hZ2VzIFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja092ZXJzaXplZEltYWdlcyhmcmFtZTogRnJhbWVOb2RlKTogVmFsaWRhdGlvblJlc3VsdFtdIHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAoJ2ZpbGxzJyBpbiBub2RlKSB7XG4gICAgICBjb25zdCBmaWxscyA9IChub2RlIGFzIGFueSkuZmlsbHM7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShmaWxscykpIHtcbiAgICAgICAgZm9yIChjb25zdCBmaWxsIG9mIGZpbGxzKSB7XG4gICAgICAgICAgaWYgKGZpbGwudHlwZSA9PT0gJ0lNQUdFJyAmJiBmaWxsLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICAgICAgICBpZiAoYm91bmRzKSB7XG4gICAgICAgICAgICAgIC8vIEVzdGltYXRlIHJhdyBpbWFnZSBzaXplIChSR0JBIGF0IDJ4KTogdyAqIDIgKiBoICogMiAqIDQgYnl0ZXNcbiAgICAgICAgICAgICAgLy8gRXN0aW1hdGUgYXQgMXggZXhwb3J0OiB3aWR0aCAqIGhlaWdodCAqIDQgKFJHQkEgYnl0ZXMpXG4gICAgICAgICAgICAgIGNvbnN0IGVzdGltYXRlZEJ5dGVzID0gYm91bmRzLndpZHRoICogYm91bmRzLmhlaWdodCAqIDQ7XG4gICAgICAgICAgICAgIGNvbnN0IGVzdGltYXRlZE1CID0gZXN0aW1hdGVkQnl0ZXMgLyAoMTAyNCAqIDEwMjQpO1xuICAgICAgICAgICAgICBpZiAoZXN0aW1hdGVkTUIgPiA1KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICAgICAgICAgICAgICBjaGVjazogJ2ltYWdlLXNpemUnLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEltYWdlIGluIFwiJHtub2RlLm5hbWV9XCIgaXMgZXN0aW1hdGVkIGF0ICR7ZXN0aW1hdGVkTUIudG9GaXhlZCgxKX1NQiBhdCAxeCBleHBvcnQuYCxcbiAgICAgICAgICAgICAgICAgIG5vZGVJZDogbm9kZS5pZCxcbiAgICAgICAgICAgICAgICAgIG5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICBzdWdnZXN0aW9uOiAnQ29uc2lkZXIgcmVkdWNpbmcgaW1hZ2UgZGltZW5zaW9ucyBvciBleHBvcnQgc2NhbGUuJyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdhbGsoZnJhbWUpO1xuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDY6IE92ZXJsYXBwaW5nIFNlY3Rpb25zIFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja092ZXJsYXBzKHNlY3Rpb25zOiBTY2VuZU5vZGVbXSwgZnJhbWVOYW1lOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcbiAgY29uc3Qgc29ydGVkID0gWy4uLnNlY3Rpb25zXVxuICAgIC5maWx0ZXIocyA9PiBzLmFic29sdXRlQm91bmRpbmdCb3gpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueSAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueSk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3J0ZWQubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgY29uc3QgY3VyciA9IHNvcnRlZFtpXS5hYnNvbHV0ZUJvdW5kaW5nQm94ITtcbiAgICBjb25zdCBuZXh0ID0gc29ydGVkW2kgKyAxXS5hYnNvbHV0ZUJvdW5kaW5nQm94ITtcbiAgICBjb25zdCBvdmVybGFwID0gKGN1cnIueSArIGN1cnIuaGVpZ2h0KSAtIG5leHQueTtcbiAgICBpZiAob3ZlcmxhcCA+IDApIHtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICAgIGNoZWNrOiAnb3ZlcmxhcCcsXG4gICAgICAgIG1lc3NhZ2U6IGBTZWN0aW9uIFwiJHtzb3J0ZWRbaV0ubmFtZX1cIiBvdmVybGFwcyB3aXRoIFwiJHtzb3J0ZWRbaSArIDFdLm5hbWV9XCIgYnkgJHtNYXRoLnJvdW5kKG92ZXJsYXApfXB4LmAsXG4gICAgICAgIHNlY3Rpb25OYW1lOiBzb3J0ZWRbaV0ubmFtZSxcbiAgICAgICAgbm9kZUlkOiBzb3J0ZWRbaV0uaWQsXG4gICAgICAgIHN1Z2dlc3Rpb246ICdUaGUgcGx1Z2luIHdpbGwgcmVjb3JkIHRoaXMgYXMgYSBuZWdhdGl2ZSBtYXJnaW4uIFZlcmlmeSB0aGUgdmlzdWFsIHJlc3VsdC4nLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgNzogTWlzc2luZyBSZXNwb25zaXZlIEZyYW1lcyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tSZXNwb25zaXZlRnJhbWVzKGZyYW1lSWRzOiBzdHJpbmdbXSk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuICBjb25zdCBmcmFtZXMgPSBmcmFtZUlkc1xuICAgIC5tYXAoaWQgPT4gZmlnbWEuZ2V0Tm9kZUJ5SWQoaWQpKVxuICAgIC5maWx0ZXIobiA9PiBuICYmIG4udHlwZSA9PT0gJ0ZSQU1FJykgYXMgRnJhbWVOb2RlW107XG5cbiAgY29uc3QgZGVza3RvcEZyYW1lcyA9IGZyYW1lcy5maWx0ZXIoZiA9PiBmLndpZHRoID4gMTAyNCk7XG4gIGNvbnN0IG1vYmlsZUZyYW1lcyA9IGZyYW1lcy5maWx0ZXIoZiA9PiBmLndpZHRoIDw9IDQ4MCk7XG5cbiAgaWYgKGRlc2t0b3BGcmFtZXMubGVuZ3RoID4gMCAmJiBtb2JpbGVGcmFtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICBjaGVjazogJ3Jlc3BvbnNpdmUnLFxuICAgICAgbWVzc2FnZTogYE9ubHkgZGVza3RvcCBmcmFtZXMgc2VsZWN0ZWQgKG5vIG1vYmlsZSBmcmFtZXMpLiBSZXNwb25zaXZlIHZhbHVlcyB3aWxsIGJlIGNhbGN1bGF0ZWQsIG5vdCBleHRyYWN0ZWQuYCxcbiAgICAgIHN1Z2dlc3Rpb246ICdJbmNsdWRlIG1vYmlsZSAoMzc1cHgpIGZyYW1lcyBmb3IgZXhhY3QgcmVzcG9uc2l2ZSB2YWx1ZXMuJyxcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDk6IFRleHQgT3ZlcmZsb3cgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrVGV4dE92ZXJmbG93KGZyYW1lOiBGcmFtZU5vZGUpOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJyAmJiBub2RlLmFic29sdXRlQm91bmRpbmdCb3ggJiYgbm9kZS5wYXJlbnQgJiYgJ2Fic29sdXRlQm91bmRpbmdCb3gnIGluIG5vZGUucGFyZW50KSB7XG4gICAgICBjb25zdCB0ZXh0Qm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgY29uc3QgcGFyZW50Qm91bmRzID0gKG5vZGUucGFyZW50IGFzIEZyYW1lTm9kZSkuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgIGlmIChwYXJlbnRCb3VuZHMpIHtcbiAgICAgICAgY29uc3Qgb3ZlcmZsb3dSaWdodCA9ICh0ZXh0Qm91bmRzLnggKyB0ZXh0Qm91bmRzLndpZHRoKSAtIChwYXJlbnRCb3VuZHMueCArIHBhcmVudEJvdW5kcy53aWR0aCk7XG4gICAgICAgIGNvbnN0IG92ZXJmbG93Qm90dG9tID0gKHRleHRCb3VuZHMueSArIHRleHRCb3VuZHMuaGVpZ2h0KSAtIChwYXJlbnRCb3VuZHMueSArIHBhcmVudEJvdW5kcy5oZWlnaHQpO1xuICAgICAgICBpZiAob3ZlcmZsb3dSaWdodCA+IDUgfHwgb3ZlcmZsb3dCb3R0b20gPiA1KSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICAgICAgICBjaGVjazogJ3RleHQtb3ZlcmZsb3cnLFxuICAgICAgICAgICAgbWVzc2FnZTogYFRleHQgXCIke25vZGUubmFtZX1cIiBvdmVyZmxvd3MgaXRzIGNvbnRhaW5lciBieSAke01hdGgubWF4KE1hdGgucm91bmQob3ZlcmZsb3dSaWdodCksIE1hdGgucm91bmQob3ZlcmZsb3dCb3R0b20pKX1weC5gLFxuICAgICAgICAgICAgbm9kZUlkOiBub2RlLmlkLFxuICAgICAgICAgICAgbm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgIHN1Z2dlc3Rpb246ICdSZXNpemUgdGhlIHRleHQgY29udGFpbmVyIG9yIHJlZHVjZSB0ZXh0IGNvbnRlbnQuJyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdhbGsoZnJhbWUpO1xuICByZXR1cm4gcmVzdWx0cztcbn1cbiIsICIvKipcbiAqIENvbnZlcnQgYSBzaW5nbGUgRmlnbWEgMC0xIGZsb2F0IGNoYW5uZWwgdG8gYSAyLWRpZ2l0IGhleCBzdHJpbmcuXG4gKiBVc2VzIE1hdGgucm91bmQoKSBmb3IgcHJlY2lzaW9uIChOT1QgTWF0aC5mbG9vcigpKS5cbiAqL1xuZnVuY3Rpb24gY2hhbm5lbFRvSGV4KHZhbHVlOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIDI1NSkudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsICcwJykudG9VcHBlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IEZpZ21hIFJHQiAoMC0xIGZsb2F0KSB0byA2LWRpZ2l0IHVwcGVyY2FzZSBIRVguXG4gKiB7IHI6IDAuMDg2LCBnOiAwLjIyLCBiOiAwLjk4NCB9IFx1MjE5MiBcIiMxNjM4RkJcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmdiVG9IZXgoY29sb3I6IHsgcjogbnVtYmVyOyBnOiBudW1iZXI7IGI6IG51bWJlciB9KTogc3RyaW5nIHtcbiAgcmV0dXJuIGAjJHtjaGFubmVsVG9IZXgoY29sb3Iucil9JHtjaGFubmVsVG9IZXgoY29sb3IuZyl9JHtjaGFubmVsVG9IZXgoY29sb3IuYil9YDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IEZpZ21hIFJHQkEgKDAtMSBmbG9hdCkgdG8gSEVYLlxuICogUmV0dXJucyA2LWRpZ2l0IEhFWCBpZiBmdWxseSBvcGFxdWUsIDgtZGlnaXQgSEVYIGlmIGFscGhhIDwgMS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJnYmFUb0hleChjb2xvcjogeyByOiBudW1iZXI7IGc6IG51bWJlcjsgYjogbnVtYmVyIH0sIG9wYWNpdHk6IG51bWJlciA9IDEpOiBzdHJpbmcge1xuICBjb25zdCBiYXNlID0gcmdiVG9IZXgoY29sb3IpO1xuICBpZiAob3BhY2l0eSA+PSAxKSByZXR1cm4gYmFzZTtcbiAgcmV0dXJuIGAke2Jhc2V9JHtjaGFubmVsVG9IZXgob3BhY2l0eSl9YDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSBwcmltYXJ5IGJhY2tncm91bmQgY29sb3IgZnJvbSBhIG5vZGUncyBmaWxscy5cbiAqIFJldHVybnMgNi84LWRpZ2l0IEhFWCBvciBudWxsLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEJhY2tncm91bmRDb2xvcihub2RlOiBTY2VuZU5vZGUgJiB7IGZpbGxzPzogcmVhZG9ubHkgUGFpbnRbXSB9KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghKCdmaWxscycgaW4gbm9kZSkgfHwgIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiBudWxsO1xuXG4gIGZvciAoY29uc3QgZmlsbCBvZiBub2RlLmZpbGxzKSB7XG4gICAgaWYgKGZpbGwudHlwZSA9PT0gJ1NPTElEJyAmJiBmaWxsLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICBjb25zdCBvcGFjaXR5ID0gZmlsbC5vcGFjaXR5ICE9PSB1bmRlZmluZWQgPyBmaWxsLm9wYWNpdHkgOiAxO1xuICAgICAgcmV0dXJuIHJnYmFUb0hleChmaWxsLmNvbG9yLCBvcGFjaXR5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgdGV4dCBjb2xvciBmcm9tIGEgVEVYVCBub2RlJ3MgZmlsbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VGV4dENvbG9yKG5vZGU6IFRleHROb2RlKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuIG51bGw7XG5cbiAgZm9yIChjb25zdCBmaWxsIG9mIG5vZGUuZmlsbHMgYXMgcmVhZG9ubHkgUGFpbnRbXSkge1xuICAgIGlmIChmaWxsLnR5cGUgPT09ICdTT0xJRCcgJiYgZmlsbC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIHJnYlRvSGV4KGZpbGwuY29sb3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGdyYWRpZW50IGFzIENTUyBzdHJpbmcsIG9yIG51bGwgaWYgbm90IGEgZ3JhZGllbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0R3JhZGllbnQobm9kZTogU2NlbmVOb2RlICYgeyBmaWxscz86IHJlYWRvbmx5IFBhaW50W10gfSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoISgnZmlsbHMnIGluIG5vZGUpIHx8ICFub2RlLmZpbGxzIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZmlsbHMpKSByZXR1cm4gbnVsbDtcblxuICBmb3IgKGNvbnN0IGZpbGwgb2Ygbm9kZS5maWxscykge1xuICAgIGlmIChmaWxsLnR5cGUgPT09ICdHUkFESUVOVF9MSU5FQVInICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IHN0b3BzID0gZmlsbC5ncmFkaWVudFN0b3BzXG4gICAgICAgIC5tYXAocyA9PiBgJHtyZ2JUb0hleChzLmNvbG9yKX0gJHtNYXRoLnJvdW5kKHMucG9zaXRpb24gKiAxMDApfSVgKVxuICAgICAgICAuam9pbignLCAnKTtcbiAgICAgIHJldHVybiBgbGluZWFyLWdyYWRpZW50KCR7c3RvcHN9KWA7XG4gICAgfVxuICAgIGlmIChmaWxsLnR5cGUgPT09ICdHUkFESUVOVF9SQURJQUwnICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IHN0b3BzID0gZmlsbC5ncmFkaWVudFN0b3BzXG4gICAgICAgIC5tYXAocyA9PiBgJHtyZ2JUb0hleChzLmNvbG9yKX0gJHtNYXRoLnJvdW5kKHMucG9zaXRpb24gKiAxMDApfSVgKVxuICAgICAgICAuam9pbignLCAnKTtcbiAgICAgIHJldHVybiBgcmFkaWFsLWdyYWRpZW50KCR7c3RvcHN9KWA7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgbm9kZSBoYXMgYW4gSU1BR0UgZmlsbCAocGhvdG9ncmFwaC9iYWNrZ3JvdW5kKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc0ltYWdlRmlsbChub2RlOiBTY2VuZU5vZGUgJiB7IGZpbGxzPzogcmVhZG9ubHkgUGFpbnRbXSB9KTogYm9vbGVhbiB7XG4gIGlmICghKCdmaWxscycgaW4gbm9kZSkgfHwgIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIG5vZGUuZmlsbHMuc29tZShmID0+IGYudHlwZSA9PT0gJ0lNQUdFJyAmJiBmLnZpc2libGUgIT09IGZhbHNlKTtcbn1cblxuLyoqXG4gKiBNYXAgRmlnbWEgc3Ryb2tlQWxpZ24gdG8gYSBzdWl0YWJsZSBDU1MgYm9yZGVyLXN0eWxlLlxuICogRmlnbWEgc3VwcG9ydHMgc29saWQgc3Ryb2tlcyBuYXRpdmVseTsgZGFzaGVkIGlzIGluZmVycmVkIGZyb20gZGFzaFBhdHRlcm4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Qm9yZGVyU3R5bGUobm9kZTogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghKCdzdHJva2VzJyBpbiBub2RlKSB8fCAhQXJyYXkuaXNBcnJheShub2RlLnN0cm9rZXMpIHx8IG5vZGUuc3Ryb2tlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBkYXNoUGF0dGVybiA9IChub2RlIGFzIGFueSkuZGFzaFBhdHRlcm47XG4gIGlmIChBcnJheS5pc0FycmF5KGRhc2hQYXR0ZXJuKSAmJiBkYXNoUGF0dGVybi5sZW5ndGggPiAwKSB7XG4gICAgLy8gMS11bml0IGRhc2hlcyA9IGRvdHRlZCwgbGFyZ2VyID0gZGFzaGVkXG4gICAgY29uc3QgbWF4ID0gTWF0aC5tYXgoLi4uZGFzaFBhdHRlcm4pO1xuICAgIHJldHVybiBtYXggPD0gMiA/ICdkb3R0ZWQnIDogJ2Rhc2hlZCc7XG4gIH1cbiAgcmV0dXJuICdzb2xpZCc7XG59XG5cbi8qKlxuICogRXh0cmFjdCBwZXItc2lkZSBib3JkZXItd2lkdGguIEZpZ21hJ3MgaW5kaXZpZHVhbFN0cm9rZVdlaWdodHMgKGlmIHNldClcbiAqIHByb3ZpZGVzIHBlci1zaWRlIHdpZHRoczsgb3RoZXJ3aXNlIHN0cm9rZVdlaWdodCBpcyB1bmlmb3JtLlxuICogUmV0dXJucyBudWxsIGZvciBhbnkgc2lkZSB0aGF0IGlzIDAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Qm9yZGVyV2lkdGhzKG5vZGU6IGFueSk6IHtcbiAgdG9wOiBudW1iZXIgfCBudWxsOyByaWdodDogbnVtYmVyIHwgbnVsbDsgYm90dG9tOiBudW1iZXIgfCBudWxsOyBsZWZ0OiBudW1iZXIgfCBudWxsOyB1bmlmb3JtOiBudW1iZXIgfCBudWxsO1xufSB7XG4gIGNvbnN0IGluZCA9IChub2RlIGFzIGFueSkuaW5kaXZpZHVhbFN0cm9rZVdlaWdodHM7XG4gIGlmIChpbmQgJiYgdHlwZW9mIGluZCA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiBpbmQudG9wIHx8IG51bGwsXG4gICAgICByaWdodDogaW5kLnJpZ2h0IHx8IG51bGwsXG4gICAgICBib3R0b206IGluZC5ib3R0b20gfHwgbnVsbCxcbiAgICAgIGxlZnQ6IGluZC5sZWZ0IHx8IG51bGwsXG4gICAgICB1bmlmb3JtOiBudWxsLFxuICAgIH07XG4gIH1cbiAgY29uc3QgdyA9IChub2RlIGFzIGFueSkuc3Ryb2tlV2VpZ2h0O1xuICBpZiAodHlwZW9mIHcgPT09ICdudW1iZXInICYmIHcgPiAwKSB7XG4gICAgcmV0dXJuIHsgdG9wOiBudWxsLCByaWdodDogbnVsbCwgYm90dG9tOiBudWxsLCBsZWZ0OiBudWxsLCB1bmlmb3JtOiB3IH07XG4gIH1cbiAgcmV0dXJuIHsgdG9wOiBudWxsLCByaWdodDogbnVsbCwgYm90dG9tOiBudWxsLCBsZWZ0OiBudWxsLCB1bmlmb3JtOiBudWxsIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgZmlyc3QgdmlzaWJsZSBTT0xJRCBzdHJva2UgY29sb3IgYXMgaGV4LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFN0cm9rZUNvbG9yKG5vZGU6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoISgnc3Ryb2tlcycgaW4gbm9kZSkgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5zdHJva2VzKSkgcmV0dXJuIG51bGw7XG4gIGZvciAoY29uc3Qgc3Ryb2tlIG9mIG5vZGUuc3Ryb2tlcykge1xuICAgIGlmIChzdHJva2UudHlwZSA9PT0gJ1NPTElEJyAmJiBzdHJva2UudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiByZ2JUb0hleChzdHJva2UuY29sb3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDb2xsZWN0IGFsbCB1bmlxdWUgY29sb3JzIGZyb20gYSBub2RlIHRyZWUuXG4gKiBSZXR1cm5zIGEgbWFwIG9mIEhFWCBcdTIxOTIgdXNhZ2UgY291bnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0Q29sb3JzKHJvb3Q6IFNjZW5lTm9kZSk6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4ge1xuICBjb25zdCBjb2xvcnM6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIC8vIEZpbGxzXG4gICAgaWYgKCdmaWxscycgaW4gbm9kZSAmJiBub2RlLmZpbGxzICYmIEFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHtcbiAgICAgIGZvciAoY29uc3QgZmlsbCBvZiBub2RlLmZpbGxzKSB7XG4gICAgICAgIGlmIChmaWxsLnR5cGUgPT09ICdTT0xJRCcgJiYgZmlsbC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgIGNvbnN0IGhleCA9IHJnYlRvSGV4KGZpbGwuY29sb3IpO1xuICAgICAgICAgIGNvbG9yc1toZXhdID0gKGNvbG9yc1toZXhdIHx8IDApICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBTdHJva2VzXG4gICAgaWYgKCdzdHJva2VzJyBpbiBub2RlICYmIG5vZGUuc3Ryb2tlcyAmJiBBcnJheS5pc0FycmF5KG5vZGUuc3Ryb2tlcykpIHtcbiAgICAgIGZvciAoY29uc3Qgc3Ryb2tlIG9mIG5vZGUuc3Ryb2tlcykge1xuICAgICAgICBpZiAoc3Ryb2tlLnR5cGUgPT09ICdTT0xJRCcgJiYgc3Ryb2tlLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgY29uc3QgaGV4ID0gcmdiVG9IZXgoc3Ryb2tlLmNvbG9yKTtcbiAgICAgICAgICBjb2xvcnNbaGV4XSA9IChjb2xvcnNbaGV4XSB8fCAwKSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVjdXJzZVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3YWxrKHJvb3QpO1xuICByZXR1cm4gY29sb3JzO1xufVxuIiwgIi8qKlxuICogRXh0cmFjdCBGaWdtYSBFZmZlY3RzIChzaGFkb3dzLCBibHVycykgaW50byBDU1MtcmVhZHkgdmFsdWVzLlxuICpcbiAqIEZpZ21hIHN1cHBvcnRzIGFuIGFycmF5IG9mIGVmZmVjdHMgcGVyIG5vZGUuIFdlIG1hcDpcbiAqICAgRFJPUF9TSEFET1cgIFx1MjE5MiBib3gtc2hhZG93IChtdWx0aXBsZSBhbGxvd2VkLCBjb21tYS1zZXBhcmF0ZWQpXG4gKiAgIElOTkVSX1NIQURPVyBcdTIxOTIgYm94LXNoYWRvdyB3aXRoIGBpbnNldGAga2V5d29yZFxuICogICBMQVlFUl9CTFVSICAgXHUyMTkyIGZpbHRlcjogYmx1cihOcHgpXG4gKiAgIEJBQ0tHUk9VTkRfQkxVUiBcdTIxOTIgYmFja2Ryb3AtZmlsdGVyOiBibHVyKE5weClcbiAqXG4gKiBURVhUIG5vZGVzIGdldCB0aGVpciBEUk9QX1NIQURPVyBtYXBwZWQgdG8gQ1NTIHRleHQtc2hhZG93IGluc3RlYWQgb2ZcbiAqIGJveC1zaGFkb3cgKERPTSByZW5kZXJpbmc6IHRleHQgbm9kZXMgZG9uJ3QgaG9ub3IgYm94LXNoYWRvdyBvbiB0aGVcbiAqIGdseXBocyB0aGVtc2VsdmVzKS5cbiAqL1xuXG5mdW5jdGlvbiByZ2JhU3RyaW5nKGNvbG9yOiB7IHI6IG51bWJlcjsgZzogbnVtYmVyOyBiOiBudW1iZXI7IGE/OiBudW1iZXIgfSk6IHN0cmluZyB7XG4gIGNvbnN0IGEgPSBjb2xvci5hICE9PSB1bmRlZmluZWQgPyBNYXRoLnJvdW5kKGNvbG9yLmEgKiAxMDApIC8gMTAwIDogMTtcbiAgcmV0dXJuIGByZ2JhKCR7TWF0aC5yb3VuZChjb2xvci5yICogMjU1KX0sICR7TWF0aC5yb3VuZChjb2xvci5nICogMjU1KX0sICR7TWF0aC5yb3VuZChjb2xvci5iICogMjU1KX0sICR7YX0pYDtcbn1cblxuZnVuY3Rpb24gc2hhZG93VG9Dc3MoZTogRHJvcFNoYWRvd0VmZmVjdCB8IElubmVyU2hhZG93RWZmZWN0LCBpbnNldDogYm9vbGVhbik6IHN0cmluZyB7XG4gIGNvbnN0IHggPSBNYXRoLnJvdW5kKGUub2Zmc2V0LngpO1xuICBjb25zdCB5ID0gTWF0aC5yb3VuZChlLm9mZnNldC55KTtcbiAgY29uc3QgYmx1ciA9IE1hdGgucm91bmQoZS5yYWRpdXMpO1xuICBjb25zdCBzcHJlYWQgPSBNYXRoLnJvdW5kKChlIGFzIGFueSkuc3ByZWFkIHx8IDApO1xuICBjb25zdCBjb2xvciA9IHJnYmFTdHJpbmcoZS5jb2xvcik7XG4gIGNvbnN0IHByZWZpeCA9IGluc2V0ID8gJ2luc2V0ICcgOiAnJztcbiAgcmV0dXJuIGAke3ByZWZpeH0ke3h9cHggJHt5fXB4ICR7Ymx1cn1weCAke3NwcmVhZH1weCAke2NvbG9yfWA7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXh0cmFjdGVkRWZmZWN0cyB7XG4gIGJveFNoYWRvdzogc3RyaW5nIHwgbnVsbDsgICAgIC8vIGNvbW1hLXNlcGFyYXRlZCBDU1MgdmFsdWUgZm9yIG11bHRpcGxlIHNoYWRvd3NcbiAgdGV4dFNoYWRvdzogc3RyaW5nIHwgbnVsbDsgICAgLy8gZm9yIFRFWFQgbm9kZXMgKERST1BfU0hBRE9XIG9uIHRleHQgYmVjb21lcyB0ZXh0LXNoYWRvdylcbiAgZmlsdGVyOiBzdHJpbmcgfCBudWxsOyAgICAgICAgLy8gTEFZRVJfQkxVUiBcdTIxOTIgYmx1cihOcHgpLCBleHRlbmRhYmxlXG4gIGJhY2tkcm9wRmlsdGVyOiBzdHJpbmcgfCBudWxsOyAvLyBCQUNLR1JPVU5EX0JMVVIgXHUyMTkyIGJsdXIoTnB4KVxufVxuXG4vKipcbiAqIEV4dHJhY3QgYWxsIGVmZmVjdHMgZnJvbSBhIG5vZGUgYW5kIHJldHVybiBDU1MtcmVhZHkgdmFsdWVzLlxuICogUmVzcGVjdHMgRmlnbWEncyB2aXNpYmxlIGZsYWc7IHNraXBzIGhpZGRlbiBlZmZlY3RzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEVmZmVjdHMoXG4gIG5vZGU6IHsgZWZmZWN0cz86IHJlYWRvbmx5IEVmZmVjdFtdOyB0eXBlPzogc3RyaW5nIH0sXG4pOiBFeHRyYWN0ZWRFZmZlY3RzIHtcbiAgY29uc3QgcmVzdWx0OiBFeHRyYWN0ZWRFZmZlY3RzID0ge1xuICAgIGJveFNoYWRvdzogbnVsbCxcbiAgICB0ZXh0U2hhZG93OiBudWxsLFxuICAgIGZpbHRlcjogbnVsbCxcbiAgICBiYWNrZHJvcEZpbHRlcjogbnVsbCxcbiAgfTtcblxuICBpZiAoIW5vZGUuZWZmZWN0cyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmVmZmVjdHMpIHx8IG5vZGUuZWZmZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgY29uc3QgaXNUZXh0ID0gbm9kZS50eXBlID09PSAnVEVYVCc7XG4gIGNvbnN0IHNoYWRvd1N0cmluZ3M6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHRleHRTaGFkb3dTdHJpbmdzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBmaWx0ZXJQYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgYmFja2Ryb3BQYXJ0czogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGVmZmVjdCBvZiBub2RlLmVmZmVjdHMpIHtcbiAgICBpZiAoZWZmZWN0LnZpc2libGUgPT09IGZhbHNlKSBjb250aW51ZTtcblxuICAgIGlmIChlZmZlY3QudHlwZSA9PT0gJ0RST1BfU0hBRE9XJykge1xuICAgICAgY29uc3QgZSA9IGVmZmVjdCBhcyBEcm9wU2hhZG93RWZmZWN0O1xuICAgICAgaWYgKGlzVGV4dCkge1xuICAgICAgICAvLyB0ZXh0LXNoYWRvdyBmb3JtYXQ6IDx4PiA8eT4gPGJsdXI+IDxjb2xvcj4gKG5vIHNwcmVhZClcbiAgICAgICAgY29uc3QgeCA9IE1hdGgucm91bmQoZS5vZmZzZXQueCk7XG4gICAgICAgIGNvbnN0IHkgPSBNYXRoLnJvdW5kKGUub2Zmc2V0LnkpO1xuICAgICAgICBjb25zdCBibHVyID0gTWF0aC5yb3VuZChlLnJhZGl1cyk7XG4gICAgICAgIHRleHRTaGFkb3dTdHJpbmdzLnB1c2goYCR7eH1weCAke3l9cHggJHtibHVyfXB4ICR7cmdiYVN0cmluZyhlLmNvbG9yKX1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNoYWRvd1N0cmluZ3MucHVzaChzaGFkb3dUb0NzcyhlLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZWZmZWN0LnR5cGUgPT09ICdJTk5FUl9TSEFET1cnKSB7XG4gICAgICBjb25zdCBlID0gZWZmZWN0IGFzIElubmVyU2hhZG93RWZmZWN0O1xuICAgICAgLy8gSU5ORVJfU0hBRE9XIG9uIFRFWFQgaXNuJ3QgYSB0aGluZyBpbiBDU1MgXHUyMDE0IGZhbGwgYmFjayB0byBlbXB0eSBmb3IgdGV4dFxuICAgICAgaWYgKCFpc1RleHQpIHNoYWRvd1N0cmluZ3MucHVzaChzaGFkb3dUb0NzcyhlLCB0cnVlKSk7XG4gICAgfSBlbHNlIGlmIChlZmZlY3QudHlwZSA9PT0gJ0xBWUVSX0JMVVInKSB7XG4gICAgICBjb25zdCBlID0gZWZmZWN0IGFzIEJsdXJFZmZlY3Q7XG4gICAgICBmaWx0ZXJQYXJ0cy5wdXNoKGBibHVyKCR7TWF0aC5yb3VuZChlLnJhZGl1cyl9cHgpYCk7XG4gICAgfSBlbHNlIGlmIChlZmZlY3QudHlwZSA9PT0gJ0JBQ0tHUk9VTkRfQkxVUicpIHtcbiAgICAgIGNvbnN0IGUgPSBlZmZlY3QgYXMgQmx1ckVmZmVjdDtcbiAgICAgIGJhY2tkcm9wUGFydHMucHVzaChgYmx1cigke01hdGgucm91bmQoZS5yYWRpdXMpfXB4KWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChzaGFkb3dTdHJpbmdzLmxlbmd0aCA+IDApIHJlc3VsdC5ib3hTaGFkb3cgPSBzaGFkb3dTdHJpbmdzLmpvaW4oJywgJyk7XG4gIGlmICh0ZXh0U2hhZG93U3RyaW5ncy5sZW5ndGggPiAwKSByZXN1bHQudGV4dFNoYWRvdyA9IHRleHRTaGFkb3dTdHJpbmdzLmpvaW4oJywgJyk7XG4gIGlmIChmaWx0ZXJQYXJ0cy5sZW5ndGggPiAwKSByZXN1bHQuZmlsdGVyID0gZmlsdGVyUGFydHMuam9pbignICcpO1xuICBpZiAoYmFja2Ryb3BQYXJ0cy5sZW5ndGggPiAwKSByZXN1bHQuYmFja2Ryb3BGaWx0ZXIgPSBiYWNrZHJvcFBhcnRzLmpvaW4oJyAnKTtcblxuICByZXR1cm4gcmVzdWx0O1xufVxuIiwgImltcG9ydCB7IEVsZW1lbnRTdHlsZXMgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHRvQ3NzVmFsdWUgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGV4dHJhY3RUZXh0Q29sb3IgfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IGV4dHJhY3RFZmZlY3RzIH0gZnJvbSAnLi9lZmZlY3RzJztcblxuLyoqXG4gKiBEZXJpdmUgQ1NTIGZvbnQtd2VpZ2h0IGZyb20gYSBGaWdtYSBmb250IHN0eWxlIG5hbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb250V2VpZ2h0RnJvbVN0eWxlKHN0eWxlOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBzID0gc3R5bGUudG9Mb3dlckNhc2UoKTtcbiAgaWYgKHMuaW5jbHVkZXMoJ3RoaW4nKSB8fCBzLmluY2x1ZGVzKCdoYWlybGluZScpKSByZXR1cm4gMTAwO1xuICBpZiAocy5pbmNsdWRlcygnZXh0cmFsaWdodCcpIHx8IHMuaW5jbHVkZXMoJ3VsdHJhIGxpZ2h0JykgfHwgcy5pbmNsdWRlcygnZXh0cmEgbGlnaHQnKSkgcmV0dXJuIDIwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ2xpZ2h0JykpIHJldHVybiAzMDA7XG4gIGlmIChzLmluY2x1ZGVzKCdtZWRpdW0nKSkgcmV0dXJuIDUwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ3NlbWlib2xkJykgfHwgcy5pbmNsdWRlcygnc2VtaSBib2xkJykgfHwgcy5pbmNsdWRlcygnZGVtaSBib2xkJykgfHwgcy5pbmNsdWRlcygnZGVtaWJvbGQnKSkgcmV0dXJuIDYwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ2V4dHJhYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ2V4dHJhIGJvbGQnKSB8fCBzLmluY2x1ZGVzKCd1bHRyYSBib2xkJykgfHwgcy5pbmNsdWRlcygndWx0cmFib2xkJykpIHJldHVybiA4MDA7XG4gIGlmIChzLmluY2x1ZGVzKCdibGFjaycpIHx8IHMuaW5jbHVkZXMoJ2hlYXZ5JykpIHJldHVybiA5MDA7XG4gIGlmIChzLmluY2x1ZGVzKCdib2xkJykpIHJldHVybiA3MDA7XG4gIHJldHVybiA0MDA7IC8vIFJlZ3VsYXIgLyBOb3JtYWwgLyBCb29rXG59XG5cbi8qKlxuICogTWFwIEZpZ21hIHRleHQgYWxpZ25tZW50IHRvIENTUyB0ZXh0LWFsaWduIHZhbHVlLlxuICovXG5mdW5jdGlvbiBtYXBUZXh0QWxpZ24oYWxpZ246IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBzd2l0Y2ggKGFsaWduKSB7XG4gICAgY2FzZSAnTEVGVCc6IHJldHVybiAnbGVmdCc7XG4gICAgY2FzZSAnQ0VOVEVSJzogcmV0dXJuICdjZW50ZXInO1xuICAgIGNhc2UgJ1JJR0hUJzogcmV0dXJuICdyaWdodCc7XG4gICAgY2FzZSAnSlVTVElGSUVEJzogcmV0dXJuICdqdXN0aWZ5JztcbiAgICBkZWZhdWx0OiByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIE1hcCBGaWdtYSB0ZXh0IGNhc2UgdG8gQ1NTIHRleHQtdHJhbnNmb3JtIHZhbHVlLlxuICovXG5mdW5jdGlvbiBtYXBUZXh0Q2FzZSh0ZXh0Q2FzZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIHN3aXRjaCAodGV4dENhc2UpIHtcbiAgICBjYXNlICdVUFBFUic6IHJldHVybiAndXBwZXJjYXNlJztcbiAgICBjYXNlICdMT1dFUic6IHJldHVybiAnbG93ZXJjYXNlJztcbiAgICBjYXNlICdUSVRMRSc6IHJldHVybiAnY2FwaXRhbGl6ZSc7XG4gICAgY2FzZSAnT1JJR0lOQUwnOlxuICAgIGRlZmF1bHQ6IHJldHVybiAnbm9uZSc7XG4gIH1cbn1cblxuLyoqXG4gKiBFeHRyYWN0IHR5cG9ncmFwaHkgc3R5bGVzIGZyb20gYSBURVhUIG5vZGUuXG4gKiBSZXR1cm5zIENTUy1yZWFkeSB2YWx1ZXMgd2l0aCB1bml0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUeXBvZ3JhcGh5KG5vZGU6IFRleHROb2RlKTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiB7XG4gIGNvbnN0IHN0eWxlczogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHt9O1xuXG4gIC8vIEZvbnQgZmFtaWx5IFx1MjAxNCBoYW5kbGUgbWl4ZWQgZm9udHMgKHVzZSBmaXJzdCBzZWdtZW50KVxuICBjb25zdCBmb250TmFtZSA9IG5vZGUuZm9udE5hbWU7XG4gIGlmIChmb250TmFtZSAhPT0gZmlnbWEubWl4ZWQgJiYgZm9udE5hbWUpIHtcbiAgICBzdHlsZXMuZm9udEZhbWlseSA9IGZvbnROYW1lLmZhbWlseTtcbiAgICBzdHlsZXMuZm9udFdlaWdodCA9IGZvbnRXZWlnaHRGcm9tU3R5bGUoZm9udE5hbWUuc3R5bGUpO1xuICB9XG5cbiAgLy8gRm9udCBzaXplXG4gIGNvbnN0IGZvbnRTaXplID0gbm9kZS5mb250U2l6ZTtcbiAgaWYgKGZvbnRTaXplICE9PSBmaWdtYS5taXhlZCAmJiB0eXBlb2YgZm9udFNpemUgPT09ICdudW1iZXInKSB7XG4gICAgc3R5bGVzLmZvbnRTaXplID0gdG9Dc3NWYWx1ZShmb250U2l6ZSk7XG4gIH1cblxuICAvLyBMaW5lIGhlaWdodFxuICBjb25zdCBsaCA9IG5vZGUubGluZUhlaWdodDtcbiAgaWYgKGxoICE9PSBmaWdtYS5taXhlZCAmJiBsaCkge1xuICAgIGlmIChsaC51bml0ID09PSAnUElYRUxTJykge1xuICAgICAgc3R5bGVzLmxpbmVIZWlnaHQgPSB0b0Nzc1ZhbHVlKGxoLnZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKGxoLnVuaXQgPT09ICdQRVJDRU5UJykge1xuICAgICAgc3R5bGVzLmxpbmVIZWlnaHQgPSBgJHtNYXRoLnJvdW5kKGxoLnZhbHVlKX0lYDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQVVUTyBcdTIwMTQgZGVyaXZlIGZyb20gZm9udCBzaXplXG4gICAgICBzdHlsZXMubGluZUhlaWdodCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLy8gTGV0dGVyIHNwYWNpbmdcbiAgY29uc3QgbHMgPSBub2RlLmxldHRlclNwYWNpbmc7XG4gIGlmIChscyAhPT0gZmlnbWEubWl4ZWQgJiYgbHMpIHtcbiAgICBpZiAobHMudW5pdCA9PT0gJ1BJWEVMUycpIHtcbiAgICAgIHN0eWxlcy5sZXR0ZXJTcGFjaW5nID0gdG9Dc3NWYWx1ZShscy52YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChscy51bml0ID09PSAnUEVSQ0VOVCcpIHtcbiAgICAgIC8vIENvbnZlcnQgcGVyY2VudGFnZSB0byBlbSAoRmlnbWEncyAxMDAlID0gMWVtKVxuICAgICAgY29uc3QgZW1WYWx1ZSA9IE1hdGgucm91bmQoKGxzLnZhbHVlIC8gMTAwKSAqIDEwMCkgLyAxMDA7XG4gICAgICBzdHlsZXMubGV0dGVyU3BhY2luZyA9IGAke2VtVmFsdWV9ZW1gO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRleHQgdHJhbnNmb3JtXG4gIGNvbnN0IHRleHRDYXNlID0gbm9kZS50ZXh0Q2FzZTtcbiAgaWYgKHRleHRDYXNlICE9PSBmaWdtYS5taXhlZCkge1xuICAgIHN0eWxlcy50ZXh0VHJhbnNmb3JtID0gbWFwVGV4dENhc2UodGV4dENhc2UgYXMgc3RyaW5nKTtcbiAgfVxuXG4gIC8vIFRleHQgYWxpZ25tZW50XG4gIGNvbnN0IHRleHRBbGlnbiA9IG5vZGUudGV4dEFsaWduSG9yaXpvbnRhbDtcbiAgaWYgKHRleHRBbGlnbikge1xuICAgIHN0eWxlcy50ZXh0QWxpZ24gPSBtYXBUZXh0QWxpZ24odGV4dEFsaWduKTtcbiAgfVxuXG4gIC8vIFRleHQgZGVjb3JhdGlvbiAodW5kZXJsaW5lIC8gbGluZS10aHJvdWdoIC8gbm9uZSlcbiAgY29uc3QgdGQgPSAobm9kZSBhcyBhbnkpLnRleHREZWNvcmF0aW9uO1xuICBpZiAodGQgIT09IHVuZGVmaW5lZCAmJiB0ZCAhPT0gZmlnbWEubWl4ZWQpIHtcbiAgICBpZiAodGQgPT09ICdVTkRFUkxJTkUnKSBzdHlsZXMudGV4dERlY29yYXRpb24gPSAndW5kZXJsaW5lJztcbiAgICBlbHNlIGlmICh0ZCA9PT0gJ1NUUklLRVRIUk9VR0gnKSBzdHlsZXMudGV4dERlY29yYXRpb24gPSAnbGluZS10aHJvdWdoJztcbiAgICBlbHNlIHN0eWxlcy50ZXh0RGVjb3JhdGlvbiA9IG51bGw7XG4gIH1cblxuICAvLyBDb2xvclxuICBzdHlsZXMuY29sb3IgPSBleHRyYWN0VGV4dENvbG9yKG5vZGUpO1xuXG4gIC8vIFRleHQtc2hhZG93IGZyb20gRFJPUF9TSEFET1cgZWZmZWN0cyBvbiBURVhUIG5vZGVzXG4gIGNvbnN0IGVmZmVjdHMgPSBleHRyYWN0RWZmZWN0cyhub2RlKTtcbiAgaWYgKGVmZmVjdHMudGV4dFNoYWRvdykgc3R5bGVzLnRleHRTaGFkb3cgPSBlZmZlY3RzLnRleHRTaGFkb3c7XG5cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuLyoqXG4gKiBDb2xsZWN0IGFsbCB1bmlxdWUgZm9udCB1c2FnZSBkYXRhIGZyb20gYSBub2RlIHRyZWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0Rm9udHMocm9vdDogU2NlbmVOb2RlKTogUmVjb3JkPHN0cmluZywgeyBzdHlsZXM6IFNldDxzdHJpbmc+OyBzaXplczogU2V0PG51bWJlcj47IGNvdW50OiBudW1iZXIgfT4ge1xuICBjb25zdCBmb250czogUmVjb3JkPHN0cmluZywgeyBzdHlsZXM6IFNldDxzdHJpbmc+OyBzaXplczogU2V0PG51bWJlcj47IGNvdW50OiBudW1iZXIgfT4gPSB7fTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgZm9udE5hbWUgPSBub2RlLmZvbnROYW1lO1xuICAgICAgaWYgKGZvbnROYW1lICE9PSBmaWdtYS5taXhlZCAmJiBmb250TmFtZSkge1xuICAgICAgICBjb25zdCBmYW1pbHkgPSBmb250TmFtZS5mYW1pbHk7XG4gICAgICAgIGlmICghZm9udHNbZmFtaWx5XSkge1xuICAgICAgICAgIGZvbnRzW2ZhbWlseV0gPSB7IHN0eWxlczogbmV3IFNldCgpLCBzaXplczogbmV3IFNldCgpLCBjb3VudDogMCB9O1xuICAgICAgICB9XG4gICAgICAgIGZvbnRzW2ZhbWlseV0uc3R5bGVzLmFkZChmb250TmFtZS5zdHlsZSk7XG4gICAgICAgIGZvbnRzW2ZhbWlseV0uY291bnQrKztcblxuICAgICAgICBjb25zdCBmb250U2l6ZSA9IG5vZGUuZm9udFNpemU7XG4gICAgICAgIGlmIChmb250U2l6ZSAhPT0gZmlnbWEubWl4ZWQgJiYgdHlwZW9mIGZvbnRTaXplID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGZvbnRzW2ZhbWlseV0uc2l6ZXMuYWRkKGZvbnRTaXplKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2Fsayhyb290KTtcbiAgcmV0dXJuIGZvbnRzO1xufVxuXG4vKipcbiAqIENvdW50IFRFWFQgbm9kZXMgaW4gYSBzdWJ0cmVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY291bnRUZXh0Tm9kZXMocm9vdDogU2NlbmVOb2RlKTogbnVtYmVyIHtcbiAgbGV0IGNvdW50ID0gMDtcbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIGNvdW50Kys7XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKHJvb3QpO1xuICByZXR1cm4gY291bnQ7XG59XG4iLCAiaW1wb3J0IHsgU2VjdGlvblN0eWxlcyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgdG9Dc3NWYWx1ZSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIEV4dHJhY3Qgc3BhY2luZyBmcm9tIGFuIGF1dG8tbGF5b3V0IGZyYW1lLlxuICogVGhlc2UgdmFsdWVzIG1hcCAxOjEgdG8gQ1NTIFx1MjAxNCBoaWdoIGNvbmZpZGVuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0QXV0b0xheW91dFNwYWNpbmcobm9kZTogRnJhbWVOb2RlKToge1xuICBzcGFjaW5nU291cmNlOiAnYXV0by1sYXlvdXQnO1xuICBzZWN0aW9uU3R5bGVzOiBQYXJ0aWFsPFNlY3Rpb25TdHlsZXM+O1xuICBpdGVtU3BhY2luZzogc3RyaW5nIHwgbnVsbDtcbn0ge1xuICByZXR1cm4ge1xuICAgIHNwYWNpbmdTb3VyY2U6ICdhdXRvLWxheW91dCcsXG4gICAgc2VjdGlvblN0eWxlczoge1xuICAgICAgcGFkZGluZ1RvcDogdG9Dc3NWYWx1ZShub2RlLnBhZGRpbmdUb3ApLFxuICAgICAgcGFkZGluZ0JvdHRvbTogdG9Dc3NWYWx1ZShub2RlLnBhZGRpbmdCb3R0b20pLFxuICAgICAgcGFkZGluZ0xlZnQ6IHRvQ3NzVmFsdWUobm9kZS5wYWRkaW5nTGVmdCksXG4gICAgICBwYWRkaW5nUmlnaHQ6IHRvQ3NzVmFsdWUobm9kZS5wYWRkaW5nUmlnaHQpLFxuICAgIH0sXG4gICAgaXRlbVNwYWNpbmc6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCBzcGFjaW5nIGZyb20gYW4gYWJzb2x1dGVseS1wb3NpdGlvbmVkIGZyYW1lIGJ5IGNvbXB1dGluZ1xuICogZnJvbSBjaGlsZHJlbidzIGJvdW5kaW5nIGJveGVzLiBUaGVzZSB2YWx1ZXMgYXJlIGFwcHJveGltYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEFic29sdXRlU3BhY2luZyhub2RlOiBGcmFtZU5vZGUpOiB7XG4gIHNwYWNpbmdTb3VyY2U6ICdhYnNvbHV0ZS1jb29yZGluYXRlcyc7XG4gIHNlY3Rpb25TdHlsZXM6IFBhcnRpYWw8U2VjdGlvblN0eWxlcz47XG4gIGl0ZW1TcGFjaW5nOiBzdHJpbmcgfCBudWxsO1xufSB7XG4gIGNvbnN0IHBhcmVudEJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgaWYgKCFwYXJlbnRCb3VuZHMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3BhY2luZ1NvdXJjZTogJ2Fic29sdXRlLWNvb3JkaW5hdGVzJyxcbiAgICAgIHNlY3Rpb25TdHlsZXM6IHtcbiAgICAgICAgcGFkZGluZ1RvcDogbnVsbCxcbiAgICAgICAgcGFkZGluZ0JvdHRvbTogbnVsbCxcbiAgICAgICAgcGFkZGluZ0xlZnQ6IG51bGwsXG4gICAgICAgIHBhZGRpbmdSaWdodDogbnVsbCxcbiAgICAgIH0sXG4gICAgICBpdGVtU3BhY2luZzogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuXG4gICAgLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UgJiYgYy5hYnNvbHV0ZUJvdW5kaW5nQm94KVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3BhY2luZ1NvdXJjZTogJ2Fic29sdXRlLWNvb3JkaW5hdGVzJyxcbiAgICAgIHNlY3Rpb25TdHlsZXM6IHtcbiAgICAgICAgcGFkZGluZ1RvcDogbnVsbCxcbiAgICAgICAgcGFkZGluZ0JvdHRvbTogbnVsbCxcbiAgICAgICAgcGFkZGluZ0xlZnQ6IG51bGwsXG4gICAgICAgIHBhZGRpbmdSaWdodDogbnVsbCxcbiAgICAgIH0sXG4gICAgICBpdGVtU3BhY2luZzogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgZmlyc3RDaGlsZCA9IGNoaWxkcmVuWzBdLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICBjb25zdCBsYXN0Q2hpbGQgPSBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXS5hYnNvbHV0ZUJvdW5kaW5nQm94ITtcblxuICBjb25zdCBwYWRkaW5nVG9wID0gZmlyc3RDaGlsZC55IC0gcGFyZW50Qm91bmRzLnk7XG4gIGNvbnN0IHBhZGRpbmdCb3R0b20gPSAocGFyZW50Qm91bmRzLnkgKyBwYXJlbnRCb3VuZHMuaGVpZ2h0KSAtIChsYXN0Q2hpbGQueSArIGxhc3RDaGlsZC5oZWlnaHQpO1xuXG4gIC8vIENvbXB1dGUgbGVmdCBwYWRkaW5nIGZyb20gdGhlIGxlZnRtb3N0IGNoaWxkXG4gIGNvbnN0IGxlZnRNb3N0ID0gTWF0aC5taW4oLi4uY2hpbGRyZW4ubWFwKGMgPT4gYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS54KSk7XG4gIGNvbnN0IHBhZGRpbmdMZWZ0ID0gbGVmdE1vc3QgLSBwYXJlbnRCb3VuZHMueDtcblxuICAvLyBDb21wdXRlIHJpZ2h0IHBhZGRpbmcgZnJvbSB0aGUgcmlnaHRtb3N0IGNoaWxkXG4gIGNvbnN0IHJpZ2h0TW9zdCA9IE1hdGgubWF4KC4uLmNoaWxkcmVuLm1hcChjID0+IGMuYWJzb2x1dGVCb3VuZGluZ0JveCEueCArIGMuYWJzb2x1dGVCb3VuZGluZ0JveCEud2lkdGgpKTtcbiAgY29uc3QgcGFkZGluZ1JpZ2h0ID0gKHBhcmVudEJvdW5kcy54ICsgcGFyZW50Qm91bmRzLndpZHRoKSAtIHJpZ2h0TW9zdDtcblxuICAvLyBFc3RpbWF0ZSB2ZXJ0aWNhbCBnYXAgZnJvbSBjb25zZWN1dGl2ZSBjaGlsZHJlblxuICBsZXQgdG90YWxHYXAgPSAwO1xuICBsZXQgZ2FwQ291bnQgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGNvbnN0IGN1cnJCb3R0b20gPSBjaGlsZHJlbltpXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55ICsgY2hpbGRyZW5baV0uYWJzb2x1dGVCb3VuZGluZ0JveCEuaGVpZ2h0O1xuICAgIGNvbnN0IG5leHRUb3AgPSBjaGlsZHJlbltpICsgMV0uYWJzb2x1dGVCb3VuZGluZ0JveCEueTtcbiAgICBjb25zdCBnYXAgPSBuZXh0VG9wIC0gY3VyckJvdHRvbTtcbiAgICBpZiAoZ2FwID4gMCkge1xuICAgICAgdG90YWxHYXAgKz0gZ2FwO1xuICAgICAgZ2FwQ291bnQrKztcbiAgICB9XG4gIH1cbiAgY29uc3QgYXZnR2FwID0gZ2FwQ291bnQgPiAwID8gTWF0aC5yb3VuZCh0b3RhbEdhcCAvIGdhcENvdW50KSA6IDA7XG5cbiAgcmV0dXJuIHtcbiAgICBzcGFjaW5nU291cmNlOiAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnLFxuICAgIHNlY3Rpb25TdHlsZXM6IHtcbiAgICAgIHBhZGRpbmdUb3A6IHRvQ3NzVmFsdWUoTWF0aC5tYXgoMCwgTWF0aC5yb3VuZChwYWRkaW5nVG9wKSkpLFxuICAgICAgcGFkZGluZ0JvdHRvbTogdG9Dc3NWYWx1ZShNYXRoLm1heCgwLCBNYXRoLnJvdW5kKHBhZGRpbmdCb3R0b20pKSksXG4gICAgICBwYWRkaW5nTGVmdDogdG9Dc3NWYWx1ZShNYXRoLm1heCgwLCBNYXRoLnJvdW5kKHBhZGRpbmdMZWZ0KSkpLFxuICAgICAgcGFkZGluZ1JpZ2h0OiB0b0Nzc1ZhbHVlKE1hdGgubWF4KDAsIE1hdGgucm91bmQocGFkZGluZ1JpZ2h0KSkpLFxuICAgIH0sXG4gICAgaXRlbVNwYWNpbmc6IGF2Z0dhcCA+IDAgPyB0b0Nzc1ZhbHVlKGF2Z0dhcCkgOiBudWxsLFxuICB9O1xufVxuXG4vKipcbiAqIENvbGxlY3QgYWxsIHNwYWNpbmcgdmFsdWVzIHVzZWQgaW4gYSBub2RlIHRyZWUuXG4gKiBSZXR1cm5zIHNvcnRlZCBhcnJheSBvZiB7IHZhbHVlLCBjb3VudCB9LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFNwYWNpbmcocm9vdDogU2NlbmVOb2RlKTogeyB2YWx1ZTogbnVtYmVyOyBjb3VudDogbnVtYmVyIH1bXSB7XG4gIGNvbnN0IHNwYWNpbmdNYXA6IFJlY29yZDxudW1iZXIsIG51bWJlcj4gPSB7fTtcblxuICBmdW5jdGlvbiBhZGRWYWx1ZSh2OiBudW1iZXIpIHtcbiAgICBpZiAodiA+IDAgJiYgdiA8IDEwMDApIHtcbiAgICAgIGNvbnN0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKHYpO1xuICAgICAgc3BhY2luZ01hcFtyb3VuZGVkXSA9IChzcGFjaW5nTWFwW3JvdW5kZWRdIHx8IDApICsgMTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBpZiAoZnJhbWUubGF5b3V0TW9kZSAmJiBmcmFtZS5sYXlvdXRNb2RlICE9PSAnTk9ORScpIHtcbiAgICAgICAgYWRkVmFsdWUoZnJhbWUucGFkZGluZ1RvcCk7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLnBhZGRpbmdCb3R0b20pO1xuICAgICAgICBhZGRWYWx1ZShmcmFtZS5wYWRkaW5nTGVmdCk7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLnBhZGRpbmdSaWdodCk7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLml0ZW1TcGFjaW5nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdhbGsocm9vdCk7XG5cbiAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHNwYWNpbmdNYXApXG4gICAgLm1hcCgoW3ZhbHVlLCBjb3VudF0pID0+ICh7IHZhbHVlOiBOdW1iZXIodmFsdWUpLCBjb3VudCB9KSlcbiAgICAuc29ydCgoYSwgYikgPT4gYS52YWx1ZSAtIGIudmFsdWUpO1xufVxuIiwgImltcG9ydCB7IEdyaWRTcGVjIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyB0b0Nzc1ZhbHVlIH0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogRGV0ZWN0IHRoZSBncmlkL2xheW91dCBzdHJ1Y3R1cmUgb2YgYSBmcmFtZSBhbmQgcmV0dXJuIGEgR3JpZFNwZWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RHcmlkKG5vZGU6IEZyYW1lTm9kZSk6IEdyaWRTcGVjIHtcbiAgLy8gQXV0by1sYXlvdXQgZnJhbWUgXHUyMTkyIGZsZXggb3IgZ3JpZFxuICBpZiAobm9kZS5sYXlvdXRNb2RlICYmIG5vZGUubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgY29uc3QgaXNXcmFwcGluZyA9ICdsYXlvdXRXcmFwJyBpbiBub2RlICYmIChub2RlIGFzIGFueSkubGF5b3V0V3JhcCA9PT0gJ1dSQVAnO1xuXG4gICAgaWYgKGlzV3JhcHBpbmcpIHtcbiAgICAgIC8vIFdyYXBwaW5nIGF1dG8tbGF5b3V0ID0gZmxleC13cmFwIChncmlkLWxpa2UpXG4gICAgICBjb25zdCBjb2x1bW5zID0gZXN0aW1hdGVDb2x1bW5zRnJvbUNoaWxkcmVuKG5vZGUpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0TW9kZTogJ2ZsZXgnLFxuICAgICAgICBjb2x1bW5zLFxuICAgICAgICBnYXA6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gICAgICAgIHJvd0dhcDogJ2NvdW50ZXJBeGlzU3BhY2luZycgaW4gbm9kZSA/IHRvQ3NzVmFsdWUoKG5vZGUgYXMgYW55KS5jb3VudGVyQXhpc1NwYWNpbmcpIDogbnVsbCxcbiAgICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgICBpdGVtTWluV2lkdGg6IGVzdGltYXRlSXRlbU1pbldpZHRoKG5vZGUsIGNvbHVtbnMpLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBOb24td3JhcHBpbmcgYXV0by1sYXlvdXRcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSBub2RlLmxheW91dE1vZGUgPT09ICdIT1JJWk9OVEFMJztcblxuICAgIGlmIChpc0hvcml6b250YWwpIHtcbiAgICAgIC8vIEhvcml6b250YWwgbGF5b3V0IFx1MjAxNCBjaGlsZHJlbiBhcmUgY29sdW1uc1xuICAgICAgY29uc3QgY29sdW1ucyA9IG5vZGUuY2hpbGRyZW4uZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSkubGVuZ3RoO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0TW9kZTogJ2ZsZXgnLFxuICAgICAgICBjb2x1bW5zLFxuICAgICAgICBnYXA6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gICAgICAgIHJvd0dhcDogbnVsbCxcbiAgICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgICBpdGVtTWluV2lkdGg6IG51bGwsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIFZlcnRpY2FsIGxheW91dCBcdTIwMTQgc2luZ2xlIGNvbHVtbiwgY2hpbGRyZW4gYXJlIHJvd3NcbiAgICAvLyBCdXQgY2hlY2sgaWYgYW55IGRpcmVjdCBjaGlsZCBpcyBhIGhvcml6b250YWwgYXV0by1sYXlvdXQgKG5lc3RlZCBncmlkKVxuICAgIGNvbnN0IGhvcml6b250YWxDaGlsZCA9IG5vZGUuY2hpbGRyZW4uZmluZChjID0+XG4gICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnKSAmJlxuICAgICAgKGMgYXMgRnJhbWVOb2RlKS5sYXlvdXRNb2RlID09PSAnSE9SSVpPTlRBTCdcbiAgICApIGFzIEZyYW1lTm9kZSB8IHVuZGVmaW5lZDtcblxuICAgIGlmIChob3Jpem9udGFsQ2hpbGQpIHtcbiAgICAgIGNvbnN0IGlubmVyQ29sdW1ucyA9IGhvcml6b250YWxDaGlsZC5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlKS5sZW5ndGg7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYXlvdXRNb2RlOiAnZmxleCcsXG4gICAgICAgIGNvbHVtbnM6IGlubmVyQ29sdW1ucyxcbiAgICAgICAgZ2FwOiB0b0Nzc1ZhbHVlKGhvcml6b250YWxDaGlsZC5pdGVtU3BhY2luZyksXG4gICAgICAgIHJvd0dhcDogdG9Dc3NWYWx1ZShub2RlLml0ZW1TcGFjaW5nKSxcbiAgICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgICBpdGVtTWluV2lkdGg6IGVzdGltYXRlSXRlbU1pbldpZHRoKGhvcml6b250YWxDaGlsZCwgaW5uZXJDb2x1bW5zKSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxheW91dE1vZGU6ICdmbGV4JyxcbiAgICAgIGNvbHVtbnM6IDEsXG4gICAgICBnYXA6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gICAgICByb3dHYXA6IG51bGwsXG4gICAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgICBpdGVtTWluV2lkdGg6IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIC8vIE5vIGF1dG8tbGF5b3V0IFx1MjE5MiBhYnNvbHV0ZSBwb3NpdGlvbmluZ1xuICBjb25zdCBjb2x1bW5zID0gZXN0aW1hdGVDb2x1bW5zRnJvbUFic29sdXRlQ2hpbGRyZW4obm9kZSk7XG4gIHJldHVybiB7XG4gICAgbGF5b3V0TW9kZTogJ2Fic29sdXRlJyxcbiAgICBjb2x1bW5zLFxuICAgIGdhcDogZXN0aW1hdGVHYXBGcm9tQWJzb2x1dGVDaGlsZHJlbihub2RlKSxcbiAgICByb3dHYXA6IG51bGwsXG4gICAgY29sdW1uR2FwOiBudWxsLFxuICAgIGl0ZW1NaW5XaWR0aDogbnVsbCxcbiAgfTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBjb2x1bW4gY291bnQgZnJvbSB3cmFwcGluZyBhdXRvLWxheW91dCBjaGlsZHJlbi5cbiAqIENvdW50cyBob3cgbWFueSBjaGlsZHJlbiBmaXQgaW4gdGhlIGZpcnN0IFwicm93XCIgKHNpbWlsYXIgWSBwb3NpdGlvbikuXG4gKi9cbmZ1bmN0aW9uIGVzdGltYXRlQ29sdW1uc0Zyb21DaGlsZHJlbihub2RlOiBGcmFtZU5vZGUpOiBudW1iZXIge1xuICBjb25zdCB2aXNpYmxlID0gbm9kZS5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlICYmIGMuYWJzb2x1dGVCb3VuZGluZ0JveCk7XG4gIGlmICh2aXNpYmxlLmxlbmd0aCA8PSAxKSByZXR1cm4gMTtcblxuICBjb25zdCBmaXJzdFkgPSB2aXNpYmxlWzBdLmFic29sdXRlQm91bmRpbmdCb3ghLnk7XG4gIGNvbnN0IHRvbGVyYW5jZSA9IDU7IC8vIHB4XG4gIGxldCBjb2x1bW5zSW5GaXJzdFJvdyA9IDA7XG5cbiAgZm9yIChjb25zdCBjaGlsZCBvZiB2aXNpYmxlKSB7XG4gICAgaWYgKE1hdGguYWJzKGNoaWxkLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBmaXJzdFkpIDw9IHRvbGVyYW5jZSkge1xuICAgICAgY29sdW1uc0luRmlyc3RSb3crKztcbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE1hdGgubWF4KDEsIGNvbHVtbnNJbkZpcnN0Um93KTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBjb2x1bW4gY291bnQgZnJvbSBhYnNvbHV0ZWx5LXBvc2l0aW9uZWQgY2hpbGRyZW4uXG4gKiBHcm91cHMgY2hpbGRyZW4gYnkgWSBwb3NpdGlvbiAoc2FtZSByb3cgPSBzYW1lIFkgXHUwMEIxIHRvbGVyYW5jZSkuXG4gKi9cbmZ1bmN0aW9uIGVzdGltYXRlQ29sdW1uc0Zyb21BYnNvbHV0ZUNoaWxkcmVuKG5vZGU6IEZyYW1lTm9kZSk6IG51bWJlciB7XG4gIGNvbnN0IHZpc2libGUgPSBub2RlLmNoaWxkcmVuXG4gICAgLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UgJiYgYy5hYnNvbHV0ZUJvdW5kaW5nQm94KVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIGlmICh2aXNpYmxlLmxlbmd0aCA8PSAxKSByZXR1cm4gMTtcblxuICBjb25zdCBmaXJzdFkgPSB2aXNpYmxlWzBdLmFic29sdXRlQm91bmRpbmdCb3ghLnk7XG4gIGNvbnN0IHRvbGVyYW5jZSA9IDEwO1xuICBsZXQgY291bnQgPSAwO1xuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgdmlzaWJsZSkge1xuICAgIGlmIChNYXRoLmFicyhjaGlsZC5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gZmlyc3RZKSA8PSB0b2xlcmFuY2UpIHtcbiAgICAgIGNvdW50Kys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBNYXRoLm1heCgxLCBjb3VudCk7XG59XG5cbi8qKlxuICogRXN0aW1hdGUgZ2FwIGJldHdlZW4gYWJzb2x1dGVseS1wb3NpdGlvbmVkIGNoaWxkcmVuIG9uIHRoZSBzYW1lIHJvdy5cbiAqL1xuZnVuY3Rpb24gZXN0aW1hdGVHYXBGcm9tQWJzb2x1dGVDaGlsZHJlbihub2RlOiBGcmFtZU5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgdmlzaWJsZSA9IG5vZGUuY2hpbGRyZW5cbiAgICAuZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSAmJiBjLmFic29sdXRlQm91bmRpbmdCb3gpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueCAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueCk7XG5cbiAgaWYgKHZpc2libGUubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG5cbiAgLy8gVXNlIHRoZSBmaXJzdCByb3cgb2YgY2hpbGRyZW5cbiAgY29uc3QgZmlyc3RZID0gdmlzaWJsZVswXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55O1xuICBjb25zdCB0b2xlcmFuY2UgPSAxMDtcbiAgY29uc3QgZmlyc3RSb3cgPSB2aXNpYmxlLmZpbHRlcihjID0+XG4gICAgTWF0aC5hYnMoYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gZmlyc3RZKSA8PSB0b2xlcmFuY2VcbiAgKTtcblxuICBpZiAoZmlyc3RSb3cubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG5cbiAgbGV0IHRvdGFsR2FwID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdFJvdy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBjb25zdCByaWdodEVkZ2UgPSBmaXJzdFJvd1tpXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS54ICsgZmlyc3RSb3dbaV0uYWJzb2x1dGVCb3VuZGluZ0JveCEud2lkdGg7XG4gICAgY29uc3QgbmV4dExlZnQgPSBmaXJzdFJvd1tpICsgMV0uYWJzb2x1dGVCb3VuZGluZ0JveCEueDtcbiAgICB0b3RhbEdhcCArPSBuZXh0TGVmdCAtIHJpZ2h0RWRnZTtcbiAgfVxuXG4gIGNvbnN0IGF2Z0dhcCA9IE1hdGgucm91bmQodG90YWxHYXAgLyAoZmlyc3RSb3cubGVuZ3RoIC0gMSkpO1xuICByZXR1cm4gYXZnR2FwID4gMCA/IHRvQ3NzVmFsdWUoYXZnR2FwKSA6IG51bGw7XG59XG5cbi8qKlxuICogRXN0aW1hdGUgbWluaW11bSBpdGVtIHdpZHRoIGZyb20gYSBob3Jpem9udGFsIGxheW91dCdzIGNoaWxkcmVuLlxuICovXG5mdW5jdGlvbiBlc3RpbWF0ZUl0ZW1NaW5XaWR0aChub2RlOiBGcmFtZU5vZGUsIGNvbHVtbnM6IG51bWJlcik6IHN0cmluZyB8IG51bGwge1xuICBpZiAoY29sdW1ucyA8PSAxKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdmlzaWJsZSA9IG5vZGUuY2hpbGRyZW4uZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSAmJiBjLmFic29sdXRlQm91bmRpbmdCb3gpO1xuICBpZiAodmlzaWJsZS5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHdpZHRocyA9IHZpc2libGUubWFwKGMgPT4gYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS53aWR0aCk7XG4gIGNvbnN0IG1pbldpZHRoID0gTWF0aC5taW4oLi4ud2lkdGhzKTtcbiAgcmV0dXJuIHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChtaW5XaWR0aCkpO1xufVxuIiwgImltcG9ydCB7IEludGVyYWN0aW9uU3BlYyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgcmdiVG9IZXgsIGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3IgfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IHRvQ3NzVmFsdWUgfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBNYXAgRmlnbWEgdHJpZ2dlciB0eXBlIHRvIG91ciBzaW1wbGlmaWVkIHRyaWdnZXIgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBtYXBUcmlnZ2VyKHRyaWdnZXJUeXBlOiBzdHJpbmcpOiBJbnRlcmFjdGlvblNwZWNbJ3RyaWdnZXInXSB8IG51bGwge1xuICBzd2l0Y2ggKHRyaWdnZXJUeXBlKSB7XG4gICAgY2FzZSAnT05fSE9WRVInOiByZXR1cm4gJ2hvdmVyJztcbiAgICBjYXNlICdPTl9DTElDSyc6IHJldHVybiAnY2xpY2snO1xuICAgIGNhc2UgJ09OX1BSRVNTJzogcmV0dXJuICdwcmVzcyc7XG4gICAgY2FzZSAnTU9VU0VfRU5URVInOiByZXR1cm4gJ21vdXNlLWVudGVyJztcbiAgICBjYXNlICdNT1VTRV9MRUFWRSc6IHJldHVybiAnbW91c2UtbGVhdmUnO1xuICAgIGRlZmF1bHQ6IHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogTWFwIEZpZ21hIGVhc2luZyB0eXBlIHRvIENTUyB0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gbWFwRWFzaW5nKGVhc2luZzogYW55KTogc3RyaW5nIHtcbiAgaWYgKCFlYXNpbmcpIHJldHVybiAnZWFzZSc7XG4gIHN3aXRjaCAoZWFzaW5nLnR5cGUpIHtcbiAgICBjYXNlICdFQVNFX0lOJzogcmV0dXJuICdlYXNlLWluJztcbiAgICBjYXNlICdFQVNFX09VVCc6IHJldHVybiAnZWFzZS1vdXQnO1xuICAgIGNhc2UgJ0VBU0VfSU5fQU5EX09VVCc6IHJldHVybiAnZWFzZS1pbi1vdXQnO1xuICAgIGNhc2UgJ0xJTkVBUic6IHJldHVybiAnbGluZWFyJztcbiAgICBjYXNlICdDVVNUT01fQ1VCSUNfQkVaSUVSJzoge1xuICAgICAgY29uc3QgYiA9IGVhc2luZy5lYXNpbmdGdW5jdGlvbkN1YmljQmV6aWVyO1xuICAgICAgaWYgKGIpIHJldHVybiBgY3ViaWMtYmV6aWVyKCR7Yi54MX0sICR7Yi55MX0sICR7Yi54Mn0sICR7Yi55Mn0pYDtcbiAgICAgIHJldHVybiAnZWFzZSc7XG4gICAgfVxuICAgIGRlZmF1bHQ6IHJldHVybiAnZWFzZSc7XG4gIH1cbn1cblxuLyoqXG4gKiBEaWZmIHRoZSB2aXN1YWwgcHJvcGVydGllcyBiZXR3ZWVuIGEgc291cmNlIG5vZGUgYW5kIGEgZGVzdGluYXRpb24gbm9kZS5cbiAqIFJldHVybnMgYSByZWNvcmQgb2YgQ1NTIHByb3BlcnR5IGNoYW5nZXMuXG4gKi9cbmZ1bmN0aW9uIGRpZmZOb2RlU3R5bGVzKFxuICBzb3VyY2U6IFNjZW5lTm9kZSxcbiAgZGVzdDogU2NlbmVOb2RlXG4pOiBSZWNvcmQ8c3RyaW5nLCB7IGZyb206IHN0cmluZzsgdG86IHN0cmluZyB9PiB7XG4gIGNvbnN0IGNoYW5nZXM6IFJlY29yZDxzdHJpbmcsIHsgZnJvbTogc3RyaW5nOyB0bzogc3RyaW5nIH0+ID0ge307XG5cbiAgLy8gQmFja2dyb3VuZCBjb2xvclxuICBjb25zdCBzcmNCZyA9IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3Ioc291cmNlIGFzIGFueSk7XG4gIGNvbnN0IGRlc3RCZyA9IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3IoZGVzdCBhcyBhbnkpO1xuICBpZiAoc3JjQmcgJiYgZGVzdEJnICYmIHNyY0JnICE9PSBkZXN0QmcpIHtcbiAgICBjaGFuZ2VzLmJhY2tncm91bmRDb2xvciA9IHsgZnJvbTogc3JjQmcsIHRvOiBkZXN0QmcgfTtcbiAgfVxuXG4gIC8vIE9wYWNpdHlcbiAgaWYgKCdvcGFjaXR5JyBpbiBzb3VyY2UgJiYgJ29wYWNpdHknIGluIGRlc3QpIHtcbiAgICBjb25zdCBzcmNPcCA9IChzb3VyY2UgYXMgYW55KS5vcGFjaXR5O1xuICAgIGNvbnN0IGRlc3RPcCA9IChkZXN0IGFzIGFueSkub3BhY2l0eTtcbiAgICBpZiAoc3JjT3AgIT09IHVuZGVmaW5lZCAmJiBkZXN0T3AgIT09IHVuZGVmaW5lZCAmJiBNYXRoLmFicyhzcmNPcCAtIGRlc3RPcCkgPiAwLjAxKSB7XG4gICAgICBjaGFuZ2VzLm9wYWNpdHkgPSB7IGZyb206IFN0cmluZyhzcmNPcCksIHRvOiBTdHJpbmcoZGVzdE9wKSB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIFNpemUgKHRyYW5zZm9ybTogc2NhbGUpXG4gIGlmIChzb3VyY2UuYWJzb2x1dGVCb3VuZGluZ0JveCAmJiBkZXN0LmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICBjb25zdCBzcmNXID0gc291cmNlLmFic29sdXRlQm91bmRpbmdCb3gud2lkdGg7XG4gICAgY29uc3QgZGVzdFcgPSBkZXN0LmFic29sdXRlQm91bmRpbmdCb3gud2lkdGg7XG4gICAgaWYgKHNyY1cgPiAwICYmIGRlc3RXID4gMCkge1xuICAgICAgY29uc3Qgc2NhbGVYID0gTWF0aC5yb3VuZCgoZGVzdFcgLyBzcmNXKSAqIDEwMCkgLyAxMDA7XG4gICAgICBpZiAoTWF0aC5hYnMoc2NhbGVYIC0gMSkgPiAwLjAxKSB7XG4gICAgICAgIGNoYW5nZXMudHJhbnNmb3JtID0geyBmcm9tOiAnc2NhbGUoMSknLCB0bzogYHNjYWxlKCR7c2NhbGVYfSlgIH07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQm9yZGVyIHJhZGl1c1xuICBpZiAoJ2Nvcm5lclJhZGl1cycgaW4gc291cmNlICYmICdjb3JuZXJSYWRpdXMnIGluIGRlc3QpIHtcbiAgICBjb25zdCBzcmNSID0gKHNvdXJjZSBhcyBhbnkpLmNvcm5lclJhZGl1cztcbiAgICBjb25zdCBkZXN0UiA9IChkZXN0IGFzIGFueSkuY29ybmVyUmFkaXVzO1xuICAgIGlmICh0eXBlb2Ygc3JjUiA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGRlc3RSID09PSAnbnVtYmVyJyAmJiBzcmNSICE9PSBkZXN0Uikge1xuICAgICAgY2hhbmdlcy5ib3JkZXJSYWRpdXMgPSB7IGZyb206IHRvQ3NzVmFsdWUoc3JjUikhLCB0bzogdG9Dc3NWYWx1ZShkZXN0UikhIH07XG4gICAgfVxuICB9XG5cbiAgLy8gQm94IHNoYWRvdyAoZWZmZWN0cylcbiAgaWYgKCdlZmZlY3RzJyBpbiBzb3VyY2UgJiYgJ2VmZmVjdHMnIGluIGRlc3QpIHtcbiAgICBjb25zdCBzcmNTaGFkb3cgPSBleHRyYWN0Qm94U2hhZG93KHNvdXJjZSBhcyBhbnkpO1xuICAgIGNvbnN0IGRlc3RTaGFkb3cgPSBleHRyYWN0Qm94U2hhZG93KGRlc3QgYXMgYW55KTtcbiAgICBpZiAoc3JjU2hhZG93ICE9PSBkZXN0U2hhZG93KSB7XG4gICAgICBjaGFuZ2VzLmJveFNoYWRvdyA9IHsgZnJvbTogc3JjU2hhZG93IHx8ICdub25lJywgdG86IGRlc3RTaGFkb3cgfHwgJ25vbmUnIH07XG4gICAgfVxuICB9XG5cbiAgLy8gQm9yZGVyIGNvbG9yL3dpZHRoIGZyb20gc3Ryb2tlc1xuICBpZiAoJ3N0cm9rZXMnIGluIHNvdXJjZSAmJiAnc3Ryb2tlcycgaW4gZGVzdCkge1xuICAgIGNvbnN0IHNyY1N0cm9rZSA9IGV4dHJhY3RTdHJva2VDb2xvcihzb3VyY2UgYXMgYW55KTtcbiAgICBjb25zdCBkZXN0U3Ryb2tlID0gZXh0cmFjdFN0cm9rZUNvbG9yKGRlc3QgYXMgYW55KTtcbiAgICBpZiAoc3JjU3Ryb2tlICYmIGRlc3RTdHJva2UgJiYgc3JjU3Ryb2tlICE9PSBkZXN0U3Ryb2tlKSB7XG4gICAgICBjaGFuZ2VzLmJvcmRlckNvbG9yID0geyBmcm9tOiBzcmNTdHJva2UsIHRvOiBkZXN0U3Ryb2tlIH07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNoYW5nZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdCBib3gtc2hhZG93IENTUyB2YWx1ZSBmcm9tIG5vZGUgZWZmZWN0cy5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEJveFNoYWRvdyhub2RlOiB7IGVmZmVjdHM/OiByZWFkb25seSBFZmZlY3RbXSB9KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghbm9kZS5lZmZlY3RzKSByZXR1cm4gbnVsbDtcbiAgZm9yIChjb25zdCBlZmZlY3Qgb2Ygbm9kZS5lZmZlY3RzKSB7XG4gICAgaWYgKGVmZmVjdC50eXBlID09PSAnRFJPUF9TSEFET1cnICYmIGVmZmVjdC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgY29uc3QgeyBvZmZzZXQsIHJhZGl1cywgc3ByZWFkLCBjb2xvciB9ID0gZWZmZWN0IGFzIERyb3BTaGFkb3dFZmZlY3Q7XG4gICAgICBjb25zdCBoZXggPSByZ2JUb0hleChjb2xvcik7XG4gICAgICBjb25zdCBhbHBoYSA9IE1hdGgucm91bmQoKGNvbG9yLmEgfHwgMSkgKiAxMDApIC8gMTAwO1xuICAgICAgcmV0dXJuIGAke29mZnNldC54fXB4ICR7b2Zmc2V0Lnl9cHggJHtyYWRpdXN9cHggJHtzcHJlYWQgfHwgMH1weCByZ2JhKCR7TWF0aC5yb3VuZChjb2xvci5yICogMjU1KX0sICR7TWF0aC5yb3VuZChjb2xvci5nICogMjU1KX0sICR7TWF0aC5yb3VuZChjb2xvci5iICogMjU1KX0sICR7YWxwaGF9KWA7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgcHJpbWFyeSBzdHJva2UgY29sb3IgZnJvbSBhIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RTdHJva2VDb2xvcihub2RlOiB7IHN0cm9rZXM/OiByZWFkb25seSBQYWludFtdIH0pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFub2RlLnN0cm9rZXMpIHJldHVybiBudWxsO1xuICBmb3IgKGNvbnN0IHN0cm9rZSBvZiBub2RlLnN0cm9rZXMpIHtcbiAgICBpZiAoc3Ryb2tlLnR5cGUgPT09ICdTT0xJRCcgJiYgc3Ryb2tlLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gcmdiVG9IZXgoc3Ryb2tlLmNvbG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBhbGwgcHJvdG90eXBlIGludGVyYWN0aW9ucyBmcm9tIGEgc2VjdGlvbidzIG5vZGUgdHJlZS5cbiAqIFdhbGtzIGFsbCBkZXNjZW5kYW50cywgZmluZHMgbm9kZXMgd2l0aCByZWFjdGlvbnMsIGFuZCBwcm9kdWNlcyBJbnRlcmFjdGlvblNwZWNbXS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RJbnRlcmFjdGlvbnMoc2VjdGlvblJvb3Q6IFNjZW5lTm9kZSk6IEludGVyYWN0aW9uU3BlY1tdIHtcbiAgY29uc3QgaW50ZXJhY3Rpb25zOiBJbnRlcmFjdGlvblNwZWNbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdyZWFjdGlvbnMnIGluIG5vZGUpIHtcbiAgICAgIGNvbnN0IHJlYWN0aW9ucyA9IChub2RlIGFzIGFueSkucmVhY3Rpb25zIGFzIGFueVtdO1xuICAgICAgaWYgKHJlYWN0aW9ucyAmJiByZWFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGNvbnN0IHJlYWN0aW9uIG9mIHJlYWN0aW9ucykge1xuICAgICAgICAgIGNvbnN0IHRyaWdnZXIgPSBtYXBUcmlnZ2VyKHJlYWN0aW9uLnRyaWdnZXI/LnR5cGUpO1xuICAgICAgICAgIGlmICghdHJpZ2dlcikgY29udGludWU7XG5cbiAgICAgICAgICBjb25zdCBhY3Rpb24gPSByZWFjdGlvbi5hY3Rpb24gfHwgKHJlYWN0aW9uLmFjdGlvbnMgJiYgcmVhY3Rpb24uYWN0aW9uc1swXSk7XG4gICAgICAgICAgaWYgKCFhY3Rpb24pIGNvbnRpbnVlO1xuXG4gICAgICAgICAgLy8gR2V0IHRyYW5zaXRpb24gZGF0YVxuICAgICAgICAgIGNvbnN0IHRyYW5zaXRpb24gPSBhY3Rpb24udHJhbnNpdGlvbjtcbiAgICAgICAgICBjb25zdCBkdXJhdGlvbiA9IHRyYW5zaXRpb24/LmR1cmF0aW9uID8gYCR7dHJhbnNpdGlvbi5kdXJhdGlvbn1zYCA6ICcwLjNzJztcbiAgICAgICAgICBjb25zdCBlYXNpbmcgPSBtYXBFYXNpbmcodHJhbnNpdGlvbj8uZWFzaW5nKTtcblxuICAgICAgICAgIC8vIEZvciBob3Zlci9jbGljayB3aXRoIGRlc3RpbmF0aW9uIG5vZGUgXHUyMDE0IGRpZmYgc3R5bGVzXG4gICAgICAgICAgaWYgKGFjdGlvbi5kZXN0aW5hdGlvbklkICYmICh0cmlnZ2VyID09PSAnaG92ZXInIHx8IHRyaWdnZXIgPT09ICdtb3VzZS1lbnRlcicgfHwgdHJpZ2dlciA9PT0gJ2NsaWNrJykpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRlc3ROb2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQoYWN0aW9uLmRlc3RpbmF0aW9uSWQpO1xuICAgICAgICAgICAgICBpZiAoZGVzdE5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eUNoYW5nZXMgPSBkaWZmTm9kZVN0eWxlcyhub2RlLCBkZXN0Tm9kZSBhcyBTY2VuZU5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhwcm9wZXJ0eUNoYW5nZXMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudE5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZmlnbWFOb2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXIsXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246IHsgZHVyYXRpb24sIGVhc2luZyB9LFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eUNoYW5nZXMsXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAvLyBEZXN0aW5hdGlvbiBub2RlIG5vdCBhY2Nlc3NpYmxlIChkaWZmZXJlbnQgcGFnZSwgZXRjLilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2FsayhzZWN0aW9uUm9vdCk7XG4gIHJldHVybiBpbnRlcmFjdGlvbnM7XG59XG4iLCAiaW1wb3J0IHsgU2VjdGlvblNwZWMsIFNlY3Rpb25TdHlsZXMsIEVsZW1lbnRTdHlsZXMsIE92ZXJsYXBJbmZvLCBMYXllckluZm8sIENvbXBvc2l0aW9uSW5mbywgRm9ybUZpZWxkSW5mbywgVGV4dENvbnRlbnRFbnRyeSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgdG9Dc3NWYWx1ZSwgdG9MYXlvdXROYW1lLCBzY3JlZW5zaG90RmlsZW5hbWUsIGNvbXB1dGVBc3BlY3RSYXRpbyB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgZXh0cmFjdEJhY2tncm91bmRDb2xvciwgZXh0cmFjdEdyYWRpZW50LCBoYXNJbWFnZUZpbGwsIGV4dHJhY3RCb3JkZXJTdHlsZSwgZXh0cmFjdEJvcmRlcldpZHRocywgZXh0cmFjdFN0cm9rZUNvbG9yIH0gZnJvbSAnLi9jb2xvcic7XG5pbXBvcnQgeyBleHRyYWN0VHlwb2dyYXBoeSB9IGZyb20gJy4vdHlwb2dyYXBoeSc7XG5pbXBvcnQgeyBleHRyYWN0QXV0b0xheW91dFNwYWNpbmcsIGV4dHJhY3RBYnNvbHV0ZVNwYWNpbmcgfSBmcm9tICcuL3NwYWNpbmcnO1xuaW1wb3J0IHsgZGV0ZWN0R3JpZCB9IGZyb20gJy4vZ3JpZCc7XG5pbXBvcnQgeyBleHRyYWN0SW50ZXJhY3Rpb25zIH0gZnJvbSAnLi9pbnRlcmFjdGlvbnMnO1xuaW1wb3J0IHsgZXh0cmFjdEVmZmVjdHMgfSBmcm9tICcuL2VmZmVjdHMnO1xuXG4vKipcbiAqIElkZW50aWZ5IHNlY3Rpb24gZnJhbWVzIHdpdGhpbiBhIHBhZ2UgZnJhbWUuXG4gKiBTZWN0aW9ucyBhcmUgdGhlIGRpcmVjdCBjaGlsZHJlbiBvZiB0aGUgcGFnZSBmcmFtZSwgc29ydGVkIGJ5IFkgcG9zaXRpb24uXG4gKiBJZiB0aGUgZnJhbWUgaGFzIGEgc2luZ2xlIHdyYXBwZXIgY2hpbGQsIGRyaWxsIG9uZSBsZXZlbCBkZWVwZXIuXG4gKi9cbmZ1bmN0aW9uIGlkZW50aWZ5U2VjdGlvbnMocGFnZUZyYW1lOiBGcmFtZU5vZGUpOiBTY2VuZU5vZGVbXSB7XG4gIGxldCBjYW5kaWRhdGVzID0gcGFnZUZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKVxuICApO1xuXG4gIC8vIElmIHRoZXJlJ3MgYSBzaW5nbGUgY29udGFpbmVyIGNoaWxkLCBkcmlsbCBvbmUgbGV2ZWwgZGVlcGVyXG4gIGlmIChjYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSAmJiAnY2hpbGRyZW4nIGluIGNhbmRpZGF0ZXNbMF0pIHtcbiAgICBjb25zdCB3cmFwcGVyID0gY2FuZGlkYXRlc1swXSBhcyBGcmFtZU5vZGU7XG4gICAgY29uc3QgaW5uZXJDYW5kaWRhdGVzID0gd3JhcHBlci5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICAgKTtcbiAgICBpZiAoaW5uZXJDYW5kaWRhdGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNhbmRpZGF0ZXMgPSBpbm5lckNhbmRpZGF0ZXM7XG4gICAgfVxuICB9XG5cbiAgLy8gU29ydCBieSBZIHBvc2l0aW9uICh0b3AgdG8gYm90dG9tKVxuICByZXR1cm4gWy4uLmNhbmRpZGF0ZXNdLnNvcnQoKGEsIGIpID0+IHtcbiAgICBjb25zdCBhWSA9IGEuYWJzb2x1dGVCb3VuZGluZ0JveD8ueSA/PyAwO1xuICAgIGNvbnN0IGJZID0gYi5hYnNvbHV0ZUJvdW5kaW5nQm94Py55ID8/IDA7XG4gICAgcmV0dXJuIGFZIC0gYlk7XG4gIH0pO1xufVxuXG4vKipcbiAqIEV4dHJhY3Qgc2VjdGlvbi1sZXZlbCBzdHlsZXMgZnJvbSBhIGZyYW1lLlxuICovXG5mdW5jdGlvbiBleHRyYWN0U2VjdGlvblN0eWxlcyhub2RlOiBTY2VuZU5vZGUpOiBTZWN0aW9uU3R5bGVzIHtcbiAgY29uc3QgYmcgPSBleHRyYWN0QmFja2dyb3VuZENvbG9yKG5vZGUgYXMgYW55KTtcbiAgY29uc3QgZ3JhZGllbnQgPSBleHRyYWN0R3JhZGllbnQobm9kZSBhcyBhbnkpO1xuICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGNvbnN0IGVmZmVjdHMgPSBleHRyYWN0RWZmZWN0cyhub2RlIGFzIGFueSk7XG4gIGNvbnN0IGNvcm5lcnMgPSBleHRyYWN0UGVyQ29ybmVyUmFkaXVzKG5vZGUgYXMgYW55KTtcblxuICBjb25zdCBzdHlsZXM6IFNlY3Rpb25TdHlsZXMgPSB7XG4gICAgcGFkZGluZ1RvcDogbnVsbCwgIC8vIFNldCBieSBzcGFjaW5nIGV4dHJhY3RvclxuICAgIHBhZGRpbmdCb3R0b206IG51bGwsXG4gICAgcGFkZGluZ0xlZnQ6IG51bGwsXG4gICAgcGFkZGluZ1JpZ2h0OiBudWxsLFxuICAgIGJhY2tncm91bmRDb2xvcjogYmcsXG4gICAgYmFja2dyb3VuZEltYWdlOiBoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpID8gJ3VybCguLi4pJyA6IG51bGwsXG4gICAgYmFja2dyb3VuZEdyYWRpZW50OiBncmFkaWVudCxcbiAgICBtaW5IZWlnaHQ6IGJvdW5kcyA/IHRvQ3NzVmFsdWUoYm91bmRzLmhlaWdodCkgOiBudWxsLFxuICAgIG92ZXJmbG93OiBudWxsLFxuICAgIGJveFNoYWRvdzogZWZmZWN0cy5ib3hTaGFkb3csXG4gICAgZmlsdGVyOiBlZmZlY3RzLmZpbHRlcixcbiAgICBiYWNrZHJvcEZpbHRlcjogZWZmZWN0cy5iYWNrZHJvcEZpbHRlcixcbiAgfTtcbiAgaWYgKGNvcm5lcnMpIHtcbiAgICBpZiAoY29ybmVycy51bmlmb3JtICE9PSBudWxsKSB7XG4gICAgICAvLyB1bmlmb3JtIGNvcm5lcnMgXHUyMDE0IGFnZW50cyBhcHBseSB2aWEgYm9yZGVyLXJhZGl1cyBzaG9ydGhhbmQgYXQgZWxlbWVudCBsZXZlbDtcbiAgICAgIC8vIHNlY3Rpb25zIHJhcmVseSBoYXZlIGEgc2luZ2xlIHJhZGl1cyBzbyB3ZSBvbmx5IGVtaXQgcGVyLWNvcm5lciB3aGVuIGRpZmZlcmluZ1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMuYm9yZGVyVG9wTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy50b3BMZWZ0KTtcbiAgICAgIHN0eWxlcy5ib3JkZXJUb3BSaWdodFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy50b3BSaWdodCk7XG4gICAgICBzdHlsZXMuYm9yZGVyQm90dG9tTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy5ib3R0b21MZWZ0KTtcbiAgICAgIHN0eWxlcy5ib3JkZXJCb3R0b21SaWdodFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy5ib3R0b21SaWdodCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHlsZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdCBwZXItY29ybmVyIGJvcmRlci1yYWRpdXMgZnJvbSBhIG5vZGUuIEZpZ21hIHN0b3Jlc1xuICogdG9wTGVmdFJhZGl1cyAvIHRvcFJpZ2h0UmFkaXVzIC8gYm90dG9tTGVmdFJhZGl1cyAvIGJvdHRvbVJpZ2h0UmFkaXVzXG4gKiBhcyBpbmRpdmlkdWFsIHByb3BlcnRpZXMgb24gUmVjdGFuZ2xlTm9kZSBhbmQgRnJhbWVOb2RlLiBXaGVuIHRoZVxuICogdW5pZm9ybSBjb3JuZXJSYWRpdXMgaXMgYSBudW1iZXIsIGFsbCBmb3VyIGFyZSBlcXVhbC5cbiAqIFJldHVybnMgbnVsbCBpZiB0aGUgbm9kZSBoYXMgbm8gY29ybmVyIGRhdGEuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RQZXJDb3JuZXJSYWRpdXMobm9kZTogYW55KToge1xuICB0b3BMZWZ0OiBudW1iZXI7IHRvcFJpZ2h0OiBudW1iZXI7IGJvdHRvbUxlZnQ6IG51bWJlcjsgYm90dG9tUmlnaHQ6IG51bWJlcjsgdW5pZm9ybTogbnVtYmVyIHwgbnVsbDtcbn0gfCBudWxsIHtcbiAgY29uc3QgbiA9IG5vZGUgYXMgYW55O1xuICBjb25zdCBjciA9IG4uY29ybmVyUmFkaXVzO1xuICBjb25zdCB0bCA9IHR5cGVvZiBuLnRvcExlZnRSYWRpdXMgPT09ICdudW1iZXInID8gbi50b3BMZWZ0UmFkaXVzIDogbnVsbDtcbiAgY29uc3QgdHIgPSB0eXBlb2Ygbi50b3BSaWdodFJhZGl1cyA9PT0gJ251bWJlcicgPyBuLnRvcFJpZ2h0UmFkaXVzIDogbnVsbDtcbiAgY29uc3QgYmwgPSB0eXBlb2Ygbi5ib3R0b21MZWZ0UmFkaXVzID09PSAnbnVtYmVyJyA/IG4uYm90dG9tTGVmdFJhZGl1cyA6IG51bGw7XG4gIGNvbnN0IGJyID0gdHlwZW9mIG4uYm90dG9tUmlnaHRSYWRpdXMgPT09ICdudW1iZXInID8gbi5ib3R0b21SaWdodFJhZGl1cyA6IG51bGw7XG5cbiAgaWYgKHR5cGVvZiBjciA9PT0gJ251bWJlcicgJiYgdGwgPT09IG51bGwpIHtcbiAgICAvLyBVbmlmb3JtIGNvcm5lcnMgKG9yIGNvcm5lclJhZGl1cyBpcyB0aGUgbWl4ZWQgc3ltYm9sKVxuICAgIGlmIChjciA9PT0gMCkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHsgdG9wTGVmdDogY3IsIHRvcFJpZ2h0OiBjciwgYm90dG9tTGVmdDogY3IsIGJvdHRvbVJpZ2h0OiBjciwgdW5pZm9ybTogY3IgfTtcbiAgfVxuICBpZiAodGwgIT09IG51bGwgfHwgdHIgIT09IG51bGwgfHwgYmwgIT09IG51bGwgfHwgYnIgIT09IG51bGwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdG9wTGVmdDogdGwgfHwgMCxcbiAgICAgIHRvcFJpZ2h0OiB0ciB8fCAwLFxuICAgICAgYm90dG9tTGVmdDogYmwgfHwgMCxcbiAgICAgIGJvdHRvbVJpZ2h0OiBiciB8fCAwLFxuICAgICAgdW5pZm9ybTogKHRsID09PSB0ciAmJiB0ciA9PT0gYmwgJiYgYmwgPT09IGJyKSA/ICh0bCB8fCAwKSA6IG51bGwsXG4gICAgfTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBBcHBseSBwZXItY29ybmVyIHJhZGl1cyB0byBhbiBFbGVtZW50U3R5bGVzLiBJZiBhbGwgNCBhcmUgZXF1YWwsIGVtaXRcbiAqIGJvcmRlclJhZGl1cyBzaG9ydGhhbmQ7IG90aGVyd2lzZSBlbWl0IHRoZSA0IGV4cGxpY2l0IHZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gYXBwbHlSYWRpdXMoZWxlbTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiwgbm9kZTogYW55KTogdm9pZCB7XG4gIGNvbnN0IGNvcm5lcnMgPSBleHRyYWN0UGVyQ29ybmVyUmFkaXVzKG5vZGUpO1xuICBpZiAoIWNvcm5lcnMpIHJldHVybjtcbiAgaWYgKGNvcm5lcnMudW5pZm9ybSAhPT0gbnVsbCkge1xuICAgIGVsZW0uYm9yZGVyUmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnVuaWZvcm0pO1xuICAgIHJldHVybjtcbiAgfVxuICBlbGVtLmJvcmRlclRvcExlZnRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudG9wTGVmdCk7XG4gIGVsZW0uYm9yZGVyVG9wUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudG9wUmlnaHQpO1xuICBlbGVtLmJvcmRlckJvdHRvbUxlZnRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMuYm90dG9tTGVmdCk7XG4gIGVsZW0uYm9yZGVyQm90dG9tUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMuYm90dG9tUmlnaHQpO1xufVxuXG4vKipcbiAqIEFwcGx5IHN0cm9rZXMgdG8gYW4gRWxlbWVudFN0eWxlczogcGVyLXNpZGUgYm9yZGVyLXdpZHRoIHdoZW4gRmlnbWEgaGFzXG4gKiBpbmRpdmlkdWFsU3Ryb2tlV2VpZ2h0cywgc2luZ2xlIGJvcmRlcldpZHRoIG90aGVyd2lzZS4gQWxzbyBtYXBzIHN0eWxlXG4gKiAoc29saWQvZGFzaGVkL2RvdHRlZCkgYW5kIGNvbG9yLlxuICovXG5mdW5jdGlvbiBhcHBseVN0cm9rZXMoZWxlbTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiwgbm9kZTogYW55KTogdm9pZCB7XG4gIGNvbnN0IGNvbG9yID0gZXh0cmFjdFN0cm9rZUNvbG9yKG5vZGUpO1xuICBjb25zdCB3aWR0aHMgPSBleHRyYWN0Qm9yZGVyV2lkdGhzKG5vZGUpO1xuICBjb25zdCBzdHlsZSA9IGV4dHJhY3RCb3JkZXJTdHlsZShub2RlKTtcbiAgaWYgKCFjb2xvcikgcmV0dXJuO1xuXG4gIGlmICh3aWR0aHMudW5pZm9ybSAhPT0gbnVsbCkge1xuICAgIGVsZW0uYm9yZGVyV2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy51bmlmb3JtKTtcbiAgICBlbGVtLmJvcmRlckNvbG9yID0gY29sb3I7XG4gICAgZWxlbS5ib3JkZXJTdHlsZSA9IHN0eWxlO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAod2lkdGhzLnRvcCB8fCB3aWR0aHMucmlnaHQgfHwgd2lkdGhzLmJvdHRvbSB8fCB3aWR0aHMubGVmdCkge1xuICAgIGlmICh3aWR0aHMudG9wKSBlbGVtLmJvcmRlclRvcFdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMudG9wKTtcbiAgICBpZiAod2lkdGhzLnJpZ2h0KSBlbGVtLmJvcmRlclJpZ2h0V2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy5yaWdodCk7XG4gICAgaWYgKHdpZHRocy5ib3R0b20pIGVsZW0uYm9yZGVyQm90dG9tV2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy5ib3R0b20pO1xuICAgIGlmICh3aWR0aHMubGVmdCkgZWxlbS5ib3JkZXJMZWZ0V2lkdGggPSB0b0Nzc1ZhbHVlKHdpZHRocy5sZWZ0KTtcbiAgICBlbGVtLmJvcmRlckNvbG9yID0gY29sb3I7XG4gICAgZWxlbS5ib3JkZXJTdHlsZSA9IHN0eWxlO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdCBvYmplY3QtcG9zaXRpb24gZnJvbSBhbiBpbWFnZSBmaWxsJ3MgaW1hZ2VUcmFuc2Zvcm0gKGNyb3Agb2Zmc2V0KS5cbiAqIEZpZ21hJ3MgaW1hZ2VUcmFuc2Zvcm0gaXMgYSAyeDMgYWZmaW5lIG1hdHJpeC4gV2hlbiB0aGUgaW1hZ2UgaGFzIGJlZW5cbiAqIGNyb3BwZWQvcmVwb3NpdGlvbmVkIGluIEZpZ21hLCB0aGUgdHJhbnNsYXRpb24gY29tcG9uZW50cyB0ZWxsIHVzIHRoZVxuICogZm9jYWwgcG9pbnQuIE1hcCB0byBDU1Mgb2JqZWN0LXBvc2l0aW9uIC8gYmFja2dyb3VuZC1wb3NpdGlvbi5cbiAqXG4gKiBSZXR1cm5zIG51bGwgd2hlbiB0aGUgaW1hZ2UgaXMgY2VudGVyZWQgKGRlZmF1bHQpLCBvciB3aGVuIG5vZGUgaGFzIG5vXG4gKiBpbWFnZVRyYW5zZm9ybSBkYXRhLlxuICovXG5mdW5jdGlvbiBleHRyYWN0T2JqZWN0UG9zaXRpb24obm9kZTogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGltZ0ZpbGwgPSBub2RlLmZpbGxzLmZpbmQoKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSkgYXMgSW1hZ2VQYWludCB8IHVuZGVmaW5lZDtcbiAgaWYgKCFpbWdGaWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdCA9IChpbWdGaWxsIGFzIGFueSkuaW1hZ2VUcmFuc2Zvcm0gYXMgbnVtYmVyW11bXSB8IHVuZGVmaW5lZDtcbiAgaWYgKCF0IHx8ICFBcnJheS5pc0FycmF5KHQpIHx8IHQubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG4gIC8vIGltYWdlVHJhbnNmb3JtIGlzIGEgMngzIG1hdHJpeDogW1thLCBiLCB0eF0sIFtjLCBkLCB0eV1dXG4gIC8vIHR4L3R5IGFyZSBub3JtYWxpemVkICgwLi4xKSB0cmFuc2xhdGlvbiBcdTIwMTQgMCA9IGxlZnQvdG9wLCAwLjUgPSBjZW50ZXJcbiAgY29uc3QgdHggPSB0WzBdICYmIHR5cGVvZiB0WzBdWzJdID09PSAnbnVtYmVyJyA/IHRbMF1bMl0gOiAwLjU7XG4gIGNvbnN0IHR5ID0gdFsxXSAmJiB0eXBlb2YgdFsxXVsyXSA9PT0gJ251bWJlcicgPyB0WzFdWzJdIDogMC41O1xuICAvLyBEZWZhdWx0IChjZW50ZXJlZCkgXHUyMTkyIG51bGwgKGJyb3dzZXIgdXNlcyBcIjUwJSA1MCVcIiBieSBkZWZhdWx0KVxuICBpZiAoTWF0aC5hYnModHggLSAwLjUpIDwgMC4wMSAmJiBNYXRoLmFicyh0eSAtIDAuNSkgPCAwLjAxKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgeFBjdCA9IE1hdGgucm91bmQodHggKiAxMDApO1xuICBjb25zdCB5UGN0ID0gTWF0aC5yb3VuZCh0eSAqIDEwMCk7XG4gIHJldHVybiBgJHt4UGN0fSUgJHt5UGN0fSVgO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdHJhbnNmb3JtIChyb3RhdGlvbiArIHNjYWxlKSBmcm9tIGEgbm9kZSdzIHJlbGF0aXZlVHJhbnNmb3JtLlxuICogRmlnbWEncyByZWxhdGl2ZVRyYW5zZm9ybSBpcyBhIDJ4MyBtYXRyaXggXHUyMDE0IHdlIGRlY29tcG9zZSBpdCB0byByb3RhdGlvblxuICogYW5kIHNjYWxlIHdoZW4gdGhleSdyZSBub24taWRlbnRpdHkuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RUcmFuc2Zvcm0obm9kZTogYW55KTogeyB0cmFuc2Zvcm06IHN0cmluZyB8IG51bGwgfSB7XG4gIGNvbnN0IHJ0ID0gbm9kZS5yZWxhdGl2ZVRyYW5zZm9ybSBhcyBudW1iZXJbXVtdIHwgdW5kZWZpbmVkO1xuICBpZiAoIXJ0IHx8ICFBcnJheS5pc0FycmF5KHJ0KSB8fCBydC5sZW5ndGggPCAyKSByZXR1cm4geyB0cmFuc2Zvcm06IG51bGwgfTtcbiAgLy8gRXh0cmFjdCByb3RhdGlvbiBmcm9tIHRoZSBtYXRyaXg6IGFuZ2xlID0gYXRhbjIobVsxXVswXSwgbVswXVswXSlcbiAgY29uc3QgYSA9IHJ0WzBdWzBdLCBiID0gcnRbMF1bMV0sIGMgPSBydFsxXVswXSwgZCA9IHJ0WzFdWzFdO1xuICBjb25zdCByYWRpYW5zID0gTWF0aC5hdGFuMihjLCBhKTtcbiAgY29uc3QgZGVncmVlcyA9IE1hdGgucm91bmQoKHJhZGlhbnMgKiAxODApIC8gTWF0aC5QSSk7XG4gIGNvbnN0IHNjYWxlWCA9IE1hdGguc3FydChhICogYSArIGMgKiBjKTtcbiAgY29uc3Qgc2NhbGVZID0gTWF0aC5zcXJ0KGIgKiBiICsgZCAqIGQpO1xuXG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoTWF0aC5hYnMoZGVncmVlcykgPiAwLjUpIHBhcnRzLnB1c2goYHJvdGF0ZSgke2RlZ3JlZXN9ZGVnKWApO1xuICBpZiAoTWF0aC5hYnMoc2NhbGVYIC0gMSkgPiAwLjAyKSBwYXJ0cy5wdXNoKGBzY2FsZVgoJHtNYXRoLnJvdW5kKHNjYWxlWCAqIDEwMCkgLyAxMDB9KWApO1xuICBpZiAoTWF0aC5hYnMoc2NhbGVZIC0gMSkgPiAwLjAyKSBwYXJ0cy5wdXNoKGBzY2FsZVkoJHtNYXRoLnJvdW5kKHNjYWxlWSAqIDEwMCkgLyAxMDB9KWApO1xuXG4gIHJldHVybiB7IHRyYW5zZm9ybTogcGFydHMubGVuZ3RoID4gMCA/IHBhcnRzLmpvaW4oJyAnKSA6IG51bGwgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGZsZXgtZ3JvdyAvIGZsZXgtYmFzaXMgLyBhbGlnbi1zZWxmIGZvciBhdXRvLWxheW91dCBjaGlsZHJlbi5cbiAqIEZpZ21hJ3MgbGF5b3V0R3JvdyBpcyAwIG9yIDE7IGxheW91dEFsaWduIGlzIElOSEVSSVQgLyBTVFJFVENIIC8gTUlOIC8gQ0VOVEVSIC8gTUFYLlxuICovXG5mdW5jdGlvbiBleHRyYWN0RmxleENoaWxkUHJvcHMobm9kZTogYW55KTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiB7XG4gIGNvbnN0IG91dDogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHt9O1xuICBpZiAodHlwZW9mIG5vZGUubGF5b3V0R3JvdyA9PT0gJ251bWJlcicpIHtcbiAgICBvdXQuZmxleEdyb3cgPSBub2RlLmxheW91dEdyb3c7XG4gIH1cbiAgaWYgKG5vZGUubGF5b3V0QWxpZ24pIHtcbiAgICBzd2l0Y2ggKG5vZGUubGF5b3V0QWxpZ24pIHtcbiAgICAgIGNhc2UgJ1NUUkVUQ0gnOiBvdXQuYWxpZ25TZWxmID0gJ3N0cmV0Y2gnOyBicmVhaztcbiAgICAgIGNhc2UgJ01JTic6IG91dC5hbGlnblNlbGYgPSAnZmxleC1zdGFydCc7IGJyZWFrO1xuICAgICAgY2FzZSAnQ0VOVEVSJzogb3V0LmFsaWduU2VsZiA9ICdjZW50ZXInOyBicmVhaztcbiAgICAgIGNhc2UgJ01BWCc6IG91dC5hbGlnblNlbGYgPSAnZmxleC1lbmQnOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENvbXB1dGUgcGVyLXNpZGUgbWFyZ2luIGZvciBhIG5vZGUgYmFzZWQgb24gc2libGluZyBwb3NpdGlvbnMgaW4gaXRzXG4gKiBwYXJlbnQgY29udGFpbmVyLiBSZXR1cm5zIG9ubHkgdGhlIHNpZGVzIHRoYXQgaGF2ZSBhIGNsZWFyIG5vbi16ZXJvXG4gKiBtYXJnaW4gKHByZXZpb3VzIHNpYmxpbmcgb24gdG9wLCBuZXh0IHNpYmxpbmcgYmVsb3csIHBhcmVudCBib3VuZHMgZm9yXG4gKiBsZWZ0L3JpZ2h0IHdoZW4gcGFyZW50IHdpZHRoIGlzIGtub3duKS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFBlclNpZGVNYXJnaW5zKG5vZGU6IFNjZW5lTm9kZSk6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4ge1xuICBjb25zdCBvdXQ6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7fTtcbiAgaWYgKCFub2RlLmFic29sdXRlQm91bmRpbmdCb3ggfHwgIW5vZGUucGFyZW50IHx8ICEoJ2NoaWxkcmVuJyBpbiBub2RlLnBhcmVudCkpIHJldHVybiBvdXQ7XG5cbiAgY29uc3Qgc2libGluZ3MgPSAobm9kZS5wYXJlbnQgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbjtcbiAgY29uc3QgaWR4ID0gc2libGluZ3MuaW5kZXhPZihub2RlKTtcbiAgY29uc3QgYmIgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG5cbiAgLy8gQm90dG9tOiBnYXAgdG8gbmV4dCBzaWJsaW5nXG4gIGlmIChpZHggPj0gMCAmJiBpZHggPCBzaWJsaW5ncy5sZW5ndGggLSAxKSB7XG4gICAgY29uc3QgbmV4dCA9IHNpYmxpbmdzW2lkeCArIDFdO1xuICAgIGlmIChuZXh0LmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICAgIGNvbnN0IGdhcCA9IG5leHQuYWJzb2x1dGVCb3VuZGluZ0JveC55IC0gKGJiLnkgKyBiYi5oZWlnaHQpO1xuICAgICAgaWYgKGdhcCA+IDApIG91dC5tYXJnaW5Cb3R0b20gPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQoZ2FwKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gVG9wOiBnYXAgdG8gcHJldmlvdXMgc2libGluZyAoZm9yIGFic29sdXRlLXBvc2l0aW9uIGxheW91dHMpXG4gIGlmIChpZHggPiAwKSB7XG4gICAgY29uc3QgcHJldiA9IHNpYmxpbmdzW2lkeCAtIDFdO1xuICAgIGlmIChwcmV2LmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICAgIGNvbnN0IGdhcCA9IGJiLnkgLSAocHJldi5hYnNvbHV0ZUJvdW5kaW5nQm94LnkgKyBwcmV2LmFic29sdXRlQm91bmRpbmdCb3guaGVpZ2h0KTtcbiAgICAgIGlmIChnYXAgPiAwKSBvdXQubWFyZ2luVG9wID0gdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKGdhcCkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIExlZnQvcmlnaHQ6IGluc2V0IGZyb20gcGFyZW50IGVkZ2VzXG4gIGNvbnN0IHBhcmVudEJCID0gKG5vZGUucGFyZW50IGFzIEZyYW1lTm9kZSkuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgaWYgKHBhcmVudEJCKSB7XG4gICAgY29uc3QgbGVmdEdhcCA9IGJiLnggLSBwYXJlbnRCQi54O1xuICAgIGNvbnN0IHJpZ2h0R2FwID0gKHBhcmVudEJCLnggKyBwYXJlbnRCQi53aWR0aCkgLSAoYmIueCArIGJiLndpZHRoKTtcbiAgICAvLyBPbmx5IGVtaXQgd2hlbiBlbGVtZW50IGlzIG5vdCBjZW50ZXJlZCAoc2lnbmlmaWNhbnQgYXN5bW1ldHJpYyBtYXJnaW4pXG4gICAgaWYgKE1hdGguYWJzKGxlZnRHYXAgLSByaWdodEdhcCkgPiA4ICYmIGxlZnRHYXAgPiAwKSB7XG4gICAgICBvdXQubWFyZ2luTGVmdCA9IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChsZWZ0R2FwKSk7XG4gICAgfVxuICAgIGlmIChNYXRoLmFicyhsZWZ0R2FwIC0gcmlnaHRHYXApID4gOCAmJiByaWdodEdhcCA+IDApIHtcbiAgICAgIG91dC5tYXJnaW5SaWdodCA9IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChyaWdodEdhcCkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogRXh0cmFjdCBwcm90b3R5cGUgbmF2aWdhdGlvbiBVUkwgZm9yIGEgbm9kZS4gRmlnbWEgc3VwcG9ydHNcbiAqIE9QRU5fVVJMIGFjdGlvbnMgaW4gcmVhY3Rpb25zIFx1MjAxNCBtYXAgdG8gbGlua1VybC5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdExpbmtVcmwobm9kZTogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHJlYWN0aW9ucyA9IG5vZGUucmVhY3Rpb25zO1xuICBpZiAoIXJlYWN0aW9ucyB8fCAhQXJyYXkuaXNBcnJheShyZWFjdGlvbnMpKSByZXR1cm4gbnVsbDtcbiAgZm9yIChjb25zdCByIG9mIHJlYWN0aW9ucykge1xuICAgIGNvbnN0IGFjdGlvbnMgPSByLmFjdGlvbnMgfHwgKHIuYWN0aW9uID8gW3IuYWN0aW9uXSA6IFtdKTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgYWN0aW9ucykge1xuICAgICAgaWYgKGEgJiYgYS50eXBlID09PSAnVVJMJyAmJiBhLnVybCkgcmV0dXJuIGEudXJsO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBGaW5kIGFuZCBjbGFzc2lmeSBhbGwgbWVhbmluZ2Z1bCBlbGVtZW50cyB3aXRoaW4gYSBzZWN0aW9uLlxuICogV2Fsa3MgdGhlIG5vZGUgdHJlZSBhbmQgZXh0cmFjdHMgdHlwb2dyYXBoeSBmb3IgVEVYVCBub2RlcyxcbiAqIGRpbWVuc2lvbnMgZm9yIGltYWdlIGNvbnRhaW5lcnMsIGV0Yy5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEVsZW1lbnRzKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUpOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+PiB7XG4gIGNvbnN0IGVsZW1lbnRzOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+PiA9IHt9O1xuICBsZXQgdGV4dEluZGV4ID0gMDtcbiAgbGV0IGltYWdlSW5kZXggPSAwO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgLy8gVEVYVCBub2RlcyBcdTIxOTIgdHlwb2dyYXBoeSArIHRleHQgY29udGVudFxuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgdHlwbyA9IGV4dHJhY3RUeXBvZ3JhcGh5KG5vZGUpO1xuICAgICAgY29uc3QgZm9udFNpemUgPSBub2RlLmZvbnRTaXplICE9PSBmaWdtYS5taXhlZCA/IChub2RlLmZvbnRTaXplIGFzIG51bWJlcikgOiAxNjtcblxuICAgICAgLy8gQ2xhc3NpZnkgYnkgcm9sZTogaGVhZGluZ3MgYXJlIGxhcmdlciwgYm9keSB0ZXh0IGlzIHNtYWxsZXJcbiAgICAgIGxldCByb2xlOiBzdHJpbmc7XG4gICAgICBpZiAodGV4dEluZGV4ID09PSAwICYmIGZvbnRTaXplID49IDI4KSB7XG4gICAgICAgIHJvbGUgPSAnaGVhZGluZyc7XG4gICAgICB9IGVsc2UgaWYgKHRleHRJbmRleCA9PT0gMSAmJiBmb250U2l6ZSA+PSAxNikge1xuICAgICAgICByb2xlID0gJ3N1YmhlYWRpbmcnO1xuICAgICAgfSBlbHNlIGlmIChub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYnV0dG9uJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2N0YScpKSB7XG4gICAgICAgIHJvbGUgPSAnYnV0dG9uX3RleHQnO1xuICAgICAgfSBlbHNlIGlmIChub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY2FwdGlvbicpIHx8IGZvbnRTaXplIDw9IDE0KSB7XG4gICAgICAgIHJvbGUgPSBgY2FwdGlvbiR7dGV4dEluZGV4ID4gMiA/ICdfJyArIHRleHRJbmRleCA6ICcnfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByb2xlID0gYHRleHRfJHt0ZXh0SW5kZXh9YDtcbiAgICAgIH1cblxuICAgICAgLy8gVXNlIHRoZSBsYXllciBuYW1lIGlmIGl0J3Mgbm90IGEgZGVmYXVsdCBuYW1lXG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBpZiAoY2xlYW5OYW1lICYmICEvXih0ZXh0fGZyYW1lfGdyb3VwfHJlY3RhbmdsZSlcXGQqJC8udGVzdChjbGVhbk5hbWUpKSB7XG4gICAgICAgIHJvbGUgPSBjbGVhbk5hbWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEV4dHJhY3QgYWN0dWFsIHRleHQgY29udGVudCBmb3IgY29udGVudCBwb3B1bGF0aW9uIGFuZCBjb250ZXh0XG4gICAgICB0eXBvLnRleHRDb250ZW50ID0gbm9kZS5jaGFyYWN0ZXJzIHx8IG51bGw7XG5cbiAgICAgIC8vIFBlci1zaWRlIG1hcmdpbnMgZnJvbSBzaWJsaW5nIHNwYWNpbmcgKHRvcC9yaWdodC9ib3R0b20vbGVmdClcbiAgICAgIE9iamVjdC5hc3NpZ24odHlwbywgZXh0cmFjdFBlclNpZGVNYXJnaW5zKG5vZGUpKTtcblxuICAgICAgLy8gRmxleC1jaGlsZCBwcm9wZXJ0aWVzIChsYXlvdXRHcm93IC8gbGF5b3V0QWxpZ24pXG4gICAgICBPYmplY3QuYXNzaWduKHR5cG8sIGV4dHJhY3RGbGV4Q2hpbGRQcm9wcyhub2RlKSk7XG5cbiAgICAgIC8vIFRyYW5zZm9ybSAocm90YXRlL3NjYWxlKSBpZiBub24taWRlbnRpdHlcbiAgICAgIGNvbnN0IHR4ID0gZXh0cmFjdFRyYW5zZm9ybShub2RlKTtcbiAgICAgIGlmICh0eC50cmFuc2Zvcm0pIHR5cG8udHJhbnNmb3JtID0gdHgudHJhbnNmb3JtO1xuXG4gICAgICAvLyBMaW5rIFVSTCBmcm9tIHByb3RvdHlwZSBuYXZpZ2F0aW9uXG4gICAgICBjb25zdCBocmVmID0gZXh0cmFjdExpbmtVcmwobm9kZSk7XG4gICAgICBpZiAoaHJlZikgdHlwby5saW5rVXJsID0gaHJlZjtcblxuICAgICAgLy8gTWF4IHdpZHRoIGlmIGNvbnN0cmFpbmVkXG4gICAgICBpZiAobm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmIG5vZGUucGFyZW50Py50eXBlID09PSAnRlJBTUUnKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudFdpZHRoID0gKG5vZGUucGFyZW50IGFzIEZyYW1lTm9kZSkuYWJzb2x1dGVCb3VuZGluZ0JveD8ud2lkdGg7XG4gICAgICAgIGlmIChwYXJlbnRXaWR0aCAmJiBub2RlLmFic29sdXRlQm91bmRpbmdCb3gud2lkdGggPCBwYXJlbnRXaWR0aCAqIDAuOSkge1xuICAgICAgICAgIHR5cG8ubWF4V2lkdGggPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQobm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94LndpZHRoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZWxlbWVudHNbcm9sZV0gPSB0eXBvO1xuICAgICAgdGV4dEluZGV4Kys7XG4gICAgfVxuXG4gICAgLy8gSU1BR0UgZmlsbHMgXHUyMTkyIGltYWdlIGVsZW1lbnQgKHdpdGggc21hcnQgYmFja2dyb3VuZCBkZXRlY3Rpb24pXG4gICAgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkgJiYgbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG5cbiAgICAgIC8vIFNtYXJ0IGJhY2tncm91bmQgaW1hZ2UgZGV0ZWN0aW9uOlxuICAgICAgLy8gMS4gTGF5ZXIgbmFtZSBjb250YWlucyAnYmFja2dyb3VuZCcgb3IgJ2JnJyBPUlxuICAgICAgLy8gMi4gSW1hZ2Ugc3BhbnMgPj0gOTAlIG9mIHRoZSBzZWN0aW9uJ3Mgd2lkdGggQU5EIGhlaWdodCAoZnVsbC1ibGVlZCBpbWFnZSlcbiAgICAgIGNvbnN0IG5hbWVIaW50c0JnID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2JhY2tncm91bmQnKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYmcnKTtcbiAgICAgIGNvbnN0IHNlY3Rpb25Cb3VuZHMgPSBzZWN0aW9uTm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgY29uc3Qgc3BhbnNTZWN0aW9uID0gc2VjdGlvbkJvdW5kcyAmJlxuICAgICAgICBib3VuZHMud2lkdGggPj0gc2VjdGlvbkJvdW5kcy53aWR0aCAqIDAuOSAmJlxuICAgICAgICBib3VuZHMuaGVpZ2h0ID49IHNlY3Rpb25Cb3VuZHMuaGVpZ2h0ICogMC45O1xuXG4gICAgICBjb25zdCBpc0JhY2tncm91bmRJbWFnZSA9IG5hbWVIaW50c0JnIHx8IHNwYW5zU2VjdGlvbjtcblxuICAgICAgY29uc3Qgcm9sZSA9IGlzQmFja2dyb3VuZEltYWdlXG4gICAgICAgID8gJ2JhY2tncm91bmRfaW1hZ2UnXG4gICAgICAgIDogYGltYWdlJHtpbWFnZUluZGV4ID4gMCA/ICdfJyArIGltYWdlSW5kZXggOiAnJ31gO1xuXG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBjb25zdCBmaW5hbFJvbGUgPSBjbGVhbk5hbWUgJiYgIS9eKGltYWdlfHJlY3RhbmdsZXxmcmFtZSlcXGQqJC8udGVzdChjbGVhbk5hbWUpID8gY2xlYW5OYW1lIDogcm9sZTtcblxuICAgICAgLy8gRGV0ZWN0IG1hc2svY2xpcCBvbiBpbWFnZSBvciBpdHMgcGFyZW50IGNvbnRhaW5lclxuICAgICAgY29uc3QgcGFyZW50RnJhbWUgPSBub2RlLnBhcmVudDtcbiAgICAgIGNvbnN0IHBhcmVudENsaXBzID0gcGFyZW50RnJhbWUgJiYgJ2NsaXBzQ29udGVudCcgaW4gcGFyZW50RnJhbWUgJiYgKHBhcmVudEZyYW1lIGFzIGFueSkuY2xpcHNDb250ZW50ID09PSB0cnVlO1xuICAgICAgY29uc3QgaXNNYXNrZWQgPSAoJ2lzTWFzaycgaW4gbm9kZSAmJiAobm9kZSBhcyBhbnkpLmlzTWFzayA9PT0gdHJ1ZSkgfHwgcGFyZW50Q2xpcHM7XG4gICAgICAvLyBEZXRlY3QgY2lyY3VsYXIvcm91bmRlZCBjbGlwczogaWYgcGFyZW50IGhhcyBlcXVhbCBjb3JuZXJSYWRpdXMgYW5kIGlzIHJvdWdobHkgc3F1YXJlXG4gICAgICBsZXQgY2xpcEJvcmRlclJhZGl1czogc3RyaW5nIHwgbnVsbCA9ICdjb3JuZXJSYWRpdXMnIGluIG5vZGUgJiYgdHlwZW9mIChub2RlIGFzIGFueSkuY29ybmVyUmFkaXVzID09PSAnbnVtYmVyJ1xuICAgICAgICA/IHRvQ3NzVmFsdWUoKG5vZGUgYXMgYW55KS5jb3JuZXJSYWRpdXMpXG4gICAgICAgIDogbnVsbDtcbiAgICAgIGlmICghY2xpcEJvcmRlclJhZGl1cyAmJiBwYXJlbnRGcmFtZSAmJiAnY29ybmVyUmFkaXVzJyBpbiBwYXJlbnRGcmFtZSAmJiB0eXBlb2YgKHBhcmVudEZyYW1lIGFzIGFueSkuY29ybmVyUmFkaXVzID09PSAnbnVtYmVyJykge1xuICAgICAgICBjb25zdCBwYXJlbnRDb3JuZXIgPSAocGFyZW50RnJhbWUgYXMgYW55KS5jb3JuZXJSYWRpdXMgYXMgbnVtYmVyO1xuICAgICAgICBpZiAocGFyZW50Q29ybmVyID4gMCkge1xuICAgICAgICAgIGNvbnN0IHBhcmVudEJvdW5kcyA9IChwYXJlbnRGcmFtZSBhcyBhbnkpLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICAgICAgLy8gSWYgcGFyZW50IGlzIHJvdWdobHkgc3F1YXJlIGFuZCBjb3JuZXJSYWRpdXMgPj0gaGFsZiB0aGUgd2lkdGggXHUyMTkyIGNpcmNsZVxuICAgICAgICAgIGlmIChwYXJlbnRCb3VuZHMgJiYgTWF0aC5hYnMocGFyZW50Qm91bmRzLndpZHRoIC0gcGFyZW50Qm91bmRzLmhlaWdodCkgPCA1ICYmIHBhcmVudENvcm5lciA+PSBwYXJlbnRCb3VuZHMud2lkdGggLyAyIC0gMikge1xuICAgICAgICAgICAgY2xpcEJvcmRlclJhZGl1cyA9ICc1MCUnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGlwQm9yZGVyUmFkaXVzID0gdG9Dc3NWYWx1ZShwYXJlbnRDb3JuZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBpbWdFZmZlY3RzID0gZXh0cmFjdEVmZmVjdHMobm9kZSBhcyBhbnkpO1xuICAgICAgY29uc3QgaW1nT2JqZWN0UG9zaXRpb24gPSBleHRyYWN0T2JqZWN0UG9zaXRpb24obm9kZSk7XG4gICAgICBjb25zdCBpbWdDb3JuZXJzID0gZXh0cmFjdFBlckNvcm5lclJhZGl1cyhub2RlIGFzIGFueSk7XG4gICAgICBjb25zdCBpbWdFbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge1xuICAgICAgICB3aWR0aDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnMTAwJScgOiB0b0Nzc1ZhbHVlKE1hdGgucm91bmQoYm91bmRzLndpZHRoKSksXG4gICAgICAgIGhlaWdodDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnMTAwJScgOiAnYXV0bycsXG4gICAgICAgIGFzcGVjdFJhdGlvOiBpc0JhY2tncm91bmRJbWFnZSA/IG51bGwgOiBjb21wdXRlQXNwZWN0UmF0aW8oYm91bmRzLndpZHRoLCBib3VuZHMuaGVpZ2h0KSxcbiAgICAgICAgb2JqZWN0Rml0OiAnY292ZXInLFxuICAgICAgICBvYmplY3RQb3NpdGlvbjogaW1nT2JqZWN0UG9zaXRpb24sXG4gICAgICAgIG92ZXJmbG93OiAocGFyZW50Q2xpcHMgfHwgY2xpcEJvcmRlclJhZGl1cykgPyAnaGlkZGVuJyA6IG51bGwsXG4gICAgICAgIGhhc01hc2s6IGlzTWFza2VkIHx8IG51bGwsXG4gICAgICAgIGJveFNoYWRvdzogaW1nRWZmZWN0cy5ib3hTaGFkb3csXG4gICAgICAgIGZpbHRlcjogaW1nRWZmZWN0cy5maWx0ZXIsXG4gICAgICAgIC8vIE1hcmsgYmFja2dyb3VuZCBpbWFnZXMgd2l0aCBwb3NpdGlvbiBkYXRhIHNvIGFnZW50cyBrbm93IHRvIHVzZSBDU1MgYmFja2dyb3VuZC1pbWFnZVxuICAgICAgICBwb3NpdGlvbjogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnYWJzb2x1dGUnIDogbnVsbCxcbiAgICAgICAgdG9wOiBpc0JhY2tncm91bmRJbWFnZSA/ICcwcHgnIDogbnVsbCxcbiAgICAgICAgbGVmdDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnMHB4JyA6IG51bGwsXG4gICAgICAgIHpJbmRleDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAwIDogbnVsbCxcbiAgICAgIH07XG4gICAgICAvLyBBcHBseSByYWRpdXMgXHUyMDE0IHBlci1jb3JuZXIgaWYgbm9kZSBoYXMgZGlmZmVyaW5nIGNvcm5lcnMsIHVuaWZvcm0gb3RoZXJ3aXNlXG4gICAgICBpZiAoaW1nQ29ybmVycykge1xuICAgICAgICBpZiAoaW1nQ29ybmVycy51bmlmb3JtICE9PSBudWxsKSB7XG4gICAgICAgICAgaW1nRWxlbS5ib3JkZXJSYWRpdXMgPSB0b0Nzc1ZhbHVlKGltZ0Nvcm5lcnMudW5pZm9ybSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW1nRWxlbS5ib3JkZXJUb3BMZWZ0UmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLnRvcExlZnQpO1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyVG9wUmlnaHRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGltZ0Nvcm5lcnMudG9wUmlnaHQpO1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyQm90dG9tTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoaW1nQ29ybmVycy5ib3R0b21MZWZ0KTtcbiAgICAgICAgICBpbWdFbGVtLmJvcmRlckJvdHRvbVJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLmJvdHRvbVJpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjbGlwQm9yZGVyUmFkaXVzKSB7XG4gICAgICAgIGltZ0VsZW0uYm9yZGVyUmFkaXVzID0gY2xpcEJvcmRlclJhZGl1cztcbiAgICAgIH1cbiAgICAgIC8vIEZsZXgtY2hpbGQgcHJvcHMgaWYgaW1hZ2UgaXMgaW5zaWRlIGFuIGF1dG8tbGF5b3V0IHJvd1xuICAgICAgT2JqZWN0LmFzc2lnbihpbWdFbGVtLCBleHRyYWN0RmxleENoaWxkUHJvcHMobm9kZSkpO1xuICAgICAgZWxlbWVudHNbZmluYWxSb2xlXSA9IGltZ0VsZW07XG4gICAgICBpbWFnZUluZGV4Kys7XG4gICAgfVxuXG4gICAgLy8gQnV0dG9uLWxpa2UgZnJhbWVzIChzbWFsbCBmcmFtZXMgd2l0aCB0ZXh0ICsgZmlsbClcbiAgICBpZiAoKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJykgJiZcbiAgICAgICAgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2J1dHRvbicpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdidG4nKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY3RhJykpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBjb25zdCBiZyA9IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3IoZnJhbWUpO1xuICAgICAgY29uc3QgYm91bmRzID0gZnJhbWUuYWJzb2x1dGVCb3VuZGluZ0JveDtcblxuICAgICAgaWYgKGJnICYmIGJvdW5kcykge1xuICAgICAgICBjb25zdCBidXR0b25TdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7XG4gICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBiZyxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoZnJhbWUubGF5b3V0TW9kZSAmJiBmcmFtZS5sYXlvdXRNb2RlICE9PSAnTk9ORScpIHtcbiAgICAgICAgICBidXR0b25TdHlsZXMucGFkZGluZ1RvcCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ1RvcCk7XG4gICAgICAgICAgYnV0dG9uU3R5bGVzLnBhZGRpbmdCb3R0b20gPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdCb3R0b20pO1xuICAgICAgICAgIGJ1dHRvblN0eWxlcy5wYWRkaW5nTGVmdCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ0xlZnQpO1xuICAgICAgICAgIGJ1dHRvblN0eWxlcy5wYWRkaW5nUmlnaHQgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdSaWdodCk7XG4gICAgICAgIH1cblxuICAgICAgICBhcHBseVJhZGl1cyhidXR0b25TdHlsZXMsIGZyYW1lKTtcbiAgICAgICAgYXBwbHlTdHJva2VzKGJ1dHRvblN0eWxlcywgZnJhbWUpO1xuICAgICAgICBjb25zdCBidG5FZmZlY3RzID0gZXh0cmFjdEVmZmVjdHMoZnJhbWUgYXMgYW55KTtcbiAgICAgICAgaWYgKGJ0bkVmZmVjdHMuYm94U2hhZG93KSBidXR0b25TdHlsZXMuYm94U2hhZG93ID0gYnRuRWZmZWN0cy5ib3hTaGFkb3c7XG4gICAgICAgIGlmIChidG5FZmZlY3RzLmZpbHRlcikgYnV0dG9uU3R5bGVzLmZpbHRlciA9IGJ0bkVmZmVjdHMuZmlsdGVyO1xuXG4gICAgICAgIGNvbnN0IHR4ID0gZXh0cmFjdFRyYW5zZm9ybShmcmFtZSBhcyBhbnkpO1xuICAgICAgICBpZiAodHgudHJhbnNmb3JtKSBidXR0b25TdHlsZXMudHJhbnNmb3JtID0gdHgudHJhbnNmb3JtO1xuXG4gICAgICAgIC8vIExpbmsgVVJMIGZyb20gcHJvdG90eXBlIE9QRU5fVVJMIGFjdGlvblxuICAgICAgICBjb25zdCBocmVmID0gZXh0cmFjdExpbmtVcmwoZnJhbWUpO1xuICAgICAgICBpZiAoaHJlZikgYnV0dG9uU3R5bGVzLmxpbmtVcmwgPSBocmVmO1xuXG4gICAgICAgIC8vIEZpbmQgdGhlIHRleHQgbm9kZSBpbnNpZGUgdGhlIGJ1dHRvbiBmb3IgdHlwb2dyYXBoeVxuICAgICAgICBjb25zdCB0ZXh0Q2hpbGQgPSBmaW5kRmlyc3RUZXh0Tm9kZShmcmFtZSk7XG4gICAgICAgIGlmICh0ZXh0Q2hpbGQpIHtcbiAgICAgICAgICBjb25zdCB0eXBvID0gZXh0cmFjdFR5cG9ncmFwaHkodGV4dENoaWxkKTtcbiAgICAgICAgICBPYmplY3QuYXNzaWduKGJ1dHRvblN0eWxlcywgdHlwbyk7XG4gICAgICAgICAgYnV0dG9uU3R5bGVzLnRleHRDb250ZW50ID0gdGV4dENoaWxkLmNoYXJhY3RlcnMgfHwgbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIE9iamVjdC5hc3NpZ24oYnV0dG9uU3R5bGVzLCBleHRyYWN0RmxleENoaWxkUHJvcHMoZnJhbWUgYXMgYW55KSk7XG5cbiAgICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgICBlbGVtZW50c1tjbGVhbk5hbWUgfHwgJ2J1dHRvbiddID0gYnV0dG9uU3R5bGVzO1xuICAgICAgfVxuICAgICAgcmV0dXJuOyAvLyBEb24ndCByZWN1cnNlIGludG8gYnV0dG9uIGludGVybmFsc1xuICAgIH1cblxuICAgIC8vIElucHV0LWxpa2UgZnJhbWVzIChkZXRlY3QgaW5wdXRzIGJ5IGNvbW1vbiBsYXllciBuYW1lcylcbiAgICBpZiAoKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJykgJiZcbiAgICAgICAgL1xcYihpbnB1dHxmaWVsZHx0ZXh0Ym94fHRleHRhcmVhfHNlbGVjdHx0ZXh0ZmllbGQpXFxiL2kudGVzdChub2RlLm5hbWUpKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgY29uc3QgaW5wdXRTdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogZXh0cmFjdEJhY2tncm91bmRDb2xvcihmcmFtZSksXG4gICAgICB9O1xuICAgICAgaWYgKGZyYW1lLmxheW91dE1vZGUgJiYgZnJhbWUubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgICAgIGlucHV0U3R5bGVzLnBhZGRpbmdUb3AgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdUb3ApO1xuICAgICAgICBpbnB1dFN0eWxlcy5wYWRkaW5nQm90dG9tID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nQm90dG9tKTtcbiAgICAgICAgaW5wdXRTdHlsZXMucGFkZGluZ0xlZnQgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdMZWZ0KTtcbiAgICAgICAgaW5wdXRTdHlsZXMucGFkZGluZ1JpZ2h0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nUmlnaHQpO1xuICAgICAgfVxuICAgICAgYXBwbHlSYWRpdXMoaW5wdXRTdHlsZXMsIGZyYW1lKTtcbiAgICAgIGFwcGx5U3Ryb2tlcyhpbnB1dFN0eWxlcywgZnJhbWUpO1xuICAgICAgY29uc3QgcGxhY2Vob2xkZXJUZXh0ID0gZmluZEZpcnN0VGV4dE5vZGUoZnJhbWUpO1xuICAgICAgaWYgKHBsYWNlaG9sZGVyVGV4dCkge1xuICAgICAgICBpbnB1dFN0eWxlcy5wbGFjZWhvbGRlciA9IHBsYWNlaG9sZGVyVGV4dC5jaGFyYWN0ZXJzIHx8IG51bGw7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyVHlwbyA9IGV4dHJhY3RUeXBvZ3JhcGh5KHBsYWNlaG9sZGVyVGV4dCk7XG4gICAgICAgIGlucHV0U3R5bGVzLnBsYWNlaG9sZGVyU3R5bGVzID0ge1xuICAgICAgICAgIGNvbG9yOiBwbGFjZWhvbGRlclR5cG8uY29sb3IgfHwgbnVsbCxcbiAgICAgICAgICBmb250U2l6ZTogcGxhY2Vob2xkZXJUeXBvLmZvbnRTaXplIHx8IG51bGwsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjb25zdCBpbnB1dE5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJykgfHwgJ2lucHV0JztcbiAgICAgIGVsZW1lbnRzW2lucHV0TmFtZV0gPSBpbnB1dFN0eWxlcztcbiAgICAgIHJldHVybjsgLy8gRG9uJ3QgcmVjdXJzZSBpbnRvIGlucHV0IGludGVybmFsc1xuICAgIH1cblxuICAgIC8vIFJlY3Vyc2UgaW50byBjaGlsZHJlbiAoZGVwdGggbGltaXQgNiB0byBjYXB0dXJlIGRlZXBseSBuZXN0ZWQgZWxlbWVudHMpXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSAmJiBkZXB0aCA8IDYpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB3YWxrKGNoaWxkLCBkZXB0aCArIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2FsayhzZWN0aW9uTm9kZSwgMCk7XG4gIHJldHVybiBlbGVtZW50cztcbn1cblxuLyoqXG4gKiBGaW5kIHRoZSBmaXJzdCBURVhUIG5vZGUgaW4gYSBzdWJ0cmVlLlxuICovXG5mdW5jdGlvbiBmaW5kRmlyc3RUZXh0Tm9kZShub2RlOiBTY2VuZU5vZGUpOiBUZXh0Tm9kZSB8IG51bGwge1xuICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIHJldHVybiBub2RlO1xuICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICBjb25zdCBmb3VuZCA9IGZpbmRGaXJzdFRleHROb2RlKGNoaWxkKTtcbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGZvdW5kO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGxheWVyIGluZm9ybWF0aW9uIGZvciBhbGwgbWVhbmluZ2Z1bCBjaGlsZHJlbiBvZiBhIHNlY3Rpb24uXG4gKiBSZXR1cm5zIGxheWVycyBzb3J0ZWQgYnkgRmlnbWEncyBsYXllciBvcmRlciAoYmFjayB0byBmcm9udCkuXG4gKiBCb3VuZHMgYXJlIHJlbGF0aXZlIHRvIHRoZSBzZWN0aW9uJ3Mgb3JpZ2luLCBub3QgdGhlIGNhbnZhcy5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdExheWVycyhzZWN0aW9uTm9kZTogU2NlbmVOb2RlLCBlbGVtZW50czogUmVjb3JkPHN0cmluZywgUGFydGlhbDxFbGVtZW50U3R5bGVzPj4pOiBMYXllckluZm9bXSB7XG4gIGNvbnN0IGxheWVyczogTGF5ZXJJbmZvW10gPSBbXTtcbiAgY29uc3Qgc2VjdGlvbkJvdW5kcyA9IHNlY3Rpb25Ob2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGlmICghc2VjdGlvbkJvdW5kcykgcmV0dXJuIGxheWVycztcblxuICBsZXQgbGF5ZXJJbmRleCA9IDA7XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIpIHtcbiAgICBpZiAoIW5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCB8fCBkZXB0aCA+IDYpIHJldHVybjtcblxuICAgIGNvbnN0IGJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICBjb25zdCByZWxCb3VuZHMgPSB7XG4gICAgICB4OiBNYXRoLnJvdW5kKGJvdW5kcy54IC0gc2VjdGlvbkJvdW5kcyEueCksXG4gICAgICB5OiBNYXRoLnJvdW5kKGJvdW5kcy55IC0gc2VjdGlvbkJvdW5kcyEueSksXG4gICAgICB3aWR0aDogTWF0aC5yb3VuZChib3VuZHMud2lkdGgpLFxuICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKGJvdW5kcy5oZWlnaHQpLFxuICAgIH07XG5cbiAgICBsZXQgcm9sZTogTGF5ZXJJbmZvWydyb2xlJ10gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgbmFtZSA9ICcnO1xuXG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICByb2xlID0gJ3RleHQnO1xuICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgbmFtZSA9IGNsZWFuTmFtZSAmJiAhL150ZXh0XFxkKiQvLnRlc3QoY2xlYW5OYW1lKSA/IGNsZWFuTmFtZSA6IGB0ZXh0XyR7bGF5ZXJJbmRleH1gO1xuICAgIH0gZWxzZSBpZiAoaGFzSW1hZ2VGaWxsKG5vZGUgYXMgYW55KSkge1xuICAgICAgY29uc3QgbmFtZUhpbnRzQmcgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYmFja2dyb3VuZCcpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdiZycpO1xuICAgICAgY29uc3Qgc3BhbnNTZWN0aW9uID0gYm91bmRzLndpZHRoID49IHNlY3Rpb25Cb3VuZHMhLndpZHRoICogMC45ICYmIGJvdW5kcy5oZWlnaHQgPj0gc2VjdGlvbkJvdW5kcyEuaGVpZ2h0ICogMC45O1xuICAgICAgcm9sZSA9IChuYW1lSGludHNCZyB8fCBzcGFuc1NlY3Rpb24pID8gJ2JhY2tncm91bmRfaW1hZ2UnIDogJ2ltYWdlJztcbiAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIG5hbWUgPSBjbGVhbk5hbWUgJiYgIS9eKGltYWdlfHJlY3RhbmdsZXxmcmFtZSlcXGQqJC8udGVzdChjbGVhbk5hbWUpID8gY2xlYW5OYW1lIDogKHJvbGUgPT09ICdiYWNrZ3JvdW5kX2ltYWdlJyA/ICdiYWNrZ3JvdW5kX2ltYWdlJyA6IGBpbWFnZV8ke2xheWVySW5kZXh9YCk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIChub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYnV0dG9uJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2J0bicpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjdGEnKSkgJiZcbiAgICAgIChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcpXG4gICAgKSB7XG4gICAgICByb2xlID0gJ2J1dHRvbic7XG4gICAgICBuYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpIHx8ICdidXR0b24nO1xuICAgIH1cblxuICAgIGlmIChyb2xlKSB7XG4gICAgICBsYXllcnMucHVzaCh7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIHJvbGUsXG4gICAgICAgIHR5cGU6IG5vZGUudHlwZSxcbiAgICAgICAgYm91bmRzOiByZWxCb3VuZHMsXG4gICAgICAgIHpJbmRleDogbGF5ZXJJbmRleCxcbiAgICAgICAgb3ZlcmxhcHM6IFtdLCAvLyBmaWxsZWQgaW4gZGV0ZWN0Q29tcG9zaXRpb25cbiAgICAgIH0pO1xuICAgICAgbGF5ZXJJbmRleCsrO1xuICAgIH1cblxuICAgIC8vIFJlY3Vyc2UgKHNraXAgYnV0dG9uIGludGVybmFscylcbiAgICBpZiAocm9sZSAhPT0gJ2J1dHRvbicgJiYgJ2NoaWxkcmVuJyBpbiBub2RlICYmIGRlcHRoIDwgNikge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIGlmIChjaGlsZC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICAgIHdhbGsoY2hpbGQsIGRlcHRoICsgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoJ2NoaWxkcmVuJyBpbiBzZWN0aW9uTm9kZSkge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKHNlY3Rpb25Ob2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgICB3YWxrKGNoaWxkLCAwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbGF5ZXJzO1xufVxuXG4vKipcbiAqIERldGVjdCBjb21wb3NpdGlvbiBwYXR0ZXJuczogdGV4dC1vdmVyLWltYWdlLCBiYWNrZ3JvdW5kIGltYWdlcywgb3ZlcmxheSBzdGFja2luZy5cbiAqIFR3byByZWN0YW5nbGVzIG92ZXJsYXAgaWYgdGhleSBzaGFyZSBhbnkgYXJlYS5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q29tcG9zaXRpb24obGF5ZXJzOiBMYXllckluZm9bXSk6IENvbXBvc2l0aW9uSW5mbyB7XG4gIGNvbnN0IGNvbXBvc2l0aW9uOiBDb21wb3NpdGlvbkluZm8gPSB7XG4gICAgaGFzVGV4dE92ZXJJbWFnZTogZmFsc2UsXG4gICAgaGFzQmFja2dyb3VuZEltYWdlOiBmYWxzZSxcbiAgICBvdmVybGF5RWxlbWVudHM6IFtdLFxuICAgIHN0YWNraW5nT3JkZXI6IGxheWVycy5tYXAobCA9PiBsLm5hbWUpLFxuICB9O1xuXG4gIGNvbnN0IGJnSW1hZ2VMYXllcnMgPSBsYXllcnMuZmlsdGVyKGwgPT4gbC5yb2xlID09PSAnYmFja2dyb3VuZF9pbWFnZScpO1xuICBjb25zdCBpbWFnZUxheWVycyA9IGxheWVycy5maWx0ZXIobCA9PiBsLnJvbGUgPT09ICdpbWFnZScgfHwgbC5yb2xlID09PSAnYmFja2dyb3VuZF9pbWFnZScpO1xuICBjb25zdCB0ZXh0TGF5ZXJzID0gbGF5ZXJzLmZpbHRlcihsID0+IGwucm9sZSA9PT0gJ3RleHQnKTtcbiAgY29uc3QgYnV0dG9uTGF5ZXJzID0gbGF5ZXJzLmZpbHRlcihsID0+IGwucm9sZSA9PT0gJ2J1dHRvbicpO1xuXG4gIGlmIChiZ0ltYWdlTGF5ZXJzLmxlbmd0aCA+IDApIHtcbiAgICBjb21wb3NpdGlvbi5oYXNCYWNrZ3JvdW5kSW1hZ2UgPSB0cnVlO1xuICB9XG5cbiAgLy8gQ2hlY2sgZm9yIGJvdW5kaW5nIGJveCBvdmVybGFwcyBiZXR3ZWVuIHRleHQvYnV0dG9ucyBhbmQgaW1hZ2VzXG4gIGZvciAoY29uc3QgdGV4dExheWVyIG9mIFsuLi50ZXh0TGF5ZXJzLCAuLi5idXR0b25MYXllcnNdKSB7XG4gICAgZm9yIChjb25zdCBpbWdMYXllciBvZiBpbWFnZUxheWVycykge1xuICAgICAgY29uc3QgdGIgPSB0ZXh0TGF5ZXIuYm91bmRzO1xuICAgICAgY29uc3QgaWIgPSBpbWdMYXllci5ib3VuZHM7XG5cbiAgICAgIC8vIENoZWNrIHJlY3RhbmdsZSBvdmVybGFwXG4gICAgICBjb25zdCBvdmVybGFwc0hvcml6b250YWxseSA9IHRiLnggPCBpYi54ICsgaWIud2lkdGggJiYgdGIueCArIHRiLndpZHRoID4gaWIueDtcbiAgICAgIGNvbnN0IG92ZXJsYXBzVmVydGljYWxseSA9IHRiLnkgPCBpYi55ICsgaWIuaGVpZ2h0ICYmIHRiLnkgKyB0Yi5oZWlnaHQgPiBpYi55O1xuXG4gICAgICBpZiAob3ZlcmxhcHNIb3Jpem9udGFsbHkgJiYgb3ZlcmxhcHNWZXJ0aWNhbGx5KSB7XG4gICAgICAgIC8vIFRleHQvYnV0dG9uIG92ZXJsYXBzIHdpdGggaW1hZ2VcbiAgICAgICAgdGV4dExheWVyLm92ZXJsYXBzLnB1c2goaW1nTGF5ZXIubmFtZSk7XG4gICAgICAgIGltZ0xheWVyLm92ZXJsYXBzLnB1c2godGV4dExheWVyLm5hbWUpO1xuXG4gICAgICAgIGlmICghY29tcG9zaXRpb24uaGFzVGV4dE92ZXJJbWFnZSkge1xuICAgICAgICAgIGNvbXBvc2l0aW9uLmhhc1RleHRPdmVySW1hZ2UgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRWxlbWVudHMgd2l0aCBoaWdoZXIgekluZGV4IHRoYXQgb3ZlcmxhcCBpbWFnZXMgYXJlIG92ZXJsYXlzXG4gICAgICAgIGlmICh0ZXh0TGF5ZXIuekluZGV4ID4gaW1nTGF5ZXIuekluZGV4KSB7XG4gICAgICAgICAgaWYgKCFjb21wb3NpdGlvbi5vdmVybGF5RWxlbWVudHMuaW5jbHVkZXModGV4dExheWVyLm5hbWUpKSB7XG4gICAgICAgICAgICBjb21wb3NpdGlvbi5vdmVybGF5RWxlbWVudHMucHVzaCh0ZXh0TGF5ZXIubmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgdGhlcmUncyBhIGJhY2tncm91bmQgaW1hZ2UsIEFMTCBub24tYmFja2dyb3VuZCBlbGVtZW50cyBhcmUgb3ZlcmxheXNcbiAgaWYgKGNvbXBvc2l0aW9uLmhhc0JhY2tncm91bmRJbWFnZSkge1xuICAgIGZvciAoY29uc3QgbGF5ZXIgb2YgbGF5ZXJzKSB7XG4gICAgICBpZiAobGF5ZXIucm9sZSAhPT0gJ2JhY2tncm91bmRfaW1hZ2UnICYmICFjb21wb3NpdGlvbi5vdmVybGF5RWxlbWVudHMuaW5jbHVkZXMobGF5ZXIubmFtZSkpIHtcbiAgICAgICAgY29tcG9zaXRpb24ub3ZlcmxheUVsZW1lbnRzLnB1c2gobGF5ZXIubmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbXBvc2l0aW9uO1xufVxuXG4vKipcbiAqIERldGVjdCBpZiBhIHNlY3Rpb24gY29udGFpbnMgZm9ybS1saWtlIGVsZW1lbnRzLlxuICogTG9va3MgZm9yIHBhdHRlcm5zOiBpbnB1dCByZWN0YW5nbGVzIChuYXJyb3cgaGVpZ2h0IGZyYW1lcyksIGxhYmVscyAoc21hbGwgdGV4dCBuZWFyIGlucHV0cyksXG4gKiBzdWJtaXQgYnV0dG9ucywgYW5kIGNvbW1vbiBmb3JtLXJlbGF0ZWQgbGF5ZXIgbmFtZXMuXG4gKi9cbmZ1bmN0aW9uIGRldGVjdEZvcm1TZWN0aW9uKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUpOiB7IGlzRm9ybTogYm9vbGVhbjsgZmllbGRzOiBGb3JtRmllbGRJbmZvW10gfSB7XG4gIGNvbnN0IGZvcm1LZXl3b3JkcyA9IFsnZm9ybScsICdpbnB1dCcsICdmaWVsZCcsICdjb250YWN0JywgJ3N1YnNjcmliZScsICduZXdzbGV0dGVyJywgJ3NpZ251cCcsICdzaWduLXVwJywgJ2VucXVpcnknLCAnaW5xdWlyeSddO1xuICBjb25zdCBpbnB1dEtleXdvcmRzID0gWydpbnB1dCcsICdmaWVsZCcsICd0ZXh0LWZpZWxkJywgJ3RleHRmaWVsZCcsICd0ZXh0X2ZpZWxkJywgJ2VtYWlsJywgJ3Bob25lJywgJ25hbWUnLCAnbWVzc2FnZScsICd0ZXh0YXJlYSddO1xuICBjb25zdCBzdWJtaXRLZXl3b3JkcyA9IFsnc3VibWl0JywgJ3NlbmQnLCAnYnV0dG9uJywgJ2N0YScsICdidG4nXTtcblxuICBjb25zdCBzZWN0aW9uTmFtZSA9IHNlY3Rpb25Ob2RlLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgbmFtZUhpbnRzRm9ybSA9IGZvcm1LZXl3b3Jkcy5zb21lKGt3ID0+IHNlY3Rpb25OYW1lLmluY2x1ZGVzKGt3KSk7XG5cbiAgbGV0IGlucHV0Q291bnQgPSAwO1xuICBsZXQgaGFzU3VibWl0QnV0dG9uID0gZmFsc2U7XG4gIGNvbnN0IGZpZWxkczogRm9ybUZpZWxkSW5mb1tdID0gW107XG4gIGNvbnN0IHRleHROb2RlczogeyBuYW1lOiBzdHJpbmc7IHRleHQ6IHN0cmluZzsgeTogbnVtYmVyIH1bXSA9IFtdO1xuICBjb25zdCBpbnB1dE5vZGVzOiB7IG5hbWU6IHN0cmluZzsgeTogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9W10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGNvbnN0IG5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgIC8vIERldGVjdCBpbnB1dC1saWtlIGZyYW1lczogbmFycm93IGhlaWdodCAoMzAtNjBweCksIHdpZGVyIHRoYW4gdGFsbCwgd2l0aCBib3JkZXIvZmlsbFxuICAgIGlmICgobm9kZS50eXBlID09PSAnRlJBTUUnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IG5vZGUudHlwZSA9PT0gJ1JFQ1RBTkdMRScpICYmIG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCkge1xuICAgICAgY29uc3QgYiA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgIGNvbnN0IGlzSW5wdXRTaGFwZSA9IGIuaGVpZ2h0ID49IDMwICYmIGIuaGVpZ2h0IDw9IDcwICYmIGIud2lkdGggPiBiLmhlaWdodCAqIDI7XG4gICAgICBjb25zdCBoYXNJbnB1dE5hbWUgPSBpbnB1dEtleXdvcmRzLnNvbWUoa3cgPT4gbmFtZS5pbmNsdWRlcyhrdykpO1xuXG4gICAgICBpZiAoaXNJbnB1dFNoYXBlICYmIChoYXNJbnB1dE5hbWUgfHwgbmFtZUhpbnRzRm9ybSkpIHtcbiAgICAgICAgaW5wdXRDb3VudCsrO1xuICAgICAgICBpbnB1dE5vZGVzLnB1c2goeyBuYW1lOiBub2RlLm5hbWUsIHk6IGIueSwgaGVpZ2h0OiBiLmhlaWdodCB9KTtcblxuICAgICAgICAvLyBEZXRlY3QgZmllbGQgdHlwZSBmcm9tIG5hbWVcbiAgICAgICAgbGV0IGZpZWxkVHlwZTogRm9ybUZpZWxkSW5mb1sndHlwZSddID0gJ3RleHQnO1xuICAgICAgICBpZiAobmFtZS5pbmNsdWRlcygnZW1haWwnKSkgZmllbGRUeXBlID0gJ2VtYWlsJztcbiAgICAgICAgZWxzZSBpZiAobmFtZS5pbmNsdWRlcygncGhvbmUnKSB8fCBuYW1lLmluY2x1ZGVzKCd0ZWwnKSkgZmllbGRUeXBlID0gJ3Bob25lJztcbiAgICAgICAgZWxzZSBpZiAobmFtZS5pbmNsdWRlcygndGV4dGFyZWEnKSB8fCBuYW1lLmluY2x1ZGVzKCdtZXNzYWdlJykgfHwgKGIuaGVpZ2h0ID4gODApKSBmaWVsZFR5cGUgPSAndGV4dGFyZWEnO1xuICAgICAgICBlbHNlIGlmIChuYW1lLmluY2x1ZGVzKCdzZWxlY3QnKSB8fCBuYW1lLmluY2x1ZGVzKCdkcm9wZG93bicpKSBmaWVsZFR5cGUgPSAnc2VsZWN0JztcbiAgICAgICAgZWxzZSBpZiAobmFtZS5pbmNsdWRlcygnY2hlY2tib3gnKSB8fCBuYW1lLmluY2x1ZGVzKCdjaGVjaycpKSBmaWVsZFR5cGUgPSAnY2hlY2tib3gnO1xuICAgICAgICBlbHNlIGlmIChuYW1lLmluY2x1ZGVzKCdyYWRpbycpKSBmaWVsZFR5cGUgPSAncmFkaW8nO1xuXG4gICAgICAgIGZpZWxkcy5wdXNoKHtcbiAgICAgICAgICBsYWJlbDogbm9kZS5uYW1lLnJlcGxhY2UoL1stX10vZywgJyAnKS5yZXBsYWNlKC9cXGJcXHcvZywgYyA9PiBjLnRvVXBwZXJDYXNlKCkpLFxuICAgICAgICAgIHR5cGU6IGZpZWxkVHlwZSxcbiAgICAgICAgICByZXF1aXJlZDogbmFtZS5pbmNsdWRlcygncmVxdWlyZWQnKSB8fCBuYW1lLmluY2x1ZGVzKCcqJyksXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXRlY3Qgc3VibWl0IGJ1dHRvbnNcbiAgICAgIGlmIChzdWJtaXRLZXl3b3Jkcy5zb21lKGt3ID0+IG5hbWUuaW5jbHVkZXMoa3cpKSAmJiBiLmhlaWdodCA+PSAzMCAmJiBiLmhlaWdodCA8PSA3MCkge1xuICAgICAgICBoYXNTdWJtaXRCdXR0b24gPSB0cnVlO1xuICAgICAgICBpZiAoIWZpZWxkcy5maW5kKGYgPT4gZi50eXBlID09PSAnc3VibWl0JykpIHtcbiAgICAgICAgICBmaWVsZHMucHVzaCh7IGxhYmVsOiAnU3VibWl0JywgdHlwZTogJ3N1Ym1pdCcsIHJlcXVpcmVkOiBmYWxzZSB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvbGxlY3QgdGV4dCBub2RlcyBuZWFyIGlucHV0cyBhcyBwb3RlbnRpYWwgbGFiZWxzXG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnICYmIG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCkge1xuICAgICAgdGV4dE5vZGVzLnB1c2goe1xuICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgIHRleHQ6IG5vZGUuY2hhcmFjdGVycyB8fCAnJyxcbiAgICAgICAgeTogbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94LnksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnZpc2libGUgIT09IGZhbHNlKSB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3YWxrKHNlY3Rpb25Ob2RlKTtcblxuICAvLyBNYXRjaCBsYWJlbHMgdG8gZmllbGRzOiB0ZXh0IG5vZGUgZGlyZWN0bHkgYWJvdmUgYW4gaW5wdXQgKHdpdGhpbiAzMHB4KVxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIGZpZWxkcykge1xuICAgIGNvbnN0IGZpZWxkSW5wdXQgPSBpbnB1dE5vZGVzLmZpbmQoaW5wID0+IGlucC5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoZmllbGQubGFiZWwudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC8gL2csICdfJykpKTtcbiAgICBpZiAoZmllbGRJbnB1dCkge1xuICAgICAgY29uc3QgbGFiZWxBYm92ZSA9IHRleHROb2Rlcy5maW5kKHQgPT4gdC55IDwgZmllbGRJbnB1dC55ICYmIChmaWVsZElucHV0LnkgLSB0LnkpIDwgNDApO1xuICAgICAgaWYgKGxhYmVsQWJvdmUpIHtcbiAgICAgICAgZmllbGQubGFiZWwgPSBsYWJlbEFib3ZlLnRleHQucmVwbGFjZSgnKicsICcnKS50cmltKCk7XG4gICAgICAgIGlmIChsYWJlbEFib3ZlLnRleHQuaW5jbHVkZXMoJyonKSkgZmllbGQucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGlzRm9ybSA9IChpbnB1dENvdW50ID49IDIgJiYgaGFzU3VibWl0QnV0dG9uKSB8fCAobmFtZUhpbnRzRm9ybSAmJiBpbnB1dENvdW50ID49IDEpO1xuXG4gIHJldHVybiB7IGlzRm9ybSwgZmllbGRzOiBpc0Zvcm0gPyBmaWVsZHMgOiBbXSB9O1xufVxuXG4vKipcbiAqIFBhcnNlIGFsbCBzZWN0aW9ucyBmcm9tIGEgcGFnZSBmcmFtZSBhbmQgcHJvZHVjZSBTZWN0aW9uU3BlYyBvYmplY3RzLlxuICovXG4vKipcbiAqIEV4dHJhY3QgZXZlcnkgVEVYVCBub2RlIGluIGEgc2VjdGlvbiBpbiByZWFkaW5nIG9yZGVyICh0b3AtdG8tYm90dG9tLFxuICogdGhlbiBsZWZ0LXRvLXJpZ2h0IGZvciBpdGVtcyBvbiB0aGUgc2FtZSByb3cgd2l0aGluIGEgMTJweCB0b2xlcmFuY2UpLlxuICpcbiAqIFRoaXMgaXMgdGhlIGNvbnRlbnQgc291cmNlIGZvciBwYWdlLWFzc2VtYmxlciB3aGVuIGRlc2lnbmVycyBkb24ndCBuYW1lXG4gKiBsYXllcnMgY29uc2lzdGVudGx5LiBJdCBwcmVzZXJ2ZXMgZXZlcnkgdmlzaWJsZSB0ZXh0IGZyb20gdGhlIEZpZ21hIGRlc2lnblxuICogc28gbm90aGluZyBjYW4gYmUgc2lsZW50bHkgZHJvcHBlZCBkdXJpbmcgQUNGIHBvcHVsYXRpb24uXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RUZXh0Q29udGVudEluT3JkZXIoc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSk6IFRleHRDb250ZW50RW50cnlbXSB7XG4gIGNvbnN0IHNlY3Rpb25Cb3VuZHMgPSBzZWN0aW9uTm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICBpZiAoIXNlY3Rpb25Cb3VuZHMpIHJldHVybiBbXTtcblxuICB0eXBlIFJhd1RleHQgPSB7IG5vZGU6IFRleHROb2RlOyByZWxZOiBudW1iZXI7IHJlbFg6IG51bWJlcjsgZm9udFNpemU6IG51bWJlciB9O1xuICBjb25zdCBjb2xsZWN0ZWQ6IFJhd1RleHRbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgaWYgKG5vZGUudmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICBpZiAoZGVwdGggPiA4KSByZXR1cm47XG5cbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIGNvbnN0IHQgPSBub2RlIGFzIFRleHROb2RlO1xuICAgICAgY29uc3QgY2hhcnMgPSB0LmNoYXJhY3RlcnMgfHwgJyc7XG4gICAgICBpZiAoIWNoYXJzLnRyaW0oKSkgcmV0dXJuOyAvLyBza2lwIGVtcHR5IHRleHQgbm9kZXNcbiAgICAgIGNvbnN0IGJiID0gdC5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgaWYgKCFiYikgcmV0dXJuO1xuICAgICAgY29uc3QgZnMgPSB0LmZvbnRTaXplICE9PSBmaWdtYS5taXhlZCA/ICh0LmZvbnRTaXplIGFzIG51bWJlcikgOiAxNjtcbiAgICAgIGNvbGxlY3RlZC5wdXNoKHtcbiAgICAgICAgbm9kZTogdCxcbiAgICAgICAgcmVsWTogYmIueSAtIHNlY3Rpb25Cb3VuZHMhLnksXG4gICAgICAgIHJlbFg6IGJiLnggLSBzZWN0aW9uQm91bmRzIS54LFxuICAgICAgICBmb250U2l6ZTogZnMsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjsgLy8gZG9uJ3QgcmVjdXJzZSBpbnRvIFRFWFRcbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCwgZGVwdGggKyAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoJ2NoaWxkcmVuJyBpbiBzZWN0aW9uTm9kZSkge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKHNlY3Rpb25Ob2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgIHdhbGsoY2hpbGQsIDApO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlYWRpbmcgb3JkZXI6IHNvcnQgYnkgWSAocm93cyksIHRoZW4gYnkgWCB3aXRoaW4gc2FtZSByb3cgKDEycHggdG9sZXJhbmNlKS5cbiAgY29sbGVjdGVkLnNvcnQoKGEsIGIpID0+IHtcbiAgICBpZiAoTWF0aC5hYnMoYS5yZWxZIC0gYi5yZWxZKSA8IDEyKSByZXR1cm4gYS5yZWxYIC0gYi5yZWxYO1xuICAgIHJldHVybiBhLnJlbFkgLSBiLnJlbFk7XG4gIH0pO1xuXG4gIC8vIFJvbGUgYXNzaWdubWVudCBcdTIwMTQgdG9wLW1vc3QgbGFyZ2VzdCB0ZXh0IGlzICdoZWFkaW5nJywgc2Vjb25kIGlzICdzdWJoZWFkaW5nJyxcbiAgLy8gc21hbGwgc2hvcnQgdGV4dHMgbmVhciBidXR0b25zIGFyZSAnYnV0dG9uX3RleHQnLCByZXN0IGFyZSAnYm9keScgb3IgJ3RleHRfTicuXG4gIGxldCBoZWFkaW5nQXNzaWduZWQgPSBmYWxzZTtcbiAgbGV0IHN1YmhlYWRpbmdBc3NpZ25lZCA9IGZhbHNlO1xuXG4gIHJldHVybiBjb2xsZWN0ZWQubWFwKChpdGVtLCBpZHgpID0+IHtcbiAgICBjb25zdCB0ZXh0ID0gaXRlbS5ub2RlLmNoYXJhY3RlcnMgfHwgJyc7XG4gICAgY29uc3QgY2xlYW5OYW1lID0gaXRlbS5ub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgY29uc3QgbmFtZUhpbnQgPSBjbGVhbk5hbWUgfHwgJyc7XG5cbiAgICBsZXQgcm9sZTogc3RyaW5nO1xuICAgIGlmIChuYW1lSGludC5pbmNsdWRlcygnYnV0dG9uJykgfHwgbmFtZUhpbnQuaW5jbHVkZXMoJ2N0YScpIHx8IG5hbWVIaW50LmluY2x1ZGVzKCdidG4nKSkge1xuICAgICAgcm9sZSA9ICdidXR0b25fdGV4dCc7XG4gICAgfSBlbHNlIGlmICghaGVhZGluZ0Fzc2lnbmVkICYmIGl0ZW0uZm9udFNpemUgPj0gMjgpIHtcbiAgICAgIHJvbGUgPSAnaGVhZGluZyc7XG4gICAgICBoZWFkaW5nQXNzaWduZWQgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAoIXN1YmhlYWRpbmdBc3NpZ25lZCAmJiBpdGVtLmZvbnRTaXplID49IDE4ICYmIGl0ZW0uZm9udFNpemUgPCAyOCkge1xuICAgICAgcm9sZSA9ICdzdWJoZWFkaW5nJztcbiAgICAgIHN1YmhlYWRpbmdBc3NpZ25lZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChpdGVtLmZvbnRTaXplIDw9IDEzIHx8IChuYW1lSGludC5pbmNsdWRlcygnY2FwdGlvbicpIHx8IG5hbWVIaW50LmluY2x1ZGVzKCdleWVicm93JykgfHwgbmFtZUhpbnQuaW5jbHVkZXMoJ3RhZycpKSkge1xuICAgICAgcm9sZSA9ICdjYXB0aW9uJztcbiAgICB9IGVsc2UgaWYgKHRleHQubGVuZ3RoIDwgMzAgJiYgaXRlbS5mb250U2l6ZSA8PSAxNikge1xuICAgICAgLy8gU2hvcnQsIHNtYWxsIFx1MjAxNCBsaWtlbHkgYSBsaW5rIG9yIGxhYmVsXG4gICAgICByb2xlID0gJ2xhYmVsJztcbiAgICB9IGVsc2Uge1xuICAgICAgcm9sZSA9IGBib2R5XyR7aWR4fWA7XG4gICAgfVxuXG4gICAgY29uc3QgYmIgPSBpdGVtLm5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCE7XG4gICAgcmV0dXJuIHtcbiAgICAgIGluZGV4OiBpZHgsXG4gICAgICB0ZXh0LFxuICAgICAgcm9sZSxcbiAgICAgIGxheWVyTmFtZTogaXRlbS5ub2RlLm5hbWUsXG4gICAgICBmb250U2l6ZTogTWF0aC5yb3VuZChpdGVtLmZvbnRTaXplKSxcbiAgICAgIGJvdW5kczoge1xuICAgICAgICB4OiBNYXRoLnJvdW5kKGl0ZW0ucmVsWCksXG4gICAgICAgIHk6IE1hdGgucm91bmQoaXRlbS5yZWxZKSxcbiAgICAgICAgd2lkdGg6IE1hdGgucm91bmQoYmIud2lkdGgpLFxuICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQoYmIuaGVpZ2h0KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNlY3Rpb25zKHBhZ2VGcmFtZTogRnJhbWVOb2RlKTogUmVjb3JkPHN0cmluZywgU2VjdGlvblNwZWM+IHtcbiAgY29uc3Qgc2VjdGlvbk5vZGVzID0gaWRlbnRpZnlTZWN0aW9ucyhwYWdlRnJhbWUpO1xuICBjb25zdCBzcGVjczogUmVjb3JkPHN0cmluZywgU2VjdGlvblNwZWM+ID0ge307XG5cbiAgbGV0IHByZXZCb3R0b20gPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VjdGlvbk5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZSA9IHNlY3Rpb25Ob2Rlc1tpXTtcbiAgICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgaWYgKCFib3VuZHMpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgbGF5b3V0TmFtZSA9IHRvTGF5b3V0TmFtZShub2RlLm5hbWUpO1xuICAgIGNvbnN0IGlzRnJhbWUgPSBub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRSc7XG4gICAgY29uc3QgZnJhbWUgPSBpc0ZyYW1lID8gKG5vZGUgYXMgRnJhbWVOb2RlKSA6IG51bGw7XG5cbiAgICAvLyBEZXRlcm1pbmUgc3BhY2luZyBzb3VyY2UgYW5kIGV4dHJhY3Qgc3BhY2luZ1xuICAgIGNvbnN0IGhhc0F1dG9MYXlvdXQgPSBmcmFtZT8ubGF5b3V0TW9kZSAmJiBmcmFtZS5sYXlvdXRNb2RlICE9PSAnTk9ORSc7XG4gICAgbGV0IHNwYWNpbmdTb3VyY2U6ICdhdXRvLWxheW91dCcgfCAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnO1xuICAgIGxldCBzZWN0aW9uU3R5bGVzOiBQYXJ0aWFsPFNlY3Rpb25TdHlsZXM+O1xuICAgIGxldCBpdGVtU3BhY2luZzogc3RyaW5nIHwgbnVsbDtcblxuICAgIGlmIChoYXNBdXRvTGF5b3V0ICYmIGZyYW1lKSB7XG4gICAgICBjb25zdCBzcGFjaW5nID0gZXh0cmFjdEF1dG9MYXlvdXRTcGFjaW5nKGZyYW1lKTtcbiAgICAgIHNwYWNpbmdTb3VyY2UgPSBzcGFjaW5nLnNwYWNpbmdTb3VyY2U7XG4gICAgICBzZWN0aW9uU3R5bGVzID0gc3BhY2luZy5zZWN0aW9uU3R5bGVzO1xuICAgICAgaXRlbVNwYWNpbmcgPSBzcGFjaW5nLml0ZW1TcGFjaW5nO1xuICAgIH0gZWxzZSBpZiAoZnJhbWUpIHtcbiAgICAgIGNvbnN0IHNwYWNpbmcgPSBleHRyYWN0QWJzb2x1dGVTcGFjaW5nKGZyYW1lKTtcbiAgICAgIHNwYWNpbmdTb3VyY2UgPSBzcGFjaW5nLnNwYWNpbmdTb3VyY2U7XG4gICAgICBzZWN0aW9uU3R5bGVzID0gc3BhY2luZy5zZWN0aW9uU3R5bGVzO1xuICAgICAgaXRlbVNwYWNpbmcgPSBzcGFjaW5nLml0ZW1TcGFjaW5nO1xuICAgIH0gZWxzZSB7XG4gICAgICBzcGFjaW5nU291cmNlID0gJ2Fic29sdXRlLWNvb3JkaW5hdGVzJztcbiAgICAgIHNlY3Rpb25TdHlsZXMgPSB7fTtcbiAgICAgIGl0ZW1TcGFjaW5nID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBCYXNlIHNlY3Rpb24gc3R5bGVzIChiYWNrZ3JvdW5kLCBncmFkaWVudCwgZXRjLilcbiAgICBjb25zdCBiYXNlU3R5bGVzID0gZXh0cmFjdFNlY3Rpb25TdHlsZXMobm9kZSk7XG4gICAgY29uc3QgbWVyZ2VkU3R5bGVzOiBTZWN0aW9uU3R5bGVzID0ge1xuICAgICAgLi4uYmFzZVN0eWxlcyxcbiAgICAgIC4uLnNlY3Rpb25TdHlsZXMsXG4gICAgfTtcblxuICAgIC8vIEVsZW1lbnRzXG4gICAgY29uc3QgZWxlbWVudHMgPSBleHRyYWN0RWxlbWVudHMobm9kZSk7XG5cbiAgICAvLyBHcmlkIGRldGVjdGlvblxuICAgIGNvbnN0IGdyaWQgPSBmcmFtZSA/IGRldGVjdEdyaWQoZnJhbWUpIDoge1xuICAgICAgbGF5b3V0TW9kZTogJ2Fic29sdXRlJyBhcyBjb25zdCxcbiAgICAgIGNvbHVtbnM6IDEsXG4gICAgICBnYXA6IGl0ZW1TcGFjaW5nLFxuICAgICAgcm93R2FwOiBudWxsLFxuICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgaXRlbU1pbldpZHRoOiBudWxsLFxuICAgIH07XG5cbiAgICAvLyBFbnN1cmUgZ3JpZCBnYXAgaXMgc2V0IGZyb20gaXRlbVNwYWNpbmcgaWYgbm90IGFscmVhZHlcbiAgICBpZiAoIWdyaWQuZ2FwICYmIGl0ZW1TcGFjaW5nKSB7XG4gICAgICBncmlkLmdhcCA9IGl0ZW1TcGFjaW5nO1xuICAgIH1cblxuICAgIC8vIE92ZXJsYXAgZGV0ZWN0aW9uXG4gICAgbGV0IG92ZXJsYXA6IE92ZXJsYXBJbmZvIHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKGkgPiAwKSB7XG4gICAgICBjb25zdCBvdmVybGFwUHggPSBwcmV2Qm90dG9tIC0gYm91bmRzLnk7XG4gICAgICBpZiAob3ZlcmxhcFB4ID4gMCkge1xuICAgICAgICBvdmVybGFwID0ge1xuICAgICAgICAgIHdpdGhTZWN0aW9uOiBzZWN0aW9uTm9kZXNbaSAtIDFdLm5hbWUsXG4gICAgICAgICAgcGl4ZWxzOiBNYXRoLnJvdW5kKG92ZXJsYXBQeCksXG4gICAgICAgICAgY3NzTWFyZ2luVG9wOiBgLSR7TWF0aC5yb3VuZChvdmVybGFwUHgpfXB4YCxcbiAgICAgICAgICByZXF1aXJlc1pJbmRleDogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbnRlcmFjdGlvbnNcbiAgICBjb25zdCBpbnRlcmFjdGlvbnMgPSBleHRyYWN0SW50ZXJhY3Rpb25zKG5vZGUpO1xuXG4gICAgLy8gTGF5ZXIgY29tcG9zaXRpb24gYW5hbHlzaXNcbiAgICBjb25zdCBsYXllcnMgPSBleHRyYWN0TGF5ZXJzKG5vZGUsIGVsZW1lbnRzKTtcbiAgICBjb25zdCBjb21wb3NpdGlvbiA9IGRldGVjdENvbXBvc2l0aW9uKGxheWVycyk7XG5cbiAgICAvLyBFbnJpY2ggZWxlbWVudHMgd2l0aCBwb3NpdGlvbiBkYXRhIGZyb20gY29tcG9zaXRpb25cbiAgICBpZiAoY29tcG9zaXRpb24uaGFzVGV4dE92ZXJJbWFnZSB8fCBjb21wb3NpdGlvbi5oYXNCYWNrZ3JvdW5kSW1hZ2UpIHtcbiAgICAgIC8vIFNlY3Rpb24gbmVlZHMgcG9zaXRpb246IHJlbGF0aXZlIGZvciBvdmVybGF5IGNoaWxkcmVuXG4gICAgICBtZXJnZWRTdHlsZXMub3ZlcmZsb3cgPSBtZXJnZWRTdHlsZXMub3ZlcmZsb3cgfHwgJ2hpZGRlbic7XG5cbiAgICAgIGZvciAoY29uc3QgW2VsZW1OYW1lLCBlbGVtU3R5bGVzXSBvZiBPYmplY3QuZW50cmllcyhlbGVtZW50cykpIHtcbiAgICAgICAgaWYgKGNvbXBvc2l0aW9uLm92ZXJsYXlFbGVtZW50cy5pbmNsdWRlcyhlbGVtTmFtZSkgfHwgY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlKSB7XG4gICAgICAgICAgLy8gRmluZCBtYXRjaGluZyBsYXllciBmb3IgcG9zaXRpb24gZGF0YVxuICAgICAgICAgIGNvbnN0IGxheWVyID0gbGF5ZXJzLmZpbmQobCA9PiBsLm5hbWUgPT09IGVsZW1OYW1lKTtcbiAgICAgICAgICBpZiAobGF5ZXIgJiYgbGF5ZXIucm9sZSAhPT0gJ2JhY2tncm91bmRfaW1hZ2UnKSB7XG4gICAgICAgICAgICBlbGVtU3R5bGVzLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgIGVsZW1TdHlsZXMuekluZGV4ID0gbGF5ZXIuekluZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZvcm0gZGV0ZWN0aW9uXG4gICAgY29uc3QgZm9ybVJlc3VsdCA9IGRldGVjdEZvcm1TZWN0aW9uKG5vZGUpO1xuXG4gICAgLy8gT3JkZXJlZCB0ZXh0IGNvbnRlbnQgXHUyMDE0IGV2ZXJ5IHRleHQgaW4gcmVhZGluZyBvcmRlciAoZm9yIHBhZ2UtYXNzZW1ibGVyIG1hcHBpbmcpXG4gICAgY29uc3QgdGV4dENvbnRlbnRJbk9yZGVyID0gZXh0cmFjdFRleHRDb250ZW50SW5PcmRlcihub2RlKTtcblxuICAgIHNwZWNzW2xheW91dE5hbWVdID0ge1xuICAgICAgc3BhY2luZ1NvdXJjZSxcbiAgICAgIGZpZ21hTm9kZUlkOiBub2RlLmlkLFxuICAgICAgc2NyZWVuc2hvdEZpbGU6IGBzY3JlZW5zaG90cy8ke3NjcmVlbnNob3RGaWxlbmFtZShpICsgMSwgbm9kZS5uYW1lKX1gLFxuICAgICAgc2VjdGlvbjogbWVyZ2VkU3R5bGVzLFxuICAgICAgZWxlbWVudHMsXG4gICAgICBncmlkLFxuICAgICAgaW50ZXJhY3Rpb25zOiBpbnRlcmFjdGlvbnMubGVuZ3RoID4gMCA/IGludGVyYWN0aW9ucyA6IHVuZGVmaW5lZCxcbiAgICAgIG92ZXJsYXAsXG4gICAgICBsYXllcnM6IGxheWVycy5sZW5ndGggPiAwID8gbGF5ZXJzIDogdW5kZWZpbmVkLFxuICAgICAgY29tcG9zaXRpb246IChjb21wb3NpdGlvbi5oYXNUZXh0T3ZlckltYWdlIHx8IGNvbXBvc2l0aW9uLmhhc0JhY2tncm91bmRJbWFnZSkgPyBjb21wb3NpdGlvbiA6IHVuZGVmaW5lZCxcbiAgICAgIGlzRm9ybVNlY3Rpb246IGZvcm1SZXN1bHQuaXNGb3JtIHx8IHVuZGVmaW5lZCxcbiAgICAgIGZvcm1GaWVsZHM6IGZvcm1SZXN1bHQuZmllbGRzLmxlbmd0aCA+IDAgPyBmb3JtUmVzdWx0LmZpZWxkcyA6IHVuZGVmaW5lZCxcbiAgICAgIHRleHRDb250ZW50SW5PcmRlcjogdGV4dENvbnRlbnRJbk9yZGVyLmxlbmd0aCA+IDAgPyB0ZXh0Q29udGVudEluT3JkZXIgOiB1bmRlZmluZWQsXG4gICAgfTtcblxuICAgIHByZXZCb3R0b20gPSBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQ7XG4gIH1cblxuICByZXR1cm4gc3BlY3M7XG59XG4iLCAiaW1wb3J0IHsgSW1hZ2VFeHBvcnRUYXNrLCBJbWFnZU1hcCwgSW1hZ2VNYXBFbnRyeSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgc2x1Z2lmeSwgc2NyZWVuc2hvdEZpbGVuYW1lIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBoYXNJbWFnZUZpbGwgfSBmcm9tICcuL2NvbG9yJztcblxuY29uc3QgQkFUQ0hfU0laRSA9IDEwO1xuXG4vKipcbiAqIElkZW50aWZ5IHNlY3Rpb24tbGV2ZWwgY2hpbGRyZW4sIG1hdGNoaW5nIHRoZSBzYW1lIGxvZ2ljIGFzIHNlY3Rpb24tcGFyc2VyLnRzLlxuICogSWYgdGhlIGZyYW1lIGhhcyBhIHNpbmdsZSB3cmFwcGVyIGNoaWxkLCBkcmlsbCBvbmUgbGV2ZWwgZGVlcGVyLlxuICovXG5mdW5jdGlvbiBpZGVudGlmeVNlY3Rpb25Ob2RlcyhwYWdlRnJhbWU6IEZyYW1lTm9kZSk6IFNjZW5lTm9kZVtdIHtcbiAgbGV0IGNhbmRpZGF0ZXMgPSBwYWdlRnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpICYmXG4gICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmXG4gICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94LmhlaWdodCA+IDUwXG4gICk7XG5cbiAgLy8gSWYgdGhlcmUncyBhIHNpbmdsZSBjb250YWluZXIgY2hpbGQsIGRyaWxsIG9uZSBsZXZlbCBkZWVwZXIgKG1hdGNoZXMgc2VjdGlvbi1wYXJzZXIudHMpXG4gIGlmIChjYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSAmJiAnY2hpbGRyZW4nIGluIGNhbmRpZGF0ZXNbMF0pIHtcbiAgICBjb25zdCB3cmFwcGVyID0gY2FuZGlkYXRlc1swXSBhcyBGcmFtZU5vZGU7XG4gICAgY29uc3QgaW5uZXJDYW5kaWRhdGVzID0gd3JhcHBlci5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3ggJiZcbiAgICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveC5oZWlnaHQgPiA1MFxuICAgICk7XG4gICAgaWYgKGlubmVyQ2FuZGlkYXRlcy5sZW5ndGggPiAxKSB7XG4gICAgICBjYW5kaWRhdGVzID0gaW5uZXJDYW5kaWRhdGVzO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbLi4uY2FuZGlkYXRlc10uc29ydCgoYSwgYikgPT4gYS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gYi5hYnNvbHV0ZUJvdW5kaW5nQm94IS55KTtcbn1cblxuLyoqXG4gKiBCdWlsZCB0aGUgbGlzdCBvZiBhbGwgZXhwb3J0IHRhc2tzIGZvciBhIHBhZ2UgZnJhbWUuXG4gKiBJbmNsdWRlczogZnVsbC1wYWdlIGNvbXBvc2l0ZSBzY3JlZW5zaG90LCBwZXItc2VjdGlvbiBzY3JlZW5zaG90cyxcbiAqIGFuZCBpbWFnZSBhc3NldHMgKFBORyBmb3IgcGhvdG9zLCBTVkcgZm9yIHZlY3RvciBpY29ucykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEV4cG9ydFRhc2tzKHBhZ2VGcmFtZTogRnJhbWVOb2RlLCBwYWdlU2x1Zzogc3RyaW5nKTogSW1hZ2VFeHBvcnRUYXNrW10ge1xuICBjb25zdCB0YXNrczogSW1hZ2VFeHBvcnRUYXNrW10gPSBbXTtcbiAgY29uc3QgcGFnZVBhdGggPSBgcGFnZXMvJHtwYWdlU2x1Z31gO1xuXG4gIC8vIEZ1bGwtcGFnZSBjb21wb3NpdGUgc2NyZWVuc2hvdCBcdTIwMTQgY3JpdGljYWwgZm9yIGFnZW50J3MgZnVsbC1wYWdlIHZpc3VhbCByZXZpZXcuXG4gIHRhc2tzLnB1c2goe1xuICAgIG5vZGVJZDogcGFnZUZyYW1lLmlkLFxuICAgIG5vZGVOYW1lOiBwYWdlRnJhbWUubmFtZSxcbiAgICB0eXBlOiAnZnVsbC1wYWdlJyxcbiAgICBmaWxlbmFtZTogJ19mdWxsLXBhZ2UucG5nJyxcbiAgICBwYWdlUGF0aCxcbiAgICBmb3JtYXQ6ICdQTkcnLFxuICAgIHNjYWxlOiAxLFxuICB9KTtcblxuICAvLyBQZXItc2VjdGlvbiBzY3JlZW5zaG90cyBhdCAxeCBcdTIwMTQgdXNlcyBzYW1lIHdyYXBwZXIgZHJpbGwtZG93biBhcyBzZWN0aW9uLXBhcnNlclxuICBjb25zdCBzZWN0aW9ucyA9IGlkZW50aWZ5U2VjdGlvbk5vZGVzKHBhZ2VGcmFtZSk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIHRhc2tzLnB1c2goe1xuICAgICAgbm9kZUlkOiBzZWN0aW9uc1tpXS5pZCxcbiAgICAgIG5vZGVOYW1lOiBzZWN0aW9uc1tpXS5uYW1lLFxuICAgICAgdHlwZTogJ3NjcmVlbnNob3QnLFxuICAgICAgZmlsZW5hbWU6IHNjcmVlbnNob3RGaWxlbmFtZShpICsgMSwgc2VjdGlvbnNbaV0ubmFtZSksXG4gICAgICBwYWdlUGF0aCxcbiAgICAgIGZvcm1hdDogJ1BORycsXG4gICAgICBzY2FsZTogMSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEltYWdlIGFzc2V0cyBcdTIwMTQgZGV0ZWN0IGljb25zICh2ZWN0b3Itb25seSwgc21hbGwpIHZzIHBob3RvcyAocmFzdGVyIGZpbGxzKVxuICBjb25zdCBpY29uTm9kZXMgPSBmaW5kSWNvbk5vZGVzKHBhZ2VGcmFtZSk7XG4gIGNvbnN0IHNlZW5JY29uSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgaWNvbk5vZGUgb2YgaWNvbk5vZGVzKSB7XG4gICAgaWYgKHNlZW5JY29uSWRzLmhhcyhpY29uTm9kZS5pZCkpIGNvbnRpbnVlO1xuICAgIHNlZW5JY29uSWRzLmFkZChpY29uTm9kZS5pZCk7XG4gICAgdGFza3MucHVzaCh7XG4gICAgICBub2RlSWQ6IGljb25Ob2RlLmlkLFxuICAgICAgbm9kZU5hbWU6IGljb25Ob2RlLm5hbWUsXG4gICAgICB0eXBlOiAnYXNzZXQnLFxuICAgICAgZmlsZW5hbWU6IGAke3NsdWdpZnkoaWNvbk5vZGUubmFtZSl9LnN2Z2AsXG4gICAgICBwYWdlUGF0aCxcbiAgICAgIGZvcm1hdDogJ1NWRycsXG4gICAgICBzY2FsZTogMSxcbiAgICAgIHByZWZlclN2ZzogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGltYWdlTm9kZXMgPSBmaW5kSW1hZ2VOb2RlcyhwYWdlRnJhbWUpO1xuICBjb25zdCBzZWVuSGFzaGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCBpbWdOb2RlIG9mIGltYWdlTm9kZXMpIHtcbiAgICAvLyBTa2lwIG5vZGVzIGFscmVhZHkgcXVldWVkIGFzIFNWRyBpY29uc1xuICAgIGlmIChzZWVuSWNvbklkcy5oYXMoaW1nTm9kZS5pZCkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGhhc2hLZXkgPSBgJHtpbWdOb2RlLm5hbWV9XyR7aW1nTm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94Py53aWR0aH1fJHtpbWdOb2RlLmFic29sdXRlQm91bmRpbmdCb3g/LmhlaWdodH1gO1xuICAgIGlmIChzZWVuSGFzaGVzLmhhcyhoYXNoS2V5KSkgY29udGludWU7XG4gICAgc2Vlbkhhc2hlcy5hZGQoaGFzaEtleSk7XG5cbiAgICBjb25zdCBmaWxlbmFtZSA9IGAke3NsdWdpZnkoaW1nTm9kZS5uYW1lKX0ucG5nYDtcbiAgICB0YXNrcy5wdXNoKHtcbiAgICAgIG5vZGVJZDogaW1nTm9kZS5pZCxcbiAgICAgIG5vZGVOYW1lOiBpbWdOb2RlLm5hbWUsXG4gICAgICB0eXBlOiAnYXNzZXQnLFxuICAgICAgZmlsZW5hbWUsXG4gICAgICBwYWdlUGF0aCxcbiAgICAgIGZvcm1hdDogJ1BORycsXG4gICAgICBzY2FsZTogMSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB0YXNrcztcbn1cblxuLyoqXG4gKiBJZGVudGlmeSBpY29uIG5vZGVzIFx1MjAxNCB2ZWN0b3Itb25seSwgdHlwaWNhbGx5IHNtYWxsICg8IDY0cHgpLiBUaGVzZSBhcmVcbiAqIGV4cG9ydGVkIGFzIFNWRyBzbyB0aGUgdGhlbWUgY2FuIGlubGluZSB0aGVtLCByZWNvbG9yIHZpYSBDU1MgY3VycmVudENvbG9yLFxuICogYW5kIHJlbmRlciBzaGFycCBhdCBhbnkgcmVzb2x1dGlvbi5cbiAqXG4gKiBIZXVyaXN0aWNzOlxuICogICAtIG5vZGUudHlwZSA9PT0gJ1ZFQ1RPUicgKHB1cmUgdmVjdG9yIHBhdGgpXG4gKiAgIC0gRlJBTUUvQ09NUE9ORU5UIHdob3NlIGVudGlyZSBzdWJ0cmVlIGlzIHZlY3RvciAobm8gSU1BR0UgZmlsbHMsIG5vIFRFWFQpXG4gKiAgICAgQU5EIGJvdW5kaW5nIGJveCBcdTIyNjQgNjRcdTAwRDc2NFxuICogICAtIExheWVyIG5hbWUgY29udGFpbnMgXCJpY29uXCIgKGhpbnQpXG4gKi9cbmZ1bmN0aW9uIGZpbmRJY29uTm9kZXMocm9vdDogU2NlbmVOb2RlKTogU2NlbmVOb2RlW10ge1xuICBjb25zdCBpY29uczogU2NlbmVOb2RlW10gPSBbXTtcblxuICBmdW5jdGlvbiBpc1ZlY3Rvck9ubHkobjogU2NlbmVOb2RlKTogYm9vbGVhbiB7XG4gICAgaWYgKG4udHlwZSA9PT0gJ1RFWFQnKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGhhc0ltYWdlRmlsbChuIGFzIGFueSkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnZpc2libGUgPT09IGZhbHNlKSBjb250aW51ZTtcbiAgICAgICAgaWYgKCFpc1ZlY3Rvck9ubHkoY2hpbGQpKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIGNvbnN0IGJiID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgIGNvbnN0IHNtYWxsaXNoID0gYmIgJiYgYmIud2lkdGggPD0gNjQgJiYgYmIuaGVpZ2h0IDw9IDY0O1xuXG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1ZFQ1RPUicpIHtcbiAgICAgIGljb25zLnB1c2gobm9kZSk7XG4gICAgICByZXR1cm47IC8vIGRvbid0IHJlY3Vyc2UgaW50byB2ZWN0b3IgcGF0aHNcbiAgICB9XG5cbiAgICBjb25zdCBuYW1lSGludHNJY29uID0gL1xcYmljb25cXGIvaS50ZXN0KG5vZGUubmFtZSk7XG4gICAgaWYgKChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgICAoc21hbGxpc2ggfHwgbmFtZUhpbnRzSWNvbikgJiZcbiAgICAgICAgaXNWZWN0b3JPbmx5KG5vZGUpICYmXG4gICAgICAgICdjaGlsZHJlbicgaW4gbm9kZSAmJiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgIGljb25zLnB1c2gobm9kZSk7XG4gICAgICByZXR1cm47IC8vIGRvbid0IHJlY3Vyc2UgaW50byBpY29uIGludGVybmFsc1xuICAgIH1cblxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2Fsayhyb290KTtcbiAgcmV0dXJuIGljb25zO1xufVxuXG4vKipcbiAqIEZpbmQgYWxsIG5vZGVzIHdpdGggSU1BR0UgZmlsbHMgaW4gYSBzdWJ0cmVlLlxuICovXG5mdW5jdGlvbiBmaW5kSW1hZ2VOb2Rlcyhyb290OiBTY2VuZU5vZGUpOiBTY2VuZU5vZGVbXSB7XG4gIGNvbnN0IG5vZGVzOiBTY2VuZU5vZGVbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkpIHtcbiAgICAgIG5vZGVzLnB1c2gobm9kZSk7XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKHJvb3QpO1xuICByZXR1cm4gbm9kZXM7XG59XG5cbi8qKlxuICogRXhwb3J0IGEgc2luZ2xlIG5vZGUgYXMgUE5HL1NWRyBieXRlcy5cbiAqXG4gKiBGb3Igc2VjdGlvbiBzY3JlZW5zaG90cywgdGhpcyB1c2VzIGV4cG9ydEFzeW5jIHdoaWNoIHJlbmRlcnMgdGhlIGNvbXBvc2l0ZVxuICogKGltYWdlICsgdGV4dCArIG92ZXJsYXlzKSBcdTIwMTQgY29ycmVjdCBmb3Igc2NyZWVuc2hvdHMuXG4gKlxuICogRm9yIGltYWdlIGFzc2V0cywgdGhpcyBwdWxscyB0aGUgUkFXIGltYWdlIGJ5dGVzIGZyb20gdGhlIG5vZGUncyBJTUFHRSBmaWxsXG4gKiB2aWEgZmlnbWEuZ2V0SW1hZ2VCeUhhc2goKS4gVGhpcyByZXR1cm5zIHRoZSBwdXJlIHNvdXJjZSBpbWFnZSB3aXRoIE5PXG4gKiB0ZXh0L3NoYXBlIG92ZXJsYXlzIGJha2VkIGluIFx1MjAxNCBmaXhpbmcgdGhlIGNvbW1vbiBcImhlcm8gaW1hZ2UgaW5jbHVkZXMgdGhlXG4gKiBoZWFkbGluZSB0ZXh0XCIgcHJvYmxlbS4gTWFza3MgYW5kIGNyb3BzIGFyZSBkaXNjYXJkZWQgaW50ZW50aW9uYWxseTsgdGhlXG4gKiB0aGVtZSByZS1hcHBsaWVzIHRoZW0gdmlhIENTUyAob2JqZWN0LWZpdCwgYmFja2dyb3VuZC1zaXplLCBib3JkZXItcmFkaXVzKS5cbiAqXG4gKiBBc3NldCBmYWxsYmFjazogaWYgdGhlIG5vZGUgaGFzIG5vIGltYWdlIGZpbGwgKGUuZy4gYW4gU1ZHIGlsbHVzdHJhdGlvbiksXG4gKiBmYWxsIGJhY2sgdG8gZXhwb3J0QXN5bmMgc28gbG9nb3MvaWNvbnMgc3RpbGwgZXhwb3J0IGNvcnJlY3RseS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZXhwb3J0Tm9kZShcbiAgbm9kZUlkOiBzdHJpbmcsXG4gIGZvcm1hdDogJ1BORycgfCAnU1ZHJyB8ICdKUEcnLFxuICBzY2FsZTogbnVtYmVyLFxuICB0YXNrVHlwZTogJ3NjcmVlbnNob3QnIHwgJ2Z1bGwtcGFnZScgfCAnYXNzZXQnLFxuKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIGNvbnN0IG5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChub2RlSWQpO1xuICBpZiAoIW5vZGUgfHwgISgnZXhwb3J0QXN5bmMnIGluIG5vZGUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBOb2RlICR7bm9kZUlkfSBub3QgZm91bmQgb3Igbm90IGV4cG9ydGFibGVgKTtcbiAgfVxuXG4gIC8vIFNWRyByZXF1ZXN0ZWQgXHUyMDE0IHVzZSBleHBvcnRBc3luYyBkaXJlY3RseSAoZm9yIGljb25zLCB2ZWN0b3IgaWxsdXN0cmF0aW9ucylcbiAgaWYgKGZvcm1hdCA9PT0gJ1NWRycpIHtcbiAgICByZXR1cm4gYXdhaXQgKG5vZGUgYXMgU2NlbmVOb2RlKS5leHBvcnRBc3luYyh7IGZvcm1hdDogJ1NWRycgfSk7XG4gIH1cblxuICAvLyBGb3IgUE5HIGFzc2V0IHRhc2tzOiB0cnkgdG8gcHVsbCByYXcgaW1hZ2UgYnl0ZXMgZnJvbSBhbiBJTUFHRSBmaWxsIGZpcnN0XG4gIC8vIHNvIHdlIGdldCB0aGUgcHVyZSBzb3VyY2UgaW1hZ2Ugd2l0aG91dCBhbnkgYmFrZWQtaW4gdGV4dC9vdmVybGF5cy5cbiAgaWYgKHRhc2tUeXBlID09PSAnYXNzZXQnICYmIGZvcm1hdCA9PT0gJ1BORycpIHtcbiAgICBjb25zdCByYXcgPSBhd2FpdCB0cnlFeHRyYWN0UmF3SW1hZ2VCeXRlcyhub2RlIGFzIFNjZW5lTm9kZSk7XG4gICAgaWYgKHJhdykgcmV0dXJuIHJhdztcbiAgICAvLyBlbHNlIGZhbGwgdGhyb3VnaCB0byBleHBvcnRBc3luYyAoU1ZHIGlsbHVzdHJhdGlvbiwgdmVjdG9yIGdyYXBoaWMsIGV0Yy4pXG4gIH1cblxuICAvLyBGdWxsLXBhZ2UgYW5kIHNlY3Rpb24gc2NyZWVuc2hvdHMgdXNlIGV4cG9ydEFzeW5jIChyZW5kZXJlZCBjb21wb3NpdGUpLlxuICAvLyBTY2FsZSB1cCB0byAyeCBmb3IgZnVsbC1wYWdlIHRvIHByZXNlcnZlIGRldGFpbCB3aGVuIGNvbXBhcmluZyB3aXRoIGJyb3dzZXIuXG4gIGNvbnN0IGV4cG9ydFNjYWxlID0gdGFza1R5cGUgPT09ICdmdWxsLXBhZ2UnID8gMiA6IHNjYWxlO1xuICByZXR1cm4gYXdhaXQgKG5vZGUgYXMgU2NlbmVOb2RlKS5leHBvcnRBc3luYyh7XG4gICAgZm9ybWF0OiAnUE5HJyxcbiAgICBjb25zdHJhaW50OiB7IHR5cGU6ICdTQ0FMRScsIHZhbHVlOiBleHBvcnRTY2FsZSB9LFxuICB9KTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHJhdyBpbWFnZSBieXRlcyBmcm9tIHRoZSBmaXJzdCB2aXNpYmxlIElNQUdFIGZpbGwgb24gYSBub2RlLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSBub2RlIGhhcyBubyBJTUFHRSBmaWxsIG9yIHRoZSBoYXNoIGNhbid0IGJlIHJlc29sdmVkLlxuICovXG5hc3luYyBmdW5jdGlvbiB0cnlFeHRyYWN0UmF3SW1hZ2VCeXRlcyhub2RlOiBTY2VuZU5vZGUpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gIGNvbnN0IGZpbGxzID0gKG5vZGUgYXMgYW55KS5maWxscztcbiAgaWYgKCFmaWxscyB8fCAhQXJyYXkuaXNBcnJheShmaWxscykpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGltYWdlRmlsbCA9IGZpbGxzLmZpbmQoXG4gICAgKGY6IFBhaW50KSA9PiBmLnR5cGUgPT09ICdJTUFHRScgJiYgZi52aXNpYmxlICE9PSBmYWxzZSAmJiAoZiBhcyBJbWFnZVBhaW50KS5pbWFnZUhhc2gsXG4gICkgYXMgSW1hZ2VQYWludCB8IHVuZGVmaW5lZDtcblxuICBpZiAoIWltYWdlRmlsbCB8fCAhaW1hZ2VGaWxsLmltYWdlSGFzaCkgcmV0dXJuIG51bGw7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBpbWFnZSA9IGZpZ21hLmdldEltYWdlQnlIYXNoKGltYWdlRmlsbC5pbWFnZUhhc2gpO1xuICAgIGlmICghaW1hZ2UpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBhd2FpdCBpbWFnZS5nZXRCeXRlc0FzeW5jKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUud2FybihgRmFpbGVkIHRvIGV4dHJhY3QgcmF3IGltYWdlIGJ5dGVzIGZyb20gJHtub2RlLm5hbWV9OmAsIGVycik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlIGV4cG9ydCB0YXNrcyBpbiBiYXRjaGVzIG9mIDEwLlxuICogU2VuZHMgZWFjaCByZXN1bHQgdG8gVUkgaW1tZWRpYXRlbHkgdG8gZnJlZSBzYW5kYm94IG1lbW9yeS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVCYXRjaEV4cG9ydChcbiAgdGFza3M6IEltYWdlRXhwb3J0VGFza1tdLFxuICBvblByb2dyZXNzOiAoY3VycmVudDogbnVtYmVyLCB0b3RhbDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKSA9PiB2b2lkLFxuICBvbkRhdGE6ICh0YXNrOiBJbWFnZUV4cG9ydFRhc2ssIGRhdGE6IFVpbnQ4QXJyYXkpID0+IHZvaWQsXG4gIHNob3VsZENhbmNlbDogKCkgPT4gYm9vbGVhbixcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB0b3RhbCA9IHRhc2tzLmxlbmd0aDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsOyBpICs9IEJBVENIX1NJWkUpIHtcbiAgICBpZiAoc2hvdWxkQ2FuY2VsKCkpIHJldHVybjtcblxuICAgIGNvbnN0IGJhdGNoID0gdGFza3Muc2xpY2UoaSwgaSArIEJBVENIX1NJWkUpO1xuICAgIGNvbnN0IGJhdGNoUHJvbWlzZXMgPSBiYXRjaC5tYXAoYXN5bmMgKHRhc2spID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBleHBvcnROb2RlKHRhc2subm9kZUlkLCB0YXNrLmZvcm1hdCwgdGFzay5zY2FsZSwgdGFzay50eXBlKTtcbiAgICAgICAgb25EYXRhKHRhc2ssIGRhdGEpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBleHBvcnQgJHt0YXNrLmZpbGVuYW1lfTpgLCBlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoYmF0Y2hQcm9taXNlcyk7XG4gICAgY29uc3QgZG9uZSA9IE1hdGgubWluKGkgKyBCQVRDSF9TSVpFLCB0b3RhbCk7XG4gICAgb25Qcm9ncmVzcyhkb25lLCB0b3RhbCwgYEV4cG9ydGluZyAoJHtkb25lfS8ke3RvdGFsfSkuLi5gKTtcbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkIHRoZSBpbWFnZS1tYXAuanNvbiBmcm9tIGV4cG9ydCB0YXNrcyBhbmQgc2VjdGlvbiBkYXRhLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRJbWFnZU1hcChcbiAgdGFza3M6IEltYWdlRXhwb3J0VGFza1tdLFxuICBzZWN0aW9uczogeyBuYW1lOiBzdHJpbmc7IGNoaWxkcmVuOiBTY2VuZU5vZGVbXSB9W11cbik6IEltYWdlTWFwIHtcbiAgY29uc3QgaW1hZ2VzOiBSZWNvcmQ8c3RyaW5nLCBJbWFnZU1hcEVudHJ5PiA9IHt9O1xuICBjb25zdCBieVNlY3Rpb25NYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHt9O1xuXG4gIGNvbnN0IGFzc2V0VGFza3MgPSB0YXNrcy5maWx0ZXIodCA9PiB0LnR5cGUgPT09ICdhc3NldCcpO1xuXG4gIGZvciAoY29uc3QgdGFzayBvZiBhc3NldFRhc2tzKSB7XG4gICAgaW1hZ2VzW3Rhc2suZmlsZW5hbWVdID0ge1xuICAgICAgZmlsZTogdGFzay5maWxlbmFtZSxcbiAgICAgIGV4dDogdGFzay5mb3JtYXQudG9Mb3dlckNhc2UoKSxcbiAgICAgIG5vZGVOYW1lczogW3Rhc2subm9kZU5hbWVdLFxuICAgICAgcmVhZGFibGVOYW1lOiB0YXNrLmZpbGVuYW1lLFxuICAgICAgZGltZW5zaW9uczogbnVsbCxcbiAgICAgIHVzZWRJblNlY3Rpb25zOiBbXSxcbiAgICB9O1xuICB9XG5cbiAgZm9yIChjb25zdCBzZWN0aW9uIG9mIHNlY3Rpb25zKSB7XG4gICAgY29uc3Qgc2VjdGlvbkltYWdlczogc3RyaW5nW10gPSBbXTtcbiAgICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgICAgaWYgKGhhc0ltYWdlRmlsbChub2RlIGFzIGFueSkpIHtcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBgJHtzbHVnaWZ5KG5vZGUubmFtZSl9LnBuZ2A7XG4gICAgICAgIHNlY3Rpb25JbWFnZXMucHVzaChmaWxlbmFtZSk7XG4gICAgICAgIGlmIChpbWFnZXNbZmlsZW5hbWVdKSB7XG4gICAgICAgICAgaW1hZ2VzW2ZpbGVuYW1lXS51c2VkSW5TZWN0aW9ucy5wdXNoKHNlY3Rpb24ubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBzZWN0aW9uLmNoaWxkcmVuKSB7XG4gICAgICB3YWxrKGNoaWxkKTtcbiAgICB9XG4gICAgYnlTZWN0aW9uTWFwW3NlY3Rpb24ubmFtZV0gPSBzZWN0aW9uSW1hZ2VzO1xuICB9XG5cbiAgcmV0dXJuIHsgaW1hZ2VzLCBieV9zZWN0aW9uOiBieVNlY3Rpb25NYXAgfTtcbn1cbiIsICJpbXBvcnQgeyBGaWdtYVZhcmlhYmxlc0V4cG9ydCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgcmdiVG9IZXggfSBmcm9tICcuL2NvbG9yJztcblxuLyoqXG4gKiBFeHRyYWN0IEZpZ21hIFZhcmlhYmxlcyAoZGVzaWduIHRva2VucykgZnJvbSB0aGUgY3VycmVudCBmaWxlLlxuICpcbiAqIFdoZW4gYSBkZXNpZ25lciBoYXMgc2V0IHVwIEZpZ21hIFZhcmlhYmxlcyAoY29sb3JzLCBudW1iZXJzLCBzdHJpbmdzLFxuICogYm9vbGVhbnMpIHRoZSB2YXJpYWJsZSBuYW1lcyBBUkUgdGhlIGRlc2lnbiB0b2tlbnMgdGhlIGRldmVsb3BlciBzaG91bGRcbiAqIHVzZS4gV2UgZXhwb3J0IHRoZW0gZ3JvdXBlZCBieSBjb2xsZWN0aW9uIGFuZCBmbGF0IGJ5IGZ1bGwgbmFtZSBzb1xuICogYWdlbnRzIGNhbiBlbWl0IGAtLWNsci1wcmltYXJ5YCBpbnN0ZWFkIG9mIGAtLWNsci0xYzFjMWNgLlxuICpcbiAqIFJldHVybnMgYHsgcHJlc2VudDogZmFsc2UgfWAgd2hlbiB0aGUgRmlnbWEgVmFyaWFibGVzIEFQSSBpcyB1bmF2YWlsYWJsZVxuICogb3Igbm8gdmFyaWFibGVzIGV4aXN0LiBBZ2VudHMgZmFsbCBiYWNrIHRvIGF1dG8tZ2VuZXJhdGVkIG5hbWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFZhcmlhYmxlcygpOiBGaWdtYVZhcmlhYmxlc0V4cG9ydCB7XG4gIGNvbnN0IG91dDogRmlnbWFWYXJpYWJsZXNFeHBvcnQgPSB7XG4gICAgY29sbGVjdGlvbnM6IHt9LFxuICAgIGZsYXQ6IHt9LFxuICAgIHByZXNlbnQ6IGZhbHNlLFxuICB9O1xuXG4gIC8vIEZlYXR1cmUtZGV0ZWN0IFx1MjAxNCBvbGRlciBGaWdtYSBjbGllbnRzIGRvbid0IGhhdmUgdmFyaWFibGVzIEFQSVxuICBpZiAoIWZpZ21hLnZhcmlhYmxlcyB8fCB0eXBlb2YgZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGxldCBjb2xsZWN0aW9uc0J5SWQ6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgdHJ5IHtcbiAgICBjb25zdCBsb2NhbENvbGxlY3Rpb25zID0gZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVDb2xsZWN0aW9ucygpO1xuICAgIGZvciAoY29uc3QgY29sIG9mIGxvY2FsQ29sbGVjdGlvbnMpIHtcbiAgICAgIGNvbGxlY3Rpb25zQnlJZFtjb2wuaWRdID0gY29sO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGxldCB2YXJpYWJsZXM6IFZhcmlhYmxlW10gPSBbXTtcbiAgdHJ5IHtcbiAgICB2YXJpYWJsZXMgPSBmaWdtYS52YXJpYWJsZXMuZ2V0TG9jYWxWYXJpYWJsZXMoKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuICBpZiAoIXZhcmlhYmxlcyB8fCB2YXJpYWJsZXMubGVuZ3RoID09PSAwKSByZXR1cm4gb3V0O1xuXG4gIG91dC5wcmVzZW50ID0gdHJ1ZTtcblxuICBmb3IgKGNvbnN0IHYgb2YgdmFyaWFibGVzKSB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zQnlJZFt2LnZhcmlhYmxlQ29sbGVjdGlvbklkXTtcbiAgICBpZiAoIWNvbGxlY3Rpb24pIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgZGVmYXVsdE1vZGVJZCA9IGNvbGxlY3Rpb24uZGVmYXVsdE1vZGVJZDtcbiAgICBjb25zdCByYXcgPSB2LnZhbHVlc0J5TW9kZVtkZWZhdWx0TW9kZUlkXTtcbiAgICBpZiAocmF3ID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgbGV0IHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuO1xuICAgIGlmICh2LnJlc29sdmVkVHlwZSA9PT0gJ0NPTE9SJykge1xuICAgICAgLy8gQ09MT1IgdmFsdWVzIGFyZSBSR0JBIG9iamVjdHM7IGNvbnZlcnQgdG8gaGV4XG4gICAgICBpZiAocmF3ICYmIHR5cGVvZiByYXcgPT09ICdvYmplY3QnICYmICdyJyBpbiByYXcpIHtcbiAgICAgICAgdmFsdWUgPSByZ2JUb0hleChyYXcgYXMgYW55KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodi5yZXNvbHZlZFR5cGUgPT09ICdGTE9BVCcpIHtcbiAgICAgIHZhbHVlID0gdHlwZW9mIHJhdyA9PT0gJ251bWJlcicgPyByYXcgOiBOdW1iZXIocmF3KTtcbiAgICB9IGVsc2UgaWYgKHYucmVzb2x2ZWRUeXBlID09PSAnU1RSSU5HJykge1xuICAgICAgdmFsdWUgPSB0eXBlb2YgcmF3ID09PSAnc3RyaW5nJyA/IHJhdyA6IFN0cmluZyhyYXcpO1xuICAgIH0gZWxzZSBpZiAodi5yZXNvbHZlZFR5cGUgPT09ICdCT09MRUFOJykge1xuICAgICAgdmFsdWUgPSBCb29sZWFuKHJhdyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gY29sbGVjdGlvbi5uYW1lIHx8ICdEZWZhdWx0JztcbiAgICBpZiAoIW91dC5jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV0pIG91dC5jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV0gPSB7fTtcbiAgICBvdXQuY29sbGVjdGlvbnNbY29sbGVjdGlvbk5hbWVdW3YubmFtZV0gPSB2YWx1ZTtcblxuICAgIC8vIEZsYXQga2V5OiBcIjxjb2xsZWN0aW9uPi88dmFyaWFibGUtbmFtZT5cIiBzbyBkdXBsaWNhdGVzIGFjcm9zcyBjb2xsZWN0aW9ucyBkb24ndCBjb2xsaWRlXG4gICAgY29uc3QgZmxhdEtleSA9IGAke2NvbGxlY3Rpb25OYW1lfS8ke3YubmFtZX1gO1xuICAgIG91dC5mbGF0W2ZsYXRLZXldID0gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIEZpZ21hIHZhcmlhYmxlIG5hbWUgdG8gYSBDU1MgY3VzdG9tIHByb3BlcnR5IG5hbWUuXG4gKiAgIFwiQ29sb3JzL1ByaW1hcnlcIiBcdTIxOTIgXCItLWNsci1wcmltYXJ5XCJcbiAqICAgXCJTcGFjaW5nL21kXCIgXHUyMTkyIFwiLS1zcGFjZS1tZFwiXG4gKiAgIFwiUmFkaXVzL2xnXCIgXHUyMTkyIFwiLS1yYWRpdXMtbGdcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9Dc3NDdXN0b21Qcm9wZXJ0eSh2YXJpYWJsZU5hbWU6IHN0cmluZywgY29sbGVjdGlvbk5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNvbCA9IGNvbGxlY3Rpb25OYW1lLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IG5hbWUgPSB2YXJpYWJsZU5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtejAtOV0rL2csICctJykucmVwbGFjZSgvLSsvZywgJy0nKS5yZXBsYWNlKC9eLXwtJC9nLCAnJyk7XG5cbiAgaWYgKGNvbC5pbmNsdWRlcygnY29sb3InKSB8fCBjb2wuaW5jbHVkZXMoJ2NvbG91cicpKSByZXR1cm4gYC0tY2xyLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdzcGFjJykpIHJldHVybiBgLS1zcGFjZS0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygncmFkaXVzJykpIHJldHVybiBgLS1yYWRpdXMtJHtuYW1lfWA7XG4gIGlmIChjb2wuaW5jbHVkZXMoJ2ZvbnQnKSAmJiBjb2wuaW5jbHVkZXMoJ3NpemUnKSkgcmV0dXJuIGAtLWZzLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdmb250JykgJiYgY29sLmluY2x1ZGVzKCd3ZWlnaHQnKSkgcmV0dXJuIGAtLWZ3LSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdmb250JykgfHwgY29sLmluY2x1ZGVzKCdmYW1pbHknKSkgcmV0dXJuIGAtLWZmLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdsaW5lJykpIHJldHVybiBgLS1saC0ke25hbWV9YDtcbiAgcmV0dXJuIGAtLSR7Y29sLnJlcGxhY2UoL1teYS16MC05XSsvZywgJy0nKX0tJHtuYW1lfWA7XG59XG4iLCAiaW1wb3J0IHtcbiAgU2VjdGlvblNwZWNzLCBEZXNpZ25Ub2tlbnMsIEV4cG9ydE1hbmlmZXN0LCBFeHBvcnRNYW5pZmVzdFBhZ2UsXG4gIFJlc3BvbnNpdmVQYWlyLCBSZXNwb25zaXZlTWFwLCBQYWdlVG9rZW5zLCBJbWFnZU1hcCwgRm9udFRva2VuSW5mbyxcbiAgUmVzcG9uc2l2ZU92ZXJyaWRlLCBTZWN0aW9uU3BlYyxcbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBzbHVnaWZ5LCB0b0xheW91dE5hbWUgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGNvbGxlY3RDb2xvcnMgfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IGNvbGxlY3RGb250cywgY291bnRUZXh0Tm9kZXMgfSBmcm9tICcuL3R5cG9ncmFwaHknO1xuaW1wb3J0IHsgY29sbGVjdFNwYWNpbmcgfSBmcm9tICcuL3NwYWNpbmcnO1xuaW1wb3J0IHsgcGFyc2VTZWN0aW9ucyB9IGZyb20gJy4vc2VjdGlvbi1wYXJzZXInO1xuaW1wb3J0IHsgbWF0Y2hSZXNwb25zaXZlRnJhbWVzIH0gZnJvbSAnLi9yZXNwb25zaXZlJztcbmltcG9ydCB7IGJ1aWxkRXhwb3J0VGFza3MsIGV4ZWN1dGVCYXRjaEV4cG9ydCwgYnVpbGRJbWFnZU1hcCB9IGZyb20gJy4vaW1hZ2UtZXhwb3J0ZXInO1xuaW1wb3J0IHsgZXh0cmFjdFZhcmlhYmxlcyB9IGZyb20gJy4vdmFyaWFibGVzJztcblxuLyoqXG4gKiBNYXN0ZXIgZXh0cmFjdGlvbiBvcmNoZXN0cmF0b3IuXG4gKiBDb29yZGluYXRlcyBhbGwgbW9kdWxlcyBmb3IgdGhlIHNlbGVjdGVkIGZyYW1lcyBhbmQgc2VuZHMgcmVzdWx0cyB0byBVSS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkV4dHJhY3Rpb24oXG4gIGZyYW1lSWRzOiBzdHJpbmdbXSxcbiAgcmVzcG9uc2l2ZVBhaXJzOiBSZXNwb25zaXZlUGFpcltdLFxuICBzZW5kTWVzc2FnZTogKG1zZzogYW55KSA9PiB2b2lkLFxuICBzaG91bGRDYW5jZWw6ICgpID0+IGJvb2xlYW4sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgYWxsRGVzaWduVG9rZW5Db2xvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgY29uc3QgYWxsRGVzaWduVG9rZW5Gb250czogUmVjb3JkPHN0cmluZywgRm9udFRva2VuSW5mbz4gPSB7fTtcbiAgY29uc3QgYWxsU3BhY2luZ1ZhbHVlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBjb25zdCBtYW5pZmVzdFBhZ2VzOiBFeHBvcnRNYW5pZmVzdFBhZ2VbXSA9IFtdO1xuICBsZXQgdG90YWxTZWN0aW9ucyA9IDA7XG4gIGxldCB0b3RhbEltYWdlcyA9IDA7XG5cbiAgLy8gUHJvY2VzcyBlYWNoIHJlc3BvbnNpdmUgcGFpciAoZWFjaCA9IG9uZSBwYWdlKVxuICBmb3IgKGNvbnN0IHBhaXIgb2YgcmVzcG9uc2l2ZVBhaXJzKSB7XG4gICAgaWYgKHNob3VsZENhbmNlbCgpKSByZXR1cm47XG5cbiAgICBjb25zdCBkZXNrdG9wTm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKHBhaXIuZGVza3RvcC5mcmFtZUlkKTtcbiAgICBpZiAoIWRlc2t0b3BOb2RlIHx8IGRlc2t0b3BOb2RlLnR5cGUgIT09ICdGUkFNRScpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGRlc2t0b3BGcmFtZSA9IGRlc2t0b3BOb2RlIGFzIEZyYW1lTm9kZTtcblxuICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6ICdFWFBPUlRfUFJPR1JFU1MnLFxuICAgICAgY3VycmVudDogMCxcbiAgICAgIHRvdGFsOiAxMDAsXG4gICAgICBsYWJlbDogYEV4dHJhY3RpbmcgXCIke3BhaXIucGFnZU5hbWV9XCIuLi5gLFxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFBhcnNlIHNlY3Rpb25zIGZyb20gZGVza3RvcCBmcmFtZSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBzZWN0aW9ucyA9IHBhcnNlU2VjdGlvbnMoZGVza3RvcEZyYW1lKTtcbiAgICBjb25zdCBzZWN0aW9uQ291bnQgPSBPYmplY3Qua2V5cyhzZWN0aW9ucykubGVuZ3RoO1xuICAgIHRvdGFsU2VjdGlvbnMgKz0gc2VjdGlvbkNvdW50O1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1lcmdlIHJlc3BvbnNpdmUgb3ZlcnJpZGVzIGZyb20gbW9iaWxlIGZyYW1lIFx1MjUwMFx1MjUwMFxuICAgIGlmIChwYWlyLm1vYmlsZSkge1xuICAgICAgY29uc3QgbW9iaWxlTm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKHBhaXIubW9iaWxlLmZyYW1lSWQpO1xuICAgICAgaWYgKG1vYmlsZU5vZGUgJiYgbW9iaWxlTm9kZS50eXBlID09PSAnRlJBTUUnKSB7XG4gICAgICAgIGNvbnN0IG1vYmlsZUZyYW1lID0gbW9iaWxlTm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICAgIGNvbnN0IG1vYmlsZVNlY3Rpb25zID0gcGFyc2VTZWN0aW9ucyhtb2JpbGVGcmFtZSk7XG4gICAgICAgIG1lcmdlUmVzcG9uc2l2ZURhdGEoc2VjdGlvbnMsIG1vYmlsZVNlY3Rpb25zLCBwYWlyLm1vYmlsZS53aWR0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIHNlY3Rpb24tc3BlY3MuanNvbiBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBzZWN0aW9uU3BlY3M6IFNlY3Rpb25TcGVjcyA9IHtcbiAgICAgIGZpZ21hX2NhbnZhc193aWR0aDogTWF0aC5yb3VuZChkZXNrdG9wRnJhbWUud2lkdGgpLFxuICAgICAgZmlnbWFfY2FudmFzX2hlaWdodDogTWF0aC5yb3VuZChkZXNrdG9wRnJhbWUuaGVpZ2h0KSxcbiAgICAgIG1vYmlsZV9jYW52YXNfd2lkdGg6IHBhaXIubW9iaWxlPy53aWR0aCxcbiAgICAgIHBhZ2Vfc2x1ZzogcGFpci5wYWdlU2x1ZyxcbiAgICAgIGV4dHJhY3RlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgZXh0cmFjdGlvbl9tZXRob2Q6ICdwbHVnaW4nLFxuICAgICAgc2VjdGlvbnMsXG4gICAgfTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBDb2xsZWN0IHRva2VucyBmb3IgdGhpcyBwYWdlIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGNvbG9ycyA9IGNvbGxlY3RDb2xvcnMoZGVza3RvcEZyYW1lKTtcbiAgICBjb25zdCBmb250cyA9IGNvbGxlY3RGb250cyhkZXNrdG9wRnJhbWUpO1xuICAgIGNvbnN0IHNwYWNpbmcgPSBjb2xsZWN0U3BhY2luZyhkZXNrdG9wRnJhbWUpO1xuXG4gICAgLy8gQnVpbGQgcGFnZSB0b2tlbnNcbiAgICBjb25zdCBwYWdlVG9rZW5zOiBQYWdlVG9rZW5zID0ge1xuICAgICAgY29sb3JzLFxuICAgICAgZm9udHM6IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgT2JqZWN0LmVudHJpZXMoZm9udHMpLm1hcCgoW2ZhbWlseSwgZGF0YV0pID0+IFtmYW1pbHksIHtcbiAgICAgICAgICBzdHlsZXM6IFsuLi5kYXRhLnN0eWxlc10sXG4gICAgICAgICAgc2l6ZXM6IFsuLi5kYXRhLnNpemVzXS5zb3J0KChhLCBiKSA9PiBhIC0gYiksXG4gICAgICAgICAgY291bnQ6IGRhdGEuY291bnQsXG4gICAgICAgIH1dKVxuICAgICAgKSxcbiAgICAgIHNwYWNpbmcsXG4gICAgICBzZWN0aW9uczogYnVpbGRUb2tlblNlY3Rpb25zKGRlc2t0b3BGcmFtZSwgcGFpci5wYWdlU2x1ZyksXG4gICAgfTtcblxuICAgIC8vIE1lcmdlIGludG8gZ2xvYmFsIHRva2Vuc1xuICAgIGZvciAoY29uc3QgW2hleCwgY291bnRdIG9mIE9iamVjdC5lbnRyaWVzKGNvbG9ycykpIHtcbiAgICAgIGlmIChjb3VudCA+PSAyKSB7XG4gICAgICAgIGNvbnN0IHZhck5hbWUgPSBgLS1jbHItJHtoZXguc2xpY2UoMSkudG9Mb3dlckNhc2UoKX1gO1xuICAgICAgICBhbGxEZXNpZ25Ub2tlbkNvbG9yc1t2YXJOYW1lXSA9IGhleDtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBbZmFtaWx5LCBkYXRhXSBvZiBPYmplY3QuZW50cmllcyhmb250cykpIHtcbiAgICAgIGFsbERlc2lnblRva2VuRm9udHNbZmFtaWx5XSA9IHtcbiAgICAgICAgc3R5bGVzOiBbLi4uZGF0YS5zdHlsZXNdLFxuICAgICAgICBzaXplczogWy4uLmRhdGEuc2l6ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKSxcbiAgICAgICAgY291bnQ6IGRhdGEuY291bnQsXG4gICAgICB9O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHMgb2Ygc3BhY2luZykge1xuICAgICAgYWxsU3BhY2luZ1ZhbHVlcy5hZGQocy52YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEdlbmVyYXRlIHNwZWMubWQgXHUyNTAwXHUyNTAwXG4gICAgY29uc3Qgc3BlY01kID0gZ2VuZXJhdGVTcGVjTWQocGFpci5wYWdlTmFtZSwgcGFpci5wYWdlU2x1Zywgc2VjdGlvblNwZWNzLCBwYWdlVG9rZW5zKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBTZW5kIHBhZ2UgZGF0YSB0byBVSSBcdTI1MDBcdTI1MDBcbiAgICBzZW5kTWVzc2FnZSh7XG4gICAgICB0eXBlOiAnUEFHRV9EQVRBJyxcbiAgICAgIHBhZ2VTbHVnOiBwYWlyLnBhZ2VTbHVnLFxuICAgICAgc2VjdGlvblNwZWNzLFxuICAgICAgc3BlY01kLFxuICAgICAgdG9rZW5zOiBwYWdlVG9rZW5zLFxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEV4cG9ydCBpbWFnZXMgYW5kIHNjcmVlbnNob3RzIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGV4cG9ydFRhc2tzID0gYnVpbGRFeHBvcnRUYXNrcyhkZXNrdG9wRnJhbWUsIHBhaXIucGFnZVNsdWcpO1xuICAgIGNvbnN0IGFzc2V0Q291bnQgPSBleHBvcnRUYXNrcy5maWx0ZXIodCA9PiB0LnR5cGUgPT09ICdhc3NldCcpLmxlbmd0aDtcbiAgICB0b3RhbEltYWdlcyArPSBhc3NldENvdW50O1xuXG4gICAgYXdhaXQgZXhlY3V0ZUJhdGNoRXhwb3J0KFxuICAgICAgZXhwb3J0VGFza3MsXG4gICAgICAoY3VycmVudCwgdG90YWwsIGxhYmVsKSA9PiB7XG4gICAgICAgIHNlbmRNZXNzYWdlKHsgdHlwZTogJ0VYUE9SVF9QUk9HUkVTUycsIGN1cnJlbnQsIHRvdGFsLCBsYWJlbCB9KTtcbiAgICAgIH0sXG4gICAgICAodGFzaywgZGF0YSkgPT4ge1xuICAgICAgICBpZiAodGFzay50eXBlID09PSAnc2NyZWVuc2hvdCcgfHwgdGFzay50eXBlID09PSAnZnVsbC1wYWdlJykge1xuICAgICAgICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6ICdTQ1JFRU5TSE9UX0RBVEEnLFxuICAgICAgICAgICAgcGF0aDogYCR7dGFzay5wYWdlUGF0aH0vc2NyZWVuc2hvdHNgLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHRhc2suZmlsZW5hbWUsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6ICdJTUFHRV9EQVRBJyxcbiAgICAgICAgICAgIHBhdGg6IGAke3Rhc2sucGFnZVBhdGh9L2ltYWdlc2AsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGFzay5maWxlbmFtZSxcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzaG91bGRDYW5jZWwsXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCdWlsZCBhbmQgc2VuZCBpbWFnZSBtYXAgXHUyNTAwXHUyNTAwXG4gICAgY29uc3Qgc2VjdGlvbkNoaWxkcmVuID0gZGVza3RvcEZyYW1lLmNoaWxkcmVuXG4gICAgICAuZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSlcbiAgICAgIC5tYXAoYyA9PiAoeyBuYW1lOiBjLm5hbWUsIGNoaWxkcmVuOiAnY2hpbGRyZW4nIGluIGMgPyBbLi4uKGMgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbl0gOiBbXSB9KSk7XG4gICAgY29uc3QgaW1hZ2VNYXAgPSBidWlsZEltYWdlTWFwKGV4cG9ydFRhc2tzLCBzZWN0aW9uQ2hpbGRyZW4pO1xuICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgIHR5cGU6ICdJTUFHRV9NQVBfREFUQScsXG4gICAgICBwYXRoOiBgcGFnZXMvJHtwYWlyLnBhZ2VTbHVnfS9pbWFnZXNgLFxuICAgICAgaW1hZ2VNYXAsXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQnVpbGQgbWFuaWZlc3QgcGFnZSBlbnRyeSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBoYXNGdWxsUGFnZSA9IGV4cG9ydFRhc2tzLnNvbWUodCA9PiB0LnR5cGUgPT09ICdmdWxsLXBhZ2UnKTtcbiAgICBtYW5pZmVzdFBhZ2VzLnB1c2goe1xuICAgICAgc2x1ZzogcGFpci5wYWdlU2x1ZyxcbiAgICAgIGZyYW1lTmFtZTogcGFpci5kZXNrdG9wLmZyYW1lTmFtZSxcbiAgICAgIGZyYW1lSWQ6IHBhaXIuZGVza3RvcC5mcmFtZUlkLFxuICAgICAgY2FudmFzV2lkdGg6IE1hdGgucm91bmQoZGVza3RvcEZyYW1lLndpZHRoKSxcbiAgICAgIGNhbnZhc0hlaWdodDogTWF0aC5yb3VuZChkZXNrdG9wRnJhbWUuaGVpZ2h0KSxcbiAgICAgIHNlY3Rpb25Db3VudCxcbiAgICAgIGltYWdlQ291bnQ6IGFzc2V0Q291bnQsXG4gICAgICBoYXNSZXNwb25zaXZlOiBwYWlyLm1vYmlsZSAhPT0gbnVsbCxcbiAgICAgIG1vYmlsZUZyYW1lSWQ6IHBhaXIubW9iaWxlPy5mcmFtZUlkID8/IG51bGwsXG4gICAgICBpbnRlcmFjdGlvbkNvdW50OiBPYmplY3QudmFsdWVzKHNlY3Rpb25zKVxuICAgICAgICAucmVkdWNlKChzdW0sIHMpID0+IHN1bSArIChzLmludGVyYWN0aW9ucz8ubGVuZ3RoID8/IDApLCAwKSxcbiAgICAgIGhhc0Z1bGxQYWdlU2NyZWVuc2hvdDogaGFzRnVsbFBhZ2UsXG4gICAgICBmdWxsUGFnZVNjcmVlbnNob3RGaWxlOiBoYXNGdWxsUGFnZSA/ICdfZnVsbC1wYWdlLnBuZycgOiBudWxsLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIGZpbmFsIG1hbmlmZXN0IGFuZCBnbG9iYWwgdG9rZW5zIFx1MjUwMFx1MjUwMFxuICBjb25zdCBtYW5pZmVzdDogRXhwb3J0TWFuaWZlc3QgPSB7XG4gICAgZXhwb3J0VmVyc2lvbjogJzEuMCcsXG4gICAgZXhwb3J0RGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIGZpZ21hRmlsZU5hbWU6IGZpZ21hLnJvb3QubmFtZSxcbiAgICBmaWdtYUZpbGVLZXk6IGZpZ21hLmZpbGVLZXkgPz8gJycsXG4gICAgcGx1Z2luVmVyc2lvbjogJzEuMC4wJyxcbiAgICBwYWdlczogbWFuaWZlc3RQYWdlcyxcbiAgICB0b3RhbFNlY3Rpb25zLFxuICAgIHRvdGFsSW1hZ2VzLFxuICAgIGRlc2lnblRva2Vuc1N1bW1hcnk6IHtcbiAgICAgIGNvbG9yQ291bnQ6IE9iamVjdC5rZXlzKGFsbERlc2lnblRva2VuQ29sb3JzKS5sZW5ndGgsXG4gICAgICBmb250Q291bnQ6IE9iamVjdC5rZXlzKGFsbERlc2lnblRva2VuRm9udHMpLmxlbmd0aCxcbiAgICAgIHNwYWNpbmdWYWx1ZXM6IGFsbFNwYWNpbmdWYWx1ZXMuc2l6ZSxcbiAgICB9LFxuICB9O1xuXG4gIC8vIEZpZ21hIFZhcmlhYmxlcyAoYXV0aG9yaXRhdGl2ZSB0b2tlbiBuYW1lcyB3aGVuIGF2YWlsYWJsZSlcbiAgY29uc3QgdmFyaWFibGVzID0gZXh0cmFjdFZhcmlhYmxlcygpO1xuXG4gIGNvbnN0IGRlc2lnblRva2VuczogRGVzaWduVG9rZW5zID0ge1xuICAgIGNvbG9yczogYWxsRGVzaWduVG9rZW5Db2xvcnMsXG4gICAgZm9udHM6IGFsbERlc2lnblRva2VuRm9udHMsXG4gICAgc3BhY2luZzogWy4uLmFsbFNwYWNpbmdWYWx1ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKSxcbiAgICB2YXJpYWJsZXM6IHZhcmlhYmxlcy5wcmVzZW50ID8gdmFyaWFibGVzIDogdW5kZWZpbmVkLFxuICB9O1xuXG4gIC8vIFdoZW4gRmlnbWEgVmFyaWFibGVzIGFyZSBhdmFpbGFibGUsIHByZWZlciB2YXJpYWJsZSBuYW1lcyBmb3IgY29sb3JzOlxuICAvLyBvdmVyd3JpdGUgdGhlIGF1dG8tZ2VuZXJhdGVkIC0tY2xyLTxoZXg+IHdpdGggLS1jbHItPHZhcmlhYmxlLW5hbWU+XG4gIGlmICh2YXJpYWJsZXMucHJlc2VudCkge1xuICAgIGZvciAoY29uc3QgW2NvbE5hbWUsIHZhcnNdIG9mIE9iamVjdC5lbnRyaWVzKHZhcmlhYmxlcy5jb2xsZWN0aW9ucykpIHtcbiAgICAgIGlmICghY29sTmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjb2xvcicpKSBjb250aW51ZTtcbiAgICAgIGZvciAoY29uc3QgW3Zhck5hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh2YXJzKSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAhdmFsdWUuc3RhcnRzV2l0aCgnIycpKSBjb250aW51ZTtcbiAgICAgICAgY29uc3Qgc2FmZU5hbWUgPSB2YXJOYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXowLTldKy9nLCAnLScpLnJlcGxhY2UoLy0rL2csICctJykucmVwbGFjZSgvXi18LSQvZywgJycpO1xuICAgICAgICBjb25zdCBjc3NWYXIgPSBgLS1jbHItJHtzYWZlTmFtZX1gO1xuICAgICAgICBhbGxEZXNpZ25Ub2tlbkNvbG9yc1tjc3NWYXJdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIGRlc2lnblRva2Vucy5jb2xvcnMgPSBhbGxEZXNpZ25Ub2tlbkNvbG9ycztcbiAgfVxuXG4gIC8vIEJ1aWxkIHJlc3BvbnNpdmUgbWFwIGZyb20gdGhlIHBhaXJzXG4gIGNvbnN0IHJlc3BvbnNpdmVNYXAgPSBtYXRjaFJlc3BvbnNpdmVGcmFtZXMoXG4gICAgcmVzcG9uc2l2ZVBhaXJzLmZsYXRNYXAocCA9PiB7XG4gICAgICBjb25zdCBmcmFtZXMgPSBbe1xuICAgICAgICBpZDogcC5kZXNrdG9wLmZyYW1lSWQsXG4gICAgICAgIG5hbWU6IHAuZGVza3RvcC5mcmFtZU5hbWUsXG4gICAgICAgIHdpZHRoOiBwLmRlc2t0b3Aud2lkdGgsXG4gICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgYnJlYWtwb2ludDogJ2Rlc2t0b3AnIGFzIGNvbnN0LFxuICAgICAgICBzZWN0aW9uQ291bnQ6IDAsXG4gICAgICAgIGhhc0F1dG9MYXlvdXQ6IGZhbHNlLFxuICAgICAgICByZXNwb25zaXZlUGFpcklkOiBudWxsLFxuICAgICAgfV07XG4gICAgICBpZiAocC5tb2JpbGUpIHtcbiAgICAgICAgZnJhbWVzLnB1c2goe1xuICAgICAgICAgIGlkOiBwLm1vYmlsZS5mcmFtZUlkLFxuICAgICAgICAgIG5hbWU6IHAubW9iaWxlLmZyYW1lTmFtZSxcbiAgICAgICAgICB3aWR0aDogcC5tb2JpbGUud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICAgIGJyZWFrcG9pbnQ6ICdtb2JpbGUnIGFzIGNvbnN0LFxuICAgICAgICAgIHNlY3Rpb25Db3VudDogMCxcbiAgICAgICAgICBoYXNBdXRvTGF5b3V0OiBmYWxzZSxcbiAgICAgICAgICByZXNwb25zaXZlUGFpcklkOiBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmcmFtZXM7XG4gICAgfSlcbiAgKTtcblxuICBzZW5kTWVzc2FnZSh7XG4gICAgdHlwZTogJ0VYUE9SVF9DT01QTEVURScsXG4gICAgbWFuaWZlc3QsXG4gICAgcmVzcG9uc2l2ZU1hcCxcbiAgICBkZXNpZ25Ub2tlbnMsXG4gIH0pO1xufVxuXG4vKipcbiAqIE1lcmdlIHJlc3BvbnNpdmUgb3ZlcnJpZGVzIGZyb20gbW9iaWxlIHNlY3Rpb25zIGludG8gZGVza3RvcCBzZWN0aW9ucy5cbiAqIE9ubHkgaW5jbHVkZXMgcHJvcGVydGllcyB0aGF0IGRpZmZlciBiZXR3ZWVuIGRlc2t0b3AgYW5kIG1vYmlsZS5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VSZXNwb25zaXZlRGF0YShcbiAgZGVza3RvcFNlY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4sXG4gIG1vYmlsZVNlY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4sXG4gIG1vYmlsZVdpZHRoOiBudW1iZXIsXG4pOiB2b2lkIHtcbiAgY29uc3QgYnBLZXkgPSBTdHJpbmcobW9iaWxlV2lkdGgpO1xuXG4gIGZvciAoY29uc3QgW2xheW91dE5hbWUsIGRlc2t0b3BTcGVjXSBvZiBPYmplY3QuZW50cmllcyhkZXNrdG9wU2VjdGlvbnMpKSB7XG4gICAgY29uc3QgbW9iaWxlU3BlYyA9IG1vYmlsZVNlY3Rpb25zW2xheW91dE5hbWVdO1xuICAgIGlmICghbW9iaWxlU3BlYykgY29udGludWU7XG5cbiAgICBjb25zdCBvdmVycmlkZTogUmVzcG9uc2l2ZU92ZXJyaWRlID0ge307XG5cbiAgICAvLyBEaWZmIHNlY3Rpb24gc3R5bGVzXG4gICAgY29uc3Qgc2VjdGlvbkRpZmY6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGRlc2t0b3BWYWxdIG9mIE9iamVjdC5lbnRyaWVzKGRlc2t0b3BTcGVjLnNlY3Rpb24pKSB7XG4gICAgICBjb25zdCBtb2JpbGVWYWwgPSAobW9iaWxlU3BlYy5zZWN0aW9uIGFzIGFueSlba2V5XTtcbiAgICAgIGlmIChtb2JpbGVWYWwgJiYgbW9iaWxlVmFsICE9PSBkZXNrdG9wVmFsKSB7XG4gICAgICAgIHNlY3Rpb25EaWZmW2tleV0gPSBtb2JpbGVWYWw7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChPYmplY3Qua2V5cyhzZWN0aW9uRGlmZikubGVuZ3RoID4gMCkge1xuICAgICAgb3ZlcnJpZGUuc2VjdGlvbiA9IHNlY3Rpb25EaWZmO1xuICAgIH1cblxuICAgIC8vIERpZmYgZWxlbWVudCBzdHlsZXNcbiAgICBjb25zdCBlbGVtZW50c0RpZmY6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIGFueT4+ID0ge307XG4gICAgZm9yIChjb25zdCBbZWxlbU5hbWUsIGRlc2t0b3BFbGVtXSBvZiBPYmplY3QuZW50cmllcyhkZXNrdG9wU3BlYy5lbGVtZW50cykpIHtcbiAgICAgIGNvbnN0IG1vYmlsZUVsZW0gPSBtb2JpbGVTcGVjLmVsZW1lbnRzW2VsZW1OYW1lXTtcbiAgICAgIGlmICghbW9iaWxlRWxlbSkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IGRpZmY6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgZGVza3RvcFZhbF0gb2YgT2JqZWN0LmVudHJpZXMoZGVza3RvcEVsZW0pKSB7XG4gICAgICAgIGNvbnN0IG1vYmlsZVZhbCA9IChtb2JpbGVFbGVtIGFzIGFueSlba2V5XTtcbiAgICAgICAgaWYgKG1vYmlsZVZhbCAhPT0gdW5kZWZpbmVkICYmIG1vYmlsZVZhbCAhPT0gZGVza3RvcFZhbCkge1xuICAgICAgICAgIGRpZmZba2V5XSA9IG1vYmlsZVZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKE9iamVjdC5rZXlzKGRpZmYpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZWxlbWVudHNEaWZmW2VsZW1OYW1lXSA9IGRpZmY7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChPYmplY3Qua2V5cyhlbGVtZW50c0RpZmYpLmxlbmd0aCA+IDApIHtcbiAgICAgIG92ZXJyaWRlLmVsZW1lbnRzID0gZWxlbWVudHNEaWZmO1xuICAgIH1cblxuICAgIC8vIERpZmYgZ3JpZFxuICAgIGlmIChtb2JpbGVTcGVjLmdyaWQuY29sdW1ucyAhPT0gZGVza3RvcFNwZWMuZ3JpZC5jb2x1bW5zIHx8IG1vYmlsZVNwZWMuZ3JpZC5nYXAgIT09IGRlc2t0b3BTcGVjLmdyaWQuZ2FwKSB7XG4gICAgICBvdmVycmlkZS5ncmlkID0ge307XG4gICAgICBpZiAobW9iaWxlU3BlYy5ncmlkLmNvbHVtbnMgIT09IGRlc2t0b3BTcGVjLmdyaWQuY29sdW1ucykge1xuICAgICAgICBvdmVycmlkZS5ncmlkLmNvbHVtbnMgPSBtb2JpbGVTcGVjLmdyaWQuY29sdW1ucztcbiAgICAgIH1cbiAgICAgIGlmIChtb2JpbGVTcGVjLmdyaWQuZ2FwICE9PSBkZXNrdG9wU3BlYy5ncmlkLmdhcCkge1xuICAgICAgICBvdmVycmlkZS5ncmlkLmdhcCA9IG1vYmlsZVNwZWMuZ3JpZC5nYXA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKE9iamVjdC5rZXlzKG92ZXJyaWRlKS5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAoIWRlc2t0b3BTcGVjLnJlc3BvbnNpdmUpIGRlc2t0b3BTcGVjLnJlc3BvbnNpdmUgPSB7fTtcbiAgICAgIGRlc2t0b3BTcGVjLnJlc3BvbnNpdmVbYnBLZXldID0gb3ZlcnJpZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGQgdG9rZW4gc2VjdGlvbiBtZXRhZGF0YSBmb3IgdG9rZW5zLmpzb24uXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkVG9rZW5TZWN0aW9ucyhmcmFtZTogRnJhbWVOb2RlLCBwYWdlU2x1Zzogc3RyaW5nKSB7XG4gIGNvbnN0IHNlY3Rpb25zID0gZnJhbWUuY2hpbGRyZW5cbiAgICAuZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94XG4gICAgKVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIHJldHVybiBzZWN0aW9ucy5tYXAoKHMsIGkpID0+IHtcbiAgICBjb25zdCBib3VuZHMgPSBzLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IHBhcmVudEJvdW5kcyA9IGZyYW1lLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IGltYWdlQ291bnQgPSBjb3VudEltYWdlcyhzKTtcbiAgICBjb25zdCB0ZXh0Tm9kZXMgPSBjb3VudFRleHROb2RlcyhzKTtcblxuICAgIHJldHVybiB7XG4gICAgICBpbmRleDogaSArIDEsXG4gICAgICBuYW1lOiBzLm5hbWUsXG4gICAgICBpZDogcy5pZCxcbiAgICAgIGRpbWVuc2lvbnM6IHsgd2lkdGg6IE1hdGgucm91bmQoYm91bmRzLndpZHRoKSwgaGVpZ2h0OiBNYXRoLnJvdW5kKGJvdW5kcy5oZWlnaHQpIH0sXG4gICAgICB5X29mZnNldDogTWF0aC5yb3VuZChib3VuZHMueSAtIHBhcmVudEJvdW5kcy55KSxcbiAgICAgIGhhc0F1dG9MYXlvdXQ6IHMudHlwZSA9PT0gJ0ZSQU1FJyAmJiAocyBhcyBGcmFtZU5vZGUpLmxheW91dE1vZGUgIT09IHVuZGVmaW5lZCAmJiAocyBhcyBGcmFtZU5vZGUpLmxheW91dE1vZGUgIT09ICdOT05FJyxcbiAgICAgIGltYWdlX2NvdW50OiBpbWFnZUNvdW50LFxuICAgICAgaW1hZ2VfZmlsZXM6IGNvbGxlY3RJbWFnZUZpbGVOYW1lcyhzKSxcbiAgICAgIHRleHRfbm9kZXM6IHRleHROb2RlcyxcbiAgICAgIHNjcmVlbnNob3Q6IGBzY3JlZW5zaG90cy8ke3NsdWdpZnkocy5uYW1lKX0ucG5nYCxcbiAgICAgIHNjcmVlbnNob3RfY29tcGxldGU6IHRydWUsXG4gICAgfTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvdW50SW1hZ2VzKG5vZGU6IFNjZW5lTm9kZSk6IG51bWJlciB7XG4gIGxldCBjb3VudCA9IDA7XG4gIGZ1bmN0aW9uIHdhbGsobjogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdmaWxscycgaW4gbiAmJiBBcnJheS5pc0FycmF5KChuIGFzIGFueSkuZmlsbHMpKSB7XG4gICAgICBpZiAoKG4gYXMgYW55KS5maWxscy5zb21lKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpKSBjb3VudCsrO1xuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoY2hpbGQpO1xuICAgIH1cbiAgfVxuICB3YWxrKG5vZGUpO1xuICByZXR1cm4gY291bnQ7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RJbWFnZUZpbGVOYW1lcyhub2RlOiBTY2VuZU5vZGUpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IG5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBmdW5jdGlvbiB3YWxrKG46IFNjZW5lTm9kZSkge1xuICAgIGlmICgnZmlsbHMnIGluIG4gJiYgQXJyYXkuaXNBcnJheSgobiBhcyBhbnkpLmZpbGxzKSkge1xuICAgICAgaWYgKChuIGFzIGFueSkuZmlsbHMuc29tZSgoZjogUGFpbnQpID0+IGYudHlwZSA9PT0gJ0lNQUdFJyAmJiBmLnZpc2libGUgIT09IGZhbHNlKSkge1xuICAgICAgICBuYW1lcy5wdXNoKGAke3NsdWdpZnkobi5uYW1lKX0ucG5nYCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG4pIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG4gYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikgd2FsayhjaGlsZCk7XG4gICAgfVxuICB9XG4gIHdhbGsobm9kZSk7XG4gIHJldHVybiBuYW1lcztcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBhIGh1bWFuLXJlYWRhYmxlIHNwZWMubWQgZnJvbSBleHRyYWN0ZWQgZGF0YS5cbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVTcGVjTWQocGFnZU5hbWU6IHN0cmluZywgcGFnZVNsdWc6IHN0cmluZywgc3BlY3M6IFNlY3Rpb25TcGVjcywgdG9rZW5zOiBQYWdlVG9rZW5zKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG4gIGxpbmVzLnB1c2goYCMgRGVzaWduIFNwZWMgXHUyMDE0ICR7cGFnZU5hbWV9YCk7XG4gIGxpbmVzLnB1c2goYCMjIFNvdXJjZTogRmlnbWEgUGx1Z2luIEV4cG9ydGApO1xuICBsaW5lcy5wdXNoKGAjIyBHZW5lcmF0ZWQ6ICR7c3BlY3MuZXh0cmFjdGVkX2F0fWApO1xuICBsaW5lcy5wdXNoKCcnKTtcbiAgbGluZXMucHVzaCgnIyMgUGFnZSBNZXRhZGF0YScpO1xuICBsaW5lcy5wdXNoKGAtIFBhZ2UgTmFtZTogJHtwYWdlTmFtZX1gKTtcbiAgbGluZXMucHVzaChgLSBDYW52YXMgV2lkdGg6ICR7c3BlY3MuZmlnbWFfY2FudmFzX3dpZHRofXB4YCk7XG4gIGxpbmVzLnB1c2goYC0gU2VjdGlvbiBDb3VudDogJHtPYmplY3Qua2V5cyhzcGVjcy5zZWN0aW9ucykubGVuZ3RofWApO1xuICBpZiAoc3BlY3MubW9iaWxlX2NhbnZhc193aWR0aCkge1xuICAgIGxpbmVzLnB1c2goYC0gTW9iaWxlIENhbnZhcyBXaWR0aDogJHtzcGVjcy5tb2JpbGVfY2FudmFzX3dpZHRofXB4YCk7XG4gIH1cbiAgbGluZXMucHVzaCgnJyk7XG5cbiAgLy8gQ29sb3JzXG4gIGxpbmVzLnB1c2goJyMjIENvbG9ycyBVc2VkJyk7XG4gIGxpbmVzLnB1c2goJ3wgSEVYIHwgVXNhZ2UgQ291bnQgfCcpO1xuICBsaW5lcy5wdXNoKCd8LS0tLS18LS0tLS0tLS0tLS0tfCcpO1xuICBjb25zdCBzb3J0ZWRDb2xvcnMgPSBPYmplY3QuZW50cmllcyh0b2tlbnMuY29sb3JzKS5zb3J0KChhLCBiKSA9PiBiWzFdIC0gYVsxXSk7XG4gIGZvciAoY29uc3QgW2hleCwgY291bnRdIG9mIHNvcnRlZENvbG9ycy5zbGljZSgwLCAyMCkpIHtcbiAgICBsaW5lcy5wdXNoKGB8ICR7aGV4fSB8ICR7Y291bnR9IHxgKTtcbiAgfVxuICBsaW5lcy5wdXNoKCcnKTtcblxuICAvLyBUeXBvZ3JhcGh5XG4gIGxpbmVzLnB1c2goJyMjIFR5cG9ncmFwaHkgVXNlZCcpO1xuICBsaW5lcy5wdXNoKCd8IEZvbnQgfCBTdHlsZXMgfCBTaXplcyB8Jyk7XG4gIGxpbmVzLnB1c2goJ3wtLS0tLS18LS0tLS0tLS18LS0tLS0tLXwnKTtcbiAgZm9yIChjb25zdCBbZmFtaWx5LCBpbmZvXSBvZiBPYmplY3QuZW50cmllcyh0b2tlbnMuZm9udHMpKSB7XG4gICAgbGluZXMucHVzaChgfCAke2ZhbWlseX0gfCAke2luZm8uc3R5bGVzLmpvaW4oJywgJyl9IHwgJHtpbmZvLnNpemVzLmpvaW4oJywgJyl9cHggfGApO1xuICB9XG4gIGxpbmVzLnB1c2goJycpO1xuXG4gIC8vIFNlY3Rpb25zXG4gIGxpbmVzLnB1c2goJyMjIFNlY3Rpb25zJyk7XG4gIGxpbmVzLnB1c2goJycpO1xuICBmb3IgKGNvbnN0IFtsYXlvdXROYW1lLCBzcGVjXSBvZiBPYmplY3QuZW50cmllcyhzcGVjcy5zZWN0aW9ucykpIHtcbiAgICBsaW5lcy5wdXNoKGAjIyMgJHtsYXlvdXROYW1lfWApO1xuICAgIGxpbmVzLnB1c2goYC0gKipTcGFjaW5nIFNvdXJjZSoqOiAke3NwZWMuc3BhY2luZ1NvdXJjZX1gKTtcbiAgICBsaW5lcy5wdXNoKGAtICoqQmFja2dyb3VuZCoqOiAke3NwZWMuc2VjdGlvbi5iYWNrZ3JvdW5kQ29sb3IgfHwgJ25vbmUnfWApO1xuICAgIGxpbmVzLnB1c2goYC0gKipHcmlkKio6ICR7c3BlYy5ncmlkLmxheW91dE1vZGV9LCAke3NwZWMuZ3JpZC5jb2x1bW5zfSBjb2x1bW5zLCBnYXA6ICR7c3BlYy5ncmlkLmdhcCB8fCAnbm9uZSd9YCk7XG4gICAgaWYgKHNwZWMuaW50ZXJhY3Rpb25zICYmIHNwZWMuaW50ZXJhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIGxpbmVzLnB1c2goYC0gKipJbnRlcmFjdGlvbnMqKjogJHtzcGVjLmludGVyYWN0aW9ucy5sZW5ndGh9ICgke3NwZWMuaW50ZXJhY3Rpb25zLm1hcChpID0+IGkudHJpZ2dlcikuam9pbignLCAnKX0pYCk7XG4gICAgfVxuICAgIGlmIChzcGVjLm92ZXJsYXApIHtcbiAgICAgIGxpbmVzLnB1c2goYC0gKipPdmVybGFwKio6ICR7c3BlYy5vdmVybGFwLnBpeGVsc31weCB3aXRoIFwiJHtzcGVjLm92ZXJsYXAud2l0aFNlY3Rpb259XCJgKTtcbiAgICB9XG4gICAgbGluZXMucHVzaCgnJyk7XG5cbiAgICAvLyBFbGVtZW50c1xuICAgIGZvciAoY29uc3QgW2VsZW1OYW1lLCBlbGVtU3R5bGVzXSBvZiBPYmplY3QuZW50cmllcyhzcGVjLmVsZW1lbnRzKSkge1xuICAgICAgY29uc3QgcHJvcHMgPSBPYmplY3QuZW50cmllcyhlbGVtU3R5bGVzKVxuICAgICAgICAuZmlsdGVyKChbLCB2XSkgPT4gdiAhPT0gbnVsbCAmJiB2ICE9PSB1bmRlZmluZWQpXG4gICAgICAgIC5tYXAoKFtrLCB2XSkgPT4gYCR7a306ICR7dn1gKVxuICAgICAgICAuam9pbignLCAnKTtcbiAgICAgIGxpbmVzLnB1c2goYCAgLSAqKiR7ZWxlbU5hbWV9Kio6ICR7cHJvcHN9YCk7XG4gICAgfVxuICAgIGxpbmVzLnB1c2goJycpO1xuICB9XG5cbiAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpO1xufVxuIiwgImltcG9ydCB7IFVJVG9TYW5kYm94TWVzc2FnZSB9IGZyb20gJy4vc2FuZGJveC90eXBlcyc7XG5pbXBvcnQgeyBkaXNjb3ZlclBhZ2VzIH0gZnJvbSAnLi9zYW5kYm94L2Rpc2NvdmVyeSc7XG5pbXBvcnQgeyBydW5BbGxWYWxpZGF0aW9ucyB9IGZyb20gJy4vc2FuZGJveC92YWxpZGF0b3InO1xuaW1wb3J0IHsgcnVuRXh0cmFjdGlvbiB9IGZyb20gJy4vc2FuZGJveC9leHRyYWN0b3InO1xuXG4vLyBTaG93IHRoZSBwbHVnaW4gVUlcbmZpZ21hLnNob3dVSShfX2h0bWxfXywgeyB3aWR0aDogNjQwLCBoZWlnaHQ6IDUyMCB9KTtcbmNvbnNvbGUubG9nKFwiV1AgVGhlbWUgQnVpbGRlciBFeHBvcnQ6IFBsdWdpbiBpbml0aWFsaXplZFwiKTtcblxuLy8gQ2FuY2VsbGF0aW9uIGZsYWdcbmxldCBjYW5jZWxSZXF1ZXN0ZWQgPSBmYWxzZTtcblxuLy8gSGFuZGxlIG1lc3NhZ2VzIGZyb20gVUlcbmZpZ21hLnVpLm9ubWVzc2FnZSA9IGFzeW5jIChtc2c6IFVJVG9TYW5kYm94TWVzc2FnZSkgPT4ge1xuICBjb25zb2xlLmxvZyhcIlNhbmRib3ggcmVjZWl2ZWQgbWVzc2FnZTpcIiwgbXNnLnR5cGUpO1xuXG4gIHN3aXRjaCAobXNnLnR5cGUpIHtcbiAgICBjYXNlICdESVNDT1ZFUl9QQUdFUyc6IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBhZ2VzID0gZGlzY292ZXJQYWdlcygpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIlBhZ2VzIGRpc2NvdmVyZWQ6XCIsIHBhZ2VzLmxlbmd0aCk7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ1BBR0VTX0RJU0NPVkVSRUQnLCBwYWdlcyB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRGlzY292ZXJ5IGVycm9yOlwiLCBlcnIpO1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHR5cGU6ICdFWFBPUlRfRVJST1InLCBlcnJvcjogU3RyaW5nKGVycikgfSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjYXNlICdWQUxJREFURSc6IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBydW5BbGxWYWxpZGF0aW9ucyhtc2cuZnJhbWVJZHMpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIlZhbGlkYXRpb24gY29tcGxldGU6XCIsIHJlc3VsdHMubGVuZ3RoLCBcInJlc3VsdHNcIik7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICB0eXBlOiAnVkFMSURBVElPTl9DT01QTEVURScsXG4gICAgICAgICAgcmVzdWx0cyxcbiAgICAgICAgICBmcmFtZUlkczogbXNnLmZyYW1lSWRzLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiVmFsaWRhdGlvbiBlcnJvcjpcIiwgZXJyKTtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgIHR5cGU6ICdFWFBPUlRfRVJST1InLFxuICAgICAgICAgIGVycm9yOiBgVmFsaWRhdGlvbiBmYWlsZWQ6ICR7ZXJyfWAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSAnU1RBUlRfRVhQT1JUJzoge1xuICAgICAgY2FuY2VsUmVxdWVzdGVkID0gZmFsc2U7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBydW5FeHRyYWN0aW9uKFxuICAgICAgICAgIG1zZy5mcmFtZUlkcyxcbiAgICAgICAgICBtc2cucmVzcG9uc2l2ZVBhaXJzLFxuICAgICAgICAgIChtZXNzYWdlKSA9PiBmaWdtYS51aS5wb3N0TWVzc2FnZShtZXNzYWdlKSxcbiAgICAgICAgICAoKSA9PiBjYW5jZWxSZXF1ZXN0ZWQsXG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkV4cG9ydCBlcnJvcjpcIiwgZXJyKTtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgIHR5cGU6ICdFWFBPUlRfRVJST1InLFxuICAgICAgICAgIGVycm9yOiBgRXhwb3J0IGZhaWxlZDogJHtlcnJ9YCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjYXNlICdDQU5DRUxfRVhQT1JUJzoge1xuICAgICAgY2FuY2VsUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiRXhwb3J0IGNhbmNlbGxlZCBieSB1c2VyXCIpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59O1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLTyxXQUFTLFFBQVEsTUFBc0I7QUFDNUMsV0FBTyxLQUNKLFlBQVksRUFDWixRQUFRLFNBQVMsR0FBRyxFQUNwQixRQUFRLGlCQUFpQixFQUFFLEVBQzNCLFFBQVEsUUFBUSxHQUFHLEVBQ25CLFFBQVEsT0FBTyxHQUFHLEVBQ2xCLFFBQVEsVUFBVSxFQUFFO0FBQUEsRUFDekI7QUFNTyxXQUFTLGFBQWEsTUFBc0I7QUFDakQsV0FBTyxLQUNKLFlBQVksRUFDWixRQUFRLFNBQVMsR0FBRyxFQUNwQixRQUFRLGlCQUFpQixFQUFFLEVBQzNCLFFBQVEsUUFBUSxHQUFHLEVBQ25CLFFBQVEsT0FBTyxHQUFHLEVBQ2xCLFFBQVEsVUFBVSxFQUFFO0FBQUEsRUFDekI7QUFPTyxXQUFTLFdBQVcsT0FBa0MsT0FBZSxNQUFxQjtBQUMvRixRQUFJLFVBQVUsVUFBYSxVQUFVLFFBQVEsTUFBTSxLQUFLLEVBQUcsUUFBTztBQUVsRSxVQUFNLFVBQVUsS0FBSyxNQUFNLFFBQVEsR0FBRyxJQUFJO0FBRTFDLFVBQU0sVUFBVSxPQUFPLFVBQVUsT0FBTyxJQUFJLFVBQVU7QUFDdEQsV0FBTyxHQUFHLE9BQU8sR0FBRyxJQUFJO0FBQUEsRUFDMUI7QUFhTyxXQUFTLG1CQUFtQixPQUFlLE1BQXNCO0FBQ3RFLFVBQU0sU0FBUyxPQUFPLEtBQUssRUFBRSxTQUFTLEdBQUcsR0FBRztBQUM1QyxXQUFPLEdBQUcsTUFBTSxJQUFJLFFBQVEsSUFBSSxDQUFDO0FBQUEsRUFDbkM7QUFPTyxXQUFTLG1CQUFtQixPQUFlLFFBQStCO0FBQy9FLFFBQUksQ0FBQyxTQUFTLENBQUMsT0FBUSxRQUFPO0FBQzlCLFVBQU0sTUFBTSxDQUFDLEdBQVcs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QUFRLElBQUksNkJBQTZCLElBQUksSUFBSTtBQUVqRCxnQkFBUSxJQUFJLE1BQU07QUFBQSxVQUNoQixLQUFLLGtCQUFrQjtBQUNyQixnQkFBSTtBQUNGLG9CQUFNLFFBQVEsY0FBYztBQUM1QixzQkFBUSxJQUFJLHFCQUFxQixNQUFNLE1BQU07QUFDN0Msb0JBQU0sR0FBRyxZQUFZLEVBQUUsTUFBTSxvQkFBb0IsTUFBTSxDQUFDO0FBQUEsWUFDMUQsU0FBUyxLQUFLO0FBQ1osc0JBQVEsTUFBTSxvQkFBb0IsR0FBRztBQUNyQyxvQkFBTSxHQUFHLFlBQVksRUFBRSxNQUFNLGdCQUFnQixPQUFPLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFBQSxZQUNuRTtBQUNBO0FBQUEsVUFDRjtBQUFBLFVBRUEsS0FBSyxZQUFZO0FBQ2YsZ0JBQUk7QUFDRixvQkFBTSxVQUFVLE1BQU0sa0JBQWtCLElBQUksUUFBUTtBQUNwRCxzQkFBUSxJQUFJLHdCQUF3QixRQUFRLFFBQVEsU0FBUztBQUM3RCxvQkFBTSxHQUFHLFlBQVk7QUFBQSxnQkFDbkIsTUFBTTtBQUFBLGdCQUNOO0FBQUEsZ0JBQ0EsVUFBVSxJQUFJO0FBQUEsY0FDaEIsQ0FBQztBQUFBLFlBQ0gsU0FBUyxLQUFLO0FBQ1osc0JBQVEsTUFBTSxxQkFBcUIsR0FBRztBQUN0QyxvQkFBTSxHQUFHLFlBQVk7QUFBQSxnQkFDbkIsTUFBTTtBQUFBLGdCQUNOLE9BQU8sc0JBQXNCLEdBQUc7QUFBQSxjQUNsQyxDQUFDO0FBQUEsWUFDSDtBQUNBO0FBQUEsVUFDRjtBQUFBLFVBRUEsS0FBSyxnQkFBZ0I7QUFDbkIsOEJBQWtCO0FBQ2xCLGdCQUFJO0FBQ0Ysb0JBQU07QUFBQSxnQkFDSixJQUFJO0FBQUEsZ0JBQ0osSUFBSTtBQUFBLGdCQUNKLENBQUMsWUFBWSxNQUFNLEdBQUcsWUFBWSxPQUFPO0FBQUEsZ0JBQ3pDLE1BQU07QUFBQSxjQUNSO0FBQUEsWUFDRixTQUFTLEtBQUs7QUFDWixzQkFBUSxNQUFNLGlCQUFpQixHQUFHO0FBQ2xDLG9CQUFNLEdBQUcsWUFBWTtBQUFBLGdCQUNuQixNQUFNO0FBQUEsZ0JBQ04sT0FBTyxrQkFBa0IsR0FBRztBQUFBLGNBQzlCLENBQUM7QUFBQSxZQUNIO0FBQ0E7QUFBQSxVQUNGO0FBQUEsVUFFQSxLQUFLLGlCQUFpQjtBQUNwQiw4QkFBa0I7QUFDbEIsb0JBQVEsSUFBSSwwQkFBMEI7QUFDdEM7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQTtBQUFBOyIsCiAgIm5hbWVzIjogWyJjb2x1bW5zIiwgImV4dHJhY3RTdHJva2VDb2xvciIsICJ3YWxrIiwgIl9hIiwgIl9iIl0KfQo=
