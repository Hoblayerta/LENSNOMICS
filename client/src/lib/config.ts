import { createConfig, configureChains } from 'wagmi';
import { Chain } from 'viem';
import { publicProvider } from 'wagmi/providers/public';
import { getDefaultConfig } from "connectkit";
import { LensClient, development } from '@lens-protocol/client';

// Define Lens Network Sepolia Testnet
export const lensTestnet = {
  id: 37111,
  name: 'Lens Network Sepolia Testnet',
  network: 'lens-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'GRASS',
    symbol: 'GRASS',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.lens.dev'],
    },
    public: {
      http: ['https://rpc.testnet.lens.dev'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Lens Block Explorer',
      url: 'https://block-explorer.testnet.lens.dev',
    },
  },
  testnet: true,
} as const satisfies Chain;

// Configure chains & providers with Lens testnet
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [lensTestnet],
  [publicProvider()]
);

// Wallet Connect project ID from environment variables
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'test-project-id';

// Set up wagmi config with ConnectKit
export const config = createConfig(
  getDefaultConfig({
    autoConnect: true,
    appName: "Community Hub",
    walletConnectProjectId: projectId,
    chains,
    publicClient,
    webSocketPublicClient,
  })
);

// Initialize Lens Protocol client with testnet environment
export const lensClient = new LensClient({
  environment: development
});

// Export chains for use in other parts of the app
export { chains };

// Export types
export type ProfileType = Awaited<ReturnType<typeof lensClient.profile.fetch>>;