const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Добавляем резолвер для решения проблем с путями
config.resolver = {
  ...config.resolver,
  alias: {
    '@': __dirname,
  },
  platforms: ['ios', 'android', 'native', 'web'],
};

// Отключаем предупреждения в Metro
config.reporter = {
  ...config.reporter,
  update: () => {},
};

module.exports = config; 