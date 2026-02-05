// Deep diagnostic for electron module injection
console.log('NODE_MODULE_VERSION:', process.config.variables?.node_module_version);
console.log('Calling from:', process.execPath);
console.log('Electron available modules:');

try {
    const electron = require('electron');
    console.log('electron:', typeof electron, electron);
    console.log('electron.app:', typeof electron.app, electron.app);
} catch (e) {
    console.error('Error requiring electron:', e.message);
}

// Check if we're actually in Electron's main process
console.log('process.type:', process.type);
console.log('process.resourcesPath:', process.resourcesPath);  // Only exists in Electron

if (process.type === 'browser') {
    console.log('Running in Electron main process!');
} else if (process.type === 'renderer') {
    console.log('Running in Electron renderer process!');
} else {
    console.log('NOT running in Electron process - this is plain Node.js!');
}

setTimeout(() => process.exit(0), 1000);
