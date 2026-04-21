import { h } from 'preact';
import { ProgressBar } from '../components/ProgressBar';

interface ExportProgressProps {
  current: number;
  total: number;
  label: string;
  onCancel: () => void;
}

export function ExportProgress({ current, total, label, onCancel }: ExportProgressProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Exporting Design Data</h2>
        <p style={{ fontSize: '12px', color: 'var(--figma-color-text-secondary, #999)', marginTop: '8px' }}>
          Do not close Figma while export is in progress
        </p>
      </div>

      <ProgressBar current={current} total={total} label={label} />

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            borderRadius: '6px',
            border: '1px solid var(--figma-color-border, #E5E5E5)',
            background: 'var(--figma-color-bg, #FFF)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
