export function initContact() {
  const contactBtn = document.getElementById("contact-btn");
  const contactOverlay = document.getElementById("contact-overlay");
  const contactPopup = document.getElementById("contact-popup");

  if (!contactBtn || !contactOverlay || !contactPopup) {
    console.warn("⚠️ Contact elements not found");
    return;
  }

  contactBtn.addEventListener("click", (e) => {
    e.preventDefault();
    contactOverlay.classList.add("active");
  });

  contactOverlay.addEventListener("click", () => {
    contactOverlay.classList.remove("active");
  });

  contactPopup.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}