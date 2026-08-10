const { withAppDelegate } = require("@expo/config-plugins");

/**
 * Keep the UIWindow black so the gap between LaunchScreen and React Native
 * never flashes the old green / system white splash.
 */
function withBlackSplashWindow(config) {
  return withAppDelegate(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (contents.includes("window?.backgroundColor = .black")) {
      return cfg;
    }
    if (!contents.includes("window = UIWindow(frame: UIScreen.main.bounds)")) {
      return cfg;
    }
    contents = contents.replace(
      "window = UIWindow(frame: UIScreen.main.bounds)\n    factory.startReactNative(",
      "window = UIWindow(frame: UIScreen.main.bounds)\n    window?.backgroundColor = .black\n    factory.startReactNative(",
    );
    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = withBlackSplashWindow;
