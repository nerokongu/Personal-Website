export function formatTime(time) {
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60);

  return `${min}:${sec < 10 ? "0" + sec : sec}`;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}