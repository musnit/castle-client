#import "API_ios.h"
#include <RNCAsyncStorage/RNCAsyncStorage.h>
#include <string>
#import "CastleCoreView.h"

static RCTBridge *sRctBridge;

@implementation APIIos

+ (void)setRctBridge:(RCTBridge *)rctBridge {
  sRctBridge = rctBridge;
}

+ (void)iosGraphqlPostRequest:(NSString *)postBody withCallback:(void (^)(NSString *, NSString *))callback {
  RNCAsyncStorage *asyncStorageModule = [sRctBridge moduleForClass:[RNCAsyncStorage class]];
  NSArray *asyncStorageKeys = @[@"AUTH_TOKEN"];
  dispatch_async([asyncStorageModule methodQueue], ^{
    [asyncStorageModule multiGet:asyncStorageKeys callback:^(NSArray *response) {
      NSString *authToken = NULL;
      if (![response[0] isEqual:[NSNull null]]) {
        // there was an auth token error
      } else {
        // top level array has two elements. first is error if it exists and second is array
        // second level array has an element for each key requested
        // last level array has [key, value]. so [1] is the actual auth token
        authToken = response[1][0][1];
      }
      
      NSMutableURLRequest *request =
          [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@"https://api.castle.xyz/graphql"]];
      request.HTTPMethod = @"POST";

      [request setValue:@"application/json; charset=utf-8" forHTTPHeaderField:@"Content-Type"];
      [request setValue:[CastleCoreView sceneCreatorApiVersion] forHTTPHeaderField:@"X-Scene-Creator-Version"];
      
      if (authToken) {
        [request setValue:authToken forHTTPHeaderField:@"X-Auth-Token"];
      }

      NSData *requestBodyData = [postBody dataUsingEncoding:NSUTF8StringEncoding];
      request.HTTPBody = requestBodyData;
      
      NSURLSession *session = [NSURLSession sharedSession];
      [[session dataTaskWithRequest:request
                completionHandler:^(NSData *data,
                                    NSURLResponse *response,
                                    NSError *error) {
        if (data == nil) {
          callback([error localizedDescription], NULL);
        } else {
          callback(NULL, [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
        }
      }] resume];
    }];
  });
}

+ (void)iosGetRequest:(NSString *)url withCallback:(void (^)(NSString *, NSString *))callback
{
  NSMutableURLRequest *request =
      [NSMutableURLRequest requestWithURL:[NSURL URLWithString:url]];
  request.HTTPMethod = @"GET";

  [request setValue:@"application/json; charset=utf-8" forHTTPHeaderField:@"Content-Type"];
  
  NSURLSession *session = [NSURLSession sharedSession];
  [[session dataTaskWithRequest:request
            completionHandler:^(NSData *data,
                                NSURLResponse *response,
                                NSError *error) {
    if (data == nil) {
      callback([error localizedDescription], NULL);
    } else {
      callback(NULL, [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
    }
  }] resume];
}

+ (void)iosGetDataRequest:(NSString *)url withCallback:(void (^)(NSString *, NSData *))callback
{
  NSMutableURLRequest *request =
      [NSMutableURLRequest requestWithURL:[NSURL URLWithString:url]];
  request.HTTPMethod = @"GET";

  [request setValue:@"application/json; charset=utf-8" forHTTPHeaderField:@"Content-Type"];

  NSURLSession *session = [NSURLSession sharedSession];
  [[session dataTaskWithRequest:request
            completionHandler:^(NSData *data,
                                NSURLResponse *response,
                                NSError *error) {
    if (data == nil) {
      callback([error localizedDescription], NULL);
    } else {
      callback(NULL, data);
    }
  }] resume];
}
@end

namespace CastleAPI {
void graphqlPostRequest(const std::string &body, const std::function<void(bool, std::string, std::string)> callback) {
  [APIIos iosGraphqlPostRequest:[[NSString stringWithUTF8String:body.c_str()] copy] withCallback:^(NSString *error, NSString *result) {
    if (result) {
      std::string resultString = std::string([result UTF8String]);
      callback(true, "", resultString);
    } else {
      std::string errorString = std::string([error UTF8String]);
      callback(false, errorString, "");
    }
  }];
}

void getRequest(const std::string &url, const std::function<void(bool, std::string, std::string)> callback) {
  [APIIos iosGetRequest:[[NSString stringWithUTF8String:url.c_str()] copy] withCallback:^(NSString *error, NSString *result) {
    if (result) {
      std::string resultString = std::string([result UTF8String]);
      callback(true, "", resultString);
    } else {
      std::string errorString = std::string([error UTF8String]);
      callback(false, errorString, "");
    }
  }];
}

void getDataRequest(const std::string &url, const std::function<void(bool, std::string, unsigned char *, unsigned long)> callback) {
  [APIIos iosGetDataRequest:[[NSString stringWithUTF8String:url.c_str()] copy] withCallback:^(NSString *error, NSData *result) {
    if (result) {
      callback(true, "", (unsigned char*) [result bytes], [result length]);
    } else {
      std::string errorString = std::string([error UTF8String]);
      callback(false, errorString, NULL, 0);
    }
  }];
}
}
