/**
 * Dashboard JavaScript for Silas Car Rentals
 * Handles user dashboard functionality including:
 * - User authentication state
 * - Rental history
 - Wishlist management
 * - Saved cars
 * - Admin features
 */

import { API_CONFIG } from './config.js';
import { formatCurrency, formatDate, showToast, storage } from './utils.js';

// API endpoints
const ENDPOINTS = {
  authMe: '/api/auth/me',
  userStats: '/api/users/stats',
  rentalHistory: '/api/rentals/history',
  wishlist: '/api/wishlist',
  savedCars: '/api/saved-cars',
  adminAnalytics: '/api/admin/analytics',
  bookings: '/api/bookings',
  users: '/api/users',
  cars: '/api/cars'
};

// Dashboard state
let dashboardState = {
  user: null,
  rentals: [],
  wishlist: [],
  savedCars: [],
  adminData: null,
  isLoading: false
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  await initializeDashboard();
});

async function initializeDashboard() {
  try {
    // Check authentication
    const token = storage.get('token');
    if (!token) {
      window.location.href = '../login.html';
      return;
    }

    // Load user data
    await loadUserData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load dashboard data
    await Promise.all([
      loadUserStats(),
      loadRentalHistory(),
      loadWishlist(),
      loadSavedCars()
    ]);
    
    // Check if user is admin
    if (dashboardState.user?.role === 'admin') {
      await loadAdminData();
      await loadUsers();
      await loadCars();
    }
    
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showToast('Failed to load dashboard. Please refresh the page.');
  }
}

async function loadUserData() {
  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.authMe}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        storage.remove('token');
        window.location.href = '../login.html';
        return;
      }
      throw new Error('Failed to load user data');
    }
    
    const user = await response.json();
    dashboardState.user = user;
    
    // Update UI with user info
    document.getElementById('dash-username').textContent = user.name || 'User';
    
  } catch (error) {
    console.error('Error loading user data:', error);
    throw error;
  }
}

async function loadUserStats() {
  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.userStats}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const stats = await response.json();
      updateStatsUI(stats);
    }
  } catch (error) {
    console.error('Error loading user stats:', error);
  }
}

function updateStatsUI(stats) {
  document.getElementById('total-rentals').textContent = stats.totalRentals || 0;
  document.getElementById('wishlist-count-stat').textContent = stats.wishlistCount || 0;
  document.getElementById('saved-count-stat').textContent = stats.savedCount || 0;
  document.getElementById('cart-count-stat').textContent = stats.cartCount || 0;
}

async function loadRentalHistory() {
  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.rentalHistory}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const rentals = await response.json();
      dashboardState.rentals = rentals;
      renderRentalHistory(rentals);
    }
  } catch (error) {
    console.error('Error loading rental history:', error);
  }
}

function renderRentalHistory(rentals) {
  const tbody = document.getElementById('rentals-table-body');
  if (!tbody) return;
  
  if (rentals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="meta">No rentals found</td></tr>';
    return;
  }
  
  tbody.innerHTML = rentals.map(rental => `
    <tr>
      <td>${rental.car?.make || 'N/A'} ${rental.car?.model || 'N/A'}</td>
      <td>${formatDate(rental.startDate)}</td>
      <td>${formatDate(rental.endDate)}</td>
      <td>${formatCurrency(rental.totalPrice || 0)}</td>
      <td>
        <span class="status-badge status-${rental.status?.toLowerCase() || 'pending'}">
          ${rental.status || 'Pending'}
        </span>
      </td>
    </tr>
  `).join('');
}

async function loadWishlist() {
  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.wishlist}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const wishlist = await response.json();
      dashboardState.wishlist = wishlist;
      renderWishlist(wishlist);
    }
  } catch (error) {
    console.error('Error loading wishlist:', error);
  }
}

function renderWishlist(wishlist) {
  const grid = document.getElementById('wishlist-grid');
  if (!grid) return;
  
  if (wishlist.length === 0) {
    grid.innerHTML = '<p class="meta">Your wishlist is empty</p>';
    return;
  }
  
  grid.innerHTML = wishlist.map(item => `
    <div class="car-card">
      <img src="${item.image || '/assets/placeholder.jpg'}" alt="${item.make} ${item.model}">
      <h3>${item.make} ${item.model}</h3>
      <p>${formatCurrency(item.price || 0)}</p>
      <button class="btn btn-sm" onclick="removeFromWishlist('${item._id}')">Remove</button>
    </div>
  `).join('');
}

