# OAuth Provider Setup

This guide covers configuring OAuth providers for social authentication.

## Supported Providers

BastionAuth supports the following OAuth providers:

- Google
- GitHub
- Microsoft (Azure AD / Personal)
- Apple
- LinkedIn

## Google OAuth

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Google+ API

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services > OAuth consent screen**
2. Select **External** user type
3. Fill in app information:
   - App name: Your app name
   - User support email
   - Authorized domains
   - Developer contact email

### 3. Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Application type: **Web application**
4. Add authorized redirect URIs:
   ```
   http://localhost:3001/api/v1/auth/oauth/google/callback
   https://your-api.com/api/v1/auth/oauth/google/callback
   ```

### 4. Configure Environment

```env
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

## GitHub OAuth

### 1. Register OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in details:
   - Application name
   - Homepage URL
   - Authorization callback URL:
     ```
     http://localhost:3001/api/v1/auth/oauth/github/callback
     ```

### 2. Get Credentials

Copy the Client ID and generate a Client Secret.

### 3. Configure Environment

```env
GITHUB_CLIENT_ID=Iv1.xxxxx
GITHUB_CLIENT_SECRET=xxxxx
```

## Microsoft OAuth

### 1. Register App in Azure AD

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory > App registrations**
3. Click **New registration**
4. Configure:
   - Name: Your app name
   - Supported account types: Choose appropriately
   - Redirect URI: Web, then:
     ```
     http://localhost:3001/api/v1/auth/oauth/microsoft/callback
     ```

### 2. Configure Permissions

1. Go to **API permissions**
2. Add Microsoft Graph permissions:
   - `User.Read`
   - `email`
   - `profile`
   - `openid`

### 3. Create Client Secret

1. Go to **Certificates & secrets**
2. Create a **New client secret**
3. Copy the value (shown only once)

### 4. Configure Environment

```env
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=xxxxx~xxxxx
MICROSOFT_TENANT_ID=common  # or your tenant ID for single-tenant
```

## Apple Sign In

### 1. Create App ID

1. Go to [Apple Developer](https://developer.apple.com/account/resources/identifiers/list)
2. Create a new **App ID** with Sign in with Apple capability

### 2. Create Service ID

1. Create a new **Services ID**
2. Enable Sign in with Apple
3. Configure domains and return URLs:
   ```
   http://localhost:3001/api/v1/auth/oauth/apple/callback
   ```

### 3. Create Key

1. Create a new **Key**
2. Enable Sign in with Apple
3. Download the `.p8` file

### 4. Configure Environment

```env
APPLE_CLIENT_ID=com.yourcompany.app.service
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey.p8
```

## LinkedIn OAuth

### 1. Create LinkedIn App

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Request access to **Sign In with LinkedIn using OpenID Connect**

### 2. Configure OAuth Settings

1. Go to **Auth** tab
2. Add redirect URLs:
   ```
   http://localhost:3001/api/v1/auth/oauth/linkedin/callback
   ```

### 3. Configure Environment

```env
LINKEDIN_CLIENT_ID=xxxxx
LINKEDIN_CLIENT_SECRET=xxxxx
```

## Testing OAuth Locally

### Using ngrok

For testing OAuth callbacks locally:

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 3001
```

Update your OAuth provider redirect URIs with the ngrok URL.

### Localhost Workarounds

Some providers (like Google) allow `localhost` for development:

```
http://localhost:3001/api/v1/auth/oauth/google/callback
```

## Custom OAuth Provider

To add a custom OAuth provider, extend the OAuth service:

```typescript
// packages/server/src/services/oauth.service.ts

const customProvider = {
  authorizationUrl: 'https://custom.provider.com/oauth/authorize',
  tokenUrl: 'https://custom.provider.com/oauth/token',
  userInfoUrl: 'https://custom.provider.com/api/userinfo',
  scopes: ['email', 'profile'],
  mapUserInfo: (data) => ({
    providerId: data.id,
    email: data.email,
    firstName: data.given_name,
    lastName: data.family_name,
    imageUrl: data.picture,
  }),
};
```

## Security Best Practices

1. **Keep secrets secure** - Never commit OAuth secrets to git
2. **Use environment variables** - Store secrets in environment
3. **Validate redirect URIs** - Use exact match, avoid wildcards
4. **HTTPS in production** - OAuth requires HTTPS for redirect URIs
5. **State parameter** - Always use and validate the state parameter
6. **PKCE** - Use PKCE flow when available

## Troubleshooting

### "Invalid redirect URI"

- Ensure exact match (trailing slashes matter)
- Check for http vs https
- Verify the URL is registered in provider console

### "Access denied"

- Check required scopes are requested
- Verify app permissions in provider console
- Ensure user has granted consent

### "Invalid client"

- Double-check client ID and secret
- Ensure credentials are for correct environment
- Check if secret has expired

### Token Errors

- Verify token endpoint URL
- Check if using correct grant type
- Ensure all required parameters are sent

