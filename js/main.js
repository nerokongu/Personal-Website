import { initDevice } from "./device.js";
import { initAudioPlayer } from "./audio-player.js";
import { initPreloader } from "./preloader.js";
import { initVolume } from "./volume.js";
import { initContact } from "./contact.js";

const isPhone = initDevice();

let bmwModelPreloadStarted = false;
let modelViewerScriptLoading = null;

if (!isPhone) {
  const audioSystem = initAudioPlayer();

  initVolume(audioSystem);
  initContact();
  prepareMenuButton();

  initPreloader(
    audioSystem,

    () => {
      startSmoothLoadingQueue(audioSystem);
    },

    () => {
      console.log("🖱️ User entered");
    }
  );
}

/* ===== HELPERS ===== */
function wait(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForPaint() {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

function runWhenIdle(task, timeout = 2500) {
  return new Promise(resolve => {
    const run = async () => {
      try {
        await task();
      } catch (err) {
        console.warn("⚠️ Idle task lỗi:", err);
      } finally {
        resolve();
      }
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout });
    } else {
      setTimeout(run, 180);
    }
  });
}

function prepareMenuButton() {
  const menuToggle = document.getElementById("menu-toggle");

  if (!menuToggle) return;

  menuToggle.classList.add("menu-loading");
  menuToggle.classList.remove("menu-ready");
}

/* ===== LOAD QUEUE ===== */
async function startSmoothLoadingQueue(audioSystem) {
  console.log("🚀 Start smooth loading queue");

  await waitForPaint();
  await wait(450);

  await loadHomeEffectsStage(audioSystem);

  await wait(500);

  await loadMenuStage(audioSystem);

  await wait(700);

  await loadBmwStage();

  await wait(700);

  await loadMusicStage(audioSystem);

  await wait(500);

  await loadMovieStage();

  console.log("✅ All stages loaded smoothly");
}

/* ===== STAGE 1: HOME EFFECTS ===== */
async function loadHomeEffectsStage(audioSystem) {
  console.log("✨ Stage 1: Home effects");

  await runWhenIdle(async () => {
    const { initDust } = await import("./effects/dust.js");
    initDust();
  });

  await wait(260);

  await runWhenIdle(async () => {
    const { initGlow } = await import("./effects/glow.js");
    initGlow(audioSystem);
  });

  console.log("✅ Home effects ready");
}

/* ===== STAGE 2: MENU ===== */
async function loadMenuStage(audioSystem) {
  console.log("📋 Stage 2: Menu logic");

  const menuToggle = document.getElementById("menu-toggle");

  try {
    const { initMenu } = await import("./menu.js");
    initMenu();

    await wait(220);

    const { initBmwEngine } = await import("./bmw-engine.js");
    initBmwEngine(audioSystem);

    if (menuToggle) {
      menuToggle.classList.remove("menu-loading");
      menuToggle.classList.add("menu-ready");
    }

    console.log("✅ Menu ready");
  } catch (err) {
    console.warn("⚠️ Không load được menu:", err);

    if (menuToggle) {
      menuToggle.classList.remove("menu-loading");
      menuToggle.classList.add("menu-ready");
    }
  }
}

/* ===== STAGE 3: MODEL-VIEWER + BMW ===== */
async function loadBmwStage() {
  console.log("🚗 Stage 3: BMW model");

  await runWhenIdle(async () => {
    await startBmwMenuModelPreload();
  }, 4000);

  console.log("✅ BMW stage done");
}

function ensureModelViewerScript() {
  if (customElements.get("model-viewer")) {
    return Promise.resolve();
  }

  if (modelViewerScriptLoading) {
    return modelViewerScriptLoading;
  }

  modelViewerScriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

    script.onload = async () => {
      try {
        await customElements.whenDefined("model-viewer");
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    script.onerror = () => {
      reject(new Error("Không load được model-viewer."));
    };

    document.head.appendChild(script);
  });

  return modelViewerScriptLoading;
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

  await ensureModelViewerScript();

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
  bmw.addEventListener("error", markError, { once: true });

  bmw.addEventListener("model-visibility", (e) => {
    if (e.detail.visible) {
      markReady();
    }
  }, { once: true });

  bmw.setAttribute("loading", "eager");
  bmw.setAttribute("reveal", "auto");

  const modelSrc =
    bmw.getAttribute("src") ||
    bmw.getAttribute("data-src") ||
    "assets/models/bmw.glb";

  console.log("🚗 BMW model path:", modelSrc);

  if (!bmw.getAttribute("src")) {
    bmw.setAttribute("src", modelSrc);
  }

  await new Promise(resolve => {
    bmw.addEventListener("load", resolve, { once: true });
    bmw.addEventListener("error", resolve, { once: true });

    setTimeout(() => {
      if (!finished && bmw.getAttribute("src")) {
        console.warn("⚠️ BMW model event lâu, vẫn cho load tiếp.");
        markReady();
      }

      resolve();
    }, 5000);
  });
}

/* ===== STAGE 4: MUSIC ===== */
async function loadMusicStage(audioSystem) {
  console.log("🎵 Stage 4: Music logic");

  await runWhenIdle(async () => {
    const { initMusicPage } = await import("./pages/music-page.js");
    initMusicPage(audioSystem);
  }, 3000);

  console.log("✅ Music logic ready");
}

/* ===== STAGE 5: MOVIE ===== */
async function loadMovieStage() {
  console.log("🎬 Stage 5: Movie logic");

  await runWhenIdle(async () => {
    const { initMoviePage } = await import("./pages/movie-page.js");
    initMoviePage();
  }, 3000);

  console.log("✅ Movie logic ready");
}