<template>
  <div>
    <v-row>
      <v-col>
        <h1 class="display-1">FPP Manager</h1>
      </v-col>
    </v-row>
    <v-row align="end">
      <v-col cols="12" md="6" lg="4">
        <v-text-field
          :value="gameFolder"
          label="Your game folder"
          placeholder=" "
          readonly
          outlined
          dense
        >
          <v-tooltip slot="append" bottom>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" icon @click="selectGameFolder">
                <v-icon>mdi-folder</v-icon>
              </v-btn>
            </template>
            <span>Select game folder</span>
          </v-tooltip>
        </v-text-field>
      </v-col>
      <v-col cols="12" md="6" lg="4">
        <v-text-field
          :value="existingFpp"
          label="Existing FPP file"
          placeholder=" "
          readonly
          outlined
          dense
        >
          <v-tooltip slot="append" bottom>
            <template v-slot:activator="{ on }">
              <v-btn
                v-on="on"
                icon
                @click="selectFppFile"
                :disabled="!gameFolder"
              >
                <v-icon>mdi-file</v-icon>
              </v-btn>
            </template>
            <span>Select existing FPP file</span>
          </v-tooltip>
        </v-text-field>
      </v-col>
    </v-row>
    <v-row v-if="gameFolder">
      <v-col cols="12" md="6" lg="4">
        <v-text-field
          v-model="filter"
          placeholder="Search for files"
          outlined
          dense
          @keyup="filterTreeView"
        >
          <v-icon slot="append">mdi-magnify</v-icon>
        </v-text-field>
      </v-col>
      <v-col>
        <v-btn color="primary" rounded @click="exportFpp">
          <v-icon left>mdi-content-save</v-icon>
          Save FPP
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-if="gameFolder">
      <v-col>
        <v-treeview
          ref="tree"
          :value="filteredSelectedIds"
          :items="filteredTreeView"
          :open.sync="openIds"
          :active.sync="activeIds"
          selected-color="primary"
          selectable
          selection-type="independent"
          dense
          open-on-click
          multiple-active
          @input="onInput"
        >
          <template #prepend="{ item, open }">
            <v-icon v-if="item.type === 'folder'">
              {{ open ? "mdi-folder-open" : "mdi-folder" }}
            </v-icon>
            <v-icon v-else>
              {{ getFileIcon(item.type) }}
            </v-icon>
          </template>
        </v-treeview>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { createFileTree } from "../fpp-manager/file-tree";
const { dialog, BrowserWindow } = require("electron").remote;
import * as path from "path";
import { glob } from "../filesystem/glob";
import { writeFile } from "../filesystem/fs";
import {
  getDefaultSelectedIds,
  getExistingFppPaths,
  generateFppFile,
  filterTree,
  getSelectedIds,
} from "../fpp-manager/helpers";

const fileTypeIconMap = {
  audio: "mdi-file-music",
  image: "mdi-file-image",
  text: "mdi-file-document",
  video: "mdi-file-video",
};

export default {
  name: "FppManager",
  data() {
    return {
      gameFolder: "",
      gameFiles: [],
      existingFpp: "",
      existingFppPaths: { adds: [], deletes: [] },
      treeView: [],
      filteredTreeView: [],
      filter: "",
      filterTimeout: 0,
      selectedIds: [],
      filteredSelectedIds: [],
      openIds: [],
      activeIds: [],
      ignoreOnInput: false,
    };
  },
  methods: {
    async initialize() {
      this.tree = await createFileTree(
        path.resolve(this.$store.state.userdata.installationPath, "Files"),
        { caseSensitive: false }
      );

      this.treeView = this.tree.render();
      this.filteredTreeView = this.treeView;
      this.openIds = [this.treeView[0].id];
      this.activeIds = [];
      this.filter = "";

      this.updateDefaultSelectedIds();
    },
    getFileIcon(type) {
      return fileTypeIconMap[type] || "mdi-file";
    },
    filterTreeView(e) {
      clearTimeout(this.filterTimeout);

      const filter = e.target.value || "";

      this.filterTimeout = setTimeout(() => {
        if (!filter.trim()) {
          this.ignoreOnInput = true;
          this.filteredTreeView = this.treeView;
          this.filteredSelectedIds = [...this.selectedIds];
          this.openIds = [this.treeView[0].id];
          this.activeIds = [];

          return;
        }

        [this.openIds, this.activeIds, this.filteredTreeView] = filterTree(
          this.treeView,
          filter
        );

        this.filteredSelectedIds = getSelectedIds(
          this.filteredTreeView,
          this.selectedIds
        );

        this.ignoreOnInput = true;
      }, 500);
    },
    onInput(currentSelectedIds) {
      if (this.ignoreOnInput) {
        this.ignoreOnInput = false;

        return;
      }

      if (this.filteredSelectedIds.length < currentSelectedIds.length) {
        const addedId = currentSelectedIds.filter(
          (id) => !this.filteredSelectedIds.includes(id)
        )[0];

        this.selectedIds.push(addedId);
      } else if (this.filteredSelectedIds.length > currentSelectedIds.length) {
        const removedId = this.filteredSelectedIds.filter(
          (id) => !currentSelectedIds.includes(id)
        )[0];

        this.selectedIds = this.selectedIds.filter((id) => id !== removedId);
      }

      this.filteredSelectedIds = currentSelectedIds;

      this.$nextTick(() =>
        Object.values(this.$refs.tree.nodes).forEach((node) => {
          if (node.isIndeterminate) {
            node.isIndeterminate = false;

            if (node.vnode) {
              node.vnode.isIndeterminate = false;
            }
          }
        })
      );
    },
    updateDefaultSelectedIds() {
      this.selectedIds = getDefaultSelectedIds(
        this.tree,
        this.gameFiles,
        this.existingFppPaths
      );

      this.filteredSelectedIds = this.selectedIds;
    },
    selectGameFolder() {
      dialog.showOpenDialog(
        BrowserWindow.getFocusedWindow(),
        {
          properties: ["openDirectory"],
        },
        async (files) => {
          if (!files.length) {
            return;
          }

          await this.initialize();

          this.gameFolder = files[0];

          const paths = await glob(path.join(this.gameFolder, "Files/**/*"));

          this.gameFiles = paths.map((p) =>
            p.substring(this.gameFolder.length + 1)
          );

          this.updateDefaultSelectedIds();
        }
      );
    },
    selectFppFile() {
      dialog.showOpenDialog(
        BrowserWindow.getFocusedWindow(),
        {
          title: "Select FPP File",
          properties: ["openFile"],
          filters: [
            {
              name: "FPP File",
              extensions: ["fpp"],
            },
          ],
        },
        async (files) => {
          if (!files.length) {
            return;
          }

          this.existingFpp = files[0];
          this.existingFppPaths = await getExistingFppPaths(this.existingFpp);

          this.updateDefaultSelectedIds();
        }
      );
    },
    async exportFpp() {
      const fppFile = generateFppFile(
        this.tree,
        this.gameFiles,
        this.selectedIds
      );

      const saveResult = await dialog.showSaveDialog(
        BrowserWindow.getFocusedWindow(),
        {
          title: "Save FPP File",
          filters: [
            {
              name: "FPP File",
              extensions: ["fpp"],
            },
          ],
        }
      );

      if (saveResult.canceled || !saveResult.filePath?.trim()) {
        return;
      }

      await writeFile(saveResult.filePath, fppFile);
    },
  },
};
</script>
