import { parseEther } from 'viem';
import { config } from './config';

// LENI token contract address
const LENI_TOKEN_ADDRESS = "0xC94E29B30D5A33556C26e8188B3ce3c6d1003F86";
const POST_FEE = "1"; // 1 LENI token per post

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
    name: 'payPostFee',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'poster', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

export const getTokenBalance = async (address: string) => {
  try {
    const data = await config.publicClient.readContract({
      address: LENI_TOKEN_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });

    return data.toString();
  } catch (error) {
    console.error("Error fetching LENI token balance:", error);
    return "0";
  }
};

export const handlePostFee = async (userAddress: string) => {
  try {
    const feeAmount = parseEther(POST_FEE);

    // Prepare the transaction to call payPostFee
    const { request } = await config.publicClient.simulateContract({
      address: LENI_TOKEN_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: 'payPostFee',
      args: [userAddress as `0x${string}`],
      account: userAddress as `0x${string}`,
    });

    // Get the wallet client and execute the transaction
    const walletClient = await config.publicClient.walletClient();
    const hash = await walletClient.writeContract(request);

    // Wait for transaction confirmation
    await config.publicClient.waitForTransactionReceipt({ hash });

    console.log('Post fee paid successfully:', hash);
    return true;
  } catch (error) {
    console.error("Error handling LENI token post fee:", error);
    throw new Error("Failed to process LENI token post fee. Make sure you have enough tokens and have approved the transaction.");
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