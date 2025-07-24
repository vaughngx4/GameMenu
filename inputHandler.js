const GamePad = require("node-gamepad");
const { GlobalKeyboardListener } = require("node-global-key-listener");


let gc = null;
let connectedPad = null;
let eventData = {};

// both wake triggers need to be true in order to fire the wake event
let wakeTriggerA = false;
let wakeTriggerB = false;

const gkl = new GlobalKeyboardListener();
const supportedGamepads = ["ps4/dualshock4", "ps3/dualshock3", "other/generic"];
const eventTriggerDelay = 200;

async function startGamepadListener() {
  setInterval(() => {
    if (!gc) {
      for (const padId of supportedGamepads) {
        try {
          gc = new GamePad(padId);
          gc.connect();
          connectedPad = padId;
          // this is here because node-gamepad connect event does not work
          console.log("Gamepad connected");
          listen();
          break;
        } catch (error) {
          gc = null;
          if (!error.message.includes("cannot open device")) {
            console.error("HID ERROR:", error);
          }
        }
      }
    }
  }, 100);
}

async function listen() {
  // controller events
  if (gc) {
    if ("ps4/dualshock4" == connectedPad || "ps3/dualshock3" == connectedPad) {
      // delay is set here because release event on psx button is unreliable (DS4 controller)
      gc.on("psx:press", function () {
        wakeTriggerA = true;
        wakeTriggerB = true;
        setTimeout(() => {
          wakeTriggerA = false;
          wakeTriggerB = false;
        }, 200);
      });
    } else if ("other/generic" == connectedPad) {
      // delay is set here because release event on psx button is unreliable (DS4 controller)
      // leaving delay for now, until I get feedback or am able to test the release event on
      // other controllers
      gc.on("guide:press", function () {
        wakeTriggerA = true;
        wakeTriggerB = true;
        setTimeout(() => {
          wakeTriggerA = false;
          wakeTriggerB = false;
        }, 200);
      });
    }
    // connect event currently not working
    gc.on("connect", () => {
      console.log("Gamepad connected");
    });
    gc.on("disconnect", () => {
      console.log("Gamepad disconnected");
      gc = null;
    });
  }
}

// keyboard events
gkl.addListener((e) => {
  if (e.state === "DOWN") {
    // console.log(`Key pressed: ${e.name}`);
    if (e.name === "LEFT ALT") {
      wakeTriggerA = true;
    }
    if (e.name === "SECTION") {
      wakeTriggerB = true;
    }
  }
  if (e.state === "UP") {
    // console.log(`Key released: ${e.name}`);
    if (e.name === "LEFT ALT") {
      wakeTriggerA = false;
    }
    if (e.name === "SECTION") {
      wakeTriggerB = false;
    }
  }
});

// listen for wake event
function listenForWake(callback) {
  setInterval(() => {
    if (wakeTriggerA && wakeTriggerB) {
      triggerEvent(["guide"], () => {
        callback();
      });
    }
  }, 100);
}

// trigger event without triggering multiple of the same event
function triggerEvent(buttons, callback) {
  // generate key from button or button combo
  let key = "";
  for (const button of buttons) {
    key = key + button;
  }
  // create object if none exists
  if (!eventData[key]) {
    eventData = {
      [key]: {
        wait: false,
      },
    };
  }
  // trigger function if not waiting
  if (!eventData[key]["wait"]) {
    eventData[key]["wait"] = true;
    callback();
    setTimeout(() => {
      eventData[key]["wait"] = false;
    }, eventTriggerDelay);
  }
}

module.exports = { startGamepadListener, listenForWake };
