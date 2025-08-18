# Google OAuth Setup Guide - Fix Redirect URI Mismatch

## Problem
You're experiencing "Error 400: redirect_uri_mismatch" when trying to use Google Sign-In.

## Solution Steps

### 1. Identify Your Current Redirect URI

Your application is trying to use:
- **Redirect URI**: `{your-domain}/google-callback.html`
- **Client ID**: `293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com`

### 2. Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services > Credentials**
3. Find your OAuth 2.0 Client ID: `293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com`
4. Click **Edit** (pencil icon)
5. Under **Authorized redirect URIs**, add these URLs:

#### For Local Development:
```
http://localhost:5500/google-callback.html
http://127.0.0.1:5500/google-callback.html
```

#### For Production:
```
https://yourdomain.com/google-callback.html
https://www.yourdomain.com/google-callback.html
```

### 3. Verify Your Setup

1. **Check your current URL**: Open browser console and run:
   ```javascript
   console.log('Current redirect URI:', `${window.location.origin}/google-callback.html`);
   ```

2. **Test the flow**: After updating Google Cloud Console, test Google Sign-In again.

### 4. Alternative Solutions

If the issue persists:

#### Option A: Use Environment Variables
Create a config file to manage different environments:

```javascript
// config.js
const CONFIG = {
  development: {
    GOOGLE_CLIENT_ID: 'your-dev-client-id',
    REDIRECT_URI: 'http://localhost:5500/google-callback.html'
  },
  production: {
    GOOGLE_CLIENT_ID: 'your-prod-client-id',
    REDIRECT_URI: 'https://yourdomain.com/google-callback.html'
  }
};
```

#### Option B: Dynamic Redirect URI Detection
The code has been updated to automatically detect the correct redirect URI based on the current domain.

### 5. Debugging Steps

1. **Check browser console** for any error messages
2. **Verify the redirect URI** in the OAuth URL
3. **Check Google Cloud Console** for any typos in the redirect URI
4. **Clear browser cache** and try again

### 6. Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| `redirect_uri_mismatch` | Add exact redirect URI to Google Cloud Console |
| Popup blocked | Enable popups for your domain |
| `invalid_client` | Verify Client ID is correct |
| `access_denied` | Ensure user grants permissions |

### 7. Testing Checklist

- [ ] Google Cloud Console updated with correct redirect URIs
- [ ] Client ID matches in code and console
- [ ] No typos in redirect URIs
- [ ] HTTPS used for production URLs
- [ ] Local development URLs added for testing

### 8. Verification Script

Add this to your browser console to verify the setup:

```javascript
// Check current configuration
console.log('CurrentThe changes to the `public/signup.html` file have been successfully applied. The redirect URI is now dynamically constructed based on the current origin, which should help prevent the "redirect_uri_mismatch" error.

### Summary of Changes Made:
- Updated the Google OAuth implementation to dynamically construct the redirect URI using the current protocol, hostname, and port.
- Added a console log to display the redirect URI being used for debugging purposes.

### Next Steps:
1. **Update Google Cloud Console**: Ensure that the redirect URI you are using in the application is added to the Google Cloud Console as an authorized redirect URI.
2. **Test the Sign-Up Process**: After updating the Google Cloud Console, test the sign-up process again to see if the issue is resolved.

If you need further modifications or assistance, please let me know!
