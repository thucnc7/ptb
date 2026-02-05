const http = require('http');

console.log('Sending Capture command to find output format...');

const req = http.get('http://127.0.0.1:5513/?cmd=Capture', (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('--- RESPONSE BODY ---');
        console.log(data);
        console.log('---------------------');

        // Check if it looks like a filename
        if (data.includes('.jpg') || data.includes('.JPG')) {
            console.log('FOUND IMAGE FILENAME IN RESPONSE!');
        } else {
            console.log('No obvious filename in response.');
        }
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
});
