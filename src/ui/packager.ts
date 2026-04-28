import JSZip from 'jszip';

interface PageData {
  slug: string;
  sectionSpecs: any;
  specMd: string;
  tokens: any;
  screenshots: { filename: string; data: Uint8Array }[];
  images: { filename: string; data: Uint8Array }[];
  imageMap: any;
}

interface ExportData {
  manifest: any;
  designTokens: any;
  responsiveMap: any;
  pages: PageData[];
}

/**
 * Detect image format from the first few bytes (magic numbers).
 * Raw bytes from figma.getImageByHash() come in the source image's native
 * format (PNG/JPG/GIF/WebP), not always PNG as the filename suggests.
 * Returns the correct extension WITHOUT the leading dot.
 */
function detectImageExtension(data: Uint8Array): 'png' | 'jpg' | 'gif' | 'webp' | 'svg' | null {
  if (data.length < 12) return null;
  // PNG: 89 50 4E 47
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return 'png';
  // JPEG: FF D8 FF
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'jpg';
  // GIF: 47 49 46 38 ("GIF8")
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x38) return 'gif';
  // WebP: "RIFF"...."WEBP"
  if (
    data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
    data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50
  ) return 'webp';
  // SVG: "<?xml" or "<svg"
  if (data[0] === 0x3c && (data[1] === 0x3f || data[1] === 0x73 || data[1] === 0x53)) return 'svg';
  return null;
}

/**
 * Swap a filename's extension. E.g. "hero-bg.png" + "jpg" -> "hero-bg.jpg".
 * If the filename has no extension, append the new one.
 */
function renameExtension(filename: string, newExt: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx < 0) return `${filename}.${newExt}`;
  return `${filename.slice(0, idx)}.${newExt}`;
}

/**
 * Build the plugin-export.zip from all collected export data.
 * ZIP structure matches the agent system's expected folder layout.
 *
 * For image assets: auto-detect real format from magic bytes and rename
 * the file extension accordingly. The sandbox now returns raw bytes from
 * figma.getImageByHash() (pure image, no baked-in text overlays), which
 * may be JPG/WebP/GIF even when the task was queued as PNG.
 */
