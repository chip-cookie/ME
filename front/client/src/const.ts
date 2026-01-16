export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// For local auth, we use /login page instead of external OAuth
export const getLoginUrl = () => {
  return "/login";
};

// Legacy OAuth URL generation (kept for reference if external OAuth is needed later)
export const getOAuthLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
