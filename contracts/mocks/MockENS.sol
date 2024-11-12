// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

contract MockENS {
    mapping(bytes32 => address) private owners;

    function setOwner(bytes32 node, address _owner) external {
        owners[node] = _owner;
    }

    function owner(bytes32 node) external view returns (address) {
        return owners[node];
    }
}