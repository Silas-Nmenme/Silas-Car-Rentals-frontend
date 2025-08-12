// app.js
const API_BASE = "https://techyjaunt-auth-go43.onrender.com";

// Shortcuts
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

// --- TOAST FUNCTION (GLOBAL) ---
function showToast(message, duration = 3000, bgColor = "#03dac5") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "1.5rem",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "0.7rem 1.2rem",
      borderRadius: "4px",
      fontWeight: "600",
      opacity: "0",
      pointerEvents: "none",
      transition: "opacity 0.3s ease",
      zIndex: "9999",
      color: "#121212",
    });
  }
  toast.textContent = message;
  toast.style.background = bgColor;
  toast.style.opacity = "1";
  setTimeout(() => (toast.style.opacity = "0"), duration);
}

// --- STORAGE HELPERS ---
function getStorage(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function updateGlobalCounts() {
  const cartCount = qs("#cart-count");
  if (cartCount) cartCount.textContent = getStorage("cart").length;
  const wishCount = qs("#wishlist-count");
  if (wishCount) wishCount.textContent = getStorage("wishlist").length;
  const savedCount = qs("#saved-count");
  if (savedCount) savedCount.textContent = getStorage("savedCars").length;
}
updateGlobalCounts();

// --- CART / WISHLIST / SAVED ADD FUNCTIONS ---
function addToCart(car) {
  const cart = getStorage("cart");
  if (cart.find((c) => c._id === car._id)) return showToast("Car already in cart", 3000, "#ff9800");
  cart.push(car);
  setStorage("cart", cart);
  updateGlobalCounts();
  showToast("Added to cart");
}
function addToWishlist(car) {
  const wishlist = getStorage("wishlist");
  if (wishlist.find(c => c._id === car._id)) return showToast("Car already in wishlist", 3000, "#ff9800");
  wishlist.push(car);
  setStorage("wishlist", wishlist);
  updateGlobalCounts();
  showToast("Added to wishlist");
}
function addToSaved(car) {
  const saved = getStorage("savedCars");
  if (saved.find(c => c._id === car._id)) return showToast("Car already saved", 3000, "#ff9800");
  saved.push(car);
  setStorage("savedCars", saved);
  updateGlobalCounts();
  showToast("Car saved");
}

// --- BUTTON HANDLER ---
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  try {
    const res = await fetch(`${API_BASE}/api/cars/${id}`);
    const car = await res.json();
    if (!res.ok) return showToast(car.message || "Error fetching car", 3000, "#f44336");

    if (action === "rent-now") { addToCart(car); window.location.href = "cart.html"; }
    if (action === "add-cart") addToCart(car);
    if (action === "add-wishlist") addToWishlist(car);
    if (action === "add-saved") addToSaved(car);
  } catch (err) {
    console.error(err);
    showToast("Network error", 3000, "#f44336");
  }
});

// --- FETCH & RENDER CARS ---
async function fetchCars() {
  const skeletonGrid = qs("#skeleton-grid");
  const carCountEl = qs("#car-count");
  if (skeletonGrid) skeletonGrid.style.display = "grid";
  try {
    const res = await fetch(`${API_BASE}/api/cars/get-cars`);
    const cars = await res.json();
    if (!res.ok || !Array.isArray(cars)) {
      if (carCountEl) carCountEl.textContent = "Error loading cars";
      return;
    }
    renderCars(cars);
  } catch (err) {
    console.error(err);
    if (carCountEl) carCountEl.textContent = "Failed to load cars";
  } finally {
    if (skeletonGrid) skeletonGrid.style.display = "none";
  }
}

function renderCars(cars) {
  const carsGrid = qs("#cars-grid");
  const carCountEl = qs("#car-count");
  if (!carsGrid) return;
  carsGrid.innerHTML = "";
  if (carCountEl) carCountEl.textContent = `${cars.length} car(s) available`;

  cars.forEach((car) => {
    const card = document.createElement("div");
    card.className = "card card-content";
    card.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="width:100%; height:180px; overflow:hidden; border-radius:8px;">
          <img src="${car.image || "https://via.placeholder.com/180x120"}" 
               style="width:100%; height:100%; object-fit:cover;" />
        </div>
        <strong>${car.make} ${car.model}</strong>
        <div class="meta">₦${car.price} / day</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <button class="btn btn-sm" data-action="rent-now" data-id="${car._id}">Rent Now</button>
          <button class="btn btn-sm btn-outline" data-action="add-cart" data-id="${car._id}">Add to Cart</button>
          <button class="btn btn-sm btn-outline" data-action="add-wishlist" data-id="${car._id}">Wishlist</button>
          <button class="btn btn-sm btn-outline" data-action="add-saved" data-id="${car._id}">Save</button>
        </div>
      </div>
    `;
    carsGrid.appendChild(card);
  });
}

// INIT
fetchCars();
