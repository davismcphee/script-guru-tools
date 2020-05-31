const fs = require("fs");
const path = require("path");
const mime = require("mime");
const util = require("util");
const glob = require("glob");

const globAsync = util.promisify(glob);

const isFile = (filePath) => {
  try {
    var stat = fs.lstatSync(filePath);

    return stat.isFile();
  } catch (e) {
    return false;
  }
};

const getAllPaths = (tree) =>
  tree.map((node) => [node.path, ...getAllPaths(node.children).flat()]);

export const createFileTree = async (
  rootPath = "",
  { caseSensitive = true } = {}
) => {
  rootPath = rootPath.replace(/\\/g, "/").replace(/\/+$/, "");

  const rootNodeName = rootPath.substr(rootPath.lastIndexOf("/") + 1);

  const newRootPath = rootPath.substr(
    0,
    rootPath.length - rootNodeName.length - 1
  );

  const fullPaths = await globAsync(path.join(rootPath, "**/*"));

  const partialPaths = fullPaths.map((path) =>
    path.substring(newRootPath.length + 1).split("/")
  );

  const nodeMap = {};

  const nodePathMap = {
    _map: {},
    get: caseSensitive
      ? (nodePath) => nodePathMap._map[nodePath]
      : (nodePath) => nodePathMap._map[nodePath.toLowerCase()],
    set: caseSensitive
      ? (nodePath, node) => {
          nodePathMap._map[nodePath] = node;
        }
      : (nodePath, node) => {
          nodePathMap._map[nodePath.toLowerCase()] = node;
        },
  };

  let currentId = 0;

  for (const parts of partialPaths) {
    let parent = null;

    for (const [index, part] of parts.entries()) {
      const currentPath = parts.slice(0, index + 1).join("/");

      if (nodePathMap.get(currentPath)) {
        parent = nodePathMap.get(currentPath);
      } else {
        const nodeId = ++currentId;
        const node = {
          id: nodeId,
          name: part,
          parent,
          children: [],
        };

        nodeMap[nodeId] = node;
        nodePathMap.set(currentPath, node);

        if (parent) {
          parent.children.push(node);
        }

        if (
          index === parts.length - 1 &&
          isFile(path.join(newRootPath, currentPath))
        ) {
          const nodeMime = mime.getType(part) || "";

          node.mime = nodeMime;
          node.type = nodeMime.substr(0, nodeMime.indexOf("/")) || "unknown";
        } else {
          node.type = "folder";
        }

        node.path = currentPath;

        parent = node;
      }
    }
  }

  return {
    render() {
      return [nodePathMap.get(rootNodeName)];
    },
    getAllPaths() {
      return getAllPaths([nodePathMap.get(rootNodeName)]);
    },
    getAllIds() {
      return Object.keys(nodeMap).map((id) => parseInt(id));
    },
    getNodeById(id) {
      return nodeMap[id];
    },
    getNodeByPath(path) {
      return nodePathMap.get(path);
    },
  };
};
