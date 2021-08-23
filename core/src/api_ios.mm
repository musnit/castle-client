#import "api.h"
#include <UIKit/UIKit.h>

@interface APIIos : NSObject
+ (NSString *)iosPostRequest:(NSString *)postBody;
@end

@implementation APIIos

std::string API::postRequest(const std::string &body) {
  NSString *result = [APIIos iosPostRequest:[NSString stringWithUTF8String:body.c_str()]];
  return std::string([result UTF8String]);
}

+ (NSString *)iosPostRequest:(NSString *)postBody {
  NSMutableURLRequest *request =
      [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@"https://api.castle.xyz/graphql"]];
  request.HTTPMethod = @"POST";

  [request setValue:@"application/json; charset=utf-8" forHTTPHeaderField:@"Content-Type"];
  [request setValue:@"true" forHTTPHeaderField:@"X-Enable-Scene-Creator-Migrations"];

  NSData *requestBodyData = [postBody dataUsingEncoding:NSUTF8StringEncoding];
  request.HTTPBody = requestBodyData;

  NSData *data = [NSURLConnection sendSynchronousRequest:request returningResponse:nil error:nil];
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}
@end
