import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  cardId: string;
  collapsed: boolean;
  hiddenCount: number;
}

export const CollapseIndicator: React.FC<Props> = ({
  cardId,
  collapsed,
  hiddenCount,
}) => {
  const { toggleCollapse } = useCanvasStore();
  const { currentTheme } = useThemeStore();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleCollapse(cardId);
      }}
      style={{
        position: 'absolute',
        right: -12,
        bottom: -12,
        width: collapsed ? 28 : 22,
        height: collapsed ? 28 : 22,
        borderRadius: '50%',
        border: `2px solid ${currentTheme.colors.border}`,
        background: collapsed ? currentTheme.colors.primary : currentTheme.colors.surface,
        color: collapsed ? '#fff' : currentTheme.colors.text,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontFamily: currentTheme.typography.fontFamilyMono,
        fontWeight: 700,
        padding: 0,
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: currentTheme.decorations.shadowStyle,
        zIndex: 10,
      }}
      title={collapsed ? `Expand (${hiddenCount} hidden)` : 'Collapse'}
    >
      {collapsed ? hiddenCount : '−'}
    </button>
  );
};
