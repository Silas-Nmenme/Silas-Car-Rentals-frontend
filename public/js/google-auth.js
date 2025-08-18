/**
 * Perfect Google Sign-In Implementation
 * Handles Google OAuth flow with proper backend integration
 */

class GoogleAuth {
  constructor() {
    this.baseUrl = 'https://techyjaunt-auth-go43.onrender.com';
    this.clientId = '293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com';
    this.redirectUri = `${window.location.origin}/google-callback.html`;
  }

  /**
   * Initialize Google Sign-In
   */
  init() {
    this.setupGoogleButton();
    this.handleCallback();
  }

  /**
   * Setup Google Sign-In button
   */
  setupGoogleButton() {
    const googleBtn = document.querySelector('button[onclick="signInWithGoogle()"]');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => this.signIn());
    }
  }

  /**
   * Main Google Sign-In function
   */
  async signIn() {
    try {
      this.showLoading();

      // Get Google OAuth URL from backend
      const response = await fetch(`${this.baseUrl}/api/users/google`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get Google OAuth URL');
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // Open popup for Google Sign-In
        this.openGooglePopup(data.authUrl);
      } else {
        throw new Error('No auth URL received');
      }

    } catch (error) {
      console.error('Google sign-in error:', error);
      this.showError('Failed to initiate Google sign-in. Please try again.');
      this.hideLoading();
    }
  }

  /**
   * Open Google OAuth popup
   */
  openGooglePopup(authUrl) {
    const popup = window.open(
      authUrl,
      'google-signin',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      this.showError('Popup blocked. Please allow popups for Google sign-in.');
      this.hideLoading();
      return;
    }

    // Listen for messages from popup
    const handleMessage = (event) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        window.removeEventListener('message', handleMessage);
        this.handleGoogleCallback(event.data.code);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        window.removeEventListener('message', handleMessage);
        this.showError('Google sign-in failed: ' + event.data.error);
        this.hideLoading();
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup is closed
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        this.hideLoading();
      }
    }, 1000);
  }

  /**
   * Handle Google callback
   */
  async handleGoogleCallback(code) {
    try {
      this.showLoading('Authenticating...');

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
        throw new Error(data.message || 'Google authentication failed');
      }

      // Store user data
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      this.showSuccess('Successfully signed up with Google!');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);

    } catch (error) {
      console.error('Google callback error:', error);
      this.showError(error.message || 'Authentication failed. Please try again.');
      this.hideLoading();
    }
  }

  /**
   * Handle callback from popup
   */
  handleCallback() {
    // This runs in the popup window
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
            error: error
          }, '*');
        }
      } else if (code) {
        // Send success back to parent
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            code: code,
            state: state
          }, '*');
        }
      }

      window.close();
    }
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
      window.showToast(message);
    } else {
      alert(message);
    }
  }

  showError(message) {
    // Use existing toast system
    if (window.showToast) {
      window.showToast(message);
    } else {
      alert(message);
    }
  }
}

// Initialize Google Auth
document.addEventListener('DOMContentLoaded', () => {
  const googleAuth = new GoogleAuth();
  googleAuth.init();
});
