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
            suggestion: "Apply auto-layout to this section for precise spacing extraction.",
            fixHint: [
              "Select the section frame in the Figma canvas.",
              'Open the right panel \u2192 Auto layout \u2192 click the "+" icon.',
              "Choose Vertical (most sections) or Horizontal direction.",
              "Set padding (top/right/bottom/left) and gap to match the design intent.",
              "Re-run validation \u2014 the warning should disappear."
            ]
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
          suggestion: 'Rename to a descriptive name (e.g., "Hero Section", "Features Grid").',
          fixHint: [
            "Click the layer in the canvas \u2014 it will be selected automatically.",
            "In the Layers panel (left), double-click the name and rename it.",
            'Use semantic names: "Hero", "Features", "CTA", "Footer" for sections; "Heading", "Subheading", "Primary CTA" for elements.',
            "Avoid generic names: Frame, Group, Rectangle, Vector, etc.",
            "Good names become ACF layout keys downstream \u2014 they directly affect the WordPress output."
          ]
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
            suggestion: "Install the font or replace it in the design.",
            fixHint: [
              `Install "${family}" in this style: ${style}.`,
              "On macOS: open Font Book \u2192 File \u2192 Add Fonts \u2192 select the font file.",
              "For Google Fonts: download from fonts.google.com and install locally, OR set up Figma's font sync via the desktop app.",
              "Alternative: replace this font in the design with one that's already installed.",
              "Restart Figma after installing \u2014 the font won't appear until then."
            ]
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
          suggestion: `Consider standardizing to ${Math.round((unique[i] + unique[i + 1]) / 2)}px.`,
          fixHint: [
            `You have ${unique[i]}px and ${unique[i + 1]}px used as spacing \u2014 likely the same value off by 1-2px.`,
            `Pick one value (suggested: ${Math.round((unique[i] + unique[i + 1]) / 2)}px) and apply it everywhere.`,
            'Best practice: define a Figma Variable in a "Spacing" collection (e.g. spacing/md = 32) and bind padding/gap to it.',
            "Variables propagate one rename across the whole file and become CSS custom properties in the export.",
            "This is informational only \u2014 export will still work, but the WordPress theme will be tidier with consistent values."
          ]
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
                    suggestion: "Consider reducing image dimensions or export scale.",
                    fixHint: [
                      `Image bounds: ${Math.round(bounds.width)}\xD7${Math.round(bounds.height)}px \u2014 that's why it's heavy.`,
                      "Replace the source image with a pre-compressed version (TinyPNG, ImageOptim, Squoosh).",
                      "For background images, a 1920px or 2560px max width is usually enough \u2014 anything larger wastes bandwidth.",
                      "If the image will be cropped at runtime, downscale BEFORE placing in Figma.",
                      "After replacing, re-run validation \u2014 the warning should disappear."
                    ]
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
          suggestion: "The plugin will record this as a negative margin. Verify the visual result.",
          fixHint: [
            `"${sorted[i].name}" extends ${Math.round(overlap)}px below where "${sorted[i + 1].name}" starts.`,
            "If this is intentional (e.g. a card overlaps the next section by design), no action needed \u2014 the plugin emits a negative margin-top and z-index.",
            "If unintentional, drag one of the sections so their bounding boxes don't overlap on the Y axis.",
            "Tip: in Figma, holding Shift while dragging snaps to integer Y values.",
            "After moving, re-run validation to confirm."
          ]
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
        suggestion: "Include mobile (375px) frames for exact responsive values.",
        fixHint: [
          "Without a mobile frame, the plugin can only guess at how the design adapts below 768px.",
          "Best practice: design at least one mobile frame (375px wide) per page.",
          'Name it consistently with the desktop counterpart: e.g. "Home \u2014 Desktop" + "Home \u2014 Mobile" so the plugin can pair them automatically.',
          "Then go back to Step 1 and select both frames before re-running validation.",
          "You can export desktop-only \u2014 the agent will derive mobile from CSS-driven scaling \u2014 but extracted values are always more accurate than calculated ones."
        ]
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
              suggestion: "Resize the text container or reduce text content.",
              fixHint: [
                "The text node's bounding box extends past its parent \u2014 content will be cut off in the export.",
                "Option 1: Resize the parent frame so the text fits.",
                `Option 2: Set the text's "Auto-resize" to "Width and Height" or "Height" so it grows with the content.`,
                "Option 3: Shorten the copy if it's placeholder text.",
                `In auto-layout containers, also ensure the text's "Fill container" option matches the parent's direction.`
              ]
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
          case "FOCUS_NODE": {
            try {
              const node = figma.getNodeById(msg.nodeId);
              if (!node) {
                console.warn("FOCUS_NODE: node not found", msg.nodeId);
                break;
              }
              if ("parent" in node && node.parent && "type" in node.parent) {
                let pageNode = node.parent;
                while (pageNode && pageNode.type !== "PAGE") {
                  pageNode = pageNode.parent;
                }
                if (pageNode && pageNode.type === "PAGE" && figma.currentPage.id !== pageNode.id) {
                  figma.currentPage = pageNode;
                }
              }
              if ("id" in node && node.type !== "DOCUMENT" && node.type !== "PAGE") {
                figma.currentPage.selection = [node];
                figma.viewport.scrollAndZoomIntoView([node]);
              }
            } catch (err) {
              console.warn("FOCUS_NODE failed:", err);
            }
            break;
          }
        }
      });
    }
  });
  require_main();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3NhbmRib3gvdXRpbHMudHMiLCAiLi4vc3JjL3NhbmRib3gvcmVzcG9uc2l2ZS50cyIsICIuLi9zcmMvc2FuZGJveC9kaXNjb3ZlcnkudHMiLCAiLi4vc3JjL3NhbmRib3gvdmFsaWRhdG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2NvbG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2VmZmVjdHMudHMiLCAiLi4vc3JjL3NhbmRib3gvdHlwb2dyYXBoeS50cyIsICIuLi9zcmMvc2FuZGJveC9zcGFjaW5nLnRzIiwgIi4uL3NyYy9zYW5kYm94L2dyaWQudHMiLCAiLi4vc3JjL3NhbmRib3gvaW50ZXJhY3Rpb25zLnRzIiwgIi4uL3NyYy9zYW5kYm94L3ZhcmlhYmxlcy50cyIsICIuLi9zcmMvc2FuZGJveC9wYXR0ZXJucy50cyIsICIuLi9zcmMvc2FuZGJveC9zZWN0aW9uLXBhcnNlci50cyIsICIuLi9zcmMvc2FuZGJveC9pbWFnZS1leHBvcnRlci50cyIsICIuLi9zcmMvc2FuZGJveC9pY29uLWRldGVjdG9yLnRzIiwgIi4uL3NyYy9zYW5kYm94L2V4dHJhY3Rvci50cyIsICIuLi9zcmMvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBDb252ZXJ0IGEgRmlnbWEgbGF5ZXIgbmFtZSB0byBhIFVSTC1zYWZlIGtlYmFiLWNhc2Ugc2x1Zy5cbiAqIFwiSGVybyBTZWN0aW9uXCIgXHUyMTkyIFwiaGVyby1zZWN0aW9uXCJcbiAqIFwiQWJvdXQgVXMgXHUyMDE0IE92ZXJ2aWV3XCIgXHUyMTkyIFwiYWJvdXQtdXMtb3ZlcnZpZXdcIlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbmFtZVxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1tcdTIwMTRcdTIwMTNdL2csICctJylcbiAgICAucmVwbGFjZSgvW15hLXowLTlcXHMtXS9nLCAnJylcbiAgICAucmVwbGFjZSgvXFxzKy9nLCAnLScpXG4gICAgLnJlcGxhY2UoLy0rL2csICctJylcbiAgICAucmVwbGFjZSgvXi18LSQvZywgJycpO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSBGaWdtYSBsYXllciBuYW1lIHRvIEFDRi1jb21wYXRpYmxlIHNuYWtlX2Nhc2UgbGF5b3V0IG5hbWUuXG4gKiBcIkhlcm8gU2VjdGlvblwiIFx1MjE5MiBcImhlcm9fc2VjdGlvblwiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0xheW91dE5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5hbWVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXHUyMDE0XHUyMDEzXS9nLCAnXycpXG4gICAgLnJlcGxhY2UoL1teYS16MC05XFxzX10vZywgJycpXG4gICAgLnJlcGxhY2UoL1xccysvZywgJ18nKVxuICAgIC5yZXBsYWNlKC9fKy9nLCAnXycpXG4gICAgLnJlcGxhY2UoL15ffF8kL2csICcnKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgbnVtZXJpYyB2YWx1ZSB0byBhIENTUyB2YWx1ZSBzdHJpbmcgd2l0aCB1bml0LlxuICogTkVWRVIgcmV0dXJucyBhIGJhcmUgbnVtYmVyIFx1MjAxNCBhbHdheXMgXCJOcHhcIiwgXCJOJVwiLCBldGMuXG4gKiBSZXR1cm5zIG51bGwgaWYgdGhlIHZhbHVlIGlzIHVuZGVmaW5lZC9udWxsL05hTi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvQ3NzVmFsdWUodmFsdWU6IG51bWJlciB8IHVuZGVmaW5lZCB8IG51bGwsIHVuaXQ6IHN0cmluZyA9ICdweCcpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgfHwgaXNOYU4odmFsdWUpKSByZXR1cm4gbnVsbDtcbiAgLy8gUm91bmQgdG8gYXZvaWQgZmxvYXRpbmctcG9pbnQgbm9pc2UgKGUuZy4sIDc5Ljk5OTk5IFx1MjE5MiA4MClcbiAgY29uc3Qgcm91bmRlZCA9IE1hdGgucm91bmQodmFsdWUgKiAxMDApIC8gMTAwO1xuICAvLyBVc2UgaW50ZWdlciB3aGVuIGNsb3NlIGVub3VnaFxuICBjb25zdCBkaXNwbGF5ID0gTnVtYmVyLmlzSW50ZWdlcihyb3VuZGVkKSA/IHJvdW5kZWQgOiByb3VuZGVkO1xuICByZXR1cm4gYCR7ZGlzcGxheX0ke3VuaXR9YDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgYSBGaWdtYSBub2RlIElEIGZvciBvdXRwdXQuIEZpZ21hIHVzZXMgXCIxOjIzNFwiIGZvcm1hdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vZGVJZFRvU3RyaW5nKGlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaWQ7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgYSBzY3JlZW5zaG90IGZpbGVuYW1lIGZyb20gdGhlIHNlY3Rpb24ncyBsYXlvdXQgbmFtZS5cbiAqIFwiSGVybyBTZWN0aW9uXCIgXHUyMTkyIFwiaGVyby1zZWN0aW9uLnBuZ1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY3JlZW5zaG90RmlsZW5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3NsdWdpZnkobmFtZSl9LnBuZ2A7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgYXNwZWN0IHJhdGlvIHN0cmluZyBmcm9tIHdpZHRoIGFuZCBoZWlnaHQuXG4gKiBSZXR1cm5zIHRoZSBzaW1wbGVzdCBpbnRlZ2VyIHJhdGlvOiAxNDQwLzkwMCBcdTIxOTIgXCIxNi8xMFwiXG4gKiBSZXR1cm5zIG51bGwgaWYgZWl0aGVyIGRpbWVuc2lvbiBpcyAwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUFzcGVjdFJhdGlvKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghd2lkdGggfHwgIWhlaWdodCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGdjZCA9IChhOiBudW1iZXIsIGI6IG51bWJlcik6IG51bWJlciA9PiAoYiA9PT0gMCA/IGEgOiBnY2QoYiwgYSAlIGIpKTtcbiAgY29uc3QgZCA9IGdjZChNYXRoLnJvdW5kKHdpZHRoKSwgTWF0aC5yb3VuZChoZWlnaHQpKTtcbiAgcmV0dXJuIGAke01hdGgucm91bmQod2lkdGggLyBkKX0vJHtNYXRoLnJvdW5kKGhlaWdodCAvIGQpfWA7XG59XG5cbi8qKlxuICogRGV0ZWN0IGlmIGEgbm9kZSBuYW1lIGlzIGEgZGVmYXVsdCBGaWdtYS1nZW5lcmF0ZWQgbmFtZS5cbiAqIFwiRnJhbWUgMVwiLCBcIkdyb3VwIDIzXCIsIFwiUmVjdGFuZ2xlIDRcIiwgXCJWZWN0b3JcIiBcdTIxOTIgdHJ1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEZWZhdWx0TGF5ZXJOYW1lKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gL14oRnJhbWV8R3JvdXB8UmVjdGFuZ2xlfEVsbGlwc2V8TGluZXxWZWN0b3J8UG9seWdvbnxTdGFyfEJvb2xlYW58U2xpY2V8Q29tcG9uZW50fEluc3RhbmNlKVxccypcXGQqJC9pLnRlc3QobmFtZSk7XG59XG4iLCAiaW1wb3J0IHsgQnJlYWtwb2ludENsYXNzLCBGcmFtZUluZm8sIFJlc3BvbnNpdmVNYXAsIFJlc3BvbnNpdmVQYWlyLCBVbm1hdGNoZWRGcmFtZSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgc2x1Z2lmeSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIENsYXNzaWZ5IGEgZnJhbWUgd2lkdGggaW50byBhIGJyZWFrcG9pbnQgY2F0ZWdvcnkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc2lmeUJyZWFrcG9pbnQod2lkdGg6IG51bWJlcik6IEJyZWFrcG9pbnRDbGFzcyB7XG4gIGlmICh3aWR0aCA8PSA0ODApIHJldHVybiAnbW9iaWxlJztcbiAgaWYgKHdpZHRoIDw9IDgyMCkgcmV0dXJuICd0YWJsZXQnO1xuICBpZiAod2lkdGggPD0gMTQ0MCkgcmV0dXJuICdkZXNrdG9wJztcbiAgcmV0dXJuICdsYXJnZSc7XG59XG5cbi8qKlxuICogQ29tbW9uIHN1ZmZpeGVzL2tleXdvcmRzIHRoYXQgZGVub3RlIGJyZWFrcG9pbnRzIGluIGZyYW1lIG5hbWVzLlxuICovXG5jb25zdCBCUkVBS1BPSU5UX1BBVFRFUk5TID0gW1xuICAvWy1cdTIwMTNcdTIwMTRcXHNdKihkZXNrdG9wfG1vYmlsZXx0YWJsZXR8cmVzcG9uc2l2ZXxwaG9uZXx3ZWJ8bGd8bWR8c218eHMpL2dpLFxuICAvWy1cdTIwMTNcdTIwMTRcXHNdKihcXGR7Myw0fSlcXHMqKD86cHgpPyQvZ2ksICAgLy8gdHJhaWxpbmcgd2lkdGggbnVtYmVycyBsaWtlIFwiMTQ0MFwiIG9yIFwiMzc1cHhcIlxuICAvXFwoKD86ZGVza3RvcHxtb2JpbGV8dGFibGV0fHBob25lKVxcKS9naSxcbiAgL1xccyskL2csXG5dO1xuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIGZyYW1lIG5hbWUgYnkgc3RyaXBwaW5nIGJyZWFrcG9pbnQgaWRlbnRpZmllcnMuXG4gKiBcIkFib3V0IC0gRGVza3RvcFwiIFx1MjE5MiBcImFib3V0XCJcbiAqIFwiSG9tZXBhZ2UgMTQ0MFwiIFx1MjE5MiBcImhvbWVwYWdlXCJcbiAqIFwiU2VydmljZXMgKE1vYmlsZSlcIiBcdTIxOTIgXCJzZXJ2aWNlc1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVGcmFtZU5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG5vcm1hbGl6ZWQgPSBuYW1lO1xuICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgQlJFQUtQT0lOVF9QQVRURVJOUykge1xuICAgIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVkLnJlcGxhY2UocGF0dGVybiwgJycpO1xuICB9XG4gIHJldHVybiBub3JtYWxpemVkLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbn1cblxuLyoqXG4gKiBNYXRjaCBkZXNrdG9wIGFuZCBtb2JpbGUgZnJhbWVzIGJ5IG5hbWUgc2ltaWxhcml0eS5cbiAqIFJldHVybnMgUmVzcG9uc2l2ZU1hcCB3aXRoIG1hdGNoZWQgcGFpcnMgYW5kIHVubWF0Y2hlZCBmcmFtZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaFJlc3BvbnNpdmVGcmFtZXMoYWxsRnJhbWVzOiBGcmFtZUluZm9bXSk6IFJlc3BvbnNpdmVNYXAge1xuICAvLyBHcm91cCBmcmFtZXMgYnkgbm9ybWFsaXplZCBuYW1lXG4gIGNvbnN0IGdyb3VwcyA9IG5ldyBNYXA8c3RyaW5nLCBGcmFtZUluZm9bXT4oKTtcblxuICBmb3IgKGNvbnN0IGZyYW1lIG9mIGFsbEZyYW1lcykge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVGcmFtZU5hbWUoZnJhbWUubmFtZSk7XG4gICAgaWYgKCFncm91cHMuaGFzKG5vcm1hbGl6ZWQpKSB7XG4gICAgICBncm91cHMuc2V0KG5vcm1hbGl6ZWQsIFtdKTtcbiAgICB9XG4gICAgZ3JvdXBzLmdldChub3JtYWxpemVkKSEucHVzaChmcmFtZSk7XG4gIH1cblxuICBjb25zdCBtYXRjaGVkUGFpcnM6IFJlc3BvbnNpdmVQYWlyW10gPSBbXTtcbiAgY29uc3QgdW5tYXRjaGVkRnJhbWVzOiBVbm1hdGNoZWRGcmFtZVtdID0gW107XG4gIGNvbnN0IG1hdGNoZWRJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IFtiYXNlTmFtZSwgZnJhbWVzXSBvZiBncm91cHMpIHtcbiAgICBpZiAoZnJhbWVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgLy8gU2luZ2xlIGZyYW1lIFx1MjAxNCBubyByZXNwb25zaXZlIHBhaXJcbiAgICAgIGNvbnN0IGZyYW1lID0gZnJhbWVzWzBdO1xuICAgICAgaWYgKGZyYW1lLmJyZWFrcG9pbnQgPT09ICdkZXNrdG9wJyB8fCBmcmFtZS5icmVha3BvaW50ID09PSAnbGFyZ2UnKSB7XG4gICAgICAgIC8vIERlc2t0b3Agd2l0aG91dCBtb2JpbGUgXHUyMTkyIHN0aWxsIGEgdmFsaWQgcGFnZSwganVzdCBubyByZXNwb25zaXZlIGRhdGFcbiAgICAgICAgbWF0Y2hlZFBhaXJzLnB1c2goe1xuICAgICAgICAgIHBhZ2VOYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgICAgIHBhZ2VTbHVnOiBzbHVnaWZ5KGJhc2VOYW1lIHx8IGZyYW1lLm5hbWUpLFxuICAgICAgICAgIGRlc2t0b3A6IHsgZnJhbWVJZDogZnJhbWUuaWQsIGZyYW1lTmFtZTogZnJhbWUubmFtZSwgd2lkdGg6IGZyYW1lLndpZHRoIH0sXG4gICAgICAgICAgbW9iaWxlOiBudWxsLFxuICAgICAgICAgIHRhYmxldDogbnVsbCxcbiAgICAgICAgICBtYXRjaENvbmZpZGVuY2U6IDEuMCxcbiAgICAgICAgICBtYXRjaE1ldGhvZDogJ25hbWUtc2ltaWxhcml0eScsXG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVkSWRzLmFkZChmcmFtZS5pZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bm1hdGNoZWRGcmFtZXMucHVzaCh7XG4gICAgICAgICAgZnJhbWVJZDogZnJhbWUuaWQsXG4gICAgICAgICAgZnJhbWVOYW1lOiBmcmFtZS5uYW1lLFxuICAgICAgICAgIHdpZHRoOiBmcmFtZS53aWR0aCxcbiAgICAgICAgICBicmVha3BvaW50OiBmcmFtZS5icmVha3BvaW50LFxuICAgICAgICAgIHJlYXNvbjogJ25vIGRlc2t0b3AgY291bnRlcnBhcnQgZm91bmQnLFxuICAgICAgICB9KTtcbiAgICAgICAgbWF0Y2hlZElkcy5hZGQoZnJhbWUuaWQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gTXVsdGlwbGUgZnJhbWVzIHdpdGggc2FtZSBiYXNlIG5hbWUgXHUyMDE0IG1hdGNoIGJ5IGJyZWFrcG9pbnRcbiAgICBjb25zdCBkZXNrdG9wID0gZnJhbWVzLmZpbmQoZiA9PiBmLmJyZWFrcG9pbnQgPT09ICdkZXNrdG9wJyB8fCBmLmJyZWFrcG9pbnQgPT09ICdsYXJnZScpO1xuICAgIGNvbnN0IG1vYmlsZSA9IGZyYW1lcy5maW5kKGYgPT4gZi5icmVha3BvaW50ID09PSAnbW9iaWxlJyk7XG4gICAgY29uc3QgdGFibGV0ID0gZnJhbWVzLmZpbmQoZiA9PiBmLmJyZWFrcG9pbnQgPT09ICd0YWJsZXQnKTtcblxuICAgIGlmIChkZXNrdG9wKSB7XG4gICAgICBtYXRjaGVkUGFpcnMucHVzaCh7XG4gICAgICAgIHBhZ2VOYW1lOiBkZXNrdG9wLm5hbWUsXG4gICAgICAgIHBhZ2VTbHVnOiBzbHVnaWZ5KGJhc2VOYW1lIHx8IGRlc2t0b3AubmFtZSksXG4gICAgICAgIGRlc2t0b3A6IHsgZnJhbWVJZDogZGVza3RvcC5pZCwgZnJhbWVOYW1lOiBkZXNrdG9wLm5hbWUsIHdpZHRoOiBkZXNrdG9wLndpZHRoIH0sXG4gICAgICAgIG1vYmlsZTogbW9iaWxlID8geyBmcmFtZUlkOiBtb2JpbGUuaWQsIGZyYW1lTmFtZTogbW9iaWxlLm5hbWUsIHdpZHRoOiBtb2JpbGUud2lkdGggfSA6IG51bGwsXG4gICAgICAgIHRhYmxldDogdGFibGV0ID8geyBmcmFtZUlkOiB0YWJsZXQuaWQsIGZyYW1lTmFtZTogdGFibGV0Lm5hbWUsIHdpZHRoOiB0YWJsZXQud2lkdGggfSA6IG51bGwsXG4gICAgICAgIG1hdGNoQ29uZmlkZW5jZTogMC45NSxcbiAgICAgICAgbWF0Y2hNZXRob2Q6ICduYW1lLXNpbWlsYXJpdHknLFxuICAgICAgfSk7XG4gICAgICBtYXRjaGVkSWRzLmFkZChkZXNrdG9wLmlkKTtcbiAgICAgIGlmIChtb2JpbGUpIG1hdGNoZWRJZHMuYWRkKG1vYmlsZS5pZCk7XG4gICAgICBpZiAodGFibGV0KSBtYXRjaGVkSWRzLmFkZCh0YWJsZXQuaWQpO1xuICAgIH1cblxuICAgIC8vIEFueSByZW1haW5pbmcgZnJhbWVzIGluIHRoaXMgZ3JvdXBcbiAgICBmb3IgKGNvbnN0IGZyYW1lIG9mIGZyYW1lcykge1xuICAgICAgaWYgKCFtYXRjaGVkSWRzLmhhcyhmcmFtZS5pZCkpIHtcbiAgICAgICAgdW5tYXRjaGVkRnJhbWVzLnB1c2goe1xuICAgICAgICAgIGZyYW1lSWQ6IGZyYW1lLmlkLFxuICAgICAgICAgIGZyYW1lTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgICB3aWR0aDogZnJhbWUud2lkdGgsXG4gICAgICAgICAgYnJlYWtwb2ludDogZnJhbWUuYnJlYWtwb2ludCxcbiAgICAgICAgICByZWFzb246ICdjb3VsZCBub3QgcGFpciB3aXRoIGRlc2t0b3AgZnJhbWUnLFxuICAgICAgICB9KTtcbiAgICAgICAgbWF0Y2hlZElkcy5hZGQoZnJhbWUuaWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIENhdGNoIGFueSBmcmFtZXMgbm90IHByb2Nlc3NlZFxuICBmb3IgKGNvbnN0IGZyYW1lIG9mIGFsbEZyYW1lcykge1xuICAgIGlmICghbWF0Y2hlZElkcy5oYXMoZnJhbWUuaWQpKSB7XG4gICAgICB1bm1hdGNoZWRGcmFtZXMucHVzaCh7XG4gICAgICAgIGZyYW1lSWQ6IGZyYW1lLmlkLFxuICAgICAgICBmcmFtZU5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgIHdpZHRoOiBmcmFtZS53aWR0aCxcbiAgICAgICAgYnJlYWtwb2ludDogZnJhbWUuYnJlYWtwb2ludCxcbiAgICAgICAgcmVhc29uOiAnbm90IG1hdGNoZWQgYnkgYW55IG1ldGhvZCcsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4geyBtYXRjaGVkUGFpcnMsIHVubWF0Y2hlZEZyYW1lcyB9O1xufVxuXG4vKipcbiAqIENvbnRlbnQtYmFzZWQgbWF0Y2hpbmcgZmFsbGJhY2s6IGNvbXBhcmUgY2hpbGQgbmFtZXMgYmV0d2VlbiB0d28gZnJhbWVzLlxuICogUmV0dXJucyBvdmVybGFwIHJhdGlvICgwLTEpLiA+MC42ID0gbGlrZWx5IHNhbWUgcGFnZSBhdCBkaWZmZXJlbnQgYnJlYWtwb2ludHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlQ29udGVudE92ZXJsYXAoZnJhbWVBOiBGcmFtZU5vZGUsIGZyYW1lQjogRnJhbWVOb2RlKTogbnVtYmVyIHtcbiAgY29uc3QgbmFtZXNBID0gbmV3IFNldChmcmFtZUEuY2hpbGRyZW4ubWFwKGMgPT4gYy5uYW1lLnRvTG93ZXJDYXNlKCkpKTtcbiAgY29uc3QgbmFtZXNCID0gbmV3IFNldChmcmFtZUIuY2hpbGRyZW4ubWFwKGMgPT4gYy5uYW1lLnRvTG93ZXJDYXNlKCkpKTtcblxuICBpZiAobmFtZXNBLnNpemUgPT09IDAgfHwgbmFtZXNCLnNpemUgPT09IDApIHJldHVybiAwO1xuXG4gIGxldCBvdmVybGFwID0gMDtcbiAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzQSkge1xuICAgIGlmIChuYW1lc0IuaGFzKG5hbWUpKSBvdmVybGFwKys7XG4gIH1cblxuICBjb25zdCB1bmlvblNpemUgPSBuZXcgU2V0KFsuLi5uYW1lc0EsIC4uLm5hbWVzQl0pLnNpemU7XG4gIHJldHVybiB1bmlvblNpemUgPiAwID8gb3ZlcmxhcCAvIHVuaW9uU2l6ZSA6IDA7XG59XG4iLCAiaW1wb3J0IHsgUGFnZUluZm8sIEZyYW1lSW5mbyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgY2xhc3NpZnlCcmVha3BvaW50IH0gZnJvbSAnLi9yZXNwb25zaXZlJztcblxuLyoqXG4gKiBEaXNjb3ZlciBhbGwgcGFnZXMgaW4gdGhlIEZpZ21hIGZpbGUuXG4gKiBFYWNoIHBhZ2UgY29udGFpbnMgZnJhbWVzIHRoYXQgcmVwcmVzZW50IGRlc2lnbiBhcnRib2FyZHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb3ZlclBhZ2VzKCk6IFBhZ2VJbmZvW10ge1xuICBjb25zdCBwYWdlczogUGFnZUluZm9bXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgcGFnZSBvZiBmaWdtYS5yb290LmNoaWxkcmVuKSB7XG4gICAgY29uc3QgZnJhbWVzID0gZGlzY292ZXJGcmFtZXMocGFnZSk7XG4gICAgaWYgKGZyYW1lcy5sZW5ndGggPiAwKSB7XG4gICAgICBwYWdlcy5wdXNoKHtcbiAgICAgICAgaWQ6IHBhZ2UuaWQsXG4gICAgICAgIG5hbWU6IHBhZ2UubmFtZSxcbiAgICAgICAgZnJhbWVzLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhZ2VzO1xufVxuXG4vKipcbiAqIERpc2NvdmVyIGFsbCB0b3AtbGV2ZWwgZnJhbWVzIHdpdGhpbiBhIHBhZ2UuXG4gKiBGaWx0ZXJzIHRvIEZSQU1FLCBDT01QT05FTlRfU0VULCBhbmQgQ09NUE9ORU5UIG5vZGVzIHdpdGggbWVhbmluZ2Z1bCBkaW1lbnNpb25zLlxuICovXG5mdW5jdGlvbiBkaXNjb3ZlckZyYW1lcyhwYWdlOiBQYWdlTm9kZSk6IEZyYW1lSW5mb1tdIHtcbiAgY29uc3QgZnJhbWVzOiBGcmFtZUluZm9bXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgcGFnZS5jaGlsZHJlbikge1xuICAgIC8vIE9ubHkgaW5jbHVkZSB0b3AtbGV2ZWwgZnJhbWVzIChub3QgZ3JvdXBzLCB2ZWN0b3JzLCBldGMuKVxuICAgIGlmIChjaGlsZC50eXBlICE9PSAnRlJBTUUnICYmIGNoaWxkLnR5cGUgIT09ICdDT01QT05FTlQnICYmIGNoaWxkLnR5cGUgIT09ICdDT01QT05FTlRfU0VUJykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgZnJhbWUgPSBjaGlsZCBhcyBGcmFtZU5vZGU7XG5cbiAgICAvLyBTa2lwIHRpbnkgZnJhbWVzIChsaWtlbHkgaWNvbnMgb3IgY29tcG9uZW50cywgbm90IHBhZ2UgZGVzaWducylcbiAgICBpZiAoZnJhbWUud2lkdGggPCAzMDAgfHwgZnJhbWUuaGVpZ2h0IDwgMjAwKSBjb250aW51ZTtcblxuICAgIC8vIENvdW50IHZpc2libGUgc2VjdGlvbnMgKGRpcmVjdCBjaGlsZHJlbiB0aGF0IGFyZSBmcmFtZXMpXG4gICAgY29uc3Qgc2VjdGlvbkNvdW50ID0gZnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3guaGVpZ2h0ID4gNTBcbiAgICApLmxlbmd0aDtcblxuICAgIC8vIENoZWNrIGlmIGFueSBzZWN0aW9uIHVzZXMgYXV0by1sYXlvdXRcbiAgICBjb25zdCBoYXNBdXRvTGF5b3V0ID0gZnJhbWUubGF5b3V0TW9kZSAhPT0gdW5kZWZpbmVkICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJztcblxuICAgIGZyYW1lcy5wdXNoKHtcbiAgICAgIGlkOiBmcmFtZS5pZCxcbiAgICAgIG5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICB3aWR0aDogTWF0aC5yb3VuZChmcmFtZS53aWR0aCksXG4gICAgICBoZWlnaHQ6IE1hdGgucm91bmQoZnJhbWUuaGVpZ2h0KSxcbiAgICAgIGJyZWFrcG9pbnQ6IGNsYXNzaWZ5QnJlYWtwb2ludChNYXRoLnJvdW5kKGZyYW1lLndpZHRoKSksXG4gICAgICBzZWN0aW9uQ291bnQsXG4gICAgICBoYXNBdXRvTGF5b3V0LFxuICAgICAgcmVzcG9uc2l2ZVBhaXJJZDogbnVsbCxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBmcmFtZXM7XG59XG4iLCAiaW1wb3J0IHsgVmFsaWRhdGlvblJlc3VsdCwgRnJhbWVJbmZvIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBpc0RlZmF1bHRMYXllck5hbWUgfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBSdW4gYWxsIDkgdmFsaWRhdGlvbiBjaGVja3MgYWdhaW5zdCBzZWxlY3RlZCBmcmFtZXMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5BbGxWYWxpZGF0aW9ucyhmcmFtZUlkczogc3RyaW5nW10pOiBQcm9taXNlPFZhbGlkYXRpb25SZXN1bHRbXT4ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGZyYW1lSWQgb2YgZnJhbWVJZHMpIHtcbiAgICBjb25zdCBub2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQoZnJhbWVJZCk7XG4gICAgaWYgKCFub2RlIHx8IG5vZGUudHlwZSAhPT0gJ0ZSQU1FJykgY29udGludWU7XG5cbiAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgIGNvbnN0IHNlY3Rpb25zID0gZnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKVxuICAgICk7XG5cbiAgICAvLyBDaGVjayAxOiBNaXNzaW5nIGF1dG8tbGF5b3V0IG9uIHNlY3Rpb25zXG4gICAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrQXV0b0xheW91dChzZWN0aW9ucywgZnJhbWUubmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgMjogRGVmYXVsdCBsYXllciBuYW1lc1xuICAgIHJlc3VsdHMucHVzaCguLi5jaGVja0xheWVyTmFtZXMoc2VjdGlvbnMsIGZyYW1lLm5hbWUpKTtcblxuICAgIC8vIENoZWNrIDM6IE1pc3NpbmcgZm9udHNcbiAgICByZXN1bHRzLnB1c2goLi4uYXdhaXQgY2hlY2tGb250cyhmcmFtZSkpO1xuXG4gICAgLy8gQ2hlY2sgNDogSW5jb25zaXN0ZW50IHNwYWNpbmdcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tTcGFjaW5nQ29uc2lzdGVuY3koZnJhbWUpKTtcblxuICAgIC8vIENoZWNrIDU6IE92ZXJzaXplZCBpbWFnZXNcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tPdmVyc2l6ZWRJbWFnZXMoZnJhbWUpKTtcblxuICAgIC8vIENoZWNrIDY6IE92ZXJsYXBwaW5nIHNlY3Rpb25zXG4gICAgcmVzdWx0cy5wdXNoKC4uLmNoZWNrT3ZlcmxhcHMoc2VjdGlvbnMsIGZyYW1lLm5hbWUpKTtcblxuICAgIC8vIENoZWNrIDk6IFRleHQgb3ZlcmZsb3dcbiAgICByZXN1bHRzLnB1c2goLi4uY2hlY2tUZXh0T3ZlcmZsb3coZnJhbWUpKTtcbiAgfVxuXG4gIC8vIENoZWNrIDc6IE1pc3NpbmcgcmVzcG9uc2l2ZSBmcmFtZXMgKGNyb3NzLWZyYW1lIGNoZWNrKVxuICByZXN1bHRzLnB1c2goLi4uY2hlY2tSZXNwb25zaXZlRnJhbWVzKGZyYW1lSWRzKSk7XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayAxOiBNaXNzaW5nIEF1dG8tTGF5b3V0IFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBjaGVja0F1dG9MYXlvdXQoc2VjdGlvbnM6IFNjZW5lTm9kZVtdLCBmcmFtZU5hbWU6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2Ygc2VjdGlvbnMpIHtcbiAgICBpZiAoc2VjdGlvbi50eXBlID09PSAnRlJBTUUnIHx8IHNlY3Rpb24udHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgc2VjdGlvbi50eXBlID09PSAnSU5TVEFOQ0UnKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IHNlY3Rpb24gYXMgRnJhbWVOb2RlO1xuICAgICAgaWYgKCFmcmFtZS5sYXlvdXRNb2RlIHx8IGZyYW1lLmxheW91dE1vZGUgPT09ICdOT05FJykge1xuICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICAgICAgY2hlY2s6ICdhdXRvLWxheW91dCcsXG4gICAgICAgICAgbWVzc2FnZTogYFNlY3Rpb24gXCIke3NlY3Rpb24ubmFtZX1cIiB1c2VzIGFic29sdXRlIHBvc2l0aW9uaW5nLiBTcGFjaW5nIHZhbHVlcyB3aWxsIGJlIGFwcHJveGltYXRlLmAsXG4gICAgICAgICAgc2VjdGlvbk5hbWU6IHNlY3Rpb24ubmFtZSxcbiAgICAgICAgICBub2RlSWQ6IHNlY3Rpb24uaWQsXG4gICAgICAgICAgbm9kZU5hbWU6IHNlY3Rpb24ubmFtZSxcbiAgICAgICAgICBzdWdnZXN0aW9uOiAnQXBwbHkgYXV0by1sYXlvdXQgdG8gdGhpcyBzZWN0aW9uIGZvciBwcmVjaXNlIHNwYWNpbmcgZXh0cmFjdGlvbi4nLFxuICAgICAgICAgIGZpeEhpbnQ6IFtcbiAgICAgICAgICAgICdTZWxlY3QgdGhlIHNlY3Rpb24gZnJhbWUgaW4gdGhlIEZpZ21hIGNhbnZhcy4nLFxuICAgICAgICAgICAgJ09wZW4gdGhlIHJpZ2h0IHBhbmVsIFx1MjE5MiBBdXRvIGxheW91dCBcdTIxOTIgY2xpY2sgdGhlIFwiK1wiIGljb24uJyxcbiAgICAgICAgICAgICdDaG9vc2UgVmVydGljYWwgKG1vc3Qgc2VjdGlvbnMpIG9yIEhvcml6b250YWwgZGlyZWN0aW9uLicsXG4gICAgICAgICAgICAnU2V0IHBhZGRpbmcgKHRvcC9yaWdodC9ib3R0b20vbGVmdCkgYW5kIGdhcCB0byBtYXRjaCB0aGUgZGVzaWduIGludGVudC4nLFxuICAgICAgICAgICAgJ1JlLXJ1biB2YWxpZGF0aW9uIFx1MjAxNCB0aGUgd2FybmluZyBzaG91bGQgZGlzYXBwZWFyLicsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgMjogRGVmYXVsdCBMYXllciBOYW1lcyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tMYXllck5hbWVzKHNlY3Rpb25zOiBTY2VuZU5vZGVbXSwgZnJhbWVOYW1lOiBzdHJpbmcpOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcikge1xuICAgIGlmIChpc0RlZmF1bHRMYXllck5hbWUobm9kZS5uYW1lKSkge1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6IGRlcHRoID09PSAwID8gJ3dhcm5pbmcnIDogJ2luZm8nLFxuICAgICAgICBjaGVjazogJ2xheWVyLW5hbWVzJyxcbiAgICAgICAgbWVzc2FnZTogYExheWVyIFwiJHtub2RlLm5hbWV9XCIgaGFzIGEgZGVmYXVsdCBGaWdtYSBuYW1lJHtkZXB0aCA9PT0gMCA/ICcgKHNlY3Rpb24gbGV2ZWwpJyA6ICcnfS5gLFxuICAgICAgICBzZWN0aW9uTmFtZTogZnJhbWVOYW1lLFxuICAgICAgICBub2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgIG5vZGVOYW1lOiBub2RlLm5hbWUsXG4gICAgICAgIHN1Z2dlc3Rpb246ICdSZW5hbWUgdG8gYSBkZXNjcmlwdGl2ZSBuYW1lIChlLmcuLCBcIkhlcm8gU2VjdGlvblwiLCBcIkZlYXR1cmVzIEdyaWRcIikuJyxcbiAgICAgICAgZml4SGludDogW1xuICAgICAgICAgICdDbGljayB0aGUgbGF5ZXIgaW4gdGhlIGNhbnZhcyBcdTIwMTQgaXQgd2lsbCBiZSBzZWxlY3RlZCBhdXRvbWF0aWNhbGx5LicsXG4gICAgICAgICAgJ0luIHRoZSBMYXllcnMgcGFuZWwgKGxlZnQpLCBkb3VibGUtY2xpY2sgdGhlIG5hbWUgYW5kIHJlbmFtZSBpdC4nLFxuICAgICAgICAgICdVc2Ugc2VtYW50aWMgbmFtZXM6IFwiSGVyb1wiLCBcIkZlYXR1cmVzXCIsIFwiQ1RBXCIsIFwiRm9vdGVyXCIgZm9yIHNlY3Rpb25zOyBcIkhlYWRpbmdcIiwgXCJTdWJoZWFkaW5nXCIsIFwiUHJpbWFyeSBDVEFcIiBmb3IgZWxlbWVudHMuJyxcbiAgICAgICAgICAnQXZvaWQgZ2VuZXJpYyBuYW1lczogRnJhbWUsIEdyb3VwLCBSZWN0YW5nbGUsIFZlY3RvciwgZXRjLicsXG4gICAgICAgICAgJ0dvb2QgbmFtZXMgYmVjb21lIEFDRiBsYXlvdXQga2V5cyBkb3duc3RyZWFtIFx1MjAxNCB0aGV5IGRpcmVjdGx5IGFmZmVjdCB0aGUgV29yZFByZXNzIG91dHB1dC4nLFxuICAgICAgICBdLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUgJiYgZGVwdGggPCAyKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCwgZGVwdGggKyAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2Ygc2VjdGlvbnMpIHtcbiAgICB3YWxrKHNlY3Rpb24sIDApO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgMzogTWlzc2luZyBGb250cyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuYXN5bmMgZnVuY3Rpb24gY2hlY2tGb250cyhmcmFtZTogRnJhbWVOb2RlKTogUHJvbWlzZTxWYWxpZGF0aW9uUmVzdWx0W10+IHtcbiAgY29uc3QgcmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdID0gW107XG4gIGNvbnN0IGNoZWNrZWRGb250cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZ1bmN0aW9uIGNvbGxlY3RGb250TmFtZXMobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCBmb250TmFtZSA9IG5vZGUuZm9udE5hbWU7XG4gICAgICBpZiAoZm9udE5hbWUgIT09IGZpZ21hLm1peGVkICYmIGZvbnROYW1lKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGAke2ZvbnROYW1lLmZhbWlseX06OiR7Zm9udE5hbWUuc3R5bGV9YDtcbiAgICAgICAgaWYgKCFjaGVja2VkRm9udHMuaGFzKGtleSkpIHtcbiAgICAgICAgICBjaGVja2VkRm9udHMuYWRkKGtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIGNvbGxlY3RGb250TmFtZXMoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbGxlY3RGb250TmFtZXMoZnJhbWUpO1xuXG4gIGZvciAoY29uc3QgZm9udEtleSBvZiBjaGVja2VkRm9udHMpIHtcbiAgICBjb25zdCBbZmFtaWx5LCBzdHlsZV0gPSBmb250S2V5LnNwbGl0KCc6OicpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmaWdtYS5sb2FkRm9udEFzeW5jKHsgZmFtaWx5LCBzdHlsZSB9KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiAnZXJyb3InLFxuICAgICAgICBjaGVjazogJ2ZvbnRzJyxcbiAgICAgICAgbWVzc2FnZTogYEZvbnQgXCIke2ZhbWlseX0gJHtzdHlsZX1cIiBpcyBub3QgYXZhaWxhYmxlLiBUZXh0IGV4dHJhY3Rpb24gbWF5IGZhaWwuYCxcbiAgICAgICAgc2VjdGlvbk5hbWU6IGZyYW1lLm5hbWUsXG4gICAgICAgIHN1Z2dlc3Rpb246ICdJbnN0YWxsIHRoZSBmb250IG9yIHJlcGxhY2UgaXQgaW4gdGhlIGRlc2lnbi4nLFxuICAgICAgICBmaXhIaW50OiBbXG4gICAgICAgICAgYEluc3RhbGwgXCIke2ZhbWlseX1cIiBpbiB0aGlzIHN0eWxlOiAke3N0eWxlfS5gLFxuICAgICAgICAgICdPbiBtYWNPUzogb3BlbiBGb250IEJvb2sgXHUyMTkyIEZpbGUgXHUyMTkyIEFkZCBGb250cyBcdTIxOTIgc2VsZWN0IHRoZSBmb250IGZpbGUuJyxcbiAgICAgICAgICAnRm9yIEdvb2dsZSBGb250czogZG93bmxvYWQgZnJvbSBmb250cy5nb29nbGUuY29tIGFuZCBpbnN0YWxsIGxvY2FsbHksIE9SIHNldCB1cCBGaWdtYVxcJ3MgZm9udCBzeW5jIHZpYSB0aGUgZGVza3RvcCBhcHAuJyxcbiAgICAgICAgICAnQWx0ZXJuYXRpdmU6IHJlcGxhY2UgdGhpcyBmb250IGluIHRoZSBkZXNpZ24gd2l0aCBvbmUgdGhhdFxcJ3MgYWxyZWFkeSBpbnN0YWxsZWQuJyxcbiAgICAgICAgICAnUmVzdGFydCBGaWdtYSBhZnRlciBpbnN0YWxsaW5nIFx1MjAxNCB0aGUgZm9udCB3b25cXCd0IGFwcGVhciB1bnRpbCB0aGVuLicsXG4gICAgICAgIF0sXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDaGVjayA0OiBJbmNvbnNpc3RlbnQgU3BhY2luZyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tTcGFjaW5nQ29uc2lzdGVuY3koZnJhbWU6IEZyYW1lTm9kZSk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuICBjb25zdCBzcGFjaW5nVmFsdWVzOiBudW1iZXJbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJykge1xuICAgICAgY29uc3QgZiA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgaWYgKGYubGF5b3V0TW9kZSAmJiBmLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICBzcGFjaW5nVmFsdWVzLnB1c2goZi5wYWRkaW5nVG9wLCBmLnBhZGRpbmdCb3R0b20sIGYucGFkZGluZ0xlZnQsIGYucGFkZGluZ1JpZ2h0LCBmLml0ZW1TcGFjaW5nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKGZyYW1lKTtcblxuICAvLyBGaW5kIG5lYXItZHVwbGljYXRlc1xuICBjb25zdCB1bmlxdWUgPSBbLi4ubmV3IFNldChzcGFjaW5nVmFsdWVzLmZpbHRlcih2ID0+IHYgPiAwKSldLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmlxdWUubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgY29uc3QgZGlmZiA9IHVuaXF1ZVtpICsgMV0gLSB1bmlxdWVbaV07XG4gICAgaWYgKGRpZmYgPiAwICYmIGRpZmYgPD0gMikge1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdpbmZvJyxcbiAgICAgICAgY2hlY2s6ICdzcGFjaW5nLWNvbnNpc3RlbmN5JyxcbiAgICAgICAgbWVzc2FnZTogYE5lYXItZHVwbGljYXRlIHNwYWNpbmc6ICR7dW5pcXVlW2ldfXB4IGFuZCAke3VuaXF1ZVtpICsgMV19cHggXHUyMDE0IGxpa2VseSBzYW1lIGludGVudD9gLFxuICAgICAgICBzZWN0aW9uTmFtZTogZnJhbWUubmFtZSxcbiAgICAgICAgc3VnZ2VzdGlvbjogYENvbnNpZGVyIHN0YW5kYXJkaXppbmcgdG8gJHtNYXRoLnJvdW5kKCh1bmlxdWVbaV0gKyB1bmlxdWVbaSArIDFdKSAvIDIpfXB4LmAsXG4gICAgICAgIGZpeEhpbnQ6IFtcbiAgICAgICAgICBgWW91IGhhdmUgJHt1bmlxdWVbaV19cHggYW5kICR7dW5pcXVlW2kgKyAxXX1weCB1c2VkIGFzIHNwYWNpbmcgXHUyMDE0IGxpa2VseSB0aGUgc2FtZSB2YWx1ZSBvZmYgYnkgMS0ycHguYCxcbiAgICAgICAgICBgUGljayBvbmUgdmFsdWUgKHN1Z2dlc3RlZDogJHtNYXRoLnJvdW5kKCh1bmlxdWVbaV0gKyB1bmlxdWVbaSArIDFdKSAvIDIpfXB4KSBhbmQgYXBwbHkgaXQgZXZlcnl3aGVyZS5gLFxuICAgICAgICAgICdCZXN0IHByYWN0aWNlOiBkZWZpbmUgYSBGaWdtYSBWYXJpYWJsZSBpbiBhIFwiU3BhY2luZ1wiIGNvbGxlY3Rpb24gKGUuZy4gc3BhY2luZy9tZCA9IDMyKSBhbmQgYmluZCBwYWRkaW5nL2dhcCB0byBpdC4nLFxuICAgICAgICAgICdWYXJpYWJsZXMgcHJvcGFnYXRlIG9uZSByZW5hbWUgYWNyb3NzIHRoZSB3aG9sZSBmaWxlIGFuZCBiZWNvbWUgQ1NTIGN1c3RvbSBwcm9wZXJ0aWVzIGluIHRoZSBleHBvcnQuJyxcbiAgICAgICAgICAnVGhpcyBpcyBpbmZvcm1hdGlvbmFsIG9ubHkgXHUyMDE0IGV4cG9ydCB3aWxsIHN0aWxsIHdvcmssIGJ1dCB0aGUgV29yZFByZXNzIHRoZW1lIHdpbGwgYmUgdGlkaWVyIHdpdGggY29uc2lzdGVudCB2YWx1ZXMuJyxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDU6IE92ZXJzaXplZCBJbWFnZXMgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrT3ZlcnNpemVkSW1hZ2VzKGZyYW1lOiBGcmFtZU5vZGUpOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmICgnZmlsbHMnIGluIG5vZGUpIHtcbiAgICAgIGNvbnN0IGZpbGxzID0gKG5vZGUgYXMgYW55KS5maWxscztcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGZpbGxzKSkge1xuICAgICAgICBmb3IgKGNvbnN0IGZpbGwgb2YgZmlsbHMpIHtcbiAgICAgICAgICBpZiAoZmlsbC50eXBlID09PSAnSU1BR0UnICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgICAgICAgIGlmIChib3VuZHMpIHtcbiAgICAgICAgICAgICAgLy8gRXN0aW1hdGUgcmF3IGltYWdlIHNpemUgKFJHQkEgYXQgMngpOiB3ICogMiAqIGggKiAyICogNCBieXRlc1xuICAgICAgICAgICAgICAvLyBFc3RpbWF0ZSBhdCAxeCBleHBvcnQ6IHdpZHRoICogaGVpZ2h0ICogNCAoUkdCQSBieXRlcylcbiAgICAgICAgICAgICAgY29uc3QgZXN0aW1hdGVkQnl0ZXMgPSBib3VuZHMud2lkdGggKiBib3VuZHMuaGVpZ2h0ICogNDtcbiAgICAgICAgICAgICAgY29uc3QgZXN0aW1hdGVkTUIgPSBlc3RpbWF0ZWRCeXRlcyAvICgxMDI0ICogMTAyNCk7XG4gICAgICAgICAgICAgIGlmIChlc3RpbWF0ZWRNQiA+IDUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgICAgICAgICAgICAgIGNoZWNrOiAnaW1hZ2Utc2l6ZScsXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgSW1hZ2UgaW4gXCIke25vZGUubmFtZX1cIiBpcyBlc3RpbWF0ZWQgYXQgJHtlc3RpbWF0ZWRNQi50b0ZpeGVkKDEpfU1CIGF0IDF4IGV4cG9ydC5gLFxuICAgICAgICAgICAgICAgICAgbm9kZUlkOiBub2RlLmlkLFxuICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgIHN1Z2dlc3Rpb246ICdDb25zaWRlciByZWR1Y2luZyBpbWFnZSBkaW1lbnNpb25zIG9yIGV4cG9ydCBzY2FsZS4nLFxuICAgICAgICAgICAgICAgICAgZml4SGludDogW1xuICAgICAgICAgICAgICAgICAgICBgSW1hZ2UgYm91bmRzOiAke01hdGgucm91bmQoYm91bmRzLndpZHRoKX1cdTAwRDcke01hdGgucm91bmQoYm91bmRzLmhlaWdodCl9cHggXHUyMDE0IHRoYXRcXCdzIHdoeSBpdFxcJ3MgaGVhdnkuYCxcbiAgICAgICAgICAgICAgICAgICAgJ1JlcGxhY2UgdGhlIHNvdXJjZSBpbWFnZSB3aXRoIGEgcHJlLWNvbXByZXNzZWQgdmVyc2lvbiAoVGlueVBORywgSW1hZ2VPcHRpbSwgU3F1b29zaCkuJyxcbiAgICAgICAgICAgICAgICAgICAgJ0ZvciBiYWNrZ3JvdW5kIGltYWdlcywgYSAxOTIwcHggb3IgMjU2MHB4IG1heCB3aWR0aCBpcyB1c3VhbGx5IGVub3VnaCBcdTIwMTQgYW55dGhpbmcgbGFyZ2VyIHdhc3RlcyBiYW5kd2lkdGguJyxcbiAgICAgICAgICAgICAgICAgICAgJ0lmIHRoZSBpbWFnZSB3aWxsIGJlIGNyb3BwZWQgYXQgcnVudGltZSwgZG93bnNjYWxlIEJFRk9SRSBwbGFjaW5nIGluIEZpZ21hLicsXG4gICAgICAgICAgICAgICAgICAgICdBZnRlciByZXBsYWNpbmcsIHJlLXJ1biB2YWxpZGF0aW9uIFx1MjAxNCB0aGUgd2FybmluZyBzaG91bGQgZGlzYXBwZWFyLicsXG4gICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2FsayhmcmFtZSk7XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgNjogT3ZlcmxhcHBpbmcgU2VjdGlvbnMgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrT3ZlcmxhcHMoc2VjdGlvbnM6IFNjZW5lTm9kZVtdLCBmcmFtZU5hbWU6IHN0cmluZyk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuICBjb25zdCBzb3J0ZWQgPSBbLi4uc2VjdGlvbnNdXG4gICAgLmZpbHRlcihzID0+IHMuYWJzb2x1dGVCb3VuZGluZ0JveClcbiAgICAuc29ydCgoYSwgYikgPT4gYS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gYi5hYnNvbHV0ZUJvdW5kaW5nQm94IS55KTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNvcnRlZC5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBjb25zdCBjdXJyID0gc29ydGVkW2ldLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IG5leHQgPSBzb3J0ZWRbaSArIDFdLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IG92ZXJsYXAgPSAoY3Vyci55ICsgY3Vyci5oZWlnaHQpIC0gbmV4dC55O1xuICAgIGlmIChvdmVybGFwID4gMCkge1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgICAgY2hlY2s6ICdvdmVybGFwJyxcbiAgICAgICAgbWVzc2FnZTogYFNlY3Rpb24gXCIke3NvcnRlZFtpXS5uYW1lfVwiIG92ZXJsYXBzIHdpdGggXCIke3NvcnRlZFtpICsgMV0ubmFtZX1cIiBieSAke01hdGgucm91bmQob3ZlcmxhcCl9cHguYCxcbiAgICAgICAgc2VjdGlvbk5hbWU6IHNvcnRlZFtpXS5uYW1lLFxuICAgICAgICBub2RlSWQ6IHNvcnRlZFtpXS5pZCxcbiAgICAgICAgc3VnZ2VzdGlvbjogJ1RoZSBwbHVnaW4gd2lsbCByZWNvcmQgdGhpcyBhcyBhIG5lZ2F0aXZlIG1hcmdpbi4gVmVyaWZ5IHRoZSB2aXN1YWwgcmVzdWx0LicsXG4gICAgICAgIGZpeEhpbnQ6IFtcbiAgICAgICAgICBgXCIke3NvcnRlZFtpXS5uYW1lfVwiIGV4dGVuZHMgJHtNYXRoLnJvdW5kKG92ZXJsYXApfXB4IGJlbG93IHdoZXJlIFwiJHtzb3J0ZWRbaSArIDFdLm5hbWV9XCIgc3RhcnRzLmAsXG4gICAgICAgICAgJ0lmIHRoaXMgaXMgaW50ZW50aW9uYWwgKGUuZy4gYSBjYXJkIG92ZXJsYXBzIHRoZSBuZXh0IHNlY3Rpb24gYnkgZGVzaWduKSwgbm8gYWN0aW9uIG5lZWRlZCBcdTIwMTQgdGhlIHBsdWdpbiBlbWl0cyBhIG5lZ2F0aXZlIG1hcmdpbi10b3AgYW5kIHotaW5kZXguJyxcbiAgICAgICAgICAnSWYgdW5pbnRlbnRpb25hbCwgZHJhZyBvbmUgb2YgdGhlIHNlY3Rpb25zIHNvIHRoZWlyIGJvdW5kaW5nIGJveGVzIGRvblxcJ3Qgb3ZlcmxhcCBvbiB0aGUgWSBheGlzLicsXG4gICAgICAgICAgJ1RpcDogaW4gRmlnbWEsIGhvbGRpbmcgU2hpZnQgd2hpbGUgZHJhZ2dpbmcgc25hcHMgdG8gaW50ZWdlciBZIHZhbHVlcy4nLFxuICAgICAgICAgICdBZnRlciBtb3ZpbmcsIHJlLXJ1biB2YWxpZGF0aW9uIHRvIGNvbmZpcm0uJyxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoZWNrIDc6IE1pc3NpbmcgUmVzcG9uc2l2ZSBGcmFtZXMgXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGNoZWNrUmVzcG9uc2l2ZUZyYW1lcyhmcmFtZUlkczogc3RyaW5nW10pOiBWYWxpZGF0aW9uUmVzdWx0W10ge1xuICBjb25zdCByZXN1bHRzOiBWYWxpZGF0aW9uUmVzdWx0W10gPSBbXTtcbiAgY29uc3QgZnJhbWVzID0gZnJhbWVJZHNcbiAgICAubWFwKGlkID0+IGZpZ21hLmdldE5vZGVCeUlkKGlkKSlcbiAgICAuZmlsdGVyKG4gPT4gbiAmJiBuLnR5cGUgPT09ICdGUkFNRScpIGFzIEZyYW1lTm9kZVtdO1xuXG4gIGNvbnN0IGRlc2t0b3BGcmFtZXMgPSBmcmFtZXMuZmlsdGVyKGYgPT4gZi53aWR0aCA+IDEwMjQpO1xuICBjb25zdCBtb2JpbGVGcmFtZXMgPSBmcmFtZXMuZmlsdGVyKGYgPT4gZi53aWR0aCA8PSA0ODApO1xuXG4gIGlmIChkZXNrdG9wRnJhbWVzLmxlbmd0aCA+IDAgJiYgbW9iaWxlRnJhbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgY2hlY2s6ICdyZXNwb25zaXZlJyxcbiAgICAgIG1lc3NhZ2U6IGBPbmx5IGRlc2t0b3AgZnJhbWVzIHNlbGVjdGVkIChubyBtb2JpbGUgZnJhbWVzKS4gUmVzcG9uc2l2ZSB2YWx1ZXMgd2lsbCBiZSBjYWxjdWxhdGVkLCBub3QgZXh0cmFjdGVkLmAsXG4gICAgICBzdWdnZXN0aW9uOiAnSW5jbHVkZSBtb2JpbGUgKDM3NXB4KSBmcmFtZXMgZm9yIGV4YWN0IHJlc3BvbnNpdmUgdmFsdWVzLicsXG4gICAgICBmaXhIaW50OiBbXG4gICAgICAgICdXaXRob3V0IGEgbW9iaWxlIGZyYW1lLCB0aGUgcGx1Z2luIGNhbiBvbmx5IGd1ZXNzIGF0IGhvdyB0aGUgZGVzaWduIGFkYXB0cyBiZWxvdyA3NjhweC4nLFxuICAgICAgICAnQmVzdCBwcmFjdGljZTogZGVzaWduIGF0IGxlYXN0IG9uZSBtb2JpbGUgZnJhbWUgKDM3NXB4IHdpZGUpIHBlciBwYWdlLicsXG4gICAgICAgICdOYW1lIGl0IGNvbnNpc3RlbnRseSB3aXRoIHRoZSBkZXNrdG9wIGNvdW50ZXJwYXJ0OiBlLmcuIFwiSG9tZSBcdTIwMTQgRGVza3RvcFwiICsgXCJIb21lIFx1MjAxNCBNb2JpbGVcIiBzbyB0aGUgcGx1Z2luIGNhbiBwYWlyIHRoZW0gYXV0b21hdGljYWxseS4nLFxuICAgICAgICAnVGhlbiBnbyBiYWNrIHRvIFN0ZXAgMSBhbmQgc2VsZWN0IGJvdGggZnJhbWVzIGJlZm9yZSByZS1ydW5uaW5nIHZhbGlkYXRpb24uJyxcbiAgICAgICAgJ1lvdSBjYW4gZXhwb3J0IGRlc2t0b3Atb25seSBcdTIwMTQgdGhlIGFnZW50IHdpbGwgZGVyaXZlIG1vYmlsZSBmcm9tIENTUy1kcml2ZW4gc2NhbGluZyBcdTIwMTQgYnV0IGV4dHJhY3RlZCB2YWx1ZXMgYXJlIGFsd2F5cyBtb3JlIGFjY3VyYXRlIHRoYW4gY2FsY3VsYXRlZCBvbmVzLicsXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hlY2sgOTogVGV4dCBPdmVyZmxvdyBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hlY2tUZXh0T3ZlcmZsb3coZnJhbWU6IEZyYW1lTm9kZSk6IFZhbGlkYXRpb25SZXN1bHRbXSB7XG4gIGNvbnN0IHJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnICYmIG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveCAmJiBub2RlLnBhcmVudCAmJiAnYWJzb2x1dGVCb3VuZGluZ0JveCcgaW4gbm9kZS5wYXJlbnQpIHtcbiAgICAgIGNvbnN0IHRleHRCb3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICBjb25zdCBwYXJlbnRCb3VuZHMgPSAobm9kZS5wYXJlbnQgYXMgRnJhbWVOb2RlKS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgaWYgKHBhcmVudEJvdW5kcykge1xuICAgICAgICBjb25zdCBvdmVyZmxvd1JpZ2h0ID0gKHRleHRCb3VuZHMueCArIHRleHRCb3VuZHMud2lkdGgpIC0gKHBhcmVudEJvdW5kcy54ICsgcGFyZW50Qm91bmRzLndpZHRoKTtcbiAgICAgICAgY29uc3Qgb3ZlcmZsb3dCb3R0b20gPSAodGV4dEJvdW5kcy55ICsgdGV4dEJvdW5kcy5oZWlnaHQpIC0gKHBhcmVudEJvdW5kcy55ICsgcGFyZW50Qm91bmRzLmhlaWdodCk7XG4gICAgICAgIGlmIChvdmVyZmxvd1JpZ2h0ID4gNSB8fCBvdmVyZmxvd0JvdHRvbSA+IDUpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgICAgICAgIGNoZWNrOiAndGV4dC1vdmVyZmxvdycsXG4gICAgICAgICAgICBtZXNzYWdlOiBgVGV4dCBcIiR7bm9kZS5uYW1lfVwiIG92ZXJmbG93cyBpdHMgY29udGFpbmVyIGJ5ICR7TWF0aC5tYXgoTWF0aC5yb3VuZChvdmVyZmxvd1JpZ2h0KSwgTWF0aC5yb3VuZChvdmVyZmxvd0JvdHRvbSkpfXB4LmAsXG4gICAgICAgICAgICBub2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgICBub2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgc3VnZ2VzdGlvbjogJ1Jlc2l6ZSB0aGUgdGV4dCBjb250YWluZXIgb3IgcmVkdWNlIHRleHQgY29udGVudC4nLFxuICAgICAgICAgICAgZml4SGludDogW1xuICAgICAgICAgICAgICAnVGhlIHRleHQgbm9kZVxcJ3MgYm91bmRpbmcgYm94IGV4dGVuZHMgcGFzdCBpdHMgcGFyZW50IFx1MjAxNCBjb250ZW50IHdpbGwgYmUgY3V0IG9mZiBpbiB0aGUgZXhwb3J0LicsXG4gICAgICAgICAgICAgICdPcHRpb24gMTogUmVzaXplIHRoZSBwYXJlbnQgZnJhbWUgc28gdGhlIHRleHQgZml0cy4nLFxuICAgICAgICAgICAgICAnT3B0aW9uIDI6IFNldCB0aGUgdGV4dFxcJ3MgXCJBdXRvLXJlc2l6ZVwiIHRvIFwiV2lkdGggYW5kIEhlaWdodFwiIG9yIFwiSGVpZ2h0XCIgc28gaXQgZ3Jvd3Mgd2l0aCB0aGUgY29udGVudC4nLFxuICAgICAgICAgICAgICAnT3B0aW9uIDM6IFNob3J0ZW4gdGhlIGNvcHkgaWYgaXRcXCdzIHBsYWNlaG9sZGVyIHRleHQuJyxcbiAgICAgICAgICAgICAgJ0luIGF1dG8tbGF5b3V0IGNvbnRhaW5lcnMsIGFsc28gZW5zdXJlIHRoZSB0ZXh0XFwncyBcIkZpbGwgY29udGFpbmVyXCIgb3B0aW9uIG1hdGNoZXMgdGhlIHBhcmVudFxcJ3MgZGlyZWN0aW9uLicsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2FsayhmcmFtZSk7XG4gIHJldHVybiByZXN1bHRzO1xufVxuIiwgIi8qKlxuICogQ29udmVydCBhIHNpbmdsZSBGaWdtYSAwLTEgZmxvYXQgY2hhbm5lbCB0byBhIDItZGlnaXQgaGV4IHN0cmluZy5cbiAqIFVzZXMgTWF0aC5yb3VuZCgpIGZvciBwcmVjaXNpb24gKE5PVCBNYXRoLmZsb29yKCkpLlxuICovXG5mdW5jdGlvbiBjaGFubmVsVG9IZXgodmFsdWU6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogMjU1KS50b1N0cmluZygxNikucGFkU3RhcnQoMiwgJzAnKS50b1VwcGVyQ2FzZSgpO1xufVxuXG4vKipcbiAqIENvbnZlcnQgRmlnbWEgUkdCICgwLTEgZmxvYXQpIHRvIDYtZGlnaXQgdXBwZXJjYXNlIEhFWC5cbiAqIHsgcjogMC4wODYsIGc6IDAuMjIsIGI6IDAuOTg0IH0gXHUyMTkyIFwiIzE2MzhGQlwiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZ2JUb0hleChjb2xvcjogeyByOiBudW1iZXI7IGc6IG51bWJlcjsgYjogbnVtYmVyIH0pOiBzdHJpbmcge1xuICByZXR1cm4gYCMke2NoYW5uZWxUb0hleChjb2xvci5yKX0ke2NoYW5uZWxUb0hleChjb2xvci5nKX0ke2NoYW5uZWxUb0hleChjb2xvci5iKX1gO1xufVxuXG4vKipcbiAqIENvbnZlcnQgRmlnbWEgUkdCQSAoMC0xIGZsb2F0KSB0byBIRVguXG4gKiBSZXR1cm5zIDYtZGlnaXQgSEVYIGlmIGZ1bGx5IG9wYXF1ZSwgOC1kaWdpdCBIRVggaWYgYWxwaGEgPCAxLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmdiYVRvSGV4KGNvbG9yOiB7IHI6IG51bWJlcjsgZzogbnVtYmVyOyBiOiBudW1iZXIgfSwgb3BhY2l0eTogbnVtYmVyID0gMSk6IHN0cmluZyB7XG4gIGNvbnN0IGJhc2UgPSByZ2JUb0hleChjb2xvcik7XG4gIGlmIChvcGFjaXR5ID49IDEpIHJldHVybiBiYXNlO1xuICByZXR1cm4gYCR7YmFzZX0ke2NoYW5uZWxUb0hleChvcGFjaXR5KX1gO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIHByaW1hcnkgYmFja2dyb3VuZCBjb2xvciBmcm9tIGEgbm9kZSdzIGZpbGxzLlxuICogUmV0dXJucyA2LzgtZGlnaXQgSEVYIG9yIG51bGwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0QmFja2dyb3VuZENvbG9yKG5vZGU6IFNjZW5lTm9kZSAmIHsgZmlsbHM/OiByZWFkb25seSBQYWludFtdIH0pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCEoJ2ZpbGxzJyBpbiBub2RlKSB8fCAhbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuIG51bGw7XG5cbiAgZm9yIChjb25zdCBmaWxsIG9mIG5vZGUuZmlsbHMpIHtcbiAgICBpZiAoZmlsbC50eXBlID09PSAnU09MSUQnICYmIGZpbGwudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IG9wYWNpdHkgPSBmaWxsLm9wYWNpdHkgIT09IHVuZGVmaW5lZCA/IGZpbGwub3BhY2l0eSA6IDE7XG4gICAgICByZXR1cm4gcmdiYVRvSGV4KGZpbGwuY29sb3IsIG9wYWNpdHkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSB0ZXh0IGNvbG9yIGZyb20gYSBURVhUIG5vZGUncyBmaWxscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUZXh0Q29sb3Iobm9kZTogVGV4dE5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFub2RlLmZpbGxzIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZmlsbHMpKSByZXR1cm4gbnVsbDtcblxuICBmb3IgKGNvbnN0IGZpbGwgb2Ygbm9kZS5maWxscyBhcyByZWFkb25seSBQYWludFtdKSB7XG4gICAgaWYgKGZpbGwudHlwZSA9PT0gJ1NPTElEJyAmJiBmaWxsLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gcmdiVG9IZXgoZmlsbC5jb2xvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIERlY29kZSB0aGUgQ1NTIGdyYWRpZW50IGFuZ2xlIGZyb20gRmlnbWEncyBgZ3JhZGllbnRUcmFuc2Zvcm1gIG1hdHJpeC5cbiAqXG4gKiBGaWdtYSdzIGdyYWRpZW50VHJhbnNmb3JtIGlzIGEgMlx1MDBENzMgYWZmaW5lIG1hdHJpeCB0aGF0IG1hcHMgYWN0dWFsXG4gKiBjb29yZGluYXRlcyBiYWNrIHRvIHRoZSB1bml0IGdyYWRpZW50IGxpbmUgKDAsMClcdTIxOTIoMSwwKS4gSW52ZXJ0aW5nIHRoZVxuICogbGluZWFyIHBhcnQgZ2l2ZXMgdGhlIGdyYWRpZW50IGRpcmVjdGlvbiBpbiBhY3R1YWwgY29vcmRpbmF0ZXMuIFdlIHRoZW5cbiAqIGNvbnZlcnQgdGhhdCB2ZWN0b3IgdG8gYSBDU1MgYW5nbGUsIHdoZXJlIDBkZWcgPSBcInRvIHRvcFwiIGFuZCBhbmdsZXNcbiAqIGluY3JlYXNlIGNsb2Nrd2lzZS5cbiAqXG4gKiBSZXR1cm5zIDE4MCAodGhlIENTUyBkZWZhdWx0IGZvciB0b3AtdG8tYm90dG9tKSB3aGVuIHRoZSBtYXRyaXggaXNcbiAqIGFic2VudCBvciBzaW5ndWxhciwgc28gb3V0cHV0IHN0YXlzIHNlbnNpYmxlIG9uIGVkZ2UtY2FzZSBmaWxscy5cbiAqL1xuZnVuY3Rpb24gZ3JhZGllbnRBbmdsZUZyb21UcmFuc2Zvcm0odDogbnVtYmVyW11bXSB8IHVuZGVmaW5lZCk6IG51bWJlciB7XG4gIGlmICghdCB8fCAhQXJyYXkuaXNBcnJheSh0KSB8fCB0Lmxlbmd0aCA8IDIpIHJldHVybiAxODA7XG4gIGNvbnN0IGEgPSB0WzBdWzBdLCBiID0gdFswXVsxXTtcbiAgY29uc3QgYyA9IHRbMV1bMF0sIGQgPSB0WzFdWzFdO1xuICBjb25zdCBkZXQgPSBhICogZCAtIGIgKiBjO1xuICBpZiAoTWF0aC5hYnMoZGV0KSA8IDFlLTkpIHJldHVybiAxODA7XG4gIC8vIERpcmVjdGlvbiB2ZWN0b3IgaW4gYWN0dWFsIGNvb3JkaW5hdGVzOiBpbnYobGluZWFyKSAqICgxLCAwKSA9IChkL2RldCwgLWMvZGV0KVxuICBjb25zdCB2eCA9IGQgLyBkZXQ7XG4gIGNvbnN0IHZ5ID0gLWMgLyBkZXQ7XG4gIC8vIENTUyBhbmdsZTogMGRlZyA9IHVwLCArOTAgPSByaWdodCwgKzE4MCA9IGRvd24uIGF0YW4yKHZ4LCAtdnkpIGdpdmVzIHRoYXQuXG4gIGxldCBkZWcgPSBNYXRoLmF0YW4yKHZ4LCAtdnkpICogKDE4MCAvIE1hdGguUEkpO1xuICBpZiAoZGVnIDwgMCkgZGVnICs9IDM2MDtcbiAgcmV0dXJuIE1hdGgucm91bmQoZGVnKTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IGdyYWRpZW50IGFzIENTUyBzdHJpbmcsIG9yIG51bGwgaWYgbm90IGEgZ3JhZGllbnQuXG4gKlxuICogU3VwcG9ydHMgbGluZWFyLCByYWRpYWwsIGFuZ3VsYXIgKENTUyBjb25pYy1ncmFkaWVudCksIGFuZCBkaWFtb25kXG4gKiAoYXBwcm94aW1hdGVkIHdpdGggcmFkaWFsLWdyYWRpZW50IFx1MjAxNCBubyBleGFjdCBDU1MgZXF1aXZhbGVudCkuIFRoZVxuICogYW5nbGUgb2YgbGluZWFyIGdyYWRpZW50cyBpcyBkZWNvZGVkIGZyb20gYGdyYWRpZW50VHJhbnNmb3JtYCwgc29cbiAqIGBsaW5lYXItZ3JhZGllbnQoNDVkZWcsIFx1MjAyNilgIGFuZCBgbGluZWFyLWdyYWRpZW50KDIyNWRlZywgXHUyMDI2KWAgbm9cbiAqIGxvbmdlciBjb2xsYXBzZSB0byB0aGUgZGVmYXVsdCBkaXJlY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0R3JhZGllbnQobm9kZTogU2NlbmVOb2RlICYgeyBmaWxscz86IHJlYWRvbmx5IFBhaW50W10gfSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoISgnZmlsbHMnIGluIG5vZGUpIHx8ICFub2RlLmZpbGxzIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZmlsbHMpKSByZXR1cm4gbnVsbDtcblxuICBmb3IgKGNvbnN0IGZpbGwgb2Ygbm9kZS5maWxscykge1xuICAgIGlmIChmaWxsLnZpc2libGUgPT09IGZhbHNlKSBjb250aW51ZTtcbiAgICBpZiAoZmlsbC50eXBlID09PSAnR1JBRElFTlRfTElORUFSJyB8fCBmaWxsLnR5cGUgPT09ICdHUkFESUVOVF9SQURJQUwnIHx8XG4gICAgICAgIGZpbGwudHlwZSA9PT0gJ0dSQURJRU5UX0FOR1VMQVInIHx8IGZpbGwudHlwZSA9PT0gJ0dSQURJRU5UX0RJQU1PTkQnKSB7XG4gICAgICBjb25zdCBnID0gZmlsbCBhcyBHcmFkaWVudFBhaW50O1xuICAgICAgY29uc3Qgc3RvcHMgPSBnLmdyYWRpZW50U3RvcHNcbiAgICAgICAgLm1hcChzID0+IGAke3JnYlRvSGV4KHMuY29sb3IpfSAke01hdGgucm91bmQocy5wb3NpdGlvbiAqIDEwMCl9JWApXG4gICAgICAgIC5qb2luKCcsICcpO1xuICAgICAgY29uc3Qgb3BhY2l0eSA9IChnIGFzIGFueSkub3BhY2l0eTtcbiAgICAgIGNvbnN0IHN0b3BzV2l0aEFscGhhID0gb3BhY2l0eSAhPT0gdW5kZWZpbmVkICYmIG9wYWNpdHkgPCAxXG4gICAgICAgID8gZy5ncmFkaWVudFN0b3BzLm1hcChzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGEgPSAocy5jb2xvci5hID8/IDEpICogb3BhY2l0eTtcbiAgICAgICAgICAgIHJldHVybiBgcmdiYSgke01hdGgucm91bmQocy5jb2xvci5yICogMjU1KX0sICR7TWF0aC5yb3VuZChzLmNvbG9yLmcgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKHMuY29sb3IuYiAqIDI1NSl9LCAke01hdGgucm91bmQoYSAqIDEwMCkgLyAxMDB9KSAke01hdGgucm91bmQocy5wb3NpdGlvbiAqIDEwMCl9JWA7XG4gICAgICAgICAgfSkuam9pbignLCAnKVxuICAgICAgICA6IHN0b3BzO1xuXG4gICAgICBzd2l0Y2ggKGZpbGwudHlwZSkge1xuICAgICAgICBjYXNlICdHUkFESUVOVF9MSU5FQVInOiB7XG4gICAgICAgICAgY29uc3QgYW5nbGUgPSBncmFkaWVudEFuZ2xlRnJvbVRyYW5zZm9ybSgoZyBhcyBhbnkpLmdyYWRpZW50VHJhbnNmb3JtKTtcbiAgICAgICAgICByZXR1cm4gYGxpbmVhci1ncmFkaWVudCgke2FuZ2xlfWRlZywgJHtzdG9wc1dpdGhBbHBoYX0pYDtcbiAgICAgICAgfVxuICAgICAgICBjYXNlICdHUkFESUVOVF9SQURJQUwnOlxuICAgICAgICAgIHJldHVybiBgcmFkaWFsLWdyYWRpZW50KCR7c3RvcHNXaXRoQWxwaGF9KWA7XG4gICAgICAgIGNhc2UgJ0dSQURJRU5UX0FOR1VMQVInOlxuICAgICAgICAgIC8vIEZpZ21hJ3MgYW5ndWxhciA9IENTUyBjb25pYy1ncmFkaWVudC4gVGhlIGBmcm9tYCBhbmdsZSBjb3VsZCBiZVxuICAgICAgICAgIC8vIGRlY29kZWQgZnJvbSBncmFkaWVudFRyYW5zZm9ybSB0b28sIGJ1dCBtb3N0IGFnZW50cyBhcmUgaGFwcHlcbiAgICAgICAgICAvLyB3aXRoIHRoZSBkZWZhdWx0IHN0YXJ0aW5nIGFuZ2xlLiBSZWZpbmUgaWYgbmVlZGVkLlxuICAgICAgICAgIHJldHVybiBgY29uaWMtZ3JhZGllbnQoJHtzdG9wc1dpdGhBbHBoYX0pYDtcbiAgICAgICAgY2FzZSAnR1JBRElFTlRfRElBTU9ORCc6XG4gICAgICAgICAgLy8gTm8gZXhhY3QgQ1NTIGVxdWl2YWxlbnQ7IGNsb3Nlc3QgaXMgcmFkaWFsLWdyYWRpZW50LiBBZ2VudCBzaG91bGRcbiAgICAgICAgICAvLyBiZSBhd2FyZSB0aGlzIGlzIGFuIGFwcHJveGltYXRpb24gKGRpYW1vbmQgXHUyMjYwIHJhZGlhbCBjaXJjbGUpLlxuICAgICAgICAgIHJldHVybiBgcmFkaWFsLWdyYWRpZW50KCR7c3RvcHNXaXRoQWxwaGF9KSAvKiBhcHByb3hpbWF0ZWQgZnJvbSBGaWdtYSBkaWFtb25kIGdyYWRpZW50ICovYDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogTWFwIEZpZ21hJ3Mgc3Ryb2tlQWxpZ24gKCdJTlNJREUnIHwgJ09VVFNJREUnIHwgJ0NFTlRFUicpIHRvIGEgbG93ZXJjYXNlXG4gKiBDU1MtZnJpZW5kbHkgdG9rZW4uIFJldHVybnMgbnVsbCB3aGVuIHRoZSBub2RlIGhhcyBubyByZXNvbHZhYmxlIHN0cm9rZUFsaWduLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFN0cm9rZUFsaWduKG5vZGU6IGFueSk6ICdpbnNpZGUnIHwgJ291dHNpZGUnIHwgJ2NlbnRlcicgfCBudWxsIHtcbiAgY29uc3QgcyA9IG5vZGU/LnN0cm9rZUFsaWduO1xuICBpZiAocyA9PT0gJ0lOU0lERScpIHJldHVybiAnaW5zaWRlJztcbiAgaWYgKHMgPT09ICdPVVRTSURFJykgcmV0dXJuICdvdXRzaWRlJztcbiAgaWYgKHMgPT09ICdDRU5URVInKSByZXR1cm4gJ2NlbnRlcic7XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIE1hcCBGaWdtYSdzIGJsZW5kTW9kZSB0byBDU1MgYG1peC1ibGVuZC1tb2RlYC4gUmV0dXJucyBudWxsIGZvciBOT1JNQUxcbiAqIGFuZCBQQVNTX1RIUk9VR0ggKHdoaWNoIGFyZSBDU1MgZGVmYXVsdHMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdE1peEJsZW5kTW9kZShub2RlOiBhbnkpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgYm0gPSBub2RlPy5ibGVuZE1vZGU7XG4gIGlmICghYm0gfHwgdHlwZW9mIGJtICE9PSAnc3RyaW5nJykgcmV0dXJuIG51bGw7XG4gIHN3aXRjaCAoYm0pIHtcbiAgICBjYXNlICdOT1JNQUwnOlxuICAgIGNhc2UgJ1BBU1NfVEhST1VHSCc6XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICBjYXNlICdNVUxUSVBMWSc6IHJldHVybiAnbXVsdGlwbHknO1xuICAgIGNhc2UgJ1NDUkVFTic6IHJldHVybiAnc2NyZWVuJztcbiAgICBjYXNlICdPVkVSTEFZJzogcmV0dXJuICdvdmVybGF5JztcbiAgICBjYXNlICdEQVJLRU4nOiByZXR1cm4gJ2Rhcmtlbic7XG4gICAgY2FzZSAnTElHSFRFTic6IHJldHVybiAnbGlnaHRlbic7XG4gICAgY2FzZSAnQ09MT1JfRE9ER0UnOiByZXR1cm4gJ2NvbG9yLWRvZGdlJztcbiAgICBjYXNlICdDT0xPUl9CVVJOJzogcmV0dXJuICdjb2xvci1idXJuJztcbiAgICBjYXNlICdIQVJEX0xJR0hUJzogcmV0dXJuICdoYXJkLWxpZ2h0JztcbiAgICBjYXNlICdTT0ZUX0xJR0hUJzogcmV0dXJuICdzb2Z0LWxpZ2h0JztcbiAgICBjYXNlICdESUZGRVJFTkNFJzogcmV0dXJuICdkaWZmZXJlbmNlJztcbiAgICBjYXNlICdFWENMVVNJT04nOiByZXR1cm4gJ2V4Y2x1c2lvbic7XG4gICAgY2FzZSAnSFVFJzogcmV0dXJuICdodWUnO1xuICAgIGNhc2UgJ1NBVFVSQVRJT04nOiByZXR1cm4gJ3NhdHVyYXRpb24nO1xuICAgIGNhc2UgJ0NPTE9SJzogcmV0dXJuICdjb2xvcic7XG4gICAgY2FzZSAnTFVNSU5PU0lUWSc6IHJldHVybiAnbHVtaW5vc2l0eSc7XG4gICAgLy8gQXBwcm94aW1hdGlvbnMgXHUyMDE0IG5vIGRpcmVjdCBDU1MgZXF1aXZhbGVudFxuICAgIGNhc2UgJ0xJTkVBUl9CVVJOJzogcmV0dXJuICdtdWx0aXBseSc7XG4gICAgY2FzZSAnTElORUFSX0RPREdFJzogcmV0dXJuICdzY3JlZW4nO1xuICAgIGRlZmF1bHQ6IHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBub2RlIGhhcyBhbiBJTUFHRSBmaWxsIChwaG90b2dyYXBoL2JhY2tncm91bmQpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzSW1hZ2VGaWxsKG5vZGU6IFNjZW5lTm9kZSAmIHsgZmlsbHM/OiByZWFkb25seSBQYWludFtdIH0pOiBib29sZWFuIHtcbiAgaWYgKCEoJ2ZpbGxzJyBpbiBub2RlKSB8fCAhbm9kZS5maWxscyB8fCAhQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gbm9kZS5maWxscy5zb21lKGYgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpO1xufVxuXG4vKipcbiAqIE1hcCBGaWdtYSBzdHJva2VBbGlnbiB0byBhIHN1aXRhYmxlIENTUyBib3JkZXItc3R5bGUuXG4gKiBGaWdtYSBzdXBwb3J0cyBzb2xpZCBzdHJva2VzIG5hdGl2ZWx5OyBkYXNoZWQgaXMgaW5mZXJyZWQgZnJvbSBkYXNoUGF0dGVybi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RCb3JkZXJTdHlsZShub2RlOiBhbnkpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCEoJ3N0cm9rZXMnIGluIG5vZGUpIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuc3Ryb2tlcykgfHwgbm9kZS5zdHJva2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGRhc2hQYXR0ZXJuID0gKG5vZGUgYXMgYW55KS5kYXNoUGF0dGVybjtcbiAgaWYgKEFycmF5LmlzQXJyYXkoZGFzaFBhdHRlcm4pICYmIGRhc2hQYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAvLyAxLXVuaXQgZGFzaGVzID0gZG90dGVkLCBsYXJnZXIgPSBkYXNoZWRcbiAgICBjb25zdCBtYXggPSBNYXRoLm1heCguLi5kYXNoUGF0dGVybik7XG4gICAgcmV0dXJuIG1heCA8PSAyID8gJ2RvdHRlZCcgOiAnZGFzaGVkJztcbiAgfVxuICByZXR1cm4gJ3NvbGlkJztcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHBlci1zaWRlIGJvcmRlci13aWR0aC4gRmlnbWEncyBpbmRpdmlkdWFsU3Ryb2tlV2VpZ2h0cyAoaWYgc2V0KVxuICogcHJvdmlkZXMgcGVyLXNpZGUgd2lkdGhzOyBvdGhlcndpc2Ugc3Ryb2tlV2VpZ2h0IGlzIHVuaWZvcm0uXG4gKiBSZXR1cm5zIG51bGwgZm9yIGFueSBzaWRlIHRoYXQgaXMgMC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RCb3JkZXJXaWR0aHMobm9kZTogYW55KToge1xuICB0b3A6IG51bWJlciB8IG51bGw7IHJpZ2h0OiBudW1iZXIgfCBudWxsOyBib3R0b206IG51bWJlciB8IG51bGw7IGxlZnQ6IG51bWJlciB8IG51bGw7IHVuaWZvcm06IG51bWJlciB8IG51bGw7XG59IHtcbiAgY29uc3QgaW5kID0gKG5vZGUgYXMgYW55KS5pbmRpdmlkdWFsU3Ryb2tlV2VpZ2h0cztcbiAgaWYgKGluZCAmJiB0eXBlb2YgaW5kID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB7XG4gICAgICB0b3A6IGluZC50b3AgfHwgbnVsbCxcbiAgICAgIHJpZ2h0OiBpbmQucmlnaHQgfHwgbnVsbCxcbiAgICAgIGJvdHRvbTogaW5kLmJvdHRvbSB8fCBudWxsLFxuICAgICAgbGVmdDogaW5kLmxlZnQgfHwgbnVsbCxcbiAgICAgIHVuaWZvcm06IG51bGwsXG4gICAgfTtcbiAgfVxuICBjb25zdCB3ID0gKG5vZGUgYXMgYW55KS5zdHJva2VXZWlnaHQ7XG4gIGlmICh0eXBlb2YgdyA9PT0gJ251bWJlcicgJiYgdyA+IDApIHtcbiAgICByZXR1cm4geyB0b3A6IG51bGwsIHJpZ2h0OiBudWxsLCBib3R0b206IG51bGwsIGxlZnQ6IG51bGwsIHVuaWZvcm06IHcgfTtcbiAgfVxuICByZXR1cm4geyB0b3A6IG51bGwsIHJpZ2h0OiBudWxsLCBib3R0b206IG51bGwsIGxlZnQ6IG51bGwsIHVuaWZvcm06IG51bGwgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSBmaXJzdCB2aXNpYmxlIFNPTElEIHN0cm9rZSBjb2xvciBhcyBoZXguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0U3Ryb2tlQ29sb3Iobm9kZTogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghKCdzdHJva2VzJyBpbiBub2RlKSB8fCAhQXJyYXkuaXNBcnJheShub2RlLnN0cm9rZXMpKSByZXR1cm4gbnVsbDtcbiAgZm9yIChjb25zdCBzdHJva2Ugb2Ygbm9kZS5zdHJva2VzKSB7XG4gICAgaWYgKHN0cm9rZS50eXBlID09PSAnU09MSUQnICYmIHN0cm9rZS52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIHJnYlRvSGV4KHN0cm9rZS5jb2xvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENvbGxlY3QgYWxsIHVuaXF1ZSBjb2xvcnMgZnJvbSBhIG5vZGUgdHJlZS5cbiAqIFJldHVybnMgYSBtYXAgb2YgSEVYIFx1MjE5MiB1c2FnZSBjb3VudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RDb2xvcnMocm9vdDogU2NlbmVOb2RlKTogUmVjb3JkPHN0cmluZywgbnVtYmVyPiB7XG4gIGNvbnN0IGNvbG9yczogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgLy8gRmlsbHNcbiAgICBpZiAoJ2ZpbGxzJyBpbiBub2RlICYmIG5vZGUuZmlsbHMgJiYgQXJyYXkuaXNBcnJheShub2RlLmZpbGxzKSkge1xuICAgICAgZm9yIChjb25zdCBmaWxsIG9mIG5vZGUuZmlsbHMpIHtcbiAgICAgICAgaWYgKGZpbGwudHlwZSA9PT0gJ1NPTElEJyAmJiBmaWxsLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgY29uc3QgaGV4ID0gcmdiVG9IZXgoZmlsbC5jb2xvcik7XG4gICAgICAgICAgY29sb3JzW2hleF0gPSAoY29sb3JzW2hleF0gfHwgMCkgKyAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFN0cm9rZXNcbiAgICBpZiAoJ3N0cm9rZXMnIGluIG5vZGUgJiYgbm9kZS5zdHJva2VzICYmIEFycmF5LmlzQXJyYXkobm9kZS5zdHJva2VzKSkge1xuICAgICAgZm9yIChjb25zdCBzdHJva2Ugb2Ygbm9kZS5zdHJva2VzKSB7XG4gICAgICAgIGlmIChzdHJva2UudHlwZSA9PT0gJ1NPTElEJyAmJiBzdHJva2UudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBjb25zdCBoZXggPSByZ2JUb0hleChzdHJva2UuY29sb3IpO1xuICAgICAgICAgIGNvbG9yc1toZXhdID0gKGNvbG9yc1toZXhdIHx8IDApICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZWN1cnNlXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdhbGsocm9vdCk7XG4gIHJldHVybiBjb2xvcnM7XG59XG4iLCAiLyoqXG4gKiBFeHRyYWN0IEZpZ21hIEVmZmVjdHMgKHNoYWRvd3MsIGJsdXJzKSBpbnRvIENTUy1yZWFkeSB2YWx1ZXMuXG4gKlxuICogRmlnbWEgc3VwcG9ydHMgYW4gYXJyYXkgb2YgZWZmZWN0cyBwZXIgbm9kZS4gV2UgbWFwOlxuICogICBEUk9QX1NIQURPVyAgXHUyMTkyIGJveC1zaGFkb3cgKG11bHRpcGxlIGFsbG93ZWQsIGNvbW1hLXNlcGFyYXRlZClcbiAqICAgSU5ORVJfU0hBRE9XIFx1MjE5MiBib3gtc2hhZG93IHdpdGggYGluc2V0YCBrZXl3b3JkXG4gKiAgIExBWUVSX0JMVVIgICBcdTIxOTIgZmlsdGVyOiBibHVyKE5weClcbiAqICAgQkFDS0dST1VORF9CTFVSIFx1MjE5MiBiYWNrZHJvcC1maWx0ZXI6IGJsdXIoTnB4KVxuICpcbiAqIFRFWFQgbm9kZXMgZ2V0IHRoZWlyIERST1BfU0hBRE9XIG1hcHBlZCB0byBDU1MgdGV4dC1zaGFkb3cgaW5zdGVhZCBvZlxuICogYm94LXNoYWRvdyAoRE9NIHJlbmRlcmluZzogdGV4dCBub2RlcyBkb24ndCBob25vciBib3gtc2hhZG93IG9uIHRoZVxuICogZ2x5cGhzIHRoZW1zZWx2ZXMpLlxuICovXG5cbmZ1bmN0aW9uIHJnYmFTdHJpbmcoY29sb3I6IHsgcjogbnVtYmVyOyBnOiBudW1iZXI7IGI6IG51bWJlcjsgYT86IG51bWJlciB9KTogc3RyaW5nIHtcbiAgY29uc3QgYSA9IGNvbG9yLmEgIT09IHVuZGVmaW5lZCA/IE1hdGgucm91bmQoY29sb3IuYSAqIDEwMCkgLyAxMDAgOiAxO1xuICByZXR1cm4gYHJnYmEoJHtNYXRoLnJvdW5kKGNvbG9yLnIgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGNvbG9yLmcgKiAyNTUpfSwgJHtNYXRoLnJvdW5kKGNvbG9yLmIgKiAyNTUpfSwgJHthfSlgO1xufVxuXG5mdW5jdGlvbiBzaGFkb3dUb0NzcyhlOiBEcm9wU2hhZG93RWZmZWN0IHwgSW5uZXJTaGFkb3dFZmZlY3QsIGluc2V0OiBib29sZWFuKTogc3RyaW5nIHtcbiAgY29uc3QgeCA9IE1hdGgucm91bmQoZS5vZmZzZXQueCk7XG4gIGNvbnN0IHkgPSBNYXRoLnJvdW5kKGUub2Zmc2V0LnkpO1xuICBjb25zdCBibHVyID0gTWF0aC5yb3VuZChlLnJhZGl1cyk7XG4gIGNvbnN0IHNwcmVhZCA9IE1hdGgucm91bmQoKGUgYXMgYW55KS5zcHJlYWQgfHwgMCk7XG4gIGNvbnN0IGNvbG9yID0gcmdiYVN0cmluZyhlLmNvbG9yKTtcbiAgY29uc3QgcHJlZml4ID0gaW5zZXQgPyAnaW5zZXQgJyA6ICcnO1xuICByZXR1cm4gYCR7cHJlZml4fSR7eH1weCAke3l9cHggJHtibHVyfXB4ICR7c3ByZWFkfXB4ICR7Y29sb3J9YDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeHRyYWN0ZWRFZmZlY3RzIHtcbiAgYm94U2hhZG93OiBzdHJpbmcgfCBudWxsOyAgICAgLy8gY29tbWEtc2VwYXJhdGVkIENTUyB2YWx1ZSBmb3IgbXVsdGlwbGUgc2hhZG93c1xuICB0ZXh0U2hhZG93OiBzdHJpbmcgfCBudWxsOyAgICAvLyBmb3IgVEVYVCBub2RlcyAoRFJPUF9TSEFET1cgb24gdGV4dCBiZWNvbWVzIHRleHQtc2hhZG93KVxuICBmaWx0ZXI6IHN0cmluZyB8IG51bGw7ICAgICAgICAvLyBMQVlFUl9CTFVSIFx1MjE5MiBibHVyKE5weCksIGV4dGVuZGFibGVcbiAgYmFja2Ryb3BGaWx0ZXI6IHN0cmluZyB8IG51bGw7IC8vIEJBQ0tHUk9VTkRfQkxVUiBcdTIxOTIgYmx1cihOcHgpXG59XG5cbi8qKlxuICogRXh0cmFjdCBhbGwgZWZmZWN0cyBmcm9tIGEgbm9kZSBhbmQgcmV0dXJuIENTUy1yZWFkeSB2YWx1ZXMuXG4gKiBSZXNwZWN0cyBGaWdtYSdzIHZpc2libGUgZmxhZzsgc2tpcHMgaGlkZGVuIGVmZmVjdHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0RWZmZWN0cyhcbiAgbm9kZTogeyBlZmZlY3RzPzogcmVhZG9ubHkgRWZmZWN0W107IHR5cGU/OiBzdHJpbmcgfSxcbik6IEV4dHJhY3RlZEVmZmVjdHMge1xuICBjb25zdCByZXN1bHQ6IEV4dHJhY3RlZEVmZmVjdHMgPSB7XG4gICAgYm94U2hhZG93OiBudWxsLFxuICAgIHRleHRTaGFkb3c6IG51bGwsXG4gICAgZmlsdGVyOiBudWxsLFxuICAgIGJhY2tkcm9wRmlsdGVyOiBudWxsLFxuICB9O1xuXG4gIGlmICghbm9kZS5lZmZlY3RzIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZWZmZWN0cykgfHwgbm9kZS5lZmZlY3RzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBjb25zdCBpc1RleHQgPSBub2RlLnR5cGUgPT09ICdURVhUJztcbiAgY29uc3Qgc2hhZG93U3RyaW5nczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgdGV4dFNoYWRvd1N0cmluZ3M6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGZpbHRlclBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBiYWNrZHJvcFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgZWZmZWN0IG9mIG5vZGUuZWZmZWN0cykge1xuICAgIGlmIChlZmZlY3QudmlzaWJsZSA9PT0gZmFsc2UpIGNvbnRpbnVlO1xuXG4gICAgaWYgKGVmZmVjdC50eXBlID09PSAnRFJPUF9TSEFET1cnKSB7XG4gICAgICBjb25zdCBlID0gZWZmZWN0IGFzIERyb3BTaGFkb3dFZmZlY3Q7XG4gICAgICBpZiAoaXNUZXh0KSB7XG4gICAgICAgIC8vIHRleHQtc2hhZG93IGZvcm1hdDogPHg+IDx5PiA8Ymx1cj4gPGNvbG9yPiAobm8gc3ByZWFkKVxuICAgICAgICBjb25zdCB4ID0gTWF0aC5yb3VuZChlLm9mZnNldC54KTtcbiAgICAgICAgY29uc3QgeSA9IE1hdGgucm91bmQoZS5vZmZzZXQueSk7XG4gICAgICAgIGNvbnN0IGJsdXIgPSBNYXRoLnJvdW5kKGUucmFkaXVzKTtcbiAgICAgICAgdGV4dFNoYWRvd1N0cmluZ3MucHVzaChgJHt4fXB4ICR7eX1weCAke2JsdXJ9cHggJHtyZ2JhU3RyaW5nKGUuY29sb3IpfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2hhZG93U3RyaW5ncy5wdXNoKHNoYWRvd1RvQ3NzKGUsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlZmZlY3QudHlwZSA9PT0gJ0lOTkVSX1NIQURPVycpIHtcbiAgICAgIGNvbnN0IGUgPSBlZmZlY3QgYXMgSW5uZXJTaGFkb3dFZmZlY3Q7XG4gICAgICAvLyBJTk5FUl9TSEFET1cgb24gVEVYVCBpc24ndCBhIHRoaW5nIGluIENTUyBcdTIwMTQgZmFsbCBiYWNrIHRvIGVtcHR5IGZvciB0ZXh0XG4gICAgICBpZiAoIWlzVGV4dCkgc2hhZG93U3RyaW5ncy5wdXNoKHNoYWRvd1RvQ3NzKGUsIHRydWUpKTtcbiAgICB9IGVsc2UgaWYgKGVmZmVjdC50eXBlID09PSAnTEFZRVJfQkxVUicpIHtcbiAgICAgIGNvbnN0IGUgPSBlZmZlY3QgYXMgQmx1ckVmZmVjdDtcbiAgICAgIGZpbHRlclBhcnRzLnB1c2goYGJsdXIoJHtNYXRoLnJvdW5kKGUucmFkaXVzKX1weClgKTtcbiAgICB9IGVsc2UgaWYgKGVmZmVjdC50eXBlID09PSAnQkFDS0dST1VORF9CTFVSJykge1xuICAgICAgY29uc3QgZSA9IGVmZmVjdCBhcyBCbHVyRWZmZWN0O1xuICAgICAgYmFja2Ryb3BQYXJ0cy5wdXNoKGBibHVyKCR7TWF0aC5yb3VuZChlLnJhZGl1cyl9cHgpYCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHNoYWRvd1N0cmluZ3MubGVuZ3RoID4gMCkgcmVzdWx0LmJveFNoYWRvdyA9IHNoYWRvd1N0cmluZ3Muam9pbignLCAnKTtcbiAgaWYgKHRleHRTaGFkb3dTdHJpbmdzLmxlbmd0aCA+IDApIHJlc3VsdC50ZXh0U2hhZG93ID0gdGV4dFNoYWRvd1N0cmluZ3Muam9pbignLCAnKTtcbiAgaWYgKGZpbHRlclBhcnRzLmxlbmd0aCA+IDApIHJlc3VsdC5maWx0ZXIgPSBmaWx0ZXJQYXJ0cy5qb2luKCcgJyk7XG4gIGlmIChiYWNrZHJvcFBhcnRzLmxlbmd0aCA+IDApIHJlc3VsdC5iYWNrZHJvcEZpbHRlciA9IGJhY2tkcm9wUGFydHMuam9pbignICcpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iLCAiaW1wb3J0IHsgRWxlbWVudFN0eWxlcywgVGV4dFNlZ21lbnQgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHRvQ3NzVmFsdWUgfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7IGV4dHJhY3RUZXh0Q29sb3IsIHJnYlRvSGV4IH0gZnJvbSAnLi9jb2xvcic7XG5pbXBvcnQgeyBleHRyYWN0RWZmZWN0cyB9IGZyb20gJy4vZWZmZWN0cyc7XG5cbi8qKlxuICogRGVyaXZlIENTUyBmb250LXdlaWdodCBmcm9tIGEgRmlnbWEgZm9udCBzdHlsZSBuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9udFdlaWdodEZyb21TdHlsZShzdHlsZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgY29uc3QgcyA9IHN0eWxlLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChzLmluY2x1ZGVzKCd0aGluJykgfHwgcy5pbmNsdWRlcygnaGFpcmxpbmUnKSkgcmV0dXJuIDEwMDtcbiAgaWYgKHMuaW5jbHVkZXMoJ2V4dHJhbGlnaHQnKSB8fCBzLmluY2x1ZGVzKCd1bHRyYSBsaWdodCcpIHx8IHMuaW5jbHVkZXMoJ2V4dHJhIGxpZ2h0JykpIHJldHVybiAyMDA7XG4gIGlmIChzLmluY2x1ZGVzKCdsaWdodCcpKSByZXR1cm4gMzAwO1xuICBpZiAocy5pbmNsdWRlcygnbWVkaXVtJykpIHJldHVybiA1MDA7XG4gIGlmIChzLmluY2x1ZGVzKCdzZW1pYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ3NlbWkgYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ2RlbWkgYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ2RlbWlib2xkJykpIHJldHVybiA2MDA7XG4gIGlmIChzLmluY2x1ZGVzKCdleHRyYWJvbGQnKSB8fCBzLmluY2x1ZGVzKCdleHRyYSBib2xkJykgfHwgcy5pbmNsdWRlcygndWx0cmEgYm9sZCcpIHx8IHMuaW5jbHVkZXMoJ3VsdHJhYm9sZCcpKSByZXR1cm4gODAwO1xuICBpZiAocy5pbmNsdWRlcygnYmxhY2snKSB8fCBzLmluY2x1ZGVzKCdoZWF2eScpKSByZXR1cm4gOTAwO1xuICBpZiAocy5pbmNsdWRlcygnYm9sZCcpKSByZXR1cm4gNzAwO1xuICByZXR1cm4gNDAwOyAvLyBSZWd1bGFyIC8gTm9ybWFsIC8gQm9va1xufVxuXG4vKipcbiAqIE1hcCBGaWdtYSB0ZXh0IGFsaWdubWVudCB0byBDU1MgdGV4dC1hbGlnbiB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gbWFwVGV4dEFsaWduKGFsaWduOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgc3dpdGNoIChhbGlnbikge1xuICAgIGNhc2UgJ0xFRlQnOiByZXR1cm4gJ2xlZnQnO1xuICAgIGNhc2UgJ0NFTlRFUic6IHJldHVybiAnY2VudGVyJztcbiAgICBjYXNlICdSSUdIVCc6IHJldHVybiAncmlnaHQnO1xuICAgIGNhc2UgJ0pVU1RJRklFRCc6IHJldHVybiAnanVzdGlmeSc7XG4gICAgZGVmYXVsdDogcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXAgRmlnbWEgdGV4dCBjYXNlIHRvIENTUyB0ZXh0LXRyYW5zZm9ybSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gbWFwVGV4dENhc2UodGV4dENhc2U6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBzd2l0Y2ggKHRleHRDYXNlKSB7XG4gICAgY2FzZSAnVVBQRVInOiByZXR1cm4gJ3VwcGVyY2FzZSc7XG4gICAgY2FzZSAnTE9XRVInOiByZXR1cm4gJ2xvd2VyY2FzZSc7XG4gICAgY2FzZSAnVElUTEUnOiByZXR1cm4gJ2NhcGl0YWxpemUnO1xuICAgIGNhc2UgJ09SSUdJTkFMJzpcbiAgICBkZWZhdWx0OiByZXR1cm4gJ25vbmUnO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdCB0eXBvZ3JhcGh5IHN0eWxlcyBmcm9tIGEgVEVYVCBub2RlLlxuICogUmV0dXJucyBDU1MtcmVhZHkgdmFsdWVzIHdpdGggdW5pdHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VHlwb2dyYXBoeShub2RlOiBUZXh0Tm9kZSk6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4ge1xuICBjb25zdCBzdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7fTtcblxuICAvLyBGb250IGZhbWlseSBcdTIwMTQgaGFuZGxlIG1peGVkIGZvbnRzICh1c2UgZmlyc3Qgc2VnbWVudClcbiAgY29uc3QgZm9udE5hbWUgPSBub2RlLmZvbnROYW1lO1xuICBpZiAoZm9udE5hbWUgIT09IGZpZ21hLm1peGVkICYmIGZvbnROYW1lKSB7XG4gICAgc3R5bGVzLmZvbnRGYW1pbHkgPSBmb250TmFtZS5mYW1pbHk7XG4gICAgc3R5bGVzLmZvbnRXZWlnaHQgPSBmb250V2VpZ2h0RnJvbVN0eWxlKGZvbnROYW1lLnN0eWxlKTtcbiAgfVxuXG4gIC8vIEZvbnQgc2l6ZVxuICBjb25zdCBmb250U2l6ZSA9IG5vZGUuZm9udFNpemU7XG4gIGlmIChmb250U2l6ZSAhPT0gZmlnbWEubWl4ZWQgJiYgdHlwZW9mIGZvbnRTaXplID09PSAnbnVtYmVyJykge1xuICAgIHN0eWxlcy5mb250U2l6ZSA9IHRvQ3NzVmFsdWUoZm9udFNpemUpO1xuICB9XG5cbiAgLy8gTGluZSBoZWlnaHRcbiAgY29uc3QgbGggPSBub2RlLmxpbmVIZWlnaHQ7XG4gIGlmIChsaCAhPT0gZmlnbWEubWl4ZWQgJiYgbGgpIHtcbiAgICBpZiAobGgudW5pdCA9PT0gJ1BJWEVMUycpIHtcbiAgICAgIHN0eWxlcy5saW5lSGVpZ2h0ID0gdG9Dc3NWYWx1ZShsaC52YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChsaC51bml0ID09PSAnUEVSQ0VOVCcpIHtcbiAgICAgIHN0eWxlcy5saW5lSGVpZ2h0ID0gYCR7TWF0aC5yb3VuZChsaC52YWx1ZSl9JWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFVVE8gXHUyMDE0IGRlcml2ZSBmcm9tIGZvbnQgc2l6ZVxuICAgICAgc3R5bGVzLmxpbmVIZWlnaHQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIExldHRlciBzcGFjaW5nXG4gIGNvbnN0IGxzID0gbm9kZS5sZXR0ZXJTcGFjaW5nO1xuICBpZiAobHMgIT09IGZpZ21hLm1peGVkICYmIGxzKSB7XG4gICAgaWYgKGxzLnVuaXQgPT09ICdQSVhFTFMnKSB7XG4gICAgICBzdHlsZXMubGV0dGVyU3BhY2luZyA9IHRvQ3NzVmFsdWUobHMudmFsdWUpO1xuICAgIH0gZWxzZSBpZiAobHMudW5pdCA9PT0gJ1BFUkNFTlQnKSB7XG4gICAgICAvLyBDb252ZXJ0IHBlcmNlbnRhZ2UgdG8gZW0gKEZpZ21hJ3MgMTAwJSA9IDFlbSlcbiAgICAgIGNvbnN0IGVtVmFsdWUgPSBNYXRoLnJvdW5kKChscy52YWx1ZSAvIDEwMCkgKiAxMDApIC8gMTAwO1xuICAgICAgc3R5bGVzLmxldHRlclNwYWNpbmcgPSBgJHtlbVZhbHVlfWVtYDtcbiAgICB9XG4gIH1cblxuICAvLyBUZXh0IHRyYW5zZm9ybVxuICBjb25zdCB0ZXh0Q2FzZSA9IG5vZGUudGV4dENhc2U7XG4gIGlmICh0ZXh0Q2FzZSAhPT0gZmlnbWEubWl4ZWQpIHtcbiAgICBzdHlsZXMudGV4dFRyYW5zZm9ybSA9IG1hcFRleHRDYXNlKHRleHRDYXNlIGFzIHN0cmluZyk7XG4gIH1cblxuICAvLyBUZXh0IGFsaWdubWVudFxuICBjb25zdCB0ZXh0QWxpZ24gPSBub2RlLnRleHRBbGlnbkhvcml6b250YWw7XG4gIGlmICh0ZXh0QWxpZ24pIHtcbiAgICBzdHlsZXMudGV4dEFsaWduID0gbWFwVGV4dEFsaWduKHRleHRBbGlnbik7XG4gIH1cblxuICAvLyBUZXh0IGRlY29yYXRpb24gKHVuZGVybGluZSAvIGxpbmUtdGhyb3VnaCAvIG5vbmUpXG4gIGNvbnN0IHRkID0gKG5vZGUgYXMgYW55KS50ZXh0RGVjb3JhdGlvbjtcbiAgaWYgKHRkICE9PSB1bmRlZmluZWQgJiYgdGQgIT09IGZpZ21hLm1peGVkKSB7XG4gICAgaWYgKHRkID09PSAnVU5ERVJMSU5FJykgc3R5bGVzLnRleHREZWNvcmF0aW9uID0gJ3VuZGVybGluZSc7XG4gICAgZWxzZSBpZiAodGQgPT09ICdTVFJJS0VUSFJPVUdIJykgc3R5bGVzLnRleHREZWNvcmF0aW9uID0gJ2xpbmUtdGhyb3VnaCc7XG4gICAgZWxzZSBzdHlsZXMudGV4dERlY29yYXRpb24gPSBudWxsO1xuICB9XG5cbiAgLy8gQ29sb3JcbiAgc3R5bGVzLmNvbG9yID0gZXh0cmFjdFRleHRDb2xvcihub2RlKTtcblxuICAvLyBUZXh0LXNoYWRvdyBmcm9tIERST1BfU0hBRE9XIGVmZmVjdHMgb24gVEVYVCBub2Rlc1xuICBjb25zdCBlZmZlY3RzID0gZXh0cmFjdEVmZmVjdHMobm9kZSk7XG4gIGlmIChlZmZlY3RzLnRleHRTaGFkb3cpIHN0eWxlcy50ZXh0U2hhZG93ID0gZWZmZWN0cy50ZXh0U2hhZG93O1xuXG4gIC8vIEZpZ21hIFRleHQgU3R5bGUgcmVmZXJlbmNlIChkZXNpZ24gdG9rZW4gZm9yIHR5cG9ncmFwaHkpXG4gIGNvbnN0IHN0eWxlTmFtZSA9IGV4dHJhY3RUZXh0U3R5bGVOYW1lKG5vZGUpO1xuICBpZiAoc3R5bGVOYW1lKSBzdHlsZXMudGV4dFN0eWxlTmFtZSA9IHN0eWxlTmFtZTtcblxuICAvLyBTdHlsZWQgdGV4dCBzZWdtZW50cyBcdTIwMTQgb25seSB3aGVuIHRoZSB0ZXh0IGhhcyBtaXhlZCBpbmxpbmUgc3R5bGVzXG4gIGNvbnN0IHNlZ21lbnRzID0gZXh0cmFjdFRleHRTZWdtZW50cyhub2RlKTtcbiAgaWYgKHNlZ21lbnRzKSBzdHlsZXMudGV4dFNlZ21lbnRzID0gc2VnbWVudHM7XG5cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRoZSBib3VuZCBGaWdtYSBUZXh0IFN0eWxlIG5hbWUgKGUuZy4gXCJIZWFkaW5nL0gyXCIpLlxuICogUmV0dXJucyBudWxsIHdoZW4gdGhlIHRleHQgbm9kZSBoYXMgbm8gc3R5bGUgYmluZGluZywgb3IgdGhlIGJpbmRpbmcgaXMgbWl4ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VGV4dFN0eWxlTmFtZShub2RlOiBUZXh0Tm9kZSk6IHN0cmluZyB8IG51bGwge1xuICB0cnkge1xuICAgIGNvbnN0IGlkID0gKG5vZGUgYXMgYW55KS50ZXh0U3R5bGVJZDtcbiAgICBpZiAoIWlkIHx8IGlkID09PSBmaWdtYS5taXhlZCB8fCB0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBzdHlsZSA9IGZpZ21hLmdldFN0eWxlQnlJZChpZCk7XG4gICAgcmV0dXJuIHN0eWxlPy5uYW1lIHx8IG51bGw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogRXh0cmFjdCBzdHlsZWQgdGV4dCBzZWdtZW50cyBzbyBpbmxpbmUgZm9ybWF0dGluZyAoYm9sZCB3b3JkLCBjb2xvcmVkIHNwYW4sXG4gKiB1bmRlcmxpbmVkIGxpbmsgaW5zaWRlIGEgcGFyYWdyYXBoKSBzdXJ2aXZlcyB0aGUgZXhwb3J0LiBSZXR1cm5zIG51bGwgd2hlblxuICogdGhlIHRleHQgaGFzIG5vIG1peGVkIHN0eWxlcyBcdTIwMTQgaW4gdGhhdCBjYXNlIHRoZSBlbGVtZW50LWxldmVsIHR5cG9ncmFwaHlcbiAqIGFscmVhZHkgZGVzY3JpYmVzIHRoZSB3aG9sZSB0ZXh0IHVuaWZvcm1seS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUZXh0U2VnbWVudHMobm9kZTogVGV4dE5vZGUpOiBUZXh0U2VnbWVudFtdIHwgbnVsbCB7XG4gIGlmICghbm9kZS5jaGFyYWN0ZXJzKSByZXR1cm4gbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCBnZXRTZWdtZW50cyA9IChub2RlIGFzIGFueSkuZ2V0U3R5bGVkVGV4dFNlZ21lbnRzO1xuICAgIGlmICh0eXBlb2YgZ2V0U2VnbWVudHMgIT09ICdmdW5jdGlvbicpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IHJhdyA9IGdldFNlZ21lbnRzLmNhbGwobm9kZSwgWydmb250TmFtZScsICdmb250U2l6ZScsICdmaWxscycsICd0ZXh0RGVjb3JhdGlvbiddKTtcbiAgICBpZiAoIXJhdyB8fCAhQXJyYXkuaXNBcnJheShyYXcpIHx8IHJhdy5sZW5ndGggPD0gMSkgcmV0dXJuIG51bGw7XG5cbiAgICBjb25zdCBzZWdtZW50czogVGV4dFNlZ21lbnRbXSA9IHJhdy5tYXAoKHM6IGFueSkgPT4ge1xuICAgICAgY29uc3Qgc2VnOiBUZXh0U2VnbWVudCA9IHsgdGV4dDogcy5jaGFyYWN0ZXJzIHx8ICcnIH07XG4gICAgICBpZiAocy5mb250TmFtZSAmJiB0eXBlb2Ygcy5mb250TmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgc2VnLmZvbnRGYW1pbHkgPSBzLmZvbnROYW1lLmZhbWlseTtcbiAgICAgICAgc2VnLmZvbnRXZWlnaHQgPSBmb250V2VpZ2h0RnJvbVN0eWxlKHMuZm9udE5hbWUuc3R5bGUpO1xuICAgICAgICBpZiAocy5mb250TmFtZS5zdHlsZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdpdGFsaWMnKSkgc2VnLml0YWxpYyA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHMuZm9udFNpemUgPT09ICdudW1iZXInKSBzZWcuZm9udFNpemUgPSBzLmZvbnRTaXplO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocy5maWxscykpIHtcbiAgICAgICAgZm9yIChjb25zdCBmIG9mIHMuZmlsbHMpIHtcbiAgICAgICAgICBpZiAoZi50eXBlID09PSAnU09MSUQnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHNlZy5jb2xvciA9IHJnYlRvSGV4KGYuY29sb3IpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocy50ZXh0RGVjb3JhdGlvbiA9PT0gJ1VOREVSTElORScpIHNlZy50ZXh0RGVjb3JhdGlvbiA9ICd1bmRlcmxpbmUnO1xuICAgICAgZWxzZSBpZiAocy50ZXh0RGVjb3JhdGlvbiA9PT0gJ1NUUklLRVRIUk9VR0gnKSBzZWcudGV4dERlY29yYXRpb24gPSAnbGluZS10aHJvdWdoJztcbiAgICAgIHJldHVybiBzZWc7XG4gICAgfSk7XG5cbiAgICAvLyBJZiBldmVyeSBzZWdtZW50J3Mgc3R5bGluZyBpcyBpZGVudGljYWwsIHRoZSBzZWdtZW50YXRpb24gYWRkcyBub3RoaW5nLlxuICAgIGNvbnN0IGZpcnN0ID0gc2VnbWVudHNbMF07XG4gICAgY29uc3QgYWxsU2FtZSA9IHNlZ21lbnRzLmV2ZXJ5KHMgPT5cbiAgICAgIHMuZm9udEZhbWlseSA9PT0gZmlyc3QuZm9udEZhbWlseSAmJlxuICAgICAgcy5mb250V2VpZ2h0ID09PSBmaXJzdC5mb250V2VpZ2h0ICYmXG4gICAgICBzLmZvbnRTaXplID09PSBmaXJzdC5mb250U2l6ZSAmJlxuICAgICAgcy5jb2xvciA9PT0gZmlyc3QuY29sb3IgJiZcbiAgICAgIHMuaXRhbGljID09PSBmaXJzdC5pdGFsaWMgJiZcbiAgICAgIHMudGV4dERlY29yYXRpb24gPT09IGZpcnN0LnRleHREZWNvcmF0aW9uXG4gICAgKTtcbiAgICByZXR1cm4gYWxsU2FtZSA/IG51bGwgOiBzZWdtZW50cztcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBDb2xsZWN0IGFsbCB1bmlxdWUgZm9udCB1c2FnZSBkYXRhIGZyb20gYSBub2RlIHRyZWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0Rm9udHMocm9vdDogU2NlbmVOb2RlKTogUmVjb3JkPHN0cmluZywgeyBzdHlsZXM6IFNldDxzdHJpbmc+OyBzaXplczogU2V0PG51bWJlcj47IGNvdW50OiBudW1iZXIgfT4ge1xuICBjb25zdCBmb250czogUmVjb3JkPHN0cmluZywgeyBzdHlsZXM6IFNldDxzdHJpbmc+OyBzaXplczogU2V0PG51bWJlcj47IGNvdW50OiBudW1iZXIgfT4gPSB7fTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgZm9udE5hbWUgPSBub2RlLmZvbnROYW1lO1xuICAgICAgaWYgKGZvbnROYW1lICE9PSBmaWdtYS5taXhlZCAmJiBmb250TmFtZSkge1xuICAgICAgICBjb25zdCBmYW1pbHkgPSBmb250TmFtZS5mYW1pbHk7XG4gICAgICAgIGlmICghZm9udHNbZmFtaWx5XSkge1xuICAgICAgICAgIGZvbnRzW2ZhbWlseV0gPSB7IHN0eWxlczogbmV3IFNldCgpLCBzaXplczogbmV3IFNldCgpLCBjb3VudDogMCB9O1xuICAgICAgICB9XG4gICAgICAgIGZvbnRzW2ZhbWlseV0uc3R5bGVzLmFkZChmb250TmFtZS5zdHlsZSk7XG4gICAgICAgIGZvbnRzW2ZhbWlseV0uY291bnQrKztcblxuICAgICAgICBjb25zdCBmb250U2l6ZSA9IG5vZGUuZm9udFNpemU7XG4gICAgICAgIGlmIChmb250U2l6ZSAhPT0gZmlnbWEubWl4ZWQgJiYgdHlwZW9mIGZvbnRTaXplID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGZvbnRzW2ZhbWlseV0uc2l6ZXMuYWRkKGZvbnRTaXplKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2Fsayhyb290KTtcbiAgcmV0dXJuIGZvbnRzO1xufVxuXG4vKipcbiAqIENvdW50IFRFWFQgbm9kZXMgaW4gYSBzdWJ0cmVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY291bnRUZXh0Tm9kZXMocm9vdDogU2NlbmVOb2RlKTogbnVtYmVyIHtcbiAgbGV0IGNvdW50ID0gMDtcbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcpIGNvdW50Kys7XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB3YWxrKHJvb3QpO1xuICByZXR1cm4gY291bnQ7XG59XG4iLCAiaW1wb3J0IHsgU2VjdGlvblN0eWxlcyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgdG9Dc3NWYWx1ZSB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIEV4dHJhY3Qgc3BhY2luZyBmcm9tIGFuIGF1dG8tbGF5b3V0IGZyYW1lLlxuICogVGhlc2UgdmFsdWVzIG1hcCAxOjEgdG8gQ1NTIFx1MjAxNCBoaWdoIGNvbmZpZGVuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0QXV0b0xheW91dFNwYWNpbmcobm9kZTogRnJhbWVOb2RlKToge1xuICBzcGFjaW5nU291cmNlOiAnYXV0by1sYXlvdXQnO1xuICBzZWN0aW9uU3R5bGVzOiBQYXJ0aWFsPFNlY3Rpb25TdHlsZXM+O1xuICBpdGVtU3BhY2luZzogc3RyaW5nIHwgbnVsbDtcbn0ge1xuICByZXR1cm4ge1xuICAgIHNwYWNpbmdTb3VyY2U6ICdhdXRvLWxheW91dCcsXG4gICAgc2VjdGlvblN0eWxlczoge1xuICAgICAgcGFkZGluZ1RvcDogdG9Dc3NWYWx1ZShub2RlLnBhZGRpbmdUb3ApLFxuICAgICAgcGFkZGluZ0JvdHRvbTogdG9Dc3NWYWx1ZShub2RlLnBhZGRpbmdCb3R0b20pLFxuICAgICAgcGFkZGluZ0xlZnQ6IHRvQ3NzVmFsdWUobm9kZS5wYWRkaW5nTGVmdCksXG4gICAgICBwYWRkaW5nUmlnaHQ6IHRvQ3NzVmFsdWUobm9kZS5wYWRkaW5nUmlnaHQpLFxuICAgIH0sXG4gICAgaXRlbVNwYWNpbmc6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCBzcGFjaW5nIGZyb20gYW4gYWJzb2x1dGVseS1wb3NpdGlvbmVkIGZyYW1lIGJ5IGNvbXB1dGluZ1xuICogZnJvbSBjaGlsZHJlbidzIGJvdW5kaW5nIGJveGVzLiBUaGVzZSB2YWx1ZXMgYXJlIGFwcHJveGltYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEFic29sdXRlU3BhY2luZyhub2RlOiBGcmFtZU5vZGUpOiB7XG4gIHNwYWNpbmdTb3VyY2U6ICdhYnNvbHV0ZS1jb29yZGluYXRlcyc7XG4gIHNlY3Rpb25TdHlsZXM6IFBhcnRpYWw8U2VjdGlvblN0eWxlcz47XG4gIGl0ZW1TcGFjaW5nOiBzdHJpbmcgfCBudWxsO1xufSB7XG4gIGNvbnN0IHBhcmVudEJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgaWYgKCFwYXJlbnRCb3VuZHMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3BhY2luZ1NvdXJjZTogJ2Fic29sdXRlLWNvb3JkaW5hdGVzJyxcbiAgICAgIHNlY3Rpb25TdHlsZXM6IHtcbiAgICAgICAgcGFkZGluZ1RvcDogbnVsbCxcbiAgICAgICAgcGFkZGluZ0JvdHRvbTogbnVsbCxcbiAgICAgICAgcGFkZGluZ0xlZnQ6IG51bGwsXG4gICAgICAgIHBhZGRpbmdSaWdodDogbnVsbCxcbiAgICAgIH0sXG4gICAgICBpdGVtU3BhY2luZzogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuXG4gICAgLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UgJiYgYy5hYnNvbHV0ZUJvdW5kaW5nQm94KVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3BhY2luZ1NvdXJjZTogJ2Fic29sdXRlLWNvb3JkaW5hdGVzJyxcbiAgICAgIHNlY3Rpb25TdHlsZXM6IHtcbiAgICAgICAgcGFkZGluZ1RvcDogbnVsbCxcbiAgICAgICAgcGFkZGluZ0JvdHRvbTogbnVsbCxcbiAgICAgICAgcGFkZGluZ0xlZnQ6IG51bGwsXG4gICAgICAgIHBhZGRpbmdSaWdodDogbnVsbCxcbiAgICAgIH0sXG4gICAgICBpdGVtU3BhY2luZzogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgZmlyc3RDaGlsZCA9IGNoaWxkcmVuWzBdLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICBjb25zdCBsYXN0Q2hpbGQgPSBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXS5hYnNvbHV0ZUJvdW5kaW5nQm94ITtcblxuICBjb25zdCBwYWRkaW5nVG9wID0gZmlyc3RDaGlsZC55IC0gcGFyZW50Qm91bmRzLnk7XG4gIGNvbnN0IHBhZGRpbmdCb3R0b20gPSAocGFyZW50Qm91bmRzLnkgKyBwYXJlbnRCb3VuZHMuaGVpZ2h0KSAtIChsYXN0Q2hpbGQueSArIGxhc3RDaGlsZC5oZWlnaHQpO1xuXG4gIC8vIENvbXB1dGUgbGVmdCBwYWRkaW5nIGZyb20gdGhlIGxlZnRtb3N0IGNoaWxkXG4gIGNvbnN0IGxlZnRNb3N0ID0gTWF0aC5taW4oLi4uY2hpbGRyZW4ubWFwKGMgPT4gYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS54KSk7XG4gIGNvbnN0IHBhZGRpbmdMZWZ0ID0gbGVmdE1vc3QgLSBwYXJlbnRCb3VuZHMueDtcblxuICAvLyBDb21wdXRlIHJpZ2h0IHBhZGRpbmcgZnJvbSB0aGUgcmlnaHRtb3N0IGNoaWxkXG4gIGNvbnN0IHJpZ2h0TW9zdCA9IE1hdGgubWF4KC4uLmNoaWxkcmVuLm1hcChjID0+IGMuYWJzb2x1dGVCb3VuZGluZ0JveCEueCArIGMuYWJzb2x1dGVCb3VuZGluZ0JveCEud2lkdGgpKTtcbiAgY29uc3QgcGFkZGluZ1JpZ2h0ID0gKHBhcmVudEJvdW5kcy54ICsgcGFyZW50Qm91bmRzLndpZHRoKSAtIHJpZ2h0TW9zdDtcblxuICAvLyBFc3RpbWF0ZSB2ZXJ0aWNhbCBnYXAgZnJvbSBjb25zZWN1dGl2ZSBjaGlsZHJlblxuICBsZXQgdG90YWxHYXAgPSAwO1xuICBsZXQgZ2FwQ291bnQgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGNvbnN0IGN1cnJCb3R0b20gPSBjaGlsZHJlbltpXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55ICsgY2hpbGRyZW5baV0uYWJzb2x1dGVCb3VuZGluZ0JveCEuaGVpZ2h0O1xuICAgIGNvbnN0IG5leHRUb3AgPSBjaGlsZHJlbltpICsgMV0uYWJzb2x1dGVCb3VuZGluZ0JveCEueTtcbiAgICBjb25zdCBnYXAgPSBuZXh0VG9wIC0gY3VyckJvdHRvbTtcbiAgICBpZiAoZ2FwID4gMCkge1xuICAgICAgdG90YWxHYXAgKz0gZ2FwO1xuICAgICAgZ2FwQ291bnQrKztcbiAgICB9XG4gIH1cbiAgY29uc3QgYXZnR2FwID0gZ2FwQ291bnQgPiAwID8gTWF0aC5yb3VuZCh0b3RhbEdhcCAvIGdhcENvdW50KSA6IDA7XG5cbiAgcmV0dXJuIHtcbiAgICBzcGFjaW5nU291cmNlOiAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnLFxuICAgIHNlY3Rpb25TdHlsZXM6IHtcbiAgICAgIHBhZGRpbmdUb3A6IHRvQ3NzVmFsdWUoTWF0aC5tYXgoMCwgTWF0aC5yb3VuZChwYWRkaW5nVG9wKSkpLFxuICAgICAgcGFkZGluZ0JvdHRvbTogdG9Dc3NWYWx1ZShNYXRoLm1heCgwLCBNYXRoLnJvdW5kKHBhZGRpbmdCb3R0b20pKSksXG4gICAgICBwYWRkaW5nTGVmdDogdG9Dc3NWYWx1ZShNYXRoLm1heCgwLCBNYXRoLnJvdW5kKHBhZGRpbmdMZWZ0KSkpLFxuICAgICAgcGFkZGluZ1JpZ2h0OiB0b0Nzc1ZhbHVlKE1hdGgubWF4KDAsIE1hdGgucm91bmQocGFkZGluZ1JpZ2h0KSkpLFxuICAgIH0sXG4gICAgaXRlbVNwYWNpbmc6IGF2Z0dhcCA+IDAgPyB0b0Nzc1ZhbHVlKGF2Z0dhcCkgOiBudWxsLFxuICB9O1xufVxuXG4vKipcbiAqIENvbGxlY3QgYWxsIHNwYWNpbmcgdmFsdWVzIHVzZWQgaW4gYSBub2RlIHRyZWUuXG4gKiBSZXR1cm5zIHNvcnRlZCBhcnJheSBvZiB7IHZhbHVlLCBjb3VudCB9LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFNwYWNpbmcocm9vdDogU2NlbmVOb2RlKTogeyB2YWx1ZTogbnVtYmVyOyBjb3VudDogbnVtYmVyIH1bXSB7XG4gIGNvbnN0IHNwYWNpbmdNYXA6IFJlY29yZDxudW1iZXIsIG51bWJlcj4gPSB7fTtcblxuICBmdW5jdGlvbiBhZGRWYWx1ZSh2OiBudW1iZXIpIHtcbiAgICBpZiAodiA+IDAgJiYgdiA8IDEwMDApIHtcbiAgICAgIGNvbnN0IHJvdW5kZWQgPSBNYXRoLnJvdW5kKHYpO1xuICAgICAgc3BhY2luZ01hcFtyb3VuZGVkXSA9IChzcGFjaW5nTWFwW3JvdW5kZWRdIHx8IDApICsgMTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBpZiAoZnJhbWUubGF5b3V0TW9kZSAmJiBmcmFtZS5sYXlvdXRNb2RlICE9PSAnTk9ORScpIHtcbiAgICAgICAgYWRkVmFsdWUoZnJhbWUucGFkZGluZ1RvcCk7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLnBhZGRpbmdCb3R0b20pO1xuICAgICAgICBhZGRWYWx1ZShmcmFtZS5wYWRkaW5nTGVmdCk7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLnBhZGRpbmdSaWdodCk7XG4gICAgICAgIGFkZFZhbHVlKGZyYW1lLml0ZW1TcGFjaW5nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdhbGsocm9vdCk7XG5cbiAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHNwYWNpbmdNYXApXG4gICAgLm1hcCgoW3ZhbHVlLCBjb3VudF0pID0+ICh7IHZhbHVlOiBOdW1iZXIodmFsdWUpLCBjb3VudCB9KSlcbiAgICAuc29ydCgoYSwgYikgPT4gYS52YWx1ZSAtIGIudmFsdWUpO1xufVxuIiwgImltcG9ydCB7IEdyaWRTcGVjIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyB0b0Nzc1ZhbHVlIH0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogRGV0ZWN0IHRoZSBncmlkL2xheW91dCBzdHJ1Y3R1cmUgb2YgYSBmcmFtZSBhbmQgcmV0dXJuIGEgR3JpZFNwZWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RHcmlkKG5vZGU6IEZyYW1lTm9kZSk6IEdyaWRTcGVjIHtcbiAgLy8gQXV0by1sYXlvdXQgZnJhbWUgXHUyMTkyIGZsZXggb3IgZ3JpZFxuICBpZiAobm9kZS5sYXlvdXRNb2RlICYmIG5vZGUubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgY29uc3QgaXNXcmFwcGluZyA9ICdsYXlvdXRXcmFwJyBpbiBub2RlICYmIChub2RlIGFzIGFueSkubGF5b3V0V3JhcCA9PT0gJ1dSQVAnO1xuXG4gICAgaWYgKGlzV3JhcHBpbmcpIHtcbiAgICAgIC8vIFdyYXBwaW5nIGF1dG8tbGF5b3V0ID0gZmxleC13cmFwIChncmlkLWxpa2UpXG4gICAgICBjb25zdCBjb2x1bW5zID0gZXN0aW1hdGVDb2x1bW5zRnJvbUNoaWxkcmVuKG5vZGUpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0TW9kZTogJ2ZsZXgnLFxuICAgICAgICBjb2x1bW5zLFxuICAgICAgICBnYXA6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gICAgICAgIHJvd0dhcDogJ2NvdW50ZXJBeGlzU3BhY2luZycgaW4gbm9kZSA/IHRvQ3NzVmFsdWUoKG5vZGUgYXMgYW55KS5jb3VudGVyQXhpc1NwYWNpbmcpIDogbnVsbCxcbiAgICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgICBpdGVtTWluV2lkdGg6IGVzdGltYXRlSXRlbU1pbldpZHRoKG5vZGUsIGNvbHVtbnMpLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBOb24td3JhcHBpbmcgYXV0by1sYXlvdXRcbiAgICBjb25zdCBpc0hvcml6b250YWwgPSBub2RlLmxheW91dE1vZGUgPT09ICdIT1JJWk9OVEFMJztcblxuICAgIGlmIChpc0hvcml6b250YWwpIHtcbiAgICAgIC8vIEhvcml6b250YWwgbGF5b3V0IFx1MjAxNCBjaGlsZHJlbiBhcmUgY29sdW1uc1xuICAgICAgY29uc3QgY29sdW1ucyA9IG5vZGUuY2hpbGRyZW4uZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSkubGVuZ3RoO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0TW9kZTogJ2ZsZXgnLFxuICAgICAgICBjb2x1bW5zLFxuICAgICAgICBnYXA6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gICAgICAgIHJvd0dhcDogbnVsbCxcbiAgICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgICBpdGVtTWluV2lkdGg6IG51bGwsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIFZlcnRpY2FsIGxheW91dCBcdTIwMTQgc2luZ2xlIGNvbHVtbiwgY2hpbGRyZW4gYXJlIHJvd3NcbiAgICAvLyBCdXQgY2hlY2sgaWYgYW55IGRpcmVjdCBjaGlsZCBpcyBhIGhvcml6b250YWwgYXV0by1sYXlvdXQgKG5lc3RlZCBncmlkKVxuICAgIGNvbnN0IGhvcml6b250YWxDaGlsZCA9IG5vZGUuY2hpbGRyZW4uZmluZChjID0+XG4gICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnKSAmJlxuICAgICAgKGMgYXMgRnJhbWVOb2RlKS5sYXlvdXRNb2RlID09PSAnSE9SSVpPTlRBTCdcbiAgICApIGFzIEZyYW1lTm9kZSB8IHVuZGVmaW5lZDtcblxuICAgIGlmIChob3Jpem9udGFsQ2hpbGQpIHtcbiAgICAgIGNvbnN0IGlubmVyQ29sdW1ucyA9IGhvcml6b250YWxDaGlsZC5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlKS5sZW5ndGg7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYXlvdXRNb2RlOiAnZmxleCcsXG4gICAgICAgIGNvbHVtbnM6IGlubmVyQ29sdW1ucyxcbiAgICAgICAgZ2FwOiB0b0Nzc1ZhbHVlKGhvcml6b250YWxDaGlsZC5pdGVtU3BhY2luZyksXG4gICAgICAgIHJvd0dhcDogdG9Dc3NWYWx1ZShub2RlLml0ZW1TcGFjaW5nKSxcbiAgICAgICAgY29sdW1uR2FwOiBudWxsLFxuICAgICAgICBpdGVtTWluV2lkdGg6IGVzdGltYXRlSXRlbU1pbldpZHRoKGhvcml6b250YWxDaGlsZCwgaW5uZXJDb2x1bW5zKSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxheW91dE1vZGU6ICdmbGV4JyxcbiAgICAgIGNvbHVtbnM6IDEsXG4gICAgICBnYXA6IHRvQ3NzVmFsdWUobm9kZS5pdGVtU3BhY2luZyksXG4gICAgICByb3dHYXA6IG51bGwsXG4gICAgICBjb2x1bW5HYXA6IG51bGwsXG4gICAgICBpdGVtTWluV2lkdGg6IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIC8vIE5vIGF1dG8tbGF5b3V0IFx1MjE5MiBhYnNvbHV0ZSBwb3NpdGlvbmluZ1xuICBjb25zdCBjb2x1bW5zID0gZXN0aW1hdGVDb2x1bW5zRnJvbUFic29sdXRlQ2hpbGRyZW4obm9kZSk7XG4gIHJldHVybiB7XG4gICAgbGF5b3V0TW9kZTogJ2Fic29sdXRlJyxcbiAgICBjb2x1bW5zLFxuICAgIGdhcDogZXN0aW1hdGVHYXBGcm9tQWJzb2x1dGVDaGlsZHJlbihub2RlKSxcbiAgICByb3dHYXA6IG51bGwsXG4gICAgY29sdW1uR2FwOiBudWxsLFxuICAgIGl0ZW1NaW5XaWR0aDogbnVsbCxcbiAgfTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBjb2x1bW4gY291bnQgZnJvbSB3cmFwcGluZyBhdXRvLWxheW91dCBjaGlsZHJlbi5cbiAqIENvdW50cyBob3cgbWFueSBjaGlsZHJlbiBmaXQgaW4gdGhlIGZpcnN0IFwicm93XCIgKHNpbWlsYXIgWSBwb3NpdGlvbikuXG4gKi9cbmZ1bmN0aW9uIGVzdGltYXRlQ29sdW1uc0Zyb21DaGlsZHJlbihub2RlOiBGcmFtZU5vZGUpOiBudW1iZXIge1xuICBjb25zdCB2aXNpYmxlID0gbm9kZS5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlICYmIGMuYWJzb2x1dGVCb3VuZGluZ0JveCk7XG4gIGlmICh2aXNpYmxlLmxlbmd0aCA8PSAxKSByZXR1cm4gMTtcblxuICBjb25zdCBmaXJzdFkgPSB2aXNpYmxlWzBdLmFic29sdXRlQm91bmRpbmdCb3ghLnk7XG4gIGNvbnN0IHRvbGVyYW5jZSA9IDU7IC8vIHB4XG4gIGxldCBjb2x1bW5zSW5GaXJzdFJvdyA9IDA7XG5cbiAgZm9yIChjb25zdCBjaGlsZCBvZiB2aXNpYmxlKSB7XG4gICAgaWYgKE1hdGguYWJzKGNoaWxkLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBmaXJzdFkpIDw9IHRvbGVyYW5jZSkge1xuICAgICAgY29sdW1uc0luRmlyc3RSb3crKztcbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE1hdGgubWF4KDEsIGNvbHVtbnNJbkZpcnN0Um93KTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBjb2x1bW4gY291bnQgZnJvbSBhYnNvbHV0ZWx5LXBvc2l0aW9uZWQgY2hpbGRyZW4uXG4gKiBHcm91cHMgY2hpbGRyZW4gYnkgWSBwb3NpdGlvbiAoc2FtZSByb3cgPSBzYW1lIFkgXHUwMEIxIHRvbGVyYW5jZSkuXG4gKi9cbmZ1bmN0aW9uIGVzdGltYXRlQ29sdW1uc0Zyb21BYnNvbHV0ZUNoaWxkcmVuKG5vZGU6IEZyYW1lTm9kZSk6IG51bWJlciB7XG4gIGNvbnN0IHZpc2libGUgPSBub2RlLmNoaWxkcmVuXG4gICAgLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UgJiYgYy5hYnNvbHV0ZUJvdW5kaW5nQm94KVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIGlmICh2aXNpYmxlLmxlbmd0aCA8PSAxKSByZXR1cm4gMTtcblxuICBjb25zdCBmaXJzdFkgPSB2aXNpYmxlWzBdLmFic29sdXRlQm91bmRpbmdCb3ghLnk7XG4gIGNvbnN0IHRvbGVyYW5jZSA9IDEwO1xuICBsZXQgY291bnQgPSAwO1xuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgdmlzaWJsZSkge1xuICAgIGlmIChNYXRoLmFicyhjaGlsZC5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gZmlyc3RZKSA8PSB0b2xlcmFuY2UpIHtcbiAgICAgIGNvdW50Kys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBNYXRoLm1heCgxLCBjb3VudCk7XG59XG5cbi8qKlxuICogRXN0aW1hdGUgZ2FwIGJldHdlZW4gYWJzb2x1dGVseS1wb3NpdGlvbmVkIGNoaWxkcmVuIG9uIHRoZSBzYW1lIHJvdy5cbiAqL1xuZnVuY3Rpb24gZXN0aW1hdGVHYXBGcm9tQWJzb2x1dGVDaGlsZHJlbihub2RlOiBGcmFtZU5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgdmlzaWJsZSA9IG5vZGUuY2hpbGRyZW5cbiAgICAuZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSAmJiBjLmFic29sdXRlQm91bmRpbmdCb3gpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuYWJzb2x1dGVCb3VuZGluZ0JveCEueCAtIGIuYWJzb2x1dGVCb3VuZGluZ0JveCEueCk7XG5cbiAgaWYgKHZpc2libGUubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG5cbiAgLy8gVXNlIHRoZSBmaXJzdCByb3cgb2YgY2hpbGRyZW5cbiAgY29uc3QgZmlyc3RZID0gdmlzaWJsZVswXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55O1xuICBjb25zdCB0b2xlcmFuY2UgPSAxMDtcbiAgY29uc3QgZmlyc3RSb3cgPSB2aXNpYmxlLmZpbHRlcihjID0+XG4gICAgTWF0aC5hYnMoYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gZmlyc3RZKSA8PSB0b2xlcmFuY2VcbiAgKTtcblxuICBpZiAoZmlyc3RSb3cubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG5cbiAgbGV0IHRvdGFsR2FwID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdFJvdy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBjb25zdCByaWdodEVkZ2UgPSBmaXJzdFJvd1tpXS5hYnNvbHV0ZUJvdW5kaW5nQm94IS54ICsgZmlyc3RSb3dbaV0uYWJzb2x1dGVCb3VuZGluZ0JveCEud2lkdGg7XG4gICAgY29uc3QgbmV4dExlZnQgPSBmaXJzdFJvd1tpICsgMV0uYWJzb2x1dGVCb3VuZGluZ0JveCEueDtcbiAgICB0b3RhbEdhcCArPSBuZXh0TGVmdCAtIHJpZ2h0RWRnZTtcbiAgfVxuXG4gIGNvbnN0IGF2Z0dhcCA9IE1hdGgucm91bmQodG90YWxHYXAgLyAoZmlyc3RSb3cubGVuZ3RoIC0gMSkpO1xuICByZXR1cm4gYXZnR2FwID4gMCA/IHRvQ3NzVmFsdWUoYXZnR2FwKSA6IG51bGw7XG59XG5cbi8qKlxuICogRXN0aW1hdGUgbWluaW11bSBpdGVtIHdpZHRoIGZyb20gYSBob3Jpem9udGFsIGxheW91dCdzIGNoaWxkcmVuLlxuICovXG5mdW5jdGlvbiBlc3RpbWF0ZUl0ZW1NaW5XaWR0aChub2RlOiBGcmFtZU5vZGUsIGNvbHVtbnM6IG51bWJlcik6IHN0cmluZyB8IG51bGwge1xuICBpZiAoY29sdW1ucyA8PSAxKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdmlzaWJsZSA9IG5vZGUuY2hpbGRyZW4uZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSAmJiBjLmFic29sdXRlQm91bmRpbmdCb3gpO1xuICBpZiAodmlzaWJsZS5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHdpZHRocyA9IHZpc2libGUubWFwKGMgPT4gYy5hYnNvbHV0ZUJvdW5kaW5nQm94IS53aWR0aCk7XG4gIGNvbnN0IG1pbldpZHRoID0gTWF0aC5taW4oLi4ud2lkdGhzKTtcbiAgcmV0dXJuIHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChtaW5XaWR0aCkpO1xufVxuIiwgImltcG9ydCB7IEludGVyYWN0aW9uU3BlYyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgcmdiVG9IZXgsIGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3IgfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IHRvQ3NzVmFsdWUgfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBNYXAgRmlnbWEgdHJpZ2dlciB0eXBlIHRvIG91ciBzaW1wbGlmaWVkIHRyaWdnZXIgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBtYXBUcmlnZ2VyKHRyaWdnZXJUeXBlOiBzdHJpbmcpOiBJbnRlcmFjdGlvblNwZWNbJ3RyaWdnZXInXSB8IG51bGwge1xuICBzd2l0Y2ggKHRyaWdnZXJUeXBlKSB7XG4gICAgY2FzZSAnT05fSE9WRVInOiByZXR1cm4gJ2hvdmVyJztcbiAgICBjYXNlICdPTl9DTElDSyc6IHJldHVybiAnY2xpY2snO1xuICAgIGNhc2UgJ09OX1BSRVNTJzogcmV0dXJuICdwcmVzcyc7XG4gICAgY2FzZSAnTU9VU0VfRU5URVInOiByZXR1cm4gJ21vdXNlLWVudGVyJztcbiAgICBjYXNlICdNT1VTRV9MRUFWRSc6IHJldHVybiAnbW91c2UtbGVhdmUnO1xuICAgIGRlZmF1bHQ6IHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogTWFwIEZpZ21hIGVhc2luZyB0eXBlIHRvIENTUyB0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gbWFwRWFzaW5nKGVhc2luZzogYW55KTogc3RyaW5nIHtcbiAgaWYgKCFlYXNpbmcpIHJldHVybiAnZWFzZSc7XG4gIHN3aXRjaCAoZWFzaW5nLnR5cGUpIHtcbiAgICBjYXNlICdFQVNFX0lOJzogcmV0dXJuICdlYXNlLWluJztcbiAgICBjYXNlICdFQVNFX09VVCc6IHJldHVybiAnZWFzZS1vdXQnO1xuICAgIGNhc2UgJ0VBU0VfSU5fQU5EX09VVCc6IHJldHVybiAnZWFzZS1pbi1vdXQnO1xuICAgIGNhc2UgJ0xJTkVBUic6IHJldHVybiAnbGluZWFyJztcbiAgICBjYXNlICdDVVNUT01fQ1VCSUNfQkVaSUVSJzoge1xuICAgICAgY29uc3QgYiA9IGVhc2luZy5lYXNpbmdGdW5jdGlvbkN1YmljQmV6aWVyO1xuICAgICAgaWYgKGIpIHJldHVybiBgY3ViaWMtYmV6aWVyKCR7Yi54MX0sICR7Yi55MX0sICR7Yi54Mn0sICR7Yi55Mn0pYDtcbiAgICAgIHJldHVybiAnZWFzZSc7XG4gICAgfVxuICAgIGRlZmF1bHQ6IHJldHVybiAnZWFzZSc7XG4gIH1cbn1cblxuLyoqXG4gKiBEaWZmIHRoZSB2aXN1YWwgcHJvcGVydGllcyBiZXR3ZWVuIGEgc291cmNlIG5vZGUgYW5kIGEgZGVzdGluYXRpb24gbm9kZS5cbiAqIFJldHVybnMgYSByZWNvcmQgb2YgQ1NTIHByb3BlcnR5IGNoYW5nZXMuXG4gKi9cbmZ1bmN0aW9uIGRpZmZOb2RlU3R5bGVzKFxuICBzb3VyY2U6IFNjZW5lTm9kZSxcbiAgZGVzdDogU2NlbmVOb2RlXG4pOiBSZWNvcmQ8c3RyaW5nLCB7IGZyb206IHN0cmluZzsgdG86IHN0cmluZyB9PiB7XG4gIGNvbnN0IGNoYW5nZXM6IFJlY29yZDxzdHJpbmcsIHsgZnJvbTogc3RyaW5nOyB0bzogc3RyaW5nIH0+ID0ge307XG5cbiAgLy8gQmFja2dyb3VuZCBjb2xvclxuICBjb25zdCBzcmNCZyA9IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3Ioc291cmNlIGFzIGFueSk7XG4gIGNvbnN0IGRlc3RCZyA9IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3IoZGVzdCBhcyBhbnkpO1xuICBpZiAoc3JjQmcgJiYgZGVzdEJnICYmIHNyY0JnICE9PSBkZXN0QmcpIHtcbiAgICBjaGFuZ2VzLmJhY2tncm91bmRDb2xvciA9IHsgZnJvbTogc3JjQmcsIHRvOiBkZXN0QmcgfTtcbiAgfVxuXG4gIC8vIE9wYWNpdHlcbiAgaWYgKCdvcGFjaXR5JyBpbiBzb3VyY2UgJiYgJ29wYWNpdHknIGluIGRlc3QpIHtcbiAgICBjb25zdCBzcmNPcCA9IChzb3VyY2UgYXMgYW55KS5vcGFjaXR5O1xuICAgIGNvbnN0IGRlc3RPcCA9IChkZXN0IGFzIGFueSkub3BhY2l0eTtcbiAgICBpZiAoc3JjT3AgIT09IHVuZGVmaW5lZCAmJiBkZXN0T3AgIT09IHVuZGVmaW5lZCAmJiBNYXRoLmFicyhzcmNPcCAtIGRlc3RPcCkgPiAwLjAxKSB7XG4gICAgICBjaGFuZ2VzLm9wYWNpdHkgPSB7IGZyb206IFN0cmluZyhzcmNPcCksIHRvOiBTdHJpbmcoZGVzdE9wKSB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIFNpemUgKHRyYW5zZm9ybTogc2NhbGUpXG4gIGlmIChzb3VyY2UuYWJzb2x1dGVCb3VuZGluZ0JveCAmJiBkZXN0LmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICBjb25zdCBzcmNXID0gc291cmNlLmFic29sdXRlQm91bmRpbmdCb3gud2lkdGg7XG4gICAgY29uc3QgZGVzdFcgPSBkZXN0LmFic29sdXRlQm91bmRpbmdCb3gud2lkdGg7XG4gICAgaWYgKHNyY1cgPiAwICYmIGRlc3RXID4gMCkge1xuICAgICAgY29uc3Qgc2NhbGVYID0gTWF0aC5yb3VuZCgoZGVzdFcgLyBzcmNXKSAqIDEwMCkgLyAxMDA7XG4gICAgICBpZiAoTWF0aC5hYnMoc2NhbGVYIC0gMSkgPiAwLjAxKSB7XG4gICAgICAgIGNoYW5nZXMudHJhbnNmb3JtID0geyBmcm9tOiAnc2NhbGUoMSknLCB0bzogYHNjYWxlKCR7c2NhbGVYfSlgIH07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQm9yZGVyIHJhZGl1c1xuICBpZiAoJ2Nvcm5lclJhZGl1cycgaW4gc291cmNlICYmICdjb3JuZXJSYWRpdXMnIGluIGRlc3QpIHtcbiAgICBjb25zdCBzcmNSID0gKHNvdXJjZSBhcyBhbnkpLmNvcm5lclJhZGl1cztcbiAgICBjb25zdCBkZXN0UiA9IChkZXN0IGFzIGFueSkuY29ybmVyUmFkaXVzO1xuICAgIGlmICh0eXBlb2Ygc3JjUiA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGRlc3RSID09PSAnbnVtYmVyJyAmJiBzcmNSICE9PSBkZXN0Uikge1xuICAgICAgY2hhbmdlcy5ib3JkZXJSYWRpdXMgPSB7IGZyb206IHRvQ3NzVmFsdWUoc3JjUikhLCB0bzogdG9Dc3NWYWx1ZShkZXN0UikhIH07XG4gICAgfVxuICB9XG5cbiAgLy8gQm94IHNoYWRvdyAoZWZmZWN0cylcbiAgaWYgKCdlZmZlY3RzJyBpbiBzb3VyY2UgJiYgJ2VmZmVjdHMnIGluIGRlc3QpIHtcbiAgICBjb25zdCBzcmNTaGFkb3cgPSBleHRyYWN0Qm94U2hhZG93KHNvdXJjZSBhcyBhbnkpO1xuICAgIGNvbnN0IGRlc3RTaGFkb3cgPSBleHRyYWN0Qm94U2hhZG93KGRlc3QgYXMgYW55KTtcbiAgICBpZiAoc3JjU2hhZG93ICE9PSBkZXN0U2hhZG93KSB7XG4gICAgICBjaGFuZ2VzLmJveFNoYWRvdyA9IHsgZnJvbTogc3JjU2hhZG93IHx8ICdub25lJywgdG86IGRlc3RTaGFkb3cgfHwgJ25vbmUnIH07XG4gICAgfVxuICB9XG5cbiAgLy8gQm9yZGVyIGNvbG9yL3dpZHRoIGZyb20gc3Ryb2tlc1xuICBpZiAoJ3N0cm9rZXMnIGluIHNvdXJjZSAmJiAnc3Ryb2tlcycgaW4gZGVzdCkge1xuICAgIGNvbnN0IHNyY1N0cm9rZSA9IGV4dHJhY3RTdHJva2VDb2xvcihzb3VyY2UgYXMgYW55KTtcbiAgICBjb25zdCBkZXN0U3Ryb2tlID0gZXh0cmFjdFN0cm9rZUNvbG9yKGRlc3QgYXMgYW55KTtcbiAgICBpZiAoc3JjU3Ryb2tlICYmIGRlc3RTdHJva2UgJiYgc3JjU3Ryb2tlICE9PSBkZXN0U3Ryb2tlKSB7XG4gICAgICBjaGFuZ2VzLmJvcmRlckNvbG9yID0geyBmcm9tOiBzcmNTdHJva2UsIHRvOiBkZXN0U3Ryb2tlIH07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNoYW5nZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdCBib3gtc2hhZG93IENTUyB2YWx1ZSBmcm9tIG5vZGUgZWZmZWN0cy5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEJveFNoYWRvdyhub2RlOiB7IGVmZmVjdHM/OiByZWFkb25seSBFZmZlY3RbXSB9KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghbm9kZS5lZmZlY3RzKSByZXR1cm4gbnVsbDtcbiAgZm9yIChjb25zdCBlZmZlY3Qgb2Ygbm9kZS5lZmZlY3RzKSB7XG4gICAgaWYgKGVmZmVjdC50eXBlID09PSAnRFJPUF9TSEFET1cnICYmIGVmZmVjdC52aXNpYmxlICE9PSBmYWxzZSkge1xuICAgICAgY29uc3QgeyBvZmZzZXQsIHJhZGl1cywgc3ByZWFkLCBjb2xvciB9ID0gZWZmZWN0IGFzIERyb3BTaGFkb3dFZmZlY3Q7XG4gICAgICBjb25zdCBoZXggPSByZ2JUb0hleChjb2xvcik7XG4gICAgICBjb25zdCBhbHBoYSA9IE1hdGgucm91bmQoKGNvbG9yLmEgfHwgMSkgKiAxMDApIC8gMTAwO1xuICAgICAgcmV0dXJuIGAke29mZnNldC54fXB4ICR7b2Zmc2V0Lnl9cHggJHtyYWRpdXN9cHggJHtzcHJlYWQgfHwgMH1weCByZ2JhKCR7TWF0aC5yb3VuZChjb2xvci5yICogMjU1KX0sICR7TWF0aC5yb3VuZChjb2xvci5nICogMjU1KX0sICR7TWF0aC5yb3VuZChjb2xvci5iICogMjU1KX0sICR7YWxwaGF9KWA7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgcHJpbWFyeSBzdHJva2UgY29sb3IgZnJvbSBhIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RTdHJva2VDb2xvcihub2RlOiB7IHN0cm9rZXM/OiByZWFkb25seSBQYWludFtdIH0pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFub2RlLnN0cm9rZXMpIHJldHVybiBudWxsO1xuICBmb3IgKGNvbnN0IHN0cm9rZSBvZiBub2RlLnN0cm9rZXMpIHtcbiAgICBpZiAoc3Ryb2tlLnR5cGUgPT09ICdTT0xJRCcgJiYgc3Ryb2tlLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gcmdiVG9IZXgoc3Ryb2tlLmNvbG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBhbGwgcHJvdG90eXBlIGludGVyYWN0aW9ucyBmcm9tIGEgc2VjdGlvbidzIG5vZGUgdHJlZS5cbiAqIFdhbGtzIGFsbCBkZXNjZW5kYW50cywgZmluZHMgbm9kZXMgd2l0aCByZWFjdGlvbnMsIGFuZCBwcm9kdWNlcyBJbnRlcmFjdGlvblNwZWNbXS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RJbnRlcmFjdGlvbnMoc2VjdGlvblJvb3Q6IFNjZW5lTm9kZSk6IEludGVyYWN0aW9uU3BlY1tdIHtcbiAgY29uc3QgaW50ZXJhY3Rpb25zOiBJbnRlcmFjdGlvblNwZWNbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdyZWFjdGlvbnMnIGluIG5vZGUpIHtcbiAgICAgIGNvbnN0IHJlYWN0aW9ucyA9IChub2RlIGFzIGFueSkucmVhY3Rpb25zIGFzIGFueVtdO1xuICAgICAgaWYgKHJlYWN0aW9ucyAmJiByZWFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGNvbnN0IHJlYWN0aW9uIG9mIHJlYWN0aW9ucykge1xuICAgICAgICAgIGNvbnN0IHRyaWdnZXIgPSBtYXBUcmlnZ2VyKHJlYWN0aW9uLnRyaWdnZXI/LnR5cGUpO1xuICAgICAgICAgIGlmICghdHJpZ2dlcikgY29udGludWU7XG5cbiAgICAgICAgICBjb25zdCBhY3Rpb24gPSByZWFjdGlvbi5hY3Rpb24gfHwgKHJlYWN0aW9uLmFjdGlvbnMgJiYgcmVhY3Rpb24uYWN0aW9uc1swXSk7XG4gICAgICAgICAgaWYgKCFhY3Rpb24pIGNvbnRpbnVlO1xuXG4gICAgICAgICAgLy8gR2V0IHRyYW5zaXRpb24gZGF0YVxuICAgICAgICAgIGNvbnN0IHRyYW5zaXRpb24gPSBhY3Rpb24udHJhbnNpdGlvbjtcbiAgICAgICAgICBjb25zdCBkdXJhdGlvbiA9IHRyYW5zaXRpb24/LmR1cmF0aW9uID8gYCR7dHJhbnNpdGlvbi5kdXJhdGlvbn1zYCA6ICcwLjNzJztcbiAgICAgICAgICBjb25zdCBlYXNpbmcgPSBtYXBFYXNpbmcodHJhbnNpdGlvbj8uZWFzaW5nKTtcblxuICAgICAgICAgIC8vIEZvciBob3Zlci9jbGljayB3aXRoIGRlc3RpbmF0aW9uIG5vZGUgXHUyMDE0IGRpZmYgc3R5bGVzXG4gICAgICAgICAgaWYgKGFjdGlvbi5kZXN0aW5hdGlvbklkICYmICh0cmlnZ2VyID09PSAnaG92ZXInIHx8IHRyaWdnZXIgPT09ICdtb3VzZS1lbnRlcicgfHwgdHJpZ2dlciA9PT0gJ2NsaWNrJykpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRlc3ROb2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQoYWN0aW9uLmRlc3RpbmF0aW9uSWQpO1xuICAgICAgICAgICAgICBpZiAoZGVzdE5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eUNoYW5nZXMgPSBkaWZmTm9kZVN0eWxlcyhub2RlLCBkZXN0Tm9kZSBhcyBTY2VuZU5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhwcm9wZXJ0eUNoYW5nZXMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudE5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZmlnbWFOb2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXIsXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246IHsgZHVyYXRpb24sIGVhc2luZyB9LFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eUNoYW5nZXMsXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAvLyBEZXN0aW5hdGlvbiBub2RlIG5vdCBhY2Nlc3NpYmxlIChkaWZmZXJlbnQgcGFnZSwgZXRjLilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2FsayhzZWN0aW9uUm9vdCk7XG4gIHJldHVybiBpbnRlcmFjdGlvbnM7XG59XG4iLCAiaW1wb3J0IHsgRmlnbWFWYXJpYWJsZXNFeHBvcnQgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHJnYlRvSGV4IH0gZnJvbSAnLi9jb2xvcic7XG5cbi8qKlxuICogRXh0cmFjdCBGaWdtYSBWYXJpYWJsZXMgKGRlc2lnbiB0b2tlbnMpIGZyb20gdGhlIGN1cnJlbnQgZmlsZS5cbiAqXG4gKiBXaGVuIGEgZGVzaWduZXIgaGFzIHNldCB1cCBGaWdtYSBWYXJpYWJsZXMgKGNvbG9ycywgbnVtYmVycywgc3RyaW5ncyxcbiAqIGJvb2xlYW5zKSB0aGUgdmFyaWFibGUgbmFtZXMgQVJFIHRoZSBkZXNpZ24gdG9rZW5zIHRoZSBkZXZlbG9wZXIgc2hvdWxkXG4gKiB1c2UuIFdlIGV4cG9ydCB0aGVtIGdyb3VwZWQgYnkgY29sbGVjdGlvbiBhbmQgZmxhdCBieSBmdWxsIG5hbWUgc29cbiAqIGFnZW50cyBjYW4gZW1pdCBgLS1jbHItcHJpbWFyeWAgaW5zdGVhZCBvZiBgLS1jbHItMWMxYzFjYC5cbiAqXG4gKiBSZXR1cm5zIGB7IHByZXNlbnQ6IGZhbHNlIH1gIHdoZW4gdGhlIEZpZ21hIFZhcmlhYmxlcyBBUEkgaXMgdW5hdmFpbGFibGVcbiAqIG9yIG5vIHZhcmlhYmxlcyBleGlzdC4gQWdlbnRzIGZhbGwgYmFjayB0byBhdXRvLWdlbmVyYXRlZCBuYW1lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RWYXJpYWJsZXMoKTogRmlnbWFWYXJpYWJsZXNFeHBvcnQge1xuICBjb25zdCBvdXQ6IEZpZ21hVmFyaWFibGVzRXhwb3J0ID0ge1xuICAgIGNvbGxlY3Rpb25zOiB7fSxcbiAgICBmbGF0OiB7fSxcbiAgICBwcmVzZW50OiBmYWxzZSxcbiAgfTtcblxuICAvLyBGZWF0dXJlLWRldGVjdCBcdTIwMTQgb2xkZXIgRmlnbWEgY2xpZW50cyBkb24ndCBoYXZlIHZhcmlhYmxlcyBBUElcbiAgaWYgKCFmaWdtYS52YXJpYWJsZXMgfHwgdHlwZW9mIGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBsZXQgY29sbGVjdGlvbnNCeUlkOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gIHRyeSB7XG4gICAgY29uc3QgbG9jYWxDb2xsZWN0aW9ucyA9IGZpZ21hLnZhcmlhYmxlcy5nZXRMb2NhbFZhcmlhYmxlQ29sbGVjdGlvbnMoKTtcbiAgICBmb3IgKGNvbnN0IGNvbCBvZiBsb2NhbENvbGxlY3Rpb25zKSB7XG4gICAgICBjb2xsZWN0aW9uc0J5SWRbY29sLmlkXSA9IGNvbDtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBsZXQgdmFyaWFibGVzOiBWYXJpYWJsZVtdID0gW107XG4gIHRyeSB7XG4gICAgdmFyaWFibGVzID0gZmlnbWEudmFyaWFibGVzLmdldExvY2FsVmFyaWFibGVzKCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBvdXQ7XG4gIH1cbiAgaWYgKCF2YXJpYWJsZXMgfHwgdmFyaWFibGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG91dDtcblxuICBvdXQucHJlc2VudCA9IHRydWU7XG5cbiAgZm9yIChjb25zdCB2IG9mIHZhcmlhYmxlcykge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uc0J5SWRbdi52YXJpYWJsZUNvbGxlY3Rpb25JZF07XG4gICAgaWYgKCFjb2xsZWN0aW9uKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGRlZmF1bHRNb2RlSWQgPSBjb2xsZWN0aW9uLmRlZmF1bHRNb2RlSWQ7XG4gICAgY29uc3QgcmF3ID0gdi52YWx1ZXNCeU1vZGVbZGVmYXVsdE1vZGVJZF07XG4gICAgaWYgKHJhdyA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcblxuICAgIGxldCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbjtcbiAgICBpZiAodi5yZXNvbHZlZFR5cGUgPT09ICdDT0xPUicpIHtcbiAgICAgIC8vIENPTE9SIHZhbHVlcyBhcmUgUkdCQSBvYmplY3RzOyBjb252ZXJ0IHRvIGhleFxuICAgICAgaWYgKHJhdyAmJiB0eXBlb2YgcmF3ID09PSAnb2JqZWN0JyAmJiAncicgaW4gcmF3KSB7XG4gICAgICAgIHZhbHVlID0gcmdiVG9IZXgocmF3IGFzIGFueSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHYucmVzb2x2ZWRUeXBlID09PSAnRkxPQVQnKSB7XG4gICAgICB2YWx1ZSA9IHR5cGVvZiByYXcgPT09ICdudW1iZXInID8gcmF3IDogTnVtYmVyKHJhdyk7XG4gICAgfSBlbHNlIGlmICh2LnJlc29sdmVkVHlwZSA9PT0gJ1NUUklORycpIHtcbiAgICAgIHZhbHVlID0gdHlwZW9mIHJhdyA9PT0gJ3N0cmluZycgPyByYXcgOiBTdHJpbmcocmF3KTtcbiAgICB9IGVsc2UgaWYgKHYucmVzb2x2ZWRUeXBlID09PSAnQk9PTEVBTicpIHtcbiAgICAgIHZhbHVlID0gQm9vbGVhbihyYXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IGNvbGxlY3Rpb24ubmFtZSB8fCAnRGVmYXVsdCc7XG4gICAgaWYgKCFvdXQuY29sbGVjdGlvbnNbY29sbGVjdGlvbk5hbWVdKSBvdXQuY29sbGVjdGlvbnNbY29sbGVjdGlvbk5hbWVdID0ge307XG4gICAgb3V0LmNvbGxlY3Rpb25zW2NvbGxlY3Rpb25OYW1lXVt2Lm5hbWVdID0gdmFsdWU7XG5cbiAgICAvLyBGbGF0IGtleTogXCI8Y29sbGVjdGlvbj4vPHZhcmlhYmxlLW5hbWU+XCIgc28gZHVwbGljYXRlcyBhY3Jvc3MgY29sbGVjdGlvbnMgZG9uJ3QgY29sbGlkZVxuICAgIGNvbnN0IGZsYXRLZXkgPSBgJHtjb2xsZWN0aW9uTmFtZX0vJHt2Lm5hbWV9YDtcbiAgICBvdXQuZmxhdFtmbGF0S2V5XSA9IHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgYSBGaWdtYSB2YXJpYWJsZSBuYW1lIHRvIGEgQ1NTIGN1c3RvbSBwcm9wZXJ0eSBuYW1lLlxuICogICBcIkNvbG9ycy9QcmltYXJ5XCIgXHUyMTkyIFwiLS1jbHItcHJpbWFyeVwiXG4gKiAgIFwiU3BhY2luZy9tZFwiIFx1MjE5MiBcIi0tc3BhY2UtbWRcIlxuICogICBcIlJhZGl1cy9sZ1wiIFx1MjE5MiBcIi0tcmFkaXVzLWxnXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvQ3NzQ3VzdG9tUHJvcGVydHkodmFyaWFibGVOYW1lOiBzdHJpbmcsIGNvbGxlY3Rpb25OYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjb2wgPSBjb2xsZWN0aW9uTmFtZS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBuYW1lID0gdmFyaWFibGVOYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXowLTldKy9nLCAnLScpLnJlcGxhY2UoLy0rL2csICctJykucmVwbGFjZSgvXi18LSQvZywgJycpO1xuXG4gIGlmIChjb2wuaW5jbHVkZXMoJ2NvbG9yJykgfHwgY29sLmluY2x1ZGVzKCdjb2xvdXInKSkgcmV0dXJuIGAtLWNsci0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygnc3BhYycpKSByZXR1cm4gYC0tc3BhY2UtJHtuYW1lfWA7XG4gIGlmIChjb2wuaW5jbHVkZXMoJ3JhZGl1cycpKSByZXR1cm4gYC0tcmFkaXVzLSR7bmFtZX1gO1xuICBpZiAoY29sLmluY2x1ZGVzKCdmb250JykgJiYgY29sLmluY2x1ZGVzKCdzaXplJykpIHJldHVybiBgLS1mcy0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygnZm9udCcpICYmIGNvbC5pbmNsdWRlcygnd2VpZ2h0JykpIHJldHVybiBgLS1mdy0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygnZm9udCcpIHx8IGNvbC5pbmNsdWRlcygnZmFtaWx5JykpIHJldHVybiBgLS1mZi0ke25hbWV9YDtcbiAgaWYgKGNvbC5pbmNsdWRlcygnbGluZScpKSByZXR1cm4gYC0tbGgtJHtuYW1lfWA7XG4gIHJldHVybiBgLS0ke2NvbC5yZXBsYWNlKC9bXmEtejAtOV0rL2csICctJyl9LSR7bmFtZX1gO1xufVxuIiwgImltcG9ydCB7XG4gIENvbXBvbmVudFBhdHRlcm4sIFJlcGVhdGVySW5mbywgUmVwZWF0ZXJJdGVtLCBOYXZpZ2F0aW9uSW5mbywgU2VjdGlvblR5cGUsXG59IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgc2x1Z2lmeSwgaXNEZWZhdWx0TGF5ZXJOYW1lIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBoYXNJbWFnZUZpbGwgfSBmcm9tICcuL2NvbG9yJztcblxuLyoqXG4gKiBDb21wdXRlIGEgbG9vc2UgXCJzdHJ1Y3R1cmUgZmluZ2VycHJpbnRcIiBmb3IgYSBub2RlLiBUd28gY2hpbGRyZW4gd2l0aCB0aGVcbiAqIHNhbWUgZmluZ2VycHJpbnQgYXJlIHRyZWF0ZWQgYXMgc2libGluZ3Mgb2YgdGhlIHNhbWUgcmVwZWF0ZXIgdGVtcGxhdGVcbiAqIChzYW1lIGNhcmQgbGF5b3V0IHJlcGVhdGVkIDMgdGltZXMsIGV0Yy4pLiBXZSBkZWxpYmVyYXRlbHkgaWdub3JlIHRleHRcbiAqIGNvbnRlbnQgYW5kIHNwZWNpZmljIHNpemVzIHNvIG1pbm9yIHZhcmlhdGlvbnMgc3RpbGwgbWF0Y2guXG4gKi9cbmZ1bmN0aW9uIHN0cnVjdHVyZUZpbmdlcnByaW50KG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlciA9IDApOiBzdHJpbmcge1xuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbYFQ9JHtub2RlLnR5cGV9YF07XG4gIGlmIChoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpKSBwYXJ0cy5wdXNoKCdJTUcnKTtcblxuICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlICYmIGRlcHRoIDwgMikge1xuICAgIGNvbnN0IGNoaWxkRnBzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkLnZpc2libGUgPT09IGZhbHNlKSBjb250aW51ZTtcbiAgICAgIGNoaWxkRnBzLnB1c2goc3RydWN0dXJlRmluZ2VycHJpbnQoY2hpbGQsIGRlcHRoICsgMSkpO1xuICAgIH1cbiAgICBjaGlsZEZwcy5zb3J0KCk7XG4gICAgcGFydHMucHVzaChgQz1bJHtjaGlsZEZwcy5qb2luKCcsJyl9XWApO1xuICB9XG4gIHJldHVybiBwYXJ0cy5qb2luKCd8Jyk7XG59XG5cbmNvbnN0IFJFUEVBVEVSX05BTUVfSElOVFMgPSAvXFxiKGNhcmRzP3xpdGVtcz98bGlzdHxncmlkfGZlYXR1cmVzP3xzZXJ2aWNlcz98dGVhbXxsb2dvcz98dGVzdGltb25pYWxzP3xwcmljaW5nfHBsYW5zP3xhcnRpY2xlcz98cG9zdHM/fGJsb2d8ZmFxcz8pXFxiL2k7XG5cbi8qKlxuICogRGV0ZWN0IHJlcGVhdGVyIGdyb3VwcyBpbnNpZGUgYSBzZWN0aW9uLiBDb25zZXJ2YXRpdmU6XG4gKiAgIC0gXHUyMjY1MyBjaGlsZHJlbiBzaGFyZSBhIGZpbmdlcnByaW50LCBPUlxuICogICAtIFx1MjI2NTIgY2hpbGRyZW4gc2hhcmUgYSBmaW5nZXJwcmludCBBTkQgdGhlIHBhcmVudCBuYW1lIGhpbnRzIHJlcGV0aXRpb25cbiAqICAgICBBTkQgdGhlIG1hdGNoaW5nIGdyb3VwIGNvdmVycyBcdTIyNjU2MCUgb2YgdmlzaWJsZSBjaGlsZHJlbi5cbiAqXG4gKiBUaGUgZXhpc3RpbmcgYGVsZW1lbnRzYCBtYXAgaXMgdW50b3VjaGVkIFx1MjAxNCByZXBlYXRlcnMgYXJlIGFuIGFkZGl0aXZlXG4gKiBzaWduYWwgdGhlIGFnZW50IGNhbiBvcHQgaW50byBmb3IgY2xlYW5lciBBQ0YgUmVwZWF0ZXIgb3V0cHV0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0UmVwZWF0ZXJzKHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUpOiBSZWNvcmQ8c3RyaW5nLCBSZXBlYXRlckluZm8+IHtcbiAgY29uc3QgcmVwZWF0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBSZXBlYXRlckluZm8+ID0ge307XG4gIGNvbnN0IHVzZWRLZXlzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZnVuY3Rpb24ga2V5Rm9yKGNvbnRhaW5lck5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYmFzZSA9IGNvbnRhaW5lck5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJylcbiAgICAgIHx8IGByZXBlYXRlcl8ke09iamVjdC5rZXlzKHJlcGVhdGVycykubGVuZ3RoICsgMX1gO1xuICAgIGlmICghdXNlZEtleXMuaGFzKGJhc2UpKSB7XG4gICAgICB1c2VkS2V5cy5hZGQoYmFzZSk7XG4gICAgICByZXR1cm4gYmFzZTtcbiAgICB9XG4gICAgbGV0IGkgPSAyO1xuICAgIHdoaWxlICh1c2VkS2V5cy5oYXMoYCR7YmFzZX1fJHtpfWApKSBpKys7XG4gICAgdXNlZEtleXMuYWRkKGAke2Jhc2V9XyR7aX1gKTtcbiAgICByZXR1cm4gYCR7YmFzZX1fJHtpfWA7XG4gIH1cblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmIChkZXB0aCA+IDUpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoISgnY2hpbGRyZW4nIGluIG5vZGUpKSByZXR1cm4gZmFsc2U7XG5cbiAgICBjb25zdCBraWRzID0gKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbi5maWx0ZXIoYyA9PiBjLnZpc2libGUgIT09IGZhbHNlKTtcbiAgICBpZiAoa2lkcy5sZW5ndGggPj0gMikge1xuICAgICAgY29uc3QgZ3JvdXBzID0gbmV3IE1hcDxzdHJpbmcsIFNjZW5lTm9kZVtdPigpO1xuICAgICAgZm9yIChjb25zdCBrIG9mIGtpZHMpIHtcbiAgICAgICAgY29uc3QgZnAgPSBzdHJ1Y3R1cmVGaW5nZXJwcmludChrKTtcbiAgICAgICAgaWYgKCFncm91cHMuaGFzKGZwKSkgZ3JvdXBzLnNldChmcCwgW10pO1xuICAgICAgICBncm91cHMuZ2V0KGZwKSEucHVzaChrKTtcbiAgICAgIH1cbiAgICAgIGxldCBiZXN0R3JvdXA6IFNjZW5lTm9kZVtdIHwgbnVsbCA9IG51bGw7XG4gICAgICBmb3IgKGNvbnN0IGcgb2YgZ3JvdXBzLnZhbHVlcygpKSB7XG4gICAgICAgIGlmICghYmVzdEdyb3VwIHx8IGcubGVuZ3RoID4gYmVzdEdyb3VwLmxlbmd0aCkgYmVzdEdyb3VwID0gZztcbiAgICAgIH1cbiAgICAgIGlmIChiZXN0R3JvdXAgJiYgYmVzdEdyb3VwLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgIGNvbnN0IGlzQmlnR3JvdXAgPSBiZXN0R3JvdXAubGVuZ3RoID49IDM7XG4gICAgICAgIGNvbnN0IGhpbnRNYXRjaCA9IFJFUEVBVEVSX05BTUVfSElOVFMudGVzdChub2RlLm5hbWUgfHwgJycpO1xuICAgICAgICBjb25zdCBkb21pbmF0ZXMgPSBiZXN0R3JvdXAubGVuZ3RoID49IE1hdGguY2VpbChraWRzLmxlbmd0aCAqIDAuNik7XG4gICAgICAgIGlmIChpc0JpZ0dyb3VwIHx8IChoaW50TWF0Y2ggJiYgZG9taW5hdGVzKSkge1xuICAgICAgICAgIGNvbnN0IGtleSA9IGtleUZvcihub2RlLm5hbWUgfHwgJ3JlcGVhdGVyJyk7XG4gICAgICAgICAgcmVwZWF0ZXJzW2tleV0gPSB7XG4gICAgICAgICAgICBjb250YWluZXJMYXllck5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgIGl0ZW1Db3VudDogYmVzdEdyb3VwLmxlbmd0aCxcbiAgICAgICAgICAgIHRlbXBsYXRlTGF5ZXJOYW1lOiBiZXN0R3JvdXBbMF0ubmFtZSxcbiAgICAgICAgICAgIGl0ZW1zOiBiZXN0R3JvdXAubWFwKGV4dHJhY3RSZXBlYXRlckl0ZW0pLFxuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIHRydWU7IC8vIERvbid0IHJlY3Vyc2UgaW50byByZXBlYXRlciBjaGlsZHJlblxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjIG9mIGtpZHMpIHdhbGsoYywgZGVwdGggKyAxKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoJ2NoaWxkcmVuJyBpbiBzZWN0aW9uTm9kZSkge1xuICAgIGZvciAoY29uc3QgYyBvZiAoc2VjdGlvbk5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgaWYgKGMudmlzaWJsZSAhPT0gZmFsc2UpIHdhbGsoYywgMCk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXBlYXRlcnM7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RSZXBlYXRlckl0ZW0obm9kZTogU2NlbmVOb2RlKTogUmVwZWF0ZXJJdGVtIHtcbiAgY29uc3QgaXRlbTogUmVwZWF0ZXJJdGVtID0geyB0ZXh0czoge30gfTtcbiAgbGV0IHRleHRJbmRleCA9IDA7XG4gIGxldCBmaXJzdEltYWdlTmFtZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGxldCBmaXJzdEltYWdlQWx0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBmdW5jdGlvbiB3YWxrKG46IFNjZW5lTm9kZSkge1xuICAgIGlmIChuLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBpZiAobi50eXBlID09PSAnVEVYVCcpIHtcbiAgICAgIGNvbnN0IHQgPSBuIGFzIFRleHROb2RlO1xuICAgICAgY29uc3QgY2xlYW4gPSAodC5uYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIGNvbnN0IHJvbGUgPSBjbGVhbiAmJiAhL14odGV4dHxmcmFtZXxncm91cHxyZWN0YW5nbGUpXFxkKiQvLnRlc3QoY2xlYW4pXG4gICAgICAgID8gY2xlYW4gOiBgdGV4dF8ke3RleHRJbmRleH1gO1xuICAgICAgaWYgKHQuY2hhcmFjdGVycykgaXRlbS50ZXh0c1tyb2xlXSA9IHQuY2hhcmFjdGVycztcbiAgICAgIHRleHRJbmRleCsrO1xuICAgIH1cblxuICAgIGlmICghZmlyc3RJbWFnZU5hbWUgJiYgaGFzSW1hZ2VGaWxsKG4gYXMgYW55KSkge1xuICAgICAgZmlyc3RJbWFnZU5hbWUgPSBgJHtzbHVnaWZ5KG4ubmFtZSB8fCAnaW1hZ2UnKX0ucG5nYDtcbiAgICAgIGlmIChuLm5hbWUgJiYgIWlzRGVmYXVsdExheWVyTmFtZShuLm5hbWUpKSB7XG4gICAgICAgIGZpcnN0SW1hZ2VBbHQgPSBuLm5hbWUucmVwbGFjZSgvWy1fXS9nLCAnICcpLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKClcbiAgICAgICAgICAucmVwbGFjZSgvXFxiXFx3L2csIGMgPT4gYy50b1VwcGVyQ2FzZSgpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWl0ZW0ubGlua1VybCAmJiAncmVhY3Rpb25zJyBpbiBuKSB7XG4gICAgICBjb25zdCByZWFjdGlvbnMgPSAobiBhcyBhbnkpLnJlYWN0aW9ucztcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlYWN0aW9ucykpIHtcbiAgICAgICAgb3V0ZXI6IGZvciAoY29uc3QgciBvZiByZWFjdGlvbnMpIHtcbiAgICAgICAgICBjb25zdCBhY3Rpb25zID0gci5hY3Rpb25zIHx8IChyLmFjdGlvbiA/IFtyLmFjdGlvbl0gOiBbXSk7XG4gICAgICAgICAgZm9yIChjb25zdCBhIG9mIGFjdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChhICYmIGEudHlwZSA9PT0gJ1VSTCcgJiYgYS51cmwpIHsgaXRlbS5saW5rVXJsID0gYS51cmw7IGJyZWFrIG91dGVyOyB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbikge1xuICAgICAgZm9yIChjb25zdCBjIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoYyk7XG4gICAgfVxuICB9XG4gIHdhbGsobm9kZSk7XG4gIGlmIChmaXJzdEltYWdlTmFtZSkgaXRlbS5pbWFnZUZpbGUgPSBmaXJzdEltYWdlTmFtZTtcbiAgaWYgKGZpcnN0SW1hZ2VBbHQpIGl0ZW0uYWx0ID0gZmlyc3RJbWFnZUFsdDtcbiAgcmV0dXJuIGl0ZW07XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gQ29tcG9uZW50IHBhdHRlcm5zOiBjYXJvdXNlbCAvIGFjY29yZGlvbiAvIHRhYnMgLyBtb2RhbFxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmNvbnN0IENBUk9VU0VMX1JYID0gL1xcYihjYXJvdXNlbHxzbGlkZXJ8c3dpcGVyfGdhbGxlcnl8c2xpZGVzaG93KVxcYi9pO1xuY29uc3QgQUNDT1JESU9OX1JYID0gL1xcYihhY2NvcmRpb258ZmFxfGNvbGxhcHNlfGV4cGFuZGVyfGNvbGxhcHNpYmxlKVxcYi9pO1xuY29uc3QgVEFCU19SWCA9IC9cXGJ0YWJzP1xcYi9pO1xuY29uc3QgTU9EQUxfUlggPSAvXFxiKG1vZGFsfHBvcHVwfGRpYWxvZ3xvdmVybGF5fGxpZ2h0Ym94KVxcYi9pO1xuXG4vKipcbiAqIERldGVjdCBpbnRlcmFjdGl2ZSBjb21wb25lbnQgcGF0dGVybnMuIFdlIGZhdm91ciBleHBsaWNpdCBsYXllci1uYW1lXG4gKiBtYXRjaGVzIG92ZXIgcHVyZSBzdHJ1Y3R1cmFsIGRldGVjdGlvbiB0byBrZWVwIGZhbHNlIHBvc2l0aXZlcyBsb3cuXG4gKiBXaGVuIHRoZSBuYW1lIG1hdGNoZXMsIGNvbmZpZGVuY2UgaXMgJ2hpZ2gnOyB3aGVuIGluZmVycmVkIHN0cnVjdHVyYWxseSxcbiAqIGNvbmZpZGVuY2UgaXMgJ2xvdycgYW5kIHRoZSBhZ2VudCBzaG91bGQgdmVyaWZ5IGFnYWluc3QgdGhlIHNjcmVlbnNob3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDb21wb25lbnRQYXR0ZXJucyhzZWN0aW9uTm9kZTogU2NlbmVOb2RlKTogQ29tcG9uZW50UGF0dGVybltdIHtcbiAgY29uc3QgcGF0dGVybnM6IENvbXBvbmVudFBhdHRlcm5bXSA9IFtdO1xuICBjb25zdCBzZWVuTm9kZUlkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZ1bmN0aW9uIGFkZFBhdHRlcm4ocDogQ29tcG9uZW50UGF0dGVybikge1xuICAgIGlmIChzZWVuTm9kZUlkcy5oYXMocC5yb290Tm9kZUlkKSkgcmV0dXJuO1xuICAgIHNlZW5Ob2RlSWRzLmFkZChwLnJvb3ROb2RlSWQpO1xuICAgIHBhdHRlcm5zLnB1c2gocCk7XG4gIH1cblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcikge1xuICAgIGlmIChkZXB0aCA+IDYgfHwgbm9kZS52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIGNvbnN0IG5hbWUgPSBub2RlLm5hbWUgfHwgJyc7XG5cbiAgICAvLyBNT0RBTCBcdTIwMTQgbmFtZS1vbmx5IGRldGVjdGlvbiAoc3RydWN0dXJhbCBkZXRlY3Rpb24gaXMgdG9vIG5vaXN5KS5cbiAgICBpZiAoTU9EQUxfUlgudGVzdChuYW1lKSAmJiAnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGFkZFBhdHRlcm4oe1xuICAgICAgICB0eXBlOiAnbW9kYWwnLFxuICAgICAgICByb290Tm9kZUlkOiBub2RlLmlkLFxuICAgICAgICByb290Tm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgY29uZmlkZW5jZTogJ2hpZ2gnLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47IC8vIGRvbid0IHJlY3Vyc2UgaW50byBtb2RhbCBpbnRlcm5hbHNcbiAgICB9XG5cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgY29uc3Qga2lkcyA9IGZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+IGMudmlzaWJsZSAhPT0gZmFsc2UpO1xuXG4gICAgICAvLyBDQVJPVVNFTDogZXhwbGljaXQgbmFtZSBPUiAoaG9yaXpvbnRhbCArIGNsaXBzQ29udGVudCArIFx1MjI2NTMgc2ltaWxhciBjaGlsZHJlbilcbiAgICAgIGNvbnN0IG5hbWVDYXJvdXNlbCA9IENBUk9VU0VMX1JYLnRlc3QobmFtZSk7XG4gICAgICBjb25zdCBob3Jpem9udGFsQ2xpcHBlZCA9IGZyYW1lLmxheW91dE1vZGUgPT09ICdIT1JJWk9OVEFMJyAmJiBmcmFtZS5jbGlwc0NvbnRlbnQgPT09IHRydWU7XG4gICAgICBpZiAobmFtZUNhcm91c2VsIHx8IGhvcml6b250YWxDbGlwcGVkKSB7XG4gICAgICAgIGlmIChraWRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgY29uc3QgZnAwID0gc3RydWN0dXJlRmluZ2VycHJpbnQoa2lkc1swXSk7XG4gICAgICAgICAgY29uc3QgbWF0Y2hpbmcgPSBraWRzLmZpbHRlcihrID0+IHN0cnVjdHVyZUZpbmdlcnByaW50KGspID09PSBmcDApLmxlbmd0aDtcbiAgICAgICAgICBpZiAobWF0Y2hpbmcgPj0gMykge1xuICAgICAgICAgICAgYWRkUGF0dGVybih7XG4gICAgICAgICAgICAgIHR5cGU6ICdjYXJvdXNlbCcsXG4gICAgICAgICAgICAgIHJvb3ROb2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgICAgIHJvb3ROb2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICBpdGVtQ291bnQ6IG1hdGNoaW5nLFxuICAgICAgICAgICAgICBjb25maWRlbmNlOiBuYW1lQ2Fyb3VzZWwgPyAnaGlnaCcgOiAnbG93JyxcbiAgICAgICAgICAgICAgbWV0YToge1xuICAgICAgICAgICAgICAgIGxheW91dE1vZGU6IGZyYW1lLmxheW91dE1vZGUsXG4gICAgICAgICAgICAgICAgY2xpcHNDb250ZW50OiBmcmFtZS5jbGlwc0NvbnRlbnQsXG4gICAgICAgICAgICAgICAgaXRlbVNwYWNpbmc6IGZyYW1lLml0ZW1TcGFjaW5nID8/IG51bGwsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQUNDT1JESU9OOiBuYW1lIG1hdGNoICsgXHUyMjY1MiBjaGlsZCBpdGVtc1xuICAgICAgaWYgKEFDQ09SRElPTl9SWC50ZXN0KG5hbWUpICYmIGtpZHMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgY29uc3QgaXRlbXM6IEFycmF5PHsgcXVlc3Rpb246IHN0cmluZzsgYW5zd2VyPzogc3RyaW5nIH0+ID0gW107XG4gICAgICAgIGZvciAoY29uc3QgayBvZiBraWRzKSB7XG4gICAgICAgICAgY29uc3QgYWxsID0gY29sbGVjdEFsbFRleHQoayk7XG4gICAgICAgICAgaWYgKGFsbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpdGVtcy5wdXNoKHsgcXVlc3Rpb246IGFsbFswXSwgYW5zd2VyOiBhbGwuc2xpY2UoMSkuam9pbignICcpIHx8IHVuZGVmaW5lZCB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgYWRkUGF0dGVybih7XG4gICAgICAgICAgICB0eXBlOiAnYWNjb3JkaW9uJyxcbiAgICAgICAgICAgIHJvb3ROb2RlSWQ6IG5vZGUuaWQsXG4gICAgICAgICAgICByb290Tm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgIGl0ZW1Db3VudDogaXRlbXMubGVuZ3RoLFxuICAgICAgICAgICAgY29uZmlkZW5jZTogJ2hpZ2gnLFxuICAgICAgICAgICAgbWV0YTogeyBpdGVtcyB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUQUJTOiBuYW1lIG1hdGNoICsgXHUyMjY1MiBjaGlsZHJlblxuICAgICAgaWYgKFRBQlNfUlgudGVzdChuYW1lKSAmJiBraWRzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgIGFkZFBhdHRlcm4oe1xuICAgICAgICAgIHR5cGU6ICd0YWJzJyxcbiAgICAgICAgICByb290Tm9kZUlkOiBub2RlLmlkLFxuICAgICAgICAgIHJvb3ROb2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgIGl0ZW1Db3VudDoga2lkcy5sZW5ndGgsXG4gICAgICAgICAgY29uZmlkZW5jZTogJ2hpZ2gnLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IGMgb2Yga2lkcykgd2FsayhjLCBkZXB0aCArIDEpO1xuICAgIH1cbiAgfVxuXG4gIHdhbGsoc2VjdGlvbk5vZGUsIDApO1xuICByZXR1cm4gcGF0dGVybnM7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RBbGxUZXh0KG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZ1tdIHtcbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBmdW5jdGlvbiB3YWxrKG46IFNjZW5lTm9kZSkge1xuICAgIGlmIChuLnZpc2libGUgPT09IGZhbHNlKSByZXR1cm47XG4gICAgaWYgKG4udHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCBjaGFycyA9ICgobiBhcyBUZXh0Tm9kZSkuY2hhcmFjdGVycyB8fCAnJykudHJpbSgpO1xuICAgICAgaWYgKGNoYXJzKSBvdXQucHVzaChjaGFycyk7XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG4pIHtcbiAgICAgIGZvciAoY29uc3QgYyBvZiAobiBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB3YWxrKGMpO1xuICAgIH1cbiAgfVxuICB3YWxrKG5vZGUpO1xuICByZXR1cm4gb3V0O1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIE5hdmlnYXRpb24gZXh0cmFjdGlvblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbi8qKlxuICogRGV0ZWN0IG5hdmlnYXRpb24gbGlua3MgaW5zaWRlIGEgc2VjdGlvbiBcdTIwMTQgc2hvcnQgdGV4dCBub2RlcyB0aGF0IGxvb2tcbiAqIGxpa2UgbWVudSBpdGVtcyAoXHUyMjY0NDAgY2hhcnMsIGZvbnQgc2l6ZSBcdTIyNjQyMnB4KS4gUmV0dXJucyBudWxsIHdoZW4gdGhlcmVcbiAqIGFyZSBmZXdlciB0aGFuIDIgc3VjaCBsaW5rcyAob25lIGxpbmsgaXNuJ3QgYSBtZW51KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdE5hdmlnYXRpb24oc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSk6IE5hdmlnYXRpb25JbmZvIHwgbnVsbCB7XG4gIGNvbnN0IGxpbmtzOiBBcnJheTx7IGxhYmVsOiBzdHJpbmc7IGhyZWY/OiBzdHJpbmcgfCBudWxsIH0+ID0gW107XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcikge1xuICAgIGlmIChkZXB0aCA+IDYgfHwgbm9kZS52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgdCA9IG5vZGUgYXMgVGV4dE5vZGU7XG4gICAgICBjb25zdCB0ZXh0ID0gKHQuY2hhcmFjdGVycyB8fCAnJykudHJpbSgpO1xuICAgICAgaWYgKCF0ZXh0IHx8IHRleHQubGVuZ3RoID4gNDApIHJldHVybjtcbiAgICAgIGNvbnN0IGZzID0gdC5mb250U2l6ZSAhPT0gZmlnbWEubWl4ZWQgPyAodC5mb250U2l6ZSBhcyBudW1iZXIpIDogMTY7XG4gICAgICBpZiAoZnMgPiAyMikgcmV0dXJuO1xuICAgICAgaWYgKHNlZW4uaGFzKHRleHQudG9Mb3dlckNhc2UoKSkpIHJldHVybjtcbiAgICAgIHNlZW4uYWRkKHRleHQudG9Mb3dlckNhc2UoKSk7XG5cbiAgICAgIGxldCBocmVmOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgIGNvbnN0IHJlYWN0aW9ucyA9ICh0IGFzIGFueSkucmVhY3Rpb25zO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVhY3Rpb25zKSkge1xuICAgICAgICBvdXRlcjogZm9yIChjb25zdCByIG9mIHJlYWN0aW9ucykge1xuICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSByLmFjdGlvbnMgfHwgKHIuYWN0aW9uID8gW3IuYWN0aW9uXSA6IFtdKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGEgb2YgYWN0aW9ucykge1xuICAgICAgICAgICAgaWYgKGEgJiYgYS50eXBlID09PSAnVVJMJyAmJiBhLnVybCkgeyBocmVmID0gYS51cmw7IGJyZWFrIG91dGVyOyB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsaW5rcy5wdXNoKHsgbGFiZWw6IHRleHQsIGhyZWYgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgYyBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB3YWxrKGMsIGRlcHRoICsgMSk7XG4gICAgfVxuICB9XG4gIHdhbGsoc2VjdGlvbk5vZGUsIDApO1xuICBpZiAobGlua3MubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7IGxpbmtzIH07XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gU2VjdGlvbiBzZW1hbnRpYyByb2xlXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuaW50ZXJmYWNlIEluZmVyVHlwZVBhcmFtcyB7XG4gIHNlY3Rpb25JbmRleDogbnVtYmVyO1xuICB0b3RhbFNlY3Rpb25zOiBudW1iZXI7XG4gIGlzRm9ybVNlY3Rpb246IGJvb2xlYW47XG4gIHBhdHRlcm5zOiBDb21wb25lbnRQYXR0ZXJuW107XG4gIHJlcGVhdGVyczogUmVjb3JkPHN0cmluZywgUmVwZWF0ZXJJbmZvPjtcbiAgZWxlbWVudHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICB0ZXh0Q29udGVudEluT3JkZXI6IEFycmF5PHsgdGV4dDogc3RyaW5nOyBmb250U2l6ZTogbnVtYmVyOyByb2xlOiBzdHJpbmcgfT47XG4gIGxheWVyTmFtZTogc3RyaW5nO1xuICBzZWN0aW9uSGVpZ2h0OiBudW1iZXI7XG4gIGlzR2xvYmFsPzogYm9vbGVhbjtcbiAgZ2xvYmFsUm9sZT86ICdoZWFkZXInIHwgJ2Zvb3RlcicgfCBudWxsO1xufVxuXG4vKipcbiAqIEluZmVyIHRoZSBzZW1hbnRpYyB0eXBlIG9mIGEgc2VjdGlvbi4gUHVyZSBpbmZlcmVuY2UgXHUyMDE0IHJldHVybnMgJ2dlbmVyaWMnXG4gKiArICdsb3cnIGNvbmZpZGVuY2Ugd2hlbiBub3RoaW5nIG1hdGNoZXMgY2xlYXJseS4gVGhlIGFnZW50IHNob3VsZCB0cmVhdFxuICogJ2hpZ2gnIGNvbmZpZGVuY2UgYXMgYXV0aG9yaXRhdGl2ZSBhbmQgJ2xvdycgYXMgYSBoaW50IG9ubHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmZlclNlY3Rpb25UeXBlKHA6IEluZmVyVHlwZVBhcmFtcyk6IHsgdHlwZTogU2VjdGlvblR5cGU7IGNvbmZpZGVuY2U6ICdoaWdoJyB8ICdsb3cnIH0ge1xuICAvLyBHbG9iYWwgaGVhZGVyL2Zvb3RlciBvdmVycmlkZXMgZXZlcnl0aGluZ1xuICBpZiAocC5pc0dsb2JhbCAmJiBwLmdsb2JhbFJvbGUgPT09ICdoZWFkZXInKSByZXR1cm4geyB0eXBlOiAnaGVhZGVyJywgY29uZmlkZW5jZTogJ2hpZ2gnIH07XG4gIGlmIChwLmlzR2xvYmFsICYmIHAuZ2xvYmFsUm9sZSA9PT0gJ2Zvb3RlcicpIHJldHVybiB7IHR5cGU6ICdmb290ZXInLCBjb25maWRlbmNlOiAnaGlnaCcgfTtcblxuICBjb25zdCBuYW1lID0gKHAubGF5ZXJOYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBleHBsaWNpdDogQXJyYXk8eyByeDogUmVnRXhwOyB0eXBlOiBTZWN0aW9uVHlwZSB9PiA9IFtcbiAgICB7IHJ4OiAvXFxiaGVyb1xcYi8sIHR5cGU6ICdoZXJvJyB9LFxuICAgIHsgcng6IC9cXGIoZmVhdHVyZXM/fGJlbmVmaXRzP3xzZXJ2aWNlcz8pXFxiLywgdHlwZTogJ2ZlYXR1cmVzJyB9LFxuICAgIHsgcng6IC9cXGJ0ZXN0aW1vbmlhbHM/XFxiLywgdHlwZTogJ3Rlc3RpbW9uaWFscycgfSxcbiAgICB7IHJ4OiAvXFxiKGN0YXxjYWxsWy0gXT90b1stIF0/YWN0aW9uKVxcYi8sIHR5cGU6ICdjdGEnIH0sXG4gICAgeyByeDogL1xcYihmYXFzP3xmcmVxdWVudGx5Wy0gXWFza2VkKVxcYi8sIHR5cGU6ICdmYXEnIH0sXG4gICAgeyByeDogL1xcYihwcmljaW5nfHBsYW5zPylcXGIvLCB0eXBlOiAncHJpY2luZycgfSxcbiAgICB7IHJ4OiAvXFxiY29udGFjdFxcYi8sIHR5cGU6ICdjb250YWN0JyB9LFxuICAgIHsgcng6IC9cXGIobG9nb3M/fGNsaWVudHM/fHBhcnRuZXJzP3xicmFuZHM/KVxcYi8sIHR5cGU6ICdsb2dvcycgfSxcbiAgICB7IHJ4OiAvXFxiZm9vdGVyXFxiLywgdHlwZTogJ2Zvb3RlcicgfSxcbiAgICB7IHJ4OiAvXFxiKGhlYWRlcnxuYXZ8bmF2YmFyfG5hdmlnYXRpb24pXFxiLywgdHlwZTogJ2hlYWRlcicgfSxcbiAgICB7IHJ4OiAvXFxiKGJsb2d8YXJ0aWNsZXM/fG5ld3N8cG9zdHM/KVxcYi8sIHR5cGU6ICdibG9nX2dyaWQnIH0sXG4gIF07XG4gIGZvciAoY29uc3QgeyByeCwgdHlwZSB9IG9mIGV4cGxpY2l0KSB7XG4gICAgaWYgKHJ4LnRlc3QobmFtZSkpIHJldHVybiB7IHR5cGUsIGNvbmZpZGVuY2U6ICdoaWdoJyB9O1xuICB9XG5cbiAgLy8gUGF0dGVybiBzaWduYWxzXG4gIGlmIChwLnBhdHRlcm5zLnNvbWUocHQgPT4gcHQudHlwZSA9PT0gJ2FjY29yZGlvbicpKSByZXR1cm4geyB0eXBlOiAnZmFxJywgY29uZmlkZW5jZTogJ2hpZ2gnIH07XG4gIGlmIChwLmlzRm9ybVNlY3Rpb24pIHJldHVybiB7IHR5cGU6ICdjb250YWN0JywgY29uZmlkZW5jZTogJ2hpZ2gnIH07XG5cbiAgLy8gUmVwZWF0ZXIgY29udGVudCBzaGFwZVxuICBjb25zdCByZXBLZXlzID0gT2JqZWN0LmtleXMocC5yZXBlYXRlcnMpO1xuICBpZiAocmVwS2V5cy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgcmVwID0gcC5yZXBlYXRlcnNbcmVwS2V5c1swXV07XG4gICAgY29uc3QgZmlyc3QgPSByZXAuaXRlbXNbMF07XG4gICAgaWYgKGZpcnN0KSB7XG4gICAgICBjb25zdCBoYXNJbWFnZSA9ICEhZmlyc3QuaW1hZ2VGaWxlO1xuICAgICAgY29uc3QgdGV4dFZhbHMgPSBPYmplY3QudmFsdWVzKGZpcnN0LnRleHRzKTtcbiAgICAgIGNvbnN0IHRleHRLZXlzID0gT2JqZWN0LmtleXMoZmlyc3QudGV4dHMpO1xuICAgICAgY29uc3Qgam9pbmVkID0gdGV4dFZhbHMuam9pbignICcpO1xuICAgICAgY29uc3QgaGFzUHJpY2UgPSAvWyRcdTIwQUNcdTAwQTNdXFxzKlxcZHxcXGJcXGQrXFxzKihcXC8obW98eXIpfHBlciAobW9udGh8eWVhcikpXFxiL2kudGVzdChqb2luZWQpO1xuICAgICAgY29uc3QgbG9uZ1F1b3RlID0gdGV4dFZhbHMuc29tZSh2ID0+ICh2IHx8ICcnKS5sZW5ndGggPiAxMDApO1xuICAgICAgY29uc3QgaXNMb2dvT25seSA9IGhhc0ltYWdlICYmIHRleHRLZXlzLmxlbmd0aCA9PT0gMDtcbiAgICAgIGNvbnN0IGhhc0RhdGUgPSAvXFxiKGphbnxmZWJ8bWFyfGFwcnxtYXl8anVufGp1bHxhdWd8c2VwfG9jdHxub3Z8ZGVjKVxcdypcXHMrXFxkezEsMn0vaS50ZXN0KGpvaW5lZClcbiAgICAgICAgICAgICAgICAgICB8fCAvXFxkezR9LVxcZHsyfS1cXGR7Mn0vLnRlc3Qoam9pbmVkKVxuICAgICAgICAgICAgICAgICAgIHx8IC9cXGIobWluIHJlYWR8cmVhZGluZyB0aW1lKVxcYi9pLnRlc3Qoam9pbmVkKTtcblxuICAgICAgaWYgKGhhc1ByaWNlKSByZXR1cm4geyB0eXBlOiAncHJpY2luZycsIGNvbmZpZGVuY2U6ICdsb3cnIH07XG4gICAgICBpZiAoaXNMb2dvT25seSkgcmV0dXJuIHsgdHlwZTogJ2xvZ29zJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgICAgIGlmIChoYXNEYXRlKSByZXR1cm4geyB0eXBlOiAnYmxvZ19ncmlkJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgICAgIGlmIChsb25nUXVvdGUpIHJldHVybiB7IHR5cGU6ICd0ZXN0aW1vbmlhbHMnLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICAgICAgaWYgKGhhc0ltYWdlICYmIHRleHRLZXlzLmxlbmd0aCA+PSAyKSByZXR1cm4geyB0eXBlOiAnZmVhdHVyZXMnLCBjb25maWRlbmNlOiAnbG93JyB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIEZpcnN0LXNlY3Rpb24gaGVybyBoZXVyaXN0aWNcbiAgaWYgKHAuc2VjdGlvbkluZGV4ID09PSAwKSB7XG4gICAgY29uc3QgaGFzQmlnSGVhZGluZyA9IHAudGV4dENvbnRlbnRJbk9yZGVyLnNvbWUodCA9PiB0LmZvbnRTaXplID49IDQwKTtcbiAgICBjb25zdCBoYXNCdXR0b24gPSBPYmplY3Qua2V5cyhwLmVsZW1lbnRzKS5zb21lKGsgPT4gL2J1dHRvbnxjdGF8YnRuL2kudGVzdChrKSk7XG4gICAgY29uc3QgaGFzSW1hZ2UgPSBPYmplY3Qua2V5cyhwLmVsZW1lbnRzKS5zb21lKGsgPT4gL2ltYWdlfHBob3RvfGhlcm8vaS50ZXN0KGspIHx8IGsgPT09ICdiYWNrZ3JvdW5kX2ltYWdlJyk7XG4gICAgaWYgKGhhc0JpZ0hlYWRpbmcgJiYgKGhhc0J1dHRvbiB8fCBoYXNJbWFnZSkpIHJldHVybiB7IHR5cGU6ICdoZXJvJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgfVxuXG4gIC8vIFNob3J0IHNlY3Rpb24gd2l0aCBoZWFkaW5nICsgYnV0dG9uIFx1MjE5MiBDVEFcbiAgY29uc3QgaGFzQnV0dG9uRWwgPSBPYmplY3Qua2V5cyhwLmVsZW1lbnRzKS5maWx0ZXIoayA9PiAvYnV0dG9ufGN0YXxidG4vaS50ZXN0KGspKS5sZW5ndGggPj0gMTtcbiAgY29uc3QgdGV4dENvdW50ID0gcC50ZXh0Q29udGVudEluT3JkZXIubGVuZ3RoO1xuICBpZiAoaGFzQnV0dG9uRWwgJiYgdGV4dENvdW50IDw9IDMgJiYgcmVwS2V5cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4geyB0eXBlOiAnY3RhJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbiAgfVxuXG4gIHJldHVybiB7IHR5cGU6ICdnZW5lcmljJywgY29uZmlkZW5jZTogJ2xvdycgfTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBDcm9zcy1wYWdlIGZpbmdlcnByaW50IGhlbHBlcnMgKGZvciBnbG9iYWwgZGV0ZWN0aW9uIGluIGV4dHJhY3Rvci50cylcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIHNlY3Rpb24ncyBsYXllciBuYW1lIGZvciBjcm9zcy1wYWdlIG1hdGNoaW5nLlxuICogXCJIZWFkZXIgXHUyMDE0IERlc2t0b3BcIiwgXCJIZWFkZXIgMTQ0MFwiLCBcIkhlYWRlclwiIGFsbCBjb2xsYXBzZSB0byBcImhlYWRlclwiLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU2VjdGlvbk5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIChuYW1lIHx8ICcnKVxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1xccypbXHUyMDE0XHUyMDEzXFwtXVxccyooZGVza3RvcHxtb2JpbGV8dGFibGV0KVxcYi9naSwgJycpXG4gICAgLnJlcGxhY2UoL1xccytcXGR7Myw0fSQvZywgJycpXG4gICAgLnRyaW0oKTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIHRvdGFsIHNlY3Rpb24gY291bnQgYW5kIHRoZSBpbmRleCBvZiBhIGdsb2JhbCBzZWN0aW9uLCBndWVzc1xuICogd2hldGhlciBpdCBpcyBhIGhlYWRlciAodG9wLCB0aGluKSBvciBmb290ZXIgKGJvdHRvbSkgXHUyMDE0IG9yIG51bGwgd2hlblxuICogbmVpdGhlciBmaXRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NpZnlHbG9iYWxSb2xlKFxuICBzZWN0aW9uSW5kZXg6IG51bWJlcixcbiAgdG90YWxTZWN0aW9uczogbnVtYmVyLFxuICBzZWN0aW9uSGVpZ2h0OiBudW1iZXIsXG4pOiAnaGVhZGVyJyB8ICdmb290ZXInIHwgbnVsbCB7XG4gIGlmIChzZWN0aW9uSW5kZXggPD0gMSAmJiBzZWN0aW9uSGVpZ2h0IDw9IDIwMCkgcmV0dXJuICdoZWFkZXInO1xuICBpZiAoc2VjdGlvbkluZGV4ID49IHRvdGFsU2VjdGlvbnMgLSAyKSByZXR1cm4gJ2Zvb3Rlcic7XG4gIHJldHVybiBudWxsO1xufVxuIiwgImltcG9ydCB7IFNlY3Rpb25TcGVjLCBTZWN0aW9uU3R5bGVzLCBFbGVtZW50U3R5bGVzLCBPdmVybGFwSW5mbywgTGF5ZXJJbmZvLCBDb21wb3NpdGlvbkluZm8sIEZvcm1GaWVsZEluZm8sIFRleHRDb250ZW50RW50cnksIENvbXBvbmVudEluc3RhbmNlSW5mbyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgdG9Dc3NWYWx1ZSwgdG9MYXlvdXROYW1lLCBzY3JlZW5zaG90RmlsZW5hbWUsIGNvbXB1dGVBc3BlY3RSYXRpbywgaXNEZWZhdWx0TGF5ZXJOYW1lLCBzbHVnaWZ5IH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBleHRyYWN0QmFja2dyb3VuZENvbG9yLCBleHRyYWN0R3JhZGllbnQsIGhhc0ltYWdlRmlsbCwgZXh0cmFjdEJvcmRlclN0eWxlLCBleHRyYWN0Qm9yZGVyV2lkdGhzLCBleHRyYWN0U3Ryb2tlQ29sb3IsIGV4dHJhY3RTdHJva2VBbGlnbiwgZXh0cmFjdE1peEJsZW5kTW9kZSB9IGZyb20gJy4vY29sb3InO1xuaW1wb3J0IHsgZXh0cmFjdFR5cG9ncmFwaHkgfSBmcm9tICcuL3R5cG9ncmFwaHknO1xuaW1wb3J0IHsgZXh0cmFjdEF1dG9MYXlvdXRTcGFjaW5nLCBleHRyYWN0QWJzb2x1dGVTcGFjaW5nIH0gZnJvbSAnLi9zcGFjaW5nJztcbmltcG9ydCB7IGRldGVjdEdyaWQgfSBmcm9tICcuL2dyaWQnO1xuaW1wb3J0IHsgZXh0cmFjdEludGVyYWN0aW9ucyB9IGZyb20gJy4vaW50ZXJhY3Rpb25zJztcbmltcG9ydCB7IGV4dHJhY3RFZmZlY3RzIH0gZnJvbSAnLi9lZmZlY3RzJztcbmltcG9ydCB7IHRvQ3NzQ3VzdG9tUHJvcGVydHkgfSBmcm9tICcuL3ZhcmlhYmxlcyc7XG5pbXBvcnQge1xuICBkZXRlY3RSZXBlYXRlcnMsIGRldGVjdENvbXBvbmVudFBhdHRlcm5zLCBkZXRlY3ROYXZpZ2F0aW9uLFxuICBpbmZlclNlY3Rpb25UeXBlLCBub3JtYWxpemVTZWN0aW9uTmFtZSwgY2xhc3NpZnlHbG9iYWxSb2xlLFxufSBmcm9tICcuL3BhdHRlcm5zJztcbmltcG9ydCB7IHJnYlRvSGV4IH0gZnJvbSAnLi9jb2xvcic7XG5cbi8qKlxuICogSWRlbnRpZnkgc2VjdGlvbiBmcmFtZXMgd2l0aGluIGEgcGFnZSBmcmFtZS5cbiAqIFNlY3Rpb25zIGFyZSB0aGUgZGlyZWN0IGNoaWxkcmVuIG9mIHRoZSBwYWdlIGZyYW1lLCBzb3J0ZWQgYnkgWSBwb3NpdGlvbi5cbiAqIElmIHRoZSBmcmFtZSBoYXMgYSBzaW5nbGUgd3JhcHBlciBjaGlsZCwgZHJpbGwgb25lIGxldmVsIGRlZXBlci5cbiAqL1xuZnVuY3Rpb24gaWRlbnRpZnlTZWN0aW9ucyhwYWdlRnJhbWU6IEZyYW1lTm9kZSk6IFNjZW5lTm9kZVtdIHtcbiAgbGV0IGNhbmRpZGF0ZXMgPSBwYWdlRnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICk7XG5cbiAgLy8gSWYgdGhlcmUncyBhIHNpbmdsZSBjb250YWluZXIgY2hpbGQsIGRyaWxsIG9uZSBsZXZlbCBkZWVwZXJcbiAgaWYgKGNhbmRpZGF0ZXMubGVuZ3RoID09PSAxICYmICdjaGlsZHJlbicgaW4gY2FuZGlkYXRlc1swXSkge1xuICAgIGNvbnN0IHdyYXBwZXIgPSBjYW5kaWRhdGVzWzBdIGFzIEZyYW1lTm9kZTtcbiAgICBjb25zdCBpbm5lckNhbmRpZGF0ZXMgPSB3cmFwcGVyLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAoYy50eXBlID09PSAnRlJBTUUnIHx8IGMudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgYy50eXBlID09PSAnSU5TVEFOQ0UnIHx8IGMudHlwZSA9PT0gJ0dST1VQJylcbiAgICApO1xuICAgIGlmIChpbm5lckNhbmRpZGF0ZXMubGVuZ3RoID4gMSkge1xuICAgICAgY2FuZGlkYXRlcyA9IGlubmVyQ2FuZGlkYXRlcztcbiAgICB9XG4gIH1cblxuICAvLyBTb3J0IGJ5IFkgcG9zaXRpb24gKHRvcCB0byBib3R0b20pXG4gIHJldHVybiBbLi4uY2FuZGlkYXRlc10uc29ydCgoYSwgYikgPT4ge1xuICAgIGNvbnN0IGFZID0gYS5hYnNvbHV0ZUJvdW5kaW5nQm94Py55ID8/IDA7XG4gICAgY29uc3QgYlkgPSBiLmFic29sdXRlQm91bmRpbmdCb3g/LnkgPz8gMDtcbiAgICByZXR1cm4gYVkgLSBiWTtcbiAgfSk7XG59XG5cbi8qKlxuICogRXh0cmFjdCBzZWN0aW9uLWxldmVsIHN0eWxlcyBmcm9tIGEgZnJhbWUuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RTZWN0aW9uU3R5bGVzKG5vZGU6IFNjZW5lTm9kZSwgaW1hZ2VNYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4pOiBTZWN0aW9uU3R5bGVzIHtcbiAgY29uc3QgYmcgPSBleHRyYWN0QmFja2dyb3VuZENvbG9yKG5vZGUgYXMgYW55KTtcbiAgY29uc3QgZ3JhZGllbnQgPSBleHRyYWN0R3JhZGllbnQobm9kZSBhcyBhbnkpO1xuICBjb25zdCBib3VuZHMgPSBub2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGNvbnN0IGVmZmVjdHMgPSBleHRyYWN0RWZmZWN0cyhub2RlIGFzIGFueSk7XG4gIGNvbnN0IGNvcm5lcnMgPSBleHRyYWN0UGVyQ29ybmVyUmFkaXVzKG5vZGUgYXMgYW55KTtcblxuICAvLyBTZWN0aW9uIGZyYW1lJ3Mgb3duIElNQUdFIGZpbGwgXHUyMDE0IHJlc29sdmUgdmlhIHNoYXJlZCBpbWFnZU1hcCBzbyB0aGVcbiAgLy8gc3BlYyByZWZlcmVuY2VzIGV4YWN0bHkgd2hhdCBpbWFnZS1leHBvcnRlciB3cm90ZSAoYWZ0ZXIgZGVkdXAgK1xuICAvLyBjb2xsaXNpb24tc3VmZml4aW5nKS4gRmFsbHMgYmFjayB0byBzbHVnaWZpZWQgbmFtZSB3aGVuIHRoZSBzZWN0aW9uXG4gIC8vIG5vZGUgaXNuJ3QgaW4gdGhlIG1hcCAoZS5nLiBpbWFnZSBmaWxsIGRldGVjdGVkIGJ1dCBubyByZXNvbHZhYmxlIGhhc2gpLlxuICBjb25zdCBzZWN0aW9uQmdGaWxlID0gaGFzSW1hZ2VGaWxsKG5vZGUgYXMgYW55KVxuICAgID8gKGltYWdlTWFwLmdldChub2RlLmlkKSB8fCBgJHtzbHVnaWZ5KG5vZGUubmFtZSl9LnBuZ2ApXG4gICAgOiBudWxsO1xuXG4gIGNvbnN0IHN0eWxlczogU2VjdGlvblN0eWxlcyA9IHtcbiAgICBwYWRkaW5nVG9wOiBudWxsLCAgLy8gU2V0IGJ5IHNwYWNpbmcgZXh0cmFjdG9yXG4gICAgcGFkZGluZ0JvdHRvbTogbnVsbCxcbiAgICBwYWRkaW5nTGVmdDogbnVsbCxcbiAgICBwYWRkaW5nUmlnaHQ6IG51bGwsXG4gICAgYmFja2dyb3VuZENvbG9yOiBiZyxcbiAgICBiYWNrZ3JvdW5kSW1hZ2U6IHNlY3Rpb25CZ0ZpbGUgPyBgdXJsKGltYWdlcy8ke3NlY3Rpb25CZ0ZpbGV9KWAgOiBudWxsLFxuICAgIGJhY2tncm91bmRJbWFnZUZpbGU6IHNlY3Rpb25CZ0ZpbGUsXG4gICAgYmFja2dyb3VuZEdyYWRpZW50OiBncmFkaWVudCxcbiAgICBtaW5IZWlnaHQ6IGJvdW5kcyA/IHRvQ3NzVmFsdWUoYm91bmRzLmhlaWdodCkgOiBudWxsLFxuICAgIG92ZXJmbG93OiBudWxsLFxuICAgIGJveFNoYWRvdzogZWZmZWN0cy5ib3hTaGFkb3csXG4gICAgZmlsdGVyOiBlZmZlY3RzLmZpbHRlcixcbiAgICBiYWNrZHJvcEZpbHRlcjogZWZmZWN0cy5iYWNrZHJvcEZpbHRlcixcbiAgfTtcbiAgaWYgKGNvcm5lcnMpIHtcbiAgICBpZiAoY29ybmVycy51bmlmb3JtICE9PSBudWxsKSB7XG4gICAgICBzdHlsZXMuYm9yZGVyUmFkaXVzID0gdG9Dc3NWYWx1ZShjb3JuZXJzLnVuaWZvcm0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMuYm9yZGVyVG9wTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy50b3BMZWZ0KTtcbiAgICAgIHN0eWxlcy5ib3JkZXJUb3BSaWdodFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy50b3BSaWdodCk7XG4gICAgICBzdHlsZXMuYm9yZGVyQm90dG9tTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy5ib3R0b21MZWZ0KTtcbiAgICAgIHN0eWxlcy5ib3JkZXJCb3R0b21SaWdodFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy5ib3R0b21SaWdodCk7XG4gICAgfVxuICB9XG4gIGFwcGx5U3Ryb2tlcyhzdHlsZXMsIG5vZGUpO1xuICBpZiAoJ29wYWNpdHknIGluIG5vZGUgJiYgdHlwZW9mIChub2RlIGFzIGFueSkub3BhY2l0eSA9PT0gJ251bWJlcicgJiYgKG5vZGUgYXMgYW55KS5vcGFjaXR5IDwgMSkge1xuICAgIHN0eWxlcy5vcGFjaXR5ID0gTWF0aC5yb3VuZCgobm9kZSBhcyBhbnkpLm9wYWNpdHkgKiAxMDApIC8gMTAwO1xuICB9XG4gIC8vIEF1dG8tbGF5b3V0IGZsZXggcHJvcHMgb24gdGhlIHNlY3Rpb24gZnJhbWUgaXRzZWxmXG4gIE9iamVjdC5hc3NpZ24oc3R5bGVzLCBleHRyYWN0QXV0b0xheW91dEZsZXgobm9kZSBhcyBhbnkpKTtcbiAgLy8gQmxlbmQgbW9kZSAobXVsdGlwbHkgLyBvdmVybGF5IC8gc2NyZWVuIC8gXHUyMDI2KVxuICBjb25zdCBibGVuZCA9IGV4dHJhY3RNaXhCbGVuZE1vZGUobm9kZSBhcyBhbnkpO1xuICBpZiAoYmxlbmQpIHN0eWxlcy5taXhCbGVuZE1vZGUgPSBibGVuZDtcbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHBlci1jb3JuZXIgYm9yZGVyLXJhZGl1cyBmcm9tIGEgbm9kZS4gRmlnbWEgc3RvcmVzXG4gKiB0b3BMZWZ0UmFkaXVzIC8gdG9wUmlnaHRSYWRpdXMgLyBib3R0b21MZWZ0UmFkaXVzIC8gYm90dG9tUmlnaHRSYWRpdXNcbiAqIGFzIGluZGl2aWR1YWwgcHJvcGVydGllcyBvbiBSZWN0YW5nbGVOb2RlIGFuZCBGcmFtZU5vZGUuIFdoZW4gdGhlXG4gKiB1bmlmb3JtIGNvcm5lclJhZGl1cyBpcyBhIG51bWJlciwgYWxsIGZvdXIgYXJlIGVxdWFsLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSBub2RlIGhhcyBubyBjb3JuZXIgZGF0YS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFBlckNvcm5lclJhZGl1cyhub2RlOiBhbnkpOiB7XG4gIHRvcExlZnQ6IG51bWJlcjsgdG9wUmlnaHQ6IG51bWJlcjsgYm90dG9tTGVmdDogbnVtYmVyOyBib3R0b21SaWdodDogbnVtYmVyOyB1bmlmb3JtOiBudW1iZXIgfCBudWxsO1xufSB8IG51bGwge1xuICBjb25zdCBuID0gbm9kZSBhcyBhbnk7XG4gIGNvbnN0IGNyID0gbi5jb3JuZXJSYWRpdXM7XG4gIGNvbnN0IHRsID0gdHlwZW9mIG4udG9wTGVmdFJhZGl1cyA9PT0gJ251bWJlcicgPyBuLnRvcExlZnRSYWRpdXMgOiBudWxsO1xuICBjb25zdCB0ciA9IHR5cGVvZiBuLnRvcFJpZ2h0UmFkaXVzID09PSAnbnVtYmVyJyA/IG4udG9wUmlnaHRSYWRpdXMgOiBudWxsO1xuICBjb25zdCBibCA9IHR5cGVvZiBuLmJvdHRvbUxlZnRSYWRpdXMgPT09ICdudW1iZXInID8gbi5ib3R0b21MZWZ0UmFkaXVzIDogbnVsbDtcbiAgY29uc3QgYnIgPSB0eXBlb2Ygbi5ib3R0b21SaWdodFJhZGl1cyA9PT0gJ251bWJlcicgPyBuLmJvdHRvbVJpZ2h0UmFkaXVzIDogbnVsbDtcblxuICBpZiAodHlwZW9mIGNyID09PSAnbnVtYmVyJyAmJiB0bCA9PT0gbnVsbCkge1xuICAgIC8vIFVuaWZvcm0gY29ybmVycyAob3IgY29ybmVyUmFkaXVzIGlzIHRoZSBtaXhlZCBzeW1ib2wpXG4gICAgaWYgKGNyID09PSAwKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4geyB0b3BMZWZ0OiBjciwgdG9wUmlnaHQ6IGNyLCBib3R0b21MZWZ0OiBjciwgYm90dG9tUmlnaHQ6IGNyLCB1bmlmb3JtOiBjciB9O1xuICB9XG4gIGlmICh0bCAhPT0gbnVsbCB8fCB0ciAhPT0gbnVsbCB8fCBibCAhPT0gbnVsbCB8fCBiciAhPT0gbnVsbCkge1xuICAgIHJldHVybiB7XG4gICAgICB0b3BMZWZ0OiB0bCB8fCAwLFxuICAgICAgdG9wUmlnaHQ6IHRyIHx8IDAsXG4gICAgICBib3R0b21MZWZ0OiBibCB8fCAwLFxuICAgICAgYm90dG9tUmlnaHQ6IGJyIHx8IDAsXG4gICAgICB1bmlmb3JtOiAodGwgPT09IHRyICYmIHRyID09PSBibCAmJiBibCA9PT0gYnIpID8gKHRsIHx8IDApIDogbnVsbCxcbiAgICB9O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIE1hcCBGaWdtYSdzIGF1dG8tbGF5b3V0IHByaW1hcnkvY291bnRlci1heGlzIGFsaWdubWVudCB0byBDU1MgZmxleCBwcm9wcy5cbiAqIE9ubHkgYXBwbGllcyB0byBmcmFtZXMgd2l0aCBgbGF5b3V0TW9kZSA9PT0gJ0hPUklaT05UQUwnIHwgJ1ZFUlRJQ0FMJ2AuXG4gKlxuICogUmV0dXJucyBhIHBhcnRpYWwgb2JqZWN0IHdpdGggZGlzcGxheS9mbGV4RGlyZWN0aW9uL2p1c3RpZnlDb250ZW50L2FsaWduSXRlbXMvZmxleFdyYXAvXG4gKiBnYXAvcm93R2FwLiBFbXB0eSB3aGVuIHRoZSBmcmFtZSBpc24ndCBhdXRvLWxheW91dCwgc28gY2FsbGVycyBjYW4gc3ByZWFkXG4gKiB1bmNvbmRpdGlvbmFsbHkuXG4gKlxuICogRmlnbWEgXHUyMTkyIENTUyBheGlzIG1hcHBpbmc6XG4gKiAgIEhvcml6b250YWwgbGF5b3V0OiBwcmltYXJ5ID0gaG9yaXpvbnRhbCwgY291bnRlciA9IHZlcnRpY2FsXG4gKiAgICAgXHUyMTkyIHByaW1hcnlBeGlzQWxpZ25JdGVtcyBcdTIxOTIganVzdGlmeS1jb250ZW50LCBjb3VudGVyQXhpc0FsaWduSXRlbXMgXHUyMTkyIGFsaWduLWl0ZW1zXG4gKiAgIFZlcnRpY2FsIGxheW91dDogcHJpbWFyeSA9IHZlcnRpY2FsLCBjb3VudGVyID0gaG9yaXpvbnRhbFxuICogICAgIFx1MjE5MiBwcmltYXJ5QXhpc0FsaWduSXRlbXMgXHUyMTkyIGp1c3RpZnktY29udGVudCAoZmxleC1kaXJlY3Rpb246Y29sdW1uKSwgY291bnRlciBcdTIxOTIgYWxpZ24taXRlbXNcbiAqXG4gKiBWYWx1ZSBtYXBwaW5nOlxuICogICBNSU4gXHUyMTkyIGZsZXgtc3RhcnQsIENFTlRFUiBcdTIxOTIgY2VudGVyLCBNQVggXHUyMTkyIGZsZXgtZW5kLCBTUEFDRV9CRVRXRUVOIFx1MjE5MiBzcGFjZS1iZXR3ZWVuXG4gKiAgIGNvdW50ZXIgQkFTRUxJTkUgXHUyMTkyIGJhc2VsaW5lIChvbmx5IHZhbGlkIGZvciBob3Jpem9udGFsIGxheW91dHMpXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RBdXRvTGF5b3V0RmxleChmcmFtZTogYW55KTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiAmIFBhcnRpYWw8U2VjdGlvblN0eWxlcz4ge1xuICBpZiAoIWZyYW1lIHx8ICFmcmFtZS5sYXlvdXRNb2RlIHx8IGZyYW1lLmxheW91dE1vZGUgPT09ICdOT05FJykgcmV0dXJuIHt9O1xuICBjb25zdCBvdXQ6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gJiBQYXJ0aWFsPFNlY3Rpb25TdHlsZXM+ID0ge307XG4gIG91dC5kaXNwbGF5ID0gJ2ZsZXgnO1xuICBvdXQuZmxleERpcmVjdGlvbiA9IGZyYW1lLmxheW91dE1vZGUgPT09ICdIT1JJWk9OVEFMJyA/ICdyb3cnIDogJ2NvbHVtbic7XG5cbiAgY29uc3QgbWFwUHJpbWFyeSA9ICh2OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcgfCBudWxsID0+IHtcbiAgICBzd2l0Y2ggKHYpIHtcbiAgICAgIGNhc2UgJ01JTic6IHJldHVybiAnZmxleC1zdGFydCc7XG4gICAgICBjYXNlICdDRU5URVInOiByZXR1cm4gJ2NlbnRlcic7XG4gICAgICBjYXNlICdNQVgnOiByZXR1cm4gJ2ZsZXgtZW5kJztcbiAgICAgIGNhc2UgJ1NQQUNFX0JFVFdFRU4nOiByZXR1cm4gJ3NwYWNlLWJldHdlZW4nO1xuICAgICAgZGVmYXVsdDogcmV0dXJuIG51bGw7XG4gICAgfVxuICB9O1xuICBjb25zdCBtYXBDb3VudGVyID0gKHY6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB8IG51bGwgPT4ge1xuICAgIHN3aXRjaCAodikge1xuICAgICAgY2FzZSAnTUlOJzogcmV0dXJuICdmbGV4LXN0YXJ0JztcbiAgICAgIGNhc2UgJ0NFTlRFUic6IHJldHVybiAnY2VudGVyJztcbiAgICAgIGNhc2UgJ01BWCc6IHJldHVybiAnZmxleC1lbmQnO1xuICAgICAgY2FzZSAnQkFTRUxJTkUnOiByZXR1cm4gJ2Jhc2VsaW5lJztcbiAgICAgIGRlZmF1bHQ6IHJldHVybiBudWxsO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgamMgPSBtYXBQcmltYXJ5KGZyYW1lLnByaW1hcnlBeGlzQWxpZ25JdGVtcyk7XG4gIGNvbnN0IGFpID0gbWFwQ291bnRlcihmcmFtZS5jb3VudGVyQXhpc0FsaWduSXRlbXMpO1xuICBpZiAoamMpIG91dC5qdXN0aWZ5Q29udGVudCA9IGpjO1xuICBpZiAoYWkpIG91dC5hbGlnbkl0ZW1zID0gYWk7XG5cbiAgaWYgKGZyYW1lLmxheW91dFdyYXAgPT09ICdXUkFQJykge1xuICAgIG91dC5mbGV4V3JhcCA9ICd3cmFwJztcbiAgICBpZiAodHlwZW9mIGZyYW1lLmNvdW50ZXJBeGlzU3BhY2luZyA9PT0gJ251bWJlcicgJiYgZnJhbWUuY291bnRlckF4aXNTcGFjaW5nID4gMCkge1xuICAgICAgb3V0LnJvd0dhcCA9IHRvQ3NzVmFsdWUoZnJhbWUuY291bnRlckF4aXNTcGFjaW5nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIE1hcCBGaWdtYSBsYXlvdXQgY29uc3RyYWludHMgKCdNSU4nIHwgJ0NFTlRFUicgfCAnTUFYJyB8ICdTVFJFVENIJyB8ICdTQ0FMRScpXG4gKiB0byBsb3dlcmNhc2UgdG9rZW5zLiBDb25zdHJhaW50cyBkZXNjcmliZSBob3cgYSBjaGlsZCBhbmNob3JzIHdoZW4gaXRzXG4gKiBwYXJlbnQgcmVzaXplcyBcdTIwMTQgb25seSBtZWFuaW5nZnVsIGZvciBub24tYXV0by1sYXlvdXQgcGFyZW50cyBPUiBmb3JcbiAqIGFic29sdXRlbHktcG9zaXRpb25lZCBjaGlsZHJlbiBpbnNpZGUgYW4gYXV0by1sYXlvdXQgcGFyZW50LlxuICovXG5mdW5jdGlvbiBleHRyYWN0Q29uc3RyYWludHMobm9kZTogYW55KTogeyBob3Jpem9udGFsPzogYW55OyB2ZXJ0aWNhbD86IGFueSB9IHtcbiAgY29uc3QgYyA9IG5vZGU/LmNvbnN0cmFpbnRzO1xuICBpZiAoIWMgfHwgdHlwZW9mIGMgIT09ICdvYmplY3QnKSByZXR1cm4ge307XG4gIGNvbnN0IG1hcCA9ICh2OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBhbnkgPT4ge1xuICAgIGlmICh2ID09PSAnTUlOJykgcmV0dXJuICdtaW4nO1xuICAgIGlmICh2ID09PSAnQ0VOVEVSJykgcmV0dXJuICdjZW50ZXInO1xuICAgIGlmICh2ID09PSAnTUFYJykgcmV0dXJuICdtYXgnO1xuICAgIGlmICh2ID09PSAnU1RSRVRDSCcpIHJldHVybiAnc3RyZXRjaCc7XG4gICAgaWYgKHYgPT09ICdTQ0FMRScpIHJldHVybiAnc2NhbGUnO1xuICAgIHJldHVybiBudWxsO1xuICB9O1xuICByZXR1cm4geyBob3Jpem9udGFsOiBtYXAoYy5ob3Jpem9udGFsKSwgdmVydGljYWw6IG1hcChjLnZlcnRpY2FsKSB9O1xufVxuXG4vKipcbiAqIERldGVjdCB3aGV0aGVyIHRoZSBub2RlIGlzIHBvc2l0aW9uZWQgYWJzb2x1dGVseSBJTlNJREUgaXRzIGF1dG8tbGF5b3V0XG4gKiBwYXJlbnQgKEZpZ21hJ3MgYGxheW91dFBvc2l0aW9uaW5nID09PSAnQUJTT0xVVEUnYCkuIFdoZW4gdHJ1ZSB0aGUgYWdlbnRcbiAqIHNob3VsZCBlbWl0IGBwb3NpdGlvbjogYWJzb2x1dGVgIGFuZCB1c2UgYm91bmRpbmctYm94IG9mZnNldHMgKyB0aGVcbiAqIGV4dHJhY3RlZCBjb25zdHJhaW50cyB0byBhbmNob3IgaXQgY29ycmVjdGx5LlxuICovXG5mdW5jdGlvbiBleHRyYWN0TGF5b3V0UG9zaXRpb25pbmcobm9kZTogYW55KTogJ2F1dG8nIHwgJ2Fic29sdXRlJyB8IG51bGwge1xuICBjb25zdCBwID0gbm9kZT8ubGF5b3V0UG9zaXRpb25pbmc7XG4gIGlmIChwID09PSAnQUJTT0xVVEUnKSByZXR1cm4gJ2Fic29sdXRlJztcbiAgaWYgKHAgPT09ICdBVVRPJykgcmV0dXJuICdhdXRvJztcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQXBwbHkgcGVyLWNvcm5lciByYWRpdXMuIElmIGFsbCA0IGFyZSBlcXVhbCwgZW1pdCBib3JkZXJSYWRpdXMgc2hvcnRoYW5kO1xuICogb3RoZXJ3aXNlIGVtaXQgdGhlIDQgZXhwbGljaXQgdmFsdWVzLiBXb3JrcyBvbiBFbGVtZW50U3R5bGVzIG9yIFNlY3Rpb25TdHlsZXMuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5UmFkaXVzKGVsZW06IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gJiBQYXJ0aWFsPFNlY3Rpb25TdHlsZXM+LCBub2RlOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgY29ybmVycyA9IGV4dHJhY3RQZXJDb3JuZXJSYWRpdXMobm9kZSk7XG4gIGlmICghY29ybmVycykgcmV0dXJuO1xuICBpZiAoY29ybmVycy51bmlmb3JtICE9PSBudWxsKSB7XG4gICAgZWxlbS5ib3JkZXJSYWRpdXMgPSB0b0Nzc1ZhbHVlKGNvcm5lcnMudW5pZm9ybSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGVsZW0uYm9yZGVyVG9wTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy50b3BMZWZ0KTtcbiAgZWxlbS5ib3JkZXJUb3BSaWdodFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy50b3BSaWdodCk7XG4gIGVsZW0uYm9yZGVyQm90dG9tTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy5ib3R0b21MZWZ0KTtcbiAgZWxlbS5ib3JkZXJCb3R0b21SaWdodFJhZGl1cyA9IHRvQ3NzVmFsdWUoY29ybmVycy5ib3R0b21SaWdodCk7XG59XG5cbi8qKlxuICogQXBwbHkgc3Ryb2tlczogcGVyLXNpZGUgYm9yZGVyLXdpZHRoIHdoZW4gRmlnbWEgaGFzIGluZGl2aWR1YWxTdHJva2VXZWlnaHRzLFxuICogc2luZ2xlIGJvcmRlcldpZHRoIG90aGVyd2lzZS4gQWxzbyBtYXBzIHN0eWxlIChzb2xpZC9kYXNoZWQvZG90dGVkKSBhbmRcbiAqIGNvbG9yLiBXb3JrcyBvbiBFbGVtZW50U3R5bGVzIG9yIFNlY3Rpb25TdHlsZXMuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5U3Ryb2tlcyhlbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ICYgUGFydGlhbDxTZWN0aW9uU3R5bGVzPiwgbm9kZTogYW55KTogdm9pZCB7XG4gIGNvbnN0IGNvbG9yID0gZXh0cmFjdFN0cm9rZUNvbG9yKG5vZGUpO1xuICBjb25zdCB3aWR0aHMgPSBleHRyYWN0Qm9yZGVyV2lkdGhzKG5vZGUpO1xuICBjb25zdCBzdHlsZSA9IGV4dHJhY3RCb3JkZXJTdHlsZShub2RlKTtcbiAgY29uc3QgYWxpZ24gPSBleHRyYWN0U3Ryb2tlQWxpZ24obm9kZSk7XG4gIGlmICghY29sb3IpIHJldHVybjtcblxuICBpZiAod2lkdGhzLnVuaWZvcm0gIT09IG51bGwpIHtcbiAgICBlbGVtLmJvcmRlcldpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMudW5pZm9ybSk7XG4gICAgZWxlbS5ib3JkZXJDb2xvciA9IGNvbG9yO1xuICAgIGVsZW0uYm9yZGVyU3R5bGUgPSBzdHlsZTtcbiAgICBpZiAoYWxpZ24pIGVsZW0uc3Ryb2tlQWxpZ24gPSBhbGlnbjtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHdpZHRocy50b3AgfHwgd2lkdGhzLnJpZ2h0IHx8IHdpZHRocy5ib3R0b20gfHwgd2lkdGhzLmxlZnQpIHtcbiAgICBpZiAod2lkdGhzLnRvcCkgZWxlbS5ib3JkZXJUb3BXaWR0aCA9IHRvQ3NzVmFsdWUod2lkdGhzLnRvcCk7XG4gICAgaWYgKHdpZHRocy5yaWdodCkgZWxlbS5ib3JkZXJSaWdodFdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMucmlnaHQpO1xuICAgIGlmICh3aWR0aHMuYm90dG9tKSBlbGVtLmJvcmRlckJvdHRvbVdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMuYm90dG9tKTtcbiAgICBpZiAod2lkdGhzLmxlZnQpIGVsZW0uYm9yZGVyTGVmdFdpZHRoID0gdG9Dc3NWYWx1ZSh3aWR0aHMubGVmdCk7XG4gICAgZWxlbS5ib3JkZXJDb2xvciA9IGNvbG9yO1xuICAgIGVsZW0uYm9yZGVyU3R5bGUgPSBzdHlsZTtcbiAgICBpZiAoYWxpZ24pIGVsZW0uc3Ryb2tlQWxpZ24gPSBhbGlnbjtcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3Qgb2JqZWN0LXBvc2l0aW9uIGZyb20gYW4gaW1hZ2UgZmlsbCdzIGltYWdlVHJhbnNmb3JtIChjcm9wIG9mZnNldCkuXG4gKiBGaWdtYSdzIGltYWdlVHJhbnNmb3JtIGlzIGEgMngzIGFmZmluZSBtYXRyaXguIFdoZW4gdGhlIGltYWdlIGhhcyBiZWVuXG4gKiBjcm9wcGVkL3JlcG9zaXRpb25lZCBpbiBGaWdtYSwgdGhlIHRyYW5zbGF0aW9uIGNvbXBvbmVudHMgdGVsbCB1cyB0aGVcbiAqIGZvY2FsIHBvaW50LiBNYXAgdG8gQ1NTIG9iamVjdC1wb3NpdGlvbiAvIGJhY2tncm91bmQtcG9zaXRpb24uXG4gKlxuICogUmV0dXJucyBudWxsIHdoZW4gdGhlIGltYWdlIGlzIGNlbnRlcmVkIChkZWZhdWx0KSwgb3Igd2hlbiBub2RlIGhhcyBub1xuICogaW1hZ2VUcmFuc2Zvcm0gZGF0YS5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdE9iamVjdFBvc2l0aW9uKG5vZGU6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiBudWxsO1xuICBjb25zdCBpbWdGaWxsID0gbm9kZS5maWxscy5maW5kKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpIGFzIEltYWdlUGFpbnQgfCB1bmRlZmluZWQ7XG4gIGlmICghaW1nRmlsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHQgPSAoaW1nRmlsbCBhcyBhbnkpLmltYWdlVHJhbnNmb3JtIGFzIG51bWJlcltdW10gfCB1bmRlZmluZWQ7XG4gIGlmICghdCB8fCAhQXJyYXkuaXNBcnJheSh0KSB8fCB0Lmxlbmd0aCA8IDIpIHJldHVybiBudWxsO1xuICAvLyBpbWFnZVRyYW5zZm9ybSBpcyBhIDJ4MyBtYXRyaXg6IFtbYSwgYiwgdHhdLCBbYywgZCwgdHldXVxuICAvLyB0eC90eSBhcmUgbm9ybWFsaXplZCAoMC4uMSkgdHJhbnNsYXRpb24gXHUyMDE0IDAgPSBsZWZ0L3RvcCwgMC41ID0gY2VudGVyXG4gIGNvbnN0IHR4ID0gdFswXSAmJiB0eXBlb2YgdFswXVsyXSA9PT0gJ251bWJlcicgPyB0WzBdWzJdIDogMC41O1xuICBjb25zdCB0eSA9IHRbMV0gJiYgdHlwZW9mIHRbMV1bMl0gPT09ICdudW1iZXInID8gdFsxXVsyXSA6IDAuNTtcbiAgLy8gRGVmYXVsdCAoY2VudGVyZWQpIFx1MjE5MiBudWxsIChicm93c2VyIHVzZXMgXCI1MCUgNTAlXCIgYnkgZGVmYXVsdClcbiAgaWYgKE1hdGguYWJzKHR4IC0gMC41KSA8IDAuMDEgJiYgTWF0aC5hYnModHkgLSAwLjUpIDwgMC4wMSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHhQY3QgPSBNYXRoLnJvdW5kKHR4ICogMTAwKTtcbiAgY29uc3QgeVBjdCA9IE1hdGgucm91bmQodHkgKiAxMDApO1xuICByZXR1cm4gYCR7eFBjdH0lICR7eVBjdH0lYDtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHRyYW5zZm9ybSAocm90YXRpb24gKyBzY2FsZSkgZnJvbSBhIG5vZGUncyByZWxhdGl2ZVRyYW5zZm9ybS5cbiAqIEZpZ21hJ3MgcmVsYXRpdmVUcmFuc2Zvcm0gaXMgYSAyeDMgbWF0cml4IFx1MjAxNCB3ZSBkZWNvbXBvc2UgaXQgdG8gcm90YXRpb25cbiAqIGFuZCBzY2FsZSB3aGVuIHRoZXkncmUgbm9uLWlkZW50aXR5LlxuICovXG5mdW5jdGlvbiBleHRyYWN0VHJhbnNmb3JtKG5vZGU6IGFueSk6IHsgdHJhbnNmb3JtOiBzdHJpbmcgfCBudWxsIH0ge1xuICBjb25zdCBydCA9IG5vZGUucmVsYXRpdmVUcmFuc2Zvcm0gYXMgbnVtYmVyW11bXSB8IHVuZGVmaW5lZDtcbiAgaWYgKCFydCB8fCAhQXJyYXkuaXNBcnJheShydCkgfHwgcnQubGVuZ3RoIDwgMikgcmV0dXJuIHsgdHJhbnNmb3JtOiBudWxsIH07XG4gIC8vIEV4dHJhY3Qgcm90YXRpb24gZnJvbSB0aGUgbWF0cml4OiBhbmdsZSA9IGF0YW4yKG1bMV1bMF0sIG1bMF1bMF0pXG4gIGNvbnN0IGEgPSBydFswXVswXSwgYiA9IHJ0WzBdWzFdLCBjID0gcnRbMV1bMF0sIGQgPSBydFsxXVsxXTtcbiAgY29uc3QgcmFkaWFucyA9IE1hdGguYXRhbjIoYywgYSk7XG4gIGNvbnN0IGRlZ3JlZXMgPSBNYXRoLnJvdW5kKChyYWRpYW5zICogMTgwKSAvIE1hdGguUEkpO1xuICBjb25zdCBzY2FsZVggPSBNYXRoLnNxcnQoYSAqIGEgKyBjICogYyk7XG4gIGNvbnN0IHNjYWxlWSA9IE1hdGguc3FydChiICogYiArIGQgKiBkKTtcblxuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgaWYgKE1hdGguYWJzKGRlZ3JlZXMpID4gMC41KSBwYXJ0cy5wdXNoKGByb3RhdGUoJHtkZWdyZWVzfWRlZylgKTtcbiAgaWYgKE1hdGguYWJzKHNjYWxlWCAtIDEpID4gMC4wMikgcGFydHMucHVzaChgc2NhbGVYKCR7TWF0aC5yb3VuZChzY2FsZVggKiAxMDApIC8gMTAwfSlgKTtcbiAgaWYgKE1hdGguYWJzKHNjYWxlWSAtIDEpID4gMC4wMikgcGFydHMucHVzaChgc2NhbGVZKCR7TWF0aC5yb3VuZChzY2FsZVkgKiAxMDApIC8gMTAwfSlgKTtcblxuICByZXR1cm4geyB0cmFuc2Zvcm06IHBhcnRzLmxlbmd0aCA+IDAgPyBwYXJ0cy5qb2luKCcgJykgOiBudWxsIH07XG59XG5cbi8qKlxuICogRXh0cmFjdCBmbGV4LWdyb3cgLyBmbGV4LWJhc2lzIC8gYWxpZ24tc2VsZiBmb3IgYXV0by1sYXlvdXQgY2hpbGRyZW4uXG4gKiBGaWdtYSdzIGxheW91dEdyb3cgaXMgMCBvciAxOyBsYXlvdXRBbGlnbiBpcyBJTkhFUklUIC8gU1RSRVRDSCAvIE1JTiAvIENFTlRFUiAvIE1BWC5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdEZsZXhDaGlsZFByb3BzKG5vZGU6IGFueSk6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4ge1xuICBjb25zdCBvdXQ6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7fTtcbiAgaWYgKHR5cGVvZiBub2RlLmxheW91dEdyb3cgPT09ICdudW1iZXInKSB7XG4gICAgb3V0LmZsZXhHcm93ID0gbm9kZS5sYXlvdXRHcm93O1xuICB9XG4gIGlmIChub2RlLmxheW91dEFsaWduKSB7XG4gICAgc3dpdGNoIChub2RlLmxheW91dEFsaWduKSB7XG4gICAgICBjYXNlICdTVFJFVENIJzogb3V0LmFsaWduU2VsZiA9ICdzdHJldGNoJzsgYnJlYWs7XG4gICAgICBjYXNlICdNSU4nOiBvdXQuYWxpZ25TZWxmID0gJ2ZsZXgtc3RhcnQnOyBicmVhaztcbiAgICAgIGNhc2UgJ0NFTlRFUic6IG91dC5hbGlnblNlbGYgPSAnY2VudGVyJzsgYnJlYWs7XG4gICAgICBjYXNlICdNQVgnOiBvdXQuYWxpZ25TZWxmID0gJ2ZsZXgtZW5kJzsgYnJlYWs7XG4gICAgICBkZWZhdWx0OiBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDb21wdXRlIHBlci1zaWRlIG1hcmdpbiBmb3IgYSBub2RlIGJhc2VkIG9uIHNpYmxpbmcgcG9zaXRpb25zIGluIGl0c1xuICogcGFyZW50IGNvbnRhaW5lci4gUmV0dXJucyBvbmx5IHRoZSBzaWRlcyB0aGF0IGhhdmUgYSBjbGVhciBub24temVyb1xuICogbWFyZ2luIChwcmV2aW91cyBzaWJsaW5nIG9uIHRvcCwgbmV4dCBzaWJsaW5nIGJlbG93LCBwYXJlbnQgYm91bmRzIGZvclxuICogbGVmdC9yaWdodCB3aGVuIHBhcmVudCB3aWR0aCBpcyBrbm93bikuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RQZXJTaWRlTWFyZ2lucyhub2RlOiBTY2VuZU5vZGUpOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+IHtcbiAgY29uc3Qgb3V0OiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge307XG4gIGlmICghbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94IHx8ICFub2RlLnBhcmVudCB8fCAhKCdjaGlsZHJlbicgaW4gbm9kZS5wYXJlbnQpKSByZXR1cm4gb3V0O1xuXG4gIGNvbnN0IHNpYmxpbmdzID0gKG5vZGUucGFyZW50IGFzIEZyYW1lTm9kZSkuY2hpbGRyZW47XG4gIGNvbnN0IGlkeCA9IHNpYmxpbmdzLmluZGV4T2Yobm9kZSk7XG4gIGNvbnN0IGJiID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuXG4gIC8vIEJvdHRvbTogZ2FwIHRvIG5leHQgc2libGluZ1xuICBpZiAoaWR4ID49IDAgJiYgaWR4IDwgc2libGluZ3MubGVuZ3RoIC0gMSkge1xuICAgIGNvbnN0IG5leHQgPSBzaWJsaW5nc1tpZHggKyAxXTtcbiAgICBpZiAobmV4dC5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICBjb25zdCBnYXAgPSBuZXh0LmFic29sdXRlQm91bmRpbmdCb3gueSAtIChiYi55ICsgYmIuaGVpZ2h0KTtcbiAgICAgIGlmIChnYXAgPiAwKSBvdXQubWFyZ2luQm90dG9tID0gdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKGdhcCkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRvcDogZ2FwIHRvIHByZXZpb3VzIHNpYmxpbmcgKGZvciBhYnNvbHV0ZS1wb3NpdGlvbiBsYXlvdXRzKVxuICBpZiAoaWR4ID4gMCkge1xuICAgIGNvbnN0IHByZXYgPSBzaWJsaW5nc1tpZHggLSAxXTtcbiAgICBpZiAocHJldi5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICBjb25zdCBnYXAgPSBiYi55IC0gKHByZXYuYWJzb2x1dGVCb3VuZGluZ0JveC55ICsgcHJldi5hYnNvbHV0ZUJvdW5kaW5nQm94LmhlaWdodCk7XG4gICAgICBpZiAoZ2FwID4gMCkgb3V0Lm1hcmdpblRvcCA9IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChnYXApKTtcbiAgICB9XG4gIH1cblxuICAvLyBMZWZ0L3JpZ2h0OiBpbnNldCBmcm9tIHBhcmVudCBlZGdlc1xuICBjb25zdCBwYXJlbnRCQiA9IChub2RlLnBhcmVudCBhcyBGcmFtZU5vZGUpLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGlmIChwYXJlbnRCQikge1xuICAgIGNvbnN0IGxlZnRHYXAgPSBiYi54IC0gcGFyZW50QkIueDtcbiAgICBjb25zdCByaWdodEdhcCA9IChwYXJlbnRCQi54ICsgcGFyZW50QkIud2lkdGgpIC0gKGJiLnggKyBiYi53aWR0aCk7XG4gICAgLy8gT25seSBlbWl0IHdoZW4gZWxlbWVudCBpcyBub3QgY2VudGVyZWQgKHNpZ25pZmljYW50IGFzeW1tZXRyaWMgbWFyZ2luKVxuICAgIGlmIChNYXRoLmFicyhsZWZ0R2FwIC0gcmlnaHRHYXApID4gOCAmJiBsZWZ0R2FwID4gMCkge1xuICAgICAgb3V0Lm1hcmdpbkxlZnQgPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQobGVmdEdhcCkpO1xuICAgIH1cbiAgICBpZiAoTWF0aC5hYnMobGVmdEdhcCAtIHJpZ2h0R2FwKSA+IDggJiYgcmlnaHRHYXAgPiAwKSB7XG4gICAgICBvdXQubWFyZ2luUmlnaHQgPSB0b0Nzc1ZhbHVlKE1hdGgucm91bmQocmlnaHRHYXApKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEV4dHJhY3QgcHJvdG90eXBlIG5hdmlnYXRpb24gVVJMIGZvciBhIG5vZGUuIEZpZ21hIHN1cHBvcnRzXG4gKiBPUEVOX1VSTCBhY3Rpb25zIGluIHJlYWN0aW9ucyBcdTIwMTQgbWFwIHRvIGxpbmtVcmwuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RMaW5rVXJsKG5vZGU6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCByZWFjdGlvbnMgPSBub2RlLnJlYWN0aW9ucztcbiAgaWYgKCFyZWFjdGlvbnMgfHwgIUFycmF5LmlzQXJyYXkocmVhY3Rpb25zKSkgcmV0dXJuIG51bGw7XG4gIGZvciAoY29uc3QgciBvZiByZWFjdGlvbnMpIHtcbiAgICBjb25zdCBhY3Rpb25zID0gci5hY3Rpb25zIHx8IChyLmFjdGlvbiA/IFtyLmFjdGlvbl0gOiBbXSk7XG4gICAgZm9yIChjb25zdCBhIG9mIGFjdGlvbnMpIHtcbiAgICAgIGlmIChhICYmIGEudHlwZSA9PT0gJ1VSTCcgJiYgYS51cmwpIHJldHVybiBhLnVybDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBGaWdtYSBzaXppbmcgbW9kZXMgKEh1ZyAvIEZpbGwgLyBGaXhlZCkuIFRoZXNlIHRlbGwgdGhlIGFnZW50XG4gKiB3aGV0aGVyIGFuIGVsZW1lbnQgc2hvdWxkIGJlIHdpZHRoOmF1dG8sIHdpZHRoOjEwMCUsIG9yIGEgZml4ZWQgcHggc2l6ZSBcdTIwMTRcbiAqIGNyaXRpY2FsIGZvciBjb3JyZWN0IHJlc3BvbnNpdmUgYmVoYXZpb3IuIFJldHVybnMgbnVsbCBmb3IgZWFjaCBheGlzIHdoZW5cbiAqIHRoZSBtb2RlIGlzIG1pc3NpbmcgKG9sZGVyIEZpZ21hIHZlcnNpb25zLCBub24tYXV0by1sYXlvdXQgY29udGV4dHMpLlxuICovXG5mdW5jdGlvbiBleHRyYWN0U2l6aW5nTW9kZXMobm9kZTogYW55KTogeyB3aWR0aE1vZGU6ICdodWcnfCdmaWxsJ3wnZml4ZWQnfG51bGw7IGhlaWdodE1vZGU6ICdodWcnfCdmaWxsJ3wnZml4ZWQnfG51bGwgfSB7XG4gIGNvbnN0IG1hcCA9IChtOiBzdHJpbmcgfCB1bmRlZmluZWQpOiAnaHVnJ3wnZmlsbCd8J2ZpeGVkJ3xudWxsID0+IHtcbiAgICBpZiAobSA9PT0gJ0hVRycpIHJldHVybiAnaHVnJztcbiAgICBpZiAobSA9PT0gJ0ZJTEwnKSByZXR1cm4gJ2ZpbGwnO1xuICAgIGlmIChtID09PSAnRklYRUQnKSByZXR1cm4gJ2ZpeGVkJztcbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aE1vZGU6IG1hcChub2RlLmxheW91dFNpemluZ0hvcml6b250YWwpLFxuICAgIGhlaWdodE1vZGU6IG1hcChub2RlLmxheW91dFNpemluZ1ZlcnRpY2FsKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IEZpZ21hIFZhcmlhYmxlIGJpbmRpbmdzIG9uIGEgbm9kZSdzIHByb3BlcnRpZXMuIFJldHVybnMgQ1NTIGN1c3RvbVxuICogcHJvcGVydHkgcmVmZXJlbmNlcyAoZS5nLiBcInZhcigtLWNsci1wcmltYXJ5KVwiKSBrZXllZCBieSBDU1MgcHJvcGVydHkgbmFtZS5cbiAqIFdoZW4gdmFyaWFibGVzIGFyZSBib3VuZCwgdGhlIGFnZW50IHNob3VsZCBlbWl0IHRoZXNlIHJlZmVyZW5jZXMgaW5zdGVhZFxuICogb2YgdGhlIHJlc29sdmVkIHJhdyBoZXgvcHggdmFsdWVzIHNvIHRva2VuIGNoYW5nZXMgaW4gRmlnbWEgcHJvcGFnYXRlLlxuICovXG5mdW5jdGlvbiBleHRyYWN0Qm91bmRWYXJpYWJsZXMobm9kZTogYW55KTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IG51bGwge1xuICBjb25zdCBidiA9IG5vZGUuYm91bmRWYXJpYWJsZXM7XG4gIGlmICghYnYgfHwgdHlwZW9mIGJ2ICE9PSAnb2JqZWN0JykgcmV0dXJuIG51bGw7XG4gIGlmICghZmlnbWEudmFyaWFibGVzIHx8IHR5cGVvZiAoZmlnbWEudmFyaWFibGVzIGFzIGFueSkuZ2V0VmFyaWFibGVCeUlkICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICBjb25zdCByZXNvbHZlID0gKGFsaWFzOiBhbnkpOiBzdHJpbmcgfCBudWxsID0+IHtcbiAgICBpZiAoIWFsaWFzIHx8ICFhbGlhcy5pZCkgcmV0dXJuIG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHYgPSAoZmlnbWEudmFyaWFibGVzIGFzIGFueSkuZ2V0VmFyaWFibGVCeUlkKGFsaWFzLmlkKTtcbiAgICAgIGlmICghdikgcmV0dXJuIG51bGw7XG4gICAgICBsZXQgY29sTmFtZSA9ICcnO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY29sID0gKGZpZ21hLnZhcmlhYmxlcyBhcyBhbnkpLmdldFZhcmlhYmxlQ29sbGVjdGlvbkJ5SWQ/Lih2LnZhcmlhYmxlQ29sbGVjdGlvbklkKTtcbiAgICAgICAgY29sTmFtZSA9IGNvbD8ubmFtZSB8fCAnJztcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIHJldHVybiBgdmFyKCR7dG9Dc3NDdXN0b21Qcm9wZXJ0eSh2Lm5hbWUsIGNvbE5hbWUpfSlgO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9O1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGJ2LmZpbGxzKSAmJiBidi5maWxsc1swXSkge1xuICAgIGNvbnN0IHJlZiA9IHJlc29sdmUoYnYuZmlsbHNbMF0pO1xuICAgIGlmIChyZWYpIG91dFtub2RlLnR5cGUgPT09ICdURVhUJyA/ICdjb2xvcicgOiAnYmFja2dyb3VuZENvbG9yJ10gPSByZWY7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkoYnYuc3Ryb2tlcykgJiYgYnYuc3Ryb2tlc1swXSkge1xuICAgIGNvbnN0IHJlZiA9IHJlc29sdmUoYnYuc3Ryb2tlc1swXSk7XG4gICAgaWYgKHJlZikgb3V0LmJvcmRlckNvbG9yID0gcmVmO1xuICB9XG4gIGNvbnN0IG51bWVyaWNNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgcGFkZGluZ1RvcDogJ3BhZGRpbmdUb3AnLCBwYWRkaW5nQm90dG9tOiAncGFkZGluZ0JvdHRvbScsXG4gICAgcGFkZGluZ0xlZnQ6ICdwYWRkaW5nTGVmdCcsIHBhZGRpbmdSaWdodDogJ3BhZGRpbmdSaWdodCcsXG4gICAgaXRlbVNwYWNpbmc6ICdnYXAnLFxuICAgIGNvcm5lclJhZGl1czogJ2JvcmRlclJhZGl1cycsXG4gICAgdG9wTGVmdFJhZGl1czogJ2JvcmRlclRvcExlZnRSYWRpdXMnLCB0b3BSaWdodFJhZGl1czogJ2JvcmRlclRvcFJpZ2h0UmFkaXVzJyxcbiAgICBib3R0b21MZWZ0UmFkaXVzOiAnYm9yZGVyQm90dG9tTGVmdFJhZGl1cycsIGJvdHRvbVJpZ2h0UmFkaXVzOiAnYm9yZGVyQm90dG9tUmlnaHRSYWRpdXMnLFxuICAgIHN0cm9rZVdlaWdodDogJ2JvcmRlcldpZHRoJyxcbiAgICBmb250U2l6ZTogJ2ZvbnRTaXplJywgbGluZUhlaWdodDogJ2xpbmVIZWlnaHQnLCBsZXR0ZXJTcGFjaW5nOiAnbGV0dGVyU3BhY2luZycsXG4gIH07XG4gIGZvciAoY29uc3QgW2ZpZ21hS2V5LCBjc3NLZXldIG9mIE9iamVjdC5lbnRyaWVzKG51bWVyaWNNYXApKSB7XG4gICAgaWYgKGJ2W2ZpZ21hS2V5XSkge1xuICAgICAgY29uc3QgcmVmID0gcmVzb2x2ZShidltmaWdtYUtleV0pO1xuICAgICAgaWYgKHJlZikgb3V0W2Nzc0tleV0gPSByZWY7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKG91dCkubGVuZ3RoID4gMCA/IG91dCA6IG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBjb21wb25lbnQtaW5zdGFuY2UgbWV0YWRhdGE6IG1haW4gY29tcG9uZW50IG5hbWUgKyB2YXJpYW50XG4gKiAvIGJvb2xlYW4gLyB0ZXh0IHByb3BlcnRpZXMuIFJldHVybnMgbnVsbCBmb3Igbm9uLWluc3RhbmNlIG5vZGVzLlxuICogVGhpcyBpcyB0aGUga2V5IHNpZ25hbCB0aGUgYWdlbnQgdXNlcyB0byBkZWR1cGUgcmVwZWF0ZWQgY2FyZHMsIGJ1dHRvbnMsXG4gKiBhbmQgaWNvbnMgaW50byBzaGFyZWQgQUNGIGJsb2NrcyBpbnN0ZWFkIG9mIGlubGluaW5nIGVhY2ggb25lLlxuICovXG5mdW5jdGlvbiBleHRyYWN0Q29tcG9uZW50SW5zdGFuY2Uobm9kZTogU2NlbmVOb2RlKTogQ29tcG9uZW50SW5zdGFuY2VJbmZvIHwgbnVsbCB7XG4gIGlmIChub2RlLnR5cGUgIT09ICdJTlNUQU5DRScpIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IGluc3QgPSBub2RlIGFzIEluc3RhbmNlTm9kZTtcbiAgICBsZXQgbmFtZSA9IGluc3QubmFtZTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWFpbiA9IGluc3QubWFpbkNvbXBvbmVudDtcbiAgICAgIGlmIChtYWluKSB7XG4gICAgICAgIG5hbWUgPSBtYWluLnBhcmVudD8udHlwZSA9PT0gJ0NPTVBPTkVOVF9TRVQnID8gKG1haW4ucGFyZW50IGFzIGFueSkubmFtZSA6IG1haW4ubmFtZTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHt9XG4gICAgY29uc3QgcHJvcGVydGllczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgYm9vbGVhbiB8IG51bWJlcj4gPSB7fTtcbiAgICBjb25zdCBwcm9wcyA9IChpbnN0IGFzIGFueSkuY29tcG9uZW50UHJvcGVydGllcztcbiAgICBpZiAocHJvcHMgJiYgdHlwZW9mIHByb3BzID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWxdIG9mIE9iamVjdC5lbnRyaWVzKHByb3BzKSkge1xuICAgICAgICBjb25zdCB2ID0gKHZhbCBhcyBhbnkpPy52YWx1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdiA9PT0gJ2Jvb2xlYW4nIHx8IHR5cGVvZiB2ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHByb3BlcnRpZXNba2V5XSA9IHY7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgbmFtZSwgcHJvcGVydGllcyB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3QgYWx0IHRleHQgZm9yIGFuIGltYWdlLiBTb3VyY2UgcHJpb3JpdHk6IGNvbXBvbmVudCBkZXNjcmlwdGlvblxuICogKGZvciBJTlNUQU5DRSAvIENPTVBPTkVOVCBub2RlcykgXHUyMTkyIGh1bWFuaXplZCBsYXllciBuYW1lLiBSZXR1cm5zIGVtcHR5XG4gKiBzdHJpbmcgd2hlbiB0aGUgbGF5ZXIgaXMgbmFtZWQgZ2VuZXJpY2FsbHkgKFJlY3RhbmdsZSAxMiwgSW1hZ2UgMywgZXRjLikuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RBbHRUZXh0KG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJykge1xuICAgICAgY29uc3QgbWFpbiA9IChub2RlIGFzIEluc3RhbmNlTm9kZSkubWFpbkNvbXBvbmVudDtcbiAgICAgIGlmIChtYWluICYmIG1haW4uZGVzY3JpcHRpb24gJiYgbWFpbi5kZXNjcmlwdGlvbi50cmltKCkpIHJldHVybiBtYWluLmRlc2NyaXB0aW9uLnRyaW0oKTtcbiAgICB9XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcpIHtcbiAgICAgIGNvbnN0IGRlc2MgPSAobm9kZSBhcyBDb21wb25lbnROb2RlKS5kZXNjcmlwdGlvbjtcbiAgICAgIGlmIChkZXNjICYmIGRlc2MudHJpbSgpKSByZXR1cm4gZGVzYy50cmltKCk7XG4gICAgfVxuICB9IGNhdGNoIHt9XG4gIGlmICghbm9kZS5uYW1lIHx8IGlzRGVmYXVsdExheWVyTmFtZShub2RlLm5hbWUpKSByZXR1cm4gJyc7XG4gIHJldHVybiBub2RlLm5hbWUucmVwbGFjZSgvWy1fXS9nLCAnICcpLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKCkucmVwbGFjZSgvXFxiXFx3L2csIGMgPT4gYy50b1VwcGVyQ2FzZSgpKTtcbn1cblxuLyoqXG4gKiBNYXAgRmlnbWEncyBJTUFHRSBmaWxsIHNjYWxlTW9kZSB0byBDU1Mgb2JqZWN0LWZpdC5cbiAqICAgRklMTCAoZGVmYXVsdCkgXHUyMTkyIGNvdmVyXG4gKiAgIEZJVCAgICAgICAgICAgIFx1MjE5MiBjb250YWluIChpbWFnZSB2aXNpYmxlIGluIGZ1bGwsIGxldHRlcmJveCBpZiBuZWVkZWQpXG4gKiAgIENST1AgICAgICAgICAgIFx1MjE5MiBjb3ZlciAob2JqZWN0LXBvc2l0aW9uIGhhbmRsZWQgc2VwYXJhdGVseSB2aWEgaW1hZ2VUcmFuc2Zvcm0pXG4gKiAgIFRJTEUgICAgICAgICAgIFx1MjE5MiBjb3ZlciAobm8gZGlyZWN0IENTUyBlcXVpdmFsZW50KVxuICovXG5mdW5jdGlvbiBnZXRJbWFnZU9iamVjdEZpdChub2RlOiBhbnkpOiBzdHJpbmcge1xuICBpZiAoIW5vZGUuZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5maWxscykpIHJldHVybiAnY292ZXInO1xuICBjb25zdCBpbWdGaWxsID0gbm9kZS5maWxscy5maW5kKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpIGFzIEltYWdlUGFpbnQgfCB1bmRlZmluZWQ7XG4gIGlmICghaW1nRmlsbCkgcmV0dXJuICdjb3Zlcic7XG4gIHN3aXRjaCAoaW1nRmlsbC5zY2FsZU1vZGUpIHtcbiAgICBjYXNlICdGSVQnOiByZXR1cm4gJ2NvbnRhaW4nO1xuICAgIGNhc2UgJ0ZJTEwnOlxuICAgIGNhc2UgJ0NST1AnOlxuICAgIGNhc2UgJ1RJTEUnOlxuICAgIGRlZmF1bHQ6IHJldHVybiAnY292ZXInO1xuICB9XG59XG5cbi8qKlxuICogQXBwbHkgdGhlIHNoYXJlZCBvcHRpb25hbC1zaWduYWwgZmllbGRzIChjb21wb25lbnRJbnN0YW5jZSwgd2lkdGhNb2RlLFxuICogaGVpZ2h0TW9kZSwgdmFyQmluZGluZ3MpIHRvIGFuIGVsZW1lbnQuIENlbnRyYWxpemVkIHNvIGV2ZXJ5IGVsZW1lbnRcbiAqIGtpbmQgKHRleHQsIGltYWdlLCBidXR0b24sIGlucHV0KSBiZW5lZml0cyBjb25zaXN0ZW50bHkuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5Q29tbW9uU2lnbmFscyhlbGVtOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+LCBub2RlOiBTY2VuZU5vZGUpOiB2b2lkIHtcbiAgY29uc3QgY21wID0gZXh0cmFjdENvbXBvbmVudEluc3RhbmNlKG5vZGUpO1xuICBpZiAoY21wKSBlbGVtLmNvbXBvbmVudEluc3RhbmNlID0gY21wO1xuXG4gIGNvbnN0IHNpemUgPSBleHRyYWN0U2l6aW5nTW9kZXMobm9kZSk7XG4gIGlmIChzaXplLndpZHRoTW9kZSkgZWxlbS53aWR0aE1vZGUgPSBzaXplLndpZHRoTW9kZTtcbiAgaWYgKHNpemUuaGVpZ2h0TW9kZSkgZWxlbS5oZWlnaHRNb2RlID0gc2l6ZS5oZWlnaHRNb2RlO1xuXG4gIGNvbnN0IHZhcnMgPSBleHRyYWN0Qm91bmRWYXJpYWJsZXMobm9kZSk7XG4gIGlmICh2YXJzKSBlbGVtLnZhckJpbmRpbmdzID0gdmFycztcblxuICAvLyBCbGVuZCBtb2RlIChtaXgtYmxlbmQtbW9kZSlcbiAgY29uc3QgYmxlbmQgPSBleHRyYWN0TWl4QmxlbmRNb2RlKG5vZGUgYXMgYW55KTtcbiAgaWYgKGJsZW5kKSBlbGVtLm1peEJsZW5kTW9kZSA9IGJsZW5kO1xuXG4gIC8vIExheW91dCBwb3NpdGlvbmluZyBpbnNpZGUgYW4gYXV0by1sYXlvdXQgcGFyZW50OiAnYXV0bycgfCAnYWJzb2x1dGUnLlxuICAvLyBXZSBvbmx5IGVtaXQgd2hlbiBBQlNPTFVURSBcdTIwMTQgJ2F1dG8nIGlzIHRoZSBkZWZhdWx0IGFuZCB3b3VsZCBqdXN0IGJlIG5vaXNlLlxuICBjb25zdCBscCA9IGV4dHJhY3RMYXlvdXRQb3NpdGlvbmluZyhub2RlIGFzIGFueSk7XG4gIGlmIChscCA9PT0gJ2Fic29sdXRlJykgZWxlbS5sYXlvdXRQb3NpdGlvbmluZyA9ICdhYnNvbHV0ZSc7XG5cbiAgLy8gTGF5b3V0IGNvbnN0cmFpbnRzIChvbmx5IG1lYW5pbmdmdWwgZm9yIG5vbi1hdXRvLWxheW91dCBwYXJlbnRzIE9SXG4gIC8vIGFic29sdXRlbHktcG9zaXRpb25lZCBjaGlsZHJlbiBpbnNpZGUgYXV0by1sYXlvdXQpLiBXZSBhbHdheXMgZW1pdCB3aGVuXG4gIC8vIHByZXNlbnQgXHUyMDE0IGFnZW50IGRlY2lkZXMgd2hldGhlciB0aGV5IGFwcGx5IGJhc2VkIG9uIGNvbnRleHQuXG4gIGNvbnN0IGNvbnMgPSBleHRyYWN0Q29uc3RyYWludHMobm9kZSBhcyBhbnkpO1xuICBpZiAoY29ucy5ob3Jpem9udGFsKSBlbGVtLmNvbnN0cmFpbnRzSG9yaXpvbnRhbCA9IGNvbnMuaG9yaXpvbnRhbDtcbiAgaWYgKGNvbnMudmVydGljYWwpIGVsZW0uY29uc3RyYWludHNWZXJ0aWNhbCA9IGNvbnMudmVydGljYWw7XG59XG5cbi8qKlxuICogUmVhZCBub2RlLm9wYWNpdHkgYW5kIHJldHVybiBpdCB3aGVuIGJlbG93IDEgKHJvdW5kZWQgdG8gMiBkZWNpbWFscykuXG4gKiBSZXR1cm5zIG51bGwgZm9yIGZ1bGx5IG9wYXF1ZSBub2RlcyBvciB3aGVuIHRoZSBwcm9wZXJ0eSBpcyBhYnNlbnQuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RPcGFjaXR5KG5vZGU6IGFueSk6IG51bWJlciB8IG51bGwge1xuICBpZiAoISgnb3BhY2l0eScgaW4gbm9kZSkgfHwgdHlwZW9mIG5vZGUub3BhY2l0eSAhPT0gJ251bWJlcicpIHJldHVybiBudWxsO1xuICBpZiAobm9kZS5vcGFjaXR5ID49IDEpIHJldHVybiBudWxsO1xuICByZXR1cm4gTWF0aC5yb3VuZChub2RlLm9wYWNpdHkgKiAxMDApIC8gMTAwO1xufVxuXG4vKipcbiAqIERlY2lkZSB3aGV0aGVyIGEgbm9uLXRleHQsIG5vbi1pbWFnZSwgbm9uLWJ1dHRvbiwgbm9uLWlucHV0IGZyYW1lIGNhcnJpZXNcbiAqIGVub3VnaCB2aXN1YWwgc3R5bGluZyAoZmlsbCwgc3Ryb2tlLCByYWRpdXMsIHNoYWRvdywgcmVkdWNlZCBvcGFjaXR5KSB0b1xuICogd2FycmFudCBiZWluZyBlbWl0dGVkIGFzIGEgY29udGFpbmVyIGVsZW1lbnQuIFBsYWluIHN0cnVjdHVyYWwgd3JhcHBlcnNcbiAqIHdpdGggbm8gc3R5bGluZyByZXR1cm4gZmFsc2Ugc28gd2UgZG9uJ3QgZmxvb2Qgb3V0cHV0IHdpdGggZW1wdHkgZW50cmllcy5cbiAqL1xuZnVuY3Rpb24gaGFzQ29udGFpbmVyU3R5bGluZyhub2RlOiBTY2VuZU5vZGUpOiBib29sZWFuIHtcbiAgY29uc3QgbiA9IG5vZGUgYXMgYW55O1xuICBpZiAoZXh0cmFjdEJhY2tncm91bmRDb2xvcihuKSkgcmV0dXJuIHRydWU7XG4gIGlmIChleHRyYWN0R3JhZGllbnQobikpIHJldHVybiB0cnVlO1xuICBpZiAoZXh0cmFjdFN0cm9rZUNvbG9yKG4pKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgY29ybmVycyA9IGV4dHJhY3RQZXJDb3JuZXJSYWRpdXMobik7XG4gIGlmIChjb3JuZXJzKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgZnggPSBleHRyYWN0RWZmZWN0cyhuKTtcbiAgaWYgKGZ4LmJveFNoYWRvdyB8fCBmeC5maWx0ZXIgfHwgZnguYmFja2Ryb3BGaWx0ZXIpIHJldHVybiB0cnVlO1xuICBpZiAoZXh0cmFjdE9wYWNpdHkobikgIT09IG51bGwpIHJldHVybiB0cnVlO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogV2FsayBhbiBpY29uIHN1YnRyZWUgdG8gZmluZCBpdHMgcHJpbWFyeSBTT0xJRCBmaWxsIGNvbG9yLiBVc2VkIHRvXG4gKiBzdWdnZXN0IGEgQ1NTIGNvbG9yIGZvciB0aGUgaW5saW5lZCBTVkcgKHRoZSBhZ2VudCBjYW4gb3ZlcnJpZGUgd2l0aFxuICogYGN1cnJlbnRDb2xvcmAgaWYgaXQgd2FudHMgdGhlIGljb24gdG8gaW5oZXJpdCkuIFJldHVybnMgbnVsbCB3aGVuIG5vXG4gKiBzb2xpZCBmaWxsIGlzIGZvdW5kLlxuICovXG5mdW5jdGlvbiBmaW5kRmlyc3RTb2xpZEZpbGxDb2xvcihub2RlOiBTY2VuZU5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgZmlsbHMgPSAobm9kZSBhcyBhbnkpLmZpbGxzO1xuICBpZiAoQXJyYXkuaXNBcnJheShmaWxscykpIHtcbiAgICBmb3IgKGNvbnN0IGYgb2YgZmlsbHMpIHtcbiAgICAgIGlmIChmICYmIGYudHlwZSA9PT0gJ1NPTElEJyAmJiBmLnZpc2libGUgIT09IGZhbHNlICYmIGYuY29sb3IpIHtcbiAgICAgICAgcmV0dXJuIHJnYlRvSGV4KGYuY29sb3IpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQudmlzaWJsZSA9PT0gZmFsc2UpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgYyA9IGZpbmRGaXJzdFNvbGlkRmlsbENvbG9yKGNoaWxkKTtcbiAgICAgIGlmIChjKSByZXR1cm4gYztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQnVpbGQgYW4gZWxlbWVudCBlbnRyeSBmb3IgYW4gaWNvbiBub2RlLiBFbmNvZGVzIHRoZSBTVkcgZmlsZW5hbWUgc29cbiAqIHRoZSBhZ2VudCBrbm93cyB3aGljaCBmaWxlIHRvIGlubGluZSwgcGx1cyBkaW1lbnNpb25zLCBhbHQgdGV4dCwgYW5kXG4gKiBhIHN1Z2dlc3RlZCBmaWxsIGNvbG9yLlxuICovXG5mdW5jdGlvbiBidWlsZEljb25FbGVtZW50KG5vZGU6IFNjZW5lTm9kZSwgZmlsZW5hbWU6IHN0cmluZyk6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4ge1xuICBjb25zdCBiYiA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgY29uc3QgZWxlbTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHtcbiAgICBpY29uRmlsZTogZmlsZW5hbWUsXG4gICAgd2lkdGg6IGJiID8gdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKGJiLndpZHRoKSkgOiBudWxsLFxuICAgIGhlaWdodDogYmIgPyB0b0Nzc1ZhbHVlKE1hdGgucm91bmQoYmIuaGVpZ2h0KSkgOiBudWxsLFxuICB9O1xuICBjb25zdCBjb2xvciA9IGZpbmRGaXJzdFNvbGlkRmlsbENvbG9yKG5vZGUpO1xuICBpZiAoY29sb3IpIGVsZW0uY29sb3IgPSBjb2xvcjtcbiAgY29uc3QgYWx0ID0gZXh0cmFjdEFsdFRleHQobm9kZSk7XG4gIGlmIChhbHQpIGVsZW0uYWx0ID0gYWx0O1xuICBPYmplY3QuYXNzaWduKGVsZW0sIGV4dHJhY3RGbGV4Q2hpbGRQcm9wcyhub2RlIGFzIGFueSkpO1xuICBhcHBseUNvbW1vblNpZ25hbHMoZWxlbSwgbm9kZSk7XG4gIGNvbnN0IG9wID0gZXh0cmFjdE9wYWNpdHkobm9kZSk7XG4gIGlmIChvcCAhPT0gbnVsbCkgZWxlbS5vcGFjaXR5ID0gb3A7XG4gIGNvbnN0IHR4ID0gZXh0cmFjdFRyYW5zZm9ybShub2RlIGFzIGFueSk7XG4gIGlmICh0eC50cmFuc2Zvcm0pIGVsZW0udHJhbnNmb3JtID0gdHgudHJhbnNmb3JtO1xuICBjb25zdCBocmVmID0gZXh0cmFjdExpbmtVcmwobm9kZSBhcyBhbnkpO1xuICBpZiAoaHJlZikgZWxlbS5saW5rVXJsID0gaHJlZjtcbiAgcmV0dXJuIGVsZW07XG59XG5cbi8qKlxuICogRmluZCBhbmQgY2xhc3NpZnkgYWxsIG1lYW5pbmdmdWwgZWxlbWVudHMgd2l0aGluIGEgc2VjdGlvbi5cbiAqIFdhbGtzIHRoZSBub2RlIHRyZWUgYW5kIGV4dHJhY3RzIHR5cG9ncmFwaHkgZm9yIFRFWFQgbm9kZXMsXG4gKiBkaW1lbnNpb25zIGZvciBpbWFnZSBjb250YWluZXJzLCBldGMuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RFbGVtZW50cyhcbiAgc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSxcbiAgaWNvbk1hcDogTWFwPHN0cmluZywgc3RyaW5nPixcbiAgaW1hZ2VNYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4pOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+PiB7XG4gIGNvbnN0IGVsZW1lbnRzOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+PiA9IHt9O1xuICBsZXQgdGV4dEluZGV4ID0gMDtcbiAgbGV0IGltYWdlSW5kZXggPSAwO1xuICBsZXQgaWNvbkluZGV4ID0gMDtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcikge1xuICAgIC8vIEljb24gcm9vdHMgXHUyMTkyIGVtaXQgaWNvbkZpbGUgcmVmZXJlbmNlIGFuZCBzdG9wLiBpY29uTWFwIGlzIGJ1aWx0IGJ5XG4gICAgLy8gaWNvbi1kZXRlY3RvciBhbmQgc2hhcmVkIHdpdGggaW1hZ2UtZXhwb3J0ZXIsIHNvIHRoZSBmaWxlbmFtZSBoZXJlXG4gICAgLy8gbWF0Y2hlcyBleGFjdGx5IHdoYXQgZ2V0cyB3cml0dGVuIGludG8gcGFnZXMvPHNsdWc+L2ltYWdlcy8uXG4gICAgY29uc3QgaWNvbkZpbGVuYW1lID0gaWNvbk1hcC5nZXQobm9kZS5pZCk7XG4gICAgaWYgKGljb25GaWxlbmFtZSkge1xuICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgY29uc3Qgcm9sZSA9IGNsZWFuTmFtZSAmJiAhL14odmVjdG9yfGljb258ZnJhbWV8Z3JvdXB8cmVjdGFuZ2xlfGVsbGlwc2V8Ym9vbGVhbilcXGQqJC8udGVzdChjbGVhbk5hbWUpXG4gICAgICAgID8gY2xlYW5OYW1lXG4gICAgICAgIDogYGljb24ke2ljb25JbmRleCA+IDAgPyAnXycgKyBpY29uSW5kZXggOiAnJ31gO1xuICAgICAgaWYgKCFlbGVtZW50c1tyb2xlXSkge1xuICAgICAgICBlbGVtZW50c1tyb2xlXSA9IGJ1aWxkSWNvbkVsZW1lbnQobm9kZSwgaWNvbkZpbGVuYW1lKTtcbiAgICAgIH1cbiAgICAgIGljb25JbmRleCsrO1xuICAgICAgcmV0dXJuOyAvLyBkb24ndCBkZXNjZW5kIGludG8gdGhlIGljb24ncyB2ZWN0b3IgY2hpbGRyZW5cbiAgICB9XG5cbiAgICAvLyBURVhUIG5vZGVzIFx1MjE5MiB0eXBvZ3JhcGh5ICsgdGV4dCBjb250ZW50XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICBjb25zdCB0eXBvID0gZXh0cmFjdFR5cG9ncmFwaHkobm9kZSk7XG4gICAgICBjb25zdCBmb250U2l6ZSA9IG5vZGUuZm9udFNpemUgIT09IGZpZ21hLm1peGVkID8gKG5vZGUuZm9udFNpemUgYXMgbnVtYmVyKSA6IDE2O1xuXG4gICAgICAvLyBDbGFzc2lmeSBieSByb2xlOiBoZWFkaW5ncyBhcmUgbGFyZ2VyLCBib2R5IHRleHQgaXMgc21hbGxlclxuICAgICAgbGV0IHJvbGU6IHN0cmluZztcbiAgICAgIGlmICh0ZXh0SW5kZXggPT09IDAgJiYgZm9udFNpemUgPj0gMjgpIHtcbiAgICAgICAgcm9sZSA9ICdoZWFkaW5nJztcbiAgICAgIH0gZWxzZSBpZiAodGV4dEluZGV4ID09PSAxICYmIGZvbnRTaXplID49IDE2KSB7XG4gICAgICAgIHJvbGUgPSAnc3ViaGVhZGluZyc7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdidXR0b24nKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY3RhJykpIHtcbiAgICAgICAgcm9sZSA9ICdidXR0b25fdGV4dCc7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjYXB0aW9uJykgfHwgZm9udFNpemUgPD0gMTQpIHtcbiAgICAgICAgcm9sZSA9IGBjYXB0aW9uJHt0ZXh0SW5kZXggPiAyID8gJ18nICsgdGV4dEluZGV4IDogJyd9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvbGUgPSBgdGV4dF8ke3RleHRJbmRleH1gO1xuICAgICAgfVxuXG4gICAgICAvLyBVc2UgdGhlIGxheWVyIG5hbWUgaWYgaXQncyBub3QgYSBkZWZhdWx0IG5hbWVcbiAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIGlmIChjbGVhbk5hbWUgJiYgIS9eKHRleHR8ZnJhbWV8Z3JvdXB8cmVjdGFuZ2xlKVxcZCokLy50ZXN0KGNsZWFuTmFtZSkpIHtcbiAgICAgICAgcm9sZSA9IGNsZWFuTmFtZTtcbiAgICAgIH1cblxuICAgICAgLy8gRXh0cmFjdCBhY3R1YWwgdGV4dCBjb250ZW50IGZvciBjb250ZW50IHBvcHVsYXRpb24gYW5kIGNvbnRleHRcbiAgICAgIHR5cG8udGV4dENvbnRlbnQgPSBub2RlLmNoYXJhY3RlcnMgfHwgbnVsbDtcblxuICAgICAgLy8gUGVyLXNpZGUgbWFyZ2lucyBmcm9tIHNpYmxpbmcgc3BhY2luZyAodG9wL3JpZ2h0L2JvdHRvbS9sZWZ0KVxuICAgICAgT2JqZWN0LmFzc2lnbih0eXBvLCBleHRyYWN0UGVyU2lkZU1hcmdpbnMobm9kZSkpO1xuXG4gICAgICAvLyBGbGV4LWNoaWxkIHByb3BlcnRpZXMgKGxheW91dEdyb3cgLyBsYXlvdXRBbGlnbilcbiAgICAgIE9iamVjdC5hc3NpZ24odHlwbywgZXh0cmFjdEZsZXhDaGlsZFByb3BzKG5vZGUpKTtcblxuICAgICAgLy8gVHJhbnNmb3JtIChyb3RhdGUvc2NhbGUpIGlmIG5vbi1pZGVudGl0eVxuICAgICAgY29uc3QgdHggPSBleHRyYWN0VHJhbnNmb3JtKG5vZGUpO1xuICAgICAgaWYgKHR4LnRyYW5zZm9ybSkgdHlwby50cmFuc2Zvcm0gPSB0eC50cmFuc2Zvcm07XG5cbiAgICAgIC8vIExpbmsgVVJMIGZyb20gcHJvdG90eXBlIG5hdmlnYXRpb25cbiAgICAgIGNvbnN0IGhyZWYgPSBleHRyYWN0TGlua1VybChub2RlKTtcbiAgICAgIGlmIChocmVmKSB0eXBvLmxpbmtVcmwgPSBocmVmO1xuXG4gICAgICAvLyBNYXggd2lkdGggaWYgY29uc3RyYWluZWRcbiAgICAgIGlmIChub2RlLmFic29sdXRlQm91bmRpbmdCb3ggJiYgbm9kZS5wYXJlbnQ/LnR5cGUgPT09ICdGUkFNRScpIHtcbiAgICAgICAgY29uc3QgcGFyZW50V2lkdGggPSAobm9kZS5wYXJlbnQgYXMgRnJhbWVOb2RlKS5hYnNvbHV0ZUJvdW5kaW5nQm94Py53aWR0aDtcbiAgICAgICAgaWYgKHBhcmVudFdpZHRoICYmIG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveC53aWR0aCA8IHBhcmVudFdpZHRoICogMC45KSB7XG4gICAgICAgICAgdHlwby5tYXhXaWR0aCA9IHRvQ3NzVmFsdWUoTWF0aC5yb3VuZChub2RlLmFic29sdXRlQm91bmRpbmdCb3gud2lkdGgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBDb21tb24gc2lnbmFsczogY29tcG9uZW50SW5zdGFuY2UsIHNpemluZyBtb2RlcywgYm91bmQgdmFyaWFibGVzXG4gICAgICBhcHBseUNvbW1vblNpZ25hbHModHlwbywgbm9kZSk7XG5cbiAgICAgIGNvbnN0IHRleHRPcGFjaXR5ID0gZXh0cmFjdE9wYWNpdHkobm9kZSk7XG4gICAgICBpZiAodGV4dE9wYWNpdHkgIT09IG51bGwpIHR5cG8ub3BhY2l0eSA9IHRleHRPcGFjaXR5O1xuXG4gICAgICBlbGVtZW50c1tyb2xlXSA9IHR5cG87XG4gICAgICB0ZXh0SW5kZXgrKztcbiAgICB9XG5cbiAgICAvLyBJTUFHRSBmaWxscyBcdTIxOTIgaW1hZ2UgZWxlbWVudCAod2l0aCBzbWFydCBiYWNrZ3JvdW5kIGRldGVjdGlvbilcbiAgICBpZiAoaGFzSW1hZ2VGaWxsKG5vZGUgYXMgYW55KSAmJiBub2RlLmFic29sdXRlQm91bmRpbmdCb3gpIHtcbiAgICAgIGNvbnN0IGJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcblxuICAgICAgLy8gU21hcnQgYmFja2dyb3VuZCBpbWFnZSBkZXRlY3Rpb246XG4gICAgICAvLyAxLiBMYXllciBuYW1lIGNvbnRhaW5zICdiYWNrZ3JvdW5kJyBvciAnYmcnIE9SXG4gICAgICAvLyAyLiBJbWFnZSBzcGFucyA+PSA5MCUgb2YgdGhlIHNlY3Rpb24ncyB3aWR0aCBBTkQgaGVpZ2h0IChmdWxsLWJsZWVkIGltYWdlKVxuICAgICAgY29uc3QgbmFtZUhpbnRzQmcgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYmFja2dyb3VuZCcpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdiZycpO1xuICAgICAgY29uc3Qgc2VjdGlvbkJvdW5kcyA9IHNlY3Rpb25Ob2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICBjb25zdCBzcGFuc1NlY3Rpb24gPSBzZWN0aW9uQm91bmRzICYmXG4gICAgICAgIGJvdW5kcy53aWR0aCA+PSBzZWN0aW9uQm91bmRzLndpZHRoICogMC45ICYmXG4gICAgICAgIGJvdW5kcy5oZWlnaHQgPj0gc2VjdGlvbkJvdW5kcy5oZWlnaHQgKiAwLjk7XG5cbiAgICAgIGNvbnN0IGlzQmFja2dyb3VuZEltYWdlID0gbmFtZUhpbnRzQmcgfHwgc3BhbnNTZWN0aW9uO1xuXG4gICAgICBjb25zdCByb2xlID0gaXNCYWNrZ3JvdW5kSW1hZ2VcbiAgICAgICAgPyAnYmFja2dyb3VuZF9pbWFnZSdcbiAgICAgICAgOiBgaW1hZ2Uke2ltYWdlSW5kZXggPiAwID8gJ18nICsgaW1hZ2VJbmRleCA6ICcnfWA7XG5cbiAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIGNvbnN0IGZpbmFsUm9sZSA9IGNsZWFuTmFtZSAmJiAhL14oaW1hZ2V8cmVjdGFuZ2xlfGZyYW1lKVxcZCokLy50ZXN0KGNsZWFuTmFtZSkgPyBjbGVhbk5hbWUgOiByb2xlO1xuXG4gICAgICAvLyBEZXRlY3QgbWFzay9jbGlwIG9uIGltYWdlIG9yIGl0cyBwYXJlbnQgY29udGFpbmVyXG4gICAgICBjb25zdCBwYXJlbnRGcmFtZSA9IG5vZGUucGFyZW50O1xuICAgICAgY29uc3QgcGFyZW50Q2xpcHMgPSBwYXJlbnRGcmFtZSAmJiAnY2xpcHNDb250ZW50JyBpbiBwYXJlbnRGcmFtZSAmJiAocGFyZW50RnJhbWUgYXMgYW55KS5jbGlwc0NvbnRlbnQgPT09IHRydWU7XG4gICAgICBjb25zdCBpc01hc2tlZCA9ICgnaXNNYXNrJyBpbiBub2RlICYmIChub2RlIGFzIGFueSkuaXNNYXNrID09PSB0cnVlKSB8fCBwYXJlbnRDbGlwcztcbiAgICAgIC8vIERldGVjdCBjaXJjdWxhci9yb3VuZGVkIGNsaXBzOiBpZiBwYXJlbnQgaGFzIGVxdWFsIGNvcm5lclJhZGl1cyBhbmQgaXMgcm91Z2hseSBzcXVhcmVcbiAgICAgIGxldCBjbGlwQm9yZGVyUmFkaXVzOiBzdHJpbmcgfCBudWxsID0gJ2Nvcm5lclJhZGl1cycgaW4gbm9kZSAmJiB0eXBlb2YgKG5vZGUgYXMgYW55KS5jb3JuZXJSYWRpdXMgPT09ICdudW1iZXInXG4gICAgICAgID8gdG9Dc3NWYWx1ZSgobm9kZSBhcyBhbnkpLmNvcm5lclJhZGl1cylcbiAgICAgICAgOiBudWxsO1xuICAgICAgaWYgKCFjbGlwQm9yZGVyUmFkaXVzICYmIHBhcmVudEZyYW1lICYmICdjb3JuZXJSYWRpdXMnIGluIHBhcmVudEZyYW1lICYmIHR5cGVvZiAocGFyZW50RnJhbWUgYXMgYW55KS5jb3JuZXJSYWRpdXMgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudENvcm5lciA9IChwYXJlbnRGcmFtZSBhcyBhbnkpLmNvcm5lclJhZGl1cyBhcyBudW1iZXI7XG4gICAgICAgIGlmIChwYXJlbnRDb3JuZXIgPiAwKSB7XG4gICAgICAgICAgY29uc3QgcGFyZW50Qm91bmRzID0gKHBhcmVudEZyYW1lIGFzIGFueSkuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICAgICAgICAvLyBJZiBwYXJlbnQgaXMgcm91Z2hseSBzcXVhcmUgYW5kIGNvcm5lclJhZGl1cyA+PSBoYWxmIHRoZSB3aWR0aCBcdTIxOTIgY2lyY2xlXG4gICAgICAgICAgaWYgKHBhcmVudEJvdW5kcyAmJiBNYXRoLmFicyhwYXJlbnRCb3VuZHMud2lkdGggLSBwYXJlbnRCb3VuZHMuaGVpZ2h0KSA8IDUgJiYgcGFyZW50Q29ybmVyID49IHBhcmVudEJvdW5kcy53aWR0aCAvIDIgLSAyKSB7XG4gICAgICAgICAgICBjbGlwQm9yZGVyUmFkaXVzID0gJzUwJSc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsaXBCb3JkZXJSYWRpdXMgPSB0b0Nzc1ZhbHVlKHBhcmVudENvcm5lcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGltZ0VmZmVjdHMgPSBleHRyYWN0RWZmZWN0cyhub2RlIGFzIGFueSk7XG4gICAgICBjb25zdCBpbWdPYmplY3RQb3NpdGlvbiA9IGV4dHJhY3RPYmplY3RQb3NpdGlvbihub2RlKTtcbiAgICAgIGNvbnN0IGltZ0Nvcm5lcnMgPSBleHRyYWN0UGVyQ29ybmVyUmFkaXVzKG5vZGUgYXMgYW55KTtcbiAgICAgIC8vIGltYWdlLWV4cG9ydGVyIHdyaXRlcyByYXN0ZXIgZmlsbHMgdXNpbmcgdGhlIHNoYXJlZCBpbWFnZU1hcC5cbiAgICAgIC8vIFJlc29sdmUgdGhyb3VnaCB0aGUgc2FtZSBtYXAgc28gdGhlIHNwZWMncyBgaW1hZ2VGaWxlYCBtYXRjaGVzIHRoZVxuICAgICAgLy8gZXhhY3QgZmlsZW5hbWUgdGhlIFpJUCBjb250YWlucyAoYWZ0ZXIgZGVkdXAgKyBzdWZmaXhpbmcpLlxuICAgICAgY29uc3QgaW1nRmlsZW5hbWUgPSBpbWFnZU1hcC5nZXQobm9kZS5pZCkgfHwgYCR7c2x1Z2lmeShub2RlLm5hbWUpfS5wbmdgO1xuICAgICAgY29uc3QgaW1nRWxlbTogUGFydGlhbDxFbGVtZW50U3R5bGVzPiA9IHtcbiAgICAgICAgaW1hZ2VGaWxlOiBpbWdGaWxlbmFtZSxcbiAgICAgICAgd2lkdGg6IGlzQmFja2dyb3VuZEltYWdlID8gJzEwMCUnIDogdG9Dc3NWYWx1ZShNYXRoLnJvdW5kKGJvdW5kcy53aWR0aCkpLFxuICAgICAgICBoZWlnaHQ6IGlzQmFja2dyb3VuZEltYWdlID8gJzEwMCUnIDogJ2F1dG8nLFxuICAgICAgICBhc3BlY3RSYXRpbzogaXNCYWNrZ3JvdW5kSW1hZ2UgPyBudWxsIDogY29tcHV0ZUFzcGVjdFJhdGlvKGJvdW5kcy53aWR0aCwgYm91bmRzLmhlaWdodCksXG4gICAgICAgIG9iamVjdEZpdDogZ2V0SW1hZ2VPYmplY3RGaXQobm9kZSBhcyBhbnkpLFxuICAgICAgICBvYmplY3RQb3NpdGlvbjogaW1nT2JqZWN0UG9zaXRpb24sXG4gICAgICAgIG92ZXJmbG93OiAocGFyZW50Q2xpcHMgfHwgY2xpcEJvcmRlclJhZGl1cykgPyAnaGlkZGVuJyA6IG51bGwsXG4gICAgICAgIGhhc01hc2s6IGlzTWFza2VkIHx8IG51bGwsXG4gICAgICAgIGJveFNoYWRvdzogaW1nRWZmZWN0cy5ib3hTaGFkb3csXG4gICAgICAgIGZpbHRlcjogaW1nRWZmZWN0cy5maWx0ZXIsXG4gICAgICAgIC8vIE1hcmsgYmFja2dyb3VuZCBpbWFnZXMgd2l0aCBwb3NpdGlvbiBkYXRhIHNvIGFnZW50cyBrbm93IHRvIHVzZSBDU1MgYmFja2dyb3VuZC1pbWFnZVxuICAgICAgICBwb3NpdGlvbjogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnYWJzb2x1dGUnIDogbnVsbCxcbiAgICAgICAgdG9wOiBpc0JhY2tncm91bmRJbWFnZSA/ICcwcHgnIDogbnVsbCxcbiAgICAgICAgbGVmdDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAnMHB4JyA6IG51bGwsXG4gICAgICAgIHpJbmRleDogaXNCYWNrZ3JvdW5kSW1hZ2UgPyAwIDogbnVsbCxcbiAgICAgIH07XG4gICAgICBjb25zdCBpbWdBbHQgPSBleHRyYWN0QWx0VGV4dChub2RlKTtcbiAgICAgIGlmIChpbWdBbHQpIGltZ0VsZW0uYWx0ID0gaW1nQWx0O1xuICAgICAgYXBwbHlDb21tb25TaWduYWxzKGltZ0VsZW0sIG5vZGUpO1xuICAgICAgLy8gQXBwbHkgcmFkaXVzIFx1MjAxNCBwZXItY29ybmVyIGlmIG5vZGUgaGFzIGRpZmZlcmluZyBjb3JuZXJzLCB1bmlmb3JtIG90aGVyd2lzZVxuICAgICAgaWYgKGltZ0Nvcm5lcnMpIHtcbiAgICAgICAgaWYgKGltZ0Nvcm5lcnMudW5pZm9ybSAhPT0gbnVsbCkge1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyUmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLnVuaWZvcm0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltZ0VsZW0uYm9yZGVyVG9wTGVmdFJhZGl1cyA9IHRvQ3NzVmFsdWUoaW1nQ29ybmVycy50b3BMZWZ0KTtcbiAgICAgICAgICBpbWdFbGVtLmJvcmRlclRvcFJpZ2h0UmFkaXVzID0gdG9Dc3NWYWx1ZShpbWdDb3JuZXJzLnRvcFJpZ2h0KTtcbiAgICAgICAgICBpbWdFbGVtLmJvcmRlckJvdHRvbUxlZnRSYWRpdXMgPSB0b0Nzc1ZhbHVlKGltZ0Nvcm5lcnMuYm90dG9tTGVmdCk7XG4gICAgICAgICAgaW1nRWxlbS5ib3JkZXJCb3R0b21SaWdodFJhZGl1cyA9IHRvQ3NzVmFsdWUoaW1nQ29ybmVycy5ib3R0b21SaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2xpcEJvcmRlclJhZGl1cykge1xuICAgICAgICBpbWdFbGVtLmJvcmRlclJhZGl1cyA9IGNsaXBCb3JkZXJSYWRpdXM7XG4gICAgICB9XG4gICAgICAvLyBGbGV4LWNoaWxkIHByb3BzIGlmIGltYWdlIGlzIGluc2lkZSBhbiBhdXRvLWxheW91dCByb3dcbiAgICAgIE9iamVjdC5hc3NpZ24oaW1nRWxlbSwgZXh0cmFjdEZsZXhDaGlsZFByb3BzKG5vZGUpKTtcbiAgICAgIGNvbnN0IGltZ09wYWNpdHkgPSBleHRyYWN0T3BhY2l0eShub2RlKTtcbiAgICAgIGlmIChpbWdPcGFjaXR5ICE9PSBudWxsKSBpbWdFbGVtLm9wYWNpdHkgPSBpbWdPcGFjaXR5O1xuICAgICAgZWxlbWVudHNbZmluYWxSb2xlXSA9IGltZ0VsZW07XG4gICAgICBpbWFnZUluZGV4Kys7XG4gICAgfVxuXG4gICAgLy8gQnV0dG9uLWxpa2UgZnJhbWVzIChzbWFsbCBmcmFtZXMgd2l0aCB0ZXh0ICsgZmlsbClcbiAgICBpZiAoKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgbm9kZS50eXBlID09PSAnQ09NUE9ORU5UJykgJiZcbiAgICAgICAgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2J1dHRvbicpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdidG4nKSB8fCBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY3RhJykpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBjb25zdCBiZyA9IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3IoZnJhbWUpO1xuICAgICAgY29uc3QgYm91bmRzID0gZnJhbWUuYWJzb2x1dGVCb3VuZGluZ0JveDtcblxuICAgICAgaWYgKGJnICYmIGJvdW5kcykge1xuICAgICAgICBjb25zdCBidXR0b25TdHlsZXM6IFBhcnRpYWw8RWxlbWVudFN0eWxlcz4gPSB7XG4gICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBiZyxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoZnJhbWUubGF5b3V0TW9kZSAmJiBmcmFtZS5sYXlvdXRNb2RlICE9PSAnTk9ORScpIHtcbiAgICAgICAgICBidXR0b25TdHlsZXMucGFkZGluZ1RvcCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ1RvcCk7XG4gICAgICAgICAgYnV0dG9uU3R5bGVzLnBhZGRpbmdCb3R0b20gPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdCb3R0b20pO1xuICAgICAgICAgIGJ1dHRvblN0eWxlcy5wYWRkaW5nTGVmdCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ0xlZnQpO1xuICAgICAgICAgIGJ1dHRvblN0eWxlcy5wYWRkaW5nUmlnaHQgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdSaWdodCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBmcmFtZS5pdGVtU3BhY2luZyA9PT0gJ251bWJlcicgJiYgZnJhbWUuaXRlbVNwYWNpbmcgPiAwKSB7XG4gICAgICAgICAgICBidXR0b25TdHlsZXMuZ2FwID0gdG9Dc3NWYWx1ZShmcmFtZS5pdGVtU3BhY2luZyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEZsZXggbGF5b3V0IChpY29uICsgbGFiZWwgZXRjLilcbiAgICAgICAgICBPYmplY3QuYXNzaWduKGJ1dHRvblN0eWxlcywgZXh0cmFjdEF1dG9MYXlvdXRGbGV4KGZyYW1lKSk7XG4gICAgICAgIH1cblxuICAgICAgICBhcHBseVJhZGl1cyhidXR0b25TdHlsZXMsIGZyYW1lKTtcbiAgICAgICAgYXBwbHlTdHJva2VzKGJ1dHRvblN0eWxlcywgZnJhbWUpO1xuICAgICAgICBjb25zdCBidG5FZmZlY3RzID0gZXh0cmFjdEVmZmVjdHMoZnJhbWUgYXMgYW55KTtcbiAgICAgICAgaWYgKGJ0bkVmZmVjdHMuYm94U2hhZG93KSBidXR0b25TdHlsZXMuYm94U2hhZG93ID0gYnRuRWZmZWN0cy5ib3hTaGFkb3c7XG4gICAgICAgIGlmIChidG5FZmZlY3RzLmZpbHRlcikgYnV0dG9uU3R5bGVzLmZpbHRlciA9IGJ0bkVmZmVjdHMuZmlsdGVyO1xuXG4gICAgICAgIGNvbnN0IHR4ID0gZXh0cmFjdFRyYW5zZm9ybShmcmFtZSBhcyBhbnkpO1xuICAgICAgICBpZiAodHgudHJhbnNmb3JtKSBidXR0b25TdHlsZXMudHJhbnNmb3JtID0gdHgudHJhbnNmb3JtO1xuXG4gICAgICAgIC8vIExpbmsgVVJMIGZyb20gcHJvdG90eXBlIE9QRU5fVVJMIGFjdGlvblxuICAgICAgICBjb25zdCBocmVmID0gZXh0cmFjdExpbmtVcmwoZnJhbWUpO1xuICAgICAgICBpZiAoaHJlZikgYnV0dG9uU3R5bGVzLmxpbmtVcmwgPSBocmVmO1xuXG4gICAgICAgIC8vIEZpbmQgdGhlIHRleHQgbm9kZSBpbnNpZGUgdGhlIGJ1dHRvbiBmb3IgdHlwb2dyYXBoeVxuICAgICAgICBjb25zdCB0ZXh0Q2hpbGQgPSBmaW5kRmlyc3RUZXh0Tm9kZShmcmFtZSk7XG4gICAgICAgIGlmICh0ZXh0Q2hpbGQpIHtcbiAgICAgICAgICBjb25zdCB0eXBvID0gZXh0cmFjdFR5cG9ncmFwaHkodGV4dENoaWxkKTtcbiAgICAgICAgICBPYmplY3QuYXNzaWduKGJ1dHRvblN0eWxlcywgdHlwbyk7XG4gICAgICAgICAgYnV0dG9uU3R5bGVzLnRleHRDb250ZW50ID0gdGV4dENoaWxkLmNoYXJhY3RlcnMgfHwgbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIE9iamVjdC5hc3NpZ24oYnV0dG9uU3R5bGVzLCBleHRyYWN0RmxleENoaWxkUHJvcHMoZnJhbWUgYXMgYW55KSk7XG5cbiAgICAgICAgLy8gQ29tbW9uIHNpZ25hbHM6IGNvbXBvbmVudEluc3RhbmNlIChidXR0b24gdmFyaWFudHMhKSwgc2l6aW5nLCB2YXJzXG4gICAgICAgIGFwcGx5Q29tbW9uU2lnbmFscyhidXR0b25TdHlsZXMsIGZyYW1lKTtcblxuICAgICAgICBjb25zdCBidG5PcGFjaXR5ID0gZXh0cmFjdE9wYWNpdHkoZnJhbWUpO1xuICAgICAgICBpZiAoYnRuT3BhY2l0eSAhPT0gbnVsbCkgYnV0dG9uU3R5bGVzLm9wYWNpdHkgPSBidG5PcGFjaXR5O1xuXG4gICAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgICAgZWxlbWVudHNbY2xlYW5OYW1lIHx8ICdidXR0b24nXSA9IGJ1dHRvblN0eWxlcztcbiAgICAgIH1cbiAgICAgIHJldHVybjsgLy8gRG9uJ3QgcmVjdXJzZSBpbnRvIGJ1dHRvbiBpbnRlcm5hbHNcbiAgICB9XG5cbiAgICAvLyBJbnB1dC1saWtlIGZyYW1lcyAoZGV0ZWN0IGlucHV0cyBieSBjb21tb24gbGF5ZXIgbmFtZXMpXG4gICAgaWYgKChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcpICYmXG4gICAgICAgIC9cXGIoaW5wdXR8ZmllbGR8dGV4dGJveHx0ZXh0YXJlYXxzZWxlY3R8dGV4dGZpZWxkKVxcYi9pLnRlc3Qobm9kZS5uYW1lKSkge1xuICAgICAgY29uc3QgZnJhbWUgPSBub2RlIGFzIEZyYW1lTm9kZTtcbiAgICAgIGNvbnN0IGlucHV0U3R5bGVzOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGV4dHJhY3RCYWNrZ3JvdW5kQ29sb3IoZnJhbWUpLFxuICAgICAgfTtcbiAgICAgIGlmIChmcmFtZS5sYXlvdXRNb2RlICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJykge1xuICAgICAgICBpbnB1dFN0eWxlcy5wYWRkaW5nVG9wID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nVG9wKTtcbiAgICAgICAgaW5wdXRTdHlsZXMucGFkZGluZ0JvdHRvbSA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ0JvdHRvbSk7XG4gICAgICAgIGlucHV0U3R5bGVzLnBhZGRpbmdMZWZ0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nTGVmdCk7XG4gICAgICAgIGlucHV0U3R5bGVzLnBhZGRpbmdSaWdodCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ1JpZ2h0KTtcbiAgICAgIH1cbiAgICAgIGFwcGx5UmFkaXVzKGlucHV0U3R5bGVzLCBmcmFtZSk7XG4gICAgICBhcHBseVN0cm9rZXMoaW5wdXRTdHlsZXMsIGZyYW1lKTtcbiAgICAgIGNvbnN0IHBsYWNlaG9sZGVyVGV4dCA9IGZpbmRGaXJzdFRleHROb2RlKGZyYW1lKTtcbiAgICAgIGlmIChwbGFjZWhvbGRlclRleHQpIHtcbiAgICAgICAgaW5wdXRTdHlsZXMucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlclRleHQuY2hhcmFjdGVycyB8fCBudWxsO1xuICAgICAgICBjb25zdCBwbGFjZWhvbGRlclR5cG8gPSBleHRyYWN0VHlwb2dyYXBoeShwbGFjZWhvbGRlclRleHQpO1xuICAgICAgICBpbnB1dFN0eWxlcy5wbGFjZWhvbGRlclN0eWxlcyA9IHtcbiAgICAgICAgICBjb2xvcjogcGxhY2Vob2xkZXJUeXBvLmNvbG9yIHx8IG51bGwsXG4gICAgICAgICAgZm9udFNpemU6IHBsYWNlaG9sZGVyVHlwby5mb250U2l6ZSB8fCBudWxsLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgYXBwbHlDb21tb25TaWduYWxzKGlucHV0U3R5bGVzLCBmcmFtZSk7XG5cbiAgICAgIGNvbnN0IGlucHV0T3BhY2l0eSA9IGV4dHJhY3RPcGFjaXR5KGZyYW1lKTtcbiAgICAgIGlmIChpbnB1dE9wYWNpdHkgIT09IG51bGwpIGlucHV0U3R5bGVzLm9wYWNpdHkgPSBpbnB1dE9wYWNpdHk7XG5cbiAgICAgIGNvbnN0IGlucHV0TmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKSB8fCAnaW5wdXQnO1xuICAgICAgZWxlbWVudHNbaW5wdXROYW1lXSA9IGlucHV0U3R5bGVzO1xuICAgICAgcmV0dXJuOyAvLyBEb24ndCByZWN1cnNlIGludG8gaW5wdXQgaW50ZXJuYWxzXG4gICAgfVxuXG4gICAgLy8gR2VuZXJpYyBjb250YWluZXIgZnJhbWVzIFx1MjAxNCBjYXJkcywgd3JhcHBlcnMsIHRpbGVzIGV0Yy4gRW1pdCBzdHlsaW5nIHdoZW5cbiAgICAvLyB0aGUgZnJhbWUgaGFzIGFueSB2aXN1YWwgcHJvcGVydGllcyAoZmlsbCwgc3Ryb2tlLCByYWRpdXMsIHNoYWRvdyxcbiAgICAvLyBvcGFjaXR5IDwgMSkuIFNraXAgZGVwdGggMCAodGhhdCdzIHRoZSBzZWN0aW9uIGl0c2VsZiwgaGFuZGxlZCBieVxuICAgIC8vIGV4dHJhY3RTZWN0aW9uU3R5bGVzKS4gU3RpbGwgcmVjdXJzZSBzbyBuZXN0ZWQgdGV4dC9pbWFnZXMvYnV0dG9ucyBhcmVcbiAgICAvLyBjYXB0dXJlZCBhcyBzZXBhcmF0ZSBlbGVtZW50cy5cbiAgICBpZiAoZGVwdGggPiAwICYmXG4gICAgICAgIChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgbm9kZS50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgICAhaGFzSW1hZ2VGaWxsKG5vZGUgYXMgYW55KSAmJlxuICAgICAgICBoYXNDb250YWluZXJTdHlsaW5nKG5vZGUpKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IG5vZGUgYXMgRnJhbWVOb2RlO1xuICAgICAgY29uc3QgY29udGFpbmVyU3R5bGVzOiBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+ID0ge307XG5cbiAgICAgIGNvbnN0IGJnID0gZXh0cmFjdEJhY2tncm91bmRDb2xvcihmcmFtZSk7XG4gICAgICBpZiAoYmcpIGNvbnRhaW5lclN0eWxlcy5iYWNrZ3JvdW5kQ29sb3IgPSBiZztcbiAgICAgIGNvbnN0IGdyYWRpZW50ID0gZXh0cmFjdEdyYWRpZW50KGZyYW1lKTtcbiAgICAgIGlmIChncmFkaWVudCkgY29udGFpbmVyU3R5bGVzLmJhY2tncm91bmRHcmFkaWVudCA9IGdyYWRpZW50O1xuXG4gICAgICBpZiAoZnJhbWUubGF5b3V0TW9kZSAmJiBmcmFtZS5sYXlvdXRNb2RlICE9PSAnTk9ORScpIHtcbiAgICAgICAgY29udGFpbmVyU3R5bGVzLnBhZGRpbmdUb3AgPSB0b0Nzc1ZhbHVlKGZyYW1lLnBhZGRpbmdUb3ApO1xuICAgICAgICBjb250YWluZXJTdHlsZXMucGFkZGluZ0JvdHRvbSA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ0JvdHRvbSk7XG4gICAgICAgIGNvbnRhaW5lclN0eWxlcy5wYWRkaW5nTGVmdCA9IHRvQ3NzVmFsdWUoZnJhbWUucGFkZGluZ0xlZnQpO1xuICAgICAgICBjb250YWluZXJTdHlsZXMucGFkZGluZ1JpZ2h0ID0gdG9Dc3NWYWx1ZShmcmFtZS5wYWRkaW5nUmlnaHQpO1xuICAgICAgICBpZiAodHlwZW9mIGZyYW1lLml0ZW1TcGFjaW5nID09PSAnbnVtYmVyJyAmJiBmcmFtZS5pdGVtU3BhY2luZyA+IDApIHtcbiAgICAgICAgICBjb250YWluZXJTdHlsZXMuZ2FwID0gdG9Dc3NWYWx1ZShmcmFtZS5pdGVtU3BhY2luZyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gRmxleCBkaXJlY3Rpb24gKyBhbGlnbm1lbnQgZnJvbSBhdXRvLWxheW91dFxuICAgICAgICBPYmplY3QuYXNzaWduKGNvbnRhaW5lclN0eWxlcywgZXh0cmFjdEF1dG9MYXlvdXRGbGV4KGZyYW1lKSk7XG4gICAgICB9XG5cbiAgICAgIGFwcGx5UmFkaXVzKGNvbnRhaW5lclN0eWxlcywgZnJhbWUpO1xuICAgICAgYXBwbHlTdHJva2VzKGNvbnRhaW5lclN0eWxlcywgZnJhbWUpO1xuXG4gICAgICBjb25zdCBmeCA9IGV4dHJhY3RFZmZlY3RzKGZyYW1lIGFzIGFueSk7XG4gICAgICBpZiAoZnguYm94U2hhZG93KSBjb250YWluZXJTdHlsZXMuYm94U2hhZG93ID0gZnguYm94U2hhZG93O1xuICAgICAgaWYgKGZ4LmZpbHRlcikgY29udGFpbmVyU3R5bGVzLmZpbHRlciA9IGZ4LmZpbHRlcjtcbiAgICAgIGlmIChmeC5iYWNrZHJvcEZpbHRlcikgY29udGFpbmVyU3R5bGVzLmJhY2tkcm9wRmlsdGVyID0gZnguYmFja2Ryb3BGaWx0ZXI7XG5cbiAgICAgIGNvbnN0IHR4ID0gZXh0cmFjdFRyYW5zZm9ybShmcmFtZSBhcyBhbnkpO1xuICAgICAgaWYgKHR4LnRyYW5zZm9ybSkgY29udGFpbmVyU3R5bGVzLnRyYW5zZm9ybSA9IHR4LnRyYW5zZm9ybTtcblxuICAgICAgY29uc3QgY29udGFpbmVyT3BhY2l0eSA9IGV4dHJhY3RPcGFjaXR5KGZyYW1lKTtcbiAgICAgIGlmIChjb250YWluZXJPcGFjaXR5ICE9PSBudWxsKSBjb250YWluZXJTdHlsZXMub3BhY2l0eSA9IGNvbnRhaW5lck9wYWNpdHk7XG5cbiAgICAgIE9iamVjdC5hc3NpZ24oY29udGFpbmVyU3R5bGVzLCBleHRyYWN0RmxleENoaWxkUHJvcHMoZnJhbWUgYXMgYW55KSk7XG4gICAgICBhcHBseUNvbW1vblNpZ25hbHMoY29udGFpbmVyU3R5bGVzLCBmcmFtZSk7XG5cbiAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIGNvbnN0IHJvbGUgPSBjbGVhbk5hbWUgJiYgIS9eKGZyYW1lfGdyb3VwfHJlY3RhbmdsZXxlbGxpcHNlKVxcZCokLy50ZXN0KGNsZWFuTmFtZSlcbiAgICAgICAgPyBjbGVhbk5hbWVcbiAgICAgICAgOiBgY29udGFpbmVyXyR7T2JqZWN0LmtleXMoZWxlbWVudHMpLmZpbHRlcihrID0+IGsuc3RhcnRzV2l0aCgnY29udGFpbmVyXycpKS5sZW5ndGggKyAxfWA7XG4gICAgICBpZiAoIWVsZW1lbnRzW3JvbGVdKSB7XG4gICAgICAgIGVsZW1lbnRzW3JvbGVdID0gY29udGFpbmVyU3R5bGVzO1xuICAgICAgfVxuICAgICAgLy8gRmFsbCB0aHJvdWdoIHRvIHJlY3Vyc2lvbiBzbyBuZXN0ZWQgZWxlbWVudHMgc3RpbGwgZ2V0IGV4dHJhY3RlZC5cbiAgICB9XG5cbiAgICAvLyBSZWN1cnNlIGludG8gY2hpbGRyZW4gKGRlcHRoIGxpbWl0IDYgdG8gY2FwdHVyZSBkZWVwbHkgbmVzdGVkIGVsZW1lbnRzKVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUgJiYgZGVwdGggPCA2KSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgd2FsayhjaGlsZCwgZGVwdGggKyAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdhbGsoc2VjdGlvbk5vZGUsIDApO1xuICByZXR1cm4gZWxlbWVudHM7XG59XG5cbi8qKlxuICogRmluZCB0aGUgZmlyc3QgVEVYVCBub2RlIGluIGEgc3VidHJlZS5cbiAqL1xuZnVuY3Rpb24gZmluZEZpcnN0VGV4dE5vZGUobm9kZTogU2NlbmVOb2RlKTogVGV4dE5vZGUgfCBudWxsIHtcbiAgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSByZXR1cm4gbm9kZTtcbiAgaWYgKCdjaGlsZHJlbicgaW4gbm9kZSkge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgY29uc3QgZm91bmQgPSBmaW5kRmlyc3RUZXh0Tm9kZShjaGlsZCk7XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogRXh0cmFjdCBsYXllciBpbmZvcm1hdGlvbiBmb3IgYWxsIG1lYW5pbmdmdWwgY2hpbGRyZW4gb2YgYSBzZWN0aW9uLlxuICogUmV0dXJucyBsYXllcnMgc29ydGVkIGJ5IEZpZ21hJ3MgbGF5ZXIgb3JkZXIgKGJhY2sgdG8gZnJvbnQpLlxuICogQm91bmRzIGFyZSByZWxhdGl2ZSB0byB0aGUgc2VjdGlvbidzIG9yaWdpbiwgbm90IHRoZSBjYW52YXMuXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RMYXllcnMoXG4gIHNlY3Rpb25Ob2RlOiBTY2VuZU5vZGUsXG4gIGVsZW1lbnRzOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPEVsZW1lbnRTdHlsZXM+PixcbiAgaWNvbk1hcDogTWFwPHN0cmluZywgc3RyaW5nPixcbik6IExheWVySW5mb1tdIHtcbiAgY29uc3QgbGF5ZXJzOiBMYXllckluZm9bXSA9IFtdO1xuICBjb25zdCBzZWN0aW9uQm91bmRzID0gc2VjdGlvbk5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgaWYgKCFzZWN0aW9uQm91bmRzKSByZXR1cm4gbGF5ZXJzO1xuXG4gIGxldCBsYXllckluZGV4ID0gMDtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSwgZGVwdGg6IG51bWJlcikge1xuICAgIGlmICghbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94IHx8IGRlcHRoID4gNikgcmV0dXJuO1xuXG4gICAgY29uc3QgYm91bmRzID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgIGNvbnN0IHJlbEJvdW5kcyA9IHtcbiAgICAgIHg6IE1hdGgucm91bmQoYm91bmRzLnggLSBzZWN0aW9uQm91bmRzIS54KSxcbiAgICAgIHk6IE1hdGgucm91bmQoYm91bmRzLnkgLSBzZWN0aW9uQm91bmRzIS55KSxcbiAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKGJvdW5kcy53aWR0aCksXG4gICAgICBoZWlnaHQ6IE1hdGgucm91bmQoYm91bmRzLmhlaWdodCksXG4gICAgfTtcblxuICAgIGxldCByb2xlOiBMYXllckluZm9bJ3JvbGUnXSB8IG51bGwgPSBudWxsO1xuICAgIGxldCBuYW1lID0gJyc7XG5cbiAgICBpZiAoaWNvbk1hcC5oYXMobm9kZS5pZCkpIHtcbiAgICAgIHJvbGUgPSAnaWNvbic7XG4gICAgICBjb25zdCBjbGVhbk5hbWUgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICdfJykucmVwbGFjZSgvW15hLXowLTlfXS9nLCAnJyk7XG4gICAgICBuYW1lID0gY2xlYW5OYW1lICYmICEvXih2ZWN0b3J8aWNvbnxmcmFtZXxncm91cHxyZWN0YW5nbGV8ZWxsaXBzZXxib29sZWFuKVxcZCokLy50ZXN0KGNsZWFuTmFtZSlcbiAgICAgICAgPyBjbGVhbk5hbWVcbiAgICAgICAgOiBgaWNvbl8ke2xheWVySW5kZXh9YDtcbiAgICB9IGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gJ1RFWFQnKSB7XG4gICAgICByb2xlID0gJ3RleHQnO1xuICAgICAgY29uc3QgY2xlYW5OYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpO1xuICAgICAgbmFtZSA9IGNsZWFuTmFtZSAmJiAhL150ZXh0XFxkKiQvLnRlc3QoY2xlYW5OYW1lKSA/IGNsZWFuTmFtZSA6IGB0ZXh0XyR7bGF5ZXJJbmRleH1gO1xuICAgIH0gZWxzZSBpZiAoaGFzSW1hZ2VGaWxsKG5vZGUgYXMgYW55KSkge1xuICAgICAgY29uc3QgbmFtZUhpbnRzQmcgPSBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYmFja2dyb3VuZCcpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdiZycpO1xuICAgICAgY29uc3Qgc3BhbnNTZWN0aW9uID0gYm91bmRzLndpZHRoID49IHNlY3Rpb25Cb3VuZHMhLndpZHRoICogMC45ICYmIGJvdW5kcy5oZWlnaHQgPj0gc2VjdGlvbkJvdW5kcyEuaGVpZ2h0ICogMC45O1xuICAgICAgcm9sZSA9IChuYW1lSGludHNCZyB8fCBzcGFuc1NlY3Rpb24pID8gJ2JhY2tncm91bmRfaW1hZ2UnIDogJ2ltYWdlJztcbiAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICAgIG5hbWUgPSBjbGVhbk5hbWUgJiYgIS9eKGltYWdlfHJlY3RhbmdsZXxmcmFtZSlcXGQqJC8udGVzdChjbGVhbk5hbWUpID8gY2xlYW5OYW1lIDogKHJvbGUgPT09ICdiYWNrZ3JvdW5kX2ltYWdlJyA/ICdiYWNrZ3JvdW5kX2ltYWdlJyA6IGBpbWFnZV8ke2xheWVySW5kZXh9YCk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIChub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYnV0dG9uJykgfHwgbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2J0bicpIHx8IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjdGEnKSkgJiZcbiAgICAgIChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcpXG4gICAgKSB7XG4gICAgICByb2xlID0gJ2J1dHRvbic7XG4gICAgICBuYW1lID0gbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpLnJlcGxhY2UoL1teYS16MC05X10vZywgJycpIHx8ICdidXR0b24nO1xuICAgIH1cblxuICAgIGlmIChyb2xlKSB7XG4gICAgICBsYXllcnMucHVzaCh7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIHJvbGUsXG4gICAgICAgIHR5cGU6IG5vZGUudHlwZSxcbiAgICAgICAgYm91bmRzOiByZWxCb3VuZHMsXG4gICAgICAgIHpJbmRleDogbGF5ZXJJbmRleCxcbiAgICAgICAgb3ZlcmxhcHM6IFtdLCAvLyBmaWxsZWQgaW4gZGV0ZWN0Q29tcG9zaXRpb25cbiAgICAgIH0pO1xuICAgICAgbGF5ZXJJbmRleCsrO1xuICAgIH1cblxuICAgIC8vIFJlY3Vyc2UgKHNraXAgYnV0dG9uIGFuZCBpY29uIGludGVybmFscyBcdTIwMTQgaWNvbiBjaGlsZHJlbiBhcmUgdmVjdG9yXG4gICAgLy8gcGF0aHMgdGhhdCBhbHJlYWR5IGV4cG9ydGVkIGFzIG9uZSBjb21wb3NlZCBTVkcpXG4gICAgaWYgKHJvbGUgIT09ICdidXR0b24nICYmIHJvbGUgIT09ICdpY29uJyAmJiAnY2hpbGRyZW4nIGluIG5vZGUgJiYgZGVwdGggPCA2KSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgd2FsayhjaGlsZCwgZGVwdGggKyAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICgnY2hpbGRyZW4nIGluIHNlY3Rpb25Ob2RlKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiAoc2VjdGlvbk5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgIHdhbGsoY2hpbGQsIDApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsYXllcnM7XG59XG5cbi8qKlxuICogRGV0ZWN0IGNvbXBvc2l0aW9uIHBhdHRlcm5zOiB0ZXh0LW92ZXItaW1hZ2UsIGJhY2tncm91bmQgaW1hZ2VzLCBvdmVybGF5IHN0YWNraW5nLlxuICogVHdvIHJlY3RhbmdsZXMgb3ZlcmxhcCBpZiB0aGV5IHNoYXJlIGFueSBhcmVhLlxuICovXG5mdW5jdGlvbiBkZXRlY3RDb21wb3NpdGlvbihsYXllcnM6IExheWVySW5mb1tdKTogQ29tcG9zaXRpb25JbmZvIHtcbiAgY29uc3QgY29tcG9zaXRpb246IENvbXBvc2l0aW9uSW5mbyA9IHtcbiAgICBoYXNUZXh0T3ZlckltYWdlOiBmYWxzZSxcbiAgICBoYXNCYWNrZ3JvdW5kSW1hZ2U6IGZhbHNlLFxuICAgIG92ZXJsYXlFbGVtZW50czogW10sXG4gICAgc3RhY2tpbmdPcmRlcjogbGF5ZXJzLm1hcChsID0+IGwubmFtZSksXG4gIH07XG5cbiAgY29uc3QgYmdJbWFnZUxheWVycyA9IGxheWVycy5maWx0ZXIobCA9PiBsLnJvbGUgPT09ICdiYWNrZ3JvdW5kX2ltYWdlJyk7XG4gIGNvbnN0IGltYWdlTGF5ZXJzID0gbGF5ZXJzLmZpbHRlcihsID0+IGwucm9sZSA9PT0gJ2ltYWdlJyB8fCBsLnJvbGUgPT09ICdiYWNrZ3JvdW5kX2ltYWdlJyk7XG4gIGNvbnN0IHRleHRMYXllcnMgPSBsYXllcnMuZmlsdGVyKGwgPT4gbC5yb2xlID09PSAndGV4dCcpO1xuICBjb25zdCBidXR0b25MYXllcnMgPSBsYXllcnMuZmlsdGVyKGwgPT4gbC5yb2xlID09PSAnYnV0dG9uJyk7XG5cbiAgaWYgKGJnSW1hZ2VMYXllcnMubGVuZ3RoID4gMCkge1xuICAgIGNvbXBvc2l0aW9uLmhhc0JhY2tncm91bmRJbWFnZSA9IHRydWU7XG4gIH1cblxuICAvLyBDaGVjayBmb3IgYm91bmRpbmcgYm94IG92ZXJsYXBzIGJldHdlZW4gdGV4dC9idXR0b25zIGFuZCBpbWFnZXNcbiAgZm9yIChjb25zdCB0ZXh0TGF5ZXIgb2YgWy4uLnRleHRMYXllcnMsIC4uLmJ1dHRvbkxheWVyc10pIHtcbiAgICBmb3IgKGNvbnN0IGltZ0xheWVyIG9mIGltYWdlTGF5ZXJzKSB7XG4gICAgICBjb25zdCB0YiA9IHRleHRMYXllci5ib3VuZHM7XG4gICAgICBjb25zdCBpYiA9IGltZ0xheWVyLmJvdW5kcztcblxuICAgICAgLy8gQ2hlY2sgcmVjdGFuZ2xlIG92ZXJsYXBcbiAgICAgIGNvbnN0IG92ZXJsYXBzSG9yaXpvbnRhbGx5ID0gdGIueCA8IGliLnggKyBpYi53aWR0aCAmJiB0Yi54ICsgdGIud2lkdGggPiBpYi54O1xuICAgICAgY29uc3Qgb3ZlcmxhcHNWZXJ0aWNhbGx5ID0gdGIueSA8IGliLnkgKyBpYi5oZWlnaHQgJiYgdGIueSArIHRiLmhlaWdodCA+IGliLnk7XG5cbiAgICAgIGlmIChvdmVybGFwc0hvcml6b250YWxseSAmJiBvdmVybGFwc1ZlcnRpY2FsbHkpIHtcbiAgICAgICAgLy8gVGV4dC9idXR0b24gb3ZlcmxhcHMgd2l0aCBpbWFnZVxuICAgICAgICB0ZXh0TGF5ZXIub3ZlcmxhcHMucHVzaChpbWdMYXllci5uYW1lKTtcbiAgICAgICAgaW1nTGF5ZXIub3ZlcmxhcHMucHVzaCh0ZXh0TGF5ZXIubmFtZSk7XG5cbiAgICAgICAgaWYgKCFjb21wb3NpdGlvbi5oYXNUZXh0T3ZlckltYWdlKSB7XG4gICAgICAgICAgY29tcG9zaXRpb24uaGFzVGV4dE92ZXJJbWFnZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFbGVtZW50cyB3aXRoIGhpZ2hlciB6SW5kZXggdGhhdCBvdmVybGFwIGltYWdlcyBhcmUgb3ZlcmxheXNcbiAgICAgICAgaWYgKHRleHRMYXllci56SW5kZXggPiBpbWdMYXllci56SW5kZXgpIHtcbiAgICAgICAgICBpZiAoIWNvbXBvc2l0aW9uLm92ZXJsYXlFbGVtZW50cy5pbmNsdWRlcyh0ZXh0TGF5ZXIubmFtZSkpIHtcbiAgICAgICAgICAgIGNvbXBvc2l0aW9uLm92ZXJsYXlFbGVtZW50cy5wdXNoKHRleHRMYXllci5uYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBJZiB0aGVyZSdzIGEgYmFja2dyb3VuZCBpbWFnZSwgQUxMIG5vbi1iYWNrZ3JvdW5kIGVsZW1lbnRzIGFyZSBvdmVybGF5c1xuICBpZiAoY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlKSB7XG4gICAgZm9yIChjb25zdCBsYXllciBvZiBsYXllcnMpIHtcbiAgICAgIGlmIChsYXllci5yb2xlICE9PSAnYmFja2dyb3VuZF9pbWFnZScgJiYgIWNvbXBvc2l0aW9uLm92ZXJsYXlFbGVtZW50cy5pbmNsdWRlcyhsYXllci5uYW1lKSkge1xuICAgICAgICBjb21wb3NpdGlvbi5vdmVybGF5RWxlbWVudHMucHVzaChsYXllci5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29tcG9zaXRpb247XG59XG5cbi8qKlxuICogRGV0ZWN0IGlmIGEgc2VjdGlvbiBjb250YWlucyBmb3JtLWxpa2UgZWxlbWVudHMuXG4gKiBMb29rcyBmb3IgcGF0dGVybnM6IGlucHV0IHJlY3RhbmdsZXMgKG5hcnJvdyBoZWlnaHQgZnJhbWVzKSwgbGFiZWxzIChzbWFsbCB0ZXh0IG5lYXIgaW5wdXRzKSxcbiAqIHN1Ym1pdCBidXR0b25zLCBhbmQgY29tbW9uIGZvcm0tcmVsYXRlZCBsYXllciBuYW1lcy5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Rm9ybVNlY3Rpb24oc2VjdGlvbk5vZGU6IFNjZW5lTm9kZSk6IHsgaXNGb3JtOiBib29sZWFuOyBmaWVsZHM6IEZvcm1GaWVsZEluZm9bXSB9IHtcbiAgY29uc3QgZm9ybUtleXdvcmRzID0gWydmb3JtJywgJ2lucHV0JywgJ2ZpZWxkJywgJ2NvbnRhY3QnLCAnc3Vic2NyaWJlJywgJ25ld3NsZXR0ZXInLCAnc2lnbnVwJywgJ3NpZ24tdXAnLCAnZW5xdWlyeScsICdpbnF1aXJ5J107XG4gIGNvbnN0IGlucHV0S2V5d29yZHMgPSBbJ2lucHV0JywgJ2ZpZWxkJywgJ3RleHQtZmllbGQnLCAndGV4dGZpZWxkJywgJ3RleHRfZmllbGQnLCAnZW1haWwnLCAncGhvbmUnLCAnbmFtZScsICdtZXNzYWdlJywgJ3RleHRhcmVhJ107XG4gIGNvbnN0IHN1Ym1pdEtleXdvcmRzID0gWydzdWJtaXQnLCAnc2VuZCcsICdidXR0b24nLCAnY3RhJywgJ2J0biddO1xuXG4gIGNvbnN0IHNlY3Rpb25OYW1lID0gc2VjdGlvbk5vZGUubmFtZS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBuYW1lSGludHNGb3JtID0gZm9ybUtleXdvcmRzLnNvbWUoa3cgPT4gc2VjdGlvbk5hbWUuaW5jbHVkZXMoa3cpKTtcblxuICBsZXQgaW5wdXRDb3VudCA9IDA7XG4gIGxldCBoYXNTdWJtaXRCdXR0b24gPSBmYWxzZTtcbiAgY29uc3QgZmllbGRzOiBGb3JtRmllbGRJbmZvW10gPSBbXTtcbiAgY29uc3QgdGV4dE5vZGVzOiB7IG5hbWU6IHN0cmluZzsgdGV4dDogc3RyaW5nOyB5OiBudW1iZXIgfVtdID0gW107XG4gIGNvbnN0IGlucHV0Tm9kZXM6IHsgbmFtZTogc3RyaW5nOyB5OiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH1bXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgY29uc3QgbmFtZSA9IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgLy8gRGV0ZWN0IGlucHV0LWxpa2UgZnJhbWVzOiBuYXJyb3cgaGVpZ2h0ICgzMC02MHB4KSwgd2lkZXIgdGhhbiB0YWxsLCB3aXRoIGJvcmRlci9maWxsXG4gICAgaWYgKChub2RlLnR5cGUgPT09ICdGUkFNRScgfHwgbm9kZS50eXBlID09PSAnSU5TVEFOQ0UnIHx8IG5vZGUudHlwZSA9PT0gJ0NPTVBPTkVOVCcgfHwgbm9kZS50eXBlID09PSAnUkVDVEFOR0xFJykgJiYgbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICBjb25zdCBiID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICAgICAgY29uc3QgaXNJbnB1dFNoYXBlID0gYi5oZWlnaHQgPj0gMzAgJiYgYi5oZWlnaHQgPD0gNzAgJiYgYi53aWR0aCA+IGIuaGVpZ2h0ICogMjtcbiAgICAgIGNvbnN0IGhhc0lucHV0TmFtZSA9IGlucHV0S2V5d29yZHMuc29tZShrdyA9PiBuYW1lLmluY2x1ZGVzKGt3KSk7XG5cbiAgICAgIGlmIChpc0lucHV0U2hhcGUgJiYgKGhhc0lucHV0TmFtZSB8fCBuYW1lSGludHNGb3JtKSkge1xuICAgICAgICBpbnB1dENvdW50Kys7XG4gICAgICAgIGlucHV0Tm9kZXMucHVzaCh7IG5hbWU6IG5vZGUubmFtZSwgeTogYi55LCBoZWlnaHQ6IGIuaGVpZ2h0IH0pO1xuXG4gICAgICAgIC8vIERldGVjdCBmaWVsZCB0eXBlIGZyb20gbmFtZVxuICAgICAgICBsZXQgZmllbGRUeXBlOiBGb3JtRmllbGRJbmZvWyd0eXBlJ10gPSAndGV4dCc7XG4gICAgICAgIGlmIChuYW1lLmluY2x1ZGVzKCdlbWFpbCcpKSBmaWVsZFR5cGUgPSAnZW1haWwnO1xuICAgICAgICBlbHNlIGlmIChuYW1lLmluY2x1ZGVzKCdwaG9uZScpIHx8IG5hbWUuaW5jbHVkZXMoJ3RlbCcpKSBmaWVsZFR5cGUgPSAncGhvbmUnO1xuICAgICAgICBlbHNlIGlmIChuYW1lLmluY2x1ZGVzKCd0ZXh0YXJlYScpIHx8IG5hbWUuaW5jbHVkZXMoJ21lc3NhZ2UnKSB8fCAoYi5oZWlnaHQgPiA4MCkpIGZpZWxkVHlwZSA9ICd0ZXh0YXJlYSc7XG4gICAgICAgIGVsc2UgaWYgKG5hbWUuaW5jbHVkZXMoJ3NlbGVjdCcpIHx8IG5hbWUuaW5jbHVkZXMoJ2Ryb3Bkb3duJykpIGZpZWxkVHlwZSA9ICdzZWxlY3QnO1xuICAgICAgICBlbHNlIGlmIChuYW1lLmluY2x1ZGVzKCdjaGVja2JveCcpIHx8IG5hbWUuaW5jbHVkZXMoJ2NoZWNrJykpIGZpZWxkVHlwZSA9ICdjaGVja2JveCc7XG4gICAgICAgIGVsc2UgaWYgKG5hbWUuaW5jbHVkZXMoJ3JhZGlvJykpIGZpZWxkVHlwZSA9ICdyYWRpbyc7XG5cbiAgICAgICAgZmllbGRzLnB1c2goe1xuICAgICAgICAgIGxhYmVsOiBub2RlLm5hbWUucmVwbGFjZSgvWy1fXS9nLCAnICcpLnJlcGxhY2UoL1xcYlxcdy9nLCBjID0+IGMudG9VcHBlckNhc2UoKSksXG4gICAgICAgICAgdHlwZTogZmllbGRUeXBlLFxuICAgICAgICAgIHJlcXVpcmVkOiBuYW1lLmluY2x1ZGVzKCdyZXF1aXJlZCcpIHx8IG5hbWUuaW5jbHVkZXMoJyonKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIERldGVjdCBzdWJtaXQgYnV0dG9uc1xuICAgICAgaWYgKHN1Ym1pdEtleXdvcmRzLnNvbWUoa3cgPT4gbmFtZS5pbmNsdWRlcyhrdykpICYmIGIuaGVpZ2h0ID49IDMwICYmIGIuaGVpZ2h0IDw9IDcwKSB7XG4gICAgICAgIGhhc1N1Ym1pdEJ1dHRvbiA9IHRydWU7XG4gICAgICAgIGlmICghZmllbGRzLmZpbmQoZiA9PiBmLnR5cGUgPT09ICdzdWJtaXQnKSkge1xuICAgICAgICAgIGZpZWxkcy5wdXNoKHsgbGFiZWw6ICdTdWJtaXQnLCB0eXBlOiAnc3VibWl0JywgcmVxdWlyZWQ6IGZhbHNlIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29sbGVjdCB0ZXh0IG5vZGVzIG5lYXIgaW5wdXRzIGFzIHBvdGVudGlhbCBsYWJlbHNcbiAgICBpZiAobm9kZS50eXBlID09PSAnVEVYVCcgJiYgbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94KSB7XG4gICAgICB0ZXh0Tm9kZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgdGV4dDogbm9kZS5jaGFyYWN0ZXJzIHx8ICcnLFxuICAgICAgICB5OiBub2RlLmFic29sdXRlQm91bmRpbmdCb3gueSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudmlzaWJsZSAhPT0gZmFsc2UpIHdhbGsoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdhbGsoc2VjdGlvbk5vZGUpO1xuXG4gIC8vIE1hdGNoIGxhYmVscyB0byBmaWVsZHM6IHRleHQgbm9kZSBkaXJlY3RseSBhYm92ZSBhbiBpbnB1dCAod2l0aGluIDMwcHgpXG4gIGZvciAoY29uc3QgZmllbGQgb2YgZmllbGRzKSB7XG4gICAgY29uc3QgZmllbGRJbnB1dCA9IGlucHV0Tm9kZXMuZmluZChpbnAgPT4gaW5wLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhmaWVsZC5sYWJlbC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyAvZywgJ18nKSkpO1xuICAgIGlmIChmaWVsZElucHV0KSB7XG4gICAgICBjb25zdCBsYWJlbEFib3ZlID0gdGV4dE5vZGVzLmZpbmQodCA9PiB0LnkgPCBmaWVsZElucHV0LnkgJiYgKGZpZWxkSW5wdXQueSAtIHQueSkgPCA0MCk7XG4gICAgICBpZiAobGFiZWxBYm92ZSkge1xuICAgICAgICBmaWVsZC5sYWJlbCA9IGxhYmVsQWJvdmUudGV4dC5yZXBsYWNlKCcqJywgJycpLnRyaW0oKTtcbiAgICAgICAgaWYgKGxhYmVsQWJvdmUudGV4dC5pbmNsdWRlcygnKicpKSBmaWVsZC5yZXF1aXJlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgaXNGb3JtID0gKGlucHV0Q291bnQgPj0gMiAmJiBoYXNTdWJtaXRCdXR0b24pIHx8IChuYW1lSGludHNGb3JtICYmIGlucHV0Q291bnQgPj0gMSk7XG5cbiAgcmV0dXJuIHsgaXNGb3JtLCBmaWVsZHM6IGlzRm9ybSA/IGZpZWxkcyA6IFtdIH07XG59XG5cbi8qKlxuICogUGFyc2UgYWxsIHNlY3Rpb25zIGZyb20gYSBwYWdlIGZyYW1lIGFuZCBwcm9kdWNlIFNlY3Rpb25TcGVjIG9iamVjdHMuXG4gKi9cbi8qKlxuICogRXh0cmFjdCBldmVyeSBURVhUIG5vZGUgaW4gYSBzZWN0aW9uIGluIHJlYWRpbmcgb3JkZXIgKHRvcC10by1ib3R0b20sXG4gKiB0aGVuIGxlZnQtdG8tcmlnaHQgZm9yIGl0ZW1zIG9uIHRoZSBzYW1lIHJvdyB3aXRoaW4gYSAxMnB4IHRvbGVyYW5jZSkuXG4gKlxuICogVGhpcyBpcyB0aGUgY29udGVudCBzb3VyY2UgZm9yIHBhZ2UtYXNzZW1ibGVyIHdoZW4gZGVzaWduZXJzIGRvbid0IG5hbWVcbiAqIGxheWVycyBjb25zaXN0ZW50bHkuIEl0IHByZXNlcnZlcyBldmVyeSB2aXNpYmxlIHRleHQgZnJvbSB0aGUgRmlnbWEgZGVzaWduXG4gKiBzbyBub3RoaW5nIGNhbiBiZSBzaWxlbnRseSBkcm9wcGVkIGR1cmluZyBBQ0YgcG9wdWxhdGlvbi5cbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFRleHRDb250ZW50SW5PcmRlcihzZWN0aW9uTm9kZTogU2NlbmVOb2RlKTogVGV4dENvbnRlbnRFbnRyeVtdIHtcbiAgY29uc3Qgc2VjdGlvbkJvdW5kcyA9IHNlY3Rpb25Ob2RlLmFic29sdXRlQm91bmRpbmdCb3g7XG4gIGlmICghc2VjdGlvbkJvdW5kcykgcmV0dXJuIFtdO1xuXG4gIHR5cGUgUmF3VGV4dCA9IHsgbm9kZTogVGV4dE5vZGU7IHJlbFk6IG51bWJlcjsgcmVsWDogbnVtYmVyOyBmb250U2l6ZTogbnVtYmVyIH07XG4gIGNvbnN0IGNvbGxlY3RlZDogUmF3VGV4dFtdID0gW107XG5cbiAgZnVuY3Rpb24gd2Fsayhub2RlOiBTY2VuZU5vZGUsIGRlcHRoOiBudW1iZXIpIHtcbiAgICBpZiAobm9kZS52aXNpYmxlID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIGlmIChkZXB0aCA+IDgpIHJldHVybjtcblxuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc3QgdCA9IG5vZGUgYXMgVGV4dE5vZGU7XG4gICAgICBjb25zdCBjaGFycyA9IHQuY2hhcmFjdGVycyB8fCAnJztcbiAgICAgIGlmICghY2hhcnMudHJpbSgpKSByZXR1cm47IC8vIHNraXAgZW1wdHkgdGV4dCBub2Rlc1xuICAgICAgY29uc3QgYmIgPSB0LmFic29sdXRlQm91bmRpbmdCb3g7XG4gICAgICBpZiAoIWJiKSByZXR1cm47XG4gICAgICBjb25zdCBmcyA9IHQuZm9udFNpemUgIT09IGZpZ21hLm1peGVkID8gKHQuZm9udFNpemUgYXMgbnVtYmVyKSA6IDE2O1xuICAgICAgY29sbGVjdGVkLnB1c2goe1xuICAgICAgICBub2RlOiB0LFxuICAgICAgICByZWxZOiBiYi55IC0gc2VjdGlvbkJvdW5kcyEueSxcbiAgICAgICAgcmVsWDogYmIueCAtIHNlY3Rpb25Cb3VuZHMhLngsXG4gICAgICAgIGZvbnRTaXplOiBmcyxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuOyAvLyBkb24ndCByZWN1cnNlIGludG8gVEVYVFxuICAgIH1cblxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkLCBkZXB0aCArIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICgnY2hpbGRyZW4nIGluIHNlY3Rpb25Ob2RlKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiAoc2VjdGlvbk5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgd2FsayhjaGlsZCwgMCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVhZGluZyBvcmRlcjogc29ydCBieSBZIChyb3dzKSwgdGhlbiBieSBYIHdpdGhpbiBzYW1lIHJvdyAoMTJweCB0b2xlcmFuY2UpLlxuICBjb2xsZWN0ZWQuc29ydCgoYSwgYikgPT4ge1xuICAgIGlmIChNYXRoLmFicyhhLnJlbFkgLSBiLnJlbFkpIDwgMTIpIHJldHVybiBhLnJlbFggLSBiLnJlbFg7XG4gICAgcmV0dXJuIGEucmVsWSAtIGIucmVsWTtcbiAgfSk7XG5cbiAgLy8gUm9sZSBhc3NpZ25tZW50IFx1MjAxNCB0b3AtbW9zdCBsYXJnZXN0IHRleHQgaXMgJ2hlYWRpbmcnLCBzZWNvbmQgaXMgJ3N1YmhlYWRpbmcnLFxuICAvLyBzbWFsbCBzaG9ydCB0ZXh0cyBuZWFyIGJ1dHRvbnMgYXJlICdidXR0b25fdGV4dCcsIHJlc3QgYXJlICdib2R5JyBvciAndGV4dF9OJy5cbiAgbGV0IGhlYWRpbmdBc3NpZ25lZCA9IGZhbHNlO1xuICBsZXQgc3ViaGVhZGluZ0Fzc2lnbmVkID0gZmFsc2U7XG5cbiAgcmV0dXJuIGNvbGxlY3RlZC5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgIGNvbnN0IHRleHQgPSBpdGVtLm5vZGUuY2hhcmFjdGVycyB8fCAnJztcbiAgICBjb25zdCBjbGVhbk5hbWUgPSBpdGVtLm5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJ18nKS5yZXBsYWNlKC9bXmEtejAtOV9dL2csICcnKTtcbiAgICBjb25zdCBuYW1lSGludCA9IGNsZWFuTmFtZSB8fCAnJztcblxuICAgIGxldCByb2xlOiBzdHJpbmc7XG4gICAgaWYgKG5hbWVIaW50LmluY2x1ZGVzKCdidXR0b24nKSB8fCBuYW1lSGludC5pbmNsdWRlcygnY3RhJykgfHwgbmFtZUhpbnQuaW5jbHVkZXMoJ2J0bicpKSB7XG4gICAgICByb2xlID0gJ2J1dHRvbl90ZXh0JztcbiAgICB9IGVsc2UgaWYgKCFoZWFkaW5nQXNzaWduZWQgJiYgaXRlbS5mb250U2l6ZSA+PSAyOCkge1xuICAgICAgcm9sZSA9ICdoZWFkaW5nJztcbiAgICAgIGhlYWRpbmdBc3NpZ25lZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmICghc3ViaGVhZGluZ0Fzc2lnbmVkICYmIGl0ZW0uZm9udFNpemUgPj0gMTggJiYgaXRlbS5mb250U2l6ZSA8IDI4KSB7XG4gICAgICByb2xlID0gJ3N1YmhlYWRpbmcnO1xuICAgICAgc3ViaGVhZGluZ0Fzc2lnbmVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGl0ZW0uZm9udFNpemUgPD0gMTMgfHwgKG5hbWVIaW50LmluY2x1ZGVzKCdjYXB0aW9uJykgfHwgbmFtZUhpbnQuaW5jbHVkZXMoJ2V5ZWJyb3cnKSB8fCBuYW1lSGludC5pbmNsdWRlcygndGFnJykpKSB7XG4gICAgICByb2xlID0gJ2NhcHRpb24nO1xuICAgIH0gZWxzZSBpZiAodGV4dC5sZW5ndGggPCAzMCAmJiBpdGVtLmZvbnRTaXplIDw9IDE2KSB7XG4gICAgICAvLyBTaG9ydCwgc21hbGwgXHUyMDE0IGxpa2VseSBhIGxpbmsgb3IgbGFiZWxcbiAgICAgIHJvbGUgPSAnbGFiZWwnO1xuICAgIH0gZWxzZSB7XG4gICAgICByb2xlID0gYGJvZHlfJHtpZHh9YDtcbiAgICB9XG5cbiAgICBjb25zdCBiYiA9IGl0ZW0ubm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94ITtcbiAgICByZXR1cm4ge1xuICAgICAgaW5kZXg6IGlkeCxcbiAgICAgIHRleHQsXG4gICAgICByb2xlLFxuICAgICAgbGF5ZXJOYW1lOiBpdGVtLm5vZGUubmFtZSxcbiAgICAgIGZvbnRTaXplOiBNYXRoLnJvdW5kKGl0ZW0uZm9udFNpemUpLFxuICAgICAgYm91bmRzOiB7XG4gICAgICAgIHg6IE1hdGgucm91bmQoaXRlbS5yZWxYKSxcbiAgICAgICAgeTogTWF0aC5yb3VuZChpdGVtLnJlbFkpLFxuICAgICAgICB3aWR0aDogTWF0aC5yb3VuZChiYi53aWR0aCksXG4gICAgICAgIGhlaWdodDogTWF0aC5yb3VuZChiYi5oZWlnaHQpLFxuICAgICAgfSxcbiAgICB9O1xuICB9KTtcbn1cblxuLyoqXG4gKiBQYXJzZSBzZWN0aW9ucyBmcm9tIGEgcGFnZSBmcmFtZS5cbiAqXG4gKiBAcGFyYW0gcGFnZUZyYW1lIFRoZSB0b3AtbGV2ZWwgcGFnZSBmcmFtZSB0byB3YWxrLlxuICogQHBhcmFtIGljb25NYXAgTWFwPG5vZGVJZCwgc3ZnRmlsZW5hbWU+IGZyb20gaWNvbi1kZXRlY3Rvci4gU2VjdGlvblxuICogICAgICAgICAgICAgICAgZWxlbWVudHMgdGhhdCBtYXRjaCBhbiBpY29uIHJvb3QgcmVjZWl2ZSBhbiBgaWNvbkZpbGVgXG4gKiAgICAgICAgICAgICAgICBwb2ludGluZyBhdCB0aGUgc2FtZSBmaWxlbmFtZSBpbWFnZS1leHBvcnRlciB3cml0ZXMuXG4gKiBAcGFyYW0gZ2xvYmFsTmFtZXMgT3B0aW9uYWwgc2V0IG9mIG5vcm1hbGl6ZWQgc2VjdGlvbiBuYW1lcyB0aGF0IGFwcGVhciBvblxuICogICAgICAgICAgICAgICAgICAgIFx1MjI2NTIgc2VsZWN0ZWQgcGFnZXMuIFdoZW4gcHJvdmlkZWQsIG1hdGNoaW5nIHNlY3Rpb25zIGFyZVxuICogICAgICAgICAgICAgICAgICAgIG1hcmtlZCBgaXNHbG9iYWw6IHRydWVgIHNvIHRoZSBhZ2VudCBjYW4gcHJvbW90ZSB0aGVtIHRvXG4gKiAgICAgICAgICAgICAgICAgICAgc2hhcmVkIFdQIHRoZW1lIHBhcnRzIGluc3RlYWQgb2YgZHVwbGljYXRpbmcgcGVyLXBhZ2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNlY3Rpb25zKFxuICBwYWdlRnJhbWU6IEZyYW1lTm9kZSxcbiAgaWNvbk1hcDogTWFwPHN0cmluZywgc3RyaW5nPixcbiAgaW1hZ2VNYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4gIGdsb2JhbE5hbWVzPzogU2V0PHN0cmluZz4sXG4pOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4ge1xuICBjb25zdCBzZWN0aW9uTm9kZXMgPSBpZGVudGlmeVNlY3Rpb25zKHBhZ2VGcmFtZSk7XG4gIGNvbnN0IHNwZWNzOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4gPSB7fTtcblxuICBsZXQgcHJldkJvdHRvbSA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWN0aW9uTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlID0gc2VjdGlvbk5vZGVzW2ldO1xuICAgIGNvbnN0IGJvdW5kcyA9IG5vZGUuYWJzb2x1dGVCb3VuZGluZ0JveDtcbiAgICBpZiAoIWJvdW5kcykgY29udGludWU7XG5cbiAgICBjb25zdCBsYXlvdXROYW1lID0gdG9MYXlvdXROYW1lKG5vZGUubmFtZSk7XG4gICAgY29uc3QgaXNGcmFtZSA9IG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyB8fCBub2RlLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IG5vZGUudHlwZSA9PT0gJ0lOU1RBTkNFJztcbiAgICBjb25zdCBmcmFtZSA9IGlzRnJhbWUgPyAobm9kZSBhcyBGcmFtZU5vZGUpIDogbnVsbDtcblxuICAgIC8vIERldGVybWluZSBzcGFjaW5nIHNvdXJjZSBhbmQgZXh0cmFjdCBzcGFjaW5nXG4gICAgY29uc3QgaGFzQXV0b0xheW91dCA9IGZyYW1lPy5sYXlvdXRNb2RlICYmIGZyYW1lLmxheW91dE1vZGUgIT09ICdOT05FJztcbiAgICBsZXQgc3BhY2luZ1NvdXJjZTogJ2F1dG8tbGF5b3V0JyB8ICdhYnNvbHV0ZS1jb29yZGluYXRlcyc7XG4gICAgbGV0IHNlY3Rpb25TdHlsZXM6IFBhcnRpYWw8U2VjdGlvblN0eWxlcz47XG4gICAgbGV0IGl0ZW1TcGFjaW5nOiBzdHJpbmcgfCBudWxsO1xuXG4gICAgaWYgKGhhc0F1dG9MYXlvdXQgJiYgZnJhbWUpIHtcbiAgICAgIGNvbnN0IHNwYWNpbmcgPSBleHRyYWN0QXV0b0xheW91dFNwYWNpbmcoZnJhbWUpO1xuICAgICAgc3BhY2luZ1NvdXJjZSA9IHNwYWNpbmcuc3BhY2luZ1NvdXJjZTtcbiAgICAgIHNlY3Rpb25TdHlsZXMgPSBzcGFjaW5nLnNlY3Rpb25TdHlsZXM7XG4gICAgICBpdGVtU3BhY2luZyA9IHNwYWNpbmcuaXRlbVNwYWNpbmc7XG4gICAgfSBlbHNlIGlmIChmcmFtZSkge1xuICAgICAgY29uc3Qgc3BhY2luZyA9IGV4dHJhY3RBYnNvbHV0ZVNwYWNpbmcoZnJhbWUpO1xuICAgICAgc3BhY2luZ1NvdXJjZSA9IHNwYWNpbmcuc3BhY2luZ1NvdXJjZTtcbiAgICAgIHNlY3Rpb25TdHlsZXMgPSBzcGFjaW5nLnNlY3Rpb25TdHlsZXM7XG4gICAgICBpdGVtU3BhY2luZyA9IHNwYWNpbmcuaXRlbVNwYWNpbmc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNwYWNpbmdTb3VyY2UgPSAnYWJzb2x1dGUtY29vcmRpbmF0ZXMnO1xuICAgICAgc2VjdGlvblN0eWxlcyA9IHt9O1xuICAgICAgaXRlbVNwYWNpbmcgPSBudWxsO1xuICAgIH1cblxuICAgIC8vIEJhc2Ugc2VjdGlvbiBzdHlsZXMgKGJhY2tncm91bmQsIGdyYWRpZW50LCBldGMuKVxuICAgIGNvbnN0IGJhc2VTdHlsZXMgPSBleHRyYWN0U2VjdGlvblN0eWxlcyhub2RlLCBpbWFnZU1hcCk7XG4gICAgY29uc3QgbWVyZ2VkU3R5bGVzOiBTZWN0aW9uU3R5bGVzID0ge1xuICAgICAgLi4uYmFzZVN0eWxlcyxcbiAgICAgIC4uLnNlY3Rpb25TdHlsZXMsXG4gICAgfTtcblxuICAgIC8vIEVsZW1lbnRzXG4gICAgY29uc3QgZWxlbWVudHMgPSBleHRyYWN0RWxlbWVudHMobm9kZSwgaWNvbk1hcCwgaW1hZ2VNYXApO1xuXG4gICAgLy8gR3JpZCBkZXRlY3Rpb25cbiAgICBjb25zdCBncmlkID0gZnJhbWUgPyBkZXRlY3RHcmlkKGZyYW1lKSA6IHtcbiAgICAgIGxheW91dE1vZGU6ICdhYnNvbHV0ZScgYXMgY29uc3QsXG4gICAgICBjb2x1bW5zOiAxLFxuICAgICAgZ2FwOiBpdGVtU3BhY2luZyxcbiAgICAgIHJvd0dhcDogbnVsbCxcbiAgICAgIGNvbHVtbkdhcDogbnVsbCxcbiAgICAgIGl0ZW1NaW5XaWR0aDogbnVsbCxcbiAgICB9O1xuXG4gICAgLy8gRW5zdXJlIGdyaWQgZ2FwIGlzIHNldCBmcm9tIGl0ZW1TcGFjaW5nIGlmIG5vdCBhbHJlYWR5XG4gICAgaWYgKCFncmlkLmdhcCAmJiBpdGVtU3BhY2luZykge1xuICAgICAgZ3JpZC5nYXAgPSBpdGVtU3BhY2luZztcbiAgICB9XG5cbiAgICAvLyBPdmVybGFwIGRldGVjdGlvblxuICAgIGxldCBvdmVybGFwOiBPdmVybGFwSW5mbyB8IG51bGwgPSBudWxsO1xuICAgIGlmIChpID4gMCkge1xuICAgICAgY29uc3Qgb3ZlcmxhcFB4ID0gcHJldkJvdHRvbSAtIGJvdW5kcy55O1xuICAgICAgaWYgKG92ZXJsYXBQeCA+IDApIHtcbiAgICAgICAgb3ZlcmxhcCA9IHtcbiAgICAgICAgICB3aXRoU2VjdGlvbjogc2VjdGlvbk5vZGVzW2kgLSAxXS5uYW1lLFxuICAgICAgICAgIHBpeGVsczogTWF0aC5yb3VuZChvdmVybGFwUHgpLFxuICAgICAgICAgIGNzc01hcmdpblRvcDogYC0ke01hdGgucm91bmQob3ZlcmxhcFB4KX1weGAsXG4gICAgICAgICAgcmVxdWlyZXNaSW5kZXg6IHRydWUsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSW50ZXJhY3Rpb25zXG4gICAgY29uc3QgaW50ZXJhY3Rpb25zID0gZXh0cmFjdEludGVyYWN0aW9ucyhub2RlKTtcblxuICAgIC8vIExheWVyIGNvbXBvc2l0aW9uIGFuYWx5c2lzXG4gICAgY29uc3QgbGF5ZXJzID0gZXh0cmFjdExheWVycyhub2RlLCBlbGVtZW50cywgaWNvbk1hcCk7XG4gICAgY29uc3QgY29tcG9zaXRpb24gPSBkZXRlY3RDb21wb3NpdGlvbihsYXllcnMpO1xuXG4gICAgLy8gRW5yaWNoIGVsZW1lbnRzIHdpdGggcG9zaXRpb24gZGF0YSBmcm9tIGNvbXBvc2l0aW9uXG4gICAgaWYgKGNvbXBvc2l0aW9uLmhhc1RleHRPdmVySW1hZ2UgfHwgY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlKSB7XG4gICAgICAvLyBTZWN0aW9uIG5lZWRzIHBvc2l0aW9uOiByZWxhdGl2ZSBmb3Igb3ZlcmxheSBjaGlsZHJlblxuICAgICAgbWVyZ2VkU3R5bGVzLm92ZXJmbG93ID0gbWVyZ2VkU3R5bGVzLm92ZXJmbG93IHx8ICdoaWRkZW4nO1xuXG4gICAgICBmb3IgKGNvbnN0IFtlbGVtTmFtZSwgZWxlbVN0eWxlc10gb2YgT2JqZWN0LmVudHJpZXMoZWxlbWVudHMpKSB7XG4gICAgICAgIGlmIChjb21wb3NpdGlvbi5vdmVybGF5RWxlbWVudHMuaW5jbHVkZXMoZWxlbU5hbWUpIHx8IGNvbXBvc2l0aW9uLmhhc0JhY2tncm91bmRJbWFnZSkge1xuICAgICAgICAgIC8vIEZpbmQgbWF0Y2hpbmcgbGF5ZXIgZm9yIHBvc2l0aW9uIGRhdGFcbiAgICAgICAgICBjb25zdCBsYXllciA9IGxheWVycy5maW5kKGwgPT4gbC5uYW1lID09PSBlbGVtTmFtZSk7XG4gICAgICAgICAgaWYgKGxheWVyICYmIGxheWVyLnJvbGUgIT09ICdiYWNrZ3JvdW5kX2ltYWdlJykge1xuICAgICAgICAgICAgZWxlbVN0eWxlcy5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgICAgICBlbGVtU3R5bGVzLnpJbmRleCA9IGxheWVyLnpJbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGb3JtIGRldGVjdGlvblxuICAgIGNvbnN0IGZvcm1SZXN1bHQgPSBkZXRlY3RGb3JtU2VjdGlvbihub2RlKTtcblxuICAgIC8vIE9yZGVyZWQgdGV4dCBjb250ZW50IFx1MjAxNCBldmVyeSB0ZXh0IGluIHJlYWRpbmcgb3JkZXIgKGZvciBwYWdlLWFzc2VtYmxlciBtYXBwaW5nKVxuICAgIGNvbnN0IHRleHRDb250ZW50SW5PcmRlciA9IGV4dHJhY3RUZXh0Q29udGVudEluT3JkZXIobm9kZSk7XG5cbiAgICAvLyBQYXR0ZXJuIGRldGVjdGlvbiAoY2Fyb3VzZWwgLyBhY2NvcmRpb24gLyB0YWJzIC8gbW9kYWwpXG4gICAgbGV0IGNvbXBvbmVudFBhdHRlcm5zOiBSZXR1cm5UeXBlPHR5cGVvZiBkZXRlY3RDb21wb25lbnRQYXR0ZXJucz4gfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHAgPSBkZXRlY3RDb21wb25lbnRQYXR0ZXJucyhub2RlKTtcbiAgICAgIGlmIChwLmxlbmd0aCA+IDApIGNvbXBvbmVudFBhdHRlcm5zID0gcDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ2RldGVjdENvbXBvbmVudFBhdHRlcm5zIGZhaWxlZCBmb3Igc2VjdGlvbicsIG5vZGUubmFtZSwgZSk7XG4gICAgfVxuXG4gICAgLy8gUmVwZWF0ZXIgZGV0ZWN0aW9uIChjYXJkcyAvIGZlYXR1cmVzIC8gcHJpY2luZyAvIGV0Yy4pXG4gICAgbGV0IHJlcGVhdGVyczogUmV0dXJuVHlwZTx0eXBlb2YgZGV0ZWN0UmVwZWF0ZXJzPiB8IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGRldGVjdFJlcGVhdGVycyhub2RlKTtcbiAgICAgIGlmIChPYmplY3Qua2V5cyhyKS5sZW5ndGggPiAwKSByZXBlYXRlcnMgPSByO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignZGV0ZWN0UmVwZWF0ZXJzIGZhaWxlZCBmb3Igc2VjdGlvbicsIG5vZGUubmFtZSwgZSk7XG4gICAgfVxuXG4gICAgLy8gR2xvYmFsIGRldGVjdGlvbiAoY3Jvc3MtcGFnZSlcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplU2VjdGlvbk5hbWUobm9kZS5uYW1lKTtcbiAgICBjb25zdCBpc0dsb2JhbCA9IGdsb2JhbE5hbWVzID8gZ2xvYmFsTmFtZXMuaGFzKG5vcm1hbGl6ZWQpIDogZmFsc2U7XG4gICAgY29uc3QgZ2xvYmFsUm9sZSA9IGlzR2xvYmFsXG4gICAgICA/IGNsYXNzaWZ5R2xvYmFsUm9sZShpLCBzZWN0aW9uTm9kZXMubGVuZ3RoLCBNYXRoLnJvdW5kKGJvdW5kcy5oZWlnaHQpKVxuICAgICAgOiBudWxsO1xuXG4gICAgLy8gTmF2aWdhdGlvbiAob25seSB3b3J0aCBjb21wdXRpbmcgZm9yIGhlYWRlci9mb290ZXIgY2FuZGlkYXRlcylcbiAgICBsZXQgbmF2aWdhdGlvbjogTm9uTnVsbGFibGU8UmV0dXJuVHlwZTx0eXBlb2YgZGV0ZWN0TmF2aWdhdGlvbj4+IHwgdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBuYW1lID0gKG5vZGUubmFtZSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChpc0dsb2JhbCB8fCAvXFxiKGhlYWRlcnxmb290ZXJ8bmF2fG5hdmJhcnxuYXZpZ2F0aW9uKVxcYi8udGVzdChuYW1lKSkge1xuICAgICAgICBjb25zdCBuYXYgPSBkZXRlY3ROYXZpZ2F0aW9uKG5vZGUpO1xuICAgICAgICBpZiAobmF2KSBuYXZpZ2F0aW9uID0gbmF2O1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignZGV0ZWN0TmF2aWdhdGlvbiBmYWlsZWQgZm9yIHNlY3Rpb24nLCBub2RlLm5hbWUsIGUpO1xuICAgIH1cblxuICAgIC8vIFNlY3Rpb24gc2VtYW50aWMgcm9sZSBpbmZlcmVuY2VcbiAgICBsZXQgc2VjdGlvblR5cGU6IFJldHVyblR5cGU8dHlwZW9mIGluZmVyU2VjdGlvblR5cGU+IHwgbnVsbCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIHNlY3Rpb25UeXBlID0gaW5mZXJTZWN0aW9uVHlwZSh7XG4gICAgICAgIHNlY3Rpb25JbmRleDogaSxcbiAgICAgICAgdG90YWxTZWN0aW9uczogc2VjdGlvbk5vZGVzLmxlbmd0aCxcbiAgICAgICAgaXNGb3JtU2VjdGlvbjogZm9ybVJlc3VsdC5pc0Zvcm0sXG4gICAgICAgIHBhdHRlcm5zOiBjb21wb25lbnRQYXR0ZXJucyB8fCBbXSxcbiAgICAgICAgcmVwZWF0ZXJzOiByZXBlYXRlcnMgfHwge30sXG4gICAgICAgIGVsZW1lbnRzLFxuICAgICAgICB0ZXh0Q29udGVudEluT3JkZXIsXG4gICAgICAgIGxheWVyTmFtZTogbm9kZS5uYW1lIHx8ICcnLFxuICAgICAgICBzZWN0aW9uSGVpZ2h0OiBNYXRoLnJvdW5kKGJvdW5kcy5oZWlnaHQpLFxuICAgICAgICBpc0dsb2JhbCxcbiAgICAgICAgZ2xvYmFsUm9sZSxcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignaW5mZXJTZWN0aW9uVHlwZSBmYWlsZWQgZm9yIHNlY3Rpb24nLCBub2RlLm5hbWUsIGUpO1xuICAgIH1cblxuICAgIHNwZWNzW2xheW91dE5hbWVdID0ge1xuICAgICAgc3BhY2luZ1NvdXJjZSxcbiAgICAgIGZpZ21hTm9kZUlkOiBub2RlLmlkLFxuICAgICAgc2NyZWVuc2hvdEZpbGU6IGBzY3JlZW5zaG90cy8ke3NjcmVlbnNob3RGaWxlbmFtZShub2RlLm5hbWUpfWAsXG4gICAgICBzZWN0aW9uOiBtZXJnZWRTdHlsZXMsXG4gICAgICBlbGVtZW50cyxcbiAgICAgIGdyaWQsXG4gICAgICBpbnRlcmFjdGlvbnM6IGludGVyYWN0aW9ucy5sZW5ndGggPiAwID8gaW50ZXJhY3Rpb25zIDogdW5kZWZpbmVkLFxuICAgICAgb3ZlcmxhcCxcbiAgICAgIGxheWVyczogbGF5ZXJzLmxlbmd0aCA+IDAgPyBsYXllcnMgOiB1bmRlZmluZWQsXG4gICAgICBjb21wb3NpdGlvbjogKGNvbXBvc2l0aW9uLmhhc1RleHRPdmVySW1hZ2UgfHwgY29tcG9zaXRpb24uaGFzQmFja2dyb3VuZEltYWdlKSA/IGNvbXBvc2l0aW9uIDogdW5kZWZpbmVkLFxuICAgICAgaXNGb3JtU2VjdGlvbjogZm9ybVJlc3VsdC5pc0Zvcm0gfHwgdW5kZWZpbmVkLFxuICAgICAgZm9ybUZpZWxkczogZm9ybVJlc3VsdC5maWVsZHMubGVuZ3RoID4gMCA/IGZvcm1SZXN1bHQuZmllbGRzIDogdW5kZWZpbmVkLFxuICAgICAgdGV4dENvbnRlbnRJbk9yZGVyOiB0ZXh0Q29udGVudEluT3JkZXIubGVuZ3RoID4gMCA/IHRleHRDb250ZW50SW5PcmRlciA6IHVuZGVmaW5lZCxcbiAgICAgIGNvbXBvbmVudFBhdHRlcm5zLFxuICAgICAgaXNHbG9iYWw6IGlzR2xvYmFsIHx8IHVuZGVmaW5lZCxcbiAgICAgIGdsb2JhbFJvbGU6IGlzR2xvYmFsID8gZ2xvYmFsUm9sZSA6IHVuZGVmaW5lZCxcbiAgICAgIHNlY3Rpb25UeXBlOiBzZWN0aW9uVHlwZT8udHlwZSxcbiAgICAgIHNlY3Rpb25UeXBlQ29uZmlkZW5jZTogc2VjdGlvblR5cGU/LmNvbmZpZGVuY2UsXG4gICAgICByZXBlYXRlcnMsXG4gICAgICBuYXZpZ2F0aW9uLFxuICAgIH07XG5cbiAgICBwcmV2Qm90dG9tID0gYm91bmRzLnkgKyBib3VuZHMuaGVpZ2h0O1xuICB9XG5cbiAgcmV0dXJuIHNwZWNzO1xufVxuIiwgImltcG9ydCB7IEltYWdlRXhwb3J0VGFzaywgSW1hZ2VNYXAsIEltYWdlTWFwRW50cnksIEZhaWxlZEV4cG9ydCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgc2x1Z2lmeSwgc2NyZWVuc2hvdEZpbGVuYW1lIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBoYXNJbWFnZUZpbGwgfSBmcm9tICcuL2NvbG9yJztcblxuY29uc3QgQkFUQ0hfU0laRSA9IDEwO1xuXG4vKipcbiAqIElkZW50aWZ5IHNlY3Rpb24tbGV2ZWwgY2hpbGRyZW4sIG1hdGNoaW5nIHRoZSBzYW1lIGxvZ2ljIGFzIHNlY3Rpb24tcGFyc2VyLnRzLlxuICogSWYgdGhlIGZyYW1lIGhhcyBhIHNpbmdsZSB3cmFwcGVyIGNoaWxkLCBkcmlsbCBvbmUgbGV2ZWwgZGVlcGVyLlxuICovXG5mdW5jdGlvbiBpZGVudGlmeVNlY3Rpb25Ob2RlcyhwYWdlRnJhbWU6IEZyYW1lTm9kZSk6IFNjZW5lTm9kZVtdIHtcbiAgbGV0IGNhbmRpZGF0ZXMgPSBwYWdlRnJhbWUuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpICYmXG4gICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94ICYmXG4gICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94LmhlaWdodCA+IDUwXG4gICk7XG5cbiAgLy8gSWYgdGhlcmUncyBhIHNpbmdsZSBjb250YWluZXIgY2hpbGQsIGRyaWxsIG9uZSBsZXZlbCBkZWVwZXIgKG1hdGNoZXMgc2VjdGlvbi1wYXJzZXIudHMpXG4gIGlmIChjYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSAmJiAnY2hpbGRyZW4nIGluIGNhbmRpZGF0ZXNbMF0pIHtcbiAgICBjb25zdCB3cmFwcGVyID0gY2FuZGlkYXRlc1swXSBhcyBGcmFtZU5vZGU7XG4gICAgY29uc3QgaW5uZXJDYW5kaWRhdGVzID0gd3JhcHBlci5jaGlsZHJlbi5maWx0ZXIoYyA9PlxuICAgICAgYy52aXNpYmxlICE9PSBmYWxzZSAmJlxuICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpICYmXG4gICAgICBjLmFic29sdXRlQm91bmRpbmdCb3ggJiZcbiAgICAgIGMuYWJzb2x1dGVCb3VuZGluZ0JveC5oZWlnaHQgPiA1MFxuICAgICk7XG4gICAgaWYgKGlubmVyQ2FuZGlkYXRlcy5sZW5ndGggPiAxKSB7XG4gICAgICBjYW5kaWRhdGVzID0gaW5uZXJDYW5kaWRhdGVzO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbLi4uY2FuZGlkYXRlc10uc29ydCgoYSwgYikgPT4gYS5hYnNvbHV0ZUJvdW5kaW5nQm94IS55IC0gYi5hYnNvbHV0ZUJvdW5kaW5nQm94IS55KTtcbn1cblxuLyoqXG4gKiBCdWlsZCBhIE1hcDxub2RlSWQsIGZpbGVuYW1lPiBmb3IgZXZlcnkgbm9kZSB3aXRoIGFuIElNQUdFIGZpbGwgaW4gdGhlIHBhZ2UuXG4gKlxuICogRGVkdXAgaXMgYnkgRmlnbWEncyBpbWFnZUhhc2ggc28gdHdvIGRpc3RpbmN0IHBob3RvcyB0aGF0IGhhcHBlbiB0byBzaGFyZVxuICogYSBsYXllciBuYW1lIChcIkltYWdlXCIsIFwiUmVjdGFuZ2xlIDEyXCIpIGVhY2ggZ2V0IHRoZWlyIG93biBmaWxlLCB3aGlsZVxuICogbXVsdGlwbGUgdXNhZ2VzIG9mIHRoZSBzYW1lIGJpdG1hcCBjb2xsYXBzZSB0byBhIHNpbmdsZSBleHBvcnQuXG4gKlxuICogRmlsZW5hbWUgY29sbGlzaW9ucyAoZGlmZmVyZW50IGJpdG1hcHMgc2x1Z2lmeWluZyB0byB0aGUgc2FtZSBiYXNlIG5hbWUpXG4gKiBhcmUgcmVzb2x2ZWQgd2l0aCBhIG51bWVyaWMgc3VmZml4LiBCb3RoIGltYWdlLWV4cG9ydGVyIGFuZCBzZWN0aW9uLXBhcnNlclxuICogY29uc3VtZSB0aGlzIG1hcCBzbyB0aGVpciByZWZlcmVuY2VzIHN0YXkgaW4gbG9ja3N0ZXAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEltYWdlRmlsZW5hbWVNYXAoXG4gIHBhZ2VGcmFtZTogU2NlbmVOb2RlLFxuICBpY29uUm9vdElkczogU2V0PHN0cmluZz4sXG4pOiBNYXA8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3QgcmVzdWx0ID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgY29uc3QgaGFzaFRvRmlsZW5hbWUgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBjb25zdCB1c2VkRmlsZW5hbWVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCBpbWdOb2RlIG9mIGZpbmRJbWFnZU5vZGVzKHBhZ2VGcmFtZSkpIHtcbiAgICBpZiAoaWNvblJvb3RJZHMuaGFzKGltZ05vZGUuaWQpKSBjb250aW51ZTtcbiAgICBpZiAoaXNJbnNpZGVJY29uUm9vdChpbWdOb2RlLCBpY29uUm9vdElkcykpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgaW1hZ2VIYXNoID0gZ2V0Rmlyc3RJbWFnZUhhc2goaW1nTm9kZSk7XG4gICAgbGV0IGZpbGVuYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoaW1hZ2VIYXNoICYmIGhhc2hUb0ZpbGVuYW1lLmhhcyhpbWFnZUhhc2gpKSB7XG4gICAgICBmaWxlbmFtZSA9IGhhc2hUb0ZpbGVuYW1lLmdldChpbWFnZUhhc2gpITtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYmFzZVNsdWcgPSBzbHVnaWZ5KGltZ05vZGUubmFtZSkgfHwgJ2ltYWdlJztcbiAgICAgIGZpbGVuYW1lID0gYCR7YmFzZVNsdWd9LnBuZ2A7XG4gICAgICBsZXQgaSA9IDI7XG4gICAgICB3aGlsZSAodXNlZEZpbGVuYW1lcy5oYXMoZmlsZW5hbWUpKSB7XG4gICAgICAgIGZpbGVuYW1lID0gYCR7YmFzZVNsdWd9LSR7aSsrfS5wbmdgO1xuICAgICAgfVxuICAgICAgdXNlZEZpbGVuYW1lcy5hZGQoZmlsZW5hbWUpO1xuICAgICAgaWYgKGltYWdlSGFzaCkgaGFzaFRvRmlsZW5hbWUuc2V0KGltYWdlSGFzaCwgZmlsZW5hbWUpO1xuICAgIH1cblxuICAgIHJlc3VsdC5zZXQoaW1nTm9kZS5pZCwgZmlsZW5hbWUpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQnVpbGQgdGhlIGxpc3Qgb2YgYWxsIGV4cG9ydCB0YXNrcyBmb3IgYSBwYWdlIGZyYW1lLlxuICogSW5jbHVkZXM6IGZ1bGwtcGFnZSBjb21wb3NpdGUgc2NyZWVuc2hvdCwgcGVyLXNlY3Rpb24gc2NyZWVuc2hvdHMsXG4gKiBhbmQgaW1hZ2UgYXNzZXRzIChQTkcgZm9yIHBob3RvcywgU1ZHIGZvciB2ZWN0b3IgaWNvbnMpLlxuICpcbiAqIGBpY29uTWFwYCAoZnJvbSBpY29uLWRldGVjdG9yKSBkZWNpZGVzIHdoaWNoIG5vZGVzIGJlY29tZSBTVkcgaWNvbnMgYW5kXG4gKiB3aGF0IGZpbGVuYW1lIGVhY2ggb25lIGdldHMuIGBpbWFnZU1hcGAgZG9lcyB0aGUgc2FtZSBmb3IgcmFzdGVyIElNQUdFXG4gKiBmaWxscy4gQm90aCB0aGlzIGZ1bmN0aW9uIGFuZCBzZWN0aW9uLXBhcnNlciBjb25zdW1lIHRoZSBzYW1lIG1hcHMgc29cbiAqIHRoZSBKU09OIHNwZWNzIHJlZmVyZW5jZSBleGFjdGx5IHRoZSBmaWxlcyB3ZSBleHBvcnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEV4cG9ydFRhc2tzKFxuICBwYWdlRnJhbWU6IEZyYW1lTm9kZSxcbiAgcGFnZVNsdWc6IHN0cmluZyxcbiAgaWNvbk1hcDogTWFwPHN0cmluZywgc3RyaW5nPixcbiAgaW1hZ2VNYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4pOiBJbWFnZUV4cG9ydFRhc2tbXSB7XG4gIGNvbnN0IHRhc2tzOiBJbWFnZUV4cG9ydFRhc2tbXSA9IFtdO1xuICBjb25zdCBwYWdlUGF0aCA9IGBwYWdlcy8ke3BhZ2VTbHVnfWA7XG5cbiAgLy8gRnVsbC1wYWdlIGNvbXBvc2l0ZSBzY3JlZW5zaG90IFx1MjAxNCBjcml0aWNhbCBmb3IgYWdlbnQncyBmdWxsLXBhZ2UgdmlzdWFsIHJldmlldy5cbiAgdGFza3MucHVzaCh7XG4gICAgbm9kZUlkOiBwYWdlRnJhbWUuaWQsXG4gICAgbm9kZU5hbWU6IHBhZ2VGcmFtZS5uYW1lLFxuICAgIHR5cGU6ICdmdWxsLXBhZ2UnLFxuICAgIGZpbGVuYW1lOiAnX2Z1bGwtcGFnZS5wbmcnLFxuICAgIHBhZ2VQYXRoLFxuICAgIGZvcm1hdDogJ1BORycsXG4gICAgc2NhbGU6IDEsXG4gIH0pO1xuXG4gIC8vIFBlci1zZWN0aW9uIHNjcmVlbnNob3RzIGF0IDF4IFx1MjAxNCB1c2VzIHNhbWUgd3JhcHBlciBkcmlsbC1kb3duIGFzIHNlY3Rpb24tcGFyc2VyXG4gIGNvbnN0IHNlY3Rpb25zID0gaWRlbnRpZnlTZWN0aW9uTm9kZXMocGFnZUZyYW1lKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdGFza3MucHVzaCh7XG4gICAgICBub2RlSWQ6IHNlY3Rpb25zW2ldLmlkLFxuICAgICAgbm9kZU5hbWU6IHNlY3Rpb25zW2ldLm5hbWUsXG4gICAgICB0eXBlOiAnc2NyZWVuc2hvdCcsXG4gICAgICBmaWxlbmFtZTogc2NyZWVuc2hvdEZpbGVuYW1lKHNlY3Rpb25zW2ldLm5hbWUpLFxuICAgICAgcGFnZVBhdGgsXG4gICAgICBmb3JtYXQ6ICdQTkcnLFxuICAgICAgc2NhbGU6IDEsXG4gICAgfSk7XG4gIH1cblxuICAvLyBJY29uIFNWRyB0YXNrcyBcdTIwMTQgb25lIHBlciB1bmlxdWUgZmlsZW5hbWUuIE11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGVcbiAgLy8gc2FtZSBsaWJyYXJ5IGljb24gY29sbGFwc2UgdG8gYSBzaW5nbGUgZXhwb3J0IChoYW5kbGVkIGJ5IGljb24tZGV0ZWN0b3IpLlxuICBjb25zdCBmaWxlbmFtZVRvRmlyc3ROb2RlSWQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IFtub2RlSWQsIGZpbGVuYW1lXSBvZiBpY29uTWFwKSB7XG4gICAgaWYgKCFmaWxlbmFtZVRvRmlyc3ROb2RlSWQuaGFzKGZpbGVuYW1lKSkge1xuICAgICAgZmlsZW5hbWVUb0ZpcnN0Tm9kZUlkLnNldChmaWxlbmFtZSwgbm9kZUlkKTtcbiAgICB9XG4gIH1cbiAgY29uc3QgaWNvblJvb3RJZHMgPSBuZXcgU2V0KGljb25NYXAua2V5cygpKTtcbiAgZm9yIChjb25zdCBbZmlsZW5hbWUsIG5vZGVJZF0gb2YgZmlsZW5hbWVUb0ZpcnN0Tm9kZUlkKSB7XG4gICAgY29uc3Qgbm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKG5vZGVJZCk7XG4gICAgaWYgKCFub2RlKSBjb250aW51ZTtcbiAgICB0YXNrcy5wdXNoKHtcbiAgICAgIG5vZGVJZCxcbiAgICAgIG5vZGVOYW1lOiAobm9kZSBhcyBTY2VuZU5vZGUpLm5hbWUsXG4gICAgICB0eXBlOiAnYXNzZXQnLFxuICAgICAgZmlsZW5hbWUsXG4gICAgICBwYWdlUGF0aCxcbiAgICAgIGZvcm1hdDogJ1NWRycsXG4gICAgICBzY2FsZTogMSxcbiAgICAgIHByZWZlclN2ZzogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFJhc3RlciBpbWFnZSB0YXNrcyBcdTIwMTQgb25lIHRhc2sgcGVyIHVuaXF1ZSBmaWxlbmFtZSBpbiBgaW1hZ2VNYXBgLlxuICAvLyBUaGUgbWFwIGFscmVhZHkgaGFuZGxlcyBpbWFnZUhhc2gtYmFzZWQgZGVkdXAgYW5kIGNvbGxpc2lvbi1zdWZmaXhpbmc7XG4gIC8vIHdlIGp1c3Qgd2FsayBpdCBhbmQgcXVldWUgb25lIGV4cG9ydCBwZXIgb3V0cHV0IGZpbGUuXG4gIGNvbnN0IGZpbGVuYW1lVG9GaXJzdEltYWdlTm9kZUlkID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBbbm9kZUlkLCBmaWxlbmFtZV0gb2YgaW1hZ2VNYXApIHtcbiAgICBpZiAoIWZpbGVuYW1lVG9GaXJzdEltYWdlTm9kZUlkLmhhcyhmaWxlbmFtZSkpIHtcbiAgICAgIGZpbGVuYW1lVG9GaXJzdEltYWdlTm9kZUlkLnNldChmaWxlbmFtZSwgbm9kZUlkKTtcbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBbZmlsZW5hbWUsIG5vZGVJZF0gb2YgZmlsZW5hbWVUb0ZpcnN0SW1hZ2VOb2RlSWQpIHtcbiAgICBjb25zdCBub2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQobm9kZUlkKTtcbiAgICBpZiAoIW5vZGUpIGNvbnRpbnVlO1xuICAgIHRhc2tzLnB1c2goe1xuICAgICAgbm9kZUlkLFxuICAgICAgbm9kZU5hbWU6IChub2RlIGFzIFNjZW5lTm9kZSkubmFtZSxcbiAgICAgIHR5cGU6ICdhc3NldCcsXG4gICAgICBmaWxlbmFtZSxcbiAgICAgIHBhZ2VQYXRoLFxuICAgICAgZm9ybWF0OiAnUE5HJyxcbiAgICAgIHNjYWxlOiAxLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHRhc2tzO1xufVxuXG4vKipcbiAqIFdhbGsgYSBub2RlJ3MgYW5jZXN0cnkgY2hlY2tpbmcgd2hldGhlciBhbnkgYW5jZXN0b3IgaXMgYW4gaWNvbiByb290LlxuICogVXNlZCB0byBzdXBwcmVzcyBkdXBsaWNhdGUgZXhwb3J0cyBmb3IgdmVjdG9ycyBpbnNpZGUgYW4gaWNvbiBncm91cC5cbiAqL1xuZnVuY3Rpb24gaXNJbnNpZGVJY29uUm9vdChub2RlOiBTY2VuZU5vZGUsIGljb25Sb290SWRzOiBTZXQ8c3RyaW5nPik6IGJvb2xlYW4ge1xuICBsZXQgcDogQmFzZU5vZGUgfCBudWxsID0gbm9kZS5wYXJlbnQ7XG4gIHdoaWxlIChwKSB7XG4gICAgaWYgKCdpZCcgaW4gcCAmJiBpY29uUm9vdElkcy5oYXMoKHAgYXMgYW55KS5pZCkpIHJldHVybiB0cnVlO1xuICAgIHAgPSAocCBhcyBhbnkpLnBhcmVudDtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBpbWFnZUhhc2ggb2YgdGhlIGZpcnN0IHZpc2libGUgSU1BR0UgZmlsbCBvbiBhIG5vZGUsIG9yIG51bGxcbiAqIGlmIHRoZSBub2RlIGhhcyBubyByZXNvbHZhYmxlIElNQUdFIGZpbGwuIFVzZWQgdG8gZGVkdXBlIGlkZW50aWNhbFxuICogcmFzdGVyIGJpdG1hcHMgYWNyb3NzIHRoZSBwYWdlIHNvIHdlIGRvbid0IGVtaXQgb25lIGZpbGUgcGVyIHVzYWdlLlxuICovXG5mdW5jdGlvbiBnZXRGaXJzdEltYWdlSGFzaChub2RlOiBTY2VuZU5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgZmlsbHMgPSAobm9kZSBhcyBhbnkpLmZpbGxzO1xuICBpZiAoIWZpbGxzIHx8ICFBcnJheS5pc0FycmF5KGZpbGxzKSkgcmV0dXJuIG51bGw7XG4gIGZvciAoY29uc3QgZiBvZiBmaWxscykge1xuICAgIGlmIChmICYmIGYudHlwZSA9PT0gJ0lNQUdFJyAmJiBmLnZpc2libGUgIT09IGZhbHNlICYmIChmIGFzIEltYWdlUGFpbnQpLmltYWdlSGFzaCkge1xuICAgICAgcmV0dXJuIChmIGFzIEltYWdlUGFpbnQpLmltYWdlSGFzaCB8fCBudWxsO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBGaW5kIGFsbCBub2RlcyB3aXRoIElNQUdFIGZpbGxzIGluIGEgc3VidHJlZS5cbiAqL1xuZnVuY3Rpb24gZmluZEltYWdlTm9kZXMocm9vdDogU2NlbmVOb2RlKTogU2NlbmVOb2RlW10ge1xuICBjb25zdCBub2RlczogU2NlbmVOb2RlW10gPSBbXTtcblxuICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgIGlmIChoYXNJbWFnZUZpbGwobm9kZSBhcyBhbnkpKSB7XG4gICAgICBub2Rlcy5wdXNoKG5vZGUpO1xuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChub2RlIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkLnZpc2libGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgd2FsayhjaGlsZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2Fsayhyb290KTtcbiAgcmV0dXJuIG5vZGVzO1xufVxuXG4vKipcbiAqIEV4cG9ydCBhIHNpbmdsZSBub2RlIGFzIFBORy9TVkcgYnl0ZXMuXG4gKlxuICogRm9yIHNlY3Rpb24gc2NyZWVuc2hvdHMsIHRoaXMgdXNlcyBleHBvcnRBc3luYyB3aGljaCByZW5kZXJzIHRoZSBjb21wb3NpdGVcbiAqIChpbWFnZSArIHRleHQgKyBvdmVybGF5cykgXHUyMDE0IGNvcnJlY3QgZm9yIHNjcmVlbnNob3RzLlxuICpcbiAqIEZvciBpbWFnZSBhc3NldHMsIHRoaXMgcHVsbHMgdGhlIFJBVyBpbWFnZSBieXRlcyBmcm9tIHRoZSBub2RlJ3MgSU1BR0UgZmlsbFxuICogdmlhIGZpZ21hLmdldEltYWdlQnlIYXNoKCkuIFRoaXMgcmV0dXJucyB0aGUgcHVyZSBzb3VyY2UgaW1hZ2Ugd2l0aCBOT1xuICogdGV4dC9zaGFwZSBvdmVybGF5cyBiYWtlZCBpbiBcdTIwMTQgZml4aW5nIHRoZSBjb21tb24gXCJoZXJvIGltYWdlIGluY2x1ZGVzIHRoZVxuICogaGVhZGxpbmUgdGV4dFwiIHByb2JsZW0uIE1hc2tzIGFuZCBjcm9wcyBhcmUgZGlzY2FyZGVkIGludGVudGlvbmFsbHk7IHRoZVxuICogdGhlbWUgcmUtYXBwbGllcyB0aGVtIHZpYSBDU1MgKG9iamVjdC1maXQsIGJhY2tncm91bmQtc2l6ZSwgYm9yZGVyLXJhZGl1cykuXG4gKlxuICogQXNzZXQgZmFsbGJhY2s6IGlmIHRoZSBub2RlIGhhcyBubyBpbWFnZSBmaWxsIChlLmcuIGFuIFNWRyBpbGx1c3RyYXRpb24pLFxuICogZmFsbCBiYWNrIHRvIGV4cG9ydEFzeW5jIHNvIGxvZ29zL2ljb25zIHN0aWxsIGV4cG9ydCBjb3JyZWN0bHkuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGV4cG9ydE5vZGUoXG4gIG5vZGVJZDogc3RyaW5nLFxuICBmb3JtYXQ6ICdQTkcnIHwgJ1NWRycgfCAnSlBHJyxcbiAgc2NhbGU6IG51bWJlcixcbiAgdGFza1R5cGU6ICdzY3JlZW5zaG90JyB8ICdmdWxsLXBhZ2UnIHwgJ2Fzc2V0Jyxcbik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICBjb25zdCBub2RlID0gZmlnbWEuZ2V0Tm9kZUJ5SWQobm9kZUlkKTtcbiAgaWYgKCFub2RlIHx8ICEoJ2V4cG9ydEFzeW5jJyBpbiBub2RlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgTm9kZSAke25vZGVJZH0gbm90IGZvdW5kIG9yIG5vdCBleHBvcnRhYmxlYCk7XG4gIH1cblxuICAvLyBTVkcgcmVxdWVzdGVkIFx1MjAxNCB1c2UgZXhwb3J0QXN5bmMgZGlyZWN0bHkgKGZvciBpY29ucywgdmVjdG9yIGlsbHVzdHJhdGlvbnMpXG4gIGlmIChmb3JtYXQgPT09ICdTVkcnKSB7XG4gICAgcmV0dXJuIGF3YWl0IChub2RlIGFzIFNjZW5lTm9kZSkuZXhwb3J0QXN5bmMoeyBmb3JtYXQ6ICdTVkcnIH0pO1xuICB9XG5cbiAgLy8gRm9yIFBORyBhc3NldCB0YXNrczogdHJ5IHRvIHB1bGwgcmF3IGltYWdlIGJ5dGVzIGZyb20gYW4gSU1BR0UgZmlsbCBmaXJzdFxuICAvLyBzbyB3ZSBnZXQgdGhlIHB1cmUgc291cmNlIGltYWdlIHdpdGhvdXQgYW55IGJha2VkLWluIHRleHQvb3ZlcmxheXMuXG4gIGlmICh0YXNrVHlwZSA9PT0gJ2Fzc2V0JyAmJiBmb3JtYXQgPT09ICdQTkcnKSB7XG4gICAgY29uc3QgcmF3ID0gYXdhaXQgdHJ5RXh0cmFjdFJhd0ltYWdlQnl0ZXMobm9kZSBhcyBTY2VuZU5vZGUpO1xuICAgIGlmIChyYXcpIHJldHVybiByYXc7XG4gICAgLy8gZWxzZSBmYWxsIHRocm91Z2ggdG8gZXhwb3J0QXN5bmMgKFNWRyBpbGx1c3RyYXRpb24sIHZlY3RvciBncmFwaGljLCBldGMuKVxuICB9XG5cbiAgLy8gRnVsbC1wYWdlIGFuZCBzZWN0aW9uIHNjcmVlbnNob3RzIHVzZSBleHBvcnRBc3luYyAocmVuZGVyZWQgY29tcG9zaXRlKS5cbiAgLy8gU2NhbGUgdXAgdG8gMnggZm9yIGZ1bGwtcGFnZSB0byBwcmVzZXJ2ZSBkZXRhaWwgd2hlbiBjb21wYXJpbmcgd2l0aCBicm93c2VyLlxuICBjb25zdCBleHBvcnRTY2FsZSA9IHRhc2tUeXBlID09PSAnZnVsbC1wYWdlJyA/IDIgOiBzY2FsZTtcbiAgcmV0dXJuIGF3YWl0IChub2RlIGFzIFNjZW5lTm9kZSkuZXhwb3J0QXN5bmMoe1xuICAgIGZvcm1hdDogJ1BORycsXG4gICAgY29uc3RyYWludDogeyB0eXBlOiAnU0NBTEUnLCB2YWx1ZTogZXhwb3J0U2NhbGUgfSxcbiAgfSk7XG59XG5cbi8qKlxuICogRXh0cmFjdCByYXcgaW1hZ2UgYnl0ZXMgZnJvbSB0aGUgZmlyc3QgdmlzaWJsZSBJTUFHRSBmaWxsIG9uIGEgbm9kZS5cbiAqIFJldHVybnMgbnVsbCBpZiB0aGUgbm9kZSBoYXMgbm8gSU1BR0UgZmlsbCBvciB0aGUgaGFzaCBjYW4ndCBiZSByZXNvbHZlZC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gdHJ5RXh0cmFjdFJhd0ltYWdlQnl0ZXMobm9kZTogU2NlbmVOb2RlKTogUHJvbWlzZTxVaW50OEFycmF5IHwgbnVsbD4ge1xuICBjb25zdCBmaWxscyA9IChub2RlIGFzIGFueSkuZmlsbHM7XG4gIGlmICghZmlsbHMgfHwgIUFycmF5LmlzQXJyYXkoZmlsbHMpKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBpbWFnZUZpbGwgPSBmaWxscy5maW5kKFxuICAgIChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UgJiYgKGYgYXMgSW1hZ2VQYWludCkuaW1hZ2VIYXNoLFxuICApIGFzIEltYWdlUGFpbnQgfCB1bmRlZmluZWQ7XG5cbiAgaWYgKCFpbWFnZUZpbGwgfHwgIWltYWdlRmlsbC5pbWFnZUhhc2gpIHJldHVybiBudWxsO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgaW1hZ2UgPSBmaWdtYS5nZXRJbWFnZUJ5SGFzaChpbWFnZUZpbGwuaW1hZ2VIYXNoKTtcbiAgICBpZiAoIWltYWdlKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gYXdhaXQgaW1hZ2UuZ2V0Qnl0ZXNBc3luYygpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBleHRyYWN0IHJhdyBpbWFnZSBieXRlcyBmcm9tICR7bm9kZS5uYW1lfTpgLCBlcnIpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZSBleHBvcnQgdGFza3MgaW4gYmF0Y2hlcyBvZiAxMC5cbiAqIFNlbmRzIGVhY2ggcmVzdWx0IHRvIFVJIGltbWVkaWF0ZWx5IHRvIGZyZWUgc2FuZGJveCBtZW1vcnkuXG4gKlxuICogT24gU1ZHIGV4cG9ydCBmYWlsdXJlIChzb21lIEZpZ21hIHZlY3RvciBmZWF0dXJlcyBjYW4ndCBzZXJpYWxpemUpLFxuICogYXV0b21hdGljYWxseSByZXRyaWVzIGFzIFBORyBAIDJ4IGFuZCBlbWl0cyB0aGUgLnBuZyBmaWxlbmFtZSBpbnN0ZWFkLlxuICogQm90aCB0aGUgb3JpZ2luYWwgZmFpbHVyZSBhbmQgdGhlIGZhbGxiYWNrIGFyZSByZWNvcmRlZCBpbiB0aGUgcmV0dXJuZWRcbiAqIGBmYWlsZWRgIGxpc3Qgc28gdGhlIGV4dHJhY3RvciBjYW4gcGF0Y2ggZWxlbWVudCByZWZlcmVuY2VzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZUJhdGNoRXhwb3J0KFxuICB0YXNrczogSW1hZ2VFeHBvcnRUYXNrW10sXG4gIG9uUHJvZ3Jlc3M6IChjdXJyZW50OiBudW1iZXIsIHRvdGFsOiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpID0+IHZvaWQsXG4gIG9uRGF0YTogKHRhc2s6IEltYWdlRXhwb3J0VGFzaywgZGF0YTogVWludDhBcnJheSkgPT4gdm9pZCxcbiAgc2hvdWxkQ2FuY2VsOiAoKSA9PiBib29sZWFuLFxuKTogUHJvbWlzZTxGYWlsZWRFeHBvcnRbXT4ge1xuICBjb25zdCB0b3RhbCA9IHRhc2tzLmxlbmd0aDtcbiAgY29uc3QgZmFpbGVkOiBGYWlsZWRFeHBvcnRbXSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWw7IGkgKz0gQkFUQ0hfU0laRSkge1xuICAgIGlmIChzaG91bGRDYW5jZWwoKSkgcmV0dXJuIGZhaWxlZDtcblxuICAgIGNvbnN0IGJhdGNoID0gdGFza3Muc2xpY2UoaSwgaSArIEJBVENIX1NJWkUpO1xuICAgIGNvbnN0IGJhdGNoUHJvbWlzZXMgPSBiYXRjaC5tYXAoYXN5bmMgKHRhc2spID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBleHBvcnROb2RlKHRhc2subm9kZUlkLCB0YXNrLmZvcm1hdCwgdGFzay5zY2FsZSwgdGFzay50eXBlKTtcbiAgICAgICAgb25EYXRhKHRhc2ssIGRhdGEpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IHJlYXNvbiA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcblxuICAgICAgICAvLyBTVkcgY2FuIGZhaWwgZm9yIHZlY3RvcnMgd2l0aCB1bnN1cHBvcnRlZCBmZWF0dXJlcyAob3BlbiBwYXRoc1xuICAgICAgICAvLyB3aXRoIHN0cm9rZSBjYXBzLCBjZXJ0YWluIGJsZW5kIG1vZGVzLCBib3VuZCB2YXJpYWJsZXMgb24gZmlsbHMpLlxuICAgICAgICAvLyBGYWxsIGJhY2sgdG8gUE5HIEAgMnggc28gdGhlIGRlc2lnbiBpc24ndCB2aXN1YWxseSBtaXNzaW5nLlxuICAgICAgICBpZiAodGFzay5mb3JtYXQgPT09ICdTVkcnKSB7XG4gICAgICAgICAgY29uc3QgcG5nRmlsZW5hbWUgPSB0YXNrLmZpbGVuYW1lLnJlcGxhY2UoL1xcLnN2ZyQvaSwgJy5wbmcnKTtcbiAgICAgICAgICBjb25zdCBwbmdUYXNrOiBJbWFnZUV4cG9ydFRhc2sgPSB7XG4gICAgICAgICAgICAuLi50YXNrLFxuICAgICAgICAgICAgZmlsZW5hbWU6IHBuZ0ZpbGVuYW1lLFxuICAgICAgICAgICAgZm9ybWF0OiAnUE5HJyxcbiAgICAgICAgICAgIHNjYWxlOiAyLFxuICAgICAgICAgIH07XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBleHBvcnROb2RlKHRhc2subm9kZUlkLCAnUE5HJywgMiwgdGFzay50eXBlKTtcbiAgICAgICAgICAgIG9uRGF0YShwbmdUYXNrLCBkYXRhKTtcbiAgICAgICAgICAgIGZhaWxlZC5wdXNoKHtcbiAgICAgICAgICAgICAgZmlsZW5hbWU6IHRhc2suZmlsZW5hbWUsXG4gICAgICAgICAgICAgIG5vZGVOYW1lOiB0YXNrLm5vZGVOYW1lLFxuICAgICAgICAgICAgICByZWFzb246IGBTVkcgZXhwb3J0IGZhaWxlZCAoJHtyZWFzb259KTsgZmVsbCBiYWNrIHRvIFBOR2AsXG4gICAgICAgICAgICAgIGZhbGxiYWNrRmlsZW5hbWU6IHBuZ0ZpbGVuYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBjYXRjaCAocG5nRXJyKSB7XG4gICAgICAgICAgICBjb25zdCBwbmdSZWFzb24gPSBwbmdFcnIgaW5zdGFuY2VvZiBFcnJvciA/IHBuZ0Vyci5tZXNzYWdlIDogU3RyaW5nKHBuZ0Vycik7XG4gICAgICAgICAgICBmYWlsZWQucHVzaCh7XG4gICAgICAgICAgICAgIGZpbGVuYW1lOiB0YXNrLmZpbGVuYW1lLFxuICAgICAgICAgICAgICBub2RlTmFtZTogdGFzay5ub2RlTmFtZSxcbiAgICAgICAgICAgICAgcmVhc29uOiBgU1ZHIGFuZCBQTkcgZmFsbGJhY2sgYm90aCBmYWlsZWQ6ICR7cmVhc29ufSAvICR7cG5nUmVhc29ufWAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gZXhwb3J0ICR7dGFzay5maWxlbmFtZX06YCwgZXJyKTtcbiAgICAgICAgZmFpbGVkLnB1c2goe1xuICAgICAgICAgIGZpbGVuYW1lOiB0YXNrLmZpbGVuYW1lLFxuICAgICAgICAgIG5vZGVOYW1lOiB0YXNrLm5vZGVOYW1lLFxuICAgICAgICAgIHJlYXNvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBhd2FpdCBQcm9taXNlLmFsbChiYXRjaFByb21pc2VzKTtcbiAgICBjb25zdCBkb25lID0gTWF0aC5taW4oaSArIEJBVENIX1NJWkUsIHRvdGFsKTtcbiAgICBvblByb2dyZXNzKGRvbmUsIHRvdGFsLCBgRXhwb3J0aW5nICgke2RvbmV9LyR7dG90YWx9KS4uLmApO1xuICB9XG5cbiAgcmV0dXJuIGZhaWxlZDtcbn1cblxuLyoqXG4gKiBCdWlsZCB0aGUgaW1hZ2UtbWFwLmpzb24gZnJvbSBleHBvcnQgdGFza3MgYW5kIHNlY3Rpb24gZGF0YS5cbiAqXG4gKiBgaWNvbk1hcGAgcG9wdWxhdGVzIGBieV9zZWN0aW9uYCBmb3IgaWNvbiB1c2FnZSBzbyB0aGUgYWdlbnQgY2FuIHRyYWNlXG4gKiBcInNlY3Rpb24gWCB1c2VzIGNoZXZyb24tcmlnaHQuc3ZnXCIgaW5zdGVhZCBvZiBnZXR0aW5nIGEgY29udGV4dC1sZXNzXG4gKiBnbG9iYWwgbGlzdCBvZiBTVkdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRJbWFnZU1hcChcbiAgdGFza3M6IEltYWdlRXhwb3J0VGFza1tdLFxuICBzZWN0aW9uczogeyBuYW1lOiBzdHJpbmc7IGNoaWxkcmVuOiBTY2VuZU5vZGVbXSB9W10sXG4gIGljb25NYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4gIGltYWdlTWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuKTogSW1hZ2VNYXAge1xuICBjb25zdCBpbWFnZXM6IFJlY29yZDxzdHJpbmcsIEltYWdlTWFwRW50cnk+ID0ge307XG4gIGNvbnN0IGJ5U2VjdGlvbk1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge307XG5cbiAgY29uc3QgYXNzZXRUYXNrcyA9IHRhc2tzLmZpbHRlcih0ID0+IHQudHlwZSA9PT0gJ2Fzc2V0Jyk7XG5cbiAgZm9yIChjb25zdCB0YXNrIG9mIGFzc2V0VGFza3MpIHtcbiAgICBpbWFnZXNbdGFzay5maWxlbmFtZV0gPSB7XG4gICAgICBmaWxlOiB0YXNrLmZpbGVuYW1lLFxuICAgICAgZXh0OiB0YXNrLmZvcm1hdC50b0xvd2VyQ2FzZSgpLFxuICAgICAgbm9kZU5hbWVzOiBbdGFzay5ub2RlTmFtZV0sXG4gICAgICByZWFkYWJsZU5hbWU6IHRhc2suZmlsZW5hbWUsXG4gICAgICBkaW1lbnNpb25zOiBudWxsLFxuICAgICAgdXNlZEluU2VjdGlvbnM6IFtdLFxuICAgIH07XG4gIH1cblxuICBmb3IgKGNvbnN0IHNlY3Rpb24gb2Ygc2VjdGlvbnMpIHtcbiAgICBjb25zdCBzZWN0aW9uSW1hZ2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICBmdW5jdGlvbiB3YWxrKG5vZGU6IFNjZW5lTm9kZSkge1xuICAgICAgLy8gSWNvbiByb290IFx1MjAxNCByZWNvcmQgU1ZHIGFuZCBzdG9wIChkb24ndCBkZXNjZW5kIGludG8gdmVjdG9yIGludGVybmFscylcbiAgICAgIGNvbnN0IGljb25GaWxlbmFtZSA9IGljb25NYXAuZ2V0KG5vZGUuaWQpO1xuICAgICAgaWYgKGljb25GaWxlbmFtZSkge1xuICAgICAgICBzZWN0aW9uSW1hZ2VzLmFkZChpY29uRmlsZW5hbWUpO1xuICAgICAgICBpZiAoaW1hZ2VzW2ljb25GaWxlbmFtZV0gJiYgIWltYWdlc1tpY29uRmlsZW5hbWVdLnVzZWRJblNlY3Rpb25zLmluY2x1ZGVzKHNlY3Rpb24ubmFtZSkpIHtcbiAgICAgICAgICBpbWFnZXNbaWNvbkZpbGVuYW1lXS51c2VkSW5TZWN0aW9ucy5wdXNoKHNlY3Rpb24ubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaGFzSW1hZ2VGaWxsKG5vZGUgYXMgYW55KSkge1xuICAgICAgICAvLyBSZXNvbHZlIHZpYSB0aGUgc2hhcmVkIGltYWdlTWFwIHNvIHBlci1zZWN0aW9uIHJlZnMgbWF0Y2ggdGhlXG4gICAgICAgIC8vIGZpbGVuYW1lcyB0aGF0IGFjdHVhbGx5IGxhbmRlZCBpbiB0aGUgWklQIChwb3N0IGNvbGxpc2lvbi1zdWZmaXgpLlxuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGltYWdlTWFwLmdldChub2RlLmlkKTtcbiAgICAgICAgaWYgKGZpbGVuYW1lKSB7XG4gICAgICAgICAgc2VjdGlvbkltYWdlcy5hZGQoZmlsZW5hbWUpO1xuICAgICAgICAgIGlmIChpbWFnZXNbZmlsZW5hbWVdICYmICFpbWFnZXNbZmlsZW5hbWVdLnVzZWRJblNlY3Rpb25zLmluY2x1ZGVzKHNlY3Rpb24ubmFtZSkpIHtcbiAgICAgICAgICAgIGltYWdlc1tmaWxlbmFtZV0udXNlZEluU2VjdGlvbnMucHVzaChzZWN0aW9uLm5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoJ2NoaWxkcmVuJyBpbiBub2RlKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICAgIHdhbGsoY2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBzZWN0aW9uLmNoaWxkcmVuKSB7XG4gICAgICB3YWxrKGNoaWxkKTtcbiAgICB9XG4gICAgYnlTZWN0aW9uTWFwW3NlY3Rpb24ubmFtZV0gPSBbLi4uc2VjdGlvbkltYWdlc107XG4gIH1cblxuICByZXR1cm4geyBpbWFnZXMsIGJ5X3NlY3Rpb246IGJ5U2VjdGlvbk1hcCB9O1xufVxuIiwgImltcG9ydCB7IGhhc0ltYWdlRmlsbCB9IGZyb20gJy4vY29sb3InO1xuaW1wb3J0IHsgc2x1Z2lmeSwgaXNEZWZhdWx0TGF5ZXJOYW1lIH0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogU2hhcmVkIGljb24gZGV0ZWN0aW9uIGZvciBpbWFnZS1leHBvcnRlciAoZGVjaWRlcyB3aGF0IHRvIFNWRy1leHBvcnQpXG4gKiBhbmQgc2VjdGlvbi1wYXJzZXIgKGRlY2lkZXMgd2hpY2ggZWxlbWVudHMgZ2V0IGFuIGBpY29uRmlsZWAgcmVmZXJlbmNlKS5cbiAqXG4gKiBCb3RoIG1vZHVsZXMgTVVTVCBhZ3JlZSBvbiAoYSkgd2hpY2ggbm9kZXMgYXJlIGljb25zIGFuZCAoYikgdGhlIGZpbGVuYW1lXG4gKiBlYWNoIGljb24gcmVjZWl2ZXMgXHUyMDE0IG90aGVyd2lzZSBzZWN0aW9uLXNwZWNzLmpzb24gcG9pbnRzIGF0IGZpbGVzIHRoYXRcbiAqIG5ldmVyIG1hZGUgaXQgaW50byB0aGUgWklQLCB3aGljaCBpcyB0aGUgb3JpZ2luYWwgXCJpY29uIG1pc3NpbmdcIiBidWcuXG4gKlxuICogRmlsZW5hbWUgdW5pcXVlbmVzcyBpcyB0aGUgcmVzcG9uc2liaWxpdHkgb2YgYGJ1aWxkSWNvbkZpbGVuYW1lTWFwYDpcbiAqIElOU1RBTkNFIG5vZGVzIHBvaW50aW5nIGF0IHRoZSBzYW1lIG1haW4gY29tcG9uZW50IGNvbGxhcHNlIHRvIG9uZSBmaWxlLFxuICogYW5kIHNsdWcgY29sbGlzaW9ucyBnZXQgYSBudW1lcmljIHN1ZmZpeC5cbiAqL1xuXG5jb25zdCBJQ09OX05BTUVfSElOVCA9IC9cXGIoaWNvbnxjaGV2cm9ufGFycm93fGNhcmV0fGNoZWNrfHRpY2t8Y2xvc2V8Y3Jvc3N8bWVudXxidXJnZXJ8aGFtYnVyZ2VyfHNlYXJjaHxwbHVzfG1pbnVzfHN0YXJ8aGVhcnR8bG9nb3xzb2NpYWx8c3ltYm9sfGdseXBofHBsYXl8cGF1c2V8c3RvcHxuZXh0fHByZXZ8c2hhcmV8ZG93bmxvYWR8dXBsb2FkfGVkaXR8dHJhc2h8ZGVsZXRlfGluZm98d2FybmluZ3xlcnJvcnxzdWNjZXNzfGZhY2Vib29rfHR3aXR0ZXJ8aW5zdGFncmFtfGxpbmtlZGlufHlvdXR1YmV8Z2l0aHVifHRpa3Rva3x3aGF0c2FwcHx0ZWxlZ3JhbXxkaXNjb3JkfHBpbnRlcmVzdHxzbmFwY2hhdHxtYWlsfGVudmVsb3BlfHBob25lfHRlbGVwaG9uZXxob21lfGhvdXNlfHVzZXJ8cHJvZmlsZXxhY2NvdW50fGxvY2t8dW5sb2NrfGdlYXJ8c2V0dGluZ3N8Y29nfGJlbGx8bm90aWZpY2F0aW9ufGNhbGVuZGFyfGNsb2NrfHRpbWV8Ym9va21hcmt8dGFnfGZpbHRlcnxzb3J0fGdyaWR8bGlzdHxtYXB8cGlufGxvY2F0aW9ufGNhcnR8YmFnfGJhc2tldHx3YWxsZXR8Y2FyZHxnaWZ0fGdsb2JlfHdvcmxkfGxpbmt8ZXh0ZXJuYWx8Y29weXxwYXN0ZXxyZWZyZXNofHJlbG9hZHxzeW5jfGV5ZXx2aWV3fGhpZGV8dmlzaWJsZXxpbnZpc2libGV8c3VufG1vb258dGhlbWV8bGlnaHR8ZGFya3x3aWZpfGJhdHRlcnl8Y2FtZXJhfHZpZGVvfG1pY3JvcGhvbmV8dm9sdW1lfG11dGV8ZmlsZXxmb2xkZXJ8YXR0YWNofHBhcGVyY2xpcHxjbG91ZHxkYXRhYmFzZXxjaGFydHxncmFwaHx0cmVuZHxkb3R8ZGl2aWRlcnxzZXBhcmF0b3J8c2hhcGV8Z3JhcGhpY3xpbGx1c3RyYXRpb258ZGVjb3JhdGlvbnxzdmd8dmVjdG9yfGFzc2V0KVxcYi9pO1xuY29uc3QgSUNPTl9TSVpFX0NBUCA9IDI1NjtcblxuLyoqXG4gKiBUcnVlIGlmIHRoZSBub2RlIGlzIFwidmVjdG9yLW9ubHlcIiBcdTIwMTQgbm8gVEVYVCwgbm8gSU1BR0UgZmlsbCBhbnl3aGVyZSBpblxuICogaXRzIHN1YnRyZWUuIFB1cmUtdmVjdG9yIGljb25zIGNhbiBiZSBleHBvcnRlZCBhcyBTVkcgd2l0aG91dCBsb3NpbmdcbiAqIGZpZGVsaXR5OyBtaXhlZCBzdWJ0cmVlcyBtdXN0IGZhbGwgYmFjayB0byBQTkcuXG4gKi9cbmZ1bmN0aW9uIGlzVmVjdG9yT25seShuOiBTY2VuZU5vZGUpOiBib29sZWFuIHtcbiAgaWYgKG4udHlwZSA9PT0gJ1RFWFQnKSByZXR1cm4gZmFsc2U7XG4gIGlmIChoYXNJbWFnZUZpbGwobiBhcyBhbnkpKSByZXR1cm4gZmFsc2U7XG4gIGlmICgnY2hpbGRyZW4nIGluIG4pIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZC52aXNpYmxlID09PSBmYWxzZSkgY29udGludWU7XG4gICAgICBpZiAoIWlzVmVjdG9yT25seShjaGlsZCkpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUHJlZGljYXRlOiBpcyB0aGlzIG5vZGUgYW4gaWNvbiByb290IHRoYXQgc2hvdWxkIGJlIGV4cG9ydGVkIGFzIFNWRz9cbiAqXG4gKiBIZXVyaXN0aWNzIChhbnkgb25lIGlzIHN1ZmZpY2llbnQpOlxuICogICAxLiBub2RlLnR5cGUgPT09IFZFQ1RPUiAvIEJPT0xFQU5fT1BFUkFUSU9OIC8gTElORSAocmF3IHZlY3RvciBwcmltaXRpdmVzKVxuICogICAyLiBGUkFNRSAvIEdST1VQIC8gQ09NUE9ORU5UIC8gSU5TVEFOQ0Ugd2hvc2UgZW50aXJlIHN1YnRyZWUgaXMgdmVjdG9yLW9ubHlcbiAqICAgICAgQU5EIGFueSBvbmUgb2Y6XG4gKiAgICAgICAgYS4gaGFzIGEgbmFtZSBoaW50IChpY29uLCBsb2dvLCBjaGV2cm9uLCBmYWNlYm9vaywgXHUyMDI2KSBcdTIwMTQgYW55IHNpemVcbiAqICAgICAgICBiLiBpcyBzbWFsbCAoXHUyMjY0MjU2XHUwMEQ3MjU2KSBcdTIwMTQgbmFtZSBpcnJlbGV2YW50XG4gKiAgICAgIFdyYXBwZXItYXMtc2luZ2xlLWljb24gZXhwb3J0IGtlZXBzIG11bHRpLXBhdGggbG9nb3MgY29tcG9zZWQ7IHRoZVxuICogICAgICBvbGQgMTI4cHggY2FwIHNwbGl0IGEgMjAwXHUwMEQ3MjAwIGxvZ28gaW50byBpbmRpdmlkdWFsbHktZGlzY29ubmVjdGVkXG4gKiAgICAgIFZFQ1RPUiBleHBvcnRzLiBCdW1waW5nIHRvIDI1NiArIG5hbWUtaGludCBvdmVycmlkZSBmaXhlcyB0aGF0LlxuICpcbiAqIFdoYXRldmVyIHRoaXMgcmV0dXJucyB0cnVlIGZvciwgaW1hZ2UtZXhwb3J0ZXIgd2lsbCBxdWV1ZSBhbiBTVkcgZXhwb3J0XG4gKiBBTkQgc2VjdGlvbi1wYXJzZXIgd2lsbCBlbWl0IGFuIGBpY29uRmlsZWAgcmVmZXJlbmNlIG9uIHRoZSBtYXRjaGluZyBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJY29uTm9kZShub2RlOiBTY2VuZU5vZGUpOiBib29sZWFuIHtcbiAgaWYgKG5vZGUudmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybiBmYWxzZTtcblxuICAvLyBQdXJlIHZlY3RvciBwcmltaXRpdmVzIGFyZSBhbHdheXMgU1ZHLWV4cG9ydGFibGUuXG4gIGlmIChub2RlLnR5cGUgPT09ICdWRUNUT1InIHx8IG5vZGUudHlwZSA9PT0gJ0JPT0xFQU5fT1BFUkFUSU9OJyB8fCBub2RlLnR5cGUgPT09ICdMSU5FJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKG5vZGUudHlwZSAhPT0gJ0ZSQU1FJyAmJiBub2RlLnR5cGUgIT09ICdDT01QT05FTlQnICYmXG4gICAgICBub2RlLnR5cGUgIT09ICdJTlNUQU5DRScgJiYgbm9kZS50eXBlICE9PSAnR1JPVVAnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKCEoJ2NoaWxkcmVuJyBpbiBub2RlKSB8fCAobm9kZSBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGJiID0gbm9kZS5hYnNvbHV0ZUJvdW5kaW5nQm94O1xuICBjb25zdCBzbWFsbGlzaCA9ICEhYmIgJiYgYmIud2lkdGggPD0gSUNPTl9TSVpFX0NBUCAmJiBiYi5oZWlnaHQgPD0gSUNPTl9TSVpFX0NBUDtcbiAgY29uc3QgbmFtZUhpbnRzSWNvbiA9IElDT05fTkFNRV9ISU5ULnRlc3Qobm9kZS5uYW1lIHx8ICcnKTtcblxuICBpZiAoIXNtYWxsaXNoICYmICFuYW1lSGludHNJY29uKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBpc1ZlY3Rvck9ubHkobm9kZSk7XG59XG5cbi8qKlxuICogV2FsayB0aGUgdHJlZSBhbmQgY29sbGVjdCBldmVyeSBpY29uLXJvb3Qgbm9kZS4gRG9uJ3QgcmVjdXJzZSBpbnRvIGFuXG4gKiBpY29uJ3MgY2hpbGRyZW4gXHUyMDE0IHRoZSBwYXJlbnQgaXMgdGhlIGNvbXBvc2VkIGV4cG9ydCwgdGhlIGNoaWxkcmVuIGFyZVxuICoganVzdCBwYXRocyBpbnNpZGUgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kSWNvbk5vZGVzKHJvb3Q6IFNjZW5lTm9kZSk6IFNjZW5lTm9kZVtdIHtcbiAgY29uc3QgaWNvbnM6IFNjZW5lTm9kZVtdID0gW107XG4gIGZ1bmN0aW9uIHdhbGsobm9kZTogU2NlbmVOb2RlKSB7XG4gICAgaWYgKG5vZGUudmlzaWJsZSA9PT0gZmFsc2UpIHJldHVybjtcbiAgICBpZiAoaXNJY29uTm9kZShub2RlKSkge1xuICAgICAgaWNvbnMucHVzaChub2RlKTtcbiAgICAgIHJldHVybjsgLy8gZG9uJ3QgcmVjdXJzZSBpbnRvIHRoZSBpY29uXG4gICAgfVxuICAgIGlmICgnY2hpbGRyZW4nIGluIG5vZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgKG5vZGUgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbikge1xuICAgICAgICB3YWxrKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgd2Fsayhyb290KTtcbiAgcmV0dXJuIGljb25zO1xufVxuXG4vKipcbiAqIFBpY2sgYSBodW1hbi1tZWFuaW5nZnVsIGJhc2UgbmFtZSBmb3IgYW4gaWNvbi4gT3JkZXIgb2YgcHJlZmVyZW5jZTpcbiAqICAgMS4gSU5TVEFOQ0UgXHUyMTkyIG1haW4gY29tcG9uZW50IC8gY29tcG9uZW50LXNldCBuYW1lXG4gKiAgIDIuIFRoZSBub2RlJ3Mgb3duIG5hbWUsIGlmIG5vdCBhIGRlZmF1bHQgRmlnbWEgbmFtZVxuICogICAzLiBOZWFyZXN0IG5hbWVkIGFuY2VzdG9yICsgXCItaWNvblwiIHN1ZmZpeFxuICogICA0LiBcImljb25cIiBmYWxsYmFja1xuICovXG5mdW5jdGlvbiBnZXRJY29uQmFzZU5hbWUobm9kZTogU2NlbmVOb2RlKTogc3RyaW5nIHtcbiAgbGV0IGJhc2VOYW1lID0gbm9kZS5uYW1lIHx8ICcnO1xuXG4gIGlmIChub2RlLnR5cGUgPT09ICdJTlNUQU5DRScpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWFpbiA9IChub2RlIGFzIEluc3RhbmNlTm9kZSkubWFpbkNvbXBvbmVudDtcbiAgICAgIGlmIChtYWluKSB7XG4gICAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IG1haW4ucGFyZW50Py50eXBlID09PSAnQ09NUE9ORU5UX1NFVCdcbiAgICAgICAgICA/IChtYWluLnBhcmVudCBhcyBhbnkpLm5hbWVcbiAgICAgICAgICA6IG1haW4ubmFtZTtcbiAgICAgICAgaWYgKGNhbmRpZGF0ZSAmJiAhaXNEZWZhdWx0TGF5ZXJOYW1lKGNhbmRpZGF0ZSkpIHtcbiAgICAgICAgICBiYXNlTmFtZSA9IGNhbmRpZGF0ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gbWFpbkNvbXBvbmVudCBhY2Nlc3MgY2FuIHRocm93IG9uIGRldGFjaGVkIGluc3RhbmNlcyBcdTIwMTQgZmFsbCB0aHJvdWdoXG4gICAgfVxuICB9XG5cbiAgaWYgKCFiYXNlTmFtZSB8fCBpc0RlZmF1bHRMYXllck5hbWUoYmFzZU5hbWUpKSB7XG4gICAgbGV0IHA6IEJhc2VOb2RlIHwgbnVsbCA9IG5vZGUucGFyZW50O1xuICAgIHdoaWxlIChwICYmICduYW1lJyBpbiBwICYmIGlzRGVmYXVsdExheWVyTmFtZSgocCBhcyBhbnkpLm5hbWUpKSB7XG4gICAgICBwID0gKHAgYXMgYW55KS5wYXJlbnQ7XG4gICAgfVxuICAgIGlmIChwICYmICduYW1lJyBpbiBwICYmIChwIGFzIGFueSkubmFtZSAmJiAhaXNEZWZhdWx0TGF5ZXJOYW1lKChwIGFzIGFueSkubmFtZSkpIHtcbiAgICAgIGJhc2VOYW1lID0gYCR7KHAgYXMgYW55KS5uYW1lfS1pY29uYDtcbiAgICB9IGVsc2Uge1xuICAgICAgYmFzZU5hbWUgPSAnaWNvbic7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJhc2VOYW1lO1xufVxuXG4vKipcbiAqIERlZHVwIGtleSBcdTIwMTQgY29sbGFwc2VzIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBsaWJyYXJ5IGljb24gaW50b1xuICogYSBzaW5nbGUgZXhwb3J0LiBTdGFuZGFsb25lIHZlY3RvciBub2RlcyBkZWR1cCBieSB0aGVpciBvd24gaWQuXG4gKi9cbmZ1bmN0aW9uIGRlZHVwZUtleShub2RlOiBTY2VuZU5vZGUpOiBzdHJpbmcge1xuICBpZiAobm9kZS50eXBlID09PSAnSU5TVEFOQ0UnKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1haW4gPSAobm9kZSBhcyBJbnN0YW5jZU5vZGUpLm1haW5Db21wb25lbnQ7XG4gICAgICBpZiAobWFpbikgcmV0dXJuIGBtYzoke21haW4uaWR9YDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIGZhbGwgdGhyb3VnaFxuICAgIH1cbiAgfVxuICByZXR1cm4gYG46JHtub2RlLmlkfWA7XG59XG5cbi8qKlxuICogQnVpbGQgdGhlIGNhbm9uaWNhbCBNYXA8bm9kZUlkLCBzdmdGaWxlbmFtZT4gZm9yIGEgcGFnZSBmcmFtZS5cbiAqIEJvdGggaW1hZ2UtZXhwb3J0ZXIgYW5kIHNlY3Rpb24tcGFyc2VyIGNvbnN1bWUgdGhpcyBzbyB0aGV5IGFncmVlIG9uXG4gKiB3aGljaCBub2RlcyBhcmUgaWNvbnMgQU5EIHdoYXQgZmlsZW5hbWUgZWFjaCBpY29uIGVuZHMgdXAgd2l0aC5cbiAqXG4gKiBHdWFyYW50ZWVzOlxuICogICAtIEV2ZXJ5IGVudHJ5J3MgZmlsZW5hbWUgaXMgdW5pcXVlIGFjcm9zcyB0aGUgcmV0dXJuZWQgbWFwLlxuICogICAtIE11bHRpcGxlIElOU1RBTkNFIG5vZGVzIG9mIHRoZSBzYW1lIG1haW4gY29tcG9uZW50IG1hcCB0byB0aGUgc2FtZVxuICogICAgIGZpbGVuYW1lIChvbmUgc2hhcmVkIFNWRyBmaWxlIGZvciB0aGUgcGFnZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEljb25GaWxlbmFtZU1hcChyb290OiBTY2VuZU5vZGUpOiBNYXA8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3Qgbm9kZUlkVG9GaWxlbmFtZSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IGRlZHVwS2V5VG9GaWxlbmFtZSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IHVzZWRGaWxlbmFtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IG5vZGUgb2YgZmluZEljb25Ob2Rlcyhyb290KSkge1xuICAgIGNvbnN0IGtleSA9IGRlZHVwZUtleShub2RlKTtcbiAgICBsZXQgZmlsZW5hbWUgPSBkZWR1cEtleVRvRmlsZW5hbWUuZ2V0KGtleSk7XG4gICAgaWYgKCFmaWxlbmFtZSkge1xuICAgICAgY29uc3QgYmFzZSA9IHNsdWdpZnkoZ2V0SWNvbkJhc2VOYW1lKG5vZGUpKSB8fCAnaWNvbic7XG4gICAgICBmaWxlbmFtZSA9IGAke2Jhc2V9LnN2Z2A7XG4gICAgICBsZXQgaSA9IDI7XG4gICAgICB3aGlsZSAodXNlZEZpbGVuYW1lcy5oYXMoZmlsZW5hbWUpKSB7XG4gICAgICAgIGZpbGVuYW1lID0gYCR7YmFzZX0tJHtpKyt9LnN2Z2A7XG4gICAgICB9XG4gICAgICB1c2VkRmlsZW5hbWVzLmFkZChmaWxlbmFtZSk7XG4gICAgICBkZWR1cEtleVRvRmlsZW5hbWUuc2V0KGtleSwgZmlsZW5hbWUpO1xuICAgIH1cbiAgICBub2RlSWRUb0ZpbGVuYW1lLnNldChub2RlLmlkLCBmaWxlbmFtZSk7XG4gIH1cblxuICByZXR1cm4gbm9kZUlkVG9GaWxlbmFtZTtcbn1cbiIsICJpbXBvcnQge1xuICBTZWN0aW9uU3BlY3MsIERlc2lnblRva2VucywgRXhwb3J0TWFuaWZlc3QsIEV4cG9ydE1hbmlmZXN0UGFnZSxcbiAgUmVzcG9uc2l2ZVBhaXIsIFJlc3BvbnNpdmVNYXAsIFBhZ2VUb2tlbnMsIEltYWdlTWFwLCBGb250VG9rZW5JbmZvLFxuICBSZXNwb25zaXZlT3ZlcnJpZGUsIFNlY3Rpb25TcGVjLCBGYWlsZWRFeHBvcnQsXG59IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgc2x1Z2lmeSwgdG9MYXlvdXROYW1lIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBjb2xsZWN0Q29sb3JzIH0gZnJvbSAnLi9jb2xvcic7XG5pbXBvcnQgeyBjb2xsZWN0Rm9udHMsIGNvdW50VGV4dE5vZGVzIH0gZnJvbSAnLi90eXBvZ3JhcGh5JztcbmltcG9ydCB7IGNvbGxlY3RTcGFjaW5nIH0gZnJvbSAnLi9zcGFjaW5nJztcbmltcG9ydCB7IHBhcnNlU2VjdGlvbnMgfSBmcm9tICcuL3NlY3Rpb24tcGFyc2VyJztcbmltcG9ydCB7IG1hdGNoUmVzcG9uc2l2ZUZyYW1lcyB9IGZyb20gJy4vcmVzcG9uc2l2ZSc7XG5pbXBvcnQgeyBidWlsZEV4cG9ydFRhc2tzLCBleGVjdXRlQmF0Y2hFeHBvcnQsIGJ1aWxkSW1hZ2VNYXAsIGJ1aWxkSW1hZ2VGaWxlbmFtZU1hcCB9IGZyb20gJy4vaW1hZ2UtZXhwb3J0ZXInO1xuaW1wb3J0IHsgZXh0cmFjdFZhcmlhYmxlcyB9IGZyb20gJy4vdmFyaWFibGVzJztcbmltcG9ydCB7IG5vcm1hbGl6ZVNlY3Rpb25OYW1lIH0gZnJvbSAnLi9wYXR0ZXJucyc7XG5pbXBvcnQgeyBidWlsZEljb25GaWxlbmFtZU1hcCB9IGZyb20gJy4vaWNvbi1kZXRlY3Rvcic7XG5cbi8qKlxuICogTWFzdGVyIGV4dHJhY3Rpb24gb3JjaGVzdHJhdG9yLlxuICogQ29vcmRpbmF0ZXMgYWxsIG1vZHVsZXMgZm9yIHRoZSBzZWxlY3RlZCBmcmFtZXMgYW5kIHNlbmRzIHJlc3VsdHMgdG8gVUkuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5FeHRyYWN0aW9uKFxuICBmcmFtZUlkczogc3RyaW5nW10sXG4gIHJlc3BvbnNpdmVQYWlyczogUmVzcG9uc2l2ZVBhaXJbXSxcbiAgc2VuZE1lc3NhZ2U6IChtc2c6IGFueSkgPT4gdm9pZCxcbiAgc2hvdWxkQ2FuY2VsOiAoKSA9PiBib29sZWFuLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGFsbERlc2lnblRva2VuQ29sb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGNvbnN0IGFsbERlc2lnblRva2VuRm9udHM6IFJlY29yZDxzdHJpbmcsIEZvbnRUb2tlbkluZm8+ID0ge307XG4gIGNvbnN0IGFsbFNwYWNpbmdWYWx1ZXMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgY29uc3QgbWFuaWZlc3RQYWdlczogRXhwb3J0TWFuaWZlc3RQYWdlW10gPSBbXTtcbiAgY29uc3QgYWxsRmFpbGVkRXhwb3J0czogRmFpbGVkRXhwb3J0W10gPSBbXTtcbiAgbGV0IHRvdGFsU2VjdGlvbnMgPSAwO1xuICBsZXQgdG90YWxJbWFnZXMgPSAwO1xuXG4gIC8vIFByZS1jb21wdXRlIHRoZSBzZXQgb2Ygc2VjdGlvbiBuYW1lcyB0aGF0IGFwcGVhciBvbiBcdTIyNjUyIHNlbGVjdGVkIHBhZ2VzLlxuICAvLyBUaGVzZSBhcmUgY2FuZGlkYXRlcyBmb3IgZ2xvYmFsIFdQIHRoZW1lIHBhcnRzIChoZWFkZXIucGhwIC8gZm9vdGVyLnBocFxuICAvLyAvIHRlbXBsYXRlLXBhcnRzKS4gcGFyc2VTZWN0aW9ucyB3aWxsIG1hcmsgbWF0Y2hpbmcgc2VjdGlvbnMgaXNHbG9iYWwuXG4gIGNvbnN0IGdsb2JhbE5hbWVzID0gY29tcHV0ZUdsb2JhbFNlY3Rpb25OYW1lcyhyZXNwb25zaXZlUGFpcnMpO1xuXG4gIC8vIFByb2Nlc3MgZWFjaCByZXNwb25zaXZlIHBhaXIgKGVhY2ggPSBvbmUgcGFnZSlcbiAgZm9yIChjb25zdCBwYWlyIG9mIHJlc3BvbnNpdmVQYWlycykge1xuICAgIGlmIChzaG91bGRDYW5jZWwoKSkgcmV0dXJuO1xuXG4gICAgY29uc3QgZGVza3RvcE5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChwYWlyLmRlc2t0b3AuZnJhbWVJZCk7XG4gICAgaWYgKCFkZXNrdG9wTm9kZSB8fCBkZXNrdG9wTm9kZS50eXBlICE9PSAnRlJBTUUnKSBjb250aW51ZTtcbiAgICBjb25zdCBkZXNrdG9wRnJhbWUgPSBkZXNrdG9wTm9kZSBhcyBGcmFtZU5vZGU7XG5cbiAgICBzZW5kTWVzc2FnZSh7XG4gICAgICB0eXBlOiAnRVhQT1JUX1BST0dSRVNTJyxcbiAgICAgIGN1cnJlbnQ6IDAsXG4gICAgICB0b3RhbDogMTAwLFxuICAgICAgbGFiZWw6IGBFeHRyYWN0aW5nIFwiJHtwYWlyLnBhZ2VOYW1lfVwiLi4uYCxcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCdWlsZCB0aGUgaWNvbiBBTkQgcmFzdGVyLWltYWdlIGZpbGVuYW1lIG1hcHMgRklSU1Qgc28gc2VjdGlvbi1wYXJzZXJcbiAgICAvLyAgICBhbmQgaW1hZ2UtZXhwb3J0ZXIgYWdyZWUgb24gKGEpIHdoaWNoIG5vZGVzIGFyZSBpY29ucyB2cyByYXN0ZXJcbiAgICAvLyAgICBpbWFnZXMgYW5kIChiKSB3aGF0IGZpbGVuYW1lIGVhY2ggb25lIHJlY2VpdmVzLiBXaXRob3V0IHRoaXMgc2hhcmVkXG4gICAgLy8gICAgc3RhdGUgdGhlIHNwZWMgZW5kcyB1cCByZWZlcmVuY2luZyBmaWxlcyB0aGF0IG5ldmVyIG1hZGUgaXQgaW50b1xuICAgIC8vICAgIHRoZSBaSVAsIHdoaWNoIGlzIHRoZSBvcmlnaW5hbCBcImljb24vaW1hZ2UgbWlzc2luZ1wiIGJ1Zy4gXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaWNvbk1hcCA9IGJ1aWxkSWNvbkZpbGVuYW1lTWFwKGRlc2t0b3BGcmFtZSk7XG4gICAgY29uc3QgaWNvblJvb3RJZHMgPSBuZXcgU2V0KGljb25NYXAua2V5cygpKTtcbiAgICBjb25zdCBpbWFnZU1hcCA9IGJ1aWxkSW1hZ2VGaWxlbmFtZU1hcChkZXNrdG9wRnJhbWUsIGljb25Sb290SWRzKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBQYXJzZSBzZWN0aW9ucyBmcm9tIGRlc2t0b3AgZnJhbWUgXHUyNTAwXHUyNTAwXG4gICAgY29uc3Qgc2VjdGlvbnMgPSBwYXJzZVNlY3Rpb25zKGRlc2t0b3BGcmFtZSwgaWNvbk1hcCwgaW1hZ2VNYXAsIGdsb2JhbE5hbWVzKTtcbiAgICBjb25zdCBzZWN0aW9uQ291bnQgPSBPYmplY3Qua2V5cyhzZWN0aW9ucykubGVuZ3RoO1xuICAgIHRvdGFsU2VjdGlvbnMgKz0gc2VjdGlvbkNvdW50O1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1lcmdlIHJlc3BvbnNpdmUgb3ZlcnJpZGVzIGZyb20gbW9iaWxlIGZyYW1lIFx1MjUwMFx1MjUwMFxuICAgIGlmIChwYWlyLm1vYmlsZSkge1xuICAgICAgY29uc3QgbW9iaWxlTm9kZSA9IGZpZ21hLmdldE5vZGVCeUlkKHBhaXIubW9iaWxlLmZyYW1lSWQpO1xuICAgICAgaWYgKG1vYmlsZU5vZGUgJiYgbW9iaWxlTm9kZS50eXBlID09PSAnRlJBTUUnKSB7XG4gICAgICAgIGNvbnN0IG1vYmlsZUZyYW1lID0gbW9iaWxlTm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICAgIGNvbnN0IG1vYmlsZUljb25NYXAgPSBidWlsZEljb25GaWxlbmFtZU1hcChtb2JpbGVGcmFtZSk7XG4gICAgICAgIGNvbnN0IG1vYmlsZUljb25Sb290SWRzID0gbmV3IFNldChtb2JpbGVJY29uTWFwLmtleXMoKSk7XG4gICAgICAgIGNvbnN0IG1vYmlsZUltYWdlTWFwID0gYnVpbGRJbWFnZUZpbGVuYW1lTWFwKG1vYmlsZUZyYW1lLCBtb2JpbGVJY29uUm9vdElkcyk7XG4gICAgICAgIGNvbnN0IG1vYmlsZVNlY3Rpb25zID0gcGFyc2VTZWN0aW9ucyhtb2JpbGVGcmFtZSwgbW9iaWxlSWNvbk1hcCwgbW9iaWxlSW1hZ2VNYXAsIGdsb2JhbE5hbWVzKTtcbiAgICAgICAgbWVyZ2VSZXNwb25zaXZlRGF0YShzZWN0aW9ucywgbW9iaWxlU2VjdGlvbnMsIHBhaXIubW9iaWxlLndpZHRoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQ29sbGVjdCB0b2tlbnMgZm9yIHRoaXMgcGFnZSBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBjb2xvcnMgPSBjb2xsZWN0Q29sb3JzKGRlc2t0b3BGcmFtZSk7XG4gICAgY29uc3QgZm9udHMgPSBjb2xsZWN0Rm9udHMoZGVza3RvcEZyYW1lKTtcbiAgICBjb25zdCBzcGFjaW5nID0gY29sbGVjdFNwYWNpbmcoZGVza3RvcEZyYW1lKTtcblxuICAgIC8vIEJ1aWxkIHBhZ2UgdG9rZW5zXG4gICAgY29uc3QgcGFnZVRva2VuczogUGFnZVRva2VucyA9IHtcbiAgICAgIGNvbG9ycyxcbiAgICAgIGZvbnRzOiBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKGZvbnRzKS5tYXAoKFtmYW1pbHksIGRhdGFdKSA9PiBbZmFtaWx5LCB7XG4gICAgICAgICAgc3R5bGVzOiBbLi4uZGF0YS5zdHlsZXNdLFxuICAgICAgICAgIHNpemVzOiBbLi4uZGF0YS5zaXplc10uc29ydCgoYSwgYikgPT4gYSAtIGIpLFxuICAgICAgICAgIGNvdW50OiBkYXRhLmNvdW50LFxuICAgICAgICB9XSlcbiAgICAgICksXG4gICAgICBzcGFjaW5nLFxuICAgICAgc2VjdGlvbnM6IGJ1aWxkVG9rZW5TZWN0aW9ucyhkZXNrdG9wRnJhbWUsIHBhaXIucGFnZVNsdWcpLFxuICAgIH07XG5cbiAgICAvLyBNZXJnZSBpbnRvIGdsb2JhbCB0b2tlbnNcbiAgICBmb3IgKGNvbnN0IFtoZXgsIGNvdW50XSBvZiBPYmplY3QuZW50cmllcyhjb2xvcnMpKSB7XG4gICAgICBpZiAoY291bnQgPj0gMikge1xuICAgICAgICBjb25zdCB2YXJOYW1lID0gYC0tY2xyLSR7aGV4LnNsaWNlKDEpLnRvTG93ZXJDYXNlKCl9YDtcbiAgICAgICAgYWxsRGVzaWduVG9rZW5Db2xvcnNbdmFyTmFtZV0gPSBoZXg7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgW2ZhbWlseSwgZGF0YV0gb2YgT2JqZWN0LmVudHJpZXMoZm9udHMpKSB7XG4gICAgICBhbGxEZXNpZ25Ub2tlbkZvbnRzW2ZhbWlseV0gPSB7XG4gICAgICAgIHN0eWxlczogWy4uLmRhdGEuc3R5bGVzXSxcbiAgICAgICAgc2l6ZXM6IFsuLi5kYXRhLnNpemVzXS5zb3J0KChhLCBiKSA9PiBhIC0gYiksXG4gICAgICAgIGNvdW50OiBkYXRhLmNvdW50LFxuICAgICAgfTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBzIG9mIHNwYWNpbmcpIHtcbiAgICAgIGFsbFNwYWNpbmdWYWx1ZXMuYWRkKHMudmFsdWUpO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBFeHBvcnQgaW1hZ2VzIGFuZCBzY3JlZW5zaG90cyBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBleHBvcnRUYXNrcyA9IGJ1aWxkRXhwb3J0VGFza3MoZGVza3RvcEZyYW1lLCBwYWlyLnBhZ2VTbHVnLCBpY29uTWFwLCBpbWFnZU1hcCk7XG4gICAgY29uc3QgYXNzZXRDb3VudCA9IGV4cG9ydFRhc2tzLmZpbHRlcih0ID0+IHQudHlwZSA9PT0gJ2Fzc2V0JykubGVuZ3RoO1xuICAgIHRvdGFsSW1hZ2VzICs9IGFzc2V0Q291bnQ7XG5cbiAgICBjb25zdCBwYWdlRmFpbHVyZXMgPSBhd2FpdCBleGVjdXRlQmF0Y2hFeHBvcnQoXG4gICAgICBleHBvcnRUYXNrcyxcbiAgICAgIChjdXJyZW50LCB0b3RhbCwgbGFiZWwpID0+IHtcbiAgICAgICAgc2VuZE1lc3NhZ2UoeyB0eXBlOiAnRVhQT1JUX1BST0dSRVNTJywgY3VycmVudCwgdG90YWwsIGxhYmVsIH0pO1xuICAgICAgfSxcbiAgICAgICh0YXNrLCBkYXRhKSA9PiB7XG4gICAgICAgIGlmICh0YXNrLnR5cGUgPT09ICdzY3JlZW5zaG90JyB8fCB0YXNrLnR5cGUgPT09ICdmdWxsLXBhZ2UnKSB7XG4gICAgICAgICAgc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogJ1NDUkVFTlNIT1RfREFUQScsXG4gICAgICAgICAgICBwYXRoOiBgJHt0YXNrLnBhZ2VQYXRofS9zY3JlZW5zaG90c2AsXG4gICAgICAgICAgICBmaWxlbmFtZTogdGFzay5maWxlbmFtZSxcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogJ0lNQUdFX0RBVEEnLFxuICAgICAgICAgICAgcGF0aDogYCR7dGFzay5wYWdlUGF0aH0vaW1hZ2VzYCxcbiAgICAgICAgICAgIGZpbGVuYW1lOiB0YXNrLmZpbGVuYW1lLFxuICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHNob3VsZENhbmNlbCxcbiAgICApO1xuICAgIGFsbEZhaWxlZEV4cG9ydHMucHVzaCguLi5wYWdlRmFpbHVyZXMpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFBhdGNoIGljb25GaWxlIHJlZmVyZW5jZXMgZm9yIGZhaWxlZC9mYWxsYmFjayBTVkcgZXhwb3J0cy5cbiAgICAvLyAgICBJZiBTVkcgZXhwb3J0IGZhaWxlZCBidXQgUE5HIGZhbGxiYWNrIHN1Y2NlZWRlZCwgcmVkaXJlY3RcbiAgICAvLyAgICBpY29uRmlsZSB0byB0aGUgLnBuZy4gSWYgYm90aCBmYWlsZWQsIGRyb3AgaWNvbkZpbGUgKGFsdCB0ZXh0XG4gICAgLy8gICAgc3RpbGwgc3Vydml2ZXMgc28gdGhlIGFnZW50IGhhcyBhIHRleHR1YWwgY3VlKS4gXHUyNTAwXHUyNTAwXG4gICAgaWYgKHBhZ2VGYWlsdXJlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBmYWxsYmFja01hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gICAgICBjb25zdCBkcm9wcGVkU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBmb3IgKGNvbnN0IGYgb2YgcGFnZUZhaWx1cmVzKSB7XG4gICAgICAgIGlmIChmLmZhbGxiYWNrRmlsZW5hbWUpIGZhbGxiYWNrTWFwLnNldChmLmZpbGVuYW1lLCBmLmZhbGxiYWNrRmlsZW5hbWUpO1xuICAgICAgICBlbHNlIGRyb3BwZWRTZXQuYWRkKGYuZmlsZW5hbWUpO1xuICAgICAgfVxuICAgICAgcGF0Y2hJY29uUmVmZXJlbmNlcyhzZWN0aW9ucywgZmFsbGJhY2tNYXAsIGRyb3BwZWRTZXQpO1xuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCdWlsZCBzZWN0aW9uLXNwZWNzLmpzb24gKG5vdyB3aXRoIHBhdGNoZWQgaWNvbkZpbGUgcmVmcykgXHUyNTAwXHUyNTAwXG4gICAgY29uc3Qgc2VjdGlvblNwZWNzOiBTZWN0aW9uU3BlY3MgPSB7XG4gICAgICBmaWdtYV9jYW52YXNfd2lkdGg6IE1hdGgucm91bmQoZGVza3RvcEZyYW1lLndpZHRoKSxcbiAgICAgIGZpZ21hX2NhbnZhc19oZWlnaHQ6IE1hdGgucm91bmQoZGVza3RvcEZyYW1lLmhlaWdodCksXG4gICAgICBtb2JpbGVfY2FudmFzX3dpZHRoOiBwYWlyLm1vYmlsZT8ud2lkdGgsXG4gICAgICBwYWdlX3NsdWc6IHBhaXIucGFnZVNsdWcsXG4gICAgICBleHRyYWN0ZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIGV4dHJhY3Rpb25fbWV0aG9kOiAncGx1Z2luJyxcbiAgICAgIHNlY3Rpb25zLFxuICAgIH07XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgR2VuZXJhdGUgc3BlYy5tZCBBRlRFUiBwYXRjaGVzIHNvIGl0IG1hdGNoZXMgc2VjdGlvbi1zcGVjcyBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBzcGVjTWQgPSBnZW5lcmF0ZVNwZWNNZChwYWlyLnBhZ2VOYW1lLCBwYWlyLnBhZ2VTbHVnLCBzZWN0aW9uU3BlY3MsIHBhZ2VUb2tlbnMpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIFNlbmQgcGFnZSBkYXRhIHRvIFVJIChwb3N0LWV4cG9ydCBzbyBpY29uRmlsZSByZWZzIGFyZSBhY2N1cmF0ZSkgXHUyNTAwXHUyNTAwXG4gICAgc2VuZE1lc3NhZ2Uoe1xuICAgICAgdHlwZTogJ1BBR0VfREFUQScsXG4gICAgICBwYWdlU2x1ZzogcGFpci5wYWdlU2x1ZyxcbiAgICAgIHNlY3Rpb25TcGVjcyxcbiAgICAgIHNwZWNNZCxcbiAgICAgIHRva2VuczogcGFnZVRva2VucyxcbiAgICB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBCdWlsZCBhbmQgc2VuZCBpbWFnZSBtYXAgXHUyNTAwXHUyNTAwXG4gICAgY29uc3Qgc2VjdGlvbkNoaWxkcmVuID0gZGVza3RvcEZyYW1lLmNoaWxkcmVuXG4gICAgICAuZmlsdGVyKGMgPT4gYy52aXNpYmxlICE9PSBmYWxzZSlcbiAgICAgIC5tYXAoYyA9PiAoeyBuYW1lOiBjLm5hbWUsIGNoaWxkcmVuOiAnY2hpbGRyZW4nIGluIGMgPyBbLi4uKGMgYXMgRnJhbWVOb2RlKS5jaGlsZHJlbl0gOiBbXSB9KSk7XG4gICAgY29uc3QgaW1hZ2VNYXBKc29uID0gYnVpbGRJbWFnZU1hcChleHBvcnRUYXNrcywgc2VjdGlvbkNoaWxkcmVuLCBpY29uTWFwLCBpbWFnZU1hcCk7XG4gICAgc2VuZE1lc3NhZ2Uoe1xuICAgICAgdHlwZTogJ0lNQUdFX01BUF9EQVRBJyxcbiAgICAgIHBhdGg6IGBwYWdlcy8ke3BhaXIucGFnZVNsdWd9L2ltYWdlc2AsXG4gICAgICBpbWFnZU1hcDogaW1hZ2VNYXBKc29uLFxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEJ1aWxkIG1hbmlmZXN0IHBhZ2UgZW50cnkgXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgaGFzRnVsbFBhZ2UgPSBleHBvcnRUYXNrcy5zb21lKHQgPT4gdC50eXBlID09PSAnZnVsbC1wYWdlJyk7XG4gICAgbWFuaWZlc3RQYWdlcy5wdXNoKHtcbiAgICAgIHNsdWc6IHBhaXIucGFnZVNsdWcsXG4gICAgICBmcmFtZU5hbWU6IHBhaXIuZGVza3RvcC5mcmFtZU5hbWUsXG4gICAgICBmcmFtZUlkOiBwYWlyLmRlc2t0b3AuZnJhbWVJZCxcbiAgICAgIGNhbnZhc1dpZHRoOiBNYXRoLnJvdW5kKGRlc2t0b3BGcmFtZS53aWR0aCksXG4gICAgICBjYW52YXNIZWlnaHQ6IE1hdGgucm91bmQoZGVza3RvcEZyYW1lLmhlaWdodCksXG4gICAgICBzZWN0aW9uQ291bnQsXG4gICAgICBpbWFnZUNvdW50OiBhc3NldENvdW50LFxuICAgICAgaGFzUmVzcG9uc2l2ZTogcGFpci5tb2JpbGUgIT09IG51bGwsXG4gICAgICBtb2JpbGVGcmFtZUlkOiBwYWlyLm1vYmlsZT8uZnJhbWVJZCA/PyBudWxsLFxuICAgICAgaW50ZXJhY3Rpb25Db3VudDogT2JqZWN0LnZhbHVlcyhzZWN0aW9ucylcbiAgICAgICAgLnJlZHVjZSgoc3VtLCBzKSA9PiBzdW0gKyAocy5pbnRlcmFjdGlvbnM/Lmxlbmd0aCA/PyAwKSwgMCksXG4gICAgICBoYXNGdWxsUGFnZVNjcmVlbnNob3Q6IGhhc0Z1bGxQYWdlLFxuICAgICAgZnVsbFBhZ2VTY3JlZW5zaG90RmlsZTogaGFzRnVsbFBhZ2UgPyAnX2Z1bGwtcGFnZS5wbmcnIDogbnVsbCxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBCdWlsZCBmaW5hbCBtYW5pZmVzdCBhbmQgZ2xvYmFsIHRva2VucyBcdTI1MDBcdTI1MDBcbiAgY29uc3QgbWFuaWZlc3Q6IEV4cG9ydE1hbmlmZXN0ID0ge1xuICAgIGV4cG9ydFZlcnNpb246ICcxLjAnLFxuICAgIGV4cG9ydERhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBmaWdtYUZpbGVOYW1lOiBmaWdtYS5yb290Lm5hbWUsXG4gICAgZmlnbWFGaWxlS2V5OiBmaWdtYS5maWxlS2V5ID8/ICcnLFxuICAgIHBsdWdpblZlcnNpb246ICcxLjAuMCcsXG4gICAgcGFnZXM6IG1hbmlmZXN0UGFnZXMsXG4gICAgdG90YWxTZWN0aW9ucyxcbiAgICB0b3RhbEltYWdlcyxcbiAgICBkZXNpZ25Ub2tlbnNTdW1tYXJ5OiB7XG4gICAgICBjb2xvckNvdW50OiBPYmplY3Qua2V5cyhhbGxEZXNpZ25Ub2tlbkNvbG9ycykubGVuZ3RoLFxuICAgICAgZm9udENvdW50OiBPYmplY3Qua2V5cyhhbGxEZXNpZ25Ub2tlbkZvbnRzKS5sZW5ndGgsXG4gICAgICBzcGFjaW5nVmFsdWVzOiBhbGxTcGFjaW5nVmFsdWVzLnNpemUsXG4gICAgfSxcbiAgICBmYWlsZWRFeHBvcnRzOiBhbGxGYWlsZWRFeHBvcnRzLmxlbmd0aCA+IDAgPyBhbGxGYWlsZWRFeHBvcnRzIDogdW5kZWZpbmVkLFxuICB9O1xuXG4gIC8vIEZpZ21hIFZhcmlhYmxlcyAoYXV0aG9yaXRhdGl2ZSB0b2tlbiBuYW1lcyB3aGVuIGF2YWlsYWJsZSlcbiAgY29uc3QgdmFyaWFibGVzID0gZXh0cmFjdFZhcmlhYmxlcygpO1xuXG4gIGNvbnN0IGRlc2lnblRva2VuczogRGVzaWduVG9rZW5zID0ge1xuICAgIGNvbG9yczogYWxsRGVzaWduVG9rZW5Db2xvcnMsXG4gICAgZm9udHM6IGFsbERlc2lnblRva2VuRm9udHMsXG4gICAgc3BhY2luZzogWy4uLmFsbFNwYWNpbmdWYWx1ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKSxcbiAgICB2YXJpYWJsZXM6IHZhcmlhYmxlcy5wcmVzZW50ID8gdmFyaWFibGVzIDogdW5kZWZpbmVkLFxuICB9O1xuXG4gIC8vIFdoZW4gRmlnbWEgVmFyaWFibGVzIGFyZSBhdmFpbGFibGUsIHByZWZlciB2YXJpYWJsZSBuYW1lcyBmb3IgY29sb3JzOlxuICAvLyBvdmVyd3JpdGUgdGhlIGF1dG8tZ2VuZXJhdGVkIC0tY2xyLTxoZXg+IHdpdGggLS1jbHItPHZhcmlhYmxlLW5hbWU+XG4gIGlmICh2YXJpYWJsZXMucHJlc2VudCkge1xuICAgIGZvciAoY29uc3QgW2NvbE5hbWUsIHZhcnNdIG9mIE9iamVjdC5lbnRyaWVzKHZhcmlhYmxlcy5jb2xsZWN0aW9ucykpIHtcbiAgICAgIGlmICghY29sTmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdjb2xvcicpKSBjb250aW51ZTtcbiAgICAgIGZvciAoY29uc3QgW3Zhck5hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh2YXJzKSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAhdmFsdWUuc3RhcnRzV2l0aCgnIycpKSBjb250aW51ZTtcbiAgICAgICAgY29uc3Qgc2FmZU5hbWUgPSB2YXJOYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvW15hLXowLTldKy9nLCAnLScpLnJlcGxhY2UoLy0rL2csICctJykucmVwbGFjZSgvXi18LSQvZywgJycpO1xuICAgICAgICBjb25zdCBjc3NWYXIgPSBgLS1jbHItJHtzYWZlTmFtZX1gO1xuICAgICAgICBhbGxEZXNpZ25Ub2tlbkNvbG9yc1tjc3NWYXJdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIGRlc2lnblRva2Vucy5jb2xvcnMgPSBhbGxEZXNpZ25Ub2tlbkNvbG9ycztcbiAgfVxuXG4gIC8vIEJ1aWxkIHJlc3BvbnNpdmUgbWFwIGZyb20gdGhlIHBhaXJzXG4gIGNvbnN0IHJlc3BvbnNpdmVNYXAgPSBtYXRjaFJlc3BvbnNpdmVGcmFtZXMoXG4gICAgcmVzcG9uc2l2ZVBhaXJzLmZsYXRNYXAocCA9PiB7XG4gICAgICBjb25zdCBmcmFtZXMgPSBbe1xuICAgICAgICBpZDogcC5kZXNrdG9wLmZyYW1lSWQsXG4gICAgICAgIG5hbWU6IHAuZGVza3RvcC5mcmFtZU5hbWUsXG4gICAgICAgIHdpZHRoOiBwLmRlc2t0b3Aud2lkdGgsXG4gICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgYnJlYWtwb2ludDogJ2Rlc2t0b3AnIGFzIGNvbnN0LFxuICAgICAgICBzZWN0aW9uQ291bnQ6IDAsXG4gICAgICAgIGhhc0F1dG9MYXlvdXQ6IGZhbHNlLFxuICAgICAgICByZXNwb25zaXZlUGFpcklkOiBudWxsLFxuICAgICAgfV07XG4gICAgICBpZiAocC5tb2JpbGUpIHtcbiAgICAgICAgZnJhbWVzLnB1c2goe1xuICAgICAgICAgIGlkOiBwLm1vYmlsZS5mcmFtZUlkLFxuICAgICAgICAgIG5hbWU6IHAubW9iaWxlLmZyYW1lTmFtZSxcbiAgICAgICAgICB3aWR0aDogcC5tb2JpbGUud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICAgIGJyZWFrcG9pbnQ6ICdtb2JpbGUnIGFzIGNvbnN0LFxuICAgICAgICAgIHNlY3Rpb25Db3VudDogMCxcbiAgICAgICAgICBoYXNBdXRvTGF5b3V0OiBmYWxzZSxcbiAgICAgICAgICByZXNwb25zaXZlUGFpcklkOiBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmcmFtZXM7XG4gICAgfSlcbiAgKTtcblxuICBzZW5kTWVzc2FnZSh7XG4gICAgdHlwZTogJ0VYUE9SVF9DT01QTEVURScsXG4gICAgbWFuaWZlc3QsXG4gICAgcmVzcG9uc2l2ZU1hcCxcbiAgICBkZXNpZ25Ub2tlbnMsXG4gIH0pO1xufVxuXG4vKipcbiAqIE1lcmdlIHJlc3BvbnNpdmUgb3ZlcnJpZGVzIGZyb20gbW9iaWxlIHNlY3Rpb25zIGludG8gZGVza3RvcCBzZWN0aW9ucy5cbiAqIE9ubHkgaW5jbHVkZXMgcHJvcGVydGllcyB0aGF0IGRpZmZlciBiZXR3ZWVuIGRlc2t0b3AgYW5kIG1vYmlsZS5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VSZXNwb25zaXZlRGF0YShcbiAgZGVza3RvcFNlY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4sXG4gIG1vYmlsZVNlY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4sXG4gIG1vYmlsZVdpZHRoOiBudW1iZXIsXG4pOiB2b2lkIHtcbiAgY29uc3QgYnBLZXkgPSBTdHJpbmcobW9iaWxlV2lkdGgpO1xuXG4gIGZvciAoY29uc3QgW2xheW91dE5hbWUsIGRlc2t0b3BTcGVjXSBvZiBPYmplY3QuZW50cmllcyhkZXNrdG9wU2VjdGlvbnMpKSB7XG4gICAgY29uc3QgbW9iaWxlU3BlYyA9IG1vYmlsZVNlY3Rpb25zW2xheW91dE5hbWVdO1xuICAgIGlmICghbW9iaWxlU3BlYykgY29udGludWU7XG5cbiAgICBjb25zdCBvdmVycmlkZTogUmVzcG9uc2l2ZU92ZXJyaWRlID0ge307XG5cbiAgICAvLyBEaWZmIHNlY3Rpb24gc3R5bGVzXG4gICAgY29uc3Qgc2VjdGlvbkRpZmY6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGRlc2t0b3BWYWxdIG9mIE9iamVjdC5lbnRyaWVzKGRlc2t0b3BTcGVjLnNlY3Rpb24pKSB7XG4gICAgICBjb25zdCBtb2JpbGVWYWwgPSAobW9iaWxlU3BlYy5zZWN0aW9uIGFzIGFueSlba2V5XTtcbiAgICAgIGlmIChtb2JpbGVWYWwgJiYgbW9iaWxlVmFsICE9PSBkZXNrdG9wVmFsKSB7XG4gICAgICAgIHNlY3Rpb25EaWZmW2tleV0gPSBtb2JpbGVWYWw7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChPYmplY3Qua2V5cyhzZWN0aW9uRGlmZikubGVuZ3RoID4gMCkge1xuICAgICAgb3ZlcnJpZGUuc2VjdGlvbiA9IHNlY3Rpb25EaWZmO1xuICAgIH1cblxuICAgIC8vIERpZmYgZWxlbWVudCBzdHlsZXNcbiAgICBjb25zdCBlbGVtZW50c0RpZmY6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIGFueT4+ID0ge307XG4gICAgZm9yIChjb25zdCBbZWxlbU5hbWUsIGRlc2t0b3BFbGVtXSBvZiBPYmplY3QuZW50cmllcyhkZXNrdG9wU3BlYy5lbGVtZW50cykpIHtcbiAgICAgIGNvbnN0IG1vYmlsZUVsZW0gPSBtb2JpbGVTcGVjLmVsZW1lbnRzW2VsZW1OYW1lXTtcbiAgICAgIGlmICghbW9iaWxlRWxlbSkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IGRpZmY6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgZGVza3RvcFZhbF0gb2YgT2JqZWN0LmVudHJpZXMoZGVza3RvcEVsZW0pKSB7XG4gICAgICAgIGNvbnN0IG1vYmlsZVZhbCA9IChtb2JpbGVFbGVtIGFzIGFueSlba2V5XTtcbiAgICAgICAgaWYgKG1vYmlsZVZhbCAhPT0gdW5kZWZpbmVkICYmIG1vYmlsZVZhbCAhPT0gZGVza3RvcFZhbCkge1xuICAgICAgICAgIGRpZmZba2V5XSA9IG1vYmlsZVZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKE9iamVjdC5rZXlzKGRpZmYpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZWxlbWVudHNEaWZmW2VsZW1OYW1lXSA9IGRpZmY7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChPYmplY3Qua2V5cyhlbGVtZW50c0RpZmYpLmxlbmd0aCA+IDApIHtcbiAgICAgIG92ZXJyaWRlLmVsZW1lbnRzID0gZWxlbWVudHNEaWZmO1xuICAgIH1cblxuICAgIC8vIERpZmYgZ3JpZFxuICAgIGlmIChtb2JpbGVTcGVjLmdyaWQuY29sdW1ucyAhPT0gZGVza3RvcFNwZWMuZ3JpZC5jb2x1bW5zIHx8IG1vYmlsZVNwZWMuZ3JpZC5nYXAgIT09IGRlc2t0b3BTcGVjLmdyaWQuZ2FwKSB7XG4gICAgICBvdmVycmlkZS5ncmlkID0ge307XG4gICAgICBpZiAobW9iaWxlU3BlYy5ncmlkLmNvbHVtbnMgIT09IGRlc2t0b3BTcGVjLmdyaWQuY29sdW1ucykge1xuICAgICAgICBvdmVycmlkZS5ncmlkLmNvbHVtbnMgPSBtb2JpbGVTcGVjLmdyaWQuY29sdW1ucztcbiAgICAgIH1cbiAgICAgIGlmIChtb2JpbGVTcGVjLmdyaWQuZ2FwICE9PSBkZXNrdG9wU3BlYy5ncmlkLmdhcCkge1xuICAgICAgICBvdmVycmlkZS5ncmlkLmdhcCA9IG1vYmlsZVNwZWMuZ3JpZC5nYXA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKE9iamVjdC5rZXlzKG92ZXJyaWRlKS5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAoIWRlc2t0b3BTcGVjLnJlc3BvbnNpdmUpIGRlc2t0b3BTcGVjLnJlc3BvbnNpdmUgPSB7fTtcbiAgICAgIGRlc2t0b3BTcGVjLnJlc3BvbnNpdmVbYnBLZXldID0gb3ZlcnJpZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGQgdG9rZW4gc2VjdGlvbiBtZXRhZGF0YSBmb3IgdG9rZW5zLmpzb24uXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkVG9rZW5TZWN0aW9ucyhmcmFtZTogRnJhbWVOb2RlLCBwYWdlU2x1Zzogc3RyaW5nKSB7XG4gIGNvbnN0IHNlY3Rpb25zID0gZnJhbWUuY2hpbGRyZW5cbiAgICAuZmlsdGVyKGMgPT5cbiAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgIChjLnR5cGUgPT09ICdGUkFNRScgfHwgYy50eXBlID09PSAnQ09NUE9ORU5UJyB8fCBjLnR5cGUgPT09ICdJTlNUQU5DRScgfHwgYy50eXBlID09PSAnR1JPVVAnKSAmJlxuICAgICAgYy5hYnNvbHV0ZUJvdW5kaW5nQm94XG4gICAgKVxuICAgIC5zb3J0KChhLCBiKSA9PiBhLmFic29sdXRlQm91bmRpbmdCb3ghLnkgLSBiLmFic29sdXRlQm91bmRpbmdCb3ghLnkpO1xuXG4gIHJldHVybiBzZWN0aW9ucy5tYXAoKHMsIGkpID0+IHtcbiAgICBjb25zdCBib3VuZHMgPSBzLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IHBhcmVudEJvdW5kcyA9IGZyYW1lLmFic29sdXRlQm91bmRpbmdCb3ghO1xuICAgIGNvbnN0IGltYWdlQ291bnQgPSBjb3VudEltYWdlcyhzKTtcbiAgICBjb25zdCB0ZXh0Tm9kZXMgPSBjb3VudFRleHROb2RlcyhzKTtcblxuICAgIHJldHVybiB7XG4gICAgICBpbmRleDogaSArIDEsXG4gICAgICBuYW1lOiBzLm5hbWUsXG4gICAgICBpZDogcy5pZCxcbiAgICAgIGRpbWVuc2lvbnM6IHsgd2lkdGg6IE1hdGgucm91bmQoYm91bmRzLndpZHRoKSwgaGVpZ2h0OiBNYXRoLnJvdW5kKGJvdW5kcy5oZWlnaHQpIH0sXG4gICAgICB5X29mZnNldDogTWF0aC5yb3VuZChib3VuZHMueSAtIHBhcmVudEJvdW5kcy55KSxcbiAgICAgIGhhc0F1dG9MYXlvdXQ6IHMudHlwZSA9PT0gJ0ZSQU1FJyAmJiAocyBhcyBGcmFtZU5vZGUpLmxheW91dE1vZGUgIT09IHVuZGVmaW5lZCAmJiAocyBhcyBGcmFtZU5vZGUpLmxheW91dE1vZGUgIT09ICdOT05FJyxcbiAgICAgIGltYWdlX2NvdW50OiBpbWFnZUNvdW50LFxuICAgICAgaW1hZ2VfZmlsZXM6IGNvbGxlY3RJbWFnZUZpbGVOYW1lcyhzKSxcbiAgICAgIHRleHRfbm9kZXM6IHRleHROb2RlcyxcbiAgICAgIHNjcmVlbnNob3Q6IGBzY3JlZW5zaG90cy8ke3NsdWdpZnkocy5uYW1lKX0ucG5nYCxcbiAgICAgIHNjcmVlbnNob3RfY29tcGxldGU6IHRydWUsXG4gICAgfTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvdW50SW1hZ2VzKG5vZGU6IFNjZW5lTm9kZSk6IG51bWJlciB7XG4gIGxldCBjb3VudCA9IDA7XG4gIGZ1bmN0aW9uIHdhbGsobjogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdmaWxscycgaW4gbiAmJiBBcnJheS5pc0FycmF5KChuIGFzIGFueSkuZmlsbHMpKSB7XG4gICAgICBpZiAoKG4gYXMgYW55KS5maWxscy5zb21lKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpKSBjb3VudCsrO1xuICAgIH1cbiAgICBpZiAoJ2NoaWxkcmVuJyBpbiBuKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIChuIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4pIHdhbGsoY2hpbGQpO1xuICAgIH1cbiAgfVxuICB3YWxrKG5vZGUpO1xuICByZXR1cm4gY291bnQ7XG59XG5cbi8qKlxuICogUHJlLWNvbXB1dGUgdGhlIHNldCBvZiBub3JtYWxpemVkIHNlY3Rpb24gbmFtZXMgdGhhdCBhcHBlYXIgb24gXHUyMjY1MiBzZWxlY3RlZFxuICogcGFnZXMuIE1hdGNoaW5nIHNlY3Rpb25zIHdpbGwgYmUgbWFya2VkIGBpc0dsb2JhbDogdHJ1ZWAgYnkgcGFyc2VTZWN0aW9uc1xuICogc28gdGhlIFdQIGFnZW50IGNhbiBob2lzdCB0aGVtIGludG8gaGVhZGVyLnBocCAvIGZvb3Rlci5waHAgLyB0ZW1wbGF0ZS1wYXJ0c1xuICogcmF0aGVyIHRoYW4gaW5saW5pbmcgdGhlIHNhbWUgbWFya3VwIG9uIGV2ZXJ5IHBhZ2UuXG4gKlxuICogVGhlIHNjYW4gbWlycm9ycyBpZGVudGlmeVNlY3Rpb25zIChkcmlsbHMgb25lIHdyYXBwZXIgZGVlcCB3aGVuIHRoZSBwYWdlXG4gKiBoYXMgYSBzaW5nbGUgY29udGFpbmVyIGNoaWxkKSBzbyB0aGUgbWF0Y2hpbmcgc3RheXMgY29uc2lzdGVudCB3aXRoIHdoYXRcbiAqIHBhcnNlU2VjdGlvbnMgYWN0dWFsbHkgdHJlYXRzIGFzIGEgXCJzZWN0aW9uXCIuXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVHbG9iYWxTZWN0aW9uTmFtZXMocGFpcnM6IFJlc3BvbnNpdmVQYWlyW10pOiBTZXQ8c3RyaW5nPiB7XG4gIGNvbnN0IG5hbWVUb1BhZ2VDb3VudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgZm9yIChjb25zdCBwYWlyIG9mIHBhaXJzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChwYWlyLmRlc2t0b3AuZnJhbWVJZCk7XG4gICAgICBpZiAoIW5vZGUgfHwgbm9kZS50eXBlICE9PSAnRlJBTUUnKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGZyYW1lID0gbm9kZSBhcyBGcmFtZU5vZGU7XG4gICAgICBsZXQgY2FuZGlkYXRlcyA9IGZyYW1lLmNoaWxkcmVuLmZpbHRlcihjID0+XG4gICAgICAgIGMudmlzaWJsZSAhPT0gZmFsc2UgJiZcbiAgICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICAgICApO1xuICAgICAgaWYgKGNhbmRpZGF0ZXMubGVuZ3RoID09PSAxICYmICdjaGlsZHJlbicgaW4gY2FuZGlkYXRlc1swXSkge1xuICAgICAgICBjb25zdCBpbm5lciA9IChjYW5kaWRhdGVzWzBdIGFzIEZyYW1lTm9kZSkuY2hpbGRyZW4uZmlsdGVyKGMgPT5cbiAgICAgICAgICBjLnZpc2libGUgIT09IGZhbHNlICYmXG4gICAgICAgICAgKGMudHlwZSA9PT0gJ0ZSQU1FJyB8fCBjLnR5cGUgPT09ICdDT01QT05FTlQnIHx8IGMudHlwZSA9PT0gJ0lOU1RBTkNFJyB8fCBjLnR5cGUgPT09ICdHUk9VUCcpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChpbm5lci5sZW5ndGggPiAxKSBjYW5kaWRhdGVzID0gaW5uZXI7XG4gICAgICB9XG4gICAgICBjb25zdCBzZWVuT25UaGlzUGFnZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgZm9yIChjb25zdCBjIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gbm9ybWFsaXplU2VjdGlvbk5hbWUoYy5uYW1lIHx8ICcnKTtcbiAgICAgICAgaWYgKCFrZXkpIGNvbnRpbnVlO1xuICAgICAgICBzZWVuT25UaGlzUGFnZS5hZGQoa2V5KTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBzZWVuT25UaGlzUGFnZSkge1xuICAgICAgICBuYW1lVG9QYWdlQ291bnQuc2V0KG5hbWUsIChuYW1lVG9QYWdlQ291bnQuZ2V0KG5hbWUpIHx8IDApICsgMSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdjb21wdXRlR2xvYmFsU2VjdGlvbk5hbWVzOiBmYWlsZWQgdG8gc2NhbiBmcmFtZScsIHBhaXIucGFnZU5hbWUsIGUpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG91dCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IFtuYW1lLCBjb3VudF0gb2YgbmFtZVRvUGFnZUNvdW50KSB7XG4gICAgaWYgKGNvdW50ID49IDIpIG91dC5hZGQobmFtZSk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gY29sbGVjdEltYWdlRmlsZU5hbWVzKG5vZGU6IFNjZW5lTm9kZSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbmFtZXM6IHN0cmluZ1tdID0gW107XG4gIGZ1bmN0aW9uIHdhbGsobjogU2NlbmVOb2RlKSB7XG4gICAgaWYgKCdmaWxscycgaW4gbiAmJiBBcnJheS5pc0FycmF5KChuIGFzIGFueSkuZmlsbHMpKSB7XG4gICAgICBpZiAoKG4gYXMgYW55KS5maWxscy5zb21lKChmOiBQYWludCkgPT4gZi50eXBlID09PSAnSU1BR0UnICYmIGYudmlzaWJsZSAhPT0gZmFsc2UpKSB7XG4gICAgICAgIG5hbWVzLnB1c2goYCR7c2x1Z2lmeShuLm5hbWUpfS5wbmdgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCdjaGlsZHJlbicgaW4gbikge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiAobiBhcyBGcmFtZU5vZGUpLmNoaWxkcmVuKSB3YWxrKGNoaWxkKTtcbiAgICB9XG4gIH1cbiAgd2Fsayhub2RlKTtcbiAgcmV0dXJuIG5hbWVzO1xufVxuXG4vKipcbiAqIFdhbGsgZXZlcnkgZWxlbWVudCBpbiB0aGUgc2VjdGlvbiBtYXAgYW5kIHJlY29uY2lsZSBgaWNvbkZpbGVgIGFnYWluc3RcbiAqIHRoZSBwb3N0LWV4cG9ydCByZWFsaXR5OlxuICogICAtIElmIHRoZSAuc3ZnIGZlbGwgYmFjayB0byAucG5nLCByZXdyaXRlIGljb25GaWxlIHRvIHRoZSAucG5nIGZpbGVuYW1lLlxuICogICAtIElmIHRoZSBleHBvcnQgZmFpbGVkIGVudGlyZWx5IHdpdGggbm8gZmFsbGJhY2ssIGRyb3AgaWNvbkZpbGUgc28gdGhlXG4gKiAgICAgYWdlbnQgZG9lc24ndCByZWZlcmVuY2UgYSBub24tZXhpc3RlbnQgYXNzZXQgKGFsdCB0ZXh0IHN0aWxsXG4gKiAgICAgc3Vydml2ZXMgYXMgYSB0ZXh0dWFsIGN1ZSkuXG4gKi9cbmZ1bmN0aW9uIHBhdGNoSWNvblJlZmVyZW5jZXMoXG4gIHNlY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBTZWN0aW9uU3BlYz4sXG4gIGZhbGxiYWNrTWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuICBkcm9wcGVkU2V0OiBTZXQ8c3RyaW5nPixcbik6IHZvaWQge1xuICBmb3IgKGNvbnN0IHNwZWMgb2YgT2JqZWN0LnZhbHVlcyhzZWN0aW9ucykpIHtcbiAgICBmb3IgKGNvbnN0IGVsZW0gb2YgT2JqZWN0LnZhbHVlcyhzcGVjLmVsZW1lbnRzKSkge1xuICAgICAgY29uc3QgZiA9IChlbGVtIGFzIGFueSkuaWNvbkZpbGUgYXMgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgICAgIGlmICghZikgY29udGludWU7XG4gICAgICBpZiAoZmFsbGJhY2tNYXAuaGFzKGYpKSB7XG4gICAgICAgIChlbGVtIGFzIGFueSkuaWNvbkZpbGUgPSBmYWxsYmFja01hcC5nZXQoZik7XG4gICAgICB9IGVsc2UgaWYgKGRyb3BwZWRTZXQuaGFzKGYpKSB7XG4gICAgICAgIGRlbGV0ZSAoZWxlbSBhcyBhbnkpLmljb25GaWxlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgaHVtYW4tcmVhZGFibGUgc3BlYy5tZCBmcm9tIGV4dHJhY3RlZCBkYXRhLlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVNwZWNNZChwYWdlTmFtZTogc3RyaW5nLCBwYWdlU2x1Zzogc3RyaW5nLCBzcGVjczogU2VjdGlvblNwZWNzLCB0b2tlbnM6IFBhZ2VUb2tlbnMpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcbiAgbGluZXMucHVzaChgIyBEZXNpZ24gU3BlYyBcdTIwMTQgJHtwYWdlTmFtZX1gKTtcbiAgbGluZXMucHVzaChgIyMgU291cmNlOiBGaWdtYSBQbHVnaW4gRXhwb3J0YCk7XG4gIGxpbmVzLnB1c2goYCMjIEdlbmVyYXRlZDogJHtzcGVjcy5leHRyYWN0ZWRfYXR9YCk7XG4gIGxpbmVzLnB1c2goJycpO1xuICBsaW5lcy5wdXNoKCcjIyBQYWdlIE1ldGFkYXRhJyk7XG4gIGxpbmVzLnB1c2goYC0gUGFnZSBOYW1lOiAke3BhZ2VOYW1lfWApO1xuICBsaW5lcy5wdXNoKGAtIENhbnZhcyBXaWR0aDogJHtzcGVjcy5maWdtYV9jYW52YXNfd2lkdGh9cHhgKTtcbiAgbGluZXMucHVzaChgLSBTZWN0aW9uIENvdW50OiAke09iamVjdC5rZXlzKHNwZWNzLnNlY3Rpb25zKS5sZW5ndGh9YCk7XG4gIGlmIChzcGVjcy5tb2JpbGVfY2FudmFzX3dpZHRoKSB7XG4gICAgbGluZXMucHVzaChgLSBNb2JpbGUgQ2FudmFzIFdpZHRoOiAke3NwZWNzLm1vYmlsZV9jYW52YXNfd2lkdGh9cHhgKTtcbiAgfVxuICBsaW5lcy5wdXNoKCcnKTtcblxuICAvLyBDb2xvcnNcbiAgbGluZXMucHVzaCgnIyMgQ29sb3JzIFVzZWQnKTtcbiAgbGluZXMucHVzaCgnfCBIRVggfCBVc2FnZSBDb3VudCB8Jyk7XG4gIGxpbmVzLnB1c2goJ3wtLS0tLXwtLS0tLS0tLS0tLS18Jyk7XG4gIGNvbnN0IHNvcnRlZENvbG9ycyA9IE9iamVjdC5lbnRyaWVzKHRva2Vucy5jb2xvcnMpLnNvcnQoKGEsIGIpID0+IGJbMV0gLSBhWzFdKTtcbiAgZm9yIChjb25zdCBbaGV4LCBjb3VudF0gb2Ygc29ydGVkQ29sb3JzLnNsaWNlKDAsIDIwKSkge1xuICAgIGxpbmVzLnB1c2goYHwgJHtoZXh9IHwgJHtjb3VudH0gfGApO1xuICB9XG4gIGxpbmVzLnB1c2goJycpO1xuXG4gIC8vIFR5cG9ncmFwaHlcbiAgbGluZXMucHVzaCgnIyMgVHlwb2dyYXBoeSBVc2VkJyk7XG4gIGxpbmVzLnB1c2goJ3wgRm9udCB8IFN0eWxlcyB8IFNpemVzIHwnKTtcbiAgbGluZXMucHVzaCgnfC0tLS0tLXwtLS0tLS0tLXwtLS0tLS0tfCcpO1xuICBmb3IgKGNvbnN0IFtmYW1pbHksIGluZm9dIG9mIE9iamVjdC5lbnRyaWVzKHRva2Vucy5mb250cykpIHtcbiAgICBsaW5lcy5wdXNoKGB8ICR7ZmFtaWx5fSB8ICR7aW5mby5zdHlsZXMuam9pbignLCAnKX0gfCAke2luZm8uc2l6ZXMuam9pbignLCAnKX1weCB8YCk7XG4gIH1cbiAgbGluZXMucHVzaCgnJyk7XG5cbiAgLy8gU2VjdGlvbnNcbiAgbGluZXMucHVzaCgnIyMgU2VjdGlvbnMnKTtcbiAgbGluZXMucHVzaCgnJyk7XG4gIGZvciAoY29uc3QgW2xheW91dE5hbWUsIHNwZWNdIG9mIE9iamVjdC5lbnRyaWVzKHNwZWNzLnNlY3Rpb25zKSkge1xuICAgIGxpbmVzLnB1c2goYCMjIyAke2xheW91dE5hbWV9YCk7XG4gICAgbGluZXMucHVzaChgLSAqKlNwYWNpbmcgU291cmNlKio6ICR7c3BlYy5zcGFjaW5nU291cmNlfWApO1xuICAgIGxpbmVzLnB1c2goYC0gKipCYWNrZ3JvdW5kKio6ICR7c3BlYy5zZWN0aW9uLmJhY2tncm91bmRDb2xvciB8fCAnbm9uZSd9YCk7XG4gICAgbGluZXMucHVzaChgLSAqKkdyaWQqKjogJHtzcGVjLmdyaWQubGF5b3V0TW9kZX0sICR7c3BlYy5ncmlkLmNvbHVtbnN9IGNvbHVtbnMsIGdhcDogJHtzcGVjLmdyaWQuZ2FwIHx8ICdub25lJ31gKTtcbiAgICBpZiAoc3BlYy5pbnRlcmFjdGlvbnMgJiYgc3BlYy5pbnRlcmFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgbGluZXMucHVzaChgLSAqKkludGVyYWN0aW9ucyoqOiAke3NwZWMuaW50ZXJhY3Rpb25zLmxlbmd0aH0gKCR7c3BlYy5pbnRlcmFjdGlvbnMubWFwKGkgPT4gaS50cmlnZ2VyKS5qb2luKCcsICcpfSlgKTtcbiAgICB9XG4gICAgaWYgKHNwZWMub3ZlcmxhcCkge1xuICAgICAgbGluZXMucHVzaChgLSAqKk92ZXJsYXAqKjogJHtzcGVjLm92ZXJsYXAucGl4ZWxzfXB4IHdpdGggXCIke3NwZWMub3ZlcmxhcC53aXRoU2VjdGlvbn1cImApO1xuICAgIH1cbiAgICBsaW5lcy5wdXNoKCcnKTtcblxuICAgIC8vIEVsZW1lbnRzXG4gICAgZm9yIChjb25zdCBbZWxlbU5hbWUsIGVsZW1TdHlsZXNdIG9mIE9iamVjdC5lbnRyaWVzKHNwZWMuZWxlbWVudHMpKSB7XG4gICAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5lbnRyaWVzKGVsZW1TdHlsZXMpXG4gICAgICAgIC5maWx0ZXIoKFssIHZdKSA9PiB2ICE9PSBudWxsICYmIHYgIT09IHVuZGVmaW5lZClcbiAgICAgICAgLm1hcCgoW2ssIHZdKSA9PiBgJHtrfTogJHt2fWApXG4gICAgICAgIC5qb2luKCcsICcpO1xuICAgICAgbGluZXMucHVzaChgICAtICoqJHtlbGVtTmFtZX0qKjogJHtwcm9wc31gKTtcbiAgICB9XG4gICAgbGluZXMucHVzaCgnJyk7XG4gIH1cblxuICByZXR1cm4gbGluZXMuam9pbignXFxuJyk7XG59XG4iLCAiaW1wb3J0IHsgVUlUb1NhbmRib3hNZXNzYWdlIH0gZnJvbSAnLi9zYW5kYm94L3R5cGVzJztcbmltcG9ydCB7IGRpc2NvdmVyUGFnZXMgfSBmcm9tICcuL3NhbmRib3gvZGlzY292ZXJ5JztcbmltcG9ydCB7IHJ1bkFsbFZhbGlkYXRpb25zIH0gZnJvbSAnLi9zYW5kYm94L3ZhbGlkYXRvcic7XG5pbXBvcnQgeyBydW5FeHRyYWN0aW9uIH0gZnJvbSAnLi9zYW5kYm94L2V4dHJhY3Rvcic7XG5cbi8vIFNob3cgdGhlIHBsdWdpbiBVSVxuZmlnbWEuc2hvd1VJKF9faHRtbF9fLCB7IHdpZHRoOiA2NDAsIGhlaWdodDogNTIwIH0pO1xuY29uc29sZS5sb2coXCJXUCBUaGVtZSBCdWlsZGVyIEV4cG9ydDogUGx1Z2luIGluaXRpYWxpemVkXCIpO1xuXG4vLyBDYW5jZWxsYXRpb24gZmxhZ1xubGV0IGNhbmNlbFJlcXVlc3RlZCA9IGZhbHNlO1xuXG4vLyBIYW5kbGUgbWVzc2FnZXMgZnJvbSBVSVxuZmlnbWEudWkub25tZXNzYWdlID0gYXN5bmMgKG1zZzogVUlUb1NhbmRib3hNZXNzYWdlKSA9PiB7XG4gIGNvbnNvbGUubG9nKFwiU2FuZGJveCByZWNlaXZlZCBtZXNzYWdlOlwiLCBtc2cudHlwZSk7XG5cbiAgc3dpdGNoIChtc2cudHlwZSkge1xuICAgIGNhc2UgJ0RJU0NPVkVSX1BBR0VTJzoge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGFnZXMgPSBkaXNjb3ZlclBhZ2VzKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUGFnZXMgZGlzY292ZXJlZDpcIiwgcGFnZXMubGVuZ3RoKTtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB0eXBlOiAnUEFHRVNfRElTQ09WRVJFRCcsIHBhZ2VzIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJEaXNjb3ZlcnkgZXJyb3I6XCIsIGVycik7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ0VYUE9SVF9FUlJPUicsIGVycm9yOiBTdHJpbmcoZXJyKSB9KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgJ1ZBTElEQVRFJzoge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHJ1bkFsbFZhbGlkYXRpb25zKG1zZy5mcmFtZUlkcyk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiVmFsaWRhdGlvbiBjb21wbGV0ZTpcIiwgcmVzdWx0cy5sZW5ndGgsIFwicmVzdWx0c1wiKTtcbiAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgIHR5cGU6ICdWQUxJREFUSU9OX0NPTVBMRVRFJyxcbiAgICAgICAgICByZXN1bHRzLFxuICAgICAgICAgIGZyYW1lSWRzOiBtc2cuZnJhbWVJZHMsXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJWYWxpZGF0aW9uIGVycm9yOlwiLCBlcnIpO1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ0VYUE9SVF9FUlJPUicsXG4gICAgICAgICAgZXJyb3I6IGBWYWxpZGF0aW9uIGZhaWxlZDogJHtlcnJ9YCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjYXNlICdTVEFSVF9FWFBPUlQnOiB7XG4gICAgICBjYW5jZWxSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJ1bkV4dHJhY3Rpb24oXG4gICAgICAgICAgbXNnLmZyYW1lSWRzLFxuICAgICAgICAgIG1zZy5yZXNwb25zaXZlUGFpcnMsXG4gICAgICAgICAgKG1lc3NhZ2UpID0+IGZpZ21hLnVpLnBvc3RNZXNzYWdlKG1lc3NhZ2UpLFxuICAgICAgICAgICgpID0+IGNhbmNlbFJlcXVlc3RlZCxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXhwb3J0IGVycm9yOlwiLCBlcnIpO1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ0VYUE9SVF9FUlJPUicsXG4gICAgICAgICAgZXJyb3I6IGBFeHBvcnQgZmFpbGVkOiAke2Vycn1gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgJ0NBTkNFTF9FWFBPUlQnOiB7XG4gICAgICBjYW5jZWxSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5sb2coXCJFeHBvcnQgY2FuY2VsbGVkIGJ5IHVzZXJcIik7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjYXNlICdGT0NVU19OT0RFJzoge1xuICAgICAgLy8gSnVtcCB0aGUgRmlnbWEgY2FudmFzIHRvIHRoZSBvZmZlbmRpbmcgbGF5ZXIgYW5kIHNlbGVjdCBpdC4gVXNlZCBieVxuICAgICAgLy8gdGhlIHZhbGlkYXRpb24gcmVwb3J0J3MgXCJjbGljayB0byBsb2NhdGVcIiBhZmZvcmRhbmNlIFx1MjAxNCBpbnN0YW50XG4gICAgICAvLyBmZWVkYmFjayBzbyB1c2VycyBzZWUgZXhhY3RseSB3aGVyZSB0aGUgaXNzdWUgbGl2ZXMgaW4gdGhlIGRlc2lnbi5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBmaWdtYS5nZXROb2RlQnlJZChtc2cubm9kZUlkKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdGT0NVU19OT0RFOiBub2RlIG5vdCBmb3VuZCcsIG1zZy5ub2RlSWQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICgncGFyZW50JyBpbiBub2RlICYmIG5vZGUucGFyZW50ICYmICd0eXBlJyBpbiBub2RlLnBhcmVudCkge1xuICAgICAgICAgIC8vIFN3aXRjaCB0byB0aGUgcGFnZSBjb250YWluaW5nIHRoZSBub2RlIGJlZm9yZSBzY3JvbGxpbmdcbiAgICAgICAgICBsZXQgcGFnZU5vZGU6IEJhc2VOb2RlIHwgbnVsbCA9IG5vZGUucGFyZW50O1xuICAgICAgICAgIHdoaWxlIChwYWdlTm9kZSAmJiBwYWdlTm9kZS50eXBlICE9PSAnUEFHRScpIHtcbiAgICAgICAgICAgIHBhZ2VOb2RlID0gKHBhZ2VOb2RlIGFzIGFueSkucGFyZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocGFnZU5vZGUgJiYgcGFnZU5vZGUudHlwZSA9PT0gJ1BBR0UnICYmIGZpZ21hLmN1cnJlbnRQYWdlLmlkICE9PSBwYWdlTm9kZS5pZCkge1xuICAgICAgICAgICAgZmlnbWEuY3VycmVudFBhZ2UgPSBwYWdlTm9kZSBhcyBQYWdlTm9kZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdpZCcgaW4gbm9kZSAmJiBub2RlLnR5cGUgIT09ICdET0NVTUVOVCcgJiYgbm9kZS50eXBlICE9PSAnUEFHRScpIHtcbiAgICAgICAgICBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24gPSBbbm9kZSBhcyBTY2VuZU5vZGVdO1xuICAgICAgICAgIGZpZ21hLnZpZXdwb3J0LnNjcm9sbEFuZFpvb21JbnRvVmlldyhbbm9kZSBhcyBTY2VuZU5vZGVdKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignRk9DVVNfTk9ERSBmYWlsZWQ6JywgZXJyKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS08sV0FBUyxRQUFRLE1BQXNCO0FBQzVDLFdBQU8sS0FDSixZQUFZLEVBQ1osUUFBUSxTQUFTLEdBQUcsRUFDcEIsUUFBUSxpQkFBaUIsRUFBRSxFQUMzQixRQUFRLFFBQVEsR0FBRyxFQUNuQixRQUFRLE9BQU8sR0FBRyxFQUNsQixRQUFRLFVBQVUsRUFBRTtBQUFBLEVBQ3pCO0FBTU8sV0FBUyxhQUFhLE1BQXNCO0FBQ2pELFdBQU8sS0FDSixZQUFZLEVBQ1osUUFBUSxTQUFTLEdBQUcsRUFDcEIsUUFBUSxpQkFBaUIsRUFBRSxFQUMzQixRQUFRLFFBQVEsR0FBRyxFQUNuQixR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QUFZO0FBQUEsZ0JBQ25CLE1BQU07QUFBQSxnQkFDTjtBQUFBLGdCQUNBLFVBQVUsSUFBSTtBQUFBLGNBQ2hCLENBQUM7QUFBQSxZQUNILFNBQVMsS0FBSztBQUNaLHNCQUFRLE1BQU0scUJBQXFCLEdBQUc7QUFDdEMsb0JBQU0sR0FBRyxZQUFZO0FBQUEsZ0JBQ25CLE1BQU07QUFBQSxnQkFDTixPQUFPLHNCQUFzQixHQUFHO0FBQUEsY0FDbEMsQ0FBQztBQUFBLFlBQ0g7QUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUVBLEtBQUssZ0JBQWdCO0FBQ25CLDhCQUFrQjtBQUNsQixnQkFBSTtBQUNGLG9CQUFNO0FBQUEsZ0JBQ0osSUFBSTtBQUFBLGdCQUNKLElBQUk7QUFBQSxnQkFDSixDQUFDLFlBQVksTUFBTSxHQUFHLFlBQVksT0FBTztBQUFBLGdCQUN6QyxNQUFNO0FBQUEsY0FDUjtBQUFBLFlBQ0YsU0FBUyxLQUFLO0FBQ1osc0JBQVEsTUFBTSxpQkFBaUIsR0FBRztBQUNsQyxvQkFBTSxHQUFHLFlBQVk7QUFBQSxnQkFDbkIsTUFBTTtBQUFBLGdCQUNOLE9BQU8sa0JBQWtCLEdBQUc7QUFBQSxjQUM5QixDQUFDO0FBQUEsWUFDSDtBQUNBO0FBQUEsVUFDRjtBQUFBLFVBRUEsS0FBSyxpQkFBaUI7QUFDcEIsOEJBQWtCO0FBQ2xCLG9CQUFRLElBQUksMEJBQTBCO0FBQ3RDO0FBQUEsVUFDRjtBQUFBLFVBRUEsS0FBSyxjQUFjO0FBSWpCLGdCQUFJO0FBQ0Ysb0JBQU0sT0FBTyxNQUFNLFlBQVksSUFBSSxNQUFNO0FBQ3pDLGtCQUFJLENBQUMsTUFBTTtBQUNULHdCQUFRLEtBQUssOEJBQThCLElBQUksTUFBTTtBQUNyRDtBQUFBLGNBQ0Y7QUFDQSxrQkFBSSxZQUFZLFFBQVEsS0FBSyxVQUFVLFVBQVUsS0FBSyxRQUFRO0FBRTVELG9CQUFJLFdBQTRCLEtBQUs7QUFDckMsdUJBQU8sWUFBWSxTQUFTLFNBQVMsUUFBUTtBQUMzQyw2QkFBWSxTQUFpQjtBQUFBLGdCQUMvQjtBQUNBLG9CQUFJLFlBQVksU0FBUyxTQUFTLFVBQVUsTUFBTSxZQUFZLE9BQU8sU0FBUyxJQUFJO0FBQ2hGLHdCQUFNLGNBQWM7QUFBQSxnQkFDdEI7QUFBQSxjQUNGO0FBQ0Esa0JBQUksUUFBUSxRQUFRLEtBQUssU0FBUyxjQUFjLEtBQUssU0FBUyxRQUFRO0FBQ3BFLHNCQUFNLFlBQVksWUFBWSxDQUFDLElBQWlCO0FBQ2hELHNCQUFNLFNBQVMsc0JBQXNCLENBQUMsSUFBaUIsQ0FBQztBQUFBLGNBQzFEO0FBQUEsWUFDRixTQUFTLEtBQUs7QUFDWixzQkFBUSxLQUFLLHNCQUFzQixHQUFHO0FBQUEsWUFDeEM7QUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBO0FBQUE7IiwKICAibmFtZXMiOiBbImNvbHVtbnMiLCAiZXh0cmFjdFN0cm9rZUNvbG9yIiwgIndhbGsiLCAiX2EiLCAiX2IiXQp9Cg==
