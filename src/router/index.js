import Vue from "vue";
import VueRouter from "vue-router";
import Settings from "../views/Settings";
import FppManager from "../views/FppManager";
import BatchModelConverter from "../views/BatchModelConverter";

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
  {
    path: "/batch-model-converter",
    name: "Batch Model Converter",
    component: BatchModelConverter,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
