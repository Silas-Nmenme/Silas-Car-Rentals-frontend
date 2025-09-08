// public/dashboard.js

// Inlined config
const BASE_URL = "https://techyjaunt-auth-go43.onrender.com";
const ENDPOINTS = {
  authMe: "/api/auth/me",
  userStats: "/api/users/stats",
  rentalHistory: "/api/rentals/history",
  adminAnalytics: "/api/admin/analytics",
  users: "/api/users",
  makeAdmin: "/api/users/make-admin",
  cars: "/api/cars",
  addCar: "/api/cars/add-car",
  editCar: "/api/cars/edit-car",
  deleteCar: "/api/cars/delete-car",
  getCars: "/api/cars/get-cars",
  searchCars: "/api/cars/search-cars"
};

// Inlined utils functions
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show`;
  toast.style.background = type === 'error' ? '#f44336' : type === 'success' ? '#28a745' : '#007bff';

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const token = localStorage.getItem('token');
console.log('Token:', token); // Debug log
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
const adminCarManagementSection = document.getElementById('admin-car-management');
const userSelect = document.getElementById('user-select');
const userDetails = document.getElementById('user-details');
const addCarForm = document.getElementById('add-car-form');
const carSearchInput = document.getElementById('car-search');
const carsTableBody = document.getElementById('cars-table-body');

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
  // First, try to get user from localStorage
  const storedUser = JSON.parse(localStorage.getItem('user'));
  if (storedUser && storedUser.name) {
    let fullName = storedUser.name;
    let firstName = fullName.split(" ")[0];
    userNameEl.textContent = firstName;
    if (storedUser.role === 'admin') {
      adminAnalyticsSection.classList.remove('hidden');
      adminBookingsSection.classList.remove('hidden');
      adminUsersSection.classList.remove('hidden');
      adminAddCarSection.classList.remove('hidden');
      adminCarManagementSection.classList.remove('hidden');
      loadAdminData();
      loadUsers();
      loadCars();
    }
    return;
  }

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
      adminCarManagementSection.classList.remove('hidden');
      loadAdminData();
      loadUsers();
      loadCars();
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
      adminCarManagementSection.classList.remove('hidden');
      loadAdminData();
      loadUsers();
      loadCars();
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

// Admin Data
async function loadAdminData() {
  try {
    // Fetch users for total count
    const usersRes = await fetch(BASE_URL + ENDPOINTS.users, { headers: { Authorization: 'Bearer ' + token } });
    const users = await usersRes.json();
    console.log('Users data:', users);
    document.getElementById('admin-total-users').textContent = users.length || 0;

    // Fetch cars for total count
    const carsRes = await fetch(BASE_URL + ENDPOINTS.getCars, { headers: { Authorization: 'Bearer ' + token } });
    const carsData = await carsRes.json();
    const cars = carsData.cars || [];
    console.log('Cars data:', cars);
    document.getElementById('admin-total-cars').textContent = cars.length || 0;

    // Try to fetch analytics for revenue
    try {
      const analyticsRes = await fetch(BASE_URL + ENDPOINTS.adminAnalytics, { headers: { Authorization: 'Bearer ' + token } });
      const analytics = await analyticsRes.json();
      console.log('Admin analytics data:', analytics);
      document.getElementById('admin-total-revenue').textContent = `₦${(analytics.totalRevenue || 0).toLocaleString()}`;
    } catch (analyticsError) {
      console.error('Error loading analytics:', analyticsError);
      document.getElementById('admin-total-revenue').textContent = '₦0';
    }

    // Bookings
    const bookingsRes = await fetch(BASE_URL + '/api/bookings', { headers: { Authorization: 'Bearer ' + token } });
    const bookings = await bookingsRes.json();
    console.log('Bookings data:', bookings);
    bookingsTableBody.innerHTML = bookings.length
      ? bookings.map(b => `<tr><td>${b.email}</td><td>${b.car?.make || ''} ${b.car?.model || ''}</td><td>${new Date(b.startDate).toLocaleDateString()}</td><td>${new Date(b.endDate).toLocaleDateString()}</td><td>${b.status || 'Pending'}</td><td><button onclick="updateBookingStatus('${b._id}','approved')" class="btn btn-sm btn-success">Approve</button><button onclick="updateBookingStatus('${b._id}','rejected')" class="btn btn-sm btn-danger">Reject</button></td></tr>`).join('')
      : `<tr><td colspan="6" class="meta">No bookings found</td></tr>`;
  } catch (error) {
    console.error('Error loading admin data:', error);
    document.getElementById('admin-total-users').textContent = '0';
    document.getElementById('admin-total-cars').textContent = '0';
    document.getElementById('admin-total-revenue').textContent = '₦0';
    bookingsTableBody.innerHTML = `<tr><td colspan="6" class="meta">Error loading bookings</td></tr>`;
  }
}

window.updateBookingStatus = async function(id, status) {
  if (!confirm(`Mark booking as ${status}?`)) return;
  try {
    const res = await fetch(BASE_URL + `/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const errorMsg = await res.text();
      showToast(errorMsg || 'Failed to update booking', 'error');
      return;
    }
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

