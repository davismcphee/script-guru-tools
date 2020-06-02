import * as internalGlob from "glob";
import * as util from "util";
import { handle, invoke } from "../remote";

const globAsync = util.promisify(internalGlob);

export const initializeGlob = () => {
  handle("glob", (...args) => globAsync(...args));
};

export const glob = (...args) => invoke("glob", ...args);
