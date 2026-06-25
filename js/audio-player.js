import { tracks } from "./config.js";
import { formatTime, clamp } from "./utils.js";

export function initAudioPlayer() {
  const audio = document.getElementById("music");

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
  analyser.connect(audioCtx.destination);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  let currentTrack = 0;
  let audioReady = false;

  async function togglePlay() {
    if (audio.paused) {
      await audioCtx.resume();
      audio.volume = 1;
      await audio.play();
    } else {
      audio.pause();
    }
  }

  async function loadTrack(index, autoPlay = true) {
    if (index < 0) index = tracks.length - 1;
    if (index >= tracks.length) index = 0;

    currentTrack = index;
    audio.src = tracks[currentTrack].src;
    titleEl.textContent = tracks[currentTrack].title;

    if (autoPlay) {
      await audioCtx.resume();
      audio.volume = 1;
      await audio.play();
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
    getCurrentTrack: () => currentTrack
  };
}