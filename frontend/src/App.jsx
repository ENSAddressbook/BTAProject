import { useState, useEffect } from 'react';
import { getContract } from './utils/contracts';
import SingleRegistration from './components/SingleRegistration';
import BatchRegistration from './components/BatchRegistration';
import SingleResolver from './components/SingleResolver';
import BatchResolver from './components/BatchResolver';
import EventHistory from './components/EventHistory';

function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountChange);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
      };
    }
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Connection error:", error);
      }
    }
  };

  const handleAccountChange = (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setIsConnected(true);
    } else {
      setAccount('');
      setIsConnected(false);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsConnected(true);
        setSuccess('Wallet connected successfully!');
      } catch (error) {
        setError(error.message);
      }
    } else {
      setError('Please install MetaMask!');
    }
  };

  const tabs = [
    { id: 'register', name: 'Single Register' },
    { id: 'batch-register', name: 'Batch Register' },
    { id: 'resolve', name: 'Single Resolve' },
    { id: 'batch-resolve', name: 'Batch Resolve' },
    { id: 'history', name: 'History' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">ENS Address Book</h1>

          {/* Wallet Connection */}
          <div className="mb-8 text-center">
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="text-sm text-gray-600">
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow p-6">
            {activeTab === 'register' && (
              <SingleRegistration isConnected={isConnected} account={account} />
            )}
            {activeTab === 'batch-register' && (
              <BatchRegistration isConnected={isConnected} account={account} />
            )}
            {activeTab === 'resolve' && (
              <SingleResolver />
            )}
            {activeTab === 'batch-resolve' && (
              <BatchResolver />
            )}
            {activeTab === 'history' && (
              <EventHistory />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;