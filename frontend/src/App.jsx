import { useState, useEffect } from 'react';
import { getContract, isENSRegistered, registerENS, resolveENS, batchResolveENS, getPastEvents } from './utils/contracts';
import SingleRegistration from './components/SingleRegistration';
import SingleResolver from './components/SingleResolver';
import BatchResolver from './components/BatchResolver';
import EventHistory from './components/EventHistory';
import { ethers } from 'ethers';

function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Clear messages after timeout
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Initialize and set up event listeners
  useEffect(() => {
    checkConnection();
    checkNetwork();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountChange);
      window.ethereum.on('chainChanged', handleChainChange);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
        window.ethereum.removeListener('chainChanged', handleChainChange);
      };
    }
  }, []);

  const checkNetwork = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setIsCorrectNetwork(chainId === '0xaa36a7'); // Sepolia chainId
      } catch (error) {
        console.error("Network check error:", error);
      }
    }
  };

  const handleChainChange = (chainId) => {
    setIsCorrectNetwork(chainId === '0xaa36a7');
    // Reset states on network change
    setEvents([]);
    setError('');
    setSuccess('');
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia
      });
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
        } catch (addError) {
          setError('Could not add Sepolia network to MetaMask');
        }
      } else {
        setError('Could not switch network');
      }
    }
  };

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          await checkNetwork();
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
      
      setError('');
      setSuccess('');
      setEvents([]);
    } else {
      setAccount('');
      setIsConnected(false);
    }
  };

  const connectWallet = async () => {
    if (loading) return;

    if (!window.ethereum) {
      setError('Please install MetaMask!');
      return;
    }

    setLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        await checkNetwork();
        if (!isCorrectNetwork) {
          await switchNetwork();
        }
        setSuccess('Wallet connected successfully!');
      }
    } catch (error) {
      if (error.code === -32002) {
        setError('Connection request pending. Please check MetaMask');
      } else if (error.code === 4001) {
        setError('Connection rejected. Please try again');
      } else {
        setError(`Connection error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterENS = async (ensName, eoaAddress) => {
    if (!isCorrectNetwork) {
      setError('Please switch to Sepolia network');
      return;
    }
    
    setLoading(true);
    try {
      const result = await registerENS(ensName, eoaAddress);
      setSuccess(`ENS registered successfully! Transaction: ${result.transaction.hash}`);
      // Refresh events after successful registration
      handleGetPastEvents();
    } catch (error) {
      setError(error.message.includes("user rejected") 
        ? "Transaction rejected by user" 
        : `Registration error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveENS = async (ensName) => {
    if (!isCorrectNetwork) {
      setError('Please switch to Sepolia network');
      return;
    }

    setLoading(true);
    try {
      const result = await resolveENS(ensName);
      if (result.address === ethers.ZeroAddress) {
        setError('ENS name not registered');
      } else {
        setSuccess(`Address found: ${result.address}`);
      }
      return result;
    } catch (error) {
      setError(`Resolution error: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleBatchResolveENS = async (ensNames) => {
    if (!isCorrectNetwork) {
      setError('Please switch to Sepolia network');
      return;
    }

    setLoading(true);
    try {
      const results = await batchResolveENS(ensNames);
      setSuccess(`Successfully resolved ${results.length} ENS names`);
      return results;
    } catch (error) {
      setError(`Batch resolution error: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleGetPastEvents = async () => {
    if (!isCorrectNetwork) {
      setError('Please switch to Sepolia network');
      return;
    }

    setLoading(true);
    try {
      const result = await getPastEvents();
      setEvents(result);
      setSuccess(`Fetched ${result.length} events`);
    } catch (error) {
      setError(`Error fetching events: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'register', name: 'Single Register' },
    { id: 'resolve', name: 'Single Resolve' },
    { id: 'batch-resolve', name: 'Batch Resolve' },
    { id: 'history', name: 'History' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">ENS Address Book</h1>

          {/* Network Status */}
          {isConnected && !isCorrectNetwork && (
            <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded flex justify-between items-center">
              <span>Please connect to Sepolia network</span>
              <button
                onClick={switchNetwork}
                className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600"
              >
                Switch Network
              </button>
            </div>
          )}

          {/* Wallet Connection */}
          <div className="mb-8 text-center">
            {!isConnected ? (
              <button
                onClick={connectWallet}
                disabled={loading}
                className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="flex justify-center items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="text-sm text-gray-600">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
              <button
                className="absolute top-0 right-0 p-3"
                onClick={() => setError('')}
              >
                ×
              </button>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              {success}
              <button
                className="absolute top-0 right-0 p-3"
                onClick={() => setSuccess('')}
              >
                ×
              </button>
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
              <SingleRegistration 
                isConnected={isConnected && isCorrectNetwork}
                account={account}
                onRegister={handleRegisterENS}
                loading={loading}
              />
            )}
            {activeTab === 'resolve' && (
              <SingleResolver 
                onResolve={handleResolveENS}
                isConnected={isConnected && isCorrectNetwork}
                loading={loading}
              />
            )}
            {activeTab === 'batch-resolve' && (
              <BatchResolver 
                onBatchResolve={handleBatchResolveENS}
                isConnected={isConnected && isCorrectNetwork}
                loading={loading}
              />
            )}
            {activeTab === 'history' && (
              <EventHistory 
              events={events}
              onFetchEvents={handleGetPastEvents}
              loading={loading}
              isConnected={isConnected && isCorrectNetwork} // Pass both connection states
              account={account}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;