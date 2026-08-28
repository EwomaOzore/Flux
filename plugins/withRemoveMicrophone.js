const { withInfoPlist, withAndroidManifest } = require("@expo/config-plugins");

/**
 * Flux only captures still images for receipt OCR — no video or microphone.
 */
function withRemoveMicrophone(config) {
  config = withInfoPlist(config, (cfg) => {
    delete cfg.modResults.NSMicrophoneUsageDescription;
    return cfg;
  });

  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!manifest["uses-permission"]) return cfg;

    manifest["uses-permission"] = manifest["uses-permission"].filter((item) => {
      const name = item.$?.["android:name"] ?? "";
      return (
        name !== "android.permission.RECORD_AUDIO" &&
        name !== "android.permission.MODIFY_AUDIO_SETTINGS"
      );
    });

    return cfg;
  });
}

module.exports = withRemoveMicrophone;
