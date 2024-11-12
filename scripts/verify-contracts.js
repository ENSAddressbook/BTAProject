async function main() {
     const [deployer] = await ethers.getSigners();
    console.log("Verifying with account:", deployer.address);

     const ensAddressBookAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const mockENSAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

     const ensCode = await ethers.provider.getCode(ensAddressBookAddress);
    const mockCode = await ethers.provider.getCode(mockENSAddress);

    console.log("Contract verification:", {
        ensAddressBook: {
            address: ensAddressBookAddress,
            hasCode: ensCode !== '0x'
        },
        mockENS: {
            address: mockENSAddress,
            hasCode: mockCode !== '0x'
        }
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
    