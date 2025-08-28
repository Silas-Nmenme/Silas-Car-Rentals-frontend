(function() {
    'use strict';

    // Sample cars to add to the cart
    const sampleCars = [
        {
            _id: '1',
            make: 'Toyota',
            model: 'Camry',
            year: 2022,
            price: 5000,
            image: 'https://via.placeholder.com/300',
            color: 'Red',
            description: 'A comfortable sedan for your travels.',
            brand: 'Toyota'
        },
        {
            _id: '2',
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            price: 4500,
            image: 'https://via.placeholder.com/300',
            color: 'Blue',
            description: 'A reliable compact car.',
            brand: 'Honda'
        },
        {
            _id: '3',
            make: 'Ford',
            model: 'Mustang',
            year: 2023,
            price: 7000,
            image: 'https://via.placeholder.com/300',
            color: 'Black',
            description: 'A sporty car for the adventurous.',
            brand: 'Ford'
        }
    ];

    // Add sample cars to the cart
    sampleCars.forEach(car => {
        window.CartManager.add(car);
    });

    console.log('Sample cars added to the cart.');
})();
