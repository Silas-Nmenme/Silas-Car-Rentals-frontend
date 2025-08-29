(function() {
  const sampleSavedCars = [
    {
      _id: "car1",
      make: "Toyota",
      model: "Camry",
      price: 5000,
      image: "https://via.placeholder.com/300?text=Toyota+Camry"
    },
    {
      _id: "car2",
      make: "Honda",
      model: "Civic",
      price: 4500,
      image: "https://via.placeholder.com/300?text=Honda+Civic"
    },
    {
      _id: "car3",
      make: "Ford",
      model: "Mustang",
      price: 8000,
      image: "https://via.placeholder.com/300?text=Ford+Mustang"
    }
  ];

  localStorage.setItem("savedCars", JSON.stringify(sampleSavedCars));
  console.log("Sample saved cars added to localStorage.");
})();
