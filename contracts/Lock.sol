// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/Resolver.sol";

contract ENSAddressBook is Ownable {
    ENS public ensRegistry;
    mapping(bytes32 => address) public ensToEOA;
    event ENSMappingAdded(bytes32 indexed ensHash, address indexed eoaAddress, string ensName);
    event ENSMappingUpdated(bytes32 indexed ensHash, address indexed newEoaAddress, string ensName);
    event ENSMappingRemoved(bytes32 indexed ensHash, string ensName);
    
    constructor(address _ensRegistry) {
        ensRegistry = ENS(_ensRegistry);
    }
        
    function registerENS(string calldata ensName, address eoaAddress) external {
        bytes32 nameHash = keccak256(bytes(ensName));
        require(isENSOwner(ensName, msg.sender), "Not the ENS owner");
        require(eoaAddress != address(0), "Invalid EOA address");        
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
            
            bytes32 nameHash = keccak256(bytes(ensNames[i]));
            ensToEOA[nameHash] = eoaAddresses[i];
            emit ENSMappingAdded(nameHash, eoaAddresses[i], ensNames[i]);
        }
    }
    
    function updateENS(string calldata ensName, address newEoaAddress) external {
        bytes32 nameHash = keccak256(bytes(ensName));
        require(isENSOwner(ensName, msg.sender), "Not the ENS owner");
        require(newEoaAddress != address(0), "Invalid EOA address");
        require(ensToEOA[nameHash] != address(0), "ENS not registered");
        
        ensToEOA[nameHash] = newEoaAddress;
        emit ENSMappingUpdated(nameHash, newEoaAddress, ensName);
    }

    function removeENS(string calldata ensName) external {
        bytes32 nameHash = keccak256(bytes(ensName));
        require(isENSOwner(ensName, msg.sender), "Not the ENS owner");
        require(ensToEOA[nameHash] != address(0), "ENS not registered");
        
        delete ensToEOA[nameHash];
        emit ENSMappingRemoved(nameHash, ensName);
    }
    
    function resolveENS(string calldata ensName) external view returns (address) {
        bytes32 nameHash = keccak256(bytes(ensName));
        return ensToEOA[nameHash];
    }
    
    function batchResolveENS(string[] calldata ensNames)
        external
        view
        returns (address[] memory)
    {
        address[] memory addresses = new address[](ensNames.length);
        
        for (uint i = 0; i < ensNames.length; i++) {
            bytes32 nameHash = keccak256(bytes(ensNames[i]));
            addresses[i] = ensToEOA[nameHash];
        }
        
        return addresses;
    }

    function isENSOwner(string memory ensName, address owner) internal view returns (bool) {
        bytes32 node = keccak256(bytes(ensName));
        return ensRegistry.owner(node) == owner;
    }
    
}
