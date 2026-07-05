export function initDevice() {
  const isPhone =
    /Android|iPhone|iPod/i.test(navigator.userAgent) &&
    !/iPad/i.test(navigator.userAgent);

  if (isPhone) {
    const mobileOnly = document.getElementById("mobile-only");

    document.body.classList.add("phone-locked");
    document.body.style.overflow = "hidden";

    if (mobileOnly) {
      mobileOnly.style.display = "flex";

      const mobileModel = document.getElementById("mobile-model");

      if (mobileModel && mobileModel.dataset.src) {
        mobileModel.src = mobileModel.dataset.src;
      }

      setupMobileOnlyEffects(mobileOnly);
    }
  }

  return isPhone;
}

function setupMobileOnlyEffects(mobileOnly) {
  if (!mobileOnly) return;

  // Thêm các layer hiệu ứng nếu chưa có
  if (!mobileOnly.querySelector(".mobile-tech-grid")) {
    const grid = document.createElement("div");
    grid.className = "mobile-tech-grid";
    mobileOnly.appendChild(grid);
  }

  if (!mobileOnly.querySelector(".mobile-scan-line")) {
    const scan = document.createElement("div");
    scan.className = "mobile-scan-line";
    mobileOnly.appendChild(scan);
  }

  if (!mobileOnly.querySelector(".mobile-orbit")) {
    const orbit = document.createElement("div");
    orbit.className = "mobile-orbit";
    mobileOnly.appendChild(orbit);
  }

  if (!mobileOnly.querySelector(".mobile-hint")) {
    const hint = document.createElement("div");
    hint.className = "mobile-hint";
    hint.innerHTML = `
      <span>DESKTOP EXPERIENCE REQUIRED</span>
      <small>Open this website on PC for full access</small>
    `;
    mobileOnly.appendChild(hint);
  }

  // Hiệu ứng chạm trên điện thoại
  mobileOnly.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    createTouchPulse(mobileOnly, touch.clientX, touch.clientY);
  });

  mobileOnly.addEventListener("click", (e) => {
    createTouchPulse(mobileOnly, e.clientX, e.clientY);
  });
}

function createTouchPulse(parent, x, y) {
  const pulse = document.createElement("span");
  pulse.className = "mobile-touch-pulse";

  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;

  parent.appendChild(pulse);

  setTimeout(() => {
    pulse.remove();
  }, 700);
}