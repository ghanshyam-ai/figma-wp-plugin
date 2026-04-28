import { h } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { PageSelector } from './steps/PageSelector';
import { ValidationReport } from './steps/ValidationReport';
import { ExportProgress } from './steps/ExportProgress';
import { DownloadComplete } from './steps/DownloadComplete';
import { sendToPlugin, usePluginMessages } from './hooks/usePluginMessages';
import { buildExportZip } from './packager';

type WizardStep = 'select' | 'validate' | 'export' | 'download';

interface PageData {
  slug: string;
  sectionSpecs: any;
  specMd: string;
  tokens: any;
  screenshots: { filename: string; data: Uint8Array }[];
  images: { filename: string; data: Uint8Array }[];
  imageMap: any;
}

export function App() {
  const [step, setStep] = useState<WizardStep>('select');
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([]);
  const [allPages, setAllPages] = useState<any[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: 'Starting...' });
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [exportStats, setExportStats] = useState({ pages: 0, sections: 0, images: 0 });

  // Accumulated export data
  const [pageDataMap] = useState(new Map<string, PageData>());
  const [exportMeta, setExportMeta] = useState<{ manifest: any; responsiveMap: any; designTokens: any } | null>(null);

  // Build responsive pairs from selected frames
  const buildResponsivePairs = useCallback((frameIds: string[], pages: any[]) => {
    // Simple approach: treat each selected frame as a desktop page
    // The sandbox's responsive matching handles actual pairing
    const allFrames = pages.flatMap((p: any) => p.frames);
    const selectedFrames = allFrames.filter((f: any) => frameIds.includes(f.id));

    // Group by normalized base name for pairing
    const pairs: any[] = [];
    const used = new Set<string>();

    const desktopFrames = selectedFrames.filter((f: any) => f.breakpoint === 'desktop' || f.breakpoint === 'large');
    const mobileFrames = selectedFrames.filter((f: any) => f.breakpoint === 'mobile');

    for (const desktop of desktopFrames) {
      const baseName = desktop.name.toLowerCase()
        .replace(/[-–—\s]*(desktop|mobile|tablet|\d{3,4}\s*(?:px)?)/gi, '')
        .trim();

      let matchedMobile = null;
      for (const mobile of mobileFrames) {
        if (used.has(mobile.id)) continue;
        const mobileName = mobile.name.toLowerCase()
          .replace(/[-–—\s]*(desktop|mobile|tablet|\d{3,4}\s*(?:px)?)/gi, '')
          .trim();
        if (mobileName === baseName || mobile.name.toLowerCase().includes(baseName)) {
          matchedMobile = mobile;
          used.add(mobile.id);
          break;
        }
      }

      // Generate slug from base name
      const slug = baseName.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || desktop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      pairs.push({
        pageName: desktop.name,
        pageSlug: slug,
        desktop: { frameId: desktop.id, frameName: desktop.name, width: desktop.width },
        mobile: matchedMobile ? { frameId: matchedMobile.id, frameName: matchedMobile.name, width: matchedMobile.width } : null,
        tablet: null,
        matchConfidence: matchedMobile ? 0.9 : 1.0,
        matchMethod: 'name-similarity',
      });
      used.add(desktop.id);
    }

    // Handle standalone mobile frames (no desktop pair)
    for (const mobile of mobileFrames) {
      if (used.has(mobile.id)) continue;
      pairs.push({
        pageName: mobile.name,
        pageSlug: mobile.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        desktop: { frameId: mobile.id, frameName: mobile.name, width: mobile.width },
        mobile: null,
        tablet: null,
        matchConfidence: 1.0,
        matchMethod: 'name-similarity',
      });
      used.add(mobile.id);
    }

    return pairs;
  }, []);

  // Get-or-create the page entry. Image/screenshot messages stream from the
  // sandbox BEFORE PAGE_DATA arrives (extractor patches iconFile refs after
  // exports finish, then sends PAGE_DATA), so handlers must create the entry
  // on demand or binary data is silently dropped.
  const getOrCreatePage = useCallback((slug: string): PageData => {
    let p = pageDataMap.get(slug);
    if (!p) {
      p = { slug, sectionSpecs: null, specMd: '', tokens: null,
            screenshots: [], images: [], imageMap: null };
      pageDataMap.set(slug, p);
    }
    return p;
  }, [pageDataMap]);

  // Handle messages from sandbox
  usePluginMessages(useCallback((msg: any) => {
    switch (msg.type) {
      case 'EXPORT_PROGRESS':
        setProgress({ current: msg.current, total: msg.total, label: msg.label });
        break;

      case 'PAGE_DATA': {
        const existing = getOrCreatePage(msg.pageSlug);
        existing.sectionSpecs = msg.sectionSpecs;
        existing.specMd = msg.specMd;
        existing.tokens = msg.tokens;
        break;
      }

      case 'SCREENSHOT_DATA': {
        const slug = msg.path.split('/')[1];
        getOrCreatePage(slug).screenshots.push({ filename: msg.filename, data: msg.data });
        break;
      }

      case 'IMAGE_DATA': {
        const slug = msg.path.split('/')[1];
        getOrCreatePage(slug).images.push({ filename: msg.filename, data: msg.data });
        break;
      }

      case 'IMAGE_MAP_DATA': {
        const slug = msg.path.split('/')[1];
        getOrCreatePage(slug).imageMap = msg.imageMap;
        break;
      }

      case 'EXPORT_COMPLETE':
        setExportMeta({
          manifest: msg.manifest,
          responsiveMap: msg.responsiveMap,
          designTokens: msg.designTokens,
        });
        // Build ZIP
        buildExportZip({
          manifest: msg.manifest,
          designTokens: msg.designTokens,
          responsiveMap: msg.responsiveMap,
          pages: [...pageDataMap.values()],
        }).then(blob => {
          setZipBlob(blob);
          setExportStats({
            pages: msg.manifest.pages.length,
            sections: msg.manifest.totalSections,
            images: msg.manifest.totalImages,
          });
          setStep('download');
        });
        break;

      case 'EXPORT_ERROR':
        console.error('Export error:', msg.error);
        alert(`Export failed: ${msg.error}`);
        setStep('select');
        break;
    }
  }, [pageDataMap, getOrCreatePage]));

  // Step handlers
  const handlePageSelect = (frameIds: string[], pages: any[]) => {
    setSelectedFrameIds(frameIds);
    setAllPages(pages);
    setStep('validate');
  };

  const handleExport = () => {
    setStep('export');
    pageDataMap.clear();
    setZipBlob(null);

    const pairs = buildResponsivePairs(selectedFrameIds, allPages);
    sendToPlugin({
      type: 'START_EXPORT',
      frameIds: selectedFrameIds,
      responsivePairs: pairs,
    });
  };

  const handleCancel = () => {
    sendToPlugin({ type: 'CANCEL_EXPORT' });
    setStep('select');
  };

  const handleRestart = () => {
    pageDataMap.clear();
    setZipBlob(null);
    setExportMeta(null);
    setStep('select');
  };

  // Render active step
  switch (step) {
    case 'select':
      return <PageSelector onNext={handlePageSelect} />;
    case 'validate':
      return (
        <ValidationReport
          frameIds={selectedFrameIds}
          onExport={handleExport}
          onBack={() => setStep('select')}
        />
      );
    case 'export':
      return (
        <ExportProgress
          current={progress.current}
          total={progress.total}
          label={progress.label}
          onCancel={handleCancel}
        />
      );
    case 'download':
      return (
        <DownloadComplete
          zipBlob={zipBlob}
          pageCount={exportStats.pages}
          sectionCount={exportStats.sections}
          imageCount={exportStats.images}
          onRestart={handleRestart}
        />
      );
  }
}
