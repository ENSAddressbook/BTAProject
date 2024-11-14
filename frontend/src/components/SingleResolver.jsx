import { useState, useEffect } from 'react';
import { resolveENS, getRegistrationDetails } from '../utils/contracts';

function SingleResolver() {
    const [ensName, setEnsName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');

    const validateENSName = (name) => {
        if (!name) {
            throw new Error('Please enter an ENS name');
        }
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
        try {
            setLoading(true);
            setError('');
            setResult(null);

            // Validate ENS name format
            validateENSName(ensName);

            // Get address and registration details
            const [address, details] = await Promise.all([
                resolveENS(ensName),
                getRegistrationDetails(ensName).catch(() => null)
            ]);

            if (address === '0x0000000000000000000000000000000000000000') {
                setResult({
                    name: ensName,
                    status: 'not_registered',
                    message: 'This name is not registered'
                });
                return;
            }

            setResult({
                name: ensName,
                status: 'registered',
                address: address,
                registrationTime: details ? new Date(Number(details.timestamp) * 1000) : null,
                details
            });

        } catch (error) {
            console.error('Resolution error:', error);
            if (error.message.includes('resolver')) {
                setError('Invalid ENS name format');
            } else {
                setError(error.message || 'Resolution failed');
            }
        } finally {
            setLoading(false);
        }
    };

    // Check if MetaMask or any Ethereum wallet is connected
    const checkWalletConnection = async () => {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                setWalletAddress(accounts[0]);
                setIsConnected(true);
            } else {
                setIsConnected(false);
            }
        } else {
            setError('Ethereum wallet is not detected');
        }
    };

    useEffect(() => {
        checkWalletConnection();
    }, []);

    const renderResult = () => {
        if (!result) return null;


        
        return (
            <div className="mt-6">
                <div className={`rounded-md p-4 ${result.status === 'registered' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <div className="space-y-3">
                        <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-gray-500">ENS Name</span>
                            <span className="text-gray-900">{result.name}</span>
                        </div>

                        <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-gray-500">Status</span>
                            <span className={`font-medium ${result.status === 'registered' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {result.status === 'registered' ? 'Registered' : 'Not Registered'}
                            </span>
                        </div>

                        {result.status === 'registered' && (
                            <>
                                <div className="flex flex-col space-y-1">
                                    <span className="text-sm font-medium text-gray-500">Registered To</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-mono text-gray-900">{result.address}</span>
                                        <a
                                            href={`https://sepolia.etherscan.io/address/${result.address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            ↗
                                        </a>
                                    </div>
                                </div>

                                {result.registrationTime && (
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-sm font-medium text-gray-500">Registration Time</span>
                                        <span className="text-gray-900">
                                            {result.registrationTime.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        {result.status === 'not_registered' && (
                            <div className="mt-2 text-sm text-gray-600">
                                This name is available for registration.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-md mx-auto p-4">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6 text-gray-800">Resolve ENS Name</h2>

                {/* Display wallet connection status */}
                <div className="mb-6">
                    {isConnected ? (
                        <div className="text-green-600">
                            Wallet Connected: {walletAddress}
                        </div>
                    ) : (
                        <div className="text-red-600">Wallet Not Connected</div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ENS Name
                        </label>
                        <input
                            type="text"
                            value={ensName}
                            onChange={(e) => setEnsName(e.target.value.toLowerCase())}
                            placeholder="name.eth"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading || !isConnected}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !isConnected}
                        className={`w-full ${loading || !isConnected ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Resolving...
                            </span>
                        ) : (
                            'Resolve ENS'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {renderResult()}
            </div>
        </div>
    );
}

export default SingleResolver;
