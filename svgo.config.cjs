module.exports = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          removeHiddenElems: false,
          removeEmptyContainers: false
        },
      },
    },
  ],
};
