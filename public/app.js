// app.js - Fixed version with theme toggle
const API_BASE = "https://techyjaunt-auth-go43.onrender.com";

// Shortcuts
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

// --- THEME TOGGLE FUNCTIONALITY ---
// Changed 'theme-toggle' to 'themeToggle' to match about.html button id
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set initial theme
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  } else if (!prefersDark) {
    // If system prefers light and no saved preference, set light
    document.documentElement.setAttribute('data-theme', 'light');
    updateThemeIcon('light');
  }

  // Add click listener
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Show toast notification
    showToast(`Switched to ${newTheme} mode`, 2000);
  });
}

function updateThemeIcon(theme) {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  
  themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    updateThemeIcon(newTheme);
  }
});

// --- TOAST FUNCTION (GLOBAL) ---
function showToast(message, duration = 3000, bgColor = "#03dac5") {
  let toast = document.getElementById("toast");

  // Create toast element if missing
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
  toast.style.pointerEvents = "auto";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.pointerEvents = "none";
  }, duration);
}

// LocalStorage helpers
function getStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
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

// Auth header helper
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// CART FUNCTIONS
function addToCart(car) {
  const cart = getStorage("cart");
  if (cart.find((c) => c._id === car._id)) {
    showToast("Car already in cart", 3000, "#ff9800");
    return;
  }
  cart.push(car);
  setStorage("cart", cart);
  updateGlobalCounts();
  showToast("Added to cart");
}

function renderCart() {
  const cartItemsEl = qs("#cart-items");
  const cartSummary = qs("#cart-summary");
  const cart = getStorage("cart");

  if (!cartItemsEl) return;
  cartItemsEl.innerHTML = "";

  if (!cart.length) {
    cartItemsEl.innerHTML = '<div class="meta">No items in cart</div>';
    if (cartSummary) cartSummary.textContent = "0 items";
    return;
  }
  cart.forEach((item) => {
    const d = document.createElement("div");
    d.className = "card card-content";
    d.innerHTML = `
      <div style="display:flex; gap:12px; align-items:center;">
        <div style="flex:1;">
          <strong>${item.make} ${item.model}</strong>
          <div class="meta">₦${item.price} / day</div>
        </div>
        <div>
          <button class="btn btn-sm btn-remove" data-id="${item._id}">Remove</button>
        </div>
      </div>
    `;
    cartItemsEl.appendChild(d);
  });
  if (cartSummary) cartSummary.textContent = `${cart.length} item(s)`;
}

// Remove from cart
document.addEventListener("click", (e) => {
  if (e.target.matches(".btn-remove")) {
    let cart = getStorage("cart");
    cart = cart.filter((c) => c._id !== e.target.dataset.id);
    setStorage("cart", cart);
    renderCart();
    updateGlobalCounts();
  }
});

// --- CHECKOUT ---
const proceedToCheckoutBtn = qs("#proceed-to-checkout");
if (proceedToCheckoutBtn) {
  proceedToCheckoutBtn.addEventListener("click", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please login first", 3000, "#f44336");
      setTimeout(() => (window.location.href = "login.html"), 1200);
      return;
    }
    const cart = getStorage("cart");
    if (!cart.length) {
      showToast("Your cart is empty", 3000, "#ff9800");
      return;
    }
    qs("#auth-dialog")?.showModal();
  });
}

// --- NEWSLETTER SUBSCRIPTION ---
async function subscribeNewsletter(e) {
  e.preventDefault();
  const emailInput = e.target.querySelector('input[type="email"]');
  const email = emailInput.value.trim();
  const messageDiv = document.getElementById('newsletter-message');

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    messageDiv.textContent = 'Please enter a valid email address.';
    messageDiv.style.color = '#f44336';
    return;
  }

  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Subscribing...';
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Newsletter subscription failed.');
    }

    messageDiv.textContent = data.message || 'Successfully subscribed to newsletter!';
    messageDiv.style.color = '#03dac5';
    e.target.reset();
    
    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.textContent = '';
    }, 5000);
    
  } catch (err) {
    console.error('Newsletter Error:', err);
    messageDiv.textContent = err.message || 'Failed to subscribe to newsletter.';
    messageDiv.style.color = '#f44336';
    
    // Hide error after 5 seconds
    setTimeout(() => {
      messageDiv.textContent = '';
    }, 5000);
  } finally {
    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// --- PAYMENT INTEGRATION WITH BOOKING SYSTEM ---
// This payment logic has been moved to checkout.html to use the unified BookingManager system
// The checkout.html page now handles all payment processing using booking data
// instead of cart data for consistency across the application

// Ensure booking-fix.js is loaded for payment functionality
if (typeof BookingManager === 'undefined') {
  console.warn('BookingManager not found. Make sure booking-fix.js is loaded for payment functionality.');
}

// --- FETCH & RENDER CARS ---
async function fetchCars() {
  const skeletonGrid = qs("#skeleton-grid");
  const carCountEl = qs("#car-count");

  if (skeletonGrid) skeletonGrid.style.display = "grid";
  try {
    const res = await fetch(`${API_BASE}/api/cars/get-cars`);
    const cars = await res.json();
    if (!res.ok) {
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
      <div style="display:flex; gap:12px; align-items:center;">
        <div style="width:100px; height:70px; overflow:hidden; border-radius:8px;">
          <img src="${car.image || "https://via.placeholder.com/180x120"}" 
               style="width:100%; height:100%; object-fit:cover;" />
        </div>
        <div style="flex:1;">
          <strong>${car.make} ${car.model}</strong>
          <div class="meta">₦${car.price} / day</div>
        </div>
        <div>
          <button class="btn btn-sm btn-add" data-id="${car._id}">Add to cart</button>
        </div>
      </div>
    `;
    carsGrid.appendChild(card);
  });

  qsa(".btn-add").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cars/${btn.dataset.id}`);
        const car = await res.json();
        if (res.ok) addToCart(car);
        else showToast(car.message || "Error fetching car", 3000, "#f44336");
      } catch (err) {
        console.error(err);
        showToast("Network error", 3000, "#f44336");
      }
    });
  });
}

// Single DOMContentLoaded event listener for all initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize newsletter form
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', subscribeNewsletter);
  }
  
  // Initialize theme toggle functionality
  initThemeToggle();
  
  // Fetch cars on page load
  fetchCars();
});
