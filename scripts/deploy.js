// const hre = require("hardhat");

// async function main() {
//     try {
//         const [deployer] = await ethers.getSigners();
//         console.log("Deploying contracts with the account:", deployer.address);

//         const balance = await deployer.provider.getBalance(deployer.address);
//         console.log("Account balance:", ethers.formatEther(balance.toString()), "ETH");

//         // Deploy ENSAddressBook
//         const ENSAddressBook = await ethers.getContractFactory("ENSAddressBook");
        
//         // For local testing, first deploy MockENS
//         const MockENS = await ethers.getContractFactory("MockENS");
//         const mockENS = await MockENS.deploy();
//         await mockENS.waitForDeployment();
        
//         const ensRegistryAddress = await mockENS.getAddress();
//         console.log("MockENS deployed to:", ensRegistryAddress);

//         console.log("Deploying ENSAddressBook...");
//         const ensAddressBook = await ENSAddressBook.deploy(ensRegistryAddress);
//         await ensAddressBook.waitForDeployment();

//         const contractAddress = await ensAddressBook.getAddress();
//         console.log("ENSAddressBook deployed to:", contractAddress);

//         // Log deployment info
//         console.log("\nDeployment Summary:");
//         console.log("===================");
//         console.log("Network:", network.name);
//         console.log("ENSAddressBook Address:", contractAddress);
//         console.log("MockENS Registry:", ensRegistryAddress);
//         console.log("Deployer Address:", deployer.address);
//     } catch (error) {
//         console.error("Error during deployment:", error);
//         throw error;  // This will help show the full error stack
//     }
// }

// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     });



const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with the account:", deployer.address);

        const balance = await deployer.provider.getBalance(deployer.address);
        console.log("Account balance:", ethers.formatEther(balance.toString()), "ETH");

        // Deploy MockENS first for local testing
        const MockENS = await ethers.getContractFactory("MockENS");
        const mockENS = await MockENS.deploy();
        await mockENS.waitForDeployment();
        
        const mockENSAddress = await mockENS.getAddress();
        console.log("MockENS deployed to:", mockENSAddress);

        // Deploy ENSAddressBook
        const ENSAddressBook = await ethers.getContractFactory("ENSAddressBook");
        const ensAddressBook = await ENSAddressBook.deploy(mockENSAddress);
        await ensAddressBook.waitForDeployment();

        const ensAddressBookAddress = await ensAddressBook.getAddress();
        console.log("ENSAddressBook deployed to:", ensAddressBookAddress);

        // Save the contract addresses and ABIs
        const contracts = {
            mockENS: {
                address: mockENSAddress,
                abi: JSON.parse(JSON.stringify(await mockENS.interface.formatJson()))
            },
            ensAddressBook: {
                address: ensAddressBookAddress,
                abi: JSON.parse(JSON.stringify(await ensAddressBook.interface.formatJson()))
            }
        };

        // Create directories if they don't exist
        const deploymentPath = path.join(__dirname, "../frontend/src/contracts");
        fs.mkdirSync(deploymentPath, { recursive: true });

        // Save addresses and ABIs
        fs.writeFileSync(
            path.join(deploymentPath, "contracts-config.json"),
            JSON.stringify(contracts, null, 2)
        );

        console.log("\nDeployment information saved to:", path.join(deploymentPath, "contracts-config.json"));
        
    } catch (error) {
        console.error("Error during deployment:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });