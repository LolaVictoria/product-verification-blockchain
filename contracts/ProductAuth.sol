// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./base/AccessControl.sol";
import "./base/ProductStorage.sol";

contract ProductAuth {
    address public owner;
    
    struct Product {
        bool exists;
        address manufacturer;
        string name;
        string category;
        uint256 timestamp;
    }
    
    mapping(address => bool) public authorizedManufacturers;
    mapping(string => Product) private products;
    
    event ProductRegistered(
        string indexed serialNumber,
        address indexed manufacturer,
        string name,
        uint256 timestamp
    );
    
    event ManufacturerAuthorized(address indexed manufacturer);
    
    error UnauthorizedAccess();
    error ProductAlreadyExists();
    error InvalidSerialNumber();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert UnauthorizedAccess();
        _;
    }
    
    modifier onlyAuthorizedManufacturer() {
        if (!authorizedManufacturers[msg.sender]) revert UnauthorizedAccess();
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function authorizeManufacturer(address _manufacturer) external onlyOwner {
        authorizedManufacturers[_manufacturer] = true;
        emit ManufacturerAuthorized(_manufacturer);
    }
    
    function registerProduct(
        string calldata _serialNumber,
        string calldata _name,
        string calldata _category
    ) external onlyAuthorizedManufacturer {
        if (bytes(_serialNumber).length == 0) revert InvalidSerialNumber();
        if (products[_serialNumber].exists) revert ProductAlreadyExists();
        
        products[_serialNumber] = Product({
            exists: true,
            manufacturer: msg.sender,
            name: _name,
            category: _category,
            timestamp: block.timestamp
        });
        
        emit ProductRegistered(_serialNumber, msg.sender, _name, block.timestamp);
    }
    
    function verifyProduct(string calldata _serialNumber) 
        external 
        view 
        returns (
            bool verified,
            address manufacturer,
            string memory name,
            string memory category,
            uint256 timestamp
        ) 
    {
        Product memory product = products[_serialNumber];
        return (
            product.exists,
            product.manufacturer,
            product.name,
            product.category,
            product.timestamp
        );
    }
    
    function isProductVerified(string calldata _serialNumber) 
        external 
        view 
        returns (bool) 
    {
        return products[_serialNumber].exists;
    }
}