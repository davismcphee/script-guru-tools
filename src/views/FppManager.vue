<template>
  <div>
    <v-row>
      <v-col>
        <h1 class="display-1">FPP Manager</h1>
      </v-col>
    </v-row>
    <v-row align="end">
      <v-col cols="12" md="6" lg="5" xl="4">
        <v-text-field
          :value="gameFolder"
          label="Your game folder"
          placeholder=" "
          readonly
          outlined
          dense
          hide-details
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
      <v-col cols="12" md="6" lg="5" xl="4">
        <v-text-field
          :value="existingFpp"
          label="Existing FPP file"
          placeholder=" "
          readonly
          outlined
          dense
          hide-details
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
      <v-col cols="12" lg="10" xl="8">
        <v-text-field
          v-model="filter"
          placeholder="Search for files"
          outlined
          dense
          hide-details
          @keyup="filterTreeView"
        >
          <v-icon slot="append">mdi-magnify</v-icon>
        </v-text-field>
      </v-col>
    </v-row>
    <v-row v-if="gameFolder">
      <v-col class="d-flex align-center">
        <v-btn-toggle v-model="viewMode" mandatory dense borderless>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn v-on="on" @click="filterTree">
                <v-icon color="primary"
                  >mdi-checkbox-multiple-blank-outline</v-icon
                >
              </v-btn>
            </template>
            Show All
          </v-tooltip>

          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn v-on="on" @click="filterTree">
                <v-icon color="primary">mdi-checkbox-blank-outline</v-icon>
              </v-btn>
            </template>
            Show Unselected
          </v-tooltip>

          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn v-on="on" @click="filterTree">
                <v-icon color="primary">mdi-check-box-outline</v-icon>
              </v-btn>
            </template>
            Show Selected
          </v-tooltip>
        </v-btn-toggle>

        <v-btn-group class="ml-5" dense borderless>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn @click="undoOrRedo(false)" :elevation="0">
                <v-icon color="primary" v-on="on">mdi-undo</v-icon>
              </v-btn>
            </template>
            Undo
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn @click="undoOrRedo(true)" :elevation="0">
                <v-icon color="primary" v-on="on">mdi-redo</v-icon>
              </v-btn>
            </template>
            Redo
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn @click="$refs.tree.updateAll(false)" :elevation="0">
                <v-icon color="primary" v-on="on">mdi-collapse-all</v-icon>
              </v-btn>
            </template>
            Collapse All
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn @click="exportFpp" :elevation="0">
                <v-icon color="primary" v-on="on">mdi-content-save</v-icon>
              </v-btn>
            </template>
            Save FPP File
          </v-tooltip>
        </v-btn-group>
      </v-col>
    </v-row>
    <v-row v-if="gameFolder">
      <v-col>
        <v-treeview
          ref="tree"
          :items="filteredTreeViewWithViewMode"
          :open.sync="openIds"
          :active.sync="activeIds"
          dense
          open-on-click
          multiple-active
        >
          <template #label="{ item, open }">
            <div class="d-flex align-center">
              <v-checkbox
                v-model="tree.getNodeById(item.id).selected"
                :disabled="tree.getNodeById(item.id).disabled"
                class="mt-0 pt-0"
                hide-details
                :ripple="false"
                @click.stop="pushState"
              />

              <v-icon v-if="item.type === 'folder'" class="mr-2">
                {{ open ? "mdi-folder-open" : "mdi-folder" }}
              </v-icon>
              <v-icon v-else class="mr-2">
                {{ getFileIcon(item) }}
              </v-icon>

              <span @contextmenu="deleteFolder(tree.getNodeById(item.id))">{{
                item.name
              }}</span>
            </div>
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
  setDefaultNodeValues,
  getExistingFppPaths,
  generateFppFile,
  filterTree,
  setDisabled,
  anyParentDeleted,
  filterSelected,
  getNodeValues,
  setNodeValues,
} from "../fpp-manager/helpers";
import { createUndoRedo } from "../state/undo-redo";

const fileTypeIconMap = {
  audio: "mdi-file-music",
  image: "mdi-file-image",
  text: "mdi-file-document",
  video: "mdi-file-video",
};

const fileExtensionIconMap = {
  fpe: "mdi-file-cog",
  pfb: "mdi-home-city",
  x: "mdi-cube-outline",
  dbo: "mdi-cube-outline",
  fbx: "mdi-cube-outline",
  cci: "mdi-arm-flex",
  dat: "mdi-file",
  cfg: "mdi-file",
  blob: "mdi-file",
  fx: "mdi-lightbulb-on",
  fnt: "mdi-format-font",
  exe: "mdi-application",
  dll: "mdi-file-code",
  ele: "mdi-file-cog",
  ent: "mdi-file-cog",
  obs: "mdi-file-cog",
  way: "mdi-file-cog",
  ter: "mdi-terrain",
  fpm: "mdi-map",
  fpp: "mdi-hand-pointing-up",
};

