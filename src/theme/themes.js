import { DefaultTheme, DarkTheme } from "@react-navigation/native";

export const lightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
    card: "#ffffff",
    text: "#111827",
    border: "#e5e7eb",
    primary: "#111827",
    notification: "#ef4444"
  }
};

export const darkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background: "#0b0f14",
    card: "#0f172a",
    text: "#f9fafb",
    border: "#1f2937",
    primary: "#f9fafb",
    notification: "#ef4444"
  }
};
