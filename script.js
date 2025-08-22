document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("wheelContainer");
  const addBtn = document.getElementById("addWheel");
  const clearBtn = document.getElementById("clearAll");
  const themeToggle = document.getElementById("themeToggle");

  function addWheel(title = "New Wheel") {
    const card = document.createElement("div");
    card.className = "wheel-card";
    card.innerHTML = \`
      <h2 contenteditable="true">\${title}</h2>
      <canvas width="400" height="400"></canvas>
      <button class="spinBtn">Push to Spin</button>
      <button class="deleteBtn">Delete Wheel</button>
    \`;
    container.appendChild(card);
  }

  addBtn.addEventListener("click", () => addWheel());
  clearBtn.addEventListener("click", () => {
    container.innerHTML = "";
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  // Default wheel
  addWheel("Default Wheel");
});
