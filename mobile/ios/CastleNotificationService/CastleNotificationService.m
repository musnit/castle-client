
#import "CastleNotificationService.h"
#import <UIKit/UIKit.h>

@interface CastleNotificationService ()

@property (nonatomic, strong) void (^contentHandler)(UNNotificationContent *contentToDeliver);
@property (nonatomic, strong) UNMutableNotificationContent *bestAttemptContent;

@end

@implementation CastleNotificationService

- (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
  self.contentHandler = contentHandler;
  self.bestAttemptContent = [request.content mutableCopy];
  
  if (self.bestAttemptContent && self.bestAttemptContent.userInfo[@"image"]) {
    __weak typeof(self) weakSelf = self;
    [self _getMediaAttachment:self.bestAttemptContent.userInfo[@"image"] completion:^(UIImage *image) {
      __strong typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        NSURL *fileUrl = [strongSelf _saveImageAttachment:image forIdentifier:@"attachment.png"];
        NSError *err;
        UNNotificationAttachment *attachment = [UNNotificationAttachment attachmentWithIdentifier:@"image" URL:fileUrl options:nil error:&err];
        if (attachment && !err) {
          strongSelf.bestAttemptContent.attachments = @[attachment];
          strongSelf.contentHandler(strongSelf.bestAttemptContent);
        } else {
          strongSelf.contentHandler(strongSelf.bestAttemptContent);
        }
      }
    }];
  } else {
    self.contentHandler(self.bestAttemptContent);
  }
}

- (void)serviceExtensionTimeWillExpire {
  self.contentHandler(self.bestAttemptContent);
}

- (NSURL *)_saveImageAttachment: (UIImage *)image forIdentifier:(NSString *)identifier {
  NSURL *tempDirectory = [NSURL fileURLWithPath:NSTemporaryDirectory()];
  NSURL *path = [tempDirectory URLByAppendingPathComponent:NSProcessInfo.processInfo.globallyUniqueString isDirectory:YES];
  NSError *err;
  [[NSFileManager defaultManager] createDirectoryAtURL:path withIntermediateDirectories:YES attributes:nil error:&err];
  if (!err) {
    NSURL *fileURL = [path URLByAppendingPathComponent:identifier];
    NSData *imageData = UIImagePNGRepresentation(image);
    if (imageData && [imageData writeToURL:fileURL atomically:YES]) {
      return fileURL;
    }
  }
  return nil;
}

- (void)_getMediaAttachment:(NSString *)urlString completion:(void (^)(UIImage *))completion {
  NSURL *url = [NSURL URLWithString:urlString];
  if (url) {
    [self _downloadImage:url completion:^(UIImage *image, NSError *err) {
      if (!err && image) {
        completion(image);
      } else {
        completion(nil);
      }
    }];
  } else {
    completion(nil);
  }
}

- (void)_downloadImage:(NSURL *)imageUrl completion:(void (^)(UIImage *, NSError *))completion {
  NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithURL:imageUrl completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
    if (error) {
      completion(nil, error);
      return;
    }
    if (data) {
      UIImage *result = [UIImage imageWithData:data];
      if (result) {
        completion(result, nil);
        return;
      }
    }
    completion(nil, [NSError errorWithDomain:@"Castle" code:0 userInfo:@{ NSLocalizedDescriptionKey: @"Empty or invalid image data" }]);
  }];
  [task resume];
}

@end
