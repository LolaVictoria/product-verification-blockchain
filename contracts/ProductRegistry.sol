// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ProductRegistry {
    struct Product {
        string name;
        string serialNumber;
        address manufacturer;
        bool isRegistered;
        uint256 registeredAt;
    }

    // Mapping: serialNumber => Product
    mapping(string => Product) public products;

    // Events
    event ProductRegistered(
        string serialNumber,
        string name,
        address manufacturer,
        uint256 registeredAt
    );

    // Register a product
    function registerProduct(string memory _name, string memory _serialNumber) public {
        require(!products[_serialNumber].isRegistered, "Product already registered");

        products[_serialNumber] = Product({
            name: _name,
            serialNumber: _serialNumber,
            manufacturer: msg.sender,
            isRegistered: true,
            registeredAt: block.timestamp
        });

        emit ProductRegistered(_serialNumber, _name, msg.sender, block.timestamp);
    }

    // Verify product details
    function verifyProduct(string memory _serialNumber)
        public
        view
        returns (
            string memory name,
            address manufacturer,
            bool isRegistered
        )
    {
        Product memory product = products[_serialNumber];
        return (product.name, product.manufacturer, product.isRegistered);
    }

    // Get full product details including timestamp
    function getProduct(string memory _serialNumber)
        public
        view
        returns (
            string memory name,
            address manufacturer,
            bool isRegistered,
            uint256 registeredAt
        )
    {
        Product memory product = products[_serialNumber];
        require(product.isRegistered, "Product not found");
        return (product.name, product.manufacturer, product.isRegistered, product.registeredAt);
    }
}
