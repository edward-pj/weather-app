import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as Location from "expo-location";
import Toast from "react-native-toast-message"; // 👈 import toast

import HomeTabs from "./navigation/Tabs";
import { useWeatherStore } from "./store/useWeatherStore";

export default function App() {
  const [checking, setChecking] = useState(true);
  const [hasPermission, setHasPermission] = useState(null);

  const fetchWeather = useWeatherStore((s) => s.fetchWeather);

  useEffect(() => {
    (async () => {
      try {
        // ask for permission
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setHasPermission(false);
          Toast.show({
            type: "error",
            text1: "Location Permission Denied",
            text2: "Please use the Cities tab to search 🌆",
            visibilityTime: 3000,
          });
          setChecking(false);
          return;
        }

        // get location
        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;

        // fetch weather
        await fetchWeather(latitude, longitude, "My Location");

        setHasPermission(true);

        // 👇 optional success toast
        Toast.show({
          type: "success",
          text1: "Location Access Granted",
          text2: "Fetching weather for your current location 🌍",
          visibilityTime: 2500,
        });
      } catch (e) {
        console.warn("Location error:", e);
        setHasPermission(false);
        Toast.show({
          type: "error",
          text1: "Error fetching location",
          text2: e.message || "Please try again",
          visibilityTime: 3000,
        });
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    // loader while checking permission
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <HomeTabs hasPermission={hasPermission} />
      {/* 👇 Toast needs to be mounted once */}
      <Toast />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});