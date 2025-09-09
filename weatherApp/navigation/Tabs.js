import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import WeatherScreen from "../screens/WeatherScreen";
import CitiesScreen from "../screens/CitiesScreen";
import { StyleSheet } from "react-native";

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
        headerShown: false, // hide the default header
        tabBarStyle: styles.tabBarStyle,
        tabBarItemStyle: styles.tabBarItemStyle,
      }}
    >
      {/* 🌤️ Weather Tab */}
      <Tab.Screen
        name="Weather"
        component={WeatherScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "cloud" : "cloud-outline"}
              size={size}
              color={color}
            />
          ),
          tabBarActiveBackgroundColor: "#ca8a04", // active tab background
          tabBarActiveTintColor: "#ffffff", // active icon/text color
          tabBarInactiveTintColor: "#0007", // inactive icon/text color
        }}
      />

      {/* 🏙️ Cities Tab */}
      <Tab.Screen
        name="Cities"
        component={CitiesScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "list" : "list-outline"}
              size={size}
              color={color}
            />
          ),
          tabBarActiveBackgroundColor: "#ca8a04",
          tabBarActiveTintColor: "#ffffff",
          tabBarInactiveTintColor: "#0007",
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarStyle: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 40,
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 20,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
  },
  tabBarItemStyle: {
    borderRadius: 200,
    marginBottom: -20,
  },
});

export default HomeTabs;