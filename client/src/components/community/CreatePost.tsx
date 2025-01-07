import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { handlePostFee, hasEnoughTokens } from "@/lib/web3";
import { useAccount, useSigner } from "wagmi";
import { Loader2 } from "lucide-react";

export function CreatePost() {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const mutation = useMutation({
    mutationFn: async () => {
      try {
        // Check if user has enough tokens
        const hasTokens = await hasEnoughTokens(address!, signer!.provider);
        if (!hasTokens) {
          throw new Error("Insufficient tokens to create post");
        }

        // Handle the post fee first
        await handlePostFee(signer);

        // After successful fee payment, create the post
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, address }),
        });

        if (!response.ok) throw new Error("Failed to create post");
        return response.json();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create post",
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setContent("");
      toast({
        title: "Success",
        description: "Post created successfully",
      });
    },
  });

  const handleSubmit = () => {
    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (content.trim()) {
      mutation.mutate();
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <Textarea
          placeholder="What's on your mind? (Costs 0.1 COMM tokens)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none"
        />
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Fee: 0.1 COMM tokens
        </p>
        <Button 
          onClick={handleSubmit}
          disabled={mutation.isPending || !content.trim() || !address}
          className="bg-gradient-to-r from-purple-500 to-blue-500"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Post"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}