const request = require('supertest');
const { app } = require('../server');
const mongoose = require('mongoose');

// Mock mongoose connection if needed, but for health check we just want to ensure it responds
// We suppress console logs during tests to keep output clean
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterAll(async () => {
    await mongoose.disconnect(); // Ensure we close any accidental connections
    jest.restoreAllMocks();
});

describe('Health Check API', () => {
    it('should return 200 OK', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'healthy');
        // We expect mongodb to be false/undefined if we didn't connect, or true if setup.js connected.
        // For now just checking accessibility.
    });
});
