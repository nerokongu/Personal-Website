export function initPreloader(audioSystem) {
  const { audio, togglePlay } = audioSystem;

  const overlay = document.getElementById("start-overlay");
  const video = document.getElementById("bg-video");
  const bmw = document.getElementById("bmw-menu");

  if (!overlay) return;

  overlay.classList.add("loading");

  let videoReady = false;
  let audioReady = false;
  let modelReady = false;

  function checkReady() {
    console.log("PRELOADER:", {
      videoReady,
      audioReady,
      modelReady
    });

    if (videoReady && audioReady && modelReady) {
      overlay.classList.remove("loading");
      console.log("✅ ALL ASSETS READY - CLICK ENABLED");
    }
  }

  // ===== VIDEO READY =====
  if (video) {
    if (video.readyState >= 2) {
      videoReady = true;
    } else {
      video.addEventListener("loadeddata", () => {
        videoReady = true;
        checkReady();
      });

      video.addEventListener("canplay", () => {
        videoReady = true;
        checkReady();
      });

      video.addEventListener("error", () => {
        console.warn("⚠️ Video lỗi, bỏ qua video preloader");
        videoReady = true;
        checkReady();
      });
    }
  } else {
    videoReady = true;
  }

  // ===== AUDIO READY =====
  if (audio) {
    if (audio.readyState >= 1) {
      audioReady = true;
    } else {
      audio.addEventListener("loadedmetadata", () => {
        audioReady = true;
        checkReady();
      });

      audio.addEventListener("canplay", () => {
        audioReady = true;
        checkReady();
      });

      audio.addEventListener("error", () => {
        console.warn("⚠️ Audio lỗi hoặc sai đường dẫn, vẫn cho vào web");
        audioReady = true;
        checkReady();
      });
    }
  } else {
    audioReady = true;
  }

  // ===== MODEL READY =====
  if (bmw) {
    bmw.addEventListener("model-visibility", (e) => {
      if (e.detail.visible) {
        modelReady = true;
        checkReady();
      }
    });

    bmw.addEventListener("load", () => {
      modelReady = true;
      checkReady();
    });
  } else {
    modelReady = true;
  }

  // Chống kẹt nếu model-viewer không bắn event
  setTimeout(() => {
    if (!modelReady) {
      console.warn("⚠️ Model load lâu, bỏ qua model preloader");
      modelReady = true;
      checkReady();
    }
  }, 5000);

  // Chống kẹt nếu audio không bắn loadedmetadata/error
  setTimeout(() => {
    if (!audioReady) {
      console.warn("⚠️ Audio chưa ready, bỏ qua audio preloader");
      audioReady = true;
      checkReady();
    }
  }, 5000);

  // Chống kẹt nếu video không bắn loadeddata/error
  setTimeout(() => {
    if (!videoReady) {
      console.warn("⚠️ Video chưa ready, bỏ qua video preloader");
      videoReady = true;
      checkReady();
    }
  }, 5000);

  checkReady();

  overlay.addEventListener("click", async (e) => {
    e.stopPropagation();

    if (overlay.classList.contains("loading")) {
      console.log("⏳ Vẫn đang loading, chưa cho click");
      return;
    }

    overlay.classList.add("hidden");

    try {
      await togglePlay();
    } catch (err) {
      console.warn("⚠️ Không phát được nhạc khi click enter:", err);
    }
  });
}