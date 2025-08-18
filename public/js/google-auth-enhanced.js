/**
 * Enhanced Google Sign-In Implementation
 * Handles Google OAuth flow with proper backend integration and error handling
 */

class GoogleAuth {
  constructor() {
    this.baseUrl = 'https://techyjaunt-auth-go43.onrender.com';
    this.clientId = '293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com';
    
    // Use dynamic redirect URI based on current environment
    this.redirectUri = `${window.location.origin}/google-callback.html`;
    
    console.log('Google OAuth Configuration:', {
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      currentOrigin: window.location.origin,
      currentHostname: window.location.hostname
    });
  }

  /**
   * Initialize Google Sign-In
   */
  init() {
    this.setupGoogleButton();
    this.handleCallback();
    this.setupErrorHandling();
  }

  /**
   * Setup Google Sign-In button
   */
  setupGoogleButton() {
    const googleBtn = document.querySelector('button[onclick="signInWithGoogle()"]');
    if (googleBtn) {
      googleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.signIn();
      });
    }
  }

  /**
   * Setup global error handling
   */
  setupErrorHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showError('An unexpected error occurred. Please try again.');
    });
  }

  /**
   * Main Google Sign-In function with fallback
   */
  async signIn() {
    try {
      // Check if popup is blocked
      if (this.isPopupBlocked()) {
        this.showError('Popup blocked. Please allow popups for Google sign-in or use manual sign-up.');
        return;
      }

      this.showLoading();

      // Build the correct Google OAuth URL
      const authUrl = this.buildGoogleAuthUrl();
      
      // Try popup first, fallback to redirect if needed
      const popupSuccess = await this.tryPopupFlow(authUrl);
      if (!popupSuccess) {
        // Fallback to redirect flow
        window.location.href = authUrl;
      }

    } catch (error) {
      console.error('Google sign-in error:', error);
      this.showError(`Failed to initiate Google sign-in: ${error.message}`);
      this.hideLoading();
    }
  }

  /**
   * Build Google OAuth URL
   */
  buildGoogleAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: this.generateState()
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Generate random state for security
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Check if popup is blocked
   */
  isPopupBlocked() {
    const testPopup = window.open('', '_blank', 'width=1,height=1,left=-1000,top=-1000');
    if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
      return true;
    }
    testPopup.close();
    return false;
  }

  /**
   * Try popup flow with timeout - COOP-safe implementation
   */
  async tryPopupFlow(authUrl) {
    return new Promise((resolve) => {
      // Use noopener,noreferrer to prevent COOP issues
      const popup = window.open(
        authUrl,
        'google-signin',
        'width=500,height=600,scrollbars=yes,resizable=yes,top=100,left=500,noopener,noreferrer'
      );

      // COOP-safe check: If popup fails to open, resolve false immediately
      if (!popup) {
        resolve(false);
        return;
      }

      // Set timeout for popup (5 minutes)
      const timeout = setTimeout(() => {
        try {
          popup.close();
        } catch (e) {
          // Ignore COOP errors when closing
        }
        window.removeEventListener('message', handleMessage);
        this.showError('Google sign-in timed out. Please try again.');
        this.hideLoading();
        resolve(false);
      }, 300000); // 5 minutes

      // Listen for messages from popup
      const handleMessage = (event) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) return;

        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          try {
            popup.close();
          } catch (e) {
            // Ignore COOP errors when closing
          }
          this.handleGoogleCallback(event.data.code);
          resolve(true);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          try {
            popup.close();
          } catch (e) {
            // Ignore COOP errors when closing
          }
          this.showError('Google sign-in failed: ' + event.data.error);
          this.hideLoading();
          resolve(true); // Popup worked, but auth failed
        }
      };

      window.addEventListener('message', handleMessage);

      // COOP-safe popup monitoring
      const checkPopupStatus = () => {
        // Try to check if popup is still alive
        try {
          if (popup.closed === true) {
            window.removeEventListener('message', handleMessage);
            clearTimeout(timeout);
            this.hideLoading();
            resolve(true); // Popup was closed by user
            return;
          }
        } catch (e) {
          // COOP policy is blocking access, assume popup is still open
          // We'll rely on the message handler or timeout
        }
        
        setTimeout(checkPopupStatus, 2000); // Check less frequently
      };

      // Start monitoring
      setTimeout(checkPopupStatus, 1000);
    });
  }

  /**
   * Handle Google callback with enhanced error handling
   */
  async handleGoogleCallback(code) {
    try {
      this.showLoading('Authenticating with Google...');

      // Exchange code for tokens via backend
      const response = await fetch(`${this.baseUrl}/api/users/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Google authentication failed: ${response.status}`);
      }

      // Validate response data
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      // Store user data securely
      this.storeUserData(data);
      
      this.showSuccess('Successfully signed up with Google!');
      
      // Redirect to dashboard with delay for user to see success message
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);

    } catch (error) {
      console.error('Google callback error:', error);
      this.showError(error.message || 'Authentication failed. Please try again.');
      this.hideLoading();
    }
  }

  /**
   * Store user data securely
   */
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
      
      // Set auth header for future requests
      if (window.setAuthHeader) {
        window.setAuthHeader(data.token);
      }
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Handle callback from popup/redirect
   */
  handleCallback() {
    // This runs in the popup window or redirect flow
    if (window.location.pathname === '/google-callback.html') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      if (error) {
        // Send error back to parent
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: decodeURIComponent(error)
          }, '*');
        } else {
          // Handle redirect flow error
          this.handleRedirectError(error);
        }
      } else if (code) {
        // Send success back to parent
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            code: code,
            state: state
          }, '*');
        } else {
          // Handle redirect flow success
          this.handleRedirectSuccess(code, state);
        }
      } else {
        // No code received
        const errorMsg = 'No authorization code received';
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: errorMsg
          }, '*');
        } else {
          this.handleRedirectError(errorMsg);
        }
      }
      
      if (window.opener) {
        window.close();
      }
    }
  }

  /**
   * Handle redirect flow success
   */
  async handleRedirectSuccess(code, state) {
    try {
      // Show processing page
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #e0e0e0;">
          <div style="text-align: center;">
            <div style="border: 4px solid rgba(3, 218, 197, 0.3); border-top: 4px solid #03dac5; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <h2>Completing Google Sign-In...</h2>
            <p>Please wait while we authenticate your account.</p>
          </div>
        </div>
      `;
      
      await this.handleGoogleCallback(code);
    } catch (error) {
      console.error('Redirect flow error:', error);
      window.location.href = `signup.html?error=${encodeURIComponent(error.message)}`;
    }
  }

  /**
   * Handle redirect flow error
   */
  handleRedirectError(error) {
    console.error('Redirect flow error:', error);
    window.location.href = `signup.html?error=${encodeURIComponent(error)}`;
  }

  /**
   * Utility functions
   */
  showLoading(text = 'Connecting...') {
    const googleBtn = document.querySelector('button[onclick="signInWithGoogle()"]');
    if (googleBtn) {
      googleBtn.disabled = true;
      googleBtn.innerHTML = `
        <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #757575; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></span>
        ${text}
      `;
    }
  }

  hideLoading() {
    const googleBtn = document.querySelector('button[onclick="signInWithGoogle()"]');
    if (googleBtn) {
      googleBtn.disabled = false;
      googleBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      `;
    }
  }

  showSuccess(message) {
    // Use existing toast system
    if (window.showToast) {
      window.showToast(message, 3000);
    } else {
      alert(message);
    }
  }

  showError(message) {
    // Use existing toast system
    if (window.showToast) {
      window.showToast(message, 5000);
    } else {
      alert(message);
    }
  }

  /**
   * Check if user is already authenticated
   */
  static isAuthenticated() {
    try {
      const tokenData = localStorage.getItem('authAuth');
      if (!tokenData) return false;
      
      const { token, expiresAt } = JSON.parse(tokenData);
      return token && expiresAt > Date.now();
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Logout function
   */
  static logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  }
}

// Initialize Google Auth
document.addEventListener('DOMContentLoaded', () => {
  window.googleAuth = new GoogleAuth();
  window.googleAuth.init();
  
  // Handle redirect errors
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  if (error && window.showToast) {
    window.showToast(decodeURIComponent(error), 5000);
  }
});

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
