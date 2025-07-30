import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider, useWallet } from "@/contexts/WalletContext";
import { PrivyProvider } from '@privy-io/react-auth';
import { baseSepolia } from 'viem/chains';
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import NewRequest from "./pages/NewRequest";
import ViewRequests from "./pages/ViewRequests";
import Inbox from "./pages/Inbox";
import ProfileSettings from "./pages/Settings";
import NotFound from "./pages/NotFound";
// Enhanced pages with contract integration
import { EnhancedNewRequest } from "./pages/EnhancedNewRequest";
import { EnhancedViewRequests } from "./pages/EnhancedViewRequests";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWallet();
  return isConnected ? <>{children}</> : <Navigate to="/" replace />;
}

// Public Route Component (redirect to dashboard if connected)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWallet();
  return !isConnected ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

const App = () => (
  <PrivyProvider
    appId={import.meta.env.VITE_PRIVY_APP_ID || 'clpispdty00lu11pf5keb4tvr'}
    config={{
      defaultChain: baseSepolia,
      supportedChains: [baseSepolia],
      appearance: {
        theme: 'light',
        accentColor: '#676FFF',
      },
    }}
  >
    <ThemeProvider>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Landing />
                  </PublicRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/request"
                element={
                  <ProtectedRoute>
                    <EnhancedNewRequest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/send"
                element={
                  <ProtectedRoute>
                    <EnhancedNewRequest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requests"
                element={
                  <ProtectedRoute>
                    <EnhancedViewRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/legacy-request"
                element={
                  <ProtectedRoute>
                    <NewRequest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/legacy-requests"
                element={
                  <ProtectedRoute>
                    <ViewRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inbox"
                element={
                  <ProtectedRoute>
                    <Inbox />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </ThemeProvider>
  </PrivyProvider>
);

export default App;
