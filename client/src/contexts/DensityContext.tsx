import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DensityLevel = 'compact' | 'normal' | 'detailed';

interface DensityContextType {
  density: DensityLevel;
  setDensity: (level: DensityLevel) => void;
  toggleDensity: () => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

const DENSITY_STORAGE_KEY = 'carrier-dispute-density-level';

interface DensityProviderProps {
  children: ReactNode;
  defaultDensity?: DensityLevel;
}

export function DensityProvider({ children, defaultDensity = 'normal' }: DensityProviderProps) {
  const [density, setDensityState] = useState<DensityLevel>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DENSITY_STORAGE_KEY);
      if (stored && ['compact', 'normal', 'detailed'].includes(stored)) {
        return stored as DensityLevel;
      }
    }
    return defaultDensity;
  });

  // Save to localStorage whenever density changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DENSITY_STORAGE_KEY, density);
      // Apply density class to body for global CSS
      document.body.classList.remove('density-compact', 'density-normal', 'density-detailed');
      document.body.classList.add(`density-${density}`);
    }
  }, [density]);

  const setDensity = (level: DensityLevel) => {
    setDensityState(level);
  };

  const toggleDensity = () => {
    setDensityState((current) => {
      switch (current) {
        case 'compact':
          return 'normal';
        case 'normal':
          return 'detailed';
        case 'detailed':
          return 'compact';
        default:
          return 'normal';
      }
    });
  };

  return (
    <DensityContext.Provider value={{ density, setDensity, toggleDensity }}>
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity() {
  const context = useContext(DensityContext);
  if (context === undefined) {
    throw new Error('useDensity must be used within a DensityProvider');
  }
  return context;
}

// Utility hook to get density-specific values
export function useDensityValue<T>(values: Record<DensityLevel, T>): T {
  const { density } = useDensity();
  return values[density];
}

// Density level metadata
export const DENSITY_INFO: Record<DensityLevel, { label: string; description: string; icon: string }> = {
  compact: {
    label: 'Compact',
    description: 'Maximum information density for power users',
    icon: '▪▪▪',
  },
  normal: {
    label: 'Normal',
    description: 'Balanced density for general use',
    icon: '▪▪',
  },
  detailed: {
    label: 'Detailed',
    description: 'Maximum readability with generous spacing',
    icon: '▪',
  },
};
