<template>
  <div>
    <h1>FPP Manager</h1>
    {{ selectedIds }}
    <!-- {{ openIds }}
    {{ activeIds }} -->
    <v-row align="end">
      <v-col cols="12" md="6" lg="4">
        <v-text-field
          :value="gameFolder"
          label="Your game folder"
          placeholder=" "
          readonly
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
      <v-col v-if="gameFolder" cols="12" md="6" lg="4">
        <v-text-field
          v-model="filter"
          placeholder="Search for files"
          @keyup="filterTreeView"
        >
          <v-icon slot="append">mdi-magnify</v-icon>
        </v-text-field>
      </v-col>
    </v-row>
    <v-row v-if="gameFolder">
      <v-col>
        <v-treeview
          v-model="selectedIds"
          :items="filteredTreeView"
          :open.sync="openIds"
          :active.sync="activeIds"
          select-type="individual"
          selectable
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
import { createFileTree, searchTree } from "../helpers/tree-helpers";
const { dialog } = require("electron").remote;

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
      treeView: [],
      filter: "",
      filterTimeout: 0,
      selectedIds: [],
      openIds: [],
      activeIds: [],
      filteredTree: [],
    };
  },
  computed: {
    filteredTreeView() {
      if (
        !this.openIds.length ||
        (this.openIds.length === 1 && this.openIds[0] === this.treeView[0].id)
      ) {
        return this.treeView;
      }

      return this.filteredTree;
    },
  },
  mounted() {
    this.initialize();
  },
  methods: {
    async initialize() {
      this.treeView = await createFileTree(
        this.$store.state.userdata.installationPath,
        "Files",
        () => this.treeView[0]
      );

      this.openIds = [this.treeView[0].id];
    },
    getFileIcon(type) {
      return fileTypeIconMap[type] || "mdi-file";
    },
    filterTreeView() {
      clearTimeout(this.filterTimeout);

      this.filterTimeout = setTimeout(() => {
        if (!this.filter?.trim()) {
          this.openIds = [this.treeView[0].id];
          this.filteredTree = [];

          return;
        }

        [this.openIds, this.activeIds, this.filteredTree] = searchTree(
          this.treeView,
          this.filter
        );
      }, 500);
    },
    selectGameFolder() {
      dialog.showOpenDialog(
        {
          properties: ["openDirectory"],
        },
        (files) => {
          if (files.length) {
            this.gameFolder = files[0];
          }
        }
      );
    },
  },
  watch: {
    "$store.state.userdata.installationPath": function onInstallationPathChange() {
      this.initialize();
    },
  },
};
</script>
