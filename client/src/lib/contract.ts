import {
  createThirdwebClient,
  getContract,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Lens Network Sepolia Testnet configuration
const lensTestnet = defineChain(37111);

// Create the thirdweb client
export const client = createThirdwebClient({
  clientId: "19767ce00287f7b76207566f400a8f48",
  secretKey: "kmJk4v8asibpNtEHxkcUfJCChlDWEqJe2I36Z98fg03Ph4lvtlq7vpAA7V-VJTKOpi_o0AD_5MmE15I9DPn6PA"
});

// LENI token contract configuration
export const leniContract = getContract({
  client,
  chain: lensTestnet,
  address: "0xC94E29B30D5A33556C26e8188B3ce3c6d1003F86",
});