export async function buildExportZip(data: ExportData): Promise<Blob> {
  const zip = new JSZip();

  // Root-level files
  zip.file('manifest.json', JSON.stringify(data.manifest, null, 2));
  zip.file('design-tokens.json', JSON.stringify(data.designTokens, null, 2));
  zip.file('responsive-map.json', JSON.stringify(data.responsiveMap, null, 2));

  // Per-page directories
  for (const page of data.pages) {
    const pageDir = zip.folder(`pages/${page.slug}`)!;
    const figmaDir = pageDir.folder('figma')!;

    // Images — detect real format FIRST so we know the rename map before
    // serializing section-specs.json (otherwise the spec references .png
    // while the actual file landed as .jpg/.webp).
    const imgDir = figmaDir.folder('images')!;
    const renames: Record<string, string> = {}; // old filename -> new filename
    for (const img of page.images) {
      const detectedExt = detectImageExtension(img.data);
      let finalFilename = img.filename;
      if (detectedExt && !img.filename.toLowerCase().endsWith(`.${detectedExt}`)) {
        finalFilename = renameExtension(img.filename, detectedExt);
        renames[img.filename] = finalFilename;
      }
      imgDir.file(finalFilename, img.data);
    }

    // Core JSON files — patch section-specs.json with the rename map so
    // every iconFile / imageFile / backgroundImageFile / backgroundImage
    // reference points at the file that actually landed in the ZIP.
    const patchedSpecs = patchSectionSpecsRenames(page.sectionSpecs, renames);
    figmaDir.file('section-specs.json', JSON.stringify(patchedSpecs, null, 2));
    figmaDir.file('spec.md', page.specMd);
    figmaDir.file('tokens.json', JSON.stringify(patchTokensRenames(page.tokens, renames), null, 2));

    // Screenshots (always PNG — rendered composites)
    const ssDir = figmaDir.folder('screenshots')!;
    for (const ss of page.screenshots) {
      ssDir.file(ss.filename, ss.data);
    }

    // Patch image-map.json so downstream tools reference the renamed files
    if (page.imageMap) {
      const patchedMap = patchImageMapRenames(page.imageMap, renames);
      imgDir.file('image-map.json', JSON.stringify(patchedMap, null, 2));
    }
  }

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Apply file-extension renames throughout section-specs.json so every
 * `iconFile` / `imageFile` / `backgroundImageFile` / `backgroundImage` URL
 * reference matches the filename that actually landed in the ZIP. Without
 * this, raw JPGs/WebPs sourced from Figma fills break — the spec would
 * reference `hero.png` but the file is `hero.jpg`.
 */
function patchSectionSpecsRenames(specs: any, renames: Record<string, string>): any {
  if (!specs || !specs.sections || Object.keys(renames).length === 0) return specs;
  // Deep clone via JSON round-trip — section specs are pure data, no functions.
  const patched = JSON.parse(JSON.stringify(specs));

  for (const sectionKey of Object.keys(patched.sections || {})) {
    const sec = patched.sections[sectionKey];
    if (!sec) continue;

    // Section-level background image
    if (sec.section) {
      const bf = sec.section.backgroundImageFile;
      if (bf && renames[bf]) sec.section.backgroundImageFile = renames[bf];
      const bgUrl = sec.section.backgroundImage;
      if (typeof bgUrl === 'string') {
        sec.section.backgroundImage = bgUrl.replace(/url\(images\/([^)]+)\)/g, (_match, file) => {
          return `url(images/${renames[file] || file})`;
        });
      }
    }

    // Per-element references
    for (const elemKey of Object.keys(sec.elements || {})) {
      const el = sec.elements[elemKey];
      if (!el) continue;
      if (el.imageFile && renames[el.imageFile]) el.imageFile = renames[el.imageFile];
      if (el.iconFile && renames[el.iconFile]) el.iconFile = renames[el.iconFile];
    }

    // Repeater item images
    if (sec.repeaters && typeof sec.repeaters === 'object') {
      for (const rep of Object.values(sec.repeaters as Record<string, any>)) {
        if (!rep || !Array.isArray(rep.items)) continue;
        for (const item of rep.items) {
          if (item.imageFile && renames[item.imageFile]) item.imageFile = renames[item.imageFile];
        }
      }
    }
  }

  return patched;
}

/**
 * Patch tokens.json so per-section `image_files` arrays reference the
 * post-rename filenames.
 */
function patchTokensRenames(tokens: any, renames: Record<string, string>): any {
  if (!tokens || !Array.isArray(tokens.sections) || Object.keys(renames).length === 0) return tokens;
  const patched = JSON.parse(JSON.stringify(tokens));
  for (const sec of patched.sections) {
    if (Array.isArray(sec.image_files)) {
      sec.image_files = sec.image_files.map((f: string) => renames[f] || f);
    }
  }
  return patched;
}

/**
 * Apply file-extension renames throughout an image-map.json structure so
 * `images.<file>` keys and `by_section[section]` arrays reference the real
 * filenames that ended up in the ZIP.
 */
function patchImageMapRenames(imageMap: any, renames: Record<string, string>): any {
  if (!imageMap || Object.keys(renames).length === 0) return imageMap;

  const patched: any = { images: {}, by_section: {} };

  for (const [file, entry] of Object.entries(imageMap.images || {})) {
    const newFile = renames[file] || file;
    const newEntry = { ...(entry as any), file: newFile };
    if (newEntry.ext) {
      const dotIdx = newFile.lastIndexOf('.');
      if (dotIdx >= 0) newEntry.ext = newFile.slice(dotIdx + 1);
    }
    if (newEntry.readableName === file) newEntry.readableName = newFile;
    patched.images[newFile] = newEntry;
  }

  for (const [section, files] of Object.entries(imageMap.by_section || {})) {
    patched.by_section[section] = (files as string[]).map((f) => renames[f] || f);
  }

  return patched;
}
