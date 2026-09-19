// iOS 27 stops apps at launch unless they adopt the UIScene lifecycle, and the Expo 57
// AppDelegate template still creates its window in didFinishLaunching. This moves window
// creation into a SceneDelegate and forwards scene events back to the Expo AppDelegate,
// so links (Google sign-in) and app-state events keep reaching the Expo modules.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const WINDOW_BLOCK = /#if os\(iOS\) \|\| os\(tvOS\)\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\s*factory\.startReactNative\(\s*withModuleName: "main",\s*in: window,\s*launchOptions: launchOptions\)\s*#endif/;

const SCENE_DELEGATE = `
// Added by plugins/withIosSceneLifecycle.js
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window
    appDelegate.reactNativeFactory?.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptions)

    connectionOptions.urlContexts.forEach { open($0.url) }
    connectionOptions.userActivities.forEach { continueActivity($0) }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    URLContexts.forEach { open($0.url) }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    continueActivity(userActivity)
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationDidBecomeActive?(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationWillResignActive?(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationWillEnterForeground?(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationDidEnterBackground?(UIApplication.shared)
  }

  private func open(_ url: URL) {
    let app = UIApplication.shared
    _ = app.delegate?.application?(app, open: url, options: [:])
  }

  private func continueActivity(_ activity: NSUserActivity) {
    let app = UIApplication.shared
    _ = app.delegate?.application?(app, continue: activity, restorationHandler: { _ in })
  }
}
`;

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes('class SceneDelegate')) return config;
    if (config.modResults.language !== 'swift' || !WINDOW_BLOCK.test(contents)) {
      throw new Error('withIosSceneLifecycle: AppDelegate.swift does not match the expected Expo template.');
    }
    contents = contents.replace(WINDOW_BLOCK, '// The window is created in SceneDelegate (UIScene lifecycle).\n    self.launchOptions = launchOptions');
    contents = contents.replace(
      'var reactNativeFactory: RCTReactNativeFactory?',
      'var reactNativeFactory: RCTReactNativeFactory?\n  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?'
    );
    config.modResults.contents = contents + SCENE_DELEGATE;
    return config;
  });
}

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return config;
  });
}

module.exports = function withIosSceneLifecycle(config) {
  return withSceneManifest(withSceneAppDelegate(config));
};
