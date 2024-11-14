const { expect } = require("chai");
const { ethers } = require("hardhat");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"; // Manually define the zero address

describe("ENSAddressBook with useENSRegistry set to false", function () {
    let ensAddressBook;
    let owner, user1, user2;
    const ensName1 = "example.eth";
    const ensName2 = "mydomain.eth";

    before(async function () {
        // Get signers
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy the contract with `useENSRegistry` set to false
        const ENSAddressBook = await ethers.getContractFactory("ENSAddressBook");
        const ensRegistryAddress = ZERO_ADDRESS; // Use the manually defined ZERO_ADDRESS
        ensAddressBook = await ENSAddressBook.deploy(ensRegistryAddress, false);
        await ensAddressBook.deployed();
    });

    it("should have useENSRegistry set to false", async function () {
        const useRegistry = await ensAddressBook.requiresENSVerification();
        expect(useRegistry).to.be.false;
    });

    it("should register ENS name without ENS registry check", async function () {
        // Register an ENS name with the owner's address
        await expect(ensAddressBook.connect(owner).registerENS(ensName1, owner.address))
            .to.emit(ensAddressBook, "ENSMappingAdded")
            .withArgs(
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ensName1)),
                owner.address,
                ensName1,
                await ethers.provider.getBlock("latest").then(block => block.timestamp)
            );

        // Confirm the registration
        const resolvedAddress = await ensAddressBook.resolveENS(ensName1);
        expect(resolvedAddress).to.equal(owner.address);
    });

    it("should update the ENS mapping", async function () {
        await expect(ensAddressBook.connect(owner).updateENS(ensName1, user1.address))
            .to.emit(ensAddressBook, "ENSMappingUpdated")
            .withArgs(
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ensName1)),
                user1.address,
                owner.address,
                ensName1
            );

        const updatedAddress = await ensAddressBook.resolveENS(ensName1);
        expect(updatedAddress).to.equal(user1.address);
    });

    it("should remove the ENS mapping", async function () {
        await expect(ensAddressBook.connect(owner).removeENS(ensName1))
            .to.emit(ensAddressBook, "ENSMappingRemoved")
            .withArgs(
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ensName1)),
                user1.address,
                ensName1
            );

        const removedAddress = await ensAddressBook.resolveENS(ensName1);
        expect(removedAddress).to.equal(ZERO_ADDRESS);
    });

    it("should register a second ENS name without checking the registry", async function () {
        await expect(ensAddressBook.connect(user2).registerENS(ensName2, user2.address))
            .to.emit(ensAddressBook, "ENSMappingAdded")
            .withArgs(
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ensName2)),
                user2.address,
                ensName2,
                await ethers.provider.getBlock("latest").then(block => block.timestamp)
            );

        const resolvedAddress = await ensAddressBook.resolveENS(ensName2);
        expect(resolvedAddress).to.equal(user2.address);
    });

    it("should fail if trying to register an already registered name", async function () {
        await expect(
            ensAddressBook.connect(user2).registerENS(ensName2, user2.address)
        ).to.be.revertedWith("ENSAlreadyRegistered");
    });

    it("should only allow the owner to toggle the ENS registry check", async function () {
        await expect(ensAddressBook.connect(user1).setUseENSRegistry(true)).to.be.revertedWith("Ownable: caller is not the owner");
        
        await ensAddressBook.connect(owner).setUseENSRegistry(true);
        expect(await ensAddressBook.requiresENSVerification()).to.be.true;
    });

    it("should return the ENS owner address as zero if registry is not enabled", async function () {
        const ensOwner = await ensAddressBook.getENSOwner(ensName1);
        expect(ensOwner).to.equal(ZERO_ADDRESS);
    });

    it("should return the ENS owner address if registry is enabled", async function () {
        // Set the registry check back to true
        await ensAddressBook.setUseENSRegistry(true);

        // Simulate a fake ENS owner address for testing
        const fakeENSAddress = "0x0000000000000000000000000000000000000001";
        const ensRegistryMock = await ethers.getContractFactory("ENSRegistryMock"); // Assume you have a mock contract for ENS
        const ensRegistryAddress = await ensRegistryMock.deploy();
        
        await ensAddressBook.setUseENSRegistry(true);
        const ensOwnerWithRegistry = await ensAddressBook.getENSOwner(ensName1);
        expect(ensOwnerWithRegistry).to.equal(fakeENSAddress); // Replace this with the actual logic for ENS owner retrieval
    });
});
