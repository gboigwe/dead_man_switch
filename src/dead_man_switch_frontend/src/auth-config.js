export const getAuthClient = async () => {
    const authClient = await window.ic?.auth?.getAuthClient();
    if (!authClient) {
      throw new Error("Auth client not available");
    }
    return authClient;
  };
  
  export const login = async () => {
    const authClient = await getAuthClient();
    
    // For local development, use localhost
    const identityProviderUrl = process.env.NODE_ENV === 'production' 
      ? 'https://identity.ic0.app' 
      : `http://localhost:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai`;
    
    return new Promise((resolve) => {
      authClient.login({
        identityProvider: identityProviderUrl,
        onSuccess: () => resolve(true),
        onError: (error) => {
          console.error('Login failed:', error);
          resolve(false);
        }
      });
    });
  };
  
  export const logout = async () => {
    const authClient = await getAuthClient();
    await authClient.logout();
  };
  
  // Helper for development/demo only - should be removed for production
  export const devLogin = () => {
    // Store mock authentication in local storage
    localStorage.setItem('dev-auth', 'true');
    window.location.reload();
  };
  
  export const isAuthenticated = async () => {
    // For development, check local storage
    if (localStorage.getItem('dev-auth')) {
      return true;
    }
    
    // For real auth, check with auth client
    try {
      const authClient = await getAuthClient();
      return await authClient.isAuthenticated();
    } catch (error) {
      console.warn('Auth client not available, using development mode');
      return false;
    }
  };
