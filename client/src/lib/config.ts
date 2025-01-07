import { createConfig, mainnet } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { LensConfig, development } from '@lens-protocol/client';

// Configure wagmi client
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

// Lens Protocol configuration
export const lensConfig: LensConfig = {
  environment: development
};

// Wagmi client configuration
export const config = createConfig({
  publicClient,
});