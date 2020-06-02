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
        productName: "ScriptGuru Tools",
        copyright: "Copyright © 2020 ScriptGuru",
        win: {
          target: [
            {
              target: "zip",
              arch: ["x64", "ia32"],
            },
          ],
        },
        nsis: {
          oneClick: false,
          perMachine: true,
          allowToChangeInstallationDirectory: true,
        },
      },
    },
  },
};
