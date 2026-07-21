import { formatTime } from "../utils.js";
import { loadDriveTracks } from "../drive-music.js";
import { ensureModelViewer } from "../model-viewer-loader.js";

export function initMusicPage(audioSystem) {
  const { audio, togglePlay, loadTrack, syncPlayButtons } = audioSystem;

  const openMusicBtn = document.getElementById("open-music");
  const musicPage = document.getElementById("music-page");
  const moviePage = document.getElementById("movie-page");
  const gymPage = document.getElementById("gym-page");
  const backBtn = document.getElementById("music-back-global");

  const mPlay = document.getElementById("m-play");
  const mPrev = document.getElementById("m-prev");
  const mNext = document.getElementById("m-next");

  const mCurrent = document.getElementById("m-current");
  const mDuration = document.getElementById("m-duration");
  const mBar = document.querySelector(".m-bar");
  const mBarFill = document.querySelector(".m-bar-fill");
  const musicName = document.querySelector(".music-name");
  const playlistList = document.getElementById("music-playlist-list");

  const mVolumeBtn = document.getElementById("m-volume-btn");
  const mVolumeSlider = document.getElementById("m-volume-slider");
  const mVolumePercent = document.getElementById("m-volume-percent");
  const musicVolumeBox = document.querySelector(".music-volume");
  let musicVolumeTimer = null;

  let musicBgStarted = false;
  let playlistLoaded = false;
  let playlistLoading = false;
  let openingMusicPage = false;



  async function ensureDrivePlaylist() {
    if (playlistLoaded || playlistLoading) return;

    playlistLoading = true;

    if (playlistList) {
      playlistList.innerHTML = `
        <div class="playlist-loading">
          <span></span>
          <p>Đang tải playlist từ Google Drive...</p>
        </div>
      `;
    }

    try {
      const driveTracks = await loadDriveTracks();

      if (!driveTracks.length) {
        if (playlistList) {
          playlistList.innerHTML = `
            <div class="playlist-empty">
              Không tìm thấy file MP3 trong folder Drive.
            </div>
          `;
        }

        return;
      }

      if (typeof audioSystem.setTracks !== "function") {
        console.warn("⚠️ audioSystem.setTracks chưa có. Cần sửa audio-player.js");
        return;
      }

      audioSystem.setTracks(driveTracks, { preserveCurrent: true });

      playlistLoaded = true;

      renderPlaylist();
      syncMusicUI();

      console.log("✅ Drive playlist loaded:", driveTracks);
    } catch (err) {
      console.warn("⚠️ Không tải được playlist Drive:", err);

      if (playlistList) {
        playlistList.innerHTML = `
          <div class="playlist-error">
            Không tải được playlist Drive.<br>
            Kiểm tra API key, quyền folder hoặc restrictions.
          </div>
        `;
      }
    } finally {
      playlistLoading = false;
    }
  }

  function renderPlaylist() {
    if (!playlistList) return;

    const currentTracks = audioSystem.getTracks();

    playlistList.innerHTML = "";

    currentTracks.forEach((track, index) => {
      const item = document.createElement("button");

      item.type = "button";
      item.className = "playlist-item";

      item.innerHTML = `
        <span class="playlist-index">${index + 1}</span>

        <span class="playlist-info">
          <strong>${escapeHtml(track.title || `Track ${index + 1}`)}</strong>
          <span>${escapeHtml(track.artist || "Nero Playlist")}</span>
        </span>
      `;

      item.addEventListener("click", async () => {
        await loadTrack(index, true);
        syncMusicUI();
        syncPlaylistUI();
      });

      playlistList.appendChild(item);
    });

    syncPlaylistUI();
  }

  function syncPlaylistUI() {
    if (!playlistList) return;

    const currentIndex = audioSystem.getCurrentTrack();

    playlistList.querySelectorAll(".playlist-item").forEach((item, index) => {
      const isActive = index === currentIndex;

      item.classList.toggle("active", isActive);

      if (isActive && document.body.classList.contains("music-open")) {
        item.scrollIntoView({
          block: "nearest",
          behavior: "smooth"
        });
      }
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function ensureMusicBackground() {
    if (musicBgStarted) return;

    musicBgStarted = true;

    try {
      await ensureModelViewer();

      const eyeModel = document.getElementById("music-eye-model");

      if (eyeModel && !eyeModel.getAttribute("src")) {
        const eyeSrc =
          eyeModel.getAttribute("data-src") || "assets/models/eye.glb";

        eyeModel.setAttribute("src", eyeSrc);
        eyeModel.setAttribute("reveal", "auto");
      }

      const { initMusicBackground } = await import("../effects/music-bg.js");
      initMusicBackground(audioSystem);
      console.log("✅ Music background started");
    } catch (error) {
      musicBgStarted = false;
      console.warn("⚠️ Không load được Music background:", error);
    }
  }

  async function enterMusicPageEffect() {
    document.body.classList.add("music-entering");

    if (typeof audioSystem.restoreVolume === "function") {
      audioSystem.restoreVolume();
    }

    syncMusicVolumeUI();
  }

  function syncMusicVolumeUI() {
    if (!mVolumeSlider || !mVolumeBtn) return;

    const state = audioSystem.getVolumeState
      ? audioSystem.getVolumeState()
      : {
          volume: audio.volume,
          muted: audio.muted,
          realVolume: audio.muted ? 0 : audio.volume
        };

    mVolumeSlider.value = state.realVolume;

    if (mVolumePercent) {
      mVolumePercent.textContent = `${Math.round(state.realVolume * 100)}%`;
    }

    const icon = mVolumeBtn.querySelector("i");
    if (!icon) return;

    if (state.muted || state.realVolume === 0) {
      icon.className = "fa-solid fa-volume-xmark";
    } else if (state.realVolume < 0.45) {
      icon.className = "fa-solid fa-volume-low";
    } else {
      icon.className = "fa-solid fa-volume-high";
    }
  }

  function initMusicVolume() {
    if (!mVolumeSlider || !mVolumeBtn) return;

    function closeMusicVolumeBox() {
      if (!musicVolumeBox) return;

      clearTimeout(musicVolumeTimer);
      musicVolumeTimer = null;
      musicVolumeBox.classList.remove("volume-open");
    }

    function openMusicVolumeBox() {
      if (!musicVolumeBox) return;

      musicVolumeBox.classList.add("volume-open");

      clearTimeout(musicVolumeTimer);

      musicVolumeTimer = setTimeout(closeMusicVolumeBox, 3000);
    }

    if (musicVolumeBox) {
      musicVolumeBox.addEventListener("mouseenter", openMusicVolumeBox);
      musicVolumeBox.addEventListener("mousemove", openMusicVolumeBox);
    }

    mVolumeBtn.addEventListener("mouseenter", openMusicVolumeBox);
    mVolumeBtn.addEventListener("mousemove", openMusicVolumeBox);

    mVolumeSlider.addEventListener("mouseenter", openMusicVolumeBox);
    mVolumeSlider.addEventListener("mousemove", openMusicVolumeBox);

    mVolumeSlider.addEventListener("input", () => {
      openMusicVolumeBox();

      if (typeof audioSystem.setVolume === "function") {
        audioSystem.setVolume(Number(mVolumeSlider.value));
      } else {
        audio.volume = Number(mVolumeSlider.value);
        audio.muted = audio.volume === 0;
      }

      syncMusicVolumeUI();
    });

    mVolumeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openMusicVolumeBox();

      if (typeof audioSystem.toggleMute === "function") {
        audioSystem.toggleMute();
      } else {
        audio.muted = !audio.muted;
      }

      syncMusicVolumeUI();
    });

    // Khi volume đang mở, bấm ở bất kỳ nơi nào bên ngoài sẽ đóng ngay.
    document.addEventListener("pointerdown", (event) => {
      if (!musicVolumeBox?.classList.contains("volume-open")) return;
      if (musicVolumeBox.contains(event.target)) return;

      closeMusicVolumeBox();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMusicVolumeBox();
    });

    audio.addEventListener("volumechange", syncMusicVolumeUI);
    window.addEventListener("nero-volume-sync", syncMusicVolumeUI);

    syncMusicVolumeUI();
  }

  openMusicBtn.addEventListener("click", async () => {
    if (openingMusicPage) return;

    openingMusicPage = true;

    document.getElementById("curtain-menu").classList.remove("open");

    await enterMusicPageEffect();

    // Hiện trang ngay; playlist Drive tải nền để không làm nút Music bị đứng.
    moviePage?.classList.remove("active");
    gymPage?.classList.remove("active");
    musicPage.classList.add("active");
    backBtn.classList.add("active");

    document.body.classList.add("sub-page-open", "music-open");
    document.body.classList.remove("movie-open", "gym-open");

    void ensureMusicBackground();
    void ensureDrivePlaylist();

    syncMusicUI();

    setTimeout(() => {
      document.body.classList.remove("music-entering");
      openingMusicPage = false;
    }, 720);
  });
  
  backBtn.addEventListener("click", () => {
    if (!document.body.classList.contains("music-open")) return;

    musicPage.classList.remove("active");
    backBtn.classList.remove("active");

    document.body.classList.remove(
      "sub-page-open",
      "music-open",
      "music-entering"
    );

    syncMusicUI();
  });

  mPlay.addEventListener("click", togglePlay);

  mPrev.addEventListener("click", async () => {
    await loadTrack(audioSystem.getCurrentTrack() - 1, !audio.paused);
    syncMusicUI();
    syncPlaylistUI();
  });

  mNext.addEventListener("click", async () => {
    await loadTrack(audioSystem.getCurrentTrack() + 1, !audio.paused);
    syncMusicUI();
    syncPlaylistUI();
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
    syncMusicUI();
    syncPlaylistUI();
  });

  audio.addEventListener("play", syncMusicUI);
  audio.addEventListener("pause", syncMusicUI);

  function syncMusicUI() {
    mPrev.innerHTML = `<i class="fa-solid fa-backward-step"></i>`;
    mNext.innerHTML = `<i class="fa-solid fa-forward-step"></i>`;

    mPlay.innerHTML = audio.paused
      ? `<i class="fa-solid fa-play"></i>`
      : `<i class="fa-solid fa-pause"></i>`;

    mCurrent.textContent = formatTime(audio.currentTime || 0);
    mDuration.textContent = formatTime(audio.duration || 0);

    const mainTitle = document.getElementById("track-title");
    musicName.textContent = mainTitle ? mainTitle.textContent : "Track Name";

    syncPlayButtons();
    syncPlaylistUI();
    syncMusicVolumeUI();
  }

  initMusicVolume();
  renderPlaylist();
}