// // desktop/src/preload.ts
// // Secure bridge — exposes only what overlay.html needs

// import { contextBridge, ipcRenderer } from "electron";

// contextBridge.exposeInMainWorld("electronAPI", {
//   // Auth
//   login: (email: string, password: string) =>
//     ipcRenderer.invoke("login", email, password),

//   getToken: (): Promise<string | null> => ipcRenderer.invoke("get-token"),
//   logout: () => ipcRenderer.send("logout"),

//   // Window control
//   hide: () => ipcRenderer.send("hide"),
//   show: () => ipcRenderer.send("show"), // ← NEW: needed for screenshot flow
//   expand: (height: number) => ipcRenderer.send("expand", height),
//   collapse: () => ipcRenderer.send("collapse"),

//   // Screenshot
//   captureScreen: (): Promise<string | null> =>
//     ipcRenderer.invoke("capture-screen"),
//   onUpdateAvailable: (cb: (data:any)=>void) =>
//   ipcRenderer.on(
//     "update-available",
//     (_e,data)=>cb(data)
//   ),
//   onOrionUpdated: (
//   cb: (data:any)=>void
// ) =>
//   ipcRenderer.on(
//     "orion-updated",
//     (_e,data)=>cb(data)
//   ),
//   onUpdateDownloaded: (
//   cb: (data:any)=>void
// ) =>
//   ipcRenderer.on(
//     "update-downloaded",
//     (_e,data)=>cb(data)
//   ),
//   installUpdate: () =>
//   ipcRenderer.send(
//     "install-update"
//   ),
  

//   // Events
//   onShown: (cb: () => void) => ipcRenderer.on("window-shown", cb),
// });
// desktop/src/preload.ts
// Secure bridge — exposes only what overlay.html needs
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // ── Auth ──────────────────────────────────────────────────
  login: (email: string, password: string) =>
    ipcRenderer.invoke("login", email, password),
  getToken: (): Promise<string | null> => ipcRenderer.invoke("get-token"),
  logout: () => ipcRenderer.send("logout"),

  // ── Window control ────────────────────────────────────────
  hide: () => ipcRenderer.send("hide"),
  show: () => ipcRenderer.send("show"),
  expand: (height: number) => ipcRenderer.send("expand", height),
  collapse: () => ipcRenderer.send("collapse"),

  // ── Screenshot ────────────────────────────────────────────
  captureScreen: (): Promise<string | null> =>
    ipcRenderer.invoke("capture-screen"),

  // ── Update events ─────────────────────────────────────────
  // Fired when a new version is found + download starts
  onUpdateAvailable: (cb: (data: { version: string }) => void) =>
    ipcRenderer.on("update-available", (_e, data) => cb(data)),

  // Fired with % progress during download
  onUpdateProgress: (cb: (data: { percent: number }) => void) =>
    ipcRenderer.on("update-download-progress", (_e, data) => cb(data)),

  // Fired when download is complete — safe to call quitAndInstall
  onUpdateDownloaded: (cb: (data: { version: string }) => void) =>
    ipcRenderer.on("update-downloaded", (_e, data) => cb(data)),

  // Fired if updater hits an error
  onUpdateError: (cb: (msg: string) => void) =>
    ipcRenderer.on("update-error", (_e, msg) => cb(msg)),

  // Fired from orion-updated (legacy, keep for compat)
  onOrionUpdated: (cb: (data: any) => void) =>
    ipcRenderer.on("orion-updated", (_e, data) => cb(data)),

  // Trigger the actual install + restart
  installUpdate: () => ipcRenderer.send("install-update"),

  // ── Window shown event ────────────────────────────────────
  onShown: (cb: () => void) => ipcRenderer.on("window-shown", cb),
});