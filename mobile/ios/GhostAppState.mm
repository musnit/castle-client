#import "GhostAppState.h"

#import <UIKit/UIKit.h>

#import <React/RCTUtils.h>

@interface GhostAppState ()

@property (nonatomic, assign) BOOL hasListeners;

@end

@implementation GhostAppState

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
    return @[@"onAppStateChange"];
}

-(void)startObserving {
    self.hasListeners = YES;
}

-(void)stopObserving {
    self.hasListeners = NO;
}

- (void)appStateChanged {
  dispatch_async(dispatch_get_main_queue(), ^{
    UIApplicationState newAppState = [RCTSharedApplication() applicationState];
    if (self.hasListeners) {
      [self sendEventWithName:@"onAppStateChange" body:[self _applicationStateString:newAppState]];
    }
  });
}

- (NSString *)_applicationStateString: (UIApplicationState)state {
  switch (state) {
    case UIApplicationStateActive:
      return @"active";
    case UIApplicationStateInactive:
      return @"inactive";
    case UIApplicationStateBackground:
      return @"background";
  }
  return @"";
}

@end
