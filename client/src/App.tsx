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
              <nav className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50 px-4 py-2">
                <div className="container mx-auto flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <a href="/" className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">
                      Community Hub
                    </a>
                    <a href="/communities" className="text-foreground hover:text-primary transition-colors">
                      Communities
                    </a>
                    <a href="/profile" className="text-foreground hover:text-primary transition-colors">
                      Profile
                    </a>
                  </div>
                  <ThemeSwitcher />
                </div>
              </nav>
              <div className="pt-16">
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/communities" component={Communities} />
                </Switch>
              </div>
              <Toaster />
            </div>
          </QueryClientProvider>
        </ThemeProvider>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export default App;