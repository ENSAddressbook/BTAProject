
const dotenv = require('dotenv');
dotenv.config();

console.log('\nChecking deployment environment...');
console.log('=================================');
console.log('Private Key length:', process.env.PRIVATE_KEY?.length);
console.log('Sepolia RPC URL:', process.env.SEPOLIA_RPC_URL ? '✓ Set' : '✗ Missing');
console.log('ENS Registry:', process.env.ENS_REGISTRY_ADDRESS);