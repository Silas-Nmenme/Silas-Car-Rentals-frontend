/**
 * Utility functions for the car rental dashboard
 */

// Format currency values
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calculate days between two dates
function calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Show loading spinner
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading-spinner"></div>';
    }
}

// Hide loading spinner
function hideLoading(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content || '';
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone number
function validatePhone(phone) {
    const re = /^\+?[\d\s\-\(\)]{10,}$/;
    return re.test(phone);
}

// Get query parameter from URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Set query parameter in URL
function setQueryParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
}

// Remove query parameter from URL
function removeQueryParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url);
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Local storage helpers
const storage = {
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    get: (key) => {
        const item = localStorage.getItem(key);
        if (!item) return null;
        if (key === 'token') {
            // Tokens are strings, return as is
            return item;
        }
        try {
            return JSON.parse(item);
        } catch (e) {
            // If it's not valid JSON, return as string
            return item;
        }
    },
    remove: (key) => {
        localStorage.removeItem(key);
    },
    clear: () => {
        localStorage.clear();
    }
};

// Check if user is logged in
function isLoggedIn() {
    return !!storage.get('token');
}

// Get auth headers for API calls
function getAuthHeaders() {
    const token = storage.get('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    
    if (error.response) {
        // Server responded with error
        const message = error.response.data?.message || 'An error occurred';
        showToast(message, 'error');
    } else if (error.request) {
        // Request made but no response
        showToast('Network error. Please check your connection.', 'error');
    } else {
        // Something else happened
        showToast('An unexpected error occurred', 'error');
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Format car name
function formatCarName(car) {
    return `${car.year} ${car.make} ${car.model}`;
}

// Calculate rental price
function calculateRentalPrice(car, startDate, endDate) {
    const days = calculateDaysBetween(startDate, endDate);
    return car.dailyRate * days;
}

// Export functions for use in other modules
export {
    formatCurrency,
    formatDate,
    formatDateTime,
    calculateDaysBetween,
    showLoading,
    hideLoading,
    showToast,
    validateEmail,
    validatePhone,
    getQueryParam,
    setQueryParam,
    removeQueryParam,
    debounce,
    storage,
    isLoggedIn,
    getAuthHeaders,
    handleApiError,
    generateId,
    capitalizeFirst,
    formatCarName,
    calculateRentalPrice
};
