/**
 * Real-time Integration Demo Script
 * 
 * This script interacts with the backend to simulate background activities.
 * It demonstrates how the frontend UI reacts instantly to server-side events.
 */

const axios = require('axios');

// Configure these if your dev environment is different
const API_BASE_URL = 'http://localhost:5000/api';
const ORG_ID = 'your-org-id-here'; // You can get this from the dashboard or a user record

async function triggerDemoActivity(serviceId) {
    console.log(`🚀 Triggering live activity for ${serviceId}...`);
    
    try {
        // We'll use a special debug endpoint or simulate an action handler call
        // For this demo, let's assume we have a way to trigger a "sync" manually
        
        const response = await axios.post(`${API_BASE_URL}/integrations/${serviceId}/test`);
        
        if (response.data.success) {
            console.log('✅ Success! Check your browser dashboard.');
        } else {
            console.log('❌ Failed:', response.data.message);
        }
    } catch (error) {
        console.error('❌ Error triggering demo:', error.message);
    }
}

// Instructions for the user will be in the chat
console.log('Usage: node demo-trigger.js <service-id>');
