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

- Open `../base/main.lua` and set `SCENE_CREATOR_API_VERSION` to something other than `dev`, corresponding to the lua release channel you'd like this build to use.
- Do the same thing in `mobile/js/Constants.js`. This tells the server not to serve incompatible decks in the feed.
- Publish `scene-creator` to the release channel chosen for this build.

## iOS (Testflight)

- Make sure `fastlane` is up to date: `bundle update fastlane` from this directory. (You need the `bundler` gem.)
- You may have to manually download our provisioning profile for `xyz.castle.castle.CastleNotificationService` from the Apple Developer website or through Xcode.
- Run `./tools/upload-ios-build.sh beta` to upload a build to testflight.
- You will need your personal credentials for Castle's Apple team, and you may also be asked to generate an app-specific password (Fastlane will give you instructions if this is needed).
- Fastlane will download the needed certs, build the app, upload it to Apple, wait for it to "process", and then automatically release it to just employees.
- Although we have a circleci config for fastlane, it doesn't work right now.

## Android

- Make sure you have the minimum JDK and Android SDK versions given at the Android setup link earlier in this readme.
- Find our Android release credentials in the `android-release` folder of our credential store and follow the readme there to install them.
- Run `./tools/build-android-prod.sh`
- Output apk lives under `android/app/build/outputs/apk/release`
