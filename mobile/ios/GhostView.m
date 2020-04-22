// Wrapped by 'GhostView.js'.

#include "GhostView.h"

//
// GhostView
//

#define SCENE_CREATOR_USE_PROD_SCENE_CREATOR false
#define SCENE_CREATOR_DEV_URI @"http://192.168.1.146:8080/Client.lua"

@implementation GhostView

+ (instancetype)sharedGhostView {
  static GhostView *sharedGhostView = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
      sharedGhostView = [[self alloc] init];

      dispatch_async(dispatch_get_main_queue(), ^{
        if (!sharedGhostView.luaState) {
          [sharedGhostView bootLoveWithUri:SCENE_CREATOR_USE_PROD_SCENE_CREATOR ? @"" : SCENE_CREATOR_DEV_URI];
        } else {
          RCTLog(@"`GhostView`: already booted, ignoring new `uri`");
        }
      });
  });
  return sharedGhostView;
}

- (instancetype)init {
  if (self = [super init]) {
    self.luaState = nil;

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
      self.displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(stepLove)];
      [self.displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
    });
  }
  return self;
}

- (void)bootLoveWithUri:(NSString *)uri {
#if TARGET_OS_SIMULATOR
  // Don't run Lua in Simulator
  return;
#endif

  // Create the virtual machine.
  lua_State *L = luaL_newstate();
  luaL_openlibs(L);

  // Add love to package.preload for easy requiring.
  lua_getglobal(L, "package");
  lua_getfield(L, -1, "preload");
  lua_pushcfunction(L, luaopen_love);
  lua_setfield(L, -2, "love");
  lua_pop(L, 2);

  // Add command line arguments to global arg (like stand-alone Lua).
  {
    lua_newtable(L);

    lua_pushstring(L, "love");
    lua_rawseti(L, -2, -2);

    lua_pushstring(L, "embedded boot.lua");
    lua_rawseti(L, -2, -1);

    NSArray *bundlepaths =
        [[NSBundle mainBundle] pathsForResourcesOfType:@"love" inDirectory:nil];
    if (bundlepaths.count > 0) {
      lua_pushstring(L, [bundlepaths[0] UTF8String]);
      lua_rawseti(L, -2, 0);
      lua_pushstring(L, "--fused");
      lua_rawseti(L, -2, 1);
    }

    lua_setglobal(L, "arg");
  }

  // require "love"
  lua_getglobal(L, "require");
  lua_pushstring(L, "love");
  lua_call(L, 1, 1); // leave the returned table on the stack.

  // Add love._exe = true.
  // This indicates that we're running the standalone version of love, and not
  // the library version.
  {
    lua_pushboolean(L, 1);
    lua_setfield(L, -2, "_exe");
  }

  // Pop the love table returned by require "love".
  lua_pop(L, 1);

  // require "love.boot" (preloaded when love was required.)
  lua_getglobal(L, "require");
  lua_pushstring(L, "love.boot");
  lua_call(L, 1, 1);

  // Turn the returned boot function into a coroutine and leave it at the top of
  // the stack
  lua_newthread(L);
  lua_pushvalue(L, -2);
  self.loveBootStackPos = lua_gettop(L);
  self.luaState = L;

  // If `uri` is given, set it as the global variable `GHOST_ROOT_URI`
  if (uri) {
    lua_pushstring(L, uri.UTF8String);
    lua_setglobal(L, "GHOST_ROOT_URI");
  }

  // Set the location of the network 'seed' database--contains network data we've 'embedded' into the client
  {
    NSString *ghostNetworkSeedPath = [[NSBundle mainBundle] pathForResource:@"ghost_network_seed" ofType:@"db"];
    if (ghostNetworkSeedPath) {
      lua_pushstring(L, ghostNetworkSeedPath.UTF8String);
      lua_setglobal(L, "GHOST_NETWORK_SEED_PATH");
    }
  }

  // Don't stop audio that's already playing in the background
  {
    AVAudioSession *session = [AVAudioSession sharedInstance];
    if (session.isOtherAudioPlaying) {
      NSError *err;
      if (![session setCategory:AVAudioSessionCategoryAmbient error:&err])
        NSLog(@"Error in AVAudioSession setCategory: %@",
              [err localizedDescription]);
    }
  }
}

- (void)stepLove {
  if (self.luaState) {
    // Call the coroutine at the top of the stack
    lua_State *L = self.luaState;
    if (lua_resume(L, 0) == LUA_YIELD) {
      lua_pop(L, lua_gettop(L) - self.loveBootStackPos);
    } else {
      [self closeLua];
    }
  }
}

- (void)closeLua {
  if (self.luaState) {
    lua_close(self.luaState);
    self.luaState = nil;
  }
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
// GhostViewManager
//

@interface GhostViewManager : RCTViewManager
@end

@implementation GhostViewManager

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (UIView *)view {
  return [GhostView sharedGhostView];
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_VIEW_PROPERTY(uri, NSString);
RCT_EXPORT_VIEW_PROPERTY(screenScaling, double);
RCT_EXPORT_VIEW_PROPERTY(applyScreenScaling, BOOL);

@end
