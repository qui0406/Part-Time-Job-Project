const {getDefaultConfig} = require('expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts.push('cjs')// Add 'ttf' to the list of asset extensions 
defaultConfig.resolver.unstable_enablePackageExports= false; // Disable package exports

module.exports = defaultConfig;