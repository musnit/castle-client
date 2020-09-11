module.exports = {
  plugins: [
    ["module:react-native-dotenv", {
      allowUndefined: false,
    }],
  ],
  presets: ['module:metro-react-native-babel-preset'],
};
