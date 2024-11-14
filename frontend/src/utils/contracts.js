import { ethers } from 'ethers';
import contractsConfig from '../contracts/contracts-config.json';

const ENS_ADDRESS_BOOK = contractsConfig.ensAddressBook.address;
const ENS_ABI = contractsConfig.ensAddressBook.abi;

// Constants for configuration
const CONFIRMATION_BLOCKS = 2;
const GAS_LIMIT_BUFFER = 1.2;
const DEFAULT_GAS_LIMIT = 200000;
const RETRY_ATTEMPTS = 3;
const EVENT_BLOCK_RANGE = 5000;

// Validation helper
const validateENSName = (ensName) => {
    if (!ensName || typeof ensName !== 'string') {
        throw new Error('Invalid ENS name format');
    }
    const normalized = ensName.toLowerCase();
    if (!normalized.endsWith('.eth')) {
        throw new Error('ENS name must end with .eth');
    }
    return normalized;
};

// Get nameHash for ENS
const getNameHash = (ensName) => {
    return ethers.keccak256(ethers.toUtf8Bytes(ensName.toLowerCase()));
};

// Contract initialization
export const getContract = async (withSigner = false) => {
    if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
    }

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        
        if (chainId !== 11155111) {
            throw new Error("Please connect to Sepolia network");
        }

        if (withSigner) {
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            console.log('Connected with address:', address);
            
            return {
                ensAddressBook: new ethers.Contract(ENS_ADDRESS_BOOK, ENS_ABI, signer),
                provider,
                signer,
                address
            };
        }
        
        return {
            ensAddressBook: new ethers.Contract(ENS_ADDRESS_BOOK, ENS_ABI, provider),
            provider
        };
    } catch (error) {
        console.error("Contract initialization error:", error);
        throw new Error(`Failed to initialize contract: ${error.message}`);
    }
};

// Registration check
export const isENSRegistered = async (ensName) => {
    try {
        const normalizedName = validateENSName(ensName);
        const { ensAddressBook } = await getContract();
        return await ensAddressBook.isENSRegistered(normalizedName);
    } catch (error) {
        console.error("Error checking ENS registration:", error);
        throw error;
    }
};

