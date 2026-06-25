import { engineSounds } from "./config.js";

export function initBmwEngine(audioSystem) {
  const { audioCtx, analyser } = audioSystem;

  const revBtn = document.getElementById("rev-btn");

  let currentEngine = null;
  let currentSource = null;
  let revving = false;

  revBtn.addEventListener("mousedown", async () => {
    if (revving) return;

    revving = true;

    await audioCtx.resume();

    const sound = engineSounds[Math.floor(Math.random() * engineSounds.length)];

    currentEngine = new Audio(sound);
    currentEngine.volume = 0.45;
    currentEngine.loop = false;

    currentSource = audioCtx.createMediaElementSource(currentEngine);
    currentSource.connect(analyser);
    currentSource.connect(audioCtx.destination);

    currentEngine.play();
  });

  window.addEventListener("mouseup", () => {
    if (!revving) return;

    revving = false;

    if (currentEngine) {
      currentEngine.pause();
      currentEngine.currentTime = 0;
    }

    if (currentSource) {
      currentSource.disconnect();
      currentSource = null;
    }

    currentEngine = null;
  });
}