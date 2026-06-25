export function initDust() {
  const canvas = document.getElementById("dust-canvas");
  const ctx = canvas.getContext("2d");

  let w;
  let h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener("resize", resize);

  const particles = [];

  window.addEventListener("mousemove", (e) => {
    particles.push({
      x: e.clientX,
      y: e.clientY,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      life: 60 + Math.random() * 20,
      size: Math.random() * 1.5 + 0.5
    });
  });

  function animateDust() {
    ctx.clearRect(0, 0, w, h);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      ctx.fillStyle = `rgba(255,255,255,${p.life / 100})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (p.life <= 0) particles.splice(i, 1);
    }

    requestAnimationFrame(animateDust);
  }

  animateDust();
}