export function initMusicBackground(audioSystem) {
  const { analyser, dataArray } = audioSystem;

  const canvas = document.getElementById("music-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const eyeBtn = document.getElementById("music-eye-toggle");
  
  const eyeModelWrap = document.getElementById("music-eye-model-wrap");
  const eyeModel = document.getElementById("music-eye-model");

  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    sx: window.innerWidth / 2,
    sy: window.innerHeight / 2
  };

  window.addEventListener("mousemove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  });

  let w = 0;
  let h = 0;
  let dpr = 1;

  let dust = [];
  let streaks = [];

  let eyeMode = false;
  let eyeTransition = 0;

  const leftGlow = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    radius: 320
  };

  const orbitConfig = [
    { radius: 150, count: 3, speed: 0.16, size: 2.1 },
    { radius: 235, count: 2, speed: -0.11, size: 1.9 },
    { radius: 330, count: 2, speed: 0.08, size: 1.75 },
    { radius: 430, count: 1, speed: -0.06, size: 1.7 }
  ];

  if (eyeBtn) {
    eyeBtn.addEventListener("click", () => {
      eyeMode = !eyeMode;
      document.body.classList.toggle("music-eye-mode", eyeMode);

      const icon = eyeBtn.querySelector("i");

      if (icon) {
        icon.className = eyeMode
          ? "fa-solid fa-eye-slash"
          : "fa-solid fa-eye";
      }
    });
  }


  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    w = window.innerWidth;
    h = window.innerHeight;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createScene();

    if (!pointer.x && !pointer.y) {
      pointer.x = pointer.sx = w * 0.5;
      pointer.y = pointer.sy = h * 0.5;
    }
  }

  function createScene() {
    dust = Array.from({ length: 10 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.1 + 0.5,
      vx: (Math.random() - 0.5) * 0.05,
      vy: (Math.random() - 0.5) * 0.05,
      alpha: Math.random() * 0.12 + 0.05
    }));

    streaks = Array.from({ length: 3 }, () => ({
      x: Math.random() * w,
      y: 100 + Math.random() * (h - 200),
      len: Math.random() * 100 + 70,
      speed: Math.random() * 0.14 + 0.07,
      alpha: Math.random() * 0.045 + 0.02
    }));

    leftGlow.x = w * 0.22;
    leftGlow.y = h * 0.34;

    pickNewGlowTarget();
  }

  function pickNewGlowTarget() {
    leftGlow.tx = w * (0.12 + Math.random() * 0.3);
    leftGlow.ty = h * (0.18 + Math.random() * 0.5);
    leftGlow.radius = 260 + Math.random() * 140;
  }

  function avg(from, to) {
    let sum = 0;

    for (let i = from; i < to; i++) {
      sum += dataArray[i] || 0;
    }

    return sum / Math.max(1, to - from) / 255;
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function updateGlow(speedBoost) {
    const dx = leftGlow.tx - leftGlow.x;
    const dy = leftGlow.ty - leftGlow.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      pickNewGlowTarget();
    }

    const lerp = 0.006 + speedBoost * 0.02;

    leftGlow.x += dx * lerp;
    leftGlow.y += dy * lerp;
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  resize();
  window.addEventListener("resize", resize);

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }


  function updateEyeModel(time, bass, mid, impact, t) {
    if (!eyeModelWrap || !eyeModel) return;

    const eyeX = leftGlow.x;
    const eyeY = leftGlow.y;

    const dx = pointer.sx - eyeX;
    const dy = pointer.sy - eyeY;

    /*
      Tăng biên độ nhìn.
      X bị đảo vì model này trái/phải ngược.
      Y giữ đúng hướng: chuột lên => mắt ngước lên.
    */
    const maxLookX = 64;
    const maxLookY = 70;

    const lookX = clamp(-dx * 0.08, -maxLookX, maxLookX);
    const lookY = clamp(dy * 0.09, -maxLookY, maxLookY);

    const scale =
      0.68 +
      t * 0.12 +
      bass * 0.06 +
      Math.sin(time * 1.5) * 0.012;

    const rotate =
      Math.sin(time * 0.75) * 1.6 +
      impact * 1.2;

    eyeModelWrap.style.left = `${eyeX}px`;
    eyeModelWrap.style.top = `${eyeY}px`;

    eyeModelWrap.style.setProperty("--eye-model-scale", scale.toFixed(3));
    eyeModelWrap.style.setProperty("--eye-model-rotate", `${rotate.toFixed(2)}deg`);

    eyeModel.style.setProperty("--eye-model-look-x", `${lookX * 0.14}px`);
    eyeModel.style.setProperty("--eye-model-look-y", `${lookY * 0.1}px`);

    const baseTheta = 0;
    const basePhi = 76;

    const orbitTheta = baseTheta + lookX * 0.9;
    const orbitPhi = clamp(basePhi - lookY * 0.82, 32, 122);
    const orbitRadius = 2.75 - bass * 0.08;

    eyeModel.setAttribute(
      "camera-orbit",
      `${orbitTheta.toFixed(2)}deg ${orbitPhi.toFixed(2)}deg ${orbitRadius.toFixed(2)}m`
    );

    eyeModel.setAttribute(
      "field-of-view",
      `${(31 - bass * 2).toFixed(2)}deg`
    );

    if (t > 0.04) {
      eyeModelWrap.style.filter = `
        drop-shadow(0 0 ${26 + bass * 34}px rgba(255,80,80,${0.34 + impact * 0.24}))
        drop-shadow(0 0 ${86 + bass * 70}px rgba(255,20,20,${0.14 + impact * 0.18}))
      `;
    } else {
      eyeModelWrap.style.filter = `
        drop-shadow(0 0 24px rgba(255,80,80,0.2))
        drop-shadow(0 0 70px rgba(255,40,40,0.08))
      `;
    }
  }

  function draw() {
    requestAnimationFrame(draw);

    if (!document.body.classList.contains("music-open")) return;

    analyser.getByteFrequencyData(dataArray);

    const time = performance.now() * 0.001;

    const bass = avg(0, 18);
    const mid = avg(18, 78);
    const high = avg(78, 128);

    const impact = Math.min(1, bass * 0.6 + mid * 0.3 + high * 0.2);
    pointer.sx += (pointer.x - pointer.sx) * 0.1;
    pointer.sy += (pointer.y - pointer.sy) * 0.1;

    eyeTransition += ((eyeMode ? 1 : 0) - eyeTransition) * 0.045;
    updateEyeModel(time, bass, mid, impact, eyeTransition);

    updateGlow(impact);

    ctx.clearRect(0, 0, w, h);

    const redTheme = 0;

    drawBaseBackground(bass, mid, redTheme);
    drawLeftMovingGlow(bass, impact, redTheme);

    drawCraterOrbit(time, bass, mid, high, impact, redTheme);

    drawDust(redTheme);
    drawLightStreaks(redTheme);

    drawBottomEqualizer(time, bass, mid, high, eyeTransition);

    drawVignette(redTheme);
  }

  function drawBaseBackground(bass, mid, t) {
    const bg = ctx.createLinearGradient(0, 0, w, h);

    const redA = `rgb(${Math.round(mix(18, 3, t))}, ${Math.round(mix(2, 10, t))}, ${Math.round(mix(2, 3, t))})`;
    const redB = `rgb(${Math.round(mix(4, 2, t))}, ${Math.round(mix(4, 8, t))}, ${Math.round(mix(4, 2, t))})`;
    const redC = `rgb(${Math.round(mix(9, 4, t))}, ${Math.round(mix(1, 12, t))}, ${Math.round(mix(1, 1, t))})`;

    bg.addColorStop(0, redA);
    bg.addColorStop(0.44, redB);
    bg.addColorStop(1, redC);

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const softWhite = ctx.createRadialGradient(
      w * 0.44,
      h * 0.46,
      20,
      w * 0.44,
      h * 0.46,
      230 + bass * 60
    );

    softWhite.addColorStop(0, `rgba(${Math.round(mix(255, 215, t))},255,${Math.round(mix(255, 85, t))},${0.018 + bass * 0.022})`);
    softWhite.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = softWhite;
    ctx.fillRect(0, 0, w, h);
  }

  function drawLeftMovingGlow(bass, impact, t) {
    const radius = leftGlow.radius + bass * 120 + impact * 35;

    const g = ctx.createRadialGradient(
      leftGlow.x,
      leftGlow.y,
      20,
      leftGlow.x,
      leftGlow.y,
      radius
    );

    const r1 = Math.round(mix(255, 205, t));
    const g1 = Math.round(mix(70, 255, t));
    const b1 = Math.round(mix(70, 30, t));

    const r2 = Math.round(mix(120, 70, t));
    const g2 = Math.round(mix(18, 150, t));
    const b2 = Math.round(mix(18, 8, t));

    g.addColorStop(0, `rgba(255,255,255,${0.055 + bass * 0.045})`);
    g.addColorStop(0.2, `rgba(${r1},${g1},${b1},${0.16 + impact * 0.18})`);
    g.addColorStop(0.52, `rgba(${r2},${g2},${b2},${0.11 + bass * 0.06})`);
    g.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawCraterOrbit(time, bass, mid, high, impact, t) {
    const cx = w * 0.67;
    const cy = h * 0.5;

    const redHueShift = impact > 0.55 ? Math.sin(time * 6) * 28 : 0;
    const ringHue = mix(redHueShift, 78 + Math.sin(time * 1.5) * 14, t);
    const arcHue = mix(redHueShift * 1.15, 92 + Math.sin(time * 2.2) * 18, t);

    const pit = ctx.createRadialGradient(
      cx,
      cy,
      20,
      cx,
      cy,
      250 + bass * 45
    );

    pit.addColorStop(0, `rgba(0,0,0,${0.42 + t * 0.12})`);
    pit.addColorStop(0.34, `rgba(${Math.round(mix(120, 70, t))},${Math.round(mix(18, 120, t))},${Math.round(mix(18, 8, t))},${0.08 + bass * 0.06})`);
    pit.addColorStop(0.7, `rgba(${Math.round(mix(255, 210, t))},${Math.round(mix(60, 255, t))},${Math.round(mix(60, 50, t))},${0.055 + mid * 0.04})`);
    pit.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = pit;
    ctx.beginPath();
    ctx.arc(cx, cy, 260 + bass * 55, 0, Math.PI * 2);
    ctx.fill();

    const ringRadii = [145, 225, 315, 405, 505];

    ringRadii.forEach((radius, index) => {
      const depthDelay = index * 0.45;

      const breathe =
        Math.sin(time * 1.35 - depthDelay) * (5 + index * 1.2) +
        bass * (18 + index * 5);

      const r = radius + breathe;

      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,0,0,${0.18 - index * 0.018})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);

      const alpha = Math.max(
        0.018,
        0.062 - index * 0.007 + high * 0.016 + impact * 0.016
      );

      ctx.strokeStyle = `hsla(${ringHue}, 92%, ${mix(78, 66, t) - index * 3}%, ${alpha})`;
      ctx.lineWidth = 0.85;
      ctx.stroke();

      const highlightStart = -0.8 + index * 0.35 + Math.sin(time * 0.35) * 0.08;
      const highlightEnd = highlightStart + 0.82 + bass * 0.18;

      ctx.beginPath();
      ctx.arc(cx, cy, r, highlightStart, highlightEnd);
      ctx.strokeStyle = `hsla(${arcHue}, 95%, ${mix(66, 62, t)}%, ${0.095 - index * 0.012 + impact * 0.08})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });

    for (let i = 0; i < 4; i++) {
      const radius =
        155 +
        i * 88 +
        Math.sin(time * 1.1 + i) * 6 +
        bass * 16;

      const start = time * (0.24 + i * 0.035) + i * 1.75;
      const arcLen = 0.34 + bass * 0.16;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, start + arcLen);
      ctx.strokeStyle = `hsla(${arcHue}, 95%, ${mix(60, 58, t)}%, ${0.13 - i * 0.02 + bass * 0.08})`;
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }

    drawOrbitDots(cx, cy, time, bass, high, arcHue, impact, t);
  }

  function drawOrbitDots(cx, cy, time, bass, high, arcHue, impact, t) {
    orbitConfig.forEach((orbit, orbitIndex) => {
      for (let i = 0; i < orbit.count; i++) {
        const angle =
          time * orbit.speed +
          (Math.PI * 2 * i) / orbit.count +
          orbitIndex * 0.8;

        const radius =
          orbit.radius +
          Math.sin(time * 1.2 - orbitIndex * 0.5) * 4 +
          bass * 8;

        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        const size = orbit.size + bass * 0.7;
        const glowSize = size * 5.5;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, glowSize);

        glow.addColorStop(0, `rgba(255,255,255,${0.74 + high * 0.12})`);
        glow.addColorStop(0.35, `hsla(${arcHue}, 95%, ${mix(70, 64, t)}%, ${0.18 + impact * 0.08})`);
        glow.addColorStop(1, "rgba(255,255,255,0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${Math.round(mix(255, 225, t))},255,${Math.round(mix(255, 110, t))},0.9)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawDust(t) {
    dust.forEach((p) => {
      p.x += p.vx * (1 + t * 0.7);
      p.y += p.vy * (1 + t * 0.7);

      if (p.x < -12) p.x = w + 12;
      if (p.x > w + 12) p.x = -12;
      if (p.y < -12) p.y = h + 12;
      if (p.y > h + 12) p.y = -12;

      ctx.fillStyle = `rgba(${Math.round(mix(255, 210, t))},255,${Math.round(mix(255, 90, t))},${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawLightStreaks(t) {
    streaks.forEach((s) => {
      s.x -= s.speed * (1 + t * 0.6);

      if (s.x < -s.len - 80) {
        s.x = w + Math.random() * 140;
        s.y = 100 + Math.random() * (h - 200);
      }

      const g = ctx.createLinearGradient(s.x, s.y, s.x + s.len, s.y - 16);

      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(
        0.5,
        `rgba(${Math.round(mix(255, 210, t))},${Math.round(mix(110, 255, t))},${Math.round(mix(110, 70, t))},${s.alpha + t * 0.025})`
      );
      g.addColorStop(1, "rgba(255,255,255,0)");

      ctx.strokeStyle = g;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len, s.y - 16);
      ctx.stroke();
    });
  }

  function drawBottomEqualizer(time, bass, mid, high, t) {
    const startX = w * 0.08;
    const endX = w * 0.92;
    const width = endX - startX;

    // đặt cao hơn mép dưới để không dính / đè
    const baseY = h - 10;

    // ===== LINE 1: glow lớn =====
    ctx.beginPath();

    const points = 170;

    for (let i = 0; i <= points; i++) {
      const p = i / points;
      const x = startX + p * width;

      const dataIndex = Math.floor(p * 120);
      const value = (dataArray[dataIndex] || 0) / 255;

      const normalWave =
        Math.sin(time * 2.2 + p * Math.PI * 8) * (5 + bass * 10) +
        Math.sin(time * 1.6 + p * Math.PI * 18) * (2 + mid * 5);

      const electricWave =
        Math.sin(time * 11 + i * 0.7) * (2 + t * 6) +
        Math.sin(time * 23 + i * 1.2) * (1 + t * 3);

      const amp =
        (value - 0.5) * (14 + bass * 24 + t * 18) +
        normalWave * (0.75 + (1 - t) * 0.3) +
        electricWave * t;

      const y = baseY + amp;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = t < 0.03
    ? `rgba(255,255,255,${0.12 + bass * 0.08})`
    : `rgba(255,80,80,${0.22 + high * 0.2})`;

    ctx.lineWidth = t < 0.03 ? 9 : 12;
    ctx.shadowColor = t < 0.03
      ? "rgba(255,255,255,0.16)"
      : "rgba(255,60,60,0.55)";
    ctx.shadowBlur = t < 0.03 ? 12 : 24;
    ctx.stroke();

    // ===== LINE 2: line chính =====
    ctx.beginPath();

    for (let i = 0; i <= points; i++) {
      const p = i / points;
      const x = startX + p * width;

      const dataIndex = Math.floor(p * 120);
      const value = (dataArray[dataIndex] || 0) / 255;

      const normalWave =
        Math.sin(time * 2.2 + p * Math.PI * 8) * (5 + bass * 10) +
        Math.sin(time * 1.6 + p * Math.PI * 18) * (2 + mid * 5);

      const electricWave =
        Math.sin(time * 11 + i * 0.7) * (2 + t * 6) +
        Math.sin(time * 23 + i * 1.2) * (1 + t * 3);

      const amp =
        (value - 0.5) * (14 + bass * 24 + t * 18) +
        normalWave * (0.75 + (1 - t) * 0.3) +
        electricWave * t;

      const y = baseY + amp;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    const lineGrad = ctx.createLinearGradient(startX, baseY, endX, baseY);

    if (t < 0.03) {
      lineGrad.addColorStop(0, "rgba(255,255,255,0.42)");
      lineGrad.addColorStop(0.5, "rgba(255,120,120,0.72)");
      lineGrad.addColorStop(1, "rgba(255,255,255,0.42)");
    } else {
      lineGrad.addColorStop(0, "rgba(255,210,210,0.78)");
      lineGrad.addColorStop(0.5, "rgba(255,70,70,0.96)");
      lineGrad.addColorStop(1, "rgba(255,170,170,0.82)");
    }

    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = t < 0.03 ? 2.2 : 2.8;
    ctx.shadowColor = t < 0.03
      ? "rgba(255,120,120,0.18)"
      : "rgba(255,70,70,0.85)";
    ctx.shadowBlur = t < 0.03 ? 8 : 18;
    ctx.stroke();

    if (t > 0.04) {
      ctx.beginPath();

      for (let i = 0; i <= points; i++) {
        const p = i / points;
        const x = startX + p * width;

        const dataIndex = Math.floor(p * 120);
        const value = (dataArray[dataIndex] || 0) / 255;

        const jag =
          Math.sin(time * 18 + i * 1.5) * (2 + high * 5) +
          Math.sin(time * 31 + i * 0.8) * (1.5 + bass * 4);

        const y =
          baseY -
          18 -
          value * (10 + bass * 18) +
          jag;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = `rgba(255,95,95,${0.36 + high * 0.28})`;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = "rgba(255,60,60,0.85)";
      ctx.shadowBlur = 14;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }

  function drawVignette(t) {
    const vignette = ctx.createRadialGradient(
      w * 0.5,
      h * 0.46,
      w * 0.08,
      w * 0.5,
      h * 0.46,
      w * 0.76
    );

    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, `rgba(0,0,0,${0.44 + t * 0.12})`);

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  draw();
}