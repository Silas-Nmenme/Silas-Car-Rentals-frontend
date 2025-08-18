/**
 * OAuth Configuration Test Script
 * Run this in browser console to verify Google OAuth setup
 */

class OAuthTester {
  constructor() {
    this.clientId = '293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com';
    this.redirectUri = `${window.location.origin}/google-callback.html`;
    this.baseUrl = 'https://techyjaunt-auth-go43.onrender.com';
  }

  runAllTests() {
    console.log('🔍 Running Google OAuth Configuration Tests...\n');
    
    this.testRedirectUri();
    this.testPopupSupport();
    this.testBackendConnection();
    this.generateTestUrls();
  }

  testRedirectUri() {
    console.log('📍 Redirect URI Configuration:');
    console.log('Current Redirect URI:', this.redirectUri);
    console.log('Expected in Google Cloud Console:', this.redirectUri);
    console.log('Copy this exact URI to Google Cloud Console\n');
  }

  testPopupSupport() {
    console.log('Popup Support Test:');
    
    const popup = window.open('', 'oauth-test', 'width=500,height=600');
    if (!popup || popup.closed) {
      console.log('Popup blocked - redirect flow will be used');
      console.log('Enable popups for this domain or use redirect flow');
    } else {
      console.log('Popup supported');
      popup.close();
    }
    console.log('');
  }

  async testBackendConnection() {
    console.log('Backend Connection Test:');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/users/google`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('Backend reachable');
        const data = await response.json();
        console.log('Backend response:', data);
      } else {
        console.log('Backend error:', response.status);
      }
    } catch (error) {
      console.log('Backend connection failed:', error.message);
    }
    console.log('');
  }

  generateTestUrls() {
    console.log(' Test URLs to add to Google Cloud Console:');
    console.log('Local Development:');
    console.log(`  ${this.redirectUri}`);
    console.log('Production:');
    console.log(`  https://yourdomain.com/google-callback.html`);
    console.log(`  https://www.yourdomain.com/google-callback.html\n`);
  }

  generateOAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: 'test_' + Date.now()
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  testManualFlow() {
    const authUrl = this.generateOAuthUrl();
    console.log('🔗Manual Test URL:');
    console.log('Copy and paste this URL in browser:');
    console.log(authUrl);
    console.log('\nAfter authorization, you should be redirected to:');
    console.log(this.redirectUri);
  }
}

// Create global tester instance
window.oauthTester = new OAuthTester();

// Quick test function
window.runOAuthTests = () => window.oauthTester.runAllTests();

// Manual test function
window.testManualOAuth = () => window.oauthTester.testManualFlow();

console.log('OAuth Tester loaded!');
console.log('Run tests: runOAuthTests()');
console.log('Manual test: testManualOAuth()');
