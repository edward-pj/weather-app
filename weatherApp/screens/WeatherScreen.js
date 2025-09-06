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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRoute } from "@react-navigation/native";

const { width: SCREEN_W } = Dimensions.get("window");
const CIRCLE_SIZE = Math.round(SCREEN_W * 0.62);

// Theme config (kept as you had it)
const weatherThemes = {
  Sunny: {
    background: require("../assets/sunny.png"),
    textColor: "#fff",
    iconColor: "#fff",
  },
  Evening: {
    background: require("../assets/evening.png"),
    textColor: "#222",
    iconColor: "#222",
  },
  Rainy: {
    background: require("../assets/rain.png"),
    textColor: "#fff",
    iconColor: "#fff",
  },
  Night: {
    background: require("../assets/night.png"),
    textColor: "#fff",
    iconColor: "#fff",
  },
  Snowy: {
    background: require("../assets/snow.png"),
    textColor: "#000",
    iconColor: "#000",
  },
};

// Replace with your OpenWeather API key or import from config
const OPENWEATHER_KEY = "94613b12690e51024f205d4d27c59b7d";

function mapMainToTheme(main, currentTs) {
  // very simple mapping from API "main" to your theme names
  if (!main) return "Sunny";
  const m = main.toLowerCase();
  if (m === "clear") {
    // optionally detect night by hour -> use Night
    const hour = new Date(currentTs * 1000).getHours();
    if (hour >= 19 || hour < 6) return "Night";
    return "Sunny";
  }
  if (m === "clouds" || m === "mist" || m === "haze") return "Evening";
  if (m === "rain" || m === "drizzle" || m === "thunderstorm") return "Rainy";
  if (m === "snow") return "Snowy";
  return "Sunny";
}

function mapWeatherMainToIcon(main) {
  // map common weather "main" to simple Ionicons names you've used in UI
  if (!main) return "cloud";
  const m = main.toLowerCase();
  if (m === "clear") return "sunny";
  if (m === "clouds" || m === "mist" || m === "haze") return "cloud";
  if (m === "rain" || m === "drizzle") return "rainy";
  if (m === "thunderstorm") return "thunderstorm";
  if (m === "snow") return "snow";
  return "cloud";
}

