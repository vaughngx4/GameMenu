const GamePad = require("node-gamepad");

let gc = null;
let data = {};
const eventTriggerDelay = 200;

const supportedGamepads = ["ps4/dualshock4", "ps3/dualshock3"];
let connectedPad = null;

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

let restoreBtnOnePressed = false;
let restoreBtnTwoPressed = false;

async function listen() {
  if (gc) {
    if ("ps4/dualshock4" == connectedPad) {
      // delay is set here because release event on psx button is unreliable
      gc.on("psx:press", function () {
        restoreBtnOnePressed = true;
        setTimeout(() => {
          restoreBtnOnePressed = false;
        }, 200);
      });
      // gc.on("share:press", function () {
      //   restoreBtnTwoPressed = true;
      // });
      // gc.on("share:release", function () {
      //   restoreBtnTwoPressed = false;
      // });
    }
    // connect event currently not working
    gc.on("connect", () => {
      console.log("Gamepad detected");
    });
    gc.on("disconnect", () => {
      console.log("Gamepad disconnected");
      gc = null;
    });
  }
}

// listen for wake button event
function listenForWake(callback) {
  setInterval(() => {
    if (
      restoreBtnOnePressed
      // && restoreBtnTwoPressed
    ) {
      triggerEvent(["psx"], () => {
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
  if (!data[key]) {
    data = {
      [key]: {
        wait: false,
      },
    };
  }
  // trigger function if not waiting
  if (!data[key]["wait"]) {
    data[key]["wait"] = true;
    callback();
    setTimeout(() => {
      data[key]["wait"] = false;
    }, eventTriggerDelay);
  }
}

module.exports = { startGamepadListener, listenForWake };
