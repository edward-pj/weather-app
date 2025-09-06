// screens/CitiesScreen.js
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

// Put your OpenWeather key here (or import)
const OPENWEATHER_KEY = "94613b12690e51024f205d4d27c59b7d";
// this type of const is usually a name for unique identifier like using @myapp:favorites and all
const STORAGE_KEY = "@myapp:favorites";

export default function CitiesScreen() {
  const navigation = useNavigation();

  const [query, setQuery] = useState("");          // what user types
  const [results, setResults] = useState([]);      // geocode results
  const [favorites, setFavorites] = useState([]);  // saved cities with temp
  const [loading, setLoading] = useState(false);

  // Load saved cities when screen loads
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    })();
  }, []);
  // this works as componentDidMount and runs only once since dependency array is empty

  // 1) Search button pressed -> geocode API
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
      const json = await res.json(); // array of places
      setResults(json || []);
    } catch (e) {
      Alert.alert("Search failed");
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }

  //everytime before and after a function, we're calling the set loading to make the 
  // app wait for us

  // 2) Add a place to favorites: first fetch current temp, then save
  async function addFavorite(place) {
    setLoading(true);
    try {
      // fetch current weather for the lat/lon
      const wUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${place.lat}&lon=${place.lon}&units=metric&appid=${OPENWEATHER_KEY}`;
      const wRes = await fetch(wUrl);
      const wJson = await wRes.json();
      console.log(wJson);

      if (!wJson || !wJson.main) {
        Alert.alert("Failed to fetch weather");
        return;
      }
      const temp = Math.round(wJson.main.temp);
      console.log(wJson.wind.speed);


      const item = {
        id: `${place.lat}_${place.lon}`,            // simple unique id
        name: `${place.name}${place.state ? ", " + place.state : ""}${place.country ? ", " + place.country : ""}`,
        lat: place.lat,
        lon: place.lon,
        temp,
      };

      // avoid duplicates
      const exists = favorites.find((f) => f.id === item.id);
      const newList = exists ? favorites.map(f => f.id === item.id ? item : f) : [item, ...favorites];

      setFavorites(newList);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      Alert.alert("Saved", `${item.name} saved`);
    } catch (e) {
      console.warn(e);
      Alert.alert("Failed to add");
    } finally {
      setLoading(false);
    }
  }

  // 3) Open WeatherScreen and pass coords (WeatherScreen should read route.params)
  function openWeatherScreen(item) {
    navigation.navigate("Weather", { lat: item.lat, lon: item.lon, name: item.name });
    console.log(item)
  }

  // UI row renderers
  function renderResult({ item }) {
    //The main benefit of a template literal is the ability to embed JavaScript expressions 
    //directly inside the string using the ${...} syntax.

    //the $ is just new method of concatenation
    const label = `${item.name}${item.state ? ", " + item.state : ""}${item.country ? ", " + item.country : ""}`;
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.place}>{label}</Text>
          <Text style={styles.sub}>{`lat: ${item.lat.toFixed(2)} lon: ${item.lon.toFixed(2)}`}</Text>
              {/* toFixed is used to limit the number of decimal places to 2 */}
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => addFavorite(item)}>
          <Text style={styles.btnText}>Add</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderFavorite({ item }) {
    return (
      <View style={styles.row}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => openWeatherScreen(item)}>
          <Text style={styles.place}>{item.name}</Text>
          <Text style={styles.sub}>{item.temp != null ? `${item.temp}°C` : "—"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.removeBtn]} onPress={async () => {

          const filtered = favorites.filter(f => f.id !== item.id);

          /* crazy method to keeps only the items whose id does not match the id of the current item */
          /* This effectively removes the selected item */
          setFavorites(filtered);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }}>
          <Text style={styles.btnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Cities</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Type city name"
        style={styles.input}
      />

      <TouchableOpacity style={[styles.btn, { marginTop: 8 }]} onPress={handleSearch}>
        <Text style={styles.btnText}>Search</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}

      <FlatList
        data={results}
        keyExtractor={(item, idx) => `${item.lat}_${item.lon}_${idx}`}
        renderItem={renderResult}

        ListEmptyComponent={() => <Text style={styles.hint}>No results</Text>}
        style={{ maxHeight: 220, marginTop: 10 }}
      />

      <View style={styles.divider} />

      <Text style={[styles.title, { marginTop: 8 }]}>Saved Cities</Text>
      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        renderItem={renderFavorite}
        style={{ marginTop: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "700" },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  place: { fontSize: 16, fontWeight: "600" },
  sub: { fontSize: 12, color: "#666", marginTop: 4 },
  btn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  removeBtn: { backgroundColor: "#ef4444" },
  btnText: { color: "#fff", fontWeight: "700" },
  hint: { marginTop: 8, color: "#666" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 12 },
});
