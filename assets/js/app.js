import { startPolling } from "./gamepad.js";

let closeButton = document.getElementById("close");
closeButton.addEventListener("click", () => {
  window.close();
});

window.electronAPI.onReadAppConfig((config) => {
  console.log(config);
});
const apps = ["discord", "playnite", "icue"];
export let buttons = [];

for (const app of apps) {
  let btn = document.getElementById(app);
  // let btn = document.createElement("div");
  buttons.push(btn);
  addClickAnim(btn);
  addLaunchEvent(btn);
}

startPolling();

function addClickAnim(button) {
  button.addEventListener("click", () => {
    button.style.background = "#41ef75";
    button.style.filter = "drop-shadow(0 0 20px #41ef75)";
    setTimeout(() => {
      button.style.background = null;
      button.style.filter = null;
    }, 200);
  });
}

function addLaunchEvent(button) {
  button.addEventListener("click", () => {
    window.electronAPI.launchApp(button.id);
  });
}
