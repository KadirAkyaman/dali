import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../../types/settings';
import { LocalSettingsRepository } from '../../repositories/localRepository';

export type ResolvedTheme =
  | 'light'
  | 'dark'
  | 'oled'
  | 'midnight'
  | 'forest'
  | 'amethyst'
  | 'espresso'
  | 'sage'
  | 'slate'
  | 'peach'
  | 'mocha';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const settingsRepo = new LocalSettingsRepository();

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [systemIsDark, setSystemIsDark] = useState<boolean>(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    // Load initial setting
    settingsRepo.getSettings().then((settings) => {
      setThemeState(settings.theme);
    });

    // Listen to system preference changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemIsDark(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? (systemIsDark ? 'dark' : 'light') : (theme as ResolvedTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    await settingsRepo.updateSettings({ theme: newTheme });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
