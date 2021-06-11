#import "CastleCoreView.h"

#import <AVFoundation/AVFoundation.h>

#import <React/RCTViewManager.h>

#include <SDL.h>


//
// Engine instance
//

namespace CastleCore {
Engine &getEngine() {
  static Engine engine;
  static bool initialized = false;
  if (!initialized) {
    initialized = true;
    engine.loadSceneFromDeckId("ae5b8c7e-fd3a-4835-b972-fbf0bed2b81c");
  }
  return engine;
}
}


//
// CastleCoreView
//

@implementation CastleCoreView

+ (instancetype)sharedCastleCoreView {
  static CastleCoreView *sharedCastleCoreView = nil;

  if (!sharedCastleCoreView || !sharedCastleCoreView.displayLink) {
    sharedCastleCoreView = [[self alloc] init];
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
  CastleCore::getEngine().frame();
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
