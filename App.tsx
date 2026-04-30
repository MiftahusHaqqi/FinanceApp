import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import { setupDatabase } from "./database/db";

// ─── Screens ──────────────────────────────────────────────────────────────────
import DashboardScreen from "./app/tabs/index";
import HistoryScreen from "./app/tabs/history";
import StatisticsScreen from "./app/tabs/statistics";
import SettingsScreen from "./app/tabs/settings";

const Tab = createBottomTabNavigator();

// ─── Tab icon helper ──────────────────────────────────────────────────────────
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: focused ? 24 : 20 }}>{emoji}</Text>
    </View>
  );
}

export default function App() {
  // Setup database sekali saat app pertama dibuka
  useEffect(() => {
    setupDatabase();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: "#F0F0F0",
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: "#6C5CE7",
          tabBarInactiveTintColor: "#aaa",
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "500",
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: "Beranda",
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🏠" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarLabel: "Riwayat",
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="📋" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{
            tabBarLabel: "Statistik",
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="📊" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: "Setelan",
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="⚙️" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
