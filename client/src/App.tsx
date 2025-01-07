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

function App() {
  return (
    <WagmiConfig config={config}>
      <ConnectKitProvider>
        <QueryClientProvider client={queryClient}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/profile" component={Profile} />
            <Route path="/communities" component={Communities} />
          </Switch>
          <Toaster />
        </QueryClientProvider>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export default App;