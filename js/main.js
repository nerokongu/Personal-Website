import { initDevice } from "./device.js";
import { initAudioPlayer } from "./audio-player.js";
import { initPreloader } from "./preloader.js";
import { initVolume } from "./volume.js";
import { initContact } from "./contact.js";
import { ensureModelViewer } from "./model-viewer-loader.js";

const isPhone = initDevice();

let appStarted = false;
let bmwModelLoadPromise = null;
let eyeModelLoadPromise = null;
let drivePlaylistPreloadPromise = null;
let musicAssetsPreloadPromise = null;

const pageLoadPromises = new Map();

if (isPhone) {
  // Điện thoại cần model-viewer để hiển thị BMW ở màn hình PC only.
  void ensureModelViewer().catch(error => {
    console.warn("⚠️ Không load được mobile model:", error);
  });
} else {
  const audioSystem = initAudioPlayer();

  initVolume(audioSystem);
  initContact();
  prepareMenuButton();
  preparePageButtons();

  initPreloader(
    audioSystem,
    () => startApp(audioSystem),
    () => console.log("🖱️ User entered")
  );
}

function waitForPaint() {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function runWhenIdle(task, timeout = 1500) {
  return new Promise(resolve => {
    const run = async () => {
      try {
        await task();
      } catch (error) {
        console.warn("⚠️ Idle task lỗi:", error);
      } finally {
        resolve();
      }
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout });
    } else {
      window.setTimeout(run, 100);
    }
  });
}

function scheduleHomeIdleTask(task, delay = 900) {
  window.setTimeout(function attempt() {
    const homeIsVisible =
      !document.hidden &&
      !document.body.classList.contains("sub-page-open");

    if (!homeIsVisible) {
      window.setTimeout(attempt, 900);
      return;
    }

    void runWhenIdle(task, 1800);
  }, delay);
}

function prepareMenuButton() {
  const menuToggle = document.getElementById("menu-toggle");
  if (!menuToggle) return;

  menuToggle.classList.add("menu-loading");
  menuToggle.classList.remove("menu-ready");
}

function preparePageButtons() {
  ["open-gym", "open-music", "open-movie"].forEach(id => {
    document.getElementById(id)?.classList.add("page-module-loading");
  });
}

async function startApp(audioSystem) {
  if (appStarted) return;
  appStarted = true;

  await waitForPaint();

  bindLazyPages(audioSystem);
  await loadMenu(audioSystem);

  // Các tài nguyên được tải nền theo từng nhịp rảnh, không chờ người dùng bấm.
  // Drive bắt đầu tải sớm vì chủ yếu dùng network, không chặn frame giao diện.
  scheduleHomeIdleTask(preloadDrivePlaylist, 350);
  scheduleHomeIdleTask(() => loadGlow(audioSystem), 650);
  scheduleHomeIdleTask(loadBmwModel, 1150);
  scheduleHomeIdleTask(preloadMusicAssets, 1750);
  scheduleHomeIdleTask(preloadEyeModel, 2350);
  scheduleHomeIdleTask(loadDust, 3200);
}

function bindLazyPages(audioSystem) {
  bindLazyButton("open-gym", "gym", async () => {
    await loadPageStyle("gym", "css/pages/gym.css");
    const { initGymPage } = await import("./pages/gym-page.js");
    initGymPage();
  });

  bindLazyButton("open-music", "music", async () => {
    await loadPageStyle("music", "css/pages/music.css");
    const { initMusicPage } = await import("./pages/music-page.js");
    initMusicPage(audioSystem);
  });

  bindLazyButton("open-movie", "movie", async () => {
    await loadPageStyle("movie", "css/pages/movie.css");
    const { initMoviePage } = await import("./pages/movie-page.js");
    initMoviePage();
  });
}

function loadPageStyle(key, href) {
  const existing = document.querySelector(
    `link[data-page-style="${key}"]`
  );

  if (existing?.dataset.loaded === "1") {
    return Promise.resolve();
  }

  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.pageStyle = key;

    link.addEventListener("load", () => {
      link.dataset.loaded = "1";
      resolve();
    }, { once: true });

    link.addEventListener("error", () => {
      link.remove();
      reject(new Error(`Không tải được stylesheet ${href}`));
    }, { once: true });

    document.head.appendChild(link);
  });
}

function bindLazyButton(buttonId, key, loader) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  const interceptFirstClick = async event => {
    if (button.dataset.moduleReady === "1") return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (pageLoadPromises.has(key) || pageLoadPromises.size > 0) return;

    button.disabled = true;
    button.classList.add("is-loading");

    const loadPromise = (async () => {
      try {
        await loader();
        button.dataset.moduleReady = "1";
        button.classList.remove("page-module-loading", "is-loading");
        button.removeEventListener("click", interceptFirstClick, true);

        await waitForPaint();
        button.disabled = false;
        button.click();
      } catch (error) {
        console.warn(`⚠️ Không load được trang ${key}:`, error);
        button.disabled = false;
        button.classList.remove("is-loading");
      } finally {
        pageLoadPromises.delete(key);
      }
    })();

    pageLoadPromises.set(key, loadPromise);
  };

  button.addEventListener("click", interceptFirstClick, true);
}

