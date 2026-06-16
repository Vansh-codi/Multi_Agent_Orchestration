// desktop/src/main.ts
// Electron main process — floating Orion bar (secured)

import { app, BrowserWindow, globalShortcut, ipcMain, screen } from "electron";
import * as path from "path";

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

let win: BrowserWindow | null = null;
let authToken: string | null = null;
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

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("CommandOrControl+Space", toggleWindow);
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", (e: Event) => {
  e.preventDefault();
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
