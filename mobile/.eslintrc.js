module.exports = {
  root: true,
  extends: '@react-native-community',
  rules: {
    "curly": 0,
    "quotes": 0, // let prettier manage
    "no-shadow": "off",
    "react-hooks/rules-of-hooks": "warn",
    "react-hooks/exhaustive-deps": "warn",
    "react-native/no-inline-styles": 0,
  },
};
