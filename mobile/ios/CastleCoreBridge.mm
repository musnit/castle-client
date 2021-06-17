#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTLog.h>

#import "CastleCoreView.h"

//
// CastleCoreBridge
//

@interface CastleCoreBridge : RCTEventEmitter <RCTBridgeModule>

@end

@implementation CastleCoreBridge {
  bool hasListeners;
}

RCT_EXPORT_MODULE();

static __weak CastleCoreBridge *instance = nil;

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (instancetype)init {
  if (self = [super init]) {
    instance = self;
  }
  return self;
}

- (void)dealloc {
  if (instance == self) {
    instance = nil;
  }
}

- (void)startObserving {
  hasListeners = YES;
}

- (void)stopObserving {
  hasListeners = NO;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[ @"onReceiveEvent" ];
}

RCT_EXPORT_METHOD(sendEventAsync : (NSString *)eventJson) {
  // Without this check, the PRELOAD_DECK event crashes the engine on the first card
  if (CastleCore::isEngineInitialized()) {
    dispatch_async(dispatch_get_main_queue(), ^{
      CastleCore::getEngine().getBridge().receiveEvent(eventJson.UTF8String);
    });
  }
}

@end

namespace CastleCore {
void sendEventToJS(const char *eventJson) {
  if (instance) {
    [instance sendEventWithName:@"onReceiveEvent" body:[NSString stringWithUTF8String:eventJson]];
  }
}
}
