export function initGlow(audioSystem) {
  const { analyser, dataArray } = audioSystem;

  const card = document.querySelector(".profile-card");
  const links = document.querySelectorAll(".links a");
  const bmw = document.getElementById("bmw-menu");

  function animateGlow() {
    analyser.getByteFrequencyData(dataArray);

    const bass = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
    const intensity = bass / 255;

    card.style.boxShadow = `
      0 0 ${20 + intensity * 40}px rgba(255,255,255,${0.15 + intensity * 0.4})
    `;

    if (bmw) {
      bmw.exposure = 0.8 + intensity * 1.2;

      bmw.style.filter = `
        drop-shadow(0 0 ${20 + intensity * 40}px rgba(255,102,102,${0.25 + intensity * 0.4}))
      `;
    }

    links.forEach(link => {
      link.style.boxShadow = `
        0 0 ${10 + intensity * 25}px rgba(255,255,255,${0.1 + intensity * 0.3})
      `;
    });

    requestAnimationFrame(animateGlow);
  }

  animateGlow();
}