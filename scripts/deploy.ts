import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Starting deployment to Lens Network Sepolia Testnet...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📡 Connected to Lens Network Sepolia Testnet');
  console.log('🔑 Deploying with account:', deployer.address);

  try {
    // Deploy Community Token Factory
    console.log('\n📄 Deploying Community Token Factory...');
    const CommunityTokenFactory = await ethers.getContractFactory('CommunityTokenFactory');
    const factory = await CommunityTokenFactory.deploy();
    await factory.waitForDeployment();

    const factoryAddress = await factory.getAddress();
    console.log('✅ Community Token Factory deployed to:', factoryAddress);

    // Write deployment information to a JSON file
    const deploymentInfo = {
      networkName: 'Lens Network Sepolia Testnet',
      chainId: 37111,
      factoryAddress,
      timestamp: new Date().toISOString(),
    };

    const deploymentPath = path.join(__dirname, '..', 'deployment.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('\n📝 Deployment info saved to deployment.json');

    // Update environment variables
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      // File doesn't exist, create it
    }

    // Update or add FACTORY_ADDRESS
    if (envContent.includes('FACTORY_ADDRESS=')) {
      envContent = envContent.replace(/FACTORY_ADDRESS=.*\n/, `FACTORY_ADDRESS=${factoryAddress}\n`);
    } else {
      envContent += `\nFACTORY_ADDRESS=${factoryAddress}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('\n✨ Deployment completed successfully!');

    return { success: true, factoryAddress };
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Run the deployment
main()
  .then((result) => {
    if (!result.success) {
      console.error('Deployment failed:', result.error);
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
