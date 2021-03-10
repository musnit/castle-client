# Set up

- Follow the [dependencies and development environment setup instructions](https://reactnative.dev/docs/environment-setup) in the React Native documentation for your host platform (stop right before "Creating a new application").
- Run `npm i` in this directory
- Copy `mobile/.env` from our credentials repository to this directory

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

- Run `tools/set-scene-creator-api-version.sh` with something other than `dev`, corresponding to the lua release channel you'd like this build to use. This will modify native config files for iOS and Android. You can commit this change to a release branch, but not to master.
- Publish `scene-creator` to the release channel chosen for this build.

## iOS (Testflight)

- Make sure `fastlane` is up to date: `bundle update fastlane` from this directory. (You need the `bundler` gem.)
- You may have to manually download our provisioning profile for `xyz.castle.castle.CastleNotificationService` from the Apple Developer website or through Xcode.
- Run `./tools/upload-ios-build.sh beta` to upload a build to testflight.
- You will need your personal credentials for Castle's Apple team, and you may also be asked to generate an app-specific password (Fastlane will give you instructions if this is needed).
- Fastlane will download the needed certs, build the app, upload it to Apple, wait for it to "process", and then automatically release it to just employees.
- Although we have a circleci config for fastlane, it doesn't work right now.

## Android Play Store

- Bump versionCode and versionName in `android/app/build.gradle`
- Use branch `playstore/release`
- `cd android`
- `./gradlew bundleRelease`
- `app/build/outputs/bundle/release/app-release.aab`
- Upload to open testing https://play.google.com/console/u/1/developers/6774483098390213048/app/4973889594505423194/tracks/open-testing
- Wait until it's reviewed, then go to https://play.google.com/console/u/1/developers/6774483098390213048/app/4973889594505423194/publishing to publish
- Once it's ready for full release, go to https://play.google.com/console/u/1/developers/6774483098390213048/app/4973889594505423194/tracks/open-testing and do "Promote release"
