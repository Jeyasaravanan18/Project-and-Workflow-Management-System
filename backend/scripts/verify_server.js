const http = require('http');

const checkHealth = () => {
    const req = http.get('http://localhost:5000/health', (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log('✅ Server is healthy:', data);
        });
    });

    req.on('error', (e) => {
        console.error('❌ Server check failed:', e.message);
    });
};

checkHealth();
