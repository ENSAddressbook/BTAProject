import { useState } from 'react';
import { batchRegisterENS } from '../utils/contracts';

function BatchRegistration({ isConnected, account }) {
    const [entries, setEntries] = useState([{ ensName: '', eoaAddress: '' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const addEntry = () => {
        setEntries([...entries, { ensName: '', eoaAddress: '' }]);
    };

    const removeEntry = (index) => {
        const newEntries = entries.filter((_, i) => i !== index);
        setEntries(newEntries);
    };

    const updateEntry = (index, field, value) => {
        const newEntries = entries.map((entry, i) => {
            if (i === index) {
                return { ...entry, [field]: value };
            }
            return entry;
        });
        setEntries(newEntries);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isConnected) {
            setError('Please connect your wallet first');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const ensNames = entries.map(entry => entry.ensName);
            const eoaAddresses = entries.map(entry => entry.eoaAddress);

            // Validate entries
            if (ensNames.some(name => !name) || eoaAddresses.some(addr => !addr)) {
                setError('Please fill in all fields');
                return;
            }

            // Register batch
            await batchRegisterENS(ensNames, eoaAddresses);
            setSuccess('Batch registration successful!');
            setEntries([{ ensName: '', eoaAddress: '' }]); // Reset form after success

        } catch (error) {
            setError('Error: ' + error.message); // More detailed error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Batch Register ENS Names</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {entries.map((entry, index) => (
                    <div key={index} className="flex gap-4 items-start">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={entry.ensName}
                                onChange={(e) => updateEntry(index, 'ensName', e.target.value)}
                                placeholder="ENS Name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                disabled={loading || !isConnected}
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={entry.eoaAddress}
                                onChange={(e) => updateEntry(index, 'eoaAddress', e.target.value)}
                                placeholder="EOA Address"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                disabled={loading || !isConnected}
                            />
                        </div>
                        {entries.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeEntry(index)}
                                className="px-3 py-2 text-red-600 hover:text-red-800"
                                disabled={loading}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))}

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={addEntry}
                        disabled={loading || !isConnected}
                        className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                        + Add More
                    </button>

                    <button
                        type="submit"
                        disabled={loading || !isConnected}
                        className={`flex-1 py-2 px-4 rounded-md text-white 
                            ${loading || !isConnected 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'Processing...' : 'Register All'}
                    </button>
                </div>
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
        </div>
    );
}

export default BatchRegistration;
