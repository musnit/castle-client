#import <AVFoundation/AVFoundation.h>

#import <React/RCTView.h>
#import <React/RCTViewManager.h>

#include <SDL.h>

#include "engine.h"


//
// Engine instance
//

static Engine &getEngine() {
  static Engine engine;
  return engine;
}


//
// CastleCoreView
//

@interface CastleCoreView : RCTView

@property(nonatomic, strong) CADisplayLink *displayLink;

+ (instancetype)sharedCastleCoreView;
- (void)setPaused:(BOOL)paused;

@end

@implementation CastleCoreView

+ (instancetype)sharedCastleCoreView {
  static CastleCoreView *sharedCastleCoreView = nil;

  if (!sharedCastleCoreView || !sharedCastleCoreView.displayLink) {
    sharedCastleCoreView = [[self alloc] init];

//    dispatch_async(dispatch_get_main_queue(), ^{
//      if (!sharedCastleCoreView.luaState) {
//        [sharedCastleCoreView bootLoveWithUri:SCENE_CREATOR_USE_PROD_SCENE_CREATOR ? @"" : SCENE_CREATOR_DEV_URI];
//      } else {
//        RCTLog(@"`CastleCoreView`: already booted, ignoring new `uri`");
//      }
//    });
  }

  return sharedCastleCoreView;
}

+ (NSString *)sceneCreatorApiVersion
{
  return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"SceneCreatorApiVersion"];
}

- (instancetype)init {
  if (self = [super init]) {
    self.displayLink = nil;

    [[NSNotificationCenter defaultCenter]
        addObserver:self
           selector:@selector(sdlViewAddNotificationReceived:)
               name:@"sdl_view_add"
             object:nil];
    [[NSNotificationCenter defaultCenter]
        addObserver:self
           selector:@selector(sdlViewRemoveNotificationReceived:)
               name:@"sdl_view_remove"
             object:nil];

    dispatch_async(dispatch_get_main_queue(), ^{
      self.displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(doFrame)];
      [self.displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
    });
  }
  return self;
}

static bool paused = false;

- (void)doFrame {
  if (paused) {
    return;
  }
  getEngine().frame();
}

- (void)setUri:(NSString *)uri {
}

extern double ghostScreenScaling;
extern bool ghostApplyScreenScaling;

- (void)setScreenScaling:(double)screenScaling {
  ghostScreenScaling = screenScaling;
}

- (void)setApplyScreenScaling:(BOOL)applyScreenScaling {
  ghostApplyScreenScaling = applyScreenScaling;
}

- (void)setPaused:(BOOL)paused_ {
  paused = paused_;
}

- (void)sdlViewAddNotificationReceived:(NSNotification *)notification {
  UIViewController *viewController =
      (UIViewController *)notification.userInfo[@"viewController"];

  // Remove from whatever it was attached to before
  [viewController.view removeFromSuperview];

  // Attach it to us
  [viewController.view setFrame:self.frame];
  [viewController.view setNeedsLayout];
  [self addSubview:viewController.view];
}

- (void)sdlViewRemoveNotificationReceived:(NSNotification *)notification {
  UIViewController *viewController =
      (UIViewController *)notification.userInfo[@"viewController"];

  // Remove from whatever it's attached to (hopefully us)
  [viewController.view removeFromSuperview];
}

@end


//
// CastleCoreViewManager
//

@interface CastleCoreViewManager : RCTViewManager
@end

@implementation CastleCoreViewManager

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (UIView *)view {
  return [CastleCoreView sharedCastleCoreView];
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_VIEW_PROPERTY(uri, NSString);
RCT_EXPORT_VIEW_PROPERTY(screenScaling, double);
RCT_EXPORT_VIEW_PROPERTY(applyScreenScaling, BOOL);
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);

@end
