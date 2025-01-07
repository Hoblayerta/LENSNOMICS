import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  analytics: false,
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
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ""],
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

export default config;