import { ethers } from 'ethers';
import contractsConfig from '../contracts/contracts-config.json';

import ENSAddressBookArtifact from '../contracts/ENSAddressBook.json';
const ENSAddressBookABI = ENSAddressBookArtifact.abi;
const CONTRACT_ADDRESS = contractsConfig.ensAddressBook.address;
const MOCK_ENS_ADDRESS = contractsConfig.mockENS.address;
const MOCK_ENS_ABI = contractsConfig.mockENS.abi;

export const getContract = async (withSigner = false) => {
    if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
    }

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    if (withSigner) {
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ENSAddressBookABI, signer);
        const mockENS = new ethers.Contract(MOCK_ENS_ADDRESS, MOCK_ENS_ABI, signer);
        return { contract, mockENS, provider, signer };
    }
    
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ENSAddressBookABI, provider);
    const mockENS = new ethers.Contract(MOCK_ENS_ADDRESS, MOCK_ENS_ABI, provider);
    return { contract, mockENS, provider };
};

// Single ENS Registration with ownership check
export const registerENS = async (ensName, eoaAddress) => {
    try {
        const { contract, mockENS, provider, signer } = await getContract(true);
        const account = await signer.getAddress();

        // First set ownership in MockENS
        const nameHash = ethers.keccak256(ethers.toUtf8Bytes(ensName));
        console.log('Setting ownership for:', ensName);
        const ownerTx = await mockENS.setOwner(nameHash, account);
        await provider.waitForTransaction(ownerTx.hash);
        console.log('Ownership set successfully');

        // Then register
        const tx = await contract.registerENS(ensName, eoaAddress);
        console.log('Registration transaction hash:', tx.hash);
        const receipt = await provider.waitForTransaction(tx.hash);
        
        return {
            transaction: tx,
            receipt: receipt,
            success: true
        };
    } catch (error) {
        console.error("Error registering ENS:", error);
        throw error;
    }
};

// Batch ENS Registration
export const batchRegisterENS = async (ensNames, eoaAddresses) => {
    try {
        const { contract, mockENS, provider, signer } = await getContract(true);
        const account = await signer.getAddress();

        // First set ownership for all names
        for (const ensName of ensNames) {
            const nameHash = ethers.keccak256(ethers.toUtf8Bytes(ensName));
            const ownerTx = await mockENS.setOwner(nameHash, account);
            await provider.waitForTransaction(ownerTx.hash);
        }

        const tx = await contract.batchRegisterENS(ensNames, eoaAddresses);
        const receipt = await provider.waitForTransaction(tx.hash);
        
        return {
            transaction: tx,
            receipt: receipt,
            success: true
        };
    } catch (error) {
        console.error("Error in batch registration:", error);
        throw error;
    }
};

// Single ENS Resolution
export const resolveENS = async (ensName) => {
    const { contract } = await getContract();
    try {
        return await contract.resolveENS(ensName);
    } catch (error) {
        console.error("Error resolving ENS:", error);
        throw error;
    }
};

// Batch ENS Resolution
export const batchResolveENS = async (ensNames) => {
    const { contract } = await getContract();
    try {
        return await contract.batchResolveENS(ensNames);
    } catch (error) {
        console.error("Error in batch resolution:", error);
        throw error;
    }
};

// Update ENS mapping
export const updateENS = async (ensName, newEoaAddress) => {
    try {
        const { contract, provider } = await getContract(true);
        const tx = await contract.updateENS(ensName, newEoaAddress);
        const receipt = await provider.waitForTransaction(tx.hash);
        
        return {
            transaction: tx,
            receipt: receipt,
            success: true
        };
    } catch (error) {
        console.error("Error updating ENS:", error);
        throw error;
    }
};

// Remove ENS mapping
export const removeENS = async (ensName) => {
    try {
        const { contract, provider } = await getContract(true);
        const tx = await contract.removeENS(ensName);
        const receipt = await provider.waitForTransaction(tx.hash);
        
        return {
            transaction: tx,
            receipt: receipt,
            success: true
        };
    } catch (error) {
        console.error("Error removing ENS:", error);
        throw error;
    }
};

// Check if ENS is registered
export const isENSRegistered = async (ensName) => {
    const { contract } = await getContract();
    try {
        return await contract.isENSRegistered(ensName);
    } catch (error) {
        console.error("Error checking ENS registration:", error);
        throw error;
    }
};

// Get past events for history
export const getPastEvents = async () => {
    try {
        const { contract, provider } = await getContract();
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000);
        
        const addedFilter = contract.filters.ENSMappingAdded();
        const updatedFilter = contract.filters.ENSMappingUpdated();
        const removedFilter = contract.filters.ENSMappingRemoved();
        
        const [added, updated, removed] = await Promise.all([
            contract.queryFilter(addedFilter, fromBlock),
            contract.queryFilter(updatedFilter, fromBlock),
            contract.queryFilter(removedFilter, fromBlock)
        ]);
        
        return [...added, ...updated, ...removed].sort((a, b) => b.blockNumber - a.blockNumber);
    } catch (error) {
        console.error("Error fetching history:", error);
        throw error;
    }
};