const viewModes = {
  all: 0,
  unselected: 1,
  selected: 2,
};

export default {
  name: "FppManager",
  data() {
    return {
      dirty: false,
      gameFolder: "",
      gameFiles: [],
      existingFpp: "",
      existingFppPaths: { adds: [], deletes: [] },
      filteredTreeView: [],
      filter: "",
      filterTimeout: 0,
      openIds: [],
      activeIds: [],
      viewMode: 0,
      undoRedo: createUndoRedo(50),
    };
  },
  computed: {
    filteredTreeViewWithViewMode() {
      return this.viewMode === viewModes.all
        ? this.filteredTreeView
        : filterSelected(
            this.filteredTreeView,
            this.viewMode === viewModes.selected
          );
    },
  },
  mounted() {
    window.addEventListener("beforeunload", this.handleWindowClose);
  },
  beforeDestroy() {
    window.removeEventListener("beforeunload", this.handleWindowClose);
  },
  methods: {
    preventClose() {
      return dialog.showMessageBoxSync({
        type: "question",
        buttons: ["Leave", "Keep Working"],
        defaultId: 0,
        title: "Unsaved Changes",
        message: "You have unsaved changes. Are you sure you want to leave?",
      });
    },
    handleWindowClose(event) {
      if (!this.dirty) {
        return;
      }

      if (this.preventClose()) {
        event.preventDefault();
        event.returnValue = "";
      }
    },
    pushState() {
      setTimeout(() => {
        const selectedIds = getNodeValues(
          this.tree.render(),
          (values, node) => {
            if (node.selected) {
              values.push(node.id);
            }
          }
        );

        const deletedIds = getNodeValues(this.tree.render(), (values, node) => {
          if (node.deleted) {
            values.push(node.id);
          }
        });

        this.undoRedo.save({
          selectedIds,
          deletedIds,
          openIds: this.openIds,
          activeIds: this.activeIds,
          viewMode: this.viewMode,
          filter: this.filter,
        });
      });

      this.dirty = true;
    },
    undoOrRedo(redo) {
      const state = redo ? this.undoRedo.redo() : this.undoRedo.undo();

      if (!state) {
        return;
      }

      setNodeValues(this.tree.render(), (node) => {
        node.selected = state.selectedIds.includes(node.id);

        const deleted = state.deletedIds.includes(node.id);

        if (node.deleted !== deleted) {
          this.deleteFolder(node, false);
        }
      });

      this.filter = state.filter;

      this.filterTree();

      this.openIds = state.openIds;
      this.activeIds = state.activeIds;
      this.viewMode = state.viewMode;
    },
    deleteFolder(node, pushState = true) {
      if (node.type !== "folder" || anyParentDeleted(node.parent)) {
        return;
      }

      node.deleted = !node.deleted;
      node.disabled = node.deleted;

      setDisabled(node.children, node.deleted);

      if (pushState) {
        this.pushState();
      }
    },
    getFileIcon(item) {
      return (
        fileExtensionIconMap[item.extname] ||
        fileTypeIconMap[item.type] ||
        "mdi-file-question"
      );
    },
    filterTree() {
      const filter = this.filter || "";
      const treeView = this.tree.render();

      if (!filter.trim()) {
        this.filteredTreeView = treeView;
        this.openIds = [treeView[0].id];
        this.activeIds = [];

        return;
      }

      [this.openIds, this.activeIds, this.filteredTreeView] = filterTree(
        treeView,
        filter
      );
    },
    filterTreeView() {
      clearTimeout(this.filterTimeout);

      this.filterTimeout = setTimeout(() => this.filterTree(), 500);
    },
    updateDefaultNodeValues() {
      setDefaultNodeValues(this.tree, this.gameFiles, this.existingFppPaths);
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

          this.tree = await createFileTree(
            path.resolve(this.$store.state.userdata.installationPath, "Files"),
            { caseSensitive: false }
          );

          const treeView = this.tree.render();

          this.filteredTreeView = treeView;
          this.openIds = [treeView[0].id];
          this.activeIds = [];
          this.filter = "";
          this.gameFolder = files[0];

          const paths = await glob(path.join(this.gameFolder, "Files/**/*"));

          this.gameFiles = paths.map((p) =>
            p.substring(this.gameFolder.length + 1)
          );

          this.undoRedo.clear();
          this.updateDefaultNodeValues();
          this.pushState();
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

          this.undoRedo.clear();
          this.updateDefaultNodeValues();
          this.pushState();
        }
      );
    },
    async exportFpp() {
      const fppFile = generateFppFile(this.tree, this.gameFiles);

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

      this.dirty = false;
    },
  },
  beforeRouteLeave(_, __, next) {
    if (this.dirty && this.preventClose()) {
      next(false);
    } else {
      next();
    }
  },
};
</script>