async function loadMenu(audioSystem) {
  const menuToggle = document.getElementById("menu-toggle");

  try {
    const [{ initMenu }, { initBmwEngine }] = await Promise.all([
      import("./menu.js"),
      import("./bmw-engine.js")
    ]);

    initMenu();
    initBmwEngine(audioSystem);
    console.log("✅ Menu ready");
  } catch (error) {
    console.warn("⚠️ Không load được menu:", error);
  } finally {
    if (menuToggle) {
      menuToggle.classList.remove("menu-loading");
      menuToggle.classList.add("menu-ready");
    }
  }
}

async function preloadDrivePlaylist() {
  if (drivePlaylistPreloadPromise) return drivePlaylistPreloadPromise;

  drivePlaylistPreloadPromise = (async () => {
    const { loadDriveTracks } = await import("./drive-music.js");
    const tracks = await loadDriveTracks();
    console.log(`✅ Drive playlist cached: ${tracks.length} tracks`);
    return tracks;
  })().catch(error => {
    drivePlaylistPreloadPromise = null;
    console.warn("⚠️ Không preload được Drive playlist:", error);
    return [];
  });

  return drivePlaylistPreloadPromise;
}

async function preloadMusicAssets() {
  if (musicAssetsPreloadPromise) return musicAssetsPreloadPromise;

  musicAssetsPreloadPromise = Promise.all([
    loadPageStyle("music", "css/pages/music.css"),
    import("./pages/music-page.js"),
    import("./effects/music-bg.js")
  ]).then(() => {
    console.log("✅ Music CSS/JS cached");
  }).catch(error => {
    musicAssetsPreloadPromise = null;
    throw error;
  });

  return musicAssetsPreloadPromise;
}

async function loadGlow(audioSystem) {
  const { initGlow } = await import("./effects/glow.js");
  initGlow(audioSystem);
  console.log("✅ Home glow ready");
}

async function loadDust() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) return;

  const { initDust } = await import("./effects/dust.js");
  initDust();
  console.log("✅ Dust ready");
}

function loadBmwModel() {
  if (bmwModelLoadPromise) return bmwModelLoadPromise;

  bmwModelLoadPromise = (async () => {
    const bmw = document.getElementById("bmw-menu");
    const modelWrap = document.querySelector(".model-wrap");

    if (!bmw) return;

    await ensureModelViewer();

    if (bmw.loaded) {
      modelWrap?.classList.add("model-ready");
      modelWrap?.classList.remove("model-error");
      return;
    }

    await new Promise(resolve => {
      let finished = false;

      const finish = ok => {
        if (finished) return;
        finished = true;

        modelWrap?.classList.toggle("model-ready", ok);
        modelWrap?.classList.toggle("model-error", !ok);
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

      if (!bmw.getAttribute("src")) {
        bmw.setAttribute("src", modelSrc);
      }

      // Chỉ bỏ chữ loading khi model thực sự đã load.
      window.setTimeout(() => {
        if (bmw.loaded) finish(true);
      }, 12000);
    });

    console.log("✅ BMW model ready");
  })().catch(error => {
    bmwModelLoadPromise = null;
    throw error;
  });

  return bmwModelLoadPromise;
}

function preloadEyeModel() {
  if (eyeModelLoadPromise) return eyeModelLoadPromise;

  eyeModelLoadPromise = (async () => {
    const eyeModel = document.getElementById("music-eye-model");
    if (!eyeModel) return;

    await ensureModelViewer();

    if (eyeModel.loaded) return;

    await new Promise(resolve => {
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        resolve();
      };

      eyeModel.addEventListener("load", finish, { once: true });
      eyeModel.addEventListener("error", finish, { once: true });

      eyeModel.setAttribute("loading", "eager");
      eyeModel.setAttribute("reveal", "auto");

      const eyeSrc =
        eyeModel.getAttribute("src") ||
        eyeModel.getAttribute("data-src") ||
        "assets/models/eye.glb";

      if (!eyeModel.getAttribute("src")) {
        eyeModel.setAttribute("src", eyeSrc);
      }

      // Không chặn hàng đợi vô hạn nếu trình duyệt không phát event.
      window.setTimeout(finish, 12000);
    });

    console.log("✅ Eye model preloaded");
  })().catch(error => {
    eyeModelLoadPromise = null;
    throw error;
  });

  return eyeModelLoadPromise;
}
