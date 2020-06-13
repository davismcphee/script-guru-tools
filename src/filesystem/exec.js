import { promisify } from "util";
import { exec as internalExec } from "child_process";
import { handle, invoke } from "../remote";

const execAsync = promisify(internalExec);

export const initializeExec = () => {
  handle("exec", (...args) => execAsync(...args));
};

export const exec = (...args) => invoke("exec", ...args);
