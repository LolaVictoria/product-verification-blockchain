const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const registry = await hre.ethers.getContractAt("ProductRegistry", "YOUR_CONTRACT_ADDRESS");

  const tx = await registry.registerProduct("Phone Model X", "SN123456");
  await tx.wait();

  const product = await registry.verifyProduct("SN123456");
  console.log("Product:", product);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
