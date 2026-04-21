import { h } from 'preact';

interface ProgressBarProps {
  current: number;
  total: number;
  label: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: 'var(--figma-color-bg-secondary, #E5E5E5)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: 'var(--figma-color-bg-brand, #0D99FF)',
          borderRadius: '4px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}
