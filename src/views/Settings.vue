<template>
  <div>
    <h1>Settings</h1>
    <v-row>
      <v-col md="8" lg="6">
        <v-text-field
          v-model="installationPath"
          label="GameGuru Installation Path"
          @input="onInstallationPathChange"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: "Settings",
  components: {},
  data() {
    return {
      installationPath: "",
    };
  },
  methods: {
    onInstallationPathChange() {
      this.$store.commit("setInstallationPath", {
        installationPath: this.installationPath,
      });
    },
  },
  mounted() {
    this.installationPath = this.$store.state.userdata.installationPath;
  },
};
</script>
