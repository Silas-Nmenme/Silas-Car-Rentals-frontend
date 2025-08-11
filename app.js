// app.js (module) - Unified client logic for browse / cart / auth / booking / dashboard

const BASE_URL = (window.__BASE_URL__ || "https://techyjaunt-auth-go43.onrender.com").replace(/\/$/, "");
const ENDPOINTS = {
  cars: `${BASE_URL}/api/cars`,
  car: (id) => `${BASE_URL}/api/cars/${id}`,
  rent: (id) => `${BASE_URL}/api/rent/${id}`,
  rentals: `${BASE_URL}/api/rentals`,
  authLogin: `${BASE_URL}/api/users/login`,
  authRegister: `${BASE_URL}/api/users/signup`,
  authMe: `${BASE_URL}/api/users/me`,
  logout: `${BASE_URL}/api/users/logout`,
  stats: `${BASE_URL}/api/admin/stats`
};

// ---------- DOM helpers ----------
const qs = (sel, el = document) => el && el.querySelector(sel);
const qsa = (sel, el = document) => Array.from((el || document).querySelectorAll(sel));
const toastEl = (() => qs("#toast"))();
function showToast(msg, t = 3500) {
  if (!toastEl) return alert(msg);
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), t);
}

// ---------- AUTH state ----------
let currentUser = null;
async function refreshAuth() {
  try {
    const res = await fetch(ENDPOINTS.authMe, { credentials: "include" });
    if (res.ok) currentUser = await res.json();
    else currentUser = null;
  } catch (err) { currentUser = null; }
  updateAuthUI();
}
function updateAuthUI() {
  const guest = qs("#guest-actions");
  const userMenu = qs("#user-actions");
  if (!guest || !userMenu) return;
  if (currentUser && currentUser.email) {
    guest.classList.add("hidden");
    userMenu.classList.remove("hidden");
    const nameEl = qs("#user-name");
    if (nameEl) nameEl.textContent = currentUser.name || currentUser.email.split("@")[0];
  } else {
    guest.classList.remove("hidden");
    userMenu.classList.add("hidden");
  }
}

// ---------- Local storage keys & helpers ----------
const CART_KEY = "sj_cart_v1";
const WISH_KEY = "sj_wish_v1";
const POST_LOGIN_REDIRECT = "sj_postlogin_redirect";

function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); }
function clearCart() { localStorage.removeItem(CART_KEY); updateCartCount(); }
function addToCart(car) {
  const cart = readCart();
  // store minimal info: { _id, make, model, pricePerDay, qty:1 }
  if (!cart.find(c => c._id === car._id)) {
    cart.push({ _id: car._id, make: car.make, model: car.model, pricePerDay: car.pricePerDay || car.price || 0 });
    saveCart(cart);
    showToast("Added to booking cart");
  } else showToast("Already in cart");
}
function removeFromCart(id) {
  let cart = readCart();
  cart = cart.filter(c => c._id !== id);
  saveCart(cart);
  showToast("Removed from cart");
}
function updateCartCount() {
  const el = qs("#cart-count");
  if (el) el.textContent = (readCart().length || 0);
}

// wishlist
function readWish() { try { return JSON.parse(localStorage.getItem(WISH_KEY) || "[]"); } catch { return []; } }
function saveWish(w) { localStorage.setItem(WISH_KEY, JSON.stringify(w)); updateWishCount(); }
function toggleWish(car) {
  const w = readWish();
  const idx = w.findIndex(x => x._id === car._id);
  if (idx === -1) { w.push({ _id: car._id, make: car.make, model: car.model, pricePerDay: car.pricePerDay || car.price || 0 }); saveWish(w); showToast("Saved to wishlist"); }
  else { w.splice(idx,1); saveWish(w); showToast("Removed from wishlist"); }
}
function updateWishCount() { const el = qs("#wishlist-count"); if (el) el.textContent = readWish().length; }

// ---------- page helpers ----------
function pageName() {
  const p = location.pathname.split("/").pop();
  return p || "index.html";
}

// ---------- CAR LISTING (index) ----------
let PAGE = 1;
const PAGE_SIZE = 12;
let hasMore = true;

const carsGrid = qs("#cars-grid");
const skeletonGrid = qs("#skeleton-grid");
const carCountEl = qs("#car-count");
const loadMoreBtn = qs("#load-more");

