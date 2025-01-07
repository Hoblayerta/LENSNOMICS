import { Switch, Route } from "wouter";
import { Home } from "@/pages/Home";
import { Profile } from "@/pages/Profile";
import { Communities } from "@/pages/Communities";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { WagmiConfig } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { config } from "./lib/config";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

function App() {
  return (
    <WagmiConfig config={config}>
      <ConnectKitProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background">
              <div className="fixed top-4 right-4 z-50">
                <ThemeSwitcher />
              </div>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/profile" component={Profile} />
                <Route path="/communities" component={Communities} />
              </Switch>
              <Toaster />
            </div>
          </QueryClientProvider>
        </ThemeProvider>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export default App;