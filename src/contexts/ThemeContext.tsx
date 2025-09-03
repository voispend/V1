import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export type ColorTheme = 'purple' | 'blue' | 'green' | 'pink' | 'orange';

interface ThemeContextType {
  isDark: boolean;
  colorTheme: ColorTheme;
  toggleTheme: () => void;
  setColorTheme: (theme: ColorTheme) => void;
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('green'); // Voispend green default

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const savedTheme = await storage.getItem('theme');
      const savedColorTheme = await storage.getItem('color-theme') as ColorTheme;
      
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      }
      
      if (savedColorTheme) {
        setColorThemeState(savedColorTheme);
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await storage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const setColorTheme = async (theme: ColorTheme) => {
    setColorThemeState(theme);
    await storage.setItem('color-theme', theme);
  };

  const setThemeMode = async (mode: 'light' | 'dark' | 'auto') => {
    if (mode === 'dark') {
      setIsDark(true);
    } else if (mode === 'light') {
      setIsDark(false);
    }
    // For 'auto' theme, we could implement system theme detection here
    await storage.setItem('theme', mode);
  };

  return (
    <ThemeContext.Provider value={{ 
      isDark, 
      colorTheme, 
      toggleTheme, 
      setColorTheme,
      setThemeMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};