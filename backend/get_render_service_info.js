const axios = require('axios');

const token = 'rnd_L24ngzF61bSakHopR7WNLWnvUJzh';
const serviceId = 'srv-d9dlij61a83c73b05bs0';

async function main() {
    try {
        console.log('Fetching service info from Render...');
        const res = await axios.get(`https://api.render.com/v1/services/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Service Info:', JSON.stringify(res.data, null, 2));

        console.log('\nFetching deploys list...');
        const deploysRes = await axios.get(`https://api.render.com/v1/services/${serviceId}/deploys`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Deploys count:', deploysRes.data.length);
        if (deploysRes.data.length > 0) {
            console.log('Latest Deploy Status:', deploysRes.data[0].deploy.status);
        }
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

main();
