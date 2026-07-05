import { initDevice } from "./device.js";
import { initAudioPlayer } from "./audio-player.js";
import { initPreloader } from "./preloader.js";
import { initVolume } from "./volume.js";
import { initContact } from "./contact.js";

import { initDust } from "./effects/dust.js";
import { initGlow } from "./effects/glow.js";

const isPhone = initDevice();

/* PC ONLY: điện thoại sẽ dừng ở màn hình mobile-only */
if (!isPhone) {
  const audioSystem = initAudioPlayer();

  initVolume(audioSystem);
  initContact();

  initDust();
  initGlow(audioSystem);

  prepareMenuButton();

  initPreloader(
    audioSystem,

    () => {
      startProgressiveLoading(audioSystem);
    },

    () => {
      console.log("🖱️ User entered - delay heavy BMW preload");
      scheduleBmwMenuModelPreload(700);
    }
  );
}
let bmwModelPreloadStarted = false;
let bmwModelPreloadTimer = null;

/* ===== MENU BUTTON STATE ===== */
function prepareMenuButton() {
  const menuToggle = document.getElementById("menu-toggle");

  if (!menuToggle) return;

  menuToggle.classList.add("menu-loading");
  menuToggle.classList.remove("menu-ready");
}

/* ===== LOAD WEBSITE STEP BY STEP ===== */
async function startProgressiveLoading(audioSystem) {
  console.log("🚀 Main ready, loading menu logic + preload BMW");

  await loadMenuStage(audioSystem);

  loadSubPagesStage(audioSystem);
}

/* ===== STAGE 1: LOAD MENU MODEL + MENU LOGIC ===== */
async function loadMenuStage(audioSystem) {
  const menuToggle = document.getElementById("menu-toggle");

  console.log("⚡ Loading menu logic first...");

  const [{ initMenu }, { initBmwEngine }] = await Promise.all([
    import("./menu.js"),
    import("./bmw-engine.js")
  ]);

  // Menu effect, nút xổ menu, nút BMW engine phải chạy trước
  initMenu();
  initBmwEngine(audioSystem);

  if (menuToggle) {
    menuToggle.classList.remove("menu-loading");
    menuToggle.classList.add("menu-ready");
  }

  console.log("✅ Menu effects ready");

  // Không load BMW model ngay lập tức nữa.
  // Đợi một chút để Click to enter luôn mượt.
  scheduleBmwMenuModelPreload(1400);
}

function scheduleBmwMenuModelPreload(delay = 1200) {
  if (bmwModelPreloadStarted) return;

  if (bmwModelPreloadTimer) {
    clearTimeout(bmwModelPreloadTimer);
  }

  bmwModelPreloadTimer = setTimeout(() => {
    const runPreload = () => {
      startBmwMenuModelPreload();
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(runPreload, {
        timeout: 2500
      });
    } else {
      requestAnimationFrame(() => {
        setTimeout(runPreload, 0);
      });
    }
  }, delay);
}

async function startBmwMenuModelPreload() {
  if (bmwModelPreloadStarted) return;
  bmwModelPreloadStarted = true;

  const bmw = document.getElementById("bmw-menu");
  const modelWrap = document.querySelector(".model-wrap");

  if (!bmw) {
    console.warn("⚠️ Không tìm thấy #bmw-menu");
    return;
  }
  
  let finished = false;

  function markReady() {
    if (finished) return;

    finished = true;

    if (modelWrap) {
      modelWrap.classList.add("model-ready");
      modelWrap.classList.remove("model-error");
    }

    console.log("✅ BMW model loaded");
  }

  function markError(err) {
    console.warn("⚠️ BMW model lỗi hoặc không load được:", err);

    if (modelWrap) {
      modelWrap.classList.add("model-error");
    }
  }

  bmw.addEventListener("load", markReady, { once: true });

  bmw.addEventListener("model-visibility", (e) => {
    if (e.detail.visible) {
      markReady();
    }
  }, { once: true });

  bmw.addEventListener("error", markError, { once: true });

  bmw.setAttribute("loading", "eager");
  bmw.setAttribute("reveal", "auto");

  await customElements.whenDefined("model-viewer");

  const modelSrc =
    bmw.getAttribute("src") ||
    bmw.getAttribute("data-src") ||
    "assets/models/bmw.glb";

  console.log("🚗 BMW model preload path:", modelSrc);

  if (!bmw.getAttribute("src")) {
    bmw.setAttribute("src", modelSrc);
  }

  // Chống trường hợp model-viewer load nhưng không bắn event
  setTimeout(() => {
    if (!finished && bmw.getAttribute("src")) {
      console.warn("⚠️ BMW model event lâu, vẫn thử hiện model");
      markReady();
    }
  }, 6000);
}

/* ===== STAGE 2: LOAD MUSIC/MOVIE LOGIC AFTER MENU ===== */
async function loadSubPagesStage(audioSystem) {
  console.log("🎵🎬 Loading Music/Movie page logic after menu...");

  try {
    const [{ initMusicPage }, { initMoviePage }] = await Promise.all([
      import("./pages/music-page.js"),
      import("./pages/movie-page.js")
    ]);

    initMusicPage(audioSystem);
    initMoviePage();

    console.log("✅ Music/Movie page logic ready");
  } catch (err) {
    console.warn("⚠️ Không load được Music/Movie page:", err);
  }
}