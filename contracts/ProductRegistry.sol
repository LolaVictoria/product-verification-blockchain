// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ProductRegistry {
    struct Product {
        string name;
        string serialNumber;
        address manufacturer;
        bool isRegistered;
    }

    mapping(string => Product) public products; // serialNumber => Product

    event ProductRegistered(string serialNumber, string name, address manufacturer);

    function registerProduct(string memory _name, string memory _serialNumber) public {
        require(!products[_serialNumber].isRegistered, "Product already registered");

        products[_serialNumber] = Product({
            name: _name,
            serialNumber: _serialNumber,
            manufacturer: msg.sender,
            isRegistered: true
        });

        emit ProductRegistered(_serialNumber, _name, msg.sender);
    }

    function verifyProduct(string memory _serialNumber) public view returns (
        string memory name,
        address manufacturer,
        bool isRegistered
    ) {
        Product memory product = products[_serialNumber];
        return (product.name, product.manufacturer, product.isRegistered);
    }
}
