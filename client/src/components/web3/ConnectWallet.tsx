import { ConnectKitButton } from "connectkit";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function ConnectWallet() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <Button 
            onClick={show}
            variant={isConnected ? "outline" : "default"}
            className={isConnected ? "border-purple-500" : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"}
          >
            {isConnected ? (
              ensName || truncatedAddress
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </>
            )}
          </Button>
        );
      }}
    </ConnectKitButton.Custom>
  );
}