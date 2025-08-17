const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the contract factory
  const ProductAuth = await ethers.getContractFactory("ProductAuth");
  
  // Deploy the contract
  console.log("Deploying ProductAuth contract...");
  const productAuth = await ProductAuth.deploy();
  
  // Wait for deployment to complete
  await productAuth.waitForDeployment();
  
  const contractAddress = await productAuth.getAddress();
  console.log("ProductAuth deployed to:", contractAddress);
  
  // Get deployer address
  const [deployer] = await ethers.getSigners();
  console.log("Deployed by:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // Save deployment info
  const networkName = network.name;
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: networkName,
    timestamp: new Date().toISOString()
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info to file (network-specific)
  const deploymentFile = path.join(deploymentsDir, `ProductAuth-${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  // Also update the root deployment-info.json for backward compatibility
  fs.writeFileSync(
    path.join(__dirname, "..", "deployment-info.json"), 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to:", deploymentFile);
  
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("\n🔗 Useful links:");
    console.log(`Etherscan: https://${networkName === "mainnet" ? "" : networkName + "."}etherscan.io/address/${contractAddress}`);
    console.log(`Add to MetaMask: ${contractAddress}`);
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });