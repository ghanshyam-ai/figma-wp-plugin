import { h } from 'preact';
import { useState } from 'preact/hooks';

interface DownloadCompleteProps {
  zipBlob: Blob | null;
  pageCount: number;
  sectionCount: number;
  imageCount: number;
  onRestart: () => void;
}

export function DownloadComplete({ zipBlob, pageCount, sectionCount, imageCount, onRestart }: DownloadCompleteProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plugin-export.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const sizeMB = zipBlob ? (zipBlob.size / (1024 * 1024)).toFixed(1) : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
        {downloaded ? '\u2705' : '\u2705'}
      </div>

      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Export Complete</h2>

      <div style={{
        marginTop: '16px',
        padding: '16px 24px',
        borderRadius: '8px',
        backgroundColor: 'var(--figma-color-bg-secondary, #F5F5F5)',
        fontSize: '13px',
        lineHeight: '1.8',
      }}>
        <div><strong>{pageCount}</strong> pages</div>
        <div><strong>{sectionCount}</strong> sections</div>
        <div><strong>{imageCount}</strong> images</div>
        <div><strong>{sizeMB} MB</strong> total</div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
        <button
          onClick={handleDownload}
          disabled={!zipBlob}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--figma-color-bg-brand, #0D99FF)',
            color: '#FFF',
            cursor: zipBlob ? 'pointer' : 'not-allowed',
            opacity: zipBlob ? 1 : 0.5,
          }}
        >
          {downloaded ? 'Download Again' : 'Download plugin-export.zip'}
        </button>
        <button
          onClick={onRestart}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            borderRadius: '6px',
            border: '1px solid var(--figma-color-border, #E5E5E5)',
            background: 'var(--figma-color-bg, #FFF)',
            cursor: 'pointer',
          }}
        >
          Export Again
        </button>
      </div>

      {downloaded && (
        <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--figma-color-text-secondary, #999)' }}>
          Upload the ZIP to your AI agent to generate the website.
        </p>
      )}
    </div>
  );
}
