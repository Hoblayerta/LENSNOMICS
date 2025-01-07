import { createConfig, configureChains } from 'wagmi';
import { polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { getDefaultConfig } from "connectkit";
import { LensClient, development } from '@lens-protocol/client';

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygonMumbai],
  [publicProvider()]
);

// Fallback to a test project ID if not provided
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

// Initialize Lens Protocol client
export const lensClient = new LensClient({
  environment: development
});

// Export chains for use in other parts of the app
export { chains };

// Export types
export type ProfileType = Awaited<ReturnType<typeof lensClient.profile.fetch>>;