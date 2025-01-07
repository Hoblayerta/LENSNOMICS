const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log('🚀 Starting deployment to Lens Network Sepolia Testnet...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();

  console.log('📡 Connected to Lens Network Sepolia Testnet');
  console.log('🔑 Deploying with account:', deployer.address);

  // Deploy Community Token Factory
  console.log('\n📄 Deploying Community Token Factory...');
  const CommunityTokenFactory = await ethers.getContractFactory('CommunityTokenFactory');
  const factory = await CommunityTokenFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log('✅ Community Token Factory deployed to:', factoryAddress);

  // Write deployment information
  const deploymentInfo = {
    networkName: 'Lens Network Sepolia Testnet',
    chainId: 37111,
    factoryAddress,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('\n📝 Deployment information saved to deployment.json');
  console.log('\n✨ Deployment completed successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
