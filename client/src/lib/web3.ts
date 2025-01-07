import { parseEther } from 'viem';
import { leniContract } from './contract';

// Constants
const POST_FEE = "1"; // 1 LENI token per post

export const getTokenBalance = async (address: string) => {
  try {
    const balance = await leniContract.read("balanceOf", [address]);
    return balance.toString();
  } catch (error) {
    console.error("Error fetching LENI token balance:", error);
    return "0";
  }
};

export const handlePostFee = async (userAddress: string) => {
  try {
    const feeAmount = parseEther(POST_FEE);

    // Call the contract to burn tokens
    const tx = await leniContract.write("transfer", [
      "0x000000000000000000000000000000000000dEaD", // Burn address
      feeAmount
    ]);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('LENI tokens burned successfully:', receipt.transactionHash);
    return true;
  } catch (error) {
    console.error("Error burning LENI tokens:", error);
    throw new Error("Failed to burn LENI tokens. Make sure you have enough tokens and have approved the transaction.");
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