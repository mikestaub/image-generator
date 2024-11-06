module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: require.resolve("path-browserify"),
    stream: require.resolve("stream-browserify"),
    buffer: require.resolve("buffer"),
  };

  return config;
};
