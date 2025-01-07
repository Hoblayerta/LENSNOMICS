import {
  createThirdwebClient,
  getContract,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Lens Network Sepolia Testnet configuration
const lensTestnet = defineChain({
  id: 37111,
  name: "Lens Network Sepolia Testnet",
  nativeCurrency: {
    name: "GRASS",
    symbol: "GRASS",
    decimals: 18,
  },
  rpc: "https://rpc.testnet.lens.dev",
  blockExplorer: {
    name: "Lens Block Explorer",
    url: "https://block-explorer.testnet.lens.dev",
  },
});

// Create the thirdweb client
export const client = createThirdwebClient({
  clientId: "19767ce00287f7b76207566f400a8f48",
  secretKey: "kmJk4v8asibpNtEHxkcUfJCChlDWEqJe2I36Z98fg03Ph4lvtlq7vpAA7V-VJTKOpi_o0AD_5MmE15I9DPn6PA",
});

// LENI token contract interface
const LENI_ABI = [
  {
    type: "function",
    name: "mint",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable"
  }
] as const;

// Initialize LENI token contract
export const leniContract = getContract({
  client,
  chain: lensTestnet,
  address: "0xC94E29B30D5A33556C26e8188B3ce3c6d1003F86",
  abi: LENI_ABI,
});

// Function to get a contract instance with signer
export const getSignedContract = async () => {
  const wallet = await client.wallet.getConnectedWallet();
  if (!wallet) throw new Error("No wallet connected");

  return getContract({
    client,
    chain: lensTestnet,
    address: "0xC94E29B30D5A33556C26e8188B3ce3c6d1003F86",
    abi: LENI_ABI,
    wallet,
  });
};