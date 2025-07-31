const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Отключаем предупреждения в Metro
config.reporter = {
  ...config.reporter,
  update: () => {},
};

module.exports = config; 