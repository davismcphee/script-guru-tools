import * as path from "path";
import * as mime from "mime";
import { createNodePathMap } from "./node-path-map";
import { glob } from "../filesystem/glob";

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

  const fullPaths = await glob(path.join(rootPath, "**/*"));

  const partialPaths = fullPaths.map((path) =>
    path.substring(newRootPath.length + 1).split("/")
  );

  const nodeMap = {};
  const nodePathMap = createNodePathMap(caseSensitive);

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
          path: currentPath,
          selected: false,
          deleted: false,
          disabled: false,
          parent,
          children: [],
        };

        nodeMap[nodeId] = node;
        nodePathMap.set(currentPath, node);

        if (parent) {
          parent.children.push(node);
        }

        const extname = path.extname(part);

        if (index === parts.length - 1 && extname) {
          const nodeMime = mime.getType(part) || "";

          node.extname = extname.substring(1).toLowerCase();
          node.mime = nodeMime;
          node.type = nodeMime.substr(0, nodeMime.indexOf("/")) || "unknown";
        } else {
          node.type = "folder";
        }

        parent = node;
      }
    }
  }

  return {
    render() {
      return [nodePathMap.get(rootNodeName)];
    },
    getNodeById(id) {
      return nodeMap[id];
    },
    getNodeByPath(path) {
      return nodePathMap.get(path);
    },
  };
};
