// Booking System Fix - Unified booking data management
(function() {
    'use strict';
    
    const BOOKING_STORAGE_KEY = 'currentBooking';
    const API_BASE = "https://techyjaunt-auth-go43.onrender.com";
    
    // Unified booking data structure
    const BookingManager = {
        // Create or update booking data
        setBooking: function(bookingData) {
            try {
                const booking = {
                    userId: bookingData.userId || JSON.parse(localStorage.getItem('user'))?.id,
                    car: this.enhanceCarData(bookingData.car),
                    pickupDate: bookingData.pickupDate,
                    returnDate: bookingData.returnDate,
                    email: bookingData.email,
                    phoneNumber: bookingData.phoneNumber || bookingData.phone,
                    days: bookingData.days || this.calculateDays(bookingData.pickupDate, bookingData.returnDate),
                    totalAmount: bookingData.totalAmount || this.calculateTotal(bookingData.car?.price, bookingData.pickupDate, bookingData.returnDate),
                    createdAt: new Date().toISOString(),
                    source: bookingData.source || 'book'
                };
                
                localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(booking));
                return booking;
            } catch (error) {
                console.error('Error setting booking:', error);
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
            return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
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
            
            if (!booking.car || !booking.car._id) {
                errors.push('Car selection is required');
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
            alert(message); // Can be replaced with a toast notification
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
                }
            } catch (error) {
                console.error('Error loading car:', error);
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
    
    console.log('Booking system initialized successfully');
})();