// ENS registration
export const registerENS = async (ensName, eoaAddress) => {
    try {
        const normalizedName = validateENSName(ensName);
        if (!ethers.isAddress(eoaAddress)) {
            throw new Error('Invalid EOA address format');
        }

        const { ensAddressBook, provider, signer, address } = await getContract(true);
        
        if (address.toLowerCase() !== eoaAddress.toLowerCase()) {
            throw new Error("Can only register ENS for your own address");
        }

        const isRegistered = await ensAddressBook.isENSRegistered(normalizedName);
        if (isRegistered) {
            throw new Error(`ENS name ${normalizedName} is already registered`);
        }

        console.log('Starting ENS registration process...');

        const gasEstimate = await ensAddressBook.registerENS.estimateGas(normalizedName, eoaAddress);
        const gasLimit = Math.floor(Number(gasEstimate) * GAS_LIMIT_BUFFER);

        const feeData = await provider.getFeeData();
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('1', 'gwei');

        const tx = await ensAddressBook.registerENS(normalizedName, eoaAddress, {
            gasLimit,
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas,
            nonce: await provider.getTransactionCount(address, 'latest')
        });

        console.log('Transaction sent:', tx.hash);

        const receipt = await provider.waitForTransaction(tx.hash, CONFIRMATION_BLOCKS);
        if (receipt.status === 0) {
            throw new Error('Transaction failed');
        }

        const events = receipt.logs
            .map(log => {
                try {
                    return ensAddressBook.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean);

        const verifyRegistered = await ensAddressBook.isENSRegistered(normalizedName);
        if (!verifyRegistered) {
            throw new Error('Transaction completed but ENS registration failed verification');
        }

        // Get registration details using mappings
        const nameHash = getNameHash(normalizedName);
        const registeredAddress = await ensAddressBook.ensToEOA(nameHash);
        

        // And modify the return to
return {
    transaction: tx,
    receipt,
    success: true,
    events,
    details: {
        ensName: normalizedName,
        eoaAddress: registeredAddress,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        events: events.map(e => e.name)
    }
};

    } catch (error) {
        console.error("Error registering ENS:", error);
        throw error;
    }
};

// ENS resolution
export const resolveENS = async (ensName) => {
    try {
        const normalizedName = validateENSName(ensName);
        const { ensAddressBook } = await getContract();
        const address = await ensAddressBook.resolveENS(normalizedName);
        
        if (address === ethers.ZeroAddress) {
            throw new Error(`ENS name ${normalizedName} not registered`);
        }

        const nameHash = getNameHash(normalizedName);
        
        
        return {
            ensName: normalizedName,
            address
        };
    } catch (error) {
        console.error("Error resolving ENS:", error);
        throw error;
    }
};

// Batch resolution
export const batchResolveENS = async (ensNames, chunkSize = 50) => {
    try {
        if (!Array.isArray(ensNames) || ensNames.length === 0) {
            throw new Error('Invalid input: ensNames must be a non-empty array');
        }

        const normalizedNames = ensNames.map(validateENSName);
        const { ensAddressBook } = await getContract();

        const results = [];
        for (let i = 0; i < normalizedNames.length; i += chunkSize) {
            const chunk = normalizedNames.slice(i, i + chunkSize);
            const addresses = await ensAddressBook.batchResolveENS(chunk);
            results.push(...addresses);
        }

        return normalizedNames.map((name, index) => ({
            ensName: name,
            address: results[index]
        }));
    } catch (error) {
        console.error("Error in batch resolution:", error);
        throw error;
    }
};

// Update ENS
export const updateENS = async (ensName, newEoaAddress) => {
    try {
        const normalizedName = validateENSName(ensName);
        if (!ethers.isAddress(newEoaAddress)) {
            throw new Error('Invalid new EOA address');
        }

        const { ensAddressBook, provider, signer, address } = await getContract(true);

        const currentEOA = await ensAddressBook.resolveENS(normalizedName);
        if (address.toLowerCase() !== currentEOA.toLowerCase()) {
            throw new Error("Must be the current registration owner to update");
        }
        if (address.toLowerCase() !== newEoaAddress.toLowerCase()) {
            throw new Error("Can only update to an address you own");
        }

        const tx = await ensAddressBook.updateENS(normalizedName, newEoaAddress, {
            gasLimit: DEFAULT_GAS_LIMIT
        });
        const receipt = await provider.waitForTransaction(tx.hash, CONFIRMATION_BLOCKS);
        
        return {
            transaction: tx,
            receipt,
            success: true,
            details: {
                ensName: normalizedName,
                newAddress: newEoaAddress,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber
            }
        };
    } catch (error) {
        console.error("Error updating ENS:", error);
        throw error;
    }
};

// Remove ENS
export const removeENS = async (ensName) => {
    try {
        const normalizedName = validateENSName(ensName);
        const { ensAddressBook, provider, signer, address } = await getContract(true);

        const currentEOA = await ensAddressBook.resolveENS(normalizedName);
        if (address.toLowerCase() !== currentEOA.toLowerCase()) {
            throw new Error("Must be the registration owner to remove");
        }

        const tx = await ensAddressBook.removeENS(normalizedName, {
            gasLimit: DEFAULT_GAS_LIMIT
        });
        const receipt = await provider.waitForTransaction(tx.hash, CONFIRMATION_BLOCKS);
        
        return {
            transaction: tx,
            receipt,
            success: true,
            details: {
                ensName: normalizedName,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber
            }
        };
    } catch (error) {
        console.error("Error removing ENS:", error);
        throw error;
    }
};

// Get registration details
export const getRegistrationDetails = async (ensName) => {
    try {
        const normalizedName = validateENSName(ensName);
        const { ensAddressBook } = await getContract();
        
        const nameHash = getNameHash(normalizedName);
        const address = await ensAddressBook.ensToEOA(nameHash);
        
        
        return {
            ensName: normalizedName,
            eoaAddress: address,
          
            registered: address !== ethers.ZeroAddress
        };
    } catch (error) {
        console.error("Error getting registration details:", error);
        throw error;
    }
};

// Get past events
export const getPastEvents = async () => {
    try {
        const { ensAddressBook, provider } = await getContract();
        const currentBlock = await provider.getBlockNumber();
        
        // Get blocks and transactions
        const BLOCKS_PER_PAGE = 25;
        const fromBlock = Math.max(currentBlock - BLOCKS_PER_PAGE, 0);
        
        // Get block details with timestamps
        const blockPromises = [];
        for (let i = currentBlock; i > fromBlock; i--) {
            blockPromises.push(provider.getBlock(i));
        }
        const blocks = await Promise.all(blockPromises);

        // Get events for each block
        const events = await Promise.all(blocks.map(async block => {
            const blockEvents = await Promise.all([
                ensAddressBook.queryFilter(ensAddressBook.filters.ENSMappingAdded(), block.number, block.number),
                ensAddressBook.queryFilter(ensAddressBook.filters.ENSMappingUpdated(), block.number, block.number),
                ensAddressBook.queryFilter(ensAddressBook.filters.ENSMappingRemoved(), block.number, block.number)
            ]);

            const [added, updated, removed] = blockEvents;
            return {
                blockNumber: block.number,
                timestamp: block.timestamp,
                events: [...added, ...updated, ...removed].map(event => ({
                    eventName: event.eventFragment.name,
                    ensName: event.args[2],
                    eoaAddress: event.args[1],
                    transactionHash: event.transactionHash,
                    gasUsed: event.gasUsed || 0,
                    timestamp: block.timestamp
                }))
            };
        }));

        return {
            fromBlock,
            toBlock: currentBlock,
            events: events.filter(block => block.events.length > 0)
        };

    } catch (error) {
        console.error("Error fetching events:", error);
        throw error;
    }
};