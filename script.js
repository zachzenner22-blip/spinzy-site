document.addEventListener("DOMContentLoaded", () => {
  const wheelArea = document.getElementById("wheelArea");
  const addWheelBtn = document.getElementById("addWheel");
  const clearBtn = document.getElementById("clearWheels");
  const toggleTheme = document.getElementById("toggleTheme");

  function createWheel(title = "Wheel") {
    const container = document.createElement("div");
    container.className = "wheel-container";
    container.innerHTML = `
      <h2 contenteditable="true">${title}</h2>
      <canvas width="300" height="300"></canvas>
      <button class="spinBtn">Push to Spin</button>
      <button class="deleteBtn">Delete Wheel</button>
    `;
    wheelArea.appendChild(container);
  }

  addWheelBtn.addEventListener("click", () => createWheel("New Wheel"));
  clearBtn.addEventListener("click", () => {
    wheelArea.innerHTML = "";
    createWheel("Default Wheel");
  });
  toggleTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  // start with one wheel
  createWheel("Default Wheel");
});
