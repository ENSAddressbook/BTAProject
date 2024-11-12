// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/Resolver.sol";

contract ENSAddressBook is Ownable {
    
    ENS public immutable ensRegistry;
    mapping(bytes32 => address) public ensToEOA;
    
    event ENSMappingAdded(bytes32 indexed ensHash, address indexed eoaAddress, string ensName);
    event ENSMappingUpdated(bytes32 indexed ensHash, address indexed newEoaAddress, string ensName);
    event ENSMappingRemoved(bytes32 indexed ensHash, string ensName);
    
    error ENSAlreadyRegistered(string ensName);
    
    constructor(address _ensRegistry) Ownable(msg.sender) {
        require(_ensRegistry != address(0), "Invalid ENS registry address");
        ensRegistry = ENS(_ensRegistry);
    }
    
    // External function for external calls
    function isENSRegistered(string calldata ensName) external view returns (bool) {
        return _isENSRegistered(ensName);
    }
    
    // Internal function for contract use
    function _isENSRegistered(string memory ensName) internal view returns (bool) {
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        return ensToEOA[nameHash] != address(0);
    }
    
    function registerENS(string calldata ensName, address eoaAddress) external {
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        require(isENSOwner(ensName, msg.sender), "Not the ENS owner");
        require(eoaAddress != address(0), "Invalid EOA address");
        require(!_isENSRegistered(ensName), "ENS name already registered");
        
        ensToEOA[nameHash] = eoaAddress;
        emit ENSMappingAdded(nameHash, eoaAddress, ensName);
    }
    
    function batchRegisterENS(
        string[] calldata ensNames,
        address[] calldata eoaAddresses
    ) external {
        require(ensNames.length == eoaAddresses.length, "Array lengths must match");
        
        for (uint i = 0; i < ensNames.length; i++) {
            require(isENSOwner(ensNames[i], msg.sender), "Not the ENS owner");
            require(eoaAddresses[i] != address(0), "Invalid EOA address");
            require(!_isENSRegistered(ensNames[i]), "ENS name already registered");
            
            bytes32 nameHash = keccak256(abi.encodePacked(ensNames[i]));
            ensToEOA[nameHash] = eoaAddresses[i];
            emit ENSMappingAdded(nameHash, eoaAddresses[i], ensNames[i]);
        }
    }
    
    function updateENS(string calldata ensName, address newEoaAddress) external {
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        require(isENSOwner(ensName, msg.sender), "Not the ENS owner");
        require(newEoaAddress != address(0), "Invalid EOA address");
        require(ensToEOA[nameHash] != address(0), "ENS not registered");
        
        ensToEOA[nameHash] = newEoaAddress;
        emit ENSMappingUpdated(nameHash, newEoaAddress, ensName);
    }
    
    function removeENS(string calldata ensName) external {
        bytes32 nameHash = keccak256(abi.encodePacked(ensName));
        require(isENSOwner(ensName, msg.sender), "Not the ENS owner");
        require(ensToEOA[nameHash] != address(0), "ENS not registered");
        
        delete ensToEOA[nameHash];
        emit ENSMappingRemoved(nameHash, ensName);
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
        
        for (uint i = 0; i < ensNames.length; i++) {
            bytes32 nameHash = keccak256(abi.encodePacked(ensNames[i]));
            addresses[i] = ensToEOA[nameHash];
        }
        
        return addresses;
    }
    
    function isENSOwner(string memory ensName, address owner) internal view returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(ensName));
        return ensRegistry.owner(node) == owner;
    }
    // function getENSOwner(string calldata ensName) external view returns (address) {
    // return ensRegistry.owner(ensName);
    // }
}