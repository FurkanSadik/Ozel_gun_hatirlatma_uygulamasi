import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import TabsNavigator from "./TabsNavigator";
import AuthNavigator from "./AuthNavigator";
import { useAppTheme } from "../contexts/ThemeContext";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { navTheme, hydrating } = useAppTheme();

  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  if (hydrating || !ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: navTheme?.colors?.background || "#fff"
        }}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 10, fontWeight: "700", color: navTheme?.colors?.text || "#111" }}>
          Yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="AppTabs" component={TabsNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
