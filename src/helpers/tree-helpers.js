import { v4 as uuid } from "uuid";
const fs = require("fs");
const path = require("path");
const fileType = require("file-type");
const util = require("util");
const glob = require("glob");

const globAsync = util.promisify(glob);

const isFile = (path) => {
  try {
    var stat = fs.lstatSync(path);

    return stat.isFile();
  } catch (e) {
    return false;
  }
};

export const findNodeByNames = (root, names) => {
  return names.reduce(
    (node, name) =>
      node ? node.children.find((node) => node.name === name) : node,
    root
  );
};

export const findNodeById = (root, id) => {
  if (root.id === id) {
    return root;
  }

  for (const child of root.children) {
    const foundNode = findNodeById(child, id);

    if (foundNode) {
      return foundNode;
    }
  }

  return null;
};

const convertToFileMap = (pathPrefix, paths, getRoot) => {
  const fileParts = paths.map((path) => path.split(/[\\/]/g));
  const fileMap = {};
  const mimeChecks = [];

  for (const parts of fileParts) {
    let currentNode = fileMap;

    for (const [index, part] of parts.entries()) {
      const filePath = path.join(pathPrefix, ...parts);

      if (index === parts.length - 1 && isFile(filePath)) {
        currentNode[part] = {
          isFile: true,
          type: "file",
        };

        if (getRoot) {
          mimeChecks.push(
            fileType.fromFile(filePath).then((type) => [parts, type])
          );
        }

        continue;
      }

      if (!currentNode[part]) {
        currentNode[part] = {};
      }

      currentNode = currentNode[part];
    }
  }

  Promise.all(mimeChecks).then((checks) =>
    checks.forEach(([parts, type]) => {
      if (!type) {
        return;
      }

      const root = getRoot();

      if (!root) {
        return;
      }

      const node = findNodeByNames(root, parts);

      if (!node) {
        return;
      }

      node.type = type.mime.substring(0, type.mime.indexOf("/"));
    })
  );

  return fileMap;
};

const createFileTreeNode = (fileMap, root) => {
  if (fileMap == null) {
    return root;
  }

  Object.keys(fileMap).forEach((key) => {
    if (fileMap[key].isFile) {
      root.children.push({
        id: uuid(),
        type: fileMap[key].mime,
        name: key,
        children: [],
      });

      return;
    }

    root.children.push(
      createFileTreeNode(
        fileMap[key],
        root.children.find((n) => n.name === key) || {
          id: uuid(),
          type: "folder",
          name: key,
          children: [],
        }
      )
    );
  });

  return root;
};

export const createFileTree = async (fullPath, rootFolder, getRoot) => {
  const rootFolderPath = `/${rootFolder}/`;

  const fullPaths = (
    await globAsync(path.resolve(fullPath, "**/*"))
  ).filter((path) => path.includes(rootFolderPath));

  const partialPaths = fullPaths.map((path) =>
    path.substring(path.lastIndexOf(rootFolderPath) + rootFolderPath.length)
  );

  const firstPath = fullPaths[0] || "";

  const fileMap = convertToFileMap(
    firstPath.substring(
      0,
      firstPath.lastIndexOf(rootFolderPath) + rootFolderPath.length
    ),
    partialPaths,
    getRoot
  );

  return [
    createFileTreeNode(fileMap, {
      id: uuid(),
      type: "folder",
      name: rootFolder,
      children: [],
    }),
  ];
};

const containsInsensitive = (source, target) =>
  source
    ?.toLowerCase()
    ?.trim()
    ?.includes(target?.toLowerCase()?.trim() ?? "") ?? false;

export const searchTree = (tree, text) => {
  const openIds = [];
  const activeIds = [];
  const filteredTree = [];

  tree.forEach((node) => {
    const containsText = containsInsensitive(node.name, text);
    const [childOpenIds, childActiveIds, filteredChildren] = (node.children
      .length &&
      searchTree(node.children, text)) || [[], [], []];

    if (containsText) {
      activeIds.push(node.id);
    }

    if (containsText && !filteredChildren.length) {
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
  });

  return [openIds, activeIds, filteredTree];
};
