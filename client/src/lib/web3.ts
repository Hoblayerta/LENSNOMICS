import { ethers } from 'ethers';
import { createWalletClient, custom, parseEther } from 'viem';
import { config } from './config';

// Community token contract address (to be replaced with actual deployment)
const COMMUNITY_TOKEN_ADDRESS = import.meta.env.VITE_COMMUNITY_TOKEN_ADDRESS || "0x123...";
const POST_FEE = "0.1"; // 0.1 tokens per post

// Token ABI for the minimal interface we need
const TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

export const connectWallet = async () => {
  try {
    if (!window.ethereum) throw new Error("No crypto wallet found");

    const walletClient = createWalletClient({
      chain: config.chains[0],
      transport: custom(window.ethereum)
    });
    const [address] = await walletClient.requestAddresses();
    const provider = walletClient.getProvider();

    // Register user in the backend
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });

    return {
      provider: provider,
      signer: walletClient,
      address
    };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
};

export const disconnectWallet = async () => {
  //  No action needed here for viem
};

export const getTokenBalance = async (address: string) => {
  try {
    const data = await config.publicClient.readContract({
      address: COMMUNITY_TOKEN_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });

    return data.toString();
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return "0";
  }
};

export const handlePostFee = async (address: string) => {
  try {
    const feeAmount = parseEther(POST_FEE);

    const { request } = await config.publicClient.simulateContract({
      address: COMMUNITY_TOKEN_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: 'transfer',
      args: [COMMUNITY_TOKEN_ADDRESS as `0x${string}`, feeAmount],
      account: address as `0x${string}`,
    });

    const hash = await config.publicClient.writeContract(request);
    await config.publicClient.waitForTransactionReceipt({ hash });
    return true;
  } catch (error) {
    console.error("Error handling post fee:", error);
    throw new Error("Failed to process post fee");
  }
};

export const hasEnoughTokens = async (address: string) => {
  const balance = await getTokenBalance(address);
  return BigInt(balance) >= parseEther(POST_FEE);
};

declare global {
  interface Window {
    ethereum: any;
  }
}