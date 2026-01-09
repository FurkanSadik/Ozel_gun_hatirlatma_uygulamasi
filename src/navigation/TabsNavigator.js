import React from "react";
import { View, Text, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import UpcomingScreen from "../screens/UpcomingScreen";
import PastScreen from "../screens/PastScreen";
import AccountScreen from "../screens/AccountScreen";
import CalendarStack from "./CalendarStack";
import { useAppTheme } from "../contexts/ThemeContext";

const Tab = createBottomTabNavigator();

const TwoLineLabel = ({ line1, line2, focused, activeColor, inactiveColor }) => {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", height: 30 }}>
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 11,
          lineHeight: 12,
          textAlign: "center",
          fontWeight: "700",
          color: focused ? activeColor : inactiveColor,
          ...(Platform.OS === "android" ? { includeFontPadding: false } : {})
        }}
      >
        {line1}
      </Text>

      {!!line2 && (
        <Text
          allowFontScaling={false}
          style={{
            fontSize: 11,
            lineHeight: 12,
            textAlign: "center",
            fontWeight: "700",
            color: focused ? activeColor : inactiveColor,
            ...(Platform.OS === "android" ? { includeFontPadding: false } : {})
          }}
        >
          {line2}
        </Text>
      )}
    </View>
  );
};

export default function TabsNavigator() {
  const { navTheme } = useAppTheme();
  const C = navTheme.colors;

  const activeLabelColor = C.text;
  const inactiveLabelColor = navTheme.dark ? "#94a3b8" : "#6b7280";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: "center",

        tabBarStyle: {
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: C.card,
          borderTopColor: C.border,
          borderTopWidth: 1
        },

        tabBarItemStyle: { justifyContent: "center" },

        tabBarIconStyle: { marginTop: 2 },

        tabBarIcon: ({ focused }) => {
          let iconName = "";
          let iconColor = "";

          if (route.name === "Upcoming") {
            iconName = focused ? "time" : "time-outline";
            iconColor = "#f39c12";
          }

          if (route.name === "Calendar") {
            iconName = focused ? "calendar" : "calendar-outline";
            iconColor = "#3498db";
          }

          if (route.name === "Past") {
            iconName = focused ? "archive" : "archive-outline";
            iconColor = "#8e44ad";
          }

          if (route.name === "Account") {
            iconName = focused ? "settings" : "settings-outline";
            iconColor = navTheme.dark ? "#cbd5e1" : "#2c3e50";
          }

          return <Ionicons name={iconName} size={22} color={iconColor} />;
        }
      })}
    >
      <Tab.Screen
        name="Upcoming"
        component={UpcomingScreen}
        options={{
          title: "Yaklaşan Günler",
          tabBarLabel: ({ focused }) => (
            <TwoLineLabel
              line1="Yaklaşan"
              line2="Günler"
              focused={focused}
              activeColor={activeLabelColor}
              inactiveColor={inactiveLabelColor}
            />
          )
        }}
      />

      <Tab.Screen
        name="Calendar"
        component={CalendarStack}
        options={{
          headerShown: false,
          title: "Takvim",
          tabBarLabel: ({ focused }) => (
            <TwoLineLabel
              line1="Takvim"
              focused={focused}
              activeColor={activeLabelColor}
              inactiveColor={inactiveLabelColor}
            />
          )
        }}
      />

      <Tab.Screen
        name="Past"
        component={PastScreen}
        options={{
          title: "Geçmiş Günler",
          tabBarLabel: ({ focused }) => (
            <TwoLineLabel
              line1="Geçmiş"
              line2="Günler"
              focused={focused}
              activeColor={activeLabelColor}
              inactiveColor={inactiveLabelColor}
            />
          )
        }}
      />

      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: "Hesap",
          tabBarLabel: ({ focused }) => (
            <TwoLineLabel
              line1="Hesap"
              focused={focused}
              activeColor={activeLabelColor}
              inactiveColor={inactiveLabelColor}
            />
          )
        }}
      />
    </Tab.Navigator>
  );
}
