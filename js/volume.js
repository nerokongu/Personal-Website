export function initVolume(audioSystem) {
  const { audio, setVolume, toggleMute, getVolumeState } = audioSystem;

  const volumeSlider = document.getElementById("volume-slider");
  const volumeIcon = document.getElementById("volume-icon");

  if (!volumeSlider || !volumeIcon) return;

  function syncMainVolumeUI() {
    const state = getVolumeState
      ? getVolumeState()
      : {
          volume: audio.volume,
          muted: audio.muted,
          realVolume: audio.muted ? 0 : audio.volume
        };

    volumeSlider.value = state.realVolume;
    volumeIcon.classList.toggle("muted", state.muted || state.realVolume === 0);
  }

  volumeSlider.addEventListener("input", () => {
    setVolume(Number(volumeSlider.value));
    syncMainVolumeUI();
  });

  volumeIcon.addEventListener("click", () => {
    toggleMute();
    syncMainVolumeUI();
  });

  audio.addEventListener("volumechange", syncMainVolumeUI);
  window.addEventListener("nero-volume-sync", syncMainVolumeUI);

  syncMainVolumeUI();
}