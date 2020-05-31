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
              <v-btn v-on="on" icon @click="selectFppFile">
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
          placeholder="Search for files"
          outlined
          dense
          @keyup="filterTreeView"
        >
          <v-icon slot="append">mdi-magnify</v-icon>
        </v-text-field>
      </v-col>
      <v-col>
        <v-btn color="primary" @click="exportFpp">
          <v-icon left>mdi-content-save</v-icon>
          Save FPP
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-if="gameFolder">
      <v-col>
        <v-treeview
          v-model="selectedIds"
          :items="treeView"
          :open.sync="openIds"
          :active.sync="activeIds"
          :search="filter"
          :filter="filterFunction"
          selectable
          selection-type="independent"
          dense
          open-on-click
          multiple-active
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
import { createFileTree } from "../models/file-tree";
const { dialog } = require("electron").remote;
const path = require("path");
const glob = require("glob");
const fs = require("fs");
const util = require("util");
const readFileAsync = util.promisify(fs.readFile);

const fileTypeIconMap = {
  audio: "mdi-file-music",
  image: "mdi-file-image",
  text: "mdi-file-document",
  video: "mdi-file-video",
};

const addFilesHeader = "[standalone add files]";
const deleteFilesHeader = "[standalone delete files]";

export default {
  name: "FppManager",
  data() {
    return {
      gameFolder: "",
      gameFiles: [],
      existingFpp: "",
      existingFppPaths: { adds: [], deletes: [] },
      treeView: [],
      filter: "",
      filterTimeout: 0,
      selectedIds: [],
      openIds: [],
      activeIds: [],
      triggerSearch: false,
    };
  },
  mounted() {
    this.initialize();
  },
  methods: {
    async initialize() {
      this.tree = await createFileTree(
        path.resolve(this.$store.state.userdata.installationPath, "Files"),
        { caseSensitive: false }
      );

      this.treeView = this.tree.render();

      this.openIds = [this.treeView[0].id];

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
          this.openIds = [this.treeView[0].id];
          this.activeIds = [];
          this.filter = "";

          return;
        }

        this.triggerSearch = true;
        this.filter = filter;

        this.$nextTick(() => {
          this.triggerSearch = false;
        });
      }, 500);
    },
    updateDefaultSelectedIds() {
      this.selectedIds = [];

      this.gameFiles.forEach((currentPath) => {
        let node = this.tree.getNodeByPath(currentPath);

        if (!node) {
          const fileName = currentPath.substring(
            currentPath.lastIndexOf("/") + 1
          );

          const filePath = currentPath.substring(
            0,
            currentPath.length - fileName.length - 1
          );

          node = this.tree.getNodeByPath(
            [filePath, fileName.replace(/^_e_/, "")].join("/")
          );
        }

        if (
          node &&
          node.type !== "folder" &&
          !this.selectedIds.includes(node.id)
        ) {
          this.selectedIds.push(node.id);
        }
      });

      const { adds, deletes } = this.existingFppPaths;

      adds.forEach((currentPath) => {
        const node = this.tree.getNodeByPath(currentPath);

        if (node && !this.selectedIds.includes(node.id)) {
          this.selectedIds.push(node.id);
        }
      });

      deletes.forEach((currentPath) => {
        const node = this.tree.getNodeByPath(currentPath);

        if (node && this.selectedIds.includes(node.id)) {
          this.selectedIds.splice(this.selectedIds.indexOf(node.id), 1);
        }
      });
    },
    selectGameFolder() {
      dialog.showOpenDialog(
        {
          properties: ["openDirectory"],
        },
        (files) => {
          if (!files.length) {
            return;
          }

          this.gameFolder = files[0];

          glob(path.join(this.gameFolder, "Files/**/*"), (_, paths) => {
            this.gameFiles = paths.map((p) =>
              p.substring(this.gameFolder.length + 1)
            );

            this.updateDefaultSelectedIds();
          });
        }
      );
    },
    selectFppFile() {
      dialog.showOpenDialog(
        {
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

          this.existingFppPaths = (await readFileAsync(files[0], "utf8"))
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .reduce(
              ({ state, adds, deletes }, line) => {
                if (line === addFilesHeader) {
                  state = "add";
                } else if (line === deleteFilesHeader) {
                  state = "delete";
                } else if (state === "add") {
                  adds.push(
                    `Files/${line
                      .replace(/\\/g, "/")
                      .replace(/(^[\\//]|[\\//]$)/g, "")}`
                  );
                } else if (state === "delete") {
                  deletes.push(
                    `Files/${line
                      .replace(/\\/g, "/")
                      .replace(/(^[\\//]|[\\//]$)/g, "")}`
                  );
                }

                return { state, adds, deletes };
              },
              { state: "none", adds: [], deletes: [] }
            );

          this.updateDefaultSelectedIds();
        }
      );
    },
    filterFunction(item, search) {
      const matches =
        item.name.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) > -1;

      if (this.triggerSearch && matches) {
        let currentParent = item.parent;

        while (currentParent && !this.openIds.includes(currentParent.id)) {
          this.openIds.push(currentParent.id);
          currentParent = currentParent.parent;
        }

        if (!this.activeIds.includes(item.id)) {
          this.activeIds.push(item.id);
        }
      }

      return matches;
    },
    searchFileTree(e) {
      clearTimeout(this.filterTimeout);

      const filter = e.target.value || "";

      this.filterTimeout = setTimeout(() => {
        if (!filter.trim()) {
          this.openIds = [this.treeView[0].id];
          this.activeIds = [];
          this.filter = "";

          return;
        }

        this.triggerSearch = true;
        this.filter = filter;

        this.$nextTick(() => {
          this.triggerSearch = false;
        });
      }, 500);
    },
    exportFpp() {
      // eslint-disable-next-line no-unused-vars
      const getSelectedIds = (tree) =>
        tree
          .map((node) => {
            if (this.selectedIds.includes(node.id)) {
              return [node.id];
            }

            return [...getSelectedIds(node.children)];
          })
          .flat();

      // eslint-disable-next-line no-unused-vars
      const test = getSelectedIds(this.tree.render());
    },
  },
  watch: {
    "$store.state.userdata.installationPath": function onInstallationPathChange() {
      this.initialize();
    },
  },
};
</script>
