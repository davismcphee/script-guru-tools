import { readFile } from "../filesystem/fs";

const addFilesHeader = "[standalone add files]";
const deleteFilesHeader = "[standalone delete files]";

export const getExistingFppPaths = async (fppPath) =>
  (await readFile(fppPath, "utf8"))
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

const getNodeByPathOrAdjustedPath = (tree, currentPath) => {
  let node = tree.getNodeByPath(currentPath);

  if (!node) {
    const fileName = currentPath.substring(currentPath.lastIndexOf("/") + 1);

    const filePath = currentPath.substring(
      0,
      currentPath.length - fileName.length - 1
    );

    node = tree.getNodeByPath(
      [filePath, fileName.replace(/^_e_/, "")].join("/")
    );
  }

  return node;
};

export const getDefaultSelectedIds = (
  tree,
  gameFiles,
  { adds = [], deletes = [] }
) => {
  const selectedIds = [];

  gameFiles.forEach((currentPath) => {
    let node = getNodeByPathOrAdjustedPath(tree, currentPath);

    if (node && node.type !== "folder" && !selectedIds.includes(node.id)) {
      selectedIds.push(node.id);
    }
  });

  adds.forEach((currentPath) => {
    const node = tree.getNodeByPath(currentPath);

    if (node && !selectedIds.includes(node.id)) {
      selectedIds.push(node.id);
    }
  });

  deletes.forEach((currentPath) => {
    const node = tree.getNodeByPath(currentPath);

    if (node && selectedIds.includes(node.id)) {
      selectedIds.splice(selectedIds.indexOf(node.id), 1);
    }
  });

  return selectedIds;
};

const getAddedIds = (tree, gameFileIds, selectedIds) =>
  tree
    .map((node) => {
      if (selectedIds.includes(node.id) && !gameFileIds.includes(node.id)) {
        return [node.id];
      }

      return [...getAddedIds(node.children, gameFileIds, selectedIds)];
    })
    .flat();

const containsNodeOrParentId = (ids, node) => {
  return (
    node != null &&
    (ids.includes(node.id) || containsNodeOrParentId(ids, node.parent))
  );
};

export const generateFppFile = (tree, gameFiles, selectedIds) => {
  const gameFileIds = gameFiles
    .map((path) => {
      const node = getNodeByPathOrAdjustedPath(tree, path);

      if (node && node.type !== "folder") {
        return node.id;
      }

      return false;
    })
    .filter(Boolean);

  const addedIds = getAddedIds(tree.render(), gameFileIds, selectedIds);

  const deletedIds = gameFileIds.filter(
    (id) => !containsNodeOrParentId(selectedIds, tree.getNodeById(id))
  );

  const addedPaths = addedIds
    .map((id) => tree.getNodeById(id))
    .map((node) => {
      const nodePath = node.path.substring(6).replace(/\//g, "\\");

      return node.type === "file" ? nodePath + "\\" : nodePath;
    });

  const deletedPaths = deletedIds
    .map((id) => tree.getNodeById(id))
    .map((node) => {
      const nodePath = node.path.substring(6).replace(/\//g, "\\");

      return node.type === "file" ? nodePath + "\\" : nodePath;
    });

  let fppContents = [];

  if (addedPaths.length) {
    fppContents = [addFilesHeader, ...addedPaths, ""];
  }

  if (deletedPaths.length) {
    fppContents = [...fppContents, deleteFilesHeader, ...deletedPaths];
  }

  return fppContents.join("\n");
};

export const getSelectedIds = (tree, currentSelectedIds) => {
  const selectedIds = [];

  for (const node of tree) {
    if (currentSelectedIds.includes(node.id)) {
      selectedIds.push(node.id);
    }

    selectedIds.push(...getSelectedIds(node.children, currentSelectedIds));
  }

  return selectedIds;
};

export const filterTree = (tree, text) => {
  const openIds = [];
  const activeIds = [];
  const filteredTree = [];

  for (const node of tree) {
    const matches =
      node.name.toLocaleLowerCase().indexOf(text.toLocaleLowerCase()) > -1;

    const [childOpenIds, childActiveIds, filteredChildren] = (node.children
      .length &&
      filterTree(node.children, text)) || [[], [], []];

    if (matches) {
      activeIds.push(node.id);
    }

    if (matches && !filteredChildren.length) {
      filteredTree.push(node);
    } else if (filteredChildren.length) {
      filteredTree.push({
        ...node,
        children: filteredChildren,
      });

      openIds.push(node.id);
    }

    openIds.push(...childOpenIds);
    activeIds.push(...childActiveIds);
  }

  return [openIds, activeIds, filteredTree];
};
