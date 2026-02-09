import React from 'react';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<Props> = ({ value, onChange }) => {
  const { currentTheme } = useThemeStore();

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        maxWidth: 400,
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: currentTheme.colors.textMuted,
          fontSize: currentTheme.typography.fontSize.sm,
          pointerEvents: 'none',
        }}
      >
        /
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search canvases, tags..."
        style={{
          width: '100%',
          padding: '8px 12px 8px 28px',
          border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}40`,
          borderRadius: currentTheme.decorations.borderRadius,
          background: currentTheme.colors.surface,
          color: currentTheme.colors.text,
          fontFamily: currentTheme.typography.fontFamilyMono,
          fontSize: currentTheme.typography.fontSize.sm,
          outline: 'none',
          transition: 'border-color 0.2s ease',
        }}
        onFocus={(e) => {
          (e.target as HTMLElement).style.borderColor = currentTheme.colors.primary;
        }}
        onBlur={(e) => {
          (e.target as HTMLElement).style.borderColor = currentTheme.colors.border + '40';
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            border: 'none',
            background: 'transparent',
            color: currentTheme.colors.textMuted,
            cursor: 'pointer',
            fontSize: '14px',
            padding: '0 4px',
          }}
        >
          x
        </button>
      )}
    </div>
  );
};
