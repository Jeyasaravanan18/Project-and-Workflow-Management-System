const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'crash-report.txt');

function log(message) {
    fs.appendFileSync(logFile, message + '\n');
    process.stdout.write(message + '\n');
}

log('--- STARTING DEBUG RUN ---');

process.on('uncaughtException', (err) => {
    log('UNCAUGHT EXCEPTION:');
    log(err.stack || err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log('UNHANDLED REJECTION:');
    log(reason.stack || reason);
    process.exit(1);
});

try {
    log('Requiring server.js...');
    require('./server.js');
} catch (err) {
    log('ERROR REQUIRING SERVER.JS:');
    log(err.stack || err);
}
