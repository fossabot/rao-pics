import { ipcMain } from "electron";

/**
 * Init Process ipcRenderer
 */
export const createProcessIPCHandler = () => {
  ipcMain.handle("process.platform", () => process.platform);
};
