import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthClient } from '@dfinity/auth-client';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);

      const isLoggedIn = await client.isAuthenticated();
      setIsAuthenticated(isLoggedIn);

      if (isLoggedIn) {
        const identity = client.getIdentity();
        setIdentity(identity);
        setPrincipal(identity.getPrincipal().toString());
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    if (!authClient) return;

    const days = BigInt(7);
    const hours = BigInt(24);
    const nanoseconds = BigInt(3600000000000);

    await authClient.login({
      identityProvider: process.env.DFX_NETWORK === 'ic' 
        ? 'https://identity.ic0.app'
        : `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`,
      maxTimeToLive: days * hours * nanoseconds, // 7 days
      onSuccess: async () => {
        setIsAuthenticated(true);
        const identity = authClient.getIdentity();
        setIdentity(identity);
        setPrincipal(identity.getPrincipal().toString());
      },
    });
  }

  async function logout() {
    if (authClient) {
      await authClient.logout();
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
    }
  }

  // For development/demo purposes when Internet Identity isn't available
  function devLogin() {
    setIsAuthenticated(true);
    setPrincipal('2vxsx-fae'); // Mock principal
  }

  const value = {
    authClient,
    isAuthenticated,
    identity,
    principal,
    loading,
    login,
    logout,
    devLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
