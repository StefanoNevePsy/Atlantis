import React, { useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  selectedFolderId: string | undefined;
  onSelectFolder: (folderId: string | undefined) => void;
}

export const FolderPanel: React.FC<Props> = ({
  selectedFolderId,
  onSelectFolder,
}) => {
  const { folders, createFolder } =
    useWorkspaceStore();
  const { currentTheme } = useThemeStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreate = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const folderList = Object.values(folders);

  return (
    <div>
      <div
        style={{
          fontSize: currentTheme.typography.fontSize.xs,
          color: currentTheme.colors.textMuted,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Spaces</span>
        <button
          onClick={() => setIsCreating(true)}
          style={{
            border: 'none',
            background: 'transparent',
            color: currentTheme.colors.textMuted,
            cursor: 'pointer',
            fontSize: '14px',
            padding: '0 4px',
          }}
        >
          +
        </button>
      </div>

      {/* All canvases */}
      <button
        onClick={() => onSelectFolder(undefined)}
        style={{
          display: 'block',
          width: '100%',
          padding: '6px 10px',
          border: 'none',
          background:
            selectedFolderId === undefined
              ? currentTheme.colors.surfaceHover
              : 'transparent',
          color: currentTheme.colors.text,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: currentTheme.typography.fontFamily,
          fontSize: currentTheme.typography.fontSize.sm,
          borderRadius: currentTheme.decorations.borderRadius,
          marginBottom: 2,
        }}
      >
        All Canvases
      </button>

      {folderList.map((folder) => (
        <div
          key={folder.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <button
            onClick={() => onSelectFolder(folder.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              border: 'none',
              background:
                selectedFolderId === folder.id
                  ? currentTheme.colors.surfaceHover
                  : 'transparent',
              color: currentTheme.colors.text,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: currentTheme.typography.fontFamily,
              fontSize: currentTheme.typography.fontSize.sm,
              borderRadius: currentTheme.decorations.borderRadius,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: folder.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {folder.name}
            </span>
            <span
              style={{
                fontSize: '10px',
                color: currentTheme.colors.textMuted,
                marginLeft: 'auto',
              }}
            >
              {folder.canvasIds.length}
            </span>
          </button>
        </div>
      ))}

      {isCreating && (
        <div style={{ padding: '4px 0' }}>
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setIsCreating(false);
            }}
            onBlur={handleCreate}
            placeholder="Folder name..."
            style={{
              width: '100%',
              padding: '4px 10px',
              border: `1px solid ${currentTheme.colors.border}`,
              borderRadius: currentTheme.decorations.borderRadius,
              background: currentTheme.colors.background,
              color: currentTheme.colors.text,
              fontFamily: currentTheme.typography.fontFamily,
              fontSize: currentTheme.typography.fontSize.sm,
              outline: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
};
