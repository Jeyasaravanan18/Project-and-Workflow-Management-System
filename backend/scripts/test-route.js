const axios = require('axios');

const testRoute = async () => {
    try {
        console.log('Testing GET http://localhost:5000/api/analytics/personal-performance');
        const res = await axios.get('http://localhost:5000/api/analytics/personal-performance');
        console.log('Response status:', res.status);
        console.log('Response data:', res.data);
    } catch (error) {
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
};

testRoute();
