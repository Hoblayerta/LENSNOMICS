import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Star, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardEntry {
  address: string;
  balance: string;
  rank: number;
  achievementPoints: number;
  achievements: Array<{
    name: string;
    description: string;
    icon: string;
    points: number;
  }>;
  lensHandle?: string;
}

export function LeaderboardTable() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Star className="h-6 w-6 text-purple-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="h-64 animate-pulse bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h2 className="text-2xl font-bold">Community Champions</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Achievements</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="text-right">Token Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard?.map((entry) => (
            <TableRow key={entry.address}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                  <span className="font-medium">#{entry.rank}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://avatars.dicebear.com/api/identicon/${entry.address}.svg`} />
                    <AvatarFallback>{entry.address.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {entry.lensHandle || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                    </div>
                    {entry.lensHandle && (
                      <div className="text-sm text-muted-foreground">
                        {`${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  <TooltipProvider>
                    {entry.achievements.map((achievement) => (
                      <Tooltip key={achievement.name}>
                        <TooltipTrigger>
                          <Badge 
                            variant="secondary"
                            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0"
                          >
                            <Award className="h-4 w-4 mr-1" />
                            {achievement.name}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{achievement.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            +{achievement.points} points
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {entry.achievementPoints} pts
              </TableCell>
              <TableCell className="text-right">{entry.balance} COMM</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}