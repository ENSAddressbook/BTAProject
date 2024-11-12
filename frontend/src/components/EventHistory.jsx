import { useState, useEffect } from 'react';
import { getPastEvents } from '../utils/contracts';

function EventHistory() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const pastEvents = await getPastEvents();
            setEvents(pastEvents);
        } catch (error) {
            setError('Error loading events: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (blockNumber) => {
        // You might want to convert block number to timestamp
        // For now, just showing block number
        return `Block #${blockNumber}`;
    };

    const formatEventType = (eventName) => {
        switch(eventName) {
            case 'ENSMappingAdded':
                return 'Registration';
            case 'ENSMappingUpdated':
                return 'Update';
            case 'ENSMappingRemoved':
                return 'Removal';
            default:
                return eventName;
        }
    };

    const renderEventDetails = (event) => {
        const eventName = event.eventName || event.event;
        switch(eventName) {
            case 'ENSMappingAdded':
                return (
                    <>
                        <p className="text-sm text-gray-600">
                            Registered <span className="font-medium">{event.args.ensName}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                            to address: {event.args.eoaAddress}
                        </p>
                    </>
                );
            case 'ENSMappingUpdated':
                return (
                    <>
                        <p className="text-sm text-gray-600">
                            Updated <span className="font-medium">{event.args.ensName}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                            new address: {event.args.newEoaAddress}
                        </p>
                    </>
                );
            case 'ENSMappingRemoved':
                return (
                    <p className="text-sm text-gray-600">
                        Removed <span className="font-medium">{event.args.ensName}</span>
                    </p>
                );
            default:
                return null;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Event History</h2>
                <button
                    onClick={loadEvents}
                    disabled={loading}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4">
                    <p className="text-gray-500">Loading events...</p>
                </div>
            ) : error ? (
                <div className="p-4 text-sm text-red-700 bg-red-100 rounded-md">
                    {error}
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-gray-500">No events found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map((event, index) => (
                        <div
                            key={`${event.transactionHash}-${index}`}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-1 text-xs rounded ${
                                    event.event === 'ENSMappingAdded' ? 'bg-green-100 text-green-800' :
                                    event.event === 'ENSMappingUpdated' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {formatEventType(event.event)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {formatTimestamp(event.blockNumber)}
                                </span>
                            </div>
                            {renderEventDetails(event)}
                            <div className="mt-2">
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    View on Etherscan ↗
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default EventHistory;