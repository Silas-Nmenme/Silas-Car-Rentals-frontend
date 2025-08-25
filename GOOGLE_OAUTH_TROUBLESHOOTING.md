# Google OAuth Troubleshooting Guide - Silas Car Rental

## Current Issue: redirect_uri_mismatch Error 400

### Problem Description
The Google Sign-In functionality is failing with:
- **Error 400: redirect_uri_mismatch**
- **Popup blocked** in some browsers
- **Dead response** from the OAuth flow

### Root Cause Analysis
1. **Redirect URI Mismatch**: The redirect URI configured in Google Cloud Console doesn't match what's being used in the application
2. **Multiple OAuth Implementations**: There are conflicting Google OAuth implementations in the codebase
3. **Popup Blocking**: Modern browsers block popups by default

### Immediate Fix Required

#### 1. Update Google Cloud Console Configuration

**Go to**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**Add these Authorized Redirect URIs** to your OAuth 2.0 Client ID:
```
http://localhost:5500/google-callback.html
http://127.0.0.1:5500/google-callback.html
https://yourdomain.com/google-callback.html
https://www.yourdomain.com/google-callback.html
```

**Important**: Replace `yourdomain.com` with your actual domain.

#### 2. Verify Current Redirect URI

Open your browser console on the signup page and run:
```javascript
console.log('Current redirect URI:', `${window.location.origin}/google-callback.html`);
```

This should match exactly with what's configured in Google Cloud Console.

### Code Changes Applied

#### ✅ Fixed: Dynamic Redirect URI Detection
The application now automatically detects the correct redirect URI based on the current environment:
- **Local development**: `http://localhost:5500/google-callback.html`
- **Production**: `https://yourdomain.com/google-callback.html`

#### ✅ Enhanced: Popup Handling
- Added popup blocker detection
- Implemented fallback to redirect flow when popup is blocked
- Added proper error handling for COOP (Cross-Origin Opener Policy) issues

#### ✅ Improved: Error Messages
- Clear error messages for users
- Detailed console logging for debugging
- Graceful fallback options

### Testing Checklist

#### Before Testing:
- [ ] Updated Google Cloud Console with correct redirect URIs
- [ ] Cleared browser cache and cookies
- [ ] Disabled browser extensions that might block popups

#### Test Scenarios:
1. **Local Development Test**:
   - [ ] Run `npx serve public` or similar
   - [ ] Access `http://localhost:5500/signup.html`
   - [ ] Click "Continue with Google"
   - [ ] Verify popup opens and works

2. **Popup Blocker Test**:
   - [ ] Enable popup blocker in browser
   - [ ] Test that redirect flow works as fallback

3. **Error Handling Test**:
   - [ ] Deny permissions in Google consent screen
   - [ ] Verify appropriate error message is shown

### Browser-Specific Instructions

#### Chrome:
1. Go to `chrome://settings/content/popups`
2. Add your domain to allowed sites
3. Clear cache: `chrome://settings/clearBrowserData`

#### Firefox:
1. Go to `about:preferences#privacy`
2. Under "Permissions" > "Block pop-up windows", add exception
3. Clear cache: `Ctrl+Shift+Delete`

#### Safari:
1. Safari > Preferences > Websites > Pop-up Windows
2. Allow popups for your domain
3. Clear cache: `Cmd+Option+E`

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `redirect_uri_mismatch` | Add exact redirect URI to Google Cloud Console |
| `popup_blocked` | Enable popups for your domain or use redirect flow |
| `invalid_client` | Verify Client ID matches exactly |
| `access_denied` | Ensure user grants all requested permissions |
| `no_code_received` | Check if popup was closed prematurely |

### Debug Commands

Run these in browser console on the signup page:

```javascript
// Check current configuration
console.log('Redirect URI:', `${window.location.origin}/google-callback.html`);
console.log('Client ID:', '293889215515-658eba7e610fm5hfoetknip83lf2re1s.apps.googleusercontent.com');

// Test popup blocker
const popup = window.open('about:blank', 'test', 'width=500,height=600');
if (!popup) console.log('Popup blocked!');
else popup.close();
```

### Backend Configuration

Ensure your backend is configured to handle the callback:
- **Endpoint**: `POST /api/auth/google/callback`
- **Expected payload**: `{ code: "google_auth_code" }`
- **Response**: `{ token: "jwt_token", user: { ...user_data } }`

### Next Steps

1. **Update Google Cloud Console** with correct redirect URIs
2. **Test the flow** using the testing checklist above
3. **Monitor console logs** for any additional errors
4. **Contact support** if issues persist after following this guide

### Support Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
