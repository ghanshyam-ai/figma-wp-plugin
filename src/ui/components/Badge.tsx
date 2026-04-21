import { h } from 'preact';

interface BadgeProps {
  severity: 'error' | 'warning' | 'info';
  count?: number;
}

const COLORS = {
  error: { bg: '#FF4D4D', text: '#FFFFFF' },
  warning: { bg: '#FFB020', text: '#1C1C1C' },
  info: { bg: '#4D9AFF', text: '#FFFFFF' },
};

export function Badge({ severity, count }: BadgeProps) {
  const color = COLORS[severity];
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '600',
      backgroundColor: color.bg,
      color: color.text,
    }}>
      {count !== undefined ? count : severity}
    </span>
  );
}
