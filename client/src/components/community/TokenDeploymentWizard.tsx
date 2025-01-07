import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Loader2, AlertCircle } from "lucide-react";

interface TokenDeploymentStatus {
  stage: "deploying" | "success" | "error";
  message: string;
}

interface Props {
  tokenName: string;
  tokenSymbol: string;
  onSuccess: (tokenAddress: string) => void;
  onError: (error: string) => void;
}

export function TokenDeploymentWizard({ tokenName, tokenSymbol, onSuccess, onError }: Props) {
  const [status, setStatus] = useState<TokenDeploymentStatus>({
    stage: "deploying",
    message: "Initializing token deployment...",
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      setStatus({
        stage: "deploying",
        message: "Creating your community token...",
      });

      const response = await fetch("/api/communities/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tokenName,
          symbol: tokenSymbol,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      return data.tokenAddress;
    },
    onSuccess: (tokenAddress) => {
      setStatus({
        stage: "success",
        message: "Token deployed successfully! 🎉",
      });
      onSuccess(tokenAddress);
    },
    onError: (error: Error) => {
      setStatus({
        stage: "error",
        message: error.message,
      });
      onError(error.message);
    },
  });

  // Start deployment immediately when component mounts
  useState(() => {
    deployMutation.mutate();
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {status.stage === "deploying" && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            )}
            {status.stage === "success" && (
              <Check className="h-5 w-5 text-green-500" />
            )}
            {status.stage === "error" && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <p className="font-medium">{status.message}</p>
          </div>

          <div className="space-y-2">
            <Progress 
              value={status.stage === "success" ? 100 : status.stage === "error" ? 100 : 66} 
              className={
                status.stage === "success" 
                  ? "bg-green-100" 
                  : status.stage === "error" 
                    ? "bg-red-100" 
                    : ""
              }
            />
            <p className="text-sm text-muted-foreground">
              {status.stage === "deploying" && "This may take a few moments..."}
              {status.stage === "success" && `Token Address: ${deployMutation.data}`}
              {status.stage === "error" && "Please try again or contact support if the issue persists."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
