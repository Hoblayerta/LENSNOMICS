import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getSignedContract } from "@/lib/contract";
import { parseEther } from "viem";

const DAILY_MINT_LIMIT = "10";

export function MintTokens() {
  const [amount, setAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const { toast } = useToast();

  const handleMint = async () => {
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(DAILY_MINT_LIMIT)) {
      toast({
        title: "Error",
        description: `Please enter a valid amount between 1 and ${DAILY_MINT_LIMIT} LENI`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsMinting(true);
      const parsedAmount = parseEther(amount);

      // Get contract with signer
      const contract = await getSignedContract();

      // Prepare the mint transaction
      const transaction = await contract.prepare("mint", [parsedAmount]);

      // Execute the transaction
      const result = await transaction.execute();

      // Wait for transaction confirmation
      await result.wait();

      toast({
        title: "Success",
        description: `Successfully minted ${amount} LENI tokens!`,
      });
      setAmount("");
    } catch (error: any) {
      console.error("Error minting tokens:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to mint tokens",
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Mint LENI Tokens</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Input
            type="number"
            placeholder="Amount to mint"
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              if (parseFloat(value) <= parseFloat(DAILY_MINT_LIMIT)) {
                setAmount(value);
              }
            }}
            min="0"
            max={DAILY_MINT_LIMIT}
            step="1"
          />
          <Button 
            onClick={handleMint} 
            disabled={isMinting || !amount}
            className="bg-gradient-to-r from-green-500 to-purple-500"
          >
            {isMinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Minting...
              </>
            ) : (
              "Mint Tokens"
            )}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Note: Daily limit is {DAILY_MINT_LIMIT} LENI tokens
      </CardFooter>
    </Card>
  );
}