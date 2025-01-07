import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";

interface LeaderboardEntry {
  address: string;
  balance: string;
  rank: number;
}

export function LeaderboardTable() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  if (isLoading) {
    return <div>Loading leaderboard...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-yellow-500" />
        Top Community Members
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">Token Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard?.map((entry: LeaderboardEntry) => (
            <TableRow key={entry.address}>
              <TableCell className="font-medium">{entry.rank}</TableCell>
              <TableCell>{`${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}</TableCell>
              <TableCell className="text-right">{entry.balance} COMM</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
