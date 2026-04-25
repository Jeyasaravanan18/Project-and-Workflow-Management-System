// tests/setup.js
const mongoose = require('mongoose');

beforeAll(async () => {
    // Optional: Connect to a test database if needed
});

afterAll(async () => {
    await mongoose.disconnect();
});
