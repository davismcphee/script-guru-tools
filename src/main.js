import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import store from "./store";
import router from "./router";
import VButtonGroup from "./components/VButtonGroup";

Vue.config.productionTip = false;

Vue.component("v-btn-group", VButtonGroup);

new Vue({
  vuetify,
  store,
  router,
  render: (h) => h(App),
}).$mount("#app");
