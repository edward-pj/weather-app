import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons"; // For tab icons
import { View, Text, StyleSheet } from "react-native";
import HomeTabs from "./navigation/Tabs";

export default function App() {
  return (
    <NavigationContainer>
      <HomeTabs/>
    </NavigationContainer>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
