// desktop/src/main.ts
// Electron main process — floating Orion bar (secured)
import { autoUpdater } from "electron-updater";
import { app, BrowserWindow, globalShortcut, ipcMain, screen } from "electron";
import * as path from "path";
import os from "os";

type LoginResponse = {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

let heartbeatInterval: NodeJS.Timeout | null = null;
let win: BrowserWindow | null = null;
let authToken: string | null = null;
let isQuittingForUpdate = false;

// ── Auto-updater config ───────────────────────────────────────
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const WIDTH = 520;
const HEIGHT = 80;

function createWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  const x = sw - WIDTH - 24;
  const y = Math.floor(sh / 2) - Math.floor(HEIGHT / 2);

  win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x,
    y,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  ipcMain.handle("get-token", async () => {
    return authToken;
  });

  ipcMain.handle("login", async (_e, email: string, password: string) => {
    const res = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error("Login failed");

    const data = (await res.json()) as LoginResponse;
    authToken = data.access_token;

    // ── Device registration ───────────────────────────────────
    try {
      const registerRes = await fetch("http://localhost:8000/orion/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          device_name: os.hostname(),
          os: process.platform,
          version: app.getVersion(),
        }),
      });
      if (!registerRes.ok) {
        console.error("Device registration failed:", registerRes.status);
      }
    } catch (err) {
      console.error("Device registration failed:", err);
    }

    // ── Heartbeat ─────────────────────────────────────────────
    await sendHeartbeat();
    if (!heartbeatInterval) {
      heartbeatInterval = setInterval(sendHeartbeat, 300000);
    }

    // ── Update check via electron-updater only ────────────────
    // Do NOT manually send "update-available" — let autoUpdater
    // emit it automatically after download completes via
    // the "update-downloaded" event. This ensures quitAndInstall
    // is only callable once the file is actually ready.
    try {
      console.log("App Version:", app.getVersion());
      console.log("Electron Version:", process.versions.electron);
      console.log("App Name:", app.getName());
      console.log("Triggering update check via electron-updater...");
      await autoUpdater.checkForUpdates();
    } catch (err) {
      console.error("Update check failed:", err);
    }

    return { success: true, user: data.user };
  });

  // ── CSP — only allow requests to localhost:8000 ───────────────
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          [
            "default-src 'self'",
            "script-src 'unsafe-inline'",
            "style-src 'unsafe-inline'",
            "connect-src http://localhost:8000",
            "img-src 'none'",
            "object-src 'none'",
            "frame-src 'none'",
          ].join("; "),
        ],
      },
    });
  });

  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  win.loadFile(path.join(__dirname, "overlay.html"));
  win.hide();

  win.on("closed", () => {
    win = null;
  });
}

// ── Auto-updater events ───────────────────────────────────────
// Flow: checkForUpdates() → update-available (banner shows "Downloading...")
//       → download happens automatically (autoDownload: true)
//       → update-downloaded (banner changes to "Update & Restart")
//       → user clicks → quitAndInstall() → works because file is ready

autoUpdater.on("checking-for-update", () => {
  console.log("Checking for updates...");
});

autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info.version);
  // Signal renderer: show banner in "downloading" state
  // Do NOT let the user click install yet — download hasn't finished
  win?.webContents.send("update-available", {
    version: info.version,
  });
});

autoUpdater.on("update-not-available", () => {
  console.log("No update available — already on latest version.");
});

autoUpdater.on("download-progress", (progress) => {
  console.log(`Download progress: ${Math.round(progress.percent)}%`);
  win?.webContents.send("update-download-progress", {
    percent: Math.round(progress.percent),
  });
});

autoUpdater.on("error", (err) => {
  console.error("Updater error:", err);
  win?.webContents.send("update-error", err.message);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded and ready to install:", info.version);
  // NOW signal renderer: enable the install button
  win?.webContents.send("update-downloaded", info);
});

ipcMain.on("install-update", () => {
  // Only called after update-downloaded has fired in the renderer
  isQuittingForUpdate = true;
  autoUpdater.quitAndInstall();
});

// ── Window toggle ─────────────────────────────────────────────
function toggleWindow() {
  if (!win) return;
  if (win.isVisible()) {
    win.hide();
    win.setSize(WIDTH, HEIGHT, false);
  } else {
    win.show();
    win.focus();
    win.webContents.send("window-shown");
  }
}

// ── Heartbeat ─────────────────────────────────────────────────
async function sendHeartbeat() {
  if (!authToken) return;
  try {
    const res = await fetch("http://localhost:8000/orion/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        version: app.getVersion(),
      }),
    });
    if (!res.ok) {
      console.error("Heartbeat failed:", res.status);
    }
  } catch (err) {
    console.error("Heartbeat failed:", err);
  }
}

// ── App ready ─────────────────────────────────────────────────
// Update checks are NOT run on cold start. The only trigger is a
// successful login (see the "login" handler above) — this keeps
// the update banner from appearing/downloading silently behind a
// hidden window before the user has interacted with the app.
app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("CommandOrControl+Space", toggleWindow);
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// ── Quit handling ────────────────────────────────────────────
// Normally we prevent quit-on-last-window-closed since this is a
// tray-style overlay app. But electron-updater's quitAndInstall()
// also triggers "window-all-closed" as part of its shutdown — if
// we unconditionally preventDefault() there, the update install
// silently stalls (window closes, app never actually quits/relaunches).
// The isQuittingForUpdate flag lets us distinguish the two cases.
app.on("window-all-closed", (e: Event) => {
  if (!isQuittingForUpdate) e.preventDefault();
});

// ── IPC handlers ──────────────────────────────────────────────
ipcMain.on("hide", () => {
  win?.setSize(WIDTH, HEIGHT, false);
  win?.hide();
});

ipcMain.on("show", () => {
  win?.show();
  win?.focus();
});

ipcMain.on("expand", (_e: Electron.IpcMainEvent, height: number) => {
  if (!win) return;
  const clamped = Math.min(Math.max(height, HEIGHT), 640);
  win.setSize(WIDTH, clamped, true);
});

ipcMain.on("collapse", () => {
  win?.setSize(WIDTH, HEIGHT, true);
});

ipcMain.on("logout", () => {
  authToken = null;
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
});

// ── capture-screen ────────────────────────────────────────────
// overlay.html hides Orion and waits 600ms BEFORE calling this
// so Orion is already gone — just capture directly, no hide/show here
ipcMain.handle("capture-screen", async () => {
  try {
    const { desktopCapturer } = await import("electron");

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 3840, height: 2160 },
    });

    if (!sources.length) return null;

    const b64 = sources[0].thumbnail.toPNG().toString("base64");
    if (!/^[A-Za-z0-9+/=]+$/.test(b64.slice(0, 100))) return null;

    return b64;
  } catch (err) {
    console.error("Screenshot failed:", err);
    return null;
  }
});