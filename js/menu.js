export function initMenu() {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("curtain-menu");

  if (!toggle || !menu) {
    console.warn("⚠️ Menu elements not found");
    return;
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (
      menu.classList.contains("open") &&
      !menu.contains(e.target) &&
      !toggle.contains(e.target)
    ) {
      menu.classList.remove("open");
    }
  });
}