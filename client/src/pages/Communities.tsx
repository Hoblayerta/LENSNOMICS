import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { Plus, Users } from "lucide-react";
import { CreateCommunityDialog } from "@/components/community/CreateCommunityDialog";
import { Link } from "wouter";

interface Community {
  id: number;
  name: string;
  description: string;
  tokenSymbol: string;
  requiredTokens: string;
  memberCount: number;
}

export function Communities() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { isConnected } = useAccount();

  const { data: communities, isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">
          Communities
        </h1>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-blue-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Community
        </Button>
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
                    <Badge variant="outline" className="ml-2">
                      {community.tokenSymbol}
                    </Badge>
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