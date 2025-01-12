const { app, BrowserWindow, Tray, Menu, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("fs");
const appConfig = require("./apps.json");
const { startGamepadListener, listenForWake } = require("./inputHandler.js");

let tray = null;
let windowExists = false;

// create application window
const createWindow = () => {
  windowExists = true;
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    transparent: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // load app interface
  mainWindow.loadFile("app.html");
  // mainWindow.webContents.openDevTools();

  // this currently does not work, close event is not triggered in sandboxed mode
  // does not appear that it will be fixed
  // https://github.com/electron/electron/issues/28215
  mainWindow.on("close", (event) => {
    windowExists = false;
    mainWindow.close();
  });

  // listen for app launch event
  ipcMain.on('launch-app', (event, appName) => {
    console.log("Launching " + appName) // debug !!!
    // launch app here !!!
  });

  // send app config to renderer
  mainWindow.webContents.on("did-finish-load", async () => {
    processApps();
    mainWindow.webContents.send("read-app-config", appConfig);
  });
};

app.whenReady().then(() => {
  // create tray icon/menu
  tray = new Tray(path.join(__dirname, "/assets/img/game-control.png"));
  const contextMenu = Menu.buildFromTemplate([
    { label: "GameMenu", type: "normal", enabled: false },
    { type: "separator" },
    { label: "Open", type: "normal", click: createWindow },
    { label: "Quit", type: "normal", click: handleQuit },
  ]);
  tray.setToolTip("GameMenu");
  tray.setContextMenu(contextMenu);
  tray.addListener("click", () => createWindow());
});

// handle quitting
function handleQuit() {
  if (process.platform !== "darwin") {
    app.quit();
  }
}

app.on("ready", createWindow);

// we would normally quit here, but in our case we want to minimize to tray
// so this event is left empty. Leaving event here for clarity
app.on("window-all-closed", () => {
  // if (process.platform !== "darwin") {
  //     app.quit();
  // }
});

// if we don't have any windows when activated, create one
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// listen for gamepad events
startGamepadListener();

// create window if wake event is fired
listenForWake(() => {
  if (!windowExists) {
    createWindow();
  } else {
    windowExists = false;
  }
});

function processApps() {
  for (const cat in appConfig){
    for (let index = 0; index < cat.length; index++) {
      console.log(cat);
      const img = fs.readFileSync("./themes/default/" + appConfig[cat][index].icon);
      appConfig[cat][index].icon = Buffer.from(img).toString('base64');
    }
  }
}
