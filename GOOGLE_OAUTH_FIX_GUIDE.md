# Google OAuth Redirect URI Fix Guide

## Problem Summary
You're experiencing "Error 400: redirect_uri_mismatch" when trying to use Google Sign-In. The issue is that the redirect URI configured in Google Cloud Console doesn't match what's being used by your application.

## Root Cause
The backend server (`https://techyjaunt-auth-go43.onrender.com`) is generating OAuth URLs with redirect URIs that don't match your frontend domain. The current setup is trying to redirect to `http://localhost:4500/api/auth/google/callback` instead of your actual frontend callback URL.

## Solution Steps

### 1. Update Google Cloud Console Configuration

**Go to**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**Find your OAuth 2.0 Client ID**: `293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com`

**Add these Authorized Redirect URIs**:

#### For Production (Netlify):
```
https://silascarrentals.netlify.app/google-callback.html
```

#### For Local Development:
```
http://localhost:5500/google-callback.html
http://127.0.0.1:5500/google-callback.html
```

### 2. Verify Current Configuration

Open your browser console on the signup/login page and run:
```javascript
console.log('Current redirect URI:', `${window.location.origin}/google-callback.html`);
```

### 3. Test the Updated Flow

1. **Clear browser cache** and cookies
2. **Test Google Sign-In** from both signup.html and login.html
3. **Check browser console** for any error messages

### 4. Backend Configuration (Important)

Your backend needs to be updated to use the correct redirect URI. Contact your backend developer or check if the backend supports dynamic redirect URIs.

**Expected backend endpoint**: `POST /api/auth/google/callback`
**Expected payload**: `{ code: "google_auth_code", redirectUri: "https://yourdomain.com/google-callback.html" }`

### 5. Debug Commands

Run these in browser console:

```javascript
// Check current configuration
console.log('Environment:', window.APP_CONFIG?.getEnvironment());
console.log('Redirect URI:', window.APP_CONFIG?.getRedirectUri());
console.log('Client ID:', window.APP_CONFIG?.GOOGLE_CLIENT_ID);

// Test popup blocker
const popup = window.open('about:blank', 'test', 'width=500,height=600');
if (!popup) console.log('Popup blocked - will use redirect flow');
```

### 6. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `redirect_uri_mismatch` | Add exact redirect URI to Google Cloud Console |
| Popup blocked | Enable popups for your domain or use redirect flow |
| `invalid_client` | Verify Client ID matches exactly |
| `access_denied` | Ensure user grants all requested permissions |

### 7. Testing Checklist

- [ ] Google Cloud Console updated with correct redirect URIs
- [ ] Client ID matches in code and console
- [ ] No typos in redirect URIs
- [ ] HTTPS used for production URLs
- [ ] Local development URLs added for testing

### 8. Next Steps

1. **Update Google Cloud Console** with the correct redirect URIs
2. **Test the flow** using the testing checklist above
3. **Monitor console logs** for any additional errors
4. **Contact backend developer** if redirect URI needs to be configured on the server side

### 9. Emergency Fallback

If the issue persists, you can use a direct redirect approach:

```javascript
// Instead of popup, use direct redirect
function handleGoogleAuth(mode) {
  const redirectUri = encodeURIComponent(`${window.location.origin}/google-callback.html`);
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com&redirect_uri=${redirectUri}&response_type=code&scope=email profile`;
  window.location.href = authUrl;
}
```

## Support Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
