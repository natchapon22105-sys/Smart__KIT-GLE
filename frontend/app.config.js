module.exports = ({ config }) => {
  const plugins = config.plugins ?? [];
  const buildProperties =
    process.env.ALLOW_HTTP_BACKEND === 'true'
      ? [['expo-build-properties', { android: { usesCleartextTraffic: true } }]]
      : [];

  return {
    ...config,
    plugins: [...plugins, ...buildProperties],
  };
};
