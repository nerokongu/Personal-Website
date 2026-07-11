import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const loginBox = document.getElementById("login-box");
const adminPanel = document.getElementById("admin-panel");

const emailInput = document.getElementById("admin-email");
const passwordInput = document.getElementById("admin-password");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const loginMessage = document.getElementById("login-message");
const formMessage = document.getElementById("form-message");

const movieForm = document.getElementById("movie-form");
const movieIdInput = document.getElementById("movie-id");
const titleInput = document.getElementById("movie-title");
const yearInput = document.getElementById("movie-year");
const genreInput = document.getElementById("movie-genre");
const categoryInput = document.getElementById("movie-category");
const descInput = document.getElementById("movie-desc");
const posterInput = document.getElementById("movie-poster");
const linkInput = document.getElementById("movie-link");

const resetFormBtn = document.getElementById("reset-form-btn");
const movieList = document.getElementById("admin-movie-list");

const moviesRef = collection(db, "movies");

let moviesCache = [];
let unsubscribeMovies = null;

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  loginMessage.textContent = "";

  if (!email || !password) {
    loginMessage.textContent = "Nhập email và mật khẩu trước.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginMessage.textContent = "Đăng nhập thành công.";
  } catch (err) {
    console.error(err);
    loginMessage.textContent = "Sai email/mật khẩu hoặc tài khoản chưa được cấp quyền.";
  }
});

logoutBtn.addEventListener("click", async () => {
  unsubscribeMovies?.();
  unsubscribeMovies = null;
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBox.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    listenMovies();
  } else {
    unsubscribeMovies?.();
    unsubscribeMovies = null;

    adminPanel.classList.add("hidden");
    loginBox.classList.remove("hidden");
  }
});

movieForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const movieData = {
    title: titleInput.value.trim(),
    year: yearInput.value.trim(),
    genre: genreInput.value.trim(),
    category: categoryInput.value,
    desc: descInput.value.trim(),
    poster: posterInput.value.trim() || "assets/images/Đỗ thánh 3.jpeg",
    link: linkInput.value.trim(),
    updatedAt: serverTimestamp()
  };

  if (!movieData.title) {
    formMessage.textContent = "Tên phim không được để trống.";
    return;
  }

  if (!isSafePosterUrl(movieData.poster)) {
    formMessage.textContent = "Link poster không hợp lệ. Chỉ dùng đường dẫn nội bộ, http hoặc https.";
    return;
  }

  if (movieData.link && !isSafeExternalUrl(movieData.link)) {
    formMessage.textContent = "Link phim không hợp lệ. Chỉ chấp nhận http hoặc https.";
    return;
  }

  try {
    const editingId = movieIdInput.value;

    if (editingId) {
      await updateDoc(doc(db, "movies", editingId), movieData);
      formMessage.textContent = "Đã cập nhật phim.";
    } else {
      await addDoc(moviesRef, {
        ...movieData,
        createdAt: serverTimestamp()
      });
      formMessage.textContent = "Đã thêm phim mới.";
    }

    resetForm();
  } catch (err) {
    console.error(err);
    formMessage.textContent = "Không lưu được. Kiểm tra Firestore Rules hoặc tài khoản admin.";
  }
});

resetFormBtn.addEventListener("click", resetForm);

function listenMovies() {
  unsubscribeMovies?.();

  const q = query(moviesRef, orderBy("createdAt", "desc"));

  unsubscribeMovies = onSnapshot(q, (snapshot) => {
    moviesCache = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    renderAdminMovies();
  }, (err) => {
    console.error(err);
    movieList.innerHTML = `
      <p>Không đọc được danh sách phim. Kiểm tra Firestore Rules.</p>
    `;
  });
}

function renderAdminMovies() {
  if (!moviesCache.length) {
    movieList.innerHTML = `
      <p>Chưa có phim nào. Thêm phim đầu tiên ở form bên trên.</p>
    `;
    return;
  }

  movieList.innerHTML = "";

  moviesCache.forEach(movie => {
    const item = document.createElement("article");
    item.className = "admin-movie-item";

    item.innerHTML = `
      <img src="${escapeHtml(movie.poster || "assets/images/Đỗ thánh 3.jpeg")}" alt="">

      <div class="admin-movie-info">
        <strong>${escapeHtml(movie.title || "Untitled")}</strong>
        <span>${escapeHtml(movie.year || "")} • ${escapeHtml(movie.genre || "")}</span>
        <span>Category: ${escapeHtml(movie.category || "")}</span>
      </div>

      <div class="admin-movie-actions">
        <button type="button" class="edit-btn">Sửa</button>
        <button type="button" class="delete-btn">Xóa</button>
      </div>
    `;

    item.querySelector(".edit-btn").addEventListener("click", () => {
      fillForm(movie);
    });

    item.querySelector(".delete-btn").addEventListener("click", async () => {
      const ok = confirm(`Xóa phim "${movie.title}"?`);

      if (!ok) return;

      try {
        await deleteDoc(doc(db, "movies", movie.id));
      } catch (err) {
        console.error(err);
        alert("Không xóa được phim.");
      }
    });

    movieList.appendChild(item);
  });
}

function fillForm(movie) {
  movieIdInput.value = movie.id;
  titleInput.value = movie.title || "";
  yearInput.value = movie.year || "";
  genreInput.value = movie.genre || "";
  categoryInput.value = movie.category || "stephen-chow";
  descInput.value = movie.desc || "";
  posterInput.value = movie.poster || "";
  linkInput.value = movie.link || "";

  formMessage.textContent = `Đang sửa: ${movie.title}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  movieIdInput.value = "";
  movieForm.reset();
  categoryInput.value = "stephen-chow";
  posterInput.value = "assets/images/Đỗ thánh 3.jpeg";
}

function isSafePosterUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isSafeExternalUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}