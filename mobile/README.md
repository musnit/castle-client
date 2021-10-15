# Set up

- Follow the parent README's setup instructions
- Follow the [dependencies and development environment setup instructions](https://reactnative.dev/docs/environment-setup) in the React Native documentation for your host platform (stop right before "Creating a new application").
- Run `npm i` in this directory
- Copy `mobile/.env` from our credentials repository to this directory

## Android

- Remove the `ndk.dir` field from local.properties if you added it for the React Native setup.
- Install NDK version `22.1.7171670` and CMake version `3.18.1` from the Android SDK manager.
- If you hit a similar error to this: `> Could not find tools.jar. Please check that /Library/Internet Plug-Ins/JavaAppletPlugin.plugin/Contents/Home contains a valid JDK installation.` it may be related to updating to macOS big sur, and you should follow [this](https://stackoverflow.com/questions/64968851/could-not-find-tools-jar-please-check-that-library-internet-plug-ins-javaapple).

# Running

## iOS

- Make sure Xcode is up to date and Xcode Command Line Tools are installed
- `npx react-native start` in this directory to start the packager
- Open `Castle.xcworkspace` in Xcode (not the Xcode Project)
- Run Debug target on Simulator or device to automatically load dev bundle from the packager

## Android

- `./run_android`

Once you have the app running, shake the device to open the React Native developer menu and select 'Enable Live Reload'. Then, you should be able to modify any of the files under 'js/' and save to trigger a reload of the app that picks up your changes!

# Releases

## iOS (Testflight)

- Make sure `fastlane` is up to date: `bundle update fastlane` from this directory. (You need the `bundler` gem.)
- You may have to manually download our provisioning profile for `xyz.castle.castle.CastleNotificationService` from the Apple Developer website or through Xcode.
- Run `./tools/upload-ios-build.sh beta` to upload a build to testflight.
- You will need your personal credentials for Castle's Apple team, and you may also be asked to generate an app-specific password (Fastlane will give you instructions if this is needed).
- Fastlane will download the needed certs, build the app, upload it to Apple, wait for it to "process", and then automatically release it to just employees.
- Although we have a circleci config for fastlane, it doesn't work right now.

## Android Play Store

- Use branch `beta/release`
- Bump versionCode and versionName in `android/app/build.gradle`
- `cd tools`
- `./build-android-prod.sh` will generate a .aab file at tools/build/app-release.aab and also install it to the connected android device for testing
- Upload to open testing https://play.google.com/console/u/1/developers/6774483098390213048/app/4973889594505423194/tracks/open-testing. Make sure to update the release notes.
- Wait until it's reviewed, then go to https://play.google.com/console/u/1/developers/6774483098390213048/app/4973889594505423194/publishing to publish
- Once it's ready for full release, go to https://play.google.com/console/u/1/developers/6774483098390213048/app/4973889594505423194/tracks/open-testing and do "Promote release"
- Run `./tools/android-set-app-version.sh` to trigger the in-app update banner
