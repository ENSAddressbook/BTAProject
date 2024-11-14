// SPDX-License-Identifier: UNDEFINED
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/Resolver.sol";

contract ENSAddressBook is Ownable {
    // State Variables
    ENS public immutable ensRegistry;
    bool public useENSRegistry;
    
    // Mappings
    mapping(bytes32 => address) public ensToEOA;
    mapping(bytes32 => uint256) public registrationTimestamp;
    
    // Events
    event ENSMappingAdded(bytes32 indexed ensHash, address indexed eoaAddress, string ensName, uint256 timestamp);
    event ENSMappingUpdated(bytes32 indexed ensHash, address indexed newEoaAddress, address indexed oldEoaAddress, string ensName);
    event ENSMappingRemoved(bytes32 indexed ensHash, address indexed eoaAddress, string ensName);
    event ENSRegistryToggled(bool useRegistry);
    
    // Custom errors
    error ENSAlreadyRegistered(string ensName);
    error ENSNotRegistered(string ensName);
    error InvalidEOAAddress();
    error InvalidENSRegistry();
    error NotEOAOwner(address eoaAddress);
    error NotRegistrationOwner(string ensName);
    error NotENSOwner(string ensName);
    
    constructor(address _ensRegistry, bool _useENSRegistry) Ownable(msg.sender) {
    if (_useENSRegistry && _ensRegistry == address(0)) revert InvalidENSRegistry();
    ensRegistry = ENS(_ensRegistry);
    useENSRegistry = _useENSRegistry;
}

    
    // Toggle ENS registry checks
    function setUseENSRegistry(bool _useENSRegistry) external onlyOwner {
        useENSRegistry = _useENSRegistry;
        emit ENSRegistryToggled(_useENSRegistry);
    }
    
    // Modifiers
    modifier validAddress(address _address) {
        if (_address == address(0)) revert InvalidEOAAddress();
        _;
    }
    
    modifier onlyEOAOwner(address eoaAddress) {
        if (msg.sender != eoaAddress) revert NotEOAOwner(eoaAddress);
        _;
    }
    
    modifier onlyRegistrationOwner(string memory ensName) {
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        if (ensToEOA[nameHash] != msg.sender) revert NotRegistrationOwner(ensName);
        _;
    }
    
    // Check ENS ownership if registry is enabled
    modifier verifyENSOwnership(string memory ensName) {
        if (useENSRegistry) {
            bytes32 nameHash = keccak256(abi.encodePacked(ensName));
            address ensOwner = ensRegistry.owner(nameHash);
            if (ensOwner != msg.sender) revert NotENSOwner(ensName);
        }
        _;
    }
    
    function isENSRegistered(string calldata ensName) external view returns (bool) {
        return _isENSRegistered(ensName);
    }
    
    function _isENSRegistered(string memory ensName) internal view returns (bool) {
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        return ensToEOA[nameHash] != address(0);
    }
    
    function registerENS(string calldata ensName, address eoaAddress) 
        external 
        validAddress(eoaAddress)
        onlyEOAOwner(eoaAddress)
        verifyENSOwnership(ensName)  
    {
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        if (_isENSRegistered(ensName)) revert ENSAlreadyRegistered(ensName);
        
        ensToEOA[nameHash] = eoaAddress;
        registrationTimestamp[nameHash] = block.timestamp;
        
        emit ENSMappingAdded(nameHash, eoaAddress, ensName, block.timestamp);
    }
    
    function updateENS(string calldata ensName, address newEoaAddress) 
        external 
        validAddress(newEoaAddress)
        onlyRegistrationOwner(ensName)
        onlyEOAOwner(newEoaAddress)
        verifyENSOwnership(ensName)  // Added ENS ownership check
    {
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        address oldAddress = ensToEOA[nameHash];
        if (oldAddress == address(0)) revert ENSNotRegistered(ensName);
        
        ensToEOA[nameHash] = newEoaAddress;
        emit ENSMappingUpdated(nameHash, newEoaAddress, oldAddress, ensName);
    }
    
    function removeENS(string calldata ensName) 
        external 
        onlyRegistrationOwner(ensName)
        verifyENSOwnership(ensName)  // Added ENS ownership check
    {
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        address oldAddress = ensToEOA[nameHash];
        if (oldAddress == address(0)) revert ENSNotRegistered(ensName);
        
        delete ensToEOA[nameHash];
        delete registrationTimestamp[nameHash];
        
        emit ENSMappingRemoved(nameHash, oldAddress, ensName);
    }
    
    function resolveENS(string calldata ensName) external view returns (address) {
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        return ensToEOA[nameHash];
    }
    
    function batchResolveENS(string[] calldata ensNames)
        external
        view
        returns (address[] memory)
    {
        address[] memory addresses = new address[](ensNames.length);
        
        for (uint256 i = 0; i < ensNames.length; i++) {
            bytes32 nameHash = keccak256(abi.encodePacked(ensNames[i]));
            addresses[i] = ensToEOA[nameHash];
        }
        
        return addresses;
    }
    
    function getRegistrationDetails(string calldata ensName) 
        external 
        view 
        returns (address eoaAddress, uint256 timestamp) 
    {
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        return (ensToEOA[nameHash], registrationTimestamp[nameHash]);
    }

    // New function to check if a name requires ENS verification
    function requiresENSVerification() external view returns (bool) {
        return useENSRegistry;
    }

    // New function to get ENS owner if registry is enabled
    function getENSOwner(string calldata ensName) external view returns (address) {
        if (!useENSRegistry) return address(0);
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        return ensRegistry.owner(nameHash);
    }
}