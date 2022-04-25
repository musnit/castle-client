#!/usr/bin/env bash

API_HOST="https:\/\/castle-app-server-staging.herokuapp.com"

sed -i '' "s/https\:\/\/api.castle.xyz/$API_HOST/g" apollo.config.js
sed -i '' "s/https\:\/\/api.castle.xyz/$API_HOST/g" android/app/src/main/java/xyz/castle/api/API.java
sed -i '' "s/https\:\/\/api.castle.xyz/$API_HOST/g" ios/API_ios.mm
sed -i '' "s/https\:\/\/api.castle.xyz/$API_HOST/g" js/Session.js
