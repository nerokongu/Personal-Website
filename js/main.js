const isPhone =
  /Android|iPhone|iPod/i.test(navigator.userAgent) &&
  !/iPad/i.test(navigator.userAgent);

if (isPhone) {
  document.getElementById("mobile-only").style.display = "flex";
  document.body.style.overflow = "hidden";
} else {
const audio = document.getElementById("music");
const playBtn = document.getElementById("play-btn");
const progressBar = document.getElementById("progress-bar");
const currentTimeEl = document.getElementById("current");
const durationEl = document.getElementById("duration");
const progress = document.getElementById("progress");
const tracks = [
  { src: "assets/music 01.mp3", title: "Track 01" },
  { src: "assets/music 02.mp3", title: "Track 02" },
  { src: "assets/music 03.mp3", title: "Track 03" },
  { src: "assets/music 04.mp3", title: "Track 04" }
];

let currentTrack = 0;

const titleEl = document.getElementById("track-title");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

const overlay = document.getElementById("start-overlay");
overlay.classList.add("loading");

let videoReady = false;
let audioReadyEnter = false;
let modelReady = false;

function checkReady() {
  console.log({
    videoReady,
    audioReadyEnter,
    modelReady
  });

  if (videoReady && audioReadyEnter && modelReady) {
    overlay.classList.remove("loading");
    console.log("✅ ALL ASSETS READY");
  }
}

const video = document.getElementById("bg-video");

video.addEventListener("loadeddata", () => {
  videoReady = true;
  checkReady();
});

audio.addEventListener("loadedmetadata", () => {
  audioReadyEnter = true;
  checkReady();
});

// Play / Pause
playBtn.onclick = async () => {
  if (audio.paused) {
    await audioCtx.resume();
    audio.volume = 0;
    await audio.play();
    fadeVolume(1);
    animateGlow();
    playBtn.textContent = "⏸";
  } else {
    fadeVolume(0);
    setTimeout(() => audio.pause(), 600);
    playBtn.textContent = "▶";
  }
};

// Update progress
audio.addEventListener("timeupdate", () => {
  const percent = (audio.currentTime / audio.duration) * 100;
  progressBar.style.width = percent + "%";

  currentTimeEl.textContent = formatTime(audio.currentTime);
});

// Duration
audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

let audioReady = false;

audio.addEventListener("loadedmetadata", () => {
  audioReady = true;
  durationEl.textContent = formatTime(audio.duration);
});

function formatTime(time) {
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60);
  return `${min}:${sec < 10 ? "0" + sec : sec}`;
}

// Click để tua nhạc
progress.addEventListener("click", (e) => {
  if (!audioReady) return;

  const rect = progress.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;

  const percent = Math.min(Math.max(clickX / width, 0), 1);

  audio.currentTime = percent * audio.duration;

  // nếu đang pause thì phát luôn
  if (audio.paused) {
    audio.play();
    playBtn.textContent = "⏸";
  }
});

overlay.addEventListener("click", async (e) => {
  e.stopPropagation(); // chặn xuyên lớp (rất quan trọng)

  if (overlay.classList.contains("loading")) {
    return; // chưa load xong → không làm gì
  }

  overlay.classList.add("hidden");

  await audioCtx.resume();
  audio.volume = 0;
  await audio.play();
  fadeVolume(1);

  animateGlow();
  playBtn.textContent = "⏸";
});

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const source = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();

analyser.fftSize = 256;

source.connect(analyser);
analyser.connect(audioCtx.destination);

const dataArray = new Uint8Array(analyser.frequencyBinCount);

function animateGlow() {
  analyser.getByteFrequencyData(dataArray);

  // bass = tần số thấp
  let bass = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
  let intensity = bass / 255;

  const card = document.querySelector(".profile-card");
  const links = document.querySelectorAll(".links a");

  card.style.boxShadow = `
    0 0 ${20 + intensity * 40}px rgba(255,255,255,${0.15 + intensity * 0.4})
  `;

   if (bmw) {
    // độ sáng tổng thể
    bmw.exposure = 0.8 + intensity * 1.2;

    // cảm giác xe "bật sáng" nhẹ
    bmw.style.filter = `
      drop-shadow(0 0 ${20 + intensity * 40}px rgba(255,102,102,${0.25 + intensity * 0.4}))
    `;
  }

  links.forEach(link => {
    link.style.boxShadow = `
      0 0 ${10 + intensity * 25}px rgba(255,255,255,${0.1 + intensity * 0.3})
    `;
  });
  

  requestAnimationFrame(animateGlow);
}


