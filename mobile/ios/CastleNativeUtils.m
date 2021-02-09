// Module to collect misc. native utilitites exposed to JavaScript that
// aren't complex enough to need a whole new module

#import <React/RCTBridgeModule.h>

@interface CastleNativeUtils : NSObject <RCTBridgeModule>

@end

@implementation CastleNativeUtils

RCT_EXPORT_MODULE()

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

RCT_EXPORT_METHOD(getInstallSource
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
#if TARGET_OS_SIMULATOR
  resolve(@"simulator");
#endif
  NSURL *receiptURL = [[NSBundle mainBundle] appStoreReceiptURL];
  NSString *receiptURLString = [receiptURL path];
  BOOL isRunningSandboxBuild =  ([receiptURLString rangeOfString:@"sandboxReceipt"].location != NSNotFound);
  if (isRunningSandboxBuild) {
    resolve(@"sandbox");
  } else {
    resolve(@"appstore");
  }
}

@end
