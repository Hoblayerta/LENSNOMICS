import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface TokenEarning {
  communityName: string;
  tokenSymbol: string;
  balance: string;
  history: Array<{
    timestamp: string;
    amount: string;
  }>;
}

export function TokenDashboard() {
  const { address } = useAccount();

  const { data: earnings, isLoading } = useQuery<TokenEarning[]>({
    queryKey: ["/api/token-earnings", address],
    enabled: !!address,
  });

  if (!address) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Connect your wallet to view token earnings
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!earnings?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No token earnings yet. Join communities and start interacting!
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalBalance = earnings.reduce(
    (sum, earning) => sum + parseFloat(earning.balance),
    0
  ).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Token Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBalance}</div>
            <p className="text-xs text-muted-foreground">
              Across all communities
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Earnings Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={earnings.flatMap(earning =>
                  earning.history.map(h => ({
                    name: earning.communityName,
                    symbol: earning.tokenSymbol,
                    timestamp: h.timestamp,
                    amount: parseFloat(h.amount),
                  }))
                )}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  {earnings.map((earning, index) => (
                    <linearGradient
                      key={earning.communityName}
                      id={`color${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={`hsl(${index * 60}, 70%, 50%)`}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={`hsl(${index * 60}, 70%, 50%)`}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(time) => format(new Date(time), "MMM d")}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            {payload.map((entry: any) => (
                              <div key={entry.name}>
                                <p className="text-sm font-medium">
                                  {entry.payload.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {entry.value} {entry.payload.symbol}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {earnings.map((earning, index) => (
                  <Area
                    key={earning.communityName}
                    type="monotone"
                    dataKey="amount"
                    name={earning.communityName}
                    stroke={`hsl(${index * 60}, 70%, 50%)`}
                    fillOpacity={1}
                    fill={`url(#color${index})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}