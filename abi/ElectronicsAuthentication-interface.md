# ElectronicsAuthentication Contract Interface

Generated on: 2025-08-24T03:56:18.154Z

## Contract Address
- **sepolia**: `0x07c05F17f53ff83d0b5F469bFA0Cb36bDc9eA950`

## View Functions (Free to call)

### `admin() → address`

### `devices(string ) → string, string, string, string, string, string, address, address, uint256, string, bool, uint256, string`

### `getAllAuthorizedManufacturers() → address[]`

### `getDeviceDetails(string _serialNumber) → string, string, string, string, string, string, address, uint256`

### `getOwnerDevices(address _owner) → string[]`

### `getOwnershipHistory(string _serialNumber) → address[], address[], uint256[], string[], uint256[]`

### `isManufacturerAuthorized(address _manufacturer) → bool`

### `manufacturerList(uint256 ) → address`

### `manufacturers(address ) → string, address, bool, uint256`

### `ownerDevices(address , uint256 ) → string`

### `ownershipHistory(string , uint256 ) → address, address, uint256, string, uint256`

### `serialExists(string _serialNumber) → bool`

### `verifiedManufacturers(address ) → bool`

### `verifyDevice(string _serialNumber) → bool, bool, string, string, string, string, address`

### `verifyMultipleDevices(string[] _serialNumbers) → bool[], bool[], string[], string[]`

## State-Changing Functions (Require gas)

### `batchAuthorizeManufacturers(address[] _manufacturers)`

### `registerDevice(string _serialNumber, string _brand, string _model, string _deviceType, string _storage, string _color, string _batchNumber, string _specHash)`

### `revokeDeviceAuthenticity(string _serialNumber)`

### `revokeManufacturer(address _manufacturer)`

### `transferOwnership(string _serialNumber, address _newOwner, string _transferReason, uint256 _salePrice)`

## Events

### `DeviceRegistered(string indexed serialNumber, address indexed manufacturer)`

### `DeviceVerified(string indexed serialNumber, bool isAuthentic)`

### `ManufacturerAuthorized(address indexed manufacturer)`

### `ManufacturerRevoked(address indexed manufacturer)`

### `ManufacturerVerified(address indexed manufacturer, string companyName)`

### `OwnershipTransferred(string indexed serialNumber, address indexed from, address indexed to, uint256 price)`

