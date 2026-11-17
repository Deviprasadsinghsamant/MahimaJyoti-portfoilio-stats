// Expo config plugin: build native (C++) code with a CMake whose Ninja handles long paths.
//
// React Native's C++ builds nest the full source path inside each object path, e.g.
//   …\.cxx\RelWithDebInfo\<hash>\x86_64\safeareacontext_autolinked_build\CMakeFiles\
//   react_codegen_safeareacontext.dir\C_\…\node_modules\react-native-safe-area-context\…\
//   RNCSafeAreaViewShadowNode.cpp.o
// From a deep folder on Windows that passes 260 characters. Windows itself allows long
// paths once LongPathsEnabled is set, but the Ninja bundled with AGP's default CMake
// (3.22.1) doesn't, and fails with "Filename longer than 260 characters".
//
// Expo reads the `android.cmakeVersion` Gradle property and applies it to every module
// (see ExpoRootProjectPlugin.maybeOverrideCmakeVersion). CMake 3.31.x bundles a Ninja that
// is long-path aware; it's the newest 3.x, which still accepts the old
// cmake_minimum_required() versions some React Native libraries declare. AGP installs it
// from the Android SDK on first use.
//
// Windows also needs long paths enabled (HKLM\SYSTEM\CurrentControlSet\Control\FileSystem
// LongPathsEnabled = 1). Harmless on macOS / Linux.
const { withGradleProperties } = require("expo/config-plugins");

const PROPERTY = "android.cmakeVersion";
const VALUE = "3.31.6";

module.exports = function withLongPathCmake(config) {
    return withGradleProperties(config, (cfg) => {
        cfg.modResults = cfg.modResults.filter((item) => !(item.type === "property" && item.key === PROPERTY));
        cfg.modResults.push(
            { type: "comment", value: "CMake whose Ninja handles long Windows paths (plugins/withLongPathCmake.js)" },
            { type: "property", key: PROPERTY, value: VALUE }
        );
        return cfg;
    });
};
