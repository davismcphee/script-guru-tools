import Vue from "vue";
import Vuex from "vuex";
import { getUserData, setUserData } from "../storage/userdata";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    userdata: {
      installationPath: getUserData("installationPath") || "",
    },
  },
  getters: {},
  actions: {},
  mutations: {
    setInstallationPath({ userdata }, { installationPath }) {
      setUserData("installationPath", String(installationPath) || "");
      userdata.installationPath = String(installationPath) || "";
    },
  },
});
