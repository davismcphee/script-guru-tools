<template>
  <div>
    <v-row>
      <v-col>
        <h1 class="display-1">Settings</h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col md="8" lg="6">
        <v-alert v-if="invalidPath === true" type="error">
          It looks like your GameGuru path is invalid
        </v-alert>

        <v-alert v-else-if="invalidPath === false" type="success">
          Your GameGuru path is valid
        </v-alert>

        <v-alert
          v-else-if="!$store.state.userdata.installationPath"
          type="warning"
        >
          You'll need to add a GameGuru path before you can use any of the tools
        </v-alert>

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

        <ModelObj src="/assets/IronMan.obj"></ModelObj>
      </v-col>
    </v-row>
  </div>
</template>

<script>
const { dialog } = require("electron").remote;
import * as path from "path";
import { isFile, isDirectory } from "../filesystem/fs";
import { ModelObj } from "vue-3d-model";

export default {
  name: "Settings",
  components: {
    ModelObj,
  },
  data() {
    return {
      invalidPath: null,
    };
  },
  mounted() {
    this.checkInstallationPath();
  },
  methods: {
    async checkInstallationPath() {
      const installationPath = this.$store.state.userdata.installationPath;

      if (!installationPath) {
        return;
      }

      this.invalidPath =
        !(await isFile(path.join(installationPath, "GameGuru.exe"))) ||
        !(await isDirectory(path.join(installationPath, "Files")));
    },
    selectInstallationPath() {
      dialog.showOpenDialog(
        {
          properties: ["openDirectory"],
        },
        async (directories) => {
          if (directories.length) {
            this.$store.commit("setInstallationPath", {
              installationPath: directories[0],
            });
          }

          this.checkInstallationPath();
        }
      );
    },
  },
};
</script>
