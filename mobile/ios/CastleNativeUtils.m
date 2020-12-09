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

@end