const canvas = document.getElementById("dust-canvas");
const ctx = canvas.getContext("2d");

let w, h;
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const particles = [];
const mouse = { x: null, y: null };

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;

  for (let i = 0; i < 1; i++) {
    particles.push({
      x: mouse.x,
      y: mouse.y,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      life: 60 + Math.random() * 20,
      size: Math.random() * 1.5 + 0.5
    });
  }
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

const player = document.querySelector(".audio-player");
let idleTimer = null;

function setIdle() {
  player.classList.add("idle");
}

function resetIdle() {
  player.classList.remove("idle");

  clearTimeout(idleTimer);
  idleTimer = setTimeout(setIdle, 3000);
}

// theo dõi di chuyển chuột
window.addEventListener("mousemove", resetIdle);

// khởi tạo ngay khi load
resetIdle();

function fadeVolume(target, duration = 600) {
  const start = audio.volume;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    audio.volume = start + (target - start) * progress;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

const volumeSlider = document.getElementById("volume-slider");
const volumeIcon = document.getElementById("volume-icon");

audio.volume = 1;
volumeSlider.value = 1;

let lastVolume = 1;

// kéo slider
volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
  lastVolume = audio.volume;

  if (audio.volume === 0) {
    volumeIcon.classList.add("muted");
  } else {
    volumeIcon.classList.remove("muted");
  }
});

volumeIcon.addEventListener("click", () => {
  if (audio.volume > 0) {
    lastVolume = audio.volume;
    fadeVolume(0);
    volumeSlider.value = 0;
    volumeIcon.classList.add("muted");
  } else {
    audio.volume = 0;
    fadeVolume(lastVolume || 1);
    volumeSlider.value = lastVolume || 1;
    volumeIcon.classList.remove("muted");
  }
});

const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("curtain-menu");

toggle.addEventListener("click", () => {
  menu.classList.toggle("open");
});

const bmw = document.getElementById("bmw-menu");
bmw.addEventListener("model-visibility", (e) => {
  if (e.detail.visible) {
    modelReady = true;
    console.log("✅ MODEL READY");
    checkReady();
  }
});
requestAnimationFrame(animateGlow);

// ===== BMW GAS BUTTON =====
// ===== BMW GAS BUTTON (RANDOM - FIX) =====
const revBtn = document.getElementById("rev-btn");

const engineSounds = [
  "assets/M4 engine 01.mp3",
  "assets/M4 engine 02.mp3",
  "assets/M4 engine 03.mp3"
];

let currentEngine = null;
let currentSource = null;
let revving = false;

revBtn.addEventListener("mousedown", async () => {
  if (revving) return;
  revving = true;

  await audioCtx.resume();

  // chọn ngẫu nhiên
  const sound =
    engineSounds[Math.floor(Math.random() * engineSounds.length)];

  // tạo audio MỚI mỗi lần
  currentEngine = new Audio(sound);
  currentEngine.volume = 0.45;
  currentEngine.loop = false;

  // connect vào analyser
  currentSource = audioCtx.createMediaElementSource(currentEngine);
  currentSource.connect(analyser);
  currentSource.connect(audioCtx.destination);

  currentEngine.play();
});

window.addEventListener("mouseup", () => {
  if (!revving) return;
  revving = false;

  if (currentEngine) {
    currentEngine.pause();
    currentEngine.currentTime = 0;
  }

  if (currentSource) {
    currentSource.disconnect();
    currentSource = null;
  }

  currentEngine = null;
});

function loadTrack(index, autoPlay = true) {
  currentTrack = (index + tracks.length) % tracks.length;

  audio.src = tracks[currentTrack].src;
  titleEl.textContent = tracks[currentTrack].title;

  audio.load(); // BẮT BUỘC

  progressBar.style.width = "0%";
  currentTimeEl.textContent = "0:00";
}

prevBtn.addEventListener("click", () => {
  loadTrack(currentTrack - 1, !audio.paused);
});

nextBtn.addEventListener("click", () => {
  loadTrack(currentTrack + 1, !audio.paused);
});

audio.addEventListener("ended", () => {
  loadTrack(currentTrack + 1, true);
});

loadTrack(0, false);





}