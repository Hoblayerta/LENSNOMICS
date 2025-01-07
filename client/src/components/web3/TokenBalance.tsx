import { useEffect, useState } from "react";
import { getTokenBalance } from "@/lib/web3";
import { Card, CardContent } from "@/components/ui/card";
import { Coins } from "lucide-react";

interface TokenBalanceProps {
  tokenAddress: string;
  userAddress: string;
  provider: any;
}

export function TokenBalance({ tokenAddress, userAddress, provider }: TokenBalanceProps) {
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const bal = await getTokenBalance(tokenAddress, userAddress, provider);
        setBalance(bal);
      } catch (error) {
        console.error("Error fetching token balance:", error);
      }
    };

    if (tokenAddress && userAddress && provider) {
      fetchBalance();
    }
  }, [tokenAddress, userAddress, provider]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-purple-500" />
          <div className="text-lg font-medium">{balance} COMM</div>
        </div>
      </CardContent>
    </Card>
  );
}
