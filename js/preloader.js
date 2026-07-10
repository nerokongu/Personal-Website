export function initPreloader(audioSystem, onEnterReady, onUserEnter) {
  const {
    audio,
    audioCtx,
    togglePlay,
    startFromEntry,
    setVolume
  } = audioSystem;

  const overlay = document.getElementById("start-overlay");
  const video = document.getElementById("bg-video");

  if (!overlay) return;

  overlay.classList.add("loading");

  let videoReady = false;
  let audioReady = false;
  let entered = false;

  function checkReady() {
    console.log({
      videoReady,
      audioReady
    });

    if (videoReady && audioReady) {
      overlay.classList.remove("loading");
      console.log("✅ MAIN ASSETS READY");
    }
  }

  if (video) {
    if (video.readyState >= 2) {
      videoReady = true;
      checkReady();
    } else {
      video.addEventListener("loadeddata", () => {
        videoReady = true;
        checkReady();
      }, { once: true });

      video.addEventListener("error", () => {
        console.warn("⚠️ Video background lỗi, bỏ qua preloader video");
        videoReady = true;
        checkReady();
      }, { once: true });
    }
  } else {
    videoReady = true;
  }

  if (audio) {
    if (audio.readyState >= 1) {
      audioReady = true;
      checkReady();
    } else {
      audio.addEventListener("loadedmetadata", () => {
        audioReady = true;
        checkReady();
      }, { once: true });

      audio.addEventListener("error", () => {
        console.warn("⚠️ Audio lỗi, bỏ qua preloader audio");
        audioReady = true;
        checkReady();
      }, { once: true });
    }
  } else {
    audioReady = true;
  }

  window.setTimeout(() => {
    if (!videoReady) videoReady = true;
    if (!audioReady) audioReady = true;
    checkReady();
  }, 2500);

  overlay.addEventListener("click", async event => {
    event.stopPropagation();

    if (entered || overlay.classList.contains("loading")) return;

    entered = true;
    overlay.classList.add("hidden");

    if (typeof onUserEnter === "function") {
      onUserEnter();
    }

    try {
      if (typeof startFromEntry === "function") {
        await startFromEntry();
      } else {
        // Fallback dành cho audio-player cũ.
        if (typeof setVolume === "function") {
          setVolume(0.5);
        } else if (audio) {
          audio.volume = 0.5;
          audio.muted = false;
        }

        await audioCtx?.resume?.();

        // Chỉ phát khi đang pause, không toggle nếu nhạc đã chạy.
        if (audio?.paused && typeof togglePlay === "function") {
          await togglePlay();
        }
      }
    } catch (err) {
      console.warn("⚠️ Không thể khởi động âm thanh:", err);
    }

    if (typeof onEnterReady === "function") {
      onEnterReady();
    }
  });
}
