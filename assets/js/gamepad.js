import * as app from "./app.js";

let deadZone = 0.3;
let pollInterval = 100;
let triggerDelay = 200;

let buttons = null;
let axes = [];
let data = {};

let activeRowIndex = -1;
let activeColumnIndex = -1;

// button names
const mapping = {
  cross: 0,
  circle: 1,
  square: 2,
  triangle: 3,
  left_button: 4,
  right_button: 5,
  left_trigger: 6,
  right_trigger: 7,
  share: 8,
  options: 9,
  ls_button: 10,
  rs_button: 11,
  dpad_up: 12,
  dpad_down: 13,
  dpad_left: 14,
  dpad_right: 15,
  ps_button: 16,
  touchpad_click: 17,
};

// reference array
const ref = inverse(mapping);

function inverse(obj) {
  var retobj = {};
  for (var key in obj) {
    retobj[obj[key]] = key;
  }
  return retobj;
}

// single poll event
async function pollGamepads() {
  const gamepads = navigator.getGamepads();
  for (let gp of gamepads) {
    if (!gp) continue;
    buttons = gp.buttons;
    axes = gp.axes; // LS x, y RS x, y
  }
}

// start polling
export async function startPolling() {
  setInterval(() => {
    pollGamepads();
  }, pollInterval);
  gamepadListen();
  kbListen();
}

// listen for gamepad events
async function gamepadListen() {
  setInterval(() => {
    if (buttons) {
      // if (
      //   buttons[mapping.share].pressed &&
      //   buttons[mapping.ps_button].pressed
      // ) {
      //   triggerEvent(["share", "ps_button"], () => {
      //     window.close();
      //   });
      // }
      if (buttons[mapping.ps_button].pressed) {
        triggerEvent(["ps_button"], () => {
          window.close();
        });
      }
      if (buttons[mapping.cross].pressed) {
        triggerEvent(["cross"], () => {
          navSelect();
        });
      }
      if (buttons[mapping.circle].pressed) {
        triggerEvent(["circle"], () => {
          navBack();
        });
      }
      if (axes[0] < 0 - deadZone) {
        navLeft();
      }
      if (axes[0] > 0 + deadZone) {
        navRight();
      }
      if (axes[1] < 0 - deadZone) {
        navDown();
      }
      if (axes[0] > 0 + deadZone) {
        navUp();
      }
    }
  }, pollInterval);
}

// listen for keyboard events
async function kbListen() {
  addEventListener("keydown", (e) => {
    if (e.key == "ArrowLeft") {
      e.preventDefault();
      navLeft();
    }
    if (e.key == "ArrowRight") {
      e.preventDefault();
      navRight();
    }
    if (e.key == "ArrowUp") {
      e.preventDefault();
      navUp();
    }
    if (e.key == "ArrowDown") {
      e.preventDefault();
      navDown();
    }
    if (e.key == "Enter") {
      e.preventDefault();
      navSelect();
    }
  });
}

// trigger event without calling the function multiple times after a single button press
// this is required because we can poll the key multiple times per second but want the
// event to fire less often.
export function triggerEvent(buttons, callback) {
  // generate event key from button or button combo
  let key = "";
  for (const button of buttons) {
    key = key + button;
  }
  console.log(key);
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
    }, triggerDelay);
  }
}

function navRight() {
  triggerEvent(["right"], () => {
    let nextRowIndex = 0;
    if (activeRowIndex > -1) {
      app.buttons[activeRowIndex].classList.toggle("active");
      if (activeRowIndex < app.buttons.length - 1) {
        nextRowIndex = activeRowIndex + 1;
      }
      // for debugging purposes !!!
      console.log("active: " + activeRowIndex + " next: " + nextRowIndex);
    }
    app.buttons[nextRowIndex].classList.toggle("active");
    activeRowIndex = nextRowIndex;
  });
}
function navLeft() {
  triggerEvent(["left"], () => {
    let nextRowIndex = app.buttons.length - 1;
    if (activeRowIndex > -1) {
      app.buttons[activeRowIndex].classList.toggle("active");
      if (activeRowIndex > 0) {
        nextRowIndex = activeRowIndex - 1;
      }
      // for debugging purposes !!!
      console.log("active: " + activeRowIndex + " next: " + nextRowIndex);
    }
    app.buttons[nextRowIndex].classList.toggle("active");
    activeRowIndex = nextRowIndex;
  });
}
function navUp() {}
function navDown() {}
function navSelect() {
  triggerEvent("cross", () => {
    if (activeRowIndex > -1) {
      app.buttons[activeRowIndex].click();
    }
  });
}
function navBack() {}

addEventListener("mousemove", (event) => {
  triggerEvent(["mousemove"], () => {
    activeRowIndex = -1;
    for (const elem of document.querySelectorAll(".active")) {
      elem.classList.remove("active");
    }
  });
});