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

  const DEFAULT_VOLUME = 0.5;

  // Mỗi lần vào website: âm lượng bắt đầu ở 50% và không bị mute.
  let globalVolume = DEFAULT_VOLUME;
  let lastVolume = DEFAULT_VOLUME;
  let globalMuted = false;

  audio.volume = DEFAULT_VOLUME;
  audio.muted = false;

  localStorage.setItem(VOLUME_KEY, String(DEFAULT_VOLUME));
  localStorage.setItem(MUTED_KEY, "0");
  localStorage.setItem(LAST_VOLUME_KEY, String(DEFAULT_VOLUME));

  function saveVolumeState() {
    globalVolume = audio.volume;
    globalMuted = audio.muted;

    if (!globalMuted && globalVolume > 0) {
      lastVolume = globalVolume;
    }

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
      const restoreValue = clamp(lastVolume || globalVolume || 0.5, 0.01, 1);

      globalVolume = restoreValue;
      audio.volume = restoreValue;
      audio.muted = false;
    }

    saveVolumeState();
    emitVolumeSync();
  }

  function restoreVolume() {
    globalVolume = clamp(
      readNumber(localStorage.getItem(VOLUME_KEY), globalVolume || 0.5),
      0,
      1
    );

    lastVolume = clamp(
      readNumber(localStorage.getItem(LAST_VOLUME_KEY), lastVolume || globalVolume || 0.5),
      0.01,
      1
    );

    globalMuted = localStorage.getItem(MUTED_KEY) === "1";

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

  async function startFromEntry() {
    try {
      // Click đầu tiên luôn mở âm thanh ở 50%.
      setVolume(DEFAULT_VOLUME);

      await audioCtx.resume();

      if (!audio.src) {
        console.warn("⚠️ Audio chưa có src để phát.");
        return;
      }

      // Không dùng toggle ở đây vì nếu audio đã chạy thì toggle sẽ pause.
      if (audio.paused) {
        await audio.play();
      }
    } catch (err) {
      console.warn("⚠️ Không thể phát nhạc khi vào web:", err);
    }

    syncPlayButtons();
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
    startFromEntry,
    loadTrack,
    syncPlayButtons,
    setVolume,
    toggleMute,
    restoreVolume,
    getVolumeState,
    setTracks: (newTracks, options = {}) => {
      if (!Array.isArray(newTracks) || !newTracks.length) return;

      const { preserveCurrent = true } = options;
      const currentSrc = audio.currentSrc || audio.src;

      tracks = [...newTracks];

      if (preserveCurrent && currentSrc) {
        const matchedIndex = tracks.findIndex(track => {
          try {
            return new URL(track.src, location.href).href === currentSrc;
          } catch {
            return track.src === currentSrc;
          }
        });

        // -1 nghĩa là bài hiện tại không nằm trong playlist mới.
        // Nhạc vẫn tiếp tục; lần bấm Next sẽ bắt đầu từ bài đầu Drive.
        currentTrack = matchedIndex;
        return;
      }

      currentTrack = 0;
      loadTrack(0, false);
    },
    getTracks: () => tracks,
    getCurrentTrack: () => currentTrack
  };
}