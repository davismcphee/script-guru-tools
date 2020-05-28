<template>
  <div>
    <h1>FPP Manager</h1>
    <v-row>
      <v-col>
        <v-text-field
          v-model="filter"
          placeholder="Search for files"
          outlined
          @keyup="filterTreeView"
        />
        <v-treeview
          :items="filteredTreeView"
          :open="openIds"
          dense
          selectable
          open-on-click
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
      treeView: [],
      filter: "",
      filterTimeout: 0,
      openIds: [],
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

        [this.openIds, this.filteredTree] = searchTree(
          this.treeView,
          this.filter
        );
      }, 500);
    },
  },
  watch: {
    "$store.state.userdata.installationPath": function onInstallationPathChange() {
      this.initialize();
    },
  },
};
</script>
