const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    launchApp: (app) => ipcRenderer.send('launch-app', app),
    onReadAppConfig: (callback) => ipcRenderer.on('read-app-config', (_event, value) => callback(value)),
})