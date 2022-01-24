#import "CastleCoreView.h"

#import <AVFoundation/AVFoundation.h>

#import <React/RCTViewManager.h>

#include <SDL.h>

//
// Engine instance
//

namespace CastleCore {
static bool engineInitialized = false;
bool isEngineInitialized() {
  return engineInitialized;
}

Engine &getEngine() {
  static Engine engine(FEED_TYPE);
  engineInitialized = true;
  return engine;
}

const char *getAssetsDirectoryPath() {
  static NSString *path = [[NSBundle mainBundle] pathForResource:@"assets" ofType:@""];
  return path.UTF8String;
}
}

//
// CastleCoreView
//

@implementation CastleCoreView

+ (instancetype)sharedCastleCoreView {
  static CastleCoreView *sharedCastleCoreView = nil;

  if (!sharedCastleCoreView) {
    sharedCastleCoreView = [[self alloc] init];
  }

  return sharedCastleCoreView;
}

+ (NSString *)sceneCreatorApiVersion {
  return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"SceneCreatorApiVersion"];
}

- (instancetype)init {
  if (self = [super init]) {
    self.displayLink = nil;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(sdlViewAddNotificationReceived:)
                                                 name:@"sdl_view_add"
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(sdlViewRemoveNotificationReceived:)
                                                 name:@"sdl_view_remove"
                                               object:nil];
  }
  return self;
}

- (void)willMoveToSuperview:(nullable UIView *)newSuperview {
  if (newSuperview != nil && !self.displayLink) {
    self.displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(doFrame)];
    [self.displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
  [super willMoveToSuperview:newSuperview];
}

- (void)removeFromSuperview {
  if (self.displayLink) {
    [self.displayLink invalidate];
    self.displayLink = nil;
  }

  [super removeFromSuperview];
}

- (void)doFrame {
  CastleCore::getEngine().frame();
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
  CastleCore::getEngine().setPaused(paused_);
}

/**
 Setting initial params will cause the Engine to reset its state and load the card/deck/snapshot provided in `initialParams`.
 Therefore we should avoid changing this value while the Engine is mounted.
 */
- (void)setInitialParams:(NSString *)initialParams {
  const char *initialParamsCStr = [initialParams UTF8String];
  CastleCore::getEngine().setInitialParams(initialParamsCStr);
}

- (void)setCoreViews:(NSString *)coreViews {
 const char *coreViewsCStr = [coreViews UTF8String];
 CastleCore::getEngine().setCoreViews(coreViewsCStr);
}

- (void)setBeltHeightFraction:(double)beltHeightFraction {
  CastleCore::getEngine().setBeltHeightFraction(beltHeightFraction);
}

- (void)sdlViewAddNotificationReceived:(NSNotification *)notification {
  UIViewController *viewController = (UIViewController *)notification.userInfo[@"viewController"];

  // Remove from whatever it was attached to before
  [viewController.view removeFromSuperview];

  // Attach it to us
  [viewController.view setFrame:self.frame];
  [viewController.view setNeedsLayout];
  [self addSubview:viewController.view];
}

- (void)sdlViewRemoveNotificationReceived:(NSNotification *)notification {
  UIViewController *viewController = (UIViewController *)notification.userInfo[@"viewController"];

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

RCT_EXPORT_VIEW_PROPERTY(initialParams, NSString);
RCT_EXPORT_VIEW_PROPERTY(coreViews, NSString);
RCT_EXPORT_VIEW_PROPERTY(beltHeightFraction, double);
RCT_EXPORT_VIEW_PROPERTY(screenScaling, double);
RCT_EXPORT_VIEW_PROPERTY(applyScreenScaling, BOOL);
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);

@end
