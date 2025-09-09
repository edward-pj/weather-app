import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@myapp:favorites";
const OPENWEATHER_KEY = "94613b12690e51024f205d4d27c59b7d"; // <-- add your key here

function formatTime(unixSeconds) {
  if (!unixSeconds) return "";
  return new Date(unixSeconds * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function formatHourLabel(unixSeconds) {
  if (!unixSeconds) return "";
  return new Date(unixSeconds * 1000).toLocaleTimeString([], { hour: "numeric" });
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
    // .find() will return true or false

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

      const res = await fetch(onecallUrl);

      if (!res.ok) {
        // fallback
        const curUrl =
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}` +
          `&units=metric&appid=${OPENWEATHER_KEY}`;
        const curRes = await fetch(curUrl);
        const curJson = await curRes.json();
        console.log(curJson)

        set({
          weather: {
            city: curJson.name || passedName || "UNKNOWN",
            temp: Math.round(curJson.main?.temp ?? 0),
            condition: curJson.weather?.[0]?.main || "Sunny",
            humidity: curJson.main?.humidity ?? 0,
            wind: curJson.wind?.speed ?? 0,
            feelsLike: Math.round(curJson.main?.feels_like ?? 0),
            sunrise: formatTime(curJson.sys?.sunrise),
            sunset: formatTime(curJson.sys?.sunset),
            lastUpdated: new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
            hourly: [],
          },
        });

        // ✅ stop loading here too
        set({ loading: false });
        return;
      }

      const data = await res.json();
      const current = data.current || {};
      const currentMain = current.weather?.[0]?.main || "";

      const hourly = (data.hourly || []).slice(0, 24).map((h) => ({
        label: formatHourLabel(h.dt),
        icon: currentMain.toLowerCase(), // simplify; you can remap if needed
        temp: Math.round(h.temp),
      }));

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
          hourly,
        },
      });
    } catch (e) {
      set({ error: e.message || "Failed to fetch weather" });
    } finally {
      // ✅ always stop loading at the end
      set({ loading: false });
    }
  },
}));