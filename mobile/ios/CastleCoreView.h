#pragma once

#import <React/RCTView.h>


//
// Engine instance
//

#ifdef __cplusplus

#include "engine.h"

namespace CastleCore {
Engine &getEngine();
}

#endif


//
// CastleCoreView
//

@interface CastleCoreView : RCTView

@property(nonatomic, strong) CADisplayLink *displayLink;

+ (instancetype)sharedCastleCoreView;
- (void)setPaused:(BOOL)paused;

@end
