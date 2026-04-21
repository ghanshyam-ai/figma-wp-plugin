import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { FrameCard } from '../components/FrameCard';
import { sendToPlugin, usePluginMessages } from '../hooks/usePluginMessages';

interface PageInfo {
  id: string;
  name: string;
  frames: {
    id: string;
    name: string;
    width: number;
    height: number;
    breakpoint: string;
    sectionCount: number;
    hasAutoLayout: boolean;
    responsivePairId: string | null;
  }[];
}

interface PageSelectorProps {
  onNext: (selectedFrameIds: string[], pages: PageInfo[]) => void;
}

export function PageSelector({ onNext }: PageSelectorProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sendToPlugin({ type: 'DISCOVER_PAGES' });
  }, []);

  usePluginMessages((msg) => {
    if (msg.type === 'PAGES_DISCOVERED') {
      setPages(msg.pages);
      setLoading(false);
      // Auto-select all desktop frames
      const desktopIds = new Set<string>();
      for (const page of msg.pages) {
        for (const frame of page.frames) {
          desktopIds.add(frame.id);
        }
      }
      setSelected(desktopIds);
    }
  });

  const toggleFrame = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const selectAll = () => {
    const all = new Set<string>();
    for (const page of pages) {
      for (const frame of page.frames) {
        all.add(frame.id);
      }
    }
    setSelected(all);
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const totalFrames = pages.reduce((sum, p) => sum + p.frames.length, 0);
  const totalSections = pages.reduce((sum, p) =>
    sum + p.frames.filter(f => selected.has(f.id)).reduce((s, f) => s + f.sectionCount, 0), 0);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--figma-color-text-secondary, #999)' }}>
          Discovering pages and frames...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--figma-color-border, #E5E5E5)' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Select Pages / Frames</h2>
        <div style={{ fontSize: '12px', color: 'var(--figma-color-text-secondary, #999)', marginTop: '4px' }}>
          {selected.size} of {totalFrames} frames selected &middot; {totalSections} sections
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: '8px' }}>
        <button onClick={selectAll} style={btnStyle}>Select All</button>
        <button onClick={deselectAll} style={btnStyle}>Deselect All</button>
      </div>

      {/* Frame list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
        {pages.map(page => (
          <div key={page.id} style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--figma-color-text-secondary, #999)', marginBottom: '6px' }}>
              {page.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {page.frames.map(frame => (
                <FrameCard
                  key={frame.id}
                  id={frame.id}
                  name={frame.name}
                  width={frame.width}
                  height={frame.height}
                  breakpoint={frame.breakpoint}
                  sectionCount={frame.sectionCount}
                  selected={selected.has(frame.id)}
                  responsivePairName={null}
                  onToggle={toggleFrame}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--figma-color-border, #E5E5E5)', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onNext([...selected], pages)}
          disabled={selected.size === 0}
          style={{
            ...primaryBtnStyle,
            opacity: selected.size === 0 ? 0.5 : 1,
            cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Next: Validate
        </button>
      </div>
    </div>
  );
}

const btnStyle: h.JSX.CSSProperties = {
  padding: '4px 12px',
  fontSize: '11px',
  borderRadius: '6px',
  border: '1px solid var(--figma-color-border, #E5E5E5)',
  background: 'var(--figma-color-bg, #FFF)',
  cursor: 'pointer',
};

const primaryBtnStyle: h.JSX.CSSProperties = {
  padding: '8px 20px',
  fontSize: '13px',
  fontWeight: '600',
  borderRadius: '6px',
  border: 'none',
  background: 'var(--figma-color-bg-brand, #0D99FF)',
  color: '#FFF',
  cursor: 'pointer',
};
