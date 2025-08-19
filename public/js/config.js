// Configuration for Google OAuth
const CONFIG = {
  // Backend API base URL
  API_BASE_URL: 'https://techyjaunt-auth-go43.onrender.com',
  
  // Google OAuth Client ID - Update this with your actual client ID
  GOOGLE_CLIENT_ID: '293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com',
  
  // Dynamic redirect URI based on current environment
  getRedirectUri() {
    return `${window.location.origin}/google-callback.html`;
  },
  
  // Get current environment
  getEnvironment() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('netlify.app')) {
      return 'staging';
    } else {
      return 'production';
    }
  },
  
  // Debug logging
  log(message, data = null) {
    console.log(`[Google OAuth Config] ${message}`, data || '');
  }
};

// Export for use in other files
window.APP_CONFIG = CONFIG;
