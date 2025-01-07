import { parseEther } from 'viem';
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

    const walletClient = await config.publicClient.walletClient();
    const hash = await walletClient.writeContract(request);
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