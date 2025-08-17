//run this script in terminal to generate a clean contract_abi.json in project root to be used in backend/frontend to interact with the contract at contract/deployed address:
//node export-abi.js


const fs = require("fs");
const path = require("path");



async function main() {
  // Path to the Hardhat artifact for ProductAuth
  const artifactPath = path.resolve(
    __dirname,
    "artifacts/contracts/ProductAuth.sol/ProductAuth.json"
  );

  // Read artifact
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Extract ABI
  const abi = artifact.abi;

  // Save ABI into contract_abi.json
  const abiPath = path.resolve(__dirname, "contract_abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));

  console.log("✅ ABI exported to contract_abi.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
