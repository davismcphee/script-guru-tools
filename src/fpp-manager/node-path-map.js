export const createNodePathMap = (caseSensitive = true) => {
  const map = {};

  return {
    get: caseSensitive
      ? (nodePath) => map[nodePath]
      : (nodePath) => map[nodePath.toLowerCase()],
    set: caseSensitive
      ? (nodePath, node) => {
          map[nodePath] = node;
        }
      : (nodePath, node) => {
          map[nodePath.toLowerCase()] = node;
        },
  };
};
