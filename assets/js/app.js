import { startPolling } from "./gamepad.js";

export let buttons = [];
const isLoaded = await window.electronAPI.isLoaded();
console.log(isLoaded);

// close button
let closeButton = document.getElementById("close");
closeButton.addEventListener("click", () => {
  window.close();
});

loadApps();
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

function launchApp(event) {
  console.log(event);
}

function loadApps() {
  fetch("apps.json")
    .then((response) => response.json())
    .then((json) => {
      let container = document.getElementById("shortcuts");
      container.innerHTML = "";
      for (const app of json) {
        let btn = document.createElement("div");
        btn.classList.add("button");
        btn.classList.add("app");
        btn.classList.add(app.name);
        btn.id = app.name;
        let btnImg = document.createElement("img");
        btnImg.src = app.icon;
        btn.appendChild(btnImg);
        container.appendChild(btn);
        buttons.push(btn);
        addClickAnim(btn);
        btn.addEventListener("click", async () => {
          window.electronAPI.launchApp(app.name);
        });
      }
    });
}
