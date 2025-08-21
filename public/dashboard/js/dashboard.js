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
  bookings: '/api/bookings'
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
}

async function handleLogout() {
  try {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
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

// Export for use in other modules
export {
  dashboardState,
  loadUserData,
  loadRentalHistory,
  loadWishlist,
  loadSavedCars,
  loadAdminData
};
