export function initDevice() {
  const isPhone =
    /Android|iPhone|iPod/i.test(navigator.userAgent) &&
    !/iPad/i.test(navigator.userAgent);

  if (isPhone) {
    document.getElementById("mobile-only").style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  return isPhone;
}