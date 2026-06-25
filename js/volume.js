export function initVolume(audioSystem) {
  const { audio } = audioSystem;

  const volumeSlider = document.getElementById("volume-slider");
  const volumeIcon = document.getElementById("volume-icon");

  audio.volume = 1;
  volumeSlider.value = 1;

  let lastVolume = 1;

  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
    lastVolume = audio.volume;

    volumeIcon.classList.toggle("muted", audio.volume === 0);
  });

  volumeIcon.addEventListener("click", () => {
    if (audio.volume > 0) {
      lastVolume = audio.volume;
      audio.volume = 0;
      volumeSlider.value = 0;
      volumeIcon.classList.add("muted");
    } else {
      audio.volume = lastVolume || 1;
      volumeSlider.value = audio.volume;
      volumeIcon.classList.remove("muted");
    }
  });
}