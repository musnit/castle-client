// Module to collect misc. native utilitites exposed to JavaScript that
// aren't complex enough to need a whole new module

#import <React/RCTBridgeModule.h>
#import <Adjust/Adjust.h>

@interface CastleAdjust : NSObject <RCTBridgeModule>

@end

@implementation CastleAdjust

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

RCT_EXPORT_METHOD(trackEvent: (NSString *)token) {
  ADJEvent *event = [ADJEvent eventWithEventToken:token];
  [Adjust trackEvent:event];
}

RCT_EXPORT_METHOD(addSessionCallbackParameter: (NSString *)paramName value: (NSString *)value) {
  [Adjust addSessionCallbackParameter:paramName value:value];
}

RCT_EXPORT_METHOD(removeSessionCallbackParameter: (NSString *)paramName) {
  [Adjust removeSessionCallbackParameter:paramName];
}

@end
