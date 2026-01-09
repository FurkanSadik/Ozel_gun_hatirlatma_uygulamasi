import React from "react";
import { View, Text } from "react-native";
import { useAppTheme } from "../contexts/ThemeContext";

export default function EmptyState({
  emoji = "✨",
  title = "Boş",
  subtitle = "",
  variant = "default" 
}) {
  const { navTheme, mode } = useAppTheme();
  const C = navTheme.colors;

  const softBg = mode === "dark" ? "#2a1216" : "#fff1f2";  
  const softBorder = mode === "dark" ? "#7f1d1d" : "#fecdd3";

  const containerStyle =
    variant === "soft"
      ? {
          backgroundColor: softBg,
          borderColor: softBorder,
          borderWidth: 1
        }
      : {
          backgroundColor: C.card,
          borderColor: C.border,
          borderWidth: 1
        };

  return (
    <View
      style={{
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
        gap: 6,
        ...containerStyle
      }}
    >
      <Text style={{ fontSize: 28 }}>{emoji}</Text>

      <Text style={{ fontWeight: "900", fontSize: 16, color: C.text, textAlign: "center" }}>
        {title}
      </Text>

      {!!subtitle && (
        <Text
          style={{
            fontWeight: "700",
            color: mode === "dark" ? "#cbd5e1" : "#374151",
            textAlign: "center"
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
