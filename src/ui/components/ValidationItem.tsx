import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Badge } from './Badge';

interface ValidationItemProps {
  severity: 'error' | 'warning' | 'info';
  check: string;
  message: string;
  suggestion?: string;
  nodeName?: string;
  nodeId?: string;
  fixHint?: string[];
  /** Called when the user wants to locate this issue in the Figma canvas.
   *  Item only renders the "Locate" affordance when this is provided. */
  onFocus?: (nodeId: string) => void;
}

const ICONS: Record<string, string> = {
  error: '✖',    // heavy X
  warning: '⚠',  // warning sign
  info: 'ℹ',     // info
};

export function ValidationItem({
  severity, check, message, suggestion, nodeName, nodeId, fixHint, onFocus,
}: ValidationItemProps) {
  const [expanded, setExpanded] = useState(false);
  const canLocate = !!nodeId && !!onFocus;
  const hasHint = Array.isArray(fixHint) && fixHint.length > 0;

  // Whole-row click does both things at once: focus the node in canvas AND
  // toggle the how-to-fix panel. Lets the user see + understand in one tap.
  const handleRowClick = () => {
    if (canLocate) onFocus!(nodeId!);
    if (hasHint) setExpanded(e => !e);
  };

  return (
    <div style={{
      padding: '8px 0',
      borderBottom: '1px solid var(--figma-color-border, #F0F0F0)',
      fontSize: '12px',
    }}>
      <div
        onClick={handleRowClick}
        style={{
          display: 'flex',
          gap: '8px',
          cursor: (canLocate || hasHint) ? 'pointer' : 'default',
        }}
        title={canLocate ? 'Click to locate in Figma canvas' : undefined}
      >
        <span style={{ flexShrink: 0, fontSize: '14px' }}>{ICONS[severity]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px', flexWrap: 'wrap' }}>
            <Badge severity={severity} />
            <span style={{ fontWeight: '500' }}>{check}</span>
            {nodeName && <span style={{ color: 'var(--figma-color-text-secondary, #999)' }}>({nodeName})</span>}
            {canLocate && (
              <span style={{
                marginLeft: 'auto',
                fontSize: '11px',
                color: 'var(--figma-color-text-brand, #0D99FF)',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}>
                {expanded ? '▼' : '▸'} {hasHint ? (expanded ? 'Hide' : 'How to fix') : 'Locate'}
              </span>
            )}
          </div>
          <div style={{ wordBreak: 'break-word' }}>{message}</div>
          {suggestion && !expanded && (
            <div style={{ color: 'var(--figma-color-text-secondary, #999)', fontStyle: 'italic', marginTop: '2px' }}>
              {suggestion}
            </div>
          )}
        </div>
      </div>

      {expanded && hasHint && (
        <div style={{
          marginTop: '8px',
          marginLeft: '22px',
          padding: '10px 12px',
          background: 'var(--figma-color-bg-secondary, #F5F5F5)',
          borderRadius: '6px',
          fontSize: '12px',
          lineHeight: '1.5',
        }}>
          <div style={{
            fontWeight: '600',
            marginBottom: '6px',
            color: 'var(--figma-color-text, #333)',
          }}>
            How to fix
          </div>
          <ol style={{ margin: 0, paddingLeft: '18px', color: 'var(--figma-color-text-secondary, #555)' }}>
            {fixHint!.map((line, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{line}</li>
            ))}
          </ol>
          {suggestion && (
            <div style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px dashed var(--figma-color-border, #E5E5E5)',
              fontStyle: 'italic',
              color: 'var(--figma-color-text-secondary, #888)',
            }}>
              {suggestion}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
