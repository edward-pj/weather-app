// screens/WeatherScreen.js
import React, { useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRoute } from "@react-navigation/native";
import { useWeatherStore } from "../store/useWeatherStore";

const { width: SCREEN_W } = Dimensions.get("window");
const CIRCLE_SIZE = Math.round(SCREEN_W * 0.62);

// themes
const weatherThemes = {
  Clear: { background: require("../assets/sunny.png"), textColor: "#fff" },
  Clouds: { background: require("../assets/evening.png"), textColor: "#222" },
  Rain: { background: require("../assets/rain.png"), textColor: "#fff" },
  Thunderstorm: { background: require("../assets/rain.png"), textColor: "#fff" },
  Snow: { background: require("../assets/snow.png"), textColor: "#000" },
  Mist: { background: require("../assets/evening.png"), textColor: "#222" },
  Default: { background: require("../assets/sunny.png"), textColor: "#fff" },
};

// helper: decide theme based on API condition
const getThemeForCondition = (condition) => {
  if (!condition) return weatherThemes.Default;
  return weatherThemes[condition] || weatherThemes.Default;
};

export default function WeatherScreen() {
  const route = useRoute();
  const { lat, lon, name } = route.params || {};

  const { weather, loading, fetchWeather } = useWeatherStore();

  useEffect(() => {
    if (lat && lon) fetchWeather(lat, lon, name);
  }, [lat, lon]);

  if (loading || !weather) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  // apply theme
  const theme = getThemeForCondition(weather.condition);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={theme.background}
        style={styles.background}
        resizeMode="cover"
        blurRadius={6}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={[styles.city, { color: theme.textColor }]}>{weather.city}</Text>
            <Text style={[styles.updated, { color: theme.textColor }]}>
              Updated: {weather.lastUpdated}
            </Text>
          </View>

          {/* MAIN TEMP */}
          <View style={styles.centerArea}>
            <BlurView intensity={30} tint="light" style={styles.circle}>
              <Text style={[styles.conditionSmall, { color: theme.textColor }]}>
                {weather.condition}
              </Text>
              <Text style={[styles.temp, { color: theme.textColor }]}>{weather.temp}°</Text>
              <Text style={[styles.highLow, { color: theme.textColor }]}>
                Feels like: {weather.feelsLike ?? "—"}°
              </Text>
            </BlurView>
          </View>

          {/* METRICS */}
          <View style={styles.metricsRow}>
            <BlurView intensity={40} tint="light" style={styles.metricCard}>
              <Text style={styles.metricLabel}>Humidity</Text>
              <Text style={styles.metricValue}>{weather.humidity}%</Text>
            </BlurView>
            <BlurView intensity={40} tint="light" style={styles.metricCard}>
              <Text style={styles.metricLabel}>Wind</Text>
              <Text style={styles.metricValue}>{weather.wind} m/s</Text>
            </BlurView>
          </View>
          <View style={styles.metricsRow}>
            <BlurView intensity={40} tint="light" style={styles.metricCard}>
              <Text style={styles.metricLabel}>Sunrise</Text>
              <Text style={styles.metricValue}>{weather.sunrise}</Text>
            </BlurView>
            <BlurView intensity={40} tint="light" style={styles.metricCard}>
              <Text style={styles.metricLabel}>Sunset</Text>
              <Text style={styles.metricValue}>{weather.sunset}</Text>
            </BlurView>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  header: { alignItems: "center", paddingTop: 80 },
  city: { fontSize: 24, fontWeight: "700", letterSpacing: 2 },
  updated: { fontSize: 12, marginTop: 6, opacity: 0.8 },

  centerArea: { alignItems: "center", marginTop: 24 },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderColor: "rgba(255,255,255,0.4)",
    borderWidth: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  conditionSmall: { fontSize: 18, marginBottom: 6, fontWeight: "600" },
  temp: { fontSize: 110, fontWeight: "bold" },
  highLow: { marginTop: 6, fontSize: 16, opacity: 0.8 },

  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 24,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20, // more rounded corners
    padding: 22,
    marginHorizontal: 6,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  metricLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6, opacity: 0.8 },
  metricValue: { fontSize: 20, fontWeight: "700" },
});