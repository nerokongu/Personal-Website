import { db } from "../firebase-config.js";

import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

export function initMoviePage() {
  const openMovieBtn = document.getElementById("open-movie");
  const moviePage = document.getElementById("movie-page");
  const musicPage = document.getElementById("music-page");
  const gymPage = document.getElementById("gym-page");
  const backBtn = document.getElementById("music-back-global");
  const curtainMenu = document.getElementById("curtain-menu");

  const movieIntro = document.getElementById("movie-intro");
  const movieIntroSkip = document.getElementById("movie-intro-skip");

  const movieTabs = [...document.querySelectorAll(".movie-tab")];
  const movieGrid = document.getElementById("movie-poster-row");
  const movieRowTitle = document.getElementById("movie-row-title");
  const movieTotalCount = document.getElementById("movie-total-count");
  const emptyState = document.getElementById("movie-empty-state");

  const searchWrap = document.querySelector(".movie-search");
  const searchInput = document.getElementById("movie-search-input");
  const searchClearBtn = document.getElementById("movie-search-clear");

  const detailModal = document.getElementById("movie-detail-modal");
  const detailCloseBtn = document.getElementById("movie-detail-close");
  const detailDismissBtn = document.getElementById("movie-detail-dismiss");

  const heroTitle = document.getElementById("movie-hero-title");
  const heroMeta = document.getElementById("movie-hero-meta");
  const heroImg = document.getElementById("movie-hero-img");
  const movieDesc = document.getElementById("movie-desc");
  const descToggleBtn = document.getElementById("movie-desc-toggle");
  const movieWatchBtn = document.getElementById("movie-watch-btn");

  const defaultPoster = "assets/images/Đỗ thánh 3.jpeg";

  if (!openMovieBtn || !moviePage || !movieGrid || !detailModal) {
    console.warn("⚠️ Movie elements not found");
    return;
  }

  let movieBgStarted = false;
  let movieDataStarted = false;
  let unsubscribeMovies = null;

  let movieIntroTimer = 0;
  let movieIntroFinishTimer = 0;

  let activeCategory = "stephen-chow";
  let selectedCard = null;
  let searchValue = "";

  const createCollections = () => ({
    "stephen-chow": {
      title: "Châu Tinh Trì Collection",
      movies: []
    },
    favorite: {
      title: "Favorite Movies",
      movies: []
    },
    websites: {
      title: "Movie Websites",
      movies: []
    },
    backup: {
      title: "Backup Links",
      movies: []
    }
  });

  let movieCollections = createCollections();

  function ensureMovieBackground() {
    if (movieBgStarted) return;

    movieBgStarted = true;

    import("../effects/movie-bg.js")
      .then(({ initMovieBackground }) => {
        initMovieBackground();
        console.log("✅ Movie background started");
      })
      .catch(error => {
        console.warn("⚠️ Không load được Movie background:", error);
      });
  }

  function clearMovieIntroTimers() {
    window.clearTimeout(movieIntroTimer);
    window.clearTimeout(movieIntroFinishTimer);

    movieIntroTimer = 0;
    movieIntroFinishTimer = 0;
  }

  function finishMovieIntro(immediate = false) {
    clearMovieIntroTimers();

    if (!moviePage.classList.contains("active")) return;

    if (immediate) {
      moviePage.classList.remove(
        "movie-intro-running",
        "movie-intro-leaving"
      );

      moviePage.classList.add("movie-intro-ready");

      movieIntro?.setAttribute("aria-hidden", "true");
      return;
    }

    moviePage.classList.remove("movie-intro-running");
    moviePage.classList.add("movie-intro-leaving");

    movieIntroFinishTimer = window.setTimeout(() => {
      moviePage.classList.remove("movie-intro-leaving");
      moviePage.classList.add("movie-intro-ready");

      movieIntro?.setAttribute("aria-hidden", "true");
    }, 430);
  }

  function playMovieIntro() {
    clearMovieIntroTimers();

    moviePage.classList.remove(
      "movie-intro-ready",
      "movie-intro-leaving"
    );

    // Ép browser nhận trạng thái reset để animation chạy lại mỗi lần mở.
    void moviePage.offsetWidth;

    moviePage.classList.add("movie-intro-running");
    movieIntro?.setAttribute("aria-hidden", "false");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    movieIntroTimer = window.setTimeout(
      () => finishMovieIntro(false),
      reduceMotion ? 420 : 2320
    );
  }

  function openMoviePage() {
    ensureMovieBackground();
    listenMoviesFromFirestore();

    curtainMenu?.classList.remove("open");
    musicPage?.classList.remove("active");
    gymPage?.classList.remove("active");

    moviePage.classList.add("active");
    moviePage.setAttribute("aria-hidden", "false");

    playMovieIntro();

    backBtn?.classList.add("active");

    document.body.classList.add("sub-page-open", "movie-open");
    document.body.classList.remove(
      "music-open",
      "gym-open",
      "music-entering"
    );

    moviePage.scrollTop = 0;
  }

  function closeMoviePage() {
    if (!document.body.classList.contains("movie-open")) return;

    clearMovieIntroTimers();
    closeMovieDetail();

    moviePage.classList.remove(
      "active",
      "movie-intro-running",
      "movie-intro-leaving",
      "movie-intro-ready"
    );

    moviePage.setAttribute("aria-hidden", "true");
    movieIntro?.setAttribute("aria-hidden", "true");
    backBtn?.classList.remove("active");

    document.body.classList.remove(
      "sub-page-open",
      "movie-open",
      "movie-detail-open"
    );

    if (unsubscribeMovies) {
      unsubscribeMovies();
      unsubscribeMovies = null;
    }

    movieDataStarted = false;
  }

  function closeMovieDetail() {
    detailModal.classList.remove("active");
    detailModal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("movie-detail-open");
    movieDesc?.classList.remove("expanded");

    if (descToggleBtn) {
      descToggleBtn.textContent = "Xem thêm";
    }

    selectedCard?.focus({ preventScroll: true });
  }

  function openMovieDetail(movie, card) {
    document.querySelectorAll(".movie-poster-card").forEach(item => {
      item.classList.remove("active");
    });

    card?.classList.add("active");
    selectedCard = card || null;

    heroTitle.textContent = movie.title;

    const metaParts = [movie.year, movie.genre].filter(Boolean);
    heroMeta.textContent = metaParts.length
      ? metaParts.join(" • ")
      : "Movie Collection";

    heroImg.src = getSafePosterUrl(movie.poster);
    heroImg.alt = movie.title;

    heroImg.onerror = () => {
      heroImg.onerror = null;
      heroImg.src = defaultPoster;
    };

    const description =
      movie.desc.trim() ||
      "Phim này chưa có phần mô tả.";

    movieDesc.textContent = description;
    movieDesc.classList.remove("expanded");

    if (descToggleBtn) {
      descToggleBtn.hidden = description.length <= 250;
      descToggleBtn.textContent = "Xem thêm";
    }

    updateWatchButton(movie.link);

    detailModal.classList.add("active");
    detailModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("movie-detail-open");

    window.setTimeout(() => detailCloseBtn?.focus(), 80);
  }

  function updateWatchButton(link) {
    const label = movieWatchBtn?.querySelector("span");
    const safeLink = getSafeExternalUrl(link);

    if (safeLink) {
      movieWatchBtn.href = safeLink;
      movieWatchBtn.classList.remove("disabled");
      if (label) label.textContent = "Mở phim";
    } else {
      movieWatchBtn.href = "#";
      movieWatchBtn.classList.add("disabled");
      if (label) label.textContent = "Chưa có link";
    }
  }

  function createMovieCard(movie) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "movie-poster-card";
    card.setAttribute("aria-label", `Xem thông tin phim ${movie.title}`);

    const posterWrap = document.createElement("div");
    posterWrap.className = "movie-poster-img-wrap";

    const poster = document.createElement("img");
    poster.src = getSafePosterUrl(movie.poster);
    poster.alt = movie.title;
    poster.loading = "lazy";
    poster.decoding = "async";

    poster.addEventListener("error", () => {
      poster.src = defaultPoster;
    }, { once: true });

    const badge = document.createElement("span");
    badge.className = "movie-poster-badge";
    badge.textContent = movie.genre || "Movie";

    const overlay = document.createElement("div");
    overlay.className = "movie-poster-overlay";

    const play = document.createElement("span");
    play.className = "movie-poster-play";
    play.innerHTML = '<i class="fa-solid fa-play"></i>';

    overlay.appendChild(play);
    posterWrap.append(poster, badge, overlay);

    const info = document.createElement("div");
    info.className = "movie-poster-info";

    const title = document.createElement("strong");
    title.textContent = movie.title;

    const year = document.createElement("span");
    year.textContent = movie.year || "Chưa rõ năm";

    info.append(title, year);
    card.append(posterWrap, info);

    card.addEventListener("click", () => {
      openMovieDetail(movie, card);
    });

    return card;
  }

  function renderCollection(category = activeCategory) {
    const collection = movieCollections[category];
    if (!collection) return;

    activeCategory = category;
    movieRowTitle.textContent = collection.title;

    const normalizedSearch = normalizeText(searchValue);

    const visibleMovies = collection.movies.filter(movie => {
      if (!normalizedSearch) return true;

      const haystack = normalizeText(
        `${movie.title} ${movie.year} ${movie.genre}`
      );

      return haystack.includes(normalizedSearch);
    });

    movieGrid.replaceChildren();

    visibleMovies.forEach(movie => {
      movieGrid.appendChild(createMovieCard(movie));
    });

    movieTotalCount.textContent = `${visibleMovies.length} phim`;

    const hasMovies = visibleMovies.length > 0;
    movieGrid.hidden = !hasMovies;
    emptyState.hidden = hasMovies;
  }

  function setActiveCategory(category) {
    movieTabs.forEach(tab => {
      const active = tab.dataset.category === category;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    closeMovieDetail();
    renderCollection(category);
  }

  function listenMoviesFromFirestore() {
    if (movieDataStarted) return;

    movieDataStarted = true;

    const moviesRef = collection(db, "movies");
    const moviesQuery = query(
      moviesRef,
      orderBy("createdAt", "desc")
    );

    unsubscribeMovies = onSnapshot(
      moviesQuery,

      snapshot => {
        movieCollections = createCollections();

        snapshot.docs.forEach(item => {
          const rawMovie = item.data();
          const category =
            rawMovie.category || "stephen-chow";

          if (!movieCollections[category]) return;

          movieCollections[category].movies.push({
            id: item.id,
            title: String(rawMovie.title || "Untitled").trim(),
            year: String(rawMovie.year || "").trim(),
            genre: String(rawMovie.genre || "").trim(),
            desc: String(rawMovie.desc || "").trim(),
            poster: String(rawMovie.poster || defaultPoster).trim(),
            link: String(rawMovie.link || "").trim()
          });
        });

        renderCollection(activeCategory);
      },

      error => {
        console.error(
          "Không đọc được movies từ Firestore:",
          error
        );

        movieDataStarted = false;
        unsubscribeMovies = null;

        movieGrid.hidden = true;
        emptyState.hidden = false;

        emptyState.querySelector("strong").textContent =
          "Không tải được danh sách phim";

        emptyState.querySelector("span").textContent =
          "Kiểm tra Firestore Rules hoặc kết nối mạng.";
      }
    );
  }

  function normalizeText(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function getSafeExternalUrl(value) {
    if (!value) return "";

    try {
      const url = new URL(value, window.location.origin);

      if (!["http:", "https:"].includes(url.protocol)) {
        return "";
      }

      return url.href;
    } catch {
      return "";
    }
  }

  function getSafePosterUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return defaultPoster;

    if (
      raw.startsWith("./") ||
      raw.startsWith("../") ||
      raw.startsWith("/") ||
      raw.startsWith("assets/")
    ) {
      return raw;
    }

    return getSafeExternalUrl(raw) || defaultPoster;
  }

  openMovieBtn.addEventListener("click", openMoviePage);

  movieIntroSkip?.addEventListener("click", () => {
    finishMovieIntro(true);
  });

  backBtn?.addEventListener("click", closeMoviePage);

  movieTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      setActiveCategory(
        tab.dataset.category || "stephen-chow"
      );
    });
  });

  searchInput?.addEventListener("input", () => {
    searchValue = searchInput.value;

    searchWrap?.classList.toggle(
      "has-value",
      Boolean(searchValue)
    );

    renderCollection(activeCategory);
  });

  searchClearBtn?.addEventListener("click", () => {
    searchValue = "";
    searchInput.value = "";
    searchWrap?.classList.remove("has-value");

    renderCollection(activeCategory);
    searchInput.focus();
  });

  detailCloseBtn?.addEventListener("click", closeMovieDetail);
  detailDismissBtn?.addEventListener("click", closeMovieDetail);

  detailModal
    .querySelectorAll("[data-close-movie-detail]")
    .forEach(button => {
      button.addEventListener("click", closeMovieDetail);
    });

  descToggleBtn?.addEventListener("click", () => {
    const expanded = movieDesc.classList.toggle("expanded");
    descToggleBtn.textContent =
      expanded ? "Thu gọn" : "Xem thêm";
  });

  movieWatchBtn?.addEventListener("click", event => {
    if (movieWatchBtn.classList.contains("disabled")) {
      event.preventDefault();
    }
  });

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      detailModal.classList.contains("active")
    ) {
      closeMovieDetail();
    }
  });

  renderCollection("stephen-chow");
}
