// Enhanced Booking System - Unified booking data management with backend integration
(function () {
    'use strict';

    const BOOKING_STORAGE_KEY = 'currentBooking';
    const API_BASE = "https://techyjaunt-auth-go43.onrender.com";

    const BookingManager = {
        // Create or update booking data
        setBooking: function (bookingData) {
            try {
                // Normalize fields
                const phone = bookingData.phoneNumber || bookingData.phone || '';
                const email = bookingData.email || '';
                const pickupDate = bookingData.pickupDate || '';
                const returnDate = bookingData.returnDate || '';

                // Handle multiple cars from cart - disabled for payment integration
                if (bookingData.cars && Array.isArray(bookingData.cars) && bookingData.cars.length > 0) {
                    this.showError('Multi-car bookings are not supported with payment integration. Please book one car at a time.');
                    return null;
                }

                // Single car booking
                if (!bookingData.car || !bookingData.car._id) {
                    this.showError('Car data is required for booking');
                    return null;
                }
                if (!pickupDate || !returnDate) {
                    this.showError('Pickup and return dates are required for booking');
                    return null;
                }
                if (!email) {
                    this.showError('Email is required for booking');
                    return null;
                }
                if (!phone) {
                    this.showError('Phone number is required for booking');
                    return null;
                }

                const booking = {
                    bookingId: 'BK' + Date.now(),
                    userId: bookingData.userId || this.getUserId(),
                    car: this.enhanceCarData(bookingData.car),
                    pickupDate,
                    returnDate,
                    email,
                    phoneNumber: phone,
                    days: this.calculateDays(pickupDate, returnDate),
                    totalAmount: this.calculateTotal(bookingData.car?.price, pickupDate, returnDate),
                    createdAt: new Date().toISOString(),
                    source: bookingData.source || 'book',
                    isMultiCar: false,
                    status: 'pending'
                };
                localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(booking));
                return booking;
            } catch (error) {
                console.error('Error setting booking:', error);
                this.showError('Failed to create booking. Please try again.');
                return null;
            }
        },

        // Get current booking data
        getBooking: function () {
            try {
                return JSON.parse(localStorage.getItem(BOOKING_STORAGE_KEY));
            } catch (error) {
                console.error('Error getting booking:', error);
                return null;
            }
        },

        // Clear booking data
        clearBooking: function () {
            localStorage.removeItem(BOOKING_STORAGE_KEY);
        },

        // Get user ID from localStorage
        getUserId: function () {
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
        enhanceCarData: function (car) {
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
        calculateDays: function (startDate, endDate) {
            if (!startDate || !endDate) return 1;
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            return Math.max(1, days);
        },

        // Calculate total amount
        calculateTotal: function (pricePerDay, startDate, endDate) {
            if (!pricePerDay) return 0;
            const days = this.calculateDays(startDate, endDate);
            return pricePerDay * days;
        },

        // Validate booking data
        validateBooking: function (booking) {
            if (!booking) return { isValid: false, errors: ['No booking data found'] };
            const errors = [];
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
            if (!booking.pickupDate) errors.push('Pickup date is required');
            if (!booking.returnDate) errors.push('Return date is required');
            if (booking.pickupDate && booking.returnDate) {
                const start = new Date(booking.pickupDate);
                const end = new Date(booking.returnDate);
                if (end <= start) errors.push('Return date must be after pickup date');
            }
            if (!booking.email) errors.push('Email is required');
            else if (!this.isValidEmail(booking.email)) errors.push('Valid email is required');
            if (!booking.phoneNumber) errors.push('Phone number is required');
            return {
                isValid: errors.length === 0,
                errors
            };
        },

        // Email validation
        isValidEmail: function (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        // Redirect to checkout with validation
        redirectToCheckout: function () {
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
        showError: function (message) {
            if (typeof showToast === 'function') {
                showToast(message, 3000, '#f44336');
            } else {
                alert(message);
            }
        },

        // Show success message
        showSuccess: function (message) {
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
            const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('userToken');
            if (!token) {
                this.showError('Please login first');
                return { success: false, error: 'Authentication required' };
            }
            try {
                const carId = booking.car._id;
                const paymentData = {
                    email: booking.email,
                    phone_number: booking.phoneNumber,
                    startDate: booking.pickupDate,
                    endDate: booking.returnDate
                };
                const url = `${API_BASE}/api/payment/pay/${carId}`;
                console.log('Initiating payment to:', url);
                console.log('Payment data:', paymentData);
                console.log('Token present:', !!token);
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(paymentData)
                });
                console.log('Response status:', response.status);
                if (!response.ok) {
                    let errorData = {};
                    try {
                        errorData = await response.json();
                    } catch (e) {
                        console.error('Failed to parse error response:', e);
                    }
                    console.error('Error data:', errorData);
                    throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
                }
                const result = await response.json();
                console.log('Success response:', result);
                if (result.redirectLink) {
                    window.location.href = result.redirectLink;
                } else {
                    this.showError('No payment link received from server');
                    return { success: false, error: 'No payment link received' };
                }
                return { success: true, data: result };
            } catch (error) {
                console.error('Payment initiation error:', error);
                this.showError(error.message || 'Failed to initiate payment. Please try again.');
                return { success: false, error: error.message };
            }
        },

        // Initialize booking from URL parameters
        initFromUrl: function () {
            const urlParams = new URLSearchParams(window.location.search);
            const carId = urlParams.get('carId');
            if (carId) {
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

    window.BookingManager = BookingManager;

    document.addEventListener('DOMContentLoaded', function () {
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
