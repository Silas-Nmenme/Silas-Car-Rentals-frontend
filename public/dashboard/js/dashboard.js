// public/dashboard.js

import { BASE_URL, ENDPOINTS } from './config.js';
import { showToast } from './utils.js';

const token = localStorage.getItem('token');
if (!token) {
  showToast('Please login first');
  setTimeout(() => window.location.href = 'login.html', 1500);
}

// Elements
const userNameEl = document.getElementById('dash-username');
const logoutBtn = document.getElementById('logout-btn');
const totalRentalsEl = document.getElementById('total-rentals');
const wishlistCountEl = document.getElementById('wishlist-count-stat');
const savedCountEl = document.getElementById('saved-count-stat');
const cartCountEl = document.getElementById('cart-count');
const cartCountStatEl = document.getElementById('cart-count-stat');
const rentalsTableBody = document.getElementById('rentals-table-body');
const wishlistGrid = document.getElementById('wishlist-grid');
const savedCarsGrid = document.getElementById('saved-cars-grid');
const adminAnalyticsSection = document.getElementById('admin-analytics');
const adminBookingsSection = document.getElementById('admin-bookings');
const bookingsTableBody = document.getElementById('bookings-table-body');
const adminUsersSection = document.getElementById('admin-users');
const adminAddCarSection = document.getElementById('admin-add-car');
const userSelect = document.getElementById('user-select');
const userDetails = document.getElementById('user-details');
const addCarForm = document.getElementById('add-car-form');

// Modal
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalItems = document.getElementById('modal-items');

function openModal(title, items, type) {
  modalTitle.textContent = title;
  modalItems.innerHTML = items.length
    ? items.map(car => `
      <div class="card">
        <h3>${car.name}</h3>
        <p>₦${car.price.toLocaleString()}</p>
        ${type === 'cart'
          ? `<button class="btn btn-primary btn-sm" onclick="rentNow(${JSON.stringify(car).replace(/"/g, '\\"')})">Rent Now</button>` : ''}
        <button class="btn btn-outline btn-sm" onclick="removeFrom('${type}', ${car.id})">Remove</button>
      </div>`).join('')
    : `<p class="meta">No items in ${title.toLowerCase()}.</p>`;
  modalOverlay.style.display = 'flex';
}
function closeModal() { modalOverlay.style.display = 'none'; }
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Wishlist/Saved/Carts click
document.getElementById('wishlist-stat').addEventListener('click', () => openModal('Wishlist', JSON.parse(localStorage.getItem('wishlist')) || [], 'wishlist'));
document.getElementById('saved-cars-stat').addEventListener('click', () => openModal('Saved Cars', JSON.parse(localStorage.getItem('savedCars')) || [], 'savedCars'));
document.getElementById('cart-stat').addEventListener('click', () => openModal('Cart', JSON.parse(localStorage.getItem('cart')) || [], 'cart'));
document.getElementById('cart-btn').addEventListener('click', () => openModal('Cart', JSON.parse(localStorage.getItem('cart')) || [], 'cart'));

// Render Previews
function renderPreview(id, storageKey) {
  const data = JSON.parse(localStorage.getItem(storageKey)) || [];
  document.getElementById(id).innerHTML = data.length
    ? data.slice(0, 3).map(car => `<div class="card"><h3>${car.name}</h3><p>₦${car.price.toLocaleString()}</p></div>`).join('')
    : `<p class="meta">No ${storageKey} yet.</p>`;
}
function renderCounts() {
  wishlistCountEl.textContent = (JSON.parse(localStorage.getItem('wishlist')) || []).length;
  savedCountEl.textContent = (JSON.parse(localStorage.getItem('savedCars')) || []).length;
  const cartLen = (JSON.parse(localStorage.getItem('cart')) || []).length;
  cartCountEl.textContent = cartLen;
  cartCountStatEl.textContent = cartLen;
}
function renderAllPreviews() { renderCounts(); renderPreview('wishlist-grid', 'wishlist'); renderPreview('saved-cars-grid', 'savedCars'); }

// Fetch Profile
async function fetchUserProfile() {
  try {
    const res = await fetch(BASE_URL + ENDPOINTS.authMe, { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const user = data.user || data;
    // Set first name only for welcome message
    let fullName = user.name || user.email;
    let firstName = fullName.split(" ")[0];
    userNameEl.textContent = firstName;
    if (user.role === 'admin' || user.isAdmin) {
      adminAnalyticsSection.classList.remove('hidden');
      adminBookingsSection.classList.remove('hidden');
      adminUsersSection.classList.remove('hidden');
      adminAddCarSection.classList.remove('hidden');
      loadAdminData();
      loadUsers();
    }
  } catch {
    // Fallback for demo
    const mockUser = { name: 'Admin User', email: 'admin@example.com', role: 'admin' };
    let firstName = mockUser.name.split(" ")[0];
    userNameEl.textContent = firstName;
    if (mockUser.role === 'admin') {
      adminAnalyticsSection.classList.remove('hidden');
      adminBookingsSection.classList.remove('hidden');
      adminUsersSection.classList.remove('hidden');
      adminAddCarSection.classList.remove('hidden');
      loadAdminData();
      loadUsers();
    }
    showToast('Using demo mode', 'info');
  }
}

// Fetch Stats
async function fetchUserStats() {
  try {
    const res = await fetch(BASE_URL + ENDPOINTS.userStats, { headers: { Authorization: 'Bearer ' + token } });
    const stats = await res.json();
    totalRentalsEl.textContent = stats.totalRentals ?? 0;
  } catch { showToast('Failed to load stats'); }
}

// Rental History
async function fetchRentalHistory() {
  try {
    const res = await fetch(BASE_URL + ENDPOINTS.rentalHistory, { headers: { Authorization: 'Bearer ' + token } });
    const rentals = await res.json();
    rentalsTableBody.innerHTML = rentals.length
      ? rentals.map(r => `<tr><td>${r.carName}</td><td>${new Date(r.startDate).toLocaleDateString()}</td><td>${new Date(r.endDate).toLocaleDateString()}</td><td>₦${r.price.toLocaleString()}</td><td>${r.status}</td></tr>`).join('')
      : `<tr><td colspan="5" class="meta">No rentals found</td></tr>`;
  } catch { rentalsTableBody.innerHTML = `<tr><td colspan="5" class="meta">Error loading rentals</td></tr>`; }
}

// Admin Bookings
async function loadAdminData() {
  try {
    // Analytics
    const analyticsRes = await fetch(BASE_URL + ENDPOINTS.adminAnalytics, { headers: { Authorization: 'Bearer ' + token } });
    const analytics = await analyticsRes.json();
    document.getElementById('admin-total-users').textContent = analytics.totalUsers ?? 0;
    document.getElementById('admin-total-cars').textContent = analytics.totalCars ?? 0;
    document.getElementById('admin-total-revenue').textContent = `₦${(analytics.totalRevenue || 0).toLocaleString()}`;

    // Bookings
    const bookingsRes = await fetch(BASE_URL + '/api/bookings', { headers: { Authorization: 'Bearer ' + token } });
    const bookings = await bookingsRes.json();
    bookingsTableBody.innerHTML = bookings.length
      ? bookings.map(b => `<tr><td>${b.email}</td><td>${b.car?.make || ''} ${b.car?.model || ''}</td><td>${new Date(b.startDate).toLocaleDateString()}</td><td>${new Date(b.endDate).toLocaleDateString()}</td><td>${b.status || 'Pending'}</td><td><button onclick="updateBookingStatus('${b._id}','approved')" class="btn btn-sm btn-success">Approve</button><button onclick="updateBookingStatus('${b._id}','rejected')" class="btn btn-sm btn-danger">Reject</button></td></tr>`).join('')
      : `<tr><td colspan="6" class="meta">No bookings found</td></tr>`;
  } catch { bookingsTableBody.innerHTML = `<tr><td colspan="6" class="meta">Error loading bookings</td></tr>`; }
}

window.updateBookingStatus = async function(id, status) {
  if (!confirm(`Mark booking as ${status}?`)) return;
  try {
    const res = await fetch(BASE_URL + `/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error();
    showToast(`Booking ${status}`);
    loadAdminData();
  } catch { showToast('Failed to update booking'); }
}

