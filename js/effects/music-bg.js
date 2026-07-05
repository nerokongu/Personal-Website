export function initMusicBackground(audioSystem) {
  const { analyser, dataArray } = audioSystem;

  const bgCanvas = document.getElementById("music-bg");
  const bgCtx = bgCanvas.getContext("2d");

  function resizeBG() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  }
  resizeBG();
  window.addEventListener("resize", resizeBG);

  function drawMusicBackground() {

    if (!document.body.classList.contains("music-open")) {
      requestAnimationFrame(drawMusicBackground);
      return;
    }

    analyser.getByteFrequencyData(dataArray);

    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    const cx = bgCanvas.width / 2;
    const cy = bgCanvas.height / 2;

    // ===== BASS =====
    const bass =
      dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 20;

    const bassPower = bass / 255;

    // ===== MID =====
    const mid =
      dataArray.slice(20, 80).reduce((a, b) => a + b, 0) / 60;

    const midPower = mid / 255;

    // ===== BASE GLOW =====
    const radius = 140  + bassPower * 140 ;

    const gradient = bgCtx.createRadialGradient(
      cx, cy, radius * 0.2,
      cx, cy, radius
    );

    gradient.addColorStop(0, `rgba(255,80,80,${0.12 + bassPower * 0.28})`);
    gradient.addColorStop(0.6, `rgba(255,255,255,${0.05 + midPower * 0.15})`);
    gradient.addColorStop(1, `rgba(0,0,0,0)`);

    bgCtx.fillStyle = gradient;
    bgCtx.beginPath();
    bgCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    bgCtx.fill();

    // ===== WAVE RINGS (3D FEEL) =====
    for (let i = 0; i < 5; i++) {
      const r = radius + i * 60 + Math.sin(performance.now() / 800 + i) * 20;

      bgCtx.strokeStyle = `rgba(255,255,255,${0.04 - i * 0.006})`;
      bgCtx.lineWidth = 2;

      bgCtx.beginPath();
      bgCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bgCtx.stroke();
    }

    // ===== FLOATING PARTICLES =====
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = radius + Math.random() * 300;

      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;

      bgCtx.fillStyle = `rgba(255,255,255,${0.03 + midPower * 0.08})`;
      bgCtx.fillRect(x, y, 2, 2);
    }

    requestAnimationFrame(drawMusicBackground);
  }

  drawMusicBackground();
}