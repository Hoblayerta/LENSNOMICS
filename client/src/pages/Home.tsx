import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { CreatePost } from "@/components/community/CreatePost";
import { PostList } from "@/components/community/PostList";
import { TokenLeaderboard } from "@/components/leaderboard/TokenLeaderboard";

export function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-500 to-purple-500 text-transparent bg-clip-text">
          LENSNOMICS
        </h1>
        <ConnectWallet />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CreatePost />
          <PostList />
        </div>
        <div>
          <TokenLeaderboard />
        </div>
      </div>
    </div>
  );
}