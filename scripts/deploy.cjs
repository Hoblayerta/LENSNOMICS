const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log('🚀 Starting deployment to Lens Network Sepolia Testnet...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📡 Connected to Lens Network Sepolia Testnet');
  console.log('🔑 Deploying with account:', deployer.address);

  try {
    // Check wallet balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log('💰 Wallet balance:', ethers.formatEther(balance), 'ETH');

    if (balance.toString() === '0') {
      throw new Error('La wallet no tiene fondos. Por favor, asegúrate de tener ETH en la testnet de Lens Network Sepolia.');
    }

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

    // Create or update .env file
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `FACTORY_ADDRESS=${factoryAddress}\n`;
    fs.writeFileSync(envPath, envContent, { flag: 'a' });

    // Set environment variable for immediate use
    process.env.FACTORY_ADDRESS = factoryAddress;

    console.log('✨ Deployment completed successfully!');
    return { success: true, factoryAddress };
  } catch (error) {
    console.error('❌ Error durante el deployment:', error instanceof Error ? error.message : String(error));
    console.error('\n🔍 Detalles adicionales:');
    console.error('- Asegúrate de que la private key es correcta');
    console.error('- Verifica que la wallet tiene fondos en Lens Network Sepolia Testnet');
    console.error('- Comprueba la conexión con la red');
    process.exit(1);
  }
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });