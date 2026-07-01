export function initMoviePage() {
  const openMovieBtn = document.getElementById("open-movie");
  const moviePage = document.getElementById("movie-page");
  const musicPage = document.getElementById("music-page");
  const backBtn = document.getElementById("music-back-global");

  const movieCards = document.querySelectorAll(".movie-card");
  const movieDesc = document.getElementById("movie-desc");
  const movieWatchBtn = document.getElementById("movie-watch-btn");

  openMovieBtn.addEventListener("click", () => {
    document.getElementById("curtain-menu").classList.remove("open");

    musicPage.classList.remove("active");
    moviePage.classList.add("active");
    backBtn.classList.add("active");

    document.body.classList.add("sub-page-open", "movie-open");
    document.body.classList.remove("music-open");
  });

  function selectMovie(card) {
    movieCards.forEach(item => item.classList.remove("active"));
    card.classList.add("active");

    const title = card.dataset.title || "Movie";
    const desc = card.dataset.desc || "";
    const link = card.dataset.link || "";

    movieDesc.textContent = `${title} — ${desc}`;

    if (link) {
      movieWatchBtn.href = link;
      movieWatchBtn.classList.remove("disabled");
      movieWatchBtn.querySelector("span").textContent = "Open movie";
    } else {
      movieWatchBtn.href = "#";
      movieWatchBtn.classList.add("disabled");
      movieWatchBtn.querySelector("span").textContent = "Add movie link";
    }
  }

  movieCards.forEach(card => {
    card.addEventListener("click", () => selectMovie(card));
  });

  if (movieCards.length > 0) {
    selectMovie(document.querySelector(".movie-card.active") || movieCards[0]);
  }
}