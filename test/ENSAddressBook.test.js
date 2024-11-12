const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ENSAddressBook", function () {
    let ensAddressBook;
    let mockENS;
    let owner;
    let addr1;
    let addr2;

    // Helper function to compute namehash the same way as the contract
    function computeNameHash(ensName) {
        return ethers.keccak256(ethers.toUtf8Bytes(ensName));
    }

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        
        // Deploy MockENS
        const MockENS = await ethers.getContractFactory("MockENS");
        mockENS = await MockENS.deploy();
        
        // Deploy ENSAddressBook
        const ENSAddressBook = await ethers.getContractFactory("ENSAddressBook");
        ensAddressBook = await ENSAddressBook.deploy(await mockENS.getAddress());
    });

    describe("Deployment", function () {
        it("Should deploy with correct ENS registry address", async function () {
            expect(await ensAddressBook.ensRegistry()).to.equal(await mockENS.getAddress());
        });

        it("Should fail deployment with zero address", async function () {
            const ENSAddressBook = await ethers.getContractFactory("ENSAddressBook");
            await expect(
                ENSAddressBook.deploy(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid ENS registry address");
        });
    });

    describe("Registration", function () {
        it("Should allow ENS owner to register an address", async function () {
            const ensName = "test.eth";
            const nameHash = computeNameHash(ensName);
            
            await mockENS.setOwner(nameHash, addr1.address);
            await ensAddressBook.connect(addr1).registerENS(ensName, addr2.address);
            
            expect(await ensAddressBook.resolveENS(ensName)).to.equal(addr2.address);
            expect(await ensAddressBook.isENSRegistered(ensName)).to.be.true;
        });

        it("Should emit event on registration", async function () {
            const ensName = "test.eth";
            const nameHash = computeNameHash(ensName);
            
            await mockENS.setOwner(nameHash, addr1.address);
            
            await expect(ensAddressBook.connect(addr1).registerENS(ensName, addr2.address))
                .to.emit(ensAddressBook, "ENSMappingAdded")
                .withArgs(nameHash, addr2.address, ensName);
        });

        it("Should fail when non-owner tries to register", async function () {
            const ensName = "test.eth";
            const nameHash = computeNameHash(ensName);
            
            await mockENS.setOwner(nameHash, addr1.address);
            
            await expect(
                ensAddressBook.connect(addr2).registerENS(ensName, addr2.address)
            ).to.be.revertedWith("Not the ENS owner");
        });

        it("Should fail when registering with zero address", async function () {
            const ensName = "test.eth";
            const nameHash = computeNameHash(ensName);
            
            await mockENS.setOwner(nameHash, addr1.address);
            
            await expect(
                ensAddressBook.connect(addr1).registerENS(ensName, ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid EOA address");
        });

        it("Should fail when registering already registered name", async function () {
            const ensName = "test.eth";
            const nameHash = computeNameHash(ensName);
            
            await mockENS.setOwner(nameHash, addr1.address);
            await ensAddressBook.connect(addr1).registerENS(ensName, addr2.address);
            
            await expect(
                ensAddressBook.connect(addr1).registerENS(ensName, addr2.address)
            ).to.be.revertedWith("ENS name already registered");
        });
    });

    describe("Batch Registration", function () {
        it("Should register multiple ENS names", async function () {
            const ensNames = ["test1.eth", "test2.eth"];
            const addresses = [addr1.address, addr2.address];
            
            for (const name of ensNames) {
                await mockENS.setOwner(computeNameHash(name), owner.address);
            }
            
            await ensAddressBook.batchRegisterENS(ensNames, addresses);
            
            const resolvedAddresses = await ensAddressBook.batchResolveENS(ensNames);
            expect(resolvedAddresses).to.deep.equal(addresses);
        });

        it("Should fail with mismatched array lengths", async function () {
            const ensNames = ["test1.eth", "test2.eth"];
            const addresses = [addr1.address];
            
            await expect(
                ensAddressBook.batchRegisterENS(ensNames, addresses)
            ).to.be.revertedWith("Array lengths must match");
        });
    });

    describe("Update and Remove", function () {
        let ensName;
        let nameHash;

        beforeEach(async function () {
            ensName = "test.eth";
            nameHash = computeNameHash(ensName);
            await mockENS.setOwner(nameHash, addr1.address);
            await ensAddressBook.connect(addr1).registerENS(ensName, addr2.address);
        });

        it("Should allow owner to update ENS mapping", async function () {
            await expect(ensAddressBook.connect(addr1).updateENS(ensName, owner.address))
                .to.emit(ensAddressBook, "ENSMappingUpdated")
                .withArgs(nameHash, owner.address, ensName);
                
            expect(await ensAddressBook.resolveENS(ensName)).to.equal(owner.address);
        });

        it("Should allow owner to remove ENS mapping", async function () {
            await expect(ensAddressBook.connect(addr1).removeENS(ensName))
                .to.emit(ensAddressBook, "ENSMappingRemoved")
                .withArgs(nameHash, ensName);
                
            expect(await ensAddressBook.resolveENS(ensName)).to.equal(ethers.ZeroAddress);
        });

        it("Should fail when non-owner tries to update", async function () {
            await expect(
                ensAddressBook.connect(addr2).updateENS(ensName, owner.address)
            ).to.be.revertedWith("Not the ENS owner");
        });

        it("Should fail when updating to zero address", async function () {
            await expect(
                ensAddressBook.connect(addr1).updateENS(ensName, ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid EOA address");
        });

        it("Should fail when removing non-registered ENS", async function () {
            const nonRegisteredName = "nonexistent.eth";
            const nonRegisteredHash = computeNameHash(nonRegisteredName);
            
            // Set the ENS owner first to pass the ownership check
            await mockENS.setOwner(nonRegisteredHash, addr1.address);
            
            await expect(
                ensAddressBook.connect(addr1).removeENS(nonRegisteredName)
            ).to.be.revertedWith("ENS not registered");
        });
    });

    describe("Resolution", function () {
        it("Should resolve registered ENS name", async function () {
            const ensName = "test.eth";
            const nameHash = computeNameHash(ensName);
            
            await mockENS.setOwner(nameHash, addr1.address);
            await ensAddressBook.connect(addr1).registerENS(ensName, addr2.address);
            
            expect(await ensAddressBook.resolveENS(ensName)).to.equal(addr2.address);
        });

        it("Should return zero address for unregistered ENS", async function () {
            expect(await ensAddressBook.resolveENS("unregistered.eth"))
                .to.equal(ethers.ZeroAddress);
        });

        it("Should batch resolve multiple ENS names", async function () {
            const ensNames = ["test1.eth", "test2.eth"];
            const addresses = [addr1.address, addr2.address];
            
            for (const name of ensNames) {
                await mockENS.setOwner(computeNameHash(name), owner.address);
            }
            
            await ensAddressBook.batchRegisterENS(ensNames, addresses);
            
            const resolved = await ensAddressBook.batchResolveENS(ensNames);
            expect(resolved).to.deep.equal(addresses);
        });
    });
});