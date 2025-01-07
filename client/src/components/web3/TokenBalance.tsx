import { useEffect, useState } from "react";
import { getTokenBalance } from "@/lib/web3";
import { Card, CardContent } from "@/components/ui/card";
import { Coins } from "lucide-react";

interface TokenBalanceProps {
  userAddress: string;
}

export function TokenBalance({ userAddress }: TokenBalanceProps) {
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        if (userAddress) {
          const bal = await getTokenBalance(userAddress);
          setBalance(bal);
        }
      } catch (error) {
        console.error("Error fetching token balance:", error);
      }
    };

    fetchBalance();
  }, [userAddress]);

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