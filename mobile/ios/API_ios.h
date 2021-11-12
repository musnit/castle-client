#include <UIKit/UIKit.h>
#import <React/RCTBridge.h>

#ifndef API_ios_h
#define API_ios_h

@interface APIIos : NSObject
+ (void)setRctBridge:(RCTBridge *)rctBridge;
+ (void)iosGraphqlPostRequest:(NSString *)postBody
                 withCallback:(void (^)(NSString *, NSString *))callback;
+ (void)iosGetRequest:(NSString *)url withCallback:(void (^)(NSString *, NSString *))callback;
+ (void)iosGetDataRequest:(NSString *)url withCallback:(void (^)(NSString *, NSData *))callback;
@end

#endif /* API_ios_h */
