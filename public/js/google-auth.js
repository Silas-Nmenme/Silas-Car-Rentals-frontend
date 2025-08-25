// Google OAuth Configuration and Handler
class GoogleAuthHandler {
  constructor() {
    this.baseUrl = window.APP_CONFIG?.API_BASE_URL || 'https://techyjaunt-auth-go43.onrender.com';
    this.clientId = window.APP_CONFIG?.GOOGLE_CLIENT_ID || '293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com';
    this.redirectUri = window.APP_CONFIG?.getRedirectUri() || `${window.location.origin}/google-callback.html`;
    this.init();
    
    // Log configuration for debugging
    console.log('Google OAuth Config:', {
      baseUrl: this.baseUrl,
      redirectUri: this.redirectUri,
      clientId: this.clientId,
      environment: window.APP_CONFIG?.getEnvironment() || 'unknown'
    });
  }

  init() {
    // Check if we're in a popup window
    this.isPopup = window.opener && window.opener !== window;
    
    // Listen for messages from popup
    if (!this.isPopup) {
      window.addEventListener('message', this.handleMessage.bind(this));
    }
  }

  // Main method to initiate Google OAuth
  async initiateGoogleAuth(mode = 'login') {
    try {
      // Determine flow type based on environment
      const usePopup = this.shouldUsePopup();
      
      if (usePopup) {
        return this.initiatePopupFlow(mode);
      } else {
        return this.initiateRedirectFlow(mode);
      }
    } catch (error) {
      console.error('Failed to initiate Google auth:', error);
      this.showError('Failed to start Google sign-in. Please try again.');
    }
  }

  shouldUsePopup() {
    // Use popup on desktop, redirect on mobile
    return window.innerWidth > 768 && !window.matchMedia('(pointer: coarse)').matches;
  }

  initiatePopupFlow(mode) {
    const width = 500;
    const height = 600;
    const left = (window.screenX || window.screenLeft || 0) + (window.innerWidth - width) / 2;
    const top = (window.screenY || window.screenTop || 0) + (window.innerHeight - height) / 2;

    const authUrl = `${this.baseUrl}/api/users/google?mode=${mode}`;
    
    const popup = window.open(
      authUrl,
      'google-auth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Popup blocked, fallback to redirect
      console.log('Popup blocked, falling back to redirect');
      this.initiateRedirectFlow(mode);
      return;
    }

    // Poll for popup completion
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        console.log('Google popup closed without completion');
      }
    }, 1000);

    return popup;
  }

  initiateRedirectFlow(mode) {
    const authUrl = `${this.baseUrl}/api/users/google?mode=${mode}`;
    window.location.href = authUrl;
  }

  handleMessage(event) {
    // Validate origin
    if (event.origin !== window.location.origin && event.origin !== this.baseUrl) {
      console.warn('Received message from untrusted origin:', event.origin);
      return;
    }

    const { type, data } = event.data;

    switch (type) {
      case 'GOOGLE_AUTH_SUCCESS':
        this.handleAuthSuccess(data);
        break;
      case 'GOOGLE_AUTH_ERROR':
        this.handleAuthError(data);
        break;
    }
  }

  async handleAuthSuccess(authData) {
    try {
      console.log('Google auth success:', authData);
      
      // Exchange code for token
      const response = await fetch(`${this.baseUrl}/api/users/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: authData.code,
          state: authData.state
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      // Store user data
      this.storeUserData(data);
      
      // Redirect based on mode
      const isNewUser = data.user.isNew || false;
      const redirectUrl = isNewUser ? 'verify-email.html' : 'dashboard/index.html';
      
      if (this.isPopup) {
        // Send success message to opener
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_COMPLETE',
          data: { ...data, redirectUrl }
        }, '*');
        
        // Close popup
        setTimeout(() => window.close(), 100);
      } else {
        // Redirect in current window
        window.location.href = redirectUrl;
      }

    } catch (error) {
      console.error('Google auth error:', error);
      this.handleAuthError(error.message || 'Authentication failed');
    }
  }

  handleAuthError(error) {
    console.error('Google auth error:', error);
    
    if (this.isPopup) {
      window.opener.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: error
      }, '*');
      
      setTimeout(() => window.close(), 100);
    } else {
      this.showError(error);
    }
  }

  storeUserData(data) {
    try {
      // Store token with expiration
      const tokenData = {
        token: data.token,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      localStorage.setItem('authToken', JSON.stringify(tokenData));
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('User data stored successfully');
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  showError(message) {
    // Use existing toast or create one
    if (typeof showToast === 'function') {
      showToast(message);
    } else {
      alert(message);
    }
  }

  // Utility method to check if user is authenticated
  isAuthenticated() {
    try {
      const tokenData = localStorage.getItem('authToken');
      if (!tokenData) return false;
      
      const { token, expiresAt } = JSON.parse(tokenData);
      return token && expiresAt > Date.now();
    } catch {
      return false;
    }
  }

  // Logout method
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
}

// Create global instance
window.googleAuth = new GoogleAuthHandler();

// Export for use in other files
window.initiateGoogleLogin = () => window.googleAuth.initiateGoogleAuth('login');
window.initiateGoogleSignup = () => window.googleAuth.initiateGoogleAuth('signup');
