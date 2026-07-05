import { formatTime } from "../utils.js";

export function initMusicPage(audioSystem) {
  const { audio, togglePlay, loadTrack, syncPlayButtons } = audioSystem;

  const openMusicBtn = document.getElementById("open-music");
  const musicPage = document.getElementById("music-page");
  const moviePage = document.getElementById("movie-page");
  const backBtn = document.getElementById("music-back-global");

  const mPlay = document.getElementById("m-play");
  const mPrev = document.getElementById("m-prev");
  const mNext = document.getElementById("m-next");

  const mCurrent = document.getElementById("m-current");
  const mDuration = document.getElementById("m-duration");
  const mBar = document.querySelector(".m-bar");
  const mBarFill = document.querySelector(".m-bar-fill");
  const musicName = document.querySelector(".music-name");

  let musicBgStarted = false;

  function ensureMusicBackground() {
    if (musicBgStarted) return;

    musicBgStarted = true;

    import("../effects/music-bg.js")
      .then(({ initMusicBackground }) => {
        initMusicBackground(audioSystem);
        console.log("✅ Music background started");
      })
      .catch((err) => {
        console.warn("⚠️ Không load được Music background:", err);
      });
  }

  openMusicBtn.addEventListener("click", () => {
    ensureMusicBackground();
    document.getElementById("curtain-menu").classList.remove("open");

    moviePage.classList.remove("active");
    musicPage.classList.add("active");
    backBtn.classList.add("active");

    document.body.classList.add("sub-page-open", "music-open");
    document.body.classList.remove("movie-open");

    syncMusicUI();
  });
  
  backBtn.addEventListener("click", () => {
    musicPage.classList.remove("active");
    moviePage.classList.remove("active");
    backBtn.classList.remove("active");

    document.body.classList.remove("sub-page-open", "music-open", "movie-open");
  });

  mPlay.addEventListener("click", togglePlay);

  mPrev.addEventListener("click", () => {
    loadTrack(audioSystem.getCurrentTrack() - 1, !audio.paused);
  });

  mNext.addEventListener("click", () => {
    loadTrack(audioSystem.getCurrentTrack() + 1, !audio.paused);
  });

  mBar.addEventListener("click", (e) => {
    if (!audio.duration) return;

    const rect = mBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;

    audio.currentTime = percent * audio.duration;
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;

    const percent = audio.currentTime / audio.duration * 100;

    mBarFill.style.width = percent + "%";
    mCurrent.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    mDuration.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("play", syncMusicUI);
  audio.addEventListener("pause", syncMusicUI);

  function syncMusicUI() {
    mPlay.textContent = audio.paused ? "▶" : "⏸";
    mCurrent.textContent = formatTime(audio.currentTime);
    mDuration.textContent = formatTime(audio.duration || 0);
    musicName.textContent = document.getElementById("track-title").textContent;

    syncPlayButtons();
  }
}