async function loadSavedCars() {
  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.savedCars}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const savedCars = await response.json();
      dashboardState.savedCars = savedCars;
      renderSavedCars(savedCars);
    }
  } catch (error) {
    console.error('Error loading saved cars:', error);
  }
}

function renderSavedCars(savedCars) {
  const grid = document.getElementById('saved-cars-grid');
  if (!grid) return;
  
  if (savedCars.length === 0) {
    grid.innerHTML = '<p class="meta">No saved cars found</p>';
    return;
  }
  
  grid.innerHTML = savedCars.map(car => `
    <div class="car-card">
      <img src="${car.image || '/assets/placeholder.jpg'}" alt="${car.make} ${car.model}">
      <h3>${car.make} ${car.model}</h3>
      <p>${formatCurrency(car.price || 0)}</p>
      <button class="btn btn-sm" onclick="removeFromSaved('${car._id}')">Remove</button>
    </div>
  `).join('');
}

async function loadAdminData() {
  try {
    const token = storage.get('token');
    const [analyticsRes, bookingsRes] = await Promise.all([
      fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.adminAnalytics}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.bookings}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);
    
    if (analyticsRes.ok && bookingsRes.ok) {
      const [analytics, bookings] = await Promise.all([
        analyticsRes.json(),
        bookingsRes.json()
      ]);
      
      renderAdminData(analytics, bookings);
    }
  } catch (error) {
    console.error('Error loading admin data:', error);
  }
}

function renderAdminData(analytics, bookings) {
  // Update admin analytics
  const adminSection = document.getElementById('admin-analytics');
  if (adminSection) {
    adminSection.classList.remove('hidden');
    document.getElementById('admin-total-users').textContent = analytics.totalUsers || 0;
    document.getElementById('admin-total-cars').textContent = analytics.totalCars || 0;
    document.getElementById('admin-total-revenue').textContent = formatCurrency(analytics.totalRevenue || 0);
  }
  
  // Render bookings table
  const bookingsTable = document.getElementById('bookings-table-body');
  if (bookingsTable) {
    bookingsTable.innerHTML = bookings.map(booking => `
      <tr>
        <td>${booking.user?.name || 'N/A'}</td>
        <td>${booking.car?.make || 'N/A'} ${booking.car?.model || 'N/A'}</td>
        <td>${formatDate(booking.pickupDate)}</td>
        <td>${formatDate(booking.returnDate)}</td>
        <td>
          <span class="status-badge status-${booking.status?.toLowerCase() || 'pending'}">
            ${booking.status || 'Pending'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm" onclick="updateBookingStatus('${booking._id}', 'approved')">Approve</button>
          <button class="btn btn-sm btn-danger" onclick="updateBookingStatus('${booking._id}', 'rejected')">Reject</button>
        </td>
      </tr>
    `).join('');
  }
}

// Event listeners
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Navigation links
  document.querySelectorAll('[data-action]').forEach(element => {
    element.addEventListener('click', handleAction);
  });

  // Add car form
  const addCarForm = document.getElementById('add-car-form');
  if (addCarForm) {
    addCarForm.addEventListener('submit', handleAddCar);
  }

  // Car search
  const carSearch = document.getElementById('car-search');
  if (carSearch) {
    carSearch.addEventListener('input', (e) => {
      searchCars(e.target.value);
    });
  }
}

async function handleLogout() {
  try {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

async function handleAddCar(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const carData = {
    make: formData.get('car-make'),
    model: formData.get('car-model'),
    year: parseInt(formData.get('car-year')),
    price: parseFloat(formData.get('car-price')),
    image: formData.get('car-image') || undefined
  };

  await addCar(carData);
}

function handleAction(e) {
  const action = e.target.dataset.action;
  const id = e.target.dataset.id;
  
  switch (action) {
    case 'remove-wishlist':
      removeFromWishlist(id);
      break;
    case 'remove-saved':
      removeFromSaved(id);
      break;
    case 'update-booking':
      updateBookingStatus(id, e.target.dataset.status);
      break;
  }
}

async function removeFromWishlist(carId) {
  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.wishlist}/${carId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      showToast('Removed from wishlist');
      await loadWishlist();
    }
  } catch (error) {
    console.error('Error removing from wishlist:', error);
  }
}

