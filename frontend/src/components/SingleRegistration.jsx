import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
    registerENS, 
    isENSRegistered, 
    getRegistrationDetails 
} from '../utils/contracts';
import { ethers } from 'ethers';

function SingleRegistration({ isConnected = false, account = '' }) {
    const [ensName, setEnsName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const [registrationStatus, setRegistrationStatus] = useState('idle'); 

    useEffect(() => {
        if (ensName) {
            setError('');
            setSuccess('');
            setTransactionHash('');
            setRegistrationStatus('idle');
        }
    }, [ensName]);

    const validateENSName = (name) => {
        if (!name.endsWith('.eth')) {
            throw new Error('ENS name must end with .eth');
        }

        const nameWithoutEth = name.slice(0, -4);
        if (nameWithoutEth.length < 3) {
            throw new Error('ENS name must be at least 3 characters long (excluding .eth)');
        }

        const validNameRegex = /^[a-z0-9-]+\.eth$/;
        if (!validNameRegex.test(name)) {
            throw new Error('ENS name can only contain lowercase letters, numbers, and hyphens');
        }
    };

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
            setTransactionHash('');
            setRegistrationStatus('checking');

            
            validateENSName(ensName);

            
            console.log('Checking if ENS is registered:', ensName);
            const registered = await isENSRegistered(ensName);
            
            if (registered) {
                const details = await getRegistrationDetails(ensName);
                if (details.eoaAddress.toLowerCase() === account.toLowerCase()) {
                    setError('You already own this ENS name');
                } else {
                    setError('This ENS name is already registered to another address');
                }
                setRegistrationStatus('failed');
                return;
            }

            
            setRegistrationStatus('registering');
            console.log('Starting registration process...');
            
            const result = await registerENS(ensName, account);
            console.log('Registration result:', result);

            setTransactionHash(result.transaction.hash);
            setRegistrationStatus('confirmed');
            
            setSuccess(`ENS name ${ensName} successfully registered!`);
            setEnsName('');

            

        } catch (error) {
            console.error('Registration error:', error);
            setRegistrationStatus('failed');
            
            // Handle specific error cases
            if (error.code === 'ACTION_REJECTED') {
                setError('Transaction was rejected in wallet');
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                setError('Insufficient funds to complete the transaction');
            } else if (error.message.includes('gas')) {
                setError('Transaction failed: Gas estimation failed. The transaction might fail.');
            } else {
                setError(error.message || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusMessage = () => {
        switch (registrationStatus) {
            case 'checking':
                return 'Checking name availability...';
            case 'registering':
                return 'Registering ENS name...';
            case 'confirmed':
                return 'Registration confirmed!';
            case 'failed':
                return 'Registration failed';
            default:
                return '';
        }
    };

    if (!isConnected) {
        return (
            <div className="w-full max-w-md mx-auto p-4 text-center">
                <p className="text-gray-600">Please connect your wallet to register ENS names.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-4">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6 text-gray-800">Register ENS Name</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ENS Name
                        </label>
                        <input
                            type="text"
                            value={ensName}
                            onChange={(e) => setEnsName(e.target.value.toLowerCase())}
                            placeholder="yourname.eth"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            This will be registered to your current address:{' '}
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full ${
                            loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        } text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {getStatusMessage()}
                            </span>
                        ) : (
                            'Register ENS'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
                        <p>{success}</p>
                        {transactionHash && (
                            <p className="mt-2">
                                Transaction Hash:{' '}
                                <a 
                                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 break-all"
                                >
                                    {transactionHash}
                                </a>
                            </p>
                        )}
                    </div>
                )}

                {registrationStatus !== 'idle' && registrationStatus !== 'failed' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm">
                        <p>{getStatusMessage()}</p>
                        {transactionHash && (
                            <p className="mt-2">
                                View transaction on{' '}
                                <a 
                                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    Etherscan
                                </a>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

SingleRegistration.propTypes = {
    isConnected: PropTypes.bool.isRequired,
    account: PropTypes.string.isRequired
};

export default SingleRegistration;