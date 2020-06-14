import { handle, invoke } from "../remote";
import { shell } from "electron";

export const initializeShell = () => {
  handle("openExternal", (url) => shell.openExternal(url));
};

export const openExternal = (url) => invoke("openExternal", url);
