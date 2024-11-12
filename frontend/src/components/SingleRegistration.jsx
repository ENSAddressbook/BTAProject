import { useState } from 'react';
import PropTypes from 'prop-types';
import { ethers } from 'ethers';
import { registerENS, isENSRegistered } from '../utils/contracts';
import contractConfig from '../contracts/contracts-config.json';

function SingleRegistration({ isConnected = false, account = '' }) {
    const [ensName, setEnsName] = useState('');
    const [eoaAddress, setEoaAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isConnected) {
            setError('Please connect your wallet first');
            return;
        }
        
        if (!account) {
            setError('No account connected');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            // Check if ENS is already registered
            const registered = await isENSRegistered(ensName);
            if (registered) {
                setError('This ENS name is already registered');
                return;
            }

            // Get provider and signer
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            // Get MockENS contract
            const mockENS = new ethers.Contract(
                contractConfig.mockENS.address,
                contractConfig.mockENS.abi,
                signer
            );

            // Set ownership first
            const nameHash = ethers.keccak256(ethers.toUtf8Bytes(ensName));
            console.log('Setting ownership for:', ensName);
            console.log('NameHash:', nameHash);
            console.log('Account:', account);
            
            // Send ownership transaction and wait for confirmation
            const ownerTx = await mockENS.setOwner(nameHash, account);
            console.log('Ownership transaction sent:', ownerTx.hash);
            const ownerReceipt = await provider.waitForTransaction(ownerTx.hash);
            console.log('Ownership set successfully:', ownerReceipt);

            // Then register
            try {
                const tx = await registerENS(ensName, eoaAddress);
                console.log('Registration transaction sent:', tx.hash);
                const receipt = await provider.waitForTransaction(tx.hash);
                console.log('Registration successful:', receipt);
                
                setSuccess('ENS successfully registered!');
                setEnsName('');
                setEoaAddress('');
            } catch (error) {
                console.error('Registration transaction failed:', error);
                throw error;
            }

        } catch (error) {
            console.error('Registration error:', error);
            setError(error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Early return if not connected
    if (!isConnected) {
        return (
            <div className="max-w-md mx-auto text-center">
                <p className="text-gray-600">Please connect your wallet to register ENS names.</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Register ENS Name</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ENS Name
                    </label>
                    <input
                        type="text"
                        value={ensName}
                        onChange={(e) => setEnsName(e.target.value)}
                        placeholder="example.eth"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        EOA Address
                    </label>
                    <input
                        type="text"
                        value={eoaAddress}
                        onChange={(e) => setEoaAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {loading ? 'Registering...' : 'Register ENS'}
                </button>
            </form>

            {error && (
                <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-md">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mt-4 p-4 text-sm text-green-700 bg-green-100 rounded-md">
                    {success}
                </div>
            )}

            {/* Debug Information */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md text-xs">
                    <p>Connected Account: {account}</p>
                    <p>MockENS Address: {contractConfig.mockENS.address}</p>
                    <p>ENSBook Address: {contractConfig.ensAddressBook.address}</p>
                </div>
            )}
        </div>
    );
}

SingleRegistration.propTypes = {
    isConnected: PropTypes.bool.isRequired,
    account: PropTypes.string.isRequired
};

export default SingleRegistration;