export function initPreloader(audioSystem, onMainReady, onEnter) {
  const { audio, togglePlay } = audioSystem;

  const overlay = document.getElementById("start-overlay");
  const video = document.getElementById("bg-video");

  if (!overlay) return;

  overlay.classList.add("loading");

  let videoReady = false;
  let audioReady = false;

  let mainReadyCalled = false;
  let entered = false;

  function checkReady() {
    console.log("PRELOADER:", {
      videoReady,
      audioReady
    });

    if (videoReady && audioReady) {
      overlay.classList.remove("loading");

      if (!mainReadyCalled) {
        mainReadyCalled = true;

        console.log("✅ MAIN PAGE READY - START LOADING MENU");

        if (typeof onMainReady === "function") {
          onMainReady();
        }
      }
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

  // Chống kẹt nếu audio/video không bắn event
  setTimeout(() => {
    if (!audioReady) {
      console.warn("⚠️ Audio chưa ready, bỏ qua audio preloader");
      audioReady = true;
    }

    if (!videoReady) {
      console.warn("⚠️ Video chưa ready, bỏ qua video preloader");
      videoReady = true;
    }

    checkReady();
  }, 5000);

  checkReady();

  overlay.addEventListener("click", async (e) => {
    e.stopPropagation();

    if (entered) return;

    if (overlay.classList.contains("loading")) {
      console.log("⏳ Vẫn đang loading, chưa cho click");
      return;
    }

    entered = true;
    overlay.classList.add("hidden");

    try {
      await togglePlay();
    } catch (err) {
      console.warn("⚠️ Không phát được nhạc khi click enter:", err);
    }

    if (typeof onEnter === "function") {
      onEnter();
    }
  });
}