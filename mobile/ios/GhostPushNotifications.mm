#import "GhostPushNotifications.h"

#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>

@implementation GhostPushNotifications

RCT_EXPORT_MODULE()

- (instancetype)init {
  if (self = [super init]) {
    self.hasListeners = NO;
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onNewPushNotificationToken"];
}

-(void)startObserving {
    self.hasListeners = YES;
}

-(void)stopObserving {
    self.hasListeners = NO;
}

- (void)onNewPushNotificationToken: (NSData *)token {
  if (self.hasListeners) {
    [self sendEventWithName:@"onNewPushNotificationToken" body:@{@"token": [self apnsTokenToString:token]}];
  }
}

- (NSString *)apnsTokenToString:(NSData *)token {
  char *data = (char *)token.bytes;
  NSMutableString *result = [NSMutableString string];
  
  for (NSUInteger i = 0; i < token.length; i++) {
    [result appendFormat:@"%02.2hhx", data[i]];
  }
  
  return [result copy];
}


//
// Methods
//

RCT_EXPORT_METHOD(requestToken
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  UNUserNotificationCenter* center = [UNUserNotificationCenter currentNotificationCenter];
  [center requestAuthorizationWithOptions:(UNAuthorizationOptionAlert + UNAuthorizationOptionSound + UNAuthorizationOptionBadge)
     completionHandler:^(BOOL granted, NSError * _Nullable error) {
    if (error) {
      reject(nil, nil, error);
    } else {
      dispatch_async(dispatch_get_main_queue(), ^{
        [[UIApplication sharedApplication] registerForRemoteNotifications];
      });

      resolve(nil);
    }
  }];
}

RCT_EXPORT_METHOD(getPlatform
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
#ifdef DEBUG
  resolve(@"ios-dev");
#else
  resolve(@"ios-prod");
#endif
}


@end
