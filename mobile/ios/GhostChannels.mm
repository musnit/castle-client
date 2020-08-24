// Wrapped by 'GhostChannels.js'.

extern "C" {
#include <lauxlib.h>
#include <lua.h>
#include <lualib.h>
}

#include "GhostChannels.h"
#include "modules/thread/Channel.h"
#include "AppDelegate.h"
#include "GhostView.h"

@interface GhostChannels ()

@property (nonatomic, retain) NSObject *isReadyLock;
@property (atomic, assign) BOOL isReady;

// A Lua VM just for value conversion
@property(nonatomic, assign) lua_State *conversionLuaState;

@end

@implementation GhostChannels

RCT_EXPORT_MODULE()

- (instancetype)init {
  if (self = [super init]) {
    self.conversionLuaState = luaL_newstate();
    self.isReadyLock = [NSObject new];
    [self setReady:YES];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (void)dealloc {
  [self setReady:NO];
  if (self.conversionLuaState) {
    lua_close(self.conversionLuaState);
    self.conversionLuaState = nil;
  }
}

- (void)setReady:(BOOL)ready
{
  @synchronized (self.isReadyLock) {
    self.isReady = ready;
  }
}

- (BOOL)_checkIsReady
{
  BOOL result = NO;
  @synchronized (self.isReadyLock) {
    result = self.isReady;
  }
  return result;
}

- (NSString *)stringFromVariant:(love::Variant &)var {
  if (var.getType() != love::Variant::STRING &&
      var.getType() != love::Variant::SMALLSTRING) {
    return nil;
  }
  var.toLua(self.conversionLuaState);
  NSString *str = [NSString
      stringWithUTF8String:luaL_checkstring(self.conversionLuaState, -1)];
  lua_pop(self.conversionLuaState, 1);
  return str;
}

- (void)returnVariant:(love::Variant &)var
             resolver:(RCTPromiseResolveBlock)resolve
             rejecter:(RCTPromiseRejectBlock)reject {
  if (![self _checkIsReady]) {
    reject(@"E_GHOST_CHANNELS", @"`GhostChannels`: GhostChannels is not initialized", nil);
    return;
  }
  NSString *str = [self stringFromVariant:var];
  if (str) {
    resolve(str);
  } else {
    reject(@"E_GHOST_CHANNELS",
           @"`GhostChannels`: can only accept string values from Lua", nil);
  }
}

//
// Methods
//


RCT_EXPORT_METHOD(freezeScreenAsync
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
      AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
      [appDelegate freezeScreen];
      resolve(nil);
  });
}

RCT_EXPORT_METHOD(clearAsync
                  : (NSString *)name
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  if (![self _checkIsReady]) {
    reject(@"E_GHOST_CHANNELS", @"`GhostChannels`: GhostChannels is not initialized", nil);
    return;
  }
  auto channel = love::thread::Channel::getChannel(name.UTF8String);
  channel->clear();
  resolve(nil);
}

RCT_EXPORT_METHOD(demandAsync
                  : (NSString *)name
                  : (NSDictionary *)options
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  if (![self _checkIsReady]) {
    reject(@"E_GHOST_CHANNELS", @"`GhostChannels`: GhostChannels is not initialized", nil);
    return;
  }
  auto channel = love::thread::Channel::getChannel(name.UTF8String);
  love::Variant var;
  bool result = false;

  id timeout = options[@"timeout"];
  if (timeout) {
    result = channel->demand(&var, [timeout doubleValue]);
  } else {
    result = channel->demand(&var);
  }

  if (result) {
    [self returnVariant:var resolver:resolve rejecter:reject];
  } else {
    resolve(nil);
  }
}

RCT_EXPORT_METHOD(getCountAsync
                  : (NSString *)name
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  if (![self _checkIsReady]) {
    reject(@"E_GHOST_CHANNELS", @"`GhostChannels`: GhostChannels is not initialized", nil);
    return;
  }
  auto channel = love::thread::Channel::getChannel(name.UTF8String);
  resolve(@(channel->getCount()));
}

