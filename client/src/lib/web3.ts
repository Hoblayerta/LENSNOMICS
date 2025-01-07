import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

export const providerOptions = {
  // Add custom providers here
};

export const web3Modal = new Web3Modal({
  network: "mainnet",
  cacheProvider: true,
  providerOptions
});

export const connectWallet = async () => {
  try {
    const provider = await web3Modal.connect();
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const address = await signer.getAddress();
    
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
  await web3Modal.clearCachedProvider();
};

export const getTokenBalance = async (tokenAddress: string, userAddress: string, provider: ethers.providers.Web3Provider) => {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function balanceOf(address) view returns (uint256)'],
    provider
  );
  
  const balance = await tokenContract.balanceOf(userAddress);
  return ethers.utils.formatEther(balance);
};
