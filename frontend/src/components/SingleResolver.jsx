import  { useState } from 'react';
import { resolveENS } from '../utils/contracts';

function SingleResolver() {
    const [ensName, setEnsName] = useState('');
    const [resolvedAddress, setResolvedAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleResolve = async (e) => {
        e.preventDefault();
        if (!ensName) {
            setError('Please enter an ENS name');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setResolvedAddress('');

            const address = await resolveENS(ensName);
            setResolvedAddress(address);
            
            if (address === '0x0000000000000000000000000000000000000000') {
                setError('ENS name not found');
            }

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Resolve ENS Name</h2>
            
            <form onSubmit={handleResolve} className="space-y-4">
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
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {loading ? 'Resolving...' : 'Resolve'}
                </button>
            </form>

            {error && (
                <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-md">
                    {error}
                </div>
            )}
            
            {resolvedAddress && !error && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                    <p className="text-sm font-medium text-gray-700">Resolved Address:</p>
                    <p className="mt-1 text-sm text-gray-900 break-all">{resolvedAddress}</p>
                </div>
            )}
        </div>
    );
}

export default SingleResolver;