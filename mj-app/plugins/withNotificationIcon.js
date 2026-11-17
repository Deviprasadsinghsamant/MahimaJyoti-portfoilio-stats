// Expo config plugin: the small icon on push notifications.
//
// Android draws a notification's small icon from its shape only, in white, so the
// colourful app icon becomes a grey disc. This copies assets/notification-icon.png
// (a white "MJ" on transparent, 96 px = 24 dp at xxxhdpi; Android scales it down
// for other screens) into the Android resources and points Firebase Messaging at
// it. (@react-native-firebase/messaging only adds the manifest entry; in Expo
// SDK 55+ nothing creates the drawable it refers to.)
const fs = require("fs");
const path = require("path");
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require("expo/config-plugins");

const SOURCE = "assets/notification-icon.png";
const DRAWABLE = "notification_icon";

module.exports = function withNotificationIcon(config) {
    config = withDangerousMod(config, [
        "android",
        async (cfg) => {
            const dir = path.join(cfg.modRequest.platformProjectRoot, "app", "src", "main", "res", "drawable-xxxhdpi");
            fs.mkdirSync(dir, { recursive: true });
            fs.copyFileSync(path.join(cfg.modRequest.projectRoot, SOURCE), path.join(dir, `${DRAWABLE}.png`));
            return cfg;
        },
    ]);
    return withAndroidManifest(config, (cfg) => {
        const application = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
            application,
            "com.google.firebase.messaging.default_notification_icon",
            `@drawable/${DRAWABLE}`,
            "resource"
        );
        return cfg;
    });
};
