const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  launchApp: (app) => ipcRenderer.send("launch-app", app),
  isLoaded: () => ipcRenderer.invoke('event:loaded')
});
