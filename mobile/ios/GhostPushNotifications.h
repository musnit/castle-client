#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#ifndef GhostPushNotifications_h
#define GhostPushNotifications_h

@interface GhostPushNotifications : RCTEventEmitter <RCTBridgeModule>

@property(nonatomic, assign) BOOL hasListeners;

- (void)onNewPushNotificationToken: (NSData *)token;

@end

#endif /* GhostPushNotifications_h */
