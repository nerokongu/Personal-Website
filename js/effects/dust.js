export function initDust() {
  const canvas = document.getElementById("dust-canvas");
  const ctx = canvas?.getContext("2d");

  if (!canvas || !ctx) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) return;

  const particles = [];
  const MAX_PARTICLES = 120;
  const MIN_POINTER_INTERVAL = 34;
  const MIN_POINTER_DISTANCE = 5;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let running = false;
  let lastPointerTime = 0;
  let lastPointerX = -999;
  let lastPointerY = -999;

  function shouldRun() {
    return (
      !document.hidden &&
      !document.body.classList.contains("sub-page-open")
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
  }

  function addParticle(x, y) {
    if (particles.length >= MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES + 1);
    }

    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      life: 48 + Math.random() * 18,
      maxLife: 66,
      size: Math.random() * 1.25 + 0.45
    });
  }

  function onPointerMove(event) {
    if (!running) return;

    const now = performance.now();
    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;

    if (
      now - lastPointerTime < MIN_POINTER_INTERVAL ||
      dx * dx + dy * dy < MIN_POINTER_DISTANCE * MIN_POINTER_DISTANCE
    ) {
      return;
    }

    lastPointerTime = now;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    addParticle(event.clientX, event.clientY);
  }

  function draw() {
    if (!shouldRun()) {
      stop();
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (let index = particles.length - 1; index >= 0; index--) {
      const particle = particles[index];

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 1;

      const alpha = Math.max(0, particle.life / particle.maxLife) * 0.72;

      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  function start() {
    if (running || !shouldRun()) return;
    running = true;
    rafId = requestAnimationFrame(draw);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    rafId = 0;
    ctx.clearRect(0, 0, width, height);
  }

  function syncState() {
    if (shouldRun()) start();
    else stop();
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("mousemove", onPointerMove, { passive: true });
  document.addEventListener("visibilitychange", syncState);

  const bodyObserver = new MutationObserver(syncState);
  bodyObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });

  start();
}
