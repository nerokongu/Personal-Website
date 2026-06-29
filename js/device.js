export function initDevice() {
  const isPhone =
    /Android|iPhone|iPod/i.test(navigator.userAgent) &&
    !/iPad/i.test(navigator.userAgent);

  if (isPhone) {
    document.body.classList.add("is-phone");
  }

  return isPhone;
}