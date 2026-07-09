export function initPreloader(audioSystem, onEnterReady, onUserEnter) {
  const { audio, togglePlay } = audioSystem;

  const overlay = document.getElementById("start-overlay");
  const video = document.getElementById("bg-video");

  if (!overlay) return;

  overlay.classList.add("loading");

  let videoReady = false;
  let audioReady = false;

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

  setTimeout(() => {
    if (!videoReady) videoReady = true;
    if (!audioReady) audioReady = true;
    checkReady();
  }, 2500);

  overlay.addEventListener("click", async (e) => {
    e.stopPropagation();

    if (overlay.classList.contains("loading")) return;

    overlay.classList.add("hidden");

    if (typeof onUserEnter === "function") {
      onUserEnter();
    }

    await togglePlay();

    if (typeof onEnterReady === "function") {
      onEnterReady();
    }
  });
}