// screens/WeatherScreen.js
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  ImageBackground,
  RefreshControl,
} from "react-native";
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

  if (condition === "Clear") {
    const hour = new Date().getHours();
    if (hour >= 19 || hour < 5) {
      return { background: require("../assets/night.png"), textColor: "#fff" };
    }
    return weatherThemes.Clear;
  }

  return weatherThemes[condition] || weatherThemes.Default;
};

export default function WeatherScreen() {
  const route = useRoute();
  const { lat, lon, name } = route.params || {};

  const { weather, loading, fetchWeather } = useWeatherStore();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWeather(lat, lon, name);
    setRefreshing(false);
  };

  useEffect(() => {
    if (lat && lon) fetchWeather(lat, lon, name);
  }, [lat, lon]);

  if (loading || !weather) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  // apply theme
  const theme = getThemeForCondition(weather.condition);

  // fallback lighter shade for UI if gradientColors missing
  const lightBg =
    weather.gradientColors?.[2] || "rgba(255, 255, 255, 0.28)"; // use bottom gradient color as base

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={theme.background}
        style={styles.background}
        resizeMode="cover"
        blurRadius={6}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={[styles.city, { color: theme.textColor }]}>
              {weather.city}
            </Text>
            <Text style={[styles.updated, { color: theme.textColor }]}>
              Updated: {weather.lastUpdated}
            </Text>
          </View>

          {/* MAIN TEMP */}
          <View style={styles.centerArea}>
            <View
              style={[
                styles.circle,
                { backgroundColor: lightBg + "CC" }, // semi-transparent lighter shade
              ]}
            >
              <Text style={[styles.conditionSmall, { color: "#fff" }]}>
                {weather.condition}
              </Text>
              <Text style={[styles.temp, { color: "#fff" }]}>
                {weather.temp}°
              </Text>
              <Text style={[styles.highLow, { color: "#fff" }]}>
                Feels like: {weather.feelsLike ?? "—"}°
              </Text>
            </View>
          </View>

          {/* METRICS */}
          <View style={styles.metricsRow}>
            <View
              style={[styles.metricCard, { backgroundColor: lightBg + "AA" }]}
            >
              <Text style={styles.metricLabel}>Humidity</Text>
              <Text style={styles.metricValue}>{weather.humidity}%</Text>
            </View>
            <View
              style={[styles.metricCard, { backgroundColor: lightBg + "AA" }]}
            >
              <Text style={styles.metricLabel}>Wind</Text>
              <Text style={styles.metricValue}>{weather.wind} m/s</Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <View
              style={[styles.metricCard, { backgroundColor: lightBg + "AA" }]}
            >
              <Text style={styles.metricLabel}>Sunrise</Text>
              <Text style={styles.metricValue}>{weather.sunrise}</Text>
            </View>
            <View
              style={[styles.metricCard, { backgroundColor: lightBg + "AA" }]}
            >
              <Text style={styles.metricLabel}>Sunset</Text>
              <Text style={styles.metricValue}>{weather.sunset}</Text>
            </View>
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
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 60,
    marginBottom:50
  },

  conditionSmall: { fontSize: 18, marginBottom: 6, fontWeight: "600" },
  temp: { fontSize: 110, fontWeight: "bold" },
  highLow: { marginTop: 6, fontSize: 16, opacity: 0.9 },

  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 24,
    elevation: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 22,
    marginHorizontal: 6,
    alignItems: "center",
    elevation: 80,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    hadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#fff",
    opacity: 0.85,
  },
  metricValue: { fontSize: 20, fontWeight: "700", color: "#fff" },
});