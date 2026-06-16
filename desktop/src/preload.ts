// desktop/src/preload.ts
// Secure bridge — exposes only what overlay.html needs

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Auth
  login: (email: string, password: string) =>
    ipcRenderer.invoke("login", email, password),

  getToken: (): Promise<string | null> => ipcRenderer.invoke("get-token"),
  logout: () => ipcRenderer.send("logout"),

  // Window control
  hide: () => ipcRenderer.send("hide"),
  show: () => ipcRenderer.send("show"), // ← NEW: needed for screenshot flow
  expand: (height: number) => ipcRenderer.send("expand", height),
  collapse: () => ipcRenderer.send("collapse"),

  // Screenshot
  captureScreen: (): Promise<string | null> =>
    ipcRenderer.invoke("capture-screen"),

  // Events
  onShown: (cb: () => void) => ipcRenderer.on("window-shown", cb),
});
