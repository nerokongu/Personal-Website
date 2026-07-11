export function initMoviePage() {
  const openMovieBtn = document.getElementById("open-movie");
  const moviePage = document.getElementById("movie-page");
  const musicPage = document.getElementById("music-page");
  const backBtn = document.getElementById("music-back-global");

  const movieTabs = document.querySelectorAll(".movie-tab");
  const posterRow = document.getElementById("movie-poster-row");

  const heroTitle = document.getElementById("movie-hero-title");
  const heroMeta = document.getElementById("movie-hero-meta");
  const heroImg = document.getElementById("movie-hero-img");
  const movieDesc = document.getElementById("movie-desc");
  const movieWatchBtn = document.getElementById("movie-watch-btn");
  const movieRowTitle = document.getElementById("movie-row-title");

  const defaultPoster = "assets/images/Đỗ thánh 3.jpeg";

  let movieBgStarted = false;
  let movieDataStarted = false;

  function ensureMovieBackground() {
    
    if (movieBgStarted) return;

    movieBgStarted = true;

    import("../effects/movie-bg.js")
      .then(({ initMovieBackground }) => {
        initMovieBackground();
        console.log("✅ Movie background started");
      })
      .catch((err) => {
        console.warn("⚠️ Không load được Movie background:", err);
      });
  }

  let movieCollections = {
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
  };

  openMovieBtn.addEventListener("click", () => {
    listenMoviesFromFirestore();
    ensureMovieBackground();
    
    document.getElementById("curtain-menu").classList.remove("open");

    musicPage.classList.remove("active");
    moviePage.classList.add("active");
    backBtn.classList.add("active");

    document.body.classList.add("sub-page-open", "movie-open");
    document.body.classList.remove("music-open");
  });

  movieTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      movieTabs.forEach(item => item.classList.remove("active"));
      tab.classList.add("active");

      renderCollection(tab.dataset.category);
    });
  });

  function renderCollection(category) {
    const collection = movieCollections[category];

    if (!collection || !posterRow) return;

    movieRowTitle.textContent = collection.title;
    posterRow.innerHTML = "";

    if (!collection.movies.length) {
      heroTitle.textContent = collection.title;
      heroMeta.textContent = "Chưa có phim";
      heroImg.src = defaultPoster;
      heroImg.alt = collection.title;
      movieDesc.textContent = "Danh mục này chưa có phim. Vào admin.html để thêm phim.";
      updateWatchButton("");

      posterRow.innerHTML = `
        <div style="color: rgba(255,255,255,0.55); padding: 20px 0;">
          Chưa có phim trong danh mục này.
        </div>
      `;

      return;
    }

    collection.movies.forEach((movie, index) => {
      const card = document.createElement("button");

      card.type = "button";
      card.className = "movie-poster-card";

      const imageWrap = document.createElement("div");
      imageWrap.className = "movie-poster-img-wrap";

      const image = document.createElement("img");
      image.src = getSafePosterUrl(movie.poster);
      image.alt = movie.title || "Movie poster";
      image.loading = "lazy";
      image.addEventListener("error", () => {
        image.src = defaultPoster;
      }, { once: true });

      const overlay = document.createElement("div");
      overlay.className = "movie-poster-overlay";

      const playIcon = document.createElement("i");
      playIcon.className = "fa-solid fa-play";
      overlay.appendChild(playIcon);

      imageWrap.append(image, overlay);

      const info = document.createElement("div");
      info.className = "movie-poster-info";

      const title = document.createElement("strong");
      title.textContent = movie.title || "Untitled";

      const year = document.createElement("span");
      year.textContent = movie.year || "";

      info.append(title, year);
      card.append(imageWrap, info);

      card.addEventListener("click", () => {
        selectMovie(movie, card);
      });

      posterRow.appendChild(card);

      if (index === 0) {
        selectMovie(movie, card);
      }
    });
  }

  function selectMovie(movie, card) {
    document.querySelectorAll(".movie-poster-card").forEach(item => {
      item.classList.remove("active");
    });

    if (card) card.classList.add("active");

    heroTitle.textContent = movie.title || "Untitled";
    heroMeta.textContent = [movie.year, movie.genre].filter(Boolean).join(" • ");
    heroImg.src = getSafePosterUrl(movie.poster);
    heroImg.alt = movie.title || "Movie poster";
    movieDesc.textContent = movie.desc || "Chưa có mô tả cho phim này.";

    updateWatchButton(movie.link);
  }

  function getSafePosterUrl(value) {
    if (!value) return defaultPoster;

    try {
      const url = new URL(value, window.location.href);

      if (!["http:", "https:"].includes(url.protocol)) {
        return defaultPoster;
      }

      return url.href;
    } catch {
      return defaultPoster;
    }
  }

  function getSafeMovieUrl(value) {
    if (!value) return "";

    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function updateWatchButton(link) {
    const label = movieWatchBtn.querySelector("span");
    const safeLink = getSafeMovieUrl(link);

    if (safeLink) {
      movieWatchBtn.href = safeLink;
      movieWatchBtn.classList.remove("disabled");
      movieWatchBtn.setAttribute("aria-disabled", "false");
      label.textContent = "Open movie";
    } else {
      movieWatchBtn.href = "#";
      movieWatchBtn.classList.add("disabled");
      movieWatchBtn.setAttribute("aria-disabled", "true");
      label.textContent = "Add movie link";
    }
  }

  async function listenMoviesFromFirestore() {
    if (movieDataStarted) return;

    movieDataStarted = true;

    try {
      const [{ db }, firestore] = await Promise.all([
        import("../firebase-config.js"),
        import("https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js")
      ]);

      const { collection, onSnapshot, query, orderBy } = firestore;

      const moviesRef = collection(db, "movies");
      const q = query(moviesRef, orderBy("createdAt", "desc"));

      onSnapshot(q, (snapshot) => {
        movieCollections = {
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
        };

        snapshot.docs.forEach(item => {
          const movie = item.data();
          const category = movie.category || "stephen-chow";

          if (!movieCollections[category]) return;

          movieCollections[category].movies.push({
            title: movie.title || "Untitled",
            year: movie.year || "",
            genre: movie.genre || "",
            desc: movie.desc || "",
            poster: movie.poster || defaultPoster,
            link: movie.link || ""
          });
        });

        const activeTab = document.querySelector(".movie-tab.active");
        const activeCategory = activeTab?.dataset.category || "stephen-chow";

        renderCollection(activeCategory);
      }, (err) => {
        movieDataStarted = false;
        console.error("Không đọc được movies từ Firestore:", err);
      });
    } catch (err) {
      movieDataStarted = false;
      console.warn("⚠️ Không load được Firestore cho Movie:", err);
    }
  }
  
  renderCollection("stephen-chow");
}