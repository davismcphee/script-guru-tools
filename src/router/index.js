import Vue from "vue";
import VueRouter from "vue-router";
import Settings from "../views/Settings.vue";
import FppManager from "../views/FppManager.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Settings",
    component: Settings,
  },
  {
    path: "/fpp-manager",
    name: "FPP Manager",
    component: FppManager,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
