import {
  createThirdwebClient,
  getContract,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Create the thirdweb client
const client = createThirdwebClient({
  clientId: "19767ce00287f7b76207566f400a8f48",
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

// Get contract instance
export const getSignedContract = async () => {
  const wallet = await client.wallet.connect();

  if (!wallet) {
    throw new Error("No wallet connected");
  }

  return getContract({
    client,
    chain: defineChain(37111),
    address: "0xC94E29B30D5A33556C26e8188B3ce3c6d1003F86",
    abi: LENI_ABI,
  });
};