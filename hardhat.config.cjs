require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  analytics: false, // Disable analytics
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    lensTestnet: {
      url: "https://rpc.testnet.lens.dev",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 37111,
      timeout: 120000,
      gasPrice: "auto",
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
