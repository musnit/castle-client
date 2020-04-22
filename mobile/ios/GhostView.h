#import <AVFoundation/AVFoundation.h>

#import <React/RCTView.h>
#import <React/RCTViewManager.h>

#include <lauxlib.h>
#include <lua.h>
#include <lualib.h>

#include <SDL.h>

#include "modules/love/love.h"

#ifndef GhostView_h
#define GhostView_h

@interface GhostView : RCTView

@property(nonatomic, assign) lua_State *luaState;
@property(nonatomic, assign) int loveBootStackPos;

@property(nonatomic, strong) CADisplayLink *displayLink;

+ (instancetype)sharedGhostView;

@end

#endif /* GhostView_h */
