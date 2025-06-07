import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = Cookies.get('access_token');
      const expiryTime = Cookies.get('access_token_expiry');

      if (!accessToken || !expiryTime) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const buffer = 5 * 60 * 1000; // 5 minutes buffer in milliseconds
        const expiry = parseInt(expiryTime, 10);

        if (expiry < Date.now() + buffer) {
          // Access token is expired or about to expire, try to refresh it
          const response = await fetch('/api/auth/refresh', { method: 'POST' });
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            // Refresh failed
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    // Also check on an interval
    const interval = setInterval(checkAuth, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return { isAuthenticated };
};

export default useAuth; 