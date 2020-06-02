import { createNodePathMap } from "./node-path-map";

export const createPathTree = (paths = [], { caseSensitive = true } = {}) => {
  if (!paths.length) {
    return [];
  }

  paths = paths.map((path) => path.replace(/[\\]/g, "/"));

  const rootNodeName = paths[0].substring(0, paths[0].indexOf("/"));
  const nodeMap = {};
  const nodePathMap = createNodePathMap(caseSensitive);

  let currentId = 0;

  for (const parts of paths.map((path) => path.split(/\//g))) {
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
          parent,
          children: [],
        };

        nodeMap[nodeId] = node;
        nodePathMap.set(currentPath, node);

        if (parent) {
          parent.children.push(node);
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
