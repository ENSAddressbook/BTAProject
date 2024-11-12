import { useState } from 'react';
import { batchResolveENS } from '../utils/contracts';

function BatchResolver() {
    const [ensNames, setEnsNames] = useState(['']);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addNameField = () => {
        setEnsNames([...ensNames, '']);
    };

    const removeNameField = (index) => {
        const newNames = ensNames.filter((_, i) => i !== index);
        setEnsNames(newNames);
    };

    const updateName = (index, value) => {
        const newNames = ensNames.map((name, i) => {
            if (i === index) return value;
            return name;
        });
        setEnsNames(newNames);
    };

    const handleResolve = async (e) => {
        e.preventDefault();

        // Filter out empty names
        const namesToResolve = ensNames.filter(name => name.trim());
        
        if (namesToResolve.length === 0) {
            setError('Please enter at least one ENS name');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setResults([]);

            const addresses = await batchResolveENS(namesToResolve);
            
            // Combine names and addresses for display
            const resolutionResults = namesToResolve.map((name, index) => ({
                name,
                address: addresses[index]
            }));
            
            setResults(resolutionResults);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Batch Resolve ENS Names</h2>
            
            <form onSubmit={handleResolve} className="space-y-4">
                {ensNames.map((name, index) => (
                    <div key={index} className="flex gap-2">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => updateName(index, e.target.value)}
                            placeholder="ENS Name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                            disabled={loading}
                        />
                        {ensNames.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeNameField(index)}
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
                        onClick={addNameField}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                        + Add More
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex-1 py-2 px-4 rounded-md text-white 
                            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'Resolving...' : 'Resolve All'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="mt-4 p-4 text-sm text-red-700 bg-red-100 rounded-md">
                    {error}
                </div>
            )}
            
            {results.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Resolution Results</h3>
                    <div className="space-y-2">
                        {results.map((result, index) => (
                            <div key={index} className="p-4 bg-gray-100 rounded-md">
                                <p className="text-sm font-medium text-gray-700">
                                    {result.name}
                                </p>
                                <p className="mt-1 text-sm text-gray-900 break-all">
                                    {result.address === '0x0000000000000000000000000000000000000000' 
                                        ? 'Not registered' 
                                        : result.address}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default BatchResolver;