import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { CreatePost } from "@/components/community/CreatePost";
import { PostList } from "@/components/community/PostList";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

export function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">
          Community Hub
        </h1>
        <ConnectWallet />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CreatePost />
          <PostList />
        </div>
        <div>
          <LeaderboardTable />
        </div>
      </div>
    </div>
  );
}
