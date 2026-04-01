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

// ===== MUSIC PAGE PLAYER =====
const mPlay = document.getElementById("m-play");
const mPrev = document.getElementById("m-prev");
const mNext = document.getElementById("m-next");

const mCurrent = document.getElementById("m-current");
const mDuration = document.getElementById("m-duration");
const mBar = document.querySelector(".m-bar");
const mBarFill = document.querySelector(".m-bar-fill");

const musicName = document.querySelector(".music-name");

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

async function togglePlay() {
  if (audio.paused) {
    await audioCtx.resume();
    audio.volume = 1;
    await audio.play();
  } else {
    audio.pause();
  }
}

const video = document.getElementById("bg-video");

video.addEventListener("loadeddata", () => {
  videoReady = true;
  checkReady();
});

audio.addEventListener("loadedmetadata", () => {
  audioReady = true;
  audioReadyEnter = true;

  durationEl.textContent = formatTime(audio.duration);
  mDuration.textContent = formatTime(audio.duration);

  checkReady();
});



// Update progress
audio.addEventListener("timeupdate", () => {
  const percent = (audio.currentTime / audio.duration) * 100;

  // player chính
  progressBar.style.width = percent + "%";
  currentTimeEl.textContent = formatTime(audio.currentTime);

  // music page
  mBarFill.style.width = percent + "%";
  mCurrent.textContent = formatTime(audio.currentTime);
});


playBtn.onclick = togglePlay;
mPlay.addEventListener("click", togglePlay);

mBar.addEventListener("click", (e) => {
  if (!audio.duration) return;

  const rect = mBar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;

  audio.currentTime = percent * audio.duration;
});

let audioReady = false;


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
  e.stopPropagation();

  if (overlay.classList.contains("loading")) return;

  overlay.classList.add("hidden");

  await togglePlay();   // 👈 RẤT QUAN TRỌNG
  animateGlow();
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
    // mute
    lastVolume = audio.volume;
    audio.volume = 0;
    volumeSlider.value = 0;
    volumeIcon.classList.add("muted");
  } else {
    // unmute
    audio.volume = lastVolume || 1;
    volumeSlider.value = audio.volume;
    volumeIcon.classList.remove("muted");
  }
});

const toggle = document.getElementById("menu-toggle");
const menu = document.getElementById("curtain-menu");

toggle.addEventListener("click", () => {
  menu.classList.toggle("open");
});

// click ra ngoài menu thì đóng
document.addEventListener("click", (e) => {
  if (
    menu.classList.contains("open") &&
    !menu.contains(e.target) &&
    !toggle.contains(e.target)
  ) {
    menu.classList.remove("open");
  }
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

async function loadTrack(index, autoPlay = true) {
  if (index < 0) index = tracks.length - 1;
  if (index >= tracks.length) index = 0;

  currentTrack = index;
  audio.src = tracks[currentTrack].src;

  titleEl.textContent = tracks[currentTrack].title;
  musicName.textContent = tracks[currentTrack].title;

  if (autoPlay) {
    await audioCtx.resume();
    audio.volume = 1;
    await audio.play();
  }

  syncPlayButtons();
}

prevBtn.addEventListener("click", () => {
  loadTrack(currentTrack - 1, !audio.paused);
});

nextBtn.addEventListener("click", () => {
  loadTrack(currentTrack + 1, !audio.paused);
});

mPrev.addEventListener("click", () => {
  loadTrack(currentTrack - 1, !audio.paused);
});

mNext.addEventListener("click", () => {
  loadTrack(currentTrack + 1, !audio.paused);
});

audio.addEventListener("ended", () => {
  loadTrack(currentTrack + 1, true);
});

loadTrack(0, false);


audio.addEventListener("play", () => {
  playBtn.classList.add("pause");
});

audio.addEventListener("pause", () => {
  playBtn.classList.remove("pause");
});


// ===== CONTACT POPUP =====
const contactBtn = document.getElementById("contact-btn");
const contactOverlay = document.getElementById("contact-overlay");
const contactPopup = document.getElementById("contact-popup");

contactBtn.addEventListener("click", (e) => {
  e.preventDefault();
  contactOverlay.classList.add("active");
});

// click ra ngoài popup thì đóng
contactOverlay.addEventListener("click", () => {
  contactOverlay.classList.remove("active");
});

// chặn click bên trong popup
contactPopup.addEventListener("click", (e) => {
  e.stopPropagation();
});



const openMusicBtn = document.getElementById("open-music");
const musicPage = document.getElementById("music-page");
const backMusicBtn = document.getElementById("music-back-global");

openMusicBtn.addEventListener("click", () => {
  menu.classList.remove("open");
  musicPage.classList.add("active");
  backMusicBtn.classList.add("active");

  // sync UI khi vừa mở
  syncPlayButtons();
  mCurrent.textContent = formatTime(audio.currentTime);
  mDuration.textContent = formatTime(audio.duration || 0);
});

backMusicBtn.addEventListener("click", () => {
  musicPage.classList.remove("active");
  backMusicBtn.classList.remove("active");
});

const bgCanvas = document.getElementById("music-bg");
const bgCtx = bgCanvas.getContext("2d");

function resizeBG() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
resizeBG();
window.addEventListener("resize", resizeBG);

function drawMusicBackground() {
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

function syncPlayButtons() {
  const playing = !audio.paused;

  // player chính
  if (playing) {
    playBtn.classList.add("pause");
  } else {
    playBtn.classList.remove("pause");
  }

  // player music page
  mPlay.textContent = playing ? "⏸" : "▶";
}

audio.addEventListener("play", syncPlayButtons);
audio.addEventListener("pause", syncPlayButtons);

























}

