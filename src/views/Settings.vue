<template>
  <div>
    <v-row>
      <v-col>
        <h1>Settings</h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col md="8" lg="6">
        <v-text-field
          :value="$store.state.userdata.installationPath"
          label="Your GameGuru installation path"
          readonly
          outlined
          dense
        >
          <v-tooltip slot="append" bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" icon @click="selectInstallationPath">
                <v-icon>mdi-folder</v-icon>
              </v-btn>
            </template>
            <span>Select installation path</span>
          </v-tooltip>
        </v-text-field>
      </v-col>
    </v-row>
  </div>
</template>

<script>
const { dialog } = require("electron").remote;

export default {
  name: "Settings",
  components: {},
  methods: {
    selectInstallationPath() {
      dialog.showOpenDialog(
        {
          properties: ["openDirectory"],
        },
        (files) => {
          if (files.length) {
            this.$store.commit("setInstallationPath", {
              installationPath: files[0],
            });
          }
        }
      );
    },
  },
};
</script>