function formatTime(unixSeconds) {
  if (!unixSeconds) return "";
  return new Date(unixSeconds * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function formatHourLabel(unixSeconds) {
  if (!unixSeconds) return "";
  return new Date(unixSeconds * 1000).toLocaleTimeString([], { hour: "numeric" });
}
function formatDayLabel(unixSeconds) {
  if (!unixSeconds) return "";
  return new Date(unixSeconds * 1000).toLocaleDateString([], { weekday: "short" });
}

export default function WeatherScreen() {
  const route = useRoute();
  const params = route.params || {};
  const lat = params.lat;
  const lon = params.lon;
  const passedName = params.name;

  // State that the UI reads from:
  const [city, setCity] = useState(passedName || "UNKNOWN");
  const [temp, setTemp] = useState(72);
  const [condition, setCondition] = useState("Sunny");
  const [humidity, setHumidity] = useState(0);
  const [wind, setWind] = useState(0);
  const [uvIndex, setUvIndex] = useState(null);
  const [sunrise, setSunrise] = useState("");
  const [sunset, setSunset] = useState("");
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [hourly, setHourly] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(false);

  // compute theme key from condition later (default Sunny)
  const themeKey = mapMainToTheme(condition, Date.now() / 1000);
  const theme = weatherThemes[themeKey] || weatherThemes["Sunny"];

  useEffect(() => {
    // When screen mounts or route params change, fetch weather for provided coords
    if (lat != null && lon != null) {
      fetchFullWeather(lat, lon);
    } else {
      // no coords passed: you could optionally fetch a default city here
      // leave UI defaults as-is
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  async function fetchFullWeather(latArg, lonArg) {
  if (latArg == null || lonArg == null) {
    console.warn("fetchFullWeather: missing coords", latArg, lonArg);
    return;
  }

  setLoading(true);
  try {
    console.log("fetchFullWeather: calling OneCall for", latArg, lonArg);

    const onecallUrl = 
      `https://api.openweathermap.org/data/2.5/onecall?lat=${latArg}&lon=${lonArg}` +
      `&units=metric&exclude=minutely,alerts&appid=${OPENWEATHER_KEY}`;

    const res = await fetch(onecallUrl);
    if (!res.ok) {
      const text = await res.text();
      console.warn("OneCall non-ok:", res.status, text);

      // FALLBACK: try current weather endpoint (basic data)
      const currentUrl = 
        `https://api.openweathermap.org/data/2.5/weather?lat=${latArg}&lon=${lonArg}` +
        `&units=metric&appid=${OPENWEATHER_KEY}`;
      const curRes = await fetch(currentUrl);
      if (!curRes.ok) {
        const curText = await curRes.text();
        console.warn("CurrentWeather also failed:", curRes.status, curText);
        throw new Error(`Both OneCall and current weather failed. OneCall: ${res.status} ${text} | Current: ${curRes.status} ${curText}`);
      }

      const curJson = await curRes.json();
      // Minimal mapping from current endpoint so UI shows something
      const main = curJson.weather && curJson.weather[0] && curJson.weather[0].main;
      setTemp(Math.round(curJson.main.temp));
      setCondition(main || "Sunny");
      setHumidity(curJson.main.humidity ?? 0);
      setWind(curJson.wind?.speed ?? 0);
      setUvIndex(null);
      setSunrise(""); setSunset("");
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      // hourly/weekly fallback: empty arrays
      setHourly([]);
      setWeekly([]);
      return;
    }

    // If OK, parse JSON and map fields (same as before)
    const data = await res.json();

    const current = data.current || {};
    const currentMain = (current.weather && current.weather[0] && current.weather[0].main) || "";
    setTemp(Math.round(current.temp));
    setCondition(currentMain);
    setHumidity(current.humidity ?? 0);
    setWind(current.wind_speed ?? 0);
    setUvIndex(current.uvi ?? null);
    setSunrise(formatTime(current.sunrise));
    setSunset(formatTime(current.sunset));
    setLastUpdated(new Date((current.dt || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));

    const hours = (data.hourly || []).slice(0, 24).map((h) => ({
      label: formatHourLabel(h.dt),
      icon: mapWeatherMainToIcon(h.weather && h.weather[0] && h.weather[0].main),
      temp: Math.round(h.temp),
    }));
    setHourly(hours);

    const days = (data.daily || []).slice(0, 7).map((d) => ({
      day: formatDayLabel(d.dt),
      icon: mapWeatherMainToIcon(d.weather && d.weather[0] && d.weather[0].main),
      high: Math.round(d.temp.max),
      low: Math.round(d.temp.min),
    }));
    setWeekly(days);

  } catch (e) {
    console.warn("fetchFullWeather error:", e);
  } finally {
    setLoading(false);
  }
}


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
            <Text style={[styles.city, { color: theme.textColor }]}>{city}</Text>
            <Text style={[styles.updated, { color: theme.textColor }]}>
              Updated: {lastUpdated}
            </Text>
          </View>

          {/* MAIN TEMP CIRCLE */}
          <View style={styles.centerArea}>
            <BlurView intensity={30} tint="light" style={styles.circle}>
              <Text style={[styles.conditionSmall, { color: theme.textColor }]}>
                {condition}
              </Text>
              <Text style={[styles.temp, { color: theme.textColor }]}>
                {temp}°
              </Text>
              <Text style={[styles.highLow, { color: theme.textColor }]}>
                H:77° L:59°
              </Text>
            </BlurView>
          </View>

          {/* HOURLY FORECAST */}
          <View style={styles.panel}>
            <BlurView intensity={60} tint="light" style={styles.hourlyContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {hourly.map((h, i) => (
                  <View style={styles.hourCard} key={i}>
                    <Text style={[styles.hour, { color: theme.textColor }]}>
                      {h.label}
                    </Text>
                    <Ionicons
                      name={h.icon}
                      size={30}
                      color={theme.iconColor}
                      style={{ marginVertical: 6 }}
                    />
                    <Text style={[styles.hourTemp, { color: theme.textColor }]}>
                      {h.temp}°
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </BlurView>
          </View>

          {/* 4 METRIC CARDS */}
          <View style={styles.metricsRow}>
            <BlurView intensity={40} tint="light" style={styles.metricCard}>
              <Text style={styles.metricLabel}>UV Index</Text>
              <Text style={styles.metricValue}>{uvIndex ?? "—"}</Text>
            </BlurView>
            <BlurView intensity={40} tint="light" style={styles.metricCard}>
              <Text style={styles.metricLabel}>Humidity</Text>
              <Text style={styles.metricValue}>{humidity}%</Text>
            </BlurView>
          </View>
          <View style={styles.metricsRow}>
            <BlurView intensity={40} tint="light" style={styles.metricCard}>
              <Text style={styles.metricLabel}>Sunrise</Text>
              <Text style={styles.metricValue}>{sunrise}</Text>
            </BlurView>
            <BlurView intensity={40} tint="light" style={styles.metricCard}>
              <Text style={styles.metricLabel}>Sunset</Text>
              <Text style={styles.metricValue}>{sunset}</Text>
            </BlurView>
          </View>
          <View style={styles.metricsRow}>
            <BlurView intensity={40} tint="light" style={styles.metricCard}>
              <Text style={styles.metricLabel}>Wind</Text>
              <Text style={styles.metricValue}>{wind} m/s</Text>
            </BlurView>
          </View>

          {/* WEEKLY FORECAST */}
          <View style={styles.panel}>
            <BlurView intensity={60} tint="light" style={styles.weeklyContainer}>
              {weekly.map((d, i) => (
                <View style={styles.dayCard} key={i}>
                  <Text style={[styles.day, { color: theme.textColor }]}>{d.day}</Text>
                  <Ionicons
                    name={d.icon}
                    size={28}
                    color={theme.iconColor}
                    style={{ marginHorizontal: 12 }}
                  />
                  <Text style={[styles.dayTemp, { color: theme.textColor }]}>
                    {d.high}° / {d.low}°
                  </Text>
                </View>
              ))}
            </BlurView>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* (your styles kept exactly as you provided) */
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  header: {
    alignItems: "center",
    paddingTop: 80,
  },
  city: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 2,
  },
  updated: {
    fontSize: 12,
    marginTop: 6,
  },
  centerArea: {
    alignItems: "center",
    marginTop: 24,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderColor: "#848785",
    borderWidth: 5,
  },
  conditionSmall: {
    fontSize: 16,
    marginBottom: 4,
  },
  temp: {
    fontSize: 120,
  },
  highLow: {
    marginTop: 6,
    fontSize: 14,
  },
  panel: {
    marginTop: 30,
    paddingHorizontal: 12,
  },
  hourlyContainer: {
    borderRadius: 20,
    padding: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  hourCard: {
    width: 100,
    height: 140,
    borderRadius: 15,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  hour: {
    fontSize: 14,
    fontWeight: "600",
  },
  hourTemp: {
    fontSize: 18,
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
  },
  metricCard: {
    flex: 1,
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 5,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  weeklyContainer: {
    borderRadius: 20,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomColor: "rgba(255,255,255,0.3)",
    borderBottomWidth: 1,
  },
  day: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  dayTemp: {
    fontSize: 16,
    fontWeight: "700",
  },
});
