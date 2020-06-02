import { ipcMain, ipcRenderer } from "electron";
import { v4 as uuid } from "uuid";
import * as log from "electron-log";

export const handle = (eventName, callback) => {
  eventName = eventName.trim();

  ipcMain.on(eventName, async (event, id, ...args) => {
    try {
      const result = await callback(...args);

      event.sender.send(`${eventName}-complete`, {
        id,
        success: true,
        result,
      });
    } catch (e) {
      log.error(
        `Error handling event "${eventName}" with ID "${id}": ${e.toString()}`
      );

      event.sender.send(`${eventName}-complete`, {
        id,
        success: false,
        error: e.toString(),
      });
    }
  });
};

export const invoke = (event, ...args) => {
  event = event.trim();

  const id = uuid();

  const promise = new Promise((resolve, reject) => {
    ipcRenderer.on(`${event}-complete`, (_, response) => {
      if (!response.id === id) {
        return;
      }

      if (response.success) {
        resolve(response.result);
      } else {
        log.error(
          `Error invoking event "${event}" with ID "${id}": ${response.error}`
        );

        reject(response.error);
      }
    });
  });

  ipcRenderer.send(event, id, ...args);

  return promise;
};
