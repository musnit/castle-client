# DO NOT EDIT
# This makefile makes sure all linkable targets are
# up-to-date with anything they link to
default:
	echo "Do not invoke directly"

# Rules to remove targets that are older than anything to which they
# link.  This forces Xcode to relink the targets from scratch.  It
# does not seem to check these dependencies itself.
PostBuild.box2d.Debug:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/Debug/libbox2d.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/Debug/libbox2d.a


PostBuild.castle-core.Debug:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/Debug${EFFECTIVE_PLATFORM_NAME}/libcastle-core.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/Debug${EFFECTIVE_PLATFORM_NAME}/libcastle-core.a


PostBuild.fmt.Debug:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/Debug${EFFECTIVE_PLATFORM_NAME}/libfmtd.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/Debug${EFFECTIVE_PLATFORM_NAME}/libfmtd.a


PostBuild.soloud.Debug:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/Debug${EFFECTIVE_PLATFORM_NAME}/libsoloud.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/Debug${EFFECTIVE_PLATFORM_NAME}/libsoloud.a


PostBuild.box2d.Release:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/Release/libbox2d.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/Release/libbox2d.a


PostBuild.castle-core.Release:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/Release${EFFECTIVE_PLATFORM_NAME}/libcastle-core.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/Release${EFFECTIVE_PLATFORM_NAME}/libcastle-core.a


PostBuild.fmt.Release:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/Release${EFFECTIVE_PLATFORM_NAME}/libfmt.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/Release${EFFECTIVE_PLATFORM_NAME}/libfmt.a


PostBuild.soloud.Release:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/Release${EFFECTIVE_PLATFORM_NAME}/libsoloud.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/Release${EFFECTIVE_PLATFORM_NAME}/libsoloud.a


PostBuild.box2d.MinSizeRel:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/MinSizeRel/libbox2d.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/MinSizeRel/libbox2d.a


PostBuild.castle-core.MinSizeRel:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/MinSizeRel${EFFECTIVE_PLATFORM_NAME}/libcastle-core.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/MinSizeRel${EFFECTIVE_PLATFORM_NAME}/libcastle-core.a


PostBuild.fmt.MinSizeRel:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/MinSizeRel${EFFECTIVE_PLATFORM_NAME}/libfmt.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/MinSizeRel${EFFECTIVE_PLATFORM_NAME}/libfmt.a


PostBuild.soloud.MinSizeRel:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/MinSizeRel${EFFECTIVE_PLATFORM_NAME}/libsoloud.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/MinSizeRel${EFFECTIVE_PLATFORM_NAME}/libsoloud.a


PostBuild.box2d.RelWithDebInfo:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/RelWithDebInfo/libbox2d.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/RelWithDebInfo/libbox2d.a


PostBuild.castle-core.RelWithDebInfo:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/RelWithDebInfo${EFFECTIVE_PLATFORM_NAME}/libcastle-core.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/RelWithDebInfo${EFFECTIVE_PLATFORM_NAME}/libcastle-core.a


PostBuild.fmt.RelWithDebInfo:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/RelWithDebInfo${EFFECTIVE_PLATFORM_NAME}/libfmt.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/RelWithDebInfo${EFFECTIVE_PLATFORM_NAME}/libfmt.a


PostBuild.soloud.RelWithDebInfo:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/RelWithDebInfo${EFFECTIVE_PLATFORM_NAME}/libsoloud.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/RelWithDebInfo${EFFECTIVE_PLATFORM_NAME}/libsoloud.a




# For each target create a dummy ruleso the target does not have to exist