function showSkeleton(n = 6) {
  if (!skeletonGrid) return;
  skeletonGrid.innerHTML = "";
  for (let i=0;i<n;i++){
    const s = document.createElement("div");
    s.className = "skeleton-card";
    s.innerHTML = `<div class="skeleton skeleton-media"></div><div class="skeleton" style="width:70%"></div><div class="skeleton" style="width:40%"></div>`;
    skeletonGrid.appendChild(s);
  }
  skeletonGrid.style.display = "";
  if (carsGrid) carsGrid.style.display = "none";
}
function hideSkeleton() {
  if (!skeletonGrid) return;
  skeletonGrid.style.display = "none";
  skeletonGrid.innerHTML = "";
  if (carsGrid) carsGrid.style.display = "";
}

async function fetchCars({ page = 1, limit = PAGE_SIZE, filters = {} } = {}) {
  const q = new URLSearchParams({ page, limit, ...filters });
  try {
    const res = await fetch(`${ENDPOINTS.cars}?${q.toString()}`);
    if (!res.ok) return { cars: [], count:0, meta:{} };
    const data = await res.json();
    if (Array.isArray(data)) return { cars: data, count: data.length, meta:{} };
    return { cars: data.data || data.cars || [], count: data.total ?? (data.data?.length || 0), meta: data.meta || {} };
  } catch (err) {
    return { cars: [], count: 0, meta: {} };
  }
}

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

function renderCarCard(car) {
  const id = car._id || car.id || (Math.random().toString(36).slice(2));
  const img = car.image || car.images?.[0] || "/placeholder-car.png";
  const price = Number(car.pricePerDay || car.price || 0);
  const el = document.createElement("article");
  el.className = "card";
  el.innerHTML = `
    <div class="car-media">
      <img src="${escapeHtml(img)}" alt="${escapeHtml(car.make || "")} ${escapeHtml(car.model || "")}" loading="lazy" />
      <div class="car-badges"><span class="badge ${car.isRented ? 'busy':'ok'}">${car.isRented ? 'Unavailable' : 'Available'}</span></div>
      <div class="wishlist"><button class="wish-btn" data-id="${id}" title="Wishlist">♡</button></div>
    </div>
    <div class="card-content">
      <div class="car-title">
        <div>
          <div style="font-weight:800">${escapeHtml(car.make || "")} ${escapeHtml(car.model || "")}</div>
          <div class="meta">${escapeHtml(car.year || "")} • ${escapeHtml(car.transmission || "") || "Auto"}</div>
        </div>
        <div class="price">₦${price.toLocaleString()}</div>
      </div>
      <p class="meta" style="margin-top:8px">${escapeHtml((car.description||"").slice(0,160))}</p>
    </div>
    <div class="card-footer">
      <button class="btn-sm btn-outline" data-action="details" data-id="${id}">Details</button>
      <button class="btn btn-add" data-id="${id}" ${car.isRented ? "disabled":""}>Add to Cart</button>
    </div>
  `;
  // attach events
  el.querySelector(".btn-add")?.addEventListener("click", () => addToCart(car));
  el.querySelector(".wish-btn")?.addEventListener("click", () => toggleWish(car));
  el.querySelector("[data-action='details']")?.addEventListener("click", () => openCarDetails(car));
  return el;
}

async function loadInitialCars() {
  if (carCountEl) carCountEl.textContent = "Loading cars...";
  showSkeleton(6);
  const { cars, count, meta } = await fetchCars({ page: 1 });
  hideSkeleton();
  if (!cars.length) {
    if (carCountEl) carCountEl.textContent = "No cars available right now.";
    return;
  }
  if (carsGrid) {
    carsGrid.innerHTML = "";
    cars.forEach(c => carsGrid.appendChild(renderCarCard(c)));
  }
  if (carCountEl) carCountEl.textContent = `${count} cars found`;
  hasMore = meta.hasMore || (cars.length === PAGE_SIZE);
  if (loadMoreBtn) loadMoreBtn.style.display = hasMore ? "inline-block" : "none";
  PAGE = 1;
}
if (loadMoreBtn) loadMoreBtn.addEventListener("click", async () => {
  PAGE++;
  showSkeleton(3);
  const { cars } = await fetchCars({ page: PAGE });
  hideSkeleton();
  (cars || []).forEach(c => carsGrid.appendChild(renderCarCard(c)));
});

