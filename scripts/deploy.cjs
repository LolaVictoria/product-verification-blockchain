const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the contract factory - UPDATED CONTRACT NAME
  const ElectronicsAuthentication = await ethers.getContractFactory("ElectronicsAuthentication");
  
  // Deploy the contract
  console.log("🚀 Deploying ElectronicsAuthentication contract...");
  const electronicsAuth = await ElectronicsAuthentication.deploy();
  
  // Wait for deployment to complete
  await electronicsAuth.waitForDeployment();
  const contractAddress = await electronicsAuth.getAddress();
  
  console.log("✅ ElectronicsAuthentication deployed to:", contractAddress);
  
  // Get deployer address
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployed by:", deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // Check pre-loaded manufacturers
  console.log("\n🏭 Checking pre-loaded manufacturers...");
  try {
    const isAppleVerified = await electronicsAuth.verifiedManufacturers("0x742d35Cc622C4532c0532255c87A59B852b74f8d");
    const isSamsungVerified = await electronicsAuth.verifiedManufacturers("0x8ba1f109551bD432803012645Hac136c461c11B6");
    console.log("Apple verified:", isAppleVerified);
    console.log("Samsung verified:", isSamsungVerified);
  } catch (error) {
    console.log("⚠️  Could not check pre-loaded manufacturers:", error.message);
  }
  
  // Save deployment info
  const networkName = network.name;
  const deploymentInfo = {
    contractName: "ElectronicsAuthentication",
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: networkName,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info to file (network-specific)
  const deploymentFile = path.join(deploymentsDir, `ElectronicsAuthentication-${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  // Also update the root deployment-info.json for backward compatibility
  fs.writeFileSync(
    path.join(__dirname, "..", "deployment-info.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("📁 Deployment info saved to:", deploymentFile);
  
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("\n🔗 Useful links:");
    const etherscanUrl = networkName === "mainnet" 
      ? `https://etherscan.io/address/${contractAddress}`
      : `https://${networkName}.etherscan.io/address/${contractAddress}`;
    console.log(`Etherscan: ${etherscanUrl}`);
    console.log(`Add to MetaMask: ${contractAddress}`);
  }
  
  console.log("\n🎉 Deployment completed successfully!");
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });