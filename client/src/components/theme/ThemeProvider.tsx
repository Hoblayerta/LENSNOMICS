"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type Palette = "ethereum" | "polygon" | "optimism" | "arbitrum";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultPalette?: Palette;
};

type ThemeProviderState = {
  theme: Theme;
  palette: Palette;
  setTheme: (theme: Theme) => void;
  setPalette: (palette: Palette) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  palette: "ethereum",
  setTheme: () => null,
  setPalette: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultPalette = "ethereum",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [palette, setPalette] = useState<Palette>(defaultPalette);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("ethereum", "polygon", "optimism", "arbitrum");
    root.classList.add(palette);
  }, [palette]);

  const value = {
    theme,
    palette,
    setTheme,
    setPalette,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
