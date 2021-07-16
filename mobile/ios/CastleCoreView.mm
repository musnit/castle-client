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
  static Engine engine(true);
  engineInitialized = true;
  return engine;
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

static bool paused = false;

- (void)doFrame {
  if (paused) {
    return;
  }
  CastleCore::getEngine().frame();
}

- (void)setDeckId:(NSString *)deckId {
  const char *deckIdCStr = [deckId cStringUsingEncoding:NSUTF8StringEncoding];
  CastleCore::getEngine().loadSceneFromDeckId(deckIdCStr);
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

RCT_EXPORT_VIEW_PROPERTY(deckId, NSString);
RCT_EXPORT_VIEW_PROPERTY(screenScaling, double);
RCT_EXPORT_VIEW_PROPERTY(applyScreenScaling, BOOL);
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);

@end
