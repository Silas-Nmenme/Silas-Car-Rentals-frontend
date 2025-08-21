# Silas Car Rentals - Unified Booking System Guide

## Overview

This document describes the new unified booking system that replaces the previous `lastBooking` localStorage approach with a centralized `BookingManager` class.

## Key Changes

### 1. Centralized Booking Management
- **Old**: Each page managed booking data independently using `localStorage.getItem('lastBooking')`
- **New**: All booking operations go through `BookingManager` class in `booking-fix.js`

### 2. Files Updated
- `book.html` - Updated to use BookingManager
- `checkout.html` - Updated to use BookingManager  
- `cart.html` - Updated to handle cart checkout flow
- `order.html` - Updated to use BookingManager and clear booking after display
- `booking-fix.js` - New centralized booking management system

### 3. Booking Flow Changes

#### Direct Booking Flow (book.html → checkout.html → order.html)
1. User fills booking form on `book.html`
2. Data is stored via `BookingManager.setBooking()`
3. Redirect to `checkout.html` which reads from `BookingManager.getBooking()`
4. After payment, redirect to `order.html` which shows summary and clears booking

#### Cart Booking Flow (cart.html → book.html → checkout.html → order.html)
1. User adds car to cart
2. Clicks "Proceed to Checkout" in cart
3. Car data is stored via `BookingManager.setBooking({car: cartCar, source: 'cart'})`
4. Redirect to `book.html?carId=XXX` to collect booking details
5. Continue with normal booking flow

## API Reference

### BookingManager Methods

#### `setBooking(bookingData)`
Sets a new booking with validation.

```javascript
const result = BookingManager.setBooking({
  car: carObject,
  pickupDate: '2024-01-15',
  returnDate: '2024-01-17',
  email: 'user@example.com',
  phoneNumber: '+2348012345678',
  source: 'book' // or 'cart'
});
```

#### `getBooking()`
Retrieves the current booking.

```javascript
const booking = BookingManager.getBooking();
```

#### `clearBooking()`
Clears the current booking from storage.

```javascript
BookingManager.clearBooking();
```

#### `validateBooking(bookingData)`
Validates booking data structure.

```javascript
const validation = BookingManager.validateBooking(bookingData);
if (validation.isValid) {
  // Proceed
} else {
  console.log('Errors:', validation.errors);
}
```

#### `calculateDays(startDate, endDate)`
Calculates number of days between dates.

```javascript
const days = BookingManager.calculateDays('2024-01-15', '2024-01-17');
// Returns: 2
```

### Booking Data Structure

```javascript
{
  car: {
    _id: "car-id-123",
    make: "Toyota",
    model: "Camry", 
    year: 2023,
    price: 15000,
    image: "https://example.com/car.jpg"
  },
  pickupDate: "2024-01-15",
  returnDate: "2024-01-17",
  email: "user@example.com",
  phoneNumber: "+2348012345678",
  days: 2, // Auto-calculated
  totalAmount: 30000, // Auto-calculated (price * days)
  source: "book", // or "cart"
  createdAt: "2024-01-14T10:30:00Z" // Auto-generated
}
```

## Validation Rules

The booking system validates:
- ✅ Car object with required properties
- ✅ Valid pickup and return dates
- ✅ Return date after pickup date
- ✅ Valid email format
- ✅ Phone number format (basic validation)
- ✅ All required fields present

## Storage Implementation

Bookings are stored in localStorage with key `silas-booking` for persistence across page navigation.

## Error Handling

The system provides detailed error messages for:
- Missing required fields
- Invalid date ranges  
- Invalid email formats
- Storage failures

## Testing

Use `test-booking-system.html` to verify:
- ✅ Booking data management
- ✅ Validation rules
- ✅ Flow transitions
- ✅ Error handling

## Migration Notes

### From Old System
- Replace `localStorage.getItem('lastBooking')` with `BookingManager.getBooking()`
- Replace `localStorage.setItem('lastBooking', ...)` with `BookingManager.setBooking(...)`
- Remove manual date calculations - use `BookingManager.calculateDays()`

### Backward Compatibility
The new system maintains the same booking data structure for API compatibility.

## Troubleshooting

### Common Issues
1. **Booking not persisting**: Check if `booking-fix.js` is loaded
2. **Validation errors**: Use `BookingManager.validateBooking()` to debug
3. **Date issues**: Use `BookingManager.calculateDays()` for consistent calculations

### Debugging
```javascript
// Check current booking
console.log('Current booking:', BookingManager.getBooking());

// Test validation
const testData = { car: { _id: 'test' } };
console.log('Validation:', BookingManager.validateBooking(testData));
```

## Future Enhancements

Potential improvements:
- Add booking expiration (auto-clear after 24 hours)
- Support multiple booking drafts
- Add booking history
- Integrate with backend API synchronization
