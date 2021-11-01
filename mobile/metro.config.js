/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const blacklist = require('metro-config/src/defaults/exclusionList');

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    extraNodeModules: require('node-libs-react-native'),
    blacklistRE: blacklist([
      /.*\.idea\/.*/,
      /.*\.git\/.*/,
      /.*\/app\/build\/.*/,
    ]),
  },
};
