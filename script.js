document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("wheel-container");

  // Create default wheel
  const canvas = document.createElement("canvas");
  canvas.width = 500;
  canvas.height = 500;
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const names = ["Alice", "Bob", "Charlie", "Diana"];
  const colors = ["#FF6384","#36A2EB","#FFCE56","#4BC0C0"];
  let currentAngle = 0;

  function drawWheel() {
    const slice = (2 * Math.PI) / names.length;
    for (let i = 0; i < names.length; i++) {
      ctx.beginPath();
      ctx.moveTo(250, 250);
      ctx.fillStyle = colors[i % colors.length];
      ctx.arc(250, 250, 250, slice * i + currentAngle, slice * (i+1) + currentAngle);
      ctx.fill();
      ctx.save();
      ctx.translate(250,250);
      ctx.rotate(slice * i + slice/2 + currentAngle);
      ctx.textAlign = "right";
      ctx.fillStyle = "#000";
      ctx.font = "20px Arial";
      ctx.fillText(names[i], 230, 10);
      ctx.restore();
    }
  }

  drawWheel();
});
