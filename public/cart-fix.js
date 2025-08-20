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
    
    // Enhanced cart management
    const CartManager = {
        add: function(car) {
            if (!car || !car._id) {
                console.error('Invalid car object provided to addToCart');
                return false;
            }
            
            const cart = StorageManager.get(STORAGE_KEYS.CART);
            
            // Check if car already exists
            const existingIndex = cart.findIndex(item => item._id === car._id);
            if (existingIndex !== -1) {
                console.log('Car already in cart:', car._id);
                return false;
            }
            
            // Ensure car has all required fields
            const enhancedCar = {
                _id: car._id,
                make: car.make || 'Unknown',
                model: car.model || 'Unknown',
                year: car.year || new Date().getFullYear(),
                price: car.price || 0,
                image: car.image || 'https://via.placeholder.com/300',
                color: car.color || 'Black',
                description: car.description || 'No description available',
                brand: car.brand || car.make || 'Unknown'
            };
            
            cart.push(enhancedCar);
            StorageManager.set(STORAGE_KEYS.CART, cart);
            this.updateDisplay();
            return true;
        },
        
        remove: function(carId) {
            const cart = StorageManager.get(STORAGE_KEYS.CART);
            const filteredCart = cart.filter(item => item._id !== carId);
            StorageManager.set(STORAGE_KEYS.CART, filteredCart);
            this.updateDisplay();
            return true;
        },
        
        clear: function() {
            StorageManager.clear(STORAGE_KEYS.CART);
            this.updateDisplay();
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
            const cartCountElements = document.querySelectorAll('#cart-count');
            const count = this.getCount();
            
            cartCountElements.forEach(element => {
                if (element) element.textContent = count;
            });
            
            // If we're on cart page, refresh the display
            if (window.location.pathname.includes('cart.html')) {
                this.renderCartPage();
            }
        },
        
        renderCartPage: function() {
            const cart = this.getItems();
            const container = document.getElementById('cart-items');
            
            if (!container) return;
            
            if (!cart.length) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <h3>Your cart is empty</h3>
                        <p>Browse our cars and add some to your cart!</p>
                        <button class="btn" onclick="window.location.href='cars.html'">Browse Cars</button>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = cart.map((car, index) => `
                <div class="car-card" data-car-id="${car._id}">
                    <img src="${car.image}" alt="${car.make} ${car.model}" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
                    <div style="padding: 1rem;">
                        <h3>${car.make} ${car.model}</h3>
                        <p style="color: var(--muted);">${car.year} • ${car.color}</p>
                        <p style="font-size: 1.2rem; font-weight: bold; color: var(--primary);">
                            ₦${car.price.toLocaleString()}/day
                        </p>
                        <p style="font-size: 0.9rem; color: var(--muted); margin: 0.5rem 0;">
                            ${car.description}
                        </p>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 1rem;">
                            <button class="btn" onclick="window.location.href='book.html?carId=${car._id}'">
                                Book Now
                            </button>
                            <button class="btn btn-outline" onclick="CartManager.remove('${car._id}')">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    };
    
    // Make CartManager globally available
    window.CartManager = CartManager;
    
    // Initialize cart display on page load
    document.addEventListener('DOMContentLoaded', function() {
        CartManager.updateDisplay();
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
