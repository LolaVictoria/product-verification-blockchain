const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    // Load deployment info
    const deploymentPath = path.join(__dirname, "..", "deployment-info.json");
    
    if (!fs.existsSync(deploymentPath)) {
      console.error("❌ Deployment file not found. Please deploy first.");
      return;
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contractAddress = deploymentInfo.contractAddress;
    
    console.log("🔍 Verifying contract on Etherscan...");
    console.log("Contract Address:", contractAddress);
    
    // Verify the contract on Etherscan
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // Your contract constructor has no arguments
    });
    
    console.log("✅ Contract verified successfully!");
    
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});