# Set up

- Follow the [dependencies and development environment setup instructions](https://facebook.github.io/react-native/docs/getting-started) in the React Native documentation for your host platform (stop right before "Creating a new application").
- Run `npm i` in this directory

# Running

## iOS

- `npx react-native start` to start the packager
- Run Debug target on Simulator or device to automatically load dev bundle from the packager

## Android

- `npx react-native run-android`

Once you have the app running, shake the device to open the React Native developer menu and select 'Enable Live Reload'. Then, you should be able to modify any of the files under 'js/' and save to trigger a reload of the app that picks up your changes!

# Releases

- Open `../base/main.lua` and set `SCENE_CREATOR_API_VERSION` to something other than `dev`, corresponding to the lua release channel you'd like this build to use.
- Publish `scene-creator` to the release channel chosen for this build.

## iOS

- Make sure `fastlane` is up to date: `bundle update fastlane` from this directory.
- Run `./tools/upload-beta-build.sh` to upload a build to testflight. (You will need some credentials from our password store.)
- Although we have a circleci config for fastlane, it doesn't work right now.

## Android

- Make sure you have the minimum JDK and Android SDK versions given at the Android setup link earlier in this readme.
- Find our Android release credentials in the `android-release` folder of our credential store and follow the readme there to install them.
- From this directory, run `npx react-native run-android --variant=release`
- Output apk lives under `android/app/build/outputs/apk/release`