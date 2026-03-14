// Use getters to ensure values are read AFTER dotenv.config() runs
// (ES module imports are hoisted, so static values would be empty)
export const ENV = {
  get appId() { return process.env.VITE_APP_ID ?? ""; },
  get cookieSecret() { return process.env.JWT_SECRET ?? ""; },
  get databaseUrl() { return process.env.DATABASE_URL ?? ""; },
  get oAuthServerUrl() { return process.env.OAUTH_SERVER_URL ?? ""; },
  get ownerOpenId() { return process.env.OWNER_OPEN_ID ?? ""; },
  get isProduction() { return process.env.NODE_ENV === "production"; },
  get forgeApiUrl() { return process.env.BUILT_IN_FORGE_API_URL ?? ""; },
  get forgeApiKey() { return process.env.BUILT_IN_FORGE_API_KEY ?? ""; },
  get grokApiKey() { return process.env.GROK_API_KEY ?? ""; },
  get geminiApiKey() { return process.env.GEMINI_API_KEY ?? ""; },
  // vLLM configuration for local style analysis
  get vllmBaseUrl() { return process.env.VLLM_BASE_URL ?? "http://localhost:8080"; },
  get vllmModel() { return process.env.VLLM_MODEL ?? "google/gemma-3-4b-it"; },
};