RCT_EXPORT_METHOD(hasReadAsync
                  : (NSString *)name
                  : (NSNumber *)theId
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  if (![self _checkIsReady]) {
    reject(@"E_GHOST_CHANNELS", @"`GhostChannels`: GhostChannels is not initialized", nil);
    return;
  }
  auto channel = love::thread::Channel::getChannel(name.UTF8String);
  resolve(@(channel->hasRead(theId.integerValue)));
}

RCT_EXPORT_METHOD(peekAsync
                  : (NSString *)name
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  if (![self _checkIsReady]) {
    reject(@"E_GHOST_CHANNELS", @"`GhostChannels`: GhostChannels is not initialized", nil);
    return;
  }
  auto channel = love::thread::Channel::getChannel(name.UTF8String);
  love::Variant var;
  if (channel->peek(&var)) {
    [self returnVariant:var resolver:resolve rejecter:reject];
  } else {
    resolve(nil);
  }
}

RCT_EXPORT_METHOD(popAsync
                  : (NSString *)name
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  if (![self _checkIsReady]) {
    reject(@"E_GHOST_CHANNELS", @"`GhostChannels`: GhostChannels is not initialized", nil);
    return;
  }
  auto channel = love::thread::Channel::getChannel(name.UTF8String);
  love::Variant var;
  if (channel->pop(&var)) {
    [self returnVariant:var resolver:resolve rejecter:reject];
  } else {
    resolve(nil);
  }
}

RCT_EXPORT_METHOD(popAllAsync
                  : (NSString *)name
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  if (![self _checkIsReady]) {
    reject(@"E_GHOST_CHANNELS", @"`GhostChannels`: GhostChannels is not initialized", nil);
    return;
  }
  auto channel = love::thread::Channel::getChannel(name.UTF8String);
  love::Variant var;

  NSMutableArray *ret = [NSMutableArray array];
  while (channel->pop(&var)) {
    NSString *str = [self stringFromVariant:var];
    if (str) {
      [ret addObject:str];
    } else {
      reject(@"E_GHOST_CHANNELS",
             @"`GhostChannels`: can only accept string values from Lua", nil);
      return;
    }
  }
  resolve(ret);
}

RCT_EXPORT_METHOD(pushAsync
                  : (NSString *)name
                  : (NSString *)value
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  if (![self _checkIsReady]) {
    reject(@"E_GHOST_CHANNELS", @"`GhostChannels`: GhostChannels is not initialized", nil);
    return;
  }
  auto channel = love::thread::Channel::getChannel(name.UTF8String);
  auto var =
      love::Variant(value.UTF8String,
                    [value lengthOfBytesUsingEncoding:NSUTF8StringEncoding]);
  resolve(@(channel->push(var)));
}

RCT_EXPORT_METHOD(supplyAsync
                  : (NSString *)name
                  : (NSString *)value
                  : (NSDictionary *)options
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  if (![self _checkIsReady]) {
    reject(@"E_GHOST_CHANNELS", @"`GhostChannels`: GhostChannels is not initialized", nil);
    return;
  }
  auto channel = love::thread::Channel::getChannel(name.UTF8String);
  auto var =
      love::Variant(value.UTF8String,
                    [value lengthOfBytesUsingEncoding:NSUTF8StringEncoding]);

  bool result = false;
  id timeout = options[@"timeout"];
  if (timeout) {
    result = channel->supply(var, [timeout doubleValue]);
  } else {
    result = channel->supply(var);
  }
  resolve(@(result));
}

RCT_EXPORT_METHOD(globalPause
                  : (RCTPromiseResolveBlock)resolve
                  : (RCTPromiseRejectBlock)reject) {
  [[GhostView sharedGhostView] setPaused:false];
  resolve(nil);
}

@end
