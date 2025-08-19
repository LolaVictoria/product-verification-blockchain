// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductAuthentication {
    address public owner;
    mapping(address => bool) public authorizedManufacturers;
    address[] public manufacturerList;
    
    event ManufacturerAuthorized(address indexed manufacturer);
    event ManufacturerRevoked(address indexed manufacturer);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    // Batch authorize multiple manufacturers
    function batchAuthorizeManufacturers(address[] memory _manufacturers) public onlyOwner {
        for (uint i = 0; i < _manufacturers.length; i++) {
            if (!authorizedManufacturers[_manufacturers[i]]) {
                authorizedManufacturers[_manufacturers[i]] = true;
                manufacturerList.push(_manufacturers[i]);
                emit ManufacturerAuthorized(_manufacturers[i]);
            }
        }
    }
    
    // Check if manufacturer is authorized
    function isManufacturerAuthorized(address _manufacturer) public view returns (bool) {
        return authorizedManufacturers[_manufacturer];
    }
    
    // Revoke manufacturer authorization
    function revokeManufacturer(address _manufacturer) public onlyOwner {
        require(authorizedManufacturers[_manufacturer], "Manufacturer not authorized");
        authorizedManufacturers[_manufacturer] = false;
        emit ManufacturerRevoked(_manufacturer);
    }
    
    // Get all authorized manufacturers
    function getAllAuthorizedManufacturers() public view returns (address[] memory) {
        uint activeCount = 0;
        
        // Count active manufacturers
        for (uint i = 0; i < manufacturerList.length; i++) {
            if (authorizedManufacturers[manufacturerList[i]]) {
                activeCount++;
            }
        }
        
        // Create array of active manufacturers
        address[] memory active = new address[](activeCount);
        uint index = 0;
        
        for (uint i = 0; i < manufacturerList.length; i++) {
            if (authorizedManufacturers[manufacturerList[i]]) {
                active[index] = manufacturerList[i];
                index++;
            }
        }
        
        return active;
    }
}