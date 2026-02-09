import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeDefinition } from '../types';
import { themes } from '../themes';

interface ThemeState {
  currentThemeId: string;
  currentTheme: ThemeDefinition;
  setTheme: (themeId: string) => void;
  getAllThemes: () => ThemeDefinition[];
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentThemeId: 'neobrutalist-light',
      currentTheme: themes['neobrutalist-light'],

      setTheme: (themeId: string) => {
        const theme = themes[themeId];
        if (theme) {
          set({ currentThemeId: themeId, currentTheme: theme });
        }
      },

      getAllThemes: () => Object.values(themes),
    }),
    {
      name: 'atlantis-theme',
    }
  )
);
