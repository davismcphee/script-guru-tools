<template>
  <v-app id="app">
    <v-navigation-drawer v-model="drawer" app clipped>
      <v-list dense>
        <v-list-item link to="/">
          <v-list-item-action>
            <v-icon color="primary">mdi-cog-outline</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title class="primary--text"
              >Settings</v-list-item-title
            >
          </v-list-item-content>
        </v-list-item>
        <v-list-item
          link
          to="/fpp-manager"
          :disabled="!Boolean($store.state.userdata.installationPath)"
        >
          <v-list-item-action>
            <v-icon color="primary">mdi-format-paint</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title class="primary--text"
              >FPP Manager</v-list-item-title
            >
          </v-list-item-content>
        </v-list-item>
        <v-list-item
          link
          to="/batch-model-converter"
          :disabled="!Boolean($store.state.userdata.installationPath)"
        >
          <v-list-item-action>
            <v-icon color="primary">mdi-cube</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title class="primary--text"
              >Batch Model Converter</v-list-item-title
            >
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar id="main-app-bar" app clipped-left color="white" elevation="0">
      <v-app-bar-nav-icon
        class="primary--text"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>
      <v-toolbar-title class="display-1 font-weight-bold primary--text"
        >ScriptGuru Tools</v-toolbar-title
      >
    </v-app-bar>

    <v-content>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
export default {
  data: () => ({
    drawer: null,
  }),
};
</script>

<style scoped>
#main-app-bar {
  border-bottom: 1px solid var(--v-secondary-lighten5) !important;
}
</style>
