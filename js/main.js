import { initDevice } from "./device.js";
import { initAudioPlayer } from "./audio-player.js";
import { initPreloader } from "./preloader.js";
import { initVolume } from "./volume.js";
import { initContact } from "./contact.js";

const isPhone = initDevice();

let bmwModelPreloadStarted = false;
let modelViewerScriptLoading = null;
let appModulesStarted = false;

if (!isPhone) {
  const audioSystem = initAudioPlayer();

  initVolume(audioSystem);
  initContact();
  prepareMenuButton();

  initPreloader(
    audioSystem,
    () => startAppModules(audioSystem),
    () => console.log("🖱️ User entered")
  );
}

function waitForPaint() {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function loadGymStage() {
  console.log("🏋️ Stage: Gym page");

  try {
    const { initGymPage } = await import("./pages/gym-page.js");
    initGymPage();
    console.log("✅ Gym ready");
  } catch (err) {
    console.warn("⚠️ Không load được Gym page:", err);
  }
}

function runWhenIdle(task, timeout = 1800) {
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
      window.setTimeout(run, 80);
    }
  });
}

function prepareMenuButton() {
  const menuToggle = document.getElementById("menu-toggle");
  if (!menuToggle) return;

  menuToggle.classList.add("menu-loading");
  menuToggle.classList.remove("menu-ready");
}

async function startAppModules(audioSystem) {
  if (appModulesStarted) return;
  appModulesStarted = true;

  await waitForPaint();

  // Các nút điều hướng được ưu tiên để người dùng không phải chờ hiệu ứng.
  await Promise.all([
    loadMenuStage(audioSystem),
    loadGymStage(),
    loadMusicStage(audioSystem),
    loadMovieStage()
  ]);

  // Hiệu ứng và model nặng được tải lúc trình duyệt rảnh.
  void runWhenIdle(() => loadHomeEffectsStage(audioSystem), 1200);
  void runWhenIdle(() => loadBmwStage(), 2600);
}

async function loadHomeEffectsStage(audioSystem) {
  const [{ initDust }, { initGlow }] = await Promise.all([
    import("./effects/dust.js"),
    import("./effects/glow.js")
  ]);

  initDust();
  initGlow(audioSystem);
  console.log("✅ Home effects ready");
}

async function loadMenuStage(audioSystem) {
  const menuToggle = document.getElementById("menu-toggle");

  try {
    const [{ initMenu }, { initBmwEngine }] = await Promise.all([
      import("./menu.js"),
      import("./bmw-engine.js")
    ]);

    initMenu();
    initBmwEngine(audioSystem);
    console.log("✅ Menu ready");
  } catch (err) {
    console.warn("⚠️ Không load được menu:", err);
  } finally {
    if (menuToggle) {
      menuToggle.classList.remove("menu-loading");
      menuToggle.classList.add("menu-ready");
    }
  }
}

async function loadBmwStage() {
  try {
    await startBmwMenuModelPreload();
  } catch (err) {
    console.warn("⚠️ BMW stage lỗi:", err);
  }
}

function ensureModelViewerScript() {
  if (customElements.get("model-viewer")) return Promise.resolve();
  if (modelViewerScriptLoading) return modelViewerScriptLoading;

  modelViewerScriptLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-model-viewer-loader="true"]');

    if (existing) {
      customElements.whenDefined("model-viewer").then(resolve).catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.dataset.modelViewerLoader = "true";

    script.onload = () => {
      customElements.whenDefined("model-viewer").then(resolve).catch(reject);
    };

    script.onerror = () => reject(new Error("Không load được model-viewer."));
    document.head.appendChild(script);
  });

  return modelViewerScriptLoading;
}

async function startBmwMenuModelPreload() {
  if (bmwModelPreloadStarted) return;
  bmwModelPreloadStarted = true;

  const bmw = document.getElementById("bmw-menu");
  const modelWrap = document.querySelector(".model-wrap");

  if (!bmw) return;

  await ensureModelViewerScript();

  await new Promise(resolve => {
    let finished = false;

    const finish = (ok = true) => {
      if (finished) return;
      finished = true;

      if (modelWrap) {
        modelWrap.classList.toggle("model-ready", ok);
        modelWrap.classList.toggle("model-error", !ok);
      }

      resolve();
    };

    bmw.addEventListener("load", () => finish(true), { once: true });
    bmw.addEventListener("error", () => finish(false), { once: true });

    bmw.setAttribute("loading", "eager");
    bmw.setAttribute("reveal", "auto");

    const modelSrc =
      bmw.getAttribute("src") ||
      bmw.getAttribute("data-src") ||
      "assets/models/bmw.glb";

    if (!bmw.getAttribute("src")) bmw.setAttribute("src", modelSrc);

    // Không chặn hàng đợi nếu model-viewer không phát event.
    window.setTimeout(() => finish(true), 4500);
  });
}

async function loadMusicStage(audioSystem) {
  try {
    const { initMusicPage } = await import("./pages/music-page.js");
    initMusicPage(audioSystem);
    console.log("✅ Music logic ready");
  } catch (err) {
    console.warn("⚠️ Không load được Music:", err);
  }
}

async function loadMovieStage() {
  try {
    const { initMoviePage } = await import("./pages/movie-page.js");
    initMoviePage();
    console.log("✅ Movie logic ready");
  } catch (err) {
    console.warn("⚠️ Không load được Movie:", err);
  }
}
