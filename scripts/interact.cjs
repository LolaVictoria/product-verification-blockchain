const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    // Load deployment info
    let deploymentPath = path.join(__dirname, "..", "deployment-info.json");
    // let deploymentInfo;
    // const deploymentPath = path.join(__dirname, "..", "deployment-info.json");
    // const deploymentPath = path.join(__dirname, "..", "deployments", "ProductAuth-sepolia.json");
    
    
    if (!fs.existsSync(deploymentPath)) {
      console.error("❌ Deployment file not found. Please deploy the contract first:");
      console.log("npx hardhat run scripts/deploy.cjs --network localhost");
      return;
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contractAddress = deploymentInfo.contractAddress;
    
    console.log("🔗 Connecting to ProductAuth contract at:", contractAddress);
    
    // Get contract instance
    const ProductAuth = await ethers.getContractFactory("ProductAuth");
    const productAuth = ProductAuth.attach(contractAddress);
    
    // Get signers
    const [owner, manufacturer1, manufacturer2, user] = await ethers.getSigners();
    
    console.log("\n📋 Account Information:");
    console.log("Owner:", owner.address);
    console.log("Manufacturer 1:", manufacturer1.address);
    console.log("Manufacturer 2:", manufacturer2.address);
    console.log("User:", user.address);
    
    // Check owner
    console.log("\n👑 Checking contract owner...");
    const contractOwner = await productAuth.owner();
    console.log("Contract owner:", contractOwner);
    console.log("Is deployer the owner?", contractOwner === owner.address);
    
    // Authorize manufacturer
    console.log("\n🏭 Authorizing manufacturer...");
    const authTx = await productAuth.connect(owner).authorizeManufacturer(manufacturer1.address);
    await authTx.wait();
    console.log("✅ Manufacturer authorized");
    
    // Check authorization
    const isAuthorized = await productAuth.authorizedManufacturers(manufacturer1.address);
    console.log("Is manufacturer1 authorized?", isAuthorized);
    
    // Register a product
    console.log("\n📦 Registering product...");
    const serialNumber = "SN12345";
    const productName = "Smart Phone";
    const category = "Electronics";
    
    const registerTx = await productAuth.connect(manufacturer1).registerProduct(
      serialNumber,
      productName,
      category
    );
    const receipt = await registerTx.wait();
    console.log("✅ Product registered");
    
    // Check for events
    const events = receipt.logs.filter(log => {
      try {
        return productAuth.interface.parseLog(log).name === "ProductRegistered";
      } catch {
        return false;
      }
    });
    
    if (events.length > 0) {
      const parsedEvent = productAuth.interface.parseLog(events[0]);
      console.log("📡 ProductRegistered event emitted:");
      console.log("  Serial Number:", parsedEvent.args[0]);
      console.log("  Manufacturer:", parsedEvent.args[1]);
      console.log("  Product Name:", parsedEvent.args[2]);
      console.log("  Timestamp:", parsedEvent.args[3].toString());
    }
    
    // Verify the product
    console.log("\n🔍 Verifying product...");
    const [verified, mfr, name, cat, timestamp] = await productAuth.verifyProduct(serialNumber);
    console.log("Product Details:");
    console.log("  Verified:", verified);
    console.log("  Manufacturer:", mfr);
    console.log("  Name:", name);
    console.log("  Category:", cat);
    console.log("  Timestamp:", new Date(Number(timestamp) * 1000).toLocaleString());
    
    // Check if product is verified (simple check)
    const isVerified = await productAuth.isProductVerified(serialNumber);
    console.log("Is product verified?", isVerified);
    
    // Try to register duplicate product (should fail)
    console.log("\n❌ Trying to register duplicate product (should fail)...");
    try {
      await productAuth.connect(manufacturer1).registerProduct(
        serialNumber,
        "Duplicate Product",
        "Test"
      );
      console.log("❌ ERROR: Duplicate registration should have failed!");
    } catch (error) {
      if (error.message.includes("ProductAlreadyExists")) {
        console.log("✅ Correctly rejected duplicate product registration");
      } else {
        console.log("❌ Unexpected error:", error.message);
      }
    }
    
    // Try unauthorized manufacturer registration (should fail)
    console.log("\n❌ Trying unauthorized manufacturer registration (should fail)...");
    try {
      await productAuth.connect(manufacturer2).registerProduct(
        "SN99999",
        "Unauthorized Product",
        "Test"
      );
      console.log("❌ ERROR: Unauthorized registration should have failed!");
    } catch (error) {
      if (error.message.includes("UnauthorizedAccess")) {
        console.log("✅ Correctly rejected unauthorized manufacturer");
      } else {
        console.log("❌ Unexpected error:", error.message);
      }
    }
    
    // Check non-existent product
    console.log("\n🔍 Checking non-existent product...");
    const nonExistentVerified = await productAuth.isProductVerified("NONEXISTENT");
    console.log("Non-existent product verified?", nonExistentVerified);
    
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