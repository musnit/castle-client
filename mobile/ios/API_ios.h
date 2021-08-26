#include <UIKit/UIKit.h>
#import <React/RCTBridge.h>

#ifndef API_ios_h
#define API_ios_h

@interface APIIos : NSObject
+ (void)setRctBridge:(RCTBridge *)rctBridge;
+ (void)iosPostRequest:(NSString *)postBody withCallback:(void (^)(NSString *, NSString *))callback;
@end

#endif /* API_ios_h */
