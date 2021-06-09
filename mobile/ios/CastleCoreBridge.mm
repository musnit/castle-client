#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>

#import "CastleCoreView.h"


//
// CastleCoreBridge
//

@interface CastleCoreBridge : NSObject <RCTBridgeModule>

@end

@implementation CastleCoreBridge

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(sendEventAsync:(NSString *)eventJson) {
  dispatch_async(dispatch_get_main_queue(), ^{
    CastleCore::getEngine().getBridge().receiveEvent(eventJson.UTF8String);
  });
}

@end

