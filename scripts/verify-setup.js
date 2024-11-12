const hre = require("hardhat");
const contractsConfig = require("../frontend/src/contracts/contracts-config.json");

async function main() {
    console.log("\nVerifying Local Setup...");
    console.log("=========================");

    // 1. Check if node is running
    try {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        const blockNumber = await provider.getBlockNumber();
        console.log("✅ Local node is running");
        console.log("Current block number:", blockNumber);
    } catch (error) {
        console.log("❌ Local node is not running. Please run 'npx hardhat node'");
        return;
    }

    // 2. Check Contract Deployments
    const ensAddressBookAddress = contractsConfig.ensAddressBook.address;
    const mockENSAddress = contractsConfig.mockENS.address;

    try {
        const ENSAddressBook = await ethers.getContractFactory("ENSAddressBook");
        const ensAddressBook = await ENSAddressBook.attach(ensAddressBookAddress);
        await ensAddressBook.owner(); // Try to call a function
        console.log("✅ ENSAddressBook contract is deployed at:", ensAddressBookAddress);
    } catch (error) {
        console.log("❌ ENSAddressBook contract is not properly deployed");
        console.error(error.message);
    }

    try {
        const MockENS = await ethers.getContractFactory("MockENS");
        const mockENS = await MockENS.attach(mockENSAddress);
        await mockENS.owner("0x0000000000000000000000000000000000000000000000000000000000000000"); // Try to call a function
        console.log("✅ MockENS contract is deployed at:", mockENSAddress);
    } catch (error) {
        console.log("❌ MockENS contract is not properly deployed");
        console.error(error.message);
    }

    // 3. Print test accounts
    const accounts = await ethers.getSigners();
    console.log("\nAvailable Test Accounts:");
    console.log("========================");
    for (let i = 0; i < 3; i++) { // Show first 3 accounts
        const balance = await ethers.provider.getBalance(accounts[i].address);
        console.log(`Account #${i}: ${accounts[i].address}`);
        console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);
    }

    console.log("\nTo test in MetaMask:");
    console.log("1. Network Settings:");
    console.log("   - RPC URL: http://127.0.0.1:8545");
    console.log("   - Chain ID: 31337");
    console.log("   - Currency Symbol: ETH");
    console.log("\n2. Import any of the accounts above using their private keys");
    console.log("   (Private keys are shown when you run 'npx hardhat node')");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });