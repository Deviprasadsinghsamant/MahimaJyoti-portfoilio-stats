// Imported first by index.ts: registers the push handler as a side effect, before
// Expo Router loads, so marks pushed while the app is closed still get stored.
import { registerBackgroundHandler } from "./push";

registerBackgroundHandler();
