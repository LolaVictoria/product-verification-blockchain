const fs = require("fs");
const path = require("path");

async function main() {
  const contractName = "ProductAuth";
  
  // Path to the compiled contract artifact
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);
  
  if (!fs.existsSync(artifactPath)) {
    console.error(`❌ Contract artifact not found at: ${artifactPath}`);
    console.log("Make sure you've compiled the contract first:");
    console.log("npx hardhat compile");
    return;
  }
  
  // Read the artifact file
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Extract ABI
  const abi = artifact.abi;
  
  // Create output directory
  const outputDir = path.join(__dirname, "..", "abi");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save ABI to separate file
  const abiPath = path.join(outputDir, `${contractName}.json`);
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  
  console.log(`✅ ABI extracted successfully!`);
  console.log(`📁 Saved to: ${abiPath}`);
  
  // Also create a JavaScript module export version
  const jsPath = path.join(outputDir, `${contractName}.js`);
  const jsContent = `const ${contractName}ABI = ${JSON.stringify(abi, null, 2)};

module.exports = ${contractName}ABI;
`;
  fs.writeFileSync(jsPath, jsContent);
  console.log(`📁 JS module saved to: ${jsPath}`);
  
  // Create TypeScript declaration file
  const tsPath = path.join(outputDir, `${contractName}.d.ts`);
  const tsContent = `export declare const ${contractName}ABI: any[];
export default ${contractName}ABI;
`;
  fs.writeFileSync(tsPath, tsContent);
  console.log(`📁 TypeScript declaration saved to: ${tsPath}`);
  
  // Create a combined info file with contract address
  const deploymentInfoPath = path.join(__dirname, "..", "deployment-info.json");
  let contractInfo = {
    contractName: contractName,
    abi: abi
  };
  
  if (fs.existsSync(deploymentInfoPath)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"));
    contractInfo = {
      ...deploymentInfo,
      abi: abi
    };
  }
  
  const infoPath = path.join(outputDir, `${contractName}-info.json`);
  fs.writeFileSync(infoPath, JSON.stringify(contractInfo, null, 2));
  console.log(`📁 Contract info with ABI saved to: ${infoPath}`);
  
  // Print some useful information
  console.log("\n📊 ABI Summary:");
  console.log(`Functions: ${abi.filter(item => item.type === 'function').length}`);
  console.log(`Events: ${abi.filter(item => item.type === 'event').length}`);
  console.log(`Errors: ${abi.filter(item => item.type === 'error').length}`);
  
  console.log("\n🔧 Function signatures:");
  abi.filter(item => item.type === 'function').forEach(func => {
    const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
    console.log(`  ${func.name}(${inputs})`);
  });
  
  console.log("\n📡 Events:");
  abi.filter(item => item.type === 'event').forEach(event => {
    const inputs = event.inputs.map(input => `${input.type} ${input.name}`).join(', ');
    console.log(`  ${event.name}(${inputs})`);
  });
  
  console.log("\n❌ Custom Errors:");
  abi.filter(item => item.type === 'error').forEach(error => {
    const inputs = error.inputs.map(input => `${input.type} ${input.name}`).join(', ');
    console.log(`  ${error.name}(${inputs})`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error extracting ABI:", error);
    process.exit(1);
  });