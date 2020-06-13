<template>
  <div>
    <v-row>
      <v-col>
        <h1 class="display-1">Batch Model Converter</h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          :value="inputFolder"
          label="Input models folder"
          readonly
          outlined
          dense
          hide-details
        >
          <v-tooltip slot="append" bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" icon @click="selectInputFolder">
                <v-icon>mdi-folder</v-icon>
              </v-btn>
            </template>
            <span>Select input folder</span>
          </v-tooltip>
        </v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          :value="outputFolder"
          label="Output models folder"
          readonly
          outlined
          dense
          hide-details
        >
          <v-tooltip slot="append" bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" icon @click="selectOutputFolder">
                <v-icon>mdi-folder</v-icon>
              </v-btn>
            </template>
            <span>Select installation path</span>
          </v-tooltip>
        </v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="6">
        <v-select
          v-model="outputFormat"
          :items="outputItems"
          label="Output model format"
          outlined
          dense
          hide-details
        />
      </v-col>
      <v-col>
        <v-btn
          color="primary"
          :loading="converting"
          :disabled="!inputFolder || !outputFolder"
          @click="convertModels"
        >
          <v-icon dark left>mdi-export</v-icon>Convert
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-if="converting">
      <v-col>
        <v-progress-linear :value="convertProgress"></v-progress-linear>
      </v-col>
    </v-row>
  </div>
</template>

<script>
const { dialog } = require("electron").remote;
import { glob } from "../filesystem/glob";
import { exec } from "../filesystem/exec";
import * as path from "path";

const inputExtensions = [
  ".3d",
  ".3ds",
  ".3mf",
  ".ac",
  ".ac3d",
  ".acc",
  ".amj",
  ".ase",
  ".ask",
  ".b3d",
  ".blend",
  ".bvh",
  ".cms",
  ".cob",
  ".dae",
  ".collada",
  ".dxf",
  ".enff",
  ".fbx",
  ".gltf",
  ".glb",
  ".hmb",
  ".irr",
  ".irrmesh",
  ".lwo",
  ".lws",
  ".lxo",
  ".m3d",
  ".md2",
  ".md3",
  ".md5",
  ".mdc",
  ".mdl",
  ".mesh",
  ".mot",
  ".ms3d",
  ".ndo",
  ".nff",
  ".obj",
  ".off",
  ".ogex",
  ".ply",
  ".pmx",
  ".prj",
  ".q3o",
  ".q3s",
  ".raw",
  ".scn",
  ".sib",
  ".smd",
  ".stp",
  ".stl",
  ".ter",
  ".uc",
  ".vta",
  ".x",
  ".x3d",
  ".xgl",
  ".zgl",
];

const selectFolder = () =>
  new Promise((resolve) => {
    dialog.showOpenDialog(
      {
        properties: ["openDirectory"],
      },
      (directories) => resolve(directories?.length ? directories[0] ?? "" : "")
    );
  });

export default {
  name: "BatchModelConverter",
  data() {
    return {
      inputFolder: "",
      outputFolder: "",
      outputFormat: ".X",
      outputItems: [".DAE", ".OBJ", ".PLY", ".STL", ".X", ".3DS"],
      converting: false,
      convertProgress: 0,
    };
  },
  methods: {
    async selectInputFolder() {
      const inputFolder = await selectFolder();

      if (!inputFolder) {
        return;
      }

      this.inputFolder = inputFolder;
    },
    async selectOutputFolder() {
      const outputFolder = await selectFolder();

      if (!outputFolder) {
        return;
      }

      this.outputFolder = outputFolder;
    },
    async convertModels() {
      try {
        if (this.converting) {
          return;
        }

        this.converting = true;

        const filePaths = await glob(path.join(this.inputFolder, "*.*"));
        const modelPaths = filePaths.filter((filePath) =>
          inputExtensions.some((ext) => filePath.toLowerCase().endsWith(ext))
        );

        for (const [index, modelPath] of modelPaths.entries()) {
          this.convertProgress = Math.floor(
            ((index + 1) / modelPaths.length) * 100
          );

          const modelName = modelPath.substring(
            modelPath.lastIndexOf("/") + 1,
            modelPath.lastIndexOf(".")
          );

          const outputPath = path.join(
            this.outputFolder,
            modelName + this.outputFormat.toLowerCase()
          );

          try {
            await exec(
              `${path.resolve(
                "src/external/assimp"
              )} export "${modelPath}" "${outputPath}"`
            );
          } catch (e) {
            this.$toast.error(`Error converting ${modelPath} to ${outputPath}`);
          }
        }

        this.$toast("Finished converting models");
      } catch (e) {
        this.$toast.error("Unable to convert models");
      } finally {
        this.converting = false;
        this.convertProgress = 0;
      }
    },
  },
};
</script>
