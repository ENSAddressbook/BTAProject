require("dotenv").config();
const hre = require("hardhat");

async function main() {
    try {
        console.log("🚀 Starting deployment process...");

        // Get the network
        const network = await hre.ethers.provider.getNetwork();
        console.log(`📍 Target Network: ${network.name} (chainId: ${network.chainId})`);

        // Get the deployer's address
        const [deployer] = await hre.ethers.getSigners();
        console.log(`🔑 Deployer Account: ${deployer.address}`);

        // Check deployer's balance
        const balance = await deployer.provider.getBalance(deployer.address);
        console.log(`💰 Deployer Balance: ${hre.ethers.formatEther(balance)} ETH`);

        // ENS Registry Address for Sepolia
        const SEPOLIA_ENS_REGISTRY = process.env.ENS_REGISTRY_ADDRESS || "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
        console.log(`📗 ENS Registry Address: ${SEPOLIA_ENS_REGISTRY}`);

        // Deploy the contract
        console.log("\n📄 Deploying ENSAddressBook contract...");
        const ENSAddressBook = await hre.ethers.getContractFactory("ENSAddressBook");
        
        const ensAddressBook = await ENSAddressBook.deploy(
            SEPOLIA_ENS_REGISTRY,  // ENS Registry Address
            false                   // useENSRegistry set to false initially
        );

        console.log("⏳ Waiting for deployment transaction...");
        await ensAddressBook.waitForDeployment();
        
        const contractAddress = await ensAddressBook.getAddress();
        console.log(`✅ ENSAddressBook deployed to: ${contractAddress}`);

        // Verify the contract if on a network that supports verification
        if (network.chainId === 11155111 && process.env.ETHERSCAN_API_KEY) { // Sepolia chainId
            console.log("\n🔍 Starting contract verification...");
            
            // Wait for 6 blocks for better validation
            console.log("⏳ Waiting for 6 blocks before verification...");
            await ensAddressBook.deployTransaction.wait(6);

            try {
                await hre.run("verify:verify", {
                    address: contractAddress,
                    constructorArguments: [
                        SEPOLIA_ENS_REGISTRY,
                        false
                    ],
                });
                console.log("✅ Contract verified successfully on Etherscan");
            } catch (error) {
                if (error.message.toLowerCase().includes("already verified")) {
                    console.log("ℹ️ Contract was already verified");
                } else {
                    console.error("❌ Error during verification:", error);
                }
            }
        }

        // Print deployment summary
        console.log("\n📊 Deployment Summary");
        console.log("====================");
        console.log(`Network: ${network.name}`);
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`ENS Registry: ${SEPOLIA_ENS_REGISTRY}`);
        console.log(`Deployer: ${deployer.address}`);
        console.log(`Initial useENSRegistry: false`);
        console.log(`Verification Status: ${process.env.ETHERSCAN_API_KEY ? "Completed" : "Skipped"}`);

        // Print next steps
        console.log("\n📝 Next Steps:");
        console.log("1. Save the contract address: ", contractAddress);
        console.log("2. Update your .env file with the new contract address");
        console.log("3. Wait a few minutes before verifying the contract if verification failed");
        console.log("4. Use the contract by importing the following address:");
        console.log(`   CONTRACT_ADDRESS="${contractAddress}"`);

    } catch (error) {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    }
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });