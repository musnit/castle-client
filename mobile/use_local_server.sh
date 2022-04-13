#!/usr/bin/env bash

LOCAL_IP=`ifconfig | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}'`
API_HOST="http:\/\/$LOCAL_IP:1380"

sed -i '' "s/https\:\/\/api.castle.xyz/$API_HOST/g" apollo.config.js
sed -i '' "s/https\:\/\/api.castle.xyz/$API_HOST/g" android/app/src/main/java/xyz/castle/api/API.java
sed -i '' "s/https\:\/\/api.castle.xyz/$API_HOST/g" ios/API_ios.mm
sed -i '' "s/https\:\/\/api.castle.xyz/$API_HOST/g" js/Session.js
