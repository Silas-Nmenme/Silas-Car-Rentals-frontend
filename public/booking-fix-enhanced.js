// Enhanced Booking System - Unified booking data management with backend integration
(function() {
    'use strict';
    
    const BOOKING_STORAGE_KEY = 'currentBooking';
    const API_BASE = "https://techyjaunt-auth-go43.onrender.com";
    
    // Unified booking data structure
    const BookingManager = {
        // Create or update booking data
        setBooking: function(bookingData) {
            try {
                // Handle multiple cars from cart
                if (bookingData.cars && Array.isArray(bookingData.cars) && bookingData.cars.length > 0) {
                    // Multiple cars booking (from cart)
                    const booking = {
                        userId: bookingData.userId || this.getUserId(),
                        cars: bookingData.cars.map(car => this.enhanceCarData(car)),
                        pickupDate: bookingData.pickupDate,
                        returnDate: bookingData.returnDate,
                        email: bookingData.email,
                        phoneNumber: bookingData.phoneNumber || bookingData.phone,
                        days: bookingData.pickupDate && bookingData.returnDate ? 
                            this.calculateDays(bookingData.pickupDate, bookingData.returnDate) : 1,
                        totalAmount: bookingData.cars.reduce((total, car) => 
                            total + this.calculateTotal(car.price, bookingData.pickupDate, bookingData.returnDate), 0),
                        createdAt: new Date().toISOString(),
                        source: bookingData.source || 'cart',
                        isMultiCar: true,
                        status: 'pending'
                    };
                    
                    console.log("Multi-car Booking Data:", booking);
                    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(booking));
                    return booking;
                }
                
                // Single car booking (legacy support)
                if (!bookingData.car || !bookingData.car._id) {
                    console.error('Car data is required for booking');
                    return null;
                }
                
                if (!bookingData.pickupDate || !bookingData.returnDate) {
                    console.error('Pickup and return dates are required for booking');
                    return null;
                }
                
                const booking = {
                    userId: bookingData.userId || this.getUserId(),
                    car: this.enhanceCarData(bookingData.car),
                    pickupDate: bookingData.pickupDate,
                    returnDate: bookingData.returnDate,
                    email: bookingData.email,
                    phoneNumber: bookingData.phoneNumber || bookingData.phone,
                    days: this.calculateDays(bookingData.pickupDate, bookingData.returnDate),
                    totalAmount: this.calculateTotal(bookingData.car?.price, bookingData.pickupDate, bookingData.returnDate),
                    createdAt: new Date().toISOString(),
                    source: bookingData.source || 'book',
                    isMultiCar: false,
                    status: 'pending'
                };
                
                console.log("Single-car Booking Data:", booking);
                localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(booking));
                return booking;
            } catch (error) {
                console.error('Error setting booking:', error);
                this.showError('Failed to create booking. Please try again.');
                return null;
            }
        },
        
        // Get current booking data
        getBooking: function() {
            try {
                return JSON.parse(localStorage.getItem(BOOKING_STORAGE_KEY));
            } catch (error) {
                console.error('Error getting booking:', error);
                return null;
            }
        },
        
        // Clear booking data
        clearBooking: function() {
            localStorage.removeItem(BOOKING_STORAGE_KEY);
        },
        
        // Get user ID from localStorage
        getUserId: function() {
            const userData = localStorage.getItem('user');
            let user = null;
            try {
                user = userData ? JSON.parse(userData) : null;
            } catch (e) {
                console.error('Error parsing user data:', e);
                user = null;
            }
            return user ? user.id : null;
        },
        
        // Enhance car data with defaults
        enhanceCarData: function(car) {
            if (!car) return null;
            
            return {
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
        },
        
        // Calculate number of days between dates
        calculateDays: function(startDate, endDate) {
            if (!startDate || !endDate) return 1;
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            return Math.max(1, days); // Ensure at least 1 day
        },
        
        // Calculate total amount
        calculateTotal: function(pricePerDay, startDate, endDate) {
            if (!pricePerDay) return 0;
            
            const days = this.calculateDays(startDate, endDate);
            return pricePerDay * days;
        },
        
        // Validate booking data
        validateBooking: function(booking) {
            if (!booking) return { isValid: false, error: 'No booking data found' };
            
            const errors = [];
            
            // Check for cars (single or multiple)
            if (booking.isMultiCar) {
                if (!booking.cars || !Array.isArray(booking.cars) || booking.cars.length === 0) {
                    errors.push('Car selection is required');
                } else if (!booking.cars.every(car => car && car._id)) {
                    errors.push('Invalid car data in selection');
                }
            } else {
                if (!booking.car || !booking.car._id) {
                    errors.push('Car selection is required');
                }
            }
            
            if (!booking.pickupDate) {
                errors.push('Pickup date is required');
            }
            
            if (!booking.returnDate) {
                errors.push('Return date is required');
            }
            
            if (booking.pickupDate && booking.returnDate) {
                const start = new Date(booking.pickupDate);
                const end = new Date(booking.returnDate);
                if (end <= start) {
                    errors.push('Return date must be after pickup date');
                }
            }
            
            if (!booking.email) {
                errors.push('Email is required');
            } else if (!this.isValidEmail(booking.email)) {
                errors.push('Valid email is required');
            }
            
            if (!booking.phoneNumber) {
                errors.push('Phone number is required');
            }
            
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        },
        
        // Email validation
        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        // Redirect to checkout with validation
        redirectToCheckout: function() {
            const booking = this.getBooking();
            const validation = this.validateBooking(booking);
            
            if (!validation.isValid) {
                this.showError(validation.errors[0]);
                return false;
            }
            
            window.location.href = 'checkout.html';
            return true;
        },
        
        // Show error message
        showError: function(message) {
            // Try to use toast if available, otherwise use alert
            if (typeof showToast === 'function') {
                showToast(message, 3000, '#f44336');
            } else {
                alert(message);
            }
        },
        
        // Show success message
        showSuccess: function(message) {
            if (typeof showToast === 'function') {
                showToast(message, 3000, '#03dac5');
            } else {
                alert(message);
            }
        },
        
// Submit booking to backend
async submitBooking() {
    const booking = this.getBooking();
    const validation = this.validateBooking(booking);

    if (!validation.isValid) {
        this.showError(validation.errors[0]);
        return { success: false, error: validation.errors[0] };
    }

    const token = localStorage.getItem('token');
    if (!token) {
        this.showError('Please login first');
        return { success: false, error: 'Authentication required' };
    }

    try {
        // Prepare booking data for backend
        const bookingData = {
            userId: booking.userId,
            cars: booking.isMultiCar ? booking.cars : [booking.car],
            pickupDate: booking.pickupDate,
            returnDate: booking.returnDate,
            email: booking.email,
            phoneNumber: booking.phoneNumber,
            totalAmount: booking.totalAmount,
            days: booking.days,
            status: 'pending'
        };

        // --- FIX: Use correct endpoint with carId ---
        const carId = booking.isMultiCar ? booking.cars[0]._id : booking.car._id;
        const response = await fetch(`${API_BASE}/api/payment/pay/${encodeURIComponent(carId)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const result = await response.json();
        this.showSuccess('Booking submitted successfully!');
        this.clearBooking();

        return { success: true, data: result };

    } catch (error) {
        console.error('Booking submission error:', error);
        this.showError(error.message || 'Failed to submit booking. Please try again.');
        return { success: false, error: error.message };
    }
},
        
        // Initialize booking from URL parameters
        initFromUrl: function() {
            const urlParams = new URLSearchParams(window.location.search);
            const carId = urlParams.get('carId');
            
            if (carId) {
                // Load car data from API and set as current booking
                this.loadCarAndSetBooking(carId);
            }
        },
        
        // Load car data and set booking
        async loadCarAndSetBooking(carId) {
            try {
                const response = await fetch(`${API_BASE}/api/cars/${carId}`);
                if (response.ok) {
                    const car = await response.json();
                    this.setBooking({ car: car });
                } else {
                    this.showError('Failed to load car details');
                }
            } catch (error) {
                console.error('Error loading car:', error);
                this.showError('Network error loading car details');
            }
        }
    };
    
    // Make BookingManager globally available
    window.BookingManager = BookingManager;
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize from URL parameters if present
        if (window.location.pathname.includes('book.html')) {
            BookingManager.initFromUrl();
        }
        
        // Auto-clear old bookings (older than 1 hour)
        const booking = BookingManager.getBooking();
        if (booking && booking.createdAt) {
            const bookingTime = new Date(booking.createdAt);
            const currentTime = new Date();
            const hoursDiff = (currentTime - bookingTime) / (1000 * 60 * 60);
            
            if (hoursDiff > 1) {
                BookingManager.clearBooking();
            }
        }
    });
    
    console.log('Enhanced booking system initialized successfully');
})();
