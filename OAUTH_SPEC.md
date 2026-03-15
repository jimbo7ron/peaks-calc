# Strava OAuth Implementation

## Goal
Replace manual token paste with proper OAuth flow.

## Architecture
1. **Frontend (GitHub Pages)**: Redirects to Strava auth, handles callback
2. **Cloudflare Worker**: Exchanges auth code for tokens (keeps client_secret secure)

## Strava OAuth Credentials
- Client ID: 204111
- Client Secret: 8059a20198866fceeec59a528c823d1d5ba77760

## Flow
1. User clicks "Connect Strava" → redirects to Strava authorization URL
2. User authorizes → Strava redirects to callback URL with `code` param
3. Frontend sends code to Worker → Worker exchanges for access_token
4. Frontend stores token in localStorage, fetches segment data

## Strava Auth URL
```
https://www.strava.com/oauth/authorize?client_id=204111&response_type=code&redirect_uri=https://jimbo7ron.github.io/peaks-calc&scope=read,activity:read&approval_prompt=auto
```

## Token Exchange (Worker)
POST https://www.strava.com/oauth/token
- client_id
- client_secret  
- code (from redirect)
- grant_type=authorization_code

## Files to Create/Modify

### worker/worker.js (Cloudflare Worker)
- POST /token - exchange code for access token
- Handle CORS for GitHub Pages origin

### worker/wrangler.toml
- Worker config for Cloudflare

### app.js changes
- Replace modal token input with OAuth redirect flow
- Handle ?code= param on page load
- Exchange code via worker

### index.html changes  
- Update button text to "Connect Strava"
- Remove manual token modal
- Add loading state during OAuth

## Callback URL
https://jimbo7ron.github.io/peaks-calc (same page, detect ?code= param)

## Worker URL (to be deployed)
https://peaks-oauth.{account}.workers.dev/token