// filters
qs("#apply-filters")?.addEventListener("click", async () => {
  const filters = {
    q: qs("#q")?.value?.trim() || "",
    type: qs("#type")?.value || "",
    minPrice: qs("#minPrice")?.value || "",
    maxPrice: qs("#maxPrice")?.value || ""
  };
  if (carCountEl) carCountEl.textContent = "Searching...";
  showSkeleton(4);
  const { cars, count } = await fetchCars({ page:1, filters });
  hideSkeleton();
  if (carsGrid) { carsGrid.innerHTML = ""; cars.forEach(c => carsGrid.appendChild(renderCarCard(c))); }
  if (carCountEl) carCountEl.textContent = `${count} result(s)`;
});
qs("#clear-filters")?.addEventListener("click", () => {
  if (qs("#q")) qs("#q").value = "";
  if (qs("#type")) qs("#type").value = "";
  if (qs("#minPrice")) qs("#minPrice").value = "";
  if (qs("#maxPrice")) qs("#maxPrice").value = "";
  loadInitialCars();
});

// ---------- CART drawer UI ----------
const cartDialog = qs("#cart-dialog");
const cartItemsEl = qs("#cart-items");
const proceedBtn = qs("#proceed-to-checkout");
const clearCartBtn = qs("#clear-cart");
const closeCartBtn = qs("#close-cart");

function renderCartDrawer() {
  const cart = readCart();
  if (!cartItemsEl) return;
  if (!cart.length) cartItemsEl.innerHTML = `<div class="meta">Your cart is empty.</div>`;
  else {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="card" data-id="${item._id}">
        <div style="display:flex;gap:12px;align-items:center">
          <div style="width:84px;height:56px;background:#0b0e11;border-radius:8px;display:grid;place-items:center;font-weight:700">${escapeHtml((item.make||"").slice(0,2).toUpperCase())}</div>
          <div style="flex:1">
            <div style="font-weight:800">${escapeHtml(item.make)} ${escapeHtml(item.model)}</div>
            <div class="meta">₦${Number(item.pricePerDay).toLocaleString()} / day</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn-sm btn-remove" data-id="${item._id}">Remove</button>
          </div>
        </div>
      </div>
    `).join("");
    // attach removes
    qsa(".btn-remove", cartItemsEl).forEach(b => b.addEventListener("click", (ev) => {
      const id = ev.currentTarget.dataset.id;
      removeFromCart(id);
      renderCartDrawer();
    }));
  }
  const summary = qs("#cart-summary");
  if (summary) summary.textContent = `${readCart().length} item(s)`;
  updateCartCount();
}

qs("#open-cart")?.addEventListener("click", () => {
  renderCartDrawer();
  if (cartDialog) cartDialog.showModal();
});
closeCartBtn?.addEventListener("click", () => cartDialog && cartDialog.close());
clearCartBtn?.addEventListener("click", () => { clearCart(); renderCartDrawer(); });

// proceed to checkout (Jumia flow)
proceedBtn?.addEventListener("click", () => {
  const cart = readCart();
  if (!cart.length) { showToast("Your cart is empty"); return; }
  if (currentUser && currentUser.email) {
    // already logged in -> go to book page
    window.location.href = "book.html";
  } else {
    // save intended redirect and show auth modal
    localStorage.setItem(POST_LOGIN_REDIRECT, "book.html");
    showAuthDialog("login");
  }
});

// ---------- AUTH modal (shared across pages) ----------
const authDialog = qs("#auth-dialog");
const authForm = qs("#auth-form");
const authTitle = qs("#auth-title");
let authMode = "login";

function showAuthDialog(mode = "login") {
  authMode = mode;
  if (!authDialog) return;
  // toggle visible groups
  authDialog.classList.add("glass-auth");
  authDialog.showModal();
  authTitle.textContent = mode === "login" ? "Login" : "Sign up";
  qs("#auth-name-group")?.classList.toggle("hidden", mode === "login");
  qs("#auth-phone-group")?.classList.toggle("hidden", mode === "login");
  qs("#auth-confirm-group")?.classList.toggle("hidden", mode === "login");
  const submit = qs("#auth-submit");
  if (submit) {
    submit.textContent = mode === "login" ? "Login" : "Sign up";
    submit.className = mode === "login" ? "btn btn-login" : "btn btn-signup";
  }
}
qs("#open-login")?.addEventListener("click", () => showAuthDialog("login"));
qs("#open-register")?.addEventListener("click", () => showAuthDialog("register"));
qs("#close-auth")?.addEventListener("click", () => authDialog && authDialog.close());
qs("#switch-auth")?.addEventListener("click", () => showAuthDialog(authMode === "login" ? "register" : "login"));

// password toggle
qsa(".toggle-pass").forEach(b => {
  b.addEventListener("click", () => {
    const t = qs(`#${b.dataset.target}`);
    if (!t) return;
    t.type = t.type === "password" ? "text" : "password";
    b.setAttribute("aria-pressed", t.type === "text");
  });
});

