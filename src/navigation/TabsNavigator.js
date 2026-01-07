import React from "react";
import { View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import UpcomingScreen from "../screens/UpcomingScreen";
import CalendarScreen from "../screens/CalendarScreen";
import PastScreen from "../screens/PastScreen";
import AccountScreen from "../screens/AccountScreen";

const Tab = createBottomTabNavigator();

const TabLabel = ({ text, focused }) => (
  <Text
    style={{
      fontSize: 11,
      lineHeight: 12,
      textAlign: "center",
      color: focused ? "#000" : "#777",
      marginTop: 2
    }}
  >
    {text}
  </Text>
);

export default function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: "center",
        tabBarStyle: {
          height: 68,
          paddingBottom: 6,
          paddingTop: 6
        },
        tabBarItemStyle: {
          justifyContent: "center"
        },
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
            iconColor = "#2c3e50";
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
            <TabLabel text={"Yaklaşan\nGünler"} focused={focused} />
          )
        }}
      />

      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: "Takvim",
          tabBarLabel: ({ focused }) => (
            <TabLabel text={"Takvim"} focused={focused} />
          )
        }}
      />

      <Tab.Screen
        name="Past"
        component={PastScreen}
        options={{
          title: "Geçmiş Günler",
          tabBarLabel: ({ focused }) => (
            <TabLabel text={"Geçmiş\nGünler"} focused={focused} />
          )
        }}
      />

      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: "Hesap",
          tabBarLabel: ({ focused }) => (
            <TabLabel text={"Hesap"} focused={focused} />
          )
        }}
      />
    </Tab.Navigator>
  );
}
