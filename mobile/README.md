## Set up

- Follow the parent README's setup instructions
- Follow the [dependencies and development environment setup instructions](https://reactnative.dev/docs/environment-setup) in the React Native documentation for your host platform (stop right before "Creating a new application").
- Run `npm i` in this directory
- Copy `mobile/.env` from our credentials repository to this directory

### Android

- Remove the `ndk.dir` field from local.properties if you added it for the React Native setup.
- Install NDK version `22.1.7171670` and CMake version `3.18.1` from the Android SDK manager.
- If you hit a similar error to this: `> Could not find tools.jar. Please check that /Library/Internet Plug-Ins/JavaAppletPlugin.plugin/Contents/Home contains a valid JDK installation.` it may be related to updating to macOS big sur, and you should follow [this](https://stackoverflow.com/questions/64968851/could-not-find-tools-jar-please-check-that-library-internet-plug-ins-javaapple).

## Running

### iOS

- Make sure Xcode is up to date and Xcode Command Line Tools are installed
- `npx react-native start` in this directory to start the packager
- Open `Castle.xcworkspace` in Xcode (not the Xcode Project)
- Run on arm device (if you want to use x86 simulator, you'll need to set up `../core`)

### Android

- `./run_android`

Once you have the app running, shake the device to open the React Native developer menu and select 'Enable Live Reload'. Then, you should be able to modify any of the files under 'js/' and save to trigger a reload of the app that picks up your changes!

## Changing dependencies

### JS

- (Nov 2021) Use npm 7 because at the moment npm 8 is breaking our Android install: `npm i -g npm@7`

### iOS

- Install cocoapods from homebrew (ensures it works on M1)
- (Nov 2021) To install pods, use `tools/rn-pod-install.sh` to avoid an issue with React Native 0.64 podspec generation. Do not use `pod install` by itself.
- Commit the contents of `ios/Pods`

## Releases

### iOS

If it's your first time doing a release from this machine:

- Ensure you're signed in to the Castle team in Xcode.
- Install the `bundler` gem if you don't have it.
- Generate an app-specific password on your Apple id. If you don't know how, Fastlane will prompt you with instructions later.

On all releases:

- If this is the first time uploading a build since last app store approval, bump the app's minor version for both the `Castle` target and the `CastleNotificationService` target. The versions must match. You can ignore the Build number because we'll set this automatically.
- Run `./tools/upload-ios-build.sh [your apple id]`, which wraps Fastlane.
- Fastlane will download the needed certs, build the app, upload it to Apple, wait for it to "process", and then automatically release it to just the Castle team via TestFlight.
- You can commit the changes to `Gemfile.lock`, discard the rest.
- To submit to Apple Review, you can select the build you just uploaded from App Store Connect.

Troubleshooting:

- If you hit provisioning errors: Manually download our provisioning profile for `xyz.castle.castle.CastleNotificationService` from the Apple Developer website or through Xcode. (Fastlane will take care of the rest, but not this one.)
- If `fastlane` automatically creates a new certificate for some reason: You'll need to use the Apple Developer website to add that new cert to the `CastleNotificationService` provisioning profile and download the profile again.
- Although we have a circleci config for fastlane, it doesn't work right now.

### Android Play Store

- Use branch `beta/release`
- './copy_cpp_files_to_android.sh'
- Bump versionCode and versionName in `android/app/build.gradle`
- `cd tools`
- `./build-android-prod.sh` will generate a .aab file at tools/build/app-release.aab and also install it to the connected android device for testing

- QA Checklist:
  - Cold boot with nux deck
  - Log in
  - Sign up
  - Open deck from deep link (cold boot)
  - Open deck from deep link (app already open)
  - Open deck from push notification (cold boot)
  - Open deck from push notification (app already open)

- `cd ..` (to mobile)
- `./node_modules/@sentry/cli/bin/sentry-cli upload-dif -o castle-xyz -p castle-mobile android/app/build/intermediates/merged_native_libs/release`
- `open tools/build`
- Upload to play store https://play.google.com/console/u/1/developers/6774483098390213048/app/4973889594505423194/tracks/production. Make sure to update the release notes.
- Run `./tools/android-set-app-version.sh` to trigger the in-app update banner
- Release web?
