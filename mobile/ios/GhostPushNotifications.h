#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#ifndef GhostPushNotifications_h
#define GhostPushNotifications_h

@interface GhostPushNotifications : RCTEventEmitter <RCTBridgeModule>

@property(nonatomic, assign) BOOL hasListeners;

- (void)onNewPushNotificationToken: (NSData *)token;
- (void)onPushNotificationReceived: (NSDictionary *)data;
- (void)onPushNotificationClicked: (NSDictionary *)data;

@end

#endif /* GhostPushNotifications_h */
