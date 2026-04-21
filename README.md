# WP Theme Builder Export — Figma Plugin

Figma plugin that exports structured design data for the WordPress + ACF theme builder agent system. Produces a `plugin-export.zip` containing CSS-ready section specs, screenshots, images, and design tokens for all selected pages.

## Features

- **Multi-page export** — select any combination of pages/frames
- **Desktop + mobile matching** — automatically pairs responsive frames
- **Prototype interaction extraction** — hover effects, click transitions → CSS
- **Pre-export validation** — detects missing fonts, overlapping sections, naming issues
- **Zero API calls** — runs entirely inside Figma, no tokens needed
- **Agent-compatible output** — produces `section-specs.json` matching the existing schema

## Setup

```bash
cd figma-plugin
npm install
npm run build
```

## Install in Figma

1. Open Figma Desktop
2. Go to **Plugins** > **Development** > **Import plugin from manifest...**
3. Select `figma-plugin/manifest.json`
4. The plugin appears under **Plugins** > **Development** > **WP Theme Builder Export**

## Usage

1. Open your Figma design file
2. Run the plugin (**Plugins** > **WP Theme Builder Export**)
3. **Step 1**: Select the pages/frames to export
4. **Step 2**: Review validation results, fix any errors
5. **Step 3**: Wait for export to complete
6. **Step 4**: Download `plugin-export.zip`

## Output Structure

```
plugin-export.zip
├── manifest.json              # Export metadata
├── design-tokens.json         # Global color/font/spacing tokens
├── responsive-map.json        # Desktop-mobile frame pairs
├── pages/
│   ├── about/
│   │   ├── figma/
│   │   │   ├── section-specs.json   # CSS-ready section data (PRIMARY)
│   │   │   ├── spec.md              # Human-readable spec
│   │   │   ├── tokens.json          # Page-level tokens
│   │   │   ├── screenshots/         # Per-section PNGs at 2x
│   │   │   └── images/              # Extracted image assets
│   │   │       └── image-map.json   # Image metadata
│   └── services/
│       └── (same structure)
```

## Developer Integration

Unzip the export into your project:

```bash
unzip plugin-export.zip -d /path/to/project/
```

This places files exactly where the AI agents expect them (`pages/<slug>/figma/`).

## Development

```bash
npm run dev      # Build once (development mode)
npm run build    # Build for production (minified)
npm run watch    # Watch mode (rebuilds on file changes)
```

## Validation Checks

| Check | Severity | Description |
|-------|----------|-------------|
| Auto-layout | Warning | Sections without auto-layout have approximate spacing |
| Layer names | Warning/Info | Default Figma names (Frame 1, Group 2, etc.) |
| Fonts | Error | Missing fonts block text extraction |
| Spacing | Info | Near-duplicate spacing values (78px vs 80px) |
| Image size | Warning | Images >5MB at 2x export |
| Overlaps | Warning | Sections overlapping in Y-axis |
| Responsive | Warning | No mobile frames selected |
| Text overflow | Warning | Text exceeds container bounds |
