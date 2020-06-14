module.exports = {
  transpileDependencies: ["vuetify"],
  chainWebpack: (config) => {
    config.plugin("html").tap((args) => {
      args[0].title = "ScriptGuru Tools";
      return args;
    });
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: "com.scriptguru.tools",
        productName: "ScriptGuru Tools",
        copyright: "Copyright © 2020 Davis McPhee",
        files: ["**/*"],
        extraFiles: [
          {
            from: "external",
            to: "external",
            filter: ["**/*"],
          },
        ],
        nsis: {
          perMachine: true,
        },
      },
    },
  },
};
