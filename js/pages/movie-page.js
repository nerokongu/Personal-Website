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

      card.innerHTML = `
        <div class="movie-poster-img-wrap">
          <img src="${movie.poster}" alt="${movie.title}">
          <div class="movie-poster-overlay">
            <i class="fa-solid fa-play"></i>
          </div>
        </div>

        <div class="movie-poster-info">
          <strong>${movie.title}</strong>
          <span>${movie.year}</span>
        </div>
      `;

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

    heroTitle.textContent = movie.title;
    heroMeta.textContent = `${movie.year} • ${movie.genre}`;
    heroImg.src = movie.poster;
    heroImg.alt = movie.title;
    movieDesc.textContent = movie.desc;

    updateWatchButton(movie.link);
  }

  function updateWatchButton(link) {
    const label = movieWatchBtn.querySelector("span");

    if (link) {
      movieWatchBtn.href = link;
      movieWatchBtn.classList.remove("disabled");
      label.textContent = "Open movie";
    } else {
      movieWatchBtn.href = "#";
      movieWatchBtn.classList.add("disabled");
      label.textContent = "Add movie link";
    }
  }

  function listenMoviesFromFirestore() {
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
      console.error("Không đọc được movies từ Firestore:", err);
    });
  }
  
  listenMoviesFromFirestore();
  renderCollection("stephen-chow");
}