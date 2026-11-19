// Expo config plugin: keep the portrait lock without shutting out devices.
//
// app.json locks the app to portrait ("orientation": "portrait"). Android turns
// that into an implied *required* feature, android.hardware.screen.portrait, and
// Google Play refuses to send the app for review because the requirement hides
// it from tablets, Chromebooks and Android XR devices. Declaring the feature as
// not required keeps the app portrait on phones while letting every device
// install it (on large screens Android 16+ lets the app rotate anyway).
const { withAndroidManifest } = require("expo/config-plugins");

const FEATURE = "android.hardware.screen.portrait";

module.exports = function withOptionalPortraitScreen(config) {
    return withAndroidManifest(config, (cfg) => {
        const manifest = cfg.modResults.manifest;
        const features = (manifest["uses-feature"] ??= []);
        const existing = features.find((f) => f.$?.["android:name"] === FEATURE);
        if (existing) existing.$["android:required"] = "false";
        else features.push({ $: { "android:name": FEATURE, "android:required": "false" } });
        return cfg;
    });
};
