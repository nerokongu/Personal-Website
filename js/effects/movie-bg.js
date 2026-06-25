export function initMovieBackground() {
    // ===== MOVIE BACKGROUND ANIMATION =====
  const movieCanvas = document.getElementById("movie-bg");
  const movieCtx = movieCanvas.getContext("2d");

  let movieW, movieH;
  let movieParticles = [];

  function resizeMovieBG() {
    movieW = movieCanvas.width = window.innerWidth;
    movieH = movieCanvas.height = window.innerHeight;

    movieParticles = Array.from({ length: 70 }, () => ({
      x: Math.random() * movieW,
      y: Math.random() * movieH,
      size: Math.random() * 2 + 0.6,
      speed: Math.random() * 0.5 + 0.15,
      alpha: Math.random() * 0.45 + 0.12
    }));
  }

  resizeMovieBG();
  window.addEventListener("resize", resizeMovieBG);

  function drawMovieBackground() {
    movieCtx.clearRect(0, 0, movieW, movieH);

    const time = performance.now() * 0.001;

    const gradient = movieCtx.createRadialGradient(
      movieW * 0.5,
      movieH * 0.25,
      40,
      movieW * 0.5,
      movieH * 0.45,
      movieW * 0.8
    );

    gradient.addColorStop(0, "rgba(120,20,20,0.28)");
    gradient.addColorStop(0.45, "rgba(20,20,25,0.88)");
    gradient.addColorStop(1, "rgba(0,0,0,1)");

    movieCtx.fillStyle = gradient;
    movieCtx.fillRect(0, 0, movieW, movieH);

    for (let i = 0; i < 4; i++) {
      const y = ((time * 35 + i * movieH / 4) % movieH);
      movieCtx.fillStyle = "rgba(255,255,255,0.035)";
      movieCtx.fillRect(0, y, movieW, 1.5);
    }

    movieCtx.fillStyle = "rgba(255,255,255,0.045)";
    for (let y = -40; y < movieH + 40; y += 52) {
      const offset = (time * 22) % 52;
      movieCtx.fillRect(34, y + offset, 14, 24);
      movieCtx.fillRect(movieW - 48, y + offset, 14, 24);
    }

    movieParticles.forEach(p => {
      p.y -= p.speed;

      if (p.y < -10) {
        p.y = movieH + 10;
        p.x = Math.random() * movieW;
      }

      movieCtx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      movieCtx.beginPath();
      movieCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      movieCtx.fill();
    });

    const pulse = 0.5 + Math.sin(time * 2) * 0.5;

    movieCtx.fillStyle = `rgba(255,50,50,${0.035 + pulse * 0.035})`;
    movieCtx.beginPath();
    movieCtx.ellipse(
      movieW / 2,
      movieH * 0.55,
      280 + pulse * 60,
      90,
      0,
      0,
      Math.PI * 2
    );
    movieCtx.fill();

    requestAnimationFrame(drawMovieBackground);
  }

  drawMovieBackground();
}
