import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import UpcomingScreen from "../screens/UpcomingScreen";
import CalendarScreen from "../screens/CalendarScreen";
import PastScreen from "../screens/PastScreen";
import AccountScreen from "../screens/AccountScreen";
import { Text } from "react-native";

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        tabBarLabelStyle: { fontSize: 12 }
      }}
    >
      <Tab.Screen
        name="Yaklaşan Günler"
        component={UpcomingScreen}
        options={{
          tabBarLabel: () => <Text>⏳ Yaklaşan Günler</Text>
        }}
      />

      <Tab.Screen
        name="Takvim"
        component={CalendarScreen}
        options={{
          tabBarLabel: () => <Text>📅 Takvim</Text>
        }}
      />

      <Tab.Screen
        name="Geçmiş Günler"
        component={PastScreen}
        options={{
          tabBarLabel: () => <Text>📜 Geçmiş Günler</Text>
        }}
      />

      <Tab.Screen
        name="Hesap"
        component={AccountScreen}
        options={{
          tabBarLabel: () => <Text>⚙️ Hesap</Text>
        }}
      />
    </Tab.Navigator>
  );
}
