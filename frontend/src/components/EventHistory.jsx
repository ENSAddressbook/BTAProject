import { useState, useEffect } from 'react';
import { getPastEvents } from '../utils/contracts';

const EventHistory = ({ isConnected }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    const fetchEvents = async () => {
        if (!isConnected) return;
        
        try {
            setLoading(true);
            setError('');
            const fetchedEvents = await getPastEvents();
            // Ensure we're setting an array
            setEvents(Array.isArray(fetchedEvents) ? fetchedEvents : []);
        } catch (error) {
            console.error('Error fetching events:', error);
            setError('Failed to fetch events. Please try again.');
            setEvents([]); // Reset to empty array on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected) {
            fetchEvents();
        } else {
            setEvents([]); // Reset when disconnected
        }
    }, [isConnected]);

    const getEventColor = (eventName) => {
        if (!eventName) return 'bg-gray-100 text-gray-800 border-gray-200';
        switch (eventName) {
            case 'ENSMappingAdded':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'ENSMappingUpdated':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ENSMappingRemoved':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleString();
    };

    // Safe filter function
    const filteredEvents = Array.isArray(events) ? events.filter(event => {
        if (!event || !event.eventName) return false;
        if (filter === 'all') return true;
        return event.eventName.toLowerCase().includes(filter.toLowerCase());
    }) : [];

    if (!isConnected) {
        return (
            <div className="w-full max-w-6xl mx-auto p-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
                    <p className="text-yellow-700">Please connect your wallet to view events.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Event History</h2>
                    <div className="flex gap-4">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md"
                        >
                            <option value="all">All Events</option>
                            <option value="added">Registrations</option>
                            <option value="updated">Updates</option>
                            <option value="removed">Removals</option>
                        </select>
                        <button
                            onClick={fetchEvents}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading events...</p>
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ENS Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredEvents.map((event, index) => (
                                    <tr key={`${event.transactionHash}-${index}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className={`inline-flex px-2 py-1 rounded ${getEventColor(event.eventName)}`}>
                                                {event.eventName?.replace('ENSMapping', '')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {event.blockNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {formatTime(event.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {event.ensName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {event.eoaAddress && 
                                                <span>Address: {event.eoaAddress.slice(0, 6)}...{event.eoaAddress.slice(-4)}</span>
                                            }
                                            {event.newAddress && 
                                                <span>New: {event.newAddress.slice(0, 6)}...{event.newAddress.slice(-4)}</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <a
                                                href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                View ↗
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-600">
                        No events found
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventHistory;