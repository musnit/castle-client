// Module to collect misc. native utilitites exposed to JavaScript that
// aren't complex enough to need a whole new module

#import <React/RCTBridgeModule.h>

#import "CastleCoreView.h"

@interface CastleNativeUtils : NSObject <RCTBridgeModule>

@end

@implementation CastleNativeUtils

RCT_EXPORT_MODULE()

- (NSDictionary *)constantsToExport {
  NSString *installSource;
#if TARGET_OS_SIMULATOR
  installSource = @"simulator";
#else
  NSURL *receiptURL = [[NSBundle mainBundle] appStoreReceiptURL];
  NSString *receiptURLString = [receiptURL path];
  BOOL isRunningSandboxBuild
      = ([receiptURLString rangeOfString:@"sandboxReceipt"].location != NSNotFound);
  if (isRunningSandboxBuild) {
    installSource = @"sandbox";
  } else {
    installSource = @"appstore";
  }
#endif
  return @{
    @"installSource" : installSource,
    @"nativeBuildVersion": [[NSBundle mainBundle].infoDictionary valueForKey:@"CFBundleVersion"],
    @"nativeAppVersion": [[NSBundle mainBundle].infoDictionary valueForKey:@"CFBundleShortVersionString"],
    @"sceneCreatorApiVersion" : [CastleCoreView sceneCreatorApiVersion],
  };
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

RCT_EXPORT_METHOD(setReactNativeChannel
                  : (NSString *)value
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  [defaults setObject:value forKey:@"Castle_ReactNativeChannel"];
  resolve(nil);
}

RCT_EXPORT_METHOD(getReactNativeChannel
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSString *value = [defaults objectForKey:@"Castle_ReactNativeChannel"];
  if (value) {
    resolve(value);
  } else {
    resolve(@"default");
  }
}

@end
