// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ElectronicsAuthentication {
    address public admin;
    address[] public manufacturerList;
    
    struct Manufacturer {
        string companyName;
        address walletAddress;
        bool isVerified;
        uint256 registrationTime;
    }
    
    struct Device {
        string serialNumber;
        string brand;
        string model;
        string deviceType;
        string storageData;
        string color;
        address manufacturer;
        address currentOwner;
        uint256 manufacturingDate;
        string batchNumber;
        bool isAuthentic;
        uint256 registrationTime;
        string specificationHash;
    }
    
    struct OwnershipHistory {
        address previousOwner;
        address newOwner;
        uint256 transferDate;
        string transferReason;
        uint256 salePrice;
    }
    
    mapping(address => Manufacturer) public manufacturers;
    mapping(string => Device) public devices;
    mapping(string => bool) private serialNumberExists;
    mapping(address => bool) public verifiedManufacturers;
    mapping(string => OwnershipHistory[]) public ownershipHistory;
    mapping(address => string[]) public ownerDevices;
    
    event ManufacturerVerified(address indexed manufacturer, string companyName);
    event DeviceRegistered(string indexed serialNumber, address indexed manufacturer);
    event OwnershipTransferred(string indexed serialNumber, address indexed from, address indexed to, uint256 price);
    event DeviceVerified(string indexed serialNumber, bool isAuthentic);
    event ManufacturerAuthorized(address indexed manufacturer);
    event ManufacturerRevoked(address indexed manufacturer);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyVerifiedManufacturer() {
        require(verifiedManufacturers[msg.sender], "Only verified manufacturers");
        _;
    }
    
    modifier onlyOwner(string memory _serialNumber) {
        require(devices[_serialNumber].currentOwner == msg.sender, "Only device owner can transfer");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        
        _addManufacturer(0x742D35cc622c4532C0532255C87a59B852b74f8D, "Nexlify Tech");
        _addManufacturer(0x051051074B7BbfaB5bB1A72432129118218cDe97, "Quantum Mobile");
        _addManufacturer(0x456DEf123ABC78901234567890abCdef12345678, "Stellar Devices");
    }
    
    function _addManufacturer(address _wallet, string memory _companyName) private {
        manufacturers[_wallet] = Manufacturer({
            companyName: _companyName,
            walletAddress: _wallet,
            isVerified: true,
            registrationTime: block.timestamp
        });
        verifiedManufacturers[_wallet] = true;
        manufacturerList.push(_wallet);
    }
    
    function registerDevice(
        string memory _serialNumber,
        string memory _brand,
        string memory _model,
        string memory _deviceType,
        string memory _storage,
        string memory _color,
        string memory _batchNumber,
        string memory _specHash
    ) public onlyVerifiedManufacturer {
        require(!serialNumberExists[_serialNumber], "Serial number already exists");
        require(bytes(_serialNumber).length > 0, "Serial number cannot be empty");
        
        serialNumberExists[_serialNumber] = true;
        
        // Split device creation to avoid stack too deep
        _createDevice(_serialNumber, _brand, _model, _deviceType, _storage, _color, _batchNumber, _specHash);
        
        ownerDevices[msg.sender].push(_serialNumber);
        
        emit DeviceRegistered(_serialNumber, msg.sender);
    }
    
    function _createDevice(
        string memory _serialNumber,
        string memory _brand,
        string memory _model,
        string memory _deviceType,
        string memory _storage,
        string memory _color,
        string memory _batchNumber,
        string memory _specHash
    ) private {
        devices[_serialNumber] = Device({
            serialNumber: _serialNumber,
            brand: _brand,
            model: _model,
            deviceType: _deviceType,
            storageData: _storage,
            color: _color,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            manufacturingDate: block.timestamp,
            batchNumber: _batchNumber,
            isAuthentic: true,
            registrationTime: block.timestamp,
            specificationHash: _specHash
        });
    }
    
    function transferOwnership(
        string memory _serialNumber,
        address _newOwner,
        string memory _transferReason,
        uint256 _salePrice
    ) public onlyOwner(_serialNumber) {
        require(_newOwner != address(0), "Invalid new owner address");
        require(_newOwner != devices[_serialNumber].currentOwner, "Cannot transfer to same owner");
        
        Device storage device = devices[_serialNumber];
        address previousOwner = device.currentOwner;
        
        // Create ownership record
        _createOwnershipRecord(_serialNumber, previousOwner, _newOwner, _transferReason, _salePrice);
        
        // Update current owner
        device.currentOwner = _newOwner;
        
        // Update owner device lists
        _removeFromOwnerDevices(previousOwner, _serialNumber);
        ownerDevices[_newOwner].push(_serialNumber);
        
        emit OwnershipTransferred(_serialNumber, previousOwner, _newOwner, _salePrice);
    }
    
    function _createOwnershipRecord(
        string memory _serialNumber,
        address _previousOwner,
        address _newOwner,
        string memory _transferReason,
        uint256 _salePrice
    ) private {
        ownershipHistory[_serialNumber].push(OwnershipHistory({
            previousOwner: _previousOwner,
            newOwner: _newOwner,
            transferDate: block.timestamp,
            transferReason: _transferReason,
            salePrice: _salePrice
        }));
    }
    
    function _removeFromOwnerDevices(address owner, string memory serialNumber) private {
        string[] storage deviceList = ownerDevices[owner];
        for (uint i = 0; i < deviceList.length; i++) {
            if (keccak256(bytes(deviceList[i])) == keccak256(bytes(serialNumber))) {
                deviceList[i] = deviceList[deviceList.length - 1];
                deviceList.pop();
                break;
            }
        }
    }
    
    function verifyDevice(string memory _serialNumber) public view returns (
        bool exists,
        bool isAuthentic,
        string memory brand,
        string memory model,
        string memory deviceType,
        string memory manufacturerName,
        address currentOwner
    ) {
        if (!serialNumberExists[_serialNumber]) {
            return (false, false, "", "", "", "", address(0));
        }
        
        return _getDeviceVerification(_serialNumber);
    }
    
    function _getDeviceVerification(string memory _serialNumber) private view returns (
        bool,
        bool,
        string memory,
        string memory,
        string memory,
        string memory,
        address
    ) {
        Device memory device = devices[_serialNumber];
        Manufacturer memory manufacturer = manufacturers[device.manufacturer];
        
        return (
            true,
            device.isAuthentic && manufacturer.isVerified,
            device.brand,
            device.model,
            device.deviceType,
            manufacturer.companyName,
            device.currentOwner
        );
    }
    
    function verifyMultipleDevices(string[] memory _serialNumbers) public view returns (
        bool[] memory exists,
        bool[] memory isAuthentic,
        string[] memory brands,
        string[] memory models
    ) {
        uint256 length = _serialNumbers.length;
        exists = new bool[](length);
        isAuthentic = new bool[](length);
        brands = new string[](length);
        models = new string[](length);
        
        for (uint256 i = 0; i < length; i++) {
            (exists[i], isAuthentic[i], brands[i], models[i],,,) = verifyDevice(_serialNumbers[i]);
        }
        
        return (exists, isAuthentic, brands, models);
    }
    
    function getDeviceDetails(string memory _serialNumber) public view returns (
        string memory brand,
        string memory model,
        string memory deviceType,
        string memory storageData,
        string memory color,
        string memory manufacturerName,
        address currentOwner,
        uint256 manufacturingDate
    ) {
        require(serialNumberExists[_serialNumber], "Device not found");
        
        return _getDeviceDetailsInternal(_serialNumber);
    }
    
    function _getDeviceDetailsInternal(string memory _serialNumber) private view returns (
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        address,
        uint256
    ) {
        Device memory device = devices[_serialNumber];
        Manufacturer memory manufacturer = manufacturers[device.manufacturer];
        
        return (
            device.brand,
            device.model,
            device.deviceType,
            device.storageData,
            device.color,
            manufacturer.companyName,
            device.currentOwner,
            device.manufacturingDate
        );
    }
    
    function getOwnershipHistory(string memory _serialNumber) public view returns (
        address[] memory previousOwners,
        address[] memory newOwners,
        uint256[] memory transferDates,
        string[] memory transferReasons,
        uint256[] memory salePrices
    ) {
        require(serialNumberExists[_serialNumber], "Device not found");
        
        return _getOwnershipHistoryArrays(_serialNumber);
    }
    
    function _getOwnershipHistoryArrays(string memory _serialNumber) private view returns (
        address[] memory,
        address[] memory,
        uint256[] memory,
        string[] memory,
        uint256[] memory
    ) {
        OwnershipHistory[] memory history = ownershipHistory[_serialNumber];
        uint256 length = history.length;
        
        address[] memory previousOwners = new address[](length);
        address[] memory newOwners = new address[](length);
        uint256[] memory transferDates = new uint256[](length);
        string[] memory transferReasons = new string[](length);
        uint256[] memory salePrices = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            previousOwners[i] = history[i].previousOwner;
            newOwners[i] = history[i].newOwner;
            transferDates[i] = history[i].transferDate;
            transferReasons[i] = history[i].transferReason;
            salePrices[i] = history[i].salePrice;
        }
        
        return (previousOwners, newOwners, transferDates, transferReasons, salePrices);
    }
    
    function getOwnerDevices(address _owner) public view returns (string[] memory) {
        return ownerDevices[_owner];
    }
    
    function revokeDeviceAuthenticity(string memory _serialNumber) public onlyAdmin {
        require(serialNumberExists[_serialNumber], "Device not found");
        devices[_serialNumber].isAuthentic = false;
    }
    
    function serialExists(string memory _serialNumber) public view returns (bool) {
        return serialNumberExists[_serialNumber];
    }
    
    function batchAuthorizeManufacturers(address[] memory _manufacturers) public onlyAdmin {
        for (uint i = 0; i < _manufacturers.length; i++) {
            if (!verifiedManufacturers[_manufacturers[i]]) {
                verifiedManufacturers[_manufacturers[i]] = true;
                manufacturerList.push(_manufacturers[i]);
                emit ManufacturerAuthorized(_manufacturers[i]);
            }
        }
    }
    
    function isManufacturerAuthorized(address _manufacturer) public view returns (bool) {
        return verifiedManufacturers[_manufacturer];
    }
    
    function revokeManufacturer(address _manufacturer) public onlyAdmin {
        require(verifiedManufacturers[_manufacturer], "Manufacturer not authorized");
        verifiedManufacturers[_manufacturer] = false;
        
        if (manufacturers[_manufacturer].isVerified) {
            manufacturers[_manufacturer].isVerified = false;
        }
        
        emit ManufacturerRevoked(_manufacturer);
    }
    
    function getAllAuthorizedManufacturers() public view returns (address[] memory) {
        return _getActiveManufacturers();
    }
    
    function _getActiveManufacturers() private view returns (address[] memory) {
        uint activeCount = 0;
        
        // Count active manufacturers
        for (uint i = 0; i < manufacturerList.length; i++) {
            if (verifiedManufacturers[manufacturerList[i]]) {
                activeCount++;
            }
        }
        
        // Create array with active manufacturers
        address[] memory active = new address[](activeCount);
        uint index = 0;
        
        for (uint i = 0; i < manufacturerList.length; i++) {
            if (verifiedManufacturers[manufacturerList[i]]) {
                active[index] = manufacturerList[i];
                index++;
            }
        }
        
        return active;
    }
}