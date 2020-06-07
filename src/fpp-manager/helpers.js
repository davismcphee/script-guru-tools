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

const clearSelected = (tree) => {
  for (const node of tree) {
    node.selected = false;
    clearSelected(node.children);
  }
};

export const setDefaultSelected = (
  tree,
  gameFiles,
  { adds = [], deletes = [] }
) => {
  clearSelected(tree.render());

  gameFiles.forEach((currentPath) => {
    let node = getNodeByPathOrAdjustedPath(tree, currentPath);

    if (node && node.type !== "folder") {
      node.selected = true;
    }
  });

  adds.forEach((currentPath) => {
    const node = tree.getNodeByPath(currentPath);

    if (node) {
      node.selected = true;
    }
  });

  deletes.forEach((currentPath) => {
    const node = tree.getNodeByPath(currentPath);

    if (node) {
      node.selected = false;
    }
  });
};

const getAddedNodes = (tree, gameFileNodes) =>
  tree
    .map((node) => {
      if (node.selected && !gameFileNodes.includes(node)) {
        return [node];
      }

      return [...getAddedNodes(node.children, gameFileNodes)];
    })
    .flat();

const getDeletedNodes = (tree, gameFileNodes) =>
  tree
    .map((node) => {
      if (
        node.deleted ||
        (node.type !== "folder" && !gameFileNodes.includes(node))
      ) {
        return [node];
      }

      return [...getDeletedNodes(node.children, gameFileNodes)];
    })
    .flat();

export const generateFppFile = (tree, gameFiles) => {
  const gameFileNodes = gameFiles
    .map((path) => {
      const node = getNodeByPathOrAdjustedPath(tree, path);

      if (node && node.type !== "folder") {
        return node;
      }

      return false;
    })
    .filter(Boolean);

  const addedPaths = getAddedNodes(tree.render(), gameFileNodes).map((node) => {
    const nodePath = node.path.substring(6).replace(/\//g, "\\");

    return node.type === "file" ? nodePath + "\\" : nodePath;
  });

  const deletedPaths = getDeletedNodes(tree.render(), gameFileNodes).map(
    (node) => {
      const nodePath = node.path.substring(6).replace(/\//g, "\\");

      return node.type === "file" ? nodePath + "\\" : nodePath;
    }
  );

  let fppContents = [];

  if (addedPaths.length) {
    fppContents = [addFilesHeader, ...addedPaths, ""];
  }

  if (deletedPaths.length) {
    fppContents = [...fppContents, deleteFilesHeader, ...deletedPaths];
  }

  return fppContents.join("\n");
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

export const setDisabled = (tree, disabled) => {
  for (const node of tree) {
    if (node.deleted) {
      return;
    }

    node.disabled = disabled;

    setDisabled(node.children, disabled);
  }
};

export const anyParentDeleted = (node) =>
  node && (node.deleted || anyParentDeleted(node.parent));

export const filterSelected = (tree, selected) => {
  let filteredTree = [];

  for (const node of tree) {
    const filteredChildren = filterSelected(node.children, selected);

    if (node.selected === selected || filteredChildren.length) {
      filteredTree.push({
        ...node,
        children: filteredChildren,
      });
    }
  }

  return filteredTree;
};
