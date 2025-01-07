import { ethers } from 'ethers';
import { createPublicClient, http, parseEther } from 'viem';

// Community token contract address (to be replaced with actual deployment)
const COMMUNITY_TOKEN_ADDRESS = import.meta.env.VITE_COMMUNITY_TOKEN_ADDRESS || "0x123...";
const POST_FEE = "0.1"; // 0.1 tokens per post

// Token ABI for the minimal interface we need
const TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
];

export const connectWallet = async () => {
  try {
    if (!web3Modal) throw new Error("Web3Modal not initialized");

    const provider = await web3Modal.connect();
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const address = await signer.getAddress();

    // Register user in the backend
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });

    return {
      provider: ethersProvider,
      signer,
      address
    };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
};

export const disconnectWallet = async () => {
  if (web3Modal) {
    await web3Modal.clearCachedProvider();
  }
};

export const getTokenBalance = async (userAddress: string, provider: any) => {
  try {
    const tokenContract = new ethers.Contract(
      COMMUNITY_TOKEN_ADDRESS,
      TOKEN_ABI,
      provider
    );

    const balance = await tokenContract.balanceOf(userAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return "0";
  }
};

export const handlePostFee = async (signer: any) => {
  try {
    const tokenContract = new ethers.Contract(
      COMMUNITY_TOKEN_ADDRESS,
      TOKEN_ABI,
      signer
    );

    // Convert fee to wei
    const feeAmount = parseEther(POST_FEE);

    // First approve the contract to spend tokens
    const approveTx = await tokenContract.approve(COMMUNITY_TOKEN_ADDRESS, feeAmount);
    await approveTx.wait();

    // Transfer tokens for the post fee
    const transferTx = await tokenContract.transferFrom(
      await signer.getAddress(),
      COMMUNITY_TOKEN_ADDRESS,
      feeAmount
    );
    await transferTx.wait();

    return true;
  } catch (error) {
    console.error("Error handling post fee:", error);
    throw new Error("Failed to process post fee");
  }
};

export const hasEnoughTokens = async (userAddress: string, provider: any) => {
  const balance = await getTokenBalance(userAddress, provider);
  return parseFloat(balance) >= parseFloat(POST_FEE);
};

// Configure web3modal for wallet connection
const providerOptions = {
  // Add custom providers here if needed
};

const web3Modal = typeof window !== 'undefined' ? new Web3Modal({
  network: "testnet", // Using testnet for development
  cacheProvider: true,
  providerOptions
}) : null;