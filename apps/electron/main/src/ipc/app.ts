import { app, ipcMain } from "electron";

/**
 * Init app ipcRenderer
 */
export const createAppIPCHandler = () => {
  ipcMain.handle("app.getVersion", () => app.getVersion());
  ipcMain.handle("app.getName", () => app.getName());
  ipcMain.handle("app.relaunch", () => {
    app.relaunch();
    app.exit();
  });
};
