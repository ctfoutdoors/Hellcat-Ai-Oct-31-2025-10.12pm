import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "system" | "hellcat" | "blue" | "dark-gray" | "night" | "light";
export type FontSize = "small" | "medium" | "large" | "extra-large";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  effectiveTheme: Exclude<Theme, "system">;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "blue",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("hellcat-theme");
    return (stored as Theme) || defaultTheme;
  });
  
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const stored = localStorage.getItem("hellcat-font-size");
    return (stored as FontSize) || "medium";
  });
  
  // Detect system theme preference
  const [systemTheme, setSystemTheme] = useState<"hellcat" | "blue" | "dark-gray" | "night" | "light">(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "blue";
    }
    return "blue";
  });
  
  const effectiveTheme = theme === "system" ? systemTheme : theme;

  // Apply theme immediately on mount (before React hydration)
  useEffect(() => {
    const root = window.document.documentElement;
    const storedTheme = localStorage.getItem("hellcat-theme") as Theme;
    if (storedTheme) {
      const effective = storedTheme === "system" 
        ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "blue")
        : storedTheme;
      root.setAttribute("data-theme", effective);
      console.log("[ThemeContext] Initial theme applied from localStorage:", storedTheme, "Effective:", effective);
    }
  }, []); // Run once on mount

  // Update theme when it changes
  useEffect(() => {
    console.log("[ThemeContext] Setting theme:", theme, "Effective:", effectiveTheme);
    const root = window.document.documentElement;
    root.setAttribute("data-theme", effectiveTheme);
    localStorage.setItem("hellcat-theme", theme);
  }, [theme, effectiveTheme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-font-size", fontSize);
    localStorage.setItem("hellcat-font-size", fontSize);
  }, [fontSize]);
  
  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "light" : "blue");
    };
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const setTheme = (newTheme: Theme) => {
    console.log("[ThemeContext] setTheme called with:", newTheme);
    setThemeState(newTheme);
  };
  
  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
