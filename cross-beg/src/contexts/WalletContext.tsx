import React, { createContext, useContext, useMemo } from "react";
import { usePrivy, useWallets } from '@privy-io/react-auth';

interface WalletContextType {
  isConnected: boolean;
  userAddress: string | null;
  chainId: number | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  isLoading: boolean;
  walletProvider: any;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();

  const activeWallet = wallets[0]; // Get the first connected wallet
  const userAddress = user?.wallet?.address || null;

  // Get the Ethereum provider from the active wallet
  const walletProvider = useMemo(() => {
    if (!activeWallet) return null;
    try {
      // For Privy, getEthereumProvider() returns a Promise, so we need to handle it differently
      return activeWallet.getEthereumProvider();
    } catch (error) {
      console.warn('Failed to get Ethereum provider:', error);
      return null;
    }
  }, [activeWallet]);

  const connectWallet = () => {
    login();
  };

  const disconnectWallet = () => {
    logout();
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected: authenticated,
        userAddress,
        chainId: null, // Will be handled by Privy
        connectWallet,
        disconnectWallet,
        isLoading: !ready,
        walletProvider,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
