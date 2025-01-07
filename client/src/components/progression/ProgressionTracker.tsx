import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Coins, Award } from "lucide-react";
import { motion } from "framer-motion";

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  points: number;
  xpReward: number;
  tokenReward: string;
  icon: string;
  isCompleted: boolean;
}

interface UserProgress {
  level: number;
  xp: number;
  nextLevelXp: number;
  achievements: Achievement[];
  totalAchievements: number;
  completedAchievements: number;
}

const LEVEL_MILESTONES = {
  1: "Welcome to Web3",
  2: "Blockchain Explorer",
  3: "Token Master",
  4: "Community Pioneer",
  5: "Web3 Veteran",
};

export function ProgressionTracker() {
  const { address } = useAccount();
  
  const { data: progress, isLoading } = useQuery<UserProgress>({
    queryKey: ["/api/user/progress", address],
    enabled: !!address,
  });

  if (isLoading || !progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading your progress...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-20 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const xpProgress = (progress.xp / progress.nextLevelXp) * 100;
  const currentMilestone = LEVEL_MILESTONES[progress.level as keyof typeof LEVEL_MILESTONES] || "Web3 Master";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Your Web3 Journey
          </CardTitle>
          <Badge variant="secondary" className="text-lg">
            Level {progress.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Level Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">{currentMilestone}</span>
              <span className="text-sm font-medium">{progress.xp} / {progress.nextLevelXp} XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
          </div>

          {/* Achievement Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-sm font-medium">Achievements</div>
                <div className="text-sm text-muted-foreground">
                  {progress.completedAchievements} / {progress.totalAchievements}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-sm font-medium">Total Rewards</div>
                <div className="text-sm text-muted-foreground">
                  {progress.achievements.reduce((sum, a) => sum + Number(a.tokenReward), 0)} LENI
                </div>
              </div>
            </div>
          </div>

          {/* Achievement List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Achievements</h3>
            <div className="space-y-3">
              {progress.achievements
                .filter(achievement => achievement.category === "onboarding")
                .map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      achievement.isCompleted 
                        ? "bg-gradient-to-r from-green-500/10 to-purple-500/10 border-green-500/20" 
                        : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Award className={`h-5 w-5 ${
                          achievement.isCompleted ? "text-green-500" : "text-muted-foreground"
                        }`} />
                        <div>
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {achievement.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">+{achievement.xpReward} XP</div>
                        {achievement.tokenReward !== "0" && (
                          <div className="text-sm text-green-500">
                            +{achievement.tokenReward} LENI
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
