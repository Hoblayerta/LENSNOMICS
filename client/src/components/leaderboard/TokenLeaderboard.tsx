import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Coins, Award, Users } from "lucide-react";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  address: string;
  lensHandle: string | null;
  balance: string;
  achievementPoints: number;
  achievements: Array<{
    name: string;
    description: string;
    icon: string;
    points: number;
  }>;
}

export function TokenLeaderboard() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading leaderboard...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 h-8 rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Token Earnings Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tokens" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tokens">Token Rankings</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="tokens" className="space-y-4 mt-4">
            {leaderboard?.map((entry, index) => (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                <Avatar>
                  <AvatarFallback>
                    {entry.lensHandle?.[0] ?? entry.address.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {entry.lensHandle ?? entry.address.slice(0, 6) + "..." + entry.address.slice(-4)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Coins className="h-3 w-3 mr-1" />
                      {entry.balance} LENI
                    </Badge>
                    <Badge variant="outline">
                      <Award className="h-3 w-3 mr-1" />
                      {entry.achievementPoints} Points
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            <div className="space-y-4">
              {leaderboard?.map((entry, index) => (
                <div key={entry.address} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {entry.lensHandle?.[0] ?? entry.address.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {entry.lensHandle ?? entry.address.slice(0, 6) + "..." + entry.address.slice(-4)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {entry.achievements.map((achievement) => (
                      <Badge
                        key={achievement.name}
                        variant="outline"
                        className="justify-start py-2"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        {achievement.name} ({achievement.points} pts)
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
