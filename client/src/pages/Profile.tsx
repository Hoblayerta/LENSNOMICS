import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TokenBalance } from "@/components/web3/TokenBalance";
import { getProfile } from "@/lib/lens";
import { PostList } from "@/components/community/PostList";
import { TokenDashboard } from "@/components/dashboard/TokenDashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAccount } from "wagmi";

export function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const { address } = useAccount();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile("user.lens");
        setProfile(data);
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();
  }, []);

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please connect your wallet to view your profile
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.picture?.original?.url} />
              <AvatarFallback>{address.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{profile?.handle || `${address.slice(0, 6)}...${address.slice(-4)}`}</h1>
              <p className="text-muted-foreground">{profile?.bio}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TokenBalance userAddress={address} />
        </CardContent>
      </Card>

      <div className="mb-8">
        <TokenDashboard userAddress={address} />
      </div>

      <h2 className="text-xl font-semibold mb-4">My Posts</h2>
      <PostList />
    </div>
  );
}