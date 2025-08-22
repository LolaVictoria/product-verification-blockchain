const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    // Load deployment info
    let deploymentPath = path.join(__dirname, "..", "deployment-info.json");
    
    if (!fs.existsSync(deploymentPath)) {
      console.error("❌ Deployment file not found. Please deploy the contract first:");
      console.log("npx hardhat run scripts/deploy.cjs --network localhost");
      return;
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contractAddress = deploymentInfo.contractAddress;
    
    console.log("🔗 Connecting to ElectronicsAuthentication contract at:", contractAddress);
    
    // Get contract instance
    const ElectronicsAuthentication = await ethers.getContractFactory("ElectronicsAuthentication");
    const electronicsAuth = ElectronicsAuthentication.attach(contractAddress);
    
    // Get signers
    const [admin, manufacturer1, manufacturer2, user] = await ethers.getSigners();
    
    console.log("\n📋 Account Information:");
    console.log("Admin:", admin.address);
    console.log("Manufacturer 1:", manufacturer1.address);
    console.log("Manufacturer 2:", manufacturer2.address);
    console.log("User:", user.address);
    
    // Check admin
    console.log("\n👑 Checking contract admin...");
    const contractAdmin = await electronicsAuth.admin();
    console.log("Contract admin:", contractAdmin);
    console.log("Is deployer the admin?", contractAdmin === admin.address);
    
    // Check pre-loaded manufacturers
    console.log("\n🏭 Checking pre-loaded manufacturers...");
    const appleAddress = "0x742d35Cc622C4532c0532255c87A59B852b74f8d";
    const samsungAddress = "0x8ba1f109551bD432803012645Hac136c461c11B6";
    
    const isAppleVerified = await electronicsAuth.verifiedManufacturers(appleAddress);
    const isSamsungVerified = await electronicsAuth.verifiedManufacturers(samsungAddress);
    console.log("Apple verified:", isAppleVerified);
    console.log("Samsung verified:", isSamsungVerified);
    
    // Authorize new manufacturer
    console.log("\n🏭 Authorizing new manufacturer...");
    const authTx = await electronicsAuth.connect(admin).batchAuthorizeManufacturers([manufacturer1.address]);
    await authTx.wait();
    console.log("✅ Manufacturer authorized");
    
    // Check authorization
    const isAuthorized = await electronicsAuth.verifiedManufacturers(manufacturer1.address);
    console.log("Is manufacturer1 authorized?", isAuthorized);
    
    // Register a device
    console.log("\n📱 Registering device...");
    const serialNumber = "IPHONE15PRO123456";
    const brand = "iPhone";
    const model = "iPhone 15 Pro";
    const deviceType = "Smartphone";
    const storage = "256GB";
    const color = "Space Gray";
    const batchNumber = "BATCH001";
    const specHash = "0x1234567890abcdef";
    
    const registerTx = await electronicsAuth.connect(manufacturer1).registerDevice(
      serialNumber,
      brand,
      model,
      deviceType,
      storage,
      color,
      batchNumber,
      specHash
    );
    const receipt = await registerTx.wait();
    console.log("✅ Device registered");
    
    // Check for events
    const events = receipt.logs.filter(log => {
      try {
        return electronicsAuth.interface.parseLog(log).name === "DeviceRegistered";
      } catch {
        return false;
      }
    });
    
    if (events.length > 0) {
      const parsedEvent = electronicsAuth.interface.parseLog(events[0]);
      console.log("📡 DeviceRegistered event emitted:");
      console.log("  Serial Number:", parsedEvent.args[0]);
      console.log("  Manufacturer:", parsedEvent.args[1]);
    }
    
    // Verify the device
    console.log("\n🔍 Verifying device...");
    const [exists, isAuthentic, deviceBrand, deviceModel, type, manufacturerName, currentOwner] = 
      await electronicsAuth.verifyDevice(serialNumber);
    
    console.log("Device Details:");
    console.log("  Exists:", exists);
    console.log("  Authentic:", isAuthentic);
    console.log("  Brand:", deviceBrand);
    console.log("  Model:", deviceModel);
    console.log("  Type:", type);
    console.log("  Manufacturer:", manufacturerName);
    console.log("  Owner:", currentOwner);
    
    // Get full device details
    console.log("\n📋 Getting full device details...");
    const [fullBrand, fullModel, fullType, fullStorage, fullColor, fullMfgName, fullOwner, mfgDate] = 
      await electronicsAuth.getDeviceDetails(serialNumber);
    
    console.log("Full Device Info:");
    console.log("  Brand:", fullBrand);
    console.log("  Model:", fullModel);
    console.log("  Type:", fullType);
    console.log("  Storage:", fullStorage);
    console.log("  Color:", fullColor);
    console.log("  Manufacturer:", fullMfgName);
    console.log("  Current Owner:", fullOwner);
    console.log("  Manufacturing Date:", new Date(Number(mfgDate) * 1000).toLocaleString());
    
    // Transfer ownership
    console.log("\n🔄 Transferring ownership to user...");
    const transferTx = await electronicsAuth.connect(manufacturer1).transferOwnership(
      serialNumber,
      user.address,
      "Sale",
      ethers.parseEther("0.5") // 0.5 ETH
    );
    await transferTx.wait();
    console.log("✅ Ownership transferred");
    
    // Check ownership history
    console.log("\n📜 Checking ownership history...");
    const [prevOwners, newOwners, dates, reasons, prices] = 
      await electronicsAuth.getOwnershipHistory(serialNumber);
    
    console.log("Ownership History:");
    for (let i = 0; i < prevOwners.length; i++) {
      console.log(`  Transfer ${i + 1}:`);
      console.log(`    From: ${prevOwners[i]}`);
      console.log(`    To: ${newOwners[i]}`);
      console.log(`    Date: ${new Date(Number(dates[i]) * 1000).toLocaleString()}`);
      console.log(`    Reason: ${reasons[i]}`);
      console.log(`    Price: ${ethers.formatEther(prices[i])} ETH`);
    }
    
    // Try to register duplicate device (should fail)
    console.log("\n❌ Trying to register duplicate device (should fail)...");
    try {
      await electronicsAuth.connect(manufacturer1).registerDevice(
        serialNumber,
        "Duplicate",
        "Test",
        "Test",
        "Test",
        "Test",
        "Test",
        "Test"
      );
      console.log("❌ ERROR: Duplicate registration should have failed!");
    } catch (error) {
      if (error.message.includes("Serial number already exists")) {
        console.log("✅ Correctly rejected duplicate device registration");
      } else {
        console.log("❌ Unexpected error:", error.message);
      }
    }
    
    // Check non-existent device
    console.log("\n🔍 Checking non-existent device...");
    const [nonExists] = await electronicsAuth.verifyDevice("NONEXISTENT123");
    console.log("Non-existent device exists?", nonExists);
    
    console.log("\n🎉 Interaction script completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during interaction:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });