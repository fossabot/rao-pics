import { useState } from "react";

import "./App.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ipcLink } from "electron-trpc/renderer";
import superjson from "superjson";

import { TabBar } from "./components/TabBar";
import Home from "./Home";
import { trpc } from "./utils/trpc";

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => {
    return trpc.createClient({
      transformer: superjson,
      links: [ipcLink()],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TabBar />
        <Home />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
