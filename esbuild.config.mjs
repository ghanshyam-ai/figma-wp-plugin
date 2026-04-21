import { build } from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

// Build sandbox (main.ts → dist/main.js)
// Figma's plugin sandbox uses an older JS engine — target ES2015 to be safe
await build({
  entryPoints: [resolve(__dirname, 'src/main.ts')],
  bundle: true,
  outfile: resolve(__dirname, 'dist/main.js'),
  format: 'iife',
  target: 'es6',
  minify: false,
  sourcemap: 'inline',
  logLevel: 'info',
});

// Build UI (ui.tsx → temp bundle, then inline into HTML)
await build({
  entryPoints: [resolve(__dirname, 'src/ui.tsx')],
  bundle: true,
  outfile: resolve(__dirname, 'dist/ui-bundle.js'),
  format: 'iife',
  target: 'es2020',
  minify: isProd,
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  jsx: 'transform',
  define: {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`,
  },
  loader: {
    '.css': 'text',
  },
  logLevel: 'info',
});

// Read bundled JS
const uiJs = readFileSync(resolve(__dirname, 'dist/ui-bundle.js'), 'utf-8');

// Read CSS
const cssPath = resolve(__dirname, 'src/ui/styles.css');
const uiCss = existsSync(cssPath) ? readFileSync(cssPath, 'utf-8') : '';

// Inline into single HTML file (Figma requirement)
const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${uiCss}</style>
</head>
<body>
  <div id="app"></div>
  <script>${uiJs}</script>
</body>
</html>`;

writeFileSync(resolve(__dirname, 'dist/ui.html'), html);
console.log('Plugin built successfully.');
