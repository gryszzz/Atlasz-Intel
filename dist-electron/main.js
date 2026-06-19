import e from "electron";
import { dirname as t, join as n } from "node:path";
import { fileURLToPath as r } from "node:url";
//#region electron/main.ts
var { app: i, BrowserWindow: a, ipcMain: o, shell: s } = e, c = t(r(import.meta.url));
function l() {
	let e = new a({
		title: "Atlasz Intel",
		width: 1480,
		height: 980,
		minWidth: 1180,
		minHeight: 760,
		backgroundColor: "#050607",
		titleBarStyle: "hiddenInset",
		trafficLightPosition: {
			x: 16,
			y: 16
		},
		webPreferences: {
			preload: n(c, "preload.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1,
			sandbox: !1
		}
	});
	e.webContents.setWindowOpenHandler(({ url: e }) => (s.openExternal(e), { action: "deny" })), process.env.VITE_DEV_SERVER_URL ? e.loadURL(process.env.VITE_DEV_SERVER_URL) : e.loadFile(n(c, "../dist/index.html"));
}
o.handle("atlasz:app-meta", () => ({
	name: i.getName(),
	version: i.getVersion(),
	platform: process.platform,
	dataPath: i.getPath("userData")
})), o.handle("atlasz:open-external", async (e, t) => {
	await s.openExternal(t);
}), i.whenReady().then(() => {
	l(), i.on("activate", () => {
		a.getAllWindows().length === 0 && l();
	});
}), i.on("window-all-closed", () => {
	process.platform !== "darwin" && i.quit();
});
//#endregion
export {};
