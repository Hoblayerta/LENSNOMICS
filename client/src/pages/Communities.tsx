import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { Plus, Users, Coins } from "lucide-react";
import { CreateCommunityDialog } from "@/components/community/CreateCommunityDialog";
import { Link } from "wouter";

interface Community {
  id: number;
  name: string;
  description: string;
  tokenSymbol: string;
  tokenAddress: string;
  requiredTokens: string;
  memberCount: number;
  isHolder?: boolean;
}

export function Communities() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { address, isConnected } = useAccount();

  const { data: communities, isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-500 to-purple-500 text-transparent bg-clip-text">
          Communities
        </h1>
        {isConnected && (
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-gradient-to-r from-green-500 to-purple-500 hover:from-green-600 hover:to-purple-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Community
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-48" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities?.map((community) => (
            <Link key={community.id} href={`/communities/${community.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {community.name}
                    <div className="flex gap-2">
                      {community.tokenAddress === "0xC94E29B30D5A33556C26e8188B3ce3c6d1003F86" && address && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Coins className="h-3 w-3 mr-1" />
                          Holder
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {community.tokenSymbol}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {community.description}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {community.memberCount} members
                  </div>
                  <div className="mt-2 text-sm">
                    Required tokens: {community.requiredTokens} {community.tokenSymbol}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateCommunityDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}