async function removeFromSaved(carId) {
  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.savedCars}/${carId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      showToast('Removed from saved cars');
      await loadSavedCars();
    }
  } catch (error) {
    console.error('Error removing from saved cars:', error);
  }
}

async function updateBookingStatus(bookingId, status) {
  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.bookings}/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      showToast(`Booking ${status}`);
      await loadAdminData();
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
  }
}

// Load all users for admin
async function loadUsers() {
  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.users}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const users = await response.json();
      renderUserDropdown(users);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Render user dropdown
function renderUserDropdown(users) {
  const select = document.getElementById('user-select');
  if (!select) return;

  select.innerHTML = '<option selected disabled>Select a user</option>';
  users.forEach(user => {
    const option = document.createElement('option');
    option.value = user._id;
    option.textContent = user.name;
    select.appendChild(option);
  });

  select.addEventListener('change', (e) => {
    const userId = e.target.value;
    const user = users.find(u => u._id === userId);
    if (user) {
      renderUserDetails(user);
    }
  });
}

// Render user details
function renderUserDetails(user) {
  const details = document.getElementById('user-details');
  if (!details) return;

  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-email').textContent = user.email;
  document.getElementById('user-role').textContent = user.role;
  document.getElementById('user-registered').textContent = formatDate(user.createdAt);

  details.classList.remove('d-none');
}

// Load all cars for admin
async function loadCars() {
  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.cars}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const cars = await response.json();
      renderCarsTable(cars);
    }
  } catch (error) {
    console.error('Error loading cars:', error);
  }
}

// Render cars table
function renderCarsTable(cars) {
  const tbody = document.getElementById('cars-table-body');
  if (!tbody) return;

  if (cars.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="meta">No cars found</td></tr>';
    return;
  }

  tbody.innerHTML = cars.map(car => `
    <tr>
      <td>${car.make}</td>
      <td>${car.model}</td>
      <td>${car.year}</td>
      <td>${formatCurrency(car.price || 0)}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editCar('${car._id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCar('${car._id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// Add new car
async function addCar(carData) {
  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.cars}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(carData)
    });

    if (response.ok) {
      showToast('Car added successfully');
      await loadCars();
      document.getElementById('add-car-form').reset();
    } else {
      showToast('Failed to add car', 'error');
    }
  } catch (error) {
    console.error('Error adding car:', error);
    showToast('Error adding car', 'error');
  }
}

// Edit car
async function editCar(carId) {
  // For simplicity, we'll use a prompt or modal to edit
  const newMake = prompt('Enter new make:');
  if (!newMake) return;

  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.cars}/${carId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ make: newMake })
    });

    if (response.ok) {
      showToast('Car updated successfully');
      await loadCars();
    } else {
      showToast('Failed to update car', 'error');
    }
  } catch (error) {
    console.error('Error updating car:', error);
    showToast('Error updating car', 'error');
  }
}

// Delete car
async function deleteCar(carId) {
  if (!confirm('Are you sure you want to delete this car?')) return;

  try {
    const token = storage.get('token');
    const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.cars}/${carId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      showToast('Car deleted successfully');
      await loadCars();
    } else {
      showToast('Failed to delete car', 'error');
    }
  } catch (error) {
    console.error('Error deleting car:', error);
    showToast('Error deleting car', 'error');
  }
}

// Search cars
function searchCars(query) {
  const rows = document.querySelectorAll('#cars-table-body tr');
  rows.forEach(row => {
    const make = row.cells[0].textContent.toLowerCase();
    if (make.includes(query.toLowerCase())) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Export for use in other modules
export {
  dashboardState,
  loadUserData,
  loadRentalHistory,
  loadWishlist,
  loadSavedCars,
  loadAdminData,
  loadUsers,
  loadCars,
  addCar,
  editCar,
  deleteCar,
  searchCars
};
