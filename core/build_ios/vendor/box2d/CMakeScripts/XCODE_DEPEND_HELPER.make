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


PostBuild.box2d.Release:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/Release/libbox2d.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/Release/libbox2d.a


PostBuild.box2d.MinSizeRel:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/MinSizeRel/libbox2d.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/MinSizeRel/libbox2d.a


PostBuild.box2d.RelWithDebInfo:
/Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/RelWithDebInfo/libbox2d.a:
	/bin/rm -f /Users/nikki/Development/castle-xyz/castle-client/core/build_ios/vendor/box2d/bin/RelWithDebInfo/libbox2d.a




# For each target create a dummy ruleso the target does not have to exist
