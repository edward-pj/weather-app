// screens/CitiesScreen.js (UI + Clear All button added)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useWeatherStore } from "../store/useWeatherStore";

const OPENWEATHER_KEY = "94613b12690e51024f205d4d27c59b7d";

export default function CitiesScreen() {
  const navigation = useNavigation();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const { favorites, loadFavorites, addFavorite, removeFavorite } =
    useWeatherStore();

  useEffect(() => {
    loadFavorites();
  }, []);

  async function handleSearch() {
    if (!query || query.trim().length < 2) {
      Alert.alert("Type at least 2 letters");
      return;
    }
    setLoading(true);
    try {
      const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        query
      )}&limit=5&appid=${OPENWEATHER_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      setResults(json || []);
    } catch (e) {
      Alert.alert("Search failed");
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFavorite(place) {
    setLoading(true);
    try {
      const wUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${place.lat}&lon=${place.lon}&units=metric&appid=${OPENWEATHER_KEY}`;
      const wRes = await fetch(wUrl);
      const wJson = await wRes.json();

      if (!wJson || !wJson.main) {
        Alert.alert("Failed to fetch weather");
        return;
      }
      const temp = Math.round(wJson.main.temp);

      const item = {
        id: `${place.lat}_${place.lon}`,
        name: `${place.name}${place.state ? ", " + place.state : ""}${
          place.country ? ", " + place.country : ""
        }`,
        lat: place.lat,
        lon: place.lon,
        temp,
      };

      await addFavorite(item);
      Alert.alert("Saved", `${item.name} saved`);
    } catch (e) {
      console.warn(e);
      Alert.alert("Failed to add");
    } finally {
      setLoading(false);
    }
  }

  function openWeatherScreen(item) {
    navigation.navigate("Weather", {
      lat: item.lat,
      lon: item.lon,
      name: item.name,
    });
  }

  function clearAllFavorites() {
    if (favorites.length === 0) return;
    Alert.alert("Clear All", "Remove all saved cities?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => {
          favorites.forEach((city) => removeFavorite(city.id));
        },
      },
    ]);
  }

  function renderResult({ item }) {
    const label = `${item.name}${item.state ? ", " + item.state : ""}${
      item.country ? ", " + item.country : ""
    }`;
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.place}>{label}</Text>
          <Text style={styles.sub}>
            {`lat: ${item.lat.toFixed(2)} lon: ${item.lon.toFixed(2)}`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.btn, styles.addBtn]}
          onPress={() => handleAddFavorite(item)}
        >
          <Text style={styles.btnText}>＋</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderFavorite({ item }) {
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => openWeatherScreen(item)}
        >
          <Text style={styles.place}>{item.name}</Text>
          <Text style={styles.temp}>
            {item.temp != null ? `${item.temp}°C` : "—"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.removeBtn]}
          onPress={() => removeFavorite(item.id)}
        >
          <Text style={styles.btnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      style={styles.screen}
    >
      <Text style={styles.title}>Cities</Text>

      {/* Search bar + button inline */}
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search city..."
          placeholderTextColor="#aaa"
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.btn, styles.addBtn]}
          onPress={handleSearch}
        >
          <Text style={styles.btnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <TouchableOpacity
          style={[styles.clearBtn]}
          onPress={() => setResults([])}
        >
          <Text style={styles.clearBtnText}>Clear Results</Text>
        </TouchableOpacity>
      )}

      {loading && <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />}

      <FlatList
        data={results}
        keyExtractor={(item, idx) => `${item.lat}_${item.lon}_${idx}`}
        renderItem={renderResult}
        ListEmptyComponent={() => (
          <Text style={styles.hint}>No results yet</Text>
        )}
        style={{ maxHeight: 220, marginTop: 10 }}
      />

      {/* Saved cities section */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 20,
        }}
      >
        <Text style={styles.title}>Saved Cities</Text>
        {favorites.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAllFavorites}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderFavorite}
        style={{ marginTop: 8 }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 10,
    marginTop:30
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    padding: 10,
    fontSize: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  place: { fontSize: 16, fontWeight: "600", color: "#fff" },
  sub: { fontSize: 12, color: "#cbd5e1", marginTop: 4 },
  temp: { fontSize: 18, fontWeight: "700", color: "#facc15", marginTop: 4 },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtn: { backgroundColor: "#22c55e" },
  removeBtn: { backgroundColor: "#ef4444" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hint: { marginTop: 8, color: "#94a3b8", textAlign: "center" },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    marginTop:10
  },
  clearBtnText: { color: "#fff", fontWeight: "600", fontSize: 13,  },
});