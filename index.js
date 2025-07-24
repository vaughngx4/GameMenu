const { app, BrowserWindow, Tray, Menu, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("fs");
const appConfig = require("./apps.json");
const { startGamepadListener, listenForWake } = require("./inputHandler.js");
const cp = require("child_process");

let tray = null;
let windowExists = false;
let isLoaded = false;

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
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // load app interface
  mainWindow.loadFile("app.html");
  // mainWindow.webContents.openDevTools();

  // this currently does not work on linux, close event is not triggered in sandboxed mode
  // does not appear that it will be fixed
  // also note that the close event is not triggered when the window is destroyed
  // https://github.com/electron/electron/issues/28215
  mainWindow.on("close", (event) => {
    windowExists = false;
    // mainWindow.close();
  });

  // listen for app launch event
  // not sure why we get stacking triggers of this event
  ipcMain.on("launch-app", (event, appName) => {
    console.log("Launching " + appName);
    cp.execFile(
      appConfig[
        appConfig
          .map((e) => {
            return e.name;
          })
          .indexOf(appName)
      ].command
    );
    BrowserWindow.getAllWindows().forEach((win) => {
      win.close();
    });
    windowExists = false;
  });
};

app.whenReady().then(() => {
  ipcMain.handle("event:loaded", handleLoadedEvent);
  // create tray icon/menu
  tray = new Tray(path.join(__dirname, "/assets/img/game-control.png"));
  const contextMenu = Menu.buildFromTemplate([
    // { label: "GameMenu", type: "normal", enabled: false },
    // { type: "separator" },
    { label: "Show Menu", type: "normal", click: createWindow },
    { label: "Exit", type: "normal", click: handleQuit },
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
    BrowserWindow.getAllWindows().forEach((win) => {
      win.close();
    });
  }
});

async function handleLoadedEvent() {
  if (isLoaded) {
    return true;
  } else {
    isLoaded = true;
    return false;
  }
}

// new stuff - not implemented
function getProcs() {
  let procs = [];
  cp.exec("tasklist", function (err, stdout, stderr) {
    if (err) {
      console.error(err, stderr);
    }
    console.log(stdout);
    // stdout is a string containing the output of the command.
    // parse it and look for the processes.
  });
}

// a) needs to handle more inputs like back/escape to close the menu
// b)