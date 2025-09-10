// Unified count updates for cart, wishlist, and saved across all pages with backend syncing
const API_BASE = "https://techyjaunt-auth-go43.onrender.com";

function getStorage(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCurrentUser() {
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (u && (u.token || u.id)) return u;
  } catch {}
  const legacyToken = localStorage.getItem('authToken') || localStorage.getItem('userToken') || localStorage.getItem('token');
  if (legacyToken) return { token: legacyToken };
  return null;
}

async function fetchUserCounts() {
  const user = getCurrentUser();
  if (!user || !user.token) return null;

  try {
    const response = await fetch(`${API_BASE}/api/users/counts`, {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching user counts:', error);
  }
  return null;
}

async function syncCountsToBackend(type, items) {
  const user = getCurrentUser();
  if (!user || !user.token) return;

  try {
    await fetch(`${API_BASE}/api/users/sync-${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify({ items })
    });
  } catch (error) {
    console.error(`Error syncing ${type} to backend:`, error);
  }
}

async function updateCounts() {
  const user = getCurrentUser();
  let counts = {
    cart: getStorage("cart").length,
    wishlist: getStorage("wishlist").length,
    saved: getStorage("savedCars").length
  };

  // If user is logged in, try to fetch counts from backend
  if (user && user.token) {
    const backendCounts = await fetchUserCounts();
    if (backendCounts) {
      // Merge backend counts with local counts (backend takes precedence)
      counts = {
        cart: backendCounts.cart || counts.cart,
        wishlist: backendCounts.wishlist || counts.wishlist,
        saved: backendCounts.saved || counts.saved
      };

      // Update localStorage with backend data
      if (backendCounts.cart !== undefined) setStorage("cart", backendCounts.cartItems || []);
      if (backendCounts.wishlist !== undefined) setStorage("wishlist", backendCounts.wishlistItems || []);
      if (backendCounts.saved !== undefined) setStorage("savedCars", backendCounts.savedItems || []);
    }
  }

  // Update UI elements
  const cartCountEl = document.getElementById("cart-count");
  if (cartCountEl) {
    cartCountEl.textContent = counts.cart;
  }

  const wishlistCountEl = document.getElementById("wishlist-count");
  if (wishlistCountEl) {
    wishlistCountEl.textContent = counts.wishlist;
  }

  const savedCountEl = document.getElementById("saved-count");
  if (savedCountEl) {
    savedCountEl.textContent = counts.saved;
  }
}

// Sync local changes to backend
function syncLocalChanges(type) {
  const items = getStorage(type === 'saved' ? 'savedCars' : type);
  syncCountsToBackend(type, items);
}

// Listen for storage changes to update counts in real-time and sync to backend
window.addEventListener('storage', function(e) {
  if (['cart', 'wishlist', 'savedCars'].includes(e.key)) {
    updateCounts();
    // Sync the changed type to backend
    const type = e.key === 'savedCars' ? 'saved' : e.key;
    syncLocalChanges(type);
  }
});

// Initialize counts on page load
document.addEventListener('DOMContentLoaded', updateCounts);

// Expose functions for external use
window.CountManager = {
  updateCounts,
  syncLocalChanges
};
