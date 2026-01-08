import { View, Text } from "react-native";

export default function EmptyState({ emoji = "📭", title, subtitle }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 16,
        padding: 18,
        alignItems: "center",
        backgroundColor: "white"
      }}
    >
      <Text style={{ fontSize: 34 }}>{emoji}</Text>

      <Text style={{ fontWeight: "900", fontSize: 16, marginTop: 10, textAlign: "center" }}>
        {title}
      </Text>

      {!!subtitle && (
        <Text style={{ fontWeight: "700", marginTop: 6, textAlign: "center", color: "#444" }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
