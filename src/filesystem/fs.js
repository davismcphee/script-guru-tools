import { handle, invoke } from "../remote";
// import * as util from "util";
import * as fs from "fs";

// const readFileAsync = util.promisify(fs.readFile);
// const writeFileAsync = util.promisify(fs.writeFile);

const internalIsFile = (filePath) => {
  try {
    var stat = fs.lstatSync(filePath);

    return stat.isFile();
  } catch (e) {
    return false;
  }
};

const internalIsDirectroy = (filePath) => {
  try {
    var stat = fs.lstatSync(filePath);

    return stat.isDirectory();
  } catch (e) {
    return false;
  }
};

export const initializeFs = () => {
  handle("isFile", (path) => internalIsFile(path));
  handle("isDirectory", (path) => internalIsDirectroy(path));
  handle("readFile", (...args) => fs.readFileSync(...args));
  handle("writeFile", (...args) => fs.writeFileSync(...args));
};

export const isFile = (path) => invoke("isFile", path);

export const isDirectory = (path) => invoke("isDirectory", path);

export const readFile = (...args) => invoke("readFile", ...args);

export const writeFile = (...args) => invoke("writeFile", ...args);
