# DO NOT EDIT
# This makefile makes sure all linkable targets are
# up-to-date with anything they link to
default:
	echo "Do not invoke directly"

# Rules to remove targets that are older than anything to which they
# link.  This forces Xcode to relink the targets from scratch.  It
# does not seem to check these dependencies itself.
PostBuild.fmt.Debug:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/Debug${EFFECTIVE_PLATFORM_NAME}/libfmtd.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/Debug${EFFECTIVE_PLATFORM_NAME}/libfmtd.a


PostBuild.fmt.Release:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/Release${EFFECTIVE_PLATFORM_NAME}/libfmt.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/Release${EFFECTIVE_PLATFORM_NAME}/libfmt.a


PostBuild.fmt.MinSizeRel:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/MinSizeRel${EFFECTIVE_PLATFORM_NAME}/libfmt.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/MinSizeRel${EFFECTIVE_PLATFORM_NAME}/libfmt.a


PostBuild.fmt.RelWithDebInfo:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/RelWithDebInfo${EFFECTIVE_PLATFORM_NAME}/libfmt.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/fmt/RelWithDebInfo${EFFECTIVE_PLATFORM_NAME}/libfmt.a




# For each target create a dummy ruleso the target does not have to exist
