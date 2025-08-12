const API_BASE = "https://techyjaunt-auth-go43.onrender.com";

// ===== Helpers =====
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

function showToast(msg, ms = 3000, bg = "#03dac5") {
  const toast = qs("#toast");
  toast.textContent = msg;
  toast.style.background = bg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), ms);
}

function getStorage(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}
function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function updateCounts() {
  if (qs("#cart-count")) qs("#cart-count").textContent = getStorage("cart").length;
  if (qs("#wishlist-count")) qs("#wishlist-count").textContent = getStorage("wishlist").length;
  if (qs("#saved-count")) qs("#saved-count").textContent = getStorage("savedCars").length;
}
updateCounts();

// ===== Storage Actions =====
function addItem(key, car) {
  const arr = getStorage(key);
  if (arr.find(c => c._id === car._id)) {
    showToast(`Already in ${key}`, 3000, "#ff9800");
    return;
  }
  arr.push(car);
  setStorage(key, arr);
  updateCounts();
  showToast(`Added to ${key}`);
}

// ===== Rent Now =====
function rentNow(id) {
  fetch(`${API_BASE}/api/cars/${id}`)
    .then(res => res.json())
    .then(car => {
      addItem("cart", car);
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Please login to checkout", 3000, "#f44336");
        setTimeout(() => location.href = "login.html", 1200);
      } else {
        location.href = "book.html";
      }
    })
    .catch(() => showToast("Error fetching car", 3000, "#f44336"));
}

// ===== Fetch & Render Cars =====
function renderCars(cars) {
  const grid = qs("#cars-grid");
  const count = qs("#car-count");
  if (!grid) return;
  grid.innerHTML = "";
  if (count) count.textContent = `${cars.length} car(s) available`;

  cars.forEach(car => {
    const card = document.createElement("div");
    card.className = "car-card";
    card.innerHTML = `
      <img src="${car.image || "https://via.placeholder.com/200"}" alt="${car.make}">
      <h3>${car.make} ${car.model}</h3>
      <p>₦${car.price.toLocaleString()}</p>
      <div class="btn-group">
        <button data-action="rent" data-id="${car._id}">Rent Now</button>
        <button data-action="cart" data-id="${car._id}">Add to Cart</button>
        <button data-action="wishlist" data-id="${car._id}">Wishlist</button>
        <button data-action="save" data-id="${car._id}">Save</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function fetchCars() {
  try {
    const res = await fetch(`${API_BASE}/api/cars/get-cars`);
    const cars = await res.json();
    renderCars(cars);
  } catch {
    showToast("Failed to load cars", 3000, "#f44336");
  }
}
fetchCars();

// ===== Global Button Handler =====
document.addEventListener("click", e => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  fetch(`${API_BASE}/api/cars/${id}`)
    .then(res => res.json())
    .then(car => {
      if (action === "rent") rentNow(id);
      if (action === "cart") addItem("cart", car);
      if (action === "wishlist") addItem("wishlist", car);
      if (action === "save") addItem("savedCars", car);
    })
    .catch(() => showToast("Error fetching car", 3000, "#f44336"));
});