// auth submit (works in modal & in-page)
authForm?.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const email = qs("#auth-email")?.value?.trim();
  const password = qs("#auth-password")?.value || "";
  try {
    qs("#auth-submit").disabled = true;
    let url, payload;
    if (authMode === "register") {
      const name = qs("#auth-name")?.value?.trim() || "";
      const phone = qs("#auth-phone")?.value?.trim() || "";
      const confirm = qs("#auth-confirm")?.value || "";
      if (!name || !phone || !email || !password) { showToast("Please complete all fields"); qs("#auth-submit").disabled=false; return; }
      if (password.length < 6) { showToast("Password too short"); qs("#auth-submit").disabled=false; return; }
      if (password !== confirm) { showToast("Passwords do not match"); qs("#auth-submit").disabled=false; return; }
      url = ENDPOINTS.authRegister;
      payload = { name, email, phone, password };
    } else {
      if (!email || !password) { showToast("Email + password required"); qs("#auth-submit").disabled=false; return; }
      url = ENDPOINTS.authLogin;
      payload = { email, password };
    }

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(()=>({message:"Auth failed"}));
      showToast(err.message || "Auth failed");
      qs("#auth-submit").disabled = false;
      return;
    }

    showToast(authMode === "login" ? "Logged in" : "Account created");
    authDialog.close();
    await refreshAuth();

    // redirect after login if needed
    const redirect = localStorage.getItem(POST_LOGIN_REDIRECT);
    if (redirect) {
      localStorage.removeItem(POST_LOGIN_REDIRECT);
      window.location.href = redirect;
    } else {
      // if on login.html page we might want to go to dashboard or index
      if (pageName() === "login.html" || pageName() === "signup.html") window.location.href = "index.html";
    }
  } catch (err) {
    console.error(err);
    showToast("Auth error");
  } finally { qs("#auth-submit").disabled = false; }
});

// login & signup pages standalone handlers (if separate pages exist)
async function loginHandlerPage(ev) {
  ev.preventDefault();
  const email = qs("#login-email")?.value?.trim();
  const password = qs("#login-password")?.value || "";
  if (!email || !password) return showToast("Email + password required");
  try {
    const res = await fetch(ENDPOINTS.authLogin, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password })
    });
    if (!res.ok) return showToast((await res.json()).message || "Login failed");
    showToast("Logged in");
    await refreshAuth();
    const redirect = localStorage.getItem(POST_LOGIN_REDIRECT);
    if (redirect) { localStorage.removeItem(POST_LOGIN_REDIRECT); window.location.href = redirect; return; }
    window.location.href = "index.html";
  } catch { showToast("Login error"); }
}
async function signupHandlerPage(ev) {
  ev.preventDefault();
  const name = qs("#signup-name")?.value?.trim();
  const email = qs("#signup-email")?.value?.trim();
  const phone = qs("#signup-phone")?.value?.trim();
  const password = qs("#signup-password")?.value || "";
  const confirm = qs("#signup-confirm")?.value || "";
  if (!name || !email || !phone || !password) return showToast("All fields required");
  if (password.length < 6) return showToast("Password min 6");
  if (password !== confirm) return showToast("Passwords do not match");
  try {
    const res = await fetch(ENDPOINTS.authRegister, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone, password })
    });
    if (!res.ok) return showToast((await res.json()).message || "Signup failed");
    showToast("Account created — please login");
    window.location.href = "login.html";
  } catch { showToast("Signup error"); }
}

