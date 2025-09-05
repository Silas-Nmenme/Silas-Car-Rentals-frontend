// Dashboard Configuration
export const BASE_URL = "https://techyjaunt-auth-go43.onrender.com";
export const ENDPOINTS = {
  authMe: "/api/auth/me",
  userStats: "/api/users/stats",
  rentalHistory: "/api/rentals/history",
  adminAnalytics: "/api/admin/analytics",
  users: "/api/users",
  cars: "/api/cars",
  addCar: "/api/cars/add-car",
  editCar: "/api/cars/edit-car",
  deleteCar: "/api/cars/delete-car",
  getCars: "/api/cars/get-cars",
  searchCars: "/api/cars/search-cars"
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
