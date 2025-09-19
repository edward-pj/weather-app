// navigation/Tabs.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import WeatherScreen from "../screens/WeatherScreen";
import CitiesScreen from "../screens/CitiesScreen";

const Tab = createBottomTabNavigator();

/**
 * HomeTabs component
 * @param {boolean} hasPermission - whether location permission was granted
 */
const HomeTabs = ({ hasPermission }) => {
  return (
    <Tab.Navigator
      // 👇 If permission granted → Weather is default tab, else → Cities
      initialRouteName={hasPermission ? "Weather" : "Cities"}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // hide labels
        tabBarStyle: styles.tabBarStyle,
      }}
    >
      {/* 🌤️ Weather Tab */}
      <Tab.Screen
        name="Weather"
        component={WeatherScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View style={focused ? styles.activeIconWrapper : null}>
              <Ionicons
                name={focused ? "cloud" : "cloud-outline"}
                size={focused ? 26 : size}
                color={focused ? "#fff" : "#1e3a8a"}
              />
            </View>
          ),
        }}
      />

      {/* 🏙️ Cities Tab */}
      <Tab.Screen
        name="Cities"
        component={CitiesScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <View style={focused ? styles.activeIconWrapper : null}>
              <Ionicons
                name={focused ? "list" : "list-outline"}
                size={focused ? 26 : size}
                color={focused ? "#fff" : "#1e3a8a"}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarStyle: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 40,
    backgroundColor: "#fff",
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    paddingHorizontal: 30,
    paddingTop:15,
    marginBottom: 25,
    marginLeft:15,
    marginRight:15,
  },
  activeIconWrapper: {
    backgroundColor: "#1e3a8a", // dark blue circle
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    width: 160,
    height: 55,
    elevation: 10,
  },
});

export default HomeTabs;