// logout
qs("#logout-btn")?.addEventListener("click", async () => {
  try { await fetch(ENDPOINTS.logout, { method: "POST", credentials: "include" }); } catch(e){}
  currentUser = null; updateAuthUI(); showToast("Logged out");
});

// ---------- Car details modal ----------
function openCarDetails(car) {
  const d = document.createElement("div");
  d.className = "card";
  d.style.padding = "12px";
  d.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center">
      <img src="${escapeHtml(car.image || '/placeholder-car.png')}" alt="" style="width:160px;height:100px;object-fit:cover;border-radius:8px"/>
      <div>
        <div style="font-weight:800">${escapeHtml(car.make || "")} ${escapeHtml(car.model || "")}</div>
        <div class="meta">${escapeHtml(car.year || "")} • ${escapeHtml(car.transmission || "")}</div>
        <div style="margin-top:8px">${escapeHtml(car.description || "")}</div>
        <div style="margin-top:10px">
          <button class="btn" id="quick-add">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
  const dialog = document.createElement("dialog");
  dialog.className = "dialog";
  dialog.appendChild(d);
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => dialog.remove());
  d.querySelector("#quick-add")?.addEventListener("click", () => { addToCart(car); dialog.close(); });
}

// ---------- BOOKING page ----------
async function initBookingPage() {
  // book.html expects to show cart items, let user select which car to checkout (or single)
  const cart = readCart();
  const container = qs("#booking-cart-items");
  const summaryEl = qs("#booking-summary");
  const bookForm = qs("#booking-form");
  if (!container || !bookForm) return;
  if (!cart.length) {
    container.innerHTML = `<div class="meta">Your booking cart is empty. Add cars first.</div>`;
    qs("#confirm-booking")?.setAttribute("disabled", "disabled");
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="card" data-id="${item._id}">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:84px;height:56px;background:#0b0e11;border-radius:8px;display:grid;place-items:center;font-weight:700">${escapeHtml((item.make||"").slice(0,2).toUpperCase())}</div>
        <div style="flex:1">
          <div style="font-weight:800">${escapeHtml(item.make)} ${escapeHtml(item.model)}</div>
          <div class="meta">₦${Number(item.pricePerDay).toLocaleString()} / day</div>
        </div>
        <div>
          <label><input type="radio" name="selectedCar" value="${item._id}" ${cart.length===1 ? "checked" : ""}/> Select</label>
        </div>
      </div>
    </div>
  `).join("");

  // simple total calculation based on selected radio + dates
  function computeTotal() {
    const selected = bookForm.querySelector("input[name='selectedCar']:checked")?.value;
    const start = qs("#startDate")?.value;
    const end = qs("#endDate")?.value;
    if (!selected || !start || !end) { if (summaryEl) summaryEl.textContent = ""; return 0; }
    const item = cart.find(i => i._id === selected);
    if (!item) return 0;
    const s = new Date(start+"T00:00:00");
    const e = new Date(end+"T00:00:00");
    const ms = 1000*60*60*24;
    let days = Math.floor((e - s)/ms) + 1;
    if (days <= 0) { summaryEl.textContent = "Invalid dates"; return 0; }
    const total = days * Number(item.pricePerDay || 0);
    summaryEl.textContent = `Total for ${days} day(s): ₦${total.toLocaleString()}`;
    return { total, item };
  }

  bookForm.querySelectorAll("input[name='selectedCar']").forEach(r => r.addEventListener("change", computeTotal));
  qs("#startDate")?.addEventListener("change", computeTotal);
  qs("#endDate")?.addEventListener("change", computeTotal);

  bookForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!currentUser) {
      // save redirect and show login page
      localStorage.setItem(POST_LOGIN_REDIRECT, "book.html");
      showAuthDialog("login");
      return;
    }
    const selection = bookForm.querySelector("input[name='selectedCar']:checked")?.value;
    if (!selection) return showToast("Select a car to proceed");
    const start = qs("#startDate")?.value;
    const end = qs("#endDate")?.value;
    if (!start || !end) return showToast("Select rental dates");
    const chosen = cart.find(c => c._id === selection);
    if (!chosen) return showToast("Selected car not found");

    // compute total
    const ms = 1000*60*60*24;
    const days = Math.floor((new Date(end+"T00:00:00") - new Date(start+"T00:00:00")) / ms) + 1;
    if (days <= 0) return showToast("Invalid date range");
    const totalPrice = days * Number(chosen.pricePerDay || 0);

    // send booking to backend
    try {
      qs("#confirm-booking").disabled = true;
      const payload = {
        startDate: start,
        endDate: end,
        phone_number: qs("#phone")?.value || currentUser.phone || "",
        email: qs("#email")?.value || currentUser.email || "",
        totalPrice
      };
      const res = await fetch(ENDPOINTS.rent(selection), {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({message:"Booking failed"}));
        showToast(err.message || "Booking failed");
        qs("#confirm-booking").disabled = false;
        return;
      }
      const data = await res.json();
      showToast("Booking initiated");
      // optionally open payment link
      if (data.paymentUrl) window.open(data.paymentUrl, "_blank");
      // remove booked item from cart
      removeFromCart(selection);
      renderCartDrawer();
      // redirect to dashboard or confirmation
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error(err);
      showToast("Booking error");
    } finally {
      qs("#confirm-booking").disabled = false;
    }
  });
}

// ---------- DASHBOARD page ----------
async function loadDashboard() {
  const historyEl = qs("#dashboard-history");
  if (historyEl) {
    // fetch user's rentals
    try {
      const res = await fetch(ENDPOINTS.rentals, { credentials: "include" });
      if (!res.ok) { historyEl.innerHTML = "<div class='meta'>Unable to load rentals</div>"; return; }
      const json = await res.json();
      const rentals = json.data || json.rentals || json || [];
      if (!rentals.length) { historyEl.innerHTML = "<div class='meta'>No rentals yet</div>"; }
      else {
        historyEl.innerHTML = rentals.map(r => `
          <div class="card">
            <div style="display:flex;justify-content:space-between">
              <div>
                <div style="font-weight:800">${escapeHtml(r.car?.make || r.carMake || "Car")} ${escapeHtml(r.car?.model || "")}</div>
                <div class="meta">${new Date(r.startDate).toLocaleDateString()} — ${new Date(r.endDate).toLocaleDateString()}</div>
              </div>
              <div style="text-align:right">
                <div class="price">₦${Number(r.amount || r.totalPrice || 0).toLocaleString()}</div>
                <div class="meta">${escapeHtml(r.status || r.paymentStatus || "pending")}</div>
              </div>
            </div>
          </div>
        `).join("");
      }
    } catch (err) { historyEl.innerHTML = "<div class='meta'>Failed to load</div>"; }
  }
  // admin stats (if element present)
  const statUsers = qs("#stat-users");
  if (statUsers) {
    try {
      const res = await fetch(ENDPOINTS.stats, { credentials: "include" });
      if (!res.ok) { /* maybe not admin */ return; }
      const stats = await res.json();
      qs("#stat-users").textContent = stats.totalUsers || 0;
      qs("#stat-cars").textContent = stats.totalCars || 0;
      qs("#stat-rentals").textContent = stats.totalRentals || 0;
      qs("#stat-revenue").textContent = `₦${(stats.totalRevenue || 0).toLocaleString()}`;
    } catch (err) { console.warn("stats failed", err); }
  }
}

// ---------- Wishlist dialog ----------
const wishDialog = qs("#wishlist-dialog");
qs("#open-wishlist")?.addEventListener("click", () => {
  renderWishlist();
  wishDialog?.showModal();
});
qs("#close-wishlist")?.addEventListener("click", () => wishDialog?.close());

function renderWishlist() {
  const listEl = qs("#wishlist-list");
  if (!listEl) return;
  const w = readWish();
  if (!w.length) { listEl.innerHTML = "<div class='meta'>No items in wishlist.</div>"; return; }
  listEl.innerHTML = w.map(item => `
    <div class="card">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="width:84px;height:56px;background:#0b0e11;border-radius:8px;display:grid;place-items:center;font-weight:700">${escapeHtml((item.make||"").slice(0,2).toUpperCase())}</div>
        <div style="flex:1">
          <div style="font-weight:800">${escapeHtml(item.make)} ${escapeHtml(item.model)}</div>
          <div class="meta">₦${Number(item.pricePerDay).toLocaleString()} / day</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn-sm" data-add="${item._id}">Add to cart</button>
          <button class="btn-sm btn-outline" data-remove="${item._id}">Remove</button>
        </div>
      </div>
    </div>
  `).join("");
  // attach handlers
  listEl.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.add;
    // try to find details in last fetched cars or simply add minimal
    const w = readWish(); const item = w.find(x => x._id === id);
    if (item) addToCart(item);
    renderWishlist();
  }));
  listEl.querySelectorAll("[data-remove]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.remove;
    const w = readWish().filter(x => x._id !== id);
    saveWish(w);
    renderWishlist();
  }));
}

// ---------- Saved dialog ----------
const savedDialog = qs("#saved-dialog");
const savedButton = qs("button[title='Saved Cars']");
qs("#close-saved")?.addEventListener("click", () => savedDialog?.close());

savedButton?.addEventListener("click", () => {
  renderSaved();
  savedDialog?.showModal();
});

function readSaved() {
  try { return JSON.parse(localStorage.getItem("savedCars") || "[]"); } catch { return []; }
}
function saveSaved(saved) {
  localStorage.setItem("savedCars", JSON.stringify(saved));
  updateSavedCount();
}
function updateSavedCount() {
  const el = qs("#saved-count");
  if (el) el.textContent = readSaved().length;
}

function renderSaved() {
  const listEl = qs("#saved-list");
  if (!listEl) return;
  const saved = readSaved();
  if (!saved.length) {
    listEl.innerHTML = "<div class='meta'>No saved cars.</div>";
    return;
  }
  listEl.innerHTML = saved.map(item => `
    <div class="card">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="width:84px;height:56px;background:#0b0e11;border-radius:8px;display:grid;place-items:center;font-weight:700">${escapeHtml((item.make||"").slice(0,2).toUpperCase())}</div>
        <div style="flex:1">
          <div style="font-weight:800">${escapeHtml(item.make)} ${escapeHtml(item.model)}</div>
          <div class="meta">₦${Number(item.pricePerDay).toLocaleString()} / day</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn-sm" data-add="${item._id}">Add to cart</button>
          <button class="btn-sm btn-outline" data-remove="${item._id}">Remove</button>
        </div>
      </div>
    </div>
  `).join("");
  // attach handlers
  listEl.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.add;
    const saved = readSaved();
    const item = saved.find(x => x._id === id);
    if (item) addToCart(item);
    renderSaved();
  }));
  listEl.querySelectorAll("[data-remove]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.remove;
    const saved = readSaved().filter(x => x._id !== id);
    saveSaved(saved);
    renderSaved();
  }));
}

// ---------- Utility: wire up page-specific handlers ----------
document.addEventListener("DOMContentLoaded", async () => {
  // initial counts
  updateCartCount();
  updateWishCount();
  updateSavedCount();
  // refresh auth
  try { await refreshAuth(); } catch (e) {}
  // basic UI handlers
  qs("#mobile-menu-btn")?.addEventListener("click", () => qs("#mobile-menu")?.classList.toggle("hidden"));

  const page = pageName();
  if (page === "index.html" || page === "" || page === "browse" ) {
    await loadInitialCars();
    renderCartDrawer();
  }
  if (page === "login.html") {
    qs("#login-form")?.addEventListener("submit", loginHandlerPage);
    // if redirected from cart we might want to auto-fill something or redirect after login handled
  }
  if (page === "signup.html") {
    qs("#signup-form")?.addEventListener("submit", signupHandlerPage);
  }
  if (page === "book.html") {
    // ensure booking page elements exist
    initBookingPage();
  }
  if (page === "dashboard.html") {
    await loadDashboard();
  }
  // update small UI states
  renderCartDrawer();
  renderSaved();
  updateCartCount();
  updateWishCount();
  updateSavedCount();
});

// expose some helpers to global so inline onclick in some templates work (if used)
window.addToCart = (car) => { addToCart(car); renderCartDrawer(); };
window.bookCar = (car) => {
  // add car to cart then go to book page
  addToCart(car);
  if (currentUser && currentUser.email) window.location.href = "book.html";
  else {
    localStorage.setItem(POST_LOGIN_REDIRECT, "book.html");
    showAuthDialog("login");
  }
};
window.removeFromWishlist = (id) => { saveWish(readWish().filter(x=>x._id!==id)); renderWishlist(); };

// register service worker (PWA)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").catch(() => {});
}
