// Expo config plugin: sign release builds with the Play Store upload key.
//
// The key never goes into this repository. Its location and passwords come from
// Gradle properties — put them in your user-level ~/.gradle/gradle.properties
// (C:\Users\<you>\.gradle\gradle.properties on Windows):
//
//   MJ_UPLOAD_STORE_FILE=C:/Users/<you>/keys/mahimajyoti-upload.jks
//   MJ_UPLOAD_STORE_PASSWORD=...
//   MJ_UPLOAD_KEY_ALIAS=upload
//   MJ_UPLOAD_KEY_PASSWORD=...
//
// With them set, `./gradlew bundleRelease` (and assembleRelease) sign with the
// upload key. Without them, release builds fall back to the debug key — fine for
// installing on test phones, refused by Google Play. See README "Publishing on
// Google Play".
const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "MJ_UPLOAD_STORE_FILE";

const RELEASE_SIGNING = `
        // Play Store upload key (plugins/withReleaseSigning.js): MJ_UPLOAD_* properties
        // from ~/.gradle/gradle.properties — never from this repository.
        if (findProperty('MJ_UPLOAD_STORE_FILE')) {
            release {
                storeFile file(findProperty('MJ_UPLOAD_STORE_FILE'))
                storePassword findProperty('MJ_UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('MJ_UPLOAD_KEY_ALIAS')
                keyPassword findProperty('MJ_UPLOAD_KEY_PASSWORD')
            }
        }`;

module.exports = function withReleaseSigning(config) {
    return withAppBuildGradle(config, (cfg) => {
        let gradle = cfg.modResults.contents;
        if (gradle.includes(MARKER)) return cfg;

        if (!/signingConfigs\s*\{/.test(gradle)) {
            throw new Error("withReleaseSigning: no signingConfigs block in android/app/build.gradle");
        }
        gradle = gradle.replace(/signingConfigs\s*\{/, (m) => m + RELEASE_SIGNING);

        // The release build type's signingConfig — the first one after `release {` inside buildTypes.
        const releaseSigning = /(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
        if (!releaseSigning.test(gradle)) {
            throw new Error("withReleaseSigning: couldn't find the release build type's signingConfig");
        }
        gradle = gradle.replace(
            releaseSigning,
            "$1signingConfig findProperty('MJ_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug"
        );

        cfg.modResults.contents = gradle;
        return cfg;
    });
};
