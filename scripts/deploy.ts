import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

async function main() {
  console.log('🚀 Starting deployment to Lens Network Sepolia Testnet...');

  // Connect to the network
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lens.dev');
  
  // Load deployer wallet from private key
  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || '', provider);
  
  console.log('📡 Connected to Lens Network Sepolia Testnet');
  console.log('🔑 Deploying with account:', deployer.address);

  // Deploy Community Token Factory
  console.log('\n📄 Deploying Community Token Factory...');
  const CommunityTokenFactory = await ethers.getContractFactory('CommunityTokenFactory', deployer);
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

  writeFileSync(
    join(__dirname, '..', 'deployment.json'),
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
