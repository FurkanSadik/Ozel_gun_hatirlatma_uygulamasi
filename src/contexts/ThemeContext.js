import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkTheme, lightTheme } from "../theme/themes";

const ThemeContext = createContext(null);
const STORAGE_KEY = "app_theme_mode";

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!alive) return;
        if (saved === "dark" || saved === "light") setMode(saved);
      } finally {
        if (alive) setHydrating(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const setModePersist = async (next) => {
    const v = next === "dark" ? "dark" : "light";
    setMode(v);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, v);
    } catch {}
  };

  const toggleTheme = async () => {
    const next = mode === "dark" ? "light" : "dark";
    await setModePersist(next);
  };

  const value = useMemo(() => {
    const navTheme = mode === "dark" ? darkTheme : lightTheme;

    return {
      mode,
      navTheme,
      hydrating,
      setMode: setModePersist,
      toggleTheme
    };
  }, [mode, hydrating]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("ThemeContext.Provider yok. App.js içinde ThemeProvider sarmaladığından emin ol.");
  return ctx;
}
