import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAccount } from "wagmi";
import { Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TokenDeploymentWizard } from "./TokenDeploymentWizard";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  tokenName: z.string().min(1, "Token name is required"),
  tokenSymbol: z.string()
    .min(1, "Token symbol is required")
    .max(5, "Token symbol must be 5 characters or less")
    .regex(/^[A-Z]+$/, "Token symbol must be uppercase letters only"),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "community" | "token" | "review";

export function CreateCommunityDialog({ open, onOpenChange }: Props) {
  const { address } = useAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("community");
  const [deploymentError, setDeploymentError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      tokenName: "",
      tokenSymbol: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData & { tokenAddress?: string }) => {
      const response = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          creatorAddress: address,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      toast({
        title: "Success! 🎉",
        description: "Your community and token have been created successfully!",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const progress = {
    community: 33,
    token: 66,
    review: 100,
  }[step];

  const handleNext = async () => {
    if (step === "community") {
      const communityValid = await form.trigger(["name", "description"]);
      if (!communityValid) return;
      setStep("token");
    } else if (step === "token") {
      const tokenValid = await form.trigger(["tokenName", "tokenSymbol"]);
      if (!tokenValid) return;
      setStep("review");
    }
  };

  const handleBack = () => {
    setDeploymentError(null);
    if (step === "token") setStep("community");
    if (step === "review") setStep("token");
  };

  const handleTokenDeploymentSuccess = (tokenAddress: string) => {
    const formData = form.getValues();
    mutation.mutate({ ...formData, tokenAddress });
  };

  const handleTokenDeploymentError = (error: string) => {
    setDeploymentError(error);
    toast({
      title: "Token Deployment Failed",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Community</DialogTitle>
        </DialogHeader>

        <Progress value={progress} className="mb-4" />

        <Form {...form}>
          <form className="space-y-4">
            {step === "community" && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Community Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter community name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What is your community about?"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === "token" && (
              <>
                <FormField
                  control={form.control}
                  name="tokenName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Community Token"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tokenSymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Symbol</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., COMM"
                          maxLength={5}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === "review" && (
              <>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1">Community Details</h3>
                      <p className="text-sm text-muted-foreground">Name: {form.getValues("name")}</p>
                      <p className="text-sm text-muted-foreground">Description: {form.getValues("description")}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Token Details</h3>
                      <p className="text-sm text-muted-foreground">Name: {form.getValues("tokenName")}</p>
                      <p className="text-sm text-muted-foreground">Symbol: {form.getValues("tokenSymbol")}</p>
                    </div>
                  </CardContent>
                </Card>

                {deploymentError ? (
                  <div className="text-sm text-red-500">
                    {deploymentError}
                  </div>
                ) : (
                  <TokenDeploymentWizard
                    tokenName={form.getValues("tokenName")}
                    tokenSymbol={form.getValues("tokenSymbol")}
                    onSuccess={handleTokenDeploymentSuccess}
                    onError={handleTokenDeploymentError}
                  />
                )}
              </>
            )}

            <div className="flex justify-between pt-4">
              {step !== "community" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={mutation.isPending}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}

              {step !== "review" && (
                <Button
                  type="button"
                  onClick={handleNext}
                  className={`bg-gradient-to-r from-purple-500 to-blue-500 ${step === "community" ? "ml-auto" : ""}`}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}