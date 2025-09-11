// Cart System Fix - Enhanced cart functionality
(function() {
    'use strict';
    
    // Ensure consistent storage keys across all pages
    const STORAGE_KEYS = {
        CART: 'cart',
        WISHLIST: 'wishlist',
        SAVED: 'savedCars'
    };
    
    // Enhanced storage functions with error handling
    const StorageManager = {
        get: function(key) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error(`Error reading ${key} from localStorage:`, error);
                return [];
            }
        },
        
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error(`Error writing to ${key} in localStorage:`, error);
                return false;
            }
        },
        
        clear: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error(`Error clearing ${key} from localStorage:`, error);
                return false;
            }
        }
    };
    
    // Helper function to get current user
    function getCurrentUser() {
        try {
            const u = JSON.parse(localStorage.getItem('user') || 'null');
            if (u && (u.token || u.id)) return u;
        } catch {}
        // Back-compat for older pages:
        const legacyToken = localStorage.getItem('authToken') || localStorage.getItem('userToken') || localStorage.getItem('token');
        if (legacyToken) return { token: legacyToken };
        return null;
    }

    // Enhanced cart management
    const CartManager = {
        add: function(car) {
            if (!car || !car._id) {
                console.error('Invalid car object provided to addToCart');
                return false;
            }

            // Check if user is logged in
            const user = getCurrentUser();
            if (!user) {
                alert('Please login to add cars to cart.');
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
                return false;
            }

            const cart = StorageManager.get(STORAGE_KEYS.CART);

            // Check if car already exists
            const existingIndex = cart.findIndex(item => item._id === car._id);
            if (existingIndex !== -1) {
                console.log('Car already in cart:', car._id);
                return false;
            }

            // Ensure car has all required fields and preserve all available details
            const enhancedCar = {
                _id: car._id,
                make: car.make || 'Unknown',
                model: car.model || 'Unknown',
                year: car.year || new Date().getFullYear(),
                price: car.price || 0,
                image: car.image || 'https://via.placeholder.com/300',
                color: car.color || 'Black',
                description: car.description || 'No description available',
                brand: car.brand || car.make || 'Unknown',
                type: car.type || 'sedan',
                isAvailable: car.isAvailable !== undefined ? car.isAvailable : true,
                isRented: car.isRented || false,
                rentedBy: car.rentedBy || null,
                startDate: car.startDate || null,
                endDate: car.endDate || null,
                totalPrice: car.totalPrice || 0,
                status: car.status || 'available',
                createdAt: car.createdAt || new Date().toISOString(),
                updatedAt: car.updatedAt || new Date().toISOString()
            };

            cart.push(enhancedCar);
            StorageManager.set(STORAGE_KEYS.CART, cart);
            this.updateDisplay();

            // Sync to backend if CountManager is available
            if (window.CountManager && window.CountManager.syncLocalChanges) {
                window.CountManager.syncLocalChanges('cart');
            }

            return true;
        },
        
        remove: function(carId) {
            const cart = StorageManager.get(STORAGE_KEYS.CART);
            const filteredCart = cart.filter(item => item._id !== carId);
            StorageManager.set(STORAGE_KEYS.CART, filteredCart);
            this.updateDisplay();

            // Sync to backend if CountManager is available
            if (window.CountManager && window.CountManager.syncLocalChanges) {
                window.CountManager.syncLocalChanges('cart');
            }

            return true;
        },

        clear: function() {
            StorageManager.clear(STORAGE_KEYS.CART);
            this.updateDisplay();

            // Sync to backend if CountManager is available
            if (window.CountManager && window.CountManager.syncLocalChanges) {
                window.CountManager.syncLocalChanges('cart');
            }

            return true;
        },
        
        getItems: function() {
            return StorageManager.get(STORAGE_KEYS.CART);
        },
        
        getCount: function() {
            return this.getItems().length;
        },
        
        updateDisplay: function() {
            // Update all cart count displays across the site
            this.updateCartSummary(); // Ensure summary is updated when display is updated
            const cartCountElements = document.querySelectorAll('#cart-count');
            const count = this.getCount();
            
            cartCountElements.forEach(element => {
                if (element) element.textContent = count;
            });
            
            // If we're on cart page, refresh the display
            if (window.location.pathname.includes('cart.html')) {
                this.renderCartPage();
                this.updateCartSummary();
            }
        },
        
        renderCartPage: function() {
            const cart = this.getItems();
            const container = document.getElementById('cart-items');

            if (!container) return;

            if (!cart.length) {
                container.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>Your cart is empty</h3>
                        <p>Browse our cars and add some to your cart!</p>
                        <button class="btn btn-primary" onclick="window.handleContinueShopping()">Browse Cars</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = cart.map((car, index) => `
                <div class="cart-item d-flex flex-column flex-md-row gap-4">
                    <div class="cart-item-img-container" style="flex: 0 0 200px;">
                        <img src="${car.image}" alt="${car.make} ${car.model}" class="cart-item-img">
                    </div>
                    <div class="cart-item-details flex-grow-1">
                        <h3 class="cart-item-title">${car.make} ${car.model}</h3>
                        <p class="text-muted">${car.year} • ${car.color}</p>
                        <p class="cart-item-price">₦${car.price.toLocaleString()}/day</p>
                        <p class="text-muted" style="margin: 0.5rem 0;">
                            ${car.description}
                        </p>
                        <div class="d-flex gap-2 flex-wrap mt-3">
                            <button class="btn btn-primary" onclick="window.handleBookNow('${car._id}')" title="Book this car">
                                Book Now
                            </button>
                            <button class="btn btn-outline" onclick="CartManager.remove('${car._id}')" title="Remove this car from cart">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        },
        
        updateCartSummary: function() {
            const cart = this.getItems();
            const totalItems = document.getElementById('cart-total-items');
            const totalPrice = document.getElementById('cart-total-price');
            
            if (totalItems && totalPrice) {
                totalItems.textContent = cart.length;
                const total = cart.reduce((sum, car) => sum + (car.price || 0), 0);
                totalPrice.textContent = `₦${total.toLocaleString()}`;
            }
        }
    };
    
    // Make CartManager globally available
    window.CartManager = CartManager;
    
    // Initialize cart display on page load
    document.addEventListener('DOMContentLoaded', function() {
        CartManager.updateDisplay();
        
        // Example: Assume each "Book Now" button has a data-car-id attribute
        document.querySelectorAll('.book-now-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Check login status (adjust key as per your app)
                const isLoggedIn = !!localStorage.getItem('userToken'); // or 'user', etc.
                const carId = this.getAttribute('data-car-id');
                if (isLoggedIn) {
                    // Redirect to book.html with car id as query param
                    window.location.href = `book.html?carId=${encodeURIComponent(carId)}`;
                } else {
                    // Show login message (replace with your modal/message logic)
                    alert('Please login to continue booking.');
                }
            });
        });
    });
    
    // Override existing functions for compatibility
    window.addToCart = function(car) {
        return CartManager.add(car);
    };
    
    window.removeFromCart = function(id) {
        return CartManager.remove(id);
    };
    
    window.clearCart = function() {
        return CartManager.clear();
    };
    
    // Enhanced renderCart function for cart.html
    if (window.location.pathname.includes('cart.html')) {
        window.renderCart = function() {
            CartManager.renderCartPage();
        };
    }
    
    console.log('Cart system initialized successfully');
})();
