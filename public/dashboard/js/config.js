// Dashboard Configuration
export const API_CONFIG = {
  BASE_URL: "https://techyjaunt-auth-go43.onrender.com",
  ENDPOINTS: {
    authMe: "/api/auth/me",
    userStats: "/api/users/stats",
    rentalHistory: "/api/rentals/history",
    adminAnalytics: "/api/admin/analytics"
  }
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  WISHLIST: 'wishlist',
  SAVED_CARS: 'savedCars',
  CART: 'cart'
};

// Toast Configuration
export const TOAST_CONFIG = {
  SUCCESS: '#03dac5',
  ERROR: '#f44336',
  WARNING: '#ff9800',
  DURATION: 3000
};
