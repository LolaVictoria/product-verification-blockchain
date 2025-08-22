const fs = require("fs");
const path = require("path");

async function main() {
  const contractName = "ElectronicsAuthentication"; // UPDATED: Changed from ProductAuth
  
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
  
  // NEW: Create a simplified ABI for frontend use (only essential functions)
  const frontendEssentials = abi.filter(item => {
    if (item.type === 'function') {
      // Include only public/external view functions and key state-changing functions
      const essentialFunctions = [
        'verifyDevice',
        'verifyMultipleDevices', 
        'getDeviceDetails',
        'getOwnershipHistory',
        'getOwnerDevices',
        'serialExists',
        'registerDevice',
        'transferOwnership',
        'isManufacturerAuthorized',
        'getAllAuthorizedManufacturers',
        'admin',
        'verifiedManufacturers'
      ];
      return essentialFunctions.includes(item.name);
    }
    if (item.type === 'event') {
      // Include key events
      const essentialEvents = [
        'DeviceRegistered',
        'OwnershipTransferred',
        'DeviceVerified',
        'ManufacturerAuthorized'
      ];
      return essentialEvents.includes(item.name);
    }
    return item.type === 'error'; // Include all errors
  });
  
  const frontendPath = path.join(outputDir, `${contractName}-frontend.json`);
  fs.writeFileSync(frontendPath, JSON.stringify(frontendEssentials, null, 2));
  console.log(`📁 Frontend-optimized ABI saved to: ${frontendPath}`);
  
  // Print some useful information
  console.log("\n📊 ABI Summary:");
  console.log(`Functions: ${abi.filter(item => item.type === 'function').length}`);
  console.log(`Events: ${abi.filter(item => item.type === 'event').length}`);
  console.log(`Errors: ${abi.filter(item => item.type === 'error').length}`);
  console.log(`Constructor: ${abi.filter(item => item.type === 'constructor').length}`);
  
  console.log("\n🔧 Public Functions:");
  abi.filter(item => item.type === 'function' && (item.stateMutability === 'view' || item.stateMutability === 'pure'))
     .forEach(func => {
    const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
    const outputs = func.outputs ? func.outputs.map(output => output.type).join(', ') : 'void';
    console.log(`  📖 ${func.name}(${inputs}) → ${outputs}`);
  });
  
  console.log("\n⚡ State-Changing Functions:");
  abi.filter(item => item.type === 'function' && item.stateMutability !== 'view' && item.stateMutability !== 'pure')
     .forEach(func => {
    const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
    console.log(`  ✍️  ${func.name}(${inputs})`);
  });
  
  console.log("\n📡 Events:");
  abi.filter(item => item.type === 'event').forEach(event => {
    const inputs = event.inputs.map(input => {
      const indexed = input.indexed ? ' indexed' : '';
      return `${input.type}${indexed} ${input.name}`;
    }).join(', ');
    console.log(`  📢 ${event.name}(${inputs})`);
  });
  
  console.log("\n❌ Custom Errors:");
  const errors = abi.filter(item => item.type === 'error');
  if (errors.length > 0) {
    errors.forEach(error => {
      const inputs = error.inputs.map(input => `${input.type} ${input.name}`).join(', ');
      console.log(`  🚫 ${error.name}(${inputs})`);
    });
  } else {
    console.log("  No custom errors defined");
  }
  
  // NEW: Generate usage examples
  console.log("\n💡 Usage Examples:");
  console.log("JavaScript/Node.js:");
  console.log(`  const abi = require('./abi/${contractName}.js');`);
  console.log(`  const contract = new ethers.Contract(address, abi, provider);`);
  console.log(`  const result = await contract.verifyDevice("SERIAL123");`);
  
  console.log("\nReact/Frontend:");
  console.log(`  import abi from './abi/${contractName}.json';`);
  console.log(`  const contract = new ethers.Contract(address, abi, signer);`);
  
  console.log("\nTypeScript:");
  console.log(`  import { ${contractName}ABI } from './abi/${contractName}';`);
  console.log(`  const contract = new ethers.Contract(address, ${contractName}ABI, provider);`);
  
  // NEW: Generate contract interface summary
  const interfacePath = path.join(outputDir, `${contractName}-interface.md`);
  let interfaceContent = `# ${contractName} Contract Interface\n\n`;
  interfaceContent += `Generated on: ${new Date().toISOString()}\n\n`;
  
  interfaceContent += `## Contract Address\n`;
  if (fs.existsSync(deploymentInfoPath)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"));
    interfaceContent += `- **${deploymentInfo.network || 'Unknown'}**: \`${deploymentInfo.contractAddress || 'Not deployed'}\`\n\n`;
  }
  
  interfaceContent += `## View Functions (Free to call)\n\n`;
  abi.filter(item => item.type === 'function' && (item.stateMutability === 'view' || item.stateMutability === 'pure'))
     .forEach(func => {
    const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
    const outputs = func.outputs ? func.outputs.map(output => output.type).join(', ') : 'void';
    interfaceContent += `### \`${func.name}(${inputs}) → ${outputs}\`\n\n`;
  });
  
  interfaceContent += `## State-Changing Functions (Require gas)\n\n`;
  abi.filter(item => item.type === 'function' && item.stateMutability !== 'view' && item.stateMutability !== 'pure')
     .forEach(func => {
    const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
    interfaceContent += `### \`${func.name}(${inputs})\`\n\n`;
  });
  
  interfaceContent += `## Events\n\n`;
  abi.filter(item => item.type === 'event').forEach(event => {
    const inputs = event.inputs.map(input => {
      const indexed = input.indexed ? ' indexed' : '';
      return `${input.type}${indexed} ${input.name}`;
    }).join(', ');
    interfaceContent += `### \`${event.name}(${inputs})\`\n\n`;
  });
  
  fs.writeFileSync(interfacePath, interfaceContent);
  console.log(`📁 Interface documentation saved to: ${interfacePath}`);
  
  console.log("\n🎉 ABI extraction completed successfully!");
  console.log(`\n📂 Generated files:`);
  console.log(`  - ${contractName}.json (Raw ABI)`);
  console.log(`  - ${contractName}.js (JavaScript module)`);
  console.log(`  - ${contractName}.d.ts (TypeScript declarations)`);
  console.log(`  - ${contractName}-info.json (ABI + deployment info)`);
  console.log(`  - ${contractName}-frontend.json (Essential functions only)`);
  console.log(`  - ${contractName}-interface.md (Documentation)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error extracting ABI:", error);
    process.exit(1);
  });