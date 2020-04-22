/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>

#import <UMCore/UMModuleRegistry.h>
#import <UMReactNativeAdapter/UMNativeModulesProxy.h>
#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>

#include <SDL.h>

#include "RNBootSplash.h"
#include "GhostPushNotifications.h"
#include "GhostView.h"

#import "../../../ghost-extensions/SDL2-2.0.8/src/video/uikit/SDL_uikitappdelegate.h"

@implementation SDLUIKitDelegate (Castle)

// SDL defines its own `int main(...)` function:
// https://github.com/spurious/SDL-mirror/blob/5d7cfcca344034aff9327f77fc181ae3754e7a90/src/video/uikit/SDL_uikitappdelegate.m#L45-L70.
// We tell it to use our `AppDelegate` class instead.
+ (NSString *)getAppDelegateClassName {
  return NSStringFromClass([AppDelegate class]);
}

@end

int SDL_main(int argc, char *argv[]) {
  // Implement a dummy `SDL_main()` to satisfy the linker.
  return 0;
}

@interface AppDelegate ()

@property(nonatomic, strong) SDLUIKitDelegate *sdlDelegate;
@property(nonatomic, strong) RCTBridge *rctBridge;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
  self.rctBridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.rctBridge
                                                   moduleName:@"Castle"
                                            initialProperties:nil];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  [RNBootSplash show:@"LaunchScreen" inView:rootView];

  // SDL
  self.sdlDelegate = [[SDLUIKitDelegate alloc] init];
  [self.sdlDelegate hideLaunchScreen];
  SDL_SetMainReady();
  SDL_iPhoneSetEventPump(SDL_FALSE);

  // GhostView
  [GhostView sharedGhostView];

  UNUserNotificationCenter* center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;

  return YES;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  NSArray<id<RCTBridgeModule>> *extraModules = [_moduleRegistryAdapter extraModulesForBridge:bridge];
  // You can inject any extra modules that you would like here, more information at:
  // https://facebook.github.io/react-native/docs/native-modules-ios.html#dependency-injection
  return extraModules;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
//  return [NSURL URLWithString:@"http://192.168.1.15:8081/index.bundle?platform=ios&dev=true&minify=false"];
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  // Fix 'castled://' scheme from launching debug URIs
  NSURL *fixed = [NSURL URLWithString:[url.absoluteString stringByReplacingOccurrencesOfString:@"castled://" withString:@"castle://"]];
  return [RCTLinkingManager application:app openURL:fixed options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

- (void)applicationWillTerminate:(UIApplication *)application {
  [self.sdlDelegate applicationWillTerminate:application];
}

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
  [self.sdlDelegate applicationDidReceiveMemoryWarning:application];
}

- (void)application:(UIApplication *)application
    didChangeStatusBarOrientation:
        (UIInterfaceOrientation)oldStatusBarOrientation {
  [self.sdlDelegate application:application
      didChangeStatusBarOrientation:oldStatusBarOrientation];
}

- (void)applicationWillResignActive:(UIApplication *)application {
  [self.sdlDelegate applicationWillResignActive:application];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
  [self.sdlDelegate applicationDidEnterBackground:application];
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
  [self.sdlDelegate applicationWillEnterForeground:application];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
  [self.sdlDelegate applicationDidBecomeActive:application];
}

// Handle remote notification registration.
- (void)application:(UIApplication *)app
        didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)devToken {
  GhostPushNotifications *module = [self.rctBridge moduleForName:@"GhostPushNotifications"];
  [module onNewPushNotificationToken:devToken];
}

- (void)application:(UIApplication *)app
        didFailToRegisterForRemoteNotificationsWithError:(NSError *)err {
    NSLog(@"Remote notification support is unavailable due to error: %@", err);
}

@end
