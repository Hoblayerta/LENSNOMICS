import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { connectWallet, disconnectWallet } from "@/lib/web3";
import { Wallet } from "lucide-react";

export function ConnectWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const { address } = await connectWallet();
      setAddress(address);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    setAddress(null);
  };

  return (
    <div>
      {!address ? (
        <Button 
          variant="default"
          onClick={handleConnect}
          disabled={connecting}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {connecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      ) : (
        <Button 
          variant="outline"
          onClick={handleDisconnect}
          className="border-purple-500"
        >
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </Button>
      )}
    </div>
  );
}
