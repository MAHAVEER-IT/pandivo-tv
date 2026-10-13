const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block any duplicate react-native instance inside node_modules
config.resolver.blockList = [
  /.*[/\\]node_modules[/\\].*[/\\]node_modules[/\\]react-native[/\\].*/,
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};

module.exports = config;
