import { h } from 'preact';

interface FrameCardProps {
  id: string;
  name: string;
  width: number;
  height: number;
  breakpoint: string;
  sectionCount: number;
  selected: boolean;
  responsivePairName: string | null;
  onToggle: (id: string) => void;
}

const BP_COLORS: Record<string, string> = {
  mobile: '#FF4DA6',
  tablet: '#FFB020',
  desktop: '#4D9AFF',
  large: '#8B5CF6',
};

export function FrameCard({ id, name, width, height, breakpoint, sectionCount, selected, responsivePairName, onToggle }: FrameCardProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        backgroundColor: selected ? 'var(--figma-color-bg-selected, #E8F0FE)' : 'transparent',
        border: `1px solid ${selected ? 'var(--figma-color-border-brand, #0D99FF)' : 'var(--figma-color-border, #E5E5E5)'}`,
        transition: 'all 0.15s ease',
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(id)}
        style={{ flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '500', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--figma-color-text-secondary, #999)', marginTop: '2px' }}>
          {width} x {height}px &middot; {sectionCount} sections
          {responsivePairName && (
            <span style={{ marginLeft: '6px', color: BP_COLORS[breakpoint] || '#999' }}>
              Paired with: {responsivePairName}
            </span>
          )}
        </div>
      </div>
      <span style={{
        fontSize: '10px',
        fontWeight: '600',
        padding: '2px 6px',
        borderRadius: '8px',
        backgroundColor: BP_COLORS[breakpoint] || '#999',
        color: '#FFF',
        textTransform: 'uppercase',
      }}>
        {breakpoint}
      </span>
    </label>
  );
}
