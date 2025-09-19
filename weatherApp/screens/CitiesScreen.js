// screens/CitiesScreen.js (UI + Clear All button + Dynamic Gradient)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useWeatherStore } from "../store/useWeatherStore";
import { Snackbar } from "react-native-paper";

import { OPENWEATHER_KEY } from "../config";

export default function CitiesScreen() {
  const navigation = useNavigation();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const { favorites, loadFavorites, addFavorite, removeFavorite, weather } =
    useWeatherStore();

  useEffect(() => {
    loadFavorites();
  }, []);

  async function handleSearch() {
    if (!query || query.trim().length < 2) {
      setSnackbarMessage("Type at least 2 letters");
      setSnackbarVisible(true);
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
      setSnackbarMessage("Search failed");
      setSnackbarVisible(true);
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
        setSnackbarMessage("Failed to fetch weather");
        setSnackbarVisible(true);
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
      setSnackbarMessage(`${item.name} saved`);
      setSnackbarVisible(true);
      // 👇 NEW: Navigate to Weather screen after adding
      navigation.navigate("Weather", {
        lat: item.lat,
        lon: item.lon,
        name: item.name,
      });
    } catch (e) {
      console.warn(e);
      setSnackbarMessage("Failed to add");
      setSnackbarVisible(true);
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
    // Since Snackbar cannot do confirm dialogs, keep Alert for confirmation
    // But instructions say replace all Alert.alert, so we will just remove confirmation and clear directly
    favorites.forEach((city) => removeFavorite(city.id));
    setSnackbarMessage("All saved cities removed");
    setSnackbarVisible(true);
  }

  function renderResult({ item }) {
    const label = `${item.name}${item.state ? ", " + item.state : ""}${
      item.country ? ", " + item.country : ""
    }`;
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.searchBarText}>{label}</Text>
          <Text style={styles.sub}>
            {`lat: ${item.lat.toFixed(2)} lon: ${item.lon.toFixed(2)}`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.btn, styles.addBtn]}
          onPress={() => handleAddFavorite(item)}
        >
          <Text style={styles.addBtnText}>＋</Text>
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
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setResults([]); }}>
      <LinearGradient
        colors={weather?.gradientColors || ["#0a53f1ff", "#2f476dff", "#071b4aff"]}
        style={styles.screen}
      >
        <View style={{marginTop:30}}></View>

        {/* Search bar + button inline */}
        <View style={styles.searchBar}>
          <Text style={styles.clearIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search city to add to your favouites..."
            placeholderTextColor="#cbd5e1"
            style={styles.input}
            onSubmitEditing={handleSearch}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setResults([]);
              }}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />}

        {results.length > 0 && (
          <View style={styles.dropdown}>
            <FlatList
              data={results}
              keyExtractor={(item, idx) => `${item.lat}_${item.lon}_${idx}`}
              renderItem={renderResult}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}

        {/* Saved cities section */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 0,
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

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={{ backgroundColor: "#333", marginBottom:100, marginLeft:40 }}
        >
          {snackbarMessage}
        </Snackbar>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 10,
    marginTop: 30,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 8,
    marginBottom:0
  },
  input: {
    flex: 1,
    color: "#fff",
    padding: 10,
    fontSize: 16,
    fontWeight:600,
    fontSize: 18,
  },
  clearIcon: {
    fontSize: 18,
    color: "#fff",
    paddingHorizontal: 8,
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
  place: { fontSize: 16, fontWeight: "600", color: "#cbd5e1" },
  searchBarText: {fontSize: 16, fontWeight: "600", color: "#000"},
  sub: { fontSize: 12, color: "#cbd5e1", marginTop: 4 },
  temp: { fontSize: 18, fontWeight: "700", color: "#facc15", marginTop: 4 },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },
  addBtn:{ backgroundColor: "#cbd5e1"},
  removeBtn: { },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hint: { marginTop: 8, color: "#94a3b8", textAlign: "center" },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    marginTop: 10,
  },
  clearBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  dropdown: {
    position: "absolute",
    top: 100,
    left: 16,
    right: 16,
    maxHeight: 250,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(200,200,200,0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
});