import { h } from 'preact';
import { Badge } from './Badge';

interface ValidationItemProps {
  severity: 'error' | 'warning' | 'info';
  check: string;
  message: string;
  suggestion?: string;
  nodeName?: string;
}

const ICONS: Record<string, string> = {
  error: '\u2716',    // heavy X
  warning: '\u26A0',  // warning sign
  info: '\u2139',     // info
};

export function ValidationItem({ severity, check, message, suggestion, nodeName }: ValidationItemProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '6px 0',
      borderBottom: '1px solid var(--figma-color-border, #F0F0F0)',
      fontSize: '12px',
    }}>
      <span style={{ flexShrink: 0, fontSize: '14px' }}>{ICONS[severity]}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
          <Badge severity={severity} />
          <span style={{ fontWeight: '500' }}>{check}</span>
          {nodeName && <span style={{ color: 'var(--figma-color-text-secondary, #999)' }}>({nodeName})</span>}
        </div>
        <div>{message}</div>
        {suggestion && (
          <div style={{ color: 'var(--figma-color-text-secondary, #999)', fontStyle: 'italic', marginTop: '2px' }}>
            {suggestion}
          </div>
        )}
      </div>
    </div>
  );
}
