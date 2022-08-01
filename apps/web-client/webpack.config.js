module.exports = (config) => {
  config.resolve.fallback = {
    assert: false,
  };

  return config;
};
