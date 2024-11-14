// scripts/validate-key.js
require("dotenv").config();

function validateKey() {
    const key = process.env.PRIVATE_KEY || '';
    
    console.log('\nValidating private key...');
    console.log('-------------------------');
    
    // Check if key exists
    if (!key) {
        console.error('❌ No private key found in .env file');
        return false;
    }

    // Remove 0x prefix if exists
    const cleanKey = key.replace('0x', '').trim();
    
    // Check length
    console.log(`Key length: ${cleanKey.length} characters`);
    if (cleanKey.length !== 64) {
        console.error('❌ Invalid key length. Expected 64 characters without 0x prefix');
        return false;
    }

    // Check if it's hex
    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
        console.error('❌ Invalid characters. Private key should only contain hex characters (0-9, a-f, A-F)');
        return false;
    }

    console.log('✅ Private key is valid!');
    return true;
}

validateKey();