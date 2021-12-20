#pragma once

#import <React/RCTView.h>

//
// Engine instance
//

#ifdef __cplusplus

#define FEED_TYPE 3

#include "engine.h"

namespace CastleCore {
bool isEngineInitialized();
Engine &getEngine();
}

#endif

//
// CastleCoreView
//

@interface CastleCoreView : RCTView

@property (nonatomic, strong) CADisplayLink *displayLink;

+ (instancetype)sharedCastleCoreView;
+ (NSString *)sceneCreatorApiVersion;
- (void)setPaused:(BOOL)paused;

@end
