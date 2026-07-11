export function initGymPage() {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const openBtn = $("#open-gym");
  const page = $("#gym-page");
  const musicPage = $("#music-page");
  const moviePage = $("#movie-page");
  const backBtn = $("#music-back-global");
  const curtainMenu = $("#curtain-menu");

  const introBtn = $("#gym-intro-start");
  const form = $("#gym-form");
  const tabs = $$("[data-gym-tab]");
  const panels = $$("[data-gym-panel]");

  const inputs = {
    gender: $("#gym-gender"),
    age: $("#gym-age"),
    weight: $("#gym-weight"),
    height: $("#gym-height"),
    activity: $("#gym-activity"),
    goal: $("#gym-goal"),
    days: $("#gym-days")
  };

  const out = {
    bmi: $("#gym-bmi"),
    bmiNote: $("#gym-bmi-note"),
    bmr: $("#gym-bmr"),
    tdee: $("#gym-tdee"),
    target: $("#gym-target"),
    goalNote: $("#gym-goal-note"),
    protein: $("#gym-protein"),
    carbs: $("#gym-carbs"),
    fats: $("#gym-fats"),
    workout: $("#gym-workout-plan"),
    meals: $("#gym-meal-plan"),
    progress: $("#gym-progress-summary"),
    chart: $("#gym-progress-chart"),
    chartDelta: $("#gym-chart-delta")
  };

  if (!openBtn || !page || !form) {
    console.warn("⚠️ Gym elements not found");
    return;
  }

  let introTimer = 0;
  let resizeTimer = 0;
  let currentResult = null;

  const STORAGE_KEY = "neroGymProfile";

  function clampNumber(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(Math.max(number, min), max);
  }

  function saveProfile() {
    const profile = {};

    Object.entries(inputs).forEach(([key, input]) => {
      profile[key] = input.value;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  function restoreProfile() {
    try {
      const profile = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!profile) return;

      Object.entries(inputs).forEach(([key, input]) => {
        if (profile[key] != null) input.value = profile[key];
      });
    } catch (error) {
      console.warn("⚠️ Không đọc được Gym profile:", error);
    }
  }

  function finishIntro() {
    clearTimeout(introTimer);
    page.classList.remove("intro-running");
    page.classList.add("intro-done");
  }

  function playIntro() {
    clearTimeout(introTimer);
    page.classList.remove("intro-done");
    page.classList.add("intro-running");
    introTimer = window.setTimeout(finishIntro, 2300);
  }

  function openGym() {
    curtainMenu?.classList.remove("open");
    musicPage?.classList.remove("active");
    moviePage?.classList.remove("active");

    page.classList.add("active");
    page.setAttribute("aria-hidden", "false");

    backBtn?.classList.add("active");

    document.body.classList.add("sub-page-open", "gym-open");
    document.body.classList.remove("music-open", "movie-open");

    page.scrollTop = 0;
    playIntro();
    updatePlan();
  }

  function closeGym() {
    if (!page.classList.contains("active")) return;

    clearTimeout(introTimer);

    page.classList.remove("active", "intro-running", "intro-done");
    page.setAttribute("aria-hidden", "true");

    document.body.classList.remove("sub-page-open", "gym-open");
    backBtn?.classList.remove("active");
  }

  function switchTab(name) {
    tabs.forEach(tab => {
      const active = tab.dataset.gymTab === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    panels.forEach(panel => {
      panel.classList.toggle("active", panel.dataset.gymPanel === name);
    });

    if (name === "progress" && currentResult) {
      requestAnimationFrame(() => drawChart(currentResult));
    }
  }

  function calculate() {
    const gender = inputs.gender.value;
    const age = clampNumber(inputs.age.value, 22, 12, 80);
    const weight = clampNumber(inputs.weight.value, 72, 30, 250);
    const height = clampNumber(inputs.height.value, 178, 120, 230);
    const activity = clampNumber(inputs.activity.value, 1.55, 1.2, 1.9);
    const goal = inputs.goal.value;
    const days = clampNumber(inputs.days.value, 5, 3, 6);

    const bmi = weight / ((height / 100) ** 2);

    const bmr = gender === "female"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;

    const tdee = bmr * activity;

    const config = {
      cut: { factor: 0.85, protein: 2.2, fat: 0.8, text: "Thâm hụt khoảng 15%" },
      maintain: { factor: 1, protein: 1.8, fat: 0.8, text: "Mức duy trì" },
      bulk: { factor: 1.1, protein: 2, fat: 0.9, text: "Dư khoảng 10%" }
    }[goal];

    const target = tdee * config.factor;
    const protein = weight * config.protein;
    const fats = weight * config.fat;
    const carbs = Math.max(0, (target - protein * 4 - fats * 9) / 4);

    return {
      gender, age, weight, height, activity, goal, days,
      bmi, bmr, tdee, target, protein, fats, carbs,
      goalText: config.text
    };
  }

  function bmiNote(bmi) {
    if (bmi < 18.5) return "Thiếu cân";
    if (bmi < 23) return "Cân đối";
    if (bmi < 25) return "Hơi dư cân";
    return "Dư cân";
  }

  function setNumber(element, value, digits = 0, suffix = "") {
    if (!element) return;
    element.textContent = `${Number(value).toFixed(digits)}${suffix}`;
  }

  const plans = {
    3: [
      ["Push", "Ngực · Vai · Tay sau", ["Bench Press · 4 × 6–10", "Incline DB Press · 3 × 8–12", "Shoulder Press · 3 × 8–12", "Lateral Raise · 3 × 12–15", "Tricep Pushdown · 3 × 10–15"]],
      ["Pull", "Lưng · Tay trước", ["Lat Pulldown · 4 × 8–12", "Barbell Row · 3 × 6–10", "Seated Row · 3 × 10–12", "Face Pull · 3 × 12–15", "Barbell Curl · 3 × 10–12"]],
      ["Legs", "Chân · Mông · Core", ["Squat · 4 × 6–10", "Leg Press · 3 × 10–12", "Romanian Deadlift · 3 × 8–12", "Leg Curl · 3 × 10–15", "Calf Raise · 4 × 12–20"]]
    ],
    4: [
      ["Upper Strength", "Thân trên · Sức mạnh", ["Bench Press · 4 × 5–8", "Barbell Row · 4 × 6–8", "Shoulder Press · 3 × 6–10", "Lat Pulldown · 3 × 8–10"]],
      ["Lower Strength", "Chân · Sức mạnh", ["Squat · 4 × 5–8", "Romanian Deadlift · 4 × 6–10", "Leg Press · 3 × 8–12", "Calf Raise · 4 × 12–18"]],
      ["Upper Volume", "Ngực · Lưng · Vai", ["Incline Press · 4 × 8–12", "Cable Row · 4 × 8–12", "Lateral Raise · 4 × 12–15", "Pull-up · 3 × 6–10"]],
      ["Lower Volume", "Quad · Hamstring · Glute", ["Hack Squat · 4 × 8–12", "Bulgarian Split Squat · 3 × 8–12", "Hip Thrust · 3 × 8–12", "Leg Extension · 3 × 12–15"]]
    ],
    5: [
      ["Chest + Triceps", "Ngực · Tay sau", ["Bench Press · 4 × 6–10", "Incline DB Press · 4 × 8–12", "Chest Fly · 3 × 12–15", "Dip · 3 × 8–12"]],
      ["Back + Biceps", "Lưng · Tay trước", ["Lat Pulldown · 4 × 8–12", "Barbell Row · 4 × 6–10", "Cable Row · 3 × 10–12", "EZ Bar Curl · 3 × 10–12"]],
      ["Legs", "Chân toàn diện", ["Squat · 4 × 6–10", "Leg Press · 4 × 10–12", "Romanian Deadlift · 3 × 8–12", "Leg Curl · 3 × 12–15"]],
      ["Shoulders + Abs", "Vai · Core", ["Shoulder Press · 4 × 8–12", "Lateral Raise · 4 × 12–15", "Rear Delt Fly · 3 × 12–15", "Cable Crunch · 3 × 15"]],
      ["Upper Pump", "Nhóm cơ ưu tiên", ["Incline Press · 3 × 10–12", "Pull-up / Row · 3 × 8–12", "Machine Press · 3 × 10–12", "Arms Finisher · 2 × 15"]]
    ],
    6: [
      ["Push A", "Ngực · Vai · Tay sau", ["Bench Press · 4 × 6–10", "Incline Press · 3 × 8–12", "Shoulder Press · 3 × 8–12", "Tricep Pushdown · 3 × 10–15"]],
      ["Pull A", "Lưng · Tay trước", ["Lat Pulldown · 4 × 8–12", "Barbell Row · 3 × 6–10", "Seated Row · 3 × 10–12", "Barbell Curl · 3 × 10–12"]],
      ["Legs A", "Quad dominant", ["Squat · 4 × 6–10", "Leg Press · 3 × 10–12", "Leg Extension · 3 × 12–15", "Calf Raise · 4 × 15–20"]],
      ["Push B", "Volume push", ["Machine Press · 4 × 8–12", "Incline DB Press · 3 × 8–12", "Arnold Press · 3 × 10–12", "Overhead Extension · 3 × 10–12"]],
      ["Pull B", "Volume pull", ["Pull-up · 4 × 6–10", "Chest Supported Row · 3 × 8–12", "Cable Row · 3 × 10–12", "Hammer Curl · 3 × 10–12"]],
      ["Legs B", "Hamstring · Glute", ["Romanian Deadlift · 4 × 6–10", "Bulgarian Split Squat · 3 × 8–12", "Hip Thrust · 3 × 8–12", "Leg Curl · 3 × 12–15"]]
    ]
  };

  function renderWorkout(days) {
    out.workout.innerHTML = "";

    plans[days].forEach(([title, focus, exercises], index) => {
      const card = document.createElement("article");
      card.className = "gym-day";

      const heading = document.createElement("h4");
      heading.textContent = `${String(index + 1).padStart(2, "0")} · ${title}`;

      const sub = document.createElement("p");
      sub.textContent = focus;

      const list = document.createElement("ul");

      exercises.forEach(exercise => {
        const li = document.createElement("li");
        li.textContent = exercise;
        list.appendChild(li);
      });

      card.append(heading, sub, list);
      out.workout.appendChild(card);
    });
  }

  function renderMeals(result) {
    const meals = [
      ["Bữa sáng", 0.25, ["Yến mạch hoặc bánh mì nguyên cám", "Trứng / sữa chua Hy Lạp", "Một phần trái cây"]],
      ["Bữa trưa", 0.30, ["Cơm hoặc khoai", "150–200g thịt nạc / cá", "Rau xanh và chất béo tốt"]],
      ["Quanh buổi tập", 0.20, ["Carb dễ tiêu trước tập", "Protein sau tập", "Bổ sung đủ nước"]],
      ["Bữa tối", 0.25, ["Thịt nạc / cá / trứng", "Tinh bột vừa đủ", "Rau xanh"]]
    ];

    if (result.goal === "cut") meals[3][2].push("Ưu tiên món no lâu, ít dầu");
    if (result.goal === "bulk") meals[2][2].push("Tăng carb quanh giờ tập");

    out.meals.innerHTML = "";

    meals.forEach(([title, ratio, foods]) => {
      const card = document.createElement("article");
      card.className = "gym-meal";

      const heading = document.createElement("h4");
      heading.innerHTML = `<span>${title}</span><small>${Math.round(result.target * ratio)} kcal</small>`;

      const list = document.createElement("ul");

      foods.forEach(food => {
        const li = document.createElement("li");
        li.textContent = food;
        list.appendChild(li);
      });

      card.append(heading, list);
      out.meals.appendChild(card);
    });
  }

  function renderProgress(result) {
    const targetText = result.goal === "cut"
      ? "Giảm khoảng 0,3–0,6% cân nặng mỗi tuần."
      : result.goal === "bulk"
        ? "Tăng chậm khoảng 0,1–0,3% mỗi tuần."
        : "Giữ cân trong biên độ khoảng ±0,5 kg.";

    const items = [
      ["fa-weight-scale", "Cân 3–4 lần / tuần", "Theo dõi cân nặng trung bình thay vì một ngày."],
      ["fa-camera", "Ảnh tiến độ mỗi 2 tuần", "Chụp cùng ánh sáng và góc đứng."],
      ["fa-arrow-trend-up", "Tăng tải có kiểm soát", "Thêm rep hoặc mức tạ khi kỹ thuật vẫn tốt."],
      ["fa-bullseye", "Tốc độ mục tiêu", targetText]
    ];

    out.progress.innerHTML = "";

    items.forEach(([iconName, titleText, bodyText]) => {
      const item = document.createElement("div");
      item.className = "gym-progress-item";

      const icon = document.createElement("i");
      icon.className = `fa-solid ${iconName}`;

      const text = document.createElement("div");
      const strong = document.createElement("strong");
      const span = document.createElement("span");

      strong.textContent = titleText;
      span.textContent = bodyText;

      text.append(strong, span);
      item.append(icon, text);
      out.progress.appendChild(item);
    });
  }

  function weightTrend(result) {
    const weekly = result.goal === "cut"
      ? -(result.weight * 0.004)
      : result.goal === "bulk"
        ? result.weight * 0.002
        : 0;

    return Array.from({ length: 8 }, (_, index) =>
      result.weight + weekly * index + Math.sin(index * 1.1) * 0.05
    );
  }

  function drawChart(result) {
    const canvas = out.chart;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const values = weightTrend(result);
    const min = Math.min(...values) - 0.3;
    const max = Math.max(...values) + 0.3;
    const pad = { left: 42, right: 18, top: 22, bottom: 32 };
    const width = rect.width - pad.left - pad.right;
    const height = rect.height - pad.top - pad.bottom;

    const x = index => pad.left + index / (values.length - 1) * width;
    const y = value => pad.top + (1 - (value - min) / Math.max(0.1, max - min)) * height;

    ctx.font = "11px Segoe UI, Arial";

    for (let i = 0; i < 4; i++) {
      const lineY = pad.top + i / 3 * height;
      ctx.beginPath();
      ctx.moveTo(pad.left, lineY);
      ctx.lineTo(rect.width - pad.right, lineY);
      ctx.strokeStyle = "rgba(255,255,255,.075)";
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,.38)";
      ctx.textAlign = "right";
      ctx.fillText((max - i / 3 * (max - min)).toFixed(1), pad.left - 8, lineY + 3);
    }

    values.forEach((_, index) => {
      ctx.fillStyle = "rgba(255,255,255,.34)";
      ctx.textAlign = "center";
      ctx.fillText(`W${index + 1}`, x(index), rect.height - 12);
    });

    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + height);
    gradient.addColorStop(0, "rgba(255,66,66,.28)");
    gradient.addColorStop(1, "rgba(255,66,66,0)");

    ctx.beginPath();
    values.forEach((value, index) => index ? ctx.lineTo(x(index), y(value)) : ctx.moveTo(x(index), y(value)));
    ctx.lineTo(x(values.length - 1), pad.top + height);
    ctx.lineTo(x(0), pad.top + height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    values.forEach((value, index) => index ? ctx.lineTo(x(index), y(value)) : ctx.moveTo(x(index), y(value)));
    ctx.strokeStyle = "#ff4242";
    ctx.lineWidth = 2.3;
    ctx.shadowColor = "rgba(255,66,66,.7)";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    values.forEach((value, index) => {
      ctx.beginPath();
      ctx.arc(x(index), y(value), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    });

    const delta = values.at(-1) - values[0];
    out.chartDelta.textContent = `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg / 8 tuần`;
  }

  function updatePlan() {
    const result = calculate();
    currentResult = result;
    saveProfile();

    setNumber(out.bmi, result.bmi, 1);
    setNumber(out.bmr, Math.round(result.bmr));
    setNumber(out.tdee, Math.round(result.tdee));
    setNumber(out.target, Math.round(result.target));

    out.bmiNote.textContent = bmiNote(result.bmi);
    out.goalNote.textContent = result.goalText;

    setNumber(out.protein, Math.round(result.protein), 0, "g");
    setNumber(out.carbs, Math.round(result.carbs), 0, "g");
    setNumber(out.fats, Math.round(result.fats), 0, "g");

    renderWorkout(result.days);
    renderMeals(result);
    renderProgress(result);

    if ($('[data-gym-panel="progress"]').classList.contains("active")) {
      requestAnimationFrame(() => drawChart(result));
    }
  }


  function closeCustomSelects(exceptControl = null) {
    $$(".gym-select-control.open").forEach(control => {
      if (control === exceptControl) return;

      control.classList.remove("open");
      control.closest(".gym-field")?.classList.remove("select-open");

      const trigger = control.querySelector(".gym-select-trigger");
      trigger?.setAttribute("aria-expanded", "false");
    });
  }

  function initCustomSelects() {
    $$(".gym-select-control").forEach((control, selectIndex) => {
      const select = control.querySelector(".gym-native-select");

      if (!select || control.dataset.customReady === "true") return;

      control.dataset.customReady = "true";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "gym-select-trigger";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");

      const valueText = document.createElement("span");
      valueText.className = "gym-select-value";

      const arrow = document.createElement("span");
      arrow.className = "gym-select-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';

      const menu = document.createElement("div");
      menu.className = "gym-select-menu";
      menu.id = `gym-select-menu-${selectIndex}`;
      menu.setAttribute("role", "listbox");

      trigger.setAttribute("aria-controls", menu.id);
      trigger.append(valueText, arrow);

      const optionButtons = [...select.options].map((option, optionIndex) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "gym-select-option";
        button.dataset.value = option.value;
        button.textContent = option.textContent;
        button.setAttribute("role", "option");
        button.setAttribute("tabindex", "-1");
        button.id = `${menu.id}-option-${optionIndex}`;

        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();

          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));

          syncCustomSelect();
          closeCustomSelects();

          trigger.focus();

          control.classList.remove("control-pulse");
          void control.offsetWidth;
          control.classList.add("control-pulse");
        });

        menu.appendChild(button);
        return button;
      });

      function syncCustomSelect() {
        const selectedOption =
          select.options[select.selectedIndex] || select.options[0];

        valueText.textContent = selectedOption?.textContent || "";

        optionButtons.forEach(button => {
          const selected = button.dataset.value === select.value;

          button.classList.toggle("selected", selected);
          button.setAttribute("aria-selected", String(selected));
        });
      }

      function openCustomSelect() {
        closeCustomSelects(control);

        control.classList.add("open");
        control.closest(".gym-field")?.classList.add("select-open");
        trigger.setAttribute("aria-expanded", "true");

        const selectedButton =
          menu.querySelector(".gym-select-option.selected") ||
          menu.querySelector(".gym-select-option");

        window.setTimeout(() => selectedButton?.focus(), 30);
      }

      function closeCustomSelect() {
        control.classList.remove("open");
        control.closest(".gym-field")?.classList.remove("select-open");
        trigger.setAttribute("aria-expanded", "false");
      }

      trigger.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        if (control.classList.contains("open")) {
          closeCustomSelect();
        } else {
          openCustomSelect();
        }
      });

      trigger.addEventListener("keydown", event => {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
          event.preventDefault();
          openCustomSelect();
        }
      });

      menu.addEventListener("keydown", event => {
        const focusedIndex = optionButtons.indexOf(document.activeElement);

        if (event.key === "ArrowDown") {
          event.preventDefault();

          const nextIndex =
            focusedIndex < optionButtons.length - 1 ? focusedIndex + 1 : 0;

          optionButtons[nextIndex]?.focus();
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();

          const nextIndex =
            focusedIndex > 0 ? focusedIndex - 1 : optionButtons.length - 1;

          optionButtons[nextIndex]?.focus();
        }

        if (event.key === "Home") {
          event.preventDefault();
          optionButtons[0]?.focus();
        }

        if (event.key === "End") {
          event.preventDefault();
          optionButtons.at(-1)?.focus();
        }

        if (event.key === "Escape") {
          event.preventDefault();
          closeCustomSelect();
          trigger.focus();
        }

        if (event.key === "Tab") {
          closeCustomSelect();
        }
      });

      select.addEventListener("change", syncCustomSelect);

      control.append(trigger, menu);
      syncCustomSelect();
    });

    document.addEventListener("click", () => closeCustomSelects());

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeCustomSelects();
      }
    });
  }

  function initNumberSteppers() {
    const stepButtons = $$(".gym-step-btn");

    let repeatDelay = 0;
    let repeatInterval = 0;

    function clearRepeat() {
      window.clearTimeout(repeatDelay);
      window.clearInterval(repeatInterval);

      repeatDelay = 0;
      repeatInterval = 0;

      stepButtons.forEach(button => {
        button.classList.remove("is-pressing");
      });
    }

    function decimalsFromStep(step) {
      const text = String(step);

      return text.includes(".")
        ? text.split(".")[1].length
        : 0;
    }

    function changeNumber(button) {
      const input = document.getElementById(button.dataset.stepTarget);

      if (!input) return;

      const direction =
        button.dataset.stepDirection === "down" ? -1 : 1;

      const step = Number(input.step || 1);
      const min = input.min === "" ? -Infinity : Number(input.min);
      const max = input.max === "" ? Infinity : Number(input.max);

      let currentValue = Number(input.value);

      if (!Number.isFinite(currentValue)) {
        currentValue = Number.isFinite(min) ? min : 0;
      }

      let nextValue = currentValue + direction * step;
      nextValue = Math.min(max, Math.max(min, nextValue));

      input.value = nextValue.toFixed(decimalsFromStep(step));

      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));

      const control = input.closest(".gym-control");

      if (control) {
        control.classList.remove("control-pulse");
        void control.offsetWidth;
        control.classList.add("control-pulse");
      }
    }

    stepButtons.forEach(button => {
      button.addEventListener("pointerdown", event => {
        event.preventDefault();

        clearRepeat();

        button.classList.add("is-pressing");
        button.setPointerCapture?.(event.pointerId);

        changeNumber(button);

        repeatDelay = window.setTimeout(() => {
          repeatInterval = window.setInterval(() => {
            changeNumber(button);
          }, 95);
        }, 420);
      });

      button.addEventListener("pointerup", clearRepeat);
      button.addEventListener("pointercancel", clearRepeat);
      button.addEventListener("lostpointercapture", clearRepeat);

      button.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          changeNumber(button);
        }
      });
    });

    window.addEventListener("pointerup", clearRepeat);
    window.addEventListener("blur", clearRepeat);
  }

  openBtn.addEventListener("click", openGym);
  introBtn?.addEventListener("click", finishIntro);

  backBtn?.addEventListener("click", closeGym);

  tabs.forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.dataset.gymTab));
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    updatePlan();
  });

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (currentResult && document.body.classList.contains("gym-open")) {
        drawChart(currentResult);
      }
    }, 140);
  });

  restoreProfile();
  initCustomSelects();
  initNumberSteppers();
  switchTab("workout");
  updatePlan();
}
