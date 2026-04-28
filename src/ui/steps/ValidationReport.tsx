import { h } from 'preact';
import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import { ValidationItem } from '../components/ValidationItem';
import { sendToPlugin, usePluginMessages } from '../hooks/usePluginMessages';

interface ValidationResult {
  severity: 'error' | 'warning' | 'info';
  check: string;
  message: string;
  sectionName?: string;
  nodeId?: string;
  nodeName?: string;
  suggestion?: string;
  fixHint?: string[];
}

interface ValidationReportProps {
  frameIds: string[];
  onExport: () => void;
  onBack: () => void;
}

type Severity = 'error' | 'warning' | 'info';

export function ValidationReport({ frameIds, onExport, onBack }: ValidationReportProps) {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Severity-filter state. All three start enabled — user opts out, not in.
  const [showErrors, setShowErrors] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);
  const [showInfo, setShowInfo] = useState(true);

  useEffect(() => {
    sendToPlugin({ type: 'VALIDATE', frameIds });
  }, []);

  usePluginMessages((msg) => {
    if (msg.type === 'VALIDATION_COMPLETE') {
      setResults(msg.results);
      setLoading(false);
    }
  });

  // Click-to-locate: ask the sandbox to scroll-and-zoom-into-view the node.
  const handleFocusNode = useCallback((nodeId: string) => {
    sendToPlugin({ type: 'FOCUS_NODE', nodeId });
  }, []);

  const errors = useMemo(() => results.filter(r => r.severity === 'error'), [results]);
  const warnings = useMemo(() => results.filter(r => r.severity === 'warning'), [results]);
  const infos = useMemo(() => results.filter(r => r.severity === 'info'), [results]);
  const hasErrors = errors.length > 0;

  // Apply severity filters. We render a flat list (no per-severity headers)
  // when filters are active, since the user's mental model is "show me only X".
  const visibleResults = useMemo(() => {
    return results.filter(r => {
      if (r.severity === 'error') return showErrors;
      if (r.severity === 'warning') return showWarnings;
      if (r.severity === 'info') return showInfo;
      return true;
    });
  }, [results, showErrors, showWarnings, showInfo]);

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

        {results.length === 0 ? (
          <div style={{ marginTop: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--figma-color-text-success, #14AE5C)' }}>
              All checks passed!
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
            <SeverityToggle
              severity="error"
              count={errors.length}
              checked={showErrors}
              onChange={setShowErrors}
              label="Errors"
              color="#FF4D4D"
            />
            <SeverityToggle
              severity="warning"
              count={warnings.length}
              checked={showWarnings}
              onChange={setShowWarnings}
              label="Warnings"
              color="#FFB020"
            />
            <SeverityToggle
              severity="info"
              count={infos.length}
              checked={showInfo}
              onChange={setShowInfo}
              label="Info"
              color="#4D9AFF"
            />
          </div>
        )}
      </div>

      {/* Results (flat list, filter applied) */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {results.length > 0 && visibleResults.length === 0 && (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--figma-color-text-secondary, #999)',
            fontSize: '13px',
          }}>
            No issues match the selected filters.
          </div>
        )}

        {visibleResults.map((r, i) => (
          <ValidationItem
            key={`${r.severity}-${r.check}-${i}-${r.nodeId || 'nonode'}`}
            {...r}
            onFocus={handleFocusNode}
          />
        ))}
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

interface SeverityToggleProps {
  severity: Severity;
  count: number;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  color: string;
}

function SeverityToggle({ severity, count, checked, onChange, label, color }: SeverityToggleProps) {
  const disabled = count === 0;
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '12px',
      fontWeight: 500,
      opacity: disabled ? 0.4 : 1,
      userSelect: 'none',
    }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        style={{ accentColor: color, cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      <span style={{ color }}>{label}</span>
      <span style={{
        background: color,
        color: '#fff',
        fontSize: '10px',
        fontWeight: 700,
        padding: '1px 6px',
        borderRadius: '8px',
        minWidth: '16px',
        textAlign: 'center',
      }}>
        {count}
      </span>
    </label>
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
