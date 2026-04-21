import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { ValidationItem } from '../components/ValidationItem';
import { Badge } from '../components/Badge';
import { sendToPlugin, usePluginMessages } from '../hooks/usePluginMessages';

interface ValidationResult {
  severity: 'error' | 'warning' | 'info';
  check: string;
  message: string;
  sectionName?: string;
  nodeId?: string;
  nodeName?: string;
  suggestion?: string;
}

interface ValidationReportProps {
  frameIds: string[];
  onExport: () => void;
  onBack: () => void;
}

export function ValidationReport({ frameIds, onExport, onBack }: ValidationReportProps) {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sendToPlugin({ type: 'VALIDATE', frameIds });
  }, []);

  usePluginMessages((msg) => {
    if (msg.type === 'VALIDATION_COMPLETE') {
      setResults(msg.results);
      setLoading(false);
    }
  });

  const errors = results.filter(r => r.severity === 'error');
  const warnings = results.filter(r => r.severity === 'warning');
  const infos = results.filter(r => r.severity === 'info');
  const hasErrors = errors.length > 0;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--figma-color-text-secondary, #999)' }}>
          Running validation checks...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--figma-color-border, #E5E5E5)' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Validation Report</h2>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {errors.length > 0 && <Badge severity="error" count={errors.length} />}
          {warnings.length > 0 && <Badge severity="warning" count={warnings.length} />}
          {infos.length > 0 && <Badge severity="info" count={infos.length} />}
          {results.length === 0 && (
            <span style={{ fontSize: '13px', color: 'var(--figma-color-text-success, #14AE5C)' }}>
              All checks passed!
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {hasErrors && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#FF4D4D', marginBottom: '6px' }}>
              ERRORS (must fix before export)
            </div>
            {errors.map((r, i) => (
              <ValidationItem key={`e-${i}`} {...r} />
            ))}
          </div>
        )}

        {warnings.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#FFB020', marginBottom: '6px' }}>
              WARNINGS (export allowed)
            </div>
            {warnings.map((r, i) => (
              <ValidationItem key={`w-${i}`} {...r} />
            ))}
          </div>
        )}

        {infos.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#4D9AFF', marginBottom: '6px' }}>
              INFO
            </div>
            {infos.map((r, i) => (
              <ValidationItem key={`i-${i}`} {...r} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--figma-color-border, #E5E5E5)', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={btnStyle}>Back</button>
        <button
          onClick={onExport}
          disabled={hasErrors}
          style={{
            ...primaryBtnStyle,
            opacity: hasErrors ? 0.5 : 1,
            cursor: hasErrors ? 'not-allowed' : 'pointer',
          }}
        >
          {hasErrors ? 'Fix Errors to Export' : 'Export'}
        </button>
      </div>
    </div>
  );
}

const btnStyle: h.JSX.CSSProperties = {
  padding: '8px 16px',
  fontSize: '13px',
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
};
