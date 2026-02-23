module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      ["nativewind/babel", { mode: "transformOnly" }]
    ],
    plugins: [
      "react-native-reanimated/plugin" // This should be last in the plugins array
    ],
  };
};