// Load Users for Admin
async function loadUsers() {
  try {
    const res = await fetch(BASE_URL + '/api/users', { headers: { Authorization: 'Bearer ' + token } });
    const users = await res.json();
    userSelect.innerHTML = '<option selected disabled>Select a user</option>' +
      users.map(u => `<option value="${u._id}">${u.name || u.email}</option>`).join('');
  } catch { showToast('Failed to load users'); }
}

// User Select Change
userSelect.addEventListener('change', async () => {
  const userId = userSelect.value;
  if (!userId) return;
  try {
    const res = await fetch(BASE_URL + `/api/users/${userId}`, { headers: { Authorization: 'Bearer ' + token } });
    const user = await res.json();
    document.getElementById('user-name').textContent = user.name || user.email;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-role').textContent = user.role;
    document.getElementById('user-registered').textContent = new Date(user.createdAt).toLocaleDateString();
    userDetails.classList.remove('d-none');
  } catch { showToast('Failed to load user details'); }
});

// Add Car Form
addCarForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const carData = {
    make: document.getElementById('car-make').value.trim(),
    model: document.getElementById('car-model').value.trim(),
    year: parseInt(document.getElementById('car-year').value),
    price: parseFloat(document.getElementById('car-price').value),
    brand: document.getElementById('car-brand').value.trim(),
    color: document.getElementById('car-color').value.trim(),
    description: document.getElementById('car-description').value.trim(),
    image: document.getElementById('car-image').value.trim() || null
  };

  // Basic validation
  if (!carData.make || !carData.model || !carData.year || !carData.price || !carData.brand || !carData.color || !carData.description) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    const res = await fetch(BASE_URL + ENDPOINTS.cars, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(carData)
    });
    if (!res.ok) throw new Error();
    showToast('Car added successfully', 'success');
    addCarForm.reset();
  } catch {
    showToast('Failed to add car', 'error');
  }
});

// Global functions for modal buttons
window.rentNow = function(car) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (!cart.find(c => c.id === car.id)) {
    cart.push(car);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCounts();
    showToast('Car added to cart', 'success');
  } else {
    showToast('Car already in cart', 'warning');
  }
  closeModal();
};

window.removeFrom = function(type, id) {
  const data = JSON.parse(localStorage.getItem(type)) || [];
  const updated = data.filter(item => item.id !== id);
  localStorage.setItem(type, JSON.stringify(updated));
  renderAllPreviews();
  showToast(`Removed from ${type}`, 'success');
  // Refresh modal if open
  if (type === 'wishlist') openModal('Wishlist', updated, 'wishlist');
  else if (type === 'savedCars') openModal('Saved Cars', updated, 'savedCars');
  else if (type === 'cart') openModal('Cart', updated, 'cart');
};

// Logout
logoutBtn.addEventListener('click', () => { localStorage.removeItem('token'); location.href = 'login.html'; });

// Init
(async function init() {
  await fetchUserProfile();
  await fetchUserStats();
  await fetchRentalHistory();
  renderAllPreviews();
})();
