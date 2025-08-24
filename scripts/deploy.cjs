const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // Get the signers (test accounts for localhost, your wallet for other networks)
    const [deployer, account1, account2] = await ethers.getSigners();
    
    console.log("🌐 Network:", network.name);
    console.log("👤 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    
    // Show if we're using test accounts (localhost) or real wallet
    if (network.name === "localhost" || network.name === "hardhat") {
        console.log("🧪 Using LOCAL TEST ACCOUNT - No real funds at risk!");
        console.log("Available test accounts:", (await ethers.getSigners()).length);
    } else {
        console.log("💳 Using REAL WALLET - Real funds will be used for gas!");
    }

    // Get the contract factory
    const ElectronicsAuthentication = await ethers.getContractFactory("ElectronicsAuthentication");
    
    // Deploy the contract
    console.log("🚀 Deploying ElectronicsAuthentication contract...");
    const electronicsAuth = await ElectronicsAuthentication.deploy();
    
    // Wait for deployment to complete
    await electronicsAuth.waitForDeployment();
    const contractAddress = await electronicsAuth.getAddress();
    
    console.log("✅ ElectronicsAuthentication deployed to:", contractAddress);
    console.log("👤 Deployed by:", deployer.address);
    console.log("💰 Remaining balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    
    // Get transaction details
    const deployTx = electronicsAuth.deploymentTransaction();
    console.log("📋 Transaction hash:", deployTx.hash);
    console.log("⛽ Gas used:", deployTx.gasLimit.toString());

    // Check pre-loaded manufacturers
    console.log("\n🏭 Checking pre-loaded manufacturers...");
    try {
        // Fixed the addresses to match your constructor
        const isNexlifyVerified = await electronicsAuth.verifiedManufacturers("0x742D35cc622c4532C0532255C87a59B852b74f8D");
        const isQuantumVerified = await electronicsAuth.verifiedManufacturers("0x051051074B7BbfaB5bB1A72432129118218cDe97");
        const isStellarVerified = await electronicsAuth.verifiedManufacturers("0x456DEf123ABC78901234567890abCdef12345678");
        
        console.log("Nexlify Tech verified:", isNexlifyVerified);
        console.log("Quantum Mobile verified:", isQuantumVerified);
        console.log("Stellar Devices verified:", isStellarVerified);
        
        // Check admin
        const admin = await electronicsAuth.admin();
        console.log("📋 Contract admin:", admin);
        console.log("✅ Admin matches deployer:", admin === deployer.address);
        
    } catch (error) {
        console.log("⚠️ Could not check pre-loaded manufacturers:", error.message);
    }

    // Save deployment info
    const networkName = network.name;
    const deploymentInfo = {
        contractName: "ElectronicsAuthentication",
        contractAddress: contractAddress,
        deployer: deployer.address,
        network: networkName,
        timestamp: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        transactionHash: deployTx.hash,
        gasUsed: deployTx.gasLimit.toString()
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
        
        // Verification reminder
        console.log("\n🔍 To verify contract on Etherscan:");
        console.log(`npx hardhat verify --network ${networkName} ${contractAddress}`);
    } else {
        console.log("\n🧪 Local deployment complete! Contract is ready for testing.");
        console.log("💡 You can interact with it using:");
        console.log(`npx hardhat console --network localhost`);
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