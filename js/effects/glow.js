export function initGlow(audioSystem) {
  const { analyser, dataArray } = audioSystem;

  const card = document.querySelector(".profile-card");
  const links = [...document.querySelectorAll(".links a")];
  const bmw = document.getElementById("bmw-menu");
  const curtainMenu = document.getElementById("curtain-menu");

  if (!card || !analyser || !dataArray) return;

  let rafId = 0;
  let running = false;

  function shouldRun() {
    return (
      !document.hidden &&
      !document.body.classList.contains("sub-page-open")
    );
  }

  function readBass() {
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    const count = Math.min(20, dataArray.length);

    for (let index = 0; index < count; index++) {
      sum += dataArray[index];
    }

    return count ? sum / count / 255 : 0;
  }

  function render(intensity) {
    card.style.boxShadow =
      `0 0 ${20 + intensity * 40}px ` +
      `rgba(255,255,255,${0.15 + intensity * 0.4})`;

    links.forEach(link => {
      link.style.boxShadow =
        `0 0 ${10 + intensity * 25}px ` +
        `rgba(255,255,255,${0.1 + intensity * 0.3})`;
    });

    if (
      bmw &&
      curtainMenu?.classList.contains("open") &&
      customElements.get("model-viewer")
    ) {
      bmw.exposure = 0.8 + intensity * 1.2;
      bmw.style.filter =
        `drop-shadow(0 0 ${20 + intensity * 40}px ` +
        `rgba(255,102,102,${0.25 + intensity * 0.4}))`;
    }
  }

  function loop() {
    if (!shouldRun()) {
      stop();
      return;
    }

    // Cập nhật ở mọi frame của màn hình và không bỏ qua thay đổi nhỏ.
    render(readBass());
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running || !shouldRun()) return;

    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (!running) return;

    running = false;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function syncState() {
    if (shouldRun()) start();
    else stop();
  }

  document.addEventListener("visibilitychange", syncState);

  const bodyObserver = new MutationObserver(syncState);
  bodyObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });

  render(0);
  start();
}
