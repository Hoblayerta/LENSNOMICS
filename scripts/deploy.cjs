const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Disable analytics
  process.env.HARDHAT_ANALYTICS_DISABLED = 1;

  console.log('🚀 Starting deployment to Lens Network Sepolia Testnet...');

  // Verify private key
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("❌ DEPLOYER_PRIVATE_KEY environment variable is required");
  }

  try {
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log('📡 Connected to Lens Network Sepolia Testnet');
    console.log('🔑 Deploying with account:', deployer.address);

    // Check wallet balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log('💰 Wallet balance:', ethers.formatEther(balance), 'ETH');

    if (balance.toString() === '0') {
      throw new Error('❌ Wallet has no funds. Please ensure you have ETH in the Lens Network Sepolia testnet.');
    }

    // Deploy Community Token Factory
    console.log('\n📄 Deploying Community Token Factory...');
    const CommunityTokenFactory = await ethers.getContractFactory('CommunityTokenFactory');
    const factory = await CommunityTokenFactory.deploy();
    await factory.waitForDeployment();

    const factoryAddress = await factory.getAddress();
    console.log('✅ Community Token Factory deployed to:', factoryAddress);

    // Write deployment information to files
    const deploymentInfo = {
      networkName: 'Lens Network Sepolia Testnet',
      chainId: 37111,
      factoryAddress,
      timestamp: new Date().toISOString(),
    };

    // Save deployment info
    const deploymentPath = path.join(__dirname, '..', 'deployment.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('\n📝 Deployment info saved to deployment.json');

    // Update .env with factory address
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace or add FACTORY_ADDRESS
    if (envContent.includes('FACTORY_ADDRESS=')) {
      envContent = envContent.replace(/FACTORY_ADDRESS=.*\n/, `FACTORY_ADDRESS=${factoryAddress}\n`);
    } else {
      envContent += `\nFACTORY_ADDRESS=${factoryAddress}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✨ Environment variables updated with factory address');

    return { success: true, factoryAddress };
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\n🔍 Additional troubleshooting:');
    console.error('- Verify your private key is correct');
    console.error('- Ensure your wallet has funds on Lens Network Sepolia Testnet');
    console.error('- Check network connection and RPC endpoint');
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;