// Load Cars for Admin
async function loadCars() {
  carsTableBody.innerHTML = `<tr><td colspan="7" class="text-center">Loading...</td></tr>`;
  try {
    const res = await fetch(BASE_URL + ENDPOINTS.getCars, { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('Failed to fetch cars');
    const data = await res.json();
    const cars = data.cars || [];
    carsTableBody.innerHTML = cars.length
      ? cars.map(car => `
        <tr>
          <td>${car.make}</td>
          <td>${car.model}</td>
          <td>${car.year}</td>
          <td>₦${car.price.toLocaleString()}</td>
          <td>${car.brand}</td>
          <td>${car.color}</td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="editCar('${car._id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCar('${car._id}')">Delete</button>
          </td>
        </tr>
      `).join('')
      : `<tr><td colspan="7" class="meta">No cars found</td></tr>`;
  } catch (error) {
    console.error('Error loading cars:', error);
    carsTableBody.innerHTML = `<tr><td colspan="7" class="text-center">Error loading cars</td></tr>`;
    showToast('Failed to load cars', 'error');
  }
}

// User Select Change
userSelect.addEventListener('change', async () => {
  const userId = userSelect.value;
  if (!userId) {
    document.getElementById('make-admin-btn').classList.add('d-none');
    return;
  }
  try {
    const res = await fetch(BASE_URL + `/api/users/${userId}`, { headers: { Authorization: 'Bearer ' + token } });
    const user = await res.json();
    document.getElementById('user-name').textContent = user.name || user.email;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-role').textContent = user.role;
    document.getElementById('user-registered').textContent = new Date(user.createdAt).toLocaleDateString();
    userDetails.classList.remove('d-none');
    document.getElementById('make-admin-btn').classList.remove('d-none');
  } catch { showToast('Failed to load user details'); }
});



// Edit Car
window.editCar = async function(carId) {
  try {
    const res = await fetch(BASE_URL + `/api/cars/${carId}`, { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('Failed to fetch car details');
    const car = await res.json();

    // Populate form with car data
    document.getElementById('car-make').value = car.make;
    document.getElementById('car-model').value = car.model;
    document.getElementById('car-year').value = car.year;
    document.getElementById('car-price').value = car.price;
    document.getElementById('car-brand').value = car.brand;
    document.getElementById('car-color').value = car.color;
    document.getElementById('car-description').value = car.description;

    // Change form submit to update
    addCarForm.dataset.editId = carId;
    document.querySelector('#add-car-form button[type="submit"]').textContent = 'Update Car';

    // Scroll to form
    document.getElementById('admin-add-car').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error fetching car:', error);
    showToast('Failed to load car details', 'error');
  }
};

// Delete Car
window.deleteCar = async function(carId) {
  if (!confirm('Are you sure you want to delete this car?')) return;

  try {
    const res = await fetch(BASE_URL + ENDPOINTS.deleteCar + `/${carId}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Failed to delete car');
    showToast('Car deleted successfully', 'success');
    loadCars(); // Refresh the car list
  } catch (error) {
    console.error('Error deleting car:', error);
    showToast('Failed to delete car', 'error');
  }
};

// Search Cars
carSearchInput.addEventListener('input', debounce(async (e) => {
  const query = e.target.value.trim();
  if (!query) {
    loadCars(); // Load all cars if search is empty
    return;
  }

  carsTableBody.innerHTML = `<tr><td colspan="7" class="text-center">Searching...</td></tr>`;
  try {
    const res = await fetch(BASE_URL + ENDPOINTS.searchCars + `?make=${encodeURIComponent(query)}`, { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('Failed to search cars');
    const data = await res.json();
    const cars = data.car || [];
    carsTableBody.innerHTML = cars.length
      ? cars.map(car => `
        <tr>
          <td>${car.make}</td>
          <td>${car.model}</td>
          <td>${car.year}</td>
          <td>₦${car.price.toLocaleString()}</td>
          <td>${car.brand}</td>
          <td>${car.color}</td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="editCar('${car._id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCar('${car._id}')">Delete</button>
          </td>
        </tr>
      `).join('')
      : `<tr><td colspan="7" class="meta">No cars found for "${query}"</td></tr>`;
  } catch (error) {
    console.error('Error searching cars:', error);
    carsTableBody.innerHTML = `<tr><td colspan="7" class="text-center">Error searching cars</td></tr>`;
    showToast('Failed to search cars', 'error');
  }
}, 300));

// Handle form for both add and edit
addCarForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('Form submitted'); // Debug log
  const editId = addCarForm.dataset.editId;
  const carData = {
    make: document.getElementById('car-make').value.trim(),
    model: document.getElementById('car-model').value.trim(),
    year: parseInt(document.getElementById('car-year').value),
    price: parseFloat(document.getElementById('car-price').value),
    brand: document.getElementById('car-brand').value.trim(),
    color: document.getElementById('car-color').value.trim(),
    description: document.getElementById('car-description').value.trim()
  };

  console.log('Car data:', carData); // Debug log

  // Basic validation
  if (!carData.make || !carData.model || !carData.year || !carData.price || !carData.brand || !carData.color || !carData.description) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    if (editId) {
      // Update car
      const res = await fetch(BASE_URL + ENDPOINTS.editCar + `/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(carData)
      });
      if (!res.ok) throw new Error('Failed to update car');
      showToast('Car updated successfully', 'success');
    } else {
      // Add car
      const res = await fetch(BASE_URL + ENDPOINTS.addCar, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(carData)
      });
      if (!res.ok) throw new Error('Failed to add car');
      showToast('Car added successfully', 'success');
    }

    addCarForm.reset();
    delete addCarForm.dataset.editId;
    document.querySelector('#add-car-form button[type="submit"]').textContent = 'Add Car';
    loadCars(); // Refresh the car list
  } catch (error) {
    console.error('Error saving car:', error);
    showToast('Failed to save car', 'error');
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

async function makeUserAdmin() {
  const userId = userSelect.value;
  if (!userId) {
    showToast('Please select a user first', 'error');
    return;
  }
  try {
    const res = await fetch(BASE_URL + ENDPOINTS.makeAdmin + `/${userId}`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) {
      const errorMsg = await res.text();
      showToast(errorMsg || 'Failed to make user admin', 'error');
      return;
    }
    showToast('User promoted to admin successfully', 'success');
    loadUsers();
  } catch (error) {
    showToast('Failed to make user admin', 'error');
  }
}

window.makeUserAdmin = makeUserAdmin;

// Init
(async function init() {
  await fetchUserProfile();
  await fetchUserStats();
  await fetchRentalHistory();
  renderAllPreviews();
  loadUsers();
})();
