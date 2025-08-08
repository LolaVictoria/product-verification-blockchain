import hre from "hardhat";

async function main() {
  const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
  const registry = await ProductRegistry.deploy();

  await registry.waitForDeployment(); 

  const deployedAddress = await registry.getAddress();
  console.log("Contract deployed to:", deployedAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
