import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TokenBalance } from "@/components/web3/TokenBalance";
import { getProfile } from "@/lib/lens";
import { PostList } from "@/components/community/PostList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Profile() {
  const [profile, setProfile] = useState<any>(null);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.picture?.original?.url} />
              <AvatarFallback>USER</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{profile?.handle}</h1>
              <p className="text-muted-foreground">{profile?.bio}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TokenBalance 
            tokenAddress="0x..." 
            userAddress="0x..." 
            provider={null}
          />
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">My Posts</h2>
      <PostList />
    </div>
  );
}
