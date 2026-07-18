const axios = require('axios');

const token = 'rnd_L24ngzF61bSakHopR7WNLWnvUJzh';
const serviceId = 'srv-d9dlij61a83c73b05bs0';
const ownerId = 'tea-d3u9va0dl3ps73evrlfg';

async function main() {
    try {
        console.log('Fetching logs from Render...');
        const res = await axios.get('https://api.render.com/v1/logs', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                ownerId: ownerId,
                resource: serviceId,
                limit: 100
            }
        });
        
        console.log('Logs retrieved:', res.data.logs.length);
        // Print all logs in chronological order to find the latest errors
        res.data.logs.forEach(log => {
            console.log(`[${log.timestamp}] ${log.message}`);
        });
    } catch (err) {
        console.error('Error fetching logs:', err.response ? err.response.data : err.message);
    }
}

main();
