import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OPENWEATHER_KEY } from "../config";

const STORAGE_KEY = "@myapp:favorites";
 
function formatTime(unixSeconds) {
  if (!unixSeconds) return "";
  return new Date(unixSeconds * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function formatHourLabel(unixSeconds) {
  if (!unixSeconds) return "";
  return new Date(unixSeconds * 1000).toLocaleTimeString([], { hour: "numeric" });
}

// Gradient themes based on conditions
const gradientThemes = {
  Night: ["#0A1135", "#1E285D", "#3C3775"],
  Rain: ["#14213D", "#223354", "#2B4162"],
  Thunderstorm: ["#14213D", "#223354", "#2B4162"],
  Snow: ["#A9D6E5", "#C3E1ED", "#D7EBF2"],
  Clear: ["#FFAC81", "#FF928B", "#FFD18E"], // sunny
  Clouds: ["#ADB5BD", "#9FA8B0", "#899299"], // evening feel
  Mist: ["#ADB5BD", "#9FA8B0", "#899299"],   // foggy/overcast
  Default: ["#FFAC81", "#FF928B", "#FFD18E"],
};

// helper to pick gradient based on condition + time
function getGradient(condition) {
  if (!condition) return gradientThemes.Default;

  if (condition === "Clear") {
    const hour = new Date().getHours();
    if (hour >= 19 || hour < 5) {
      return gradientThemes.Night;
    }
    return gradientThemes.Clear;
  }
  return gradientThemes[condition] || gradientThemes.Default;
}

export const useWeatherStore = create((set, get) => ({
  favorites: [],

  loadFavorites: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      set({ favorites: JSON.parse(raw) });
    }
  },

  addFavorite: async (item) => {
    const favorites = get().favorites;
    const exists = favorites.find((f) => f.id === item.id);

    const newList = exists
      ? favorites.map((f) => (f.id === item.id ? item : f))
      : [item, ...favorites];

    set({ favorites: newList });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  },

  removeFavorite: async (id) => {
    const favorites = get().favorites;
    const filtered = favorites.filter((f) => f.id !== id);

    set({ favorites: filtered });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  weather: null,
  loading: false,
  error: null,

  fetchWeather: async (lat, lon, passedName) => {
    set({ loading: true, error: null });
    try {
      const onecallUrl =
        `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}` +
        `&units=metric&exclude=minutely,alerts&appid=${OPENWEATHER_KEY}`;
      console.log("working")
      const res = await fetch(onecallUrl);

      if (!res.ok) {
        const curUrl =
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}` +
          `&units=metric&appid=${OPENWEATHER_KEY}`;
        const curRes = await fetch(curUrl);
        const curJson = await curRes.json();

        const condition = curJson.weather?.[0]?.main || "Sunny";

        set({
          weather: {
            city: curJson.name || passedName || "UNKNOWN",
            temp: Math.round(curJson.main?.temp ?? 0),
            condition,
            humidity: curJson.main?.humidity ?? 0,
            wind: curJson.wind?.speed ?? 0,
            feelsLike: Math.round(curJson.main?.feels_like ?? 0),
            sunrise: formatTime(curJson.sys?.sunrise),
            sunset: formatTime(curJson.sys?.sunset),
            lastUpdated: new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
            gradientColors: getGradient(condition), // 🎨 assign gradient
          },
        });

        set({ loading: false });
        return;
      }

      const data = await res.json();
      const current = data.current || {};
      const currentMain = current.weather?.[0]?.main || "";

      set({
        weather: {
          city: passedName || "UNKNOWN",
          temp: Math.round(current.temp),
          condition: currentMain,
          humidity: current.humidity ?? 0,
          wind: current.wind_speed ?? 0,
          feelsLike: Math.round(current.feels_like ?? 0),
          sunrise: formatTime(current.sunrise),
          sunset: formatTime(current.sunset),
          lastUpdated: new Date((current.dt || Date.now() / 1000) * 1000).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          gradientColors: getGradient(currentMain), // 🎨 assign gradient
        },
      });
    } catch (e) {
      set({ error: e.message || "Failed to fetch weather" });
    } finally {
      set({ loading: false });
    }
  },
}));