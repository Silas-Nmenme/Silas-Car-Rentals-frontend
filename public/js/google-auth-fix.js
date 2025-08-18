/**
 * Fixed Google Sign-In Implementation
 * Addresses redirect_uri_mismatch and popup issues
 */

class GoogleAuthFix {
  constructor() {
    this.baseUrl = 'https://techyjaunt-auth-go43.onrender.com';
    this.clientId = '293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com';
    
    // Use the exact redirect URI that matches Google Cloud Console
    this.redirectUri = 'https://techyjaunt-auth-go43.onrender.com/api/auth/google/callback';
    
    // For local development, use appropriate redirect
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.localRedirectUri = isLocal 
      ? 'http://localhost:4500/google-callback.html' 
      : `${window.location.origin}/google-callback.html`;
    
    console.log('Google Auth Configuration:', {
      baseUrl: this.baseUrl,
      redirectUri: this.redirectUri,
      localRedirectUri: this.localRedirectUri,
      currentOrigin: window.location.origin
    });
  }

  /**
   * Initialize Google Sign-In with proper error handling
   */
  init() {
    this.setupGoogleButton();
    this.setupMessageListener();
    this.handleRedirectFlow();
  }

  /**
   * Setup Google Sign-In button
   */
  setupGoogleButton() {
    const googleBtn = document.querySelector('.google-signin-btn') || 
                     document.querySelector('button[onclick*="google"]') ||
                     document.querySelector('[data-action="google-signin"]');
    
    if (googleBtn) {
      googleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.signIn();
      });
    }
  }

  /**
   * Main Google Sign-In function
   */
  async signIn() {
    try {
      this.showLoading();
      
      // Get the correct redirect URI based on environment
      const redirectUri = this.getRedirectUri();
      
      // Build Google OAuth URL
      const authUrl = this.buildAuthUrl(redirectUri);
      
      // Try popup first, fallback to redirect
      const popupSuccess = await this.openPopup(authUrl);
      
      if (!popupSuccess) {
        // Fallback to redirect flow
        window.location.href = authUrl;
      }

    } catch (error) {
      console.error('Google sign-in error:', error);
      this.showError('Failed to initiate Google sign-in. Please try again.');
      this.hideLoading();
    }
  }

  /**
   * Get appropriate redirect URI
   */
  getRedirectUri() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? this.localRedirectUri : this.redirectUri;
  }

  /**
   * Build Google OAuth URL
   */
  buildAuthUrl(redirectUri) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
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
   * Open popup with proper error handling
   */
  async openPopup(authUrl) {
    return new Promise((resolve) => {
      const popup = window.open(
        authUrl,
        'google-signin',
        'width=500,height=600,left=200,top=100,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        resolve(false);
        return;
      }

      // Listen for messages from popup
      const handleMessage = (event) => {
        if (event.origin !== window.location.origin) return;

        window.removeEventListener('message', handleMessage);
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          this.handleAuthCode(event.data.code);
          popup.close();
          resolve(true);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          this.showError(event.data.error);
          popup.close();
          resolve(true);
        }
      };

      window.addEventListener('message', handleMessage);

      // Fallback timeout
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        resolve(false);
      }, 300000); // 5 minutes
    });
  }

  /**
   * Handle authentication code from Google
   */
  async handleAuthCode(code) {
    try {
      this.showLoading('Authenticating...');
      
      const response = await fetch(`${this.baseUrl}/api/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store user data
      this.storeUserData(data);
      
      this.showSuccess('Successfully signed in with Google!');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);

    } catch (error) {
      console.error('Auth callback error:', error);
      this.showError(error.message || 'Authentication failed');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Handle redirect flow
   */
  handleRedirectFlow() {
    if (window.location.pathname.includes('google-callback.html')) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (error) {
        this.handleRedirectError(error);
      } else if (code) {
        this.handleRedirectSuccess(code);
      }
    }
  }

  /**
   * Handle redirect success
   */
  async handleRedirectSuccess(code) {
    try {
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #e0e0e0;">
          <div style="text-align: center;">
            <div style="border: 4px solid rgba(3, 218, 197, 0.3); border-top: 4px solid #03dac5; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <h2>Completing Google Sign-In...</h2>
            <p>Please wait while we authenticate your account.</p>
          </div>
        </div>
      `;
      
      await this.handleAuthCode(code);
    } catch (error) {
      window.location.href = `signup.html?error=${encodeURIComponent(error.message)}`;
    }
  }

  /**
   * Handle redirect error
   */
  handleRedirectError(error) {
    window.location.href = `signup.html?error=${encodeURIComponent(error)}`;
  }

  /**
   * Store user data
   */
  storeUserData(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  /**
   * Utility functions
   */
  showLoading(text = 'Loading...') {
    const btn = document.querySelector('.google-signin-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #757575; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></span> ${text}`;
    }
  }

  hideLoading() {
    const btn = document.querySelector('.google-signin-btn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
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
    if (window.showToast) {
      window.showToast(message, 3000);
    } else {
      alert(message);
    }
  }

  showError(message) {
    if (window.showToast) {
      window.showToast(message, 5000);
    } else {
      alert(message);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.googleAuthFix = new GoogleAuthFix();
  window.googleAuthFix.init();
});
