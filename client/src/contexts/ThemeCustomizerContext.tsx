import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
}

interface ThemeCustomizerContextType {
  colors: ThemeColors;
  setColors: (colors: Partial<ThemeColors>) => void;
  resetColors: () => void;
}

const ThemeCustomizerContext = createContext<ThemeCustomizerContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'carrier-dispute-theme-colors';

// Default Catch The Fever / ShipStation-inspired colors
const DEFAULT_COLORS: ThemeColors = {
  primary: '#2C5F2D',      // Dark green (ShipStation-inspired)
  primaryDark: '#1E4620',  // Darker green for header
  primaryLight: '#3A7A3E', // Lighter green for hover
  accent: '#5CAF63',       // Bright green accent
};

interface ThemeCustomizerProviderProps {
  children: ReactNode;
}

export function ThemeCustomizerProvider({ children }: ThemeCustomizerProviderProps) {
  const [colors, setColorsState] = useState<ThemeColors>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        try {
          return { ...DEFAULT_COLORS, ...JSON.parse(stored) };
        } catch (e) {
          console.error('Failed to parse stored theme colors:', e);
        }
      }
    }
    return DEFAULT_COLORS;
  });

  // Apply colors to CSS variables whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--ss-green-800', colors.primary);
      root.style.setProperty('--ss-green-900', colors.primaryDark);
      root.style.setProperty('--ss-green-700', colors.primaryLight);
      root.style.setProperty('--ss-green-600', colors.accent);

      // Save to localStorage
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(colors));
    }
  }, [colors]);

  const setColors = (newColors: Partial<ThemeColors>) => {
    setColorsState((prev) => ({ ...prev, ...newColors }));
  };

  const resetColors = () => {
    setColorsState(DEFAULT_COLORS);
  };

  return (
    <ThemeCustomizerContext.Provider value={{ colors, setColors, resetColors }}>
      {children}
    </ThemeCustomizerContext.Provider>
  );
}

export function useThemeCustomizer() {
  const context = useContext(ThemeCustomizerContext);
  if (context === undefined) {
    throw new Error('useThemeCustomizer must be used within a ThemeCustomizerProvider');
  }
  return context;
}
