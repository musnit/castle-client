#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "AMPBackgroundNotifier.h"
#import "AMPConfigManager.h"
#import "AMPConstants.h"
#import "AMPDatabaseHelper.h"
#import "AMPDeviceInfo.h"
#import "Amplitude+SSLPinning.h"
#import "AmplitudePrivate.h"
#import "AMPServerZoneUtil.h"
#import "AMPURLConnection.h"
#import "AMPURLSession.h"
#import "AMPUtils.h"
#import "ISPCertificatePinning.h"
#import "ISPPinnedNSURLConnectionDelegate.h"
#import "ISPPinnedNSURLSessionDelegate.h"
#import "AMPIdentify.h"
#import "Amplitude.h"
#import "AMPPlan.h"
#import "AMPRevenue.h"
#import "AMPServerZone.h"
#import "AMPTrackingOptions.h"

FOUNDATION_EXPORT double AmplitudeVersionNumber;
FOUNDATION_EXPORT const unsigned char AmplitudeVersionString[];

