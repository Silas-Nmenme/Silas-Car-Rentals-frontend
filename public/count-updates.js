// Unified count updates for cart, wishlist, and saved across all pages
function getStorage(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function updateCounts() {
  const cartCount = getStorage("cart").length;
  const wishlistCount = getStorage("wishlist").length;
  const savedCount = getStorage("savedCars").length;

  // Update cart count
  const cartCountEl = document.getElementById("cart-count");
  if (cartCountEl) {
    cartCountEl.textContent = cartCount;
  }

  // Update wishlist count
  const wishlistCountEl = document.getElementById("wishlist-count");
  if (wishlistCountEl) {
    wishlistCountEl.textContent = wishlistCount;
  }

  // Update saved count
  const savedCountEl = document.getElementById("saved-count");
  if (savedCountEl) {
    savedCountEl.textContent = savedCount;
  }
}

// Listen for storage changes to update counts in real-time
window.addEventListener('storage', function(e) {
  if (['cart', 'wishlist', 'savedCars'].includes(e.key)) {
    updateCounts();
  }
});

// Initialize counts on page load
document.addEventListener('DOMContentLoaded', updateCounts);
