async function testLogin() {
  const email = "you@example.com"; // Replace with a valid email
  const password = "yourpassword"; // Replace with a valid password

  try {
    const response = await fetch("https://techyjaunt-auth-go43.onrender.com/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    console.log('Login Response:', data);

    if (response.ok) {
      console.log('Login successful:', data);
    } else {
      console.error('Login failed:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Run the test
testLogin();
