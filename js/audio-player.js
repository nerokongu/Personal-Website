import { tracks as defaultTracks } from "./config.js";
import { formatTime, clamp } from "./utils.js";

export function initAudioPlayer() {
  const audio = document.getElementById("music");
  audio.crossOrigin = "anonymous";

  const playBtn = document.getElementById("play-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  const progress = document.getElementById("progress");
  const progressBar = document.getElementById("progress-bar");

  const currentTimeEl = document.getElementById("current");
  const durationEl = document.getElementById("duration");
  const titleEl = document.getElementById("track-title");

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  const source = audioCtx.createMediaElementSource(audio);
  const analyser = audioCtx.createAnalyser();

  analyser.fftSize = 256;

  source.connect(analyser);
  source.connect(audioCtx.destination);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  let tracks = [...defaultTracks];

  let currentTrack = 0;
  let audioReady = false;

  const VOLUME_KEY = "neroGlobalVolume";
const MUTED_KEY = "neroGlobalMuted";
const LAST_VOLUME_KEY = "neroLastVolume";

function readNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

let globalVolume = readNumber(localStorage.getItem(VOLUME_KEY), 0.85);
let lastVolume = readNumber(localStorage.getItem(LAST_VOLUME_KEY), globalVolume || 0.85);
let globalMuted = localStorage.getItem(MUTED_KEY) === "1";

globalVolume = clamp(globalVolume, 0, 1);
lastVolume = clamp(lastVolume, 0.01, 1);

audio.volume = globalVolume;
audio.muted = globalMuted;

function saveVolumeState() {
  globalMuted = audio.muted;

  localStorage.setItem(VOLUME_KEY, String(globalVolume));
  localStorage.setItem(MUTED_KEY, globalMuted ? "1" : "0");
  localStorage.setItem(LAST_VOLUME_KEY, String(lastVolume));
}

function emitVolumeSync() {
  window.dispatchEvent(new CustomEvent("nero-volume-sync"));
}

function setVolume(value) {
  const nextVolume = clamp(Number(value), 0, 1);

  globalVolume = nextVolume;
  audio.volume = nextVolume;
  audio.muted = nextVolume === 0;

  if (nextVolume > 0) {
    lastVolume = nextVolume;
  }

  saveVolumeState();
  emitVolumeSync();
}

function toggleMute() {
  if (!audio.muted && audio.volume > 0) {
    lastVolume = audio.volume;
    audio.muted = true;
  } else {
    const restoreVolume = lastVolume || globalVolume || 0.85;

    globalVolume = restoreVolume;
    audio.volume = restoreVolume;
    audio.muted = false;
  }

  saveVolumeState();
  emitVolumeSync();
}

function restoreVolume() {
  globalVolume = readNumber(localStorage.getItem(VOLUME_KEY), globalVolume || 0.85);
  lastVolume = readNumber(localStorage.getItem(LAST_VOLUME_KEY), lastVolume || globalVolume || 0.85);
  globalMuted = localStorage.getItem(MUTED_KEY) === "1";

  globalVolume = clamp(globalVolume, 0, 1);
  lastVolume = clamp(lastVolume, 0.01, 1);

  audio.volume = globalVolume;
  audio.muted = globalMuted;

  emitVolumeSync();
}

function getVolumeState() {
  return {
    volume: audio.volume,
    muted: audio.muted,
    realVolume: audio.muted ? 0 : audio.volume,
    lastVolume
  };
}

  async function togglePlay() {
    try {
      if (audio.paused) {
        await audioCtx.resume();

        if (!audio.src) {
          console.warn("⚠️ Audio chưa có src để phát.");
          return;
        }

        await audio.play();
      } else {
        audio.pause();
      }
    } catch (err) {
      console.warn("⚠️ audio.play() thất bại:", err);
    }

    syncPlayButtons();
  }

  async function loadTrack(index, autoPlay = true) {
    if (index < 0) index = tracks.length - 1;
    if (index >= tracks.length) index = 0;

    currentTrack = index;
    audio.pause();

    audioReady = false;
    audio.crossOrigin = "anonymous";
    audio.src = tracks[currentTrack].src;
    audio.load();

    titleEl.textContent = tracks[currentTrack].title;

    if (autoPlay) {
      try {
        await audioCtx.resume();
        await audio.play();
      } catch (err) {
        console.warn("⚠️ Không phát được bài này:", err);
      }
    }

    syncPlayButtons();
  }

  function syncPlayButtons() {
    if (audio.paused) {
      playBtn.classList.remove("pause");
    } else {
      playBtn.classList.add("pause");
    }
  }

  audio.addEventListener("loadedmetadata", () => {
    audioReady = true;
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;

    const percent = audio.currentTime / audio.duration * 100;

    progressBar.style.width = percent + "%";
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  progress.addEventListener("click", (e) => {
    if (!audioReady) return;

    const rect = progress.getBoundingClientRect();
    const percent = clamp((e.clientX - rect.left) / rect.width, 0, 1);

    audio.currentTime = percent * audio.duration;
  });

  playBtn.addEventListener("click", togglePlay);
  prevBtn.addEventListener("click", () => loadTrack(currentTrack - 1, !audio.paused));
  nextBtn.addEventListener("click", () => loadTrack(currentTrack + 1, !audio.paused));

  audio.addEventListener("ended", () => {
    loadTrack(currentTrack + 1, true);
  });

  audio.addEventListener("play", syncPlayButtons);
  audio.addEventListener("pause", syncPlayButtons);

  loadTrack(0, false);

  return {
    audio,
    audioCtx,
    analyser,
    dataArray,
    togglePlay,
    loadTrack,
    syncPlayButtons,
    setVolume,
    toggleMute,
    restoreVolume,
    getVolumeState,
    setTracks: (newTracks) => {
      if (!Array.isArray(newTracks) || !newTracks.length) return;

      tracks = newTracks;
      currentTrack = 0;
      loadTrack(0, false);
    },
    getTracks: () => tracks,
    getCurrentTrack: () => currentTrack
  };
}