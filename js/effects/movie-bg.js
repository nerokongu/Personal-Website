export function initMovieBackground() {
  const canvas = document.getElementById("movie-bg");
  const ctx = canvas?.getContext("2d");

  if (!canvas || !ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let rafId = 0;
  let running = false;
  let lastFrame = 0;

  const FRAME_INTERVAL = 34;

  function shouldRun() {
    return (
      !document.hidden &&
      document.body.classList.contains("movie-open")
    );
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(70, Math.max(36, Math.floor(width / 24)));

    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.5,
      speed: Math.random() * 0.45 + 0.12,
      alpha: Math.random() * 0.38 + 0.1
    }));
  }

  function render(time) {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(
      width * 0.5,
      height * 0.25,
      40,
      width * 0.5,
      height * 0.45,
      width * 0.8
    );

    gradient.addColorStop(0, "rgba(120,20,20,0.28)");
    gradient.addColorStop(0.45, "rgba(20,20,25,0.88)");
    gradient.addColorStop(1, "rgba(0,0,0,1)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let index = 0; index < 4; index++) {
      const y = (time * 35 + index * height / 4) % height;
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.fillRect(0, y, width, 1.5);
    }

    ctx.fillStyle = "rgba(255,255,255,0.045)";
    for (let y = -40; y < height + 40; y += 52) {
      const offset = (time * 22) % 52;
      ctx.fillRect(34, y + offset, 14, 24);
      ctx.fillRect(width - 48, y + offset, 14, 24);
    }

    particles.forEach(particle => {
      particle.y -= particle.speed;

      if (particle.y < -10) {
        particle.y = height + 10;
        particle.x = Math.random() * width;
      }

      ctx.fillStyle = `rgba(255,255,255,${particle.alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

    const pulse = 0.5 + Math.sin(time * 2) * 0.5;

    ctx.fillStyle = `rgba(255,50,50,${0.035 + pulse * 0.035})`;
    ctx.beginPath();
    ctx.ellipse(
      width / 2,
      height * 0.55,
      280 + pulse * 60,
      90,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  function loop(timestamp) {
    if (!shouldRun()) {
      stop();
      return;
    }

    rafId = requestAnimationFrame(loop);

    if (timestamp - lastFrame < FRAME_INTERVAL) return;
    lastFrame = timestamp;
    render(timestamp * 0.001);
  }

  function start() {
    if (running || !shouldRun()) return;
    running = true;
    lastFrame = 0;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function syncState() {
    if (shouldRun()) start();
    else stop();
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", syncState);

  const bodyObserver = new MutationObserver(syncState);
  bodyObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });

  syncState();
}
