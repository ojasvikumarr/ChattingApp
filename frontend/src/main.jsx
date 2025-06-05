import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "stream-chat-react/dist/css/v2/index.css";
import "./index.css";
import App from "./App.jsx";
import { SocketProvider } from "./context/SocketProvider.jsx";

import { BrowserRouter } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
      <QueryClientProvider client={queryClient}>
    <SocketProvider>
    <BrowserRouter>
        <App />
    </BrowserRouter>
    </SocketProvider>
      </QueryClientProvider>
  </StrictMode>
);