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
#include "GhostAppState.h"
#include "GhostPushNotifications.h"
#include "GhostView.h"
#include "GhostChannels.h"
#include "API_ios.h"

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
  NSMutableDictionary *initialProps = [NSMutableDictionary dictionary];
  NSDictionary *notification = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
  NSString *dataString = [notification valueForKey:@"dataString"];
  if (dataString) {
    initialProps[@"initialPushNotificationDataString"] = dataString;
  }

  self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
  self.rctBridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  [APIIos setRctBridge:self.rctBridge];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.rctBridge
                                                   moduleName:@"Castle"
                                            initialProperties:initialProps];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  [RNBootSplash initWithStoryboard:@"BootSplash" rootView:rootView];

  // SDL
  self.sdlDelegate = [[SDLUIKitDelegate alloc] init];
  [self.sdlDelegate hideLaunchScreen];
  SDL_SetMainReady();
  SDL_iPhoneSetEventPump(SDL_FALSE);

  // GhostView
#ifndef USE_CORE
  [GhostView sharedGhostView];
#endif

  UNUserNotificationCenter* center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;

  return YES;
}

- (BOOL)isAppUpdated
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSString *currentAppVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"];
  NSString *previousVersion = [defaults objectForKey:@"GhostAppVersion"];
  if (!previousVersion) {
    // new install
    [defaults setObject:currentAppVersion forKey:@"GhostAppVersion"];
    [defaults synchronize];
    return YES;
  } else if ([previousVersion isEqualToString:currentAppVersion]) {
    // same version
    return NO;
  } else {
    // updated version
    [defaults setObject:currentAppVersion forKey:@"GhostAppVersion"];
    [defaults synchronize];
    return YES;
  }
}

- (void)freezeScreen
{
  UIView * rootView = self.window.rootViewController.view;

  UIGraphicsBeginImageContextWithOptions(rootView.bounds.size, YES, 0);

  [rootView drawViewHierarchyInRect:rootView.bounds afterScreenUpdates:NO];

  UIImage *renderedImage = UIGraphicsGetImageFromCurrentImageContext();
  UIImageView *imageView = [[UIImageView alloc] initWithImage:renderedImage];
  imageView.frame = rootView.bounds;

  [rootView addSubview:imageView];

  UIGraphicsEndImageContext();

  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.1 * NSEC_PER_SEC), dispatch_get_main_queue(), ^(void){
    [imageView removeFromSuperview];
  });
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
  // Read which React Native channel this user is on
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSString *channel = [defaults objectForKey:@"Castle_ReactNativeChannel"];
  if (!channel || [channel isEqualToString:@"default"]) {
    // Default channel, just load embedded bundle
    return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  } else {
    // Non-default channel URL. Copy embedded assets and download channel bundle to a temporary directory.
    NSFileManager *mgr = [NSFileManager defaultManager];
    NSURL *dst = [[mgr temporaryDirectory] URLByAppendingPathComponent:@"CastleBundle"];
    [mgr createDirectoryAtURL:dst withIntermediateDirectories:YES attributes:nil error:nil];
    NSURL *src = [[NSBundle mainBundle] URLForResource:@"assets" withExtension:@""];
    [mgr copyItemAtURL:src toURL:[dst URLByAppendingPathComponent:@"assets"] error:nil];
    NSURLRequest *req = [NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"https://api.castle.xyz/api/react-native-bundle?channel=%@&platform=ios", channel]]];
    NSData *data = [NSURLConnection sendSynchronousRequest:req returningResponse:nil error:nil];
    NSURL *bundleDst = [dst URLByAppendingPathComponent:@"main.jsbundle"];
    [data writeToURL:bundleDst atomically:YES];
    return bundleDst;
  }
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
#ifndef USE_CORE
  [GhostView sharedGhostView].displayLink.paused = YES;
#endif
  [self _emitAppStateEvent];
  if (self.rctBridge) {
    GhostChannels *channelsModule = [self.rctBridge moduleForName:@"GhostChannels"];
    if (channelsModule) {
      [channelsModule setReady:NO];
    }
  }
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
  [self.sdlDelegate applicationDidEnterBackground:application];
  [self _emitAppStateEvent];
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
  [self.sdlDelegate applicationWillEnterForeground:application];
  [self _emitAppStateEvent];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
  [self.sdlDelegate applicationDidBecomeActive:application];
#ifndef USE_CORE
  [GhostView sharedGhostView].displayLink.paused = NO;
#endif
  [self _emitAppStateEvent];
  if (self.rctBridge) {
    GhostChannels *channelsModule = [self.rctBridge moduleForName:@"GhostChannels"];
    if (channelsModule) {
      [channelsModule setReady:YES];
    }
  }
}

- (void)_emitAppStateEvent {
  if (self.rctBridge) {
    GhostAppState *appStateModule = [self.rctBridge moduleForName:@"GhostAppState"];
    if (appStateModule) {
      [appStateModule appStateChanged];
    }
  }
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

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
  fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  NSString *removePushNotificationId = [userInfo valueForKey:@"removePushNotificationId"];
  if (removePushNotificationId && [removePushNotificationId isKindOfClass:[NSString class]]) {
    [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:@[removePushNotificationId]];
    completionHandler(UIBackgroundFetchResultNoData);
    return;
  }

  if (application.applicationState == UIApplicationStateInactive) {
    // the user has tapped in the notification when app was closed or in background
    GhostPushNotifications *module = [self.rctBridge moduleForName:@"GhostPushNotifications"];
    [module onPushNotificationClicked:userInfo];
    completionHandler(UIBackgroundFetchResultNoData);
  } else if (application.applicationState == UIApplicationStateBackground) {
    // notification has arrived when app was in background
    completionHandler(UIBackgroundFetchResultNoData);
  } else {
    // notication has arrived while app was opened
    GhostPushNotifications *module = [self.rctBridge moduleForName:@"GhostPushNotifications"];
    [module onPushNotificationReceived:userInfo];
    completionHandler(UIBackgroundFetchResultNoData);
  }
}

@end
