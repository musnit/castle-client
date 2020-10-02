#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface GhostAppState : RCTEventEmitter <RCTBridgeModule>

- (void)appStateChanged;

@end
