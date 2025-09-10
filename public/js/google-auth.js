// Google OAuth Configuration and Handler
class GoogleAuthHandler {
  constructor() {
    this.baseUrl = window.APP_CONFIG?.API_BASE_URL || 'https://techyjaunt-auth-go43.onrender.com';
    this.clientId = window.APP_CONFIG?.GOOGLE_CLIENT_ID || '293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com';
    this.redirectUri = window.APP_CONFIG?.getRedirectUri() || `${window.location.origin}/google-callback.html`;
    this.init();

    console.log('Google OAuth Config:', {
      baseUrl: this.baseUrl,
      redirectUri: this.redirectUri,
      clientId: this.clientId,
      environment: window.APP_CONFIG?.getEnvironment() || 'unknown'
    });
  }

  init() {
    this.isPopup = window.opener && window.opener !== window;
    if (!this.isPopup) {
      window.addEventListener('message', this.handleMessage.bind(this));
    }
  }

  async initiateGoogleAuth(mode = 'login') {
    try {
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
    return window.innerWidth > 768 && !window.matchMedia('(pointer: coarse)').matches;
  }

  async fetchAuthUrl(mode) {
    const response = await fetch(`${this.baseUrl}/api/users/google?mode=${mode}`);
    const data = await response.json();
    if (data.authUrl) {
      return data.authUrl;
    } else {
      throw new Error('No authUrl received from server');
    }
  }

  async initiatePopupFlow(mode) {
    try {
      const authUrl = await this.fetchAuthUrl(mode);
      const width = 500, height = 600;
      const left = (window.screenX || window.screenLeft || 0) + (window.innerWidth - width) / 2;
      const top = (window.screenY || window.screenTop || 0) + (window.innerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'google-auth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.log('Popup blocked, falling back to redirect');
        this.initiateRedirectFlow(mode);
        return;
      }

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          console.log('Google popup closed without completion');
        }
      }, 1000);

      return popup;
    } catch (error) {
      console.error('Failed to get auth URL for popup:', error);
      this.initiateRedirectFlow(mode);
    }
  }

  async initiateRedirectFlow(mode) {
    try {
      const authUrl = await this.fetchAuthUrl(mode);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      this.showError('Failed to start Google sign-in. Please try again.');
    }
  }

  handleMessage(event) {
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
      
      const response = await fetch(`${this.baseUrl}/api/users/google/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: authData.code, state: authData.state })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed');
      if (!data.token || !data.user) throw new Error('Invalid response from server');

      // ✅ Unified storage
      this.storeUserData(data);

      const isNewUser = data.user.isNew || false;
      const redirectUrl = isNewUser ? 'verify-email.html' : 'home.html';

      if (this.isPopup) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_COMPLETE', data: { ...data, redirectUrl } }, '*');
        setTimeout(() => window.close(), 100);
      } else {
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
      window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: error }, '*');
      setTimeout(() => window.close(), 100);
    } else {
      this.showError(error);
    }
  }

  storeUserData(data) {
    try {
      // ✅ Match manual login format
      const userObj = {
        id: data.user.id || data.user._id,
        email: data.user.email,
        name: data.user.name || '',
        role: data.user.role || 'user',
        token: data.token
      };

      localStorage.setItem('user', JSON.stringify(userObj));
      localStorage.setItem('token', data.token); // optional backward compat

      console.log('User data stored successfully:', userObj);
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  showError(message) {
    if (typeof showToast === 'function') {
      showToast(message);
    } else {
      alert(message);
    }
  }

  isAuthenticated() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return false;
      const user = JSON.parse(userStr);
      return !!user.token;
    } catch {
      return false;
    }
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
}

window.googleAuth = new GoogleAuthHandler();
window.initiateGoogleLogin = () => window.googleAuth.initiateGoogleAuth('login');
window.initiateGoogleSignup = () => window.googleAuth.initiateGoogleAuth('signup');
