document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const addWheelBtn = document.getElementById("addWheel");
  const clearWheelsBtn = document.getElementById("clearWheels");

  let wheels = [];

  function createWheel(title = "Wheel") {
    const container = document.createElement("div");
    container.className = "wheel-container";

    const heading = document.createElement("h2");
    heading.contentEditable = true;
    heading.textContent = title;
    container.appendChild(heading);

    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;
    canvas.id = "wheelCanvas";
    container.appendChild(canvas);

    const spinBtn = document.createElement("button");
    spinBtn.textContent = "Push to Spin";
    container.appendChild(spinBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete Wheel";
    deleteBtn.onclick = () => container.remove();
    container.appendChild(deleteBtn);

    app.appendChild(container);
    wheels.push({canvas, spinBtn});
  }

  addWheelBtn.addEventListener("click", () => createWheel("New Wheel"));
  clearWheelsBtn.addEventListener("click", () => {
    app.innerHTML = "";
    wheels = [];
  });
  darkModeToggle.addEventListener("click", () => document.body.classList.toggle("dark"));

  // Create a default wheel on load
  createWheel("Default Wheel");
});
