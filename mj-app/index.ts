// App entry. Imports run in order: the push handler is registered before the
// app loads, then Expo Router registers the app — always last.
import "./src/lib/background";
import "expo-router/entry";
