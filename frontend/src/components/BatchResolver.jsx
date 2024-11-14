import { useState, useEffect } from 'react';
import { batchResolveENS } from '../utils/contracts';
import { ethers } from 'ethers';

function BatchResolver({ isConnected, account }) {
    const [ensNames, setEnsNames] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState([]);

    const validateENSName = (name) => {
        if (!name.endsWith('.eth')) return 'Must end with .eth';
        const nameWithoutEth = name.slice(0, -4);
        if (nameWithoutEth.length < 3) return 'Must be at least 3 characters long (excluding .eth)';
        const validNameRegex = /^[a-z0-9-]+\.eth$/;
        if (!validNameRegex.test(name)) return 'Can only contain lowercase letters, numbers, and hyphens';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');
            setResults([]);

            // Split and clean names
            const nameArray = ensNames
                .split('\n')
                .map(name => name.trim().toLowerCase())
                .filter(name => name.length > 0);

            if (nameArray.length === 0) {
                setError('Please enter at least one ENS name');
                return;
            }

            if (nameArray.length > 50) {
                setError('Maximum 50 names allowed at once');
                return;
            }

            // Validate all names
            const invalidNames = nameArray
                .map(name => ({ name, error: validateENSName(name) }))
                .filter(result => result.error);

            if (invalidNames.length > 0) {
                setError(`Invalid names found:\n${invalidNames.map(item => `${item.name}: ${item.error}`).join('\n')}`);
                return;
            }

            // Resolve addresses
            const resolvedAddresses = await batchResolveENS(nameArray);

            // Format results
            const formattedResults = nameArray.map((name, index) => {
                const address = resolvedAddresses[index].address;
                return {
                    name,
                    address,
                    isRegistered: address !== ethers.ZeroAddress,
                };
            });

            setResults(formattedResults);

        } catch (error) {
            console.error('Resolution error:', error);
            setError(error.message || 'Resolution failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="w-full max-w-2xl mx-auto p-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
                    <p className="text-yellow-700">Please connect your wallet to use batch resolution.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6 text-gray-800">Batch ENS Resolver</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ENS Names (one per line)
                        </label>
                        <textarea
                            value={ensNames}
                            onChange={(e) => setEnsNames(e.target.value)}
                            placeholder="name1.eth&#10;name2.eth&#10;name3.eth"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                            disabled={loading}
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Maximum 50 names per batch. Names must end with .eth
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
                                Resolving...
                            </span>
                        ) : (
                            'Resolve ENS Names'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm whitespace-pre-line">
                        {error}
                    </div>
                )}

                {results.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3">Results</h3>
                        <div className="bg-gray-50 rounded-md p-4">
                            <div className="space-y-4">
                                {results.map((result, index) => (
                                    <div 
                                        key={index}
                                        className={`p-3 rounded-lg ${
                                            result.isRegistered 
                                                ? 'bg-green-50 border border-green-100' 
                                                : 'bg-yellow-50 border border-yellow-100'
                                        }`}
                                    >
                                        <div className="flex flex-col space-y-2">
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium text-gray-900">
                                                    {result.name}
                                                </span>
                                                <span className={`text-sm px-2 py-1 rounded ${
                                                    result.isRegistered 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {result.isRegistered ? 'Registered' : 'Available'}
                                                </span>
                                            </div>

                                            {result.isRegistered && (
                                                <div className="text-sm">
                                                    <span className="text-gray-500">Registered To: </span>
                                                    <a
                                                        href={`https://sepolia.etherscan.io/address/${result.address}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-mono text-blue-600 hover:text-blue-800"
                                                    >
                                                        {result.address}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 text-sm text-gray-500">
                            Total Names: {results.length} | 
                            Registered: {results.filter(r => r.isRegistered).length} | 
                            Available: {results.filter(r => !r.isRegistered).length}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BatchResolver;