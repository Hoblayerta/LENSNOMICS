import { parseEther } from 'viem';
import { getSignedContract } from './contract';

// Constants
const POST_FEE = "1"; // 1 LENI token per post

export const getTokenBalance = async (address: string) => {
  try {
    const contract = await getSignedContract();
    const balanceResult = await contract.prepare("balanceOf", [address]).execute();
    return balanceResult.toString();
  } catch (error) {
    console.error("Error fetching LENI token balance:", error);
    return "0";
  }
};

export const handlePostFee = async (userAddress: string) => {
  try {
    const feeAmount = parseEther(POST_FEE);

    // Get contract with signer
    const contract = await getSignedContract();

    // Prepare and execute the transfer transaction
    const transaction = await contract.prepare("transfer", [
      "0x000000000000000000000000000000000000dEaD", // Burn address
      feeAmount
    ]);

    const result = await transaction.execute();
    await result.wait();

    console.log('LENI tokens burned successfully:', result.hash);
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