// Test script to verify booking functionality
console.log("Testing booking functionality...");

// Simulate booking data
const testBookingData = {
  userId: "test-user-123",
  car: {
    _id: "car-123",
    make: "Toyota",
    model: "Camry",
    year: 2023,
    price: 5000,
    image: "https://example.com/car.jpg"
  },
  pickupDate: "2024-01-15",
  returnDate: "2024-01-17",
  email: "test@example.com",
  phoneNumber: "+1234567890",
  source: "test"
};

// Test BookingManager functions
console.log("Testing setBooking...");
const booking = BookingManager.setBooking(testBookingData);
console.log("Booking created:", booking);

console.log("Testing getBooking...");
const retrievedBooking = BookingManager.getBooking();
console.log("Retrieved booking:", retrievedBooking);

console.log("Testing calculateDays...");
const days = BookingManager.calculateDays("2024-01-15", "2024-01-17");
console.log("Days calculated:", days);

console.log("Testing calculateTotal...");
const total = BookingManager.calculateTotal(5000, "2024-01-15", "2024-01-17");
console.log("Total calculated:", total);

console.log("Testing validateBooking...");
const validation = BookingManager.validateBooking(retrievedBooking);
console.log("Validation result:", validation);

console.log("Test completed!");
